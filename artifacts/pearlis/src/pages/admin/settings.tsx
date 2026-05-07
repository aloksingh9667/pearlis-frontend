import { useState, useEffect, useRef } from "react";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Plus, Trash2, Settings, CreditCard, Phone, Share2, Instagram, Video, Zap, Megaphone, Palette, Upload, Tag, SlidersHorizontal, Navigation, Ruler, Server, RefreshCw, Bell, Truck, Gift, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetSettings, useUpdateSetting, type SiteSettings, type PriceRange, type RingRow, type BraceletRow, type NecklaceRow } from "@/lib/adminApi";
import { useListCategories } from "@workspace/api-client-react";
import { apiUrl } from "@/lib/apiUrl";

const TABS = [
  { id: "branding", label: "Branding", icon: Palette },
  { id: "general", label: "General", icon: Settings },
  { id: "announcement", label: "Announcement", icon: Megaphone },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "social", label: "Social Links", icon: Share2 },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "videos", label: "Videos", icon: Video },
  { id: "flashSale", label: "Flash Sale", icon: Zap },
  { id: "homeSale", label: "Sale Section", icon: Tag },
  { id: "shopFilters", label: "Shop Filters", icon: SlidersHorizontal },
  { id: "navbarCategories", label: "Navbar", icon: Navigation },
  { id: "sizeGuide", label: "Size Guide", icon: Ruler },
  { id: "emailNotifications", label: "Email Alerts", icon: Bell },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "newUserOffer", label: "New User Offer", icon: Gift },
  { id: "server", label: "Server", icon: Server },
] as const;

