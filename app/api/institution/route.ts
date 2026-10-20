import { NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      institution: institutionalDb.institution,
      trades: institutionalDb.trades,
      classes: institutionalDb.classes,
      stats: {
        totalStudents: institutionalDb.students.length,
        totalFaculty: institutionalDb.faculty.filter((f) => f.type === "faculty").length,
        totalStaff: institutionalDb.faculty.filter((f) => f.type === "staff").length,
        totalTrades: institutionalDb.trades.length,
        totalLabs: institutionalDb.institution.labs,
        totalWorkshops: institutionalDb.institution.workshops,
        totalBuildings: institutionalDb.institution.buildings,
        passRate: "98.5%",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    institutionalDb.institution = {
      ...institutionalDb.institution,
      ...body,
    };
    return NextResponse.json({
      success: true,
      institution: institutionalDb.institution,
      message: "প্রতিষ্ঠান পরিচিতি তথ্য সফলভাবে হালনাগাদ করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
