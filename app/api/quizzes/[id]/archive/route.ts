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

    quiz.status = quiz.status === "archived" ? "draft" : "archived";
    quiz.updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      quiz,
      message: `Quiz ${quiz.status === "archived" ? "archived" : "restored"} successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update quiz archive status" },
      { status: 500 }
    );
  }
}
