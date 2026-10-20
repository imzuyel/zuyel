import { NextRequest, NextResponse } from "next/server";
import { TournamentService } from "@/lib/tournamentService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = TournamentService.generateBracket(id);

    return NextResponse.json({
      success: true,
      rounds: result.rounds,
      matches: result.matches
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
