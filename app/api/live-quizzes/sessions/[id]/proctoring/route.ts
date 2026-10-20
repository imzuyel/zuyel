import { NextRequest, NextResponse } from "next/server";
import { ProctoringService, PROCTORING_CONFIG } from "@/lib/proctoringService";
import { institutionalDb } from "@/lib/database";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { playerId, playerName, violationType, details } = body;

    const userAgent = req.headers.get("user-agent") || "unknown";
    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (!playerId) {
      return NextResponse.json(
        { success: false, message: "Player ID is required." },
        { status: 400 }
      );
    }

    const session = institutionalDb.liveSessions.find((s) => s.id === id);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found." },
        { status: 404 }
      );
    }

    const result = ProctoringService.recordViolation(
      id,
      playerId,
      playerName || "Student",
      violationType || "TAB_SWITCH",
      details,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      strikes: result.strikes,
      maxStrikes: result.maxStrikes,
      isDisqualified: result.isDisqualified,
      message: result.isDisqualified
        ? "সর্বোচ্চ ৩টি সতর্কবার্তা অতিক্রম করায় পরীক্ষা অটো-সাবমিট ও লক করা হয়েছে।"
        : `সতর্কতা ${result.strikes}/${result.maxStrikes}: ট্যাব পরিবর্তন বা উইন্ডো ত্যাগ করা নিষিদ্ধ!`,
    });
  } catch (error: any) {
    console.error("[PROCTORING API ERROR]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to process proctoring event" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");

    if (playerId) {
      const strikes = ProctoringService.getStrikes(id, playerId);
      return NextResponse.json({
        success: true,
        strikes,
        maxStrikes: PROCTORING_CONFIG.MAX_STRIKES,
        isDisqualified: strikes >= PROCTORING_CONFIG.MAX_STRIKES,
      });
    }

    // List all proctoring logs for session
    const logs = institutionalDb.liveQuizAuditLogs.filter(
      (l) => l.sessionId === id && l.message.includes("[PROCTORING ALERT]")
    );

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch proctoring status" },
      { status: 500 }
    );
  }
}
