import { Link } from "wouter";
import { Instagram, Facebook, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { useGetSettings } from "@/lib/adminApi";

export function Footer() {
  const { data: settings } = useGetSettings();
  const social = settings?.social as any;
  const contact = settings?.contact as any;

  const socialLinks = [
    { icon: Instagram, href: social?.instagram || "#", label: "Instagram" },
    { icon: Facebook, href: social?.facebook || "#", label: "Facebook" },
    { icon: Twitter, href: social?.twitter || "#", label: "Twitter" },
    { icon: Youtube, href: social?.youtube || "#", label: "YouTube" },
  ];

  return (
    <footer className="bg-[#0F0F0F] text-white">
      {/* Main footer */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <p className="font-serif text-2xl tracking-[0.35em] font-bold text-white">PEARLIS</p>
              <p className="text-[9px] tracking-[0.4em] uppercase text-[#D4AF37] mt-1">Fine Jewellery</p>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-8">
              Exceptional jewellery crafted with intention. A sanctuary for those who appreciate the quiet power of luxury, designed to be passed down through generations.
            </p>
            {/* Social links */}
            <div className="flex gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href !== "#" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 border border-white/15 flex items-center justify-center text-white/50 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-[10px] tracking-[0.25em] uppercase font-semibold text-white mb-6">Explore</h3>
            <ul className="space-y-3.5">
              {[
                { label: "All Jewellery", href: "/shop" },
                { label: "Rings", href: "/category/rings" },
                { label: "Necklaces", href: "/category/necklaces" },
                { label: "Bracelets", href: "/category/bracelets" },
                { label: "Earrings", href: "/category/earrings" },
                { label: "Gallery", href: "/gallery" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-white/50 hover:text-[#D4AF37] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Assistance */}
          <div>
            <h3 className="text-[10px] tracking-[0.25em] uppercase font-semibold text-white mb-6">Assistance</h3>
            <ul className="space-y-3.5">
              {[
                { label: "Contact Us", href: "/contact" },
                { label: "Our Story", href: "/about" },
                { label: "Order Status", href: "/orders" },
                { label: "Blog & Guides", href: "/blog" },
                { label: "Care Instructions", href: "#" },
                { label: "Returns & Exchanges", href: "#" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-white/50 hover:text-[#D4AF37] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[10px] tracking-[0.25em] uppercase font-semibold text-white mb-6">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-white/50">
                <MapPin className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <span>{contact?.address || "124 Luxury Lane, Bandra West\nMumbai, MH 400050"}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/50">
                <Mail className="w-4 h-4 text-[#D4AF37] flex-shrink-0" strokeWidth={1.5} />
                <a href={`mailto:${contact?.email || "concierge@pearlis.com"}`} className="hover:text-[#D4AF37] transition-colors">
                  {contact?.email || "concierge@pearlis.com"}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/50">
                <Phone className="w-4 h-4 text-[#D4AF37] flex-shrink-0" strokeWidth={1.5} />
                <a href={`tel:${(contact?.phone || "+91 98765 43210").replace(/\s/g, "")}`} className="hover:text-[#D4AF37] transition-colors">
                  {contact?.phone || "+91 98765 43210"}
                </a>
              </li>
            </ul>

            {/* Accepted payments */}
            <div className="mt-8">
              <p className="text-[9px] tracking-[0.2em] uppercase text-white/30 mb-3">Secure Payments</p>
              <div className="flex gap-2 flex-wrap">
                {["VISA", "MC", "UPI", "RZP"].map(m => (
                  <span key={m} className="border border-white/10 text-white/40 text-[9px] px-2.5 py-1 tracking-wider font-mono">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-white/30">
          <p>&copy; {new Date().getFullYear()} Pearlis Fine Jewellery. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white/60 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white/60 transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
