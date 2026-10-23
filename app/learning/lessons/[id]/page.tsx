"use client";

import React, { useState, useEffect, useMemo, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildChapterUrl, buildLessonUrl } from "@/lib/learningSlugService";

import {
  BookOpen,
  Award,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  User,
  LogOut,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Check,
  ShieldAlert,
  Eye,
  FileText,
  Loader2,
  Play,
  Trophy,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import StudentLoginModal from "@/components/auth/StudentLoginModal";
import {
  getActiveStudentAccount,
  logoutStudentAccount,
  StudentAuthAccount,
  getGuestSessionId,
  getGuestLearningProgress,
  saveGuestLearningProgress,
  getGuestResumePoint,
  saveGuestResumePoint,
  saveStudentResumePoint,
  syncGuestProgressToStudent,
  getStudentLeaderboard,
} from "@/lib/studentIntelligenceStore";
import { safeFetchJson } from "@/lib/safeFetch";
import {
  CourseChapterItem,
  ChapterContentItemData,
  QuizQuestionItem,
} from "@/lib/chapterLearningEngine";
import confetti from "canvas-confetti";
import { InternationalStoryLessonRenderer } from "@/components/learning/InternationalStoryLessonRenderer";
import { CurvedPathwayRoadmap } from "@/components/learning/CurvedPathwayRoadmap";
import StudentLearningLeaderboard from "@/components/learning/StudentLearningLeaderboard";

// Dynamic Themes for Quiz Questions (cycling per question with distinct glow, badges & accents)
const QUESTION_THEMES = [
  {
    themeName: "সাইবার ব্লু",
    badgeBg: "bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800",
    glowCard: "border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.12)]",
    stepActive: "bg-cyan-500 text-slate-950 border-cyan-400 ring-2 ring-cyan-500/40 shadow-cyan-500/30",
    optHover: "hover:border-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30",
    optSelected: "bg-cyan-50 dark:bg-cyan-950/70 border-cyan-500 text-cyan-950 dark:text-cyan-100 ring-2 ring-cyan-500/40 shadow-cyan-500/20",
    indicatorSelected: "bg-cyan-500 text-slate-950 border-cyan-400 font-black",
  },
  {
    themeName: "রয়্যাল পার্পল",
    badgeBg: "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800",
    glowCard: "border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.12)]",
    stepActive: "bg-purple-500 text-white border-purple-400 ring-2 ring-purple-500/40 shadow-purple-500/30",
    optHover: "hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/30",
    optSelected: "bg-purple-50 dark:bg-purple-950/70 border-purple-500 text-purple-950 dark:text-purple-100 ring-2 ring-purple-500/40 shadow-purple-500/20",
    indicatorSelected: "bg-purple-500 text-white border-purple-400 font-black",
  },
  {
    themeName: "গোল্ডেন সানসেট",
    badgeBg: "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    glowCard: "border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.12)]",
    stepActive: "bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-500/40 shadow-amber-500/30",
    optHover: "hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/30",
    optSelected: "bg-amber-50 dark:bg-amber-950/70 border-amber-500 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500/40 shadow-amber-500/20",
    indicatorSelected: "bg-amber-500 text-slate-950 border-amber-400 font-black",
  },
  {
    themeName: "এমারেল্ড ম্যাট্রিক্স",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    glowCard: "border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.12)]",
    stepActive: "bg-emerald-500 text-white border-emerald-400 ring-2 ring-emerald-500/40 shadow-emerald-500/30",
    optHover: "hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30",
    optSelected: "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/40 shadow-emerald-500/20",
    indicatorSelected: "bg-emerald-500 text-white border-emerald-400 font-black",
  },
  {
    themeName: "রুবি এনার্জি",
    badgeBg: "bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800",
    glowCard: "border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.12)]",
    stepActive: "bg-rose-500 text-white border-rose-400 ring-2 ring-rose-500/40 shadow-rose-500/30",
    optHover: "hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30",
    optSelected: "bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/40 shadow-rose-500/20",
    indicatorSelected: "bg-rose-500 text-white border-rose-400 font-black",
  },
];

interface LessonPageProps {
  params: Promise<{ id: string }>;
}

