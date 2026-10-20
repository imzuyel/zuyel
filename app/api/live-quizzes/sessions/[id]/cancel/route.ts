import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionIndex = institutionalDb.liveSessions.findIndex(s => s.id === id);

    if (sessionIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Live quiz session not found" },
        { status: 404 }
      );
    }

    const session = institutionalDb.liveSessions[sessionIndex];
    session.status = "CANCELLED";
    session.updatedAt = new Date().toISOString();
    session.endedAt = new Date().toISOString();

    // Mark all participants as left
    institutionalDb.liveParticipants = institutionalDb.liveParticipants.map(p => {
      if (p.sessionId === id) {
        return {
          ...p,
          status: "LEFT",
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    return NextResponse.json({
      success: true,
      message: "Live session cancelled and disbanded.",
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to cancel live session" },
      { status: 500 }
    );
  }
}
