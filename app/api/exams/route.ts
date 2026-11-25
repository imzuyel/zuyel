import { NextResponse } from "next/server";
import { institutionalDb, InstitutionalExam } from "@/lib/database";
import { getHybridExams, upsertHybridExam } from "@/lib/hybridStorageEngine";

export async function GET() {
  try {
    const hybridExams = getHybridExams();
    const dbExams = institutionalDb.exams || [];
    const map = new Map<any, any>();

    dbExams.forEach((e) => map.set(e.id, e));
    hybridExams.forEach((e: any) => {
      const existing = map.get(e.id);
      map.set(e.id, { ...(existing || {}), ...e });
    });

    const unified = Array.from(map.values());

    return NextResponse.json({
      success: true,
      exams: unified,
      total: unified.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = (body.name || "").trim();
    const nameBangla = (body.nameBangla || name).trim();
    const academicYear = Number(body.academicYear || 2026);
    const term = body.term || "Half-Yearly";
    const status = body.status || "Draft";
    const startDate = body.startDate || new Date().toISOString().slice(0, 10);
    const endDate = body.endDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

    if (!nameBangla) {
      return NextResponse.json(
        { success: false, error: "পরীক্ষার নাম (বাংলা) আবশ্যক।" },
        { status: 400 }
      );
    }

    // Check duplicate
    const existing = institutionalDb.exams.find(
      (e) => e.nameBangla.toLowerCase() === nameBangla.toLowerCase() && e.academicYear === academicYear
    );
    if (existing) {
      return NextResponse.json(
        { success: false, error: "এই নামের পরীক্ষাটি ইতিমধ্যে তালিকায় বিদ্যমান রয়েছে।" },
        { status: 400 }
      );
    }

    const newExam: InstitutionalExam = {
      id: Date.now(),
      name: name || nameBangla,
      nameBangla,
      academicYear,
      term,
      status,
      startDate,
      endDate,
    };

    institutionalDb.exams.push(newExam);
    upsertHybridExam(newExam);

    return NextResponse.json({
      success: true,
      exam: newExam,
      exams: institutionalDb.exams,
      message: `'${nameBangla}' পরীক্ষার নতুন ধরন সফলভাবে তৈরি করা হয়েছে।`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
