import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { getSessionQuestions } from "@/lib/liveQuizHelper";
import { invalidateSessionCache } from "@/lib/sessionCache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = institutionalDb.liveSessions.find((s) => s.id === id);

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

    const questions = getSessionQuestions(session.quizId);
    const now = new Date();

    // -------------------------------------------------------------------------
    // TEACHER ACTION: "Start Question" (from READY_CHECK stage)
    // Synchronized 3-2-1 Countdown (3s) -> Question Only (5s) -> Options + Timer
    // -------------------------------------------------------------------------
    if (body.action === "start_question" || body.startQuestion) {
      const currentIdx = session.currentQuestionIndex || 0;
      const currentItem = questions[currentIdx] || questions[0];
      const duration = Number(currentItem?.timeLimit || 30) || 30;

      const countdownDuration = 3; // Stage 1: Exactly 3 seconds (3-2-1)
      const previewDuration = 5;   // Stage 2: Exactly 5 seconds (Question text only, NO options)

      const countdownEndsAt = new Date(now.getTime() + countdownDuration * 1000);
      const previewEndsAt = new Date(countdownEndsAt.getTime() + previewDuration * 1000);
      const questionEndsAt = new Date(previewEndsAt.getTime() + duration * 1000);

      session.status = "QUESTION_ACTIVE";
      session.isQuizModeStarted = true;
      (session as any).allVoted = false;
      (session as any).isAnswerRevealed = false;
      (session as any).sequenceStartedAt = now.toISOString();
      (session as any).countdownEndsAt = countdownEndsAt.toISOString();
      (session as any).previewEndsAt = previewEndsAt.toISOString();
      session.questionStartedAt = previewEndsAt.toISOString();
      session.questionEndsAt = questionEndsAt.toISOString();
      session.updatedAt = now.toISOString();

      invalidateSessionCache(id);

      return NextResponse.json({
        success: true,
        message: "Question sequence started: 3s Countdown -> 5s Question Only -> Options Active",
        stage: "COUNTDOWN_321",
        countdownEndsAt: countdownEndsAt.toISOString(),
        previewEndsAt: previewEndsAt.toISOString(),
        questionEndsAt: questionEndsAt.toISOString(),
        session,
      });
    }

    // -------------------------------------------------------------------------
    // SLIDE NAVIGATION: Move to Next / Previous slide
    // -------------------------------------------------------------------------
    let nextIdx = (session.currentQuestionIndex || 0) + 1;

    if (typeof body.slideIndex === "number") {
      nextIdx = body.slideIndex;
    } else if (body.direction === "prev") {
      nextIdx = Math.max(0, (session.currentQuestionIndex || 0) - 1);
    }

    if (nextIdx >= questions.length) {
      // No more questions, complete quiz!
      session.status = "COMPLETED";
      session.updatedAt = now.toISOString();
      session.endedAt = now.toISOString();
      invalidateSessionCache(id);

      return NextResponse.json({
        success: true,
        message: "সেশন সমাপ্ত হয়েছে!",
        session,
      });
    }

    const nextItem = questions[nextIdx];
    const isGraded = Number(nextItem?.timeLimit || 0) > 0 || ["MCQ", "MATCHING", "FILL_BLANKS", "REORDER", "TRUE_FALSE"].includes((nextItem?.type || "").toUpperCase());

    session.currentQuestionIndex = nextIdx;
    (session as any).allVoted = false;
    (session as any).isAnswerRevealed = false;
    (session as any).showLeaderboard = body.showLeaderboard !== undefined ? Boolean(body.showLeaderboard) : nextItem?.type === "LEADERBOARD";
    (session as any).readyPlayers = []; // Reset ready players for the new question cycle
    (session as any).sequenceStartedAt = now.toISOString();

    if (isGraded) {
      // Mandatory FIX 4: Enter READY_CHECK State First! DO NOT start countdown/timer!
      session.status = "READY" as any;
      (session as any).countdownEndsAt = undefined;
      (session as any).previewEndsAt = undefined;
      session.questionStartedAt = undefined;
      session.questionEndsAt = undefined;
    } else {
      // Content / Warmup / Leaderboard slide
      session.status = "QUESTION_ACTIVE";
      (session as any).countdownEndsAt = undefined;
      (session as any).previewEndsAt = undefined;
      session.questionStartedAt = now.toISOString();
      session.questionEndsAt = undefined;
    }

    session.updatedAt = now.toISOString();
    invalidateSessionCache(id);

    return NextResponse.json({
      success: true,
      message: `Moving to Slide ${nextIdx + 1}`,
      currentQuestionIndex: nextIdx,
      status: session.status,
      activeItem: nextItem,
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to proceed to next question" },
      { status: 500 }
    );
  }
}
