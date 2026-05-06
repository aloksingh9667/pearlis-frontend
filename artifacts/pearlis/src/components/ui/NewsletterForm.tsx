import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { apiUrl } from "@/lib/apiUrl";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch(apiUrl("/api/newsletter/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to subscribe");
      setStatus("success");
      setMessage(data.message || "You're on the list.");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Something went wrong. Please try again.");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 text-[#D4AF37]">
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-0">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          disabled={status === "loading"}
          className="flex-1 min-w-0 bg-white/5 border border-white/15 text-white placeholder:text-white/30 text-sm px-4 py-2.5 focus:outline-none focus:border-[#D4AF37] transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-5 py-2.5 bg-[#D4AF37] text-[#0F0F0F] text-[10px] tracking-[0.2em] uppercase font-semibold hover:bg-[#C4A030] transition-colors disabled:opacity-60 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
        >
          {status === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Subscribe"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-red-400 text-xs">{message}</p>
      )}
    </form>
  );
}
