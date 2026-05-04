import { useState, useEffect, useRef } from "react";
import { useGetOrder } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  Loader2, CheckCircle2, Package, Truck, Star,
  Search, ArrowRight, MapPin, CreditCard, Phone,
  RotateCcw, ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const INR_RATE = 83;
const fmtINR = (usd: number) => "₹" + Math.round(usd * INR_RATE).toLocaleString("en-IN");

const STEPS = [
  { key: "pending",   label: "Order Placed",  sub: "We received your order",      Icon: CheckCircle2 },
  { key: "confirmed", label: "Confirmed",      sub: "Seller confirmed your order",  Icon: Star },
  { key: "shipped",   label: "Shipped",        sub: "Your order is on its way",     Icon: Truck },
  { key: "delivered", label: "Delivered",      sub: "Enjoy your jewellery",         Icon: Package },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 0, confirmed: 1, shipped: 2, delivered: 3,
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Order Placed", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  confirmed: { label: "Confirmed",    cls: "bg-blue-50 text-blue-700 border-blue-200" },
  shipped:   { label: "Shipped",      cls: "bg-purple-50 text-purple-700 border-purple-200" },
  delivered: { label: "Delivered",    cls: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled",    cls: "bg-red-50 text-red-700 border-red-200" },
};

function OrderStepper({ status }: { status: string }) {
  const activeIdx = STATUS_ORDER[status] ?? 0;
  if (status === "cancelled") {
    return (
      <div className="bg-red-50 border border-red-200 px-6 py-6 text-center">
        <p className="text-red-700 font-bold tracking-widest uppercase text-sm">Order Cancelled</p>
        <p className="text-red-500 text-xs mt-1">Please contact support if you need assistance.</p>
      </div>
    );
  }
  return (
    <div className="relative flex items-start justify-between">
      <div className="absolute top-[18px] left-0 right-0 h-[2px] bg-[#E8E2D9] z-0" />
      <div
        className="absolute top-[18px] left-0 h-[2px] bg-[#D4AF37] z-0 transition-all duration-700"
        style={{ width: activeIdx === 0 ? "0%" : `${(activeIdx / (STEPS.length - 1)) * 100}%` }}
      />
      {STEPS.map((step, i) => {
        const done   = i < activeIdx;
        const active = i === activeIdx;
        return (
          <div key={step.key} className="relative z-10 flex flex-col items-center flex-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
              done    ? "bg-[#D4AF37] border-[#D4AF37] text-white" :
              active  ? "bg-white border-[#D4AF37] text-[#D4AF37]" :
                        "bg-white border-[#D4AF37]/20 text-[#0F0F0F]/20"
            }`}>
              {done
                ? <CheckCircle2 className="w-4 h-4" fill="white" strokeWidth={0} />
                : <step.Icon className="w-4 h-4" />}
            </div>
            <div className="mt-3 text-center hidden sm:block">
              <p className={`text-[11px] font-bold tracking-[0.12em] uppercase ${
                active ? "text-[#D4AF37]" : done ? "text-[#0F0F0F]" : "text-[#0F0F0F]/25"
              }`}>{step.label}</p>
              <p className={`text-[10px] mt-0.5 ${
                active ? "text-[#0F0F0F]/55" : done ? "text-[#0F0F0F]/40" : "text-[#0F0F0F]/15"
              }`}>{step.sub}</p>
            </div>
            <p className={`mt-2 text-[10px] font-bold tracking-wide text-center sm:hidden ${
              active ? "text-[#D4AF37]" : done ? "text-[#0F0F0F]/60" : "text-[#0F0F0F]/20"
            }`}>{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function OrderResult({ orderId, onReset }: { orderId: number; onReset: () => void }) {
  const { data: order, isLoading, isError, dataUpdatedAt } = useGetOrder(orderId, {
    query: { enabled: orderId > 0, refetchInterval: 30_000, retry: 1 },
  });

  const badge  = order ? (STATUS_BADGE[order.status] ?? { label: order.status, cls: "bg-gray-50 text-gray-600 border-gray-200" }) : null;
  const addr   = order ? (order.shippingAddress as any) : null;
  const subtotalINR = order ? Math.round((order.subtotal ?? order.total) * INR_RATE) : 0;
  const discountINR = order?.discount ? Math.round(order.discount * INR_RATE) : 0;
  const shippingINR = subtotalINR >= 5000 ? 0 : 99;
  const totalINR    = subtotalINR - discountINR + shippingINR;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
        <p className="text-[11px] tracking-[0.25em] uppercase text-[#0F0F0F]/40">Looking up your order…</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-red-200 p-10 text-center">
        <Package className="w-10 h-10 text-red-300 mx-auto mb-4" />
        <p className="font-serif text-xl text-[#0F0F0F]/60 mb-1">Order not found</p>
        <p className="text-sm text-[#0F0F0F]/35 mb-6">Please double-check your order number and try again.</p>
        <button onClick={onReset}
          className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#D4AF37] border-b border-[#D4AF37]/40 hover:border-[#D4AF37] transition-colors pb-0.5">
          Try another order
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="space-y-5">

      {/* Order header */}
      <div className="bg-white border border-[#D4AF37]/15 shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[9px] tracking-[0.35em] uppercase text-[#0F0F0F]/35 font-semibold">Order Number</p>
          <p className="font-serif text-2xl text-[#0F0F0F] mt-0.5">#{order.id.toString().padStart(6, "0")}</p>
          <p className="text-[11px] text-[#0F0F0F]/40 mt-1 tracking-wide">
            Placed {format(new Date(order.createdAt), "d MMMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {badge && (
            <span className={`text-[10px] tracking-[0.2em] uppercase font-bold px-4 py-2 border ${badge.cls}`}>
              {badge.label}
            </span>
          )}
          <Link href={`/order/${order.id}`}
            className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-bold text-[#D4AF37] border border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 px-4 py-2 transition-all">
            Full Details <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white border border-[#D4AF37]/15 shadow-sm p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[9px] tracking-[0.3em] uppercase text-[#D4AF37] font-bold">Tracking Status</p>
          {dataUpdatedAt > 0 && (
            <p className="text-[9px] tracking-[0.2em] text-[#0F0F0F]/30 uppercase">
              Updated {format(new Date(dataUpdatedAt), "h:mm a")} · Auto-refreshes every 30s
            </p>
          )}
        </div>
        <OrderStepper status={order.status} />
      </div>

      {/* Items */}
      <div className="bg-white border border-[#D4AF37]/15 shadow-sm">
        <div className="px-6 py-4 border-b border-[#D4AF37]/10">
          <p className="text-[9px] tracking-[0.3em] uppercase text-[#D4AF37] font-bold">
            Items ({order.items.length})
          </p>
        </div>
        <div className="divide-y divide-[#D4AF37]/8">
          {order.items.map((item: any, i: number) => (
            <div key={i} className="flex gap-4 p-5 items-center">
              <div className="w-14 h-[72px] flex-shrink-0 bg-[#FAF8F3] overflow-hidden border border-[#D4AF37]/10">
                <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-sm text-[#0F0F0F] leading-snug line-clamp-2">{item.productName}</p>
                <p className="text-[11px] text-[#0F0F0F]/40 mt-1">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold text-sm text-[#0F0F0F] flex-shrink-0">{fmtINR(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        {/* Totals */}
        <div className="px-6 pb-5 pt-2 border-t border-[#D4AF37]/8 space-y-2">
          <div className="flex justify-between text-sm text-[#0F0F0F]/50">
            <span>Subtotal</span><span>{fmtINR(order.subtotal ?? order.total)}</span>
          </div>
          {discountINR > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span>-₹{discountINR.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-[#0F0F0F]/50">
            <span>Delivery</span>
            <span className={shippingINR === 0 ? "text-green-600 font-medium" : ""}>
              {shippingINR === 0 ? "FREE" : `₹${shippingINR}`}
            </span>
          </div>
          <div className="flex justify-between font-bold text-base text-[#0F0F0F] pt-2 border-t border-[#D4AF37]/15">
            <span>Total</span><span className="text-[#D4AF37]">₹{totalINR.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Bottom row: payment + address */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Payment */}
        <div className="bg-white border border-[#D4AF37]/15 shadow-sm">
          <div className="px-5 py-4 border-b border-[#D4AF37]/10">
            <p className="text-[9px] tracking-[0.3em] uppercase text-[#D4AF37] font-bold">Payment</p>
          </div>
          <div className="p-5 flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#0F0F0F] capitalize">
                {order.paymentMethod === "cod" ? "Cash on Delivery" :
                 order.paymentMethod === "razorpay" ? "Razorpay (Online)" :
                 order.paymentMethod || "Online"}
              </p>
              <p className={`text-[10px] tracking-widest uppercase mt-0.5 ${
                order.paymentStatus === "paid" ? "text-green-600" :
                order.paymentStatus === "pending" && order.paymentMethod === "cod" ? "text-yellow-600" :
                "text-[#0F0F0F]/40"
              }`}>
                {order.paymentStatus === "pending" && order.paymentMethod === "cod"
                  ? "Pay on delivery"
                  : order.paymentStatus || "pending"}
              </p>
            </div>
          </div>
        </div>

        {/* Address */}
        {addr && (
          <div className="bg-white border border-[#D4AF37]/15 shadow-sm">
            <div className="px-5 py-4 border-b border-[#D4AF37]/10">
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#D4AF37] font-bold">Delivery Address</p>
            </div>
            <div className="p-5 flex gap-3">
              <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#0F0F0F]/65 space-y-0.5 leading-relaxed">
                <p className="font-semibold text-[#0F0F0F]">{addr.name}</p>
                {addr.phone && (
                  <p className="flex items-center gap-1.5 text-[11px]">
                    <Phone className="w-3 h-3" /> {addr.phone}
                  </p>
                )}
                <p>{addr.line1}</p>
                {addr.line2 && <p>{addr.line2}</p>}
                <p>{addr.city}, {addr.state} – {addr.postalCode}</p>
                <p>{addr.country || "India"}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button onClick={onReset}
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-bold text-[#0F0F0F]/40 hover:text-[#D4AF37] transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> Track another order
        </button>
        <Link href="/shop"
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-bold text-white bg-[#0F0F0F] hover:bg-[#D4AF37] px-8 py-3 transition-colors">
          Continue Shopping <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function TrackOrder() {
  const [input, setInput]   = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Support ?order=123 deep-link
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("order") || "");
    if (id > 0) setOrderId(id);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(input.trim());
    if (id > 0) setOrderId(id);
  };

  const handleReset = () => {
    setOrderId(null);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
      <Navbar />

      {/* Hero banner */}
      <div className="bg-[#0F0F0F] pt-24 pb-10">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-[9px] tracking-[0.4em] uppercase text-[#D4AF37] font-bold mb-2">Pearlis</p>
            <h1 className="font-serif text-3xl md:text-4xl text-white">Track Your Order</h1>
            <p className="text-[#FFFFFF]/40 text-sm mt-2">Enter your order number to see real-time status updates.</p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto px-4 md:px-8 w-full py-10">

        {/* Search form */}
        <AnimatePresence mode="wait">
          {!orderId && (
            <motion.form key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              onSubmit={handleSubmit}
              className="bg-white border border-[#D4AF37]/15 shadow-sm p-8 mb-8">
              <p className="text-[9px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold mb-5">Enter Order Number</p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F0F0F]/25 pointer-events-none" />
                  <Input
                    ref={inputRef}
                    type="number"
                    min="1"
                    placeholder="e.g. 000042"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="pl-10 rounded-none border-[#D4AF37]/20 focus-visible:ring-[#D4AF37]/30 text-[#0F0F0F] placeholder:text-[#0F0F0F]/25 h-11"
                    autoFocus
                  />
                </div>
                <Button type="submit"
                  className="rounded-none bg-[#D4AF37] hover:bg-[#C4A030] text-white text-[10px] tracking-[0.2em] uppercase font-bold h-11 px-6">
                  Track
                </Button>
              </div>
              <p className="text-[10px] text-[#0F0F0F]/30 mt-4">
                Your order number is in the confirmation email we sent you, or visible in{" "}
                <Link href="/orders" className="text-[#D4AF37] hover:underline">My Orders</Link>.
              </p>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Result */}
        {orderId && orderId > 0 && (
          <OrderResult key={orderId} orderId={orderId} onReset={handleReset} />
        )}

        {/* Info cards (shown only when no order is being tracked) */}
        {!orderId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Package,      title: "Order Placed",  desc: "We receive and verify your order details immediately." },
              { icon: Star,         title: "Confirmed",      desc: "Our team confirms availability and prepares your jewellery." },
              { icon: Truck,        title: "Shipped",        desc: "Your order is dispatched and on its way to you." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white border border-[#D4AF37]/12 p-5 text-center">
                <div className="w-9 h-9 bg-[#D4AF37]/8 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#0F0F0F] mb-1">{title}</p>
                <p className="text-[11px] text-[#0F0F0F]/45 leading-relaxed">{desc}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
