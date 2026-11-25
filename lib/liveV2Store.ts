import fs from "fs";
import os from "os";
import path from "path";
import { isPrismaAvailable, safePrismaQuery } from "@/lib/prisma";
import {
  recordHybridMistake,
  syncMistakeBankWithMySQL,
} from "@/lib/hybridStorageEngine";

export type LiveV2SlideType =
  | "MCQ"
  | "TRUE_FALSE"
  | "POLL"
  | "WORD_CLOUD"
  | "OPEN_ENDED"
  | "INFO";

export type LiveV2Stage =
  | "LOBBY"
  | "COUNTDOWN"
  | "QUESTION"
  | "REVEAL"
  | "LEADERBOARD"
  | "PAUSED"
  | "ENDED";

export interface LiveV2Slide {
  id: string;
  type: LiveV2SlideType;
  question: string;
  title?: string;
  subtitle?: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  points: number;
  timeLimitSeconds: number;
  contentPoints?: string[];
  subjectName?: string;
  chapterName?: string;
}

export interface LiveV2PlayerAnswer {
  slideIndex: number;
  optionIndex: number | null;
  answerText?: string;
  isCorrect: boolean;
  pointsEarned: number;
  responseTimeMs: number;
  answeredAt: number;
}

export interface LiveV2Player {
  id: string;
  name: string;
  roll: string;
  avatar: string;
  className?: string;
  trade?: string;
  score: number;
  streak: number;
  correctCount: number;
  wrongCount: number;
  isReady: boolean;
  joinedAt: number;
  lastSeenAt: number;
  answers: Record<string, LiveV2PlayerAnswer>;
}

export interface LiveV2Session {
  id: string;
  code: string;
  quizId: string;
  numericQuizId?: number | null;
  quizTitle: string;
  className?: string;
  trade?: string;
  subject?: string;
  hostName: string;
  stage: LiveV2Stage;
  status: "LOBBY" | "ACTIVE" | "PAUSED" | "ENDED";
  pausedStageBefore?: LiveV2Stage;
  currentSlideIndex: number;
  totalQuestions: number;
  stageStartedAt: number;
  stageEndsAt: number;
  hostLastSeenAt: number;
  createdAt: number;
  updatedAt: number;
  pausedAt: number | null;
  endedAt: number | null;
  slides: LiveV2Slide[];
  players: Record<string, LiveV2Player>;
}

export interface LiveV2LeaderboardEntry {
  playerId: string;
  name: string;
  roll: string;
  avatar: string;
  score: number;
  streak: number;
  correctCount: number;
  wrongCount: number;
  isReady: boolean;
  rank: number;
  hasAnsweredCurrent: boolean;
}

const SNAPSHOT_FILE = path.join(os.tmpdir(), "pgtsc-live-v2.json");
const META_STORE_KEY = "pgtsc_live_v2_store";
const HOST_HEARTBEAT_TIMEOUT_MS = 25000;

const g = globalThis as unknown as {
  __liveV2Sessions?: Record<string, LiveV2Session>;
  __liveV2Hydrated?: boolean;
  __liveV2PersistTimer?: ReturnType<typeof setTimeout> | null;
  __liveV2DbHydrating?: Promise<void> | null;
};

function getSessionMap(): Record<string, LiveV2Session> {
  if (!g.__liveV2Sessions) {
    g.__liveV2Sessions = {};
  }
  if (!g.__liveV2Hydrated) {
    g.__liveV2Hydrated = true;
    try {
      if (fs.existsSync(SNAPSHOT_FILE)) {
        const raw = fs.readFileSync(SNAPSHOT_FILE, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const list: LiveV2Session[] = Array.isArray(parsed.sessions)
            ? parsed.sessions
            : Object.values(parsed);
          for (const item of list) {
            if (item && item.id && item.code) {
              g.__liveV2Sessions[item.id] = normalizeSessionShape(item);
            }
          }
        }
      }
    } catch (err) {
      console.warn("[liveV2Store] Temp snapshot hydration skipped:", err);
    }
  }
  return g.__liveV2Sessions;
}

function normalizeSlideType(rawType: unknown, optionsLen: number): LiveV2SlideType {
  const upper = String(rawType || "").toUpperCase().trim();
  if (upper === "TRUE_FALSE" || upper === "TF") return "TRUE_FALSE";
  if (upper === "POLL" || upper === "SURVEY") return "POLL";
  if (upper === "WORD_CLOUD" || upper === "WORDCLOUD") return "WORD_CLOUD";
  if (upper === "OPEN_ENDED" || upper === "TEXT" || upper === "SHORT_ANSWER") {
    return "OPEN_ENDED";
  }
  if (upper === "INFO" || upper === "SLIDE" || upper === "CONTENT") {
    return optionsLen >= 2 ? "MCQ" : "INFO";
  }
  return "MCQ";
}

