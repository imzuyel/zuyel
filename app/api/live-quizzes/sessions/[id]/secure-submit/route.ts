import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, LiveAnswer, LiveParticipant } from "@/lib/database";
import { QuizSecurityEngine } from "@/lib/quizSecurityEngine";
import { prisma, isPrismaAvailable } from "@/lib/prisma";
import { MOTIVATION_MESSAGES } from "@/lib/motivationMessages";
import { sendSmsGateway } from "@/lib/smsGatewayEngine";
import { invalidateSessionCache } from "@/lib/sessionCache";

// ==========================================
// RATE LIMITING & SUBMISSION THROTTLING
// ==========================================
interface RateLimitEntry {
  lastSubmittedAt: number;
  countInWindow: number;
  windowStart: number;
}

const submissionRateLimits = new Map<string, RateLimitEntry>();
const MIN_SUBMISSION_INTERVAL_MS = 1000; // Minimum 1 second between consecutive submissions per player
const RATE_LIMIT_WINDOW_MS = 5000; // 5-second window
const MAX_SUBMISSIONS_PER_WINDOW = 4; // Max 4 submissions within 5 seconds

// Periodic cleanup to avoid memory leakage in long-running Node processes
let lastCleanupTime = Date.now();
const CLEANUP_INTERVAL_MS = 3 * 60 * 1000; // Every 3 minutes

