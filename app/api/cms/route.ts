import { NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { verifyBackendAuthorization } from "@/lib/serverAuthGuard";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      config: institutionalDb.cmsConfig,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = verifyBackendAuthorization(req, {
    endpointName: "/api/cms",
  });
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    
    // Deep merge or replace
    institutionalDb.cmsConfig = {
      ...institutionalDb.cmsConfig,
      ...body,
      heroBanner: {
        ...institutionalDb.cmsConfig.heroBanner,
        ...(body.heroBanner || {}),
      },
      principal: {
        ...institutionalDb.cmsConfig.principal,
        ...(body.principal || {}),
      },
      sectionsVisibility: {
        ...institutionalDb.cmsConfig.sectionsVisibility,
        ...(body.sectionsVisibility || {}),
      },
      footer: {
        ...institutionalDb.cmsConfig.footer,
        ...(body.footer || {}),
      },
    };

    return NextResponse.json({
      success: true,
      config: institutionalDb.cmsConfig,
      message: "ওয়েবসাইট সিএমএস কনফিগারেশন সফলভাবে আপডেট করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
