import { LiveAnswer, LiveParticipant, institutionalDb } from "./database";
import { getSessionQuestions } from "./liveQuizHelper";
import { getRandomMotivationMessage } from "./motivationMessages";

export interface EvaluationResult {
  isCorrect: boolean | null; // null represents poll or manual evaluation
  answerStatus: "SUBMITTED" | "UNANSWERED" | "MANUAL_REVIEW";
  basePoints: number;
  speedBonus: number;
  streakBonus: number;
  penalty: number;
  totalPoints: number;
  streak: number;
}

export class AnswerEvaluator {
  /**
   * Safely normalizes string values for resilient comparisons.
   */
  private static normalizeString(val: any): string {
    if (val === undefined || val === null) return "";
    return String(val).trim().toLowerCase().replace(/\s+/g, " ");
  }

  /**
   * Determines whether a submitted answer payload is correct against correct answer key.
   */
  public static evaluate(
    questionType: string,
    submitted: any,
    correctAnswer: any,
    questionSnapshot?: any
  ): { isCorrect: boolean | null; isManual: boolean } {
    const qType = String(questionType).toLowerCase();

    // 1. Poll type questions have no correct/incorrect answer
    if (qType === "poll") {
      return { isCorrect: null, isManual: false };
    }

    // 2. Essay and manually graded types
    if (
      qType === "essay" ||
      qType === "descriptive" ||
      qType === "practical" ||
      qType === "long-form"
    ) {
      return { isCorrect: null, isManual: true };
    }

    if (submitted === undefined || submitted === null) {
      return { isCorrect: false, isManual: false };
    }

    // 3. Short Answer Manual check
    if (qType === "short_answer") {
      const autoGrade = questionSnapshot?.autoGrade ?? true;
      if (!autoGrade) {
        return { isCorrect: null, isManual: true };
      }
      // If auto-graded, perform normalized match
      const submittedStr = this.normalizeString(submitted);
      const correctStr = this.normalizeString(correctAnswer);
      
      // Support alternate answers split by comma or from config array
      const alternatives: string[] = [];
      if (questionSnapshot?.alternatives) {
        if (Array.isArray(questionSnapshot.alternatives)) {
          alternatives.push(...questionSnapshot.alternatives.map((a: any) => this.normalizeString(a)));
        } else if (typeof questionSnapshot.alternatives === "string") {
          alternatives.push(...questionSnapshot.alternatives.split(",").map((a: any) => this.normalizeString(a)));
        }
      }
      
      const isMatch = submittedStr === correctStr || alternatives.includes(submittedStr);
      return { isCorrect: isMatch, isManual: false };
    }

    // 4. MCQ Single / Image Choice
    // 4. MCQ Single / Image Choice
    if (qType === "mcq_single" || qType === "mcq" || qType === "image_choice") {
      const resolvedCorrect = (correctAnswer !== undefined && correctAnswer !== null)
        ? correctAnswer
        : (questionSnapshot?.correctIndex !== undefined
            ? questionSnapshot.correctIndex
            : questionSnapshot?.questionData?.correctIndex !== undefined
            ? questionSnapshot.questionData.correctIndex
            : questionSnapshot?.correctAnswer ?? questionSnapshot?.questionData?.correctAnswer);

      // Explicit numeric casting comparison
      const subNum = Number(submitted);
      const corrNum = Number(resolvedCorrect);

      if (!isNaN(subNum) && !isNaN(corrNum) && String(subNum) === String(corrNum)) {
        return { isCorrect: true, isManual: false };
      }

      // Explicit string normalization & comparison
      const subStr = this.normalizeString(submitted);
      const corrStr = this.normalizeString(resolvedCorrect);

      if (subStr !== "" && subStr === corrStr) {
        return { isCorrect: true, isManual: false };
      }

      // Option label/index cross-matching fallback (e.g. comparing index to option text or vice-versa)
      const options = questionSnapshot?.options || questionSnapshot?.questionData?.options;
      if (Array.isArray(options) && options.length > 0) {
        if (!isNaN(subNum) && options[subNum] !== undefined) {
          if (this.normalizeString(options[subNum]) === corrStr) {
            return { isCorrect: true, isManual: false };
          }
        }
        if (!isNaN(corrNum) && options[corrNum] !== undefined) {
          if (this.normalizeString(options[corrNum]) === subStr) {
            return { isCorrect: true, isManual: false };
          }
        }
      }

      // Letter and option ID normalization fallback (e.g., "A", "B", "opt_1", "ক", "খ")
      const letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
      const banglaLetters = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];
      const cleanSub = subStr.replace(/^opt_|^option_/, "");
      const cleanCorr = corrStr.replace(/^opt_|^option_/, "");

      if (cleanSub !== "" && cleanSub === cleanCorr) {
        return { isCorrect: true, isManual: false };
      }

      const subLetterIdx =
        letters.indexOf(cleanSub) !== -1
          ? letters.indexOf(cleanSub)
          : banglaLetters.indexOf(cleanSub);
      const corrLetterIdx =
        letters.indexOf(cleanCorr) !== -1
          ? letters.indexOf(cleanCorr)
          : banglaLetters.indexOf(cleanCorr);

      if (subLetterIdx !== -1 && (subLetterIdx === corrNum || subLetterIdx === corrLetterIdx)) {
        return { isCorrect: true, isManual: false };
      }
      if (corrLetterIdx !== -1 && (corrLetterIdx === subNum || corrLetterIdx === subLetterIdx)) {
        return { isCorrect: true, isManual: false };
      }

      return {
        isCorrect: false,
        isManual: false,
      };
    }

