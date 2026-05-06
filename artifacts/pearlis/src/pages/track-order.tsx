import { useState, useEffect, useRef } from "react";
import { useGetOrder } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { format, addBusinessDays } from "date-fns";
import {
  Loader2, CheckCircle2, Package, Truck, Star,
  Search, ArrowRight, MapPin, CreditCard, Phone,
  RotateCcw, ExternalLink, Share2, Check,
  Building2, Home, ChevronRight, Clock, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetSettings } from "@/lib/adminApi";

const INR_RATE = 83;
const fmtINR  = (usd: number) => "₹" + Math.round(usd * INR_RATE).toLocaleString("en-IN");
const fmtDate = (d: Date) => format(d, "d MMM");
const fmtDateTime = (d: Date) => format(d, "d MMM, h:mm a");

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
    { label: "Pearlis Atelier", sub: "Origin · Noida, UP", icon: Building2 },
    { label: "Transit Hub",     sub: `${city} Delivery Centre`, icon: Package },
    { label: city,              sub: addr?.line1 ? addr.line1.slice(0, 26) + (addr.line1.length > 26 ? "…" : "") : city, icon: Home },
  ];
  const segmentFill = [activeIdx >= 2, activeIdx >= 3];

  return (
    <div className="relative">
      <div className="flex items-start justify-between gap-2">
        {nodes.map((node, i) => {
          const reached = i === 0 ? activeIdx >= 1 : i === 1 ? activeIdx >= 2 : activeIdx >= 3;
          const active  = (i === 1 && activeIdx >= 1 && activeIdx < 2) || (i === 2 && activeIdx === 2);
          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 relative z-10">
              <motion.div
                animate={active ? { scale: [1, 1.08, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  reached
                    ? "bg-[#D4AF37] border-[#D4AF37] text-white shadow-[0_0_16px_rgba(212,175,55,0.4)]"
                    : active
                      ? "bg-white border-[#D4AF37] text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)]"
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

      {/* Connecting lines */}
      <div className="absolute top-[22px] left-0 right-0 flex pointer-events-none" style={{ paddingLeft: "10%", paddingRight: "10%" }}>
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
  const orderDate = new Date(order.createdAt);
  const days = getDeliveryDays(city, state, shippingConfig);
  const activeIdx = STATUS_ORDER[order.status] ?? 0;

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
      sub: "Package handed to courier partner",
      location: `En route to ${city}`,
      dateLabel: fmtDate(addBusinessDays(orderDate, 1)),
      estimateLabel: "+1 day",
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

  if (order.status === "cancelled") {
    return (
      <div className="bg-red-50 border border-red-200 px-6 py-6 text-center">
        <p className="text-red-700 font-bold tracking-widest uppercase text-sm">Order Cancelled</p>
        <p className="text-red-500 text-xs mt-1">Please contact support if you need assistance.</p>
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
            <div className="flex flex-col items-center flex-shrink-0">
              <motion.div
                animate={active ? { boxShadow: ["0 0 0 0 rgba(212,175,55,0.4)", "0 0 0 8px rgba(212,175,55,0)", "0 0 0 0 rgba(212,175,55,0.4)"] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  done    ? "bg-[#D4AF37] border-[#D4AF37] text-white" :
                  active  ? "bg-white border-[#D4AF37] text-[#D4AF37]" :
                            "bg-white border-[#E8E2D9] text-[#0F0F0F]/20"
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
              </motion.div>
              {i < steps.length - 1 && (
                <div className="relative w-[2px] flex-1 my-1.5 bg-[#E8E2D9] overflow-hidden" style={{ minHeight: 44 }}>
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: done ? 1 : 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ originY: 0 }}
                    className="absolute inset-0 bg-[#D4AF37]"
                  />
                </div>
              )}
            </div>
            <div className={`flex-1 pb-7 ${i === steps.length - 1 ? "pb-0" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className={`text-sm font-bold tracking-wide transition-colors duration-300 ${
                    done ? "text-[#0F0F0F]" : active ? "text-[#D4AF37]" : "text-[#0F0F0F]/25"
                  }`}>
                    {step.label}
                  </p>
                  <p className={`text-xs mt-0.5 leading-relaxed ${
                    done ? "text-[#0F0F0F]/50" : active ? "text-[#0F0F0F]/55" : "text-[#0F0F0F]/20"
                  }`}>
                    {step.sub}
                  </p>
                  {step.location && (
                    <p className={`text-[10px] mt-1.5 flex items-center gap-1.5 ${
                      done || active ? "text-[#D4AF37]/80" : "text-[#0F0F0F]/15"
                    }`}>
                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" /> {step.location}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0 pt-0.5">
                  <p className={`text-[10px] font-medium ${done || active ? "text-[#0F0F0F]/50" : "text-[#0F0F0F]/15"}`}>
                    {done ? step.dateLabel : `Est. ${step.dateLabel}`}
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

/* ─── Order Result ──────────────────────────────────────────────── */
function OrderResult({ orderId, onReset }: { orderId: number; onReset: () => void }) {
  const { data: order, isLoading, isError, dataUpdatedAt } = useGetOrder(orderId, {
    query: { enabled: orderId > 0, refetchInterval: 30_000, retry: 1 },
  });
  const { data: settings } = useGetSettings();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/track-order?order=${orderId}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Track Pearlis Order #${orderId.toString().padStart(6, "0")}`, text: "Track my Pearlis jewellery order:", url }); return; }
      catch { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url; el.style.position = "fixed"; el.style.opacity = "0";
      document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  const badge  = order ? (STATUS_BADGE[order.status] ?? { label: order.status, cls: "bg-gray-50 text-gray-600 border-gray-200" }) : null;
  const addr   = order ? (order.shippingAddress as any) : null;
  const city   = addr?.city  || "";
  const state  = addr?.state || "";
  const subtotalINR = order ? Math.round((order.subtotal ?? order.total) * INR_RATE) : 0;
  const discountINR = order?.discount ? Math.round(order.discount * INR_RATE) : 0;

  const shippingConfig = settings?.shipping;
  const { min: dMin, max: dMax } = city ? getDeliveryDays(city, state, shippingConfig) : { min: 5, max: 7 };
  const shippingINR = (() => {
    if (!city) return subtotalINR >= 5000 ? 0 : 99;
    const freeCities = ((shippingConfig?.freeCities || "noida,delhi,new delhi") as string)
      .split(",").map((c: string) => c.trim().toLowerCase());
    const freeStates = ((shippingConfig?.freeStates || "") as string)
      .split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);
    if (freeCities.includes(city.toLowerCase())) return 0;
    if (freeStates.length > 0 && freeStates.includes(state.toLowerCase())) return 0;
    if (subtotalINR >= (shippingConfig?.minOrderFreeShipping ?? 500)) return 0;
    return shippingConfig?.defaultCharge ?? 49;
  })();
  const totalINR = subtotalINR - discountINR + shippingINR;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      <p className="text-[11px] tracking-[0.25em] uppercase text-[#0F0F0F]/40">Looking up your order…</p>
    </div>
  );
  if (isError || !order) return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-red-200 p-10 text-center">
      <Package className="w-10 h-10 text-red-300 mx-auto mb-4" />
      <p className="font-serif text-xl text-[#0F0F0F]/60 mb-1">Order not found</p>
      <p className="text-sm text-[#0F0F0F]/35 mb-6">Please double-check your order number and try again.</p>
      <button onClick={onReset} className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#D4AF37] border-b border-[#D4AF37]/40 hover:border-[#D4AF37] transition-colors pb-0.5">
        Try another order
      </button>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="space-y-5">

      {/* Order header */}
      <div className="bg-white border border-[#D4AF37]/15 shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[9px] tracking-[0.35em] uppercase text-[#0F0F0F]/35 font-semibold">Order Number</p>
          <p className="font-serif text-2xl text-[#0F0F0F] mt-0.5">#{order.id.toString().padStart(6, "0")}</p>
          <p className="text-[11px] text-[#0F0F0F]/40 mt-1 tracking-wide">Placed {format(new Date(order.createdAt), "d MMMM yyyy")}</p>
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

      {/* Tracking Card */}
      <div className="bg-white border border-[#D4AF37]/15 shadow-sm overflow-hidden">

        {/* Card header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#D4AF37]/8 flex items-center justify-between">
          <div>
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold">Live Tracking</p>
            {dataUpdatedAt > 0 && (
              <p className="text-[9px] text-[#0F0F0F]/30 mt-0.5">
                Updated {format(new Date(dataUpdatedAt), "h:mm a")} · Auto-refreshes every 30s
              </p>
            )}
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
            <p className="text-[11px] text-green-700 font-medium">
              Order successfully delivered to {city || "you"}!
            </p>
          </div>
        )}

        {/* Vertical Timeline */}
        <div className="px-6 py-7">
          <OrderTimeline order={order} addr={addr} shippingConfig={shippingConfig} />
        </div>
      </div>

      {/* Items + totals */}
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
        <div className="px-6 pb-5 pt-2 border-t border-[#D4AF37]/8 space-y-2">
          <div className="flex justify-between text-sm text-[#0F0F0F]/50">
            <span>Subtotal</span><span>{fmtINR(order.subtotal ?? order.total)}</span>
          </div>
          {discountINR > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span>−₹{discountINR.toLocaleString("en-IN")}</span>
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

      {/* Payment + Address row */}
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
                {order.paymentStatus === "pending" && order.paymentMethod === "cod" ? "Pay on delivery" : order.paymentStatus || "pending"}
              </p>
            </div>
          </div>
        </div>

        {/* Address */}
        {addr && (
          <div className="bg-white border border-[#D4AF37]/15 shadow-sm">
            <div className="px-5 py-4 border-b border-[#D4AF37]/10 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#D4AF37] font-bold">Delivery Address</p>
            </div>
            <div className="p-5 space-y-0.5 text-sm text-[#0F0F0F]/65 leading-relaxed">
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
                <div className="mt-2 pt-2 border-t border-[#D4AF37]/10 flex items-center gap-1.5 text-[10px] text-[#0F0F0F]/40">
                  <Truck className="w-3 h-3 text-[#D4AF37]" />
                  {shippingINR === 0 ? "Free delivery" : `₹${shippingINR} delivery`} · {dMin}–{dMax} business days
                </div>
              )}
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
        <div className="flex items-center gap-3">
          <button onClick={handleShare}
            className={`inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-bold border px-5 py-3 transition-all duration-300 ${
              copied ? "text-green-700 border-green-400 bg-green-50" : "text-[#D4AF37] border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5"
            }`}>
            {copied ? <><Check className="w-3.5 h-3.5" /> Link Copied</> : <><Share2 className="w-3.5 h-3.5" /> Share Order</>}
          </button>
          <Link href="/shop"
            className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-bold text-white bg-[#0F0F0F] hover:bg-[#D4AF37] px-8 py-3 transition-colors">
            Continue Shopping <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function TrackOrder() {
  const [input,   setInput]   = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
    setOrderId(null); setInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="bg-[#0F0F0F] pt-24 pb-10">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-[9px] tracking-[0.4em] uppercase text-[#D4AF37] font-bold mb-2">Pearlis</p>
            <h1 className="font-serif text-3xl md:text-4xl text-white">Track Your Order</h1>
            <p className="text-white/40 text-sm mt-2">Enter your order number to see real-time status and delivery route.</p>
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
                Your order number is in the confirmation email, or visible in{" "}
                <Link href="/orders" className="text-[#D4AF37] hover:underline">My Orders</Link>.
              </p>
            </motion.form>
          )}
        </AnimatePresence>

        {orderId && orderId > 0 && (
          <OrderResult key={orderId} orderId={orderId} onReset={handleReset} />
        )}

        {/* Info cards (shown when no order tracked) */}
        {!orderId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Package,    title: "Order Placed",  desc: "We receive and verify your order details immediately." },
              { icon: Star,       title: "Confirmed",      desc: "Our team confirms availability and prepares your jewellery." },
              { icon: Truck,      title: "Shipped",        desc: "Your order is dispatched and on its way to you." },
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
