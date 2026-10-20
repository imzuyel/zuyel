import { NextRequest, NextResponse } from "next/server";
import { chapterLearningStore } from "@/lib/chapterLearningEngine";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!Array.isArray(body.itemIdsInOrder)) {
      return NextResponse.json(
        { success: false, error: "itemIdsInOrder array is required" },
        { status: 400 }
      );
    }

    const success = chapterLearningStore.reorderChapterItems(Number(id), body.itemIdsInOrder);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Chapter not found or failed to reorder" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Chapter items sequence reordered successfully",
    });
  } catch (error: any) {
    console.error("PUT /api/learning/chapters/[id]/reorder error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reorder items" },
      { status: 500 }
    );
  }
}
