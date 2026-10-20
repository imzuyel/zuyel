import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import {
  DEFAULT_ACADEMY_CLASS_TRADE_MAPPINGS,
  normalizeClassId,
} from "@/lib/academySettingsStore";
import { requireAdmin } from "@/lib/serverAuthGuard";
import { apiSuccess, apiError } from "@/lib/apiResponse";

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
        return apiSuccess(matched, {
          extraKeys: {
            mapping: matched,
            availableTrades: matched.availableTrades,
            hasTrade: matched.hasTrade,
          },
        });
      }
    }

    return apiSuccess(mappings, {
      extraKeys: {
        mappings,
        totalClasses: mappings.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching academy settings:", error);
    return apiError(error, { fallbackMessage: "একাডেমিক সেটিংস লোড করতে ব্যর্থ হয়েছে" });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // 1. RBAC Guard: Admin permission required
    const auth = requireAdmin(req, "academy-settings:update");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const { classId, updates } = body;

    if (!classId || typeof classId !== "string" || !updates || typeof updates !== "object") {
      return apiError("classId এবং বৈধ updates অবজেক্ট প্রদান করা আবশ্যক", { status: 400 });
    }

    // Sanitize updates
    const safeUpdates: any = {};
    if (typeof updates.name === "string") safeUpdates.name = updates.name.trim().slice(0, 100);
    if (typeof updates.nameBangla === "string") safeUpdates.nameBangla = updates.nameBangla.trim().slice(0, 100);
    if (typeof updates.shortBangla === "string") safeUpdates.shortBangla = updates.shortBangla.trim().slice(0, 50);
    if (typeof updates.totalSeats === "number") safeUpdates.totalSeats = updates.totalSeats;
    if (typeof updates.hasTrade === "boolean") safeUpdates.hasTrade = updates.hasTrade;
    if (typeof updates.tradeRequired === "boolean") safeUpdates.tradeRequired = updates.tradeRequired;
    if (typeof updates.generalTradeNoticeBangla === "string") {
      safeUpdates.generalTradeNoticeBangla = updates.generalTradeNoticeBangla.trim().slice(0, 200);
    }
    if (Array.isArray(updates.availableTrades)) {
      safeUpdates.availableTrades = updates.availableTrades;
    }

    const updated = institutionalDb.updateAcademyClassTradeMapping(classId, safeUpdates);
    if (!updated) {
      return apiError(`শ্রেণি ম্যাপিং (${classId}) খুঁজে পাওয়া যায়নি`, { status: 404 });
    }

    return apiSuccess(updated, {
      message: "একাডেমিক শ্রেণি ও ট্রেড ম্যাপিং সফলভাবে হালনাগাদ করা হয়েছে।",
      extraKeys: {
        mapping: updated,
      },
    });
  } catch (error: any) {
    console.error("Error updating academy settings:", error);
    return apiError(error, { fallbackMessage: "একাডেমিক সেটিংস সংরক্ষণ ব্যর্থ হয়েছে" });
  }
}
