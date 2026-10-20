import { NextRequest, NextResponse } from "next/server";
import { chapterLearningStore } from "@/lib/chapterLearningEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.courseId) {
      return NextResponse.json(
        { success: false, error: "courseId is required" },
        { status: 400 }
      );
    }

    if (!body.title || !body.titleBangla) {
      return NextResponse.json(
        { success: false, error: "Chapter title (English & Bangla) is required" },
        { status: 400 }
      );
    }

    const chapter = chapterLearningStore.createChapter(Number(body.courseId), body);

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: "Course not found for chapter creation" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Chapter created successfully",
      chapter,
    });
  } catch (error: any) {
    console.error("POST /api/learning/chapters error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create chapter" },
      { status: 500 }
    );
  }
}
