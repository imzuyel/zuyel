"use client";

import React, { useMemo } from "react";
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
  Sparkles
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

  // Cloud Kinetic Typography Component
  const CloudKineticTypography = ({ text }: { text: string }) => {
    const words = text.split(" ");
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

              {/* MENTIMETER SPECIALIZED INTERACTIVE SLIDE TYPES */}
              {slide.type === "word_cloud" ? (
                <div className="flex flex-wrap items-center justify-center gap-4 max-w-4xl py-6">
                  {(slide.options && slide.options.length > 0 ? slide.options : ["উদ্ভাবন", "প্রযুক্তি", "ভবিষ্যৎ", "দক্ষতা", "পরিশ্রম", "সততা", "আইওটি", "ইঞ্জিনিয়ারিং"]).map((word, wIdx) => {
                    const sizes = ["text-2xl sm:text-3xl font-bold", "text-3xl sm:text-5xl font-black", "text-xl sm:text-2xl font-bold", "text-4xl sm:text-6xl font-black"];
                    const colors = [
                      "from-cyan-400 to-blue-500",
                      "from-pink-400 to-rose-500",
                      "from-emerald-400 to-teal-500",
                      "from-amber-400 to-orange-500",
                      "from-purple-400 to-indigo-500"
                    ];
                    return (
                      <motion.span
                        key={wIdx}
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: wIdx * 0.08 }}
                        className={`px-5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/60 shadow-xl bg-clip-text text-transparent bg-gradient-to-r ${colors[wIdx % colors.length]} ${sizes[wIdx % sizes.length]} drop-shadow-sm`}
                      >
                        {word}
                      </motion.span>
                    );
                  })}
                </div>
              ) : slide.type === "open_ended" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-5xl py-4">
                  {(slide.options && slide.options.length > 0 ? slide.options : [
                    "আজকের প্র্যাকটিক্যাল ল্যাব সেশনটি অনেক কার্যকরী ছিল!",
                    "পরবর্তী ক্লাসে নেটওয়ার্কিং প্রটোকল নিয়ে আরও বিস্তারিত জানতে চাই।",
                    "কনসেপ্টগুলো খুব সহজে ও আকর্ষণীয়ভাবে বুঝতে পেরেছি।"
                  ]).map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.12 }}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 text-left space-y-2 shadow-xl backdrop-blur-md"
                    >
                      <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>শিক্ষার্থীর অভিমত #{idx + 1}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-100 leading-relaxed">{item}</p>
                    </motion.div>
                  ))}
                </div>
              ) : slide.type === "scales_rating" ? (
                <div className="w-full max-w-3xl space-y-4 py-4">
                  {(slide.options && slide.options.length > 0 ? slide.options : [
                    "১ - একদম বুঝিনি",
                    "২ - কিছুটা বুঝেছি",
                    "৩ - সন্তোষজনক",
                    "৪ - ভালো বুঝেছি",
                    "৫ - পুরোপুরি আত্মবিশ্বাসী"
                  ]).map((level, rIdx) => (
                    <div key={rIdx} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/70 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black text-sm flex items-center justify-center">
                          {rIdx + 1}★
                        </span>
                        <span className="text-sm sm:text-base font-bold text-white">{level}</span>
                      </div>
                      <div className="w-40 sm:w-64 h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                          style={{ width: `${Math.min(100, (rIdx + 1) * 20)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : slide.type === "qa_slide" ? (
                <div className="w-full max-w-4xl p-8 rounded-3xl bg-slate-900/90 border border-indigo-500/40 shadow-2xl backdrop-blur-xl text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold">
                    <HelpCircle className="w-4 h-4" />
                    <span>উন্মুক্ত প্রশ্নোত্তর চ্যানেল সচল</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">শিক্ষার্থীরা মোবাইল থেকে তাদের প্রশ্ন পাঠাচ্ছে</h3>
                  <p className="text-sm text-slate-400">রিয়েল-টাইমে শিক্ষার্থীদের পাঠানো প্রশ্ন এই স্ক্রিনে প্রদর্শিত হবে</p>
                </div>
              ) : slide.options && slide.options.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
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

              {slide.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="text-2xl sm:text-3xl font-bold text-indigo-200 opacity-80"
                >
                  {slide.explanation}
                </motion.div>
              )}

              {slide.expectedAnswerKeyword && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.8 }}
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
                  onClick={onStartQuiz}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>কুইজ শুরু করুন</span>
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

      {/* Live Reactions Overlay */}
      <FloatingReactionOverlay />
    </div>
  );
}
