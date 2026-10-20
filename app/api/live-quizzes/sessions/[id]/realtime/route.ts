import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { getSessionQuestions, computeQuizSequenceState } from "@/lib/liveQuizHelper";
import { ScoringService } from "@/lib/scoringService";
import { PresenceService } from "@/lib/reconnectService";
import { TeamService } from "@/lib/teamService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");
    const isHost = searchParams.get("isHost") === "true";

    // Track presence & heartbeat automatically during polling
    if (isHost) {
      PresenceService.updateHostHeartbeat(id);
    } else if (playerId) {
      PresenceService.updateHeartbeat(id, playerId);
    }

    // Process timeouts to transition disconnecting players
    PresenceService.processPresenceTimeouts();

    const session = institutionalDb.liveSessions.find(s => s.id === id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Live quiz session not found" },
        { status: 404 }
      );
    }

    // Retrieve safe questions snapshot
    const questions = getSessionQuestions(session.quizId);
    const totalQuestions = questions.length;
    const currentIdx = session.currentQuestionIndex || 0;

    // Get all joined participants
    const participants = institutionalDb.liveParticipants.filter(
      p => p.sessionId === id && p.status === "JOINED"
    );

    // Server-authoritative state timeout transition check
    const now = new Date();
    if (session.status === "QUESTION_ACTIVE" && session.questionEndsAt) {
      const endsAt = new Date(session.questionEndsAt);
      if (now >= endsAt) {
        session.status = "QUESTION_ENDED";
        session.updatedAt = now.toISOString();

        // Trigger Server-side Bulk Evaluation for this question upon natural expiration
        if (totalQuestions > 0 && currentIdx < totalQuestions) {
          const activeQuestion = questions[currentIdx];
          ScoringService.evaluateSessionQuestion(id, activeQuestion.id);
        }
      }
    }

    let currentQuestion: any = null;
    let answeredCount = 0;
    let playerAnswered = false;

    if (totalQuestions > 0 && currentIdx < totalQuestions) {
      const originalQ: any = questions[currentIdx];
      
      // Compute safe public question schema
      currentQuestion = {
        id: originalQ.id,
        questionText: originalQ.questionText,
        type: originalQ.type,
        options: originalQ.options,
        questionData: originalQ.questionData ? { ...originalQ.questionData } : undefined,
        timeLimit: originalQ.timeLimit
      };

      // Ensure NO correct answers are leaked BEFORE question ends
      if (session.status !== "QUESTION_ENDED" && currentQuestion.questionData) {
        delete currentQuestion.questionData.correctIndex;
        delete currentQuestion.questionData.correctAnswer;
        delete currentQuestion.questionData.correctAnswers;
        delete currentQuestion.questionData.explanation;
        if (currentQuestion.questionData.pairs) {
          // Shuffle or map pairs to mask the correct left-right mapping
          currentQuestion.questionData.pairs = currentQuestion.questionData.pairs.map((p: any) => ({
            left: p.left,
            right: p.right
          }));
        }
      } else if (session.status === "QUESTION_ENDED") {
        // Expose correct answer and explanation to show on results screen
        currentQuestion.correctAnswer = originalQ.correctAnswer;
        currentQuestion.explanation = originalQ.questionData?.explanation;
      }

      // Count answers for this question
      const answers = institutionalDb.liveAnswers.filter(
        a => a.sessionId === id && a.questionId === originalQ.id
      );
      answeredCount = answers.length;

      // Check if the specific querying player already answered
      if (playerId) {
        playerAnswered = answers.some(a => a.playerId === playerId);
      }
    }

    // Evaluate on-demand when someone polls a QUESTION_ENDED state to keep ranks synced
    if (session.status === "QUESTION_ENDED" && totalQuestions > 0 && currentIdx < totalQuestions) {
      const activeQuestion = questions[currentIdx];
      ScoringService.evaluateSessionQuestion(id, activeQuestion.id);
    }

    // Lookup specific player evaluation and scoreboard details
    let playerEvaluation = null;
    let studentStats = null;
    let motivationMessage = null;

    if (playerId) {
      const participant = institutionalDb.liveParticipants.find(
        p => p.id === playerId && p.sessionId === id
      );
      if (participant) {
        studentStats = {
          totalScore: participant.totalScore || 0,
          rank: participant.rank || 0,
          previousRank: participant.previousRank || 0,
          currentStreak: participant.currentStreak || 0,
          bestStreak: participant.bestStreak || 0,
          correctAnswers: participant.correctAnswers || 0,
          wrongAnswers: participant.wrongAnswers || 0,
          unanswered: participant.unanswered || 0
        };

        if (participant.motivationMessage && !participant.motivationMessage.shown) {
          motivationMessage = {
            category: participant.motivationMessage.category,
            message: participant.motivationMessage.message,
            questionIndex: participant.motivationMessage.questionIndex,
            durationMs: 8000
          };
          participant.motivationMessage.shown = true;
        }

        if (session.status === "QUESTION_ENDED" && totalQuestions > 0 && currentIdx < totalQuestions) {
          const activeQuestion = questions[currentIdx];
          const answer = institutionalDb.liveAnswers.find(
            a => a.sessionId === id && a.playerId === playerId && a.questionId === activeQuestion.id
          );
          if (answer) {
            playerEvaluation = {
              id: answer.id,
              isCorrect: answer.isCorrect,
              answerStatus: answer.answerStatus,
              basePoints: answer.basePoints || 0,
              speedBonus: answer.speedBonus || 0,
              streakBonus: answer.streakBonus || 0,
              totalPoints: answer.totalPoints || 0,
              streak: participant.currentStreak || 0,
              answerPayload: answer.answerPayload
            };
          } else {
            // Unanswered evaluation fallback in case it wasn't captured in evaluationSessionQuestion loop yet
            playerEvaluation = {
              id: `ans-un-f-${Date.now()}`,
              isCorrect: false,
              answerStatus: "UNANSWERED",
              basePoints: 0,
              speedBonus: 0,
              streakBonus: 0,
              totalPoints: 0,
              streak: 0,
              answerPayload: null
            };
          }
        }
      }
    }

    let teamLeaderboard: any[] = [];
    let playerTeam: any = null;
    if (session.competitionMode === "team") {
      teamLeaderboard = TeamService.getTeamLeaderboard(id);
      if (playerId) {
        const membership = institutionalDb.liveTeamMembers.find(tm => tm.sessionId === id && tm.playerId === playerId);
        if (membership) {
          const t = institutionalDb.liveTeams.find(team => team.id === membership.teamId);
          if (t) {
            const teamInfo = teamLeaderboard.find(item => item.teamId === t.id);
            playerTeam = teamInfo || { teamId: t.id, name: t.name, displayName: t.displayName, color: t.color };
          }
        }
      }
    }

    const sequenceState = computeQuizSequenceState(session, currentQuestion?.timeLimit || 30);

    return NextResponse.json({
      success: true,
      status: session.status,
      isQuizModeStarted: session.isQuizModeStarted || false,
      activePreQuizActivity: session.activePreQuizActivity || null,
      sequenceState,
      phase: sequenceState.phase,
      countdownSecondsRemaining: sequenceState.countdownSecondsRemaining,
      previewSecondsRemaining: sequenceState.previewSecondsRemaining,
      mainTimerSecondsRemaining: sequenceState.mainTimerSecondsRemaining,
      isOptionsRevealed: sequenceState.isOptionsRevealed,
      canSubmitAnswer: sequenceState.canSubmitAnswer,
      isLocked: session.isLocked,
      competitionMode: session.competitionMode || "individual",
      isTeamLocked: session.isTeamLocked || false,
      teamLeaderboard,
      playerTeam,
      currentQuestionIndex: currentIdx,
      questionStartedAt: session.questionStartedAt,
      questionEndsAt: session.questionEndsAt,
      serverTime: now.toISOString(),
      totalQuestions,
      playerCount: participants.length,
      answeredCount,
      playerAnswered,
      currentQuestion: (session.isQuizModeStarted && (session.status === "QUESTION_ACTIVE" || session.status === "QUESTION_ENDED")) ? currentQuestion : null,
      playerEvaluation,
      studentStats,
      motivationMessage: session.isQuizModeStarted ? motivationMessage : null,
      participants: participants.map(p => ({
        id: p.id,
        displayName: p.displayName,
        avatar: p.avatar || "🤖",
        studentId: p.studentId,
        joinedAt: p.joinedAt,
        score: p.totalScore || 0,
        streak: p.currentStreak || 0,
        rank: p.rank || 0,
        previousRank: p.previousRank || 0
      })).sort((a, b) => b.score - a.score),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to sync realtime status" },
      { status: 500 }
    );
  }
}
