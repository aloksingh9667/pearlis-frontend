import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { apiUrl } from "@/lib/apiUrl";
import {
  LayoutDashboard, ShoppingBag, Package, Users, FileText, Tag, LogOut,
  Settings, FileEdit, MessageSquare, Menu, X, Video, Layers, Star, Bell,
  Mail, BarChart2, ChevronLeft, ChevronRight, ExternalLink, RotateCcw, GalleryThumbnails,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Store",
    items: [
      { name: "Dashboard",    href: "/admin",               icon: LayoutDashboard },
      { name: "Reports",      href: "/admin/reports",       icon: BarChart2 },
      { name: "Products",     href: "/admin/products",      icon: ShoppingBag },
      { name: "Categories",   href: "/admin/categories",    icon: Layers },
      { name: "Orders",       href: "/admin/orders",        icon: Package },
      { name: "Returns",      href: "/admin/returns",       icon: RotateCcw },
      { name: "Coupons",      href: "/admin/coupons",       icon: Tag },
      { name: "Reviews",      href: "/admin/reviews",       icon: Star },
      { name: "Stock Alerts", href: "/admin/stock-alerts",  icon: Bell },
    ],
  },
  {
    label: "Content",
    items: [
      { name: "Journal",      href: "/admin/blogs",         icon: FileText },
      { name: "Gallery",      href: "/admin/gallery",       icon: GalleryThumbnails },
      { name: "Videos",       href: "/admin/videos",        icon: Video },
      { name: "Page Content", href: "/admin/page-content",  icon: FileEdit },
      { name: "Messages",     href: "/admin/messages",      icon: MessageSquare },
    ],
  },
  {
    label: "People",
    items: [
      { name: "Users",        href: "/admin/users",         icon: Users },
      { name: "Newsletter",   href: "/admin/newsletter",    icon: Mail },
    ],
  },
  {
    label: "Config",
    items: [
      { name: "Site Settings", href: "/admin/settings",    icon: Settings },
    ],
  },
];

function useKeepAlive() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const res = await fetch(apiUrl("/api/settings/keepAlive"));
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const cfg = data?.value ?? data;
        if (!cfg?.enabled || !cfg?.pingUrl) return;
        const ms = Math.max(1, cfg.intervalMinutes ?? 14) * 60 * 1000;
        const ping = () => { fetch(cfg.pingUrl, { mode: "no-cors" }).catch(() => {}); };
        ping();
        intervalRef.current = setInterval(ping, ms);
      } catch {}
    }
    init();
    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}

function useOrderBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(apiUrl("/api/orders?status=pending&limit=1&page=1"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setCount(Number(data.total || 0));
      } catch {}
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);
  return count;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  useKeepAlive();
  const pendingOrders = useOrderBadge();
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("admin-sidebar-collapsed") === "true"; } catch { return false; }
  });

  const toggleCollapse = () => {
    setCollapsed(v => {
      const next = !v;
      try { localStorage.setItem("admin-sidebar-collapsed", String(next)); } catch {}
      return next;
    });
  };

  const handleLogout = () => { logout(); window.location.href = "/"; };

  const sidebarW = collapsed ? "w-[68px]" : "w-64";
  const contentML = collapsed ? "md:ml-[68px]" : "md:ml-64";

  const NavItem = ({ item, onClick }: { item: (typeof NAV_GROUPS)[0]["items"][0]; onClick?: () => void }) => {
    const isActive = item.href === "/admin" ? location === "/admin" : location.startsWith(item.href);
    const badge = item.href === "/admin/orders" && pendingOrders > 0 ? pendingOrders : 0;
    return (
      <Link href={item.href} onClick={onClick}>
        <div
          title={collapsed ? `${item.name}${badge ? ` (${badge} pending)` : ""}` : undefined}
          className={`group relative flex items-center gap-3 py-2.5 rounded-sm transition-all cursor-pointer
            ${collapsed ? "justify-center px-0" : "px-4"}
            ${isActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
        >
          <div className="relative flex-shrink-0">
            <item.icon className="w-[18px] h-[18px]" />
            {badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </div>
          {!collapsed && (
            <span className="text-sm leading-none flex-1 flex items-center justify-between">
              {item.name}
              {badge > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </span>
          )}

          {/* Tooltip when collapsed */}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 text-xs font-medium bg-popover text-popover-foreground border border-border rounded-sm shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {item.name}{badge > 0 ? ` — ${badge} pending` : ""}
            </span>
          )}
        </div>
      </Link>
    );
  };

  const SidebarContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`border-b border-border flex-shrink-0 transition-all ${collapsed ? "px-2 py-4" : "px-6 py-5"}`}>
        <Link href="/" onClick={onNav}>
          {collapsed ? (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border border-sidebar-primary/60 flex items-center justify-center">
                <span className="font-serif text-sidebar-primary text-sm font-bold tracking-wider">P</span>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-2xl tracking-widest text-sidebar-primary leading-none">PEARLIS</h1>
              <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest mt-1">Admin Portal</p>
            </>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto py-4 space-y-4 ${collapsed ? "px-2" : "px-3"}`}>
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/35 px-4 mb-1.5">{group.label}</p>
            )}
            {collapsed && (
              <div className="w-8 h-px bg-sidebar-foreground/10 mx-auto mb-2" />
            )}
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavItem key={item.name} item={item} onClick={onNav} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User & Footer */}
      <div className={`border-t border-border flex-shrink-0 py-3 ${collapsed ? "px-2" : "px-3"}`}>
        {/* User info */}
        <div className={`flex items-center gap-3 mb-2 ${collapsed ? "justify-center px-0 py-2" : "px-4 py-2"}`}>
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 border border-sidebar-primary/30 flex items-center justify-center text-xs font-bold text-sidebar-primary flex-shrink-0 uppercase">
            {user?.name?.charAt(0) || "A"}
          </div>
          {!collapsed && (
            <div className="truncate min-w-0">
              <p className="font-medium truncate text-sm text-sidebar-foreground leading-none">{user?.name}</p>
              <p className="text-[11px] text-sidebar-foreground/50 truncate mt-0.5">{user?.email}</p>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          title={collapsed ? "Sign Out" : undefined}
          className={`group relative flex items-center gap-3 py-2 w-full rounded-sm transition-colors text-destructive hover:bg-destructive/10
            ${collapsed ? "justify-center px-0" : "px-4"}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 text-xs font-medium bg-popover text-popover-foreground border border-border rounded-sm shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Sign Out
            </span>
          )}
        </button>

        {/* Back to site */}
        <Link href="/" onClick={onNav}>
          <div
            title={collapsed ? "Back to Site" : undefined}
            className={`group relative flex items-center gap-2.5 py-2 rounded-sm transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent
              ${collapsed ? "justify-center px-0" : "px-4"}`}
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Back to Site</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 text-xs font-medium bg-popover text-popover-foreground border border-border rounded-sm shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Back to Site
              </span>
            )}
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div
        className={`${sidebarW} bg-sidebar border-r border-border flex-col hidden md:flex fixed h-full z-20 overflow-hidden transition-[width] duration-200`}
      >
        <SidebarContent />

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="absolute bottom-[140px] -right-3 w-6 h-6 rounded-full bg-sidebar border border-border flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors shadow-sm z-30"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-border z-50 overflow-hidden">
            <SidebarContent onNav={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 ${contentML} flex flex-col min-h-screen transition-[margin] duration-200`}>
        {/* Mobile Header */}
        <div className="md:hidden px-4 py-3 border-b border-border flex justify-between items-center bg-sidebar sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(v => !v)} className="p-1.5 text-sidebar-foreground rounded-sm hover:bg-sidebar-accent transition-colors">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="font-serif text-xl tracking-widest text-sidebar-primary">PEARLIS</h1>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40">Admin</span>
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
