import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { SecurityService, SessionRecoveryService } from "@/lib/reconnectService";
import { getAssignedPlate } from "@/lib/quizPlateEngine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId") || searchParams.get("participantId");

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (SecurityService.isRateLimited(`state-${ipAddress}`, 30, 60000)) {
      return NextResponse.json(
        { success: false, message: "Too many state sync requests" },
        { status: 429 }
      );
    }

    if (!playerId) {
      return NextResponse.json(
        { success: false, message: "playerId or participantId is required" },
        { status: 400 }
      );
    }

    const state = SessionRecoveryService.recoverParticipantState(sessionId, playerId);
    if (!state) {
      return NextResponse.json(
        { success: false, message: "Participant state could not be recovered" },
        { status: 404 }
      );
    }

    // Get active participants for this session to pass to plate engine
    const activeParticipants = institutionalDb.liveParticipants
      .filter(p => p.sessionId === sessionId)
      .map(p => p.id);

    // Get plate template for current question
    const plate = getAssignedPlate(sessionId, playerId, state.session.currentQuestionIndex, activeParticipants);

    // Retrieve active motivation message ONLY if competitive quiz mode has started
    let motivationMessage = null;
    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    const participant = institutionalDb.liveParticipants.find(
      p => p.id === playerId && p.sessionId === sessionId
    );
    if (session?.isQuizModeStarted && participant && participant.motivationMessage && !participant.motivationMessage.shown) {
      motivationMessage = {
        category: participant.motivationMessage.category,
        message: participant.motivationMessage.message,
        questionIndex: participant.motivationMessage.questionIndex,
        durationMs: 8000
      };
      participant.motivationMessage.shown = true;
    }

    // Log state recovery event
    SecurityService.logAudit(
      sessionId,
      "SESSION_STATE_RECOVERY",
      `Student ${state.participant.displayName} synced/recovered state.`,
      playerId,
      ipAddress
    );

    return NextResponse.json({
      success: true,
      state,
      plate,
      isQuizModeStarted: session?.isQuizModeStarted || false,
      activePreQuizActivity: session?.activePreQuizActivity || null,
      motivationMessage
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch recovered state" },
      { status: 500 }
    );
  }
}