function cleanupStaleLimits() {
  const now = Date.now();
  if (now - lastCleanupTime > CLEANUP_INTERVAL_MS) {
    lastCleanupTime = now;
    for (const [key, entry] of submissionRateLimits.entries()) {
      if (now - entry.lastSubmittedAt > 60 * 1000) {
        submissionRateLimits.delete(key);
      }
    }
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();

    const {
      playerId,
      questionId,
      answerPayload,
      responseTimeMs = 1200,
      tabSwitchCount = 0,
      timeLimitMs = 30000,
    } = body;

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: "খেলোয়াড় / শিক্ষার্থীর আইডি (playerId) অনুপস্থিত।" },
        { status: 400 }
      );
    }

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: "প্রশ্নের আইডি (questionId) অনুপস্থিত।" },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------
    // RATE LIMITING & ANTI-SPAM PROTECTION
    // -------------------------------------------------------------
    cleanupStaleLimits();
    const now = Date.now();
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const rateLimitKey = `${sessionId}:${playerId}:${clientIp}`;

    const limitData = submissionRateLimits.get(rateLimitKey);

    if (limitData) {
      // 1. Minimum interval throttle check (reject rapid-fire script hammering)
      const elapsedSinceLast = now - limitData.lastSubmittedAt;
      if (elapsedSinceLast < MIN_SUBMISSION_INTERVAL_MS) {
        const retryAfter = Math.ceil((MIN_SUBMISSION_INTERVAL_MS - elapsedSinceLast) / 1000);
        return NextResponse.json(
          {
            success: false,
            error: "খুব দ্রুত উত্তর জমা দেওয়া হচ্ছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন। (Too many rapid submissions)",
            retryAfterMs: MIN_SUBMISSION_INTERVAL_MS - elapsedSinceLast,
          },
          {
            status: 429,
            headers: { "Retry-After": String(retryAfter || 1) },
          }
        );
      }

      // 2. Sliding window burst limit check
      if (now - limitData.windowStart < RATE_LIMIT_WINDOW_MS) {
        if (limitData.countInWindow >= MAX_SUBMISSIONS_PER_WINDOW) {
          return NextResponse.json(
            {
              success: false,
              error: "জমা দেওয়ার সর্বোচ্চ সীমা অতিক্রম করেছে। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন। (Rate limit exceeded)",
              retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - limitData.windowStart),
            },
            {
              status: 429,
              headers: { "Retry-After": "2" },
            }
          );
        }
        limitData.countInWindow += 1;
      } else {
        limitData.windowStart = now;
        limitData.countInWindow = 1;
      }
      limitData.lastSubmittedAt = now;
    } else {
      submissionRateLimits.set(rateLimitKey, {
        lastSubmittedAt: now,
        countInWindow: 1,
        windowStart: now,
      });
    }

    // 3. Database-level timestamp check via Prisma (if connected)
    if (isPrismaAvailable() && prisma) {
      try {
        const numericSessionId = parseInt(sessionId, 10);
        if (!isNaN(numericSessionId)) {
          const lastDbSubmission = await prisma.liveAnswer.findFirst({
            where: {
              sessionId: numericSessionId,
              participantId: String(playerId),
            },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          });

          if (lastDbSubmission) {
            const timeDiff = now - new Date(lastDbSubmission.createdAt).getTime();
            if (timeDiff < MIN_SUBMISSION_INTERVAL_MS) {
              return NextResponse.json(
                {
                  success: false,
                  error: "পূর্ববর্তী উত্তর প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে ১ সেকেন্ড অপেক্ষা করুন।",
                  retryAfterMs: MIN_SUBMISSION_INTERVAL_MS - timeDiff,
                },
                {
                  status: 429,
                  headers: { "Retry-After": "1" },
                }
              );
            }
          }
        }
      } catch (dbErr) {
        // Non-blocking fallback to in-memory enforcement
      }
    }

    // 4. Duplicate Question Submission Prevention
    institutionalDb.liveParticipants = institutionalDb.liveParticipants || [];
    institutionalDb.liveAnswers = institutionalDb.liveAnswers || [];
    institutionalDb.liveSessions = institutionalDb.liveSessions || [];

    const existingAnswer = institutionalDb.liveAnswers.find(
      (a) => a.sessionId === sessionId && a.playerId === playerId && a.questionId === questionId
    );
    if (existingAnswer) {
      return NextResponse.json(
        {
          success: false,
          error: "আপনি ইতিমধ্যে এই প্রশ্নের উত্তর জমা দিয়েছেন। (Answer already submitted for this question)",
          isDuplicate: true,
          previousPoints: existingAnswer.totalPoints,
        },
        { status: 409 }
      );
    }

    // -------------------------------------------------------------
    // PARTICIPANT & ANSWER EVALUATION
    // -------------------------------------------------------------
    // Find or create participant
    let participant = institutionalDb.liveParticipants.find(
      (p) => p.sessionId === sessionId && p.id === playerId
    );

    if (!participant) {
      participant = {
        id: playerId,
        sessionId,
        displayName: body.displayName || `Student ${playerId.slice(-4)}`,
        playerToken: `TOKEN-${playerId}`,
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
      institutionalDb.liveParticipants.push(participant);
    }

    // Determine the correct answer
    // Determine the correct answer, question type, and snapshot
    let correctAnswer: any = body.correctAnswer;
    let questionType: string | undefined = body.questionType;
    let questionSnapshot: any = undefined;

    const session = institutionalDb.liveSessions.find((s) => s.id === sessionId);
    const questionItem = session?.questions?.find((q: any) => q.id === questionId);

    if (questionItem) {
      if (correctAnswer === undefined) {
        correctAnswer = questionItem.correctAnswer ?? questionItem.correctOptionIndex ?? 0;
      }
      questionType = questionType || questionItem.questionType || (questionItem as any).type;
      questionSnapshot = questionItem;
    } else if (correctAnswer === undefined) {
      correctAnswer = body.answerPayload !== undefined ? body.answerPayload : 0;
    }

    // Run Server-Authoritative Anti-Cheat & Evaluation Engine
    const evaluation = QuizSecurityEngine.evaluateAnswer({
      playerId,
      questionId,
      questionType,
      questionSnapshot,
      answerPayload,
      correctAnswer,
      responseTimeMs: Number(responseTimeMs) || 1000,
      timeLimitMs: Number(timeLimitMs) || 30000,
      currentStreak: participant.currentStreak || 0,
      tabSwitchCount: Number(tabSwitchCount) || 0,
    });

    // Update in-memory participant stats
    const currentScore = participant.totalScore || 0;
    participant.totalScore = currentScore + evaluation.totalPoints;
    participant.currentStreak = evaluation.newStreak;
    if (evaluation.newStreak > (participant.bestStreak || 0)) {
      participant.bestStreak = evaluation.newStreak;
    }

    if (evaluation.isCorrect) {
      participant.correctAnswers = (participant.correctAnswers || 0) + 1;
    } else {
      participant.wrongAnswers = (participant.wrongAnswers || 0) + 1;
    }
    participant.lastSeenAt = new Date().toISOString();

    // Record Live Answer
    const newAnswerRecord: LiveAnswer = {
      id: `ans_${sessionId}_${playerId}_${questionId}_${Date.now()}`,
      sessionId,
      playerId,
      questionId,
      answerPayload,
      submittedAt: new Date().toISOString(),
      responseTimeMs: Number(responseTimeMs),
      isCorrect: evaluation.isCorrect,
      answerStatus: "SUBMITTED",
      basePoints: evaluation.basePoints,
      speedBonus: evaluation.speedBonus,
      streakBonus: evaluation.streakBonus,
      penalty: evaluation.penalty,
      totalPoints: evaluation.totalPoints,
      evaluatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    institutionalDb.liveAnswers.push(newAnswerRecord);

    // Recompute Ranks for the session
    const sessionParticipants = institutionalDb.liveParticipants.filter(
      (p) => p.sessionId === sessionId
    );
    sessionParticipants.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    sessionParticipants.forEach((p, idx) => {
      p.previousRank = p.rank;
      p.rank = idx + 1;
    });

    // MySQL Persistence via Prisma (If operational)
    if (isPrismaAvailable() && prisma) {
      try {
        await prisma.liveAnswer.create({
          data: {
            sessionId,
            playerId,
            questionId,
            answerPayload: JSON.stringify(answerPayload),
            responseTimeMs: Number(responseTimeMs),
            isCorrect: evaluation.isCorrect,
            totalPoints: evaluation.totalPoints,
          } as any,
        });

        await prisma.liveParticipant.update({
          where: { id: playerId },
          data: {
            totalScore: participant.totalScore,
            currentStreak: participant.currentStreak,
            correctAnswers: participant.correctAnswers,
          } as any,
        });
      } catch (dbErr) {
        console.warn("[Secure-Submit] Prisma update skipped, using in-memory state:", (dbErr as Error).message);
      }
    }

    // Milestone SMS Check & Auto-Dispatch (Task 2)
    let smsDispatched: { sent: boolean; type: "FUNNY_MOTIVATION" | "PRAISE"; studentName: string } | null = null;
    const sessionObj = institutionalDb.liveSessions.find(s => s.id === sessionId);
    const autoSmsMilestone = (sessionObj as any)?.autoSmsMilestone || (sessionObj as any)?.settings?.autoSmsMilestone || "off";

    if (autoSmsMilestone !== "off" && autoSmsMilestone !== "end_quiz") {
      const intervalNum = autoSmsMilestone === "every_3" ? 3 : autoSmsMilestone === "every_5" ? 5 : autoSmsMilestone === "every_10" ? 10 : 0;
      if (intervalNum > 0) {
        const studentGradedAnswers = institutionalDb.liveAnswers.filter(
          a => a.sessionId === sessionId && a.playerId === playerId && a.isCorrect !== null
        );
        const answeredGradedCount = studentGradedAnswers.length;

        if (answeredGradedCount > 0 && answeredGradedCount % intervalNum === 0) {
          if (!(sessionObj as any).sentMilestones) {
            (sessionObj as any).sentMilestones = [];
          }
          const milestoneKey = `${playerId}_q${answeredGradedCount}`;
          if (!(sessionObj as any).sentMilestones.includes(milestoneKey)) {
            (sessionObj as any).sentMilestones.push(milestoneKey);

            const correctCount = studentGradedAnswers.filter(a => a.isCorrect === true).length;
            const accuracyPct = Math.round((correctCount / answeredGradedCount) * 100);

            const smsFunnyMode = (sessionObj as any).smsFunnyMode ?? true;
            const smsPraiseMode = (sessionObj as any).smsPraiseMode ?? true;

            let msgText = "";
            let msgType: "FUNNY_MOTIVATION" | "PRAISE" | null = null;

            if (accuracyPct < 50 && smsFunnyMode) {
              msgType = "FUNNY_MOTIVATION";
              const customTpl = (sessionObj as any).customFunnyTemplate;
              if (customTpl && customTpl.trim()) {
                msgText = customTpl.replace("{student_name}", participant.displayName).replace("{accuracy}", `${accuracyPct}%`);
              } else {
                const pool = [...MOTIVATION_MESSAGES.LOW, ...MOTIVATION_MESSAGES.FAILED];
                const randomPick = pool[Math.floor(Math.random() * pool.length)];
                msgText = `[PTSC কুইজ] ${participant.displayName}, ${randomPick}`;
              }
            } else if (accuracyPct >= 80 && smsPraiseMode) {
              msgType = "PRAISE";
              const customTpl = (sessionObj as any).customPraiseTemplate;
              if (customTpl && customTpl.trim()) {
                msgText = customTpl.replace("{student_name}", participant.displayName).replace("{accuracy}", `${accuracyPct}%`);
              } else {
                const pool = MOTIVATION_MESSAGES.EXCELLENT;
                const randomPick = pool[Math.floor(Math.random() * pool.length)];
                msgText = `[PTSC কুইজ] অসাধারণ ${participant.displayName}! ${randomPick}`;
              }
            }

            if (msgText && msgType) {
              const targetPhone = participant.phone || "01700000000";
              const recipientType = (sessionObj as any).smsRecipient || "both";
              sendSmsGateway(
                targetPhone,
                msgText,
                "custom",
                participant.displayName,
                recipientType === "guardian" ? `${participant.displayName}-এর অভিভাবক` : participant.displayName
              ).catch(() => {});

              smsDispatched = {
                sent: true,
                type: msgType,
                studentName: participant.displayName
              };
              if (sessionObj) {
                (sessionObj as any).lastSmsDispatched = smsDispatched;
              }
            }
          }
        }
      }
    }

    // "All Voted!" Check — Stop timer and Auto-Reveal if all active players submitted
    const activeParticipants = institutionalDb.liveParticipants.filter(
      p => p.sessionId === sessionId && p.status === "JOINED"
    );
    const answersForCurrentQ = institutionalDb.liveAnswers.filter(
      a => a.sessionId === sessionId && a.questionId === questionId
    );
    const allVoted = activeParticipants.length > 0 && answersForCurrentQ.length >= activeParticipants.length;

    if (allVoted && sessionObj) {
      (sessionObj as any).allVoted = true;
      (sessionObj as any).isAnswerRevealed = true;
      (sessionObj as any).questionEndsAt = new Date().toISOString(); // Freeze timer immediately!
    }

    invalidateSessionCache(sessionId);

    return NextResponse.json({
      success: true,
      isCorrect: evaluation.isCorrect,
      correctAnswer: activeQuestion.correctAnswer ?? (activeQuestion as any).questionData?.correctAnswer,
      basePoints: evaluation.basePoints,
      speedBonus: evaluation.speedBonus,
      streakBonus: evaluation.streakBonus,
      penalty: evaluation.penalty,
      totalPoints: evaluation.totalPoints,
      newStreak: evaluation.newStreak,
      isFlagged: evaluation.isFlagged,
      flagReason: evaluation.flagReason,
      securityNotice: evaluation.securityNotice,
      totalScore: participant.totalScore,
      rank: participant.rank,
      allVoted: Boolean((sessionObj as any)?.allVoted),
      isAnswerRevealed: Boolean((sessionObj as any)?.isAnswerRevealed),
      submittedCount: answersForCurrentQ.length,
      totalPlayers: activeParticipants.length,
      source: isPrismaAvailable() ? "mysql" : "in-memory",
      smsDispatched
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "উত্তর মূল্যায়ন প্রক্রিয়ায় সমস্যা দেখা দিয়েছে।" },
      { status: 500 }
    );
  }
}
