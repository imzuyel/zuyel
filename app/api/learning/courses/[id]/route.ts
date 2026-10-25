import { NextRequest, NextResponse } from "next/server";
import { chapterLearningStore } from "@/lib/chapterLearningEngine";
import { requireTeacherOrAdmin } from "@/lib/serverAuthGuard";
import { prisma, isPrismaAvailable, safePrismaQuery } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    let studentRoll = searchParams.get("studentRoll");

    // Also support reading from student session cookie if not provided in URL
    if (!studentRoll) {
      const studentCookie = req.cookies.get("ptsc_student_session")?.value;
      if (studentCookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(studentCookie));
          if (parsed?.rollNumber) studentRoll = parsed.rollNumber;
        } catch {}
      }
    }

    // 1. Prisma Query: Fetch course, chapters, items, and student-filtered progress
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

      const prismaCourse = await safePrismaQuery(async (p) => {
        return await p.course.findFirst({
          where: {
            OR: [
              { id: !isNaN(Number(id)) ? Number(id) : -1 },
              { code: String(id) },
            ],
          },
          include: {
            chapters: {
              where: { isPublished: true },
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
            },
          },
        });
      }, null);

      if (prismaCourse && prismaCourse.chapters && prismaCourse.chapters.length > 0) {
        let totalCourseItems = 0;
        let completedCourseItems = 0;
        let totalCourseEarnedStars = 0;

        const enrichedChapters = prismaCourse.chapters.map((chapter: any, chIdx: number) => {
          const totalBlocksInChapter = chapter.items?.length || 0;
          totalCourseItems += totalBlocksInChapter;

          let chapterEarnedStars = 0;
          const completedBlocks = (chapter.items || []).filter((item: any) => {
            const prog = item.studentProgress?.[0];
            const isCompleted = prog && (prog.isPassed || prog.status === "COMPLETED");
            if (isCompleted) {
              const stars = prog.stars || 1;
              chapterEarnedStars += stars;
              totalCourseEarnedStars += stars;
            }
            return isCompleted;
          }).length;
          completedCourseItems += completedBlocks;

          const progressPercentage = totalBlocksInChapter > 0
            ? Math.round((completedBlocks / totalBlocksInChapter) * 100)
            : 0;

          const isCompleted = totalBlocksInChapter > 0 && completedBlocks >= totalBlocksInChapter;

          return {
            ...chapter,
            chapterNumber: chapter.chapterNumber || chIdx + 1,
            totalItemsCount: totalBlocksInChapter,
            completedItemsCount: completedBlocks,
            progressPercentage,
            isCompleted,
            totalEarnedStars: chapterEarnedStars,
            maxPossibleStars: totalBlocksInChapter * 5,
            items: (chapter.items || []).map((it: any) => ({
              ...it,
              progress: it.studentProgress?.[0] || null,
            })),
          };
        });

        const courseProgressPercentage = totalCourseItems > 0
          ? Math.round((completedCourseItems / totalCourseItems) * 100)
          : 0;

        return NextResponse.json({
          success: true,
          course: {
            ...prismaCourse,
            chapters: enrichedChapters,
            totalCourseItems,
            completedCourseItems,
            courseProgressPercentage,
            totalEarnedStars: totalCourseEarnedStars,
            maxPossibleStars: totalCourseItems * 5,
            isCompleted: totalCourseItems > 0 && completedCourseItems >= totalCourseItems,
          },
        });
      }
    }

    // 2. Resilient fallback via chapterLearningStore
    const course = chapterLearningStore.getCourseById(id);

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
        course: enriched,
      });
    }

    return NextResponse.json({
      success: true,
      course,
    });
  } catch (error: any) {
    console.error("GET /api/learning/courses/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch course details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireTeacherOrAdmin(req, "/api/learning/courses/[id] (PUT)");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const updated = chapterLearningStore.updateCourse(Number(id), body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Course updated successfully",
      course: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/learning/courses/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update course" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireTeacherOrAdmin(req, "/api/learning/courses/[id] (DELETE)");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { id } = await params;
    const success = chapterLearningStore.deleteCourse(Number(id));

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/learning/courses/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
