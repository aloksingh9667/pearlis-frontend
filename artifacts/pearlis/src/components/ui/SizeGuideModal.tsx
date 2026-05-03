import { useState } from "react";
import { X, Ruler } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetSettings } from "@/lib/adminApi";

interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "ring" | "bracelet" | "necklace";
}

const DEFAULT_RING_SIZES = [
  { in: "5",  us: "5",  mm: "49.3", inch: '1.94"' },
  { in: "6",  us: "6",  mm: "51.9", inch: '2.04"' },
  { in: "7",  us: "7",  mm: "54.4", inch: '2.14"' },
  { in: "8",  us: "8",  mm: "57.0", inch: '2.24"' },
  { in: "9",  us: "9",  mm: "59.5", inch: '2.34"' },
  { in: "10", us: "10", mm: "62.1", inch: '2.44"' },
  { in: "11", us: "11", mm: "64.6", inch: '2.54"' },
  { in: "12", us: "12", mm: "67.2", inch: '2.65"' },
];

const DEFAULT_BRACELET_SIZES = [
  { label: "XS",  wrist: "13–14 cm", fit: "Snug fit" },
  { label: "S",   wrist: "15–16 cm", fit: "Regular fit" },
  { label: "M",   wrist: "16–17 cm", fit: "Regular fit" },
  { label: "L",   wrist: "17–18 cm", fit: "Relaxed fit" },
  { label: "XL",  wrist: "18–19 cm", fit: "Relaxed fit" },
  { label: "XXL", wrist: "19–21 cm", fit: "Loose fit" },
];

const DEFAULT_NECKLACE_SIZES = [
  { length: '14" / 35 cm', style: "Choker",   description: "Sits at base of neck" },
  { length: '16" / 40 cm', style: "Collar",   description: "Just below collarbone" },
  { length: '18" / 45 cm', style: "Princess", description: "Most popular length" },
  { length: '20" / 50 cm', style: "Matinee",  description: "Hits top of chest" },
  { length: '24" / 60 cm', style: "Opera",    description: "Mid-chest drape" },
  { length: '30" / 76 cm', style: "Rope",     description: "Below bust line" },
];

const TABS = [
  { key: "ring",     label: "Rings" },
  { key: "bracelet", label: "Bracelets" },
  { key: "necklace", label: "Necklaces" },
] as const;

type Tab = typeof TABS[number]["key"];

