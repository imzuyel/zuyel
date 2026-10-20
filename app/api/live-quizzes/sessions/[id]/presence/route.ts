import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { SecurityService, PresenceService } from "@/lib/reconnectService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (SecurityService.isRateLimited(`presence-${ipAddress}`, 30, 60000)) {
      return NextResponse.json(
        { success: false, message: "Too many presence queries" },
        { status: 429 }
      );
    }

    // Refresh presence timeouts
    PresenceService.processPresenceTimeouts();

    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Live quiz session not found" },
        { status: 404 }
      );
    }

    // Get all participants under this session with their presence status
    const participants = institutionalDb.liveParticipants
      .filter(p => p.sessionId === sessionId)
      .map(p => ({
        id: p.id,
        displayName: p.displayName,
        studentId: p.studentId,
        joinedAt: p.joinedAt,
        status: p.status, // JOINED or LEFT
        connectionStatus: p.connectionStatus || "online", // online, disconnected, left
        score: p.totalScore || 0,
        streak: p.currentStreak || 0,
        rank: p.rank || 0
      }));

    // Get audit logs for this session
    const auditLogs = institutionalDb.liveQuizAuditLogs
      .filter(log => log.sessionId === sessionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      hostConnectionStatus: session.hostConnectionStatus || "online",
      participants,
      auditLogs
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch presence" },
      { status: 500 }
    );
  }
}
