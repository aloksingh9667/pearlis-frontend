import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  className?: string;
  light?: boolean;
}

export function BackButton({ className = "", light = false }: BackButtonProps) {
  return (
    <motion.button
      onClick={() => window.history.back()}
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`group flex items-center gap-2.5 sm:gap-3.5 text-left ${className}`}
    >
      {/* Animated back circle */}
      <span
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:scale-105"
        style={{
          borderColor: light ? "rgba(255,255,255,0.35)" : "#D4AF37",
          color: light ? "rgba(255,255,255,0.85)" : "#D4AF37",
          backgroundColor: light ? "rgba(255,255,255,0.06)" : "transparent",
        }}
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
      </span>

      {/* Brand identity text */}
      <div className="flex flex-col leading-none overflow-hidden">
        <span
          className="font-serif text-[1rem] sm:text-[1.1rem] tracking-wide transition-colors duration-300 leading-snug"
          style={{ color: light ? "#ffffff" : "#0F0F0F" }}
        >
          The Pearlis Heritage
        </span>
        <span
          className="text-[8px] sm:text-[9.5px] tracking-[0.18em] sm:tracking-[0.2em] uppercase mt-[2px] transition-colors duration-300"
          style={{ color: light ? "rgba(255,255,255,0.55)" : "#D4AF37" }}
        >
          Crafting moments of eternal beauty since 1994.
        </span>
        {/* Sliding underline on hover */}
        <span
          className="block h-px mt-1.5 w-0 group-hover:w-full transition-all duration-500 ease-out"
          style={{ backgroundColor: light ? "rgba(255,255,255,0.4)" : "#D4AF37" }}
        />
      </div>
    </motion.button>
  );
}
