"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Play,
  Sparkles,
  Zap,
  Flame,
  Check,
  X,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  HelpCircle,
  Eye,
  FileText,
  Target,
  Bookmark,
  Share2,
  Loader2,
  Compass,
} from "lucide-react";
import {
  QuizQuestionItem,
  ChapterContentItemData,
} from "@/lib/chapterLearningEngine";
import { StudentAuthAccount } from "@/lib/studentIntelligenceStore";
import {
  ShuffledQuizOption,
  QuestionAttemptResult,
  generateSafeShuffledAttemptMap,
  getTemplateIndex,
  TWENTY_QUIZ_TEMPLATES,
  QuizTemplateTheme,
  QuizLayoutDirectionId,
} from "@/lib/quizEngineTypes";

interface AdvancedQuizArenaProps {
  quizQuestions: QuizQuestionItem[];
  passingScore: number;
  timeLimitPerQuestion?: number; // In seconds, default 30
  activeItem: ChapterContentItemData;
  activeStudent: StudentAuthAccount | null;
  roadmapUrl: string;
  onLoginRequired: () => void;
  onSubmitSuccess: (data: any) => void;
  onNavigateToNextMilestone?: () => void;
  onBackToRoadmap?: () => void;
}

export function AdvancedQuizArena({
  quizQuestions,
  passingScore,
  timeLimitPerQuestion = 30,
  activeItem,
  activeStudent,
  roadmapUrl,
  onLoginRequired,
  onSubmitSuccess,
  onNavigateToNextMilestone,
  onBackToRoadmap,
}: AdvancedQuizArenaProps) {
  // Attempt and Lifecycle States
  const [attemptNumber, setAttemptNumber] = useState<number>(1);
  const [templateOffset, setTemplateOffset] = useState<number>(0);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Shuffled Options per question: questionId -> ShuffledQuizOption[]
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState<
    Record<string, ShuffledQuizOption[]>
  >({});

  // Question results: questionId -> QuestionAttemptResult
  const [questionResults, setQuestionResults] = useState<
    Record<string, QuestionAttemptResult>
  >({});

  // Per-question countdown timer (in seconds)
  const [timeLeft, setTimeLeft] = useState<number>(timeLimitPerQuestion);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Final Quiz Result from backend or calculated
  const [finalResult, setFinalResult] = useState<any | null>(null);

  // Mastery Review Accordion Open States (questionId -> boolean)
  const [reviewOpenQuestions, setReviewOpenQuestions] = useState<
    Record<string, boolean>
  >({});

  // Anti-cheat tab switch tracking
  const [tabSwitchedQuestionIds, setTabSwitchedQuestionIds] = useState<string[]>([]);
  const [showTabWarning, setShowTabWarning] = useState<boolean>(false);

  // Initialize or start an attempt with Safe Shuffling
  const startNewAttempt = useCallback(
    (newAttemptNum: number, newOffset: number) => {
      if (!quizQuestions || quizQuestions.length === 0) return;

      const newShuffledMap = generateSafeShuffledAttemptMap(
        quizQuestions,
        newAttemptNum
      );

      setAttemptNumber(newAttemptNum);
      setTemplateOffset(newOffset);
      setShuffledOptionsMap(newShuffledMap);
      setQuestionResults({});
      setCurrentQuestionIndex(0);
      setTimeLeft(timeLimitPerQuestion);
      setFinalResult(null);
      setTabSwitchedQuestionIds([]);
      setShowTabWarning(false);
      setReviewOpenQuestions({});
      setQuizStarted(true);
    },
    [quizQuestions, timeLimitPerQuestion]
  );

  // Handle Initial Start Quiz Button Click
  const handleInitiateQuiz = () => {
    if (!activeStudent) {
      onLoginRequired();
      return;
    }
    startNewAttempt(1, 0);
  };

  // Current Question Context
  const currentQuestion = useMemo(() => {
    if (!quizQuestions || quizQuestions.length === 0) return null;
    return quizQuestions[currentQuestionIndex] || null;
  }, [quizQuestions, currentQuestionIndex]);

  // Deterministic 20-Template Cycling: Q1-20 -> Template 01-20, Q21 -> Template 01
  const currentTemplate: QuizTemplateTheme = useMemo(() => {
    const templateIdx = getTemplateIndex(currentQuestionIndex, templateOffset);
    return TWENTY_QUIZ_TEMPLATES[templateIdx] || TWENTY_QUIZ_TEMPLATES[0];
  }, [currentQuestionIndex, templateOffset]);

  // Current Question Result if already answered
  const currentResult: QuestionAttemptResult | undefined = useMemo(() => {
    if (!currentQuestion) return undefined;
    return questionResults[currentQuestion.id];
  }, [currentQuestion, questionResults]);

  const hasAnsweredCurrent: boolean = !!currentResult;

  // Anti-Cheat Tab Switch Detection
  useEffect(() => {
    if (!quizStarted || finalResult || !currentQuestion) return;

    const handleTabViolation = () => {
      setTabSwitchedQuestionIds((prev) => {
        if (!prev.includes(currentQuestion.id)) {
          setShowTabWarning(true);
          setTimeout(() => setShowTabWarning(false), 4000);
          return [...prev, currentQuestion.id];
        }
        return prev;
      });
    };

    const onVisibilityChange = () => {
      if (document.hidden) handleTabViolation();
    };

    const onWindowBlur = () => {
      handleTabViolation();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [quizStarted, finalResult, currentQuestion]);

  // Per-Question 30s Countdown Timer Effect
  useEffect(() => {
    if (!quizStarted || finalResult || !currentQuestion) return;

    if (hasAnsweredCurrent) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(timeLimitPerQuestion);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleQuestionTimeout(currentQuestion);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizStarted, finalResult, currentQuestionIndex, hasAnsweredCurrent, currentQuestion, timeLimitPerQuestion]);

  // Triggered when 30s per-question timer runs out
  const handleQuestionTimeout = (q: QuizQuestionItem) => {
    setQuestionResults((prev) => {
      if (prev[q.id]) return prev;
      const correctOptId = `opt_${q.correctOptionIndex}`;
      return {
        ...prev,
        [q.id]: {
          questionId: q.id,
          selectedOptionId: null,
          selectedOriginalIndex: null,
          correctOptionId: correctOptId,
          correctOriginalIndex: q.correctOptionIndex,
          isCorrect: false,
          isTimeout: true,
          timeSpentSeconds: timeLimitPerQuestion,
          answeredAt: new Date().toISOString(),
        },
      };
    });
  };

  // Handle Instant Option Selection (Instant Validation & Feedback)
  const handleSelectOption = (chosenOption: ShuffledQuizOption) => {
    if (!currentQuestion || hasAnsweredCurrent || isSubmitting) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpent = Math.max(1, timeLimitPerQuestion - timeLeft);
    const correctOptId = `opt_${currentQuestion.correctOptionIndex}`;
    const isCorrect = chosenOption.id === correctOptId;

    const result: QuestionAttemptResult = {
      questionId: currentQuestion.id,
      selectedOptionId: chosenOption.id,
      selectedOriginalIndex: chosenOption.originalIndex,
      correctOptionId: correctOptId,
      correctOriginalIndex: currentQuestion.correctOptionIndex,
      isCorrect,
      isTimeout: false,
      timeSpentSeconds: timeSpent,
      answeredAt: new Date().toISOString(),
    };

    setQuestionResults((prev) => ({
      ...prev,
      [currentQuestion.id]: result,
    }));
  };

  // Advance to Next Question or Final Submit
  const handleProceedNext = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(timeLimitPerQuestion);
    } else {
      handleFinalSubmission();
    }
  };

  // Return to Previous Question (preserves answered state & shuffled options)
  const handleNavigatePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Submit Final Results to Server API
  const handleFinalSubmission = async () => {
    if (isSubmitting || !activeItem) return;
    if (!activeStudent) {
      onLoginRequired();
      return;
    }

    try {
      setIsSubmitting(true);

      const answersMap: Record<string, number> = {};
      let correctCount = 0;
      let totalTimeSpent = 0;

      quizQuestions.forEach((q) => {
        const res = questionResults[q.id];
        if (res && res.selectedOriginalIndex !== null && !res.isTimeout) {
          answersMap[q.id] = res.selectedOriginalIndex;
          if (res.isCorrect) correctCount++;
          totalTimeSpent += res.timeSpentSeconds;
        } else {
          answersMap[q.id] = -1;
          totalTimeSpent += timeLimitPerQuestion;
        }
      });

      const totalQuestions = quizQuestions.length;
      const scorePct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      const isPassed = scorePct >= passingScore;

      const res = await fetch(`/api/learning/items/${activeItem.id}/submit-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentRoll: activeStudent.rollNumber,
          studentName: activeStudent.studentName,
          answers: answersMap,
          timeSpentSeconds: totalTimeSpent,
          tabSwitchedQuestionIds,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const enrichedResult = {
          ...data,
          score: data.scorePercentage ?? data.score ?? scorePct,
          scorePercentage: data.scorePercentage ?? data.score ?? scorePct,
          correctCount: data.correctCount !== undefined ? data.correctCount : correctCount,
          totalQuestions: data.totalQuestions || totalQuestions,
        };
        setFinalResult(enrichedResult);
        onSubmitSuccess(enrichedResult);

        if (data.isPassed) {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
          });
        }
      } else {
        const localResult = {
          success: true,
          score: scorePct,
          scorePercentage: scorePct,
          isPassed,
          correctCount,
          totalQuestions,
          xpAwarded: isPassed ? activeItem.xpReward || 50 : 0,
          passingScore,
        };
        setFinalResult(localResult);
        onSubmitSuccess(localResult);

        if (isPassed) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      }
    } catch (err) {
      console.error("Quiz submission error:", err);
      let correctCount = 0;
      quizQuestions.forEach((q) => {
        if (questionResults[q.id]?.isCorrect) correctCount++;
      });
      const scorePct = Math.round((correctCount / quizQuestions.length) * 100);
      const isPassed = scorePct >= passingScore;
      const localResult = {
        success: true,
        score: scorePct,
        scorePercentage: scorePct,
        isPassed,
        correctCount,
        totalQuestions: quizQuestions.length,
        xpAwarded: isPassed ? activeItem.xpReward || 50 : 0,
        passingScore,
      };
      setFinalResult(localResult);
      onSubmitSuccess(localResult);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retry Attempt (Mastery Retry)
  const handleRetryAttempt = () => {
    const nextAttempt = attemptNumber + 1;
    const nextOffset = (templateOffset + 1) % 20;
    startNewAttempt(nextAttempt, nextOffset);
  };

  // Reusable 30-Second Timer Renderer
  const renderTimerBadge = (overrideStyle?: string) => {
    const pct = Math.max(0, Math.min(100, (timeLeft / timeLimitPerQuestion) * 100));
    const isUrgent = timeLeft <= 7;
    const timerType = overrideStyle || currentTemplate.timerStyle;

    switch (timerType) {
      case "circular": {
        const radius = 15;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (pct / 100) * circumference;
        return (
          <div className="flex items-center gap-2">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <svg className="w-9 h-9 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r={radius}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth="3"
                  fill="transparent"
                />
                <circle
                  cx="18"
                  cy="18"
                  r={radius}
                  className={`${isUrgent ? "stroke-rose-500 animate-pulse" : currentTemplate.timerColor} transition-all duration-300`}
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span
                className={`absolute text-xs font-black font-mono ${
                  isUrgent ? "text-rose-500 animate-pulse" : "text-slate-800 dark:text-slate-200"
                }`}
              >
                {timeLeft}
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">
              সেকেন্ড
            </span>
          </div>
        );
      }

      case "terminal": {
        return (
          <div className="px-3 py-1.5 rounded-lg bg-black/90 border border-emerald-500/50 font-mono text-xs flex items-center gap-2 shadow-inner">
            <span className="text-emerald-400 font-bold animate-pulse">●</span>
            <span className="text-emerald-300">
              SYS_TIME:[<strong className={isUrgent ? "text-rose-400" : "text-emerald-400"}>{String(timeLeft).padStart(2, "0")}s</strong>]
            </span>
          </div>
        );
      }

      case "marquee": {
        return (
          <div className="px-2.5 py-1 rounded bg-yellow-400 text-slate-950 font-mono font-bold text-xs border border-black flex items-center gap-1.5">
            <span>⏱ সময়</span>
            <span className="px-1.5 py-0.5 bg-black text-yellow-400 rounded">
              {String(timeLeft).padStart(2, "0")}s
            </span>
          </div>
        );
      }

      case "pill": {
        return (
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border shadow-xs transition-colors ${
              isUrgent
                ? "bg-rose-50 dark:bg-rose-950/80 border-rose-300 text-rose-600 animate-pulse"
                : "bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">{timeLeft}s বাকি</span>
          </div>
        );
      }

      case "minimal": {
        return (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">সময়:</span>
            <span
              className={`font-mono text-sm font-bold ${
                isUrgent ? "text-rose-500 font-black animate-pulse" : "text-slate-700 dark:text-slate-200"
              }`}
            >
              {timeLeft}s
            </span>
          </div>
        );
      }

      case "stadium": {
        return (
          <div className="px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span className="font-mono">{timeLeft}s বাকি</span>
          </div>
        );
      }

      case "bar":
      default: {
        return (
          <div className="w-24 sm:w-32 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500 dark:text-slate-400 font-bold">টাইমার</span>
              <span className={isUrgent ? "text-rose-500 font-black" : "text-slate-700 dark:text-slate-300 font-bold"}>
                {timeLeft}s
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isUrgent ? "bg-rose-500 animate-pulse" : currentTemplate.timerColor
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      }
    }
  };

  // Reusable 2x2 Responsive Option Grid Component
  // Guarantees:
  // Desktop/Tablet: 2 Columns x 2 Rows (Row 1: A | B, Row 2: C | D)
  // Mobile: Responsive 1 or 2 Column depending on width
  // Natural height, wrap-anywhere, break-words, no truncation!
  const renderOptionGrid = (optionsList: ShuffledQuizOption[], customBadgeStyle?: string) => {
    if (!currentQuestion) return null;

    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full pt-1"
        role="radiogroup"
        aria-label="Quiz Options"
      >
        {optionsList.map((opt, optIndex) => {
          const letter = String.fromCharCode(65 + optIndex);
          const isSelected = currentResult?.selectedOptionId === opt.id;
          const isCorrectAnswer = opt.id === `opt_${currentQuestion.correctOptionIndex}`;

          // Visual states: default, hover, selected, correct, incorrect, disabled
          let cardStyle = currentTemplate.optionCardBase;
          let badgeStyle = customBadgeStyle || currentTemplate.optionLetterBadge;
          let textStyle = "text-slate-900 dark:text-slate-100";
          let showCheckIcon = false;
          let showCrossIcon = false;

          if (hasAnsweredCurrent && currentResult) {
            if (isSelected) {
              if (currentResult.isCorrect) {
                cardStyle = currentTemplate.correctCard;
                badgeStyle = "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 font-black shadow-xs";
                textStyle = "text-emerald-950 dark:text-emerald-100 font-bold";
                showCheckIcon = true;
              } else {
                cardStyle = currentTemplate.incorrectCard;
                badgeStyle = "bg-rose-600 text-white dark:bg-rose-500 dark:text-white font-black shadow-xs";
                textStyle = "text-rose-950 dark:text-rose-100 font-bold";
                showCrossIcon = true;
              }
            } else if (isCorrectAnswer) {
              // Highlight the correct answer in green even if user chose wrong or timed out
              cardStyle = currentTemplate.correctCard;
              badgeStyle = "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 font-black shadow-xs";
              textStyle = "text-emerald-950 dark:text-emerald-100 font-bold";
              showCheckIcon = true;
            } else {
              // Unchosen/disabled options: ensure high-contrast legibility in both light & dark mode without washed-out boxes
              cardStyle = "bg-slate-100/70 dark:bg-slate-800/40 border-2 border-slate-200/90 dark:border-slate-800 text-slate-500 dark:text-slate-400 opacity-60 cursor-not-allowed";
              badgeStyle = "bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold";
              textStyle = "text-slate-600 dark:text-slate-400 font-medium";
            }
          }

          // Icon Accented custom shapes for Template 13
          const shapeGlyphs = ["▲", "■", "●", "◆"];
          const shapeGlyph = shapeGlyphs[optIndex % shapeGlyphs.length];

          return (
            <button
              type="button"
              key={opt.id}
              role="radio"
              aria-checked={isSelected}
              disabled={hasAnsweredCurrent || isSubmitting}
              onClick={() => handleSelectOption(opt)}
              className={`w-full min-h-[4rem] p-3.5 sm:p-4 rounded-2xl border text-left flex items-start justify-between gap-3 text-xs sm:text-sm font-bold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer ${cardStyle}`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Option Letter Indicator Badge */}
                <span
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-transform ${badgeStyle} ${
                    isSelected ? "scale-105" : ""
                  }`}
                >
                  {currentTemplate.layoutDirection === "icon_accented" ? (
                    <span className="flex items-center gap-0.5 text-[11px]">
                      <span>{shapeGlyph}</span>
                      <span>{letter}</span>
                    </span>
                  ) : currentTemplate.layoutDirection === "editorial_minimal" ? (
                    <span>{letter}.</span>
                  ) : currentTemplate.layoutDirection === "geometric_cards" ? (
                    <span>◇{letter}</span>
                  ) : (
                    <span>{letter}</span>
                  )}
                </span>

                {/* Option Text with Safe Word Wrapping */}
                <span className={`leading-snug break-words text-wrap flex-1 pt-0.5 ${textStyle}`}>
                  {opt.text}
                </span>
              </div>

              {/* Instant Feedback Icons */}
              {showCheckIcon && (
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs shrink-0 font-black shadow-sm animate-scale-in">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
              {showCrossIcon && (
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shrink-0 font-black shadow-sm animate-scale-in">
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  // Instant Feedback Banner
  const renderFeedbackBanner = () => {
    if (!hasAnsweredCurrent || !currentResult || !currentQuestion) return null;

    return (
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all animate-fade-in space-y-2 mt-4 ${currentTemplate.feedbackBanner}`}
      >
        <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
          {currentResult.isCorrect ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-emerald-700 dark:text-emerald-300">চমৎকার! আপনার উত্তরটি সঠিক হয়েছে।</span>
            </>
          ) : currentResult.isTimeout ? (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-amber-700 dark:text-amber-300">সময় শেষ! সঠিক উত্তরটি সবুজ চিহ্নিত করা হয়েছে।</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="text-rose-700 dark:text-rose-300">উত্তরটি ভুল হয়েছে। সঠিক উত্তরটি দেখে নিন।</span>
            </>
          )}
        </div>

        {currentQuestion.explanation && (
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 pt-1.5 border-t border-slate-300/60 dark:border-slate-700/60">
            <strong>ব্যাখ্যা:</strong> {currentQuestion.explanation}
          </p>
        )}
      </div>
    );
  };

  // Navigation Footer Bar (Streamlined Minimalist Action Buttons)
  const renderNavFooter = () => {
    return (
      <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-200/50 dark:border-slate-800/60 mt-4">
        <button
          type="button"
          onClick={handleNavigatePrevious}
          disabled={currentQuestionIndex === 0 || isSubmitting}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 transition-colors border border-slate-200/80 dark:border-slate-700/80"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>পূর্ববর্তী</span>
        </button>

        {currentQuestionIndex < quizQuestions.length - 1 ? (
          <button
            type="button"
            onClick={handleProceedNext}
            disabled={!hasAnsweredCurrent || isSubmitting}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              hasAnsweredCurrent
                ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm hover:shadow active:scale-98"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
            }`}
          >
            <span>পরবর্তী</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmission}
            disabled={!hasAnsweredCurrent || isSubmitting}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              hasAnsweredCurrent
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow active:scale-98"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>যাচাই হচ্ছে...</span>
              </>
            ) : (
              <>
                <span>ফলাফল দেখুন</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  // Pre-Quiz Splash Screen (Clean Student Academic UI)
  if (!quizStarted) {
    return (
      <div className="p-6 sm:p-8 text-center bg-slate-50 dark:bg-slate-950/80 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center mx-auto shadow-md shadow-cyan-500/20">
          <Trophy className="w-7 h-7" />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wide uppercase bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
            কুইজ অ্যাসেসমেন্ট
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {activeItem.titleBangla}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            এই কুইজটিতে মোট <strong>{quizQuestions.length} টি বহুনির্বাচনী প্রশ্ন</strong> রয়েছে। প্রতিটি প্রশ্নে থাকছে{" "}
            <strong>{timeLimitPerQuestion} সেকেন্ড</strong> সময় এবং তাৎক্ষণিক সঠিক উত্তরের ব্যাখ্যা।
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto text-left">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-black text-slate-800 dark:text-slate-200">টাইমার ও সময়</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">প্রতি প্রশ্নে {timeLimitPerQuestion} সেকেন্ড</div>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-black text-slate-800 dark:text-slate-200">বহুনির্বাচনী প্রশ্ন</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">৪টি বিকল্প উত্তর</div>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-black text-slate-800 dark:text-slate-200">ফলাফল ও ব্যাখ্যা</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">তাৎক্ষণিক শুদ্ধতা প্রকাশ</div>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-black text-slate-800 dark:text-slate-200">পাস মার্ক</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">{passingScore}% বা তার বেশি</div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleInitiateQuiz}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 mx-auto shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>কুইজ শুরু করুন</span>
          </button>
        </div>
      </div>
    );
  }

  // Final Quiz Result & Mastery Review Screen
  if (finalResult) {
    const isPassed = finalResult.isPassed;
    const scorePct = finalResult.scorePercentage ?? finalResult.score ?? 0;
    const correctCount = finalResult.correctCount ?? 0;
    const totalQuestions = finalResult.totalQuestions ?? quizQuestions.length;

    const wrongQuestions = quizQuestions.filter((q) => {
      const res = questionResults[q.id];
      return !res || !res.isCorrect;
    });

    return (
      <div className="p-6 sm:p-10 bg-slate-50 dark:bg-slate-950/80 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-8 shadow-2xl animate-fade-in">
        <div className="text-center space-y-4">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-xl ${
              isPassed
                ? "bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/20"
                : "bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-rose-500/20"
            }`}
          >
            {isPassed ? <Award className="w-10 h-10" /> : <RotateCcw className="w-10 h-10" />}
          </div>

          <div className="space-y-1.5">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-block ${
                isPassed
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
              }`}
            >
              {isPassed ? "মাস্টারি অর্জিত হয়েছে" : "পুনরায় চেষ্টা বাঞ্ছনীয়"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {isPassed ? "অভিনন্দন! আপনি উত্তীর্ণ হয়েছেন!" : "পাস করার জন্য আরও একটু প্রস্তুতি নিন"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {isPassed
                ? "আপনি সফলভাবে এই কুইজের ন্যূনতম পাসের মান অর্জন করেছেন। পরবর্তী মাইলস্টোন আনলক হয়েছে।"
                : `এই কুইজে পাসের জন্য ন্যূনতম ${passingScore}% স্কোর প্রয়োজন। ভুলের ব্যাখ্যা পর্যালোচনা করে আবার চেষ্টা করুন।`}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto pt-2">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">স্কোর</div>
              <div
                className={`text-xl font-black font-mono ${
                  isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {scorePct}%
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">সঠিক উত্তর</div>
              <div className="text-xl font-black font-mono text-slate-800 dark:text-slate-200">
                {correctCount}/{totalQuestions}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">পাসিং মার্ক</div>
              <div className="text-xl font-black font-mono text-slate-800 dark:text-slate-200">
                {passingScore}%
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">অর্জিত এক্সপি</div>
              <div className="text-xl font-black font-mono text-amber-500">
                +{finalResult.xpAwarded ?? (isPassed ? activeItem.xpReward || 50 : 0)} XP
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleRetryAttempt}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>পুনরায় চেষ্টা</span>
          </button>

          {isPassed && onNavigateToNextMilestone && (
            <button
              type="button"
              onClick={onNavigateToNextMilestone}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            >
              <span>পরবর্তী পাঠ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {onBackToRoadmap && (
            <button
              type="button"
              onClick={onBackToRoadmap}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>রোডম্যাপ</span>
            </button>
          )}
        </div>

        {/* Mastery Review Section */}
        {wrongQuestions.length > 0 && (
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                  <span>মাস্টারি রিভিউ: ভুল ও অসমাপ্ত প্রশ্নসমূহ ({wrongQuestions.length} টি)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  পরবর্তী চেষ্টার পূর্বে ভুল উত্তর ও সঠিক ব্যাখ্যাগুলো ভালো করে পর্যালোচনা করে নিন।
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {wrongQuestions.map((q) => {
                const res = questionResults[q.id];
                const isOpen = !!reviewOpenQuestions[q.id];
                const studentAnswerText =
                  res?.selectedOriginalIndex !== null && res?.selectedOriginalIndex !== undefined
                    ? q.options[res.selectedOriginalIndex]
                    : null;
                const correctAnswerText = q.options[q.correctOptionIndex];

                return (
                  <div
                    key={q.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer select-none"
                      onClick={() =>
                        setReviewOpenQuestions((prev) => ({ ...prev, [q.id]: !isOpen }))
                      }
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            প্রশ্ন {quizQuestions.findIndex((item) => item.id === q.id) + 1}
                          </span>
                          {res?.isTimeout && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              ⏰ সময় শেষ হয়েছিল
                            </span>
                          )}
                          {(q as any).conceptTopic && (
                            <span className="text-[11px] text-slate-400 font-bold">
                              • {(q as any).conceptTopic}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {q.questionText}
                        </h4>
                      </div>

                      <button
                        type="button"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
                            <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">
                              ❌ আপনার উত্তর:
                            </span>
                            <span className="text-slate-800 dark:text-slate-200 font-medium">
                              {studentAnswerText || "কোনো উত্তর দেওয়া হয়নি (টাইমআউট)"}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                              ✅ সঠিক উত্তর:
                            </span>
                            <span className="text-slate-800 dark:text-slate-200 font-medium">
                              {correctAnswerText}
                            </span>
                          </div>
                        </div>

                        {q.explanation && (
                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            <strong className="text-slate-900 dark:text-white block mb-1 flex items-center gap-1.5 font-bold">
                              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                              ব্যাখ্যা ও মূল ধারণা:
                            </strong>
                            <p className="leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active Quiz In-Progress Arena
  if (!currentQuestion) return null;

  const currentShuffledOptions =
    shuffledOptionsMap[currentQuestion.id] ||
    currentQuestion.options.map((opt, i) => ({
      id: `opt_${i}`,
      text: opt,
      originalIndex: i,
    }));

  // =========================================================================
  // 20 GENUINELY DIFFERENT TEMPLATE RENDERERS
  // =========================================================================

  const renderActiveTemplate = () => {
    const layout = currentTemplate.layoutDirection;

    // 03. ASYMMETRIC SPLIT LAYOUT (True 2-column Desktop/Tablet Split Canvas)
    if (layout === "asymmetric_split") {
      return (
        <div className={`p-5 sm:p-7 transition-all ${currentTemplate.containerCard}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Sticky Question Hero Panel (5 cols) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-purple-500/10 dark:bg-purple-950/40 border border-purple-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${currentTemplate.badgeStyle}`}>
                  প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
                </span>
                {renderTimerBadge("circular")}
              </div>

              {(currentQuestion as any).conceptTopic && (
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block">
                  বিষয়: {(currentQuestion as any).conceptTopic}
                </span>
              )}

              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-relaxed break-words">
                {currentQuestion.questionText}
              </h3>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-purple-200 dark:border-purple-800">
                ডান পাশ থেকে সঠিক বিকল্পটি নির্বাচন করুন।
              </div>
            </div>

            {/* Right Column: Options Arena + Feedback + Navigation */}
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 pb-1">
                বিকল্প উত্তরসমূহ:
              </div>
              {renderOptionGrid(currentShuffledOptions)}
              {renderFeedbackBanner()}
              {renderNavFooter()}
            </div>
          </div>
        </div>
      );
    }

    // 02. LARGE QUESTION SPOTLIGHT (Hero Spotlight Box with Watermark)
    if (layout === "question_spotlight") {
      return (
        <div className={`p-5 sm:p-8 transition-all space-y-5 ${currentTemplate.containerCard}`}>
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-amber-500/20">
            <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase ${currentTemplate.badgeStyle}`}>
              প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
            {renderTimerBadge("pill")}
          </div>

          {/* Large Hero Spotlight Box */}
          <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50 via-amber-100/40 to-yellow-50 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/30 border-2 border-amber-400 dark:border-amber-500/40 overflow-hidden shadow-inner">
            <span className="absolute -top-4 -right-2 text-7xl font-serif text-amber-500/10 select-none pointer-events-none">
              &ldquo;
            </span>
            <div className="relative z-10 space-y-2">
              {(currentQuestion as any).conceptTopic && (
                <div className="text-xs font-mono font-bold text-amber-800 dark:text-amber-400 tracking-wider">
                  বিষয়: {(currentQuestion as any).conceptTopic}
                </div>
              )}
              <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-amber-100 leading-relaxed break-words">
                {currentQuestion.questionText}
              </h3>
            </div>
          </div>

          {/* 2x2 Option Grid */}
          {renderOptionGrid(currentShuffledOptions)}
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 16. SPLIT QUESTION AND ANSWERS (Horizontal Theater Split)
    if (layout === "split_question_answers") {
      return (
        <div className={`transition-all shadow-xl rounded-3xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900`}>
          {/* Top Theater Question Chamber */}
          <div className="p-6 sm:p-8 bg-slate-900 dark:bg-slate-950 text-white space-y-3 relative">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 dark:text-rose-400 border border-rose-500/40">
                প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
              </span>
              <span className="font-mono text-slate-300 dark:text-slate-400 text-xs">প্রচেষ্টা #{attemptNumber}</span>
            </div>

            <h3 className="text-base sm:text-xl font-black leading-relaxed break-words text-rose-100">
              {currentQuestion.questionText}
            </h3>

            {/* Pinned Center Crease Timer */}
            <div className="pt-2 flex justify-end">
              {renderTimerBadge("pill")}
            </div>
          </div>

          {/* Bottom Arena: 2x2 Option Grid */}
          <div className="p-5 sm:p-7 space-y-4 bg-slate-50 dark:bg-slate-900/90">
            {renderOptionGrid(currentShuffledOptions)}
            {renderFeedbackBanner()}
            {renderNavFooter()}
          </div>
        </div>
      );
    }

    // 11. PROGRESS-CENTERED LAYOUT (Giant Central Countdown & Milestone Dots)
    if (layout === "progress_centered") {
      return (
        <div className={`p-6 sm:p-8 transition-all space-y-6 ${currentTemplate.containerCard}`}>
          {/* Centerpiece Timer Ring */}
          <div className="flex flex-col items-center justify-center space-y-2 text-center pb-2">
            <div className="scale-125 my-1">
              {renderTimerBadge("circular")}
            </div>
            <div className="text-xs font-black text-teal-700 dark:text-teal-400">
              প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
            </div>
            {/* Trail Dots */}
            <div className="flex items-center gap-1.5 pt-1">
              {quizQuestions.slice(0, 10).map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentQuestionIndex
                      ? "bg-teal-500 scale-125 ring-2 ring-teal-400/40"
                      : i < currentQuestionIndex
                      ? "bg-teal-300 dark:bg-teal-800"
                      : "bg-slate-300 dark:bg-slate-700"
                  }`}
                />
              ))}
              {quizQuestions.length > 10 && <span className="text-[10px] text-slate-400">...</span>}
            </div>
          </div>

          {/* Centered Question */}
          <div className="text-center max-w-2xl mx-auto space-y-1">
            {(currentQuestion as any).conceptTopic && (
              <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                {(currentQuestion as any).conceptTopic}
              </span>
            )}
            <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed break-words">
              {currentQuestion.questionText}
            </h3>
          </div>

          {/* 2x2 Grid */}
          {renderOptionGrid(currentShuffledOptions)}
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 04. EDITORIAL MINIMAL LAYOUT (Academic Bookish Serif & Hairline Dividers)
    if (layout === "editorial_minimal") {
      return (
        <div className={`p-6 sm:p-9 transition-all space-y-6 ${currentTemplate.containerCard}`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-300 dark:border-slate-700 font-serif">
            <span className="text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400 font-bold">
              প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
            {renderTimerBadge("minimal")}
          </div>

          <div className="space-y-2 font-serif">
            {(currentQuestion as any).conceptTopic && (
              <div className="text-xs italic text-slate-600 dark:text-slate-400 font-serif">
                বিষয়: {(currentQuestion as any).conceptTopic}
              </div>
            )}
            <h3 className="text-lg sm:text-2xl font-serif text-slate-900 dark:text-white leading-relaxed break-words font-bold">
              {currentQuestion.questionText}
            </h3>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            {renderOptionGrid(currentShuffledOptions)}
          </div>
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 05. GAMIFIED NUMBERED TILES (Chunky 3D Buttons & Multicolored Tile Badges)
    if (layout === "gamified_tiles") {
      return (
        <div className={`p-6 sm:p-8 transition-all space-y-5 ${currentTemplate.containerCard}`}>
          <div className="flex items-center justify-between gap-3 pb-3 border-b-2 border-emerald-100 dark:border-emerald-950">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-xs flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>+50 XP</span>
              </span>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
              </span>
            </div>
            {renderTimerBadge("bar")}
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed break-words">
              {currentQuestion.questionText}
            </h3>
          </div>

          {/* 2x2 Grid with vibrant tactile 3D styling */}
          {renderOptionGrid(currentShuffledOptions)}
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 17. LAYERED KNOWLEDGE CARDS (Stack Deck Flashcard Effect)
    if (layout === "layered_knowledge") {
      return (
        <div className="relative">
          {/* Background offset card layers */}
          <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl rotate-1 scale-[0.99] translate-y-2 pointer-events-none" />
          <div className="absolute inset-0 bg-cyan-500/10 rounded-3xl -rotate-1 scale-[0.98] translate-y-1 pointer-events-none" />

          {/* Main Top Card */}
          <div className={`relative z-10 p-6 sm:p-8 transition-all space-y-5 ${currentTemplate.containerCard}`}>
            <div className="flex items-center justify-between pb-3 border-b border-indigo-200 dark:border-indigo-900">
              <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase ${currentTemplate.badgeStyle}`}>
                প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
              </span>
              {renderTimerBadge("circular")}
            </div>

            <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed break-words">
              {currentQuestion.questionText}
            </h3>

            {renderOptionGrid(currentShuffledOptions)}
            {renderFeedbackBanner()}
            {renderNavFooter()}
          </div>
        </div>
      );
    }

    // 18. HIGH-CONTRAST ACCESSIBLE LAYOUT (3px Solid Borders, WCAG AAA High Contrast)
    if (layout === "high_contrast_accessible") {
      return (
        <div className={`p-6 sm:p-8 transition-all space-y-6 ${currentTemplate.containerCard}`}>
          <div className="flex items-center justify-between pb-4 border-b-3 border-current">
            <span className={`px-4 py-1.5 rounded-xl text-xs font-black tracking-wider ${currentTemplate.badgeStyle}`}>
              প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
            {renderTimerBadge("pill")}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg sm:text-2xl font-black text-slate-950 dark:text-white leading-relaxed break-words">
              {currentQuestion.questionText}
            </h3>
          </div>

          {renderOptionGrid(currentShuffledOptions)}
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 19. SPACIOUS PRESENTATION LAYOUT (Keynote Widescreen Slide Format)
    if (layout === "spacious_presentation") {
      return (
        <div className={`p-6 sm:p-10 transition-all space-y-6 ${currentTemplate.containerCard}`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-mono uppercase tracking-widest text-slate-600 dark:text-slate-400 font-bold">
              প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
            {renderTimerBadge("minimal")}
          </div>

          <div className="py-2 space-y-2 text-center max-w-3xl mx-auto">
            {(currentQuestion as any).conceptTopic && (
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                {(currentQuestion as any).conceptTopic}
              </span>
            )}
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed break-words">
              {currentQuestion.questionText}
            </h3>
          </div>

          {renderOptionGrid(currentShuffledOptions)}
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 10. OUTLINED EXAM CARDS (OMR Bubble Sheet Format)
    if (layout === "outlined_exam") {
      return (
        <div className={`p-6 sm:p-8 transition-all space-y-5 ${currentTemplate.containerCard}`}>
          <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-slate-300 dark:border-slate-700">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
            {renderTimerBadge("pill")}
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-relaxed break-words">
            {currentQuestion.questionText}
          </h3>

          <div className="text-[11px] text-slate-600 dark:text-slate-400 italic">
            নির্দেশনা: নিচের ৪টি উত্তরের মধ্য থেকে যেকোনো একটিতে টিক দিন।
          </div>

          {renderOptionGrid(currentShuffledOptions)}
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 12. LARGE TYPOGRAPHY LAYOUT (Oversized Headline & Corner Letter Watermarks)
    if (layout === "large_typography") {
      return (
        <div className={`p-6 sm:p-9 transition-all space-y-6 ${currentTemplate.containerCard}`}>
          <div className="flex items-center justify-between pb-3 border-b-2 border-current">
            <span className={`px-3 py-1 rounded-md text-xs font-black ${currentTemplate.badgeStyle}`}>
              প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
            {renderTimerBadge("bar")}
          </div>

          <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight break-words">
            {currentQuestion.questionText}
          </h3>

          {renderOptionGrid(currentShuffledOptions)}
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 14. COMPACT CLASSROOM LAYOUT (High Density, Low Padding)
    if (layout === "compact_classroom") {
      return (
        <div className={`p-4 sm:p-6 transition-all space-y-4 ${currentTemplate.containerCard}`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
              প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
            {renderTimerBadge("pill")}
          </div>

          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug break-words">
            {currentQuestion.questionText}
          </h3>

          {renderOptionGrid(currentShuffledOptions)}
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 09. GEOMETRIC ANSWER CARDS (Technical Blueprint / Corner Brackets)
    if (layout === "geometric_cards") {
      return (
        <div className={`p-6 sm:p-8 transition-all space-y-5 ${currentTemplate.containerCard}`}>
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/40 font-mono text-xs">
            <span className="text-cyan-700 dark:text-cyan-300 font-bold">
              প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
            {renderTimerBadge("terminal")}
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-cyan-100 leading-relaxed break-words">
              {currentQuestion.questionText}
            </h3>
          </div>

          {renderOptionGrid(currentShuffledOptions)}
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 07. DARK PREMIUM LAYOUT (Midnight Obsidian & Gold Medallions)
    if (layout === "dark_premium") {
      return (
        <div className={`p-6 sm:p-8 transition-all space-y-6 ${currentTemplate.containerCard}`}>
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${currentTemplate.badgeStyle}`}>
              প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
            {renderTimerBadge("terminal")}
          </div>

          <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-amber-100 leading-relaxed break-words">
            {currentQuestion.questionText}
          </h3>

          {renderOptionGrid(currentShuffledOptions)}
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 08. LIGHT ACADEMIC LAYOUT (Formal Syllabus Sheet & Mark Weightage)
    if (layout === "light_academic") {
      return (
        <div className={`p-6 sm:p-8 transition-all space-y-5 ${currentTemplate.containerCard}`}>
          <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border-l-4 border-l-sky-500 flex items-center justify-between">
            <div className="text-xs font-bold text-sky-800 dark:text-sky-300">
              প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
            </div>
            {renderTimerBadge("pill")}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed break-words">
            {currentQuestion.questionText}
          </h3>

          {renderOptionGrid(currentShuffledOptions)}
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 13. ICON-ACCENTED OPTION LAYOUT (Live Quiz Show with ▲, ■, ●, ◆)
    if (layout === "icon_accented") {
      return (
        <div className={`p-6 sm:p-8 transition-all space-y-5 ${currentTemplate.containerCard}`}>
          <div className="flex items-center justify-between pb-3 border-b-2 border-yellow-400">
            <span className={`px-3 py-1 rounded text-xs font-black ${currentTemplate.badgeStyle}`}>
              প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
            {renderTimerBadge("marquee")}
          </div>

          <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-yellow-300 leading-relaxed break-words font-mono">
            {currentQuestion.questionText}
          </h3>

          {renderOptionGrid(currentShuffledOptions)}
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 15. SOFT GRADIENT COMPOSITION (Frosted Glass & Aurora Sheen)
    if (layout === "soft_gradient") {
      return (
        <div className={`p-6 sm:p-8 transition-all space-y-5 ${currentTemplate.containerCard}`}>
          <div className="flex items-center justify-between pb-3 border-b border-fuchsia-300/40">
            <span className={`px-3 py-1 rounded-full text-xs font-black ${currentTemplate.badgeStyle}`}>
              প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
            {renderTimerBadge("bar")}
          </div>

          <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed break-words">
            {currentQuestion.questionText}
          </h3>

          {renderOptionGrid(currentShuffledOptions)}
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 20. MODERN INTERACTIVE TILE LAYOUT (Grand Finale Championship Arena)
    if (layout === "modern_interactive_tile") {
      return (
        <div className={`p-6 sm:p-8 transition-all space-y-6 ${currentTemplate.containerCard}`}>
          <div className="flex items-center justify-between pb-3 border-b border-amber-400/40">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
                🏆
              </span>
              <span className="text-xs font-black text-amber-800 dark:text-amber-300">
                প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
              </span>
            </div>
            {renderTimerBadge("stadium")}
          </div>

          <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-amber-100 leading-relaxed break-words">
            {currentQuestion.questionText}
          </h3>

          {renderOptionGrid(currentShuffledOptions)}
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 06. FLOATING CARD COMPOSITION (Elevated Shadows & Subtle Lift)
    if (layout === "floating_card") {
      return (
        <div className={`p-6 sm:p-8 transition-all space-y-6 ${currentTemplate.containerCard}`}>
          <div className="flex items-center justify-between pb-3 border-b border-blue-200 dark:border-blue-900">
            <span className={`px-3 py-1 rounded-full text-xs font-black ${currentTemplate.badgeStyle}`}>
              প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
            {renderTimerBadge("circular")}
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-relaxed break-words">
              {currentQuestion.questionText}
            </h3>
          </div>

          {renderOptionGrid(currentShuffledOptions)}
          {renderFeedbackBanner()}
          {renderNavFooter()}
        </div>
      );
    }

    // 01. CLASSIC 2x2 ANSWER GRID (Default Standard Balanced Template)
    return (
      <div className={`p-5 sm:p-8 transition-all space-y-6 ${currentTemplate.containerCard}`}>
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${currentTemplate.badgeStyle}`}>
              প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
            {attemptNumber > 1 && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                প্রচেষ্টা #{attemptNumber}
              </span>
            )}
          </div>
          <div className="shrink-0">{renderTimerBadge("circular")}</div>
        </div>

        <div className="space-y-1">
          {(currentQuestion as any).conceptTopic && (
            <div className={`text-xs font-bold ${currentTemplate.headerAccent}`}>
              মূল ধারণা: {(currentQuestion as any).conceptTopic}
            </div>
          )}
          <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed break-words">
            {currentQuestion.questionText}
          </h3>
        </div>

        {renderOptionGrid(currentShuffledOptions)}
        {renderFeedbackBanner()}
        {renderNavFooter()}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Tab Switch Fair-Play Warning Alert */}
      {showTabWarning && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>সতর্কতা: কুইজের সময় ট্যাব পরিবর্তন রেকর্ড করা হচ্ছে। মনোযোগ সহকারে উত্তর দিন।</span>
        </div>
      )}

      {/* Main Dynamic Template Composition */}
      {renderActiveTemplate()}
    </div>
  );
}
