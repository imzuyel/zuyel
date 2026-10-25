"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Trophy,
  Flame,
  Award,
  Users,
  User,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  Volume2,
  VolumeX,
  Crown,
  Medal,
  Layers,
  Radio,
  RefreshCw,
} from "lucide-react";

export interface ParticipantScoreItem {
  id: string;
  displayName: string;
  score: number;
  streak: number;
  rank: number;
  previousRank?: number;
  teamName?: string;
  teamColor?: string;
  avatarUrl?: string;
  isFlagged?: boolean;
}

export interface TeamScoreItem {
  teamId: string;
  name: string;
  displayName: string;
  color: string;
  totalScore: number;
  averageScore: number;
  membersCount: number;
  rank: number;
  topScorerName?: string;
}

export interface LiveLeaderboardViewProps {
  quizTitle?: string;
  sessionCode?: string;
  currentQuestion?: number;
  totalQuestions?: number;
  participants?: ParticipantScoreItem[];
  teams?: TeamScoreItem[];
  initialMode?: "individual" | "team";
  onRefresh?: () => void;
}

// Fallback high-fidelity sample data for preview mode
const SAMPLE_PARTICIPANTS: ParticipantScoreItem[] = [
  { id: "p1", displayName: "কাজী তানভীর হাসান", score: 8450, streak: 6, rank: 1, previousRank: 2, teamName: "Team Alpha", teamColor: "indigo" },
  { id: "p2", displayName: "নুসরাত জাহান", score: 8120, streak: 4, rank: 2, previousRank: 1, teamName: "Team Beta", teamColor: "emerald" },
  { id: "p3", displayName: "মোহাম্মদ রাশেদুল ইসলাম", score: 7680, streak: 3, rank: 3, previousRank: 3, teamName: "Team Gamma", teamColor: "amber" },
  { id: "p4", displayName: "সাদিয়া আফরিন", score: 6940, streak: 2, rank: 4, previousRank: 5, teamName: "Team Alpha", teamColor: "indigo" },
  { id: "p5", displayName: "মোছা. আফসানা মিমি", score: 6710, streak: 2, rank: 5, previousRank: 4, teamName: "Team Delta", teamColor: "rose" },
  { id: "p6", displayName: "তানজিম আহমেদ", score: 5980, streak: 1, rank: 6, previousRank: 6, teamName: "Team Beta", teamColor: "emerald" },
  { id: "p7", displayName: "ফারহানা আক্তার", score: 5420, streak: 0, rank: 7, previousRank: 8, teamName: "Team Gamma", teamColor: "amber" },
  { id: "p8", displayName: "মো. নাঈম হাসান", score: 4950, streak: 1, rank: 8, previousRank: 7, teamName: "Team Delta", teamColor: "rose" },
];

const SAMPLE_TEAMS: TeamScoreItem[] = [
  { teamId: "t1", name: "Team Alpha", displayName: "Team Alpha (আলফা)", color: "indigo", totalScore: 15390, averageScore: 7695, membersCount: 2, rank: 1, topScorerName: "কাজী তানভীর হাসান" },
  { teamId: "t2", name: "Team Beta", displayName: "Team Beta (বিটা)", color: "emerald", totalScore: 14100, averageScore: 7050, membersCount: 2, rank: 2, topScorerName: "নুসরাত জাহান" },
  { teamId: "t3", name: "Team Gamma", displayName: "Team Gamma (গামা)", color: "amber", totalScore: 13100, averageScore: 6550, membersCount: 2, rank: 3, topScorerName: "মোহাম্মদ রাশেদুল ইসলাম" },
  { teamId: "t4", name: "Team Delta", displayName: "Team Delta (ডেল্টা)", color: "rose", totalScore: 11660, averageScore: 5830, membersCount: 2, rank: 4, topScorerName: "মোছা. আফসানা মিমি" },
];

const CONFETTI_COLORS = ["#f59e0b", "#10b981", "#6366f1", "#ec4899", "#06b6d4"];

