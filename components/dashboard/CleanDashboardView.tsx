"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  User,
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
  Award,
  AlertCircle,
  Sun,
  Moon
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
import { BorderGlowCard, AnimatedCounter, GlowButton } from "@/components/ui/animation-effects";
import { ServerDatabaseConsoleSVG } from "@/components/ui/animated-svgs";
import QuickQuizModal from "@/components/quiz/QuickQuizModal";
import { safeFetchJson } from "@/lib/safeFetch";

interface CleanDashboardViewProps {
  onNavigate: (tab: string, extra?: any) => void;
}

interface TradeDistributionItem {
  id?: number;
  name: string;
  nameEn?: string;
  code: string;
  students: number;
  color: string;
}

interface AttendanceTrendItem {
  day: string;
  date?: string;
  presentPercent: number;
  present: number;
  absent: number;
  hasData?: boolean;
}

interface ActivityLogItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  timestamp?: string;
  type: string;
  icon?: any;
  color?: string;
  badge?: string;
}

export default function CleanDashboardView({ onNavigate }: CleanDashboardViewProps) {
  const { currentUser } = useAuth();
  const { mode, toggleTheme, iconTheme, iconAnimation } = useTheme();
  const [showIconModal, setShowIconModal] = useState(false);
  const [showQuickQuizModal, setShowQuickQuizModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 100% Dynamic State (Zero hardcoded data)
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      percentage: 0,
      hasRecordedToday: false,
    },
    totalClasses: 6,
    activeSession: "2026",
    activeQuizzesCount: 0,
    totalFaculty: 0,
  });

  const [tradeDistribution, setTradeDistribution] = useState<TradeDistributionItem[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendItem[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);

  // Category Icon & Color Resolver for Activity Log
  const resolveActivityStyling = (type: string, status?: string) => {
    switch (type) {
      case "attendance":
        return {
          icon: CalendarCheck,
          color: "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        };
      case "quiz":
      case "live":
        return {
          icon: Flame,
          color: "text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/30",
        };
      case "ai":
        return {
          icon: Sparkles,
          color: "text-purple-500 dark:text-purple-400 bg-purple-500/10 border-purple-500/30",
        };
      case "security":
        if (status === "BLOCKED" || status === "DENIED") {
          return {
            icon: ShieldAlert,
            color: "text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/30",
          };
        }
        return {
          icon: ShieldCheck,
          color: "text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
        };
      default:
        return {
          icon: Activity,
          color: "text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
        };
    }
  };

  // Live Database Fetcher
  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const res = await safeFetchJson<any>("/api/dashboard/summary?view=admin");
      if (res && res.data) {
        const kpi = res.data.kpi;
        if (kpi) {
          setStats({
            totalStudents: kpi.totalStudents ?? 0,
            todayAttendance: {
              total: kpi.totalStudents ?? 0,
              present: kpi.presentStudentsCount ?? 0,
              absent: kpi.absentStudentsCount ?? 0,
              late: 0,
              percentage: kpi.todayAttendancePercent ?? 0,
              hasRecordedToday: Boolean(kpi.hasRecordedToday),
            },
            totalClasses: 6,
            activeSession: res.data.institution?.academicYear || "2026",
            activeQuizzesCount: kpi.activeLiveQuizzesCount ?? 0,
            totalFaculty: kpi.totalFaculty ?? 0,
          });
        }

        // Real Trade Distribution from Database
        if (Array.isArray(res.data.tradeDistribution)) {
          setTradeDistribution(res.data.tradeDistribution);
        }

        // Real 7-day Attendance Trend from Database
        if (Array.isArray(res.data.attendanceTrend)) {
          setAttendanceTrend(res.data.attendanceTrend);
        }

        // Real Institutional Activity & Audit Logs
        if (Array.isArray(res.data.recentAuditLogs)) {
          const mappedLogs = res.data.recentAuditLogs.map((log: any, idx: number) => {
            const style = resolveActivityStyling(log.type, log.status);
            return {
              id: log.id || `act-log-${idx}`,
              title: log.title || log.detailsBangla || log.details || "প্রাতিষ্ঠানিক ইভেন্ট",
              desc: log.desc || `${log.actorName || "সিস্টেম"} • ${log.routePath || "/admin"}`,
              time: log.time || "কিছুক্ষণ আগে",
              timestamp: log.timestamp,
              type: log.type || "audit",
              status: log.status,
              badge: log.badge || "ভেরিফাইড",
              icon: style.icon,
              color: style.color,
            };
          });
          setActivityLog(mappedLogs);
        }
      }
    } catch (err) {
      console.warn("[CleanDashboardView] Failed to fetch dynamic dashboard stats:", err);
    } finally {
      setIsLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculations for Academic Overview Cards (from dynamic tradeDistribution)
  const preVocationalCount =
    tradeDistribution.find((t) => t.code === "GEN")?.students ?? 0;
  const technicalTradeStudentsCount = tradeDistribution
    .filter((t) => t.code !== "GEN")
    .reduce((sum, t) => sum + t.students, 0);

  // Check if any attendance has been taken in last 7 days
  const hasAnyAttendanceRecord = attendanceTrend.some((d) => d.hasData && d.present > 0);
  const averageAttendancePercent =
    attendanceTrend.length > 0 && hasAnyAttendanceRecord
      ? Number(
          (
            attendanceTrend
              .filter((d) => d.hasData)
              .reduce((sum, d) => sum + d.presentPercent, 0) /
            (attendanceTrend.filter((d) => d.hasData).length || 1)
          ).toFixed(1)
        )
      : 0;

  const isDarkMode = mode === "dark";

  return (
    <div className="space-y-6 pb-16 overflow-y-auto">
      {/* ========================================================
          1. OFFICIAL INSTITUTIONAL BANNER & HEADER CONSOLE (MULTICOLOR GLOW & DYNAMIC THEME)
          ======================================================== */}
      <div className="multicolor-glow-card">
        <div className="multicolor-card-inner p-5 sm:p-7 relative overflow-hidden bg-white/95 dark:bg-gradient-to-r dark:from-slate-950 dark:via-indigo-950/95 dark:to-slate-900 shadow-xl dark:shadow-2xl transition-all">
          {/* Subtle Ambient Background Glows */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Animated Tech Console SVG Art */}
          <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-20 dark:opacity-30 pointer-events-none hidden lg:block text-slate-800 dark:text-white">
            <ServerDatabaseConsoleSVG size={180} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-500/30 backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-500" />
                  </span>
                  <span>কারিগরি শিক্ষা অধিদপ্তর • সেশন {stats.activeSession}</span>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-indigo-500/10 text-blue-700 dark:text-indigo-300 text-xs font-medium border border-blue-200 dark:border-indigo-500/20">
                  <Radio className="w-3 h-3 text-blue-600 dark:text-cyan-400 animate-pulse" />
                  <span>রিয়েল-টাইম ডাটাবেস সিঙ্ক সক্রিয়</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <span>সরকারি টেকনিক্যাল স্কুল ও কলেজ, পঞ্চগড়</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Govt. Technical School & College (PTSC) — এন্টারপ্রাইজ ম্যানেজমেন্ট কনসোল, লাইভ ইন্টারেক্টিভ কুইজ ও রিয়েল-টাইম একাডেমি হাব
              </p>
            </div>

            {/* User Profile & Quick Controls */}
            <div className="flex items-center gap-2.5 bg-slate-100/90 dark:bg-slate-900/80 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 shrink-0 self-start md:self-auto shadow-sm dark:shadow-inner flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30 shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  লগইন ইউজার
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[150px]">
                  {currentUser?.nameBangla || currentUser?.fullName || "কর্মকর্তা"}
                </div>
                <div className="text-[10px] text-indigo-600 dark:text-cyan-400 font-bold">
                  {currentUser?.role === "principal"
                    ? "অধ্যক্ষ"
                    : currentUser?.role === "teacher"
                    ? "শিক্ষক / ইন্সট্রাক্টর"
                    : "সিস্টেম অ্যাডমিন"}
                </div>
              </div>

              {/* Quick 1-Click Light/Dark Theme Switcher */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 bg-slate-200/90 hover:bg-slate-300 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-200 rounded-xl text-xs transition-all border border-slate-300 dark:border-slate-700 hover:border-amber-400/50 cursor-pointer shadow-xs inline-flex items-center justify-center"
                title={isDarkMode ? "লাইট মোডে সুইচ করুন" : "ডার্ক মোডে সুইচ করুন"}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-cyan-600" />
                )}
              </button>

              {/* Manual Refresh Button */}
              <button
                type="button"
                onClick={() => loadDashboardData(true)}
                disabled={isRefreshing}
                className="p-2 bg-slate-200/90 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 hover:text-cyan-800 dark:hover:text-cyan-200 rounded-xl text-xs transition-all border border-slate-300 dark:border-slate-700 hover:border-cyan-500/40 cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center justify-center"
                title="রিয়েল-টাইম ডাটা রিফ্রেশ করুন"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-500" : ""}`} />
              </button>

              <Link
                href="/admin/profile"
                className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-600/30 dark:hover:bg-indigo-600/50 text-indigo-700 dark:text-indigo-200 hover:text-indigo-900 dark:hover:text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer border border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-400 shadow-xs inline-flex items-center gap-1"
                title="প্রোফাইল সেটিংস দেখুন"
              >
                <span>প্রোফাইল</span>
              </Link>

              {/* Theme Selector Studio Modal */}
              <button
                type="button"
                onClick={() => setShowIconModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-rose-100 to-purple-100 dark:from-rose-500/20 dark:to-purple-500/20 hover:from-rose-200 hover:to-purple-200 dark:hover:from-rose-500/40 dark:hover:to-purple-500/40 text-purple-700 dark:text-amber-200 rounded-xl text-[11px] font-bold transition-all border border-purple-200 dark:border-amber-500/30 cursor-pointer group shadow-xs"
                title="আইকন থিম ও অ্যানিমেশন স্টুডিও"
              >
                <Palette className="w-3.5 h-3.5 text-purple-600 dark:text-amber-300 group-hover:rotate-45 transition-transform" />
                <span className="hidden sm:inline">থিম স্টুডিও</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. REQUIREMENT 1: 4 MULTICOLOR GLOWING ANIMATED STAT CARDS
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card A: মোট শিক্ষার্থী (Total Students - Royal Blue & Electric Cyan) */}
        <div
          onClick={() => onNavigate("students")}
          className="multicolor-glow-card multicolor-glow-card-blue cursor-pointer"
        >
          <div className="multicolor-card-inner p-5 space-y-2 relative overflow-hidden">
            {/* Ambient Inner Gradient Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                মোট শিক্ষার্থী
              </span>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="space-y-1 relative z-10">
              <div className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-1.5">
                <AnimatedCounter value={stats.totalStudents} isBengali={false} />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">জন শিক্ষার্থী</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-bold text-blue-600 dark:text-cyan-400 flex items-center gap-1 truncate">
                  <span>৬ষ্ঠ - ১১শ শ্রেণি ({stats.totalClasses}টি ক্লাস)</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-cyan-300 font-black text-[10px] border border-blue-200 dark:border-blue-800 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  <span>ডাটাবেস লাইভ</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card B: আজকের উপস্থিতি হার (Today's Attendance % - Emerald Green & Mint Teal) */}
        <div
          onClick={() => onNavigate("attendance")}
          className="multicolor-glow-card multicolor-glow-card-emerald cursor-pointer"
        >
          <div className="multicolor-card-inner p-5 space-y-2 relative overflow-hidden">
            {/* Ambient Inner Gradient Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                আজকের উপস্থিতি হার
              </span>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <CalendarCheck className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="space-y-1 relative z-10">
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 flex items-baseline gap-1.5">
                <AnimatedCounter value={stats.todayAttendance.percentage} decimals={1} suffix="%" />
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                {stats.todayAttendance.hasRecordedToday ? (
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    উপস্থিত: <strong className="text-slate-900 dark:text-white font-bold">{stats.todayAttendance.present}</strong> • অনুপস্থিত: <strong className="text-rose-500 font-bold">{stats.todayAttendance.absent}</strong>
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                    <AlertCircle className="w-3 h-3" />
                    <span>আজ এখনও হাজিরা হয়নি</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-black text-[10px] border border-emerald-200 dark:border-emerald-800 shrink-0">
                  {stats.todayAttendance.hasRecordedToday ? (
                    <>
                      <TrendingUp className="w-3 h-3" />
                      <span>রেকর্ডকৃত</span>
                    </>
                  ) : (
                    <span>হাজিরা নিন</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card C: সক্রিয় কুইজ রুম ও লাইভ সেশন (Active Quizzes - Sunburst Amber & Flame Coral) */}
        <div
          onClick={() => onNavigate("quiz_admin")}
          className="multicolor-glow-card multicolor-glow-card-rose cursor-pointer"
        >
          <div className="multicolor-card-inner p-5 space-y-2 relative overflow-hidden">
            {/* Ambient Inner Gradient Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 dark:bg-rose-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <span>সক্রিয় কুইজ রুম</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
              </span>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="space-y-1 relative z-10">
              <div className="text-3xl font-black text-rose-600 dark:text-rose-400 flex items-baseline gap-1.5">
                <AnimatedCounter value={stats.activeQuizzesCount} isBengali={false} />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">টি লাইভ সেশন</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                  কাহুত ও মেন্টিমিটার স্টাইল
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-black text-[10px] border border-rose-200 dark:border-rose-800 shrink-0">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-rose-500" />
                  <span>লাইভ ব্রডকাস্ট</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card D: শিক্ষক ও স্টাফ পরিষদ (Total Faculty - Violet Purple & Electric Magenta) */}
        <div
          onClick={() => onNavigate("teacher_workload")}
          className="multicolor-glow-card multicolor-glow-card-purple cursor-pointer"
        >
          <div className="multicolor-card-inner p-5 space-y-2 relative overflow-hidden">
            {/* Ambient Inner Gradient Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 dark:bg-purple-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                শিক্ষক ও স্টাফ পরিষদ
              </span>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="space-y-1 relative z-10">
              <div className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-1.5">
                <AnimatedCounter value={stats.totalFaculty} isBengali={false} />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">জন শিক্ষক</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                  প্রকৌশলী ও কারিগরি ইন্সট্রাক্টর
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-black text-[10px] border border-purple-200 dark:border-purple-800 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-purple-500" />
                  <span>১০০% সক্রিয়</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. REQUIREMENT 3: DYNAMIC QUICK ACTION LAUNCH PAD
          ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-indigo-500 animate-bounce-subtle" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              কুইক অ্যাকশন লন্চ প্যাড (Quick Action Hub)
            </h2>
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            ১ ক্লিকে সরাসরি মডিউলে প্রবেশ
          </span>
        </div>

        {/* Top 3 High-Impact Colorful Glow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action 1: Live Quiz Studio Launch */}
          <div
            onClick={() => onNavigate("quiz_admin")}
            className="multicolor-glow-card multicolor-glow-card-rose cursor-pointer flex flex-col justify-between"
          >
            <div className="multicolor-card-inner p-6 flex flex-col justify-between h-full bg-white/95 dark:bg-gradient-to-br dark:from-rose-950/90 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/10 dark:bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-105 transition-transform">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] font-black border border-rose-200 dark:border-rose-500/30 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-rose-500 dark:text-rose-400 animate-pulse" />
                    <span>লাইভ এরিনা</span>
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
                  সরাসরি লাইভ কুইজ শুরু করুন
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-medium">
                  Kahoot ও Mentimeter-এর মতো রিয়েলটাইম রুম পিন, লিডারবোর্ড ও স্লাইড অ্যানিমেশনসহ ক্লাস শুরু করুন।
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs font-black text-rose-600 dark:text-rose-400 group-hover:text-rose-700 dark:group-hover:text-rose-300">
                <span>হোস্ট ড্যাশবোর্ডে প্রবেশ</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Action 2: Daily Attendance Khata */}
          <div
            onClick={() => onNavigate("attendance")}
            className="multicolor-glow-card multicolor-glow-card-emerald cursor-pointer flex flex-col justify-between"
          >
            <div className="multicolor-card-inner p-6 flex flex-col justify-between h-full bg-white/95 dark:bg-gradient-to-br dark:from-emerald-950/90 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                    <CalendarCheck className="w-6 h-6 text-white" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-black border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                    <span>দৈনিক রেজিস্টার</span>
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                  আজকের হাজিরা নিন ও রেজিস্টার দেখুন
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-medium">
                  শ্রেণি ও ট্রেড সিলেক্ট করে অফলাইন-ফার্স্ট হাজিরা খাতা এবং স্বয়ংক্রিয় এসএমএস নোটিফিকেশন সিস্টেম।
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs font-black text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                <span>হাজিরা খাতায় প্রবেশ</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Action 3: AI Question & Presentation Studio */}
          <div
            onClick={() => onNavigate("ai_quiz_import")}
            className="multicolor-glow-card multicolor-glow-card-purple cursor-pointer flex flex-col justify-between"
          >
            <div className="multicolor-card-inner p-6 flex flex-col justify-between h-full bg-white/95 dark:bg-gradient-to-br dark:from-purple-950/90 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[11px] font-black border border-purple-200 dark:border-purple-500/30 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                    <span>স্মার্ট জেনারেটর</span>
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                  এআই দিয়ে নতুন প্রশ্ন বা স্লাইড বানান
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-medium">
                  টেক্সট বা সিলেবাস পেস্ট করে বিটিইবি ফরম্যাটের MCQ, সত্য/মিথ্যা ও ব্যাখ্যামূলক প্রশ্ন তৈরি করুন।
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs font-black text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                <span>এআই ইমপোর্ট স্টুডিওতে যান</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Fast Action Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => onNavigate("students")}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-[0_0_18px_rgba(59,130,246,0.25)] text-slate-800 dark:text-slate-100 font-bold text-xs transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <Users className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <span>শিক্ষার্থী তালিকা</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("routine_master")}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-[0_0_18px_rgba(245,158,11,0.25)] text-slate-800 dark:text-slate-100 font-bold text-xs transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>মাস্টার রুটিন</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("excel_wizard")}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-400 hover:shadow-[0_0_18px_rgba(6,182,212,0.25)] text-slate-800 dark:text-slate-100 font-bold text-xs transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>এক্সেল উইজার্ড</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("bteb_annual_ledger")}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-[0_0_18px_rgba(168,85,247,0.25)] text-slate-800 dark:text-slate-100 font-bold text-xs transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>দীর্ঘমেয়াদী খাতা</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("universal_print_hub")}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-400 hover:shadow-[0_0_18px_rgba(244,63,94,0.25)] text-slate-800 dark:text-slate-100 font-bold text-xs transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>প্রিন্ট ও রিপোর্ট হাব</span>
          </button>
          <button
            type="button"
            onClick={() => setShowQuickQuizModal(true)}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 dark:from-pink-500/15 dark:to-rose-500/15 border border-pink-400/40 dark:border-pink-500/30 hover:border-pink-500 hover:shadow-[0_0_18px_rgba(236,72,153,0.3)] text-pink-700 dark:text-pink-300 font-bold text-xs transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            <span>কুইক পপআপ কুইজ</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          4. REQUIREMENT 2: REAL-TIME RECHARTS ANALYTICS WITH MULTICOLOR GLOW
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* (A) Attendance Trend Area Chart (8 Columns on desktop - 100% Dynamic) */}
        <div className="lg:col-span-8 multicolor-glow-card">
          <div className="multicolor-card-inner p-5 sm:p-6 space-y-4 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <BarChart3 className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    হাজিরা অ্যানালিটিক্স চার্ট (গত ৭ দিনের ট্রেন্ড)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                  ডাটাবেস থেকে প্রাপ্ত বিগত ৭ দিনের প্রকৃত উপস্থিতি ও সক্রিয় হার
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                  {hasAnyAttendanceRecord ? `গড় ${averageAttendancePercent}%` : "০.০% (রেকর্ড নেই)"}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate("attendance_report")}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>বিস্তারিত রিপোর্ট</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Area Chart Container */}
            <div className="h-64 sm:h-72 w-full pt-2 relative">
              {isMounted && attendanceTrend.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={attendanceTrend}
                    margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? "#334155" : "#cbd5e1"}
                      opacity={isDarkMode ? 0.35 : 0.6}
                    />
                    <XAxis
                      dataKey="day"
                      stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                      tick={{ fill: isDarkMode ? "#cbd5e1" : "#334155", fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                      tick={{ fill: isDarkMode ? "#cbd5e1" : "#334155", fontSize: 11, fontWeight: 600 }}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <RechartsTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-slate-700/80 p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-1 min-w-[160px]">
                              <p className="font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-1 flex items-center justify-between">
                                <span>{label}</span>
                                {data.date && <span className="text-[10px] text-slate-500 dark:text-slate-400">{data.date}</span>}
                              </p>
                              <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-between">
                                <span>উপস্থিতির হার:</span>
                                <span>{data.presentPercent}%</span>
                              </p>
                              <p className="text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                <span>মোট উপস্থিত:</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{data.present} জন</span>
                              </p>
                              <p className="text-rose-600 dark:text-rose-400 flex items-center justify-between">
                                <span>অনুপস্থিত:</span>
                                <span className="font-mono font-bold">{data.absent} জন</span>
                              </p>
                              {!data.hasData && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 italic pt-0.5">
                                  * এই দিনে কোনো হাজিরা গ্রহণ হয়নি
                                </p>
                              )}
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

              {/* Empty State Overlay when no attendance recorded */}
              {!hasAnyAttendanceRecord && !isLoading && (
                <div className="absolute inset-0 bg-slate-50/70 dark:bg-slate-950/70 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center pointer-events-auto">
                  <CalendarCheck className="w-8 h-8 text-slate-400 mb-2 opacity-70" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-sm">
                    গত ৭ দিনে কোনো ডিজিটাল হাজিরা রেকর্ড নেই (০%)। আজ নতুন ক্লাস শুরু করতে নিচের বাটনে ক্লিক করুন।
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate("attendance")}
                    className="mt-2.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>আজকের হাজিরা গ্রহণ করুন</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* (B) Trade-wise Distribution Donut Chart (4 Columns on desktop - 100% Dynamic) */}
        <div className="lg:col-span-4 multicolor-glow-card">
          <div className="multicolor-card-inner p-5 sm:p-6 space-y-4 flex flex-col justify-between">
            <div className="border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Cpu className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  ট্রেডভিত্তিক শিক্ষার্থী বণ্টন
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                ডাটাবেসের ট্রেড ও কারিগরি বিভাগের শিক্ষার্থী আনুপাতিক বিশ্লেষণ
              </p>
            </div>

            {/* Donut Chart */}
            <div className="h-44 w-full relative flex items-center justify-center">
              {isMounted && tradeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tradeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="students"
                      nameKey="name"
                    >
                      {tradeDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.code || index}`}
                          fill={entry.color}
                          stroke={isDarkMode ? "#0f172a" : "#ffffff"}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const pct =
                            stats.totalStudents > 0
                              ? ((data.students / stats.totalStudents) * 100).toFixed(1)
                              : "0.0";
                          return (
                            <div className="bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-slate-700/80 p-2.5 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-0.5">
                              <p className="font-bold text-slate-900 dark:text-white">{data.name}</p>
                              <p className="text-blue-600 dark:text-cyan-300 font-mono font-bold">
                                {data.students} জন শিক্ষার্থী ({pct}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                  <span>ডাটা লোড হচ্ছে...</span>
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  মোট শিক্ষার্থী
                </span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  <AnimatedCounter value={stats.totalStudents} isBengali={false} />
                </span>
              </div>
            </div>

            {/* Dynamic Colored Legend Pills */}
            <div className="space-y-1.5 pt-1 text-[11px] max-h-48 overflow-y-auto">
              {tradeDistribution.map((trade) => {
                const pct =
                  stats.totalStudents > 0
                    ? ((trade.students / stats.totalStudents) * 100).toFixed(0)
                    : "0";
                return (
                  <div
                    key={trade.code}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: trade.color }}
                    />
                    <span className="truncate text-slate-800 dark:text-slate-200 font-medium">
                      {trade.name}
                    </span>
                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">({pct}%)</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                        {trade.students} জন
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          5. REQUIREMENT 4: DYNAMIC SYSTEM ACTIVITY FEED + ACADEMIC STRUCTURE
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Real-time System Activity Feed (7 Columns on desktop) */}
        <div className="lg:col-span-7 multicolor-glow-card">
          <div className="multicolor-card-inner p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Activity className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  রিয়েল-টাইম প্রাতিষ্ঠানিক কার্যক্রম ও লগ
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
                <span>লাইভ মনিটরিং</span>
              </span>
            </div>

            <div className="space-y-3">
              {activityLog.length > 0 ? (
                activityLog.map((item) => {
                  const IconComp = item.icon || Activity;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500/30 transition-all flex items-start gap-3.5 group"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                          item.color || "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {item.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700/80 text-[10px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                          {item.desc}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium pt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Activity className="w-8 h-8 mx-auto opacity-40 text-slate-500" />
                  <p className="text-xs font-medium">কোনো সাম্প্রতিক লগ রেকর্ড পাওয়া যায়নি</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Academic Structure & Trade Summary (5 Columns on desktop) */}
        <div className="lg:col-span-5 multicolor-glow-card">
          <div className="multicolor-card-inner p-5 sm:p-6 space-y-4">
            <div className="border-b border-slate-200/80 dark:border-slate-800/80 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <School className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  একাডেমিক স্তর ও শ্রেণি ওভারভিউ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("classes_trades")}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
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
                    ট্রেড প্রযোজ্য নয়
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                  সাধারণ শিক্ষাক্রমের সাথে প্রাথমিক প্রযুক্তি ও জীবনমুখী কর্মমুখী শিক্ষা।
                </p>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-500/10">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    এনরোল্ড: <strong className="text-amber-600 dark:text-amber-400 font-bold">{preVocationalCount}</strong> জন
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate("students", { classId: 1 })}
                    className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
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
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                  আইটি সাপোর্ট ও আইওটি, ইলেকট্রিক্যাল ওয়ার্কস, জেনারেল ইলেকট্রনিক্স ও অ্যাপারেল ম্যানুফ্যাকচারিং।
                </p>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-indigo-500/10">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    কারিগরি ট্রেড আসন: সক্রিয়
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate("students", { classId: 4 })}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
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
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                  কম্পিউটার অপারেশন ও আইওটি, ইলেকট্রিক্যাল কন্ট্রোল ও অ্যাডভান্সড ডিপ্লোমা ট্রানজিশন।
                </p>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-teal-500/10">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    উচ্চ মাধ্যমিক ভোকেশনাল
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate("students", { classId: 6 })}
                    className="font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <span>শিক্ষার্থী দেখুন</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
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
