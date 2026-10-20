import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, LiveAnswer } from "@/lib/database";
import { getSessionQuestions } from "@/lib/liveQuizHelper";
import { ScoringService, LeaderboardService } from "@/lib/scoringService";
import { SecurityService } from "@/lib/reconnectService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const playerId = body.playerId || body.participantId;
    const questionId = body.questionId;
    const answerPayload = body.answerPayload !== undefined ? body.answerPayload : body.answer;

    const userAgent = req.headers.get("user-agent") || "unknown";
    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // Basic Anti-Cheat: Rate limit submission endpoint
    if (SecurityService.isRateLimited(`ans-${ipAddress}-${playerId}`, 12, 10000)) {
      SecurityService.logAudit(
        id,
        "RATE_LIMIT_TRIGGERED",
        `Rate limit triggered during answer submission for player ID ${playerId}.`,
        playerId,
        ipAddress,
        userAgent
      );
      return NextResponse.json(
        { success: false, message: "অতিরিক্ত রিকোয়েস্ট পাঠিয়েছেন। দয়া করে ১০ সেকেন্ড পর চেষ্টা করুন।" },
        { status: 429 }
      );
    }

    if (!playerId || !questionId || answerPayload === undefined) {
      return NextResponse.json(
        { success: false, message: "প্রয়োজনীয় তথ্য প্রদান করা হয়নি।" },
        { status: 400 }
      );
    }

    const session = institutionalDb.liveSessions.find(s => s.id === id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "লাইভ কুইজ সেশন পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // 1. Verify player belongs to session and is actively joined
    const participant = institutionalDb.liveParticipants.find(
      p => p.id === playerId && p.sessionId === id && p.status === "JOINED"
    );

    if (!participant) {
      return NextResponse.json(
        { success: false, message: "আপনি এই সেশনে যুক্ত নন বা কিক করা হয়েছেন।" },
        { status: 403 }
      );
    }

    // 2. Verify session is currently active
    if (session.status !== "QUESTION_ACTIVE") {
      return NextResponse.json(
        { success: false, message: "এই মুহূর্তে কোনো প্রশ্ন সক্রিয় নেই।" },
        { status: 400 }
      );
    }

    // 3. Verify question matches the current active question ID
    const questions = getSessionQuestions(session.quizId);
    const currentIdx = session.currentQuestionIndex || 0;
    if (currentIdx >= questions.length) {
      return NextResponse.json(
        { success: false, message: "ভুল প্রশ্নের ইনডেক্স।" },
        { status: 400 }
      );
    }

    const activeQuestion = questions[currentIdx];
    if (activeQuestion.id !== questionId) {
      return NextResponse.json(
        { success: false, message: "প্রশ্নটির আইডি বর্তমান সক্রিয় প্রশ্নের সাথে মেলেনি।" },
        { status: 400 }
      );
    }

    // 4. Server-authoritative countdown & preview phase check
    const now = new Date();
    const previewEndsAt = (session as any).previewEndsAt ? new Date((session as any).previewEndsAt) : null;
    if (previewEndsAt && now < previewEndsAt) {
      return NextResponse.json(
        { success: false, message: "প্রশ্নটি এখনো কাউন্টডাউন বা প্রিভিউ পর্যায়ে রয়েছে। অপশন প্রকাশের পর উত্তর দিন।" },
        { status: 400 }
      );
    }

    // 5. Server-authoritative deadline check
    const endsAt = session.questionEndsAt ? new Date(session.questionEndsAt) : null;
    if (endsAt && now > endsAt) {
      // Transition session status to ended
      session.status = "QUESTION_ENDED";
      session.updatedAt = now.toISOString();

      // Trigger bulk evaluation fallback for this question upon late transition
      ScoringService.evaluateSessionQuestion(id, activeQuestion.id);

      return NextResponse.json(
        { success: false, message: "দুঃখিত, সময় শেষ হয়ে গেছে!" },
        { status: 400 }
      );
    }

    // 5. One submission per player per question check (race-condition protection)
    const alreadyAnswered = institutionalDb.liveAnswers.some(
      a => a.sessionId === id && a.playerId === playerId && a.questionId === questionId
    );

    if (alreadyAnswered) {
      SecurityService.logAudit(
        id,
        "DUPLICATE_ANSWER",
        `Duplicate answer submitted by player ${participant.displayName} for question ID ${questionId}. Ignored second submission.`,
        playerId,
        ipAddress,
        userAgent
      );
      return NextResponse.json(
        { success: false, message: "আপনি ইতিমধ্যে এই প্রশ্নের উত্তর সাবমিট করেছেন।" },
        { status: 400 }
      );
    }

    // 6. Compute server-side response time accurately
    const startedAt = session.questionStartedAt ? new Date(session.questionStartedAt) : now;
    const responseTimeMs = now.getTime() - startedAt.getTime();

    // 7. Initialize player stats if missing
    participant.totalScore = participant.totalScore ?? 0;
    participant.correctAnswers = participant.correctAnswers ?? 0;
    participant.wrongAnswers = participant.wrongAnswers ?? 0;
    participant.unanswered = participant.unanswered ?? 0;
    participant.currentStreak = participant.currentStreak ?? 0;
    participant.bestStreak = participant.bestStreak ?? 0;

    // Calculate score evaluation immediately
    const quizSettings = {
      basePoints: (session as any).basePoints ?? 100,
      speedBonusEnabled: (session as any).speedBonusEnabled ?? true,
      maxSpeedBonus: (session as any).maxSpeedBonus ?? 50,
      streakBonusEnabled: (session as any).streakBonusEnabled ?? true,
      streakBonusValue: (session as any).streakBonusValue ?? 10,
      negativeMarkingEnabled: (session as any).negativeMarkingEnabled ?? false,
      negativeMarkingValue: (session as any).negativeMarkingValue ?? 20
    };

    const evaluation = ScoringService.score({
      questionType: activeQuestion.type,
      submittedPayload: answerPayload,
      correctAnswer: activeQuestion.correctAnswer,
      responseTimeMs,
      questionDurationMs: (activeQuestion.timeLimit || 30) * 1000,
      currentStreak: participant.currentStreak,
      quizSettings,
      questionSnapshot: activeQuestion.questionData
    });

    // 8. Store answer payload & evaluation details
    const newAnswer: LiveAnswer = {
      id: `ans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId: id,
      playerId,
      questionId,
      answerPayload,
      submittedAt: now.toISOString(),
      responseTimeMs: Math.max(0, responseTimeMs),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      isCorrect: evaluation.isCorrect,
      answerStatus: evaluation.answerStatus,
      basePoints: evaluation.basePoints,
      speedBonus: evaluation.speedBonus,
      streakBonus: evaluation.streakBonus,
      penalty: evaluation.penalty,
      totalPoints: evaluation.totalPoints,
      evaluatedAt: now.toISOString()
    };

    institutionalDb.liveAnswers.push(newAnswer);

    // 9. Update participant stats instantly
    participant.totalScore += evaluation.totalPoints;
    if (evaluation.isCorrect) {
      participant.correctAnswers += 1;
    } else if (evaluation.isCorrect === false) {
      participant.wrongAnswers += 1;
    }
    participant.currentStreak = evaluation.streak;
    participant.bestStreak = Math.max(participant.bestStreak, evaluation.streak);

    // 10. Recalculate ranks across all active players in this session
    const allParticipants = institutionalDb.liveParticipants.filter(
      p => p.sessionId === id && p.status === "JOINED"
    );
    const rankedPlayers = LeaderboardService.calculateRanks(allParticipants);
    for (const rp of rankedPlayers) {
      const match = allParticipants.find(p => p.id === rp.id);
      if (match) {
        match.previousRank = rp.previousRank;
        match.rank = rp.rank;
      }
    }

    return NextResponse.json({
      success: true,
      message: "উত্তর সফলভাবে সাবমিট করা হয়েছে ও লক করা হয়েছে।",
      answerId: newAnswer.id
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit answer" },
      { status: 500 }
    );
  }
}
