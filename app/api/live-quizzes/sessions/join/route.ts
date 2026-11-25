import { NextRequest, NextResponse } from "next/server";
import {
  getLiveSession,
  addOrUpdatePlayer,
  syncAndAutoAdvanceSession,
} from "@/lib/liveSessionStore";
import { ReconnectService, SecurityService } from "@/lib/reconnectService";
import { sanitizeUserTextInput } from "@/lib/textSanitizer";

const INVALID_CODE_MSG = "❌ ভুল রুম কোড! সঠিক ৬ ডিজিটের কোড দাও।";
const SESSION_NOT_LIVE_MSG =
  "⏸️ কুইজটি এখন লাইভ হচ্ছে না। শিক্ষক পুনরায় লাইভ শুরু করলে পরবর্তীতে যুক্ত হও।";

// GET: Strict room-code & live-status validation before student joins
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = (searchParams.get("code") || searchParams.get("pin") || "").trim();

    if (!code) {
      return NextResponse.json(
        { success: false, error: "INVALID_CODE", message: "রুম কোড (PIN) প্রদান করুন।" },
        { status: 400 }
      );
    }

    const session = getLiveSession(code);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "INVALID_CODE", message: INVALID_CODE_MSG },
        { status: 404 }
      );
    }

    // Evaluate stage/host liveness (25s timeout auto-pauses if host vanished)
    syncAndAutoAdvanceSession(session);

    if (session.status === "PAUSED" || session.status === "ENDED") {
      return NextResponse.json(
        {
          success: false,
          error: "SESSION_NOT_LIVE",
          status: session.status,
          message: SESSION_NOT_LIVE_MSG,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        code: session.code,
        title: session.title,
        className: session.className,
        trade: session.trade,
        subject: session.subject,
        status: session.status,
        stage: session.stage,
        totalSlides: session.slides.length,
        currentSlideIndex: session.currentSlideIndex,
        playerCount: Object.keys(session.players || {}).length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "সেশন যাচাইয়ে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

// POST: Strict Join or Seamless Cross-Day Reconnect
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionCode,
      displayName,
      roll,
      avatar = "🚀",
      studentId,
      playerToken,
      playerId: clientPlayerId,
    } = body;

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const cleanCode = (sessionCode || "").toString().trim();
    if (!cleanCode) {
      return NextResponse.json(
        { success: false, error: "INVALID_CODE", message: INVALID_CODE_MSG },
        { status: 400 }
      );
    }

    if (!displayName || displayName.trim() === "") {
      return NextResponse.json(
        { success: false, message: "একটি নাম লিখুন।" },
        { status: 400 }
      );
    }

    // Rate limiting check: Allow up to 300 joins/min per IP so 60 students on classroom Wi-Fi never get blocked
    if (SecurityService.isRateLimited(`join-${ipAddress}`, 300, 60000)) {
      return NextResponse.json(
        { success: false, message: "অতিরিক্ত রিকোয়েস্ট। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।" },
        { status: 429 }
      );
    }

    // 1. Validate session existence + host liveness
    const session = getLiveSession(cleanCode);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "INVALID_CODE", message: INVALID_CODE_MSG },
        { status: 404 }
      );
    }

    syncAndAutoAdvanceSession(session);

    // 2. Strict Inactive / Paused / Ended Guard (Task 3)
    if (session.status === "PAUSED" || session.status === "ENDED") {
      return NextResponse.json(
        {
          success: false,
          error: "SESSION_NOT_LIVE",
          status: session.status,
          message: SESSION_NOT_LIVE_MSG,
        },
        { status: 403 }
      );
    }

    if (session.isLocked) {
      return NextResponse.json(
        { success: false, error: "SESSION_LOCKED", message: "এই সেশনটি হোস্ট কর্তৃক লক করা রয়েছে।" },
        { status: 403 }
      );
    }

    // 3. Determine playerId — match existing returning player (for cross-day resume score preservation!)
    const sanitizedName = sanitizeUserTextInput(displayName, 50);
    const rawRoll = roll || studentId || (displayName.match(/রোল[:\s]*(\d+)/i)?.[1] ?? "—");
    const sanitizedRoll = sanitizeUserTextInput(String(rawRoll), 20);

    let effectivePlayerId =
      (clientPlayerId && session.players[clientPlayerId] ? clientPlayerId : null) ||
      (playerToken && playerToken.startsWith("p-") ? playerToken.replace("p-", "") : null);

    if (!effectivePlayerId && sanitizedRoll && sanitizedRoll !== "—") {
      const normalizedInputName = sanitizedName.trim().toLowerCase();
      const normalizedInputRoll = sanitizedRoll.trim().toLowerCase();
      const returningPlayer = Object.values(session.players || {}).find(
        (p) =>
          String(p.roll || "").trim().toLowerCase() === normalizedInputRoll &&
          p.name.trim().toLowerCase() === normalizedInputName
      );
      if (returningPlayer) {
        effectivePlayerId = returningPlayer.id;
      }
    }

    if (!effectivePlayerId) {
      effectivePlayerId =
        clientPlayerId || `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    const playerRecord = addOrUpdatePlayer(session.id, {
      id: effectivePlayerId,
      name: sanitizedName,
      roll: sanitizedRoll,
      avatar: avatar || "🚀",
    });

    const reconnectToken = ReconnectService.generateTokens(session.id, effectivePlayerId);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      code: session.code,
      playerId: effectivePlayerId,
      player: playerRecord,
      participant: playerRecord,
      message: "সফলভাবে লাইভ রুমে জয়েন হয়েছ!",
      session: {
        id: session.id,
        code: session.code,
        sessionCode: session.code,
        title: session.title,
        status: session.status,
        stage: session.stage,
        currentSlideIndex: session.currentSlideIndex,
        totalSlides: session.slides.length,
      },
      reconnectToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to join live quiz" },
      { status: 500 }
    );
  }
}
