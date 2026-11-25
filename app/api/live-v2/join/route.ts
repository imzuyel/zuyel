import { NextRequest, NextResponse } from "next/server";
import {
  findLiveV2Session,
  hydrateLiveV2FromMySQL,
  isSessionJoinable,
  joinOrReconnectPlayer,
  tickSession,
} from "@/lib/liveV2Store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await hydrateLiveV2FromMySQL();
    const { searchParams } = new URL(req.url);
    const code = String(searchParams.get("code") || "").replace(/\D/g, "").trim();

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { ok: false, errorCode: "INVALID_CODE", error: "❌ ভুল রুম কোড!" },
        { status: 404 }
      );
    }

    const session = findLiveV2Session({ code });
    if (!session) {
      return NextResponse.json(
        { ok: false, errorCode: "INVALID_CODE", error: "❌ ভুল রুম কোড!" },
        { status: 404 }
      );
    }

    tickSession(session);
    const status = isSessionJoinable(session);
    if (!status.joinable) {
      return NextResponse.json(
        {
          ok: false,
          errorCode: "SESSION_NOT_LIVE",
          error: status.reason,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      code: session.code,
      quizTitle: session.quizTitle,
      stage: session.stage,
      playerCount: Object.keys(session.players).length,
    });
  } catch (err: any) {
    console.error("[GET /api/live-v2/join] Error:", err);
    return NextResponse.json(
      { ok: false, error: "রুম যাচাই করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await hydrateLiveV2FromMySQL();
    const body = await req.json().catch(() => ({}));
    const rawCode = String(body.code || body.pin || "").replace(/\D/g, "").trim();
    const name = String(body.name || "").trim();
    const roll = String(body.roll || "").trim();
    const avatar = String(body.avatar || "🎓").trim() || "🎓";

    if (!/^\d{6}$/.test(rawCode)) {
      return NextResponse.json(
        { ok: false, errorCode: "INVALID_CODE", error: "❌ ভুল রুম কোড!" },
        { status: 404 }
      );
    }

    const session = findLiveV2Session({ code: rawCode });
    if (!session) {
      return NextResponse.json(
        { ok: false, errorCode: "INVALID_CODE", error: "❌ ভুল রুম কোড!" },
        { status: 404 }
      );
    }

    tickSession(session);
    const joinCheck = isSessionJoinable(session);
    if (!joinCheck.joinable) {
      return NextResponse.json(
        {
          ok: false,
          errorCode: "SESSION_NOT_LIVE",
          error: joinCheck.reason,
        },
        { status: 409 }
      );
    }

    if (!name || name.length < 2) {
      return NextResponse.json(
        { ok: false, error: "অনুগ্রহ করে তোমার সঠিক নাম লিখো।" },
        { status: 400 }
      );
    }

    const player = joinOrReconnectPlayer(session, {
      name,
      roll,
      avatar,
      className: body.className ? String(body.className) : undefined,
      trade: body.trade ? String(body.trade) : undefined,
      playerId: body.playerId ? String(body.playerId) : undefined,
    });

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      code: session.code,
      playerId: player.id,
      player,
    });
  } catch (err: any) {
    console.error("[POST /api/live-v2/join] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "কুইজে যুক্ত হতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
