import { useRoute, Link } from "wouter";
import {
  useGetProduct,
  useGetRelatedProducts,
  useAddToCart,
  useGetProductReviews,
  useCreateReview,
  useAddToWishlist,
  useRemoveFromWishlist,
  useGetWishlist,
  getGetCartQueryKey,
  getGetProductReviewsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/ui/ProductCard";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Heart, Share2, ShieldCheck, Truck, RefreshCcw,
  Star, ChevronLeft, ChevronRight, Award, Minus, Plus, Tag, Play,
} from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { useRecentlyViewed, recordView } from "@/hooks/useRecentlyViewed";
import { SizeGuideModal } from "@/components/ui/SizeGuideModal";

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

type Variant = { name: string; productId?: number };
type Tab = "Description" | "Specifications" | "Reviews" | "Shipping & Returns";

const TABS: Tab[] = ["Description", "Specifications", "Reviews", "Shipping & Returns"];

function parseVariants(input: unknown): Variant[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean).map((v: any) => ({ name: String(v?.name ?? v), productId: v?.productId ? Number(v.productId) : undefined }));
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return parseVariants(parsed);
    } catch {
      return input.split(",").map(s => s.trim()).filter(Boolean).map(name => ({ name }));
    }
  }
  return [];
}

export default function ProductPage() {
  const [, params] = useRoute("/product/:id");
  const productId = Number(params?.id || 0);
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("Description");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [activeVariantIdx, setActiveVariantIdx] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const recentlyViewed = useRecentlyViewed(productId);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZoomed, setIsZoomed] = useState(false);

  const { data: product, isLoading } = useGetProduct(productId, { query: { enabled: !!productId, queryKey: ["product", productId] } });
  const { data: relatedProducts } = useGetRelatedProducts(productId, { query: { enabled: !!productId, queryKey: ["relatedProducts", productId] } });
  const { data: reviews } = useGetProductReviews(productId, { query: { enabled: !!productId, queryKey: ["productReviews", productId] } });
  const { data: wishlist } = useGetWishlist();
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const createReview = useCreateReview();

  useEffect(() => {
    if (product) recordView(product);
  }, [product]);

  const variants: Variant[] = product ? parseVariants((product as any).materialVariants) : [];
  const activeVariant = activeVariantIdx !== null ? variants[activeVariantIdx] : null;
  const linkedProductId = activeVariant?.productId ? Number(activeVariant.productId) : null;
  const { data: variantProduct, isFetching: variantFetching } = useGetProduct(linkedProductId ?? 0, { query: { enabled: !!linkedProductId, queryKey: ["variantProduct", linkedProductId] } });

  const dp = (variantProduct ?? product) as any;
  const dpImages = dp?.images?.length ? dp.images : ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=85&w=1600"];
  const dpPrice = Math.round((dp?.price ?? 0) * 83);
  const dpDiscountPrice = dp?.discountPrice ? Math.round(dp.discountPrice * 83) : null;
  const isWishlisted = wishlist?.some((w: any) => w.id === productId);
  const avgRating = reviews?.length ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length : 0;
  const videoUrl = (dp as any)?.videoUrl || (product as any)?.videoUrl;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    setZoomPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  const handleAddToCart = () => {
    addToCart.mutate(
      { data: { productId, quantity, size: undefined } },
      { onSuccess: () => toast({ title: "Added to bag" }) }
    );
  };

  const handleWishlist = () => {
    if (isWishlisted) removeFromWishlist.mutate({ id: productId });
    else addToWishlist.mutate({ data: { productId } });
  };

  const scrollCarousel = (dir: "left" | "right") => {
    carouselRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col overflow-x-hidden">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-2 overflow-hidden w-full">
        <BackButton className="max-w-full" />
      </div>

      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 pb-14 sm:pb-20 w-full overflow-x-hidden">

        {/* ── Main product grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 items-start">

          {/* ── LEFT: Image gallery ── */}
          <div className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="min-w-0"
            >
              {/* Main image / video area */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#F0EDE6] to-[#E8E4DC] aspect-[4/5] sm:aspect-square shadow-[0_8px_48px_rgba(15,15,15,0.08)]">
                {/* Badge strip */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  {product.isNew && <span className="px-2.5 py-1 bg-[#D4AF37] text-white text-[8px] tracking-[0.2em] uppercase font-bold rounded-full shadow-sm">New</span>}
                  {product.isTrending && <span className="px-2.5 py-1 bg-[#0F0F0F] text-white text-[8px] tracking-[0.2em] uppercase font-bold rounded-full shadow-sm">Trending</span>}
                </div>

                {selectedImage === -1 && videoUrl ? (
                  /* Video player in main area */
                  <div className="absolute inset-0 bg-[#0A0A0A]">
                    {videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
                      <iframe
                        src={videoUrl.includes("embed") ? videoUrl : videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                        className="w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title="Product video"
                      />
                    ) : (
                      <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" />
                    )}
                  </div>
                ) : (
                  <div
                    ref={imgRef}
                    className="absolute inset-0 cursor-zoom-in"
                    onMouseEnter={() => setIsZoomed(true)}
                    onMouseLeave={() => setIsZoomed(false)}
                    onMouseMove={handleMouseMove}
                    onClick={() => setLightboxOpen(true)}
                  >
                    {variantFetching && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F0EDE6]/80">
                        <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
                      </div>
                    )}
                    <img
                      src={dpImages[selectedImage] || dpImages[0]}
                      alt={dp?.name || product.name}
                      className={`w-full h-full object-cover transition-transform duration-700 ${isZoomed ? "scale-115 sm:scale-130" : "scale-100"}`}
                      style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
                      draggable={false}
                    />
                  </div>
                )}

                {/* Chevron nav — only for images */}
                {selectedImage !== -1 && dpImages.length > 1 && (
                  <>
                    <button onClick={e => { e.stopPropagation(); setSelectedImage(p => (p - 1 + dpImages.length) % dpImages.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <ChevronLeft className="w-4 h-4 text-[#0F0F0F]" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setSelectedImage(p => (p + 1) % dpImages.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <ChevronRight className="w-4 h-4 text-[#0F0F0F]" />
                    </button>
                  </>
                )}
                {/* Zoom hint — only when viewing image */}
                {selectedImage !== -1 && (
                  <div className="absolute bottom-4 right-4 text-[8px] tracking-[0.15em] uppercase text-[#0F0F0F]/30 bg-white/70 backdrop-blur-sm px-2 py-1 rounded-full pointer-events-none hidden sm:block">
                    Tap to zoom
                  </div>
                )}
              </div>

              {/* Thumbnails — images + optional video thumb */}
              {(dpImages.length > 1 || videoUrl) && (
                <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {dpImages.map((img: string, i: number) => (
                    <button key={i} onClick={() => setSelectedImage(i)}
                      className={`flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${selectedImage === i ? "border-[#D4AF37] shadow-[0_4px_16px_rgba(212,175,55,0.25)]" : "border-transparent opacity-60 hover:opacity-100"}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {/* Video thumbnail */}
                  {videoUrl && (
                    <button
                      onClick={() => setSelectedImage(-1)}
                      className={`flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-2xl overflow-hidden border-2 transition-all duration-200 relative ${selectedImage === -1 ? "border-[#D4AF37] shadow-[0_4px_16px_rgba(212,175,55,0.25)]" : "border-transparent opacity-60 hover:opacity-100"}`}
                    >
                      {/* Try YouTube thumbnail or fallback dark bg */}
                      {videoUrl.includes("youtube") || videoUrl.includes("youtu.be") ? (() => {
                        const ytId = videoUrl.match(/(?:embed\/|v=|youtu\.be\/)([^?&/]+)/)?.[1];
                        return ytId ? <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="Video" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#0A0A0A]" />;
                      })() : <div className="w-full h-full bg-[#0A0A0A]" />}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37]/90 flex items-center justify-center shadow-lg">
                          <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── RIGHT: Info panel ── */}
          <div className="min-w-0">
            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center gap-1.5 text-[8px] sm:text-[9px] tracking-[0.18em] uppercase text-[#0F0F0F]/35 min-w-0 mb-4">
              <Link href="/" className="hover:text-[#D4AF37] transition-colors">Home</Link>
              <span>/</span>
              <Link href="/shop" className="hover:text-[#D4AF37] transition-colors">Shop</Link>
              {product.category && <><span>/</span><Link href={`/category/${product.category}`} className="hover:text-[#D4AF37] transition-colors capitalize">{product.category}</Link></>}
              <span>/</span>
              <span className="text-[#0F0F0F]/55 truncate max-w-[12rem] sm:max-w-[26rem]">{product.name}</span>
            </div>

            {/* Category + stock badge */}
            <div className="flex items-center gap-2.5 mb-4 flex-wrap min-w-0">
              {product.category && (
                <Link href={`/category/${product.category}`} className="flex items-center gap-1.5 text-[9px] tracking-[0.3em] uppercase text-[#D4AF37] font-semibold hover:underline underline-offset-2">
                  <Tag className="w-3 h-3" />{product.category}
                </Link>
              )}
              {product.stock < 5 && product.stock > 0 && (
                <span className="text-[8px] tracking-[0.15em] uppercase bg-red-50 text-red-500 px-2.5 py-1 font-bold rounded-full border border-red-100">
                  Only {product.stock} left
                </span>
              )}
              {product.stock === 0 && (
                <span className="text-[8px] tracking-[0.15em] uppercase bg-[#0F0F0F]/5 text-[#0F0F0F]/45 px-2.5 py-1 font-bold rounded-full">
                  Made to Order
                </span>
              )}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-w-0">
              <h1 className="font-serif text-[1.4rem] sm:text-3xl md:text-4xl xl:text-[2.6rem] text-[#0F0F0F] leading-tight mb-4 break-words">
                {dp?.name || product.name}
              </h1>

              {/* Stars */}
              {reviews && reviews.length > 0 && (
                <div className="flex items-center gap-2.5 mb-5 flex-wrap min-w-0">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(avgRating) ? "text-[#D4AF37] fill-[#D4AF37]" : "text-[#D4AF37]/25"}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#0F0F0F]/45 tracking-wide">
                    {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Gold divider */}
              <motion.div className="h-px bg-gradient-to-r from-[#D4AF37] via-[#D4AF37]/40 to-transparent mb-6" initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.2 }} />

              {/* Price */}
              <div className="flex flex-wrap items-end gap-3 mb-7 min-w-0">
                {dpDiscountPrice ? (
                  <>
                    <span className="font-serif text-2xl sm:text-3xl text-[#0F0F0F]">{INR(dpDiscountPrice)}</span>
                    <span className="text-base sm:text-lg text-[#0F0F0F]/28 line-through pb-0.5">{INR(dpPrice)}</span>
                    <span className="text-[9px] tracking-[0.15em] uppercase bg-[#D4AF37]/12 text-[#D4AF37] px-3 py-1 font-bold rounded-full border border-[#D4AF37]/20">
                      Save {Math.round((1 - dpDiscountPrice / dpPrice) * 100)}%
                    </span>
                  </>
                ) : (
                  <span className="font-serif text-2xl sm:text-3xl text-[#0F0F0F]">{INR(dpPrice)}</span>
                )}
              </div>
            </motion.div>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="mb-6 min-w-0">
                <p className="text-[9px] tracking-[0.25em] uppercase text-[#0F0F0F]/45 font-semibold mb-3">
                  Material: <span className="text-[#0F0F0F]">{activeVariantIdx !== null ? variants[activeVariantIdx].name : variants[0].name}</span>
                </p>
                <div className="flex flex-wrap gap-2 min-w-0">
                  {variants.map((v, i) => {
                    const isActive = activeVariantIdx === i || (activeVariantIdx === null && i === 0);
                    return (
                      <button key={i} onClick={() => setActiveVariantIdx(i === 0 && activeVariantIdx === null ? null : i)}
                        className={`relative px-3 py-2 text-[9px] sm:text-[10px] tracking-[0.12em] uppercase font-medium border transition-all duration-200 rounded-full ${isActive ? "border-[#D4AF37] bg-[#D4AF37]/8 text-[#0F0F0F] shadow-[0_4px_12px_rgba(212,175,55,0.15)]" : "border-[#0F0F0F]/12 text-[#0F0F0F]/45 hover:border-[#D4AF37]/50 hover:text-[#0F0F0F]"}`}>
                        {v.name}
                        {v.productId && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#D4AF37]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size */}
            <div className="mb-6 min-w-0">
              <div className="flex items-center justify-between mb-3 gap-2 min-w-0">
                <p className="text-[9px] tracking-[0.25em] uppercase text-[#0F0F0F]/45 font-semibold">
                  {product.category?.toLowerCase().includes("ring") ? "Ring Size" : "Size"}: <span className="text-[#0F0F0F]">{selectedSize ?? "Select"}</span>
                </p>
                <button onClick={() => setShowSizeGuide(true)} className="text-[9px] tracking-[0.15em] uppercase text-[#D4AF37] underline underline-offset-2 font-semibold whitespace-nowrap hover:text-[#0F0F0F] transition-colors">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-2 min-w-0">
                {(product as any).sizes?.length
                  ? (product as any).sizes.map((s: string) => (
                    <button key={s} onClick={() => setSelectedSize(s)}
                      className={`w-10 h-10 text-xs font-medium border rounded-full transition-all duration-200 ${selectedSize === s ? "border-[#D4AF37] bg-[#D4AF37] text-white shadow-[0_4px_12px_rgba(212,175,55,0.35)]" : "border-[#0F0F0F]/12 text-[#0F0F0F]/55 hover:border-[#D4AF37]/60"}`}>
                      {s}
                    </button>
                  ))
                  : <button className="w-10 h-10 text-xs font-medium border rounded-full border-[#0F0F0F]/12 text-[#0F0F0F]/35 cursor-default">—</button>}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-7 min-w-0">
              <p className="text-[9px] tracking-[0.25em] uppercase text-[#0F0F0F]/45 font-semibold mb-3">Quantity</p>
              <div className="flex items-center border border-[#0F0F0F]/12 w-full sm:w-fit rounded-full overflow-hidden bg-white shadow-sm">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-11 h-11 flex items-center justify-center hover:bg-[#0F0F0F]/5 transition-colors">
                  <Minus className="w-3.5 h-3.5 text-[#0F0F0F]" />
                </button>
                <span className="flex-1 sm:w-12 h-11 flex items-center justify-center font-semibold text-[#0F0F0F] text-sm border-x border-[#0F0F0F]/8">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock || 10, q + 1))} className="w-11 h-11 flex items-center justify-center hover:bg-[#0F0F0F]/5 transition-colors">
                  <Plus className="w-3.5 h-3.5 text-[#0F0F0F]" />
                </button>
              </div>
            </div>

            {/* Out of stock notify */}
            {product.stock === 0 && (
              <div className="mb-6">
                <button className="w-full h-13 rounded-full bg-[#D4AF37] text-white uppercase tracking-[0.2em] text-[10px] font-bold hover:bg-[#c4a030] transition-colors">
                  Notify Me When Available
                </button>
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-8 min-w-0">
              <button
                onClick={handleAddToCart}
                disabled={addToCart.isPending || product.stock === 0}
                className="w-full min-h-14 rounded-full bg-[#0F0F0F] hover:bg-[#1c1c1c] text-white text-[10px] tracking-[0.25em] uppercase font-bold transition-all duration-300 flex items-center justify-center gap-2 px-6 py-4 sm:py-0 disabled:opacity-40 hover:shadow-[0_16px_32px_rgba(15,15,15,0.18)] active:scale-[0.98]"
              >
                {addToCart.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : product.stock === 0 ? "Out of Stock" : "Add to Bag"}
              </button>
              <div className="grid grid-cols-2 gap-2.5 sm:contents">
                <button
                  onClick={handleWishlist}
                  className={`w-full sm:w-14 min-h-14 rounded-full border flex items-center justify-center transition-all duration-300 ${isWishlisted ? "border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_8px_24px_rgba(212,175,55,0.18)]" : "border-[#0F0F0F]/12 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5"}`}
                >
                  <Heart className={`w-4.5 h-4.5 transition-all ${isWishlisted ? "text-[#D4AF37] fill-[#D4AF37] scale-110" : "text-[#0F0F0F]/40"}`} />
                </button>
                <button className="w-full sm:w-14 min-h-14 rounded-full border border-[#0F0F0F]/12 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 flex items-center justify-center transition-all duration-300">
                  <Share2 className="w-4 h-4 text-[#0F0F0F]/40" />
                </button>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 border-t border-[#0F0F0F]/6 pt-7 mb-7 min-w-0">
              {[
                { icon: Truck, label: "Free Shipping", sub: "Above ₹5,000" },
                { icon: ShieldCheck, label: "BIS Certified", sub: "Hallmarked" },
                { icon: RefreshCcw, label: "30-Day Returns", sub: "Hassle-free" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center gap-2 p-3 bg-white rounded-2xl border border-[#0F0F0F]/5 shadow-[0_2px_8px_rgba(15,15,15,0.04)] min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-[8px] tracking-[0.1em] uppercase font-bold text-[#0F0F0F] leading-tight break-words">{label}</p>
                    <p className="text-[8px] text-[#0F0F0F]/35 mt-0.5 break-words">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Material note */}
            {product.material && (
              <div className="flex items-center gap-2 text-[10px] text-[#0F0F0F]/35 min-w-0 bg-white/60 px-3 py-2.5 rounded-xl border border-[#0F0F0F]/5">
                <Award className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                <span className="break-words">Base material: {product.material}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="mt-16 sm:mt-24 border-t border-[#0F0F0F]/6 pt-10 sm:pt-14 min-w-0">
          <div className="flex gap-0 border-b border-[#0F0F0F]/6 mb-10 sm:mb-14 overflow-x-auto max-w-full" style={{ scrollbarWidth: "none" }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`relative px-4 sm:px-7 py-4 text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase font-semibold whitespace-nowrap transition-colors ${activeTab === tab ? "text-[#0F0F0F]" : "text-[#0F0F0F]/30 hover:text-[#0F0F0F]/60"}`}>
                {tab}
                {activeTab === tab && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]" />}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={`${activeTab}-${selectedImage}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }} className="max-w-3xl min-w-0">

              {/* ── Description tab ── */}
              {activeTab === "Description" && (
                <div className="space-y-8 min-w-0">
                  <div className="space-y-4 text-[#0F0F0F]/60 leading-relaxed text-sm min-w-0 break-words">
                    {dp?.description && <p className="text-base text-[#0F0F0F]/70 leading-loose">{dp.description}</p>}
                    {dp?.craftStory
                      ? <p>{dp.craftStory}</p>
                      : <p>Each Pearlis piece is handcrafted by master artisans with decades of experience, combining traditional Indian jewellery techniques with contemporary design sensibilities.</p>}
                  </div>

                  {/* Craft points */}
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                    {(dp?.craftPoints?.length
                      ? dp.craftPoints
                      : ["Handcrafted by certified artisans", "BIS Hallmarked for purity assurance", "Ethically sourced gemstones", "Comes in a Pearlis signature gift box", "Certificate of authenticity included"]
                    ).map((pt: string) => (
                      <li key={pt} className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-[#0F0F0F]/5 shadow-[0_2px_8px_rgba(15,15,15,0.03)] text-[11px] tracking-wide text-[#0F0F0F]/65 min-w-0">
                        <span className="w-4 h-4 rounded-full bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                        </span>
                        {pt}
                      </li>
                    ))}
                  </ul>

                  {/* Video player */}
                  {videoUrl && (
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-px flex-1 bg-[#0F0F0F]/6" />
                        <p className="text-[9px] tracking-[0.25em] uppercase text-[#0F0F0F]/35 font-semibold whitespace-nowrap">Craftsmanship Story</p>
                        <div className="h-px flex-1 bg-[#0F0F0F]/6" />
                      </div>
                      <div className="relative rounded-2xl overflow-hidden bg-[#0F0F0F] shadow-[0_16px_48px_rgba(15,15,15,0.15)] aspect-video w-full group">
                        {!videoPlaying ? (
                          <>
                            {/* Thumbnail overlay */}
                            <img
                              src={dpImages[0]}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity duration-300"
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F]/80 via-[#0F0F0F]/20 to-transparent" />
                            {/* Play button */}
                            <button
                              onClick={() => setVideoPlaying(true)}
                              className="absolute inset-0 flex flex-col items-center justify-center gap-4 group"
                              aria-label="Play video"
                            >
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                              >
                                <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white ml-1" />
                              </motion.div>
                              <div className="text-center">
                                <p className="text-white text-sm font-serif">Watch the Story</p>
                                <p className="text-white/50 text-[10px] tracking-[0.15em] uppercase mt-1">Behind the Craft</p>
                              </div>
                            </button>
                            {/* Gold corner accent */}
                            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37]/60 rounded-tl-lg" />
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37]/60 rounded-br-lg" />
                          </>
                        ) : (
                          <iframe
                            src={`${videoUrl}?autoplay=1&rel=0&modestbranding=1`}
                            title="Product video"
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Specifications tab ── */}
              {activeTab === "Specifications" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 min-w-0">
                  {(dp?.specifications?.length > 0 ? dp.specifications : [
                    { key: "Metal", value: activeVariant?.name || product.material || "Precious Metal" },
                    { key: "Category", value: product.category },
                    { key: "Stock", value: product.stock > 0 ? `${product.stock} units available` : "Made to Order (4–6 weeks)" },
                    { key: "SKU", value: `PRL-${String(product.id).padStart(5, "0")}` },
                    { key: "Weight", value: "Approx. 4–7g" },
                    { key: "Finish", value: "High Polish" },
                  ]).map(({ key: k, value: v }: { key: string; value: string }) => (
                    <div key={k} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 py-4 border-b border-[#0F0F0F]/5 min-w-0">
                      <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/35 font-semibold">{k}</span>
                      <span className="text-sm text-[#0F0F0F]/75 font-medium break-words text-right sm:text-left capitalize">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Reviews tab ── */}
              {activeTab === "Reviews" && (
                <div className="space-y-10">
                  {reviews && reviews.length > 0 ? (
                    <div className="space-y-8 min-w-0">
                      <div className="flex flex-col sm:flex-row items-start gap-6 p-5 sm:p-7 bg-white border border-[#0F0F0F]/5 rounded-2xl shadow-[0_4px_20px_rgba(15,15,15,0.05)] min-w-0">
                        <div className="text-center flex sm:flex-col items-center gap-4 sm:gap-0 min-w-0">
                          <p className="font-serif text-4xl sm:text-5xl text-[#0F0F0F]">{avgRating.toFixed(1)}</p>
                          <div>
                            <div className="flex justify-center mt-2 mb-1.5 gap-0.5">
                              {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(avgRating) ? "text-[#D4AF37] fill-[#D4AF37]" : "text-[#D4AF37]/20"}`} />)}
                            </div>
                            <p className="text-[9px] tracking-[0.15em] uppercase text-[#0F0F0F]/35">{reviews.length} reviews</p>
                          </div>
                        </div>
                        <div className="flex-1 w-full space-y-2 min-w-0">
                          {[5,4,3,2,1].map(star => {
                            const cnt = reviews.filter((r: { rating: number }) => r.rating === star).length;
                            return (
                              <div key={star} className="flex items-center gap-3 min-w-0">
                                <span className="text-[9px] text-[#0F0F0F]/35 w-4">{star}</span>
                                <div className="flex-1 h-1.5 bg-[#0F0F0F]/5 overflow-hidden rounded-full">
                                  <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#c4a030] rounded-full transition-all duration-700" style={{ width: `${reviews.length ? (cnt / reviews.length) * 100 : 0}%` }} />
                                </div>
                                <span className="text-[9px] text-[#0F0F0F]/25 w-4">{cnt}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {reviews.map((r: { id: number; userName?: string; rating: number; comment?: string; createdAt: string }, idx: number) => (
                        <div key={idx} className="border-b border-[#0F0F0F]/5 pb-8 min-w-0">
                          <div className="flex items-center gap-3 mb-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 flex items-center justify-center text-[#D4AF37] font-bold text-sm border border-[#D4AF37]/15 flex-shrink-0">
                              {(r.userName || "A").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#0F0F0F]/80 mb-0.5 truncate">{r.userName || "Anonymous"}</p>
                              <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "text-[#D4AF37] fill-[#D4AF37]" : "text-[#D4AF37]/20"}`} />)}</div>
                              <p className="text-[9px] text-[#0F0F0F]/28 mt-0.5">{new Date(r.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}</p>
                            </div>
                          </div>
                          <p className="text-sm text-[#0F0F0F]/60 leading-relaxed break-words pl-12">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 min-w-0">
                      <div className="w-16 h-16 rounded-full bg-[#D4AF37]/8 flex items-center justify-center mx-auto mb-5">
                        <Star className="w-7 h-7 text-[#D4AF37]/40" />
                      </div>
                      <p className="font-serif text-xl text-[#0F0F0F]/35 mb-2">No reviews yet</p>
                      <p className="text-sm text-[#0F0F0F]/25">Be the first to share your experience.</p>
                    </div>
                  )}

                  {/* Write review */}
                  <div className="border-t border-[#0F0F0F]/6 pt-10">
                    <h3 className="font-serif text-2xl text-[#0F0F0F] mb-7">Write a Review</h3>
                    {reviewSubmitted ? (
                      <div className="flex flex-col items-center py-12 text-center min-w-0 bg-white rounded-2xl border border-[#0F0F0F]/5 shadow-[0_4px_20px_rgba(15,15,15,0.04)]">
                        <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-5">
                          <Star className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37]" />
                        </div>
                        <p className="font-serif text-xl text-[#0F0F0F] mb-2">Thank you for your review!</p>
                        <p className="text-sm text-[#0F0F0F]/40 mb-7">Your feedback helps other customers.</p>
                        <button onClick={() => { setReviewSubmitted(false); setReviewName(""); setReviewRating(0); setReviewComment(""); }}
                          className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37] hover:text-[#0F0F0F] transition-colors font-semibold">
                          Write Another Review
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          if (!reviewRating) { toast({ title: "Please select a star rating", variant: "destructive" }); return; }
                          if (!reviewComment.trim()) { toast({ title: "Please write a comment", variant: "destructive" }); return; }
                          createReview.mutate(
                            { id: productId, data: { rating: reviewRating, comment: reviewComment, userName: reviewName || "Anonymous" } },
                            {
                              onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetProductReviewsQueryKey(productId) }); setReviewSubmitted(true); toast({ title: "Review submitted!", description: "Thank you for your feedback." }); },
                              onError: () => toast({ title: "Failed to submit", description: "Please try again.", variant: "destructive" })
                            }
                          );
                        }}
                        className="space-y-5 max-w-lg w-full min-w-0"
                      >
                        <div>
                          <p className="text-[10px] tracking-[0.2em] uppercase text-[#0F0F0F]/45 font-semibold mb-3">Your Rating *</p>
                          <div className="flex gap-1 flex-wrap items-center">
                            {[1,2,3,4,5].map(s => (
                              <button key={s} type="button" onClick={() => setReviewRating(s)} onMouseEnter={() => setReviewHover(s)} onMouseLeave={() => setReviewHover(0)} className="p-0.5 transition-transform hover:scale-110">
                                <Star className={`w-7 h-7 transition-colors ${s <= (reviewHover || reviewRating) ? "text-[#D4AF37] fill-[#D4AF37]" : "text-[#0F0F0F]/12"}`} />
                              </button>
                            ))}
                            {reviewRating > 0 && <span className="ml-2 text-xs text-[#0F0F0F]/40 self-center">{["", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewRating]}</span>}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] tracking-[0.2em] uppercase text-[#0F0F0F]/45 font-semibold block mb-2">Your Name</label>
                          <input type="text" value={reviewName} onChange={e => setReviewName(e.target.value)} placeholder="e.g. Priya S." maxLength={60}
                            className="w-full border border-[#0F0F0F]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] bg-white placeholder:text-[#0F0F0F]/20 transition-colors" />
                        </div>
                        <div>
                          <label className="text-[10px] tracking-[0.2em] uppercase text-[#0F0F0F]/45 font-semibold block mb-2">Your Review *</label>
                          <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="What did you love about this piece?" rows={4} maxLength={1000} required
                            className="w-full border border-[#0F0F0F]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] bg-white placeholder:text-[#0F0F0F]/20 resize-none transition-colors" />
                          <p className="text-[9px] text-[#0F0F0F]/22 mt-1 text-right">{reviewComment.length}/1000</p>
                        </div>
                        <button type="submit" disabled={createReview.isPending}
                          className="flex items-center gap-2 px-8 py-3.5 bg-[#0F0F0F] text-white text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-[#D4AF37] hover:text-[#0F0F0F] transition-all duration-300 disabled:opacity-50 rounded-full shadow-[0_8px_20px_rgba(15,15,15,0.12)]">
                          {createReview.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Submit Review
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* ── Shipping & Returns tab ── */}
              {activeTab === "Shipping & Returns" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                  {(dp?.shippingInfo
                    ? dp.shippingInfo.split(/\n\n+/).map((block: string, i: number) => {
                      const lines = block.trim().split("\n");
                      return { title: lines[0], body: lines.slice(1).join(" ").trim(), idx: i };
                    })
                    : [
                      { title: "Free Standard Shipping", body: "Complimentary shipping on all orders above ₹5,000 across India. Standard delivery in 5–7 business days. Tracked and fully insured.", idx: 0 },
                      { title: "Express Delivery", body: "Need it sooner? Express delivery (2–3 business days) available for ₹299. Available in all major metros.", idx: 1 },
                      { title: "International Shipping", body: "We ship worldwide. International orders via DHL Express in 10–15 business days. Duties and taxes may apply.", idx: 2 },
                      { title: "Easy 30-Day Returns", body: "Not in love? Return within 30 days in original, unworn condition. Free pickup arranged, refund in 5–7 business days.", idx: 3 },
                    ]
                  ).map(({ title, body, idx }: { title: string; body: string; idx: number }) => (
                    <div key={idx} className="p-5 bg-white rounded-2xl border border-[#0F0F0F]/5 shadow-[0_2px_12px_rgba(15,15,15,0.04)] min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-3">
                        {idx === 0 && <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />}
                        {idx === 1 && <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />}
                        {idx === 2 && <Award className="w-3.5 h-3.5 text-[#D4AF37]" />}
                        {idx === 3 && <RefreshCcw className="w-3.5 h-3.5 text-[#D4AF37]" />}
                      </div>
                      <h4 className="text-[10px] tracking-[0.15em] uppercase font-bold text-[#0F0F0F] mb-2">{title}</h4>
                      {body && <p className="text-sm text-[#0F0F0F]/55 leading-relaxed">{body}</p>}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Recently Viewed ── */}
        {recentlyViewed.length > 0 && (
          <div className="mt-20 sm:mt-28 pt-14 sm:pt-16 border-t border-[#0F0F0F]/6 min-w-0">
            <div className="mb-8 sm:mb-10">
              <p className="text-[#D4AF37] text-[9px] tracking-[0.35em] uppercase font-semibold mb-2">Your Journey</p>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#0F0F0F]">Recently Viewed</h2>
            </div>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth max-w-full" style={{ scrollbarWidth: "none" }}>
              {recentlyViewed.slice(0, 5).map((p, i) => {
                const img = p.images?.[0] || "https://images.unsplash.com/photo-1573408301185-9519f94815b5?auto=format&fit=crop&q=85&w=900";
                const price = Math.round(p.price * 83);
                const discPrice = p.discountPrice ? Math.round(p.discountPrice * 83) : null;
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.07 }} className="flex-shrink-0 w-40 sm:w-56 md:w-64 snap-start group min-w-0">
                    <Link href={`/product/${p.id}`}>
                      <div className="relative overflow-hidden bg-[#F0EDE6] rounded-2xl" style={{ aspectRatio: "3/4" }}>
                        <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="pt-3">
                        {p.category && <p className="text-[8px] tracking-[0.2em] uppercase text-[#D4AF37] font-semibold mb-1">{p.category}</p>}
                        <p className="font-serif text-sm sm:text-base text-[#0F0F0F] leading-snug line-clamp-2 mb-1.5 break-words">{p.name}</p>
                        <div className="flex items-center gap-2">
                          {discPrice
                            ? <><span className="text-sm font-semibold text-[#0F0F0F]">₹{discPrice.toLocaleString("en-IN")}</span><span className="text-xs text-[#0F0F0F]/30 line-through">₹{price.toLocaleString("en-IN")}</span></>
                            : <span className="text-sm font-semibold text-[#0F0F0F]">₹{price.toLocaleString("en-IN")}</span>}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Related products ── */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-20 sm:mt-28 pt-14 sm:pt-16 border-t border-[#0F0F0F]/6 min-w-0">
            <div className="flex items-end justify-between mb-8 sm:mb-10 flex-wrap gap-4">
              <div>
                <p className="text-[#D4AF37] text-[9px] tracking-[0.35em] uppercase font-semibold mb-2">Curated For You</p>
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#0F0F0F]">You May Also Love</h2>
              </div>
              <div className="hidden md:flex gap-2">
                <button onClick={() => scrollCarousel("left")} className="w-10 h-10 rounded-full border border-[#0F0F0F]/12 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 flex items-center justify-center transition-all duration-200">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => scrollCarousel("right")} className="w-10 h-10 rounded-full border border-[#0F0F0F]/12 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 flex items-center justify-center transition-all duration-200">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div ref={carouselRef} className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth max-w-full" style={{ scrollbarWidth: "none" }}>
              {relatedProducts.map((p: Parameters<typeof ProductCard>[0]["product"], i: number) => (
                <div key={p.id} className="flex-shrink-0 w-40 sm:w-56 md:w-64 snap-start min-w-0">
                  <ProductCard product={p} index={i} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightboxOpen(false)} className="fixed inset-0 z-[200] bg-black/96 flex items-center justify-center px-4">
            <motion.img initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }} src={dpImages[selectedImage]} alt={dp?.name} className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
            <button onClick={() => setLightboxOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white text-[11px] tracking-[0.2em] uppercase transition-colors">✕ Close</button>
            {dpImages.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setSelectedImage(p => (p - 1 + dpImages.length) % dpImages.length); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button onClick={e => { e.stopPropagation(); setSelectedImage(p => (p + 1) % dpImages.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <SizeGuideModal
        open={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        defaultTab={
          product?.category?.toLowerCase().includes("ring") ? "ring"
          : product?.category?.toLowerCase().includes("bracelet") || product?.category?.toLowerCase().includes("bangle") ? "bracelet"
          : product?.category?.toLowerCase().includes("necklace") ? "necklace"
          : "ring"
        }
      />
      <Footer />
    </div>
  );
}
