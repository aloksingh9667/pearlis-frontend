import { useState, useEffect, useRef } from "react";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Plus, Trash2, Upload, X, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetPageContent, useUpdatePageContent } from "@/lib/adminApi";
import { useListCategories } from "@workspace/api-client-react";
import { apiUrl, adminHeaders } from "@/lib/apiUrl";

/* ── Static pages always present ── */
const STATIC_PAGES = [
  { id: "home", label: "🏠 Home" },
  { id: "shop", label: "🛍️ Shop" },
  { id: "gallery", label: "🖼️ Gallery" },
  { id: "blog", label: "📝 Blog" },
  { id: "about", label: "ℹ️ About" },
];

const CAT_EMOJIS: Record<string, string> = {
  rings: "💍", necklaces: "📿", bracelets: "✨", earrings: "🪙",
  pendants: "🔮", bangles: "⭕", anklets: "🦶",
};

async function uploadImage(file: File): Promise<string> {
  return uploadToCloudinary(file, "page-content/sections", "image");
}

/* ── Image field: URL text input + upload button ── */
function ImageUploadField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
      toast({ title: "Image uploaded!" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <Label className="uppercase tracking-widest text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="rounded-none flex-1 text-sm"
          placeholder="https://... or upload →"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 h-10 px-3 border border-border hover:border-accent bg-muted/40 hover:bg-accent/8 transition-colors flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent"
          title="Upload image"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Upload</span>
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex-shrink-0 h-10 w-10 border border-border hover:border-destructive text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
            title="Clear"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      </div>
      {value && value.startsWith("/api/uploads/") && (
        <img src={value} alt="preview" className="h-20 object-cover border border-border mt-1" />
      )}
    </div>
  );
}

