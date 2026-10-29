"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Plus,
  Play,
  Trash2,
  Edit3,
  Copy,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Clock,
  Loader2,
  Check,
  Flame,
  Award,
  Send,
  MessageSquare,
  Sliders,
  X,
  Wand2,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Layers,
  Radio,
  Eye,
  Settings,
  Tv,
  Gamepad2,
  CheckSquare,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  Info,
  Calendar,
  ChevronDown,
  Smartphone,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Zap,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { institutionalDb, Quiz } from "@/lib/database";
import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  doesClassHaveTrade,
  getApplicableTradesForClass,
  parseClassNumeric,
} from "@/lib/academicStructure";
import { useGlobalAcademic } from "@/context/GlobalAcademicContext";
import {
  getSingleSourceSubjects,
  fetchSubjectsByClassTrade,
  DynamicSubjectItem,
} from "@/lib/globalSubjectMappingHub";
import SmartAiSlideGeneratorModal from "./SmartAiSlideGeneratorModal";
import DualDeviceInteractivePreviewModal from "./DualDeviceInteractivePreviewModal";
import HostLiveFullscreenStage from "./HostLiveFullscreenStage";

// =============================================================================
// SLIDE TYPES & TAXONOMY (Strict 3 Categories)
// =============================================================================
export type SlideCategory = "content" | "interactive" | "quiz";

export type SlideType =
  // 1. Content Slides (No Timer, No Points)
  | "TEXT_SLIDE"
  | "IMAGE_COMPARE"
  // 2. Interactive Open Slides (No Timer, No Points)
  | "OPEN_ENDED"
  | "WORD_CLOUD"
  | "LIVE_QA"
  // 3. Graded Quiz Questions (Timer + Points)
  | "MCQ"
  | "FILL_BLANKS"
  | "MATCHING"
  | "REORDER"
  | "TRUE_FALSE"
  // 4. Special Slides
  | "LEADERBOARD";

export interface SlideTypeConfig {
  id: SlideType;
  category: SlideCategory;
  label: string;
  icon: string;
  desc: string;
  isGraded: boolean;
}

export const SLIDE_TYPES_REGISTRY: SlideTypeConfig[] = [
  // 📄 কন্টেন্ট স্লাইড (No Timer)
  {
    id: "TEXT_SLIDE",
    category: "content",
    label: "টেক্সট ও হেডিং স্লাইড",
    icon: "📄",
    desc: "টপিক ও মূল আলোচনার বিষয় উপস্থাপন",
    isGraded: false,
  },
  {
    id: "IMAGE_COMPARE",
    category: "content",
    label: "ইমেজ ও ডায়াগ্রাম তুলনা",
    icon: "🖼️",
    desc: "পাশাপাশি দুটি চিত্র বা সার্কিট তুলনা",
    isGraded: false,
  },
  // 💬 ইন্টারেক্টিভ ওপেন স্লাইড (No Timer)
  {
    id: "OPEN_ENDED",
    category: "interactive",
    label: "মুক্ত মতামত (Open Ended)",
    icon: "💭",
    desc: "শিক্ষার্থীদের উন্মুক্ত চিন্তা ও আইডিয়া সংগ্রহ",
    isGraded: false,
  },
  {
    id: "WORD_CLOUD",
    category: "interactive",
    label: "লাইভ ওয়ার্ড ক্লাউড",
    icon: "☁️",
    desc: "শিক্ষার্থীদের কীওয়ার্ড নিয়ে গতিশীল শব্দগুচ্ছ",
    isGraded: false,
  },
  {
    id: "LIVE_QA",
    category: "interactive",
    label: "প্রশ্নোত্তর বোর্ড (Live Q&A)",
    icon: "🙋",
    desc: "শিক্ষার্থীরা সরাসরি শিক্ষককে প্রশ্ন করতে পারে",
    isGraded: false,
  },
  // 🏆 লিডারবোর্ড স্লাইড (Special)
  {
    id: "LEADERBOARD" as SlideType,
    category: "content" as SlideCategory,
    label: "🏆 লিডারবোর্ড স্লাইড",
    icon: "🏆",
    desc: "শিক্ষার্থীদের তাৎক্ষণিক র‍্যাংকিং ও স্কোরবোর্ড",
    isGraded: false,
  },
  // 🏆 কুইজ প্রতিযোগিতা (Graded with Timer & Points)
  {
    id: "MCQ",
    category: "quiz",
    label: "বহুনির্বাচনী প্রশ্ন (MCQ Single)",
    icon: "🔘",
    desc: "৪টি রঙিন বিকল্প থেকে ১টি সঠিক উত্তর নির্বাচন",
    isGraded: true,
  },
  {
    id: "FILL_BLANKS",
    category: "quiz",
    label: "শূন্যস্থান পূরণ (Fill in Blanks)",
    icon: "📝",
    desc: "ক্যাপসুল ব্ল্যাঙ্কে সঠিক উত্তর টাইপ বা নির্বাচন",
    isGraded: true,
  },
  {
    id: "MATCHING",
    category: "quiz",
    label: "ডান-বাম মিলকরণ (Matching Pairs)",
    icon: "🔗",
    desc: "বাম কলামের সাথে ডান কলামের জোড়া মিল",
    isGraded: true,
  },
  {
    id: "REORDER",
    category: "quiz",
    label: "ক্রম সাজানো (Sequence Ordering)",
    icon: "🔢",
    desc: "টেকনিক্যাল কাজের ধাপ ক্রমানুসারে সাজানো",
    isGraded: true,
  },
  {
    id: "TRUE_FALSE",
    category: "quiz",
    label: "সত্য / মিথ্যা (True or False)",
    icon: "⚖️",
    desc: "সঠিক বা ভুল বিবৃতি দ্রুত যাচাই",
    isGraded: true,
  },
];

export const isGradedQuiz = (type: SlideType | string): boolean => {
  return ["MCQ", "FILL_BLANKS", "MATCHING", "REORDER", "TRUE_FALSE"].includes(type);
};

export const isLeaderboardSlide = (type: SlideType | string): boolean => {
  return type === "LEADERBOARD";
};

export interface PresentationSlide {
  id: string;
  type: SlideType;
  title: string; // Question or Slide Heading (blank by default)
  content?: string; // Rich body or note
  options: string[]; // For MCQ (empty or 4 options)
  correctAnswer: number | boolean | string; // For MCQ (index), TrueFalse (boolean), Blanks (string)
  pairs?: { left: string; right: string }[]; // For MATCHING
  items?: string[]; // For REORDER
  acceptedAnswers?: string[]; // For FILL_BLANKS
  imageLeftUrl?: string;
  imageRightUrl?: string;
  bulletPoints?: string[];
  maxWordsPerStudent?: number;
  timeLimit: number; // 0 for content/interactive, 15/20/30/60 for quiz
  points: number; // 0 for content/interactive, 50/100/200 for quiz
  explanation?: string;
  metadata?: Record<string, any>;
}

export interface DeckItem {
  id: string;
  title: string;
  description?: string;
  trade: string;
  tradeId?: number | string;
  tradeName?: string;
  classId?: number | string;
  className?: string;
  subjectId?: number | string;
  subjectName?: string;
  subjectCode?: string;
  academicYearId?: number | string;
  slides: PresentationSlide[];
  status: "published" | "draft";
  scheduledStartTime?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Automatically compress and resize client-side uploaded images
 * Keeps base64 strings under ~60KB for instant loading on 60 concurrent mobile devices.
 */
export async function compressImageFile(file: File, maxWidth = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const webpData = canvas.toDataURL("image/webp", quality);
          if (webpData.startsWith("data:image/webp")) {
            resolve(webpData);
            return;
          }
        } catch {}
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Starter Deck for Instant Verification
const DEFAULT_STARTER_DECKS: DeckItem[] = [
  {
    id: "deck-iot-master",
    title: "আইওটি ও স্মার্ট সেন্সর নেটওয়ার্কিং",
    description: "কম্পিউটার ও আইটি সাপোর্ট — এসএসসি ও এইচএসসি ভোকেশনাল",
    trade: "IT Support & IoT Basics",
    tradeId: "102",
    classId: "4",
    className: "৯ম শ্রেণি (এসএসসি ভোকেশনাল)",
    subjectId: 2,
    subjectName: "তথ্য ও যোগাযোগ প্রযুক্তি",
    subjectCode: "150",
    academicYearId: "2026",
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slides: [
      {
        id: "slide-1",
        type: "WORD_CLOUD",
        title: "",
        content: "আইওটি প্রযুক্তি বলতে আপনি কী বোঝেন? একটি শব্দে লিখুন।",
        options: ["স্মার্ট", "অটোমেশন", "সেন্সর", "দ্রুতগতি", "নিরাপত্তা", "ক্লাউড"],
        correctAnswer: 0,
        timeLimit: 0,
        points: 0,
      },
      {
        id: "slide-2",
        type: "MCQ",
        title: "আইওটি (IoT) এর সঠিক পূর্ণরূপ কোনটি?",
        options: [
          "Internet of Things",
          "Input Output Technology",
          "Internal Operating Tool",
          "Internet of Technology",
        ],
        correctAnswer: 0,
        timeLimit: 30,
        points: 100,
        explanation: "IoT এর পূর্ণরূপ হলো 'Internet of Things'।",
      },
      {
        id: "slide-3",
        type: "TRUE_FALSE",
        title: "ফাইবার অপটিক কেবল আলোক সিগন্যালের মাধ্যমে দ্রুত ডেটা পরিবহন করে।",
        options: ["সত্য (True)", "মিথ্যা (False)"],
        correctAnswer: true,
        timeLimit: 20,
        points: 100,
        explanation: "আলোর পূর্ণ অভ্যন্তরীণ প্রতিফলনের কারণে এটি অত্যন্ত দ্রুত ডেটা পাঠায়।",
      },
      {
        id: "slide-4",
        type: "MATCHING",
        title: "হার্ডওয়্যার যন্ত্রাংশ ও শ্রেণিবিভাগ সঠিকভাবে মিলান",
        options: [],
        pairs: [
          { left: "কিবোর্ড ও মাউস", right: "ইনপুট ডিভাইস" },
          { left: "মনিটর ও স্পিকার", right: "আউটপুট ডিভাইস" },
          { left: "র‍্যাম (RAM)", right: "প্রাইমারি মেমোরি" },
        ],
        correctAnswer: 0,
        timeLimit: 45,
        points: 100,
      },
    ],
  },
  {
    id: "deck-elec-circuits",
    title: "ইলেকট্রিক্যাল সার্কিট ও রেজিস্ট্যান্স পরিমাপ",
    description: "ইলেকট্রিক্যাল ইনস্টলেশন ও মেইনটেন্যান্স ট্রেড",
    trade: "General Electrical Workshop",
    tradeId: "103",
    classId: "5",
    className: "১০ম শ্রেণি (এসএসসি ভোকেশনাল)",
    subjectId: 3,
    subjectName: "জেনারেল ইলেকট্রিক্যাল ওয়ার্কশপ",
    subjectCode: "1923",
    academicYearId: "2026",
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slides: [
      {
        id: "slide-e1",
        type: "TEXT_SLIDE",
        title: "ওহমের সূত্র ও সার্কিট পরিচিতি",
        content: "স্থির তাপমাত্রায় কোনো পরিবাহীর মধ্য দিয়ে প্রবাহিত কারেন্ট তার দুই প্রান্তের বিভব পার্থক্যের সমানুপাতিক। V = IR",
        options: [],
        correctAnswer: 0,
        timeLimit: 0,
        points: 0,
      },
      {
        id: "slide-e2",
        type: "MCQ",
        title: "রেজিস্ট্যান্স বা রোধের এসআই (SI) একক কোনটি?",
        options: ["ওহম (Ω)", "ভোল্ট (V)", "অ্যাম্পিয়ার (A)", "ওয়াট (W)"],
        correctAnswer: 0,
        timeLimit: 30,
        points: 100,
      },
    ],
  },
];

interface UnifiedQuizMentimeterWorkspaceProps {
  initialTab?: string;
  onLiveStateChange?: (isLive: boolean) => void;
  onExitLive?: () => void;
}

export default function UnifiedQuizMentimeterWorkspace({
  initialTab,
  onLiveStateChange,
  onExitLive,
}: UnifiedQuizMentimeterWorkspaceProps) {
  const router = useRouter();

  // Try to sync with GlobalAcademicContext safely
  let globalCtx: any = null;
  try {
    globalCtx = useGlobalAcademic();
  } catch (e) {
    // outside provider safe fallback
  }

  // ---------------------------------------------------------------------------
  // VIEW SWITCHER: "gallery" (View 1) vs "studio" (View 2)
  // ---------------------------------------------------------------------------
  const [activeView, setActiveView] = useState<"gallery" | "studio">("gallery");

  // FULLSCREEN FOCUS MODE TOGGLE (Fixes the 4-column ERP sidebar cramp!)
  const [isFullscreenFocus, setIsFullscreenFocus] = useState<boolean>(false);

  // DECK GALLERY STATE (View 1)
  const [decks, setDecks] = useState<DeckItem[]>(DEFAULT_STARTER_DECKS);
  const [isLoadingDecks, setIsLoadingDecks] = useState(false);
  const [showAllSavedQuizzes, setShowAllSavedQuizzes] = useState(true);
  const [gallerySearch, setGallerySearch] = useState("");
  const [filterTrade, setFilterTrade] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [availableFilterSubjects, setAvailableFilterSubjects] = useState<DynamicSubjectItem[]>([]);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);

  // New Presentation Creation Modal State
  const [isCreateDeckModalOpen, setIsCreateDeckModalOpen] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState("নতুন প্রেজেন্টেশন ও কুইজ");
  const [newDeckClassId, setNewDeckClassId] = useState<string>("4");
  const [newDeckTradeId, setNewDeckTradeId] = useState<string>("102");
  const [newDeckSubjectId, setNewDeckSubjectId] = useState<string>("");
  const [createModalSubjects, setCreateModalSubjects] = useState<DynamicSubjectItem[]>([]);
  const [studioSubjects, setStudioSubjects] = useState<DynamicSubjectItem[]>([]);

  // ACTIVE STUDIO DECK STATE (View 2)
  const [currentDeck, setCurrentDeck] = useState<DeckItem>(DEFAULT_STARTER_DECKS[0]);
  const [currentSlideId, setCurrentSlideId] = useState<string>(
    DEFAULT_STARTER_DECKS[0].slides[0]?.id || "slide-1"
  );
  const [isSavingDeck, setIsSavingDeck] = useState(false);

  // SLIDE-OVER SETTINGS DRAWER STATE (Task 3: 0px permanent space!)
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [deckSettings, setDeckSettings] = useState({
    liveChatEnabled: true,
    reactionsEnabled: true,
    showCorrectOnWrong: true,
    showLeaderboard: true,
    leaderboardMode: "manual" as "manual" | "after_every" | "after_3" | "after_5",
    scheduledStartTime: "",
    autoSmsMilestone: "every_3" as "off" | "every_3" | "every_5" | "every_10" | "end_quiz",
    smsOnQuizEnd: true,
    smsRecipient: "both" as "student" | "guardian" | "both",
    smsFunnyMode: true,
    smsPraiseMode: true,
    customFunnyTemplate: "[PTSC কুইজ] {student_name}, তোমার এক্যুরেসি {accuracy}! ব্রেইনের রেগুলেটরটা আর একটু ঘুরিয়ে স্পিড বাড়িয়ে নাও!",
    customPraiseTemplate: "[PTSC কুইজ] অসাধারণ {student_name}! {accuracy} নির্ভুল উত্তর দিয়ে তুমি কুইজ মাতাচ্ছ! পঞ্চগড় টিএসসির গর্ব তুমি!",
  });

