import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Credentials {
  instagramUsername: string;
  instagramPassword: string;
}

interface LicenseStatus {
  hasLicense: boolean;
  isValid: boolean;
  license?: {
    status: string;
    expiresAt: string | null;
  };
}

export default function Sidebar() {
  const [location] = useLocation();
  const { logout, loading: authLoading, user } = useAuth();
  const { toast } = useToast();

  const { data: credentials } = useQuery<Credentials>({
    queryKey: ['/api/credentials'],
  });

  const { data: licenseStatus } = useQuery<LicenseStatus>({
    queryKey: ['/api/license/status'],
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out.",
        variant: "destructive",
      });
    }
  };

  const igNavItems = [
    { path: "/instagram", label: "IG Dashboard", icon: "fas fa-chart-pie" },
    { path: "/configuration", label: "IG Setup", icon: "fas fa-user-gear" },
    { path: "/reels", label: "Reel Insights", icon: "fas fa-film" },
    { path: "/advanced-analytics", label: "Growth Engine", icon: "fas fa-bolt" },
    { path: "/followers", label: "Target List", icon: "fas fa-users-viewfinder" },
    { path: "/tagging", label: "AI Tagging", icon: "fas fa-brain" },
    { path: "/run-history", label: "Logs", icon: "fas fa-list-check" },
  ];

  const outreachNavItems = [
    { path: "/outreach/scraper", label: "User Scraper", icon: "fas fa-magnifying-glass-plus" },
    { path: "/outreach/followers", label: "Scraped Leads", icon: "fas fa-id-card-clip" },
    { path: "/outreach/campaigns", label: "DM Senders", icon: "fas fa-envelope-open-text" },
    { path: "/outreach/accounts", label: "Sender Nodes", icon: "fas fa-network-wired" },
    { path: "/outreach/proxies", label: "Proxy Hub", icon: "fas fa-shield-halved" },
  ];

  const isConnected = credentials?.instagramUsername && credentials.instagramUsername.length > 0;

  const licenseStatusColor = licenseStatus?.isValid
    ? "text-green-500"
    : licenseStatus?.hasLicense
    ? "text-yellow-500"
    : "text-red-500";

  const licenseStatusText = licenseStatus?.isValid
    ? "Active"
    : licenseStatus?.license?.status === "pending_activation"
    ? "Pending Activation"
    : licenseStatus?.hasLicense
    ? "Inactive"
    : "No License";

  function NavItem({ path, label, icon }: { path: string; label: string; icon: string }) {
    const isActive = path === "/" ? location === "/" : location.startsWith(path);
    return (
      <Link
        href={path}
        className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
          isActive
            ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/10 backdrop-blur-sm"
            : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
        }`}
      >
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-white/10' : 'bg-slate-800/40 group-hover:bg-indigo-500/10'}`}>
          <i className={`${icon} text-xs ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
        </div>
        <span className="text-sm tracking-tight">{label}</span>
      </Link>
    );
  }

  return (
    <div className="w-64 h-screen bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/60 flex flex-col shadow-2xl overflow-hidden shrink-0 relative z-20" data-testid="sidebar">
      <div className="p-6 border-b border-slate-800/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-yellow-500/30">
            <span className="text-yellow-500 font-black text-xl tracking-tighter shadow-yellow-500/50 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]">&gt;_</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tight text-white leading-none">SOCIAL SUITE</h1>
            <span className="text-[10px] uppercase tracking-widest font-black text-yellow-500/80 mt-0.5">RantiDevs <span className="text-slate-500">PRO</span></span>
          </div>
        </div>
      </div>

      {user && (
        <div className="px-6 py-4 shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/30">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
              <i className="fas fa-user-shield text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest">Operator</p>
              <p className="text-sm font-bold text-slate-100 truncate">{user.username}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-4 py-2 space-y-8 overflow-y-auto custom-scrollbar min-h-0">
        {/* Global Overview */}
        <div>
          <div className="px-3 mb-2 flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-indigo-500" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">General</p>
          </div>
          <NavItem path="/dashboard" label="Suite Overview" icon="fas fa-house-chimney" />
        </div>

        {/* IG Analytics */}
        <div>
          <div className="px-3 mb-2 flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-pink-500" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Instagram Insights</p>
          </div>
          <div className="space-y-1">
            {igNavItems.map(item => <NavItem key={item.path} {...item} />)}
          </div>
        </div>

        {/* Outreach */}
        <div>
          <div className="px-3 mb-2 flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-emerald-500" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Mass Outreach</p>
          </div>
          <div className="space-y-1">
            {outreachNavItems.map(item => <NavItem key={item.path} {...item} />)}
          </div>
        </div>

        {/* Twitter */}
        <div>
          <div className="px-3 mb-2 flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-cyan-500" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Twitter X</p>
          </div>
          <div className="space-y-1">
            <NavItem path="/twitter" label="X Scraper Engine" icon="fab fa-twitter" />
          </div>
        </div>
      </nav>

      <div className="p-4 mt-auto space-y-3 border-t border-slate-800/40 bg-slate-900/20 shrink-0">
        <Link href="/purchase-crypto">
          <div className="group flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 cursor-pointer border bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm bg-orange-500/10 text-orange-500">
              <i className="fab fa-bitcoin text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200">Buy License</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">Get Started</p>
            </div>
            <i className="fas fa-arrow-right text-[10px] text-slate-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        <Link href="/activate">
          <div className="group flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 cursor-pointer border bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm bg-blue-500/10 text-blue-500">
              <i className="fas fa-key text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200">Activate Key</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Have a key?</p>
            </div>
            <i className="fas fa-arrow-right text-[10px] text-slate-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href="/">
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-yellow-600 transition-all duration-200 border border-slate-800 hover:border-yellow-500 group"
          >
            <i className="fas fa-arrow-left text-sm transition-transform group-hover:-translate-x-1" />
            <span className="text-sm">Back to Home</span>
          </button>
        </Link>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800/40 shrink-0">
        <div className="flex flex-col items-center">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Built by</p>
          <p className="text-[11px] font-black text-yellow-500/80 tracking-tighter mt-0.5">RANTIDEVS</p>
          <div className="mt-2 flex gap-1.5 opacity-30">
            <div className="w-1 h-1 rounded-full bg-slate-600" />
            <div className="w-1 h-1 rounded-full bg-slate-600" />
            <div className="w-1 h-1 rounded-full bg-slate-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
