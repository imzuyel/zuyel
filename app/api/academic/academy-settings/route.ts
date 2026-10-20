import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import {
  DEFAULT_ACADEMY_CLASS_TRADE_MAPPINGS,
  normalizeClassId,
} from "@/lib/academySettingsStore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classParam = searchParams.get("class");

    const mappings = institutionalDb.getAcademyClassTradeMappings() || DEFAULT_ACADEMY_CLASS_TRADE_MAPPINGS;

    if (classParam && classParam !== "all") {
      const canonical = normalizeClassId(classParam);
      const matched = mappings.find(
        (m) =>
          m.id === canonical ||
          String(m.databaseClassId) === classParam ||
          String(m.numericValue) === classParam
      );
      if (matched) {
        return NextResponse.json({
          success: true,
          mapping: matched,
          availableTrades: matched.availableTrades,
          hasTrade: matched.hasTrade,
        });
      }
    }

    return NextResponse.json({
      success: true,
      mappings,
      totalClasses: mappings.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching academy settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load academy settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { classId, updates } = body;

    if (!classId || !updates) {
      return NextResponse.json(
        { success: false, error: "classId and updates are required" },
        { status: 400 }
      );
    }

    const updated = institutionalDb.updateAcademyClassTradeMapping(classId, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Class mapping ${classId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Academy class-trade mapping successfully updated",
      mapping: updated,
    });
  } catch (error: any) {
    console.error("Error updating academy settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update academy settings" },
      { status: 500 }
    );
  }
}
