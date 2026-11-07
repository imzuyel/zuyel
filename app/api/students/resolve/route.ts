import { NextRequest, NextResponse } from "next/server";
import {
  getResolutionStatistics,
  autoResolveAndMergeAll,
  manualAssignEntryToStudent,
  resolveStudentIdentity,
} from "@/lib/studentEntityResolver";
import { getStorageMode } from "@/lib/hybridStorageEngine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryRoll = searchParams.get("roll");
    const queryName = searchParams.get("name");
    const queryClass = searchParams.get("className");
    const queryTrade = searchParams.get("trade");

    // If query parameters are provided, perform single identity resolution
    if (queryRoll || queryName) {
      const singleResolution = resolveStudentIdentity({
        roll: queryRoll || undefined,
        name: queryName || undefined,
        className: queryClass || undefined,
        trade: queryTrade || undefined,
      });

      return NextResponse.json({
        success: true,
        resolution: singleResolution,
      });
    }

    // Otherwise return aggregate resolution statistics
    const stats = await getResolutionStatistics();
    const mode = await getStorageMode();

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        storageMode: mode,
      },
    });
  } catch (err: any) {
    console.error("[API/students/resolve] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to fetch student resolution data",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "AUTO_RESOLVE";

    if (action === "AUTO_RESOLVE") {
      const result = await autoResolveAndMergeAll();
      return NextResponse.json({
        success: true,
        result,
      });
    }

    if (action === "MANUAL_ASSIGN") {
      const { entryId, targetStudentId } = body;
      if (!entryId || !targetStudentId) {
        return NextResponse.json(
          { success: false, error: "entryId and targetStudentId are required" },
          { status: 400 }
        );
      }

      const assigned = manualAssignEntryToStudent(entryId, targetStudentId);
      return NextResponse.json({
        success: assigned,
        message: assigned
          ? "সফলভাবে আন-ম্যাপড এন্ট্রি নির্বাচিত শিক্ষার্থীর সাথে যুক্ত করা হয়েছে।"
          : "শিক্ষার্থী পাওয়া যায়নি বা অ্যাসাইনমেন্ট ব্যর্থ হয়েছে।",
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[API/students/resolve] Mutation Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to process student resolution action",
      },
      { status: 500 }
    );
  }
}