export function normalizeSlides(rawSlides: any[]): LiveV2Slide[] {
  if (!Array.isArray(rawSlides)) return [];
  return rawSlides
    .map((s, idx): LiveV2Slide => {
      const rawOptions = Array.isArray(s?.options)
        ? s.options.map((o: any) =>
            typeof o === "string" ? o : String(o?.text || o?.label || "")
          )
        : [];
      const cleanedOptions = rawOptions.filter((o: string) => o.trim().length > 0);
      const slideType = normalizeSlideType(s?.type, cleanedOptions.length);

      const finalOptions =
        slideType === "INFO" || slideType === "WORD_CLOUD" || slideType === "OPEN_ENDED"
          ? cleanedOptions
          : cleanedOptions.length >= 2
          ? cleanedOptions.slice(0, 4)
          : slideType === "TRUE_FALSE"
          ? ["সত্য (True)", "মিথ্যা (False)"]
          : ["সঠিক বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"];

      const rawCorrect =
        typeof s?.correctIndex === "number"
          ? s.correctIndex
          : typeof s?.correctAnswer === "number"
          ? s.correctAnswer
          : Number(s?.correctIndex ?? s?.correctAnswer ?? 0);

      const correctIndex =
        Number.isFinite(rawCorrect) && rawCorrect >= 0 && rawCorrect < Math.max(1, finalOptions.length)
          ? Math.floor(rawCorrect)
          : 0;

      const parsedTime = Number(s?.timeLimitSeconds ?? s?.timeLimit ?? s?.durationSeconds ?? 25);
      const timeLimitSeconds = Number.isFinite(parsedTime)
        ? Math.min(300, Math.max(5, Math.round(parsedTime)))
        : 25;

      const parsedPoints = Number(s?.points ?? 1000);
      const points = Number.isFinite(parsedPoints)
        ? Math.min(5000, Math.max(100, Math.round(parsedPoints)))
        : 1000;

      return {
        id: String(s?.id || `slide_v2_${idx + 1}`),
        type: slideType,
        question: String(
          s?.question || s?.title || s?.prompt || `প্রশ্ন ${idx + 1}`
        ).trim(),
        title: s?.title ? String(s.title) : undefined,
        subtitle: s?.subtitle ? String(s.subtitle) : undefined,
        options: finalOptions,
        correctIndex,
        explanation: s?.explanation ? String(s.explanation) : undefined,
        points,
        timeLimitSeconds,
        contentPoints: Array.isArray(s?.contentPoints) ? s.contentPoints : undefined,
        subjectName: s?.subjectName ? String(s.subjectName) : undefined,
        chapterName: s?.chapterName ? String(s.chapterName) : undefined,
      };
    })
    .filter((s) => s.question.length > 0);
}

function normalizeSessionShape(s: any): LiveV2Session {
  const slides = normalizeSlides(s?.slides || []);
  const now = Date.now();
  const stage: LiveV2Stage = (
    ["LOBBY", "COUNTDOWN", "QUESTION", "REVEAL", "LEADERBOARD", "PAUSED", "ENDED"].includes(
      String(s?.stage || "").toUpperCase()
    )
      ? String(s.stage).toUpperCase()
      : s?.status === "ENDED"
      ? "ENDED"
      : s?.status === "PAUSED"
      ? "PAUSED"
      : "LOBBY"
  ) as LiveV2Stage;

  const status: LiveV2Session["status"] =
    stage === "ENDED"
      ? "ENDED"
      : stage === "PAUSED"
      ? "PAUSED"
      : stage === "LOBBY"
      ? "LOBBY"
      : "ACTIVE";

  const idx = Number.isFinite(Number(s?.currentSlideIndex))
    ? Math.max(0, Math.min(Math.max(0, slides.length - 1), Number(s.currentSlideIndex)))
    : 0;

  return {
    id: String(s.id),
    code: String(s.code),
    quizId: String(s.quizId || s.id),
    numericQuizId: Number.isFinite(Number(s?.numericQuizId))
      ? Number(s.numericQuizId)
      : /^\d+$/.test(String(s?.quizId || ""))
      ? Number(s.quizId)
      : null,
    quizTitle: String(s.quizTitle || "লাইভ কুইজ সেশন"),
    className: s.className ? String(s.className) : undefined,
    trade: s.trade ? String(s.trade) : undefined,
    subject: s.subject ? String(s.subject) : undefined,
    hostName: String(s.hostName || "শ্রেণি শিক্ষক"),
    stage,
    status,
    pausedStageBefore: s.pausedStageBefore,
    currentSlideIndex: idx,
    totalQuestions: slides.length || Number(s.totalQuestions) || 1,
    stageStartedAt: Number(s.stageStartedAt) || now,
    stageEndsAt: Number.isFinite(Number(s.stageEndsAt)) ? Number(s.stageEndsAt) : 0,
    hostLastSeenAt: Number(s.hostLastSeenAt) || now,
    createdAt: Number(s.createdAt) || now,
    updatedAt: Number(s.updatedAt) || now,
    pausedAt: s.pausedAt ? Number(s.pausedAt) : null,
    endedAt: s.endedAt ? Number(s.endedAt) : null,
    slides,
    players: s.players && typeof s.players === "object" ? s.players : {},
  };
}

