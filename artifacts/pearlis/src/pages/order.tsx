import { useRoute, Link } from "wouter";
import { useGetOrder } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { format } from "date-fns";
import { Loader2, CheckCircle2, Circle, Package, Truck, Star, ArrowLeft, Printer, MapPin, CreditCard, Phone, Mail, RotateCcw, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { apiUrl } from "@/lib/apiUrl";

/* ── Price helpers ── */
const INR_RATE = 83;
const toINR = (usd: number) => Math.round(usd * INR_RATE);
const fmtINR = (usd: number) =>
  "₹" + toINR(usd).toLocaleString("en-IN");

/* ── Status stepper config ── */
const STEPS = [
  { key: "pending",   label: "Order Placed",  sub: "We received your order",     Icon: CheckCircle2 },
  { key: "confirmed", label: "Confirmed",      sub: "Seller confirmed your order", Icon: Star },
  { key: "shipped",   label: "Shipped",        sub: "Your order is on its way",    Icon: Truck },
  { key: "delivered", label: "Delivered",      sub: "Order delivered",             Icon: Package },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 0, confirmed: 1, shipped: 2, delivered: 3,
};
const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  shipped:   "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const RETURN_REASONS = [
  "Defective / damaged product",
  "Wrong item received",
  "Size or fit issue",
  "Product not as described",
  "Changed my mind",
  "Other",
];

