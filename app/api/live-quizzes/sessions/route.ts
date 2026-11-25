import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, LiveSession } from "@/lib/database";
import { ReconnectService } from "@/lib/reconnectService";
import { TeamService } from "@/lib/teamService";
import {
  createLiveSession,
  getLiveSession,
  listLiveSessions,
  normalizeSlide,
  LiveSessionRecord,
} from "@/lib/liveSessionStore";
import { getSessionQuestions } from "@/lib/liveQuizHelper";
import { getHybridStore } from "@/lib/hybridStorageEngine";
import { prisma, isPrismaAvailable } from "@/lib/prisma";

function buildSessionHistorySummary(session: LiveSessionRecord) {
  const playersArr = Object.values(session.players || {}).sort(
    (a, b) => (b.score || 0) - (a.score || 0)
  );
  const topScorer = playersArr[0] || null;
  const totalQuestions = Math.max(1, session.slides?.length || 1);
  const answeredSlideIndices = Object.keys(session.answers || {}).filter(
    (k) => Object.keys(session.answers[k] || {}).length > 0
  );
  const maxAnsweredSlide = answeredSlideIndices.reduce((acc, k) => {
    const idx = parseInt(k, 10);
    return Number.isFinite(idx) && idx + 1 > acc ? idx + 1 : acc;
  }, 0);

  const questionsCompleted =
    session.status === "ENDED"
      ? totalQuestions
      : Math.max(
          maxAnsweredSlide,
          session.stage === "RESULT_REVEAL"
            ? Math.min(totalQuestions, (session.currentSlideIndex || 0) + 1)
            : session.currentSlideIndex || 0
        );

  const questionAnalytics = (session.slides || []).map((slide, idx) => {
    const slideAnswers = Object.values((session.answers || {})[String(idx)] || {});
    const correctCount = slideAnswers.filter((a) => a.isCorrect).length;
    const answeredCount = slideAnswers.length;
    return {
      slideIndex: idx,
      questionText: slide.questionText || slide.title || slide.question || `প্রশ্ন ${idx + 1}`,
      questionType: slide.type || slide.questionType || "MCQ",
      answeredCount,
      correctCount,
      accuracy: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0,
    };
  });

  // Per-student detailed breakdown including per-question answers
  const studentDetails = playersArr.map((p, idx) => {
    const playerAnswers = Object.entries(session.answers || {})
      .map(([slideIdxStr, byPlayer]) => {
        const ans = byPlayer?.[p.id];
        if (!ans) return null;
        const sIdx = parseInt(slideIdxStr, 10);
        const slide = session.slides?.[sIdx];
        return {
          slideIndex: sIdx,
          questionText: slide?.questionText || slide?.title || slide?.question || `প্রশ্ন ${sIdx + 1}`,
          answerPayload: ans.answerPayload,
          isCorrect: ans.isCorrect,
          points: ans.points,
          responseTimeMs: ans.responseTimeMs,
        };
      })
      .filter(Boolean);

    return {
      id: p.id,
      name: p.name,
      roll: p.roll || "—",
      avatar: p.avatar || "🚀",
      score: p.score || 0,
      streak: p.streak || 0,
      rank: idx + 1,
      answeredCount: playerAnswers.length,
      correctCount: playerAnswers.filter((a: any) => a?.isCorrect).length,
      answers: playerAnswers,
    };
  });

  return {
    id: session.id,
    code: session.code,
    quizId: session.quizId || "",
    title: session.title || "লাইভ কুইজ সেশন",
    className: session.className,
    trade: session.trade,
    subject: session.subject,
    status: session.status,
    stage: session.stage,
    currentSlideIndex: session.currentSlideIndex || 0,
    totalQuestions,
    questionsCompleted,
    playerCount: playersArr.length,
    topScorer: topScorer
      ? {
          id: topScorer.id,
          name: topScorer.name,
          roll: topScorer.roll || "—",
          avatar: topScorer.avatar || "👑",
          score: topScorer.score || 0,
        }
      : null,
    avgScore:
      playersArr.length > 0
        ? Math.round(playersArr.reduce((acc, p) => acc + (p.score || 0), 0) / playersArr.length)
        : 0,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    pausedAt: session.pausedAt,
    endedAt: session.endedAt,
    slides: session.slides || [],
    players: session.players || {},
    answers: session.answers || {},
    studentDetails,
    questionAnalytics,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hostId = searchParams.get("hostUserId");
    const code = searchParams.get("code") || searchParams.get("pin");
    const quizId = searchParams.get("quizId");
    const includeHistory = searchParams.get("includeHistory") === "1";

    if (code) {
      const session = getLiveSession(code);
      if (session) {
        return NextResponse.json({
          success: true,
          session,
        });
      }
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_CODE",
          message: "❌ ভুল রুম কোড! সঠিক ৬ ডিজিটের কোড দাও।",
        },
        { status: 404 }
      );
    }

    // If querying for a specific quizId OR requesting session history (Tasks 4 & 5)
    if (quizId || includeHistory) {
      const liveStoreList = listLiveSessions(quizId ? { quizId } : undefined);
      const summaryMap = new Map<string, any>();

      for (const sess of liveStoreList) {
        summaryMap.set(sess.id, buildSessionHistorySummary(sess));
      }

      // Also merge archived QuizResults from hybridStorageEngine if not already present in liveStoreList
      try {
        const store = getHybridStore();
        const results = Array.isArray(store.quizResults) ? store.quizResults : [];
        for (const resItem of results) {
          if (quizId && String(resItem.quizId || "") !== String(quizId)) continue;
          const sid = String(resItem.sessionId || resItem.id);
          if (!summaryMap.has(sid)) {
            const rawParts = Array.isArray(resItem.rawParticipants)
              ? resItem.rawParticipants
              : Array.isArray(resItem.topPerformers)
              ? resItem.topPerformers
              : [];
            const top = rawParts[0] || null;
            summaryMap.set(sid, {
              id: sid,
              code: resItem.sessionCode || "—",
              quizId: resItem.quizId || "",
              title: resItem.title || "লাইভ কুইজ সেশন",
              className: resItem.className || "",
              trade: resItem.trade || "",
              subject: resItem.subject || "",
              status: "ENDED",
              stage: "ENDED",
              currentSlideIndex: Math.max(0, (resItem.totalQuestions || 1) - 1),
              totalQuestions: resItem.totalQuestions || 1,
              questionsCompleted: resItem.questionsCompleted || resItem.totalQuestions || 1,
              playerCount: resItem.totalParticipants || rawParts.length,
              topScorer: top
                ? {
                    id: top.id,
                    name: top.name,
                    roll: top.roll || "—",
                    avatar: top.avatar || "👑",
                    score: top.score || 0,
                  }
                : null,
              avgScore: resItem.avgScore || 0,
              createdAt: resItem.completedAt ? new Date(resItem.completedAt).getTime() : Date.now(),
              updatedAt: resItem.completedAt ? new Date(resItem.completedAt).getTime() : Date.now(),
              endedAt: resItem.completedAt ? new Date(resItem.completedAt).getTime() : Date.now(),
              studentDetails: rawParts.map((p: any, idx: number) => ({
                id: p.id,
                name: p.name,
                roll: p.roll || "—",
                avatar: p.avatar || "🎓",
                score: p.score || 0,
                streak: p.streak || 0,
                rank: p.rank || idx + 1,
                answeredCount: 0,
                correctCount: 0,
                answers: [],
              })),
              questionAnalytics: resItem.questionAnalytics || [],
            });
          }
        }
      } catch {
        // ignore hybrid store error
      }

      // Merge MySQL QuizResult & LiveSession rows if online and not yet present
      if (isPrismaAvailable() && prisma) {
        try {
          const numericQuizId = quizId ? parseInt(String(quizId).replace(/\D/g, ""), 10) : NaN;
          if (prisma.liveSession && (!quizId || !Number.isNaN(numericQuizId))) {
            const dbSessions = await prisma.liveSession.findMany({
              where: !Number.isNaN(numericQuizId) ? { quizId: numericQuizId } : undefined,
              orderBy: { updatedAt: "desc" },
              take: 30,
            });
            for (const ds of dbSessions) {
              let parsedMeta: any = null;
              try {
                parsedMeta = ds.participantsJson ? JSON.parse(ds.participantsJson) : null;
              } catch {
                parsedMeta = null;
              }
              const metaId = parsedMeta?.sessionId || `mysql-sess-${ds.id}`;
              if (!summaryMap.has(metaId)) {
                const playersArr = Array.isArray(parsedMeta?.players)
                  ? parsedMeta.players
                  : Array.isArray(parsedMeta)
                  ? parsedMeta
                  : [];
                const derivedStatus =
                  parsedMeta?.status ||
                  (ds.status === "COMPLETED" ? "ENDED" : ds.status === "CLOSED" ? "PAUSED" : ds.status);
                summaryMap.set(metaId, {
                  id: metaId,
                  code: ds.pin,
                  quizId: parsedMeta?.quizId || String(ds.quizId),
                  title: parsedMeta?.title || "লাইভ কুইজ সেশন",
                  status: derivedStatus,
                  stage: parsedMeta?.stage || (derivedStatus === "ENDED" ? "ENDED" : "READY_CHECK"),
                  currentSlideIndex: ds.currentQuestion || 0,
                  totalQuestions: ds.totalQuestions || 1,
                  questionsCompleted: ds.currentQuestion || 0,
                  playerCount: playersArr.length,
                  topScorer: playersArr[0] || null,
                  createdAt: new Date(ds.createdAt).getTime(),
                  updatedAt: new Date(ds.updatedAt).getTime(),
                  pausedAt: parsedMeta?.pausedAt,
                  endedAt: ds.endedAt ? new Date(ds.endedAt).getTime() : undefined,
                  studentDetails: playersArr.map((p: any, idx: number) => ({
                    id: p.id,
                    name: p.name,
                    roll: p.roll || "—",
                    avatar: p.avatar || "🎓",
                    score: p.score || 0,
                    streak: p.streak || 0,
                    rank: p.rank || idx + 1,
                    answeredCount: 0,
                    correctCount: 0,
                    answers: [],
                  })),
                  questionAnalytics: [],
                });
              }
            }
          }
        } catch {
          // Offline safe fallback
        }
      }

      const sessions = Array.from(summaryMap.values()).sort(
        (a, b) => (Number(b.updatedAt || b.createdAt) || 0) - (Number(a.updatedAt || a.createdAt) || 0)
      );
      const pausedSession = sessions.find((s) => s.status === "PAUSED") || null;

      return NextResponse.json({
        success: true,
        sessions,
        pausedSession,
        history: sessions,
      });
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
      if (!duplicate && !getLiveSession(pin, { skipLivenessCheck: true })) {
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
      hostLastSeenAt: Date.now(),
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
