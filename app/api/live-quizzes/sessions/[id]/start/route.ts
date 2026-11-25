import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { getSessionQuestions } from "@/lib/liveQuizHelper";
import { getLiveSession, saveLiveSession, normalizeSlideForLive } from "@/lib/liveSessionStore";
import { invalidateSessionCache } from "@/lib/sessionCache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const liveSession = getLiveSession(id);

    if (!liveSession) {
      return NextResponse.json(
        { success: false, message: "Live session not found" },
        { status: 404 }
      );
    }

    if (!liveSession.slides || liveSession.slides.length === 0) {
      const questions = getSessionQuestions(liveSession.quizId || "quiz-1");
      if (questions.length > 0) {
        liveSession.slides = questions.map((q: any, idx: number) => normalizeSlideForLive(q, idx));
      }
    }

    const nowMs = Date.now();
    liveSession.currentSlideIndex = 0;
    liveSession.status = "ACTIVE";
    liveSession.isLocked = false;

    if (body?.immediateCountdown !== false) {
      liveSession.stage = "COUNTDOWN_321";
      liveSession.stageStartedAt = nowMs;
      liveSession.stageEndsAt = nowMs + 3000;
    } else {
      liveSession.stage = "READY_CHECK";
      liveSession.stageStartedAt = nowMs;
      liveSession.stageEndsAt = nowMs + 60000;
    }

    saveLiveSession(liveSession);
    invalidateSessionCache(id);

    const legacy = institutionalDb.liveSessions.find((s) => s.id === liveSession.id);
    if (legacy) {
      legacy.isQuizModeStarted = true;
      (legacy as any).eligibilityFrozen = true;
      legacy.updatedAt = new Date().toISOString();
    }

    return NextResponse.json({
      success: true,
      message: "Live quiz session started cleanly.",
      stage: liveSession.stage,
      stageStartedAt: liveSession.stageStartedAt,
      stageEndsAt: liveSession.stageEndsAt,
      session: liveSession,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to start quiz" },
      { status: 500 }
    );
  }
}