    // 5. MCQ Multiple
    if (qType === "mcq_multiple") {
      const resolvedCorrect = (correctAnswer !== undefined && correctAnswer !== null)
        ? correctAnswer
        : (questionSnapshot?.correctIndices !== undefined
            ? questionSnapshot.correctIndices
            : questionSnapshot?.questionData?.correctIndices !== undefined
            ? questionSnapshot.questionData.correctIndices
            : questionSnapshot?.correctAnswers);

      let subSet: any[] = Array.isArray(submitted) ? submitted : [submitted];
      let corrSet: any[] = Array.isArray(resolvedCorrect) ? resolvedCorrect : [resolvedCorrect];

      // Enforce explicit string casting and trim for all elements
      const normSub = subSet.map(s => String(s !== undefined && s !== null ? s : "").trim().toLowerCase()).sort();
      const normCorr = corrSet.map(c => String(c !== undefined && c !== null ? c : "").trim().toLowerCase()).sort();

      if (normSub.length !== normCorr.length) {
        return { isCorrect: false, isManual: false };
      }

      const isMatch = normSub.every((val, idx) => String(val) === String(normCorr[idx]));
      return { isCorrect: isMatch, isManual: false };
    }

    // 6. True / False
    if (qType === "true_false" || qType.includes("true") || qType.includes("tf")) {
      const subNorm = this.normalizeString(submitted);
      const corrNorm = this.normalizeString(correctAnswer);

      const isSubTrue = submitted === true || ["true", "1", "yes", "সত্য", "সঠিক"].includes(subNorm) || (subNorm === "0" && !["false", "0", "মিথ্যা"].includes(corrNorm));
      const isCorrTrue = correctAnswer === true || ["true", "1", "yes", "সত্য", "সঠিক"].includes(corrNorm) || (corrNorm === "0" && !["false", "0", "মিথ্যা"].includes(subNorm));

      return { isCorrect: Boolean(isSubTrue) === Boolean(isCorrTrue), isManual: false };
    }

