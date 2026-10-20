import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = institutionalDb.liveSessions.find(s => s.id === id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Live quiz session not found" },
        { status: 404 }
      );
    }

    // Find quiz details from institutionalDb or mock PRELOADED_QUIZZES
    let quizTitle = "Interactive Technical Quiz";
    let questionCount = 0;

    const quiz = institutionalDb.quizzes.find(q => q.id === session.quizId);
    if (quiz) {
      quizTitle = quiz.title;
      // We don't have direct count if quiz questions are in quizQuestions table
      const questions = institutionalDb.quizQuestions?.filter(qq => qq.quizId === session.quizId) || [];
      questionCount = questions.length;
    } else {
      // Look up fallback mock trade quizzes
      if (session.quizId === "comp-iot") {
        quizTitle = "কম্পিউটার ও আইওটি (Computer & IoT Basics)";
        questionCount = 4;
      } else if (session.quizId === "elec-works") {
        quizTitle = "ইলেকট্রিক্যাল ওয়ার্কস ও সার্কিট (Electrical Works & Safety)";
        questionCount = 3;
      } else if (session.quizId === "fourth-ir") {
        quizTitle = "চতুর্থ শিল্পবিপ্লব ও সাধারণ কারিগরি জ্ঞান";
        questionCount = 2;
      }
    }

    // Get active participants
    const participants = institutionalDb.liveParticipants.filter(
      p => p.sessionId === id && p.status === "JOINED"
    );

    return NextResponse.json({
      success: true,
      session,
      quiz: {
        id: session.quizId,
        title: quizTitle,
        questionCount,
      },
      playerCount: participants.length,
      participants,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve session" },
      { status: 500 }
    );
  }
}
