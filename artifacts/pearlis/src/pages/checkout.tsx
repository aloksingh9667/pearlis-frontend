import { useState, useCallback, useEffect } from "react";
import { useGetCart, useCreateOrder } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Tag, CheckCircle2, Truck, Shield, CreditCard, Banknote, MapPin } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { motion, AnimatePresence } from "framer-motion";
import { useGetSettings } from "@/lib/adminApi";
import { useAuth } from "@/contexts/AuthContext";
import { apiUrl } from "@/lib/apiUrl";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const INR = (usd: number) => Math.round(usd * 83);
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

async function validateCoupon(code: string, subtotalINR: number) {
  const res = await fetch(apiUrl(`/api/coupons/validate`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotal: subtotalINR / 83 }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Invalid coupon");
  return res.json() as Promise<{ valid: boolean; discountType: string; discountValue: number; discount: number; message: string }>;
}

type SavedAddress = {
  id: number; name: string; line1: string; line2?: string;
  city: string; state: string; postalCode: string; country: string; phone: string; isDefault?: boolean;
};

export default function Checkout() {
  const { data: cart, isLoading: cartLoading } = useGetCart();
  const { data: settings } = useGetSettings();
  const { user } = useAuth();
  const createOrder = useCreateOrder();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "India", phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">("cod");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<null | { code: string; discount: number; message: string }>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    fetch(apiUrl("/api/users/addresses"), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error("unauth"); return r.json(); })
      .then((data: SavedAddress[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setSavedAddresses(data);
          const def = data.find(a => a.isDefault) || data[0];
          setSelectedAddrId(def.id);
          setForm({
            name: def.name || "",
            line1: def.line1 || "",
            line2: def.line2 || "",
            city: def.city || "",
            state: def.state || "",
            postalCode: def.postalCode || "",
            country: def.country || "India",
            phone: def.phone || "",
          });
        }
      })
      .catch(() => {});
  }, [user]);

  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddrId(addr.id);
    setForm({
      name: addr.name || "",
      line1: addr.line1 || "",
      line2: addr.line2 || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.postalCode || "",
      country: addr.country || "India",
      phone: addr.phone || "",
    });
  };

  const codEnabled = settings?.payment?.codEnabled !== false;
  const razorpayEnabled = settings?.payment?.razorpayEnabled === true;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [e.target.id]: e.target.value }));

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const subtotalINR = cart ? INR(cart.subtotal) : 0;
      const result = await validateCoupon(couponCode.trim().toUpperCase(), subtotalINR);
      const discountINR = INR(result.discount);
      setCouponApplied({ code: couponCode.trim().toUpperCase(), discount: discountINR, message: result.message });
      toast({ title: "Coupon Applied!", description: result.message });
    } catch (err: any) {
      toast({ title: "Invalid Coupon", description: err.message, variant: "destructive" });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
  };

  const subtotalINR = cart ? INR(cart.subtotal) : 0;
  const discountINR = couponApplied?.discount || 0;
  const totalINR = Math.max(0, subtotalINR - discountINR);

  const placeOrderDirectly = useCallback((extraData?: Record<string, any>) => {
    createOrder.mutate(
      { data: { shippingAddress: form, paymentMethod, couponCode: couponApplied?.code, ...extraData } },
      {
        onSuccess: (order: any) => {
          toast({ title: "Order Placed!", description: "Your order has been confirmed." });
          setLocation(`/order/${order.id}`);
        },
        onError: () => {
          toast({ title: "Checkout Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
        },
      }
    );
  }, [form, paymentMethod, couponApplied, createOrder, toast, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.line1 || !form.city || !form.state || !form.postalCode || !form.phone) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    if (paymentMethod === "razorpay") {
      setRazorpayLoading(true);
      try {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          toast({ title: "Payment Error", description: "Could not load payment gateway. Check your connection.", variant: "destructive" });
          setRazorpayLoading(false);
          return;
        }

        // Get Razorpay config (key ID)
        const cfgRes = await fetch(apiUrl("/api/razorpay/config"));
        const cfg = await cfgRes.json();
        if (!cfg.enabled) {
          toast({ title: "Razorpay not configured", description: "Please contact support.", variant: "destructive" });
          setRazorpayLoading(false);
          return;
        }

        // Create Razorpay order on backend
        const orderRes = await fetch(apiUrl("/api/razorpay/create-order"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountINR: totalINR, receipt: `cart_${Date.now()}` }),
        });
        const rzpOrder = await orderRes.json();
        if (!rzpOrder.orderId) {
          toast({ title: "Payment Error", description: "Could not initiate payment.", variant: "destructive" });
          setRazorpayLoading(false);
          return;
        }

        setRazorpayLoading(false);

        // Open Razorpay modal
        const options = {
          key: cfg.keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: "Pearlis",
          description: "Fine Jewellery",
          image: "/logo.png",
          order_id: rzpOrder.orderId,
          prefill: { name: form.name, contact: form.phone },
          theme: { color: "#D4AF37" },
          handler: async (response: any) => {
            // Verify payment
            const verRes = await fetch(apiUrl("/api/razorpay/verify"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const ver = await verRes.json();
            if (!ver.valid) {
              toast({ title: "Payment Verification Failed", description: "Please contact support.", variant: "destructive" });
              return;
            }
            // Create order in our system
            placeOrderDirectly({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
            });
          },
          modal: {
            ondismiss: () => {
              toast({ title: "Payment Cancelled", description: "You cancelled the payment.", variant: "destructive" });
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch {
        toast({ title: "Payment Error", description: "Something went wrong.", variant: "destructive" });
        setRazorpayLoading(false);
      }
      return;
    }

    placeOrderDirectly();
  };

  useEffect(() => {
    if (!cartLoading && (!cart || cart.items.length === 0)) {
      setLocation("/cart");
    }
  }, [cart, cartLoading, setLocation]);

  useEffect(() => {
    if (!cartLoading && !user) {
      setLocation("/sign-in?redirect=/checkout");
    }
  }, [user, cartLoading, setLocation]);

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 pb-24">
        <div className="container mx-auto px-4 max-w-7xl pt-24">
          <BackButton className="mb-4" />
          {/* Header */}
          <div className="py-10 border-b border-border mb-10">
            <h1 className="font-serif text-3xl md:text-4xl">Checkout</h1>
            <p className="text-muted-foreground text-sm mt-2 uppercase tracking-widest">Secure & Encrypted</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 xl:gap-20">
            {/* LEFT — Form */}
            <form id="checkout-form" onSubmit={handleSubmit} className="lg:w-[55%] space-y-10">
              {/* Shipping */}
              <section>
                <h2 className="font-serif text-2xl mb-6 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">1</span>
                  Shipping Details
                </h2>

                {/* Saved addresses – only shown when logged in and addresses exist */}
                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <p className="uppercase tracking-widest text-xs text-muted-foreground mb-3 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> Saved Addresses
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {savedAddresses.map(addr => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleSelectAddress(addr)}
                          className={`text-left p-4 border transition-colors ${
                            selectedAddrId === addr.id
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-accent/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{addr.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />
                                {addr.city}, {addr.state} – {addr.postalCode}
                              </p>
                              {addr.phone && (
                                <p className="text-xs text-muted-foreground mt-0.5">{addr.phone}</p>
                              )}
                            </div>
                            {selectedAddrId === addr.id && (
                              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                            )}
                          </div>
                          {addr.isDefault && (
                            <span className="mt-2 inline-block text-[10px] uppercase tracking-widest text-accent border border-accent px-1.5 py-0.5">Default</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Or edit the fields below to use a different address.</p>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="uppercase tracking-widest text-xs text-muted-foreground">Full Name *</Label>
                    <Input id="name" required value={form.name} onChange={handleChange} className="rounded-none h-12 border-border focus:border-accent" placeholder="Rahul Sharma" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="line1" className="uppercase tracking-widest text-xs text-muted-foreground">Address Line 1 *</Label>
                    <Input id="line1" required value={form.line1} onChange={handleChange} className="rounded-none h-12 border-border" placeholder="House/Flat No., Building, Street" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="line2" className="uppercase tracking-widest text-xs text-muted-foreground">Address Line 2</Label>
                    <Input id="line2" value={form.line2} onChange={handleChange} className="rounded-none h-12 border-border" placeholder="Area, Locality (Optional)" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="uppercase tracking-widest text-xs text-muted-foreground">City *</Label>
                      <Input id="city" required value={form.city} onChange={handleChange} className="rounded-none h-12 border-border" placeholder="Mumbai" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="uppercase tracking-widest text-xs text-muted-foreground">State *</Label>
                      <Input id="state" required value={form.state} onChange={handleChange} className="rounded-none h-12 border-border" placeholder="Maharashtra" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="uppercase tracking-widest text-xs text-muted-foreground">PIN Code *</Label>
                      <Input id="postalCode" required value={form.postalCode} onChange={handleChange} className="rounded-none h-12 border-border" placeholder="400001" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country" className="uppercase tracking-widest text-xs text-muted-foreground">Country</Label>
                      <Input id="country" value={form.country} onChange={handleChange} className="rounded-none h-12 border-border" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="uppercase tracking-widest text-xs text-muted-foreground">Phone Number *</Label>
                    <Input id="phone" type="tel" required value={form.phone} onChange={handleChange} className="rounded-none h-12 border-border" placeholder="+91 98765 43210" />
                  </div>
                </div>
              </section>

              {/* Payment */}
              <section>
                <h2 className="font-serif text-2xl mb-6 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">2</span>
                  Payment Method
                </h2>
                <div className="space-y-3">
                  {codEnabled && (
                    <motion.div
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setPaymentMethod("cod")}
                      className={`flex items-center gap-4 p-5 border-2 cursor-pointer transition-all ${paymentMethod === "cod" ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === "cod" ? "border-accent" : "border-muted-foreground"}`}>
                        {paymentMethod === "cod" && <div className="w-3 h-3 rounded-full bg-accent" />}
                      </div>
                      <Banknote className="w-6 h-6 text-accent flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm uppercase tracking-wider">Cash on Delivery</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Pay when your order arrives</p>
                      </div>
                      {paymentMethod === "cod" && <CheckCircle2 className="w-5 h-5 text-accent ml-auto" />}
                    </motion.div>
                  )}

                  {razorpayEnabled && (
                    <motion.div
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setPaymentMethod("razorpay")}
                      className={`flex items-center gap-4 p-5 border-2 cursor-pointer transition-all ${paymentMethod === "razorpay" ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === "razorpay" ? "border-accent" : "border-muted-foreground"}`}>
                        {paymentMethod === "razorpay" && <div className="w-3 h-3 rounded-full bg-accent" />}
                      </div>
                      <CreditCard className="w-6 h-6 text-accent flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm uppercase tracking-wider">Pay Online (Razorpay)</p>
                        <p className="text-xs text-muted-foreground mt-0.5">UPI, Cards, Net Banking & Wallets</p>
                      </div>
                      {paymentMethod === "razorpay" && <CheckCircle2 className="w-5 h-5 text-accent ml-auto" />}
                    </motion.div>
                  )}

                  {!codEnabled && !razorpayEnabled && (
                    <div className="p-5 border border-border text-center text-muted-foreground text-sm">
                      No payment methods configured. Please contact support.
                    </div>
                  )}
                </div>
              </section>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-6 pt-4 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-accent" /> Free shipping above ₹5,000</div>
                <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-accent" /> Secure & encrypted checkout</div>
              </div>
            </form>

            {/* RIGHT — Order Summary */}
            <div className="lg:w-[45%]">
              <div className="bg-muted/20 border border-border p-7 sticky top-32">
                <h2 className="font-serif text-2xl mb-7">Order Summary</h2>

                {/* Items */}
                <div className="space-y-5 mb-7 max-h-72 overflow-y-auto pr-1">
                  {cart.items.map((item: any) => (
                    <div key={item.productId} className="flex gap-4 items-start">
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover bg-muted"
                        />
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent text-accent-foreground rounded-full text-xs flex items-center justify-center font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-sm leading-tight truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{item.product.material || item.product.category}</p>
                      </div>
                      <p className="text-sm font-medium flex-shrink-0">
                        {fmt(INR((item.product.discountPrice || item.product.price) * item.quantity))}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="mb-7">
                  <AnimatePresence mode="wait">
                    {couponApplied ? (
                      <motion.div
                        key="applied"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center justify-between bg-accent/10 border border-accent/30 px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-accent" />
                          <span className="text-sm font-mono font-medium text-accent uppercase">{couponApplied.code}</span>
                          <span className="text-xs text-accent ml-1">— {couponApplied.message}</span>
                        </div>
                        <button onClick={handleRemoveCoupon} className="text-xs text-muted-foreground hover:text-destructive underline transition-colors">Remove</button>
                      </motion.div>
                    ) : (
                      <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                        <div className="flex-1 relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
                            placeholder="COUPON CODE"
                            className="rounded-none h-11 pl-9 font-mono tracking-widest text-sm border-border uppercase"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="rounded-none h-11 px-5 uppercase tracking-widest text-xs border-border hover:border-accent hover:text-accent"
                        >
                          {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Totals */}
                <div className="border-t border-border pt-6 space-y-3 text-sm mb-7">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{fmt(subtotalINR)}</span>
                  </div>
                  {discountINR > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-between text-accent font-medium"
                    >
                      <span>Discount</span>
                      <span>— {fmt(discountINR)}</span>
                    </motion.div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className={subtotalINR >= 5000 ? "text-green-600" : ""}>
                      {subtotalINR >= 5000 ? "Free" : fmt(99)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-4 flex justify-between font-serif text-xl">
                    <span>Total</span>
                    <span className="text-accent">{fmt(totalINR)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  form="checkout-form"
                  className="w-full rounded-none tracking-widest uppercase h-14 text-sm font-medium"
                  disabled={createOrder.isPending || (!codEnabled && !razorpayEnabled)}
                >
                  {createOrder.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `Place Order — ${fmt(totalINR)}`
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" /> Your information is secure
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
