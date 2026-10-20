import { NextRequest } from "next/server";
import { institutionalDb } from "@/lib/database";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noticeId = Number(id);

    const notice = (institutionalDb.notices || []).find((n) => n.id === noticeId);

    if (!notice) {
      return apiError("নোটিশ পাওয়া যায়নি (Notice not found)", { status: 404 });
    }

    // Also get up to 3 related notices in the same category or latest
    const relatedNotices = (institutionalDb.notices || [])
      .filter((n) => n.id !== noticeId)
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
