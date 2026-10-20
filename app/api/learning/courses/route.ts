import { NextRequest, NextResponse } from "next/server";
import { chapterLearningStore } from "@/lib/chapterLearningEngine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const tradeCode = searchParams.get("tradeCode");
    const tradeId = searchParams.get("tradeId");
    const search = searchParams.get("search");
    const studentRoll = searchParams.get("studentRoll");
    const isPublishedParam = searchParams.get("isPublished");

    const courses = chapterLearningStore.getAllCourses({
      classId: classId ? Number(classId) : undefined,
      tradeCode: tradeCode || undefined,
      tradeId: tradeId ? Number(tradeId) : undefined,
      search: search || undefined,
      isPublished: isPublishedParam !== null ? isPublishedParam === "true" : undefined,
    });

    // If studentRoll is supplied, enrich each course with progress summary
    if (studentRoll) {
      const enrichedCourses = courses.map(c => 
        chapterLearningStore.evaluateStudentCourseProgress(c, studentRoll)
      );
      return NextResponse.json({
        success: true,
        count: enrichedCourses.length,
        courses: enrichedCourses,
      });
    }

    return NextResponse.json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error: any) {
    console.error("GET /api/learning/courses error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.titleBangla) {
      return NextResponse.json(
        { success: false, error: "Course title (English and Bangla) is required" },
        { status: 400 }
      );
    }

    const newCourse = chapterLearningStore.createCourse(body);

    return NextResponse.json({
      success: true,
      message: "Course created successfully",
      course: newCourse,
    });
  } catch (error: any) {
    console.error("POST /api/learning/courses error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create course" },
      { status: 500 }
    );
  }
}
