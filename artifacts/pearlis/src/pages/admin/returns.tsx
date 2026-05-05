import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Check, X, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiUrl, adminHeaders } from "@/lib/apiUrl";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

type ReturnRequest = {
  id: number;
  order_id: number;
  user_id: number | null;
  customer_name: string | null;
  customer_email: string | null;
  reason: string;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-yellow-50 text-yellow-700 border-yellow-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

async function fetchReturnRequests(status: string): Promise<ReturnRequest[]> {
  const res = await fetch(
    apiUrl(`/api/admin/return-requests${status !== "all" ? `?status=${status}` : ""}`),
    { headers: adminHeaders() }
  );
  if (!res.ok) throw new Error("Failed to load return requests");
  return res.json();
}

async function updateReturnRequest(id: number, status: string, adminNote: string) {
  const res = await fetch(apiUrl(`/api/admin/return-requests/${id}`), {
    method: "PATCH",
    headers: { ...adminHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ status, adminNote }),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

function RequestCard({ req, onUpdate }: { req: ReturnRequest; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(req.admin_note || "");
  const { toast } = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ status }: { status: string }) => updateReturnRequest(req.id, status, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-return-requests"] });
      toast({ title: "Return request updated" });
      onUpdate();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="border border-border bg-card">
      {/* Summary Row */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
          <span className="font-mono text-sm font-semibold text-accent flex-shrink-0">
            #{String(req.order_id).padStart(6, "0")}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{req.customer_name || "Unknown"}</p>
            {req.customer_email && (
              <p className="text-xs text-muted-foreground truncate">{req.customer_email}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded capitalize flex-shrink-0">
            {req.reason}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 border ${STATUS_COLORS[req.status] || "bg-muted"}`}>
            {req.status}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {format(new Date(req.created_at), "MMM d, yyyy")}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        </div>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border p-4 sm:p-6 space-y-4">
              {req.description && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Customer Description</p>
                  <p className="text-sm text-foreground bg-muted/30 p-3 border border-border">{req.description}</p>
                </div>
              )}

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" /> Admin Note (internal)
                </p>
                <Textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add an internal note about this return request..."
                  className="rounded-none text-sm resize-none"
                  rows={3}
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {req.status !== "approved" && (
                  <Button
                    size="sm"
                    className="rounded-none gap-1.5 uppercase tracking-widest text-xs bg-green-600 hover:bg-green-700"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ status: "approved" })}
                  >
                    {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve
                  </Button>
                )}
                {req.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-none gap-1.5 uppercase tracking-widest text-xs"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ status: "rejected" })}
                  >
                    {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    Reject
                  </Button>
                )}
                {req.status !== "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none gap-1.5 uppercase tracking-widest text-xs"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ status: "pending" })}
                  >
                    Reset to Pending
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none gap-1.5 uppercase tracking-widest text-xs"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ status: req.status })}
                >
                  Save Note
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminReturns() {
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-return-requests", filter],
    queryFn: () => fetchReturnRequests(filter),
  });

  const pending = data.filter(r => r.status === "pending").length;
  const approved = data.filter(r => r.status === "approved").length;
  const rejected = data.filter(r => r.status === "rejected").length;

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl">Returns & Refunds</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage customer return and refund requests.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "All Requests", value: data.length, id: "all" },
          { label: "Pending",      value: pending,    id: "pending"  },
          { label: "Approved",     value: approved,   id: "approved" },
          { label: "Rejected",     value: rejected,   id: "rejected" },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={`bg-card border p-4 text-center transition-colors ${
              filter === s.id ? "border-accent" : "border-border hover:border-border/60"
            }`}
          >
            <p className={`font-serif text-2xl font-bold ${filter === s.id ? "text-accent" : ""}`}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-border overflow-x-auto pb-px">
        {["all", "pending", "approved", "rejected"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2.5 text-[10px] uppercase tracking-widest font-semibold transition-colors whitespace-nowrap border-b-2 -mb-px ${
              filter === f
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : error ? (
        <div className="text-center py-16 text-destructive text-sm">Failed to load return requests.</div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <RotateCcw className="w-12 h-12 opacity-20" />
          <p className="font-serif text-xl">No return requests</p>
          <p className="text-sm">{filter !== "all" ? `No ${filter} requests found.` : "Customers haven't submitted any return requests yet."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map(req => (
            <RequestCard key={req.id} req={req} onUpdate={() => qc.invalidateQueries({ queryKey: ["admin-return-requests"] })} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
