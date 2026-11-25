import { NextRequest, NextResponse } from "next/server";
import {
  createLiveV2Session,
  hydrateLiveV2FromMySQL,
  serializeSessionForClient,
} from "@/lib/liveV2Store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await hydrateLiveV2FromMySQL();
    const body = await req.json().catch(() => ({}));

    const resumeSessionId = body.resumeSessionId
      ? String(body.resumeSessionId)
      : undefined;

    if (!resumeSessionId && (!Array.isArray(body.slides) || body.slides.length === 0)) {
      return NextResponse.json(
        {
          ok: false,
          error: "লাইভ কুইজ শুরু করার জন্য কমপক্ষে ১টি প্রশ্ন বা স্লাইড প্রয়োজন।",
        },
        { status: 400 }
      );
    }

    const session = createLiveV2Session({
      quizId: String(body.quizId || `quiz_${Date.now()}`),
      quizTitle: String(body.quizTitle || body.title || "লাইভ কুইজ সেশন"),
      slides: Array.isArray(body.slides) ? body.slides : [],
      className: body.className ? String(body.className) : undefined,
      trade: body.trade ? String(body.trade) : undefined,
      subject: body.subject ? String(body.subject) : undefined,
      hostName: body.hostName ? String(body.hostName) : undefined,
      resumeSessionId,
    });

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      code: session.code,
      session: serializeSessionForClient(session, { role: "host" }),
    });
  } catch (err: any) {
    console.error("[POST /api/live-v2/create] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "সেশন তৈরি করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
