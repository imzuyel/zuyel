import { NextRequest, NextResponse } from "next/server";
import { getLiveSession, recordPlayerAnswer, saveLiveSession, LiveAnswerRecord } from "@/lib/liveSessionStore";
import { QuizSecurityEngine } from "@/lib/quizSecurityEngine";
import { institutionalDb, LiveAnswer } from "@/lib/database";
import { MOTIVATION_MESSAGES } from "@/lib/motivationMessages";
import { sendSmsGateway } from "@/lib/smsGatewayEngine";
import { invalidateSessionCache } from "@/lib/sessionCache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();

    const {
      playerId,
      questionId,
      slideIndex: rawSlideIndex,
      answerPayload,
      responseTimeMs = 1200,
      tabSwitchCount = 0,
      timeLimitMs = 20000,
    } = body;

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: "খেলোয়াড় / শিক্ষার্থীর আইডি (playerId) অনুপস্থিত।" },
        { status: 400 }
      );
    }

    const session = getLiveSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "সেশন পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const currentSlideIndex = typeof rawSlideIndex === "number" ? rawSlideIndex : session.currentSlideIndex || 0;
    const slideKey = String(currentSlideIndex);

    // 1. DUPLICATE CHECK: O(1) memory lookup
    if (session.answers[slideKey] && session.answers[slideKey][playerId]) {
      const existing = session.answers[slideKey][playerId];
      return NextResponse.json({
        success: true,
        message: "উত্তর ইতিমধ্যে জমা হয়েছে।",
        isDuplicate: true,
        isCorrect: existing.isCorrect,
        totalPoints: existing.points,
        points: existing.points,
      });
    }

    // 2. Resolve target slide & correct answer
    const currentSlide = session.slides[currentSlideIndex] || session.slides[0];
    const qType = (currentSlide?.type || currentSlide?.questionType || "MCQ").toUpperCase();

    let correctAnswer = currentSlide?.correctAnswer;
    if (correctAnswer === undefined) {
      correctAnswer = body.correctAnswer !== undefined ? body.correctAnswer : 0;
    }

    // 3. Ensure player is registered
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

    // 4. Run authoritative Evaluation Engine
    const evaluation = QuizSecurityEngine.evaluateAnswer({
      playerId,
      questionId: String(questionId || currentSlide?.id || `slide-${currentSlideIndex}`),
      questionType: qType,
      questionSnapshot: currentSlide,
      answerPayload,
      correctAnswer,
      responseTimeMs: Number(responseTimeMs) || 1200,
      timeLimitMs: Number(timeLimitMs) || (Number(currentSlide?.timeLimit) || 20) * 1000,
      currentStreak: player.streak || 0,
      tabSwitchCount: Number(tabSwitchCount) || 0,
    });

    // 5. Build high-concurrency answer record
    const now = Date.now();
    const answerRecord: LiveAnswerRecord = {
      playerId,
      slideIndex: currentSlideIndex,
      questionId: String(questionId || currentSlide?.id || `slide-${currentSlideIndex}`),
      answerPayload,
      isCorrect: evaluation.isCorrect,
      points: evaluation.totalPoints,
      basePoints: evaluation.basePoints,
      speedBonus: evaluation.speedBonus,
      streakBonus: evaluation.streakBonus,
      penalty: evaluation.penalty,
      responseTimeMs: Number(responseTimeMs) || 1200,
      submittedAt: now,
    };

    // 6. Record answer in O(1)
    recordPlayerAnswer(sessionId, currentSlideIndex, playerId, answerRecord);

    // Also mirror into institutionalDb.liveAnswers for legacy safety
    const legacyAns: LiveAnswer = {
      id: `ans_${sessionId}_${playerId}_${currentSlideIndex}_${now}`,
      sessionId,
      playerId,
      questionId: String(questionId || currentSlide?.id || `slide-${currentSlideIndex}`),
      answerPayload,
      submittedAt: new Date(now).toISOString(),
      responseTimeMs: Number(responseTimeMs) || 1200,
      isCorrect: evaluation.isCorrect,
      answerStatus: "SUBMITTED",
      basePoints: evaluation.basePoints,
      speedBonus: evaluation.speedBonus,
      streakBonus: evaluation.streakBonus,
      penalty: evaluation.penalty,
      totalPoints: evaluation.totalPoints,
      evaluatedAt: new Date(now).toISOString(),
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    };
    (legacyAns as any).slideIndex = currentSlideIndex;
    institutionalDb.liveAnswers.push(legacyAns);

    // 7. Check "All Voted" Rule: If all joined players answered, transition to RESULT_REVEAL!
    const totalPlayers = Object.keys(session.players).length;
    const submittedCount = Object.keys(session.answers[slideKey] || {}).length;
    const allVoted = totalPlayers > 0 && submittedCount >= totalPlayers;

    if (allVoted && session.stage === "ANSWERING_ACTIVE") {
      session.stage = "RESULT_REVEAL";
      session.stageStartedAt = now;
      session.stageEndsAt = now + 120000;
      saveLiveSession(session);
    }

    // 8. Recompute ranks
    const sorted = Object.values(session.players).sort((a, b) => (b.score || 0) - (a.score || 0));
    sorted.forEach((p, idx) => {
      p.rank = idx + 1;
    });

    invalidateSessionCache(sessionId);

    return NextResponse.json({
      success: true,
      isCorrect: evaluation.isCorrect,
      correctAnswer: currentSlide?.correctAnswer ?? correctAnswer,
      basePoints: evaluation.basePoints,
      speedBonus: evaluation.speedBonus,
      streakBonus: evaluation.streakBonus,
      penalty: evaluation.penalty,
      totalPoints: evaluation.totalPoints,
      points: evaluation.totalPoints,
      newStreak: evaluation.newStreak,
      totalScore: player.score,
      rank: player.rank,
      myRank: player.rank,
      allVoted,
      isAnswerRevealed: session.stage === "RESULT_REVEAL",
      submittedCount,
      totalPlayers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "উত্তর মূল্যায়ন প্রক্রিয়ায় ত্রুটি ঘটেছে।" },
      { status: 500 }
    );
  }
}