export async function hydrateLiveV2FromMySQL(): Promise<void> {
  const map = getSessionMap();
  if (g.__liveV2DbHydrating) return g.__liveV2DbHydrating;
  if (!isPrismaAvailable()) return;

  g.__liveV2DbHydrating = (async () => {
    try {
      const record = await safePrismaQuery(async (p) => {
        return await p.dynamicMetadataStore.findUnique({
          where: { key: META_STORE_KEY },
        });
      }, null);

      if (record?.valueJson) {
        const parsed = JSON.parse(record.valueJson);
        const list: LiveV2Session[] = Array.isArray(parsed?.sessions) ? parsed.sessions : [];
        for (const item of list) {
          if (item?.id && !map[item.id]) {
            map[item.id] = normalizeSessionShape(item);
          }
        }
      }
    } catch (err) {
      console.warn("[liveV2Store] MySQL metadata hydration skipped:", err);
    } finally {
      g.__liveV2DbHydrating = null;
    }
  })();

  return g.__liveV2DbHydrating;
}

function schedulePersistV2(): void {
  if (g.__liveV2PersistTimer) {
    clearTimeout(g.__liveV2PersistTimer);
  }
  g.__liveV2PersistTimer = setTimeout(async () => {
    g.__liveV2PersistTimer = null;
    const map = getSessionMap();
    const sessions = Object.values(map)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 120);
    const payload = JSON.stringify({ updatedAt: Date.now(), sessions });

    try {
      await fs.promises.writeFile(SNAPSHOT_FILE, payload, "utf8");
    } catch (err) {
      console.warn("[liveV2Store] Temp snapshot write failed:", err);
    }

    if (isPrismaAvailable()) {
      await safePrismaQuery(async (p) => {
        await p.dynamicMetadataStore.upsert({
          where: { key: META_STORE_KEY },
          create: {
            key: META_STORE_KEY,
            valueJson: payload,
            category: "live_quiz_v2",
            updatedBy: "liveV2Store",
          },
          update: {
            valueJson: payload,
            updatedBy: "liveV2Store",
          },
        });
        return true;
      }, false);
    }
  }, 300);
}

export async function archiveEndedSessionToMySQL(session: LiveV2Session): Promise<void> {
  if (!isPrismaAvailable()) return;
  const leaderboard = computeLeaderboard(session);
  const totalPlayers = leaderboard.length;
  const winner = leaderboard[0];
  const avgScore =
    totalPlayers > 0
      ? Math.round(
          (leaderboard.reduce((sum, p) => sum + p.score, 0) / totalPlayers) * 10
        ) / 10
      : 0;

  await safePrismaQuery(async (p) => {
    const existing = await p.quizResult.findFirst({
      where: { sessionPin: session.code },
    });
    if (existing) {
      await p.quizResult.update({
        where: { id: existing.id },
        data: {
          totalPlayers,
          winnerName: winner?.name || null,
          winnerScore: winner?.score || 0,
          averageScore: avgScore,
          leaderboardJson: JSON.stringify(leaderboard),
          completedAt: new Date(session.endedAt || Date.now()),
        },
      });
    } else {
      await p.quizResult.create({
        data: {
          quizId: session.numericQuizId || 0,
          quizTitle: session.quizTitle,
          sessionPin: session.code,
          totalPlayers,
          winnerName: winner?.name || null,
          winnerScore: winner?.score || 0,
          averageScore: avgScore,
          leaderboardJson: JSON.stringify(leaderboard),
          completedAt: new Date(session.endedAt || Date.now()),
        },
      });
    }

    if (session.numericQuizId) {
      const quizExists = await p.quiz.findUnique({
        where: { id: session.numericQuizId },
        select: { id: true },
      });
      if (quizExists) {
        await p.liveSession.upsert({
          where: { pin: session.code },
          create: {
            pin: session.code,
            quizId: session.numericQuizId,
            hostName: session.hostName,
            status: "COMPLETED",
            currentQuestion: session.currentSlideIndex,
            totalQuestions: session.slides.length,
            participantsJson: JSON.stringify(Object.values(session.players)),
            startedAt: new Date(session.createdAt),
            endedAt: new Date(session.endedAt || Date.now()),
          },
          update: {
            status: "COMPLETED",
            currentQuestion: session.currentSlideIndex,
            participantsJson: JSON.stringify(Object.values(session.players)),
            endedAt: new Date(session.endedAt || Date.now()),
          },
        });
      }
    }
    return true;
  }, false);
}

