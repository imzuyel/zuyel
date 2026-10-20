import { NextRequest, NextResponse } from "next/server";
import { TournamentService } from "@/lib/tournamentService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const { id, matchId } = await params;
    const body = await req.json().catch(() => ({}));
    const hostUserId = body.hostUserId || 3;

    const result = TournamentService.startMatch(id, matchId, hostUserId);

    return NextResponse.json({
      success: true,
      match: result.match,
      session: result.session
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
