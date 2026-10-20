import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

// In-memory or database persistent teacher assignments store
let teacherAssignmentsStore: Array<{
  id: number;
  academicYear: string;
  teacherId: number;
  classNumeric: number;
  section: string;
  tradeId?: number;
  subjectCode: string;
  assignmentType: string; // "Primary" | "Subject Teacher" | "Lab/Practical"
}> = [
  { id: 1, academicYear: "2026", teacherId: 1, classNumeric: 9, section: "A", tradeId: 101, subjectCode: "COMP-9", assignmentType: "Primary" },
  { id: 2, academicYear: "2026", teacherId: 2, classNumeric: 10, section: "A", tradeId: 102, subjectCode: "ELEC-10", assignmentType: "Subject Teacher" },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get("academicYear") || "2026";
    const teacherId = searchParams.get("teacherId");
    const classNumeric = searchParams.get("classNumeric");

    let list = teacherAssignmentsStore.filter((a) => a.academicYear === academicYear);

    if (teacherId) {
      const tId = Number(teacherId);
      list = list.filter((a) => a.teacherId === tId);
    }

    if (classNumeric) {
      const cNum = Number(classNumeric);
      list = list.filter((a) => a.classNumeric === cNum);
    }

    return NextResponse.json({
      success: true,
      assignments: list,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { academicYear, teacherId, classNumeric, section, tradeId, subjectCode, assignmentType } = body;

    if (!academicYear || !teacherId || !classNumeric || !subjectCode) {
      return NextResponse.json({
        success: false,
        error: "Academic Year, Teacher, Class, and Subject are required for assignment.",
      }, { status: 400 });
    }

    // Check if assignment already exists
    const duplicate = teacherAssignmentsStore.find(
      (a) =>
        a.academicYear === String(academicYear) &&
        a.teacherId === Number(teacherId) &&
        a.classNumeric === Number(classNumeric) &&
        a.section === (section || "A") &&
        a.subjectCode === subjectCode
    );

    if (duplicate) {
      return NextResponse.json({
        success: false,
        error: "এই শিক্ষককে ইতিমধ্যে এই শ্রেণি, শাখা ও বিষয়ের জন্য দায়িত্ব দেওয়া হয়েছে।",
      }, { status: 400 });
    }

    const newAssignment = {
      id: Date.now(),
      academicYear: String(academicYear),
      teacherId: Number(teacherId),
      classNumeric: Number(classNumeric),
      section: section || "A",
      tradeId: tradeId ? Number(tradeId) : undefined,
      subjectCode: String(subjectCode),
      assignmentType: assignmentType || "Subject Teacher",
    };

    teacherAssignmentsStore.unshift(newAssignment);

    return NextResponse.json({
      success: true,
      message: "শিক্ষকের একাডেমিক বিষয় ও শ্রেণি বণ্টন সফলভাবে সংরক্ষিত হয়েছে।",
      assignment: newAssignment,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Assignment ID is required." }, { status: 400 });

    teacherAssignmentsStore = teacherAssignmentsStore.filter((a) => a.id !== Number(id));

    return NextResponse.json({
      success: true,
      message: "শিক্ষকের অ্যাসাইনমেন্ট সফলভাবে বাতিল করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
