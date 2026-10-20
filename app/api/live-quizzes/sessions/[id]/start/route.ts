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
    const duration = firstQuestion.timeLimit || 30;
    const countdownDuration = 3; // 3s synchronized countdown: 3 -> 2 -> 1 -> GO!
    const previewDuration = 3;   // 3s question preview with masked options
    
    const now = new Date();
    const countdownEndsAt = new Date(now.getTime() + countdownDuration * 1000);
    const previewEndsAt = new Date(countdownEndsAt.getTime() + previewDuration * 1000);
    const questionEndsAt = new Date(previewEndsAt.getTime() + duration * 1000);

    session.status = "QUESTION_ACTIVE";
    session.currentQuestionIndex = 0;
    (session as any).sequenceStartedAt = now.toISOString();
    (session as any).countdownEndsAt = countdownEndsAt.toISOString();
    (session as any).previewEndsAt = previewEndsAt.toISOString();
    session.questionStartedAt = previewEndsAt.toISOString();
    session.questionEndsAt = questionEndsAt.toISOString();
    session.updatedAt = now.toISOString();
    (session as any).eligibilityFrozen = true;
    session.isQuizModeStarted = true;
    session.activePreQuizActivity = null;

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
