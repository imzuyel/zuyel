"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Award,
  Clock,
  Sparkles,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  FileText,
  HelpCircle,
  Trophy,
  Loader2,
  X,
  Play,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Flame,
  Target,
  Eye,
  EyeOff,
  Check,
  Search,
  Layers,
  GraduationCap,
  Star,
  TrendingUp,
  Compass,
  Filter,
  Cpu,
  Server,
  Wifi,
  Wrench,
  Scissors,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { triggerBlockCompletionCelebration } from "@/lib/confetti";
import { motion, AnimatePresence } from "motion/react";
import { CourseCertificateModal } from "@/components/learning/CourseCertificateModal";
import {
  CourseItem,
  EnrichedCourse,
  EnrichedCourseChapter,
  EnrichedContentItem,
} from "@/lib/chapterLearningEngine";
import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  MANDATORY_FOUR_TRADES,
  BTEB_ACADEMIC_TRADES,
  getApplicableTradesForClass,
  doesClassHaveTrade,
  parseClassNumeric,
} from "@/lib/academicStructure";
import {
  getActiveStudentAccount,
  StudentAuthAccount,
} from "@/lib/studentIntelligenceStore";
import { useGlobalAcademic } from "@/context/GlobalAcademicContext";

// Helper for dynamic subject icons based on BTEB 4 trades & curriculum
export const getSubjectIcon = (tradeCode?: string | null, code?: string | null) => {
  const t = (tradeCode || code || "").toUpperCase();
  if (t.includes("CE") || t.includes("ELECTRONIC")) return Cpu;
  if (t.includes("IT") || t.includes("IOT") || t.includes("COMPUTER")) return Server;
  if (t.includes("GEW") || t.includes("ELECTRICAL") || t.includes("EE") || t.includes("WORKSHOP")) return Zap;
  if (t.includes("AMB") || t.includes("APPAREL") || t.includes("SEWING") || t.includes("GARMENTS")) return Scissors;
  return BookOpen;
};

import { InternationalStoryLessonRenderer } from "@/components/learning/InternationalStoryLessonRenderer";
import { DynamicQuizQuestionView } from "./DynamicQuizQuestionView";

