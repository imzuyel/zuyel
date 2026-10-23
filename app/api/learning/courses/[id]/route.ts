import { NextRequest, NextResponse } from "next/server";
import { chapterLearningStore } from "@/lib/chapterLearningEngine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const studentRoll = searchParams.get("studentRoll");

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
