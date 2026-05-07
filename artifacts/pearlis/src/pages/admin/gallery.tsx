import { useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Trash2, GalleryThumbnails, GripVertical, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetSettings, useUpdateSetting } from "@/lib/adminApi";
import { apiUrl } from "@/lib/apiUrl";
import { motion, AnimatePresence } from "framer-motion";

type GalleryImage = { url: string; alt: string };

export default function AdminGallery() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useGetSettings();
  const updateSetting = useUpdateSetting();

  const raw: GalleryImage[] = Array.isArray((settings as any)?.gallery)
    ? (settings as any).gallery
    : [];

  const [localImages, setLocalImages] = useState<GalleryImage[] | null>(null);
  const images: GalleryImage[] = localImages ?? raw;

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Upload multiple images ── */
  async function handleFiles(files: FileList) {
    setUploading(true);
    const token = localStorage.getItem("token");
    const uploaded: GalleryImage[] = [];

    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(apiUrl("/api/upload?folder=gallery/photos"), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!res.ok) continue;
        const data = await res.json();
        uploaded.push({ url: data.url, alt: file.name.replace(/\.[^.]+$/, "") });
      } catch {}
    }

    if (uploaded.length) {
      setLocalImages([...images, ...uploaded]);
      toast({ title: `${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} uploaded` });
    } else {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setUploading(false);
  }

  /* ── Save to settings ── */
  async function handleSave() {
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ key: "gallery", value: images });
      toast({ title: "Gallery saved!" });
      setLocalImages(null);
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete ── */
  function handleDelete(idx: number) {
    if (!confirm("Remove this photo from the gallery?")) return;
    setLocalImages(images.filter((_, i) => i !== idx));
  }

  /* ── Caption edit ── */
  function handleAlt(idx: number, value: string) {
    setLocalImages(images.map((img, i) => (i === idx ? { ...img, alt: value } : img)));
  }

  /* ── Drag-to-reorder ── */
  function onDragStart(idx: number) { setDragIdx(idx); }
  function onDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverIdx(idx); }
  function onDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...images];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setLocalImages(next);
    setDragIdx(null);
    setDragOverIdx(null);
  }
  function onDragEnd() { setDragIdx(null); setDragOverIdx(null); }

  const isDirty = localImages !== null;

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-serif tracking-wide">Gallery</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload, reorder, and manage your gallery photos. Drag to reorder.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-none text-xs uppercase tracking-widest gap-2"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Uploading..." : "Upload Photos"}
            </Button>
            <Button
              className="rounded-none text-xs uppercase tracking-widest gap-2 bg-[#D4AF37] hover:bg-[#c9a430] text-black"
              onClick={handleSave}
              disabled={!isDirty || saving}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : "Save Gallery"}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }}
          />
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 mb-6 text-xs text-muted-foreground uppercase tracking-widest border-b border-border pb-4">
          <span>{images.length} photo{images.length !== 1 ? "s" : ""}</span>
          {isDirty && <span className="text-[#D4AF37] font-semibold">● Unsaved changes</span>}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && images.length === 0 && (
          <div
            className="border-2 border-dashed border-border rounded-none flex flex-col items-center justify-center py-24 gap-4 cursor-pointer hover:border-[#D4AF37]/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <GalleryThumbnails className="w-10 h-10 text-muted-foreground/40" />
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">No photos yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Click to upload photos to your gallery</p>
            </div>
            <Button variant="outline" className="rounded-none text-xs uppercase tracking-widest gap-2 mt-2">
              <Upload className="w-3.5 h-3.5" /> Upload Photos
            </Button>
          </div>
        )}

        {/* Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {images.map((img, idx) => (
                <motion.div
                  key={img.url + idx}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.18 }}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={e => onDragOver(e, idx)}
                  onDrop={() => onDrop(idx)}
                  onDragEnd={onDragEnd}
                  className={`group relative border transition-all cursor-grab active:cursor-grabbing ${
                    dragOverIdx === idx
                      ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30 scale-[1.02]"
                      : dragIdx === idx
                      ? "opacity-40 border-border"
                      : "border-border hover:border-[#D4AF37]/40"
                  }`}
                >
                  {/* Image */}
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      draggable={false}
                    />
                  </div>

                  {/* Drag handle badge */}
                  <div className="absolute top-2 left-2 bg-black/60 text-white p-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-3 h-3" />
                  </div>

                  {/* Index badge */}
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm leading-none opacity-0 group-hover:opacity-100 transition-opacity">
                    {idx + 1}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(idx)}
                    className="absolute bottom-2 right-2 bg-red-600/90 hover:bg-red-600 text-white p-1.5 rounded-sm opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Caption input */}
                  <div className="p-2 border-t border-border bg-background/95">
                    <Input
                      value={img.alt}
                      onChange={e => handleAlt(idx, e.target.value)}
                      placeholder="Caption / alt text"
                      className="rounded-none h-7 text-xs border-0 border-b border-border focus-visible:ring-0 px-0 bg-transparent"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Upload tile */}
            <div
              className="aspect-square border-2 border-dashed border-border hover:border-[#D4AF37]/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group"
              onClick={() => fileRef.current?.click()}
            >
              {uploading
                ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                : <Upload className="w-5 h-5 text-muted-foreground/40 group-hover:text-[#D4AF37] transition-colors" />}
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 group-hover:text-[#D4AF37] transition-colors">
                {uploading ? "Uploading..." : "Add More"}
              </span>
            </div>
          </div>
        )}

        {/* Bottom save bar */}
        {isDirty && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#0F0F0F] text-white px-5 py-3 shadow-2xl border border-[#D4AF37]/30">
            <span className="text-xs tracking-widest uppercase">You have unsaved changes</span>
            <Button
              size="sm"
              className="rounded-none text-xs bg-[#D4AF37] hover:bg-[#c9a430] text-black uppercase tracking-widest h-8"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Save
            </Button>
            <button
              className="text-xs text-white/50 hover:text-white transition-colors uppercase tracking-widest"
              onClick={() => setLocalImages(null)}
            >
              Discard
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
