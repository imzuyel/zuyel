import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { TournamentService } from "@/lib/tournamentService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let tournaments = institutionalDb.tournaments;
    if (status) {
      tournaments = tournaments.filter(t => t.status === status);
    }

    return NextResponse.json({
      success: true,
      tournaments
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, quizId, mode, maxParticipants, numberOfRounds, qualificationRule, matchSize, startTime } = body;

    if (!name || !quizId) {
      return NextResponse.json({ success: false, error: "Tournament name and quizId are required" }, { status: 400 });
    }

    const tournament = TournamentService.createTournament({
      name,
      description,
      quizId,
      mode: mode || "individual",
      maxParticipants: maxParticipants || 8,
      numberOfRounds,
      qualificationRule,
      matchSize,
      startTime
    });

    return NextResponse.json({
      success: true,
      tournament
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
