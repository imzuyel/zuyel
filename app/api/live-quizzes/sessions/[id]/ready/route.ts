import { NextRequest, NextResponse } from "next/server";
import { getLiveSession, setPlayerReady, addOrUpdatePlayer, saveLiveSession } from "@/lib/liveSessionStore";
import { invalidateSessionCache } from "@/lib/sessionCache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();
    const { playerId, isReady = true, studentName, roll, avatar } = body;

    if (!playerId) {
      return NextResponse.json(
        { success: false, message: "Player ID is required" },
        { status: 400 }
      );
    }

    const session = getLiveSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Live quiz session not found" },
        { status: 404 }
      );
    }

    // Register player if not in session.players
    if (!session.players[playerId]) {
      addOrUpdatePlayer(sessionId, {
        id: playerId,
        name: studentName || `শিক্ষার্থী ${playerId.slice(-4)}`,
        roll: roll || "—",
        avatar: avatar || "🚀",
        isReady: Boolean(isReady),
      });
    } else {
      setPlayerReady(sessionId, playerId, Boolean(isReady));
    }

    const readyPlayers = Object.values(session.players).filter((p) => p.isReady);
    const totalPlayers = Object.keys(session.players).length;

    invalidateSessionCache(sessionId);

    return NextResponse.json({
      success: true,
      isReady: Boolean(isReady),
      readyCount: readyPlayers.length,
      totalPlayers,
      readyPlayers: readyPlayers.map((p) => ({
        playerId: p.id,
        id: p.id,
        name: p.name,
        roll: p.roll,
        avatar: p.avatar,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update ready state" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const session = getLiveSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Live quiz session not found" },
        { status: 404 }
      );
    }

    const readyPlayers = Object.values(session.players).filter((p) => p.isReady);
    const totalPlayers = Object.keys(session.players).length;

    return NextResponse.json({
      success: true,
      readyCount: readyPlayers.length,
      totalPlayers,
      readyPlayers: readyPlayers.map((p) => ({
        playerId: p.id,
        id: p.id,
        name: p.name,
        roll: p.roll,
        avatar: p.avatar,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve ready state" },
      { status: 500 }
    );
  }
}
