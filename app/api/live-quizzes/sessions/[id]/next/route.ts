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

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is okay (defaults to +1)
    }

    const questions = getSessionQuestions(session.quizId);
    let nextIdx = (session.currentQuestionIndex || 0) + 1;

    if (typeof body.slideIndex === "number") {
      nextIdx = body.slideIndex;
    } else if (body.direction === "prev") {
      nextIdx = Math.max(0, (session.currentQuestionIndex || 0) - 1);
    }

    const now = new Date();

    if (nextIdx >= questions.length) {
      // No more questions, complete quiz!
      session.status = "COMPLETED";
      session.updatedAt = now.toISOString();
      session.endedAt = now.toISOString();

      return NextResponse.json({
        success: true,
        message: "সেশন সমাপ্ত হয়েছে!",
        session
      });
    }

    // Go to next active slide / question
    const nextItem = questions[nextIdx];
    const isGraded = Number(nextItem.timeLimit || 0) > 0;
    const duration = isGraded ? (nextItem.timeLimit || 30) : 0;
    const countdownDuration = isGraded ? 3 : 0; // Stage 1: Exactly 3 seconds (3-2-1)
    const previewDuration = isGraded ? 3.5 : 0; // Stage 2: Exactly 3.5 seconds (Question only)

    const countdownEndsAt = new Date(now.getTime() + countdownDuration * 1000);
    const previewEndsAt = new Date(countdownEndsAt.getTime() + previewDuration * 1000);
    const questionEndsAt = duration > 0 ? new Date(previewEndsAt.getTime() + duration * 1000) : null;

    session.status = "QUESTION_ACTIVE";
    session.currentQuestionIndex = nextIdx;
    (session as any).allVoted = false;
    (session as any).isAnswerRevealed = false;
    (session as any).readyPlayers = []; // Reset ready players for the new question cycle
    (session as any).sequenceStartedAt = now.toISOString();
    (session as any).countdownEndsAt = countdownDuration > 0 ? countdownEndsAt.toISOString() : undefined;
    (session as any).previewEndsAt = previewDuration > 0 ? previewEndsAt.toISOString() : undefined;
    session.questionStartedAt = now.toISOString();
    session.questionEndsAt = questionEndsAt ? questionEndsAt.toISOString() : undefined;
    session.updatedAt = now.toISOString();

    return NextResponse.json({
      success: true,
      message: `Moving to Slide ${nextIdx + 1}`,
      currentQuestionIndex: nextIdx,
      activeItem: nextItem,
      session
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to proceed to next question" },
      { status: 500 }
    );
  }
}
