"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, BookOpen, GraduationCap, Bell, Lock, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ForbiddenSecurityPage() {
  const { currentUser, switchRole } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full bg-slate-900/90 border border-rose-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Institutional Header */}
        <div className="text-center pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <p className="text-[11px] font-black tracking-widest text-rose-400 uppercase">
            PTSC ERP Security Governance Engine
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            ৪০৩ অ্যাক্সেস সংরক্ষিত (Access Forbidden)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            জিরো-ট্রাস্ট শিক্ষার্থী সুরক্ষা নীতি (Zero-Trust Student Protection Policy Enforced)
          </p>
        </div>

        {/* Security Message Details */}
        <div className="py-6 space-y-4">
          <div className="bg-rose-950/40 border border-rose-900/50 rounded-2xl p-4 text-xs text-rose-200 leading-relaxed space-y-2">
            <p className="font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
              <span>প্রশাসনিক ব্যাকএন্ড শিক্ষার্থীদের জন্য সম্পূর্ণ সংরক্ষিত</span>
            </p>
            <p className="text-slate-300 text-[11px]">
              আপনার বর্তমান সক্রিয় ভূমিকা: <strong className="text-rose-300 font-mono font-black">{currentUser.role.toUpperCase()}</strong> ({currentUser.nameBangla || currentUser.fullName})। পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের প্রাতিষ্ঠানিক নিরাপত্তা বিধান অনুসারে শিক্ষার্থীরা কোনো প্রশাসনিক মডিউল, পরীক্ষা নিয়ন্ত্রণ কেন্দ্র, হাজিরা পরিচালনা বা AI প্রশ্ন জেনারেশন স্টুডিওতে প্রবেশ করতে পারবে না।
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">অনুমোদিত শিক্ষার্থী পোর্টালসমূহ:</span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/results"
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/70 hover:bg-indigo-950/60 border border-slate-700/40 hover:border-indigo-500/40 text-xs transition-colors"
              >
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span>একাডেমিক ফলাফল</span>
              </Link>
              <Link
                href="/learning-library"
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/70 hover:bg-emerald-950/60 border border-slate-700/40 hover:border-emerald-500/40 text-xs transition-colors"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>লার্নিং লাইব্রেরি</span>
              </Link>
              <Link
                href="/notices"
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/70 hover:bg-cyan-950/60 border border-slate-700/40 hover:border-cyan-500/40 text-xs transition-colors"
              >
                <Bell className="w-4 h-4 text-cyan-400" />
                <span>অফিসিয়াল নোটিশ</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/70 hover:bg-purple-950/60 border border-slate-700/40 hover:border-purple-500/40 text-xs transition-colors"
              >
                <Home className="w-4 h-4 text-purple-400" />
                <span>হোমপেজ</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Action Controls & Fast Role Switch for testing */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>হোমে যান</span>
            </Link>
            <Link
              href="/admin/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>প্রশাসনিক লগইন করুন</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-[10px] text-slate-500">টেস্টিং রোল সুইচ:</span>
            <button
              onClick={() => {
                switchRole("principal");
                window.location.href = "/admin";
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition-all cursor-pointer"
            >
              অধ্যক্ষ মোড
            </button>
            <button
              onClick={() => {
                switchRole("teacher");
                window.location.href = "/admin";
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer"
            >
              শিক্ষক মোড
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
