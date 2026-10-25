"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  HelpCircle,
  Send,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ShieldCheck,
  BookOpen,
  Layers,
  FileQuestion,
  CornerDownRight,
  Reply,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  getStudentDoubts,
  saveStudentDoubt,
  addDoubtReply,
  StudentDoubtItem,
  StudentDoubtReply,
} from "@/lib/studentIntelligenceStore";
import { PublishedLesson } from "@/lib/publishedLessonsStore";

interface StudentDoubtBoxProps {
  lesson?: PublishedLesson;
  lessonId?: string | number;
  lessonTitle?: string;
  chapterTitle?: string;
  quizQuestionId?: string | number;
  quizQuestionText?: string;
  contextType?: "lesson" | "chapter" | "quiz_question";
  contextTitle?: string;
  tradeClass?: string;
  defaultStudentName?: string;
  defaultStudentRoll?: string;
}

export default function StudentDoubtBox({
  lesson,
  lessonId,
  lessonTitle,
  chapterTitle,
  quizQuestionId,
  quizQuestionText,
  contextType,
  contextTitle,
  tradeClass,
  defaultStudentName = "",
  defaultStudentRoll = "",
}: StudentDoubtBoxProps) {
  // Resolved context values
  const effectiveLessonId = String(lesson?.id || lessonId || "general");
  const effectiveLessonTitle = lesson?.title || lessonTitle || chapterTitle || "সাধারণ কারিগরি পাঠ";
  const effectiveTradeClass =
    tradeClass || (lesson ? `${lesson.classLabel} (${lesson.tradeLabel})` : "ভোকেশনাল / কারিগরি");

  // Determine explicit context tag
  const resolvedContextType: "lesson" | "chapter" | "quiz_question" =
    contextType || (quizQuestionText ? "quiz_question" : chapterTitle ? "chapter" : "lesson");

  const resolvedContextTitle =
    contextTitle ||
    (resolvedContextType === "quiz_question"
      ? `কুইজ প্রশ্ন: ${quizQuestionText?.slice(0, 48)}...`
      : resolvedContextType === "chapter"
      ? `অধ্যায়: ${chapterTitle || effectiveLessonTitle}`
      : `পাঠ: ${effectiveLessonTitle}`);

  const [doubts, setDoubts] = useState<StudentDoubtItem[]>([]);
  const [studentName, setStudentName] = useState(defaultStudentName);
  const [studentRoll, setStudentRoll] = useState(defaultStudentRoll);
  const [questionText, setQuestionText] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedToast, setSubmittedToast] = useState<string | null>(null);

  // Sync doubts from store on mount or context change
  useEffect(() => {
    const all = getStudentDoubts();
    const filtered = all.filter(
      (d) =>
        d.lessonId === effectiveLessonId ||
        (contextTitle && d.contextTitle === contextTitle) ||
        (chapterTitle && d.contextTitle?.includes(chapterTitle))
    );
    setDoubts(filtered);
  }, [effectiveLessonId, contextTitle, chapterTitle]);

  // Handle new question submission with Optimistic UI updates
  const handleSubmitDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const sName = studentName.trim() || "PTSC শিক্ষার্থী";
    const sRoll = studentRoll.trim() ? `রোল: ${studentRoll.trim()}` : "রোল: উল্লেখহীন";
    const textToSubmit = questionText.trim();
    const tempId = `temp-doubt-${Date.now()}`;

    // 1. Optimistic Update: Immediately inject temporary item into UI
    const optimisticDoubt: StudentDoubtItem = {
      id: tempId,
      lessonId: effectiveLessonId,
      lessonTitle: effectiveLessonTitle,
      studentName: sName,
      studentRoll: sRoll,
      tradeClass: effectiveTradeClass,
      question: textToSubmit,
      status: "pending",
      createdAt: "আজকে",
      contextType: resolvedContextType,
      contextTitle: resolvedContextTitle,
      questionNumber: quizQuestionId ? String(quizQuestionId) : undefined,
      replies: [],
    };

    setDoubts((prev) => [optimisticDoubt, ...prev]);
    setQuestionText("");
    setIsSubmitting(true);
    setSubmittedToast("প্রশ্নটি শিক্ষকের ইনবক্সে পৌঁছানো হচ্ছে...");

    // 2. Persist to storage with small natural async delay
    setTimeout(() => {
      const updatedAll = saveStudentDoubt({
        lessonId: effectiveLessonId,
        lessonTitle: effectiveLessonTitle,
        studentName: sName,
        studentRoll: sRoll,
        tradeClass: effectiveTradeClass,
        question: textToSubmit,
        contextType: resolvedContextType,
        contextTitle: resolvedContextTitle,
        questionNumber: quizQuestionId ? String(quizQuestionId) : undefined,
      });

      const refreshed = updatedAll.filter(
        (d) =>
          d.lessonId === effectiveLessonId ||
          (contextTitle && d.contextTitle === contextTitle) ||
          (chapterTitle && d.contextTitle?.includes(chapterTitle))
      );

      setDoubts(refreshed);
      setIsSubmitting(false);
      setSubmittedToast("✅ প্রশ্নটি সফলভাবে জমা হয়েছে! বিষয় শিক্ষক সমাধান দিলে সরাসরি দেখতে পাবেন।");
      setTimeout(() => setSubmittedToast(null), 4000);
    }, 350);
  };

  // Handle follow-up reply submission with Optimistic UI updates
  const handleSendReply = (doubtId: string) => {
    if (!replyInputText.trim()) return;

    const textToReply = replyInputText.trim();
    const sName = studentName.trim() || "PTSC শিক্ষার্থী";
    const tempReplyId = `temp-reply-${Date.now()}`;

    // 1. Optimistic Reply
    const optimisticReply: StudentDoubtReply = {
      id: tempReplyId,
      sender: "student",
      senderName: sName,
      text: textToReply,
      timestamp: "এইমাত্র",
    };

    setDoubts((prev) =>
      prev.map((d) => (d.id === doubtId ? { ...d, replies: [...(d.replies || []), optimisticReply] } : d))
    );
    setReplyInputText("");

    // 2. Persist to storage
    setTimeout(() => {
      const updated = addDoubtReply(doubtId, {
        sender: "student",
        senderName: sName,
        text: textToReply,
      });

      const refreshed = updated.filter(
        (d) =>
          d.lessonId === effectiveLessonId ||
          (contextTitle && d.contextTitle === contextTitle) ||
          (chapterTitle && d.contextTitle?.includes(chapterTitle))
      );
      setDoubts(refreshed);
    }, 250);
  };

  return (
    <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-white/10 p-5 sm:p-7 space-y-6 shadow-sm">
      {/* Box Header with Context Awareness */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-200/60 dark:border-indigo-800/40">
              ACADEMIC DOUBT RESOLUTION
            </span>

            {/* Context Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
              {resolvedContextType === "quiz_question" ? (
                <FileQuestion className="w-3 h-3 text-cyan-500" />
              ) : resolvedContextType === "chapter" ? (
                <Layers className="w-3 h-3 text-amber-500" />
              ) : (
                <BookOpen className="w-3 h-3 text-indigo-500" />
              )}
              <span className="truncate max-w-[260px] sm:max-w-xs">{resolvedContextTitle}</span>
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>সরাসরি বিষয়ভিত্তিক শিক্ষককে প্রশ্ন করুন</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="px-3 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold border border-slate-200/60 dark:border-slate-700/60">
            প্রশ্ন: {doubts.length}
          </span>
        </div>
      </div>

      {/* Submit Doubt Form with Glassmorphism */}
      <form
        onSubmit={handleSubmitDoubt}
        className="space-y-3.5 bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-white/10"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>নতুন প্রশ্ন বা জিজ্ঞাসা জমা দিন:</span>
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">তাত্ক্ষণিক শিক্ষকের নোটিফিকেশনে যাবে</span>
        </div>

        {/* Optimistic Status Toast */}
        <AnimatePresence>
          {submittedToast && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-xl flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{submittedToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="আপনার নাম (যেমন: রাকিবুল ইসলাম)"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="p-2.5 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <input
            type="text"
            placeholder="রোল নম্বর বা আইডি (যেমন: ১২)"
            value={studentRoll}
            onChange={(e) => setStudentRoll(e.target.value)}
            className="p-2.5 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <textarea
          rows={3}
          required
          placeholder="আপনার প্রশ্নটি বিস্তারিত লিখুন (যেমন: স্যার, এই অধ্যায়ের গাণিতিক উদাহরণের ২য় লাইনে কারেন্টের মান কীভাবে নির্ণয় করা হয়েছে বুঝতে পারিনি...)"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className="w-full p-3 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed resize-none"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            🔒 আপনার প্রশ্নটি প্রাতিষ্ঠানিক শিক্ষকের নিকট সংরক্ষিত থাকবে।
          </span>

          <button
            type="submit"
            disabled={isSubmitting || !questionText.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>প্রশ্ন জমা দিন</span>
          </button>
        </div>
      </form>

      {/* Threaded Chat-Like Doubts List */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            সরাসরি ডাউট থ্রেড ও শিক্ষকের সমাধান ({doubts.length})
          </h4>
          <span className="text-[11px] text-slate-400">কথোপকথন আকারে সমাধান দেখুন</span>
        </div>

        {doubts.length > 0 ? (
          <div className="space-y-4">
            {doubts.map((d) => {
              const isAnswered = d.status === "answered";
              const isThreadOpen = activeThreadId === d.id;
              const allReplies = d.replies || [];

              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-white/10 p-4 sm:p-5 space-y-4 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all"
                >
                  {/* Thread Header with Context Tag */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[11px]">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white font-bold">{d.studentName}</strong>
                        <span className="text-slate-400 text-[10px] ml-1.5 font-mono">({d.studentRoll})</span>
                      </div>

                      {/* Linked Context Tag */}
                      {d.contextTitle && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono font-medium border border-slate-200 dark:border-slate-700 truncate max-w-[200px]">
                          {d.contextTitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">{d.createdAt}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                          isAnswered
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-800/50"
                            : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-300/60 dark:border-amber-800/50"
                        }`}
                      >
                        {isAnswered ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>সমাধানকৃত</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>অপেক্ষমাণ</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Thread Message 1: Student Original Question Bubble */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      Q
                    </div>
                    <div className="flex-1 bg-white/90 dark:bg-slate-900/90 rounded-2xl rounded-tl-sm p-3.5 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed shadow-xs">
                      {d.question}
                    </div>
                  </div>

                  {/* Thread Message 2: Primary Teacher Answer Bubble (if answered) */}
                  {isAnswered && d.answer && (
                    <div className="flex items-start gap-2.5 pl-4 sm:pl-6">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border border-emerald-300/40">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl rounded-tl-sm p-3.5 border border-emerald-200/60 dark:border-emerald-800/50 space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                          <span className="flex items-center gap-1.5">
                            <span>{d.answeredBy || "PTSC বিষয় শিক্ষক"}</span>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-200/50 dark:bg-emerald-800/40 text-[9px] font-black uppercase">
                              শিক্ষক
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{d.answeredAt}</span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                          {d.answer}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Thread Message 3+: Follow-up Replies (Threaded Chat) */}
                  {allReplies.length > 0 && (
                    <div className="space-y-2.5 pl-4 sm:pl-6 border-l-2 border-indigo-200/40 dark:border-indigo-900/40 ml-3">
                      {allReplies.map((reply) => {
                        const isTeacher = reply.sender === "teacher";
                        return (
                          <div key={reply.id} className="flex items-start gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 ${
                                isTeacher
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600"
                                  : "bg-indigo-100 dark:bg-indigo-950 text-indigo-600"
                              }`}
                            >
                              {isTeacher ? "T" : "S"}
                            </div>
                            <div
                              className={`flex-1 rounded-2xl p-3 text-xs leading-relaxed border ${
                                isTeacher
                                  ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/60 text-slate-800 dark:text-slate-200"
                                  : "bg-white/80 dark:bg-slate-900/80 border-slate-200/60 text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1 font-mono">
                                <span className={isTeacher ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}>
                                  {reply.senderName}
                                </span>
                                <span>{reply.timestamp}</span>
                              </div>
                              <p>{reply.text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Follow-up Reply Drawer Action */}
                  <div className="pt-1">
                    {isThreadOpen ? (
                      <div className="space-y-2 pl-4 sm:pl-6 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="শিক্ষককে ফলো-আপ প্রশ্ন করুন বা উত্তর স্পষ্ট করুন..."
                            value={replyInputText}
                            onChange={(e) => setReplyInputText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply(d.id);
                              }
                            }}
                            className="flex-1 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendReply(d.id)}
                            disabled={!replyInputText.trim()}
                            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                          >
                            <Send className="w-3 h-3" />
                            <span>পাঠান</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveThreadId(null)}
                            className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            বন্ধ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveThreadId(d.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>ফলো-আপ রিপ্লাই লিখুন...</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white/40 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200/80 dark:border-slate-700/60 text-slate-400 space-y-1.5">
            <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              এই পাঠ বা অধ্যায়ে এখনো কোনো ডাউট জমা হয়নি।
            </p>
            <p className="text-[11px] text-slate-400">
              আপনার যে কোনো কঠিন বা অস্পষ্ট বিষয় বুঝতে উপরের বক্সে প্রশ্ন লিখে সরাসরি শিক্ষকের নিকট জমা দিন।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
