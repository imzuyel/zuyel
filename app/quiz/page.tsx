"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gamepad2,
  Users,
  Sparkles,
  Radio,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  Flame,
  Award,
  GraduationCap,
} from "lucide-react";
import { motion } from "motion/react";

export default function QuizLandingPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().replace(/\D/g, "");
    if (!cleanPin || cleanPin.length < 6) {
      setError("দয়া করে ৬ ডিজিটের গেম পিন প্রদান করুন");
      return;
    }
    router.push(`/quiz/join?pin=${cleanPin}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 sm:py-12 px-4 space-y-8 select-none">
      {/* Hero Badge & Title */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>PTSC ইন্টারেক্টিভ কুইজ ও অ্যাসেসমেন্ট হাব</span>
        </motion.div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
          লাইভ মাল্টিপ্লেয়ার <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">কাহুট-স্টাইল</span> কুইজ
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
          কারিগরি শিক্ষা বোর্ডের কারিকুলাম ভিত্তিক স্মার্ট রিয়েল-টাইম মূল্যায়ন, পিডিএফ থেকে এআই প্রশ্ন প্রস্তুতি এবং লাইভ লিডারবোর্ড।
        </p>
      </div>

      {/* Main Dual Cards: Student PIN Join & Teacher Host Launch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Student Quick Join Card */}
        <div className="relative rounded-3xl bg-slate-900/80 border-2 border-cyan-500/40 p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_35px_rgba(6,182,212,0.2)] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                শিক্ষার্থী জোন
              </span>
              <span className="text-[11px] text-slate-400 font-mono">লাইভ পিন যুক্ত হোন</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white">
              ৬-ডিজিট গেম পিন দিয়ে জয়েন করুন
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              শিক্ষক বা হোস্টের স্ক্রিনে প্রদর্শিত ৬ ডিজিটের গেম পিন টাইপ করে সরাসরি লাইভ কুইজ লবিতে প্রবেশ করুন।
            </p>

            <form onSubmit={handleQuickJoin} className="space-y-3 pt-2">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                  placeholder="৬-ডিজিট পিন (যেমন: ৮৮৯১২০)"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border-2 border-cyan-500/40 focus:border-cyan-400 text-center font-mono text-2xl font-black tracking-widest text-cyan-300 placeholder:text-slate-600 dark:text-slate-400 focus:outline-none transition shadow-inner"
                />
                {error && <p className="text-rose-400 text-xs font-medium mt-1.5 text-center">{error}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm uppercase tracking-wider transition transform active:scale-98 shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>কুইজে প্রবেশ করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              স্পিড বোনাস পয়েন্ট
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              স্ট্রিক কাউন্টার
            </span>
          </div>
        </div>

        {/* Teacher / Host Live Arena Card */}
        <div className="relative rounded-3xl bg-slate-900/80 border-2 border-purple-500/40 p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_35px_rgba(168,85,247,0.2)] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                শিক্ষক / হোস্ট জোন
              </span>
              <span className="text-[11px] text-purple-300 font-mono">হোস্ট কন্ট্রোল হাব</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white">
              হোস্ট লাইভ কুইজ ও মাল্টিপ্লেয়ার লবি
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              ৬-ডিজিট গেম পিন ও কিউআর কোড তৈরি করুন, প্রজেক্টরে প্রশ্ন সম্প্রচার করুন এবং রিয়েল-টাইম লিডারবোর্ডে শিক্ষার্থীদের অগ্রগতি দেখুন।
            </p>

            <div className="space-y-2.5 pt-2">
              <Link
                href="/live-quizzes?tab=create_quiz"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider transition transform active:scale-98 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
                <span>AI দিয়ে সরাসরি কুইজ তৈরি ও এডিট করুন</span>
              </Link>

              <Link
                href="/live-quizzes"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition transform active:scale-98 shadow-md shadow-purple-500/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>হোস্ট লবি ও এরিনা চালু করুন</span>
              </Link>

              <Link
                href="/ai/generator"
                className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>পিডিএফ থেকে এআই প্রশ্ন তৈরি করুন</span>
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              লাইভ ৩ডি পডিয়াম
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              সেন্ট্রাল প্রশ্নব্যাংক
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
