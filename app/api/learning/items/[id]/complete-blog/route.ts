import { NextRequest, NextResponse } from "next/server";
import { chapterLearningStore } from "@/lib/chapterLearningEngine";
import { safePrismaQuery, isPrismaAvailable } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const studentRoll = body.studentRoll || "guest";
    const studentName = body.studentName;
    const timeSpentSeconds = Math.max(1, Number(body.timeSpentSeconds) || 60);

    const result = chapterLearningStore.completeBlogPart(
      id,
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

    const finalStars = Math.max(1, Math.min(5, result.stars || 1));
    const numericItemId = Number(id);

    // Direct Database Persistence to Prisma MySQL
    if (isPrismaAvailable() && !isNaN(numericItemId)) {
      await safePrismaQuery(async (p) => {
        return await p.studentItemProgress.upsert({
          where: {
            studentRoll_itemId: {
              studentRoll: String(studentRoll),
              itemId: numericItemId,
            },
          },
          update: {
            status: "COMPLETED",
            isPassed: true,
            bestScore: 100,
            lastScore: 100,
            stars: finalStars,
            completedAt: new Date(),
            timeSpentSeconds: {
              increment: timeSpentSeconds,
            },
          },
          create: {
            studentRoll: String(studentRoll),
            studentName: studentName || "Student",
            itemId: numericItemId,
            status: "COMPLETED",
            attemptsCount: 1,
            bestScore: 100,
            lastScore: 100,
            isPassed: true,
            xpEarned: result.xpAwarded || 50,
            stars: finalStars,
            timeSpentSeconds,
            completedAt: new Date(),
          },
        });
      }, null);
    }

    return NextResponse.json({
      success: true,
      message: "Blog part completed and next sequential step unlocked!",
      progress: {
        ...result.progress,
        stars: finalStars,
      },
      xpAwarded: result.xpAwarded,
      stars: finalStars,
    });
  } catch (error: any) {
    console.error("POST /api/learning/items/[id]/complete-blog error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error completing blog part" },
      { status: 500 }
    );
  }
}
