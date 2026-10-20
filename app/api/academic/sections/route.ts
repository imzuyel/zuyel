import { NextRequest, NextResponse } from "next/server";

// In-memory persistent sections store
let sectionsStore = [
  { id: 1, academicYear: "2026", classNumeric: 6, className: "Class 6", sectionName: "A", status: "Active" },
  { id: 2, academicYear: "2026", classNumeric: 6, className: "Class 6", sectionName: "B", status: "Active" },
  { id: 3, academicYear: "2026", classNumeric: 7, className: "Class 7", sectionName: "A", status: "Active" },
  { id: 4, academicYear: "2026", classNumeric: 7, className: "Class 7", sectionName: "B", status: "Active" },
  { id: 5, academicYear: "2026", classNumeric: 8, className: "Class 8", sectionName: "A", status: "Active" },
  { id: 6, academicYear: "2026", classNumeric: 8, className: "Class 8", sectionName: "B", status: "Active" },
  { id: 7, academicYear: "2026", classNumeric: 9, className: "Class 9", sectionName: "A", status: "Active" },
  { id: 8, academicYear: "2026", classNumeric: 9, className: "Class 9", sectionName: "B", status: "Active" },
  { id: 9, academicYear: "2026", classNumeric: 10, className: "Class 10", sectionName: "A", status: "Active" },
  { id: 10, academicYear: "2026", classNumeric: 10, className: "Class 10", sectionName: "B", status: "Active" },
  { id: 11, academicYear: "2026", classNumeric: 11, className: "Class 11", sectionName: "A", status: "Active" },
  { id: 12, academicYear: "2026", classNumeric: 11, className: "Class 11", sectionName: "B", status: "Active" },
  { id: 13, academicYear: "2026", classNumeric: 12, className: "Class 12", sectionName: "A", status: "Active" },
  { id: 14, academicYear: "2026", classNumeric: 12, className: "Class 12", sectionName: "B", status: "Active" },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get("academicYear");
    const classNumeric = searchParams.get("classNumeric");

    let result = sectionsStore;
    if (academicYear && academicYear !== "all") {
      result = result.filter((s) => s.academicYear === academicYear);
    }
    if (classNumeric && classNumeric !== "all") {
      const num = parseInt(classNumeric, 10);
      result = result.filter((s) => s.classNumeric === num);
    }

    return NextResponse.json({
      success: true,
      sections: result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { academicYear, classNumeric, className, sectionName, status } = body;

    if (!academicYear || !classNumeric || !sectionName) {
      return NextResponse.json({
        success: false,
        error: "Academic Year, Class, and Section Name are required.",
      }, { status: 400 });
    }

    const newSection = {
      id: Date.now(),
      academicYear: String(academicYear),
      classNumeric: Number(classNumeric),
      className: className || `Class ${classNumeric}`,
      sectionName: String(sectionName).toUpperCase(),
      status: status || "Active",
    };

    sectionsStore.unshift(newSection);

    return NextResponse.json({
      success: true,
      message: "Section created successfully.",
      section: newSection,
      sections: sectionsStore,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
