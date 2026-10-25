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

    // Sync student progress from Prisma DB so logged-out/returning students have persistent stars & progress
    if (studentRoll && isPrismaAvailable()) {
      const dbProgress = await safePrismaQuery(async (p) => {
        return await p.studentItemProgress.findMany({
          where: { studentRoll: String(studentRoll) },
        });
      }, []);
      if (dbProgress && dbProgress.length > 0) {
        chapterLearningStore.mergeStudentProgressFromPrisma(studentRoll, dbProgress);
      }
    }

    const result = chapterLearningStore.getChapterById(id);
    if (!result) {
      return NextResponse.json(
        { success: false, error: "Chapter not found" },
        { status: 404 }
      );
    }

    if (studentRoll) {
      const enrichedCourse = chapterLearningStore.evaluateStudentCourseProgress(result.course, studentRoll);
      const enrichedChapter = enrichedCourse.chapters.find(ch => ch.id === result.chapter.id);
      return NextResponse.json({
        success: true,
        chapter: enrichedChapter || result.chapter,
        course: {
          id: result.course.id,
          code: result.course.code,
          title: result.course.title,
          titleBangla: result.course.titleBangla,
          className: result.course.className,
          tradeName: result.course.tradeName,
          badgeGradient: result.course.badgeGradient,
        },
      });
    }

    return NextResponse.json({
      success: true,
      chapter: result.chapter,
      course: {
        id: result.course.id,
        code: result.course.code,
        title: result.course.title,
        titleBangla: result.course.titleBangla,
        className: result.course.className,
        tradeName: result.course.tradeName,
        badgeGradient: result.course.badgeGradient,
      },
    });
  } catch (error: any) {
    console.error("GET /api/learning/chapters/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch chapter" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireTeacherOrAdmin(req, "/api/learning/chapters/[id] (PUT)");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const updated = chapterLearningStore.updateChapter(Number(id), body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Chapter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Chapter updated successfully",
      chapter: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/learning/chapters/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update chapter" },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireTeacherOrAdmin(req, "/api/learning/chapters/[id] (DELETE)");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { id } = await params;
    const success = chapterLearningStore.deleteChapter(Number(id));

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Chapter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Chapter deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/learning/chapters/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete chapter" },
      { status: 500 }
    );
  }
}
