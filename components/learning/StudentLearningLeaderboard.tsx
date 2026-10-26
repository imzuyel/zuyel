"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Award,
  Flame,
  Star,
  Target,
  Search,
  Filter,
  Sparkles,
  Zap,
  TrendingUp,
  User,
  Crown,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Lock,
  ArrowUpRight,
  X,
  Gift,
  Medal,
  Rocket,
  Compass,
} from "lucide-react";
import {
  getStudentLeaderboard,
  StudentLeaderboardEntry,
  getActiveStudentAccount,
} from "@/lib/studentIntelligenceStore";
import { useAcademySettings } from "@/lib/useAcademySettings";
import { MASTER_ACADEMY_TRADES } from "@/lib/academySettingsStore";

interface StudentLearningLeaderboardProps {
  onOpenLoginModal?: () => void;
  onClose?: () => void;
}

// Gamified adventure title and badge pill styling
function getGamifiedTitle(score: number): { title: string; color: string; badgeBg: string } {
  if (score >= 90)
    return {
      title: "🚀 গ্র্যান্ডমাস্টার",
      color: "text-amber-500 dark:text-amber-400",
      badgeBg:
        "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/30",
    };
  if (score >= 75)
    return {
      title: "⚡ কুইজ নিনজা",
      color: "text-purple-500 dark:text-purple-400",
      badgeBg:
        "bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300 ring-1 ring-purple-400/30",
    };
  if (score >= 50)
    return {
      title: "🌟 অ্যাডভেঞ্চারার",
      color: "text-cyan-500 dark:text-cyan-400",
      badgeBg:
        "bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-400/30",
    };
  return {
    title: "🌱 লার্নার প্রো",
    color: "text-emerald-500 dark:text-emerald-400",
    badgeBg:
      "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400/30",
  };
}