export async function syncSessionStateToMySQL(session: LiveV2Session): Promise<void> {
  schedulePersistV2();
  if (!isPrismaAvailable() || !session.numericQuizId) return;

  await safePrismaQuery(async (p) => {
    const quizExists = await p.quiz.findUnique({
      where: { id: session.numericQuizId! },
      select: { id: true },
    });
    if (!quizExists) return false;

    const prismaStatus =
      session.stage === "ENDED"
        ? "COMPLETED"
        : session.stage === "PAUSED"
        ? "CLOSED"
        : session.stage === "LOBBY"
        ? "WAITING"
        : "ACTIVE";

    await p.liveSession.upsert({
      where: { pin: session.code },
      create: {
        pin: session.code,
        quizId: session.numericQuizId!,
        hostName: session.hostName,
        status: prismaStatus,
        currentQuestion: session.currentSlideIndex,
        totalQuestions: session.slides.length,
        participantsJson: JSON.stringify(Object.values(session.players)),
        startedAt: new Date(session.createdAt),
        endedAt: session.endedAt ? new Date(session.endedAt) : null,
      },
      update: {
        status: prismaStatus,
        currentQuestion: session.currentSlideIndex,
        totalQuestions: session.slides.length,
        participantsJson: JSON.stringify(Object.values(session.players)),
        endedAt: session.endedAt ? new Date(session.endedAt) : null,
      },
    });
    return true;
  }, false);
}

function generateUniquePin(): string {
  const map = getSessionMap();
  const activePins = new Set(Object.values(map).map((s) => s.code));
  for (let i = 0; i < 40; i++) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    if (!activePins.has(pin)) return pin;
  }
  return String(Math.floor(100000 + (Date.now() % 900000)));
}

export function createLiveV2Session(params: {
  quizId: string;
  quizTitle: string;
  slides: any[];
  className?: string;
  trade?: string;
  subject?: string;
  hostName?: string;
  resumeSessionId?: string;
}): LiveV2Session {
  const map = getSessionMap();
  const now = Date.now();

  if (params.resumeSessionId && map[params.resumeSessionId]) {
    const existing = map[params.resumeSessionId];
    const nextIdx =
      existing.pausedStageBefore === "REVEAL" &&
      existing.currentSlideIndex + 1 < existing.slides.length
        ? existing.currentSlideIndex + 1
        : existing.currentSlideIndex;

    const currentSlide = existing.slides[nextIdx] || existing.slides[0];
    existing.currentSlideIndex = nextIdx;
    existing.hostLastSeenAt = now;
    existing.updatedAt = now;
    existing.pausedAt = null;

    if (
      existing.pausedStageBefore &&
      existing.pausedStageBefore !== "PAUSED" &&
      existing.pausedStageBefore !== "ENDED"
    ) {
      existing.stage =
        existing.pausedStageBefore === "LOBBY" ? "LOBBY" : "COUNTDOWN";
      existing.status = existing.stage === "LOBBY" ? "LOBBY" : "ACTIVE";
      if (existing.stage === "COUNTDOWN") {
        existing.stageStartedAt = now;
        existing.stageEndsAt = now + 3000;
      } else {
        existing.stageStartedAt = now;
        existing.stageEndsAt = 0;
      }
    } else if (currentSlide) {
      existing.stage = "LOBBY";
      existing.status = "LOBBY";
      existing.stageStartedAt = now;
      existing.stageEndsAt = 0;
    }

    schedulePersistV2();
    void syncSessionStateToMySQL(existing);
    return existing;
  }

  const normalizedSlides = normalizeSlides(params.slides);
  const id = `live_v2_${now}_${Math.random().toString(36).slice(2, 7)}`;
  const code = generateUniquePin();

  const session: LiveV2Session = {
    id,
    code,
    quizId: String(params.quizId || id),
    numericQuizId: /^\d+$/.test(String(params.quizId || ""))
      ? Number(params.quizId)
      : null,
    quizTitle: String(params.quizTitle || "লাইভ কুইজ সেশন").trim(),
    className: params.className,
    trade: params.trade,
    subject: params.subject,
    hostName: String(params.hostName || "শ্রেণি শিক্ষক"),
    stage: "LOBBY",
    status: "LOBBY",
    currentSlideIndex: 0,
    totalQuestions: normalizedSlides.length,
    stageStartedAt: now,
    stageEndsAt: 0,
    hostLastSeenAt: now,
    createdAt: now,
    updatedAt: now,
    pausedAt: null,
    endedAt: null,
    slides: normalizedSlides,
    players: {},
  };

  map[id] = session;
  schedulePersistV2();
  void syncSessionStateToMySQL(session);
  return session;
}

