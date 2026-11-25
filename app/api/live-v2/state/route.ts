import { NextRequest, NextResponse } from "next/server";
import {
  computeSafeRemainingSeconds,
  findLiveV2Session,
  hydrateLiveV2FromMySQL,
  listLiveV2Sessions,
  serializeSessionForClient,
  tickSession,
} from "@/lib/liveV2Store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await hydrateLiveV2FromMySQL();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const sessionId = searchParams.get("sessionId");
    const quizId = searchParams.get("quizId");
    const includeHistory = searchParams.get("includeHistory") === "1";
    const role = searchParams.get("role") === "host" ? "host" : "student";
    const playerId = searchParams.get("playerId");

    if (includeHistory || (quizId && !code && !sessionId)) {
      const list = listLiveV2Sessions(quizId);
      const serialized = list.map((s) => {
        tickSession(s);
        return serializeSessionForClient(s, { role: "host" });
      });
      const pausedSession =
        serialized.find((s) => s.stage === "PAUSED") || null;

      return NextResponse.json({
        ok: true,
        sessions: serialized,
        pausedSession,
        serverNow: Date.now(),
      });
    }

    const session = findLiveV2Session({ sessionId, code });
    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          errorCode: "SESSION_NOT_FOUND",
          error: "❌ সেশনটি খুঁজে পাওয়া যায়নি বা মেয়াদ শেষ হয়ে গেছে।",
        },
        { status: 404 }
      );
    }

    if (role === "host") {
      session.hostLastSeenAt = Date.now();
    } else if (playerId && session.players[playerId]) {
      session.players[playerId].lastSeenAt = Date.now();
    }

    tickSession(session);
    const now = Date.now();
    const remainingSeconds = computeSafeRemainingSeconds(session, now);

    return NextResponse.json({
      ok: true,
      session: serializeSessionForClient(session, { role, playerId }),
      remainingSeconds,
      serverNow: now,
    });
  } catch (err: any) {
    console.error("[GET /api/live-v2/state] Error:", err);
    return NextResponse.json(
      { ok: false, error: "লাইভ স্টেট লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
