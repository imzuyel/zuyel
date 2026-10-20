import { NextRequest, NextResponse } from "next/server";
import { TournamentService } from "@/lib/tournamentService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournament = TournamentService.startTournament(id);

    return NextResponse.json({
      success: true,
      tournament
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
