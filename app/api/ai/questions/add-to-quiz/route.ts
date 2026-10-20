import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, QuizQuestion } from "@/lib/database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionIds, quizId, marks = 2, timeLimit = 60 } = body;

    if (!quizId) {
      return NextResponse.json({ success: false, message: "Quiz ID is required" }, { status: 400 });
    }

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ success: false, message: "No question IDs provided" }, { status: 400 });
    }

    // Verify quiz exists
    const quiz = institutionalDb.quizzes.find((q) => q.id === quizId);
    if (!quiz) {
      return NextResponse.json({ success: false, message: "Quiz not found" }, { status: 404 });
    }

    const addedList: QuizQuestion[] = [];
    const nowStr = new Date().toISOString();

    for (const qId of questionIds) {
      const q = institutionalDb.aiGeneratedQuestions.find((item) => item.id === qId);
      if (!q) continue;

      // Check current question count to determine sequential order index
      const existingCount = institutionalDb.quizQuestions.filter((qq) => qq.quizId === quizId).length;

      // Determine if there is already a QuestionBank ID (or we can keep it blank or save it as well)
      const newQuizQuestion: QuizQuestion = {
        id: `qq-ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        quizId,
        questionBankId: "", // Inline added snapshot
        questionType: q.type,
        questionSnapshot: {
          questionText: q.questionText,
          questionData: JSON.parse(JSON.stringify(q.questionData)),
          explanation: q.explanation || "",
        },
        orderIndex: existingCount,
        marks: Number(marks) || 2,
        timeLimit: Number(timeLimit) || 60,
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      institutionalDb.quizQuestions.push(newQuizQuestion);
      
      // Mark original generated question status
      q.status = "saved";
      q.updatedAt = nowStr;

      addedList.push(newQuizQuestion);
    }

    // Audit logs simulation
    console.log(`[AUDIT LOG] Batch added AI questions to Quiz ${quizId}. Count: ${addedList.length}`);

    return NextResponse.json({
      success: true,
      addedQuestions: addedList,
      message: `Successfully added ${addedList.length} questions to quiz "${quiz.title}"!`,
    });
  } catch (error: any) {
    console.error("AI Add to Quiz Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to add questions to quiz" },
      { status: 500 }
    );
  }
}
