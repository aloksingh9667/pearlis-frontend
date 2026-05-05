import { useState } from "react";
import { useListCoupons, useDeleteCoupon, useCreateCoupon, getListCouponsQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, X, Tag, ToggleLeft, ToggleRight, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/lib/apiUrl";

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtINR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const fromINR = (n: number) => n / 83;

type CouponForm = {
  code: string; discountType: "percentage" | "fixed";
  discountValue: string; minOrderAmount: string;
  maxUses: string; expiresAt: string;
};

const emptyForm: CouponForm = {
  code: "", discountType: "percentage",
  discountValue: "", minOrderAmount: "",
  maxUses: "", expiresAt: "",
};

async function toggleCoupon(id: number, isActive: boolean, token: string | null) {
  const res = await fetch(apiUrl(`/api/coupons/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export default function AdminCoupons() {
  const { data: coupons, isLoading } = useListCoupons();
  const deleteCoupon = useDeleteCoupon();
  const createCoupon = useCreateCoupon();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  const set = (f: keyof CouponForm, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleDelete = (id: number) => {
    if (!confirm("Delete this coupon? This cannot be undone.")) return;
    deleteCoupon.mutate({ id }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListCouponsQueryKey() }); toast({ title: "Coupon Deleted" }); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const handleToggle = async (coupon: any) => {
    setToggling(coupon.id);
    try {
      const token = localStorage.getItem("token");
      await toggleCoupon(coupon.id, !coupon.isActive, token);
      queryClient.invalidateQueries({ queryKey: getListCouponsQueryKey() });
      toast({ title: coupon.isActive ? "Coupon Deactivated" : "Coupon Activated" });
    } catch {
      toast({ title: "Failed to update coupon", variant: "destructive" });
    } finally {
      setToggling(null);
    }
  };

  const handleCreate = () => {
    if (!form.code || !form.discountValue) {
      toast({ title: "Code and discount value are required", variant: "destructive" }); return;
    }
    setSaving(true);

    const discountValue = form.discountType === "percentage"
      ? parseFloat(form.discountValue)
      : fromINR(parseFloat(form.discountValue));

    const minOrderAmount = form.minOrderAmount
      ? fromINR(parseFloat(form.minOrderAmount))
      : undefined;

    createCoupon.mutate({
      data: {
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue,
        minOrderAmount,
        maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
      } as any,
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCouponsQueryKey() });
        toast({ title: "✓ Coupon Created", description: `${form.code.toUpperCase()} is now active and ready to use at checkout.` });
        setShowModal(false);
        setForm(emptyForm);
        setSaving(false);
      },
      onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); setSaving(false); },
    });
  };

  const fmtDiscount = (coupon: any) =>
    coupon.discountType === "percentage"
      ? `${coupon.discountValue}% off`
      : `${fmtINR(Math.round(coupon.discountValue * 83))} off`;

  const activeCoupons = (coupons || []).filter((c: any) => c.isActive);
  const inactiveCoupons = (coupons || []).filter((c: any) => !c.isActive);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 className="font-serif text-3xl">Coupons</h1>
          <p className="text-muted-foreground text-sm mt-1">Create discount codes for customers to use at checkout.</p>
        </div>
        <Button className="rounded-none uppercase tracking-widest text-xs gap-2" onClick={() => { setForm(emptyForm); setShowModal(true); }}>
          <Plus className="w-4 h-4" /> Create Coupon
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-accent/5 border border-accent/20 mb-6 text-sm">
        <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p className="text-muted-foreground leading-relaxed">
          Customers enter coupon codes at checkout. Each code auto-validates against minimum order, expiry, and usage limits.
          Create a code like <span className="font-mono text-accent bg-accent/10 px-1.5 py-0.5 text-xs">PEARLIS10</span> for 10% off,
          or a fixed discount like <span className="font-mono text-accent bg-accent/10 px-1.5 py-0.5 text-xs">SAVE500</span> for ₹500 off.
        </p>
      </div>

      {/* Stats */}
      {!isLoading && (coupons || []).length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Coupons", value: (coupons || []).length },
            { label: "Active", value: activeCoupons.length },
            { label: "Total Uses", value: (coupons || []).reduce((s: number, c: any) => s + (c.usedCount || 0), 0) },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border p-4 text-center">
              <p className="font-serif text-2xl text-accent">{stat.value}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : (coupons || []).length === 0 ? (
          <div className="py-16 text-center">
            <Tag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">No coupons yet.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Click "Create Coupon" to add your first discount code.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="whitespace-nowrap">Code</TableHead>
                <TableHead className="whitespace-nowrap">Discount</TableHead>
                <TableHead className="whitespace-nowrap">Min Order</TableHead>
                <TableHead className="whitespace-nowrap">Uses</TableHead>
                <TableHead className="whitespace-nowrap">Expires</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(coupons || []).map((coupon: any) => (
                <TableRow key={coupon.id} className={`border-border ${!coupon.isActive ? "opacity-50" : ""}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="font-mono font-bold tracking-widest uppercase text-sm">{coupon.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-accent text-sm">{fmtDiscount(coupon)}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {coupon.minOrderAmount ? fmtINR(Math.round(coupon.minOrderAmount * 83)) : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="font-medium">{coupon.usedCount || 0}</span>
                    <span className="text-muted-foreground"> / {coupon.maxUses || "∞"}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {coupon.expiresAt ? fmtDate(coupon.expiresAt) : <span className="text-green-600 text-xs">Never</span>}
                  </TableCell>
                  <TableCell>
                    <span className={`text-[10px] px-2 py-1 uppercase tracking-widest font-medium ${
                      coupon.isActive ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-muted text-muted-foreground"
                    }`}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="sm"
                        className={`rounded-none h-8 px-3 text-xs gap-1.5 ${coupon.isActive ? "text-muted-foreground hover:text-foreground" : "text-accent hover:text-accent"}`}
                        onClick={() => handleToggle(coupon)}
                        disabled={toggling === coupon.id}
                        title={coupon.isActive ? "Deactivate" : "Activate"}
                      >
                        {toggling === coupon.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : coupon.isActive ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                        {coupon.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-none h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(coupon.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-background border border-border w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-border">
                <h2 className="font-serif text-2xl">Create Coupon</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded-sm"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <F label="Coupon Code *">
                  <Input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())} className="rounded-none font-mono tracking-widest uppercase" placeholder="PEARLIS10" />
                  <p className="text-xs text-muted-foreground">Customers type this at checkout. Keep it short and memorable.</p>
                </F>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Discount Type">
                    <Select value={form.discountType} onValueChange={v => set("discountType", v as any)}>
                      <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </F>
                  <F label={form.discountType === "percentage" ? "Discount %" : "Amount Off (₹)"}>
                    <Input type="number" min="0" value={form.discountValue} onChange={e => set("discountValue", e.target.value)} className="rounded-none"
                      placeholder={form.discountType === "percentage" ? "10" : "500"} />
                    {form.discountValue && (
                      <p className="text-xs text-accent mt-1">
                        {form.discountType === "percentage"
                          ? `${form.discountValue}% off total`
                          : `₹${parseInt(form.discountValue || "0").toLocaleString("en-IN")} off`}
                      </p>
                    )}
                  </F>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Min Order Amount (₹)">
                    <Input type="number" min="0" value={form.minOrderAmount} onChange={e => set("minOrderAmount", e.target.value)} className="rounded-none" placeholder="e.g. 2000" />
                    {form.minOrderAmount && (
                      <p className="text-xs text-muted-foreground mt-1">Min ₹{parseInt(form.minOrderAmount).toLocaleString("en-IN")}</p>
                    )}
                  </F>
                  <F label="Max Uses (blank = unlimited)">
                    <Input type="number" min="1" value={form.maxUses} onChange={e => set("maxUses", e.target.value)} className="rounded-none" placeholder="Unlimited" />
                  </F>
                </div>
                <F label="Expiry Date (leave blank for no expiry)">
                  <Input type="date" value={form.expiresAt} onChange={e => set("expiresAt", e.target.value)} className="rounded-none" />
                </F>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-border">
                <Button variant="outline" className="rounded-none uppercase tracking-widest text-xs" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="rounded-none uppercase tracking-widest text-xs gap-2" onClick={handleCreate} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Coupon
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="uppercase tracking-widest text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
