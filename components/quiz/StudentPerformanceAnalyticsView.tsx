"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Clock,
  Target,
  FileText,
  Calendar,
  Layers,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Printer,
  Zap,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StudentPerformanceAnalyticsViewProps {
  studentName: string;
  quizTitle?: string;
  totalScore: number;
  accuracy: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  rank?: number;
  bestStreak?: number;
  classId?: number;
  trade?: string;
  proctoringStrikes?: number;
  questions?: Array<{
    id?: string | number;
    questionText?: string;
    question?: string;
    options?: string[];
    correctAnswer?: number;
    correctIndex?: number;
    explanation?: string;
    topic?: string;
    difficulty?: string;
    timeLimit?: number;
    studentSelected?: any;
    isCorrect?: boolean;
  }>;
}

export default function StudentPerformanceAnalyticsView({
  studentName,
  quizTitle = "কারিগরি পরীক্ষা মূল্যায়ন",
  totalScore,
  accuracy,
  totalQuestions,
  correctAnswers,
  wrongAnswers,
  rank = 1,
  bestStreak = 3,
  classId = 4,
  trade = "Technical / Vocational",
  proctoringStrikes = 0,
  questions = [],
}: StudentPerformanceAnalyticsViewProps) {
  // Topic breakdown calculation
  const topicsMap: { [topic: string]: { total: number; correct: number } } = {};
  
  // Default mock questions if empty
  const displayQuestions =
    questions && questions.length > 0
      ? questions
      : [
          {
            id: 1,
            questionText: "ওহমের সূত্রানুসারে ভোল্টেজ (V), কারেন্ট (I) ও রোধের (R) সম্পর্ক কোনটি?",
            options: ["V = IR", "I = VR", "R = VI", "P = VI"],
            correctAnswer: 0,
            studentSelected: 0,
            isCorrect: true,
            topic: "বৈদ্যুতিক মৌলিক সূত্র",
            difficulty: "easy",
            explanation: "V = IR হলো ওহমের সূত্রের স্ট্যান্ডার্ড গাণিতিক রূপ।",
          },
          {
            id: 2,
            questionText: "IPv4 অ্যাড্রেসে মোট কতটি বিট থাকে?",
            options: ["16 বিট", "32 বিট", "64 বিট", "128 বিট"],
            correctAnswer: 1,
            studentSelected: 2,
            isCorrect: false,
            topic: "কম্পিউটার নেটওয়ার্কিং",
            difficulty: "medium",
            explanation: "IPv4 অ্যাড্রেস ৩২ বিট দৈর্ঘ্যের যা ৪টি অকটেটে বিভক্ত থাকে।",
          },
          {
            id: 3,
            questionText: "লোড-বেয়ারিং ইটের গাঁথুনির জন্য সিমেন্ট ও বালির আদর্শ অনুপাত কত?",
            options: ["১ : ৪", "১ : ৮", "১ : ১.৫", "১ : ১০"],
            correctAnswer: 0,
            studentSelected: 0,
            isCorrect: true,
            topic: "সিভিল কনস্ট্রাকশন",
            difficulty: "medium",
            explanation: "লোড-বেয়ারিং দেওয়ালের জন্য ১:৪ অনুপাত সবচেয়ে টেকসই ও প্রচলিত।",
          },
          {
            id: 4,
            questionText: "নিউটন এর গতির দ্বিতীয় সূত্র দ্বারা কোনটি পরিমাপ করা যায়?",
            options: ["জড়তা", "বল (F = ma)", "ঘর্ষণ", "কাজ"],
            correctAnswer: 1,
            studentSelected: 0,
            isCorrect: false,
            topic: "পদার্থবিজ্ঞান — গতিবিদ্যা",
            difficulty: "hard",
            explanation: "দ্বিতীয় সূত্র বস্তুর ভরবেগের পরিবর্তনের হার প্রযুক্ত বলের সমানুপাতিক (F = ma)।",
          },
        ];

  displayQuestions.forEach((q) => {
    const topic = q.topic || "সাধারণ কারিগরি জ্ঞান";
    if (!topicsMap[topic]) {
      topicsMap[topic] = { total: 0, correct: 0 };
    }
    topicsMap[topic].total += 1;
    if (q.isCorrect || q.studentSelected === (q.correctAnswer ?? q.correctIndex ?? 0)) {
      topicsMap[topic].correct += 1;
    }
  });

  const topicBreakdown = Object.entries(topicsMap).map(([topic, data]) => ({
    topic,
    total: data.total,
    correct: data.correct,
    percentage: Math.round((data.correct / (data.total || 1)) * 100),
  }));

  const weakQuestions = displayQuestions
    .filter((q) => !q.isCorrect && q.studentSelected !== (q.correctAnswer ?? q.correctIndex ?? 0))
    .map((q) => ({
      question: q.questionText || q.question || "Question",
      studentAnswer: Array.isArray(q.options) && q.studentSelected !== undefined ? q.options[q.studentSelected] || `অপশন ${q.studentSelected + 1}` : "ভুল উত্তর",
      correctAnswer: Array.isArray(q.options) && (q.correctAnswer ?? q.correctIndex ?? 0) !== undefined ? q.options[q.correctAnswer ?? q.correctIndex ?? 0] : "সঠিক উত্তর",
      explanation: q.explanation || "কারিগরি পাঠ্যসূচি অনুযায়ী সঠিক উত্তর নির্বাচন করা হয়েছে।",
      topic: q.topic || "মৌলিক কারিগরি",
    }));

  // AI Recommendations State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "topics" | "questions" | "ai_coach">("overview");

  const generateAiAnalytics = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/ai/analytics/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          quizTitle,
          totalScore,
          accuracy,
          totalQuestions,
          correctAnswers,
          wrongAnswers,
          classId,
          trade,
          topicBreakdown,
          weakQuestions,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAiReport(data.data);
        setActiveTab("ai_coach");
      }
    } catch (e) {
      console.error("Failed to generate AI analytics:", e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "overview", label: "সারসংক্ষেপ (Overview)", icon: Target },
            { id: "topics", label: "টপিকভিত্তিক দক্ষতা (Topic Mastery)", icon: Layers },
            { id: "questions", label: "প্রশ্ন পর্যালোচনা (Questions)", icon: BookOpen },
            { id: "ai_coach", label: "এআই মেন্টর ও রিভিশন প্ল্যান", icon: Sparkles, badge: "AI" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          title="প্রিন্ট বা পিডিএফ সেভ করুন"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">প্রিন্ট রিপোর্ট</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Score */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">মোট স্কোর</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-2xl font-black text-white font-mono">{totalScore}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">অর্জিত নম্বর</p>
            </div>

            {/* Accuracy */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">সঠিকতা (Accuracy)</span>
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black text-emerald-400 font-mono">{accuracy}%</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {correctAnswers} সঠিক / {wrongAnswers} ভুল
              </p>
            </div>

            {/* Rank */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">লাইভ র‍্যাঙ্ক</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-black text-cyan-400 font-mono">#{rank}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">লিডারবোর্ড অবস্থান</p>
            </div>

            {/* Streak & Proctoring Integrity */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">সুরক্ষা ও স্ট্রিক</span>
                <Flame className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-rose-400 font-mono">{bestStreak}x</span>
                {proctoringStrikes === 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
                    ১০০% সুরক্ষিত
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[9px] font-bold border border-amber-500/20">
                    {proctoringStrikes} সতর্কতা
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">বেস্ট একিউরেসি রান</p>
            </div>
          </div>

          {/* AI Banner Call-to-Action */}
          <div className="relative rounded-3xl p-6 bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-500/40 shadow-xl overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-2 relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Remedial Learning Coach</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                আপনার দুর্বল অধ্যায়গুলো শনাক্ত করে ৫ দিনের কাস্টম রিভিশন প্ল্যান পান
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gemini AI পরীক্ষার প্রশ্ন ও ভুল উত্তরের ওপর ভিত্তি করে তাৎক্ষণিক দুর্বলতার কারণ এবং BTEB পাঠ্যপুস্তকের নির্দিষ্ট পৃষ্ঠা রেফারেন্সসহ গাইড তৈরি করবে।
              </p>
            </div>

            <button
              type="button"
              onClick={generateAiAnalytics}
              disabled={isGeneratingAi}
              className="relative z-10 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-indigo-500/30 flex items-center gap-2.5 transition shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingAi ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>বিশ্লেষণ তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>এআই দুর্বলতা রিপোর্ট তৈরি করুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: TOPIC MASTERY GAUGES */}
      {activeTab === "topics" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-black text-white">টপিকভিত্তিক দক্ষতা মিটার (Topic Mastery Breakdown)</h3>
              <p className="text-xs text-slate-400">প্রতিটি অধ্যায় ও কারিগরি বিষয়ের উপর অর্জিত দখলের স্তর</p>
            </div>

            <div className="space-y-3.5 pt-2">
              {topicBreakdown.map((item, idx) => {
                const isGood = item.percentage >= 70;
                const isModerate = item.percentage >= 40 && item.percentage < 70;

                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">{item.topic}</span>
                      <div className="flex items-center gap-2 font-mono font-bold">
                        <span className="text-slate-400 text-[11px]">
                          {item.correct}/{item.total} সঠিক
                        </span>
                        <span
                          className={`font-black ${
                            isGood ? "text-emerald-400" : isModerate ? "text-amber-400" : "text-rose-400"
                          }`}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          isGood
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : isModerate
                            ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                            : "bg-gradient-to-r from-rose-500 to-red-400"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUESTIONS BREAKDOWN */}
      {activeTab === "questions" && (
        <div className="space-y-3">
          {displayQuestions.map((q, idx) => {
            const isCorrect = q.isCorrect || q.studentSelected === (q.correctAnswer ?? q.correctIndex ?? 0);
            const isExpanded = expandedQuestionId === idx;

            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isCorrect
                    ? "bg-emerald-950/15 border-emerald-500/30"
                    : "bg-rose-950/15 border-rose-500/30"
                }`}
              >
                <div
                  onClick={() => setExpandedQuestionId(isExpanded ? null : idx)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                        isCorrect
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-100 line-clamp-1">
                        {q.questionText || q.question}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        টপিক: {q.topic || "সাধারণ"} • কাঠিন্য: {q.difficulty || "medium"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> সঠিক
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[10px] font-bold flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> ভুল উত্তর
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-800/60 bg-slate-950/40">
                    {/* Options List */}
                    {q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {q.options.map((opt, optIdx) => {
                          const isTheCorrect = optIdx === (q.correctAnswer ?? q.correctIndex ?? 0);
                          const isStudentPicked = optIdx === q.studentSelected;

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                isTheCorrect
                                  ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-300 font-bold"
                                  : isStudentPicked
                                  ? "bg-rose-950/40 border-rose-500/60 text-rose-300 font-bold"
                                  : "bg-slate-900 border-slate-800 text-slate-400"
                              }`}
                            >
                              <span>
                                {String.fromCharCode(65 + optIdx)}) {opt}
                              </span>
                              {isTheCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                              {!isTheCorrect && isStudentPicked && <XCircle className="w-4 h-4 text-rose-400" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" /> সমাধান ও কারিগরি ব্যাখ্যা:
                        </span>
                        <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: AI REMEDIAL COACH */}
      {activeTab === "ai_coach" && (
        <div className="space-y-6">
          {!aiReport ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <Sparkles className="w-12 h-12 text-indigo-400 mx-auto animate-pulse" />
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">এআই দুর্বলতা রিপোর্ট এখনো তৈরি করা হয়নি</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  নিচের বাটনে ক্লিক করে জেমিনাই এআই মডেলের মাধ্যমে আপনার পরীক্ষার ভুলের বিশ্লেষণ ও ৫ দিনের রিভিশন রোডম্যাপ তৈরি করুন।
                </p>
              </div>
              <button
                type="button"
                onClick={generateAiAnalytics}
                disabled={isGeneratingAi}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 mx-auto cursor-pointer"
              >
                {isGeneratingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>রিপোর্ট তৈরি করুন</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/40 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase text-indigo-300 tracking-wider">
                      এআই পেডাগজি পর্যবেক্ষণ
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black uppercase">
                    দক্ষতা স্তর: {aiReport.masteryLevel || "Developing"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold">
                  {aiReport.executiveSummary}
                </p>
              </div>

              {/* Strengths & Weaknesses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
                  <h4 className="text-xs font-black text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" /> অর্জিত দক্ষতা ও শক্তি (Strengths)
                  </h4>
                  <div className="space-y-2">
                    {(aiReport.topStrengths || []).map((str: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs space-y-1">
                        <span className="font-bold text-emerald-300 block">{str.topic}</span>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{str.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critical Weaknesses */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-rose-500/30 space-y-3">
                  <h4 className="text-xs font-black text-rose-400 flex items-center gap-2 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" /> দুর্বলতা ও ধারণাগত ঘাটতি (Weaknesses)
                  </h4>
                  <div className="space-y-2">
                    {(aiReport.criticalWeaknesses || []).map((wk: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs space-y-1.5">
                        <span className="font-bold text-rose-300 block">{wk.topic}</span>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{wk.gapAnalysis}</p>
                        {wk.suggestedFix && (
                          <div className="pt-1 text-[11px] text-amber-300/90 font-medium">
                            💡 প্রতিকার: {wk.suggestedFix}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5-Day Remedial Action Plan */}
              {aiReport.remedialRoadmap && (
                <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      ৫ দিনের ব্যক্তিগত রিভিশন রোডম্যাপ (5-Day Remedial Roadmap)
                    </h4>
                    <p className="text-xs text-slate-400">দুর্বল বিষয়গুলোতে দক্ষতা ফিরিয়ে আনতে প্রতিদিনের পদক্ষেপ</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {aiReport.remedialRoadmap.map((step: any, i: number) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-black uppercase">
                            দিন {step.day || i + 1}
                          </span>
                          <h5 className="text-xs font-bold text-slate-100">{step.focusTopic}</h5>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{step.actionItem}</p>
                        </div>
                        <div className="pt-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold">
                          ⏱ সময়: {step.estimatedHours || 1.5} ঘণ্টা
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Class-wise PDF Curriculum References */}
              {aiReport.curriculumPdfRecommendations && aiReport.curriculumPdfRecommendations.length > 0 && (
                <div className="p-5 rounded-3xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
                  <h4 className="text-xs font-black text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    পাঠ্যবই ও কারিকুলাম পিডিএফ রেফারেন্স (Textbook Links)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {aiReport.curriculumPdfRecommendations.map((pdf: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/20 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-white block">📄 {pdf.docTitle}</span>
                          <span className="text-[10px] text-cyan-400 font-mono">{pdf.chapter}</span>
                          {pdf.actionNote && <p className="text-[10px] text-slate-400">{pdf.actionNote}</p>}
                        </div>
                        <a
                          href="/ai/pdf-manager"
                          className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold transition flex items-center gap-1 shrink-0"
                        >
                          পড়ুন <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Motivational Footnote */}
              {aiReport.motivationalQuote && (
                <p className="text-xs text-center text-slate-400 italic font-medium pt-2">
                  &ldquo;{aiReport.motivationalQuote}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
