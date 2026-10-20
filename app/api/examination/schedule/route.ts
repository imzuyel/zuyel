import { NextResponse } from "next/server";
import { examinationEngine } from "@/lib/examinationEngine";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json({ success: false, error: "পরীক্ষার আইডি আবশ্যক।" }, { status: 400 });
    }

    const items = examinationEngine.getExamSchedules(Number(examId));

    return NextResponse.json({
      success: true,
      items,
      total: items.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { examId, schedule, operator = "Exam Controller" } = body;

    if (!examId || !schedule) {
      return NextResponse.json({ success: false, error: "পরীক্ষার আইডি ও সময়সূচি আবশ্যক।" }, { status: 400 });
    }

    const newItem = examinationEngine.addExamScheduleItem(Number(examId), schedule, operator);

    return NextResponse.json({
      success: true,
      item: newItem,
      message: "পরীক্ষার সময়সূচি সফলভাবে সংরক্ষিত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
