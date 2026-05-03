import { useRoute, Link } from "wouter";
import { useListProducts } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/ui/ProductCard";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

const CATEGORY_META: Record<string, { title: string; sub: string; img: string }> = {
  ring: {
    title: "Ring",
    sub: "Beautiful rings for every occasion — floral, minimal, adjustable and more.",
    img: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=85&w=2000&h=600",
  },
  earring: {
    title: "Earring",
    sub: "Jhumkas, studs, drops and chandeliers — for every mood and occasion.",
    img: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=85&w=2000&h=600",
  },
  pendants: {
    title: "Pendants",
    sub: "Meaningful charms and pendants — lotus, moon, star and more.",
    img: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&q=85&w=2000&h=600",
  },
  stickons: {
    title: "Stickons",
    sub: "Trendy stick-on jewellery — bindis, maang tikka and more. No piercing needed.",
    img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=85&w=2000&h=600",
  },
  bracelet: {
    title: "Bracelet",
    sub: "Beaded, charm and tennis bracelets — stack them up in style.",
    img: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=85&w=2000&h=600",
  },
  anklets: {
    title: "Anklets",
    sub: "Dainty coin and butterfly anklets — a delicate touch for every step.",
    img: "https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?auto=format&fit=crop&q=85&w=2000&h=600",
  },
  crunchies: {
    title: "Crunchies",
    sub: "Pearl and satin crunchies — keep your hair stylish and your wrist pretty.",
    img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=85&w=2000&h=600",
  },
  "hair-accessories": {
    title: "Hair Accessories",
    sub: "Crystal clips, boho pins and more — beautiful accessories for every hairstyle.",
    img: "https://images.unsplash.com/photo-1560173045-beaf11c65dce?auto=format&fit=crop&q=85&w=2000&h=600",
  },
  "hair-band": {
    title: "Hair Band",
    sub: "Pearl and velvet headbands — add a luxurious touch to your look.",
    img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=85&w=2000&h=600",
  },
  "waist-chain": {
    title: "Waist Chain",
    sub: "Elegant belly and body chains — a statement piece for every outfit.",
    img: "https://images.unsplash.com/photo-1532645629-6b07f8c4c5c0?auto=format&fit=crop&q=85&w=2000&h=600",
  },
  "keys-chain": {
    title: "Keys Chain",
    sub: "Decorative tassel and crystal keychains — charm your everyday essentials.",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=85&w=2000&h=600",
  },
  "crochet-flowers": {
    title: "Crochet Flowers",
    sub: "Handmade crochet flower jewellery — each piece crafted with love.",
    img: "https://images.unsplash.com/photo-1490750967868-88df5691cc37?auto=format&fit=crop&q=85&w=2000&h=600",
  },
};

export default function Category() {
  const [, params] = useRoute("/category/:slug");
  const slug = params?.slug || "";
  const { data: productsData, isLoading } = useListProducts({ category: slug });
  const meta = CATEGORY_META[slug] || { title: slug.charAt(0).toUpperCase() + slug.slice(1), sub: "Handcrafted fine jewellery.", img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=85&w=2000&h=600" };

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
      <Navbar />

      {/* Hero banner */}
      <div className="relative w-full overflow-hidden" style={{ height: "260px" }}>
        <img src={meta.img} alt={meta.title} className="w-full h-full object-cover" style={{ objectPosition: "center 40%" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 100%)" }} />
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <BackButton light className="mb-4" />
            <div className="flex items-center gap-3 mb-3">
              <Link href="/" className="text-white/50 text-[9px] tracking-[0.2em] uppercase hover:text-white transition-colors">Home</Link>
              <span className="text-white/30 text-[9px]">/</span>
              <span className="text-white/70 text-[9px] tracking-[0.2em] uppercase">{meta.title}</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-white mb-3">{meta.title}</h1>
            <div className="w-10 h-[2px] bg-[#D4AF37] mb-3" />
            <p className="text-white/60 text-sm max-w-md">{meta.sub}</p>
          </motion.div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-12 md:py-16 w-full flex-1">
        {/* Result count */}
        {!isLoading && productsData?.products && (
          <div className="flex items-center justify-between mb-8">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#0F0F0F]/40">
              {productsData.products.length} piece{productsData.products.length !== 1 ? "s" : ""} in {meta.title}
            </p>
            <Link href="/shop" className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-[#D4AF37] font-semibold hover:gap-2 transition-all">
              All Collections <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] bg-[#E8E2D9]/50 animate-pulse" />)}
          </div>
        ) : productsData?.products?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-serif text-2xl text-[#0F0F0F] mb-3">No pieces yet in {meta.title}</p>
            <p className="text-[#0F0F0F]/45 text-sm mb-8">Check back soon or explore other collections.</p>
            <Link href="/shop">
              <button className="border border-[#D4AF37] text-[#D4AF37] px-10 py-3.5 text-[10px] tracking-[0.25em] uppercase font-bold hover:bg-[#D4AF37] hover:text-white transition-colors duration-200">
                View All Collections
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-8 md:gap-y-14">
            {productsData?.products?.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index % 4} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
