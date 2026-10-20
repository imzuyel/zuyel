"use client";

import React from "react";
import Link from "next/link";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { Sliders, ShieldCheck, Lock, ArrowRight, Server, Cpu } from "lucide-react";

export default function AiSettingsPage() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between">
      <PublicHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-8 flex flex-col items-center justify-center">
        <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-10 space-y-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-purple-500 rounded-b-full" />

          {/* Icon Header */}
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
            <Server className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 text-xs font-bold border border-indigo-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Backend Centralized Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              এআই মডেল সেটিংস ও অ্যাডভান্সড কনফিগারেশন
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              এআই মডেলের তাপমাত্রা (Temperature), API প্রোভাইডার সেটিংস, এবং ফেলওভার রেসপন্স কনফিগারেশন সুরক্ষিত ব্যাকএন্ড সার্ভারে সংসংগঠিত করা হয়েছে। ফ্রন্টএন্ড থেকে এগুলো পরিবর্তনযোগ্য নয়।
            </p>
          </div>

          {/* Info Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-cyan-400 font-bold text-xs">
                <Cpu className="w-4 h-4" />
                <span>অটোমেটিক ব্যাকএন্ড লোড ব্যালেন্সিং</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                সার্ভার ব্যাকএন্ড স্বয়ংক্রিয়ভাবে প্রোভাইডার এবং রেট লিমিট হ্যান্ডেল করে।
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <Lock className="w-4 h-4" />
                <span>ইনস্টিটিউশনাল সিকিউরিটি</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                API Key এবং সংবেদনশীল প্রম্পট সেটিংস ব্যাকএন্ড এনভায়রনমেন্টে সুরক্ষিত।
              </p>
            </div>
          </div>

          {/* Admin CTA Link */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/admin/ai-settings"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <Lock className="w-4 h-4 text-cyan-300" />
              <span>এডমিন ব্যাকএন্ড কনফিগারেশনে যান</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

