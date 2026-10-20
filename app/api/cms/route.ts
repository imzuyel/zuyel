import { NextRequest } from "next/server";
import { institutionalDb } from "@/lib/database";
import { requireAdmin } from "@/lib/serverAuthGuard";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function GET() {
  try {
    const config = institutionalDb.cmsConfig || {
      heroBanner: {
        title: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
        subtitle: "কারিগরি ও বৃত্তিমূলক শিক্ষার নির্ভরযোগ্য প্রতিষ্ঠান",
        slides: [],
      },
      principal: {
        name: "মো: রফিকুল ইসলাম",
        designation: "অধ্যক্ষ",
        message: "দক্ষ মানবসম্পদ গঠনে আমরা অঙ্গীকারবদ্ধ।",
      },
      sectionsVisibility: {
        noticeBoard: true,
        trades: true,
        events: true,
        gallery: true,
        downloads: true,
      },
      footer: {
        address: "পূর্ব জালাসী, পঞ্চগড়",
        phone: "০৫৬৮-৬১৩১১",
        email: "ptsc_panch@yahoo.com",
      },
    };

    return apiSuccess(config, {
      extraKeys: { config },
      message: "ওয়েবসাইট সিএমএস কনফিগারেশন সফলভাবে লোড হয়েছে",
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "সিএমএস কনফিগারেশন লোড করতে ব্যর্থ হয়েছে" });
  }
}

export async function PUT(req: NextRequest) {
  // Guard check: Require Administrator permission
  const auth = requireAdmin(req, "cms:update");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return apiError("অবৈধ তথ্য ফরম্যাট (Invalid payload)", { status: 400 });
    }

    // Deep merge updates safely
    institutionalDb.cmsConfig = {
      ...institutionalDb.cmsConfig,
      ...body,
      heroBanner: {
        ...institutionalDb.cmsConfig?.heroBanner,
        ...(body.heroBanner || {}),
      },
      principal: {
        ...institutionalDb.cmsConfig?.principal,
        ...(body.principal || {}),
      },
      sectionsVisibility: {
        ...institutionalDb.cmsConfig?.sectionsVisibility,
        ...(body.sectionsVisibility || {}),
      },
      footer: {
        ...institutionalDb.cmsConfig?.footer,
        ...(body.footer || {}),
      },
    };

    return apiSuccess(institutionalDb.cmsConfig, {
      message: "ওয়েবসাইট সিএমএস কনফিগারেশন সফলভাবে আপডেট করা হয়েছে।",
      extraKeys: {
        config: institutionalDb.cmsConfig,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "সিএমএস কনফিগারেশন আপডেট করতে সমস্যা হয়েছে" });
  }
}
