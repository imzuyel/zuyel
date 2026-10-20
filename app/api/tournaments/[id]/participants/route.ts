import { NextRequest, NextResponse } from "next/server";
import { TournamentService } from "@/lib/tournamentService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { studentId, teamId, name } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Participant name is required" }, { status: 400 });
    }

    const participant = TournamentService.addParticipant(id, { studentId, teamId, name });

    return NextResponse.json({
      success: true,
      participant
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
