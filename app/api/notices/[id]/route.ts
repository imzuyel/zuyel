import { NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noticeId = Number(id);

    const notice = institutionalDb.notices.find((n) => n.id === noticeId);

    if (!notice) {
      return NextResponse.json(
        { success: false, error: "Notice not found" },
        { status: 404 }
      );
    }

    // Also get up to 3 related notices in the same category or latest
    const relatedNotices = institutionalDb.notices
      .filter((n) => n.id !== noticeId)
      .slice(0, 3);

    return NextResponse.json({
      success: true,
      notice,
      relatedNotices,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
