import { NextRequest, NextResponse } from "next/server";
import {
  computeSafeRemainingSeconds,
  findLiveV2Session,
  hydrateLiveV2FromMySQL,
  performHostAction,
  serializeSessionForClient,
  submitStudentAnswer,
  tickSession,
} from "@/lib/liveV2Store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await hydrateLiveV2FromMySQL();

    const rawBody = await req.text().catch(() => "");
    let body: any = {};
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        return NextResponse.json(
          { ok: false, error: "অবৈধ রিকোয়েস্ট ফরম্যাট।" },
          { status: 400 }
        );
      }
    }

    const session = findLiveV2Session({
      sessionId: body.sessionId,
      code: body.code,
    });

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          errorCode: "SESSION_NOT_FOUND",
          error: "❌ সেশনটি খুঁজে পাওয়া যায়নি।",
        },
        { status: 404 }
      );
    }

    const action = String(body.action || "").toUpperCase().trim();

    if (action === "SUBMIT_ANSWER") {
      const result = submitStudentAnswer(session, {
        playerId: String(body.playerId || ""),
        slideIndex: body.slideIndex,
        optionIndex:
          typeof body.optionIndex === "number" ? body.optionIndex : null,
        answerText: body.answerText,
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 400 });
      }

      const now = Date.now();
      return NextResponse.json({
        ...result,
        session: serializeSessionForClient(session, {
          role: "student",
          playerId: String(body.playerId || ""),
        }),
        remainingSeconds: computeSafeRemainingSeconds(session, now),
        serverNow: now,
      });
    }

    if (action === "PLAYER_READY") {
      const pid = String(body.playerId || "");
      if (pid && session.players[pid]) {
        session.players[pid].isReady = true;
        session.players[pid].lastSeenAt = Date.now();
      }
      tickSession(session);
      const now = Date.now();
      return NextResponse.json({
        ok: true,
        session: serializeSessionForClient(session, {
          role: "student",
          playerId: pid,
        }),
        remainingSeconds: computeSafeRemainingSeconds(session, now),
        serverNow: now,
      });
    }

    const validHostActions = new Set([
      "START_QUESTION",
      "SKIP_TO_QUESTION",
      "SKIP_COUNTDOWN",
      "REVEAL",
      "LEADERBOARD",
      "NEXT_QUESTION",
      "PAUSE",
      "END",
    ]);

    if (!validHostActions.has(action)) {
      return NextResponse.json(
        { ok: false, error: `অজানা অ্যাকশন: ${action}` },
        { status: 400 }
      );
    }

    performHostAction(session, action, {
      slideIndex:
        body.slideIndex !== undefined ? Number(body.slideIndex) : undefined,
    });

    const now = Date.now();
    return NextResponse.json({
      ok: true,
      session: serializeSessionForClient(session, { role: "host" }),
      remainingSeconds: computeSafeRemainingSeconds(session, now),
      serverNow: now,
    });
  } catch (err: any) {
    console.error("[POST /api/live-v2/action] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "অ্যাকশন সম্পন্ন করা যায়নি।" },
      { status: 500 }
    );
  }
}
