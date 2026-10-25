import { NextRequest } from "next/server";
import {
  getMasterDataSnapshot,
  saveAcademicMappingRecord,
  toggleAcademicMappingStatus,
  validateAcademicMapping,
  deleteAcademicMappingRecord,
  checkMappingUsage,
  AcademicMappingRecord,
} from "@/lib/masterDataEngine";
import { requireAdmin } from "@/lib/serverAuthGuard";
import { apiSuccess, apiError } from "@/lib/apiResponse";

/**
 * Explicit Projection for Academic Mapping.
 * Strictly isolates sensitive backend metadata, internal database flags, and teacher configs.
 */
export function selectSafeAcademicMapping(m: any) {
  if (!m) return null;
  return {
    id: String(m.id),
    academicYear: String(m.academicYear || ""),
    programId: Number(m.programId) || 0,
    programCode: String(m.programCode || ""),
    programName: String(m.programName || ""),
    classNumeric: Number(m.classNumeric) || 0,
    className: String(m.className || ""),
    tradeId: m.tradeId !== null && m.tradeId !== undefined ? Number(m.tradeId) : null,
    tradeCode: m.tradeCode || null,
    tradeName: m.tradeName || null,
    section: String(m.section || "all"),
    shift: String(m.shift || "FIRST_SHIFT"),
    shiftNameBangla: String(m.shiftNameBangla || ""),
    capacity: Number(m.capacity) || 0,
    enrolledStudentsCount: Number(m.enrolledStudentsCount) || 0,
    status: (m.status === "Inactive" ? "Inactive" : "Active") as "Active" | "Inactive",
    createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : undefined,
    updatedAt: m.updatedAt ? new Date(m.updatedAt).toISOString() : undefined,
  };
}

/**
 * GET /api/academic/mappings
 * Filters academic mappings by year, program, class, and trade with strict explicit field selection
 * Or check usage if ?check_usage=id is provided
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkUsageId = searchParams.get("check_usage");

    if (checkUsageId) {
      const usage = await checkMappingUsage(checkUsageId);
      return apiSuccess(usage);
    }

    const year = searchParams.get("year") || "2026";
    const program = searchParams.get("program") || undefined;
    const classNum = searchParams.get("class") ? Number(searchParams.get("class")) : undefined;
    const tradeId = searchParams.get("trade") ? Number(searchParams.get("trade")) : undefined;
    const status = searchParams.get("status") || undefined;

    const snapshot = await getMasterDataSnapshot(year);
    let results = snapshot.mappings || [];

    if (program) {
      results = results.filter((m) => m.programCode === program || String(m.programId) === program);
    }
    if (classNum !== undefined && !isNaN(classNum)) {
      results = results.filter((m) => m.classNumeric === classNum);
    }
    if (tradeId !== undefined && !isNaN(tradeId)) {
      results = results.filter((m) => m.tradeId === tradeId);
    }
    if (status) {
      results = results.filter((m) => m.status.toLowerCase() === status.toLowerCase());
    }

    // Apply explicit select to prevent any internal data or sensitive configs from leaking
    const safeResults = results.map(selectSafeAcademicMapping).filter(Boolean);

    return apiSuccess(safeResults, {
      extraKeys: {
        total: safeResults.length,
        academicYear: year,
        activeCount: safeResults.filter((m: any) => m.status === "Active").length,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "একাডেমিক ম্যাপিং তালিকা লোড করা যায়নি" });
  }
}

/**
 * POST /api/academic/mappings
 * Creates or updates an academic mapping with dependent validation
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req, "settings:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return apiError("অবৈধ ম্যাপিং তথ্য ফরম্যাট", { status: 400 });
    }

    const result = await saveAcademicMappingRecord(body);
    if (!result.success) {
      return apiError(result.errors?.join(" ") || "ম্যাপিং সংরক্ষণ ব্যর্থ হয়েছে।", {
        status: 400,
        extraKeys: { validationErrors: result.errors },
      });
    }

    return apiSuccess(selectSafeAcademicMapping(result.mapping), {
      message: "একাডেমিক ম্যাপিং সফলভাবে সংরক্ষিত হয়েছে।",
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "একাডেমিক ম্যাপিং তৈরি করতে ব্যর্থ হয়েছে" });
  }
}

/**
 * PUT /api/academic/mappings
 * Updates an existing academic mapping with originalId replacement
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = requireAdmin(req, "settings:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return apiError("অবৈধ ম্যাপিং তথ্য ফরম্যাট", { status: 400 });
    }

    const result = await saveAcademicMappingRecord(body);
    if (!result.success) {
      return apiError(result.errors?.join(" ") || "ম্যাপিং সম্পাদন ব্যর্থ হয়েছে।", {
        status: 400,
        extraKeys: { validationErrors: result.errors },
      });
    }

    return apiSuccess(selectSafeAcademicMapping(result.mapping), {
      message: "একাডেমিক ম্যাপিং সফলভাবে হালনাগাদ করা হয়েছে।",
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "ম্যাপিং সম্পাদন করতে সমস্যা হয়েছে" });
  }
}

/**
 * DELETE /api/academic/mappings?id=xxx&force=true|false&action=delete|deactivate
 * Safely deletes unreferenced academic mapping, or deactivates if referenced
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
    const action = searchParams.get("action") || "delete";

    if (!id) {
      return apiError("ম্যাপিং আইডি প্রদান করা আবশ্যক", { status: 400 });
    }

    if (action === "deactivate") {
      const result = await toggleAcademicMappingStatus(id, "Inactive");
      if (!result.success) {
        return apiError(result.error || "ম্যাপিং নিষ্ক্রিয় করতে সমস্যা হয়েছে", { status: 404 });
      }
      return apiSuccess(selectSafeAcademicMapping(result.mapping), {
        message: "ম্যাপিং রেকর্ডটি সফলভাবে নিষ্ক্রিয় করা হয়েছে (হিস্টোরিক্যাল ডাটা অক্ষত রয়েছে)।",
      });
    }

    // Real deletion with dependency check
    const deleteRes = await deleteAcademicMappingRecord(id, { force });
    if (!deleteRes.success) {
      return apiError(deleteRes.error || "ম্যাপিং ডিলিট করা যায়নি", {
        status: 400,
        extraKeys: {
          referenced: deleteRes.referenced,
          studentCount: deleteRes.studentCount,
          attendanceCount: deleteRes.attendanceCount,
        },
      });
    }

    return apiSuccess(selectSafeAcademicMapping(deleteRes.deletedMapping), {
      message: "একাডেমিক ম্যাপিং সফলভাবে মুছে ফেলা হয়েছে (Permanently deleted)।",
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "ম্যাপিং ডিলিট অপারেশন ব্যর্থ হয়েছে" });
  }
}
