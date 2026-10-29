import { institutionalDb, LiveQuizAuditLog } from "./database";
import { getSessionQuestions, computeQuizSequenceState } from "./liveQuizHelper";
import { TeamService } from "./teamService";

export const RECONNECT_SETTINGS = {
  HEARTBEAT_INTERVAL: 2500, // Client heartbeat interval
  PRESENCE_TIMEOUT: 6000,    // Considered disconnected if no contact for 6s
  RECONNECT_GRACE_PERIOD: 25000, // 25s grace period to reconnect
  MAX_RECONNECT_RETRIES: 5,
};

// In-memory sliding window rate limiter
const requestLogs = new Map<string, number[]>();

// A presence sweep walks every participant and session. Heartbeat, realtime
// and presence polling can all trigger it, so enforce a single global cadence
// instead of one full sweep per request.
const PRESENCE_SWEEP_INTERVAL_MS = 2000;
let lastPresenceSweepAt = 0;

export const SecurityService = {
  logAudit(
    sessionId: string,
    eventType: LiveQuizAuditLog["eventType"],
    message: string,
    playerId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const log: LiveQuizAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      playerId,
      eventType,
      message,
      ipAddress: ipAddress || "unknown",
      userAgent: userAgent || "unknown",
      createdAt: new Date().toISOString(),
    };
    institutionalDb.liveQuizAuditLogs.push(log);
    console.log(`[QUIZ AUDIT LOG] [${eventType}] Session: ${sessionId}, Player: ${playerId || "N/A"} - ${message}`);
    return log;
  },

  isRateLimited(key: string, limit = 60, windowMs = 60000): boolean {
    const now = Date.now();

    // Bound memory: prune keys that have been quiet for longer than the
    // window before the map can grow with every player that ever connected.
    if (requestLogs.size > 10000) {
      for (const [logKey, logTimestamps] of requestLogs) {
        const last = logTimestamps[logTimestamps.length - 1] || 0;
        if (now - last >= windowMs) {
          requestLogs.delete(logKey);
        }
      }
    }

    const timestamps = requestLogs.get(key) || [];
    const validTimestamps = timestamps.filter(t => now - t < windowMs);
    validTimestamps.push(now);
    requestLogs.set(key, validTimestamps);
    return validTimestamps.length > limit;
  }
};

export const PresenceService = {
  updateHeartbeat(sessionId: string, playerId: string, connectionId?: string) {
    const now = new Date();
    const participant = institutionalDb.liveParticipants.find(
      p => p.sessionId === sessionId && p.id === playerId
    );
    if (participant) {
      participant.lastSeenAt = now.toISOString();
      participant.connectionStatus = "online";
      participant.status = "JOINED"; // Keep standard status consistent

      if (connectionId) {
        if (participant.lastConnectionId && participant.lastConnectionId !== connectionId) {
          SecurityService.logAudit(
            sessionId,
            "DUPLICATE_CONNECTION",
            `Duplicate connection detected for player ${participant.displayName}. Superseded last connection.`,
            playerId
          );
        }
        participant.lastConnectionId = connectionId;
      }
      return true;
    }
    return false;
  },

  updateHostHeartbeat(sessionId: string, connectionId?: string) {
    const now = new Date();
    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (session) {
      session.hostLastSeenAt = now.toISOString();
      session.hostConnectionStatus = "online";
      return true;
    }
    return false;
  },

  processPresenceTimeouts(force = false) {
    const now = Date.now();

    // Timeout resolution only needs second-level accuracy (the reconnect
    // grace period is 25s). Skipping redundant sweeps avoids O(n) work per
    // polling request at classroom scale.
    if (!force && now - lastPresenceSweepAt < PRESENCE_SWEEP_INTERVAL_MS) {
      return;
    }
    lastPresenceSweepAt = now;

    // Process participants
    for (const p of institutionalDb.liveParticipants) {
      if (p.status !== "JOINED") continue;
      
      const lastSeen = new Date(p.lastSeenAt).getTime();
      const diff = now - lastSeen;
      
      // If elapsed exceeds presence timeout + grace period, mark as fully LEFT
      if (diff > RECONNECT_SETTINGS.PRESENCE_TIMEOUT + RECONNECT_SETTINGS.RECONNECT_GRACE_PERIOD) {
        if (p.connectionStatus !== "left") {
          p.connectionStatus = "left";
          p.status = "LEFT"; // Fully clean up from lobby after grace period
          SecurityService.logAudit(
            p.sessionId,
            "PLAYER_DISCONNECTED",
            `Participant ${p.displayName} disconnected permanently after exceeding grace period.`,
            p.id
          );
        }
      } else if (diff > RECONNECT_SETTINGS.PRESENCE_TIMEOUT) {
        // Disconnected but in grace period
        if (p.connectionStatus !== "disconnected" && p.connectionStatus !== "left") {
          p.connectionStatus = "disconnected";
          SecurityService.logAudit(
            p.sessionId,
            "PLAYER_DISCONNECTED",
            `Participant ${p.displayName} went offline (grace period started).`,
            p.id
          );
        }
      }
    }

    // Process host presence
    for (const s of institutionalDb.liveSessions) {
      if (!s.hostLastSeenAt) continue;
      if (s.status === "COMPLETED" || s.status === "CANCELLED" || s.status === "EXPIRED") continue;
      
      const lastSeen = new Date(s.hostLastSeenAt).getTime();
      const diff = now - lastSeen;
      
      if (diff > RECONNECT_SETTINGS.PRESENCE_TIMEOUT + RECONNECT_SETTINGS.RECONNECT_GRACE_PERIOD) {
        if (s.hostConnectionStatus !== "disconnected") {
          s.hostConnectionStatus = "disconnected";
          SecurityService.logAudit(
            s.id,
            "UNAUTHORIZED_HOST_ACTION",
            `Host connection permanently offline. Quiz continues server-authoritatively.`,
            undefined
          );
        }
      } else if (diff > RECONNECT_SETTINGS.PRESENCE_TIMEOUT) {
        if (s.hostConnectionStatus === "online") {
          s.hostConnectionStatus = "reconnecting";
          SecurityService.logAudit(
            s.id,
            "UNAUTHORIZED_HOST_ACTION",
            `Host went offline. Host is attempting reconnect.`,
            undefined
          );
        }
      }
    }
  }
};

