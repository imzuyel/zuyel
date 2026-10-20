import { institutionalDb, LiveQuizAuditLog } from "./database";
import { SecurityService } from "./reconnectService";

export interface ProctoringViolation {
  id: string;
  sessionId: string;
  playerId: string;
  playerName: string;
  type: "TAB_SWITCH" | "WINDOW_BLUR" | "FULLSCREEN_EXIT" | "DEVTOOLS_SHORTCUT" | "RIGHT_CLICK" | "AUTO_SUBMIT";
  warningNumber: number;
  maxWarnings: number;
  timestamp: string;
  details?: string;
}

export const PROCTORING_CONFIG = {
  MAX_STRIKES: 3,
  STRICT_FULLSCREEN_REQUIRED: true,
  AUTO_SUBMIT_ON_MAX_STRIKES: true,
  DISABLE_CONTEXT_MENU: true,
  DISABLE_DEVTOOLS_KEYS: true,
};

// In-memory store for active session proctoring strikes
const activeStrikesMap = new Map<string, number>();

export const ProctoringService = {
  getStrikesKey(sessionId: string, playerId: string) {
    return `${sessionId}:${playerId}`;
  },

  getStrikes(sessionId: string, playerId: string): number {
    const key = this.getStrikesKey(sessionId, playerId);
    return activeStrikesMap.get(key) || 0;
  },

  recordViolation(
    sessionId: string,
    playerId: string,
    playerName: string,
    type: ProctoringViolation["type"],
    details?: string,
    ipAddress?: string,
    userAgent?: string
  ): {
    strikes: number;
    maxStrikes: number;
    isDisqualified: boolean;
    auditLog: LiveQuizAuditLog;
  } {
    const key = this.getStrikesKey(sessionId, playerId);
    const currentStrikes = (activeStrikesMap.get(key) || 0) + 1;
    activeStrikesMap.set(key, currentStrikes);

    const isDisqualified = currentStrikes >= PROCTORING_CONFIG.MAX_STRIKES;

    const eventType = isDisqualified
      ? ("RATE_LIMIT_TRIGGERED" as const)
      : ("UNAUTHORIZED_HOST_ACTION" as const);

    const message = `[PROCTORING ALERT] ${playerName} (${playerId}) violation: ${type} (Strike ${currentStrikes}/${PROCTORING_CONFIG.MAX_STRIKES}). ${details || ""}`;

    const auditLog = SecurityService.logAudit(
      sessionId,
      eventType,
      message,
      playerId,
      ipAddress,
      userAgent
    );

    // Update participant record with security strike count
    const participant = institutionalDb.liveParticipants.find(
      (p) => p.id === playerId && p.sessionId === sessionId
    );
    if (participant) {
      (participant as any).proctoringStrikes = currentStrikes;
      (participant as any).isDisqualified = isDisqualified;
      (participant as any).lastSecurityIncident = new Date().toISOString();
    }

    return {
      strikes: currentStrikes,
      maxStrikes: PROCTORING_CONFIG.MAX_STRIKES,
      isDisqualified,
      auditLog,
    };
  },

  resetStrikes(sessionId: string, playerId: string) {
    const key = this.getStrikesKey(sessionId, playerId);
    activeStrikesMap.delete(key);
  },
};
