import { useRoute, Link } from "wouter";
import { useGetOrder } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { format, addBusinessDays } from "date-fns";
import {
  Loader2, CheckCircle2, Package, Truck, Star, ArrowLeft,
  Printer, MapPin, CreditCard, Phone, RotateCcw,
  AlertCircle, X, Building2, Home, Check, Circle,
  ChevronRight, Clock, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { apiUrl } from "@/lib/apiUrl";
import { useGetSettings } from "@/lib/adminApi";

const INR_RATE = 83;
const toINR = (usd: number) => Math.round(usd * INR_RATE);
const fmtINR = (usd: number) => "₹" + toINR(usd).toLocaleString("en-IN");
const fmtDate = (d: Date) => format(d, "d MMM");
const fmtDateTime = (d: Date) => format(d, "d MMM, h:mm a");

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
  "Defective / damaged product", "Wrong item received",
  "Size or fit issue", "Product not as described",
  "Changed my mind", "Other",
];

/* ─── Delivery estimate helper ─────────────────────────────────── */
function getDeliveryDays(city: string, state: string, shippingConfig?: any) {
  const freeCities = ((shippingConfig?.freeCities || "noida,delhi,new delhi") as string)
    .split(",").map((c: string) => c.trim().toLowerCase()).filter(Boolean);
  const freeStates = ((shippingConfig?.freeStates || "") as string)
    .split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);

  if (freeCities.includes(city.trim().toLowerCase())) {
    const [min, max] = (shippingConfig?.freeCityDays || "1-2").split("-").map(Number);
    return { min: min || 1, max: max || 2, zone: "express" };
  }
  if (freeStates.length > 0 && freeStates.includes(state.trim().toLowerCase())) {
    const [min, max] = (shippingConfig?.freeStateDays || "2-3").split("-").map(Number);
    return { min: min || 2, max: max || 3, zone: "standard" };
  }
  const [min, max] = (shippingConfig?.paidDays || "5-7").split("-").map(Number);
  return { min: min || 5, max: max || 7, zone: "economy" };
}

