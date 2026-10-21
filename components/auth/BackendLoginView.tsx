"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  KeyRound,
  ShieldAlert,
  GraduationCap,
  Award,
  Sun,
  Moon,
  Loader2,
  Building2,
  Mail,
  Terminal,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

interface BackendLoginViewProps {
  initialCallbackUrl?: string;
}

export default function BackendLoginView({ initialCallbackUrl }: BackendLoginViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || initialCallbackUrl || "/admin";

  const { currentUser, isLoggedIn, login, logout, showToast } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devHintsOpen, setDevHintsOpen] = useState(false);

  // Check if currently logged in user is already an authorized staff
  const isAlreadyStaff =
    isLoggedIn &&
    currentUser &&
    currentUser.role !== "student" &&
    currentUser.role !== "guardian" &&
    currentUser.role !== "parent";

  // Development Auto-Fill Handler
  const handleDevAutoFill = (devId: string, devPass: string) => {
    setIdentifier(devId);
    setPassword(devPass);
    setErrorMsg(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMsg("অনুগ্রহ করে আপনার ইউজারনেম, প্রাতিষ্ঠানিক ইমেইল বা আইডি লিখুন।");
      return;
    }

    if (!cleanPass) {
      setErrorMsg("অনুগ্রহ করে আপনার গোপনীয় পাসওয়ার্ড প্রদান করুন।");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: cleanId,
          password: cleanPass,
          rememberMe,
          source: "admin",
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
        setErrorMsg(data.error || "Invalid credentials. ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।");
      }
    } catch {
      setErrorMsg("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* 1. Subtle Animated High-Tech Grid Matrix Background */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b22_1px,transparent_1px),linear-gradient(to_bottom,#1e293b22_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_15%,#000_70%,transparent_100%)] pointer-events-none" 
      />

      {/* 2. Soft Glowing Ambient Floating Background Orbs */}
      <div className="absolute -top-32 -left-20 w-[550px] h-[550px] bg-emerald-500/12 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/4 -right-20 w-[650px] h-[650px] bg-indigo-600/16 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-[500px] h-[500px] bg-cyan-500/12 rounded-full blur-[140px] pointer-events-none" />

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
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
            <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider hidden md:inline">
              PTSC Secure Governance Node
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-1.5"
          >
            <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">শিক্ষার্থী পোর্টাল</span>
            <span className="sm:hidden">শিক্ষার্থী</span>
          </Link>

          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            title={theme === "dark" ? "লাইট মোড" : "ডার্ক মোড"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" />
            )}
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono font-bold text-slate-300 hidden sm:flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-auto">
        <div className="w-full max-w-xl mx-auto space-y-6">
          
          {/* Active Session Warning Banner (if user already logged in) */}
          {isAlreadyStaff && (
            <div className="p-4 rounded-3xl bg-slate-950/75 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl backdrop-blur-2xl animate-fade-in">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 font-black text-sm">
                  {currentUser.role.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    <span>সক্রিয় সেশন:</span>
                    <span className="text-emerald-400 font-bold">{currentUser.nameBangla || currentUser.fullName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-mono">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {currentUser.designation} • আপনি সরাসরি ড্যাশবোর্ডে প্রবেশ করতে পারেন।
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Link
                  href={callbackUrl}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                >
                  <span>ড্যাশবোর্ড</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  লগআউট
                </button>
              </div>
            </div>
          )}

          {/* Institutional Main Glassmorphic Auth Card */}
          <div className="backdrop-blur-2xl bg-slate-950/75 border border-slate-800/80 hover:border-slate-700/80 shadow-2xl shadow-indigo-950/50 rounded-3xl sm:rounded-[36px] overflow-hidden transition-all duration-300">
            
            {/* Top Modern Institutional Header */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950 border-b border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                
                {/* School Crest Emblem Badge */}
                <div className="relative group shrink-0">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition duration-500" />
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-1 text-center shadow-inner">
                    <span className="text-[12px] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                      PTSC
                    </span>
                    <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                      ERP
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-black uppercase tracking-wider">
                      EIIN: 132244 • DTE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-black">
                      BTEB অনুমোদিত
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)
                  </h1>
                  <p className="text-xs text-slate-400 font-medium">
                    প্রশাসনিক ও প্রাতিষ্ঠানিক ব্যাকএন্ড গেটওয়ে (Administrative ERP Access)
                  </p>
                </div>
              </div>

              <div className="hidden lg:flex flex-col items-end text-right space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>সংরক্ষিত অ্যাক্সেস</span>
                </div>
                <p className="text-[11px] text-slate-500 max-w-[200px]">
                  শুধুমাত্র অনুমোদিত শিক্ষক ও প্রশাসনিক কর্মকর্তাদের জন্য সংরক্ষিত।
                </p>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6 sm:p-8 space-y-5">

              {/* Error Message Notice */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-shake">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-rose-200">লগইন ত্রুটি</p>
                    <p className="leading-relaxed">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Clean, Collapsible Developer Quick Access Hints Box - Auto-Hides in Production */}
              {process.env.NODE_ENV === "development" && (
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 backdrop-blur-md overflow-hidden transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => setDevHintsOpen(!devHintsOpen)}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-indigo-900/20 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
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
                    <div className="p-3.5 pt-1 border-t border-indigo-500/20 space-y-2.5 animate-fade-in">
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        নিরাপত্তা নিয়ম অনুযায়ী প্রোডাকশন বিল্ডে এই বক্সটি স্বয়ংক্রিয়ভাবে বন্ধ থাকবে। দ্রুত পরীক্ষার জন্য যেকোনো টেস্ট অ্যাকাউন্টে ক্লিক করুন:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleDevAutoFill("admin", "password")}
                          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-left border border-slate-800 hover:border-indigo-500/60 transition cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-cyan-400 font-bold">Admin</span>
                            <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-300">Fill</span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                            admin / password
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDevAutoFill("teacher", "password")}
                          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-left border border-slate-800 hover:border-emerald-500/60 transition cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-400 font-bold">Teacher</span>
                            <span className="text-[10px] font-mono text-slate-500 group-hover:text-emerald-300">Fill</span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                            teacher / password
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDevAutoFill("principal", "password")}
                          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-left border border-slate-800 hover:border-purple-500/60 transition cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-purple-400 font-bold">Principal</span>
                            <span className="text-[10px] font-mono text-slate-500 group-hover:text-purple-300">Fill</span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                            principal / password
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                
                {/* Identifier Input with Neon Glow Focus Ring */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-300 flex items-center gap-1.5">
                      <span>ইউজারনেম বা প্রাতিষ্ঠানিক ইমেইল</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">Staff ID / Username</span>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. admin অথবা teacher@pgtsc.gov.bd"
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-4 focus:ring-cyan-500/15 focus:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all duration-300 font-medium font-sans"
                    />
                  </div>
                </div>

                {/* Password Input with Neon Glow Focus Ring */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-300 flex items-center gap-1.5">
                      <span>গোপনীয় পাসওয়ার্ড</span>
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
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-12 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/15 focus:shadow-[0_0_25px_rgba(99,102,241,0.2)] transition-all duration-300 font-medium"
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

                {/* Options: Remember me & Zero-Trust Notice */}
                <div className="pt-1 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-md bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500/30"
                    />
                    <span>সেশন মনে রাখুন (Remember Session)</span>
                  </label>

                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Zero-Trust Active
                  </span>
                </div>

                {/* Submit Button with High-Tech Glow */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 hover:from-indigo-500 hover:via-cyan-500 hover:to-indigo-500 text-white font-black text-sm transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>প্রমাণীকরণ যাচাই হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>নিরাপদ অ্যাকাউন্টে প্রবেশ করুন</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Student Portal Quick Routing Notice */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-cyan-400" />
                  <span>আপনি কি পঞ্চগড় টিএসসির একজন শিক্ষার্থী?</span>
                </div>
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 hover:text-cyan-300 font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>শিক্ষার্থী লগইন পোর্টালে যান</span>
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
        SECURE ENTERPRISE AUTHENTICATION MATRIX • ENCRYPTED SESSION TOKENS
      </footer>

    </div>
  );
}
