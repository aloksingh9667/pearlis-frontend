import { useListOrders } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Package, ShoppingBag, ChevronRight, Truck, CheckCircle2, Star, Clock } from "lucide-react";
import { motion } from "framer-motion";

/* ── helpers ── */
const INR_RATE = 83;
const fmtINR = (usd: number) => "₹" + Math.round(usd * INR_RATE).toLocaleString("en-IN");

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
  pending:   { label: "Order Placed",  color: "bg-yellow-50 text-yellow-700 border-yellow-200",  Icon: Clock },
  confirmed: { label: "Confirmed",     color: "bg-blue-50 text-blue-700 border-blue-200",        Icon: Star },
  shipped:   { label: "Shipped",       color: "bg-purple-50 text-purple-700 border-purple-200",  Icon: Truck },
  delivered: { label: "Delivered",     color: "bg-green-50 text-green-700 border-green-200",     Icon: CheckCircle2 },
  cancelled: { label: "Cancelled",     color: "bg-red-50 text-red-700 border-red-200",           Icon: Package },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-gray-50 text-gray-600 border-gray-200", Icon: Clock };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[9.5px] tracking-[0.15em] uppercase font-bold px-2.5 py-1 border ${cfg.color}`}>
      <cfg.Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function Orders() {
  const { user, logout } = useAuth();
  const { data, isLoading } = useListOrders({ limit: 50 });
  const [, setLocation] = useLocation();

  const tabs = [
    { label: "Order History", href: "/orders", active: true },
    { label: "Wishlist", href: "/wishlist", active: false },
    { label: "Account", href: "/account", active: false },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
      <Navbar />

      {/* Page header */}
      <div className="bg-[#0F0F0F] pt-24 pb-10">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold mb-2">My Account</p>
            <h1 className="font-serif text-3xl md:text-4xl text-white">
              Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 w-full flex-1 pb-16">

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-[#D4AF37]/15 mb-8 -mt-0 bg-white shadow-sm overflow-x-auto">
          {tabs.map(tab => (
            <Link key={tab.href} href={tab.href}
              className={`px-6 py-4 text-[10.5px] tracking-[0.2em] uppercase font-bold whitespace-nowrap transition-all border-b-2 ${
                tab.active
                  ? "border-[#D4AF37] text-[#D4AF37]"
                  : "border-transparent text-[#0F0F0F]/45 hover:text-[#0F0F0F] hover:border-[#D4AF37]/30"
              }`}>
              {tab.label}
            </Link>
          ))}
          <button onClick={() => { logout?.(); setLocation("/"); }}
            className="ml-auto px-6 py-4 text-[10.5px] tracking-[0.2em] uppercase font-bold text-[#0F0F0F]/35 hover:text-red-500 transition-colors whitespace-nowrap">
            Sign Out
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : !data?.orders?.length ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20 bg-white border border-[#D4AF37]/15">
            <ShoppingBag className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-4" />
            <p className="font-serif text-xl text-[#0F0F0F]/50 mb-2">No orders yet</p>
            <p className="text-sm text-[#0F0F0F]/35 mb-6">Start exploring our fine jewellery collection</p>
            <Link href="/shop"
              className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-bold text-white bg-[#0F0F0F] hover:bg-[#D4AF37] px-8 py-3 transition-colors">
              Shop Now
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {data.orders.map((order, i) => {
              const orderItems: any[] = Array.isArray(order.items) ? order.items : [];
              const totalINR = Math.round(order.total * INR_RATE);
              const subtotalINR = order.subtotal ? Math.round(order.subtotal * INR_RATE) : totalINR;
              return (
                <motion.div key={order.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="bg-white border border-[#D4AF37]/12 shadow-sm hover:border-[#D4AF37]/30 hover:shadow-md transition-all group">

                  {/* Order header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[#D4AF37]/8">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <span className="text-[9px] tracking-[0.2em] uppercase text-[#0F0F0F]/35 font-semibold">Order</span>
                        <span className="text-[11px] font-bold text-[#0F0F0F] ml-1.5">#{order.id.toString().padStart(6, "0")}</span>
                      </div>
                      <span className="w-px h-4 bg-[#0F0F0F]/10" />
                      <span className="text-[11px] text-[#0F0F0F]/45">
                        {format(new Date(order.createdAt), "d MMM yyyy")}
                      </span>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch">
                    {/* Item thumbnails */}
                    <div className="flex items-center gap-2 p-5 flex-1">
                      <div className="flex gap-2">
                        {orderItems.slice(0, 3).map((item: any, j: number) => (
                          <div key={j} className="w-14 h-[72px] bg-[#FAF8F3] overflow-hidden flex-shrink-0 border border-[#D4AF37]/10">
                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {orderItems.length > 3 && (
                          <div className="w-14 h-[72px] bg-[#FAF8F3] border border-[#D4AF37]/10 flex items-center justify-center text-[11px] text-[#0F0F0F]/40 font-medium flex-shrink-0">
                            +{orderItems.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-[#0F0F0F] font-medium leading-snug line-clamp-1">
                          {orderItems[0]?.productName}
                          {orderItems.length > 1 && <span className="text-[#0F0F0F]/40 text-[11px]"> +{orderItems.length - 1} more</span>}
                        </p>
                        <p className="text-[11px] text-[#0F0F0F]/40 mt-1">{orderItems.length} item{orderItems.length > 1 ? "s" : ""}</p>
                        <p className="text-base font-bold text-[#0F0F0F] mt-1.5">₹{totalINR.toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    {/* Action */}
                    <Link href={`/order/${order.id}`}
                      className="flex items-center justify-center gap-2 sm:border-l border-t sm:border-t-0 border-[#D4AF37]/10 px-6 py-4 text-[10px] tracking-[0.2em] uppercase font-bold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all whitespace-nowrap sm:min-w-[140px]">
                      View Details <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
