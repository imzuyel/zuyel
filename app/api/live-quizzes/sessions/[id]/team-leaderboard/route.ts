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

    const leaderboard = TeamService.getTeamLeaderboard(sessionId);

    return NextResponse.json({
      success: true,
      competitionMode: session.competitionMode || "individual",
      teams: leaderboard
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch team leaderboard" }, { status: 500 });
  }
}
