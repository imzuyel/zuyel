"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Zap,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  School,
  Flame,
  Gamepad2,
  Clock,
  Lock,
  Trophy,
  Star,
  Check,
  X,
  Send,
  RotateCcw,
  Eye,
  Award,
  Crown,
  Heart,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import StudentModern3DJoinCard, { StudentAuthIdentity } from "@/components/quiz/StudentModern3DJoinCard";
import { computeSafeRemainingSeconds } from "@/lib/liveSessionStore";
import { triggerFireworks } from "@/lib/confetti";

function toBanglaDigits(num: number | string): string {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (d) => bn[parseInt(d, 10)] || d);
}

function LiveQuizArenaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL parameters
  const paramSessionId = searchParams?.get("sessionId") || "";
  const paramCode = searchParams?.get("code") || searchParams?.get("pin") || "";

  // Student Identity State
  const [identity, setIdentity] = useState<StudentAuthIdentity | null>(null);
  const [isIdentityRestored, setIsIdentityRestored] = useState(false);

  // Live Session Polled State
  const [sessionState, setSessionState] = useState<any | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  // Local Client Timer
  const [displaySeconds, setDisplaySeconds] = useState(20);

  // Interaction State
  const [isReady, setIsReady] = useState(false);
  const [isTappingReady, setIsTappingReady] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    isCorrect?: boolean;
    earnedPoints?: number;
    responseTimeMs?: number;
  } | null>(null);

  // Input states for non-MCQ types
  const [textInput, setTextInput] = useState("");
  const [reorderList, setReorderList] = useState<any[]>([]);
  const [matchingPairsSelected, setMatchingPairsSelected] = useState<Record<string, string>>({});

  // Slide tracking to reset inputs on slide change
  const currentSlideIndexRef = useRef<number>(-1);
  const questionStartTimeRef = useRef<number>(Date.now());

  // 1. Recover Identity from sessionStorage (per tab) or localStorage fallback
  useEffect(() => {
    try {
      const codeKey = paramCode ? `live_quiz_player_${paramCode}` : "";
      const raw =
        (typeof window !== "undefined" && window.sessionStorage.getItem("live_quiz_player")) ||
        (codeKey && typeof window !== "undefined" && window.localStorage.getItem(codeKey)) ||
        (typeof window !== "undefined" && window.localStorage.getItem("pgtsc_live_quiz_player"));

      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.playerId && parsed.playerName) {
          setIdentity(parsed);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsIdentityRestored(true);
    }
  }, [paramCode]);

  // Session ID resolution
  const resolvedSessionId = useMemo(() => {
    return paramSessionId || identity?.sessionId || paramCode || "";
  }, [paramSessionId, identity, paramCode]);

  // 2. Poll /api/live-quizzes/sessions/[id]/state every 1000ms
  useEffect(() => {
    if (!resolvedSessionId) {
      setIsInitialLoading(false);
      return;
    }

    let isMounted = true;
    const pollState = async () => {
      try {
        const playerIdQuery = identity?.playerId ? `?playerId=${identity.playerId}` : "";
        const res = await fetch(`/api/live-quizzes/sessions/${resolvedSessionId}/state${playerIdQuery}`);
        const data = await res.json();

        if (isMounted && data.success) {
          setSessionState(data);

          // Calculate server clock offset
          if (data.serverNow || data.serverTimestamp) {
            const serverNow = Number(data.serverNow || data.serverTimestamp);
            if (Number.isFinite(serverNow)) {
              setServerOffsetMs(serverNow - Date.now());
            }
          }

          // Check if server recorded readiness
          if (identity?.playerId && Array.isArray(data.readyPlayers)) {
            const foundReady = data.readyPlayers.some((p: any) => p.playerId === identity.playerId || p.id === identity.playerId);
            setIsReady(foundReady);
          }

          // Check if server already recorded answer for current slide
          if (data.playerAnswered && data.studentAnswerData) {
            setHasSubmitted(true);
            setSelectedAnswer(data.selectedOption ?? data.studentAnswerData.answerPayload);
            setSubmissionFeedback({
              isCorrect: data.studentAnswerData.isCorrect,
              earnedPoints: data.studentAnswerData.totalPoints || data.studentAnswerData.points,
              responseTimeMs: data.studentAnswerData.responseTimeMs,
            });
          }

          // Trigger celebratory fireworks on completion
          if (data.stage === "ENDED" || data.status === "ENDED" || data.stage === "LEADERBOARD_VIEW") {
            triggerFireworks();
          }
        }
      } catch {
        // silent fallback
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    };

    pollState();
    const interval = setInterval(pollState, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [resolvedSessionId, identity?.playerId]);

  // 3. High-Frequency Local 100ms Timer (Strictly NaN-proof)
  useEffect(() => {
    const stageEndsAt = sessionState?.stageEndsAt;
    const interval = setInterval(() => {
      const safeSec = computeSafeRemainingSeconds(stageEndsAt, serverOffsetMs, 20);
      setDisplaySeconds(Number.isFinite(safeSec) ? safeSec : 0);
    }, 100);

    return () => clearInterval(interval);
  }, [sessionState?.stageEndsAt, serverOffsetMs]);

  // 4. Slide Transition & Input Reset
  const currentSlideIndex = sessionState?.currentSlideIndex ?? 0;
  const currentSlide = sessionState?.currentSlide;

  useEffect(() => {
    if (currentSlideIndexRef.current !== currentSlideIndex) {
      currentSlideIndexRef.current = currentSlideIndex;
      questionStartTimeRef.current = Date.now();
      setHasSubmitted(false);
      setIsSubmitting(false);
      setSelectedAnswer(null);
      setSubmissionFeedback(null);
      setTextInput("");

      if (currentSlide) {
        if (Array.isArray(currentSlide.items)) {
          setReorderList([...currentSlide.items]);
        } else if (Array.isArray(currentSlide.options)) {
          setReorderList([...currentSlide.options]);
        }
      }
      setMatchingPairsSelected({});
    }
  }, [currentSlideIndex, currentSlide]);

  // 5. Handle "I am Ready" Tap
  const handleReadyTap = async () => {
    if (!resolvedSessionId || !identity || isTappingReady) return;
    setIsTappingReady(true);
    const nextReady = !isReady;

    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(40);
    }

    try {
      setIsReady(nextReady);
      await fetch(`/api/live-quizzes/sessions/${resolvedSessionId}/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: identity.playerId,
          studentName: identity.playerName,
          roll: identity.roll,
          avatar: identity.avatar,
          isReady: nextReady,
        }),
      });
    } catch {
      // rollback on network fail
      setIsReady(!nextReady);
    } finally {
      setIsTappingReady(false);
    }
  };

  // 6. Handle Answer Submission (Strict O(1) submission)
  const handleSubmitAnswer = async (payload: any) => {
    if (hasSubmitted || isSubmitting || !resolvedSessionId || !identity) return;
    setIsSubmitting(true);
    setSelectedAnswer(payload);

    const responseTimeMs = Math.max(100, Date.now() - questionStartTimeRef.current);

    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([30, 20, 30]);
    }

    try {
      const res = await fetch(`/api/live-quizzes/sessions/${resolvedSessionId}/secure-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: identity.playerId,
          slideIndex: currentSlideIndex,
          questionId: currentSlide?.id || `slide-${currentSlideIndex}`,
          answerPayload: payload,
          responseTimeMs,
          displayName: identity.playerName,
          roll: identity.roll,
          avatar: identity.avatar,
        }),
      });

      const data = await res.json();
      setHasSubmitted(true);

      if (data.success) {
        setSubmissionFeedback({
          isCorrect: data.isCorrect,
          earnedPoints: data.totalPoints || data.points || 0,
          responseTimeMs,
        });
      }
    } catch {
      setHasSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // CONDITIONAL VIEW 0: Unjoined State -> Modern 3D Join Card
  // =========================================================================
  if (isIdentityRestored && !identity) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 sm:p-6">
        <StudentModern3DJoinCard
          initialCode={paramCode}
          onJoined={(newIdentity) => {
            setIdentity(newIdentity);
          }}
        />
      </div>
    );
  }

  // Initial Loader
  if (isInitialLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-4 space-y-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)]">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
        <p className="text-sm font-bold text-slate-300 animate-pulse">
          লাইভ সেশনের সাথে সংযোগ স্থাপন করা হচ্ছে...
        </p>
      </div>
    );
  }

  // Current session stage
  const rawStage = sessionState?.stage || sessionState?.phase || "READY_CHECK";
  const stage = rawStage.toUpperCase();

  const totalPlayers = sessionState?.totalPlayers || 1;
  const myRank = sessionState?.myRank || 1;
  const myScore = sessionState?.myScore || 0;
  const totalSlides = sessionState?.totalSlides || sessionState?.slides?.length || 1;
  const safeTimeLeft = Number.isFinite(displaySeconds) ? Math.max(0, displaySeconds) : 0;

  // =========================================================================
  // STATE A: WELCOME_WAITING / WARMUP_ACTIVE / READY_CHECK / LOBBY
  // =========================================================================
  if (stage === "WELCOME_WAITING" || stage === "WARMUP_ACTIVE" || stage === "READY_CHECK" || stage === "LOBBY" || stage === "READY") {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between items-center bg-slate-950 p-4 sm:p-6 relative overflow-hidden select-none">
        {/* Ambient Neon Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header */}
        <div className="w-full max-w-md mx-auto text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>লাইভ সেশন সক্রিয়</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white truncate px-2">
            {sessionState?.session?.title || sessionState?.currentSlide?.title || "লাইভ কুইজ এরিনা"}
          </h2>
        </div>

        {/* Main Student Status Card */}
        <div className="w-full max-w-md mx-auto relative">
          <div className="relative rounded-3xl bg-slate-900/80 border border-slate-700/60 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-6 sm:p-8 text-center space-y-6">
            {/* Glowing Emerald Confirmation Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border-2 border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <div className="flex items-center justify-center gap-2 text-emerald-300 font-black text-sm sm:text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>✅ তুমি সফলভাবে জয়েন হয়েছ!</span>
              </div>
            </div>

            {/* Student Avatar, Name & Roll */}
            <div className="space-y-3">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto text-5xl shadow-[0_0_35px_rgba(6,182,212,0.5)] border-2 border-white/40">
                <span>{identity?.avatar || "🚀"}</span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">{identity?.playerName}</h3>
                <p className="text-xs font-bold text-slate-400">
                  রোল: <span className="text-amber-300">{identity?.roll || "—"}</span> | বর্তমান পয়েন্ট: <span className="text-cyan-400">{myScore} pts</span>
                </p>
              </div>
            </div>

            {/* Live Classmates Counter */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>👥 রুমে জয়েন করেছে:</span>
                </span>
                <span className="font-mono text-cyan-300 text-sm font-black">
                  {toBanglaDigits(totalPlayers)} জন শিক্ষার্থী
                </span>
              </div>

              {/* Animated Avatar Bubbles */}
              <div className="flex items-center justify-center -space-x-2 overflow-hidden py-1">
                {(sessionState?.players || []).slice(0, 8).map((p: any, idx: number) => (
                  <div
                    key={p.id || idx}
                    className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-sm shadow"
                    title={p.name}
                  >
                    <span>{p.avatar || "🎓"}</span>
                  </div>
                ))}
                {totalPlayers > 8 && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600/80 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                    +{totalPlayers - 8}
                  </div>
                )}
              </div>
            </div>

            {/* Big Interactive "I am Ready" Button */}
            <motion.button
              type="button"
              disabled={isTappingReady}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleReadyTap}
              className={`w-full py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 cursor-pointer transition-all shadow-xl ${
                isReady
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-[0_0_35px_rgba(16,185,129,0.5)] border-2 border-emerald-300"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-[0_0_35px_rgba(245,158,11,0.5)] border-2 border-amber-300"
              }`}
            >
              {isTappingReady ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-950" />
              ) : isReady ? (
                <>
                  <CheckCircle2 className="w-6 h-6 fill-slate-950 text-emerald-400" />
                  <span>✓ তুমি প্রস্তুত! শিক্ষক প্রশ্ন শুরু করবেন...</span>
                </>
              ) : (
                <>
                  <Flame className="w-6 h-6 fill-slate-950" />
                  <span>✋ আমি প্রস্তুত! (I am Ready)</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-slate-500 text-center pb-2">
          শিক্ষক স্লাইড স্টার্ট করলেই স্ক্রিন স্বয়ংক্রিয়ভাবে প্রশ্নের কাউন্টডাউনে যাবে।
        </p>
      </div>
    );
  }

  // =========================================================================
  // STATE B: COUNTDOWN_321 (Neon 3 -> 2 -> 1 Ring)
  // =========================================================================
  if (stage === "COUNTDOWN_321") {
    const countdownNumber = Math.max(1, safeTimeLeft);
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-4 relative overflow-hidden select-none text-center">
        {/* Neon Ambient Background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-600/20 via-indigo-600/20 to-purple-600/20 blur-[130px] pointer-events-none" />

        <div className="relative space-y-6 max-w-sm mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>প্রশ্ন {currentSlideIndex + 1} / {totalSlides} আসছে...</span>
          </div>

          {/* Huge Animated 3D Neon Countdown Ring */}
          <motion.div
            key={countdownNumber}
            initial={{ scale: 2.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center mx-auto text-7xl sm:text-8xl font-black text-white shadow-[0_0_80px_rgba(6,182,212,0.7)] border-4 border-white/40 font-mono"
          >
            <span>{Number.isFinite(countdownNumber) ? countdownNumber : 3}</span>
          </motion.div>

          <p className="text-base sm:text-lg font-black text-cyan-300 tracking-wider uppercase animate-pulse">
            প্রস্তুত হও! কাউন্টডাউন চলছে...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE C: QUESTION_ONLY & ANSWERING_ACTIVE
  // =========================================================================
  if (stage === "QUESTION_ONLY" || stage === "ANSWERING_ACTIVE") {
    const qType = (currentSlide?.type || currentSlide?.questionType || "MCQ").toUpperCase();
    const isQuestionOnly = stage === "QUESTION_ONLY";
    const options = Array.isArray(currentSlide?.options) ? currentSlide.options : [];
    const questionText = currentSlide?.questionText || currentSlide?.title || currentSlide?.question || "প্রশ্ন";

    return (
      <div className="min-h-screen w-full flex flex-col justify-between bg-slate-950 text-white select-none relative">
        {/* Top Sticky Bar */}
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            {/* Question Progress */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-xs font-black text-indigo-300 font-mono">
                প্রশ্ন {currentSlideIndex + 1}/{totalSlides}
              </span>
              <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                {qType}
              </span>
            </div>

            {/* Synchronized Seconds Badge */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-black shadow-lg ${
                  safeTimeLeft <= 5
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse"
                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{Number.isFinite(safeTimeLeft) ? safeTimeLeft : 0}s</span>
              </div>

              {/* Student Points Badge */}
              <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs font-mono">
                ⭐ {myScore} pts
              </div>
            </div>
          </div>

          {/* Synchronized Countdown Progress Bar */}
          <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ease-linear ${
                safeTimeLeft <= 5 ? "bg-rose-500" : "bg-gradient-to-r from-cyan-400 to-indigo-500"
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, (safeTimeLeft / (Number(currentSlide?.timeLimit) || 20)) * 100))}%`,
              }}
            />
          </div>
        </header>

        {/* Question Title & Media Section */}
        <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-5">
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-3 shadow-xl backdrop-blur-xl">
            <h2 className="text-lg sm:text-2xl font-black text-white leading-relaxed">
              {questionText}
            </h2>

            {/* Optional Images */}
            {currentSlide?.imageLeftUrl && (
              <div className="pt-2">
                <img
                  src={currentSlide.imageLeftUrl}
                  alt="Question illustration"
                  className="max-h-48 mx-auto rounded-2xl object-contain border border-slate-700"
                />
              </div>
            )}
          </div>

          {/* Waiting in QUESTION_ONLY preview state */}
          {isQuestionOnly ? (
            <div className="py-8 text-center space-y-3 rounded-2xl bg-slate-900/50 border border-indigo-500/30">
              <Eye className="w-8 h-8 mx-auto text-indigo-400 animate-pulse" />
              <p className="text-sm font-bold text-indigo-300">
                প্রশ্নটি মনোযোগ দিয়ে পড়ো... অপশন আসছে! ({safeTimeLeft}s)
              </p>
            </div>
          ) : hasSubmitted ? (
            /* SUBMITTED WAITING STATE */
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 rounded-3xl bg-slate-900/90 border-2 border-emerald-500/40 text-center space-y-4 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-emerald-300">
                  🔒 উত্তর জমা হয়েছে!
                </h3>
                <p className="text-xs text-slate-400">
                  সময়: {submissionFeedback?.responseTimeMs ? `${(submissionFeedback.responseTimeMs / 1000).toFixed(1)} সেকেন্ড` : "স্বাভাবিক"} — ফলাফলের অপেক্ষায়...
                </p>
              </div>
            </motion.div>
          ) : (
            /* INTERACTIVE OPTIONS BY QUESTION TYPE */
            <div className="space-y-3">
              {/* 1. MCQ Single Choice */}
              {qType === "MCQ" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.map((opt: string, idx: number) => {
                    const colors = [
                      "from-cyan-500/20 to-blue-600/30 border-cyan-400/60 hover:border-cyan-300 text-cyan-200",
                      "from-amber-500/20 to-orange-600/30 border-amber-400/60 hover:border-amber-300 text-amber-200",
                      "from-rose-500/20 to-pink-600/30 border-rose-400/60 hover:border-rose-300 text-rose-200",
                      "from-emerald-500/20 to-teal-600/30 border-emerald-400/60 hover:border-emerald-300 text-emerald-200",
                    ];
                    const colorClass = colors[idx % colors.length];
                    const isSelected = selectedAnswer === idx;

                    return (
                      <motion.button
                        key={idx}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isSubmitting}
                        onClick={() => handleSubmitAnswer(idx)}
                        className={`p-4 rounded-2xl bg-gradient-to-r ${colorClass} border-2 text-left font-bold text-sm sm:text-base flex items-center gap-3 cursor-pointer transition-all shadow-lg active:scale-95 ${
                          isSelected ? "ring-4 ring-white scale-102" : ""
                        }`}
                      >
                        <span className="w-8 h-8 rounded-xl bg-slate-900/80 flex items-center justify-center font-black text-white shrink-0 text-xs">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 text-white">{opt}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* 2. TRUE_FALSE */}
              {qType === "TRUE_FALSE" && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={isSubmitting}
                    onClick={() => handleSubmitAnswer(true)}
                    className="py-8 rounded-3xl bg-gradient-to-br from-emerald-500/30 to-teal-600/40 border-2 border-emerald-400 text-center font-black text-2xl text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.3)] cursor-pointer"
                  >
                    <span>✓ সত্য (True)</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={isSubmitting}
                    onClick={() => handleSubmitAnswer(false)}
                    className="py-8 rounded-3xl bg-gradient-to-br from-rose-500/30 to-pink-600/40 border-2 border-rose-400 text-center font-black text-2xl text-rose-200 shadow-[0_0_30px_rgba(244,63,94,0.3)] cursor-pointer"
                  >
                    <span>✗ মিথ্যা (False)</span>
                  </motion.button>
                </div>
              )}

              {/* 3. FILL_BLANKS / WORD_CLOUD / OPEN_ENDED */}
              {["FILL_BLANKS", "WORD_CLOUD", "OPEN_ENDED"].includes(qType) && (
                <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={qType === "WORD_CLOUD" ? "একটি শব্দ বা কীওয়ার্ড লিখুন..." : "আপনার উত্তরটি এখানে লিখুন..."}
                    className="w-full py-4 px-5 rounded-2xl bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 text-white font-bold outline-none text-base"
                  />
                  <button
                    type="button"
                    disabled={!textInput.trim() || isSubmitting}
                    onClick={() => handleSubmitAnswer(textInput.trim())}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-black text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                    <span>উত্তর সাবমিট করুন</span>
                  </button>
                </div>
              )}

              {/* 4. REORDER */}
              {qType === "REORDER" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {reorderList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-between"
                      >
                        <span className="text-sm font-bold text-white truncate">{item}</span>
                        <div className="flex items-center gap-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...reorderList];
                                const tmp = next[idx - 1];
                                next[idx - 1] = next[idx];
                                next[idx] = tmp;
                                setReorderList(next);
                              }}
                              className="px-2 py-1 rounded bg-slate-800 text-xs font-bold"
                            >
                              ▲
                            </button>
                          )}
                          {idx < reorderList.length - 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...reorderList];
                                const tmp = next[idx + 1];
                                next[idx + 1] = next[idx];
                                next[idx] = tmp;
                                setReorderList(next);
                              }}
                              className="px-2 py-1 rounded bg-slate-800 text-xs font-bold"
                            >
                              ▼
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSubmitAnswer(reorderList)}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-5 h-5" />
                    <span>ধারাক্রম চূড়ান্ত করুন</span>
                  </button>
                </div>
              )}

              {/* 5. MATCHING, IMAGE_COMPARE, TEXT_SLIDE & Fallback */}
              {!["MCQ", "TRUE_FALSE", "FILL_BLANKS", "WORD_CLOUD", "OPEN_ENDED", "REORDER"].includes(qType) && (
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-4">
                  <p className="text-sm text-slate-300">
                    {currentSlide?.content || "স্লাইডের নির্দেশনা দেখুন।"}
                  </p>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSubmitAnswer("acknowledged")}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-base shadow-xl cursor-pointer"
                  >
                    <span>✓ পড়েছি / বুঝেছি (Acknowledge)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // =========================================================================
  // STATE D: RESULT_REVEAL (Instant Fullscreen Feedback on Student Phone)
  // =========================================================================
  if (stage === "RESULT_REVEAL") {
    const isCorrect = submissionFeedback?.isCorrect ?? false;
    const earnedPoints = submissionFeedback?.earnedPoints || 0;
    const explanation = sessionState?.explanation || currentSlide?.explanation || "";
    const correctAnswer = sessionState?.correctAnswer !== undefined ? sessionState.correctAnswer : currentSlide?.correctAnswer;

    return (
      <div className="min-h-screen w-full flex flex-col justify-between items-center bg-slate-950 p-4 sm:p-6 text-white relative select-none">
        {/* Ambient Glow */}
        <div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none ${
            isCorrect ? "bg-emerald-500/20" : "bg-rose-500/20"
          }`}
        />

        {/* Top Header */}
        <div className="w-full max-w-md mx-auto text-center pt-2">
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-bold text-slate-400">
            প্রশ্ন {currentSlideIndex + 1} ফলাফল
          </span>
        </div>

        {/* Main Result Card */}
        <div className="w-full max-w-md mx-auto space-y-4">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-6 sm:p-8 rounded-3xl border-2 text-center space-y-5 shadow-2xl backdrop-blur-2xl ${
              isCorrect
                ? "bg-slate-900/90 border-emerald-400/80 shadow-[0_0_50px_rgba(16,185,129,0.3)]"
                : "bg-slate-900/90 border-rose-400/80 shadow-[0_0_50px_rgba(244,63,94,0.3)]"
            }`}
          >
            {/* Icon */}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl shadow-xl ${
                isCorrect
                  ? "bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 shadow-emerald-500/50"
                  : "bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-rose-500/50"
              }`}
            >
              <span>{isCorrect ? "🎉" : "❌"}</span>
            </div>

            {/* Verdict */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black">
                {isCorrect ? "🎉 সঠিক উত্তর!" : "❌ উত্তরটি সঠিক হয়নি"}
              </h2>
              {isCorrect && (
                <p className="text-lg font-black text-emerald-400 font-mono">
                  +{earnedPoints} পয়েন্ট অর্জিত!
                </p>
              )}
            </div>

            {/* Correct answer display if wrong */}
            {!isCorrect && correctAnswer !== undefined && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-left text-xs sm:text-sm space-y-1">
                <span className="font-black text-rose-300 block">সঠিক উত্তর:</span>
                <span className="text-white font-bold">
                  {typeof correctAnswer === "number" && currentSlide?.options
                    ? currentSlide.options[correctAnswer]
                    : String(correctAnswer)}
                </span>
              </div>
            )}

            {/* Explanation */}
            {explanation && (
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs text-slate-300 space-y-1">
                <span className="font-black text-indigo-300 block">💡 ব্যাখ্যা:</span>
                <p className="leading-relaxed">{explanation}</p>
              </div>
            )}

            {/* Personal Rank Badge */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 border border-indigo-400/40 text-center">
              <span className="text-xs sm:text-sm font-black text-indigo-200">
                🏆 তোমার বর্তমান পজিশন: <strong className="text-amber-300 font-mono">#{myRank}</strong> (মোট {toBanglaDigits(totalPlayers)} জনের মধ্যে)
              </span>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-slate-500 text-center pb-2">
          শিক্ষক পরবর্তী প্রশ্ন শুরু করার অপেক্ষায়...
        </p>
      </div>
    );
  }

  // =========================================================================
  // STATE E: LEADERBOARD_VIEW & ENDED (Top 3 Podium + All Students List)
  // =========================================================================
  const topPlayers = sessionState?.topPlayers || [];
  const allPlayers = sessionState?.players || [];

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-950 text-white p-4 sm:p-6 select-none relative">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{stage === "ENDED" ? "🏆 চূড়ান্ত কুইজ লিডারবোর্ড" : "🏆 বর্তমান কুইজ লিডারবোর্ড"}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {stage === "ENDED" ? "অভিনন্দন সকল শিক্ষার্থীকে!" : "সেরা স্কোরবোর্ড"}
          </h2>
        </div>

        {/* Prominent Personal Rank Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-indigo-900/60 border-2 border-indigo-400/50 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-2xl">
              <span>{identity?.avatar || "🚀"}</span>
            </div>
            <div>
              <h4 className="text-base font-black text-white">{identity?.playerName}</h4>
              <p className="text-xs text-slate-300 font-bold">
                রোল: {identity?.roll || "—"}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-amber-300 font-mono">
              #{myRank}
            </div>
            <div className="text-xs text-cyan-300 font-mono font-bold">
              {myScore} pts
            </div>
          </div>
        </div>

        {/* Top 3 Podium (Gold, Silver, Bronze) */}
        {topPlayers.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end pt-4 pb-2">
            {/* Rank 2 (Silver) */}
            <div className="p-3 sm:p-4 rounded-3xl bg-slate-900/80 border border-slate-700 text-center space-y-2 h-44 flex flex-col justify-end">
              <span className="text-3xl">{topPlayers[1]?.avatar || "🥈"}</span>
              <p className="text-xs font-black text-white truncate">{topPlayers[1]?.displayName || topPlayers[1]?.name}</p>
              <div className="py-1 rounded-xl bg-slate-800 text-xs font-black text-slate-300 font-mono">
                🥈 ২য় | {topPlayers[1]?.totalScore || topPlayers[1]?.score}p
              </div>
            </div>

            {/* Rank 1 (Gold 👑) */}
            <div className="p-4 rounded-3xl bg-gradient-to-t from-amber-500/20 to-slate-900/90 border-2 border-amber-400 text-center space-y-2 h-52 flex flex-col justify-end shadow-[0_0_35px_rgba(245,158,11,0.3)]">
              <Crown className="w-6 h-6 text-amber-400 mx-auto animate-bounce" />
              <span className="text-4xl">{topPlayers[0]?.avatar || "👑"}</span>
              <p className="text-sm font-black text-amber-200 truncate">{topPlayers[0]?.displayName || topPlayers[0]?.name}</p>
              <div className="py-1 rounded-xl bg-amber-500/30 text-xs font-black text-amber-300 font-mono border border-amber-400/50">
                👑 ১ম | {topPlayers[0]?.totalScore || topPlayers[0]?.score}p
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="p-3 sm:p-4 rounded-3xl bg-slate-900/80 border border-slate-700 text-center space-y-2 h-40 flex flex-col justify-end">
              <span className="text-3xl">{topPlayers[2]?.avatar || "🥉"}</span>
              <p className="text-xs font-black text-white truncate">{topPlayers[2]?.displayName || topPlayers[2]?.name}</p>
              <div className="py-1 rounded-xl bg-slate-800 text-xs font-black text-amber-600 font-mono">
                🥉 ৩য় | {topPlayers[2]?.totalScore || topPlayers[2]?.score}p
              </div>
            </div>
          </div>
        )}

        {/* Full Scrollable List of All Students */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            সকল শিক্ষার্থীদের স্কোর ({totalPlayers} জন)
          </h4>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {topPlayers.map((p: any, idx: number) => {
              const isCurrent = p.id === identity?.playerId;
              return (
                <div
                  key={p.id || idx}
                  className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                    isCurrent
                      ? "bg-emerald-500/20 border-emerald-400/80 ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                      : "bg-slate-900/70 border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-mono font-black text-xs text-slate-400">
                      #{idx + 1}
                    </span>
                    <span className="text-xl">{p.avatar || "🎓"}</span>
                    <div>
                      <span className="text-sm font-bold text-white block">
                        {p.displayName || p.name} {isCurrent && "(তুমি)"}
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-mono font-black text-cyan-300">
                    {p.totalScore || p.score || 0} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      }
    >
      <LiveQuizArenaContent />
    </Suspense>
  );
}
