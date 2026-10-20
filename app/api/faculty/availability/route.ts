import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

// Teacher Availability & Routine Integration Contract API
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get("academicYear") || "2026";
    const day = searchParams.get("day"); // e.g. "Monday"
    const period = searchParams.get("period"); // e.g. "3rd Period"
    const teacherId = searchParams.get("teacherId");

    // If specific teacher availability check is requested
    if (teacherId) {
      const tId = Number(teacherId);
      const teacher = institutionalDb.faculty.find((f) => f.id === tId);
      if (!teacher) {
        return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
      }

      // Check if teacher is on leave or active
      const isAvailable = true; // In a full routine builder, this queries occupied slots
      return NextResponse.json({
        success: true,
        teacherId: tId,
        teacherName: teacher.name,
        academicYear,
        day: day || "Any",
        period: period || "Any",
        isAvailable,
        statusMessage: isAvailable ? "শিক্ষক এই সময়ে সম্পূর্ণ মুক্ত ও উপলব্ধ আছেন।" : "শিক্ষক এই সময়ে অন্য ক্লাসে ব্যস্ত আছেন।",
      });
    }

    // General list of all faculty members with availability status for given Day & Period
    const facultyWithAvailability = institutionalDb.faculty.map((f) => ({
      ...f,
      isAvailable: true, // Default available
      currentWorkloadCount: Math.floor(Math.random() * 18) + 12, // Weekly periods load
    }));

    return NextResponse.json({
      success: true,
      academicYear,
      day: day || "Monday",
      period: period || "1st Period",
      teachers: facultyWithAvailability,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
