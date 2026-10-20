import { NextRequest, NextResponse } from "next/server";
import { chapterLearningStore } from "@/lib/chapterLearningEngine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    let studentRoll = body.studentRoll;
    const isGuest = !studentRoll || studentRoll === "guest" || String(studentRoll).trim() === "";
    
    // Support guest session persistence tracking via guestSessionId or header
    if (isGuest) {
      const guestSession = body.guestSessionId || req.headers.get("x-guest-session") || "guest_session";
      studentRoll = String(guestSession).startsWith("guest") ? String(guestSession) : `guest_${guestSession}`;
    }

    const studentName = body.studentName || (isGuest ? "অতিথি শিক্ষার্থী (Guest)" : undefined);
    const answers = body.answers || {};
    const timeSpentSeconds = body.timeSpentSeconds || 60;
    const tabSwitchedQuestionIds = Array.isArray(body.tabSwitchedQuestionIds) ? body.tabSwitchedQuestionIds : [];

    const result = chapterLearningStore.submitQuizAttempt(
      Number(id),
      studentRoll,
      answers,
      studentName,
      timeSpentSeconds,
      tabSwitchedQuestionIds
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to submit quiz attempt",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      isPassed: result.isPassed,
      scorePercentage: result.scorePercentage,
      correctCount: result.correctCount,
      disqualifiedCount: result.disqualifiedCount || 0,
      disqualifiedQuestionIds: result.disqualifiedQuestionIds || [],
      totalQuestions: result.totalQuestions,
      xpAwarded: result.xpAwarded,
      progress: result.progress,
      attemptsRemaining: result.attemptsRemaining,
      message: result.isPassed
        ? "অভিনন্দন! আপনি কুইজে সফলভাবে উত্তীর্ণ হয়েছেন এবং পরবর্তী ধাপ আনলক হয়েছে।"
        : "কুইজে পাস করতে পারেননি। নিয়ম অনুযায়ী পুনরায় চেষ্টা করুন।",
    });
  } catch (error: any) {
    console.error("POST /api/learning/items/[id]/submit-quiz error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error submitting quiz attempt" },
      { status: 500 }
    );
  }
}
