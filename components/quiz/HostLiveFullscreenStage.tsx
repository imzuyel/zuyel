"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Play,
  ArrowRight,
  ArrowLeft,
  Eye,
  Clock,
  Users,
  Trophy,
  QrCode,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Sparkles,
  Loader2,
  Flag,
  Crown,
  Volume2,
  VolumeX,
  Zap,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PresentationSlide, isGradedQuiz } from "./UnifiedQuizMentimeterWorkspace";
import FloatingReactionOverlay from "./FloatingReactionOverlay";
import { RenderColorfulAvatar } from "./avatarData";
import { triggerFireworks } from "@/lib/confetti";
import {
  playJoinPop,
  playCountdownBeep,
  playTimerTick,
  playRevealChord,
  playPodiumFanfare,
  isSoundMuted,
  toggleSound,
} from "@/lib/quizSoundEffects";

export const KAHOOT_BLOCKS = [
  { hex: "#E21B3C", border: "border-rose-400", shape: "▲", label: "A" },
  { hex: "#1368CE", border: "border-blue-400", shape: "◆", label: "B" },
  { hex: "#D89E00", border: "border-amber-300", shape: "●", label: "C" },
  { hex: "#26890C", border: "border-emerald-400", shape: "■", label: "D" },
];

const WORD_CLOUD_GRADIENTS = [
  "from-rose-500 to-pink-600 shadow-rose-500/40 text-white",
  "from-indigo-500 to-violet-600 shadow-indigo-500/40 text-white",
  "from-emerald-500 to-teal-600 shadow-emerald-500/40 text-white",
  "from-amber-500 to-orange-600 shadow-amber-500/40 text-white",
  "from-cyan-500 to-blue-600 shadow-cyan-500/40 text-white",
  "from-fuchsia-500 to-purple-600 shadow-fuchsia-500/40 text-white",
];

interface HostLiveFullscreenStageProps {
  className?: string;
  tradeName?: string;
  subjectName?: string;
  subjectCode?: string;
  sessionId: string;
  sessionCode: string;
  deckTitle: string;
  slides: PresentationSlide[];
  scheduledStartTime?: string;
  onClose: () => void;
}

