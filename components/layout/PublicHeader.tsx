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
import StudentLoginModal from "@/components/auth/StudentLoginModal";
import {
  getActiveStudentAccount,
  logoutStudentAccount,
  StudentAuthAccount,
} from "@/lib/studentIntelligenceStore";
import { Settings } from "lucide-react";

// Primary Navigation Links (Displayed directly on Desktop)
const PRIMARY_NAV_LINKS = [
  { href: "/", label: "হোম", icon: School },
  { href: "/learning", label: "শিক্ষা হাব", icon: BookOpen },
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

  // Strict Student-only Authentication State (NEVER displays backend admin/teacher roles)
  const [activeStudent, setActiveStudent] = useState<StudentAuthAccount | null>(null);
  const [showStudentLoginModal, setShowStudentLoginModal] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Sync Student Authentication on Mount and Events
  useEffect(() => {
    const syncStudent = () => {
      setActiveStudent(getActiveStudentAccount());
    };
    syncStudent();

    const handleOpenLogin = () => setShowStudentLoginModal(true);

    window.addEventListener("ptsc_student_auth_changed", syncStudent);
    window.addEventListener("ptsc_student_logout", syncStudent);
    window.addEventListener("ptsc_open_student_login", handleOpenLogin);
    window.addEventListener("storage", syncStudent);

    return () => {
      window.removeEventListener("ptsc_student_auth_changed", syncStudent);
      window.removeEventListener("ptsc_student_logout", syncStudent);
      window.removeEventListener("ptsc_open_student_login", handleOpenLogin);
      window.removeEventListener("storage", syncStudent);
    };
  }, []);

  const handleStudentLogout = () => {
    logoutStudentAccount();
    setActiveStudent(null);
    setUserDropdownOpen(false);
  };

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

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/learning") return pathname.startsWith("/learning") || pathname.startsWith("/learning-library");
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isMoreLinkActive = MORE_NAV_LINKS.some((link) => isLinkActive(link.href));

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
        scrolled
          ? "bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-slate-200/80 dark:border-slate-800 shadow-[0_4px_30px_rgba(99,102,241,0.06)] dark:shadow-[0_4px_30px_rgba(6,182,212,0.08)]"
          : "bg-white/75 dark:bg-slate-950/75 backdrop-blur-md border-slate-200/50 dark:border-slate-900/50 shadow-xs"
      }`}
    >
      {/* Top micro-bar for institutional accreditation */}
      <div className="bg-slate-950 text-slate-300 text-[11px] py-1.5 px-4 border-b border-slate-800 hidden sm:block w-full max-w-full overflow-hidden">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto flex items-center justify-between">
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
              href="/login?role=admin"
              className="text-indigo-400 hover:text-indigo-300 font-black flex items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95 shrink-0"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>ERP লগইন</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 w-full min-w-0">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20 gap-2 lg:gap-3 xl:gap-4 min-w-0">
          
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink min-w-0 max-w-[200px] xs:max-w-[240px] sm:max-w-xs md:max-w-sm lg:max-w-[280px] xl:max-w-[340px] 2xl:max-w-none">
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
              const isActive = isLinkActive(link.href);
              const Icon = link.icon;
              const isNotice = link.href === "/notices";
              const isResult = link.href === "/results";
              const visibilityClass = isResult ? "hidden 2xl:flex" : isNotice ? "hidden xl:flex" : "flex";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2 xl:px-3 py-1.5 rounded-xl text-[11px] xl:text-xs font-black tracking-tight transition-all duration-200 items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${visibilityClass} ${
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
                  className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200"
                >
                  {/* Dynamic overflow primary links for compact screens */}
                  <div className="2xl:hidden pb-1 mb-1 border-b border-slate-100 dark:border-slate-800 space-y-1">
                    <Link
                      href="/notices"
                      onClick={() => setMoreDropdownOpen(false)}
                      className={`w-full flex xl:hidden items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isLinkActive("/notices")
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-cyan-300"
                      }`}
                    >
                      <Bell className={`w-4 h-4 shrink-0 ${isLinkActive("/notices") ? "text-cyan-300" : "text-indigo-500 dark:text-cyan-400"}`} />
                      <span>নোটিশ ও ঘোষণা</span>
                    </Link>

                    <Link
                      href="/results"
                      onClick={() => setMoreDropdownOpen(false)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isLinkActive("/results")
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-cyan-300"
                      }`}
                    >
                      <GraduationCap className={`w-4 h-4 shrink-0 ${isLinkActive("/results") ? "text-cyan-300" : "text-indigo-500 dark:text-cyan-400"}`} />
                      <span>ফলাফল ও গ্রেডশিট</span>
                    </Link>
                  </div>

                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1 mb-1">
                    অতিরিক্ত মেনু অপশন
                  </div>
                  <div className="space-y-1">
                    {MORE_NAV_LINKS.map((link) => {
                      const isActive = isLinkActive(link.href);
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
          <div className="hidden sm:flex items-center gap-1.5 md:gap-2 xl:gap-2.5 shrink-0">
            {/* Glowing Live Quiz CTA with Rotating RGB Gradient Border Glow */}
            <Link
              href="/quiz/join"
              className="rgb-live-quiz-cta-wrapper shrink-0"
              title="⚡ লাইভ কুইজে যোগ দিন"
            >
              <span className="rgb-live-quiz-cta-inner text-xs py-1.5 px-2.5 xl:px-3.5">
                <span className="text-amber-400 text-xs sm:text-sm font-black animate-pulse">⚡</span>
                <span className="tracking-wide font-black whitespace-nowrap">
                  <span className="hidden 2xl:inline">লাইভ কুইজে যোগ দিন</span>
                  <span className="2xl:hidden">লাইভ কুইজ</span>
                </span>
                <span className="relative flex h-2 w-2 ml-0.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
              </span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 xl:p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              )}
            </button>

            {/* Auth State Indicator / Student Profile Dropdown & Login */}
            {activeStudent ? (
              <div className="relative shrink-0" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="px-2 xl:px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1.5 xl:gap-2 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-xs shrink-0"
                  title="শিক্ষার্থী প্রোফাইল ও সেটিংস"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                    {activeStudent.studentName?.charAt(0) || "S"}
                  </div>
                  <div className="hidden sm:flex flex-col text-left min-w-0 max-w-[85px] lg:max-w-[100px] xl:max-w-[125px] 2xl:max-w-[150px]">
                    <span className="truncate text-xs font-black text-slate-800 dark:text-white leading-tight">
                      {activeStudent.studentName}
                    </span>
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold truncate leading-none">
                      রোল: {activeStudent.rollNumber}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* Student Summary Header */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-2">
                      <p className="font-extrabold text-slate-900 dark:text-white truncate max-w-[220px]">
                        {activeStudent.studentName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold">
                          {activeStudent.trade ? `${activeStudent.trade} • ` : ""}
                          {activeStudent.classLevel?.replace("class-", "")}ম শ্রেণি • রোল {activeStudent.rollNumber}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-1 mb-2">
                      <Link
                        href="/student/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-800 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 font-bold transition"
                      >
                        <span className="flex items-center gap-2">
                          <Settings className="w-3.5 h-3.5 text-cyan-500" />
                          <span>আমার প্রোফাইল ও সেটিংস</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>

                      <Link
                        href="/results"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold transition"
                      >
                        <span className="flex items-center gap-2">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                          <span>আমার ফলাফল ও গ্রেডশিট</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>

                      <Link
                        href="/learning"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold transition"
                      >
                        <span className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                          <span>শিক্ষা রোডম্যাপ</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    </div>

                    {/* Logout Button */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={handleStudentLogout}
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
              <button
                type="button"
                onClick={() => setShowStudentLoginModal(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 xl:py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all duration-200 hover:scale-[1.02] active:scale-95 shrink-0 cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>শিক্ষার্থী লগইন</span>
              </button>
            )}

            {/* Discreet ERP Login Button for Institutional Staff on Ultra-Wide screens */}
            <Link
              href="/login?role=admin"
              className="hidden 2xl:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-black shadow-xs transition-all hover:scale-[1.02] active:scale-95 shrink-0"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>ERP লগইন</span>
            </Link>
          </div>

          {/* Mobile Header Controls & Live Quiz */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0">
            {/* Mobile Compact Glowing Live Quiz Button */}
            <Link
              href="/quiz/join"
              className="rgb-live-quiz-cta-wrapper shrink-0 sm:hidden"
              title="⚡ লাইভ কুইজ"
            >
              <span className="rgb-live-quiz-cta-inner text-[10px] py-1 px-2.5 gap-1 font-black whitespace-nowrap">
                <span className="text-amber-400 text-xs font-black animate-pulse">⚡</span>
                <span>লাইভ কুইজ</span>
              </span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              )}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-300 max-h-[85vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 pt-2">
            {ALL_NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = isLinkActive(link.href);
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
            {activeStudent ? (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {activeStudent.studentName?.charAt(0) || "S"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[260px]">
                      {activeStudent.studentName}
                    </div>
                    <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold truncate">
                      {activeStudent.classLevel?.replace("class-", "")}ম শ্রেণি • রোল {activeStudent.rollNumber}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/student/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 text-center text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-xs"
                  >
                    আমার প্রোফাইল ও সেটিংস
                  </Link>
                  <button
                    onClick={() => {
                      handleStudentLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="py-2 text-center text-xs font-bold rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 cursor-pointer"
                  >
                    লগআউট
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowStudentLoginModal(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>শিক্ষার্থী লগইন করুন</span>
              </button>
            )}

            <Link
              href="/quiz/join"
              onClick={() => setMobileMenuOpen(false)}
              className="rgb-live-quiz-cta-wrapper w-full shadow-lg"
            >
              <span className="rgb-live-quiz-cta-inner w-full justify-center py-3 text-xs">
                <span className="text-amber-400 text-sm font-black animate-pulse">⚡</span>
                <span className="font-black">লাইভ কুইজে যোগ দিন</span>
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
              </span>
            </Link>
            <Link
              href="/login?role=admin"
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-900/90 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700/80 active:scale-95 transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>প্রশাসনিক ERP লগইন</span>
            </Link>
          </div>
        </div>
      )}

      {/* Streamlined Universal Student Login Modal */}
      <StudentLoginModal
        isOpen={showStudentLoginModal}
        onClose={() => setShowStudentLoginModal(false)}
        onSuccessLogin={(account) => {
          setActiveStudent(account);
          setShowStudentLoginModal(false);
        }}
      />
    </header>
  );
}
