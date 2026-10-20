import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { isLocked } = body;

    const sessionIndex = institutionalDb.liveSessions.findIndex(s => s.id === id);

    if (sessionIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Live quiz session not found" },
        { status: 404 }
      );
    }

    const session = institutionalDb.liveSessions[sessionIndex];
    session.isLocked = !!isLocked;
    session.updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: `Lobby successfully ${session.isLocked ? "locked" : "unlocked"}.`,
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to toggle lobby lock" },
      { status: 500 }
    );
  }
}
