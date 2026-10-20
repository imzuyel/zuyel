import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = institutionalDb.liveSessions.find(s => s.id === id);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Live quiz session not found" },
        { status: 404 }
      );
    }

    const participants = institutionalDb.liveParticipants.filter(
      p => p.sessionId === id && p.status === "JOINED"
    );

    return NextResponse.json({
      success: true,
      participants,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch participants" },
      { status: 500 }
    );
  }
}

// POST for kicking/removing a player or a player leaving
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { participantId, action } = body; // action: "kick" or "leave"

    if (!participantId) {
      return NextResponse.json(
        { success: false, message: "Participant ID is required" },
        { status: 400 }
      );
    }

    const participantIndex = institutionalDb.liveParticipants.findIndex(
      p => p.sessionId === id && p.id === participantId
    );

    if (participantIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Participant not found in this session" },
        { status: 404 }
      );
    }

    const participant = institutionalDb.liveParticipants[participantIndex];
    participant.status = "LEFT";
    participant.updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: action === "kick" ? "Player has been kicked by the host." : "Player has left the session.",
      participant,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to modify participant" },
      { status: 500 }
    );
  }
}
