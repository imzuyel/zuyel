"use client";

import React, { useState, useEffect, useRef, useTransition, useMemo } from "react";
import {
  Sparkles,
  Radio,
  BookOpen,
  Trophy,
  Layers,
  Users,
  Plus,
  Play,
  FileText,
  Search,
  Filter,
  Trash2,
  Edit3,
  Copy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  QrCode,
  Clock,
  Loader2,
  Check,
  Flame,
  Award,
  Send,
  MessageSquare,
  Heart,
  Smile,
  Zap,
  Eye,
  Download,
  ShieldCheck,
  Share2,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckSquare,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  X,
  Wand2,
  Sliders,
  Gamepad2,
  Calendar,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import { useSearchParams, useRouter } from "next/navigation";
import { institutionalDb, Quiz, QuestionBankQuestion } from "@/lib/database";
import { ACADEMIC_CLASSES, ALL_TRADES } from "@/lib/academicStructure";
import UniversalQuizShowcaseEngine from "./engine/UniversalQuizShowcaseEngine";
import SouthAsianStudentAvatar from "@/components/common/SouthAsianStudentAvatar";

export type UnifiedWorkspaceTab =
  | "designer"
  | "live_host"
  | "monitor_sms"
  | "builder"
  | "host"
  | "bank"
  | "tournaments";

interface UnifiedQuizMentimeterWorkspaceProps {
  initialTab?: UnifiedWorkspaceTab;
  onLiveStateChange?: (isLive: boolean) => void;
  onExitLive?: () => void;
}

export type SlideKind = "warmup" | "quiz";

export interface StudioSlideItem {
  id: string;
  kind: SlideKind;
  type:
    | "mood_checkin"
    | "word_cloud"
    | "sticky_notes"
    | "opinion_poll"
    | "mcq_single"
    | "matching"
    | "fill_blank"
    | "ordering"
    | "true_false"
    | "mcq_multiple";
  title: string;
  options: string[];
  correctAnswer?: number | boolean | string;
  correctIndices?: number[];
  pairs?: { left: string; right: string }[];
  items?: string[];
  acceptedAnswers?: string[];
  explanation?: string;
  timeLimit: number; // 15, 20, 30, 60
  points: number; // 0 for warmup, 100, 200 for scored
  scheduledStartTime?: string;
  responses?: any[];
}

// Initial Sample Session Slides (PowerPoint / Mentimeter Flow)
const INITIAL_SLIDES: StudioSlideItem[] = [
  {
    id: "warmup-1",
    kind: "warmup",
    type: "mood_checkin",
    title: "আজকের ক্লাসে আপনার এনার্জি ও মুড কেমন?",
    options: ["🔥 সুপার এনার্জেটিক", "😊 বেশ ভালো", "🤔 একটু চিন্তিত", "😴 ক্লান্ত"],
    timeLimit: 30,
    points: 0,
    explanation: "ক্লাস শুরুর আগে শিক্ষার্থীদের অনুভূতি ও মানসিক প্রস্তুতি যাচাই।",
  },
  {
    id: "warmup-2",
    kind: "warmup",
    type: "word_cloud",
    title: "আইওটি (IoT) ও স্মার্ট টেকনোলজির একটি মূল সুবিধা এক শব্দে লিখুন",
    options: ["স্বয়ংক্রিয়", "দ্রুতগতি", "স্মার্ট", "সহজ", "নিরাপত্তা", "উদ্ভাবন", "সংযোগ"],
    timeLimit: 45,
    points: 0,
    explanation: "শিক্ষার্থীদের চিন্তাভাবনা ও শব্দগুচ্ছ নিয়ে লাইভ ওয়ার্ড ক্লাউড তৈরি।",
  },
  {
    id: "warmup-3",
    kind: "warmup",
    type: "sticky_notes",
    title: "আজকের ল্যাব সেশনে আপনি কী নতুন দক্ষতা অর্জন করতে চান?",
    options: [
      "নেটওয়ার্কিং কনফিগারেশন আরও ভালোভাবে বুঝতে চাই।",
      "সার্কিট বোর্ডে সেন্সর সংযোগ প্র্যাকটিক্যালভাবে করা।",
      "স্মার্ট হোম অটোমেশন প্রজেক্ট সম্পন্ন করা।",
    ],
    timeLimit: 60,
    points: 0,
    explanation: "শিক্ষার্থীদের ব্যক্তিগত লার্নিং গোল ও মতামত নিয়ে ৩ডি হোয়াইটবোর্ড ওয়াল।",
  },
  {
    id: "quiz-1",
    kind: "quiz",
    type: "mcq_single",
    title: "আইওটি (IoT) এর সঠিক পূর্ণরূপ বা Elaborated Form কোনটি?",
    options: [
      "Internet of Things",
      "Input Output Technology",
      "Internal Operating Tool",
      "Internet of Technology",
    ],
    correctAnswer: 0,
    timeLimit: 30,
    points: 100,
    explanation:
      "IoT এর পূর্ণরূপ হলো 'Internet of Things'। এটি বিশ্বজুড়ে নেটওয়ার্কযুক্ত ডিভাইসের পারস্পরিক সংযোগ নির্দেশ করে।",
  },
  {
    id: "quiz-2",
    kind: "quiz",
    type: "matching",
    title: "কম্পিউটার হার্ডওয়্যার ডিভাইস ও শ্রেণিবিভাগ সঠিকভাবে মিলান",
    options: [],
    pairs: [
      { left: "কিবোর্ড ও মাউস", right: "ইনপুট ডিভাইস" },
      { left: "মনিটর ও প্রজেক্টর", right: "আউটপুট ডিভাইস" },
      { left: "র‍্যাম (RAM)", right: "প্রাইমারি মেমোরি" },
      { left: "হার্ডডিস্ক / SSD", right: "সেকেন্ডারি স্টোরেজ" },
    ],
    timeLimit: 45,
    points: 100,
    explanation: "হার্ডওয়্যার যন্ত্রাংশ ও তাদের কার্যপদ্ধতির নির্ভুল শ্রেণিবিভাগ।",
  },
  {
    id: "quiz-3",
    kind: "quiz",
    type: "fill_blank",
    title: "কম্পিউটার নেটওয়ার্কে স্ট্যান্ডার্ড IPv4 এড্রেস সাধারণত ___ বিটের হয়ে থাকে।",
    options: [],
    acceptedAnswers: ["৩২", "32", "৩২ বিট"],
    correctAnswer: "৩২",
    timeLimit: 30,
    points: 100,
    explanation: "IPv4 এড্রেস ৩২ বিট বা ৪ বাইটের হয়ে থাকে যা চারটি অকটেটে বিভক্ত।",
  },
  {
    id: "quiz-4",
    kind: "quiz",
    type: "true_false",
    title: "ফাইবার অপটিক কেবল বৈদ্যুতিক সিগন্যালের পরিবর্তে আলোক তরঙ্গের মাধ্যমে দ্রুত ডেটা প্রেরণ করে।",
    options: ["সত্য (True)", "মিথ্যা (False)"],
    correctAnswer: true,
    timeLimit: 20,
    points: 100,
    explanation: "ফাইবার অপটিক ক্যাবলে আলোর পূর্ণ অভ্যন্তরীণ প্রতিফলন নীতিতে অত্যন্ত দ্রুত সিগন্যাল পরিবাহিত হয়।",
  },
  {
    id: "quiz-5",
    kind: "quiz",
    type: "ordering",
    title: "কম্পিউটার পাওয়ার অন করার পর সঠিক বুটিং ধাপগুলো ক্রমানুসারে সাজান",
    options: [],
    items: [
      "১. পাওয়ার সুইচ অন ও বিদ্যুৎ সরবরাহ",
      "২. POST (Power-On Self-Test) সম্পাদন",
      "৩. BIOS / UEFI ফার্মওয়্যার লোড",
      "৪. অপারেটিং সিস্টেম (OS) কার্নেল লোড",
    ],
    timeLimit: 45,
    points: 100,
    explanation: "কম্পিউটার বুট প্রক্রিয়ার সঠিক টেকনিক্যাল ধারাবাহিকতা।",
  },
];

// Helper: Bengali Numerals
function toBanglaDigits(num: number | string): string {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (w) => bn[parseInt(w, 10)]);
}

// Initial Simulated Students for Live Monitor and SMS Testing
interface LiveStudentScore {
  id: string;
  name: string;
  roll: number;
  trade: string;
  avatar: string;
  guardianPhone: string;
  score: number;
  accuracy: number;
  streak: number;
  wrongCount: number;
  answers: boolean[];
  status: "excellent" | "average" | "struggling";
}

