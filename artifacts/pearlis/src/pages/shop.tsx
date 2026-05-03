import { useState, useEffect } from "react";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/ui/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";
import { useGetSettings } from "@/lib/adminApi";

const DEFAULT_MATERIALS = ["Gold", "Silver", "Platinum", "Rose Gold", "Diamond", "Pearl", "Gemstone"];
const DEFAULT_PRICE_RANGES = [
  { label: "Under ₹5,000", minINR: 0, maxINR: 5000 },
  { label: "₹5,000 – ₹15,000", minINR: 5000, maxINR: 15000 },
  { label: "₹15,000 – ₹50,000", minINR: 15000, maxINR: 50000 },
  { label: "₹50,000 – ₹1,00,000", minINR: 50000, maxINR: 100000 },
  { label: "Above ₹1,00,000", minINR: 100000, maxINR: 9999999 },
];

export default function Shop() {
  const [location] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

  const [category, setCategory] = useState<string>(params.get("category") || "");
  const [sort, setSort] = useState<string>(params.get("sort") || "latest");
  const [material, setMaterial] = useState<string>("");
  const [priceRange, setPriceRange] = useState<{ label: string; minINR: number; maxINR: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");

  const { data: categories } = useListCategories();
  const { data: settings } = useGetSettings();
  const conversionRate = settings?.general?.conversionRate || 83;
  const PRICE_RANGES = settings?.shopFilters?.priceRanges?.length
    ? settings.shopFilters.priceRanges
    : DEFAULT_PRICE_RANGES;
  const MATERIALS = settings?.shopFilters?.materials?.length
    ? settings.shopFilters.materials
    : DEFAULT_MATERIALS;

  const minPriceUSD = priceRange ? priceRange.minINR / conversionRate : undefined;
  const maxPriceUSD = priceRange ? priceRange.maxINR / conversionRate : undefined;

  const { data: productsData, isLoading } = useListProducts({
    category: category || undefined,
    sort: sort as any,
    limit: 100,
    ...(material ? { material } : {}),
    ...(priceRange ? { minPrice: minPriceUSD, maxPrice: maxPriceUSD } : {}),
    ...(search ? { search } : {}),
  } as any);

  const activeFilterCount = [category, material, priceRange, search].filter(Boolean).length;

  function clearAllFilters() {
    setCategory("");
    setMaterial("");
    setPriceRange(null);
    setSearch("");
    setSearchInput("");
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
      <Navbar />

      {/* Hero banner */}
      <div className="relative w-full overflow-hidden" style={{ height: "240px" }}>
        <img
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=85&w=2000&h=600"
          alt="The Collection"
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 30%" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.25) 100%)" }} />
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-[#D4AF37] text-[9px] tracking-[0.4em] uppercase font-bold mb-3">Fine Jewellery</p>
            <h1 className="font-serif text-4xl md:text-5xl text-white mb-3">The Collection</h1>
            <div className="w-10 h-[2px] bg-[#D4AF37] mb-3" />
            <p className="text-white/55 text-sm">Handcrafted pieces for every moment and occasion.</p>
          </motion.div>
        </div>
      </div>

      {/* ── Filter + Sort bar ── */}
      <div className="bg-white border-b border-[#D4AF37]/12 sticky top-[100px] z-30">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">

          {/* Top row: category pills + search + sort */}
          <div className="py-3 flex flex-wrap items-center justify-between gap-3">
            {/* Category pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0F0F0F]/40 hidden sm:block" strokeWidth={1.5} />
              <button
                onClick={() => setCategory("")}
                className={`px-3 py-1.5 text-[9px] tracking-[0.2em] uppercase font-bold transition-all duration-200 ${
                  category === "" ? "bg-[#0F0F0F] text-white" : "text-[#0F0F0F]/50 hover:text-[#0F0F0F] border border-[#0F0F0F]/15 hover:border-[#0F0F0F]/40"
                }`}
              >All</button>
              {categories?.categories?.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.name)}
                  className={`px-3 py-1.5 text-[9px] tracking-[0.2em] uppercase font-bold transition-all duration-200 ${
                    category === c.name ? "bg-[#0F0F0F] text-white" : "text-[#0F0F0F]/50 hover:text-[#0F0F0F] border border-[#0F0F0F]/15 hover:border-[#0F0F0F]/40"
                  }`}
                >{c.name}</button>
              ))}
            </div>

            {/* Right: search + filters toggle + sort */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); }} className="hidden md:flex items-center border border-[#0F0F0F]/15 h-8">
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search pieces..."
                  className="h-full px-3 text-[11px] bg-transparent outline-none w-36 placeholder:text-[#0F0F0F]/35"
                />
                {searchInput && (
                  <button type="button" onClick={() => { setSearchInput(""); setSearch(""); }} className="px-2 text-[#0F0F0F]/35 hover:text-[#0F0F0F] transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </form>

              {/* Filters toggle */}
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

              {/* Sort */}
              {!isLoading && productsData?.products && (
                <span className="text-[9px] tracking-[0.18em] uppercase text-[#0F0F0F]/35 hidden md:block">
                  {productsData.products.length} pieces
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
                <div className="pb-4 pt-1 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-[#D4AF37]/10">

                  {/* Price Range */}
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase font-bold text-[#0F0F0F]/50 mb-2">Price Range</p>
                    <div className="flex flex-col gap-1.5">
                      {PRICE_RANGES.map(r => (
                        <button
                          key={r.label}
                          onClick={() => setPriceRange(priceRange?.label === r.label ? null : r)}
                          className={`text-left text-xs px-3 py-1.5 transition-all border ${
                            priceRange?.label === r.label
                              ? "bg-[#0F0F0F] text-white border-[#0F0F0F]"
                              : "text-[#0F0F0F]/60 border-[#0F0F0F]/10 hover:border-[#0F0F0F]/30 hover:text-[#0F0F0F]"
                          }`}
                        >{r.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Material */}
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase font-bold text-[#0F0F0F]/50 mb-2">Material</p>
                    <div className="flex flex-wrap gap-1.5">
                      {MATERIALS.map(m => (
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

                  {/* Search (mobile) + Clear */}
                  <div className="flex flex-col justify-between gap-4">
                    <div>
                      <p className="text-[9px] tracking-[0.25em] uppercase font-bold text-[#0F0F0F]/50 mb-2">Search</p>
                      <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); }} className="flex items-center border border-[#0F0F0F]/15 h-9">
                        <input
                          value={searchInput}
                          onChange={e => setSearchInput(e.target.value)}
                          placeholder="Search pieces..."
                          className="h-full px-3 text-xs bg-transparent outline-none flex-1 placeholder:text-[#0F0F0F]/35"
                        />
                        {searchInput && (
                          <button type="button" onClick={() => { setSearchInput(""); setSearch(""); }} className="px-2 text-[#0F0F0F]/35 hover:text-[#0F0F0F]">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <button type="submit" className="h-full px-3 bg-[#0F0F0F] text-white text-[9px] tracking-wide uppercase font-bold hover:bg-[#D4AF37] hover:text-[#0A0A0A] transition-colors">Go</button>
                      </form>
                    </div>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="flex items-center gap-1.5 text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F0F0F]/50 hover:text-[#D4AF37] transition-colors w-fit"
                      >
                        <X className="w-3 h-3" /> Clear All Filters
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filter chips */}
          {activeFilterCount > 0 && !showFilters && (
            <div className="pb-2 flex items-center gap-2 flex-wrap">
              {search && (
                <span className="inline-flex items-center gap-1 bg-[#0F0F0F]/6 text-[#0F0F0F] text-[9px] tracking-wide uppercase px-2 py-1">
                  Search: {search}
                  <button onClick={() => { setSearch(""); setSearchInput(""); }}><X className="w-3 h-3" /></button>
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
              <button onClick={clearAllFilters} className="text-[9px] tracking-wide uppercase text-[#0F0F0F]/40 hover:text-[#D4AF37] transition-colors">
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Products grid */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-10 md:py-14 flex-1">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="aspect-[3/4] bg-[#E8E2D9]/40 animate-pulse" />)}
          </div>
        ) : productsData?.products?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-serif text-2xl text-[#0F0F0F] mb-3">No pieces found</p>
            <p className="text-[#0F0F0F]/45 text-sm mb-6">Try adjusting your filters or search term.</p>
            <button onClick={clearAllFilters} className="border border-[#D4AF37] text-[#D4AF37] px-8 py-3 text-[10px] tracking-[0.25em] uppercase font-bold hover:bg-[#D4AF37] hover:text-white transition-colors">
              Clear All Filters
            </button>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-8 md:gap-y-14"
          >
            {productsData?.products?.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index % 4} />
            ))}
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
