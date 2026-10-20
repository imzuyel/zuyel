"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/context/AuthContext";

export default function StudentQuickQuizPopup() {
  const { currentUser, isLoggedIn } = useAuth();
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    // If user is a student or not logged in, they can try the quick quiz!
    // We only pop it up if they haven't taken this specific quiz ID yet.
    fetchActiveQuiz();
  }, [isLoggedIn, currentUser]);

  const fetchActiveQuiz = async () => {
    try {
      // If student is logged in, we fetch matching their class, otherwise fetch generic
      const studentClassId = currentUser?.role === "student" ? (currentUser as any).classId || 9 : "";
      const url = studentClassId ? `/api/quick-quiz?classId=${studentClassId}` : "/api/quick-quiz";

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.active && data.quiz) {
        const quizId = data.quiz.id;
        const alreadyTaken = localStorage.getItem(`ptsc_quick_quiz_taken_${quizId}`);
        if (!alreadyTaken) {
          setActiveQuiz(data.quiz);
          setIsOpen(true);
        }
      }
    } catch (e) {
      console.error("Error loading student quick quiz popup:", e);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (answered) return;
    setSelectedOpt(idx);
    setAnswered(true);

    const isCorrect = idx === activeQuiz.questions[currentIdx].correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setAnswered(false);

    if (currentIdx < activeQuiz.questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      // Mark as taken
      localStorage.setItem(`ptsc_quick_quiz_taken_${activeQuiz.id}`, "true");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen || !activeQuiz) return null;

  const currentQuestion = activeQuiz.questions[currentIdx];
  const totalQuestions = activeQuiz.questions.length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-900 border-2 border-pink-500/40 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(244,63,94,0.3)] overflow-hidden text-white"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-300 animate-spin" style={{ animationDuration: "6s" }} />
              <div>
                <span className="text-[10px] font-black uppercase text-pink-200 tracking-wider block leading-none mb-1">
                  Pop-up Quick Challenge
                </span>
                <h4 className="font-black text-xs sm:text-sm text-white leading-tight">
                  {activeQuiz.title}
                </h4>
              </div>
            </div>
            {!quizFinished && (
              <button
                onClick={handleClose}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="পরে অংশ নিন"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {!quizFinished ? (
              <div className="space-y-5">
                {/* Progress Indicator */}
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>প্রশ্ন {currentIdx + 1} / {totalQuestions}</span>
                  <div className="flex gap-1 h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden">
                    {Array(totalQuestions).fill(null).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 transition-all duration-300 ${
                          i <= currentIdx
                            ? "bg-gradient-to-r from-pink-500 to-indigo-500"
                            : "bg-slate-800"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Question Area */}
                <div className="space-y-1 bg-slate-950/60 p-4.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-black uppercase text-pink-400 tracking-wider block">
                    {activeQuiz.subjectName}
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-100 leading-snug">
                    {currentQuestion.questionText}
                  </h3>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 gap-2.5">
                  {currentQuestion.options.map((option: string, oIdx: number) => {
                    const isSelected = selectedOpt === oIdx;
                    const isCorrect = oIdx === currentQuestion.correctIndex;
                    const showSuccess = answered && isCorrect;
                    const showFailure = answered && isSelected && !isCorrect;

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectOption(oIdx)}
                        disabled={answered}
                        className={`w-full text-left p-3.5 rounded-xl text-xs font-bold border transition-all duration-200 flex items-center justify-between gap-3 ${
                          showSuccess
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                            : showFailure
                            ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                            : isSelected
                            ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                            : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                        } cursor-pointer`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg font-black flex items-center justify-center text-[11px] border shrink-0 ${
                            showSuccess
                              ? "bg-emerald-500 border-emerald-400 text-white"
                              : showFailure
                              ? "bg-rose-500 border-rose-400 text-white"
                              : "bg-slate-800 border-slate-700 text-slate-400"
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{option}</span>
                        </div>
                        {showSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        {showFailure && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Block */}
                <AnimatePresence>
                  {answered && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-900/50 space-y-1.5"
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-black text-indigo-400 uppercase tracking-wider">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>সঠিক উত্তরের ব্যাখ্যা:</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">
                        {currentQuestion.explanation || "সঠিক উত্তরটি এআই দ্বারা যাচাইকৃত। মনোযোগ সহকারে পড়ুন ও জ্ঞান বৃদ্ধি করুন!"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Next Button */}
                {answered && (
                  <button
                    onClick={handleNext}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all transform active:scale-98 shadow-md shadow-pink-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{currentIdx < totalQuestions - 1 ? "পরবর্তী প্রশ্ন" : "ফলাফল দেখুন"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              // Quiz Finished Screen
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5 py-4"
              >
                <div className="w-20 h-24 bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl relative">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-pink-400 to-purple-500 rounded-2xl blur-md opacity-55 animate-pulse" />
                  <Award className="w-10 h-10 text-white relative z-10 animate-bounce" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-100">অভিনন্দন! কুইজ সম্পন্ন হয়েছে</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase font-mono tracking-wider">{activeQuiz.subjectName}</p>
                </div>

                {/* Score badge */}
                <div className="inline-block px-6 py-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                  <div className="text-[10px] uppercase text-slate-400 font-black tracking-widest">ফাইনাল স্কোর</div>
                  <div className="text-3xl font-black text-pink-400 font-mono tracking-tight">
                    {score} / {totalQuestions}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-normal max-w-sm mx-auto">
                  {score === totalQuestions
                    ? "চমৎকার! আপনি ৫টি প্রশ্নের সবগুলোর সঠিক উত্তর দিয়ে পূর্ণ নম্বর পেয়েছেন। আপনার প্রস্তুতি অত্যন্ত চমৎকার!"
                    : score >= 3
                    ? "দারুণ প্রচেষ্টা! আপনি ৫টি প্রশ্নের মধ্যে বেশিরভাগেরই সঠিক উত্তর দিতে পেরেছেন। আরও ভালো করতে অনুশীলন জারি রাখুন।"
                    : "ভালো চেষ্টা! ভুলগুলো থেকে শিখে প্রস্তুতি আরও শক্তিশালী করুন। কারিগরি শিক্ষায় আপনার সাফল্য কামনা করি।"}
                </p>

                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors shadow-xs cursor-pointer"
                >
                  বন্ধ করুন (Close Popup)
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
