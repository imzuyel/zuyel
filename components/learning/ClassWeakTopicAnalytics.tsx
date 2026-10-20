"use client";

import React, { useState, useEffect } from "react";
import {
  BrainCircuit,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Filter,
  Flame,
  Award,
  Zap,
  ChevronRight,
  Printer,
  Sparkles,
  Layers,
  GraduationCap,
  Users,
  Target,
  ArrowUpRight,
  Lightbulb,
  Trophy,
  Check,
  Eye,
  FileText,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import {
  getClassWeakTopicAnalytics,
  getLessonCompletionAnalytics,
  getStudentLeaderboard,
  TeacherPerformanceOverview,
  LessonCompletionMetric,
  StudentLeaderboardEntry,
} from "@/lib/studentIntelligenceStore";
import { useAcademySettings } from "@/lib/useAcademySettings";

export default function ClassWeakTopicAnalytics() {
  const { mappings } = useAcademySettings();
  const [activeTab, setActiveTab] = useState<"overview" | "lesson_completion" | "weak_topics" | "student_ranks">("overview");
  const [analyticsData, setAnalyticsData] = useState<TeacherPerformanceOverview>(() => getClassWeakTopicAnalytics());
  const [lessonCompletions, setLessonCompletions] = useState<LessonCompletionMetric[]>(() => getLessonCompletionAnalytics());
  const [studentLeaderboard, setStudentLeaderboard] = useState<StudentLeaderboardEntry[]>(() => getStudentLeaderboard());
  
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [activeRemedialModalTopic, setActiveRemedialModalTopic] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/learning/teacher-analytics?class=${selectedClassFilter}`);
      const json = await res.json();
      if (json.success && json.data) {
        setAnalyticsData(json.data);
        if (json.data.lessonCompletions) setLessonCompletions(json.data.lessonCompletions);
      } else {
        setAnalyticsData(getClassWeakTopicAnalytics());
        setLessonCompletions(getLessonCompletionAnalytics());
      }
    } catch {
      setAnalyticsData(getClassWeakTopicAnalytics());
      setLessonCompletions(getLessonCompletionAnalytics());
    } finally {
      setStudentLeaderboard(getStudentLeaderboard(selectedClassFilter));
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshData();

    const handleUpdate = () => {
      refreshData();
    };

    window.addEventListener("ptsc_quiz_attempt_recorded", handleUpdate);
    window.addEventListener("ptsc_quiz_completed", handleUpdate);
    window.addEventListener("ptsc_student_auth_changed", handleUpdate);
    return () => {
      window.removeEventListener("ptsc_quiz_attempt_recorded", handleUpdate);
      window.removeEventListener("ptsc_quiz_completed", handleUpdate);
      window.removeEventListener("ptsc_student_auth_changed", handleUpdate);
    };
  }, [selectedClassFilter]);

  const {
    overallAverageScore,
    totalQuizzesEvaluated,
    totalStudentsEnrolled,
    totalStudentsParticipated,
    overallParticipationRatePercentage,
    overallLessonCompletionRatePercentage,
    totalWeakTopicsTracked,
    activeRemedialLessonsCount,
    classesBreakdown,
    frequentlyMissedConcepts,
    commonMistakes,
  } = analyticsData;

  const filteredClasses = classesBreakdown.filter((c) => {
    if (selectedClassFilter === "all") return true;
    return c.classLevel === selectedClassFilter || c.trade.toLowerCase() === selectedClassFilter.toLowerCase();
  });

  const filteredLessons = lessonCompletions.filter((l) => {
    if (selectedClassFilter === "all") return true;
    return l.classLevel === selectedClassFilter || l.trade.toLowerCase() === selectedClassFilter.toLowerCase();
  });

  const filteredConcepts = frequentlyMissedConcepts.filter((fc) => {
    if (selectedSeverity === "all") return true;
    return fc.severity === selectedSeverity;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-black uppercase tracking-wider">
                TEACHER PERFORMANCE INTELLIGENCE
              </span>
              <span className="text-xs text-indigo-300 font-mono">
                PTSC Class Performance Engine (Phase 4)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <BrainCircuit className="w-8 h-8 text-cyan-400" />
              <span>শিক্ষক পারফরম্যান্স অ্যানালিটিক্স ও ক্লাস ট্র্যাকিং</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              শিক্ষার্থীদের মোট কুইজ অংশগ্রহণ, শ্রেণি ও ট্রেডভিত্তিক গড় স্কোর, পাঠ কমপ্লিশন রেট এবং ভুল ধারণার গভীর বিশ্লেষণ।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "রিফ্রেশ হচ্ছে..." : "ডাটা রিফ্রেশ"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>অ্যানালিটিক্স রিপোর্ট প্রিন্ট / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Student Participation */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>শিক্ষার্থী অংশগ্রহণ হার</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {overallParticipationRatePercentage}%
          </div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{totalStudentsParticipated} / {totalStudentsEnrolled} জন সক্রিয়</span>
          </div>
        </div>

        {/* Average Score */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>সার্বিক গড় কুইজ স্কোর</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {overallAverageScore}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            মোট মূল্যায়িত: {totalQuizzesEvaluated} টি কুইজ
          </div>
        </div>

        {/* Lesson Completion Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>পাঠ কমপ্লিশন রেট</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
            {overallLessonCompletionRatePercentage}%
          </div>
          <div className="text-[11px] text-cyan-600 font-bold">
            {lessonCompletions.length} টি প্রকাশিত লেসন
          </div>
        </div>

        {/* Identified Weak Topics */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>শনাক্তকৃত দুর্বল বিষয়</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {totalWeakTopicsTracked} টি
          </div>
          <div className="text-[11px] text-amber-600 font-bold">
            {activeRemedialLessonsCount} টি রিমিডিয়াল সুপারিশ
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>শ্রেণি ও ট্রেড পারফরম্যান্স</span>
        </button>

        <button
          onClick={() => setActiveTab("lesson_completion")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "lesson_completion"
              ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>পাঠ কমপ্লিশন বিশ্লেষণ ({lessonCompletions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("weak_topics")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "weak_topics"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>দুর্বল টপিক ও ভুল ধারণা ({frequentlyMissedConcepts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("student_ranks")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "student_ranks"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>শিক্ষার্থী মেধা র‍্যাঙ্কিং</span>
        </button>
      </div>

      {/* FILTER CONTROLS */}
      {(activeTab === "overview" || activeTab === "lesson_completion") && (
        <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-indigo-500" />
            <span>ফিল্টার করুন:</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">সব শ্রেণি ও ট্রেড (All)</option>
              <optgroup label="একাডেমিক শ্রেণি">
                {mappings.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameBangla}
                  </option>
                ))}
              </optgroup>
              <optgroup label="কারিগরি ট্রেড">
                <option value="electrical">ইলেকট্রিক্যাল সেফটি ও সার্কিট</option>
                <option value="computer">কম্পিউটার ও আইওটি</option>
                <option value="rac">রেফ্রিজারেশন ও এসি (RAC)</option>
                <option value="automobile">অটোমোবাইল ইঞ্জিনিয়ারিং</option>
                <option value="civil">সিভিল কনস্ট্রাকশন</option>
              </optgroup>
            </select>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 1: CLASS & TRADE PERFORMANCE OVERVIEW
         ======================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-indigo-400 dark:hover:border-indigo-700 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block font-mono">
                      {item.tradeLabel}
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {item.classLabel}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      item.status === "excellent"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300"
                        : item.status === "good"
                        ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300"
                        : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300"
                    }`}
                  >
                    {item.status === "excellent"
                      ? "চমৎকার (৮০%+)"
                      : item.status === "good"
                      ? "সন্তোষজনক"
                      : "মনোযোগ দরকার"}
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="space-y-2">
                  {/* Average Score */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">গড় কুইজ স্কোর:</span>
                      <span className="text-slate-900 dark:text-white font-mono">{item.averageScorePercentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.averageScorePercentage >= 80
                            ? "bg-emerald-500"
                            : item.averageScorePercentage >= 70
                            ? "bg-indigo-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${item.averageScorePercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Participation Rate */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">অংশগ্রহণ হার:</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-mono">
                        {item.participationRatePercentage}% ({item.participatedStudents}/{item.totalStudents} জন)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyan-500"
                        style={{ width: `${item.participationRatePercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>পাস রেট: <strong>{item.passRatePercentage}%</strong></span>
                    <span>পাঠ কমপ্লিশন: <strong>{item.completionRatePercentage}%</strong></span>
                  </div>
                </div>

                {/* Top weak topics in this class */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    শীর্ষ দুর্বল টপিকসমূহ:
                  </span>
                  <div className="space-y-1">
                    {item.topWeakTopics.map((wt, wIdx) => (
                      <div
                        key={wIdx}
                        className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
                      >
                        <span className="truncate max-w-[170px]">• {wt.topic}</span>
                        <span className="text-[11px] font-bold text-rose-500 font-mono">
                          {wt.missedRate}% ভুল
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: PUBLISHED LESSON COMPLETION RATES
         ======================================================== */}
      {activeTab === "lesson_completion" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-500" />
                  <span>প্রকাশিত পাঠ্যক্রম কমপ্লিশন ও অগ্রগতি তালিকা</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  প্রতিটি প্রকাশিত স্লাইড/ব্লগের শিক্ষার্থী রিডার সংখ্যা, কুইজ সাবমিশন ও কমপ্লিশন রেট
                </p>
              </div>
              <span className="text-xs text-cyan-600 dark:text-cyan-400 font-bold font-mono">
                {filteredLessons.length} টি লেসন বিশ্লেষিত
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-3.5 px-4">পাঠ্য শিরোনাম ও বিষয়</th>
                    <th className="py-3.5 px-4">শ্রেণি ও ট্রেড</th>
                    <th className="py-3.5 px-4 text-center">পাঠক সংখ্যা</th>
                    <th className="py-3.5 px-4 text-center">কুইজ সাবমিশন</th>
                    <th className="py-3.5 px-4 text-center">কমপ্লিশন রেট</th>
                    <th className="py-3.5 px-4 text-center">গড় স্কোর</th>
                    <th className="py-3.5 px-4">সর্বাধিক ভুল হওয়া বিষয়</th>
                    <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredLessons.map((l) => (
                    <tr key={l.lessonId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white max-w-xs truncate">
                          {l.lessonTitle}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">ID: {l.lessonId}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-bold">{l.classLabel}</div>
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">{l.tradeLabel}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {l.totalReaders} জন
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-slate-700 dark:text-slate-300">
                        <strong>{l.completedPassed}</strong> / {l.quizzesAttempted}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                l.completionRatePercentage >= 75
                                  ? "bg-emerald-500"
                                  : l.completionRatePercentage >= 55
                                  ? "bg-cyan-500"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${l.completionRatePercentage}%` }}
                            />
                          </div>
                          <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                            {l.completionRatePercentage}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-black text-indigo-600 dark:text-cyan-400">
                        {l.averageScorePercentage}%
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-900/60 block truncate max-w-xs">
                          {l.topMissedConcept}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            l.status === "high_completion"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300"
                              : l.status === "moderate"
                              ? "bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300"
                          }`}
                        >
                          {l.status === "high_completion" ? "উচ্চ কমপ্লিশন" : l.status === "moderate" ? "সন্তোষজনক" : "মনোযোগ দরকার"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: WEAK TOPICS & TEACHER INSIGHTS
         ======================================================== */}
      {activeTab === "weak_topics" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>সর্বাধিক ভুল হওয়া বিষয় ও পরবর্তী লেকচার নির্দেশনা</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  যেসব প্রশ্নে শিক্ষার্থীরা বারবার ভুল করছে এবং পরবর্তী ক্লাসে শিক্ষকের যে পদক্ষেপ নেওয়া উচিত
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setSelectedSeverity("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSeverity === "all" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-400 shadow-xs" : "text-slate-500"
                  }`}
                >
                  সবগুলো
                </button>
                <button
                  onClick={() => setSelectedSeverity("high")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSeverity === "high" ? "bg-rose-500 text-white shadow-xs" : "text-slate-500"
                  }`}
                >
                  উচ্চ ঝুঁকি (High)
                </button>
                <button
                  onClick={() => setSelectedSeverity("medium")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSeverity === "medium" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-500"
                  }`}
                >
                  মাঝারি (Medium)
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredConcepts.map((fc, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          fc.severity === "high"
                            ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300"
                            : fc.severity === "medium"
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300"
                        }`}
                      >
                        {fc.severity === "high" ? "🚨 জরুরি সমাধান" : fc.severity === "medium" ? "⚠️ মাঝারি ঝুঁকি" : "নরমাল"}
                      </span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        ট্রেড: {fc.trade}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({fc.missedCount} জন শিক্ষার্থী ভুল উত্তর দিয়েছে)
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {fc.topic}
                    </h3>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-indigo-600 dark:text-indigo-400">শিক্ষকের করণীয় সুপারিশ:</strong>{" "}
                        {fc.recommendation}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => setActiveRemedialModalTopic(fc.topic)}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>রিমিডিয়াল ক্লাস প্ল্যানে যোগ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Common Student Mistake Patterns */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <span>শিক্ষার্থীদের সাধারণ ভুল ধারণাসমূহ (Misconception Patterns)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                কনসেপ্ট বোঝার ক্ষেত্রে যেসব সূক্ষ্ম অমিল বারবার পরিলক্ষিত হচ্ছে
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {commonMistakes.map((m) => (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                      {m.affectedTrade}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                      {m.frequencyPercentage}% ভুল
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {m.topic}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {m.mistakeDescription}
                  </p>

                  <div className="pt-2 border-t border-purple-200/40 dark:border-purple-900/40 text-[11px] text-purple-800 dark:text-purple-300 font-medium">
                    💡 <strong>শিক্ষকের টিপস:</strong> {m.suggestedAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: CLASSROOM STUDENT LEADERBOARD & RANKINGS
         ======================================================== */}
      {activeTab === "student_ranks" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>শ্রেণি মেধা তালিকা ও শীর্ষ পারফর্মার (Class Leaderboard)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                কুইজ পয়েন্ট ও স্ট্রিকের ভিত্তিতে সেরা শিক্ষার্থীদের র‍্যাঙ্কিং
              </p>
            </div>
            <span className="text-xs text-indigo-600 dark:text-cyan-400 font-mono font-bold">
              মোট শিক্ষার্থী: {studentLeaderboard.length} জন
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {studentLeaderboard.slice(0, 9).map((s) => (
              <div
                key={s.rollNumber}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                    s.rank === 1 ? "bg-amber-400 text-slate-950" : s.rank === 2 ? "bg-slate-300 text-slate-900" : s.rank === 3 ? "bg-amber-700 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}>
                    {s.rank}
                  </span>
                  <div>
                    <strong className="text-xs font-black text-slate-900 dark:text-white block">
                      {s.studentName}
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      রোল: {s.rollNumber} • {s.tradeLabel}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-indigo-600 dark:text-cyan-400 font-mono block">
                    {s.totalScore} পয়েন্ট
                  </span>
                  <span className="text-[10px] text-rose-500 font-bold flex items-center gap-0.5 justify-end">
                    <Flame className="w-3 h-3 fill-current" />
                    <span>{s.streakDays} দিন</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remedial Modal Confirmation */}
      {activeRemedialModalTopic && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6 text-indigo-500" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                রিমিডিয়াল ক্লাস প্ল্যান আপডেট
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <strong>'{activeRemedialModalTopic}'</strong> টপিকটি আপনার পরবর্তী শিক্ষক ক্লাস রুটিন ও ডেমো লেসনে অগ্রাধিকার হিসেবে সেভ করা হয়েছে।
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>আগামী ক্লাসে এই টপিকের ৫ মিনিটের রিভিশন কুইজ ও ল্যাব ডেমো অন্তর্ভুক্ত থাকবে।</span>
            </div>

            <button
              onClick={() => setActiveRemedialModalTopic(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
