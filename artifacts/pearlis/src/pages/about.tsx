import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BackButton } from "@/components/ui/BackButton";

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-3">
        <BackButton />
      </div>

      {/* Hero */}
      <section className="relative h-[70vh] w-full overflow-hidden bg-black">
        <img 
          src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&q=80&w=2000" 
          alt="Pearlis Atelier" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
          <h1 className="font-serif text-5xl md:text-7xl text-white mb-6 max-w-4xl leading-tight">
            The Pearlis Heritage
          </h1>
          <p className="text-white/80 uppercase tracking-widest text-sm max-w-lg leading-relaxed">
            Crafting moments of eternal beauty since 1994.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 md:py-32 container mx-auto px-6 max-w-4xl">
        <div className="prose prose-lg md:prose-xl max-w-none text-center">
          <p className="text-muted-foreground leading-relaxed font-serif text-2xl italic mb-12">
            "Jewelry is not merely an accessory. It is an expression of self, a marker of time, and a quiet celebration of the extraordinary."
          </p>
          <div className="w-16 h-px bg-accent mx-auto mb-12"></div>
          <p className="text-foreground leading-relaxed mb-8">
            Founded in the heart of the design district, Pearlis was born from a singular vision: to create jewelry that transcends fleeting trends and speaks to the eternal. Our founder believed that true luxury lies not in excess, but in precision, intention, and uncompromising craftsmanship.
          </p>
          <p className="text-foreground leading-relaxed mb-8">
            Every Pearlis piece begins its journey at the source. We work exclusively with ethically sourced diamonds and precious metals, ensuring that our commitment to beauty is matched only by our commitment to integrity. Our master artisans, many of whom come from generations of jewelers, bring these raw materials to life using both time-honored techniques and innovative design.
          </p>
          <p className="text-foreground leading-relaxed">
            Today, Pearlis remains a sanctuary for those who appreciate the quiet power of luxury. From our signature collections to bespoke creations, each piece is designed to be worn, loved, and eventually passed down—a testament to moments that matter.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="font-serif text-3xl text-center mb-16">Our Pillars</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <h3 className="font-serif text-xl mb-4 tracking-wide">Uncompromising Quality</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We select only the finest materials, ensuring every stone and every metal meets our exacting standards before it reaches our atelier.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-xl mb-4 tracking-wide">Ethical Sourcing</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our commitment to sustainability means we trace our materials to their origins, supporting practices that respect both people and the planet.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-xl mb-4 tracking-wide">Master Craftsmanship</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Each piece is meticulously crafted by artisans who dedicate their lives to perfecting the delicate art of fine jewelry making.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
