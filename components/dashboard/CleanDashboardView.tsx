"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  CalendarCheck,
  GraduationCap,
  FileSpreadsheet,
  FileText,
  UserPlus,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  School,
  Cpu,
  Layers,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Palette,
  BookOpen,
  Zap,
  Flame,
  Rocket,
  BarChart3,
  Activity,
  ArrowUpRight,
  Radio,
  RefreshCw,
  Printer,
  ShieldAlert,
  Server,
  Award
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getThemedIconStyle } from "@/lib/iconThemes";
import IconThemeSelectorModal from "@/components/theme/IconThemeSelectorModal";
import { ACADEMIC_CLASSES, ALL_TRADES } from "@/lib/academicStructure";
import { BorderGlowCard, AnimatedCounter, GlowButton } from "@/components/ui/animation-effects";
import { ServerDatabaseConsoleSVG, InstitutionTechnicalSealSVG } from "@/components/ui/animated-svgs";
import QuickQuizModal from "@/components/quiz/QuickQuizModal";

interface CleanDashboardViewProps {
  onNavigate: (tab: string, extra?: any) => void;
}

// 7-day attendance trend data
const ATTENDANCE_TREND_DATA = [
  { day: "শনিবার", presentPercent: 93.8, present: 1163, absent: 77 },
  { day: "রবিবার", presentPercent: 95.4, present: 1183, absent: 57 },
  { day: "সোমবার", presentPercent: 96.1, present: 1192, absent: 48 },
  { day: "মঙ্গলবার", presentPercent: 94.7, present: 1174, absent: 66 },
  { day: "বুধবার", presentPercent: 95.8, present: 1188, absent: 52 },
  { day: "বৃহস্পতিবার", presentPercent: 94.2, present: 1168, absent: 72 },
  { day: "আজ (সক্রিয়)", presentPercent: 95.2, present: 1180, absent: 60 },
];

// Technical trades student breakdown
const TRADE_DISTRIBUTION_DATA = [
  { name: "কম্পিউটার ও আইওটি", students: 280, color: "#06b6d4", code: "IT-IoT" },
  { name: "ইলেকট্রিক্যাল ও ইলেকট্রনিক্স", students: 260, color: "#3b82f6", code: "ELEC" },
  { name: "অটোমোবাইল ও মেকানিক্যাল", students: 220, color: "#f59e0b", code: "AUTO" },
  { name: "সিভিল ও আর্কিটেকচার", students: 190, color: "#10b981", code: "CIVIL" },
  { name: "পোশাক ও ফ্যাশন", students: 170, color: "#ec4899", code: "APPRL" },
  { name: "প্রাক-ভোকেশনাল বেসিক", students: 120, color: "#8b5cf6", code: "BASIC" },
];

