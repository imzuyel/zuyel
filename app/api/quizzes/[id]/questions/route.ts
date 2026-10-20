import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, QuizQuestion } from "@/lib/database";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questions = institutionalDb.quizQuestions
      .filter((qq) => qq.quizId === id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch quiz questions" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params;
    const body = await req.json();

    // Check if adding from question bank or creating new inline question
    if (body.questionBankId) {
      const qbQuestion = institutionalDb.questionBank.find(
        (q) => q.id === body.questionBankId
      );
      if (!qbQuestion) {
        return NextResponse.json(
          { success: false, message: "Question Bank item not found" },
          { status: 404 }
        );
      }

      const existingCount = institutionalDb.quizQuestions.filter(
        (qq) => qq.quizId === quizId
      ).length;

      const newQuizQuestion: QuizQuestion = {
        id: `qq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        quizId,
        questionBankId: qbQuestion.id,
        questionType: qbQuestion.type,
        questionSnapshot: {
          questionText: qbQuestion.questionText,
          questionData: JSON.parse(JSON.stringify(qbQuestion.questionData)),
          explanation: qbQuestion.explanation || "",
        },
        orderIndex: existingCount,
        marks: Number(body.marks) || 2,
        timeLimit: Number(body.timeLimit) || 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      institutionalDb.quizQuestions.push(newQuizQuestion);

      return NextResponse.json({
        success: true,
        question: newQuizQuestion,
        message: "Question added to quiz from Question Bank",
      });
    }

    // Creating new inline question for quiz
    const existingCount = institutionalDb.quizQuestions.filter(
      (qq) => qq.quizId === quizId
    ).length;

    const newQuizQuestion: QuizQuestion = {
      id: `qq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      quizId,
      questionBankId: body.saveToQuestionBank ? `qb-${Date.now()}` : "",
      questionType: body.type || "mcq_single",
      questionSnapshot: {
        questionText: body.questionText || "Untitled Question",
        questionData: body.questionData || { options: ["Option 1", "Option 2"], correctIndex: 0 },
        explanation: body.explanation || "",
      },
      orderIndex: existingCount,
      marks: Number(body.marks) || 2,
      timeLimit: Number(body.timeLimit) || 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    institutionalDb.quizQuestions.push(newQuizQuestion);

    if (body.saveToQuestionBank) {
      institutionalDb.questionBank.unshift({
        id: newQuizQuestion.questionBankId,
        type: newQuizQuestion.questionType as any,
        questionText: newQuizQuestion.questionSnapshot.questionText,
        questionData: newQuizQuestion.questionSnapshot.questionData,
        subjectId: Number(body.subjectId) || 1,
        classId: Number(body.classId) || 4,
        difficulty: body.difficulty || "medium",
        explanation: newQuizQuestion.questionSnapshot.explanation,
        createdBy: 1,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      question: newQuizQuestion,
      message: "Question added to quiz",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to add question" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params;
    const body = await req.json();
    const { questions = [] } = body;

    const quiz = institutionalDb.quizzes.find((q) => q.id === quizId);
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }

    // Remove existing questions for this quiz
    institutionalDb.quizQuestions = institutionalDb.quizQuestions.filter(
      (qq) => qq.quizId !== quizId
    );

    // Insert updated questions
    const createdQuestions: QuizQuestion[] = [];
    questions.forEach((q: any, idx: number) => {
      const qType = q.questionType || q.type || "mcq_single";
      const questionText = q.questionText || q.question || `প্রশ্ন ${idx + 1}`;
      const optionsList = Array.isArray(q.options)
        ? q.options
        : q.questionData?.options || ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"];
      const correctIndex = typeof q.correctAnswer === "number"
        ? q.correctAnswer
        : typeof q.correctIndex === "number"
        ? q.correctIndex
        : q.questionData?.correctIndex ?? 0;
      const correctAnswer = typeof q.correctAnswer === "boolean"
        ? q.correctAnswer
        : q.questionData?.correctAnswer;
      const correctIndices = Array.isArray(q.correctIndices)
        ? q.correctIndices
        : q.questionData?.correctIndices;
      const pairs = Array.isArray(q.pairs)
        ? q.pairs
        : q.questionData?.pairs;
      const items = Array.isArray(q.items)
        ? q.items
        : q.questionData?.items;
      const acceptedAnswers = Array.isArray(q.acceptedAnswers)
        ? q.acceptedAnswers
        : q.questionData?.acceptedAnswers;
      const expectedAnswerKeyword = q.expectedAnswerKeyword || q.questionData?.expectedAnswerKeyword;
      const caseSensitive = q.caseSensitive ?? q.questionData?.caseSensitive;
      const explanation = q.explanation || q.questionData?.explanation || "";
      const marks = Number(q.marks) || Number(quiz.defaultMarks) || 2;
      const timeLimit = Number(q.timeLimit) || Number(quiz.defaultQuestionTime) || 30;

      const fullQuestionData = {
        options: optionsList,
        correctIndex,
        correctAnswer,
        correctIndices,
        pairs,
        items,
        acceptedAnswers,
        expectedAnswerKeyword,
        caseSensitive,
        explanation,
        marks,
        timeLimit,
        ...(q.questionData || {})
      };

      const newQQ: QuizQuestion = {
        id: q.id && String(q.id).startsWith("qq-") ? String(q.id) : `qq-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        quizId,
        questionBankId: q.questionBankId || "",
        questionType: qType,
        questionSnapshot: {
          questionText,
          type: qType,
          options: optionsList,
          correctIndex,
          correctAnswer,
          correctIndices,
          pairs,
          items,
          acceptedAnswers,
          expectedAnswerKeyword,
          caseSensitive,
          explanation,
          questionData: fullQuestionData
        },
        orderIndex: idx,
        marks,
        timeLimit,
        createdAt: q.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      institutionalDb.quizQuestions.push(newQQ);
      createdQuestions.push(newQQ);
    });

    quiz.updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      questions: createdQuestions,
      message: "Quiz questions updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update questions" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params;
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json(
        { success: false, message: "questionId is required" },
        { status: 400 }
      );
    }

    const index = institutionalDb.quizQuestions.findIndex(
      (qq) => qq.quizId === quizId && qq.id === questionId
    );

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Question not found in quiz" },
        { status: 404 }
      );
    }

    institutionalDb.quizQuestions.splice(index, 1);

    // Re-index remaining questions
    const remaining = institutionalDb.quizQuestions
      .filter((qq) => qq.quizId === quizId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    remaining.forEach((qq, idx) => {
      qq.orderIndex = idx;
    });

    return NextResponse.json({
      success: true,
      message: "Question removed from quiz",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete question" },
      { status: 500 }
    );
  }
}
