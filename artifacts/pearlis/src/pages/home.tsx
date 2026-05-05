import {
  useGetFeaturedProducts,
  useGetTrendingProducts,
  useGetNewArrivals,
  useListBlogs,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/ui/ProductCard";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { load as loadRecentlyViewed, type RecentProduct } from "@/hooks/useRecentlyViewed";
import {
  ArrowRight, Star, Shield, Truck, RefreshCcw, Award, Gem,
  Clock, Instagram, Play, ChevronLeft, ChevronRight, ExternalLink,
} from "lucide-react";
import { useGetSettings } from "@/lib/adminApi";
import { apiUrl } from "@/lib/apiUrl";

/* ══════════════════════════════════════════════════════════
   CATEGORIES CAROUSEL
══════════════════════════════════════════════════════════ */
const CATS = [
  { label: "Ring", slug: "ring", src: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=85&w=500&h=700" },
  { label: "Earring", slug: "earring", src: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=85&w=500&h=700" },
  { label: "Pendants", slug: "pendants", src: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&q=85&w=500&h=700" },
  { label: "Stickons", slug: "stickons", src: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=85&w=500&h=700" },
  { label: "Bracelet", slug: "bracelet", src: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=85&w=500&h=700" },
  { label: "Anklets", slug: "anklets", src: "https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?auto=format&fit=crop&q=85&w=500&h=700" },
  { label: "Crunchies", slug: "crunchies", src: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=85&w=500&h=700" },
  { label: "Hair Accessories", slug: "hair-accessories", src: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=85&w=500&h=700" },
  { label: "Hair Band", slug: "hair-band", src: "https://images.unsplash.com/photo-1512361436605-a484bdb34b5f?auto=format&fit=crop&q=85&w=500&h=700" },
  { label: "Waist Chain", slug: "waist-chain", src: "https://images.unsplash.com/photo-1619119069152-a2b331eb392a?auto=format&fit=crop&q=85&w=500&h=700" },
  { label: "Keys Chain", slug: "keys-chain", src: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=85&w=500&h=700" },
  { label: "Crochet Flowers", slug: "crochet-flowers", src: "https://images.unsplash.com/photo-1592861956120-e524fc739696?auto=format&fit=crop&q=85&w=500&h=700" },
];

function CategoriesCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    // Calculate which card is most centered
    const cards = Array.from(el.children) as HTMLElement[];
    const center = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;
    cards.forEach((c, i) => {
      const dist = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setActiveIdx(closest);
  };

  const scrollTo = (dir: "prev" | "next") => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.children[0] as HTMLElement;
    const step = card ? card.offsetWidth + 12 : 260;
    el.scrollBy({ left: dir === "next" ? step : -step, behavior: "smooth" });
  };

  const scrollToIdx = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.children[i] as HTMLElement;
    if (card) el.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" });
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    updateArrows();
    return () => el.removeEventListener("scroll", updateArrows);
  }, []);

  return (
    <section className="py-16 md:py-24 bg-[#FAF8F3] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <motion.div {...fadeUp()} className="text-center mb-10 md:mb-14">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold mb-3">Shop by Category</p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#0F0F0F]">Explore Our World</h2>
          <div className="w-12 h-[2px] bg-[#D4AF37] mx-auto mt-4" />
        </motion.div>

        {/* Carousel wrapper */}
        <div className="relative">
          {/* Prev arrow */}
          <button
            onClick={() => scrollTo("prev")}
            className={`hidden sm:flex absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white border border-[#D4AF37]/40 items-center justify-center shadow-md hover:bg-[#D4AF37] hover:text-white hover:border-[#D4AF37] transition-all duration-200 ${canPrev ? "opacity-100 cursor-pointer" : "opacity-30 cursor-default"}`}
            disabled={!canPrev}
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* Track */}
          <div
            ref={trackRef}
            className="flex gap-2 md:gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {CATS.map(({ label, slug, src }, i) => (
              <Link key={slug} href={`/category/${slug}`}
                className="flex-shrink-0 snap-start w-[42vw] sm:w-[28vw] md:w-[22vw] lg:w-[calc(16.66%-10px)] xl:w-48 cursor-pointer group"
              >
                <div className="relative aspect-[2/3] overflow-hidden">
                  <img
                    src={src} alt={label} loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute inset-0 bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/12 transition-all duration-500" />
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#D4AF37]/60 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-center">
                    <p className="text-white font-serif text-sm md:text-base leading-tight">{label}</p>
                    <p className="text-[#D4AF37] text-[8px] tracking-[0.22em] uppercase mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold">
                      Shop →
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Next arrow */}
          <button
            onClick={() => scrollTo("next")}
            className={`hidden sm:flex absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white border border-[#D4AF37]/40 items-center justify-center shadow-md hover:bg-[#D4AF37] hover:text-white hover:border-[#D4AF37] transition-all duration-200 ${canNext ? "opacity-100 cursor-pointer" : "opacity-30 cursor-default"}`}
            disabled={!canNext}
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-6">
          {CATS.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIdx(i)}
              className={`transition-all duration-300 rounded-full ${i === activeIdx ? "w-6 h-1.5 bg-[#D4AF37]" : "w-1.5 h-1.5 bg-[#D4AF37]/30"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── atelier video helpers ─── */
function isYouTubeUrl(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}
function getYTId(url: string) {
  const m = url.match(/(?:embed\/|v=|youtu\.be\/)([^?&/]+)/);
  return m?.[1] || "";
}

/* ─── animation helpers ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

/* ─── countdown ─── */
function useCountdown(targetMs: number) {
  const [t, setT] = useState(() => {
    const raw = targetMs - Date.now();
    const d = Math.max(0, raw);
    return { h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000), expired: raw <= 0 };
  });
  useEffect(() => {
    if (!targetMs) return;
    const id = setInterval(() => {
      const raw = targetMs - Date.now();
      const d = Math.max(0, raw);
      setT({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000), expired: raw <= 0 });
    }, 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return t;
}

const INR = (n: number) => `₹${Math.round(n * 83).toLocaleString("en-IN")}`;

/* ══════════════════════════════════════════════════════════
   HERO SLIDES
══════════════════════════════════════════════════════════ */
const SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=90&w=2400",
    badge: "New Season — 2025 Collection",
    headline: "Timeless Beauty,\nCrafted in Gold",
    sub: "Discover handcrafted fine jewellery made for women who carry grace in every step.",
    cta: "Explore Now",
    ctaLink: "/shop",
    accent: "New Arrivals",
    accentLink: "/shop?sort=latest",
  },
  {
    img: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=90&w=2400",
    badge: "Handcrafted With Love",
    headline: "Jewellery For\nEvery Moment",
    sub: "Rings, earrings, pendants, anklets and more — for everyday elegance and special occasions.",
    cta: "Shop Now",
    ctaLink: "/shop",
    accent: "View Categories",
    accentLink: "/shop",
  },
  {
    img: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=90&w=2400",
    badge: "Artisan Crafted — Since 2018",
    headline: "Where Craft\nMeets Passion",
    sub: "Every piece tells a story. Wear yours with pride — carefully crafted, ethically sourced.",
    cta: "Our Story",
    ctaLink: "/about",
    accent: "View Gallery",
    accentLink: "/gallery",
  },
];

function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const id = setTimeout(() => { setDir(1); setCurrent(c => (c + 1) % SLIDES.length); }, 6000);
    return () => clearTimeout(id);
  }, [current]);

  const goTo = (i: number) => { setDir(i > current ? 1 : -1); setCurrent(i); };
  const prev = () => { setDir(-1); setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length); };
  const next = () => { setDir(1); setCurrent(c => (c + 1) % SLIDES.length); };

  const slide = SLIDES[current];

  return (
    <section className="relative w-full overflow-hidden bg-black" style={{ height: "100dvh", minHeight: "600px" }}>
      {/* Slides */}
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={slide.img}
            alt=""
            className="w-full h-full object-cover object-center"
            style={{ objectPosition: "center 30%" }}
          />
          {/* Layered gradient: dark left + dark bottom */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.1) 100%)"
          }} />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)"
          }} />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-20 lg:px-28 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-2xl"
          >
            {/* Badge */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-8 bg-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[10px] tracking-[0.35em] uppercase font-bold">{slide.badge}</span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[72px] text-white leading-[1.08] mb-5 whitespace-pre-line">
              {slide.headline}
            </h1>

            {/* Gold divider */}
            <div className="w-14 h-[2px] bg-[#D4AF37] mb-6" />

            {/* Subtitle */}
            <p className="text-white/65 text-sm md:text-base leading-relaxed mb-9 max-w-md font-light">
              {slide.sub}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link href={slide.ctaLink}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center gap-2.5 bg-[#D4AF37] text-white px-8 py-3.5 text-[10px] tracking-[0.28em] uppercase font-extrabold shadow-[0_8px_30px_rgba(212,175,55,0.4)] hover:bg-[#c9a430] transition-colors duration-200"
                >
                  {slide.cta}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link href={slide.accentLink}>
                <button className="flex items-center gap-2.5 border border-white/40 hover:border-white text-white hover:bg-white/10 px-8 py-3.5 text-[10px] tracking-[0.28em] uppercase font-semibold transition-all duration-200 backdrop-blur-sm">
                  {slide.accent}
                </button>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
        <button onClick={prev} className="w-8 h-8 border border-white/30 text-white/60 hover:border-white hover:text-white flex items-center justify-center transition-colors backdrop-blur-sm">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className={`transition-all duration-300 rounded-full ${i === current ? "w-6 h-1.5 bg-[#D4AF37]" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"}`}
          />
        ))}
        <button onClick={next} className="w-8 h-8 border border-white/30 text-white/60 hover:border-white hover:text-white flex items-center justify-center transition-colors backdrop-blur-sm">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 right-10 hidden md:flex flex-col items-center gap-2 z-20">
        <motion.div
          animate={{ scaleY: [1, 0.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-px h-12 bg-gradient-to-b from-white/60 to-transparent origin-top"
        />
        <span className="text-white/35 text-[7px] tracking-[0.35em] uppercase writing-vertical">Scroll</span>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   INSTAGRAM SECTION — images + videos + lightbox
══════════════════════════════════════════════════════════ */
const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(url);

function IgSection({ igUsername, displayPosts }: { igUsername: string; displayPosts: string[] }) {
  const [lightbox, setLightbox] = useState<{ src: string; index: number } | null>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  // close lightbox on Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const nav = (dir: 1 | -1) => {
    if (!lightbox) return;
    const next = (lightbox.index + dir + displayPosts.length) % displayPosts.length;
    setLightbox({ src: displayPosts[next], index: next });
  };

  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        {/* Header */}
        <motion.div {...fadeUp()} className="text-center mb-8 md:mb-12">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold mb-3">Follow Us</p>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Instagram className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.5} />
            <h2 className="font-serif text-2xl md:text-3xl text-[#0F0F0F]">@{igUsername}</h2>
          </div>
          <p className="text-[#0F0F0F]/45 text-xs mb-5">Tag us in your photos for a chance to be featured</p>
          <a
            href={`https://instagram.com/${igUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#405DE6] via-[#C13584] to-[#FD1D1D] text-white text-[10px] tracking-[0.2em] uppercase font-bold px-6 py-2.5 transition-opacity hover:opacity-90"
          >
            <Instagram className="w-3.5 h-3.5" /> Follow Us on Instagram
          </a>
        </motion.div>

        {/* Responsive grid — 2 cols mobile / 3 cols sm / 4 cols md / 6 cols lg */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 md:gap-1.5">
          {displayPosts.map((src, i) => {
            const isVid = isVideoUrl(src);
            return (
              <motion.div
                key={i}
                {...fadeUp(i * 0.05)}
                className="group relative aspect-square overflow-hidden cursor-pointer bg-[#E8E2D9]"
                onClick={() => setLightbox({ src, index: i })}
              >
                {isVid ? (
                  <>
                    <video
                      ref={el => { videoRefs.current[i] = el; }}
                      src={src}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      muted
                      loop
                      playsInline
                      onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                      onMouseLeave={e => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                    />
                    {/* Play icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#0F0F0F]/0 group-hover:bg-[#0F0F0F]/30 transition-all duration-300 flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" strokeWidth={1.5} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            {/* Prev */}
            <button
              onClick={e => { e.stopPropagation(); nav(-1); }}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Media */}
            <motion.div
              key={lightbox.index}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl max-h-[85vh] w-full flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              {isVideoUrl(lightbox.src) ? (
                <video
                  src={lightbox.src}
                  controls
                  autoPlay
                  loop
                  className="max-w-full max-h-[85vh] w-full object-contain"
                />
              ) : (
                <img
                  src={lightbox.src}
                  alt=""
                  className="max-w-full max-h-[85vh] w-full object-contain"
                />
              )}
            </motion.div>

            {/* Next */}
            <button
              onClick={e => { e.stopPropagation(); nav(1); }}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Close */}
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors rounded-full text-lg font-light"
            >✕</button>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs tracking-widest">
              {lightbox.index + 1} / {displayPosts.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
function getYouTubeId(url: string) {
  const m = url.match(/(?:embed\/|v=|youtu\.be\/)([^?&/]+)/);
  return m?.[1] || "";
}

export default function Home() {
  const { data: featured } = useGetFeaturedProducts();
  const { data: trending } = useGetTrendingProducts();
  const { data: arrivals } = useGetNewArrivals();
  const { data: blogsData } = useListBlogs();
  const { data: settings } = useGetSettings();
  const [homeRecentlyViewed, setHomeRecentlyViewed] = useState<RecentProduct[]>([]);
  useEffect(() => { setHomeRecentlyViewed(loadRecentlyViewed()); }, []);
  const hs = settings?.homeSale as any;
  const saleEndMs = hs?.endsAt ? new Date(hs.endsAt).getTime() : 0;
  const { h, m, s, expired } = useCountdown(saleEndMs);
  const showHomeSale = !!(hs?.enabled && saleEndMs > 0 && !expired);

  const igEnabled = settings?.instagram?.enabled !== false;
  const igUsername = settings?.instagram?.username || "pearlisjewels";
  const igPosts = Array.isArray(settings?.instagram?.posts) ? (settings!.instagram as any).posts.filter(Boolean) : [];
  const DEFAULT_IG = [
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400&h=400",
    "https://images.unsplash.com/photo-1599643478524-fb66f70d00f7?auto=format&fit=crop&q=80&w=400&h=400",
    "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=400&h=400",
    "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&q=80&w=400&h=400",
    "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=400&h=400",
    "https://images.unsplash.com/photo-1573408301185-9519f94815b5?auto=format&fit=crop&q=80&w=400&h=400",
  ];
  const displayPosts = igPosts.length > 0 ? igPosts : DEFAULT_IG;

  const settingsVideos = (Array.isArray(settings?.videos) ? settings!.videos : []).filter((v: any) => v.url);


  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col overflow-x-hidden">
      <Navbar />

      {/* ── 1. HERO SLIDER ── */}
      <HeroSlider />

      {/* ── 2. TRUST STRIP ── */}
      <section className="bg-white border-b border-[#D4AF37]/15">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#D4AF37]/12">
            {[
              { icon: Award, label: "BIS Certified", sub: "100% authentic & hallmarked" },
              { icon: Shield, label: "Secure Payments", sub: "Encrypted checkout" },
              { icon: Truck, label: "Free Delivery", sub: "On orders above ₹5,000" },
              { icon: RefreshCcw, label: "Easy Returns", sub: "30-day hassle-free" },
            ].map(({ icon: Icon, label, sub }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 px-5 py-4 md:px-8 md:py-5"
              >
                <div className="w-9 h-9 rounded-full bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-wide text-[#0F0F0F] uppercase leading-tight">{label}</p>
                  <p className="text-[9.5px] text-[#0F0F0F]/45 mt-0.5 hidden sm:block">{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. CATEGORIES CAROUSEL ── */}
      <CategoriesCarousel />

      {/* ── 4. NEW ARRIVALS ── */}
      {arrivals && arrivals.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8">
            <motion.div {...fadeUp()} className="flex items-end justify-between mb-10 md:mb-14">
              <div>
                <p className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold mb-2">Just Arrived</p>
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#0F0F0F]">New Arrivals</h2>
              </div>
              <Link href="/shop" className="hidden md:flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-bold text-[#D4AF37] hover:gap-3 transition-all border-b border-[#D4AF37]/40 pb-0.5">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-3 sm:gap-x-5 gap-y-8 sm:gap-y-12">
              {(Array.isArray(arrivals) ? arrivals : []).slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link href="/shop">
                <button className="border border-[#D4AF37] text-[#D4AF37] px-8 py-3 text-[10px] tracking-[0.25em] uppercase font-bold hover:bg-[#D4AF37] hover:text-white transition-colors duration-200">
                  View All
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 5. COLLECTIONS EDITORIAL ── */}
      <section className="py-16 md:py-24 bg-[#FAF8F3]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <motion.div {...fadeUp()} className="text-center mb-10 md:mb-14">
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold mb-3">Curated For You</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#0F0F0F]">Luxury Collections</h2>
            <div className="w-12 h-[2px] bg-[#D4AF37] mx-auto mt-4" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: "Everyday Elegance", sub: "Rings, earrings & pendants for daily wear", href: "/shop", src: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=88&w=900", tall: true },
              { title: "Hair & Accessories", sub: "Crunchies, clips, bands & more", href: "/category/hair-accessories", src: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=85&w=800", tall: false },
              { title: "Statement Pieces", sub: "Waist chains, anklets & body jewellery", href: "/category/waist-chain", src: "https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?auto=format&fit=crop&q=85&w=800", tall: false },
            ].map(({ title, sub, href, src, tall }, i) => (
              <motion.div key={title} {...fadeUp(i * 0.1)} className={`group relative overflow-hidden cursor-pointer ${tall ? "md:row-span-2" : ""}`}>
                <Link href={href} className="block">
                  <div className={`relative overflow-hidden ${tall ? "aspect-[4/5] md:aspect-auto md:h-[600px]" : "aspect-[16/9] md:aspect-auto md:h-[292px]"}`}>
                    <img src={src} alt={title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/8 transition-colors duration-500" />
                    <div className={`absolute bottom-0 left-0 right-0 ${tall ? "p-7 md:p-10" : "p-6 md:p-8"}`}>
                      <p className="text-[#D4AF37] text-[9px] tracking-[0.3em] uppercase font-bold mb-2">{sub}</p>
                      <h3 className={`font-serif text-white mb-4 ${tall ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"}`}>{title}</h3>
                      <span className="inline-flex items-center gap-2 text-white group-hover:text-[#D4AF37] text-[10px] tracking-[0.22em] uppercase font-bold transition-colors border-b border-white/30 group-hover:border-[#D4AF37] pb-0.5">
                        Explore <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. TRENDING ── */}
      {trending && trending.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8">
            <motion.div {...fadeUp()} className="flex items-end justify-between mb-10 md:mb-14">
              <div>
                <p className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold mb-2">Most Loved</p>
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#0F0F0F]">Trending Now</h2>
              </div>
              <Link href="/shop?sort=trending" className="hidden md:flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-bold text-[#D4AF37] hover:gap-3 transition-all border-b border-[#D4AF37]/40 pb-0.5">
                See More <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-3 sm:gap-x-5 gap-y-8 sm:gap-y-12">
              {(Array.isArray(trending) ? trending : []).slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── 7. RECENTLY VIEWED ── */}
      {homeRecentlyViewed.length > 0 && (
        <section className="py-16 md:py-20 bg-[#FAF8F3]">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8">
            <motion.div {...fadeUp()} className="flex items-end justify-between mb-10 md:mb-12">
              <div>
                <p className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold mb-2">Your Journey</p>
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#0F0F0F]">Recently Viewed</h2>
              </div>
            </motion.div>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: "none" }}>
              {homeRecentlyViewed.slice(0, 10).map((p, i) => {
                const img = p.images?.[0] || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=85&w=900";
                const price = Math.round(p.price * 83);
                const discPrice = p.discountPrice ? Math.round(p.discountPrice * 83) : null;
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.06 }} className="flex-shrink-0 w-40 sm:w-52 md:w-60 snap-start group">
                    <Link href={`/product/${p.id}`}>
                      <div className="relative overflow-hidden bg-[#F0EDE6] rounded-2xl" style={{ aspectRatio: "3/4" }}>
                        <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="pt-3">
                        {p.category && <p className="text-[8px] tracking-[0.2em] uppercase text-[#D4AF37] font-semibold mb-1">{p.category}</p>}
                        <p className="font-serif text-sm sm:text-base text-[#0F0F0F] leading-snug line-clamp-2 mb-1.5">{p.name}</p>
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
        </section>
      )}

      {/* ── 8. HOMEPAGE SALE SECTION ── */}
      {showHomeSale && (
        <section className="relative overflow-hidden bg-[#0A0A0A]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(212,175,55,0.08) 0%, transparent 65%)" }} />
            <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #D4AF37 0px, #D4AF37 1px, transparent 1px, transparent 36px)" }} />
            <div className="absolute top-6 left-6 w-14 h-14 border-t border-l border-[#D4AF37]/20" />
            <div className="absolute top-6 right-6 w-14 h-14 border-t border-r border-[#D4AF37]/20" />
            <div className="absolute bottom-6 left-6 w-14 h-14 border-b border-l border-[#D4AF37]/20" />
            <div className="absolute bottom-6 right-6 w-14 h-14 border-b border-r border-[#D4AF37]/20" />
          </div>

          <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-8 py-16 md:py-24">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              {/* Left: copy */}
              <motion.div {...fadeUp()} className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-3 mb-5">
                  <div className="h-px w-8 bg-[#D4AF37]/60" />
                  <span className="text-[#D4AF37] text-[9px] tracking-[0.45em] uppercase font-bold">
                    {hs?.badge || "Limited Time Offer"}
                  </span>
                  <div className="h-px w-8 bg-[#D4AF37]/60" />
                </div>
                <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl text-[#D4AF37] leading-[1.02] mb-2">
                  {hs?.offerLine || "Flat 20% OFF"}
                </h2>
                <p className="font-serif text-3xl md:text-4xl text-white/50 mb-5">
                  {hs?.subtitle || "Today Only"}
                </p>
                <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-sm mx-auto lg:mx-0">
                  {hs?.code ? (
                    <>
                      Use code{" "}
                      <span className="text-[#D4AF37] font-bold tracking-wider bg-[#D4AF37]/10 px-2 py-0.5">
                        {hs.code}
                      </span>{" "}
                      {hs.promoText?.replace(/use code\s+\S+\s*/i, "") || "at checkout and save on our finest pieces."}
                    </>
                  ) : (
                    hs?.promoText || "Use code PEARLIS10 at checkout and save on our finest pieces."
                  )}
                </p>
                <Link href={hs?.ctaLink || "/shop"}>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="group bg-[#D4AF37] hover:bg-[#c9a430] text-[#0A0A0A] px-10 md:px-14 py-4 text-[10px] tracking-[0.3em] uppercase font-extrabold transition-colors shadow-[0_8px_30px_rgba(212,175,55,0.25)] inline-flex items-center gap-2">
                    {hs?.ctaText || "Shop the Sale"} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </motion.div>

              {/* Right: countdown */}
              <motion.div {...fadeUp(0.15)} className="flex-shrink-0 text-center">
                <p className="text-[9px] tracking-[0.35em] uppercase text-white/25 mb-5 font-semibold">Offer Ends In</p>
                <div className="flex items-start gap-2 md:gap-4">
                  {[{ val: h, label: "Hours" }, { val: m, label: "Min" }, { val: s, label: "Sec" }].map(({ val, label }, i) => (
                    <div key={label} className="flex items-start gap-2 md:gap-4">
                      {i > 0 && (
                        <div className="flex flex-col gap-2 pt-4">
                          <div className="w-1 h-1 rounded-full bg-[#D4AF37]/50" />
                          <div className="w-1 h-1 rounded-full bg-[#D4AF37]/50" />
                        </div>
                      )}
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-20 md:w-24 md:h-28 bg-white/[0.04] border border-[#D4AF37]/20 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(212,175,55,0.1) 0%, transparent 70%)" }} />
                          <AnimatePresence mode="popLayout">
                            <motion.span key={val} initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ duration: 0.3 }}
                              className="font-serif text-3xl md:text-4xl text-white tabular-nums">
                              {String(val).padStart(2, "0")}
                            </motion.span>
                          </AnimatePresence>
                          <div className="absolute bottom-0 left-3 right-3 h-px bg-[#D4AF37]/25" />
                        </div>
                        <span className="text-[8px] tracking-[0.25em] uppercase text-white/30 mt-2">{label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ── 8. BRAND STORY ── */}
      <section className="bg-[#0F0F0F] relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[560px]">
            {/* Image / Video */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative overflow-hidden min-h-[360px] lg:min-h-0"
            >
              {settings?.atelierVideo ? (
                isYouTubeUrl(settings.atelierVideo) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYTId(settings.atelierVideo)}?autoplay=1&mute=1&loop=1&playlist=${getYTId(settings.atelierVideo)}&controls=0&showinfo=0&rel=0&modestbranding=1`}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; fullscreen"
                    style={{ border: 0, objectFit: "cover", pointerEvents: "none" }}
                    title="Atelier"
                  />
                ) : (
                  <video
                    src={settings.atelierVideo}
                    autoPlay muted loop playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1583937443943-b50a01b3e301?auto=format&fit=crop&q=85&w=900"
                  alt="Artisan" loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: "center 40%" }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
              <div className="absolute top-7 left-7 w-12 h-12">
                <div className="absolute top-0 left-0 w-full h-px bg-[#D4AF37]/60" />
                <div className="absolute top-0 left-0 w-px h-full bg-[#D4AF37]/60" />
              </div>
              <div className="absolute bottom-7 right-7 w-12 h-12">
                <div className="absolute bottom-0 right-0 w-full h-px bg-[#D4AF37]/60" />
                <div className="absolute bottom-0 right-0 w-px h-full bg-[#D4AF37]/60" />
              </div>
              <div className="absolute bottom-9 left-9">
                <p className="text-[#D4AF37] text-[9px] tracking-[0.35em] uppercase font-bold">Est. 2018</p>
                <p className="font-serif text-white text-xl mt-1">The Pearlis Atelier</p>
              </div>
            </motion.div>

            {/* Copy */}
            <motion.div {...fadeUp(0.15)} className="flex flex-col justify-center px-8 md:px-14 xl:px-20 py-16">
              <div className="flex items-center gap-4 mb-7">
                <div className="h-px w-8 bg-[#D4AF37]/50" />
                <p className="text-[#D4AF37] text-[9px] tracking-[0.45em] uppercase font-bold">The Pearlis Atelier</p>
              </div>
              <h2 className="font-serif text-4xl md:text-5xl text-white leading-[1.1] mb-6">
                Where Craft<br />Meets <em className="text-[#D4AF37] not-italic">Passion</em>
              </h2>
              <div className="w-10 h-[2px] bg-[#D4AF37] mb-7" />
              <p className="text-white/50 text-sm leading-[1.9] mb-5 max-w-md">
                Every Pearlis creation begins with a singular vision — to craft jewellery that transcends time. Our master artisans blend centuries-old techniques with contemporary design, creating pieces that tell your story.
              </p>
              <p className="text-white/50 text-sm leading-[1.9] mb-10 max-w-md">
                We source only ethically-mined diamonds and precious metals, ensuring each piece reflects uncompromising quality and responsible luxury.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-10 py-7 border-y border-[#D4AF37]/10">
                {[{ num: "7+", label: "Years of Craft" }, { num: "50K+", label: "Pieces Created" }, { num: "98%", label: "Happy Clients" }].map(({ num, label }) => (
                  <div key={label} className="text-center">
                    <p className="font-serif text-2xl md:text-3xl text-[#D4AF37] mb-1">{num}</p>
                    <p className="text-[8.5px] tracking-[0.18em] uppercase text-white/30 font-semibold leading-tight">{label}</p>
                  </div>
                ))}
              </div>
              <Link href="/about">
                <motion.button whileHover={{ x: 4 }}
                  className="group inline-flex items-center gap-3 text-[#D4AF37] text-[10px] tracking-[0.28em] uppercase font-bold">
                  <span className="border-b border-[#D4AF37]/40 pb-0.5 group-hover:border-[#D4AF37] transition-colors">Discover Our Story</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 9. BEST SELLERS ── */}
      {featured && featured.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8">
            <motion.div {...fadeUp()} className="flex items-end justify-between mb-10 md:mb-14">
              <div>
                <p className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold mb-2">Top Picks</p>
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#0F0F0F]">Best Sellers</h2>
              </div>
              <Link href="/shop" className="hidden md:flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-bold text-[#D4AF37] hover:gap-3 transition-all border-b border-[#D4AF37]/40 pb-0.5">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-3 sm:gap-x-5 gap-y-8 sm:gap-y-12">
              {(Array.isArray(featured) ? featured : []).slice(0, 8).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── 10. THE PEARLIS PROMISE ── */}
      <section className="py-16 md:py-24 bg-[#FAF8F3]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <motion.div {...fadeUp()} className="text-center mb-10 md:mb-14">
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold mb-3">Why Pearlis</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#0F0F0F]">The Pearlis Promise</h2>
            <div className="w-12 h-[2px] bg-[#D4AF37] mx-auto mt-4" />
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
            {[
              { icon: Award, title: "BIS Certified", desc: "Government certification mark for gold purity on every piece." },
              { icon: Gem, title: "Ethically Sourced", desc: "Conflict-free diamonds from certified global suppliers." },
              { icon: Shield, title: "100% Secure", desc: "Bank-grade encryption protects every transaction." },
              { icon: RefreshCcw, title: "30-Day Returns", desc: "Not in love? Return it hassle-free, no questions asked." },
              { icon: Clock, title: "Lifetime Shine", desc: "Free polish & maintenance for the life of your jewellery." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div {...fadeUp(i * 0.08)} key={title}
                className="group text-center p-6 md:p-8 bg-white border border-[#D4AF37]/12 hover:border-[#D4AF37]/50 hover:shadow-xl transition-all duration-300">
                <div className="w-11 h-11 rounded-full bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20 flex items-center justify-center mx-auto mb-4 transition-colors">
                  <Icon className="w-4.5 h-4.5 text-[#D4AF37]" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-base md:text-lg text-[#0F0F0F] mb-2">{title}</h3>
                <p className="text-[#0F0F0F]/45 text-[11px] leading-relaxed hidden md:block">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ── 12. INSTAGRAM STRIP ── */}
      {igEnabled && (
        <IgSection
          igUsername={igUsername}
          displayPosts={displayPosts}
        />
      )}

      {/* ── 12. BLOG ── */}
      {blogsData?.blogs?.length > 0 && (
        <section className="py-16 md:py-24 bg-[#FAF8F3]">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8">
            <motion.div {...fadeUp()} className="flex items-end justify-between mb-10 md:mb-14">
              <div>
                <p className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold mb-2">Stories & Insights</p>
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#0F0F0F]">The Journal</h2>
              </div>
              <Link href="/blog" className="hidden md:flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-bold text-[#D4AF37] hover:gap-3 transition-all border-b border-[#D4AF37]/40 pb-0.5">
                All Posts <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {(blogsData?.blogs ?? []).slice(0, 3).map((blog, i) => (
                <motion.div key={blog.id} {...fadeUp(i * 0.1)} className="group">
                  <Link href={`/blog/${blog.id}`}>
                    <div className="aspect-[4/3] overflow-hidden bg-[#E8E2D9] mb-4">
                      <img src={blog.imageUrl} alt={blog.title} loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105" />
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(Array.isArray(blog.tags) ? blog.tags : []).slice(0, 2).map(tag => (
                        <span key={tag} className="text-[8.5px] tracking-[0.2em] uppercase text-[#D4AF37] font-semibold">{tag}</span>
                      ))}
                    </div>
                    <h3 className="font-serif text-lg md:text-xl text-[#0F0F0F] group-hover:text-[#D4AF37] transition-colors leading-snug mb-2">
                      {blog.title}
                    </h3>
                    <p className="text-[#0F0F0F]/50 text-sm leading-relaxed line-clamp-2">{blog.excerpt}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 13. NEWSLETTER ── */}
      <section className="py-16 md:py-20 bg-[#0F0F0F] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 100%, rgba(212,175,55,0.07) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-lg mx-auto px-4 text-center">
          <motion.div {...fadeUp()}>
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="h-px w-8 bg-[#D4AF37]/50" />
              <p className="text-[#D4AF37] text-[9px] tracking-[0.4em] uppercase font-bold">Exclusive Access</p>
              <div className="h-px w-8 bg-[#D4AF37]/50" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">Join The Inner Circle</h2>
            <p className="text-white/40 text-sm leading-relaxed mb-8">
              Subscribe for early access to new collections, styling tips, and exclusive member-only offers.
            </p>
            <NewsletterForm />
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch(apiUrl("/api/newsletter/subscribe"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setDone(true);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  if (done) {
    return (
      <div className="border border-[#D4AF37]/30 text-[#D4AF37] px-8 py-4 text-sm font-medium">
        ✓ Welcome to the Pearlis Inner Circle
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="email" required value={email} onChange={e => setEmail(e.target.value)}
        placeholder="Your email address"
        className="flex-1 bg-white/5 border border-white/15 text-white placeholder:text-white/30 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]/60 transition-colors"
      />
      <button type="submit" disabled={loading}
        className="bg-[#D4AF37] hover:bg-[#c9a430] text-[#0A0A0A] px-7 py-3.5 text-[10px] tracking-[0.28em] uppercase font-extrabold transition-colors whitespace-nowrap">
        {loading ? "..." : "Subscribe"}
      </button>
    </form>
  );
}