export default function StudentLearningLeaderboard({
  onOpenLoginModal,
  onClose,
}: StudentLearningLeaderboardProps) {
  const { mappings: ACADEMY_CLASSES, getTradesForClass, hasTrades } = useAcademySettings();
  const [activeStudent, setActiveStudent] = useState(() => getActiveStudentAccount());
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedTrade, setSelectedTrade] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const availableTrades = useMemo(() => {
    if (selectedClass === "all") {
      return Object.values(MASTER_ACADEMY_TRADES).filter((t) => t.id !== "General");
    }
    return getTradesForClass(selectedClass);
  }, [selectedClass, getTradesForClass]);

  const isClassWithTrades = useMemo(() => {
    if (selectedClass === "all") return true;
    return hasTrades(selectedClass);
  }, [selectedClass, hasTrades]);

  const handleClassChange = (newCls: string) => {
    setSelectedClass(newCls);
    if (newCls !== "all" && !hasTrades(newCls)) {
      setSelectedTrade("all");
    }
  };

  useEffect(() => {
    setActiveStudent(getActiveStudentAccount());

    const handleAuthEvent = () => {
      setActiveStudent(getActiveStudentAccount());
    };

    window.addEventListener("ptsc_student_auth_changed", handleAuthEvent);
    window.addEventListener("ptsc_student_logout", handleAuthEvent);
    return () => {
      window.removeEventListener("ptsc_student_auth_changed", handleAuthEvent);
      window.removeEventListener("ptsc_student_logout", handleAuthEvent);
    };
  }, []);

  const [dbLeaderboard, setDbLeaderboard] = useState<StudentLeaderboardEntry[] | null>(null);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchDbLeaderboard() {
      setIsLoadingLeaderboard(true);
      try {
        const res = await fetch(`/api/learning/leaderboard?class=${selectedClass}&trade=${selectedTrade}`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.leaderboard)) {
          setDbLeaderboard(data.leaderboard);
        }
      } catch (err) {
        console.error("Failed to load real DB leaderboard:", err);
      } finally {
        if (isMounted) setIsLoadingLeaderboard(false);
      }
    }
    fetchDbLeaderboard();
    return () => {
      isMounted = false;
    };
  }, [selectedClass, selectedTrade]);

  const rawLeaderboard = useMemo(() => {
    if (dbLeaderboard !== null) return dbLeaderboard;
    return getStudentLeaderboard(selectedClass, selectedTrade);
  }, [dbLeaderboard, selectedClass, selectedTrade]);

  const leaderboard = useMemo(() => {
    if (!searchQuery.trim()) return rawLeaderboard;
    const q = searchQuery.toLowerCase().trim();
    return rawLeaderboard.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.tradeLabel.toLowerCase().includes(q)
    );
  }, [rawLeaderboard, searchQuery]);

  // Current student entry if found
  const currentStudentEntry = useMemo(() => {
    if (!activeStudent?.rollNumber) return null;
    return rawLeaderboard.find((s) => s.rollNumber === activeStudent.rollNumber) || null;
  }, [rawLeaderboard, activeStudent]);

  // Top 3 Podium Students
  const top1 = rawLeaderboard[0] || null;
  const top2 = rawLeaderboard[1] || null;
  const top3 = rawLeaderboard[2] || null;

  // Max score for XP progress bar calculation
  const maxScore = useMemo(() => {
    const scores = rawLeaderboard.map((s) => s.totalScore);
    return Math.max(100, ...scores);
  }, [rawLeaderboard]);

  // Whether podium is shown
  const isPodiumVisible =
    rawLeaderboard.length >= 3 &&
    selectedClass === "all" &&
    selectedTrade === "all" &&
    !searchQuery.trim();

  // Students for 3D Quest Cards (Rank 4+ if podium visible, else all)
  const displayedQuestStudents = isPodiumVisible ? leaderboard.slice(3) : leaderboard;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* =========================================================================
          1. HEADER BANNER (ADVENTURE QUEST THEME)
      ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 border-2 border-amber-500/30 shadow-[0_12px_28px_rgba(245,158,11,0.2)] relative overflow-hidden">
        {/* Glow Effects & Floating Star Sprites */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-72 h-72 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                <Trophy className="w-3.5 h-3.5 fill-current text-slate-950" />
                PTSC STUDENT MERIT & ADVENTURE LEADERBOARD
              </span>
              <span className="text-xs text-amber-300 font-mono font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                সাপ্তাহিক ও সার্বিক মেধা তালিকা
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">🏆</span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug">
                শিক্ষার্থী লিডারবোর্ড ও মেধা তালিকা
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-medium">
              নিয়মিত পাঠ অধ্যায়ন, কুইজে নির্ভুলতা এবং সক্রিয় লার্নিং স্ট্রিক অর্জনের মাধ্যমে মেধা
              তালিকায় শীর্ষস্থান অর্জন করুন এবং এক্সক্লুসিভ ব্যাজ আনলক করুন।
            </p>
          </div>

          {/* Quick Stats Chips (Total Adventurers, Top Score, Current Rank) */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            {/* Chip 1: Total Adventurers */}
            <div className="flex-1 sm:flex-initial bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-amber-500/30 shadow-md text-center shrink-0 min-w-[110px]">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                মোট প্রতিযোগী
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                {rawLeaderboard.length} জন
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">অ্যাডভেঞ্চারার</span>
            </div>

            {/* Chip 2: Top Score */}
            <div className="flex-1 sm:flex-initial bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-amber-500/30 shadow-md text-center shrink-0 min-w-[110px]">
              <span className="text-[10px] text-yellow-300 font-bold uppercase tracking-wider block">
                সর্বোচ্চ স্কোর
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5">
                {top1?.totalScore || 0} XP
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">টপ পারফর্মার</span>
            </div>

            {/* Chip 3: Current Rank */}
            <div className="flex-1 sm:flex-initial bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-indigo-500/30 shadow-md text-center shrink-0 min-w-[110px]">
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
                আপনার বর্তমান অবস্থান
              </span>
              <div className="text-xl sm:text-2xl font-black text-indigo-400 font-mono mt-0.5">
                {currentStudentEntry ? `#${currentStudentEntry.rank}` : "লগইন করুন"}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {currentStudentEntry ? "মেধা অবস্থান" : "র‍্যাংক দেখতে"}
              </span>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer self-start lg:self-auto border border-white/20"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Guest Login CTA Card (if not logged in) */}
      {!activeStudent && onOpenLoginModal && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border-2 border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md text-white">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-sm sm:text-base">
                আপনি অতিথি হিসেবে লিডারবোর্ড দেখছেন
              </h4>
              <p className="text-xs text-slate-300 font-medium">
                মেধা তালিকায় নিজের নাম, রোল ও কুইজ স্কোর যুক্ত করতে স্টুডেন্ট অ্যাকাউন্টে লগইন করুন।
              </p>
            </div>
          </div>
          <button
            onClick={onOpenLoginModal}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 transition-all cursor-pointer whitespace-nowrap"
          >
            স্টুডেন্ট লগইন করুন →
          </button>
        </div>
      )}

      {/* =========================================================================
          2. TOP 3 CHAMPIONS 3D PODIUM SHOWCASE (RANK #1, #2, #3)
      ========================================================================= */}
      {isPodiumVisible && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>শীর্ষ ৩ চ্যাম্পিয়ন পোডিয়াম (Top 3 Champions)</span>
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-mono font-bold">
              ★ অল-টাইম টপ পারফর্মার
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
            {/* -------------------- RANK #2: SILVER LEGEND CARD -------------------- */}
            {top2 && (
              <div className="order-2 md:order-1 p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-[0_8px_0_#64748b] dark:shadow-[0_8px_0_#334155] text-center space-y-4 relative flex flex-col justify-between transition-transform hover:-translate-y-1">
                {/* Silver Medal Badge */}
                <div className="absolute top-4 left-4 px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-xs flex items-center gap-1 border border-slate-300 dark:border-slate-700 shadow-xs">
                  <span>🥈</span>
                  <span>#২ রূপার পদক</span>
                </div>

                <div className="space-y-3 pt-6">
                  {/* Avatar with Silver Ring */}
                  <div className="relative mx-auto w-20 h-20">
                    <img
                      src={top2.avatarUrl}
                      alt={top2.studentName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full rounded-2xl object-cover border-4 border-slate-300 dark:border-slate-600 shadow-md bg-slate-100 dark:bg-slate-800"
                    />
                    <span className="absolute -bottom-2 -right-2 text-2xl drop-shadow">🥈</span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                      {top2.studentName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      রোল: {top2.rollNumber} • {top2.tradeLabel}
                    </p>
                    <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/15 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300">
                      ⚡ সিলভার লিজেন্ড
                    </span>
                  </div>
                </div>

                {/* Stats Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">মোট পয়েন্ট</span>
                    <strong className="text-slate-900 dark:text-cyan-300 font-mono text-sm font-black">
                      {top2.totalScore}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">স্ট্রিক</span>
                    <strong className="text-rose-500 font-mono text-sm font-black flex items-center justify-center gap-0.5">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{top2.streakDays}দ</span>
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">নির্ভুলতা</span>
                    <strong className="text-emerald-500 font-mono text-sm font-black">
                      {top2.accuracyPercentage}%
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------- RANK #1: CHAMPION GOLD CARD -------------------- */}
            {top1 && (
              <div className="order-1 md:order-2 p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-amber-400/25 via-yellow-500/15 to-transparent border-2 border-amber-400 shadow-[0_10px_0_#d97706,0_20px_30px_rgba(245,158,11,0.3)] text-center space-y-4 relative flex flex-col justify-between transform md:-translate-y-4 transition-all">
                {/* Gold Crown & Champion Pill */}
                <div className="absolute top-4 left-4 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                  <Crown className="w-3.5 h-3.5 fill-current" />
                  <span>🏆 চ্যাম্পিয়ন</span>
                </div>

                <div className="space-y-3 pt-6">
                  {/* Avatar with Floating Crown & Glowing Amber Ring */}
                  <div className="relative mx-auto w-24 h-24">
                    {/* Floating Animated 3D Crown */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-3xl animate-bounce pointer-events-none drop-shadow-[0_4px_10px_rgba(245,158,11,0.6)]">
                      👑
                    </div>

                    <img
                      src={top1.avatarUrl}
                      alt={top1.studentName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full rounded-3xl object-cover border-4 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] ring-4 ring-amber-300/40 bg-slate-900"
                    />
                    <span className="absolute -bottom-2 -right-2 text-3xl drop-shadow-md">🥇</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                      {top1.studentName}
                    </h3>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                      রোল: {top1.rollNumber} • {top1.tradeLabel}
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-1.5">
                      <span className="px-3 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-xs flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>⭐ {Math.max(10, Math.round(top1.totalScore / 10))} স্টারস</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-400/40">
                        🚀 গ্র্যান্ডমাস্টার
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Footer */}
                <div className="pt-3 border-t border-amber-300/60 dark:border-amber-500/30 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">
                      মোট পয়েন্ট
                    </span>
                    <strong className="text-amber-600 dark:text-amber-300 font-mono text-base font-black">
                      {top1.totalScore}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">
                      স্ট্রিক
                    </span>
                    <strong className="text-rose-500 font-mono text-base font-black flex items-center justify-center gap-0.5">
                      <Flame className="w-4 h-4 fill-current text-rose-500" />
                      <span>{top1.streakDays} দিন</span>
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">
                      নির্ভুলতা
                    </span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-base font-black">
                      {top1.accuracyPercentage}%
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------- RANK #3: BRONZE HERO CARD -------------------- */}
            {top3 && (
              <div className="order-3 p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-orange-400 dark:border-orange-600 shadow-[0_8px_0_#c2410c] dark:shadow-[0_8px_0_#9a3412] text-center space-y-4 relative flex flex-col justify-between transition-transform hover:-translate-y-1">
                {/* Bronze Medal Badge */}
                <div className="absolute top-4 left-4 px-2.5 py-1 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 font-black text-xs flex items-center gap-1 border border-orange-300 dark:border-orange-800 shadow-xs">
                  <span>🥉</span>
                  <span>#৩ ব্রোঞ্জ পদক</span>
                </div>

                <div className="space-y-3 pt-6">
                  {/* Avatar with Bronze Ring */}
                  <div className="relative mx-auto w-20 h-20">
                    <img
                      src={top3.avatarUrl}
                      alt={top3.studentName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full rounded-2xl object-cover border-4 border-orange-400 dark:border-orange-600 shadow-md bg-slate-100 dark:bg-slate-800"
                    />
                    <span className="absolute -bottom-2 -right-2 text-2xl drop-shadow">🥉</span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                      {top3.studentName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      রোল: {top3.rollNumber} • {top3.tradeLabel}
                    </p>
                    <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500/15 border border-orange-500/40 text-orange-700 dark:text-orange-300">
                      ⚡ ব্রোঞ্জ হিরো
                    </span>
                  </div>
                </div>

                {/* Stats Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">মোট পয়েন্ট</span>
                    <strong className="text-slate-900 dark:text-cyan-300 font-mono text-sm font-black">
                      {top3.totalScore}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">স্ট্রিক</span>
                    <strong className="text-amber-500 font-mono text-sm font-black">
                      {top3.streakDays} দিন
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">নির্ভুলতা</span>
                    <strong className="text-emerald-500 font-mono text-sm font-black">
                      {top3.accuracyPercentage}%
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          FILTER & SEARCH CONTROLS BAR
      ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="শিক্ষার্থীর নাম, রোল বা ট্রেড দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Class & Trade Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              className="flex-1 md:flex-initial px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="all">সব শ্রেণি (All Classes)</option>
              {ACADEMY_CLASSES.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

            {isClassWithTrades && (
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="flex-1 md:flex-initial px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                <option value="all">সব ট্রেড (All Trades)</option>
                {availableTrades.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameBangla || t.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. GAMIFIED 3D ADVENTURE RANK CARDS (RANK #4 AND BELOW — NO TABLES!)
      ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {isPodiumVisible
                ? `অন্যান্য কুইজ অ্যাডভেঞ্চারার (#৪ থেকে #${rawLeaderboard.length})`
                : `সার্বিক মেধা তালিকা র‍্যাঙ্কিং (${leaderboard.length} জন)`}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">লাইভ র‍্যাংকিং সিঙ্ক</span>
        </div>

        {displayedQuestStudents.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 space-y-3">
            <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="font-black text-base text-slate-700 dark:text-slate-300">
              কোনো শিক্ষার্থী পাওয়া যায়নি
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              ফিল্টার পরিবর্তন করুন অথবা অন্য নাম/রোল দিয়ে সার্চ করে দেখুন।
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedQuestStudents.map((entry) => {
              const isCurrent = entry.isCurrentStudent;
              const titleInfo = getGamifiedTitle(entry.totalScore);
              const stars = Math.max(5, Math.round(entry.totalScore / 10));
              const progressPct = Math.min(100, Math.round((entry.totalScore / maxScore) * 100));

              return (
                <div
                  key={entry.rollNumber}
                  className={`rounded-2xl border-2 transition-all p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isCurrent
                      ? "bg-gradient-to-r from-indigo-50/95 via-white to-purple-50/90 dark:from-indigo-950/60 dark:via-slate-900/90 dark:to-purple-950/40 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-400/50 shadow-[0_6px_0_#4f46e5] dark:shadow-[0_6px_0_#3730a3]"
                      : "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 shadow-[0_6px_0_#cbd5e1] dark:shadow-[0_6px_0_#1e293b] hover:-translate-y-1 hover:shadow-[0_8px_0_#94a3b8] dark:hover:shadow-[0_8px_0_#0f172a]"
                  }`}
                >
                  {/* Left Side: Rank Shield + Avatar + Name + Title Pill */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* 3D Rank Shield Badge */}
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border-2 shadow-sm ${
                        entry.rank === 1
                          ? "bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/30"
                          : entry.rank === 2
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                          : entry.rank === 3
                          ? "bg-orange-200 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-800"
                          : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-mono"
                      }`}
                    >
                      {entry.rank <= 3 ? (
                        entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"
                      ) : (
                        `#${entry.rank}`
                      )}
                    </div>

                    {/* Student Avatar with Level Ring */}
                    <div className="relative shrink-0">
                      <img
                        src={entry.avatarUrl}
                        alt={entry.studentName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-2xl object-cover bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 shadow-sm"
                      />
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-slate-900 text-amber-400 text-[9px] font-black border border-amber-400/40">
                        Lv.{Math.min(99, Math.max(1, Math.floor(entry.totalScore / 20)))}
                      </span>
                    </div>

                    {/* Student Details & Title Pill */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {entry.studentName}
                        </span>

                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs animate-pulse">
                            আপনি (You)
                          </span>
                        )}

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${titleInfo.badgeBg}`}
                        >
                          {titleInfo.title}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 font-medium">
                        <span className="font-mono">রোল: {entry.rollNumber}</span>
                        <span>•</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          {entry.classLabel} ({entry.tradeLabel})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: XP Progress Bar + Stars + Accuracy + Points Pill */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                    {/* Visual XP Progress Bar */}
                    <div className="w-full sm:w-36 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        <span>XP প্রগ্রেস</span>
                        <span className="font-mono">{progressPct}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 text-xs">
                      {/* Stars Badge */}
                      <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 font-black text-amber-700 dark:text-amber-300 flex items-center gap-1 shadow-2xs">
                        <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                        <span>⭐ {stars}</span>
                      </div>

                      {/* Streak Days */}
                      <div className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 font-black text-rose-600 dark:text-rose-400 flex items-center gap-1 shadow-2xs">
                        <Flame className="w-3.5 h-3.5 fill-current text-rose-500" />
                        <span>{entry.streakDays} দিন</span>
                      </div>

                      {/* Accuracy % */}
                      <div className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1 shadow-2xs">
                        <Target className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{entry.accuracyPercentage}%</span>
                      </div>

                      {/* Total Points 3D Pill */}
                      <div className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-mono font-black text-xs sm:text-sm shadow-md shadow-indigo-600/30 flex items-center gap-1 shrink-0">
                        <span>💎</span>
                        <span>{entry.totalScore} XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