/**
 * Structural equality helpers.
 */
function isSameParticipant(
  a: ParticipantScoreItem | undefined,
  b: ParticipantScoreItem | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  return (
    a.id === b.id &&
    a.displayName === b.displayName &&
    a.score === b.score &&
    a.streak === b.streak &&
    a.rank === b.rank &&
    a.previousRank === b.previousRank &&
    a.teamName === b.teamName &&
    a.teamColor === b.teamColor &&
    a.avatarUrl === b.avatarUrl &&
    a.isFlagged === b.isFlagged
  );
}

function isSameParticipantList(
  a: ParticipantScoreItem[],
  b: ParticipantScoreItem[]
): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i += 1) {
    if (!isSameParticipant(a[i], b[i])) return false;
  }
  return true;
}

function isSameTeam(a: TeamScoreItem | undefined, b: TeamScoreItem | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  return (
    a.teamId === b.teamId &&
    a.name === b.name &&
    a.displayName === b.displayName &&
    a.color === b.color &&
    a.totalScore === b.totalScore &&
    a.averageScore === b.averageScore &&
    a.membersCount === b.membersCount &&
    a.rank === b.rank &&
    a.topScorerName === b.topScorerName
  );
}

function isSameTeamList(a: TeamScoreItem[], b: TeamScoreItem[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i += 1) {
    if (!isSameTeam(a[i], b[i])) return false;
  }
  return true;
}

/* -------------------------------------------------------------------------- */
/*                            Podium (top three)                              */
/* -------------------------------------------------------------------------- */

type PodiumPlace = 1 | 2 | 3;

interface PodiumVisual {
  wrapper: string;
  avatar: string;
  badge: string;
  rankLabel: string;
  name: string;
  score: string;
  streak: string;
  streakIcon: string;
  streakSuffix: string;
  pillar: string;
  medal: string;
  label: string;
  labelClass: string;
}

const PODIUM_VISUALS: Record<PodiumPlace, PodiumVisual> = {
  1: {
    wrapper:
      "flex-1 flex flex-col items-center animate-in fade-in slide-in-from-bottom-12 duration-1000 -mt-6",
    avatar:
      "w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 text-slate-950 flex items-center justify-center font-black text-2xl shadow-xl shadow-amber-500/30 border-2 border-yellow-300",
    badge:
      "absolute -top-3 w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-lg ring-2 ring-yellow-200",
    rankLabel: "১",
    name: "font-extrabold text-sm sm:text-base truncate text-amber-200",
    score:
      "font-mono font-black text-amber-400 text-lg sm:text-xl drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]",
    streak: "inline-flex items-center gap-1 text-xs text-rose-400 font-mono font-bold",
    streakIcon: "w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse",
    streakSuffix: " Streak!",
    pillar:
      "w-full h-44 sm:h-52 bg-gradient-to-t from-slate-900 via-amber-950/60 to-amber-500/30 rounded-t-2xl border-t-4 border-amber-400 shadow-2xl flex flex-col items-center justify-center p-2 mt-2",
    medal: "w-10 h-10 text-amber-400 fill-amber-400/80",
    label: "চ্যাম্পিয়ন",
    labelClass: "text-xs font-black text-amber-300 mt-1 uppercase tracking-widest",
  },
  2: {
    wrapper:
      "flex-1 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700",
    avatar:
      "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-slate-400/20 border-2 border-slate-300 dark:border-slate-700",
    badge:
      "absolute -top-3 w-6 h-6 rounded-full bg-slate-300 text-slate-900 dark:text-slate-100 flex items-center justify-center font-bold text-xs shadow-md",
    rankLabel: "২",
    name: "font-bold text-xs sm:text-sm truncate text-slate-200",
    score: "font-mono font-black text-slate-300 text-sm sm:text-base",
    streak: "inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono",
    streakIcon: "w-3 h-3 text-amber-500 fill-amber-500",
    streakSuffix: "",
    pillar:
      "w-full h-32 sm:h-40 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-700/80 rounded-t-2xl border-t-4 border-slate-300 dark:border-slate-700 shadow-xl flex flex-col items-center justify-center p-2 mt-2",
    medal: "w-8 h-8 text-slate-300",
    label: "২য় স্থান",
    labelClass: "text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider",
  },
  3: {
    wrapper:
      "flex-1 flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-500",
    avatar:
      "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-amber-700/20 border-2 border-amber-600",
    badge:
      "absolute -top-3 w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-xs shadow-md",
    rankLabel: "৩",
    name: "font-bold text-xs sm:text-sm truncate text-slate-200",
    score: "font-mono font-black text-amber-500 text-sm sm:text-base",
    streak: "inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono",
    streakIcon: "w-3 h-3 text-amber-500 fill-amber-500",
    streakSuffix: "",
    pillar:
      "w-full h-24 sm:h-32 bg-gradient-to-t from-slate-900 via-slate-800 to-amber-900/40 rounded-t-2xl border-t-4 border-amber-600 shadow-xl flex flex-col items-center justify-center p-2 mt-2",
    medal: "w-7 h-7 text-amber-500",
    label: "৩য় স্থান",
    labelClass: "text-[11px] font-bold text-amber-400 mt-1 uppercase tracking-wider",
  },
};

