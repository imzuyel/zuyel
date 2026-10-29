import { NextRequest, NextResponse } from "next/server";
import { getLiveSession } from "@/lib/liveSessionStore";
import { institutionalDb } from "@/lib/database";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getLiveSession(id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Live quiz session not found" },
        { status: 404 }
      );
    }

    const playersList = Object.values(session.players || {}).map((p) => ({
      id: p.id,
      displayName: p.name,
      name: p.name,
      roll: p.roll,
      avatar: p.avatar,
      score: p.score,
      totalScore: p.score,
      isReady: p.isReady,
      rank: p.rank,
      status: "JOINED",
    }));

    return NextResponse.json({
      success: true,
      players: playersList,
      participants: playersList,
      totalCount: playersList.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch participants" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { participantId, playerId: rawPlayerId, action } = body;
    const targetId = participantId || rawPlayerId;

    if (!targetId) {
      return NextResponse.json(
        { success: false, message: "Participant ID is required" },
        { status: 400 }
      );
    }

    const session = getLiveSession(id);
    if (session && session.players[targetId]) {
      delete session.players[targetId];
    }

    const participant = institutionalDb.liveParticipants.find(
      (p) => p.sessionId === id && p.id === targetId
    );
    if (participant) {
      participant.status = "LEFT";
      participant.updatedAt = new Date().toISOString();
    }

    return NextResponse.json({
      success: true,
      message: action === "kick" ? "Player has been kicked by the host." : "Player has left the session.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to modify participant" },
      { status: 500 }
    );
  }
}
