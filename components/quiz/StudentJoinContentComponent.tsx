"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { QuizPlateTemplate } from "@/lib/database";
import { QuizPlate } from "@/components/quiz/templates";
import {
  Sparkles,
  Users,
  Tv,
  LogOut,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Loader2,
  Wifi,
  WifiOff,
  Clock,
  Check,
  Award,
  Timer,
  Flame,
  X,
  User,
  Search,
  ChevronDown,
  Radio,
  Lock,
  ShieldCheck,
  Zap
} from "lucide-react";
import SouthAsianStudentAvatar, { STUDENT_AVATAR_PRESETS, RenderStudentAvatar } from "@/components/common/SouthAsianStudentAvatar";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import UniversalQuestionRenderer from "@/components/quiz/shared/UniversalQuestionRenderer";
import UniversalQuizShowcaseEngine from "@/components/quiz/engine/UniversalQuizShowcaseEngine";

interface SavedPlayerSession {
  sessionId: string;
  sessionCode: string;
  displayName: string;
  playerToken: string;
  studentId?: number;
  reconnectToken?: string;
  playerId?: string;
}

export function StudentJoinContentComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, showToast } = useAuth();

  // URL PIN parameter auto-fill
  const pinFromUrl = searchParams ? searchParams.get("pin") || "" : "";

  // Form State
  const [sessionCode, setSessionCode] = useState(pinFromUrl);
  const [displayName, setDisplayName] = useState(
    currentUser && currentUser.role === "student" ? currentUser.fullName : ""
  );
  
  // Status States
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<"connected" | "disconnected" | "reconnecting" | "restored" | "failed">("connected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Session State for Lobby & Game
  const [activeSession, setActiveSession] = useState<{
    id: string;
    quizId: string;
    sessionCode: string;
    status: string;
    isLocked: boolean;
  } | null>(null);
  const [quizDetails, setQuizDetails] = useState<{
    title: string;
    questionCount: number;
  } | null>(null);
  const [playerToken, setPlayerToken] = useState("");
  const [lobbyPlayers, setLobbyPlayers] = useState<{ id: string; displayName: string }[]>([]);

  // GAME STATES
  const [sessionStatus, setSessionStatus] = useState<string>("LOBBY");
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [playerAnswered, setPlayerAnswered] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<any>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [answeredCount, setAnswersCount] = useState<number>(0);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [participantId, setParticipantId] = useState<string>("");
  const [playerEvaluation, setPlayerEvaluation] = useState<any | null>(null);
  const [studentStats, setStudentStats] = useState<any | null>(null);
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [activePlate, setActivePlate] = useState<QuizPlateTemplate | null>(null);
  const [activeMotivation, setActiveMotivation] = useState<{
    category: string;
    message: string;
    durationMs: number;
  } | null>(null);

  // Attendance-Linked States & Avatar Picker (Task 1)
  const [attendanceEligibleStudents, setAttendanceEligibleStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | number | undefined>(undefined);
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");
  const [isAttendanceDropdownOpen, setIsAttendanceDropdownOpen] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("sa_male_cyan");

  // 3-Stage Flow & All-Voted Auto-Reveal States (Task 2, 3, 4)
  const [currentPhase, setCurrentPhase] = useState<"LOBBY" | "READY" | "COUNTDOWN" | "QUESTION_PREVIEW" | "QUESTION_ACTIVE" | "QUESTION_ENDED" | "COMPLETED">("LOBBY");
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);
  const [previewSeconds, setPreviewSeconds] = useState<number>(3.5);
  const [allVoted, setAllVoted] = useState<boolean>(false);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);

  // Pre-Quiz & Mentimeter Warmup States
  const [activePreQuiz, setActivePreQuiz] = useState<any | null>(null);
  const [isQuizModeStarted, setIsQuizModeStarted] = useState<boolean>(false);
  const [preQuizInput, setPreQuizInput] = useState<string>("");
  const [preQuizSelectedMood, setPreQuizSelectedMood] = useState<string>("fire");
  const [preQuizStickyColor, setPreQuizStickyColor] = useState<string>("amber");
  const [preQuizSubmitted, setPreQuizSubmitted] = useState<boolean>(false);
  const [isSubmittingPreQuiz, setIsSubmittingPreQuiz] = useState<boolean>(false);
  const [scheduledSecondsLeft, setScheduledSecondsLeft] = useState<number | null>(null);

  // Scheduled Auto-Start countdown timer
  useEffect(() => {
    const target = (activeSession as any)?.scheduledStartTime || (activeSession as any)?.scheduledAt;
    if (!target) {
      setScheduledSecondsLeft(null);
      return;
    }
    const updateCountdown = () => {
      const diff = Math.floor((new Date(target).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setScheduledSecondsLeft(0);
        return;
      }
      setScheduledSecondsLeft(diff);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  // Auto-dismiss active motivation messages after their duration expires
  useEffect(() => {
    if (!activeMotivation) return;
    const timer = setTimeout(() => {
      setActiveMotivation(null);
    }, activeMotivation.durationMs || 8000);
    return () => clearTimeout(timer);
  }, [activeMotivation]);

  // Fetch institutional students for quick selection
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("/api/students");
        const data = await res.json();
        if (data.success && data.students) {
          setRegisteredStudents(data.students);
        }
      } catch (err) {
        console.error("Failed to load students:", err);
      }
    };
    fetchStudents();
  }, []);

  // Fetch Attendance Eligibility based on session PIN / date (Task 1)
  useEffect(() => {
    let isMounted = true;
    const fetchAttendance = async () => {
      try {
        setIsLoadingAttendance(true);
        const codeParam = sessionCode ? `&sessionCode=${encodeURIComponent(sessionCode.trim())}` : "";
        const res = await fetch(`/api/attendance?action=quiz_eligibility${codeParam}`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (isMounted && data && data.success && Array.isArray(data.students)) {
            setAttendanceEligibleStudents(data.students);
          }
        }
      } catch (err) {
        console.warn("Failed to load attendance eligibility:", err);
      } finally {
        if (isMounted) setIsLoadingAttendance(false);
      }
    };

    fetchAttendance();
  }, [sessionCode]);

  // Local timer tick for Countdown and Preview phase (Task 3)
  useEffect(() => {
    if (!joined) return;
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setPreviewSeconds((prev) => (prev > 0 ? Math.max(0, Number((prev - 0.5).toFixed(1))) : 0));
    }, 500);
    return () => clearInterval(interval);
  }, [joined]);

  // Polling reference
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectToken, setReconnectToken] = useState<string>("");
  const reconnectAttemptsRef = useRef<number>(0);

  // Check localStorage for active reconnection
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const saved = localStorage.getItem("pgtsc_live_quiz_player");
        if (saved) {
          const parsed = JSON.parse(saved);
          
          setLoading(true);
          const res = await fetch(`/api/live-quizzes/sessions/${parsed.sessionId}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionCode: parsed.sessionCode,
              displayName: parsed.displayName,
              playerToken: parsed.playerToken,
              reconnectToken: parsed.reconnectToken,
              role: "student"
            })
          }).catch(() => null);
          let data: any = null;
          if (res && res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
            data = await res.json().catch(() => null);
          }
          setLoading(false);

          if (data && data.success && data.state) {
            const { state, reconnectToken: newTok } = data;
            
            setPlayerToken(parsed.playerToken || state.participant.id);
            setParticipantId(state.participant.id);
            setSessionCode(parsed.sessionCode);
            setDisplayName(state.participant.displayName);
            setReconnectToken(newTok);
            setActiveSession(state.session);
            setSessionStatus(state.session.status);
            setJoined(true);
            
            // Restore recovered state instantly
            setTotalQuestions(state.session.totalQuestions);
            setCurrentQuestionIdx(state.session.currentQuestionIndex);
            if (state.currentQuestion) {
              setCurrentQuestion(state.currentQuestion);
            }
            if (state.participant.stats) {
              setStudentStats(state.participant.stats);
            }
            if (data.motivationMessage) {
              setActiveMotivation(data.motivationMessage);
            }
          }
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
      }
    };
    checkActiveSession();
  }, []);

  // Polling loop for active session state & question sync
  useEffect(() => {
    if (!joined || !activeSession || !participantId) return;

    const pollState = async () => {
      try {
        const res = await fetch(`/api/live-quizzes/sessions/${activeSession.id}/state?participantId=${participantId}`).catch(() => null);
        if (!res || !res.ok) {
          setNetworkStatus("reconnecting");
          return;
        }
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          setNetworkStatus("reconnecting");
          return;
        }
        const data = await res.json().catch(() => null);
        if (data && data.success) {
          setNetworkStatus("connected");
          reconnectAttemptsRef.current = 0;

          if (data.status) {
            setSessionStatus(data.status);
            if (data.status === "CANCELLED" || data.status === "COMPLETED") {
              if (data.status === "COMPLETED") {
                setSessionStatus("COMPLETED");
              }
            }
          }

          if (data.phase) {
            setCurrentPhase(data.phase);
          }
          if (data.countdownSeconds !== undefined) {
            setCountdownSeconds(data.countdownSeconds);
          }
          if (data.previewSeconds !== undefined) {
            setPreviewSeconds(data.previewSeconds);
          }
          if (data.allVoted !== undefined) {
            setAllVoted(Boolean(data.allVoted));
          }
          if (data.allVoted) {
            setTimeLeft(0);
            if (data.correctAnswer !== undefined) {
              setPlayerEvaluation((prev: any) => prev || {
                isCorrect: selectedOption !== "" ? String(selectedOption) === String(data.correctAnswer) : false,
                correctAnswer: data.correctAnswer
              });
            }
          }

          if (data.currentQuestionIndex !== undefined) {
            if (data.currentQuestionIndex !== currentQuestionIdx) {
              setCurrentQuestionIdx(data.currentQuestionIndex);
              setPlayerAnswered(false);
              setSelectedOption("");
              setPlayerEvaluation(null);
              setAllVoted(false);
              setIsPlayerReady(false);
            }
          }

          if (data.currentQuestion) {
            setCurrentQuestion(data.currentQuestion);
          }

          if (data.totalQuestions) {
            setTotalQuestions(data.totalQuestions);
          }

          if (data.answeredCount !== undefined) {
            setAnswersCount(data.answeredCount);
          }

          if (data.playerCount !== undefined) {
            setPlayerCount(data.playerCount);
          }

          if (data.studentStats) {
            setStudentStats(data.studentStats);
          }

          if (data.sessionStatus) {
            setSessionStatus(data.sessionStatus);
          }

          // Check if player already answered this question
          if (data.playerAnswered !== undefined) {
            setPlayerAnswered(data.playerAnswered);
          }

          // Timer sync - only tick down during QUESTION_ACTIVE if not all voted
          if (data.timeLeft !== undefined && !data.allVoted && (data.phase === "QUESTION_ACTIVE" || !data.phase)) {
            setTimeLeft(data.timeLeft);
          }

          if (data.plate) {
            setActivePlate(data.plate);
          }

          if (data.motivationMessage) {
            setActiveMotivation(data.motivationMessage);
          }

          if (data.activePreQuizActivity !== undefined) {
            setActivePreQuiz((prev: any) => {
              if (data.activePreQuizActivity?.id !== prev?.id) {
                setPreQuizSubmitted(false);
                setPreQuizInput("");
              }
              return data.activePreQuizActivity;
            });
          }

          if (data.isQuizModeStarted !== undefined) {
            setIsQuizModeStarted(Boolean(data.isQuizModeStarted));
          }
        }
      } catch (err) {
        setNetworkStatus("disconnected");
        reconnectAttemptsRef.current += 1;
        if (reconnectAttemptsRef.current > 5) {
          setNetworkStatus("failed");
        }
      }
    };

    pollState();
    pollingIntervalRef.current = setInterval(pollState, 1500);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [joined, activeSession, participantId, networkStatus, currentQuestionIdx]);

  // Handle Ready State
  const handleSetReady = async () => {
    if (!activeSession || !participantId) return;
    try {
      setIsPlayerReady(true);
      await fetch(`/api/live-quizzes/sessions/${activeSession.id}/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: participantId,
          isReady: true,
          studentName: displayName,
          avatar: selectedAvatar,
        })
      });
    } catch (e) {
      console.warn("Failed to set ready:", e);
    }
  };

  // Handle Joining Quiz via PIN
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCode.trim()) {
      setErrorMessage("দয়া করে সঠিক ৬-সংখ্যার কুইজ পিন (PIN) লিখুন।");
      return;
    }
    if (!displayName.trim()) {
      setErrorMessage("দয়া করে আপনার নাম বা রোল নম্বর লিখুন।");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/live-quizzes/sessions/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionCode: sessionCode.trim(),
          displayName: displayName.trim(),
          studentId: selectedStudentId ? String(selectedStudentId) : undefined,
          avatar: selectedAvatar,
          role: "student"
        })
      }).catch(() => null);

      let data: any = null;
      if (res && res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
        data = await res.json().catch(() => null);
      }
      setLoading(false);

      if (data && data.success) {
        setJoined(true);
        setActiveSession(data.session);
        setPlayerToken(data.participant.playerToken || data.participant.id);
        setParticipantId(data.participant.id);
        setReconnectToken(data.reconnectToken || "");
        
        // Store inside localStorage to enable reconnection on refresh
        const sessionStore: SavedPlayerSession = {
          sessionId: data.session.id,
          sessionCode: data.session.sessionCode,
          displayName: data.participant.displayName,
          playerToken: data.participant.playerToken || data.participant.id,
          playerId: data.participant.id,
          studentId: data.participant.studentId,
          reconnectToken: data.reconnectToken || ""
        };
        localStorage.setItem("pgtsc_live_quiz_player", JSON.stringify(sessionStore));
        
        if (data.quiz) {
          setQuizDetails({
            title: data.quiz.title,
            questionCount: data.quiz.questionCount || 0
          });
        }
        if (data.session.totalQuestions) {
          setTotalQuestions(data.session.totalQuestions);
        }
      } else {
        if (data?.eligibilityBlocked) {
          setErrorMessage(`⛔ কুইজ অংশগ্রহণের যোগ্যতা শর্ত পূরণ হয়নি: ${data.message || data.error}`);
        } else {
          setErrorMessage(data?.message || data?.error || "কুইজে যুক্ত হতে ব্যর্থ হয়েছে। পিন কোড যাচাই করুন।");
        }
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || "সার্ভার সংযোগে ত্রুটি ঘটেছে।");
    }
  };

  // Submit Pre-Quiz Ungraded Warmup Response
  const handleSubmitPreQuiz = async (overrideValue?: string) => {
    if (!activePreQuiz || !activeSession || !participantId || isSubmittingPreQuiz) return;
    const answerToSubmit = overrideValue !== undefined ? overrideValue : preQuizInput;
    if (!answerToSubmit || !String(answerToSubmit).trim()) return;

    setIsSubmittingPreQuiz(true);
    try {
      await fetch(`/api/live-quizzes/sessions/${activeSession.id}/pre-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_response",
          activityId: activePreQuiz.id,
          playerId: participantId,
          playerName: displayName,
          response: String(answerToSubmit).trim(),
          mood: preQuizSelectedMood,
          color: preQuizStickyColor,
        }),
      });
      setPreQuizSubmitted(true);
    } catch (err) {
      console.error("Failed to submit pre-quiz response:", err);
    } finally {
      setIsSubmittingPreQuiz(false);
    }
  };

  // Submit Answer for Current Question
  const handleSubmitAnswer = async () => {
    if (!activeSession || !currentQuestion || playerAnswered || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/live-quizzes/sessions/${activeSession.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          questionId: currentQuestion.id,
          answer: selectedOption,
          timeTakenSeconds: 5
        })
      }).catch(() => null);

      let data: any = null;
      if (res && res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
        data = await res.json().catch(() => null);
      }
      setIsSubmitting(false);

      if (data && data.success) {
        setPlayerAnswered(true);
        if (data.evaluation) {
          setPlayerEvaluation(data.evaluation);
          if (data.evaluation.isCorrect) {
            try {
              confetti({
                particleCount: 50,
                spread: 70,
                origin: { y: 0.7 }
              });
            } catch (e) {}
          }
        }
      } else {
        setErrorMessage(data.error || "উত্তর জমা দিতে সমস্যা হয়েছে।");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage("নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।");
    }
  };

  // Leave Session
  const handleLeave = () => {
    localStorage.removeItem("pgtsc_live_quiz_player");
    setJoined(false);
    setActiveSession(null);
    setCurrentQuestion(null);
    setSessionStatus("LOBBY");
  };

  return (
    <div className="min-h-[80vh] bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden relative">
      {/* Background Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg z-10 space-y-6">
        
        {/* Top Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>লাইভ কুইজ শিক্ষার্থী পোর্টাল (Student Frontend)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
          </h1>
          <p className="text-xs text-slate-400">
            শিক্ষকের দেওয়া পিন কোড দিয়ে লাইভ প্রতিযোগিতায় অংশগ্রহণ করুন
          </p>
        </div>

        {/* Network & Reconnection Status Indicator */}
        {joined && (
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              {networkStatus === "connected" && <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />}
              {networkStatus === "reconnecting" && <WifiOff className="w-4 h-4 text-amber-400 animate-bounce" />}
              {networkStatus === "failed" && <WifiOff className="w-4 h-4 text-rose-500" />}
              <span className="font-bold text-slate-300">
                {networkStatus === "connected" && "লাইভ সার্ভার সংযুক্ত"}
                {networkStatus === "reconnecting" && "পুনরায় সংযোগ স্থাপন করা হচ্ছে..."}
                {networkStatus === "failed" && "সংযোগ বিচ্ছিন্ন! রিফ্রেশ করুন।"}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              রোল/নাম: <strong className="text-cyan-400">{displayName}</strong>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* MAIN VIEW SWITCHER */}
        {!joined ? (
          /* ==================== SCREEN 1: JOIN FORM ==================== */
          <div className="relative group p-[2px] rounded-[28px] overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.3)]">
            {/* Animated Conic Border Glow */}
            <div
              className="absolute inset-[-150%] animate-[borderRotate_4s_linear_infinite] pointer-events-none"
              style={{
                background:
                  "conic-gradient(from 0deg, #06b6d4 0deg, #6366f1 90deg, #a855f7 180deg, #ec4899 270deg, #06b6d4 360deg)",
              }}
            />
            {/* Ambient Aura */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 rounded-[30px] blur-xl opacity-40 group-hover:opacity-60 transition duration-700 pointer-events-none" />

            <div className="relative z-10 bg-slate-900/95 border border-slate-700/60 rounded-[26px] p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6">
              <form onSubmit={handleJoin} className="space-y-6">
                
                {/* 1. Game PIN Field */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs sm:text-sm font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <Tv className="w-4 h-4 text-cyan-400" />
                      <span>৬-সংখ্যার কুইজ পিন (Quiz PIN)</span>
                    </label>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300">
                      ৬ ডিজিট
                    </span>
                  </div>

                  <div className="relative group/pin focus-within:shadow-[0_0_25px_rgba(6,182,212,0.4)] rounded-2xl transition-all">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={sessionCode}
                      onChange={(e) => setSessionCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      className="w-full h-16 sm:h-20 bg-slate-950 border-2 border-slate-700/80 rounded-2xl px-4 text-center font-mono text-3xl sm:text-4xl tracking-[0.3em] sm:tracking-[0.35em] text-white placeholder:text-slate-500 dark:text-slate-400 placeholder:opacity-60 focus:outline-none focus:border-cyan-400 transition-all font-black"
                      required
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400/70 pointer-events-none">
                      <Tv className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>

                  {/* 6 Digit slots */}
                  <div className="grid grid-cols-6 gap-2 pt-1">
                    {(sessionCode || "").padEnd(6, " ").slice(0, 6).split("").map((digit, idx) => {
                      const filled = digit.trim().length > 0;
                      return (
                        <div
                          key={idx}
                          className={`h-9 rounded-xl flex items-center justify-center font-mono font-black text-sm border transition-all ${
                            filled
                              ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                              : "bg-slate-950/70 border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {filled ? digit : "•"}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Attendance-Linked Student Dropdown & Manual Input (Task 1) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs sm:text-sm font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>📋 আজকের উপস্থিত তালিকা থেকে নাম নির্বাচন</span>
                    </label>
                    <span className="text-[11px] text-emerald-300 font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{attendanceEligibleStudents.length > 0 ? `${attendanceEligibleStudents.length} জন উপস্থিত` : "হাজিরা তালিকা"}</span>
                    </span>
                  </div>

                  {/* Smart Searchable Attendance Dropdown */}
                  <div className="space-y-1.5">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsAttendanceDropdownOpen(!isAttendanceDropdownOpen)}
                        className="w-full min-h-[48px] bg-slate-950 border-2 border-indigo-500/50 hover:border-indigo-400 rounded-2xl px-4 py-2.5 text-left text-xs sm:text-sm text-cyan-200 font-bold flex items-center justify-between gap-2 shadow-inner transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {selectedStudentId ? (
                            <span className="text-emerald-300 font-black flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span>{displayName}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              -- আজকের উপস্থিত তালিকা থেকে তোমার নাম সিলেক্ট করো --
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform ${isAttendanceDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {/* Dropdown Options Popup */}
                      {isAttendanceDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-slate-900 border-2 border-indigo-500/60 rounded-2xl shadow-2xl p-2.5 space-y-2 backdrop-blur-2xl max-h-72 flex flex-col">
                          {/* Search Filter Input */}
                          <div className="relative shrink-0">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={attendanceSearchQuery}
                              onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                              placeholder="নাম বা রোল নম্বর দিয়ে ফিল্টার করো..."
                              className="w-full h-10 pl-9 pr-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
                            />
                          </div>

                          {/* Student List */}
                          <div className="overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                            {(() => {
                              const sourceList = attendanceEligibleStudents.length > 0 ? attendanceEligibleStudents : registeredStudents;
                              const filtered = sourceList.filter((s: any) => {
                                const q = attendanceSearchQuery.trim().toLowerCase();
                                if (!q) return true;
                                const n = (s.name || s.nameBangla || "").toLowerCase();
                                const r = String(s.roll || s.studentId || "").toLowerCase();
                                return n.includes(q) || r.includes(q);
                              });

                              if (filtered.length === 0) {
                                return (
                                  <div className="p-3 text-center text-xs text-slate-400">
                                    কোনো শিক্ষার্থী পাওয়া যায়নি। নিচে ম্যানুয়ালি নাম লিখুন।
                                  </div>
                                );
                              }

                              return filtered.map((st: any) => {
                                const isPresent = st.statusCode === "P" || st.attendanceStatus?.includes("Present") || st.attendanceStatus?.includes("উপস্থিত");
                                const isLate = st.statusCode === "L" || st.attendanceStatus?.includes("Late") || st.attendanceStatus?.includes("বিলম্বে");
                                const isSelected = String(selectedStudentId) === String(st.id);

                                return (
                                  <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedStudentId(st.id);
                                      setDisplayName(`${st.name || st.nameBangla} (রোল: ${st.roll})`);
                                      setIsAttendanceDropdownOpen(false);
                                    }}
                                    className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20"
                                        : "bg-slate-950/70 hover:bg-slate-800 border-slate-800 text-slate-200"
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <div className="font-bold text-xs sm:text-sm text-white truncate">
                                        {st.name || st.nameBangla}
                                      </div>
                                      <div className="text-[11px] text-slate-400 font-mono">
                                        রোল: <strong className="text-cyan-300">{st.roll}</strong> {st.trade ? `• ${st.trade}` : ""}
                                      </div>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-1.5">
                                      {isPresent ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-black flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                          <span>🟢 আজ উপস্থিত</span>
                                        </span>
                                      ) : isLate ? (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-black flex items-center gap-1">
                                          <span>🟡 বিলম্বে উপস্থিত</span>
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold">
                                          📋 ক্লাসের শিক্ষার্থী
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Manual Override Text Input */}
                    <div className="relative group/name focus-within:shadow-[0_0_25px_rgba(168,85,247,0.4)] rounded-2xl transition-all">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => {
                          setDisplayName(e.target.value);
                          setSelectedStudentId(undefined);
                        }}
                        placeholder="অথবা সরাসরি নাম ও রোল লিখুন (যেমন: আরিয়ান খান, রোল ১০)"
                        className="w-full h-13 sm:h-14 bg-slate-950 border-2 border-slate-700/80 rounded-2xl px-5 text-sm sm:text-base text-white placeholder:text-slate-500 dark:text-slate-400 placeholder:font-medium focus:outline-none focus:border-purple-400 transition-all font-bold"
                        required
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400/70 pointer-events-none">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Avatar & Icon Grid Picker (Task 1.2) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>🎨 তোমার অ্যাভাটার পছন্দ করো (Avatar & Icon Grid)</span>
                    </label>
                    <span className="text-[11px] font-bold text-amber-300 font-mono bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1.5">
                      <span>নির্বাচিত:</span>
                      <strong className="text-white">{STUDENT_AVATAR_PRESETS.find(p => p.id === selectedAvatar)?.name || selectedAvatar}</strong>
                    </span>
                  </div>

                  {/* Multi-Row Avatar Selection Grid */}
                  <div className="p-3 bg-slate-950/80 border-2 border-slate-800 rounded-2xl">
                    <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-48 overflow-y-auto pr-1 select-none scrollbar-thin scrollbar-thumb-slate-700">
                      {STUDENT_AVATAR_PRESETS.map((preset) => {
                        const isSel = selectedAvatar === preset.id;
                        return (
                          <motion.button
                            key={preset.id}
                            type="button"
                            onClick={() => setSelectedAvatar(preset.id)}
                            whileHover={{ scale: 1.12 }}
                            whileTap={{ scale: 0.92 }}
                            className={`relative p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                              isSel
                                ? "bg-amber-400/20 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] ring-2 ring-amber-300/60 scale-105"
                                : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-white"
                            }`}
                            title={preset.name}
                          >
                            <RenderStudentAvatar avatar={preset.id} size="sm" animate={false} />
                            <span className="text-[9px] font-bold text-slate-300 truncate max-w-full block">
                              {preset.name}
                            </span>
                            {isSel && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center shadow-md">
                                <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 4. Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 sm:h-16 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 text-slate-950 font-black text-base sm:text-lg transition-all shadow-[0_0_35px_rgba(6,182,212,0.55)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 group border border-cyan-300/40"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-slate-950" />
                      <span>লাইভে যুক্ত হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-5 h-5 text-amber-950 fill-amber-900" />
                      <span>🚀 লাইভে যুক্ত হও (Join Live)</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="border-t border-slate-800/80 pt-4 text-center">
                <p className="text-xs text-slate-300 font-medium">
                  💡 শিক্ষকের স্ক্রিন বা প্রজেক্টর থেকে ৬-সংখ্যার পিন কোড দেখে এখানে এন্ট্রি করুন।
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ==================== ACTIVE SESSION VIEWS ==================== */
          (() => {
            // ==================== STAGE A: READY CHECK STAGE ====================
            if (currentPhase === "READY") {
              return (
                <div className="bg-slate-900/95 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-black uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>⚡ রেডি চেক: পরবর্তী প্রশ্নের প্রস্তুতি</span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      প্রশ্ন {currentQuestionIdx + 1} আসছে!
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                      তুমি প্রস্তুত থাকলে নিচের বাটনে ক্লিক করো। শিক্ষক লাইভ কুইজ লঞ্চ করবেন।
                    </p>
                  </div>

                  {/* Ready Toggle Button */}
                  <div className="pt-2">
                    {!isPlayerReady ? (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSetReady}
                        className="w-full max-w-sm mx-auto h-16 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base sm:text-lg shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center gap-3 cursor-pointer"
                      >
                        <span className="text-2xl">🙋‍♂️</span>
                        <span>আমি রেডি! (I&apos;m Ready!)</span>
                      </motion.button>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 max-w-sm mx-auto space-y-1 shadow-lg shadow-emerald-500/20">
                        <div className="flex items-center justify-center gap-2 font-black text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span>✅ আপনি রেডি হয়েছেন!</span>
                        </div>
                        <p className="text-[11px] text-emerald-200/80">
                          শিক্ষক কুইজ শুরু করার অপেক্ষা...
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-4 text-xs text-slate-400 font-mono pt-2">
                    <span>প্রশ্ন {currentQuestionIdx + 1} / {totalQuestions || "?"}</span>
                    <span>•</span>
                    <span>মোট প্রতিযোগী: {playerCount} জন</span>
                  </div>
                </div>
              );
            }

            // ==================== STAGE B: COUNTDOWN (3-2-1 GO!) ====================
            if (currentPhase === "COUNTDOWN" || countdownSeconds > 0) {
              const displayVal = countdownSeconds > 0 ? countdownSeconds : "GO!";
              return (
                <div className="bg-slate-900/95 border-2 border-cyan-500/40 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-black uppercase tracking-wider">
                    <Radio className="w-4 h-4 text-cyan-400 animate-ping" />
                    <span>ধাপ ১: ৩-২-১ কাউন্টডাউন</span>
                  </div>

                  <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-dashed border-cyan-400/50 animate-spin" style={{ animationDuration: "3s" }} />
                    <motion.span
                      key={displayVal}
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: [1.4, 1], opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className="font-mono text-7xl font-black text-cyan-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.8)]"
                    >
                      {displayVal}
                    </motion.span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white">প্রশ্ন {currentQuestionIdx + 1} আসছে — প্রস্তুত হোন!</h3>
                    <p className="text-xs text-slate-400">কাউন্টডাউন শেষে ৩.৫ সেকেন্ড প্রশ্ন প্রিভিউ চলবে।</p>
                  </div>
                </div>
              );
            }

            // ==================== STAGE C & D: QUESTION ACTIVE / PREVIEW ====================
            if ((sessionStatus === "QUESTION_ACTIVE" || currentPhase === "QUESTION_PREVIEW" || currentPhase === "QUESTION_ACTIVE") && currentQuestion) {
              const isPreview = currentPhase === "QUESTION_PREVIEW" || previewSeconds > 0;

              const renderQuestionContent = () => (
                <div className="space-y-5">
                  {/* Top Bar: Question Number & Timer & All-Voted Alert */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-extrabold text-xs">
                      প্রশ্ন {currentQuestionIdx + 1} / {totalQuestions || "?"}
                    </span>

                    {allVoted ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-black text-xs animate-bounce shadow-md shadow-emerald-500/30">
                        <span>🎉 সবাই উত্তর দিয়েছে! (All Voted!)</span>
                      </div>
                    ) : isPreview ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-mono font-bold text-xs">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>প্রিভিউ: {previewSeconds.toFixed(1)}s</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-xs">
                        <Timer className="w-3.5 h-3.5 animate-pulse" />
                        <span>{timeLeft}s</span>
                      </div>
                    )}
                  </div>

                  {/* Question Text */}
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
                      {currentQuestion.questionText || currentQuestion.question}
                    </h3>
                    {currentQuestion.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-slate-800 max-h-48 flex items-center justify-center bg-slate-950">
                        <img src={currentQuestion.imageUrl} alt="Question Visual" className="object-contain max-h-48 w-full" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>

                  {/* STAGE 2: QUESTION PREVIEW ONLY (Options masked with animated progress bar) */}
                  {isPreview ? (
                    <div className="space-y-4 py-4">
                      <div className="p-5 rounded-2xl bg-amber-500/10 border border-dashed border-amber-400/40 text-center space-y-2">
                        <Lock className="w-7 h-7 text-amber-400 mx-auto animate-pulse" />
                        <h4 className="text-sm font-black text-white">📖 প্রশ্নটি মনোযোগ দিয়ে পড়ো...</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          ৩.৫ সেকেন্ড পর উত্তর অপশনসমূহ উন্মোচিত হবে এবং মূল টাইমার শুরু হবে।
                        </p>
                        <div className="w-full max-w-xs h-2 bg-slate-800 rounded-full mx-auto overflow-hidden mt-3">
                          <motion.div
                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 3.5, ease: "linear" }}
                          />
                        </div>
                      </div>

                      {/* Shimmer Placeholder outlines */}
                      <div className="grid grid-cols-1 gap-2.5 opacity-30 pointer-events-none">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-12 rounded-xl bg-slate-800 border border-slate-700 animate-pulse flex items-center px-4 gap-3">
                            <div className="w-5 h-5 rounded-md bg-slate-700" />
                            <div className="w-40 h-3 rounded bg-slate-700" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* STAGE 3: OPTIONS RENDERING WITH UNIVERSAL QUIZ SHOWCASE ENGINE */
                    <>
                      <div className="space-y-3 pt-2">
                        <UniversalQuizShowcaseEngine
                          question={currentQuestion}
                          questionIndex={currentQuestionIdx}
                          totalQuestions={totalQuestions}
                          selectedAnswer={selectedOption}
                          onSelectAnswer={(ans) => setSelectedOption(ans)}
                          isConfirmed={playerAnswered}
                          isCorrect={playerEvaluation ? playerEvaluation.isCorrect : undefined}
                          disabled={playerAnswered || isSubmitting || allVoted}
                          showProofBadge={true}
                          autoRandomize={true}
                        />
                      </div>

                      {/* SUBMIT BUTTON */}
                      {!playerAnswered && !allVoted ? (
                        <button
                          disabled={selectedOption === "" || isSubmitting}
                          onClick={handleSubmitAnswer}
                          className="w-full h-13 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 mt-3"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                              <span>উত্তর জমা হচ্ছে...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>উত্তর নিশ্চিত করুন (Submit Answer)</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-2 mt-2">
                          <div className="inline-flex items-center gap-1.5 text-emerald-400 font-black text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>উত্তর সফলভাবে জমা হয়েছে!</span>
                          </div>

                          {/* Instant Feedback / Auto-Reveal Banner */}
                          {playerEvaluation && (
                            <div className={`p-3 rounded-xl text-xs font-black ${
                              playerEvaluation.isCorrect
                                ? "bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20"
                                : "bg-rose-500/20 border border-rose-500 text-rose-300 shadow-md shadow-rose-500/20"
                            }`}>
                              {playerEvaluation.isCorrect ? (
                                <div className="space-y-1">
                                  <div>🎉 অসাধারণ! উত্তরটি সঠিক হয়েছে (+১০০ পয়েন্ট)</div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div>❌ দুঃখিত, উত্তরটি ভুল হয়েছে!</div>
                                  {playerEvaluation.correctAnswer !== undefined && (
                                    <div className="text-emerald-300 font-bold">
                                      সঠিক উত্তর: {String(playerEvaluation.correctAnswer)}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Live Stats Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-slate-400 font-mono">
                    <span>উত্তর দিয়েছেন: <strong className="text-white">{answeredCount}</strong> / {playerCount} জন</span>
                    <span>লাইভ এরিনা</span>
                  </div>
                </div>
              );

              return activePlate ? (
                <QuizPlate template={activePlate}>
                  {renderQuestionContent()}
                </QuizPlate>
              ) : (
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in">
                  {renderQuestionContent()}
                </div>
              );
            }

            if (sessionStatus === "COMPLETED") {
              const totalQ = totalQuestions || ((studentStats?.correctAnswers || 0) + (studentStats?.wrongAnswers || 0) + (studentStats?.unanswered || 0)) || 1;
              const accuracy = Math.round(((studentStats?.correctAnswers || 0) / totalQ) * 100);

              return (
                /* ==================== SCREEN 4: GAME COMPLETED ==================== */
                <div className="space-y-6 text-center py-4 animate-in fade-in zoom-in-95 duration-300 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <SouthAsianStudentAvatar 
                        size="xl" 
                        glowColor="amber" 
                      />
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-slate-900 border-2 border-yellow-500 flex items-center justify-center shadow-lg z-20 animate-bounce">
                        <Award className="w-6 h-6 text-yellow-400" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white">🎉 কুইজ সমাপ্ত হয়েছে!</h3>
                    <p className="text-xs text-slate-400">
                      অভিনন্দন <strong className="text-white">{displayName}</strong>! আপনার চূড়ান্ত ফলাফল নিচে দেওয়া হলো:
                    </p>
                  </div>

                  {/* Main Score & Rank Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-2xl text-center space-y-1">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">সর্বমোট স্কোর</span>
                      <span className="text-2xl font-black text-white">{studentStats?.totalScore || 0}</span>
                      <span className="text-[9px] text-slate-400 block">পয়েন্ট</span>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-2xl text-center space-y-1">
                      <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider block">চূড়ান্ত অবস্থান</span>
                      <span className="text-2xl font-black text-white">#{studentStats?.rank || "-"}</span>
                      <span className="text-[9px] text-slate-400 block">র‍্যাংক</span>
                    </div>
                  </div>

                  {/* Detailed Performance Metrics */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-left space-y-3">
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider border-b border-white/5 pb-2">কার্যক্ষমতা সারাংশ (Performance Summary)</h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between items-center p-2 rounded-xl bg-white dark:bg-slate-900/5">
                        <span className="text-slate-400">সঠিক উত্তর:</span>
                        <span className="font-extrabold text-emerald-400">{studentStats?.correctAnswers || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-xl bg-white dark:bg-slate-900/5">
                        <span className="text-slate-400">ভুল উত্তর:</span>
                        <span className="font-extrabold text-rose-400">{studentStats?.wrongAnswers || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-xl bg-white dark:bg-slate-900/5">
                        <span className="text-slate-400">উত্তরহীন:</span>
                        <span className="font-extrabold text-slate-400">{studentStats?.unanswered || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-xl bg-white dark:bg-slate-900/5">
                        <span className="text-slate-400">সঠিকতার হার:</span>
                        <span className="font-extrabold text-cyan-400">{accuracy}%</span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between px-2 text-xs">
                      <span className="text-slate-400">সর্বোচ্চ স্ট্রিক (Best Streak):</span>
                      <span className="font-extrabold text-amber-400 flex items-center gap-1">
                        <span>{studentStats?.bestStreak || 0}</span>
                        <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-slate-400">সার্ভার সেশন সংরক্ষিত ও সুরক্ষিত</span>
                    </div>
                  </div>

                  <button
                    onClick={handleLeave}
                    className="w-full h-11 rounded-xl border border-slate-800 bg-transparent text-slate-400 font-bold text-xs hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>লবি ত্যাগ করুন (Leave Lobby)</span>
                  </button>
                </div>
              );
            }

            return (
              /* ==================== SCREEN 2: LIVE PLAYER LOBBY ==================== */
              <div className="space-y-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                
                {/* Pulsing Lobby Status */}
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4">
                  <div className="flex justify-center relative">
                    <SouthAsianStudentAvatar 
                      size="xl" 
                      glowColor="emerald" 
                      className="z-10"
                    />
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center shadow-lg z-20 animate-bounce">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-emerald-400">লবিতে সফলভাবে যুক্ত আছেন!</p>
                    <h3 className="text-xl font-black text-white">{displayName}</h3>
                  </div>
                </div>

                {/* Quiz Info */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-1.5">
                  <span className="text-slate-500 dark:text-slate-400 block font-bold uppercase tracking-wider text-[9px]">চলমান লাইভ কুইজ:</span>
                  <p className="text-white font-extrabold text-sm leading-tight">
                    {quizDetails ? quizDetails.title : "Interactive Technical Quiz"}
                  </p>
                  {quizDetails && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold text-[10px]">
                        {quizDetails.questionCount}টি লাইভ প্রশ্নাবলী
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">PIN: {sessionCode}</span>
                    </div>
                  )}
                </div>

                {/* SCHEDULED QUIZ AUTO-START COUNTDOWN BANNER */}
                {scheduledSecondsLeft !== null && scheduledSecondsLeft > 0 && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border-2 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.25)] text-center space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                      <Clock className="w-4 h-4 animate-spin text-amber-400" />
                      <span>⏰ নির্ধারিত সময়ে অটো-স্টার্ট হবে</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono font-black text-amber-300 tracking-wider">
                      ⏳ কুইজ শুরু হতে বাকি: {(() => {
                        const m = Math.floor(scheduledSecondsLeft / 60);
                        const s = scheduledSecondsLeft % 60;
                        const toBn = (v: number) => String(v).padStart(2, "0").replace(/[0-9]/g, (d) => ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"][parseInt(d)]);
                        return `${toBn(m)} মিনিট ${toBn(s)} সেকেন্ড`;
                      })()}
                    </div>
                    <p className="text-[11px] text-amber-200/90 font-medium">
                      কাউন্টডাউন ০ সেকেন্ডে পৌঁছালে স্বয়ংক্রিয়ভাবে মূল কুইজ শুরু হবে! ততক্ষণ নিচের ওয়ার্মআপ বা মুড চেক-ইনে অংশ নিন।
                    </p>
                  </div>
                )}

                {/* MENTIMETER WARMUP INTERACTIVE CARD (UNGRADED PHASE) */}
                {activePreQuiz && !isQuizModeStarted ? (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/90 to-purple-950/90 border-2 border-indigo-500/40 shadow-xl space-y-4 text-left">
                    <div className="flex items-center justify-between gap-2 border-b border-indigo-500/30 pb-2">
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/30">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>ওয়ার্মআপ অ্যাক্টিভিটি (নম্বরবিহীন)</span>
                      </span>
                      <span className="text-[10px] text-indigo-300 font-mono">লাইভ রেসপন্স</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm sm:text-base font-black text-white leading-relaxed">
                        {activePreQuiz.prompt || "আপনার মতামত জানান"}
                      </h4>
                    </div>

                    {preQuizSubmitted ? (
                      <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-center space-y-2">
                        <div className="inline-flex items-center gap-1.5 text-emerald-300 font-black text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>আপনার উত্তর সফলভাবে জমা হয়েছে!</span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          হোস্টের স্ক্রিনে আপনার উত্তর দেখা যাচ্ছে। শিক্ষক কুইজ শুরু করা পর্যন্ত অপেক্ষা করুন।
                        </p>
                        <button
                          type="button"
                          onClick={() => setPreQuizSubmitted(false)}
                          className="text-[10px] text-cyan-400 underline font-bold"
                        >
                          পুনরায় মতামত দিতে চান?
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Word Cloud Input */}
                        {(activePreQuiz.type?.toUpperCase().includes("WORD_CLOUD") || activePreQuiz.type === "word_cloud") && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={preQuizInput}
                              onChange={(e) => setPreQuizInput(e.target.value)}
                              placeholder="১–৩টি শব্দ লিখুন (যেমন: সততা, প্রযুক্তি)"
                              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-indigo-500/40 text-sm text-white focus:outline-none focus:border-cyan-400 font-bold"
                            />
                            <button
                              type="button"
                              disabled={!preQuizInput.trim() || isSubmittingPreQuiz}
                              onClick={() => handleSubmitPreQuiz()}
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                            >
                              {isSubmittingPreQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              <span>শব্দ যুক্ত করুন</span>
                            </button>
                          </div>
                        )}

                        {/* Mood Check-In */}
                        {(activePreQuiz.type?.toUpperCase().includes("MOOD") || activePreQuiz.type === "mood_checkin") && (
                          <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: "fire", label: "🔥 সুপার এনার্জেটিক", mood: "fire" },
                                { id: "happy", label: "😊 বেশ ভালো", mood: "happy" },
                                { id: "thinking", label: "🤔 একটু চিন্তিত", mood: "thinking" },
                                { id: "tired", label: "😴 ক্লান্ত", mood: "tired" },
                              ].map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setPreQuizSelectedMood(m.mood);
                                    handleSubmitPreQuiz(m.label);
                                  }}
                                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                    preQuizSelectedMood === m.mood
                                      ? "bg-indigo-600 text-white border-indigo-400 shadow-md"
                                      : "bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-800"
                                  }`}
                                >
                                  <span>{m.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sticky Wall / Open Feedback */}
                        {(activePreQuiz.type?.toUpperCase().includes("STICKY") || activePreQuiz.type?.toUpperCase().includes("FEEDBACK") || activePreQuiz.type === "open_ended") && (
                          <div className="space-y-2.5">
                            <textarea
                              rows={2}
                              value={preQuizInput}
                              onChange={(e) => setPreQuizInput(e.target.value)}
                              placeholder="আপনার চিন্তা বা প্রশ্ন এখানে লিখুন..."
                              className="w-full p-3 rounded-xl bg-slate-950 border border-indigo-500/40 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 font-medium"
                            />
                            {/* Color Selector */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400">রং:</span>
                                {[
                                  { id: "amber", bg: "bg-amber-300" },
                                  { id: "rose", bg: "bg-rose-300" },
                                  { id: "cyan", bg: "bg-cyan-300" },
                                  { id: "emerald", bg: "bg-emerald-300" },
                                ].map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setPreQuizStickyColor(c.id)}
                                    className={`w-5 h-5 rounded-full ${c.bg} ${preQuizStickyColor === c.id ? "ring-2 ring-white scale-110" : "opacity-60"}`}
                                  />
                                ))}
                              </div>
                              <button
                                type="button"
                                disabled={!preQuizInput.trim() || isSubmittingPreQuiz}
                                onClick={() => handleSubmitPreQuiz()}
                                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                              >
                                {isSubmittingPreQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3 h-3" />}
                                <span>পোস্ট করুন</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Opinion Poll */}
                        {(activePreQuiz.type?.toUpperCase().includes("POLL") || activePreQuiz.type === "poll") && (
                          <div className="space-y-2">
                            {(activePreQuiz.options && activePreQuiz.options.length > 0
                              ? activePreQuiz.options
                              : ["হ্যাঁ, পুরোপুরি প্রস্তুত!", "মোটামুটি প্রস্তুত", "কিছুটা চিন্তিত"]
                            ).map((opt: string, oIdx: number) => (
                              <button
                                key={oIdx}
                                type="button"
                                disabled={isSubmittingPreQuiz}
                                onClick={() => handleSubmitPreQuiz(opt)}
                                className="w-full p-2.5 rounded-xl bg-slate-950/80 hover:bg-indigo-600/30 border border-slate-800 hover:border-indigo-500 text-xs font-bold text-slate-200 transition text-left flex items-center justify-between cursor-pointer"
                              >
                                <span>{opt}</span>
                                <span className="text-[10px] text-indigo-400 font-mono">ভোট দিন →</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Intro / Welcome Slide Reagents */}
                        {(activePreQuiz.type?.toUpperCase().includes("INTRO") || activePreQuiz.type === "welcome_intro") && (
                          <div className="flex items-center justify-center gap-2 pt-1">
                            {["❤️", "🔥", "👏", "🎉", "⚡"].map((emoji, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSubmitPreQuiz(emoji)}
                                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xl flex items-center justify-center transition transform active:scale-90"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Waiting for Host Message */
                  <div className="text-center space-y-3 py-4 border-t border-b border-white/5">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                      <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">
                        Waiting for Host to Start
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed px-4">
                      হোস্ট কুইজটি শুরু করার সাথে সাথেই আপনার স্ক্রিনে প্রথম প্রশ্নটি ভেসে উঠবে। চোখ রাখুন মূল স্ক্রিনের দিকে!
                    </p>
                  </div>
                )}

                {/* Leave Button */}
                <button
                  onClick={handleLeave}
                  className="w-full h-11 rounded-xl border border-slate-800 bg-transparent text-slate-400 font-bold text-xs hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>লবি ত্যাগ করুন (Leave Lobby)</span>
                </button>
              </div>
            );
          })()
        )}

      </div>

      {/* Phase 20 Automatic Funny SMS/Notification PopUp */}
      {activeMotivation && (
        <div id="motivation-popup" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-slate-900 border border-amber-500/30 rounded-3xl p-5 shadow-2xl shadow-amber-500/10 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                  💬 PTSC কুইজ অ্যাসিস্ট্যান্ট
                </span>
                <button
                  onClick={() => setActiveMotivation(null)}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900/5 text-slate-500 dark:text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-bold text-slate-100 leading-relaxed font-sans">
                &ldquo;{activeMotivation.message}&rdquo;
              </p>
              <div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>সরাসরি সার্ভার থেকে প্রেরিত</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
