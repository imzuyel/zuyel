import { NextResponse } from "next/server";
import { institutionalDb, ExamRoutineItem } from "@/lib/database";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      items: institutionalDb.examRoutines,
      total: institutionalDb.examRoutines.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newItem: ExamRoutineItem = {
      id: Date.now(),
      examName: body.examName || "অর্ধবার্ষিক মূল্যায়ন ২০২৬",
      date: body.date,
      day: body.day,
      time: body.time || "10:00 AM - 01:00 PM",
      classLevel: body.classLevel,
      tradeName: body.tradeName || "All Trades",
      subjectCode: body.subjectCode,
      subjectName: body.subjectName,
      roomNo: body.roomNo || "Room 101, 102",
    };

    institutionalDb.examRoutines.push(newItem);

    return NextResponse.json({
      success: true,
      item: newItem,
      message: "পরীক্ষার সময়সূচি সফলভাবে সংরক্ষণ করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
