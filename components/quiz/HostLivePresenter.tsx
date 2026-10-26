"use client";

import React, { useState, useMemo } from "react";
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Award,
  HelpCircle,
  Flame,
  Zap,
  BarChart3,
  Flag,
  Play,
  RotateCcw,
  ShieldCheck,
  Trophy,
  MessageSquare,
  Layers,
  Sparkles,
  Loader2,
  X,
  ZoomIn,
  Smile,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import FloatingReactionOverlay, { emitLiveReaction } from "./FloatingReactionOverlay";

export interface PresenterQuestion {
  id: number | string;
  question: string;
  options: string[];
  correctAnswer: number; // 0, 1, 2, or 3
  explanation?: string;
  timeLimit?: number;
}

export interface PresenterSlide {
  id: string;
  type: string;
  questionText: string;
  options: string[];
  explanation?: string;
  expectedAnswerKeyword?: string;
  responses?: Array<{
    playerId?: string;
    playerName?: string;
    avatar?: string;
    response: string;
    color?: string;
    mood?: string;
    submittedAt?: string;
  }>;
  metadata?: {
    tradeName?: string;
    className?: string;
    teacherNote?: string;
    topic?: string;
    [key: string]: any;
  };
}

interface HostLivePresenterProps {
  mode: "presentation" | "quiz";
  slide?: PresenterSlide;
  slideIndex?: number;
  totalSlides?: number;
  question?: PresenterQuestion;
  questionIndex?: number; // 0-based
  totalQuestions?: number;
  timeLeft: number;
  totalTime: number;
  submittedCount: number;
  totalPlayers: number;
  isAnswerRevealed: boolean;
  optionStats: number[]; // Count of players who selected [option 0, 1, 2, 3]
  soundEnabled: boolean;
  onToggleSound: () => void;
  onShowResults: () => void;
  onNextQuestion: () => void;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  onStartQuiz?: () => void;
  onShowLeaderboard?: () => void;
  onEndQuiz: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

// Kahoot-style vibrant colors and iconic shapes
const KAHOOT_STYLES = [
  {
    key: "red",
    shape: "▲",
    shapeName: "ত্রিভুজ",
    bgClass: "bg-red-600 hover:bg-red-500",
    borderClass: "border-red-500",
    ringClass: "ring-red-400",
    glowClass: "shadow-[0_0_35px_rgba(239,68,68,0.4)]",
    cardBg: "from-red-600/90 to-rose-700/90",
    badgeBg: "bg-red-700/80 text-white",
    barColor: "bg-red-500",
    accentText: "text-red-300"
  },
  {
    key: "blue",
    shape: "◆",
    shapeName: "রম্বস",
    bgClass: "bg-blue-600 hover:bg-blue-500",
    borderClass: "border-blue-500",
    ringClass: "ring-blue-400",
    glowClass: "shadow-[0_0_35px_rgba(59,130,246,0.4)]",
    cardBg: "from-blue-600/90 to-indigo-700/90",
    badgeBg: "bg-blue-700/80 text-white",
    barColor: "bg-blue-500",
    accentText: "text-blue-300"
  },
  {
    key: "yellow",
    shape: "●",
    shapeName: "বৃত্ত",
    bgClass: "bg-amber-500 hover:bg-amber-400",
    borderClass: "border-amber-400",
    ringClass: "ring-amber-300",
    glowClass: "shadow-[0_0_35px_rgba(245,158,11,0.4)]",
    cardBg: "from-amber-500/90 to-yellow-600/90",
    badgeBg: "bg-amber-700/80 text-white",
    barColor: "bg-amber-400",
    accentText: "text-amber-200"
  },
  {
    key: "green",
    shape: "■",
    shapeName: "চতুর্ভুজ",
    bgClass: "bg-emerald-600 hover:bg-emerald-500",
    borderClass: "border-emerald-500",
    ringClass: "ring-emerald-400",
    glowClass: "shadow-[0_0_35px_rgba(16,185,129,0.4)]",
    cardBg: "from-emerald-600/90 to-teal-700/90",
    badgeBg: "bg-emerald-700/80 text-white",
    barColor: "bg-emerald-500",
    accentText: "text-emerald-300"
  }
];

export default function HostLivePresenter({
  mode,
  slide,
  slideIndex = 0,
  totalSlides = 0,
  question,
  questionIndex = 0,
  totalQuestions = 0,
  timeLeft,
  totalTime,
  submittedCount,
  totalPlayers,
  isAnswerRevealed,
  optionStats = [0, 0, 0, 0],
  soundEnabled,
  onToggleSound,
  onShowResults,
  onNextQuestion,
  onNextSlide,
  onPrevSlide,
  onStartQuiz,
  onShowLeaderboard,
  onEndQuiz,
  onToggleFullscreen,
  isFullscreen = false
}: HostLivePresenterProps) {
  // Timer bar calculation
  const safeTotalTime = Math.max(totalTime, 1);
  const timePercent = Math.max(0, Math.min(100, (timeLeft / safeTotalTime) * 100));

  // Determine timer bar color gradient based on urgency
  const timerGradient = useMemo(() => {
    if (timePercent > 50) return "from-cyan-500 via-blue-500 to-indigo-500";
    if (timePercent > 25) return "from-amber-500 via-orange-500 to-amber-600";
    return "from-red-600 via-rose-500 to-red-600 animate-pulse";
  }, [timePercent]);

  // Submission percentage
  const effectiveTotalPlayers = Math.max(totalPlayers, 1);
  const submissionPercent = Math.min(100, Math.round((submittedCount / effectiveTotalPlayers) * 100));

  // Highest vote count for scaling the bar chart
  const maxVotes = Math.max(...optionStats, 1);

  // Fullscreen 3-2-1 Kahoot Countdown state
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isStartingQuiz, setIsStartingQuiz] = useState<boolean>(false);

