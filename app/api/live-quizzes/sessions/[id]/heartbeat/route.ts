import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { PresenceService, SecurityService } from "@/lib/reconnectService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();
    const { playerId, role, connectionId } = body;

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // Rate limit heartbeats to prevent DoS (normal rate is every 2.5s)
    if (SecurityService.isRateLimited(`hb-${ipAddress}-${playerId || "host"}`, 40, 60000)) {
      return NextResponse.json(
        { success: false, message: "Too many heartbeats" },
        { status: 429 }
      );
    }

    // Process timeouts of all players globally on any heartbeat triggers (avoids need for background intervals)
    PresenceService.processPresenceTimeouts();

    let success = false;
    if (role === "host") {
      success = PresenceService.updateHostHeartbeat(sessionId, connectionId);
    } else if (playerId) {
      success = PresenceService.updateHeartbeat(sessionId, playerId, connectionId);
    }

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Session or player not found" },
        { status: 404 }
      );
    }

    // Get live counts
    const participants = institutionalDb.liveParticipants.filter(
      p => p.sessionId === sessionId
    );
    const onlineCount = participants.filter(p => p.connectionStatus === "online" && p.status === "JOINED").length;
    const reconnectingCount = participants.filter(p => p.connectionStatus === "disconnected" && p.status === "JOINED").length;
    const disconnectedCount = participants.filter(p => p.connectionStatus === "left" || p.status === "LEFT").length;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      counts: {
        online: onlineCount,
        reconnecting: reconnectingCount,
        disconnected: disconnectedCount
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process heartbeat" },
      { status: 500 }
    );
  }
}
