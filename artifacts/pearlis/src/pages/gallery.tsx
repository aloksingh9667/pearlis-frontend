import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BackButton } from "@/components/ui/BackButton";
import { useGetSettings } from "@/lib/adminApi";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const FALLBACK_IMAGES = [
  { url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800", alt: "Jewellery 1" },
  { url: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=800", alt: "Jewellery 2" },
  { url: "https://images.unsplash.com/photo-1599643478524-fb66f70d00f7?auto=format&fit=crop&q=80&w=800", alt: "Jewellery 3" },
  { url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800", alt: "Jewellery 4" },
  { url: "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?auto=format&fit=crop&q=80&w=800", alt: "Jewellery 5" },
  { url: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=800", alt: "Jewellery 6" },
];

type GalleryImage = { url: string; alt: string };

export default function Gallery() {
  const { data: settings } = useGetSettings();
  const [lightbox, setLightbox] = useState<number | null>(null);

  const galleryImages: GalleryImage[] =
    Array.isArray((settings as any)?.gallery) && (settings as any).gallery.length > 0
      ? (settings as any).gallery
      : FALLBACK_IMAGES;

  const prev = () => setLightbox(i => (i === null ? null : (i - 1 + galleryImages.length) % galleryImages.length));
  const next = () => setLightbox(i => (i === null ? null : (i + 1) % galleryImages.length));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="pt-24 pb-24 container mx-auto px-6">
        <BackButton className="mb-6" />

        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl mb-4">Gallery</h1>
          <div className="w-16 h-px bg-accent mx-auto mb-6" />
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Moments of brilliance. A visual exploration of Pearlis craftsmanship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryImages.map((img, i) => (
            <motion.div
              key={img.url + i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="aspect-square bg-muted overflow-hidden group cursor-pointer relative"
              onClick={() => setLightbox(i)}
            >
              <img
                src={img.url}
                alt={img.alt || `Gallery image ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-end p-4">
                {img.alt && (
                  <p className="text-white text-sm font-medium tracking-wide translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    {img.alt}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Footer />

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[300] bg-black/92 flex items-center justify-center px-4"
            onClick={() => setLightbox(null)}
          >
            {/* Close */}
            <button
              className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors z-10"
              onClick={() => setLightbox(null)}
            >
              <X className="w-7 h-7" />
            </button>

            {/* Prev */}
            <button
              className="absolute left-4 text-white/70 hover:text-white transition-colors z-10 p-2"
              onClick={e => { e.stopPropagation(); prev(); }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            {/* Image */}
            <motion.div
              key={lightbox}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="max-h-[88vh] max-w-[88vw] relative"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={galleryImages[lightbox].url}
                alt={galleryImages[lightbox].alt}
                className="max-h-[88vh] max-w-[88vw] object-contain shadow-2xl"
              />
              {galleryImages[lightbox].alt && (
                <p className="text-white/70 text-sm text-center mt-3 tracking-wide">
                  {galleryImages[lightbox].alt}
                </p>
              )}
            </motion.div>

            {/* Next */}
            <button
              className="absolute right-4 text-white/70 hover:text-white transition-colors z-10 p-2"
              onClick={e => { e.stopPropagation(); next(); }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/50 text-xs tracking-widest uppercase">
              {lightbox + 1} / {galleryImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
