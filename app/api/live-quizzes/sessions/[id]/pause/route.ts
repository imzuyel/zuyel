import { NextRequest, NextResponse } from "next/server";
import { pauseLiveSession } from "@/lib/liveSessionStore";
import { invalidateSessionCache } from "@/lib/sessionCache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Consume optional JSON or sendBeacon text body safely
    await req.text().catch(() => "");

    const session = await pauseLiveSession(id);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "লাইভ কুইজ সেশনটি পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    invalidateSessionCache(id);

    return NextResponse.json({
      success: true,
      status: session.status,
      currentSlideIndex: session.currentSlideIndex,
      totalSlides: session.slides?.length || 0,
      playerCount: Object.keys(session.players || {}).length,
      message: "কুইজ সেশনটি বিরতি দিয়ে স্থায়ীভাবে সেভ করা হয়েছে।",
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "সেশন বিরতি করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