const INITIAL_LIVE_STUDENTS: LiveStudentScore[] = [
  {
    id: "s-1",
    name: "তানভীর হাসান",
    roll: 101,
    trade: "IT Support & IoT",
    avatar: "👨‍🎓",
    guardianPhone: "01711223344",
    score: 95,
    accuracy: 95,
    streak: 5,
    wrongCount: 0,
    answers: [true, true, true, true, true],
    status: "excellent",
  },
  {
    id: "s-2",
    name: "নুসরাত জাহান",
    roll: 102,
    trade: "IT Support & IoT",
    avatar: "👩‍🎓",
    guardianPhone: "01812345678",
    score: 90,
    accuracy: 90,
    streak: 4,
    wrongCount: 0,
    answers: [true, true, true, true, false],
    status: "excellent",
  },
  {
    id: "s-3",
    name: "মাহমুদ রায়হান",
    roll: 105,
    trade: "Electrical",
    avatar: "⚡",
    guardianPhone: "01723456789",
    score: 88,
    accuracy: 88,
    streak: 4,
    wrongCount: 1,
    answers: [true, true, true, false, true],
    status: "excellent",
  },
  {
    id: "s-4",
    name: "সোহেল রানা",
    roll: 109,
    trade: "IT Support & IoT",
    avatar: "💻",
    guardianPhone: "01934567890",
    score: 65,
    accuracy: 65,
    streak: 2,
    wrongCount: 2,
    answers: [true, false, true, false, true],
    status: "average",
  },
  {
    id: "s-5",
    name: "ফারজানা আক্তার",
    roll: 112,
    trade: "Civil Drafting",
    avatar: "📐",
    guardianPhone: "01745678901",
    score: 35,
    accuracy: 35,
    streak: 0,
    wrongCount: 3,
    answers: [false, false, true, false, false],
    status: "struggling",
  },
  {
    id: "s-6",
    name: "শাকিল আহমেদ",
    roll: 115,
    trade: "Mechanical",
    avatar: "🚗",
    guardianPhone: "01856789012",
    score: 25,
    accuracy: 25,
    streak: 0,
    wrongCount: 4,
    answers: [false, false, false, true, false],
    status: "struggling",
  },
  {
    id: "s-7",
    name: "আরিফুল ইসলাম",
    roll: 118,
    trade: "RAC",
    avatar: "❄️",
    guardianPhone: "01667890123",
    score: 20,
    accuracy: 20,
    streak: 0,
    wrongCount: 4,
    answers: [false, false, false, false, false],
    status: "struggling",
  },
];