    // 7. Matching
    if (qType === "matching" || qType.includes("match")) {
      // Resolve canonical expected pairs from correctAnswer, snapshot pairs, or questionData
      let resolvedExpected = correctAnswer;
      if (typeof resolvedExpected === "string" && resolvedExpected.trim().startsWith("[")) {
        try {
          resolvedExpected = JSON.parse(resolvedExpected);
        } catch {}
      }
      if (!resolvedExpected || (Array.isArray(resolvedExpected) && resolvedExpected.length === 0)) {
        resolvedExpected =
          questionSnapshot?.pairs ||
          questionSnapshot?.questionData?.pairs ||
          questionSnapshot?.matchingPairs ||
          resolvedExpected;
      }

      // If submitted is a JSON string, parse it
      let resolvedSubmitted = submitted;
      if (typeof resolvedSubmitted === "string" && resolvedSubmitted.trim().startsWith("[")) {
        try {
          resolvedSubmitted = JSON.parse(resolvedSubmitted);
        } catch {}
      } else if (typeof resolvedSubmitted === "string" && resolvedSubmitted.trim().startsWith("{")) {
        try {
          resolvedSubmitted = JSON.parse(resolvedSubmitted);
        } catch {}
      }

      // Comparison when expected is array of pairs: [{ left, right }]
      if (Array.isArray(resolvedExpected) && resolvedExpected.length > 0) {
        if (Array.isArray(resolvedSubmitted)) {
          if (resolvedSubmitted.length !== resolvedExpected.length) {
            return { isCorrect: false, isManual: false };
          }
          const makeKey = (pair: any) =>
            `${this.normalizeString(pair?.left)}::${this.normalizeString(pair?.right)}`;
          const subKeys = resolvedSubmitted.map(makeKey).sort();
          const corrKeys = resolvedExpected.map(makeKey).sort();

          const isMatch = subKeys.every((val, idx) => val === corrKeys[idx]);
          return { isCorrect: isMatch, isManual: false };
        } else if (typeof resolvedSubmitted === "object" && resolvedSubmitted !== null) {
          const isMatch = resolvedExpected.every((pair: any, idx: number) => {
            const userChoice =
              resolvedSubmitted[pair.left] ??
              resolvedSubmitted[`drop-${idx}`] ??
              (pair.id !== undefined ? resolvedSubmitted[pair.id] : undefined) ??
              resolvedSubmitted[idx];
            return (
              this.normalizeString(userChoice) === this.normalizeString(pair.right)
            );
          });
          return { isCorrect: isMatch, isManual: false };
        }
      }

      // Object comparison fallback
      if (
        typeof resolvedSubmitted === "object" &&
        resolvedSubmitted !== null &&
        typeof resolvedExpected === "object" &&
        resolvedExpected !== null
      ) {
        const subKeys = Object.keys(resolvedSubmitted).sort();
        const corrKeys = Object.keys(resolvedExpected).sort();

        if (subKeys.length !== corrKeys.length) {
          return { isCorrect: false, isManual: false };
        }

        const isMatch = subKeys.every((k, idx) => {
          if (k !== corrKeys[idx]) return false;
          return (
            this.normalizeString(resolvedSubmitted[k]) ===
            this.normalizeString(resolvedExpected[k])
          );
        });
        return { isCorrect: isMatch, isManual: false };
      }

      return { isCorrect: false, isManual: false };
    }

    // 8. Ordering / Arrange / Reorder
    if (qType === "ordering" || qType === "arrange" || qType === "reorder" || qType.includes("order")) {
      let resolvedCorr = correctAnswer;
      if (typeof resolvedCorr === "string" && resolvedCorr.trim().startsWith("[")) {
        try {
          resolvedCorr = JSON.parse(resolvedCorr);
        } catch {}
      }
      if (!resolvedCorr || (Array.isArray(resolvedCorr) && resolvedCorr.length === 0)) {
        resolvedCorr =
          questionSnapshot?.correctOrder ||
          questionSnapshot?.items ||
          questionSnapshot?.questionData?.items ||
          questionSnapshot?.options;
      }

      let resolvedSub = submitted;
      if (typeof resolvedSub === "string" && resolvedSub.trim().startsWith("[")) {
        try {
          resolvedSub = JSON.parse(resolvedSub);
        } catch {}
      } else if (typeof resolvedSub === "object" && resolvedSub !== null && !Array.isArray(resolvedSub)) {
        resolvedSub = Object.values(resolvedSub);
      }

      const subSeq: any[] = Array.isArray(resolvedSub) ? resolvedSub : [resolvedSub];
      const corrSeq: any[] = Array.isArray(resolvedCorr) ? resolvedCorr : [resolvedCorr];

      if (subSeq.length !== corrSeq.length) {
        return { isCorrect: false, isManual: false };
      }

      const isMatch = subSeq.every(
        (val, idx) => this.normalizeString(val) === this.normalizeString(corrSeq[idx])
      );
      return { isCorrect: isMatch, isManual: false };
    }

