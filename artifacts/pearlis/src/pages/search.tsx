import { useState, useEffect, useRef, useMemo } from "react";
import Fuse from "fuse.js";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/ui/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useGetSettings } from "@/lib/adminApi";

const DEFAULT_MATERIALS = ["Gold", "Silver", "Platinum", "Rose Gold", "Diamond", "Pearl", "Gemstone"];
const DEFAULT_PRICE_RANGES = [
  { label: "Under ₹5,000", minINR: 0, maxINR: 5000 },
  { label: "₹5,000 – ₹15,000", minINR: 5000, maxINR: 15000 },
  { label: "₹15,000 – ₹50,000", minINR: 15000, maxINR: 50000 },
  { label: "₹50,000 – ₹1,00,000", minINR: 50000, maxINR: 100000 },
  { label: "Above ₹1,00,000", minINR: 100000, maxINR: 9999999 },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function SearchPage() {
  const [location] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const initialQ = params.get("q") || "";

  const [inputValue, setInputValue] = useState(initialQ);
  const [category, setCategory] = useState("");
  const [material, setMaterial] = useState("");
  const [priceRange, setPriceRange] = useState<{ label: string; minINR: number; maxINR: number } | null>(null);
  const [sort, setSort] = useState("latest");
  const [showFilters, setShowFilters] = useState(false);

  const search = useDebounce(inputValue.trim(), 350);

  const { data: categories } = useListCategories();
  const { data: settings } = useGetSettings();

  const conversionRate = (settings?.general as any)?.conversionRate || 83;
  const PRICE_RANGES = (settings?.shopFilters as any)?.priceRanges?.length
    ? (settings!.shopFilters as any).priceRanges
    : DEFAULT_PRICE_RANGES;
  const MATERIALS = (settings?.shopFilters as any)?.materials?.length
    ? (settings!.shopFilters as any).materials
    : DEFAULT_MATERIALS;

  const minPriceUSD = priceRange ? priceRange.minINR / conversionRate : undefined;
  const maxPriceUSD = priceRange ? priceRange.maxINR / conversionRate : undefined;

  const { data: productsData, isLoading, isFetching } = useListProducts({
    ...(category ? { category } : {}),
    ...(material ? { material } : {}),
    ...(priceRange ? { minPrice: minPriceUSD, maxPrice: maxPriceUSD } : {}),
    sort: sort as any,
    limit: 200,
  } as any, { query: { enabled: true, staleTime: 30_000 } });

  const allProducts = Array.isArray(productsData?.products) ? productsData!.products : [];

  const fuse = useMemo(() => new Fuse(allProducts, {
    keys: [
      { name: "name", weight: 0.6 },
      { name: "description", weight: 0.2 },
      { name: "category", weight: 0.15 },
      { name: "material", weight: 0.05 },
    ],
    threshold: 0.5,
    minMatchCharLength: 1,
    ignoreLocation: true,
    distance: 200,
    includeScore: true,
  }), [allProducts]);

  const products = useMemo(() => {
    if (!search) return allProducts;
    return fuse.search(search).map(r => r.item);
  }, [fuse, search, allProducts]);
  const activeFilterCount = [category, material, priceRange].filter(Boolean).length;
  const hasAnyFilter = search || activeFilterCount > 0;

  function clearAll() {
    setInputValue("");
    setCategory("");
    setMaterial("");
    setPriceRange(null);
    setSort("latest");
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
      <Navbar />

      {/* ── Search hero ── */}
      <div className="bg-[#0F0F0F] pt-10 pb-10">
        <div className="max-w-[760px] mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <p className="text-[#D4AF37] text-[9px] tracking-[0.45em] uppercase font-bold mb-3">Pearlis Fine Jewellery</p>
            <h1 className="font-serif text-3xl md:text-4xl text-white mb-2">Search the Collection</h1>
            <p className="text-white/40 text-sm">Discover rings, necklaces, bracelets and more</p>
          </motion.div>

          {/* Search input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative flex items-center bg-white shadow-lg"
          >
            <Search className="absolute left-5 w-5 h-5 text-[#D4AF37]" strokeWidth={1.5} />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Search rings, necklaces, pendants, earrings..."
              className="w-full h-14 pl-14 pr-14 text-[15px] text-[#0F0F0F] placeholder:text-[#0F0F0F]/35 bg-transparent outline-none"
            />
            {inputValue && (
              <button
                onClick={() => setInputValue("")}
                className="absolute right-5 w-7 h-7 flex items-center justify-center text-[#0F0F0F]/35 hover:text-[#0F0F0F] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>

          {/* Quick category pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap gap-2 mt-4 justify-center"
          >
            {(Array.isArray(categories) ? categories : []).slice(0, 6).map((c: any) => (
              <button
                key={c.id}
                onClick={() => setCategory(category === c.name ? "" : c.name)}
                className={`px-3 py-1.5 text-[9px] tracking-[0.18em] uppercase font-bold transition-all border ${
                  category === c.name
                    ? "bg-[#D4AF37] border-[#D4AF37] text-[#0A0A0A]"
                    : "border-white/20 text-white/60 hover:border-[#D4AF37]/60 hover:text-[#D4AF37]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Filter + sort bar ── */}
      <div className="bg-white border-b border-[#D4AF37]/12 sticky top-[68px] z-30">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(f => !f)}
                className={`flex items-center gap-1.5 h-8 px-3 text-[9px] tracking-[0.18em] uppercase font-bold border transition-all ${
                  showFilters || activeFilterCount > 0
                    ? "bg-[#D4AF37] border-[#D4AF37] text-[#0A0A0A]"
                    : "border-[#0F0F0F]/15 text-[#0F0F0F]/50 hover:border-[#0F0F0F]/40 hover:text-[#0F0F0F]"
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {hasAnyFilter && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 text-[9px] tracking-[0.15em] uppercase font-bold text-[#0F0F0F]/40 hover:text-[#D4AF37] transition-colors"
                >
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isLoading && (
                <span className="text-[9px] tracking-[0.18em] uppercase text-[#0F0F0F]/35 hidden md:block">
                  {isFetching ? "Searching…" : `${products.length} piece${products.length !== 1 ? "s" : ""} found`}
                </span>
              )}
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[160px] h-8 rounded-none border-[#0F0F0F]/15 text-[10px] tracking-wide">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="latest">Latest Arrivals</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expandable filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="pb-4 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-[#D4AF37]/10 pt-4">
                  {/* Price range */}
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase font-bold text-[#0F0F0F]/50 mb-2">Price</p>
                    <div className="flex flex-col gap-1">
                      {PRICE_RANGES.map((r: any) => (
                        <button
                          key={r.label}
                          onClick={() => setPriceRange(priceRange?.label === r.label ? null : r)}
                          className={`text-left text-[10px] tracking-wide px-3 py-2 border transition-all ${
                            priceRange?.label === r.label
                              ? "bg-[#D4AF37] text-[#0A0A0A] border-[#D4AF37]"
                              : "text-[#0F0F0F]/60 border-[#0F0F0F]/10 hover:border-[#D4AF37]/60 hover:text-[#0F0F0F]"
                          }`}
                        >{r.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase font-bold text-[#0F0F0F]/50 mb-2">Category</p>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setCategory("")}
                        className={`text-left text-[10px] tracking-wide px-3 py-2 border transition-all ${
                          !category
                            ? "bg-[#0F0F0F] text-white border-[#0F0F0F]"
                            : "text-[#0F0F0F]/60 border-[#0F0F0F]/10 hover:border-[#D4AF37]/60 hover:text-[#0F0F0F]"
                        }`}
                      >All Categories</button>
                      {(Array.isArray(categories) ? categories : []).map((c: any) => (
                        <button
                          key={c.id}
                          onClick={() => setCategory(category === c.name ? "" : c.name)}
                          className={`text-left text-[10px] tracking-wide px-3 py-2 border transition-all ${
                            category === c.name
                              ? "bg-[#D4AF37] text-[#0A0A0A] border-[#D4AF37]"
                              : "text-[#0F0F0F]/60 border-[#0F0F0F]/10 hover:border-[#D4AF37]/60 hover:text-[#0F0F0F]"
                          }`}
                        >{c.name}</button>
                      ))}
                    </div>
                  </div>

                  {/* Material */}
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase font-bold text-[#0F0F0F]/50 mb-2">Material</p>
                    <div className="flex flex-wrap gap-1.5">
                      {MATERIALS.map((m: string) => (
                        <button
                          key={m}
                          onClick={() => setMaterial(material === m ? "" : m)}
                          className={`px-3 py-1.5 text-[9px] tracking-[0.15em] uppercase font-bold border transition-all ${
                            material === m
                              ? "bg-[#D4AF37] text-[#0A0A0A] border-[#D4AF37]"
                              : "text-[#0F0F0F]/50 border-[#0F0F0F]/15 hover:border-[#D4AF37]/60 hover:text-[#0F0F0F]"
                          }`}
                        >{m}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filter chips */}
          {activeFilterCount > 0 && !showFilters && (
            <div className="pb-2 flex items-center gap-2 flex-wrap">
              {category && (
                <span className="inline-flex items-center gap-1 bg-[#D4AF37]/15 text-[#0F0F0F] text-[9px] tracking-wide uppercase px-2 py-1">
                  {category}
                  <button onClick={() => setCategory("")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {material && (
                <span className="inline-flex items-center gap-1 bg-[#D4AF37]/15 text-[#0F0F0F] text-[9px] tracking-wide uppercase px-2 py-1">
                  {material}
                  <button onClick={() => setMaterial("")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {priceRange && (
                <span className="inline-flex items-center gap-1 bg-[#D4AF37]/15 text-[#0F0F0F] text-[9px] tracking-wide uppercase px-2 py-1">
                  {priceRange.label}
                  <button onClick={() => setPriceRange(null)}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-10 md:py-14 flex-1 w-full">

        {isLoading || isFetching ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-[3/4] bg-[#E8E2D9]/40 animate-pulse" />
            ))}
          </div>

        ) : !hasAnyFilter ? (
          /* ── Empty state: no query yet ── */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 border border-[#D4AF37]/30 rounded-full flex items-center justify-center mb-6">
              <Search className="w-7 h-7 text-[#D4AF37]/60" strokeWidth={1.4} />
            </div>
            <h2 className="font-serif text-2xl text-[#0F0F0F] mb-3">Start your search</h2>
            <p className="text-[#0F0F0F]/45 text-sm mb-10 max-w-sm">
              Type a keyword above or browse by category to find the perfect piece.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/shop"
                className="inline-flex items-center gap-2 border border-[#D4AF37] text-[#D4AF37] px-8 py-3 text-[10px] tracking-[0.25em] uppercase font-bold hover:bg-[#D4AF37] hover:text-white transition-colors">
                Browse All Jewellery <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/category/rings"
                className="inline-flex items-center gap-2 border border-[#0F0F0F]/15 text-[#0F0F0F]/60 px-8 py-3 text-[10px] tracking-[0.25em] uppercase font-bold hover:border-[#0F0F0F]/40 hover:text-[#0F0F0F] transition-colors">
                Shop Rings
              </Link>
            </div>
          </motion.div>

        ) : products.length === 0 ? (
          /* ── Empty state: no results ── */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <p className="font-serif text-2xl text-[#0F0F0F] mb-3">No pieces found</p>
            <p className="text-[#0F0F0F]/45 text-sm mb-6">
              {search ? `We couldn't find anything for "${search}".` : "Try adjusting your filters."}
            </p>
            <button
              onClick={clearAll}
              className="border border-[#D4AF37] text-[#D4AF37] px-8 py-3 text-[10px] tracking-[0.25em] uppercase font-bold hover:bg-[#D4AF37] hover:text-white transition-colors"
            >
              Clear All Filters
            </button>
          </motion.div>

        ) : (
          /* ── Results grid ── */
          <>
            {search && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] tracking-[0.2em] uppercase text-[#0F0F0F]/40 mb-8"
              >
                Results for <span className="text-[#D4AF37] font-semibold">"{search}"</span> — {products.length} piece{products.length !== 1 ? "s" : ""}
              </motion.p>
            )}
            <motion.div
              layout
              className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-8 md:gap-y-14"
            >
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index % 4} />
              ))}
            </motion.div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
