"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  Bell,
  Search,
  Sun,
  Moon,
  Globe,
  UserCheck,
  ShieldCheck,
  Settings,
  Sparkles,
  Layers,
  LogOut,
  Database,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Wrench,
  Loader2,
  ChevronUp,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useAuth, UserRole } from "@/context/AuthContext";
import { InstitutionTechnicalSealSVG } from "@/components/ui/animated-svgs";
import { toast } from "sonner";

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigate: (tab: string) => void;
}

export default function Header({ onToggleSidebar, onNavigate }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { mode, toggleMode } = useTheme();
  const { user, switchRole, notifications, markNotificationRead, clearAllNotifications } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const roles: { role: UserRole; label: string; badgeColor: string }[] = [
    { role: "admin", label: "সিস্টেম অ্যাডমিন (Admin)", badgeColor: "bg-purple-600 text-white shadow-purple-950/40" },
    { role: "principal", label: "অধ্যক্ষ (Principal)", badgeColor: "bg-indigo-600 text-white shadow-indigo-950/40" },
    { role: "teacher", label: "ইন্সট্রাক্টর (Teacher)", badgeColor: "bg-teal-600 text-white shadow-teal-950/40" },
    { role: "student", label: "শিক্ষার্থী (Student)", badgeColor: "bg-cyan-600 text-white shadow-cyan-950/40" },
    { role: "guardian", label: "অভিভাবক (Guardian)", badgeColor: "bg-amber-600 text-slate-950 shadow-amber-950/40" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 h-16 sm:h-20 transition-all duration-300 px-4 sm:px-8 flex items-center justify-between border-b w-full max-w-full overflow-x-hidden min-w-0 ${
        scrolled
          ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-slate-200/80 dark:border-slate-800 shadow-[0_4px_30px_rgba(99,102,241,0.06)] dark:shadow-[0_4px_30px_rgba(6,182,212,0.08)]"
          : "bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-slate-200/50 dark:border-slate-900/50 shadow-xs"
      }`}
    >
      {/* Left: Mobile Menu & Institution Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-indigo-600 dark:text-cyan-400 border border-indigo-100 dark:border-slate-800 transition-all active:scale-95 lg:hidden flex items-center justify-center cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-500 p-0.5 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0 transform hover:rotate-6 transition-transform">
            <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
              <span className="font-black text-[10px] sm:text-xs tracking-tighter text-cyan-400">PTSC</span>
            </div>
          </div>

          <div className="hidden sm:block">
            <h1 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight tracking-tight">
              পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                EIIN: ১৩২২৪৪ • স্থাপিত ১৯৯৯ • BTEB Approved
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Action Icons - Premium Glow Effects & Fluid Transitions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Quiz Admin Shortcut */}
        <button
          onClick={() => onNavigate("quiz_admin")}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-indigo-500/10 hover:from-rose-500/20 hover:to-indigo-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-black shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer"
          title="লাইভ কুইজ পোর্টাল"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <span>লাইভ কুইজ পোর্টাল</span>
        </button>

        {/* Dynamic Global Year Settings Selector */}
        <button
          onClick={() => onNavigate("global_academic_hub")}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-all duration-300 hover:scale-[1.03] active:scale-95 text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          title="গ্লোবাল সেটিংস ও বিষয় ম্যাপিং হাব"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-spin" style={{ animationDuration: "12s" }} />
          <span>বিষয় ম্যাপিং Hub</span>
        </button>

        {/* Database SQL Console Shortcut */}
        <button
          onClick={() => onNavigate("mysql_workbench")}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-all duration-300 hover:scale-[1.03] active:scale-95 text-xs font-mono font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)]"
          title="ডাটাবেজ ও SQL কনসোল"
        >
          <span className="p-1 rounded-lg bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]">
            <Database className="w-3.5 h-3.5" />
          </span>
          <span className="text-[11px] font-black">SQL Console</span>
        </button>

        {/* English / Bengali Language Toggle */}
        <button
          onClick={() => setLanguage(language === "bn" ? "en" : "bn")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 transition-all duration-300 hover:scale-[1.03] active:scale-95 text-xs font-bold shadow-[0_0_15px_rgba(20,184,166,0.15)]"
          title="ভাষা পরিবর্তন (BN/EN)"
          suppressHydrationWarning
        >
          <Globe className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400 shrink-0" />
          <span className="font-black text-[11px]" suppressHydrationWarning>{language === "bn" ? "বাং" : "EN"}</span>
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          onClick={toggleMode}
          className="p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.15)] flex items-center justify-center cursor-pointer"
          title={mode === "dark" ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
        >
          {mode === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: "25s" }} />
          ) : (
            <Moon className="w-4 h-4 text-purple-600" />
          )}
        </button>

        {/* Real-time Notifications Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRoleMenu(false);
            }}
            className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 transition-all duration-300 hover:scale-[1.03] active:scale-95 relative shadow-[0_0_15px_rgba(244,63,94,0.15)] flex items-center justify-center cursor-pointer"
            title="নোটিফিকেশন ও অ্যালার্ট"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-rose-600 text-white text-[9px] font-mono font-black flex items-center justify-center animate-bounce shadow-lg shadow-rose-950/80 ring-1 ring-white dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 text-xs z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  নোটিফিকেশন ও অ্যালার্ট ({unreadCount} নতুন)
                </h4>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      clearAllNotifications();
                      toast.success("সব নোটিফিকেশন পড়া হয়েছে হিসেবে চিহ্নিত করা হলো");
                    }}
                    className="text-[10px] font-bold text-rose-500 hover:underline"
                  >
                    সব মুছে ফেলুন
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto mt-2 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/80">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">কোনো নতুন বিজ্ঞপ্তি নেই</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        setShowNotifications(false);
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800/50 transition-colors text-left flex items-start gap-2.5 ${
                        notif.read ? "opacity-60" : "bg-indigo-50/20 dark:bg-indigo-950/10 border-l-2 border-indigo-500"
                      }`}
                    >
                      <span className="text-base shrink-0">{(notif as any).type === "alert" ? "⚠️" : "📢"}</span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{notif.title}</p>
                        <p className="text-[10px] text-slate-400 font-medium line-clamp-2">{notif.message}</p>
                        <span className="text-[8px] text-slate-400 block font-mono">{notif.timestamp || (notif as any).time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Card & Role Switching Portal */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 px-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 hover:from-indigo-500/15 text-slate-800 dark:text-slate-200 border border-indigo-500/20 hover:border-indigo-500/30 text-xs font-bold transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer relative shadow-[0_0_15px_rgba(99,102,241,0.06)]"
            title="প্যানেল ও রোল পরিবর্তন"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-indigo-600/25 shrink-0">
              {user.role.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left min-w-0">
              <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider font-extrabold leading-none">
                {user.role} Portal
              </p>
              <p className="text-[11px] font-black text-slate-900 dark:text-white truncate max-w-[80px]">
                {user.name.split(" ")[0]}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showRoleMenu ? "rotate-180" : ""}`} />
          </button>

          {/* Role Switching Panel */}
          {showRoleMenu && (
            <div className="absolute right-0 mt-3 w-72 sm:w-80 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 text-xs z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <p className="font-extrabold text-slate-800 dark:text-white">অ্যাক্টিভ রোল ও পরিচয় পরিবর্তন</p>
                <p className="text-[10px] text-slate-400 mt-0.5">অন্যান্য প্যানেলে লগইন করতে নিচে যেকোনো রোল নির্বাচন করুন।</p>
              </div>

              <div className="space-y-1.5 mt-2.5">
                {roles.map((item) => {
                  const isActive = user.role === item.role;
                  return (
                    <button
                      key={item.role}
                      onClick={() => {
                        switchRole(item.role);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left font-bold transition-all relative ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-lg border border-indigo-500/40"
                          : "bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-transparent"
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
