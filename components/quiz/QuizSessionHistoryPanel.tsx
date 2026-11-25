"use client";

import React, { useState, useMemo } from "react";
import {
  History,
  Play,
  Eye,
  Trophy,
  Users,
  Calendar,
  Clock,
  RefreshCw,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  PauseCircle,
  BarChart3,
  ArrowLeft,
  Crown,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QuizSmartResumeModalProps {
  isOpen: boolean;
  deckTitle: string;
  pausedSession: any;
  totalSlides: number;
  isBusy: boolean;
  onResume: () => void;
  onStartFresh: () => void;
  onClose: () => void;
}

export function QuizSmartResumeModal({
  isOpen,
  deckTitle,
  pausedSession,
  totalSlides,
  isBusy,
  onResume,
  onStartFresh,
  onClose,
}: QuizSmartResumeModalProps) {
  if (!isOpen || !pausedSession) return null;

  const slidesTotal = Math.max(1, pausedSession.totalQuestions || totalSlides || 1);
  const rawIdx = Number(pausedSession.currentSlideIndex) || 0;
  const nextQIdx =
    (pausedSession.stage === "RESULT_REVEAL" || pausedSession.stage === "REVEAL") &&
    rawIdx + 1 < slidesTotal
      ? rawIdx + 1
      : rawIdx;
  const displayQuestionNum = Math.min(slidesTotal, nextQIdx + 1);
  const playerCount =
    Number(pausedSession.playerCount) ||
    Object.keys(pausedSession.players || {}).length ||
    0;

  const pausedWhen = pausedSession.pausedAt || pausedSession.updatedAt;
  const formattedTime = pausedWhen
    ? new Date(pausedWhen).toLocaleString("bn-BD", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "সম্প্রতি";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      aria-labelledby="smart-resume-modal-title"
    >
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm cursor-pointer"
        onClick={() => !isBusy && onClose()}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        className="relative z-10 w-full max-w-lg rounded-3xl bg-[#111827] border-2 border-indigo-400/40 text-white shadow-[0_25px_70px_rgba(0,0,0,0.8)] p-6 sm:p-7 space-y-5 max-h-[90dvh] overflow-y-auto overscroll-contain"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center justify-center shrink-0">
              <PauseCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 block">
                বিরতিতে থাকা সেশন পাওয়া গেছে
              </span>
              <h3 id="smart-resume-modal-title" className="text-lg font-black text-white leading-snug">
                {deckTitle}
              </h3>
            </div>
          </div>
          <button
            type="button"
            disabled={isBusy}
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Snapshot */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/70 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span>রুম পিন (PIN):</span>
            <span className="font-mono font-black text-base text-amber-300 tracking-widest">
              {pausedSession.code}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>সর্বশেষ বিরতি:</span>
            <span className="font-bold text-slate-200">{formattedTime}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>সংরক্ষিত অগ্রগতি:</span>
            <span className="font-bold text-cyan-300">
              প্রশ্ন {displayQuestionNum} / {slidesTotal} • {playerCount} জন শিক্ষার্থী
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          আগের সেশনে শিক্ষার্থীদের সকল উত্তর ও পয়েন্ট সংরক্ষিত রয়েছে। আপনি কি আগের জায়গা থেকে চালু করতে চান নাকি নতুন সেশন শুরু করবেন?
        </p>

        {/* Two Clear Choices (Task 4) */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            autoFocus
            disabled={isBusy}
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 cursor-pointer transition disabled:opacity-50"
          >
            {isBusy ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5 fill-slate-950 shrink-0" />
            )}
            <span>
              ▶️ আগের জায়গা থেকে চালু করুন (Resume from Q{displayQuestionNum} / {slidesTotal} • {playerCount} জন শিক্ষার্থী)
            </span>
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={onStartFresh}
            className="w-full py-3 px-4 rounded-2xl bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-400/50 text-indigo-200 font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>🆕 নতুন সেশন শুরু করুন (Start Fresh)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface QuizSessionHistoryPanelProps {
  quizId: string;
  quizTitle: string;
  sessions: any[];
  isLoading: boolean;
  resumingSessionId: string | null;
  scope: "current" | "all";
  onScopeChange: (nextScope: "current" | "all") => void;
  onRefresh: () => void;
  onResumeSession: (session: any) => void;
  onBackToEditor?: () => void;
}

export default function QuizSessionHistoryPanel({
  quizId,
  quizTitle,
  sessions,
  isLoading,
  resumingSessionId,
  scope,
  onScopeChange,
  onRefresh,
  onResumeSession,
  onBackToEditor,
}: QuizSessionHistoryPanelProps) {
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  const visibleSessions = useMemo(() => {
    if (scope === "all") return sessions;
    return sessions.filter((s) => String(s.quizId || "") === String(quizId || ""));
  }, [sessions, scope, quizId]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Top Bar */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-black border border-indigo-500/20">
              <History className="w-3.5 h-3.5" />
              <span>📜 সেশন হিস্ট্রি (Session History)</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {scope === "current" ? quizTitle : "সকল কুইজের লাইভ সেশন হিস্ট্রি"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              পূর্বের সমাপ্ত এবং বিরতিতে থাকা সকল লাইভ সেশনের পূর্ণাঙ্গ স্কোরবোর্ড, উত্তর বিশ্লেষণ এবং পুনরায় চালুর নিয়ন্ত্রণ।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => onScopeChange("current")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  scope === "current"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                এই কুইজ
              </button>
              <button
                type="button"
                onClick={() => onScopeChange("all")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  scope === "all"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                সব কুইজ ({sessions.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              title="হিস্ট্রি রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? "animate-spin text-indigo-500" : ""}`} />
            </button>

            {onBackToEditor && (
              <button
                type="button"
                onClick={onBackToEditor}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>এডিটর</span>
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        {isLoading && visibleSessions.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
            <p className="text-xs font-bold text-slate-500">সেশন হিস্ট্রি লোড হচ্ছে...</p>
          </div>
        ) : visibleSessions.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
            <History className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-black text-slate-700 dark:text-slate-200">
              এখনও কোনো লাইভ সেশন হিস্ট্রি নেই
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              এই কুইজটি লাইভ শুরু করে বিরতি ও সেভ বা সমাপ্ত করলে প্রতিটি সেশনের পূর্ণাঙ্গ ফলাফল এবং শিক্ষার্থীদের স্কোর এখানে সংরক্ষিত থাকবে।
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleSessions.map((run) => {
              const isPaused = run.status === "PAUSED";
              const isActive = run.status === "ACTIVE" || run.status === "WAITING";
              const dateVal = run.pausedAt || run.endedAt || run.updatedAt || run.createdAt;
              const dateText = dateVal
                ? new Date(dateVal).toLocaleString("bn-BD", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "—";

              return (
                <div
                  key={run.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                          isPaused
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-400/40"
                            : isActive
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-400/40"
                            : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-400/40"
                        }`}
                      >
                        {isPaused ? "⏸️ বিরতিতে (Paused)" : isActive ? "🟢 লাইভ চলছে" : "🏁 সমাপ্ত (Ended)"}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-black text-slate-700 dark:text-amber-300">
                        PIN: {run.code}
                      </span>

                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{dateText}</span>
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                      {run.title || quizTitle}
                    </h4>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-cyan-500" />
                        <span>মোট শিক্ষার্থী: {run.playerCount || 0} জন</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span>
                          সম্পন্ন প্রশ্ন: {run.questionsCompleted ?? 0} / {run.totalQuestions || 1}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-300">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>
                          সর্বোচ্চ স্কোরার:{" "}
                          {run.topScorer
                            ? `${run.topScorer.name} (${run.topScorer.score} pts)`
                            : "তথ্য নেই"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDetail(run);
                        setExpandedStudentId(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-200 font-black text-xs flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Eye className="w-4 h-4" />
                      <span>👁️ বিস্তারিত স্কোর ও উত্তর</span>
                    </button>

                    {(isPaused || isActive) && (
                      <button
                        type="button"
                        disabled={resumingSessionId === run.id}
                        onClick={() => onResumeSession(run)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/25 cursor-pointer transition disabled:opacity-50"
                      >
                        {resumingSessionId === run.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 fill-slate-950" />
                        )}
                        <span>{isPaused ? "▶️ পুনরায় চালু করুন" : "▶️ স্টেজ ওপেন করুন"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Student-by-Student Score & Answers Modal */}
      <AnimatePresence>
        {selectedDetail && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm cursor-pointer"
              onClick={() => setSelectedDetail(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative z-10 w-full max-w-4xl max-h-[88dvh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-400">
                    <BarChart3 className="w-4 h-4" />
                    <span>সেশন ফলাফল ও শিক্ষার্থী-ভিত্তিক উত্তর</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedDetail.title} (PIN: {selectedDetail.code})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetail(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain space-y-6">
                {/* Summary Metric Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 block">অংশগ্রহণকারী</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      {selectedDetail.playerCount || 0} জন
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 block">সম্পন্ন প্রশ্ন</span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-300 font-mono">
                      {selectedDetail.questionsCompleted ?? 0} / {selectedDetail.totalQuestions || 1}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 block">গড় স্কোর</span>
                    <span className="text-xl font-black text-cyan-600 dark:text-cyan-300 font-mono">
                      {selectedDetail.avgScore || 0} pts
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-300 block">শীর্ষ স্কোরার</span>
                    <span className="text-sm font-black text-amber-700 dark:text-amber-200 truncate block">
                      {selectedDetail.topScorer
                        ? `👑 ${selectedDetail.topScorer.name} (${selectedDetail.topScorer.score})`
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* Student-by-Student Leaderboard + Answers */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    শিক্ষার্থীদের স্কোর ও উত্তর তালিকা ({(selectedDetail.studentDetails || []).length} জন)
                  </h4>

                  {(selectedDetail.studentDetails || []).length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 font-bold">
                      এই সেশনে কোনো শিক্ষার্থীর স্কোর পাওয়া যায়নি।
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {(selectedDetail.studentDetails || []).map((st: any, idx: number) => {
                        const isOpen = expandedStudentId === st.id;
                        const hasAnswers = Array.isArray(st.answers) && st.answers.length > 0;
                        return (
                          <div
                            key={st.id || idx}
                            className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden"
                          >
                            <div className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 font-mono font-black text-xs flex items-center justify-center">
                                  {idx === 0 ? <Crown className="w-4 h-4 text-amber-500" /> : `#${st.rank || idx + 1}`}
                                </span>
                                <span className="text-2xl">{st.avatar || "🎓"}</span>
                                <div>
                                  <p className="text-sm font-black text-slate-900 dark:text-white">
                                    {st.name}
                                  </p>
                                  <p className="text-[11px] font-bold text-slate-500">
                                    রোল: {st.roll || "—"} • সঠিক: {st.correctCount || 0}/{st.answeredCount || 0}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5">
                                <span className="px-3 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-mono font-black text-xs">
                                  {st.score || 0} pts
                                </span>
                                {hasAnswers && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedStudentId(isOpen ? null : st.id)}
                                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-indigo-600 dark:text-indigo-300 cursor-pointer"
                                  >
                                    {isOpen ? "উত্তর লুকান" : `উত্তর দেখুন (${st.answers.length})`}
                                  </button>
                                )}
                              </div>
                            </div>

                            {isOpen && hasAnswers && (
                              <div className="px-4 pb-4 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-white/60 dark:bg-slate-900/60">
                                {st.answers.map((ans: any, aIdx: number) => (
                                  <div
                                    key={aIdx}
                                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {ans.isCorrect ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                      ) : (
                                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                      )}
                                      <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                                        প্রশ্ন {Number(ans.slideIndex) + 1}: {ans.questionText}
                                      </span>
                                    </div>
                                    <span
                                      className={`font-mono font-black shrink-0 ${
                                        ans.isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                                      }`}
                                    >
                                      {ans.isCorrect ? `+${ans.points}p` : "0p"} ({((ans.responseTimeMs || 0) / 1000).toFixed(1)}s)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Question-by-Question Accuracy Breakdown */}
                {Array.isArray(selectedDetail.questionAnalytics) && selectedDetail.questionAnalytics.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      প্রশ্ন-ভিত্তিক সঠিকতার হার
                    </h4>
                    <div className="space-y-2">
                      {selectedDetail.questionAnalytics.map((qa: any, qIdx: number) => (
                        <div
                          key={qIdx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              Q{Number(qa.slideIndex) + 1}. {qa.questionText}
                            </span>
                            <span className="font-mono font-black text-indigo-600 dark:text-indigo-300 shrink-0">
                              {qa.accuracy}% ({qa.correctCount}/{qa.answeredCount})
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, Number(qa.accuracy) || 0))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
