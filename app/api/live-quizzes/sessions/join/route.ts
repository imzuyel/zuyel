import { NextRequest, NextResponse } from "next/server";
import {
  getLiveSession,
  addOrUpdatePlayer,
  syncAndAutoAdvanceSession,
} from "@/lib/liveSessionStore";
import { ReconnectService, SecurityService } from "@/lib/reconnectService";

// GET: Auto-validate room code & fetch session metadata for student join card
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code") || searchParams.get("pin") || "";

    if (!code) {
      return NextResponse.json(
        { success: false, message: "রুম কোড (PIN) প্রদান করুন।" },
        { status: 400 }
      );
    }

    const session = getLiveSession(code);
    if (!session || session.status === "ENDED") {
      return NextResponse.json(
        { success: false, message: "রুম কোডটি সঠিক নয় অথবা কুইজটি সমাপ্ত হয়েছে।" },
        { status: 404 }
      );
    }

    syncAndAutoAdvanceSession(session);

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

// POST: Join or reconnect a player to the live session
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

    const userAgent = req.headers.get("user-agent") || "unknown";
    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (!sessionCode) {
      return NextResponse.json(
        { success: false, message: "গেম পিন (Room PIN) আবশ্যক।" },
        { status: 400 }
      );
    }

    if (!displayName || displayName.trim() === "") {
      return NextResponse.json(
        { success: false, message: "একটি নাম লিখুন।" },
        { status: 400 }
      );
    }

    // Rate limiting check
    if (SecurityService.isRateLimited(`join-${ipAddress}`, 25, 60000)) {
      return NextResponse.json(
        { success: false, message: "অতিরিক্ত রিকোয়েস্ট। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।" },
        { status: 429 }
      );
    }

    const cleanCode = (sessionCode || "").toString().trim();
    const session = getLiveSession(cleanCode);

    if (!session || session.status === "ENDED") {
      return NextResponse.json(
        { success: false, message: "ভুল রুম কোড অথবা কুইজ সেশনটি সমাপ্ত হয়ে গেছে।" },
        { status: 404 }
      );
    }

    if (session.isLocked) {
      return NextResponse.json(
        { success: false, message: "এই সেশনটি হোস্ট কর্তৃক লক করা রয়েছে।" },
        { status: 403 }
      );
    }

    // Determine unique tab-scoped player ID
    const effectivePlayerId =
      clientPlayerId ||
      (playerToken && playerToken.startsWith("p-") ? playerToken.replace("p-", "") : null) ||
      `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const playerRoll = roll || studentId || (displayName.match(/রোল[:\s]*(\d+)/i)?.[1] ?? "—");

    const playerRecord = addOrUpdatePlayer(session.id, {
      id: effectivePlayerId,
      name: displayName.trim(),
      roll: playerRoll,
      avatar: avatar || "🚀",
    });

    const reconnectToken = ReconnectService.generateTokens(session.id, effectivePlayerId);

    return NextResponse.json({
      success: true,
      message: "সফলভাবে লাইভ রুমে জয়েন হয়েছ!",
      session: {
        id: session.id,
        code: session.code,
        title: session.title,
        status: session.status,
        stage: session.stage,
        totalSlides: session.slides.length,
      },
      player: playerRecord,
      participant: playerRecord,
      playerId: effectivePlayerId,
      reconnectToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to join live quiz" },
      { status: 500 }
    );
  }
}
