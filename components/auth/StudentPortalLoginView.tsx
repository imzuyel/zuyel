"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  CheckCircle2,
  ArrowLeft,
  Sun,
  Moon,
  Loader2,
  Terminal,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  loginStudentAccount,
  updateStudentPassword,
  StudentAuthAccount,
  UNIVERSAL_DEFAULT_PASSWORD,
  STUDENT_LOGIN_CLASSES,
} from "@/lib/studentIntelligenceStore";

interface StudentPortalLoginViewProps {
  initialCallbackUrl?: string;
}

export default function StudentPortalLoginView({
  initialCallbackUrl = "/student/profile",
}: StudentPortalLoginViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || initialCallbackUrl;

  const { login, showToast } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Mode: 'login' | 'change_password'
  const [mode, setMode] = useState<"login" | "change_password">("login");
  const [selectedClass, setSelectedClass] = useState("class-10");
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devHintsOpen, setDevHintsOpen] = useState(false);

  // First-login password change states
  const [pendingAccount, setPendingAccount] = useState<StudentAuthAccount | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanRoll = rollNumber.trim();
    const cleanPass = password.trim();

    if (!cleanRoll) {
      setErrorMsg("অনুগ্রহ করে আপনার শ্রেণি রোল নম্বর দিন।");
      return;
    }

    if (!cleanPass) {
      setErrorMsg("অনুগ্রহ করে আপনার পাসওয়ার্ড দিন। (ডিফল্ট: password বা 1234)");
      return;
    }

    setLoading(true);

    try {
      // 1. First attempt login via secure backend API
      const apiRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: cleanRoll,
          password: cleanPass,
          classLevel: selectedClass,
          source: "student",
        }),
      }).catch(() => null);

      if (apiRes && apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.success && apiData.user) {
          login("student", apiData.user);
          showToast(`স্বাগতম ${apiData.user.nameBangla || apiData.user.fullName}! লগইন সফল হয়েছে।`, "success");
          router.push(apiData.redirectUrl || callbackUrl);
          return;
        }
      }

      // 2. Client-side intelligence store verification & first-time password change handling
      const res = loginStudentAccount(cleanRoll, cleanPass, selectedClass);

      if (res.success) {
        if (res.requiresPasswordChange && res.account) {
          // First login detected with universal default password
          setPendingAccount(res.account);
          setMode("change_password");
          setSuccessMsg(
            "প্রথমবার লগইনে ডিফল্ট পাসওয়ার্ড পরিবর্তন করে আপনার নতুন ব্যক্তিগত পাসওয়ার্ড নির্ধারণ করুন।"
          );
        } else if (res.account) {
          // Set student session cookies
          document.cookie = "ptsc_user_role=student; path=/; max-age=86400; SameSite=Lax";
          document.cookie = "pgtsc_user_role=student; path=/; max-age=86400; SameSite=Lax";
          document.cookie = `ptsc_student_roll=${res.account.rollNumber}; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `pgtsc_student_roll=${res.account.rollNumber}; path=/; max-age=86400; SameSite=Lax`;

          // Sync context
          login("student", {
            id: parseInt(res.account.rollNumber, 10) || 101,
            email: `student.${res.account.rollNumber}@pgtsc.gov.bd`,
            fullName: res.account.studentName,
            nameBangla: res.account.studentName,
            role: "student",
            designation: `শিক্ষার্থী (${res.account.classLevel})`,
            mobile: "01711-000004",
            avatarUrl:
              "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
            trade: res.account.trade,
            roll: res.account.rollNumber,
          });

          showToast(`স্বাগতম ${res.account.studentName}! লগইন সফল হয়েছে।`, "success");
          router.push(callbackUrl);
        }
      } else {
        setErrorMsg(res.message || "Invalid credentials. রোল অথবা পাসওয়ার্ড সঠিক নয়।");
      }
    } catch {
      setErrorMsg("লগইন প্রক্রিয়ায় সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!pendingAccount) return;

    if (newPassword === UNIVERSAL_DEFAULT_PASSWORD) {
      setErrorMsg("নতুন পাসওয়ার্ড ডিফল্ট পাসওয়ার্ড (1234)-এর মতো হতে পারবে না। ভিন্ন পাসওয়ার্ড নির্ধারণ করুন।");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("উভয় পাসওয়ার্ড হুবহু মেলেনি। অনুগ্রহ করে সতর্কতার সাথে মিলিয়ে লিখুন।");
      return;
    }

    if (newPassword.trim().length < 4) {
      setErrorMsg("পাসওয়ার্ডের দৈর্ঘ্য কমপক্ষে ৪ ডিজিট বা অক্ষরের হতে হবে।");
      return;
    }

    setLoading(true);

    try {
      const res = updateStudentPassword(pendingAccount.rollNumber, newPassword.trim());

      if (res.success && res.account) {
        document.cookie = "ptsc_user_role=student; path=/; max-age=86400; SameSite=Lax";
        document.cookie = "pgtsc_user_role=student; path=/; max-age=86400; SameSite=Lax";
        document.cookie = `ptsc_student_roll=${res.account.rollNumber}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `pgtsc_student_roll=${res.account.rollNumber}; path=/; max-age=86400; SameSite=Lax`;

        login("student", {
          id: parseInt(res.account.rollNumber, 10) || 101,
          email: `student.${res.account.rollNumber}@pgtsc.gov.bd`,
          fullName: res.account.studentName,
          nameBangla: res.account.studentName,
          role: "student",
          designation: `শিক্ষার্থী (${res.account.classLevel})`,
          mobile: "01711-000004",
          avatarUrl:
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
          trade: res.account.trade,
          roll: res.account.rollNumber,
        });

        showToast("নতুন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে! স্বাগতম।", "success");
        router.push(callbackUrl);
      } else {
        setErrorMsg(res.message || "পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে।");
      }
    } catch {
      setErrorMsg("পাসওয়ার্ড আপডেটের সময় সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-cyan-500 selection:text-white font-sans">
      
      {/* 1. Subtle Animated High-Tech Grid Matrix Background */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_15%,#000_70%,transparent_100%)] pointer-events-none" 
      />

      {/* 2. Soft Glowing Ambient Floating Background Orbs */}
      <div className="absolute -top-32 -left-20 w-[550px] h-[550px] bg-cyan-500/12 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-emerald-500/12 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 group text-xs font-bold text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-slate-900/80"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-cyan-400" />
            <span className="hidden sm:inline">মূল ওয়েবসাইটে ফিরে যান</span>
            <span className="sm:hidden">ওয়েবসাইট</span>
          </Link>
          <span className="text-slate-800">|</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
            <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider hidden md:inline">
              PTSC Student Intelligence Cloud
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/admin/login"
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-indigo-300 transition-all flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">প্রশাসনিক/স্টাফ লগইন</span>
            <span className="sm:hidden">স্টাফ লগইন</span>
          </Link>

          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title={theme === "dark" ? "লাইট মোড" : "ডার্ক মোড"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono font-bold text-slate-300 hidden sm:flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>PTSC Cloud</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-auto">
        <div className="w-full max-w-md mx-auto space-y-6">
          
          {/* Glassmorphic Auth Card */}
          <div className="backdrop-blur-2xl bg-slate-950/75 border border-slate-800/80 hover:border-slate-700/80 shadow-2xl shadow-cyan-950/40 rounded-3xl sm:rounded-[36px] overflow-hidden transition-all duration-300">
            
            {/* Banner Header */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950 border-b border-slate-800/80 text-center space-y-3">
              
              <div className="relative group mx-auto w-14 h-14 sm:w-16 sm:h-16">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-emerald-500 to-indigo-500 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition duration-500" />
                <div className="relative w-full h-full rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner">
                  <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-black uppercase tracking-wider">
                    EIIN: 132244 • DTE
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    শিক্ষার্থী পোর্টাল
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {mode === "login" ? "শিক্ষার্থী লগইন ও সেলফ-সার্ভিস" : "নতুন পাসওয়ার্ড নির্ধারণ"}
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)
                </p>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6 sm:p-8 space-y-5">
              
              {/* Status Alert Banners */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-start gap-2.5 animate-shake">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-start gap-2.5 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{successMsg}</span>
                </div>
              )}

              {/* Developer Quick Access Hints Box - Collapsible (Auto-hide in production) */}
              {process.env.NODE_ENV === "development" && mode === "login" && (
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-md overflow-hidden transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => setDevHintsOpen(!devHintsOpen)}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-cyan-900/20 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Terminal className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        Developer Quick Access Hints
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                        Dev Only
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-[10px] hidden sm:inline text-slate-500">
                        {devHintsOpen ? "লুকান" : "ক্লিক করে দেখুন"}
                      </span>
                      {devHintsOpen ? (
                        <ChevronUp className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {devHintsOpen && (
                    <div className="p-3.5 pt-1 border-t border-cyan-500/20 space-y-2.5 animate-fade-in">
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        প্রোডাকশন লাইভ বিল্ডে এই কার্ডটি সম্পূর্ণ নিষ্ক্রিয় থাকবে। দ্রুত পরীক্ষার জন্য নিচের যেকোনো টেস্ট স্টুডেন্টে ক্লিক করুন:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            setRollNumber("101");
                            setPassword("password");
                            setErrorMsg(null);
                          }}
                          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-left border border-slate-800 hover:border-cyan-500/60 transition cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-cyan-400 font-bold">Tanvir Ahmed</span>
                            <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-300">Fill</span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                            Roll: <strong className="text-slate-200">101</strong> • Pass: <strong className="text-slate-200">password</strong>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRollNumber("102");
                            setPassword("1234");
                            setErrorMsg(null);
                          }}
                          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-left border border-slate-800 hover:border-emerald-500/60 transition cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-400 font-bold">Sumaiya Akter</span>
                            <span className="text-[10px] font-mono text-slate-500 group-hover:text-emerald-300">Fill</span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                            Roll: <strong className="text-slate-200">102</strong> • Pass: <strong className="text-slate-200">1234</strong>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mode === "login" ? (
                /* Login Form */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  
                  {/* Class / Academic Year Dropdown */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="student-portal-class" className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span>শ্রেণি ও শিক্ষাবর্ষ (Class / Academic Year)</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">শিক্ষাবর্ষ ২০২৬</span>
                    </div>

                    <div className="relative">
                      <select
                        id="student-portal-class"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500/80 focus:ring-4 focus:ring-cyan-500/15 focus:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all duration-300 font-bold cursor-pointer appearance-none pr-9"
                      >
                        {STUDENT_LOGIN_CLASSES.map((cls) => (
                          <option key={cls.id} value={cls.id} className="bg-slate-900 text-slate-100">
                            {cls.label}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Roll Number Input with Neon Glow Focus Ring */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span>শ্রেণি রোল নম্বর (Class Roll Number)</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-500">Student Roll / Reg</span>
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        placeholder="যেমন: 101, 102"
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-4 focus:ring-cyan-500/15 focus:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all duration-300 font-mono font-bold"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input with Neon Glow Focus Ring */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span>গোপনীয় পাসওয়ার্ড (Password)</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-medium hover:underline"
                      >
                        পাসওয়ার্ড মনে নেই?
                      </Link>
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-12 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-4 focus:ring-cyan-500/15 focus:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all duration-300 font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        title={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-emerald-500 text-white font-black text-sm transition-all duration-300 shadow-lg shadow-cyan-600/30 hover:shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>প্রোফাইল লোড হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>শিক্ষার্থী ড্যাশবোর্ডে প্রবেশ করুন</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Force Change Password Form */
                <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 animate-fade-in">
                  <div className="p-3.5 bg-cyan-950/40 rounded-2xl border border-cyan-800/80 flex items-center justify-between text-xs font-bold text-cyan-300">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-cyan-400" />
                      <span>{pendingAccount?.studentName}</span>
                    </span>
                    <span className="font-mono">রোল: {pendingAccount?.rollNumber}</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200 block">
                      নতুন ব্যক্তিগত পাসওয়ার্ড দিন:
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="কমপক্ষে ৪ অক্ষরের নতুন গোপন পাসওয়ার্ড"
                      className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm font-bold text-white focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200 block">
                      পাসওয়ার্ড নিশ্চিত করুন:
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="একই পাসওয়ার্ড পুনরায় লিখুন"
                      className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm font-bold text-white focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>পাসওয়ার্ড সংরক্ষণ ও প্রবেশ</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Staff Portal Quick Routing Notice */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>আপনি কি শিক্ষক বা কর্মকর্তা?</span>
                </div>
                <Link
                  href="/admin/login"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 hover:text-indigo-300 font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>স্টাফ অ্যাডমিন পোর্টালে যান</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </div>

          {/* Institutional Compliance Notice */}
          <div className="text-center space-y-1 text-[11px] text-slate-500">
            <p>
              কারিগরি শিক্ষা অধিদপ্তর (DTE) ও বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) অনুমোদিত সমন্বিত ইআরপি
            </p>
            <p className="font-mono text-[10px] text-slate-600">
              © {new Date().getFullYear()} Panchagarh Govt. Technical School and College. All Rights Reserved.
            </p>
          </div>

        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-20 border-t border-slate-900/80 bg-slate-950/80 backdrop-blur-md px-4 py-2.5 text-center text-[10px] text-slate-500 font-mono">
        PTSC STUDENT INTELLIGENCE PORTAL • SECURE SSL SESSIONS
      </footer>

    </div>
  );
}
