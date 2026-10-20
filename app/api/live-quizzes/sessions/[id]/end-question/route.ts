import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { ScoringService } from "@/lib/scoringService";
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

    if (session.status !== "QUESTION_ACTIVE") {
      return NextResponse.json(
        { success: false, message: "Question is not active" },
        { status: 400 }
      );
    }

    const now = new Date();
    session.status = "QUESTION_ENDED";
    session.questionEndsAt = now.toISOString();
    session.updatedAt = now.toISOString();

    // Trigger Server-side Bulk Evaluation for this question
    const questions = getSessionQuestions(session.quizId);
    const currentIdx = session.currentQuestionIndex || 0;
    if (currentIdx < questions.length) {
      const activeQuestion = questions[currentIdx];
      ScoringService.evaluateSessionQuestion(id, activeQuestion.id);
    }

    return NextResponse.json({
      success: true,
      message: "Question ended early by host.",
      session
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to end question early" },
      { status: 500 }
    );
  }
}
