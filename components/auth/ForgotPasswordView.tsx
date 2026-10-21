"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Loader2,
  Sun,
  Moon,
  Building2,
  Lock,
  Terminal,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ForgotPasswordView() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    email?: string;
    name?: string;
    devOtpCode?: string;
    devResetUrl?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessData(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMsg("অনুগ্রহ করে আপনার প্রাতিষ্ঠানিক ইমেইল, এমপ্লয়ি আইডি বা রোল লিখুন।");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: cleanId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessData(data);
      } else {
        setErrorMsg(data.error || "পাসওয়ার্ড রিসেট অনুরোধ প্রক্রিয়া ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setErrorMsg("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDevEmail = (email: string) => {
    setIdentifier(email);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-indigo-500 selection:text-white font-sans">
      {/* Background Lighting Orbs */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="flex items-center gap-2 group text-xs font-bold text-slate-400 hover:text-white transition p-1.5 rounded-xl hover:bg-slate-900"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>লগইন পেজে ফিরে যান</span>
          </Link>
          <span className="text-slate-800">|</span>
          <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider hidden md:inline">
            PTSC Security Recovery
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>
          <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-slate-300 hidden sm:flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Trust Recovery</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-auto">
        <div className="w-full max-w-lg mx-auto space-y-6">

          {/* Form Card */}
          <div className="bg-slate-900/90 border border-indigo-500/20 rounded-3xl shadow-2xl shadow-indigo-950/50 overflow-hidden backdrop-blur-2xl">
            
            {/* Banner */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-950 border-b border-indigo-500/20 text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
                  <KeyRound className="w-7 h-7 text-cyan-400" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-black uppercase tracking-wider">
                  নিরাপদ পাসওয়ার্ড পুনরুদ্ধার
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  পাসওয়ার্ড মনে নেই?
                </h1>
                <p className="text-xs text-slate-400">
                  পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 space-y-5">
              
              {/* Alert Notices */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-start gap-2.5 animate-shake">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successData && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs space-y-3 animate-fade-in">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-300">যাচাইকরণ লিংক প্রস্তুত</p>
                      <p className="text-slate-300 leading-relaxed mt-0.5">{successData.message}</p>
                    </div>
                  </div>

                  {/* Dev Direct Action Box */}
                  {successData.devResetUrl && (
                    <div className="p-3 bg-slate-950/70 rounded-xl border border-emerald-500/30 space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-cyan-300 font-bold">
                          OTP: {successData.devOtpCode}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          মেয়াদ: ১৫ মিনিট
                        </span>
                      </div>
                      <Link
                        href={successData.devResetUrl}
                        className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                      >
                        <span>সরাসরি নতুন পাসওয়ার্ড সেট করুন</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 block">
                    প্রাতিষ্ঠানিক ইমেইল / এমপ্লয়ি আইডি / রোল নম্বর:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="যেমন: admin@pgtsc.gov.bd বা 101"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    নিবন্ধিত ইমেইল বা রোল নম্বর দিয়ে সুরক্ষিত ওটিপি বা রিসেট টোকেন তৈরি করুন।
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>যাচাইকরণ প্রক্রিয়া চলছে...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>রিসেট লিংক / ওটিপি কোড পাঠান</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Developer Quick Access Hints (Auto-Hide in Production) */}
              {process.env.NODE_ENV === "development" && (
                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Developer Quick Access Hints (Dev Mode Only)</span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Dev Active
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    এই কার্ডটি প্রোডাকশন বিল্ডে সম্পূর্ণ নিষ্ক্রিয় ও অদৃশ্য থাকবে। দ্রুত পরীক্ষার জন্য নিচের যেকোনো অ্যাকাউন্টে ক্লিক করুন:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => fillQuickDevEmail("admin@pgtsc.gov.bd")}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-slate-300 hover:text-white transition"
                    >
                      <span className="text-cyan-400 font-bold block">Admin Account</span>
                      <span className="font-mono text-[10px] text-slate-500 truncate block">admin@pgtsc.gov.bd</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillQuickDevEmail("teacher@pgtsc.gov.bd")}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-slate-300 hover:text-white transition"
                    >
                      <span className="text-emerald-400 font-bold block">Teacher Account</span>
                      <span className="font-mono text-[10px] text-slate-500 truncate block">teacher@pgtsc.gov.bd</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillQuickDevEmail("101")}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-slate-300 hover:text-white transition"
                    >
                      <span className="text-purple-400 font-bold block">Student Roll</span>
                      <span className="font-mono text-[10px] text-slate-500 block">Roll: 101</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillQuickDevEmail("accounts@pgtsc.gov.bd")}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-slate-300 hover:text-white transition"
                    >
                      <span className="text-amber-400 font-bold block">Accountant</span>
                      <span className="font-mono text-[10px] text-slate-500 truncate block">accounts@pgtsc.gov.bd</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <Link href="/login?role=admin" className="hover:text-cyan-400 transition flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>প্রশাসনিক লগইন</span>
                </Link>
                <Link href="/login?role=student" className="hover:text-cyan-400 transition flex items-center gap-1">
                  <span>শিক্ষার্থী লগইন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

          </div>

          {/* Footer note */}
          <div className="text-center text-[11px] text-slate-500">
            কারিগরি ও মাদ্রাসা শিক্ষা বিভাগ • বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)
          </div>

        </div>
      </main>

      <footer className="relative z-20 border-t border-slate-900 bg-slate-950/80 py-3 px-4 text-center text-[10px] text-slate-600">
        © ২০২৬ পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) • প্রাতিষ্ঠানিক ডেটা সুরক্ষায় জিরো-ট্রাস্ট এনফোর্সমেন্ট সক্রিয়
      </footer>
    </div>
  );
}