interface PodiumSpotProps {
  participant: ParticipantScoreItem;
  place: PodiumPlace;
}

const PodiumSpot = memo(
  function PodiumSpot({ participant, place }: PodiumSpotProps) {
    const visual = PODIUM_VISUALS[place];

    return (
      <div className={visual.wrapper}>
        {place === 1 && (
          <Crown className="w-8 h-8 text-amber-400 animate-bounce mb-1 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
        )}

        <div className="relative mb-2 flex flex-col items-center">
          <div className={visual.avatar}>{participant.displayName.slice(0, 1)}</div>
          <span className={visual.badge}>{visual.rankLabel}</span>
        </div>

        <div className="text-center w-full px-1">
          <div className={visual.name}>{participant.displayName}</div>
          <div className={visual.score}>{participant.score.toLocaleString()}</div>
          {participant.streak > 1 && (
            <span className={visual.streak}>
              <Flame className={visual.streakIcon} />
              <span>
                x{participant.streak}
                {visual.streakSuffix}
              </span>
            </span>
          )}
        </div>

        <div className={visual.pillar}>
          {place === 1 ? (
            <Trophy className={visual.medal} />
          ) : (
            <Medal className={visual.medal} />
          )}
          <span className={visual.labelClass}>{visual.label}</span>
        </div>
      </div>
    );
  },
  (prev, next) => prev.place === next.place && isSameParticipant(prev.participant, next.participant)
);

/* -------------------------------------------------------------------------- */
/*                               Podium Section                               */
/* -------------------------------------------------------------------------- */

interface PodiumSectionProps {
  first?: ParticipantScoreItem;
  second?: ParticipantScoreItem;
  third?: ParticipantScoreItem;
}

const PodiumSection = memo(
  function PodiumSection({ first, second, third }: PodiumSectionProps) {
    return (
      <div className="lg:col-span-7 flex flex-col items-center">
        <div className="w-full max-w-lg flex items-end justify-center gap-3 sm:gap-4 pt-10">
          {second && <PodiumSpot participant={second} place={2} />}
          {first && <PodiumSpot participant={first} place={1} />}
          {third && <PodiumSpot participant={third} place={3} />}
        </div>
      </div>
    );
  },
  (prev, next) =>
    isSameParticipant(prev.first, next.first) &&
    isSameParticipant(prev.second, next.second) &&
    isSameParticipant(prev.third, next.third)
);

/* -------------------------------------------------------------------------- */
/*                           Remaining ranks list                             */
/* -------------------------------------------------------------------------- */

