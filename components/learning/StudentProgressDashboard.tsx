"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  Award,
  BookOpen,
  CheckCircle2,
  BrainCircuit,
  Zap,
  TrendingUp,
  Clock,
  RotateCcw,
  Target,
  ChevronRight,
  Sparkles,
  BarChart3,
  Calendar,
} from "lucide-react";
import {
  getStudentStats,
  getQuizAttempts,
  getWeakTopics,
  getStudentAllQuizHistory,
  getActiveStudentAccount,
  StudentIntelligenceStats,
  QuizAttemptRecord,
  WeakTopicItem,
} from "@/lib/studentIntelligenceStore";
import WeakTopicPracticeModal from "./WeakTopicPracticeModal";

export default function StudentProgressDashboard() {
  const activeStudent = getActiveStudentAccount();
  const [stats, setStats] = useState<StudentIntelligenceStats>(() => getStudentStats(activeStudent?.rollNumber));
  const [attempts, setAttempts] = useState<QuizAttemptRecord[]>(() =>
    getStudentAllQuizHistory(activeStudent?.rollNumber)
  );
  const [weakTopics, setWeakTopics] = useState<WeakTopicItem[]>(() => getWeakTopics(activeStudent?.rollNumber));
  const [weakTopicsModalOpen, setWeakTopicsModalOpen] = useState(false);

  const refreshData = () => {
    const student = getActiveStudentAccount();
    setStats(getStudentStats(student?.rollNumber));
    setAttempts(getStudentAllQuizHistory(student?.rollNumber));
    setWeakTopics(getWeakTopics(student?.rollNumber));
  };

  useEffect(() => {
    refreshData();

    window.addEventListener("ptsc_student_auth_changed", refreshData);
    window.addEventListener("ptsc_student_logout", refreshData);
    return () => {
      window.removeEventListener("ptsc_student_auth_changed", refreshData);
      window.removeEventListener("ptsc_student_logout", refreshData);
    };
  }, []);

  const avgPercentage = stats.totalQuestionsAttempted > 0
    ? Math.round((stats.totalCorrectQuestions / stats.totalQuestionsAttempted) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Hero Streak Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                <Flame className="w-3.5 h-3.5 fill-current text-slate-950" />
                STUDENT INTELLIGENCE & STREAK TRACKER
              </span>
              <span className="text-xs text-amber-300 font-mono font-bold">
                PTSC ERP Learning Hub
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <span>দৈনিক লার্নিং স্ট্রিক:</span>
              <span className="text-amber-400 font-extrabold flex items-center gap-1">
                {stats.currentStreakDays} দিন টানা 🔥
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-medium">
              আপনার নিয়মিত অনুশীলন ও কুইজ জমার মাধ্যমে তৈরি হচ্ছে লার্নিং স্ট্রিক। প্রতিদিন অন্তত একটি স্লাইড রিভিউ ও অনুশীলনী কুইজ সম্পন্ন করে স্ট্রিক ধরে রাখুন!
            </p>
          </div>

          {/* Weak Topics Quick Action CTA */}
          <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-amber-500/30 text-center space-y-3 shrink-0 w-full md:w-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-black text-amber-300">
              <Target className="w-4 h-4 text-amber-400" />
              <span>চিহ্নিত দুর্বল টপিক: {weakTopics.length} টি</span>
            </div>

            <button
              onClick={() => setWeakTopicsModalOpen(true)}
              className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current text-slate-950" />
              <span>দূর্বল বিষয়ে অনুশীলন করুন</span>
            </button>
          </div>

        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card 1: Completed Lessons */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-cyan-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">পঠিত পাঠ সংখ্যা</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {stats.completedLessonsCount} <span className="text-xs font-normal text-slate-400">টি</span>
          </h3>
        </div>

        {/* Card 2: Quizzes Taken */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">অংশগ্রহণকৃত কুইজ</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {stats.quizzesTakenCount} <span className="text-xs font-normal text-slate-400">টি</span>
          </h3>
        </div>

        {/* Card 3: Avg Score */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">গড় নির্ভুলতা (Accuracy)</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {avgPercentage}%
          </h3>
        </div>

        {/* Card 4: Current Streak */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">লার্নিং স্ট্রিক</p>
          <h3 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {stats.currentStreakDays} <span className="text-xs font-normal text-slate-400">দিন</span>
          </h3>
        </div>

      </div>

      {/* Weak Topics Section & Streak History Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Identified Weak Topics Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                স্বয়ংক্রিয় দুর্বল বিষয় সনাক্তকরণ (Weak Topic Detection)
              </h3>
            </div>

            <button
              onClick={() => setWeakTopicsModalOpen(true)}
              className="text-xs font-extrabold text-indigo-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              অনুশীলন কুইজ খুলুন ➔
            </button>
          </div>

          {weakTopics.length > 0 ? (
            <div className="space-y-3">
              {weakTopics.map((wt) => (
                <div
                  key={wt.topicName}
                  className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/50 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <strong className="text-xs font-black text-slate-900 dark:text-white block">
                      ⚠️ {wt.topicName}
                    </strong>
                    <span className="text-[10px] text-slate-500 block">
                      উৎস পাঠ: {wt.lessonTitle}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-black shrink-0">
                    {wt.missedCount} বার ভুল হয়েছে
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                কোনো চিহ্নিত দুর্বল টপিক নেই!
              </p>
              <p className="text-[11px] text-slate-500">
                কুইজগুলোতে আপনার নির্ভুলতার হার বেশ ভালো।
              </p>
            </div>
          )}
        </div>

        {/* Quiz History Timeline Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                সাম্প্রতিক কুইজের ফলাফল ও স্কোর (Recent Quiz Results)
              </h3>
            </div>
          </div>

          {attempts.length > 0 ? (
            <div className="space-y-3">
              {attempts.map((att) => (
                <div
                  key={att.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {att.lessonTitle}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>ট্রেড: {att.tradeLabel}</span>
                      <span>•</span>
                      <span>তারিখ: {att.completedAt}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black font-mono inline-block ${
                        att.percentage >= 60
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {att.score}/{att.totalQuestions} ({att.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic p-6 text-center">
              এখনো কোনো কুইজে অংশ নেওয়া হয়নি।
            </p>
          )}
        </div>

      </div>

      {/* Weak Topics Modal */}
      {weakTopicsModalOpen && (
        <WeakTopicPracticeModal
          onClose={() => setWeakTopicsModalOpen(false)}
          onRefreshStats={refreshData}
        />
      )}

    </div>
  );
}
