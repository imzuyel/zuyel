import { NextRequest, NextResponse } from "next/server";
import { chapterLearningStore } from "@/lib/chapterLearningEngine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const studentRoll = body.studentRoll || "guest";
    const studentName = body.studentName;
    const timeSpentSeconds = body.timeSpentSeconds || 60;

    const result = chapterLearningStore.completeBlogPart(
      Number(id),
      studentRoll,
      studentName,
      timeSpentSeconds
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to complete blog part",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Blog part completed and next sequential step unlocked!",
      progress: result.progress,
      xpAwarded: result.xpAwarded,
    });
  } catch (error: any) {
    console.error("POST /api/learning/items/[id]/complete-blog error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error completing blog part" },
      { status: 500 }
    );
  }
}