export function findLiveV2Session(params: {
  sessionId?: string | null;
  code?: string | null;
}): LiveV2Session | null {
  const map = getSessionMap();
  if (params.sessionId && map[params.sessionId]) {
    return map[params.sessionId];
  }
  const cleanCode = String(params.code || "").replace(/\D/g, "").trim();
  if (!cleanCode) return null;
  const all = Object.values(map).filter((s) => s.code === cleanCode);
  if (all.length === 0) return null;
  all.sort((a, b) => b.updatedAt - a.updatedAt);
  return all[0];
}

export function listLiveV2Sessions(quizId?: string | null): LiveV2Session[] {
  const map = getSessionMap();
  const list = Object.values(map);
  const filtered = quizId
    ? list.filter((s) => String(s.quizId) === String(quizId))
    : list;
  return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function isSessionJoinable(session: LiveV2Session): {
  joinable: boolean;
  reason?: string;
} {
  if (session.stage === "PAUSED" || session.stage === "ENDED") {
    return {
      joinable: false,
      reason: "⏸️ কুইজটি এখন লাইভ হচ্ছে না। শিক্ষক পুনরায় শুরু করলে পরে যুক্ত হও।",
    };
  }
  if (Date.now() - session.hostLastSeenAt > HOST_HEARTBEAT_TIMEOUT_MS) {
    return {
      joinable: false,
      reason: "⏸️ কুইজটি এখন লাইভ হচ্ছে না। শিক্ষক পুনরায় শুরু করলে পরে যুক্ত হও।",
    };
  }
  return { joinable: true };
}

export function computeSafeRemainingSeconds(session: LiveV2Session, now = Date.now()): number {
  if (session.stage !== "COUNTDOWN" && session.stage !== "QUESTION") {
    return 0;
  }
  if (!Number.isFinite(session.stageEndsAt) || session.stageEndsAt <= 0) {
    return 0;
  }
  return Math.max(0, Math.ceil((session.stageEndsAt - now) / 1000));
}

export function tickSession(session: LiveV2Session): boolean {
  const now = Date.now();
  let changed = false;

  if (session.slides.length > 0) {
    const clampedIdx = Math.max(
      0,
      Math.min(session.slides.length - 1, Number(session.currentSlideIndex) || 0)
    );
    if (clampedIdx !== session.currentSlideIndex) {
      session.currentSlideIndex = clampedIdx;
      changed = true;
    }
  }

  const currentSlide = session.slides[session.currentSlideIndex];

  if (session.stage === "COUNTDOWN") {
    if (!Number.isFinite(session.stageEndsAt) || session.stageEndsAt <= 0) {
      session.stageEndsAt = now + 3000;
      changed = true;
    }
    if (now >= session.stageEndsAt) {
      session.stage = "QUESTION";
      session.status = "ACTIVE";
      const qSec = Math.max(5, Number(currentSlide?.timeLimitSeconds) || 25);
      session.stageStartedAt = now;
      session.stageEndsAt =
        currentSlide?.type === "INFO" ? now + 300000 : now + qSec * 1000;
      session.updatedAt = now;
      changed = true;
    }
  } else if (session.stage === "QUESTION") {
    const timedOut =
      Number.isFinite(session.stageEndsAt) &&
      session.stageEndsAt > 0 &&
      now >= session.stageEndsAt;

    const playerList = Object.values(session.players);
    const slideKey = String(session.currentSlideIndex);
    const answeredCount = playerList.filter(
      (p) => p.answers && p.answers[slideKey] !== undefined
    ).length;

    const allAnswered =
      currentSlide?.type !== "INFO" &&
      playerList.length > 0 &&
      answeredCount >= playerList.length &&
      now - session.stageStartedAt >= 750;

    if (timedOut || allAnswered) {
      session.stage = "REVEAL";
      session.status = "ACTIVE";
      session.stageStartedAt = now;
      session.stageEndsAt = 0;
      session.updatedAt = now;
      changed = true;
    }
  }

  if (changed) {
    schedulePersistV2();
  }
  return changed;
}

export function computeLeaderboard(session: LiveV2Session): LiveV2LeaderboardEntry[] {
  const slideKey = String(session.currentSlideIndex);
  const sorted = Object.values(session.players).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    return a.joinedAt - b.joinedAt;
  });

  return sorted.map((p, idx) => ({
    playerId: p.id,
    name: p.name,
    roll: p.roll,
    avatar: p.avatar,
    score: p.score,
    streak: p.streak,
    correctCount: p.correctCount,
    wrongCount: p.wrongCount,
    isReady: p.isReady,
    rank: idx + 1,
    hasAnsweredCurrent: Boolean(p.answers && p.answers[slideKey]),
  }));
}