export default function LessonDetailsPage({ params }: LessonPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [chapter, setChapter] = useState<CourseChapterItem | null>(null);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Item in Sequence
  const [activeItemId, setActiveItemId] = useState<number | null>(null);

  // Student auth
  const [activeStudent, setActiveStudent] = useState<StudentAuthAccount | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Blog reading status
  const [completingBlog, setCompletingBlog] = useState(false);

  // Quiz active state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(300);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  // Shuffled options map for anti-memorization randomization on quiz starts/retakes
  // Key: question ID, Value: array of { text: string; originalIndex: number }
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState<
    Record<string, { text: string; originalIndex: number }[]>
  >({});

  // ANTI-CHEAT TAB SWITCH TRACKING
  // Question IDs where student switched browser tab during quiz
  const [tabSwitchedQuestionIds, setTabSwitchedQuestionIds] = useState<string[]>([]);
  const [tabSwitchAlert, setTabSwitchAlert] = useState<{
    show: boolean;
    questionNumber: number;
    questionId: string;
  } | null>(null);

  // Navigation, Loader & Curving Roadmap Modal States
  const [navigatingItemId, setNavigatingItemId] = useState<number | null>(null);
  const [startingQuiz, setStartingQuiz] = useState(false);
  const [showMobileRoadmap, setShowMobileRoadmap] = useState(true);
  const [lockedModalItem, setLockedModalItem] = useState<{
    item: ChapterContentItemData;
    reason: string;
  } | null>(null);

  // Leaderboard Modal State
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);

  // Reading Countdown Timer State (Required 8s countdown for uncompleted blogs)
  const [readingSecondsLeft, setReadingSecondsLeft] = useState<number>(0);

  // Sync active student on mount
  useEffect(() => {
    setActiveStudent(getActiveStudentAccount());

    const handleAuthEvent = () => {
      setActiveStudent(getActiveStudentAccount());
    };

    window.addEventListener("ptsc_student_auth_changed", handleAuthEvent);
    window.addEventListener("ptsc_student_logout", handleAuthEvent);
    return () => {
      window.removeEventListener("ptsc_student_auth_changed", handleAuthEvent);
      window.removeEventListener("ptsc_student_logout", handleAuthEvent);
    };
  }, []);

  // Fetch Chapter and its content items
  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      const guestId = getGuestSessionId();
      const studentRoll = activeStudent?.rollNumber || guestId;
      const url = `/api/learning/chapters/${id}?studentRoll=${encodeURIComponent(studentRoll)}`;
      const data = await safeFetchJson(url);
      if (data.success && data.chapter) {
        setChapter(data.chapter);
        setCourseInfo(data.course);

        if (data.course && data.chapter) {
          const activeItem =
            data.chapter.items?.find(
              (it: any) => !it.isLocked && !it.progress?.isPassed && it.progress?.status !== "COMPLETED"
            ) ||
            data.chapter.items?.find((it: any) => !it.isLocked) ||
            data.chapter.items?.[0];

          if (activeItem) {
            router.replace(buildLessonUrl(data.course, data.chapter, activeItem));
          } else {
            router.replace(buildChapterUrl(data.course, data.chapter));
          }
          return;
        }

        // Set default active item if not set
        if (data.chapter.items && data.chapter.items.length > 0) {
          setActiveItemId((prev) => (prev ? prev : data.chapter.items[0].id));
        }
      } else {
        setError(data.error || "লেসনের তথ্য পাওয়া যায়নি");
      }
    } catch (err: any) {
      console.error("Failed to load lesson:", err);
      setError("সার্ভার থেকে লেসনের তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson();
  }, [id, activeStudent?.rollNumber]);

  // Current active item
  const activeItem = useMemo(() => {
    if (!chapter?.items || !activeItemId) return null;
    return chapter.items.find((item) => item.id === activeItemId) || chapter.items[0];
  }, [chapter, activeItemId]);

  // Auto-save learning resume point whenever student or guest opens an item
  useEffect(() => {
    if (activeItem && chapter && courseInfo) {
      if (activeStudent) {
        saveStudentResumePoint(activeStudent.rollNumber, {
          courseId: courseInfo.id,
          courseTitle: courseInfo.titleBangla,
          chapterId: chapter.id,
          chapterTitle: chapter.titleBangla,
          itemId: activeItem.id,
          itemTitle: activeItem.titleBangla,
        });
      } else {
        saveGuestResumePoint({
          courseId: courseInfo.id,
          courseTitle: courseInfo.titleBangla,
          chapterId: chapter.id,
          chapterTitle: chapter.titleBangla,
          itemId: activeItem.id,
          itemTitle: activeItem.titleBangla,
        });
      }
    }
  }, [activeItem?.id, chapter?.id, courseInfo?.id, activeStudent?.rollNumber]);

  // Current active item index and adjacent items
  const activeItemIndex = useMemo(() => {
    if (!chapter?.items || !activeItem) return 0;
    return chapter.items.findIndex((it) => it.id === activeItem.id);
  }, [chapter, activeItem]);

  const nextItem = useMemo(() => {
    if (!chapter?.items) return null;
    return chapter.items[activeItemIndex + 1] || null;
  }, [chapter, activeItemIndex]);

  const prevItem = useMemo(() => {
    if (!chapter?.items) return null;
    return chapter.items[activeItemIndex - 1] || null;
  }, [chapter, activeItemIndex]);

  // Current student rank and merit score info for header badge
  const currentStudentRankInfo = useMemo(() => {
    if (!activeStudent?.rollNumber) return null;
    try {
      const list = getStudentLeaderboard("all", "all");
      const found = list.find((s) => s.rollNumber === activeStudent.rollNumber);
      return found ? { rank: found.rank, totalScore: found.totalScore, streakDays: found.streakDays } : null;
    } catch {
      return null;
    }
  }, [activeStudent?.rollNumber]);

  // Reading countdown timer enforcement: uncompleted blogs must be read for at least 8 seconds
  useEffect(() => {
    if (activeItem && activeItem.itemType === "BLOG_PART") {
      const isPassed =
        (activeItem as any).progress?.isPassed === true ||
        (activeItem as any).progress?.status === "COMPLETED" ||
        Boolean((activeItem as any).progress?.completedAt);

      if (isPassed) {
        setReadingSecondsLeft(0);
      } else {
        setReadingSecondsLeft(8);
      }
    } else {
      setReadingSecondsLeft(0);
    }
  }, [activeItem?.id, (activeItem as any)?.progress?.isPassed, (activeItem as any)?.progress?.status]);

  useEffect(() => {
    if (readingSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setReadingSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [readingSecondsLeft]);

  // Restore any persisted tab switch infractions from sessionStorage on quiz start
  useEffect(() => {
    if (quizStarted && activeItem && activeStudent) {
      try {
        const key = `ptsc_tab_switched_${activeItem.id}_${activeStudent.rollNumber}`;
        const saved = sessionStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setTabSwitchedQuestionIds(parsed);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [quizStarted, activeItem?.id, activeStudent?.rollNumber]);

  // BROWSER TAB SWITCH & VISIBILITY CHANGE DETECTION DURING QUIZ
  // Requirement 4:
  // - Quiz চলাকালে শিক্ষার্থী যে প্রশ্নের উত্তর দিচ্ছে, সেই অবস্থায় Browser-এর অন্য Tab-এ গেলে বা Switch করলে সনাক্ত হবে।
  // - যে নির্দিষ্ট প্রশ্ন চলাকালে Tab পরিবর্তন হয়েছে, শুধু সেই প্রশ্নের নম্বর ০ হবে।
  // - Browser visibilitychange & focus detection
  useEffect(() => {
    if (!quizStarted || !activeItem || activeItem.itemType !== "QUIZ" || quizResult) {
      return;
    }

    const questions = activeItem.quizQuestions || [];
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const handleTabChangeViolation = () => {
      const qId = currentQuestion.id;
      const qNum = currentQuestionIndex + 1;

      setTabSwitchedQuestionIds((prev) => {
        if (prev.includes(qId)) return prev;
        const updated = [...prev, qId];

        // Persist in sessionStorage so page refresh cannot erase the penalty
        if (activeStudent) {
          try {
            const storageKey = `ptsc_tab_switched_${activeItem.id}_${activeStudent.rollNumber}`;
            sessionStorage.setItem(storageKey, JSON.stringify(updated));
          } catch (e) {
            console.error(e);
          }
        }

        return updated;
      });

      // Trigger user-facing alert
      setTabSwitchAlert({
        show: true,
        questionNumber: qNum,
        questionId: qId,
      });
    };

    const handleVisibilityChange = () => {
      // Only penalize if user truly switched away to another browser tab or minimized window
      if (document.hidden && document.visibilityState === "hidden") {
        handleTabChangeViolation();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [quizStarted, activeItem, currentQuestionIndex, quizResult, activeStudent]);

  // Quiz Countdown Timer
  useEffect(() => {
    if (!quizStarted || quizResult || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuizAuto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, quizResult, timeLeft]);

  // Select Option for Question
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (quizResult) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Start Quiz (Strict student login enforcement & Anti-Memorization Option Shuffling)
  const handleStartQuiz = () => {
    if (!activeStudent) {
      setLoginModalOpen(true);
      return;
    }
    setStartingQuiz(true);

    // Dynamic Option Randomization / Shuffling on every start or retake
    const newShuffled: Record<string, { text: string; originalIndex: number }[]> = {};
    (activeItem?.quizQuestions || []).forEach((q) => {
      const indexed = q.options.map((opt, i) => ({ text: opt, originalIndex: i }));
      // Fisher-Yates modern shuffle algorithm
      for (let i = indexed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
      }
      newShuffled[q.id] = indexed;
    });
    setShuffledOptionsMap(newShuffled);

    setTimeout(() => {
      setQuizStarted(true);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setQuizResult(null);
      setTimeLeft(activeItem?.timeLimitSeconds || 300);
      setStartingQuiz(false);
    }, 150);
  };

  // Submit Quiz to Backend with Student & Guest Persistence
  const handleSubmitQuiz = async () => {
    if (!activeItem) return;
    if (!activeStudent) {
      setLoginModalOpen(true);
      return;
    }
    try {
      setQuizSubmitting(true);
      const guestId = getGuestSessionId();
      const roll = activeStudent.rollNumber;
      const name = activeStudent.studentName;

      const data = await safeFetchJson(`/api/learning/items/${activeItem.id}/submit-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentRoll: roll,
          guestSessionId: guestId,
          studentName: name,
          answers: selectedAnswers,
          timeSpentSeconds: (activeItem.timeLimitSeconds || 300) - timeLeft,
          tabSwitchedQuestionIds, // Sent to backend for server-side score zeroing!
        }),
      });

      if (data.success) {
        setQuizResult(data);
        // Clear session storage penalty record once successfully submitted
        try {
          sessionStorage.removeItem(`ptsc_tab_switched_${activeItem.id}_${roll}`);
        } catch (e) {
          console.error(e);
        }

        // 1. Logged-in Student Persistence
        if (activeStudent) {
          saveStudentResumePoint(activeStudent.rollNumber, {
            courseId: courseInfo?.id,
            courseTitle: courseInfo?.titleBangla,
            chapterId: chapter?.id,
            chapterTitle: chapter?.titleBangla,
            itemId: activeItem.id,
            itemTitle: activeItem.titleBangla,
          });
        } else {
          // 2. Guest User Persistence in localStorage
          saveGuestLearningProgress({
            completedItemIds: data.isPassed ? [activeItem.id] : [],
            quizScores: {
              [activeItem.id]: {
                score: data.scorePercentage,
                isPassed: data.isPassed,
                totalQuestions: data.totalQuestions,
                attempts: 1,
              },
            },
            totalXp: data.xpAwarded || 0,
          });
          saveGuestResumePoint({
            courseId: courseInfo?.id,
            courseTitle: courseInfo?.titleBangla,
            chapterId: chapter?.id,
            chapterTitle: chapter?.titleBangla,
            itemId: activeItem.id,
            itemTitle: activeItem.titleBangla,
          });
        }

        // Celebrate with confetti if passed
        if (data.isPassed) {
          try {
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 },
              colors: ["#10b981", "#06b6d4", "#6366f1", "#f59e0b"],
            });
          } catch {}
        }

        // Refresh lesson progress
        fetchLesson();
      } else {
        alert(data.error || "কুইজ সাবমিট করতে সমস্যা হয়েছে");
      }
    } catch (err) {
      console.error("Submit quiz error:", err);
      alert("সার্ভারে সংযোগ বিচ্ছিন্ন হয়েছে");
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleSubmitQuizAuto = () => {
    handleSubmitQuiz();
  };

  // Complete Blog Part handler (Student persistent progression)
  const handleCompleteBlog = async () => {
    if (!activeItem) return;
    if (!activeStudent) {
      setLoginModalOpen(true);
      return;
    }
    try {
      setCompletingBlog(true);
      const roll = activeStudent.rollNumber;
      const name = activeStudent.studentName;

      await safeFetchJson(`/api/learning/items/${activeItem.id}/complete-blog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentRoll: roll,
          studentName: name,
        }),
      });

      // Save progression & resume points
      if (activeStudent) {
        saveStudentResumePoint(activeStudent.rollNumber, {
          courseId: courseInfo?.id,
          courseTitle: courseInfo?.titleBangla,
          chapterId: chapter?.id,
          chapterTitle: chapter?.titleBangla,
          itemId: activeItem.id,
          itemTitle: activeItem.titleBangla,
        });
      } else {
        saveGuestLearningProgress({
          completedItemIds: [activeItem.id],
          totalXp: 50,
        });
        saveGuestResumePoint({
          courseId: courseInfo?.id,
          courseTitle: courseInfo?.titleBangla,
          chapterId: chapter?.id,
          chapterTitle: chapter?.titleBangla,
          itemId: activeItem.id,
          itemTitle: activeItem.titleBangla,
        });
      }

      // Celebrate with canvas-confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#06b6d4", "#10b981", "#6366f1", "#f59e0b", "#ec4899"],
        });
      } catch {}

      // Refresh lesson and advance to next item
      await fetchLesson();
      if (nextItem) {
        setActiveItemId(nextItem.id);
        setQuizStarted(false);
        setQuizResult(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingBlog(false);
    }
  };

  // Switch to item in sequence (Strict sequential forward locking & permanent unlocked state)
  const handleSelectSequenceItem = (item: ChapterContentItemData) => {
    if (!chapter) return;
    const targetIdx = chapter.items.findIndex((it) => it.id === item.id);
    if (targetIdx < 0) return;

    const isItemPassed = (it: ChapterContentItemData) => {
      const enriched = it as any;
      return (
        enriched.progress?.isPassed === true ||
        enriched.progress?.status === "COMPLETED" ||
        Boolean(enriched.progress?.completedAt)
      );
    };

    const isTargetPassed = isItemPassed(item);
    const isPrevPassed =
      targetIdx === 0 || isItemPassed(chapter.items[targetIdx - 1]);

    // An item is unlocked if it was already completed OR if the immediately preceding item was completed
    const isUnlocked = isTargetPassed || isPrevPassed;

    if (!isUnlocked) {
      setLockedModalItem({
        item,
        reason:
          "ধারাবাহিক কারিকুলাম নিয়ম অনুযায়ী পূর্ববর্তী ধাপ সফলভাবে সম্পন্ন না করে পরবর্তী ধাপে যাওয়া যাবে না (Forward Locked 🔒)।",
      });
      return;
    }

    setActiveItemId(item.id);
    setQuizStarted(false);
    setQuizResult(null);
    setTabSwitchAlert(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white transition-colors duration-200 overflow-x-clip">
      <PublicHeader />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-5 animate-fade-in">
        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            হোম
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
          <Link href="/learning" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            বিষয় ফিল্টার
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
          {courseInfo && (
            <>
              <Link
                href={`/learning/subjects/${courseInfo.id}`}
                className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors truncate max-w-xs"
              >
                {courseInfo.titleBangla}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
            </>
          )}
          <span className="text-cyan-600 dark:text-cyan-300 font-bold truncate max-w-xs">
            {chapter ? chapter.titleBangla : "অধ্যায় বিবরণী"}
          </span>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="p-12 sm:p-16 text-center bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">পাঠ্যসূচির কনটেন্ট লোড হচ্ছে...</p>
          </div>
        ) : error || !chapter ? (
          <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900/80 rounded-2xl border border-rose-200 dark:border-rose-900/40 space-y-3 shadow-sm">
            <p className="text-rose-600 dark:text-rose-400 font-bold text-sm">{error || "অধ্যায় পাওয়া যায়নি"}</p>
            <Link
              href="/learning"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>বিষয় ফিল্টারে ফিরে যান</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Lesson Header Banner - Compact & Modern */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-5 sm:p-7 shadow-lg text-white">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-black">
                      অধ্যায় {chapter.chapterNumber}
                    </span>
                    {courseInfo && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                        {courseInfo.titleBangla} ({courseInfo.code})
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {chapter.titleBangla}
                  </h1>
                  {chapter.description && (
                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                      {chapter.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* Student Personal Rank Chip */}
                  {currentStudentRankInfo ? (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
                      <Trophy className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span>ক্লাস র‍্যাঙ্ক #{currentStudentRankInfo.rank}</span>
                      <span className="text-slate-400 font-normal">•</span>
                      <span className="font-mono text-cyan-300">{currentStudentRankInfo.totalScore} XP</span>
                    </div>
                  ) : activeStudent ? (
                    <div className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>রোল: {activeStudent.rollNumber}</span>
                    </div>
                  ) : null}

                  {/* Leaderboard Modal Trigger Button */}
                  <button
                    onClick={() => setLeaderboardModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    <Trophy className="w-3.5 h-3.5 fill-current text-slate-950" />
                    <span>🏆 লিডারবোর্ড</span>
                  </button>

                  {/* Back to Subject Link */}
                  {courseInfo && (
                    <Link
                      href={`/learning/subjects/${courseInfo.id}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>বিষয়ের সকল অধ্যায়</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* DUAL-COLUMN SPLIT LAYOUT: FIXED STICKY PATHWAY (LEFT) + INDEPENDENT SCROLLING STORY/QUIZ (RIGHT) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-1">
              {/* LEFT COLUMN: Fixed Sticky Curving Road Map Panel */}
              <div className="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {/* Animated Serpentine Road Map */}
                <div className="block">
                  <CurvedPathwayRoadmap
                    items={chapter.items}
                    activeItemId={activeItem?.id || null}
                    onSelectItem={handleSelectSequenceItem}
                    onLockedClick={(item, reason) => setLockedModalItem({ item, reason })}
                    progressPercentage={
                      (chapter as any).progressPercentage ||
                      Math.round((activeItemIndex / Math.max(1, chapter.items.length)) * 100)
                    }
                    completedCount={(chapter as any).completedItemsCount || activeItemIndex}
                    totalCount={chapter.items.length}
                  />
                </div>
              </div>

              {/* RIGHT COLUMN: Independent Scrolling Reading & Quiz Arena */}
              <div className="lg:col-span-8 xl:col-span-8 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto pr-1 space-y-5 custom-scrollbar">
                {/* TAB SWITCH ALERT WARNING MODAL / TOAST */}
                {tabSwitchAlert && tabSwitchAlert.show && (
                  <div className="bg-rose-50 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-500/50 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3 animate-shake">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-black text-rose-900 dark:text-rose-200">
                          ⚠️ ব্রাউজার ট্যাব পরিবর্তন সনাক্ত হয়েছে!
                        </h4>
                        <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-sans">
                          আপনি প্রশ্ন নং <strong>{tabSwitchAlert.questionNumber}</strong>-এ থাকা অবস্থায় ব্রাউজারের অন্য ট্যাবে গিয়েছেন। নিয়ম অনুযায়ী <strong>শুধু এই নির্দিষ্ট প্রশ্নটির নম্বর ০ (শূন্য)</strong> হবে। উত্তর সঠিক হলেও নম্বর কাটা যাবে। তবে অন্যান্য প্রশ্নসমূহের নম্বর স্বাভাবিক থাকবে।
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setTabSwitchAlert(null)}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 cursor-pointer transition-colors"
                    >
                      বুঝেছি
                    </button>
                  </div>
                )}

                {/* MAIN CONTENT AREA */}
                {activeItem && (
                  <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-6">
                    {/* ITEM HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                              activeItem.itemType === "BLOG_PART"
                                ? "bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800"
                                : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            {activeItem.itemType === "BLOG_PART"
                              ? `ব্লগ পার্ট ${activeItem.blogPartNumber || activeItemIndex + 1}`
                              : "বাধ্যতামূলক কুইজ পরীক্ষা"}
                          </span>
                          {activeItem.durationMinutes && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{activeItem.durationMinutes} মিনিট</span>
                            </span>
                          )}
                          <span className="text-xs text-amber-500 font-bold flex items-center gap-1 font-mono">
                            <Zap className="w-3.5 h-3.5" />
                            <span>+{activeItem.xpReward} XP</span>
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                          {activeItem.titleBangla || activeItem.title}
                        </h2>
                      </div>

                      {/* Student Auth Chip */}
                      <div className="shrink-0 flex items-center gap-2">
                        {activeStudent ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <User className="w-3.5 h-3.5 text-emerald-500" />
                            <span>
                              {activeStudent.studentName} ({activeStudent.rollNumber})
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setLoginModalOpen(true)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-600/20 hover:bg-cyan-100 dark:hover:bg-cyan-600/30 border border-cyan-300 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>লগইন করুন</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 1. BLOG PART VIEW (International EdTech Story Format) */}
                    {activeItem.itemType === "BLOG_PART" && (
                      <div className="space-y-6">
                        {/* International Story/Lesson Content Renderer */}
                        <InternationalStoryLessonRenderer
                          markdown={activeItem.contentMarkdown || ""}
                          titleBangla={activeItem.titleBangla}
                          summary={activeItem.summary}
                          keyTakeaways={activeItem.keyTakeaways}
                          durationMinutes={activeItem.durationMinutes}
                          readTimeMinutes={activeItem.readTimeMinutes}
                          xpReward={activeItem.xpReward}
                          blogPartNumber={activeItem.blogPartNumber || activeItemIndex + 1}
                        />

                        {/* Action Bar for Blog with Instant Button Loaders */}
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                          {prevItem ? (
                            <button
                              onClick={() => {
                                setNavigatingItemId(prevItem.id);
                                handleSelectSequenceItem(prevItem);
                                setTimeout(() => setNavigatingItemId(null), 300);
                              }}
                              disabled={navigatingItemId === prevItem.id}
                              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                            >
                              {navigatingItemId === prevItem.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ArrowLeft className="w-3.5 h-3.5" />
                              )}
                              <span>পূর্ববর্তী পার্ট</span>
                            </button>
                          ) : (
                            <div />
                          )}

                          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                            {(() => {
                              const isCurrentPassed =
                                (activeItem as any).progress?.isPassed === true ||
                                (activeItem as any).progress?.status === "COMPLETED" ||
                                Boolean((activeItem as any).progress?.completedAt);

                              // 1. Reading Timer Countdown Gate for uncompleted blogs
                              if (!isCurrentPassed && readingSecondsLeft > 0) {
                                return (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                                      <span>পড়ার সময় বাকি: {readingSecondsLeft} সে.</span>
                                    </div>
                                    <button
                                      disabled={true}
                                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-300 dark:border-slate-700"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>মনোযোগ দিয়ে পড়ুন ({readingSecondsLeft}s)</span>
                                    </button>
                                  </div>
                                );
                              }

                              // 2. Strict flow to mandatory Quiz (No skip allowed)
                              if (nextItem && nextItem.itemType === "QUIZ") {
                                return (
                                  <button
                                    onClick={handleCompleteBlog}
                                    disabled={completingBlog}
                                    className={`w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 dark:text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer transition-all disabled:opacity-60 ${
                                      completingBlog ? "opacity-75 cursor-wait" : "active:scale-95"
                                    }`}
                                  >
                                    {completingBlog ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>কুইজ লোড হচ্ছে...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Award className="w-3.5 h-3.5" />
                                        <span>কুইজে অংশ নিন ➔</span>
                                      </>
                                    )}
                                  </button>
                                );
                              }

                              // 3. Complete and advance to next blog part
                              if (nextItem) {
                                return (
                                  <button
                                    onClick={handleCompleteBlog}
                                    disabled={completingBlog}
                                    className={`w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all disabled:opacity-60 ${
                                      completingBlog ? "opacity-75 cursor-wait" : "active:scale-95"
                                    }`}
                                  >
                                    {completingBlog ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                        <span>পাঠ সম্পন্ন হচ্ছে...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                        <span>পরবর্তী পার্ট ➔</span>
                                      </>
                                    )}
                                  </button>
                                );
                              }

                              // 4. End of Chapter milestone reached
                              return (
                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>আপনি এই অধ্যায়ের শেষ অংশে পৌঁছেছেন! 🎉</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                {/* 2. QUIZ VIEW */}
                {activeItem.itemType === "QUIZ" && (
                  <div className="space-y-5">
                    {/* MANDATORY LOGIN WARNING IF NOT LOGGED IN */}
                    {!activeStudent ? (
                      <div className="p-6 sm:p-8 text-center bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-amber-300 dark:border-amber-500/40 space-y-4">
                        <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                        <div className="space-y-1.5 max-w-md mx-auto">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                            কুইজ দেওয়ার জন্য শিক্ষার্থী লগইন বাধ্যতামূলক
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                            কুইজের প্রতিটি প্রশ্নের স্কোর ও অগ্রগতি ডাটাবেজে রেকর্ড করা হয়। পরীক্ষায় অংশ নিতে অনুগ্রহ করে আপনার রোল ও পাসওয়ার্ড দিয়ে লগইন করুন।
                          </p>
                        </div>
                        <button
                          onClick={() => setLoginModalOpen(true)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 mx-auto shadow-sm hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>লগইন করুন</span>
                        </button>
                      </div>
                    ) : !quizStarted ? (
                      /* Quiz Intro Card before starting */
                      <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
                        <div className="space-y-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/40 text-indigo-800 dark:text-indigo-300 text-xs font-black inline-block">
                            কুইজ মূল্যায়ন
                          </span>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">
                            {activeItem.titleBangla}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-sans">
                            এই কুইজটিতে মোট <strong>{activeItem.quizQuestions?.length || 0}</strong> টি বহুনির্বাচনী প্রশ্ন রয়েছে। পরবর্তী ধাপে যেতে নূন্যতম <strong>{activeItem.passingScore}%</strong> স্কোর প্রয়োজন।
                          </p>
                        </div>

                        {/* Quiz Anti-Cheat Rules Box */}
                        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 space-y-1.5 text-xs">
                          <span className="font-black text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>ট্যাব পরিবর্তন প্রতিরোধ নিয়ম:</span>
                          </span>
                          <ul className="list-disc list-inside text-rose-700 dark:text-rose-200/90 space-y-1 leading-relaxed font-sans">
                            <li>কুইজ চলাকালে ব্রাউজারের অন্য কোনো ট্যাবে গেলে সেই নির্দিষ্ট প্রশ্নের নম্বর ০ (শূন্য) হবে।</li>
                            <li>অন্যান্য প্রশ্নসমূহের নম্বর স্বাভাবিক নিয়মে গণনা করা হবে।</li>
                            <li>পেজ রিফ্রেশ বা ট্যাব রিলোড করলেও সিস্টেম স্বয়ংক্রিয়ভাবে বিষয়টি যাচাই করে।</li>
                          </ul>
                        </div>

                        {/* Quiz Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">মোট প্রশ্ন</span>
                            <span className="text-slate-900 dark:text-white text-sm font-mono">{activeItem.quizQuestions?.length || 0} টি</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">সময়সীমা</span>
                            <span className="text-slate-900 dark:text-white text-sm font-mono">{Math.floor((activeItem.timeLimitSeconds || 300) / 60)} মিনিট</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">পাসিং স্কোর</span>
                            <span className="text-slate-900 dark:text-white text-sm font-mono">{activeItem.passingScore}%</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">রিওয়ার্ড</span>
                            <span className="text-emerald-600 dark:text-emerald-400 text-sm font-mono">+{activeItem.xpReward} XP</span>
                          </div>
                        </div>

                        {/* Start Quiz Button with Instant Loader */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                          <button
                            onClick={handleStartQuiz}
                            disabled={startingQuiz}
                            className={`px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                              startingQuiz ? "opacity-75 cursor-wait" : "active:scale-95"
                            }`}
                          >
                            {startingQuiz ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>কুইজ প্রস্তুত হচ্ছে...</span>
                              </>
                            ) : (
                              <>
                                <Award className="w-4 h-4" />
                                <span>কুইজ শুরু করুন</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : quizResult ? (
                      /* Quiz Result Review View */
                      <div className="bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
                        <div className="text-center space-y-2.5 pb-5 border-b border-slate-200 dark:border-slate-800">
                          <div
                            className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto text-xl font-black ${
                              quizResult.isPassed
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-500"
                                : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-2 border-rose-500"
                            }`}
                          >
                            {quizResult.scorePercentage}%
                          </div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">
                            {quizResult.isPassed ? "অভিনন্দন! আপনি উত্তীর্ণ হয়েছেন।" : "আপনি উত্তীর্ণ হতে পারেননি।"}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto font-sans">
                            {quizResult.message}
                          </p>

                          {/* Disqualified Question summary if tab switch occurred */}
                          {quizResult.disqualifiedCount > 0 && (
                            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-xs font-bold max-w-md mx-auto">
                              ⚠️ ট্যাব পরিবর্তনের কারণে {quizResult.disqualifiedCount} টি প্রশ্নের নম্বর ০ হয়েছে।
                            </div>
                          )}
                        </div>

                        {/* Questions Review Breakdown */}
                        <div className="space-y-3">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">প্রশ্নভিত্তিক ফলাফল বিশ্লেষণ:</h4>
                          {activeItem.quizQuestions?.map((q, idx) => {
                            const selected = selectedAnswers[q.id];
                            const isTabDisqualified = quizResult.disqualifiedQuestionIds?.includes(q.id);
                            const isCorrect = !isTabDisqualified && selected === q.correctOptionIndex;

                            return (
                              <div
                                key={q.id}
                                className={`p-3.5 rounded-xl border space-y-2 ${
                                  isTabDisqualified
                                    ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
                                    : isCorrect
                                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                                    : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                                    {idx + 1}. {q.questionText}
                                  </span>
                                  {isTabDisqualified ? (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-[10px] font-black shrink-0">
                                      ট্যাব অযোগ্য (০ নম্বর)
                                    </span>
                                  ) : isCorrect ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-[10px] font-black shrink-0">
                                      সঠিক
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-[10px] font-black shrink-0">
                                      ভুল
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {q.options.map((opt, oIdx) => (
                                    <div
                                      key={oIdx}
                                      className={`p-2 rounded-lg text-[11px] font-medium border ${
                                        oIdx === q.correctOptionIndex
                                          ? "bg-emerald-100/60 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500/60 text-emerald-800 dark:text-emerald-300 font-bold"
                                          : selected === oIdx
                                          ? "bg-rose-100/60 dark:bg-rose-950/40 border-rose-400 dark:border-rose-500/60 text-rose-800 dark:text-rose-300 font-bold"
                                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                                      }`}
                                    >
                                      {String.fromCharCode(65 + oIdx)}. {opt}
                                      {oIdx === q.correctOptionIndex && " ✓ (সঠিক উত্তর)"}
                                      {selected === oIdx && oIdx !== q.correctOptionIndex && " ✗ (আপনার নির্বাচন)"}
                                    </div>
                                  ))}
                                </div>

                                {q.explanation && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-800/60">
                                    ব্যাখ্যা: {q.explanation}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Action buttons after result */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                          <button
                            onClick={handleStartQuiz}
                            disabled={startingQuiz}
                            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
                          >
                            {startingQuiz ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            <span>পুনরায় কুইজ দিন</span>
                          </button>

                          {nextItem && (
                            quizResult.isPassed ? (
                              <button
                                onClick={() => {
                                  setNavigatingItemId(nextItem.id);
                                  handleSelectSequenceItem(nextItem);
                                  setTimeout(() => setNavigatingItemId(null), 300);
                                }}
                                disabled={navigatingItemId === nextItem.id}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-60 transition-all active:scale-95"
                              >
                                {navigatingItemId === nextItem.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                    <span>লোড হচ্ছে...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>পরবর্তী ধাপে এগিয়ে যান</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-1.5">
                                  <Lock className="w-3 h-3 text-rose-500" />
                                  <span>পাসের শর্ত পূরণ হয়নি ({quizResult.scorePercentage}% / {activeItem.passingScore}%) — পুনরায় কুইজ দিন</span>
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      /* ACTIVE RUNNING QUIZ ARENA WITH ANTI-CHEAT TAB TRACKING */
                      <div className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-5">
                        {/* Top Arena Header with Timer and Question Steps */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                              প্রশ্ন:{" "}
                              <strong className="text-cyan-600 dark:text-cyan-300 font-mono text-sm">
                                {currentQuestionIndex + 1}
                              </strong>{" "}
                              / {activeItem.quizQuestions?.length || 0}
                            </span>
                            {/* Warning Indicator if CURRENT question is tab-disqualified */}
                            {activeItem.quizQuestions &&
                              tabSwitchedQuestionIds.includes(
                                activeItem.quizQuestions[currentQuestionIndex]?.id
                              ) && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-[10px] font-black flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>ট্যাব পরিবর্তনের কারণে ০ নম্বর</span>
                                </span>
                              )}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold">
                              <Clock className="w-3 h-3" />
                              <span>
                                {Math.floor(timeLeft / 60)}:
                                {String(timeLeft % 60).padStart(2, "0")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Question Step Circles with Forward Locking & Dynamic Theming */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {activeItem.quizQuestions?.map((q, idx) => {
                            const isAnswered = selectedAnswers[q.id] !== undefined;
                            const isCurrent = idx === currentQuestionIndex;
                            const isDisqualified = tabSwitchedQuestionIds.includes(q.id);
                            const prevQ = activeItem.quizQuestions?.[idx - 1];
                            const isLocked = idx > currentQuestionIndex && (!prevQ || selectedAnswers[prevQ.id] === undefined);
                            const qTheme = QUESTION_THEMES[idx % QUESTION_THEMES.length];

                            return (
                              <button
                                key={q.id}
                                onClick={() => {
                                  if (!isLocked) setCurrentQuestionIndex(idx);
                                }}
                                disabled={isLocked}
                                title={isLocked ? "আগের প্রশ্ন সমাধান করুন (Locked 🔒)" : `প্রশ্ন ${idx + 1}`}
                                className={`w-7 h-7 rounded-lg text-xs font-mono font-black flex items-center justify-center transition-all border ${
                                  isLocked
                                    ? "opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 border-dashed"
                                    : "cursor-pointer"
                                } ${
                                  isCurrent
                                    ? qTheme.stepActive
                                    : isDisqualified
                                    ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                                    : isAnswered
                                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                                }`}
                              >
                                {isLocked ? <Lock className="w-2.5 h-2.5 text-slate-400" /> : idx + 1}
                              </button>
                            );
                          })}
                        </div>

                        {/* Current Question Box with Dynamic Theme and Option Randomization */}
                        {(() => {
                          const questions = activeItem.quizQuestions || [];
                          const currentQ = questions[currentQuestionIndex];
                          if (!currentQ) return null;
                          const currentSelected = selectedAnswers[currentQ.id];
                          const isCurrentDisqualified = tabSwitchedQuestionIds.includes(currentQ.id);
                          const currentTheme = QUESTION_THEMES[currentQuestionIndex % QUESTION_THEMES.length];

                          // Retrieve randomized options (shuffled upon each quiz start/retake)
                          const displayedOptions =
                            shuffledOptionsMap[currentQ.id] ||
                            currentQ.options.map((opt, i) => ({ text: opt, originalIndex: i }));

                          return (
                            <div className={`space-y-4 pt-1 p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/80 border transition-all ${currentTheme.glowCard}`}>
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-800/80">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-xs ${currentTheme.badgeBg}`}>
                                  থিম: {currentTheme.themeName}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  প্রশ্ন {currentQuestionIndex + 1} / {questions.length}
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                {isCurrentDisqualified && (
                                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5">
                                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                    <span>
                                      এই প্রশ্নে থাকার সময় ট্যাব পরিবর্তন করায় প্রশ্নটির নম্বর ০ (শূন্য) নির্ধারিত হয়েছে।
                                    </span>
                                  </div>
                                )}
                                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-relaxed">
                                  {currentQuestionIndex + 1}. {currentQ.questionText}
                                </h3>
                              </div>

                              {/* Options List with Dynamic Theming and Shuffled Anti-Memorization Order */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {displayedOptions.map((optItem, displayIdx) => {
                                  const isSelected = currentSelected === optItem.originalIndex;
                                  const isAnswered = currentSelected !== undefined;
                                  const isCorrect = optItem.originalIndex === currentQ.correctOptionIndex;

                                  let optionClass =
                                    `bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 ${currentTheme.optHover}`;

                                  if (isAnswered) {
                                    if (isCorrect) {
                                      optionClass =
                                        "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/40 shadow-emerald-500/20";
                                    } else if (isSelected && !isCorrect) {
                                      optionClass =
                                        "bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/40 shadow-rose-500/20";
                                    } else {
                                      optionClass =
                                        "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 text-slate-400 opacity-60";
                                    }
                                  } else if (isSelected) {
                                    optionClass = currentTheme.optSelected;
                                  }

                                  return (
                                    <button
                                      key={displayIdx}
                                      onClick={() => handleSelectOption(currentQ.id, optItem.originalIndex)}
                                      disabled={isAnswered}
                                      className={`p-3 rounded-xl text-left text-xs sm:text-sm font-semibold flex items-center justify-between transition-all border ${
                                        !isAnswered ? "cursor-pointer active:scale-[0.99]" : "cursor-default"
                                      } ${optionClass}`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <span
                                          className={`w-5 h-5 rounded-md text-[11px] font-mono font-black flex items-center justify-center border ${
                                            isAnswered
                                              ? isCorrect
                                                ? "bg-emerald-500 text-white border-emerald-400 font-black"
                                                : isSelected
                                                ? "bg-rose-500 text-white border-rose-400 font-black"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                                              : isSelected
                                              ? currentTheme.indicatorSelected
                                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                          }`}
                                        >
                                          {String.fromCharCode(65 + displayIdx)}
                                        </span>
                                        <span className="leading-snug">{optItem.text}</span>
                                      </div>

                                      {isAnswered && (
                                        <div className="shrink-0 font-mono text-xs">
                                          {isCorrect ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1">
                                              <CheckCircle2 className="w-3.5 h-3.5" />
                                              <span className="text-[10px] hidden sm:inline">সঠিক</span>
                                            </span>
                                          ) : isSelected ? (
                                            <span className="text-rose-600 dark:text-rose-400 font-black flex items-center gap-1">
                                              <XCircle className="w-3.5 h-3.5" />
                                              <span className="text-[10px] hidden sm:inline">ভুল</span>
                                            </span>
                                          ) : null}
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Immediate Feedback Card on Answer */}
                              {currentSelected !== undefined && (
                                <div
                                  className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 transition-all animate-fade-in ${
                                    currentSelected === currentQ.correctOptionIndex
                                      ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/50 text-emerald-900 dark:text-emerald-200"
                                      : "bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/50 text-rose-900 dark:text-rose-200"
                                  }`}
                                >
                                  {currentSelected === currentQ.correctOptionIndex ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                  )}
                                  <div className="space-y-0.5">
                                    <p className="font-extrabold text-xs sm:text-sm">
                                      {currentSelected === currentQ.correctOptionIndex
                                        ? "অভিনন্দন! আপনার উত্তরটি সঠিক হয়েছে।"
                                        : `ভুল উত্তর। সঠিক উত্তর হলো: ${currentQ.options[currentQ.correctOptionIndex]}`}
                                    </p>
                                    {currentQ.explanation && (
                                      <p className="text-slate-600 dark:text-slate-300 text-[11px] font-sans">
                                        💡 <span className="font-bold">ব্যাখ্যা:</span>{" "}
                                        {currentQ.explanation}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Question Navigation Footer with Strict Forward Locking & Button Loaders */}
                              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                                {/* Left: Previous (Back is always allowed) */}
                                <button
                                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                                  disabled={currentQuestionIndex === 0}
                                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-colors"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                  <span>পূর্ববর্তী প্রশ্ন</span>
                                </button>

                                {/* Center: Forward Lock Warning Hint */}
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium text-center">
                                  {currentSelected === undefined ? (
                                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                                      <Lock className="w-3 h-3" />
                                      <span>সামনে যাওয়ার জন্য যেকোনো একটি অপশন নির্বাচন করুন (Forward Locked 🔒)</span>
                                    </span>
                                  ) : currentQuestionIndex < questions.length - 1 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>পরবর্তী প্রশ্ন আনলক হয়েছে ➔</span>
                                    </span>
                                  ) : (
                                    <span className="text-cyan-600 dark:text-cyan-400 font-bold">সকল প্রশ্ন শেষ! কুইজ সাবমিট করুন</span>
                                  )}
                                </div>

                                {/* Right: Forward or Submit with Instant Button Loader */}
                                {currentQuestionIndex < questions.length - 1 ? (
                                  <button
                                    onClick={() => {
                                      if (currentSelected === undefined) return;
                                      setCurrentQuestionIndex((prev) => prev + 1);
                                    }}
                                    disabled={currentSelected === undefined}
                                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                                  >
                                    <span>পরবর্তী প্রশ্ন</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={handleSubmitQuiz}
                                    disabled={quizSubmitting || currentSelected === undefined}
                                    className={`px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all ${
                                      quizSubmitting ? "cursor-wait opacity-80" : "active:scale-95 cursor-pointer"
                                    }`}
                                  >
                                    {quizSubmitting ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>কুইজ সাবমিট হচ্ছে...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>কুইজ সাবমিট করুন</span>
                                        <Check className="w-3.5 h-3.5" />
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
              </div>
            </div>
            {/* Friendly Padlock Modal Popup for Locked Steps */}
            {lockedModalItem && (
              <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 max-w-sm w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30">
                    <Lock className="w-7 h-7 animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-wider">
                      ধাপটি বর্তমানে লক করা (Locked 🔒)
                    </span>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {lockedModalItem.item.titleBangla}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                      {lockedModalItem.reason}
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => {
                        const currentItem = chapter.items[activeItemIndex];
                        setLockedModalItem(null);
                        if (currentItem) {
                          handleSelectSequenceItem(currentItem);
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>বর্তমান সক্রিয় পাঠে ফিরে যান</span>
                    </button>
                    <button
                      onClick={() => setLockedModalItem(null)}
                      className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      বুঝেছি
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <PublicFooter />

      {/* Login Modal */}
      {loginModalOpen && (
        <StudentLoginModal
          onClose={() => setLoginModalOpen(false)}
          onSuccessLogin={(acc) => {
            setActiveStudent(acc);
            const syncRes = syncGuestProgressToStudent(acc.rollNumber);
            if (syncRes.mergedCount > 0) {
              alert(`অভিনন্দন ${acc.studentName}! আপনার পূর্ববর্তী ${syncRes.mergedCount}টি পড়ার অগ্রগতি ও কুইজ ফলাফল সফলভাবে অ্যাকাউন্টে মার্জ হয়েছে।`);
            }
            setLoginModalOpen(false);
            fetchLesson();
          }}
        />
      )}

      {/* Student Merit Leaderboard & Gamification Modal */}
      {leaderboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in custom-scrollbar">
          <div className="bg-slate-950 border border-indigo-500/30 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative custom-scrollbar">
            <StudentLearningLeaderboard
              onClose={() => setLeaderboardModalOpen(false)}
              onOpenLoginModal={() => {
                setLeaderboardModalOpen(false);
                setLoginModalOpen(true);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