function OrderStepper({ status }: { status: string }) {
  const activeIdx = STATUS_ORDER[status] ?? 0;
  if (status === "cancelled") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-none px-6 py-5 text-center">
        <p className="text-red-700 font-semibold tracking-widest uppercase text-sm">Order Cancelled</p>
      </div>
    );
  }
  return (
    <div className="relative flex items-start justify-between gap-0">
      {/* connecting line */}
      <div className="absolute top-[18px] left-0 right-0 h-[2px] bg-[#E8E2D9] z-0" />
      <div
        className="absolute top-[18px] left-0 h-[2px] bg-[#D4AF37] z-0 transition-all duration-700"
        style={{ width: activeIdx === 0 ? "0%" : `${(activeIdx / (STEPS.length - 1)) * 100}%` }}
      />

      {STEPS.map((step, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <div key={step.key} className="relative z-10 flex flex-col items-center flex-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
              done    ? "bg-[#D4AF37] border-[#D4AF37] text-white" :
              active  ? "bg-white border-[#D4AF37] text-[#D4AF37]" :
                        "bg-white border-[#D4E0D4]/60 text-[#0F0F0F]/25"
            }`}>
              {done ? <CheckCircle2 className="w-4 h-4" fill="white" strokeWidth={0} /> : <step.Icon className="w-4 h-4" />}
            </div>
            <div className="mt-3 text-center hidden sm:block">
              <p className={`text-[11px] font-bold tracking-[0.12em] uppercase ${active ? "text-[#D4AF37]" : done ? "text-[#0F0F0F]" : "text-[#0F0F0F]/30"}`}>
                {step.label}
              </p>
              <p className={`text-[10px] mt-0.5 ${active ? "text-[#0F0F0F]/55" : done ? "text-[#0F0F0F]/40" : "text-[#0F0F0F]/20"}`}>
                {step.sub}
              </p>
            </div>
            <p className={`mt-2 text-[10px] text-center font-bold tracking-wide sm:hidden ${active ? "text-[#D4AF37]" : done ? "text-[#0F0F0F]/60" : "text-[#0F0F0F]/25"}`}>
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetail() {
  const [, params] = useRoute("/order/:id");
  const orderId = parseInt(params?.id || "0");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { enabled: !!orderId, refetchInterval: 30_000 },
  });

  /* ── Return Request state ── */
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnSubmitted, setReturnSubmitted] = useState(false);
  const [returnError, setReturnError] = useState("");

  async function handleSubmitReturn() {
    if (!returnReason) { setReturnError("Please select a reason."); return; }
    setReturnSubmitting(true);
    setReturnError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/orders/${orderId}/return-request`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: returnReason, description: returnDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setReturnSubmitted(true);
    } catch (err: any) {
      setReturnError(err.message || "Something went wrong. Please try again.");
    } finally {
      setReturnSubmitting(false);
    }
  }

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <html><head><title>Invoice #${order?.id?.toString().padStart(6, "0")}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Georgia', serif; color: #0F0F0F; background: #fff; padding: 32px; }
        .gold { color: #D4AF37; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 13px; }
        th { background: #FAF8F3; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; }
        .total-row td { font-weight: 700; font-size: 15px; border-top: 2px solid #D4AF37; }
      </style>
      </head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center gap-4">
        <p className="font-serif text-2xl text-[#0F0F0F]/40">Order not found</p>
        <Link href="/orders" className="text-[10px] tracking-[0.25em] uppercase text-[#D4AF37] border-b border-[#D4AF37]/40 pb-0.5">
          Back to Orders
        </Link>
      </div>
    );
  }

  const subtotalINR = toINR(order.subtotal ?? order.total);
  const discountINR = order.discount ? toINR(order.discount) : 0;
  const shippingINR = subtotalINR >= 5000 ? 0 : 99;
  const totalINR = subtotalINR - discountINR + shippingINR;
  const invoiceNo = order.id.toString().padStart(6, "0");
  const addr = order.shippingAddress as any;

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
      <Navbar />

      <div className="flex-1 py-10 md:py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8">

          {/* ── Header ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <Link href="/orders" className="inline-flex items-center gap-2 text-[#0F0F0F]/40 hover:text-[#D4AF37] transition-colors text-[10px] tracking-[0.2em] uppercase font-semibold mb-3">
                <ArrowLeft className="w-3 h-3" /> My Orders
              </Link>
              <h1 className="font-serif text-2xl md:text-3xl text-[#0F0F0F]">Order #{invoiceNo}</h1>
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#0F0F0F]/40 mt-1">
                Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] tracking-[0.2em] uppercase font-bold px-4 py-2 border ${STATUS_COLOR[order.status] || "bg-[#FAF8F3] text-[#0F0F0F] border-[#D4AF37]/30"}`}>
                {order.status}
              </span>
              <button onClick={handlePrint}
                className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-bold text-[#D4AF37] border border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 px-4 py-2 transition-all">
                <Printer className="w-3.5 h-3.5" /> Invoice
              </button>
            </div>
          </motion.div>

          {/* ── Stepper ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white border border-[#D4AF37]/15 p-6 md:p-8 mb-6 shadow-sm">
            <p className="text-[9px] tracking-[0.3em] uppercase text-[#D4AF37] font-bold mb-6">Tracking Status</p>
            <OrderStepper status={order.status} />
          </motion.div>

          {/* ── Return / Refund Request (only for delivered orders) ── */}
          {order.status === "delivered" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
              className="mb-6">
              {returnSubmitted ? (
                <div className="bg-green-50 border border-green-200 p-5 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-800 font-semibold text-sm">Return Request Submitted</p>
                    <p className="text-green-700 text-xs mt-0.5">We've received your request and will get back to you within 2-3 business days. Eligible refunds are processed within 7-10 business days.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-[#D4AF37]/15 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <RotateCcw className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#0F0F0F]">Need to return this order?</p>
                      <p className="text-[11px] text-[#0F0F0F]/50 mt-0.5">Returns accepted within 7 days of delivery for eligible items.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReturnModal(true)}
                    className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#D4AF37] border border-[#D4AF37]/50 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 px-5 py-2.5 transition-all whitespace-nowrap flex-shrink-0"
                  >
                    Request Return / Refund
                  </button>
                </div>
              )}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Items ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
              className="lg:col-span-2 bg-white border border-[#D4AF37]/15 shadow-sm">
              <div className="px-6 py-5 border-b border-[#D4AF37]/10">
                <p className="text-[9px] tracking-[0.3em] uppercase text-[#D4AF37] font-bold">Order Items</p>
              </div>
              <div className="divide-y divide-[#D4AF37]/8">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 p-5 items-center">
                    <div className="w-16 h-20 flex-shrink-0 bg-[#FAF8F3] overflow-hidden">
                      <img src={item.productImage} alt={item.productName}
                        className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.productId}`}>
                        <p className="font-serif text-base text-[#0F0F0F] hover:text-[#D4AF37] transition-colors leading-snug line-clamp-2">
                          {item.productName}
                        </p>
                      </Link>
                      <p className="text-[11px] text-[#0F0F0F]/40 mt-1 tracking-wide">Qty: {item.quantity}</p>
                      <p className="text-[11px] text-[#0F0F0F]/40">{fmtINR(item.price)} each</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-[#0F0F0F]">{fmtINR(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Right column ── */}
            <div className="space-y-5">

              {/* Price Summary */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white border border-[#D4AF37]/15 shadow-sm">
                <div className="px-5 py-4 border-b border-[#D4AF37]/10">
                  <p className="text-[9px] tracking-[0.3em] uppercase text-[#D4AF37] font-bold">Price Details</p>
                </div>
                <div className="p-5 space-y-3 text-sm">
                  <div className="flex justify-between text-[#0F0F0F]/60">
                    <span>Subtotal ({order.items.length} item{order.items.length > 1 ? "s" : ""})</span>
                    <span>{fmtINR(order.subtotal ?? order.total)}</span>
                  </div>
                  {discountINR > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount {order.couponCode && <span className="text-[10px] bg-green-50 px-1.5 py-0.5 rounded ml-1">{order.couponCode}</span>}</span>
                      <span>-₹{discountINR.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#0F0F0F]/60">
                    <span>Delivery</span>
                    <span className={shippingINR === 0 ? "text-green-600 font-medium" : ""}>
                      {shippingINR === 0 ? "FREE" : `₹${shippingINR}`}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-[#D4AF37]/15 flex justify-between font-bold text-base text-[#0F0F0F]">
                    <span>Total Amount</span>
                    <span className="text-[#D4AF37]">₹{totalINR.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-[10px] text-[#0F0F0F]/30 pt-1">Inclusive of all taxes</p>
                </div>
              </motion.div>

              {/* Payment Info */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
                className="bg-white border border-[#D4AF37]/15 shadow-sm">
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
                      {order.paymentStatus === "pending" && order.paymentMethod === "cod" ? "Pay on delivery" : order.paymentStatus || "pending"}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Shipping Address */}
              {addr && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-white border border-[#D4AF37]/15 shadow-sm">
                  <div className="px-5 py-4 border-b border-[#D4AF37]/10">
                    <p className="text-[9px] tracking-[0.3em] uppercase text-[#D4AF37] font-bold">Delivery Address</p>
                  </div>
                  <div className="p-5 flex gap-3">
                    <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-[#0F0F0F]/65 space-y-0.5 leading-relaxed">
                      <p className="font-semibold text-[#0F0F0F]">{addr.name}</p>
                      {addr.phone && <p className="flex items-center gap-1.5 text-[11px]"><Phone className="w-3 h-3" /> {addr.phone}</p>}
                      <p>{addr.line1}</p>
                      {addr.line2 && <p>{addr.line2}</p>}
                      <p>{addr.city}, {addr.state} – {addr.postalCode}</p>
                      <p>{addr.country || "India"}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Return Request Modal ── */}
      <AnimatePresence>
        {showReturnModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => { setShowReturnModal(false); setReturnError(""); }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#FAF8F3] w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#D4AF37]/15">
                <div>
                  <h2 className="font-serif text-xl text-[#0F0F0F]">Request Return / Refund</h2>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37] mt-0.5">Order #{invoiceNo}</p>
                </div>
                <button
                  onClick={() => { setShowReturnModal(false); setReturnError(""); }}
                  className="p-2 hover:bg-[#D4AF37]/10 transition-colors rounded-sm"
                >
                  <X className="w-5 h-5 text-[#0F0F0F]/50" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Return Policy */}
                <div className="bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 space-y-1.5">
                  <p className="font-semibold tracking-wide uppercase text-[10px] text-amber-600 mb-2">Return Policy</p>
                  <p>• Returns accepted within <strong>7 days</strong> of delivery.</p>
                  <p>• Items must be unused, unworn, and in original packaging.</p>
                  <p>• Custom or engraved pieces are <strong>non-refundable</strong>.</p>
                  <p>• Approved refunds processed within <strong>7–10 business days</strong>.</p>
                  <p>• Original shipping charges are non-refundable.</p>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#0F0F0F]/50 font-semibold">
                    Reason for Return *
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {RETURN_REASONS.map(reason => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setReturnReason(reason)}
                        className={`text-left px-4 py-2.5 text-sm border transition-all ${
                          returnReason === reason
                            ? "border-[#D4AF37] bg-[#D4AF37]/8 text-[#0F0F0F] font-medium"
                            : "border-[#D4AF37]/20 text-[#0F0F0F]/60 hover:border-[#D4AF37]/40 hover:text-[#0F0F0F]"
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#0F0F0F]/50 font-semibold">
                    Additional Details <span className="text-[#0F0F0F]/30 normal-case tracking-normal">(optional)</span>
                  </label>
                  <textarea
                    value={returnDescription}
                    onChange={e => setReturnDescription(e.target.value)}
                    placeholder="Describe the issue in more detail…"
                    className="w-full border border-[#D4AF37]/20 bg-white px-4 py-3 text-sm text-[#0F0F0F] placeholder-[#0F0F0F]/30 resize-none focus:outline-none focus:border-[#D4AF37]/60 transition-colors"
                    rows={3}
                  />
                </div>

                {/* Error */}
                {returnError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {returnError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => { setShowReturnModal(false); setReturnError(""); }}
                    className="flex-1 py-3 text-[10px] tracking-[0.2em] uppercase font-bold text-[#0F0F0F]/50 border border-[#0F0F0F]/15 hover:border-[#0F0F0F]/30 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReturn}
                    disabled={returnSubmitting || !returnReason}
                    className="flex-1 py-3 text-[10px] tracking-[0.2em] uppercase font-bold text-white bg-[#D4AF37] hover:bg-[#b8960f] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {returnSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    Submit Request
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hidden printable invoice ── */}
      <div className="hidden">
        <div ref={printRef}>
          <div style={{ fontFamily: "Georgia, serif", maxWidth: "800px", margin: "0 auto" }}>
            {/* Invoice Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", borderBottom: "2px solid #D4AF37", paddingBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "28px", fontWeight: "700", letterSpacing: "0.3em", color: "#0F0F0F" }}>PEARLIS</div>
                <div style={{ fontSize: "10px", letterSpacing: "0.35em", color: "#D4AF37", textTransform: "uppercase" }}>Fine Jewellery</div>
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#555" }}>
                  <div>contact@pearlis.com</div>
                  <div>www.pearlis.com</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "22px", fontWeight: "700", color: "#D4AF37" }}>TAX INVOICE</div>
                <div style={{ marginTop: "6px", fontSize: "13px", color: "#555" }}>
                  <div><strong>Invoice No:</strong> #INV-{invoiceNo}</div>
                  <div><strong>Order No:</strong> #ORD-{invoiceNo}</div>
                  <div><strong>Date:</strong> {format(new Date(order.createdAt), "dd MMM yyyy")}</div>
                  <div><strong>Status:</strong> {order.status.toUpperCase()}</div>
                </div>
              </div>
            </div>

            {/* Customer & Delivery */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px" }}>
              <div>
                <div style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#D4AF37", fontWeight: "700", marginBottom: "8px" }}>Bill To</div>
                <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#333" }}>
                  <div style={{ fontWeight: "600", color: "#0F0F0F" }}>{order.customerName || addr?.name || "—"}</div>
                  {order.customerEmail && <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>✉ {order.customerEmail}</div>}
                  {addr?.phone && <div>📞 {addr.phone}</div>}
                </div>
              </div>
              {addr && (
                <div>
                  <div style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#D4AF37", fontWeight: "700", marginBottom: "8px" }}>Ship To</div>
                  <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#333" }}>
                    <div style={{ fontWeight: "600", color: "#0F0F0F" }}>{addr.name}</div>
                    <div>{addr.line1}</div>
                    {addr.line2 && <div>{addr.line2}</div>}
                    <div>{addr.city}, {addr.state} – {addr.postalCode}</div>
                    <div>{addr.country || "India"}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Items table */}
            <table>
              <thead>
                <tr>
                  <th style={{ width: "50%" }}>Item</th>
                  <th style={{ textAlign: "center" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Unit Price</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: any, i: number) => (
                  <tr key={i}>
                    <td>{item.productName}</td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>₹{toINR(item.price).toLocaleString("en-IN")}</td>
                    <td style={{ textAlign: "right" }}>₹{toINR(item.price * item.quantity).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <table style={{ width: "300px" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "6px 12px", color: "#555" }}>Subtotal</td>
                    <td style={{ padding: "6px 12px", textAlign: "right" }}>{fmtINR(order.subtotal ?? order.total)}</td>
                  </tr>
                  {discountINR > 0 && (
                    <tr>
                      <td style={{ padding: "6px 12px", color: "#16a34a" }}>Discount {order.couponCode && `(${order.couponCode})`}</td>
                      <td style={{ padding: "6px 12px", textAlign: "right", color: "#16a34a" }}>-₹{discountINR.toLocaleString("en-IN")}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: "6px 12px", color: "#555" }}>Delivery</td>
                    <td style={{ padding: "6px 12px", textAlign: "right", color: shippingINR === 0 ? "#16a34a" : "#0F0F0F" }}>
                      {shippingINR === 0 ? "FREE" : `₹${shippingINR}`}
                    </td>
                  </tr>
                  <tr className="total-row">
                    <td style={{ padding: "10px 12px", fontWeight: "700", borderTop: "2px solid #D4AF37" }}>Grand Total</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "700", color: "#D4AF37", borderTop: "2px solid #D4AF37", fontSize: "16px" }}>
                      ₹{totalINR.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment */}
            <div style={{ marginTop: "24px", padding: "14px", background: "#FAF8F3", borderLeft: "3px solid #D4AF37", fontSize: "12px", color: "#555" }}>
              <strong style={{ color: "#0F0F0F" }}>Payment Method:</strong>{" "}
              {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod === "razorpay" ? "Razorpay (Online Payment)" : order.paymentMethod || "Online"} —{" "}
              <span style={{ textTransform: "uppercase", color: order.paymentStatus === "paid" ? "#16a34a" : "#ca8a04" }}>{order.paymentStatus || "pending"}</span>
            </div>

            {/* Footer */}
            <div style={{ marginTop: "40px", textAlign: "center", color: "#aaa", fontSize: "11px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
              <div>Thank you for shopping with Pearlis — Fine Jewellery</div>
              <div style={{ marginTop: "4px" }}>This is a computer-generated invoice and does not require a signature.</div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
