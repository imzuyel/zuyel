"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Check,
  ShieldAlert,
  Loader2,
  Play,
  Trophy,
  Flame,
  Compass,
  UserCheck,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import StudentLoginModal from "@/components/auth/StudentLoginModal";
import GamifiedEdTechBackground from "@/components/learning/GamifiedEdTechBackground";
import { InternationalStoryLessonRenderer } from "@/components/learning/InternationalStoryLessonRenderer";
import { CurvedPathwayRoadmap } from "@/components/learning/CurvedPathwayRoadmap";
import { AdvancedQuizArena } from "@/components/learning/AdvancedQuizArena";
import { CourseCertificateModal } from "@/components/learning/CourseCertificateModal";
import confetti from "canvas-confetti";
import { triggerBlockCompletionCelebration } from "@/lib/confetti";
import { toast } from "sonner";
import {
  getActiveStudentAccount,
  StudentAuthAccount,
  getGuestSessionId,
  saveStudentResumePoint,
  saveStudentCompletedItemId,
  getStudentCompletedItemIds,
} from "@/lib/studentIntelligenceStore";
import { safeFetchJson } from "@/lib/safeFetch";
import {
  CourseItem,
  CourseChapterItem,
  ChapterContentItemData,
} from "@/lib/chapterLearningEngine";
import {
  buildChapterUrl,
  buildLessonUrl,
  buildSubjectUrl,
  resolveCourse,
  resolveChapter,
  resolveItem,
} from "@/lib/learningSlugService";

// Dynamic Themes for Quiz Questions
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

export interface SplitScreenChapterLearningViewProps {
  classParam: string;
  subjectParam: string;
  chapterParam: string;
  slugParam?: string;
}

