import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function GET(
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

    const questions = institutionalDb.quizQuestions
      .filter((qq) => qq.quizId === id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    return NextResponse.json({
      success: true,
      quiz,
      questions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const index = institutionalDb.quizzes.findIndex((q) => q.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const updatedQuiz = {
      ...institutionalDb.quizzes[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    institutionalDb.quizzes[index] = updatedQuiz;

    return NextResponse.json({
      success: true,
      quiz: updatedQuiz,
      message: "Quiz updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update quiz" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const index = institutionalDb.quizzes.findIndex((q) => q.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }

    institutionalDb.quizzes.splice(index, 1);
    institutionalDb.quizQuestions = institutionalDb.quizQuestions.filter(
      (qq) => qq.quizId !== id
    );

    return NextResponse.json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
