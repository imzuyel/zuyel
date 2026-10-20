import { institutionalDb, LiveTeam, LiveTeamMember } from "./database";

export const PREDEFINED_TEAMS = [
  { name: "Team Alpha", displayName: "Team Alpha (আলফা)", color: "indigo" },
  { name: "Team Beta", displayName: "Team Beta (বিটা)", color: "emerald" },
  { name: "Team Gamma", displayName: "Team Gamma (গামা)", color: "amber" },
  { name: "Team Delta", displayName: "Team Delta (ডেল্টা)", color: "rose" },
  { name: "Team Omega", displayName: "Team Omega (ওমেগা)", color: "cyan" },
  { name: "Team Zeta", displayName: "Team Zeta (জিটা)", color: "purple" }
];

export class TeamService {
  /**
   * Initializes teams for a session based on team settings.
   */
  public static createTeamsForSession(sessionId: string, teamSettings?: any): LiveTeam[] {
    // Remove any existing teams for this session
    institutionalDb.liveTeams = institutionalDb.liveTeams.filter(t => t.sessionId !== sessionId);
    institutionalDb.liveTeamMembers = institutionalDb.liveTeamMembers.filter(tm => tm.sessionId !== sessionId);

    const numTeams = teamSettings?.numberOfTeams && teamSettings.numberOfTeams > 0 ? Math.min(teamSettings.numberOfTeams, 6) : 4;
    const now = new Date().toISOString();
    const createdTeams: LiveTeam[] = [];

    for (let i = 0; i < numTeams; i++) {
      const template = PREDEFINED_TEAMS[i] || { name: `Team ${i + 1}`, displayName: `Team ${i + 1}`, color: "indigo" };
      const teamId = `team-${sessionId}-${i + 1}-${Math.random().toString(36).substring(2, 7)}`;
      const newTeam: LiveTeam = {
        id: teamId,
        sessionId,
        name: template.name,
        displayName: template.displayName,
        color: template.color,
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now
      };
      institutionalDb.liveTeams.push(newTeam);
      createdTeams.push(newTeam);
    }

    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (session) {
      session.competitionMode = "team";
      session.teamSettings = teamSettings || {
        nameMode: "predefined",
        numberOfTeams: numTeams,
        assignmentMode: "automatic"
      };
      session.isTeamLocked = false;
    }

    return createdTeams;
  }

  /**
   * Assigns a student to a specific team.
   */
  public static assignStudent(sessionId: string, playerId: string, teamId: string): { success: boolean; message: string } {
    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) return { success: false, message: "Session not found." };
    if (session.isTeamLocked) return { success: false, message: "Teams are locked. Cannot modify membership." };

    const participant = institutionalDb.liveParticipants.find(p => p.id === playerId && p.sessionId === sessionId);
    if (!participant) return { success: false, message: "Participant not found in session." };

    const team = institutionalDb.liveTeams.find(t => t.id === teamId && t.sessionId === sessionId);
    if (!team) return { success: false, message: "Team not found in session." };

    // Remove existing membership for this player in this session
    institutionalDb.liveTeamMembers = institutionalDb.liveTeamMembers.filter(tm => tm.sessionId === sessionId && tm.playerId !== playerId);

    // Add new membership
    const membership: LiveTeamMember = {
      id: `tm-${Math.random().toString(36).substring(2, 9)}`,
      sessionId,
      teamId,
      playerId,
      joinedAt: new Date().toISOString()
    };
    institutionalDb.liveTeamMembers.push(membership);

