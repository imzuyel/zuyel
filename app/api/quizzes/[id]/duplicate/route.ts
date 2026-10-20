import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, Quiz, QuizQuestion } from "@/lib/database";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingQuiz = institutionalDb.quizzes.find((q) => q.id === id);

    if (!existingQuiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }

    const newQuizId = `quiz-${Date.now()}`;
    const duplicatedQuiz: Quiz = {
      ...existingQuiz,
      id: newQuizId,
      title: `${existingQuiz.title} (Copy)`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    institutionalDb.quizzes.unshift(duplicatedQuiz);

    // Duplicate questions
    const existingQuestions = institutionalDb.quizQuestions.filter(
      (qq) => qq.quizId === id
    );

    const duplicatedQuestions: QuizQuestion[] = existingQuestions.map(
      (qq, idx) => ({
        ...qq,
        id: `qq-${Date.now()}-${idx}`,
        quizId: newQuizId,
        questionSnapshot: JSON.parse(JSON.stringify(qq.questionSnapshot)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    institutionalDb.quizQuestions.push(...duplicatedQuestions);

    return NextResponse.json({
      success: true,
      quiz: duplicatedQuiz,
      questions: duplicatedQuestions,
      message: "Quiz duplicated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to duplicate quiz" },
      { status: 500 }
    );
  }
}