interface LeaderboardRowProps {
  participant: ParticipantScoreItem;
}

const LeaderboardRow = memo(
  function LeaderboardRow({ participant }: LeaderboardRowProps) {
    const rankDelta =
      participant.previousRank !== undefined
        ? participant.previousRank - participant.rank
        : 0;

    return (
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
        <div className="flex items-center gap-3">
          <span className="w-6 text-center font-mono font-bold text-sm text-slate-400">
            #{participant.rank}
          </span>

          <div className="w-4 text-center">
            {rankDelta > 0 && <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />}
            {rankDelta < 0 && <ArrowDown className="w-3.5 h-3.5 text-rose-400" />}
            {rankDelta === 0 && <Minus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />}
          </div>

          <div>
            <div className="font-bold text-xs sm:text-sm text-slate-200 flex items-center gap-1.5">
              <span>{participant.displayName}</span>
              {participant.streak > 1 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-400 font-mono">
                  <Flame className="w-3 h-3 text-rose-500 fill-rose-500" />
                  <span>{participant.streak}</span>
                </span>
              )}
            </div>
            {participant.teamName && (
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {participant.teamName}
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono font-black text-sm sm:text-base text-cyan-400">
            {participant.score.toLocaleString()}
          </span>
        </div>
      </div>
    );
  },
  (prev, next) => isSameParticipant(prev.participant, next.participant)
);

interface LeaderboardRanksListProps {
  remaining: ParticipantScoreItem[];
}

const LeaderboardRanksList = memo(function LeaderboardRanksList({
  remaining,
}: LeaderboardRanksListProps) {
  return (
    <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-md rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-400" />
          <span>র‌্যাঙ্কিং তালিকা (৪র্থ - ১০ম)</span>
        </h3>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          লাইভ আপডেটিং
        </span>
      </div>

      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {remaining.map((participant) => (
          <LeaderboardRow key={participant.id} participant={participant} />
        ))}
      </div>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                                Team cards                                  */
/* -------------------------------------------------------------------------- */

interface TeamCardProps {
  team: TeamScoreItem;
  isLeader: boolean;
}

const TeamCard = memo(
  function TeamCard({ team, isLeader }: TeamCardProps) {
    return (
      <div
        className={`relative p-5 rounded-3xl bg-slate-900/90 border transition-all ${
          isLeader ? "border-amber-400 shadow-2xl shadow-amber-500/20" : "border-slate-800"
        }`}
      >
        {isLeader && (
          <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-md">
            <Crown className="w-3 h-3 fill-slate-950" />
            <span>১ম দল</span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-mono font-bold text-sm text-slate-300">
            #{team.rank}
          </span>
          <div>
            <h3 className="font-black text-base text-white">{team.displayName}</h3>
            <span className="text-[11px] text-slate-400">
              সদস্য সংখ্যা: {team.membersCount} জন
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="text-xs text-slate-400">মোট পয়েন্ট:</div>
          <div className="text-3xl font-black font-mono text-cyan-400 mt-0.5">
            {team.totalScore.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
            গড় পয়েন্ট: {team.averageScore.toLocaleString()}
          </div>
        </div>

        {team.topScorerName && (
          <div className="mt-3 p-2 rounded-xl bg-slate-950/70 text-[11px] flex items-center justify-between text-slate-300">
            <span className="text-slate-400">দলের সেরা:</span>
            <span className="font-bold text-amber-300 truncate max-w-[120px]">
              {team.topScorerName}
            </span>
          </div>
        )}
      </div>
    );
  },
  (prev, next) => prev.isLeader === next.isLeader && isSameTeam(prev.team, next.team)
);

interface TeamGridProps {
  teams: TeamScoreItem[];
}

const TeamGrid = memo(
  function TeamGrid({ teams }: TeamGridProps) {
    return (
      <div className="relative z-10 my-auto py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {teams.map((team, idx) => (
            <TeamCard key={team.teamId} team={team} isLeader={idx === 0} />
          ))}
        </div>
      </div>
    );
  },
  (prev, next) => isSameTeamList(prev.teams, next.teams)
);

/* -------------------------------------------------------------------------- */
/*                       Top Header & Projector Controls                      */
/* -------------------------------------------------------------------------- */

interface LeaderboardHeaderProps {
  quizTitle: string;
  sessionCode: string;
  currentQuestion: number;
  totalQuestions: number;
  viewMode: "individual" | "team";
  soundEnabled: boolean;
  onSetIndividualMode: () => void;
  onSetTeamMode: () => void;
  onToggleSound: () => void;
  onCelebration: () => void;
  onRefresh?: () => void;
}

const LeaderboardHeader = memo(function LeaderboardHeader({
  quizTitle,
  sessionCode,
  currentQuestion,
  totalQuestions,
  viewMode,
  soundEnabled,
  onSetIndividualMode,
  onSetTeamMode,
  onToggleSound,
  onCelebration,
  onRefresh,
}: LeaderboardHeaderProps) {
  return (
    <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>লাইভ লিডারবোর্ড প্রজেক্টর স্ক্রিন</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-xs font-mono font-bold text-slate-300">
            পিন: {sessionCode}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1 bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
          {quizTitle}
        </h1>

        <p className="text-xs text-slate-400 font-mono">
          প্রশ্ন: {currentQuestion} / {totalQuestions} • লাইভ স্কোরিং ও অ্যান্টি-চিট সক্রিয়
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
          <button
            type="button"
            onClick={onSetIndividualMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === "individual"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>ব্যক্তিগত</span>
          </button>
          <button
            type="button"
            onClick={onSetTeamMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === "team"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>দলগত (Team)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleSound}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title={soundEnabled ? "সাউন্ড বন্ধ করুন" : "সাউন্ড চালু করুন"}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          )}
        </button>

        <button
          type="button"
          onClick={onCelebration}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          title="কনফেটি বিস্ফোরণ ও সাউন্ড ইফেক্ট"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">উদ্‌যাপন</span>
        </button>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                                   Footer                                   */
/* -------------------------------------------------------------------------- */

const LeaderboardFooter = memo(function LeaderboardFooter() {
  return (
    <div className="relative z-10 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-indigo-400" />
        <span>পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ • রিয়েল-টাইম কুইজ ইঞ্জিন</span>
      </div>
      <div className="font-mono text-[11px] text-slate-400">
        র‌্যাঙ্কিং স্বয়ংক্রিয়ভাবে প্রতি প্রশ্নের পর হালনাগাদ হয়
      </div>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                              Confetti burst                                */
/* -------------------------------------------------------------------------- */

const ConfettiBurst = memo(function ConfettiBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full animate-bounce"
          style={{
            left: `${(i * 2.5) % 100}%`,
            top: `${(i * 3.7) % 80}%`,
            backgroundColor: CONFETTI_COLORS[i % 5],
            animationDuration: `${1.5 + (i % 3) * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                                  Main view                                 */
/* -------------------------------------------------------------------------- */

function LiveLeaderboardView({
  quizTitle = "কারিগরি বিজ্ঞান ও আইওটি কুইজ সেশন ২০২৬",
  sessionCode = "PTSC-8891",
  currentQuestion = 5,
  totalQuestions = 10,
  participants = SAMPLE_PARTICIPANTS,
  teams = SAMPLE_TEAMS,
  initialMode = "individual",
  onRefresh,
}: LiveLeaderboardViewProps) {
  const [viewMode, setViewMode] = useState<"individual" | "team">(initialMode);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [confettiActive, setConfettiActive] = useState<boolean>(false);

  const displayParticipants = useMemo(
    () => (participants && participants.length > 0 ? participants : SAMPLE_PARTICIPANTS),
    [participants]
  );

  const displayTeams = useMemo(
    () => (teams && teams.length > 0 ? teams : SAMPLE_TEAMS),
    [teams]
  );

  const { first, second, third, remaining } = useMemo(
    () => ({
      first: displayParticipants[0],
      second: displayParticipants[1],
      third: displayParticipants[2],
      remaining: displayParticipants.slice(3),
    }),
    [displayParticipants]
  );

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = null;
      }
    },
    []
  );

  const playVictoryChime = useCallback(() => {
    if (!soundEnabledRef.current || typeof window === "undefined") return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.45);
      });

      window.setTimeout(() => {
        void ctx.close().catch(() => undefined);
      }, 1200);
    } catch {
      // AudioCtx fallback
    }
  }, []);

  const triggerCelebration = useCallback(() => {
    setConfettiActive(true);
    playVictoryChime();

    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current);
    }
    celebrationTimerRef.current = setTimeout(() => {
      setConfettiActive(false);
      celebrationTimerRef.current = null;
    }, 4000);
  }, [playVictoryChime]);

  const handleIndividualMode = useCallback(() => setViewMode("individual"), []);
  const handleTeamMode = useCallback(() => setViewMode("team"), []);
  const handleToggleSound = useCallback(() => setSoundEnabled((prev) => !prev), []);

  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);
  const handleRefresh = useCallback(() => onRefreshRef.current?.(), []);

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 flex flex-col justify-between overflow-hidden select-none">
      {/* Background Animated Neon Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Confetti Elements */}
      {confettiActive && <ConfettiBurst />}

      {/* 1. TOP HEADER & PROJECTOR CONTROLS (Memoized: skips re-render on student updates) */}
      <LeaderboardHeader
        quizTitle={quizTitle}
        sessionCode={sessionCode}
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
        viewMode={viewMode}
        soundEnabled={soundEnabled}
        onSetIndividualMode={handleIndividualMode}
        onSetTeamMode={handleTeamMode}
        onToggleSound={handleToggleSound}
        onCelebration={triggerCelebration}
        onRefresh={onRefresh ? handleRefresh : undefined}
      />

      {/* 2. MAIN CONTENT: INDIVIDUAL MODE VS TEAM MODE */}
      {viewMode === "individual" ? (
        <div className="relative z-10 my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          {/* LEFT/CENTER: TOP 3 ANIMATED PODIUM (Memoized: skips re-render unless top 3 changes) */}
          <PodiumSection first={first} second={second} third={third} />

          {/* RIGHT: 4TH TO 10TH SCROLLING LEADERBOARD LIST (Memoized: only updated student row re-renders) */}
          <LeaderboardRanksList remaining={remaining} />
        </div>
      ) : (
        /* TEAM MODE LEADERBOARD VIEW (Memoized: skips re-render unless team scores change) */
        <TeamGrid teams={displayTeams} />
      )}

      {/* 3. FOOTER LIVE STREAM BAR (Memoized: static, never re-renders) */}
      <LeaderboardFooter />
    </div>
  );
}

/**
 * Root-level guard: a parent re-render with a freshly allocated (but identical)
 * participant/team array will not re-render the whole projector view.
 */
function areLeaderboardPropsEqual(
  prev: LiveLeaderboardViewProps,
  next: LiveLeaderboardViewProps
): boolean {
  return (
    prev.quizTitle === next.quizTitle &&
    prev.sessionCode === next.sessionCode &&
    prev.currentQuestion === next.currentQuestion &&
    prev.totalQuestions === next.totalQuestions &&
    prev.initialMode === next.initialMode &&
    Boolean(prev.onRefresh) === Boolean(next.onRefresh) &&
    isSameParticipantList(
      prev.participants ?? SAMPLE_PARTICIPANTS,
      next.participants ?? SAMPLE_PARTICIPANTS
    ) &&
    isSameTeamList(prev.teams ?? SAMPLE_TEAMS, next.teams ?? SAMPLE_TEAMS)
  );
}

export default memo(LiveLeaderboardView, areLeaderboardPropsEqual);
