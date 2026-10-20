import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quiz = institutionalDb.quizzes.find((q) => q.id === id);

    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }

    // Check if optional questions payload was sent
    let body: any = null;
    try {
      body = await req.json();
    } catch {}

    if (body?.questions && Array.isArray(body.questions) && body.questions.length > 0) {
      // Replace questions
      institutionalDb.quizQuestions = institutionalDb.quizQuestions.filter(
        (qq) => qq.quizId !== id
      );

      body.questions.forEach((q: any, idx: number) => {
        const questionText = q.questionText || q.question || `প্রশ্ন ${idx + 1}`;
        const optionsList = Array.isArray(q.options)
          ? q.options
          : q.questionData?.options || ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"];
        const correctIndex = typeof q.correctAnswer === "number"
          ? q.correctAnswer
          : typeof q.correctIndex === "number"
          ? q.correctIndex
          : q.questionData?.correctIndex ?? 0;
        const explanation = q.explanation || q.questionData?.explanation || "";
        const marks = Number(q.marks) || Number(quiz.defaultMarks) || 2;
        const timeLimit = Number(q.timeLimit) || Number(quiz.defaultQuestionTime) || 30;

        institutionalDb.quizQuestions.push({
          id: q.id && String(q.id).startsWith("qq-") ? String(q.id) : `qq-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          quizId: id,
          questionBankId: q.questionBankId || "",
          questionType: q.questionType || q.type || "mcq_single",
          questionSnapshot: {
            questionText,
            options: optionsList,
            correctIndex,
            explanation,
            questionData: {
              options: optionsList,
              correctIndex,
              explanation,
              marks,
              timeLimit,
            }
          },
          orderIndex: idx,
          marks,
          timeLimit,
          createdAt: q.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    }

    quiz.status = "published";
    quiz.updatedAt = new Date().toISOString();

    const questions = institutionalDb.quizQuestions.filter((qq) => qq.quizId === id);

    return NextResponse.json({
      success: true,
      quiz,
      questions,
      message: "Quiz published successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to publish quiz" },
      { status: 500 }
    );
  }
}
