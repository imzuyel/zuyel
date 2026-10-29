"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuizSession } from "@/context/QuizSessionContext";
import { QuizPlate } from "@/components/quiz/templates";
import { useProctoredExam } from "@/hooks/useProctoredExam";
import ProctoringShieldHUD from "@/components/quiz/ProctoringShieldHUD";
import ProctoringWarningOverlay from "@/components/quiz/ProctoringWarningOverlay";
import FloatingReactionOverlay, { emitLiveReaction } from "@/components/quiz/FloatingReactionOverlay";
import {
  Timer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  Zap,
  Flame,
  Award,
  Users,
  Eye,
  Lock,
  Sparkles,
  Radio,
  Clock,
  Cloud,
  Send,
  MessageSquare,
  XCircle,
  RotateCcw,
  Trophy,
  Star,
  LogOut,
  Target
} from "lucide-react";
import UniversalQuizShowcaseEngine from "@/components/quiz/engine/UniversalQuizShowcaseEngine";
import { motion, AnimatePresence } from "motion/react";
import { triggerFireworks, triggerBlockCompletionCelebration } from "@/lib/confetti";

export default function LiveQuizPage() {
  const {
    currentPhase,
    countdownSeconds,
    previewSeconds,
    canSubmitAnswer,
    currentPlate,
    currentQuestion,
    currentQuestionIdx,
    totalQuestions,
    timeLeft,
    playerAnswered,
    isSubmitting,
    handleSubmitAnswer,
    selectedOption,
    answeredCount,
    playerCount,
    studentStats,
    activeMotivation,
    networkStatus,
    activeSession,
    participantId,
    displayName,
    lastAnswerFeedback,
    allVoted,
    isReady,
    readyCount,
    handleSetReady
  } = useQuizSession();

  const router = useRouter();
  const [submissionSpeed, setSubmissionSpeed] = useState<{ seconds: string; ms: number } | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const [localSelected, setLocalSelected] = useState<any>(null);
  const [wordInput, setWordInput] = useState("");
  const [openEndedInput, setOpenEndedInput] = useState("");

  // Track start of active question timer
  useEffect(() => {
    if (currentPhase === "QUESTION_ACTIVE") {
      questionStartTimeRef.current = Date.now();
      setSubmissionSpeed(null);
    }
  }, [currentPhase, currentQuestionIdx]);

  function toBanglaDigits(num: number | string): string {
    const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (d) => bn[parseInt(d)]);
  }

  // Online / Offline connectivity listener
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Reset inputs on slide change
  React.useEffect(() => {
    setLocalSelected(null);
    setWordInput("");
    setOpenEndedInput("");
  }, [currentQuestionIdx, currentQuestion?.id]);

  // Grand Finale Completion Detection
  const sessionStatus = activeSession?.status;
  const isCompleted = currentPhase === "COMPLETED" || sessionStatus === "COMPLETED" || activeSession?.status === "COMPLETED";

  // Trigger celebration on completion
  useEffect(() => {
    if (isCompleted) {
      triggerFireworks();
      const t = setTimeout(() => {
        triggerBlockCompletionCelebration();
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [isCompleted]);

  // Anti-Cheat Proctored Exam Hook
  const proctoring = useProctoredExam({
    sessionId: activeSession?.id,
    playerId: participantId || undefined,
    playerName: displayName,
    isActive: currentPhase === "QUESTION_ACTIVE" || currentPhase === "QUESTION_PREVIEW",
    strictMode: true,
    onAutoSubmit: (reason) => {
      if (!playerAnswered && !isSubmitting) {
        handleSubmitAnswer(localSelected !== null ? localSelected : 0);
      }
    },
  });

  // ==========================================
  // GRAND FINALE: 3D PERSONAL ACHIEVEMENT TROPHY CARD (TASK 3)
  // ==========================================
  if (isCompleted) {
    const totalQ = totalQuestions || ((studentStats?.correctAnswers || 0) + (studentStats?.wrongAnswers || 0)) || 1;
    const correctCount = studentStats?.correctAnswers || 0;
    const accuracy = Math.round((correctCount / totalQ) * 100);
    const rank = studentStats?.rank || 1;
    const starCount = accuracy >= 90 ? 5 : accuracy >= 70 ? 4 : accuracy >= 50 ? 3 : accuracy >= 30 ? 2 : 1;

    const badgeInfo = rank <= 3 || accuracy >= 80
      ? { text: "🔥 কুইজ চ্যাম্পিয়ন!", color: "from-amber-500 to-yellow-500 text-slate-950 border-amber-300 shadow-amber-500/40" }
      : accuracy >= 50
        ? { text: "🌟 অসাধারণ প্রচেষ্টা!", color: "from-cyan-500 to-indigo-500 text-white border-cyan-300 shadow-cyan-500/40" }
        : { text: "💪 পরের ক্লাসে আরও ভালো করবে!", color: "from-orange-500 to-rose-500 text-white border-orange-300 shadow-orange-500/40" };

    return (
      <div className="w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[75vh] text-center relative select-none">
        {/* Smart Low-Network Sticky Banner if connection drops */}
        {(!isOnline || networkStatus === "disconnected" || networkStatus === "reconnecting" || networkStatus === "failed") && (
          <div className="fixed top-0 left-0 right-0 z-50 p-2.5 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white shadow-2xl flex items-center justify-between gap-3 px-4 backdrop-blur-md border-b-2 border-amber-300/40 animate-pulse">
            <div className="flex items-center gap-2 text-xs font-black">
              <Radio className="w-4 h-4 animate-ping text-white shrink-0" />
              <span>📡 ইন্টারনেট সংযোগ দুর্বল বা সাময়িকভাবে বিচ্ছিন্ন...</span>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-3 py-1 rounded-xl bg-white text-slate-950 font-black text-xs hover:bg-slate-100 flex items-center gap-1 shadow cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>🔄 পেজ রিলোড ও পুনঃসংযোগ করুন</span>
            </button>
          </div>
        )}

        {/* Ambient Pulsing Background Glow */}
        <div className="absolute inset-0 bg-radial from-amber-500/25 via-indigo-600/15 to-transparent blur-3xl pointer-events-none animate-pulse" />

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, type: "spring", stiffness: 260 }}
          className="relative z-10 w-full space-y-6 flex flex-col items-center"
        >
          {/* Royal Header Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-linear-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.35)]">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="text-xs font-black text-amber-300 uppercase tracking-widest">
              গ্র্যান্ড ফাইনাল সেলিব্রেশন
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              🎉 সেশন সফলভাবে সমাপ্ত হয়েছে!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              চমৎকার অংশগ্রহণ! শিক্ষক লাইভ প্রেজেন্টেশন সমাপ্ত করেছেন। আপনার অর্জিত ব্যক্তিগত পারফরম্যান্স কার্ড নিচে দেওয়া হলো।
            </p>
          </div>

          {/* 3D Personal Achievement Card */}
          <div className="w-full rounded-3xl bg-linear-to-b from-slate-900/95 via-indigo-950/70 to-slate-950/95 border-2 border-amber-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.2)] relative space-y-6">
            {/* Student Avatar + Rank Badge */}
            <div className="relative inline-block mx-auto">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-linear-to-tr from-amber-400 via-yellow-500 to-amber-600 border-4 border-amber-300 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30 text-slate-950 text-4xl sm:text-5xl font-black">
                {displayName?.[0]?.toUpperCase() || "S"}
              </div>
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute -top-3 -right-3 bg-slate-950 border-2 border-amber-400 text-amber-300 rounded-full px-3.5 py-1 text-sm font-black shadow-xl font-mono flex items-center gap-1"
              >
                <span>{rank === 1 ? "👑" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "#"}</span>
                <span>{rank}</span>
              </motion.div>
            </div>

            <div className="space-y-2 text-center">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {displayName}
              </h2>

              {/* Motivational Bengali Performance Badge */}
              <div className="flex items-center justify-center">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-linear-to-r border shadow-lg ${badgeInfo.color}`}>
                  {badgeInfo.text}
                </span>
              </div>

              {/* 5-Star Rating */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 transition-transform ${star <= starCount
                      ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] scale-110"
                      : "text-slate-700 fill-slate-800"
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* 3D Stats Matrix */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center font-mono">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">মোট স্কোর</span>
                <span className="text-lg sm:text-xl font-black text-amber-400">{studentStats?.totalScore || 0}</span>
                <span className="text-[10px] text-slate-500 block">পয়েন্ট</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center font-mono">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">সঠিক উত্তর</span>
                <span className="text-lg sm:text-xl font-black text-emerald-400">
                  {studentStats?.correctAnswers || 0} / {totalQ}
                </span>
                <span className="text-[10px] text-slate-500 block">প্রশ্নের</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center font-mono">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">নির্ভুলতা</span>
                <span className="text-lg sm:text-xl font-black text-cyan-400">{accuracy}%</span>
                <span className="text-[10px] text-slate-500 block">অ্যাকুরেসি</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => router.push("/quiz/result")}
                className="w-full py-3.5 rounded-2xl bg-linear-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>📊 বিস্তারিত অ্যানালিটিক্স ও দুর্বলতা রিপোর্ট</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>হোমপেজে ফিরে যান (Exit)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // If question is not loaded yet and not in countdown, show loader
  if (!currentQuestion && currentPhase !== "COUNTDOWN") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-16">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          <Zap className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-white font-black text-sm uppercase tracking-widest">প্রশ্ন লোড হচ্ছে...</p>
          <p className="text-xs text-slate-400">লাইভ সেশন সিঙ্ক করা হচ্ছে</p>
        </div>
      </div>
    );
  }

  const handleSelect = (idx: any) => {
    if (playerAnswered || isSubmitting || currentPhase !== "QUESTION_ACTIVE" || !canSubmitAnswer) return;
    setLocalSelected(idx);
  };

  const handleConfirm = () => {
    if (localSelected === null || currentPhase !== "QUESTION_ACTIVE" || !canSubmitAnswer) return;
    const elapsed = Date.now() - questionStartTimeRef.current;
    const secStr = (elapsed / 1000).toFixed(2);
    setSubmissionSpeed({ seconds: secStr, ms: elapsed });
    handleSubmitAnswer(localSelected);
  };

  const progress = totalQuestions > 0 ? ((currentQuestionIdx + 1) / totalQuestions) * 100 : 0;

  // ==========================================
  // PHASE 1 — GET READY SCREEN (Requirement 1 - ফেজ ১: প্রস্তুতি পর্যায়)
  // ==========================================
  if (currentPhase === "READY") {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh] text-center relative">
        <div className="absolute inset-0 bg-radial from-amber-500/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none animate-pulse" />

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 280 }}
          className="relative z-10 space-y-6 flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-linear-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.35)]">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="text-xs font-black text-amber-300 uppercase tracking-widest">
              ফেজ ১: প্রস্তুত হোন! (GET READY)
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              প্রশ্ন {currentQuestionIdx + 1} আসছে — মনোযোগ দিন!
            </h2>
            <p className="text-sm font-bold text-cyan-300">
              Get Ready for Question {currentQuestionIdx + 1}!
            </p>
          </div>

          <div className="relative w-36 h-36 flex items-center justify-center my-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl"
            />
            <div className="relative w-28 h-28 rounded-full bg-linear-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-5xl shadow-2xl border-4 border-white/20">
              🎯
            </div>
          </div>

          {/* 🙋‍♂️ I'm Ready Button (One-tap ready ping) */}
          <motion.button
            whileHover={!isReady ? { scale: 1.05 } : {}}
            whileTap={!isReady ? { scale: 0.95 } : {}}
            disabled={isReady}
            onClick={handleSetReady}
            className={`w-full max-w-sm py-4 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-3 transition-transform cursor-pointer ${isReady
              ? "bg-emerald-950/80 border-2 border-emerald-400 text-emerald-300 shadow-emerald-500/20"
              : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/30 animate-pulse"
              }`}
          >
            {isReady ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <span>✅ আপনি রেডি! ({readyCount} জন রেডি)</span>
              </>
            ) : (
              <>
                <Flame className="w-6 h-6 text-slate-950 fill-current" />
                <span>🙋‍♂️ আমি পরবর্তী প্রশ্নের জন্য রেডি! (I&apos;m Ready!)</span>
              </>
            )}
          </motion.button>

          <p className="text-xs sm:text-sm text-slate-300 max-w-sm font-medium">
            কিছুক্ষণের মধ্যেই ৩-২-১ কাউন্টডাউন ও প্রশ্ন পর্দায় ভেসে উঠবে
          </p>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>প্রশ্ন {currentQuestionIdx + 1} / {totalQuestions}</span>
            <span>•</span>
            <span>খেলোয়াড়: {playerCount} জন</span>
            {(readyCount || 0) > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-400 font-bold">🔥 {readyCount} জন রেডি</span>
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // PHASE 2 — MANDATORY 3-2-1 COUNTDOWN ANIMATION SCREEN
  // 3 -> 2 -> 1 -> GO!
  // ==========================================
  if (currentPhase === "COUNTDOWN" || countdownSeconds > 0) {
    const displayNum = countdownSeconds > 0 ? countdownSeconds : "GO!";
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh] text-center relative">
        {/* Pulsing Ambient Background Glow */}
        <div className="absolute inset-0 bg-radial from-cyan-500/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none animate-pulse" />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 space-y-6 flex flex-col items-center"
        >
          {/* Phase Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Radio className="w-4 h-4 text-cyan-400 animate-ping" />
            <span className="text-xs font-black text-cyan-300 uppercase tracking-widest">
              সার্ভার সিঙ্ক কাউন্টডাউন
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
            প্রশ্ন {currentQuestionIdx + 1} আসছে — প্রস্তুত হোন!
          </h2>

          {/* Giant Animated Number Display */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center my-4">
            {/* Outer Rotating Halo Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-dashed border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.4)]"
            />

            {/* Inner Glowing Core */}
            <div className="absolute inset-3 rounded-full bg-linear-to-tr from-slate-950 via-slate-900 to-indigo-950 border-2 border-cyan-400/60 flex items-center justify-center shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={displayNum}
                  initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
                  animate={{ scale: [1.3, 1], opacity: 1, rotate: 0 }}
                  exit={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="font-mono font-black text-6xl sm:text-7xl bg-linear-to-b from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.8)]"
                >
                  {displayNum}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 max-w-sm font-medium">
            কাউন্টডাউন শেষ হলে প্রশ্ন প্রিভিউ শুরু হবে। অপশন ও উত্তর দেওয়ার সুযোগ স্বয়ংক্রিয়ভাবে সক্রিয় হবে।
          </p>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>মোট প্রশ্ন: {totalQuestions}</span>
            <span>•</span>
            <span>খেলোয়াড়: {playerCount} জন</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Slide Category & Type classification
  const qType = (currentQuestion?.type || currentQuestion?.questionType || "MCQ").toUpperCase();
  const isLeaderboardSlide = qType === "LEADERBOARD" || Boolean(activeSession?.showLeaderboard);
  const isContentSlide = qType === "TEXT_SLIDE" || qType === "IMAGE_COMPARE";
  const isOpenEnded = qType === "OPEN_ENDED" || qType === "LIVE_QA";
  const isWordCloud = qType === "WORD_CLOUD";
  const isNonGraded = isContentSlide || isOpenEnded || isWordCloud || isLeaderboardSlide;

  // ==========================================
  // HOST-ONLY LEADERBOARD GATE SCREEN (TASK 3)
  // Strictly host-controlled: no student buttons, appears only when host navigates or broadcasts
  // ==========================================
  if (isLeaderboardSlide) {
    const topPlayers = activeSession?.topPlayers || [];
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh] text-center relative">
        <div className="absolute inset-0 bg-radial from-amber-500/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none animate-pulse" />

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 280 }}
          className="relative z-10 w-full space-y-6 flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-linear-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.35)]">
            <Award className="w-5 h-5 text-amber-400 animate-bounce" />
            <span className="text-xs font-black text-amber-300 uppercase tracking-widest">
              🏆 লাইভ লিডারবোর্ড — শিক্ষক প্রদর্শন করছেন
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              চলতি সেশনের স্কোরবোর্ড
            </h2>
            <p className="text-xs text-slate-400">
              শিক্ষক স্মার্টবোর্ড / প্রজেক্টরে পূর্ণাঙ্গ ফলাফল প্রদর্শন করছেন
            </p>
          </div>

          {/* Student's Personal Rank Card */}
          {studentStats && (
            <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border-2 border-indigo-500/50 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black text-lg border border-indigo-400/40">
                  {studentStats.rank ? `#${studentStats.rank}` : "🎖️"}
                </div>
                <div>
                  <div className="text-sm font-black text-white">{displayName || "আপনার প্রোফাইল"}</div>
                  <span className="text-[10px] text-indigo-300 font-bold">লাইভ পারফরম্যান্স</span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-lg font-black text-amber-400">{studentStats.totalScore || 0}</span>
                <span className="text-[10px] text-slate-400 block font-bold">পয়েন্ট</span>
              </div>
            </div>
          )}

          {/* Top 5 Leaderboard List */}
          {topPlayers.length > 0 && (
            <div className="w-full space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block text-left px-1">
                শীর্ষ প্রতিযোগীগণ:
              </span>
              <div className="space-y-2">
                {topPlayers.slice(0, 5).map((p: any, idx: number) => {
                  const isCurrentStudent = p.id === participantId || p.displayName === displayName;
                  const medal = idx === 0 ? "👑" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                  return (
                    <div
                      key={p.id || idx}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${isCurrentStudent
                        ? "bg-amber-500/20 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                        : "bg-slate-900/80 border-slate-800 text-slate-300"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-sm w-6 text-center">{medal}</span>
                        <span className="font-bold text-xs sm:text-sm">{p.displayName}</span>
                        {isCurrentStudent && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">আপনি</span>
                        )}
                      </div>
                      <span className="font-mono font-black text-xs text-amber-400">{p.totalScore || 0} pts</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="text-xs text-slate-500 font-bold">
            পরবর্তী প্রশ্নের জন্য শিক্ষক স্লাইড পরিবর্তন করার অপেক্ষায়...
          </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // STEPS 2, 3, 4 — QUESTION PREVIEW & ACTIVE GAMEPLAY
  // ==========================================
  const isPreviewPhase = !isNonGraded && (currentPhase === "QUESTION_PREVIEW" || previewSeconds > 0);
  const isOptionsRevealed = !isPreviewPhase && (currentPhase === "QUESTION_ACTIVE" || currentPhase === "QUESTION_ENDED");
  const isAnswerRevealed =
    allVoted ||
    currentPhase === "QUESTION_ENDED" ||
    (currentPhase as string) === "SHOW_RESULTS" ||
    (currentPhase as string) === "REVEAL" ||
    (!isPreviewPhase && timeLeft === 0 && currentPhase === "QUESTION_ACTIVE") ||
    (answeredCount >= playerCount && playerCount > 0);

  const speedSec = submissionSpeed?.seconds || ((lastAnswerFeedback as any)?.responseTimeMs ? (((lastAnswerFeedback as any).responseTimeMs / 1000).toFixed(2)) : null);
  const speedMs = submissionSpeed?.ms || (lastAnswerFeedback as any)?.responseTimeMs || null;
  const banglaSpeedSec = speedSec ? toBanglaDigits(speedSec) : null;
  const banglaSpeedMs = speedMs ? toBanglaDigits(speedMs.toLocaleString("en-US")) : null;

  return (
    <div className="space-y-6 w-full max-w-2xl px-2 mx-auto relative">
      {/* Smart Low-Network Sticky Warning Banner (Task 2) */}
      {(!isOnline || networkStatus === "disconnected" || networkStatus === "reconnecting" || networkStatus === "failed") && (
        <div className="fixed top-0 left-0 right-0 z-50 p-2.5 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white shadow-2xl flex items-center justify-between gap-3 px-4 backdrop-blur-md border-b-2 border-amber-300/40 animate-pulse">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black">
            <Radio className="w-4 h-4 animate-ping text-white shrink-0" />
            <span>📡 ইন্টারনেট সংযোগ দুর্বল বা সাময়িকভাবে বিচ্ছিন্ন। অপেক্ষা করুন অথবা রিলোড চাপুন:</span>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-1 rounded-xl bg-white text-slate-950 font-black text-xs hover:bg-slate-100 flex items-center gap-1.5 shadow-lg cursor-pointer active:scale-95 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>🔄 পেজ রিলোড ও পুনঃসংযোগ করুন</span>
          </button>
        </div>
      )}

      {/* Top Proctoring Security HUD Row */}
      <div className="flex items-center justify-between gap-3">
        <ProctoringShieldHUD
          strikes={proctoring.strikes}
          maxStrikes={proctoring.maxStrikes}
          isFullscreen={proctoring.isFullscreen}
          onRequestFullscreen={proctoring.requestFullscreen}
          strictMode={true}
        />
        <div className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 hidden sm:block">
          SECURE BTEB PROCTORING
        </div>
      </div>

      {/* Quiz Progress & Timer Header */}
      <div className="flex items-center justify-between gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest px-1">
            <span className="text-cyan-400">স্লাইড {currentQuestionIdx + 1} / {totalQuestions}</span>
            <span className="text-slate-400">{Math.round(progress)}% সম্পন্ন</span>
          </div>
          <div className="h-2.5 w-full bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
            <motion.div
              className="h-full bg-linear-to-r from-cyan-500 via-indigo-500 to-fuchsia-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Dynamic Timer Badge OR Non-Graded Badge */}
        {isNonGraded ? (
          isContentSlide ? (
            <div className="shrink-0 px-3 py-2 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 flex items-center gap-1.5 shadow-sm">
              <Eye className="w-4 h-4 text-indigo-400" />
              <span className="text-[11px] font-bold">বোর্ড স্লাইড</span>
            </div>
          ) : isWordCloud ? (
            <div className="shrink-0 px-3 py-2 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 flex items-center gap-1.5 shadow-sm">
              <Cloud className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-bold">ওয়ার্ড ক্লাউড</span>
            </div>
          ) : (
            <div className="shrink-0 px-3 py-2 rounded-2xl border border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300 flex items-center gap-1.5 shadow-sm">
              <MessageSquare className="w-4 h-4 text-fuchsia-400" />
              <span className="text-[11px] font-bold">উন্মুক্ত আলোচনা</span>
            </div>
          )
        ) : isPreviewPhase ? (
          <div className="shrink-0 px-3 py-2 rounded-2xl border-2 border-amber-500/60 bg-amber-500/10 text-amber-400 flex items-center gap-2 shadow-[0_0_18px_rgba(245,158,11,0.25)]">
            <Eye className="w-5 h-5 animate-pulse" />
            <div className="text-left font-mono">
              <span className="text-[9px] uppercase tracking-wider block font-bold text-amber-400/80">প্রিভিউ</span>
              <span className="text-lg font-black leading-none">{previewSeconds}s</span>
            </div>
          </div>
        ) : (
          <motion.div
            className={`shrink-0 w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-mono font-black transition-colors ${allVoted
              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.4)]"
              : timeLeft <= 5
                ? "bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.5)]"
                : timeLeft <= 10
                  ? "bg-amber-500/15 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "bg-slate-900 border-slate-800 text-cyan-400"
              }`}
            animate={timeLeft <= 5 && !allVoted ? { scale: [1, 1.08, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            <span className="text-[9px] opacity-60 leading-none mb-1 font-sans font-bold">
              {allVoted ? "VOTED" : "TIMER"}
            </span>
            <span className="text-2xl leading-none">{allVoted ? 0 : timeLeft}</span>
          </motion.div>
        )}
      </div>

      {/* ALL VOTED ALERT BANNER */}
      {allVoted && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600/30 via-teal-600/30 to-emerald-600/30 border-2 border-emerald-400 text-emerald-200 flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(16,185,129,0.35)] animate-bounce"
        >
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span className="text-xs sm:text-sm font-black text-white">
            🎉 সবাই উত্তর দিয়েছে! (All Voted!) — তাৎক্ষণিক ফলাফল প্রকাশিত হলো
          </span>
        </motion.div>
      )}

      {/* QUESTION PREVIEW ALERT BANNER (Graded Quiz Only) */}
      {!isNonGraded && isPreviewPhase && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between text-xs font-bold shadow-md shadow-amber-500/5"
        >
          <div className="flex items-center gap-2.5">
            <Eye className="w-5 h-5 text-amber-400 animate-bounce" />
            <div>
              <p className="font-extrabold text-amber-300">প্রশ্ন প্রিভিউ চলছে (Question Preview)</p>
              <p className="text-[10px] text-amber-400/80 font-normal">মনোযোগ দিয়ে প্রশ্নটি পড়ুন। {previewSeconds} সেকেন্ড পর অপশনগুলো উন্মোচিত হবে।</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 font-mono font-black text-sm">
            {previewSeconds}s
          </span>
        </motion.div>
      )}

      {/* DYNAMIC QUIZ PLATE WRAPPER */}
      <QuizPlate template={currentPlate}>
        <div className="space-y-6">
          {/* Question or Slide Text */}
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/15 font-mono text-[10px] uppercase font-bold tracking-wider">
                {isNonGraded ? "Slide" : "Question"} {currentQuestionIdx + 1}
              </span>
              {currentPlate && (
                <span className="text-[10px] text-cyan-400 font-mono font-bold">
                  {currentPlate.name} Plate
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white leading-relaxed tracking-tight">
              {currentQuestion.questionText || currentQuestion.title}
            </h3>
          </motion.div>

          {currentQuestion.imageUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center relative group"
            >
              <img
                src={currentQuestion.imageUrl}
                alt="Diagram"
                className="object-contain w-full h-full max-h-64"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}

          {/* SLIDE TYPE SPECIFIC STUDENT VIEWS */}
          {isContentSlide ? (
            /* 1. TEXT_SLIDE or IMAGE_COMPARE: Board Watch & Live Emojis */
            <div className="space-y-6 py-4 text-center">
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-3xl">
                  👀
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  বোর্ডের দিকে লক্ষ্য করো
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  শিক্ষক স্মার্টবোর্ড / প্রজেক্টরে স্লাইড কন্টেন্ট উপস্থাপন করছেন। আপনার অনুভূতি জানাতে নিচের ইমোজিগুলোতে ট্যাপ করুন!
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">লাইভ প্রতিক্রিয়া দিন:</p>
                <div className="flex items-center justify-center gap-3">
                  {[
                    { icon: "❤️", label: "Heart" },
                    { icon: "🔥", label: "Fire" },
                    { icon: "👏", label: "Clap" },
                    { icon: "🤔", label: "Thinking" },
                    { icon: "💡", label: "Idea" },
                    { icon: "🎉", label: "Celebrate" }
                  ].map((emo) => (
                    <motion.button
                      key={emo.label}
                      whileTap={{ scale: 1.4 }}
                      onClick={() => emitLiveReaction(emo.label.toLowerCase())}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-900 border border-slate-700/80 hover:border-cyan-400 flex items-center justify-center text-2xl sm:text-3xl shadow-lg transition-transform cursor-pointer"
                    >
                      {emo.icon}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ) : isWordCloud ? (
            /* 2. WORD CLOUD INTERACTION */
            <div className="space-y-5 py-2">
              {!playerAnswered ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs font-medium">
                    ☁️ ১ বা ২টি অর্থপূর্ণ সংক্ষিপ্ত শব্দ লিখুন যা প্রশ্নের উত্তর প্রকাশ করে।
                  </div>
                  <input
                    type="text"
                    maxLength={25}
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && wordInput.trim() && !isSubmitting) {
                        handleSubmitAnswer(wordInput.trim());
                      }
                    }}
                    placeholder="এখানে আপনার শব্দ লিখুন (যেমন: প্রোগ্রামিং)..."
                    className="w-full px-5 py-4 rounded-2xl bg-slate-900 border-2 border-slate-700 text-white placeholder-slate-500 font-bold text-lg focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <motion.button
                    whileHover={wordInput.trim() && !isSubmitting ? { scale: 1.02 } : {}}
                    whileTap={wordInput.trim() && !isSubmitting ? { scale: 0.98 } : {}}
                    disabled={!wordInput.trim() || isSubmitting}
                    onClick={() => {
                      if (wordInput.trim()) handleSubmitAnswer(wordInput.trim());
                    }}
                    className="w-full h-14 rounded-2xl bg-linear-to-r from-cyan-500 to-blue-600 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Cloud className="w-5 h-5" />
                        <span>☁️ ওয়ার্ড পাঠাও (Submit Word)</span>
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-purple-950/50 to-fuchsia-950/60 border-2 border-fuchsia-500/50 text-center space-y-3 shadow-2xl backdrop-blur-xl">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-14 h-14 rounded-2xl bg-fuchsia-500/25 border border-fuchsia-400/50 text-fuchsia-300 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(217,70,239,0.4)]"
                  >
                    <Cloud className="w-8 h-8" />
                  </motion.div>
                  <h4 className="text-base font-black text-white">ওয়ার্ড ক্লাউডে পাঠানো হয়েছে!</h4>
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="inline-block px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-fuchsia-500/20 text-fuchsia-300 font-black text-xl border border-fuchsia-400/50 shadow-[0_0_25px_rgba(217,70,239,0.3)]"
                  >
                    &ldquo;{selectedOption || wordInput}&rdquo;
                  </motion.div>
                  <p className="text-xs text-slate-300 font-medium">প্রজেক্টরের কালারফুল ওয়ার্ড ক্লাউডে আপনার শব্দটি ভেসে উঠেছে লক্ষ্য করুন</p>
                </div>
              )}
            </div>
          ) : isOpenEnded ? (
            /* 3. OPEN ENDED / LIVE QA INTERACTION */
            <div className="space-y-5 py-2">
              {!playerAnswered ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-200 text-xs font-medium">
                    💬 আপনার ভাবনা বা উত্তরের সংক্ষিপ্ত ব্যাখ্যা বিস্তারিতভাবে লিখে জমা দিন।
                  </div>
                  <textarea
                    rows={3}
                    maxLength={250}
                    value={openEndedInput}
                    onChange={(e) => setOpenEndedInput(e.target.value)}
                    placeholder="এখানে আপনার মতামত বা উত্তর লিখুন..."
                    className="w-full px-5 py-4 rounded-2xl bg-slate-900 border-2 border-slate-700 text-white placeholder-slate-500 font-medium text-base focus:outline-none focus:border-fuchsia-400 transition-colors resize-none"
                  />
                  <motion.button
                    whileHover={openEndedInput.trim() && !isSubmitting ? { scale: 1.02 } : {}}
                    whileTap={openEndedInput.trim() && !isSubmitting ? { scale: 0.98 } : {}}
                    disabled={!openEndedInput.trim() || isSubmitting}
                    onClick={() => {
                      if (openEndedInput.trim()) handleSubmitAnswer(openEndedInput.trim());
                    }}
                    className="w-full h-14 rounded-2xl bg-linear-to-r from-fuchsia-500 to-purple-600 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>🚀 পাঠিয়ে দাও (Submit)</span>
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-fuchsia-500/15 border-2 border-fuchsia-500/40 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-fuchsia-400 mx-auto" />
                  <h4 className="text-base font-black text-white">আপনার মতামত পাঠানো হয়েছে!</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto italic">&ldquo;{selectedOption || openEndedInput}&rdquo;</p>
                  <p className="text-[11px] text-slate-400">শিক্ষক বোর্ডে আপনার কার্ড প্রদর্শন করতে পারেন</p>
                </div>
              )}
            </div>
          ) : isPreviewPhase ? (
            /* 4. GRADED QUIZ: PREVIEW MASKING */
            <div className="space-y-3 py-4">
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-dashed border-amber-500/30 text-center space-y-2">
                <Lock className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
                <h4 className="text-sm font-black text-white">উত্তর অপশনসমূহ গোপন রয়েছে</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  প্রিভিউ শেষ হলে উত্তর দেওয়ার জন্য ইন্টারঅ্যাকশন ও মূল টাইমার একসঙ্গে চালু হবে।
                </p>
                <div className="w-32 h-1.5 bg-amber-500/20 rounded-full mx-auto overflow-hidden mt-3">
                  <motion.div
                    className="h-full bg-amber-400"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 3, ease: "linear" }}
                  />
                </div>
              </div>

              {/* Shimmer Placeholder outlines for layout stability */}
              <div className="grid grid-cols-1 gap-2.5 opacity-30 pointer-events-none">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-slate-800 border border-slate-700 animate-pulse flex items-center px-4 gap-3">
                    <div className="w-6 h-6 rounded-md bg-slate-700" />
                    <div className="w-48 h-3 rounded bg-slate-700" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* 5. GRADED QUIZ: ALL 5 QUESTION TYPES RENDERED VIA UNIVERSAL SHOWCASE ENGINE (20 ROTATING TEMPLATES) */
            <div className="w-full">
              <UniversalQuizShowcaseEngine
                question={currentQuestion}
                questionIndex={currentQuestionIdx}
                totalQuestions={totalQuestions}
                templateId={((currentQuestionIdx || 0) % 20) + 1}
                selectedAnswer={localSelected ?? selectedOption}
                onSelectAnswer={(ans) => {
                  setLocalSelected(ans);
                  handleSelect(ans);
                }}
                onConfirmAnswer={(ans) => {
                  setLocalSelected(ans);
                  const elapsed = Date.now() - questionStartTimeRef.current;
                  const secStr = (elapsed / 1000).toFixed(2);
                  setSubmissionSpeed({ seconds: secStr, ms: elapsed });
                  handleSubmitAnswer(ans);
                }}
                isConfirmed={playerAnswered && isAnswerRevealed}
                isCorrect={lastAnswerFeedback?.isCorrect ?? undefined}
                disabled={playerAnswered || isSubmitting || !canSubmitAnswer}
                autoRandomize={false}
                showProofBadge={true}
              />
            </div>
          )}

          {/* GRADED SUBMISSION CONTROL PANEL */}
          {!isNonGraded && !isPreviewPhase && (
            <div className="pt-2">
              {!playerAnswered && !isAnswerRevealed ? (
                <motion.button
                  whileHover={localSelected !== null && canSubmitAnswer ? { scale: 1.02 } : {}}
                  whileTap={localSelected !== null && canSubmitAnswer ? { scale: 0.98 } : {}}
                  disabled={localSelected === null || isSubmitting || !canSubmitAnswer}
                  onClick={handleConfirm}
                  className={`w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${localSelected !== null && canSubmitAnswer
                    ? "bg-linear-to-r from-emerald-400 via-teal-400 to-emerald-500 text-slate-950 shadow-emerald-500/30 hover:shadow-emerald-500/50"
                    : "bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-slate-950" />
                      <span>উত্তর পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>উত্তর নিশ্চিত করুন (Confirm Answer)</span>
                    </>
                  )}
                </motion.button>
              ) : playerAnswered && !isAnswerRevealed ? (
                /* FIX 6: DEFERRED STUDENT FEEDBACK WAITING CARD */
                <div className="p-5 rounded-2xl bg-linear-to-b from-indigo-950/60 to-slate-900/90 border-2 border-cyan-500/40 text-center space-y-3 shadow-[0_0_30px_rgba(6,182,212,0.15)] animate-in fade-in duration-300">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>✅ তোমার উত্তর লক করা হয়েছে!</span>
                  </div>

                  {banglaSpeedSec && banglaSpeedMs && (
                    <div className="py-1">
                      <p className="text-sm sm:text-base font-black text-amber-300">
                        ⚡ তুমি <span className="font-mono text-lg sm:text-xl text-amber-400 underline underline-offset-4">{banglaSpeedSec}</span> সেকেন্ডে ({banglaSpeedMs} মিলিসেকেন্ডে) উত্তর সাবমিট করেছো!
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-300">
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>⏳ সবাই উত্তর দেওয়া বা সময় শেষ হওয়া পর্যন্ত অপেক্ষা করো...</span>
                  </div>

                  {playerCount > 0 && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>অন্যান্য শিক্ষার্থীরা উত্তর দিচ্ছে... ({toBanglaDigits(answeredCount)} / {toBanglaDigits(playerCount)} জমা হয়েছে)</span>
                    </div>
                  )}
                </div>
              ) : isAnswerRevealed ? (
                /* FIX 6: RESULT REVEAL (ALL VOTED OR TIMER HIT 0) */
                <div className="space-y-3 animate-in fade-in duration-300">
                  {playerAnswered ? (
                    lastAnswerFeedback?.isCorrect === true ? (
                      <div className="p-4 bg-emerald-500/15 border-2 border-emerald-500/50 rounded-2xl space-y-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/25 flex items-center justify-center shrink-0 border border-emerald-400/50">
                            <Check className="w-6 h-6 text-emerald-300" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-emerald-300 font-black text-sm">🎉 সঠিক উত্তর! চমৎকার উত্তর দিয়েছেন!</h4>
                            <p className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-bold">
                              +{lastAnswerFeedback.totalPoints ?? 100} পয়েন্ট অর্জিত হয়েছে
                            </p>
                          </div>
                        </div>
                        {banglaSpeedSec && (
                          <div className="pt-1.5 border-t border-emerald-500/20 text-xs text-emerald-300 font-mono flex items-center gap-2">
                            <span>⚡ সাবমিট স্পিড: {banglaSpeedSec} সেকেন্ড ({banglaSpeedMs} মি.সে.)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-rose-500/15 border-2 border-rose-500/50 rounded-2xl space-y-2 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-rose-500/25 flex items-center justify-center shrink-0 border border-rose-400/50">
                            <AlertCircle className="w-6 h-6 text-rose-400" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-rose-300 font-black text-sm">❌ ভুল উত্তর!</h4>
                            {lastAnswerFeedback?.correctAnswer && (
                              <p className="text-xs text-slate-300 font-bold mt-0.5">
                                সঠিক উত্তর: <span className="text-emerald-400 font-black">{String(lastAnswerFeedback.correctAnswer)}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        {banglaSpeedSec && (
                          <div className="pt-1.5 border-t border-rose-500/20 text-xs text-slate-400 font-mono">
                            <span>⚡ সাবমিট স্পিড: {banglaSpeedSec} সেকেন্ড</span>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    /* Did not submit before timer expired */
                    <div className="p-4 bg-amber-500/15 border-2 border-amber-500/50 rounded-2xl flex items-center gap-3 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                      <div className="w-10 h-10 rounded-full bg-amber-500/25 flex items-center justify-center shrink-0 border border-amber-400/50">
                        <XCircle className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-amber-300 font-black text-sm">❌ সময় শেষ — উত্তর দিতে পারেননি!</h4>
                        {lastAnswerFeedback?.correctAnswer && (
                          <p className="text-xs text-slate-300 font-bold mt-0.5">
                            সঠিক উত্তর: <span className="text-emerald-400 font-black">{String(lastAnswerFeedback.correctAnswer)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </QuizPlate>

      {/* Participation Stats & Live Server Status Footer */}
      <div className="flex items-center justify-between px-2 pt-1 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-400">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>{answeredCount} / {playerCount} জন উত্তর জমা দিয়েছেন</span>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${networkStatus === "connected" ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-ping"
            }`} />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {networkStatus === "connected" ? "লাইভ সার্ভার সংযুক্ত" : "পুনঃসংযুক্ত হচ্ছে..."}
          </span>
        </div>
      </div>

      {/* Motivation Overlay Toast */}
      <AnimatePresence>
        {activeMotivation && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-50 pointer-events-none"
          >
            <div className="bg-slate-900/95 border-2 border-amber-500/40 backdrop-blur-2xl p-4 rounded-3xl shadow-2xl flex items-center gap-4 border-l-4 border-l-amber-400 pointer-events-auto shadow-amber-500/20">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-400/40">
                <Flame className="w-6 h-6 text-amber-400 animate-bounce" />
              </div>
              <div className="flex-1 space-y-0.5">
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
                  PTSC কুইজ অ্যাসিস্ট্যান্ট
                </span>
                <p className="text-sm font-bold text-white italic leading-tight">
                  &ldquo;{activeMotivation.message}&rdquo;
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proctoring Warning & Auto-Submit Modal Overlay */}
      <ProctoringWarningOverlay
        isOpen={proctoring.warningModalOpen}
        onDismiss={() => proctoring.setWarningModalOpen(false)}
        strikes={proctoring.strikes}
        maxStrikes={proctoring.maxStrikes}
        message={proctoring.warningMessage}
        isDisqualified={proctoring.isDisqualified}
      />

      {/* Participant Live Reaction Floating Bar */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-slate-700/80 shadow-2xl flex items-center gap-1.5 sm:gap-2">
        <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">রিঅ্যাকশন:</span>
        {[
          { key: "cat", icon: "🐱", label: "Cat" },
          { key: "heart", icon: "❤️", label: "Heart" },
          { key: "question", icon: "❓", label: "Confused" },
          { key: "thumbs_up", icon: "👍", label: "Agree" },
          { key: "thumbs_down", icon: "👎", label: "Disagree" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => emitLiveReaction(item.key)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 text-base sm:text-lg transition-transform active:scale-130 cursor-pointer"
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>
      <FloatingReactionOverlay />
    </div>
  );
}
