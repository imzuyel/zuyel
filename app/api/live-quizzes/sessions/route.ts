import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, LiveSession } from "@/lib/database";
import { ReconnectService } from "@/lib/reconnectService";
import { TeamService } from "@/lib/teamService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hostId = searchParams.get("hostUserId");

    let sessions = [...institutionalDb.liveSessions];
    if (hostId) {
      sessions = sessions.filter(s => s.hostUserId === parseInt(hostId));
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
    const { quizId, hostUserId, competitionMode, teamSettings, motivationEnabled, motivationInterval, scheduledStartTime, scheduledAt } = body;

    if (!quizId) {
      return NextResponse.json(
        { success: false, message: "Quiz ID is required" },
        { status: 400 }
      );
    }

    // Verify quiz exists
    const quiz = institutionalDb.quizzes.find(q => String(q.id) === String(quizId));
    // Also check preloaded quizzes if not found
    const strQuizId = String(quizId || "");
    const quizExists = quiz || strQuizId.startsWith("comp-") || strQuizId.startsWith("elec-") || strQuizId.startsWith("fourth-");

    if (!quizExists) {
      // Just in case it's not found in our db list, let's still allow it or check Preloaded
      console.warn(`Quiz with ID ${quizId} not found in database, creating anyway for flexibility`);
    }

    // Generate a unique 6-digit game PIN (active sessions only)
    let sessionCode = "";
    let attempts = 0;
    while (attempts < 10) {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const duplicate = institutionalDb.liveSessions.some(
        s => s.sessionCode === pin && ["CREATED", "LOBBY"].includes(s.status)
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

    const joinToken = `join-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newSession: LiveSession = {
      id: `session-${Date.now()}`,
      quizId,
      hostUserId: Number(hostUserId) || 3, // Defaults to Mahmudul Hasan (teacher id: 3)
      sessionCode,
      joinToken,
      status: "LOBBY",
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

    institutionalDb.liveSessions.unshift(newSession);

    if (competitionMode === "team") {
      TeamService.createTeamsForSession(newSession.id, teamSettings);
    }

    // Generate Host Reconnect Token
    const hostReconnectToken = ReconnectService.generateHostTokens(newSession.id);

    return NextResponse.json({
      success: true,
      message: "Live session initialized in LOBBY status.",
      session: newSession,
      hostReconnectToken
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create live session" },
      { status: 500 }
    );
  }
}