export function computeOptionStats(session: LiveV2Session): {
  answeredCount: number;
  optionCounts: number[];
} {
  const currentSlide = session.slides[session.currentSlideIndex];
  const optLen = Math.max(4, currentSlide?.options?.length || 4);
  const optionCounts = Array(optLen).fill(0);
  const slideKey = String(session.currentSlideIndex);
  let answeredCount = 0;

  for (const player of Object.values(session.players)) {
    const ans = player.answers?.[slideKey];
    if (ans) {
      answeredCount += 1;
      if (
        typeof ans.optionIndex === "number" &&
        ans.optionIndex >= 0 &&
        ans.optionIndex < optionCounts.length
      ) {
        optionCounts[ans.optionIndex] += 1;
      }
    }
  }

  return { answeredCount, optionCounts };
}

export function joinOrReconnectPlayer(
  session: LiveV2Session,
  input: {
    name: string;
    roll?: string;
    avatar?: string;
    className?: string;
    trade?: string;
    playerId?: string;
  }
): LiveV2Player {
  const now = Date.now();
  const cleanName = String(input.name || "").trim();
  const cleanRoll = String(input.roll || "").trim();
  const cleanAvatar = String(input.avatar || "🎓").trim() || "🎓";

  let existing: LiveV2Player | undefined =
    input.playerId && session.players[input.playerId]
      ? session.players[input.playerId]
      : undefined;

  if (!existing) {
    existing = Object.values(session.players).find((p) => {
      if (cleanRoll && p.roll && p.roll === cleanRoll) return true;
      return p.name.toLowerCase() === cleanName.toLowerCase();
    });
  }

  if (existing) {
    existing.name = cleanName || existing.name;
    if (cleanRoll) existing.roll = cleanRoll;
    if (cleanAvatar) existing.avatar = cleanAvatar;
    if (input.className) existing.className = input.className;
    if (input.trade) existing.trade = input.trade;
    existing.lastSeenAt = now;
    session.updatedAt = now;
    schedulePersistV2();
    return existing;
  }

  const id = `pl_v2_${now}_${Math.random().toString(36).slice(2, 6)}`;
  const player: LiveV2Player = {
    id,
    name: cleanName || "শিক্ষার্থী",
    roll: cleanRoll || String(Math.floor(1000 + Math.random() * 9000)),
    avatar: cleanAvatar,
    className: input.className,
    trade: input.trade,
    score: 0,
    streak: 0,
    correctCount: 0,
    wrongCount: 0,
    isReady: true,
    joinedAt: now,
    lastSeenAt: now,
    answers: {},
  };

  session.players[id] = player;
  session.updatedAt = now;
  schedulePersistV2();
  return player;
}

