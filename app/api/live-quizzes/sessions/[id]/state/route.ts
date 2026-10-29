import { NextRequest, NextResponse } from "next/server";
import { getLiveSession, evaluateAndAdvanceSessionStage, LiveSessionRecord, saveLiveSession } from "@/lib/liveSessionStore";
import { SecurityService } from "@/lib/reconnectService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId") || searchParams.get("participantId");

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (SecurityService.isRateLimited(`state-${ipAddress}`, 240, 60000)) {
      return NextResponse.json(
        { success: false, message: "Too many state sync requests" },
        { status: 429 }
      );
    }

    // 1. Single Source of Truth lookup from high-concurrency engine
    const session = getLiveSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Live quiz session not found" },
        { status: 404 }
      );
    }

    // 2. CRITICAL AUTO-STAGE ADVANCEMENT (Task 2)
    // Evaluates stage timers & auto-advances so neither Host nor Students ever get stuck!
    evaluateAndAdvanceSessionStage(session);

    const now = Date.now();
    const stageEndsAt = Number(session.stageEndsAt) || (now + 3000);
    const stageStartedAt = Number(session.stageStartedAt) || now;
    const remainingSeconds = Math.max(0, Math.ceil((stageEndsAt - now) / 1000));

    const currentSlideIndex = Math.min(
      Math.max(0, session.currentSlideIndex || 0),
      Math.max(0, session.slides.length - 1)
    );
    const currentSlide = session.slides[currentSlideIndex] || session.slides[0];
    const currentQId = currentSlide?.id;

    const slideAnswers = session.answers[String(currentSlideIndex)] || {};
    const answersList = Object.values(slideAnswers);
    const submittedCount = answersList.length;

    const allPlayersList = Object.values(session.players || {});
    const totalPlayers = allPlayersList.length;
    const readyPlayers = allPlayersList.filter((p) => p.isReady);
    const readyCount = readyPlayers.length;

    // Calculate options distribution for charts
    const optionsCount = Array.isArray(currentSlide?.options) ? currentSlide.options.length : 4;
    const optionStats = new Array(optionsCount).fill(0);
    answersList.forEach((ans) => {
      const p = ans.answerPayload;
      if (typeof p === "number" && p >= 0 && p < optionsCount) {
        optionStats[p] += 1;
      } else if (typeof p === "string") {
        const num = parseInt(p, 10);
        if (!isNaN(num) && num >= 0 && num < optionsCount) {
          optionStats[num] += 1;
        }
      }
    });

    const correctCount = answersList.filter((a) => a.isCorrect === true).length;
    const wrongCount = answersList.filter((a) => a.isCorrect === false).length;
    const timedOutCount = Math.max(0, totalPlayers - submittedCount);

    // Compute top players leaderboard
    const sortedPlayers = [...allPlayersList].sort((a, b) => (b.score || 0) - (a.score || 0));
    sortedPlayers.forEach((p, idx) => {
      p.rank = idx + 1;
    });

    const topPlayers = sortedPlayers.slice(0, 10).map((p) => ({
      id: p.id,
      displayName: p.name,
      name: p.name,
      roll: p.roll,
      totalScore: p.score || 0,
      score: p.score || 0,
      avatar: p.avatar || "🚀",
      rank: p.rank || 1,
      streak: p.streak || 0,
    }));

    // Map stage to legacy phase for backward compatibility with older components
    let phase: "LOBBY" | "READY" | "COUNTDOWN" | "QUESTION_PREVIEW" | "QUESTION_ACTIVE" | "QUESTION_ENDED" | "COMPLETED" = "READY";
    if (session.status === "ENDED" || session.stage === "ENDED") {
      phase = "COMPLETED";
    } else if (session.stage === "WELCOME_WAITING" || session.stage === "WARMUP_ACTIVE") {
      phase = "LOBBY";
    } else if (session.stage === "READY_CHECK") {
      phase = "READY";
    } else if (session.stage === "COUNTDOWN_321") {
      phase = "COUNTDOWN";
    } else if (session.stage === "QUESTION_ONLY") {
      phase = "QUESTION_PREVIEW";
    } else if (session.stage === "ANSWERING_ACTIVE") {
      phase = "QUESTION_ACTIVE";
    } else if (session.stage === "RESULT_REVEAL" || session.stage === "LEADERBOARD_VIEW") {
      phase = "QUESTION_ENDED";
    }

    const isAnswerRevealed =
      session.stage === "RESULT_REVEAL" ||
      session.stage === "LEADERBOARD_VIEW" ||
      session.stage === "ENDED";

    // Player-specific state
    let studentAns = null;
    let hasAnsweredCurrent = false;
    let myRank = 1;
    let myScore = 0;
    let studentPlayer = null;

    if (playerId && playerId !== "HOST") {
      // Touch player lastSeenAt
      if (session.players[playerId]) {
        session.players[playerId].lastSeenAt = now;
        studentPlayer = session.players[playerId];
      }
      studentAns = slideAnswers[playerId] || null;
      hasAnsweredCurrent = Boolean(studentAns);

      const foundIndex = sortedPlayers.findIndex((p) => p.id === playerId);
      if (foundIndex >= 0) {
        myRank = foundIndex + 1;
        myScore = sortedPlayers[foundIndex].score || 0;
      }
    }

    const canSubmitAnswer = session.stage === "ANSWERING_ACTIVE" && !hasAnsweredCurrent;

    return NextResponse.json({
      success: true,
      serverNow: now,
      serverTimestamp: now,
      sessionStatus: session.status,
      status: session.status,
      stage: session.stage,
      phase,
      currentSlideIndex,
      currentQuestionIndex: currentSlideIndex,
      totalSlides: session.slides.length,
      totalQuestions: session.slides.length,
      stageStartedAt,
      stageEndsAt,
      remainingSeconds,
      countdownSeconds: session.stage === "COUNTDOWN_321" ? remainingSeconds : 0,
      previewSeconds: session.stage === "QUESTION_ONLY" ? remainingSeconds : 0,
      mainTimerSeconds: session.stage === "ANSWERING_ACTIVE" ? remainingSeconds : 0,
      timeLeft: session.stage === "ANSWERING_ACTIVE" ? remainingSeconds : 0,
      canSubmitAnswer,
      playerAnswered: hasAnsweredCurrent,
      studentAnswerData: studentAns,
      selectedOption: studentAns?.answerPayload ?? null,
      currentSlide,
      currentQuestion: currentSlide,
      currentQId,
      slides: session.slides,
      totalPlayers,
      playerCount: totalPlayers,
      activePlayersCount: totalPlayers,
      readyPlayers: readyPlayers.map((p) => ({
        playerId: p.id,
        id: p.id,
        name: p.name,
        roll: p.roll,
        avatar: p.avatar,
      })),
      readyCount,
      submittedCount,
      responsesCount: submittedCount,
      answeredCount: submittedCount,
      allVoted: totalPlayers > 0 && submittedCount >= totalPlayers,
      isAnswerRevealed,
      correctAnswer: isAnswerRevealed ? (currentSlide?.correctAnswer ?? 0) : undefined,
      explanation: isAnswerRevealed ? (currentSlide?.explanation || "") : undefined,
      optionStats,
      correctCount,
      wrongCount,
      timedOutCount,
      topPlayers,
      myRank,
      myScore,
      studentStats: studentPlayer
        ? {
            score: studentPlayer.score,
            rank: myRank,
            streak: studentPlayer.streak,
            correctAnswers: answersList.filter((a) => a.playerId === playerId && a.isCorrect).length,
          }
        : null,
      session: {
        id: session.id,
        code: session.code,
        title: session.title,
        status: session.status,
        stage: session.stage,
        currentSlideIndex,
        stageStartedAt,
        stageEndsAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch session state" },
      { status: 500 }
    );
  }
}