export const ReconnectService = {
  generateTokens(sessionId: string, playerId: string): string {
    const token = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 mins
    
    const participant = institutionalDb.liveParticipants.find(
      p => p.sessionId === sessionId && p.id === playerId
    );
    if (participant) {
      participant.reconnectTokenHash = token;
      participant.reconnectTokenExpiresAt = expiresAt;
    }
    return token;
  },

  generateHostTokens(sessionId: string): string {
    const token = `rec-host-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    
    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (session) {
      session.hostReconnectTokenHash = token;
      session.hostReconnectTokenExpiresAt = expiresAt;
    }
    return token;
  },

  validateParticipantToken(sessionId: string, playerId: string, token: string): boolean {
    const participant = institutionalDb.liveParticipants.find(
      p => p.sessionId === sessionId && p.id === playerId
    );
    if (!participant) return false;
    if (!participant.reconnectTokenHash || participant.reconnectTokenHash !== token) return false;
    
    const expires = participant.reconnectTokenExpiresAt ? new Date(participant.reconnectTokenExpiresAt) : null;
    if (!expires || expires < new Date()) {
      return false;
    }
    return true;
  },

  validateHostToken(sessionId: string, token: string): boolean {
    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) return false;
    if (!session.hostReconnectTokenHash || session.hostReconnectTokenHash !== token) return false;
    
    const expires = session.hostReconnectTokenExpiresAt ? new Date(session.hostReconnectTokenExpiresAt) : null;
    if (!expires || expires < new Date()) {
      return false;
    }
    return true;
  }
};

export const SessionRecoveryService = {
  recoverParticipantState(sessionId: string, playerId: string) {
    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) return null;
    
    const participant = institutionalDb.liveParticipants.find(
      p => p.id === playerId && p.sessionId === sessionId
    );
    if (!participant) return null;

    const questions = getSessionQuestions(session.quizId);
    const totalQuestions = questions.length;
    const currentIdx = session.currentQuestionIndex || 0;
    
    let currentQuestion: any = null;
    let answered = false;
    let originalAnswer: any = null;

    const originalQ = totalQuestions > 0 && currentIdx < totalQuestions ? (questions[currentIdx] as any) : null;
    const sequenceState = computeQuizSequenceState(session, originalQ?.timeLimit || 30);

    if ((session.isQuizModeStarted || (session.status as string) === "READY" || session.status === "QUESTION_ACTIVE") && originalQ) {
      
      // Determine what to show based on authoritative sequence phase:
      // In READY / COUNTDOWN: questionText and options are masked so nothing is revealed prematurely
      // In QUESTION_PREVIEW: questionText is revealed, but options are NOT revealed
      // In QUESTION_ACTIVE / QUESTION_ENDED: both questionText and options are fully revealed
      const showQuestionText = sequenceState.phase !== "COUNTDOWN" && sequenceState.phase !== "READY";
      const showOptions = sequenceState.isOptionsRevealed;

      currentQuestion = {
        id: originalQ.id,
        questionText: showQuestionText ? (originalQ.questionText || originalQ.title || "") : "",
        title: originalQ.title || originalQ.questionText || "",
        type: originalQ.type,
        questionType: originalQ.questionType || originalQ.type,
        options: showOptions ? (originalQ.options || []) : [],
        optionsRevealed: showOptions,
        matchingPairs: showOptions ? (originalQ.matchingPairs || originalQ.pairs) : undefined,
        pairs: showOptions ? (originalQ.pairs || originalQ.matchingPairs) : undefined,
        sentenceWithBlank: originalQ.sentenceWithBlank || ((originalQ.type || "").toUpperCase() === "FILL_BLANKS" ? (originalQ.questionText || originalQ.title) : undefined),
        blankAnswer: session.status === "QUESTION_ENDED" ? (originalQ.blankAnswer || originalQ.correctAnswer) : undefined,
        reorderItems: showOptions ? (originalQ.reorderItems || originalQ.items || originalQ.correctOrder) : undefined,
        items: showOptions ? (originalQ.items || originalQ.reorderItems || originalQ.correctOrder) : undefined,
        correctOrder: session.status === "QUESTION_ENDED" ? (originalQ.correctOrder || originalQ.items) : undefined,
        acceptedAnswers: showOptions ? (originalQ.acceptedAnswers || (originalQ.blankAnswer ? [originalQ.blankAnswer] : [])) : [],
        questionData: originalQ.questionData ? { ...originalQ.questionData } : undefined,
        timeLimit: originalQ.timeLimit,
        marks: originalQ.marks || originalQ.points || 100,
        points: originalQ.points || originalQ.marks || 100,
      };

      // Security validation: anti-cheat data leakage mask before end of question
      if (session.status !== "QUESTION_ENDED" && currentQuestion.questionData) {
        delete currentQuestion.questionData.correctIndex;
        delete currentQuestion.questionData.correctAnswer;
        delete currentQuestion.questionData.correctAnswers;
        delete currentQuestion.questionData.explanation;
        if (currentQuestion.questionData.pairs) {
          currentQuestion.questionData.pairs = currentQuestion.questionData.pairs.map((p: any) => ({
            left: p.left,
            right: p.right
          }));
        }
      } else if (session.status === "QUESTION_ENDED") {
        currentQuestion.correctAnswer = originalQ.correctAnswer;
        currentQuestion.explanation = originalQ.questionData?.explanation;
      }

      const answer = institutionalDb.liveAnswers.find(
        a => a.sessionId === sessionId && a.playerId === playerId && a.questionId === originalQ.id
      );
      if (answer) {
        answered = true;
        originalAnswer = {
          id: answer.id,
          answerPayload: answer.answerPayload,
          isCorrect: answer.isCorrect,
          answerStatus: answer.answerStatus,
          basePoints: answer.basePoints || 0,
          speedBonus: answer.speedBonus || 0,
          streakBonus: answer.streakBonus || 0,
          penalty: answer.penalty || 0,
          totalPoints: answer.totalPoints || 0
        };
      }
    }

    let teamLeaderboard: any[] = [];
    let playerTeam: any = null;
    if (session.competitionMode === "team") {
      teamLeaderboard = TeamService.getTeamLeaderboard(sessionId);
      const membership = institutionalDb.liveTeamMembers.find(tm => tm.sessionId === sessionId && tm.playerId === playerId);
      if (membership) {
        const t = institutionalDb.liveTeams.find(team => team.id === membership.teamId);
        if (t) {
          const teamInfo = teamLeaderboard.find(item => item.teamId === t.id);
          playerTeam = teamInfo || { teamId: t.id, name: t.name, displayName: t.displayName, color: t.color };
        }
      }
    }

    return {
      session: {
        id: session.id,
        status: session.status,
        phase: sequenceState.phase,
        countdownSeconds: sequenceState.countdownSecondsRemaining,
        previewSeconds: sequenceState.previewSecondsRemaining,
        mainTimerSeconds: sequenceState.mainTimerSecondsRemaining,
        isOptionsRevealed: sequenceState.isOptionsRevealed,
        canSubmitAnswer: sequenceState.canSubmitAnswer && !answered,
        isLocked: session.isLocked,
        competitionMode: session.competitionMode || "individual",
        isTeamLocked: session.isTeamLocked || false,
        teamLeaderboard,
        playerTeam,
        currentQuestionIndex: currentIdx,
        sequenceStartedAt: (session as any).sequenceStartedAt,
        countdownEndsAt: (session as any).countdownEndsAt,
        previewEndsAt: (session as any).previewEndsAt,
        questionStartedAt: session.questionStartedAt,
        questionEndsAt: session.questionEndsAt,
        totalQuestions
      },
      sequenceState,
      participant: {
        id: participant.id,
        displayName: participant.displayName,
        studentId: participant.studentId,
        score: participant.totalScore || 0,
        streak: participant.currentStreak || 0,
        rank: participant.rank || 0,
        previousRank: participant.previousRank || 0,
        connectionStatus: participant.connectionStatus || "online",
        playerTeam
      },
      currentQuestion,
      answered,
      originalAnswer
    };
  }
};
