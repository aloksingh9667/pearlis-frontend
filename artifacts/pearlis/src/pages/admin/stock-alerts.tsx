import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Search, CheckCircle, Clock, Download, Send, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiUrl, adminHeaders } from "@/lib/apiUrl";

function adminFetch(url: string) {
  const token = localStorage.getItem("token");
  return fetch(apiUrl(url), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

type Alert = {
  id: number;
  email: string;
  productId: number;
  productName: string | null;
  notifiedAt: string | null;
  createdAt: string;
};

type GroupedProduct = {
  productId: number;
  productName: string;
  total: number;
  pending: number;
  notified: number;
  subscribers: Alert[];
};

export default function AdminStockAlerts() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [notifying, setNotifying] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  async function handleDeleteAlert(id: number) {
    if (!confirm("Remove this subscriber from the alert list?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(apiUrl(`/api/admin/stock-alerts/${id}`), { method: "DELETE", headers: adminHeaders() });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Subscriber removed" });
      queryClient.invalidateQueries({ queryKey: ["admin-stock-alerts"] });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteProduct(productId: number, productName: string) {
    if (!confirm(`Delete ALL ${productName} alert subscribers? This cannot be undone.`)) return;
    setDeletingProduct(productId);
    try {
      const res = await fetch(apiUrl(`/api/admin/stock-alerts/product/${productId}`), { method: "DELETE", headers: adminHeaders() });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "All alerts deleted", description: `Removed all subscribers for ${productName}` });
      queryClient.invalidateQueries({ queryKey: ["admin-stock-alerts"] });
      setExpanded(null);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setDeletingProduct(null);
    }
  }

  const { data, isLoading, error } = useQuery<Alert[]>({
    queryKey: ["admin-stock-alerts"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/stock-alerts");
      if (!res.ok) throw new Error("Failed to load stock alerts");
      return res.json();
    },
  });

  const grouped: GroupedProduct[] = [];
  if (data) {
    const map = new Map<number, GroupedProduct>();
    for (const row of data) {
      if (!map.has(row.productId)) {
        map.set(row.productId, {
          productId: row.productId,
          productName: row.productName ?? `Product #${row.productId}`,
          total: 0,
          pending: 0,
          notified: 0,
          subscribers: [],
        });
      }
      const g = map.get(row.productId)!;
      g.total++;
      if (row.notifiedAt) g.notified++;
      else g.pending++;
      g.subscribers.push(row);
    }
    grouped.push(...map.values());
    grouped.sort((a, b) => b.pending - a.pending);
  }

  const filtered = grouped.filter((g) =>
    g.productName.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPending = grouped.reduce((s, g) => s + g.pending, 0);
  const totalNotified = grouped.reduce((s, g) => s + g.notified, 0);

  async function handleNotify(g: GroupedProduct) {
    if (g.pending === 0) return;
    if (!confirm(`Send back-in-stock emails to ${g.pending} customer${g.pending !== 1 ? "s" : ""} waiting for "${g.productName}"?`)) return;

    setNotifying(g.productId);
    try {
      const res = await fetch(apiUrl(`/api/admin/stock-alerts/${g.productId}/notify`), {
        method: "POST",
        headers: adminHeaders(),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to send notifications");
      toast({
        title: "Notifications Sent",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-stock-alerts"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setNotifying(null);
    }
  }

  function exportAllCSV() {
    if (!data || data.length === 0) return;
    const rows = [
      "Email,Product,Product ID,Status,Subscribed At,Notified At",
      ...data.map((a) =>
        [
          a.email,
          `"${(a.productName ?? `Product #${a.productId}`).replace(/"/g, '""')}"`,
          a.productId,
          a.notifiedAt ? "Notified" : "Waiting",
          format(new Date(a.createdAt), "yyyy-MM-dd HH:mm"),
          a.notifiedAt ? format(new Date(a.notifiedAt), "yyyy-MM-dd HH:mm") : "",
        ].join(",")
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-alerts-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportProductCSV(g: GroupedProduct) {
    const rows = [
      "Email,Status,Subscribed At,Notified At",
      ...g.subscribers.map((s) =>
        [
          s.email,
          s.notifiedAt ? "Notified" : "Waiting",
          format(new Date(s.createdAt), "yyyy-MM-dd HH:mm"),
          s.notifiedAt ? format(new Date(s.notifiedAt), "yyyy-MM-dd HH:mm") : "",
        ].join(",")
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-alerts-${g.productName.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-serif tracking-wide">Stock Alerts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Customers waiting for out-of-stock products
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAllCSV}
            disabled={!data || data.length === 0}
            className="gap-2 text-xs tracking-widest uppercase"
          >
            <Download className="w-3.5 h-3.5" />
            Export All CSV
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-sm p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Products</p>
            <p className="text-2xl font-semibold">{grouped.length}</p>
          </div>
          <div className="bg-card border border-border rounded-sm p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Pending Alerts</p>
            <p className="text-2xl font-semibold text-amber-600">{totalPending}</p>
          </div>
          <div className="bg-card border border-border rounded-sm p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Notified</p>
            <p className="text-2xl font-semibold text-green-600">{totalNotified}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : error ? (
          <p className="text-center text-destructive py-10">Failed to load alerts.</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No stock alerts yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((g) => (
              <div key={g.productId} className="bg-card border border-border rounded-sm overflow-hidden">
                {/* Row header */}
                <div className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors">
                  {/* Left: expand toggle + name */}
                  <button
                    onClick={() => setExpanded(expanded === g.productId ? null : g.productId)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
                    <Bell className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium truncate">{g.productName}</span>
                  </button>

                  {/* Right: counts + actions */}
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="hidden sm:flex items-center gap-1.5 text-sm text-amber-600">
                      <Clock className="w-3.5 h-3.5" />
                      {g.pending} pending
                    </span>
                    <span className="hidden sm:flex items-center gap-1.5 text-sm text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {g.notified} notified
                    </span>

                    {/* Notify button — only shown when pending > 0 */}
                    {g.pending > 0 && (
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleNotify(g); }}
                        disabled={notifying === g.productId}
                        className="gap-1.5 text-xs h-8 bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        {notifying === g.productId ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending…</>
                        ) : (
                          <><Send className="w-3.5 h-3.5" />Notify {g.pending}</>
                        )}
                      </Button>
                    )}

                    {g.pending === 0 && (
                      <span className="text-xs text-muted-foreground/50 px-2">All notified</span>
                    )}

                    {/* CSV export for this product */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); exportProductCSV(g); }}
                      className="gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 h-7"
                      title="Export CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>

                    {/* Delete all alerts for this product */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDeleteProduct(g.productId, g.productName); }}
                      disabled={deletingProduct === g.productId}
                      className="gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-2 h-7"
                      title="Delete all alerts for this product"
                    >
                      {deletingProduct === g.productId
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>

                    {/* Expand chevron */}
                    <button
                      onClick={() => setExpanded(expanded === g.productId ? null : g.productId)}
                      className="p-1 text-muted-foreground"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${expanded === g.productId ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded subscriber list */}
                {expanded === g.productId && (
                  <div className="border-t border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/40">
                          <th className="text-left px-5 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                          <th className="text-left px-5 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Subscribed</th>
                          <th className="text-left px-5 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                          <th className="px-5 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.subscribers.map((s) => (
                          <tr key={s.id} className="border-t border-border/50 hover:bg-muted/20">
                            <td className="px-5 py-3">{s.email}</td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {new Date(s.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                              })}
                            </td>
                            <td className="px-5 py-3">
                              {s.notifiedAt ? (
                                <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                                  <CheckCircle className="w-3 h-3" />
                                  Notified {format(new Date(s.notifiedAt), "MMM d")}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                                  <Clock className="w-3 h-3" /> Waiting
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <button
                                onClick={() => handleDeleteAlert(s.id)}
                                disabled={deletingId === s.id}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors disabled:opacity-50"
                                title="Remove subscriber"
                              >
                                {deletingId === s.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
