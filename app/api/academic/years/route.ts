import { NextRequest, NextResponse } from "next/server";
import { prisma, isPrismaAvailable } from "@/lib/prisma";
import {
  saveAcademicYearRecord,
  deleteAcademicYearRecord,
  checkAcademicYearUsage,
  getMasterDataSnapshot,
} from "@/lib/masterDataEngine";
import { requireAdmin } from "@/lib/serverAuthGuard";

/**
 * GET /api/academic/years
 * Returns all academic years manually configured.
 * Does not auto-seed dummy years when empty.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkUsageYear = searchParams.get("check_usage");

    if (checkUsageYear) {
      const usage = await checkAcademicYearUsage(checkUsageYear);
      return NextResponse.json({ success: true, usage });
    }

    if (isPrismaAvailable()) {
      try {
        const dbYears = await prisma.academicYear.findMany({
          select: {
            id: true,
            year: true,
            name: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
            status: true,
          },
          orderBy: { id: "desc" },
        });

        return NextResponse.json({
          success: true,
          academicYears: dbYears || [],
          source: "database",
        });
      } catch (dbErr: any) {
        console.warn("[Academic Years API] DB query failed, falling back to engine store:", dbErr.message);
      }
    }

    const snapshot = await getMasterDataSnapshot();
    const safeYears = (snapshot.academicYears || []).map((y: any) => ({
      id: y.id,
      year: y.year,
      name: y.name || `Academic Year ${y.year}`,
      startDate: y.startDate,
      endDate: y.endDate,
      isCurrent: Boolean(y.isCurrent),
      status: y.status || "Active",
    }));

    return NextResponse.json({
      success: true,
      academicYears: safeYears,
      source: "engine_store",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/academic/years
 * Creates a new Academic Year manually entered by an authorized admin.
 * Validates name, unique year label, and date range.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req, "settings:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const { name, startDate, endDate, status, isCurrent, remarks } = body;

    if (!name || String(name).trim() === "") {
      return NextResponse.json({ success: false, error: "শিক্ষাবর্ষের নাম বা লেবেল আবশ্যক।" }, { status: 400 });
    }

    const cleanName = String(name).trim();

    // Validate date range if provided
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        return NextResponse.json(
          { success: false, error: "শুরুর তারিখ অবশ্যই শেষের তারিখের পূর্ববর্তী হতে হবে।" },
          { status: 400 }
        );
      }
    }

    // Check unique label
    if (isPrismaAvailable()) {
      try {
        const existingYear = await prisma.academicYear.findUnique({
          where: { name: cleanName },
        });
        if (existingYear) {
          return NextResponse.json(
            { success: false, error: `"${cleanName}" শিক্ষাবর্ষটি পূর্বেই ডাটাবেজে তৈরি করা রয়েছে। ডুপ্লিকেট অনুমোদিত নয়।` },
            { status: 400 }
          );
        }
      } catch {
        // safe fallback
      }
    }

    const result = await saveAcademicYearRecord({
      name: cleanName,
      startDate: startDate || `${cleanName}-01-01`,
      endDate: endDate || `${cleanName}-12-31`,
      status: status || (isCurrent ? "Active" : "Draft"),
      isCurrent: Boolean(isCurrent),
      remarks: remarks || "",
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `"${cleanName}" শিক্ষাবর্ষ সফলভাবে তৈরি হয়েছে।`,
      academicYear: result.year,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/academic/years
 * Updates an existing Academic Year record.
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = requireAdmin(req, "settings:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const { id, name, startDate, endDate, status, isCurrent, remarks } = body;

    if (!id && !name) {
      return NextResponse.json({ success: false, error: "শিক্ষাবর্ষের আইডি বা নাম আবশ্যক।" }, { status: 400 });
    }

    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        return NextResponse.json(
          { success: false, error: "শুরুর তারিখ অবশ্যই শেষের তারিখের পূর্ববর্তী হতে হবে।" },
          { status: 400 }
        );
      }
    }

    const result = await saveAcademicYearRecord({
      id: id ? Number(id) : undefined,
      name: name ? String(name).trim() : undefined,
      startDate,
      endDate,
      status,
      isCurrent: isCurrent !== undefined ? Boolean(isCurrent) : undefined,
      remarks,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "শিক্ষাবর্ষ সফলভাবে হালনাগাদ করা হয়েছে।",
      academicYear: result.year,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/academic/years?id=...&name=...
 * Safely deletes an academic year.
 * Fails with clear reason if referenced by students, attendance, exams, or mappings.
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = requireAdmin(req, "settings:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const name = searchParams.get("name");
    const force = searchParams.get("force") === "true";

    const target = id || name;
    if (!target) {
      return NextResponse.json({ success: false, error: "মুছে ফেলার জন্য শিক্ষাবর্ষ আইডি বা নাম প্রদান করুন।" }, { status: 400 });
    }

    const result = await deleteAcademicYearRecord(target, { force });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          referenced: result.referenced,
          error: result.error || "শিক্ষাবর্ষ ডিলিট করা সম্ভব হয়নি।",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "শিক্ষাবর্ষ সফলভাবে মুছে ফেলা হয়েছে।",
      deletedYear: result.deletedYear,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