    // 9. Fill in the Blank
    if (qType === "fill_blank" || qType === "fill_blanks" || qType.includes("blank")) {
      // If submitted is multi-part object or array
      if (typeof submitted === "object" && submitted !== null) {
        const subVals = Array.isArray(submitted) ? submitted : Object.values(submitted);
        const subStr = subVals.map(v => this.normalizeString(v)).join(" ");
        const corrStr = this.normalizeString(correctAnswer);
        if (subStr === corrStr) return { isCorrect: true, isManual: false };
      }

      const submittedStr = this.normalizeString(submitted);
      const correctStr = this.normalizeString(correctAnswer);

      // Support alternatives inside snap configuration if available
      const alternatives: string[] = [];
      if (questionSnapshot?.alternatives) {
        if (Array.isArray(questionSnapshot.alternatives)) {
          alternatives.push(...questionSnapshot.alternatives.map((a: any) => this.normalizeString(a)));
        } else if (typeof questionSnapshot.alternatives === "string") {
          alternatives.push(...questionSnapshot.alternatives.split(",").map((a: any) => this.normalizeString(a)));
        }
      }
      if (Array.isArray(questionSnapshot?.acceptedAnswers)) {
        alternatives.push(...questionSnapshot.acceptedAnswers.map((a: any) => this.normalizeString(a)));
      }
      if (Array.isArray(questionSnapshot?.questionData?.acceptedAnswers)) {
        alternatives.push(...questionSnapshot.questionData.acceptedAnswers.map((a: any) => this.normalizeString(a)));
      }

      const isMatch = submittedStr === correctStr || alternatives.includes(submittedStr);
      return { isCorrect: isMatch, isManual: false };
    }

    // Fallback safe direct comparison
    return {
      isCorrect: this.normalizeString(submitted) === this.normalizeString(correctAnswer),
      isManual: false
    };
  }
}

