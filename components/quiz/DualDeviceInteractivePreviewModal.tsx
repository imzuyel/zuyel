"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Smartphone,
  Tv,
  ArrowLeft,
  ArrowRight,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Flame,
  Send,
  RotateCcw,
  ZoomIn,
  Check,
  HelpCircle,
  BarChart3,
  Layers,
  Smile,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Award,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PresentationSlide, isGradedQuiz } from "./UnifiedQuizMentimeterWorkspace";

interface DualDeviceInteractivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: PresentationSlide[];
  initialSlideIndex?: number;
  deckTitle?: string;
  tradeName?: string;
}

interface SimulatedResponse {
  id: string;
  slideId: string;
  type: string;
  payload: any;
  studentName: string;
  avatar: string;
  timestamp: number;
}

export default function DualDeviceInteractivePreviewModal({
  isOpen,
  onClose,
  slides,
  initialSlideIndex = 0,
  deckTitle = "স্মার্ট প্রেজেন্টেশন ও কুইজ",
  tradeName = "ভোকেশনাল কোর্স",
}: DualDeviceInteractivePreviewModalProps) {
  if (!isOpen || !slides || slides.length === 0) return null;

  const [activeSlideIndex, setActiveSlideIndex] = useState(
    Math.min(Math.max(0, initialSlideIndex), slides.length - 1)
  );

  // Live testable simulated responses per slide
  const [simulatedResponses, setSimulatedResponses] = useState<Record<string, SimulatedResponse[]>>({});
  
  // Student Phone inputs state
  const [studentWord, setStudentWord] = useState("");
  const [studentOpenResponse, setStudentOpenResponse] = useState("");
  const [studentSelectedOption, setStudentSelectedOption] = useState<any>(null);
  const [studentCapsuleWord, setStudentCapsuleWord] = useState("");
  const [studentReorderItems, setStudentReorderItems] = useState<string[]>([]);
  const [studentSubmitted, setStudentSubmitted] = useState<Record<string, boolean>>({});
  const [studentAnswerFeedback, setStudentAnswerFeedback] = useState<Record<string, { isCorrect: boolean; selected: any; correct: any }>>({});
  
  // Host Stage state
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: string; emoji: string; x: number }>>([]);
  const [spotlightCard, setSpotlightCard] = useState<any | null>(null);

  const currentSlide = slides[activeSlideIndex] || slides[0];
  const isCurrentGraded = isGradedQuiz(currentSlide.type);

  // Responses for the current slide
  const currentResponses = useMemo(() => {
    return simulatedResponses[currentSlide.id] || [];
  }, [simulatedResponses, currentSlide.id]);

  const hasSubmittedCurrent = !!studentSubmitted[currentSlide.id];
  const currentFeedback = studentAnswerFeedback[currentSlide.id];

  // Advance / Previous Slide
  const handlePrevSlide = () => {
    if (activeSlideIndex > 0) {
      setActiveSlideIndex(activeSlideIndex - 1);
      setIsAnswerRevealed(false);
    }
  };

  const handleNextSlide = () => {
    if (activeSlideIndex < slides.length - 1) {
      setActiveSlideIndex(activeSlideIndex + 1);
      setIsAnswerRevealed(false);
    }
  };

  // Reset simulation for current slide
  const handleResetSlideTest = () => {
    setSimulatedResponses((prev) => ({
      ...prev,
      [currentSlide.id]: [],
    }));
    setStudentSubmitted((prev) => ({
      ...prev,
      [currentSlide.id]: false,
    }));
    setStudentAnswerFeedback((prev) => {
      const copy = { ...prev };
      delete copy[currentSlide.id];
      return copy;
    });
    setStudentSelectedOption(null);
    setStudentWord("");
    setStudentOpenResponse("");
    setStudentCapsuleWord("");
    if (currentSlide.type === "REORDER" && currentSlide.items) {
      setStudentReorderItems([...currentSlide.items].reverse());
    }
    setIsAnswerRevealed(false);
  };

  // Sync reorder items on slide change
  useEffect(() => {
    setStudentCapsuleWord("");
    if (currentSlide.type === "REORDER" && currentSlide.items) {
      setStudentReorderItems([...currentSlide.items].reverse());
    } else {
      setStudentReorderItems([]);
    }
  }, [currentSlide.id, currentSlide.type]);

  // Send Floating Emoji from Phone to Projector
  const handleSendEmoji = (emoji: string) => {
    const id = `emoji-${Date.now()}-${Math.random()}`;
    const x = Math.floor(20 + Math.random() * 60); // 20% to 80% horizontal
    setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 2800);
  };

  // Student Submits Word Cloud Word
  const handleSubmitWord = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!studentWord.trim()) return;

    const newResp: SimulatedResponse = {
      id: `resp-${Date.now()}`,
      slideId: currentSlide.id,
      type: "WORD_CLOUD",
      payload: studentWord.trim(),
      studentName: "রাকিবুল হাসান",
      avatar: "🚀",
      timestamp: Date.now(),
    };

    setSimulatedResponses((prev) => ({
      ...prev,
      [currentSlide.id]: [...(prev[currentSlide.id] || []), newResp],
    }));
    setStudentWord("");
    setStudentSubmitted((prev) => ({ ...prev, [currentSlide.id]: true }));
  };

  // Student Submits Open-Ended Response
  const handleSubmitOpenResponse = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!studentOpenResponse.trim()) return;

    const newResp: SimulatedResponse = {
      id: `resp-${Date.now()}`,
      slideId: currentSlide.id,
      type: currentSlide.type,
      payload: studentOpenResponse.trim(),
      studentName: "রাকিবুল হাসান",
      avatar: "💡",
      timestamp: Date.now(),
    };

    setSimulatedResponses((prev) => ({
      ...prev,
      [currentSlide.id]: [...(prev[currentSlide.id] || []), newResp],
    }));
    setStudentOpenResponse("");
    setStudentSubmitted((prev) => ({ ...prev, [currentSlide.id]: true }));
  };

  // Student Submits Graded Quiz Answer
  const handleSubmitGradedAnswer = (selectedVal: any) => {
    if (hasSubmittedCurrent) return;

    const correctVal = currentSlide.correctAnswer;
    const isCorrect =
      currentSlide.type === "TRUE_FALSE"
        ? Boolean(selectedVal) === Boolean(correctVal)
        : String(selectedVal) === String(correctVal);

    const newResp: SimulatedResponse = {
      id: `resp-${Date.now()}`,
      slideId: currentSlide.id,
      type: currentSlide.type,
      payload: selectedVal,
      studentName: "রাকিবুল হাসান",
      avatar: isCorrect ? "🌟" : "🎯",
      timestamp: Date.now(),
    };

    setSimulatedResponses((prev) => ({
      ...prev,
      [currentSlide.id]: [...(prev[currentSlide.id] || []), newResp],
    }));

    setStudentSubmitted((prev) => ({ ...prev, [currentSlide.id]: true }));
    setStudentAnswerFeedback((prev) => ({
      ...prev,
      [currentSlide.id]: {
        isCorrect,
        selected: selectedVal,
        correct: correctVal,
      },
    }));
  };

  // Compute Word Cloud frequencies
  const wordCloudWords = useMemo(() => {
    const list = [...(currentSlide.options || [])];
    currentResponses.forEach((r) => {
      if (typeof r.payload === "string") list.push(r.payload);
    });
    const counts: Record<string, number> = {};
    list.forEach((w) => {
      const clean = w.trim();
      if (clean) counts[clean] = (counts[clean] || 0) + 1;
    });
    const max = Math.max(1, ...Object.values(counts));
    return Object.entries(counts).map(([text, count]) => ({
      text,
      count,
      ratio: count / max,
    }));
  }, [currentSlide.options, currentResponses]);

  // Compute MCQ / Poll Option Stats
  const optionStats = useMemo(() => {
    const options = currentSlide.options || [];
    const counts = options.map(() => 0);
    currentResponses.forEach((r) => {
      const idx = Number(r.payload);
      if (!isNaN(idx) && idx >= 0 && idx < counts.length) {
        counts[idx] += 1;
      }
    });
    const total = Math.max(1, currentResponses.length);
    return counts.map((c) => ({
      votes: c,
      percent: Math.round((c / total) * 100),
    }));
  }, [currentSlide.options, currentResponses]);

  const KAHOOT_COLORS = [
    { bg: "bg-red-600", text: "text-red-400", border: "border-red-500", shape: "▲" },
    { bg: "bg-blue-600", text: "text-blue-400", border: "border-blue-500", shape: "◆" },
    { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-400", shape: "●" },
    { bg: "bg-emerald-600", text: "text-emerald-400", border: "border-emerald-500", shape: "■" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden select-none font-sans">
      {/* =====================================================================
          TOP HEADER BAR: Slide Selector + Navigation + Close
          ===================================================================== */}
      <header className="h-14 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-black">
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>ডুয়াল-ডিভাইস ইন্টারঅ্যাক্টিভ প্রিভিউ</span>
          </div>
          <span className="text-xs font-black text-slate-300 truncate hidden md:inline">
            {deckTitle}
          </span>
          <span className="text-[10px] text-slate-500 font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 hidden lg:inline">
            {tradeName}
          </span>
        </div>

        {/* Center: Slide Switcher Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={activeSlideIndex === 0}
            onClick={handlePrevSlide}
            className="p-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
            title="পূর্ববর্তী স্লাইড"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-black text-indigo-300 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700">
            {activeSlideIndex + 1} / {slides.length}
          </span>

          <button
            type="button"
            disabled={activeSlideIndex === slides.length - 1}
            onClick={handleNextSlide}
            className="p-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
            title="পরবর্তী স্লাইড"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="h-5 w-[1px] bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={handleResetSlideTest}
            className="px-2.5 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-[11px] font-bold text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
            title="এই স্লাইডের টেস্ট রিসেট করুন"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">রিসেট</span>
          </button>
        </div>

        {/* Right: Close Preview Button */}
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>প্রিভিউ বন্ধ করুন</span>
        </button>
      </header>

      {/* =====================================================================
          MAIN SPLIT-SCREEN VIEW: 70% Host Projector Stage vs 30% Mobile Phone
          ===================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* -------------------------------------------------------------------
            LEFT SIDE (70%): HOST PROJECTOR / SMARTBOARD STAGE
            ------------------------------------------------------------------- */}
        <section className="flex-1 lg:w-[70%] border-r border-slate-800 bg-slate-950 p-4 sm:p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Floating Live Reaction Bubbles Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
            <AnimatePresence>
              {floatingEmojis.map((e) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 300, scale: 0.5 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    y: -400,
                    scale: [0.5, 1.4, 1.2, 0.8],
                  }}
                  transition={{ duration: 2.6, ease: "easeOut" }}
                  style={{ left: `${e.x}%` }}
                  className="absolute bottom-12 text-4xl sm:text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
                >
                  {e.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Top Floating Join Bar Banner (Mentimeter Style) */}
          <div className="w-full max-w-4xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 shadow-xl shrink-0 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-bold text-slate-400">
                📱 জয়েন করুন: <strong className="text-white font-mono font-black">domain.edu/quiz/join</strong>
              </span>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="text-xs sm:text-sm font-bold text-indigo-300">
                কোড: <strong className="text-amber-300 font-mono text-base font-black tracking-wider">849 201</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-mono font-black">{currentResponses.length > 0 ? 1 : 0} জন যুক্ত</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-950/60 border border-indigo-800/80 text-indigo-300">
                <span>📨 {currentResponses.length}টি রেসপন্স</span>
              </div>
            </div>
          </div>

          {/* Center Stage Presentation Canvas */}
          <div className="flex-1 my-4 flex items-center justify-center overflow-y-auto">
            <div className="w-full max-w-4xl p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-2xl relative space-y-6">
              {/* Slide Title / Prompt */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-[11px] font-bold border border-white/10">
                  <span>{currentSlide.type}</span>
                  <span>•</span>
                  <span>{isCurrentGraded ? "⏱️ গ্রেডেড কুইজ" : "📄 ইন্টারঅ্যাক্টিভ ওপেন"}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug">
                  {currentSlide.title || "এখানে আপনার প্রশ্ন বা আলোচনার বিষয় লিখুন..."}
                </h2>
                {currentSlide.content && (
                  <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    {currentSlide.content}
                  </p>
                )}
              </div>

              {/* SLIDE TYPE SPECIFIC PROJECTOR RENDERING */}
              {/* 1. TEXT_SLIDE */}
              {currentSlide.type === "TEXT_SLIDE" && (
                <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-900/50 text-indigo-100 space-y-3 text-center">
                  <p className="text-base sm:text-lg font-medium leading-relaxed">
                    {currentSlide.content || "পাঠের মূল বিষয়বস্তু এখানে বিস্তারিত প্রদর্শিত হবে।"}
                  </p>
                  <p className="text-xs text-indigo-400 font-bold">
                    💡 শিক্ষকের বক্তব্য শুনুন এবং মোবাইলের ইমোজি দিয়ে রিঅ্যাকশন দিন।
                  </p>
                </div>
              )}

              {/* 2. IMAGE_COMPARE */}
              {currentSlide.type === "IMAGE_COMPARE" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 block text-center">চিত্র ১ (Left Diagram)</span>
                    <div className="aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                      <img
                        src={currentSlide.imageLeftUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500"}
                        alt="Left Diagram"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 block text-center">চিত্র ২ (Right Diagram)</span>
                    <div className="aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                      <img
                        src={currentSlide.imageRightUrl || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500"}
                        alt="Right Diagram"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. WORD_CLOUD */}
              {currentSlide.type === "WORD_CLOUD" && (
                <div className="p-8 rounded-3xl bg-slate-950/70 border-2 border-indigo-500/30 min-h-[220px] flex flex-wrap items-center justify-center gap-3 sm:gap-6 backdrop-blur-xl shadow-xl">
                  {wordCloudWords.length === 0 ? (
                    <div className="text-center text-slate-500 space-y-1">
                      <p className="text-sm font-bold text-slate-400">ওয়ার্ড ক্লাউডে কোনো শব্দ আসেনি</p>
                      <p className="text-xs">ডানপাশের মোবাইল ফ্রেম থেকে শব্দ পাঠিয়ে রিয়েল-টাইম রঙিন ক্লাউড দেখুন!</p>
                    </div>
                  ) : (
                    wordCloudWords.map((w, idx) => {
                      const sizeClass =
                        w.ratio > 0.8
                          ? "text-3xl sm:text-5xl font-black"
                          : w.ratio > 0.5
                          ? "text-xl sm:text-3xl font-extrabold"
                          : "text-base sm:text-xl font-bold";
                      const colorClass = [
                        "text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]",
                        "text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]",
                        "text-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,0.4)]",
                        "text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]",
                        "text-fuchsia-400 drop-shadow-[0_0_12px_rgba(217,70,239,0.4)]",
                        "text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.4)]",
                      ][idx % 6];
                      const rotateClass = ["-rotate-3", "rotate-0", "rotate-3", "rotate-0", "-rotate-6", "rotate-6"][idx % 6];
                      return (
                        <motion.div
                          key={`${w.text}-${idx}`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ 
                            scale: 1, 
                            opacity: 1,
                            y: [0, (idx % 2 === 0 ? -4 : 4), 0]
                          }}
                          transition={{ 
                            y: { duration: 2.2 + (idx % 3) * 0.4, repeat: Infinity, ease: "easeInOut" },
                            type: "spring", stiffness: 280, damping: 22, delay: idx * 0.04 
                          }}
                          className={`px-3.5 sm:px-4 py-1.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg ${rotateClass} transition-transform hover:scale-110 cursor-default flex items-center gap-1.5`}
                        >
                          <span className={`${sizeClass} ${colorClass}`}>{w.text}</span>
                          {w.count > 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-mono font-black border border-indigo-400/40">
                              x{w.count}
                            </span>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}

              {/* 4. OPEN_ENDED & LIVE_QA */}
              {(currentSlide.type === "OPEN_ENDED" || currentSlide.type === "LIVE_QA") && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 min-h-[160px]">
                    {currentResponses.length === 0 ? (
                      <div className="col-span-full py-8 text-center text-slate-500 space-y-1">
                        <MessageSquare className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                        <p className="text-sm font-bold">শিক্ষার্থীদের কোনো মতামত আসেনি</p>
                        <p className="text-xs">ডানপাশের মোবাইল থেকে মন্তব্য পাঠিয়ে লাইভ কার্ড দেখুন!</p>
                      </div>
                    ) : (
                      currentResponses.map((r) => (
                        <motion.div
                          key={r.id}
                          initial={{ scale: 0.8, opacity: 0, y: 15 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          onClick={() => setSpotlightCard(r)}
                          className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 shadow-lg cursor-pointer transition text-left space-y-2 group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{r.avatar}</span>
                            <span className="text-[11px] font-bold text-slate-300 truncate">
                              {r.studentName}
                            </span>
                          </div>
                          <p className="text-xs text-white font-medium line-clamp-3 leading-snug">
                            {r.payload}
                          </p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 5. MCQ (4 Option Bars with Live Votes) */}
              {currentSlide.type === "MCQ" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {(currentSlide.options || []).map((opt, idx) => {
                    const color = KAHOOT_COLORS[idx % KAHOOT_COLORS.length];
                    const stat = optionStats[idx] || { votes: 0, percent: 0 };
                    const isCorrect = isAnswerRevealed && idx === currentSlide.correctAnswer;
                    const isRevealedWrong = isAnswerRevealed && idx !== currentSlide.correctAnswer;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border-2 transition-all relative overflow-hidden text-left flex items-center justify-between gap-3 ${
                          isCorrect
                            ? "bg-emerald-600/30 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                            : isRevealedWrong
                            ? "bg-slate-900/60 border-slate-800 opacity-40"
                            : "bg-slate-900/90 border-slate-800"
                        }`}
                      >
                        {/* Fill Progress Bar */}
                        <div
                          className={`absolute inset-y-0 left-0 ${color.bg}/20 transition-all duration-500`}
                          style={{ width: `${stat.percent}%` }}
                        />

                        <div className="flex items-center gap-3 relative z-10">
                          <span
                            className={`w-9 h-9 rounded-xl ${color.bg} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md`}
                          >
                            {color.shape}
                          </span>
                          <div>
                            <span className="font-bold text-sm text-white block leading-snug">
                              {opt}
                            </span>
                            {isCorrect && (
                              <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                                <Check className="w-3 h-3 stroke-[3]" /> সঠিক উত্তর
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right relative z-10 font-mono">
                          <span className="text-sm font-black text-white">{stat.votes} ভোট</span>
                          <span className="text-[10px] text-slate-400 block">{stat.percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 6. TRUE_FALSE */}
              {currentSlide.type === "TRUE_FALSE" && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "সত্য (True)", val: true, bg: "from-emerald-600 to-teal-700" },
                    { label: "মিথ্যা (False)", val: false, bg: "from-rose-600 to-pink-700" },
                  ].map((tf, i) => {
                    const isCorrect = isAnswerRevealed && Boolean(currentSlide.correctAnswer) === tf.val;
                    return (
                      <div
                        key={i}
                        className={`p-6 rounded-3xl border-2 text-center transition-all bg-gradient-to-br ${tf.bg}/20 ${
                          isCorrect ? "border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]" : "border-slate-800"
                        }`}
                      >
                        <h3 className="text-xl font-black text-white mb-2">{tf.label}</h3>
                        {isCorrect && (
                          <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> সঠিক উত্তর
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 7. MATCHING */}
              {currentSlide.type === "MATCHING" && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400 block mb-2">সঠিক জোড়া তালিকা:</span>
                  {(currentSlide.pairs || []).map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
                      <span className="text-amber-300">{p.left}</span>
                      <span className="text-slate-500">⟷</span>
                      <span className="text-emerald-300">{p.right}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 8. FILL_BLANKS */}
              {currentSlide.type === "FILL_BLANKS" && (
                <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
                  <p className="text-base font-bold text-slate-300">
                    {currentSlide.title || "নিচের শূন্যস্থানে সঠিক শব্দ বসান:"}
                  </p>
                  {isAnswerRevealed && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-black">
                      <Check className="w-4 h-4" />
                      <span>সঠিক উত্তর: {(currentSlide.acceptedAnswers || []).join(", ") || "নির্দিষ্ট উত্তর"}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 9. REORDER */}
              {currentSlide.type === "REORDER" && (
                <div className="space-y-2">
                  {(currentSlide.items || []).map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3 text-xs font-bold">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-white">{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Host Projector Controls Bar */}
          <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4 pt-3 border-t border-slate-800/80 shrink-0">
            <span className="text-xs text-slate-500 font-bold hidden sm:inline">
              🖥️ হোস্ট প্রেজেন্টার মোড • স্মার্টবোর্ড ডিসপ্লে
            </span>

            <div className="flex items-center gap-2">
              {isCurrentGraded && (
                <button
                  type="button"
                  onClick={() => setIsAnswerRevealed(!isAnswerRevealed)}
                  className={`px-4 py-2 rounded-xl border text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                    isAnswerRevealed
                      ? "bg-emerald-600 text-white border-emerald-500"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isAnswerRevealed ? "উত্তর গোপন করুন" : "👁️ উত্তর দেখান (Reveal)"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNextSlide}
                disabled={activeSlideIndex === slides.length - 1}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <span>পরবর্তী স্লাইড</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            RIGHT SIDE (30%): INTERACTIVE MOBILE PHONE SIMULATOR FRAME
            ------------------------------------------------------------------- */}
        <aside className="w-full lg:w-[30%] min-w-[320px] max-w-[390px] bg-slate-900/90 p-4 sm:p-6 flex flex-col items-center justify-center shrink-0">
          <div className="text-center mb-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-400">
              <Smartphone className="w-3.5 h-3.5" />
              <span>শিক্ষার্থী মোবাইল ভিউ (Live Simulator)</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              মোবাইলে অপশনে ক্লিক বা টাইপ করে টেস্ট করুন
            </p>
          </div>

          {/* Realistic iPhone Phone Mockup Frame */}
          <div className="w-[285px] sm:w-[300px] h-[580px] rounded-[42px] border-[10px] border-slate-800 bg-slate-950 shadow-2xl relative flex flex-col overflow-hidden ring-1 ring-slate-700">
            {/* Top Phone Island / Speaker Notch */}
            <div className="h-6 w-full bg-slate-950 flex items-center justify-between px-6 pt-2 shrink-0 z-30">
              <span className="text-[10px] font-bold text-slate-400 font-mono">9:41</span>
              <div className="w-16 h-3.5 rounded-full bg-slate-900 border border-slate-800" />
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span>5G</span>
                <span className="w-3.5 h-2 rounded-xs border border-slate-400 inline-block" />
              </div>
            </div>

            {/* Student Header Info Inside Phone */}
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-400/30">
                  🚀
                </div>
                <div>
                  <div className="text-[11px] font-black text-white leading-none">রাকিবুল হাসান</div>
                  <span className="text-[9px] text-emerald-400 font-bold">● লাইভ কানেক্টেড</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">#849201</span>
            </div>

            {/* Scrollable Student Content Area */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 flex flex-col justify-between">
              {/* SLIDE TYPE SPECIFIC STUDENT PHONE VIEW */}

              {/* 1 & 2: TEXT_SLIDE or IMAGE_COMPARE */}
              {(currentSlide.type === "TEXT_SLIDE" || currentSlide.type === "IMAGE_COMPARE") && (
                <div className="space-y-4 my-auto text-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-2xl">
                    👀
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white">বোর্ডের দিকে লক্ষ্য করো</h4>
                    <p className="text-[10px] text-slate-400">
                      শিক্ষক এখন স্ক্রিনে বিষয়বস্তু উপস্থাপন করছেন। নিচের বাটনে ক্লিক করে রিঅ্যাকশন পাঠাও:
                    </p>
                  </div>

                  {/* Reaction Buttons */}
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {[
                      { emoji: "❤️", label: "লাভ" },
                      { emoji: "🔥", label: "আগুন" },
                      { emoji: "👏", label: "হাততালি" },
                      { emoji: "🤔", label: "চিন্তিত" },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendEmoji(item.emoji)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-lg active:scale-125 transition cursor-pointer"
                        title={item.label}
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. WORD_CLOUD: Word Input */}
              {currentSlide.type === "WORD_CLOUD" && (
                <div className="space-y-3 my-auto">
                  <div className="text-center space-y-1">
                    <span className="text-xs font-black text-indigo-400">☁️ ওয়ার্ড ক্লাউড</span>
                    <h4 className="text-xs font-bold text-white line-clamp-2">
                      {currentSlide.title || "একটি প্রাসঙ্গিক শব্দ লিখুন:"}
                    </h4>
                  </div>

                  {hasSubmittedCurrent ? (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                      <div className="text-xs font-black text-emerald-300">শব্দ জমা হয়েছে!</div>
                      <p className="text-[10px] text-slate-400">বোর্ডে তোমার শব্দটি যুক্ত হয়েছে।</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitWord} className="space-y-2">
                      <input
                        type="text"
                        value={studentWord}
                        onChange={(e) => setStudentWord(e.target.value)}
                        placeholder="যেমন: উদ্ভাবন..."
                        maxLength={25}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-400"
                      />
                      <button
                        type="submit"
                        disabled={!studentWord.trim()}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-40"
                      >
                        ☁️ ওয়ার্ড পাঠাও
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* 4. OPEN_ENDED & LIVE_QA: Textarea */}
              {(currentSlide.type === "OPEN_ENDED" || currentSlide.type === "LIVE_QA") && (
                <div className="space-y-3 my-auto">
                  <div className="text-center space-y-1">
                    <span className="text-xs font-black text-amber-400">💬 আপনার মতামত</span>
                    <h4 className="text-xs font-bold text-white line-clamp-2">
                      {currentSlide.title || "আপনার মতামত বা প্রশ্ন লিখুন:"}
                    </h4>
                  </div>

                  {hasSubmittedCurrent ? (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                      <div className="text-xs font-black text-emerald-300">মতামত পাঠানো হয়েছে!</div>
                      <p className="text-[10px] text-slate-400">বোর্ডে তোমার কার্ডটি যুক্ত হয়েছে।</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitOpenResponse} className="space-y-2">
                      <textarea
                        rows={3}
                        value={studentOpenResponse}
                        onChange={(e) => setStudentOpenResponse(e.target.value)}
                        placeholder="এখানে সংক্ষেপে লিখুন..."
                        maxLength={150}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                      />
                      <button
                        type="submit"
                        disabled={!studentOpenResponse.trim()}
                        className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer disabled:opacity-40"
                      >
                        🚀 পাঠিয়ে দাও (Submit)
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* 5. GRADED QUIZ: MCQ (Kahoot Style Color Buttons) */}
              {currentSlide.type === "MCQ" && (
                <div className="space-y-2.5 my-auto">
                  <div className="text-center">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider block">
                      ⏱️ বহুনির্বাচনী প্রশ্ন
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-2">
                      {currentSlide.title || "সঠিক উত্তর নির্বাচন করুন:"}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {(currentSlide.options || []).map((opt, idx) => {
                      const color = KAHOOT_COLORS[idx % KAHOOT_COLORS.length];
                      const isSelected = studentSelectedOption === idx;

                      // Strict Correct/Wrong Feedback Rule on Student Phone:
                      // - Correct: Highlight ONLY their selected correct option in Emerald Green
                      // - Wrong: Highlight ONLY their selected wrong option in Rose Red AND reveal the true correct answer in Emerald Green!
                      let feedbackClass = `${color.bg} text-white`;
                      if (hasSubmittedCurrent && currentFeedback) {
                        const isStudentPicked = currentFeedback.selected === idx;
                        const isTrueCorrect = currentFeedback.correct === idx;

                        if (currentFeedback.isCorrect && isStudentPicked) {
                          feedbackClass = "!bg-emerald-500/20 !border-emerald-500 !text-emerald-300 ring-2 ring-emerald-400";
                        } else if (!currentFeedback.isCorrect && isStudentPicked) {
                          feedbackClass = "!bg-rose-500/20 !border-rose-500 !text-rose-300 ring-2 ring-rose-400";
                        } else if (!currentFeedback.isCorrect && isTrueCorrect) {
                          feedbackClass = "!bg-emerald-500/20 !border-emerald-500 !text-emerald-300 ring-2 ring-emerald-400";
                        } else {
                          feedbackClass = "bg-slate-900/60 border-slate-800 text-slate-500 opacity-40";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={hasSubmittedCurrent}
                          onClick={() => {
                            setStudentSelectedOption(idx);
                            handleSubmitGradedAnswer(idx);
                          }}
                          className={`w-full p-2.5 rounded-xl border font-bold text-xs text-left transition flex items-center gap-2.5 cursor-pointer ${feedbackClass}`}
                        >
                          <span className="w-5 h-5 rounded-md bg-white/20 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            {color.shape}
                          </span>
                          <span className="flex-1 truncate">{opt}</span>
                          {hasSubmittedCurrent && currentFeedback?.correct === idx && (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {hasSubmittedCurrent && currentFeedback && (
                    <div
                      className={`p-2.5 rounded-xl text-center text-xs font-black ${
                        currentFeedback.isCorrect
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      {currentFeedback.isCorrect ? "🎉 সঠিক উত্তর! (+১০০ পয়েন্ট)" : "❌ ভুল উত্তর (+০ পয়েন্ট)"}
                    </div>
                  )}
                </div>
              )}

              {/* 6. TRUE_FALSE on Student Phone */}
              {currentSlide.type === "TRUE_FALSE" && (
                <div className="space-y-3 my-auto">
                  <div className="text-center">
                    <span className="text-[10px] font-black text-cyan-400">⚖️ সত্য / মিথ্যা</span>
                    <h4 className="text-xs font-bold text-white line-clamp-2">
                      {currentSlide.title || "বিবৃতিটি যাচাই করুন:"}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "সত্য", val: true, bg: "bg-emerald-600" },
                      { label: "মিথ্যা", val: false, bg: "bg-rose-600" },
                    ].map((tf, i) => {
                      let feedbackClass = `${tf.bg} text-white`;
                      if (hasSubmittedCurrent && currentFeedback) {
                        const isStudentPicked = currentFeedback.selected === tf.val;
                        const isTrueCorrect = Boolean(currentFeedback.correct) === tf.val;
                        if (currentFeedback.isCorrect && isStudentPicked) {
                          feedbackClass = "!bg-emerald-500/20 !border-emerald-500 !text-emerald-300 ring-2 ring-emerald-400";
                        } else if (!currentFeedback.isCorrect && isStudentPicked) {
                          feedbackClass = "!bg-rose-500/20 !border-rose-500 !text-rose-300 ring-2 ring-rose-400";
                        } else if (!currentFeedback.isCorrect && isTrueCorrect) {
                          feedbackClass = "!bg-emerald-500/20 !border-emerald-500 !text-emerald-300 ring-2 ring-emerald-400";
                        } else {
                          feedbackClass = "bg-slate-900 border-slate-800 text-slate-500 opacity-40";
                        }
                      }

                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={hasSubmittedCurrent}
                          onClick={() => {
                            setStudentSelectedOption(tf.val);
                            handleSubmitGradedAnswer(tf.val);
                          }}
                          className={`p-3 rounded-xl border font-black text-xs transition cursor-pointer text-center ${feedbackClass}`}
                        >
                          {tf.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 7. FILL_BLANKS (Interactive Capsule Slot) */}
              {currentSlide.type === "FILL_BLANKS" && (
                <div className="space-y-3 my-auto text-center">
                  <div>
                    <span className="text-[10px] font-black text-amber-400">
                      📝 শূন্যস্থান পূরণ (Fill Capsule)
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-2 mt-1">
                      {currentSlide.title || "সঠিক শব্দটি ক্যাপসুলে লিখুন:"}
                    </h4>
                  </div>

                  {!hasSubmittedCurrent ? (
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-2xl bg-slate-900 border-2 border-amber-500/40 space-y-2 text-left">
                        <label className="text-[10px] text-amber-300 font-bold block">
                          ক্যাপসুল স্লটে শব্দ লিখুন:
                        </label>
                        <input
                          type="text"
                          value={studentCapsuleWord}
                          onChange={(e) => setStudentCapsuleWord(e.target.value)}
                          placeholder="এখানে উত্তর লিখুন..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {currentSlide.acceptedAnswers && currentSlide.acceptedAnswers.length > 0 && (
                        <div className="space-y-1 text-left">
                          <span className="text-[9px] text-slate-400 font-medium">হিন্ট / শব্দ ব্যাংক:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {currentSlide.acceptedAnswers.map((hint, hIdx) => (
                              <button
                                key={hIdx}
                                type="button"
                                onClick={() => setStudentCapsuleWord(hint)}
                                className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold cursor-pointer transition"
                              >
                                {hint}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={!studentCapsuleWord.trim()}
                        onClick={() => handleSubmitGradedAnswer(studentCapsuleWord.trim())}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg"
                      >
                        উত্তর জমা দিন (Submit Word)
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-center space-y-1">
                      <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                      <h5 className="text-xs font-black">ক্যাপসুল উত্তর জমা হয়েছে!</h5>
                      <p className="text-[10px] text-emerald-400 font-mono">
                        আপনার জমা: &ldquo;{currentFeedback?.selected || studentCapsuleWord}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 8. MATCHING (Interactive Matching Pairs) */}
              {currentSlide.type === "MATCHING" && (
                <div className="space-y-3 my-auto text-center">
                  <div>
                    <span className="text-[10px] font-black text-emerald-400">
                      🔗 বাম-ডান মিলকরণ (Matching)
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-1 mt-0.5">
                      {currentSlide.title || "বাম পাশের সাথে ডান পাশের মিল করুন"}
                    </h4>
                  </div>

                  {!hasSubmittedCurrent ? (
                    <div className="space-y-2">
                      {(currentSlide.pairs || [
                        { left: "আইটেম ১", right: "মিল ১" },
                        { left: "আইটেম ২", right: "মিল ২" }
                      ]).map((pair, pIdx) => (
                        <div key={pIdx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-bold">
                          <span className="text-amber-300">{pair.left}</span>
                          <span className="text-slate-500 text-[10px]">⟷</span>
                          <span className="text-emerald-300">{pair.right}</span>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleSubmitGradedAnswer("matched_all")}
                        className="w-full py-2.5 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-lg"
                      >
                        মিল নিশ্চিত করুন (Confirm Pairs)
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-center space-y-1">
                      <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                      <h5 className="text-xs font-black">সব মিল সফলভাবে সংরক্ষিত!</h5>
                      <p className="text-[10px] text-emerald-400 font-mono">+১০০ পয়েন্ট অর্জিত</p>
                    </div>
                  )}
                </div>
              )}

              {/* 9. REORDER (Interactive Step Reordering) */}
              {currentSlide.type === "REORDER" && (
                <div className="space-y-3 my-auto text-center">
                  <div>
                    <span className="text-[10px] font-black text-rose-400">
                      🔢 সঠিক ক্রম সাজানো (Reorder)
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-1 mt-0.5">
                      {currentSlide.title || "ধাপগুলো সঠিক ক্রমে সাজান"}
                    </h4>
                  </div>

                  {!hasSubmittedCurrent ? (
                    <div className="space-y-1.5">
                      {(studentReorderItems.length > 0 ? studentReorderItems : currentSlide.items || ["ধাপ ১", "ধাপ ২", "ধাপ ৩"]).map((item, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 flex-1 truncate text-left">
                            <span className="w-5 h-5 rounded-md bg-rose-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-white font-bold truncate">{item}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                const list = studentReorderItems.length > 0 ? [...studentReorderItems] : [...(currentSlide.items || [])];
                                [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
                                setStudentReorderItems(list);
                              }}
                              className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center text-xs cursor-pointer"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={idx === (studentReorderItems.length || (currentSlide.items?.length ?? 1)) - 1}
                              onClick={() => {
                                const list = studentReorderItems.length > 0 ? [...studentReorderItems] : [...(currentSlide.items || [])];
                                [list[idx + 1], list[idx]] = [list[idx], list[idx + 1]];
                                setStudentReorderItems(list);
                              }}
                              className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center text-xs cursor-pointer"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleSubmitGradedAnswer(studentReorderItems)}
                        className="w-full py-2.5 mt-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition cursor-pointer shadow-lg"
                      >
                        ক্রম নিশ্চিত করুন (Confirm Order)
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-center space-y-1">
                      <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                      <h5 className="text-xs font-black">ক্রম সফলভাবে জমা হয়েছে!</h5>
                      <p className="text-[10px] text-emerald-400 font-mono">+১০০ পয়েন্ট অর্জিত</p>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Phone Indicator */}
              <div className="pt-2 text-center">
                <span className="text-[9px] text-slate-500 font-mono">
                  স্লাইড {activeSlideIndex + 1} / {slides.length} • লাইভ সিঙ্ক
                </span>
              </div>
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="h-4 w-full flex items-center justify-center shrink-0">
              <div className="w-24 h-1 rounded-full bg-slate-700" />
            </div>
          </div>
        </aside>
      </div>

      {/* Spotlight Card Modal (For Open-Ended Whiteboard response zooming) */}
      <AnimatePresence>
        {spotlightCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl relative space-y-4"
            >
              <button
                type="button"
                onClick={() => setSpotlightCard(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <span className="text-3xl">{spotlightCard.avatar}</span>
                <div>
                  <h3 className="text-base font-black text-white">{spotlightCard.studentName}</h3>
                  <span className="text-xs text-indigo-400 font-bold">স্পটলাইট রেসপন্স</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm sm:text-base font-medium text-white leading-relaxed">
                &ldquo;{spotlightCard.payload}&rdquo;
              </div>

              <button
                type="button"
                onClick={() => setSpotlightCard(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