export default function SplitScreenChapterLearningView({
  classParam,
  subjectParam,
  chapterParam,
  slugParam,
}: SplitScreenChapterLearningViewProps) {
  const router = useRouter();

  const [course, setCourse] = useState<CourseItem | null>(null);
  const [chapter, setChapter] = useState<CourseChapterItem | null>(null);
  const [activeItem, setActiveItem] = useState<ChapterContentItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Student auth
  const [activeStudent, setActiveStudent] = useState<StudentAuthAccount | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Blog reading countdown & state
  const [completingBlog, setCompletingBlog] = useState(false);
  const [readingSecondsLeft, setReadingSecondsLeft] = useState<number>(0);
  const blogReadingStartRef = useRef<number>(Date.now());

  useEffect(() => {
    if (activeItem?.id && activeItem.itemType === "BLOG_PART") {
      blogReadingStartRef.current = Date.now();
    }
  }, [activeItem?.id]);

  // Quiz active state
  const [quizStarted, setQuizStarted] = useState(false);
  const [startingQuiz, setStartingQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(300);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  // Shuffled options map for anti-memorization
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState<
    Record<string, { text: string; originalIndex: number }[]>
  >({});

  // Anti-cheat tab switch tracking
  const [tabSwitchedQuestionIds, setTabSwitchedQuestionIds] = useState<string[]>([]);
  const [tabSwitchAlert, setTabSwitchAlert] = useState<{
    show: boolean;
    questionNumber: number;
    questionId: string;
  } | null>(null);

  // Split-screen responsive navigation state
  const [mobileTab, setMobileTab] = useState<"content" | "roadmap">("content");
  const [lockedModalItem, setLockedModalItem] = useState<{
    item: ChapterContentItemData;
    reason: string;
  } | null>(null);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const contentPaneRef = useRef<HTMLDivElement | null>(null);

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

  // Fetch course, chapter and resolve active lesson
  const fetchChapterAndLessonData = async () => {
    try {
      setLoading(true);
      setError(null);
      const studentRoll = activeStudent?.rollNumber || getGuestSessionId();

      // 1. Fetch courses list to resolve course
      const listRes = await fetch("/api/learning/courses");
      const listData = await listRes.json();
      if (!listData.success || !Array.isArray(listData.courses)) {
        throw new Error("কোর্সের তালিকা পাওয়া যায়নি");
      }

      const matchedCourse = resolveCourse(classParam, subjectParam, listData.courses);
      if (!matchedCourse) {
        setError("অনুরোধকৃত বিষয় পাওয়া যায়নি");
        return;
      }
      setCourse(matchedCourse);

      // 2. Resolve chapter
      const matchedChapter = resolveChapter(matchedCourse, chapterParam);
      if (!matchedChapter) {
        setError("অনুরোধকৃত অধ্যায় পাওয়া যায়নি");
        return;
      }

      // 3. Fetch enriched chapter data from API
      const chapterUrl = `/api/learning/chapters/${matchedChapter.id}?studentRoll=${encodeURIComponent(studentRoll)}`;
      const chData = await safeFetchJson(chapterUrl);

      let targetChapter: CourseChapterItem = chData.success && chData.chapter ? chData.chapter : matchedChapter;

      // Merge persistent completed items from studentIntelligenceStore so completed parts NEVER re-lock
      const completedLocalIds = getStudentCompletedItemIds(studentRoll);
      if (targetChapter.items && (completedLocalIds.length > 0 || Array.isArray(targetChapter.items))) {
        let prevItemSatisfied = true;
        const mergedItems = targetChapter.items.map((it: ChapterContentItemData, idx: number) => {
          const isLocallyCompleted = completedLocalIds.includes(it.id);
          const isPassed = isLocallyCompleted || (it as any).progress?.isPassed || (it as any).progress?.status === "COMPLETED";

          const mergedProgress = isPassed
            ? (it as any).progress || { isPassed: true, status: "COMPLETED", completedAt: new Date().toISOString() }
            : (it as any).progress;

          // A completed item is permanently unlocked. If previous item was satisfied, next item is also unlocked.
          const isLocked = isPassed ? false : (idx === 0 ? false : !prevItemSatisfied);

          if (it.isMandatory && !isPassed) {
            prevItemSatisfied = false;
          }

          return {
            ...it,
            isLocked,
            progress: mergedProgress,
          };
        });

        const completedCount = mergedItems.filter(
          (it: any) => it.progress?.isPassed || it.progress?.status === "COMPLETED"
        ).length;

        targetChapter = {
          ...targetChapter,
          items: mergedItems,
          completedItemsCount: completedCount,
          progressPercentage: mergedItems.length > 0 ? Math.round((completedCount / mergedItems.length) * 100) : 0,
        } as CourseChapterItem;
      }

      setChapter(targetChapter);

      if (chData.course) {
        setCourse((prev) => ({ ...(prev || matchedCourse), ...chData.course }));
      }

      // 4. Resolve Active Milestone for Immediate Split-Screen View
      if (targetChapter.items && targetChapter.items.length > 0) {
        let resolvedItem: ChapterContentItemData | null = null;

        if (slugParam) {
          resolvedItem = resolveItem(targetChapter, slugParam);
        }

        // If no slugParam or slug not matched, find first active unpassed milestone or first item
        if (!resolvedItem) {
          const enrichedItems = targetChapter.items as any[];
          resolvedItem =
            enrichedItems.find(
              (it) => !it.isLocked && !it.progress?.isPassed && it.progress?.status !== "COMPLETED"
            ) ||
            enrichedItems.find((it) => !it.isLocked) ||
            targetChapter.items[0];

          // Seamlessly update URL without reload
          if (resolvedItem) {
            const initialLessonUrl = buildLessonUrl(matchedCourse, targetChapter, resolvedItem);
            try {
              window.history.replaceState({}, "", initialLessonUrl);
            } catch {
              // ignore
            }
          }
        }

        if (resolvedItem) {
          setActiveItem(resolvedItem);
        } else {
          setError("অধ্যায়ের কোনো পাঠ্য পাওয়া যায়নি");
        }
      } else {
        setError("এই অধ্যায়ে এখনো কোনো পাঠ বা কুইজ যুক্ত করা হয়নি");
      }
    } catch (err: any) {
      console.error("Failed to load chapter split-screen data:", err);
      setError("সার্ভার থেকে অধ্যায়ের তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapterAndLessonData();
  }, [classParam, subjectParam, chapterParam, slugParam, activeStudent?.rollNumber]);

  // Handle native browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (!chapter?.items || chapter.items.length === 0) return;
      const pathSegments = window.location.pathname.split("/").filter(Boolean);
      const currentSlug = pathSegments[pathSegments.length - 1];
      if (currentSlug) {
        const item = resolveItem(chapter, currentSlug);
        if (item) {
          setActiveItem(item);
          setQuizStarted(false);
          setQuizResult(null);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [chapter]);

  // Reading countdown timer for uncompleted blog parts
  useEffect(() => {
    if (!activeItem || activeItem.itemType !== "BLOG_PART") {
      setReadingSecondsLeft(0);
      return;
    }

    const isPassed =
      (activeItem as any).progress?.isPassed === true ||
      (activeItem as any).progress?.status === "COMPLETED" ||
      Boolean((activeItem as any).progress?.completedAt);

    if (isPassed) {
      setReadingSecondsLeft(0);
      return;
    }

    setReadingSecondsLeft(8);
    const timer = setInterval(() => {
      setReadingSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeItem?.id]);

  // Anti-cheat tab switch tracking during quiz
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
        setTabSwitchAlert({
          show: true,
          questionNumber: qNum,
          questionId: qId,
        });
        return updated;
      });
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleTabChangeViolation();
      }
    };

    const onWindowBlur = () => {
      handleTabChangeViolation();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [quizStarted, activeItem, currentQuestionIndex, quizResult]);

  // Quiz Countdown Timer
  useEffect(() => {
    if (!quizStarted || quizResult || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [quizStarted, quizResult, timeLeft]);

  // Sequential Next/Prev resolution
  const { prevItem, nextItem, activeItemIndex } = useMemo(() => {
    if (!chapter?.items || !activeItem) {
      return { prevItem: null, nextItem: null, activeItemIndex: 0 };
    }
    const idx = chapter.items.findIndex((it) => it.id === activeItem.id);
    return {
      prevItem: idx > 0 ? chapter.items[idx - 1] : null,
      nextItem: idx >= 0 && idx < chapter.items.length - 1 ? chapter.items[idx + 1] : null,
      activeItemIndex: idx >= 0 ? idx : 0,
    };
  }, [chapter, activeItem]);

  // Dynamic Content Switching: Switch items in split-screen without full page reload
  const handleNavigateToItem = (targetItem: ChapterContentItemData) => {
    if (!course || !chapter) return;
    if (activeItem && targetItem.id === activeItem.id) {
      if (mobileTab === "roadmap") setMobileTab("content");
      return;
    }

    // 1. Immediately update active state for instant 60fps response
    setActiveItem(targetItem);
    setQuizStarted(false);
    setQuizResult(null);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setTabSwitchedQuestionIds([]);
    setTabSwitchAlert(null);

    // Switch to content tab on mobile devices
    if (mobileTab === "roadmap") {
      setMobileTab("content");
    }

    // 2. Update browser address bar seamlessly without full page reload
    const targetUrl = buildLessonUrl(course, chapter, targetItem);
    try {
      window.history.pushState({}, "", targetUrl);
    } catch {
      router.push(targetUrl, { scroll: false });
    }

    // 3. Smoothly scroll window to top of the content view
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Auto-Navigation & Certificate Triggering Logic (Task 1)
  const handleAdvanceAfterCompletion = () => {
    // 1. If next milestone exists in current chapter, navigate directly to it
    if (nextItem && course && chapter) {
      handleNavigateToItem(nextItem);
      return;
    }

    // 2. If this was the last item of the chapter, check for the NEXT chapter in the course
    if (!course || !chapter) return;
    const chapters = course.chapters || [];
    const currentChapterIdx = chapters.findIndex(
      (ch) => ch.id === chapter.id || ch.chapterNumber === chapter.chapterNumber
    );

    if (currentChapterIdx !== -1 && currentChapterIdx < chapters.length - 1) {
      const nextChapter = chapters[currentChapterIdx + 1];
      toast.success(
        `🎉 অধ্যায় "${chapter.titleBangla}" সম্পন্ন হয়েছে! পরবর্তী অধ্যায় "${nextChapter.titleBangla}"-এ নিয়ে যাওয়া হচ্ছে...`,
        { duration: 4000 }
      );
      try {
        triggerBlockCompletionCelebration();
      } catch {}

      // Automatically route to First Block of NEXT chapter
      if (nextChapter.items && nextChapter.items.length > 0) {
        const firstBlock = nextChapter.items[0];
        const nextUrl = buildLessonUrl(course, nextChapter, firstBlock);
        router.push(nextUrl);
      } else {
        const nextUrl = buildChapterUrl(course, nextChapter);
        router.push(nextUrl);
      }
      return;
    }

    // 3. NO more chapters exist: The entire subject/course is fully completed!
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
      });
      triggerBlockCompletionCelebration();
    } catch {}

    toast.success("অসাধারণ কৃতিত্ব! আপনি সম্পূর্ণ পাঠ্যক্রম সফলভাবে সমাপ্ত করেছেন! 🎓🏆", {
      duration: 6000,
    });

    // Automatically trigger Course Completion Certificate modal
    setCertificateModalOpen(true);
  };

  // Complete Blog Part and advance
  const handleCompleteBlog = async () => {
    if (!activeItem || completingBlog) return;
    try {
      setCompletingBlog(true);
      const studentRoll = activeStudent?.rollNumber || getGuestSessionId();
      const studentName = activeStudent?.studentName;
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - blogReadingStartRef.current) / 1000));

      const res = await safeFetchJson(`/api/learning/items/${activeItem.id}/complete-blog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentRoll,
          studentName,
          timeSpentSeconds: elapsedSeconds,
        }),
      });

      if (res.success) {
        try {
          triggerBlockCompletionCelebration();
        } catch {}
        if (activeStudent && course && chapter) {
          saveStudentResumePoint(activeStudent.rollNumber, {
            courseId: course.id,
            courseTitle: course.titleBangla,
            chapterId: chapter.id,
            chapterTitle: chapter.titleBangla,
            itemId: activeItem.id,
            itemTitle: activeItem.titleBangla,
          });
        }

        const awardedStars = res.stars || 5;

        // Permanently persist completed milestone and earned stars for student so it NEVER re-locks
        saveStudentCompletedItemId(studentRoll, activeItem.id, awardedStars);

        // Instant optimistic update on active item
        setActiveItem((prev) =>
          prev
            ? {
                ...prev,
                progress: {
                  isPassed: true,
                  status: "COMPLETED",
                  stars: awardedStars,
                  completedAt: new Date().toISOString(),
                },
              }
            : null
        );

        // Update chapter items state so sidebar roadmap immediately updates & unlocks next milestone
        setChapter((prevCh) => {
          if (!prevCh) return prevCh;
          const updatedItems = prevCh.items.map((it) => {
            if (it.id === activeItem.id) {
              return {
                ...it,
                progress: {
                  isPassed: true,
                  status: "COMPLETED",
                  stars: awardedStars,
                  completedAt: new Date().toISOString(),
                },
                isLocked: false,
              };
            }
            return it;
          });

          const currentIdx = updatedItems.findIndex((it) => it.id === activeItem.id);
          if (currentIdx >= 0 && currentIdx < updatedItems.length - 1) {
            updatedItems[currentIdx + 1] = {
              ...updatedItems[currentIdx + 1],
              isLocked: false,
            };
          }

          const completedCount = updatedItems.filter(
            (it: any) => it.progress?.isPassed || it.progress?.status === "COMPLETED"
          ).length;
          const progressPct = Math.round((completedCount / updatedItems.length) * 100);

          return {
            ...prevCh,
            items: updatedItems,
            completedItemsCount: completedCount,
            progressPercentage: progressPct,
          };
        });

        // Auto-navigate to next milestone, next chapter, or show completion certificate
        handleAdvanceAfterCompletion();
      }
    } catch (err: any) {
      console.error("Complete blog error:", err);
    } finally {
      setCompletingBlog(false);
    }
  };

  // Start Quiz with option shuffling
  const handleStartQuiz = () => {
    if (!activeStudent) {
      setLoginModalOpen(true);
      return;
    }
    setStartingQuiz(true);

    const newShuffled: Record<string, { text: string; originalIndex: number }[]> = {};
    (activeItem?.quizQuestions || []).forEach((q) => {
      const indexed = (q.options || []).map((opt, i) => ({ text: opt, originalIndex: i }));
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

  // Submit Quiz
  const handleSubmitQuiz = async () => {
    if (!activeItem || quizSubmitting) return;
    if (!activeStudent) {
      setLoginModalOpen(true);
      return;
    }

    try {
      setQuizSubmitting(true);
      const data = await safeFetchJson(`/api/learning/items/${activeItem.id}/submit-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentRoll: activeStudent.rollNumber,
          studentName: activeStudent.studentName,
          answers: selectedAnswers,
          timeSpentSeconds: (activeItem.timeLimitSeconds || 300) - timeLeft,
          tabSwitchedQuestionIds,
        }),
      });

      if (data.success) {
        setQuizResult(data);
        if (data.isPassed) {
          try {
            triggerBlockCompletionCelebration();
          } catch {}

          const awardedStars = data.stars || 4;

          // Permanently persist completed quiz milestone and earned stars for student so it NEVER re-locks
          saveStudentCompletedItemId(activeStudent.rollNumber, activeItem.id, awardedStars);

          // Optimistically update active item state
          setActiveItem((prev) =>
            prev
              ? {
                  ...prev,
                  progress: {
                    isPassed: true,
                    status: "COMPLETED",
                    score: data.score,
                    stars: awardedStars,
                    completedAt: new Date().toISOString(),
                  },
                }
              : null
          );

          // Update chapter items state so sidebar roadmap immediately updates
          setChapter((prevCh) => {
            if (!prevCh) return prevCh;
            const updatedItems = prevCh.items.map((it) => {
              if (it.id === activeItem.id) {
                return {
                  ...it,
                  progress: {
                    isPassed: true,
                    status: "COMPLETED",
                    score: data.score,
                    stars: awardedStars,
                    completedAt: new Date().toISOString(),
                  },
                  isLocked: false,
                };
              }
              return it;
            });

            const currentIdx = updatedItems.findIndex((it) => it.id === activeItem.id);
            if (currentIdx >= 0 && currentIdx < updatedItems.length - 1) {
              updatedItems[currentIdx + 1] = {
                ...updatedItems[currentIdx + 1],
                isLocked: false,
              };
            }

            const completedCount = updatedItems.filter(
              (it: any) => it.progress?.isPassed || it.progress?.status === "COMPLETED"
            ).length;
            const progressPct = Math.round((completedCount / updatedItems.length) * 100);

            return {
              ...prevCh,
              items: updatedItems,
              completedItemsCount: completedCount,
              progressPercentage: progressPct,
            };
          });
        }
      }
    } catch (err: any) {
      console.error("Submit quiz error:", err);
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (quizResult) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const currentTheme = QUESTION_THEMES[currentQuestionIndex % QUESTION_THEMES.length];
  const roadmapUrl = course && chapter ? buildChapterUrl(course, chapter) : "/learning";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white transition-colors duration-200 relative overflow-x-clip">
      {/* Gamified EdTech Background: Luminous Grid, Floating Gadgets & Formulas */}
      <GamifiedEdTechBackground variant="lesson" showGadgets={true} showQuizFormulas={true} />

      <PublicHeader />

      <main className="flex-1 p-3 sm:p-5 lg:p-7 max-w-[1600px] mx-auto w-full space-y-5 relative z-10 animate-fade-in pb-24 md:pb-8">
        {/* TOP DEDICATED HEADER & NAVIGATION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          {/* Back to Subject Chapters Button */}
          {course ? (
            <Link
              href={buildSubjectUrl(course)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 text-slate-800 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 font-black text-xs transition-all shadow-md hover:scale-102 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-500" />
              <span>← অধ্যায় তালিকায় ফিরুন</span>
            </Link>
          ) : (
            <Link
              href="/learning"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 text-slate-800 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 font-black text-xs transition-all shadow-md hover:scale-102 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-500" />
              <span>← বিষয় ফিল্টারে ফিরুন</span>
            </Link>
          )}

          {/* Breadcrumb Info */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {course && (
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {course.className} • {course.titleBangla}
              </span>
            )}
            {chapter && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                <span className="text-cyan-600 dark:text-cyan-300 font-bold truncate max-w-xs">
                  অধ্যায় {chapter.chapterNumber}: {chapter.titleBangla}
                </span>
              </>
            )}
            {activeItem && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-xs">
                  {activeItem.titleBangla}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Protected Access Guard for Unauthenticated Students */}
        {!loading && !activeStudent ? (
          <div className="max-w-xl mx-auto my-8 sm:my-14 p-8 sm:p-10 text-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-indigo-200/80 dark:border-indigo-900/50 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/25">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-black border border-indigo-200 dark:border-indigo-800">
                সংরক্ষিত শিখন পরিবেশ
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                অধ্যায়টিতে প্রবেশ করতে শিক্ষার্থী লগইন আবশ্যক
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                বিষয় এবং অধ্যায়ের তালিকা উন্মুক্ত থাকলেও প্রতিটি অধ্যায়ের পাঠ পড়া, কুইজে অংশগ্রহণ এবং শিখন অগ্রগতি ট্র্যাক করার জন্য পঞ্চগড় সরকারি টিএসসি-র শিক্ষার্থী অ্যাকাউন্টে লগইন বাধ্যতামূলক।
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLoginModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white font-black text-xs hover:shadow-lg hover:shadow-cyan-500/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>শিক্ষার্থী লগইন করুন</span>
              </button>

              {course && (
                <Link
                  href={buildSubjectUrl(course)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>অধ্যায় তালিকায় ফিরুন</span>
                </Link>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="p-12 sm:p-16 text-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xl">
            <Loader2 className="w-9 h-9 border-cyan-500 animate-spin mx-auto text-cyan-500" />
            <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">
              পাঠের পূর্ণাঙ্গ স্প্লিট-স্ক্রিন ভিউ লোড হচ্ছে...
            </p>
          </div>
        ) : error || !activeItem || !chapter || !course ? (
          <div className="p-8 sm:p-12 text-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-rose-200 dark:border-rose-900/40 space-y-4 shadow-xl">
            <p className="text-rose-600 dark:text-rose-400 font-bold text-sm">
              {error || "পাঠ পাওয়া যায়নি"}
            </p>
            {course ? (
              <Link
                href={buildSubjectUrl(course)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-md"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>অধ্যায় তালিকায় ফিরুন</span>
              </Link>
            ) : (
              <Link
                href="/learning"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-md"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>বিষয় ফিল্টারে ফিরুন</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Top Mobile Segmented Tab Switcher (< md) */}
            <div className="md:hidden flex items-center p-1 bg-slate-200/90 dark:bg-slate-800/90 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-inner">
              <button
                type="button"
                onClick={() => setMobileTab("content")}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  mobileTab === "content"
                    ? "bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm border border-cyan-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>পাঠ কন্টেন্ট ({activeItemIndex + 1}/{chapter.items.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("roadmap")}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  mobileTab === "roadmap"
                    ? "bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm border border-cyan-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>রোডম্যাপ</span>
              </button>
            </div>

            {/* Split-Screen 2-Column Master-Detail Layout (Natural Document Flow) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-stretch relative">
              {/* LEFT PANE: SMART STICKY & INDEPENDENTLY SCROLLABLE ROADMAP */}
              <aside
                className={`md:col-span-5 lg:col-span-4 xl:col-span-4 ${
                  mobileTab === "roadmap" ? "block" : "hidden md:block"
                } md:self-start md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto overscroll-contain pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 space-y-4`}
              >
                {/* Chapter Overview Card */}
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-3xl shadow-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 dark:bg-cyan-950/80 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-black">
                      অধ্যায় {chapter.chapterNumber}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {course.titleBangla}
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                    {chapter.titleBangla}
                  </h2>
                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                    <Link
                      href={buildSubjectUrl(course)}
                      className="text-cyan-600 dark:text-cyan-400 hover:underline font-bold flex items-center gap-1 text-[11px]"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>সব অধ্যায় তালিকা</span>
                    </Link>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      মোট ধাপ: {chapter.items.length}
                    </span>
                  </div>
                </div>

                {/* Curved Pathway Roadmap */}
                <CurvedPathwayRoadmap
                  items={chapter.items}
                  activeItemId={activeItem.id}
                  onSelectItem={handleNavigateToItem}
                  onLockedClick={(item, reason) => setLockedModalItem({ item, reason })}
                  progressPercentage={(chapter as any).progressPercentage || 0}
                  completedCount={(chapter as any).completedItemsCount || 0}
                  totalCount={chapter.items.length}
                  totalEarnedStars={(chapter as any).totalEarnedStars}
                  maxPossibleStars={(chapter as any).maxPossibleStars || (chapter.items.length * 5)}
                />
              </aside>

              {/* RIGHT PANE: MAIN CONTENT PANE (Natural Document Height) */}
              <section
                ref={contentPaneRef}
                className={`md:col-span-7 lg:col-span-8 xl:col-span-8 min-w-0 ${
                  mobileTab === "content" ? "block" : "hidden md:block"
                } space-y-6`}
              >
                {/* DEDICATED FULL-SCREEN LESSON CANVAS */}
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-8 shadow-2xl space-y-6 transition-all duration-300 animate-fade-in">
                  {/* ITEM HEADER BAR */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black border shadow-xs ${
                            activeItem.itemType === "BLOG_PART"
                              ? "bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800"
                              : "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {activeItem.itemType === "BLOG_PART"
                            ? `ব্লগ পার্ট ${activeItem.blogPartNumber || activeItemIndex + 1} / ${chapter.items.length}`
                            : "বাধ্যতামূলক কুইজ অ্যাসেসমেন্ট"}
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

                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                        {activeItem.titleBangla || activeItem.title}
                      </h1>
                    </div>

                    {/* Student Auth Chip */}
                    <div className="shrink-0 flex items-center gap-2">
                      {activeStudent ? (
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <User className="w-3.5 h-3.5 text-emerald-500" />
                          <span>
                            {activeStudent.studentName} ({activeStudent.rollNumber})
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setLoginModalOpen(true)}
                          className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
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
                      {/* International Story Renderer */}
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

                      {/* Action Bar for Blog with Reading Countdown & Smooth Navigation */}
                      <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                        {prevItem ? (
                          <button
                            type="button"
                            onClick={() => handleNavigateToItem(prevItem)}
                            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700/80"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>পূর্ববর্তী</span>
                          </button>
                        ) : (
                          <div />
                        )}

                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                          {(() => {
                            const isCurrentPassed =
                              (activeItem as any).progress?.isPassed === true ||
                              (activeItem as any).progress?.status === "COMPLETED" ||
                              Boolean((activeItem as any).progress?.completedAt);

                            // 1. Reading Timer Countdown Gate for first-time reading
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

                            // 2. Strict flow to next step (quiz or next blog part)
                            if (nextItem) {
                              return (
                                <button
                                  type="button"
                                  onClick={handleCompleteBlog}
                                  disabled={completingBlog}
                                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-98 disabled:opacity-75 disabled:cursor-wait"
                                >
                                  {completingBlog ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>সংরক্ষণ হচ্ছে...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>
                                        {nextItem.itemType === "QUIZ"
                                          ? "কুইজে যান"
                                          : "পরবর্তী পাঠ"}
                                      </span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </button>
                              );
                            }

                            // 3. Final Milestone in Chapter reached
                            return (
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>অধ্যায়ের শেষ অংশে পৌঁছেছেন! 🎉</span>
                                </span>
                                <Link
                                  href={roadmapUrl}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                                >
                                  <span>রোডম্যাপে ফিরুন</span>
                                </Link>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. QUIZ ARENA VIEW */}
                  {activeItem.itemType === "QUIZ" && (
                    <div className="space-y-6">
                      {/* Tab Switch Cheat Alert */}
                      {tabSwitchAlert && tabSwitchAlert.show && (
                        <div className="bg-rose-50 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-500/50 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3 animate-shake">
                          <div className="flex items-start gap-2.5">
                            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h4 className="text-xs sm:text-sm font-black text-rose-900 dark:text-rose-200">
                                ⚠️ ব্রাউজার ট্যাব পরিবর্তন সনাক্ত হয়েছে!
                              </h4>
                              <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-sans">
                                আপনি প্রশ্ন নং <strong>{tabSwitchAlert.questionNumber}</strong>-এ থাকা অবস্থায় ব্রাউজারের অন্য ট্যাবে গিয়েছেন। নিয়ম অনুযায়ী শুধু এই নির্দিষ্ট প্রশ্নের নম্বর ০ হবে। অন্যান্য প্রশ্ন স্বাভাবিক থাকবে।
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTabSwitchAlert(null)}
                            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 cursor-pointer"
                          >
                            বুঝেছি
                          </button>
                        </div>
                      )}

                      <AdvancedQuizArena
                        quizQuestions={activeItem.quizQuestions || []}
                        passingScore={activeItem.passingScore || 60}
                        timeLimitPerQuestion={30}
                        activeItem={activeItem}
                        activeStudent={activeStudent}
                        roadmapUrl={roadmapUrl}
                        onLoginRequired={() => setLoginModalOpen(true)}
                        onSubmitSuccess={(data) => {
                          if (data.isPassed) {
                            setActiveItem((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    progress: {
                                      isPassed: true,
                                      status: "COMPLETED",
                                      score: data.score ?? data.scorePercentage,
                                      completedAt: new Date().toISOString(),
                                    },
                                  }
                                : null
                            );

                            setChapter((prevCh) => {
                              if (!prevCh) return prevCh;
                              const updatedItems = prevCh.items.map((it) => {
                                if (it.id === activeItem.id) {
                                  return {
                                    ...it,
                                    progress: {
                                      isPassed: true,
                                      status: "COMPLETED",
                                      score: data.score ?? data.scorePercentage,
                                      completedAt: new Date().toISOString(),
                                    },
                                    isLocked: false,
                                  };
                                }
                                return it;
                              });

                              const currentIdx = updatedItems.findIndex((it) => it.id === activeItem.id);
                              if (currentIdx >= 0 && currentIdx < updatedItems.length - 1) {
                                updatedItems[currentIdx + 1] = {
                                  ...updatedItems[currentIdx + 1],
                                  isLocked: false,
                                };
                              }

                              const completedCount = updatedItems.filter(
                                (it: any) => it.progress?.isPassed || it.progress?.status === "COMPLETED"
                              ).length;
                              const progressPct = Math.round((completedCount / updatedItems.length) * 100);

                              return {
                                ...prevCh,
                                items: updatedItems,
                                completedItemsCount: completedCount,
                                progressPercentage: progressPct,
                              };
                            });
                          }
                        }}
                        onNavigateToNextMilestone={() => {
                          handleAdvanceAfterCompletion();
                        }}
                        onBackToRoadmap={() => {
                          setMobileTab("roadmap");
                          if (typeof window !== "undefined") {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Locked Milestone Info Modal */}
        {lockedModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/30 p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/30">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                লক করা শিখন ধাপ 🔒
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {lockedModalItem.reason}
              </p>
              <button
                type="button"
                onClick={() => setLockedModalItem(null)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs hover:brightness-110 shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                বুঝেছি, আগের পাঠ শেষ করব
              </button>
            </div>
          </div>
        )}
      </main>

      {/* FLOATING MOBILE BOTTOM DOCK (UX Segmented Switcher for Thumb Reach on < md) */}
      {chapter && activeItem && (
        <div className="md:hidden fixed bottom-4 left-3 right-3 sm:left-6 sm:right-6 z-40 max-w-sm mx-auto shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border border-slate-300/80 dark:border-slate-700/80 p-1.5 rounded-2xl flex items-center justify-between ring-1 ring-black/5 dark:ring-white/10">
          <button
            type="button"
            onClick={() => setMobileTab("content")}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mobileTab === "content"
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📖 কন্টেন্ট পড়ুন</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("roadmap")}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mobileTab === "roadmap"
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>🗺️ রোডম্যাপ দেখুন</span>
          </button>
        </div>
      )}

      <PublicFooter />

      {/* Student Login Modal */}
      {loginModalOpen && (
        <StudentLoginModal
          onClose={() => setLoginModalOpen(false)}
          onSuccessLogin={(acc) => {
            setActiveStudent(acc);
            setLoginModalOpen(false);
            fetchChapterAndLessonData();
          }}
        />
      )}

      {/* Course Completion Certificate Modal (Task 1) */}
      {course && (
        <CourseCertificateModal
          isOpen={certificateModalOpen}
          onClose={() => setCertificateModalOpen(false)}
          studentName={activeStudent?.studentName || "শিক্ষার্থী"}
          studentRoll={activeStudent?.rollNumber || "2026-ROLL"}
          courseTitle={course.title || course.titleBangla}
          courseTitleBangla={course.titleBangla}
          className={course.className || "কারিগরি শাখা"}
          tradeName={course.tradeName || "জেনারেল ভোকেশনাল"}
          earnedXp={course.totalXp || 350}
          totalStars={5}
        />
      )}
    </div>
  );
}
