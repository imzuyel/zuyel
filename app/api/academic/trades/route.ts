import { NextRequest, NextResponse } from "next/server";
import { prisma, isPrismaAvailable } from "@/lib/prisma";
import {
  saveTradeMasterRecord,
  deleteTradeMasterRecord,
  checkTradeUsage,
  getMasterDataSnapshot,
} from "@/lib/masterDataEngine";
import { requireAdmin } from "@/lib/serverAuthGuard";

/**
 * GET /api/academic/trades
 * Returns all vocational trades configured in the institution.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkUsageId = searchParams.get("check_usage");

    if (checkUsageId) {
      const usage = await checkTradeUsage(Number(checkUsageId));
      return NextResponse.json({ success: true, usage });
    }

    if (isPrismaAvailable()) {
      try {
        const dbTrades = await prisma.trade.findMany({
          select: {
            id: true,
            code: true,
            name: true,
            nameBangla: true,
            shortName: true,
            order: true,
            status: true,
          },
          orderBy: { id: "asc" },
        });

        if (dbTrades && dbTrades.length > 0) {
          return NextResponse.json({
            success: true,
            trades: dbTrades,
            source: "database",
          });
        }
      } catch (dbErr: any) {
        console.warn("[Academic Trades API] DB query failed, falling back to engine store:", dbErr.message);
      }
    }

    const snapshot = await getMasterDataSnapshot();
    const safeTrades = (snapshot.trades || []).map((t: any) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      nameBangla: t.nameBangla,
      shortName: t.shortName || t.name,
      description: t.description || "",
      intakeCapacity: t.intakeCapacity || 50,
      totalLabs: t.totalLabs || 1,
      status: t.status || "Active",
    }));

    return NextResponse.json({
      success: true,
      trades: safeTrades,
      source: "engine_store",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/academic/trades
 * Creates a new Trade manually entered by an authorized admin.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req, "settings:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const { code, name, nameBangla, shortName, description, intakeCapacity, totalLabs, status } = body;

    if (!code || !nameBangla) {
      return NextResponse.json(
        { success: false, error: "ট্রেডের কোড ও বাংলা নাম আবশ্যক।" },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim().toUpperCase();

    // Check unique code
    if (isPrismaAvailable()) {
      try {
        const existingTrade = await prisma.trade.findUnique({
          where: { code: cleanCode },
        });
        if (existingTrade) {
          return NextResponse.json(
            { success: false, error: `"${cleanCode}" কোডের ট্রেড পূর্বেই তৈরি রয়েছে। কোড অনন্য (Unique) হতে হবে।` },
            { status: 400 }
          );
        }
      } catch {
        // safe fallback
      }
    }

    const result = await saveTradeMasterRecord({
      code: cleanCode,
      name: name || cleanCode,
      nameBangla,
      shortName: shortName || nameBangla,
      description: description || "",
      intakeCapacity: Number(intakeCapacity) || 50,
      totalLabs: Number(totalLabs) || 2,
      status: status || "Active",
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `"${result.trade.nameBangla}" কারিগরি ট্রেড সফলভাবে সংরক্ষিত হয়েছে।`,
      trade: result.trade,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/academic/trades
 * Updates an existing Trade record.
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = requireAdmin(req, "settings:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const { id, code, name, nameBangla, shortName, description, intakeCapacity, totalLabs, status } = body;

    if (!id && !code) {
      return NextResponse.json({ success: false, error: "ট্রেড আইডি বা কোড আবশ্যক।" }, { status: 400 });
    }

    const result = await saveTradeMasterRecord({
      id: id ? Number(id) : undefined,
      code: code ? String(code).trim().toUpperCase() : undefined,
      name,
      nameBangla,
      shortName,
      description,
      intakeCapacity: intakeCapacity ? Number(intakeCapacity) : undefined,
      totalLabs: totalLabs ? Number(totalLabs) : undefined,
      status,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "কারিগরি ট্রেড সফলভাবে হালনাগাদ করা হয়েছে।",
      trade: result.trade,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/academic/trades?id=...
 * Safely deletes a trade if no students, faculty, or mappings reference it.
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
      return NextResponse.json({ success: false, error: "মুছে ফেলার জন্য ট্রেড আইডি প্রদান করুন।" }, { status: 400 });
    }

    const result = await deleteTradeMasterRecord(id, { force });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          referenced: result.referenced,
          error: result.error || "ট্রেড ডিলিট করা সম্ভব হয়নি।",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "কারিগরি ট্রেড সফলভাবে মুছে ফেলা হয়েছে।",
      deletedTrade: result.deletedTrade,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
