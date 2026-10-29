import { NextRequest, NextResponse } from "next/server";
import { getLiveSession, saveLiveSession, LiveSessionRecord } from "@/lib/liveSessionStore";
import { institutionalDb } from "@/lib/database";
import { invalidateSessionCache } from "@/lib/sessionCache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getLiveSession(id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Live session not found" },
        { status: 404 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is okay
    }

    const now = Date.now();
    const action = body.action || (body.startQuestion ? "START_SLIDE" : undefined);
    const targetSlideIndex = typeof body.slideIndex === "number" ? body.slideIndex : session.currentSlideIndex || 0;

    // -------------------------------------------------------------------------
    // ACTION 1: START_SLIDE (Explicit start of question from Host)
    // Synchronized 3-second countdown (3 -> 2 -> 1 -> ANSWERING_ACTIVE)
    // -------------------------------------------------------------------------
    if (action === "START_SLIDE" || action === "start_question" || body.startQuestion) {
      session.status = "ACTIVE";
      session.currentSlideIndex = Math.min(Math.max(0, targetSlideIndex), Math.max(0, session.slides.length - 1));
      session.stage = "COUNTDOWN_321";
      session.stageStartedAt = now;
      session.stageEndsAt = now + 3000; // Exact 3-second countdown
      session.updatedAt = now;

      // Reset isReady for all players on new question cycle
      for (const p of Object.values(session.players)) {
        p.isReady = false;
      }

      saveLiveSession(session);
      invalidateSessionCache(id);

      return NextResponse.json({
        success: true,
        message: "Question countdown initiated (3 seconds).",
        stage: "COUNTDOWN_321",
        stageStartedAt: session.stageStartedAt,
        stageEndsAt: session.stageEndsAt,
        currentSlideIndex: session.currentSlideIndex,
        session,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 2: SKIP_COUNTDOWN / FORCE_ANSWERING (1-Click Teacher Override)
    // -------------------------------------------------------------------------
    if (action === "SKIP_COUNTDOWN" || action === "FORCE_ANSWERING") {
      const currentSlide = session.slides[session.currentSlideIndex] || session.slides[0];
      const safeTimeLimit = Math.max(5, Number(currentSlide?.timeLimit) || 20);

      session.status = "ACTIVE";
      session.stage = "ANSWERING_ACTIVE";
      session.stageStartedAt = now;
      session.stageEndsAt = now + safeTimeLimit * 1000;
      session.updatedAt = now;

      saveLiveSession(session);
      invalidateSessionCache(id);

      return NextResponse.json({
        success: true,
        message: "Countdown skipped. Answering active.",
        stage: "ANSWERING_ACTIVE",
        stageStartedAt: session.stageStartedAt,
        stageEndsAt: session.stageEndsAt,
        session,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 3: SHOW_LEADERBOARD
    // -------------------------------------------------------------------------
    if (action === "SHOW_LEADERBOARD") {
      session.stage = "LEADERBOARD_VIEW";
      session.stageStartedAt = now;
      session.stageEndsAt = now + 120000;
      session.updatedAt = now;

      saveLiveSession(session);
      invalidateSessionCache(id);

      return NextResponse.json({
        success: true,
        message: "Leaderboard view active.",
        stage: "LEADERBOARD_VIEW",
        session,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 4: END_QUIZ
    // -------------------------------------------------------------------------
    if (action === "END_QUIZ") {
      session.status = "ENDED";
      session.stage = "ENDED";
      session.stageStartedAt = now;
      session.stageEndsAt = now;
      session.updatedAt = now;

      saveLiveSession(session);
      invalidateSessionCache(id);

      return NextResponse.json({
        success: true,
        message: "Quiz session ended.",
        stage: "ENDED",
        session,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 5: SLIDE NAVIGATION (Next / Prev Slide)
    // -------------------------------------------------------------------------
    let nextIdx = (session.currentSlideIndex || 0) + 1;
    if (typeof body.slideIndex === "number") {
      nextIdx = body.slideIndex;
    } else if (body.direction === "prev") {
      nextIdx = Math.max(0, (session.currentSlideIndex || 0) - 1);
    }

    if (nextIdx >= session.slides.length) {
      session.status = "ENDED";
      session.stage = "ENDED";
      session.updatedAt = now;

      saveLiveSession(session);
      invalidateSessionCache(id);

      return NextResponse.json({
        success: true,
        message: "সকল প্রশ্ন সমাপ্ত হয়েছে! সেশন শেষ।",
        stage: "ENDED",
        session,
      });
    }

    const nextSlide = session.slides[nextIdx];
    const isGraded =
      Number(nextSlide?.timeLimit || 0) > 0 ||
      ["MCQ", "MATCHING", "FILL_BLANKS", "REORDER", "TRUE_FALSE"].includes((nextSlide?.type || "").toUpperCase());

    session.currentSlideIndex = nextIdx;
    session.updatedAt = now;

    // Reset player readiness for next question
    for (const p of Object.values(session.players)) {
      p.isReady = false;
    }

    // If autoStart was requested, start countdown immediately!
    if (body.autoStart) {
      session.status = "ACTIVE";
      session.stage = "COUNTDOWN_321";
      session.stageStartedAt = now;
      session.stageEndsAt = now + 3000;
    } else if (isGraded) {
      // Graded questions enter readiness check
      session.stage = "READY_CHECK";
      session.stageStartedAt = now;
      session.stageEndsAt = now + 60000;
    } else {
      // Content / Info slides are active immediately
      session.stage = "ANSWERING_ACTIVE";
      session.stageStartedAt = now;
      session.stageEndsAt = now + (Number(nextSlide?.timeLimit) || 60) * 1000;
    }

    saveLiveSession(session);
    invalidateSessionCache(id);

    return NextResponse.json({
      success: true,
      message: `Moving to slide ${nextIdx + 1}`,
      currentSlideIndex: nextIdx,
      stage: session.stage,
      stageStartedAt: session.stageStartedAt,
      stageEndsAt: session.stageEndsAt,
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to proceed to next slide" },
      { status: 500 }
    );
  }
}
