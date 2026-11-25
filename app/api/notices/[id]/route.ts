import { NextRequest } from "next/server";
import { institutionalDb, Notice } from "@/lib/database";
import { requireAdmin } from "@/lib/serverAuthGuard";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import {
  getHybridNotices,
  upsertHybridNotice,
  deleteHybridNotice,
} from "@/lib/hybridStorageEngine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hybridList = getHybridNotices();
    const instList = institutionalDb.notices || [];

    const notice =
      hybridList.find((n) => String(n.id) === String(id)) ||
      instList.find((n) => String(n.id) === String(id));

    if (!notice) {
      return apiError("নোটিশ পাওয়া যায়নি (Notice not found)", { status: 404 });
    }

    const relatedNotices = hybridList
      .filter((n) => String(n.id) !== String(id))
      .slice(0, 3);

    return apiSuccess(notice, {
      extraKeys: {
        notice,
        relatedNotices,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "নোটিশ লোড করতে সমস্যা হয়েছে" });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req, "notices:update");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const categoryMap: Record<string, string> = {
      academic: "একাডেমিক",
      exam: "পরীক্ষা সংক্রান্ত",
      urgent: "জরুরি বিজ্ঞপ্তি",
      holiday: "ছুটি ও দিবস",
      admission: "ভর্তি সংক্রান্ত",
      administrative: "প্রশাসনিক",
    };

    const idx = institutionalDb.notices.findIndex((n) => String(n.id) === String(id));
    const baseNotice =
      idx >= 0
        ? institutionalDb.notices[idx]
        : getHybridNotices().find((n) => String(n.id) === String(id)) || {};

    const updated: Notice = {
      ...baseNotice,
      ...body,
      id: Number(id) || id,
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
      extraKeys: { notice: saved },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "নোটিশ আপডেট করতে সমস্যা হয়েছে" });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req, "notices:delete");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { id } = await params;
    institutionalDb.notices = institutionalDb.notices.filter(
      (n) => String(n.id) !== String(id)
    );
    deleteHybridNotice(id);

    return apiSuccess(
      { deletedId: id },
      { message: "নোটিশ সফলভাবে মুছে ফেলা হয়েছে।" }
    );
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "নোটিশ মুছে ফেলতে সমস্যা হয়েছে" });
  }
}
