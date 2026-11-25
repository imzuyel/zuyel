import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, RoutineItem } from "@/lib/database";
import {
  getHybridRoutines,
  saveHybridRoutines,
  upsertHybridRoutineSlot,
  deleteHybridRoutineSlot,
} from "@/lib/hybridStorageEngine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const day = searchParams.get("day");
    const teacherId = searchParams.get("teacherId") ? Number(searchParams.get("teacherId")) : undefined;
    const tradeCode = searchParams.get("tradeCode");

    const routines = getHybridRoutines({
      classId: classId || undefined,
      day: day || undefined,
      teacherId,
      tradeCode: tradeCode || undefined,
    });

    return NextResponse.json({
      success: true,
      items: routines,
      routines,
      total: routines.length,
      classId,
      day,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support batch replacement/update or single slot insertion
    if (Array.isArray(body.routines)) {
      saveHybridRoutines(body.routines);
      (institutionalDb as any).routines = body.routines;

      return NextResponse.json({
        success: true,
        message: "সম্পূর্ণ মাস্টার রুটিন সফলভাবে সংরক্ষিত হয়েছে।",
        total: body.routines.length,
        routines: body.routines,
      });
    }

    const slotData = body.routine || body;
    if (!slotData.day || !slotData.periodNo) {
      return NextResponse.json(
        { success: false, error: "বার (Day) ও পিরিয়ড নম্বর আবশ্যক।" },
        { status: 400 }
      );
    }

    const savedSlot = upsertHybridRoutineSlot(slotData);

    return NextResponse.json({
      success: true,
      message: "রুটিন স্লট সফলভাবে সংরক্ষিত হয়েছে।",
      slot: savedSlot,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const savedSlot = upsertHybridRoutineSlot(body);

    return NextResponse.json({
      success: true,
      message: "রুটিন স্লট সফলভাবে হালনাগাদ করা হয়েছে।",
      slot: savedSlot,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "স্লট আইডি আবশ্যক।" }, { status: 400 });
    }

    const deleted = deleteHybridRoutineSlot(id);
    return NextResponse.json({
      success: deleted,
      message: deleted ? "রুটিন স্লট সফলভাবে মুছে ফেলা হয়েছে।" : "স্লট পাওয়া যায়নি।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