export default function AdminPageContent() {
  const { data: categoriesData } = useListCategories({});
  const { toast } = useToast();

  /* Build dynamic PAGES list */
  const catPages = (Array.isArray(categoriesData) ? categoriesData : []).map((c: { slug: string; name: string }) => ({
    id: c.slug,
    label: `${CAT_EMOJIS[c.slug] ?? "🏷️"} ${c.name}`,
  }));
  const PAGES = [...STATIC_PAGES, ...catPages];

  const [activePage, setActivePage] = useState("home");
  const { data, isLoading } = useGetPageContent(activePage);
  const update = useUpdatePageContent();
  const [draft, setDraft] = useState<any>({});

  useEffect(() => {
    if (data?.content) setDraft(data.content);
    else setDraft({});
  }, [data, activePage]);

  const handleSave = () => {
    update.mutate(
      { page: activePage, content: draft },
      {
        onSuccess: () => toast({ title: "Saved!", description: `${activePage} page content updated.` }),
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  function setField(path: string[], value: any) {
    setDraft((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) {
        if (!obj[path[i]]) obj[path[i]] = {};
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return next;
    });
  }

  /* Detect if the active page is a category page (not in static list) */
  const isStaticPage = STATIC_PAGES.some(p => p.id === activePage);
  const isCategoryPage = !isStaticPage && activePage !== "home";

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl">Page Content</h1>
        <Button onClick={handleSave} disabled={update.isPending || isLoading} className="rounded-none uppercase tracking-widest text-xs gap-2">
          {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Page Selector */}
        <nav className="md:w-52 flex md:flex-col gap-1 overflow-x-auto flex-shrink-0">
          {PAGES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`px-4 py-2.5 text-sm text-left whitespace-nowrap rounded-sm transition-colors ${
                activePage === id
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Content Editor */}
        <div className="flex-1 bg-card border border-border p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : (
            <div className="space-y-8">

              {/* ── HOME ── */}
              {activePage === "home" && (
                <>
                  <SubSection title="Hero Section">
                    <F label="Title"><Input value={draft.hero?.title || ""} onChange={e => setField(["hero","title"], e.target.value)} className="rounded-none" /></F>
                    <F label="Subtitle"><Textarea value={draft.hero?.subtitle || ""} onChange={e => setField(["hero","subtitle"], e.target.value)} className="rounded-none min-h-[80px]" /></F>
                    <F label="CTA Button Text"><Input value={draft.hero?.ctaText || ""} onChange={e => setField(["hero","ctaText"], e.target.value)} className="rounded-none" /></F>
                    <ImageUploadField label="Background Image" value={draft.hero?.backgroundImage || ""} onChange={v => setField(["hero","backgroundImage"], v)} />
                    <F label="Hero Video URL (YouTube Embed)"><Input value={draft.hero?.videoUrl || ""} onChange={e => setField(["hero","videoUrl"], e.target.value)} className="rounded-none" placeholder="https://www.youtube.com/embed/..." /></F>
                  </SubSection>

                  <SubSection title="Flash Sale Banner">
                    <F label="Badge Text"><Input value={draft.flashSale?.badge || ""} onChange={e => setField(["flashSale","badge"], e.target.value)} className="rounded-none" /></F>
                    <F label="Title"><Input value={draft.flashSale?.title || ""} onChange={e => setField(["flashSale","title"], e.target.value)} className="rounded-none" /></F>
                    <F label="Subtitle"><Input value={draft.flashSale?.subtitle || ""} onChange={e => setField(["flashSale","subtitle"], e.target.value)} className="rounded-none" /></F>
                  </SubSection>

                  <SubSection title="Brand Story">
                    <F label="Section Subtitle"><Input value={draft.brandStory?.subtitle || ""} onChange={e => setField(["brandStory","subtitle"], e.target.value)} className="rounded-none" /></F>
                    <F label="Title"><Input value={draft.brandStory?.title || ""} onChange={e => setField(["brandStory","title"], e.target.value)} className="rounded-none" /></F>
                    <F label="Body Text"><Textarea value={draft.brandStory?.text || ""} onChange={e => setField(["brandStory","text"], e.target.value)} className="rounded-none min-h-[100px]" /></F>
                    <ImageUploadField label="Brand Story Image" value={draft.brandStory?.image || ""} onChange={v => setField(["brandStory","image"], v)} />
                  </SubSection>

                  <SubSection title="Collections Grid">
                    {(draft.collections || []).map((col: any, i: number) => (
                      <div key={i} className="p-4 border border-border space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">Collection {i + 1}</p>
                          <Button variant="ghost" size="sm" className="rounded-none text-destructive h-7"
                            onClick={() => setField(["collections"], draft.collections.filter((_: any, j: number) => j !== i))}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <F label="Title"><Input value={col.title || ""} onChange={e => {
                          const c = [...draft.collections]; c[i] = { ...c[i], title: e.target.value };
                          setField(["collections"], c);
                        }} className="rounded-none" /></F>
                        <ImageUploadField label="Image" value={col.image || ""} onChange={v => {
                          const c = [...draft.collections]; c[i] = { ...c[i], image: v };
                          setField(["collections"], c);
                        }} />
                        <F label="Link"><Input value={col.link || ""} onChange={e => {
                          const c = [...draft.collections]; c[i] = { ...c[i], link: e.target.value };
                          setField(["collections"], c);
                        }} className="rounded-none" placeholder="/category/rings" /></F>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="rounded-none text-xs uppercase tracking-widest gap-2"
                      onClick={() => setField(["collections"], [...(draft.collections || []), { title: "", image: "", link: "" }])}>
                      <Plus className="w-3.5 h-3.5" /> Add Collection
                    </Button>
                  </SubSection>
                </>
              )}

              {/* ── SHOP ── */}
              {activePage === "shop" && (
                <SubSection title="Hero Section">
                  <F label="Title"><Input value={draft.hero?.title || ""} onChange={e => setField(["hero","title"], e.target.value)} className="rounded-none" /></F>
                  <F label="Subtitle"><Textarea value={draft.hero?.subtitle || ""} onChange={e => setField(["hero","subtitle"], e.target.value)} className="rounded-none" /></F>
                  <ImageUploadField label="Hero Background Image" value={draft.hero?.image || ""} onChange={v => setField(["hero","image"], v)} />
                  <F label="CTA Button Text"><Input value={draft.hero?.ctaText || ""} onChange={e => setField(["hero","ctaText"], e.target.value)} className="rounded-none" placeholder="Explore Now" /></F>
                </SubSection>
              )}

              {/* ── CATEGORY PAGES (DB-synced + hardcoded category slugs) ── */}
              {isCategoryPage && (
                <SubSection title={`Hero Section — ${activePage.charAt(0).toUpperCase() + activePage.slice(1)}`}>
                  <F label="Title"><Input value={draft.hero?.title || ""} onChange={e => setField(["hero","title"], e.target.value)} className="rounded-none" /></F>
                  <F label="Subtitle"><Textarea value={draft.hero?.subtitle || ""} onChange={e => setField(["hero","subtitle"], e.target.value)} className="rounded-none min-h-[80px]" /></F>
                  <ImageUploadField label="Hero Image" value={draft.hero?.image || ""} onChange={v => setField(["hero","image"], v)} />
                  <F label="Description (shown below hero)">
                    <Textarea value={draft.description || ""} onChange={e => setDraft((d: any) => ({ ...d, description: e.target.value }))} className="rounded-none min-h-[80px]" />
                  </F>
                </SubSection>
              )}

              {/* ── GALLERY ── */}
              {activePage === "gallery" && (
                <>
                  <SubSection title="Hero Section">
                    <F label="Title"><Input value={draft.hero?.title || ""} onChange={e => setField(["hero","title"], e.target.value)} className="rounded-none" /></F>
                    <F label="Subtitle"><Textarea value={draft.hero?.subtitle || ""} onChange={e => setField(["hero","subtitle"], e.target.value)} className="rounded-none" /></F>
                    <ImageUploadField label="Hero Image" value={draft.hero?.image || ""} onChange={v => setField(["hero","image"], v)} />
                  </SubSection>
                  <SubSection title="Gallery Videos">
                    {(draft.videos || []).map((video: any, i: number) => (
                      <div key={i} className="p-4 border border-border space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">Video {i + 1}</p>
                          <Button variant="ghost" size="sm" className="rounded-none text-destructive h-7"
                            onClick={() => setField(["videos"], draft.videos.filter((_: any, j: number) => j !== i))}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <F label="Title"><Input value={video.title || ""} onChange={e => {
                          const v = [...draft.videos]; v[i] = { ...v[i], title: e.target.value };
                          setField(["videos"], v);
                        }} className="rounded-none" /></F>
                        <F label="YouTube Embed URL"><Input value={video.url || ""} onChange={e => {
                          const v = [...draft.videos]; v[i] = { ...v[i], url: e.target.value };
                          setField(["videos"], v);
                        }} className="rounded-none" /></F>
                        <ImageUploadField label="Thumbnail" value={video.thumbnail || ""} onChange={val => {
                          const v = [...draft.videos]; v[i] = { ...v[i], thumbnail: val };
                          setField(["videos"], v);
                        }} />
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="rounded-none text-xs uppercase tracking-widest gap-2"
                      onClick={() => setField(["videos"], [...(draft.videos || []), { title: "", url: "", thumbnail: "" }])}>
                      <Plus className="w-3.5 h-3.5" /> Add Video
                    </Button>
                  </SubSection>
                </>
              )}

              {/* ── BLOG ── */}
              {activePage === "blog" && (
                <SubSection title="Hero Section">
                  <F label="Title"><Input value={draft.hero?.title || ""} onChange={e => setField(["hero","title"], e.target.value)} className="rounded-none" /></F>
                  <F label="Subtitle"><Textarea value={draft.hero?.subtitle || ""} onChange={e => setField(["hero","subtitle"], e.target.value)} className="rounded-none" /></F>
                  <ImageUploadField label="Hero Background Image" value={draft.hero?.image || ""} onChange={v => setField(["hero","image"], v)} />
                </SubSection>
              )}

              {/* ── ABOUT ── */}
              {activePage === "about" && (
                <>
                  <SubSection title="Hero Section">
                    <F label="Title"><Input value={draft.hero?.title || ""} onChange={e => setField(["hero","title"], e.target.value)} className="rounded-none" /></F>
                    <F label="Subtitle"><Textarea value={draft.hero?.subtitle || ""} onChange={e => setField(["hero","subtitle"], e.target.value)} className="rounded-none" /></F>
                    <ImageUploadField label="Hero Image" value={draft.hero?.image || ""} onChange={v => setField(["hero","image"], v)} />
                  </SubSection>

                  <SubSection title="Mission">
                    <F label="Title"><Input value={draft.mission?.title || ""} onChange={e => setField(["mission","title"], e.target.value)} className="rounded-none" /></F>
                    <F label="Text"><Textarea value={draft.mission?.text || ""} onChange={e => setField(["mission","text"], e.target.value)} className="rounded-none min-h-[100px]" /></F>
                  </SubSection>

                  <SubSection title="Team Members">
                    {(draft.team || []).map((member: any, i: number) => (
                      <div key={i} className="p-4 border border-border space-y-3 mb-4">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">Member {i + 1}</p>
                          <Button variant="ghost" size="sm" className="rounded-none text-destructive h-7"
                            onClick={() => setField(["team"], draft.team.filter((_: any, j: number) => j !== i))}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <F label="Name"><Input value={member.name || ""} onChange={e => { const t = [...draft.team]; t[i] = { ...t[i], name: e.target.value }; setField(["team"], t); }} className="rounded-none" /></F>
                        <F label="Role"><Input value={member.role || ""} onChange={e => { const t = [...draft.team]; t[i] = { ...t[i], role: e.target.value }; setField(["team"], t); }} className="rounded-none" /></F>
                        <ImageUploadField label="Photo" value={member.image || ""} onChange={v => { const t = [...draft.team]; t[i] = { ...t[i], image: v }; setField(["team"], t); }} />
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="rounded-none text-xs uppercase tracking-widest gap-2"
                      onClick={() => setField(["team"], [...(draft.team || []), { name: "", role: "", image: "" }])}>
                      <Plus className="w-3.5 h-3.5" /> Add Member
                    </Button>
                  </SubSection>

                  <SubSection title="Core Values">
                    {(draft.values || []).map((val: any, i: number) => (
                      <div key={i} className="p-4 border border-border space-y-3 mb-4">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">Value {i + 1}</p>
                          <Button variant="ghost" size="sm" className="rounded-none text-destructive h-7"
                            onClick={() => setField(["values"], draft.values.filter((_: any, j: number) => j !== i))}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <F label="Title"><Input value={val.title || ""} onChange={e => { const v = [...draft.values]; v[i] = { ...v[i], title: e.target.value }; setField(["values"], v); }} className="rounded-none" /></F>
                        <F label="Description"><Textarea value={val.text || ""} onChange={e => { const v = [...draft.values]; v[i] = { ...v[i], text: e.target.value }; setField(["values"], v); }} className="rounded-none" /></F>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="rounded-none text-xs uppercase tracking-widest gap-2"
                      onClick={() => setField(["values"], [...(draft.values || []), { title: "", text: "" }])}>
                      <Plus className="w-3.5 h-3.5" /> Add Value
                    </Button>
                  </SubSection>
                </>
              )}


            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-medium text-sm uppercase tracking-widest text-muted-foreground mb-4 pb-2 border-b border-border">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
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
