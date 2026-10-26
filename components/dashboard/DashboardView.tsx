"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  Cpu,
  Award,
  Calendar,
  Clock,
  TrendingUp,
  CreditCard,
  Database,
  ArrowRight,
  Sparkles,
  Activity,
  CheckCircle2,
  Zap,
  CalendarCheck,
  BookOpen,
  FileText,
  RefreshCw,
} from "lucide-react";
import DynamicCounter from "../common/DynamicCounter";
import { useLanguage } from "@/context/LanguageContext";
import { GlowButton, AnimatedProgress } from "@/components/ui/animation-effects";

// =============================================================================
// MODERN PULSING SKELETON LOADER COMPONENT
// =============================================================================

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading dashboard data">
      {/* Top Banner Skeleton */}
      <div className="rounded-3xl bg-slate-200/70 dark:bg-slate-800/60 h-44 p-6 sm:p-8 flex flex-col justify-between border border-slate-300/40 dark:border-slate-700/40">
        <div className="space-y-3">
          <div className="h-5 w-40 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="h-8 w-3/4 max-w-md rounded-xl bg-slate-300 dark:bg-slate-700" />
          <div className="h-4 w-1/2 max-w-sm rounded-lg bg-slate-300 dark:bg-slate-700" />
        </div>
        <div className="flex gap-3 mt-4">
          <div className="h-9 w-32 rounded-xl bg-slate-300 dark:bg-slate-700" />
          <div className="h-9 w-32 rounded-xl bg-slate-300 dark:bg-slate-700" />
        </div>
      </div>

      {/* 4 Summary Cards Glassmorphic Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-slate-200/60 dark:border-white/10 flex items-center justify-between"
          >
            <div className="space-y-2.5">
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700/80" />
              <div className="h-8 w-24 rounded-lg bg-slate-300 dark:bg-slate-600" />
              <div className="h-2.5 w-16 rounded bg-slate-200 dark:bg-slate-700/80" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700/80" />
          </div>
        ))}
      </div>

      {/* Grid: Progress Indicators & Calendar Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-slate-200/60 dark:border-white/10 space-y-5">
          <div className="flex justify-between border-b border-slate-200/40 dark:border-slate-800 pb-3">
            <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700/80" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 p-6 rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-slate-200/60 dark:border-white/10 space-y-4">
          <div className="flex justify-between border-b border-slate-200/40 dark:border-slate-800 pb-3">
            <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-14 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="h-16 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD VIEW COMPONENT
// =============================================================================

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const { language } = useLanguage();
  const [instData, setInstData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Concurrently fetch both live dashboard summary metrics and institutional structure
  useEffect(() => {
    let isSubscribed = true;

    async function fetchDashboardMetrics() {
      try {
        const [instRes, summaryRes] = await Promise.allSettled([
          fetch("/api/institution"),
          fetch("/api/dashboard/summary"),
        ]);

        if (instRes.status === "fulfilled" && instRes.value.ok) {
          const instJson = await instRes.value.json();
          if (isSubscribed && instJson.success) {
            setInstData(instJson);
          }
        }

        if (summaryRes.status === "fulfilled" && summaryRes.value.ok) {
          const summaryJson = await summaryRes.value.json();
          if (isSubscribed && summaryJson.success) {
            setSummaryData(summaryJson.data);
          }
        }
      } catch (err) {
        console.error("[DashboardView] Error loading dashboard data:", err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    fetchDashboardMetrics();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Compute live statistics with graceful defaults
  const kpi = summaryData?.kpi;
  const stats = {
    totalStudents: kpi?.totalStudents ?? instData?.stats?.totalStudents ?? 1240,
    totalFaculty: kpi?.totalFaculty ?? instData?.stats?.totalFaculty ?? 48,
    totalWorkshops: instData?.stats?.totalWorkshops ?? 13,
    avgAttendancePercent: kpi?.todayAttendancePercent ?? instData?.stats?.avgAttendancePercent ?? 94.8,
  };

  const trades = instData?.trades || [];
  const events = instData?.events || [];

  // Framer-motion stagger variants for smooth fade-in-up mounting
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const cardVariants: any = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1], // Natural cubic-bezier easing
      },
    },
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* =======================================================================
          TASK 1: ULTRA-SLEEK SINGLE-ROW EXECUTIVE COMMAND BAR
          (Completely Replaces Old Welcome / Admin Name Hero Banner)
          ======================================================================= */}
      <div className="h-auto sm:h-14 px-4 sm:px-5 py-2.5 sm:py-0 rounded-2xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 transition-all">
        {/* Left: Live Pulse Indicator & Active Academic Session */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 tracking-tight">
              ✨ প্রাতিষ্ঠানিক ড্যাশবোর্ড ওভারভিউ
            </span>
          </div>

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>

          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-[11px] font-black text-indigo-700 dark:text-indigo-300">
            শিক্ষাবর্ষ ২০২৬
          </span>
        </div>

        {/* Center/Right: Quick Action Colored Pills with hover lift */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
          <button
            type="button"
            onClick={() => onNavigate("quiz_admin")}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs shadow-sm hover:shadow-md hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ লাইভ কুইজ</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("attendance")}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-sm hover:shadow-md hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>📲 QR হাজিরা</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("course_content_builder")}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xs shadow-sm hover:shadow-md hover:shadow-amber-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>✍️ নতুন লার্নিং কন্টেন্ট</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("bangla_docs")}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-xs shadow-sm hover:shadow-md hover:shadow-cyan-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>📄 প্রত্যয়নপত্র</span>
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="ডাটাবেস রিফ্রেশ"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          SUMMARY CARDS: GLASSMORPHISM, SUBTLE CONTAINED GLOW, & GRADIENT NUMBERS
          ===================================================================== */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Metric 1: Total Students */}
        <motion.div
          variants={cardVariants}
          className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-md transition-all duration-300 border
                     bg-white/70 dark:bg-white/10 border-slate-200/80 dark:border-white/10
                     hover:shadow-[0_0_10px_rgba(79,70,229,0.15)] dark:hover:shadow-[0_0_12px_rgba(99,102,241,0.20)]
                     hover:border-indigo-500/30 group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              মোট শিক্ষার্থী
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-300">
                <DynamicCounter
                  end={stats.totalStudents}
                  suffix=" জন"
                  isBengali={language === "bn"}
                />
              </span>
            </div>
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>৬ষ্ঠ থেকে ১২শ শ্রেণি</span>
            </span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Users className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Metric 2: Faculty & Instructors */}
        <motion.div
          variants={cardVariants}
          className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-md transition-all duration-300 border
                     bg-white/70 dark:bg-white/10 border-slate-200/80 dark:border-white/10
                     hover:shadow-[0_0_10px_rgba(13,148,136,0.15)] dark:hover:shadow-[0_0_12px_rgba(20,184,166,0.20)]
                     hover:border-teal-500/30 group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              শিক্ষক ও কর্মকর্তা
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 dark:from-teal-300 dark:via-emerald-300 dark:to-cyan-200">
                <DynamicCounter
                  end={stats.totalFaculty}
                  suffix=" জন"
                  isBengali={language === "bn"}
                />
              </span>
            </div>
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400">
              দক্ষ ইন্সট্রাক্টর মণ্ডলী
            </span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <GraduationCap className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Metric 3: Technical Labs & Workshops */}
        <motion.div
          variants={cardVariants}
          className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-md transition-all duration-300 border
                     bg-white/70 dark:bg-white/10 border-slate-200/80 dark:border-white/10
                     hover:shadow-[0_0_10px_rgba(217,119,6,0.15)] dark:hover:shadow-[0_0_12px_rgba(245,158,11,0.20)]
                     hover:border-amber-500/30 group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              ল্যাব ও ওয়ার্কশপ
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 dark:from-amber-300 dark:via-yellow-300 dark:to-orange-200">
                <DynamicCounter
                  end={stats.totalWorkshops}
                  suffix=" টি"
                  isBengali={language === "bn"}
                />
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
              ব্যবহারিক যন্ত্রপাতি সজ্জিত
            </span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Cpu className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Metric 4: Practical & Attendance Rate */}
        <motion.div
          variants={cardVariants}
          className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-md transition-all duration-300 border
                     bg-white/70 dark:bg-white/10 border-slate-200/80 dark:border-white/10
                     hover:shadow-[0_0_10px_rgba(225,29,72,0.15)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.20)]
                     hover:border-rose-500/30 group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              গড় উপস্থিতি ও কর্মদক্ষতা
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 dark:from-rose-400 dark:via-pink-300 dark:to-red-200">
                <DynamicCounter
                  end={Math.round(stats.avgAttendancePercent)}
                  suffix="%"
                  isBengali={language === "bn"}
                />
              </span>
            </div>
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
              উচ্চ কর্মসংস্থান রেকর্ড
            </span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Award className="w-6 h-6" />
          </div>
        </motion.div>
      </motion.div>

      {/* Grid: Student Progress Bars & Vocational Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Student Progress Bars & Competencies (7 cols) */}
        <div className="lg:col-span-7 bg-white/70 dark:bg-white/5 backdrop-blur-md p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-white/10 space-y-5">
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
              <AnimatedProgress value={92} color="indigo" height="h-3" showGlow={false} />
            </div>

            {/* Progress 2: Digital Attendance Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-800 dark:text-slate-200">
                  ডিজিটাল উপস্থিতি হার (Average Attendance Rate)
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">৯৪.৮%</span>
              </div>
              <AnimatedProgress value={94.8} color="emerald" height="h-3" showGlow={false} />
            </div>

            {/* Progress 3: BTEB Syllabus Coverage */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-800 dark:text-slate-200">
                  পাঠ্যক্রম অগ্রগতি (BTEB Curriculum Syllabus Coverage)
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400">৮৮%</span>
              </div>
              <AnimatedProgress value={88} color="amber" height="h-3" showGlow={false} />
            </div>

            {/* Progress 4: Vocational Industrial Attachment */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-800 dark:text-slate-200">
                  ইন্ডাস্ট্রিয়াল এটাচমেন্ট ও কর্মমুখী প্রস্তুতি (Industrial Readiness)
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-400">৮৫%</span>
              </div>
              <AnimatedProgress value={85} color="rose" height="h-3" showGlow={false} />
            </div>
          </div>
        </div>

        {/* Right: Academic Event Calendar & Highlights (5 cols) */}
        <div className="lg:col-span-5 bg-white/70 dark:bg-white/5 backdrop-blur-md p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>একাডেমিক ক্যালেন্ডার ও আসন্ন ইভেন্ট (Events)</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">২০২৬ বর্ষ</span>
          </div>

          <div className="space-y-3">
            {events.length > 0 ? (
              events.map((ev: any) => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 text-xs"
                >
                  <div className="w-12 text-center p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-400 shrink-0 font-mono font-bold border border-indigo-200 dark:border-indigo-800">
                    <span className="block text-xs">{ev.date?.split("-")?.[2] || "০১"}</span>
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
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                কোনো আসন্ন ইভেন্ট তালিকাভুক্ত নেই।
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Technical Trades Highlights */}
      <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-white/10 space-y-4">
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
            className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>বিস্তারিত ট্রেড সিলেবাস</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trades.map((trade: any) => (
            <div
              key={trade.id}
              className="p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    {trade.code?.slice(0, 3)}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                    আসন: {(trade.seatsMorning || 0) + (trade.seatsDay || 0)}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                    {trade.nameBangla}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {trade.nameEnglish || trade.name}
                  </p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                  {trade.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span>ল্যাব: {trade.labsCount || 0} টি</span>
                <span className="text-indigo-600 dark:text-cyan-400 font-bold">BTEB Trade</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
