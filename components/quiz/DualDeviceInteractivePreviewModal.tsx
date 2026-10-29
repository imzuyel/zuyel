"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  PieChart,
  Users,
  ChevronDown,
  ChevronUp,
  Radio,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PresentationSlide, isGradedQuiz } from "./UnifiedQuizMentimeterWorkspace";
import UniversalQuizShowcaseEngine from "./engine/UniversalQuizShowcaseEngine";
import {
  COLORFUL_STUDENT_AVATARS,
  RenderColorfulAvatar,
  getAvatarById,
} from "./avatarData";

interface DualDeviceInteractivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: PresentationSlide[];
  initialSlideIndex?: number;
  deckTitle?: string;
  tradeName?: string;
  classId?: number | string;
  tradeId?: number | string;
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

const PRESENT_STUDENTS_LIST = [
  { id: "st_1", name: "মোঃ জুয়েল রানা", avatarId: "av_cyber_tiger", roll: "১০১" },
  { id: "st_2", name: "রাকিবুল হাসান", avatarId: "av_rocket_blaster", roll: "১০২" },
  { id: "st_3", name: "সাদিয়া আফরিন", avatarId: "av_star_unicorn", roll: "১০৩" },
  { id: "st_4", name: "তানভীর আহমেদ", avatarId: "av_neon_lion", roll: "১০৪" },
  { id: "st_5", name: "মারুফ হাসান", avatarId: "av_ninja_panda", roll: "১০৫" },
  { id: "st_6", name: "নুসরাত জাহান", avatarId: "av_crystal_planet", roll: "১০৬" },
  { id: "st_7", name: "আরিফুর রহমান", avatarId: "av_atom_scientist", roll: "১০৭" },
  { id: "st_8", name: "মেহেদী হাসান", avatarId: "av_code_ninja", roll: "১০৮" },
];

function toBanglaDigits(num: number | string): string {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (d) => bn[parseInt(d)]);
}

