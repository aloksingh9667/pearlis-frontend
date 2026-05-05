import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, Trash2, CheckCircle, XCircle, Search, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

import { apiUrl } from "@/lib/apiUrl";

function adminFetch(url: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("token");
  return fetch(apiUrl(url), {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`w-3 h-3 ${s <= rating ? "text-[#D4AF37] fill-[#D4AF37]" : "text-[#D4AF37]/25"}`} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const r = await adminFetch("/api/admin/reviews");
      if (!r.ok) throw new Error("Failed to load reviews");
      return r.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await adminFetch(`/api/admin/reviews/${id}/approve`, { method: "PATCH" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reviews"] }); toast({ title: "Review approved" }); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await adminFetch(`/api/admin/reviews/${id}/reject`, { method: "PATCH" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reviews"] }); toast({ title: "Review hidden" }); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await adminFetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reviews"] }); toast({ title: "Review deleted" }); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const filtered = reviews.filter((r: any) => {
    const matchSearch = !search ||
      r.userName?.toLowerCase().includes(search.toLowerCase()) ||
      r.productName?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ? true :
      filter === "approved" ? r.isApproved :
      !r.isApproved;
    return matchSearch && matchFilter;
  });

  const total = reviews.length;
  const approved = reviews.filter((r: any) => r.isApproved).length;
  const pending = total - approved;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#0F0F0F] mb-1">Customer Reviews</h1>
          <p className="text-sm text-muted-foreground">Moderate and manage all product reviews</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Reviews", value: total, color: "text-[#0F0F0F]" },
            { label: "Approved", value: approved, color: "text-green-600" },
            { label: "Hidden", value: pending, color: "text-amber-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="border border-border p-4 bg-card">
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">{label}</p>
              <p className={`font-serif text-3xl ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, product, or comment..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-none"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "approved", "pending"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-[11px] uppercase tracking-widest font-medium border transition-colors ${
                  filter === f
                    ? "bg-[#0F0F0F] text-white border-[#0F0F0F]"
                    : "border-border text-muted-foreground hover:border-[#0F0F0F] hover:text-[#0F0F0F]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-border">
            <Star className="w-8 h-8 mx-auto mb-3 text-[#D4AF37]/30" />
            <p className="font-serif text-xl mb-1">No reviews found</p>
            <p className="text-sm">{search ? "Try adjusting your search" : "Reviews will appear here when customers submit them"}</p>
          </div>
        ) : (
          <div className="border border-border divide-y divide-border">
            {filtered.map((r: any) => (
              <div key={r.id} className={`p-5 sm:p-6 transition-colors ${r.isApproved ? "bg-card" : "bg-amber-50/40"}`}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Avatar + meta */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] font-bold text-sm flex-shrink-0">
                      {r.userName?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm text-[#0F0F0F]">{r.userName}</span>
                        {!r.isApproved && (
                          <span className="text-[9px] uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 font-semibold">Hidden</span>
                        )}
                        {r.isApproved && (
                          <span className="text-[9px] uppercase tracking-widest bg-green-50 text-green-600 px-2 py-0.5 font-semibold">Visible</span>
                        )}
                      </div>
                      <StarRow rating={r.rating} />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        on{" "}
                        <Link href={`/product/${r.productId}`} className="text-[#D4AF37] hover:underline">
                          {r.productName || `Product #${r.productId}`}
                        </Link>
                        {" · "}
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                      </p>
                      <p className="text-sm text-[#0F0F0F]/70 mt-2 leading-relaxed">{r.comment}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.isApproved ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none text-[10px] uppercase tracking-widest h-8 px-3 border-amber-300 text-amber-600 hover:bg-amber-50"
                        onClick={() => rejectMutation.mutate(r.id)}
                        disabled={rejectMutation.isPending}
                      >
                        {rejectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <EyeOff className="w-3 h-3 mr-1.5" />}
                        Hide
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none text-[10px] uppercase tracking-widest h-8 px-3 border-green-300 text-green-600 hover:bg-green-50"
                        onClick={() => approveMutation.mutate(r.id)}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1.5" />}
                        Approve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-none text-[10px] uppercase tracking-widest h-8 px-3 border-red-200 text-red-500 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("Permanently delete this review?")) deleteMutation.mutate(r.id);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
