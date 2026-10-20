import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { TeamService } from "@/lib/teamService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) {
      return NextResponse.json({ success: false, message: "Session not found" }, { status: 404 });
    }

    const teams = TeamService.getTeamLeaderboard(sessionId);
    const unassignedParticipants = institutionalDb.liveParticipants.filter(p => {
      if (p.sessionId !== sessionId || p.status !== "JOINED") return false;
      const isAssigned = institutionalDb.liveTeamMembers.some(tm => tm.sessionId === sessionId && tm.playerId === p.id);
      return !isAssigned;
    }).map(p => ({
      id: p.id,
      displayName: p.displayName,
      score: p.totalScore || 0
    }));

    return NextResponse.json({
      success: true,
      competitionMode: session.competitionMode || "individual",
      teamSettings: session.teamSettings || null,
      isTeamLocked: session.isTeamLocked || false,
      teams,
      unassignedParticipants
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch teams" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();
    const { teamSettings } = body;

    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) {
      return NextResponse.json({ success: false, message: "Session not found" }, { status: 404 });
    }

    if (session.isTeamLocked) {
      return NextResponse.json({ success: false, message: "Teams are locked" }, { status: 400 });
    }

    const createdTeams = TeamService.createTeamsForSession(sessionId, teamSettings);

    return NextResponse.json({
      success: true,
      message: "Teams created successfully",
      teams: createdTeams,
      teamSettings: session.teamSettings
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Failed to create teams" }, { status: 500 });
  }
}
