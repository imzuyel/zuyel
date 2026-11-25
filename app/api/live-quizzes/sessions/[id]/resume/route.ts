import { NextRequest, NextResponse } from "next/server";
import { resumeLiveSession } from "@/lib/liveSessionStore";
import { invalidateSessionCache } from "@/lib/sessionCache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const slideOverride =
      typeof body?.slideIndex === "number" && Number.isFinite(body.slideIndex)
        ? body.slideIndex
        : undefined;

    const session = await resumeLiveSession(id, slideOverride);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "পুনরায় চালু করার জন্য সেশনটি পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    invalidateSessionCache(id);

    return NextResponse.json({
      success: true,
      status: session.status,
      stage: session.stage,
      currentSlideIndex: session.currentSlideIndex,
      totalSlides: session.slides?.length || 0,
      playerCount: Object.keys(session.players || {}).length,
      message: `আগের জায়গা (প্রশ্ন ${session.currentSlideIndex + 1}) থেকে সেশন পুনরায় চালু হয়েছে!`,
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "সেশন পুনরায় চালু করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
