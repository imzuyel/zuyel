"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ResetPasswordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  const urlToken = searchParams.get("token") || "";
  const urlEmail = searchParams.get("email") || "";

  const [tokenOrCode, setTokenOrCode] = useState(urlToken);
  const [email, setEmail] = useState(urlEmail);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [targetRedirect, setTargetRedirect] = useState("/login?role=admin");

  useEffect(() => {
    if (urlToken) setTokenOrCode(urlToken);
    if (urlEmail) setEmail(urlEmail);
  }, [urlToken, urlEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanInput = tokenOrCode.trim();
    const cleanPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanInput) {
      setErrorMsg("অনুগ্রহ করে আপনার রিসেট টোকেন বা ৬-সংখ্যার ওটিপি কোড দিন।");
      return;
    }

    if (!cleanPass) {
      setErrorMsg("নতুন পাসওয়ার্ড প্রদান করুন।");
      return;
    }

    if (cleanPass.length < 4) {
      setErrorMsg("পাসওয়ার্ড কমপক্ষে ৪ ডিজিট বা অক্ষরের হতে হবে।");
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMsg("উভয় পাসওয়ার্ড হুবহু মেলেনি। অনুগ্রহ করে সতর্কতার সাথে মিলিয়ে লিখুন।");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: cleanInput.includes(".") ? cleanInput : undefined,
          code: /^\d{6}$/.test(cleanInput) ? cleanInput : undefined,
          email: email.trim().toLowerCase() || undefined,
          newPassword: cleanPass,
          confirmPassword: cleanConfirm,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || "পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!");
        setTargetRedirect(data.redirectUrl || "/admin/login");
      } else {
        setErrorMsg(data.error || "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setErrorMsg("সার্ভারে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-indigo-500 selection:text-white font-sans">
      {/* Background Lighting */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          href="/login"
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition p-1.5 rounded-xl hover:bg-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>লগইন পেজে ফিরে যান</span>
        </Link>

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
            <span>PTSC Secure Identity</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-auto">
        <div className="w-full max-w-lg mx-auto space-y-6">

          <div className="bg-slate-900/90 border border-indigo-500/20 rounded-3xl shadow-2xl shadow-indigo-950/50 overflow-hidden backdrop-blur-2xl">
            
            {/* Header Banner */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-950 border-b border-indigo-500/20 text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-cyan-400" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-black uppercase tracking-wider">
                  ক্রিপ্টোগ্রাফিক সুরক্ষা
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  নতুন পাসওয়ার্ড নির্ধারণ
                </h1>
                <p className="text-xs text-slate-400">
                  পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 space-y-5">
              
              {/* Alert status */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-start gap-2.5 animate-shake">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs space-y-3 text-center animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে!</h3>
                    <p className="text-slate-300 mt-1">{successMsg}</p>
                  </div>
                  <Link
                    href={targetRedirect}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition mt-2"
                  >
                    <span>লগইন করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {!successMsg && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Token or 6-digit Code input if not already pre-filled via URL */}
                  {!urlToken && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-200 block">
                          রিসেট টোকেন অথবা ৬-সংখ্যার ওটিপি কোড:
                        </label>
                        <input
                          type="text"
                          value={tokenOrCode}
                          onChange={(e) => setTokenOrCode(e.target.value)}
                          placeholder="যেমন: 749201 অথবা সম্পূর্ণ টোকেন"
                          className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                          required
                        />
                      </div>

                      {/^\d{6}$/.test(tokenOrCode.trim()) && (
                        <div className="space-y-1.5 animate-fade-in">
                          <label className="text-xs font-bold text-slate-200 block">
                            আপনার নিবন্ধিত ইমেইল (ওটিপি যাচাইয়ের জন্য):
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@pgtsc.gov.bd"
                            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            required
                          />
                        </div>
                      )}
                    </>
                  )}

                  {urlToken && (
                    <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs font-mono text-cyan-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                        <span>যাচাইকৃত রিসেট টোকেন সক্রিয়</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">Verified</span>
                    </div>
                  )}

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200 block">
                      নতুন গোপন পাসওয়ার্ড:
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="কমপক্ষে ৪ অক্ষরের নতুন পাসওয়ার্ড"
                        className="w-full pl-3 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200 block">
                      পাসওয়ার্ড নিশ্চিত করুন:
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="একই পাসওয়ার্ড পুনরায় লিখুন"
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 transition cursor-pointer disabled:opacity-50 mt-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>পাসওয়ার্ড সংরক্ষণ হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>পাসওয়ার্ড সংরক্ষণ ও পরিবর্তন সম্পন্ন করুন</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Back to login */}
              <div className="pt-2 border-t border-slate-800/80 text-center">
                <Link
                  href="/login"
                  className="text-xs text-slate-400 hover:text-cyan-400 transition"
                >
                  লগইন পেজে ফিরে যান
                </Link>
              </div>

            </div>

          </div>

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
