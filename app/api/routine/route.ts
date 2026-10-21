import { NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { pdfMasterRoutines } from "@/lib/panchagarhTscPdfRoutineData";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const day = searchParams.get("day");

    let routines = (institutionalDb as any).routines && (institutionalDb as any).routines.length > 0
      ? (institutionalDb as any).routines
      : pdfMasterRoutines;

    if (classId && classId !== "all") {
      routines = routines.filter((r: any) => String(r.classId) === classId || r.className?.includes(`Class ${classId}`));
    }

    if (day && day !== "all") {
      routines = routines.filter((r: any) => r.day?.toLowerCase() === day.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      items: routines,
      total: routines.length,
      classId,
      day,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
