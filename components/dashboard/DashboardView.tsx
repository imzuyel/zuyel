"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  Cpu,
  Award,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  FileText,
  CreditCard,
  Database,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  Layers,
} from "lucide-react";
import DynamicCounter from "../common/DynamicCounter";
import AnimatedGears from "../common/AnimatedGears";
import { useLanguage } from "@/context/LanguageContext";
import {
  GlowCard,
  AnimatedCounter,
  AnimatedProgress,
  GlowButton,
} from "@/components/ui/animation-effects";

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const { t, language } = useLanguage();
  const [instData, setInstData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/institution")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInstData(data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const stats = instData?.stats || {
    totalStudents: 1240,
    totalFaculty: 48,
    totalWorkshops: 13,
    avgAttendancePercent: 94.8,
  };

  const trades = instData?.trades || [];
  const events = instData?.events || [];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner with Live Clock & Technical Highlight */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative overflow-hidden">
        {/* Animated Background Vector Lines */}
        <div className="absolute top-0 right-0 w-80 h-full opacity-10 pointer-events-none hidden md:block">
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="160" stroke="#38bdf8" strokeWidth="2" strokeDasharray="12 6" />
            <circle cx="200" cy="200" r="120" stroke="#818cf8" strokeWidth="3" />
            <circle cx="200" cy="200" r="80" stroke="#34d399" strokeWidth="2" strokeDasharray="8 4" />
          </svg>
        </div>

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-bold backdrop-blur-xs border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>স্মার্ট ক্যাম্পাস ম্যানেজমেন্ট ২০২৬</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
            পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ ইআরপি
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            পূর্ব জালাসী, তালমা নদী বাঁধ সংলগ্ন, পঞ্চগড় • কারিগরি শিক্ষা অধিদপ্তর ও কারিগরি শিক্ষা বোর্ড অনুমোদিত
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <GlowButton
            variant="amber"
            onClick={() => onNavigate("id_cards")}
            icon={CreditCard}
            className="shadow-lg shadow-amber-500/25"
          >
            আইডি কার্ড স্টুডিও
          </GlowButton>

          <GlowButton
            variant="secondary"
            onClick={() => onNavigate("mysql_workbench")}
            icon={Database}
            className="border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md shadow-sm"
          >
            MySQL কনসোল
          </GlowButton>
        </div>
      </div>

      {/* Dynamic Animated Statistics Counter Section with Radiant Glow */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Students */}
        <GlowCard
          variant="indigo"
          intensity="medium"
          animatedBorder="hover"
          shineSweep={true}
          className="p-5 flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              মোট শিক্ষার্থী
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              <AnimatedCounter
                value={stats.totalStudents}
                suffix=" জন"
                isBengali={language === "bn"}
              />
            </div>
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>৬ষ্ঠ থেকে ১২শ শ্রেণি</span>
            </span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
        </GlowCard>

        {/* Metric 2: Faculty & Instructors */}
        <GlowCard
          variant="teal"
          intensity="medium"
          animatedBorder="hover"
          shineSweep={true}
          className="p-5 flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              শিক্ষক ও কর্মকর্তা
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              <AnimatedCounter
                value={stats.totalFaculty}
                suffix=" জন"
                isBengali={language === "bn"}
              />
            </div>
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400">
              দক্ষ ইন্সট্রাক্টর মণ্ডলী
            </span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.5)] group-hover:scale-110 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
        </GlowCard>

        {/* Metric 3: Technical Labs & Workshops */}
        <GlowCard
          variant="amber"
          intensity="medium"
          animatedBorder="hover"
          shineSweep={true}
          className="p-5 flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              ল্যাব ও ওয়ার্কশপ
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              <AnimatedCounter
                value={stats.totalWorkshops}
                suffix=" টি"
                isBengali={language === "bn"}
              />
            </div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
              ব্যবহারিক যন্ত্রপাতি সজ্জিত
            </span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform">
            <Cpu className="w-6 h-6" />
          </div>
        </GlowCard>

        {/* Metric 4: Practical & Placement Rate */}
        <GlowCard
          variant="rose"
          intensity="medium"
          animatedBorder="hover"
          shineSweep={true}
          className="p-5 flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              গড় উপস্থিতি ও কর্মদক্ষতা
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              <AnimatedCounter
                value={stats.avgAttendancePercent || 94.8}
                decimals={1}
                suffix="%"
                isBengali={language === "bn"}
              />
            </div>
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
              উচ্চ কর্মসংস্থান রেকর্ড
            </span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.5)] group-hover:scale-110 transition-transform">
            <Award className="w-6 h-6" />
          </div>
        </GlowCard>
      </div>

      {/* Grid: Student Progress Bars & Vocational Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Student Progress Bars & Competencies (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>কারিগরি দক্ষতা ও অগ্রগতি নির্দেশক (Student Progress Bars)</span>
            </h3>
            <span className="text-[10px] font-mono text-teal-700 dark:text-teal-400 font-bold">
              সেশন ২০২৬
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Progress 1: Practical Workshop Completion */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-800 dark:text-slate-200">
                  ব্যবহারিক ল্যাব ও প্রজেক্ট সমাপ্তির হার (Practical Lab Hours)
                </span>
                <span className="font-mono text-indigo-600 dark:text-cyan-400">৯২% (Completed)</span>
              </div>
              <AnimatedProgress value={92} color="indigo" height="h-3" showGlow={true} />
            </div>

            {/* Progress 2: Digital Attendance Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-800 dark:text-slate-200">
                  ডিজিটাল উপস্থিতি হার (Average Attendance Rate)
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">৯৪.৮%</span>
              </div>
              <AnimatedProgress value={94.8} color="emerald" height="h-3" showGlow={true} />
            </div>

            {/* Progress 3: BTEB Syllabus Coverage */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-800 dark:text-slate-200">
                  পাঠ্যক্রম অগ্রগতি (BTEB Curriculum Syllabus Coverage)
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400">৮৮%</span>
              </div>
              <AnimatedProgress value={88} color="amber" height="h-3" showGlow={true} />
            </div>

            {/* Progress 4: Vocational Industrial Attachment */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-800 dark:text-slate-200">
                  ইন্ডাস্ট্রিয়াল এটাচমেন্ট ও কর্মমুখী প্রস্তুতি (Industrial Readiness)
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-400">৮৫%</span>
              </div>
              <AnimatedProgress value={85} color="rose" height="h-3" showGlow={true} />
            </div>
          </div>
        </div>

        {/* Right: Academic Event Calendar & Highlights (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>একাডেমিক ক্যালেন্ডার ও আসন্ন ইভেন্ট (Events)</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">২০২৬ বর্ষ</span>
          </div>

          <div className="space-y-3">
            {events.map((ev: any) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3 text-xs"
              >
                <div className="w-12 text-center p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-400 shrink-0 font-mono font-bold border border-indigo-200 dark:border-indigo-800">
                  <span className="block text-xs">{ev.date.split("-")[2]}</span>
                  <span className="block text-[9px] uppercase">Mar/Apr</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white truncate">
                    {ev.titleBangla || ev.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {ev.description}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                    {ev.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Technical Trades Highlights */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
              <span>কারিগরি ট্রেড ও আধুনিক ল্যাবরেটরিসমূহ (Vocational Trades)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              এসএসসি (ভোক) ও এইচএসসি (ভোক) পর্যায়ে অনুমোদিত ৪টি যুগোপযোগী ট্রেড
            </p>
          </div>

          <button
            onClick={() => onNavigate("academic_structure")}
            className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>বিস্তারিত ট্রেড সিলেবাস</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trades.map((trade: any) => (
            <div
              key={trade.id}
              className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-cyan-500 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                    {trade.code.slice(0, 3)}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                    আসন: {trade.seatsMorning + trade.seatsDay}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                    {trade.nameBangla}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {trade.nameEnglish}
                  </p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                  {trade.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span>ল্যাব: {trade.labsCount} টি</span>
                <span className="text-indigo-600 dark:text-cyan-400 font-bold">BTEB Trade</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
