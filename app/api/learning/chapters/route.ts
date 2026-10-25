import { NextRequest, NextResponse } from "next/server";
import { chapterLearningStore } from "@/lib/chapterLearningEngine";
import { requireTeacherOrAdmin } from "@/lib/serverAuthGuard";
import { prisma, isPrismaAvailable, safePrismaQuery } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    let studentRoll = searchParams.get("studentRoll");

    if (!studentRoll) {
      const studentCookie = req.cookies.get("ptsc_student_session")?.value;
      if (studentCookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(studentCookie));
          if (parsed?.rollNumber) studentRoll = parsed.rollNumber;
        } catch {}
      }
    }

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "courseId parameter is required" },
        { status: 400 }
      );
    }

    // 1. Prisma ORM Query with student progress filtering
    if (isPrismaAvailable()) {
      if (studentRoll) {
        const dbProgress = await safePrismaQuery(async (p) => {
          return await p.studentItemProgress.findMany({
            where: { studentRoll: String(studentRoll) },
          });
        }, []);
        if (dbProgress && dbProgress.length > 0) {
          chapterLearningStore.mergeStudentProgressFromPrisma(studentRoll, dbProgress);
        }
      }

      const prismaChapters = await safePrismaQuery(async (p) => {
        return await p.courseChapter.findMany({
          where: {
            courseId: Number(courseId),
            isPublished: true,
          },
          orderBy: { orderIndex: "asc" },
          include: {
            items: {
              where: { isPublished: true },
              orderBy: { orderIndex: "asc" },
              include: {
                studentProgress: studentRoll
                  ? {
                      where: {
                        studentRoll: String(studentRoll),
                      },
                    }
                  : false,
              },
            },
          },
        });
      }, []);

      if (prismaChapters && prismaChapters.length > 0) {
        const chaptersWithProgress = prismaChapters.map((chapter: any, idx: number) => {
          const totalBlocksInChapter = chapter.items?.length || 0;
          const completedBlocks = (chapter.items || []).filter((item: any) => {
            const prog = item.studentProgress?.[0];
            return prog && (prog.isPassed || prog.status === "COMPLETED");
          }).length;

          const progressPercentage = totalBlocksInChapter > 0
            ? Math.round((completedBlocks / totalBlocksInChapter) * 100)
            : 0;

          const isCompleted = totalBlocksInChapter > 0 && completedBlocks >= totalBlocksInChapter;

          return {
            ...chapter,
            chapterNumber: chapter.chapterNumber || idx + 1,
            totalItemsCount: totalBlocksInChapter,
            completedItemsCount: completedBlocks,
            progressPercentage,
            isCompleted,
            items: (chapter.items || []).map((it: any) => ({
              ...it,
              progress: it.studentProgress?.[0] || null,
            })),
          };
        });

        return NextResponse.json({
          success: true,
          count: chaptersWithProgress.length,
          chapters: chaptersWithProgress,
        });
      }
    }

    // 2. Resilient fallback via chapterLearningStore
    const course = chapterLearningStore.getCourseById(courseId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    if (studentRoll) {
      const enriched = chapterLearningStore.evaluateStudentCourseProgress(course, studentRoll);
      return NextResponse.json({
        success: true,
        count: enriched.chapters.length,
        chapters: enriched.chapters,
      });
    }

    return NextResponse.json({
      success: true,
      count: course.chapters.length,
      chapters: course.chapters,
    });
  } catch (error: any) {
    console.error("GET /api/learning/chapters error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch chapters list" },
      { status: 500 }
    );
  }
}


export async function POST(req: NextRequest) {
  const auth = requireTeacherOrAdmin(req, "/api/learning/chapters (POST)");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

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
