import { institutionalDb, Tournament, TournamentParticipant, TournamentRound, TournamentMatch, LiveSession } from "./database";
import { getSessionQuestions } from "./liveQuizHelper";
import { ScoringService } from "./scoringService";

export const TournamentService = {
  // Create Tournament
  createTournament(data: {
    name: string;
    description?: string;
    quizId: string;
    mode: "individual" | "team";
    maxParticipants: number;
    numberOfRounds?: number;
    qualificationRule?: string;
    matchSize?: number;
    startTime?: string;
  }): Tournament {
    const id = `tourn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTournament: Tournament = {
      id,
      name: data.name,
      description: data.description || "",
      quizId: data.quizId,
      mode: data.mode || "individual",
      maxParticipants: data.maxParticipants || 8,
      numberOfRounds: data.numberOfRounds || Math.ceil(Math.log2(data.maxParticipants || 8)),
      qualificationRule: data.qualificationRule || "Top 1 per match advances",
      matchSize: data.matchSize || 2,
      startTime: data.startTime || new Date(Date.now() + 86400000).toISOString(),
      registrationStatus: "REGISTRATION_OPEN",
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    institutionalDb.tournaments.unshift(newTournament);
    return newTournament;
  },

  // Add Participant
  addParticipant(tournamentId: string, data: { studentId?: number; teamId?: string; name: string }): TournamentParticipant {
    const tournament = institutionalDb.tournaments.find(t => t.id === tournamentId);
    if (!tournament) throw new Error("Tournament not found");
    if (tournament.status !== "DRAFT" && tournament.registrationStatus !== "REGISTRATION_OPEN") {
      throw new Error("Tournament registration is closed or tournament has started");
    }

    // Check duplicate
    const existing = institutionalDb.tournamentParticipants.find(
      p => p.tournamentId === tournamentId && (
        (data.studentId && p.studentId === data.studentId) ||
        (data.teamId && p.teamId === data.teamId) ||
        (p.name.toLowerCase() === data.name.toLowerCase())
      )
    );
    if (existing) throw new Error("Participant already registered in this tournament");

    const id = `tp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const participantCount = institutionalDb.tournamentParticipants.filter(p => p.tournamentId === tournamentId).length;

    const newParticipant: TournamentParticipant = {
      id,
      tournamentId,
      studentId: data.studentId,
      teamId: data.teamId,
      name: data.name,
      seed: participantCount + 1,
      status: "ACTIVE",
      registrationTime: new Date().toISOString(),
      qualificationStatus: "Registered"
    };

    institutionalDb.tournamentParticipants.push(newParticipant);
    return newParticipant;
  },

  // Remove Participant
  removeParticipant(tournamentId: string, participantId: string): boolean {
    const tournament = institutionalDb.tournaments.find(t => t.id === tournamentId);
    if (!tournament) throw new Error("Tournament not found");
    if (tournament.status !== "DRAFT" && tournament.registrationStatus !== "REGISTRATION_OPEN") {
      throw new Error("Cannot remove participant after tournament has started");
    }

    const idx = institutionalDb.tournamentParticipants.findIndex(p => p.id === participantId && p.tournamentId === tournamentId);
    if (idx === -1) return false;

    institutionalDb.tournamentParticipants.splice(idx, 1);
    return true;
  },

  // Update Seeding
  updateSeeding(tournamentId: string, seedMap: { participantId: string; seed: number }[]): void {
    const tournament = institutionalDb.tournaments.find(t => t.id === tournamentId);
    if (!tournament) throw new Error("Tournament not found");
    if (tournament.status === "LIVE" || tournament.status === "COMPLETED") {
      throw new Error("Cannot change seeding after tournament is LIVE");
    }

    seedMap.forEach(item => {
      const p = institutionalDb.tournamentParticipants.find(tp => tp.id === item.participantId && tp.tournamentId === tournamentId);
      if (p) {
        p.seed = item.seed;
      }
    });

    // Sort participants by seed
    institutionalDb.tournamentParticipants.sort((a, b) => {
      if (a.tournamentId === tournamentId && b.tournamentId === tournamentId) {
        return a.seed - b.seed;
      }
      return 0;
    });
  },

  // Generate Bracket & Rounds
  generateBracket(tournamentId: string): { rounds: TournamentRound[]; matches: TournamentMatch[] } {
    const tournament = institutionalDb.tournaments.find(t => t.id === tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    const participants = institutionalDb.tournamentParticipants.filter(p => p.tournamentId === tournamentId);
    if (participants.length < 2) {
      throw new Error("At least 2 participants are required to generate a bracket");
    }

    // Clear existing rounds and matches for this tournament
    institutionalDb.tournamentRounds = institutionalDb.tournamentRounds.filter(r => r.tournamentId !== tournamentId);
    institutionalDb.tournamentMatches = institutionalDb.tournamentMatches.filter(m => m.tournamentId !== tournamentId);

    // Sort by seed
    const sortedParticipants = [...participants].sort((a, b) => a.seed - b.seed);
    const totalP = sortedParticipants.length;

    // Calculate nearest power of 2 for single elimination bracket
    let bracketSize = 2;
    while (bracketSize < totalP) {
      bracketSize *= 2;
    }

    const totalRounds = Math.log2(bracketSize);
    tournament.numberOfRounds = totalRounds;

    const roundNames = ["Final", "Semi Final", "Quarter Final", "Round 1", "Round 0"];
    const rounds: TournamentRound[] = [];
    const matches: TournamentMatch[] = [];

    // Create rounds from Round 1 up to Final
    for (let rNum = 1; rNum <= totalRounds; rNum++) {
      const roundId = `rnd_${tournamentId}_${rNum}`;
      const nameIndex = totalRounds - rNum;
      const roundName = nameIndex === 0 ? "Final" : nameIndex === 1 ? "Semi Final" : nameIndex === 2 ? "Quarter Final" : `Round ${rNum}`;
      
      const round: TournamentRound = {
        id: roundId,
        tournamentId,
        roundNumber: rNum,
        name: roundName,
        status: rNum === 1 ? "PENDING" : "PENDING"
      };
      rounds.push(round);
      institutionalDb.tournamentRounds.push(round);
    }

    // Generate Round 1 matches with standard seeding (e.g. 1 vs 8, 4 vs 5, etc.)
    const round1 = rounds[0];
    const numMatchesRound1 = bracketSize / 2;

    // Seed pairing algorithm for single elimination
    const getSeededOrder = (size: number): number[] => {
      let order = [1, 2];
      while (order.length < size) {
        const nextOrder: number[] = [];
        const sum = order.length * 2 + 1;
        for (const seed of order) {
          nextOrder.push(seed);
          nextOrder.push(sum - seed);
        }
        order = nextOrder;
      }
      return order;
    };

    const seededSeeds = getSeededOrder(bracketSize);

    for (let m = 0; m < numMatchesRound1; m++) {
      const matchId = `match_${tournamentId}_r1_${m + 1}`;
      const seedA = seededSeeds[m * 2];
      const seedB = seededSeeds[m * 2 + 1];

      const participantA = sortedParticipants.find(p => p.seed === seedA);
      const participantB = sortedParticipants.find(p => p.seed === seedB);

      const isBye = !participantA || !participantB;
      let winnerId = null;
      let winnerName = null;
      let matchStatus: "PENDING" | "READY" | "COMPLETED" = "PENDING";

      if (isBye) {
        const activeP = participantA || participantB;
        if (activeP) {
          winnerId = activeP.id;
          winnerName = activeP.name;
          matchStatus = "COMPLETED";
        }
      } else {
        matchStatus = "READY";
      }

      const match: TournamentMatch = {
        id: matchId,
        tournamentId,
        roundId: round1.id,
        matchNumber: m + 1,
        participantAId: participantA ? participantA.id : null,
        participantBId: participantB ? participantB.id : null,
        participantAName: participantA ? participantA.name : "BYE",
        participantBName: participantB ? participantB.name : "BYE",
        status: matchStatus,
        winnerId,
        winnerName,
        scoreA: 0,
        scoreB: 0,
        isBye
      };

      matches.push(match);
      institutionalDb.tournamentMatches.push(match);
    }

    // Generate placeholder matches for subsequent rounds (Round 2 onwards)
    for (let rNum = 2; rNum <= totalRounds; rNum++) {
      const prevRoundMatches = matches.filter(m => m.roundId === rounds[rNum - 2].id);
      const currentRound = rounds[rNum - 1];
      const numMatches = prevRoundMatches.length / 2;

      for (let m = 0; m < numMatches; m++) {
        const matchId = `match_${tournamentId}_r${rNum}_${m + 1}`;
        const match: TournamentMatch = {
          id: matchId,
          tournamentId,
          roundId: currentRound.id,
          matchNumber: m + 1,
          participantAId: null,
          participantBId: null,
          participantAName: "TBD",
          participantBName: "TBD",
          status: "PENDING",
          winnerId: null,
          winnerName: null,
          scoreA: 0,
          scoreB: 0,
          isBye: false
        };
        matches.push(match);
        institutionalDb.tournamentMatches.push(match);
      }
    }

    tournament.status = "READY";
    tournament.registrationStatus = "REGISTRATION_CLOSED";
    tournament.updatedAt = new Date().toISOString();

    return { rounds, matches };
  },

  // Start Tournament
  startTournament(tournamentId: string): Tournament {
    const tournament = institutionalDb.tournaments.find(t => t.id === tournamentId);
    if (!tournament) throw new Error("Tournament not found");
    if (tournament.status === "LIVE" || tournament.status === "COMPLETED") {
      throw new Error("Tournament is already LIVE or COMPLETED");
    }

    tournament.status = "LIVE";
    tournament.updatedAt = new Date().toISOString();

    // Set first round to LIVE
    const firstRound = institutionalDb.tournamentRounds.find(r => r.tournamentId === tournamentId && r.roundNumber === 1);
    if (firstRound) {
      firstRound.status = "LIVE";
    }

    return tournament;
  },

  // Start a specific match (Spawns underlying Live Quiz Session!)
  startMatch(tournamentId: string, matchId: string, hostUserId: number = 3): { match: TournamentMatch; session: LiveSession } {
    const tournament = institutionalDb.tournaments.find(t => t.id === tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    const match = institutionalDb.tournamentMatches.find(m => m.id === matchId && m.tournamentId === tournamentId);
    if (!match) throw new Error("Match not found");
    if (match.status === "COMPLETED") throw new Error("Match already completed");
    if (!match.participantAId || !match.participantBId) {
      throw new Error("Match participants are not yet fully determined");
    }

    // Create underlying Live Quiz Session
    const sessionId = `sess_tourn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionCode = Math.floor(100000 + Math.random() * 900000).toString();
    const joinToken = Math.random().toString(36).substring(2, 15);

    const newSession: LiveSession = {
      id: sessionId,
      quizId: tournament.quizId,
      hostUserId,
      sessionCode,
      joinToken,
      status: "LOBBY",
      maxPlayers: 10,
      isLocked: false,
      currentQuestionIndex: 0,
      competitionMode: tournament.mode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hostConnectionStatus: "online"
    };

    institutionalDb.liveSessions.unshift(newSession);

    // Auto-register match participants into the live session
    const pA = institutionalDb.tournamentParticipants.find(p => p.id === match.participantAId);
    const pB = institutionalDb.tournamentParticipants.find(p => p.id === match.participantBId);

    [pA, pB].forEach((participant, idx) => {
      if (participant) {
        const livePlayerId = `p_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
        institutionalDb.liveParticipants.push({
          id: livePlayerId,
          sessionId,
          studentId: participant.studentId,
          displayName: participant.name,
          playerToken: Math.random().toString(36).substring(2, 12),
          status: "JOINED",
          joinedAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalScore: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          unanswered: 0,
          connectionStatus: "online"
        });
      }
    });

    match.quizSessionId = sessionId;
    match.status = "LIVE";
    match.startedAt = new Date().toISOString();

    return { match, session: newSession };
  },

  // Complete Match & Progress Winner
  completeMatch(tournamentId: string, matchId: string): TournamentMatch {
    const tournament = institutionalDb.tournaments.find(t => t.id === tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    const match = institutionalDb.tournamentMatches.find(m => m.id === matchId && m.tournamentId === tournamentId);
    if (!match) throw new Error("Match not found");
    if (match.status === "COMPLETED") return match;

    let winnerId = match.participantAId;
    let winnerName = match.participantAName;
    let loserId = match.participantBId;
    let scoreA = 100;
    let scoreB = 50;

    if (match.quizSessionId) {
      const session = institutionalDb.liveSessions.find(s => s.id === match.quizSessionId);
      const participants = institutionalDb.liveParticipants.filter(p => p.sessionId === match.quizSessionId);

      if (participants.length >= 2) {
        // Sort participants by score descending, then by correct answers
        participants.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
        const topPlayer = participants[0];
        const runnerUp = participants[1];

        scoreA = topPlayer.totalScore || 0;
        scoreB = runnerUp.totalScore || 0;

        // Map live participant back to tournament participant
        const tpA = institutionalDb.tournamentParticipants.find(tp => tp.tournamentId === tournamentId && tp.name === topPlayer.displayName);
        const tpB = institutionalDb.tournamentParticipants.find(tp => tp.tournamentId === tournamentId && tp.name === runnerUp.displayName);

        if (tpA) {
          winnerId = tpA.id;
          winnerName = tpA.name;
        }
        if (tpB) {
          loserId = tpB.id;
        }
      }
    } else if (match.isBye) {
      winnerId = match.participantAId || match.participantBId;
      winnerName = match.participantAName !== "BYE" ? match.participantAName : match.participantBName;
      loserId = null;
    }

    match.status = "COMPLETED";
    match.winnerId = winnerId;
    match.winnerName = winnerName || "Winner";
    match.loserId = loserId;
    match.scoreA = scoreA;
    match.scoreB = scoreB;
    match.completedAt = new Date().toISOString();

    // Update participant statuses
    if (winnerId) {
      const winP = institutionalDb.tournamentParticipants.find(p => p.id === winnerId);
      if (winP) winP.qualificationStatus = "Won Match";
    }
    if (loserId) {
      const loseP = institutionalDb.tournamentParticipants.find(p => p.id === loserId);
      if (loseP) {
        loseP.status = "ELIMINATED";
        loseP.qualificationStatus = "Eliminated";
      }
    }

    // Automatically progress winner to next round bracket node
    TournamentService.progressWinnerToNextRound(tournamentId, match);

    // Check if tournament is complete
    TournamentService.checkTournamentCompletion(tournamentId);

    return match;
  },

  // Progress winner to next round
  progressWinnerToNextRound(tournamentId: string, completedMatch: TournamentMatch): void {
    const currentRound = institutionalDb.tournamentRounds.find(r => r.id === completedMatch.roundId);
    if (!currentRound) return;

    const nextRound = institutionalDb.tournamentRounds.find(
      r => r.tournamentId === tournamentId && r.roundNumber === currentRound.roundNumber + 1
    );
    if (!nextRound) {
      // This was the Final match! Set champion
      const tournament = institutionalDb.tournaments.find(t => t.id === tournamentId);
      if (tournament && completedMatch.winnerId) {
        tournament.championParticipantId = completedMatch.winnerId;
        tournament.championName = completedMatch.winnerName || "Champion";
        const champP = institutionalDb.tournamentParticipants.find(p => p.id === completedMatch.winnerId);
        if (champP) {
          champP.status = "CHAMPION";
          champP.qualificationStatus = "Tournament Champion 🏆";
        }
      }
      return;
    }

    // Find corresponding match in next round
    // In standard binary tree: matchNumber m in round r feeds matchNumber ceil(m / 2) in round r+1
    const nextMatchNumber = Math.ceil(completedMatch.matchNumber / 2);
    const nextMatch = institutionalDb.tournamentMatches.find(
      m => m.tournamentId === tournamentId && m.roundId === nextRound.id && m.matchNumber === nextMatchNumber
    );

    if (nextMatch) {
      const isFirstSlot = completedMatch.matchNumber % 2 !== 0;
      if (isFirstSlot) {
        nextMatch.participantAId = completedMatch.winnerId;
        nextMatch.participantAName = completedMatch.winnerName || "Winner";
      } else {
        nextMatch.participantBId = completedMatch.winnerId;
        nextMatch.participantBName = completedMatch.winnerName || "Winner";
      }

      if (nextMatch.participantAId && nextMatch.participantBId) {
        nextMatch.status = "READY";
      }
    }
  },

  // Check Tournament Completion
  checkTournamentCompletion(tournamentId: string): void {
    const rounds = institutionalDb.tournamentRounds.filter(r => r.tournamentId === tournamentId);
    const finalRound = rounds[rounds.length - 1];
    if (!finalRound) return;

    const finalMatches = institutionalDb.tournamentMatches.filter(m => m.roundId === finalRound.id);
    const allFinalsDone = finalMatches.length > 0 && finalMatches.every(m => m.status === "COMPLETED");

    if (allFinalsDone) {
      const tournament = institutionalDb.tournaments.find(t => t.id === tournamentId);
      if (tournament) {
        tournament.status = "COMPLETED";
        tournament.updatedAt = new Date().toISOString();
      }
    }
  }
};
