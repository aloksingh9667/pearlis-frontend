import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Eye, EyeOff, Mail, ArrowLeft, CheckCircle2, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const RESEND_COOLDOWN = 60;

type Step = "form" | "otp" | "done";

export default function SignUpPage() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast({ title: "Missing fields", description: "Please fill all fields.", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Weak password", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords match.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Failed to send code", variant: "destructive" });
        return;
      }
      setStep("otp");
      startCooldown();
      toast({ title: "Code sent", description: `A 6-digit code has been sent to ${email}` });
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ title: "Invalid code", description: "Please enter the 6-digit code.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp, name: name.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Verification failed", description: data.error || "Invalid code", variant: "destructive" });
        return;
      }
      login(data.token);
      setStep("done");
      setTimeout(() => setLocation("/"), 1500);
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Could not resend code.", variant: "destructive" });
        return;
      }
      startCooldown();
      setOtp("");
      toast({ title: "Code resent", description: `A new code has been sent to ${email}` });
    } catch {
      toast({ title: "Error", description: "Could not resend code.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_35%),linear-gradient(180deg,#FAF8F3_0%,#FFFDF8_100%)] flex items-center justify-center px-4 py-10 sm:py-14 lg:py-16">
      <div className="w-full max-w-5xl grid lg:grid-cols-[0.9fr_1.1fr] overflow-hidden rounded-[2rem] border border-[#D4AF37]/15 bg-white/55 shadow-[0_24px_100px_rgba(15,15,15,0.08)] backdrop-blur-2xl">

        {/* Left gold panel */}
        <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 bg-[linear-gradient(180deg,rgba(212,175,55,0.96),rgba(155,118,22,0.98))] text-[#0F0F0F] relative overflow-hidden">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.4),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(15,15,15,0.1),transparent_35%)]" />
          <div className="relative z-10">
            <Link href="/">
              <div className="inline-flex flex-col cursor-pointer">
                <div className="font-serif text-4xl tracking-[0.35em]">PEARLIS</div>
                <div className="text-[11px] tracking-[0.4em] uppercase text-[#0F0F0F]/75 mt-2">Join the private circle</div>
              </div>
            </Link>
            <div className="mt-16 max-w-sm space-y-5">
              <h1 className="font-serif text-5xl leading-[1.05]">Create your account in seconds.</h1>
              <p className="text-[#0F0F0F]/70 text-base leading-7">
                Unlock saved favorites, faster checkout, and early access to new collections.
              </p>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-3 gap-3 text-sm text-[#0F0F0F]/70">
            <div className="rounded-2xl border border-[#0F0F0F]/10 bg-white/20 p-4 text-center">
              <div className="text-lg mb-1">✨</div>
              Exclusive access
            </div>
            <div className="rounded-2xl border border-[#0F0F0F]/10 bg-white/20 p-4 text-center">
              <div className="text-lg mb-1">📧</div>
              OTP verified
            </div>
            <div className="rounded-2xl border border-[#0F0F0F]/10 bg-white/20 p-4 text-center">
              <div className="text-lg mb-1">🔐</div>
              Secure signup
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12 xl:p-14">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/">
              <div className="cursor-pointer">
                <div className="font-serif text-3xl tracking-[0.3em] text-[#0F0F0F]">PEARLIS</div>
                <div className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37] mt-2">Fine Jewellery</div>
              </div>
            </Link>
          </div>

          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <div className="mb-7">
                  <h2 className="font-serif text-3xl text-[#0F0F0F] mb-2">Create Account</h2>
                  <p className="text-[#6B6B6B] text-sm">We'll verify your email with a one-time code.</p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[11px] uppercase tracking-[0.18em] text-[#0F0F0F]/70 font-semibold">Full Name</Label>
                    <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Rahul Sharma" className="h-12 rounded-xl border-[#E8DDC0] focus:border-[#D4AF37] focus-visible:ring-[#D4AF37]/25 bg-white" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.18em] text-[#0F0F0F]/70 font-semibold">Email Address</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="h-12 rounded-xl border-[#E8DDC0] focus:border-[#D4AF37] focus-visible:ring-[#D4AF37]/25 bg-white" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[11px] uppercase tracking-[0.18em] text-[#0F0F0F]/70 font-semibold">Password</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters" className="h-12 rounded-xl border-[#E8DDC0] focus:border-[#D4AF37] focus-visible:ring-[#D4AF37]/25 bg-white pr-11" />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#0F0F0F] transition-colors" tabIndex={-1}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm" className="text-[11px] uppercase tracking-[0.18em] text-[#0F0F0F]/70 font-semibold">Confirm Password</Label>
                    <div className="relative">
                      <Input id="confirm" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repeat your password" className="h-12 rounded-xl border-[#E8DDC0] focus:border-[#D4AF37] focus-visible:ring-[#D4AF37]/25 bg-white pr-11" />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#0F0F0F] transition-colors" tabIndex={-1}>
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-[#D4AF37] hover:bg-[#c7a436] text-white uppercase tracking-[0.22em] text-[11px] font-semibold transition-colors shadow-[0_12px_24px_rgba(212,175,55,0.22)] mt-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Verification Code"}
                  </Button>
                </form>

                <p className="mt-7 text-center text-sm text-[#6B6B6B]">
                  Already have an account?{" "}
                  <Link href="/sign-in" className="text-[#D4AF37] hover:text-[#c7a436] font-semibold hover:underline underline-offset-4 transition-colors">
                    Sign In
                  </Link>
                </p>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <button onClick={() => { setStep("form"); setCooldown(0); if (intervalRef.current) clearInterval(intervalRef.current); }} className="flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#0F0F0F] mb-8 uppercase tracking-widest transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-[#D4AF37]" />
                  </div>
                  <h2 className="font-serif text-2xl text-[#0F0F0F] mb-2">Check Your Email</h2>
                  <p className="text-sm text-[#6B6B6B]">We sent a 6-digit verification code to</p>
                  <p className="text-sm font-semibold text-[#0F0F0F] mt-1">{email}</p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-[11px] uppercase tracking-[0.18em] text-[#0F0F0F]/70 font-semibold">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                      required
                      placeholder="······"
                      className="h-14 rounded-xl border-[#E8DDC0] focus:border-[#D4AF37] focus-visible:ring-[#D4AF37]/25 bg-white text-center text-2xl tracking-[0.5em] font-mono"
                    />
                  </div>

                  <Button type="submit" disabled={loading || otp.length !== 6} className="w-full h-12 rounded-xl bg-[#D4AF37] hover:bg-[#c7a436] text-white uppercase tracking-[0.22em] text-[11px] font-semibold transition-colors shadow-[0_12px_24px_rgba(212,175,55,0.22)]">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Create Account"}
                  </Button>
                </form>

                <div className="text-center mt-5">
                  <p className="text-xs text-[#6B6B6B] mb-2">Didn't receive the code?</p>
                  {cooldown > 0 ? (
                    <div className="inline-flex items-center gap-1.5 text-xs text-[#6B6B6B]">
                      <Timer className="w-3 h-3" />
                      <span>Resend in <span className="font-semibold tabular-nums text-[#0F0F0F]">{cooldown}s</span></span>
                    </div>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={loading}
                      className="text-xs text-[#D4AF37] hover:text-[#c7a436] font-semibold hover:underline underline-offset-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Sending…" : "Resend Code"}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                <CheckCircle2 className="w-16 h-16 text-[#D4AF37] mx-auto mb-4" />
                <h2 className="font-serif text-3xl text-[#0F0F0F] mb-3">Welcome to Pearlis</h2>
                <p className="text-sm text-[#6B6B6B]">Your account has been created. Redirecting…</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
