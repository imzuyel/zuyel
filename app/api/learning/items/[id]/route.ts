import { NextRequest, NextResponse } from "next/server";
import { chapterLearningStore } from "@/lib/chapterLearningEngine";
import { requireTeacherOrAdmin } from "@/lib/serverAuthGuard";
import { isPrismaAvailable, safePrismaQuery } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = chapterLearningStore.getContentItemById(Number(id));
    if (!result) {
      return NextResponse.json(
        { success: false, error: "Content item not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      item: result.item,
      chapter: result.chapter,
      course: result.course,
    });
  } catch (error: any) {
    console.error("GET /api/learning/items/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch content item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireTeacherOrAdmin(req, "/api/learning/items/[id] (PUT)");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const updated = chapterLearningStore.updateContentItem(Number(id), body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Content item not found" },
        { status: 404 }
      );
    }

    // Sync update to Prisma MySQL if online (best-effort without failing offline mode)
    if (isPrismaAvailable() && !isNaN(Number(id))) {
      await safePrismaQuery(async (p) => {
        const existing = await p.chapterContentItem.findUnique({ where: { id: Number(id) } });
        if (!existing) return null;
        return await p.chapterContentItem.update({
          where: { id: Number(id) },
          data: {
            title: updated.title,
            titleBangla: updated.titleBangla,
            isPublished: updated.isPublished,
            isMandatory: updated.isMandatory,
            xpReward: updated.xpReward,
            passingScore: updated.passingScore,
            minScoreToUnlockNext: updated.minScoreToUnlockNext,
            attemptLimit: updated.attemptLimit,
            durationMinutes: updated.durationMinutes,
            contentMarkdown: updated.contentMarkdown,
            summary: updated.summary,
            keyTakeaways: Array.isArray(updated.keyTakeaways)
              ? updated.keyTakeaways.join("\n")
              : (updated.keyTakeaways || ""),
            quizQuestionsJson: updated.quizQuestions ? JSON.stringify(updated.quizQuestions) : undefined,
            timeLimitSeconds: updated.timeLimitSeconds || 300,
          },
        });
      }, null);
    }

    return NextResponse.json({
      success: true,
      message: "Content item updated successfully",
      item: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/learning/items/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update content item" },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireTeacherOrAdmin(req, "/api/learning/items/[id] (DELETE)");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { id } = await params;
    const success = chapterLearningStore.deleteContentItem(Number(id));

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Content item not found" },
        { status: 404 }
      );
    }

    if (isPrismaAvailable() && !isNaN(Number(id))) {
      await safePrismaQuery(async (p) => {
        const existing = await p.chapterContentItem.findUnique({ where: { id: Number(id) } });
        if (existing) {
          await p.chapterContentItem.delete({ where: { id: Number(id) } });
        }
        return true;
      }, null);
    }

    return NextResponse.json({
      success: true,
      message: "Content item deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/learning/items/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete content item" },
      { status: 500 }
    );
  }
}
