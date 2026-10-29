import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
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

    const session = institutionalDb.liveSessions.find((s) => s.id === sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Live quiz session not found" },
        { status: 404 }
      );
    }

    // Initialize readyPlayers array if absent
    if (!(session as any).readyPlayers) {
      (session as any).readyPlayers = [];
    }

    const participant = institutionalDb.liveParticipants.find(
      (p) => p.sessionId === sessionId && p.id === playerId
    );

    const displayName = studentName || participant?.displayName || `শিক্ষার্থী ${playerId.slice(-4)}`;
    const studentAvatar = avatar || (participant as any)?.avatar || "🚀";
    const studentRoll = roll || participant?.studentId || (displayName.match(/রোল[:\s]*(\d+)/i)?.[1] ?? "—");

    const readyList: any[] = (session as any).readyPlayers;
    const existingIndex = readyList.findIndex((item) => item.playerId === playerId);

    if (isReady) {
      if (existingIndex >= 0) {
        readyList[existingIndex] = {
          playerId,
          name: displayName,
          roll: studentRoll,
          avatar: studentAvatar,
          readyAt: new Date().toISOString(),
        };
      } else {
        readyList.push({
          playerId,
          name: displayName,
          roll: studentRoll,
          avatar: studentAvatar,
          readyAt: new Date().toISOString(),
        });
      }
      if (participant) {
        (participant as any).isReady = true;
      }
    } else {
      if (existingIndex >= 0) {
        readyList.splice(existingIndex, 1);
      }
      if (participant) {
        (participant as any).isReady = false;
      }
    }

    const activeParticipants = institutionalDb.liveParticipants.filter(
      (p) => p.sessionId === sessionId && p.status === "JOINED"
    );

    invalidateSessionCache(sessionId);

    return NextResponse.json({
      success: true,
      isReady: Boolean(isReady),
      readyCount: readyList.length,
      totalPlayers: activeParticipants.length,
      readyPlayers: readyList,
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
    const session = institutionalDb.liveSessions.find((s) => s.id === sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Live quiz session not found" },
        { status: 404 }
      );
    }

    const activeParticipants = institutionalDb.liveParticipants.filter(
      (p) => p.sessionId === sessionId && p.status === "JOINED"
    );
    const readyPlayers = (session as any).readyPlayers || [];

    return NextResponse.json({
      success: true,
      readyCount: readyPlayers.length,
      totalPlayers: activeParticipants.length,
      readyPlayers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve ready state" },
      { status: 500 }
    );
  }
}
