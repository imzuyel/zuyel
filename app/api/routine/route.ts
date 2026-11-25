import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, RoutineItem } from "@/lib/database";
import { prisma, isPrismaAvailable, markPrismaFailure } from "@/lib/prisma";
import {
  getHybridRoutines,
  saveHybridRoutines,
  upsertHybridRoutineSlot,
  deleteHybridRoutineSlot,
} from "@/lib/hybridStorageEngine";

function isConnFailure(err: any): boolean {
  const msg = err?.message || String(err);
  const code = String(err?.code || "");
  return (
    ["P1001", "P1002", "P1008", "P1017", "P2024"].includes(code) ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("Can't reach database") ||
    msg.includes("timed out")
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const day = searchParams.get("day");
    const teacherId = searchParams.get("teacherId") ? Number(searchParams.get("teacherId")) : undefined;
    const tradeCode = searchParams.get("tradeCode");

    if (isPrismaAvailable() && prisma) {
      try {
        const where: any = {};
        if (classId && classId !== "all") where.classId = Number(classId);
        if (day) where.dayOfWeek = day;
        if (teacherId) where.teacherId = teacherId;
        if (tradeCode && tradeCode !== "all") where.tradeCode = tradeCode;

        const dbSlots = await prisma.routineSlot.findMany({
          where,
          orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
        });

        if (dbSlots && dbSlots.length > 0) {
          const mapped = dbSlots.map((s: any) => ({
            id: `rs_${s.id}`,
            dbId: s.id,
            day: s.dayOfWeek,
            periodNo: s.periodNumber,
            startTime: s.startTime,
            endTime: s.endTime,
            classId: s.classId,
            className: s.className,
            section: s.section,
            shift: s.shift,
            tradeCode: s.tradeCode,
            subjectCode: s.subjectCode,
            subjectName: s.subjectName,
            teacherId: s.teacherId,
            teacherName: s.teacherName,
            roomNo: s.roomNumber,
            isBreak: Boolean(s.isBreak),
            academicYear: s.academicYear,
          }));
          return NextResponse.json({
            success: true,
            items: mapped,
            routines: mapped,
            total: mapped.length,
            source: "mysql",
          });
        }
      } catch (dbErr) {
        if (isConnFailure(dbErr)) {
          markPrismaFailure();
        } else {
          console.error("[MySQL Routine GET Error]:", dbErr);
        }
      }
    }

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
      source: "hybrid",
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

      if (isPrismaAvailable() && prisma && body.routines.length > 0) {
        try {
          await prisma.$transaction(async (tx: any) => {
            await tx.routineSlot.deleteMany({});
            await tx.routineSlot.createMany({
              data: body.routines.map((r: any) => ({
                dayOfWeek: String(r.day || "Sunday"),
                periodNumber: Number(r.periodNo || 1),
                startTime: String(r.startTime || "08:00"),
                endTime: String(r.endTime || "08:40"),
                classId: Number(r.classId || 4),
                className: String(r.className || `Class ${r.classId || 9}`),
                section: String(r.section || "A"),
                shift: String(r.shift || "FIRST_SHIFT"),
                tradeCode: r.tradeCode || null,
                subjectCode: String(r.subjectCode || "GEN"),
                subjectName: String(r.subjectName || "General"),
                teacherId: r.teacherId ? Number(r.teacherId) : null,
                teacherName: String(r.teacherName || "TBA"),
                roomNumber: String(r.roomNo || r.roomNumber || "101"),
                isBreak: Boolean(r.isBreak),
                academicYear: String(r.academicYear || "2026"),
              })),
            });
          });
        } catch (dbErr: any) {
          if (isConnFailure(dbErr)) {
            markPrismaFailure();
          } else {
            console.error("[MySQL Routine Batch POST Error]:", dbErr);
            return NextResponse.json(
              { success: false, error: `MySQL রুটিন সংরক্ষণ ব্যর্থ: ${dbErr?.message}` },
              { status: 500 }
            );
          }
        }
      }

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

    if (isPrismaAvailable() && prisma) {
      try {
        const existing = await prisma.routineSlot.findFirst({
          where: {
            dayOfWeek: String(slotData.day),
            periodNumber: Number(slotData.periodNo),
            classId: Number(slotData.classId || 4),
            tradeCode: slotData.tradeCode || null,
          },
        });
        if (existing) {
          await prisma.routineSlot.update({
            where: { id: existing.id },
            data: {
              startTime: String(slotData.startTime || existing.startTime),
              endTime: String(slotData.endTime || existing.endTime),
              subjectCode: String(slotData.subjectCode || existing.subjectCode),
              subjectName: String(slotData.subjectName || existing.subjectName),
              teacherId: slotData.teacherId ? Number(slotData.teacherId) : null,
              teacherName: String(slotData.teacherName || existing.teacherName),
              roomNumber: String(slotData.roomNo || slotData.roomNumber || existing.roomNumber),
              isBreak: Boolean(slotData.isBreak),
            },
          });
        } else {
          await prisma.routineSlot.create({
            data: {
              dayOfWeek: String(slotData.day),
              periodNumber: Number(slotData.periodNo),
              startTime: String(slotData.startTime || "08:00"),
              endTime: String(slotData.endTime || "08:40"),
              classId: Number(slotData.classId || 4),
              className: String(slotData.className || `Class ${slotData.classId || 9}`),
              section: String(slotData.section || "A"),
              shift: String(slotData.shift || "FIRST_SHIFT"),
              tradeCode: slotData.tradeCode || null,
              subjectCode: String(slotData.subjectCode || "GEN"),
              subjectName: String(slotData.subjectName || "General"),
              teacherId: slotData.teacherId ? Number(slotData.teacherId) : null,
              teacherName: String(slotData.teacherName || "TBA"),
              roomNumber: String(slotData.roomNo || slotData.roomNumber || "101"),
              isBreak: Boolean(slotData.isBreak),
              academicYear: String(slotData.academicYear || "2026"),
            },
          });
        }
      } catch (dbErr: any) {
        if (isConnFailure(dbErr)) {
          markPrismaFailure();
        } else {
          console.error("[MySQL Routine Slot POST Error]:", dbErr);
          return NextResponse.json(
            { success: false, error: `MySQL রুটিন স্লট সংরক্ষণ ব্যর্থ: ${dbErr?.message}` },
            { status: 500 }
          );
        }
      }
    }

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

    if (isPrismaAvailable() && prisma) {
      try {
        const numericId = Number(String(id).replace(/^rs_/, ""));
        if (!Number.isNaN(numericId) && numericId > 0) {
          await prisma.routineSlot.deleteMany({ where: { id: numericId } });
        }
      } catch (dbErr) {
        if (isConnFailure(dbErr)) {
          markPrismaFailure();
        } else {
          console.error("[MySQL Routine DELETE Error]:", dbErr);
        }
      }
    }

    return NextResponse.json({
      success: deleted,
      message: deleted ? "রুটিন স্লট সফলভাবে মুছে ফেলা হয়েছে।" : "স্লট পাওয়া যায়নি।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