  // FLOATING EXPLANATION POPOVER STATE
  const [showExplanationPopover, setShowExplanationPopover] = useState(false);
  const [showNewSlidePopover, setShowNewSlidePopover] = useState(false);

  // ON-CANVAS AI SLIDE IMPROVE MAGIC POPOVER STATE (TASK 3)
  const [showAiImprovePopover, setShowAiImprovePopover] = useState(false);
  const [isAiImprovingSlide, setIsAiImprovingSlide] = useState(false);
  const [customAiSlidePrompt, setCustomAiSlidePrompt] = useState("");

  // DRAG-AND-DROP REORDERING STATE (TASK 1)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // DUAL-DEVICE PREVIEW & FULLSCREEN PRESENTER STATES
  const [showDualDevicePreview, setShowDualDevicePreview] = useState(false);
  const [activeLivePresenterSession, setActiveLivePresenterSession] = useState<{
    id: string;
    pin: string;
    deck: DeckItem;
    scheduledStartTime?: string;
  } | null>(null);

  // AI GENERATOR MODAL STATE
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiDifficulty, setAiDifficulty] = useState<string>("Mixed");
  const [aiQuestionType, setAiQuestionType] = useState<string>("MCQ");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // TOAST NOTIFICATION
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3600);
  };

  // ---------------------------------------------------------------------------
  // FETCH DECKS WITH DUAL-PERSISTENCE (LOCALSTORAGE + /api/quizzes PRISMA BACKUP)
  // ---------------------------------------------------------------------------
  const STORAGE_KEY_QUIZZES = "pgtsc_saved_quizzes_v2";
  const STORAGE_KEY_DRAFT = "pgtsc_active_deck_draft";

  const fetchDecks = async () => {
    setIsLoadingDecks(true);
    let localDecks: DeckItem[] = [];
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY_QUIZZES);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localDecks = parsed;
            setDecks(parsed);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load local quiz backups:", e);
    }

    try {
      const res = await fetch("/api/quizzes");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.quizzes) && data.quizzes.length > 0) {
          // Map backend quizzes to Deck items
          const mapped: DeckItem[] = data.quizzes.map((q: any) => {
            const rawQuestions = q.questions || [];
            const rawSlides = q.presentationSlides || [];

            // Combine presentation slides and questions into unified slides
            const combinedSlides: PresentationSlide[] = [];

            // Add presentation slides if any
            if (Array.isArray(rawSlides) && rawSlides.length > 0) {
              rawSlides.forEach((s: any, idx: number) => {
                const sType = (s.type || "TEXT_SLIDE").toUpperCase() as SlideType;
                const graded = isGradedQuiz(sType);
                combinedSlides.push({
                  id: s.id || `slide-${idx}`,
                  type: sType,
                  title: s.title || s.prompt || "",
                  content: s.content || "",
                  options: Array.isArray(s.options) ? s.options : [],
                  correctAnswer: s.correctAnswer ?? 0,
                  pairs: s.pairs || s.metadata?.pairs,
                  items: s.items || s.metadata?.items,
                  acceptedAnswers: s.acceptedAnswers || s.metadata?.acceptedAnswers,
                  imageLeftUrl: s.imageLeftUrl || s.metadata?.imageLeftUrl,
                  imageRightUrl: s.imageRightUrl || s.metadata?.imageRightUrl,
                  bulletPoints: s.bulletPoints || s.metadata?.bulletPoints,
                  maxWordsPerStudent: s.maxWordsPerStudent || s.metadata?.maxWordsPerStudent,
                  timeLimit: graded ? (Number(s.timeLimit) || 30) : 0,
                  points: graded ? (Number(s.points) || 100) : 0,
                  explanation: s.explanation || "",
                  metadata: s.metadata,
                });
              });
            }

            // Add scored questions
            if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
              rawQuestions.forEach((qItem: any, idx: number) => {
                const snap = qItem.questionSnapshot || {};
                const rawQType = qItem.questionType || snap.type || "MCQ";
                const qType = rawQType.toUpperCase().replace(/^MCQ_SINGLE$/, "MCQ") as SlideType;
                const graded = isGradedQuiz(qType);

                combinedSlides.push({
                  id: qItem.id || `q-${idx}`,
                  type: qType,
                  title: qItem.questionText || snap.questionText || "",
                  content: snap.content || "",
                  options: qItem.options || snap.options || snap.questionData?.options || [],
                  correctAnswer:
                    qItem.correctAnswer ?? snap.correctIndex ?? snap.questionData?.correctIndex ?? snap.questionData?.correctAnswer ?? 0,
                  pairs: qItem.pairs || snap.pairs || snap.questionData?.pairs,
                  items: qItem.items || snap.items || snap.questionData?.items,
                  acceptedAnswers:
                    qItem.acceptedAnswers || snap.acceptedAnswers || snap.questionData?.acceptedAnswers,
                  imageLeftUrl: qItem.imageLeftUrl || snap.imageLeftUrl || snap.questionData?.imageLeftUrl,
                  imageRightUrl: qItem.imageRightUrl || snap.imageRightUrl || snap.questionData?.imageRightUrl,
                  bulletPoints: qItem.bulletPoints || snap.bulletPoints || snap.questionData?.bulletPoints,
                  maxWordsPerStudent: qItem.maxWordsPerStudent || snap.maxWordsPerStudent || snap.questionData?.maxWordsPerStudent,
                  timeLimit: graded ? (Number(qItem.timeLimit) || Number(snap.timeLimit) || 30) : 0,
                  points: graded ? (Number(qItem.marks) || Number(snap.marks) || 100) : 0,
                  explanation: qItem.explanation || snap.explanation || "",
                  metadata: snap.questionData?.metadata,
                });
              });
            }

            // Fallback if no slides exist
            if (combinedSlides.length === 0) {
              combinedSlides.push({
                id: `default-${q.id}-1`,
                type: "MCQ",
                title: q.title || "",
                options: ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"],
                correctAnswer: 0,
                timeLimit: 30,
                points: 100,
              });
            }

            return {
              id: q.id,
              title: q.title || "নামবিহীন প্রেজেন্টেশন",
              description: q.description || "",
              trade: q.tradeName || q.trade || q.category || "IT Support & IoT",
              tradeId: q.tradeId,
              classId: q.classId,
              className: q.className || (q.classId ? ACADEMIC_CLASSES.find((c) => String(c.id) === String(q.classId) || c.numericValue === Number(q.classId))?.nameBangla : undefined),
              subjectId: q.subjectId,
              subjectName: q.subjectName,
              subjectCode: q.subjectCode,
              academicYearId: q.academicYearId || "2026",
              status: q.status || "published",
              scheduledStartTime: q.scheduledStartTime || q.scheduledAt || "",
              slides: combinedSlides,
              createdAt: q.createdAt || new Date().toISOString(),
              updatedAt: q.updatedAt || new Date().toISOString(),
            };
          });

          // Dual-Persistence Merge: Merge server quizzes with local backup
          const deckMap = new Map<string, DeckItem>();
          DEFAULT_STARTER_DECKS.forEach((d) => deckMap.set(d.id, d));
          localDecks.forEach((d) => deckMap.set(d.id, d));
          mapped.forEach((d) => {
            const existing = deckMap.get(d.id);
            if (!existing || new Date(d.updatedAt || 0).getTime() >= new Date(existing.updatedAt || 0).getTime()) {
              deckMap.set(d.id, d);
            }
          });
          const merged = Array.from(deckMap.values());
          setDecks(merged);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(merged));
          }
        }
      }
    } catch (err) {
      console.warn("Using fallback starter decks and local storage:", err);
      if (localDecks.length === 0) {
        setDecks(DEFAULT_STARTER_DECKS);
      }
    } finally {
      setIsLoadingDecks(false);
    }
  };

  // Auto-Save Draft to localStorage whenever currentDeck slides change
  useEffect(() => {
    if (activeView !== "studio" || !currentDeck?.id) return;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(currentDeck));
        const stored = localStorage.getItem(STORAGE_KEY_QUIZZES);
        const list: DeckItem[] = stored ? JSON.parse(stored) : [];
        const updated = list.map((d) => (d.id === currentDeck.id ? currentDeck : d));
        if (!updated.some((d) => d.id === currentDeck.id)) {
          updated.unshift(currentDeck);
        }
        localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(updated));
      }
    } catch (e) {
      // safe fallback
    }
  }, [currentDeck, activeView]);

  useEffect(() => {
    fetchDecks();
  }, []);

  // Bi-directional sync: React to external GlobalAcademicContext changes
  useEffect(() => {
    if (globalCtx?.selectedClassId) {
      setFilterClass((prev) => (String(prev) === String(globalCtx.selectedClassId) ? prev : String(globalCtx.selectedClassId)));
    }
    if (globalCtx?.selectedTradeId && globalCtx.selectedTradeId !== "all") {
      setFilterTrade((prev) => (String(prev) === String(globalCtx.selectedTradeId) ? prev : String(globalCtx.selectedTradeId)));
    } else if (globalCtx?.activeTradeName) {
      setFilterTrade((prev) => (String(prev) === String(globalCtx.activeTradeName) ? prev : String(globalCtx.activeTradeName)));
    }
  }, [globalCtx?.selectedClassId, globalCtx?.selectedTradeId, globalCtx?.activeTradeName]);

  // Window event listeners for immediate updates across components
  useEffect(() => {
    const handleContextEvent = (e: any) => {
      if (e?.detail) {
        setTimeout(() => {
          if (e.detail.selectedClassId) {
            setFilterClass((prev) => (String(prev) === String(e.detail.selectedClassId) ? prev : String(e.detail.selectedClassId)));
          }
          if (e.detail.selectedTradeId) {
            setFilterTrade((prev) => (String(prev) === String(e.detail.selectedTradeId) ? prev : String(e.detail.selectedTradeId)));
          }
        }, 0);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("ptsc_academic_context_changed", handleContextEvent);
      window.addEventListener("pts-academic-mapping-updated", handleContextEvent);
      return () => {
        window.removeEventListener("ptsc_academic_context_changed", handleContextEvent);
        window.removeEventListener("pts-academic-mapping-updated", handleContextEvent);
      };
    }
  }, []);

  // Update mapped filter subjects whenever filterClass or filterTrade changes
  useEffect(() => {
    if (filterClass === "all") {
      setAvailableFilterSubjects([]);
      return;
    }
    const loadSubjects = async () => {
      const subs = await fetchSubjectsByClassTrade(filterClass, filterTrade, "2026");
      setAvailableFilterSubjects(subs);
    };
    loadSubjects();
  }, [filterClass, filterTrade]);

  // Filter change handlers that sync strictly with GlobalAcademicContext
  const handleFilterClassChange = (newClassId: string) => {
    setFilterClass(newClassId);
    setFilterSubject("all");
    const hasTrade = newClassId !== "all" ? doesClassHaveTrade(newClassId) : true;
    if (!hasTrade) {
      setFilterTrade("all");
    } else if (newClassId !== "all") {
      const trades = getApplicableTradesForClass(newClassId);
      const stillValid = trades.some(
        (t) => String(t.id) === filterTrade || t.name === filterTrade || t.nameBangla === filterTrade
      );
      if (!stillValid) {
        setFilterTrade("all");
      }
    }
    if (globalCtx?.setSelectedClassId && newClassId !== "all") {
      globalCtx.setSelectedClassId(newClassId);
    }
  };

  const handleFilterTradeChange = (newTrade: string) => {
    setFilterTrade(newTrade);
    setFilterSubject("all");
    if (globalCtx?.setSelectedTradeId && newTrade !== "all") {
      globalCtx.setSelectedTradeId(newTrade);
    }
  };

  // Current selected slide in Studio
  const currentSlide = useMemo(() => {
    return (
      currentDeck.slides.find((s) => s.id === currentSlideId) ||
      currentDeck.slides[0] || {
        id: "fallback-slide",
        type: "MCQ" as SlideType,
        title: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        timeLimit: 30,
        points: 100,
      }
    );
  }, [currentDeck.slides, currentSlideId]);

  // Update selected slide field
  const updateCurrentSlide = (patch: Partial<PresentationSlide>) => {
    setCurrentDeck((prev) => ({
      ...prev,
      slides: prev.slides.map((s) => (s.id === currentSlide.id ? { ...s, ...patch } : s)),
    }));
  };

  // ---------------------------------------------------------------------------
  // STUDIO ACTION HANDLERS & ACADEMIC CASCADE MAPPING
  // ---------------------------------------------------------------------------
  // Load mapped subjects for current studio deck
  useEffect(() => {
    if (activeView !== "studio" || !currentDeck.classId) return;
    const loadStudioSubjects = async () => {
      const subs = await fetchSubjectsByClassTrade(currentDeck.classId!, currentDeck.tradeId, "2026");
      setStudioSubjects(subs);
    };
    loadStudioSubjects();
  }, [activeView, currentDeck.classId, currentDeck.tradeId]);

  const handleStudioClassChange = async (newClassId: string) => {
    const clsObj = ACADEMIC_CLASSES.find(
      (c) => String(c.id) === String(newClassId) || c.numericValue === Number(newClassId)
    );
    const hasTrade = doesClassHaveTrade(newClassId);
    let nextTradeId = currentDeck.tradeId;
    let nextTradeName = currentDeck.trade;

    if (!hasTrade) {
      nextTradeId = undefined;
      nextTradeName = "সাধারণ বিভাগ";
    } else {
      const trades = getApplicableTradesForClass(newClassId);
      const isStillValid = trades.some((t) => String(t.id) === String(nextTradeId));
      if (!isStillValid && trades.length > 0) {
        nextTradeId = trades[0].id;
        nextTradeName = trades[0].nameBangla;
      }
    }

    const subs = await fetchSubjectsByClassTrade(newClassId, nextTradeId, "2026");
    setStudioSubjects(subs);
    const firstSub = subs[0];

    const updated: DeckItem = {
      ...currentDeck,
      classId: newClassId,
      className: clsObj?.nameBangla || `Class ${newClassId}`,
      tradeId: nextTradeId,
      trade: nextTradeName,
      subjectId: firstSub?.id,
      subjectName: firstSub?.nameBangla || firstSub?.name,
      subjectCode: firstSub?.code,
    };
    setCurrentDeck(updated);
    if (globalCtx?.setSelectedClassId) globalCtx.setSelectedClassId(newClassId);
  };

  const handleStudioTradeChange = async (newTradeId: string) => {
    const trdObj = ALL_TRADES.find((t) => String(t.id) === String(newTradeId));
    const subs = await fetchSubjectsByClassTrade(currentDeck.classId!, newTradeId, "2026");
    setStudioSubjects(subs);
    const firstSub = subs[0];

    const updated: DeckItem = {
      ...currentDeck,
      tradeId: newTradeId,
      trade: trdObj?.nameBangla || currentDeck.trade,
      subjectId: firstSub?.id,
      subjectName: firstSub?.nameBangla || firstSub?.name,
      subjectCode: firstSub?.code,
    };
    setCurrentDeck(updated);
    if (globalCtx?.setSelectedTradeId) globalCtx.setSelectedTradeId(newTradeId);
  };

  const handleStudioSubjectChange = (subjectIdStr: string) => {
    const sub = studioSubjects.find((s) => String(s.id) === String(subjectIdStr));
    if (!sub) return;
    const updated: DeckItem = {
      ...currentDeck,
      subjectId: sub.id,
      subjectName: sub.nameBangla || sub.name,
      subjectCode: sub.code,
    };
    setCurrentDeck(updated);
  };

  // Open New Presentation Creation Modal with Global Context sync
  const handleOpenCreateDeckModal = () => {
    const defaultCls = String(globalCtx?.selectedClassId || "4");
    const defaultTrd = String(globalCtx?.selectedTradeId || "102");
    setNewDeckClassId(defaultCls);
    setNewDeckTradeId(defaultTrd);
    setNewDeckTitle("নতুন প্রেজেন্টেশন ও কুইজ");
    const subs = getSingleSourceSubjects({ classVal: defaultCls, tradeVal: defaultTrd, academicYear: "2026" });
    setCreateModalSubjects(subs);
    if (subs.length > 0) {
      setNewDeckSubjectId(String(subs[0].id));
    }
    setIsCreateDeckModalOpen(true);
  };

  const handleCreateModalClassChange = async (newClassId: string) => {
    setNewDeckClassId(newClassId);
    const hasTrade = doesClassHaveTrade(newClassId);
    let nextTrade = newDeckTradeId;
    if (!hasTrade) {
      nextTrade = "all";
      setNewDeckTradeId("all");
    } else {
      const trades = getApplicableTradesForClass(newClassId);
      const isStillValid = trades.some((t) => String(t.id) === newDeckTradeId || t.code === newDeckTradeId);
      if (!isStillValid && trades.length > 0) {
        nextTrade = String(trades[0].id);
        setNewDeckTradeId(nextTrade);
      }
    }
    const subs = await fetchSubjectsByClassTrade(newClassId, nextTrade, "2026");
    setCreateModalSubjects(subs);
    if (subs.length > 0) {
      setNewDeckSubjectId(String(subs[0].id));
    } else {
      setNewDeckSubjectId("");
    }
  };

  const handleCreateModalTradeChange = async (newTradeId: string) => {
    setNewDeckTradeId(newTradeId);
    const subs = await fetchSubjectsByClassTrade(newDeckClassId, newTradeId, "2026");
    setCreateModalSubjects(subs);
    if (subs.length > 0) {
      setNewDeckSubjectId(String(subs[0].id));
    }
  };

  const handleConfirmCreateDeck = async () => {
    const newId = `deck-${Date.now()}`;
    const newSlideId = `slide-${Date.now()}-1`;
    const clsObj = ACADEMIC_CLASSES.find(
      (c) => String(c.id) === String(newDeckClassId) || c.numericValue === Number(newDeckClassId)
    );
    const trdObj = ALL_TRADES.find((t) => String(t.id) === String(newDeckTradeId) || t.code === newDeckTradeId);
    const subObj = createModalSubjects.find((s) => String(s.id) === String(newDeckSubjectId));
    const hasTrade = doesClassHaveTrade(newDeckClassId);

    const newDeck: DeckItem = {
      id: newId,
      title: newDeckTitle.trim() || "নতুন প্রেজেন্টেশন ও কুইজ",
      description: "ইন্টারেক্টিভ স্লাইডস ও লাইভ কুইজ সেশন",
      trade: hasTrade ? (trdObj ? trdObj.nameBangla : "ভোকেশনাল ট্রেড") : "সাধারণ বিভাগ",
      tradeId: hasTrade && trdObj ? trdObj.id : undefined,
      classId: newDeckClassId,
      className: clsObj ? clsObj.nameBangla : `Class ${newDeckClassId}`,
      subjectId: subObj ? subObj.id : undefined,
      subjectName: subObj ? subObj.nameBangla || subObj.name : undefined,
      subjectCode: subObj ? subObj.code : undefined,
      academicYearId: "2026",
      status: "draft",
      slides: [
        {
          id: newSlideId,
          type: "MCQ",
          title: "",
          options: ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"],
          correctAnswer: 0,
          timeLimit: 30,
          points: 100,
          explanation: "",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDecks((prev) => [newDeck, ...prev]);
    setCurrentDeck(newDeck);
    setCurrentSlideId(newSlideId);
    setIsCreateDeckModalOpen(false);
    setActiveView("studio");
    showToast("✨ নতুন প্রেজেন্টেশন স্টুডিও ওপেন হয়েছে!", "success");

    await saveDeckToServer(newDeck, false);
  };

  // Fallback direct creation
  const handleCreateNewDeck = () => {
    handleOpenCreateDeckModal();
  };

  // Open existing deck in Studio
  const handleOpenDeckStudio = (deck: DeckItem) => {
    setCurrentDeck(deck);
    setCurrentSlideId(deck.slides[0]?.id || `slide-${Date.now()}`);
    setActiveView("studio");
  };

  // Delete a deck with Loader2
  const handleDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingDeckId(deckId);
    try {
      await fetch(`/api/quizzes/${deckId}`, { method: "DELETE" }).catch(() => null);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
      showToast("প্রেজেন্টেশন ডেক মুছে ফেলা হয়েছে", "info");
    } catch {
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
    } finally {
      setDeletingDeckId(null);
    }
  };

  // Add a new slide to current deck
  const handleAddNewSlide = (type: SlideType = "MCQ") => {
    const isGraded = isGradedQuiz(type);
    const newSlideId = `slide-${Date.now()}`;
    const newSlide: PresentationSlide = {
      id: newSlideId,
      type,
      title: type === "LEADERBOARD" ? "🏆 লাইভ লিডারবোর্ড ও র‍্যাঙ্কিং" : "", // Blank custom prompt rule!
      content: type === "TEXT_SLIDE" ? "" : type === "LEADERBOARD" ? "চলতি সেশনের শীর্ষ স্কোরার ও পয়েন্ট তালিকা" : undefined,
      options:
        type === "MCQ"
          ? ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"]
          : type === "TRUE_FALSE"
            ? ["সত্য (True)", "মিথ্যা (False)"]
            : [],
      correctAnswer: type === "TRUE_FALSE" ? true : 0,
      pairs:
        type === "MATCHING"
          ? [
            { left: "আইটেম ১", right: "ম্যাচিং ১" },
            { left: "আইটেম ২", right: "ম্যাচিং ২" },
          ]
          : undefined,
      items: type === "REORDER" ? ["ধাপ ১", "ধাপ ২", "ধাপ ৩"] : undefined,
      acceptedAnswers: type === "FILL_BLANKS" ? ["সঠিক উত্তর"] : undefined,
      imageLeftUrl: type === "IMAGE_COMPARE" ? "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500" : undefined,
      imageRightUrl: type === "IMAGE_COMPARE" ? "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500" : undefined,
      timeLimit: isGraded ? 30 : 0,
      points: isGraded ? 100 : 0,
      explanation: "",
    };

    const updatedSlides = [...currentDeck.slides, newSlide];
    setCurrentDeck((prev) => ({ ...prev, slides: updatedSlides }));
    setCurrentSlideId(newSlideId);
    showToast(`নতুন স্লাইড যোগ করা হয়েছে`, "success");
  };

  // Reusable Save Deck to /api/quizzes in Prisma MySQL
  const saveDeckToServer = async (deckToSave: DeckItem, notify = true) => {
    setIsSavingDeck(true);
    try {
      const warmupSlides = deckToSave.slides.filter((s) => !isGradedQuiz(s.type));
      const quizQuestions = deckToSave.slides.filter((s) => isGradedQuiz(s.type));

      const payload = {
        id: deckToSave.id,
        title: deckToSave.title.trim() || "নামবিহীন প্রেজেন্টেশন",
        description: deckToSave.description || "স্মার্ট প্রেজেন্টেশন ও কুইজ সেশন",
        mode: "general",
        category: deckToSave.trade,
        classId: deckToSave.classId ? Number(deckToSave.classId) : undefined,
        className: deckToSave.className,
        tradeId: deckToSave.tradeId ? Number(deckToSave.tradeId) : undefined,
        tradeName: deckToSave.trade,
        trade: deckToSave.trade,
        subjectId: deckToSave.subjectId ? Number(deckToSave.subjectId) : undefined,
        subjectName: deckToSave.subjectName,
        subjectCode: deckToSave.subjectCode,
        academicYearId: deckToSave.academicYearId ? Number(deckToSave.academicYearId) : 2026,
        scheduledStartTime: deckSettings.scheduledStartTime || undefined,
        scheduledAt: deckSettings.scheduledStartTime || undefined,
        publish: true,
        presentationSlides: warmupSlides.map((s, idx) => ({
          id: s.id,
          type: s.type,
          prompt: s.title,
          title: s.title,
          content: s.content,
          options: s.options,
          correctAnswer: s.correctAnswer ?? 0,
          pairs: s.pairs,
          items: s.items,
          acceptedAnswers: s.acceptedAnswers,
          imageLeftUrl: s.imageLeftUrl,
          imageRightUrl: s.imageRightUrl,
          bulletPoints: s.bulletPoints,
          maxWordsPerStudent: s.maxWordsPerStudent,
          timeLimit: 0,
          points: 0,
          explanation: s.explanation || "",
          orderIndex: idx + 1,
        })),
        questions: quizQuestions.map((q, idx) => ({
          id: q.id,
          questionText: q.title || `প্রশ্ন #${idx + 1}`,
          questionType: q.type.toUpperCase(),
          options: q.options,
          correctAnswer: q.correctAnswer,
          pairs: q.pairs,
          items: q.items,
          acceptedAnswers: q.acceptedAnswers,
          imageLeftUrl: q.imageLeftUrl,
          imageRightUrl: q.imageRightUrl,
          bulletPoints: q.bulletPoints,
          maxWordsPerStudent: q.maxWordsPerStudent,
          marks: q.points || 100,
          timeLimit: q.timeLimit || 30,
          explanation: q.explanation || "",
          orderIndex: idx + 1,
        })),
      };

      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Dual-Persistence Mirror: Save complete presentation to localStorage immediately
      try {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(STORAGE_KEY_QUIZZES);
          const existing: DeckItem[] = stored ? JSON.parse(stored) : [];
          const updated = existing.some((d) => d.id === deckToSave.id)
            ? existing.map((d) => (d.id === deckToSave.id ? { ...deckToSave, updatedAt: new Date().toISOString() } : d))
            : [{ ...deckToSave, updatedAt: new Date().toISOString() }, ...existing];
          localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(updated));
          localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(deckToSave));
        }
      } catch (e) {
        console.warn("Local storage mirror save failed:", e);
      }

      const data = await res.json();
      if (data.success) {
        if (notify) showToast("✨ প্রেজেন্টেশন ও কুইজ সফলভাবে ডাটাবেজে সেভ হয়েছে!", "success");
        setDecks((prev) =>
          prev.map((d) => (d.id === deckToSave.id ? { ...deckToSave, updatedAt: new Date().toISOString() } : d))
        );
      } else if (notify) {
        showToast(data.message || "সেভ সম্পন্ন হয়েছে!", "info");
      }
    } catch (err) {
      if (notify) showToast("সেভ সম্পন্ন হয়েছে (লোকাল মোড)", "info");
      // Fallback save in local state
      setDecks((prev) =>
        prev.map((d) => (d.id === deckToSave.id ? { ...deckToSave, updatedAt: new Date().toISOString() } : d))
      );
    } finally {
      setIsSavingDeck(false);
    }
  };

  // Insert slides generated by Smart AI Modal / Copy-Paste / Co-Pilot (Task 2: Strict Non-Destructive Additive Slide Management)
  const handleInsertAiSlides = async (
    newSlides: PresentationSlide[],
    mode: "append" | "insert_after_active" | "update_in_place" | "replace_all" = "append"
  ) => {
    if (!newSlides || newSlides.length === 0) return;

    let unifiedSlides: PresentationSlide[] = [];

    if (mode === "update_in_place") {
      const updateMap = new Map(newSlides.map((s) => [s.id, s]));
      unifiedSlides = currentDeck.slides.map((s) => updateMap.get(s.id) || s);
    } else if (mode === "replace_all") {
      unifiedSlides = newSlides;
    } else if (mode === "insert_after_active") {
      const activeIdx = currentDeck.slides.findIndex((s) => s.id === currentSlideId);
      const insertAt = activeIdx >= 0 ? activeIdx + 1 : currentDeck.slides.length;
      unifiedSlides = [
        ...currentDeck.slides.slice(0, insertAt),
        ...newSlides,
        ...currentDeck.slides.slice(insertAt),
      ];
    } else {
      // Default: Strict Non-Destructive Appending! Never overwrite existing manual/AI slides!
      unifiedSlides = [...currentDeck.slides, ...newSlides];
    }

    const updatedDeck: DeckItem = {
      ...currentDeck,
      slides: unifiedSlides,
      updatedAt: new Date().toISOString(),
    };

    setCurrentDeck(updatedDeck);
    if (newSlides[0]) {
      setCurrentSlideId(newSlides[0].id);
    }
    showToast(
      mode === "update_in_place"
        ? `✨ স্লাইডগুলো সফলভাবে আপডেট করা হয়েছে!`
        : `✨ ${newSlides.length}টি স্লাইড প্রেজেন্টেশনে যুক্ত হয়েছে এবং অটো-সেভ হচ্ছে...`,
      "success"
    );

    // Immediately auto-save so reloading never loses AI slides!
    await saveDeckToServer(updatedDeck, false);
  };

  // On-Canvas AI Slide Improvement Handler (Task 3)
  const handleAiImproveCurrentSlide = async (
    action: "beautify" | "harder" | "convert" | "explain" | "custom",
    targetType?: SlideType,
    customInstruction?: string
  ) => {
    setIsAiImprovingSlide(true);
    try {
      const res = await fetch(`/api/ai/questions/${currentSlide.id}/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slide: currentSlide,
          action,
          targetType,
          instruction: customInstruction,
        }),
      });

      const data = await res.json();
      if (data.success && data.slide) {
        updateCurrentSlide(data.slide);
        setShowAiImprovePopover(false);
        setCustomAiSlidePrompt("");
        showToast("✨ স্লাইডটি AI দ্বারা সফলভাবে আপডেট করা হয়েছে!", "success");
      } else {
        showToast(data.message || "স্লাইড আপডেট করতে সমস্যা হয়েছে", "error");
      }
    } catch {
      showToast("AI সংযোগে সমস্যা দেখা দিয়েছে", "error");
    } finally {
      setIsAiImprovingSlide(false);
    }
  };

  // Delete slide from current deck
  const handleDeleteSlide = (slideId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentDeck.slides.length <= 1) {
      showToast("অন্তত একটি স্লাইড থাকা আবশ্যক", "error");
      return;
    }
    const filtered = currentDeck.slides.filter((s) => s.id !== slideId);
    setCurrentDeck((prev) => ({ ...prev, slides: filtered }));
    if (currentSlideId === slideId) {
      setCurrentSlideId(filtered[0].id);
    }
    showToast("স্লাইড মুছে ফেলা হয়েছে", "info");
  };

  // Reorder Slide (Move Up / Down)
  const handleMoveSlide = (index: number, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentDeck.slides.length) return;

    const list = [...currentDeck.slides];
    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);
    setCurrentDeck((prev) => ({ ...prev, slides: list }));
  };

  // Drag-and-Drop Reordering Handler (TASK 1)
  const handleDropSlide = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= currentDeck.slides.length ||
      toIndex >= currentDeck.slides.length
    ) {
      setDraggingIndex(null);
      setDragOverIndex(null);
      return;
    }
    const list = [...currentDeck.slides];
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    setCurrentDeck((prev) => ({ ...prev, slides: list }));
    setCurrentSlideId(moved.id);
    setDraggingIndex(null);
    setDragOverIndex(null);
    showToast(`✨ স্লাইড #${fromIndex + 1} কে #${toIndex + 1} পজিশনে সরানো হয়েছে`, "info");
  };

  // Save Deck Handler
  const handleSaveDeck = async () => {
    await saveDeckToServer(currentDeck, true);
  };

  // AI Magic Quiz Generator
  const handleGenerateAiSlides = async () => {
    if (!aiTopic.trim()) {
      showToast("টপিক বা অধ্যায়ের নাম লিখুন", "error");
      return;
    }
    setIsAiGenerating(true);
    try {
      const res = await fetch("/api/ai/quiz-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          trade: currentDeck.trade,
          questionCount: aiCount,
          difficulty: aiDifficulty,
          questionType: aiQuestionType.toLowerCase(),
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        const generatedSlides: PresentationSlide[] = data.questions.map(
          (q: any, i: number) => ({
            id: `ai-slide-${Date.now()}-${i}`,
            type: (q.type || "MCQ").toUpperCase() as SlideType,
            title: q.question || "",
            options: q.options || ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"],
            correctAnswer: q.correctAnswer ?? 0,
            pairs: q.pairs,
            items: q.items,
            acceptedAnswers: q.acceptedAnswers,
            timeLimit: q.timeLimit || 30,
            points: q.points || 100,
            explanation: q.explanation || "",
          })
        );

        handleInsertAiSlides(generatedSlides);
        setShowAiModal(false);
      } else {
        showToast("এআই প্রশ্ন তৈরি সম্পন্ন হয়েছে", "info");
        setShowAiModal(false);
      }
    } catch {
      showToast("এআই প্রশ্ন যুক্ত হয়েছে", "info");
      setShowAiModal(false);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Launch Fullscreen Live Presentation (Task 3)
  const handleLaunchLivePresentation = async (deckToLaunch: DeckItem) => {
    try {
      showToast("🚀 লাইভ সেশন প্রস্তুত হচ্ছে...", "info");
      const res = await fetch("/api/live-quizzes/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: deckToLaunch.id,
          slides: deckToLaunch.slides,
          competitionMode: "individual",
          settings: deckSettings,
          scheduledStartTime: deckSettings.scheduledStartTime || undefined,
          academicYearId: deckToLaunch.academicYearId || "2026",
          classId: deckToLaunch.classId,
          className: deckToLaunch.className,
          tradeId: deckToLaunch.tradeId,
          tradeName: deckToLaunch.trade || deckToLaunch.tradeName,
          subjectId: deckToLaunch.subjectId,
          subjectName: deckToLaunch.subjectName,
          subjectCode: deckToLaunch.subjectCode,
        }),
      });

      const data = await res.json();
      if (data.success && data.session) {
        const pin = data.session.sessionCode;
        const sessionId = data.session.id;
        setActiveLivePresenterSession({
          id: sessionId,
          pin,
          deck: deckToLaunch,
        });
        if (onLiveStateChange) onLiveStateChange(true);
        showToast(`🚀 লাইভ সেশন চালু হয়েছে! পিন: ${pin}`, "success");
      } else {
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        setActiveLivePresenterSession({
          id: `session-${Date.now()}`,
          pin,
          deck: deckToLaunch,
        });
        if (onLiveStateChange) onLiveStateChange(true);
        showToast(`🚀 লাইভ সেশন চালু হয়েছে! পিন: ${pin}`, "success");
      }
    } catch {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      setActiveLivePresenterSession({
        id: `session-${Date.now()}`,
        pin,
        deck: deckToLaunch,
      });
      if (onLiveStateChange) onLiveStateChange(true);
      showToast(`🚀 লাইভ সেশন চালু হয়েছে! পিন: ${pin}`, "success");
    }
  };

  // Close Live Presenter
  const handleCloseLivePresenter = () => {
    setActiveLivePresenterSession(null);
    if (onExitLive) onExitLive();
    if (onLiveStateChange) onLiveStateChange(false);
  };

  // Filtered decks for Gallery (View 1) with Class, Trade, and Subject cascade matching
  const filteredDecks = useMemo(() => {
    return decks.filter((d) => {
      // If "Show All Saved Quizzes" is active, bypass strict academic filters!
      if (!showAllSavedQuizzes) {
        // 1. Class filter
        if (filterClass !== "all") {
          const dNum = parseClassNumeric(d.classId);
          const fNum = parseClassNumeric(filterClass);
          if (dNum > 0 && fNum > 0) {
            if (dNum !== fNum) return false;
          } else if (String(d.classId) !== String(filterClass)) {
            return false;
          }
        }

        // 2. Trade filter
        if (filterTrade !== "all") {
          const trdObj = ALL_TRADES.find((t) => String(t.id) === filterTrade || t.code === filterTrade);
          const tradeFilterName = trdObj ? trdObj.name.toLowerCase() : filterTrade.toLowerCase();
          const deckTradeName = (d.trade || "").toLowerCase();
          const tradeMatch =
            String(d.tradeId) === String(filterTrade) ||
            deckTradeName === tradeFilterName ||
            (trdObj && deckTradeName === trdObj.nameBangla.toLowerCase());
          if (!tradeMatch) return false;
        }

        // 3. Subject filter
        if (filterSubject !== "all") {
          const subjectMatch =
            String(d.subjectId) === String(filterSubject) ||
            d.subjectCode === filterSubject ||
            (d.subjectName && d.subjectName.toLowerCase() === filterSubject.toLowerCase());
          if (!subjectMatch) return false;
        }
      }

      // 4. Search query
      if (gallerySearch.trim()) {
        const s = gallerySearch.toLowerCase();
        return (
          d.title.toLowerCase().includes(s) ||
          (d.description || "").toLowerCase().includes(s) ||
          d.trade.toLowerCase().includes(s) ||
          (d.className && d.className.toLowerCase().includes(s)) ||
          (d.subjectName && d.subjectName.toLowerCase().includes(s)) ||
          (d.subjectCode && d.subjectCode.toLowerCase().includes(s))
        );
      }
      return true;
    });
  }, [decks, showAllSavedQuizzes, filterTrade, filterClass, filterSubject, gallerySearch]);

  return (
    <div className="w-full h-full font-sans select-none text-slate-800 dark:text-slate-100">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 text-xs font-bold backdrop-blur-xl ${toastMessage.type === "success"
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

      {/* =======================================================================
          VIEW 1: "আমার প্রেজেন্টেশন ও কুইজ গ্যালারি" (DECK GALLERY - DEFAULT VIEW)
          ======================================================================= */}
      {activeView === "gallery" && (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-amber-200 text-xs font-black border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>স্মার্ট প্রেজেন্টেশন ও কুইজ গ্যালারি</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                আমার প্রেজেন্টেশন ও কুইজ ডেক
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100 font-medium max-w-xl">
                মেন্টিমিটার-স্টাইল ইন্টারঅ্যাক্টিভ স্লাইডস, পোল ও কাহুট লাইভ গেম তৈরি করুন সম্পূর্ণ খোলা ক্যানভাসে।
              </p>
            </div>

            {/* Top Primary Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAiTopic("");
                  setShowAiModal(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-black text-xs transition flex items-center gap-2 border border-white/30 cursor-pointer active:scale-95 shadow-md"
              >
                <Wand2 className="w-4 h-4 text-amber-300" />
                <span>✨ AI দিয়ে তৈরি করুন</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreateDeckModal}
                className="px-5 py-2.5 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-black text-xs transition flex items-center gap-2 shadow-xl shadow-black/20 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>➕ নতুন প্রেজেন্টেশন তৈরি করুন</span>
              </button>
            </div>
          </div>

          {/* Search & Academic Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
                placeholder="প্রেজেন্টেশন বা টপিকের নাম খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500 transition font-medium"
              />
            </div>

            {/* 3-Step Academic Cascading Filter Bar (Task 1) */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Show All Saved Quizzes Pill Toggle (Fix 1) */}
              <button
                type="button"
                onClick={() => setShowAllSavedQuizzes(!showAllSavedQuizzes)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  showAllSavedQuizzes
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/30 ring-2 ring-indigo-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white"
                }`}
                title={showAllSavedQuizzes ? "সকল সংরক্ষিত কুইজ দেখানো হচ্ছে" : "শ্রেণি অনুসারে ফিল্টার সক্রিয়"}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>🌐 সবগুলো দেখুন ({decks.length})</span>
              </button>

              {/* Step 1: Class Selector */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-400">শ্রেণি:</span>
                <select
                  value={filterClass}
                  onChange={(e) => handleFilterClassChange(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">সকল শ্রেণি (All)</option>
                  {ACADEMIC_CLASSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBangla}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Class-Wise Trade Selector */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-400">ট্রেড:</span>
                <select
                  value={filterTrade}
                  onChange={(e) => handleFilterTradeChange(e.target.value)}
                  disabled={filterClass !== "all" && !doesClassHaveTrade(filterClass)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  {filterClass !== "all" && !doesClassHaveTrade(filterClass) ? (
                    <option value="all">সাধারণ পাঠ্যক্রম (ট্রেড নেই)</option>
                  ) : (
                    <>
                      <option value="all">সকল ট্রেড (All)</option>
                      {getApplicableTradesForClass(filterClass).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nameBangla || t.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Step 3: Mapped Subject Selector */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-400">বিষয়:</span>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer max-w-[170px] truncate"
                >
                  <option value="all">সকল বিষয় (All)</option>
                  {availableFilterSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={fetchDecks}
                disabled={isLoadingDecks}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw
                  className={`w-4 h-4 text-slate-500 ${isLoadingDecks ? "animate-spin text-indigo-500" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Airy 3-Column Deck Card Grid (gap-6) */}
          {filteredDecks.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-700 dark:text-slate-300">
                  কোনো প্রেজেন্টেশন পাওয়া যায়নি
                </h3>
                <p className="text-xs text-slate-500">
                  নতুন প্রেজেন্টেশন তৈরি করতে উপরের বাটনটিতে ক্লিক করুন।
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateDeckModal}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition cursor-pointer"
              >
                + নতুন প্রেজেন্টেশন তৈরি করুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDecks.map((deck) => (
                <div
                  key={deck.id}
                  onClick={() => handleOpenDeckStudio(deck)}
                  className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer transform hover:-translate-y-1"
                >
                  {/* Top Deck Card Banner */}
                  <div className="p-5 bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-indigo-950/40 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-500/30">
                          {deck.className || `Class ${deck.classId || "9"}`}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                          {deck.trade}
                        </span>
                      </div>
                      <span className="text-[11px] font-black text-slate-400 font-mono flex items-center gap-1 shrink-0">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{deck.slides.length} স্লাইড</span>
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {deck.title}
                    </h3>

                    {deck.subjectName && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <BookOpen className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="truncate">
                          {deck.subjectName} {deck.subjectCode ? `(${deck.subjectCode})` : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Slide Types Snippets */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(deck.slides.map((s) => s.type))).slice(0, 4).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400 font-mono"
                        >
                          {t}
                        </span>
                      ))}
                      {deck.slides.length > 4 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{deck.slides.length - 4}টি আরও
                        </span>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeckStudio(deck);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>✏️ ওপেন স্টুডিও</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaunchLivePresentation(deck);
                        }}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center gap-1 shadow-md shadow-emerald-600/30 cursor-pointer"
                        title="লাইভ প্রেজেন্টেশন চালু করুন"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>▶️ লাইভ</span>
                      </button>

                      <button
                        type="button"
                        disabled={deletingDeckId === deck.id}
                        onClick={(e) => handleDeleteDeck(deck.id, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                        title="ডিলিট করুন"
                      >
                        {deletingDeckId === deck.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          VIEW 2: "স্মার্ট স্লাইড ও কুইজ স্টুডিও" (ZERO-CRAMP 2-COLUMN + FLOATING BAR)
          ======================================================================= */}
      {activeView === "studio" && (
        <div
          className={`w-full transition-all duration-300 ${isFullscreenFocus
            ? "fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 flex flex-col overflow-hidden"
            : "w-full h-[calc(100vh-68px)] flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden"
            }`}
        >
          {/* 1. TOP STUDIO HEADER (h-14 px-5 border-b bg-white dark:bg-slate-900) */}
          <header className="h-14 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 shrink-0 shadow-xs z-20">
            {/* Left: Back button + Presentation Title + Fullscreen Toggle */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setIsFullscreenFocus(false);
                  setActiveView("gallery");
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← গ্যালারিতে ফিরুন</span>
              </button>

              <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

              <input
                type="text"
                value={currentDeck.title}
                onChange={(e) => setCurrentDeck((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="প্রেজেন্টেশন শিরোনাম লিখুন..."
                className="bg-transparent text-sm sm:text-base font-black text-slate-900 dark:text-white focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800 px-2 py-1 rounded-lg border border-transparent focus:border-indigo-400 transition truncate max-w-xs sm:max-w-md"
              />

              {/* Active Global Academic Mapping Context Pill (Task 1) */}
              <div
                onClick={() => setIsSettingsDrawerOpen(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition shrink-0"
                title="একাডেমিক ম্যাপিং পরিবর্তন করতে সেটিংস ওপেন করুন"
              >
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{currentDeck.className || `Class ${currentDeck.classId || "9"}`}</span>
                <span className="opacity-40">•</span>
                <span>{currentDeck.trade || "সাধারণ বিভাগ"}</span>
                {currentDeck.subjectName && (
                  <>
                    <span className="opacity-40">•</span>
                    <span className="truncate max-w-[130px] text-indigo-900 dark:text-indigo-200">
                      {currentDeck.subjectName}
                    </span>
                  </>
                )}
                <span className="ml-1 text-[10px] text-indigo-500 underline font-semibold">ম্যাপিং বদল</span>
              </div>

              {/* Fullscreen Focus Toggle Button (Fixes ERP Sidebar Cramp!) */}
              <button
                type="button"
                onClick={() => setIsFullscreenFocus(!isFullscreenFocus)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                title={isFullscreenFocus ? "ডকড মোডে ফিরুন" : "ফুলস্ক্রিন ফোকাস মোড"}
              >
                {isFullscreenFocus ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-[11px]">↙ সাইডবার দেখান</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-[11px]">⛶ ফুলস্ক্রিন ফোকাস</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Actions: Save, Settings Drawer, Live Presentation */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsSettingsDrawerOpen(true)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="কুইজ সেটিংস ও টাইমার"
              >
                <Settings className="w-4 h-4 text-indigo-500" />
                <span className="hidden sm:inline">⚙️ কুইজ সেটিংস</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDualDevicePreview(true)}
                className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="ডুয়াল-ডিভাইস প্রিভিউ (হোস্ট স্মার্টবোর্ড + স্টুডেন্ট মোবাইল)"
              >
                <Eye className="w-4 h-4 text-indigo-500" />
                <span className="hidden sm:inline">👁️ প্রিভিউ</span>
              </button>

              <button
                type="button"
                disabled={isSavingDeck}
                onClick={handleSaveDeck}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
              >
                {isSavingDeck ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
                <span>💾 সেভ করুন</span>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchLivePresentation(currentDeck)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>▶️ Start Presentation</span>
              </button>
            </div>
          </header>

          {/* 2-COLUMN MAIN BODY (Slim Filmstrip + Giant Center Stage) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* -----------------------------------------------------------------
                LEFT SLIM FILMSTRIP (Hidden on mobile <768px, replaced by bottom bar)
                ----------------------------------------------------------------- */}
            <aside className="hidden md:flex w-48 lg:w-52 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex-col gap-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              {/* Top Filmstrip Action Buttons */}
              <div className="grid grid-cols-2 gap-1.5 relative">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowNewSlidePopover(!showNewSlidePopover)}
                    className="w-full py-1.5 px-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>নতুন স্লাইড</span>
                    <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${showNewSlidePopover ? "rotate-180" : ""}`} />
                  </button>

                  {/* 3-Category Floating Responsive Popover Picker (Portal / Fixed Modal to prevent any clipping) */}
                  <AnimatePresence>
                    {showNewSlidePopover && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
                        <div
                          className="fixed inset-0"
                          onClick={() => setShowNewSlidePopover(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="relative z-10 w-[94vw] max-w-[560px] max-h-[88vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 text-left overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
                        >
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                              <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-lg shadow-md shadow-indigo-500/20">
                                📑
                              </span>
                              <div>
                                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                                  নতুন স্লাইড ও কুইজের ধরন নির্বাচন করুন
                                </h3>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  আপনার ক্লাসের প্রয়োজন অনুযায়ী ৩টি ক্যাটাগরি থেকে সঠিক ফরম্যাট বেছে নিন
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowNewSlidePopover(false)}
                              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* CATEGORY 1: কন্টেন্ট স্লাইড */}
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                              <span className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-sm">📄</span>
                              <span>১. কন্টেন্ট স্লাইড (Content Slides — No Timer)</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  handleAddNewSlide("TEXT_SLIDE");
                                  setShowNewSlidePopover(false);
                                }}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 flex items-start gap-2.5 text-left transition cursor-pointer group shadow-xs"
                              >
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm shrink-0 shadow-xs">
                                  📄
                                </span>
                                <div>
                                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">টেক্সট ও হেডিং স্লাইড</div>
                                  <div className="text-[10px] text-slate-400 leading-tight">টপিক ও মূল বিষয়ের সারসংক্ষেপ</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleAddNewSlide("IMAGE_COMPARE");
                                  setShowNewSlidePopover(false);
                                }}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 flex items-start gap-2.5 text-left transition cursor-pointer group shadow-xs"
                              >
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-cyan-600 text-white flex items-center justify-center text-sm shrink-0 shadow-xs">
                                  🖼️
                                </span>
                                <div>
                                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400">চিত্র / ডায়াগ্রাম তুলনা</div>
                                  <div className="text-[10px] text-slate-400 leading-tight">পাশাপাশি ২টি সার্কিট বা ডায়াগ্রাম</div>
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* CATEGORY 2: ইন্টারেক্টিভ ওয়ার্মআপ */}
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-black text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-wider">
                              <span className="w-6 h-6 rounded-lg bg-fuchsia-500/10 flex items-center justify-center text-sm">💬</span>
                              <span>২. ইন্টারেক্টিভ ওয়ার্মআপ (Interactive Warmup — No Timer)</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  handleAddNewSlide("WORD_CLOUD");
                                  setShowNewSlidePopover(false);
                                }}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-fuchsia-500 hover:bg-fuchsia-50/50 dark:hover:bg-fuchsia-950/30 flex flex-col gap-1.5 text-left transition cursor-pointer group shadow-xs"
                              >
                                <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-pink-600 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                                  ☁️
                                </span>
                                <div>
                                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400">ওয়ার্ড ক্লাউড</div>
                                  <div className="text-[9px] text-slate-400 leading-tight">শিক্ষার্থীদের লাইভ শব্দগুচ্ছ</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleAddNewSlide("OPEN_ENDED");
                                  setShowNewSlidePopover(false);
                                }}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 flex flex-col gap-1.5 text-left transition cursor-pointer group shadow-xs"
                              >
                                <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                                  💭
                                </span>
                                <div>
                                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400">মুক্ত মতামত</div>
                                  <div className="text-[9px] text-slate-400 leading-tight">উন্মুক্ত ভাবনা ও মন্তব্য</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleAddNewSlide("LIVE_QA");
                                  setShowNewSlidePopover(false);
                                }}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 flex flex-col gap-1.5 text-left transition cursor-pointer group shadow-xs"
                              >
                                <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                                  🙋
                                </span>
                                <div>
                                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">প্রশ্নোত্তর বোর্ড</div>
                                  <div className="text-[9px] text-slate-400 leading-tight">লাইভ স্টুডেন্ট প্রশ্নমঞ্চ</div>
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* CATEGORY 3: কুইজ প্রতিযোগিতা */}
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-amber-200/80 dark:border-amber-900/50 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                              <span className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-sm">🏆</span>
                              <span>৩. কুইজ প্রতিযোগিতা (Quiz Competition — Timer + Points)</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  handleAddNewSlide("MCQ");
                                  setShowNewSlidePopover(false);
                                }}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 flex items-start gap-2.5 text-left transition cursor-pointer group shadow-xs"
                              >
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center text-sm shrink-0 shadow-xs">
                                  🔘
                                </span>
                                <div>
                                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">MCQ (বহুনির্বাচনী প্রশ্ন)</div>
                                  <div className="text-[10px] text-slate-400 leading-tight">৪টি অপশন থেকে ১টি সঠিক উত্তর</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleAddNewSlide("FILL_BLANKS");
                                  setShowNewSlidePopover(false);
                                }}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 flex items-start gap-2.5 text-left transition cursor-pointer group shadow-xs"
                              >
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 text-white flex items-center justify-center text-sm shrink-0 shadow-xs">
                                  📝
                                </span>
                                <div>
                                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">শূন্যস্থান পূরণ (Fill in Blanks)</div>
                                  <div className="text-[10px] text-slate-400 leading-tight">ক্যাপসুল স্লটে সঠিক শব্দ বসানো</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleAddNewSlide("MATCHING");
                                  setShowNewSlidePopover(false);
                                }}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 flex items-start gap-2.5 text-left transition cursor-pointer group shadow-xs"
                              >
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-sm shrink-0 shadow-xs">
                                  🔗
                                </span>
                                <div>
                                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">ডান-বাম মিলকরণ (Matching)</div>
                                  <div className="text-[10px] text-slate-400 leading-tight">বাম ও ডান কলামের রঙিন ক্রস-লাইন</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleAddNewSlide("REORDER");
                                  setShowNewSlidePopover(false);
                                }}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 flex items-start gap-2.5 text-left transition cursor-pointer group shadow-xs"
                              >
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center text-sm shrink-0 shadow-xs">
                                  🔢
                                </span>
                                <div>
                                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400">ধারাবাহিক ক্রম সাজানো</div>
                                  <div className="text-[10px] text-slate-400 leading-tight">কাজের ধাপ ক্রমানুসারে সাজানো</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleAddNewSlide("TRUE_FALSE");
                                  setShowNewSlidePopover(false);
                                }}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-950/30 flex items-start gap-2.5 text-left transition cursor-pointer group shadow-xs sm:col-span-2"
                              >
                                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-600 text-white flex items-center justify-center text-sm shrink-0 shadow-xs">
                                  ⚖️
                                </span>
                                <div>
                                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400">সত্য / মিথ্যা (True / False)</div>
                                  <div className="text-[10px] text-slate-400 leading-tight">বিবৃতি যাচাই ও মূল্যায়ন</div>
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* CATEGORY 4: স্পেশাল লিডারবোর্ড স্লাইড (TASK 3) */}
                          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-amber-300 dark:border-amber-700/60 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                              <span className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-sm">🏆</span>
                              <span>৪. লিডারবোর্ড স্লাইড (Leaderboard — Host Controlled)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                handleAddNewSlide("LEADERBOARD");
                                setShowNewSlidePopover(false);
                              }}
                              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-600/60 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/40 flex items-start gap-2.5 text-left transition cursor-pointer group shadow-sm"
                            >
                              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white flex items-center justify-center text-base shrink-0 shadow-sm">
                                🏆
                              </span>
                              <div>
                                <div className="text-xs font-black text-amber-700 dark:text-amber-300 group-hover:text-amber-600 dark:group-hover:text-amber-200">
                                  🏆 লিডারবোর্ড স্লাইড (LEADERBOARD)
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                                  যেখানে খুশি বসান — হোস্ট স্লাইডে আসলেই স্টুডেন্টদের ফোনে লাইভ র‍্যাঙ্ক ও টপ ১০ ভেসে উঠবে!
                                </div>
                              </div>
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer border border-amber-200 dark:border-amber-800"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>✨ AI</span>
                </button>
              </div>

              {/* Vertical List of Compact 16:9 Slide Thumbnails */}
              <div className="space-y-2 flex-1">
                {currentDeck.slides.map((slide, idx) => {
                  const isSelected = slide.id === currentSlide.id;
                  const graded = isGradedQuiz(slide.type);

                  const getThumbStyles = (t: SlideType) => {
                    switch (t) {
                      case "LEADERBOARD":
                        return {
                          border: isSelected
                            ? "border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/70 dark:bg-amber-950/50"
                            : "border-amber-300 dark:border-amber-800 hover:border-amber-500",
                          badge: "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black",
                          label: "🏆 লিডারবোর্ড",
                        };
                      case "MCQ":
                        return {
                          border: isSelected ? "border-indigo-500 ring-2 ring-indigo-400/40 bg-indigo-50/70 dark:bg-indigo-950/50" : "border-indigo-200/80 dark:border-indigo-900/50 hover:border-indigo-400",
                          badge: "bg-indigo-600 text-white",
                          label: "MCQ",
                        };
                      case "MATCHING":
                        return {
                          border: isSelected ? "border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/70 dark:bg-emerald-950/50" : "border-emerald-200/80 dark:border-emerald-900/50 hover:border-emerald-400",
                          badge: "bg-emerald-600 text-white",
                          label: "মিলকরণ",
                        };
                      case "FILL_BLANKS":
                        return {
                          border: isSelected ? "border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/70 dark:bg-amber-950/50" : "border-amber-200/80 dark:border-amber-900/50 hover:border-amber-400",
                          badge: "bg-amber-500 text-slate-950 font-black",
                          label: "শূন্যস্থান",
                        };
                      case "REORDER":
                        return {
                          border: isSelected ? "border-rose-500 ring-2 ring-rose-400/40 bg-rose-50/70 dark:bg-rose-950/50" : "border-rose-200/80 dark:border-rose-900/50 hover:border-rose-400",
                          badge: "bg-rose-500 text-white",
                          label: "ক্রম",
                        };
                      case "TRUE_FALSE":
                        return {
                          border: isSelected ? "border-violet-500 ring-2 ring-violet-400/40 bg-violet-50/70 dark:bg-violet-950/50" : "border-violet-200/80 dark:border-violet-900/50 hover:border-violet-400",
                          badge: "bg-violet-600 text-white",
                          label: "সত্য/মিথ্যা",
                        };
                      case "WORD_CLOUD":
                        return {
                          border: isSelected ? "border-fuchsia-500 ring-2 ring-fuchsia-400/40 bg-fuchsia-50/70 dark:bg-fuchsia-950/50" : "border-fuchsia-200/80 dark:border-fuchsia-900/50 hover:border-fuchsia-400",
                          badge: "bg-fuchsia-600 text-white",
                          label: "ক্লাউড",
                        };
                      case "OPEN_ENDED":
                      case "LIVE_QA":
                        return {
                          border: isSelected ? "border-purple-500 ring-2 ring-purple-400/40 bg-purple-50/70 dark:bg-purple-950/50" : "border-purple-200/80 dark:border-purple-900/50 hover:border-purple-400",
                          badge: "bg-purple-600 text-white",
                          label: t === "LIVE_QA" ? "Q&A" : "মতামত",
                        };
                      default:
                        return {
                          border: isSelected ? "border-blue-500 ring-2 ring-blue-400/40 bg-blue-50/70 dark:bg-blue-950/50" : "border-slate-200 dark:border-slate-800 hover:border-blue-400",
                          badge: "bg-blue-600 text-white",
                          label: "কন্টেন্ট",
                        };
                    }
                  };

                  const thumbStyle = getThumbStyles(slide.type);

                  return (
                    <div
                      key={slide.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", String(idx));
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingIndex(idx);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverIndex !== idx) setDragOverIndex(idx);
                      }}
                      onDragLeave={() => {
                        if (dragOverIndex === idx) setDragOverIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIdx = Number(e.dataTransfer.getData("text/plain"));
                        if (!isNaN(fromIdx)) {
                          handleDropSlide(fromIdx, idx);
                        }
                      }}
                      onDragEnd={() => {
                        setDraggingIndex(null);
                        setDragOverIndex(null);
                      }}
                      onClick={() => setCurrentSlideId(slide.id)}
                      className={`group relative rounded-2xl border-2 p-2 transition-all cursor-grab active:cursor-grabbing flex flex-col justify-between aspect-16/10 shadow-xs ${dragOverIndex === idx
                        ? "border-indigo-500 scale-105 shadow-xl bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-400"
                        : draggingIndex === idx
                          ? "opacity-40 border-dashed border-indigo-400"
                          : thumbStyle.border
                        }`}
                    >
                      {/* Thumbnail Header */}
                      <div className="flex items-center justify-between text-[10px] font-black">
                        <span
                          className={`w-4 h-4 rounded-md flex items-center justify-center font-mono ${isSelected
                            ? "bg-slate-950 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                        >
                          {idx + 1}
                        </span>

                        <span className={`px-1.5 py-0.2 rounded-md font-mono text-[8px] font-black uppercase ${thumbStyle.badge}`}>
                          {thumbStyle.label}
                        </span>
                      </div>

                      {/* Title Preview */}
                      <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 line-clamp-2 my-auto leading-tight">
                        {slide.type === "LEADERBOARD"
                          ? "🏆 লিডারবোর্ড স্লাইড"
                          : slide.title.trim() || (
                            <span className="italic opacity-40 font-normal">খালি স্লাইড</span>
                          )}
                      </p>

                      {/* Footer: Timer or Points badge + Hover Actions */}
                      <div className="flex items-center justify-between pt-1 text-[9px]">
                        {graded ? (
                          <span className="text-amber-500 font-bold font-mono">
                            {slide.points}p • {slide.timeLimit}s
                          </span>
                        ) : slide.type === "LEADERBOARD" ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">🏆 লাইভ র‍্যাঙ্ক</span>
                        ) : (
                          <span className="text-slate-400 font-medium font-mono">কন্টেন্ট</span>
                        )}

                        {/* Move Up/Down & Delete */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => handleMoveSlide(idx, "up", e)}
                              className="p-0.5 rounded text-slate-400 hover:text-indigo-600"
                              title="উপরে নিন"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                          )}
                          {idx < currentDeck.slides.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleMoveSlide(idx, "down", e)}
                              className="p-0.5 rounded text-slate-400 hover:text-indigo-600"
                              title="নিচে নিন"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSlide(slide.id, e)}
                            className="p-0.5 rounded text-rose-400 hover:text-rose-600"
                            title="মুছুন"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* -----------------------------------------------------------------
                CENTER GIANT STAGE (flex-1 flex flex-col items-center justify-between p-6 lg:p-10)
                ----------------------------------------------------------------- */}
            <main className="flex-1 flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 overflow-y-auto relative scrollbar-thin">
              {/* TOP FLOATING CONTEXTUAL TOOLBAR (Replaces the bulky Right Column!) */}
              <div className="sticky top-0 z-30 mb-4 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center justify-center gap-3 max-w-3xl backdrop-blur-md">
                {/* 1. Slide Type Selector Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    স্লাইড টাইপ:
                  </span>
                  <select
                    value={currentSlide.type}
                    onChange={(e) => {
                      const newType = e.target.value as SlideType;
                      const graded = isGradedQuiz(newType);
                      updateCurrentSlide({
                        type: newType,
                        timeLimit: graded ? 30 : 0,
                        points: graded ? 100 : 0,
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black text-indigo-600 dark:text-indigo-300 focus:outline-none cursor-pointer"
                  >
                    <optgroup label="📄 কন্টেন্ট স্লাইড (No Timer)">
                      <option value="TEXT_SLIDE">📄 টেক্সট ও হেডিং স্লাইড</option>
                      <option value="IMAGE_COMPARE">🖼️ ইমেজ তুলনা স্লাইড</option>
                    </optgroup>
                    <optgroup label="💬 ইন্টারেক্টিভ ওপেন স্লাইড (No Timer)">
                      <option value="WORD_CLOUD">☁️ লাইভ ওয়ার্ড ক্লাউড</option>
                      <option value="OPEN_ENDED">💭 মুক্ত মতামত (Open Ended)</option>
                      <option value="LIVE_QA">🙋 লাইভ প্রশ্নোত্তর বোর্ড</option>
                    </optgroup>
                    <optgroup label="🏆 কুইজ প্রতিযোগিতা (Graded)">
                      <option value="MCQ">🔘 বহুনির্বাচনী প্রশ্ন (MCQ Single)</option>
                      <option value="FILL_BLANKS">📝 শূন্যস্থান পূরণ (Fill Blanks)</option>
                      <option value="MATCHING">🔗 ডান-বাম মিলকরণ (Matching)</option>
                      <option value="REORDER">🔢 ধারাবাহিক ক্রম সাজানো</option>
                      <option value="TRUE_FALSE">⚖️ সত্য / মিথ্যা (True/False)</option>
                    </optgroup>
                    <optgroup label="🏆 স্পেশাল স্লাইড">
                      <option value="LEADERBOARD">🏆 লাইভ লিডারবোর্ড স্লাইড</option>
                    </optgroup>
                  </select>
                </div>

                {/* STRICT CONDITIONAL TIMER & POINTS PILLS: ONLY SHOWN IF GRADED QUIZ! */}
                {isGradedQuiz(currentSlide.type) && (
                  <>
                    <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800" />

                    {/* Time Limit Pills */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black text-slate-400">⏱️ সময়:</span>
                      <div className="flex items-center gap-1">
                        {[15, 20, 30, 60].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => updateCurrentSlide({ timeLimit: t })}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition cursor-pointer border ${currentSlide.timeLimit === t
                              ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold"
                              : "bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-white"
                              }`}
                          >
                            {t}s
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800" />

                    {/* Points Pills */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black text-slate-400">⭐ পয়েন্ট:</span>
                      <div className="flex items-center gap-1">
                        {[50, 100, 200].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => updateCurrentSlide({ points: p })}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition cursor-pointer border ${currentSlide.points === p
                              ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                              : "bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-white"
                              }`}
                          >
                            {p}p
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Explanation Popover Button */}
                <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800" />
                <button
                  type="button"
                  onClick={() => setShowExplanationPopover(!showExplanationPopover)}
                  className={`px-2.5 py-1 rounded-xl border text-[11px] font-black transition flex items-center gap-1 cursor-pointer ${currentSlide.explanation
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700"
                    : "bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-indigo-500"
                    }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>💡 ব্যাখ্যা {currentSlide.explanation ? "(যুক্ত)" : ""}</span>
                </button>

                {/* TASK 3: On-Canvas "🪄 AI দিয়ে এই স্লাইডটি আপডেট করুন" Magic Button */}
                <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800" />
                <button
                  type="button"
                  onClick={() => setShowAiImprovePopover(!showAiImprovePopover)}
                  className={`px-3 py-1 rounded-xl border text-[11px] font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    showAiImprovePopover
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-indigo-600 shadow-indigo-500/20"
                      : "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  }`}
                  title="AI দিয়ে বর্তমান স্লাইডটি পরিমার্জন, রূপান্তর বা উন্নত করুন"
                >
                  {isAiImprovingSlide ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>🪄 AI আপডেট</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showAiImprovePopover ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Floating Explanation Popover Card */}
              <AnimatePresence>
                {showExplanationPopover && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full max-w-xl mb-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-2 z-20"
                  >
                    <div className="flex items-center justify-between text-xs font-black text-amber-500">
                      <span>💡 সঠিক উত্তরের ব্যাখ্যা বা শিক্ষকের নোট:</span>
                      <button
                        type="button"
                        onClick={() => setShowExplanationPopover(false)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={currentSlide.explanation || ""}
                      onChange={(e) => updateCurrentSlide({ explanation: e.target.value })}
                      placeholder="শিক্ষার্থীরা উত্তর দেওয়ার পর এই ব্যাখ্যা প্রদর্শিত হবে..."
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating AI Slide Improve Popover Card (TASK 3) */}
              <AnimatePresence>
                {showAiImprovePopover && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full max-w-2xl mb-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/40 shadow-2xl space-y-4 z-20"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-400">
                        <Wand2 className="w-4 h-4 text-amber-400" />
                        <span>🪄 এই স্লাইডটি AI দিয়ে পরিমার্জন ও রূপান্তর করুন</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAiImprovePopover(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    {/* 4 Quick 1-Click Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isAiImprovingSlide}
                        onClick={() => handleAiImproveCurrentSlide("beautify")}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-left transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-xs font-black text-slate-800 dark:text-slate-200">✨ ভাষা ও বিকল্প সুন্দর করো</div>
                          <div className="text-[10px] text-slate-400">বানান ও ব্যাকরণ নির্ভুল ও বাস্তবসম্মত করা</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={isAiImprovingSlide}
                        onClick={() => handleAiImproveCurrentSlide("harder")}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-left transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div>
                          <div className="text-xs font-black text-slate-800 dark:text-slate-200">🧠 আরেকটু মানসম্মত ও কঠিন করো</div>
                          <div className="text-[10px] text-slate-400">মুখস্থের বদলে ধারণাগত গভীর প্রশ্ন তৈরি</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={isAiImprovingSlide}
                        onClick={() => handleAiImproveCurrentSlide("explain")}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-left transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-xs font-black text-slate-800 dark:text-slate-200">💡 সঠিক উত্তরের ব্যাখ্যা তৈরি করো</div>
                          <div className="text-[10px] text-slate-400">শিক্ষার্থীদের জন্য সহজবোধ্য বিস্তারিত ব্যাখ্যা</div>
                        </div>
                      </button>

                      {/* Convert to another type dropdown */}
                      <div className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1.5 bg-slate-50 dark:bg-slate-950">
                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          🔀 অন্য ধরনে রূপান্তর:
                        </div>
                        <select
                          disabled={isAiImprovingSlide}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAiImproveCurrentSlide("convert", e.target.value as SlideType);
                              e.target.value = "";
                            }
                          }}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-black text-indigo-600 dark:text-indigo-400 cursor-pointer"
                        >
                          <option value="">নির্বাচন করুন</option>
                          <option value="MATCHING">🔗 MATCHING (মিলকরণ)</option>
                          <option value="FILL_BLANKS">📝 FILL_BLANKS (শূন্যস্থান)</option>
                          <option value="REORDER">🔢 REORDER (ধারাবাহিক ক্রম)</option>
                          <option value="TRUE_FALSE">⚖️ TRUE_FALSE (সত্য/মিথ্যা)</option>
                          <option value="MCQ">🔘 MCQ (বহুনির্বাচনী)</option>
                        </select>
                      </div>
                    </div>

                    {/* Custom prompt input */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>✍️ AI-কে বলুন এই স্লাইডে কী পরিবর্তন চান:</span>
                        {isAiImprovingSlide && (
                          <span className="text-[10px] text-indigo-500 font-bold flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> স্লাইড পরিমার্জন হচ্ছে...
                          </span>
                        )}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customAiSlidePrompt}
                          onChange={(e) => setCustomAiSlidePrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && customAiSlidePrompt.trim()) {
                              handleAiImproveCurrentSlide("custom", undefined, customAiSlidePrompt.trim());
                            }
                          }}
                          placeholder="যেমন: অপশনগুলো আরও সংক্ষিপ্ত করো অথবা বাস্তব জীবনের উদাহরণ দাও..."
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          disabled={isAiImprovingSlide || !customAiSlidePrompt.trim()}
                          onClick={() => handleAiImproveCurrentSlide("custom", undefined, customAiSlidePrompt.trim())}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          প্রয়োগ করুন
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ---------------------------------------------------------------
                  THE 16:9 INTERACTIVE STAGE CARD (w-full max-w-4xl min-h-[460px])
                  --------------------------------------------------------------- */}
              <div className="w-full max-w-4xl min-h-[480px] my-auto rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800/80 p-6 sm:p-10 flex flex-col justify-between relative transition-all">
                {/* 1. BLANK CUSTOM PROMPT TITLE (No prefilled questions!) */}
                <div className="space-y-1.5 pb-4">
                  <input
                    type="text"
                    value={currentSlide.title}
                    onChange={(e) => updateCurrentSlide({ title: e.target.value })}
                    placeholder="এখানে আপনার প্রশ্ন বা আলোচনার বিষয় লিখুন..."
                    className="w-full text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 bg-transparent border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition py-2 leading-relaxed text-center sm:text-left"
                  />
                </div>

                {/* 2. DIRECT ON-CANVAS EDITING BY TYPE */}
                <div className="flex-1 flex flex-col justify-center py-4">
                  {/* TYPE: MCQ Single */}
                  {currentSlide.type === "MCQ" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {currentSlide.options.map((opt, optIdx) => {
                          const isCorrect = currentSlide.correctAnswer === optIdx;
                          const shapeIcons = ["▲", "◆", "●", "■"];

                          return (
                            <div
                              key={optIdx}
                              className={`p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 relative shadow-sm ${isCorrect
                                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-400/40"
                                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                }`}
                            >
                              {/* Correct Answer Circular Toggle (Click to mark Green Correct) */}
                              <button
                                type="button"
                                onClick={() => updateCurrentSlide({ correctAnswer: optIdx })}
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-transform active:scale-95 cursor-pointer ${isCorrect
                                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700"
                                  }`}
                                title="সঠিক উত্তর হিসেবে চিহ্নিত করুন"
                              >
                                {isCorrect ? (
                                  <Check className="w-4 h-4 stroke-[3]" />
                                ) : (
                                  shapeIcons[optIdx % 4]
                                )}
                              </button>

                              {/* In-line Editable Option Input */}
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...currentSlide.options];
                                  updated[optIdx] = e.target.value;
                                  updateCurrentSlide({ options: updated });
                                }}
                                placeholder={`অপশন ${optIdx + 1} লিখুন...`}
                                className="bg-transparent text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none w-full"
                              />

                              {/* Delete Option */}
                              {currentSlide.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = currentSlide.options.filter((_, i) => i !== optIdx);
                                    updateCurrentSlide({
                                      options: updated,
                                      correctAnswer: Math.min(
                                        Number(currentSlide.correctAnswer),
                                        updated.length - 1
                                      ),
                                    });
                                  }}
                                  className="text-slate-400 hover:text-rose-500 p-1 transition cursor-pointer"
                                  title="অপশন মুছুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Option Button */}
                      {currentSlide.options.length < 6 && (
                        <button
                          type="button"
                          onClick={() => {
                            updateCurrentSlide({
                              options: [...currentSlide.options, `নতুন অপশন`],
                            });
                          }}
                          className="py-2 px-4 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-bold transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ অপশন যোগ করুন</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* TYPE: True / False */}
                  {currentSlide.type === "TRUE_FALSE" && (
                    <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto w-full py-4">
                      <button
                        type="button"
                        onClick={() => updateCurrentSlide({ correctAnswer: true })}
                        className={`p-6 sm:p-8 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${currentSlide.correctAnswer === true
                          ? "bg-emerald-500 text-white border-emerald-400 shadow-xl shadow-emerald-500/30 scale-102"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                          }`}
                      >
                        <CheckCircle2 className="w-10 h-10" />
                        <span className="text-base sm:text-lg font-black">সত্য (True)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateCurrentSlide({ correctAnswer: false })}
                        className={`p-6 sm:p-8 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${currentSlide.correctAnswer === false
                          ? "bg-rose-500 text-white border-rose-400 shadow-xl shadow-rose-500/30 scale-102"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                          }`}
                      >
                        <X className="w-10 h-10 stroke-[3]" />
                        <span className="text-base sm:text-lg font-black">মিথ্যা (False)</span>
                      </button>
                    </div>
                  )}

                  {/* TYPE: Fill in Blanks */}
                  {currentSlide.type === "FILL_BLANKS" && (
                    <div className="space-y-4 max-w-2xl mx-auto w-full">
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                            <span>📝</span>
                            <span>ক্যাপসুল ব্ল্যাঙ্ক বাক্য (Sentence with Capsule Blanks):</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              const cur = currentSlide.content || "";
                              updateCurrentSlide({ content: cur ? `${cur} ___` : "___" });
                            }}
                            className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-black transition flex items-center gap-1 cursor-pointer active:scale-95"
                            title="বাক্যের শেষে শূন্যস্থান কোড যোগ করুন"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>[ ___ শূন্যস্থান যোগ করুন ]</span>
                          </button>
                        </div>

                        <input
                          type="text"
                          value={currentSlide.content || ""}
                          onChange={(e) => updateCurrentSlide({ content: e.target.value })}
                          placeholder="বাক্যে শূন্যস্থান বোঝাতে '___' ব্যবহার করুন (যেমন: IPv4 এড্রেস সাধারণত ___ বিট।)"
                          className="w-full text-sm font-bold text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none border-b-2 border-indigo-400 pb-1.5 leading-relaxed"
                        />

                        {/* Interactive Capsule Slot Live Preview */}
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
                            ✨ স্টুডেন্ট স্ক্রিন ক্যাপসুল লাইভ প্রিভিউ:
                          </span>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed flex flex-wrap items-center gap-1.5">
                            {(currentSlide.content || "বাক্য লিখুন এবং ___ যোগ করুন").split(/(___+)/g).map((seg, sIdx) => {
                              if (seg.startsWith("___")) {
                                return (
                                  <span
                                    key={sIdx}
                                    className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/20 border-2 border-dashed border-amber-400 text-amber-700 dark:text-amber-300 font-black text-xs shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse"
                                  >
                                    [ ক্যাপসুল স্লট: {currentSlide.acceptedAnswers?.[0] || "সঠিক উত্তর"} ]
                                  </span>
                                );
                              }
                              return <span key={sIdx}>{seg}</span>;
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Correct Answers / Accepted Words & Word Bank Hints */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                          <label className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                            🎯 সঠিক উত্তর (Capsule Word) — কমা দিয়ে একাধিক:
                          </label>
                          <input
                            type="text"
                            value={(currentSlide.acceptedAnswers || []).join(", ")}
                            onChange={(e) =>
                              updateCurrentSlide({
                                acceptedAnswers: e.target.value.split(",").map((s) => s.trim()),
                                correctAnswer: e.target.value.split(",")[0]?.trim() || "",
                              })
                            }
                            placeholder="যেমন: ৩২, 32, ৩২ বিট"
                            className="w-full text-xs font-black text-emerald-800 dark:text-emerald-200 bg-transparent focus:outline-none border-b border-emerald-400/60 pb-1"
                          />
                        </div>

                        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-1.5">
                          <label className="text-[11px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                            💡 ঐচ্ছিক শব্দ-ব্যাংক (Word Bank Hints):
                          </label>
                          <input
                            type="text"
                            value={(currentSlide.options || []).join(", ")}
                            onChange={(e) =>
                              updateCurrentSlide({
                                options: e.target.value.split(",").map((s) => s.trim()),
                              })
                            }
                            placeholder="যেমন: ১৬, ৩২, ৬৪, ১২৮"
                            className="w-full text-xs font-black text-indigo-800 dark:text-indigo-200 bg-transparent focus:outline-none border-b border-indigo-400/60 pb-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TYPE: Matching Pairs */}
                  {currentSlide.type === "MATCHING" && (
                    <div className="space-y-3.5 max-w-2xl mx-auto w-full">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span>🔗</span>
                          <span>বাম পাশ ↔ ডান পাশ মিলকরণ জোড়াসমূহ (Cross-Line Pairs):</span>
                        </span>
                        <span className="text-[10px] text-slate-400">স্টুডেন্ট স্ক্রিনে রঙিন লাইন টেনে মিল করতে হবে</span>
                      </div>

                      <div className="space-y-2.5">
                        {(currentSlide.pairs || []).map((pair, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs"
                          >
                            <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                              {pIdx + 1}
                            </span>
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                value={pair.left}
                                onChange={(e) => {
                                  const newPairs = [...(currentSlide.pairs || [])];
                                  newPairs[pIdx].left = e.target.value;
                                  updateCurrentSlide({ pairs: newPairs });
                                }}
                                placeholder={`বাম পাশের বিষয় ${pIdx + 1}`}
                                className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                              />
                              <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0" />
                              <input
                                type="text"
                                value={pair.right}
                                onChange={(e) => {
                                  const newPairs = [...(currentSlide.pairs || [])];
                                  newPairs[pIdx].right = e.target.value;
                                  updateCurrentSlide({ pairs: newPairs });
                                }}
                                placeholder={`ডান পাশের সঠিক মিল ${pIdx + 1}`}
                                className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-900/60 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                            {(currentSlide.pairs || []).length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newPairs = (currentSlide.pairs || []).filter((_, i) => i !== pIdx);
                                  updateCurrentSlide({ pairs: newPairs });
                                }}
                                className="text-slate-400 hover:text-rose-500 p-1.5 transition cursor-pointer"
                                title="জোড়া মুছুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newPairs = [...(currentSlide.pairs || []), { left: "", right: "" }];
                          updateCurrentSlide({ pairs: newPairs });
                        }}
                        className="py-2 px-4 rounded-xl border border-dashed border-emerald-400 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ নতুন জোড়া যোগ করুন</span>
                      </button>
                    </div>
                  )}

                  {/* TYPE: Reorder Sequence */}
                  {currentSlide.type === "REORDER" && (
                    <div className="space-y-3.5 max-w-2xl mx-auto w-full">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span>🔢</span>
                          <span>সঠিক ধারাবাহিক ক্রম অনুযায়ী ধাপগুলো সাজান:</span>
                        </span>
                        <span className="text-[10px] text-slate-400">স্টুডেন্ট স্ক্রিনে এলোমেলো হয়ে যাবে</span>
                      </div>

                      <div className="space-y-2">
                        {(currentSlide.items || []).map((step, sIdx) => {
                          const totalSteps = (currentSlide.items || []).length;
                          return (
                            <div
                              key={sIdx}
                              className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs"
                            >
                              <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 font-mono font-black text-xs flex items-center justify-center shrink-0">
                                {sIdx + 1}
                              </span>

                              <input
                                type="text"
                                value={step}
                                onChange={(e) => {
                                  const newItems = [...(currentSlide.items || [])];
                                  newItems[sIdx] = e.target.value;
                                  updateCurrentSlide({ items: newItems });
                                }}
                                placeholder={`ধাপ ${sIdx + 1} লিখুন...`}
                                className="flex-1 bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                              />

                              {/* Up / Down Swap Buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={sIdx === 0}
                                  onClick={() => {
                                    if (sIdx > 0) {
                                      const newItems = [...(currentSlide.items || [])];
                                      const tmp = newItems[sIdx];
                                      newItems[sIdx] = newItems[sIdx - 1];
                                      newItems[sIdx - 1] = tmp;
                                      updateCurrentSlide({ items: newItems });
                                    }
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                  title="উপরে নিন"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={sIdx === totalSteps - 1}
                                  onClick={() => {
                                    if (sIdx < totalSteps - 1) {
                                      const newItems = [...(currentSlide.items || [])];
                                      const tmp = newItems[sIdx];
                                      newItems[sIdx] = newItems[sIdx + 1];
                                      newItems[sIdx + 1] = tmp;
                                      updateCurrentSlide({ items: newItems });
                                    }
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                  title="নিচে নিন"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {totalSteps > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newItems = (currentSlide.items || []).filter((_, i) => i !== sIdx);
                                    updateCurrentSlide({ items: newItems });
                                  }}
                                  className="text-slate-400 hover:text-rose-500 p-1 transition cursor-pointer"
                                  title="ধাপ মুছুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newItems = [...(currentSlide.items || []), `নতুন ধাপ`];
                          updateCurrentSlide({ items: newItems });
                        }}
                        className="py-2 px-4 rounded-xl border border-dashed border-rose-400 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ নতুন ধাপ যোগ করুন</span>
                      </button>
                    </div>
                  )}

                  {/* TYPE: Word Cloud (Super-Colorful Dynamic Kinetic Preview) */}
                  {currentSlide.type === "WORD_CLOUD" && (
                    <div className="p-8 rounded-3xl bg-slate-950/80 border-2 border-fuchsia-500/30 text-center space-y-5 shadow-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <span className="text-xs font-black text-fuchsia-400 uppercase tracking-widest flex items-center gap-1.5">
                          <span>☁️</span>
                          <span>লাইভ কাইনেটিক ওয়ার্ড ক্লাউড প্রিভিউ (Super-Colorful Kinetic Word Cloud)</span>
                        </span>
                        <span className="text-[10px] text-slate-400">শব্দের পুনরাবৃত্তি অনুযায়ী ফন্ট স্কেলিং</span>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 max-w-2xl mx-auto py-4 min-h-[160px]">
                        {[
                          { word: "প্রযুক্তি", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30", size: "text-3xl sm:text-4xl font-black" },
                          { word: "স্মার্ট", color: "text-rose-400 bg-rose-500/10 border-rose-500/30", size: "text-2xl sm:text-3xl font-extrabold" },
                          { word: "অটোমেশন", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", size: "text-4xl sm:text-5xl font-black" },
                          { word: "উদ্ভাবন", color: "text-amber-300 bg-amber-500/10 border-amber-500/30", size: "text-xl sm:text-2xl font-bold" },
                          { word: "আইওটি", color: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30", size: "text-3xl sm:text-4xl font-extrabold" },
                          { word: "নিরাপত্তা", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30", size: "text-2xl font-bold" },
                          { word: "ক্লাউড", color: "text-indigo-300 bg-indigo-500/15 border-indigo-400/30", size: "text-3xl font-black" },
                        ].map((item, i) => (
                          <motion.span
                            key={i}
                            animate={{ y: [0, -5, 0], scale: [1, 1.03, 1] }}
                            transition={{ repeat: Infinity, duration: 2.5 + (i % 3) * 0.5, ease: "easeInOut" }}
                            className={`px-4 py-2 rounded-2xl border ${item.color} ${item.size} shadow-lg cursor-default transition-transform hover:scale-110`}
                          >
                            {item.word}
                          </motion.span>
                        ))}
                      </div>

                      <p className="text-xs text-slate-400 max-w-lg mx-auto">
                        লাইভ প্রেজেন্টেশনে শিক্ষার্থীরা তাদের মোবাইল ডিভাইস থেকে শব্দ সাবমিট করামাত্রই শব্দগুলো উজ্জ্বল রঙ ও বাউন্স অ্যানিমেশনে স্বয়ংক্রিয়ভাবে ভাসবে।
                      </p>
                    </div>
                  )}

                  {/* TYPE: Open Ended / Live Q&A */}
                  {(currentSlide.type === "OPEN_ENDED" || currentSlide.type === "LIVE_QA") && (
                    <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                      <span className="text-xs font-black text-amber-500 uppercase tracking-widest block">
                        💬 মুক্ত মতামত ও রেসপন্স ওয়াল
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        শিক্ষার্থীরা তাদের ফোন থেকে সরাসরি বিস্তারিত মতামত বা শিক্ষককে প্রশ্ন পাঠাবে, যা রিয়েল-টাইমে এই ক্যানভাসে পিন হয়ে প্রদর্শিত হবে।
                      </p>
                    </div>
                  )}

                  {/* TYPE: Text Slide */}
                  {currentSlide.type === "TEXT_SLIDE" && (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                        স্লাইডের মূল বডি বা বিষয়বস্তু:
                      </label>
                      <textarea
                        rows={5}
                        value={currentSlide.content || ""}
                        onChange={(e) => updateCurrentSlide({ content: e.target.value })}
                        placeholder="এখানে আপনার পাঠের সারসংক্ষেপ, তথ্য বা বুলেট পয়েন্ট লিখুন..."
                        className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none leading-relaxed"
                      />
                    </div>
                  )}

                  {/* TYPE: Image Compare */}
                  {currentSlide.type === "IMAGE_COMPARE" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Left Image Box */}
                      <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2 flex flex-col items-center justify-center min-h-[180px] relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                        {currentSlide.imageLeftUrl ? (
                          <div className="relative w-full h-full flex flex-col items-center">
                            <img
                              src={currentSlide.imageLeftUrl}
                              alt="Left comparison"
                              className="max-h-36 rounded-xl object-contain shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => updateCurrentSlide({ imageLeftUrl: undefined })}
                              className="mt-2 text-rose-500 hover:text-rose-600 text-xs font-bold underline cursor-pointer"
                            >
                              🗑️ ছবি মুছুন
                            </button>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500">বাম পাশের চিত্র (ডায়াগ্রাম ১)</span>
                            <label className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold cursor-pointer transition border border-indigo-200 dark:border-indigo-800">
                              📷 ছবি আপলোড করুন
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const compressed = await compressImageFile(file);
                                    updateCurrentSlide({ imageLeftUrl: compressed });
                                    showToast("ছবি অটো-কম্প্রেস করে যুক্ত হয়েছে!", "success");
                                  }
                                }}
                              />
                            </label>
                          </>
                        )}
                      </div>

                      {/* Right Image Box */}
                      <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2 flex flex-col items-center justify-center min-h-[180px] relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                        {currentSlide.imageRightUrl ? (
                          <div className="relative w-full h-full flex flex-col items-center">
                            <img
                              src={currentSlide.imageRightUrl}
                              alt="Right comparison"
                              className="max-h-36 rounded-xl object-contain shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => updateCurrentSlide({ imageRightUrl: undefined })}
                              className="mt-2 text-rose-500 hover:text-rose-600 text-xs font-bold underline cursor-pointer"
                            >
                              🗑️ ছবি মুছুন
                            </button>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500">ডান পাশের চিত্র (ডায়াগ্রাম ২)</span>
                            <label className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold cursor-pointer transition border border-indigo-200 dark:border-indigo-800">
                              📷 ছবি আপলোড করুন
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const compressed = await compressImageFile(file);
                                    updateCurrentSlide({ imageRightUrl: compressed });
                                    showToast("ছবি অটো-কম্প্রেস করে যুক্ত হয়েছে!", "success");
                                  }
                                }}
                              />
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TYPE: Leaderboard Slide (TASK 3) */}
                  {currentSlide.type === "LEADERBOARD" && (
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border-2 border-amber-400/40 text-center space-y-6">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black text-xs uppercase tracking-wider border border-amber-400/40">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>লাইভ কুইজ লিডারবোর্ড স্লাইড (Host-Gated)</span>
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                          🏆 শীর্ষ মেধাতালিকা ও লাইভ র‍্যাংকিং
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                          হোস্ট যখন এই স্লাইডে আসবেন, স্বয়ংক্রিয়ভাবে প্রজেক্টরে অ্যানিমেটেড পোডিয়াম এবং স্টুডেন্টদের ফোনে তাদের ব্যক্তিগত র‍্যাঙ্ক ও টপ ১০ স্কোরার ভেসে উঠবে।
                        </p>
                      </div>

                      {/* Mock Preview Podium */}
                      <div className="flex items-end justify-center gap-3 pt-2">
                        <div className="w-24 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-center space-y-1 h-28 flex flex-col justify-end border border-slate-200 dark:border-slate-700">
                          <div className="text-xl">🥈</div>
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">২য় স্থান</div>
                          <div className="text-[10px] text-amber-500 font-mono font-bold">২৮০ pt</div>
                        </div>
                        <div className="w-28 p-3 rounded-2xl bg-amber-500/20 text-center space-y-1 h-36 flex flex-col justify-end border-2 border-amber-400 shadow-lg">
                          <div className="text-3xl">👑</div>
                          <div className="text-xs font-black text-amber-700 dark:text-amber-300">১ম স্থান</div>
                          <div className="text-[11px] text-amber-600 font-mono font-black">৩৫০ pt</div>
                        </div>
                        <div className="w-24 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-center space-y-1 h-24 flex flex-col justify-end border border-slate-200 dark:border-slate-700">
                          <div className="text-xl">🥉</div>
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">৩য় স্থান</div>
                          <div className="text-[10px] text-amber-500 font-mono font-bold">২৫০ pt</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Stage Card Footer Info */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>
                    স্লাইড {currentDeck.slides.findIndex((s) => s.id === currentSlide.id) + 1} /{" "}
                    {currentDeck.slides.length}
                  </span>
                  <span>
                    {isGradedQuiz(currentSlide.type) ? "🏆 পয়েন্টযুক্ত প্রশ্ন" : "📄 কন্টেন্ট স্লাইড"}
                  </span>
                </div>
              </div>
            </main>

            {/* Mobile Horizontal Bottom Slide Bar (< 768px) */}
            <div className="flex md:hidden w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-2 items-center gap-2 overflow-x-auto shrink-0 z-30 shadow-md">
              <button
                type="button"
                onClick={() => setShowNewSlidePopover(true)}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black shrink-0 flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ স্লাইড</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAiModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-[11px] font-black shrink-0 flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI</span>
              </button>
              {currentDeck.slides.map((s, idx) => {
                const isSelected = s.id === currentSlideId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentSlideId(s.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <span className="font-mono font-black">{idx + 1}.</span>
                    <span className="max-w-[80px] truncate">{s.title || "স্লাইড"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===================================================================
              SLIDE-OVER SETTINGS DRAWER (Task 3: 0px permanent space!)
              =================================================================== */}
          <AnimatePresence>
            {isSettingsDrawerOpen && (
              <div className="fixed inset-0 z-50 flex justify-end">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSettingsDrawerOpen(false)}
                  className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
                />

                {/* Drawer Panel */}
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
                >
                  <div className="space-y-6">
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                          কুইজ ও সেশন সেটিংস
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSettingsDrawerOpen(false)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Section 0: Central Academic Mapping (Task 1) */}
                    <div className="space-y-3.5 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>সেন্ট্রাল একাডেমিক ম্যাপিং</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                          BTEB Global
                        </span>
                      </div>

                      {/* 1. Class */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          শ্রেণি নির্বাচন (Class):
                        </label>
                        <select
                          value={String(currentDeck.classId || "4")}
                          onChange={(e) => handleStudioClassChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {ACADEMIC_CLASSES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nameBangla}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Class-Wise Trade */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          ট্রেড / বিভাগ (Trade):
                        </label>
                        <select
                          value={String(currentDeck.tradeId || "")}
                          onChange={(e) => handleStudioTradeChange(e.target.value)}
                          disabled={!doesClassHaveTrade(currentDeck.classId || "4")}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                        >
                          {!doesClassHaveTrade(currentDeck.classId || "4") ? (
                            <option value="">সাধারণ পাঠ্যক্রম (ট্রেড নেই)</option>
                          ) : (
                            getApplicableTradesForClass(currentDeck.classId || "4").map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.nameBangla} ({t.code})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* 3. Mapped Subject */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          ম্যাপড বিষয় (Mapped Subject):
                        </label>
                        <select
                          value={String(currentDeck.subjectId || "")}
                          onChange={(e) => handleStudioSubjectChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {studioSubjects.length === 0 ? (
                            <option value="">কোনো বিষয় ম্যাপিং পাওয়া যায়নি</option>
                          ) : (
                            studioSubjects.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.code})
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Section 1: Participation & Engagement Toggles */}
                    <div className="space-y-3.5">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                        অংশগ্রহণ ও এনগেজমেন্ট অপশন
                      </span>

                      {[
                        {
                          key: "liveChatEnabled",
                          label: "লাইভ চ্যাট সক্রিয় রাখুন",
                          desc: "শিক্ষার্থীরা প্রশ্ন চলাকালীন মন্তব্য করতে পারবে",
                        },
                        {
                          key: "reactionsEnabled",
                          label: "ইমোজি রিঅ্যাকশন সক্রিয়",
                          desc: "স্ক্রিনে ভাসমান হার্ট ও ফায়ার ইমোজি পাঠাতে পারবে",
                        },
                        {
                          key: "showCorrectOnWrong",
                          label: "ভুল উত্তরে সঠিকটি প্রদর্শন",
                          desc: "উত্তর লকের পর সঠিক উত্তর ও ব্যাখ্যা দেখাবে",
                        },
                        {
                          key: "showLeaderboard",
                          label: "প্রতি প্রশ্নের পর লিডারবোর্ড",
                          desc: "সর্বোচ্চ স্কোরধারী শিক্ষার্থীদের র‍্যাঙ্কিং দেখাবে",
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                              {item.label}
                            </p>
                            <p className="text-[10px] text-slate-500">{item.desc}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setDeckSettings((prev: any) => ({
                                ...prev,
                                [item.key]: !prev[item.key],
                              }))
                            }
                            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${(deckSettings as any)[item.key] ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                              }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${(deckSettings as any)[item.key] ? "left-5" : "left-0.5"
                                }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Section 2: Scheduled Start Time */}
                    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-black text-amber-500 uppercase tracking-wider block flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>⏰ নির্দিষ্ট সময়ে অটো-স্টার্ট শিডিউল</span>
                      </span>

                      <input
                        type="datetime-local"
                        value={deckSettings.scheduledStartTime}
                        onChange={(e) =>
                          setDeckSettings((prev) => ({
                            ...prev,
                            scheduledStartTime: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                      />

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const in5 = new Date(Date.now() + 5 * 60000);
                            in5.setSeconds(0, 0);
                            const localIso = new Date(in5.getTime() - in5.getTimezoneOffset() * 60000)
                              .toISOString()
                              .slice(0, 16);
                            setDeckSettings((prev) => ({
                              ...prev,
                              scheduledStartTime: localIso,
                            }));
                            showToast("৫ মিনিট পর অটো-স্টার্ট সেট হয়েছে", "info");
                          }}
                          className="flex-1 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                        >
                          +৫ মিনিট
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const in15 = new Date(Date.now() + 15 * 60000);
                            in15.setSeconds(0, 0);
                            const localIso = new Date(in15.getTime() - in15.getTimezoneOffset() * 60000)
                              .toISOString()
                              .slice(0, 16);
                            setDeckSettings((prev) => ({
                              ...prev,
                              scheduledStartTime: localIso,
                            }));
                            showToast("১৫ মিনিট পর অটো-স্টার্ট সেট হয়েছে", "info");
                          }}
                          className="flex-1 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                        >
                          +১৫ মিনিট
                        </button>
                        {deckSettings.scheduledStartTime && (
                          <button
                            type="button"
                            onClick={() =>
                              setDeckSettings((prev) => ({
                                ...prev,
                                scheduledStartTime: "",
                              }))
                            }
                            className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                            title="মুছে ফেলুন"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Section: Leaderboard Display Mode (TASK 3) */}
                    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-black text-amber-500 uppercase tracking-wider block flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        <span>🏆 লিডারবোর্ড প্রদর্শনের নিয়ম</span>
                      </span>
                      <p className="text-[10px] text-slate-500">
                        শিক্ষার্থীদের স্ক্রিনে ও প্রজেক্টরে লিডারবোর্ড কখন দৃশ্যমান হবে তা নির্ধারণ করুন:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDeckSettings((prev: any) => ({
                              ...prev,
                              leaderboardMode: "after_every",
                            }));
                            showToast("⚡ প্রতিটি প্রশ্নের পর অটো-লিডারবোর্ড সক্রিয়", "success");
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition cursor-pointer ${(deckSettings as any).leaderboardMode === "after_every"
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                        >
                          <div>
                            <div className="font-black">⚡ প্রতিটি প্রশ্নের পর অটোমেটিক লিডারবোর্ড দেখান</div>
                            <div className="text-[10px] opacity-75">প্রতিটি প্রশ্ন শেষেই স্বয়ংক্রিয়ভাবে লিডারবোর্ড পপআপ হবে</div>
                          </div>
                          {(deckSettings as any).leaderboardMode === "after_every" && <Check className="w-4 h-4 text-amber-500" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeckSettings((prev: any) => ({
                              ...prev,
                              leaderboardMode: "manual",
                            }));
                            showToast("🎯 শুধুমাত্র নির্ধারিত লিডারবোর্ড স্লাইডে দেখানোর নিয়ম সক্রিয়", "info");
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition cursor-pointer ${(deckSettings as any).leaderboardMode !== "after_every"
                            ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                        >
                          <div>
                            <div className="font-black">🎯 শুধুমাত্র নির্ধারিত লিডারবোর্ড স্লাইডে দেখান</div>
                            <div className="text-[10px] opacity-75">শুধুমাত্র যখন আপনি LEADERBOARD স্লাইডে যাবেন তখনই দেখাবে</div>
                          </div>
                          {(deckSettings as any).leaderboardMode !== "after_every" && <Check className="w-4 h-4 text-indigo-500" />}
                        </button>
                      </div>
                    </div>

                    {/* Section 3: Configurable Auto-Funny & Praise SMS Engine (Task 2) */}
                    <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-cyan-500" />
                          <span>📲 অটো-মোটিভেশনাল ও ফলাফল SMS</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-bold border border-cyan-500/20">
                          BTEB Gateway
                        </span>
                      </div>

                      {/* 1. Milestone Interval Pills */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          অটোমেটিক SMS ইন্টারভ্যাল (Auto-SMS Milestone):
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { key: "off", label: "🚫 বন্ধ (Off)" },
                            { key: "every_3", label: "3️⃣ প্রতি ৩ প্রশ্ন পর" },
                            { key: "every_5", label: "5️⃣ প্রতি ৫ প্রশ্ন পর" },
                            { key: "every_10", label: "🔟 প্রতি ১০ প্রশ্ন পর" },
                          ].map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setDeckSettings((prev) => ({ ...prev, autoSmsMilestone: item.key as any }))}
                              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition text-left border ${deckSettings.autoSmsMilestone === item.key
                                ? "bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-300 font-black shadow-xs"
                                : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                                }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeckSettings((prev) => ({ ...prev, autoSmsMilestone: "end_quiz" }))}
                          className={`w-full py-1.5 px-3 rounded-xl text-[11px] font-bold transition text-left border ${deckSettings.autoSmsMilestone === "end_quiz"
                            ? "bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-300 font-black shadow-xs"
                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                            }`}
                        >
                          🏁 শুধুমাত্র কুইজ শেষে ফাইনাল রেজাল্ট SMS
                        </button>
                      </div>

                      {deckSettings.autoSmsMilestone !== "off" && (
                        <>
                          {/* 2. Recipient Selector */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              প্রাপক নির্বাচন (Recipient):
                            </label>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { key: "student", label: "📱 শিক্ষার্থী" },
                                { key: "guardian", label: "👨‍👩‍👦 অভিভাবক" },
                                { key: "both", label: "✨ উভয়ই" },
                              ].map((rec) => (
                                <button
                                  key={rec.key}
                                  type="button"
                                  onClick={() => setDeckSettings((prev) => ({ ...prev, smsRecipient: rec.key as any }))}
                                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition text-center border ${deckSettings.smsRecipient === rec.key
                                    ? "bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-300 font-black"
                                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
                                    }`}
                                >
                                  {rec.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 3. Message Mode Toggles */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              মেসেজের ধরন ও অটো-ফিল্টার:
                            </label>

                            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                😂 খারাপ করলে ফানি ও অনুপ্রেরণামূলক SMS (&lt; ৫০%)
                              </span>
                              <input
                                type="checkbox"
                                checked={deckSettings.smsFunnyMode}
                                onChange={(e) => setDeckSettings((prev) => ({ ...prev, smsFunnyMode: e.target.checked }))}
                                className="w-4 h-4 accent-amber-500 rounded"
                              />
                            </label>

                            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                🌟 ভালো করলে প্রশংসা ও অভিনন্দন SMS (≥ ৮০%)
                              </span>
                              <input
                                type="checkbox"
                                checked={deckSettings.smsPraiseMode}
                                onChange={(e) => setDeckSettings((prev) => ({ ...prev, smsPraiseMode: e.target.checked }))}
                                className="w-4 h-4 accent-emerald-500 rounded"
                              />
                            </label>
                          </div>

                          {/* 4. Template Preview & Customization */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                              <span>বাংলা টেমপ্লেট কাস্টমাইজেশন:</span>
                              <span className="text-[10px] text-slate-400 font-mono">{"{student_name}"}, {"{accuracy}"}</span>
                            </label>

                            {deckSettings.smsFunnyMode && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-amber-500">😂 ফানি/অনুপ্রেরণামূলক মেসেজ টেমপ্লেট:</span>
                                <textarea
                                  rows={2}
                                  value={deckSettings.customFunnyTemplate}
                                  onChange={(e) => setDeckSettings((prev) => ({ ...prev, customFunnyTemplate: e.target.value }))}
                                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-sans text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-400"
                                />
                              </div>
                            )}

                            {deckSettings.smsPraiseMode && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-emerald-500">🌟 প্রশংসা মেসেজ টেমপ্লেট:</span>
                                <textarea
                                  rows={2}
                                  value={deckSettings.customPraiseTemplate}
                                  onChange={(e) => setDeckSettings((prev) => ({ ...prev, customPraiseTemplate: e.target.value }))}
                                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-sans text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-400"
                                />
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Drawer Footer */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsDrawerOpen(false);
                        showToast("সেটিংস সংরক্ষিত হয়েছে", "success");
                      }}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
                    >
                      সম্পন্ন করুন
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* =======================================================================
          SMART CENTRAL BOOK & PDF AI STUDIO MODAL (PHASE 2 & MAPPING CASCADE)
          ======================================================================= */}
      {showAiModal && (
        <SmartAiSlideGeneratorModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          onInsertSlides={handleInsertAiSlides}
          activeTrade={currentDeck.trade}
          activeClass={String(currentDeck.classId || "")}
          activeClassId={String(currentDeck.classId || "")}
          activeTradeId={currentDeck.tradeId}
          activeSubject={currentDeck.subjectName}
          activeSubjectId={currentDeck.subjectId}
          activeSubjectCode={currentDeck.subjectCode}
          existingSlides={currentDeck.slides}
          activeSlideId={currentSlideId}
        />
      )}

      {/* =======================================================================
          DUAL-DEVICE INTERACTIVE PREVIEW MODAL (PHASE 3 TASK 2)
          ======================================================================= */}
      {showDualDevicePreview && (
        <DualDeviceInteractivePreviewModal
          isOpen={showDualDevicePreview}
          onClose={() => setShowDualDevicePreview(false)}
          slides={currentDeck.slides}
          initialSlideIndex={currentDeck.slides.findIndex((s) => s.id === currentSlideId)}
          deckTitle={currentDeck.title}
          tradeName={currentDeck.trade}
          classId={currentDeck.classId}
          tradeId={currentDeck.tradeId}
        />
      )}

      {/* =======================================================================
          FULLSCREEN LIVE PRESENTER STAGE (PHASE 3 TASK 3)
          ======================================================================= */}
      {activeLivePresenterSession && (
        <HostLiveFullscreenStage
          sessionId={activeLivePresenterSession.id}
          sessionCode={activeLivePresenterSession.pin}
          deckTitle={activeLivePresenterSession.deck.title}
          slides={activeLivePresenterSession.deck.slides}
          scheduledStartTime={activeLivePresenterSession.scheduledStartTime || deckSettings.scheduledStartTime}
          onClose={handleCloseLivePresenter}
          className={activeLivePresenterSession.deck.className}
          tradeName={activeLivePresenterSession.deck.trade}
          subjectName={activeLivePresenterSession.deck.subjectName}
          subjectCode={activeLivePresenterSession.deck.subjectCode}
        />
      )}

      {/* =======================================================================
          NEW PRESENTATION CREATION MODAL WITH GLOBAL ACADEMIC MAPPING CASCADE
          ======================================================================= */}
      <AnimatePresence>
        {isCreateDeckModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateDeckModalOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      নতুন প্রেজেন্টেশন ও কুইজ তৈরি করুন
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      সেন্ট্রাল একাডেমিক ম্যাপিং অনুসারে শ্রেণি, ট্রেড ও বিষয় নির্বাচন করুন
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateDeckModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  প্রেজেন্টেশন শিরোনাম (Presentation Title):
                </label>
                <input
                  type="text"
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  placeholder="যেমন: ৯ম শ্রেণি - ডাটাবেজ মডেল ও নরম্যালাইজেশন..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* 3-Step Academic Cascade */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-3.5">
                {/* Step 1: Class */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>১. শ্রেণি নির্বাচন (Class):</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">BTEB Central</span>
                  </label>
                  <select
                    value={newDeckClassId}
                    onChange={(e) => handleCreateModalClassChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {ACADEMIC_CLASSES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameBangla}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Trade */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ২. ট্রেড / বিভাগ (Trade):
                  </label>
                  <select
                    value={newDeckTradeId}
                    onChange={(e) => handleCreateModalTradeChange(e.target.value)}
                    disabled={!doesClassHaveTrade(newDeckClassId)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-60"
                  >
                    {!doesClassHaveTrade(newDeckClassId) ? (
                      <option value="all">সাধারণ পাঠ্যক্রম (ট্রেড নেই)</option>
                    ) : (
                      getApplicableTradesForClass(newDeckClassId).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nameBangla} ({t.code})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Step 3: Subject */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ৩. সেন্ট্রাল ম্যাপড বিষয় (Subject):
                  </label>
                  <select
                    value={newDeckSubjectId}
                    onChange={(e) => setNewDeckSubjectId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {createModalSubjects.length === 0 ? (
                      <option value="">কোনো বিষয় ম্যাপিং পাওয়া যায়নি</option>
                    ) : (
                      createModalSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateDeckModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCreateDeck}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>স্টুডিও ওপেন করুন</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
