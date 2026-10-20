import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, LiveSession } from "@/lib/database";
import { getSessionQuestions } from "@/lib/liveQuizHelper";
import { ScoringService } from "@/lib/scoringService";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    // Retrieve session from memory DB
    let session = institutionalDb.liveSessions.find((s) => s.id === sessionId);

    // If not found in memory, try Prisma if configured
    if (!session && hasDatabaseUrl) {
      try {
        if (prisma) {
          const dbSession = await prisma.liveSession.findUnique({
            where: { id: sessionId },
          });
          if (dbSession) {
            session = {
              id: dbSession.id,
              quizId: dbSession.quizId,
              hostUserId: dbSession.hostUserId,
              sessionCode: dbSession.sessionCode,
              joinToken: dbSession.joinToken || "token",
              status: dbSession.status as any,
              maxPlayers: dbSession.maxPlayers || 100,
              isLocked: dbSession.isLocked || false,
              currentQuestionIndex: dbSession.currentQuestionIndex || 0,
              questionStartedAt: dbSession.questionStartedAt?.toISOString(),
              questionEndsAt: dbSession.questionEndsAt?.toISOString(),
              createdAt: dbSession.createdAt.toISOString(),
              updatedAt: dbSession.updatedAt.toISOString(),
            };
          }
        }
      } catch (err) {
        console.warn("[Status GET] Prisma fetch fallback:", err);
      }
    }

    // If still not found, construct a safe virtual session for preview mode
    if (!session) {
      session = {
        id: sessionId,
        quizId: "comp-iot",
        hostUserId: 3,
        sessionCode: "123456",
        joinToken: "preview-token",
        status: "LOBBY",
        maxPlayers: 100,
        isLocked: false,
        currentQuestionIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      institutionalDb.liveSessions.push(session);
    }

    // Participants in this session
    const participants = institutionalDb.liveParticipants.filter(
      (p) => p.sessionId === sessionId
    );

    // Current Question Index
    const currentQIdx = session.currentQuestionIndex || 0;

    // Remaining time calculation
    let timeLeft = 0;
    if (session.status === "QUESTION_ACTIVE" && session.questionEndsAt) {
      const endsAt = new Date(session.questionEndsAt).getTime();
      const now = Date.now();
      timeLeft = Math.max(0, Math.ceil((endsAt - now) / 1000));
    }

    // Answers for the current question
    const answersForCurrentQ = institutionalDb.liveAnswers.filter(
      (a) =>
        a.sessionId === sessionId &&
        (a.questionId === String(currentQIdx) ||
          a.questionId === `q-${currentQIdx}` ||
          a.questionId === String(currentQIdx + 1))
    );

    const submittedCount = answersForCurrentQ.length;

    // Option distribution breakdown [count0, count1, count2, count3]
    const optionStats = [0, 0, 0, 0];
    answersForCurrentQ.forEach((ans) => {
      let optIndex = -1;
      if (typeof ans.answerPayload === "number") {
        optIndex = ans.answerPayload;
      } else if (ans.answerPayload?.selectedOption !== undefined) {
        optIndex = Number(ans.answerPayload.selectedOption);
      } else if (!isNaN(Number(ans.answerPayload))) {
        optIndex = Number(ans.answerPayload);
      }

      if (optIndex >= 0 && optIndex < 4) {
        optionStats[optIndex]++;
      }
    });

    // Check if answers should be revealed
    const isAnswerRevealed =
      session.status === "QUESTION_ENDED" ||
      session.status === "COMPLETED" ||
      (session.status === "QUESTION_ACTIVE" && timeLeft === 0);

    // Questions list
    const questions = getSessionQuestions(session.quizId);
    const activeQuestion = questions[currentQIdx] || questions[0] || null;

    // Current question payload
    let questionData = null;
    if (activeQuestion) {
      questionData = {
        id: activeQuestion.id,
        index: currentQIdx,
        question: activeQuestion.questionText || activeQuestion.question || "টেকনিক্যাল প্রশ্ন",
        options: activeQuestion.options || ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"],
        timeLimit: activeQuestion.timeLimit || 30,
        // Only disclose correct answer and explanation if revealed
        correctAnswer: isAnswerRevealed ? activeQuestion.correctAnswer ?? 0 : undefined,
        explanation: isAnswerRevealed ? (activeQuestion as any).explanation || "" : undefined,
      };
    }

    // Top Leaderboard
    const leaderboard = [...participants]
      .map((p) => ({
        id: p.id,
        name: p.displayName,
        avatar: p.avatar || "🤖",
        score: p.totalScore || 0,
        streak: p.currentStreak || 0,
        rank: p.rank || 1,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      sessionId,
      sessionCode: session.sessionCode,
      status: session.status,
      currentQuestionIndex: currentQIdx,
      totalQuestions: questions.length || 5,
      timeLeft,
      submittedCount,
      totalPlayers: participants.length,
      optionStats,
      isAnswerRevealed,
      currentQuestion: questionData,
      leaderboard,
      questionStartedAt: session.questionStartedAt,
      questionEndsAt: session.questionEndsAt,
      updatedAt: session.updatedAt,
    });
  } catch (error: any) {
    console.error("[Status API GET Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch session status" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();

    const {
      action,
      status: targetStatus,
      currentQuestionIndex: newQIdx,
      durationSeconds = 30,
    } = body || {};

    let session = institutionalDb.liveSessions.find((s) => s.id === sessionId);

    if (!session) {
      // Auto-register session if missing in preview mode
      session = {
        id: sessionId,
        quizId: "comp-iot",
        hostUserId: 3,
        sessionCode: "123456",
        joinToken: "preview-token",
        status: "LOBBY",
        maxPlayers: 100,
        isLocked: false,
        currentQuestionIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      institutionalDb.liveSessions.push(session);
    }

    const now = new Date();
    const nowStr = now.toISOString();

    // 1. START QUESTION
    if (action === "START_QUESTION" || targetStatus === "QUESTION_ACTIVE") {
      session.status = "QUESTION_ACTIVE";
      if (typeof newQIdx === "number") {
        session.currentQuestionIndex = newQIdx;
      }
      session.questionStartedAt = nowStr;
      session.questionEndsAt = new Date(now.getTime() + durationSeconds * 1000).toISOString();
      session.updatedAt = nowStr;
    }
    // 2. END QUESTION / SHOW RESULTS
    else if (
      action === "END_QUESTION" ||
      action === "SHOW_RESULTS" ||
      targetStatus === "QUESTION_ENDED"
    ) {
      session.status = "QUESTION_ENDED";
      session.questionEndsAt = nowStr;
      session.updatedAt = nowStr;

      // Evaluate scores for this question
      try {
        const questions = getSessionQuestions(session.quizId);
        const qIdx = session.currentQuestionIndex || 0;
        if (qIdx < questions.length) {
          const activeQuestion = questions[qIdx];
          ScoringService.evaluateSessionQuestion(sessionId, activeQuestion.id);
        }
      } catch (e) {
        console.warn("Bulk evaluation warning:", e);
      }
    }
    // 3. NEXT QUESTION
    else if (action === "NEXT_QUESTION") {
      session.currentQuestionIndex = (session.currentQuestionIndex || 0) + 1;
      session.status = "QUESTION_ACTIVE";
      session.questionStartedAt = nowStr;
      session.questionEndsAt = new Date(now.getTime() + durationSeconds * 1000).toISOString();
      session.updatedAt = nowStr;
    }
    // 4. COMPLETE QUIZ
    else if (action === "COMPLETED" || targetStatus === "COMPLETED") {
      session.status = "COMPLETED";
      session.endedAt = nowStr;
      session.updatedAt = nowStr;

      // Final rank recalculation
      const participants = institutionalDb.liveParticipants.filter(
        (p) => p.sessionId === sessionId
      );
      participants.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
      participants.forEach((p, idx) => {
        p.previousRank = p.rank;
        p.rank = idx + 1;
      });
    }
    // 5. MANUAL STATUS OVERRIDE
    else if (targetStatus) {
      session.status = targetStatus;
      session.updatedAt = nowStr;
    }

    // Sync to Prisma if active
    if (hasDatabaseUrl) {
      try {
        if (prisma) {
          await prisma.liveSession.update({
            where: { id: sessionId },
            data: {
              status: session.status,
              currentQuestionIndex: session.currentQuestionIndex,
              questionStartedAt: session.questionStartedAt ? new Date(session.questionStartedAt) : null,
              questionEndsAt: session.questionEndsAt ? new Date(session.questionEndsAt) : null,
              updatedAt: new Date(),
            },
          });
        }
      } catch (err) {
        console.warn("[Status PATCH] Prisma update ignored in preview mode:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Session status updated to ${session.status}`,
      session: {
        id: session.id,
        status: session.status,
        currentQuestionIndex: session.currentQuestionIndex,
        questionStartedAt: session.questionStartedAt,
        questionEndsAt: session.questionEndsAt,
        updatedAt: session.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("[Status API PATCH Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update session status" },
      { status: 500 }
    );
  }
}
