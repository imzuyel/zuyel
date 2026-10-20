import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, QuestionBankQuestion } from "@/lib/database";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const question = institutionalDb.questionBank.find((q) => q.id === id);

    if (!question) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      question,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch question" },
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
    const index = institutionalDb.questionBank.findIndex((q) => q.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const updated = {
      ...institutionalDb.questionBank[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    institutionalDb.questionBank[index] = updated;

    return NextResponse.json({
      success: true,
      question: updated,
      message: "Question updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update question" },
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
    const index = institutionalDb.questionBank.findIndex((q) => q.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }

    institutionalDb.questionBank.splice(index, 1);

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete question" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = institutionalDb.questionBank.find((q) => q.id === id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }

    const duplicated: QuestionBankQuestion = {
      ...existing,
      id: `qb-${Date.now()}`,
      questionText: `${existing.questionText} (Copy)`,
      questionData: JSON.parse(JSON.stringify(existing.questionData)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    institutionalDb.questionBank.unshift(duplicated);

    return NextResponse.json({
      success: true,
      question: duplicated,
      message: "Question duplicated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to duplicate question" },
      { status: 500 }
    );
  }
}