    return { success: true, message: `Successfully assigned to ${team.displayName}` };
  }

  /**
   * Automatically and fairly distributes unassigned students across session teams.
   */
  public static autoAssignStudents(sessionId: string): { success: boolean; count: number; message: string } {
    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) return { success: false, count: 0, message: "Session not found." };
    if (session.isTeamLocked) return { success: false, count: 0, message: "Teams are locked." };

    const teams = institutionalDb.liveTeams.filter(t => t.sessionId === sessionId);
    if (teams.length === 0) return { success: false, count: 0, message: "No teams created for this session." };

    const participants = institutionalDb.liveParticipants.filter(p => p.sessionId === sessionId && p.status === "JOINED");
    if (participants.length === 0) return { success: true, count: 0, message: "No participants to assign." };

    // Get currently assigned player IDs
    const assignedPlayerIds = new Set(
      institutionalDb.liveTeamMembers.filter(tm => tm.sessionId === sessionId).map(tm => tm.playerId)
    );

    const unassigned = participants.filter(p => !assignedPlayerIds.has(p.id));
    if (unassigned.length === 0) return { success: true, count: 0, message: "All participants are already assigned." };

    // Round-robin distribution
    let assignedCount = 0;
    unassigned.forEach((p, index) => {
      const targetTeam = teams[index % teams.length];
      const membership: LiveTeamMember = {
        id: `tm-${Math.random().toString(36).substring(2, 9)}`,
        sessionId,
        teamId: targetTeam.id,
        playerId: p.id,
        joinedAt: new Date().toISOString()
      };
      institutionalDb.liveTeamMembers.push(membership);
      assignedCount++;
    });

    return { success: true, count: assignedCount, message: `Successfully auto-assigned ${assignedCount} students across ${teams.length} teams.` };
  }

  /**
   * Removes a student from their team.
   */
  public static removeStudent(sessionId: string, playerId: string): { success: boolean; message: string } {
    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) return { success: false, message: "Session not found." };
    if (session.isTeamLocked) return { success: false, message: "Teams are locked." };

    institutionalDb.liveTeamMembers = institutionalDb.liveTeamMembers.filter(tm => !(tm.sessionId === sessionId && tm.playerId === playerId));
    
    return { success: true, message: "Student removed from team." };
  }

  /**
   * Locks team memberships.
   */
  public static lockTeams(sessionId: string): { success: boolean; message: string } {
    const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
    if (!session) return { success: false, message: "Session not found." };
    session.isTeamLocked = true;

    institutionalDb.liveTeams.forEach(t => {
      if (t.sessionId === sessionId) t.status = "LOCKED";
    });

    return { success: true, message: "Teams locked successfully." };
  }

  /**
   * Calculates team scores and leaderboard.
   */
  public static getTeamLeaderboard(sessionId: string): any[] {
    const teams = institutionalDb.liveTeams.filter(t => t.sessionId === sessionId);
    const members = institutionalDb.liveTeamMembers.filter(tm => tm.sessionId === sessionId);
    const participants = institutionalDb.liveParticipants.filter(p => p.sessionId === sessionId);

    const teamScoresMap: { [teamId: string]: { totalScore: number; correct: number; wrong: number; unanswered: number; membersCount: number } } = {};

    teams.forEach(t => {
      teamScoresMap[t.id] = { totalScore: 0, correct: 0, wrong: 0, unanswered: 0, membersCount: 0 };
    });

    members.forEach(tm => {
      const p = participants.find(part => part.id === tm.playerId);
      const stats = teamScoresMap[tm.teamId];
      if (p && stats) {
        stats.membersCount++;
        stats.totalScore += (p.totalScore || 0);
        stats.correct += (p.correctAnswers || 0);
        stats.wrong += (p.wrongAnswers || 0);
        stats.unanswered += (p.unanswered || 0);
      }
    });

    const leaderboard = teams.map(t => {
      const stats = teamScoresMap[t.id] || { totalScore: 0, correct: 0, wrong: 0, unanswered: 0, membersCount: 0 };
      const teamMembersList = members
        .filter(tm => tm.teamId === t.id)
        .map(tm => {
          const p = participants.find(part => part.id === tm.playerId);
          return {
            playerId: tm.playerId,
            displayName: p ? p.displayName : "Unknown",
            score: p ? (p.totalScore || 0) : 0,
            correct: p ? (p.correctAnswers || 0) : 0,
            wrong: p ? (p.wrongAnswers || 0) : 0
          };
        });

      return {
        teamId: t.id,
        name: t.name,
        displayName: t.displayName,
        color: t.color || "indigo",
        totalScore: stats.totalScore,
        correctAnswers: stats.correct,
        wrongAnswers: stats.wrong,
        unanswered: stats.unanswered,
        membersCount: stats.membersCount,
        members: teamMembersList,
        rank: 1
      };
    });

    // Sort by totalScore descending, then by correctAnswers descending
    leaderboard.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return b.correctAnswers - a.correctAnswers;
    });

    // Assign ranks with tie handling
    let currentRank = 1;
    leaderboard.forEach((item, idx) => {
      if (idx > 0 && leaderboard[idx - 1].totalScore === item.totalScore && leaderboard[idx - 1].correctAnswers === item.correctAnswers) {
        item.rank = leaderboard[idx - 1].rank;
      } else {
        item.rank = currentRank;
      }
      currentRank++;
    });

    return leaderboard;
  }
}
