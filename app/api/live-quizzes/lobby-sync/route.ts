import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, LiveParticipant, LiveSession } from "@/lib/database";
import { prisma, isPrismaAvailable } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const pin = searchParams.get("pin");

    institutionalDb.liveSessions = institutionalDb.liveSessions || [];
    institutionalDb.liveParticipants = institutionalDb.liveParticipants || [];

    // Find session by id or pin
    let session = institutionalDb.liveSessions.find(
      (s) => (sessionId && s.id === sessionId) || (pin && (s as any).pinCode === pin)
    );

    // If session doesn't exist yet in preview mode, instantiate clean mock session
    if (!session && (sessionId || pin)) {
      session = {
        id: sessionId || `sess_${pin || "demo"}`,
        quizId: "quiz-demo-101",
        hostUserId: 1,
        sessionCode: pin || "889120",
        pinCode: pin || "889120",
        quizPlateId: "qp_default",
        status: "LOBBY",
        maxPlayers: 100,
        isLocked: false,
        currentQuestionIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;
      institutionalDb.liveSessions.push(session as any);
    }

    const currentSessionId = session?.id || sessionId || "sess_demo";

    // Retrieve active participants for this session
    let participants = institutionalDb.liveParticipants.filter(
      (p) => p.sessionId === currentSessionId
    );

    // Fetch from MySQL if Prisma is operational
    if (isPrismaAvailable() && prisma) {
      try {
        const dbParticipants = await prisma.liveParticipant.findMany({
          where: { sessionId: currentSessionId },
          orderBy: { joinedAt: "asc" },
        });

        if (dbParticipants && dbParticipants.length > 0) {
          participants = dbParticipants.map((dp: any) => ({
            id: dp.id,
            sessionId: dp.sessionId,
            displayName: dp.displayName,
            avatarUrl: (dp as any).avatarUrl,
            status: dp.status as any,
            joinedAt: dp.joinedAt.toISOString(),
            lastSeenAt: dp.lastSeenAt.toISOString(),
            createdAt: dp.joinedAt.toISOString(),
            updatedAt: dp.lastSeenAt.toISOString(),
          }));
        }
      } catch (err) {
        console.warn("[Lobby-Sync GET] Prisma lookup skipped:", (err as Error).message);
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: currentSessionId,
      pin: session?.pinCode || pin || "889120",
      status: session?.status || "LOBBY",
      isLocked: !!session?.isLocked,
      participants: participants.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        avatarId: (p as any).avatarId || (p.avatar ? p.avatar.replace("avatar_", "") : "robot"),
        joinedAt: p.joinedAt,
      })),
      totalCount: participants.length,
      source: isPrismaAvailable() ? "mysql" : "in-memory",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "লবি ডেটা লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = "join", pin, displayName, avatarId = "robot", sessionId, playerId, isLocked } = body;

    institutionalDb.liveSessions = institutionalDb.liveSessions || [];
    institutionalDb.liveParticipants = institutionalDb.liveParticipants || [];

    // 1. ACTION: KICK PARTICIPANT
    if (action === "kick" && playerId) {
      institutionalDb.liveParticipants = institutionalDb.liveParticipants.filter(
        (p) => p.id !== playerId
      );

      if (isPrismaAvailable() && prisma) {
        try {
          await prisma.liveParticipant.delete({ where: { id: playerId } });
        } catch {
          // ignore
        }
      }

      return NextResponse.json({ success: true, message: "খেলোয়াড়কে লবি থেকে সরানো হয়েছে।" });
    }

    // 2. ACTION: TOGGLE LOCK STATE
    if (action === "toggleLock") {
      const targetSession = institutionalDb.liveSessions.find(
        (s) => s.id === sessionId || (pin && s.pinCode === pin)
      );

      if (targetSession) {
        targetSession.isLocked = Boolean(isLocked);
      }

      if (isPrismaAvailable() && prisma && sessionId) {
        try {
          await prisma.liveSession.update({
            where: { id: sessionId },
            data: { isLocked: Boolean(isLocked) },
          });
        } catch {
          // ignore
        }
      }

      return NextResponse.json({
        success: true,
        isLocked: Boolean(isLocked),
        message: isLocked ? "লবি লক করা হয়েছে।" : "লবি আনলক করা হয়েছে।",
      });
    }

    // 3. ACTION: JOIN LOBBY (Default)
    if (!pin) {
      return NextResponse.json(
        { success: false, error: "গেম পিন প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    if (!displayName || !displayName.trim()) {
      return NextResponse.json(
        { success: false, error: "ডাকনাম প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    // Locate session or create preview fallback
    let session = institutionalDb.liveSessions.find((s) => (s as any).pinCode === pin);
    if (!session) {
      session = {
        id: `sess_${pin}`,
        quizId: "quiz-demo-101",
        hostUserId: 1,
        sessionCode: pin,
        pinCode: pin,
        quizPlateId: "qp_default",
        status: "LOBBY",
        maxPlayers: 100,
        isLocked: false,
        currentQuestionIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;
      institutionalDb.liveSessions.push(session as any);
    }

    if ((session as any).isLocked) {
      return NextResponse.json(
        { success: false, error: "এই লবিটি বর্তমানে লক করা আছে। নতুন খেলোয়াড় যুক্ত হওয়া সম্ভব নয়।" },
        { status: 403 }
      );
    }

    const currentSessionId = session?.id || "sess_demo";
    const newPlayerId = playerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Upsert participant
    let existingPlayer = institutionalDb.liveParticipants.find(
      (p) => p.sessionId === currentSessionId && (p.id === newPlayerId || p.displayName === displayName.trim())
    );

    if (existingPlayer) {
      existingPlayer.displayName = displayName.trim();
      (existingPlayer as any).avatarId = avatarId;
      existingPlayer.lastSeenAt = new Date().toISOString();
    } else {
      existingPlayer = {
        id: newPlayerId,
        sessionId: currentSessionId,
        displayName: displayName.trim(),
        playerToken: `TOKEN-${newPlayerId}`,
        status: "JOINED",
        joinedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalScore: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        unanswered: 0,
        currentStreak: 0,
        bestStreak: 0,
        rank: institutionalDb.liveParticipants.length + 1,
      };
      (existingPlayer as any).avatarId = avatarId;
      institutionalDb.liveParticipants.push(existingPlayer);
    }

    // MySQL Sync via Prisma if active
    if (isPrismaAvailable() && prisma) {
      try {
        await prisma.liveParticipant.upsert({
          where: { id: existingPlayer.id },
          create: {
            id: existingPlayer.id,
            sessionId: currentSessionId,
            displayName: existingPlayer.displayName,
            playerToken: existingPlayer.playerToken,
            status: "JOINED",
            joinedAt: new Date(),
            lastSeenAt: new Date(),
          },
          update: {
            displayName: existingPlayer.displayName,
            lastSeenAt: new Date(),
          },
        });
      } catch (err) {
        console.warn("[Lobby-Sync POST] Prisma upsert skipped:", (err as Error).message);
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: currentSessionId,
      player: {
        id: existingPlayer.id,
        displayName: existingPlayer.displayName,
        avatarId,
      },
      message: "লবিতে সফলভাবে যুক্ত হয়েছেন।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "লবি সিঙ্কে সমস্যা দেখা দিয়েছে।" },
      { status: 500 }
    );
  }
}
