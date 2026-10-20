import { NextRequest, NextResponse } from "next/server";
import { TournamentService } from "@/lib/tournamentService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const { id, matchId } = await params;
    const match = TournamentService.completeMatch(id, matchId);

    return NextResponse.json({
      success: true,
      match
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
