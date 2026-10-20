import { NextRequest, NextResponse } from "next/server";
import { chapterLearningStore } from "@/lib/chapterLearningEngine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.title || !body.titleBangla) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const newItem = chapterLearningStore.createContentItem(Number(id), body);

    if (!newItem) {
      return NextResponse.json(
        { success: false, error: "Chapter not found for adding content item" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${body.itemType === "QUIZ" ? "Quiz" : "Blog Part"} added successfully`,
      item: newItem,
    });
  } catch (error: any) {
    console.error("POST /api/learning/chapters/[id]/items error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add content item" },
      { status: 500 }
    );
  }
}
