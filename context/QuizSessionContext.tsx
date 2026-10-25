"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface QuizSessionState {
  joined: boolean;
  loading: boolean;
  networkStatus: "connected" | "disconnected" | "reconnecting" | "restored" | "failed";
  errorMessage: string | null;
  activeSession: any | null;
  quizDetails: any | null;
  playerToken: string;
  participantId: string;
  sessionStatus: string;
  currentPhase: "LOBBY" | "READY" | "COUNTDOWN" | "QUESTION_PREVIEW" | "QUESTION_ACTIVE" | "QUESTION_ENDED" | "COMPLETED";
  countdownSeconds: number;
  previewSeconds: number;
  canSubmitAnswer: boolean;
  currentPlate: any | null;
  currentQuestion: any;
  currentQuestionIdx: number;
  totalQuestions: number;
  playerAnswered: boolean;
  timeLeft: number;
  selectedOption: any;
  isSubmitting: boolean;
  answeredCount: number;
  playerCount: number;
  studentStats: any;
  registeredStudents: any[];
  activeMotivation: any | null;
  activePreQuizActivity?: any;
  preQuizResponseSubmitted?: boolean;
}

interface QuizSessionContextType extends QuizSessionState {
  setSessionCode: (code: string) => void;
  setDisplayName: (name: string) => void;
  sessionCode: string;
  displayName: string;
  handleJoin: (e?: React.FormEvent, studentIdParam?: string | number, avatarParam?: string) => Promise<void>;
  handleSubmitAnswer: (answer: any) => Promise<void>;
  handleNextQuestion: () => Promise<void>;
  handlePreviousQuestion: () => void;
  setCurrentQuestionIdx: React.Dispatch<React.SetStateAction<number>>;
  handleLeave: () => void;
  setErrorMessage: (msg: string | null) => void;
  setActiveMotivation: (msg: any | null) => void;
  handlePreQuizResponse?: (res: any) => Promise<void>;
}

const QuizSessionContext = createContext<QuizSessionContextType | undefined>(undefined);

