import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Eye, EyeOff } from "lucide-react";

type View = "login" | "otp-login" | "forgot" | "forgot-otp" | "create" | "create-otp";

async function apiFetch(path: string, body: Record<string, string>) {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export default function AdminLogin() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<View>("login");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  /* login */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  /* forgot */
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPwd, setNewPwd] = useState("");

  /* create */
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPwd, setCreatePwd] = useState("");
  const [createMaster, setCreateMaster] = useState("");
  const [createOtp, setCreateOtp] = useState("");

  function err(msg: string) {
    toast({ title: "Error", description: msg, variant: "destructive" });
  }
  function ok(msg: string) {
    toast({ title: "Success", description: msg });
  }

  /* ── Login submit ── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { ok: success, data } = await apiFetch("/admin-auth/login", { email: loginEmail, password: loginPwd });
    setLoading(false);
    if (success) {
      login(data.token);
      window.location.href = "/admin";
    } else if (data.requireOtp) {
      toast({ title: "OTP Sent", description: "Check the admin email for your OTP." });
      setView("otp-login");
    } else {
      if (data.attemptsLeft !== undefined) setAttemptsLeft(data.attemptsLeft);
      err(data.error || "Login failed");
    }
  }

  /* ── Send OTP for locked login ── */
  async function handleSendLoginOtp() {
    setLoading(true);
    const { ok: success, data } = await apiFetch("/admin-auth/send-otp", { purpose: "login" });
    setLoading(false);
    if (success) { ok("OTP sent to admin email"); setView("otp-login"); }
    else err(data.error || "Failed to send OTP");
  }

  /* ── Verify OTP login ── */
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { ok: success, data } = await apiFetch("/admin-auth/verify-otp", { otp: loginOtp });
    setLoading(false);
    if (success) { login(data.token); window.location.href = "/admin"; }
    else err(data.error || "Invalid OTP");
  }

  /* ── Forgot: send OTP ── */
  async function handleForgotSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { ok: success, data } = await apiFetch("/admin-auth/forgot-password", {});
    setLoading(false);
    if (success) { ok("OTP sent to admin email"); setView("forgot-otp"); }
    else err(data.error || "Failed");
  }

  /* ── Forgot: reset password ── */
  async function handleResetPwd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { ok: success, data } = await apiFetch("/admin-auth/reset-password", { otp: forgotOtp, newPassword: newPwd });
    setLoading(false);
    if (success) { ok("Password reset successfully"); setView("login"); }
    else err(data.error || "Reset failed");
  }

  /* ── Create: send OTP (verify master pwd) ── */
  async function handleCreateSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!createMaster) { err("Enter master password first"); return; }
    setLoading(true);
    const { ok: success, data } = await apiFetch("/admin-auth/create-send-otp", { masterPassword: createMaster });
    setLoading(false);
    if (success) { ok("OTP sent to admin email"); setView("create-otp"); }
    else err(data.error || "Failed");
  }

  /* ── Create: submit ── */
  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { ok: success, data } = await apiFetch("/admin-auth/create", {
      name: createName, email: createEmail, password: createPwd,
      masterPassword: createMaster, otp: createOtp,
    });
    setLoading(false);
    if (success) { login(data.token); window.location.href = "/admin"; }
    else err(data.error || "Failed to create admin");
  }

  const inputCls = "bg-[#111] border-[#2a2a2a] text-white placeholder:text-[#444] focus-visible:ring-[#D4AF37] focus-visible:border-[#D4AF37]";
  const btnCls = "w-full bg-[#D4AF37] hover:bg-[#c49f2f] text-black font-bold tracking-widest text-xs uppercase h-11";

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 border border-[#D4AF37]/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
          <h1 className="text-2xl font-serif tracking-[0.3em] text-white">PEARLIS</h1>
          <p className="text-[10px] tracking-[0.3em] text-[#D4AF37] uppercase mt-1">Admin Portal</p>
        </div>

        <div className="bg-[#111] border border-[#1f1f1f] p-8">
          {/* ── Login View ── */}
          {view === "login" && (
            <>
              <h2 className="text-sm font-medium tracking-widest text-white uppercase mb-6">Sign In</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input className={inputCls} type="email" placeholder="Admin Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                <div className="relative">
                  <Input className={`${inputCls} pr-10`} type={showPwd ? "text" : "password"} placeholder="Password" value={loginPwd} onChange={e => setLoginPwd(e.target.value)} required />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#D4AF37]">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {attemptsLeft !== null && (
                  <p className="text-amber-400 text-xs">{attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} remaining before lockout</p>
                )}
                <Button type="submit" className={btnCls} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                </Button>
              </form>
              <div className="mt-4 space-y-2 text-center">
                <button onClick={handleSendLoginOtp} className="text-xs text-[#D4AF37] hover:underline block w-full" disabled={loading}>
                  Login with OTP instead
                </button>
                <button onClick={() => setView("forgot")} className="text-xs text-[#555] hover:text-[#888] block w-full">
                  Forgot password?
                </button>
                <button onClick={() => setView("create")} className="text-xs text-[#555] hover:text-[#888] block w-full">
                  Create admin account
                </button>
              </div>
            </>
          )}

          {/* ── OTP Login View ── */}
          {view === "otp-login" && (
            <>
              <h2 className="text-sm font-medium tracking-widest text-white uppercase mb-2">Enter OTP</h2>
              <p className="text-xs text-[#555] mb-6">A 6-digit code was sent to the admin email.</p>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <Input className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`} placeholder="000000" maxLength={6} value={loginOtp} onChange={e => setLoginOtp(e.target.value.replace(/\D/g, ""))} required />
                <Button type="submit" className={btnCls} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify OTP"}
                </Button>
              </form>
              <div className="mt-4 text-center space-y-2">
                <button onClick={handleSendLoginOtp} className="text-xs text-[#D4AF37] hover:underline" disabled={loading}>Resend OTP</button>
                <br />
                <button onClick={() => setView("login")} className="text-xs text-[#555] hover:text-[#888]">← Back to login</button>
              </div>
            </>
          )}

          {/* ── Forgot Password ── */}
          {view === "forgot" && (
            <>
              <h2 className="text-sm font-medium tracking-widest text-white uppercase mb-2">Forgot Password</h2>
              <p className="text-xs text-[#555] mb-6">An OTP will be sent to the configured admin email.</p>
              <form onSubmit={handleForgotSend} className="space-y-4">
                <Button type="submit" className={btnCls} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP to Admin Email"}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button onClick={() => setView("login")} className="text-xs text-[#555] hover:text-[#888]">← Back to login</button>
              </div>
            </>
          )}

          {/* ── Forgot OTP + New Password ── */}
          {view === "forgot-otp" && (
            <>
              <h2 className="text-sm font-medium tracking-widest text-white uppercase mb-2">Reset Password</h2>
              <p className="text-xs text-[#555] mb-6">Enter the OTP sent to admin email and your new password.</p>
              <form onSubmit={handleResetPwd} className="space-y-4">
                <Input className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`} placeholder="000000" maxLength={6} value={forgotOtp} onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ""))} required />
                <div className="relative">
                  <Input className={`${inputCls} pr-10`} type={showPwd ? "text" : "password"} placeholder="New Password (min 8 chars)" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={8} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#D4AF37]">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button type="submit" className={btnCls} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button onClick={() => setView("login")} className="text-xs text-[#555] hover:text-[#888]">← Back to login</button>
              </div>
            </>
          )}

          {/* ── Create Admin ── */}
          {view === "create" && (
            <>
              <h2 className="text-sm font-medium tracking-widest text-white uppercase mb-2">Create Admin</h2>
              <p className="text-xs text-[#555] mb-6">Enter the master password to verify, then complete your details.</p>
              <form onSubmit={handleCreateSendOtp} className="space-y-4">
                <Input className={inputCls} placeholder="Full Name" value={createName} onChange={e => setCreateName(e.target.value)} required />
                <Input className={inputCls} type="email" placeholder="Admin Email" value={createEmail} onChange={e => setCreateEmail(e.target.value)} required />
                <div className="relative">
                  <Input className={`${inputCls} pr-10`} type={showPwd ? "text" : "password"} placeholder="Password (min 8 chars)" value={createPwd} onChange={e => setCreatePwd(e.target.value)} required minLength={8} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#D4AF37]">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Input className={inputCls} type="password" placeholder="Master Password" value={createMaster} onChange={e => setCreateMaster(e.target.value)} required />
                <Button type="submit" className={btnCls} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Send OTP"}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button onClick={() => setView("login")} className="text-xs text-[#555] hover:text-[#888]">← Back to login</button>
              </div>
            </>
          )}

          {/* ── Create Admin OTP ── */}
          {view === "create-otp" && (
            <>
              <h2 className="text-sm font-medium tracking-widest text-white uppercase mb-2">Verify OTP</h2>
              <p className="text-xs text-[#555] mb-6">Enter the 6-digit OTP sent to the admin email to complete account creation.</p>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <Input className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`} placeholder="000000" maxLength={6} value={createOtp} onChange={e => setCreateOtp(e.target.value.replace(/\D/g, ""))} required />
                <Button type="submit" className={btnCls} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Admin Account"}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button onClick={() => setView("create")} className="text-xs text-[#555] hover:text-[#888]">← Back</button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[#2a2a2a] text-xs mt-6 tracking-widest uppercase">Pearlis Fine Jewellery</p>
      </div>
    </div>
  );
}
