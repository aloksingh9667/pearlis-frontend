import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle2, Mail, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Step = "form" | "otp" | "done";

export default function Register() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast({ title: "Missing Fields", description: "Please fill all fields.", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Weak Password", description: "Password must be at least 8 characters.", variant: "destructive" });
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
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Failed to send OTP", variant: "destructive" });
        return;
      }
      setStep("otp");
      toast({ title: "Code Sent", description: `A 6-digit code has been sent to ${email}` });
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ title: "Invalid Code", description: "Please enter the 6-digit code.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Verification Failed", description: data.error || "Invalid code", variant: "destructive" });
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

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      toast({ title: "Code Resent", description: `A new code has been sent to ${email}` });
    } catch {
      toast({ title: "Error", description: "Could not resend code.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-24">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/">
            <h1 className="font-serif text-3xl tracking-widest mb-6 cursor-pointer hover:text-accent transition-colors">PEARLIS</h1>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <h2 className="text-2xl font-serif text-center mb-8">Create an Account</h2>
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="uppercase tracking-widest text-xs text-muted-foreground">Full Name</Label>
                  <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="rounded-none h-12 border-border focus-visible:ring-accent" placeholder="Rahul Sharma" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="uppercase tracking-widest text-xs text-muted-foreground">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="rounded-none h-12 border-border focus-visible:ring-accent" placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="uppercase tracking-widest text-xs text-muted-foreground">Password</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="rounded-none h-12 border-border focus-visible:ring-accent" placeholder="Min. 8 characters" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="uppercase tracking-widest text-xs text-muted-foreground">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="rounded-none h-12 border-border focus-visible:ring-accent" placeholder="Repeat your password" />
                </div>
                <Button type="submit" disabled={loading} className="w-full rounded-none h-12 uppercase tracking-widest mt-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Verification Code"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-3">We'll send a 6-digit OTP to your email to verify your account.</p>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <button onClick={() => setStep("form")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-8 uppercase tracking-widest transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-accent" />
                </div>
                <h2 className="text-2xl font-serif mb-2">Check Your Email</h2>
                <p className="text-sm text-muted-foreground">We sent a 6-digit verification code to</p>
                <p className="text-sm font-medium mt-1">{email}</p>
              </div>
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="uppercase tracking-widest text-xs text-muted-foreground">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    className="rounded-none h-14 border-border focus-visible:ring-accent text-center text-2xl tracking-[0.5em] font-mono"
                    placeholder="······"
                  />
                </div>
                <Button type="submit" disabled={loading || otp.length !== 6} className="w-full rounded-none h-12 uppercase tracking-widest">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Create Account"}
                </Button>
              </form>
              <p className="text-center text-xs text-muted-foreground mt-5">
                Didn't receive the code?{" "}
                <button onClick={handleResendOtp} disabled={loading} className="text-accent hover:underline underline-offset-4">
                  Resend
                </button>
              </p>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-accent mx-auto mb-4" />
              <h2 className="text-2xl font-serif mb-2">Welcome to Pearlis</h2>
              <p className="text-sm text-muted-foreground">Your account has been created. Redirecting…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {step === "form" && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground hover:text-accent underline underline-offset-4">Sign In</Link>
          </p>
        )}
      </div>
    </div>
  );
}
