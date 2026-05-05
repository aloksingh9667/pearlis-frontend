import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Loader2, TrendingUp, TrendingDown, IndianRupee, Package, Users, ShoppingBag, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { apiUrl, adminHeaders } from "@/lib/apiUrl";

type Period = "7d" | "30d" | "12w" | "12m";

const PERIODS: { id: Period; label: string }[] = [
  { id: "7d",  label: "7 Days"   },
  { id: "30d", label: "30 Days"  },
  { id: "12w", label: "12 Weeks" },
  { id: "12m", label: "12 Months"},
];

const STATUS_COLORS: Record<string, string> = {
  pending:   "#f59e0b",
  confirmed: "#3b82f6",
  shipped:   "#8b5cf6",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

const INR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

async function fetchReport(period: Period) {
  const res = await fetch(apiUrl(`/api/admin/reports?period=${period}`), { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to load report");
  return res.json();
}

function ChangeChip({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">vs prev period</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? "text-green-600" : "text-red-500"}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? "+" : ""}{value}%
    </span>
  );
}

function SummaryCard({ label, value, sub, change, icon: Icon }: {
  label: string; value: string; sub?: string; change?: number | null; icon: any;
}) {
  return (
    <div className="bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-semibold">{label}</p>
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <p className="font-serif text-2xl font-bold mb-1">{value}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {change !== undefined && <ChangeChip value={change ?? null} />}
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label, prefix = "" }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border px-3 py-2.5 text-xs shadow-lg min-w-[120px]">
      <p className="font-semibold mb-2 text-foreground">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }} className="capitalize">{p.name}</span>
          <span className="font-medium">{prefix}{p.value?.toLocaleString("en-IN")}</span>
        </div>
      ))}
    </div>
  );
};

function exportCSV(report: any, period: Period) {
  const rows = [
    "Period,Revenue (₹),Orders,New Customers",
    ...report.timeline.map((t: any) => `${t.label},${t.revenue},${t.orders},${t.customers}`),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pearlis-report-${period}-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const [period, setPeriod] = useState<Period>("30d");

  const { data: report, isLoading, error } = useQuery({
    queryKey: ["admin-reports", period],
    queryFn: () => fetchReport(period),
    staleTime: 60_000,
  });

  const timeline  = report?.timeline  || [];
  const summary   = report?.summary   || {};
  const statusData = (report?.statusBreakdown || []).map((s: any) => ({
    name: s.status, value: s.count, color: STATUS_COLORS[s.status] || "#6b7280",
  }));
  const topProducts = report?.topProducts || [];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Analytics and performance overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Period switcher */}
          <div className="flex border border-border overflow-x-auto flex-shrink-0">
            {PERIODS.map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-2 text-[10px] tracking-widest uppercase font-semibold transition-colors whitespace-nowrap ${
                  period === p.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => report && exportCSV(report, period)}
            disabled={!report}
            className="flex items-center gap-2 border border-border px-3 py-2 text-[10px] tracking-widest uppercase font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 whitespace-nowrap flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : error ? (
        <div className="text-center py-24 text-destructive text-sm">Failed to load report data.</div>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              label="Revenue"
              value={INR(summary.totalRevenue || 0)}
              change={summary.revenueChange}
              icon={IndianRupee}
            />
            <SummaryCard
              label="Orders"
              value={(summary.totalOrders || 0).toLocaleString()}
              change={summary.ordersChange}
              icon={Package}
            />
            <SummaryCard
              label="Avg Order Value"
              value={INR(summary.avgOrderValue || 0)}
              sub="per order"
              icon={ShoppingBag}
            />
            <SummaryCard
              label="New Customers"
              value={(summary.totalCustomers || 0).toLocaleString()}
              sub="registered in period"
              icon={Users}
            />
          </div>

          {/* ── Revenue Area Chart ── */}
          <div className="bg-card border border-border p-6 mb-6">
            <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-muted-foreground mb-5">Revenue (₹)</p>
            {timeline.every((t: any) => t.revenue === 0) ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No revenue data for this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={timeline} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#D4AF37" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip prefix="₹" />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#D4AF37" }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Orders Bar + Customers Line (side by side) ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

            {/* Orders Bar Chart */}
            <div className="bg-card border border-border p-6">
              <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-muted-foreground mb-5">Orders per {period === "12m" ? "Month" : period === "12w" ? "Week" : "Day"}</p>
              {timeline.every((t: any) => t.orders === 0) ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No orders in this period.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={timeline} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="orders" name="Orders" fill="#D4AF37" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* New Customers Line Chart */}
            <div className="bg-card border border-border p-6">
              <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-muted-foreground mb-5">New Customers</p>
              {timeline.every((t: any) => t.customers === 0) ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No new customers in this period.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={timeline} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="customers" name="Customers" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#3b82f6" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Order Status + Top Products (side by side) ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

            {/* Order Status Pie */}
            <div className="bg-card border border-border p-6">
              <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-muted-foreground mb-5">Order Status Breakdown</p>
              {statusData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No orders in this period.</div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <ResponsiveContainer width="100%" height={180} className="sm:w-[55%] sm:flex-shrink-0">
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                        {statusData.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`${v} orders`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap sm:flex-col gap-x-4 gap-y-2">
                    {statusData.map((s: any) => (
                      <div key={s.name} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <span className="capitalize text-muted-foreground">{s.name}</span>
                        <span className="font-semibold">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Top Products Table */}
            <div className="bg-card border border-border p-6">
              <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-muted-foreground mb-5">Top Products by Units Sold</p>
              {topProducts.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No product sales in this period.</div>
              ) : (
                <div className="space-y-1">
                  {topProducts.map((p: any, i: number) => {
                    const maxQty = topProducts[0]?.qty || 1;
                    const pct = Math.round((p.qty / maxQty) * 100);
                    return (
                      <div key={p.productId} className="py-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-muted-foreground/50 font-mono w-4 flex-shrink-0">{i + 1}</span>
                            <span className="truncate font-medium">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                            <span className="text-accent font-semibold">{p.qty} sold</span>
                            <span className="text-muted-foreground">{INR(p.revenue)}</span>
                          </div>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-[#D4AF37] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Full Timeline Table ── */}
          <div className="bg-card border border-border">
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-muted-foreground">Full Timeline Data</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Period</th>
                    <th className="text-right px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Revenue</th>
                    <th className="text-right px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Orders</th>
                    <th className="text-right px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">New Customers</th>
                    <th className="text-right px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Avg Order</th>
                  </tr>
                </thead>
                <tbody>
                  {[...timeline].reverse().map((t: any) => (
                    <tr key={t.key} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3 font-medium">{t.label}</td>
                      <td className="px-6 py-3 text-right font-medium text-accent">{INR(t.revenue)}</td>
                      <td className="px-6 py-3 text-right">{t.orders}</td>
                      <td className="px-6 py-3 text-right text-muted-foreground">{t.customers}</td>
                      <td className="px-6 py-3 text-right text-muted-foreground">
                        {t.orders > 0 ? INR(Math.round(t.revenue / t.orders)) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 font-semibold">
                    <td className="px-6 py-3 text-[10px] uppercase tracking-widest">Total</td>
                    <td className="px-6 py-3 text-right text-accent">{INR(summary.totalRevenue || 0)}</td>
                    <td className="px-6 py-3 text-right">{summary.totalOrders || 0}</td>
                    <td className="px-6 py-3 text-right text-muted-foreground">{summary.totalCustomers || 0}</td>
                    <td className="px-6 py-3 text-right text-muted-foreground">{INR(summary.avgOrderValue || 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
