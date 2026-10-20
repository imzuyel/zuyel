import { NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const day = searchParams.get("day");

    // Sample class routine items if not present in database
    const defaultRoutines = [
      {
        id: 1,
        periodNo: 1,
        startTime: "09:00 AM",
        endTime: "09:40 AM",
        durationMinutes: 40,
        subjectNameBangla: "বাংলা-১",
        subjectName: "Bangla-1",
        subjectCode: "1911",
        tradeName: "সাধারণ",
        teacherName: "মোঃ রফিকুল ইসলাম",
        roomNo: "Room 101",
      },
      {
        id: 2,
        periodNo: 2,
        startTime: "09:40 AM",
        endTime: "10:20 AM",
        durationMinutes: 40,
        subjectNameBangla: "ইংরেজি-১",
        subjectName: "English-1",
        subjectCode: "1912",
        tradeName: "সাধারণ",
        teacherName: "মোসাঃ পারভীন আক্তার",
        roomNo: "Room 101",
      },
      {
        id: 3,
        periodNo: 3,
        startTime: "10:20 AM",
        endTime: "12:20 PM",
        durationMinutes: 120,
        subjectNameBangla: "ইলেকট্রিক্যাল ওয়ার্কশপ প্র্যাকটিক্যাল",
        subjectName: "Electrical Workshop Practical",
        subjectCode: "1921",
        tradeName: "General Electrical Works",
        teacherName: "ইঞ্জিঃ রাজীব হোসেন",
        roomNo: "Lab 2 (Electrical)",
      },
      {
        id: 4,
        periodNo: 4,
        startTime: "12:20 PM",
        endTime: "01:00 PM",
        durationMinutes: 40,
        subjectNameBangla: "পদার্থবিজ্ঞান-১",
        subjectName: "Physics-1",
        subjectCode: "1925",
        tradeName: "সাধারণ",
        teacherName: "মোস্তফা কামাল",
        roomNo: "Room 102",
      },
    ];

    const routines = (institutionalDb as any).routines || defaultRoutines;

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
