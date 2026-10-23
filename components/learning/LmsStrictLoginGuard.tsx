"use client";

import React, { useState } from "react";
import {
  Lock,
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  Zap,
  CheckCircle2,
  Cloud,
  ArrowRight,
} from "lucide-react";
import StudentLoginModal from "@/components/auth/StudentLoginModal";
import { StudentAuthAccount } from "@/lib/studentIntelligenceStore";

interface LmsStrictLoginGuardProps {
  currentClassParam?: string;
  onSuccessLogin?: (account: StudentAuthAccount) => void;
  title?: string;
  subtitle?: string;
}

export default function LmsStrictLoginGuard({
  currentClassParam,
  onSuccessLogin,
  title = "পিটিএসসি ডিজিটাল লার্নিং পোর্টাল (LMS)",
  subtitle = "পাঠ্যসূচি, ভিডিও লেকচার, লার্নিং রোডম্যাপ ও কুইজ অ্যাক্সেস করতে অনুগ্রহ করে লগইন করুন।",
}: LmsStrictLoginGuardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const initialClass = (() => {
    if (!currentClassParam) return "class-10";
    const clean = currentClassParam.toLowerCase();
    if (clean.includes("9")) return "class-9";
    if (clean.includes("8")) return "class-8";
    if (clean.includes("7")) return "class-7";
    if (clean.includes("6")) return "class-6";
    if (clean.includes("11")) return "class-11";
    if (clean.includes("12")) return "class-12";
    return "class-10";
  })();

  const handleSuccess = (account: StudentAuthAccount) => {
    setModalOpen(false);
    if (typeof onSuccessLogin === "function") {
      onSuccessLogin(account);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto my-8 animate-fade-in">
      <div className="rgb-neon-border-card rounded-3xl p-[2px] shadow-2xl">
        <div className="rgb-neon-border-inner rounded-[22px] bg-white dark:bg-slate-950 p-6 sm:p-8 space-y-6">
          
          {/* Header Banner */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-black uppercase tracking-wider">
              <Cloud className="w-3.5 h-3.5 text-cyan-500" />
              <span>লগইন আবশ্যক · STRICT LMS AUTH</span>
            </div>

            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Lock className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Features Highlights */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
              <span>অধ্যায়ভিত্তিক ইন্টারঅ্যাক্টিভ রোডম্যাপ ও ডুওলিঙ্গো পাথওয়ে</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>প্রিমিয়াম ২০টি কুইজ টেমপ্লেট ও লাইভ অ্যান্টি-চিট এক্সাম</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
              <span>অর্জিত XP, অগ্রগতি ও পাসওয়ার্ড ক্লাউড প্রোফাইলে স্থায়ী সংরক্ষণ</span>
            </div>
          </div>

          {/* Single Streamlined Modal Trigger */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/45 cursor-pointer transition-all active:scale-[0.98]"
          >
            <GraduationCap className="w-4 h-4" />
            <span>শিক্ষার্থী লগইন পপ-আপ খুলুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
            * পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)-এর সকল শিক্ষার্থীর রোল নম্বর ও ডিফল্ট পাসওয়ার্ড (1234) দিয়ে প্রথমবার লগইন করুন।
          </p>

        </div>
      </div>

      {/* Streamlined Universal Student Login Modal */}
      <StudentLoginModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultClass={initialClass}
        onSuccessLogin={handleSuccess}
      />
    </div>
  );
}
