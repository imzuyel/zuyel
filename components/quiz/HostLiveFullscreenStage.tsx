"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Play,
  ArrowRight,
  ArrowLeft,
  Eye,
  CheckCircle2,
  Clock,
  Users,
  Trophy,
  QrCode,
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  Flame,
  Sparkles,
  BarChart3,
  MessageSquare,
  Loader2,
  Layers,
  Flag,
  Share2,
  Crown,
  Award,
  Download,
  Smartphone,
  AlertTriangle,
  HelpCircle,
  FileSpreadsheet,
  PieChart,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PresentationSlide, isGradedQuiz } from "./UnifiedQuizMentimeterWorkspace";
import UniversalQuizShowcaseEngine from "./engine/UniversalQuizShowcaseEngine";
import FloatingReactionOverlay from "./FloatingReactionOverlay";
import { COLORFUL_STUDENT_AVATARS, RenderColorfulAvatar, getAvatarById } from "./avatarData";
import { triggerFireworks } from "@/lib/confetti";

interface HostLiveFullscreenStageProps {
  className?: string;
  tradeName?: string;
  subjectName?: string;
  subjectCode?: string;
  sessionId: string;
  sessionCode: string;
  deckTitle: string;
  slides: PresentationSlide[];
  scheduledStartTime?: string;
  onClose: () => void;
}

