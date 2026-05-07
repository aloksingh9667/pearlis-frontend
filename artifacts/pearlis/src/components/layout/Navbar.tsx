import { Link, useLocation } from "wouter";
import { useEffect, useState, useRef, useMemo } from "react";
import Fuse from "fuse.js";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, User as UserIcon, Menu, X, Heart, ChevronDown, Zap, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGetCart, useListCategories, useListProducts } from "@workspace/api-client-react";
import { useGetSettings } from "@/lib/adminApi";
import { load as loadRecentlyViewed, type RecentProduct } from "@/hooks/useRecentlyViewed";

/* ── Countdown hook ── */
function useCountdown(endsAt: string | undefined) {
  const calc = () => {
    if (!endsAt) return { h: 0, m: 0, s: 0, expired: true };
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
    return {
      h: Math.floor(diff / 3_600_000),
      m: Math.floor((diff % 3_600_000) / 60_000),
      s: Math.floor((diff % 60_000) / 1_000),
      expired: false,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return time;
}

const EXPLORE_ITEMS = [
  { label: "Gallery", href: "/gallery" },
  { label: "Videos", href: "/videos" },
  { label: "Journal", href: "/blog" },
];

const PLAIN_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/* ── Desktop dropdown ── */
function NavDropdown({
  label, items, isTransparent, activeHrefs,
}: {
  label: string;
  items: { label: string; href: string }[];
  isTransparent: boolean;
  activeHrefs: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = items.some(i => activeHrefs.includes(i.href));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      <button className={`relative flex items-center gap-1 text-[10.5px] font-semibold tracking-[0.18em] uppercase transition-colors duration-250 group pb-0.5 ${
        isTransparent
          ? isActive ? "text-[#D4AF37]" : "text-white hover:text-[#D4AF37]"
          : isActive ? "text-[#D4AF37]" : "text-[#0F0F0F] hover:text-[#D4AF37]"
      }`}>
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        <span className={`absolute -bottom-0.5 left-0 h-[1.5px] bg-[#D4AF37] transition-all duration-300 ${isActive ? "w-full" : "w-0 group-hover:w-full"}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white border border-[#D4AF37]/20 shadow-xl min-w-[180px] z-50 py-2"
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-l border-t border-[#D4AF37]/20" />
            {items.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className="block px-5 py-2.5 text-[10.5px] tracking-[0.15em] uppercase font-semibold text-[#0F0F0F]/70 hover:text-[#D4AF37] hover:bg-[#FAF8F3] transition-colors duration-150">
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [mobileJewelleryOpen, setMobileJewelleryOpen] = useState(false);
  const [mobileExploreOpen, setMobileExploreOpen] = useState(false);
  const [navRecentlyViewed, setNavRecentlyViewed] = useState<RecentProduct[]>([]);
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: cart } = useGetCart({ query: { retry: false } });
  const { data: categoriesData } = useListCategories({ query: { staleTime: 60_000 } });
  const { data: siteSettings } = useGetSettings();

  const { data: productsData } = useListProducts(
    { limit: 200 } as any,
    { query: { enabled: isSearchOpen, staleTime: 60_000 } }
  );
  const allProducts = Array.isArray((productsData as any)?.products) ? (productsData as any).products : [];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (isSearchOpen) setNavRecentlyViewed(loadRecentlyViewed());
  }, [isSearchOpen]);

  const fuse = useMemo(() => new Fuse(allProducts, {
    keys: [
      { name: "name", weight: 0.65 },
      { name: "description", weight: 0.2 },
      { name: "category", weight: 0.15 },
    ],
    threshold: 0.5,
    minMatchCharLength: 1,
    ignoreLocation: true,
    distance: 200,
    includeScore: true,
  }), [allProducts]);

  const suggestions = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    return fuse.search(debouncedQuery).slice(0, 5);
  }, [fuse, debouncedQuery]);

  const siteName = siteSettings?.branding?.siteName || siteSettings?.general?.siteName || "PEARLIS";
  const siteTagline = siteSettings?.branding?.tagline || siteSettings?.general?.tagline || "Fine Jewellery";
  const logoUrl = siteSettings?.branding?.logoUrl || "/pearlis-logo.png";

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  /* Build jewellery items dynamically from DB categories, filtered by admin settings */
  const excludedSlugs: string[] = siteSettings?.navbarCategories?.excludedSlugs ?? [];
  const jewelleryItems = [
    { label: "All Jewellery", href: "/shop" },
    ...(Array.isArray(categoriesData) ? categoriesData : [])
      .filter((c: any) => !excludedSlugs.includes(c.slug))
      .map((c: any) => ({
        label: c.name,
        href: `/category/${c.slug}`,
      })),
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = location === "/";
  const isTransparent = isHome && !isScrolled;

  const jewelleryActive = jewelleryItems.some(i => location === i.href);
  const exploreActive = EXPLORE_ITEMS.some(i => location === i.href);

  const announcement = siteSettings?.announcement;
  const showAnnouncement = announcement?.enabled !== false && announcement?.text;

  const fs = siteSettings?.flashSale;
  const countdown = useCountdown(fs?.endsAt);
  const showFlashSale = !!(fs?.enabled && !countdown.expired);

  const announcementH = showAnnouncement ? 32 : 0;
  const flashSaleH = showFlashSale ? 56 : 0;
  const navbarTop = announcementH + flashSaleH;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      {/* ── Announcement bar ── */}
      {showAnnouncement && (
        announcement?.link ? (
          <a href={announcement.link}
            className="block fixed top-0 left-0 right-0 z-[62] bg-[#D4AF37] text-white text-center text-[10px] tracking-[0.22em] uppercase py-[7px] font-semibold hover:bg-[#c9a430] transition-colors">
            {announcement.text}
          </a>
        ) : (
          <div className="fixed top-0 left-0 right-0 z-[62] bg-[#D4AF37] text-white text-center text-[10px] tracking-[0.22em] uppercase py-[7px] font-semibold">
            {announcement.text}
          </div>
        )
      )}

      {/* ── Flash Sale banner ── */}
      {showFlashSale && (
        <div
          className="fixed left-0 right-0 z-[61] bg-[#0F0F0F] border-b border-[#D4AF37]/30"
          style={{ top: `${announcementH}px`, height: "56px" }}
        >
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-full flex items-center justify-between gap-4">
            {/* Left: badge + headline */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="hidden sm:flex items-center gap-1 bg-[#D4AF37] text-[#0F0F0F] text-[9px] font-black px-2.5 py-1 tracking-[0.2em] uppercase shrink-0">
                <Zap className="w-2.5 h-2.5" />{fs?.title || "Flash Sale"}
              </span>
              <div className="min-w-0">
                <p className="text-white font-semibold text-[11px] md:text-[12px] tracking-wide truncate">
                  {fs?.subtitle || "Up to 30% Off"}
                  {fs?.code && (
                    <span className="ml-2 font-mono text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-1.5 py-0.5 text-[10px] tracking-widest">
                      {fs.code}
                    </span>
                  )}
                </p>
                {fs?.promoText && (
                  <p className="text-white/40 text-[9px] tracking-widest uppercase truncate hidden sm:block">{fs.promoText}</p>
                )}
              </div>
            </div>

            {/* Center: countdown */}
            <div className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 text-[#D4AF37]/60 mr-1 hidden sm:block" />
              {[
                { v: pad(countdown.h), label: "HRS" },
                { v: pad(countdown.m), label: "MIN" },
                { v: pad(countdown.s), label: "SEC" },
              ].map(({ v, label }, i) => (
                <span key={label} className="flex items-center gap-1">
                  {i > 0 && <span className="text-[#D4AF37]/40 text-xs font-bold">:</span>}
                  <span className="flex flex-col items-center leading-none">
                    <span className="text-white font-mono font-bold text-[15px] md:text-[17px] tabular-nums">{v}</span>
                    <span className="text-[#D4AF37]/50 text-[7px] tracking-[0.15em] uppercase">{label}</span>
                  </span>
                </span>
              ))}
            </div>

            {/* Right: CTA */}
            {fs?.ctaText && (
              <Link
                href={(fs.ctaLink as string) || "/shop"}
                className="hidden sm:inline-flex items-center shrink-0 bg-[#D4AF37] text-[#0F0F0F] text-[9px] font-black px-4 py-2 tracking-[0.18em] uppercase hover:bg-[#c9a430] transition-colors"
              >
                {fs.ctaText}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Main navbar ── */}
      <nav className="fixed left-0 right-0 z-50 transition-all duration-500 ease-in-out" style={{ top: `${navbarTop}px` }}>
        <div className={`absolute inset-0 transition-all duration-500 ${
          isTransparent ? "bg-transparent" : "bg-white/95 backdrop-blur-md border-b border-[#D4AF37]/25 shadow-[0_2px_20px_rgba(0,0,0,0.06)]"
        }`} />

        <div className="relative max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between h-[68px]">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 group flex items-center gap-3">
            {logoUrl && (
              <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 border border-[#D4AF37]/20">
                <img src={logoUrl} alt={siteName} className="w-full h-full object-cover" />
              </div>
            )}
            <div className={`flex flex-col leading-none select-none ${logoUrl ? "hidden sm:flex" : "flex"}`}>
              <span className={`font-serif text-[1.6rem] tracking-[0.38em] font-bold transition-colors duration-400 ${isTransparent ? "text-white" : "text-[#0F0F0F]"}`}>
                {siteName.toUpperCase()}
              </span>
              <span className="text-[7.5px] tracking-[0.45em] uppercase text-[#D4AF37] mt-[2px] font-medium">{siteTagline}</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden xl:flex items-center gap-6">
            <Link href="/" className={`relative text-[10.5px] font-semibold tracking-[0.18em] uppercase transition-colors duration-250 group ${
              isTransparent ? (location === "/" ? "text-[#D4AF37]" : "text-white hover:text-[#D4AF37]") : (location === "/" ? "text-[#D4AF37]" : "text-[#0F0F0F] hover:text-[#D4AF37]")
            }`}>
              Home
              <span className={`absolute -bottom-0.5 left-0 h-[1.5px] bg-[#D4AF37] transition-all duration-300 ${location === "/" ? "w-full" : "w-0 group-hover:w-full"}`} />
            </Link>

            <Link href="/shop" className={`relative text-[10.5px] font-semibold tracking-[0.18em] uppercase transition-colors duration-250 group ${
              isTransparent ? (location === "/shop" ? "text-[#D4AF37]" : "text-white hover:text-[#D4AF37]") : (location === "/shop" ? "text-[#D4AF37]" : "text-[#0F0F0F] hover:text-[#D4AF37]")
            }`}>
              Shop
              <span className={`absolute -bottom-0.5 left-0 h-[1.5px] bg-[#D4AF37] transition-all duration-300 ${location === "/shop" ? "w-full" : "w-0 group-hover:w-full"}`} />
            </Link>

            <NavDropdown label="Jewellery" items={jewelleryItems} isTransparent={isTransparent} activeHrefs={jewelleryItems.map(i => i.href)} />
            <NavDropdown label="Explore" items={EXPLORE_ITEMS} isTransparent={isTransparent} activeHrefs={EXPLORE_ITEMS.map(i => i.href)} />

            {PLAIN_LINKS.map(link => (
              <Link key={link.href} href={link.href} className={`relative text-[10.5px] font-semibold tracking-[0.18em] uppercase transition-colors duration-250 group ${
                isTransparent ? (location === link.href ? "text-[#D4AF37]" : "text-white hover:text-[#D4AF37]") : (location === link.href ? "text-[#D4AF37]" : "text-[#0F0F0F] hover:text-[#D4AF37]")
              }`}>
                {link.label}
                <span className={`absolute -bottom-0.5 left-0 h-[1.5px] bg-[#D4AF37] transition-all duration-300 ${location === link.href ? "w-full" : "w-0 group-hover:w-full"}`} />
              </Link>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-[18px]">
            <button onClick={() => setIsSearchOpen(true)} aria-label="Search"
              className={`transition-colors duration-250 ${isTransparent ? "text-white hover:text-[#D4AF37]" : "text-[#0F0F0F] hover:text-[#D4AF37]"}`}>
              <Search className="w-[17px] h-[17px]" strokeWidth={1.6} />
            </button>
            <Link href="/wishlist" aria-label="Wishlist"
              className={`hidden sm:block transition-colors duration-250 ${isTransparent ? "text-white hover:text-[#D4AF37]" : "text-[#0F0F0F] hover:text-[#D4AF37]"}`}>
              <Heart className="w-[17px] h-[17px]" strokeWidth={1.6} />
            </Link>
            <Link href={user ? (user.role === "admin" ? "/admin" : "/account") : "/sign-in"} aria-label="Account"
              className={`transition-colors duration-250 ${isTransparent ? "text-white hover:text-[#D4AF37]" : "text-[#0F0F0F] hover:text-[#D4AF37]"}`}>
              <UserIcon className="w-[17px] h-[17px]" strokeWidth={1.6} />
            </Link>
            <Link href="/cart" aria-label="Cart"
              className={`relative transition-colors duration-250 ${isTransparent ? "text-white hover:text-[#D4AF37]" : "text-[#0F0F0F] hover:text-[#D4AF37]"}`}>
              <ShoppingBag className="w-[17px] h-[17px]" strokeWidth={1.6} />
              {cartItemCount > 0 && (
                <span className="absolute -top-[7px] -right-[7px] bg-[#D4AF37] text-white text-[8px] font-bold w-[15px] h-[15px] rounded-full flex items-center justify-center leading-none">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <button className={`xl:hidden ml-1 transition-colors ${isTransparent ? "text-white hover:text-[#D4AF37]" : "text-[#0F0F0F] hover:text-[#D4AF37]"}`}
              onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu">
              <Menu className="w-[20px] h-[20px]" strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </nav>

      {!isHome && <div style={{ height: `${navbarTop + 68}px` }} />}

      {/* ── Search overlay ── */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-start justify-center pt-28 px-4"
            onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setDebouncedQuery(""); }}>
            <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-white shadow-2xl">

              {/* Input row */}
              <div className="flex items-center border-b border-[#D4AF37]/30 px-5 py-4">
                <Search className="w-5 h-5 text-[#D4AF37] mr-4 flex-shrink-0" strokeWidth={1.5} />
                <input autoFocus type="text" placeholder="Search rings, necklaces, pendants..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                      setIsSearchOpen(false); setSearchQuery(""); setDebouncedQuery("");
                    }
                    if (e.key === "Escape") { setIsSearchOpen(false); setSearchQuery(""); setDebouncedQuery(""); }
                  }}
                  className="flex-1 outline-none text-base text-[#0F0F0F] placeholder:text-[#0F0F0F]/35 bg-transparent" />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setDebouncedQuery(""); }}
                    className="mr-2 text-[#0F0F0F]/30 hover:text-[#0F0F0F]/60 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setDebouncedQuery(""); }}
                  className="ml-1 text-[#0F0F0F]/40 hover:text-[#0F0F0F] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Live suggestions */}
              <AnimatePresence mode="wait">
                {suggestions.length > 0 ? (
                  <motion.div key="suggestions"
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}>
                    <div className="px-5 pt-3 pb-1">
                      <p className="text-[9px] tracking-[0.25em] uppercase text-[#0F0F0F]/35">Suggestions</p>
                    </div>
                    <ul>
                      {suggestions.map(({ item: product }) => {
                        const img = Array.isArray((product as any).images) ? (product as any).images[0] : null;
                        const price = (product as any).price;
                        const priceINR = price ? "₹" + Math.round(price * 83).toLocaleString("en-IN") : null;
                        return (
                          <li key={(product as any).id}>
                            <Link href={`/product/${(product as any).id}`}
                              onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setDebouncedQuery(""); }}
                              className="flex items-center gap-4 px-5 py-3 hover:bg-[#FAF8F3] transition-colors group border-b border-[#0F0F0F]/5 last:border-0">
                              {img ? (
                                <img src={img} alt={(product as any).name}
                                  className="w-11 h-11 object-cover flex-shrink-0 border border-[#E8E2D9]" />
                              ) : (
                                <div className="w-11 h-11 bg-[#F0EBE3] flex-shrink-0 border border-[#E8E2D9]" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-[#0F0F0F] truncate group-hover:text-[#D4AF37] transition-colors">
                                  {(product as any).name}
                                </p>
                                {priceINR && (
                                  <p className="text-[11px] text-[#D4AF37] font-semibold mt-0.5">{priceINR}</p>
                                )}
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-[#0F0F0F]/20 group-hover:text-[#D4AF37] transition-colors flex-shrink-0" />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="px-5 py-3 border-t border-[#D4AF37]/15">
                      <button onClick={() => {
                        window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                        setIsSearchOpen(false); setSearchQuery(""); setDebouncedQuery("");
                      }}
                        className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-bold text-[#D4AF37] hover:text-[#c9a430] transition-colors">
                        <Search className="w-3.5 h-3.5" />
                        See all results for "{searchQuery}"
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="categories"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="px-5 py-4 space-y-4">

                    {/* Recently Viewed */}
                    {navRecentlyViewed.length > 0 && (
                      <div>
                        <p className="text-[9px] tracking-[0.25em] uppercase text-[#0F0F0F]/35 mb-3">Recently Viewed</p>
                        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                          {navRecentlyViewed.slice(0, 6).map(p => {
                            const img = p.images?.[0];
                            const priceINR = p.price ? Math.round(p.price * 83) : null;
                            return (
                              <Link key={p.id} href={`/product/${p.id}`}
                                onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setDebouncedQuery(""); }}
                                className="flex-shrink-0 group flex flex-col gap-1.5 w-[72px]">
                                <div className="w-[72px] h-[72px] bg-[#F0EBE3] border border-[#E8E2D9] overflow-hidden rounded">
                                  {img
                                    ? <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    : <div className="w-full h-full bg-[#E8E2D9]" />}
                                </div>
                                <p className="text-[10px] text-[#0F0F0F]/70 group-hover:text-[#D4AF37] transition-colors line-clamp-2 leading-tight">{p.name}</p>
                                {priceINR && <p className="text-[10px] font-semibold text-[#D4AF37]">₹{priceINR.toLocaleString("en-IN")}</p>}
                              </Link>
                            );
                          })}
                        </div>
                        <div className="h-px bg-[#D4AF37]/10 mt-4" />
                      </div>
                    )}

                    {/* Browse by Category */}
                    <div>
                      <p className="text-[9px] tracking-[0.25em] uppercase text-[#0F0F0F]/35 mb-3">Browse by Category</p>
                      <div className="flex flex-wrap gap-2">
                        {jewelleryItems.slice(1).map(item => (
                          <button key={item.href} onClick={() => { window.location.href = item.href; setIsSearchOpen(false); setSearchQuery(""); setDebouncedQuery(""); }}
                            className="text-[11px] px-3 py-1.5 border border-[#D4AF37]/25 text-[#0F0F0F]/65 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors tracking-wide capitalize">
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 z-[100] w-[320px] bg-white flex flex-col shadow-2xl">

              <div className="flex items-center justify-between px-6 py-5 border-b border-[#D4AF37]/20">
                <div>
                  {logoUrl ? (
                    <div className="h-9 w-9 rounded-full overflow-hidden border border-[#D4AF37]/20">
                      <img src={logoUrl} alt={siteName} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <>
                      <p className="font-serif text-xl tracking-[0.3em] font-bold text-[#0F0F0F]">{siteName.toUpperCase()}</p>
                      <p className="text-[7.5px] tracking-[0.4em] uppercase text-[#D4AF37]">{siteTagline}</p>
                    </>
                  )}
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#0F0F0F]/50 hover:text-[#0F0F0F]"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-6 space-y-0">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center py-3.5 border-b border-[#0F0F0F]/6 text-[11px] tracking-[0.18em] uppercase font-semibold transition-colors ${location === "/" ? "text-[#D4AF37]" : "text-[#0F0F0F]/75 hover:text-[#D4AF37]"}`}>
                  Home
                </Link>
                <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center py-3.5 border-b border-[#0F0F0F]/6 text-[11px] tracking-[0.18em] uppercase font-semibold transition-colors ${location === "/shop" ? "text-[#D4AF37]" : "text-[#0F0F0F]/75 hover:text-[#D4AF37]"}`}>
                  Shop
                </Link>

                {/* Jewellery accordion — dynamic */}
                <div className="border-b border-[#0F0F0F]/6">
                  <button onClick={() => setMobileJewelleryOpen(v => !v)}
                    className={`w-full flex items-center justify-between py-3.5 text-[11px] tracking-[0.18em] uppercase font-semibold transition-colors ${jewelleryActive ? "text-[#D4AF37]" : "text-[#0F0F0F]/75 hover:text-[#D4AF37]"}`}>
                    Jewellery
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileJewelleryOpen ? "rotate-180 text-[#D4AF37]" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {mobileJewelleryOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden">
                        <div className="pl-4 pb-2 space-y-0">
                          {jewelleryItems.map(item => (
                            <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                              className={`flex items-center py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium transition-colors capitalize ${location === item.href ? "text-[#D4AF37]" : "text-[#0F0F0F]/60 hover:text-[#D4AF37]"}`}>
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Explore accordion */}
                <div className="border-b border-[#0F0F0F]/6">
                  <button onClick={() => setMobileExploreOpen(v => !v)}
                    className={`w-full flex items-center justify-between py-3.5 text-[11px] tracking-[0.18em] uppercase font-semibold transition-colors ${exploreActive ? "text-[#D4AF37]" : "text-[#0F0F0F]/75 hover:text-[#D4AF37]"}`}>
                    Explore
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileExploreOpen ? "rotate-180 text-[#D4AF37]" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {mobileExploreOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden">
                        <div className="pl-4 pb-2 space-y-0">
                          {EXPLORE_ITEMS.map(item => (
                            <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                              className={`flex items-center py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium transition-colors ${location === item.href ? "text-[#D4AF37]" : "text-[#0F0F0F]/60 hover:text-[#D4AF37]"}`}>
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {PLAIN_LINKS.map(link => (
                  <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center py-3.5 border-b border-[#0F0F0F]/6 text-[11px] tracking-[0.18em] uppercase font-semibold transition-colors ${location === link.href ? "text-[#D4AF37]" : "text-[#0F0F0F]/75 hover:text-[#D4AF37]"}`}>
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="px-6 py-6 border-t border-[#D4AF37]/15 space-y-3">
                <Link href={user ? (user.role === "admin" ? "/admin" : "/account") : "/sign-in"} onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 w-full bg-[#0F0F0F] text-white py-3.5 px-5 text-[10px] tracking-[0.2em] uppercase font-bold justify-center hover:bg-[#D4AF37] transition-colors duration-300">
                  <UserIcon className="w-4 h-4" /> {user ? "My Account" : "Sign In"}
                </Link>
                <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 w-full border border-[#0F0F0F]/20 text-[#0F0F0F] py-3.5 px-5 text-[10px] tracking-[0.2em] uppercase font-semibold justify-center hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors">
                  <ShoppingBag className="w-4 h-4" /> Cart {cartItemCount > 0 && `(${cartItemCount})`}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