  // Spotlight Zoom Modal for Whiteboard Sticky Notes
  const [spotlightNote, setSpotlightNote] = useState<{
    text: string;
    playerName: string;
    avatar: string;
    color: string;
  } | null>(null);

  // Trigger 3-2-1 Kahoot Fullscreen Countdown
  const handleLaunchScoredQuiz = () => {
    setIsStartingQuiz(true);
    setCountdownValue(3);
    const timer = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            setCountdownValue(null);
            setIsStartingQuiz(false);
            if (onStartQuiz) onStartQuiz();
          }, 600);
          return 0; // 🚀 কুইজ শুরু!
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Mentimeter slide type checks
  const rawType = (slide?.type || "").toUpperCase();
  const isWordCloud = rawType === "WORD_CLOUD" || rawType === "WORDCLOUD";
  const isMoodCheckin = rawType === "MOOD_CHECKIN" || rawType === "MOOD";
  const isStickyWall = rawType === "STICKY_WALL" || rawType === "OPEN_FEEDBACK" || rawType === "OPEN_ENDED";
  const isOpinionPoll = rawType === "OPINION_POLL" || rawType === "POLL";
  const isIntroSlide = rawType === "INTRO_SLIDE" || rawType === "WELCOME_INTRO";

  // 1. Process Word Cloud Words & Dynamic Frequency
  const wordCloudData = useMemo(() => {
    if (!isWordCloud) return [];
    const counts: Record<string, number> = {};
    const fromResponses = (slide?.responses || []).flatMap((r) =>
      String(r.response || "")
        .split(/[,;\s]+/)
        .map((w) => w.trim())
        .filter(Boolean)
    );
    const sourceWords =
      fromResponses.length > 0
        ? fromResponses
        : (slide?.options && slide.options.length > 0
            ? slide.options
            : ["উদ্ভাবন", "প্রযুক্তি", "ভবিষ্যৎ", "দক্ষতা", "পরিশ্রম", "আইওটি", "ইঞ্জিনিয়ারিং", "সততা"]);

    sourceWords.forEach((w) => {
      counts[w] = (counts[w] || 0) + 1;
    });

    const maxCount = Math.max(1, ...Object.values(counts));
    return Object.entries(counts).map(([word, count]) => ({
      word,
      count,
      ratio: count / maxCount,
    }));
  }, [slide, isWordCloud]);

  // 2. Process Mood & Energy Check-In Radar
  const moodRadarData = useMemo(() => {
    const moods = [
      { id: "fire", label: "সুপার এনার্জেটিক", emoji: "🔥", count: 0, gradient: "from-amber-500 to-red-600", border: "border-amber-500/60" },
      { id: "happy", label: "বেশ ভালো", emoji: "😊", count: 0, gradient: "from-emerald-400 to-teal-500", border: "border-emerald-500/60" },
      { id: "thinking", label: "একটু চিন্তিত", emoji: "🤔", count: 0, gradient: "from-blue-400 to-indigo-500", border: "border-blue-500/60" },
      { id: "tired", label: "ক্লান্ত", emoji: "😴", count: 0, gradient: "from-purple-400 to-pink-500", border: "border-purple-500/60" },
    ];

    const responses = slide?.responses || [];
    responses.forEach((r) => {
      const resp = String(r.response || "").toLowerCase();
      const moodVal = String(r.mood || "").toLowerCase();
      if (resp.includes("fire") || resp.includes("এনার্জেটিক") || moodVal.includes("fire") || resp.includes("🔥")) {
        moods[0].count += 1;
      } else if (resp.includes("happy") || resp.includes("ভালো") || moodVal.includes("happy") || resp.includes("😊")) {
        moods[1].count += 1;
      } else if (resp.includes("thinking") || resp.includes("চিন্তিত") || moodVal.includes("thinking") || resp.includes("🤔")) {
        moods[2].count += 1;
      } else if (resp.includes("tired") || resp.includes("ক্লান্ত") || moodVal.includes("tired") || resp.includes("😴")) {
        moods[3].count += 1;
      } else {
        moods[1].count += 1;
      }
    });

    const total = Math.max(1, responses.length);
    return moods.map((m) => ({
      ...m,
      percent: responses.length > 0 ? Math.round((m.count / total) * 100) : 0,
    }));
  }, [slide]);

  // 3. Process Collaborative Sticky Notes
  const stickyNotesData = useMemo(() => {
    const responses = slide?.responses || [];
    if (responses.length > 0) {
      return responses.map((r, i) => ({
        id: `note-${i}`,
        text: r.response,
        playerName: r.playerName || "শিক্ষার্থী",
        avatar: r.avatar || ["🐧", "💻", "⚡", "🌟", "🚀"][i % 5],
        color: r.color || ["amber", "rose", "cyan", "emerald"][i % 4],
      }));
    }
    // Fallback notes if waiting for first response
    return (slide?.options && slide.options.length > 0 ? slide.options : [
      "আজকের প্র্যাকটিক্যাল ল্যাব সেশনটি অনেক কার্যকরী ও আকর্ষণীয়!",
      "নেটওয়ার্কিং ও সার্কিট এনালাইসিস আরও গভীরভাবে শিখতে চাই।",
      "ইলেকট্রনিক্স প্রজেক্টে হ্যান্ডস-অন কাজের সুযোগ পেলে দারুণ হতো।"
    ]).map((text, i) => ({
      id: `fallback-${i}`,
      text,
      playerName: `শিক্ষার্থী ${i + 1}`,
      avatar: ["🐧", "💻", "⚡"][i % 3],
      color: ["amber", "rose", "cyan", "emerald"][i % 4],
    }));
  }, [slide]);

  // 4. Process Live Opinion Poll Bars
  const opinionPollData = useMemo(() => {
    const options = slide?.options && slide.options.length > 0 ? slide.options : ["পছন্দ ক", "পছন্দ খ", "পছন্দ গ", "পছন্দ ঘ"];
    const counts = options.map(() => 0);
    const responses = slide?.responses || [];

    responses.forEach((r) => {
      const idx = parseInt(r.response);
      if (!isNaN(idx) && idx >= 0 && idx < counts.length) {
        counts[idx] += 1;
      } else {
        const textIdx = options.findIndex((opt) => opt.trim() === String(r.response).trim());
        if (textIdx >= 0) counts[textIdx] += 1;
      }
    });

    const totalVotes = Math.max(1, responses.length);
    const gradients = [
      "from-cyan-500 to-blue-600",
      "from-pink-500 to-rose-600",
      "from-amber-500 to-orange-600",
      "from-emerald-500 to-teal-600",
    ];

    return options.map((opt, i) => ({
      text: opt,
      votes: counts[i],
      percent: responses.length > 0 ? Math.round((counts[i] / totalVotes) * 100) : 0,
      gradient: gradients[i % gradients.length],
    }));
  }, [slide]);

  // Cloud Kinetic Typography Component
  const CloudKineticTypography = ({ text }: { text: string }) => {
    const words = (text || "").split(" ");
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-5xl mx-auto">
        {words.map((word, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)", y: 20 }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
            transition={{
              duration: 0.8,
              delay: i * 0.1,
              ease: [0.2, 0.65, 0.3, 0.9],
            }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white via-indigo-100 to-indigo-300 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          >
            {word}
          </motion.span>
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-white flex flex-col justify-between overflow-x-hidden select-none font-sans">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-indigo-900/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 right-1/4 w-[600px] h-[600px] bg-purple-900/15 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-20" />
        
        {/* Animated Clouds/Bubbles in background for presentation mode */}
        {mode === "presentation" && (
          <>
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/4 left-1/10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, -120, 0],
                y: [0, -70, 0],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-1/4 right-1/10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl"
            />
          </>
        )}
      </div>

      {/* TOP HEADER: Status, Timer Bar, Live Submission Counter */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-3.5 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Index Badge */}
          <div className="flex items-center gap-3">
            <div className={`px-3.5 py-1.5 rounded-xl text-white text-xs sm:text-sm font-black tracking-wider uppercase shadow-lg flex items-center gap-2 ${
              mode === "presentation" ? "bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-600/30" : "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-600/30"
            }`}>
              {mode === "presentation" ? (
                <>
                  <Layers className="w-4 h-4 text-white" />
                  <span>প্রেজেন্টেশন {slideIndex + 1} / {totalSlides}</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>প্রশ্ন {questionIndex + 1} / {totalQuestions}</span>
                </>
              )}
            </div>

            {mode === "quiz" && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>সময় বরাদ্দ: {safeTotalTime} সেকেন্ড</span>
              </div>
            )}
          </div>

          {/* Center: Large Countdown Timer Display (Only Quiz) */}
          {mode === "quiz" && (
            <div className="flex items-center gap-3">
              <div className={`px-4 py-1.5 rounded-2xl border flex items-center gap-2 transition-all ${
                timeLeft <= 5 && !isAnswerRevealed
                  ? "bg-red-950/80 border-red-500/80 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse"
                  : "bg-slate-800/80 border-slate-700 text-white"
              }`}>
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xl sm:text-2xl font-black tracking-tight">
                  {isAnswerRevealed ? "সময় সমাপ্ত" : `${timeLeft}s`}
                </span>
              </div>
            </div>
          )}

          {/* Right: Live Submission Counter & Host Quick Controls */}
          <div className="flex items-center gap-2.5">
            {/* Live Student Submission Progress */}
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
              <Users className="w-4 h-4 text-emerald-400" />
              <div className="text-right">
                <div className="text-xs font-black text-emerald-300">
                  {totalPlayers} জন যুক্ত আছে
                </div>
              </div>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled
                  ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300 shadow-sm"
                  : "bg-slate-800 border-slate-700 text-slate-500 dark:text-slate-400"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Fullscreen Toggle */}
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Countdown Bar below Header (Only Quiz) */}
        {mode === "quiz" && (
          <div className="w-full h-1.5 bg-slate-800/80 mt-2.5 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${timerGradient}`}
              initial={{ width: "100%" }}
              animate={{ width: `${isAnswerRevealed ? 0 : timePercent}%` }}
              transition={{ ease: "linear", duration: 0.5 }}
            />
          </div>
        )}
      </header>

      {/* CENTER: Presentation Canvas or Quiz Question */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {mode === "presentation" && slide ? (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-12"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-bold uppercase tracking-widest"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{slide.type.replace("_", " ")}</span>
                </motion.div>
                
                <CloudKineticTypography text={slide.questionText} />
              </div>

              {/* MENTIMETER SPECIALIZED INTERACTIVE WARMUP & WHITEBOARD TYPES */}
              {isWordCloud ? (
                /* 1. DYNAMIC WORD CLOUD WHITEBOARD (WORD_CLOUD) */
                <div className="w-full max-w-5xl py-6 flex flex-col items-center space-y-6">
                  <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 p-8 rounded-3xl bg-slate-900/80 border-2 border-indigo-500/30 backdrop-blur-xl shadow-2xl min-h-[320px] w-full">
                    {wordCloudData.map((item, wIdx) => {
                      const fontClass =
                        item.ratio >= 0.8
                          ? "text-4xl sm:text-6xl font-black"
                          : item.ratio >= 0.5
                          ? "text-2xl sm:text-4xl font-black"
                          : item.ratio >= 0.3
                          ? "text-xl sm:text-2xl font-bold"
                          : "text-base sm:text-lg font-semibold";
                      const rotateClass = ["-rotate-6", "rotate-0", "rotate-6", "rotate-0", "-rotate-3", "rotate-3"][wIdx % 6];
                      const gradientClass = [
                        "from-cyan-400 via-teal-300 to-blue-500",
                        "from-pink-400 via-rose-400 to-red-500",
                        "from-amber-400 via-yellow-300 to-orange-500",
                        "from-emerald-400 via-green-300 to-teal-500",
                        "from-purple-400 via-violet-300 to-indigo-500",
                      ][wIdx % 5];

                      return (
                        <motion.div
                          key={wIdx}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 280, damping: 22, delay: wIdx * 0.05 }}
                          className={`px-4 sm:px-6 py-2 rounded-2xl bg-slate-950/70 border border-slate-700/60 shadow-lg ${rotateClass} transition-transform hover:scale-110 hover:z-20 cursor-default flex items-center gap-2`}
                        >
                          <span className={`bg-clip-text text-transparent bg-gradient-to-r ${gradientClass} ${fontClass}`}>
                            {item.word}
                          </span>
                          {item.count > 1 && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-black">
                              x{item.count}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>শব্দের পুনরাবৃত্তির ফ্রিকোয়েন্সি অনুযায়ী স্বয়ংক্রিয়ভাবে ফন্ট স্কেলিং হচ্ছে</span>
                  </div>
                </div>
              ) : isMoodCheckin ? (
                /* 2. MOOD & ENERGY CHECK-IN RADAR (MOOD_CHECKIN) */
                <div className="w-full max-w-4xl py-6 space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {moodRadarData.map((m, mIdx) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: mIdx * 0.1 }}
                        className={`p-5 rounded-3xl bg-slate-900/90 border-2 ${m.border} shadow-xl flex flex-col items-center text-center space-y-2`}
                      >
                        <span className="text-4xl sm:text-5xl drop-shadow-lg">{m.emoji}</span>
                        <span className="text-xs sm:text-sm font-black text-white">{m.label}</span>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${m.gradient}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${m.percent}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-300 font-mono">
                          {m.count} জন ({m.percent}%)
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  {/* Floating emoji trigger buttons */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    {["🔥", "😊", "🤔", "😴"].map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => emitLiveReaction(emoji)}
                        className="px-4 py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-lg flex items-center gap-2 transition transform active:scale-95"
                      >
                        <span>{emoji}</span>
                        <span className="text-xs text-slate-400 font-bold">রিঅ্যাক্ট</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : isStickyWall ? (
                /* 3. COLLABORATIVE WHITEBOARD STICKY NOTES (STICKY_WALL / OPEN_FEEDBACK) */
                <div className="w-full max-w-6xl py-4 space-y-4">
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/95 border-2 border-slate-800 shadow-2xl min-h-[360px] bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:24px_24px] relative">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                      {stickyNotesData.map((item, idx) => {
                        const tilts = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "-rotate-3", "rotate-3"];
                        const tilt = tilts[idx % tilts.length];
                        const colorStyles: Record<string, string> = {
                          amber: "bg-amber-200 text-amber-950 border-amber-300 shadow-amber-900/20",
                          rose: "bg-rose-200 text-rose-950 border-rose-300 shadow-rose-900/20",
                          cyan: "bg-cyan-200 text-cyan-950 border-cyan-300 shadow-cyan-900/20",
                          emerald: "bg-emerald-200 text-emerald-950 border-emerald-300 shadow-emerald-900/20",
                        };
                        const style = colorStyles[item.color || "amber"] || colorStyles.amber;

                        return (
                          <motion.div
                            key={idx}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setSpotlightNote(item)}
                            className={`p-4 rounded-2xl border ${style} ${tilt} shadow-lg hover:shadow-2xl hover:scale-105 hover:rotate-0 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[140px] select-text`}
                          >
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-black/10">
                              <span className="text-lg">{item.avatar || "📌"}</span>
                              <span className="text-[11px] font-black tracking-tight truncate">{item.playerName || "শিক্ষার্থী"}</span>
                            </div>
                            <p className="text-xs sm:text-sm font-semibold leading-relaxed py-2 flex-1 line-clamp-4">
                              {item.text}
                            </p>
                            <div className="text-[10px] opacity-60 text-right flex items-center justify-end gap-1">
                              <ZoomIn className="w-3 h-3" />
                              <span>স্পটলাইট</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : isOpinionPoll ? (
                /* 4. LIVE OPINION POLL BARS (OPINION_POLL) */
                <div className="w-full max-w-4xl py-6 space-y-4">
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>মতামত পোল • লাইভ রেজাল্ট বার (কোনো সঠিক/ভুল নেই)</span>
                    </div>
                    {opinionPollData.map((opt, oIdx) => (
                      <div key={oIdx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm font-bold text-white px-1">
                          <span>{opt.text}</span>
                          <span className="text-cyan-400 font-mono">{opt.votes} ভোট ({opt.percent}%)</span>
                        </div>
                        <div className="w-full h-8 bg-slate-800/90 rounded-2xl overflow-hidden p-1 border border-slate-700/60 relative">
                          <motion.div
                            className={`h-full rounded-xl bg-gradient-to-r ${opt.gradient}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(3, opt.percent)}%` }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : isIntroSlide ? (
                /* 5. WELCOME / INTRO BANNER SLIDE (INTRO_SLIDE) */
                <div className="w-full max-w-4xl py-8 flex flex-col items-center text-center space-y-6">
                  <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-purple-950/80 border-2 border-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.25)] space-y-6 w-full">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase tracking-widest">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>{slide.metadata?.className || "একাডেমিক সেশন ২০২৬"} • {slide.metadata?.tradeName || "PTSC ইন্টারেক্টিভ কুইজ"}</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                      {slide.questionText || "আজকের সেশনে সবাইকে স্বাগতম!"}
                    </h1>
                    {slide.explanation && (
                      <p className="text-base sm:text-xl font-medium text-indigo-200/90 max-w-2xl mx-auto leading-relaxed">
                        {slide.explanation}
                      </p>
                    )}
                    <div className="pt-4 flex items-center justify-center gap-3">
                      {["❤️", "🔥", "👏", "🎉", "⚡"].map((emoji, eIdx) => (
                        <button
                          key={eIdx}
                          type="button"
                          onClick={() => emitLiveReaction(emoji)}
                          className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-2xl flex items-center justify-center transition-transform hover:scale-125 active:scale-95 cursor-pointer shadow-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : slide.options && slide.options.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-4xl"
                >
                  {slide.options.map((opt, i) => (
                    <div
                      key={i}
                      className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md text-xl font-bold text-white/80 shadow-lg"
                    >
                      {opt}
                    </div>
                  ))}
                </motion.div>
              ) : null}

              {slide.explanation && !isIntroSlide && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl sm:text-2xl font-bold text-indigo-200 opacity-80"
                >
                  {slide.explanation}
                </motion.div>
              )}

              {slide.expectedAnswerKeyword && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="px-6 py-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xl font-black italic shadow-2xl"
                >
                  {slide.expectedAnswerKeyword}
                </motion.div>
              )}
            </motion.div>
          ) : mode === "quiz" && question ? (
            <motion.div
              key={question.id || questionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col space-y-6 sm:space-y-8"
            >
              {/* Giant Question Banner */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60" />
                
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-relaxed tracking-wide drop-shadow-md">
                  {question.question}
                </h1>

                {/* Mobile Submission Indicator */}
                <div className="md:hidden mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-300">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{submittedCount} / {totalPlayers} জন উত্তর দিয়েছে</span>
                </div>
              </div>

              {/* KAHOOT-STYLE 4 VIBRANT OPTION CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {question.options.map((optionText, optIndex) => {
                  const style = KAHOOT_STYLES[optIndex] || KAHOOT_STYLES[0];
                  const isCorrect = question.correctAnswer === optIndex;
                  const voteCount = optionStats[optIndex] || 0;
                  const votePercent = submittedCount > 0 ? Math.round((voteCount / submittedCount) * 100) : 0;

                  const cardOpacity = isAnswerRevealed ? (isCorrect ? "opacity-100 ring-4 ring-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.5)]" : "opacity-35 grayscale-[40%]") : "opacity-100 hover:scale-[1.01]";

                  return (
                    <motion.div
                      key={optIndex}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: optIndex * 0.08 }}
                      className={`relative rounded-3xl p-5 sm:p-6 bg-gradient-to-br ${style.cardBg} border ${style.borderClass} ${cardOpacity} shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[120px] sm:min-h-[140px] overflow-hidden`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-xl bg-black/25 flex items-center justify-center font-black text-lg sm:text-xl drop-shadow text-white">
                            {style.shape}
                          </span>
                          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white/90">
                            অপশন {["ক", "খ", "গ", "ঘ"][optIndex]}
                          </span>
                        </div>

                        {isAnswerRevealed && (
                          <div>
                            {isCorrect ? (
                              <span className="px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-xs font-black uppercase flex items-center gap-1.5 shadow-lg">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                সঠিক
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-black/40 text-white/60 text-xs font-semibold flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                ভুল
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-base sm:text-lg md:text-xl font-bold text-white leading-snug drop-shadow-sm flex-1 flex items-center">
                        {optionText}
                      </p>

                      {isAnswerRevealed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between gap-3"
                        >
                          <div className="flex-1">
                            <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-white rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: `${votePercent}%` }}
                                transition={{ duration: 0.6 }}
                              />
                            </div>
                          </div>
                          <div className="text-xs font-black text-white">{votePercent}%</div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* EXPLANATION PANEL */}
              {isAnswerRevealed && question.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 sm:p-5 rounded-2xl bg-indigo-950/70 border border-indigo-500/40 shadow-xl backdrop-blur-md flex items-start gap-3.5 text-indigo-100"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">ব্যাখ্যা:</h4>
                    <p className="text-xs sm:text-sm font-medium leading-relaxed">{question.explanation}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* FOOTER: Host Command Buttons (Sticky Bottom Controls) */}
      <footer className="sticky bottom-0 z-30 w-full px-4 sm:px-8 py-3.5 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>PTSC ক্লাসরুম প্রজেক্টর মোড • {totalPlayers} শিক্ষার্থী লাইভ</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {mode === "presentation" ? (
              <>
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold">
                  <span>💬 মতামত ও ওয়ার্মআপ (নম্বরবিহীন)</span>
                </div>

                <button
                  type="button"
                  onClick={onEndQuiz}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  বাতিল
                </button>
                {onPrevSlide && slideIndex > 0 && (
                  <button
                    type="button"
                    onClick={onPrevSlide}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>পূর্ববর্তী</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onNextSlide}
                  className="px-5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>পরবর্তী স্লাইড</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleLaunchScoredQuiz}
                  disabled={isStartingQuiz}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer disabled:opacity-60"
                >
                  {isStartingQuiz ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <Play className="w-4 h-4 fill-current text-slate-950" />
                  )}
                  <span>🚀 মূল কুইজ প্রতিযোগিতা শুরু করুন (Launch Scored Quiz)</span>
                </button>
              </>
            ) : (
              <>
                {!isAnswerRevealed ? (
                  <button
                    type="button"
                    onClick={onShowResults}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-white" />
                    <span>ফলাফল প্রকাশ করুন</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onNextQuestion}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
                  >
                    <span>{questionIndex + 1 >= (totalQuestions || 0) ? "🏆 লিডারবোর্ড" : "পরবর্তী প্রশ্ন"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {onShowLeaderboard && (
                  <button
                    type="button"
                    onClick={onShowLeaderboard}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>লিডারবোর্ড</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onEndQuiz}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>সমাপ্তি</span>
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* STICKY NOTE SPOTLIGHT ZOOM MODAL */}
      <AnimatePresence>
        {spotlightNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-xl w-full p-8 rounded-3xl bg-amber-200 text-amber-950 border-4 border-amber-300 shadow-2xl space-y-4"
            >
              <button
                type="button"
                onClick={() => setSpotlightNote(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-amber-950 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 pb-3 border-b border-amber-950/20">
                <span className="text-3xl">{spotlightNote.avatar}</span>
                <div>
                  <h3 className="text-lg font-black">{spotlightNote.playerName}</h3>
                  <span className="text-xs text-amber-900 font-medium">লাইভ হোয়াইটবোর্ড অভিমত</span>
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold leading-relaxed whitespace-pre-wrap py-2">
                {spotlightNote.text}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN 3-2-1 KAHOOT COUNTDOWN ANIMATION */}
      <AnimatePresence>
        {countdownValue !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-2xl"
          >
            <motion.div
              key={countdownValue}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 p-2 shadow-[0_0_100px_rgba(245,158,11,0.7)] flex items-center justify-center animate-pulse">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                  <span className="font-mono text-7xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 drop-shadow-2xl">
                    {countdownValue === 0 ? "🚀" : countdownValue}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-wide">
                  {countdownValue === 0 ? "মূল কুইজ প্রতিযোগিতা শুরু হচ্ছে!" : "প্রস্তুত হও..."}
                </h2>
                <p className="text-sm sm:text-base text-amber-300 font-bold uppercase tracking-widest">
                  Kahoot! লাইভ স্কোরিং ও লিডারবোর্ড ফেজ
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Reactions Overlay */}
      <FloatingReactionOverlay />
    </div>
  );
}
