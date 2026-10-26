import { NextRequest, NextResponse } from "next/server";
import { chapterLearningStore } from "@/lib/chapterLearningEngine";
import { isPrismaAvailable, safePrismaQuery } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chapterIdNum = Number(id);
    const body = await req.json();

    if (!body.title || !body.titleBangla) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const newItem = chapterLearningStore.createContentItem(chapterIdNum, body);

    if (!newItem) {
      return NextResponse.json(
        { success: false, error: "Chapter not found for adding content item" },
        { status: 404 }
      );
    }

    // Persist to Prisma MySQL if available
    if (isPrismaAvailable()) {
      await safePrismaQuery(async (p) => {
        return await p.chapterContentItem.create({
          data: {
            chapterId: chapterIdNum,
            orderIndex: newItem.orderIndex,
            itemType: newItem.itemType,
            title: newItem.title,
            titleBangla: newItem.titleBangla,
            isPublished: newItem.isPublished,
            isMandatory: newItem.isMandatory,
            xpReward: newItem.xpReward,
            unlockRule: newItem.unlockRule,
            minScoreToUnlockNext: newItem.minScoreToUnlockNext,
            attemptLimit: newItem.attemptLimit,
            passingScore: newItem.passingScore,
            durationMinutes: newItem.durationMinutes,
            blogPartNumber: newItem.blogPartNumber,
            contentMarkdown: newItem.contentMarkdown,
            summary: newItem.summary,
            keyTakeaways: Array.isArray(newItem.keyTakeaways)
              ? newItem.keyTakeaways.join("\n")
              : (newItem.keyTakeaways || ""),
            readTimeMinutes: newItem.readTimeMinutes,
            quizQuestionsJson: newItem.quizQuestions
              ? JSON.stringify(newItem.quizQuestions)
              : null,
            timeLimitSeconds: newItem.timeLimitSeconds || 300,
            shuffleQuestions: newItem.shuffleQuestions ?? true,
            showCorrectAnswersAfter: newItem.showCorrectAnswersAfter ?? true,
          },
        });
      }, null);
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
