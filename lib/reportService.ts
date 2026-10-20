import { LiveAnswer, LiveParticipant, LiveSession, institutionalDb } from "./database";
import { getSessionQuestions } from "./liveQuizHelper";
import { ScoringService, LeaderboardService } from "./scoringService";

export interface SessionOverviewStats {
  totalParticipants: number;
  completedParticipants: number;
  participantsWithUnanswered: number;
  totalQuestions: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  averageAccuracy: number;
  averageResponseTimeMs: number;
}

export interface ScoreDistributionBin {
  range: string;
  count: number;
}

export interface QuestionPerformanceReport {
  questionId: string;
  orderIndex: number;
  questionText: string;
  type: string;
  marks: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  correctAnswer: any;
  averageResponseTimeMs: number;
  accuracyPercentage: number;
}

export interface ParticipantReportRow {
  playerId: string;
  rank: number;
  displayName: string;
  studentId?: number;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  accuracy: number;
  bestStreak: number;
  averageResponseTimeMs: number;
}

export class FinalResultService {
  /**
   * Finalizes the live session in an idempotent and transaction-safe manner.
   */
  public static finalize(sessionId: string): { success: boolean; message: string; session: LiveSession } {
    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error("Live session not found");
    }

    // Idempotency check: If already completed, return immediately
    if (session.status === "COMPLETED") {
      return {
        success: true,
        message: "Session is already completed and finalized.",
        session
      };
    }

    const nowStr = new Date().toISOString();

    // 1. Ensure all questions in this session have been bulk-evaluated
    const questions = getSessionQuestions(session.quizId);
    for (const q of questions) {
      ScoringService.evaluateSessionQuestion(sessionId, q.id);
    }

    // 2. Finalize student ranks deterministically
    const participants = institutionalDb.liveParticipants.filter(
      p => p.sessionId === sessionId && p.status === "JOINED"
    );

    const rankedPlayers = LeaderboardService.calculateRanks(participants);
    for (const rp of rankedPlayers) {
      const match = participants.find(p => p.id === rp.id);
      if (match) {
        match.previousRank = rp.previousRank;
        match.rank = rp.rank;
        match.totalScore = rp.totalScore ?? 0;
        match.correctAnswers = rp.correctAnswers ?? 0;
        match.wrongAnswers = rp.wrongAnswers ?? 0;
        match.unanswered = rp.unanswered ?? 0;
        match.currentStreak = rp.currentStreak ?? 0;
        match.bestStreak = rp.bestStreak ?? 0;
      }
    }

    // 3. Mark the session as completed
    session.status = "COMPLETED";
    session.endedAt = nowStr;
    session.updatedAt = nowStr;

    // Log the security/audit event
    institutionalDb.liveQuizAuditLogs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      eventType: "SESSION_STATE_RECOVERY",
      message: `Live quiz session was finalized and locked by host. ${participants.length} players ranked.`,
      createdAt: nowStr
    });

    return {
      success: true,
      message: "Live quiz session successfully completed and final ranks determined.",
      session
    };
  }
}

export class QuizReportService {
  /**
   * Generates a high-level summary overview of the completed session.
   */
  public static getSessionOverview(sessionId: string): SessionOverviewStats {
    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error("Live session not found");
    }

    const questions = getSessionQuestions(session.quizId);
    const participants = institutionalDb.liveParticipants.filter(
      p => p.sessionId === sessionId && p.status === "JOINED"
    );

    const totalParticipants = participants.length;
    if (totalParticipants === 0) {
      return {
        totalParticipants: 0,
        completedParticipants: 0,
        participantsWithUnanswered: 0,
        totalQuestions: questions.length,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        averageAccuracy: 0,
        averageResponseTimeMs: 0
      };
    }

    let totalScore = 0;
    let highestScore = -Infinity;
    let lowestScore = Infinity;
    let totalAccuracySum = 0;
    let completedParticipants = 0;
    let participantsWithUnanswered = 0;

    let responseTimeSum = 0;
    let responseTimeCount = 0;

    for (const player of participants) {
      const score = player.totalScore ?? 0;
      totalScore += score;
      if (score > highestScore) highestScore = score;
      if (score < lowestScore) lowestScore = score;

      const correct = player.correctAnswers ?? 0;
      const wrong = player.wrongAnswers ?? 0;
      const unanswered = player.unanswered ?? 0;
      const accuracy = questions.length > 0 ? (correct / questions.length) * 100 : 0;
      totalAccuracySum += accuracy;

      if (unanswered > 0) {
        participantsWithUnanswered++;
      } else {
        completedParticipants++;
      }

      // Gather answer submission response times
      const answers = institutionalDb.liveAnswers.filter(
        a => a.sessionId === sessionId && a.playerId === player.id && a.answerStatus === "SUBMITTED"
      );
      for (const ans of answers) {
        responseTimeSum += ans.responseTimeMs || 0;
        responseTimeCount++;
      }
    }

    const averageScore = Math.round(totalScore / totalParticipants);
    const averageAccuracy = Math.round(totalAccuracySum / totalParticipants);
    const averageResponseTimeMs = responseTimeCount > 0 ? Math.round(responseTimeSum / responseTimeCount) : 0;