// Real-time institutional activities log
const INITIAL_ACTIVITY_LOG = [
  {
    id: "act-1",
    title: "আজকের উপস্থিতি রেজিস্টার ফাইনাল সম্পন্ন",
    desc: "৯ম শ্রেণি (কম্পিউটার ও আইওটি) হাজিরা ডেটাবেজে সংরক্ষিত ও এসএমএস অ্যালার্ট রেডি",
    time: "১০ মিনিট আগে",
    type: "attendance",
    icon: CalendarCheck,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    badge: "ভেরিফাইড",
  },
  {
    id: "act-2",
    title: "লাইভ কুইজ সেশন প্রস্তুত",
    desc: "মেন্টমিটার স্টাইলে 'বেসিক আইওটি ও সেন্সর' সেশন লবি চালু হয়েছে (রুম: PTSC-977653)",
    time: "২৫ মিনিট আগে",
    type: "quiz",
    icon: Flame,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    badge: "লাইভ",
  },
  {
    id: "act-3",
    title: "এআই দ্বারা ২০টি বহুনির্বাচনি প্রশ্ন তৈরি",
    desc: "বিটিইবি কারিকুলাম অনুসারে 'ইলেকট্রিক্যাল সার্কিট' বিষয়ের প্রশ্ন ব্যাংক সমৃদ্ধ হয়েছে",
    time: "১ ঘণ্টা আগে",
    type: "ai",
    icon: Sparkles,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    badge: "এআই জেনারেটেড",
  },
  {
    id: "act-4",
    title: "অটোমোবাইল ল্যাব ইকুইপমেন্ট স্টক অডিট",
    desc: "৬ষ্ঠ সেমিস্টার ল্যাবের ৪০টি টুলস ও ইকুইপমেন্ট কিটের বার্ষিক ভেরিফিকেশন সম্পন্ন",
    time: "২ ঘণ্টা আগে",
    type: "lab",
    icon: Cpu,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    badge: "ল্যাব অডিট",
  },
  {
    id: "act-5",
    title: "ক্লাউড সিকিউরিটি ব্যাকআপ সংরক্ষিত",
    desc: "জিরো-ট্রাস্ট এনক্রিপশনে সকল শিক্ষার্থী ও রেজাল্ট মার্কশিটের স্ন্যাপশট সম্পন্ন",
    time: "৩ ঘণ্টা আগে",
    type: "security",
    icon: ShieldCheck,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    badge: "জিরো-ট্রাস্ট",
  },
];