export default function HostLiveFullscreenStage({
  sessionId,
  sessionCode,
  deckTitle,
  slides,
  scheduledStartTime,
  onClose,
  className,
  tradeName,
  subjectName,
  subjectCode,
}: HostLiveFullscreenStageProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [spotlightCard, setSpotlightCard] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Scheduled countdown lobby state (Task 3)
  const [scheduledSecondsLeft, setScheduledSecondsLeft] = useState<number>(() => {
    if (!scheduledStartTime) return 0;
    const diff = Math.floor((new Date(scheduledStartTime).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  // Intermediate leaderboard milestone counter (Task 1.3)
  const [gradedCountSoFar, setGradedCountSoFar] = useState(0);

  // Auto-SMS Dispatched floating toast (Task 2)
  const [smsToast, setSmsToast] = useState<{ studentName: string; type: string } | null>(null);

  // Post-Session Smart Report & Podium Modal (Task 4)
  const [isFinalPodiumOpen, setIsFinalPodiumOpen] = useState(false);
  const [reportTab, setReportTab] = useState<"podium" | "most_missed" | "warmup">("podium");
  const [reviewQuestion, setReviewQuestion] = useState<any | null>(null);
  const [isSendingFinalSms, setIsSendingFinalSms] = useState(false);

  // Live polling state
  const [players, setPlayers] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isAdvancingSlide, setIsAdvancingSlide] = useState(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(30);

  // Join popups queue (Fix 3)
  const [joinPopups, setJoinPopups] = useState<Array<{ id: string; name: string; avatar: string }>>([]);
  const prevPlayerIdsRef = React.useRef<string[]>([]);

  // State Machine States (Fix 4, 5, 7)
  const [serverPhase, setServerPhase] = useState<string>("READY");
  const [readyPlayers, setReadyPlayers] = useState<any[]>([]);
  const [readyCount, setReadyCount] = useState<number>(0);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [previewSeconds, setPreviewSeconds] = useState<number>(0);
  const [chartType, setChartType] = useState<"bar" | "donut">("bar");
  const [showWrongStudents, setShowWrongStudents] = useState<boolean>(false);
  const [liveOptionStats, setLiveOptionStats] = useState<number[]>([]);
  const [serverCorrectCount, setServerCorrectCount] = useState<number>(0);
  const [serverWrongCount, setServerWrongCount] = useState<number>(0);
  const [serverTimedOutCount, setServerTimedOutCount] = useState<number>(0);
  const [serverExplanation, setServerExplanation] = useState<string>("");
  const [isStartingQuestion, setIsStartingQuestion] = useState(false);

  const currentSlide = slides[currentSlideIndex] || slides[0];
  const isCurrentGraded = isGradedQuiz(currentSlide.type);

  // Scheduled countdown tick effect
  useEffect(() => {
    if (scheduledSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setScheduledSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [scheduledSecondsLeft]);

  // Poll players and live session state every 1.2s
  useEffect(() => {
    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        // 1. Fetch live players
        const playersRes = await fetch(`/api/live-quizzes/sessions/${sessionId}/players`);
        if (playersRes.ok) {
          const pData = await playersRes.json();
          if (isMounted && pData.success && Array.isArray(pData.players)) {
            setPlayers(pData.players);

            // FIX 3: Detect newly joined students for real-time animated popup
            const currentIds = pData.players.map((p: any) => p.id);
            if (prevPlayerIdsRef.current.length > 0) {
              const newArrivals = pData.players.filter((p: any) => !prevPlayerIdsRef.current.includes(p.id));
              if (newArrivals.length > 0) {
                newArrivals.forEach((np: any) => {
                  const popId = `join-${np.id}-${Date.now()}`;
                  setJoinPopups((prev) => [
                    ...prev.slice(-3),
                    { id: popId, name: np.displayName || "শিক্ষার্থী", avatar: np.avatar || "av_cyber_tiger" },
                  ]);
                  setTimeout(() => {
                    setJoinPopups((prev) => prev.filter((item) => item.id !== popId));
                  }, 4500);
                });
              }
            }
            prevPlayerIdsRef.current = currentIds;
          }
        }

        // 2. Fetch session answers for response counters & interactive whiteboard stream
        const answersRes = await fetch(`/api/live-quizzes/sessions/${sessionId}/answers`);
        if (answersRes.ok) {
          const aData = await answersRes.json();
          if (isMounted && aData.success && Array.isArray(aData.answers)) {
            setAnswers(aData.answers);
          }
        }

        // 3. Fetch state to synchronize 5-stage Kahoot/Mentimeter engine
        const stateRes = await fetch(`/api/live-quizzes/sessions/${sessionId}/state?playerId=HOST`);
        if (stateRes.ok) {
          const sData = await stateRes.json();
          if (isMounted) {
            if (sData.phase) setServerPhase(sData.phase);
            if (sData.readyPlayers) setReadyPlayers(sData.readyPlayers);
            if (sData.readyCount !== undefined) setReadyCount(sData.readyCount);
            if (sData.countdownSeconds !== undefined) setCountdownSeconds(sData.countdownSeconds);
            if (sData.previewSeconds !== undefined) setPreviewSeconds(sData.previewSeconds);
            if (sData.mainTimerSeconds !== undefined) setTimerSecondsLeft(sData.mainTimerSeconds);
            if (sData.optionStats) setLiveOptionStats(sData.optionStats);
            if (sData.correctCount !== undefined) setServerCorrectCount(sData.correctCount);
            if (sData.wrongCount !== undefined) setServerWrongCount(sData.wrongCount);
            if (sData.timedOutCount !== undefined) setServerTimedOutCount(sData.timedOutCount);
            if (sData.explanation) setServerExplanation(sData.explanation);
            if (sData.isAnswerRevealed || sData.allVoted || sData.phase === "QUESTION_ENDED") {
              setIsAnswerRevealed(true);
            }
            if (sData.currentQuestionIndex !== undefined && sData.currentQuestionIndex !== currentSlideIndex) {
              setCurrentSlideIndex(sData.currentQuestionIndex);
              setIsAnswerRevealed(false);
              setShowWrongStudents(false);
            }
            if (sData.lastSmsDispatched && sData.lastSmsDispatched.sent) {
              setSmsToast(sData.lastSmsDispatched);
              setTimeout(() => setSmsToast(null), 5000);
            }
          }
        }
      } catch {
        // safe polling catch
      }
    }, 1200);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [sessionId, currentSlideIndex]);

  // Isolated countdown timer for graded slides
  useEffect(() => {
    if (!isCurrentGraded || scheduledSecondsLeft > 0) return;
    setTimerSecondsLeft(currentSlide.timeLimit || 30);
    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSlideIndex, isCurrentGraded, currentSlide.timeLimit, scheduledSecondsLeft]);

  // Responses for the current slide
  const currentSlideResponses = useMemo(() => {
    return answers.filter(
      (a) => a.questionId === currentSlide.id || a.slideId === currentSlide.id
    );
  }, [answers, currentSlide.id]);

  // All Voted Detection in Fullscreen Stage
  const isAllVoted = useMemo(() => {
    return isCurrentGraded && players.length > 0 && currentSlideResponses.length >= players.length;
  }, [isCurrentGraded, players.length, currentSlideResponses.length]);

  useEffect(() => {
    if (isAllVoted && !isAnswerRevealed) {
      setIsAnswerRevealed(true);
      setTimerSecondsLeft(0);
    }
  }, [isAllVoted, isAnswerRevealed]);

  // Grand Finale Completion Handler (Task 3)
  const handleEndAndShowPodium = async () => {
    setIsFinalPodiumOpen(true);
    triggerFireworks();
    try {
      await fetch(`/api/live-quizzes/sessions/${sessionId}/end-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch (e) {
      console.error("Failed to signal quiz completion:", e);
    }
  };

  // FIX 4 & 5: Teacher Trigger for Question Start from READY_CHECK stage
  const handleStartQuestion = async () => {
    setIsStartingQuestion(true);
    try {
      await fetch(`/api/live-quizzes/sessions/${sessionId}/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_question" }),
      });
      setServerPhase("COUNTDOWN");
      setCountdownSeconds(3);
    } catch (e) {
      console.error("Failed to start question:", e);
    } finally {
      setIsStartingQuestion(false);
    }
  };

  // Advance to next slide / question and sync student devices
  const handleNextSlide = async () => {
    if (currentSlideIndex >= slides.length - 1) {
      handleEndAndShowPodium();
      return;
    }
    const nextIdx = currentSlideIndex + 1;
    const nextItem = slides[nextIdx];
    const isNextGraded = nextItem?.type ? isGradedQuiz(nextItem.type) : false;
    const isNextLeaderboard = nextItem?.type === "LEADERBOARD";
    setIsAdvancingSlide(true);
    try {
      await fetch(`/api/live-quizzes/sessions/${sessionId}/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideIndex: nextIdx, showLeaderboard: isNextLeaderboard }),
      });
      setCurrentSlideIndex(nextIdx);
      setIsAnswerRevealed(false);
      setShowWrongStudents(false);
      setReadyPlayers([]);
      setServerPhase(isNextGraded ? "READY" : "QUESTION_ACTIVE");
      setShowLeaderboardModal(isNextLeaderboard);

      // Auto-Leaderboard every 5 quiz questions (Task 1.3)
      if (isCurrentGraded) {
        const nextGradedCount = gradedCountSoFar + 1;
        setGradedCountSoFar(nextGradedCount);
        if (nextGradedCount > 0 && nextGradedCount % 5 === 0) {
          setShowLeaderboardModal(true);
        }
      }
    } catch {
      setCurrentSlideIndex(nextIdx);
      setIsAnswerRevealed(false);
    } finally {
      setIsAdvancingSlide(false);
    }
  };

  // Previous slide
  const handlePrevSlide = async () => {
    if (currentSlideIndex <= 0) return;
    const prevIdx = currentSlideIndex - 1;
    const prevItem = slides[prevIdx];
    const isPrevGraded = prevItem?.type ? isGradedQuiz(prevItem.type) : false;
    const isPrevLeaderboard = prevItem?.type === "LEADERBOARD";
    setIsAdvancingSlide(true);
    try {
      await fetch(`/api/live-quizzes/sessions/${sessionId}/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideIndex: prevIdx, showLeaderboard: isPrevLeaderboard }),
      });
      setCurrentSlideIndex(prevIdx);
      setIsAnswerRevealed(false);
      setShowWrongStudents(false);
      setReadyPlayers([]);
      setServerPhase(isPrevGraded ? "READY" : "QUESTION_ACTIVE");
      setShowLeaderboardModal(isPrevLeaderboard);
    } catch {
      setCurrentSlideIndex(prevIdx);
      setIsAnswerRevealed(false);
    } finally {
      setIsAdvancingSlide(false);
    }
  };


  // Fullscreen Toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => null);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => null);
      setIsFullscreen(false);
    }
  };

  // Copy Join URL
  const handleCopyJoinLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const joinUrl = `${origin}/quiz/join?code=${sessionCode}`;
    navigator.clipboard?.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2400);
  };

  // Word Cloud Words Computation
  const wordCloudWords = useMemo(() => {
    const counts: Record<string, number> = {};
    const fallbackWords = currentSlide.options || ["উদ্ভাবন", "কারিগরি", "স্মার্ট বাংলাদেশ", "দক্ষতা", "পরিশ্রম"];
    
    // Add fallback words base
    fallbackWords.forEach((w) => {
      counts[w] = (counts[w] || 0) + 1;
    });

    // Add student submissions
    currentSlideResponses.forEach((r) => {
      const text = typeof r.answerPayload === "string" ? r.answerPayload.trim() : "";
      if (text) {
        counts[text] = (counts[text] || 0) + 2;
      }
    });

    const max = Math.max(1, ...Object.values(counts));
    return Object.entries(counts).map(([word, count]) => ({
      word,
      count,
      ratio: count / max,
    }));
  }, [currentSlide.options, currentSlideResponses]);

  // MCQ Stats
  const optionStats = useMemo(() => {
    const options = currentSlide.options || [];
    const counts = options.map(() => 0);
    currentSlideResponses.forEach((r) => {
      const idx = Number(r.answerPayload);
      if (!isNaN(idx) && idx >= 0 && idx < counts.length) {
        counts[idx] += 1;
      }
    });
    const total = Math.max(1, currentSlideResponses.length);
    return counts.map((c) => ({
      votes: c,
      percent: Math.round((c / total) * 100),
    }));
  }, [currentSlide.options, currentSlideResponses]);

  // Top Leaderboard players sorted by score
  const topPlayers = useMemo(() => {
    const sorted = [...players].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    return sorted.slice(0, 10);
  }, [players]);

  // Most Missed Questions Radar (Task 4.2)
  const mostMissedQuestions = useMemo(() => {
    const gradedSlides = slides.filter((s) => ["MCQ", "TRUE_FALSE", "FILL_BLANKS"].includes(s.type));
    const list = gradedSlides.map((s) => {
      const slideAnswers = answers.filter((a) => a.questionId === s.id || a.slideId === s.id);
      const correctCount = slideAnswers.filter((a) => a.isCorrect).length;
      const totalCount = slideAnswers.length;
      const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 100;
      return {
        slide: s,
        totalCount,
        correctCount,
        missedCount: totalCount - correctCount,
        accuracy,
      };
    }).filter((item) => item.totalCount > 0);

    return list.sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
  }, [slides, answers]);

  // Overall Class Accuracy (Task 3)
  const overallAccuracy = useMemo(() => {
    const gradedSlides = slides.filter((s) => ["MCQ", "TRUE_FALSE", "FILL_BLANKS"].includes(s.type));
    let totalGradedAnswers = 0;
    let totalCorrectAnswers = 0;
    gradedSlides.forEach((s) => {
      const slideAnswers = answers.filter((a) => a.questionId === s.id || a.slideId === s.id);
      totalGradedAnswers += slideAnswers.length;
      totalCorrectAnswers += slideAnswers.filter((a) => a.isCorrect === true).length;
    });
    if (totalGradedAnswers === 0) return 0;
    return Math.round((totalCorrectAnswers / totalGradedAnswers) * 100);
  }, [slides, answers]);

  // Download CSV
  const handleDownloadCSV = () => {
    window.open(`/api/live-quizzes/sessions/${sessionId}/report?format=csv`, "_blank");
  };

  // Dispatch Final Summary SMS
  const handleSendFinalSms = async () => {
    setIsSendingFinalSms(true);
    try {
      const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/end-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendFinalSummarySms: true }),
      });
      const data = await res.json();
      alert(data.message || "সব শিক্ষার্থীর অভিভাবকের কাছে ফাইনাল রেজাল্ট SMS সফলভাবে পাঠানো হয়েছে!");
    } catch {
      alert("SMS প্রেরণে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setIsSendingFinalSms(false);
    }
  };

  // Categorize Responders for Mentimeter Reveal (Fix 7 Requirement)
  const { correctResponders, wrongResponders, timedOutPlayers } = useMemo(() => {
    const answeredMap = new Map<string, any>();
    currentSlideResponses.forEach((r) => {
      answeredMap.set(r.playerId, r);
    });

    const correct: any[] = [];
    const wrong: any[] = [];

    currentSlideResponses.forEach((r) => {
      if (r.isCorrect === true) {
        correct.push(r);
      } else {
        wrong.push(r);
      }
    });

    const timedOut = players.filter((p) => !answeredMap.has(p.id)).map((p) => ({
      playerId: p.id,
      studentName: p.displayName,
      avatar: p.avatar || "av_cyber_tiger",
      timedOut: true,
    }));

    return {
      correctResponders: correct,
      wrongResponders: wrong,
      timedOutPlayers: timedOut,
    };
  }, [currentSlideResponses, players]);

  // SVG Donut Slices Helper
  const donutSlices = useMemo(() => {
    const totalVotes = Math.max(1, currentSlideResponses.length);
    const options = currentSlide.options || [];
    let cumulative = 0;
    const circumference = 2 * Math.PI * 65; // radius 65 => ~408.4

    return options.map((opt, idx) => {
      const votes = (optionStats[idx] && optionStats[idx].votes) || 0;
      const percent = Math.round((votes / totalVotes) * 100);
      const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((cumulative / 100) * circumference);
      cumulative += percent;

      const colors = ["#06B6D4", "#A855F7", "#F59E0B", "#10B981", "#EC4899", "#3B82F6"];
      const color = colors[idx % colors.length];
      const isCorrect = isAnswerRevealed && idx === currentSlide.correctAnswer;

      return {
        label: String.fromCharCode(65 + idx),
        text: opt,
        votes,
        percent,
        strokeDasharray,
        strokeDashoffset,
        color,
        isCorrect,
      };
    });
  }, [currentSlide.options, currentSlide.correctAnswer, currentSlideResponses.length, optionStats, isAnswerRevealed]);

  const KAHOOT_COLORS = [
    { bg: "bg-red-600", text: "text-red-400", shape: "▲" },
    { bg: "bg-blue-600", text: "text-blue-400", shape: "◆" },
    { bg: "bg-amber-500", text: "text-amber-400", shape: "●" },
    { bg: "bg-emerald-600", text: "text-emerald-400", shape: "■" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 right-1/4 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[140px]" />
      </div>

      {/* =====================================================================
          1. SLEEK FLOATING TOP JOIN BAR (MENTIMETER STYLE)
          ===================================================================== */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-3 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-lg">
        {/* Left: Join Information */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-400">
              📱 জয়েন করুন: <strong className="text-white font-mono font-black">{typeof window !== "undefined" ? window.location.host : "domain.edu"}/quiz/join</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs sm:text-sm font-bold text-indigo-300">
              কোড: <strong className="text-amber-300 font-mono text-base sm:text-lg font-black tracking-widest">{sessionCode}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyJoinLink}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="লিঙ্ক কপি করুন"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-700 text-indigo-300 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">🔳 QR কোড বড় করুন</span>
          </button>
        </div>

        {/* Center: Mapped Academic Context Badges */}
        {(className || tradeName || subjectName) && (
          <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-bold">
            {className && (
              <span className="text-indigo-300 flex items-center gap-1">
                <span>🎓</span> {className}
              </span>
            )}
            {tradeName && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-300 flex items-center gap-1">
                  <span>🛠️</span> {tradeName}
                </span>
              </>
            )}
            {subjectName && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-amber-300 flex items-center gap-1">
                  <span>📚</span> {subjectName} {subjectCode ? `(${subjectCode})` : ""}
                </span>
              </>
            )}
          </div>
        )}

        {/* Right: Live Active Counters + Fullscreen Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Users className="w-3.5 h-3.5" />
            <span>🟢 {players.length} জন যুক্ত</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs font-bold">
            <span>📨 {currentSlideResponses.length}টি উত্তর এসেছে</span>
          </div>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title={isFullscreen ? "ফুলস্ক্রিন থেকে বের হন" : "ফুলস্ক্রিন করুন"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* FIX 3: Real-Time Join Popups Overlay */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 pointer-events-none">
        <AnimatePresence>
          {joinPopups.map((popup) => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, x: 60, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="px-4 py-2.5 rounded-2xl bg-slate-900/95 border-2 border-emerald-400 text-white shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center gap-3 backdrop-blur-xl pointer-events-auto"
            >
              <RenderColorfulAvatar avatarId={popup.avatar} size="xs" showGlow={false} />
              <div>
                <span className="text-xs font-black text-emerald-300 block">🎉 {popup.name} জয়েন করেছে!</span>
                <span className="text-[10px] text-slate-400 block leading-tight">লাইভ সেশনে সফলভাবে যুক্ত হয়েছে</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* =====================================================================
          2. CENTER GIANT PRESENTATION CANVAS
          ===================================================================== */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10 overflow-y-auto">
        {scheduledSecondsLeft > 0 ? (
          /* =====================================================================
             3D COUNTDOWN LOBBY (TASK 3)
             ===================================================================== */
          <div className="w-full max-w-4xl rounded-3xl bg-slate-900/90 border border-indigo-500/40 p-8 sm:p-12 shadow-[0_0_60px_rgba(99,102,241,0.2)] text-center space-y-8 relative overflow-hidden backdrop-blur-2xl">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse" />

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs sm:text-sm font-black tracking-wide uppercase">
                <Clock className="w-4 h-4 text-indigo-400 animate-spin" />
                নির্ধারিত সময়ভিত্তিক লাইভ কুইজ (Scheduled Quiz Lobby)
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                ⏳ কুইজ শুরু হতে বাকি
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
                শিক্ষার্থীরা নিজ নিজ ডিভাইস থেকে যুক্ত হচ্ছেন। নির্ধারিত সময় হওয়া মাত্রই স্বয়ংক্রিয়ভাবে প্রথম স্লাইড চালু হবে।
              </p>
            </div>

            {/* Big Digital Countdown Clock */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 font-mono font-black">
              <div className="p-4 sm:p-6 rounded-3xl bg-slate-950/90 border border-indigo-800/60 shadow-xl min-w-[110px] sm:min-w-[140px]">
                <span className="text-4xl sm:text-7xl text-cyan-400 block tracking-tighter">
                  {Math.floor(scheduledSecondsLeft / 60).toString().padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs font-sans text-slate-400 uppercase tracking-widest mt-1 block">মিনিট (Mins)</span>
              </div>
              <span className="text-4xl sm:text-6xl text-indigo-500 animate-pulse">:</span>
              <div className="p-4 sm:p-6 rounded-3xl bg-slate-950/90 border border-indigo-800/60 shadow-xl min-w-[110px] sm:min-w-[140px]">
                <span className="text-4xl sm:text-7xl text-amber-400 block tracking-tighter">
                  {(scheduledSecondsLeft % 60).toString().padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs font-sans text-slate-400 uppercase tracking-widest mt-1 block">সেকেন্ড (Secs)</span>
              </div>
            </div>

            {/* Joined Students Grid */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-2">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>উপস্থিত শিক্ষার্থী ({players.length} জন)</span>
                </span>
                <span className="text-emerald-400">🟢 লাইভ সিঙ্ক অ্যাক্টিভ</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 max-h-48 overflow-y-auto p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
                {players.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">শিক্ষার্থীদের কোড ({sessionCode}) দিয়ে জয়েন করতে বলুন...</p>
                ) : (
                  players.map((p, i) => (
                    <div
                      key={p.id || i}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-bold text-white shadow-sm"
                    >
                      <RenderColorfulAvatar avatarId={p.avatar} size="xs" showGlow={false} />
                      <span>{p.displayName}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Interactive Reaction Triggers & Bypass Start Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">রিঅ্যাকশন পাঠান:</span>
                {["🔥", "❤️", "🚀", "👏", "🎉"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("quiz-reaction", { detail: { emoji } }));
                      }
                    }}
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 hover:scale-125 transition flex items-center justify-center text-lg cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setScheduledSecondsLeft(0)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>🚀 অপেক্ষা না করে এখনই শুরু করুন (Start Now)</span>
              </button>
            </div>
          </div>
        ) : currentSlideIndex === 0 && !isCurrentGraded ? (
          /* =====================================================================
             FIX 3: WELCOME / LOBBY SLIDE WITH LIVE JOIN GRID & PROMINENT COUNTER
             ===================================================================== */
          <div className="w-full max-w-5xl rounded-3xl bg-slate-900/90 border border-slate-800 p-8 sm:p-12 shadow-2xl relative space-y-8 text-center backdrop-blur-xl">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-xs sm:text-sm font-black text-cyan-300 uppercase tracking-widest">
                  লাইভ প্রেজেন্টেশন ও ইন্টারেক্টিভ কুইজ
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {deckTitle || currentSlide.title || "স্বাগতম!"}
              </h1>

              {/* Mapped Academic Badges in Lobby */}
              {(className || tradeName || subjectName) && (
                <div className="flex items-center justify-center gap-2 flex-wrap pt-1 pb-2">
                  {className && (
                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold text-xs">
                      🎓 {className}
                    </span>
                  )}
                  {tradeName && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs">
                      🛠️ {tradeName}
                    </span>
                  )}
                  {subjectName && (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs">
                      📚 {subjectName} {subjectCode ? `(${subjectCode})` : ""}
                    </span>
                  )}
                </div>
              )}

              <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
                মোবাইলে ব্রাউজার খুলে কোডটি দিয়ে ক্লাসে যুক্ত হোন।
              </p>
            </div>

            {/* Prominent Live Counter Badge (Fix 3 Requirement) */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-emerald-950/80 border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)]">
              <Users className="w-6 h-6 text-emerald-400 animate-bounce" />
              <span className="text-base sm:text-xl font-black text-white">
                👥 মোট জয়েন করেছে: <strong className="text-emerald-300 font-mono text-2xl">{players.length}</strong> জন
              </span>
            </div>

            {/* Live Joined Avatar Grid (Fix 3 Requirement) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-2 max-w-4xl mx-auto">
                <span>শিক্ষার্থী তালিকা ({players.length} জন)</span>
                <span className="text-emerald-400 font-mono">🟢 Realtime Sync</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 max-h-64 overflow-y-auto p-4 rounded-3xl bg-slate-950/60 border border-slate-800 max-w-4xl mx-auto">
                {players.length === 0 ? (
                  <div className="py-8 text-slate-500 text-xs sm:text-sm space-y-1">
                    <p>এখনো কোনো শিক্ষার্থী যুক্ত হয়নি...</p>
                    <p className="text-[11px] text-slate-600">শিক্ষার্থীদের মোবাইলে কোড <span className="font-mono text-amber-400 font-bold">{sessionCode}</span> ইনপুট করতে বলুন।</p>
                  </div>
                ) : (
                  players.map((p, i) => (
                    <motion.div
                      key={p.id || i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 350, damping: 20 }}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white shadow-lg hover:scale-105 transition-transform"
                    >
                      <RenderColorfulAvatar avatarId={p.avatar} size="xs" showGlow={false} />
                      <span className="text-xs font-bold truncate max-w-[140px]">{p.displayName}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleNextSlide}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-base shadow-[0_0_35px_rgba(99,102,241,0.5)] flex items-center justify-center gap-3 mx-auto cursor-pointer transition active:scale-95"
              >
                <span>🚀 সেশন শুরু করুন (Start Session)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-5xl rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-10 shadow-2xl relative space-y-6">
          {/* Top Slide Meta Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-black uppercase tracking-wider">
                {currentSlide.type}
              </span>
              <span className="text-xs text-slate-400 font-bold">
                {isCurrentGraded ? "⏱️ গ্রেডেড কুইজ সেশন" : "📄 কন্টেন্ট / ওপেন স্লাইড"}
              </span>
            </div>

            {/* Isolated Countdown Timer / All Voted Badge for Graded Quiz */}
            {isCurrentGraded && (
              <div className="flex items-center gap-2">
                {isAllVoted ? (
                  <div className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>🎉 সবাই উত্তর দিয়েছে! (All Voted!)</span>
                  </div>
                ) : (
                  <div
                    className={`px-4 py-1.5 rounded-2xl border flex items-center gap-2 font-mono font-black text-sm transition-all ${
                      timerSecondsLeft <= 5
                        ? "bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.5)]"
                        : "bg-slate-800 border-slate-700 text-cyan-300"
                    }`}
                  >
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>{timerSecondsLeft}s</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Question / Title Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              {currentSlide.title || "এখানে প্রশ্ন বা পাঠের মূল বিষয়বস্তু..."}
            </h1>
            {currentSlide.content && (
              <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
                {currentSlide.content}
              </p>
            )}
          </div>

          {/* SLIDE TYPE SPECIFIC HOST STAGE RENDERING */}

          {/* 0. LEADERBOARD SLIDE */}
          {currentSlide.type === "LEADERBOARD" && (
            <div className="p-8 sm:p-12 rounded-3xl bg-slate-950/90 border-2 border-amber-500/40 text-center space-y-8 backdrop-blur-2xl shadow-2xl">
              <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full bg-amber-500/20 text-amber-300 font-black text-sm border border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>🏆 লাইভ লিডারবোর্ড — সেরা প্রতিযোগীগণ</span>
              </div>

              {/* 3D Top 3 Podium */}
              <div className="flex items-end justify-center gap-4 sm:gap-8 pt-6 pb-4">
                {/* 2nd Place */}
                {topPlayers[1] ? (
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-3xl sm:text-4xl mb-1">🥈</span>
                    <span className="text-sm sm:text-base font-bold text-slate-200">{topPlayers[1].displayName}</span>
                    <span className="text-xs sm:text-sm text-cyan-300 font-mono font-bold">{topPlayers[1].totalScore || 0} পয়েন্ট</span>
                    <div className="w-28 sm:w-36 h-36 rounded-t-3xl bg-gradient-to-t from-slate-900 to-slate-800 border-t-4 border-slate-400 flex items-center justify-center font-black text-slate-300 text-3xl shadow-xl mt-2">
                      2
                    </div>
                  </motion.div>
                ) : (
                  <div className="w-28 sm:w-36 h-28 opacity-20" />
                )}

                {/* 1st Place */}
                {topPlayers[0] ? (
                  <motion.div
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-4xl sm:text-5xl mb-1 animate-bounce">👑</span>
                    <span className="text-base sm:text-lg font-black text-amber-300">{topPlayers[0].displayName}</span>
                    <span className="text-sm sm:text-base text-amber-400 font-mono font-black">{topPlayers[0].totalScore || 0} পয়েন্ট</span>
                    <div className="w-32 sm:w-44 h-48 rounded-t-3xl bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400 border-t-4 border-yellow-200 flex items-center justify-center font-black text-slate-950 text-4xl shadow-2xl shadow-amber-500/40 mt-2">
                      1
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-slate-500 font-bold py-12">খেলোয়াড় যুক্ত হননি</div>
                )}

                {/* 3rd Place */}
                {topPlayers[2] ? (
                  <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-3xl sm:text-4xl mb-1">🥉</span>
                    <span className="text-sm sm:text-base font-bold text-slate-200">{topPlayers[2].displayName}</span>
                    <span className="text-xs sm:text-sm text-cyan-300 font-mono font-bold">{topPlayers[2].totalScore || 0} পয়েন্ট</span>
                    <div className="w-28 sm:w-36 h-28 rounded-t-3xl bg-gradient-to-t from-amber-950 to-amber-900 border-t-4 border-amber-600 flex items-center justify-center font-black text-amber-300 text-3xl shadow-xl mt-2">
                      3
                    </div>
                  </motion.div>
                ) : (
                  <div className="w-28 sm:w-36 h-24 opacity-20" />
                )}
              </div>

              {/* Ranks 4 to 10 Horizontal Pill Row */}
              {topPlayers.length > 3 && (
                <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto pt-2">
                  {topPlayers.slice(3, 8).map((p, idx) => (
                    <div key={p.id || idx} className="px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs font-bold">
                      <span className="text-slate-400">#{idx + 4}</span>
                      <span className="text-white">{p.displayName}</span>
                      <span className="text-cyan-400 font-mono">({p.totalScore || 0} pts)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 1. TEXT_SLIDE */}
          {currentSlide.type === "TEXT_SLIDE" && (
            <div className="p-8 rounded-3xl bg-indigo-950/20 border border-indigo-900/40 text-center space-y-4">
              <p className="text-lg sm:text-xl font-medium text-indigo-100 leading-relaxed max-w-2xl mx-auto">
                {currentSlide.content || "পাঠের সারসংক্ষেপ ও নির্দেশিকা বোর্ডে প্রদর্শিত হচ্ছে।"}
              </p>
            </div>
          )}

          {/* 2. IMAGE_COMPARE */}
          {currentSlide.type === "IMAGE_COMPARE" && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 block text-center">চিত্র ১ (Left Diagram)</span>
                <div className="aspect-video rounded-3xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={currentSlide.imageLeftUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500"}
                    alt="Left"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 block text-center">চিত্র ২ (Right Diagram)</span>
                <div className="aspect-video rounded-3xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={currentSlide.imageRightUrl || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500"}
                    alt="Right"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. WORD_CLOUD */}
          {currentSlide.type === "WORD_CLOUD" && (
            <div className="p-8 rounded-3xl bg-slate-950/70 border-2 border-indigo-500/30 min-h-[280px] flex flex-wrap items-center justify-center gap-4 sm:gap-8 backdrop-blur-xl shadow-2xl">
              {wordCloudWords.map((w, idx) => {
                const sizeClass =
                  w.ratio > 0.8
                    ? "text-4xl sm:text-6xl font-black"
                    : w.ratio > 0.5
                    ? "text-2xl sm:text-4xl font-extrabold"
                    : "text-lg sm:text-2xl font-bold";
                const colorClass = [
                  "text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]",
                  "text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]",
                  "text-amber-300 drop-shadow-[0_0_15px_rgba(252,211,77,0.4)]",
                  "text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]",
                  "text-fuchsia-400 drop-shadow-[0_0_15px_rgba(217,70,239,0.4)]",
                  "text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]",
                ][idx % 6];
                const rotateClass = ["-rotate-3", "rotate-0", "rotate-3", "rotate-0", "-rotate-6", "rotate-6"][idx % 6];

                return (
                  <motion.div
                    key={`${w.word}-${idx}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      y: [0, (idx % 2 === 0 ? -6 : 6), 0]
                    }}
                    transition={{ 
                      y: { duration: 2.2 + (idx % 3) * 0.4, repeat: Infinity, ease: "easeInOut" },
                      type: "spring", stiffness: 280, damping: 22, delay: idx * 0.04 
                    }}
                    className={`px-4 sm:px-6 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-xl ${rotateClass} transition-transform hover:scale-115 cursor-default flex items-center gap-2`}
                  >
                    <span className={`${sizeClass} ${colorClass}`}>
                      {w.word}
                    </span>
                    {w.count > 1 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-mono font-black border border-indigo-400/40">
                        x{w.count}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* 4. OPEN_ENDED & LIVE_QA (Whiteboard Cards with Spring Animation) */}
          {(currentSlide.type === "OPEN_ENDED" || currentSlide.type === "LIVE_QA") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 min-h-[220px]">
              {currentSlideResponses.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 space-y-2">
                  <MessageSquare className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="text-base font-bold text-slate-400">শিক্ষার্থীদের উত্তরের অপেক্ষায়...</p>
                  <p className="text-xs">মোবাইল থেকে উত্তর পাঠানো মাত্রই এখানে ৩ডি কার্ড আকারে ভেসে উঠবে।</p>
                </div>
              ) : (
                currentSlideResponses.map((r, i) => (
                  <motion.div
                    key={r.id || i}
                    initial={{ scale: 0.7, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 22 }}
                    onClick={() => setSpotlightCard(r)}
                    className="p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 shadow-xl cursor-pointer transition text-left space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">💡</span>
                        <span className="text-xs font-black text-indigo-300 truncate">
                          {r.playerName || "শিক্ষার্থী"}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">ক্লিক করে জুম করুন</span>
                    </div>
                    <p className="text-sm text-white font-medium line-clamp-3 leading-snug">
                      {typeof r.answerPayload === "string" ? r.answerPayload : JSON.stringify(r.answerPayload)}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* 5. GRADED QUIZ: EXACT 5-STAGE MENTIMETER/KAHOOT STATE MACHINE (Fix 1, 4, 5, 7) */}
          {isCurrentGraded && (
            <div className="space-y-6 w-full">
              {/* STAGE 1: READY_CHECK (Fix 4 Requirement) */}
              {serverPhase === "READY" && !isAnswerRevealed && (
                <div className="py-6 px-4 sm:px-8 text-center space-y-8 rounded-3xl bg-slate-950/70 border-2 border-amber-500/30 backdrop-blur-xl shadow-2xl">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs sm:text-sm border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)] uppercase tracking-wider">
                      <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                      <span>স্টুডেন্ট রেডিনেস চেক (Student Readiness Check)</span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-black text-white tracking-wide pt-2">
                      ⚡ পরবর্তী কুইজের জন্য কারা রেডি হচ্ছে দেখুন...
                    </h2>
                    <p className="text-sm text-slate-300 max-w-lg mx-auto">
                      শিক্ষার্থীরা তাদের ডিভাইসে &ldquo;🙋‍♂️ আমি প্রস্তুত!&rdquo; বাটনে চাপ দিচ্ছেন। সবাই রেডি হলে নিচের বাটনে ক্লিক করে প্রশ্ন শুরু করুন।
                    </p>
                  </div>

                  {/* Prominent Live Counter Badge */}
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/30 to-amber-500/20 border-2 border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.35)]">
                    <Flame className="w-6 h-6 text-amber-400 animate-pulse fill-current" />
                    <span className="text-lg sm:text-2xl font-black text-white">
                      🔥 <strong className="text-amber-300 font-mono text-3xl">{readyPlayers.length}</strong> / {players.length} জন স্টুডেন্ট রেডি!
                    </span>
                  </div>

                  {/* Mentimeter-Style Animated Avatar Cloud (Fix 4 Requirement) */}
                  <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 min-h-[220px] flex flex-wrap items-center justify-center gap-4 relative overflow-hidden">
                    {readyPlayers.length === 0 ? (
                      <div className="py-8 text-center space-y-2 text-slate-500">
                        <Users className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
                        <p className="text-sm font-bold text-slate-400">স্টুডেন্টদের ফোনে &ldquo;আমি প্রস্তুত!&rdquo; বাটনে চাপতে বলুন...</p>
                      </div>
                    ) : (
                      readyPlayers.map((rp, idx) => (
                        <motion.div
                          key={rp.playerId || rp.id || idx}
                          initial={{ scale: 0, opacity: 0, y: 30 }}
                          animate={{
                            scale: 1,
                            opacity: 1,
                            y: [0, (idx % 2 === 0 ? -8 : 8), 0],
                          }}
                          transition={{
                            y: { duration: 2.2 + (idx % 3) * 0.3, repeat: Infinity, ease: "easeInOut" },
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            delay: idx * 0.03,
                          }}
                          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-400/70 text-white shadow-xl hover:scale-110 transition-transform"
                        >
                          <RenderColorfulAvatar avatarId={rp.avatar} size="xs" showGlow={false} />
                          <span className="text-xs font-black text-amber-200">{rp.name}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Prominent Teacher Start Button (Fix 4 Requirement) */}
                  <div className="pt-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      disabled={isStartingQuestion}
                      onClick={handleStartQuestion}
                      className="px-8 sm:px-12 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base sm:text-xl shadow-[0_0_40px_rgba(16,185,129,0.6)] flex items-center justify-center gap-3 mx-auto cursor-pointer border border-emerald-300 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isStartingQuestion ? (
                        <Loader2 className="w-6 h-6 animate-spin text-slate-950" />
                      ) : (
                        <>
                          <Play className="w-6 h-6 fill-slate-950" />
                          <span>🚀 সবাই রেডি — প্রশ্ন শুরু করুন (Start Question)</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* STAGE 2: COUNTDOWN_321 (Fix 5 Requirement) */}
              {(serverPhase === "COUNTDOWN" || countdownSeconds > 0) && !isAnswerRevealed && (
                <div className="py-16 text-center space-y-6">
                  <motion.div
                    key={countdownSeconds}
                    initial={{ scale: 2.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    className="w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center mx-auto text-6xl sm:text-8xl font-black text-white shadow-[0_0_60px_rgba(6,182,212,0.6)] border-4 border-white/30"
                  >
                    <span>{countdownSeconds > 0 ? countdownSeconds : "GO!"}</span>
                  </motion.div>
                  <p className="text-lg font-black text-cyan-300 tracking-wider uppercase animate-pulse">
                    প্রস্তুত হও! কাউন্টডাউন চলছে...
                  </p>
                </div>
              )}

              {/* STAGE 3: QUESTION_ONLY (5 Seconds — NO OPTIONS!) (Fix 5 Requirement) */}
              {(serverPhase === "QUESTION_PREVIEW" || previewSeconds > 0) && !isAnswerRevealed && (
                <div className="py-12 px-6 sm:px-12 rounded-3xl bg-slate-950/80 border-2 border-indigo-500/40 text-center space-y-8 backdrop-blur-2xl shadow-2xl">
                  <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-xs sm:text-sm border border-indigo-500/40 uppercase tracking-widest">
                    <Eye className="w-4 h-4 text-indigo-400 animate-pulse" />
                    <span>📖 প্রশ্নটি মনোযোগ দিয়ে পড়ো... ({previewSeconds}s)</span>
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-black text-white leading-snug max-w-4xl mx-auto">
                    {(currentSlide as any).questionText || currentSlide.title}
                  </h2>

                  {/* 5s Smooth Progress Bar */}
                  <div className="w-full max-w-xl mx-auto space-y-2">
                    <div className="h-3 w-full bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500"
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 5, ease: "linear" }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      🔒 অপশনসমূহ গোপন রয়েছে — ৫ সেকেন্ড পর উন্মোচিত হবে
                    </span>
                  </div>
                </div>
              )}

              {/* STAGE 4: ANSWERING_ACTIVE (Question + Options + Timer) (Fix 5 Requirement) */}
              {serverPhase === "QUESTION_ACTIVE" && !isAnswerRevealed && (
                <div className="space-y-6 w-full">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 font-mono text-sm font-bold text-slate-400">
                      <Clock className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span>টাইম বাকি: <strong className="text-white text-base">{timerSecondsLeft}s</strong></span>
                    </div>
                    <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                      📨 {currentSlideResponses.length} / {players.length} জন উত্তর জমা দিয়েছেন
                    </div>
                  </div>

                  {/* 1 Signature Fast Template for Active Answering */}
                  <UniversalQuizShowcaseEngine
                    question={currentSlide}
                    questionIndex={currentSlideIndex}
                    totalQuestions={slides.length}
                    selectedAnswer={null}
                    onSelectAnswer={() => {}}
                    isConfirmed={false}
                    disabled={true}
                    autoRandomize={false}
                    showProofBadge={true}
                  />
                </div>
              )}

              {/* STAGE 5: RESULT_REVEAL — Mentimeter Animated Charts, Explanation & Lists (Fix 7 Requirement) */}
              {isAnswerRevealed && (
                <div className="space-y-6 w-full">
                  {/* Mentimeter Result Stats Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500/60 text-center space-y-1">
                      <span className="text-xs font-bold text-emerald-300 block">সঠিক উত্তর</span>
                      <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                        ✅ {correctResponders.length || serverCorrectCount} জন
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-950/60 border-2 border-rose-500/60 text-center space-y-1">
                      <span className="text-xs font-bold text-rose-300 block">ভুল উত্তর</span>
                      <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                        ❌ {wrongResponders.length || serverWrongCount} জন
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-950/60 border-2 border-amber-500/60 text-center space-y-1">
                      <span className="text-xs font-bold text-amber-300 block">সময় শেষ / উত্তর দেয়নি</span>
                      <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                        ⏰ {timedOutPlayers.length || serverTimedOutCount} জন
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Chart Switcher (Fix 7 Requirement) */}
                  <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-xs font-bold text-slate-300 px-2">মেন্টমিটার চার্ট ভিউ:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setChartType("bar")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                          chartType === "bar"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>📊 বার চার্ট</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartType("donut")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                          chartType === "donut"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <PieChart className="w-3.5 h-3.5" />
                        <span>🍩 পাই / ডোনাট চার্ট</span>
                      </button>
                    </div>
                  </div>

                  {/* Chart Rendering (Bar vs Donut) */}
                  {chartType === "bar" ? (
                    /* Animated Vertical Bar Chart */
                    <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end min-h-[220px] pt-4">
                        {(currentSlide.options || []).map((opt, idx) => {
                          const stat = optionStats[idx] || { votes: 0, percent: 0 };
                          const isCorrect = idx === currentSlide.correctAnswer;
                          const badgeLetter = String.fromCharCode(65 + idx);

                          return (
                            <div key={idx} className="flex flex-col items-center h-full justify-end gap-2">
                              {/* Vote count & percent pill */}
                              <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md ${
                                isCorrect ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300"
                              }`}>
                                {stat.votes} ভোট ({stat.percent}%)
                              </span>

                              {/* Upward Growing Bar */}
                              <div className="w-full h-44 rounded-2xl bg-slate-900 border border-slate-800 flex items-end p-1.5 overflow-hidden">
                                <motion.div
                                  initial={{ height: "0%" }}
                                  animate={{ height: `${Math.max(6, stat.percent)}%` }}
                                  transition={{ duration: 0.65, ease: "easeOut", delay: idx * 0.08 }}
                                  className={`w-full rounded-xl transition-all flex items-center justify-center font-bold text-xs ${
                                    isCorrect
                                      ? "bg-gradient-to-t from-emerald-600 to-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.5)] ring-2 ring-emerald-300"
                                      : "bg-gradient-to-t from-indigo-900 to-indigo-600 text-white"
                                  }`}
                                >
                                  {isCorrect && <Check className="w-4 h-4 stroke-[3]" />}
                                </motion.div>
                              </div>

                              {/* Option label & text */}
                              <div className="text-center w-full">
                                <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-black font-mono mb-1 ${
                                  isCorrect ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-white"
                                }`}>
                                  {badgeLetter}
                                </span>
                                <p className="text-xs font-bold text-slate-300 line-clamp-2 px-1">
                                  {opt}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Smooth SVG Donut Chart */
                    <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-8">
                      <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                          {donutSlices.map((slice, i) => (
                            <circle
                              key={i}
                              cx="80"
                              cy="80"
                              r="65"
                              fill="transparent"
                              stroke={slice.color}
                              strokeWidth="24"
                              strokeDasharray={slice.strokeDasharray}
                              strokeDashoffset={slice.strokeDashoffset}
                              className="transition-all duration-700"
                            />
                          ))}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-black text-white font-mono">
                            {currentSlideResponses.length}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">মোট ভোট</span>
                        </div>
                      </div>

                      {/* Donut Legend */}
                      <div className="space-y-2 w-full max-w-sm">
                        {donutSlices.map((slice, i) => (
                          <div
                            key={i}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                              slice.isCorrect
                                ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                                : "bg-slate-900 border-slate-800 text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                              <span className="text-xs font-black font-mono">{slice.label}.</span>
                              <span className="text-xs font-bold truncate">{slice.text}</span>
                            </div>
                            <div className="font-mono text-xs font-black shrink-0">
                              {slice.votes} ভোট ({slice.percent}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question & Explanation Card (Fix 7 Requirement) */}
                  <div className="p-6 rounded-3xl bg-slate-900/90 border-2 border-indigo-500/40 space-y-3 text-left shadow-xl">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <span className="text-xs font-black text-indigo-300 uppercase tracking-wider">
                        সঠিক সমাধান ও শিক্ষক ব্যাখ্যা
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-black flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>সঠিক উত্তর: {typeof currentSlide.correctAnswer === "number" && currentSlide.options ? currentSlide.options[currentSlide.correctAnswer] : String(currentSlide.correctAnswer || "সঠিক উত্তর")}</span>
                      </span>
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-white">
                      {(currentSlide as any).questionText || currentSlide.title}
                    </h4>

                    {(currentSlide.explanation || serverExplanation) && (
                      <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-800/60 text-indigo-200 text-xs sm:text-sm leading-relaxed">
                        💡 <strong className="text-white">ব্যাখ্যা:</strong> {currentSlide.explanation || serverExplanation}
                      </div>
                    )}
                  </div>

                  {/* Auto-Displayed Correct Responders List (Fix 7 Requirement) */}
                  <div className="space-y-3 text-left">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs sm:text-sm font-black text-emerald-300 flex items-center gap-2">
                        <span>🏆 যারা সঠিক উত্তর দিয়েছে ({correctResponders.length} জন):</span>
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400">তড়িৎ গতি ও নির্ভুল স্কোর</span>
                    </div>

                    <div className="flex flex-wrap gap-2.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      {correctResponders.length === 0 ? (
                        <p className="text-xs text-slate-500 py-2">কেউ সঠিক উত্তর দিতে পারেনি।</p>
                      ) : (
                        correctResponders.map((r, i) => (
                          <motion.div
                            key={r.id || r.playerId || i}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/50 text-white shadow-sm"
                          >
                            <RenderColorfulAvatar avatarId={r.avatar} size="xs" showGlow={false} />
                            <span className="text-xs font-bold">{r.studentName}</span>
                            {r.responseTimeMs && (
                              <span className="text-[10px] font-mono font-black text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded-md">
                                {(r.responseTimeMs / 1000).toFixed(2)}s
                              </span>
                            )}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Teacher Toggle for Wrong / Timed-Out Students (Fix 7 Requirement) */}
                  <div className="text-left space-y-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowWrongStudents(!showWrongStudents)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-black text-rose-300 flex items-center gap-2 cursor-pointer transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-rose-400" />
                      <span>
                        {showWrongStudents
                          ? "গোপন করুন"
                          : `👁️ কে ভুল করেছে বা উত্তর দেয়নি দেখুন (${wrongResponders.length + timedOutPlayers.length} জন)`}
                      </span>
                    </button>

                    <AnimatePresence>
                      {showWrongStudents && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-3"
                        >
                          <div className="flex flex-wrap gap-2">
                            {[...wrongResponders, ...timedOutPlayers].map((st, i) => (
                              <div
                                key={st.id || st.playerId || i}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-rose-500/40 text-rose-200 text-xs font-bold"
                              >
                                <RenderColorfulAvatar avatarId={st.avatar} size="xs" showGlow={false} />
                                <span>{st.studentName}</span>
                                <span className="text-[9px] text-rose-400 uppercase font-mono">
                                  {st.timedOut ? "⏰ সময় শেষ" : "❌ ভুল"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </main>

      {/* =====================================================================
          3. BOTTOM FLOATING PRESENTER CONTROL DOCK
          ===================================================================== */}
      <footer className="relative z-20 w-full px-6 py-4 flex items-center justify-center shrink-0">
        <div className="px-5 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl flex items-center gap-3">
          <button
            type="button"
            disabled={currentSlideIndex === 0 || isAdvancingSlide}
            onClick={handlePrevSlide}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>পূর্ববর্তী</span>
          </button>

          <span className="text-xs font-mono font-black text-indigo-300 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            স্লাইড {currentSlideIndex + 1} / {slides.length}
          </span>

          <button
            type="button"
            disabled={isAdvancingSlide}
            onClick={handleNextSlide}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            {isAdvancingSlide ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{currentSlideIndex >= slides.length - 1 ? "🏆 সমাপ্তি ও লিডারবোর্ড" : "পরবর্তী স্লাইড"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="h-5 w-[1px] bg-slate-800 mx-1" />

          {/* Reveal Answer Toggle (Graded) */}
          {isCurrentGraded && (
            <button
              type="button"
              onClick={() => setIsAnswerRevealed(!isAnswerRevealed)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                isAnswerRevealed
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isAnswerRevealed ? "উত্তর গোপন করুন" : "👁️ উত্তর দেখান"}</span>
            </button>
          )}

          {/* Show Leaderboard Modal & Broadcast to Students */}
          <button
            type="button"
            onClick={async () => {
              const nextState = !showLeaderboardModal;
              setShowLeaderboardModal(nextState);
              try {
                await fetch(`/api/live-quizzes/sessions/${sessionId}/next`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ slideIndex: currentSlideIndex, showLeaderboard: nextState }),
                });
              } catch {}
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>🏆 লিডারবোর্ড</span>
          </button>

          {/* End Presentation / Show Podium Button */}
          <button
            type="button"
            onClick={handleEndAndShowPodium}
            className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>🏁 সমাপ্তি ও ফলাফল</span>
          </button>
        </div>
      </footer>

      {/* =====================================================================
          GIANT QR CODE MODAL FOR STUDENTS IN THE BACK
          ===================================================================== */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-center space-y-4"
            >
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">📱 মোবাইল দিয়ে স্ক্যান করুন</h3>
                <p className="text-xs text-slate-400">পিছনের বেঞ্চ থেকে সহজে ক্যামেরা তাক করে জয়েন করুন</p>
              </div>

              {/* High-Contrast Giant QR Code Canvas */}
              <div className="p-4 bg-white rounded-2xl mx-auto inline-block shadow-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                    `${typeof window !== "undefined" ? window.location.origin : ""}/quiz/join?code=${sessionCode}`
                  )}`}
                  alt="QR Code"
                  className="w-56 h-56 mx-auto"
                />
              </div>

              <div className="text-center font-mono">
                <span className="text-xs text-slate-400">কুইজ পিন কোড:</span>
                <div className="text-2xl font-black text-amber-300 tracking-widest mt-0.5">{sessionCode}</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          3D PODIUM & TOP 10 LEADERBOARD MODAL
          ===================================================================== */}
      <AnimatePresence>
        {showLeaderboardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setShowLeaderboardModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl shadow-lg border border-amber-500/40">
                  🏆
                </div>
                <h2 className="text-2xl font-black text-white">লাইভ স্কোরবোর্ড ও ফলাফল</h2>
                <p className="text-xs text-slate-400">সেরা পারফরমারদের অবস্থান ও অর্জিত পয়েন্ট</p>
              </div>

              {/* 3D Top 3 Podium Cards */}
              <div className="grid grid-cols-3 gap-3 items-end pt-4">
                {/* 2nd Place */}
                <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-center space-y-1">
                  <div className="text-2xl">🥈</div>
                  <span className="text-xs font-black text-slate-300 block truncate">
                    {topPlayers[1]?.displayName || "খেলোয়াড় ২"}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {topPlayers[1]?.totalScore || 0} pts
                  </span>
                </div>

                {/* 1st Place */}
                <div className="p-4 rounded-3xl bg-amber-500/20 border-2 border-amber-500 text-center space-y-1.5 shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                  <div className="text-3xl animate-bounce">👑</div>
                  <span className="text-sm font-black text-amber-300 block truncate">
                    {topPlayers[0]?.displayName || "খেলোয়াড় ১"}
                  </span>
                  <span className="text-sm font-mono font-black text-amber-200">
                    {topPlayers[0]?.totalScore || 0} pts
                  </span>
                </div>

                {/* 3rd Place */}
                <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-center space-y-1">
                  <div className="text-2xl">🥉</div>
                  <span className="text-xs font-black text-slate-300 block truncate">
                    {topPlayers[2]?.displayName || "খেলোয়াড় ৩"}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {topPlayers[2]?.totalScore || 0} pts
                  </span>
                </div>
              </div>

              {/* Remaining Top 10 List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                {topPlayers.slice(3).map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-bold"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-400 flex items-center justify-center font-mono">
                        {idx + 4}
                      </span>
                      <span className="text-white">{p.displayName}</span>
                    </div>
                    <span className="font-mono text-indigo-400">{p.totalScore || 0} pts</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SPOTLIGHT OPEN-ENDED CARD MODAL */}
      <AnimatePresence>
        {spotlightCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-4"
            >
              <button
                type="button"
                onClick={() => setSpotlightCard(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <span className="text-3xl">💡</span>
                <div>
                  <h3 className="text-base font-black text-white">{spotlightCard.playerName || "শিক্ষার্থী"}</h3>
                  <span className="text-xs text-indigo-400 font-bold">স্পটলাইট মতামত</span>
                </div>
              </div>

              <p className="text-lg sm:text-xl font-medium text-white leading-relaxed py-2">
                &ldquo;
                {typeof spotlightCard.answerPayload === "string"
                  ? spotlightCard.answerPayload
                  : JSON.stringify(spotlightCard.answerPayload)}
                &rdquo;
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          FLOATING AUTO-SMS NOTIFICATION TOAST (TASK 2.2)
          ===================================================================== */}
      <AnimatePresence>
        {smsToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 ${
              smsToast.type === "PRAISE"
                ? "bg-emerald-950/90 border-emerald-500/60 text-emerald-200"
                : "bg-amber-950/90 border-amber-500/60 text-amber-200"
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-lg">
              {smsToast.type === "PRAISE" ? "🌟" : "😂"}
            </div>
            <div>
              <p className="text-xs font-black">
                📲 {smsToast.studentName}-এর কাছে অটো-{smsToast.type === "PRAISE" ? "প্রশংসা" : "অনুপ্রেরণামূলক"} SMS পাঠানো হয়েছে!
              </p>
              <p className="text-[10px] text-slate-300">অভিভাবক ও শিক্ষার্থীর ফোনে লাইভ নোটিফিকেশন পৌঁছেছে</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          GRAND 3D CHAMPION PODIUM & POST-SESSION SMART ANALYTICS (TASK 4)
          ===================================================================== */}
      <AnimatePresence>
        {isFinalPodiumOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setIsFinalPodiumOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black tracking-wide uppercase">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  গ্র্যান্ড ফাইনাল ও পোস্ট-সেশন অ্যানালিটিক্স
                </div>

                {/* Royal Celebration Banner (Task 3) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border-2 border-amber-400/60 shadow-[0_0_35px_rgba(245,158,11,0.3)] text-center space-y-1.5"
                >
                  <div className="text-lg sm:text-2xl font-black text-amber-300 flex items-center justify-center gap-2">
                    <span>🎊 ধন্যবাদ ও অভিনন্দন! আজকের সেশন সফলভাবে সমাপ্ত হয়েছে!</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-200/90 font-medium">
                    সকল শিক্ষার্থীর সক্রিয় অংশগ্রহণ প্রশংসনীয়। নিচে ক্লাসের সার্বিক ফলাফল ও পারফরম্যান্স বিশ্লেষণ প্রদর্শিত হলো।
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>🎯 ক্লাসের সার্বিক নির্ভুলতা: {overallAccuracy}%</span>
                    </span>
                    <span className="px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-black flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>মোট অংশগ্রহণকারী: {players.length} জন</span>
                    </span>
                  </div>
                </motion.div>

                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  🏁 {deckTitle} — ফলাফল সারসংক্ষেপ
                </h2>
              </div>

              {/* 3 Nav Tabs */}
              <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-lg mx-auto">
                <button
                  type="button"
                  onClick={() => setReportTab("podium")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                    reportTab === "podium"
                      ? "bg-amber-500 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>🏆 পোডিয়াম</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportTab("most_missed")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                    reportTab === "most_missed"
                      ? "bg-rose-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>⚠️ কঠিন প্রশ্ন রাডার</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportTab("warmup")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                    reportTab === "warmup"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>💬 মতামত সামারি</span>
                </button>
              </div>

              {/* TAB 1: 3D GRAND PODIUM */}
              {reportTab === "podium" && (
                <div className="space-y-6 pt-2">
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end pt-8">
                    {/* 2nd Place */}
                    <div className="p-4 rounded-3xl bg-slate-800/90 border border-slate-700 text-center space-y-2 relative">
                      <div className="w-10 h-10 rounded-full bg-slate-700 text-2xl flex items-center justify-center mx-auto shadow-md">
                        🥈
                      </div>
                      <span className="text-xs sm:text-sm font-black text-slate-200 block truncate">
                        {topPlayers[1]?.displayName || "খেলোয়াড় ২"}
                      </span>
                      <div className="text-xs font-mono font-bold text-slate-400">
                        {topPlayers[1]?.totalScore || 0} pts
                      </div>
                      <div className="text-[10px] text-indigo-400 font-bold">
                        ⭐ {topPlayers[1]?.correctAnswers || 0}টি সঠিক
                      </div>
                      <div className="h-16 sm:h-20 bg-gradient-to-t from-slate-700 to-slate-800/40 rounded-2xl flex items-center justify-center text-xl font-black text-slate-400">
                        ২য়
                      </div>
                    </div>

                    {/* 1st Place (Champion) */}
                    <div className="p-5 rounded-3xl bg-amber-500/20 border-2 border-amber-500 text-center space-y-2.5 relative shadow-[0_0_40px_rgba(245,158,11,0.3)]">
                      <div className="w-12 h-12 rounded-full bg-amber-500/30 text-3xl flex items-center justify-center mx-auto shadow-lg animate-bounce">
                        👑
                      </div>
                      <span className="text-sm sm:text-base font-black text-amber-300 block truncate">
                        {topPlayers[0]?.displayName || "খেলোয়াড় ১"}
                      </span>
                      <div className="text-sm sm:text-base font-mono font-black text-amber-200">
                        {topPlayers[0]?.totalScore || 0} pts
                      </div>
                      <div className="text-xs text-amber-400 font-black">
                        ⭐ {topPlayers[0]?.correctAnswers || 0}টি সঠিক (সেরা পারফরমার)
                      </div>
                      <div className="h-24 sm:h-32 bg-gradient-to-t from-amber-500/60 to-amber-500/10 rounded-2xl flex items-center justify-center text-2xl font-black text-amber-300 border border-amber-500/40">
                        ১ম
                      </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="p-4 rounded-3xl bg-slate-800/90 border border-slate-700 text-center space-y-2 relative">
                      <div className="w-10 h-10 rounded-full bg-slate-700 text-2xl flex items-center justify-center mx-auto shadow-md">
                        🥉
                      </div>
                      <span className="text-xs sm:text-sm font-black text-slate-200 block truncate">
                        {topPlayers[2]?.displayName || "খেলোয়াড় ৩"}
                      </span>
                      <div className="text-xs font-mono font-bold text-slate-400">
                        {topPlayers[2]?.totalScore || 0} pts
                      </div>
                      <div className="text-[10px] text-indigo-400 font-bold">
                        ⭐ {topPlayers[2]?.correctAnswers || 0}টি সঠিক
                      </div>
                      <div className="h-12 sm:h-16 bg-gradient-to-t from-slate-700 to-slate-800/40 rounded-2xl flex items-center justify-center text-lg font-black text-slate-400">
                        ৩য়
                      </div>
                    </div>
                  </div>

                  {/* 4th - 10th Honorable List (Task 3) */}
                  {topPlayers.length > 3 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between px-1">
                        <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-400" />
                          <span>৪র্থ থেকে ১০ম সম্মাননা তালিকা:</span>
                        </h4>
                        <span className="text-[10px] text-slate-500">শীর্ষ দশ প্রতিযোগী</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {topPlayers.slice(3, 10).map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/50 flex items-center justify-center font-mono font-bold text-[11px]">
                                #{idx + 4}
                              </span>
                              <span className="font-bold text-white truncate max-w-[130px]">{p.displayName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400">⭐ {p.correctAnswers || 0}টি সঠিক</span>
                              <span className="font-mono font-bold text-amber-300">{p.totalScore || 0} pts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Participant Table */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 px-1">সম্পূর্ণ র‍্যাঙ্কিং ({players.length} জন):</h4>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {topPlayers.map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-mono font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-white">{p.displayName}</span>
                            <span className="text-[10px] text-slate-400">
                              (রোল: {p.studentId || p.roll || "-"})
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400">সঠিক: {p.correctAnswers || 0}টি</span>
                            <span className="font-mono font-bold text-amber-300">{p.totalScore || 0} pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MOST MISSED QUESTIONS RADAR */}
              {reportTab === "most_missed" && (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/40 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    <p className="text-xs text-rose-200 leading-relaxed">
                      ক্লাসের শিক্ষার্থীরা যেসব প্রশ্নে সবচেয়ে বেশি ভুল করেছে, সেগুলোর তালিকা নিচে দেওয়া হলো। শিক্ষক সরাসরি বোর্ডে সঠিক উত্তর ও ব্যাখ্যা স্পটলাইট করে রিভিশন নিতে পারেন।
                    </p>
                  </div>

                  {mostMissedQuestions.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      🎉 অসাধারণ! কোনো প্রশ্নে উল্লেখযোগ্য ভুল পাওয়া যায়নি অথবা এখনও কোনো গ্রেডেড প্রশ্ন উত্তর করা হয়নি।
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mostMissedQuestions.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 hover:border-rose-500/50 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-rose-950 text-rose-400 border border-rose-800/60 text-[10px] font-black uppercase">
                                  #{idx + 1} সবচেয়ে ভুল হওয়া প্রশ্ন
                                </span>
                                <span className="text-xs font-mono font-bold text-slate-400">
                                  ভুলের হার: {100 - item.accuracy}%
                                </span>
                              </div>
                              <h5 className="text-sm font-bold text-white">
                                {item.slide.title}
                              </h5>
                            </div>

                            <button
                              type="button"
                              onClick={() => setReviewQuestion(item.slide)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>👁️ বোর্ডে দেখান</span>
                            </button>
                          </div>

                          {/* Accuracy Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>সঠিক উত্তরদাতা: {item.correctCount} জন ({item.accuracy}%)</span>
                              <span>ভুল উত্তরদাতা: {item.missedCount} জন ({100 - item.accuracy}%)</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                              <div
                                style={{ width: `${item.accuracy}%` }}
                                className="h-full bg-emerald-500"
                              />
                              <div
                                style={{ width: `${100 - item.accuracy}%` }}
                                className="h-full bg-rose-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: WARMUP & FEEDBACK SUMMARY */}
              {reportTab === "warmup" && (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-200">
                    💡 ক্লাসের শুরুতে নেওয়া ওয়ার্ড ক্লাউড এবং ওপেন-এন্ডেড ব্রেনস্টর্মিংয়ের সংরক্ষিত ফলাফল।
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-400">ওয়ার্ড ক্লাউড সংগৃহীত শব্দসমূহ:</h5>
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-wrap gap-2">
                      {wordCloudWords.map((w, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-xl bg-slate-800 text-indigo-300 border border-slate-700 text-xs font-bold"
                        >
                          {w.word} ({w.count})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-400">শিক্ষার্থীদের উন্মুক্ত মতামত ও প্রশ্নোত্তর:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                      {answers
                        .filter((a) => typeof a.answerPayload === "string" && isNaN(Number(a.answerPayload)))
                        .slice(0, 8)
                        .map((a, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1"
                          >
                            <span className="font-bold text-indigo-400 block">{a.studentName || "শিক্ষার্থী"}:</span>
                            <p>&ldquo;{a.answerPayload}&rdquo;</p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons Bar */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>📥 সম্পূর্ণ ফলাফল শিট ডাউনলোড (CSV)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSendingFinalSms}
                    onClick={handleSendFinalSms}
                    className="px-4 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isSendingFinalSms ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Smartphone className="w-4 h-4 text-indigo-400" />
                    )}
                    <span>📲 ফাইনাল রেজাল্ট SMS পাঠান</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition cursor-pointer shadow-md"
                >
                  ⏹️ প্রেজেন্টেশন সমাপ্ত করুন (Exit)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          SPOTLIGHT QUESTION REVIEW MODAL (TASK 4.2)
          ===================================================================== */}
      <AnimatePresence>
        {reviewQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6"
            >
              <button
                type="button"
                onClick={() => setReviewQuestion(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800/60 text-xs font-black uppercase">
                  ⚠️ ক্লাসের ভুলের পর্যালোচনা (Spotlight Review)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white pt-2">
                  {reviewQuestion.title}
                </h3>
              </div>

              {/* Options list with correct highlighted */}
              <div className="space-y-2.5">
                {(reviewQuestion.options || []).map((opt: string, idx: number) => {
                  const isCorrect = idx === reviewQuestion.correctOptionIndex;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border flex items-center justify-between text-sm font-bold ${
                        isCorrect
                          ? "bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                          : "bg-slate-950/60 border-slate-800 text-slate-400"
                      }`}
                    >
                      <span>{opt}</span>
                      {isCorrect && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-black">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>সঠিক উত্তর</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {reviewQuestion.explanation && (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-900/50 text-xs text-indigo-200 space-y-1">
                  <strong className="text-white block font-black">💡 শিক্ষণীয় ব্যাখ্যা:</strong>
                  <p>{reviewQuestion.explanation}</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Reactions Overlay */}
      <FloatingReactionOverlay />
    </div>
  );
}
