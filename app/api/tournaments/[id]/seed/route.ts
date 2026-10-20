import { NextRequest, NextResponse } from "next/server";
import { TournamentService } from "@/lib/tournamentService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { seedMap } = body;

    if (!seedMap || !Array.isArray(seedMap)) {
      return NextResponse.json({ success: false, error: "seedMap array is required" }, { status: 400 });
    }

    TournamentService.updateSeeding(id, seedMap);

    return NextResponse.json({
      success: true,
      message: "Seeding updated successfully"
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
