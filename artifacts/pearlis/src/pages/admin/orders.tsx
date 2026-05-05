import { useState } from "react";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const fmt = (usd: number) => `₹${Math.round(usd * 83).toLocaleString("en-IN")}`;

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-50 text-yellow-700",
  confirmed:  "bg-blue-50 text-blue-700",
  processing: "bg-purple-50 text-purple-700",
  shipped:    "bg-cyan-50 text-cyan-700",
  delivered:  "bg-green-50 text-green-700",
  cancelled:  "bg-red-50 text-red-600",
};

const STATUSES = ["pending","confirmed","processing","shipped","delivered","cancelled"];

export default function AdminOrders() {
  const { data, isLoading } = useListOrders({ limit: 100 });
  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleStatusChange = (id: number, status: any) => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          toast({ title: "Status Updated" });
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <AdminLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl">
          Orders <span className="text-muted-foreground text-base sm:text-lg font-sans font-normal ml-2">({data?.total || 0})</span>
        </h1>
      </div>

      <div className="bg-card border border-border p-0">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : !data?.orders?.length ? (
          <div className="py-16 text-center text-muted-foreground font-serif text-xl">No orders yet</div>
        ) : (
          <>
            {/* ── Desktop Table (hidden on mobile) ── */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="whitespace-nowrap">Order ID</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Customer</TableHead>
                    <TableHead className="whitespace-nowrap">Items</TableHead>
                    <TableHead className="whitespace-nowrap">Total (INR)</TableHead>
                    <TableHead className="whitespace-nowrap">Payment</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.orders.map((order: any) => (
                    <TableRow key={order.id} className="border-border">
                      <TableCell className="font-mono font-medium text-sm whitespace-nowrap">#{order.id.toString().padStart(6, "0")}</TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{format(new Date(order.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{order.customerName || "Guest"}</p>
                          {order.customerEmail && <p className="text-xs text-muted-foreground">{order.customerEmail}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{order.items?.length || "—"}</TableCell>
                      <TableCell className="font-semibold text-sm whitespace-nowrap">{fmt(order.total)}</TableCell>
                      <TableCell>
                        <span className="text-xs uppercase tracking-widest text-muted-foreground">{order.paymentMethod || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <Select defaultValue={order.status} onValueChange={(val) => handleStatusChange(order.id, val)}>
                          <SelectTrigger className={`w-[130px] h-7 text-xs rounded-none border-0 px-2 font-medium uppercase tracking-widest ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-none">
                            {STATUSES.map(s => (
                              <SelectItem key={s} value={s} className="text-xs uppercase tracking-widest">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* ── Mobile Cards (shown only on mobile) ── */}
            <div className="md:hidden divide-y divide-border">
              {data?.orders.map((order: any) => {
                const isOpen = expandedId === order.id;
                return (
                  <div key={order.id}>
                    {/* Card Header */}
                    <button
                      className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-muted/20 transition-colors"
                      onClick={() => setExpandedId(isOpen ? null : order.id)}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Package className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-accent text-sm">#{order.id.toString().padStart(6, "0")}</span>
                            <span className={`text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-sm ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm font-medium mt-0.5 truncate">{order.customerName || "Guest"}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-semibold text-sm">{fmt(order.total)}</span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                    </button>

                    {/* Expanded Card Detail */}
                    {isOpen && (
                      <div className="px-4 pb-4 space-y-3 bg-muted/10 border-t border-border">
                        <div className="grid grid-cols-2 gap-2 pt-3 text-sm">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Email</p>
                            <p className="mt-0.5 truncate text-xs">{order.customerEmail || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Items</p>
                            <p className="mt-0.5 text-xs">{order.items?.length || "—"} item{(order.items?.length || 0) !== 1 ? "s" : ""}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Payment</p>
                            <p className="mt-0.5 text-xs uppercase">{order.paymentMethod || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</p>
                            <p className="mt-0.5 font-semibold text-sm">{fmt(order.total)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Update Status</p>
                          <Select defaultValue={order.status} onValueChange={(val) => handleStatusChange(order.id, val)}>
                            <SelectTrigger className="w-full h-9 text-xs rounded-none font-medium uppercase tracking-widest">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                              {STATUSES.map(s => (
                                <SelectItem key={s} value={s} className="text-xs uppercase tracking-widest">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
