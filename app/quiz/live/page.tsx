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
  PauseCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import StudentModern3DJoinCard, { StudentAuthIdentity } from "@/components/quiz/StudentModern3DJoinCard";
import FloatingReactionOverlay, { emitLiveReaction } from "@/components/quiz/FloatingReactionOverlay";
import { triggerFireworks } from "@/lib/confetti";

function computeSafeRemainingSeconds(
  stageEndsAt?: any,
  serverOffsetMs = 0,
  fallbackSeconds = 3
): number {
  const target = Number(stageEndsAt);
  if (!Number.isFinite(target) || target <= 0) return fallbackSeconds;
  const diff = Math.ceil((target - (Date.now() + serverOffsetMs)) / 1000);
  return Number.isFinite(diff) ? Math.max(0, diff) : fallbackSeconds;
}

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
  const paramPlayerId = searchParams?.get("playerId") || "";

  // Student Identity State
  const [identity, setIdentity] = useState<StudentAuthIdentity | null>(null);
  const [isIdentityRestored, setIsIdentityRestored] = useState(false);

  // Live Session Polled State
  const [sessionState, setSessionState] = useState<any | null>(null);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [stateError, setStateError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  // Unlock vertical scrolling on mount so no previous modal can leave body/html scroll-locked
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }
  }, []);

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
  const [matchingSelectedLeft, setMatchingSelectedLeft] = useState<string | null>(null);

  // Slide tracking to reset inputs on slide change
  const currentSlideIndexRef = useRef<number>(-1);
  const questionStartTimeRef = useRef<number>(Date.now());

  // 1. Recover Identity strictly from isolated sessionStorage (`live_v2_player_${code}`) + URL fallback
  useEffect(() => {
    try {
      const canonicalKey = paramCode ? `live_v2_player_${paramCode}` : "";
      const rawCanonical =
        canonicalKey && typeof window !== "undefined"
          ? window.sessionStorage.getItem(canonicalKey)
          : null;

      const source = rawCanonical ? JSON.parse(rawCanonical) : null;

      const resolvedPlayerId = paramPlayerId || source?.playerId || "";
      const resolvedSessionIdFromStore = paramSessionId || source?.sessionId || "";
      const resolvedCodeFromStore = paramCode || source?.code || source?.roomCode || "";

      if (resolvedPlayerId && (resolvedCodeFromStore || resolvedSessionIdFromStore)) {
        setIdentity({
          playerId: resolvedPlayerId,
          playerName: source?.name || source?.playerName || "শিক্ষার্থী",
          roll: source?.roll || "—",
          avatar: source?.avatar || "🚀",
          sessionId: resolvedSessionIdFromStore,
          roomCode: resolvedCodeFromStore,
        });
      }
    } catch {
      if (paramPlayerId && (paramCode || paramSessionId)) {
        setIdentity({
          playerId: paramPlayerId,
          playerName: "শিক্ষার্থী",
          roll: "—",
          avatar: "🚀",
          sessionId: paramSessionId,
          roomCode: paramCode,
        });
      }
    } finally {
      setIsIdentityRestored(true);
    }
  }, [paramCode, paramSessionId, paramPlayerId]);

  // Guarantee zero redirect-back loop when URL carries playerId + code/sessionId
  const effectiveIdentity: StudentAuthIdentity | null = useMemo(() => {
    if (identity) return identity;
    if (paramPlayerId && (paramCode || paramSessionId)) {
      return {
        playerId: paramPlayerId,
        playerName: "শিক্ষার্থী",
        roll: "—",
        avatar: "🚀",
        sessionId: paramSessionId,
        roomCode: paramCode,
      };
    }
    return null;
  }, [identity, paramPlayerId, paramCode, paramSessionId]);

  // Session ID resolution
  const resolvedSessionId = useMemo(() => {
    return paramSessionId || effectiveIdentity?.sessionId || paramCode || "";
  }, [paramSessionId, effectiveIdentity, paramCode]);

  const mapV2StageToStudent = (v2Stage: string): string => {
    const u = String(v2Stage || "LOBBY").toUpperCase();
    if (u === "LOBBY" || u === "READY_CHECK" || u === "WELCOME_WAITING") return "LOBBY";
    if (u === "COUNTDOWN" || u === "COUNTDOWN_321") return "COUNTDOWN_321";
    if (u === "QUESTION" || u === "ANSWERING_ACTIVE" || u === "QUESTION_ONLY") return "ANSWERING_ACTIVE";
    if (u === "REVEAL" || u === "RESULT_REVEAL") return "RESULT_REVEAL";
    if (u === "LEADERBOARD" || u === "LEADERBOARD_VIEW") return "LEADERBOARD_VIEW";
    if (u === "ENDED") return "ENDED";
    if (u === "PAUSED") return "PAUSED";
    return u;
  };

  // 2. Poll /api/live-v2/state every 1000ms with strict 5-second timeout guard (never spins infinitely)
  useEffect(() => {
    if (!resolvedSessionId && !paramCode) {
      setIsInitialLoading(false);
      return;
    }

    let isMounted = true;
    const pollState = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const activePlayerId = effectiveIdentity?.playerId;
        const qs = new URLSearchParams();
        if (resolvedSessionId && !/^\d{6}$/.test(resolvedSessionId)) {
          qs.set("sessionId", resolvedSessionId);
        }
        if (paramCode) qs.set("code", paramCode);
        if (!qs.has("sessionId") && resolvedSessionId) qs.set("sessionId", resolvedSessionId);
        if (activePlayerId) qs.set("playerId", activePlayerId);
        qs.set("role", "student");

        const res = await fetch(`/api/live-v2/state?${qs.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));

        if (isMounted && (res.status === 404 || data?.errorCode === "SESSION_NOT_FOUND")) {
          setSessionMissing(true);
          setStateError(data?.error || "❌ কুইজ সেশনটি খুঁজে পাওয়া যায়নি বা মেয়াদ শেষ হয়েছে।");
          return;
        }

        if (isMounted && !res.ok) {
          setStateError(data?.error || "সেশনের তথ্য লোড করতে সমস্যা হচ্ছে।");
          return;
        }

        const sess = data?.session;
        if (isMounted && data?.ok && sess) {
          setSessionMissing(false);
          setStateError(null);

          const slideIdx = Number(sess.currentSlideIndex) || 0;
          const activeSlide = sess.slides?.[slideIdx] || null;
          const lb: any[] = Array.isArray(sess.leaderboard) ? sess.leaderboard : [];
          const meObj = sess.me || (activePlayerId ? sess.players?.[activePlayerId] : null);
          const myLbRow = activePlayerId ? lb.find((r) => r.playerId === activePlayerId) : null;
          const myAns = meObj?.answers?.[String(slideIdx)] || null;

          const adaptedState = {
            ...sess,
            session: { id: sess.id, code: sess.code, title: sess.quizTitle },
            stage: mapV2StageToStudent(sess.stage),
            status: sess.status,
            isPaused: sess.stage === "PAUSED" || sess.status === "PAUSED",
            currentSlideIndex: slideIdx,
            currentSlide: activeSlide
              ? {
                  ...activeSlide,
                  questionText: activeSlide.question,
                  title: activeSlide.question,
                  timeLimit: activeSlide.timeLimitSeconds,
                  correctAnswer: activeSlide.correctIndex,
                }
              : null,
            totalSlides: sess.totalQuestions || sess.slides?.length || 1,
            totalPlayers: sess.playerCount || lb.length || 1,
            players: lb,
            topPlayers: lb,
            myRank: myLbRow?.rank || 1,
            myScore: meObj?.score || myLbRow?.score || 0,
            correctAnswer:
              activeSlide && typeof activeSlide.correctIndex === "number" && activeSlide.correctIndex >= 0
                ? activeSlide.correctIndex
                : undefined,
            explanation: activeSlide?.explanation,
          };

          setSessionState(adaptedState);

          // Hydrate real name/avatar from server session
          if (meObj) {
            setIdentity((prev) => ({
              playerId: meObj.id,
              playerName: meObj.name || prev?.playerName || "শিক্ষার্থী",
              roll: meObj.roll || prev?.roll || "—",
              avatar: meObj.avatar || prev?.avatar || "🚀",
              sessionId: sess.id || prev?.sessionId || resolvedSessionId,
              roomCode: sess.code || prev?.roomCode || paramCode,
            }));
          }

          if (data.serverNow) {
            const serverNow = Number(data.serverNow);
            if (Number.isFinite(serverNow)) {
              setServerOffsetMs(serverNow - Date.now());
            }
          }

          if (meObj) {
            setIsReady(Boolean(meObj.isReady));
          }

          if (myAns) {
            setHasSubmitted(true);
            setSelectedAnswer(myAns.optionIndex !== null ? myAns.optionIndex : myAns.answerText);
            setSubmissionFeedback({
              isCorrect: myAns.isCorrect,
              earnedPoints: myAns.pointsEarned,
              responseTimeMs: myAns.responseTimeMs,
            });
          }

          if (sess.stage === "ENDED" || sess.stage === "LEADERBOARD") {
            triggerFireworks();
          }
        }
      } catch (err: any) {
        if (isMounted && err?.name === "AbortError") {
          setStateError("⏱️ সার্ভারের সাড়া পেতে সময় বেশি লাগছে (5s timeout)। অনুগ্রহ করে পুনরায় চেষ্টা করো।");
        } else if (isMounted && !sessionState) {
          setStateError("নেটওয়ার্ক কানেকশন পাওয়া যায়নি। ইন্টারনেট যাচাই করে আবার চেষ্টা করো।");
        }
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setIsInitialLoading(false);
      }
    };

    pollState();
    const interval = setInterval(pollState, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [resolvedSessionId, effectiveIdentity?.playerId, paramCode, retryTrigger]);

  // 3. High-Frequency Local 100ms Timer (Strictly NaN-proof)
  useEffect(() => {
    const stageEndsAt = sessionState?.stageEndsAt;
    const interval = setInterval(() => {
      const safeSec = computeSafeRemainingSeconds(stageEndsAt, serverOffsetMs, 0);
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
      setMatchingSelectedLeft(null);
    }
  }, [currentSlideIndex, currentSlide]);

  // Derived matching pairs for MATCHING questions
  const matchingPairs = useMemo(() => {
    if (Array.isArray(currentSlide?.pairs) && currentSlide.pairs.length > 0) return currentSlide.pairs;
    if (Array.isArray(currentSlide?.questionData?.pairs) && currentSlide.questionData.pairs.length > 0) return currentSlide.questionData.pairs;
    if (Array.isArray(currentSlide?.options)) {
      const parsed = currentSlide.options
        .map((opt: any) => {
          if (typeof opt === "string" && opt.includes(":")) {
            const [left, ...rest] = opt.split(":");
            return { left: left.trim(), right: rest.join(":").trim() };
          }
          return null;
        })
        .filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    return [];
  }, [currentSlide]);

  // 5. Handle "I am Ready" Tap
  const handleReadyTap = async () => {
    if (!resolvedSessionId || !effectiveIdentity || isTappingReady) return;
    setIsTappingReady(true);
    const nextReady = !isReady;

    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(40);
    }

    try {
      setIsReady(nextReady);
      await fetch("/api/live-v2/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: resolvedSessionId,
          code: paramCode,
          action: "PLAYER_READY",
          playerId: effectiveIdentity.playerId,
          isReady: nextReady,
        }),
      });
    } catch {
      setIsReady(!nextReady);
    } finally {
      setIsTappingReady(false);
    }
  };

  // 6. Handle Answer Submission (Strict O(1) submission to /api/live-v2/action)
  const handleSubmitAnswer = async (payload: any) => {
    if (hasSubmitted || isSubmitting || !resolvedSessionId || !effectiveIdentity) return;
    setIsSubmitting(true);
    setSelectedAnswer(payload);

    const responseTimeMs = Math.max(100, Date.now() - questionStartTimeRef.current);

    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([30, 20, 30]);
    }

    const optionIndex =
      typeof payload === "number"
        ? payload
        : payload === true || payload === "TRUE"
        ? 0
        : payload === false || payload === "FALSE"
        ? 1
        : null;

    const answerText =
      typeof payload === "string"
        ? payload
        : optionIndex === null
        ? JSON.stringify(payload)
        : undefined;

    try {
      const res = await fetch("/api/live-v2/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: resolvedSessionId,
          code: paramCode,
          action: "SUBMIT_ANSWER",
          playerId: effectiveIdentity.playerId,
          slideIndex: currentSlideIndex,
          optionIndex,
          answerText,
        }),
      });

      const data = await res.json().catch(() => ({}));
      setHasSubmitted(true);

      if (data.ok) {
        setSubmissionFeedback({
          isCorrect: data.isCorrect,
          earnedPoints: data.pointsEarned || 0,
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
  if (isIdentityRestored && !effectiveIdentity) {
    return (
      <div className="min-h-dvh w-full overflow-y-auto overflow-x-hidden pb-12 flex items-center justify-center bg-slate-950 p-4 sm:p-6">
        <div className="w-full my-auto py-4">
          <StudentModern3DJoinCard
            initialCode={paramCode}
            onJoined={(newIdentity) => {
              setIdentity(newIdentity);
            }}
          />
        </div>
      </div>
    );
  }

  // Initial Loader
  if (isInitialLoading) {
    return (
      <div className="min-h-dvh w-full overflow-y-auto overflow-x-hidden pb-12 flex flex-col items-center justify-center bg-slate-950 p-4 space-y-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)]">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
        <p className="text-sm font-bold text-slate-300 animate-pulse">
          লাইভ সেশনের সাথে সংযোগ স্থাপন করা হচ্ছে...
        </p>
      </div>
    );
  }

  // Session Missing / Invalid Room / Network Timeout Error Notice (Zero Infinite Spinner)
  if ((sessionMissing || stateError) && !sessionState) {
    return (
      <div className="min-h-dvh w-full overflow-y-auto overflow-x-hidden pb-12 flex flex-col items-center justify-center bg-slate-950 p-4 sm:p-6 text-center">
        <div className="w-full max-w-md mx-auto my-auto rounded-3xl bg-slate-900/90 border border-rose-500/40 p-6 sm:p-8 space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">
              {sessionMissing ? "❌ কুইজ সেশনটি পাওয়া যায়নি" : "⚠️ সংযোগ পাওয়া যায়নি"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              {stateError ||
                "রুম কোডটি সঠিক নয় অথবা কুইজ সেশনটির মেয়াদ শেষ হয়েছে। অনুগ্রহ করে সঠিক ৬ ডিজিটের কোড দিয়ে পুনরায় যোগ দাও।"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                setIsInitialLoading(true);
                setStateError(null);
                setSessionMissing(false);
                setRetryTrigger((n) => n + 1);
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>আবার চেষ্টা করো</span>
            </button>
            <a
              href="/quiz/join"
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black text-sm flex items-center justify-center gap-2"
            >
              <span>ফিরে যাও</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Current session stage & status
  const rawStage = sessionState?.stage || sessionState?.phase || "READY_CHECK";
  const stage = rawStage.toUpperCase();
  const liveSessionStatus = String(sessionState?.status || sessionState?.sessionStatus || "ACTIVE").toUpperCase();
  const isSessionPaused = Boolean(sessionState?.isPaused) || liveSessionStatus === "PAUSED";

  const totalPlayers = sessionState?.totalPlayers || 1;
  const myRank = sessionState?.myRank || 1;
  const myScore = sessionState?.myScore || 0;
  const totalSlides = sessionState?.totalSlides || sessionState?.slides?.length || 1;
  const safeTimeLeft = Number.isFinite(displaySeconds) ? Math.max(0, displaySeconds) : 0;

  // =========================================================================
  // PAUSED GUARD: Mentimeter-Style Paused Notice when Teacher Exits / Pauses
  // =========================================================================
  if (isSessionPaused && stage !== "ENDED") {
    return (
      <div className="min-h-dvh w-full overflow-y-auto overflow-x-hidden pb-12 flex flex-col items-center bg-slate-950 p-4 sm:p-6 relative select-none">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-[110px]" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/15 rounded-full blur-[110px]" />
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto my-auto py-6">
          <div className="rounded-3xl bg-slate-900/90 border-2 border-amber-400/50 shadow-[0_20px_60px_rgba(0,0,0,0.75)] backdrop-blur-2xl p-6 sm:p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center mx-auto text-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.3)]">
              <PauseCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-black">
                <span>সেশন বিরতিতে</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                ⏸️ কুইজটি এখন বিরতিতে আছে (Paused by Teacher)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                শিক্ষক আপাতত কুইজটি বিরতি ও সেভ করেছেন। শিক্ষক পুনরায় লাইভ শুরু করলেই তোমার স্ক্রিন স্বয়ংক্রিয়ভাবে পরের প্রশ্নে ফিরে যাবে।
              </p>
            </div>

            {/* Preserved Progress Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-center gap-2.5">
                <span className="text-2xl">{effectiveIdentity?.avatar || "🚀"}</span>
                <div className="text-left">
                  <p className="text-sm font-black text-white">{effectiveIdentity?.playerName || "শিক্ষার্থী"}</p>
                  <p className="text-[11px] font-bold text-slate-400">
                    রোল: <span className="text-amber-300">{effectiveIdentity?.roll || "—"}</span>
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-around text-xs font-bold">
                <span className="text-cyan-300 font-mono">⭐ স্কোর: {myScore} pts</span>
                <span className="text-indigo-300 font-mono">প্রশ্ন: {currentSlideIndex + 1}/{totalSlides}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-amber-300/90 font-bold">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>শিক্ষক পুনরায় শুরু করার অপেক্ষায়...</span>
            </div>

            <a
              href="/quiz/join"
              className="block w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 transition"
            >
              অন্য রুম কোড দিয়ে জয়েন করো
            </a>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE A: WELCOME_WAITING / WARMUP_ACTIVE / READY_CHECK / LOBBY
  // =========================================================================
  if (stage === "WELCOME_WAITING" || stage === "WARMUP_ACTIVE" || stage === "READY_CHECK" || stage === "LOBBY" || stage === "READY") {
    return (
      <div className="min-h-dvh w-full overflow-y-auto overflow-x-hidden pb-12 flex flex-col items-center bg-slate-950 p-4 sm:p-6 relative select-none">
        {/* Ambient Neon Blobs inside fixed container so page scrolling never clips */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/15 rounded-full blur-[100px]" />
        </div>

        {/* Top Header */}
        <div className="relative z-10 w-full max-w-md mx-auto text-center space-y-2 pt-2 pb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>লাইভ সেশন সক্রিয়</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white truncate px-2">
            {sessionState?.session?.title || sessionState?.currentSlide?.title || "লাইভ কুইজ এরিনা"}
          </h2>
        </div>

        {/* Main Student Status Card with comfortable py-6 */}
        <div className="relative z-10 w-full max-w-md mx-auto my-auto py-6">
          <div className="relative rounded-3xl bg-slate-900/80 border border-slate-700/60 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-6 sm:p-8 text-center space-y-6">
            {/* Glowing Emerald Confirmation Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-emerald-500/25 border-2 border-emerald-400/70 shadow-[0_0_30px_rgba(16,185,129,0.35)]">
              <div className="flex items-center justify-center gap-2 text-emerald-300 font-black text-base sm:text-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <span>✅ তুমি যুক্ত হয়েছ! (You&apos;re in!)</span>
              </div>
            </div>

            {/* Student Avatar, Name & Roll */}
            <div className="space-y-3">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto text-5xl shadow-[0_0_35px_rgba(6,182,212,0.5)] border-2 border-white/40">
                <span>{effectiveIdentity?.avatar || "🚀"}</span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">{effectiveIdentity?.playerName}</h3>
                <p className="text-xs font-bold text-slate-400">
                  রোল: <span className="text-amber-300">{effectiveIdentity?.roll || "—"}</span> | বর্তমান পয়েন্ট: <span className="text-cyan-400">{myScore} pts</span>
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
              className={`w-full py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 cursor-pointer transition-all shadow-xl ${isReady
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

            {/* Quick Reactions Bar */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <p className="text-xs font-bold text-slate-400">
                সহপাঠীদের সাথে অনুভূতি শেয়ার করো:
              </p>
              <div className="flex items-center justify-center gap-3">
                {[
                  { emoji: "🔥", label: "আগুন" },
                  { emoji: "🎉", label: "আনন্দ" },
                  { emoji: "💡", label: "বুদ্ধি" },
                  { emoji: "❤️", label: "ভালোবাসা" },
                ].map((item) => (
                  <motion.button
                    key={item.emoji}
                    type="button"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => emitLiveReaction(item.emoji)}
                    className="w-12 h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 flex items-center justify-center text-2xl shadow-lg cursor-pointer transition active:border-cyan-400"
                    title={item.label}
                  >
                    <span>{item.emoji}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="relative z-10 text-[11px] text-slate-500 text-center pt-2 pb-4">
          শিক্ষক স্লাইড স্টার্ট করলেই স্ক্রিন স্বয়ংক্রিয়ভাবে প্রশ্নের কাউন্টডাউনে যাবে।
        </p>

        {/* Floating Reactions Overlay */}
        <FloatingReactionOverlay />
      </div>
    );
  }

  // =========================================================================
  // STATE B: COUNTDOWN_321 (Neon 3 -> 2 -> 1 Ring)
  // =========================================================================
  if (stage === "COUNTDOWN_321") {
    const countdownNumber = Math.max(1, safeTimeLeft);
    return (
      <div className="min-h-dvh w-full overflow-y-auto overflow-x-hidden pb-12 flex flex-col items-center justify-center bg-slate-950 p-4 relative select-none text-center">
        {/* Neon Ambient Background */}
        <div className="fixed inset-0 bg-gradient-to-tr from-cyan-600/20 via-indigo-600/20 to-purple-600/20 blur-[130px] pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-sm mx-auto my-auto py-6">
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
      <div className="min-h-dvh w-full overflow-y-auto overflow-x-hidden pb-12 flex flex-col justify-between bg-slate-950 text-white select-none relative">
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
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-black shadow-lg ${safeTimeLeft <= 5
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
              className={`h-full transition-all duration-100 ease-linear ${safeTimeLeft <= 5 ? "bg-rose-500" : "bg-gradient-to-r from-cyan-400 to-indigo-500"
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

            {/* Optional Images & Side-by-Side Comparison */}
            {(currentSlide?.imageUrl || currentSlide?.imageLeftUrl || currentSlide?.imageRightUrl) && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                {(currentSlide.imageUrl || currentSlide.imageLeftUrl) && (
                  <div className="text-center space-y-1">
                    {currentSlide.imageLeftLabel && (
                      <span className="text-[11px] font-bold text-slate-400 block">{currentSlide.imageLeftLabel}</span>
                    )}
                    <img
                      src={currentSlide.imageLeftUrl || currentSlide.imageUrl}
                      alt="Question illustration"
                      className="max-h-40 rounded-2xl object-contain border border-slate-700 mx-auto"
                    />
                  </div>
                )}
                {currentSlide.imageRightUrl && (
                  <div className="text-center space-y-1">
                    {currentSlide.imageRightLabel && (
                      <span className="text-[11px] font-bold text-slate-400 block">{currentSlide.imageRightLabel}</span>
                    )}
                    <img
                      src={currentSlide.imageRightUrl}
                      alt="Comparison visual"
                      className="max-h-40 rounded-2xl object-contain border border-slate-700 mx-auto"
                    />
                  </div>
                )}
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
              {/* 1. MCQ Single Choice (Kahoot Color-Coded Tactile Blocks) */}
              {qType === "MCQ" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {options.map((opt: string, idx: number) => {
                    const kahootThemes = [
                      { hex: "#E21B3C", shape: "▲" },
                      { hex: "#1368CE", shape: "◆" },
                      { hex: "#D89E00", shape: "●" },
                      { hex: "#26890C", shape: "■" },
                    ];
                    const theme = kahootThemes[idx % kahootThemes.length];
                    const isSelected = selectedAnswer === idx;

                    return (
                      <motion.button
                        key={idx}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        disabled={isSubmitting}
                        onClick={() => handleSubmitAnswer(idx)}
                        style={{ backgroundColor: theme.hex }}
                        className={`p-5 rounded-2xl border-b-4 border-black/35 text-left font-black text-base sm:text-lg flex items-center gap-3.5 cursor-pointer transition-all shadow-xl min-h-[76px] ${isSelected ? "ring-4 ring-white scale-[1.02]" : ""
                          }`}
                      >
                        <span className="w-10 h-10 rounded-xl bg-black/25 flex items-center justify-center font-black text-white shrink-0 text-xl">
                          {theme.shape}
                        </span>
                        <span className="flex-1 text-white leading-snug">{opt}</span>
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

              {/* 5. MATCHING (Tap-to-Pair Interface) */}
              {qType === "MATCHING" && (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-center text-cyan-300">
                    বাম পাশের আইটেমে ট্যাপ করে ডান পাশের সঠিক আইটেমের সাথে জোড়া লাগাও:
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Left Column */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block text-center">বাম পাশ</span>
                      {matchingPairs.map((p: any, idx: number) => {
                        const leftText = typeof p === "string" ? p.split(":")[0]?.trim() : (p.left || p.key || `আইটেম ${idx + 1}`);
                        const isSelected = matchingSelectedLeft === leftText;
                        const isPaired = Boolean(matchingPairsSelected[leftText]);

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setMatchingSelectedLeft(leftText)}
                            className={`w-full p-3 rounded-2xl border-2 text-left text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ${isSelected
                              ? "bg-cyan-500/30 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400"
                              : isPaired
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                                : "bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500"
                              }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate">{leftText}</span>
                              {isPaired && <span className="text-[10px] text-emerald-400">✓</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block text-center">ডান পাশ</span>
                      {matchingPairs.map((p: any, idx: number) => {
                        const rightText = typeof p === "string" ? p.split(":")[1]?.trim() : (p.right || p.value || `অপশন ${idx + 1}`);
                        const pairedLeft = Object.keys(matchingPairsSelected).find(
                          (k) => matchingPairsSelected[k] === rightText
                        );

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (matchingSelectedLeft) {
                                setMatchingPairsSelected((prev) => ({
                                  ...prev,
                                  [matchingSelectedLeft]: rightText,
                                }));
                                setMatchingSelectedLeft(null);
                              }
                            }}
                            className={`w-full p-3 rounded-2xl border-2 text-left text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ${pairedLeft
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                              : matchingSelectedLeft
                                ? "bg-amber-500/10 border-amber-400/60 hover:bg-amber-500/20 text-amber-200 animate-pulse"
                                : "bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500"
                              }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate">{rightText}</span>
                              {pairedLeft && <span className="text-[10px] text-emerald-400">🔗</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Current Pairs Summary */}
                  {Object.keys(matchingPairsSelected).length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>সংযুক্ত জোড়া ({Object.keys(matchingPairsSelected).length}/{matchingPairs.length}):</span>
                        <button
                          type="button"
                          onClick={() => {
                            setMatchingPairsSelected({});
                            setMatchingSelectedLeft(null);
                          }}
                          className="text-rose-400 hover:underline cursor-pointer"
                        >
                          রিসেট
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(matchingPairsSelected).map(([l, r], idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold"
                          >
                            <span>{l}</span>
                            <span className="text-slate-500">↔</span>
                            <span>{r}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isSubmitting || Object.keys(matchingPairsSelected).length === 0}
                    onClick={() => handleSubmitAnswer(matchingPairsSelected)}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                    <span>জোড়া চূড়ান্ত ও সাবমিট করুন</span>
                  </button>
                </div>
              )}

              {/* 6. IMAGE_COMPARE, TEXT_SLIDE & Fallback */}
              {!["MCQ", "TRUE_FALSE", "FILL_BLANKS", "WORD_CLOUD", "OPEN_ENDED", "REORDER", "MATCHING"].includes(qType) && (
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

        {/* Floating Reactions Overlay */}
        <FloatingReactionOverlay />
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
      <div className="min-h-dvh w-full overflow-y-auto overflow-x-hidden pb-12 flex flex-col justify-between items-center bg-slate-950 p-4 sm:p-6 text-white relative select-none">
        {/* Ambient Glow */}
        <div
          className={`fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none ${isCorrect ? "bg-emerald-500/20" : "bg-rose-500/20"
            }`}
        />

        {/* Top Header */}
        <div className="relative z-10 w-full max-w-md mx-auto text-center pt-2">
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-bold text-slate-400">
            প্রশ্ন {currentSlideIndex + 1} ফলাফল
          </span>
        </div>

        {/* Main Result Card */}
        <div className="relative z-10 w-full max-w-md mx-auto my-auto py-4 space-y-4">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-6 sm:p-8 rounded-3xl border-2 text-center space-y-5 shadow-2xl backdrop-blur-2xl ${isCorrect
              ? "bg-slate-900/90 border-emerald-400/80 shadow-[0_0_50px_rgba(16,185,129,0.3)]"
              : "bg-slate-900/90 border-rose-400/80 shadow-[0_0_50px_rgba(244,63,94,0.3)]"
              }`}
          >
            {/* Icon */}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl shadow-xl ${isCorrect
                ? "bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 shadow-emerald-500/50"
                : "bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-rose-500/50"
                }`}
            >
              <span>{isCorrect ? "🎉" : "❌"}</span>
            </div>

            {/* Verdict */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black">
                {isCorrect ? `🎉 সঠিক উত্তর! (+${earnedPoints} পয়েন্ট)` : "❌ ভুল উত্তর"}
              </h2>
              {isCorrect && (
                <p className="text-base font-black text-emerald-400 font-mono">
                  অসাধারণ! তোমার স্কোরে +{earnedPoints} যুক্ত হয়েছে
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
        <p className="relative z-10 text-[11px] text-slate-500 text-center pb-2">
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
    <div className="min-h-dvh w-full overflow-y-auto overflow-x-hidden pb-12 flex flex-col justify-between bg-slate-950 text-white p-4 sm:p-6 select-none relative">
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
              <span>{effectiveIdentity?.avatar || "🚀"}</span>
            </div>
            <div>
              <h4 className="text-base font-black text-white">{effectiveIdentity?.playerName}</h4>
              <p className="text-xs text-slate-300 font-bold">
                রোল: {effectiveIdentity?.roll || "—"}
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
              const isCurrent = p.id === effectiveIdentity?.playerId;
              return (
                <div
                  key={p.id || idx}
                  className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${isCurrent
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
        <div className="min-h-dvh w-full overflow-y-auto overflow-x-hidden pb-12 flex items-center justify-center bg-slate-950">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      }
    >
      <LiveQuizArenaContent />
    </Suspense>
  );
}