export class ScoringService {
  /**
   * Evaluates the response and awards points based on correctness, speed, and streaks.
   */
  public static score(params: {
    questionType: string;
    submittedPayload: any;
    correctAnswer: any;
    responseTimeMs: number;
    questionDurationMs: number;
    currentStreak: number;
    quizSettings?: {
      basePoints?: number;
      speedBonusEnabled?: boolean;
      maxSpeedBonus?: number;
      streakBonusEnabled?: boolean;
      streakBonusValue?: number;
      negativeMarkingEnabled?: boolean;
      negativeMarkingValue?: number;
    };
    questionSnapshot?: any;
  }): EvaluationResult {
    const {
      questionType,
      submittedPayload,
      correctAnswer,
      responseTimeMs,
      questionDurationMs,
      currentStreak,
      quizSettings,
      questionSnapshot
    } = params;

    const basePoints = quizSettings?.basePoints ?? 100;
    const speedBonusEnabled = quizSettings?.speedBonusEnabled ?? true;
    const maxSpeedBonus = quizSettings?.maxSpeedBonus ?? 50;
    const streakBonusEnabled = quizSettings?.streakBonusEnabled ?? true;
    const streakBonusValue = quizSettings?.streakBonusValue ?? 10;
    const negativeMarkingEnabled = quizSettings?.negativeMarkingEnabled ?? false;
    const negativeMarkingValue = quizSettings?.negativeMarkingValue ?? 20;

    // Evaluate correctness using AnswerEvaluator
    const evaluation = AnswerEvaluator.evaluate(
      questionType,
      submittedPayload,
      correctAnswer,
      questionSnapshot
    );

    // Unanswered check
    if (submittedPayload === undefined || submittedPayload === null || submittedPayload === "") {
      const penalty = negativeMarkingEnabled ? negativeMarkingValue : 0;
      return {
        isCorrect: false,
        answerStatus: "UNANSWERED",
        basePoints: 0,
        speedBonus: 0,
        streakBonus: 0,
        penalty,
        totalPoints: -penalty,
        streak: 0
      };
    }

    if (evaluation.isManual) {
      return {
        isCorrect: null,
        answerStatus: "MANUAL_REVIEW",
        basePoints: 0,
        speedBonus: 0,
        streakBonus: 0,
        penalty: 0,
        totalPoints: 0,
        streak: currentStreak
      };
    }

    if (evaluation.isCorrect === null) {
      // Typically a Poll
      const points = questionType.toLowerCase() === "poll" ? (quizSettings?.basePoints ?? 10) : 0;
      return {
        isCorrect: null,
        answerStatus: "SUBMITTED",
        basePoints: points,
        speedBonus: 0,
        streakBonus: 0,
        penalty: 0,
        totalPoints: points,
        streak: currentStreak
      };
    }

    if (!evaluation.isCorrect) {
      const penalty = negativeMarkingEnabled ? negativeMarkingValue : 0;
      return {
        isCorrect: false,
        answerStatus: "SUBMITTED",
        basePoints: 0,
        speedBonus: 0,
        streakBonus: 0,
        penalty,
        totalPoints: -penalty,
        streak: 0
      };
    }

    // Correct Answer - calculate points and speed bonus
    const nextStreak = currentStreak + 1;

    // Speed Bonus calculation: remainingTime / totalQuestionTime (bounded against clock skew)
    let speedBonus = 0;
    if (speedBonusEnabled && questionDurationMs > 0) {
      const boundedResponseTime = Math.max(0, Math.min(responseTimeMs, questionDurationMs));
      const remainingMs = Math.max(0, questionDurationMs - boundedResponseTime);
      const ratio = Math.max(0, Math.min(1, remainingMs / questionDurationMs));
      speedBonus = Math.round(maxSpeedBonus * ratio);
    }

    // Streak Bonus calculation (consecutive-correct multiplier)
    let streakBonus = 0;
    if (streakBonusEnabled && nextStreak >= 3) {
      // Award streak bonus starting at a streak of 3
      streakBonus = streakBonusValue * (nextStreak - 2);
    }

    const totalPoints = basePoints + speedBonus + streakBonus;

    return {
      isCorrect: true,
      answerStatus: "SUBMITTED",
      basePoints,
      speedBonus,
      streakBonus,
      penalty: 0,
      totalPoints,
      streak: nextStreak
    };
  }

  /**
   * Bulk-evaluates all active players' answers for a given question in a live session.
   * If a player hasn't submitted an answer, registers them as UNANSWERED.
   * Then updates player statistics and recalculates leaderboard rankings.
   */
  public static evaluateSessionQuestion(sessionId: string, questionId: string) {
    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) return;

    // Check if we already evaluated this question for this session to prevent duplicate calculations
    const alreadyEvaluated = institutionalDb.liveAnswers.some(
      a => a.sessionId === sessionId && a.questionId === questionId && a.evaluatedAt !== undefined
    );
    if (alreadyEvaluated) {
      return;
    }

    // Get question details
    const questions = getSessionQuestions(session.quizId);
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    // Retrieve quiz settings from session (or fallback defaults)
    const quizSettings = {
      basePoints: (session as any).basePoints ?? 100,
      speedBonusEnabled: (session as any).speedBonusEnabled ?? true,
      maxSpeedBonus: (session as any).maxSpeedBonus ?? 50,
      streakBonusEnabled: (session as any).streakBonusEnabled ?? true,
      streakBonusValue: (session as any).streakBonusValue ?? 10,
      negativeMarkingEnabled: (session as any).negativeMarkingEnabled ?? false,
      negativeMarkingValue: (session as any).negativeMarkingValue ?? 20
    };

    // Get active participants
    const participants = institutionalDb.liveParticipants.filter(
      p => p.sessionId === sessionId && p.status === "JOINED"
    );

    const nowStr = new Date().toISOString();

