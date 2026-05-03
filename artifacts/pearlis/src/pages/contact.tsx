import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Mail, Phone, Clock, MessageCircle } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { useSendContactMessage, useGetSettings } from "@/lib/adminApi";
import { motion } from "framer-motion";

export default function Contact() {
  const { toast } = useToast();
  const sendMessage = useSendContactMessage();
  const { data: settings } = useGetSettings();
  const info = (settings?.contact || {}) as any;

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", subject: "", message: "",
  });
  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage.mutate(form, {
      onSuccess: () => {
        toast({
          title: "Message Sent",
          description: "Thank you for contacting Pearlis. Our concierge will be in touch shortly.",
        });
        setForm({ firstName: "", lastName: "", email: "", subject: "", message: "" });
      },
      onError: (err: any) => {
        toast({ title: "Failed to Send", description: err.message, variant: "destructive" });
      },
    });
  };

  const contactItems = [
    {
      icon: MapPin,
      label: "Address",
      value: info.address || "124 Luxury Lane, Mumbai, Maharashtra 400001, India",
    },
    {
      icon: Mail,
      label: "Email",
      value: info.email || "concierge@pearlis.com",
      href: `mailto:${info.email || "concierge@pearlis.com"}`,
    },
    {
      icon: Phone,
      label: "Phone",
      value: info.phone || "+91 98765 43210",
      href: `tel:${(info.phone || "+91 98765 43210").replace(/\s/g, "")}`,
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: info.whatsapp || "+91 98765 43210",
      href: `https://wa.me/${(info.whatsapp || "+91 98765 43210").replace(/\D/g, "")}`,
    },
    {
      icon: Clock,
      label: "Hours",
      value: info.hours || "Monday – Saturday: 10am – 7pm IST\nSunday: Closed",
      multiline: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-3">
        <BackButton />
      </div>

      {/* Header */}
      <div className="py-16 text-center border-b border-border">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-4">Get in Touch</p>
          <h1 className="font-serif text-4xl md:text-5xl mb-4">The Concierge</h1>
          <div className="w-16 h-px bg-accent mx-auto mb-6" />
          <p className="text-muted-foreground max-w-xl mx-auto">
            Our dedicated team is at your disposal for styling advice, bespoke requests, or any assistance you may require.
          </p>
        </motion.div>
      </div>

      <div className="flex-1 py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-16">
            {/* FORM */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:w-3/5">
              <h2 className="font-serif text-2xl mb-8">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="uppercase tracking-widest text-xs text-muted-foreground">First Name *</Label>
                    <Input id="firstName" required value={form.firstName} onChange={e => set("firstName", e.target.value)} className="rounded-none h-12 border-border" placeholder="Aisha" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="uppercase tracking-widest text-xs text-muted-foreground">Last Name *</Label>
                    <Input id="lastName" required value={form.lastName} onChange={e => set("lastName", e.target.value)} className="rounded-none h-12 border-border" placeholder="Patel" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="uppercase tracking-widest text-xs text-muted-foreground">Email Address *</Label>
                  <Input id="email" type="email" required value={form.email} onChange={e => set("email", e.target.value)} className="rounded-none h-12 border-border" placeholder="aisha@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="uppercase tracking-widest text-xs text-muted-foreground">Subject *</Label>
                  <Input id="subject" required value={form.subject} onChange={e => set("subject", e.target.value)} className="rounded-none h-12 border-border" placeholder="Bespoke Jewellery Inquiry" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="uppercase tracking-widest text-xs text-muted-foreground">Message *</Label>
                  <Textarea id="message" required value={form.message} onChange={e => set("message", e.target.value)} className="rounded-none min-h-[160px] border-border" placeholder="Tell us about your requirements..." />
                </div>
                <Button
                  type="submit"
                  disabled={sendMessage.isPending}
                  className="rounded-none h-12 px-10 uppercase tracking-widest w-full md:w-auto gap-2"
                >
                  {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Send Message
                </Button>
              </form>
            </motion.div>

            {/* INFO */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:w-2/5 space-y-8">
              <h2 className="font-serif text-2xl mb-6">Visit The Atelier</h2>
              {contactItems.map(({ icon: Icon, label, value, href, multiline }) => (
                <div key={label} className="flex gap-4">
                  <div className="w-10 h-10 border border-accent/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                    {href ? (
                      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                        className="text-sm hover:text-accent transition-colors">{value}</a>
                    ) : (
                      <p className={`text-sm ${multiline ? "whitespace-pre-line" : ""}`}>{value}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Map embed if configured */}
              {info.mapEmbed && (
                <div className="mt-6">
                  <iframe src={info.mapEmbed} width="100%" height="240" style={{ border: 0 }} allowFullScreen loading="lazy" title="Location Map" className="border border-border" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
