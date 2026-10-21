"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Sparkles,
  Award,
  Lock,
  Sun,
  Moon,
  Compass,
  Layers,
  Bell,
  GraduationCap,
  Users,
  Image as ImageIcon,
  FileText,
  Phone,
  School,
  ChevronDown,
  ExternalLink,
  BookOpen,
  Sliders,
  MoreHorizontal,
  ShieldCheck,
  User,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

// Primary Navigation Links (Displayed directly on Desktop)
const PRIMARY_NAV_LINKS = [
  { href: "/", label: "হোম", icon: School },
  { href: "/learning-library", label: "শিক্ষা হাব", icon: BookOpen },
  { href: "/ask-ai", label: "Ask AI", icon: Sparkles },
  { href: "/notices", label: "নোটিশ", icon: Bell },
  { href: "/results", label: "ফলাফল", icon: GraduationCap },
];

// Secondary Navigation Links (Grouped under "আরও ▾" More Dropdown on Desktop)
const MORE_NAV_LINKS = [
  { href: "/academic", label: "একাডেমিক হাব", icon: Layers },
  { href: "/faculty", label: "শিক্ষকবৃন্দ", icon: Users },
  { href: "/gallery", label: "গ্যালারি", icon: ImageIcon },
  { href: "/downloads", label: "ডাউনলোড", icon: FileText },
  { href: "/contact", label: "যোগাযোগ", icon: Phone },
];

// All Nav Links for Mobile Drawer
const ALL_NAV_LINKS = [...PRIMARY_NAV_LINKS, ...MORE_NAV_LINKS];

