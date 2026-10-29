import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { getSessionQuestions } from "@/lib/liveQuizHelper";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = institutionalDb.liveSessions.find(s => s.id === id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Live session not found" },
        { status: 404 }
      );
    }

    if (session.status !== "LOBBY") {
      return NextResponse.json(
        { success: false, message: "Session is not in LOBBY state" },
        { status: 400 }
      );
    }

    const questions = getSessionQuestions(session.quizId);
    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, message: "This quiz has no valid questions to display" },
        { status: 400 }
      );
    }

    const firstQuestion = questions[0];
    const isGraded = Number(firstQuestion?.timeLimit || 0) > 0 || ["MCQ", "MATCHING", "FILL_BLANKS", "REORDER", "TRUE_FALSE"].includes((firstQuestion?.type || "").toUpperCase());
    const now = new Date();

    session.currentQuestionIndex = 0;
    (session as any).sequenceStartedAt = now.toISOString();
    (session as any).readyPlayers = [];
    (session as any).allVoted = false;
    (session as any).isAnswerRevealed = false;
    (session as any).eligibilityFrozen = true;
    session.isQuizModeStarted = true;
    session.activePreQuizActivity = null;

    if (isGraded) {
      // Mandatory FIX 4: Enter READY_CHECK State First! DO NOT start countdown/timer until teacher clicks Start!
      session.status = "READY" as any;
      (session as any).countdownEndsAt = undefined;
      (session as any).previewEndsAt = undefined;
      session.questionStartedAt = undefined;
      session.questionEndsAt = undefined;
    } else {
      // Content / Warmup slide
      session.status = "QUESTION_ACTIVE";
      (session as any).countdownEndsAt = undefined;
      (session as any).previewEndsAt = undefined;
      session.questionStartedAt = now.toISOString();
      session.questionEndsAt = undefined;
    }

    session.updatedAt = now.toISOString();

    // Log Eligibility Freeze in Security Audit Logs (Phase 14 Requirement 25 & 46)
    if (institutionalDb.eligibilityAuditLogs) {
      institutionalDb.eligibilityAuditLogs.unshift({
        id: `audit-freeze-${session.id}-${Date.now()}`,
        eventType: "QUIZ_SESSION_ELIGIBILITY_FROZEN",
        message: `কুইজ লাইভ সেশন (${session.sessionCode}) শুরু হওয়ায় অংশগ্রহণকারী যোগ্যতা স্থবির (Frozen) করা হয়েছে।`,
        performedBy: "Quiz Live System",
        timestamp: now.toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: "Quiz live session started successfully. Eligibility state is now frozen.",
      session
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to start quiz" },
      { status: 500 }
    );
  }
}
