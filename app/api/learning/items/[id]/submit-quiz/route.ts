import { NextRequest, NextResponse } from "next/server";
import { chapterLearningStore } from "@/lib/chapterLearningEngine";
import { safePrismaQuery, isPrismaAvailable } from "@/lib/prisma";

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
    const timeSpentSeconds = Math.max(1, Number(body.timeSpentSeconds) || 60);
    const tabSwitchedQuestionIds = Array.isArray(body.tabSwitchedQuestionIds) ? body.tabSwitchedQuestionIds : [];

    const result = chapterLearningStore.submitQuizAttempt(
      id,
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

    // STRICT GUARANTEE: If 100% correct answers within time, MUST receive 5 stars!
    const isPerfect = (result.scorePercentage === 100) || (result.correctCount === result.totalQuestions && (result.totalQuestions || 0) > 0);
    let finalStars = result.stars || 1;
    if (isPerfect && result.isPassed) {
      finalStars = 5;
    } else {
      finalStars = Math.max(1, Math.min(5, finalStars));
    }

    const numericItemId = Number(id);

    // Direct Database Persistence to Prisma MySQL
    if (isPrismaAvailable() && !isNaN(numericItemId)) {
      await safePrismaQuery(async (p) => {
        const existing = await p.studentItemProgress.findUnique({
          where: {
            studentRoll_itemId: {
              studentRoll: String(studentRoll),
              itemId: numericItemId,
            },
          },
        });

        const newBestScore = Math.max(existing?.bestScore || 0, result.scorePercentage || 0);
        const newStars = result.isPassed
          ? Math.max(existing?.stars || 0, finalStars)
          : Math.max(existing?.stars || 0, 1);
        const wasPassed = existing?.isPassed || false;

        return await p.studentItemProgress.upsert({
          where: {
            studentRoll_itemId: {
              studentRoll: String(studentRoll),
              itemId: numericItemId,
            },
          },
          update: {
            status: result.isPassed ? "COMPLETED" : (wasPassed ? "COMPLETED" : "FAILED"),
            attemptsCount: { increment: 1 },
            bestScore: newBestScore,
            lastScore: result.scorePercentage || 0,
            isPassed: Boolean(result.isPassed || wasPassed),
            xpEarned: (result.isPassed && !wasPassed) ? (result.xpAwarded || 50) : (existing?.xpEarned || 0),
            stars: newStars,
            answersJson: answers ? JSON.stringify(answers) : null,
            completedAt: result.isPassed ? new Date() : existing?.completedAt,
            timeSpentSeconds: { increment: timeSpentSeconds },
          },
          create: {
            studentRoll: String(studentRoll),
            studentName: studentName || "Student",
            itemId: numericItemId,
            status: result.isPassed ? "COMPLETED" : "FAILED",
            attemptsCount: 1,
            bestScore: result.scorePercentage || 0,
            lastScore: result.scorePercentage || 0,
            isPassed: Boolean(result.isPassed),
            xpEarned: result.xpAwarded || 0,
            stars: finalStars,
            answersJson: answers ? JSON.stringify(answers) : null,
            timeSpentSeconds,
            completedAt: result.isPassed ? new Date() : null,
          },
        });
      }, null);
    }

    return NextResponse.json({
      success: true,
      isPassed: result.isPassed,
      score: result.scorePercentage,
      scorePercentage: result.scorePercentage,
      correctCount: result.correctCount,
      disqualifiedCount: result.disqualifiedCount || 0,
      disqualifiedQuestionIds: result.disqualifiedQuestionIds || [],
      totalQuestions: result.totalQuestions,
      xpAwarded: result.xpAwarded,
      stars: finalStars,
      progress: {
        ...result.progress,
        stars: finalStars,
      },
      attemptsRemaining: result.attemptsRemaining,
      message: result.isPassed
        ? (isPerfect ? "অসাধারণ! ১০০% সঠিক উত্তর দিয়ে ৫ স্টার (★★★★★) অর্জন করেছেন!" : "অভিনন্দন! আপনি কুইজে সফলভাবে উত্তীর্ণ হয়েছেন এবং পরবর্তী ধাপ আনলক হয়েছে।")
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
