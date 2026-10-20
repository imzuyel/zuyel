import { NextRequest, NextResponse } from "next/server";
import { TeamService } from "@/lib/teamService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();
    const { playerId, teamId, action } = body; // action: "assign" or "remove"

    if (!playerId) {
      return NextResponse.json({ success: false, message: "Player ID is required" }, { status: 400 });
    }

    if (action === "remove") {
      const result = TeamService.removeStudent(sessionId, playerId);
      return NextResponse.json(result);
    }

    if (!teamId) {
      return NextResponse.json({ success: false, message: "Team ID is required" }, { status: 400 });
    }

    const result = TeamService.assignStudent(sessionId, playerId, teamId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Failed to assign student" }, { status: 500 });
  }
}