export function performHostAction(
  session: LiveV2Session,
  action: string,
  payload?: { slideIndex?: number }
): LiveV2Session {
  const now = Date.now();
  session.hostLastSeenAt = now;

  switch (action) {
    case "START_QUESTION":
    case "SKIP_TO_QUESTION": {
      const targetIdx = Number.isFinite(Number(payload?.slideIndex))
        ? Math.max(0, Math.min(Math.max(0, session.slides.length - 1), Number(payload?.slideIndex)))
        : session.currentSlideIndex;
      session.currentSlideIndex = targetIdx;
      session.stage = "COUNTDOWN";
      session.status = "ACTIVE";
      session.pausedAt = null;
      session.stageStartedAt = now;
      session.stageEndsAt = now + 3000;
      break;
    }
    case "SKIP_COUNTDOWN": {
      const slide = session.slides[session.currentSlideIndex];
      const qSec = Math.max(5, Number(slide?.timeLimitSeconds) || 25);
      session.stage = "QUESTION";
      session.status = "ACTIVE";
      session.pausedAt = null;
      session.stageStartedAt = now;
      session.stageEndsAt = slide?.type === "INFO" ? now + 300000 : now + qSec * 1000;
      break;
    }
    case "REVEAL": {
      session.stage = "REVEAL";
      session.status = "ACTIVE";
      session.stageStartedAt = now;
      session.stageEndsAt = 0;
      break;
    }
    case "LEADERBOARD": {
      session.stage = "LEADERBOARD";
      session.status = "ACTIVE";
      session.stageStartedAt = now;
      session.stageEndsAt = 0;
      break;
    }
    case "NEXT_QUESTION": {
      if (session.currentSlideIndex + 1 < session.slides.length) {
        session.currentSlideIndex += 1;
        session.stage = "COUNTDOWN";
        session.status = "ACTIVE";
        session.stageStartedAt = now;
        session.stageEndsAt = now + 3000;
      } else {
        session.stage = "ENDED";
        session.status = "ENDED";
        session.endedAt = now;
        session.stageEndsAt = 0;
        void archiveEndedSessionToMySQL(session);
      }
      break;
    }
    case "PAUSE": {
      if (session.stage !== "PAUSED" && session.stage !== "ENDED") {
        session.pausedStageBefore = session.stage;
      }
      session.stage = "PAUSED";
      session.status = "PAUSED";
      session.pausedAt = now;
      session.stageEndsAt = 0;
      break;
    }
    case "END": {
      session.stage = "ENDED";
      session.status = "ENDED";
      session.endedAt = now;
      session.stageEndsAt = 0;
      void archiveEndedSessionToMySQL(session);
      break;
    }
  }

  session.updatedAt = now;
  schedulePersistV2();
  void syncSessionStateToMySQL(session);
  return session;
}