export function SizeGuideModal({ open, onClose, defaultTab = "ring" }: SizeGuideModalProps) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const { data: settings } = useGetSettings();
  const sg = settings?.sizeGuide;

  const ringRows   = sg?.ringRows?.length     ? sg.ringRows     : DEFAULT_RING_SIZES;
  const braceletRows = sg?.braceletRows?.length ? sg.braceletRows : DEFAULT_BRACELET_SIZES;
  const necklaceRows = sg?.necklaceRows?.length ? sg.necklaceRows : DEFAULT_NECKLACE_SIZES;

  const ringTip      = sg?.ringTip      || "Wrap a thin strip of paper around your finger, mark where it overlaps, and measure the length in mm. Match it to the circumference column below.";
  const ringWarnTip  = sg?.ringWarnTip  || "Measure at the end of the day when fingers are at their largest. If between sizes, choose the larger size.";
  const braceletTip  = sg?.braceletTip  || "Use a soft measuring tape or a strip of paper to measure around your wrist just below the wrist bone. Add 1–2 cm for a comfortable fit.";
  const braceletWarnTip = sg?.braceletWarnTip || "For bangles, measure the widest part of your hand (knuckles) when fingers are pressed together.";
  const necklaceTip  = sg?.necklaceTip  || "Necklace length is measured from end to end including the clasp. The style it creates depends on your neckline and body type.";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[301] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="bg-[#FAF8F3] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#0F0F0F]/8">
                <div className="flex items-center gap-2.5">
                  <Ruler className="w-4 h-4 text-[#D4AF37]" />
                  <h2 className="font-serif text-xl text-[#0F0F0F]">Size Guide</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center text-[#0F0F0F]/40 hover:text-[#0F0F0F] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#0F0F0F]/8 px-6">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`relative py-4 mr-6 text-[10px] tracking-[0.2em] uppercase font-semibold transition-colors ${
                      tab === t.key ? "text-[#0F0F0F]" : "text-[#0F0F0F]/35 hover:text-[#0F0F0F]/60"
                    }`}
                  >
                    {t.label}
                    {tab === t.key && (
                      <motion.div layoutId="sg-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <AnimatePresence mode="wait">
                  {tab === "ring" && (
                    <motion.div key="ring" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <p className="text-xs text-[#0F0F0F]/50 mb-5 leading-relaxed">{ringTip}</p>

                      <div className="bg-[#D4AF37]/8 border border-[#D4AF37]/20 px-4 py-3 mb-5 flex items-start gap-2">
                        <span className="text-[#D4AF37] text-xs font-bold shrink-0">TIP</span>
                        <p className="text-xs text-[#0F0F0F]/60 leading-relaxed">{ringWarnTip}</p>
                      </div>

                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#0F0F0F]/10">
                            <th className="text-left text-[9px] tracking-[0.2em] uppercase text-[#0F0F0F]/40 font-semibold pb-3">India Size</th>
                            <th className="text-left text-[9px] tracking-[0.2em] uppercase text-[#0F0F0F]/40 font-semibold pb-3">US Size</th>
                            <th className="text-left text-[9px] tracking-[0.2em] uppercase text-[#0F0F0F]/40 font-semibold pb-3">Circumference</th>
                            <th className="text-left text-[9px] tracking-[0.2em] uppercase text-[#0F0F0F]/40 font-semibold pb-3">Diameter</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ringRows.map((r, i) => (
                            <tr key={r.in + i} className={`border-b border-[#0F0F0F]/5 ${i % 2 === 0 ? "bg-white/50" : ""}`}>
                              <td className="py-3 font-semibold text-[#0F0F0F]">{r.in}</td>
                              <td className="py-3 text-[#0F0F0F]/60">{r.us}</td>
                              <td className="py-3 text-[#0F0F0F]/60">{r.mm} mm</td>
                              <td className="py-3 text-[#0F0F0F]/60">{r.inch}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}

                  {tab === "bracelet" && (
                    <motion.div key="bracelet" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <p className="text-xs text-[#0F0F0F]/50 mb-5 leading-relaxed">{braceletTip}</p>

                      <div className="bg-[#D4AF37]/8 border border-[#D4AF37]/20 px-4 py-3 mb-5 flex items-start gap-2">
                        <span className="text-[#D4AF37] text-xs font-bold shrink-0">TIP</span>
                        <p className="text-xs text-[#0F0F0F]/60 leading-relaxed">{braceletWarnTip}</p>
                      </div>

                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#0F0F0F]/10">
                            <th className="text-left text-[9px] tracking-[0.2em] uppercase text-[#0F0F0F]/40 font-semibold pb-3">Size</th>
                            <th className="text-left text-[9px] tracking-[0.2em] uppercase text-[#0F0F0F]/40 font-semibold pb-3">Wrist Circumference</th>
                            <th className="text-left text-[9px] tracking-[0.2em] uppercase text-[#0F0F0F]/40 font-semibold pb-3">Fit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {braceletRows.map((b, i) => (
                            <tr key={b.label + i} className={`border-b border-[#0F0F0F]/5 ${i % 2 === 0 ? "bg-white/50" : ""}`}>
                              <td className="py-3 font-semibold text-[#0F0F0F]">{b.label}</td>
                              <td className="py-3 text-[#0F0F0F]/60">{b.wrist}</td>
                              <td className="py-3 text-[#0F0F0F]/45 text-xs">{b.fit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}

                  {tab === "necklace" && (
                    <motion.div key="necklace" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <p className="text-xs text-[#0F0F0F]/50 mb-5 leading-relaxed">{necklaceTip}</p>

                      <div className="space-y-3">
                        {necklaceRows.map((n, i) => (
                          <div key={n.length + i} className={`flex items-center gap-4 px-4 py-4 border border-[#0F0F0F]/6 ${i % 2 === 0 ? "bg-white/60" : "bg-transparent"}`}>
                            <div className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-3 flex-wrap">
                                <span className="font-serif text-base text-[#0F0F0F]">{n.length}</span>
                                <span className="text-[9px] tracking-[0.2em] uppercase text-[#D4AF37] font-semibold">{n.style}</span>
                              </div>
                              <p className="text-xs text-[#0F0F0F]/45 mt-0.5">{n.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[#0F0F0F]/8 bg-white/50">
                <p className="text-[9px] text-[#0F0F0F]/35 tracking-wide text-center">
                  Need help? Contact us at <span className="text-[#D4AF37]">care@pearlis.in</span> — our jewellery experts are happy to assist.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
