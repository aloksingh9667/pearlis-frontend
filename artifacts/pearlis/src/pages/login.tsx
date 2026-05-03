import { useState } from "react";
import { useLoginUser } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLoginUser();
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          login(data.token);
          toast({ title: "Welcome back", description: "You have successfully signed in." });
          setLocation("/");
        },
        onError: (err: any) => {
          toast({ 
            title: "Sign In Failed", 
            description: err.message || "Invalid credentials",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/">
            <h1 className="font-serif text-3xl tracking-widest mb-6">PEARLIS</h1>
          </Link>
          <h2 className="text-2xl font-serif">Sign In</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="uppercase tracking-widest text-xs">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="rounded-none h-12 border-border focus-visible:ring-accent"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="uppercase tracking-widest text-xs">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="rounded-none h-12 border-border focus-visible:ring-accent"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full rounded-none h-12 uppercase tracking-widest"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-accent underline underline-offset-4 uppercase tracking-widest">
            Forgot Password?
          </Link>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account? <Link href="/register" className="text-foreground hover:text-accent underline underline-offset-4">Register</Link>
        </div>
      </div>
    </div>
  );
}
