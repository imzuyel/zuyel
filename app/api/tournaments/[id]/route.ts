import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournament = institutionalDb.tournaments.find(t => t.id === id);
    if (!tournament) {
      return NextResponse.json({ success: false, error: "Tournament not found" }, { status: 404 });
    }

    const participants = institutionalDb.tournamentParticipants.filter(p => p.tournamentId === id);
    const rounds = institutionalDb.tournamentRounds.filter(r => r.tournamentId === id);
    const matches = institutionalDb.tournamentMatches.filter(m => m.tournamentId === id);

    return NextResponse.json({
      success: true,
      tournament,
      participants,
      rounds,
      matches
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournament = institutionalDb.tournaments.find(t => t.id === id);
    if (!tournament) {
      return NextResponse.json({ success: false, error: "Tournament not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, status, registrationStatus } = body;

    if (name) tournament.name = name;
    if (description !== undefined) tournament.description = description;
    if (status) tournament.status = status;
    if (registrationStatus) tournament.registrationStatus = registrationStatus;
    tournament.updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      tournament
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
