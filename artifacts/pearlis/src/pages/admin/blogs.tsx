import { useState } from "react";
import { useListBlogs, useDeleteBlog, useCreateBlog, useUpdateBlog, getListBlogsQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Edit, Trash2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

type BlogForm = {
  title: string; excerpt: string; content: string;
  imageUrl: string; author: string; tags: string;
};

const emptyForm: BlogForm = { title: "", excerpt: "", content: "", imageUrl: "", author: "", tags: "" };

function toForm(b: any): BlogForm {
  return {
    title: b.title || "", excerpt: b.excerpt || "", content: b.content || "",
    imageUrl: b.imageUrl || "", author: b.author || "",
    tags: (b.tags || []).join(", "),
  };
}

export default function AdminBlogs() {
  const { data, isLoading } = useListBlogs({ limit: 100 });
  const deleteBlog = useDeleteBlog();
  const createBlog = useCreateBlog();
  const updateBlog = useUpdateBlog();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [modal, setModal] = useState<{ open: boolean; editId: number | null }>({ open: false, editId: null });
  const [form, setForm] = useState<BlogForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm(emptyForm); setModal({ open: true, editId: null }); };
  const openEdit = (blog: any) => { setForm(toForm(blog)); setModal({ open: true, editId: blog.id }); };
  const close = () => setModal({ open: false, editId: null });
  const set = (f: keyof BlogForm, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleDelete = (id: number) => {
    if (!confirm("Delete this post?")) return;
    deleteBlog.mutate({ id }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListBlogsQueryKey() }); toast({ title: "Post Deleted" }); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const handleSave = () => {
    if (!form.title || !form.excerpt || !form.content || !form.author) {
      toast({ title: "Fill all required fields", variant: "destructive" }); return;
    }
    setSaving(true);
    const payload = {
      title: form.title, excerpt: form.excerpt, content: form.content,
      imageUrl: form.imageUrl || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800",
      author: form.author,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    };
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListBlogsQueryKey() });
    if (modal.editId) {
      updateBlog.mutate({ id: modal.editId, data: payload }, {
        onSuccess: () => { invalidate(); toast({ title: "Post Updated" }); close(); setSaving(false); },
        onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); setSaving(false); },
      });
    } else {
      createBlog.mutate({ data: payload }, {
        onSuccess: () => { invalidate(); toast({ title: "Post Created" }); close(); setSaving(false); },
        onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); setSaving(false); },
      });
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl">Journal</h1>
        <Button className="rounded-none uppercase tracking-widest text-xs gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" /> New Post
        </Button>
      </div>

      <div className="bg-card border border-border">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-16">Cover</TableHead>
                <TableHead className="whitespace-nowrap">Title</TableHead>
                <TableHead className="whitespace-nowrap">Author</TableHead>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.blogs.map(blog => (
                <TableRow key={blog.id} className="border-border">
                  <TableCell>
                    <img src={blog.imageUrl} alt="" className="w-10 h-10 object-cover bg-muted" onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/40x40?text=?"; }} />
                  </TableCell>
                  <TableCell className="font-medium truncate max-w-[240px]">{blog.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{blog.author}</TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{format(new Date(blog.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="rounded-none h-8 w-8" onClick={() => openEdit(blog)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="rounded-none h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(blog.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={close}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-background border border-border w-full max-w-2xl my-8"
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-border">
                <h2 className="font-serif text-2xl">{modal.editId ? "Edit Post" : "New Post"}</h2>
                <button onClick={close} className="p-1 hover:bg-muted rounded-sm"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                <F label="Title *"><Input value={form.title} onChange={e => set("title", e.target.value)} className="rounded-none" placeholder="The Art of Gold Jewellery..." /></F>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Author *"><Input value={form.author} onChange={e => set("author", e.target.value)} className="rounded-none" placeholder="Aisha Patel" /></F>
                  <F label="Tags (comma separated)"><Input value={form.tags} onChange={e => set("tags", e.target.value)} className="rounded-none" placeholder="gold, bridal, trends" /></F>
                </div>
                <F label="Cover Image URL">
                  <div className="flex gap-2">
                    {form.imageUrl && <img src={form.imageUrl} alt="" className="w-12 h-12 object-cover bg-muted flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                    <Input value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} className="rounded-none" placeholder="https://images.unsplash.com/..." />
                  </div>
                </F>
                <F label="Excerpt *"><Textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)} className="rounded-none min-h-[80px]" placeholder="A brief introduction to the post..." /></F>
                <F label="Content *"><Textarea value={form.content} onChange={e => set("content", e.target.value)} className="rounded-none min-h-[200px]" placeholder="Full article content..." /></F>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-border">
                <Button variant="outline" className="rounded-none uppercase tracking-widest text-xs" onClick={close}>Cancel</Button>
                <Button className="rounded-none uppercase tracking-widest text-xs gap-2" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modal.editId ? "Save Changes" : "Publish Post"}
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
    <div className="space-y-2">
      <Label className="uppercase tracking-widest text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