export function submitStudentAnswer(
  session: LiveV2Session,
  input: {
    playerId: string;
    slideIndex?: number;
    optionIndex?: number | null;
    answerText?: string;
  }
): {
  ok: boolean;
  error?: string;
  isCorrect?: boolean;
  pointsEarned?: number;
  totalScore?: number;
  streak?: number;
  rank?: number;
} {
  tickSession(session);
  const player = session.players[input.playerId];
  if (!player) {
    return { ok: false, error: "শিক্ষার্থী এই সেশনে খুঁজে পাওয়া যায়নি।" };
  }

  const now = Date.now();
  player.lastSeenAt = now;

  if (session.stage !== "QUESTION") {
    return {
      ok: false,
      error: "সময় শেষ হয়ে গেছে অথবা প্রশ্ন এখনো শুরু হয়নি।",
    };
  }

  const slideIndex = Number.isFinite(Number(input.slideIndex))
    ? Number(input.slideIndex)
    : session.currentSlideIndex;
  const slideKey = String(slideIndex);

  if (slideIndex !== session.currentSlideIndex) {
    return { ok: false, error: "সক্রিয় প্রশ্নের সাথে মিল পাওয়া যায়নি।" };
  }

  if (player.answers[slideKey]) {
    const prev = player.answers[slideKey];
    const lb = computeLeaderboard(session);
    const rank = lb.find((r) => r.playerId === player.id)?.rank || 1;
    return {
      ok: true,
      isCorrect: prev.isCorrect,
      pointsEarned: prev.pointsEarned,
      totalScore: player.score,
      streak: player.streak,
      rank,
    };
  }

  const slide = session.slides[slideIndex];
  if (!slide) {
    return { ok: false, error: "প্রশ্নটি পাওয়া যায়নি।" };
  }

  const optIdx =
    typeof input.optionIndex === "number" && Number.isFinite(input.optionIndex)
      ? input.optionIndex
      : null;

  let isCorrect = false;
  if (slide.type === "POLL" || slide.type === "WORD_CLOUD" || slide.type === "INFO") {
    isCorrect = true;
  } else if (slide.type === "OPEN_ENDED") {
    isCorrect = Boolean(input.answerText && input.answerText.trim().length > 0);
  } else {
    isCorrect = optIdx !== null && optIdx === slide.correctIndex;
  }

  const durationMs = Math.max(5000, (slide.timeLimitSeconds || 25) * 1000);
  const elapsedMs = Math.max(0, now - session.stageStartedAt);
  const speedFactor = Math.max(0.25, 1 - (elapsedMs / durationMs) * 0.5);
  const streakBonus = isCorrect ? Math.min(500, player.streak * 100) : 0;
  const basePoints = slide.points || 1000;
  const pointsEarned =
    slide.type === "POLL" || slide.type === "WORD_CLOUD" || slide.type === "OPEN_ENDED"
      ? 500
      : isCorrect
      ? Math.round(basePoints * speedFactor) + streakBonus
      : 0;

  player.answers[slideKey] = {
    slideIndex,
    optionIndex: optIdx,
    answerText: input.answerText ? String(input.answerText).trim() : undefined,
    isCorrect,
    pointsEarned,
    responseTimeMs: elapsedMs,
    answeredAt: now,
  };

  if (isCorrect) {
    player.score += pointsEarned;
    player.streak += 1;
    player.correctCount += 1;
  } else {
    player.streak = 0;
    player.wrongCount += 1;

    if (
      (slide.type === "MCQ" || slide.type === "TRUE_FALSE") &&
      slide.options.length >= 2
    ) {
      const resolvedRoll = player.roll || player.id;
      const studentClass = player.className || session.className || "All";
      recordHybridMistake({
        studentKey: `${resolvedRoll}::${studentClass}`,
        studentId: player.id,
        studentRoll: resolvedRoll,
        studentName: player.name,
        className: studentClass,
        trade: player.trade || session.trade || "General",
        sourceType: "LIVE_QUIZ",
        sourceId: session.quizId,
        sourceTitle: session.quizTitle,
        topic: slide.chapterName || session.quizTitle,
        subject: slide.subjectName || session.subject || session.quizTitle,
        questionId: slide.id,
        questionText: slide.question,
        options: slide.options,
        studentAnswer:
          optIdx !== null && slide.options[optIdx]
            ? slide.options[optIdx]
            : input.answerText || "উত্তর দেওয়া হয়নি",
        correctAnswer: slide.options[slide.correctIndex] || "",
        explanation:
          slide.explanation ||
          `সঠিক উত্তর হলো "${slide.options[slide.correctIndex] || ""}"।`,
      });
      void syncMistakeBankWithMySQL().catch(() => {});
    }
  }

  session.updatedAt = now;
  tickSession(session);
  schedulePersistV2();

  const lb = computeLeaderboard(session);
  const rank = lb.find((r) => r.playerId === player.id)?.rank || 1;

  return {
    ok: true,
    isCorrect,
    pointsEarned,
    totalScore: player.score,
    streak: player.streak,
    rank,
  };
}

export function serializeSessionForClient(
  session: LiveV2Session,
  options?: { role?: "host" | "student"; playerId?: string | null }
) {
  const isHost = options?.role === "host";
  const now = Date.now();
  const remainingSeconds = computeSafeRemainingSeconds(session, now);
  const leaderboard = computeLeaderboard(session);
  const { answeredCount, optionCounts } = computeOptionStats(session);
  const canExposeAnswer =
    isHost ||
    session.stage === "REVEAL" ||
    session.stage === "LEADERBOARD" ||
    session.stage === "ENDED";

  const sanitizedSlides = session.slides.map((slide, idx) => {
    const isCurrentOrPast = idx < session.currentSlideIndex || canExposeAnswer;
    return {
      ...slide,
      correctIndex: isCurrentOrPast ? slide.correctIndex : -1,
      explanation: isCurrentOrPast ? slide.explanation : undefined,
    };
  });

  const me =
    options?.playerId && session.players[options.playerId]
      ? session.players[options.playerId]
      : null;

  return {
    id: session.id,
    code: session.code,
    quizId: session.quizId,
    quizTitle: session.quizTitle,
    className: session.className,
    trade: session.trade,
    subject: session.subject,
    hostName: session.hostName,
    stage: session.stage,
    status: session.status,
    currentSlideIndex: session.currentSlideIndex,
    totalQuestions: session.slides.length,
    stageStartedAt: session.stageStartedAt,
    stageEndsAt: session.stageEndsAt,
    remainingSeconds,
    hostLastSeenAt: session.hostLastSeenAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    pausedAt: session.pausedAt,
    endedAt: session.endedAt,
    playerCount: Object.keys(session.players).length,
    answeredCount,
    optionCounts: canExposeAnswer || isHost ? optionCounts : [],
    leaderboard,
    players: session.players,
    slides: sanitizedSlides,
    me,
  };
}
