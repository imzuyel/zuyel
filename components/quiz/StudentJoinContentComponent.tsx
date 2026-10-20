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
  User
} from "lucide-react";
import SouthAsianStudentAvatar from "@/components/common/SouthAsianStudentAvatar";
import confetti from "canvas-confetti";

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

          if (data.currentQuestionIndex !== undefined) {
            if (data.currentQuestionIndex !== currentQuestionIdx) {
              setCurrentQuestionIdx(data.currentQuestionIndex);
              setPlayerAnswered(false);
              setSelectedOption("");
              setPlayerEvaluation(null);
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

          // Timer sync
          if (data.timeLeft !== undefined) {
            setTimeLeft(data.timeLeft);
          }

          if (data.plate) {
            setActivePlate(data.plate);
          }

          if (data.motivationMessage) {
            setActiveMotivation(data.motivationMessage);
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

                {/* 2. Student Name & Roll Field */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs sm:text-sm font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>আপনার নাম বা রোল নম্বর (Your Name/Roll)</span>
                    </label>
                    {registeredStudents.length > 0 && (
                      <span className="text-[11px] text-purple-300 font-bold px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/30">
                        {registeredStudents.length} জন রেজিস্টার্ড
                      </span>
                    )}
                  </div>
                  
                  {registeredStudents.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const st = registeredStudents.find(s => String(s.id) === e.target.value || s.studentId === e.target.value);
                          if (st) {
                            setDisplayName(`${st.name} (রোল: ${st.roll})`);
                          }
                        }
                      }}
                      className="w-full h-12 bg-slate-950 border-2 border-indigo-500/50 rounded-xl px-4 text-xs sm:text-sm text-cyan-200 focus:outline-none focus:border-cyan-400 font-bold mb-1.5 cursor-pointer hover:border-indigo-400 transition-all shadow-inner"
                    >
                      <option value="" className="bg-slate-900 text-slate-300">
                        -- রেজিস্টার্ড স্টুডেন্ট সিলেক্ট করুন (ঐচ্ছিক) --
                      </option>
                      {registeredStudents.map((s) => (
                        <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                          {s.name} - রোল: {s.roll} ({s.studentId})
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="relative group/name focus-within:shadow-[0_0_25px_rgba(168,85,247,0.4)] rounded-2xl transition-all">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="যেমন: রাশেদুল ইসলাম (রোল ১০)"
                      className="w-full h-14 sm:h-16 bg-slate-950 border-2 border-slate-700/80 rounded-2xl px-5 text-base text-white placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-purple-400 transition-all font-bold"
                      required
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400/70 pointer-events-none">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* 3. Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 sm:h-16 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 text-slate-950 font-black text-base sm:text-lg transition-all shadow-[0_0_35px_rgba(6,182,212,0.55)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 group border border-cyan-300/40"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-slate-950" />
                      <span>কুইজে যুক্ত হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>কুইজে প্রবেশ করুন (Join Live)</span>
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
            if (sessionStatus === "QUESTION_ACTIVE" && currentQuestion) {
              const renderQuestionContent = () => (
                <div className="space-y-5">
                  {/* Top Bar: Question Number & Timer */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-extrabold text-xs">
                      প্রশ্ন {currentQuestionIdx + 1} / {totalQuestions || "?"}
                    </span>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-xs">
                      <Timer className="w-3.5 h-3.5 animate-pulse" />
                      <span>{timeLeft}s</span>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-white leading-relaxed">
                      {currentQuestion.questionText}
                    </h3>
                    {currentQuestion.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-slate-800 max-h-48 flex items-center justify-center bg-slate-950">
                        <img src={currentQuestion.imageUrl} alt="Question Visual" className="object-contain max-h-48 w-full" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>

                  {/* OPTIONS RENDERING BASED ON TYPE */}
                  <div className="space-y-3 pt-2">
                    {(currentQuestion.type === "mcq" || currentQuestion.type === "image_choice" || currentQuestion.type === "poll" || !currentQuestion.type) && (
                      <div className="grid grid-cols-1 gap-2.5">
                        {currentQuestion.options && currentQuestion.options.map((option: string, idx: number) => {
                          const isSelected = selectedOption === idx || selectedOption === option;
                          return (
                            <button
                              key={idx}
                              disabled={playerAnswered || isSubmitting}
                              onClick={() => setSelectedOption(idx)}
                              className={`w-full min-h-[52px] p-3.5 rounded-2xl text-left font-bold text-xs sm:text-sm transition-all flex items-center justify-between border cursor-pointer select-none active:scale-[0.98] ${
                                isSelected
                                  ? "bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-2 ring-cyan-400/50"
                                  : "bg-slate-950/80 border-slate-800 text-slate-200 hover:bg-slate-900 hover:border-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-black shrink-0 ${
                                  isSelected ? "bg-cyan-400 text-slate-950 shadow-md" : "bg-slate-800 text-slate-300 border border-white/5"
                                }`}>
                                  {["A", "B", "C", "D"][idx] || idx + 1}
                                </span>
                                <span className="leading-snug">{option}</span>
                              </div>
                              {isSelected && <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {currentQuestion.type === "true_false" && (
                      <div className="grid grid-cols-2 gap-3">
                        {["true", "false"].map((val) => {
                          const isSelected = selectedOption === val;
                          return (
                            <button
                              key={val}
                              disabled={playerAnswered || isSubmitting}
                              onClick={() => setSelectedOption(val)}
                              className={`min-h-[56px] p-4 rounded-2xl font-black text-sm uppercase tracking-wider text-center border transition-all cursor-pointer select-none active:scale-[0.98] ${
                                isSelected
                                  ? "bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-2 ring-cyan-400/50"
                                  : "bg-slate-950/80 border-slate-800 text-slate-200 hover:bg-slate-900 hover:border-slate-700"
                              }`}
                            >
                              {val === "true" ? "সত্য (True)" : "মিথ্যা (False)"}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {(currentQuestion.type === "fill_in_blank" || currentQuestion.type === "short_answer") && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          disabled={playerAnswered || isSubmitting}
                          value={selectedOption}
                          onChange={(e) => setSelectedOption(e.target.value)}
                          placeholder="আপনার উত্তর এখানে লিখুন..."
                          className="w-full h-13 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm text-white placeholder:text-slate-600 dark:text-slate-400 focus:outline-none focus:border-cyan-500 font-bold"
                        />
                      </div>
                    )}
                  </div>

                  {/* SUBMIT BUTTON */}
                  {!playerAnswered ? (
                    <button
                      disabled={selectedOption === "" || isSubmitting}
                      onClick={handleSubmitAnswer}
                      className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>উত্তর জমা হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>উত্তর লক করুন (Submit Answer)</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-1">
                      <div className="inline-flex items-center gap-1.5 text-emerald-400 font-black text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>উত্তর সফলভাবে জমা হয়েছে!</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        শিক্ষক প্রশ্ন শেষ করা পর্যন্ত অপেক্ষা করুন। পরবর্তী প্রশ্নের জন্য প্রস্তুত থাকুন।
                      </p>
                      {playerEvaluation && (
                        <div className={`mt-2 p-2 rounded-xl text-xs font-bold ${
                          playerEvaluation.isCorrect ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                        }`}>
                          {playerEvaluation.isCorrect ? `✨ সঠিক! +${playerEvaluation.pointsEarned} পয়েন্ট` : "❌ ভুল উত্তর!"}
                        </div>
                      )}
                    </div>
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

                {/* Waiting Message */}
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