export function QuizSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // State
  const [sessionCode, setSessionCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<QuizSessionState["networkStatus"]>("connected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [quizDetails, setQuizDetails] = useState<any | null>(null);
  const [playerToken, setPlayerToken] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [sessionStatus, setSessionStatus] = useState<string>("LOBBY");
  const [currentPhase, setCurrentPhase] = useState<QuizSessionState["currentPhase"]>("LOBBY");
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);
  const [previewSeconds, setPreviewSeconds] = useState<number>(3);
  const [canSubmitAnswer, setCanSubmitAnswer] = useState<boolean>(false);
  const [currentPlate, setCurrentPlate] = useState<any | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [playerAnswered, setPlayerAnswered] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<any>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [answeredCount, setAnswersCount] = useState<number>(0);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [studentStats, setStudentStats] = useState<any>(null);
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [activeMotivation, setActiveMotivation] = useState<any | null>(null);
  const [reconnectToken, setReconnectToken] = useState<string>("");
  const [isQuizModeStarted, setIsQuizModeStarted] = useState<boolean>(false);
  const [activePreQuizActivity, setActivePreQuizActivity] = useState<any | null>(null);
  const [preQuizResponseSubmitted, setPreQuizResponseSubmitted] = useState<boolean>(false);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localTickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const currentPhaseRef = useRef<string>(currentPhase);

  useEffect(() => {
    currentPhaseRef.current = currentPhase;
  }, [currentPhase]);

  // Sync route based on session status and authoritative phase
  useEffect(() => {
    if (!joined) {
      if (!pathname?.includes("/join") && !loading) {
        router.push("/quiz/join");
      }
      return;
    }

    if (joined) {
      // PRE-QUIZ ACTIVITY & LOBBY STAY IN /quiz/lobby UNTIL ACTUAL COMPETITIVE QUIZ STARTS
      if ((sessionStatus === "LOBBY" || !isQuizModeStarted) && pathname !== "/quiz/lobby") {
        router.push("/quiz/lobby");
      } else if (
        isQuizModeStarted &&
        (sessionStatus === "QUESTION_ACTIVE" || currentPhase === "READY" || currentPhase === "COUNTDOWN" || currentPhase === "QUESTION_PREVIEW" || currentPhase === "QUESTION_ACTIVE") &&
        pathname !== "/quiz/live"
      ) {
        router.push("/quiz/live");
      } else if (sessionStatus === "COMPLETED" && pathname !== "/quiz/result") {
        router.push("/quiz/result");
      }
    }
  }, [joined, sessionStatus, isQuizModeStarted, currentPhase, pathname, router, loading]);

  // Smooth client-side local timer tick between server sync polls
  useEffect(() => {
    if (!joined) return;

    localTickIntervalRef.current = setInterval(() => {
      // Countdown phase decrement (3 -> 2 -> 1 -> 0)
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));

      // Preview phase decrement
      setPreviewSeconds((prev) => (prev > 0 ? prev - 1 : 0));

      // Main question timer decrement - ONLY when in QUESTION_ACTIVE phase!
      // Countdown and Question Preview NEVER count down the main question timer.
      setTimeLeft((prev) => {
        if (currentPhaseRef.current === "QUESTION_ACTIVE") {
          return prev > 0 ? prev - 1 : 0;
        }
        return prev;
      });
    }, 1000);

    return () => {
      if (localTickIntervalRef.current) clearInterval(localTickIntervalRef.current);
    };
  }, [joined]);

  // Initial Load & Reconnection
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

    const saved = localStorage.getItem("quiz_student_session") || localStorage.getItem("pgtsc_live_quiz_player");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.roomPin || parsed.sessionCode) {
          attemptReconnection(parsed);
        }
      } catch (e) {
        console.warn("Invalid saved session json:", e);
      }
    }
  }, []);

  const attemptReconnection = async (parsed: any) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/live-quizzes/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionCode: parsed.roomPin || parsed.sessionCode,
          displayName: parsed.studentName || parsed.displayName,
          studentId: parsed.studentId,
          playerToken: parsed.sessionToken || parsed.playerToken,
          reconnectToken: parsed.reconnectToken,
          role: "student"
        })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success && (data.participant || data.state?.participant)) {
        const participant = data.participant || data.state?.participant;
        const session = data.session || data.state?.session;
        const newTok = data.reconnectToken || parsed.reconnectToken;

        setPlayerToken(participant.playerToken || parsed.sessionToken || participant.id);
        setParticipantId(participant.id);
        setSessionCode(parsed.roomPin || parsed.sessionCode || session?.sessionCode);
        setDisplayName(participant.displayName);
        setReconnectToken(newTok || "");
        if (session) {
          setActiveSession(session);
          setSessionStatus(session.status);
          setTotalQuestions(session.totalQuestions || 0);
          setCurrentQuestionIdx(session.currentQuestionIndex || 0);
        }
        setJoined(true);
        if (data.state?.currentQuestion) setCurrentQuestion(data.state.currentQuestion);
        if (participant.stats) setStudentStats(participant.stats);
      } else {
        localStorage.removeItem("quiz_student_session");
        localStorage.removeItem("pgtsc_live_quiz_player");
      }
    } catch (err) {
      console.error("Failed to restore session:", err);
      setLoading(false);
    }
  };

  // Polling Loop
  useEffect(() => {
    if (!joined || !activeSession || !participantId) return;

    const pollState = async () => {
      try {
        const res = await fetch(`/api/live-quizzes/sessions/${activeSession.id}/state?participantId=${participantId}`);
        if (!res.ok) {
          setNetworkStatus("reconnecting");
          return;
        }
        const data = await res.json();
        if (data.success) {
          setNetworkStatus("connected");
          reconnectAttemptsRef.current = 0;

          if (data.status) setSessionStatus(data.status);
          if (data.plate) setCurrentPlate(data.plate);
          if (data.isQuizModeStarted !== undefined) setIsQuizModeStarted(data.isQuizModeStarted);
          if (data.activePreQuizActivity !== undefined) {
            setActivePreQuizActivity(data.activePreQuizActivity);
            if (data.activePreQuizActivity) {
              const alreadyAnswered = data.activePreQuizActivity.responses?.some((r: any) => r.playerId === participantId);
              setPreQuizResponseSubmitted(Boolean(alreadyAnswered));
            } else {
              setPreQuizResponseSubmitted(false);
            }
          }
          
          if (data.state) {
            const sess = data.state.session || {};
            if (sess.status) setSessionStatus(sess.status);
            if (sess.phase) setCurrentPhase(sess.phase);
            if (sess.countdownSeconds !== undefined) setCountdownSeconds(sess.countdownSeconds);
            if (sess.previewSeconds !== undefined) setPreviewSeconds(sess.previewSeconds);
            if (sess.mainTimerSeconds !== undefined) setTimeLeft(sess.mainTimerSeconds);
            if (sess.canSubmitAnswer !== undefined) setCanSubmitAnswer(sess.canSubmitAnswer);
            if (sess.totalQuestions) setTotalQuestions(sess.totalQuestions);
            if (data.state.answered !== undefined) setPlayerAnswered(data.state.answered);
            if (data.state.originalAnswer?.answerPayload !== undefined) setSelectedOption(data.state.originalAnswer.answerPayload);
            if (data.state.currentQuestion) setCurrentQuestion(data.state.currentQuestion);
          } else if (data.sequenceState) {
            if (data.sequenceState.phase) setCurrentPhase(data.sequenceState.phase);
            if (data.sequenceState.countdownSecondsRemaining !== undefined) setCountdownSeconds(data.sequenceState.countdownSecondsRemaining);
            if (data.sequenceState.previewSecondsRemaining !== undefined) setPreviewSeconds(data.sequenceState.previewSecondsRemaining);
            if (data.sequenceState.mainTimerSecondsRemaining !== undefined) setTimeLeft(data.sequenceState.mainTimerSecondsRemaining);
            if (data.sequenceState.canSubmitAnswer !== undefined) setCanSubmitAnswer(data.sequenceState.canSubmitAnswer);
          }

          const qIdx = data.state?.session?.currentQuestionIndex ?? data.currentQuestionIndex;
          if (qIdx !== undefined) {
            const nextIdx = Number(qIdx);
            setCurrentQuestionIdx((prev) => {
              if (prev !== nextIdx) {
                setPlayerAnswered(false);
                setSelectedOption("");
                return nextIdx;
              }
              return prev;
            });
          }

          if (data.currentQuestion) setCurrentQuestion(data.currentQuestion);
          if (data.totalQuestions) setTotalQuestions(data.totalQuestions);
          if (data.answeredCount !== undefined) setAnswersCount(data.answeredCount);
          if (data.playerCount !== undefined) setPlayerCount(data.playerCount);
          if (data.studentStats) setStudentStats(data.studentStats);
          if (data.playerAnswered !== undefined) setPlayerAnswered(data.playerAnswered);
          if (data.timeLeft !== undefined && currentPhase === "QUESTION_ACTIVE") setTimeLeft(data.timeLeft);
          if (data.motivationMessage) setActiveMotivation(data.motivationMessage);
        }
      } catch (err) {
        setNetworkStatus("disconnected");
        reconnectAttemptsRef.current += 1;
        if (reconnectAttemptsRef.current > 10) setNetworkStatus("failed");
      }
    };

    pollState();
    pollingIntervalRef.current = setInterval(pollState, 1500);

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [joined, activeSession?.id, participantId]);

  // Actions
  const handleJoin = async (e?: React.FormEvent, studentIdParam?: string | number, avatarParam?: string) => {
    if (e) e.preventDefault();
    if (!sessionCode.trim() || !displayName.trim()) {
      setErrorMessage("দয়া করে পিন এবং নাম সঠিক ভাবে লিখুন।");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/live-quizzes/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionCode: sessionCode.trim(),
          displayName: displayName.trim(),
          studentId: studentIdParam ? String(studentIdParam) : undefined,
          avatar: avatarParam || "🚀",
          role: "student"
        })
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setJoined(true);
        setActiveSession(data.session);
        const resolvedToken = data.participant.playerToken || data.participant.id;
        setPlayerToken(resolvedToken);
        setParticipantId(data.participant.id);
        setReconnectToken(data.reconnectToken || "");
        
        // Requirement 4: Store studentId, studentName, roomPin, sessionToken in localStorage
        const sessionPayload = {
          studentId: studentIdParam ? String(studentIdParam) : (data.participant.studentId ? String(data.participant.studentId) : undefined),
          studentName: data.participant.displayName,
          avatar: avatarParam || data.participant.avatar || "🚀",
          roomPin: data.session.sessionCode || sessionCode.trim(),
          sessionToken: resolvedToken,
          sessionId: data.session.id,
          sessionCode: data.session.sessionCode || sessionCode.trim(),
          displayName: data.participant.displayName,
          playerToken: resolvedToken,
          playerId: data.participant.id,
          reconnectToken: data.reconnectToken || ""
        };

        localStorage.setItem("quiz_student_session", JSON.stringify(sessionPayload));
        localStorage.setItem("pgtsc_live_quiz_player", JSON.stringify(sessionPayload));
        
        if (data.quiz) {
          setQuizDetails({ title: data.quiz.title, questionCount: data.quiz.questionCount || 0 });
        }
        setTotalQuestions(data.session.totalQuestions || 0);
        setSessionStatus(data.session.status);
      } else {
        setErrorMessage(data.error || data.message || "কুইজে যুক্ত হতে ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || "সার্ভার সংযোগে ত্রুটি ঘটেছে।");
    }
  };

  const handlePreQuizResponse = async (response: string) => {
    if (!activeSession || !activePreQuizActivity || !participantId) return;
    try {
      const res = await fetch(`/api/live-quizzes/sessions/${activeSession.id}/pre-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_response",
          activityId: activePreQuizActivity.id,
          playerId: participantId,
          playerName: displayName,
          response
        })
      });
      const data = await res.json();
      if (data.success) {
        setPreQuizResponseSubmitted(true);
      }
    } catch (e) {
      console.error("Failed to submit pre-quiz response:", e);
    }
  };

  const handleSubmitAnswer = async (answer: any) => {
    if (!activeSession || !currentQuestion || playerAnswered || isSubmitting || !isQuizModeStarted || currentPhase !== "QUESTION_ACTIVE" || !canSubmitAnswer) {
      if (!isQuizModeStarted) {
        setErrorMessage("প্রকৃত কুইজ এখনও শুরু হয়নি। প্রি-কুইজ চলাকালীন কোনো স্কোরিং উত্তর নেওয়া হবে না।");
      } else if (currentPhase === "QUESTION_PREVIEW" || currentPhase === "COUNTDOWN") {
        setErrorMessage("প্রশ্ন প্রিভিউ চলাকালে উত্তর দেওয়া যাবে না। অপশন উন্মোচনের জন্য অপেক্ষা করুন।");
      }
      return;
    }

    const timeTaken = Math.max(1, (currentQuestion.timeLimit || 30) - timeLeft);
    setSelectedOption(answer);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/live-quizzes/sessions/${activeSession.id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: participantId,
          participantId,
          questionId: currentQuestion.id,
          answerPayload: answer,
          answer: answer,
          timeTakenSeconds: timeTaken
        })
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        setPlayerAnswered(true);
      } else {
        setErrorMessage(data.message || data.error || "উত্তর জমা দিতে সমস্যা হয়েছে।");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage("নেটওয়ার্ক ত্রুটি।");
    }
  };

  const handleNextQuestion = useCallback(async () => {
    // 1. Functional state update ensuring state update succeeds and triggers re-render
    setCurrentQuestionIdx((prev) => {
      const next = prev + 1;
      return totalQuestions > 0 && next >= totalQuestions ? prev : next;
    });
    setPlayerAnswered(false);
    setSelectedOption("");

    // 2. Server synchronization if active live session is running
    if (activeSession?.id) {
      try {
        const res = await fetch(`/api/live-quizzes/sessions/${activeSession.id}/next`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if (data.success && data.session) {
          if (data.session.currentQuestionIndex !== undefined) {
            setCurrentQuestionIdx(Number(data.session.currentQuestionIndex));
          }
          if (data.session.status) {
            setSessionStatus(data.session.status);
          }
        }
      } catch (err) {
        console.warn("Failed to synchronize next question with server:", err);
      }
    }
  }, [activeSession, totalQuestions]);

  const handlePreviousQuestion = useCallback(() => {
    setCurrentQuestionIdx((prev) => Math.max(0, prev - 1));
    setPlayerAnswered(false);
    setSelectedOption("");
  }, []);

  const handleLeave = () => {
    localStorage.removeItem("pgtsc_live_quiz_player");
    setJoined(false);
    setActiveSession(null);
    setCurrentQuestion(null);
    setSessionStatus("LOBBY");
    router.push("/quiz/join");
  };

  const value = {
    joined, loading, networkStatus, errorMessage, activeSession, quizDetails,
    playerToken, participantId, sessionStatus, isQuizModeStarted, activePreQuizActivity, preQuizResponseSubmitted,
    currentPhase, countdownSeconds, previewSeconds, canSubmitAnswer, currentPlate,
    currentQuestion, currentQuestionIdx,
    totalQuestions, playerAnswered, timeLeft, selectedOption, isSubmitting,
    answeredCount, playerCount, studentStats, registeredStudents, activeMotivation,
    sessionCode, setSessionCode, displayName, setDisplayName,
    handleJoin, handleSubmitAnswer, handleNextQuestion, handlePreviousQuestion, setCurrentQuestionIdx,
    handlePreQuizResponse, handleLeave, setErrorMessage, setActiveMotivation
  };

  return (
    <QuizSessionContext.Provider value={value}>
      {children}
    </QuizSessionContext.Provider>
  );
}

export function useQuizSession() {
  const context = useContext(QuizSessionContext);
  if (context === undefined) {
    throw new Error("useQuizSession must be used within a QuizSessionProvider");
  }
  return context;
}
