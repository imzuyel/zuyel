"use client";

import React, { useState, useEffect } from "react";
import { useQuizSession } from "@/context/QuizSessionContext";
import { GlowCard } from "@/components/quiz/ui/TechVisuals";
import StudentPerformanceAnalyticsView from "@/components/quiz/StudentPerformanceAnalyticsView";
import { 
  Award, 
  LogOut, 
  Trophy, 
  Target, 
  Zap, 
  Activity,
  Flame,
  CheckCircle,
  XCircle,
  HelpCircle,
  Sparkles,
  Printer,
  Star
} from "lucide-react";
import { motion } from "motion/react";
import { triggerFireworks, triggerBlockCompletionCelebration } from "@/lib/confetti";

export default function ResultPage() {
  const { studentStats, displayName, handleLeave, totalQuestions, quizDetails } = useQuizSession();

  const totalQ = totalQuestions || ((studentStats?.correctAnswers || 0) + (studentStats?.wrongAnswers || 0) + (studentStats?.unanswered || 0)) || 1;
  const accuracy = Math.round(((studentStats?.correctAnswers || 0) / totalQ) * 100);
  const rank = studentStats?.rank || 1;
  const starCount = accuracy >= 90 ? 5 : accuracy >= 70 ? 4 : accuracy >= 50 ? 3 : accuracy >= 30 ? 2 : 1;

  // Motivational Bengali Badge based on rank & accuracy
  const badgeInfo = rank <= 3 || accuracy >= 80 
    ? { text: "🔥 কুইজ চ্যাম্পিয়ন!", color: "from-amber-500 to-yellow-500 text-slate-950 border-amber-300 shadow-amber-500/40" }
    : accuracy >= 50 
    ? { text: "🌟 অসাধারণ প্রচেষ্টা!", color: "from-cyan-500 to-indigo-500 text-white border-cyan-300 shadow-cyan-500/40" }
    : { text: "💪 পরের ক্লাসে আরও ভালো করবে!", color: "from-orange-500 to-rose-500 text-white border-orange-300 shadow-orange-500/40" };

  useEffect(() => {
    triggerFireworks();
    const timer = setTimeout(() => {
      triggerBlockCompletionCelebration();
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pt-6 pb-12 w-full max-w-5xl mx-auto px-4 font-sans select-none"
    >
      {/* Top Trophy Banner */}
      <div className="text-center space-y-4">
        <motion.div
          variants={itemVariants}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-25 rounded-full animate-pulse" />
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-linear-to-tr from-yellow-400 via-amber-500 to-amber-600 border-2 border-yellow-300 flex items-center justify-center mx-auto relative z-10 shadow-2xl shadow-amber-500/30">
            <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-slate-950" />
          </div>
          <motion.div 
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="absolute -top-2 -right-2 bg-slate-950 border border-amber-400/60 text-amber-300 rounded-full px-3 py-1 text-xs font-black shadow-xl font-mono"
          >
            #{rank}
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-2">
          {/* Motivational Bengali Badge */}
          <div className="flex items-center justify-center gap-2">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-linear-to-r border shadow-lg ${badgeInfo.color}`}>
              {badgeInfo.text}
            </span>
          </div>

          {/* Star Rating Display */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 transition-transform ${
                  star <= starCount
                    ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] scale-110"
                    : "text-slate-700 fill-slate-800"
                }`}
              />
            ))}
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>মূল্যায়ন সম্পন্ন হয়েছে</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
            অসাধারণ পারফরম্যান্স, {displayName}!
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-xl mx-auto">
            {quizDetails?.title || "কারিগরি লাইভ কুইজ পরীক্ষা"} সফলভাবে সম্পন্ন হয়েছে। নিচে আপনার টপিকভিত্তিক দুর্বলতা ও এআই পারফরম্যান্স রিপোর্ট দেওয়া হলো।
          </p>

          {/* Quick Summary Strip */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400 mr-1.5">পয়েন্ট:</span>
              <span className="text-amber-400 font-black">{studentStats?.totalScore || 0} pts</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400 mr-1.5">সঠিক উত্তর:</span>
              <span className="text-emerald-400 font-black">{studentStats?.correctAnswers || 0} / {totalQ}</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400 mr-1.5">নির্ভুলতা:</span>
              <span className="text-cyan-400 font-black">{accuracy}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Embedded Comprehensive Analytics Dashboard */}
      <motion.div variants={itemVariants}>
        <StudentPerformanceAnalyticsView
          studentName={displayName || "শিক্ষার্থী"}
          quizTitle={quizDetails?.title || "কারিগরি লাইভ কুইজ মূল্যায়ন"}
          totalScore={studentStats?.totalScore || 0}
          accuracy={accuracy}
          totalQuestions={totalQ}
          correctAnswers={studentStats?.correctAnswers || 0}
          wrongAnswers={studentStats?.wrongAnswers || 0}
          rank={studentStats?.rank || 1}
          bestStreak={studentStats?.bestStreak || 0}
          classId={4}
          trade="SSC Vocational"
          proctoringStrikes={(studentStats as any)?.proctoringStrikes || 0}
        />
      </motion.div>

      {/* Footer Navigation */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
          <span>PTSC LIVE ASSESSMENT HUB</span>
          <span>•</span>
          <span>BTEB 2026 STANDARDS</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLeave}
          className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>কুইজ পোর্টাল ত্যাগ করুন (Exit)</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
