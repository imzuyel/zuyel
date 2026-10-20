import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params;
    const body = await req.json();
    const { questionIds } = body; // array of question IDs in new order

    if (!Array.isArray(questionIds)) {
      return NextResponse.json(
        { success: false, message: "questionIds array is required" },
        { status: 400 }
      );
    }

    questionIds.forEach((qId, index) => {
      const q = institutionalDb.quizQuestions.find(
        (qq) => qq.quizId === quizId && qq.id === qId
      );
      if (q) {
        q.orderIndex = index;
        q.updatedAt = new Date().toISOString();
      }
    });

    return NextResponse.json({
      success: true,
      message: "Questions reordered successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to reorder questions" },
      { status: 500 }
    );
  }
}
