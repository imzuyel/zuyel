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
  Send,
  Phone,
  HelpCircle,
  Clock,
  ShieldAlert,
  Loader2,
  ExternalLink,
  BookMarked,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAcademySettings } from "@/lib/useAcademySettings";
import { ACADEMIC_CLASSES, MANDATORY_FOUR_TRADES } from "@/lib/academicStructure";

export interface ClassWeakTopicAnalyticsProps {
  initialTab?: "overview" | "weak_topics" | "matrix" | "at_risk" | "lesson_completion" | "student_ranks";
}

export default function ClassWeakTopicAnalytics({
  initialTab = "overview",
}: ClassWeakTopicAnalyticsProps) {
  const { mappings } = useAcademySettings();
  const [activeTab, setActiveTab] = useState<"overview" | "weak_topics" | "matrix" | "at_risk" | "lesson_completion" | "student_ranks">(initialTab);
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState<string>("all");
  
  const [analyticsData, setAnalyticsData] = useState<any>({
    overallAverageScore: 72,
    totalQuizzesEvaluated: 145,
    totalStudentsEnrolled: 840,
    totalStudentsParticipated: 685,
    overallParticipationRatePercentage: 82,
    overallLessonCompletionRatePercentage: 76,
    totalWeakTopicsTracked: 6,
    activeRemedialLessonsCount: 3,
    classesBreakdown: [],
    weakTopics: [],
    atRiskStudents: [],
    topPerformers: [],
    lessonCompletions: [],
    frequentlyMissedConcepts: [],
    commonMistakes: [],
  });

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [selectedTradeFilter, setSelectedTradeFilter] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Remedial & Note action states
  const [generatingTopic, setGeneratingTopic] = useState<string | null>(null);
  const [activeRemedialDeck, setActiveRemedialDeck] = useState<any | null>(null);
  const [activeRevisionNote, setActiveRevisionNote] = useState<any | null>(null);
  const [sendingSmsRolls, setSendingSmsRolls] = useState<Record<number, boolean>>({});

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (selectedClassFilter !== "all") params.append("class", selectedClassFilter);
      if (selectedTradeFilter !== "all") params.append("trade", selectedTradeFilter);

      const res = await fetch(`/api/learning/teacher-analytics?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setAnalyticsData(json.data);
      }
    } catch (err) {
      console.error("Failed to load teacher analytics:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [selectedClassFilter, selectedTradeFilter]);

  // 1-Click Remedial Quiz Generator
  const handleCreateRemedialQuiz = async (topic: string, className = "Class 9", trade = "Computer & IT") => {
    setGeneratingTopic(topic);
    try {
      const res = await fetch("/api/learning/teacher-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remedial_quiz",
          topic,
          className,
          trade,
        }),
      });
      const json = await res.json();
      if (json.success && json.deck) {
        setActiveRemedialDeck(json.deck);
        toast.success(`'${topic}'-এর ওপর ৫টি প্রশ্নের রিমেডিয়াল লাইভ কুইজ সফলভাবে প্রস্তুত হয়েছে!`);
      } else {
        toast.error(json.message || "রিমেডিয়াল কুইজ তৈরিতে সমস্যা হয়েছে");
      }
    } catch {
      toast.error("সার্ভার যোগাযোগে ব্যর্থ হয়েছে");
    } finally {
      setGeneratingTopic(null);
    }
  };

  // 1-Click Revision Note Generator
  const handleGenerateRevisionNote = async (topic: string, className = "Class 9", trade = "Computer & IT") => {
    setGeneratingTopic(topic);
    try {
      const res = await fetch("/api/learning/teacher-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revision_note",
          topic,
          className,
          trade,
        }),
      });
      const json = await res.json();
      if (json.success && json.note) {
        setActiveRevisionNote(json.note);
        toast.success(`'${topic}'-এর রিভিশন নোট সফলভাবে তৈরি হয়েছে!`);
      } else {
        toast.error(json.message || "রিভিশন নোট তৈরিতে সমস্যা হয়েছে");
      }
    } catch {
      toast.error("সার্ভার যোগাযোগে ব্যর্থ হয়েছে");
    } finally {
      setGeneratingTopic(null);
    }
  };

  // 1-Click Parent Alert SMS
  const handleSendParentAlertSms = async (student: any) => {
    setSendingSmsRolls((prev) => ({ ...prev, [student.roll]: true }));
    try {
      const message = `অভিভাবক মহোদয়, আপনার সন্তান ${student.name} (রোল: ${student.roll}) কারিগরি কুইজে ${student.avgScore}% নম্বর পেয়েছে ও ক্লাসে উপস্থিতি ${student.attendanceRate}%। বিশেষ করে '${student.primaryWeakTopic}' বিষয়ে দুর্বলতা রয়েছে। অনুগ্রহ করে তার পড়াশোনায় বাড়তি নজর দিন। - অধ্যক্ষ, PTSC`;

      const res = await fetch("/api/communication/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAudience: "individual",
          individualPhone: student.phone || "01711000000",
          studentName: student.name,
          message,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`রোল ${student.roll} (${student.name})-এর অভিভাবকের কাছে সতর্কতামূলক SMS পাঠানো হয়েছে!`, {
          description: `মোবাইল: ${student.phone || "01711000000"}`,
        });
      } else {
        toast.info(`এসএমএস গেটওয়ে রেডি: রোল ${student.roll}-এর বার্তা লগ করা হয়েছে।`);
      }
    } catch {
      toast.info(`এসএমএস নোটিফিকেশন প্রক্রিয়াধীন রয়েছে।`);
    } finally {
      setSendingSmsRolls((prev) => ({ ...prev, [student.roll]: false }));
    }
  };

  const {
    overallAverageScore = 72,
    totalQuizzesEvaluated = 145,
    totalStudentsEnrolled = 840,
    totalStudentsParticipated = 685,
    overallParticipationRatePercentage = 82,
    overallLessonCompletionRatePercentage = 76,
    totalWeakTopicsTracked = 6,
    activeRemedialLessonsCount = 3,
    classesBreakdown = [],
    weakTopics = [],
    atRiskStudents = [],
    topPerformers = [],
    steadyLearners = [],
    studentMatrix = [],
    lessonCompletions = [],
    commonMistakes = [],
  } = analyticsData || {};

  const filteredWeakTopics = weakTopics.filter((w: any) => {
    if (selectedSeverity === "all") return true;
    return w.severity?.toLowerCase() === selectedSeverity.toLowerCase();
  });

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-black uppercase tracking-wider">
                TEACHER ANALYTICS & EARLY WARNING HUB
              </span>
              <span className="text-xs text-indigo-300 font-mono">
                PTSC Smart Classroom Engine (Phase 4)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <BrainCircuit className="w-8 h-8 text-cyan-400" />
              <span>শিক্ষক পারফরম্যান্স অ্যানালিটিক্স ও ট্র্যাকিং কমান্ড সেন্টার</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              লাইভ কুইজ ও অধ্যায়ভিত্তিক মূল্যায়নের রিয়েল-টাইম নির্ভুলতা, দুর্বল টপিক চিহ্নিতকরণ, রিমেডিয়াল পাঠদান এবং ঝুঁকিপূর্ণ শিক্ষার্থীদের আর্লি-ওয়ার্নিং সিস্টেম।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "রিফ্রেশ হচ্ছে..." : "ডাটা রিফ্রেশ"}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>রিপোর্ট প্রিন্ট / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Class Average Score */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>ক্লাস গড় নির্ভুলতা স্কোর</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-2">
            <span>{overallAverageScore}%</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 inline" /> +4.2%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            মূল্যায়িত: {totalQuizzesEvaluated} টি কুইজ ও লেসন
          </div>
        </div>

        {/* KPI 2: Active Participation Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>সক্রিয় অংশগ্রহণ হার</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {overallParticipationRatePercentage}%
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{totalStudentsParticipated} / {totalStudentsEnrolled} জন অংশ নিয়েছে</span>
          </div>
        </div>

        {/* KPI 3: Identified Weak Topics */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>শনাক্তকৃত দুর্বল টপিক</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {totalWeakTopicsTracked} টি বিষয়
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
            {activeRemedialLessonsCount} টি বিষয়ে জরুরি রিমেডিয়াল সুপারিশ
          </div>
        </div>

        {/* KPI 4: At-Risk Students */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 hover:border-rose-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>ঝুঁকিপূর্ণ শিক্ষার্থী (At-Risk)</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {atRiskStudents.length} জন
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
            উপস্থিতি &lt; ৭০% অথবা গড় নম্বর &lt; ৪৫%
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ফিল্টার:</span>
          </div>

          {/* Class Filter */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">সকল শ্রেণি (Class 6 - 12)</option>
            <option value="Class 9">শ্রেণি ৯ (ভোকেশনাল)</option>
            <option value="Class 10">শ্রেণি ১০ (ভোকেশনাল)</option>
            <option value="Class 11">একাদশ শ্রেণি</option>
            <option value="Class 12">দ্বাদশ শ্রেণি</option>
          </select>

          {/* Trade Filter */}
          <select
            value={selectedTradeFilter}
            onChange={(e) => setSelectedTradeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">সকল টেকনোলজি / ট্রেড</option>
            <option value="Computer & IT">কম্পিউটার ও আইটি (IT-IoT)</option>
            <option value="Electrical & Electronics">ইলেকট্রিক্যাল ও ইলেকট্রনিক্স</option>
            <option value="Civil & Construction">সিভিল অ্যান্ড ড্রাফটিং</option>
            <option value="Automobile">অটোমোবাইল টেকনোলজি</option>
          </select>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>শ্রেণি পারফরম্যান্স</span>
          </button>

          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "matrix"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>শিক্ষার্থী ম্যাট্রিক্স (Matrix)</span>
          </button>

          <button
            onClick={() => setActiveTab("weak_topics")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "weak_topics"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>দুর্বল টপিক হিটম্যাপ</span>
          </button>

          <button
            onClick={() => setActiveTab("at_risk")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "at_risk"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>ঝুঁকিপূর্ণ শিক্ষার্থী তালিকা ({atRiskStudents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("student_ranks")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "student_ranks"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>টপ পারফর্মার</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 1: CLASS & TRADE OVERVIEW
         ======================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classesBreakdown.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {item.classLabel}
                    </h3>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                      {item.tradeLabel}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      item.status === "excellent"
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        : item.status === "good"
                        ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800"
                        : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                    }`}
                  >
                    {item.status === "excellent" ? "চমৎকার" : item.status === "good" ? "সন্তোষজনক" : "মনোযোগ দরকার"}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">গড় স্কোর:</span>
                    <strong className="text-slate-900 dark:text-white font-mono font-bold">
                      {item.averageScorePercentage}%
                    </strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.averageScorePercentage >= 75
                          ? "bg-emerald-500"
                          : item.averageScorePercentage >= 60
                          ? "bg-indigo-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${item.averageScorePercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">অংশগ্রহণ:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {item.participatedStudents} জন ({item.participationRatePercentage}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">কুইজ নেওয়া হয়েছে:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {item.quizzesTaken} টি সেশন
                    </span>
                  </div>
                </div>

                {item.topWeakTopics && item.topWeakTopics.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-black text-rose-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> শীর্ষ দুর্বল বিষয়:
                    </span>
                    {item.topWeakTopics.map((wt: any, wIdx: number) => (
                      <div key={wIdx} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                        <span className="truncate max-w-[180px]">• {wt.topic}</span>
                        <span className="text-[11px] font-bold text-rose-500 font-mono">{wt.missedRate}% ভুল</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: WEAK TOPIC HEATMAP & REMEDIAL ACTIONS
         ======================================================== */}
      {activeTab === "weak_topics" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>দুর্বল বিষয় হিটম্যাপ ও অ্যাকশন স্টুডিও</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  যেসব বিষয়ে শিক্ষার্থীদের সঠিক উত্তরের হার কম (&lt;৫৫% ক্রিটিক্যাল, ৫৫-৭৫% মাঝারি)। ১-ক্লিকে রিমেডিয়াল কুইজ বা রিভিশন নোট প্রস্তুত করুন।
                </p>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setSelectedSeverity("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSeverity === "all" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-400 shadow-xs" : "text-slate-500"
                  }`}
                >
                  সবগুলো ({weakTopics.length})
                </button>
                <button
                  onClick={() => setSelectedSeverity("high")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSeverity === "high" ? "bg-rose-500 text-white shadow-xs" : "text-slate-500"
                  }`}
                >
                  🚨 ক্রিটিক্যাল (&lt;৫৫%)
                </button>
                <button
                  onClick={() => setSelectedSeverity("medium")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSeverity === "medium" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-500"
                  }`}
                >
                  ⚠️ মাঝারি (৫৫-৭৫%)
                </button>
              </div>
            </div>

            {/* Weak Topics List */}
            <div className="space-y-4">
              {filteredWeakTopics.map((wt: any) => {
                const isCritical = wt.severity === "HIGH" || wt.accuracy < 55;
                const isModerate = wt.severity === "MEDIUM" || (wt.accuracy >= 55 && wt.accuracy < 75);

                return (
                  <div
                    key={wt.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCritical
                        ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 hover:border-rose-400"
                        : isModerate
                        ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 hover:border-amber-400"
                        : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isCritical
                                ? "bg-rose-600 text-white"
                                : isModerate
                                ? "bg-amber-500 text-slate-950"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            {isCritical ? "🚨 ক্রিটিক্যাল দুর্বলতা" : isModerate ? "⚠️ মাঝারি দুর্বলতা" : "✅ আয়ত্তাধীন"}
                          </span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {wt.class} • {wt.trade}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            ({wt.studentCount} জন শিক্ষার্থী ভুল করেছে)
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                          {wt.topic}
                        </h3>

                        {/* Mastery Bar */}
                        <div className="space-y-1 max-w-md">
                          <div className="flex items-center justify-between text-xs font-mono font-bold">
                            <span className="text-slate-500">ক্লাস নির্ভুলতা:</span>
                            <span className={isCritical ? "text-rose-600 font-black" : isModerate ? "text-amber-600 font-black" : "text-emerald-600 font-black"}>
                              {wt.accuracy}% সঠিক (ভুল: {wt.failureRate}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCritical ? "bg-rose-500" : isModerate ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${wt.accuracy}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-indigo-600 dark:text-indigo-400">শিক্ষকের করণীয় সুপারিশ:</strong>{" "}
                            {wt.recommendation}
                          </div>
                        </div>
                      </div>

                      {/* 2 1-Click Action Buttons */}
                      <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5">
                        <button
                          onClick={() => handleCreateRemedialQuiz(wt.topic, wt.class, wt.trade)}
                          disabled={generatingTopic === wt.topic}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                        >
                          {generatingTopic === wt.topic ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Zap className="w-3.5 h-3.5 text-amber-200" />
                          )}
                          <span>🎯 রিমেডিয়াল লাইভ কুইজ তৈরি করুন</span>
                        </button>

                        <button
                          onClick={() => handleGenerateRevisionNote(wt.topic, wt.class, wt.trade)}
                          disabled={generatingTopic === wt.topic}
                          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          <BookMarked className="w-3.5 h-3.5 text-cyan-200" />
                          <span>📖 রিভিশন নোট জেনারেট করুন</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      
      {/* ========================================================
          TAB: AT-RISK VS TOP PERFORMER STUDENT MATRIX
         ======================================================== */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-500" />
                  <span>শিক্ষার্থী পারফরম্যান্স ম্যাট্রিক্স (Student Performance Matrix)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  হাজিরা হার (&lt;৭০% সতর্কতা) ও কুইজ নির্ভুলতা (&lt;৪৫% সতর্কতা) সমন্বয় করে ৩টি স্তরে শিক্ষার্থীদের শ্রেণিবিন্যাস।
                </p>
              </div>

              {/* Matrix Category Segmented Filter */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setMatrixCategoryFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    matrixCategoryFilter === "all" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-400 shadow-xs" : "text-slate-500"
                  }`}
                >
                  সকল শিক্ষার্থী ({(studentMatrix || []).length})
                </button>
                <button
                  onClick={() => setMatrixCategoryFilter("TOP_PERFORMER")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    matrixCategoryFilter === "TOP_PERFORMER" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500"
                  }`}
                >
                  🏆 টপ পারফর্মার ({(topPerformers || []).length})
                </button>
                <button
                  onClick={() => setMatrixCategoryFilter("STEADY_LEARNER")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    matrixCategoryFilter === "STEADY_LEARNER" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500"
                  }`}
                >
                  📈 নিয়মিত শিক্ষার্থী ({(steadyLearners || []).length})
                </button>
                <button
                  onClick={() => setMatrixCategoryFilter("AT_RISK")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    matrixCategoryFilter === "AT_RISK" ? "bg-rose-600 text-white shadow-xs" : "text-slate-500"
                  }`}
                >
                  🚨 ঝুঁকিপূর্ণ শিক্ষার্থী ({(atRiskStudents || []).length})
                </button>
              </div>
            </div>

            {/* Matrix Student Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(studentMatrix || [])
                .filter((s: any) => {
                  if (matrixCategoryFilter === "all") return true;
                  return s.category === matrixCategoryFilter;
                })
                .map((s: any) => {
                  const isTop = s.category === "TOP_PERFORMER";
                  const isAtRisk = s.category === "AT_RISK";
                  const isSteady = s.category === "STEADY_LEARNER";

                  return (
                    <div
                      key={s.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                        isTop
                          ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400"
                          : isAtRisk
                          ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 hover:border-rose-400"
                          : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-indigo-400"
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Card Header: Avatar & Category Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-sm ${
                                isTop
                                  ? "bg-gradient-to-tr from-emerald-600 to-teal-500"
                                  : isAtRisk
                                  ? "bg-gradient-to-tr from-rose-600 to-amber-600"
                                  : "bg-gradient-to-tr from-indigo-600 to-cyan-600"
                              }`}
                            >
                              {s.name?.slice(0, 2) || "ST"}
                            </div>
                            <div>
                              <strong className="text-xs font-black text-slate-900 dark:text-white block">
                                {s.name}
                              </strong>
                              <span className="text-[11px] text-slate-500 font-mono">
                                রোল: #{s.roll} • {s.className}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isTop
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300"
                                : isAtRisk
                                ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300"
                                : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300"
                            }`}
                          >
                            {s.categoryLabel || (isTop ? "🏆 টপ পারফর্মার" : isAtRisk ? "🚨 ঝুঁকিপূর্ণ" : "📈 নিয়মিত")}
                          </span>
                        </div>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">হাজিরা হার:</span>
                            <strong
                              className={`font-mono font-bold ${
                                s.attendanceRate >= 80
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : s.attendanceRate >= 70
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-rose-600 dark:text-rose-400 font-black"
                              }`}
                            >
                              {s.attendanceRate}%
                            </strong>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">কুইজ নির্ভুলতা:</span>
                            <strong
                              className={`font-mono font-bold ${
                                s.avgScore >= 75
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : s.avgScore >= 50
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-rose-600 dark:text-rose-400 font-black"
                              }`}
                            >
                              {s.avgScore}%
                            </strong>
                          </div>
                        </div>

                        {/* Weakest Subject / Identified Topic */}
                        <div className="text-[11px] space-y-1">
                          <span className="text-slate-500 font-medium block">
                            {isTop ? "বিশেষ দক্ষতা:" : "দুর্বলতা / পর্যবেক্ষণের বিষয়:"}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-lg block truncate font-bold text-xs ${
                              isAtRisk
                                ? "bg-rose-100/70 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900/40"
                                : isTop
                                ? "bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/40"
                                : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-900/40"
                            }`}
                          >
                            {s.primaryWeakTopic}
                          </span>
                        </div>
                      </div>

                      {/* Card Action */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">
                          সক্রিয়: {s.lastActive || "আজ"}
                        </span>

                        <button
                          onClick={() => handleSendParentAlertSms(s)}
                          disabled={sendingSmsRolls[s.roll]}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
                            isAtRisk
                              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {sendingSmsRolls[s.roll] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>{isAtRisk ? "সতর্কতামূলক SMS" : "প্রোগ্রেস SMS"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: AT-RISK STUDENTS EARLY WARNING
         ======================================================== */}
      {activeTab === "at_risk" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <span>ঝুঁকিপূর্ণ শিক্ষার্থী তালিকা ও আর্লি-ওয়ার্নিং সিস্টেম</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  যেসব শিক্ষার্থীর উপস্থিতি ৭০% এর কম অথবা কুইজ গড় স্কোর ৪৫% এর নিচে। ১-ক্লিকে অভিভাবকের মোবাইলে সতর্কতামূলক SMS পাঠান।
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold font-mono">
                {atRiskStudents.length} জন বিশেষ পর্যবেক্ষণে রয়েছে
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-3.5 px-4">রোল ও শিক্ষার্থী</th>
                    <th className="py-3.5 px-4">শ্রেণি ও ট্রেড</th>
                    <th className="py-3.5 px-4 text-center">উপস্থিতি হার</th>
                    <th className="py-3.5 px-4 text-center">কুইজ গড়</th>
                    <th className="py-3.5 px-4">প্রধান দুর্বলতা / সমস্যা</th>
                    <th className="py-3.5 px-4 text-center">ঝুঁকির মাত্রা</th>
                    <th className="py-3.5 px-4 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {atRiskStudents.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {s.name}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          রোল: #{s.roll} • {s.studentId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{s.className}</div>
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">{s.trade}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono font-black text-xs ${
                            s.attendanceRate < 70 ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {s.attendanceRate}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono font-black text-xs ${
                            s.avgScore < 45 ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {s.avgScore}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-medium max-w-xs line-clamp-1">
                          {s.issue}
                        </div>
                        <span className="text-[11px] text-rose-500 font-semibold block truncate max-w-xs">
                          {s.primaryWeakTopic}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            s.severity === "HIGH"
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300"
                          }`}
                        >
                          {s.severity === "HIGH" ? "উচ্চ ঝুঁকি" : "মাঝারি ঝুঁকি"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleSendParentAlertSms(s)}
                          disabled={sendingSmsRolls[s.roll]}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1.5 ml-auto shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          {sendingSmsRolls[s.roll] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>অভিভাবককে SMS পাঠান</span>
                        </button>
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
          TAB 4: TOP PERFORMERS & LEADERBOARD
         ======================================================== */}
      {activeTab === "student_ranks" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>ক্লাস টপ পারফর্মার ও কৃতিত্ব তালিকা</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  সর্বাধিক স্কোর ও নিয়মিত ক্লাসে উপস্থিতি বজায় রাখা শিক্ষার্থীদের তালিকা
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topPerformers.map((p: any) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs ${
                        p.rank === 1
                          ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30"
                          : p.rank === 2
                          ? "bg-slate-300 text-slate-900"
                          : p.rank === 3
                          ? "bg-amber-700 text-white"
                          : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                      }`}
                    >
                      #{p.rank}
                    </span>
                    <div>
                      <strong className="text-xs font-black text-slate-900 dark:text-white block">
                        {p.name}
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        রোল: #{p.roll} • {p.className} ({p.trade})
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                      {p.avgScore}% স্কোর
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      উপস্থিতি: {p.attendanceRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Remedial Quiz Ready Confirmation */}
      {activeRemedialDeck && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeRemedialDeck.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ৫টি প্রশ্ন সংবলিত রিমেডিয়াল কুইজটি লাইভ কুইজ হাবে সফলভাবে সেভ করা হয়েছে। আপনি এখনই এটি লাইভ ক্লাসে শিক্ষার্থীদের জন্য চালু করতে পারেন।
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>লাইভ কুইজ কোড প্রস্তুত</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                শ্রেণি: {activeRemedialDeck.className} • ট্রেড: {activeRemedialDeck.trade} • সময়: ২০ সেকেন্ড/প্রশ্ন
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setActiveRemedialDeck(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                পরে শুরু করব
              </button>
              <a
                href="/admin?tab=quiz_admin"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:scale-102 transition-transform cursor-pointer"
              >
                <span>🚀 লাইভ স্টুডিওতে যান</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Revision Note Viewer */}
      {activeRevisionNote && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-xl w-full shadow-2xl space-y-4 animate-scale-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {activeRevisionNote.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveRevisionNote(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">পাঠের সারসংক্ষেপ:</span>
                {activeRevisionNote.summary}
              </div>

              <div className="space-y-1.5">
                <span className="font-black text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider text-[11px]">
                  📌 প্রধান শিখন বিষয় ও সূত্র:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1">
                  {activeRevisionNote.keyPoints?.map((kp: string, idx: number) => (
                    <li key={idx}>{kp}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200">
                <strong className="block mb-0.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  সাধারণ ভুল বা ফাঁদ (Common Trap):
                </strong>
                {activeRevisionNote.commonTrap}
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200">
                <strong className="block mb-0.5 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                  শিক্ষকের ক্লাসরুম টিপ:
                </strong>
                {activeRevisionNote.instructorTip}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট করুন</span>
              </button>
              <button
                onClick={() => setActiveRevisionNote(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 cursor-pointer"
              >
                সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
