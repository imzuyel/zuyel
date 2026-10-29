import { NextRequest, NextResponse } from "next/server";
import { getLiveSession, recordPlayerAnswer, saveLiveSession, LiveAnswerRecord } from "@/lib/liveSessionStore";
import { institutionalDb, LiveAnswer } from "@/lib/database";
import { ScoringService } from "@/lib/scoringService";
import { SecurityService } from "@/lib/reconnectService";
import { invalidateSessionCache } from "@/lib/sessionCache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();

    const playerId = body.playerId || body.participantId;
    const questionId = body.questionId;
    const answerPayload = body.answerPayload !== undefined ? body.answerPayload : body.answer;
    const slideIndex = body.slideIndex !== undefined ? Number(body.slideIndex) : undefined;

    if (!playerId) {
      return NextResponse.json(
        { success: false, message: "খেলোয়াড় আইডি (playerId) প্রয়োজন।" },
        { status: 400 }
      );
    }

    const session = getLiveSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "লাইভ কুইজ সেশন পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const targetSlideIdx = typeof slideIndex === "number" ? slideIndex : session.currentSlideIndex || 0;
    const currentSlide = session.slides[targetSlideIdx] || session.slides[0];
    const slideKey = String(targetSlideIdx);

    // Duplicate check
    if (session.answers[slideKey] && session.answers[slideKey][playerId]) {
      const existing = session.answers[slideKey][playerId];
      return NextResponse.json({
        success: true,
        message: "উত্তর ইতিমধ্যে জমা হয়েছে।",
        isDuplicate: true,
        isCorrect: existing.isCorrect,
        totalPoints: existing.points,
      });
    }

    // Ensure player exists
    if (!session.players[playerId]) {
      session.players[playerId] = {
        id: playerId,
        name: body.displayName || `শিক্ষার্থী ${playerId.slice(-4)}`,
        roll: body.roll || "—",
        avatar: body.avatar || "🚀",
        isReady: false,
        score: 0,
        streak: 0,
        rank: Object.keys(session.players).length + 1,
        lastSeenAt: Date.now(),
        joinedAt: Date.now(),
      };
    }
    const player = session.players[playerId];

    const responseTimeMs = Number(body.responseTimeMs) || 1200;
    const questionDurationMs = (Number(currentSlide?.timeLimit) || 20) * 1000;

    const evaluation = ScoringService.score({
      questionType: currentSlide?.type || "MCQ",
      submittedPayload: answerPayload,
      correctAnswer: currentSlide?.correctAnswer,
      responseTimeMs,
      questionDurationMs,
      currentStreak: player.streak || 0,
      quizSettings: {
        basePoints: 100,
        speedBonusEnabled: true,
        maxSpeedBonus: 50,
        streakBonusEnabled: true,
        streakBonusValue: 10,
        negativeMarkingEnabled: false,
        negativeMarkingValue: 0,
      },
      questionSnapshot: currentSlide,
    });

    const now = Date.now();
    const answerRecord: LiveAnswerRecord = {
      playerId,
      slideIndex: targetSlideIdx,
      questionId: String(questionId || currentSlide?.id || `slide-${targetSlideIdx}`),
      answerPayload,
      isCorrect: Boolean(evaluation.isCorrect),
      points: evaluation.totalPoints,
      basePoints: evaluation.basePoints,
      speedBonus: evaluation.speedBonus,
      streakBonus: evaluation.streakBonus,
      penalty: evaluation.penalty,
      responseTimeMs,
      submittedAt: now,
    };

    recordPlayerAnswer(sessionId, targetSlideIdx, playerId, answerRecord);

    // Sync to institutionalDb.liveAnswers
    const legacyAns: LiveAnswer = {
      id: `ans_${sessionId}_${playerId}_${targetSlideIdx}_${now}`,
      sessionId,
      playerId,
      questionId: String(questionId || currentSlide?.id || `slide-${targetSlideIdx}`),
      answerPayload,
      submittedAt: new Date(now).toISOString(),
      responseTimeMs,
      isCorrect: evaluation.isCorrect,
      answerStatus: evaluation.answerStatus,
      basePoints: evaluation.basePoints,
      speedBonus: evaluation.speedBonus,
      streakBonus: evaluation.streakBonus,
      penalty: evaluation.penalty,
      totalPoints: evaluation.totalPoints,
      evaluatedAt: new Date(now).toISOString(),
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    };
    (legacyAns as any).slideIndex = targetSlideIdx;
    institutionalDb.liveAnswers.push(legacyAns);

    // Check all voted
    const totalPlayers = Object.keys(session.players).length;
    const submittedCount = Object.keys(session.answers[slideKey] || {}).length;
    const allVoted = totalPlayers > 0 && submittedCount >= totalPlayers;

    if (allVoted && session.stage === "ANSWERING_ACTIVE") {
      session.stage = "RESULT_REVEAL";
      session.stageStartedAt = now;
      session.stageEndsAt = now + 120000;
      saveLiveSession(session);
    }

    invalidateSessionCache(sessionId);

    return NextResponse.json({
      success: true,
      message: "উত্তর সফলভাবে জমা দেওয়া হয়েছে।",
      isCorrect: evaluation.isCorrect,
      correctAnswer: currentSlide?.correctAnswer,
      totalPoints: evaluation.totalPoints,
      points: evaluation.totalPoints,
      responseTimeMs,
      totalScore: player.score,
      rank: player.rank,
      allVoted,
      isAnswerRevealed: session.stage === "RESULT_REVEAL",
      submittedCount,
      totalPlayers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit answer" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const session = getLiveSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const slideIdxParam = searchParams.get("slideIndex");
    const targetIdx = slideIdxParam !== null ? parseInt(slideIdxParam, 10) : session.currentSlideIndex;

    const slideAnswers = session.answers[String(targetIdx)] || {};
    const answers = Object.values(slideAnswers).map((a) => {
      const p = session.players[a.playerId];
      return {
        ...a,
        studentName: p?.name || "শিক্ষার্থী",
        avatar: p?.avatar || "🎓",
        response: typeof a.answerPayload === "string" ? a.answerPayload : JSON.stringify(a.answerPayload),
      };
    });

    return NextResponse.json({
      success: true,
      answers,
      totalCount: answers.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch answers" },
      { status: 500 }
    );
  }
}
