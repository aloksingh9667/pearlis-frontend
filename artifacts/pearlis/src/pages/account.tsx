import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Lock, MapPin, Package, LogOut, Loader2,
  Plus, Trash2, CheckCircle2, Eye, EyeOff, ChevronRight
} from "lucide-react";
import { apiUrl } from "@/lib/apiUrl";

type Tab = "profile" | "password" | "addresses" | "orders";

function useAddresses(token: string | null) {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAddresses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/users/addresses"), { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAddresses(await res.json());
    } finally { setLoading(false); }
  };

  return { addresses, loading, fetchAddresses, setAddresses };
}

export default function Account() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [tab, setTab] = useState<Tab>("profile");

  // Profile
  const [name, setName] = useState(user?.name || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Addresses
  const { addresses, loading: addrLoading, fetchAddresses, setAddresses } = useAddresses(token);
  const [addrTabLoaded, setAddrTabLoaded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addrForm, setAddrForm] = useState({ name: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "India", phone: "" });
  const [addrSaving, setAddrSaving] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleTabChange = (t: Tab) => {
    setTab(t);
    if (t === "addresses" && !addrTabLoaded) {
      fetchAddresses();
      setAddrTabLoaded(true);
    }
    if (t === "orders") setLocation("/orders");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setProfileLoading(true);
    try {
      const res = await fetch(apiUrl("/api/users/profile"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setProfileSaved(true);
        toast({ title: "Profile Updated", description: "Your name has been saved." });
        setTimeout(() => setProfileSaved(false), 3000);
      } else {
        const d = await res.json();
        toast({ title: "Error", description: d.error, variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Something went wrong.", variant: "destructive" }); }
    finally { setProfileLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Weak Password", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords don't match.", variant: "destructive" });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/change-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const d = await res.json();
      if (res.ok) {
        toast({ title: "Password Changed", description: "Your password has been updated." });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        toast({ title: "Error", description: d.error || "Failed to change password.", variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Something went wrong.", variant: "destructive" }); }
    finally { setPwLoading(false); }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddrSaving(true);
    try {
      const res = await fetch(apiUrl("/api/users/addresses"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(addrForm),
      });
      if (res.ok) {
        const newAddr = await res.json();
        setAddresses(prev => [...prev, newAddr]);
        setShowAddForm(false);
        setAddrForm({ name: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "India", phone: "" });
        toast({ title: "Address Saved" });
      } else {
        const d = await res.json();
        toast({ title: "Error", description: d.error, variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Something went wrong.", variant: "destructive" }); }
    finally { setAddrSaving(false); }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await fetch(apiUrl(`/api/users/addresses/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(prev => prev.filter(a => a.id !== id));
      toast({ title: "Address Removed" });
    } catch { toast({ title: "Error", description: "Could not delete address.", variant: "destructive" }); }
  };

  const handleSetDefault = async (id: number) => {
    setSettingDefaultId(id);
    try {
      const res = await fetch(apiUrl(`/api/users/addresses/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
        toast({ title: "Default address updated" });
      }
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSettingDefaultId(null); }
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
    toast({ title: "Signed Out" });
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "password", label: "Password", icon: Lock },
    { key: "addresses", label: "Addresses", icon: MapPin },
    { key: "orders", label: "My Orders", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 pb-24">
        <div className="container mx-auto px-4 max-w-5xl pt-24">

          {/* Header */}
          <div className="py-8 border-b border-border mb-10">
            <h1 className="font-serif text-3xl md:text-4xl">My Account</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Welcome back, <span className="text-foreground font-medium">{user.name}</span>
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-10">

            {/* Sidebar */}
            <aside className="md:w-56 flex-shrink-0">
              <nav className="space-y-1">
                {tabs.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest text-left transition-all ${
                      tab === key
                        ? "bg-accent text-accent-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                    {tab === key && <ChevronRight className="w-3 h-3 ml-auto" />}
                  </button>
                ))}
                <div className="pt-4 border-t border-border mt-4">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </nav>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">

                {/* ── PROFILE ── */}
                {tab === "profile" && (
                  <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <h2 className="font-serif text-2xl mb-6">Profile Details</h2>
                    <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-md">
                      <div className="space-y-2">
                        <Label className="uppercase tracking-widest text-xs text-muted-foreground">Full Name</Label>
                        <Input
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                          className="rounded-none h-12 border-border focus-visible:ring-accent"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="uppercase tracking-widest text-xs text-muted-foreground">Email Address</Label>
                        <Input
                          value={user.email}
                          disabled
                          className="rounded-none h-12 border-border bg-muted/30 text-muted-foreground"
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                      </div>
                      <Button type="submit" disabled={profileLoading} className="rounded-none uppercase tracking-widest h-11 px-8">
                        {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : profileSaved ? <><CheckCircle2 className="w-4 h-4 mr-2" />Saved</> : "Save Changes"}
                      </Button>
                    </form>
                  </motion.div>
                )}

                {/* ── PASSWORD ── */}
                {tab === "password" && (
                  <motion.div key="password" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <h2 className="font-serif text-2xl mb-6">Change Password</h2>
                    <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                      <div className="space-y-2">
                        <Label className="uppercase tracking-widest text-xs text-muted-foreground">Current Password</Label>
                        <div className="relative">
                          <Input
                            type={showPw ? "text" : "password"}
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            required
                            className="rounded-none h-12 border-border focus-visible:ring-accent pr-10"
                          />
                          <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="uppercase tracking-widest text-xs text-muted-foreground">New Password</Label>
                        <Input
                          type={showPw ? "text" : "password"}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          required
                          placeholder="Min. 8 characters"
                          className="rounded-none h-12 border-border focus-visible:ring-accent"
                        />
                        {newPassword.length > 0 && newPassword.length < 8 && (
                          <p className="text-xs text-destructive">At least 8 characters required</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="uppercase tracking-widest text-xs text-muted-foreground">Confirm New Password</Label>
                        <Input
                          type={showPw ? "text" : "password"}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          required
                          className="rounded-none h-12 border-border focus-visible:ring-accent"
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                          <p className="text-xs text-destructive">Passwords do not match</p>
                        )}
                      </div>
                      <Button type="submit" disabled={pwLoading} className="rounded-none uppercase tracking-widest h-11 px-8">
                        {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                      </Button>
                    </form>
                  </motion.div>
                )}

                {/* ── ADDRESSES ── */}
                {tab === "addresses" && (
                  <motion.div key="addresses" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-serif text-2xl">Saved Addresses</h2>
                      {!showAddForm && (
                        <Button onClick={() => setShowAddForm(true)} variant="outline" className="rounded-none uppercase tracking-widest text-xs h-9 px-4">
                          <Plus className="w-3 h-3 mr-2" /> Add New
                        </Button>
                      )}
                    </div>

                    {addrLoading ? (
                      <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
                    ) : (
                      <div className="space-y-4">
                        {addresses.length === 0 && !showAddForm && (
                          <div className="border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                            No saved addresses yet.
                          </div>
                        )}
                        {addresses.map(addr => (
                          <div key={addr.id} className={`border p-5 transition-colors ${addr.isDefault ? "border-accent/50 bg-accent/3" : "border-border"}`}>
                            <div className="flex justify-between items-start gap-4">
                              <div className="text-sm leading-relaxed">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">{addr.name}</p>
                                  {addr.isDefault && (
                                    <span className="text-[9px] uppercase tracking-widest text-accent border border-accent/50 px-1.5 py-0.5 font-semibold">Default</span>
                                  )}
                                </div>
                                <p className="text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                                <p className="text-muted-foreground">{addr.city}, {addr.state} {addr.postalCode}</p>
                                <p className="text-muted-foreground">{addr.country}</p>
                                {addr.phone && <p className="text-muted-foreground">{addr.phone}</p>}
                              </div>
                              <button onClick={() => handleDeleteAddress(addr.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {!addr.isDefault && (
                              <button
                                onClick={() => handleSetDefault(addr.id)}
                                disabled={settingDefaultId === addr.id}
                                className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors flex items-center gap-1.5 disabled:opacity-50"
                              >
                                {settingDefaultId === addr.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                Set as Default
                              </button>
                            )}
                          </div>
                        ))}

                        <AnimatePresence>
                          {showAddForm && (
                            <motion.form
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              onSubmit={handleSaveAddress}
                              className="border border-accent/40 p-6 space-y-4 overflow-hidden"
                            >
                              <h3 className="font-serif text-lg mb-2">New Address</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                  { id: "name", label: "Full Name", placeholder: "Rahul Sharma" },
                                  { id: "phone", label: "Phone", placeholder: "+91 98765 43210" },
                                  { id: "line1", label: "Address Line 1", placeholder: "House/Flat, Street" },
                                  { id: "line2", label: "Address Line 2 (Optional)", placeholder: "Area, Locality" },
                                  { id: "city", label: "City", placeholder: "Mumbai" },
                                  { id: "state", label: "State", placeholder: "Maharashtra" },
                                  { id: "postalCode", label: "PIN Code", placeholder: "400001" },
                                  { id: "country", label: "Country", placeholder: "India" },
                                ].map(({ id, label, placeholder }) => (
                                  <div key={id} className="space-y-1">
                                    <Label className="uppercase tracking-widest text-[10px] text-muted-foreground">{label}</Label>
                                    <Input
                                      value={(addrForm as any)[id]}
                                      onChange={e => setAddrForm(p => ({ ...p, [id]: e.target.value }))}
                                      required={id !== "line2"}
                                      placeholder={placeholder}
                                      className="rounded-none h-10 border-border text-sm"
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={addrSaving} className="rounded-none uppercase tracking-widest text-xs h-10 px-6">
                                  {addrSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Address"}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="rounded-none uppercase tracking-widest text-xs h-10 px-6">
                                  Cancel
                                </Button>
                              </div>
                            </motion.form>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
