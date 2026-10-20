import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, DocumentTemplate } from "@/lib/database";
import { initialDocumentTemplates, DEFAULT_SIGNATORIES } from "@/lib/documentsData";
import { verifyBackendAuthorization } from "@/lib/serverAuthGuard";

export async function GET(req: NextRequest) {
  try {
    if (!institutionalDb.documentTemplates || institutionalDb.documentTemplates.length === 0) {
      institutionalDb.documentTemplates = [...initialDocumentTemplates];
    }

    return NextResponse.json({
      success: true,
      templates: institutionalDb.documentTemplates,
      total: institutionalDb.documentTemplates.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyBackendAuthorization(req, {
    requiredPermission: "issue_certificates",
    endpointName: "/api/documents/templates (POST)",
  });
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const {
      id,
      title,
      titleBangla,
      docType,
      code,
      themeId = "gov_classic",
      bodyTemplate,
      conductStatement,
      headerConfig,
      signatories,
      watermarkText,
      status = "active",
    } = body;

    if (!titleBangla || !bodyTemplate) {
      return NextResponse.json(
        { success: false, error: "টেমপ্লেটের নাম ও মূল বক্তব্যের খসড়া প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    if (!institutionalDb.documentTemplates) {
      institutionalDb.documentTemplates = [...initialDocumentTemplates];
    }

    // Check if updating existing
    if (id) {
      const idx = institutionalDb.documentTemplates.findIndex((t) => t.id === id);
      if (idx !== -1) {
        institutionalDb.documentTemplates[idx] = {
          ...institutionalDb.documentTemplates[idx],
          title: title || institutionalDb.documentTemplates[idx].title,
          titleBangla,
          docType: docType || institutionalDb.documentTemplates[idx].docType,
          code: code || institutionalDb.documentTemplates[idx].code,
          themeId: themeId || institutionalDb.documentTemplates[idx].themeId,
          bodyTemplate,
          conductStatement: conductStatement || institutionalDb.documentTemplates[idx].conductStatement,
          headerConfig: headerConfig || institutionalDb.documentTemplates[idx].headerConfig,
          signatories: signatories || institutionalDb.documentTemplates[idx].signatories,
          watermarkText: watermarkText || institutionalDb.documentTemplates[idx].watermarkText,
          status: status || institutionalDb.documentTemplates[idx].status,
          updatedAt: new Date().toISOString(),
        };

        return NextResponse.json({
          success: true,
          template: institutionalDb.documentTemplates[idx],
          message: "টেমপ্লেট সফলভাবে হালনাগাদ করা হয়েছে।",
        });
      }
    }

    // Create new custom template
    const newTemplate: DocumentTemplate = {
      id: `tpl_custom_${Date.now()}`,
      title: title || titleBangla,
      titleBangla,
      docType: docType || "custom",
      code: code ? code.toUpperCase() : "DOC",
      themeId,
      bodyTemplate,
      conductStatement: conductStatement || "অত্র বিদ্যালয়ের নথি ও রেজিস্টার বই অনুসারে তাহার পাঠ্যকালীন আচরণ সন্তোষজনক ছিল।",
      headerConfig: headerConfig || {
        showGovLogo: true,
        showBtebLogo: true,
        customHeaderBangla: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
        customSubHeader: "কারিগরি শিক্ষা অধিদপ্তর • শিক্ষা মন্ত্রণালয়",
        eiinText: "EIIN: ১৩২২৪৪ • প্রতিষ্ঠান কোড: ১৮০১৭",
      },
      signatories: signatories || DEFAULT_SIGNATORIES,
      watermarkText: watermarkText || "OFFICIAL VERIFIED",
      status: (status as any) || "active",
      isSystemDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    institutionalDb.documentTemplates.unshift(newTemplate);

    return NextResponse.json({
      success: true,
      template: newTemplate,
      message: "নতুন প্রাতিষ্ঠানিক সনদ টেমপ্লেট সফলভাবে তৈরি হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = verifyBackendAuthorization(req, {
    requiredPermission: "issue_certificates",
    endpointName: "/api/documents/templates (DELETE)",
  });
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Template ID is required" }, { status: 400 });
    }

    const idx = institutionalDb.documentTemplates.findIndex((t) => t.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    if (institutionalDb.documentTemplates[idx].isSystemDefault) {
      return NextResponse.json({ success: false, error: "সিস্টেম ডিফল্ট টেমপ্লেট মুছে ফেলা যাবে না।" }, { status: 400 });
    }

    institutionalDb.documentTemplates.splice(idx, 1);
    return NextResponse.json({ success: true, message: "টেমপ্লেট সফলভাবে মুছে ফেলা হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
