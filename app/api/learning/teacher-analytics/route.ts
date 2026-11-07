import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { requireTeacherOrAdmin } from "@/lib/serverAuthGuard";
import {
  getTeacherAnalytics,
  generateRemedialQuizDeck,
  generateRevisionNote,
} from "@/lib/teacherAnalyticsEngine";
import { getHybridStore, saveHybridStore } from "@/lib/hybridStorageEngine";

export async function GET(req: NextRequest) {
  const auth = requireTeacherOrAdmin(req, "/api/learning/teacher-analytics");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const classFilter = searchParams.get("class") || "all";
    const tradeFilter = searchParams.get("trade") || "all";
    const subjectFilter = searchParams.get("subject") || "all";

    const analyticsData = await getTeacherAnalytics({
      className: classFilter,
      trade: tradeFilter,
      subject: subjectFilter,
    });

    return apiSuccess(analyticsData, {
      extraKeys: {
        data: analyticsData,
      },
    });
  } catch (error: any) {
    console.error("Error in teacher analytics API:", error);
    return apiError(error, { fallbackMessage: "শিক্ষক অ্যানালিটিক্স লোড করতে সমস্যা হয়েছে" });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireTeacherOrAdmin(req, "/api/learning/teacher-analytics");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { action, topic, className = "Class 9", trade = "Computer & IT" } = body || {};

    if (!topic) {
      return NextResponse.json(
        { success: false, message: "টপিক নির্বাচন করা আবশ্যক" },
        { status: 400 }
      );
    }

    if (action === "remedial_quiz") {
      const remedialDeck = generateRemedialQuizDeck(topic, className, trade);

      // Save into hybridStore quizzes so it immediately appears in Quiz Hub
      const store = getHybridStore();
      if (!store.quizzes) store.quizzes = [];
      const newQuizItem = {
        id: remedialDeck.id,
        title: remedialDeck.title,
        className: remedialDeck.className,
        trade: remedialDeck.trade,
        subject: remedialDeck.subject,
        questionCount: remedialDeck.questionCount,
        timeLimit: remedialDeck.timeLimit,
        questions: remedialDeck.slides
          .filter((s) => s.type === "MCQ")
          .map((s, idx) => ({
            id: s.id || `q_${idx}`,
            question: s.question,
            options: s.options,
            correctAnswer: s.correctAnswer,
            explanation: s.explanation,
            points: 100,
          })),
        updatedAt: remedialDeck.updatedAt,
      };

      store.quizzes.unshift(newQuizItem);
      saveHybridStore(store);

      return NextResponse.json({
        success: true,
        message: "রিমেডিয়াল লাইভ কুইজ সফলভাবে তৈরি হয়েছে",
        deck: remedialDeck,
      });
    }

    if (action === "revision_note") {
      const revisionNote = generateRevisionNote(topic, className, trade);
      return NextResponse.json({
        success: true,
        message: "রিভিশন নোট সফলভাবে জেনারেট হয়েছে",
        note: revisionNote,
      });
    }

    return NextResponse.json(
      { success: false, message: "অজানা অ্যাকশন অনুরোধ" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error in teacher analytics POST:", error);
    return apiError(error, { fallbackMessage: "অনুরোধ সম্পন্ন করতে ব্যর্থ হয়েছে" });
  }
}
