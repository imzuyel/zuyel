import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { TeamService } from "@/lib/teamService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();
    const { playerId, teamId } = body;

    if (!playerId || !teamId) {
      return NextResponse.json({ success: false, message: "Player ID and Team ID are required" }, { status: 400 });
    }

    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) {
      return NextResponse.json({ success: false, message: "Session not found" }, { status: 404 });
    }

    if (session.isTeamLocked) {
      return NextResponse.json({ success: false, message: "Teams are locked. Cannot join team." }, { status: 400 });
    }

    // Check max players per team if configured
    const maxPlayers = session.teamSettings?.maxPlayersPerTeam || 10;
    const currentTeamMembersCount = institutionalDb.liveTeamMembers.filter(tm => tm.sessionId === sessionId && tm.teamId === teamId).length;
    
    if (currentTeamMembersCount >= maxPlayers) {
      return NextResponse.json({ success: false, message: "Selected team is full." }, { status: 400 });
    }

    const result = TeamService.assignStudent(sessionId, playerId, teamId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Failed to join team" }, { status: 500 });
  }
}