export default function HostLiveFullscreenStage({
  sessionId,
  sessionCode,
  deckTitle,
  slides,
  scheduledStartTime,
  onClose,
  className,
  tradeName,
  subjectName,
}: HostLiveFullscreenStageProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [stage, setStage] = useState<string>("READY_CHECK");
  const [stageEndsAt, setStageEndsAt] = useState<number>(() => Date.now() + 30000);
  const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);

  // Clean NaN-proof client countdown derived strictly from stageEndsAt
  const [displaySeconds, setDisplaySeconds] = useState<number>(20);

  // Modals & Controls
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(isSoundMuted());
  const [isAdvancingSlide, setIsAdvancingSlide] = useState(false);
  const [isFinalPodiumOpen, setIsFinalPodiumOpen] = useState(false);

  // Live Concurrency Telemetry
  const [players, setPlayers] = useState<any[]>([]);
  const [readyCount, setReadyCount] = useState<number>(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [liveOptionStats, setLiveOptionStats] = useState<number[]>([]);
  const [serverSubmittedCount, setServerSubmittedCount] = useState<number>(0);
  const [serverExplanation, setServerExplanation] = useState<string>("");

  // Join Notifications
  const [joinPopups, setJoinPopups] = useState<Array<{ id: string; name: string; avatar: string }>>([]);
  const prevPlayerIdsRef = useRef<string[]>([]);
  const prevCountdownBeepRef = useRef<number>(-1);
  const prevRevealStageRef = useRef<string>("");
  const autoSkippedRef = useRef<string>("");

  // Scheduled start optional countdown
  const [scheduledSecondsLeft, setScheduledSecondsLeft] = useState<number>(() => {
    if (!scheduledStartTime) return 0;
    const diff = Math.floor((new Date(scheduledStartTime).getTime() - Date.now()) / 1000);
    return Number.isFinite(diff) ? Math.max(0, diff) : 0;
  });

  useEffect(() => {
    if (scheduledSecondsLeft <= 0) return;
    const t = setInterval(() => {
      setScheduledSecondsLeft((p) => (p <= 1 ? 0 : p - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [scheduledSecondsLeft > 0]);

  const currentSlide = slides[currentSlideIndex] || slides[0] || ({} as PresentationSlide);
  const isCurrentGraded = isGradedQuiz(currentSlide?.type || "MCQ");
  const totalQuestionDuration = Math.max(5, Number(currentSlide?.timeLimit) || 20);

  // 1. Poll live session state cleanly (1000ms interval, skips when tab hidden)
  useEffect(() => {
    let isMounted = true;

    const pollState = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/state?playerId=HOST`);
        if (!res.ok) return;
        const sData = await res.json();
        if (!isMounted || !sData.success) return;

        // Server clock sync
        const sNow = Number(sData.serverNow || sData.serverTimestamp);
        if (Number.isFinite(sNow) && sNow > 0) {
          setServerOffsetMs(sNow - Date.now());
        }

        // Slide index sync
        if (
          typeof sData.currentSlideIndex === "number" &&
          Number.isFinite(sData.currentSlideIndex) &&
          sData.currentSlideIndex !== currentSlideIndex
        ) {
          setCurrentSlideIndex(sData.currentSlideIndex);
          autoSkippedRef.current = "";
        }

        // Stage & timestamp sync (never assign NaN)
        if (sData.stage) {
          setStage(String(sData.stage).toUpperCase());
        }
        const ends = Number(sData.stageEndsAt);
        if (Number.isFinite(ends) && ends > 0) {
          setStageEndsAt(ends);
        }

        // Players sync + animated arrival popup
        const currentPlayers = Array.isArray(sData.allPlayers || sData.players)
          ? sData.allPlayers || sData.players
          : [];
        setPlayers(currentPlayers);

        const currentIds = currentPlayers.map((p: any) => p.id);
        if (prevPlayerIdsRef.current.length > 0) {
          const arrivals = currentPlayers.filter((p: any) => !prevPlayerIdsRef.current.includes(p.id));
          if (arrivals.length > 0) {
            playJoinPop();
            arrivals.forEach((np: any) => {
              const popId = `join-${np.id}-${Date.now()}`;
              setJoinPopups((prev) => [
                ...prev.slice(-3),
                { id: popId, name: np.displayName || np.name || "শিক্ষার্থী", avatar: np.avatar || "🚀" },
              ]);
              setTimeout(() => {
                setJoinPopups((prev) => prev.filter((item) => item.id !== popId));
              }, 4000);
            });
          }
        }
        prevPlayerIdsRef.current = currentIds;

        if (typeof sData.readyCount === "number") setReadyCount(sData.readyCount);
        if (typeof sData.submittedCount === "number") setServerSubmittedCount(sData.submittedCount);
        if (Array.isArray(sData.optionStats)) setLiveOptionStats(sData.optionStats);
        if (sData.explanation) setServerExplanation(sData.explanation);

        // Fetch raw answers for Word Cloud / Open Ended cards
        if (["WORD_CLOUD", "OPEN_ENDED", "LIVE_QA"].includes((currentSlide?.type || "").toUpperCase())) {
          fetch(`/api/live-quizzes/sessions/${sessionId}/answers`)
            .then((r) => r.json())
            .then((aData) => {
              if (isMounted && aData.success && Array.isArray(aData.answers)) {
                setAnswers(aData.answers);
              }
            })
            .catch(() => {});
        }
      } catch {
        // safe polling guard
      }
    };

    pollState();
    const interval = setInterval(pollState, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [sessionId, currentSlideIndex, currentSlide?.type]);

  // 2. Single Source of Truth 100ms Client Countdown Timer
  // Depends ONLY on [stage, stageEndsAt, serverOffsetMs] — NEVER resets on ticks!
  useEffect(() => {
    const updateClock = () => {
      const target = Number(stageEndsAt);
      if (!Number.isFinite(target) || target <= 0) {
        setDisplaySeconds(0);
        return;
      }
      const adjustedNow = Date.now() + (Number.isFinite(serverOffsetMs) ? serverOffsetMs : 0);
      const rem = Math.max(0, Math.ceil((target - adjustedNow) / 1000));
      setDisplaySeconds(Number.isFinite(rem) ? rem : 0);

      // Sound effects triggers
      if (stage === "COUNTDOWN_321" && rem > 0 && prevCountdownBeepRef.current !== rem) {
        prevCountdownBeepRef.current = rem;
        playCountdownBeep(rem);
      }
      if (stage === "ANSWERING_ACTIVE" && rem > 0 && rem <= 5 && prevCountdownBeepRef.current !== rem) {
        prevCountdownBeepRef.current = rem;
        playTimerTick(rem <= 3);
      }

      // Failsafe: if COUNTDOWN_321 timer reaches 0 locally, ensure server advances cleanly
      const guardKey = `${currentSlideIndex}_${target}`;
      if (stage === "COUNTDOWN_321" && rem <= 0 && autoSkippedRef.current !== guardKey) {
        autoSkippedRef.current = guardKey;
        fetch(`/api/live-quizzes/sessions/${sessionId}/next`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "SKIP_COUNTDOWN", slideIndex: currentSlideIndex }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d?.success && d.stageEndsAt) {
              setStage(d.stage || "ANSWERING_ACTIVE");
              setStageEndsAt(Number(d.stageEndsAt));
            }
          })
          .catch(() => {});
      }
    };

    updateClock();
    const timer = setInterval(updateClock, 100);
    return () => clearInterval(timer);
  }, [stage, stageEndsAt, serverOffsetMs, sessionId, currentSlideIndex]);

  // Trigger reveal chord once when entering RESULT_REVEAL
  useEffect(() => {
    if (stage === "RESULT_REVEAL" && prevRevealStageRef.current !== `${currentSlideIndex}_REVEAL`) {
      prevRevealStageRef.current = `${currentSlideIndex}_REVEAL`;
      playRevealChord();
    }
  }, [stage, currentSlideIndex]);

  // 3. Host Stage Control Handlers
  const handleStartQuestion = async () => {
    setScheduledSecondsLeft(0);
    setIsAdvancingSlide(true);
    try {
      const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "START_SLIDE", slideIndex: currentSlideIndex }),
      });
      const data = await res.json();
      if (data?.success) {
        autoSkippedRef.current = "";
        setStage(data.stage || "COUNTDOWN_321");
        if (Number.isFinite(Number(data.stageEndsAt))) {
          setStageEndsAt(Number(data.stageEndsAt));
        }
      }
    } finally {
      setIsAdvancingSlide(false);
    }
  };

  const handleSkipCountdown = async () => {
    setScheduledSecondsLeft(0);
    setIsAdvancingSlide(true);
    try {
      const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SKIP_COUNTDOWN", slideIndex: currentSlideIndex }),
      });
      const data = await res.json();
      if (data?.success) {
        setStage("ANSWERING_ACTIVE");
        if (Number.isFinite(Number(data.stageEndsAt))) {
          setStageEndsAt(Number(data.stageEndsAt));
        }
      }
    } finally {
      setIsAdvancingSlide(false);
    }
  };

  const handleRevealResults = async () => {
    setIsAdvancingSlide(true);
    try {
      const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REVEAL_RESULTS" }),
      });
      const data = await res.json();
      if (data?.success) {
        setStage("RESULT_REVEAL");
      }
    } finally {
      setIsAdvancingSlide(false);
    }
  };

  const handleNextSlide = async () => {
    if (currentSlideIndex >= slides.length - 1) {
      await handleEndAndShowPodium();
      return;
    }
    const nextIdx = currentSlideIndex + 1;
    setIsAdvancingSlide(true);
    try {
      const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideIndex: nextIdx, autoStart: true }),
      });
      const data = await res.json();
      autoSkippedRef.current = "";
      setCurrentSlideIndex(nextIdx);
      if (data?.success) {
        setStage(data.stage || "COUNTDOWN_321");
        if (Number.isFinite(Number(data.stageEndsAt))) {
          setStageEndsAt(Number(data.stageEndsAt));
        }
      }
    } finally {
      setIsAdvancingSlide(false);
    }
  };

  const handlePrevSlide = async () => {
    if (currentSlideIndex <= 0) return;
    const prevIdx = currentSlideIndex - 1;
    setIsAdvancingSlide(true);
    try {
      const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideIndex: prevIdx }),
      });
      const data = await res.json();
      setCurrentSlideIndex(prevIdx);
      if (data?.success) {
        setStage(data.stage || "READY_CHECK");
      }
    } finally {
      setIsAdvancingSlide(false);
    }
  };

  const handleEndAndShowPodium = async () => {
    setIsFinalPodiumOpen(true);
    setStage("ENDED");
    triggerFireworks();
    playPodiumFanfare();
    try {
      await fetch(`/api/live-quizzes/sessions/${sessionId}/end-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch (e) {
      console.error("Archive failed:", e);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => null);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => null);
      setIsFullscreen(false);
    }
  };

  const joinOrigin = typeof window !== "undefined" ? window.location.host : "pgtsc.edu.bd";
  const fullJoinUrl =
    typeof window !== "undefined" ? `${window.location.origin}/quiz/join?code=${sessionCode}` : `/quiz/join?code=${sessionCode}`;

  const handleCopyJoinLink = () => {
    navigator.clipboard?.writeText(fullJoinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Top Ranked Leaderboard Players
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => (b.score || b.totalScore || 0) - (a.score || a.totalScore || 0));
  }, [players]);

  // Option Vote Breakdown (for Bar Chart)
  const optionBreakdown = useMemo(() => {
    const opts = Array.isArray(currentSlide?.options) ? currentSlide.options : [];
    const totalVotes = Math.max(
      1,
      liveOptionStats.reduce((sum, n) => sum + (Number(n) || 0), 0)
    );
    return opts.map((opt, idx) => {
      const votes = Number(liveOptionStats[idx] || 0);
      const percent = Math.round((votes / totalVotes) * 100);
      const isCorrect =
        currentSlide?.correctAnswer === idx ||
        String(currentSlide?.correctAnswer).trim().toLowerCase() === String(opt).trim().toLowerCase();
      return {
        text: String(opt),
        votes,
        percent,
        isCorrect,
        block: KAHOOT_BLOCKS[idx % KAHOOT_BLOCKS.length],
      };
    });
  }, [currentSlide, liveOptionStats]);

  // Word Cloud computation
  const wordCloudWords = useMemo(() => {
    const counts: Record<string, number> = {};
    const slideAnswers = answers.filter(
      (a) => String(a.questionId) === String(currentSlide?.id) || Number(a.slideIndex) === currentSlideIndex
    );
    slideAnswers.forEach((a) => {
      const txt = typeof a.answerPayload === "string" ? a.answerPayload.trim() : "";
      if (txt) counts[txt] = (counts[txt] || 0) + 1;
    });
    const max = Math.max(1, ...Object.values(counts));
    return Object.entries(counts).map(([word, count]) => ({
      word,
      count,
      ratio: count / max,
    }));
  }, [answers, currentSlide?.id, currentSlideIndex]);

  const safeRemaining = Number.isFinite(displaySeconds) ? Math.max(0, displaySeconds) : 0;
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringProgress = Math.min(1, Math.max(0, safeRemaining / totalQuestionDuration));
  const ringOffset = ringCircumference * (1 - ringProgress);

  const qType = (currentSlide?.type || "MCQ").toUpperCase();
  const questionHeading =
    (currentSlide as any)?.questionText || currentSlide?.title || (currentSlide as any)?.question || deckTitle;

  const isLobby =
    (stage === "READY_CHECK" || stage === "WELCOME_WAITING" || stage === "LOBBY") &&
    currentSlideIndex === 0 &&
    !isFinalPodiumOpen;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0B0F1E] text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Subtle Clean Kahoot/Mentimeter Gradient Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/3 w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 right-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px]" />
      </div>

      {/* =================================================================== */}
      {/* 1. CLEAN FULLSCREEN PROJECTOR TOP BAR (Zero ERP Clutter)            */}
      {/* =================================================================== */}
      <header className="relative z-20 px-5 sm:px-10 py-3.5 bg-[#121830]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
        {/* Left: Bold Join PIN Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/10 border border-white/15">
            <div className="text-xs sm:text-sm font-bold text-slate-300 hidden sm:block">
              জয়েন: <span className="text-white font-mono">{joinOrigin}/quiz/join</span>
            </div>
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-300 uppercase">PIN:</span>
              <span className="text-xl sm:text-2xl font-black font-mono tracking-[0.2em] text-amber-300">
                {sessionCode}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyJoinLink}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="লিংক কপি"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden md:inline">QR বড় করুন</span>
          </button>
        </div>

        {/* Center: Clean Title / Subject Badge */}
        <div className="hidden lg:flex items-center gap-2 text-sm font-bold text-slate-300 truncate max-w-md">
          <span>{deckTitle}</span>
          {subjectName && (
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-xs">
              {subjectName}
            </span>
          )}
        </div>

        {/* Right: Players Count + Sound + Fullscreen + Close */}
        <div className="flex items-center gap-2.5">
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>👥 {players.length} জন যুক্ত</span>
          </div>

          <button
            type="button"
            onClick={() => setSoundMuted(toggleSound())}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title={soundMuted ? "সাউন্ড চালু" : "সাউন্ড মিউট"}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-300" />}
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="ফুলস্ক্রিন টগল"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 text-rose-300 hover:text-white transition cursor-pointer"
            title="প্রজেক্টর বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Real-time Join Toast Popups */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {joinPopups.map((pop) => (
            <motion.div
              key={pop.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              className="px-4 py-2.5 rounded-2xl bg-[#161F3D] border-2 border-emerald-400 shadow-2xl flex items-center gap-3"
            >
              <RenderColorfulAvatar avatarId={pop.avatar} size="xs" showGlow={false} />
              <span className="text-sm font-black text-emerald-300">🎉 {pop.name} জয়েন করেছে!</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* =================================================================== */}
      {/* 2. CENTER FULLSCREEN PROJECTOR STAGE                                */}
      {/* =================================================================== */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-6 overflow-y-auto">
        {/* ----------------------------------------------------------------- */}
        {/* STAGE A: KAHOOT LOBBY SCREEN (High-Contrast PIN + QR + Players)   */}
        {/* ----------------------------------------------------------------- */}
        {isLobby && (
          <div className="w-full max-w-6xl mx-auto flex flex-col items-center space-y-8 text-center">
            {/* Giant PIN + Inline QR Hero Banner */}
            <div className="w-full p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/15 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="text-left space-y-2 flex-1">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ক্লাসরুম জয়েনিং পিন</span>
                </span>
                <div className="text-5xl sm:text-7xl md:text-8xl font-black font-mono tracking-[0.25em] text-white drop-shadow-[0_4px_20px_rgba(99,102,241,0.5)]">
                  {sessionCode}
                </div>
                <p className="text-sm sm:text-base text-slate-300 font-semibold">
                  ভিজিট করো: <span className="text-cyan-300 font-mono font-bold">{joinOrigin}/quiz/join</span> অথবা QR স্ক্যান করো
                </p>
              </div>

              {/* Clean QR Card inside Lobby */}
              <div className="p-3 bg-white rounded-2xl shadow-2xl shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(fullJoinUrl)}`}
                  alt="Join QR Code"
                  className="w-36 h-36 sm:w-40 sm:h-40 rounded-lg"
                />
              </div>
            </div>

            {/* Live Joined Counter + Start CTA */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <motion.div
                key={players.length}
                initial={{ scale: 0.92 }}
                animate={{ scale: 1 }}
                className="px-6 py-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200 font-black text-xl sm:text-2xl flex items-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.25)]"
              >
                <Users className="w-6 h-6 text-emerald-400" />
                <span>👥 {players.length} জন যুক্ত হয়েছে</span>
                {readyCount > 0 && (
                  <span className="text-sm bg-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono">
                    ({readyCount} প্রস্তুত)
                  </span>
                )}
              </motion.div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                disabled={isAdvancingSlide}
                onClick={handleStartQuestion}
                className="px-8 sm:px-12 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xl sm:text-2xl shadow-[0_0_45px_rgba(16,185,129,0.55)] flex items-center gap-3 cursor-pointer"
              >
                {isAdvancingSlide ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Play className="w-7 h-7 fill-slate-950" />
                )}
                <span>🚀 কুইজ শুরু করুন (Start)</span>
              </motion.button>

              <button
                type="button"
                onClick={handleSkipCountdown}
                className="px-5 py-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-black text-sm sm:text-base flex items-center gap-2 cursor-pointer transition"
              >
                <Zap className="w-5 h-5 text-amber-400" />
                <span>⚡ এখনই প্রশ্ন দেখান</span>
              </button>
            </div>

            {/* Bouncing 3D Student Avatar Cloud */}
            <div className="w-full min-h-[160px] max-h-60 overflow-y-auto p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-center gap-3">
              {players.length === 0 ? (
                <p className="text-slate-400 text-base font-bold animate-pulse">
                  শিক্ষার্থীরা মোবাইলে PIN ({sessionCode}) দিলে তাদের নাম ও অবতার এখানে ভেসে উঠবে...
                </p>
              ) : (
                players.map((p, idx) => (
                  <motion.div
                    key={p.id || idx}
                    initial={{ scale: 0, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: [0, idx % 2 === 0 ? -5 : 5, 0] }}
                    transition={{
                      y: { duration: 2.2 + (idx % 3) * 0.3, repeat: Infinity, ease: "easeInOut" },
                      type: "spring",
                      stiffness: 320,
                      damping: 20,
                    }}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#1A2342] border border-indigo-400/30 shadow-lg"
                  >
                    <RenderColorfulAvatar avatarId={p.avatar} size="xs" showGlow={false} />
                    <span className="text-sm sm:text-base font-black text-white">{p.displayName || p.name}</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* STAGE B: 3-2-1 COUNTDOWN SCREEN (Zero Stuck Countdown Guarantee)  */}
        {/* ----------------------------------------------------------------- */}
        {!isLobby && !isFinalPodiumOpen && stage === "COUNTDOWN_321" && (
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <motion.div
              key={safeRemaining}
              initial={{ scale: 2.2, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 360, damping: 20 }}
              className="relative w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center"
            >
              {/* Geometric Rotating Pulse Frame */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-[#E21B3C] via-[#1368CE] to-[#26890C] opacity-80 blur-sm"
              />
              <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-[2.2rem] bg-[#121830] border-4 border-white/30 flex items-center justify-center shadow-2xl">
                <span className="text-8xl sm:text-9xl font-black font-mono text-white">
                  {safeRemaining > 0 ? safeRemaining : "GO!"}
                </span>
              </div>
            </motion.div>

            <h2 className="text-2xl sm:text-4xl font-black text-cyan-300 tracking-wide">
              প্রশ্ন {currentSlideIndex + 1} আসছে! প্রস্তুত হও...
            </h2>

            <button
              type="button"
              onClick={handleSkipCountdown}
              className="px-6 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 text-amber-300 font-black text-sm flex items-center gap-2 cursor-pointer transition"
            >
              <Zap className="w-4 h-4" />
              <span>⚡ এখনই প্রশ্ন দেখান (Skip)</span>
            </button>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* STAGE C: READY_CHECK ON SUBSEQUENT SLIDES (Quick Start Trigger)   */}
        {/* ----------------------------------------------------------------- */}
        {!isLobby && !isFinalPodiumOpen && (stage === "READY_CHECK" || stage === "WELCOME_WAITING") && (
          <div className="max-w-3xl mx-auto text-center space-y-6 p-10 rounded-3xl bg-white/5 border border-white/15 backdrop-blur-xl">
            <span className="px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-sm">
              পরবর্তী প্রশ্ন {currentSlideIndex + 1} / {slides.length}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-snug">
              শিক্ষার্থীরা প্রস্তুত হলে শুরু করুন
            </h2>
            <div className="flex justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleStartQuestion}
                className="px-10 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xl flex items-center gap-2 cursor-pointer shadow-xl"
              >
                <Play className="w-6 h-6 fill-slate-950" />
                <span>🚀 প্রশ্ন শুরু করুন</span>
              </button>
              <button
                type="button"
                onClick={handleSkipCountdown}
                className="px-6 py-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 text-amber-300 font-black text-base flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-5 h-5" />
                <span>⚡ সরাসরি চালু</span>
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* STAGE D: ACTIVE QUESTION SCREEN (Kahoot + Mentimeter Projector)   */}
        {/* ----------------------------------------------------------------- */}
        {!isLobby &&
          !isFinalPodiumOpen &&
          (stage === "ANSWERING_ACTIVE" || stage === "QUESTION_ONLY") && (
            <div className="w-full max-w-6xl mx-auto flex flex-col justify-between h-full space-y-6">
              {/* Top Row: Circular Timer (Left) + Question Number + Live Answer Counter (Right) */}
              <div className="flex items-center justify-between gap-6">
                {/* Circular Animated Countdown Timer */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r={ringRadius}
                      fill="transparent"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={ringRadius}
                      fill="transparent"
                      stroke={safeRemaining <= 5 ? "#E21B3C" : "#38BDF8"}
                      strokeWidth="10"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      strokeLinecap="round"
                      className="transition-all duration-100"
                    />
                  </svg>
                  <span
                    className={`absolute text-3xl sm:text-4xl font-black font-mono ${
                      safeRemaining <= 5 ? "text-rose-400 animate-pulse" : "text-white"
                    }`}
                  >
                    {safeRemaining}
                  </span>
                </div>

                {/* Center Slide Pill */}
                <div className="px-5 py-2 rounded-full bg-white/10 border border-white/15 text-sm sm:text-base font-black tracking-wide">
                  প্রশ্ন {currentSlideIndex + 1} / {slides.length}
                </div>

                {/* Live Answers Counter (Right) */}
                <div className="px-6 py-4 rounded-3xl bg-[#161F3D] border-2 border-indigo-400/50 text-center shrink-0 shadow-xl">
                  <div className="text-3xl sm:text-4xl font-black font-mono text-cyan-300">
                    {serverSubmittedCount} <span className="text-lg text-slate-400">/ {players.length}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-300">জমা হওয়া উত্তর</div>
                </div>
              </div>

              {/* Giant Centered Question Text */}
              <div className="flex-1 flex flex-col items-center justify-center px-4 text-center space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight max-w-5xl drop-shadow-md">
                  {questionHeading}
                </h1>
                {currentSlide?.content && qType === "TEXT_SLIDE" && (
                  <p className="text-xl sm:text-2xl text-indigo-100 max-w-4xl leading-relaxed">
                    {currentSlide.content}
                  </p>
                )}
              </div>

              {/* Kahoot Iconic Color-Coded Option Blocks */}
              {qType === "MCQ" && Array.isArray(currentSlide?.options) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pb-2">
                  {currentSlide.options.map((opt, idx) => {
                    const blk = KAHOOT_BLOCKS[idx % KAHOOT_BLOCKS.length];
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{ backgroundColor: blk.hex }}
                        className="p-5 sm:p-6 rounded-2xl shadow-xl border-b-4 border-black/30 flex items-center gap-4 min-h-[88px]"
                      >
                        <div className="w-12 h-12 rounded-xl bg-black/25 flex items-center justify-center text-2xl sm:text-3xl font-black shrink-0">
                          {blk.shape}
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-white leading-snug">
                          {String(opt)}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {qType === "TRUE_FALSE" && (
                <div className="grid grid-cols-2 gap-6 w-full pb-2">
                  <div
                    style={{ backgroundColor: "#26890C" }}
                    className="p-8 rounded-3xl border-b-4 border-black/30 flex items-center justify-center gap-4 text-3xl sm:text-4xl font-black"
                  >
                    <span>✓ সত্য (True)</span>
                  </div>
                  <div
                    style={{ backgroundColor: "#E21B3C" }}
                    className="p-8 rounded-3xl border-b-4 border-black/30 flex items-center justify-center gap-4 text-3xl sm:text-4xl font-black"
                  >
                    <span>✗ মিথ্যা (False)</span>
                  </div>
                </div>
              )}

              {qType === "WORD_CLOUD" && (
                <div className="p-8 rounded-3xl bg-white/5 border border-white/15 min-h-[240px] flex flex-wrap items-center justify-center gap-4">
                  {wordCloudWords.length === 0 ? (
                    <p className="text-slate-400 text-lg font-bold">শিক্ষার্থীদের শব্দের অপেক্ষায়...</p>
                  ) : (
                    wordCloudWords.map((w, idx) => (
                      <motion.div
                        key={`${w.word}-${idx}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`px-6 py-3 rounded-full bg-gradient-to-r ${WORD_CLOUD_GRADIENTS[idx % WORD_CLOUD_GRADIENTS.length]} text-xl sm:text-3xl font-black`}
                      >
                        {w.word} {w.count > 1 && <span className="text-sm opacity-80">×{w.count}</span>}
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {(qType === "OPEN_ENDED" || qType === "LIVE_QA") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                  {answers.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-slate-400 text-lg font-bold flex flex-col items-center gap-2">
                      <MessageSquare className="w-8 h-8" />
                      <span>শিক্ষার্থীদের মতামতের অপেক্ষায়...</span>
                    </div>
                  ) : (
                    answers.map((r, i) => (
                      <div key={r.id || i} className="p-4 rounded-2xl bg-white/10 border border-white/15">
                        <div className="text-xs font-bold text-cyan-300 mb-1">{r.playerName || "শিক্ষার্থী"}</div>
                        <div className="text-base font-bold text-white">{String(r.answerPayload)}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

        {/* ----------------------------------------------------------------- */}
        {/* STAGE E: MENTIMETER BAR CHART REVEAL (Option Breakdown + Check)   */}
        {/* ----------------------------------------------------------------- */}
        {!isLobby && !isFinalPodiumOpen && stage === "RESULT_REVEAL" && (
          <div className="w-full max-w-6xl mx-auto flex flex-col space-y-6">
            <h2 className="text-2xl sm:text-4xl font-black text-center text-white leading-snug">
              {questionHeading}
            </h2>

            {qType === "MCQ" && optionBreakdown.length > 0 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/15 backdrop-blur-xl space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 items-end min-h-[260px] pt-6">
                  {optionBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col items-center h-full justify-end gap-3 transition-all ${
                        item.isCorrect ? "opacity-100 scale-105" : "opacity-45"
                      }`}
                    >
                      {/* Vote Count + Check */}
                      <div className="flex items-center gap-1.5 font-mono font-black text-lg sm:text-2xl">
                        {item.isCorrect && (
                          <span className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </span>
                        )}
                        <span>{item.votes}</span>
                        <span className="text-xs text-slate-400">({item.percent}%)</span>
                      </div>

                      {/* Vertical Animated Column */}
                      <div className="w-full h-44 rounded-2xl bg-black/30 border border-white/10 flex items-end p-1.5 overflow-hidden">
                        <motion.div
                          initial={{ height: "0%" }}
                          animate={{ height: `${Math.max(8, item.percent)}%` }}
                          transition={{ duration: 0.65, ease: "easeOut" }}
                          style={{ backgroundColor: item.block.hex }}
                          className={`w-full rounded-xl flex items-center justify-center font-black text-2xl ${
                            item.isCorrect ? "ring-4 ring-white shadow-2xl" : ""
                          }`}
                        >
                          {item.block.shape}
                        </motion.div>
                      </div>

                      {/* Option Caption */}
                      <div className="text-center font-bold text-sm sm:text-base line-clamp-2 text-white">
                        {item.text}
                      </div>
                    </div>
                  ))}
                </div>

                {(currentSlide?.explanation || serverExplanation) && (
                  <div className="p-4 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-sm sm:text-base text-indigo-100 text-center font-semibold">
                    💡 <strong className="text-white">ব্যাখ্যা:</strong> {currentSlide?.explanation || serverExplanation}
                  </div>
                )}
              </div>
            )}

            {/* Quick Top 3 Snapshot after Question Reveal */}
            {sortedPlayers.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {sortedPlayers.slice(0, 3).map((p, i) => (
                  <div
                    key={p.id || i}
                    className="p-3.5 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{i === 0 ? "👑" : i === 1 ? "🥈" : "🥉"}</span>
                      <span className="font-black text-white">{p.displayName || p.name}</span>
                    </div>
                    <span className="font-mono font-black text-amber-300">{p.score || p.totalScore || 0} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* STAGE F: CELEBRATORY 3D PODIUM & FINAL LEADERBOARD                */}
        {/* ----------------------------------------------------------------- */}
        {(isFinalPodiumOpen || stage === "ENDED" || stage === "LEADERBOARD_VIEW" || qType === "LEADERBOARD") && (
          <div className="w-full max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-black text-sm uppercase tracking-wider">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>{stage === "ENDED" || isFinalPodiumOpen ? "চূড়ান্ত বিজয়ী পডিয়াম" : "লাইভ লিডারবোর্ড"}</span>
            </div>

            {/* Top 3 3D Podium */}
            <div className="flex items-end justify-center gap-4 sm:gap-8 pt-6">
              {/* 2nd Place */}
              {sortedPlayers[1] && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="flex flex-col items-center"
                >
                  <span className="text-4xl mb-1">🥈</span>
                  <span className="text-base sm:text-xl font-black text-white">{sortedPlayers[1].displayName || sortedPlayers[1].name}</span>
                  <span className="text-sm font-mono font-bold text-cyan-300">{sortedPlayers[1].score || sortedPlayers[1].totalScore || 0} pts</span>
                  <div className="w-28 sm:w-40 h-36 rounded-t-3xl bg-gradient-to-t from-slate-800 to-slate-600 border-t-4 border-slate-300 flex items-center justify-center text-4xl font-black mt-3">
                    2
                  </div>
                </motion.div>
              )}

              {/* 1st Place */}
              {sortedPlayers[0] ? (
                <motion.div
                  initial={{ y: 70, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35, type: "spring" }}
                  className="flex flex-col items-center"
                >
                  <Crown className="w-10 h-10 text-amber-400 mb-1 animate-bounce" />
                  <span className="text-xl sm:text-2xl font-black text-amber-300">{sortedPlayers[0].displayName || sortedPlayers[0].name}</span>
                  <span className="text-base font-mono font-black text-amber-200">{sortedPlayers[0].score || sortedPlayers[0].totalScore || 0} pts</span>
                  <div className="w-32 sm:w-48 h-48 rounded-t-3xl bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400 text-slate-950 border-t-4 border-yellow-200 flex items-center justify-center text-5xl font-black mt-3 shadow-[0_0_50px_rgba(245,158,11,0.45)]">
                    1
                  </div>
                </motion.div>
              ) : (
                <p className="text-slate-400 font-bold py-12">কোনো অংশগ্রহণকারী স্কোর পাওয়া যায়নি</p>
              )}

              {/* 3rd Place */}
              {sortedPlayers[2] && (
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="flex flex-col items-center"
                >
                  <span className="text-4xl mb-1">🥉</span>
                  <span className="text-base sm:text-xl font-black text-white">{sortedPlayers[2].displayName || sortedPlayers[2].name}</span>
                  <span className="text-sm font-mono font-bold text-cyan-300">{sortedPlayers[2].score || sortedPlayers[2].totalScore || 0} pts</span>
                  <div className="w-28 sm:w-40 h-28 rounded-t-3xl bg-gradient-to-t from-amber-950 to-amber-800 border-t-4 border-amber-500 flex items-center justify-center text-4xl font-black mt-3">
                    3
                  </div>
                </motion.div>
              )}
            </div>

            {/* Full Leaderboard List (#4+) */}
            {sortedPlayers.length > 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-2 text-left">
                {sortedPlayers.slice(3).map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between text-sm font-bold"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-slate-400">#{idx + 4}</span>
                      <RenderColorfulAvatar avatarId={p.avatar} size="xs" showGlow={false} />
                      <span className="text-white truncate">{p.displayName || p.name}</span>
                    </div>
                    <span className="font-mono text-amber-300">{p.score || p.totalScore || 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* 3. SLEEK FLOATING HOST PRESENTER DOCK                               */}
      {/* =================================================================== */}
      <footer className="relative z-20 px-6 py-4 flex items-center justify-center shrink-0">
        <div className="px-4 py-2.5 rounded-2xl bg-[#121830]/95 border border-white/15 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            disabled={currentSlideIndex === 0 || isAdvancingSlide}
            onClick={handlePrevSlide}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>পূর্ববর্তী</span>
          </button>

          <span className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 font-mono text-xs font-black text-indigo-300">
            {currentSlideIndex + 1} / {slides.length}
          </span>

          {stage === "ANSWERING_ACTIVE" && isCurrentGraded && (
            <button
              type="button"
              onClick={handleRevealResults}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>উত্তর দেখান</span>
            </button>
          )}

          <button
            type="button"
            disabled={isAdvancingSlide}
            onClick={handleNextSlide}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            {isAdvancingSlide ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{currentSlideIndex >= slides.length - 1 ? "🏆 সমাপ্তি ও পডিয়াম" : "পরবর্তী প্রশ্ন"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleEndAndShowPodium}
            className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/40 text-rose-200 text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <Flag className="w-4 h-4" />
            <span>সমাপ্ত ও MySQL আর্কাইভ</span>
          </button>
        </div>
      </footer>

      {/* Giant Expandable QR Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#121830] border border-white/20 rounded-3xl p-6 text-center space-y-4 relative shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black text-white">📱 স্ক্যান করে জয়েন করুন</h3>
              <div className="p-4 bg-white rounded-2xl inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(fullJoinUrl)}`}
                  alt="Large QR Code"
                  className="w-56 h-56"
                />
              </div>
              <div className="text-3xl font-black font-mono tracking-[0.2em] text-amber-300">
                {sessionCode}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FloatingReactionOverlay />
    </div>
  );
}
