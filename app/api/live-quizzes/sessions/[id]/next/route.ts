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

    const questions = getSessionQuestions(session.quizId);
    const nextIdx = (session.currentQuestionIndex || 0) + 1;

    const now = new Date();

    if (nextIdx >= questions.length) {
      // No more questions, complete quiz!
      session.status = "COMPLETED";
      session.updatedAt = now.toISOString();
      session.endedAt = now.toISOString();

      return NextResponse.json({
        success: true,
        message: "Quiz completed! Moving to results.",
        session
      });
    }

    // Go to next active question
    const nextQuestion = questions[nextIdx];
    const duration = nextQuestion.timeLimit || 30;
    const countdownDuration = 3; // 3s countdown for EVERY subsequent question
    const previewDuration = 3;   // 3s preview for EVERY subsequent question

    const countdownEndsAt = new Date(now.getTime() + countdownDuration * 1000);
    const previewEndsAt = new Date(countdownEndsAt.getTime() + previewDuration * 1000);
    const questionEndsAt = new Date(previewEndsAt.getTime() + duration * 1000);

    session.status = "QUESTION_ACTIVE";
    session.currentQuestionIndex = nextIdx;
    (session as any).sequenceStartedAt = now.toISOString();
    (session as any).countdownEndsAt = countdownEndsAt.toISOString();
    (session as any).previewEndsAt = previewEndsAt.toISOString();
    session.questionStartedAt = previewEndsAt.toISOString();
    session.questionEndsAt = questionEndsAt.toISOString();
    session.updatedAt = now.toISOString();

    return NextResponse.json({
      success: true,
      message: `Moving to Question ${nextIdx + 1}`,
      session
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to proceed to next question" },
      { status: 500 }
    );
  }
}
