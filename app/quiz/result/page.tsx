"use client";

import React, { useState } from "react";
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
  Printer
} from "lucide-react";
import { motion } from "motion/react";

export default function ResultPage() {
  const { studentStats, displayName, handleLeave, totalQuestions, quizDetails } = useQuizSession();

  const totalQ = totalQuestions || ((studentStats?.correctAnswers || 0) + (studentStats?.wrongAnswers || 0) + (studentStats?.unanswered || 0)) || 1;
  const accuracy = Math.round(((studentStats?.correctAnswers || 0) / totalQ) * 100);

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
            #{studentStats?.rank || 1}
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-1.5">
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