type TabId = typeof TABS[number]["id"];

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSetting = useUpdateSetting();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("branding");
  const [draft, setDraft] = useState<Partial<SiteSettings>>({});

  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  const saving = updateSetting.isPending;

  async function save(key: keyof SiteSettings) {
    if (!(key in draft)) return;
    updateSetting.mutate({ key, value: draft[key] }, {
      onSuccess: () => toast({ title: "Saved", description: `${key} settings updated.` }),
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  }

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setDraft(d => ({ ...d, [key]: value }));
  }

  function updateNested<K extends keyof SiteSettings>(sectionKey: K, field: string, value: any) {
    setDraft(d => ({
      ...d,
      [sectionKey]: { ...(d[sectionKey] as any), [field]: value },
    }));
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="font-serif text-2xl sm:text-3xl mb-8">Site Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab Sidebar */}
        <nav className="md:w-48 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto md:max-h-[calc(100vh-160px)] pb-2 md:pb-0 flex-shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm text-left whitespace-nowrap transition-colors rounded-sm ${
                activeTab === id ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 bg-card border border-border p-6 overflow-y-auto">
          {/* BRANDING */}
          {activeTab === "branding" && (
            <Section title="Branding" onSave={() => save("branding")} saving={saving}>
              <p className="text-sm text-muted-foreground -mt-2 mb-2">Customize your site name, tagline, logo image, and favicon.</p>
              <Field label="Site Name">
                <Input value={draft.branding?.siteName || ""} onChange={e => updateNested("branding", "siteName", e.target.value)} className="rounded-none" placeholder="Pearlis" />
              </Field>
              <Field label="Tagline">
                <Input value={draft.branding?.tagline || ""} onChange={e => updateNested("branding", "tagline", e.target.value)} className="rounded-none" placeholder="Fine Jewellery" />
              </Field>
              <Field label="Logo">
                <CircleLogoCropper
                  value={draft.branding?.logoUrl || ""}
                  onChange={url => updateNested("branding", "logoUrl", url)}
                  folder="branding/logo"
                  label="Logo"
                />
              </Field>
              <Field label="Favicon (browser tab icon)">
                <CircleLogoCropper
                  value={draft.branding?.faviconUrl || ""}
                  onChange={url => updateNested("branding", "faviconUrl", url)}
                  folder="branding/favicon"
                  label="Favicon"
                />
              </Field>
            </Section>
          )}

          {/* GENERAL */}
          {activeTab === "general" && (
            <Section title="General" onSave={() => save("general")} saving={saving}>
              <Field label="Site Name">
                <Input value={draft.general?.siteName || ""} onChange={e => updateNested("general", "siteName", e.target.value)} className="rounded-none" />
              </Field>
              <Field label="Tagline">
                <Input value={draft.general?.tagline || ""} onChange={e => updateNested("general", "tagline", e.target.value)} className="rounded-none" />
              </Field>
              <Field label="Currency Symbol">
                <Input value={draft.general?.currencySymbol || "₹"} onChange={e => updateNested("general", "currencySymbol", e.target.value)} className="rounded-none w-24" />
              </Field>
              <Field label="USD → INR Conversion Rate">
                <Input type="number" value={draft.general?.conversionRate || 83} onChange={e => updateNested("general", "conversionRate", Number(e.target.value))} className="rounded-none w-32" />
              </Field>
            </Section>
          )}

          {/* ANNOUNCEMENT */}
          {activeTab === "announcement" && (
            <Section title="Announcement Bar" onSave={() => save("announcement")} saving={saving}>
              <div className="flex items-center gap-3 mb-4">
                <Switch
                  checked={draft.announcement?.enabled ?? true}
                  onCheckedChange={v => updateNested("announcement", "enabled", v)}
                />
                <Label>Show Announcement Bar</Label>
              </div>
              <Field label="Announcement Text">
                <Input value={draft.announcement?.text || ""} onChange={e => updateNested("announcement", "text", e.target.value)} className="rounded-none" placeholder="FREE SHIPPING ABOVE ₹5,000..." />
              </Field>
              <Field label="Link (Optional)">
                <Input value={draft.announcement?.link || ""} onChange={e => updateNested("announcement", "link", e.target.value)} className="rounded-none" placeholder="/shop" />
              </Field>
            </Section>
          )}

          {/* PAYMENT */}
          {activeTab === "payment" && (
            <Section title="Payment Options" onSave={() => save("payment")} saving={saving}>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-border">
                  <div>
                    <p className="font-medium text-sm">Cash on Delivery (COD)</p>
                    <p className="text-xs text-muted-foreground mt-1">Allow customers to pay when the order arrives</p>
                  </div>
                  <Switch
                    checked={draft.payment?.codEnabled ?? true}
                    onCheckedChange={v => updateNested("payment", "codEnabled", v)}
                  />
                </div>

                <div className="p-4 border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Razorpay (Online Payments)</p>
                      <p className="text-xs text-muted-foreground mt-1">UPI, Cards, Net Banking, Wallets</p>
                    </div>
                    <Switch
                      checked={draft.payment?.razorpayEnabled ?? false}
                      onCheckedChange={v => updateNested("payment", "razorpayEnabled", v)}
                    />
                  </div>
                  {draft.payment?.razorpayEnabled && (
                    <div className="space-y-4 pt-1">
                      {/* Test / Live mode toggle */}
                      <div className="space-y-2">
                        <Label className="uppercase tracking-widest text-xs text-muted-foreground">Active Mode</Label>
                        <div className="flex gap-0 border border-border w-fit">
                          {(["test", "live"] as const).map(mode => (
                            <button
                              key={mode}
                              onClick={() => updateNested("payment", "razorpayMode", mode)}
                              className={`px-5 py-2 text-xs uppercase tracking-widest font-medium transition-colors ${
                                (draft.payment?.razorpayMode ?? "test") === mode
                                  ? mode === "live"
                                    ? "bg-green-600 text-white"
                                    : "bg-accent text-accent-foreground"
                                  : "text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {mode === "test" ? "🧪 Test" : "🟢 Live"}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(draft.payment?.razorpayMode ?? "test") === "test"
                            ? "Test mode — payments are simulated. No real money is charged."
                            : "Live mode — real payments are processed. Make sure live keys are set on the server."}
                        </p>
                      </div>

                      {/* Env var reference — keys are stored on the server, not here */}
                      <div className="rounded-none border border-border bg-muted/30 p-4 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Backend Environment Variables</p>
                        <p className="text-xs text-muted-foreground">Keys are stored securely as environment variables on your server (Render). Never paste them here.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                          {/* Test vars */}
                          <div className="space-y-1.5">
                            <p className="text-[10px] uppercase tracking-widest text-accent font-semibold">🧪 Test Mode</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 bg-muted p-2">
                                <code className="text-xs font-mono text-foreground flex-1">RAZORPAY_TEST_KEY_ID</code>
                                <span className="text-[10px] text-muted-foreground">Key ID</span>
                              </div>
                              <div className="flex items-center gap-2 bg-muted p-2">
                                <code className="text-xs font-mono text-foreground flex-1">RAZORPAY_TEST_KEY_SECRET</code>
                                <span className="text-[10px] text-muted-foreground">Secret</span>
                              </div>
                            </div>
                          </div>

                          {/* Live vars */}
                          <div className="space-y-1.5">
                            <p className="text-[10px] uppercase tracking-widest text-green-600 font-semibold">🟢 Live Mode</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 bg-muted p-2">
                                <code className="text-xs font-mono text-foreground flex-1">RAZORPAY_LIVE_KEY_ID</code>
                                <span className="text-[10px] text-muted-foreground">Key ID</span>
                              </div>
                              <div className="flex items-center gap-2 bg-muted p-2">
                                <code className="text-xs font-mono text-foreground flex-1">RAZORPAY_LIVE_KEY_SECRET</code>
                                <span className="text-[10px] text-muted-foreground">Secret</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-muted-foreground border-t border-border pt-2 mt-1">
                          Set these in your Render dashboard under <strong>Environment → Environment Variables</strong>. The backend automatically picks the correct pair based on the Active Mode selected above.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* CONTACT */}
          {activeTab === "contact" && (
            <Section title="Contact Information" onSave={() => save("contact")} saving={saving}>
              <Field label="Email">
                <Input value={draft.contact?.email || ""} onChange={e => updateNested("contact", "email", e.target.value)} className="rounded-none" placeholder="concierge@pearlis.com" />
              </Field>
              <Field label="Phone">
                <Input value={draft.contact?.phone || ""} onChange={e => updateNested("contact", "phone", e.target.value)} className="rounded-none" placeholder="+91 98765 43210" />
              </Field>
              <Field label="WhatsApp Number">
                <Input value={draft.contact?.whatsapp || ""} onChange={e => updateNested("contact", "whatsapp", e.target.value)} className="rounded-none" placeholder="+91 98765 43210" />
              </Field>
              <Field label="Address">
                <Textarea value={draft.contact?.address || ""} onChange={e => updateNested("contact", "address", e.target.value)} className="rounded-none min-h-[80px]" placeholder="124 Luxury Lane, Mumbai..." />
              </Field>
              <Field label="Business Hours">
                <Textarea value={draft.contact?.hours || ""} onChange={e => updateNested("contact", "hours", e.target.value)} className="rounded-none min-h-[80px]" placeholder="Mon–Sat: 10am–7pm IST" />
              </Field>
            </Section>
          )}

          {/* SOCIAL */}
          {activeTab === "social" && (
            <Section title="Social Media Links" onSave={() => save("social")} saving={saving}>
              {(["instagram", "facebook", "twitter", "pinterest", "youtube"] as const).map(platform => (
                <Field key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)}>
                  <Input
                    value={(draft.social as any)?.[platform] || ""}
                    onChange={e => updateNested("social", platform, e.target.value)}
                    className="rounded-none"
                    placeholder={`https://${platform}.com/pearlisjewels`}
                  />
                </Field>
              ))}
            </Section>
          )}

          {/* INSTAGRAM */}
          {activeTab === "instagram" && (
            <Section title="Instagram Feed" onSave={() => save("instagram")} saving={saving}>
              <div className="flex items-center justify-between p-4 bg-muted/40 border border-border mb-2">
                <div>
                  <p className="font-medium text-sm">Show Instagram Feed Section</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Displays your photo/video grid on the homepage.</p>
                </div>
                <Switch
                  checked={draft.instagram?.enabled ?? true}
                  onCheckedChange={v => updateNested("instagram", "enabled", v)}
                />
              </div>
              <Field label="Instagram Username">
                <Input
                  value={draft.instagram?.username || ""}
                  onChange={e => updateNested("instagram", "username", e.target.value)}
                  className="rounded-none"
                  placeholder="pearlisjewels"
                />
              </Field>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="uppercase tracking-widest text-xs text-muted-foreground">
                    Media Grid ({(draft.instagram?.posts || []).length} items — images &amp; videos)
                  </Label>
                  <div className="flex gap-2">
                    <IgUploadButton
                      accept="image/*"
                      label="Upload Images"
                      icon="image"
                      onUrls={urls => updateNested("instagram", "posts", [...(draft.instagram?.posts || []), ...urls])}
                    />
                    <IgUploadButton
                      accept="video/*"
                      label="Upload Video"
                      icon="video"
                      onUrls={urls => updateNested("instagram", "posts", [...(draft.instagram?.posts || []), ...urls])}
                    />
                  </div>
                </div>

                {/* Preview grid */}
                {(draft.instagram?.posts || []).length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {(draft.instagram?.posts || []).map((url, i) => {
                      const isVideo = /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(url);
                      return (
                        <div key={i} className="group relative aspect-square bg-muted overflow-hidden border border-border">
                          {isVideo ? (
                            <>
                              <video src={url} className="w-full h-full object-cover" muted playsInline />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center">
                                  <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-l-[8px] border-t-transparent border-b-transparent border-l-[#0F0F0F] ml-0.5" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <img src={url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.opacity = "0.2"; }} />
                          )}
                          <button
                            onClick={() => {
                              const posts = (Array.isArray(draft.instagram?.posts) ? draft.instagram!.posts : []).filter((_, j) => j !== i);
                              updateNested("instagram", "posts", posts);
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs items-center justify-center hidden group-hover:flex"
                          >✕</button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] py-0.5 px-1 truncate hidden group-hover:block">
                            {isVideo ? "VIDEO" : "IMAGE"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Also allow pasting a URL manually */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">+ Paste a URL manually</summary>
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="https://... (image or video URL)"
                      className="rounded-none text-sm"
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) { updateNested("instagram", "posts", [...(draft.instagram?.posts || []), val]); (e.target as HTMLInputElement).value = ""; }
                        }
                      }}
                    />
                    <span className="text-muted-foreground/60 text-[10px] flex items-center shrink-0">Press Enter to add</span>
                  </div>
                </details>

                {(draft.instagram?.posts || []).length === 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">No custom media yet — default placeholder photos shown below (visible on homepage until you upload your own):</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {[
                        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=200&h=200",
                        "https://images.unsplash.com/photo-1599643478524-fb66f70d00f7?auto=format&fit=crop&q=80&w=200&h=200",
                        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=200&h=200",
                        "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&q=80&w=200&h=200",
                        "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=200&h=200",
                        "https://images.unsplash.com/photo-1573408301185-9519f94815b5?auto=format&fit=crop&q=80&w=200&h=200",
                      ].map((src, i) => (
                        <div key={i} className="relative aspect-square border border-border overflow-hidden bg-muted opacity-60">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <span className="text-white text-[9px] tracking-wide font-medium">Default</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* VIDEOS */}
          {activeTab === "videos" && (
            <>
              {/* Atelier Section Video */}
              <Section title="Atelier Section Video" onSave={() => save("atelierVideo")} saving={saving}>
                <p className="text-sm text-muted-foreground mb-6">
                  This video plays in the "The Pearlis Atelier" brand story section on the homepage (left panel). Paste a YouTube link or upload a video file.
                </p>
                <Field label="Video URL (YouTube link or uploaded file URL)">
                  <div className="flex gap-2">
                    <Input
                      value={draft.atelierVideo || ""}
                      onChange={e => update("atelierVideo", e.target.value)}
                      className="rounded-none flex-1"
                      placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."
                    />
                    <VideoUploadButton
                      onUrl={url => update("atelierVideo", url)}
                      label="Upload"
                    />
                  </div>
                </Field>
                {draft.atelierVideo && (
                  <div className="mt-3 p-3 bg-muted border border-border text-xs text-muted-foreground flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{draft.atelierVideo}</span>
                    <button onClick={() => update("atelierVideo", "")} className="shrink-0 text-destructive hover:underline ml-auto">Remove</button>
                  </div>
                )}
              </Section>

              {/* Gallery / Homepage Videos */}
              <Section title="YouTube Videos (Gallery & Homepage)" onSave={() => save("videos")} saving={saving}>
                <p className="text-sm text-muted-foreground mb-6">These videos appear in the Videos Gallery page and the Homepage video section.</p>
                <div className="space-y-4">
                  {(draft.videos || []).map((video, i) => (
                    <div key={i} className="p-4 border border-border space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">Video {i + 1}</p>
                        <Button variant="ghost" size="sm" className="rounded-none h-8 text-destructive hover:bg-destructive/10 gap-1"
                          onClick={() => update("videos", (Array.isArray(draft.videos) ? draft.videos : []).filter((_, j) => j !== i))}>
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </Button>
                      </div>
                      <Field label="Title">
                        <Input value={video.title} onChange={e => {
                          const vids = [...(draft.videos || [])];
                          vids[i] = { ...vids[i], title: e.target.value };
                          update("videos", vids);
                        }} className="rounded-none" placeholder="Behind the Scenes..." />
                      </Field>
                      <Field label="Video URL (YouTube link or uploaded file)">
                        <div className="flex gap-2">
                          <Input value={video.url} onChange={e => {
                            const vids = [...(draft.videos || [])];
                            const url = e.target.value;
                            const ytIdMatch = url.match(/(?:embed\/|v=|youtu\.be\/)([^?&/]+)/);
                            const ytId = ytIdMatch?.[1] || "";
                            const autoThumb = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : vids[i].thumbnail;
                            vids[i] = { ...vids[i], url, thumbnail: vids[i].thumbnail || autoThumb };
                            update("videos", vids);
                          }} className="rounded-none flex-1" placeholder="https://youtu.be/... or upload below" />
                          <VideoUploadButton
                            onUrl={url => {
                              const vids = [...(draft.videos || [])];
                              vids[i] = { ...vids[i], url };
                              update("videos", vids);
                            }}
                            label="Upload"
                          />
                        </div>
                      </Field>
                      <Field label="Thumbnail (auto-filled from YouTube, or paste image URL)">
                        <div className="flex gap-2 items-start">
                          <Input value={video.thumbnail} onChange={e => {
                            const vids = [...(draft.videos || [])];
                            vids[i] = { ...vids[i], thumbnail: e.target.value };
                            update("videos", vids);
                          }} className="rounded-none flex-1" placeholder="Auto-generated from YouTube URL" />
                          <LogoUploadButton
                            onUrl={url => {
                              const vids = [...(draft.videos || [])];
                              vids[i] = { ...vids[i], thumbnail: url };
                              update("videos", vids);
                            }}
                            label="Upload Thumbnail"
                          />
                        </div>
                      </Field>
                    </div>
                  ))}
                  <Button variant="outline" className="rounded-none text-xs uppercase tracking-widest gap-2"
                    onClick={() => update("videos", [...(draft.videos || []), { title: "", url: "", thumbnail: "" }])}>
                    <Plus className="w-4 h-4" /> Add Video
                  </Button>
                </div>
              </Section>
            </>
          )}

          {/* FLASH SALE */}
          {activeTab === "flashSale" && (
            <Section title="Flash Sale Banner" onSave={() => save("flashSale")} saving={saving}>
              {/* Enable toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/40 border border-border mb-6">
                <div>
                  <p className="font-medium text-sm">Show Flash Sale Banner</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Displays a prominent banner below the announcement bar, above the navbar.</p>
                </div>
                <Switch
                  checked={draft.flashSale?.enabled ?? false}
                  onCheckedChange={v => updateNested("flashSale", "enabled", v)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <Field label="Badge Text">
                  <Input value={draft.flashSale?.title || ""} onChange={e => updateNested("flashSale", "title", e.target.value)} className="rounded-none" placeholder="Flash Sale" />
                </Field>
                <Field label="Subtitle / Offer Headline">
                  <Input value={draft.flashSale?.subtitle || ""} onChange={e => updateNested("flashSale", "subtitle", e.target.value)} className="rounded-none" placeholder="Up to 30% Off" />
                </Field>
                <Field label="Promo Text (below subtitle)">
                  <Input value={draft.flashSale?.promoText || ""} onChange={e => updateNested("flashSale", "promoText", e.target.value)} className="rounded-none" placeholder="Today Only — Use code PEARLIS10 at checkout" />
                </Field>
                <Field label="Coupon Code (highlighted)">
                  <Input value={draft.flashSale?.code || ""} onChange={e => updateNested("flashSale", "code", e.target.value)} className="rounded-none" placeholder="PEARLIS10" />
                </Field>
                <Field label="CTA Button Text">
                  <Input value={draft.flashSale?.ctaText || ""} onChange={e => updateNested("flashSale", "ctaText", e.target.value)} className="rounded-none" placeholder="Shop the Sale" />
                </Field>
                <Field label="CTA Button Link">
                  <Input value={draft.flashSale?.ctaLink || ""} onChange={e => updateNested("flashSale", "ctaLink", e.target.value)} className="rounded-none" placeholder="/shop" />
                </Field>
              </div>

              <Field label="Sale Ends At (countdown timer target)">
                <Input
                  type="datetime-local"
                  value={draft.flashSale?.endsAt ? draft.flashSale.endsAt.slice(0, 16) : ""}
                  onChange={e => updateNested("flashSale", "endsAt", new Date(e.target.value).toISOString())}
                  className="rounded-none max-w-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">A live countdown timer will appear in the banner counting down to this time.</p>
              </Field>

              {/* Preview hint */}
              {draft.flashSale?.enabled && (
                <div className="mt-4 p-4 bg-[#0F0F0F] text-white text-sm rounded-none flex items-center gap-3">
                  <span className="bg-[#D4AF37] text-[#0F0F0F] text-[10px] font-bold px-2 py-0.5 tracking-widest uppercase">{draft.flashSale.title || "Flash Sale"}</span>
                  <span className="font-semibold">{draft.flashSale.subtitle || "Up to 30% Off"}</span>
                  {draft.flashSale.code && <span className="text-[#D4AF37] font-mono text-xs border border-[#D4AF37]/40 px-2 py-0.5">{draft.flashSale.code}</span>}
                  <span className="ml-auto text-xs text-white/40">Live preview after Save</span>
                </div>
              )}
            </Section>
          )}
          {/* SHOP FILTERS */}
          {activeTab === "shopFilters" && (
            <Section title="Shop Filters" onSave={() => save("shopFilters" as any)} saving={saving}>
              <p className="text-sm text-muted-foreground -mt-2 mb-6">
                Manage the Price Range and Material filter options that appear in the Shop page sidebar.
              </p>

              {/* Price Ranges */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between">
                  <Label className="uppercase tracking-widest text-xs text-muted-foreground">Price Ranges (in ₹)</Label>
                  <Button variant="outline" size="sm" className="rounded-none text-xs uppercase tracking-widest gap-1.5"
                    onClick={() => {
                      const ranges: PriceRange[] = [...((draft as any).shopFilters?.priceRanges || []), { label: "", minINR: 0, maxINR: 0 }];
                      update("shopFilters" as any, { ...(draft as any).shopFilters, priceRanges: ranges });
                    }}>
                    <Plus className="w-3.5 h-3.5" /> Add Range
                  </Button>
                </div>
                {((draft as any).shopFilters?.priceRanges || []).map((r: PriceRange, i: number) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={r.label} onChange={e => {
                      const ranges = [...(draft as any).shopFilters.priceRanges];
                      ranges[i] = { ...ranges[i], label: e.target.value };
                      update("shopFilters" as any, { ...(draft as any).shopFilters, priceRanges: ranges });
                    }} className="rounded-none flex-1" placeholder="Label e.g. Under ₹5,000" />
                    <Input type="number" value={r.minINR} onChange={e => {
                      const ranges = [...(draft as any).shopFilters.priceRanges];
                      ranges[i] = { ...ranges[i], minINR: Number(e.target.value) };
                      update("shopFilters" as any, { ...(draft as any).shopFilters, priceRanges: ranges });
                    }} className="rounded-none w-28" placeholder="Min ₹" />
                    <Input type="number" value={r.maxINR} onChange={e => {
                      const ranges = [...(draft as any).shopFilters.priceRanges];
                      ranges[i] = { ...ranges[i], maxINR: Number(e.target.value) };
                      update("shopFilters" as any, { ...(draft as any).shopFilters, priceRanges: ranges });
                    }} className="rounded-none w-28" placeholder="Max ₹" />
                    <Button variant="ghost" size="icon" className="rounded-none h-10 w-10 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => {
                        const ranges = (draft as any).shopFilters.priceRanges.filter((_: any, j: number) => j !== i);
                        update("shopFilters" as any, { ...(draft as any).shopFilters, priceRanges: ranges });
                      }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Materials */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="uppercase tracking-widest text-xs text-muted-foreground">Materials</Label>
                  <Button variant="outline" size="sm" className="rounded-none text-xs uppercase tracking-widest gap-1.5"
                    onClick={() => {
                      const mats = [...((draft as any).shopFilters?.materials || []), ""];
                      update("shopFilters" as any, { ...(draft as any).shopFilters, materials: mats });
                    }}>
                    <Plus className="w-3.5 h-3.5" /> Add Material
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {((draft as any).shopFilters?.materials || []).map((m: string, i: number) => (
                    <div key={i} className="flex gap-1 items-center">
                      <Input value={m} onChange={e => {
                        const mats = [...(draft as any).shopFilters.materials];
                        mats[i] = e.target.value;
                        update("shopFilters" as any, { ...(draft as any).shopFilters, materials: mats });
                      }} className="rounded-none text-sm" placeholder="e.g. Gold" />
                      <Button variant="ghost" size="icon" className="rounded-none h-10 w-10 text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={() => {
                          const mats = (draft as any).shopFilters.materials.filter((_: any, j: number) => j !== i);
                          update("shopFilters" as any, { ...(draft as any).shopFilters, materials: mats });
                        }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {/* NAVBAR CATEGORIES */}
          {activeTab === "navbarCategories" && <NavbarCategoriesTab draft={draft} update={update} save={save} saving={saving} />}

          {/* SIZE GUIDE */}
          {activeTab === "sizeGuide" && (
            <Section title="Size Guide" onSave={() => save("sizeGuide" as any)} saving={saving}>
              <p className="text-sm text-muted-foreground -mt-2 mb-6">
                Edit the size tables and tips shown in the Size Guide popup on product pages.
              </p>

              {/* Ring sizes */}
              <div className="space-y-3 mb-8">
                <Label className="uppercase tracking-widest text-xs text-muted-foreground block">Ring Sizes</Label>
                <Field label="Measurement Tip">
                  <Textarea value={(draft as any).sizeGuide?.ringTip || ""} onChange={e => updateNested("sizeGuide" as any, "ringTip", e.target.value)} className="rounded-none min-h-[60px]" />
                </Field>
                <Field label="Warning Tip">
                  <Textarea value={(draft as any).sizeGuide?.ringWarnTip || ""} onChange={e => updateNested("sizeGuide" as any, "ringWarnTip", e.target.value)} className="rounded-none min-h-[50px]" />
                </Field>
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-1 text-[10px] tracking-widest uppercase text-muted-foreground font-semibold px-1">
                    <span>India</span><span>US</span><span>mm</span><span>inch</span><span></span>
                  </div>
                  {((draft as any).sizeGuide?.ringRows || []).map((r: RingRow, i: number) => (
                    <div key={i} className="grid grid-cols-5 gap-1 items-center">
                      {(["in", "us", "mm", "inch"] as const).map(field => (
                        <Input key={field} value={r[field]} onChange={e => {
                          const rows = [...(draft as any).sizeGuide.ringRows];
                          rows[i] = { ...rows[i], [field]: e.target.value };
                          updateNested("sizeGuide" as any, "ringRows", rows);
                        }} className="rounded-none text-xs h-8" placeholder={field} />
                      ))}
                      <Button variant="ghost" size="icon" className="rounded-none h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => updateNested("sizeGuide" as any, "ringRows", (draft as any).sizeGuide.ringRows.filter((_: any, j: number) => j !== i))}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="rounded-none text-xs uppercase tracking-widest gap-1.5 mt-1"
                    onClick={() => updateNested("sizeGuide" as any, "ringRows", [...((draft as any).sizeGuide?.ringRows || []), { in: "", us: "", mm: "", inch: "" }])}>
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </Button>
                </div>
              </div>

              {/* Bracelet sizes */}
              <div className="space-y-3 mb-8">
                <Label className="uppercase tracking-widest text-xs text-muted-foreground block">Bracelet Sizes</Label>
                <Field label="Measurement Tip">
                  <Textarea value={(draft as any).sizeGuide?.braceletTip || ""} onChange={e => updateNested("sizeGuide" as any, "braceletTip", e.target.value)} className="rounded-none min-h-[60px]" />
                </Field>
                <Field label="Warning Tip">
                  <Textarea value={(draft as any).sizeGuide?.braceletWarnTip || ""} onChange={e => updateNested("sizeGuide" as any, "braceletWarnTip", e.target.value)} className="rounded-none min-h-[50px]" />
                </Field>
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-1 text-[10px] tracking-widest uppercase text-muted-foreground font-semibold px-1">
                    <span>Label</span><span>Wrist</span><span>Fit</span><span></span>
                  </div>
                  {((draft as any).sizeGuide?.braceletRows || []).map((r: BraceletRow, i: number) => (
                    <div key={i} className="grid grid-cols-4 gap-1 items-center">
                      {(["label", "wrist", "fit"] as const).map(field => (
                        <Input key={field} value={r[field]} onChange={e => {
                          const rows = [...(draft as any).sizeGuide.braceletRows];
                          rows[i] = { ...rows[i], [field]: e.target.value };
                          updateNested("sizeGuide" as any, "braceletRows", rows);
                        }} className="rounded-none text-xs h-8" placeholder={field} />
                      ))}
                      <Button variant="ghost" size="icon" className="rounded-none h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => updateNested("sizeGuide" as any, "braceletRows", (draft as any).sizeGuide.braceletRows.filter((_: any, j: number) => j !== i))}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="rounded-none text-xs uppercase tracking-widest gap-1.5 mt-1"
                    onClick={() => updateNested("sizeGuide" as any, "braceletRows", [...((draft as any).sizeGuide?.braceletRows || []), { label: "", wrist: "", fit: "" }])}>
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </Button>
                </div>
              </div>

              {/* Necklace sizes */}
              <div className="space-y-3">
                <Label className="uppercase tracking-widest text-xs text-muted-foreground block">Necklace Sizes</Label>
                <Field label="Measurement Tip">
                  <Textarea value={(draft as any).sizeGuide?.necklaceTip || ""} onChange={e => updateNested("sizeGuide" as any, "necklaceTip", e.target.value)} className="rounded-none min-h-[60px]" />
                </Field>
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-1 text-[10px] tracking-widest uppercase text-muted-foreground font-semibold px-1">
                    <span>Length</span><span>Style</span><span>Description</span><span></span>
                  </div>
                  {((draft as any).sizeGuide?.necklaceRows || []).map((r: NecklaceRow, i: number) => (
                    <div key={i} className="grid grid-cols-4 gap-1 items-center">
                      {(["length", "style", "description"] as const).map(field => (
                        <Input key={field} value={r[field]} onChange={e => {
                          const rows = [...(draft as any).sizeGuide.necklaceRows];
                          rows[i] = { ...rows[i], [field]: e.target.value };
                          updateNested("sizeGuide" as any, "necklaceRows", rows);
                        }} className="rounded-none text-xs h-8" placeholder={field} />
                      ))}
                      <Button variant="ghost" size="icon" className="rounded-none h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => updateNested("sizeGuide" as any, "necklaceRows", (draft as any).sizeGuide.necklaceRows.filter((_: any, j: number) => j !== i))}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="rounded-none text-xs uppercase tracking-widest gap-1.5 mt-1"
                    onClick={() => updateNested("sizeGuide" as any, "necklaceRows", [...((draft as any).sizeGuide?.necklaceRows || []), { length: "", style: "", description: "" }])}>
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </Button>
                </div>
              </div>
            </Section>
          )}

          {/* HOME SALE SECTION */}
          {activeTab === "homeSale" && (
            <Section title="Homepage Sale Section" onSave={() => save("homeSale")} saving={saving}>
              <p className="text-sm text-muted-foreground -mt-2 mb-4">
                Controls the large "Limited Time Offer" countdown section on the homepage — separate from the top navbar banner.
              </p>

              {/* Enable toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/40 border border-border mb-6">
                <div>
                  <p className="font-medium text-sm">Show Sale Section on Homepage</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Displays the dark countdown section with offer text and timer. Auto-hides when the timer expires.</p>
                </div>
                <Switch
                  checked={(draft as any).homeSale?.enabled ?? true}
                  onCheckedChange={v => updateNested("homeSale" as any, "enabled", v)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <Field label="Label (small top text)">
                  <Input value={(draft as any).homeSale?.badge || ""} onChange={e => updateNested("homeSale" as any, "badge", e.target.value)} className="rounded-none" placeholder="Limited Time Offer" />
                </Field>
                <Field label="Offer Headline (big text in gold)">
                  <Input value={(draft as any).homeSale?.offerLine || ""} onChange={e => updateNested("homeSale" as any, "offerLine", e.target.value)} className="rounded-none" placeholder="Flat 20% OFF" />
                </Field>
                <Field label="Subtitle (below offer headline)">
                  <Input value={(draft as any).homeSale?.subtitle || ""} onChange={e => updateNested("homeSale" as any, "subtitle", e.target.value)} className="rounded-none" placeholder="Today Only" />
                </Field>
                <Field label="Coupon Code (highlighted)">
                  <Input value={(draft as any).homeSale?.code || ""} onChange={e => updateNested("homeSale" as any, "code", e.target.value)} className="rounded-none" placeholder="PEARLIS10" />
                </Field>
                <Field label="Promo Text (full description line)">
                  <Input value={(draft as any).homeSale?.promoText || ""} onChange={e => updateNested("homeSale" as any, "promoText", e.target.value)} className="rounded-none" placeholder="Use code PEARLIS10 at checkout and save on our finest pieces." />
                </Field>
                <Field label="CTA Button Text">
                  <Input value={(draft as any).homeSale?.ctaText || ""} onChange={e => updateNested("homeSale" as any, "ctaText", e.target.value)} className="rounded-none" placeholder="Shop the Sale" />
                </Field>
                <Field label="CTA Button Link">
                  <Input value={(draft as any).homeSale?.ctaLink || ""} onChange={e => updateNested("homeSale" as any, "ctaLink", e.target.value)} className="rounded-none" placeholder="/shop" />
                </Field>
              </div>

              <Field label="Sale Ends At (countdown timer)">
                <Input
                  type="datetime-local"
                  value={(draft as any).homeSale?.endsAt ? (draft as any).homeSale.endsAt.slice(0, 16) : ""}
                  onChange={e => updateNested("homeSale" as any, "endsAt", new Date(e.target.value).toISOString())}
                  className="rounded-none max-w-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">The section automatically disappears when the timer reaches zero.</p>
              </Field>

              {/* Live preview */}
              {(draft as any).homeSale?.enabled && (
                <div className="mt-4 p-5 bg-[#0A0A0A] text-white rounded-none border border-[#D4AF37]/20">
                  <p className="text-[9px] tracking-[0.4em] uppercase text-[#D4AF37] font-bold mb-1">{(draft as any).homeSale?.badge || "Limited Time Offer"}</p>
                  <p className="font-serif text-2xl text-[#D4AF37] mb-1">{(draft as any).homeSale?.offerLine || "Flat 20% OFF"}</p>
                  <p className="font-serif text-lg text-white/50 mb-2">{(draft as any).homeSale?.subtitle || "Today Only"}</p>
                  {(draft as any).homeSale?.code && (
                    <p className="text-sm text-white/40">
                      Code: <span className="text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-2 py-0.5">{(draft as any).homeSale.code}</span>
                    </p>
                  )}
                  <span className="ml-auto text-xs text-white/30 block mt-2">Live preview after Save</span>
                </div>
              )}
            </Section>
          )}

          {/* EMAIL NOTIFICATIONS */}
          {activeTab === "emailNotifications" && (
            <Section title="Email Notifications" onSave={() => save("emailNotifications")} saving={saving}>
              <p className="text-sm text-muted-foreground -mt-2 mb-6">
                Control which transactional emails are sent to customers. Toggle off any type to stop that email from being delivered. All are enabled by default.
              </p>
              <div className="space-y-0 divide-y divide-border border border-border">
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-sm font-medium">Order Confirmation</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sent to the customer immediately after they place an order.</p>
                  </div>
                  <Switch
                    checked={draft.emailNotifications?.orderConfirmation ?? true}
                    onCheckedChange={v => updateNested("emailNotifications", "orderConfirmation", v)}
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-sm font-medium">Order Status Update</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sent when you change an order's status (confirmed, shipped, delivered, cancelled).</p>
                  </div>
                  <Switch
                    checked={draft.emailNotifications?.orderStatusUpdate ?? true}
                    onCheckedChange={v => updateNested("emailNotifications", "orderStatusUpdate", v)}
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-sm font-medium">Return Request Status</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sent when you approve or reject a customer's return / refund request.</p>
                  </div>
                  <Switch
                    checked={draft.emailNotifications?.returnStatusUpdate ?? true}
                    onCheckedChange={v => updateNested("emailNotifications", "returnStatusUpdate", v)}
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-sm font-medium">Back in Stock Alert</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sent to customers who subscribed to be notified when an out-of-stock product becomes available.</p>
                  </div>
                  <Switch
                    checked={draft.emailNotifications?.stockAlert ?? true}
                    onCheckedChange={v => updateNested("emailNotifications", "stockAlert", v)}
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-sm font-medium">OTP / Email Verification</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sent during account registration to verify the customer's email address.</p>
                  </div>
                  <Switch
                    checked={draft.emailNotifications?.otpVerification ?? true}
                    onCheckedChange={v => updateNested("emailNotifications", "otpVerification", v)}
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-sm font-medium">Password Reset</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sent when a customer requests a password reset link.</p>
                  </div>
                  <Switch
                    checked={draft.emailNotifications?.passwordReset ?? true}
                    onCheckedChange={v => updateNested("emailNotifications", "passwordReset", v)}
                  />
                </div>
              </div>
            </Section>
          )}

          {/* SERVER / KEEPALIVE + LOW STOCK */}
          {activeTab === "server" && (
            <div className="space-y-10">
              <Section title="Server Keepalive" onSave={() => save("keepAlive")} saving={saving}>
                <p className="text-sm text-muted-foreground -mt-2 mb-4">
                  Keep your backend server alive by pinging it at regular intervals. Useful for free-tier hosting (e.g., Render) that spins down after inactivity.
                  <strong className="text-foreground"> The ping only runs while you are logged in as admin.</strong>
                </p>

                <div className="flex items-center justify-between p-4 bg-muted/40 border border-border mb-6">
                  <div>
                    <p className="font-medium text-sm flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-accent" />
                      Server Keepalive Ping
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      When enabled, the admin panel silently pings your backend at the set interval to prevent cold starts.
                    </p>
                  </div>
                  <Switch
                    checked={draft.keepAlive?.enabled ?? false}
                    onCheckedChange={v => updateNested("keepAlive", "enabled", v)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <Field label="Ping URL">
                    <Input
                      value={draft.keepAlive?.pingUrl || ""}
                      onChange={e => updateNested("keepAlive", "pingUrl", e.target.value)}
                      className="rounded-none font-mono text-sm"
                      placeholder="https://your-api.onrender.com/api/healthz"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The URL to ping (GET request). Use your backend&apos;s health check endpoint.
                    </p>
                  </Field>

                  <Field label="Ping Interval (minutes)">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={draft.keepAlive?.intervalMinutes ?? 14}
                        onChange={e => updateNested("keepAlive", "intervalMinutes", Math.max(1, Math.min(60, Number(e.target.value))))}
                        className="rounded-none w-28"
                      />
                      <span className="text-sm text-muted-foreground">minutes</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Render free plan spins down after 15 min — keep this at 14 or less.
                    </p>
                  </Field>
                </div>

                {draft.keepAlive?.enabled && draft.keepAlive?.pingUrl && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                    <RefreshCw className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Keepalive active — the admin panel will ping <code className="font-mono text-xs bg-green-500/10 px-1">{draft.keepAlive.pingUrl}</code> every{" "}
                      <strong>{draft.keepAlive.intervalMinutes ?? 14} minutes</strong> while you are logged in.
                    </span>
                  </div>
                )}

                {draft.keepAlive?.enabled && !draft.keepAlive?.pingUrl && (
                  <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-700 dark:text-yellow-400">
                    Keepalive is on but no Ping URL is set. Please enter your backend health check URL above.
                  </div>
                )}
              </Section>

              <Section title="Low Stock Alerts" onSave={() => save("lowStockAlert")} saving={saving}>
                <p className="text-sm text-muted-foreground -mt-2 mb-4">
                  Get an email alert whenever a product's stock drops to or below the threshold after an order or manual update.
                </p>

                <div className="flex items-center justify-between p-4 bg-muted/40 border border-border mb-6">
                  <div>
                    <p className="font-medium text-sm flex items-center gap-2">
                      <Bell className="w-4 h-4 text-accent" />
                      Low Stock Email Alerts
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      When enabled, the server sends an email to the address below when stock is low.
                    </p>
                  </div>
                  <Switch
                    checked={draft.lowStockAlert?.enabled ?? false}
                    onCheckedChange={v => updateNested("lowStockAlert", "enabled", v)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <Field label="Alert Email">
                    <Input
                      type="email"
                      value={draft.lowStockAlert?.email || ""}
                      onChange={e => updateNested("lowStockAlert", "email", e.target.value)}
                      className="rounded-none"
                      placeholder="admin@yourstore.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Alerts will be sent to this address. Uses your Mailgun configuration.
                    </p>
                  </Field>

                  <Field label="Stock Threshold">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={999}
                        value={draft.lowStockAlert?.threshold ?? 5}
                        onChange={e => updateNested("lowStockAlert", "threshold", Math.max(1, Number(e.target.value)))}
                        className="rounded-none w-28"
                      />
                      <span className="text-sm text-muted-foreground">units</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Send alert when stock reaches this number or below (e.g., 5 = alert at 5, 4, 3, 2, 1, 0).
                    </p>
                  </Field>
                </div>

                {draft.lowStockAlert?.enabled && draft.lowStockAlert?.email && (
                  <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <Bell className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Alerts active — you will receive an email at <strong>{draft.lowStockAlert.email}</strong> when any product drops to{" "}
                      <strong>{draft.lowStockAlert.threshold ?? 5} or fewer</strong> units.
                    </span>
                  </div>
                )}

                {draft.lowStockAlert?.enabled && !draft.lowStockAlert?.email && (
                  <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-700 dark:text-yellow-400">
                    Low stock alerts are on but no email address is set. Please enter an email above.
                  </div>
                )}
              </Section>
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="space-y-8">
              <Section title="Free Delivery Zones" onSave={() => save("shipping")} saving={saving}>
                <div className="space-y-5">
                  <Field
                    label="Free Delivery Cities"
                    hint="Comma-separated city names (case-insensitive). Orders to these cities always get free delivery regardless of order value."
                  >
                    <Input
                      value={draft.shipping?.freeCities ?? "noida,delhi,new delhi"}
                      onChange={e => updateNested("shipping", "freeCities", e.target.value)}
                      className="rounded-none"
                      placeholder="noida, delhi, new delhi, gurgaon, faridabad"
                    />
                  </Field>
                  <Field
                    label="Free Delivery States"
                    hint="Comma-separated state names (case-insensitive). Orders to these states get free delivery. Leave blank to disable state-level free delivery."
                  >
                    <Input
                      value={draft.shipping?.freeStates ?? ""}
                      onChange={e => updateNested("shipping", "freeStates", e.target.value)}
                      className="rounded-none"
                      placeholder="uttar pradesh, haryana, delhi ncr"
                    />
                  </Field>
                  <Field
                    label="Min. Order Value for Free Delivery (₹)"
                    hint="Orders above this amount get free delivery to ANY city/state not already in the free zone."
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        min={0}
                        value={draft.shipping?.minOrderFreeShipping ?? 500}
                        onChange={e => updateNested("shipping", "minOrderFreeShipping", Number(e.target.value))}
                        className="rounded-none w-32"
                      />
                    </div>
                  </Field>
                  <Field
                    label="Standard Delivery Charge (₹)"
                    hint="Charged when the order is below the free delivery threshold and destination is not in the free zone."
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        min={0}
                        value={draft.shipping?.defaultCharge ?? 49}
                        onChange={e => updateNested("shipping", "defaultCharge", Number(e.target.value))}
                        className="rounded-none w-32"
                      />
                    </div>
                  </Field>
                </div>
              </Section>

              <Section title="Delivery Time Estimates" onSave={() => save("shipping")} saving={saving}>
                <p className="text-sm text-muted-foreground -mt-2 mb-4">
                  These ranges are shown to customers at checkout so they know when to expect their order. Use "min-max" format, e.g. <code className="bg-muted px-1 rounded text-xs">1-2</code>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Field
                    label="Free City Delivery (days)"
                    hint={`Cities: ${(draft.shipping?.freeCities || "noida, delhi").split(",").slice(0, 3).map(c => c.trim()).join(", ")}...`}
                  >
                    <Input
                      value={draft.shipping?.freeCityDays ?? "1-2"}
                      onChange={e => updateNested("shipping", "freeCityDays", e.target.value)}
                      className="rounded-none"
                      placeholder="1-2"
                    />
                  </Field>
                  <Field
                    label="Free State Delivery (days)"
                    hint="For orders in free delivery states"
                  >
                    <Input
                      value={draft.shipping?.freeStateDays ?? "2-3"}
                      onChange={e => updateNested("shipping", "freeStateDays", e.target.value)}
                      className="rounded-none"
                      placeholder="2-3"
                    />
                  </Field>
                  <Field
                    label="Paid / Other Delivery (days)"
                    hint="For all other destinations"
                  >
                    <Input
                      value={draft.shipping?.paidDays ?? "5-7"}
                      onChange={e => updateNested("shipping", "paidDays", e.target.value)}
                      className="rounded-none"
                      placeholder="5-7"
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field
                    label="Paid Delivery Info Message"
                    hint="Shown to customers in non-free delivery areas. Use {days} to insert the delivery days range and {charge} for the delivery charge."
                  >
                    <Input
                      value={draft.shipping?.paidMessage ?? ""}
                      onChange={e => updateNested("shipping", "paidMessage", e.target.value)}
                      className="rounded-none"
                      placeholder="Standard delivery in {days} business days — ₹{charge}"
                    />
                  </Field>
                </div>
              </Section>

              <div className="p-5 bg-muted/40 border border-border text-sm space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-2"><Truck className="w-4 h-4 text-accent" /> How delivery is calculated at checkout</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                  <li>If customer's city is in <strong>Free Delivery Cities</strong> → Free + {draft.shipping?.freeCityDays ?? "1-2"} day delivery</li>
                  <li>If customer's state is in <strong>Free Delivery States</strong> → Free + {draft.shipping?.freeStateDays ?? "2-3"} day delivery</li>
                  <li>If order subtotal ≥ ₹{draft.shipping?.minOrderFreeShipping ?? 500} → Free delivery</li>
                  <li>Otherwise → ₹{draft.shipping?.defaultCharge ?? 49} charge + {draft.shipping?.paidDays ?? "5-7"} day delivery</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === "newUserOffer" && (
            <div>
              <Section title="New User Welcome Offer" onSave={() => save("newUserOffer")} saving={saving}>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Enable Welcome Offer</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Automatically applies a discount for new users at checkout</p>
                    </div>
                    <Switch
                      checked={draft.newUserOffer?.enabled ?? false}
                      onCheckedChange={v => updateNested("newUserOffer", "enabled", v)}
                    />
                  </div>

                  {draft.newUserOffer?.enabled && (
                    <>
                      <Field label="Discount Type">
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { value: "flat", label: "Flat Amount (₹)" },
                            { value: "percent", label: "Percentage (%)" },
                            { value: "free_shipping", label: "Free Shipping" },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateNested("newUserOffer", "discountType", opt.value)}
                              className={`px-4 py-2 text-xs uppercase tracking-widest border transition-colors ${
                                (draft.newUserOffer?.discountType ?? "flat") === opt.value
                                  ? "border-accent bg-accent/5 text-accent font-semibold"
                                  : "border-border text-muted-foreground hover:border-accent"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </Field>

                      {(draft.newUserOffer?.discountType ?? "flat") !== "free_shipping" && (
                        <Field
                          label={(draft.newUserOffer?.discountType ?? "flat") === "percent" ? "Discount Percentage" : "Discount Amount (₹)"}
                          hint={(draft.newUserOffer?.discountType ?? "flat") === "percent" ? "e.g. 10 = 10% off on first order" : "e.g. 100 = ₹100 off on first order"}
                        >
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={(draft.newUserOffer?.discountType ?? "flat") === "percent" ? 100 : undefined}
                              value={draft.newUserOffer?.discountValue ?? 0}
                              onChange={e => updateNested("newUserOffer", "discountValue", Number(e.target.value))}
                              className="rounded-none w-32"
                            />
                            <span className="text-sm text-muted-foreground">
                              {(draft.newUserOffer?.discountType ?? "flat") === "percent" ? "%" : "₹"}
                            </span>
                          </div>
                        </Field>
                      )}

                      <Field label="Valid for (days)" hint="Number of days after account creation during which the offer is available">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            value={draft.newUserOffer?.validDays ?? 7}
                            onChange={e => updateNested("newUserOffer", "validDays", Number(e.target.value))}
                            className="rounded-none w-24"
                          />
                          <span className="text-sm text-muted-foreground">days</span>
                        </div>
                      </Field>

                      <Field label="Offer Message" hint="Shown to the user in the checkout banner">
                        <Input
                          value={draft.newUserOffer?.message ?? ""}
                          onChange={e => updateNested("newUserOffer", "message", e.target.value)}
                          className="rounded-none"
                          placeholder="Welcome! Enjoy a special discount on your first order."
                        />
                      </Field>

                      <div className="p-4 bg-accent/5 border border-accent/20 text-xs text-muted-foreground space-y-1">
                        <p className="font-semibold text-foreground">Preview:</p>
                        <p>New users who registered within the last <strong>{draft.newUserOffer?.validDays ?? 7} days</strong> will see a welcome banner at checkout.</p>
                        {(draft.newUserOffer?.discountType ?? "flat") === "free_shipping" ? (
                          <p>They will receive <strong>free delivery</strong> on their first order.</p>
                        ) : (draft.newUserOffer?.discountType ?? "flat") === "percent" ? (
                          <p>They will get <strong>{draft.newUserOffer?.discountValue ?? 0}% off</strong> their first order.</p>
                        ) : (
                          <p>They will get <strong>₹{draft.newUserOffer?.discountValue ?? 0} off</strong> their first order.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Section>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}

/* ─── Circle Logo Cropper ──────────────────────────────────────────────────── */
function CircleLogoCropper({
  value,
  onChange,
  folder = "branding/logo",
  label = "Logo",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}) {
  const DEFAULT_IMG = "/pearlis-logo-circle.png";
  const displayUrl = value || DEFAULT_IMG;

  const [editing, setEditing] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(0.1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, ox: 0, oy: 0 });
  const [uploading, setUploading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const CANVAS_SIZE = 280;

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      setImgSrc(e.target?.result as string);
      setEditing(true);
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (!editing || !imgSrc) return;
    const img = new Image();
    img.onload = () => {
      imgElRef.current = img;
      const s = Math.max(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight);
      setMinScale(s * 0.4);
      setScale(s);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imgSrc;
  }, [editing, imgSrc]);

  function drawCanvas() {
    const canvas = canvasRef.current;
    const img = imgElRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    const S = CANVAS_SIZE;
    ctx.clearRect(0, 0, S, S);
    const iw = img.naturalWidth * scale, ih = img.naturalHeight * scale;
    const ix = (S - iw) / 2 + offset.x, iy = (S - ih) / 2 + offset.y;
    ctx.drawImage(img, ix, iy, iw, ih);
    /* Overlay outside circle */
    const ov = document.createElement("canvas");
    ov.width = S; ov.height = S;
    const oc = ov.getContext("2d")!;
    oc.fillStyle = "rgba(0,0,0,0.52)";
    oc.fillRect(0, 0, S, S);
    oc.globalCompositeOperation = "destination-out";
    oc.beginPath(); oc.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); oc.fill();
    ctx.drawImage(ov, 0, 0);
    /* Gold border */
    ctx.strokeStyle = "#D4AF37"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); ctx.stroke();
  }

  useEffect(() => { if (editing && imgElRef.current) drawCanvas(); }, [scale, offset, editing]);

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    setDragStart({ mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y });
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setOffset({ x: dragStart.ox + e.clientX - dragStart.mx, y: dragStart.oy + e.clientY - dragStart.my });
  }
  function onMouseUp() { setDragging(false); }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setScale(s => Math.max(minScale, Math.min(s - e.deltaY * 0.001, 8)));
  }

  async function applyCrop() {
    const img = imgElRef.current;
    if (!img) return;
    const out = document.createElement("canvas");
    out.width = CANVAS_SIZE; out.height = CANVAS_SIZE;
    const ctx = out.getContext("2d")!;
    const S = CANVAS_SIZE;
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); ctx.clip();
    const iw = img.naturalWidth * scale, ih = img.naturalHeight * scale;
    ctx.drawImage(img, (S - iw) / 2 + offset.x, (S - ih) / 2 + offset.y, iw, ih);
    setUploading(true);
    out.toBlob(async blob => {
      if (!blob) { setUploading(false); return; }
      try {
        const url = await uploadToCloudinary(blob, folder, "image", "logo-circle.png");
        onChange(url);
        toast({ title: `${label} saved!` });
        setEditing(false); setImgSrc(null);
      } catch (e: any) {
        toast({ title: e?.message || "Upload failed. Check Cloudinary settings on Render.", variant: "destructive" });
      } finally { setUploading(false); }
    }, "image/png");
  }

  return (
    <div className="space-y-3">
      {/* Circle preview */}
      <div className="flex items-center gap-4">
        <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-[#D4AF37]/40 bg-muted flex-shrink-0 shadow-sm">
          <img src={displayUrl} alt={label} className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).src = "/pearlis-logo-circle.png"; }} />
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
            {value ? "Saved ✓" : "Using default"}
          </p>
          <Button variant="outline" size="sm"
            className="rounded-none text-xs uppercase tracking-widest gap-1.5 h-8"
            onClick={() => fileRef.current?.click()}>
            <Upload className="w-3 h-3" /> Change {label}
          </Button>
          {value && (
            <button onClick={() => onChange("")}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors uppercase tracking-widest">
              <X className="w-3 h-3" /> Reset to default
            </button>
          )}
        </div>
      </div>

      {/* Crop editor */}
      {editing && imgSrc && (
        <div className="border border-[#D4AF37]/30 bg-muted/20 p-4 space-y-3 rounded-none">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center">
            Drag to reposition · Scroll to zoom
          </p>
          <div className="flex justify-center">
            <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE}
              className={`rounded-full shadow-md ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
              style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove}
              onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel} />
          </div>
          <div className="flex items-center gap-3 px-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest shrink-0">Zoom</span>
            <input type="range" min={Math.round(minScale * 100)} max={800} step={1}
              value={Math.round(scale * 100)}
              onChange={e => setScale(Number(e.target.value) / 100)}
              className="flex-1 accent-[#D4AF37] h-1" />
          </div>
          <div className="flex gap-2">
            <Button className="rounded-none text-xs uppercase tracking-widest bg-[#D4AF37] hover:bg-[#c9a430] text-black flex-1 gap-2 h-9"
              onClick={applyCrop} disabled={uploading}>
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {uploading ? "Uploading..." : "Crop & Save"}
            </Button>
            <Button variant="outline" className="rounded-none text-xs uppercase tracking-widest h-9"
              onClick={() => { setEditing(false); setImgSrc(null); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
    </div>
  );
}

function LogoUploadButton({ onUrl, label }: { onUrl: (url: string) => void; label: string }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, "branding/logo", "image");
      onUrl(url);
    } catch {
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
      <Button variant="outline" size="sm" className="rounded-none text-xs uppercase tracking-widest gap-2 w-fit" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        {uploading ? "Uploading..." : label}
      </Button>
    </>
  );
}

function VideoUploadButton({ onUrl, label }: { onUrl: (url: string) => void; label: string }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, "videos/featured", "video");
      onUrl(url);
    } catch {
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
      <Button variant="outline" size="sm" className="rounded-none text-xs uppercase tracking-widest gap-2 shrink-0" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        {uploading ? "Uploading..." : label}
      </Button>
    </>
  );
}

/* ── Multi-file uploader for Instagram grid ── */
function IgUploadButton({ accept, label, icon, onUrls }: {
  accept: string; label: string; icon: "image" | "video"; onUrls: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setUploading(true);
    const results: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const url = await uploadToCloudinary(file, "page-content/sections", "auto");
        results.push(url);
      } catch {}
    }
    if (results.length) onUrls(results);
    setUploading(false);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={icon === "image"}
        className="hidden"
        onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); }}
      />
      <Button
        variant="outline"
        size="sm"
        className="rounded-none text-xs uppercase tracking-widest gap-1.5 shrink-0"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        {uploading ? "Uploading..." : label}
      </Button>
    </>
  );
}

/* ── Navbar Categories Tab (needs category list) ── */
function NavbarCategoriesTab({
  draft, update, save, saving,
}: {
  draft: Partial<SiteSettings>;
  update: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => void;
  save: (key: keyof SiteSettings) => void;
  saving: boolean;
}) {
  const { data: categoriesData } = useListCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const excluded: string[] = (draft as any).navbarCategories?.excludedSlugs ?? [];

  function toggle(slug: string) {
    const next = excluded.includes(slug)
      ? excluded.filter(s => s !== slug)
      : [...excluded, slug];
    update("navbarCategories" as any, { excludedSlugs: next } as any);
  }

  return (
    <Section title="Navbar — Jewellery Menu" onSave={() => save("navbarCategories" as any)} saving={saving}>
      <p className="text-sm text-muted-foreground -mt-2 mb-6">
        Choose which categories appear in the Jewellery dropdown in the navigation bar. All categories are shown by default; uncheck to hide.
      </p>
      <div className="space-y-2">
        {/* "All Jewellery" is always shown */}
        <div className="flex items-center justify-between px-4 py-3 border border-border bg-muted/30">
          <div>
            <p className="text-sm font-medium">All Jewellery</p>
            <p className="text-xs text-muted-foreground">Links to /shop — always visible</p>
          </div>
          <Switch checked disabled />
        </div>
        {categories.length === 0 && (
          <p className="text-xs text-muted-foreground">No categories found. Create categories first.</p>
        )}
        {categories.map((cat: any) => {
          const isVisible = !excluded.includes(cat.slug);
          return (
            <div key={cat.id} className="flex items-center justify-between px-4 py-3 border border-border">
              <div>
                <p className="text-sm font-medium">{cat.name}</p>
                <p className="text-xs text-muted-foreground">/category/{cat.slug}</p>
              </div>
              <Switch checked={isVisible} onCheckedChange={() => toggle(cat.slug)} />
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function Section({ title, children, onSave, saving }: { title: string; children: React.ReactNode; onSave: () => void; saving: boolean }) {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <h2 className="font-serif text-xl">{title}</h2>
        <Button onClick={onSave} disabled={saving} className="rounded-none uppercase tracking-widest text-xs gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </Button>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="uppercase tracking-widest text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
