import { NextRequest } from "next/server";
import { institutionalDb, Notice } from "@/lib/database";
import { requireAdmin, verifyBackendAuthorization } from "@/lib/serverAuthGuard";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import {
  getHybridNotices,
  upsertHybridNotice,
  deleteHybridNotice,
} from "@/lib/hybridStorageEngine";
import { sanitizeUserTextInput, sanitizeHtml } from "@/components/common/SafeHtmlRenderer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const hybridList = getHybridNotices();
    const instList = institutionalDb.notices || [];

    // Merge by id
    const seen = new Set<string>();
    let list: Notice[] = [];
    for (const n of [...hybridList, ...instList]) {
      if (n && n.id && !seen.has(String(n.id))) {
        seen.add(String(n.id));
        list.push(n);
      }
    }

    if (category && category !== "all") {
      list = list.filter((n) => n.category === category);
    }

    return apiSuccess(list, {
      extraKeys: {
        items: list,
        notices: list,
        total: list.length,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "নোটিশ লোড করতে ব্যর্থ হয়েছে" });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyBackendAuthorization(req, {
    requiredPermission: "send_sms",
    endpointName: "/api/notices",
  });
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    if (!body.title && !body.titleBangla) {
      return apiError("নোটিশের শিরোনাম আবশ্যক", { status: 400 });
    }

    const categoryMap: Record<string, string> = {
      academic: "একাডেমিক",
      exam: "পরীক্ষা সংক্রান্ত",
      urgent: "জরুরি বিজ্ঞপ্তি",
      holiday: "ছুটি ও দিবস",
      admission: "ভর্তি সংক্রান্ত",
      administrative: "প্রশাসনিক",
    };

    const newNotice: Notice = {
      id: body.id || Date.now(),
      title: sanitizeUserTextInput(body.title || body.titleBangla || "", 300),
      titleBangla: sanitizeUserTextInput(body.titleBangla || body.title || "", 300),
      content: sanitizeHtml(body.content || "").trim().slice(0, 10000),
      category: body.category || "academic",
      categoryBangla: categoryMap[body.category] || "একাডেমিক",
      publishedAt: body.publishedAt || new Date().toISOString().slice(0, 10),
      expiryAt: body.expiryAt,
      author: body.author || auth.identity.userName || "অধ্যক্ষের কার্যালয়",
      attachmentName: body.attachmentName,
      isUrgent: Boolean(body.isUrgent),
      status: body.status || "published",
      targetAudience: body.targetAudience || { type: "all" },
    };

    // Save to memory institutionalDb and persist to hybridStorageEngine
    institutionalDb.notices.unshift(newNotice);
    const saved = upsertHybridNotice(newNotice);

    return apiSuccess(saved, {
      message: "নোটিশ সফলভাবে প্রচার করা হয়েছে।",
      extraKeys: {
        notice: saved,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "নোটিশ তৈরি করতে সমস্যা হয়েছে" });
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req, "notices:update");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const id = Number(body.id);
    const idx = institutionalDb.notices.findIndex((n) => n.id === id);

    const categoryMap: Record<string, string> = {
      academic: "একাডেমিক",
      exam: "পরীক্ষা সংক্রান্ত",
      urgent: "জরুরি বিজ্ঞপ্তি",
      holiday: "ছুটি ও দিবস",
      admission: "ভর্তি সংক্রান্ত",
      administrative: "প্রশাসনিক",
    };

    const baseNotice = idx >= 0 ? institutionalDb.notices[idx] : (getHybridNotices().find(n => Number(n.id) === id) || {});

    const updated: Notice = {
      ...baseNotice,
      ...body,
      id,
      categoryBangla: categoryMap[body.category] || baseNotice.categoryBangla || "একাডেমিক",
      status: body.status || baseNotice.status || "published",
      targetAudience: body.targetAudience || baseNotice.targetAudience || { type: "all" },
    };

    if (idx >= 0) {
      institutionalDb.notices[idx] = updated;
    } else {
      institutionalDb.notices.unshift(updated);
    }
    const saved = upsertHybridNotice(updated);

    return apiSuccess(saved, {
      message: "নোটিশ সফলভাবে আপডেট করা হয়েছে।",
      extraKeys: {
        notice: saved,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "নোটিশ আপডেট করতে সমস্যা হয়েছে" });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req, "notices:delete");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return apiError("নোটিশ আইডি প্রদান করুন", { status: 400 });
    }

    institutionalDb.notices = institutionalDb.notices.filter((n) => String(n.id) !== String(id));
    deleteHybridNotice(id);

    return apiSuccess({ deletedId: id }, {
      message: "নোটিশ সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "নোটিশ মুছে ফেলতে সমস্যা হয়েছে" });
  }
}
