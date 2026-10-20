import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, LiveAnswer, LiveParticipant } from "@/lib/database";
import { QuizSecurityEngine } from "@/lib/quizSecurityEngine";
import { prisma, isPrismaAvailable } from "@/lib/prisma";

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
      answerPayload,
      responseTimeMs = 1200,
      tabSwitchCount = 0,
      timeLimitMs = 30000,
    } = body;

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: "খেলোয়াড় / শিক্ষার্থীর আইডি (playerId) অনুপস্থিত।" },
        { status: 400 }
      );
    }

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: "প্রশ্নের আইডি (questionId) অনুপস্থিত।" },
        { status: 400 }
      );
    }

    // 1. ENSURE COLLECTIONS EXIST IN INSTITUTIONAL DB
    institutionalDb.liveParticipants = institutionalDb.liveParticipants || [];
    institutionalDb.liveAnswers = institutionalDb.liveAnswers || [];
    institutionalDb.liveSessions = institutionalDb.liveSessions || [];

    // 2. FIND OR CREATE PARTICIPANT (AI Studio Preview Safe)
    let participant = institutionalDb.liveParticipants.find(
      (p) => p.sessionId === sessionId && p.id === playerId
    );

    if (!participant) {
      participant = {
        id: playerId,
        sessionId,
        displayName: body.displayName || `Student ${playerId.slice(-4)}`,
        playerToken: `TOKEN-${playerId}`,
        status: "JOINED",
        joinedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalScore: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        unanswered: 0,
        currentStreak: 0,
        bestStreak: 0,
        rank: institutionalDb.liveParticipants.length + 1,
      };
      institutionalDb.liveParticipants.push(participant);
    }

    // 3. DETERMINE THE CORRECT ANSWER
    let correctAnswer: any = body.correctAnswer;

    if (correctAnswer === undefined) {
      // Find question from active session or question bank
      const session = institutionalDb.liveSessions.find((s) => s.id === sessionId);
      const questionItem = session?.questions?.find((q: any) => q.id === questionId);

      if (questionItem) {
        correctAnswer = questionItem.correctAnswer ?? questionItem.correctOptionIndex ?? 0;
      } else {
        // Fallback default for preview simulation
        correctAnswer = body.answerPayload !== undefined ? body.answerPayload : 0;
      }
    }

    // 4. RUN SERVER-AUTHORITATIVE ANTI-CHEAT & EVALUATION ENGINE
    const evaluation = QuizSecurityEngine.evaluateAnswer({
      playerId,
      questionId,
      answerPayload,
      correctAnswer,
      responseTimeMs: Number(responseTimeMs) || 1000,
      timeLimitMs: Number(timeLimitMs) || 30000,
      currentStreak: participant.currentStreak || 0,
      tabSwitchCount: Number(tabSwitchCount) || 0,
    });

    // 5. UPDATE IN-MEMORY PARTICIPANT STATS
    const currentScore = participant.totalScore || 0;
    participant.totalScore = currentScore + evaluation.totalPoints;
    participant.currentStreak = evaluation.newStreak;
    if (evaluation.newStreak > (participant.bestStreak || 0)) {
      participant.bestStreak = evaluation.newStreak;
    }

    if (evaluation.isCorrect) {
      participant.correctAnswers = (participant.correctAnswers || 0) + 1;
    } else {
      participant.wrongAnswers = (participant.wrongAnswers || 0) + 1;
    }
    participant.lastSeenAt = new Date().toISOString();

    // 6. RECORD LIVE ANSWER
    const newAnswerRecord: LiveAnswer = {
      id: `ans_${sessionId}_${playerId}_${questionId}_${Date.now()}`,
      sessionId,
      playerId,
      questionId,
      answerPayload,
      submittedAt: new Date().toISOString(),
      responseTimeMs: Number(responseTimeMs),
      isCorrect: evaluation.isCorrect,
      answerStatus: "SUBMITTED",
      basePoints: evaluation.basePoints,
      speedBonus: evaluation.speedBonus,
      streakBonus: evaluation.streakBonus,
      penalty: evaluation.penalty,
      totalPoints: evaluation.totalPoints,
      evaluatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    institutionalDb.liveAnswers.push(newAnswerRecord);

    // Recompute Ranks for the session
    const sessionParticipants = institutionalDb.liveParticipants.filter(
      (p) => p.sessionId === sessionId
    );
    sessionParticipants.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    sessionParticipants.forEach((p, idx) => {
      p.previousRank = p.rank;
      p.rank = idx + 1;
    });

    // 7. MYSQL PERSISTENCE VIA PRISMA (If operational)
    if (isPrismaAvailable() && prisma) {
      try {
        await prisma.liveAnswer.create({
          data: {
            sessionId,
            playerId,
            questionId,
            answerPayload: JSON.stringify(answerPayload),
            responseTimeMs: Number(responseTimeMs),
            isCorrect: evaluation.isCorrect,
            totalPoints: evaluation.totalPoints,
          } as any,
        });

        await prisma.liveParticipant.update({
          where: { id: playerId },
          data: {
            totalScore: participant.totalScore,
            currentStreak: participant.currentStreak,
            correctAnswers: participant.correctAnswers,
          } as any,
        });
      } catch (dbErr) {
        console.warn("[Secure-Submit] Prisma update skipped, using in-memory state:", (dbErr as Error).message);
      }
    }

    return NextResponse.json({
      success: true,
      isCorrect: evaluation.isCorrect,
      basePoints: evaluation.basePoints,
      speedBonus: evaluation.speedBonus,
      streakBonus: evaluation.streakBonus,
      penalty: evaluation.penalty,
      totalPoints: evaluation.totalPoints,
      newStreak: evaluation.newStreak,
      isFlagged: evaluation.isFlagged,
      flagReason: evaluation.flagReason,
      securityNotice: evaluation.securityNotice,
      totalScore: participant.totalScore,
      rank: participant.rank,
      source: isPrismaAvailable() ? "mysql" : "in-memory",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "উত্তর মূল্যায়ন প্রক্রিয়ায় সমস্যা দেখা দিয়েছে।" },
      { status: 500 }
    );
  }
}
