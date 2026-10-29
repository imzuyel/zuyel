import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { ReconnectService, SecurityService, SessionRecoveryService } from "@/lib/reconnectService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();
    const { playerId, reconnectToken, role } = body;

    const userAgent = req.headers.get("user-agent") || "unknown";
    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (SecurityService.isRateLimited(`recon-${ipAddress}`, 20, 60000)) {
      return NextResponse.json(
        { success: false, message: "অতিরিক্ত রিকোয়েস্ট পাঠিয়েছেন। একটু অপেক্ষা করুন।" },
        { status: 429 }
      );
    }

    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Live quiz session not found" },
        { status: 404 }
      );
    }

    if (role === "host") {
      // Validate host reconnect
      const isValid = ReconnectService.validateHostToken(sessionId, reconnectToken);
      if (!isValid) {
        SecurityService.logAudit(
          sessionId,
          "INVALID_RECONNECT_TOKEN",
          "Host reconnect attempt failed due to invalid/expired token.",
          undefined,
          ipAddress,
          userAgent
        );
        return NextResponse.json(
          { success: false, message: "Invalid or expired host reconnect token." },
          { status: 401 }
        );
      }

      // Restore host presence
      session.hostConnectionStatus = "online";
      session.hostLastSeenAt = new Date().toISOString();

      SecurityService.logAudit(
        sessionId,
        "PLAYER_RECONNECTED",
        "Host reconnected successfully.",
        undefined,
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        success: true,
        message: "Host reconnected successfully.",
        role: "host",
        sessionState: {
          id: session.id,
          status: session.status,
          currentQuestionIndex: session.currentQuestionIndex,
          questionStartedAt: session.questionStartedAt,
          questionEndsAt: session.questionEndsAt
        }
      });
    } else {
      // Validate student reconnect
      if (!playerId) {
        return NextResponse.json(
          { success: false, message: "Missing playerId." },
          { status: 400 }
        );
      }

      const participant = institutionalDb.liveParticipants.find(
        p => p.id === playerId && p.sessionId === sessionId
      );

      if (!participant) {
        return NextResponse.json(
          { success: false, message: "Participant not found in this session." },
          { status: 404 }
        );
      }

      const isValid = reconnectToken ? ReconnectService.validateParticipantToken(sessionId, playerId, reconnectToken) : true;
      if (!isValid) {
        SecurityService.logAudit(
          sessionId,
          "PLAYER_RECONNECT_WARNING",
          `Reconnect token expired/mismatched for player ID ${playerId}, but session restored via participant ID.`,
          playerId,
          ipAddress,
          userAgent
        );
      }

      // Mark online
      participant.connectionStatus = "online";
      participant.status = "JOINED";
      participant.lastSeenAt = new Date().toISOString();

      // Log audit
      SecurityService.logAudit(
        sessionId,
        "PLAYER_RECONNECTED",
        `Player ${participant?.displayName} reconnected successfully.`,
        playerId,
        ipAddress,
        userAgent
      );

      // Regenerate token for next recovery
      const newReconnectToken = ReconnectService.generateTokens(sessionId, playerId);

      // Get state
      const state = SessionRecoveryService.recoverParticipantState(sessionId, playerId);

      return NextResponse.json({
        success: true,
        message: "Student reconnected successfully.",
        role: "student",
        reconnectToken: newReconnectToken,
        state
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to reconnect" },
      { status: 500 }
    );
  }
}
