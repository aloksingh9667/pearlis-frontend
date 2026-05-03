import { useState } from "react";
import {
  useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Edit, Trash2, X, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type CatForm = { name: string; slug: string; imageUrl: string; description: string };

const empty: CatForm = { name: "", slug: "", imageUrl: "", description: "" };

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="uppercase tracking-widest text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function AdminCategories() {
  const { data: categories, isLoading } = useListCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [modal, setModal] = useState<{ open: boolean; editId: number | null }>({ open: false, editId: null });
  const [form, setForm] = useState<CatForm>(empty);
  const [saving, setSaving] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });

  const openAdd = () => { setForm(empty); setModal({ open: true, editId: null }); };
  const openEdit = (c: any) => {
    setForm({ name: c.name || "", slug: c.slug || "", imageUrl: c.imageUrl || "", description: c.description || "" });
    setModal({ open: true, editId: c.id });
  };
  const closeModal = () => setModal({ open: false, editId: null });
  const set = (field: keyof CatForm, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: f.slug || toSlug(name) }));
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: "Name and slug are required", variant: "destructive" }); return;
    }
    setSaving(true);
    const payload = { name: form.name.trim(), slug: form.slug.trim(), imageUrl: form.imageUrl || undefined, description: form.description || undefined };
    if (modal.editId) {
      updateCategory.mutate({ id: modal.editId, data: payload }, {
        onSuccess: () => { invalidate(); toast({ title: "Category updated" }); closeModal(); setSaving(false); },
        onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); setSaving(false); },
      });
    } else {
      createCategory.mutate({ data: payload }, {
        onSuccess: () => { invalidate(); toast({ title: "Category created" }); closeModal(); setSaving(false); },
        onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); setSaving(false); },
      });
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"? This won't delete products, but they'll lose their category link.`)) return;
    deleteCategory.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "Category deleted" }); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-serif text-3xl">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            These appear in the Jewellery dropdown in the navbar automatically.
          </p>
        </div>
        <Button className="rounded-none uppercase tracking-widest text-xs gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      <div className="bg-card border border-border">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : !categories?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="font-serif text-xl mb-2">No categories yet</p>
            <p className="text-sm">Add a category — it will appear in the Jewellery navbar dropdown immediately.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(categories as any[]).map((c: any) => (
                <TableRow key={c.id} className="border-border">
                  <TableCell>
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt="" className="w-10 h-10 object-cover bg-muted"
                        onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/40x40?text=?"; }} />
                    ) : (
                      <div className="w-10 h-10 bg-muted flex items-center justify-center text-muted-foreground text-xs">—</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium capitalize">{c.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-0.5 text-muted-foreground">{c.slug}</code>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[260px] truncate">{c.description || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="rounded-none h-8 w-8" onClick={() => openEdit(c)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-none h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(c.id, c.name)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {modal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={closeModal}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-background border border-border w-full max-w-lg my-8"
              onClick={e => e.stopPropagation()}>

              <div className="flex justify-between items-center p-6 border-b border-border">
                <h2 className="font-serif text-2xl">{modal.editId ? "Edit Category" : "Add Category"}</h2>
                <button onClick={closeModal} className="p-1 hover:bg-muted rounded-sm"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-5">
                <F label="Category Name *">
                  <Input value={form.name} onChange={e => handleNameChange(e.target.value)}
                    className="rounded-none" placeholder="Rings" />
                </F>

                <F label="URL Slug *">
                  <div className="flex gap-2 items-center">
                    <Input value={form.slug} onChange={e => set("slug", e.target.value)}
                      className="rounded-none flex-1" placeholder="rings" />
                    <Button variant="outline" size="icon" className="rounded-none h-10 w-10 flex-shrink-0"
                      title="Auto-generate from name" onClick={() => set("slug", toSlug(form.name))}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used in URL: <code className="bg-muted px-1">/category/{form.slug || "..."}</code>
                  </p>
                </F>

                <F label="Category Image URL">
                  <div className="flex gap-2 items-start">
                    {form.imageUrl && (
                      <img src={form.imageUrl} alt="" className="w-10 h-10 object-cover bg-muted flex-shrink-0"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    <Input value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)}
                      className="rounded-none" placeholder="https://images.unsplash.com/..." />
                  </div>
                </F>

                <F label="Description (optional)">
                  <Textarea value={form.description} onChange={e => set("description", e.target.value)}
                    className="rounded-none min-h-[80px]" placeholder="Handcrafted rings in 18K gold and platinum…" />
                </F>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-border">
                <Button variant="outline" className="rounded-none uppercase tracking-widest text-xs" onClick={closeModal}>Cancel</Button>
                <Button className="rounded-none uppercase tracking-widest text-xs gap-2" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modal.editId ? "Save Changes" : "Create Category"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
