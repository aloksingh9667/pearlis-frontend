import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

const GOOGLE_ENABLED = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Sign In Failed", description: data.error || "Invalid credentials", variant: "destructive" });
        return;
      }
      login(data.token);
      toast({ title: "Welcome back", description: "You have successfully signed in." });
      setLocation("/");
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast({ title: "Google Sign-In Failed", description: data.error || "Could not authenticate with Google.", variant: "destructive" });
          return;
        }
        login(data.token);
        toast({ title: "Welcome back", description: "Signed in with Google." });
        setLocation("/");
      } catch {
        toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      toast({ title: "Google Sign-In Cancelled", description: "Please try again.", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_35%),linear-gradient(180deg,#FAF8F3_0%,#FFFDF8_100%)] flex items-center justify-center px-4 py-10 sm:py-14 lg:py-16">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] overflow-hidden rounded-[2rem] border border-[#D4AF37]/15 bg-white/55 shadow-[0_24px_100px_rgba(15,15,15,0.08)] backdrop-blur-2xl">

        {/* Left dark panel */}
        <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 bg-[linear-gradient(180deg,rgba(15,15,15,0.97),rgba(30,24,14,0.97))] text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.35),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_35%)]" />
          <div className="relative z-10">
            <Link href="/">
              <div className="inline-flex flex-col cursor-pointer">
                <div className="font-serif text-4xl tracking-[0.35em]">PEARLIS</div>
                <div className="text-[11px] tracking-[0.4em] uppercase text-[#D4AF37] mt-2">Luxury Jewellery House</div>
              </div>
            </Link>
            <div className="mt-16 max-w-sm space-y-5">
              <h1 className="font-serif text-5xl leading-[1.05]">Welcome back to timeless elegance.</h1>
              <p className="text-white/65 text-base leading-7">
                Sign in to access your wishlist, orders, and personalized jewelry experience.
              </p>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-3 gap-3 text-sm text-white/60">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-[#D4AF37] text-lg mb-1">🔒</div>
              Secure login
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-[#D4AF37] text-lg mb-1">⚡</div>
              Fast checkout
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-[#D4AF37] text-lg mb-1">💛</div>
              Premium support
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

          <div className="mb-8">
            <h2 className="font-serif text-3xl text-[#0F0F0F] mb-2">Sign In</h2>
            <p className="text-[#6B6B6B] text-sm">Enter your email and password to continue.</p>
          </div>

          <>
              <button
                type="button"
                onClick={() => {
                  if (!GOOGLE_ENABLED) {
                    toast({ title: "Google Login Not Configured", description: "Set VITE_GOOGLE_CLIENT_ID in your Cloudflare Pages environment variables to enable Google login.", variant: "destructive" });
                    return;
                  }
                  googleLogin();
                }}
                disabled={googleLoading || loading}
                className="w-full h-12 rounded-xl border border-[#E8DDC0] bg-white hover:bg-[#FAF8F3] flex items-center justify-center gap-3 text-[#0F0F0F] text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-5"
              >
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                <span>Continue with Google</span>
              </button>

              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E8DDC0]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-[#6B6B6B] uppercase tracking-widest">or</span>
                </div>
              </div>
            </>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.18em] text-[#0F0F0F]/70 font-semibold">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="h-12 rounded-xl border-[#E8DDC0] focus:border-[#D4AF37] focus-visible:ring-[#D4AF37]/25 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[11px] uppercase tracking-[0.18em] text-[#0F0F0F]/70 font-semibold">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                  className="h-12 rounded-xl border-[#E8DDC0] focus:border-[#D4AF37] focus-visible:ring-[#D4AF37]/25 bg-white pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#0F0F0F] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-[#D4AF37] hover:text-[#c7a436] hover:underline underline-offset-4 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#D4AF37] hover:bg-[#c7a436] text-white uppercase tracking-[0.22em] text-[11px] font-semibold transition-colors shadow-[0_12px_24px_rgba(212,175,55,0.22)]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[#6B6B6B]">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-[#D4AF37] hover:text-[#c7a436] font-semibold hover:underline underline-offset-4 transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
