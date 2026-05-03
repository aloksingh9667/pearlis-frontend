import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const fmt = (usd: number) => `₹${Math.round(usd * 83).toLocaleString("en-IN")}`;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  confirmed: "bg-blue-50 text-blue-700",
  processing: "bg-purple-50 text-purple-700",
  shipped: "bg-cyan-50 text-cyan-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
};

export default function AdminOrders() {
  const { data, isLoading } = useListOrders({ limit: 100 });
  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      <div className="mb-8">
        <h1 className="font-serif text-3xl">Orders <span className="text-muted-foreground text-lg font-sans font-normal ml-2">({data?.total || 0})</span></h1>
      </div>

      <div className="bg-card border border-border p-0">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : !data?.orders?.length ? (
          <div className="py-16 text-center text-muted-foreground font-serif text-xl">No orders yet</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total (INR)</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.orders.map((order: any) => (
                <TableRow key={order.id} className="border-border">
                  <TableCell className="font-mono font-medium text-sm">#{order.id.toString().padStart(6, "0")}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(order.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{order.customerName || "Guest"}</p>
                      {order.customerEmail && <p className="text-xs text-muted-foreground">{order.customerEmail}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{order.items?.length || "—"}</TableCell>
                  <TableCell className="font-semibold text-sm">{fmt(order.total)}</TableCell>
                  <TableCell>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">{order.paymentMethod || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <Select defaultValue={order.status} onValueChange={(val) => handleStatusChange(order.id, val)}>
                      <SelectTrigger className={`w-[130px] h-7 text-xs rounded-none border-0 px-2 font-medium uppercase tracking-widest ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {["pending","confirmed","processing","shipped","delivered","cancelled"].map(s => (
                          <SelectItem key={s} value={s} className="text-xs uppercase tracking-widest">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AdminLayout>
  );
}
