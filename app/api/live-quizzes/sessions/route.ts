import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, LiveSession } from "@/lib/database";
import { ReconnectService } from "@/lib/reconnectService";
import { TeamService } from "@/lib/teamService";
import { createLiveSession, getLiveSession, normalizeSlide } from "@/lib/liveSessionStore";
import { getSessionQuestions } from "@/lib/liveQuizHelper";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hostId = searchParams.get("hostUserId");
    const code = searchParams.get("code") || searchParams.get("pin");

    if (code) {
      const session = getLiveSession(code);
      if (session) {
        return NextResponse.json({
          success: true,
          session,
        });
      }
    }

    let sessions = [...institutionalDb.liveSessions];
    if (hostId) {
      sessions = sessions.filter((s) => s.hostUserId === parseInt(hostId));
    }

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch live sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      quizId,
      hostUserId,
      competitionMode,
      teamSettings,
      motivationEnabled,
      motivationInterval,
      scheduledStartTime,
      scheduledAt,
      slides: incomingSlides,
      questions: incomingQuestions,
    } = body;

    if (!quizId && (!incomingSlides || incomingSlides.length === 0)) {
      return NextResponse.json(
        { success: false, message: "Quiz ID or slides are required" },
        { status: 400 }
      );
    }

    // Resolve slides: ensure session.slides is NEVER empty!
    let resolvedSlides = Array.isArray(incomingSlides) && incomingSlides.length > 0
      ? incomingSlides
      : Array.isArray(incomingQuestions) && incomingQuestions.length > 0
      ? incomingQuestions
      : [];

    if (resolvedSlides.length === 0 && quizId) {
      const helperQuestions = getSessionQuestions(quizId);
      if (helperQuestions && helperQuestions.length > 0) {
        resolvedSlides = helperQuestions;
      }
    }

    // Verify quiz exists in institutionalDb or fallback
    const quiz = institutionalDb.quizzes.find((q) => String(q.id) === String(quizId));

    if (resolvedSlides.length === 0) {
      const rawDbSlides = (quiz as any)?.presentationSlides || (quiz as any)?.slides || (quiz as any)?.questions || [];
      if (rawDbSlides.length > 0) {
        resolvedSlides = rawDbSlides;
      }
    }

    // Final safety normalization fallback
    if (resolvedSlides.length === 0) {
      resolvedSlides = [
        {
          id: "slide-1",
          type: "MCQ",
          title: "প্রথম প্রশ্ন",
          questionText: "কুইজের প্রথম প্রশ্নটি মনোযোগ দিয়ে পড়ুন।",
          options: ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
          timeLimit: 20,
          correctAnswer: 0,
        },
      ];
    }

    const normalizedSlides = resolvedSlides.map((s: any, idx: number) => normalizeSlide(s, idx));

    // Generate a unique 6-digit game PIN
    let sessionCode = "";
    let attempts = 0;
    while (attempts < 10) {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const duplicate = institutionalDb.liveSessions.some(
        (s) => s.sessionCode === pin && ["CREATED", "LOBBY"].includes(s.status)
      );
      if (!duplicate) {
        sessionCode = pin;
        break;
      }
      attempts++;
    }
    if (!sessionCode) {
      sessionCode = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const sessionId = `session-${Date.now()}`;
    const joinToken = `join-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const academicYearId = body.academicYearId || (quiz as any)?.academicYearId || "2026";
    const classId = body.classId || (quiz as any)?.classId;
    const className = body.className || (quiz as any)?.className || "দশম শ্রেণি";
    const tradeId = body.tradeId || (quiz as any)?.tradeId;
    const tradeName = body.tradeName || body.trade || (quiz as any)?.tradeName || (quiz as any)?.category || "জেনারেল";
    const subjectId = body.subjectId || (quiz as any)?.subjectId;
    const subjectName = body.subjectName || body.subject || (quiz as any)?.subjectName || "সাধারণ জ্ঞান";
    const subjectCode = body.subjectCode || (quiz as any)?.subjectCode || "101";

    // 1. Create and persist High-Concurrency LiveSessionRecord
    const liveSessionRecord = createLiveSession({
      id: sessionId,
      code: sessionCode,
      title: body.title || (quiz as any)?.title || subjectName || "লাইভ কুইজ সেশন",
      className,
      trade: tradeName,
      subject: subjectName,
      hostName: "হোস্ট শিক্ষক",
      status: "WAITING",
      stage: "READY_CHECK",
      currentSlideIndex: 0,
      stageStartedAt: Date.now(),
      stageEndsAt: Date.now() + 30000,
      slides: normalizedSlides,
      players: {},
      answers: {},
      smsInterval: "EVERY_3",
      quizId: String(quizId || "quiz-1"),
      scheduledStartTime: scheduledStartTime || scheduledAt || body.settings?.scheduledStartTime,
      isLocked: false,
      hostUserId: Number(hostUserId) || 3,
      joinToken,
    });

    // 2. Mirror into institutionalDb.liveSessions for backward compatibility
    const newSession: LiveSession = {
      id: sessionId,
      quizId: String(quizId || "quiz-1"),
      hostUserId: Number(hostUserId) || 3,
      sessionCode,
      joinToken,
      status: "LOBBY",
      academicYearId,
      classId,
      className,
      tradeId,
      tradeName,
      subjectId,
      subjectName,
      subjectCode,
      maxPlayers: 100,
      isLocked: false,
      currentQuestionIndex: 0,
      competitionMode: competitionMode || "individual",
      teamSettings: teamSettings || { nameMode: "predefined", numberOfTeams: 4, assignmentMode: "automatic" },
      isTeamLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hostConnectionStatus: "online",
      hostLastSeenAt: new Date().toISOString(),
      motivationEnabled: motivationEnabled !== undefined ? Boolean(motivationEnabled) : true,
      motivationInterval: motivationInterval !== undefined ? Number(motivationInterval) : 3,
      scheduledStartTime: scheduledStartTime || scheduledAt || body.settings?.scheduledStartTime || (quiz as any)?.scheduledStartTime || undefined,
      scheduledAt: scheduledAt || scheduledStartTime || body.settings?.scheduledStartTime || (quiz as any)?.scheduledAt || undefined,
      autoSmsMilestone: body.settings?.autoSmsMilestone || body.autoSmsMilestone || "off",
      smsRecipient: body.settings?.smsRecipient || body.smsRecipient || "both",
      smsFunnyMode: body.settings?.smsFunnyMode ?? true,
      smsPraiseMode: body.settings?.smsPraiseMode ?? true,
      customFunnyTemplate: body.settings?.customFunnyTemplate || "",
      customPraiseTemplate: body.settings?.customPraiseTemplate || "",
      sentMilestones: [],
    };
    (newSession as any).slides = normalizedSlides;
    (newSession as any).questions = normalizedSlides;
    (newSession as any).stage = "READY_CHECK";
    (newSession as any).stageStartedAt = liveSessionRecord.stageStartedAt;
    (newSession as any).stageEndsAt = liveSessionRecord.stageEndsAt;

    institutionalDb.liveSessions.unshift(newSession);

    if (competitionMode === "team") {
      TeamService.createTeamsForSession(newSession.id, teamSettings);
    }

    // Generate Host Reconnect Token
    const hostReconnectToken = ReconnectService.generateHostTokens(newSession.id);

    return NextResponse.json({
      success: true,
      message: "Live session initialized in READY_CHECK status with fully normalized slides.",
      session: {
        ...newSession,
        code: sessionCode,
        sessionCode,
        slides: normalizedSlides,
        stage: "READY_CHECK",
        stageStartedAt: liveSessionRecord.stageStartedAt,
        stageEndsAt: liveSessionRecord.stageEndsAt,
      },
      liveRecord: liveSessionRecord,
      hostReconnectToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create live session" },
      { status: 500 }
    );
  }
}
