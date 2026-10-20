import { NextRequest, NextResponse } from "next/server";
import { TeamService } from "@/lib/teamService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const result = TeamService.lockTeams(sessionId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Failed to lock teams" }, { status: 500 });
  }
}
