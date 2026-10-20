import { NextRequest, NextResponse } from "next/server";
import { TournamentService } from "@/lib/tournamentService";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id, participantId } = await params;
    const removed = TournamentService.removeParticipant(id, participantId);
    if (!removed) {
      return NextResponse.json({ success: false, error: "Participant not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Participant removed successfully"
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
