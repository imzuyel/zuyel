import { NextRequest, NextResponse } from "next/server";
import {
  getLabsList,
  saveLabRecord,
  deleteLabRecord,
  checkLabUsage,
} from "@/lib/masterDataEngine";
import { requireAdmin } from "@/lib/serverAuthGuard";

/**
 * GET /api/academic/labs
 * Returns all institutional labs and workshops.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkUsageId = searchParams.get("check_usage");

    if (checkUsageId) {
      const usage = await checkLabUsage(Number(checkUsageId));
      return NextResponse.json({ success: true, usage });
    }

    const labs = await getLabsList();
    return NextResponse.json({
      success: true,
      labs: labs || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/academic/labs
 * Creates a new Lab / Workshop manually entered by an administrator.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req, "settings:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const { name, nameBangla, code, tradeId, roomNumber, capacity, status, description } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: "ল্যাবের নাম ও কোড বাধ্যতামূলক।" },
        { status: 400 }
      );
    }

    const result = await saveLabRecord({
      name,
      nameBangla: nameBangla || name,
      code: String(code).trim().toUpperCase(),
      tradeId: tradeId ? Number(tradeId) : null,
      roomNumber: roomNumber || "",
      capacity: Number(capacity) || 40,
      status: status || "Active",
      description: description || "",
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `"${result.lab.nameBangla}" ল্যাব সফলভাবে সংরক্ষিত হয়েছে।`,
      lab: result.lab,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/academic/labs
 * Updates an existing Lab / Workshop record.
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = requireAdmin(req, "settings:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const { id, name, nameBangla, code, tradeId, roomNumber, capacity, status, description } = body;

    if (!id && !code) {
      return NextResponse.json({ success: false, error: "ল্যাব আইডি বা কোড প্রদান করুন।" }, { status: 400 });
    }

    const result = await saveLabRecord({
      id: id ? Number(id) : undefined,
      name,
      nameBangla,
      code: code ? String(code).trim().toUpperCase() : undefined,
      tradeId: tradeId !== undefined ? (tradeId ? Number(tradeId) : null) : undefined,
      roomNumber,
      capacity: capacity ? Number(capacity) : undefined,
      status,
      description,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "ল্যাব তথ্য সফলভাবে হালনাগাদ করা হয়েছে।",
      lab: result.lab,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/academic/labs?id=...
 * Safely deletes a lab if unreferenced by equipment.
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = requireAdmin(req, "settings:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const force = searchParams.get("force") === "true";

    if (!id) {
      return NextResponse.json({ success: false, error: "মুছে ফেলার জন্য ল্যাব আইডি প্রদান করুন।" }, { status: 400 });
    }

    const result = await deleteLabRecord(id, { force });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          referenced: result.referenced,
          error: result.error || "ল্যাব ডিলিট করা সম্ভব হয়নি।",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ল্যাব সফলভাবে মুছে ফেলা হয়েছে।",
      deletedLab: result.deletedLab,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
