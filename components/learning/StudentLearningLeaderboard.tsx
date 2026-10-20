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

  const rawLeaderboard = useMemo(() => {
    return getStudentLeaderboard(selectedClass, selectedTrade);
  }, [selectedClass, selectedTrade]);

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

  // Top 3 Podium
  const top1 = rawLeaderboard[0] || null;
  const top2 = rawLeaderboard[1] || null;
  const top3 = rawLeaderboard[2] || null;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Hero Header */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                <Trophy className="w-3.5 h-3.5 fill-current text-slate-950" />
                PTSC STUDENT MERIT & LEADERBOARD
              </span>
              <span className="text-xs text-amber-300 font-mono font-bold">
                সাপ্তাহিক ও সার্বিক মেধা তালিকা
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Crown className="w-8 h-8 text-amber-400 shrink-0" />
              <span>শিক্ষার্থী কুইজ লিডারবোর্ড ও এক্টিভিটি স্ট্রিক</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-medium">
              নিয়মিত পাঠ অধ্যায়ন, কুইজে নির্ভুলতা এবং সক্রিয় লার্নিং স্ট্রিক অর্জনের মাধ্যমে মেধা তালিকায় শীর্ষস্থান অর্জন করুন।
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Stat Pill */}
            <div className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-amber-500/30 space-y-1 text-center shrink-0">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                মোট অংশগ্রহণকারী
              </span>
              <div className="text-2xl font-black text-white font-mono">
                {rawLeaderboard.length} জন
              </div>
              <span className="text-[10px] text-slate-400">প্রতিযোগিতায় সক্রিয়</span>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer self-start md:self-auto border border-white/20"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Current Student Position Banner */}
      {currentStudentEntry ? (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-400/40 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-500 p-0.5 shadow-lg shrink-0">
              <img
                src={currentStudentEntry.avatarUrl}
                alt={currentStudentEntry.studentName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase">
                  আপনার অবস্থান
                </span>
                <span className="text-sm font-black text-cyan-300 font-mono">
                  র‍্যাঙ্ক #{currentStudentEntry.rank}
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                {currentStudentEntry.studentName} (রোল: {currentStudentEntry.rollNumber})
              </h3>
              <p className="text-xs text-slate-300">
                {currentStudentEntry.classLabel} • {currentStudentEntry.tradeLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 sm:border-l sm:border-slate-800 sm:pl-6">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">মোট স্কোর</span>
              <strong className="text-lg font-black text-amber-400 font-mono">{currentStudentEntry.totalScore}</strong>
            </div>

            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">স্ট্রিক</span>
              <strong className="text-lg font-black text-rose-400 font-mono flex items-center justify-center gap-0.5">
                <Flame className="w-4 h-4 fill-current text-rose-500" />
                <span>{currentStudentEntry.streakDays} দিন</span>
              </strong>
            </div>

            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">নির্ভুলতা</span>
              <strong className="text-lg font-black text-emerald-400 font-mono">{currentStudentEntry.accuracyPercentage}%</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-3xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl shrink-0 font-black">
              🏆
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                আপনি বর্তমানে গেস্ট স্টুডেন্ট হিসেবে দেখছেন!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                মেধা তালিকায় আপনার নাম, রোল এবং কুইজ স্কোর যুক্ত করতে লগইন করুন বা পাসওয়ার্ড সেট করুন।
              </p>
            </div>
          </div>

          {onOpenLoginModal && (
            <button
              onClick={onOpenLoginModal}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all self-start sm:self-auto cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>লগইন করুন ও র‍্যাঙ্কিংয়ে যোগ দিন</span>
            </button>
          )}
        </div>
      )}

      {/* WEEKLY PROGRESS, STREAK BONUS & BADGE UNLOCK SECTION */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 text-white shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>চলতি সপ্তাহের প্রোগ্রেস ও বোনাস XP ট্র্যাকার</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                  সাপ্তাহিক মিশন
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                ধারাবাহিক ভালো পড়াশোনা ও স্ট্রিক বজায় রেখে অতিরিক্ত বোনাস XP ও মেডেল আনলক করুন
              </p>
            </div>
          </div>

          {/* Weekly Days Tracker */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-2xl border border-indigo-500/30 self-start sm:self-auto">
            {["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র"].map((day, dIdx) => {
              const studentStreak = currentStudentEntry ? currentStudentEntry.streakDays : 1;
              const isPassedDay = dIdx < Math.min(studentStreak, 7);
              return (
                <div key={dIdx} className="flex flex-col items-center gap-1 px-1">
                  <span className="text-[9px] font-bold text-slate-400">{day}</span>
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                      isPassedDay
                        ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-sm ring-1 ring-amber-300"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {isPassedDay ? "🔥" : "•"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3 Milestone Bonus Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Milestone 1: 3-Day Consistency Streak */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-indigo-500/20 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black">
                +৫০ XP বোনাস
              </span>
              {(currentStudentEntry?.streakDays || 0) >= 3 ? (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> অর্জিত
                </span>
              ) : (
                <span className="text-xs font-mono text-slate-400">
                  {currentStudentEntry?.streakDays || 0}/৩ দিন
                </span>
              )}
            </div>
            <h4 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>⚡ ৩-দিনের ধারাবাহিক স্ট্রিক</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              টানা ৩ দিন যেকোনো পাঠ বা কুইজ সম্পন্ন করলেই স্বয়ংক্রিয়ভাবে +৫০ পয়েন্ট যোগ হবে।
            </p>
          </div>

          {/* Milestone 2: 7-Day Champion Streak */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-amber-500/30 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 text-[10px] font-black">
                +১৫০ XP ও স্পেশাল ব্যাজ
              </span>
              {(currentStudentEntry?.streakDays || 0) >= 7 ? (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> আনলকড
                </span>
              ) : (
                <span className="text-xs font-mono text-amber-300 font-bold">
                  {currentStudentEntry?.streakDays || 0}/৭ দিন
                </span>
              )}
            </div>
            <h4 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
              <span>🔥 ৭-দিনের উইকলি চ্যাম্পিয়ন</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              সপ্তাহের প্রতিটি দিন সক্রিয় থেকে মেধা তালিকায় সর্বোচ্চ বোনাস ও &quot;সাপ্তাহিক রত্ন&quot; ব্যাজ অর্জন করুন।
            </p>
          </div>

          {/* Milestone 3: 90%+ Accuracy Mastery */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-emerald-500/20 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black">
                +১০০ XP বোনাস
              </span>
              {(currentStudentEntry?.accuracyPercentage || 0) >= 90 ? (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> সফল
                </span>
              ) : (
                <span className="text-xs font-mono text-slate-400">
                  {currentStudentEntry?.accuracyPercentage || 0}% / ৯০%
                </span>
              )}
            </div>
            <h4 className="text-sm font-black text-emerald-300 flex items-center gap-1.5">
              <span>🎯 ৯০%+ নির্ভুল কুইজ পারফর্ম্যান্স</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              কুইজে ন্যূনতম ৯০% নির্ভুলতার সাথে উত্তীর্ণ হলে কুইজ প্রতি অতিরিক্ত বোনাস XP পাওয়া যাবে।
            </p>
          </div>
        </div>

        {/* Achievement Badges Showcase */}
        <div className="space-y-2 pt-2 border-t border-indigo-500/20">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>এক্সক্লুসিভ গ্যামিফিকেশন ব্যাজ ও মেডেল গ্যালারি</span>
            </span>
            <span className="text-[11px] text-slate-400">ধারাবাহিক পড়াশোনায় স্বয়ংক্রিয় আনলক</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { label: "🔥 ৭-দিনের স্ট্রিক হিরো", unlocked: (currentStudentEntry?.streakDays || 0) >= 7 },
              { label: "⚡ ওহম মাস্টার", unlocked: (currentStudentEntry?.totalScore || 0) >= 80 },
              { label: "🎯 নিখুঁত স্কোরার", unlocked: (currentStudentEntry?.accuracyPercentage || 0) >= 90 },
              { label: "🌟 টেকনিক্যাল টপার", unlocked: (currentStudentEntry?.rank || 99) <= 3 },
              { label: "💻 কোডিং স্পার্ক", unlocked: (currentStudentEntry?.quizzesTaken || 0) >= 5 },
              { label: "🏅 কুইজ চ্যাম্পিয়ন", unlocked: (currentStudentEntry?.quizzesTaken || 0) >= 10 },
            ].map((badge, bIdx) => (
              <div
                key={bIdx}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                  badge.unlocked
                    ? "bg-amber-400/20 border-amber-400/40 text-amber-200 shadow-xs"
                    : "bg-slate-800/40 border-slate-700/60 text-slate-500 opacity-60"
                }`}
              >
                <span>{badge.label}</span>
                {badge.unlocked ? (
                  <span className="text-emerald-400 text-[10px]">✓</span>
                ) : (
                  <Lock className="w-3 h-3 text-slate-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      {rawLeaderboard.length >= 3 && selectedClass === "all" && selectedTrade === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* 2nd Place */}
          {top2 && (
            <div className="order-2 md:order-1 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 relative shadow-md flex flex-col justify-between">
              <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center border border-slate-300 dark:border-slate-700">
                #২
              </div>
              <div className="space-y-3">
                <div className="relative mx-auto w-20 h-20">
                  <img
                    src={top2.avatarUrl}
                    alt={top2.studentName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-2xl object-cover border-2 border-slate-400 shadow-md"
                  />
                  <span className="absolute -bottom-2 -right-2 text-2xl">🥈</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {top2.studentName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    রোল: {top2.rollNumber} • {top2.tradeLabel}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">স্কোর</span>
                  <strong className="text-indigo-600 dark:text-cyan-400 font-mono font-black">{top2.totalScore}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">স্ট্রিক</span>
                  <strong className="text-amber-500 font-mono font-black">{top2.streakDays} দিন</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">নির্ভুলতা</span>
                  <strong className="text-emerald-500 font-mono font-black">{top2.accuracyPercentage}%</strong>
                </div>
              </div>
            </div>
          )}

          {/* 1st Place (Winner Center Podium) */}
          {top1 && (
            <div className="order-1 md:order-2 p-6 rounded-3xl bg-gradient-to-b from-amber-500/10 via-white to-amber-500/5 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border-2 border-amber-400 text-center space-y-3 relative shadow-xl flex flex-col justify-between transform md:-translate-y-2">
              <div className="absolute top-4 left-4 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Crown className="w-3 h-3" />
                <span>#১ চ্যাম্পিয়ন</span>
              </div>

              <div className="space-y-3 pt-4">
                <div className="relative mx-auto w-24 h-24">
                  <img
                    src={top1.avatarUrl}
                    alt={top1.studentName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-3xl object-cover border-4 border-amber-400 shadow-xl"
                  />
                  <span className="absolute -bottom-2 -right-2 text-3xl">🥇</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                    {top1.studentName}
                  </h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                    রোল: {top1.rollNumber} • {top1.tradeLabel}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200 dark:border-amber-900/40 flex items-center justify-around text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">মোট পয়েন্ট</span>
                  <strong className="text-amber-600 dark:text-amber-300 font-mono text-base font-black">{top1.totalScore}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">লার্নিং স্ট্রিক</span>
                  <strong className="text-rose-500 font-mono text-base font-black flex items-center justify-center gap-0.5">
                    <Flame className="w-4 h-4 fill-current text-rose-500" />
                    <span>{top1.streakDays} দিন</span>
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">নির্ভুলতা</span>
                  <strong className="text-emerald-500 font-mono text-base font-black">{top1.accuracyPercentage}%</strong>
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3 && (
            <div className="order-3 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 relative shadow-md flex flex-col justify-between">
              <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center border border-slate-300 dark:border-slate-700">
                #৩
              </div>
              <div className="space-y-3">
                <div className="relative mx-auto w-20 h-20">
                  <img
                    src={top3.avatarUrl}
                    alt={top3.studentName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-2xl object-cover border-2 border-amber-700 shadow-md"
                  />
                  <span className="absolute -bottom-2 -right-2 text-2xl">🥉</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {top3.studentName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    রোল: {top3.rollNumber} • {top3.tradeLabel}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">স্কোর</span>
                  <strong className="text-indigo-600 dark:text-cyan-400 font-mono font-black">{top3.totalScore}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">স্ট্রিক</span>
                  <strong className="text-amber-500 font-mono font-black">{top3.streakDays} দিন</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">নির্ভুলতা</span>
                  <strong className="text-emerald-500 font-mono font-black">{top3.accuracyPercentage}%</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="শিক্ষার্থীর নাম বা রোল নম্বর দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full md:w-auto text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">সব শ্রেণি (All Classes)</option>
              {ACADEMY_CLASSES.map((c) => (
                <option key={c.id || c.databaseClassId} value={c.id}>
                  {c.nameBangla}
                </option>
              ))}
            </select>

            {/* Trade Filter */}
            {!isClassWithTrades && selectedClass !== "all" ? (
              <div className="w-full md:w-auto text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/50 p-2 text-slate-400">
                ট্রেড নেই (Pre-Voc)
              </div>
            ) : (
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="w-full md:w-auto text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">সব ট্রেড (All Trades)</option>
                {availableTrades.map((t) => (
                  <option key={t.id} value={t.id.toLowerCase()}>
                    {t.nameBangla}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* FULL LEADERBOARD TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              সার্বিক মেধা তালিকা র‍্যাঙ্কিং ({leaderboard.length} জন)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">লাইভ ডেটাবেজ সিঙ্ক</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4 text-center w-16">র‍্যাঙ্ক</th>
                <th className="py-3.5 px-4">শিক্ষার্থী</th>
                <th className="py-3.5 px-4">শ্রেণি ও ট্রেড</th>
                <th className="py-3.5 px-4 text-center">কুইজ সংখ্যা</th>
                <th className="py-3.5 px-4 text-center">স্ট্রিক</th>
                <th className="py-3.5 px-4 text-center">নির্ভুলতা</th>
                <th className="py-3.5 px-4 text-center">মোট পয়েন্ট</th>
                <th className="py-3.5 px-4">অর্জিত ব্যাজসমূহ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {leaderboard.map((entry) => {
                const isCurrent = entry.isCurrentStudent;
                return (
                  <tr
                    key={entry.rollNumber}
                    className={`transition-colors ${
                      isCurrent
                        ? "bg-indigo-50/80 dark:bg-indigo-950/40 font-bold border-l-4 border-l-indigo-600"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center font-black">
                      {entry.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-xs">
                          🥇
                        </span>
                      ) : entry.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs">
                          🥈
                        </span>
                      ) : entry.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-400 font-black text-xs border border-amber-700/30">
                          🥉
                        </span>
                      ) : (
                        <span className="font-mono text-slate-600 dark:text-slate-400">
                          #{entry.rank}
                        </span>
                      )}
                    </td>

                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={entry.avatarUrl}
                          alt={entry.studentName}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-xl object-cover bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div>
                          <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{entry.studentName}</span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-black uppercase">
                                আপনি
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            রোল: {entry.rollNumber}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Class & Trade */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-200 font-bold">
                        {entry.classLabel}
                      </div>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        {entry.tradeLabel}
                      </span>
                    </td>

                    {/* Quizzes Taken */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {entry.quizzesTaken} টি
                    </td>

                    {/* Streak */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-mono font-black text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900/60">
                        <Flame className="w-3.5 h-3.5 fill-current text-rose-500" />
                        <span>{entry.streakDays} দিন</span>
                      </span>
                    </td>

                    {/* Accuracy */}
                    <td className="py-3.5 px-4 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {entry.accuracyPercentage}%
                    </td>

                    {/* Total Score */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-black text-sm text-indigo-600 dark:text-cyan-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                        {entry.totalScore}
                      </span>
                    </td>

                    {/* Badges */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {entry.badges.map((b, bIdx) => (
                          <span
                            key={bIdx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
