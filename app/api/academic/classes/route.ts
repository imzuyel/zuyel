import { NextRequest, NextResponse } from "next/server";
import { prisma, isPrismaAvailable } from "@/lib/prisma";
import {
  saveClassMasterRecord,
  deleteClassMasterRecord,
  checkClassUsage,
  getMasterDataSnapshot,
} from "@/lib/masterDataEngine";
import { requireAdmin } from "@/lib/serverAuthGuard";

/**
 * GET /api/academic/classes
 * Returns all classes configured in the institution.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkUsageNum = searchParams.get("check_usage");

    if (checkUsageNum) {
      const usage = await checkClassUsage(Number(checkUsageNum));
      return NextResponse.json({ success: true, usage });
    }

    if (isPrismaAvailable()) {
      try {
        const dbClasses = await prisma.academicClass.findMany({
          select: {
            id: true,
            name: true,
            nameBangla: true,
            numericValue: true,
            level: true,
            hasTrade: true,
            sections: true,
            shifts: true,
          },
          orderBy: { numericValue: "asc" },
        });

        if (dbClasses && dbClasses.length > 0) {
          return NextResponse.json({
            success: true,
            classes: dbClasses,
            source: "database",
          });
        }
      } catch (dbErr: any) {
        console.warn("[Academic Classes API] DB query failed, falling back to engine store:", dbErr.message);
      }
    }

    const snapshot = await getMasterDataSnapshot();
    const safeClasses = (snapshot.classes || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      nameBangla: c.nameBangla,
      numericValue: c.numericValue,
      level: c.level || (c.numericValue >= 9 ? "technical" : "general"),
      hasTrade: Boolean(c.hasTrade),
      sections: Array.isArray(c.defaultSections) ? c.defaultSections.join(",") : c.sections || "A,B",
      shifts: Array.isArray(c.defaultShifts) ? c.defaultShifts.join(",") : c.shifts || "FIRST_SHIFT",
      totalSeats: c.totalSeats || 80,
      status: c.status || "Active",
    }));

    return NextResponse.json({
      success: true,
      classes: safeClasses,
      source: "engine_store",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/academic/classes
 * Creates a new Academic Class manually entered by an administrator.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req, "settings:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const { name, nameBangla, numericValue, hasTrade, sections, shifts, totalSeats, displayOrder } = body;

    if (!numericValue || !nameBangla) {
      return NextResponse.json(
        { success: false, error: "শ্রেণির সংখ্যাগত মান (Numeric Value) ও বাংলা নাম আবশ্যক।" },
        { status: 400 }
      );
    }

    const numVal = Number(numericValue);

    // Validate unique numeric value
    if (isPrismaAvailable()) {
      try {
        const existingCls = await prisma.academicClass.findUnique({
          where: { numericValue: numVal },
        });
        if (existingCls) {
          return NextResponse.json(
            { success: false, error: `Class ${numVal} পূর্বেই ডাটাবেজে তৈরি রয়েছে। সংখ্যাগত মান অনন্য (Unique) হতে হবে।` },
            { status: 400 }
          );
        }
      } catch {
        // safe fallback
      }
    }

    const defaultSecs = Array.isArray(sections)
      ? sections
      : typeof sections === "string" && sections.trim() !== ""
      ? sections.split(",").map((s: string) => s.trim().toUpperCase())
      : ["A", "B"];

    const defaultShifts = Array.isArray(shifts)
      ? shifts
      : typeof shifts === "string" && shifts.trim() !== ""
      ? shifts.split(",").map((s: string) => s.trim())
      : ["FIRST_SHIFT"];

    const result = await saveClassMasterRecord({
      numericValue: numVal,
      name: name || `Class ${numVal}`,
      nameBangla,
      code: `CLS-${numVal}`,
      hasTrade: Boolean(hasTrade),
      defaultSections: defaultSecs,
      defaultShifts,
      totalSeats: Number(totalSeats) || 80,
      displayOrder: Number(displayOrder) || numVal,
      status: "Active",
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `"${result.classRecord.nameBangla}" সফলভাবে সংরক্ষিত হয়েছে।`,
      classRecord: result.classRecord,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/academic/classes
 * Updates an existing Academic Class record.
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = requireAdmin(req, "settings:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const { id, numericValue, name, nameBangla, hasTrade, sections, shifts, totalSeats, displayOrder, status } = body;

    if (!id && !numericValue) {
      return NextResponse.json({ success: false, error: "শ্রেণি আইডি বা সংখ্যাগত মান আবশ্যক।" }, { status: 400 });
    }

    const defaultSecs = Array.isArray(sections)
      ? sections
      : typeof sections === "string" && sections.trim() !== ""
      ? sections.split(",").map((s: string) => s.trim().toUpperCase())
      : undefined;

    const defaultShifts = Array.isArray(shifts)
      ? shifts
      : typeof shifts === "string" && shifts.trim() !== ""
      ? shifts.split(",").map((s: string) => s.trim())
      : undefined;

    const result = await saveClassMasterRecord({
      id: id ? Number(id) : undefined,
      numericValue: numericValue ? Number(numericValue) : undefined,
      name,
      nameBangla,
      hasTrade: hasTrade !== undefined ? Boolean(hasTrade) : undefined,
      defaultSections: defaultSecs,
      defaultShifts,
      totalSeats: totalSeats ? Number(totalSeats) : undefined,
      displayOrder: displayOrder ? Number(displayOrder) : undefined,
      status,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "শ্রেণি মাস্টার সফলভাবে হালনাগাদ করা হয়েছে।",
      classRecord: result.classRecord,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/academic/classes?id=...&numericValue=...
 * Safely deletes a class if no students, attendance, or mappings reference it.
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = requireAdmin(req, "settings:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const numericValue = searchParams.get("numericValue");
    const force = searchParams.get("force") === "true";

    const target = id || numericValue;
    if (!target) {
      return NextResponse.json({ success: false, error: "মুছে ফেলার জন্য শ্রেণি আইডি বা সংখ্যাগত মান প্রদান করুন।" }, { status: 400 });
    }

    const result = await deleteClassMasterRecord(target, { force });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          referenced: result.referenced,
          error: result.error || "শ্রেণি ডিলিট করা সম্ভব হয়নি।",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "শ্রেণি মাস্টার সফলভাবে মুছে ফেলা হয়েছে।",
      deletedClass: result.deletedClass,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
