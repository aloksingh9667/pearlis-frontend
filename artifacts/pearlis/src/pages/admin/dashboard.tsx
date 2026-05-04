import { useGetDashboardStats, useListCoupons, useGetDashboardRecentOrders, useGetSalesByCategory } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Loader2, IndianRupee, Package, ShoppingBag, Users, TrendingUp, Tag, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const INR = (usd: number) => `₹${Math.round(usd * 83).toLocaleString("en-IN")}`;

const STATUS_COLORS: Record<string, string> = {
  pending:   "#f59e0b",
  confirmed: "#3b82f6",
  shipped:   "#8b5cf6",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

const PIE_COLORS = ["#D4AF37", "#b8960f", "#8b700a", "#6b5408", "#4a3a06", "#2d2404"];

function StatCard({ label, value, sub, icon: Icon }: {
  label: string; value: string | number; sub?: string; icon: any;
}) {
  return (
    <Card className="rounded-none border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</CardTitle>
        <Icon className="w-4 h-4 text-accent" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-serif">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children, href }: { children: React.ReactNode; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[10px] tracking-[0.28em] uppercase font-bold text-muted-foreground">{children}</h2>
      {href && (
        <Link href={href} className="text-[10px] tracking-widest uppercase text-accent hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border px-3 py-2 text-xs shadow-lg">
      <p className="font-mono font-bold tracking-widest text-accent mb-1">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} uses</p>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border px-3 py-2 text-xs shadow-lg">
      <p className="font-medium capitalize mb-0.5">{payload[0].name}</p>
      <p className="text-accent">{payload[0].value} items sold</p>
      <p className="text-muted-foreground">{INR(payload[0].payload.totalRevenue)}</p>
    </div>
  );
};

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: coupons, isLoading: couponsLoading } = useListCoupons();
  const { data: recentOrders, isLoading: ordersLoading } = useGetDashboardRecentOrders({ limit: 6 });
  const { data: salesByCategory, isLoading: salesLoading } = useGetSalesByCategory();

  const isLoading = statsLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AdminLayout>
    );
  }

  // Coupon chart data — sorted by usage desc, top 10
  const couponChartData = (coupons || [])
    .filter((c: any) => (c.usedCount || 0) > 0)
    .sort((a: any, b: any) => (b.usedCount || 0) - (a.usedCount || 0))
    .slice(0, 10)
    .map((c: any) => ({
      code: c.code,
      uses: c.usedCount || 0,
      discount: c.discountType === "percentage"
        ? `${c.discountValue}% off`
        : `₹${Math.round(c.discountValue * 83)} off`,
      active: c.isActive,
    }));

  // Category pie data
  const categoryData = (salesByCategory || [])
    .filter((c: any) => c.totalSales > 0)
    .sort((a: any, b: any) => b.totalSales - a.totalSales)
    .slice(0, 6)
    .map((c: any) => ({ name: c.category, value: c.totalSales, totalRevenue: c.totalRevenue }));

  return (
    <AdminLayout>
      <h1 className="font-serif text-3xl mb-8">Dashboard Overview</h1>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Total Revenue"
          value={INR(stats?.totalRevenue || 0)}
          sub={`${INR(stats?.revenueThisMonth || 0)} this month`}
          icon={IndianRupee}
        />
        <StatCard
          label="Orders"
          value={stats?.totalOrders || 0}
          sub={`${stats?.pendingOrders || 0} pending · ${stats?.ordersThisMonth || 0} this month`}
          icon={Package}
        />
        <StatCard
          label="Products"
          value={stats?.totalProducts || 0}
          sub="In catalogue"
          icon={ShoppingBag}
        />
        <StatCard
          label="Customers"
          value={stats?.totalUsers || 0}
          sub={`+${stats?.newUsersThisMonth || 0} this month`}
          icon={Users}
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">

        {/* Coupon Usage Bar Chart */}
        <div className="bg-card border border-border p-6">
          <SectionTitle href="/admin/coupons">Coupon Usage</SectionTitle>
          {couponsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
          ) : couponChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <Tag className="w-8 h-8 opacity-20" />
              <p className="text-sm">No coupons used yet.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={couponChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="code"
                    tick={{ fontSize: 10, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                  <Bar dataKey="uses" radius={[2, 2, 0, 0]}>
                    {couponChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.active ? "#D4AF37" : "hsl(var(--muted-foreground))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-border">
                {couponChartData.map((c) => (
                  <div key={c.code} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.active ? "bg-[#D4AF37]" : "bg-muted-foreground"}`} />
                    <span className="font-mono font-bold">{c.code}</span>
                    <span>{c.discount} · {c.uses}×</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sales by Category Pie Chart */}
        <div className="bg-card border border-border p-6">
          <SectionTitle>Sales by Category</SectionTitle>
          {salesLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
          ) : categoryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <TrendingUp className="w-8 h-8 opacity-20" />
              <p className="text-sm">No sales data yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="48%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span style={{ fontSize: 10, textTransform: "capitalize", color: "hsl(var(--muted-foreground))" }}>
                      {value}
                    </span>
                  )}
                  iconSize={8}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div className="bg-card border border-border">
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <SectionTitle href="/admin/orders">Recent Orders</SectionTitle>
        </div>
        {ordersLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
        ) : !recentOrders || recentOrders.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Order</th>
                  <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Customer</th>
                  <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Total</th>
                  <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3.5">
                      <Link href={`/admin/orders`}>
                        <span className="font-mono text-accent font-semibold hover:underline cursor-pointer">
                          #{order.id}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground">
                      {order.customerName || order.customerEmail || "Guest"}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className="text-[10px] px-2 py-1 uppercase tracking-widest font-medium"
                        style={{
                          background: `${STATUS_COLORS[order.status] || "#6b7280"}18`,
                          color: STATUS_COLORS[order.status] || "#6b7280",
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium">{INR(order.total)}</td>
                    <td className="px-6 py-3.5 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
