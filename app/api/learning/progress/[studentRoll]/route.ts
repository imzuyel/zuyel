import { NextRequest, NextResponse } from "next/server";
import { chapterLearningStore } from "@/lib/chapterLearningEngine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentRoll: string }> }
) {
  try {
    const { studentRoll } = await params;

    const stats = chapterLearningStore.getStudentOverallStats(studentRoll);
    const progressList = chapterLearningStore.getStudentProgressList(studentRoll);

    return NextResponse.json({
      success: true,
      studentRoll,
      stats,
      progressList,
    });
  } catch (error: any) {
    console.error("GET /api/learning/progress/[studentRoll] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch student progress stats" },
      { status: 500 }
    );
  }
}
