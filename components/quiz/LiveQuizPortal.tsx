"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Users,
  Play,
  Trophy,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  XCircle,
  QrCode,
  Smartphone,
  Check,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  AlertCircle,
  Lock,
  Unlock,
  Link,
  X,
  Maximize2,
  Minimize2,
  Copy,
  Radio,
  Zap,
  ShieldCheck,
  Flame,
  Award,
  Send,
  Eye,
  Gamepad as Gamepad2,
  FileSpreadsheet,
  Download,
  Printer
} from "lucide-react";
import QRCode from "qrcode";
import { institutionalDb } from "@/lib/database";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import {
  LiveQuizBroadcastArenaSVG,
  QuizArenaBannerSVG,
  StudentAchievementTrophySVG,
} from "@/components/ui/animated-svgs";
import AiQuizGeneratorModal from "./AiQuizGeneratorModal";
import { BtebQuizQuestion } from "@/lib/quizAiGenerator";
import FloatingReactionOverlay, { emitLiveReaction } from "./FloatingReactionOverlay";
import HostLivePresenter from "./HostLivePresenter";

// Predefined Trade-based Quizzes based on PTSC Academic Structure
interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // 0, 1, 2, or 3
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  trade: string;
  level: string;
  questions: QuizQuestion[];
}

const PRELOADED_QUIZZES: Quiz[] = [
  {
    id: "comp-iot",
    title: "কম্পিউটার ও আইওটি (Computer & IoT Basics)",
    trade: "IT Support & IoT",
    level: "এসএসসি ও এইচএসসি ভোকেশনাল",
    questions: [
      {
        id: 1,
        question: "আইওটি (IoT) এর সঠিক পূর্ণরূপ বা Elaborated Form কোনটি?",
        options: [
          "Internet of Things",
          "Input Output Technology",
          "Internal Operating Tool",
          "Internet of Technology"
        ],
        correctAnswer: 0,
        explanation: "IoT এর পূর্ণরূপ হলো 'Internet of Things'। এটি বিশ্বজুড়ে নেটওয়ার্কযুক্ত ডিভাইসের পারস্পরিক সংযোগ নির্দেশ করে।"
      },
      {
        id: 2,
        question: "কম্পিউটার নেটওয়ার্কে IPv4 এড্রেস কত বিটের হয়ে থাকে?",
        options: [
          "১৬ বিট (16 bits)",
          "৩২ বিট (32 bits)",
          "৬৪ বিট (64 bits)",
          "১২৮ বিট (128 bits)"
        ],
        correctAnswer: 1,
        explanation: "IPv4 এড্রেস ৩২ বিটের হয়ে থাকে যা ডটেড-ডেসিমেল পদ্ধতিতে প্রকাশ করা হয় (যেমন: 192.168.1.1)।"
      },
      {
        id: 3,
        question: "কোন কারিগরি নেটওয়ার্ক ডিভাইসটি এনালগ সংকেতকে ডিজিটালে এবং বিপরীত রূপান্তর করে?",
        options: [
          "হাব (Hub)",
          "রাউটার (Router)",
          "মডেম (Modem)",
          "সুইচ (Switch)"
        ],
        correctAnswer: 2,
        explanation: "মডেম (Modulation-Demodulation) এনালগ সংকেতকে ডিজিটাল এবং ডিজিটালকে এনালগ সংকেতে রূপান্তর করে।"
      },
      {
        id: 4,
        question: "কোন প্রোগ্রামিং ল্যাঙ্গুয়েজটি আরডুইনো (Arduino) মাইক্রোকন্ট্রোলার কোডিংয়ে মূলত ব্যবহৃত হয়?",
        options: [
          "Python",
          "HTML / CSS",
          "C / C++ (Arduino IDE)",
          "Java"
        ],
        correctAnswer: 2,
        explanation: "আরডুইনো মাইক্রোকন্ট্রোলার বোর্ডে প্রোগ্রাম লোড করার জন্য C/C++ এর ওপর ভিত্তি করে তৈরি আরডুইনো স্কেচ ভাষা ব্যবহার করা হয়।"
      }
    ]
  },
  {
    id: "elec-works",
    title: "ইলেকট্রিক্যাল ওয়ার্কস ও সার্কিট (Electrical Works & Safety)",
    trade: "Electrical Works",
    level: "এসএসসি ভোকেশনাল",
    questions: [
      {
        id: 1,
        question: "আন্তর্জাতিক নিয়ম অনুযায়ী বিদ্যুৎ প্রবাহের (Electric Current) পরিমাপের একক কী?",
        options: [
          "ভোল্ট (Volt)",
          "অ্যাম্পিয়ার (Ampere)",
          "ওহম (Ohm)",
          "ওয়াট (Watt)"
        ],
        correctAnswer: 1,
        explanation: "বিদ্যুৎ প্রবাহ বা কারেন্টের পরিমাপের আন্তর্জাতিক একক অ্যাম্পিয়ার (A)।"
      },
      {
        id: 2,
        question: "বৈদ্যুতিক সার্কিটে কোনো পরিবাহীর রেজিস্ট্যান্স (রোধ) পরিমাপের জন্য কোন যন্ত্র ব্যবহৃত হয়?",
        options: [
          "ওহমমিটার (Ohmeter)",
          "ভোল্টমিটার (Voltmeter)",
          "অ্যামিটার (Ammeter)",
          "ওয়াটমিটার (Wattmeter)"
        ],
        correctAnswer: 0,
        explanation: "রোধ বা রেজিস্ট্যান্স পরিমাপের জন্য ওহমমিটার এবং কারেন্ট ও ভোল্টেজ একসাথে পরিমাপের জন্য মাল্টিমিটার ব্যবহৃত হয়।"
      },
      {
        id: 3,
        question: "নিচের কোন উপাদানটি অতি উৎকৃষ্ট বিদ্যুৎ সুপরিবাহী পদার্থ হিসেবে সমাদৃত?",
        options: [
          "শুকনো কাঠ (Dry Wood)",
          "কাঁচ (Glass)",
          "তামা (Copper)",
          "রাবার (Rubber)"
        ],
        correctAnswer: 2,
        explanation: "তামা (Copper) ধাতুটি চমৎকার সুপরিবাহী এবং সহজে নমনীয় হওয়ায় বৈদ্যুতিক ক্যাবল ও কন্ডাক্টর হিসেবে সর্বাধিক ব্যবহৃত হয়।"
      }
    ]
  },
  {
    id: "fourth-ir",
    title: "চতুর্থ শিল্পবিপ্লব ও সাধারণ কারিগরি জ্ঞান",
    trade: "সকল ট্রেড ও সাধারণ",
    level: "৬ষ্ঠ হতে ১২শ শ্রেণি সবার জন্য",
    questions: [
      {
        id: 1,
        question: "চতুর্থ শিল্পবিপ্লব (4th Industrial Revolution) এর মূল চালিকাশক্তি বা ভিত্তি কোনটি?",
        options: [
          "বাষ্পীয় ইঞ্জিন ও যান্ত্রিকীকরণ",
          "বিদ্যুৎ আবিষ্কার ও গণ-উৎপাদন",
          "কৃত্রিম বুদ্ধিমত্তা, আইওটি ও ক্লাউড কম্পিউটিং",
          "মুদ্রণ যন্ত্র ও সংবাদপত্র শিল্পের বিকাশ"
        ],
        correctAnswer: 2,
        explanation: "চতুর্থ শিল্পবিপ্লবের মূল ভিত্তি হলো সাইবার-ফিজিক্যাল সিস্টেম, এআই (AI), বিগ ডাটা, ক্লাউড কম্পিউটিং এবং আইওটি।"
      },
      {
        id: 2,
        question: "বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) কত সালে রাষ্ট্রীয় আইন দ্বারা প্রতিষ্ঠিত হয়?",
        options: [
          "১৯৬৭ সালে",
          "১৯৭২ সালে",
          "১৯৮৫ সালে",
          "১৯৯৯ সালে"
        ],
        correctAnswer: 0,
        explanation: "১৯৬৭ সালের কারিগরি শিক্ষা বোর্ড আইন অনুযায়ী বাংলাদেশে কারিগরি শিক্ষার উন্নয়ন ও নিয়ন্ত্রণে এই স্বায়ত্তশাসিত বোর্ডটি গঠিত হয়।"
      }
    ]
  }
];

export const ALL_36_AVATARS = [
  "🤖", "💻", "⚡", "🔧", "⚙️", "🚀", "🛰️", "📡", "🔋", "🔌", "🕹️", "🔬",
  "🧠", "💡", "🔥", "💥", "☄️", "🌪️", "🔮", "🧬", "🔭", "🎯", "🏆", "👑",
  "🐯", "🦁", "🦅", "🐺", "🦊", "🐼", "🦖", "🦈", "🥷", "🦸", "🧙", "⭐"
];

// Real students only - hardcoded fake student bots removed
const SIMULATED_STUDENTS: { name: string; avatar: string }[] = [];

import LiveQuizArena from "./LiveQuizArena";

type QuizState = "setup" | "lobby" | "presentation" | "question" | "answer-stats" | "leaderboard" | "podium";

// Pure helper functions for random generator to satisfy React Hooks purity/idempotency rules
const generateGamePin = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getRandomAnswerDelay = (): number => {
  return 1000 + Math.random() * 11000;
};

const getIsCorrectAnswerSimulated = (): boolean => {
  return Math.random() > 0.3;
};

const getRandomWrongOptionSimulated = (correctAnswer: number): number => {
  return (correctAnswer + Math.floor(Math.random() * 3) + 1) % 4;
};

const getRandomPointsGainedSimulated = (): number => {
  return Math.round(800 + Math.random() * 200);
};

const getRandomUnusedStudent = (joinedNames: string[]): { name: string; avatar: string } | null => {
  const unused = SIMULATED_STUDENTS.filter(stu => !joinedNames.includes(stu.name));
  if (unused.length === 0) return null;
  return unused[Math.floor(Math.random() * unused.length)];
};

interface LiveQuizPortalProps {
  initialSection?: "dashboard" | "my_quizzes" | "create_quiz" | "question_bank" | "ai_generator";
  onLiveStateChange?: (isLive: boolean) => void;
  onExitLive?: () => void;
}

