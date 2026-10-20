import { NextResponse } from "next/server";
import { institutionalDb, InstitutionInfo } from "@/lib/database";
import { requireAdmin } from "@/lib/serverAuthGuard";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function GET() {
  try {
    return apiSuccess(institutionalDb.institution, {
      extraKeys: {
        institution: institutionalDb.institution,
        trades: institutionalDb.trades,
        classes: institutionalDb.classes,
        stats: {
          totalStudents: institutionalDb.students.length,
          totalFaculty: institutionalDb.faculty.filter((f) => f.type === "faculty").length,
          totalStaff: institutionalDb.faculty.filter((f) => f.type === "staff").length,
          totalTrades: institutionalDb.trades.length,
          totalLabs: institutionalDb.institution.labs,
          totalWorkshops: institutionalDb.institution.workshops,
          totalBuildings: institutionalDb.institution.buildings,
          passRate: "98.5%",
        },
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "প্রতিষ্ঠান তথ্য লোড করতে সমস্যা হয়েছে" });
  }
}

export async function PUT(req: Request) {
  try {
    // 1. RBAC Guard: Require Administrator permission
    const auth = requireAdmin(req, "institution:update");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return apiError("অবৈধ তথ্য ফরম্যাট (Invalid payload)", { status: 400 });
    }

    // 2. Validate and sanitize fields
    const sanitizedUpdates: Partial<InstitutionInfo> = {};

    if (body.name && typeof body.name === "string") {
      sanitizedUpdates.name = body.name.trim().slice(0, 200);
    }
    if (body.nameBangla && typeof body.nameBangla === "string") {
      sanitizedUpdates.nameBangla = body.nameBangla.trim().slice(0, 200);
    }
    if (body.eiin !== undefined) {
      sanitizedUpdates.eiin = String(body.eiin).trim().slice(0, 20);
    }
    if (body.code !== undefined) {
      sanitizedUpdates.code = String(body.code).trim().slice(0, 20);
    }
    if (body.principalName && typeof body.principalName === "string") {
      sanitizedUpdates.principalName = body.principalName.trim().slice(0, 150);
    }
    if (body.principalMobile !== undefined) {
      sanitizedUpdates.principalMobile = String(body.principalMobile).trim().slice(0, 30);
    }
    if (body.phoneLandline !== undefined) {
      sanitizedUpdates.phoneLandline = String(body.phoneLandline).trim().slice(0, 30);
    }
    if (body.email && typeof body.email === "string") {
      sanitizedUpdates.email = body.email.trim().slice(0, 150);
    }
    if (body.website && typeof body.website === "string") {
      sanitizedUpdates.website = body.website.trim().slice(0, 200);
    }
    if (body.locationBangla && typeof body.locationBangla === "string") {
      sanitizedUpdates.locationBangla = body.locationBangla.trim().slice(0, 300);
    }
    if (body.vision && typeof body.vision === "string") {
      sanitizedUpdates.vision = body.vision.trim().slice(0, 2000);
    }
    if (body.mission && typeof body.mission === "string") {
      sanitizedUpdates.mission = body.mission.trim().slice(0, 2000);
    }
    if (body.principalMessage && typeof body.principalMessage === "string") {
      sanitizedUpdates.principalMessage = body.principalMessage.trim().slice(0, 3000);
    }

    // Numbers
    if (typeof body.established === "number") sanitizedUpdates.established = body.established;
    if (typeof body.buildings === "number") sanitizedUpdates.buildings = body.buildings;
    if (typeof body.classrooms === "number") sanitizedUpdates.classrooms = body.classrooms;
    if (typeof body.workshops === "number") sanitizedUpdates.workshops = body.workshops;
    if (typeof body.labs === "number") sanitizedUpdates.labs = body.labs;
    if (typeof body.library === "number") sanitizedUpdates.library = body.library;

    institutionalDb.institution = {
      ...institutionalDb.institution,
      ...sanitizedUpdates,
    };

    return apiSuccess(institutionalDb.institution, {
      message: "প্রতিষ্ঠান পরিচিতি তথ্য সফলভাবে হালনাগাদ করা হয়েছে।",
      extraKeys: {
        institution: institutionalDb.institution,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "প্রতিষ্ঠান তথ্য হালনাগাদ করতে ব্যর্থ হয়েছে" });
  }
}
