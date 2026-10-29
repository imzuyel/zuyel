import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { SecurityService, SessionRecoveryService } from "@/lib/reconnectService";
import { getAssignedPlate } from "@/lib/quizPlateEngine";
import { getSessionQuestions } from "@/lib/liveQuizHelper";
import { getSessionCache, setSessionCache, invalidateSessionCache } from "@/lib/sessionCache";

export { invalidateSessionCache };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId") || searchParams.get("participantId");

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (SecurityService.isRateLimited(`state-${ipAddress}`, 120, 60000)) {
      return NextResponse.json(
        { success: false, message: "Too many state sync requests" },
        { status: 429 }
      );
    }

    // -----------------------------------------------------------------------
    // ULTRA-FAST IN-MEMORY CACHE (600ms TTL) FOR 50-60+ CONCURRENT STUDENTS
    // -----------------------------------------------------------------------
    let common = getSessionCache(sessionId);

    if (!common) {
      const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
      if (!session) {
        return NextResponse.json(
          { success: false, message: "Live quiz session not found" },
          { status: 404 }
        );
      }

      const questions = getSessionQuestions(session.quizId);
      const hostCurrentQuestion = questions[session.currentQuestionIndex || 0] || null;
      const currentQId = hostCurrentQuestion?.id;

      const now = new Date();
      const countdownEndsAt = (session as any).countdownEndsAt ? new Date((session as any).countdownEndsAt) : null;
      const previewEndsAt = (session as any).previewEndsAt ? new Date((session as any).previewEndsAt) : null;
      const questionEndsAt = session.questionEndsAt ? new Date(session.questionEndsAt) : null;

      const activeParticipants = institutionalDb.liveParticipants.filter(
        p => p.sessionId === sessionId && p.status === "JOINED"
      );
      const readyPlayers = (session as any).readyPlayers || [];
      const currentSlideResponses = institutionalDb.liveAnswers
        .filter((a) => a.sessionId === sessionId && (currentQId ? a.questionId === currentQId : true))
        .map((a) => {
          const p = institutionalDb.liveParticipants.find((part) => part.id === a.playerId);
          return {
            id: a.id,
            playerId: a.playerId,
            studentName: p?.displayName || "শিক্ষার্থী",
            avatar: (p as any)?.avatar || "🎓",
            response: typeof a.answerPayload === "string" ? a.answerPayload : JSON.stringify(a.answerPayload),
            submittedAt: a.submittedAt
          };
        });

      // Check All-Voted Condition
      const allVoted = Boolean((session as any).allVoted) || (activeParticipants.length > 0 && currentSlideResponses.length >= activeParticipants.length);
      if (allVoted) {
        (session as any).allVoted = true;
        (session as any).isAnswerRevealed = true;
      }

      let phase: "LOBBY" | "READY" | "COUNTDOWN" | "QUESTION_PREVIEW" | "QUESTION_ACTIVE" | "QUESTION_ENDED" | "COMPLETED" = "LOBBY";
      let countdownSecondsRemaining = 0;
      let previewSecondsRemaining = 0;
      let mainTimerSecondsRemaining = 0;
      let canSubmitAnswer = false;
      let isAnswerRevealed = Boolean((session as any).isAnswerRevealed);

      if (session.status === "COMPLETED") {
        phase = "COMPLETED";
      } else if (session.status === "LOBBY" || !session.isQuizModeStarted) {
        phase = "LOBBY";
      } else if (session.status === "READY") {
        phase = "READY";
      } else if (countdownEndsAt && now < countdownEndsAt) {
        phase = "COUNTDOWN";
        countdownSecondsRemaining = Math.max(1, Math.ceil((countdownEndsAt.getTime() - now.getTime()) / 1000));
      } else if (previewEndsAt && now < previewEndsAt) {
        phase = "QUESTION_PREVIEW";
        previewSecondsRemaining = Math.max(0.1, Number(((previewEndsAt.getTime() - now.getTime()) / 1000).toFixed(1)));
      } else if (allVoted || (questionEndsAt && now >= questionEndsAt)) {
        phase = "QUESTION_ENDED";
        mainTimerSecondsRemaining = 0;
        isAnswerRevealed = true;
      } else {
        phase = "QUESTION_ACTIVE";
        canSubmitAnswer = true;
        mainTimerSecondsRemaining = questionEndsAt ? Math.max(0, Math.ceil((questionEndsAt.getTime() - now.getTime()) / 1000)) : 30;
      }

      // Calculate option statistics
      const optionStats = [0, 0, 0, 0];
      const currentQAnswers = institutionalDb.liveAnswers.filter(
        (a) => a.sessionId === sessionId && (currentQId ? a.questionId === currentQId : true)
      );
      currentQAnswers.forEach((ans) => {
        const p = ans.answerPayload;
        if (typeof p === "number" && p >= 0 && p < 4) {
          optionStats[p] += 1;
        } else if (typeof p === "string") {
          const num = parseInt(p);
          if (!isNaN(num) && num >= 0 && num < 4) {
            optionStats[num] += 1;
          }
        }
      });

      const sequenceState = {
        phase,
        countdownSecondsRemaining,
        previewSecondsRemaining,
        mainTimerSecondsRemaining,
        canSubmitAnswer,
        allVoted,
        isAnswerRevealed,
      };

      const topPlayers = [...activeParticipants]
        .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
        .slice(0, 10)
        .map(p => ({
          id: p.id,
          displayName: p.displayName,
          totalScore: p.totalScore || 0,
          avatar: (p as any).avatar || "🎓"
        }));

      common = {
        session,
        hostCurrentQuestion,
        currentQId,
        phase,
        sequenceState,
        countdownSecondsRemaining,
        previewSecondsRemaining,
        mainTimerSecondsRemaining,
        allVoted,
        isAnswerRevealed,
        canSubmitAnswer,
        activeParticipants,
        readyPlayers,
        currentSlideResponses,
        optionStats,
        topPlayers,
        isQuizModeStarted: session.isQuizModeStarted || false,
        scheduledStartTime: (session as any).scheduledStartTime || null,
        activePreQuizActivity: session.activePreQuizActivity || null,
        lastSmsDispatched: (session as any).lastSmsDispatched || null,
        showLeaderboard: Boolean((session as any).showLeaderboard || hostCurrentQuestion?.type === "LEADERBOARD"),
        correctAnswer: isAnswerRevealed ? (hostCurrentQuestion?.correctAnswer ?? (hostCurrentQuestion as any)?.questionData?.correctAnswer) : undefined,
      };

      // Cache snapshot for 600ms
      setSessionCache(sessionId, common, 600);
    }

    // Handle Host / General state polling (Instant 0ms from cache)
    if (!playerId || playerId === "HOST") {
      return NextResponse.json({
        success: true,
        sessionStatus: common.session.status,
        phase: common.phase,
        sequenceState: common.sequenceState,
        countdownSeconds: common.countdownSecondsRemaining,
        previewSeconds: common.previewSecondsRemaining,
        mainTimerSeconds: common.mainTimerSecondsRemaining,
        timeLeft: common.mainTimerSecondsRemaining,
        currentQuestionIndex: common.session.currentQuestionIndex || 0,
        currentSlide: common.hostCurrentQuestion,
        currentQuestion: common.hostCurrentQuestion,
        currentSlideResponses: common.currentSlideResponses,
        responsesCount: common.currentSlideResponses.length,
        submittedCount: common.currentSlideResponses.length,
        answeredCount: common.currentSlideResponses.length,
        totalPlayers: common.activeParticipants.length,
        activePlayersCount: common.activeParticipants.length,
        playerCount: common.activeParticipants.length,
        readyPlayers: common.readyPlayers,
        readyCount: common.readyPlayers.length,
        allVoted: common.allVoted,
        isAnswerRevealed: common.isAnswerRevealed,
        optionStats: common.optionStats,
        isQuizModeStarted: common.isQuizModeStarted,
        scheduledStartTime: common.scheduledStartTime,
        activePreQuizActivity: common.activePreQuizActivity,
        lastSmsDispatched: common.lastSmsDispatched,
        showLeaderboard: common.showLeaderboard,
        topPlayers: common.topPlayers,
      });
    }

    const state = SessionRecoveryService.recoverParticipantState(sessionId, playerId);
    if (!state) {
      return NextResponse.json(
        { success: false, message: "Participant state could not be recovered" },
        { status: 404 }
      );
    }

    // Get plate template for current question
    const activeParticipantIds = common.activeParticipants.map((p: any) => p.id);
    const plate = getAssignedPlate(sessionId, playerId, state.session.currentQuestionIndex, activeParticipantIds);

    // Retrieve active motivation message ONLY if competitive quiz mode has started
    let motivationMessage = null;
    const participant = institutionalDb.liveParticipants.find(
      p => p.id === playerId && p.sessionId === sessionId
    );
    if (common.session.isQuizModeStarted && participant && participant.motivationMessage && !participant.motivationMessage.shown) {
      motivationMessage = {
        category: participant.motivationMessage.category,
        message: participant.motivationMessage.message,
        questionIndex: participant.motivationMessage.questionIndex,
        durationMs: 8000
      };
      participant.motivationMessage.shown = true;
    }

    // Mid-session Join & Reconnect Resilience: check if this student already answered current slide
    let hasAnsweredCurrent = false;
    let studentAnswerPayload: any = null;

    if (common.currentQId) {
      const studentAns = institutionalDb.liveAnswers.find(
        a => a.sessionId === sessionId && a.playerId === playerId && a.questionId === common.currentQId
      );
      if (studentAns) {
        hasAnsweredCurrent = true;
        studentAnswerPayload = studentAns.answerPayload;
        state.answered = true;
        if (!state.originalAnswer) {
          state.originalAnswer = { answerPayload: studentAns.answerPayload };
        }
      }
    }

    // Attach sequence state to recovered state session
    if (state.session) {
      (state.session as any).phase = common.phase;
      (state.session as any).countdownSeconds = common.countdownSecondsRemaining;
      (state.session as any).previewSeconds = common.previewSecondsRemaining;
      (state.session as any).mainTimerSeconds = common.mainTimerSecondsRemaining;
      (state.session as any).canSubmitAnswer = common.canSubmitAnswer;
      (state.session as any).allVoted = common.allVoted;
      (state.session as any).isAnswerRevealed = common.isAnswerRevealed;
    }

    return NextResponse.json({
      success: true,
      state,
      plate,
      phase: common.phase,
      sequenceState: common.sequenceState,
      countdownSeconds: common.countdownSecondsRemaining,
      previewSeconds: common.previewSecondsRemaining,
      mainTimerSeconds: common.mainTimerSecondsRemaining,
      timeLeft: common.mainTimerSecondsRemaining,
      canSubmitAnswer: common.canSubmitAnswer,
      allVoted: common.allVoted,
      isAnswerRevealed: common.isAnswerRevealed,
      showLeaderboard: common.showLeaderboard,
      topPlayers: common.topPlayers,
      currentSlide: state.currentQuestion || common.hostCurrentQuestion,
      currentQuestion: state.currentQuestion || common.hostCurrentQuestion,
      currentSlideResponses: common.currentSlideResponses,
      responsesCount: common.currentSlideResponses.length,
      submittedCount: common.currentSlideResponses.length,
      answeredCount: common.currentSlideResponses.length,
      playerCount: common.activeParticipants.length,
      activePlayersCount: common.activeParticipants.length,
      totalPlayers: common.activeParticipants.length,
      readyPlayers: common.readyPlayers,
      readyCount: common.readyPlayers.length,
      playerAnswered: hasAnsweredCurrent,
      selectedOption: studentAnswerPayload,
      optionStats: common.optionStats,
      isQuizModeStarted: common.isQuizModeStarted,
      scheduledStartTime: common.scheduledStartTime,
      activePreQuizActivity: common.activePreQuizActivity,
      motivationMessage,
      correctAnswer: common.correctAnswer,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch recovered state" },
      { status: 500 }
    );
  }
}
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch recovered state" },
      { status: 500 }
    );
  }
}
