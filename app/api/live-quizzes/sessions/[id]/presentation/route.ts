import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const session = institutionalDb.liveSessions.find((s) => s.id === sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { action, slideIndex } = body;

    if (action === "set_slide") {
      session.currentSlideIndex = slideIndex;
      session.updatedAt = new Date().toISOString();
      return NextResponse.json({ success: true, slideIndex });
    }

    if (action === "next_slide") {
      session.currentSlideIndex = (session.currentSlideIndex || 0) + 1;
      session.updatedAt = new Date().toISOString();
      return NextResponse.json({ success: true, slideIndex: session.currentSlideIndex });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process presentation action" },
      { status: 500 }
    );
  }
}