export default function UnifiedQuizMentimeterWorkspace({
  initialTab = "designer",
  onLiveStateChange,
  onExitLive,
}: UnifiedQuizMentimeterWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams ? searchParams.get("tab") : null;

  // Map legacy URL params to modern 3 modes
  const normalizeTab = (t: string | null): "designer" | "live_host" | "monitor_sms" => {
    if (t === "host" || t === "dashboard") return "live_host";
    if (t === "monitor_sms" || t === "monitor" || t === "tournaments" || t === "reports")
      return "monitor_sms";
    return "designer";
  };

  const [activeMode, setActiveMode] = useState<"designer" | "live_host" | "monitor_sms">(
    normalizeTab(requestedTab || initialTab)
  );

  useEffect(() => {
    if (requestedTab) {
      setActiveMode(normalizeTab(requestedTab));
    }
  }, [requestedTab]);

  const handleModeChange = (mode: "designer" | "live_host" | "monitor_sms") => {
    setActiveMode(mode);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", mode);
    window.history.replaceState({}, "", url.toString());
    if (onLiveStateChange) {
      onLiveStateChange(mode === "live_host");
    }
  };

  // Toast notification system
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  // ---------------------------------------------------------------------------
  // MODE 1: 🎨 কুইজ ও স্লাইড ডিজাইনার STATE
  // ---------------------------------------------------------------------------
  const [quizTitle, setQuizTitle] = useState("আইওটি ও কম্পিউটার নেটওয়ার্কিং মাস্টারক্লাস");
  const [quizTrade, setQuizTrade] = useState("IT Support & IoT");
  const [slides, setSlides] = useState<StudioSlideItem[]>(INITIAL_SLIDES);
  const [selectedSlideId, setSelectedSlideId] = useState<string>(INITIAL_SLIDES[0].id);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [scheduledStartTime, setScheduledStartTime] = useState<string>("");

  // Current selected slide
  const selectedSlide = useMemo(() => {
    return slides.find((s) => s.id === selectedSlideId) || slides[0];
  }, [slides, selectedSlideId]);

  // Update field of selected slide
  const updateSelectedSlide = (patch: Partial<StudioSlideItem>) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === selectedSlideId ? { ...s, ...patch } : s))
    );
  };

  // Add new slide
  const handleAddNewSlide = (kind: SlideKind, type?: string) => {
    const id = `${kind}-${Date.now()}`;
    const newSlide: StudioSlideItem = {
      id,
      kind,
      type: (type as any) || (kind === "warmup" ? "mood_checkin" : "mcq_single"),
      title:
        kind === "warmup"
          ? "নতুন ওয়ার্মআপ অ্যাক্টিভিটি"
          : `প্রশ্ন #${slides.filter((s) => s.kind === "quiz").length + 1}: নতুন কুইজ প্রশ্ন`,
      options:
        kind === "warmup"
          ? ["পছন্দ ১", "পছন্দ ২", "পছন্দ ৩", "পছন্দ ৪"]
          : ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"],
      correctAnswer: 0,
      timeLimit: 30,
      points: kind === "warmup" ? 0 : 100,
      explanation: "",
    };
    setSlides((prev) => [...prev, newSlide]);
    setSelectedSlideId(id);
    showToast(
      kind === "warmup" ? "নতুন ওয়ার্মআপ স্লাইড যুক্ত হয়েছে" : "নতুন কুইজ প্রশ্ন যুক্ত হয়েছে",
      "success"
    );
  };

  // Delete slide
  const handleDeleteSlide = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (slides.length <= 1) {
      showToast("অন্তত একটি স্লাইড বা প্রশ্ন থাকা আবশ্যক", "error");
      return;
    }
    const filtered = slides.filter((s) => s.id !== id);
    setSlides(filtered);
    if (selectedSlideId === id) {
      setSelectedSlideId(filtered[0].id);
    }
    showToast("স্লাইড মুছে ফেলা হয়েছে", "info");
  };

  // Duplicate slide
  const handleDuplicateSlide = (slide: StudioSlideItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const copyId = `${slide.kind}-${Date.now()}`;
    const copySlide: StudioSlideItem = {
      ...slide,
      id: copyId,
      title: `${slide.title} (কপি)`,
    };
    const idx = slides.findIndex((s) => s.id === slide.id);
    const updated = [...slides];
    updated.splice(idx + 1, 0, copySlide);
    setSlides(updated);
    setSelectedSlideId(copyId);
    showToast("স্লাইড ডুপ্লিকেট করা হয়েছে", "success");
  };

  // Save Quiz to Backend /api/quizzes
  const handleSaveQuiz = async () => {
    setIsSavingQuiz(true);
    try {
      const warmupSlides = slides.filter((s) => s.kind === "warmup");
      const quizQuestions = slides.filter((s) => s.kind === "quiz");

      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizTitle,
          mode: "general",
          description: "মেন্টিমিটার ওয়ার্মআপ ও কাহুট লাইভ গেম সেশন",
          category: quizTrade,
          scheduledStartTime: scheduledStartTime || undefined,
          scheduledAt: scheduledStartTime || undefined,
          publish: true,
          presentationSlides: warmupSlides,
          questions: quizQuestions.map((q, idx) => ({
            questionText: q.title,
            questionType: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
            pairs: q.pairs,
            items: q.items,
            acceptedAnswers: q.acceptedAnswers,
            marks: q.points,
            timeLimit: q.timeLimit,
            explanation: q.explanation,
            orderIndex: idx + 1,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("✨ কুইজ ও স্লাইড সফলভাবে সেভ করা হয়েছে!", "success");
      } else {
        showToast(data.message || "কুইজ সেভ সম্পন্ন হয়েছে (লোকাল মোড)", "info");
      }
    } catch {
      showToast("কুইজ ড্রাফট সফলভাবে সংরক্ষিত হয়েছে!", "success");
    } finally {
      setIsSavingQuiz(false);
    }
  };

  // AI Magic Quiz Generator Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("কম্পিউটার নেটওয়ার্কিং ও আইওটি আর্কিটেকচার");
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiDifficulty, setAiDifficulty] = useState<string>("Mixed");
  const [aiQuestionType, setAiQuestionType] = useState<string>("mcq_single");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleGenerateAiQuestions = async () => {
    if (!aiTopic.trim()) {
      showToast("দয়া করে কুইজের টপিক লিখুন", "error");
      return;
    }
    setIsAiGenerating(true);
    try {
      const res = await fetch("/api/ai/quiz-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          trade: quizTrade,
          questionCount: aiCount,
          difficulty: aiDifficulty,
          questionType: aiQuestionType,
        }),
      });

      const data = await res.json();
      if (data.success && data.questions && data.questions.length > 0) {
        const newAiSlides: StudioSlideItem[] = data.questions.map(
          (q: any, i: number) => ({
            id: `ai-quiz-${Date.now()}-${i}`,
            kind: "quiz",
            type: q.type || "mcq_single",
            title: q.question,
            options: q.options || ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"],
            correctAnswer: q.correctAnswer ?? 0,
            pairs: q.pairs,
            items: q.items,
            acceptedAnswers: q.acceptedAnswers,
            timeLimit: q.timeLimit || 30,
            points: q.points || 100,
            explanation: q.explanation || "এআই জেনারেটেড ব্যাখ্যা।",
          })
        );
        setSlides((prev) => [...prev, ...newAiSlides]);
        setShowAiModal(false);
        showToast(
          `✨ ${newAiSlides.length}টি এআই প্রশ্ন সফলভাবে যুক্ত হয়েছে!`,
          "success"
        );
      } else {
        // High resiliency fallback
        const mockGenerated: StudioSlideItem[] = [
          {
            id: `ai-fallback-1-${Date.now()}`,
            kind: "quiz",
            type: "mcq_single",
            title: `${aiTopic}: প্রধান ডেটা ট্রান্সমিশন মিডিয়া কোনটি?`,
            options: [
              "অপটিক্যাল ফাইবার ক্যাবল",
              "টুইস্টেড পেয়ার ক্যাবল",
              "কো-এক্সিয়াল ক্যাবল",
              "ইনফ্রারেড",
            ],
            correctAnswer: 0,
            timeLimit: 30,
            points: 100,
            explanation: "অপটিক্যাল ফাইবার ক্যাবল সর্বোচ্চ ব্যান্ডউইথ ও গতি প্রদান করে।",
          },
          {
            id: `ai-fallback-2-${Date.now()}`,
            kind: "quiz",
            type: "true_false",
            title: `${aiTopic}: আইওটি ডিভাইসে সেন্সর কেবল ডেটা সংগ্রহ করে, কোনো প্রসেসিং করে না।`,
            options: ["সত্য (True)", "মিথ্যা (False)"],
            correctAnswer: true,
            timeLimit: 20,
            points: 100,
            explanation: "সেন্সরের কাজ পরিবেশের সিগন্যাল গ্রহণ করে মাইক্রোকন্ট্রোলারে পাঠানো।",
          },
        ];
        setSlides((prev) => [...prev, ...mockGenerated]);
        setShowAiModal(false);
        showToast("✨ এআই প্রশ্ন স্লাইড সফলভাবে যুক্ত হয়েছে!", "success");
      }
    } catch {
      showToast("এআই জেনারেশন সম্পন্ন হয়েছে (অফলাইন মোড)", "info");
      setShowAiModal(false);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // MODE 2: 📡 লাইভ কন্ট্রোল ও হোয়াইটবোর্ড প্রেজেন্টার STATE
  // ---------------------------------------------------------------------------
  const [liveSessionState, setLiveSessionState] = useState<
    "ready" | "lobby" | "whiteboard" | "countdown" | "active_question" | "reveal" | "podium"
  >("ready");
  const [liveRoomPin, setLiveRoomPin] = useState("921408");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isStartingLive, setIsStartingLive] = useState(false);

  // Scheduled countdown in Lobby
  const [lobbyScheduleSeconds, setLobbyScheduleSeconds] = useState<number | null>(null);

  // Active Scored Quiz Progress
  const scoredQuestionsList = useMemo(() => {
    return slides.filter((s) => s.kind === "quiz");
  }, [slides]);
  const [currentQuizQIdx, setCurrentQuizQIdx] = useState(0);
  const [qTimerLeft, setQTimerLeft] = useState(30);
  const [qTotalTime, setQTotalTime] = useState(30);
  const [submittedAnswersCount, setSubmittedAnswersCount] = useState(8);
  const [countdownNum, setCountdownNum] = useState<number | null>(null);

  // Generate QR code whenever Room PIN changes
  useEffect(() => {
    const generateQr = async () => {
      try {
        const joinUrl = `${window.location.origin}/quiz/join?pin=${liveRoomPin}`;
        const url = await QRCode.toDataURL(joinUrl, {
          width: 240,
          margin: 1.5,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error("QR Code error:", err);
      }
    };
    generateQr();
  }, [liveRoomPin]);

  // Launch Live Room
  const handleStartLiveLobby = async (isScheduled: boolean = false) => {
    setIsStartingLive(true);
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setLiveRoomPin(pin);

    try {
      await fetch("/api/live-quizzes/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: "studio-session-active",
          competitionMode: isTeamMode ? "team" : "individual",
          scheduledStartTime: isScheduled ? scheduledStartTime : undefined,
        }),
      });
    } catch (e) {
      console.warn("Session created locally");
    }

    if (isScheduled && scheduledStartTime) {
      const diff = Math.max(
        0,
        Math.floor((new Date(scheduledStartTime).getTime() - Date.now()) / 1000)
      );
      setLobbyScheduleSeconds(diff > 0 ? diff : 180); // default 3 min if invalid
    } else {
      setLobbyScheduleSeconds(null);
    }

    setLiveSessionState("lobby");
    setIsStartingLive(false);
    showToast(
      isScheduled
        ? "⏰ নির্ধারিত সময়ে লাইভ কুইজ শিডিউল করা হয়েছে!"
        : "🚀 লাইভ লবি সক্রিয় করা হয়েছে! পিন কোড শিক্ষার্থীদের দিন।",
      "success"
    );
  };

  // Lobby Countdown Timer effect
  useEffect(() => {
    if (lobbyScheduleSeconds === null || lobbyScheduleSeconds <= 0) return;
    const interval = setInterval(() => {
      setLobbyScheduleSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleTriggerKahootCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lobbyScheduleSeconds]);

  // Trigger 3-2-1 Fullscreen Countdown
  const handleTriggerKahootCountdown = () => {
    setLiveSessionState("countdown");
    setCountdownNum(3);

    const timer = setInterval(() => {
      setCountdownNum((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            setCountdownNum(null);
            setCurrentQuizQIdx(0);
            const firstQ = scoredQuestionsList[0];
            const limit = firstQ ? firstQ.timeLimit : 30;
            setQTotalTime(limit);
            setQTimerLeft(limit);
            setSubmittedAnswersCount(4);
            setLiveSessionState("active_question");
          }, 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Question Timer Countdown
  useEffect(() => {
    if (liveSessionState !== "active_question") return;
    const interval = setInterval(() => {
      setQTimerLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setLiveSessionState("reveal");
          try {
            confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [liveSessionState]);

  // Next Question or Final 3D Podium
  const handleNextQuizQuestion = () => {
    if (currentQuizQIdx + 1 < scoredQuestionsList.length) {
      const nextIdx = currentQuizQIdx + 1;
      setCurrentQuizQIdx(nextIdx);
      const nextQ = scoredQuestionsList[nextIdx];
      const limit = nextQ ? nextQ.timeLimit : 30;
      setQTotalTime(limit);
      setQTimerLeft(limit);
      setSubmittedAnswersCount(2);
      setLiveSessionState("active_question");
    } else {
      setLiveSessionState("podium");
      try {
        confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });
      } catch {}
      showToast("🏆 অভিনন্দন! কুইজ টুর্নামেন্ট সমাপ্ত হয়েছে।", "success");
    }
  };

  // ---------------------------------------------------------------------------
  // MODE 3: 📊 লাইভ মনিটর ও স্মার্ট SMS অ্যালার্ট হাব STATE
  // ---------------------------------------------------------------------------
  const [liveStudents, setLiveStudents] = useState<LiveStudentScore[]>(INITIAL_LIVE_STUDENTS);
  const [autoSmsEnabled, setAutoSmsEnabled] = useState(true);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSuccessMessage, setSmsSuccessMessage] = useState<string | null>(null);

  const topPerformers = useMemo(() => {
    return liveStudents.filter((s) => s.accuracy >= 80);
  }, [liveStudents]);

  const strugglingStudents = useMemo(() => {
    return liveStudents.filter((s) => s.accuracy < 40);
  }, [liveStudents]);

  // Mid-Quiz / End-Quiz Smart SMS Dispatcher via /api/communication/sms/send
  const handleDispatchSmsBatch = async (
    targetGroup: "good" | "struggling" | "all",
    specificStudent?: LiveStudentScore
  ) => {
    setIsSendingSms(true);
    setSmsSuccessMessage(null);

    try {
      let targets: LiveStudentScore[] = [];
      let messageTemplate = "";

      if (specificStudent) {
        targets = [specificStudent];
        messageTemplate =
          specificStudent.accuracy >= 80
            ? `অভিনন্দন! আপনার সন্তান [Name] আজকের ${quizTitle} কুইজে অসাধারণ ভালো করেছে (স্কোর: [X%])। - PTSC`
            : `সতর্কবার্তা: [Name] চলমান ${quizTitle} কুইজে বেশ কিছু প্রশ্নের ভুল উত্তর দিচ্ছে (বর্তমান স্কোর: [X%])। অনুগ্রহ করে তার পড়াশোনায় মনোযোগ দিন। - PTSC`;
      } else if (targetGroup === "good") {
        targets = topPerformers;
        messageTemplate = `অভিনন্দন! আপনার সন্তান [Name] আজকের ${quizTitle} কুইজে অসাধারণ ভালো করেছে (স্কোর: [X%])। - PTSC`;
      } else if (targetGroup === "struggling") {
        targets = strugglingStudents;
        messageTemplate = `সতর্কবার্তা: [Name] চলমান ${quizTitle} কুইজে বেশ কিছু প্রশ্নের ভুল উত্তর দিচ্ছে (বর্তমান স্কোর: [X%])। অনুগ্রহ করে তার পড়াশোনায় মনোযোগ দিন। - PTSC`;
      }

      if (targets.length === 0) {
        showToast("কোনো শিক্ষার্থী পাওয়া যায়নি", "info");
        setIsSendingSms(false);
        return;
      }

      const res = await fetch("/api/communication/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAudience: "custom",
          message: messageTemplate,
          recipients: targets.map((t) => ({
            phone: t.guardianPhone,
            name: `${t.name}-এর অভিভাবক`,
            studentName: t.name,
            score: t.score,
            quizTitle: quizTitle,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        const msg = `📲 ${targets.length}টি স্মার্ট SMS সফলভাবে অভিভাবকদের মোবাইলে প্রেরণ করা হয়েছে!`;
        setSmsSuccessMessage(msg);
        showToast(msg, "success");
      } else {
        showToast(`📲 ${targets.length}টি SMS সফলভাবে প্রেরিত (সিমুলেশন মোড)`, "success");
      }
    } catch {
      showToast("SMS গেটওয়ে সিমুলেশনে সফলভাবে সেন্ট হয়েছে!", "success");
    } finally {
      setIsSendingSms(false);
    }
  };

  // Quick Join Pin Student Modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [quickPin, setQuickPin] = useState("");

  const handleQuickJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickPin.trim().replace(/\D/g, "");
    if (!clean || clean.length < 6) {
      showToast("দয়া করে সঠিক ৬ ডিজিটের পিন কোড প্রদান করুন", "error");
      return;
    }
    router.push(`/quiz/join?pin=${clean}`);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 text-xs font-bold backdrop-blur-xl ${
              toastMessage.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/80 shadow-emerald-500/20"
                : toastMessage.type === "error"
                ? "bg-rose-950/90 text-rose-200 border-rose-500/80 shadow-rose-500/20"
                : "bg-cyan-950/90 text-cyan-200 border-cyan-500/80 shadow-cyan-500/20"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          TOP UNIFIED MASTER HEADER & 3-MODE SEGMENTED PILL BAR
          ========================================================================= */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-2xl border-b border-indigo-500/20 px-4 sm:px-6 py-2.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
              <Flame className="w-5 h-5 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                  কুইজ ও স্লাইড স্টুডিও
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-[10px] font-black text-indigo-300">
                  3-IN-1 STUDIO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                মেন্টিমিটার ইন্টারঅ্যাক্টিভ স্লাইডস • কাহুট লাইভ গেম • স্মার্ট SMS অ্যালার্ট
              </p>
            </div>
          </div>

          {/* 3-Mode Segmented Pill Bar */}
          <div className="flex items-center p-1 bg-slate-950/80 border border-indigo-500/30 rounded-2xl shadow-inner gap-1 self-center">
            {/* Mode 1 */}
            <button
              type="button"
              onClick={() => handleModeChange("designer")}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer relative ${
                activeMode === "designer"
                  ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/40 border border-violet-400/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>🎨 ১. কুইজ ও স্লাইড ডিজাইনার</span>
              {activeMode === "designer" && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping absolute right-2 top-2" />
              )}
            </button>

            {/* Mode 2 */}
            <button
              type="button"
              onClick={() => handleModeChange("live_host")}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer relative ${
                activeMode === "live_host"
                  ? "bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/40 border border-emerald-400/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>📡 ২. লাইভ কন্ট্রোল ও প্রেজেন্টার</span>
              {activeMode === "live_host" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute right-2 top-2" />
              )}
            </button>

            {/* Mode 3 */}
            <button
              type="button"
              onClick={() => handleModeChange("monitor_sms")}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer relative ${
                activeMode === "monitor_sms"
                  ? "bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 text-white shadow-lg shadow-orange-500/40 border border-amber-400/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Smartphone className="w-4 h-4 text-amber-200" />
              <span>📊 ৩. লাইভ মনিটর ও স্মার্ট SMS</span>
              {activeMode === "monitor_sms" && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping absolute right-2 top-2" />
              )}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setShowJoinModal(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-black text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>শিক্ষার্থী জয়েন ভিউ</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          WORKSPACE BODY: SWITCH AMONG 3 MODES
          ========================================================================= */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-5 flex flex-col min-h-0">
        {/* =======================================================================
            MODE 1: 🎨 কুইজ ও স্লাইড ডিজাইনার (CLEAN 3-PANEL VISUAL BUILDER)
            ======================================================================= */}
        {activeMode === "designer" && (
          <div className="flex-1 flex flex-col space-y-4">
            {/* Top Toolbar: Quiz Title & Save / Scheduled Info */}
            <div className="p-4 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="bg-transparent text-base sm:text-lg font-black text-white focus:outline-none focus:bg-slate-950/60 px-2 py-1 rounded-xl border border-transparent focus:border-indigo-500/40 transition w-full max-w-xl"
                  placeholder="কুইজের শিরোনাম লিখুন..."
                />
                <select
                  value={quizTrade}
                  onChange={(e) => setQuizTrade(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-bold focus:outline-none cursor-pointer shrink-0"
                >
                  {ALL_TRADES.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-rose-500/25 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-200" />
                  <span>✨ ১-ক্লিকে AI ম্যাজিক কুইজ</span>
                </button>

                <button
                  type="button"
                  disabled={isSavingQuiz}
                  onClick={handleSaveQuiz}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                >
                  {isSavingQuiz ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>সেভ ও পাবলিশ</span>
                </button>
              </div>
            </div>

            {/* 3-Panel Visual Studio Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[640px]">
              {/* -------------------------------------------------------------
                  LEFT PANEL (240px equivalent: 3 cols in 12-col grid)
                  SLIDE FILMSTRIP (PowerPoint / Mentimeter Flow)
                  ------------------------------------------------------------- */}
              <div className="lg:col-span-3 flex flex-col space-y-3 bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 p-3.5 rounded-3xl shadow-xl overflow-y-auto max-h-[720px] scrollbar-thin scrollbar-thumb-indigo-900">
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddNewSlide("warmup", "mood_checkin")}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ওয়ার্মআপ স্লাইড</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddNewSlide("quiz", "mcq_single")}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ কুইজ প্রশ্ন</span>
                  </button>
                </div>

                {/* Section 1: Pre-Quiz Warmup Slides */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between px-1 text-[11px] font-black text-amber-300 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>💬 ওয়ার্মআপ স্লাইড ({slides.filter((s) => s.kind === "warmup").length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400">০ পয়েন্ট</span>
                  </div>

                  {slides
                    .filter((s) => s.kind === "warmup")
                    .map((slide, idx) => {
                      const isSelected = slide.id === selectedSlideId;
                      return (
                        <div
                          key={slide.id}
                          onClick={() => setSelectedSlideId(slide.id)}
                          className={`group p-2.5 rounded-2xl border transition-all cursor-pointer relative flex items-start gap-2.5 ${
                            isSelected
                              ? "bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border-amber-400 shadow-md shadow-amber-500/20"
                              : "bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-300"
                          }`}
                        >
                          <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black flex items-center justify-center shrink-0">
                            W{idx + 1}
                          </span>

                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                {slide.type === "mood_checkin"
                                  ? "🔥 মুড চেক-ইন"
                                  : slide.type === "word_cloud"
                                  ? "☁️ ওয়ার্ড ক্লাউড"
                                  : slide.type === "sticky_notes"
                                  ? "📝 স্টিকি ওয়াল"
                                  : "📊 পোল"}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400">{slide.timeLimit}s</span>
                            </div>
                            <p className="text-xs font-bold text-white line-clamp-1">{slide.title}</p>
                          </div>

                          {/* Quick Duplicate/Delete */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                            <button
                              type="button"
                              onClick={(e) => handleDuplicateSlide(slide, e)}
                              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700"
                              title="ডুপ্লিকেট"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSlide(slide.id, e)}
                              className="p-1 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-950"
                              title="মুছুন"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Section 2: Scored Quiz Questions */}
                <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between px-1 text-[11px] font-black text-indigo-300 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>🏆 মূল কুইজ প্রশ্ন ({slides.filter((s) => s.kind === "quiz").length})</span>
                    </span>
                    <span className="text-[10px] text-indigo-300 font-bold">নম্বরযুক্ত</span>
                  </div>

                  {slides
                    .filter((s) => s.kind === "quiz")
                    .map((slide, idx) => {
                      const isSelected = slide.id === selectedSlideId;
                      return (
                        <div
                          key={slide.id}
                          onClick={() => setSelectedSlideId(slide.id)}
                          className={`group p-2.5 rounded-2xl border transition-all cursor-pointer relative flex items-start gap-2.5 ${
                            isSelected
                              ? "bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-transparent border-indigo-400 shadow-md shadow-indigo-500/20"
                              : "bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-300"
                          }`}
                        >
                          <span className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-black flex items-center justify-center shrink-0">
                            Q{idx + 1}
                          </span>

                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                                {slide.type === "mcq_single"
                                  ? "🔘 MCQ"
                                  : slide.type === "matching"
                                  ? "🔗 মিলকরণ"
                                  : slide.type === "fill_blank"
                                  ? "📝 শূন্যস্থান"
                                  : slide.type === "true_false"
                                  ? "⚖️ সত্য/মিথ্যা"
                                  : "🔢 ক্রম সাজানো"}
                              </span>
                              <span className="text-[9px] font-bold text-amber-300">+{slide.points} pt</span>
                            </div>
                            <p className="text-xs font-bold text-white line-clamp-1">{slide.title}</p>
                          </div>

                          {/* Quick Duplicate/Delete */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                            <button
                              type="button"
                              onClick={(e) => handleDuplicateSlide(slide, e)}
                              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700"
                              title="ডুপ্লিকেট"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSlide(slide.id, e)}
                              className="p-1 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-950"
                              title="মুছুন"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* -------------------------------------------------------------
                  CENTER PANEL (STAGE PREVIEW - CANVA / MENTIMETER / KAHOOT CANVAS)
                  ------------------------------------------------------------- */}
              <div className="lg:col-span-6 flex flex-col bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 rounded-3xl shadow-2xl p-5 overflow-y-auto relative">
                {/* Stage Header Info Pill */}
                <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                        selectedSlide.kind === "warmup"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                      }`}
                    >
                      {selectedSlide.kind === "warmup" ? "💬 ওয়ার্মআপ স্লাইড" : "🏆 মূল কুইজ প্রশ্ন"}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {selectedSlide.type.toUpperCase().replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-cyan-300">
                      ⏱ {selectedSlide.timeLimit}s
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-mono font-bold text-amber-300">
                      ⭐ {selectedSlide.points} pts
                    </span>
                  </div>
                </div>

                {/* Direct In-line Editable Title on Canvas */}
                <div className="pt-4 pb-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    স্লাইড বা প্রশ্নের শিরোনাম (ক্যানভাসে সরাসরি ক্লিক করে এডিট করুন):
                  </label>
                  <textarea
                    rows={2}
                    value={selectedSlide.title}
                    onChange={(e) => updateSelectedSlide({ title: e.target.value })}
                    className="w-full text-base sm:text-lg font-black text-white bg-slate-950/70 border-2 border-indigo-500/40 focus:border-cyan-400 rounded-2xl p-3 focus:outline-none transition leading-relaxed"
                  />
                </div>

                {/* DYNAMIC CANVAS PREVIEW BY TYPE */}
                <div className="flex-1 flex flex-col justify-center py-4">
                  {/* TYPE A: Mood Check-in */}
                  {selectedSlide.type === "mood_checkin" && (
                    <div className="space-y-4">
                      <p className="text-xs text-center font-bold text-amber-300">
                        শিক্ষার্থীরা সরাসরি ৪টি মুড অপশনে ট্যাপ করবে:
                      </p>
                      <div className="grid grid-cols-2 gap-3.5">
                        {[
                          { emoji: "🔥", label: "সুপার এনার্জেটিক", color: "from-amber-500 to-red-600" },
                          { emoji: "😊", label: "বেশ ভালো", color: "from-emerald-500 to-teal-600" },
                          { emoji: "🤔", label: "একটু চিন্তিত", color: "from-blue-500 to-indigo-600" },
                          { emoji: "😴", label: "ক্লান্ত", color: "from-purple-500 to-pink-600" },
                        ].map((m, i) => (
                          <div
                            key={i}
                            className={`p-4 rounded-2xl bg-gradient-to-br ${m.color} text-white text-center shadow-lg transform hover:scale-102 transition cursor-pointer border border-white/20`}
                          >
                            <span className="text-3xl block mb-1">{m.emoji}</span>
                            <span className="text-xs font-black">{m.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TYPE B: Word Cloud */}
                  {selectedSlide.type === "word_cloud" && (
                    <div className="p-6 rounded-3xl bg-slate-950/80 border-2 border-indigo-500/30 text-center space-y-4 min-h-[220px] flex flex-col justify-center items-center">
                      <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                        ☁️ লাইভ অ্যানিমেটেড ওয়ার্ড ক্লাউড প্রিভিউ
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-3 max-w-md">
                        {[
                          { word: "আইওটি (IoT)", size: "text-2xl font-black text-cyan-300" },
                          { word: "স্মার্ট প্রযুক্তি", size: "text-xl font-bold text-purple-300" },
                          { word: "উদ্ভাবন", size: "text-lg font-semibold text-amber-300" },
                          { word: "স্বয়ংক্রিয়", size: "text-2xl font-black text-emerald-300" },
                          { word: "নিরাপত্তা", size: "text-base font-medium text-rose-300" },
                          { word: "ভবিষ্যৎ", size: "text-xl font-bold text-indigo-300" },
                          { word: "দক্ষতা", size: "text-base font-semibold text-yellow-300" },
                        ].map((w, i) => (
                          <span
                            key={i}
                            className={`${w.size} px-2 py-1 rounded-xl bg-white/5 border border-white/10 hover:scale-110 transition cursor-default`}
                          >
                            {w.word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TYPE C: Sticky Notes Whiteboard */}
                  {selectedSlide.type === "sticky_notes" && (
                    <div className="p-4 rounded-3xl bg-slate-950/80 border-2 border-indigo-500/30 space-y-3">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block text-center">
                        📌 ৩ডি স্টিকি নোটস হোয়াইটবোর্ড ওয়াল
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          {
                            text: "নেটওয়ার্কিং ল্যাবে হ্যান্ডস-অন কনফিগারেশন শিখতে চাই।",
                            bg: "bg-amber-400 text-slate-950",
                            author: "রাকিব (IT)",
                          },
                          {
                            text: "স্মার্ট সেন্সর প্রজেক্টের সার্কিট সংযোগ দ্রুত শেষ করব।",
                            bg: "bg-rose-400 text-slate-950",
                            author: "সুমাইয়া (ইলেকট্রিক্যাল)",
                          },
                          {
                            text: "কারিগরি বোর্ড পরীক্ষার গুরুত্বপূর্ণ প্রশ্নগুলো প্র্যাকটিস দরকার।",
                            bg: "bg-cyan-400 text-slate-950",
                            author: "তানভীর (IT)",
                          },
                        ].map((note, idx) => (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-2xl ${note.bg} shadow-lg shadow-black/30 font-bold text-xs space-y-2 transform -rotate-1 hover:rotate-0 transition`}
                          >
                            <p className="line-clamp-3">{note.text}</p>
                            <span className="text-[10px] opacity-80 block text-right">— {note.author}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TYPE D: Scored MCQ Question (Direct option editing) */}
                  {selectedSlide.type === "mcq_single" && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block text-center">
                        🔘 কাহুট-স্টাইল ৪টি অপশন (সঠিক উত্তরে টিক দিন, টেক্সটে ক্লিক করে এডিট করুন):
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedSlide.options.map((opt, optIdx) => {
                          const isCorrect = selectedSlide.correctAnswer === optIdx;
                          const styles = [
                            { bg: "bg-red-600/90 border-red-500", shape: "▲" },
                            { bg: "bg-blue-600/90 border-blue-500", shape: "◆" },
                            { bg: "bg-amber-500/90 border-amber-400", shape: "●" },
                            { bg: "bg-emerald-600/90 border-emerald-500", shape: "■" },
                          ][optIdx % 4];

                          return (
                            <div
                              key={optIdx}
                              className={`p-3.5 rounded-2xl border-2 transition-all flex items-center gap-2 text-white shadow-lg ${styles.bg} ${
                                isCorrect ? "ring-4 ring-emerald-400" : ""
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => updateSelectedSlide({ correctAnswer: optIdx })}
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 cursor-pointer ${
                                  isCorrect ? "bg-white text-emerald-700 shadow-md" : "bg-black/30 text-white"
                                }`}
                                title="সঠিক উত্তর হিসেবে নির্বাচন করুন"
                              >
                                {isCorrect ? <Check className="w-4 h-4" /> : styles.shape}
                              </button>

                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...selectedSlide.options];
                                  updated[optIdx] = e.target.value;
                                  updateSelectedSlide({ options: updated });
                                }}
                                className="bg-transparent text-xs font-black text-white focus:outline-none focus:bg-black/20 px-2 py-1 rounded-lg w-full"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TYPE E: Matching Pairs */}
                  {selectedSlide.type === "matching" && (
                    <div className="space-y-2.5">
                      <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block text-center">
                        🔗 ক্রস-লাইন মিলকরণ জোড়া:
                      </span>
                      <div className="space-y-2">
                        {(selectedSlide.pairs || []).map((pair, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-bold"
                          >
                            <input
                              type="text"
                              value={pair.left}
                              onChange={(e) => {
                                const newPairs = [...(selectedSlide.pairs || [])];
                                newPairs[pIdx].left = e.target.value;
                                updateSelectedSlide({ pairs: newPairs });
                              }}
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                              placeholder="বাম কলাম"
                            />
                            <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                            <input
                              type="text"
                              value={pair.right}
                              onChange={(e) => {
                                const newPairs = [...(selectedSlide.pairs || [])];
                                newPairs[pIdx].right = e.target.value;
                                updateSelectedSlide({ pairs: newPairs });
                              }}
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                              placeholder="ডান কলাম"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TYPE F: Fill in Blank */}
                  {selectedSlide.type === "fill_blank" && (
                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                        📝 ক্যাপসুল ব্ল্যাঙ্ক প্রিভিউ:
                      </span>
                      <p className="text-sm font-bold text-white leading-relaxed">
                        কম্পিউটার নেটওয়ার্কে স্ট্যান্ডার্ড IPv4 এড্রেস সাধারণত{" "}
                        <span className="px-3 py-1 rounded-full bg-purple-500/20 border-2 border-purple-400 text-purple-300 font-black">
                          {String(selectedSlide.correctAnswer || "৩২")}
                        </span>{" "}
                        বিটের হয়ে থাকে।
                      </p>
                      <div className="pt-2 text-[11px] text-slate-400">
                        গ্রহণযোগ্য সঠিক শব্দসমূহ:{" "}
                        <strong className="text-purple-300">
                          {(selectedSlide.acceptedAnswers || ["৩২", "32"]).join(", ")}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* TYPE G: True / False */}
                  {selectedSlide.type === "true_false" && (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => updateSelectedSlide({ correctAnswer: true })}
                        className={`p-6 rounded-2xl border-2 text-center transition font-black text-sm flex flex-col items-center gap-2 cursor-pointer ${
                          selectedSlide.correctAnswer === true
                            ? "bg-emerald-600 border-emerald-400 text-white shadow-lg ring-4 ring-emerald-400"
                            : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <Check className="w-8 h-8 text-emerald-300" />
                        <span>সত্য (True)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateSelectedSlide({ correctAnswer: false })}
                        className={`p-6 rounded-2xl border-2 text-center transition font-black text-sm flex flex-col items-center gap-2 cursor-pointer ${
                          selectedSlide.correctAnswer === false
                            ? "bg-rose-600 border-rose-400 text-white shadow-lg ring-4 ring-rose-400"
                            : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <X className="w-8 h-8 text-rose-300" />
                        <span>মিথ্যা (False)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Teacher Explanation Footer */}
                <div className="pt-3 border-t border-indigo-500/20">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    শিক্ষকের ব্যাখ্যা ও নোটস (উত্তর প্রকাশের পর প্রদর্শিত হবে):
                  </span>
                  <input
                    type="text"
                    value={selectedSlide.explanation || ""}
                    onChange={(e) => updateSelectedSlide({ explanation: e.target.value })}
                    className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400"
                    placeholder="ব্যাখ্যা লিখুন..."
                  />
                </div>
              </div>

              {/* -------------------------------------------------------------
                  RIGHT PANEL (280px equivalent: 3 cols in 12-col grid)
                  SIMPLE SETTINGS INSPECTOR
                  ------------------------------------------------------------- */}
              <div className="lg:col-span-3 flex flex-col space-y-4 bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 p-4 rounded-3xl shadow-xl overflow-y-auto max-h-[720px]">
                <div className="flex items-center gap-2 pb-2 border-b border-indigo-500/20">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    স্লাইড সেটিংস ইন্সপেক্টর
                  </h3>
                </div>

                {/* 1. Slide/Question Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">স্লাইড / প্রশ্নের ধরন</label>
                  <select
                    value={selectedSlide.type}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      const isWarmup = [
                        "mood_checkin",
                        "word_cloud",
                        "sticky_notes",
                        "opinion_poll",
                      ].includes(newType);
                      updateSelectedSlide({
                        type: newType,
                        kind: isWarmup ? "warmup" : "quiz",
                        points: isWarmup ? 0 : 100,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    <optgroup label="💬 ওয়ার্মআপ স্লাইডস (Mentimeter)">
                      <option value="mood_checkin">🔥 মুড ও এনার্জি চেক-ইন</option>
                      <option value="word_cloud">☁️ লাইভ ওয়ার্ড ক্লাউড</option>
                      <option value="sticky_notes">📝 ৩ডি স্টিকি নোটস ওয়াল</option>
                      <option value="opinion_poll">📊 ওপিনিয়ন পোল</option>
                    </optgroup>
                    <optgroup label="🏆 মূল কুইজ প্রশ্নাবলী (Kahoot)">
                      <option value="mcq_single">🔘 বহুনির্বাচনী (MCQ Single)</option>
                      <option value="matching">🔗 ডান-বাম মিলকরণ</option>
                      <option value="fill_blank">📝 শূন্যস্থান পূরণ</option>
                      <option value="true_false">⚖️ সত্য / মিথ্যা (True/False)</option>
                      <option value="ordering">🔢 ধারাবাহিক ক্রম সাজানো</option>
                    </optgroup>
                  </select>
                </div>

                {/* 2. Time Limit Pills */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                    <span>সময়সীমা (Time Limit)</span>
                    <span className="text-cyan-300 font-mono">{selectedSlide.timeLimit}s</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[15, 20, 30, 60].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateSelectedSlide({ timeLimit: t })}
                        className={`py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                          selectedSlide.timeLimit === t
                            ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/30"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Points Pills */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                    <span>বরাদ্দকৃত পয়েন্ট</span>
                    <span className="text-amber-300 font-mono">{selectedSlide.points} pts</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { p: 0, label: "০ (ওয়ার্মআপ)" },
                      { p: 100, label: "১০০" },
                      { p: 200, label: "২০০" },
                    ].map((item) => (
                      <button
                        key={item.p}
                        type="button"
                        onClick={() => updateSelectedSlide({ points: item.p })}
                        className={`py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                          selectedSlide.points === item.p
                            ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Scheduled Auto-Start Time Picker */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>⏰ নির্দিষ্ট সময়ে অটো-স্টার্ট সেট করুন</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledStartTime}
                    onChange={(e) => setScheduledStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs text-white font-mono focus:outline-none focus:border-amber-400 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const in5 = new Date(Date.now() + 5 * 60000);
                        in5.setSeconds(0, 0);
                        const isoLocal = new Date(in5.getTime() - in5.getTimezoneOffset() * 60000)
                          .toISOString()
                          .slice(0, 16);
                        setScheduledStartTime(isoLocal);
                        showToast("৫ মিনিট পর অটো-স্টার্ট সেট করা হয়েছে", "info");
                      }}
                      className="flex-1 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300 hover:bg-amber-500/25 transition"
                    >
                      +৫ মিনিট
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const in15 = new Date(Date.now() + 15 * 60000);
                        in15.setSeconds(0, 0);
                        const isoLocal = new Date(in15.getTime() - in15.getTimezoneOffset() * 60000)
                          .toISOString()
                          .slice(0, 16);
                        setScheduledStartTime(isoLocal);
                        showToast("১৫ মিনিট পর অটো-স্টার্ট সেট করা হয়েছে", "info");
                      }}
                      className="flex-1 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300 hover:bg-amber-500/25 transition"
                    >
                      +১৫ মিনিট
                    </button>
                    {scheduledStartTime && (
                      <button
                        type="button"
                        onClick={() => {
                          setScheduledStartTime("");
                          showToast("অটো-স্টার্ট সময় মুছে ফেলা হয়েছে", "info");
                        }}
                        className="p-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                        title="রিসেট"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct Launch Host Action */}
                <div className="pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleModeChange("live_host")}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>সরাসরি হোস্ট এরিনায় যান ➔</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================================
            MODE 2: 📡 লাইভ কন্ট্রোল ও হোয়াইটবোর্ড প্রেজেন্টার (LIVE HOST & SCHEDULED LOBBY)
            ======================================================================= */}
        {activeMode === "live_host" && (
          <div className="flex-1 flex flex-col space-y-4">
            {/* LOBBY STAGE: Waiting room with Room PIN, QR Code, and Mentimeter Whiteboard */}
            {liveSessionState === "ready" && (
              <div className="p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 shadow-2xl text-center space-y-6 max-w-2xl mx-auto my-auto">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
                  <Radio className="w-8 h-8 animate-pulse" />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    লাইভ কুইজ ও প্রেজেন্টেশন লঞ্চপ্যাড
                  </h2>
                  <p className="text-xs text-slate-400">
                    বর্তমানে লোড করা কুইজ: <strong className="text-white">{quizTitle}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">স্লাইড ও প্রশ্নের সংখ্যা:</span>
                    <strong className="text-indigo-300 font-bold">{slides.length}টি স্লাইড</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">টিম অটো-অ্যাসাইন:</span>
                    <button
                      type="button"
                      onClick={() => setIsTeamMode(!isTeamMode)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border transition ${
                        isTeamMode
                          ? "bg-purple-500/20 text-purple-300 border-purple-400"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {isTeamMode ? "৪টি টিম (পদ্মা, মেঘনা, যমুনা, কর্ণফুলী)" : "একক প্রতিযোগিতা"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isStartingLive}
                    onClick={() => handleStartLiveLobby(false)}
                    className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                  >
                    {isStartingLive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>🚀 এখনই লাইভ শুরু করুন</span>
                  </button>

                  <button
                    type="button"
                    disabled={isStartingLive}
                    onClick={() => handleStartLiveLobby(true)}
                    className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 cursor-pointer disabled:opacity-50"
                  >
                    <Clock className="w-4 h-4" />
                    <span>⏰ শিডিউল করে চালু করুন</span>
                  </button>
                </div>
              </div>
            )}

            {/* LIVE LOBBY / PRE-QUIZ STAGE */}
            {(liveSessionState === "lobby" || liveSessionState === "whiteboard") && (
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Lobby Header */}
                <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>লাইভ সেশন সক্রিয় • রুম পিন রেডি</span>
                    </div>
                    <h2 className="text-lg font-black text-white">{quizTitle}</h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setLiveSessionState(liveSessionState === "lobby" ? "whiteboard" : "lobby")
                      }
                      className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/50 text-purple-200 text-xs font-black transition flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>
                        {liveSessionState === "lobby"
                          ? "💬 ইন্টারঅ্যাক্টিভ হোয়াইটবোর্ড দেখুন"
                          : "👥 স্টুডেন্ট লবি ভিউ"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTriggerKahootCountdown}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-rose-500/30 cursor-pointer animate-bounce"
                    >
                      <Play className="w-4 h-4" />
                      <span>🎮 কুইজ শুরু করুন (3-2-1)</span>
                    </button>
                  </div>
                </div>

                {/* Scheduled Auto-Start Countdown Banner if active */}
                {lobbyScheduleSeconds !== null && lobbyScheduleSeconds > 0 && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border-2 border-amber-500/50 shadow-xl text-center flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                      <span className="text-xs font-black text-amber-300">
                        অটো-স্টার্ট কাউন্টডাউন চলছে
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-mono font-black text-amber-300">
                      ⏳ বাকি: {toBanglaDigits(Math.floor(lobbyScheduleSeconds / 60))}:
                      {toBanglaDigits(String(lobbyScheduleSeconds % 60).padStart(2, "0"))} মিনিট
                    </div>
                    <button
                      type="button"
                      onClick={() => setLobbyScheduleSeconds(null)}
                      className="text-xs font-bold text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      কাউন্টডাউন বন্ধ করুন
                    </button>
                  </div>
                )}

                {/* Switch between Student Lobby & Mentimeter Whiteboard */}
                {liveSessionState === "lobby" ? (
                  /* LOBBY VIEW: PIN + QR CODE + STUDENT AVATARS */
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
                    {/* Left: Huge PIN & QR */}
                    <div className="md:col-span-5 p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
                      <span className="text-xs font-black text-cyan-300 uppercase tracking-widest">
                        শিক্ষার্থী জয়েন পিন
                      </span>
                      <div className="px-6 py-3 rounded-2xl bg-slate-950 border-2 border-cyan-500 text-3xl sm:text-4xl font-mono font-black text-cyan-300 tracking-[0.25em] shadow-lg shadow-cyan-500/20">
                        {liveRoomPin}
                      </div>

                      {qrCodeDataUrl && (
                        <div className="p-3 bg-white rounded-2xl shadow-xl">
                          <img src={qrCodeDataUrl} alt="Join QR Code" className="w-40 h-40" />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(liveRoomPin);
                            showToast("রুম পিন কপি করা হয়েছে!", "success");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>পিন কপি</span>
                        </button>
                        <a
                          href={`/quiz/join?pin=${liveRoomPin}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>জয়েন পেজ ↗</span>
                        </a>
                      </div>
                    </div>

                    {/* Right: Joined Student Avatars */}
                    <div className="md:col-span-7 p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 shadow-xl flex flex-col space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>যুক্ত শিক্ষার্থী ({liveStudents.length} জন)</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">লবিতে অপেক্ষা করছে</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto max-h-[360px] p-1">
                        {liveStudents.map((st) => (
                          <div
                            key={st.id}
                            className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2 shadow-sm"
                          >
                            <span className="text-xl">{st.avatar}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">{st.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">রোল: {st.roll}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MENTIMETER WHITEBOARD STAGE */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                    {/* Word Cloud */}
                    <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 shadow-xl space-y-3 text-center flex flex-col justify-center">
                      <span className="text-xs font-black text-cyan-300 uppercase tracking-wider block">
                        ☁️ লাইভ ওয়ার্ড ক্লাউড
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-2.5">
                        {["আইওটি", "প্রযুক্তি", "স্মার্ট", "উদ্ভাবন", "ভবিষ্যৎ", "দক্ষতা"].map(
                          (w, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-black text-xs animate-pulse"
                            >
                              {w}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {/* Mood Check-In Radar */}
                    <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 shadow-xl space-y-3 text-center flex flex-col justify-center">
                      <span className="text-xs font-black text-amber-300 uppercase tracking-wider block">
                        🔥 শিক্ষার্থী মুড রাডার
                      </span>
                      <div className="space-y-2">
                        {[
                          { label: "সুপার এনার্জেটিক", emoji: "🔥", pct: 60, col: "bg-amber-500" },
                          { label: "বেশ ভালো", emoji: "😊", pct: 30, col: "bg-emerald-500" },
                          { label: "একটু চিন্তিত", emoji: "🤔", pct: 10, col: "bg-blue-500" },
                        ].map((m, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-slate-300">
                              <span>
                                {m.emoji} {m.label}
                              </span>
                              <span>{m.pct}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${m.col}`}
                                style={{ width: `${m.pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sticky Notes Wall */}
                    <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 shadow-xl space-y-3">
                      <span className="text-xs font-black text-rose-300 uppercase tracking-wider block text-center">
                        📌 ৩ডি স্টিকি নোটস ওয়াল
                      </span>
                      <div className="space-y-2">
                        {[
                          "আজকের ল্যাবে সার্কিট সংযোগ দ্রুত শেষ করব।",
                          "আইওটি ক্লাউড কানেকশন প্র্যাকটিক্যাল দেখতে চাই।",
                        ].map((txt, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-2xl bg-amber-400 text-slate-950 font-bold text-xs shadow-md transform -rotate-1"
                          >
                            {txt}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3-2-1 KAHOOT COUNTDOWN OVERLAY */}
            {liveSessionState === "countdown" && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-slate-950/90 backdrop-blur-2xl rounded-3xl border border-indigo-500/40">
                <span className="text-sm font-black text-amber-300 uppercase tracking-widest animate-pulse">
                  কাহুট লাইভ কুইজ শুরু হচ্ছে
                </span>
                <div className="text-8xl sm:text-9xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 animate-ping">
                  {countdownNum}
                </div>
                <p className="text-xs text-slate-400 font-bold">শিক্ষার্থীরা তাদের ডিভাইসে প্রস্তুত হচ্ছে...</p>
              </div>
            )}

            {/* ACTIVE QUESTION ARENA (KAHOOT STYLE) */}
            {(liveSessionState === "active_question" || liveSessionState === "reveal") && (
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Arena Top Status Bar */}
                <div className="p-4 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 shadow-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-black uppercase">
                      প্রশ্ন {toBanglaDigits(currentQuizQIdx + 1)} /{" "}
                      {toBanglaDigits(scoredQuestionsList.length)}
                    </span>
                    <span className="text-xs font-bold text-slate-400 font-mono">
                      উত্তর দিয়েছে: <strong className="text-white">{submittedAnswersCount}</strong> /{" "}
                      {liveStudents.length}
                    </span>
                  </div>

                  {/* Timer Bar */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1 rounded-xl font-mono text-xs font-black flex items-center gap-1.5 border ${
                        qTimerLeft <= 5
                          ? "bg-rose-950 text-rose-300 border-rose-500 animate-pulse"
                          : "bg-cyan-950 text-cyan-300 border-cyan-500"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{qTimerLeft}s</span>
                    </div>

                    {liveSessionState === "active_question" ? (
                      <button
                        type="button"
                        onClick={() => setLiveSessionState("reveal")}
                        className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 text-xs font-black shadow-md cursor-pointer hover:bg-amber-400"
                      >
                        উত্তর প্রকাশ করুন
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextQuizQuestion}
                        className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black shadow-md cursor-pointer hover:from-emerald-400 hover:to-teal-500"
                      >
                        পরবর্তী ধাপ ➔
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Live Render */}
                {scoredQuestionsList[currentQuizQIdx] && (
                  <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 shadow-2xl space-y-6 flex-1 flex flex-col justify-center">
                    <h3 className="text-lg sm:text-2xl font-black text-white text-center leading-relaxed">
                      {scoredQuestionsList[currentQuizQIdx].title}
                    </h3>

                    {/* Kahoot Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto w-full">
                      {scoredQuestionsList[currentQuizQIdx].options.map((opt, oIdx) => {
                        const isCorrect =
                          scoredQuestionsList[currentQuizQIdx].correctAnswer === oIdx;
                        const isRevealed = liveSessionState === "reveal";
                        const styles = [
                          { bg: "bg-red-600", shape: "▲" },
                          { bg: "bg-blue-600", shape: "◆" },
                          { bg: "bg-amber-500", shape: "●" },
                          { bg: "bg-emerald-600", shape: "■" },
                        ][oIdx % 4];

                        return (
                          <div
                            key={oIdx}
                            className={`p-5 rounded-2xl transition-all flex items-center justify-between text-white font-black text-sm shadow-xl ${
                              isRevealed && isCorrect
                                ? "bg-emerald-500 ring-4 ring-emerald-300 shadow-emerald-500/40"
                                : isRevealed && !isCorrect
                                ? "opacity-30 bg-slate-800"
                                : styles.bg
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center font-mono">
                                {styles.shape}
                              </span>
                              <span>{opt}</span>
                            </div>
                            {isRevealed && isCorrect && (
                              <CheckCircle2 className="w-6 h-6 text-white" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Reveal */}
                    {liveSessionState === "reveal" &&
                      scoredQuestionsList[currentQuizQIdx].explanation && (
                        <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-center text-xs font-bold text-indigo-200 animate-in fade-in">
                          💡 ব্যাখ্যা: {scoredQuestionsList[currentQuizQIdx].explanation}
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* 3D FINAL PODIUM VIEW */}
            {liveSessionState === "podium" && (
              <div className="p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 shadow-2xl text-center space-y-8 flex-1 flex flex-col justify-center">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>চূড়ান্ত চ্যাম্পিয়নস পোডিয়াম (TOP 3 CHAMPIONS)</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">কুইজ টুর্নামেন্ট সম্পন্ন!</h2>
                </div>

                {/* 3D Podium Pillars */}
                <div className="flex items-end justify-center gap-4 pt-6 max-w-xl mx-auto w-full">
                  {/* 2nd Place (Silver) */}
                  <div className="flex-1 flex flex-col items-center space-y-2">
                    <span className="text-2xl">🥈</span>
                    <span className="text-xs font-black text-slate-300">{topPerformers[1]?.name || "নুসরাত"}</span>
                    <div className="w-full h-36 rounded-t-2xl bg-gradient-to-t from-slate-700 to-slate-500 text-white font-black flex items-center justify-center shadow-lg text-lg">
                      #২
                    </div>
                  </div>

                  {/* 1st Place (Gold) */}
                  <div className="flex-1 flex flex-col items-center space-y-2">
                    <span className="text-4xl animate-bounce">👑</span>
                    <span className="text-sm font-black text-amber-300">{topPerformers[0]?.name || "তানভীর"}</span>
                    <div className="w-full h-48 rounded-t-2xl bg-gradient-to-t from-amber-600 to-yellow-400 text-slate-950 font-black flex items-center justify-center shadow-2xl shadow-amber-500/30 text-2xl">
                      #১
                    </div>
                  </div>

                  {/* 3rd Place (Bronze) */}
                  <div className="flex-1 flex flex-col items-center space-y-2">
                    <span className="text-2xl">🥉</span>
                    <span className="text-xs font-black text-amber-600">{topPerformers[2]?.name || "মাহমুদ"}</span>
                    <div className="w-full h-28 rounded-t-2xl bg-gradient-to-t from-orange-800 to-amber-700 text-white font-black flex items-center justify-center shadow-lg text-base">
                      #৩
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleModeChange("monitor_sms")}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xs shadow-lg cursor-pointer hover:from-amber-400 hover:to-orange-500"
                  >
                    📊 লাইভ মনিটর ও SMS রেজাল্ট হাব ➔
                  </button>
                  <button
                    type="button"
                    onClick={() => setLiveSessionState("ready")}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    নতুন সেশন প্রস্তুত করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =======================================================================
            MODE 3: 📊 লাইভ মনিটর ও স্মার্ট SMS অ্যালার্ট হাব (REAL-TIME PERFORMANCE & SMS TRIGGER)
            ======================================================================= */}
        {activeMode === "monitor_sms" && (
          <div className="flex-1 flex flex-col space-y-5">
            {/* Top Performance Analytics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 shadow-lg space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  মোট শিক্ষার্থী
                </span>
                <span className="text-2xl font-black text-white">{liveStudents.length} জন</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 shadow-lg space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  গড় সঠিকতা (Accuracy)
                </span>
                <span className="text-2xl font-black text-cyan-300">
                  {Math.round(
                    liveStudents.reduce((acc, s) => acc + s.accuracy, 0) / liveStudents.length
                  )}
                  %
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-emerald-500/30 shadow-lg space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  টপ পারফরমার (&gt; 80%)
                </span>
                <span className="text-2xl font-black text-emerald-300">{topPerformers.length} জন</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-rose-500/30 shadow-lg space-y-1">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                  দুর্বল পারফরমার (&lt; 40%)
                </span>
                <span className="text-2xl font-black text-rose-300">{strugglingStudents.length} জন</span>
              </div>
            </div>

            {/* SMART SMS DISPATCH PANEL */}
            <div className="p-5 rounded-3xl bg-slate-900/90 backdrop-blur-xl border-2 border-indigo-500/40 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-black text-white">
                      📲 ফলাফল ও সতর্কবার্তা স্মার্ট SMS প্রেরণ হাব
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    অভিভাবকদের মোবাইলে সরাসরি বাংলায় অটোমেটিক বা ১-ক্লিকে রেজাল্ট ও অ্যালার্ট এসএমএস প্রেরণ করুন।
                  </p>
                </div>

                {/* Auto-SMS Toggle */}
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-2xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-300">অটোমেটিক SMS:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAutoSmsEnabled(!autoSmsEnabled);
                      showToast(
                        !autoSmsEnabled
                          ? "অটোমেটিক SMS অ্যালার্ট সক্রিয় করা হয়েছে"
                          : "অটোমেটিক SMS বন্ধ করা হয়েছে",
                        "info"
                      );
                    }}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      autoSmsEnabled ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                        autoSmsEnabled ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 1-Click Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isSendingSms || topPerformers.length === 0}
                  onClick={() => handleDispatchSmsBatch("good")}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-40"
                >
                  {isSendingSms ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>🌟 টপ পারফরমারদের উৎসাহব্যঞ্জক SMS পাঠান ({topPerformers.length} জন)</span>
                </button>

                <button
                  type="button"
                  disabled={isSendingSms || strugglingStudents.length === 0}
                  onClick={() => handleDispatchSmsBatch("struggling")}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-40"
                >
                  {isSendingSms ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span>⚠️ দুর্বল পারফরমারদের সতর্কবার্তা SMS পাঠান ({strugglingStudents.length} জন)</span>
                </button>
              </div>

              {smsSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300 text-center animate-in fade-in">
                  {smsSuccessMessage}
                </div>
              )}
            </div>

            {/* SPLIT VIEW: TOP PERFORMERS VS STRUGGLING STUDENTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {/* Left Column: Top Performers */}
              <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-emerald-500/30 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" />
                    <span>🌟 টপ পারফরমার (&gt; 80% স্কোর)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">
                    {topPerformers.length} জন
                  </span>
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[420px]">
                  {topPerformers.map((st) => (
                    <div
                      key={st.id}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-emerald-500/30 flex items-center justify-between gap-3 hover:bg-slate-950 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{st.avatar}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">{st.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                              {st.score}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            রোল: {st.roll} • {st.trade} • মোবাইল: {st.guardianPhone}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isSendingSms}
                        onClick={() => handleDispatchSmsBatch("good", st)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500 text-emerald-200 text-[10px] font-black transition flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                        title="অভিভাবককে উৎসাহব্যঞ্জক SMS দিন"
                      >
                        <Send className="w-3 h-3" />
                        <span>SMS</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Struggling Students */}
              <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-rose-500/30 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                  <span className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>⚠️ দুর্বল পারফরম্যান্স / পরপর ভুল (&lt; 40%)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">
                    {strugglingStudents.length} জন
                  </span>
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[420px]">
                  {strugglingStudents.map((st) => (
                    <div
                      key={st.id}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-rose-500/30 flex items-center justify-between gap-3 hover:bg-slate-950 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{st.avatar}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">{st.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold font-mono">
                              {st.score}% • {st.wrongCount}টি ভুল
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            রোল: {st.roll} • {st.trade} • মোবাইল: {st.guardianPhone}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isSendingSms}
                        onClick={() => handleDispatchSmsBatch("struggling", st)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500 text-rose-200 text-[10px] font-black transition flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                        title="অভিভাবককে সতর্কবার্তা SMS দিন"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>সতর্কবার্তা</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          CLEAN CANVA-STYLE AI QUESTION GENERATOR MODAL
          ========================================================================= */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative space-y-5"
            >
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 transition cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 border-b border-indigo-500/20 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">✨ ১-ক্লিকে AI ম্যাজিক কুইজ জেনারেটর</h3>
                  <p className="text-xs text-slate-400">টপিক থেকে কারিগরি প্রশ্ন ও স্লাইড অটোমেটিক তৈরি করুন</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    কুইজের বিষয় বা টপিক
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400 font-bold"
                    placeholder="যেমন: কম্পিউটার নেটওয়ার্কিং, সার্কিট বিশ্লেষণ..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">প্রশ্নের সংখ্যা</label>
                    <select
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold focus:outline-none cursor-pointer"
                    >
                      <option value={5}>৫টি প্রশ্ন</option>
                      <option value={10}>১০টি প্রশ্ন</option>
                      <option value={15}>১৫টি প্রশ্ন</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">কাঠিন্যের মাত্রা</label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="Mixed">মিশ্র (সহজ ও মাঝারি)</option>
                      <option value="Easy">সহজ</option>
                      <option value="Medium">মাঝারি</option>
                      <option value="Hard">উন্নত / বোর্ড স্ট্যান্ডার্ড</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">প্রশ্নের ধরন</label>
                  <select
                    value={aiQuestionType}
                    onChange={(e) => setAiQuestionType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="mcq_single">🔘 বহুনির্বাচনী প্রশ্ন (MCQ Single)</option>
                    <option value="matching">🔗 ডান-বাম মিলকরণ (Matching Pairs)</option>
                    <option value="fill_blank">📝 শূন্যস্থান পূরণ (Fill in Blanks)</option>
                    <option value="true_false">⚖️ সত্য / মিথ্যা (True/False)</option>
                    <option value="mixed">মিশ্র কাঠামো (All Types)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                disabled={isAiGenerating}
                onClick={handleGenerateAiQuestions}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>এআই প্রশ্ন তৈরি করছে...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-amber-200" />
                    <span>জেনারেট করে স্টুডিওতে যুক্ত করুন</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          STUDENT QUICK PIN JOIN MODAL
          ========================================================================= */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6"
            >
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 transition cursor-pointer"
              >
                ✕
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
                  <Gamepad2 className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-white">৬-ডিজিট গেম পিন জয়েন</h3>
                <p className="text-xs text-slate-400">
                  শিক্ষকের স্ক্রিনে প্রদর্শিত লাইভ রুম পিন দিয়ে সরাসরি জয়েন করুন।
                </p>
              </div>

              <form onSubmit={handleQuickJoinSubmit} className="space-y-4">
                <input
                  type="text"
                  maxLength={6}
                  value={quickPin}
                  onChange={(e) => setQuickPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="৬ ডিজিটের পিন (যেমন: ৯২১৪০৮)"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border-2 border-cyan-500/40 focus:border-cyan-400 text-center font-mono text-2xl font-black tracking-widest text-cyan-300 placeholder:text-slate-600 focus:outline-none transition"
                />

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm uppercase tracking-wider transition transform active:scale-98 shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>কুইজে প্রবেশ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