/* ─── Delivery Journey Map ──────────────────────────────────────── */
function DeliveryJourneyMap({ addr, status }: { addr: any; status: string }) {
  const city = addr?.city || "Your City";
  const activeIdx = STATUS_ORDER[status] ?? 0;

  const nodes = [
    { label: "Pearlis Atelier", sub: "Origin • Noida, UP", icon: Building2 },
    { label: "Transit Hub", sub: `${city} Delivery Centre`, icon: Package },
    { label: city, sub: addr ? `${addr.line1 ? addr.line1.slice(0, 28) + (addr.line1.length > 28 ? "…" : "") : city}` : city, icon: Home },
  ];

  const segmentFill = [activeIdx >= 2, activeIdx >= 3];

  return (
    <div className="relative">
      {/* Nodes */}
      <div className="flex items-start justify-between gap-2">
        {nodes.map((node, i) => {
          const reached = i === 0 ? activeIdx >= 1 : i === 1 ? activeIdx >= 2 : activeIdx >= 3;
          const active  = (i === 0 && activeIdx === 0) || (i === 1 && activeIdx >= 1 && activeIdx < 2) || (i === 2 && activeIdx === 2);
          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 relative z-10">
              <motion.div
                animate={active ? { scale: [1, 1.08, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  reached
                    ? "bg-[#D4AF37] border-[#D4AF37] text-white shadow-[0_0_16px_rgba(212,175,55,0.4)]"
                    : active
                      ? "bg-white border-[#D4AF37] text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.25)]"
                      : "bg-[#FAF8F3] border-[#E8E2D9] text-[#0F0F0F]/20"
                }`}
              >
                {reached ? <Check className="w-5 h-5" /> : <node.icon className="w-5 h-5" />}
              </motion.div>
              <p className={`text-[9px] font-bold tracking-[0.15em] uppercase text-center leading-tight ${reached || active ? "text-[#0F0F0F]" : "text-[#0F0F0F]/25"}`}>
                {node.label}
              </p>
              <p className={`text-[8.5px] text-center leading-tight ${reached || active ? "text-[#0F0F0F]/45" : "text-[#0F0F0F]/15"}`}>
                {node.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Connecting lines - positioned between nodes */}
      <div className="absolute top-6 left-0 right-0 flex pointer-events-none" style={{ paddingLeft: "10%", paddingRight: "10%" }}>
        {segmentFill.map((filled, i) => (
          <div key={i} className="flex-1 flex items-center mx-1">
            <div className="relative w-full h-[2px] bg-[#E8E2D9] overflow-hidden">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: filled ? 1 : 0 }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
                style={{ originX: 0 }}
                className="absolute inset-0 bg-[#D4AF37]"
              />
            </div>
            <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-colors duration-500 ${filled ? "text-[#D4AF37]" : "text-[#E8E2D9]"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Vertical Timeline ─────────────────────────────────────────── */
function OrderTimeline({
  order, addr, shippingConfig,
}: {
  order: any; addr: any; shippingConfig?: any;
}) {
  const city  = addr?.city  || "Your City";
  const state = addr?.state || "";
  const name  = addr?.name  || "you";
  const line1 = addr?.line1 || "";

  const orderDate  = new Date(order.createdAt);
  const days = getDeliveryDays(city, state, shippingConfig);

  const steps = [
    {
      key: "pending",
      icon: CheckCircle2,
      label: "Order Placed",
      sub: `Order #${order.id.toString().padStart(6, "0")} received successfully`,
      location: "Pearlis Store",
      dateLabel: fmtDateTime(orderDate),
      estimateLabel: null,
    },
    {
      key: "confirmed",
      icon: Star,
      label: "Order Confirmed",
      sub: "Your jewellery is being handpicked and packaged",
      location: "Pearlis Atelier, Noida, UP",
      dateLabel: fmtDate(addBusinessDays(orderDate, 0)),
      estimateLabel: "Same day",
    },
    {
      key: "shipped",
      icon: Truck,
      label: "Dispatched",
      sub: `Package handed to courier partner`,
      location: `En route to ${city}`,
      dateLabel: fmtDate(addBusinessDays(orderDate, 1)),
      estimateLabel: `+1 day`,
    },
    {
      key: "delivered",
      icon: Package,
      label: "Delivered",
      sub: `Delivered to ${name}${line1 ? ` · ${line1.slice(0, 30)}` : ""}`,
      location: `${city}${state ? ", " + state : ""}`,
      dateLabel: fmtDate(addBusinessDays(orderDate, days.max)),
      estimateLabel: `${days.min}–${days.max} days`,
    },
  ];

  const activeIdx = status === "cancelled" ? -1 : (STATUS_ORDER[order.status] ?? 0);

  if (order.status === "cancelled") {
    return (
      <div className="bg-red-50 border border-red-200 px-6 py-5 text-center">
        <p className="text-red-700 font-bold tracking-widest uppercase text-sm">Order Cancelled</p>
        <p className="text-red-500/70 text-xs mt-1">Contact support if you need assistance.</p>
      </div>
    );
  }

  return (
    <div>
      {steps.map((step, i) => {
        const done     = i < activeIdx;
        const active   = i === activeIdx;
        const upcoming = i > activeIdx;

        return (
          <div key={step.key} className="flex gap-5">
            {/* Spine */}
            <div className="flex flex-col items-center flex-shrink-0">
              <motion.div
                initial={false}
                animate={active ? { boxShadow: ["0 0 0 0 rgba(212,175,55,0.4)", "0 0 0 8px rgba(212,175,55,0)", "0 0 0 0 rgba(212,175,55,0.4)"] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 ${
                  done    ? "bg-[#D4AF37] border-[#D4AF37] text-white" :
                  active  ? "bg-white border-[#D4AF37] text-[#D4AF37]" :
                            "bg-white border-[#E8E2D9] text-[#0F0F0F]/20"
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
              </motion.div>
              {i < steps.length - 1 && (
                <div className="w-[2px] flex-1 my-1.5 overflow-hidden" style={{ minHeight: 44 }}>
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: done ? 1 : 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ originY: 0 }}
                    className="w-full h-full bg-[#D4AF37]"
                  />
                  <div className="w-full h-full bg-[#E8E2D9] -mt-full" style={{ marginTop: done ? "-100%" : 0 }} />
                </div>
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-7 ${i === steps.length - 1 ? "pb-0" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className={`text-sm font-bold tracking-wide transition-colors duration-300 ${
                    done ? "text-[#0F0F0F]" : active ? "text-[#D4AF37]" : "text-[#0F0F0F]/25"
                  }`}>
                    {step.label}
                  </p>
                  <p className={`text-xs mt-0.5 leading-relaxed transition-colors duration-300 ${
                    done ? "text-[#0F0F0F]/50" : active ? "text-[#0F0F0F]/55" : "text-[#0F0F0F]/20"
                  }`}>
                    {step.sub}
                  </p>
                  {step.location && (
                    <p className={`text-[10px] mt-1.5 flex items-center gap-1.5 transition-colors duration-300 ${
                      done || active ? "text-[#D4AF37]/80" : "text-[#0F0F0F]/15"
                    }`}>
                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" /> {step.location}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0 pt-0.5">
                  <p className={`text-[10px] font-medium transition-colors duration-300 ${
                    done || active ? "text-[#0F0F0F]/50" : "text-[#0F0F0F]/15"
                  }`}>
                    {done ? step.dateLabel : active ? `Est. ${step.dateLabel}` : `Est. ${step.dateLabel}`}
                  </p>
                  {active && (
                    <motion.div
                      animate={{ opacity: [1, 0.35, 1] }}
                      transition={{ repeat: Infinity, duration: 1.6 }}
                      className="flex items-center justify-end gap-1 mt-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                      <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-widest">Live</span>
                    </motion.div>
                  )}
                  {upcoming && step.estimateLabel && (
                    <p className="text-[9px] text-[#0F0F0F]/20 mt-0.5 flex items-center justify-end gap-1">
                      <Clock className="w-2.5 h-2.5" /> {step.estimateLabel}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function OrderDetail() {
  const [, params] = useRoute("/order/:id");
  const orderId    = parseInt(params?.id || "0");
  const printRef   = useRef<HTMLDivElement>(null);
  const { data: settings } = useGetSettings();

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { enabled: !!orderId, refetchInterval: 30_000 },
  });

  const [showReturnModal,    setShowReturnModal]    = useState(false);
  const [returnReason,       setReturnReason]       = useState("");
  const [returnDescription,  setReturnDescription]  = useState("");
  const [returnSubmitting,   setReturnSubmitting]   = useState(false);
  const [returnSubmitted,    setReturnSubmitted]    = useState(false);
  const [returnError,        setReturnError]        = useState("");

  async function handleSubmitReturn() {
    if (!returnReason) { setReturnError("Please select a reason."); return; }
    setReturnSubmitting(true); setReturnError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/orders/${orderId}/return-request`), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ reason: returnReason, description: returnDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setReturnSubmitted(true);
    } catch (err: any) {
      setReturnError(err.message || "Something went wrong.");
    } finally {
      setReturnSubmitting(false);
    }
  }

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<html><head><title>Invoice #${order?.id?.toString().padStart(6, "0")}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Georgia', serif; color: #0F0F0F; background: #fff; padding: 32px; }
        .gold { color: #D4AF37; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 13px; }
        th { background: #FAF8F3; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; }
        .total-row td { font-weight: 700; font-size: 15px; border-top: 2px solid #D4AF37; }
      </style></head><body>${content.innerHTML}</body></html>`);
    win.document.close(); win.print();
  }

  if (isLoading) return (
    <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
    </div>
  );
  if (!order) return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center gap-4">
      <p className="font-serif text-2xl text-[#0F0F0F]/40">Order not found</p>
      <Link href="/orders" className="text-[10px] tracking-[0.25em] uppercase text-[#D4AF37] border-b border-[#D4AF37]/40 pb-0.5">
        Back to Orders
      </Link>
    </div>
  );

  const subtotalINR = toINR(order.subtotal ?? order.total);
  const discountINR = order.discount ? toINR(order.discount) : 0;
  const addr        = order.shippingAddress as any;
  const city        = addr?.city  || "";
  const state       = addr?.state || "";
  const shippingConfig = settings?.shipping;
  const { min: dMin, max: dMax } = getDeliveryDays(city, state, shippingConfig);
  const shippingINR = (() => {
    const freeCities = ((shippingConfig?.freeCities || "noida,delhi,new delhi") as string)
      .split(",").map((c: string) => c.trim().toLowerCase());
    const freeStates = ((shippingConfig?.freeStates || "") as string)
      .split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);
    if (freeCities.includes(city.toLowerCase())) return 0;
    if (freeStates.length > 0 && freeStates.includes(state.toLowerCase())) return 0;
    if (subtotalINR >= (shippingConfig?.minOrderFreeShipping ?? 500)) return 0;
    return shippingConfig?.defaultCharge ?? 49;
  })();
  const totalINR    = subtotalINR - discountINR + shippingINR;
  const invoiceNo   = order.id.toString().padStart(6, "0");

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
      <Navbar />

      <div className="flex-1 py-10 md:py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8">

          {/* Header */}
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

          {/* ── Tracking Card ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}
            className="bg-white border border-[#D4AF37]/15 shadow-sm mb-6 overflow-hidden">

            {/* Card header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#D4AF37]/8 flex items-center justify-between">
              <div>
                <p className="text-[9px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold">Live Tracking</p>
                <p className="text-xs text-[#0F0F0F]/40 mt-0.5">Auto-refreshes every 30 seconds</p>
              </div>
              {city && (
                <div className="flex items-center gap-1.5 text-[10px] text-[#0F0F0F]/40">
                  <MapPin className="w-3 h-3 text-[#D4AF37]" />
                  <span>Delivering to <strong className="text-[#0F0F0F]/60">{city}</strong></span>
                </div>
              )}
            </div>

            {/* Delivery Journey Map */}
            {addr && order.status !== "cancelled" && (
              <div className="px-6 pt-6 pb-4 border-b border-[#D4AF37]/8 bg-[#FAF8F3]/50">
                <p className="text-[9px] tracking-[0.3em] uppercase text-[#0F0F0F]/35 font-bold mb-5">Delivery Route</p>
                <DeliveryJourneyMap addr={addr} status={order.status} />
              </div>
            )}

            {/* Estimated delivery banner */}
            {order.status !== "cancelled" && order.status !== "delivered" && addr && (
              <div className="px-6 py-3 bg-[#D4AF37]/8 border-b border-[#D4AF37]/15 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                <p className="text-[11px] text-[#0F0F0F]/65">
                  Estimated delivery to <strong className="text-[#0F0F0F]">{city}</strong>:{" "}
                  <strong className="text-[#D4AF37]">
                    {format(addBusinessDays(new Date(order.createdAt), dMin), "d MMM")}
                    {dMin !== dMax ? ` – ${format(addBusinessDays(new Date(order.createdAt), dMax), "d MMM")}` : ""}
                  </strong>
                </p>
              </div>
            )}
            {order.status === "delivered" && (
              <div className="px-6 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-[11px] text-green-700 font-medium">Order successfully delivered to {city}!</p>
              </div>
            )}

            {/* Vertical Timeline */}
            <div className="px-6 py-7">
              <OrderTimeline order={order} addr={addr} shippingConfig={shippingConfig} />
            </div>
          </motion.div>

          {/* Return/Refund Banner */}
          {order.status === "delivered" && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }} className="mb-6">
              {returnSubmitted ? (
                <div className="bg-green-50 border border-green-200 p-5 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-800 font-semibold text-sm">Return Request Submitted</p>
                    <p className="text-green-700 text-xs mt-0.5">We'll respond within 2–3 business days. Eligible refunds are processed in 7–10 business days.</p>
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
                  <button onClick={() => setShowReturnModal(true)}
                    className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#D4AF37] border border-[#D4AF37]/50 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 px-5 py-2.5 transition-all whitespace-nowrap flex-shrink-0">
                    Request Return / Refund
                  </button>
                </div>
              )}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Items */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
              className="lg:col-span-2 bg-white border border-[#D4AF37]/15 shadow-sm">
              <div className="px-6 py-5 border-b border-[#D4AF37]/10">
                <p className="text-[9px] tracking-[0.3em] uppercase text-[#D4AF37] font-bold">Order Items</p>
              </div>
              <div className="divide-y divide-[#D4AF37]/8">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 p-5 items-center">
                    <div className="w-16 h-20 flex-shrink-0 bg-[#FAF8F3] overflow-hidden">
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.productId}`}>
                        <p className="font-serif text-base text-[#0F0F0F] hover:text-[#D4AF37] transition-colors leading-snug line-clamp-2">{item.productName}</p>
                      </Link>
                      <p className="text-[11px] text-[#0F0F0F]/40 mt-1 tracking-wide">Qty: {item.quantity}</p>
                      <p className="text-[11px] text-[#0F0F0F]/40">{fmtINR(item.price)} each</p>
                    </div>
                    <p className="font-semibold text-[#0F0F0F] flex-shrink-0">{fmtINR(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right column */}
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
                      <span>−₹{discountINR.toLocaleString("en-IN")}</span>
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

              {/* Payment */}
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
                  <div className="px-5 py-4 border-b border-[#D4AF37]/10 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <p className="text-[9px] tracking-[0.3em] uppercase text-[#D4AF37] font-bold">Delivery Address</p>
                  </div>
                  <div className="p-5 space-y-1 text-sm text-[#0F0F0F]/65 leading-relaxed">
                    <p className="font-semibold text-[#0F0F0F]">{addr.name}</p>
                    {addr.phone && (
                      <p className="flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3 h-3 text-[#D4AF37]" /> {addr.phone}
                      </p>
                    )}
                    <p>{addr.line1}</p>
                    {addr.line2 && <p>{addr.line2}</p>}
                    <p className="font-medium text-[#0F0F0F]/75">{addr.city}, {addr.state} – {addr.postalCode}</p>
                    <p>{addr.country || "India"}</p>
                    {city && (
                      <div className="mt-3 pt-3 border-t border-[#D4AF37]/10 flex items-center gap-2 text-[10px]">
                        <Truck className="w-3 h-3 text-[#D4AF37]" />
                        <span className="text-[#0F0F0F]/40">
                          {shippingINR === 0 ? "Free delivery" : `₹${shippingINR} delivery`} · {dMin}–{dMax} business days
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Print-only invoice */}
          <div ref={printRef} style={{ display: "none" }}>
            <div style={{ fontFamily: "Georgia, serif", maxWidth: 700 }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #D4AF37", paddingBottom: 16, marginBottom: 24 }}>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: "#D4AF37" }}>PEARLIS</p>
                  <p style={{ fontSize: 11, color: "#666", letterSpacing: "0.1em", textTransform: "uppercase" }}>Fine Jewellery</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 18, fontWeight: 700 }}>TAX INVOICE</p>
                  <p style={{ fontSize: 13, color: "#555" }}>#{invoiceNo}</p>
                  <p style={{ fontSize: 12, color: "#888" }}>{format(new Date(order.createdAt), "d MMMM yyyy")}</p>
                </div>
              </div>
              {addr && (
                <div style={{ marginBottom: 24, fontSize: 13, color: "#444" }}>
                  <p style={{ fontWeight: 700, marginBottom: 4 }}>Deliver To:</p>
                  <p>{addr.name}</p>
                  <p>{addr.line1}{addr.line2 ? ", " + addr.line2 : ""}</p>
                  <p>{addr.city}, {addr.state} – {addr.postalCode}</p>
                  <p>{addr.country || "India"}</p>
                  {addr.phone && <p>Ph: {addr.phone}</p>}
                </div>
              )}
              <table>
                <thead>
                  <tr><th>Item</th><th style={{ textAlign: "center" }}>Qty</th><th style={{ textAlign: "right" }}>Price</th><th style={{ textAlign: "right" }}>Total</th></tr>
                </thead>
                <tbody>
                  {order.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td>{item.productName}</td>
                      <td style={{ textAlign: "center" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>{fmtINR(item.price)}</td>
                      <td style={{ textAlign: "right" }}>{fmtINR(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3}>Subtotal</td>
                    <td style={{ textAlign: "right" }}>{fmtINR(order.subtotal ?? order.total)}</td>
                  </tr>
                  {discountINR > 0 && (
                    <tr>
                      <td colSpan={3}>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</td>
                      <td style={{ textAlign: "right" }}>−₹{discountINR.toLocaleString("en-IN")}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3}>Delivery</td>
                    <td style={{ textAlign: "right" }}>{shippingINR === 0 ? "FREE" : `₹${shippingINR}`}</td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan={3} style={{ fontWeight: 700, borderTop: "2px solid #D4AF37" }}>Total Amount</td>
                    <td style={{ textAlign: "right", fontWeight: 700, borderTop: "2px solid #D4AF37", color: "#D4AF37" }}>₹{totalINR.toLocaleString("en-IN")}</td>
                  </tr>
                </tbody>
              </table>
              <p style={{ fontSize: 11, color: "#999", marginTop: 32, textAlign: "center" }}>Thank you for shopping with Pearlis Fine Jewellery. All prices inclusive of applicable taxes.</p>
            </div>
          </div>

        </div>
      </div>

      <Footer />

      {/* Return Modal */}
      <AnimatePresence>
        {showReturnModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => { setShowReturnModal(false); setReturnError(""); }}>
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#FAF8F3] w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#D4AF37]/15">
                <div>
                  <h2 className="font-serif text-xl text-[#0F0F0F]">Request Return / Refund</h2>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37] mt-0.5">Order #{invoiceNo}</p>
                </div>
                <button onClick={() => { setShowReturnModal(false); setReturnError(""); }} className="p-2 hover:bg-[#D4AF37]/10 transition-colors rounded-sm">
                  <X className="w-5 h-5 text-[#0F0F0F]/50" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 space-y-1.5">
                  <p className="font-semibold tracking-wide uppercase text-[10px] text-amber-600 mb-2">Return Policy</p>
                  <p>• Returns accepted within <strong>7 days</strong> of delivery.</p>
                  <p>• Items must be unused, unworn, and in original packaging.</p>
                  <p>• Custom or engraved pieces are <strong>non-refundable</strong>.</p>
                  <p>• Approved refunds processed within <strong>7–10 business days</strong>.</p>
                  <p>• Original shipping charges are non-refundable.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#0F0F0F]/50 font-semibold">Reason for Return *</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {RETURN_REASONS.map(reason => (
                      <button key={reason} type="button" onClick={() => setReturnReason(reason)}
                        className={`text-left px-4 py-2.5 text-sm border transition-all ${
                          returnReason === reason
                            ? "border-[#D4AF37] bg-[#D4AF37]/8 text-[#0F0F0F] font-medium"
                            : "border-[#D4AF37]/20 text-[#0F0F0F]/60 hover:border-[#D4AF37]/40"
                        }`}>{reason}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#0F0F0F]/50 font-semibold">
                    Additional Details <span className="text-[#0F0F0F]/30 normal-case tracking-normal">(optional)</span>
                  </label>
                  <textarea value={returnDescription} onChange={e => setReturnDescription(e.target.value)}
                    placeholder="Describe the issue in more detail…"
                    className="w-full border border-[#D4AF37]/20 bg-white px-4 py-3 text-sm text-[#0F0F0F] placeholder-[#0F0F0F]/30 resize-none focus:outline-none focus:border-[#D4AF37]/60 transition-colors"
                    rows={3} />
                </div>
                {returnError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {returnError}
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setShowReturnModal(false); setReturnError(""); }}
                    className="flex-1 py-3 text-[10px] tracking-[0.2em] uppercase font-bold text-[#0F0F0F]/50 border border-[#0F0F0F]/15 hover:border-[#0F0F0F]/30 transition-all">
                    Cancel
                  </button>
                  <button onClick={handleSubmitReturn} disabled={returnSubmitting || !returnReason}
                    className="flex-1 py-3 text-[10px] tracking-[0.2em] uppercase font-bold text-white bg-[#D4AF37] hover:bg-[#b8960f] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                    {returnSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    {returnSubmitting ? "Submitting…" : "Submit Request"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
