import { NextRequest } from "next/server";
import { institutionalDb, Notice } from "@/lib/database";
import { requireAdmin, verifyBackendAuthorization } from "@/lib/serverAuthGuard";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let list = [...(institutionalDb.notices || [])];
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
      id: Date.now(),
      title: (body.title || body.titleBangla).trim().slice(0, 300),
      titleBangla: (body.titleBangla || body.title).trim().slice(0, 300),
      content: (body.content || "").trim().slice(0, 10000),
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

    institutionalDb.notices.unshift(newNotice);

    return apiSuccess(newNotice, {
      message: "নোটিশ সফলভাবে প্রচার করা হয়েছে।",
      extraKeys: {
        notice: newNotice,
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
    if (idx === -1) {
      return apiError("নোটিশ পাওয়া যায়নি (Notice not found)", { status: 404 });
    }

    const categoryMap: Record<string, string> = {
      academic: "একাডেমিক",
      exam: "পরীক্ষা সংক্রান্ত",
      urgent: "জরুরি বিজ্ঞপ্তি",
      holiday: "ছুটি ও দিবস",
      admission: "ভর্তি সংক্রান্ত",
      administrative: "প্রশাসনিক",
    };

    const updated: Notice = {
      ...institutionalDb.notices[idx],
      ...body,
      categoryBangla: categoryMap[body.category] || institutionalDb.notices[idx].categoryBangla,
      status: body.status || institutionalDb.notices[idx].status,
      targetAudience: body.targetAudience || institutionalDb.notices[idx].targetAudience,
    };

    institutionalDb.notices[idx] = updated;

    return apiSuccess(updated, {
      message: "নোটিশ সফলভাবে আপডেট করা হয়েছে।",
      extraKeys: {
        notice: updated,
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

    const initialLength = institutionalDb.notices.length;
    institutionalDb.notices = institutionalDb.notices.filter((n) => n.id !== Number(id));

    if (institutionalDb.notices.length === initialLength) {
      return apiError("নোটিশ পাওয়া যায়নি", { status: 404 });
    }

    return apiSuccess({ deletedId: Number(id) }, {
      message: "নোটিশ সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "নোটিশ মুছে ফেলতে সমস্যা হয়েছে" });
  }
}
