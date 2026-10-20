import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, PreQuizActivity } from "@/lib/database";

export async function GET(
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

    return NextResponse.json({
      success: true,
      isQuizModeStarted: session.isQuizModeStarted || false,
      status: session.status,
      activeActivity: session.activePreQuizActivity || null,
      allActivities: session.preQuizActivities || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch pre-quiz state" },
      { status: 500 }
    );
  }
}

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
    const { action } = body;

    // Action 1: Host creates a new pre-quiz activity (Message, Icebreaker, Poll, Survey)
    if (action === "create_activity") {
      // Pre-quiz activities can ONLY be created when the competitive quiz has not started
      if (session.status !== "LOBBY" && session.isQuizModeStarted) {
        return NextResponse.json(
          { success: false, message: "প্রকৃত কুইজ চালু অবস্থায় প্রি-কুইজ অ্যাক্টিভিটি তৈরি করা যাবে না।" },
          { status: 400 }
        );
      }

      const { type, prompt, options } = body;

      if (!prompt || !prompt.trim()) {
        return NextResponse.json(
          { success: false, message: "প্রশ্ন বা বার্তার বিবরণ প্রদান করুন।" },
          { status: 400 }
        );
      }

      // Deactivate any previous pre-quiz activity
      if (session.activePreQuizActivity) {
        session.activePreQuizActivity.isActive = false;
      }

      const newActivity: PreQuizActivity = {
        id: `pre-act-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        sessionId,
        type: type || "icebreaker", // "icebreaker" | "poll" | "survey" | "message"
        prompt: prompt.trim(),
        options: Array.isArray(options) ? options.filter((o: string) => o && o.trim()) : [],
        responses: [],
        isActive: true,
        createdAt: new Date().toISOString()
      };

      if (!session.preQuizActivities) {
        session.preQuizActivities = [];
      }
      session.preQuizActivities.push(newActivity);
      session.activePreQuizActivity = newActivity;
      session.updatedAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        message: "প্রি-কুইজ অ্যাক্টিভিটি সফলভাবে তৈরি ও সক্রিয় হয়েছে।",
        activity: newActivity
      });
    }

    // Action 2: Student submits response to the active pre-quiz activity
    if (action === "submit_response") {
      const { activityId, playerId, playerName, response } = body;

      if (!activityId || !playerId || response === undefined || response === null) {
        return NextResponse.json(
          { success: false, message: "প্রয়োজনীয় ফিল্ড মিসিং।" },
          { status: 400 }
        );
      }

      const activity = session.activePreQuizActivity;
      if (!activity || activity.id !== activityId || !activity.isActive) {
        return NextResponse.json(
          { success: false, message: "এই প্রি-কুইজ অ্যাক্টিভিটিটি আর সক্রিয় নেই।" },
          { status: 400 }
        );
      }

      // Check if player already responded, update or add
      const existingIdx = activity.responses.findIndex((r) => r.playerId === playerId);
      const record = {
        playerId,
        playerName: playerName || "শিক্ষার্থী",
        response: String(response),
        submittedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        activity.responses[existingIdx] = record;
      } else {
        activity.responses.push(record);
      }

      session.updatedAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        message: "উত্তর সফলভাবে গৃহীত হয়েছে। (কোনো স্কোর গণনা হবে না)",
        responseCount: activity.responses.length
      });
    }

    // Action 3: Host closes the current active pre-quiz activity
    if (action === "close_activity") {
      if (session.activePreQuizActivity) {
        session.activePreQuizActivity.isActive = false;
        session.activePreQuizActivity = null;
      }
      session.updatedAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        message: "প্রি-কুইজ অ্যাক্টিভিটি সমাপ্ত করা হয়েছে।"
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process pre-quiz action" },
      { status: 500 }
    );
  }
}
