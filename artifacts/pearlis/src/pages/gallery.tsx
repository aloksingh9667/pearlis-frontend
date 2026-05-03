import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BackButton } from "@/components/ui/BackButton";

const galleryImages = [
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1599643478524-fb66f70d00f7?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=800",
];

export default function Gallery() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="pt-24 pb-24 container mx-auto px-6">
        <BackButton className="mb-6" />
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl mb-4">Gallery</h1>
          <div className="w-16 h-px bg-accent mx-auto mb-6"></div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Moments of brilliance. A visual exploration of Pearlis craftsmanship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryImages.map((src, i) => (
            <div key={i} className="aspect-square bg-muted overflow-hidden group">
              <img 
                src={src} 
                alt={`Gallery image ${i + 1}`} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
