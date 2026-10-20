import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, QuestionBankQuestion } from "@/lib/database";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const classId = searchParams.get("classId");
    const tradeId = searchParams.get("tradeId");
    const difficulty = searchParams.get("difficulty");
    const type = searchParams.get("type");

    let filteredQuestions = [...institutionalDb.questionBankQuestions];

    if (subjectId) {
      filteredQuestions = filteredQuestions.filter(q => q.subjectId === Number(subjectId));
    }
    if (classId) {
      filteredQuestions = filteredQuestions.filter(q => q.classId === Number(classId));
    }
    if (tradeId) {
      filteredQuestions = filteredQuestions.filter(q => q.tradeId === Number(tradeId));
    }
    if (difficulty) {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
    }
    if (type) {
      filteredQuestions = filteredQuestions.filter(q => q.type === type);
    }

    return NextResponse.json({
      success: true,
      questions: filteredQuestions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      type, questionText, questionData, 
      subjectId, classId, tradeId, chapterId, topicId,
      difficulty, explanation, createdBy, marks, timeLimit
    } = body;

    if (!type || !questionText || !questionText.trim()) {
      return NextResponse.json(
        { success: false, message: "Type and Question Text are required" },
        { status: 400 }
      );
    }

    const effectiveSubjectId = Number(subjectId) || 1;
    const effectiveClassId = Number(classId) || 4;
    const effectiveCreatedBy = Number(createdBy) || 1;

    const newQuestion: QuestionBankQuestion = {
      id: uuidv4(),
      type,
      questionText: questionText.trim(),
      questionData: {
        ...(questionData || {}),
        marks: Number(marks) || (questionData?.marks ? Number(questionData.marks) : 2),
        timeLimit: Number(timeLimit) || (questionData?.timeLimit ? Number(questionData.timeLimit) : 30),
      },
      subjectId: effectiveSubjectId,
      classId: effectiveClassId,
      tradeId: tradeId ? Number(tradeId) : undefined,
      chapterId,
      topicId,
      difficulty: difficulty || "medium",
      explanation: explanation || "",
      createdBy: effectiveCreatedBy,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    institutionalDb.questionBankQuestions.push(newQuestion);

    return NextResponse.json({
      success: true,
      question: newQuestion,
      message: "Question added to Question Bank successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to add question" },
      { status: 500 }
    );
  }
}
