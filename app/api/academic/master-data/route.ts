import { NextRequest } from "next/server";
import {
  getMasterDataSnapshot,
  saveAcademicYearRecord,
  saveAcademicProgramRecord,
  saveClassMasterRecord,
  saveTradeMasterRecord,
  saveAcademicMappingRecord,
  toggleAcademicMappingStatus,
  saveInstitutionSettings,
  validateAcademicMapping,
  seedDefaultMasterData,
  deleteAcademicMappingRecord,
  checkMappingUsage,
} from "@/lib/masterDataEngine";
import { requireAdmin } from "@/lib/serverAuthGuard";
import { apiSuccess, apiError } from "@/lib/apiResponse";

/**
 * GET /api/academic/master-data
 * Returns comprehensive snapshot of Global Master Data & Central Academic Mappings
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year") || undefined;
    const checkUsageId = searchParams.get("check_usage");

    if (checkUsageId) {
      const usage = await checkMappingUsage(checkUsageId);
      return apiSuccess(usage);
    }

    const snapshot = await getMasterDataSnapshot(year);

    return apiSuccess(snapshot, {
      message: "গ্লোবাল মাস্টার ডাটা স্ন্যাপশট সফলভাবে লোড হয়েছে।",
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "মাস্টার ডাটা লোড করতে সমস্যা হয়েছে" });
  }
}

/**
 * POST /api/academic/master-data
 * Dispatches creation and updates for master entities with RBAC and validation
 */
export async function POST(req: NextRequest) {
  try {
    // 1. RBAC Guard: Requires Administrator privileges
    const auth = requireAdmin(req, "settings:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return apiError("অবৈধ রিকোয়েস্ট পেলোড (Invalid payload)", { status: 400 });
    }

    const { action, payload } = body;

    switch (action) {
      case "save_year": {
        const result = await saveAcademicYearRecord(payload || {});
        if (!result.success) {
          return apiError(result.error || "শিক্ষাবর্ষ সংরক্ষণ ব্যর্থ হয়েছে।", { status: 400 });
        }
        return apiSuccess(result.year, { message: "শিক্ষাবর্ষ সফলভাবে সংরক্ষিত হয়েছে।" });
      }

      case "save_program": {
        const result = await saveAcademicProgramRecord(payload || {});
        if (!result.success) {
          return apiError(result.error || "প্রোগ্রাম সংরক্ষণ ব্যর্থ হয়েছে।", { status: 400 });
        }
        return apiSuccess(result.program, { message: "একাডেমিক প্রোগ্রাম সফলভাবে সংরক্ষিত হয়েছে।" });
      }

      case "save_class": {
        const result = await saveClassMasterRecord(payload || {});
        if (!result.success) {
          return apiError(result.error || "শ্রেণি সংরক্ষণ ব্যর্থ হয়েছে।", { status: 400 });
        }
        return apiSuccess(result.classRecord, { message: "শ্রেণি মাস্টার সফলভাবে সংরক্ষিত হয়েছে।" });
      }

      case "save_trade": {
        const result = await saveTradeMasterRecord(payload || {});
        if (!result.success) {
          return apiError(result.error || "কারিগরি ট্রেড সংরক্ষণ ব্যর্থ হয়েছে।", { status: 400 });
        }
        return apiSuccess(result.trade, { message: "কারিগরি ট্রেড মাস্টার সফলভাবে সংরক্ষিত হয়েছে।" });
      }

      case "save_mapping": {
        const result = await saveAcademicMappingRecord(payload || {});
        if (!result.success) {
          return apiError(result.errors?.join(" ") || "ম্যাপিং ব্যর্থ হয়েছে।", {
            status: 400,
            extraKeys: { validationErrors: result.errors },
          });
        }
        return apiSuccess(result.mapping, { message: "একাডেমিক ম্যাপিং সফলভাবে সংরক্ষিত হয়েছে।" });
      }

      case "delete_mapping": {
        const { mappingId, force } = payload || {};
        if (!mappingId) {
          return apiError("ম্যাপিং আইডি আবশ্যক।", { status: 400 });
        }
        const deleteRes = await deleteAcademicMappingRecord(mappingId, { force: Boolean(force) });
        if (!deleteRes.success) {
          return apiError(deleteRes.error || "ম্যাপিং ডিলিট করা যায়নি।", {
            status: 400,
            extraKeys: {
              referenced: deleteRes.referenced,
              studentCount: deleteRes.studentCount,
              attendanceCount: deleteRes.attendanceCount,
            },
          });
        }
        return apiSuccess(deleteRes.deletedMapping, {
          message: "একাডেমিক ম্যাপিং সফলভাবে মুছে ফেলা হয়েছে (Permanently deleted)।",
        });
      }

      case "check_mapping_usage": {
        const { mappingId } = payload || {};
        if (!mappingId) {
          return apiError("ম্যাপিং আইডি আবশ্যক।", { status: 400 });
        }
        const usage = await checkMappingUsage(mappingId);
        return apiSuccess(usage);
      }

      case "toggle_mapping": {
        const { mappingId, newStatus } = payload || {};
        if (!mappingId) {
          return apiError("ম্যাপিং আইডি আবশ্যক।", { status: 400 });
        }
        const result = await toggleAcademicMappingStatus(mappingId, newStatus);
        if (!result.success) {
          return apiError(result.error || "ম্যাপিং স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।", { status: 404 });
        }
        return apiSuccess(result.mapping, { message: "ম্যাপিং স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে।" });
      }

      case "save_institution": {
        const updated = await saveInstitutionSettings(payload || {});
        return apiSuccess(updated, { message: "প্রতিষ্ঠান তথ্য সফলভাবে সংরক্ষিত হয়েছে।" });
      }

      case "seed_defaults": {
        const result = await seedDefaultMasterData({ forceReset: Boolean(payload?.forceReset) });
        return apiSuccess(result.summary, { message: result.message });
      }

      default:
        return apiError(`অজানা অ্যাকশন: ${action}`, { status: 400 });
    }
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "মাস্টার ডাটা অপারেশন সম্পন্ন করা যায়নি" });
  }
}
