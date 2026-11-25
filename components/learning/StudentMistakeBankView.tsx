"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  BookOpen,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Trophy,
  RefreshCw,
} from "lucide-react";

interface MistakeBankItem {
  id: string;
  studentKey: string;
  studentRoll: string;
  studentName: string;
  className: string;
  trade: string;
  sourceType: "CHAPTER_QUIZ" | "LIVE_QUIZ";
  sourceId: string;
  sourceTitle?: string;
  topic?: string;
  subject?: string;
  questionId: string;
  questionText: string;
  options: string[];
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
  wrongCount: number;
  lastAttemptedAt: string;
}

interface StudentMistakeBankViewProps {
  studentRoll?: string;
  studentName?: string;
  className?: string;
  trade?: string;
}

export default function StudentMistakeBankView({
  studentRoll,
  studentName,
  className,
  trade,
}: StudentMistakeBankViewProps) {
  const [mistakes, setMistakes] = useState<MistakeBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [practiceMode, setPracticeMode] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
    message: string;
  } | null>(null);
  const [masteredCount, setMasteredCount] = useState(0);

  const fetchMistakes = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (studentRoll) qs.set("studentRoll", studentRoll);
      if (className) qs.set("className", className);
      if (trade) qs.set("trade", trade);
      const res = await fetch(`/api/learning/mistakes?${qs.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.mistakes)) {
        setMistakes(data.mistakes);
      }
    } catch (err) {
      console.error("Failed to fetch mistake bank:", err);
    } finally {
      setLoading(false);
    }
  }, [studentRoll, className, trade]);

  useEffect(() => {
    fetchMistakes();
  }, [fetchMistakes]);

  const currentQuestion = mistakes[practiceIdx] || null;

  const handleSubmitPractice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || !selectedAnswer.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/learning/mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "practice",
          mistakeId: currentQuestion.id,
          selectedAnswer: selectedAnswer.trim(),
          resolveOnCorrect: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          isCorrect: Boolean(data.isCorrect),
          correctAnswer: data.correctAnswer || currentQuestion.correctAnswer,
          explanation: data.explanation || currentQuestion.explanation,
          message: data.message,
        });
        if (data.isCorrect) {
          setMasteredCount((c) => c + 1);
        }
      }
    } catch (err) {
      console.error("Practice error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextPractice = () => {
    const wasCorrect = feedback?.isCorrect;
    setFeedback(null);
    setSelectedAnswer("");
    if (wasCorrect && currentQuestion) {
      const remaining = mistakes.filter((m) => m.id !== currentQuestion.id);
      setMistakes(remaining);
      if (remaining.length === 0) {
        setPracticeMode(false);
        setPracticeIdx(0);
      } else {
        setPracticeIdx((idx) => (idx >= remaining.length ? 0 : idx));
      }
    } else {
      setPracticeIdx((idx) => (idx + 1 < mistakes.length ? idx + 1 : 0));
    }
  };

  if (loading) {
    return (
      <div className="p-14 rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs font-bold text-slate-300">আপনার ভুল করা প্রশ্নগুলোর ব্যাংক লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-indigo-950/80 border border-rose-500/30 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-black uppercase tracking-wider">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>পার্সোনাল মিস্টেক ব্যাংক (আমার ভুলগুলো)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            🔁 আমার ভুলগুলো পুনরায় প্র্যাকটিস করো
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            অধ্যায় কুইজ এবং লাইভ কুইজে যেসব প্রশ্নে আপনার উত্তর ভুল হয়েছে, সেগুলো এখানে স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়। সঠিক উত্তর দিলে প্রশ্নটি মাস্টার্ড হয়ে তালিকা থেকে পরিষ্কার হবে।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchMistakes}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>রিফ্রেশ</span>
          </button>
          {mistakes.length > 0 && !practiceMode && (
            <button
              type="button"
              onClick={() => {
                setPracticeIdx(0);
                setSelectedAnswer("");
                setFeedback(null);
                setPracticeMode(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-rose-500/25 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>ভুলগুলো প্র্যাকটিস শুরু করুন ({mistakes.length} টি)</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty / Mastered State */}
      {mistakes.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/70 border border-emerald-500/30 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">
            অসাধারণ! {studentName || "আপনার"} কোনো পেন্ডিং ভুল প্রশ্ন নেই
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {masteredCount > 0
              ? `আপনি আজকে ${masteredCount}টি ভুল প্রশ্ন সফলভাবে মাস্টারি করেছেন।`
              : "অধ্যায়ভিত্তিক বা লাইভ কুইজে কোনো প্রশ্নের উত্তর ভুল হলে সেটি অনুশীলনের জন্য স্বয়ংক্রিয়ভাবে এখানে যুক্ত হবে।"}
          </p>
        </div>
      ) : practiceMode && currentQuestion ? (
        /* Interactive Mistake Re-Practice Arena */
        <div className="rounded-3xl bg-slate-900/90 border border-indigo-500/30 p-6 sm:p-8 space-y-5 shadow-2xl max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 font-black">
                ভুল পুনরাবৃত্তি ({practiceIdx + 1} / {mistakes.length})
              </span>
              {currentQuestion.topic && (
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  {currentQuestion.topic}
                </span>
              )}
              <span className="text-[11px] text-slate-400">
                {currentQuestion.sourceType === "LIVE_QUIZ" ? "লাইভ কুইজ" : "অধ্যায় কুইজ"} • {currentQuestion.wrongCount} বার ভুল হয়েছে
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPracticeMode(false)}
              className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
            >
              তালিকায় ফিরুন
            </button>
          </div>

          <h3 className="text-base sm:text-xl font-black text-white leading-relaxed">
            {currentQuestion.questionText}
          </h3>

          <form onSubmit={handleSubmitPractice} className="space-y-4">
            {Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((opt, oIdx) => {
                  const isSelected = selectedAnswer === opt;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={Boolean(feedback)}
                      onClick={() => setSelectedAnswer(opt)}
                      className={`p-4 rounded-2xl border text-left text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-3 ${
                        feedback
                          ? opt.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase()
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-200"
                            : isSelected && !feedback.isCorrect
                            ? "bg-rose-500/20 border-rose-500 text-rose-200"
                            : "bg-slate-800/60 border-slate-700 text-slate-400"
                          : isSelected
                          ? "bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/15"
                          : "bg-slate-800/80 border-slate-700 text-slate-200 hover:border-cyan-500/60"
                      }`}
                    >
                      <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-black shrink-0">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="flex-1 break-words">{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                disabled={Boolean(feedback)}
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                placeholder="আপনার সঠিক উত্তরটি এখানে লিখুন..."
                className="w-full p-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-bold text-white focus:border-cyan-500 focus:outline-none"
              />
            )}

            {feedback && (
              <div
                className={`p-4 rounded-2xl border space-y-2 text-xs sm:text-sm animate-fade-in ${
                  feedback.isCorrect
                    ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
                    : "bg-rose-950/60 border-rose-500/50 text-rose-200"
                }`}
              >
                <div className="flex items-center gap-2 font-black">
                  {feedback.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
                <p className="font-bold text-emerald-300">
                  ✅ সঠিক উত্তর: {feedback.correctAnswer}
                </p>
                <p className="text-slate-300 border-t border-white/10 pt-2">
                  <strong>💡 ব্যাখ্যা:</strong> {feedback.explanation}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              {!feedback ? (
                <button
                  type="submit"
                  disabled={!selectedAnswer.trim() || submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>উত্তর যাচাই করুন</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextPractice}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 cursor-pointer"
                >
                  <span>{mistakes.length <= 1 && feedback.isCorrect ? "সম্পন্ন করুন" : "পরবর্তী প্রশ্ন"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        /* Review Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mistakes.map((m, idx) => (
            <div
              key={m.id}
              className="p-5 rounded-3xl bg-slate-900/75 border border-slate-800 hover:border-rose-500/40 transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="px-2.5 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 font-black">
                    #{idx + 1} • {m.sourceType === "LIVE_QUIZ" ? "লাইভ কুইজ" : "অধ্যায় কুইজ"}
                  </span>
                  <span className="text-slate-400 font-mono">
                    ভুল হয়েছে: {m.wrongCount} বার
                  </span>
                </div>

                <h4 className="text-sm font-black text-white leading-snug">
                  {m.questionText}
                </h4>

                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300">
                    <span className="font-bold block text-[10px] uppercase">❌ আপনার ভুল উত্তর</span>
                    {m.studentAnswer}
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300">
                    <span className="font-bold block text-[10px] uppercase">✅ সঠিক উত্তর</span>
                    {m.correctAnswer}
                  </div>
                </div>

                {m.explanation && (
                  <p className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 leading-relaxed">
                    <strong className="text-cyan-400">💡 ব্যাখ্যা:</strong> {m.explanation}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="truncate flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{m.sourceTitle || m.topic || "অধ্যায় মূল্যায়ন"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPracticeIdx(idx);
                    setSelectedAnswer("");
                    setFeedback(null);
                    setPracticeMode(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-bold transition cursor-pointer shrink-0"
                >
                  প্র্যাকটিস →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
