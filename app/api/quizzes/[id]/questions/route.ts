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

const CONTENT_INTERACTIVE_TYPES = new Set([
  "TEXT_SLIDE",
  "IMAGE_COMPARE",
  "OPEN_ENDED",
  "WORD_CLOUD",
  "LIVE_QA",
]);

const isGradedType = (t: string) => {
  const norm = (t || "").toUpperCase().replace(/^MCQ_SINGLE$/, "MCQ");
  return !CONTENT_INTERACTIVE_TYPES.has(norm);
};

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

      const qType = (qbQuestion.type || "MCQ").toUpperCase().replace(/^MCQ_SINGLE$/, "MCQ");
      const graded = isGradedType(qType);

      const newQuizQuestion: QuizQuestion = {
        id: `qq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        quizId,
        questionBankId: qbQuestion.id,
        questionType: qType,
        questionSnapshot: {
          questionText: qbQuestion.questionText,
          questionData: JSON.parse(JSON.stringify(qbQuestion.questionData || {})),
          explanation: qbQuestion.explanation || "",
        },
        orderIndex: existingCount,
        marks: graded ? (Number(body.marks) || 100) : 0,
        timeLimit: graded ? (Number(body.timeLimit) || 30) : 0,
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

    // Creating new inline question/slide for quiz
    const existingCount = institutionalDb.quizQuestions.filter(
      (qq) => qq.quizId === quizId
    ).length;

    const rawType = body.questionType || body.type || "MCQ";
    const qType = rawType.toUpperCase().replace(/^MCQ_SINGLE$/, "MCQ");
    const graded = isGradedType(qType);

    const imageLeftUrl = body.imageLeftUrl || body.leftImage || body.questionData?.imageLeftUrl;
    const imageRightUrl = body.imageRightUrl || body.rightImage || body.questionData?.imageRightUrl;
    const bulletPoints = Array.isArray(body.bulletPoints) ? body.bulletPoints : body.questionData?.bulletPoints;
    const maxWordsPerStudent = Number(body.maxWordsPerStudent) || body.questionData?.maxWordsPerStudent;

    const marks = graded ? (Number(body.marks) || 100) : 0;
    const timeLimit = graded ? (Number(body.timeLimit) || 30) : 0;

    const pairs = body.pairs || body.matchingPairs || body.questionData?.pairs || body.questionData?.matchingPairs;
    const items = body.items || body.reorderItems || body.reorderSequence || body.questionData?.items || body.questionData?.reorderItems;
    const sentenceWithBlank = body.sentenceWithBlank || body.questionData?.sentenceWithBlank || (qType === "FILL_BLANKS" ? (body.questionText || body.title) : undefined);
    const blankAnswer = body.blankAnswer || body.questionData?.blankAnswer;
    const acceptedAnswers = body.acceptedAnswers || (blankAnswer ? [blankAnswer] : body.questionData?.acceptedAnswers);

    const fullQuestionData = {
      options: body.options || body.questionData?.options || (graded && qType === "MCQ" ? ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"] : []),
      correctIndex: body.correctIndex ?? body.correctAnswer ?? 0,
      correctAnswer: body.correctAnswer ?? 0,
      pairs,
      matchingPairs: pairs,
      items,
      reorderItems: items,
      sentenceWithBlank,
      blankAnswer,
      acceptedAnswers,
      imageLeftUrl,
      imageRightUrl,
      bulletPoints,
      maxWordsPerStudent,
      marks,
      timeLimit,
      explanation: body.explanation || "",
      metadata: {
        imageLeftUrl,
        imageRightUrl,
        bulletPoints,
        maxWordsPerStudent,
        ...(body.metadata || {}),
      },
      ...(body.questionData || {}),
    };

    const newQuizQuestion: QuizQuestion = {
      id: `qq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      quizId,
      questionBankId: body.saveToQuestionBank ? `qb-${Date.now()}` : "",
      questionType: qType,
      questionSnapshot: {
        questionText: body.questionText || body.title || "Untitled Slide",
        type: qType,
        questionType: qType,
        options: fullQuestionData.options,
        pairs,
        matchingPairs: pairs,
        items,
        reorderItems: items,
        sentenceWithBlank,
        blankAnswer,
        acceptedAnswers,
        correctIndex: fullQuestionData.correctIndex,
        correctAnswer: fullQuestionData.correctAnswer,
        questionData: fullQuestionData,
        explanation: body.explanation || "",
        imageLeftUrl,
        imageRightUrl,
        bulletPoints,
        maxWordsPerStudent,
      },
      orderIndex: existingCount,
      marks,
      timeLimit,
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
      const rawType = q.questionType || q.type || "MCQ";
      const qType = rawType.toUpperCase().replace(/^MCQ_SINGLE$/, "MCQ");
      const graded = isGradedType(qType);

      const questionText = q.questionText || q.question || q.title || `স্লাইড ${idx + 1}`;
      const optionsList = Array.isArray(q.options)
        ? q.options
        : q.questionData?.options || (graded && qType === "MCQ" ? ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"] : []);
      const correctIndex = typeof q.correctAnswer === "number"
        ? q.correctAnswer
        : typeof q.correctIndex === "number"
        ? q.correctIndex
        : q.questionData?.correctIndex ?? 0;
      const correctAnswer = typeof q.correctAnswer === "boolean"
        ? q.correctAnswer
        : q.questionData?.correctAnswer ?? (typeof q.correctAnswer !== "undefined" ? q.correctAnswer : correctIndex);
      const correctIndices = Array.isArray(q.correctIndices)
        ? q.correctIndices
        : q.questionData?.correctIndices;
      const pairs = Array.isArray(q.pairs)
        ? q.pairs
        : q.matchingPairs || q.questionData?.pairs || q.questionData?.matchingPairs;
      const items = Array.isArray(q.items)
        ? q.items
        : q.reorderItems || q.reorderSequence || q.questionData?.items || q.questionData?.reorderItems;
      const sentenceWithBlank = q.sentenceWithBlank || q.questionData?.sentenceWithBlank || (qType === "FILL_BLANKS" ? (questionText || q.title) : undefined);
      const blankAnswer = q.blankAnswer || q.questionData?.blankAnswer || (q.acceptedAnswers && q.acceptedAnswers[0]);
      const acceptedAnswers = Array.isArray(q.acceptedAnswers)
        ? q.acceptedAnswers
        : blankAnswer
        ? [blankAnswer]
        : q.questionData?.acceptedAnswers;
      const expectedAnswerKeyword = q.expectedAnswerKeyword || q.questionData?.expectedAnswerKeyword;
      const caseSensitive = q.caseSensitive ?? q.questionData?.caseSensitive;
      const explanation = q.explanation || q.questionData?.explanation || "";

      const imageLeftUrl = q.imageLeftUrl || q.leftImage || q.questionData?.imageLeftUrl || q.questionData?.leftImage;
      const imageRightUrl = q.imageRightUrl || q.rightImage || q.questionData?.imageRightUrl || q.questionData?.rightImage;
      const bulletPoints = Array.isArray(q.bulletPoints) ? q.bulletPoints : q.questionData?.bulletPoints;
      const maxWordsPerStudent = Number(q.maxWordsPerStudent) || q.questionData?.maxWordsPerStudent;

      // Strict Timer & Marks Enforcement: Content/Interactive MUST be 0
      const marks = graded ? (Number(q.marks) || Number(q.points) || Number(quiz.defaultMarks) || 100) : 0;
      const timeLimit = graded ? (Number(q.timeLimit) || Number(quiz.defaultQuestionTime) || 30) : 0;

      const fullQuestionData = {
        options: optionsList,
        correctIndex,
        correctAnswer,
        correctIndices,
        pairs,
        matchingPairs: pairs,
        items,
        reorderItems: items,
        sentenceWithBlank,
        blankAnswer,
        acceptedAnswers,
        expectedAnswerKeyword,
        caseSensitive,
        explanation,
        marks,
        timeLimit,
        imageLeftUrl,
        imageRightUrl,
        bulletPoints,
        maxWordsPerStudent,
        metadata: {
          imageLeftUrl,
          imageRightUrl,
          bulletPoints,
          maxWordsPerStudent,
          ...(q.metadata || {}),
        },
        ...(q.questionData || {}),
      };

      const newQQ: QuizQuestion = {
        id: q.id && String(q.id).startsWith("qq-") ? String(q.id) : `qq-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        quizId,
        questionBankId: q.questionBankId || "",
        questionType: qType,
        questionSnapshot: {
          questionText,
          type: qType,
          questionType: qType,
          options: optionsList,
          correctIndex,
          correctAnswer,
          correctIndices,
          pairs,
          matchingPairs: pairs,
          items,
          reorderItems: items,
          sentenceWithBlank,
          blankAnswer,
          acceptedAnswers,
          expectedAnswerKeyword,
          caseSensitive,
          explanation,
          imageLeftUrl,
          imageRightUrl,

          bulletPoints,
          maxWordsPerStudent,
          questionData: fullQuestionData,
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