export default function LiveQuizPortal({
  initialSection = "dashboard",
  onLiveStateChange,
  onExitLive,
}: LiveQuizPortalProps) {
  const [gameState, setGameState] = useState<QuizState>("setup");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz>(PRELOADED_QUIZZES[0]);
  const [presentationSlides, setPresentationSlides] = useState<any[]>([]);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [gamePin, setGamePin] = useState("");
  const [joinedPlayers, setJoinedPlayers] = useState<{ id?: string; name: string; avatar: string; score: number; streak: number; connectionStatus?: string }[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [answersCount, setAnswersCount] = useState(0);
  const [questionStatus, setQuestionStatus] = useState<"running" | "ended">("running");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [motivationEnabled, setMotivationEnabled] = useState(true);
  const [motivationInterval, setMotivationInterval] = useState(3);
  
  // To show simulated active feedback of players answering
  const [playerSubmissions, setPlayerSubmissions] = useState<Record<string, number>>({}); // playerName: optionIndex
  const [activePlayerStats, setActivePlayerStats] = useState<{ optionCount: number[] }>({ optionCount: [0, 0, 0, 0] });

  // Phase 30 Authoritative Host Question Sequence States
  const [hostSequencePhase, setHostSequencePhase] = useState<"READY" | "COUNTDOWN" | "QUESTION_PREVIEW" | "QUESTION_ACTIVE" | "QUESTION_ENDED">("COUNTDOWN");
  const [hostCountdownSec, setHostCountdownSec] = useState(3);
  const [hostPreviewSec, setHostPreviewSec] = useState(3);

  // Pre-Quiz Interactive Hub States (Pre-Quiz vs Actual Quiz Rule)
  const [preQuizPrompt, setPreQuizPrompt] = useState("");
  const [preQuizType, setPreQuizType] = useState<"icebreaker" | "poll" | "survey" | "message">("icebreaker");
  const [preQuizOptions, setPreQuizOptions] = useState<string[]>(["হ্যাঁ, পুরোপুরি প্রস্তুত!", "মোটামুটি প্রস্তুত", "কিছুটা নার্ভাস"]);
  const [hostActivePreQuiz, setHostActivePreQuiz] = useState<any | null>(null);
  const [isSendingPreQuiz, setIsSendingPreQuiz] = useState(false);

  // Phase 4 Backend Live Session States
  const [sessionId, setSessionId] = useState("");
  const [isLobbyLocked, setIsLobbyLocked] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useRealDbSync, setUseRealDbSync] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isAuditLogsExpanded, setIsAuditLogsExpanded] = useState(false);

  // Score Archiving & Results Modal States
  const [isSessionArchived, setIsSessionArchived] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [archivedSessionData, setArchivedSessionData] = useState<any | null>(null);

  // Phase 6A: Student Join Experience States
  const [showStudentJoinModal, setShowStudentJoinModal] = useState(false);
  const [studentInputPin, setStudentInputPin] = useState("");
  const [studentInputName, setStudentInputName] = useState("");
  const [studentSelectedAvatar, setStudentSelectedAvatar] = useState("🐧");
  const [studentJoinStatus, setStudentJoinStatus] = useState<"idle" | "joining" | "joined" | "error">("idle");
  const [studentJoinError, setStudentJoinError] = useState("");
  const [studentJoinedData, setStudentJoinedData] = useState<{ id: string; name: string; avatar: string } | null>(null);

  // Student Live Interactive & Mentimeter Screen States (Matching Reference Video)
  const [studentSubmittedAnswer, setStudentSubmittedAnswer] = useState<number | string | null>(null);
  const [studentAnswerTime, setStudentAnswerTime] = useState<number>(0);
  const [studentAnswerCorrect, setStudentAnswerCorrect] = useState<boolean | null>(null);
  const [studentTypedInput, setStudentTypedInput] = useState<string>("");
  const [studentCommentDrawerOpen, setStudentCommentDrawerOpen] = useState<boolean>(false);
  const [studentCommentText, setStudentCommentText] = useState<string>("");
  const [studentCommentSentMsg, setStudentCommentSentMsg] = useState<string | null>(null);
  const [studentQaModalOpen, setStudentQaModalOpen] = useState<boolean>(false);
  const [studentQaInput, setStudentQaInput] = useState<string>("");
  const [studentQaSentMsg, setStudentQaSentMsg] = useState<string | null>(null);
  const [liveSessionComments, setLiveSessionComments] = useState<{ id: string; name: string; avatar: string; text: string; time: string }[]>([
    { id: "c-init-1", name: "তানভীর আহমেদ", avatar: "🐧", text: "Amazing! 😍", time: "08:51" },
    { id: "c-init-2", name: "সুমাইয়া খাতুন", avatar: "💻", text: "Woohoo! 🥳", time: "08:52" },
  ]);
  const [liveSessionQuestions, setLiveSessionQuestions] = useState<{ id: string; name: string; avatar: string; text: string; time: string }[]>([]);
  const [studentRating, setStudentRating] = useState<number>(5);
  const [studentRated, setStudentRated] = useState<boolean>(false);

  // Reset student submission on each new question
  useEffect(() => {
    setStudentSubmittedAnswer(null);
    setStudentAnswerTime(0);
    setStudentAnswerCorrect(null);
    setStudentTypedInput("");
  }, [currentQuestionIdx, gameState]);

  const handleStudentAnswerSubmit = (optionIndex: number | string) => {
    if (studentSubmittedAnswer !== null) return;
    playSound("click");
    const timeTaken = Math.max(1, 20 - timeLeft);
    const timeTakenFormatted = (timeTaken + Math.random() * 0.9).toFixed(2);
    const currentQ = selectedQuiz.questions[currentQuestionIdx];
    if (!currentQ) return;
    let isCorrect = false;

    if (typeof optionIndex === "number") {
      isCorrect = optionIndex === currentQ.correctAnswer;
    } else {
      const correctOpt = currentQ.options[currentQ.correctAnswer] || "";
      isCorrect =
        optionIndex.trim().toLowerCase() === correctOpt.trim().toLowerCase() ||
        currentQ.options.some((opt) => opt.trim().toLowerCase() === optionIndex.trim().toLowerCase());
    }

    setStudentSubmittedAnswer(optionIndex);
    setStudentAnswerTime(parseFloat(timeTakenFormatted));
    setStudentAnswerCorrect(isCorrect);

    const studentName = studentJoinedData?.name || studentInputName || "শিক্ষার্থী";
    const points = isCorrect ? Math.round(1000 - timeTaken * 25) : 0;

    // Update host state
    setAnswersCount((prev) => prev + 1);
    if (typeof optionIndex === "number") {
      setPlayerSubmissions((prev) => ({ ...prev, [studentName]: optionIndex }));
      setActivePlayerStats((prev) => {
        const nextCounts = [...prev.optionCount];
        if (nextCounts[optionIndex] !== undefined) {
          nextCounts[optionIndex] += 1;
        }
        return { optionCount: nextCounts };
      });
    }

    // Update joinedPlayers score
    setJoinedPlayers((prev) =>
      prev.map((p) => {
        if (p.name === studentName) {
          return {
            ...p,
            score: p.score + points,
            streak: isCorrect ? p.streak + 1 : 0,
          };
        }
        return p;
      })
    );

    if (isCorrect) {
      playSound("chime");
    } else {
      playSound("beep");
    }
  };

  const handleStudentReaction = (key: string) => {
    emitLiveReaction(key);
    playSound("click");
  };

  const handleSendComment = (text: string) => {
    if (!text.trim()) return;
    const newComment = {
      id: `c-${Date.now()}`,
      name: studentJoinedData?.name || studentInputName || "শিক্ষার্থী",
      avatar: studentJoinedData?.avatar || "🐧",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setLiveSessionComments((prev) => [newComment, ...prev.slice(0, 19)]);
    setStudentCommentSentMsg(text.trim());
    setStudentCommentText("");
    playSound("success");
    setTimeout(() => {
      setStudentCommentSentMsg(null);
      setStudentCommentDrawerOpen(false);
    }, 1800);
  };

  const handleSendQaQuestion = (text: string) => {
    if (!text.trim()) return;
    const newQa = {
      id: `qa-${Date.now()}`,
      name: studentJoinedData?.name || studentInputName || "শিক্ষার্থী",
      avatar: studentJoinedData?.avatar || "🐧",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setLiveSessionQuestions((prev) => [newQa, ...prev.slice(0, 19)]);
    setStudentQaSentMsg("আপনার প্রশ্নটি উপস্থাপকের কাছে পাঠানো হয়েছে!");
    setStudentQaInput("");
    playSound("success");
    setTimeout(() => {
      setStudentQaSentMsg(null);
      setStudentQaModalOpen(false);
    }, 2000);
  };

  // Phase 6B: Gemini AI Quiz Generator Modal State
  const [showAiGeneratorModal, setShowAiGeneratorModal] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sync live state with parent
  useEffect(() => {
    onLiveStateChange?.(gameState !== "setup");
  }, [gameState, onLiveStateChange]);

  // Phase 30: Confetti & Celebration Effect on Reveal & Podium (Requirement 1 - গ)
  useEffect(() => {
    if (gameState === "answer-stats") {
      playSound("success");
      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.65 },
          colors: ["#10b981", "#06b6d4", "#f59e0b", "#ec4899", "#8b5cf6"]
        });
        const t = setTimeout(() => {
          confetti({
            particleCount: 65,
            angle: 60,
            spread: 55,
            origin: { x: 0.1, y: 0.7 }
          });
          confetti({
            particleCount: 65,
            angle: 120,
            spread: 55,
            origin: { x: 0.9, y: 0.7 }
          });
        }, 250);
        return () => clearTimeout(t);
      } catch (e) {
        console.warn("Answer reveal confetti failed", e);
      }
    } else if (gameState === "podium") {
      playSound("fanfare");
      try {
        confetti({
          particleCount: 140,
          spread: 85,
          origin: { y: 0.6 }
        });
        const t1 = setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 60,
            origin: { x: 0, y: 0.65 }
          });
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 60,
            origin: { x: 1, y: 0.65 }
          });
        }, 500);
        const t2 = setTimeout(() => {
          confetti({
            particleCount: 110,
            spread: 100,
            origin: { y: 0.45 }
          });
        }, 1200);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      } catch (e) {
        console.warn("Confetti effect failed", e);
      }
    }
  }, [gameState]);

  // Phase 30: Countdown warning beep when time is running out
  useEffect(() => {
    if (gameState === "question" && timeLeft <= 5 && timeLeft > 0 && soundEnabled) {
      playSound("countdown");
    }
  }, [timeLeft, gameState, soundEnabled]);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn("Fullscreen toggle failed", e);
    }
  };

  const handleExitLive = () => {
    if (confirm("আপনি কি লাইভ সেশন বন্ধ করে অ্যাডমিন ড্যাশবোর্ডে ফিরতে চান?")) {
      cancelSession();
      onExitLive?.();
    }
  };

  // Play simulated sound effects via Web Audio API (so no external assets are required)
  const playSound = (type: "beep" | "countdown" | "success" | "fanfare" | "click" | "chime") => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "beep") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "countdown") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "fanfare") {
        // Play triumphant minor-to-major sequence
        const freqs = [523, 659, 784, 1046];
        freqs.forEach((f, index) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime(f, ctx.currentTime + index * 0.12);
          g.gain.setValueAtTime(0.12, ctx.currentTime + index * 0.12);
          g.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + index * 0.12 + 0.3);
          o.start(ctx.currentTime + index * 0.12);
          o.stop(ctx.currentTime + index * 0.12 + 0.3);
        });
      }
    } catch (e) {
      console.warn("Web Audio API not supported or blocked by browser policies.");
    }
  };

  // Generate game Pin and launch lobby
  const startLobby = async (quiz: any) => {
    playSound("success");
    setSelectedQuiz(quiz);
    setJoinedPlayers([]);

    // Fetch full quiz details including presentationSlides if possible
    if (quiz.id && !quiz.id.startsWith("comp-") && !quiz.id.startsWith("elec-") && !quiz.id.startsWith("fourth-")) {
      try {
        const res = await fetch(`/api/quizzes/${quiz.id}`);
        const data = await res.json();
        if (data.success && data.quiz) {
          if (data.quiz.presentationSlides) {
            setPresentationSlides(data.quiz.presentationSlides);
          }
        }
      } catch (e) {
        console.warn("Could not fetch presentation slides, using defaults if any.");
      }
    }

    // Immediately generate initial pin so UI renders PIN and Code instantly without blank state
    const initialPin = generateGamePin();
    setGamePin(initialPin);
    setGameState("lobby");

    try {
      let res = await fetch("/api/live-quizzes/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          hostUserId: 3, // Mahmudul Hasan (Teacher)
          motivationEnabled,
          motivationInterval
        })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch("/api/live-quiz/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId: quiz.id,
            hostUserId: 3,
            motivationEnabled,
            motivationInterval
          })
        }).catch(() => null);
      }

      let data: any = null;
      if (res && res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await res.json().catch(() => null);
        }
      }

      if (data && data.success && data.session) {
        const pin = data.session.sessionCode || initialPin;
        const sId = data.session.id;

        setGamePin(pin);
        setSessionId(sId);
        setIsLobbyLocked(false);
        setUseRealDbSync(true);

        // Generate the join URL
        const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/quiz/join?pin=${pin}` : `/quiz/join?pin=${pin}`;

        // Generate QR code base64 data URL
        try {
          const qrUrl = await QRCode.toDataURL(joinUrl, {
            margin: 1.5,
            width: 250,
            color: {
              dark: "#0f172a",
              light: "#ffffff"
            }
          });
          setQrCodeUrl(qrUrl);
        } catch (qrErr) {
          console.warn("QR code generation warning:", qrErr);
        }
      } else {
        setUseRealDbSync(false);
      }
    } catch (error) {
      console.warn("Live session initialization fell back to local state:", error);
      setUseRealDbSync(false);
    }
  };

  const handleNextSlide = async () => {
    if (currentSlideIdx < presentationSlides.length - 1) {
      const nextIdx = currentSlideIdx + 1;
      setCurrentSlideIdx(nextIdx);
      if (useRealDbSync && sessionId) {
        await fetch(`/api/live-quizzes/sessions/${sessionId}/presentation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set_slide", slideIndex: nextIdx })
        });
      }
    } else {
      handleStartActualQuiz();
    }
  };

  const handleStartActualQuiz = async () => {
    if (useRealDbSync && sessionId) {
      const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/start`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setGameState("question");
        setCurrentQuestionIdx(0);
        setTimeLeft((selectedQuiz.questions[0] as any)?.timeLimit || 20);
        setQuestionStatus("running");
        // Start local timer if not already running via polling
        if (!timerRef.current) {
          timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1) {
                if (timerRef.current) clearInterval(timerRef.current);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    } else {
      setGameState("question");
      setCurrentQuestionIdx(0);
      setTimeLeft(20);
      setQuestionStatus("running");
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  async function endQuestion() {
    playSound("success");
    setQuestionStatus("ended");
    if (timerRef.current) clearInterval(timerRef.current);

    if (useRealDbSync && sessionId) {
      try {
        await fetch(`/api/live-quizzes/sessions/${sessionId}/end-question`, {
          method: "POST"
        });
      } catch (e) {
        console.error("Error ending question on server:", e);
      }
    }

    if (!useRealDbSync) {
      // Calculate scores based on accuracy and speed of response (Simulated)
      setJoinedPlayers((prevPlayers) => {
        const updated = prevPlayers.map((player) => {
          const playerAns = playerSubmissions[player.name];
          const correctAns = selectedQuiz.questions[currentQuestionIdx].correctAnswer;
          
          if (playerAns === correctAns) {
            const pointsGained = getRandomPointsGainedSimulated();
            return {
              ...player,
              score: player.score + pointsGained,
              streak: player.streak + 1
            };
          } else {
            return {
              ...player,
              streak: 0
            };
          }
        });
        return updated.sort((a, b) => b.score - a.score);
      });
    }

    setGameState("answer-stats");
  }

  // Real-time polling effect to keep lobby & gameplay synced
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let tickCount = 0;

    if (gameState !== "setup" && sessionId && useRealDbSync) {
      const fetchLobbyStatus = async () => {
        try {
          const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/realtime?isHost=true`).catch(() => null);
          if (!res || !res.ok) return;
          const ct = res.headers.get("content-type") || "";
          if (!ct.includes("application/json")) return;
          const data = await res.json().catch(() => null);
          if (!data || !data.success) return;

          if (data.success) {
            const players = (data.participants || []).map((p: any) => ({
              id: p.id,
              name: p.displayName,
              avatar: p.avatar || "🤖",
              score: p.score || 0,
              streak: p.streak || 0,
              isRealPlayer: true,
              connectionStatus: p.connectionStatus || "online"
            }));
            setJoinedPlayers(players);
            setIsLobbyLocked(data.isLocked);
            if (data.activePreQuizActivity !== undefined) {
              setHostActivePreQuiz(data.activePreQuizActivity);
            }

            // Fetch presence & audit logs every 2 ticks (approx 3 seconds)
            tickCount++;
            if (tickCount % 2 === 0) {
              try {
                const presenceRes = await fetch(`/api/live-quizzes/sessions/${sessionId}/presence`).catch(() => null);
                if (presenceRes && presenceRes.ok && (presenceRes.headers.get("content-type") || "").includes("application/json")) {
                  const presenceData = await presenceRes.json().catch(() => null);
                  if (presenceData && presenceData.success) {
                    if (presenceData.auditLogs) {
                      setAuditLogs(presenceData.auditLogs);
                    }
                    // Update player connection status with high-precision presence states
                    if (presenceData.participants && presenceData.participants.length > 0) {
                      setJoinedPlayers(prev => prev.map(p => {
                        const matched = presenceData.participants.find((mp: any) => mp.id === p.id);
                        return matched ? { ...p, connectionStatus: matched.connectionStatus } : p;
                      }));
                    }
                  }
                }
              } catch (err) {
                console.warn("Error fetching presence/audit logs:", err);
              }
            }

            // Synchronize current active question details
            if (gameState === "question") {
              setAnswersCount(data.answeredCount);

              if (data.sequenceState) {
                if (data.sequenceState.phase === "COUNTDOWN") {
                  setHostSequencePhase("COUNTDOWN");
                  setHostCountdownSec(data.sequenceState.countdownSecondsRemaining);
                } else if (data.sequenceState.phase === "QUESTION_PREVIEW") {
                  setHostSequencePhase("QUESTION_PREVIEW");
                  setHostPreviewSec(data.sequenceState.previewSecondsRemaining);
                } else if (data.sequenceState.phase === "QUESTION_ACTIVE") {
                  setHostSequencePhase("QUESTION_ACTIVE");
                }
              }

              if (data.questionEndsAt) {
                const serverTime = new Date(data.serverTime).getTime();
                const endsAt = new Date(data.questionEndsAt).getTime();
                const clientNow = Date.now();
                const offset = serverTime - clientNow;
                const remaining = Math.max(0, Math.ceil((endsAt - (Date.now() + offset)) / 1000));
                
                setTimeLeft(remaining);

                if (remaining === 0 && questionStatus === "running") {
                  endQuestion();
                }
              }

              if (data.status === "QUESTION_ENDED" && questionStatus === "running") {
                setQuestionStatus("ended");
                if (timerRef.current) clearInterval(timerRef.current);
                setGameState("answer-stats");
              }
            }
          }
        } catch (error) {
          console.error("Error polling lobby status:", error);
        }
      };

      fetchLobbyStatus();
      // 70+ Concurrency Smart Polling: 4000ms in lobby, 2500ms during question
      const pollingInterval = gameState === "lobby" ? 4000 : 2500;
      interval = setInterval(fetchLobbyStatus, pollingInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState, sessionId, useRealDbSync, questionStatus]);

  // Kick a participant from the lobby
  const kickPlayer = async (participantId: string) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          action: "kick"
        })
      }).catch(() => null);
      if (res && res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
        const data = await res.json().catch(() => null);
        if (data?.success) {
          playSound("beep");
          setJoinedPlayers(prev => prev.filter(p => (p as any).id !== participantId));
        }
      }
    } catch (error) {
      console.warn("Error kicking player:", error);
    }
  };

  // Lock or unlock lobby
  const toggleLobbyLock = async () => {
    if (!sessionId) return;
    try {
      const newLockState = !isLobbyLocked;
      const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isLocked: newLockState
        })
      }).catch(() => null);
      if (res && res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
        const data = await res.json().catch(() => null);
        if (data?.success) {
          setIsLobbyLocked(newLockState);
          playSound("click");
        }
      } else {
        setIsLobbyLocked(newLockState);
      }
    } catch (error) {
      console.warn("Error toggling lock:", error);
    }
  };

  // Cancel/disband current session
  const cancelSession = async () => {
    if (sessionId) {
      try {
        await fetch(`/api/live-quizzes/sessions/${sessionId}/cancel`, {
          method: "POST"
        }).catch(() => null);
      } catch (e) {
        console.warn("Error cancelling session:", e);
      }
    }
    setGameState("setup");
    setSessionId("");
    setGamePin("");
    setJoinedPlayers([]);
    setQrCodeUrl("");
  };

  // Simulate a student joining the real backend for preview testing
  const handleSimulateRealJoin = async () => {
    if (!gamePin) return;
    try {
      const joinedNames = joinedPlayers.map(p => p.name);
      const student = getRandomUnusedStudent(joinedNames);
      if (!student) return;

      const res = await fetch("/api/live-quizzes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionCode: gamePin,
          displayName: student.name,
          avatar: student.avatar || "🤖",
        })
      }).catch(() => null);
      if (res && res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
        const data = await res.json().catch(() => null);
        if (data?.success) {
          playSound("click");
        }
      }
    } catch (e) {
      console.warn("Failed to simulate real join:", e);
    }
  };

  // Phase 6A: Student Avatar Selection & Sound Feedback
  const selectAvatar = (av: string) => {
    setStudentSelectedAvatar(av);
    playSound("click");
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(25);
    }
  };

  // Phase 6A: Student Join Submit Handler
  const handleStudentJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = studentInputPin.trim().replace(/\D/g, "");
    const cleanName = studentInputName.trim();

    if (!cleanPin || cleanPin.length < 4) {
      setStudentJoinError("সঠিক ৪-৬ ডিজিটের গেম পিন প্রদান করুন।");
      return;
    }
    if (!cleanName) {
      setStudentJoinError("আপনার নাম বা রোল নম্বর লিখুন।");
      return;
    }

    setStudentJoinStatus("joining");
    setStudentJoinError("");

    try {
      const res = await fetch("/api/live-quizzes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionCode: cleanPin,
          displayName: cleanName,
          avatar: studentSelectedAvatar,
        }),
      }).catch(() => null);

      let data: any = null;
      if (res && res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
        data = await res.json().catch(() => null);
      }

      if (data && data.success) {
        playSound("success");
        setStudentJoinStatus("joined");
        setStudentJoinedData({
          id: data.participant?.id || `player-${Date.now()}`,
          name: cleanName,
          avatar: studentSelectedAvatar,
        });
      } else {
        playSound("beep");
        setStudentJoinStatus("error");
        setStudentJoinError(data?.message || "লবিতে যুক্ত হতে সমস্যা হয়েছে।");
      }
    } catch {
      // In-memory preview fallback
      playSound("success");
      setStudentJoinStatus("joined");
      setStudentJoinedData({
        id: `player-${Date.now()}`,
        name: cleanName,
        avatar: studentSelectedAvatar,
      });
      setJoinedPlayers(prev => [
        ...prev,
        {
          id: `player-${Date.now()}`,
          name: cleanName,
          avatar: studentSelectedAvatar,
          score: 0,
          streak: 0,
          connectionStatus: "online",
        }
      ]);
    }
  };

  // Pre-Quiz Activity Handlers (Host can send as many icebreakers, polls, messages as desired)
  const sendPreQuizActivity = async (customPrompt?: string, customType?: string, customOpts?: string[]) => {
    const promptToSend = customPrompt || preQuizPrompt;
    const typeToSend = customType || preQuizType;
    const optionsToSend = customOpts || (typeToSend === "poll" ? preQuizOptions : []);

    if (!promptToSend.trim()) return;
    setIsSendingPreQuiz(true);

    if (useRealDbSync && sessionId) {
      try {
        const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/pre-quiz`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_activity",
            type: typeToSend,
            prompt: promptToSend,
            options: optionsToSend
          })
        }).catch(() => null);
        if (res && res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
          const data = await res.json().catch(() => null);
          if (data?.success) {
            setHostActivePreQuiz(data.activity);
            playSound("chime");
          }
        }
      } catch (e) {
        console.warn("Error creating pre-quiz activity:", e);
      }
    } else {
      // Local simulation mode
      const act = {
        id: `sim-pre-${Date.now()}`,
        type: typeToSend,
        prompt: promptToSend,
        options: optionsToSend,
        responses: [],
        isActive: true,
        createdAt: new Date().toISOString()
      };
      setHostActivePreQuiz(act);
      playSound("chime");

      // In simulation mode, simulate some student replies after 1.5s
      setTimeout(() => {
        joinedPlayers.slice(0, 4).forEach((player, i) => {
          setTimeout(() => {
            const simulatedReply = typeToSend === "poll" 
              ? optionsToSend[i % optionsToSend.length]
              : ["আমি প্রস্তুত স্যার!", "ভবিষ্যতে ইঞ্জিনিয়ার হতে চাই", "পঞ্চগড় সদর থেকে"][i % 3];
            setHostActivePreQuiz((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                responses: [...(prev.responses || []), {
                  playerId: player.id || player.name,
                  playerName: player.name,
                  response: simulatedReply,
                  submittedAt: new Date().toISOString()
                }]
              };
            });
          }, i * 1200);
        });
      }, 1500);
    }

    setIsSendingPreQuiz(false);
    setPreQuizPrompt("");
  };

  const closePreQuizActivity = async () => {
    if (useRealDbSync && sessionId) {
      try {
        await fetch(`/api/live-quizzes/sessions/${sessionId}/pre-quiz`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "close_activity" })
        });
      } catch (e) {
        console.error("Error closing pre-quiz activity:", e);
      }
    }
    setHostActivePreQuiz(null);
  };

  // Start the actual live quiz question (Transitions to Competitive Quiz Mode)
  const startQuizGame = async () => {
    playSound("fanfare");
    setHostActivePreQuiz(null);
    if (useRealDbSync && sessionId) {
      try {
        const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/start`, {
          method: "POST"
        }).catch(() => null);
        let data: any = null;
        if (res && res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
          data = await res.json().catch(() => null);
        }
        if (data?.success) {
          setCurrentQuestionIdx(0);
          setGameState("question");
          loadQuestion(0);
        } else {
          // If server call didn't succeed, smoothly start locally without alert blocking
          setCurrentQuestionIdx(0);
          setGameState("question");
          loadQuestion(0);
        }
      } catch (err) {
        console.warn("Falling back to local quiz start:", err);
        setCurrentQuestionIdx(0);
        setGameState("question");
        loadQuestion(0);
      }
    } else {
      setCurrentQuestionIdx(0);
      setGameState("question");
      loadQuestion(0);
    }
  };

  const loadQuestion = (questionIdx: number) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const currentQ = selectedQuiz.questions[questionIdx] as any;
    const isCompetitive = currentQ?.isQuizPart !== false && !["word_cloud", "open_ended", "scales_rating", "qa_slide"].includes(currentQ?.type || currentQ?.questionType);
    const questionTimeLimit = currentQ?.timeLimit || 20;

    setTimeLeft(isCompetitive ? questionTimeLimit : 0);
    setAnswersCount(0);
    setPlayerSubmissions({});
    setActivePlayerStats({ optionCount: [0, 0, 0, 0] });
    setQuestionStatus("running");

    // Requirement 2: Non-Timed / Icebreaker Flow (no countdown, no points pressure)
    if (!isCompetitive) {
      setHostSequencePhase("QUESTION_ACTIVE");
      playSound("chime");
      return;
    }

    // Requirement 1: Step-by-Step Kahoot/Mentimeter Game Flow
    // Step 1: "Get Ready!" (প্রস্তুতি পর্যায় - 1.8s)
    setHostSequencePhase("READY");
    setHostCountdownSec(3);
    setHostPreviewSec(3);
    playSound("beep");

    const readyTimer = setTimeout(() => {
      // Step 2: "3... 2... 1..." (উত্তেজনাপূর্ণ কাউন্টডাউন)
      setHostSequencePhase("COUNTDOWN");
      playSound("countdown");

      let count = 3;
      const countdownTimer = setInterval(() => {
        count -= 1;
        setHostCountdownSec(count);
        if (count > 0) {
          playSound("countdown");
        } else {
          clearInterval(countdownTimer);
          // Step 3: লাইভ প্রশ্ন ও উত্তর পর্ব (Active Question & Options with Timer)
          startHostMainTimer(questionTimeLimit, questionIdx);
        }
      }, 1000);
      timerRef.current = countdownTimer;
    }, 1800);

    timerRef.current = readyTimer as any;
  };

  const startHostMainTimer = (duration: number, questionIdx: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setHostSequencePhase("QUESTION_ACTIVE");
    setTimeLeft(duration);
    playSound("fanfare");

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (!useRealDbSync) {
            endQuestion();
          }
          return 0;
        }
        if (prev <= 5) {
          playSound("countdown");
        }
        return prev - 1;
      });
    }, 1000);

    // Simulate real-time player response submissions ONLY in simulation mode
    if (!useRealDbSync) {
      simulatePlayerSubmissions(questionIdx);
    }
  };

  const skipHostCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const questionTimeLimit = (selectedQuiz.questions[currentQuestionIdx] as any).timeLimit || 20;
    startHostMainTimer(questionTimeLimit, currentQuestionIdx);
  };

  const skipHostPreview = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const questionTimeLimit = (selectedQuiz.questions[currentQuestionIdx] as any).timeLimit || 20;
    startHostMainTimer(questionTimeLimit, currentQuestionIdx);
  };

  const simulatePlayerSubmissions = (questionIdx: number) => {
    const currentQuestion = selectedQuiz.questions[questionIdx];
    let submitted = 0;
    const optionDistribution = [0, 0, 0, 0];

    joinedPlayers.forEach((player, idx) => {
      // Staggered submission
      const delay = getRandomAnswerDelay(); // Answer within 12 seconds
      setTimeout(() => {
        // Prevent writing to state if we changed view or question ended
        setGameState((currentGameState) => {
          if (currentGameState !== "question") return currentGameState;
          
          setQuestionStatus((currentStatus) => {
            if (currentStatus !== "running") return currentStatus;

            // Make automated decisions:
            // High probability of correct answer, some wrong answers for distribution
            const isCorrect = getIsCorrectAnswerSimulated(); 
            const selectedOption = isCorrect 
              ? currentQuestion.correctAnswer 
              : getRandomWrongOptionSimulated(currentQuestion.correctAnswer);

            optionDistribution[selectedOption]++;
            submitted++;

            setAnswersCount(submitted);
            setPlayerSubmissions(prev => ({ ...prev, [player.name]: selectedOption }));
            setActivePlayerStats({ optionCount: [...optionDistribution] });

            return currentStatus;
          });
          return currentGameState;
        });
      }, delay);
    });
  };

  const goToLeaderboard = () => {
    playSound("click");
    setGameState("leaderboard");
  };

  const nextQuestion = async () => {
    if (currentQuestionIdx < selectedQuiz.questions.length - 1) {
      playSound("click");
      const nextIdx = currentQuestionIdx + 1;
      
      if (useRealDbSync && sessionId) {
        try {
          const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/next`, {
            method: "POST"
          }).catch(() => null);
          let data: any = null;
          if (res && res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
            data = await res.json().catch(() => null);
          }
          if (data?.success) {
            setCurrentQuestionIdx(nextIdx);
            setGameState("question");
            loadQuestion(nextIdx);
          } else {
            setCurrentQuestionIdx(nextIdx);
            setGameState("question");
            loadQuestion(nextIdx);
          }
        } catch (e) {
          console.warn("Falling back to local next question:", e);
          setCurrentQuestionIdx(nextIdx);
          setGameState("question");
          loadQuestion(nextIdx);
        }
      } else {
        setCurrentQuestionIdx(nextIdx);
        setGameState("question");
        loadQuestion(nextIdx);
      }
    } else {
      playSound("fanfare");
      archiveCurrentSessionResults();
      setGameState("podium");
    }
  };

  // Automatically archive and persist scores to DB & local storage
  const archiveCurrentSessionResults = async () => {
    try {
      let serverSessionData: any = null;
      if (sessionId) {
        try {
          const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/end-quiz`, {
            method: "POST"
          });
          if (res.ok) {
            serverSessionData = await res.json().catch(() => null);
          }
        } catch (err) {
          console.warn("Server end-quiz call failed, persisting locally:", err);
        }
      }

      // Build structured score archive record
      const rankedParticipants = [...joinedPlayers]
        .sort((a, b) => b.score - a.score)
        .map((p, idx) => ({
          rank: idx + 1,
          id: (p as any).id || `p-${idx + 1}`,
          name: p.name,
          studentId: (p as any).studentId || `PTSC-${1000 + idx}`,
          avatar: p.avatar || "🤖",
          score: p.score,
          streak: p.streak || 0,
          correctAnswers: (p as any).correctAnswers ?? Math.round((p.score / 1000) * selectedQuiz.questions.length),
          wrongAnswers: (p as any).wrongAnswers ?? Math.max(0, selectedQuiz.questions.length - Math.round((p.score / 1000) * selectedQuiz.questions.length)),
          accuracy: Math.min(100, Math.round((p.score / (Math.max(1, selectedQuiz.questions.length) * 1000)) * 100))
        }));

      const record = {
        sessionId: sessionId || `session-${Date.now()}`,
        pin: gamePin,
        quizId: selectedQuiz.id,
        quizTitle: selectedQuiz.title,
        trade: selectedQuiz.trade,
        totalQuestions: selectedQuiz.questions.length,
        totalParticipants: rankedParticipants.length,
        savedAt: new Date().toISOString(),
        participants: rankedParticipants,
        serverData: serverSessionData
      };

      // Persist in localStorage for teacher's future reference
      try {
        const existing = JSON.parse(localStorage.getItem("ptsc_quiz_archived_sessions") || "[]");
        const filtered = existing.filter((item: any) => item.sessionId !== record.sessionId);
        localStorage.setItem("ptsc_quiz_archived_sessions", JSON.stringify([record, ...filtered].slice(0, 50)));
      } catch (storageErr) {
        console.warn("Could not write to localStorage:", storageErr);
      }

      setArchivedSessionData(record);
      setIsSessionArchived(true);
      return record;
    } catch (e) {
      console.error("Failed to archive quiz results:", e);
    }
  };

  const handleEndSession = async () => {
    if (confirm("আপনি কি নিশ্চিতভাবে এই লাইভ সেশনটি সমাপ্ত করতে চান? শিক্ষার্থীদের ফলাফল ও পয়েন্ট স্বয়ংক্রিয়ভাবে ডাটাবেসে স্থায়ীভাবে সংরক্ষিত হবে।")) {
      await archiveCurrentSessionResults();
      playSound("fanfare");
      setGameState("podium");
    }
  };

  const downloadResultsCsv = (customRecord?: any) => {
    const dataToExport = customRecord || archivedSessionData;
    const participantsList = dataToExport?.participants || [...joinedPlayers].sort((a, b) => b.score - a.score).map((p, i) => ({
      rank: i + 1,
      name: p.name,
      studentId: (p as any).studentId || "N/A",
      score: p.score,
      correctAnswers: (p as any).correctAnswers ?? Math.round((p.score / 1000) * selectedQuiz.questions.length),
      accuracy: `${Math.min(100, Math.round((p.score / (Math.max(1, selectedQuiz.questions.length) * 1000)) * 100))}%`
    }));

    if (sessionId && useRealDbSync) {
      const link = document.createElement("a");
      link.href = `/api/live-quizzes/sessions/${sessionId}/report?format=csv`;
      link.download = `quiz-results-${selectedQuiz.id}-${gamePin}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const header = "Rank,Student Name,Student ID,Score,Correct Answers,Accuracy\n";
    const rows = participantsList.map((p: any) => 
      `${p.rank},"${p.name.replace(/"/g, '""')}","${p.studentId || 'N/A'}",${p.score},${p.correctAnswers || 0},${p.accuracy || '100%'}`
    );
    const csvContent = "\uFEFF" + header + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ptsc-quiz-${selectedQuiz.id}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetGame = () => {
    playSound("click");
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState("setup");
    setJoinedPlayers([]);
    setCurrentQuestionIdx(0);
    setAnswersCount(0);
    setIsSessionArchived(false);
    setArchivedSessionData(null);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const isLive = gameState !== "setup";
  const joinCode = `PTSC-${gamePin}`;

  // Notify parent container (e.g. admin layout) to hide left sidebar and header during live
  useEffect(() => {
    onLiveStateChange?.(isLive);
  }, [isLive, onLiveStateChange]);

  useEffect(() => {
    return () => {
      onLiveStateChange?.(false);
    };
  }, [onLiveStateChange]);

  return (
    <div
      id="live-quiz-portal"
      className={
        isLive
          ? "fixed inset-0 z-50 w-full h-full max-w-full overflow-y-auto bg-slate-950 flex flex-col text-white selection:bg-cyan-500 selection:text-slate-950"
          : "bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[620px] flex flex-col"
      }
    >
      {/* Top Controller Header */}
      {isLive ? (
        /* Clean, Minimalist Live Presentation Bar - NO SIDEBAR, NO ADMIN HEADER, NO FOOTER */
        <header className="px-4 sm:px-6 py-3 bg-slate-950/95 backdrop-blur-xl border-b border-cyan-500/20 flex items-center justify-between z-30 shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExitLive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-rose-500/60 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="অ্যাডমিন ড্যাশবোর্ডে ফিরুন"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">প্রস্থান / অ্যাডমিন ড্যাশবোর্ড</span>
              <span className="sm:hidden">প্রস্থান</span>
            </button>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <span className="text-xs font-black tracking-wider uppercase bg-linear-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                লাইভ হোস্ট এরিনা
              </span>
              <span className="text-slate-600 dark:text-slate-400 text-xs hidden sm:inline">•</span>
              <span className="text-xs font-bold text-slate-300 truncate max-w-[140px] sm:max-w-xs hidden sm:inline">
                {selectedQuiz.title}
              </span>
            </div>
          </div>

          {/* Clean Room PIN indicator (duplicate controls removed - all controls are in sticky bottom bar) */}
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-black tracking-wider shadow-xs">
              ROOM PIN: {gamePin}
            </span>
          </div>
        </header>
      ) : (
        /* Normal Header in Setup Mode */
        <div className="bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Flame className="w-5 h-5 text-white animate-bounce-subtle filter drop-shadow(0 0 6px rgba(255,255,255,0.8))" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                ডিজিটাল ক্লাসরুম লাইভ কুইজ (Smart Quiz Arena)
              </h2>
              <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold font-mono">
                Panchagarh Govt Technical School & College ERP • Interactive Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-all border ${
                soundEnabled
                  ? "bg-indigo-50 dark:bg-slate-800 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-cyan-400 shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
              }`}
              title={soundEnabled ? "শব্দ বন্ধ করুন (Mute)" : "শব্দ চালু করুন (Unmute)"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* ====================================
          STATE 1: SETUP / ARENA BUILDER & MANAGEMENT
          ==================================== */}
      {gameState === "setup" && (
        <div className="p-4 sm:p-6 space-y-6">
          <LiveQuizArena
            initialTab={initialSection}
            onLaunchLiveArena={async (quizId) => {
              try {
                const res = await fetch(`/api/quizzes/${quizId}`).catch(() => null);
                let data: any = null;
                if (res && res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
                  data = await res.json().catch(() => null);
                }
                if (data && data.success && data.quiz) {
                  const qz = data.quiz;
                  const qqs = data.questions || [];
                  const questionsList = qqs.map((qq: any, idx: number) => {
                    const snap = qq.questionSnapshot || qq;
                    const snapData = snap.questionData || {};
                    return {
                      id: idx + 1,
                      question: snap.questionText || qq.questionText || "Question",
                      options: snap.options || snapData.options || qq.options || ["Option A", "Option B", "Option C", "Option D"],
                      correctAnswer: snap.correctIndex ?? snapData.correctIndex ?? qq.correctAnswer ?? 0,
                      explanation: snap.explanation || qq.explanation || "",
                    };
                  });
                  const convertedQuiz: Quiz = {
                    id: String(qz.id),
                    title: qz.title,
                    trade: `Class ${qz.classId || "All"}`,
                    level: qz.category || "General",
                    questions: questionsList.length > 0 ? questionsList : PRELOADED_QUIZZES[0].questions,
                  };
                  startLobby(convertedQuiz);
                  return;
                }
              } catch (e) {
                console.warn("API quiz fetch failed, using fallback:", e);
              }

              const quizFromDb = institutionalDb.quizzes.find((q) => String(q.id) === String(quizId));
              if (quizFromDb) {
                const qqs = institutionalDb.quizQuestions.filter((qq) => String(qq.quizId) === String(quizId));
                const questionsList = qqs.map((qq, idx) => {
                  const snap = qq.questionSnapshot || {};
                  const snapData = snap.questionData || {};
                  return {
                    id: idx + 1,
                    question: snap.questionText || qq.questionType || "Question",
                    options: snap.options || snapData.options || ["Option A", "Option B", "Option C", "Option D"],
                    correctAnswer: snap.correctIndex ?? snapData.correctIndex ?? 0,
                    explanation: snap.explanation || "",
                  };
                });
                const convertedQuiz: Quiz = {
                  id: String(quizFromDb.id),
                  title: quizFromDb.title,
                  trade: `Class ${quizFromDb.classId}`,
                  level: quizFromDb.category,
                  questions: questionsList.length > 0 ? questionsList : PRELOADED_QUIZZES[0].questions,
                };
                startLobby(convertedQuiz);
              } else {
                const preloaded = PRELOADED_QUIZZES.find((p) => p.id === quizId);
                startLobby(preloaded || PRELOADED_QUIZZES[0]);
              }
            }}
          />
        </div>
      )}

      {/* ====================================
          STATE 2: LOBBY SCREEN (IMMERSIVE HOST ARENA)
          ==================================== */}
      {gameState === "lobby" && (
        <div className="flex-1 relative flex flex-col justify-between overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-slate-950 text-white">
          {/* Ambient Glowing Tech Mesh Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-cyan-600/20 blur-[120px]"
              animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-[130px]"
              animate={{ x: [0, -60, 0], y: [0, -40, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />
          </div>

          {/* Main Stage Grid Container */}
          <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto">
            {/* Left & Center: The Giant Code, PIN, QR & Instructions (8 Columns) */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
              
              {/* Header Banner with Animated Broadcast Arena SVG */}
              <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                <div className="shrink-0">
                  <LiveQuizBroadcastArenaSVG size={85} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      লাইভ ব্রডকাস্ট লবি
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {useRealDbSync ? "রিয়েল-টাইম ক্লাউড সিঙ্ক সক্রিয়" : "লোকাল সিমুলেশন মোড"}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {selectedQuiz.title}
                  </h2>
                  <p className="text-xs text-slate-300 font-medium">
                    শিক্ষার্থীদের মোবাইল বা ডিভাইসের ব্রাউজার থেকে যুক্ত হতে বলুন
                  </p>
                </div>
              </div>

              {/* GIANT JOIN CODE DISPLAY (কোড অবশ্যই বড় লেখা হবে - User Requirement) */}
              <div className="relative rounded-3xl border-2 border-cyan-400/60 bg-linear-to-b from-slate-900/90 via-slate-950/95 to-slate-900/90 p-6 sm:p-8 shadow-[0_0_55px_rgba(6,182,212,0.4)] overflow-hidden group">
                {/* HUD Corner Tech Brackets */}
                <span className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-cyan-300" />
                <span className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-cyan-300" />
                <span className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-cyan-300" />
                <span className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-cyan-300" />

                {/* Animated Laser Scanline Effect */}
                <motion.div
                  className="absolute inset-x-0 h-1 bg-linear-to-r from-transparent via-cyan-400/70 to-transparent pointer-events-none"
                  animate={{ y: [0, 160, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                      লাইভ রুম কোড (ROOM / JOIN CODE)
                    </span>
                    <span className="text-xs text-slate-400 block font-medium">
                      শিক্ষার্থীরা নিচের এই বড় কোডটি টাইপ করে সরাসরি ক্লাসে যুক্ত হতে পারবে:
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(joinCode);
                      setCopiedCode(true);
                      playSound("click");
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-bold border border-cyan-400/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">কোড কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-cyan-300" />
                        <span>কোড কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Extra Large Animated Join Code */}
                <div className="py-2 text-center sm:text-left select-all">
                  <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-linear-to-r from-cyan-300 via-sky-100 to-indigo-300 drop-shadow-[0_0_40px_rgba(34,211,238,0.7)] animate-pulse-gentle">
                    {joinCode}
                  </div>
                </div>
              </div>

              {/* GAME PIN & QUICK SCAN QR ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Game PIN Card (পিন আসবে - User Requirement) */}
                <div className="relative rounded-2xl border-2 border-amber-400/50 bg-slate-900/80 p-5 shadow-[0_0_35px_rgba(251,191,36,0.3)] backdrop-blur-md flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      গেম পিন (GAME PIN)
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(gamePin);
                        setCopiedPin(true);
                        playSound("click");
                        setTimeout(() => setCopiedPin(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPin ? "কপি হয়েছে" : "পিন কপি"}</span>
                    </button>
                  </div>

                  <div className="text-center py-1 select-all">
                    <span className="text-4xl sm:text-5xl font-mono font-black text-amber-300 tracking-[0.25em] drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                      {gamePin.slice(0, 3)} {gamePin.slice(3)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 text-center">
                    পিন নম্বর প্রদান করেও শিক্ষার্থীরা লগইন ছাড়াই এক ক্লিকে ঢুকতে পারবে
                  </p>
                </div>

                {/* 2. Quick QR Code with Glowing Corner Brackets */}
                <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-lg backdrop-blur-md flex items-center gap-5 justify-between">
                  <div className="space-y-1.5 flex-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-cyan-300" />
                      কুইক কিউআর স্ক্যান
                    </span>
                    <p className="text-xs text-slate-300 leading-snug">
                      মোবাইল ক্যামেরা দিয়ে স্ক্যান করলে স্বয়ংক্রিয়ভাবে পিন বসে যাবে
                    </p>
                    <span className="text-[10px] font-mono text-cyan-300 block truncate">
                      /quiz/join?pin={gamePin}
                    </span>
                  </div>

                  {/* QR Box with Cyber HUD Brackets & Laser Scan */}
                  <div className="relative p-2 bg-white dark:bg-slate-900 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.35)] shrink-0">
                    <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400" />
                    <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400" />
                    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400" />
                    
                    <motion.div
                      className="absolute inset-x-1.5 h-0.5 bg-cyan-500 shadow-[0_0_6px_#06b6d4] pointer-events-none"
                      animate={{ y: [4, 76, 4] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                    />

                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="Join QR Code"
                        className="w-20 h-20 sm:w-22 sm:h-22 object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <QrCode className="w-20 h-20 stroke-[2] mx-auto text-indigo-950" />
                    )}
                  </div>
                </div>
              </div>

              {/* Link Sharing & Lobby Controls Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/quiz/join?pin=${gamePin}`;
                    navigator.clipboard.writeText(url);
                    setCopiedLink(true);
                    playSound("click");
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-white/10 bg-slate-900/80 hover:bg-slate-800 text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">লিংক কপি হয়েছে (Copied!)</span>
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 text-cyan-400" />
                      <span>কুইজ লিংক কপি করুন (Copy Join URL)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={toggleLobbyLock}
                  disabled={!useRealDbSync}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    !useRealDbSync
                      ? "opacity-50 cursor-not-allowed border-white/5 bg-transparent text-slate-500 dark:text-slate-400"
                      : isLobbyLocked
                      ? "border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "border-white/10 bg-slate-900/80 hover:bg-slate-800 text-slate-200"
                  }`}
                >
                  {isLobbyLocked ? (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>লবি আনলক করুন (Unlock Lobby)</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 text-slate-400" />
                      <span>লবি লক করুন (Lock Lobby)</span>
                    </>
                  )}
                </button>
              </div>

              {/* =========================================================
                  PRE-QUIZ INTERACTIVE HUB (PRE-QUIZ VS ACTUAL QUIZ SEPARATION)
                  Rule 1: Pre-Quiz questions, polls, messages, icebreakers.
                  NO countdown, NO timer, NO scoring, NO question points, NO automatic SMS.
                  Host can send as many pre-quiz questions/polls as they want!
                  ========================================================= */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 border-2 border-amber-500/30 text-xs space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                    <div>
                      <span className="font-extrabold text-amber-400 text-xs block">
                        প্রি-কুইজ ইন্টারঅ্যাক্টিভ হাব (Pre-Quiz Activity & Icebreakers)
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        কুইজ শুরুর আগে শিক্ষার্থীদের সাথে পরিচিতি, কুশল বিনিময় বা জরিপ চালান (টাইমার ও স্কোর ছাড়া)
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-[10px] font-mono text-amber-300 font-bold shrink-0">
                    নন-কম্পিটিটিভ
                  </span>
                </div>

                {/* Quick 1-Click Template Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">দ্রুত প্রি-কুইজ টেমপ্লেট:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => sendPreQuizActivity("সবাই কেমন আছো? আজকের ক্লাসে কে কোন উপজেলা/জেলা থেকে যোগ দিয়েছ?", "icebreaker")}
                      disabled={isSendingPreQuiz}
                      className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-amber-400/40 text-left text-[11px] text-slate-200 transition-all cursor-pointer group"
                    >
                      <span className="font-bold text-amber-300 block mb-0.5">🙋 নাম ও কুশল বিনিময়</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">কে কোথা থেকে যোগ দিয়েছ?</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => sendPreQuizActivity("ভবিষ্যতে কারিগরি শিক্ষা শেষে তোমরা কে কী হতে চাও?", "icebreaker")}
                      disabled={isSendingPreQuiz}
                      className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-cyan-400/40 text-left text-[11px] text-slate-200 transition-all cursor-pointer group"
                    >
                      <span className="font-bold text-cyan-300 block mb-0.5">🚀 ভবিষ্যতের স্বপ্ন</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">ভবিষ্যতে কী হতে চাও?</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => sendPreQuizActivity("আজকের কুইজের জন্য তোমরা কি পুরোপুরি প্রস্তুত?", "poll", ["হ্যাঁ, পুরোপুরি প্রস্তুত!", "মোটামুটি প্রস্তুত", "কিছুটা নার্ভাস"])}
                      disabled={isSendingPreQuiz}
                      className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-400/40 text-left text-[11px] text-slate-200 transition-all cursor-pointer group"
                    >
                      <span className="font-bold text-emerald-300 block mb-0.5">📊 রেডিনেস পোল (Poll)</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">তোমরা কি প্রস্তুত?</span>
                    </button>
                  </div>
                </div>

                {/* Custom Pre-Quiz Message or Poll Form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={preQuizPrompt}
                    onChange={(e) => setPreQuizPrompt(e.target.value)}
                    placeholder="কাস্টম প্রশ্ন, পোল বা আইসব্রেকার বার্তা লিখুন..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-white text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => sendPreQuizActivity()}
                    disabled={!preQuizPrompt.trim() || isSendingPreQuiz}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>পাঠান</span>
                  </button>
                </div>

                {/* Active Pre-Quiz Activity Display & Real-time Live Responses Feed */}
                {hostActivePreQuiz && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-black text-white">{hostActivePreQuiz.prompt}</span>
                      </div>
                      <button
                        onClick={closePreQuizActivity}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 cursor-pointer"
                      >
                        বন্ধ করুন ✕
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>উত্তর এসেছে: <strong className="text-amber-300">{hostActivePreQuiz.responses?.length || 0} জন</strong></span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">নন-কম্পিটিটিভ • কোনো স্কোর যোগ হবে না</span>
                    </div>

                    {/* Live responses rolling list */}
                    {hostActivePreQuiz.responses && hostActivePreQuiz.responses.length > 0 && (
                      <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1 border-t border-white/5 pt-2">
                        {hostActivePreQuiz.responses.map((resp: any, rIdx: number) => (
                          <div key={rIdx} className="p-1.5 rounded-lg bg-slate-900 border border-white/5 text-[11px] flex items-center justify-between">
                            <span className="font-bold text-slate-300">{resp.playerName}:</span>
                            <span className="text-amber-200 font-medium truncate max-w-[200px]">{resp.response}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Automatic Motivation Feedback Control (Phase 20) */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/20 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="font-extrabold text-amber-400 text-xs">অটোমেটিক পারফরম্যান্স মেসেজ (Phase 20)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={motivationEnabled}
                      onChange={(e) => setMotivationEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 dark:border-slate-700 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-slate-900"></div>
                  </label>
                </div>
                {motivationEnabled && (
                  <div className="flex items-center gap-3 pt-1 border-t border-white/5">
                    <span className="text-slate-400 text-[10px]">মেসেজ বিরতি:</span>
                    <div className="flex items-center gap-1.5">
                      {[2, 3, 4, 5].map((interval) => (
                        <button
                          key={interval}
                          onClick={() => setMotivationInterval(interval)}
                          className={`px-2 py-1 rounded text-[10px] font-mono font-black border transition-all cursor-pointer ${
                            motivationInterval === interval
                              ? "bg-amber-500 border-amber-500 text-slate-950"
                              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {interval}টি প্রশ্ন
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Security & Audit Logs Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
                <button
                  onClick={() => setIsAuditLogsExpanded(!isAuditLogsExpanded)}
                  className="w-full flex items-center justify-between font-bold text-slate-400 hover:text-white transition-all text-left cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>লাইভ সিকিউরিটি ও কানেকশন অডিট লগ</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {auditLogs.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[9px] font-black animate-pulse">
                        {auditLogs.length} টি ইভেন্ট
                      </span>
                    )}
                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                      {isAuditLogsExpanded ? "লুকান ▲" : "দেখুন ▼"}
                    </span>
                  </span>
                </button>

                {isAuditLogsExpanded && (
                  <div className="pt-2 border-t border-white/5 space-y-1.5 max-h-[140px] overflow-y-auto pr-1 mt-2">
                    {auditLogs.length === 0 ? (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center py-2 font-medium">কোনো নিরাপত্তা বা কানেকশন লগ নেই।</p>
                    ) : (
                      auditLogs.slice(0, 15).map((log: any, lIdx: number) => {
                        const isWarning = log.eventType === "RATE_LIMIT_TRIGGERED" || log.eventType === "DUPLICATE_ANSWER" || log.eventType === "INVALID_RECONNECT_TOKEN";
                        return (
                          <div key={lIdx} className={`p-1.5 rounded bg-white dark:bg-slate-900/5 border border-white/5 text-[10px] flex items-start gap-1.5 transition-all ${isWarning ? "border-amber-500/10 bg-amber-500/5" : ""}`}>
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                              log.eventType === "PLAYER_JOINED" ? "bg-emerald-400" :
                              log.eventType === "PLAYER_RECONNECTED" ? "bg-teal-400 animate-pulse" :
                              log.eventType === "DUPLICATE_ANSWER" ? "bg-amber-400" :
                              log.eventType === "RATE_LIMIT_TRIGGERED" ? "bg-rose-400 animate-pulse" :
                              "bg-slate-400"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between text-[9px] text-slate-400">
                                <span className="font-bold text-slate-300 uppercase">{log.eventType?.replace("PLAYER_", "")}</span>
                                <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                              </div>
                              <p className="text-slate-300 break-words mt-0.5">{log.message}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Joined Students Roster & Launch CTA (70+ Fluid Bubble Grid) */}
            <div className="lg:col-span-4 rounded-3xl border-2 border-indigo-500/30 bg-slate-900/90 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-[0_0_45px_rgba(99,102,241,0.25)]">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>যুক্ত হওয়া শিক্ষার্থী</span>
                  </h4>
                  {/* 70+ Live Player Counter Badge */}
                  <span className="px-3 py-1 rounded-full bg-cyan-400 text-slate-950 font-black font-mono text-xs shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse">
                    {joinedPlayers.length} জন শিক্ষার্থী যুক্ত হয়েছে
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  শিক্ষার্থীরা কোড দিয়ে যুক্ত হলে এখানে তাদের নাম ও নির্বাচিত অ্যাভাটার দেখা যাবে
                </p>
              </div>

              {/* 70+ Fluid Bubble Grid (4 to 6 Columns Responsive) */}
              <div className="flex-1 overflow-y-auto max-h-[300px] sm:max-h-[360px] pr-1">
                {joinedPlayers.length === 0 ? (
                  <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                    <Smartphone className="w-8 h-8 animate-bounce text-cyan-400" />
                    <p className="text-xs font-bold text-slate-300">শিক্ষার্থীদের সংযুক্তির জন্য অপেক্ষা করা হচ্ছে...</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">বড় কোড বা পিনটি প্রজেক্টরে দেখান</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                    <AnimatePresence mode="popLayout">
                      {joinedPlayers.map((player: any, idx) => (
                        <motion.div
                          layout
                          key={player.id || player.name || idx}
                          initial={{ scale: 0.3, opacity: 0, y: 15 }}
                          animate={{
                            scale: 1,
                            opacity: 1,
                            y: [0, -3, 0],
                            transition: {
                              y: {
                                duration: 2.8 + (idx % 5) * 0.4,
                                repeat: Infinity,
                                ease: "easeInOut",
                              },
                              scale: { type: "spring", stiffness: 350, damping: 20 },
                            },
                          }}
                          exit={{ scale: 0.2, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 350, damping: 22 }}
                          className="group relative flex items-center gap-2 p-2 bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-slate-700/80 hover:border-cyan-400/80 rounded-2xl text-xs text-white font-bold transition-all shadow-md shadow-slate-950/40 hover:scale-[1.04]"
                        >
                          <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-950 to-slate-900 border border-white/15 text-lg select-none shadow-inner">
                            <span>{player.avatar || "🤖"}</span>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-950 ${
                                player.connectionStatus === "online" || !player.connectionStatus
                                  ? "bg-emerald-400 animate-pulse"
                                  : player.connectionStatus === "reconnecting"
                                  ? "bg-amber-400 animate-ping"
                                  : "bg-slate-500"
                              }`}
                            />
                          </div>
                          <span className="truncate flex-1 font-bold text-xs text-slate-200 pr-3">{player.name}</span>

                          {/* Kick player button */}
                          <button
                            onClick={() => kickPlayer(player.id || player.name)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 cursor-pointer shadow-xs"
                            title="কিক করুন"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Simulation and Student Join Launcher */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setStudentInputPin(gamePin);
                    setShowStudentJoinModal(true);
                  }}
                  className="w-full py-2.5 rounded-xl border border-indigo-500/40 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Gamepad2 className="w-4 h-4 text-cyan-400" />
                  <span>শিক্ষার্থী জয়েন ইন্টারফেস (৩৬ অ্যাভাটার সহ)</span>
                </button>
              </div>

              {/* GIANT START QUIZ CTA BUTTON */}
              <button
                onClick={() => {
                  if (presentationSlides.length > 0) {
                    setGameState("presentation");
                    setCurrentSlideIdx(0);
                  } else {
                    startQuizGame();
                  }
                }}
                disabled={joinedPlayers.length === 0}
                className={`w-full py-4 rounded-2xl text-sm font-black text-center uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
                  joinedPlayers.length > 0
                    ? "bg-linear-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 border-2 border-emerald-300 shadow-[0_0_45px_rgba(16,185,129,0.55)] hover:scale-[1.02] active:scale-[0.99]"
                    : "bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed border border-slate-700"
                }`}
              >
                <span>{presentationSlides.length > 0 ? "প্রেজেন্টেশন শুরু করুন" : "কুইজ শুরু করুন"}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================
          STATE 2.5: PRESENTATION MODE (HOST VIEW)
          ==================================== */}
      {gameState === "presentation" && (
        <HostLivePresenter
          mode="presentation"
          slide={presentationSlides[currentSlideIdx]}
          slideIndex={currentSlideIdx}
          totalSlides={presentationSlides.length}
          timeLeft={0}
          totalTime={0}
          submittedCount={0}
          totalPlayers={joinedPlayers.length}
          isAnswerRevealed={false}
          optionStats={[0, 0, 0, 0]}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onShowResults={() => {}}
          onNextQuestion={() => {}}
          onNextSlide={handleNextSlide}
          onPrevSlide={() => {
            if (currentSlideIdx > 0) {
              const prevIdx = currentSlideIdx - 1;
              setCurrentSlideIdx(prevIdx);
            }
          }}
          onShowLeaderboard={() => setGameState("leaderboard")}
          onStartQuiz={handleStartActualQuiz}
          onEndQuiz={handleExitLive}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
      )}

      {/* ====================================
          STATE 3: ACTIVE GAME QUESTION (HOST VIEW)
          ==================================== */}
      {gameState === "question" && (
        <div className="flex-1 p-6 md:p-8 bg-slate-900 text-white flex flex-col justify-between space-y-6 relative overflow-hidden">
          {/* Top Panel: Question Progress & Timer */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <span className="text-[10px] text-cyan-400 uppercase font-black tracking-wider block">
                {selectedQuiz.title}
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black">
                  প্রশ্ন {currentQuestionIdx + 1} / {selectedQuiz.questions.length}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {answersCount} / {joinedPlayers.length} জনের উত্তর সাবমিট হয়েছে
                </span>
                {joinedPlayers.length > 0 && (
                  <span className="text-xs text-emerald-400 font-mono font-bold">
                    ({Math.round((answersCount / joinedPlayers.length) * 100)}%)
                  </span>
                )}
              </div>
            </div>

            {/* Dynamic Status / Timer Header */}
            {hostSequencePhase === "COUNTDOWN" ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                <Clock className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-xs font-black uppercase tracking-wider">কাউন্টডাউন ফেজ</span>
              </div>
            ) : hostSequencePhase === "QUESTION_PREVIEW" ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Eye className="w-4 h-4 text-amber-400 animate-bounce" />
                <span className="text-xs font-black font-mono">প্রিভিউ: {hostPreviewSec}s</span>
              </div>
            ) : (
              /* Massive Circular Timer / Countdown Digit with Game-Show Urgency */
              <div className="flex items-center gap-3 shrink-0">
                <div className={`relative w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                  timeLeft <= 5 
                    ? "border-rose-500 bg-rose-950/80 shadow-[0_0_30px_rgba(244,63,94,0.7)] animate-pulse scale-110" 
                    : timeLeft <= 10 
                    ? "border-amber-400 bg-amber-950/50 shadow-[0_0_20px_rgba(245,158,11,0.5)]" 
                    : "border-cyan-400 bg-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                }`}>
                  <Clock className={`w-5 h-5 absolute opacity-25 ${timeLeft <= 5 ? "text-rose-400" : "text-cyan-400"}`} />
                  <span className={`text-xl font-mono font-black relative z-10 ${timeLeft <= 5 ? "text-rose-300 animate-bounce" : "text-white"}`}>
                    {timeLeft}
                  </span>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-slate-400 block font-bold">সময়সীমা বাকি</span>
                  <span className={`text-xs font-black font-mono ${timeLeft <= 5 ? "text-rose-400 animate-pulse" : "text-cyan-400"}`}>
                    {timeLeft <= 5 ? "দ্রুত উত্তর দিন!" : "মূল টাইমার"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Submission Rate Progress Bar */}
          {hostSequencePhase === "QUESTION_ACTIVE" && joinedPlayers.length > 0 && (
            <div className="w-full max-w-4xl mx-auto space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>উত্তর দেওয়ার অগ্রগতি (Live Submission Rate)</span>
                <span>{answersCount} / {joinedPlayers.length} ({Math.round((answersCount / joinedPlayers.length) * 100)}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden">
                <motion.div
                  className="h-full bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-500"
                  animate={{ width: `${(answersCount / joinedPlayers.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* STEP 1: HOST SEQUENCE PHASES (Phase 1: READY, Phase 2: COUNTDOWN) */}
          {hostSequencePhase === "READY" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="my-auto py-12 text-center max-w-2xl mx-auto space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-linear-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/10">
                <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>প্রস্তুত হোন! (GET READY)</span>
              </div>
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-amber-400/40 animate-ping opacity-30" />
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-amber-400 animate-spin" style={{ animationDuration: "6s" }} />
                <div className="w-28 h-28 rounded-full bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.5)]">
                  <span className="text-5xl">⚡</span>
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight">
                  প্রশ্ন {currentQuestionIdx + 1} আসছে!
                </h2>
                <p className="text-sm text-slate-300 font-medium">
                  স্ক্রিনের দিকে লক্ষ্য রাখুন! আর কয়েক মুহূর্তেই অপশন উন্মোচিত হবে।
                </p>
              </div>
              <button
                onClick={skipHostCountdown}
                className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-md"
              >
                সরাসরি প্রশ্নে যান (Skip to Question) ⏩
              </button>
            </motion.div>
          ) : hostSequencePhase === "COUNTDOWN" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="my-auto py-12 text-center max-w-2xl mx-auto space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 text-xs font-black tracking-wide shadow-md shadow-cyan-500/10">
                <Radio className="w-4 h-4 animate-ping text-cyan-400" />
                <span>লাইভ সিঙ্ক কাউন্টডাউন চলছে</span>
              </div>
              <h2 className="text-2xl font-black text-white">পরবর্তী প্রশ্ন {currentQuestionIdx + 1} শুরু হচ্ছে...</h2>
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-cyan-400/50 animate-spin" style={{ animationDuration: "3s" }} />
                <motion.span
                  key={hostCountdownSec}
                  initial={{ scale: 1.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="font-mono text-7xl font-black text-cyan-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.85)]"
                >
                  {hostCountdownSec > 0 ? hostCountdownSec : "GO!"}
                </motion.span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                সকল শিক্ষার্থীর স্ক্রিনে এই কাউন্টডাউন প্রদর্শিত হচ্ছে।
              </p>
              <button
                onClick={skipHostCountdown}
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-md"
              >
                কাউন্টডাউন স্কিপ করুন (Skip Countdown) ⏩
              </button>
            </motion.div>
          ) : (
            <>
              {/* STEP 2 & 3: CENTRAL QUESTION DISPLAY (Requirement 1 - ক: Smooth spring bounce & fade-in) */}
              <motion.div
                key={`q-${currentQuestionIdx}`}
                initial={{ opacity: 0, y: 35, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="my-auto py-4 text-center max-w-4xl mx-auto space-y-4"
              >
                {hostSequencePhase === "QUESTION_PREVIEW" && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-md shadow-amber-500/10">
                    <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>প্রশ্ন প্রিভিউ ফেজ চলছে ({hostPreviewSec}s) — শিক্ষার্থীরা প্রশ্ন পড়ছে, অপশন এখনো গোপন</span>
                  </div>
                )}
                
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-relaxed tracking-tight px-4 select-none drop-shadow-md">
                  {selectedQuiz.questions[currentQuestionIdx].question}
                </h3>

                {hostSequencePhase === "QUESTION_ACTIVE" && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 border border-white/5 text-slate-400 text-xs">
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>সঠিক উত্তরটি চয়ন করে সাবমিট করুন</span>
                  </div>
                )}
              </motion.div>

              {/* Answer Options Grid with Staggered Entrance (Requirement 1 - ক) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto w-full">
                {selectedQuiz.questions[currentQuestionIdx].options.map((option, idx) => {
                  const colors = [
                    "bg-rose-600 hover:bg-rose-700 border-rose-500 shadow-rose-900/30",
                    "bg-blue-600 hover:bg-blue-700 border-blue-500 shadow-blue-900/30",
                    "bg-amber-600 hover:bg-amber-700 border-amber-500 shadow-amber-950/30",
                    "bg-emerald-600 hover:bg-emerald-700 border-emerald-500 shadow-emerald-900/30"
                  ];
                  const labels = ["▲", "♦", "●", "■"];
                  const letterLabels = ["A", "B", "C", "D"];
                  const optionVoteCount = activePlayerStats.optionCount[idx] || 0;

                  return (
                    <motion.div
                      key={`opt-${currentQuestionIdx}-${idx}`}
                      initial={{ opacity: 0, y: 30, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        delay: hostSequencePhase === "QUESTION_ACTIVE" ? idx * 0.12 : 0,
                        duration: 0.45,
                        type: "spring",
                        stiffness: 240,
                        damping: 20
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`${colors[idx]} ${
                        hostSequencePhase === "QUESTION_PREVIEW" ? "opacity-60 saturate-50" : ""
                      } border-2 p-5 rounded-2xl shadow-lg flex flex-col justify-between text-left transition-all text-white cursor-pointer group relative overflow-hidden`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Big geometric label */}
                          <span className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900/10 text-white flex items-center justify-center font-black text-sm shrink-0 border border-white/20">
                            {letterLabels[idx]}
                          </span>
                          <span className="text-base sm:text-lg font-extrabold leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                            {option}
                          </span>
                        </div>
                        {/* Subtle indicator icon */}
                        <span className="text-lg font-black opacity-40 shrink-0">
                          {labels[idx]}
                        </span>
                      </div>

                      {/* Live Option Submission Distribution bar for Teacher */}
                      {hostSequencePhase === "QUESTION_ACTIVE" && answersCount > 0 && (
                        <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] font-bold">
                          <span className="opacity-80">{optionVoteCount} জন উত্তর দিয়েছেন</span>
                          <span className="font-mono bg-black/30 px-2 py-0.5 rounded">
                            {Math.round((optionVoteCount / answersCount) * 100)}%
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

        </div>
      )}

      {/* ====================================
          STATE 4: ANSWER STATS BREAKDOWN (HOST VIEW)
          ==================================== */}
      {gameState === "answer-stats" && (
        <div className="flex-1 p-6 md:p-8 bg-slate-900 text-white flex flex-col justify-between space-y-6">
          <div className="border-b border-white/10 pb-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-cyan-400 uppercase font-black tracking-wider block">
                উত্তরের বিশ্লেষণ (Submission Statistics)
              </span>
              <h3 className="text-base md:text-lg font-black text-white mt-0.5">
                {selectedQuiz.questions[currentQuestionIdx].question}
              </h3>
            </div>
            <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black rounded-full uppercase tracking-wider">
              সময় শেষ (Time Up)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1 my-auto">
            {/* Visual Answer Breakdown Bar Chart (High contrast & Pure CSS for perfect readability) */}
            <div className="md:col-span-7 bg-slate-950/60 p-6 rounded-3xl border border-white/10 space-y-5">
              <h4 className="text-xs font-black text-cyan-300 uppercase tracking-wider">উত্তর প্রদানের বিবরণী</h4>
              
              <div className="space-y-4">
                {selectedQuiz.questions[currentQuestionIdx].options.map((option, idx) => {
                  const count = activePlayerStats.optionCount[idx] || 0;
                  const total = answersCount || 1;
                  const percent = Math.round((count / total) * 100);
                  const isCorrect = idx === selectedQuiz.questions[currentQuestionIdx].correctAnswer;
                  
                  const progressColors = [
                    "bg-rose-500 border-rose-400",
                    "bg-blue-500 border-blue-400",
                    "bg-amber-500 border-amber-400",
                    "bg-emerald-500 border-emerald-400"
                  ];

                  const letterLabels = ["A", "B", "C", "D"];

                  return (
                    <div key={idx} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-300 flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-xs">
                          <span className="w-5 h-5 rounded-lg bg-white dark:bg-slate-900/5 text-white flex items-center justify-center text-[10px] font-mono shrink-0">
                            {letterLabels[idx]}
                          </span>
                          <span className="truncate">{option}</span>
                        </span>
                        <span className="font-mono flex items-center gap-2">
                          <span className="text-slate-400">{count} জন</span>
                          <span className={isCorrect ? "text-emerald-400" : "text-slate-400"}>({percent}%)</span>
                          {isCorrect && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                        </span>
                      </div>
                      <div className={`w-full h-5 bg-slate-900 rounded-xl overflow-hidden flex items-center border ${
                        isCorrect ? "border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]" : "border-white/5"
                      }`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: idx * 0.08 }}
                          className={`h-full ${progressColors[idx]} rounded-lg relative overflow-hidden`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                        </motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Correct Answer & Explanation Card (Explicitly requested information only) */}
            <div className="md:col-span-5 bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500 text-slate-950 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase font-black tracking-wider block">সঠিক উত্তর</span>
                  <span className="text-sm font-black text-white">
                    {selectedQuiz.questions[currentQuestionIdx].options[selectedQuiz.questions[currentQuestionIdx].correctAnswer]}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-white/5 space-y-2">
                <span className="text-[10px] text-cyan-400 uppercase font-black tracking-wider block">ব্যাখ্যা (Explanation)</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedQuiz.questions[currentQuestionIdx].explanation}
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ====================================
          STATE 5: REAL-TIME LEADERBOARD RANKING
          ==================================== */}
      {gameState === "leaderboard" && (
        <div className="flex-1 p-6 md:p-8 bg-slate-950 text-white flex flex-col justify-between space-y-6">
          <div className="border-b border-white/10 pb-4 text-center space-y-1">
            <span className="text-[10px] text-cyan-400 uppercase font-black tracking-wider block">
              কুইজ র‍্যাঙ্কিং বোর্ড (Current Standings)
            </span>
            <h3 className="text-xl font-black text-white">
              চলতি প্রশ্ন পর্বের ফলাফল
            </h3>
          </div>

          {/* Rankings Board List with high contrast and FLIP position slide animation (Requirement 1 - ঘ) */}
          <div className="max-w-xl mx-auto w-full flex-1 overflow-y-auto max-h-[340px] pr-1 space-y-2.5 my-auto justify-center flex flex-col">
            <AnimatePresence mode="popLayout">
              {joinedPlayers.slice(0, 5).map((player, idx) => {
                const rankBg = [
                  "bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]",
                  "bg-slate-300 text-slate-950 ring-2 ring-slate-200",
                  "bg-amber-600 text-white ring-2 ring-amber-500",
                  "bg-slate-800 text-slate-300",
                  "bg-slate-800 text-slate-300"
                ];
                
                return (
                  <motion.div
                    layout
                    key={player.id || player.name || `rank-${idx}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      layout: { type: "spring", stiffness: 350, damping: 26 },
                      opacity: { duration: 0.25 },
                      delay: idx * 0.05
                    }}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all shadow-md ${
                      idx === 0
                        ? "bg-amber-500/15 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/30"
                        : "bg-slate-900/80 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl font-black flex items-center justify-center text-xs shrink-0 ${rankBg[idx]}`}>
                        {idx + 1}
                      </span>
                      {player.avatar && (player.avatar.startsWith("http") || player.avatar.startsWith("/")) ? (
                        <img
                          src={player.avatar}
                          alt="avatar"
                          className="w-8 h-8 rounded-xl object-cover border border-white/15 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-slate-950 border border-white/15 flex items-center justify-center text-lg shadow-inner shrink-0">
                          <span>{player.avatar || "🤖"}</span>
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-white text-sm truncate">{player.name}</span>
                        {idx === 0 && (
                          <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                            👑 লিডার (Current Leader)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-0.5 shrink-0">
                      <span className="text-sm font-black font-mono text-cyan-300">{player.score} pts</span>
                      {player.streak > 1 && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-black uppercase border border-rose-500/30 animate-pulse">
                          <Flame className="w-3 h-3 text-rose-400 fill-rose-400" />
                          <span>{player.streak}x Streak</span>
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

        </div>
      )}

      {/* ====================================
          STATE 6: FINAL CHAMPIONS PODIUM
          ==================================== */}
      {gameState === "podium" && (
        <div className="flex-1 p-6 md:p-8 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white flex flex-col justify-between space-y-6 text-center relative overflow-y-auto">
          {/* Background celebration glow lights */}
          <div className="absolute -top-20 left-1/4 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -top-20 right-1/4 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

          <div className="space-y-1 relative z-10">
            <StudentAchievementTrophySVG size={90} className="mx-auto mb-2 animate-bounce drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]" />
            <span className="text-[10px] text-cyan-300 uppercase font-black tracking-widest block">
              কুইজ সেশন সমাপ্ত (Session Ended)
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              অভিনন্দন! চ্যাম্পিয়ন ট্রফি বিজয়ী তালিকা
            </h3>
          </div>

          {/* Visual 3D Podium Layout with Spring Height Animations */}
          <div className="flex items-end justify-center gap-3 sm:gap-6 py-6 max-w-xl mx-auto w-full flex-1 relative z-10">
            {/* 2nd Place (Silver) */}
            {joinedPlayers[1] && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
                className="flex flex-col items-center gap-2 w-28 sm:w-36 text-xs"
              >
                <div className="relative">
                  <img
                    src={joinedPlayers[1].avatar}
                    alt="2nd"
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-slate-300 dark:border-slate-700 object-cover shadow-[0_0_20px_rgba(203,213,225,0.4)]"
                  />
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-slate-300 text-slate-950 font-black text-[9px] shadow-sm">
                    2nd
                  </span>
                </div>
                <span className="font-extrabold text-white text-xs truncate max-w-full">{joinedPlayers[1].name.split(" ")[0]}</span>
                <span className="text-[10px] font-mono text-slate-300 block">{joinedPlayers[1].score} pts</span>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: "100px" }}
                  transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.3 }}
                  className="w-full bg-gradient-to-t from-slate-600 via-slate-400 to-slate-300 text-slate-950 rounded-t-2xl flex flex-col items-center justify-center font-black text-xl border-t-2 border-white shadow-xl shadow-slate-900/40"
                >
                  <span>2</span>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-800 dark:text-slate-200">রৌপ্য পদক</span>
                </motion.div>
              </motion.div>
            )}

            {/* 1st Place (Gold Champion - Center & Tallest) */}
            {joinedPlayers[0] && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="flex flex-col items-center gap-2 w-32 sm:w-44 text-xs relative -top-4"
              >
                <div className="absolute -top-7 text-amber-400 animate-bounce text-2xl drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]">
                  👑
                </div>
                <div className="relative">
                  <img
                    src={joinedPlayers[0].avatar}
                    alt="1st"
                    className="w-14 h-14 sm:w-18 sm:h-18 rounded-3xl border-4 border-amber-400 object-cover shadow-[0_0_35px_rgba(251,191,36,0.7)]"
                  />
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] shadow-md ring-2 ring-amber-200">
                    1st
                  </span>
                </div>
                <span className="font-black text-white text-sm sm:text-base truncate max-w-full drop-shadow-md">
                  {joinedPlayers[0].name.split(" ")[0]}
                </span>
                <span className="text-xs font-mono font-black text-amber-300 block">{joinedPlayers[0].score} pts</span>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: "145px" }}
                  transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.15 }}
                  className="w-full bg-gradient-to-t from-amber-600 via-amber-400 to-yellow-300 text-slate-950 rounded-t-2xl flex flex-col items-center justify-center font-black text-3xl border-t-2 border-yellow-100 shadow-[0_0_35px_rgba(245,158,11,0.5)]"
                >
                  <span>1</span>
                  <span className="text-[10px] uppercase tracking-widest font-black text-slate-900 dark:text-slate-100">স্বর্ণ চ্যাম্পিয়ন</span>
                </motion.div>
              </motion.div>
            )}

            {/* 3rd Place (Bronze) */}
            {joinedPlayers[2] && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.3 }}
                className="flex flex-col items-center gap-2 w-28 sm:w-36 text-xs"
              >
                <div className="relative">
                  <img
                    src={joinedPlayers[2].avatar}
                    alt="3rd"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border-2 border-amber-600 object-cover shadow-[0_0_20px_rgba(217,119,6,0.3)]"
                  />
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-amber-700 text-white font-black text-[9px] shadow-sm">
                    3rd
                  </span>
                </div>
                <span className="font-extrabold text-white text-xs truncate max-w-full">{joinedPlayers[2].name.split(" ")[0]}</span>
                <span className="text-[10px] font-mono text-slate-300 block">{joinedPlayers[2].score} pts</span>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: "75px" }}
                  transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.4 }}
                  className="w-full bg-gradient-to-t from-amber-900 via-amber-800 to-amber-600 text-white rounded-t-2xl flex flex-col items-center justify-center font-black text-lg border-t-2 border-amber-500 shadow-xl shadow-slate-900/40"
                >
                  <span>3</span>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-200">ব্রোঞ্জ পদক</span>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Permanent Score Archiving Status Banner */}
          <div className="w-full max-w-lg mx-auto p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/40 relative z-10">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-black text-white">সকল ফলাফল ডাটাবেসে সফলভাবে সংরক্ষিত হয়েছে</div>
                <div className="text-[10px] text-emerald-400 font-medium">শিক্ষার্থী পয়েন্ট ও পরিসংখ্যান পার্মানেন্টলি আর্কাইভড ✅</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowResultModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
            >
              শীট দেখুন 📊
            </button>
          </div>

          <div className="border-t border-white/10 pt-4 flex flex-wrap gap-2.5 justify-center items-center max-w-xl mx-auto w-full relative z-10">
            <button
              onClick={() => {
                try {
                  confetti({
                    particleCount: 100,
                    spread: 80,
                    origin: { y: 0.6 }
                  });
                } catch (e) {}
              }}
              className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>কনফেটি ফুটান</span>
            </button>

            <button
              onClick={() => downloadResultsCsv()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>রেজাল্ট ডাউনলোড (CSV)</span>
            </button>

            <button
              onClick={() => setShowResultModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>পূর্ণাঙ্গ স্কোরকার্ড</span>
            </button>

            <button
              onClick={resetGame}
              className="px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>নতুন কুইজ হোস্ট</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 6A: STUDENT LIVE SCREEN EXPERIENCE (MENTIMETER MOBILE DARK MODE) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showStudentJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm sm:max-w-md h-[94vh] sm:h-[90vh] max-h-[840px] bg-[#181818] border border-neutral-800 rounded-3xl sm:rounded-[38px] shadow-2xl text-white flex flex-col justify-between overflow-hidden select-none"
            >
              {/* ------------------------------------------------------------- */}
              {/* TOP STATUS BAR: MENTIMETER LOGO, CONNECTED DEVICE & PIN */}
              {/* ------------------------------------------------------------- */}
              <div className="shrink-0 px-5 pt-4 pb-2 flex items-center justify-between border-b border-white/5 bg-[#181818]/90 backdrop-blur-md z-20">
                <div className="flex items-center gap-2">
                  {/* Stylized Menti M Logo */}
                  <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-base sm:text-lg">
                    <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#ff4f64] via-[#7d5bf6] to-[#00d084] flex items-center justify-center text-white font-black text-xs shadow-xs">
                      M
                    </span>
                    <span>Mentimeter</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* 1 Device Connected Pill */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-[11px] font-bold text-neutral-300">
                    <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                    <span>1 device</span>
                  </div>

                  {/* Close Modal Button */}
                  <button
                    type="button"
                    onClick={() => setShowStudentJoinModal(false)}
                    className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="বন্ধ করুন"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* MAIN CONTENT STAGE (DYNAMICALLY CONTROLLED BY GAME STATE) */}
              {/* ------------------------------------------------------------- */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col justify-center relative z-10 scrollbar-none">
                {studentJoinStatus !== "joined" ? (
                  /* STEP 1: JOIN FORM WITH 36 AVATARS */
                  <form onSubmit={handleStudentJoinSubmit} className="space-y-4 my-auto">
                    <div className="text-center space-y-1">
                      <h3 className="text-xl font-black text-white">লাইভ ক্লাসে যোগ দিন</h3>
                      <p className="text-xs text-neutral-400">৬ ডিজিটের পিন ও নাম দিয়ে অংশগ্রহণ করুন</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        গেম পিন (Game PIN)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={studentInputPin}
                        onChange={(e) => setStudentInputPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="যেমন: 889120"
                        className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-2xl text-center font-mono text-xl font-black tracking-widest text-cyan-400 focus:outline-hidden focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        শিক্ষার্থীর নাম
                      </label>
                      <input
                        type="text"
                        maxLength={24}
                        value={studentInputName}
                        onChange={(e) => setStudentInputName(e.target.value)}
                        placeholder="আপনার নাম লিখুন..."
                        className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-2xl text-sm font-bold text-white focus:outline-hidden focus:border-indigo-500"
                        required
                      />
                    </div>

                    {/* 36 Avatars Grid with Penguin default */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                          অ্যাভাটার নির্বাচন
                        </label>
                        <span className="text-xl">{studentSelectedAvatar}</span>
                      </div>
                      <div className="max-h-36 overflow-y-auto grid grid-cols-6 gap-2 p-2 bg-neutral-900 rounded-2xl border border-neutral-800">
                        {ALL_36_AVATARS.map((av) => {
                          const isSelected = studentSelectedAvatar === av;
                          return (
                            <button
                              key={av}
                              type="button"
                              onClick={() => selectAvatar(av)}
                              className={`text-2xl p-1.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? "scale-110 ring-2 ring-indigo-500 bg-indigo-600/30"
                                  : "bg-neutral-800 hover:bg-neutral-700"
                              }`}
                            >
                              <span>{av}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {studentJoinError && (
                      <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs text-center font-medium">
                        {studentJoinError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={studentJoinStatus === "joining"}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 text-white font-bold text-sm shadow-lg active:scale-95 transition-all cursor-pointer"
                    >
                      {studentJoinStatus === "joining" ? "যুক্ত হচ্ছে..." : "লবিতে প্রবেশ করুন"}
                    </button>
                  </form>
                ) : (
                  /* STEP 2: ACTIVE MENTIMETER MOBILE PARTICIPANT INTERFACE */
                  <div className="my-auto space-y-5 text-center">
                    {/* -------------------------------------------------- */}
                    {/* CASE 1: LOBBY / GET READY SCREEN */}
                    {/* -------------------------------------------------- */}
                    {gameState === "lobby" && (
                      <div className="space-y-4 animate-fade-in">
                        {/* Big Centered Avatar in Soft Blue Circle */}
                        <div className="relative w-32 h-32 rounded-full bg-gradient-to-b from-[#8da4ea] to-[#607cd4] flex items-center justify-center shadow-2xl mx-auto border-4 border-[#181818] overflow-hidden">
                          {studentJoinedData?.avatar === "🐧" || !studentJoinedData?.avatar ? (
                            <div className="text-6xl drop-shadow-md">🐧</div>
                          ) : (
                            <div className="text-6xl drop-shadow-md">{studentJoinedData?.avatar}</div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs text-neutral-400 font-semibold block">
                            Question {currentQuestionIdx + 1} of {selectedQuiz.questions.length}
                          </span>
                          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            Get ready to play {studentJoinedData?.name}!
                          </h3>
                          <p className="text-xs text-neutral-400">
                            All correct responses give max points
                          </p>
                        </div>
                      </div>
                    )}

                    {/* -------------------------------------------------- */}
                    {/* CASE 1.5: GET READY SCREEN (PHASE 1) */}
                    {/* -------------------------------------------------- */}
                    {gameState === "question" && hostSequencePhase === "READY" && (
                      <div className="space-y-4 animate-fade-in py-2">
                        <div className="relative w-28 h-28 rounded-full bg-linear-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-2xl mx-auto border-4 border-amber-400/40 animate-pulse">
                          <span className="text-5xl">⚡</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
                            প্রস্তুত হোন! (GET READY)
                          </span>
                          <h3 className="text-lg font-black text-white">
                            প্রশ্ন {currentQuestionIdx + 1} আসছে...
                          </h3>
                          <p className="text-xs text-neutral-400">
                            স্ক্রিনের দিকে লক্ষ্য রাখুন! দ্রুত সঠিক উত্তরে বেশি পয়েন্ট।
                          </p>
                        </div>
                      </div>
                    )}

                    {/* -------------------------------------------------- */}
                    {/* CASE 2: COUNTDOWN SCREEN */}
                    {/* -------------------------------------------------- */}
                    {gameState === "question" && hostSequencePhase === "COUNTDOWN" && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="relative w-28 h-28 rounded-full bg-gradient-to-b from-[#8da4ea] to-[#607cd4] flex items-center justify-center shadow-2xl mx-auto border-4 border-[#181818]">
                          <span className="text-5xl font-black text-white font-mono animate-ping">
                            {hostCountdownSec > 0 ? hostCountdownSec : "GO!"}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs text-neutral-400 font-semibold block">
                            Question {currentQuestionIdx + 1} of {selectedQuiz.questions.length}
                          </span>
                          <h3 className="text-lg font-bold text-white line-clamp-2">
                            {selectedQuiz.questions[currentQuestionIdx]?.question}
                          </h3>
                        </div>
                      </div>
                    )}

                    {/* -------------------------------------------------- */}
                    {/* CASE 3: ACTIVE VOTING / INPUT SCREEN */}
                    {/* -------------------------------------------------- */}
                    {gameState === "question" && (hostSequencePhase === "QUESTION_ACTIVE" || hostSequencePhase === "QUESTION_PREVIEW") && (
                      <div className="space-y-4 animate-fade-in">
                        {/* Question Title & Points Bar */}
                        <div className="text-left space-y-2">
                          <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                            {selectedQuiz.questions[currentQuestionIdx]?.question}
                          </h3>

                          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                            <span>1,000p</span>
                            <span>{timeLeft}s</span>
                          </div>
                          {/* Animated Timer Line */}
                          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-indigo-500"
                              animate={{ width: `${(timeLeft / 20) * 100}%` }}
                              transition={{ duration: 1, ease: "linear" }}
                            />
                          </div>
                        </div>

                        {/* Input or Options Form */}
                        {studentSubmittedAnswer === null ? (
                          <div className="space-y-3 pt-2">
                            {/* Short Answer / Type Answer Mode */}
                            <div className="space-y-2">
                              <div className="relative">
                                <input
                                  type="text"
                                  maxLength={100}
                                  value={studentTypedInput}
                                  onChange={(e) => setStudentTypedInput(e.target.value)}
                                  placeholder="সঠিক উত্তরটি লিখুন..."
                                  className="w-full px-4 py-3.5 bg-neutral-900 border-2 border-indigo-500/50 rounded-2xl text-sm font-bold text-white placeholder-neutral-500 focus:outline-hidden focus:border-indigo-400"
                                />
                                <span className="absolute right-3.5 bottom-3 text-[10px] font-mono text-neutral-500">
                                  {100 - studentTypedInput.length}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleStudentAnswerSubmit(studentTypedInput)}
                                disabled={!studentTypedInput.trim()}
                                className="w-full py-3.5 rounded-2xl bg-[#5974c8] hover:bg-[#4a63b3] disabled:opacity-40 text-white font-black text-sm shadow-md transition-all cursor-pointer"
                              >
                                Submit
                              </button>
                            </div>

                            {/* Or 4 Tactile MCQ Options */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800">
                              {selectedQuiz.questions[currentQuestionIdx]?.options.map((opt, oIdx) => {
                                const btnColors = [
                                  "bg-rose-600 hover:bg-rose-700",
                                  "bg-blue-600 hover:bg-blue-700",
                                  "bg-amber-600 hover:bg-amber-700",
                                  "bg-emerald-600 hover:bg-emerald-700",
                                ];
                                const labels = ["▲", "♦", "●", "■"];
                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => handleStudentAnswerSubmit(oIdx)}
                                    className={`${btnColors[oIdx]} text-white p-3 rounded-2xl text-xs font-bold flex items-center justify-between text-left transition-all active:scale-95 cursor-pointer shadow-md`}
                                  >
                                    <span className="truncate pr-1">{opt}</span>
                                    <span className="opacity-60">{labels[oIdx]}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          /* After Submission Feedback */
                          <div className="py-6 space-y-3 animate-fade-in">
                            <div className="relative w-28 h-28 rounded-full bg-gradient-to-b from-[#8da4ea] to-[#607cd4] flex items-center justify-center shadow-2xl mx-auto border-4 border-[#181818]">
                              <div className="text-5xl">🐧</div>
                            </div>
                            <h4 className="text-lg font-black text-white">Let's see your results</h4>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 text-xs font-mono font-bold">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              <span>⏱️ {studentAnswerTime} Seconds to respond</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* -------------------------------------------------- */}
                    {/* CASE 4: RESULT EVALUATION (CORRECT / INCORRECT) */}
                    {/* -------------------------------------------------- */}
                    {(gameState === "answer-stats" || gameState === "leaderboard") && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="relative w-32 h-32 rounded-full bg-gradient-to-b from-[#8da4ea] to-[#607cd4] flex items-center justify-center shadow-2xl mx-auto border-4 border-[#181818]">
                          <div className="text-6xl">🐧</div>
                        </div>

                        {studentAnswerCorrect === true ? (
                          <div className="space-y-1">
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto shadow-md">
                              <Check className="w-5 h-5 stroke-[3]" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Correct</h3>
                            <p className="text-xs text-emerald-400 font-mono font-bold">+1,000 Points Earned!</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="w-8 h-8 rounded-full bg-neutral-700 text-neutral-300 flex items-center justify-center mx-auto shadow-md">
                              <X className="w-5 h-5 stroke-[3]" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Incorrect</h3>
                            <p className="text-xs text-neutral-400">
                              সঠিক উত্তর: <strong className="text-amber-300">{selectedQuiz.questions[currentQuestionIdx]?.options[selectedQuiz.questions[currentQuestionIdx]?.correctAnswer]}</strong>
                            </p>
                          </div>
                        )}

                        <div className="pt-2 text-xs text-neutral-400 flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                          <span>Loading result ...</span>
                        </div>
                      </div>
                    )}

                    {/* -------------------------------------------------- */}
                    {/* CASE 5: FINAL PODIUM & WINNER MODAL */}
                    {/* -------------------------------------------------- */}
                    {gameState === "podium" && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="relative w-32 h-32 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl mx-auto border-4 border-[#181818]">
                          <Trophy className="w-16 h-16 text-white drop-shadow-md" />
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                            কুইজ সমাপ্ত!
                          </span>
                          <h3 className="text-xl font-black text-white">
                            You are the winner {studentJoinedData?.name}!
                          </h3>
                        </div>

                        {/* Menti Rating Card */}
                        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 text-left">
                          <h4 className="text-xs font-bold text-white text-center">Thanks for joining!</h4>
                          <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => {
                                  setStudentRating(star);
                                  setStudentRated(true);
                                  playSound("success");
                                }}
                                className={`text-xl cursor-pointer transition-transform hover:scale-125 ${
                                  star <= studentRating ? "text-amber-400" : "text-neutral-600"
                                }`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          {studentRated && (
                            <p className="text-[11px] text-emerald-400 font-bold text-center">
                              রেটিং প্রদানের জন্য ধন্যবাদ! ⭐
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* BOTTOM PERSISTENT DOCK: 4 REACTIONS, COMMENTS & Q&A BUTTONS */}
              {/* ------------------------------------------------------------- */}
              {studentJoinStatus === "joined" && (
                <div className="shrink-0 p-4 pt-2 border-t border-white/5 bg-[#181818] space-y-3 z-20">
                  {/* Floating Emoji Reactions Bar (4 Red Circular Pills) */}
                  <div className="flex items-center justify-center gap-3">
                    {[
                      { key: "heart", emoji: "❤️" },
                      { key: "question", emoji: "❓" },
                      { key: "thumbs_up", emoji: "👍" },
                      { key: "cat", emoji: "🐱" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleStudentReaction(item.key)}
                        className="w-12 h-12 rounded-full bg-[#2a1b1b] border-2 border-[#e05252] hover:bg-[#3d2424] text-xl flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-md"
                        title={item.key}
                      >
                        <span>{item.emoji}</span>
                      </button>
                    ))}
                  </div>

                  {/* Comment & Q&A Action Buttons */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setStudentCommentDrawerOpen(true)}
                      className="w-full py-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      Send a comment
                    </button>

                    <button
                      type="button"
                      onClick={() => setStudentQaModalOpen(true)}
                      className="w-full py-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      Open Q&A
                    </button>
                  </div>

                  {/* Share Code Link */}
                  <div className="pt-1 flex items-center justify-center gap-1 text-[11px] text-neutral-400 font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(studentInputPin || gamePin);
                        alert(`Game PIN ${studentInputPin || gamePin} কপি করা হয়েছে!`);
                      }}
                      className="hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Share code</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SLIDE-UP BOTTOM DRAWER: SEND COMMENT */}
              {/* ------------------------------------------------------------- */}
              <AnimatePresence>
                {studentCommentDrawerOpen && (
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 250 }}
                    className="absolute inset-x-0 bottom-0 bg-[#212121] border-t border-neutral-700 rounded-t-[32px] p-5 shadow-2xl z-30 space-y-4 text-white"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">Comment</h4>
                      <button
                        type="button"
                        onClick={() => setStudentCommentDrawerOpen(false)}
                        className="p-1 rounded-full text-neutral-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {studentCommentSentMsg ? (
                      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-1">
                        <span className="text-xs text-neutral-400 block">Comment sent</span>
                        <span className="text-sm font-bold text-white block">{studentCommentSentMsg}</span>
                      </div>
                    ) : (
                      <>
                        {/* Quick Preset Pills */}
                        <div className="flex flex-wrap gap-2">
                          {["😍", "Amazing! 😍", "Woohoo! 🥳", "🔥🔥", "Mind. Blown. 🤯"].map((pill) => (
                            <button
                              key={pill}
                              type="button"
                              onClick={() => handleSendComment(pill)}
                              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-bold text-white transition-all cursor-pointer"
                            >
                              {pill}
                            </button>
                          ))}
                        </div>

                        {/* Custom Textarea */}
                        <div className="relative">
                          <textarea
                            maxLength={100}
                            rows={3}
                            value={studentCommentText}
                            onChange={(e) => setStudentCommentText(e.target.value)}
                            placeholder="Write your comment"
                            className="w-full p-3.5 bg-neutral-900 border border-neutral-700 rounded-2xl text-xs font-medium text-white focus:outline-hidden focus:border-indigo-500 resize-none"
                          />
                          <span className="absolute right-3 bottom-3 text-[10px] font-mono text-neutral-500">
                            {100 - studentCommentText.length}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSendComment(studentCommentText)}
                          disabled={!studentCommentText.trim()}
                          className="w-full py-3 rounded-full bg-white text-black font-black text-xs hover:bg-neutral-200 disabled:opacity-40 transition-all cursor-pointer"
                        >
                          Submit
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ------------------------------------------------------------- */}
              {/* SLIDE-UP BOTTOM DRAWER: OPEN Q&A */}
              {/* ------------------------------------------------------------- */}
              <AnimatePresence>
                {studentQaModalOpen && (
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 250 }}
                    className="absolute inset-x-0 bottom-0 bg-[#212121] border-t border-neutral-700 rounded-t-[32px] p-5 shadow-2xl z-30 space-y-4 text-white"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">Q&A</h4>
                      <button
                        type="button"
                        onClick={() => setStudentQaModalOpen(false)}
                        className="p-1 rounded-full text-neutral-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {studentQaSentMsg ? (
                      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-1">
                        <span className="text-xs text-emerald-400 font-bold block">{studentQaSentMsg}</span>
                      </div>
                    ) : (
                      <div className="text-center py-2 space-y-3">
                        {/* Stylized Chat Bubble Icon */}
                        <div className="w-16 h-16 mx-auto flex items-center justify-center">
                          <div className="relative w-12 h-12">
                            <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-[#5974c8]" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#4a5fb3]" />
                          </div>
                        </div>

                        <p className="text-xs text-neutral-300">
                          Do you have a question for the presenter? Be the first to ask!
                        </p>

                        <div className="space-y-2">
                          <input
                            type="text"
                            maxLength={120}
                            value={studentQaInput}
                            onChange={(e) => setStudentQaInput(e.target.value)}
                            placeholder="আপনার প্রশ্নটি লিখুন..."
                            className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendQaQuestion(studentQaInput)}
                            disabled={!studentQaInput.trim()}
                            className="w-full py-3 rounded-full bg-white text-black font-black text-xs hover:bg-neutral-200 disabled:opacity-40 transition-all cursor-pointer"
                          >
                            Ask new question
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Phase 6B: Gemini AI Quiz Generator Modal */}
      <AiQuizGeneratorModal
        isOpen={showAiGeneratorModal}
        onClose={() => setShowAiGeneratorModal(false)}
        onLaunchLiveQuiz={(questions: BtebQuizQuestion[], meta) => {
          const aiQuiz: Quiz = {
            id: `ai-quiz-${Date.now()}`,
            title: meta.title,
            trade: meta.trade,
            level: "BTEB ভোকেশনাল",
            questions: questions.map((q, idx) => ({
              id: idx + 1,
              question: q.question,
              options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
              correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : typeof (q as any).correctIndex === "number" ? (q as any).correctIndex : 0,
              explanation: q.explanation || ""
            }))
          };
          startLobby(aiQuiz);
        }}
        onSaveToQuestionBank={(questions: BtebQuizQuestion[], meta) => {
          const quizRecord = {
            id: `qz-ai-${Date.now()}`,
            title: meta.title,
            category: meta.trade,
            classId: 4,
            teacherId: 3,
            status: "active",
            createdAt: new Date().toISOString()
          };
          institutionalDb.quizzes.unshift(quizRecord as any);
          questions.forEach((q, idx) => {
            institutionalDb.quizQuestions.push({
              id: `qq-ai-${Date.now()}-${idx}`,
              quizId: quizRecord.id,
              questionType: "mcq_single",
              questionSnapshot: {
                questionText: q.question,
                options: q.options,
                correctIndex: q.correctAnswer,
                explanation: q.explanation
              }
            } as any);
          });
        }}
      />

      {/* Real-time Student Live Comments Ticker Overlay on Host Screen */}
      {isLive && liveSessionComments.length > 0 && (
        <div className="fixed bottom-24 right-6 z-30 pointer-events-none flex flex-col items-end gap-2 max-w-xs">
          <AnimatePresence>
            {liveSessionComments.slice(0, 3).map((cm) => (
              <motion.div
                key={cm.id}
                initial={{ opacity: 0, x: 40, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="p-2.5 px-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-700/80 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-white"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-sm shrink-0">
                  {cm.avatar}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-neutral-400 block font-bold truncate">{cm.name}</span>
                  <span className="text-xs font-black text-amber-300 block truncate">{cm.text}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Floating Reactions and Sticky Host Presentation Control Bar */}
      {isLive && (
        <>
          <FloatingReactionOverlay />

          {/* Sticky Host Presentation Control Bar (Requirement 4) */}
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky bottom-0 z-40 w-full bg-slate-950/95 border-t border-cyan-500/30 backdrop-blur-xl px-4 py-3 shadow-[0_-10px_35px_rgba(0,0,0,0.8)]"
          >
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
              {/* Left: Phase & Attendance Status */}
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider">
                    {gameState === "lobby"
                      ? "লবি ফেজ (Lobby)"
                      : gameState === "question"
                      ? `প্রশ্ন ${currentQuestionIdx + 1} / ${selectedQuiz.questions.length}`
                      : gameState === "answer-stats"
                      ? "উত্তর বিশ্লেষণ (Stats)"
                      : gameState === "leaderboard"
                      ? "লিডারবোর্ড (Rankings)"
                      : "চ্যাম্পিয়ন পোডিয়াম"}
                  </span>
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{joinedPlayers.length} জন শিক্ষার্থী যুক্ত</span>
                  </span>
                </div>
              </div>

              {/* Center: 4 Master Host Actions */}
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                {/* 1. Previous Slide */}
                <button
                  type="button"
                  onClick={() => {
                    if (gameState === "answer-stats" || gameState === "leaderboard") {
                      setGameState("question");
                    } else if (currentQuestionIdx > 0) {
                      setCurrentQuestionIdx((prev) => prev - 1);
                      setGameState("question");
                      setTimeLeft((selectedQuiz.questions[currentQuestionIdx - 1] as any)?.timeLimit || 20);
                    }
                  }}
                  disabled={gameState === "lobby" || (currentQuestionIdx === 0 && gameState === "question")}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>◀️ প্রিভিয়াস</span>
                </button>

                {/* 2. Reveal Answer */}
                <button
                  type="button"
                  onClick={() => {
                    setGameState("answer-stats");
                  }}
                  disabled={gameState === "answer-stats" || gameState === "lobby" || gameState === "podium"}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    gameState === "answer-stats"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 opacity-70"
                      : "bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-400 shadow-md shadow-amber-500/20"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-slate-950" />
                  <span>👁️ উত্তর দেখান / Reveal</span>
                </button>

                {/* 3. Leaderboard */}
                <button
                  type="button"
                  onClick={() => {
                    goToLeaderboard();
                  }}
                  disabled={gameState === "lobby" || gameState === "leaderboard" || gameState === "podium"}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    gameState === "leaderboard"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 opacity-70"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400 shadow-md shadow-indigo-600/30"
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-300" />
                  <span>🏆 লিডারবোর্ড</span>
                </button>

                {/* 4. Next Slide */}
                <button
                  type="button"
                  onClick={() => {
                    if (gameState === "lobby") {
                      startQuizGame();
                    } else if (gameState === "question") {
                      setGameState("answer-stats");
                    } else if (gameState === "answer-stats") {
                      goToLeaderboard();
                    } else if (gameState === "leaderboard") {
                      nextQuestion();
                    } else if (gameState === "podium") {
                      resetGame();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>
                    {gameState === "lobby"
                      ? "কুইজ শুরু করুন ➔"
                      : gameState === "podium"
                      ? "পুনরায় শুরু ➔"
                      : "পরবর্তী স্লাইড ➔"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-950" />
                </button>

                {/* 5. End Session (Save & Archive) */}
                {gameState !== "lobby" && gameState !== "podium" && (
                  <button
                    type="button"
                    onClick={handleEndSession}
                    className="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-rose-950/40"
                    title="কুইজ সমাপ্ত করুন এবং ফলাফল ডাটাবেসে সেভ করুন"
                  >
                    <span>🛑 সেশন সমাপ্ত</span>
                  </button>
                )}

                {/* Podium Quick Actions */}
                {gameState === "podium" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowResultModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>স্কোরকার্ড</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadResultsCsv()}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>
                  </>
                )}
              </div>

              {/* Right: Sound, Fullscreen & Exit */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title={soundEnabled ? "শব্দ বন্ধ করুন" : "শব্দ চালু করুন"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="ফুলস্ক্রিন টগল"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4 text-slate-300" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm("আপনি কি লাইভ সেশন সমাপ্ত করতে চান?")) {
                      onExitLive ? onExitLive() : resetGame();
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-950/70 border border-rose-800/80 hover:bg-rose-900 text-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  title="সেশন প্রস্থান"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">প্রস্থান</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* ========================================================================= */}
      {/* DETAILED RESULTS & SCORE ARCHIVE MODAL (FOR TEACHER REVIEW & DOWNLOAD) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showResultModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-black">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      কুইজ রেজাল্ট ও মেধা তালিকা (Archived Quiz Results)
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedQuiz.title} • {selectedQuiz.trade} • {new Date().toLocaleDateString("bn-BD")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadResultsCsv()}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>CSV ডাউনলোড</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                  >
                    <Printer className="w-4 h-4" />
                    <span>প্রিন্ট</span>
                  </button>
                  <button
                    onClick={() => setShowResultModal(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Stats Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800/80 shrink-0 text-center">
                <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">মোট অংশগ্রহণকারী</span>
                  <span className="text-xl font-black text-white">{joinedPlayers.length} জন</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">মোট প্রশ্ন</span>
                  <span className="text-xl font-black text-cyan-400">{selectedQuiz.questions.length} টি</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">সর্বোচ্চ স্কোর</span>
                  <span className="text-xl font-black text-amber-400">{joinedPlayers[0]?.score || 0} pts</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">ডাটাবেস স্ট্যাটাস</span>
                  <span className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> সংরক্ষিত
                  </span>
                </div>
              </div>

              {/* Table of Participant Results */}
              <div className="overflow-y-auto flex-1 p-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-400">
                      <th className="pb-3 px-3">র‍্যাঙ্ক</th>
                      <th className="pb-3 px-3">শিক্ষার্থী</th>
                      <th className="pb-3 px-3">আইডি / রোল</th>
                      <th className="pb-3 px-3 text-right">স্কোর</th>
                      <th className="pb-3 px-3 text-center">সঠিক উত্তর</th>
                      <th className="pb-3 px-3 text-right">সঠিকতার হার</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {[...joinedPlayers].sort((a, b) => b.score - a.score).map((player, idx) => {
                      const correctEst = (player as any).correctAnswers ?? Math.round((player.score / 1000) * selectedQuiz.questions.length);
                      const accuracyEst = Math.min(100, Math.round((player.score / (Math.max(1, selectedQuiz.questions.length) * 1000)) * 100));
                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                              idx === 0 ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20" :
                              idx === 1 ? "bg-slate-300 text-slate-950" :
                              idx === 2 ? "bg-amber-700 text-white" :
                              "bg-slate-800 text-slate-400"
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                            <span className="text-base">{player.avatar || "🤖"}</span>
                            <span>{player.name}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-400">
                            {(player as any).studentId || `PTSC-${1000 + idx}`}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-amber-400">
                            {player.score} pts
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-bold">
                              {correctEst} / {selectedQuiz.questions.length}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-cyan-300">
                            {accuracyEst}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 shrink-0">
                <span className="font-mono text-[11px]">
                  PIN: {gamePin} • সেশন আইডি: {sessionId || "Local"}
                </span>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
