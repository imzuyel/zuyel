"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Globe,
  Sparkles,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Calendar,
  Layers,
  Database,
  ExternalLink,
  User,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import GlobalSearchBar from "@/components/common/GlobalSearchBar";
import { toast } from "sonner";

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigate?: (tab: string) => void;
}

export default function Header({ onToggleSidebar, onNavigate }: HeaderProps) {
  const { language, setLanguage } = useLanguage();
  const { mode, toggleMode } = useTheme();
  const { currentUser, user, notifications, markNotificationRead, clearAllNotifications, logout } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  const activeUser = currentUser || user;
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowUserMenu(false);
    toast.info("লগআউট সম্পন্ন হচ্ছে...");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    logout();
    window.location.href = "/";
  };

  return (
    <header
      className={`sticky top-0 z-40 h-16 sm:h-20 transition-all duration-300 px-3 sm:px-6 lg:px-8 flex items-center justify-between border-b w-full max-w-full overflow-x-clip ${
        scrolled
          ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/80 dark:border-slate-800 shadow-sm"
          : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/60 dark:border-slate-850"
      }`}
    >
      {/* Left: Mobile Menu Toggle & Session Badge */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-cyan-400 border border-indigo-100 dark:border-slate-700 transition-all active:scale-95 lg:hidden flex items-center justify-center cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Academic Session Active Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>{language === "bn" ? "২০২৬ শিক্ষাবর্ষ (সক্রিয়)" : "Session 2026 (Active)"}</span>
        </div>
      </div>

      {/* Center: Global Search Bar (Ctrl+K) */}
      <div className="flex-1 max-w-xs sm:max-w-md lg:max-w-lg mx-2 sm:mx-6 min-w-0">
        <GlobalSearchBar />
      </div>

      {/* Right: Actions, Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === "bn" ? "en" : "bn")}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition text-xs font-bold"
          title="ভাষা পরিবর্তন (Change Language)"
          suppressHydrationWarning
        >
          <Globe className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400 shrink-0" />
          <span className="font-mono text-[11px]" suppressHydrationWarning>
            {language === "bn" ? "বাংলা" : "EN"}
          </span>
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          onClick={toggleMode}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition"
          title={mode === "dark" ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
          aria-label="Toggle Theme"
        >
          {mode === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition relative"
            title="বিজ্ঞপ্তি ও অ্যালার্ট"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-4 text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>বিজ্ঞপ্তি ও অ্যালার্ট ({unreadCount} নতুন)</span>
                </h4>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      clearAllNotifications();
                      toast.success("সব বিজ্ঞপ্তি পড়া হয়েছে");
                    }}
                    className="text-[10px] font-bold text-rose-500 hover:underline"
                  >
                    সব মুছুন
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto mt-2 space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
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
                      className={`p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left ${
                        notif.read ? "opacity-60" : "bg-indigo-50/30 dark:bg-indigo-950/20 border-l-2 border-indigo-500"
                      }`}
                    >
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{notif.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
            title="ইউজার প্রোফাইল ও সেটিংস"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-black text-xs flex items-center justify-center shrink-0">
              {activeUser?.nameBangla?.charAt(0) || activeUser?.role?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left min-w-0 max-w-[120px] lg:max-w-[150px]">
              <p className="text-[10px] text-indigo-500 dark:text-cyan-400 uppercase tracking-wider font-extrabold leading-none truncate">
                {activeUser?.role}
              </p>
              <p className="text-[11px] font-black text-slate-800 dark:text-white truncate max-w-[120px] lg:max-w-[150px]">
                {activeUser?.nameBangla || activeUser?.fullName || "ব্যবহারকারী"}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Profile Card Header */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-2">
                <p className="font-extrabold text-slate-900 dark:text-white truncate">
                  {activeUser?.nameBangla || activeUser?.fullName}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {activeUser?.email || "user@pgtsc.gov.bd"}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase">
                  রোল: {activeUser?.role}
                </span>
              </div>

              {/* Profile & Settings Navigation */}
              <div className="space-y-1 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    if (onNavigate) {
                      onNavigate("profile");
                    } else {
                      window.location.href = "/admin?tab=profile";
                    }
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-cyan-400 font-bold transition cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <span>আমার প্রোফাইল ও সেটিংস</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold transition"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-500" />
                    <span>পাবলিক ওয়েবসাইট দেখুন</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>

              {/* Institutional Session Security Notice */}
              <div className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>সেশন: জিরো-ট্রাস্ট সুরক্ষিত</span>
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                  Active
                </span>
              </div>

              {/* Logout Button */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>লগআউট করুন (Log Out)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
