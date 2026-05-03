import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const { toast } = useToast();

  const checkEmail = async (value: string) => {
    setEmail(value);
    if (value.includes("@") && value.includes(".") && value.length > 5) {
      try {
        const res = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: value }),
        });
        const data = await res.json();
        setEmailExists(data.exists);
      } catch {
        setEmailExists(null);
      }
    } else {
      setEmailExists(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Something went wrong.", variant: "destructive" });
        return;
      }
      setSent(true);
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
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
          {!sent ? (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <h2 className="text-2xl font-serif text-center mb-3">Forgot Password</h2>
              <p className="text-sm text-muted-foreground text-center mb-8">
                Enter your registered email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="uppercase tracking-widest text-xs text-muted-foreground">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => checkEmail(e.target.value)}
                      required
                      className="rounded-none h-12 border-border focus-visible:ring-accent pr-10"
                      placeholder="you@example.com"
                    />
                    {emailExists !== null && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailExists
                          ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                          : <AlertCircle className="w-4 h-4 text-destructive" />
                        }
                      </div>
                    )}
                  </div>
                  <AnimatePresence>
                    {emailExists === false && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-destructive"
                      >
                        No account found with this email address.
                      </motion.p>
                    )}
                    {emailExists === true && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-green-600"
                      >
                        Account found. You can reset your password.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <Button
                  type="submit"
                  disabled={loading || emailExists === false}
                  className="w-full rounded-none h-12 uppercase tracking-widest"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5">
                <Mail className="w-7 h-7 text-accent" />
              </div>
              <h2 className="text-2xl font-serif mb-3">Check Your Email</h2>
              <p className="text-sm text-muted-foreground mb-1">
                We've sent a password reset link to
              </p>
              <p className="text-sm font-medium mb-6">{email}</p>
              <p className="text-xs text-muted-foreground mb-8">
                The link expires in 1 hour. If you don't see it, check your spam folder.
              </p>
              <Button
                variant="outline"
                onClick={() => { setSent(false); setEmailExists(null); }}
                className="rounded-none uppercase tracking-widest text-xs"
              >
                Try a different email
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-foreground hover:text-accent underline underline-offset-4">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