    for (const player of participants) {
      player.totalScore = player.totalScore ?? 0;
      player.correctAnswers = player.correctAnswers ?? 0;
      player.wrongAnswers = player.wrongAnswers ?? 0;
      player.unanswered = player.unanswered ?? 0;
      player.currentStreak = player.currentStreak ?? 0;
      player.bestStreak = player.bestStreak ?? 0;

      // Find answer
      const answer = institutionalDb.liveAnswers.find(
        a => a.sessionId === sessionId && a.playerId === player.id && a.questionId === questionId
      );

      if (answer) {
        if (answer.evaluatedAt !== undefined) {
          // Already evaluated immediately on submission, skip to avoid double counting
          continue;
        }
        // Evaluate submitted answer
        const res = this.score({
          questionType: question.type,
          submittedPayload: answer.answerPayload,
          correctAnswer: question.correctAnswer,
          responseTimeMs: answer.responseTimeMs,
          questionDurationMs: (question.timeLimit || 30) * 1000,
          currentStreak: player.currentStreak,
          quizSettings,
          questionSnapshot: question.questionData
        });

        // Update answer details
        answer.isCorrect = res.isCorrect;
        answer.answerStatus = res.answerStatus;
        answer.basePoints = res.basePoints;
        answer.speedBonus = res.speedBonus;
        answer.streakBonus = res.streakBonus;
        answer.penalty = res.penalty;
        answer.totalPoints = res.totalPoints;
        answer.evaluatedAt = nowStr;

        // Update participant totals
        player.totalScore += res.totalPoints;
        if (res.isCorrect) {
          player.correctAnswers += 1;
        } else if (res.isCorrect === false) {
          player.wrongAnswers += 1;
        }
        player.currentStreak = res.streak;
        player.bestStreak = Math.max(player.bestStreak, res.streak);
      } else {
        // Unanswered
        const res = this.score({
          questionType: question.type,
          submittedPayload: null, // trigger unanswered scoring flow
          correctAnswer: question.correctAnswer,
          responseTimeMs: 0,
          questionDurationMs: (question.timeLimit || 30) * 1000,
          currentStreak: player.currentStreak,
          quizSettings,
          questionSnapshot: question.questionData
        });

        // Create a dummy unanswered record to track details
        const dummyAnswer: LiveAnswer = {
          id: `ans-un-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sessionId,
          playerId: player.id,
          questionId,
          answerPayload: null,
          submittedAt: nowStr,
          responseTimeMs: 0,
          createdAt: nowStr,
          updatedAt: nowStr,
          isCorrect: res.isCorrect,
          answerStatus: res.answerStatus,
          basePoints: res.basePoints,
          speedBonus: res.speedBonus,
          streakBonus: res.streakBonus,
          penalty: res.penalty,
          totalPoints: res.totalPoints,
          evaluatedAt: nowStr
        };
        institutionalDb.liveAnswers.push(dummyAnswer);

        // Update participant totals
        player.totalScore += res.totalPoints;
        player.unanswered += 1;
        player.currentStreak = 0;
      }
    }

    // Recalculate rankings and update participant rankings
    const rankedPlayers = LeaderboardService.calculateRanks(participants);
    for (const rp of rankedPlayers) {
      const match = participants.find(p => p.id === rp.id);
      if (match) {
        match.previousRank = rp.previousRank;
        match.rank = rp.rank;
      }
    }

    // Phase 20 & 30 - Fully Automatic Funny + Motivational Performance SMS System
    // CRITICAL RULE: NO automatic SMS before actual competitive quiz starts.
    // Pre-quiz questions, polls, and icebreakers are NEVER counted in SMS counter.
    if (session.status === "LOBBY" || session.status === "CREATED" || session.isQuizModeStarted === false) {
      return;
    }

    const motivationEnabled = session.motivationEnabled !== false;
    const interval = session.motivationInterval ?? 3;
    const currentQIdx = session.currentQuestionIndex || 0;
    const totalQ = questions.length;
    const isLastQuestion = currentQIdx === totalQ - 1;

    if (motivationEnabled) {
      if (isLastQuestion) {
        // Trigger FINAL results evaluation motivation messages
        for (const player of participants) {
          // Avoid duplicate SMS for same question on reconnect/refresh
          if (player.lastSmsSentQuestionIndex === currentQIdx) continue;

          const score = player.totalScore ?? 0;
          let category = "FINAL_GOOD";
          const maxPossiblePoints = totalQ * (quizSettings.basePoints ?? 100);
          if (score >= maxPossiblePoints * 0.8) {
            category = "FINAL_EXCELLENT";
          } else if (score < maxPossiblePoints * 0.4) {
            category = "FINAL_POOR";
          }
          const messageText = getRandomMotivationMessage(category, player.id);
          player.motivationMessage = {
            category,
            message: messageText,
            questionIndex: currentQIdx,
            shown: false
          };
          player.lastSmsSentQuestionIndex = currentQIdx;
        }
      } else if ((currentQIdx + 1) % interval === 0) {
        // Trigger interval evaluation
        const startQIdx = Math.max(0, currentQIdx - interval + 1);
        const targetQuestions = questions.slice(startQIdx, currentQIdx + 1);
        const targetQuestionIds = targetQuestions.map(q => q.id);

        for (const player of participants) {
          // Avoid duplicate SMS for same question on reconnect/refresh
          if (player.lastSmsSentQuestionIndex === currentQIdx) continue;
          // Get player's answers for these specific questions
          const answersInInterval = institutionalDb.liveAnswers.filter(
            a => a.sessionId === sessionId && a.playerId === player.id && targetQuestionIds.includes(a.questionId)
          );

          const correctAnswersCount = answersInInterval.filter(a => a.isCorrect === true).length;
          const accuracy = correctAnswersCount / interval;
          const rankImproved = player.rank && player.previousRank ? player.rank < player.previousRank : false;
          const rankDropped = player.rank && player.previousRank ? player.rank > player.previousRank : false;

          // Check for Fast But Wrong (responseTime < 2.5s and isCorrect === false)
          const fastButWrong = answersInInterval.some(a => a.isCorrect === false && a.responseTimeMs < 2500 && a.responseTimeMs > 0);

          // Check for Slow But Correct (responseTime > 80% of timeLimit and isCorrect === true)
          const slowButCorrect = answersInInterval.some(a => {
            if (a.isCorrect !== true) return false;
            const qDetail = targetQuestions.find(tq => tq.id === a.questionId);
            const timeLimitMs = (qDetail?.timeLimit || 30) * 1000;
            return a.responseTimeMs > timeLimitMs * 0.8;
          });

          // Determine category based on priority hierarchy
          let category = "MEDIUM";

          if (player.currentStreak && player.currentStreak >= 3) {
            category = "WINNING_STREAK";
          } else if (rankImproved) {
            category = "RANK_UP";
          } else if (rankDropped) {
            category = "RANK_DOWN";
          } else if (fastButWrong) {
            category = "FAST_BUT_WRONG";
          } else if (slowButCorrect) {
            category = "SLOW_BUT_CORRECT";
          } else {
            // Pure accuracy categorization
            if (accuracy >= 1.0) {
              category = "EXCELLENT";
            } else if (accuracy >= 0.66) {
              category = "GOOD";
            } else if (accuracy >= 0.33) {
              category = "MEDIUM";
            } else if (accuracy > 0) {
              category = "LOW";
            } else {
              category = "FAILED";
            }
          }

          const messageText = getRandomMotivationMessage(category, player.id);
          player.motivationMessage = {
            category,
            message: messageText,
            questionIndex: currentQIdx,
            shown: false
          };
          player.lastSmsSentQuestionIndex = currentQIdx;
        }
      }
    }
  }
}

export class LeaderboardService {
  /**
   * Sorts players deterministically by:
   * 1. Total score (descending)
   * 2. Joined timestamp or name (ascending) as a stable tie-breaker
   */
  public static calculateRanks(participants: LiveParticipant[]): LiveParticipant[] {
    const sorted = [...participants].sort((a, b) => {
      const scoreA = a.totalScore ?? 0;
      const scoreB = b.totalScore ?? 0;

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      // Tie breaker: join timestamp
      const timeA = new Date(a.joinedAt).getTime();
      const timeB = new Date(b.joinedAt).getTime();
      if (timeA !== timeB) {
        return timeA - timeB;
      }

      return a.displayName.localeCompare(b.displayName);
    });

    // Write rank values
    return sorted.map((player, index) => {
      const prevRank = player.rank;
      return {
        ...player,
        previousRank: prevRank,
        rank: index + 1
      };
    });
  }
}