export default function DualDeviceInteractivePreviewModal({
  isOpen,
  onClose,
  slides,
  initialSlideIndex = 0,
  deckTitle = "স্মার্ট প্রেজেন্টেশন ও কুইজ",
  tradeName = "ভোকেশনাল কোর্স",
  classId,
  tradeId,
}: DualDeviceInteractivePreviewModalProps) {
  const safeSlides = slides || [];

  const [activeSlideIndex, setActiveSlideIndex] = useState(
    Math.min(Math.max(0, initialSlideIndex), Math.max(0, safeSlides.length - 1))
  );

  // FIX 2 & 3: Student Join Flow State & Class-Mapped Attendance
  const [presentStudents, setPresentStudents] = useState(PRESENT_STUDENTS_LIST);
  const [phoneJoined, setPhoneJoined] = useState(false);
  const [phonePin, setPhonePin] = useState("");
  const [phoneNameTab, setPhoneNameTab] = useState<"attendance" | "manual">("attendance");
  const [phoneSelectedStudent, setPhoneSelectedStudent] = useState(PRESENT_STUDENTS_LIST[0].name);
  const [phoneManualName, setPhoneManualName] = useState("");
  const [phoneSelectedAvatar, setPhoneSelectedAvatar] = useState(PRESENT_STUDENTS_LIST[0].avatarId);
  const [joinPopups, setJoinPopups] = useState<Array<{ id: string; name: string; avatarId: string }>>([]);
  const [joinedCount, setJoinedCount] = useState(0);

  // Dynamically fetch present attendance students for exact Class & Trade
  useEffect(() => {
    if (!isOpen) return;
    const fetchClassStudents = async () => {
      try {
        const query = new URLSearchParams();
        query.set("action", "quiz_eligibility");
        if (classId) query.set("classId", String(classId));
        if (tradeId) query.set("tradeId", String(tradeId));
        const res = await fetch(`/api/attendance?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.students) && data.students.length > 0) {
            const mapped = data.students.slice(0, 25).map((st: any, idx: number) => ({
              id: String(st.id || `st_${idx}`),
              name: st.name || st.nameBangla,
              avatarId: COLORFUL_STUDENT_AVATARS[idx % COLORFUL_STUDENT_AVATARS.length].id,
              roll: toBanglaDigits(st.roll || idx + 101),
            }));
            setPresentStudents(mapped);
            setPhoneSelectedStudent(mapped[0].name);
            setPhoneSelectedAvatar(mapped[0].avatarId);
          }
        }
      } catch (e) {
        console.warn("Could not fetch mapped attendance students for preview:", e);
      }
    };
    fetchClassStudents();
  }, [isOpen, classId, tradeId]);

  const currentStudentName = phoneNameTab === "attendance" ? phoneSelectedStudent : (phoneManualName.trim() || "শিক্ষার্থী");

  // Live testable simulated responses per slide
  const [simulatedResponses, setSimulatedResponses] = useState<Record<string, SimulatedResponse[]>>({});

  // Student Phone inputs state
  const [studentWord, setStudentWord] = useState("");
  const [studentOpenResponse, setStudentOpenResponse] = useState("");
  const [studentSelectedOption, setStudentSelectedOption] = useState<any>(null);
  const [studentSubmitted, setStudentSubmitted] = useState<Record<string, boolean>>({});
  const [studentAnswerFeedback, setStudentAnswerFeedback] = useState<Record<string, { isCorrect: boolean; selected: any; correct: any }>>({});

  // Host Stage state
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: string; emoji: string; x: number }>>([]);
  const [spotlightCard, setSpotlightCard] = useState<any | null>(null);

  // FIX 4, 5, 6, 7: 5-Stage Graded Quiz State Machine
  const [previewStage, setPreviewStage] = useState<"READY" | "COUNTDOWN" | "QUESTION_ONLY" | "ACTIVE" | "REVEAL">("READY");
  const [studentIsReady, setStudentIsReady] = useState<boolean>(false);
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [preview5sTimeLeft, setPreview5sTimeLeft] = useState<number>(5);
  const [activeQuestionTimer, setActiveQuestionTimer] = useState<number>(20);
  const [studentSubmissionSpeed, setStudentSubmissionSpeed] = useState<{ seconds: string; ms: number } | null>(null);
  const [hostChartType, setHostChartType] = useState<"bar" | "donut">("bar");
  const [showWrongStudents, setShowWrongStudents] = useState<boolean>(false);
  const questionStartTimeRef = useRef<number>(Date.now());

  const currentSlide = safeSlides[activeSlideIndex] || safeSlides[0] || ({} as PresentationSlide);
  const isCurrentGraded = currentSlide?.type ? isGradedQuiz(currentSlide.type) : false;

  // Responses for the current slide
  const currentResponses = useMemo(() => {
    if (!currentSlide?.id) return [];
    return simulatedResponses[currentSlide.id] || [];
  }, [simulatedResponses, currentSlide?.id]);

  const hasSubmittedCurrent = currentSlide?.id ? !!studentSubmitted[currentSlide.id] : false;
  const currentFeedback = currentSlide?.id ? studentAnswerFeedback[currentSlide.id] : undefined;

  // Advance / Previous Slide with 5-stage reset
  const handlePrevSlide = () => {
    if (activeSlideIndex > 0) {
      setActiveSlideIndex(activeSlideIndex - 1);
      resetSlideStage();
    }
  };

  const handleNextSlide = () => {
    if (activeSlideIndex < slides.length - 1) {
      setActiveSlideIndex(activeSlideIndex + 1);
      resetSlideStage();
    }
  };

  const resetSlideStage = () => {
    setPreviewStage("READY");
    setStudentIsReady(false);
    setStudentSubmissionSpeed(null);
    setCountdownNum(3);
    setPreview5sTimeLeft(5);
    setActiveQuestionTimer(20);
    setShowWrongStudents(false);
    setStudentSelectedOption(null);
    setStudentWord("");
    setStudentOpenResponse("");
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
    resetSlideStage();
  };

  // Synchronized Countdown Timer (3s)
  useEffect(() => {
    if (previewStage !== "COUNTDOWN") return;
    if (countdownNum > 1) {
      const timer = setTimeout(() => setCountdownNum((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setPreviewStage("QUESTION_ONLY");
        setPreview5sTimeLeft(5);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [previewStage, countdownNum]);

  // Synchronized 5s Question Only Preview
  useEffect(() => {
    if (previewStage !== "QUESTION_ONLY") return;
    if (preview5sTimeLeft > 1) {
      const timer = setTimeout(() => setPreview5sTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setPreviewStage("ACTIVE");
        setActiveQuestionTimer(currentSlide.timeLimit || 20);
        questionStartTimeRef.current = Date.now();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [previewStage, preview5sTimeLeft, currentSlide.timeLimit]);

  // Active Answering Timer
  useEffect(() => {
    if (previewStage !== "ACTIVE") return;
    if (activeQuestionTimer > 0) {
      const timer = setTimeout(() => setActiveQuestionTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setPreviewStage("REVEAL");
    }
  }, [previewStage, activeQuestionTimer]);

  // Send Floating Emoji from Phone to Projector
  const handleSendEmoji = (emoji: string) => {
    const id = `emoji-${Date.now()}-${Math.random()}`;
    const x = Math.floor(20 + Math.random() * 60);
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
      studentName: currentStudentName,
      avatar: phoneSelectedAvatar,
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
      studentName: currentStudentName,
      avatar: phoneSelectedAvatar,
      timestamp: Date.now(),
    };

    setSimulatedResponses((prev) => ({
      ...prev,
      [currentSlide.id]: [...(prev[currentSlide.id] || []), newResp],
    }));
    setStudentOpenResponse("");
    setStudentSubmitted((prev) => ({ ...prev, [currentSlide.id]: true }));
  };

  // FIX 6: Graded Answer Submission with Speed Tracking
  const handleSubmitGradedAnswer = (selectedVal: any) => {
    if (hasSubmittedCurrent) return;

    const elapsed = Date.now() - questionStartTimeRef.current;
    const secStr = (elapsed / 1000).toFixed(2);
    setStudentSubmissionSpeed({ seconds: secStr, ms: elapsed });

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
      studentName: currentStudentName,
      avatar: phoneSelectedAvatar,
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

  // Handle Join Form Submission
  const handleJoinSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setPhoneJoined(true);
    setJoinedCount((prev) => prev + 1);

    // FIX 3: Trigger real-time join popup on Host screen
    const popupId = `join-${Date.now()}`;
    setJoinPopups((prev) => [
      ...prev,
      { id: popupId, name: currentStudentName, avatarId: phoneSelectedAvatar },
    ]);
    setTimeout(() => {
      setJoinPopups((prev) => prev.filter((p) => p.id !== popupId));
    }, 4500);
  };

  // Word Cloud frequencies
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

  // Option stats for MCQ
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

  if (!isOpen || safeSlides.length === 0) return null;

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
          {/* FIX 3: Real-Time Join Animated Popups on Host Stage */}
          <div className="absolute top-4 right-4 z-40 flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
              {joinPopups.map((popup) => (
                <motion.div
                  key={popup.id}
                  initial={{ opacity: 0, x: 50, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 50, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="px-4 py-2.5 rounded-2xl bg-slate-900/95 border-2 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center gap-3 backdrop-blur-md"
                >
                  <RenderColorfulAvatar avatarId={popup.avatarId} size="sm" />
                  <div className="text-left">
                    <p className="text-xs font-black text-white">🎉 {popup.name} জয়েন করেছে!</p>
                    <span className="text-[10px] text-emerald-400 font-bold">● লাইভ যুক্ত হলো</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

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

            {/* FIX 3: Live Joined Counter Badge */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-bold">
                  👥 মোট জয়েন করেছে: <strong className="font-mono font-black">{joinedCount}</strong> জন
                </span>
              </div>
            </div>
          </div>

          {/* Center Stage Presentation Canvas */}
          <div className="flex-1 my-4 flex items-center justify-center overflow-y-auto">
            <div className="w-full max-w-4xl p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-2xl relative space-y-6">
              
              {/* SLIDE TYPE SPECIFIC PROJECTOR RENDERING */}
              
              {/* 0. LEADERBOARD */}
              {currentSlide.type === "LEADERBOARD" && (
                <div className="p-8 rounded-3xl bg-slate-950/80 border-2 border-amber-500/40 text-center space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>🏆 লাইভ লিডারবোর্ড সেশন স্টেজ</span>
                  </div>

                  <div className="flex items-end justify-center gap-4 pt-4">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl mb-1">🥈</span>
                      <span className="text-xs font-bold text-slate-300">তানভীর আহমেদ</span>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">২৮০ পয়েন্ট</span>
                      <div className="w-20 sm:w-24 h-24 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-700 border-t-2 border-slate-400 flex items-center justify-center font-black text-slate-300 text-lg shadow-lg">
                        2
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl mb-1 animate-bounce">👑</span>
                      <span className="text-sm font-black text-amber-300">{currentStudentName}</span>
                      <span className="text-xs text-amber-400 font-mono font-black">৩৫০ পয়েন্ট</span>
                      <div className="w-24 sm:w-28 h-32 rounded-t-2xl bg-gradient-to-t from-amber-600 to-amber-500 border-t-2 border-amber-300 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-amber-500/30">
                        1
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl mb-1">🥉</span>
                      <span className="text-xs font-bold text-slate-300">সাদিয়া আফরিন</span>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">২৩০ পয়েন্ট</span>
                      <div className="w-20 sm:w-24 h-16 rounded-t-2xl bg-gradient-to-t from-amber-900/80 to-amber-800/80 border-t-2 border-amber-700 flex items-center justify-center font-black text-amber-200 text-lg shadow-lg">
                        3
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1. TEXT_SLIDE */}
              {currentSlide.type === "TEXT_SLIDE" && (
                <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-900/50 text-indigo-100 space-y-3 text-center">
                  <h3 className="text-2xl font-black text-white">{currentSlide.title}</h3>
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
                    <span className="text-xs font-bold text-slate-400 block text-center">চিত্র ১</span>
                    <div className="aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                      <img
                        src={currentSlide.imageLeftUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500"}
                        alt="Left Diagram"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 block text-center">চিত্র ২</span>
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
                    wordCloudWords.map((w, idx) => (
                      <span key={idx} className="text-2xl font-black text-cyan-400">
                        {w.text} {w.count > 1 && `(${w.count})`}
                      </span>
                    ))
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
                        <div key={r.id} className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-left space-y-2">
                          <div className="flex items-center gap-2">
                            <RenderColorfulAvatar avatarId={r.avatar} size="xs" />
                            <span className="text-xs font-bold text-slate-300">{r.studentName}</span>
                          </div>
                          <p className="text-xs text-white">{r.payload}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* =====================================================================
                  5. GRADED QUIZZES: EXACT 5-STAGE MENTIMETER / KAHOOT STATE MACHINE
                  ===================================================================== */}
              {isCurrentGraded && (
                <div className="w-full space-y-5">
                  {/* STAGE 1: READY_CHECK */}
                  {previewStage === "READY" && (
                    <div className="p-8 rounded-3xl bg-slate-950/80 border-2 border-amber-500/40 text-center space-y-6">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                        <span>ফেজ ১: প্রস্তুত পর্যায় (READY CHECK)</span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white">
                          ⚡ পরবর্তী কুইজের জন্য কারা রেডি হচ্ছে দেখুন...
                        </h3>
                        <p className="text-xs text-slate-400">
                          শিক্ষার্থীদের মোবাইল স্ক্রিনে "আমি প্রস্তুত!" বাটনে চাপ দিতে বলুন
                        </p>
                      </div>

                      {/* Mentimeter-Style Animated Avatar Cloud */}
                      <div className="min-h-[140px] flex items-center justify-center p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                        {studentIsReady ? (
                          <motion.div
                            initial={{ scale: 0, y: 30 }}
                            animate={{ scale: 1, y: [0, -8, 0] }}
                            transition={{ y: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
                            className="flex flex-col items-center gap-2"
                          >
                            <RenderColorfulAvatar avatarId={phoneSelectedAvatar} size="lg" />
                            <span className="text-xs font-black text-white px-3 py-1 rounded-full bg-slate-900 border border-emerald-500 text-emerald-300 shadow-md">
                              {currentStudentName} ✅
                            </span>
                          </motion.div>
                        ) : (
                          <div className="text-slate-500 text-sm font-bold flex items-center gap-2">
                            <Clock className="w-4 h-4 animate-spin text-amber-400" />
                            <span>শিক্ষার্থী রেডি হওয়ার অপেক্ষায়...</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-black text-amber-400 font-mono">
                          🔥 {studentIsReady ? 1 : 0} / {Math.max(1, joinedCount)} জন রেডি
                        </span>

                        {/* Teacher Trigger Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewStage("COUNTDOWN");
                            setCountdownNum(3);
                          }}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl flex items-center gap-2 cursor-pointer transition active:scale-95 animate-pulse"
                        >
                          <Zap className="w-4 h-4 text-slate-950 fill-current" />
                          <span>🚀 সবাই রেডি — প্রশ্ন শুরু করুন (Start Question)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STAGE 2: COUNTDOWN_321 */}
                  {previewStage === "COUNTDOWN" && (
                    <div className="p-12 rounded-3xl bg-slate-950/90 border-2 border-cyan-500/40 text-center space-y-6">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-xs border border-cyan-500/40">
                        <Radio className="w-4 h-4 text-cyan-400 animate-ping" />
                        <span>সার্ভার সিঙ্ক কাউন্টডাউন</span>
                      </div>
                      <h3 className="text-2xl font-black text-white">প্রশ্ন আসছে — প্রস্তুত হোন!</h3>
                      <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 mx-auto flex items-center justify-center text-7xl font-black text-white shadow-2xl border-4 border-cyan-300/60 animate-pulse">
                        {countdownNum}
                      </div>
                    </div>
                  )}

                  {/* STAGE 3: QUESTION_ONLY (5 Seconds Preview - STRICTLY NO OPTIONS) */}
                  {previewStage === "QUESTION_ONLY" && (
                    <div className="p-10 rounded-3xl bg-slate-950/90 border-2 border-amber-500/40 text-center space-y-6">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40">
                        <Eye className="w-4 h-4 text-amber-400 animate-bounce" />
                        <span>📖 প্রশ্নটি মনোযোগ দিয়ে পড়ো... (৫ সেকেন্ড প্রিভিউ)</span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-black text-white leading-relaxed">
                        {currentSlide.title || "প্রশ্ন টেক্সট"}
                      </h2>

                      {/* 5-Second Animated Progress Bar */}
                      <div className="w-64 h-2 bg-slate-800 rounded-full mx-auto overflow-hidden">
                        <motion.div
                          className="h-full bg-amber-400"
                          initial={{ width: "100%" }}
                          animate={{ width: "0%" }}
                          transition={{ duration: 5, ease: "linear" }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        {preview5sTimeLeft} সেকেন্ড পর অপশন ও টাইমার সক্রিয় হবে
                      </p>
                    </div>
                  )}

                  {/* STAGE 4: ANSWERING_ACTIVE */}
                  {previewStage === "ACTIVE" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                          ⏱️ উত্তর প্রদান পর্যায় চলছে
                        </span>
                        <span className="text-base font-black font-mono text-amber-400 px-3 py-1 rounded-xl bg-slate-900 border border-amber-500/30">
                          ⏳ {activeQuestionTimer}s
                        </span>
                      </div>

                      {/* 1 Signature Fast Template per Question Type */}
                      <UniversalQuizShowcaseEngine
                        question={currentSlide}
                        questionIndex={activeSlideIndex}
                        totalQuestions={slides.length}
                        templateId={1}
                        selectedAnswer={studentSelectedOption}
                        onSelectAnswer={() => {}}
                        isConfirmed={false}
                        disabled={true}
                        autoRandomize={false}
                        showProofBadge={true}
                      />

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                        <span className="text-xs text-slate-400 font-bold">
                          {hasSubmittedCurrent ? "১ জন উত্তর জমা দিয়েছেন" : "শিক্ষার্থীদের উত্তরের অপেক্ষায়..."}
                        </span>

                        <button
                          type="button"
                          onClick={() => setPreviewStage("REVEAL")}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>👁️ ফলাফল প্রকাশ করুন (Reveal Results)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STAGE 5: RESULT_REVEAL (Mentimeter Bar/Pie Chart + Explanation + Speed) */}
                  {previewStage === "REVEAL" && (
                    <div className="p-6 rounded-3xl bg-slate-950/90 border-2 border-indigo-500/40 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/40">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>ফলাফল ও বিশ্লেষণ স্টেজ</span>
                        </div>

                        {/* Chart Switcher */}
                        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setHostChartType("bar")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              hostChartType === "bar"
                                ? "bg-indigo-600 text-white"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>বার চার্ট</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setHostChartType("donut")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              hostChartType === "donut"
                                ? "bg-indigo-600 text-white"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <PieChart className="w-3.5 h-3.5" />
                            <span>ডোনাট চার্ট</span>
                          </button>
                        </div>
                      </div>

                      {/* Mentimeter Bar / Donut Chart */}
                      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 min-h-[140px] flex items-center justify-center">
                        {hostChartType === "bar" ? (
                          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                            {(currentSlide.options || ["Option A", "Option B", "Option C", "Option D"]).map((opt, idx) => {
                              const isCorrect = String(idx) === String(currentSlide.correctAnswer) || opt === currentSlide.correctAnswer;
                              return (
                                <div key={idx} className="flex flex-col items-center gap-2">
                                  <div
                                    className={`w-full rounded-t-xl transition-all ${
                                      isCorrect
                                        ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] h-24"
                                        : "bg-slate-700 h-10"
                                    }`}
                                  />
                                  <span className="text-[11px] font-bold text-slate-300 truncate w-full text-center">
                                    {opt} {isCorrect && "✅"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-4 py-2">
                            <div className="w-24 h-24 rounded-full border-8 border-emerald-500 border-t-rose-500 flex items-center justify-center font-mono font-black text-sm">
                              ১০০%
                            </div>
                            <div className="text-xs space-y-1 text-left">
                              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span>সঠিক উত্তর: {currentSlide.correctAnswer ?? "A"}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Question & Explanation Card */}
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-1.5">
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">ব্যাখ্যা (Explanation):</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {currentSlide.explanation || "এই প্রশ্নের সঠিক উত্তরটি পাঠ্যবই অনুসারে নির্ধারিত হয়েছে।"}
                        </p>
                      </div>

                      {/* List of Correct Students with Speed */}
                      <div className="space-y-2 text-left">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-emerald-400" />
                            <span>🏆 যারা সঠিক উত্তর দিয়েছে ({hasSubmittedCurrent && currentFeedback?.isCorrect ? 1 : 0} জন):</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setShowWrongStudents(!showWrongStudents)}
                            className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                          >
                            {showWrongStudents ? "ভুল তালিকা লুকান" : "👁️ কে ভুল করেছে বা উত্তর দেয়নি দেখুন"}
                          </button>
                        </div>

                        {hasSubmittedCurrent && currentFeedback?.isCorrect ? (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <RenderColorfulAvatar avatarId={phoneSelectedAvatar} size="xs" />
                              <span className="font-black text-white">{currentStudentName}</span>
                            </div>
                            <span className="font-mono text-emerald-300 font-bold">
                              ⚡ {studentSubmissionSpeed ? toBanglaDigits(studentSubmissionSpeed.seconds) : "৩.৪২"} সেকেন্ড
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">কোনো সঠিক উত্তর জমা হয়নি</p>
                        )}

                        {showWrongStudents && (
                          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                            <span>অংশগ্রহণকারী কেউ ভুল উত্তর দেয়নি অথবা সবাই প্রস্তুত আছে।</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
              {!phoneJoined ? "আগে জয়েন করে কুইজে অংশ নিন" : "মোবাইলে অপশনে ক্লিক বা টাইপ করে টেস্ট করুন"}
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

            {/* FIX 2: JOIN FLOW VS ACTIVE SLIDE FLOW */}
            {!phoneJoined ? (
              /* ==========================================
                 PHONE JOIN SCREEN (FIX 2)
                 ========================================== */
              <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col justify-between">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black text-white">লাইভ কুইজে যোগ দিন</h3>
                  <p className="text-[10px] text-slate-400">কোড ও নাম দিয়ে প্রোফাইল তৈরি করুন</p>
                </div>

                {/* 6-Digit PIN with 1-Click Auto Fill */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-300">৬-ডিজিট পিন কোড:</span>
                    <button
                      type="button"
                      onClick={() => setPhonePin("849201")}
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
                    >
                      ⚡ অটো কোড বসান
                    </button>
                  </div>
                  <input
                    type="text"
                    value={phonePin}
                    onChange={(e) => setPhonePin(e.target.value)}
                    placeholder="849201"
                    maxLength={6}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-center text-sm font-mono font-black text-amber-300 focus:outline-none focus:border-cyan-400 tracking-widest"
                  />
                </div>

                {/* Two Name Tabs */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPhoneNameTab("attendance")}
                      className={`py-1.5 rounded-lg font-bold transition ${
                        phoneNameTab === "attendance"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      📋 উপস্থিতি তালিকা
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoneNameTab("manual")}
                      className={`py-1.5 rounded-lg font-bold transition ${
                        phoneNameTab === "manual"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      ✍️ নিজের নাম
                    </button>
                  </div>

                  {phoneNameTab === "attendance" ? (
                    <select
                      value={phoneSelectedStudent}
                      onChange={(e) => {
                        setPhoneSelectedStudent(e.target.value);
                        const match = presentStudents.find((s) => s.name === e.target.value);
                        if (match) setPhoneSelectedAvatar(match.avatarId);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-indigo-400"
                    >
                      {presentStudents.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} (রোল: {s.roll})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={phoneManualName}
                      onChange={(e) => setPhoneManualName(e.target.value)}
                      placeholder="এখানে আপনার নাম লিখুন..."
                      maxLength={25}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                    />
                  )}
                </div>

                {/* 40+ Colorful Avatars Grid */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-300 block">
                    ৪০+ কালারফুল অবতার পছন্দ করুন:
                  </span>
                  <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    {COLORFUL_STUDENT_AVATARS.slice(0, 40).map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setPhoneSelectedAvatar(av.id)}
                        className={`p-1 rounded-xl transition cursor-pointer flex items-center justify-center ${
                          phoneSelectedAvatar === av.id
                            ? "bg-cyan-500/20 ring-2 ring-cyan-400 scale-105"
                            : "hover:bg-slate-800"
                        }`}
                        title={av.name}
                      >
                        <RenderColorfulAvatar avatarId={av.id} size="sm" showGlow={false} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Join Button */}
                <button
                  type="button"
                  onClick={handleJoinSubmit}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RocketIcon className="w-4 h-4" />
                  <span>🚀 জয়েন করুন</span>
                </button>
              </div>
            ) : (
              /* ==========================================
                 ACTIVE SESSION PHONE SCREEN
                 ========================================== */
              <>
                {/* Student Header Inside Phone */}
                <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <RenderColorfulAvatar avatarId={phoneSelectedAvatar} size="xs" />
                    <div>
                      <div className="text-[11px] font-black text-white leading-none">{currentStudentName}</div>
                      <span className="text-[9px] text-emerald-400 font-bold">● লাইভ কানেক্টেড</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">#849201</span>
                </div>

                {/* Scrollable Student Content Area */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3 flex flex-col justify-between">
                  {/* NON-GRADED VIEWS */}
                  {currentSlide.type === "TEXT_SLIDE" && (
                    <div className="space-y-4 my-auto text-center">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-2xl">
                        👀
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white">বোর্ডের দিকে লক্ষ্য করো</h4>
                        <p className="text-[10px] text-slate-400">শিক্ষক এখন স্ক্রিনে বিষয়বস্তু উপস্থাপন করছেন।</p>
                      </div>
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        {["❤️", "🔥", "👏", "🤔"].map((emoji, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendEmoji(emoji)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-lg active:scale-125 transition cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitWord} className="space-y-2">
                          <input
                            type="text"
                            value={studentWord}
                            onChange={(e) => setStudentWord(e.target.value)}
                            placeholder="যেমন: উদ্ভাবন..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                          />
                          <button
                            type="submit"
                            disabled={!studentWord.trim()}
                            className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                          >
                            ☁️ ওয়ার্ড পাঠাও
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* GRADED QUIZ PHONE VIEWS */}
                  {isCurrentGraded && (
                    <div className="my-auto space-y-3">
                      {/* 1. READY CHECK */}
                      {previewStage === "READY" && (
                        <div className="space-y-4 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-3xl">
                            🎯
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-white">পরবর্তী কুইজ আসছে!</h4>
                            <p className="text-[10px] text-slate-400">তুমি কি প্রস্তুত?</p>
                          </div>
                          <button
                            type="button"
                            disabled={studentIsReady}
                            onClick={() => setStudentIsReady(true)}
                            className={`w-full py-3.5 rounded-2xl font-black text-xs shadow-lg transition ${
                              studentIsReady
                                ? "bg-emerald-950/80 border-2 border-emerald-400 text-emerald-300"
                                : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 animate-pulse cursor-pointer"
                            }`}
                          >
                            {studentIsReady ? "✅ আপনি রেডি!" : "🙋‍♂️ আমি প্রস্তুত! (I'm Ready!)"}
                          </button>
                        </div>
                      )}

                      {/* 2. COUNTDOWN 321 */}
                      {previewStage === "COUNTDOWN" && (
                        <div className="space-y-4 text-center py-6">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 mx-auto flex items-center justify-center text-4xl font-black text-white shadow-xl border-2 border-cyan-400 animate-pulse">
                            {countdownNum}
                          </div>
                          <h4 className="text-xs font-black text-cyan-300">মনোযোগ দাও!</h4>
                        </div>
                      )}

                      {/* 3. QUESTION ONLY PREVIEW (NO OPTIONS) */}
                      {previewStage === "QUESTION_ONLY" && (
                        <div className="space-y-3 text-center py-4">
                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                            📖 প্রশ্নটি মনোযোগ দিয়ে পড়ো...
                          </span>
                          <h4 className="text-xs font-bold text-white leading-relaxed">
                            {currentSlide.title}
                          </h4>
                          <div className="w-28 h-1 bg-amber-500/20 rounded-full mx-auto overflow-hidden">
                            <div className="h-full bg-amber-400 animate-pulse" />
                          </div>
                          <p className="text-[9px] text-slate-500">অপশনসমূহ শীঘ্রই উন্মোচিত হবে</p>
                        </div>
                      )}

                      {/* 4. ANSWERING ACTIVE */}
                      {previewStage === "ACTIVE" && (
                        <div>
                          {!hasSubmittedCurrent ? (
                            <div className="space-y-2">
                              <UniversalQuizShowcaseEngine
                                question={currentSlide}
                                questionIndex={activeSlideIndex}
                                totalQuestions={slides.length}
                                templateId={1}
                                selectedAnswer={studentSelectedOption}
                                onSelectAnswer={(ans) => setStudentSelectedOption(ans)}
                                onConfirmAnswer={(ans) => {
                                  setStudentSelectedOption(ans);
                                  handleSubmitGradedAnswer(ans);
                                }}
                                isConfirmed={false}
                                disabled={false}
                                autoRandomize={false}
                                showProofBadge={false}
                              />
                            </div>
                          ) : (
                            /* FIX 6: DEFERRED STUDENT FEEDBACK WAITING CARD */
                            <div className="p-4 rounded-2xl bg-indigo-950/60 border-2 border-cyan-500/40 text-center space-y-2.5 shadow-xl animate-in fade-in">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-black">
                                <Check className="w-3.5 h-3.5 text-cyan-400" />
                                <span>✅ তোমার উত্তর লক করা হয়েছে!</span>
                              </div>
                              <p className="text-xs font-black text-amber-300">
                                ⚡ তুমি <span className="font-mono text-sm text-amber-400 underline">{studentSubmissionSpeed ? toBanglaDigits(studentSubmissionSpeed.seconds) : "৩.৪২"}</span> সেকেন্ডে উত্তর সাবমিট করেছো!
                              </p>
                              <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-300">
                                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                                <span>⏳ সময় শেষ হওয়া পর্যন্ত অপেক্ষা করো...</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 5. RESULT REVEAL */}
                      {previewStage === "REVEAL" && (
                        <div className="space-y-3">
                          {hasSubmittedCurrent ? (
                            currentFeedback?.isCorrect ? (
                              <div className="p-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/60 text-center space-y-2">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center mx-auto text-xl">
                                  🎉
                                </div>
                                <h4 className="text-xs font-black text-emerald-300">সঠিক উত্তর! চমৎকার খেলেছো!</h4>
                                <p className="text-[10px] text-emerald-400 font-bold">+১০০ পয়েন্ট অর্জিত হয়েছে</p>
                                <span className="text-[9px] font-mono text-emerald-300 block">
                                  ⚡ স্পিড: {studentSubmissionSpeed ? toBanglaDigits(studentSubmissionSpeed.seconds) : "৩.৪২"} সেকেন্ড
                                </span>
                              </div>
                            ) : (
                              <div className="p-4 rounded-2xl bg-rose-500/20 border-2 border-rose-500/60 text-center space-y-2">
                                <div className="w-10 h-10 rounded-full bg-rose-500/30 flex items-center justify-center mx-auto text-xl">
                                  ❌
                                </div>
                                <h4 className="text-xs font-black text-rose-300">ভুল উত্তর!</h4>
                                <p className="text-[10px] text-slate-300">
                                  সঠিক উত্তর ছিল: <span className="text-emerald-400 font-bold">{currentSlide.correctAnswer ?? "A"}</span>
                                </p>
                              </div>
                            )
                          ) : (
                            <div className="p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-500/60 text-center space-y-2">
                              <h4 className="text-xs font-black text-amber-300">❌ সময় শেষ — উত্তর দিতে পারোনি!</h4>
                              <p className="text-[10px] text-slate-300">
                                সঠিক উত্তর: <span className="text-emerald-400 font-bold">{currentSlide.correctAnswer ?? "A"}</span>
                              </p>
                            </div>
                          )}
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
              </>
            )}

            {/* Bottom Home Indicator Bar */}
            <div className="h-4 w-full flex items-center justify-center shrink-0">
              <div className="w-24 h-1 rounded-full bg-slate-700" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return <span className={className}>🚀</span>;
}