    return {
      totalParticipants,
      completedParticipants,
      participantsWithUnanswered,
      totalQuestions: questions.length,
      averageScore,
      highestScore: highestScore === -Infinity ? 0 : highestScore,
      lowestScore: lowestScore === Infinity ? 0 : lowestScore,
      averageAccuracy,
      averageResponseTimeMs
    };
  }

  /**
   * Distributes participant scores into elegant buckets for visual chart rendering.
   */
  public static getScoreDistribution(sessionId: string): ScoreDistributionBin[] {
    const participants = institutionalDb.liveParticipants.filter(
      p => p.sessionId === sessionId && p.status === "JOINED"
    );

    const bins = [
      { range: "0 - 200", min: 0, max: 200, count: 0 },
      { range: "201 - 400", min: 201, max: 400, count: 0 },
      { range: "401 - 600", min: 401, max: 600, count: 0 },
      { range: "601 - 800", min: 601, max: 800, count: 0 },
      { range: "801 - 1000", min: 801, max: 1000, count: 0 },
      { range: "1000+", min: 1001, max: Infinity, count: 0 }
    ];

    for (const player of participants) {
      const score = player.totalScore ?? 0;
      const matchedBin = bins.find(b => score >= b.min && score <= b.max);
      if (matchedBin) {
        matchedBin.count++;
      }
    }

    return bins.map(b => ({ range: b.range, count: b.count }));
  }

  /**
   * Generates question-by-question performance metrics for a session.
   */
  public static getQuestionPerformance(sessionId: string): QuestionPerformanceReport[] {
    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error("Live session not found");
    }

    const questions = getSessionQuestions(session.quizId);
    const participantsCount = institutionalDb.liveParticipants.filter(
      p => p.sessionId === sessionId && p.status === "JOINED"
    ).length;

    return questions.map((q, idx) => {
      const answers = institutionalDb.liveAnswers.filter(
        a => a.sessionId === sessionId && a.questionId === q.id
      );

      const answeredCount = answers.filter(a => a.answerStatus === "SUBMITTED").length;
      const correctCount = answers.filter(a => a.isCorrect === true).length;
      const wrongCount = answers.filter(a => a.isCorrect === false).length;
      const unansweredCount = participantsCount - answeredCount;

      // Calculate response times
      const subAnswers = answers.filter(a => a.answerStatus === "SUBMITTED");
      const totalResponseTime = subAnswers.reduce((acc, a) => acc + (a.responseTimeMs || 0), 0);
      const averageResponseTimeMs = subAnswers.length > 0 ? Math.round(totalResponseTime / subAnswers.length) : 0;

      // Calculate accuracy percentage based on total players in the session
      const accuracyPercentage = participantsCount > 0 ? Math.round((correctCount / participantsCount) * 100) : 0;

      return {
        questionId: q.id,
        orderIndex: idx,
        questionText: q.questionText,
        type: q.type,
        marks: q.questionData?.basePoints || 100,
        answeredCount,
        correctCount,
        wrongCount,
        unansweredCount: Math.max(0, unansweredCount),
        correctAnswer: q.correctAnswer,
        averageResponseTimeMs,
        accuracyPercentage
      };
    });
  }

  /**
   * Gathers highly detailed list rows of participant scores and accuracies.
   */
  public static getParticipantsReport(sessionId: string): ParticipantReportRow[] {
    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error("Live session not found");
    }

    const questions = getSessionQuestions(session.quizId);
    const participants = institutionalDb.liveParticipants.filter(
      p => p.sessionId === sessionId && p.status === "JOINED"
    );

    // Compute metrics for each player
    const rows = participants.map(player => {
      const answers = institutionalDb.liveAnswers.filter(
        a => a.sessionId === sessionId && a.playerId === player.id
      );

      const subAnswers = answers.filter(a => a.answerStatus === "SUBMITTED");
      const totalResponseTime = subAnswers.reduce((acc, a) => acc + (a.responseTimeMs || 0), 0);
      const averageResponseTimeMs = subAnswers.length > 0 ? Math.round(totalResponseTime / subAnswers.length) : 0;

      const correct = player.correctAnswers ?? 0;
      const accuracy = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

      return {
        playerId: player.id,
        rank: player.rank || 99,
        displayName: player.displayName,
        studentId: player.studentId,
        score: player.totalScore ?? 0,
        correctAnswers: correct,
        wrongAnswers: player.wrongAnswers ?? 0,
        unanswered: player.unanswered ?? 0,
        accuracy,
        bestStreak: player.bestStreak ?? 0,
        averageResponseTimeMs
      };
    });

    // Sort by rank ascending
    return rows.sort((a, b) => a.rank - b.rank);
  }

  /**
   * Formats a session results table into a CSV spreadsheet-compatible string.
   */
  public static exportParticipantsCsv(sessionId: string): string {
    const report = this.getParticipantsReport(sessionId);
    const header = "Rank,Student Name,Student ID,Score,Correct,Wrong,Unanswered,Accuracy %,Best Streak,Avg Response Time (ms)\n";
    const rows = report.map(r => {
      const escapedName = `"${r.displayName.replace(/"/g, '""')}"`;
      const studId = r.studentId || "N/A";
      return `${r.rank},${escapedName},${studId},${r.score},${r.correctAnswers},${r.wrongAnswers},${r.unanswered},${r.accuracy}%,${r.bestStreak},${r.averageResponseTimeMs}`;
    });
    return header + rows.join("\n");
  }

  /**
   * Formats a session questions overview into a CSV spreadsheet-compatible string.
   */
  public static exportQuestionsCsv(sessionId: string): string {
    const report = this.getQuestionPerformance(sessionId);
    const header = "No.,Question Text,Type,Base Marks,Answered Count,Correct,Wrong,Unanswered,Accuracy %,Avg Response Time (ms)\n";
    const rows = report.map(r => {
      const escapedText = `"${r.questionText.replace(/"/g, '""')}"`;
      const order = r.orderIndex + 1;
      return `${order},${escapedText},${r.type},${r.marks},${r.answeredCount},${r.correctCount},${r.wrongCount},${r.unansweredCount},${r.accuracyPercentage}%,${r.averageResponseTimeMs}`;
    });
    return header + rows.join("\n");
  }
}
