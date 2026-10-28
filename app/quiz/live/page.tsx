"use client";

import React, { useState } from "react";
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
  XCircle
} from "lucide-react";
import UniversalQuizShowcaseEngine from "@/components/quiz/engine/UniversalQuizShowcaseEngine";
import { motion, AnimatePresence } from "motion/react";

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

  const [localSelected, setLocalSelected] = useState<any>(null);
  const [wordInput, setWordInput] = useState("");
  const [openEndedInput, setOpenEndedInput] = useState("");

  // Reset inputs on slide change
  React.useEffect(() => {
    setLocalSelected(null);
    setWordInput("");
    setOpenEndedInput("");
  }, [currentQuestionIdx, currentQuestion?.id]);

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
            className={`w-full max-w-sm py-4 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-3 transition-transform cursor-pointer ${
              isReady
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
            {readyCount > 0 && (
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
  const isContentSlide = qType === "TEXT_SLIDE" || qType === "IMAGE_COMPARE";
  const isOpenEnded = qType === "OPEN_ENDED" || qType === "LIVE_QA";
  const isWordCloud = qType === "WORD_CLOUD";
  const isNonGraded = isContentSlide || isOpenEnded || isWordCloud;

  // ==========================================
  // STEPS 2, 3, 4 — QUESTION PREVIEW & ACTIVE GAMEPLAY
  // ==========================================
  const isPreviewPhase = !isNonGraded && (currentPhase === "QUESTION_PREVIEW" || previewSeconds > 0);
  const isOptionsRevealed = !isPreviewPhase && (currentPhase === "QUESTION_ACTIVE" || currentPhase === "QUESTION_ENDED");

  return (
    <div className="space-y-6 w-full max-w-2xl px-2 mx-auto">
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
            className={`shrink-0 w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-mono font-black transition-colors ${
              allVoted
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
            /* 5. GRADED QUIZ: ALL 5 QUESTION TYPES RENDERED ACCORDING TO TYPE */
            <div className="w-full">
              {qType === "MATCHING" || qType === "FILL_BLANKS" || qType === "REORDER" || qType === "TRUE_FALSE" ? (
                <UniversalQuizShowcaseEngine
                  question={currentQuestion}
                  selectedAnswer={localSelected ?? selectedOption}
                  onSelectAnswer={(ans) => {
                    setLocalSelected(ans);
                    handleSelect(ans);
                  }}
                  onConfirmAnswer={(ans) => {
                    setLocalSelected(ans);
                    handleSubmitAnswer(ans);
                  }}
                  isConfirmed={playerAnswered}
                  isCorrect={lastAnswerFeedback?.isCorrect}
                  disabled={playerAnswered || isSubmitting || !canSubmitAnswer}
                />
              ) : (
                /* MCQ (20 Structural Archetypes / Responsive Interactive Options) */
                <div className="grid grid-cols-1 gap-3">
                  <AnimatePresence mode="popLayout">
                    {currentQuestion.options?.map((option: string, idx: number) => {
                      const isSelected = (localSelected !== null && String(localSelected) === String(idx)) || 
                        (selectedOption !== "" && selectedOption !== null && selectedOption !== undefined && String(selectedOption) === String(idx));
                      const isConfirmed = playerAnswered && 
                        (String(selectedOption) === String(idx) || String(selectedOption).trim().toLowerCase() === String(option).trim().toLowerCase());
                      
                      // Strict emerald green / rose red evaluation
                      const isCorrectChoice = lastAnswerFeedback?.correctAnswer !== undefined && (
                        String(lastAnswerFeedback.correctAnswer) === String(idx) ||
                        String(lastAnswerFeedback.correctAnswer).trim().toLowerCase() === String(option).trim().toLowerCase()
                      );

                      let optionStyle = "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900";
                      let badgeStyle = "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white";

                      if (playerAnswered) {
                        if (lastAnswerFeedback?.isCorrect === true) {
                          if (isConfirmed) {
                            // Highlight ONLY the student's selected correct option in Emerald Green!
                            optionStyle = "!bg-emerald-500/20 !border-emerald-500 !text-white shadow-[0_0_25px_rgba(16,185,129,0.4)]";
                            badgeStyle = "!bg-emerald-500 !text-slate-950 font-black";
                          } else {
                            // Other options stay dimmed
                            optionStyle = "opacity-35 bg-slate-950/40 border-slate-800/60 text-slate-500";
                          }
                        } else if (lastAnswerFeedback?.isCorrect === false) {
                          if (isConfirmed) {
                            // Highlight ONLY the student's selected wrong option in Rose Red!
                            optionStyle = "!bg-rose-500/20 !border-rose-500 !text-white shadow-[0_0_25px_rgba(244,63,94,0.4)]";
                            badgeStyle = "!bg-rose-500 !text-white font-black";
                          } else if (isCorrectChoice) {
                            // AND reveal the true correct answer in Emerald Green!
                            optionStyle = "!bg-emerald-500/20 !border-emerald-500 !text-white shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-pulse";
                            badgeStyle = "!bg-emerald-500 !text-slate-950 font-black";
                          } else {
                            // Other unselected options stay neutral/dimmed
                            optionStyle = "opacity-30 bg-slate-950/40 border-slate-800/40 text-slate-600";
                          }
                        } else {
                          // Pending feedback
                          if (isConfirmed) {
                            optionStyle = "bg-cyan-500/20 border-cyan-500 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)]";
                            badgeStyle = "bg-cyan-400 text-slate-950 font-black";
                          } else {
                            optionStyle = "opacity-40 bg-slate-950/40 border-slate-800 text-slate-500";
                          }
                        }
                      } else if (isSelected) {
                        optionStyle = "bg-indigo-600/30 border-indigo-400 text-white shadow-[0_0_18px_rgba(99,102,241,0.3)]";
                        badgeStyle = "bg-indigo-500 text-white";
                      }

                      return (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -20, scale: 0.98 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ delay: idx * 0.08, duration: 0.25 }}
                          disabled={playerAnswered || isSubmitting || !canSubmitAnswer}
                          onClick={() => handleSelect(idx)}
                          className={`relative group w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 cursor-pointer overflow-hidden ${optionStyle}`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-lg shrink-0 transition-colors ${badgeStyle}`}>
                            {String.fromCharCode(65 + idx)}
                          </div>

                          <span className="font-bold text-sm sm:text-base flex-1 leading-snug">{option}</span>
                          
                          {playerAnswered && isConfirmed && lastAnswerFeedback?.isCorrect === true && (
                            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                          )}
                          {playerAnswered && isConfirmed && lastAnswerFeedback?.isCorrect === false && (
                            <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                          )}
                          {playerAnswered && !isConfirmed && isCorrectChoice && lastAnswerFeedback?.isCorrect === false && (
                            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                          )}

                          {/* Tech Lines Decoration on confirmed */}
                          {isConfirmed && (
                            <div className="absolute top-0 right-0 h-full w-2 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                          )}
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* GRADED SUBMISSION CONTROL PANEL */}
          {!isNonGraded && !isPreviewPhase && (
            <div className="pt-2">
              {!playerAnswered ? (
                <motion.button
                  whileHover={localSelected !== null && canSubmitAnswer ? { scale: 1.02 } : {}}
                  whileTap={localSelected !== null && canSubmitAnswer ? { scale: 0.98 } : {}}
                  disabled={localSelected === null || isSubmitting || !canSubmitAnswer}
                  onClick={handleConfirm}
                  className={`w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    localSelected !== null && canSubmitAnswer
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
              ) : (
                <div className="space-y-3">
                  {lastAnswerFeedback?.isCorrect === true ? (
                    <div className="p-4 bg-emerald-500/15 border-2 border-emerald-500/50 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/25 flex items-center justify-center shrink-0 border border-emerald-400/50">
                        <Check className="w-6 h-6 text-emerald-300" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-emerald-300 font-black text-sm">সঠিক উত্তর! চমৎকার উত্তর দিয়েছেন!</h4>
                        <p className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-bold">
                          +{lastAnswerFeedback.totalPoints ?? 100} পয়েন্ট অর্জিত হয়েছে
                        </p>
                      </div>
                    </div>
                  ) : lastAnswerFeedback?.isCorrect === false ? (
                    <div className="p-4 bg-rose-500/15 border-2 border-rose-500/50 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                      <div className="w-10 h-10 rounded-full bg-rose-500/25 flex items-center justify-center shrink-0 border border-rose-400/50">
                        <AlertCircle className="w-6 h-6 text-rose-400" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-rose-300 font-black text-sm">ভুল উত্তর! সঠিক উত্তরটি সবুজ রঙে নির্দেশিত হয়েছে।</h4>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                          পরবর্তী প্রশ্নের জন্য প্রস্তুত হোন
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-cyan-500/15 border-2 border-cyan-500/40 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/25 flex items-center justify-center shrink-0 border border-cyan-400/40">
                        <Check className="w-6 h-6 text-cyan-300" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-cyan-300 font-black text-sm">উত্তর সংরক্ষিত হয়েছে!</h4>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                          টাইমার শেষ হওয়া পর্যন্ত অপেক্ষা করুন
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
          <div className={`w-2.5 h-2.5 rounded-full ${
            networkStatus === "connected" ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-ping"
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
