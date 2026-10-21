"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff,
  Building2,
  ArrowLeft,
  Sun,
  Moon,
  Loader2,
  Terminal,
  ChevronDown,
  ChevronUp,
  User,
  Award,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import InstitutionalAuthArtwork from "@/components/auth/InstitutionalAuthArtwork";

type PortalRole = "student" | "teacher" | "admin";
type PortalViewMode = "gateway" | "form";

interface UnifiedGameAuthPortalProps {
  initialRole?: PortalRole;
  initialCallbackUrl?: string;
}

// ========================================================
// 3D Tilt Role Card for Gateway Stage
// ========================================================
function RoleGatewayCard({
  role,
  titleBangla,
  titleEnglish,
  subtitle,
  description,
  icon: Icon,
  accentColor,
  isDark,
  onClick,
}: {
  role: PortalRole;
  titleBangla: string;
  titleEnglish: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  accentColor: "cyan" | "emerald" | "violet";
  isDark: boolean;
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -8;
    const rY = ((x - centerX) / centerX) * 8;

    setRotateX(rX);
    setRotateY(rY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const colorThemes = {
    cyan: {
      border: isDark
        ? "border-cyan-500/40 hover:border-cyan-400 group-hover:shadow-[0_0_35px_rgba(6,182,212,0.35)]"
        : "border-cyan-300 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/20",
      iconBox: isDark
        ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        : "bg-cyan-100 text-cyan-700 border-cyan-300 shadow-sm",
      badge: isDark
        ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
        : "bg-cyan-100 text-cyan-800 border-cyan-300 font-bold",
      btn: "from-cyan-600 via-teal-600 to-cyan-500 hover:from-cyan-500 hover:to-teal-400",
      accent: isDark ? "text-cyan-400" : "text-cyan-700",
    },
    emerald: {
      border: isDark
        ? "border-emerald-500/40 hover:border-emerald-400 group-hover:shadow-[0_0_35px_rgba(16,185,129,0.35)]"
        : "border-emerald-300 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20",
      iconBox: isDark
        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        : "bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm",
      badge: isDark
        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
        : "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold",
      btn: "from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400",
      accent: isDark ? "text-emerald-400" : "text-emerald-700",
    },
    violet: {
      border: isDark
        ? "border-purple-500/40 hover:border-purple-400 group-hover:shadow-[0_0_35px_rgba(168,85,247,0.35)]"
        : "border-purple-300 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/20",
      iconBox: isDark
        ? "bg-purple-500/20 text-purple-400 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
        : "bg-purple-100 text-purple-700 border-purple-300 shadow-sm",
      badge: isDark
        ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
        : "bg-purple-100 text-purple-800 border-purple-300 font-bold",
      btn: "from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-400",
      accent: isDark ? "text-purple-400" : "text-purple-700",
    },
  }[accentColor];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${
          isHovered ? 1.02 : 1
        }, ${isHovered ? 1.02 : 1}, 1)`,
        transition: isHovered
          ? "transform 0.1s ease-out, box-shadow 0.2s ease"
          : "transform 0.5s ease-out, box-shadow 0.5s ease",
      }}
      className={`relative group cursor-pointer rounded-3xl backdrop-blur-xl ${
        isDark
          ? "bg-slate-950/85 text-slate-100"
          : "bg-white/95 text-slate-900 shadow-xl"
      } border ${colorThemes.border} p-6 sm:p-7 flex flex-col justify-between overflow-hidden transition-all duration-300 select-none`}
    >
      {/* Glare Effect */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-30 rounded-3xl"
          style={{
            background: `radial-gradient(circle 240px at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.25), transparent 80%)`,
          }}
        />
      )}

      {/* Sweeping Laser Line on Hover */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse pointer-events-none" />

      {/* Card Content */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${colorThemes.badge}`}
          >
            {subtitle}
          </span>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${colorThemes.iconBox} group-hover:scale-110 transition-transform duration-300 shrink-0`}
          >
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <h3
              className={`text-xl font-black transition-colors ${
                isDark ? "text-white group-hover:text-emerald-300" : "text-slate-900 group-hover:text-emerald-700"
              }`}
            >
              {titleBangla}
            </h3>
            <p className={`text-xs font-mono font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {titleEnglish}
            </p>
          </div>
        </div>

        <p className={`text-xs leading-relaxed min-h-[44px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>
          {description}
        </p>
      </div>

      <div className="pt-6 relative z-10">
        <div
          className={`w-full py-3 px-4 rounded-2xl bg-gradient-to-r ${colorThemes.btn} text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all group-hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]`}
        >
          <span>পোর্টালে প্রবেশ করুন</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}

// ========================================================
// MASTER UNIFIED AUTHENTICATION PORTAL
// ========================================================
export default function UnifiedGameAuthPortal({
  initialRole,
  initialCallbackUrl,
}: UnifiedGameAuthPortalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Role query param (?role=teacher | student | admin)
  const roleParam = searchParams.get("role") || searchParams.get("portal");
  const callbackUrl =
    searchParams.get("callbackUrl") ||
    initialCallbackUrl ||
    (roleParam === "student" ? "/student/profile" : "/admin");

  const [activeRole, setActiveRole] = useState<PortalRole>(() => {
    if (roleParam === "student") return "student";
    if (roleParam === "admin") return "admin";
    if (roleParam === "teacher") return "teacher";
    return initialRole || "student";
  });

  // View mode:
  // If user opens with a specific role (?role=admin), open directly to form!
  // If user opens /login cleanly without query parameters, display the 3D role selection gateway!
  const [viewMode, setViewMode] = useState<PortalViewMode>(() => {
    return roleParam ? "form" : "gateway";
  });

  const { login, showToast } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devHintsOpen, setDevHintsOpen] = useState(false);

  // Sync role if query param changes
  useEffect(() => {
    if (roleParam === "student") {
      setActiveRole("student");
      setViewMode("form");
    } else if (roleParam === "teacher") {
      setActiveRole("teacher");
      setViewMode("form");
    } else if (roleParam === "admin") {
      setActiveRole("admin");
      setViewMode("form");
    }
  }, [roleParam]);

  // Dev Quick Autofill
  const handleDevAutoFill = (devRole: PortalRole, devId: string, devPass: string) => {
    setActiveRole(devRole);
    setIdentifier(devId);
    setPassword(devPass);
    setErrorMsg(null);
  };

  // Transition from Gateway to Form for a selected role
  const handleSelectRole = (role: PortalRole) => {
    setActiveRole(role);
    setViewMode("form");
    setErrorMsg(null);
    setIdentifier("");
    setPassword("");
  };

  // Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMsg(
        activeRole === "student"
          ? "অনুগ্রহ করে আপনার শ্রেণি রোল নম্বর লিখুন।"
          : "অনুগ্রহ করে আপনার ইউজারনেম, প্রাতিষ্ঠানিক ইমেইল বা আইডি লিখুন।"
      );
      return;
    }

    if (!cleanPass) {
      setErrorMsg("অনুগ্রহ করে আপনার গোপনীয় পাসওয়ার্ড প্রদান করুন।");
      return;
    }

    setLoading(true);

    try {
      // Determine source: numeric rolls or student role use "student", otherwise "admin"
      const authSource =
        activeRole === "student" || /^\d+$/.test(cleanId) ? "student" : "admin";

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: cleanId,
          password: cleanPass,
          rememberMe,
          source: authSource,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        login(data.user.role, data.user);
        showToast(
          `লগইন সফল হয়েছে! স্বাগতম ${data.user.nameBangla || data.user.fullName}`,
          "success"
        );
        router.push(data.redirectUrl || callbackUrl);
      } else {
        setErrorMsg(
          data.error || "Invalid credentials. ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।"
        );
      }
    } catch {
      setErrorMsg("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  // Role Theme Color Config
  const roleConfig = {
    student: {
      nameBangla: "শিক্ষার্থী পোর্টাল লগইন",
      titleEnglish: "Student Self-Service",
      badge: "STUDENT SELF-SERVICE",
      idLabel: "শ্রেণি রোল নম্বর (Class Roll)",
      idPlaceholder: "যেমন: 101, 102",
      icon: GraduationCap,
      accentGlow: "from-teal-600 via-cyan-600 to-indigo-600",
      focusRing:
        "focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.4)]",
      badgeStyle: isDark
        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
        : "bg-cyan-100 text-cyan-800 border-cyan-300 font-bold",
    },
    teacher: {
      nameBangla: "শিক্ষক ও প্রশিক্ষক লগইন",
      titleEnglish: "Faculty & Academic Ops",
      badge: "ACADEMIC OPERATIONS",
      idLabel: "ইউজারনেম বা প্রাতিষ্ঠানিক ইমেইল",
      idPlaceholder: "যেমন: teacher অথবা teacher@pgtsc.gov.bd",
      icon: Award,
      accentGlow: "from-emerald-600 via-teal-600 to-cyan-600",
      focusRing:
        "focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
      badgeStyle: isDark
        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
        : "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold",
    },
    admin: {
      nameBangla: "প্রশাসনিক গভর্ন্যান্স লগইন",
      titleEnglish: "Root & Administrative Access",
      badge: "ROOT GOVERNANCE",
      idLabel: "ইউজারনেম বা অ্যাডমিন আইডি",
      idPlaceholder: "যেমন: admin অথবা admin@pgtsc.gov.bd",
      icon: ShieldCheck,
      accentGlow: "from-indigo-600 via-purple-600 to-indigo-700",
      focusRing:
        "focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.4)]",
      badgeStyle: isDark
        ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
        : "bg-purple-100 text-purple-800 border-purple-300 font-bold",
    },
  }[activeRole];

  const RoleIcon = roleConfig.icon;

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-[#020617] text-slate-100" : "bg-slate-50 text-slate-900"
      } flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-500 selection:text-white font-sans transition-colors duration-500`}
    >
      {/* ======================================================== */}
      {/* 1. DYNAMIC COLORFUL AMBIENT GLOW POOLS & TECH GRID       */}
      {/* ======================================================== */}
      <div
        className={`absolute inset-0 ${
          isDark
            ? "bg-[linear-gradient(to_right,#1e293b22_1px,transparent_1px),linear-gradient(to_bottom,#1e293b22_1px,transparent_1px)]"
            : "bg-[linear-gradient(to_right,#cbd5e140_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e140_1px,transparent_1px)]"
        } bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_65%_at_50%_15%,#000_75%,transparent_100%)] pointer-events-none`}
      />

      {/* Floating Ambient Glow Pools */}
      <div
        className={`absolute -top-32 -left-20 w-[550px] h-[550px] ${
          isDark ? "bg-emerald-500/25" : "bg-emerald-400/20"
        } rounded-full blur-[150px] pointer-events-none animate-ambient-float`}
      />
      <div
        className={`absolute top-1/4 -right-24 w-[600px] h-[600px] ${
          isDark ? "bg-indigo-600/25" : "bg-indigo-400/18"
        } rounded-full blur-[160px] pointer-events-none animate-ambient-float [animation-delay:2s]`}
      />
      <div
        className={`absolute -bottom-20 left-1/4 w-[520px] h-[520px] ${
          isDark ? "bg-purple-600/20" : "bg-purple-400/15"
        } rounded-full blur-[140px] pointer-events-none animate-ambient-float [animation-delay:4s]`}
      />
      <div
        className={`absolute top-1/2 left-1/3 w-[450px] h-[450px] ${
          isDark ? "bg-cyan-500/20" : "bg-cyan-400/18"
        } rounded-full blur-[150px] pointer-events-none animate-ambient-float [animation-delay:6s]`}
      />

      {/* ======================================================== */}
      {/* 2. LIVE ANIMATED 3D/SVG ERP TECHNICAL ARTWORK BACKGROUND  */}
      {/* ======================================================== */}
      <InstitutionalAuthArtwork isDark={isDark} />

      {/* ======================================================== */}
      {/* 3. TOP NAVIGATION BAR                                    */}
      {/* ======================================================== */}
      <header
        className={`relative z-20 border-b ${
          isDark
            ? "border-slate-800/80 bg-slate-950/70"
            : "border-slate-200/90 bg-white/80 shadow-xs"
        } backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors duration-300`}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={`flex items-center gap-2 group text-xs font-bold ${
              isDark
                ? "text-slate-400 hover:text-white hover:bg-slate-900/80"
                : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
            } transition-colors p-1.5 rounded-xl`}
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-emerald-500" />
            <span className="hidden sm:inline">মূল ওয়েবসাইটে ফিরে যান</span>
            <span className="sm:hidden">ওয়েবসাইট</span>
          </Link>
          <span className={isDark ? "text-slate-800" : "text-slate-300"}>|</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
            <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider hidden md:inline">
              PTSC Master Authentication Gateway
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* SSL Protected Badge */}
          <div
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-xs ${
              isDark
                ? "bg-slate-900/80 border-slate-800 text-slate-300"
                : "bg-slate-100 border-slate-300 text-slate-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">256-Bit SSL Secured</span>
            <span className="sm:hidden">SSL</span>
          </div>

          {/* Theme Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? "bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-amber-400"
                : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
            }`}
            title={isDark ? "লাইট মোডে পরিবর্তন করুন" : "ডার্ক মোডে পরিবর্তন করুন"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-slate-800" />
            )}
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 4. MAIN CONTENT: GATEWAY STAGE OR TAILORED LOGIN FORM    */}
      {/* ======================================================== */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 my-auto w-full">
        {viewMode === "gateway" ? (
          /* ======================================================== */
          /* STAGE 1: INTERACTIVE ROLE SELECTION GATEWAY               */
          /* ======================================================== */
          <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in">
            {/* Gateway Header */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="relative inline-block group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-700" />
                <div
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl border ${
                    isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                  } flex flex-col items-center justify-center p-1.5 text-center shadow-inner`}
                >
                  <span className="text-[14px] sm:text-[16px] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600">
                    PTSC
                  </span>
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${isDark ? "text-cyan-300" : "text-indigo-900"}`}>
                    ERP CORE
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span
                    className={`px-3 py-0.5 rounded-full border text-[10px] font-mono font-black uppercase tracking-wider ${
                      isDark
                        ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                        : "bg-teal-50 text-teal-800 border-teal-300 font-bold shadow-xs"
                    }`}
                  >
                    EIIN: 132244 • DTE
                  </span>
                  <span
                    className={`px-3 py-0.5 rounded-full border text-[10px] font-bold ${
                      isDark
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                        : "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-xs"
                    }`}
                  >
                    BTEB অনুমোদিত কারিগরি প্রতিষ্ঠান
                  </span>
                </div>

                {/* Vibrant Institution Title */}
                <h1 className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight ${
                  isDark
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-cyan-200"
                    : "text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800"
                }`}>
                  পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
                </h1>

                <p className={`text-xs sm:text-sm font-bold max-w-xl mx-auto ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  লগইন পোর্টাল নির্বাচন করুন • আপনার সংশ্লিষ্ট অ্যাকাউন্টে প্রবেশ করুন
                </p>
              </div>
            </div>

            {/* 3 Distinct Interactive Role Gateway Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <RoleGatewayCard
                role="student"
                titleBangla="শিক্ষার্থী পোর্টাল"
                titleEnglish="Student Portal"
                subtitle="STUDENT SELF-SERVICE"
                description="শ্রেণি রোল ও পাসওয়ার্ড দিয়ে ফলাফল, রুটিন, কুইজ ও ডিজিটাল স্টুডেন্ট ড্যাশবোর্ড।"
                icon={GraduationCap}
                accentColor="cyan"
                isDark={isDark}
                onClick={() => handleSelectRole("student")}
              />

              <RoleGatewayCard
                role="teacher"
                titleBangla="শিক্ষক ও প্রশিক্ষক"
                titleEnglish="Teacher / Faculty"
                subtitle="ACADEMIC OPERATIONS"
                description="ডিজিটাল অ্যাকাডেমিক ম্যানেজমেন্ট, হাজিরা খাতা, মার্কস এন্ট্রি ও প্রশ্নব্যাংক।"
                icon={Award}
                accentColor="emerald"
                isDark={isDark}
                onClick={() => handleSelectRole("teacher")}
              />

              <RoleGatewayCard
                role="admin"
                titleBangla="প্রশাসনিক গভর্ন্যান্স"
                titleEnglish="Admin & Staff"
                subtitle="ROOT GOVERNANCE"
                description="সেন্ট্রাল অ্যাডমিনিস্ট্রেশন, RBAC পলিসি, নিরাপত্তা অডিট ট্রেইল ও ডেটাবেস কন্ট্রোল।"
                icon={ShieldCheck}
                accentColor="violet"
                isDark={isDark}
                onClick={() => handleSelectRole("admin")}
              />
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* STAGE 2: TAILORED LOGIN FORM FOR SELECTED ROLE            */
          /* ======================================================== */
          <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
            
            {/* Institution Header Representation */}
            <div className="text-center space-y-2">
              <div className="relative inline-block group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-700" />
                <div
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-3xl border ${
                    isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                  } flex flex-col items-center justify-center p-1 text-center shadow-inner`}
                >
                  <span className="text-[14px] sm:text-[15px] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600">
                    PTSC
                  </span>
                  <span className={`text-[8px] font-mono font-bold uppercase tracking-widest ${isDark ? "text-cyan-300" : "text-indigo-900"}`}>
                    ERP CORE
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                      isDark
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                        : "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs"
                    }`}
                  >
                    EIIN: 132244 • DTE • BTEB
                  </span>
                </div>

                <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${
                  isDark
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-cyan-200"
                    : "text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800"
                }`}>
                  পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
                </h1>

                <p className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  প্রবেশ করুন / Login Portal
                </p>
              </div>
            </div>

            {/* High-Impact Multi-Color Glowing Border Card */}
            <div className="relative group">
              {/* Animated Multi-Color Ring Border */}
              <div className="absolute -inset-[1.5px] rounded-[34px] sm:rounded-[38px] bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 opacity-75 group-hover:opacity-100 blur-[2px] animate-border-ring-glow transition-all duration-700 pointer-events-none" />

              {/* Inner Frosted Glassmorphic Card */}
              <div
                className={`relative backdrop-blur-xl ${
                  isDark
                    ? "bg-slate-950/90 border border-slate-800/80 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                    : "bg-white/95 border border-slate-200 shadow-2xl shadow-emerald-500/15"
                } rounded-[32px] sm:rounded-[36px] overflow-hidden transition-all duration-300`}
              >
                {/* Sweeping Electric Lightning Pulse Line */}
                <div className="absolute top-0 left-0 w-full h-[2.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-electric-sweep pointer-events-none" />

                {/* Role Identity Banner with 'Change Role' Action */}
                <div
                  className={`p-3.5 sm:p-4 border-b flex items-center justify-between gap-3 ${
                    isDark
                      ? "bg-slate-900/90 border-slate-800/80"
                      : "bg-slate-100/90 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm shrink-0 ${
                        activeRole === "student"
                          ? isDark
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                            : "bg-cyan-100 border-cyan-300 text-cyan-800"
                          : activeRole === "teacher"
                          ? isDark
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-emerald-100 border-emerald-300 text-emerald-800"
                          : isDark
                          ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                          : "bg-purple-100 border-purple-300 text-purple-800"
                      }`}
                    >
                      <RoleIcon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className={`text-sm font-black truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                          {roleConfig.nameBangla}
                        </h2>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${roleConfig.badgeStyle}`}>
                          {roleConfig.badge}
                        </span>
                      </div>
                      <p className={`text-[10px] font-semibold truncate ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        {roleConfig.titleEnglish}
                      </p>
                    </div>
                  </div>

                  {/* Clean Button to Return to Gateway Stage */}
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("gateway");
                      setErrorMsg(null);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs shrink-0 ${
                      isDark
                        ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white"
                        : "bg-white hover:bg-slate-50 border-slate-300 text-slate-800 hover:text-slate-950"
                    }`}
                    title="রোল পরিবর্তন করতে ক্লিক করুন"
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline">রোল পরিবর্তন</span>
                    <span className="sm:hidden">পরিবর্তন</span>
                  </button>
                </div>

                {/* Form Body */}
                <div className="p-6 sm:p-7 space-y-4">
                  
                  {/* Error Notification Alert */}
                  {errorMsg && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-bold animate-shake">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{errorMsg}</span>
                    </div>
                  )}

                  {/* Developer Credentials Helper (Auto-Hides in Production) */}
                  {process.env.NODE_ENV !== "production" && (
                    <div
                      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                        isDark
                          ? "border-indigo-500/30 bg-indigo-950/20"
                          : "border-indigo-300 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-blue-50/90 shadow-sm"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setDevHintsOpen(!devHintsOpen)}
                        className={`w-full p-2.5 px-3 flex items-center justify-between text-left transition cursor-pointer ${
                          isDark ? "hover:bg-indigo-900/20" : "hover:bg-indigo-100/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className={`text-xs font-black ${isDark ? "text-slate-200" : "text-indigo-950"}`}>
                            Developer Quick Access Demo
                          </span>
                          <span
                            className={`text-[9px] font-mono px-2 py-0.2 rounded-full font-bold uppercase border ${
                              isDark
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : "bg-indigo-600 text-white border-indigo-700"
                            }`}
                          >
                            DEV ONLY
                          </span>
                        </div>
                        {devHintsOpen ? (
                          <ChevronUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>

                      {devHintsOpen && (
                        <div
                          className={`p-3 pt-0 border-t space-y-2 animate-fade-in ${
                            isDark ? "border-indigo-500/20" : "border-indigo-200"
                          }`}
                        >
                          <div className="grid grid-cols-3 gap-2 text-[10px] pt-2">
                            <button
                              type="button"
                              onClick={() => handleDevAutoFill("student", "101", "password")}
                              className={`p-2 rounded-xl border text-left cursor-pointer group transition ${
                                isDark
                                  ? "bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-cyan-500/60"
                                  : "bg-white hover:bg-cyan-50 border-cyan-200 text-slate-900 shadow-xs font-bold"
                              }`}
                            >
                              <span className="text-cyan-600 dark:text-cyan-400 font-black block">Student</span>
                              <span className={`font-mono block ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                101 / pass
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDevAutoFill("teacher", "teacher", "password")}
                              className={`p-2 rounded-xl border text-left cursor-pointer group transition ${
                                isDark
                                  ? "bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-emerald-500/60"
                                  : "bg-white hover:bg-emerald-50 border-emerald-200 text-slate-900 shadow-xs font-bold"
                              }`}
                            >
                              <span className="text-emerald-600 dark:text-emerald-400 font-black block">Teacher</span>
                              <span className={`font-mono block ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                teacher / pass
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDevAutoFill("admin", "admin", "password")}
                              className={`p-2 rounded-xl border text-left cursor-pointer group transition ${
                                isDark
                                  ? "bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-purple-500/60"
                                  : "bg-white hover:bg-purple-50 border-purple-200 text-slate-900 shadow-xs font-bold"
                              }`}
                            >
                              <span className="text-purple-600 dark:text-purple-400 font-black block">Admin</span>
                              <span className={`font-mono block ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                admin / pass
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Form Inputs */}
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    
                    {/* Identifier Field */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className={`font-black flex items-center gap-1.5 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                          <span>{roleConfig.idLabel}</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <span className={`text-[10px] font-mono font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                          {activeRole === "student" ? "Class Roll" : "Username / Email"}
                        </span>
                      </div>

                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                          {activeRole === "student" ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
                        </div>
                        <input
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder={roleConfig.idPlaceholder}
                          autoComplete="username"
                          className={`w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-bold font-sans transition-all duration-300 focus:outline-none ${
                            isDark
                              ? "bg-slate-900/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:bg-slate-900"
                              : "bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white"
                          } ${roleConfig.focusRing}`}
                          required
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className={`font-black flex items-center gap-1.5 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                          <span>গোপনীয় পাসওয়ার্ড (Password)</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <Link
                          href="/forgot-password"
                          className={`text-[11px] font-black hover:underline transition-colors ${
                            isDark ? "text-cyan-400 hover:text-cyan-300" : "text-indigo-600 hover:text-indigo-800"
                          }`}
                        >
                          পাসওয়ার্ড মনে নেই?
                        </Link>
                      </div>

                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          autoComplete="current-password"
                          className={`w-full pl-10 pr-12 py-3 rounded-2xl text-sm font-bold transition-all duration-300 focus:outline-none ${
                            isDark
                              ? "bg-slate-900/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:bg-slate-900"
                              : "bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white"
                          } ${roleConfig.focusRing}`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Options: Remember Me & Security Status */}
                    <div className="pt-1 flex items-center justify-between text-xs">
                      <label className={`flex items-center gap-2 cursor-pointer select-none font-bold ${isDark ? "text-slate-300 hover:text-white" : "text-slate-800 hover:text-slate-950"}`}>
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded-md bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
                        />
                        <span>সেশন মনে রাখুন</span>
                      </label>

                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-black ${
                          isDark
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-emerald-800 bg-emerald-100 border-emerald-300"
                        }`}
                      >
                        Zero-Trust Protected
                      </span>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full mt-2 min-h-[50px] py-3.5 rounded-2xl bg-gradient-to-r ${roleConfig.accentGlow} text-white font-black text-sm tracking-wide transition-all duration-300 shadow-lg shadow-emerald-600/30 hover:shadow-[0_0_35px_rgba(16,185,129,0.45)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.99]`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>প্রমাণীকরণ যাচাই হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>প্রবেশ করুন (Login to Portal)</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>

                </div>
              </div>
            </div>

            {/* Bottom Institutional Disclaimer */}
            <div className={`text-center space-y-1 text-[11px] pt-1 ${isDark ? "text-slate-400" : "text-slate-700 font-bold"}`}>
              <p>
                বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) ও কারিগরি শিক্ষা অধিদপ্তর (DTE) অনুমোদিত
              </p>
              <p className={`font-mono text-[10px] ${isDark ? "text-slate-500" : "text-slate-600 font-semibold"}`}>
                © {new Date().getFullYear()} Panchagarh Govt. Technical School and College. All Rights Reserved.
              </p>
            </div>

          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 5. CLEAN FOOTER (Zero Clutter)                           */}
      {/* ======================================================== */}
      <footer
        className={`relative z-20 border-t ${
          isDark
            ? "border-slate-900/80 bg-slate-950/80 text-slate-500"
            : "border-slate-200/90 bg-white/80 text-slate-700 font-bold"
        } backdrop-blur-md px-4 py-2.5 text-center text-[10px] font-mono transition-colors duration-300`}
      >
        PTSC MASTER LOGIN GATEWAY • 256-BIT ENCRYPTION • ZERO-TRUST ARCHITECTURE
      </footer>

    </div>
  );
}