export default function PublicHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { isLoggedIn, currentUser, logout, openLoginModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(event.target as Node)
      ) {
        setMoreDropdownOpen(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  const isMoreLinkActive = MORE_NAV_LINKS.some((link) => pathname === link.href);

  return (
    <header
      className={`sticky top-0 z-50 w-full max-w-full overflow-visible transition-all duration-300 border-b ${
        scrolled
          ? "bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-slate-200/80 dark:border-slate-800 shadow-[0_4px_30px_rgba(99,102,241,0.06)] dark:shadow-[0_4px_30px_rgba(6,182,212,0.08)]"
          : "bg-white/75 dark:bg-slate-950/75 backdrop-blur-md border-slate-200/50 dark:border-slate-900/50 shadow-xs"
      }`}
    >
      {/* Top micro-bar for institutional accreditation */}
      <div className="bg-slate-950 text-slate-300 text-[11px] py-1.5 px-4 border-b border-slate-800 hidden sm:block w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold min-w-0">
            <span className="text-cyan-400 font-extrabold uppercase tracking-wide shrink-0">
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
            </span>
            <span className="text-slate-800 dark:text-slate-200 shrink-0">|</span>
            <span className="text-slate-300 truncate">কারিগরি শিক্ষা অধিদপ্তর (DTE)</span>
            <span className="text-slate-800 dark:text-slate-200 shrink-0 hidden md:inline">|</span>
            <span className="hidden md:inline shrink-0">
              EIIN: <strong className="text-white font-mono font-black">132244</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold shrink-0">
            <span className="text-slate-400 hidden lg:inline">জরুরি হেল্পলাইন:</span>
            <span className="font-mono text-cyan-300 font-black hidden sm:inline">02589941021</span>
            <span className="text-slate-800 dark:text-slate-200 hidden sm:inline">|</span>
            <Link
              href={isLoggedIn && currentUser.role !== "student" ? "/admin" : "/login?role=admin"}
              className="text-indigo-400 hover:text-indigo-300 font-black flex items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isLoggedIn && currentUser.role !== "student" ? "ERP ড্যাশবোর্ড" : "ERP লগইন"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20 gap-3 min-w-0">
          
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 min-w-0 max-w-[280px] sm:max-w-none">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-500 p-0.5 flex items-center justify-center text-white text-base sm:text-xl font-black shadow-[0_0_25px_rgba(6,182,212,0.35)] group-hover:rotate-6 transition-transform shrink-0">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
                <span className="text-[10px] sm:text-xs text-cyan-400 font-black">PTSC</span>
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[10px] font-black text-cyan-600 dark:text-cyan-400 tracking-widest uppercase leading-none mb-0.5 truncate">
                Govt. Technical School & College
              </span>
              <span className="text-xs sm:text-sm lg:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors truncate">
                পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links - Clean & Non-overflowing Layout */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 bg-slate-100/60 dark:bg-slate-900/50 p-1 xl:p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-inner shrink-0 relative">
            {PRIMARY_NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2 xl:px-3 py-1.5 rounded-xl text-[11px] xl:text-xs font-black tracking-tight transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/40"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-300" : "text-indigo-500 dark:text-cyan-400"}`} />
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] shrink-0" />
                  )}
                </Link>
              );
            })}

            {/* "আরও ▾" More Options Dropdown Menu */}
            <div className="relative" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                onMouseEnter={() => setMoreDropdownOpen(true)}
                className={`px-2 xl:px-3 py-1.5 rounded-xl text-[11px] xl:text-xs font-black tracking-tight transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  isMoreLinkActive || moreDropdownOpen
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800"
                }`}
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-indigo-400 dark:text-cyan-400" />
                <span>আরও</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    moreDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Popover */}
              {moreDropdownOpen && (
                <div
                  onMouseLeave={() => setMoreDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-52 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1 mb-1">
                    অতিরিক্ত মেনু অপশন
                  </div>
                  <div className="space-y-1">
                    {MORE_NAV_LINKS.map((link) => {
                      const isActive = pathname === link.href;
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMoreDropdownOpen(false)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-cyan-300"
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-300" : "text-indigo-500 dark:text-cyan-400"}`} />
                          <span>{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Header Action Buttons & Theme Switcher */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              )}
            </button>

            {/* Auth State Indicator / Profile Dropdown & Login */}
            {isLoggedIn ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-2 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
                  title="আমার অ্যাকাউন্ট ও প্রোফাইল"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    {currentUser?.nameBangla?.charAt(0) || currentUser?.fullName?.charAt(0) || "U"}
                  </div>
                  <span className="hidden xl:inline max-w-[100px] truncate text-slate-800 dark:text-white">
                    {currentUser?.nameBangla || currentUser?.fullName || "প্রোফাইল"}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* User Summary Header */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-2">
                      <p className="font-extrabold text-slate-900 dark:text-white truncate">
                        {currentUser?.nameBangla || currentUser?.fullName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 text-[10px] font-bold">
                          {currentUser?.role === "student"
                            ? `শিক্ষার্থী • রোল ${currentUser?.roll || "১০১"}`
                            : currentUser?.role === "teacher"
                            ? "শিক্ষক পরিষদ"
                            : currentUser?.role === "principal"
                            ? "অধ্যক্ষ"
                            : "প্রশাসনিক স্টাফ"}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-1 mb-2">
                      <Link
                        href={currentUser?.role === "student" ? "/student/profile" : "/admin?tab=profile"}
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-cyan-400 font-bold transition"
                      >
                        <span className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          <span>আমার প্রোফাইল ও তথ্য</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>

                      {currentUser?.role === "student" ? (
                        <Link
                          href="/results"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold transition"
                        >
                          <span className="flex items-center gap-2">
                            <GraduationCap className="w-3.5 h-3.5 text-teal-500" />
                            <span>আমার ফলাফল ও গ্রেডশিট</span>
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                      ) : (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold transition"
                        >
                          <span className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-teal-500" />
                            <span>ERP অ্যাডমিন ড্যাশবোর্ড</span>
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                      )}
                    </div>

                    {/* Logout Button */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>লগআউট (Log Out)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-700 transition"
              >
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>স্টুডেন্ট লগইন</span>
              </Link>
            )}

            {/* Document Verification CTA */}
            <Link
              href="/verify"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-700 transition"
              title="ডিজিটাল সনদ ও প্রত্যয়নপত্র যাচাই"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span>সনদ যাচাই</span>
            </Link>

            {/* Live Quiz CTA */}
            <Link
              href="/quiz/join"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition-all duration-300 transform hover:scale-[1.03] active:scale-95 border border-emerald-400/20 shrink-0"
            >
              <Award className="w-4 h-4" />
              <span>লাইভ কুইজ</span>
            </Link>

            {/* ERP Login Button */}
            <Link
              href={isLoggedIn && currentUser?.role !== "student" ? "/admin" : "/login?role=admin"}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-95 shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLoggedIn && currentUser?.role !== "student" ? "ERP প্যানেল" : "ERP লগইন"}</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center gap-2 lg:hidden shrink-0">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-2 gap-2 pt-2">
            {ALL_NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-3 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-indigo-500 dark:text-cyan-400" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            {isLoggedIn && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center">
                    {currentUser?.nameBangla?.charAt(0) || currentUser?.fullName?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {currentUser?.nameBangla || currentUser?.fullName}
                    </div>
                    <div className="text-[10px] text-indigo-500 dark:text-cyan-400 font-bold">
                      {currentUser?.role === "student" ? `শিক্ষার্থী • রোল ${currentUser?.roll || "১০১"}` : "স্টাফ / শিক্ষক"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={currentUser?.role === "student" ? "/student/profile" : "/admin?tab=profile"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 text-center text-xs font-bold rounded-xl bg-indigo-600 text-white"
                  >
                    আমার প্রোফাইল
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="py-2 text-center text-xs font-bold rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20"
                  >
                    লগআউট
                  </button>
                </div>
              </div>
            )}

            <Link
              href="/quiz/join"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Award className="w-4 h-4" />
              <span>লাইভ কুইজে যোগ দিন</span>
            </Link>
            <Link
              href={isLoggedIn && currentUser.role !== "student" ? "/admin" : "/login?role=admin"}
              className="w-full py-3 rounded-xl bg-slate-900 dark:bg-slate-900/90 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700/80 active:scale-95 transition-all"
            >
              <Lock className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>{isLoggedIn && currentUser.role !== "student" ? "ইনস্টিটিউশনাল ERP ব্যাকএন্ড" : "প্রশাসনিক ERP লগইন"}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