// Minimalist Smart Time Formatter (e.g., "35s", "5m")
export function formatSmartTime(item: {
  durationMinutes?: number;
  timeLimitSeconds?: number;
  readTimeMinutes?: number;
}): string {
  if (item.timeLimitSeconds && item.timeLimitSeconds > 0) {
    if (item.timeLimitSeconds < 60) return `${item.timeLimitSeconds}s`;
    const m = Math.floor(item.timeLimitSeconds / 60);
    const s = item.timeLimitSeconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const mins = item.readTimeMinutes || item.durationMinutes;
  if (mins && mins > 0) {
    if (mins < 1) return `${Math.round(mins * 60)}s`;
    return `${mins}m`;
  }
  return "35s";
}

// Minimalist Marks Formatter
export function getItemMarks(item: {
  quizQuestions?: Array<{ marks?: number }>;
  passingScore?: number;
}): number {
  if (item.quizQuestions && item.quizQuestions.length > 0) {
    return item.quizQuestions.reduce((acc, q) => acc + (q.marks || 10), 0);
  }
  return item.passingScore || 10;
}

// Framer Motion Timeline Roadmap Animation Variants
export const roadmapTimelineContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const roadmapTimelineBlockVariants: any = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

// =========================================================================
// INTERNATIONAL STORY / LESSON ARTICLE RENDERER (Exported for compatibility)
// =========================================================================
export const RichArticleRenderer = InternationalStoryLessonRenderer;

export default function SequentialLearningPathView() {
  const [courses, setCourses] = useState<EnrichedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const chaptersSectionRef = useRef<HTMLDivElement>(null);

  // Active block DOM reference for smooth auto-centering (Task 1: Auto-Scroll UX Fix)
  const activeRoadmapBlockRef = useRef<HTMLDivElement | null>(null);

  // Smooth scroll handler when a subject card is clicked
  const handleSelectSubject = (courseId: number) => {
    setSelectedCourseId(courseId);
    setSelectedChapterFilter("all");
    setTimeout(() => {
      chaptersSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };


  const {
    activeClass,
    activeTrade,
    availableClasses,
    availableTrades: globalTrades,
    setSelectedClassId,
    setSelectedTradeId,
  } = useGlobalAcademic();

  // PTSC Academic Hierarchy Filter States: Class, Trade (৬-৮ ট্রেড নাই, ৯-১২ ট্রেড আছে), Category, Search
  const [selectedClass, setSelectedClass] = useState<number | "all">(() => {
    return activeClass?.numericValue ? activeClass.numericValue : "all";
  });
  const [selectedTrade, setSelectedTrade] = useState<string>(() => {
    return activeTrade?.code || "all";
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeStudent, setActiveStudent] = useState<StudentAuthAccount | null>(null);

  // Sync with GlobalAcademicContext when changed from global bar
  useEffect(() => {
    if (activeClass?.numericValue) {
      setSelectedClass(activeClass.numericValue);
    }
  }, [activeClass?.numericValue]);

  useEffect(() => {
    if (activeTrade?.code) {
      setSelectedTrade(activeTrade.code);
    }
  }, [activeTrade?.code]);

  // Trade applicability check: 6-8 NO trade, 9-12 has trade!
  const isTradeApplicable = useMemo(() => {
    if (selectedClass === "all") return false;
    return doesClassHaveTrade(selectedClass);
  }, [selectedClass]);

  const applicableTrades = useMemo(() => {
    if (selectedClass === "all") return MANDATORY_FOUR_TRADES;
    return isTradeApplicable ? getApplicableTradesForClass(selectedClass) : [];
  }, [selectedClass, isTradeApplicable]);

  const handleClassChange = (newClass: number | "all") => {
    setSelectedClass(newClass);
    // Rule: Class 6, 7, 8 do NOT have trades! Reset trade selection to "all"
    setSelectedTrade("all");
    if (newClass !== "all") {
      const match = availableClasses.find((c) => c.numericValue === newClass);
      if (match) {
        setSelectedClassId(match.id);
      }
    }
  };

  const handleTradeChange = (newTrade: string) => {
    setSelectedTrade(newTrade);
    if (newTrade !== "all") {
      const match = globalTrades.find((t) => t.code === newTrade);
      if (match) {
        setSelectedTradeId(match.id);
      }
    } else {
      setSelectedTradeId("all");
    }
  };

  const handleResetFilters = () => {
    setSelectedClass("all");
    setSelectedTrade("all");
    setSelectedCategory("all");
    setSearchQuery("");
  };

  // Active Reader / Quiz Modals
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<number | "all">("all");
  const [activeBlogItem, setActiveBlogItem] = useState<EnrichedContentItem | null>(null);
  const [completingBlog, setCompletingBlog] = useState(false);
  const [hoveredNodeItem, setHoveredNodeItem] = useState<EnrichedContentItem | null>(null);
  const [miniQuizSelectedOpt, setMiniQuizSelectedOpt] = useState<number | null>(null);
  const [miniQuizSubmitted, setMiniQuizSubmitted] = useState<boolean>(false);
  const blogReadingStartTimeRef = useRef<number>(Date.now());

  // Step-by-Step Interactive Quiz Arena States (One Question at a Time)
  const [activeQuizItem, setActiveQuizItem] = useState<EnrichedContentItem | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
  const [selectedOptionForCurrent, setSelectedOptionForCurrent] = useState<any>(null);
  const [confirmedQuestions, setConfirmedQuestions] = useState<Record<string, boolean>>({});
  const [consecutiveStreak, setConsecutiveStreak] = useState<number>(0);
  const [highestStreak, setHighestStreak] = useState<number>(0);
  const [streakBonus, setStreakBonus] = useState<number>(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState<number>(0);
  const [windowViolations, setWindowViolations] = useState<number>(0);
  const [windowPenalty, setWindowPenalty] = useState<number>(0);
  const [violationAlert, setViolationAlert] = useState<string | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState<boolean>(false);
  const [showFullReviewList, setShowFullReviewList] = useState<boolean>(false);

  // SoloLearn Friendly Locked Modal Item
  const [lockedModalItem, setLockedModalItem] = useState<EnrichedContentItem | null>(null);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);

  // Student Roll
  const studentRoll = activeStudent ? activeStudent.rollNumber : "10";
  const studentName = activeStudent ? activeStudent.studentName : "রিপন আহমেদ";


  useEffect(() => {
    const student = getActiveStudentAccount();
    setActiveStudent(student);
  }, []);

  // Auto-scroll smoothly to center the active block whenever selected course, chapter, or active items change
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeEl =
        activeRoadmapBlockRef.current ||
        (activeBlogItem?.id && document.getElementById(`slp-roadmap-node-${activeBlogItem.id}`)) ||
        (activeQuizItem?.id && document.getElementById(`slp-roadmap-node-${activeQuizItem.id}`));
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedCourseId, selectedChapterFilter, activeBlogItem?.id, activeQuizItem?.id]);

  const fetchCoursesWithProgress = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/learning/courses?studentRoll=${encodeURIComponent(studentRoll)}`);
      const data = await res.json();
      if (data.success && data.courses) {
        setCourses(data.courses);
        if (!selectedCourseId && data.courses.length > 0) {
          setSelectedCourseId(data.courses[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("কোর্স লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesWithProgress();
  }, [studentRoll]);

  // Filter courses by Class, Trade (৬-৮ ট্রেড নেই, ৯-১২ ট্রেড আছে), Category and Search
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // 1. Class Filter
      if (selectedClass !== "all") {
        const targetNumeric = parseClassNumeric(selectedClass);
        const courseNumeric = c.numericClass || parseClassNumeric(c.classId);
        if (courseNumeric !== targetNumeric) return false;
      }

      // 2. Trade Filter
      if (selectedClass !== "all") {
        const hasTrade = doesClassHaveTrade(selectedClass);
        if (!hasTrade) {
          // Class 6, 7, 8: strictly no trade or general courses
          // Already matched by class!
        } else if (selectedTrade !== "all") {
          // Class 9, 10, 11, 12: filter by specific selected trade
          const codeMatches =
            c.tradeCode === selectedTrade ||
            (c.tradeCode && selectedTrade.includes(c.tradeCode)) ||
            (selectedTrade && c.tradeCode?.toLowerCase().includes(selectedTrade.toLowerCase()));
          const nameMatches = c.tradeName && c.tradeName.toLowerCase().includes(selectedTrade.toLowerCase());
          const idMatches = String(c.tradeId) === selectedTrade;
          if (!codeMatches && !nameMatches && !idMatches) return false;
        }
      } else if (selectedTrade !== "all") {
        // "all" classes but specific trade selected
        const codeMatches =
          c.tradeCode === selectedTrade ||
          (c.tradeCode && selectedTrade.includes(c.tradeCode)) ||
          (selectedTrade && c.tradeCode?.toLowerCase().includes(selectedTrade.toLowerCase()));
        const nameMatches = c.tradeName && c.tradeName.toLowerCase().includes(selectedTrade.toLowerCase());
        const idMatches = String(c.tradeId) === selectedTrade;
        if (!codeMatches && !nameMatches && !idMatches) return false;
      }

      // 3. Category Filter
      if (selectedCategory !== "all") {
        const matchesCategory =
          (selectedCategory === "EE" && (c.code.includes("EE") || c.tradeCode === "EE" || c.tradeName?.includes("ইলেকট্রিক্যাল"))) ||
          (selectedCategory === "IT" && (c.code.includes("IT") || c.tradeCode?.includes("IT") || c.tradeName?.includes("আইটি") || c.tradeName?.includes("কম্পিউটার"))) ||
          (selectedCategory === "AMB" && (c.code.includes("AMB") || c.tradeCode === "AMB" || c.tradeName?.includes("অটোমোবাইল"))) ||
          (selectedCategory === "CIV" && (c.code.includes("CIV") || c.tradeCode === "CIV" || c.tradeName?.includes("সিভিল"))) ||
          (selectedCategory === "RAC" && (c.code.includes("RAC") || c.tradeCode === "RAC" || c.tradeName?.includes("রেফ্রিজারেশন"))) ||
          (selectedCategory === "PV" && (c.numericClass <= 8 || !c.tradeCode || c.tradeCode === "General"));

        if (!matchesCategory) return false;
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          c.title.toLowerCase().includes(q) ||
          c.titleBangla.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.tradeName && c.tradeName.toLowerCase().includes(q)) ||
          (c.subjectName && c.subjectName.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [courses, selectedClass, selectedTrade, selectedCategory, searchQuery]);

  // Keep activeCourse in sync with filteredCourses
  useEffect(() => {
    if (filteredCourses.length > 0) {
      const stillInList = filteredCourses.some((c) => c.id === selectedCourseId);
      if (!stillInList) {
        setSelectedCourseId(filteredCourses[0].id);
      }
    }
  }, [filteredCourses, selectedCourseId]);

  const activeCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || filteredCourses[0] || courses[0] || null;
  }, [courses, selectedCourseId, filteredCourses]);

  // Displayed Chapters: Filtered by selectedChapterFilter (or all chapters)
  const displayedChapters = useMemo(() => {
    if (!activeCourse) return [];
    if (selectedChapterFilter === "all") return activeCourse.chapters;
    return activeCourse.chapters.filter((ch) => ch.id === selectedChapterFilter);
  }, [activeCourse, selectedChapterFilter]);

  // Integrated Mini-Quiz for active blog item
  const activeMiniQuiz = useMemo(() => {
    if (!activeBlogItem) return null;
    if (activeBlogItem.quizQuestions && activeBlogItem.quizQuestions.length > 0) {
      return activeBlogItem.quizQuestions[0];
    }
    return {
      id: `mini-q-${activeBlogItem.id}`,
      questionText: activeBlogItem.summary
        ? `পাঠ যাচাই প্রশ্ন: "${activeBlogItem.titleBangla}" অনুযায়ী সারসংক্ষেপ কোনটি?`
        : `পাঠ যাচাই প্রশ্ন: "${activeBlogItem.titleBangla}" পাঠটি মনোযোগ সহকারে সম্পন্ন করেছেন?`,
      options: activeBlogItem.keyTakeaways && activeBlogItem.keyTakeaways.length >= 2
        ? [
            activeBlogItem.keyTakeaways[0],
            "সার্কিটে কোনো বিদ্যুৎ উৎস বা ব্যাটারির সংযোগ অপ্রয়োজনীয়।",
            "অপরিবাহী বা ইনসুলেটর দিয়ে সরাসরি বৈদ্যুতিক লোড চালু করা যায়।",
            "সুইচ অন থাকা সত্ত্বেও কোনো সার্কিট বন্ধ (Closed) হয় না।"
          ]
        : [
            "হ্যাঁ, আমি পাঠটি পূর্ণাঙ্গভাবে পড়েছি ও ব্যবহারিক প্রয়োগ বুঝতে পেরেছি।",
            "না, এখনো পাঠটি পুরোপুরি পড়া হয়নি।"
          ],
      correctOptionIndex: 0,
      explanation: activeBlogItem.keyTakeaways && activeBlogItem.keyTakeaways.length > 0
        ? `সঠিক উত্তর: ${activeBlogItem.keyTakeaways[0]}`
        : "সঠিক উত্তর নির্বাচন করা হয়েছে। আপনি পরবর্তী ধাপে যাওয়ার অনুমোদন পেয়েছেন।",
      marks: 5,
    };
  }, [activeBlogItem]);

  // Find the exact active/next in-line actionable lesson for the SoloLearn "Resume Active Lesson" feature
  const nextActiveLesson = useMemo(() => {
    if (!activeCourse) return null;
    for (const chapter of activeCourse.chapters) {
      if (chapter.isLocked) continue;
      for (const item of chapter.items) {
        if (item.isCurrentNextStep || (!item.isLocked && !item.progress?.isPassed && item.progress?.status !== "COMPLETED")) {
          return { chapter, item };
        }
      }
    }
    // If all completed, return first item for review
    if (activeCourse.chapters[0]?.items[0]) {
      return { chapter: activeCourse.chapters[0], item: activeCourse.chapters[0].items[0] };
    }
    return null;
  }, [activeCourse]);

  // SoloLearn Gamified Level & XP Computation
  const studentTotalXp = useMemo(() => {
    return courses.reduce((acc, c) => acc + (c.totalEarnedXp || 0), 0);
  }, [courses]);

  const studentLevel = useMemo(() => {
    const lvl = Math.floor(studentTotalXp / 150) + 1;
    let title = "নবীন কারিগর (Novice)";
    if (lvl === 2) title = "জুনিয়র টেকনিশিয়ান (Junior Tech)";
    else if (lvl === 3) title = "কারিগরি শিক্ষানবিস (Tech Apprentice)";
    else if (lvl === 4) title = "দক্ষ প্রকৌশলী (Senior Tech)";
    else if (lvl >= 5) title = "মাস্টার ক্রাফটসম্যান (Master Craftsman)";
    const currentLvlXp = studentTotalXp % 150;
    return { level: lvl, title, currentLvlXp, nextLvlThreshold: 150 };
  }, [studentTotalXp]);

  // Handle clicking an item
  const handleItemClick = (item: EnrichedContentItem) => {
    if (item.isLocked) {
      setLockedModalItem(item);
      return;
    }

    // Auto-scroll smoothly to center the clicked active block (Task 1: Auto-Scroll UX Fix)
    const blockEl = document.getElementById(`slp-roadmap-node-${item.id}`);
    blockEl?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    if (item.itemType === "BLOG_PART") {
      blogReadingStartTimeRef.current = Date.now();
      setActiveBlogItem(item);
      setMiniQuizSelectedOpt(null);
      setMiniQuizSubmitted(false);
    } else {
      // Initialize Quiz with clean sequential tracking
      setActiveQuizItem(item);
      setCurrentQuestionIndex(0);
      setQuizAnswers({});
      setSelectedOptionForCurrent(null);
      setConfirmedQuestions({});
      setConsecutiveStreak(0);
      setHighestStreak(0);
      setStreakBonus(0);
      setWrongAnswersCount(0);
      setWindowViolations(0);
      setWindowPenalty(0);
      setViolationAlert(null);
      setQuizResult(null);
      setShowFullReviewList(false);
      setQuizStartTime(Date.now());
    }
  };

  // Student completes blog part
  const handleCompleteBlogPart = async () => {
    if (!activeBlogItem) return;

    // Strict Sequential Check: Must pass mini-quiz before completing blog part & unlocking next item
    if (activeMiniQuiz) {
      const isPassed = miniQuizSubmitted && miniQuizSelectedOpt === activeMiniQuiz.correctOptionIndex;
      if (!isPassed) {
        if (!miniQuizSubmitted) {
          toast.error("পরবর্তী ধাপ আনলক করতে অনুগ্রহ করে নিচের মিনি কুইজটির উত্তর দিন!");
        } else {
          toast.error("মিনি কুইজের উত্তর সঠিক হয়নি! সঠিক অপশন নির্বাচন করে আবার নিশ্চিত করুন।");
        }
        return;
      }
    }

    try {
      setCompletingBlog(true);
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - blogReadingStartTimeRef.current) / 1000));
      const res = await fetch(`/api/learning/items/${activeBlogItem.id}/complete-blog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentRoll,
          studentName,
          timeSpentSeconds: elapsedSeconds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        try {
          triggerBlockCompletionCelebration();
        } catch {}
        toast.success(`অভিনন্দন! পাঠ সম্পন্ন হয়েছে (+${data.xpAwarded || activeBlogItem.xpReward} XP, ${data.stars || 5}★)`);
        setActiveBlogItem(null);
        await fetchCoursesWithProgress();
      } else {
        toast.error(data.error || "পাঠ সম্পন্ন করা যায়নি");
      }
    } catch {
      toast.error("নেটওয়ার্ক ত্রুটি");
    } finally {
      setCompletingBlog(false);
    }
  };

  // Step-by-Step: Confirm Current Question (Cannot go to #2 until #1 is confirmed!)
  const handleConfirmCurrentQuestion = () => {
    if (
      !activeQuizItem ||
      selectedOptionForCurrent === null ||
      selectedOptionForCurrent === undefined ||
      selectedOptionForCurrent === ""
    ) {
      toast.error("অনুগ্রহ করে একটি উত্তর নির্বাচন বা পূরণ করুন!");
      return;
    }

    const questions = activeQuizItem.quizQuestions || [];
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    let isCorrect = false;
    const qType = currentQ.questionType || "MCQ";

    if (qType === "TRUE_FALSE") {
      const studentBool =
        typeof selectedOptionForCurrent === "boolean"
          ? selectedOptionForCurrent
          : selectedOptionForCurrent === 0 ||
            String(selectedOptionForCurrent).toLowerCase() === "true" ||
            String(selectedOptionForCurrent) === "সত্য";
      const expectedBool =
        currentQ.correctBoolean !== undefined
          ? currentQ.correctBoolean
          : currentQ.correctOptionIndex === 0;
      isCorrect = studentBool === expectedBool;
    } else if (qType === "FILL_BLANKS") {
      const studentText = String(selectedOptionForCurrent || "")
        .trim()
        .toLowerCase();
      const accepted = (currentQ.acceptedAnswers || currentQ.options || []).map((a) =>
        a.trim().toLowerCase()
      );
      isCorrect = accepted.includes(studentText);
    } else if (qType === "MATCHING") {
      let pairs = currentQ.matchingPairs || [];
      if ((!pairs || pairs.length === 0) && typeof currentQ.correctAnswer === "string" && currentQ.correctAnswer.startsWith("[")) {
        try {
          const parsed = JSON.parse(currentQ.correctAnswer);
          if (Array.isArray(parsed)) pairs = parsed;
        } catch {}
      }
      if (pairs.length > 0) {
        if (Array.isArray(selectedOptionForCurrent)) {
          isCorrect = pairs.every((p, idx) => {
            const item = selectedOptionForCurrent[idx];
            if (typeof item === "object" && item !== null) {
              return (item.left || "").trim().toLowerCase() === p.left.trim().toLowerCase() &&
                     (item.right || "").trim().toLowerCase() === p.right.trim().toLowerCase();
            }
            return false;
          });
        } else if (typeof selectedOptionForCurrent === "object" && selectedOptionForCurrent !== null) {
          const userPairs = selectedOptionForCurrent as Record<string, string>;
          isCorrect = pairs.every((p, idx) => {
            const val = userPairs[p.left] ?? userPairs[`drop-${idx}`] ?? userPairs[idx];
            return typeof val === "string" && val.trim().toLowerCase() === p.right.trim().toLowerCase();
          });
        }
      }
    } else {
      isCorrect = Number(selectedOptionForCurrent) === currentQ.correctOptionIndex;
    }

    // Lock in answer for current question
    setQuizAnswers((prev) => ({ ...prev, [currentQ.id]: selectedOptionForCurrent }));
    setConfirmedQuestions((prev) => ({ ...prev, [currentQ.id]: true }));

    if (isCorrect) {
      const nextStreak = consecutiveStreak + 1;
      setConsecutiveStreak(nextStreak);
      if (nextStreak > highestStreak) {
        setHighestStreak(nextStreak);
      }

      // Calculate streak bonus
      let bonusForThis = 0;
      if (nextStreak === 2) bonusForThis = 5;
      else if (nextStreak === 3) bonusForThis = 10;
      else if (nextStreak >= 4) bonusForThis = 15;

      if (bonusForThis > 0) {
        setStreakBonus((prev) => prev + bonusForThis);
        toast.success(`🔥 ${nextStreak}x স্ট্রিক কম্বো! +১০ বেস পয়েন্ট এবং +${bonusForThis} বোনাস পয়েন্ট অর্জিত!`);
      } else {
        toast.success("✅ সঠিক উত্তর! +১০ পয়েন্ট যোগ হয়েছে।");
      }
    } else {
      setConsecutiveStreak(0); // Streak broken
      setWrongAnswersCount((prev) => prev + 1);
      toast.error("❌ ভুল উত্তর! -৫ পয়েন্ট নেগেটিভ পেনাল্টি কাটা হয়েছে। স্ট্রিক ০ হয়েছে।");
    }
  };

  // Step-by-Step: Navigate to Previous Question (Back is always allowed)
  const handlePrevQuestion = () => {
    if (!activeQuizItem || currentQuestionIndex <= 0) return;
    const questions = activeQuizItem.quizQuestions || [];
    const prevIdx = currentQuestionIndex - 1;
    setCurrentQuestionIndex(prevIdx);
    const prevQ = questions[prevIdx];
    if (prevQ && confirmedQuestions[prevQ.id] !== undefined) {
      setSelectedOptionForCurrent(quizAnswers[prevQ.id]);
    } else {
      setSelectedOptionForCurrent(null);
    }
  };

  // Step-by-Step: Unlock & Move to Next Question (Forward strictly locked until confirmed)
  const handleNextQuestion = () => {
    if (!activeQuizItem) return;
    const questions = activeQuizItem.quizQuestions || [];
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ || !confirmedQuestions[currentQ.id]) {
      toast.error("পরবর্তী প্রশ্নে যেতে বর্তমান প্রশ্নের উত্তর নিশ্চিত করুন!");
      return;
    }
    if (currentQuestionIndex < questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      const nextQ = questions[nextIdx];
      if (nextQ && confirmedQuestions[nextQ.id] !== undefined) {
        setSelectedOptionForCurrent(quizAnswers[nextQ.id]);
      } else {
        setSelectedOptionForCurrent(null);
      }
    }
  };

  // Step-by-Step: Direct Jump to Question (Back allowed, forward strictly locked)
  const handleJumpToQuestion = (targetIdx: number) => {
    if (!activeQuizItem) return;
    const questions = activeQuizItem.quizQuestions || [];
    if (targetIdx <= currentQuestionIndex || confirmedQuestions[questions[targetIdx]?.id]) {
      setCurrentQuestionIndex(targetIdx);
      const targetQ = questions[targetIdx];
      if (targetQ && confirmedQuestions[targetQ.id] !== undefined) {
        setSelectedOptionForCurrent(quizAnswers[targetQ.id]);
      } else {
        setSelectedOptionForCurrent(null);
      }
    } else {
      toast.error("আগের প্রশ্ন সমাধান না করে সামনে যাওয়া যাবে না (Forward Locked 🔒)");
    }
  };

  // Final Step: Submit Complete Quiz to Backend and view Comprehensive Progress Dashboard
  const handleSubmitCompleteQuiz = async () => {
    if (!activeQuizItem) return;

    try {
      setSubmittingQuiz(true);
      const elapsedSeconds = Math.max(15, Math.round((Date.now() - quizStartTime) / 1000));
      const res = await fetch(`/api/learning/items/${activeQuizItem.id}/submit-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentRoll,
          studentName,
          answers: quizAnswers,
          timeSpentSeconds: elapsedSeconds,
          windowViolationsCount: windowViolations,
          highestStreakAchieved: highestStreak,
          clientCalculatedBonus: streakBonus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setQuizResult(data);
        if (data.isPassed) {
          try {
            triggerBlockCompletionCelebration();
          } catch {}
          toast.success(`🎉 অভিনন্দন! আপনি সফলভাবে পাস করেছেন (+${data.xpAwarded} XP, ${data.stars || 4}★)`);
        } else {
          toast.error("পাস মার্ক অর্জিত হয়নি। নিয়ম অনুযায়ী পুনরায় চেষ্টা করুন।");
        }
        await fetchCoursesWithProgress();
      } else {
        toast.error(data.error || "কুইজ সাবমিট করা যায়নি");
      }
    } catch {
      toast.error("নেটওয়ার্ক ত্রুটি ঘটেছে");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. SOLOLearn-STYLE GAMIFIED DASHBOARD HEADER & HERO STATS RIBBON          */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        {/* Ambient Decorative Blurs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Info Bar: Student Identification, Streaks, Levels */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  SoloLearn লার্নিং পথ
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-300 font-medium">
                  শিক্ষার্থী: <strong className="text-white">{studentName}</strong> (রোল: {studentRoll})
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-emerald-400 font-bold">
                  {activeCourse?.tradeName || "কারিগরি শাখা"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>অধ্যায়ভিত্তিক ইন্টারঅ্যাক্টিভ লার্নিং পথ</span>
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse hidden sm:inline" />
              </h1>
            </div>

            {/* Gamification Badges Strip (SoloLearn Hallmarks) */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Streak Badge */}
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-sm">
                <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                <div className="text-left">
                  <span className="text-[10px] text-amber-300/80 uppercase font-black block leading-none">ডেইলি স্ট্রিক</span>
                  <span className="text-xs font-black font-mono">৭ দিন অ্যাক্টিভ 🔥</span>
                </div>
              </div>

              {/* XP Level Badge */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-cyan-300 shadow-sm">
                <Zap className="w-4 h-4 text-cyan-400" />
                <div className="text-left">
                  <span className="text-[10px] text-cyan-300/80 uppercase font-black block leading-none">
                    লেভেল {studentLevel.level} · {studentTotalXp} XP
                  </span>
                  <span className="text-xs font-black">{studentLevel.title}</span>
                </div>
              </div>

              {/* League Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <span className="text-[10px] text-emerald-300/80 uppercase font-black block leading-none">লীগ র্যাংক</span>
                  <span className="text-xs font-black">সিলভার ডিভিশন</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PROMINENT "RESUME ACTIVE LESSON" HERO BANNER (SOLOLEARN SIGNATURE)         */}
          {/* ========================================================================= */}
          {nextActiveLesson && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/80 border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-indigo-950/40">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30">
                  {nextActiveLesson.item.itemType === "QUIZ" ? (
                    <Award className="w-6 h-6" />
                  ) : (
                    <BookOpen className="w-6 h-6" />
                  )}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-400/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                      ⚡ আপনার সক্রিয় পাঠ (Resume Active Lesson)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      অধ্যায় {nextActiveLesson.chapter.chapterNumber}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                    {nextActiveLesson.item.titleBangla}
                  </h3>
                  <p className="text-xs text-slate-300 flex items-center gap-2 font-mono">
                    <span className="text-amber-400 font-bold">+{nextActiveLesson.item.xpReward} XP</span>
                    <span>•</span>
                    <span className="text-cyan-400 font-semibold">{getItemMarks(nextActiveLesson.item)} Marks</span>
                    <span>•</span>
                    <span>{formatSmartTime(nextActiveLesson.item)}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleItemClick(nextActiveLesson.item)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-black text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <span>পাঠ চালিয়ে যান (Resume)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Active Course Progress Bar & Metrics */}
          {activeCourse && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg space-y-3 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Step Count Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-xs font-bold shadow-xs">
                  <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse shrink-0" />
                  <span>
                    বর্তমান কোর্স অগ্রগতি: <strong className="font-mono font-black text-cyan-100">{activeCourse.completedCourseItems}</strong> / {activeCourse.totalCourseItems} টি পাঠ সম্পন্ন
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Total Course Stars Earned Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.7)] shrink-0 animate-pulse" />
                    <span>
                      মোট অর্জন: <strong className="font-mono font-black text-sm text-amber-200">{activeCourse.totalEarnedStars || 0}</strong> / {activeCourse.maxPossibleStars || activeCourse.totalCourseItems * 5} স্টার
                    </span>
                  </div>

                  {/* Standout Percentage Badge with Bold Gradient Text & Certificate Button */}
                  <div className="flex items-center gap-2">
                    {activeCourse.courseProgressPercentage === 100 && (
                      <button
                        type="button"
                        onClick={() => setCertificateModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>সার্টিফিকেট 🎓</span>
                      </button>
                    )}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                        সম্পূর্ণ
                      </span>
                      <span className="text-sm sm:text-base font-black font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300">
                        {activeCourse.courseProgressPercentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Animated Gradient Progress Bar with Soft Glow & Light Sheen */}
              <div className="h-3.5 w-full bg-slate-900/80 rounded-full overflow-hidden border border-white/10 p-0.5 shadow-inner relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400 rounded-full relative overflow-hidden shadow-[0_0_14px_rgba(6,182,212,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${activeCourse.courseProgressPercentage}%` }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none -skew-x-12"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                  />
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THREE-STEP HIERARCHICAL CASCADING FILTER SYSTEM                         */}
      {/*    (A) শ্রেণি নির্বাচন ➔ (B) বিষয় নির্বাচন ➔ (C) অধ্যায়সমূহ ও লার্নিং পাথ     */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-6 shadow-sm">
        
        {/* ======================================================================= */}
        {/* STEP 1: CLASS SELECTION (৬ষ্ঠ থেকে ১২শ শ্রেণি)                             */}
        {/* ======================================================================= */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                ১
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>ধাপ ১: শ্রেণি নির্বাচন (Class Selection)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-400 border border-indigo-200 dark:border-indigo-800">
                    {selectedClass === "all" ? "সকল শ্রেণি" : `${selectedClass}ম শ্রেণি`}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ৬ষ্ঠ-৮ম শ্রেণিতে ট্রেড নেই (প্রাক-কারিগরি ভিত্তি) · ৯ম-১২শ শ্রেণিতে ভোকেশনাল কারিগরি ট্রেড
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(selectedClass !== "all" || selectedTrade !== "all" || selectedCategory !== "all" || searchQuery) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-cyan-400 flex items-center gap-1 transition px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ফিল্টার রিসেট</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Class Selector Pills Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <button
              type="button"
              onClick={() => {
                handleClassChange("all");
                setSelectedChapterFilter("all");
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedClass === "all"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-102 font-black"
                  : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black">সকল শ্রেণি</span>
                {selectedClass === "all" && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-[10px] block mt-0.5 ${selectedClass === "all" ? "text-indigo-100" : "text-slate-400"}`}>
                সব কারিকুলাম
              </span>
            </button>

            {ACADEMIC_CLASSES.map((cls) => {
              const isSelected = selectedClass === cls.numericValue;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => {
                    handleClassChange(cls.numericValue);
                    setSelectedChapterFilter("all");
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-102 font-black"
                      : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">{cls.nameBangla}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-[10px] block mt-0.5 truncate ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                    {cls.hasTrade ? "ট্রেড আছে ★" : "ট্রেড নেই •"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Contextual Rule Notice & Interactive Trade Selector (Class 9-12: 4 Mandatory Trades, Class 6-8: No Trades) */}
          <div className="pt-2">
            {!isTradeApplicable && selectedClass !== "all" ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span className="font-bold">
                    {selectedClass}ম শ্রেণি: প্রাক-ভোকেশনাল স্তর — সাধারণ মৌলিক পাঠ্যক্রম (ট্রেড প্রযোজ্য নয়)
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                  সাধারণ কারিকুলাম
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-cyan-500" />
                    <span>ভোকেশনাল ট্রেড ফিল্টার (BTEB অনুমোদিত ৪টি ট্রেড):</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {selectedTrade === "all" ? "সকল ট্রেড প্রদর্শিত হচ্ছে" : `নির্বাচিত ট্রেড: ${selectedTrade}`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTradeChange("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedTrade === "all"
                        ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/25 scale-102"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-cyan-400"
                    }`}
                  >
                    <span>সকল ট্রেড ({applicableTrades.length})</span>
                    {selectedTrade === "all" && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {applicableTrades.map((t) => {
                    const isSelected = selectedTrade === t.code || selectedTrade === String(t.id);
                    const TradeIcon = getSubjectIcon(t.code, t.code);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleTradeChange(t.code)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-102"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                        }`}
                      >
                        <TradeIcon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-cyan-500"}`} />
                        <span>{t.nameBangla}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                          {t.code}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* STEP 2: DYNAMICALLY LOADED APPROVED SUBJECTS (CLICKABLE CARDS - NO TABS)  */}
        {/* ======================================================================= */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-indigo-500/20">
                ২
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>ধাপ ২: অনুমোদিত বিষয়সমূহ (Clickable Subject Cards)</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 font-mono">
                    {filteredCourses.length} টি বিষয়
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  যেকোনো বিষয়ের কার্ডে ক্লিক করুন — সাথে সাথে নিচে ওই বিষয়ের অধ্যায় ও ডুওলিঙ্গো পাথওয়ে ওপেন হবে
                </p>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="বিষয়ের নাম বা কোড খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Subject Cards Grid */}
          {filteredCourses.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                নির্বাচিত শ্রেণি বা ট্রেডে কোনো বিষয় পাওয়া যায়নি
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl text-xs font-black cursor-pointer hover:shadow-lg transition-all"
              >
                ফিল্টার রিসেট করুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((c) => {
                const isSelected = activeCourse?.id === c.id;
                const SubjectIcon = getSubjectIcon(c.tradeCode, c.code);
                const totalLessons = c.chapters?.length || 0;
                const blogCount = c.chapters?.reduce(
                  (acc, ch) => acc + (ch.items?.filter((i) => i.itemType === "BLOG_PART").length || 0),
                  0
                ) || 0;
                const quizCount = c.chapters?.reduce(
                  (acc, ch) => acc + (ch.items?.filter((i) => i.itemType === "QUIZ").length || 0),
                  0
                ) || 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectSubject(c.id)}
                    className={`cursor-pointer transition-all duration-300 relative group transform hover:-translate-y-0.5 ${
                      isSelected
                        ? "animated-gradient-card scale-[1.01] ring-2 ring-cyan-400/30"
                        : "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-cyan-500/60 hover:ring-1 hover:ring-cyan-500/30"
                    }`}
                  >
                    <div
                      className={`p-5 flex flex-col justify-between h-full space-y-4 rounded-2xl ${
                        isSelected ? "animated-gradient-card-inner bg-slate-950 text-white" : ""
                      }`}
                    >
                      {/* Top row: Code + Badges + XP */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-400 font-mono text-[11px] font-black border border-cyan-500/30">
                            {c.code}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {c.className}
                          </span>
                          {c.tradeName && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 truncate max-w-[120px]">
                              {c.tradeName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-black text-amber-400 shrink-0">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>+{c.totalXp} XP</span>
                        </div>
                      </div>

                      {/* Subject Title & Icon Header */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                            isSelected
                              ? "bg-gradient-to-tr from-cyan-400 to-indigo-600 text-white shadow-md shadow-cyan-500/30"
                              : "bg-slate-100 dark:bg-slate-800 text-cyan-500 dark:text-cyan-400 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <SubjectIcon className="w-5 h-5" />
                        </div>

                        <div className="space-y-0.5 min-w-0 flex-1">
                          <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-cyan-400 transition-colors">
                            {c.titleBangla}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans truncate">
                            {c.title}
                          </p>
                        </div>
                      </div>

                      {/* Metrics bar */}
                      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center">
                        <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-850">
                          <span className="block text-slate-900 dark:text-slate-200 font-mono text-xs font-bold">{totalLessons}</span>
                          <span>অধ্যায়</span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-850">
                          <span className="block text-slate-900 dark:text-slate-200 font-mono text-xs font-bold">{blogCount}</span>
                          <span>ব্লগ পাঠ</span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-850">
                          <span className="block text-slate-900 dark:text-slate-200 font-mono text-xs font-bold">{quizCount}</span>
                          <span>কুইজ</span>
                        </div>
                      </div>

                      {/* Progress bar with animated gradient and soft glow */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-400">কোর্স অগ্রগতি:</span>
                          <span className={c.courseProgressPercentage === 100 ? "text-emerald-500 dark:text-emerald-400 font-bold" : "text-cyan-600 dark:text-cyan-400 font-mono font-black"}>
                            {c.courseProgressPercentage}% সম্পন্ন
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60 relative">
                          <motion.div
                            className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${c.courseProgressPercentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      {/* Bottom Card Footer Action Indicator */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        {isSelected ? (
                          <div className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-black flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>সক্রিয় বিষয় · নিচে অধ্যায় দেখুন ↓</span>
                          </div>
                        ) : (
                          <div className="w-full py-1.5 px-2 text-slate-400 group-hover:text-cyan-400 text-xs font-bold flex items-center justify-between transition-colors">
                            <span>অধ্যায় ও কন্টেন্ট ওপেন করুন</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* STEP 3: CHAPTERS / MODULES & ROADMAP SELECTOR FOR ACTIVE SUBJECT           */}
        {/* ======================================================================= */}
        {activeCourse && (
          <div ref={chaptersSectionRef} className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800 scroll-mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 dark:from-slate-900/90 dark:via-indigo-950/30 dark:to-slate-900/90 border border-indigo-500/20">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-600/30">
                  ৩
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>ধাপ ৩: {activeCourse.titleBangla}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                      {activeCourse.chapters.length} টি অধ্যায়
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {activeCourse.tradeName || "সাধারণ কারিকুলাম"} · {activeCourse.className} (কোড: {activeCourse.code})
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. CHAPTER PATH CONTENT & INTERACTIVE DUOLINGO TIMELINE NODES              */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-bold">আপনার লার্নিং পথ প্রস্তুত হচ্ছে...</p>
        </div>
      ) : !activeCourse ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-bold">কোনো সক্রিয় কোর্স পাওয়া যায়নি।</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedChapters.map((chapter, chapterIdx) => (
            <div
              key={chapter.id}
              className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                chapter.isLocked
                  ? "bg-slate-100/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 opacity-75"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
              }`}
            >
              {/* Chapter Header / Level Zone Banner */}
              <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border ${
                      chapter.isLocked
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700"
                        : chapter.progressPercentage === 100
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                        : "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                    }`}
                  >
                    {chapter.isLocked ? (
                      <Lock className="w-5 h-5" />
                    ) : chapter.progressPercentage === 100 ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      chapterIdx + 1
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 uppercase text-[10px]">
                        অধ্যায় {chapter.chapterNumber}
                      </span>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                        <span>
                          <strong className="font-mono font-black text-emerald-600 dark:text-emerald-300">{chapter.completedItemsCount}</strong> / {chapter.totalItemsCount} সম্পন্ন
                        </span>
                      </div>

                      {/* Chapter Stars Pill Badge */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60 shadow-xs font-bold text-[11px]">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.7)] shrink-0" />
                        <span>
                          <strong className="font-mono font-black text-amber-600 dark:text-amber-300">
                            {chapter.totalEarnedStars !== undefined
                              ? chapter.totalEarnedStars
                              : chapter.items.reduce((acc, it) => {
                                  const p = it.progress;
                                  if (p?.isPassed || p?.status === "COMPLETED") {
                                    const val = p.stars !== undefined && p.stars !== null && Number(p.stars) > 0
                                      ? Math.max(1, Math.min(5, Number(p.stars)))
                                      : 1;
                                    return acc + val;
                                  }
                                  return acc;
                                }, 0)}
                          </strong> / {chapter.maxPossibleStars || chapter.items.length * 5} স্টার
                        </span>
                      </div>

                      {chapter.isLocked && (
                        <span className="text-rose-500 font-bold flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                          <Lock className="w-3 h-3" />
                          <span>লক করা (পূর্ববর্তী অধ্যায় আবশ্যক)</span>
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                      {chapter.titleBangla}
                    </h2>
                  </div>
                </div>

                {/* Chapter Progress Stats with Bold Gradient Text and Animated Glow Bar */}
                <div className="flex flex-col sm:items-end gap-1.5 min-w-[130px] sm:min-w-[160px]">
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      অগ্রগতি
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400">
                      {chapter.progressPercentage}%
                    </span>
                  </div>

                  {/* Animated gradient progress track with soft glow and light sheen */}
                  <div className="w-full h-3 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300/60 dark:border-slate-700 shadow-inner relative">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-green-500 rounded-full relative overflow-hidden shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${chapter.progressPercentage}%` }}
                      transition={{ duration: 0.85, ease: "easeOut" }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none -skew-x-12"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                      />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* DUOLINGO-STYLE SERPENTINE CURVED ZIGZAG ROADMAP                          */}
              {/* ========================================================================= */}
              <div className="p-6 sm:p-10 relative overflow-hidden bg-radial from-slate-50/50 to-white dark:from-slate-900/60 dark:to-slate-950">
                  <motion.div
                    variants={roadmapTimelineContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-md mx-auto space-y-10 sm:space-y-12 relative"
                  >
                    {chapter.items.map((item, idx) => {
                      const isPassed = item.progress?.isPassed || item.progress?.status === "COMPLETED";
                      const isLocked = item.isLocked;
                      const isQuiz = item.itemType === "QUIZ";
                      const isCurrentNext = item.isCurrentNextStep;

                      // Serpentine Zigzag Horizontal Alternation: [Center, Left, Center, Right]
                      const alignments = [
                        "justify-center",
                        "justify-start pl-6 sm:pl-12",
                        "justify-center",
                        "justify-end pr-6 sm:pr-12",
                      ];
                      const alignClass = alignments[idx % alignments.length];

                      return (
                        <React.Fragment key={item.id}>
                          <motion.div
                            variants={roadmapTimelineBlockVariants}
                            className={`flex ${alignClass} relative z-10`}
                          >
                            {/* Minimalist Timeline Node */}
                            <div
                              ref={(isCurrentNext || activeBlogItem?.id === item.id || activeQuizItem?.id === item.id) ? activeRoadmapBlockRef : null}
                              id={`slp-roadmap-node-${item.id}`}
                              className="flex flex-col items-center group relative scroll-mt-28"
                            >
                              {/* Current Indicator */}
                              {isCurrentNext && (
                                <motion.div
                                  initial={{ y: -6, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
                                  className="mb-2 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 z-20 cursor-pointer"
                                  onClick={() => handleItemClick(item)}
                                >
                                  <Play className="w-2 h-2 fill-current" />
                                  <span>Current</span>
                                </motion.div>
                              )}

                              {/* Subtle Pulse Halo for Active */}
                              {isCurrentNext && (
                                <motion.div
                                  className="absolute -inset-1.5 rounded-full pointer-events-none z-0 ring-2 ring-indigo-500/50"
                                  animate={{
                                    opacity: [0.4, 0.8, 0.4],
                                    scale: [1, 1.06, 1],
                                  }}
                                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                />
                              )}

                              {/* Node Button: Gamified 3 Visual States (Completed / Active / Locked) */}
                              <motion.button
                                type="button"
                                whileTap={!isLocked ? { scale: 0.95 } : {}}
                                onClick={() => handleItemClick(item)}
                                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black transition-all cursor-pointer relative z-10 border-2 select-none ${
                                  isPassed
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/60 dark:border-emerald-500/50 ring-2 ring-emerald-500/20 hover:-translate-y-0.5 hover:ring-emerald-500/40 transition-transform duration-200"
                                    : isCurrentNext
                                    ? "bg-indigo-600 text-white border-indigo-400 animate-pulse ring-2 ring-indigo-400/30 hover:-translate-y-0.5 hover:ring-indigo-400/50 transition-transform duration-200"
                                    : isLocked
                                    ? "bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700/60 opacity-60 cursor-not-allowed"
                                    : "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700/60 hover:-translate-y-0.5 hover:border-indigo-400 hover:ring-1 hover:ring-indigo-400/30 transition-transform duration-200"
                                }`}
                                title={isLocked ? "লক করা ধাপ (পূর্ববর্তী পাঠ শেষ করুন)" : item.titleBangla}
                              >
                                {isPassed ? (
                                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                ) : isCurrentNext ? (
                                  <Play className="w-5 h-5 text-white fill-current" />
                                ) : isLocked ? (
                                  <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                ) : (
                                  <span className="text-xs font-black">{item.orderIndex}</span>
                                )}
                              </motion.button>

                              {/* Minimalist Block Card: strictly displays ONLY XP, Marks, and Smart Time */}
                              <div
                                onClick={() => !isLocked && handleItemClick(item)}
                                className={`mt-2.5 px-3 py-1 rounded-full text-center max-w-[150px] transition-transform duration-200 ${
                                  isLocked
                                    ? "opacity-60 cursor-not-allowed bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/40"
                                    : isPassed
                                    ? "cursor-pointer bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 hover:-translate-y-0.5 hover:border-emerald-400/60"
                                    : isCurrentNext
                                    ? "cursor-pointer bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 hover:-translate-y-0.5 hover:border-indigo-400/60"
                                    : "cursor-pointer bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 hover:-translate-y-0.5 hover:border-indigo-400/60"
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-tight select-none">
                                  <span className="font-semibold text-amber-500 dark:text-amber-400">+{item.xpReward || 10} XP</span>
                                  <span className="text-slate-300 dark:text-slate-600 font-normal">•</span>
                                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">{getItemMarks(item)} Marks</span>
                                  <span className="text-slate-300 dark:text-slate-600 font-normal">•</span>
                                  <span className="text-slate-500 dark:text-slate-400 font-medium">{formatSmartTime(item)}</span>
                                </div>
                              </div>

                              {/* 1-to-5 Star Rating Display for Completed Blocks with Staggered Pop Animation */}
                              {isPassed && (() => {
                                const earnedStars = Math.max(1, Math.min(5, Number(item.progress?.stars) || 1));
                                return (
                                  <div
                                    className="mt-1 flex items-center justify-center gap-0.5"
                                    title={`${earnedStars} / 5 স্টার অর্জিত`}
                                  >
                                    {[1, 2, 3, 4, 5].map((starIdx) => {
                                      const isEarned = starIdx <= earnedStars;
                                      return (
                                        <motion.span
                                          key={starIdx}
                                          initial={{ scale: 0, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          transition={{
                                            type: "spring",
                                            stiffness: 450,
                                            damping: 18,
                                            delay: starIdx * 0.05,
                                          }}
                                        >
                                          <Star
                                            className={`w-3 h-3 ${
                                              isEarned
                                                ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.7)]"
                                                : "text-slate-300 dark:text-slate-700 fill-transparent"
                                            }`}
                                          />
                                        </motion.span>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>
                          </motion.div>

                          {/* Curved Serpentine SVG Road Connector to Next Node with Framer Motion Draw Animation */}
                          {idx < chapter.items.length - 1 && (() => {
                            const pathD =
                              idx % 4 === 0
                                ? "M 100 0 C 100 24, 45 24, 45 48"
                                : idx % 4 === 1
                                ? "M 45 0 C 45 24, 100 24, 100 48"
                                : idx % 4 === 2
                                ? "M 100 0 C 100 24, 155 24, 155 48"
                                : "M 155 0 C 155 24, 100 24, 100 48";

                            return (
                              <div className="w-full flex justify-center -my-3.5 pointer-events-none relative z-0">
                                <svg className="w-56 sm:w-72 h-14 overflow-visible" viewBox="0 0 200 48">
                                  <defs>
                                    <linearGradient id={`road-grad-${item.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="#06b6d4" />
                                      <stop offset="50%" stopColor="#6366f1" />
                                      <stop offset="100%" stopColor="#10b981" />
                                    </linearGradient>

                                    <filter id={`electric-glow-slp-${item.id}`} x="-20%" y="-20%" width="140%" height="140%">
                                      <feGaussianBlur stdDeviation="2" result="blur" />
                                      <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                      </feMerge>
                                    </filter>
                                  </defs>

                                  {/* Ambient background sleek guide track (Thin 2px) */}
                                  <path
                                    d={pathD}
                                    fill="none"
                                    stroke="currentColor"
                                    className="text-slate-200 dark:text-slate-800/80"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                  />

                                  {/* Completed solid sleek track with smooth pathLength draw animation */}
                                  {isPassed && (
                                    <motion.path
                                      d={pathD}
                                      fill="none"
                                      stroke="#10b981"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      className="filter drop-shadow-[0_0_3px_rgba(16,185,129,0.5)]"
                                      initial={{ pathLength: 0 }}
                                      animate={{ pathLength: 1 }}
                                      transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                  )}

                                  {/* Active Electric Glowing SVG Line */}
                                  {isCurrentNext && (
                                    <>
                                      {/* Glowing Underlayer with path drawing effect */}
                                      <motion.path
                                        d={pathD}
                                        fill="none"
                                        stroke={`url(#road-grad-${item.id})`}
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        opacity="0.6"
                                        filter={`url(#electric-glow-slp-${item.id})`}
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                      />

                                      {/* Moving Electric Line */}
                                      <motion.path
                                        d={pathD}
                                        fill="none"
                                        stroke={`url(#road-grad-${item.id})`}
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeDasharray="8 6"
                                        className="animate-svg-dash-flow filter drop-shadow-[0_0_5px_rgba(6,182,212,0.9)]"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.9, ease: "easeOut" }}
                                      >
                                        <animate
                                          attributeName="stroke-dashoffset"
                                          from="28"
                                          to="0"
                                          dur="1.2s"
                                          repeatCount="indefinite"
                                        />
                                      </motion.path>

                                      {/* Traveling Energy Light Photon */}
                                      <circle r="3" fill="#38bdf8" filter={`url(#electric-glow-slp-${item.id})`}>
                                        <animateMotion
                                          path={pathD}
                                          dur="1.6s"
                                          repeatCount="indefinite"
                                        />
                                      </circle>
                                      <circle r="1.5" fill="#ffffff">
                                        <animateMotion
                                          path={pathD}
                                          dur="1.6s"
                                          repeatCount="indefinite"
                                        />
                                      </circle>
                                    </>
                                  )}
                                </svg>
                              </div>
                            );
                          })()}
                        </React.Fragment>
                      );
                    })}
                  </motion.div>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: BLOG PART READER                                                 */}
      {/* ========================================================================= */}
      {activeBlogItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-3xl w-full rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    ব্লগ পাঠ {activeBlogItem.blogPartNumber} · {activeBlogItem.readTimeMinutes} মিনিট পড়ার সময়
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {activeBlogItem.titleBangla}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveBlogItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* International Story / Lesson Content Renderer */}
            <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <InternationalStoryLessonRenderer
                markdown={activeBlogItem.contentMarkdown || ""}
                titleBangla={activeBlogItem.titleBangla}
                summary={activeBlogItem.summary}
                keyTakeaways={activeBlogItem.keyTakeaways}
                durationMinutes={activeBlogItem.durationMinutes}
                readTimeMinutes={activeBlogItem.readTimeMinutes}
                xpReward={activeBlogItem.xpReward}
                blogPartNumber={activeBlogItem.blogPartNumber}
              />
            </div>

            {/* Attached Mini-Quiz / Comprehension Check with Sequential Locking */}
            {activeMiniQuiz && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-slate-800 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
                      <HelpCircle className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider block">
                        পাঠ সমাপ্তি মিনি কুইজ (Integrated Mini-Quiz)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        পরবর্তী ধাপ আনলক করতে সঠিক উত্তর দিন (মার্কস: {activeMiniQuiz.marks || 5})
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    +{activeBlogItem.xpReward} XP
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {activeMiniQuiz.questionText}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(activeMiniQuiz.options || []).map((opt, optIdx) => {
                    const isSelected = miniQuizSelectedOpt === optIdx;
                    const isCorrect = optIdx === activeMiniQuiz.correctOptionIndex;
                    let style =
                      "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-500";
                    if (miniQuizSubmitted) {
                      if (isCorrect)
                        style = "bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold";
                      else if (isSelected)
                        style = "bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300";
                    } else if (isSelected) {
                      style =
                        "bg-indigo-500/10 border-indigo-600 text-indigo-700 dark:text-indigo-300 font-bold ring-2 ring-indigo-500/20";
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => {
                          if (!miniQuizSubmitted) setMiniQuizSelectedOpt(optIdx);
                        }}
                        className={`p-2.5 rounded-xl border text-xs text-left transition flex items-center gap-2 cursor-pointer ${style}`}
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="truncate">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {!miniQuizSubmitted ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (miniQuizSelectedOpt === null) {
                        toast.error("অনুগ্রহ করে একটি উত্তর নির্বাচন করুন");
                        return;
                      }
                      setMiniQuizSubmitted(true);
                      const isCorrect =
                        miniQuizSelectedOpt === activeMiniQuiz.correctOptionIndex;
                      if (isCorrect) {
                        try {
                          confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
                        } catch {}
                        toast.success("চমৎকার! আপনার উত্তর সঠিক হয়েছে 🎉 এবার 'পাঠ সমাপ্ত' বাটনে ক্লিক করে পরবর্তী ধাপ আনলক করুন।");
                      } else {
                        toast.error("উত্তরটি সঠিক হয়নি। সঠিক ব্যাখ্যা দেখে পুনরায় চেষ্টা করুন।");
                      }
                    }}
                    disabled={miniQuizSelectedOpt === null}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    উত্তর নিশ্চিত করুন
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <span className="font-bold text-indigo-600 dark:text-cyan-400">ব্যাখ্যা:</span>
                    <p>{activeMiniQuiz.explanation || "সঠিক উত্তর নির্বাচন করা হয়েছে।"}</p>
                    {miniQuizSelectedOpt !== activeMiniQuiz.correctOptionIndex && (
                      <button
                        type="button"
                        onClick={() => {
                          setMiniQuizSubmitted(false);
                          setMiniQuizSelectedOpt(null);
                        }}
                        className="text-[11px] text-indigo-600 dark:text-cyan-400 font-bold underline cursor-pointer mt-1"
                      >
                        আবার চেষ্টা করুন
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500">
                  পুরস্কার: <strong className="text-amber-500 font-black">+{activeBlogItem.xpReward} XP</strong>
                  {activeMiniQuiz && (
                    <span className="ml-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      (মিনি কুইজ: +{activeMiniQuiz.marks || 5} মার্কস)
                    </span>
                  )}
                </span>
                {activeMiniQuiz && (!miniQuizSubmitted || miniQuizSelectedOpt !== activeMiniQuiz.correctOptionIndex) && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>পরবর্তী ধাপ আনলক করতে ওপরের মিনি কুইজের সঠিক উত্তর দিন</span>
                  </p>
                )}
              </div>

              <button
                onClick={handleCompleteBlogPart}
                disabled={completingBlog}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
              >
                {completingBlog ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Mark as Completed & Next ➔ (পাঠ সমাপ্ত ও পরবর্তী ধাপ আনলক)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INTERACTIVE STEP-BY-STEP QUIZ ARENA (ONE QUESTION AT A TIME)   */}
      {/* ========================================================================= */}
      {activeQuizItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl max-h-[94vh] overflow-y-auto">
            
            {/* Top Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      ধারাবাহিক কুইজ মূল্যায়ন
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      পাস মার্ক: {activeQuizItem.passingScore}% · সর্বোচ্চ চেষ্টা:{" "}
                      {activeQuizItem.attemptLimit > 0 ? `${activeQuizItem.attemptLimit} বার` : "সীমাহীন"}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                    {activeQuizItem.titleBangla}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveQuizItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ========================================================================= */}
            {/* VIEW A: COMPREHENSIVE FINAL PROGRESS DASHBOARD (AFTER QUIZ COMPLETION)    */}
            {/* ========================================================================= */}
            {quizResult ? (
              <div className="space-y-5 py-2">
                {/* Hero Result Banner */}
                <div
                  className={`p-6 rounded-2xl border text-center space-y-3 ${
                    quizResult.isPassed
                      ? "bg-gradient-to-b from-emerald-500/10 to-teal-500/5 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                      : "bg-gradient-to-b from-rose-500/10 to-amber-500/5 border-rose-500/30 text-rose-950 dark:text-rose-100"
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg ${
                      quizResult.isPassed
                        ? "bg-emerald-500 text-white shadow-emerald-500/30"
                        : "bg-rose-500 text-white shadow-rose-500/30"
                    }`}
                  >
                    {quizResult.isPassed ? <Trophy className="w-9 h-9" /> : <AlertCircle className="w-9 h-9" />}
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-slate-900 dark:text-white">
                      {quizResult.isPassed ? "অভিনন্দন! আপনি কুইজে উত্তীর্ণ হয়েছেন 🎉" : "দুঃখিত! পাস মার্ক অর্জিত হয়নি"}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {quizResult.isPassed
                        ? "আপনার ধারাবাহিক পাঠ্যক্রমের পরবর্তী ধাপ আনলক করা হয়েছে।"
                        : "পরবর্তী ধাপ আনলক করতে ন্যূনতম পাস মার্ক অর্জন আবশ্যক।"}
                    </p>
                  </div>

                  {quizResult.xpAwarded > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-xs font-black">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                      <span>+{quizResult.xpAwarded} XP প্রোফাইলে সফলভাবে যুক্ত হয়েছে!</span>
                    </div>
                  )}
                </div>

                {/* 4-Pillar Score & Gamification Analytics Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Pillar 1: Base Marks */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                      <Target className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">সঠিক উত্তর</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      +{quizResult.basePointsEarned || 0}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {quizResult.correctCount || 0}/{quizResult.totalQuestions || 0} টি সঠিক (+১০ প্রতিটিতে)
                    </p>
                  </div>

                  {/* Pillar 2: Negative Marks */}
                  <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1">
                    <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                      <XCircle className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">ভুল পেনাল্টি</span>
                    </div>
                    <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                      -{quizResult.negativePointsDeducted || 0}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {quizResult.wrongCount || 0} টি ভুল উত্তর (-৫ প্রতিটিতে)
                    </p>
                  </div>

                  {/* Pillar 3: Streak Bonus */}
                  <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1">
                    <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                      <Flame className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">স্ট্রিক বোনাস</span>
                    </div>
                    <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                      +{quizResult.streakBonusPoints || 0}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      সর্বোচ্চ {quizResult.highestStreak || 0}x স্ট্রিক কম্বো
                    </p>
                  </div>

                  {/* Pillar 4: Anti-Cheat Window Penalty */}
                  <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-1">
                    <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
                      <ShieldAlert className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">উইন্ডো পেনাল্টি</span>
                    </div>
                    <div className="text-lg font-black text-purple-600 dark:text-purple-400">
                      -{quizResult.windowPenaltyDeducted || 0}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {quizResult.windowViolationsCount || 0} বার কার্সার বাইরে (-৫ প্রতিবারে)
                    </p>
                  </div>
                </div>

                {/* Net Score & Passing Comparison Card */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block uppercase">সর্বমোট অর্জিত নেট স্কোর</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                          {quizResult.scorePercentage}%
                        </span>
                        <span className="text-xs text-slate-500">
                          ({quizResult.netScorePoints || 0} / {quizResult.maxPossiblePoints || 10} নেট পয়েন্ট)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-slate-500 block uppercase">পাস মার্ক থ্রেশহোল্ড</span>
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        {activeQuizItem.passingScore}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar with Passing Threshold Marker */}
                  <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${
                        quizResult.isPassed
                          ? "bg-gradient-to-r from-teal-500 to-emerald-500"
                          : "bg-gradient-to-r from-rose-500 to-amber-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, quizResult.scorePercentage))}%` }}
                    />
                  </div>
                </div>

                {/* Question-by-Question Review Toggle */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowFullReviewList(!showFullReviewList)}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <span>প্রশ্নোত্তর ডায়াগনস্টিক ও ব্যাখ্যা বিশ্লেষণ ({showFullReviewList ? "লুকান" : "দেখুন"})</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showFullReviewList ? "rotate-90" : ""}`} />
                  </button>

                  {showFullReviewList && (
                    <div className="space-y-3 pt-1 max-h-60 overflow-y-auto pr-1">
                      {(activeQuizItem.quizQuestions || []).map((q, idx) => {
                        const chosenOpt = quizAnswers[q.id];
                        const isCorrect = chosenOpt === q.correctOptionIndex;
                        return (
                          <div
                            key={q.id}
                            className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                              isCorrect
                                ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30"
                                : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-500/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {idx + 1}. {q.questionText}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                                  isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                }`}
                              >
                                {isCorrect ? "সঠিক (+১০)" : "ভুল (-৫)"}
                              </span>
                            </div>

                            <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                              <p>
                                <strong>আপনার উত্তর:</strong>{" "}
                                {chosenOpt !== undefined && q.options ? q.options[chosenOpt] : "উত্তর দেওয়া হয়নি"}
                              </p>
                              {!isCorrect && (
                                <p className="text-emerald-700 dark:text-emerald-400 font-bold">
                                  <strong>সঠিক উত্তর:</strong> {q.options ? q.options[q.correctOptionIndex ?? 0] : "N/A"}
                                </p>
                              )}
                              {q.explanation && (
                                <p className="text-slate-500 text-[10px] italic pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                                  💡 <strong>ব্যাখ্যা:</strong> {q.explanation}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Final Actions */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    {quizResult.attemptsRemaining !== null && (
                      <span>বাকি প্রচেষ্টা: <strong>{quizResult.attemptsRemaining} বার</strong></span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!quizResult.isPassed && quizResult.attemptsRemaining !== 0 && (
                      <button
                        onClick={() => {
                          setQuizResult(null);
                          setCurrentQuestionIndex(0);
                          setQuizAnswers({});
                          setSelectedOptionForCurrent(null);
                          setConfirmedQuestions({});
                          setConsecutiveStreak(0);
                          setHighestStreak(0);
                          setStreakBonus(0);
                          setWrongAnswersCount(0);
                          setWindowViolations(0);
                          setWindowPenalty(0);
                          setViolationAlert(null);
                          setShowFullReviewList(false);
                          setQuizStartTime(Date.now());
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>পুনরায় চেষ্টা করুন</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveQuizItem(null)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      {quizResult.isPassed ? "পরবর্তী পাঠে এগিয়ে যান" : "বন্ধ করুন"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* VIEW B: STEP-BY-STEP QUESTION PLAYER (ONE QUESTION AT A TIME)             */
              /* ========================================================================= */
              (() => {
                const questions = activeQuizItem.quizQuestions || [];
                const totalQ = questions.length;
                const currentQ = questions[currentQuestionIndex];
                const isConfirmed = !!(currentQ && confirmedQuestions[currentQ.id]);

                // Live dynamic points tracker
                const liveCorrectCount = Object.keys(confirmedQuestions).filter((qId) => {
                  const qObj = questions.find((x) => x.id === qId);
                  return qObj && quizAnswers[qId] === qObj.correctOptionIndex;
                }).length;
                const liveBaseScore = liveCorrectCount * 10;
                const liveNetScore = Math.max(
                  0,
                  liveBaseScore + streakBonus - wrongAnswersCount * 5 - windowPenalty
                );

                if (!currentQ) {
                  return (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      কোনো প্রশ্ন পাওয়া যায়নি।
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Real-time Anti-Cheat Violation Banner */}
                    {violationAlert && (
                      <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{violationAlert}</span>
                      </div>
                    )}

                    {/* Stepped Question Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>প্রশ্ন {currentQuestionIndex + 1} / {totalQ}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            (১ নাম্বার শেষ না হলে ২ নাম্বার আসবে না)
                          </span>
                        </span>
                        <span className="font-bold text-slate-500 text-[11px]">
                          অগ্রগতি: {Math.round(((currentQuestionIndex + (isConfirmed ? 1 : 0)) / totalQ) * 100)}%
                        </span>
                      </div>

                      {/* Interactive Step Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {questions.map((q, idx) => {
                          const qAnswered = !!confirmedQuestions[q.id];
                          const isCurrent = idx === currentQuestionIndex;
                          const isLocked = idx > currentQuestionIndex && !qAnswered;
                          const isCorrect = qAnswered && quizAnswers[q.id] === q.correctOptionIndex;

                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => handleJumpToQuestion(idx)}
                              disabled={isLocked}
                              className={`flex-1 min-w-[2.2rem] h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                                isLocked
                                  ? "cursor-not-allowed opacity-50 bg-slate-100 dark:bg-slate-800 text-slate-400 border border-dashed border-slate-300 dark:border-slate-700"
                                  : "cursor-pointer"
                              } ${
                                isCurrent
                                  ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400 dark:ring-indigo-500"
                                  : qAnswered
                                  ? isCorrect
                                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                    : "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700 hover:border-indigo-400"
                              }`}
                              title={isLocked ? "পূর্ববর্তী প্রশ্ন সমাধান করুন (Locked 🔒)" : `প্রশ্ন ${idx + 1}`}
                            >
                              {qAnswered ? (
                                isCorrect ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <span className="text-[10px]">✗</span>
                                )
                              ) : isLocked ? (
                                <Lock className="w-3 h-3 text-slate-400" />
                              ) : (
                                idx + 1
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Live Gamified HUD: Score, Streaks & Anti-Cheat */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {/* HUD 1: Net Points */}
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">বর্তমান পয়েন্ট</span>
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                          {liveNetScore}
                        </span>
                      </div>

                      {/* HUD 2: Streak Bonus */}
                      <div
                        className={`p-2 rounded-xl border transition-all ${
                          consecutiveStreak >= 2
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 animate-pulse"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="text-[9px] uppercase font-bold flex items-center justify-center gap-0.5">
                          <Flame className={`w-3 h-3 ${consecutiveStreak >= 2 ? "text-amber-500" : "text-slate-400"}`} />
                          <span>স্ট্রিক</span>
                        </span>
                        <span className="text-sm font-black font-mono">
                          {consecutiveStreak}x
                        </span>
                      </div>

                      {/* HUD 3: Wrong Answers Negative Points */}
                      <div className="p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400">
                        <span className="text-[9px] uppercase font-bold block">ভুল পেনাল্টি</span>
                        <span className="text-sm font-black font-mono">
                          -{wrongAnswersCount * 5}
                        </span>
                      </div>

                      {/* HUD 4: Cursor Window Penalty */}
                      <div
                        className={`p-2 rounded-xl border ${
                          windowViolations > 0
                            ? "bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-500"
                        }`}
                        title="কার্সার ব্রাউজার উইন্ডোর বাইরে গেলে প্রতিবারে -৫ পয়েন্ট কাটা হয়"
                      >
                        <span className="text-[9px] uppercase font-bold flex items-center justify-center gap-0.5">
                          <EyeOff className="w-3 h-3" />
                          <span>উইন্ডো ছাড়লে</span>
                        </span>
                        <span className="text-sm font-black font-mono">
                          -{windowPenalty}
                        </span>
                      </div>
                    </div>

                    {/* Active Question Box with Dynamic Multi-Type Quiz Engine */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50/70 dark:bg-slate-800/40">
                      <DynamicQuizQuestionView
                        question={currentQ}
                        questionIndex={currentQuestionIndex}
                        totalQuestions={totalQ}
                        selectedAnswer={isConfirmed ? quizAnswers[currentQ.id] : selectedOptionForCurrent}
                        onSelectAnswer={(ans) => {
                          if (!isConfirmed) {
                            setSelectedOptionForCurrent(ans);
                          }
                        }}
                        onConfirmAnswer={(ans) => {
                          if (ans !== undefined) {
                            setSelectedOptionForCurrent(ans);
                          }
                          handleConfirmCurrentQuestion();
                        }}
                        isConfirmed={isConfirmed}
                        isCorrect={
                          isConfirmed
                            ? (() => {
                                const qType = currentQ.questionType || "MCQ";
                                const ans = quizAnswers[currentQ.id];
                                if (qType === "TRUE_FALSE") {
                                  const studentBool =
                                    typeof ans === "boolean"
                                      ? ans
                                      : ans === 0 || String(ans).toLowerCase() === "true" || String(ans) === "সত্য";
                                  const exp =
                                    currentQ.correctBoolean !== undefined
                                      ? currentQ.correctBoolean
                                      : currentQ.correctOptionIndex === 0;
                                  return studentBool === exp;
                                }
                                if (qType === "FILL_BLANKS") {
                                  const bracketMatches = Array.from(
                                    currentQ.questionText.matchAll(/\[(.*?)\]/g)
                                  ).map((m) => m[1].trim());
                                  const targetBlanks =
                                    bracketMatches.length > 0
                                      ? bracketMatches
                                      : currentQ.acceptedAnswers || currentQ.options || [];

                                  if (typeof ans === "object" && ans !== null && !Array.isArray(ans)) {
                                    return targetBlanks.every((target, bIdx) => {
                                      const val = ans[bIdx] ?? ans[String(bIdx)] ?? ans[`blank_${bIdx}`] ?? "";
                                      return String(val).trim().toLowerCase() === target.trim().toLowerCase();
                                    });
                                  }
                                  const text = String(ans || "").trim().toLowerCase();
                                  const accepted = targetBlanks.map((a) => a.trim().toLowerCase());
                                  return accepted.includes(text);
                                }
                                if (qType === "MATCHING") {
                                  const userPairs = (ans as Record<string, string>) || {};
                                  const pairs = currentQ.matchingPairs || [];
                                  return (
                                    pairs.length > 0 &&
                                    pairs.every(
                                      (p) =>
                                        (userPairs[p.left] || "").trim().toLowerCase() ===
                                        p.right.trim().toLowerCase()
                                    )
                                  );
                                }
                                if (qType === "REORDER") {
                                  const expected = currentQ.correctOrder || currentQ.options || [];
                                  const studentArr = Array.isArray(ans) ? ans : [];
                                  return (
                                    expected.length > 0 &&
                                    studentArr.length === expected.length &&
                                    expected.every(
                                      (exp, i) =>
                                        String(exp).trim().toLowerCase() ===
                                        String(studentArr[i] || "").trim().toLowerCase()
                                    )
                                  );
                                }
                                return Number(ans) === currentQ.correctOptionIndex;
                              })()
                            : undefined
                        }
                      />

                      {/* Explanation Feedback Strip (Revealed after confirmation) */}
                      {isConfirmed && currentQ.explanation && (
                        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 space-y-1 animate-fade-in">
                          <span className="font-bold flex items-center gap-1 text-[11px] text-indigo-700 dark:text-indigo-300">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>প্রশ্নের সঠিক ব্যাখ্যা ও মূল বিষয়:</span>
                          </span>
                          <p className="leading-relaxed">{currentQ.explanation}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Bar (Confirmation / Strict Sequential Navigation) */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      {/* Left: Previous Question (Back is always allowed) */}
                      <button
                        type="button"
                        onClick={handlePrevQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>◀️ পূর্ববর্তী প্রশ্ন</span>
                      </button>

                      {/* Center: Realtime Forward Lock Indicator / Guidance */}
                      <div className="text-[11px] text-slate-500 font-medium text-center">
                        {!isConfirmed ? (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                            <Lock className="w-3.5 h-3.5" />
                            <span>সামনে যাওয়ার পূর্বে বর্তমান উত্তর নিশ্চিত করুন (Forward Locked 🔒)</span>
                          </span>
                        ) : currentQuestionIndex < totalQ - 1 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>উত্তর নিশ্চিত হয়েছে! পরবর্তী প্রশ্ন আনলকড ➔</span>
                          </span>
                        ) : (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5" />
                            <span>সকল প্রশ্ন সম্পন্ন! চূড়ান্ত ফলাফল দেখুন</span>
                          </span>
                        )}
                      </div>

                      {/* Right: Confirmation or Forward Next Question */}
                      <div className="flex items-center gap-2">
                        {!isConfirmed ? (
                          <button
                            type="button"
                            onClick={handleConfirmCurrentQuestion}
                            disabled={
                              selectedOptionForCurrent === null ||
                              selectedOptionForCurrent === undefined ||
                              selectedOptionForCurrent === ""
                            }
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>উত্তর নিশ্চিত করুন</span>
                          </button>
                        ) : currentQuestionIndex < totalQ - 1 ? (
                          <button
                            type="button"
                            onClick={handleNextQuestion}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <span>পরবর্তী প্রশ্নে যান</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSubmitCompleteQuiz}
                            disabled={submittingQuiz}
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                          >
                            {submittingQuiz ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trophy className="w-4 h-4" />
                            )}
                            <span>ফলাফল ও প্রগ্রেস বিশ্লেষণ দেখুন 🏆</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: FRIENDLY SOLOLEARN LOCKED ITEM MODAL / TOOLTIP                   */}
      {/* ========================================================================= */}
      {lockedModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl text-center">
            {/* Friendly Padlock Graphic */}
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30 shadow-inner">
              <Lock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-wider">
                Lesson Locked (পূর্বশর্ত পূরণ হয়নি)
              </span>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                এই পাঠটি এখনও লক করা রয়েছে
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                SoloLearn ধারাবাহিক কারিকুলাম নিয়ম অনুযায়ী পূর্ববর্তী পাঠগুলো ক্রমানুসারে সম্পন্ন না করে এই পাঠে প্রবেশ করা যাবে না।
              </p>
            </div>

            {/* Prerequisite Box */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-left space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                🔓 আনলক করার প্রয়োজনীয় শর্ত:
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {lockedModalItem.lockReason || "পূর্ববর্তী ধারাবাহিক পাঠ বা কুইজ সফলভাবে সম্পন্ন করুন।"}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {nextActiveLesson && (
                <button
                  onClick={() => {
                    const toOpen = nextActiveLesson.item;
                    setLockedModalItem(null);
                    handleItemClick(toOpen);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-500/25 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>সক্রিয় পাঠে ফিরে যান (Go to Active Lesson)</span>
                </button>
              )}

              <button
                onClick={() => setLockedModalItem(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                বুঝেছি (Got It)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Completion Certificate Modal */}
      {activeCourse && (
        <CourseCertificateModal
          isOpen={certificateModalOpen}
          onClose={() => setCertificateModalOpen(false)}
          studentName={studentName}
          studentRoll={studentRoll}
          courseTitle={activeCourse.title || activeCourse.titleBangla}
          courseTitleBangla={activeCourse.titleBangla}
          className={activeCourse.className || "কারিগরি শাখা"}
          tradeName={activeCourse.tradeName || "জেনারেল ভোকেশনাল"}
          earnedXp={activeCourse.totalEarnedXp || 350}
          totalStars={activeCourse.totalEarnedStars || 5}
        />
      )}
    </div>
  );
}
