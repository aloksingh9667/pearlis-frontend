import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, ShoppingBag, Package, Users, FileText, Tag, LogOut,
  Settings, FileEdit, MessageSquare, Menu, X, ChevronDown, Video, Layers, Star, Bell, Mail
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Store",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Products", href: "/admin/products", icon: ShoppingBag },
      { name: "Categories", href: "/admin/categories", icon: Layers },
      { name: "Orders", href: "/admin/orders", icon: Package },
      { name: "Coupons", href: "/admin/coupons", icon: Tag },
      { name: "Reviews", href: "/admin/reviews", icon: Star },
      { name: "Stock Alerts", href: "/admin/stock-alerts", icon: Bell },
    ],
  },
  {
    label: "Content",
    items: [
      { name: "Journal", href: "/admin/blogs", icon: FileText },
      { name: "Videos", href: "/admin/videos", icon: Video },
      { name: "Page Content", href: "/admin/page-content", icon: FileEdit },
      { name: "Messages", href: "/admin/messages", icon: MessageSquare },
    ],
  },
  {
    label: "People",
    items: [
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Newsletter", href: "/admin/newsletter", icon: Mail },
    ],
  },
  {
    label: "Configuration",
    items: [
      { name: "Site Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <h1 className="font-serif text-2xl tracking-widest text-sidebar-primary">PEARLIS</h1>
        </Link>
        <p className="text-xs text-sidebar-foreground/50 uppercase tracking-widest mt-1">Admin Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-5">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-xs uppercase tracking-widest text-sidebar-foreground/40 px-4 mb-2">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = item.href === "/admin" ? location === "/admin" : location.startsWith(item.href);
                return (
                  <Link key={item.name} href={item.href} onClick={() => setMobileOpen(false)}>
                    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-sm transition-colors cursor-pointer ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}>
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3 text-sm text-sidebar-foreground mb-1">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
            {user?.name?.charAt(0) || "A"}
          </div>
          <div className="truncate min-w-0">
            <p className="font-medium truncate text-sm">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-sm text-destructive hover:bg-destructive/10 rounded-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
        <Link href="/">
          <div className="flex items-center gap-3 px-4 py-2.5 w-full text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-sm transition-colors mt-0.5">
            <span>← Back to Site</span>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="w-64 bg-sidebar border-r border-border flex-col hidden md:flex fixed h-full z-10 overflow-hidden">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-border z-50 overflow-hidden">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-border flex justify-between items-center bg-sidebar sticky top-0 z-20">
          <h1 className="font-serif text-xl tracking-widest text-sidebar-primary">PEARLIS ADMIN</h1>
          <button onClick={() => setMobileOpen(v => !v)} className="p-2 text-sidebar-foreground">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <main className="p-5 md:p-8 flex-1 bg-muted/10">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.22em] uppercase text-muted-foreground hover:text-accent transition-colors group mb-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
            Back
          </button>
          {children}
        </main>
      </div>
    </div>
  );
}