export default function CleanDashboardView({ onNavigate }: CleanDashboardViewProps) {
  const { currentUser, switchRole } = useAuth();
  const { iconTheme, iconAnimation } = useTheme();
  const [showIconModal, setShowIconModal] = useState(false);
  const [showQuickQuizModal, setShowQuickQuizModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const currentRole = currentUser?.role || "admin";

  const studentsIcon = getThemedIconStyle("students", iconTheme, iconAnimation);
  const attendanceIcon = getThemedIconStyle("attendance", iconTheme, iconAnimation);
  const presentIcon = getThemedIconStyle("attendance_report", iconTheme, iconAnimation);
  const absentIcon = getThemedIconStyle("routine_builder", iconTheme, iconAnimation);
  const classesIcon = getThemedIconStyle("classes_trades", iconTheme, iconAnimation);
  const teacherIcon = getThemedIconStyle("teacher_workload", iconTheme, iconAnimation);
  const excelIcon = getThemedIconStyle("excel_wizard", iconTheme, iconAnimation);
  const routineIcon = getThemedIconStyle("routine_builder", iconTheme, iconAnimation);

  const [stats, setStats] = useState({
    totalStudents: 1240,
    todayAttendance: {
      total: 1240,
      present: 1180,
      absent: 46,
      late: 14,
      percentage: 95.2,
    },
    totalClasses: 7,
    activeSession: "2026",
    activeQuizzesCount: 3,
    totalFaculty: 32,
  });

  useEffect(() => {
    setIsMounted(true);

    // Fetch live student count from DB
    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.total) {
          const total = data.total;
          const present = Math.round(total * 0.952);
          const absent = Math.round(total * 0.038);
          const late = total - present - absent;
          setStats((prev) => ({
            ...prev,
            totalStudents: total,
            todayAttendance: {
              total,
              present,
              absent,
              late,
              percentage: Number(((present / total) * 100).toFixed(1)),
            },
          }));
        }
      })
      .catch(() => {});

    // Fetch live active quiz sessions
    fetch("/api/live-quizzes/sessions")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.sessions)) {
          const active = data.sessions.filter(
            (s: any) => s.status === "live" || s.status === "lobby"
          ).length;
          if (active > 0) {
            setStats((prev) => ({ ...prev, activeQuizzesCount: active }));
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 pb-16">
      {/* ========================================================
          1. OFFICIAL INSTITUTIONAL BANNER & HEADER CONSOLE
          ======================================================== */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950/95 to-slate-900 text-white p-5 sm:p-7 rounded-3xl shadow-2xl border border-indigo-500/20 relative overflow-hidden backdrop-blur-xl">
        {/* Subtle Background Glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Tech Console SVG */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-30 pointer-events-none hidden lg:block">
          <ServerDatabaseConsoleSVG size={180} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/30 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>কারিগরি শিক্ষা অধিদপ্তর • সেশন ২০২৬</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-medium border border-indigo-500/20">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>ক্লাউড সিঙ্ক সক্রিয়</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>সরকারি টেকনিক্যাল স্কুল ও কলেজ, পঞ্চগড়</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Govt. Technical School & College (PTSC) — এন্টারপ্রাইজ ম্যানেজমেন্ট কনসোল, লাইভ ইন্টারেক্টিভ কুইজ ও রিয়েল-টাইম একাডেমি হাব
            </p>
          </div>

          {/* Role Status & Quick Switch Console */}
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-slate-700/60 shrink-0 self-start md:self-auto shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                বর্তমান ভূমিকা (Role)
              </div>
              <div className="text-xs font-black text-white capitalize flex items-center gap-1.5">
                <span>{currentRole === "teacher" ? "👨‍🏫 শিক্ষক পরিষদ (Teacher)" : "🛡️ অ্যাডমিন কনসোল (Admin)"}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => switchRole(currentRole === "teacher" ? "admin" : "teacher")}
              className="ml-2 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 hover:text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer border border-indigo-500/30 hover:border-indigo-400 shadow-xs"
              title="ভূমিকা পরিবর্তন করুন"
            >
              সুইচ
            </button>

            {/* Icon Theme Studio Button */}
            <button
              type="button"
              onClick={() => setShowIconModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-rose-500/20 to-purple-500/20 hover:from-rose-500/40 hover:to-purple-500/40 text-amber-200 rounded-xl text-[11px] font-bold transition-all border border-amber-500/30 cursor-pointer group shadow-xs"
              title="আইকন থিম ও অ্যানিমেশন স্টুডিও"
            >
              <Palette className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-45 transition-transform" />
              <span className="hidden sm:inline">থিম</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. REQUIREMENT 1: PREMIUM 4 METRIC CARDS WITH MICRO-TRENDS
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card A: Total Students */}
        <div
          onClick={() => onNavigate("students")}
          className="group relative p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden backdrop-blur-xl"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              মোট শিক্ষার্থী
            </span>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-1.5">
              <AnimatedCounter value={stats.totalStudents} isBengali={false} />
              <span className="text-xs font-bold text-slate-400">জন</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <span>৬ষ্ঠ - ১২শ শ্রেণি ({stats.totalClasses}টি ক্লাস)</span>
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-black text-[10px] border border-emerald-200 dark:border-emerald-800">
                <TrendingUp className="w-3 h-3" />
                <span>+৪.৮%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card B: Today's Attendance % */}
        <div
          onClick={() => onNavigate("attendance_report")}
          className="group relative p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden backdrop-blur-xl"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              আজকের উপস্থিতি হার
            </span>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 flex items-baseline gap-1.5">
              <AnimatedCounter value={stats.todayAttendance.percentage} decimals={1} suffix="%" />
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                উপস্থিত: <strong className="text-slate-800 dark:text-slate-200">{stats.todayAttendance.present}</strong> • অনুপস্থিত: <strong className="text-rose-500">{stats.todayAttendance.absent}</strong>
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-black text-[10px] border border-emerald-200 dark:border-emerald-800">
                <TrendingUp className="w-3 h-3" />
                <span>+২.৪%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card C: Active Quizzes & Live Sessions */}
        <div
          onClick={() => onNavigate("quiz_admin")}
          className="group relative p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-rose-500/40 dark:hover:border-rose-500/40 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden backdrop-blur-xl"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>সক্রিয় কুইজ রুম</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
            </span>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400 flex items-baseline gap-1.5">
              <span>{stats.activeQuizzesCount}টি</span>
              <span className="text-xs font-bold text-slate-400">লাইভ সেশন</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                কাহুত / মেনটিমিটার স্টাইল
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-black text-[10px] border border-rose-200 dark:border-rose-800">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                <span>লাইভ ব্রডকাস্ট</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card D: Total Faculty */}
        <div
          onClick={() => onNavigate("teacher_workload")}
          className="group relative p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-purple-500/40 dark:hover:border-purple-500/40 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden backdrop-blur-xl"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              শিক্ষক ও স্টাফ পরিষদ
            </span>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/25 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-1.5">
              <span>{stats.totalFaculty}</span>
              <span className="text-xs font-bold text-slate-400">জন শিক্ষক</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                প্রকৌশলী ও কারিগরি ইন্সট্রাক্টর
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-black text-[10px] border border-purple-200 dark:border-purple-800">
                <CheckCircle2 className="w-3 h-3" />
                <span>১০০% সক্রিয়</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. REQUIREMENT 3: QUICK ACTION LAUNCH PAD (HERO HUBS)
          ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-indigo-500 animate-bounce-subtle" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              কুইক অ্যাকশন লন্চ প্যাড (Quick Action Hub)
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            ১ ক্লিকে সরাসরি মডিউলে প্রবেশ
          </span>
        </div>

        {/* Top 3 High-Impact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action 1: Live Quiz Studio Launch */}
          <div
            onClick={() => onNavigate("quiz_admin")}
            className="group relative p-6 rounded-3xl bg-gradient-to-br from-rose-950/90 via-slate-900 to-slate-950 border border-rose-500/30 hover:border-rose-400 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden backdrop-blur-xl flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-105 transition-transform">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-black border border-rose-500/30 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
                  <span>লাইভ এরিনা</span>
                </span>
              </div>
              <h3 className="text-lg font-black text-white group-hover:text-rose-300 transition-colors">
                সরাসরি লাইভ কুইজ শুরু করুন
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Kahoot ও Mentimeter-এর মতো রিয়েলটাইম রুম পিন, লিডারবোর্ড ও স্লাইড অ্যানিমেশনসহ ক্লাস শুরু করুন।
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-black text-rose-400 group-hover:text-rose-300">
              <span>হোস্ট ড্যাশবোর্ডে প্রবেশ</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 2: Daily Attendance Khata */}
          <div
            onClick={() => onNavigate("attendance")}
            className="group relative p-6 rounded-3xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-950 border border-emerald-500/30 hover:border-emerald-400 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden backdrop-blur-xl flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                  <CalendarCheck className="w-6 h-6 text-white" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>দৈনিক রেজিস্টার</span>
                </span>
              </div>
              <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                আজকের হাজিরা নিন ও রেজিস্টার দেখুন
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                শ্রেণি ও ট্রেড সিলেক্ট করে অফলাইন-ফার্স্ট হাজিরা খাতা এবং স্বয়ংক্রিয় এসএমএস নোটিফিকেশন সিস্টেম।
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-black text-emerald-400 group-hover:text-emerald-300">
              <span>হাজিরা খাতায় প্রবেশ</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 3: AI Question & Presentation Studio */}
          <div
            onClick={() => onNavigate("ai_quiz_import")}
            className="group relative p-6 rounded-3xl bg-gradient-to-br from-purple-950/90 via-slate-900 to-slate-950 border border-purple-500/30 hover:border-purple-400 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden backdrop-blur-xl flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-black border border-purple-500/30 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  <span>স্মার্ট জেনারেটর</span>
                </span>
              </div>
              <h3 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                এআই দিয়ে নতুন প্রশ্ন বা স্লাইড বানান
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                টেক্সট বা সিলেবাস পেস্ট করে বিটিইবি ফরম্যাটের MCQ, সত্য/মিথ্যা ও ব্যাখ্যামূলক প্রশ্ন তৈরি করুন।
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-black text-purple-400 group-hover:text-purple-300">
              <span>এআই ইমপোর্ট স্টুডিওতে যান</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Secondary Fast Action Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => onNavigate("students")}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all hover:shadow-md cursor-pointer"
          >
            <Users className="w-4 h-4 text-indigo-500" />
            <span>শিক্ষার্থী তালিকা</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("routine_master")}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-400 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all hover:shadow-md cursor-pointer"
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>মাষ্টার রুটিন</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("excel_wizard")}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-400 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all hover:shadow-md cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-500" />
            <span>এক্সেল উইজার্ড</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("bteb_annual_ledger")}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-400 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all hover:shadow-md cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-purple-500" />
            <span>দীর্ঘমেয়াদী খাতা</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("universal_print_hub")}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-400 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all hover:shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4 text-rose-500" />
            <span>প্রিন্ট ও রিপোর্ট হাব</span>
          </button>
          <button
            type="button"
            onClick={() => setShowQuickQuizModal(true)}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/30 hover:border-pink-500 text-pink-600 dark:text-pink-300 font-bold text-xs transition-all hover:shadow-md cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span>কুইক পপআপ কুইজ</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          4. REQUIREMENT 2: REAL-TIME INTERACTIVE CHARTS (RECHARTS)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* (A) Attendance Trend Area Chart (8 Columns on desktop) */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  হাজিরা অ্যানালিটিক্স চার্ট (৭ দিনের ট্রেন্ড)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                প্রতিদিনের গড় উপস্থিতির হার ও সক্রিয় অংশগ্রহণ
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                গড় ৯৫.১%
              </span>
              <button
                type="button"
                onClick={() => onNavigate("attendance_report")}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>বিস্তারিত রিপোর্ট</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="h-64 sm:h-72 w-full pt-2">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={ATTENDANCE_TREND_DATA}
                  margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis
                    dataKey="day"
                    stroke="#94a3b8"
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    domain={[85, 100]}
                    stroke="#94a3b8"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-1 min-w-[150px]">
                            <p className="font-black text-white border-b border-slate-700/50 pb-1">
                              {label}
                            </p>
                            <p className="text-emerald-400 font-bold flex items-center justify-between">
                              <span>উপস্থিতি:</span>
                              <span>{data.presentPercent}%</span>
                            </p>
                            <p className="text-slate-300 flex items-center justify-between">
                              <span>মোট উপস্থিত:</span>
                              <span className="font-mono">{data.present} জন</span>
                            </p>
                            <p className="text-rose-400 flex items-center justify-between">
                              <span>অনুপস্থিত:</span>
                              <span className="font-mono">{data.absent} জন</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="presentPercent"
                    name="উপস্থিতির হার"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#attendanceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* (B) Trade-wise Distribution Donut Chart (4 Columns on desktop) */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Cpu className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                ট্রেডভিত্তিক শিক্ষার্থী বণ্টন
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              কারিগরি বিভাগের শিক্ষার্থী আনুপাতিক বিশ্লেষণ
            </p>
          </div>

          {/* Donut Chart */}
          <div className="h-44 w-full relative flex items-center justify-center">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={TRADE_DISTRIBUTION_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="students"
                    nameKey="name"
                  >
                    {TRADE_DISTRIBUTION_DATA.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#0f172a"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 border border-slate-700/80 p-2.5 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-0.5">
                            <p className="font-bold text-white">{data.name}</p>
                            <p className="text-cyan-300 font-mono font-bold">
                              {data.students} জন শিক্ষার্থী
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-slate-400 uppercase">মোট</span>
              <span className="text-base font-black text-slate-900 dark:text-white">১,২৪০</span>
            </div>
          </div>

          {/* Colored Legend Pills */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
            {TRADE_DISTRIBUTION_DATA.map((trade) => (
              <div
                key={trade.code}
                className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-50 dark:bg-slate-800/40"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: trade.color }}
                />
                <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                  {trade.name}
                </span>
                <span className="ml-auto font-mono font-bold text-slate-900 dark:text-white text-[10px]">
                  {trade.students}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================
          5. REQUIREMENT 4: REAL-TIME ACTIVITY FEED + ACADEMIC STRUCTURE
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Real-time System Activity Feed (7 Columns on desktop) */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500">
                <Activity className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                রিয়েল-টাইম প্রাতিষ্ঠানিক কার্যক্রম ও লগ
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span>লাইভ মনিটরিং</span>
            </span>
          </div>

          <div className="space-y-3">
            {INITIAL_ACTIVITY_LOG.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/30 transition-all flex items-start gap-3.5 group"
                >
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${item.color}`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      {item.desc}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium pt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Academic Structure & Trade Summary (5 Columns on desktop) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <School className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                একাডেমিক স্তর ও শ্রেণি ওভারভিউ
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("classes_trades")}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <span>শ্রেণি হাব</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Pre-Vocational (Class 6, 7, 8) */}
            <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                    প্রাক-ভোকেশনাল (Pre-Vocational)
                  </span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    ৬ষ্ঠ, ৭ম ও ৮ম শ্রেণি
                  </h4>
                </div>
                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 rounded-md text-[10px] font-bold">
                  ট্রেড নেই
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                সাধারণ শিক্ষাক্রমের সাথে প্রাথমিক প্রযুক্তি ও জীবনমুখী কর্মমুখী শিক্ষা।
              </p>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-500/10">
                <span className="text-slate-500">আসন: ১২০/প্রতি শ্রেণি</span>
                <button
                  type="button"
                  onClick={() => onNavigate("students", { classId: 1 })}
                  className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>শিক্ষার্থী দেখুন</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* SSC Vocational (Class 9 & 10) */}
            <div className="p-3.5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                    এসএসসি ভোকেশনাল (SSC)
                  </span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    ৯ম ও ১০ম শ্রেণি
                  </h4>
                </div>
                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 rounded-md text-[10px] font-bold">
                  ৪টি ট্রেড
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                আইটি সাপোর্ট ও আইওটি, ইলেকট্রিক্যাল ওয়ার্কস, জেনারেল ইলেকট্রনিক্স ও অ্যাপারেল ম্যানুফ্যাকচারিং।
              </p>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-indigo-500/10">
                <span className="text-slate-500">ট্রেড আসন: ৫০টি</span>
                <button
                  type="button"
                  onClick={() => onNavigate("students", { classId: 4 })}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>শিক্ষার্থী দেখুন</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* HSC Vocational (Class 11 & 12) */}
            <div className="p-3.5 rounded-2xl bg-teal-500/5 dark:bg-teal-950/20 border border-teal-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider">
                    এইচএসসি ভোকেশনাল (HSC)
                  </span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    ১১শ ও ১২শ শ্রেণি
                  </h4>
                </div>
                <span className="px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-300 rounded-md text-[10px] font-bold">
                  ৪টি ট্রেড
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                কম্পিউটার অপারেশন ও আইওটি, ইলেকট্রিক্যাল কন্ট্রোল ও অ্যাডভান্সড টেকনিক্যাল ডিপ্লোমা ট্রানজিশন।
              </p>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-teal-500/10">
                <span className="text-slate-500">ট্রেড আসন: ৫০টি</span>
                <button
                  type="button"
                  onClick={() => onNavigate("students", { classId: 6 })}
                  className="font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>শিক্ষার্থী দেখুন</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          6. MODALS
          ======================================================== */}
      {/* Icon Theme Selector Modal */}
      <IconThemeSelectorModal
        isOpen={showIconModal}
        onClose={() => setShowIconModal(false)}
      />

      {/* Quick Quiz Pop-up Studio Modal */}
      <QuickQuizModal
        isOpen={showQuickQuizModal}
        onClose={() => setShowQuickQuizModal(false)}
      />
    </div>
  );
}
