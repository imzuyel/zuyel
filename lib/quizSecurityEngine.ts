/**
 * Live Quiz Anti-Cheat, Streak & Fair-Play Security Engine
 * Panchagarh Government Technical School & College (PTSC) ERP
 * 
 * Provides server-authoritative evaluation:
 * 1. Anti-cheat tab switch & window blur detection
 * 2. Bot & spam clicker guard (<500ms impossible reaction time)
 * 3. Dynamic streak multipliers and speed bonuses
 * 4. Team-mode aggregations & rankings
 */

import { institutionalDb, LiveParticipant, LiveTeam } from "./database";

export const MIN_HUMAN_RESPONSE_TIME_MS = 500;
export const DEFAULT_QUESTION_TIME_LIMIT_MS = 30000;
export const MAX_BASE_POINTS = 1000;

export interface AntiCheatEvaluationParams {
  playerId: string;
  questionId: string;
  answerPayload: any;
  correctAnswer: any;
  responseTimeMs: number;
  timeLimitMs?: number;
  currentStreak: number;
  tabSwitchCount?: number;
}

export interface SecurityEvaluationResult {
  isCorrect: boolean;
  basePoints: number;
  speedBonus: number;
  streakBonus: number;
  penalty: number;
  totalPoints: number;
  newStreak: number;
  isFlagged: boolean;
  flagReason?: string;
  securityNotice?: string;
}

export interface TeamLeaderboardEntry {
  teamId: string;
  name: string;
  displayName: string;
  color: string;
  totalScore: number;
  averageScore: number;
  membersCount: number;
  rank: number;
  rankChange?: "up" | "down" | "same";
  topScorerName?: string;
  topScorerPoints?: number;
}

export class QuizSecurityEngine {
  /**
   * Evaluates an answer with anti-cheat protection, bot guarding, and streak calculations
   */
  public static evaluateAnswer(params: AntiCheatEvaluationParams): SecurityEvaluationResult {
    const {
      answerPayload,
      correctAnswer,
      responseTimeMs,
      timeLimitMs = DEFAULT_QUESTION_TIME_LIMIT_MS,
      currentStreak = 0,
      tabSwitchCount = 0,
    } = params;

    // 1. Bot & Spam Clicker Protection (<500ms reaction threshold)
    if (responseTimeMs < MIN_HUMAN_RESPONSE_TIME_MS) {
      return {
        isCorrect: false,
        basePoints: 0,
        speedBonus: 0,
        streakBonus: 0,
        penalty: 100,
        totalPoints: 0,
        newStreak: 0,
        isFlagged: true,
        flagReason: "BOT_SPEED_FLAGGED",
        securityNotice: `অস্বাভাবিক দ্রুত রেসপন্স (${responseTimeMs}ms < ৫০০ms)। ফেয়ার-প্লে নীতি লঙ্ঘনের কারণে পয়েন্ট বাতিল।`,
      };
    }

    // 2. Answer Correctness Check
    const isCorrect = this.checkCorrectness(answerPayload, correctAnswer);

    if (!isCorrect) {
      return {
        isCorrect: false,
        basePoints: 0,
        speedBonus: 0,
        streakBonus: 0,
        penalty: 0,
        totalPoints: 0,
        newStreak: 0,
        isFlagged: false,
      };
    }

    // 3. Dynamic Time & Speed Score Calculation
    // Faster responses earn proportionally higher speed bonus (up to 1,000 points)
    const validResponseTime = Math.min(responseTimeMs, timeLimitMs);
    const speedFraction = Math.max(0, 1 - validResponseTime / timeLimitMs);
    const basePoints = Math.round(500 + 300 * speedFraction);
    const speedBonus = Math.round(200 * speedFraction);

    // 4. Server-Side Streak Multiplier Calculation
    const newStreak = currentStreak + 1;
    let streakBonus = 0;
    if (newStreak === 2) streakBonus = 100;
    else if (newStreak === 3) streakBonus = 250;
    else if (newStreak === 4) streakBonus = 500;
    else if (newStreak >= 5) streakBonus = 1000; // On Fire 🔥

    let subTotal = basePoints + speedBonus + streakBonus;

    // 5. Tab Switch & Window Blur Penalties
    let penalty = 0;
    let isFlagged = false;
    let flagReason: string | undefined = undefined;
    let securityNotice: string | undefined = undefined;

    if (tabSwitchCount === 1) {
      securityNotice = "সতর্কতা: ১ বার ট্যাব পরিবর্তন সনাক্ত হয়েছে। পরবর্তী পরিবর্তনে পয়েন্ট কাটা যাবে।";
    } else if (tabSwitchCount === 2) {
      penalty = Math.round(subTotal * 0.15); // 15% deduction
      subTotal = Math.max(0, subTotal - penalty);
      securityNotice = "পেনাল্টি: একাধিকবার ট্যাব পরিবর্তনের জন্য ১৫% পয়েন্ট কর্তন করা হয়েছে।";
    } else if (tabSwitchCount >= 3) {
      penalty = Math.round(subTotal * 0.35); // 35% deduction
      subTotal = Math.max(0, subTotal - penalty);
      isFlagged = true;
      flagReason = "SUSPICIOUS_TAB_SWITCHING";
      securityNotice = "গুরুতর ফ্ল্যাগ: ৩ বা ততোধিক বার ব্রাউজার উইন্ডো পরিবর্তন সনাক্ত হয়েছে।";
    }

    return {
      isCorrect: true,
      basePoints,
      speedBonus,
      streakBonus,
      penalty,
      totalPoints: subTotal,
      newStreak,
      isFlagged,
      flagReason,
      securityNotice,
    };
  }

  /**
   * Robust comparison of user payload with correct answer (supports indices, numbers, arrays, strings)
   */
  private static checkCorrectness(submitted: any, correct: any): boolean {
    if (submitted === null || submitted === undefined || correct === null || correct === undefined) {
      return false;
    }

    if (Array.isArray(submitted) && Array.isArray(correct)) {
      if (submitted.length !== correct.length) return false;
      const sSorted = [...submitted].sort();
      const cSorted = [...correct].sort();
      return sSorted.every((val, idx) => String(val).trim() === String(cSorted[idx]).trim());
    }

    return String(submitted).trim().toLowerCase() === String(correct).trim().toLowerCase();
  }

  /**
   * Aggregates team mode scores and calculates team rankings
   */
  public static aggregateTeamScores(
    sessionId: string,
    participants: LiveParticipant[],
    teams: LiveTeam[]
  ): TeamLeaderboardEntry[] {
    const sessionTeams = (teams || []).filter((t) => t.sessionId === sessionId);
    const sessionParticipants = (participants || []).filter((p) => p.sessionId === sessionId);
    const sessionMembers = institutionalDb.liveTeamMembers.filter((m) => m.sessionId === sessionId);

    const teamScoresMap: Record<
      string,
      { totalScore: number; membersCount: number; topScorerName?: string; topScorerPoints?: number }
    > = {};

    sessionTeams.forEach((t) => {
      teamScoresMap[t.id] = { totalScore: 0, membersCount: 0 };
    });

    sessionMembers.forEach((tm) => {
      const p = sessionParticipants.find((part) => part.id === tm.playerId);
      const stats = teamScoresMap[tm.teamId];
      if (p && stats) {
        stats.membersCount++;
        stats.totalScore += p.totalScore || 0;

        if (!stats.topScorerPoints || (p.totalScore || 0) > stats.topScorerPoints) {
          stats.topScorerPoints = p.totalScore || 0;
          stats.topScorerName = p.displayName;
        }
      }
    });

    const entries: TeamLeaderboardEntry[] = sessionTeams.map((t) => {
      const stats = teamScoresMap[t.id] || { totalScore: 0, membersCount: 0 };
      const avg = stats.membersCount > 0 ? Math.round(stats.totalScore / stats.membersCount) : 0;

      return {
        teamId: t.id,
        name: t.name,
        displayName: t.displayName || t.name,
        color: t.color || "indigo",
        totalScore: stats.totalScore,
        averageScore: avg,
        membersCount: stats.membersCount,
        rank: 1,
        topScorerName: stats.topScorerName,
        topScorerPoints: stats.topScorerPoints,
      };
    });

    // Sort by totalScore descending
    entries.sort((a, b) => b.totalScore - a.totalScore);

    // Assign rank
    let rank = 1;
    entries.forEach((item, idx) => {
      if (idx > 0 && entries[idx - 1].totalScore === item.totalScore) {
        item.rank = entries[idx - 1].rank;
      } else {
        item.rank = rank;
      }
      rank++;
    });

    return entries;
  }
}
