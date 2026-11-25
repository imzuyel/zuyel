import fs from "fs";
import os from "os";
import path from "path";
import { institutionalDb } from "./database";

// ============================================================================
// DATA MODELS & INTERFACES (Strict Numeric Timestamps & Zero NaN Guarantee)
// ============================================================================

export interface LivePlayerRecord {
  id: string;
  name: string;
  roll?: string | number;
  avatar: string;
  isReady: boolean;
  score: number;
  streak: number;
  rank?: number;
  lastSeenAt: number;
  joinedAt: number;
  tabSwitchCount?: number;
}

export interface LiveAnswerRecord {
  playerId: string;
  slideIndex: number;
  questionId: string;
  answerPayload: any;
  isCorrect: boolean;
  points: number;
  basePoints?: number;
  speedBonus?: number;
  streakBonus?: number;
  penalty?: number;
  responseTimeMs: number;
  submittedAt: number;
}

export type LiveSessionStage =
  | "WELCOME_WAITING"
  | "WARMUP_ACTIVE"
  | "READY_CHECK"
  | "COUNTDOWN_321"
  | "QUESTION_ONLY"
  | "ANSWERING_ACTIVE"
  | "RESULT_REVEAL"
  | "LEADERBOARD_VIEW"
  | "ENDED";

export type LiveSessionStatus = "WAITING" | "ACTIVE" | "PAUSED" | "ENDED";

export const HOST_HEARTBEAT_TIMEOUT_MS = 25_000;

export interface LiveSessionRecord {
  id: string;
  code: string; // 6-digit string
  title: string;
  className: string;
  trade: string;
  subject: string;
  hostName: string;
  status: LiveSessionStatus;
  stage: LiveSessionStage;
  currentSlideIndex: number;
  stageStartedAt: number; // ALWAYS a valid Unix ms number (Date.now())
  stageEndsAt: number;    // ALWAYS a valid Unix ms number (Date.now() + durationMs)
  hostLastSeenAt: number; // Numeric Unix ms timestamp for 25s host exit guard
  pausedAt?: number;
  endedAt?: number;
  slides: any[];          // Full normalized array of slides/questions
  players: Record<string, LivePlayerRecord>; // Keyed by playerId for O(1) concurrent writes
  answers: Record<string, Record<string, LiveAnswerRecord>>; // Keyed by `${slideIndex}` -> `${playerId}`
  smsInterval: "OFF" | "EVERY_1" | "EVERY_3" | "EVERY_5" | "END_OF_QUIZ";
  updatedAt: number;
  createdAt: number;
  quizId?: string;
  scheduledStartTime?: string;
  isLocked?: boolean;
  hostUserId?: number;
  joinToken?: string;
  sentMilestones?: string[];
  lastSmsDispatched?: any;
}

// ============================================================================
// ATOMIC FILE-BACKED SINGLETON (Stored in os.tmpdir() outside Next.js workspace
// so writes NEVER trigger Fast Refresh / dev page reloads)
// ============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __pgtscLiveSessionMap: Map<string, LiveSessionRecord> | undefined;
  // eslint-disable-next-line no-var
  var __pgtscLiveSessionsLastMtime: number | undefined;
  // eslint-disable-next-line no-var
  var __pgtscLiveDiskWriteTimer: ReturnType<typeof setTimeout> | undefined;
  // eslint-disable-next-line no-var
  var __pgtscLiveMysqlSyncTimer: ReturnType<typeof setTimeout> | undefined;
  // eslint-disable-next-line no-var
  var __pgtscLiveHybridHydrated: boolean | undefined;
}

const CACHE_DIR = os.tmpdir();
const CACHE_FILE = path.join(CACHE_DIR, "pgtsc-live-sessions.json");
const LEGACY_READ_FILES = [
  path.join(process.cwd(), ".next", "cache", "pgtsc-live-sessions.json"),
  path.join(process.cwd(), ".next", "cache", "live-sessions-v3.json"),
];

function hydrateSessionRecord(item: any): LiveSessionRecord | null {
  if (!item || !item.id) return null;
  const now = Date.now();
  const validStatuses: LiveSessionStatus[] = ["WAITING", "ACTIVE", "PAUSED", "ENDED"];
  const rawStatus = String(item.status || "WAITING").toUpperCase() as LiveSessionStatus;
  const status: LiveSessionStatus = validStatuses.includes(rawStatus) ? rawStatus : "WAITING";
  const createdAt = Number(item.createdAt) || now;
  const updatedAt = Number(item.updatedAt) || createdAt;
  const hostLastSeenAt = Number.isFinite(Number(item.hostLastSeenAt)) && Number(item.hostLastSeenAt) > 0
    ? Number(item.hostLastSeenAt)
    : updatedAt;

  return {
    ...item,
    id: String(item.id),
    code: String(item.code || item.sessionCode || "100000"),
    title: String(item.title || "লাইভ কুইজ সেশন"),
    className: String(item.className || "দশম শ্রেণি"),
    trade: String(item.trade || "জেনারেল"),
    subject: String(item.subject || "সাধারণ জ্ঞান"),
    hostName: String(item.hostName || "হোস্ট শিক্ষক"),
    status,
    stage: (item.stage || "READY_CHECK") as LiveSessionStage,
    currentSlideIndex: Math.max(0, Number(item.currentSlideIndex) || 0),
    stageStartedAt: Number.isFinite(Number(item.stageStartedAt)) ? Number(item.stageStartedAt) : now,
    stageEndsAt: Number.isFinite(Number(item.stageEndsAt)) ? Number(item.stageEndsAt) : now + 20000,
    hostLastSeenAt,
    pausedAt: item.pausedAt ? Number(item.pausedAt) : undefined,
    endedAt: item.endedAt ? Number(item.endedAt) : undefined,
    slides: Array.isArray(item.slides) ? item.slides : [],
    players: item.players && typeof item.players === "object" ? item.players : {},
    answers: item.answers && typeof item.answers === "object" ? item.answers : {},
    smsInterval: item.smsInterval || "EVERY_3",
    updatedAt,
    createdAt,
  };
}

function hydrateFromHybridStoreIntoMap(map: Map<string, LiveSessionRecord>): void {
  if (globalThis.__pgtscLiveHybridHydrated) return;
  globalThis.__pgtscLiveHybridHydrated = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getHybridStore } = require("./hybridStorageEngine") as {
      getHybridStore: () => { liveSessions?: Record<string, any> };
    };
    const hybrid = getHybridStore();
    if (hybrid?.liveSessions && typeof hybrid.liveSessions === "object") {
      for (const rawItem of Object.values(hybrid.liveSessions)) {
        const rec = hydrateSessionRecord(rawItem);
        if (rec) {
          const existing = map.get(rec.id);
          if (!existing || rec.updatedAt > existing.updatedAt) {
            map.set(rec.id, rec);
          }
        }
      }
    }
  } catch {
    // Safe fallback if called before hybrid store initialization
  }
}

function syncMapFromDisk(): Map<string, LiveSessionRecord> {
  // Fast-path (<1ms): Never block high-concurrency 60-student routes on synchronous disk I/O
  if (globalThis.__pgtscLiveSessionMap) {
    if (!globalThis.__pgtscLiveHybridHydrated) {
      hydrateFromHybridStoreIntoMap(globalThis.__pgtscLiveSessionMap);
    }
    return globalThis.__pgtscLiveSessionMap;
  }

  const map = new Map<string, LiveSessionRecord>();
  globalThis.__pgtscLiveSessionMap = map;

  // Cold-start hydration from os.tmpdir() snapshot (or legacy workspace snapshot read-only once)
  try {
    const targetFile = fs.existsSync(CACHE_FILE)
      ? CACHE_FILE
      : LEGACY_READ_FILES.find((f) => fs.existsSync(f)) || null;

    if (targetFile) {
      const stats = fs.statSync(targetFile);
      globalThis.__pgtscLiveSessionsLastMtime = stats.mtimeMs;
      const raw = fs.readFileSync(targetFile, "utf-8");
      const list: LiveSessionRecord[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const item of list) {
          const hydrated = hydrateSessionRecord(item);
          if (hydrated) {
            map.set(hydrated.id, hydrated);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[liveSessionStore] Cold-start disk read warning:", (err as Error).message);
  }

  // Merge permanently saved sessions (including cross-day PAUSED / ENDED sessions) from hybridStorageEngine
  hydrateFromHybridStoreIntoMap(map);

  return map;
}

async function writeDiskSnapshotAsync(): Promise<void> {
  try {
    await fs.promises.mkdir(CACHE_DIR, { recursive: true });
    const map = syncMapFromDisk();
    const list = Array.from(map.values());
    const serialized = JSON.stringify(list);
    const tmp = `${CACHE_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
    await fs.promises.writeFile(tmp, serialized, "utf-8");
    try {
      await fs.promises.rename(tmp, CACHE_FILE);
    } catch {
      await fs.promises.writeFile(CACHE_FILE, serialized, "utf-8");
      await fs.promises.unlink(tmp).catch(() => {});
    }
    globalThis.__pgtscLiveSessionsLastMtime = Date.now();
  } catch (err) {
    console.warn("[liveSessionStore] Async disk flush warning:", (err as Error).message);
  }
}

function flushMapToDisk(immediate = false): void {
  if (globalThis.__pgtscLiveDiskWriteTimer) {
    clearTimeout(globalThis.__pgtscLiveDiskWriteTimer);
    globalThis.__pgtscLiveDiskWriteTimer = undefined;
  }
  if (immediate) {
    void writeDiskSnapshotAsync();
    return;
  }
  globalThis.__pgtscLiveDiskWriteTimer = setTimeout(() => {
    void writeDiskSnapshotAsync();
  }, 500);
}

/**
 * Sync live session state to hybridStorageEngine permanently (for Pause/Resume across days & History).
 */
function persistSessionToHybridStore(session: LiveSessionRecord): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getHybridStore, saveHybridStore } = require("./hybridStorageEngine") as {
      getHybridStore: () => any;
      saveHybridStore: (s: any) => void;
    };
    const store = getHybridStore();
    if (!store.liveSessions || typeof store.liveSessions !== "object") {
      store.liveSessions = {};
    }
    store.liveSessions[session.id] = {
      ...session,
      players: { ...(session.players || {}) },
      answers: { ...(session.answers || {}) },
      slides: Array.isArray(session.slides) ? session.slides : [],
    };
    saveHybridStore(store);
  } catch {
    // Non-fatal fallback
  }
}

/**
 * Persists a LiveSessionRecord to MySQL `LiveSession` table safely.
 * Never throws or blocks offline mode.
 */
export async function syncLiveSessionToMysqlNow(session: LiveSessionRecord): Promise<void> {
  try {
    const { prisma, isPrismaAvailable, markPrismaFailure } = await import("./prisma");
    if (!isPrismaAvailable() || !prisma?.liveSession) return;

    const sortedPlayers = Object.values(session.players || {}).sort((a, b) => (b.score || 0) - (a.score || 0));
    const dbStatus =
      session.status === "ENDED"
        ? "COMPLETED"
        : session.status === "PAUSED"
        ? "CLOSED"
        : session.status === "ACTIVE"
        ? "ACTIVE"
        : "WAITING";

    const snapshotPayload = JSON.stringify({
      __pgtscSessionV2: true,
      sessionId: session.id,
      quizId: session.quizId,
      title: session.title,
      status: session.status,
      stage: session.stage,
      currentSlideIndex: session.currentSlideIndex || 0,
      pausedAt: session.pausedAt,
      endedAt: session.endedAt,
      players: sortedPlayers,
      answers: session.answers || {},
    });

    try {
      const existing = await prisma.liveSession.findFirst({
        where: { pin: session.code },
      });

      if (existing) {
        await prisma.liveSession.update({
          where: { id: existing.id },
          data: {
            status: dbStatus,
            currentQuestion: session.currentSlideIndex || 0,
            totalQuestions: session.slides?.length || 1,
            participantsJson: snapshotPayload,
            startedAt: session.status === "ACTIVE" && !existing.startedAt ? new Date() : existing.startedAt,
            endedAt: session.status === "ENDED" ? new Date() : existing.endedAt,
          },
        });
      } else if (prisma.quiz) {
        const numericQuizId = parseInt(String(session.quizId || "").replace(/\D/g, ""), 10) || 1;
        let targetQuiz = await prisma.quiz.findFirst({ where: { id: numericQuizId } }).catch(() => null);
        if (!targetQuiz) {
          targetQuiz = await prisma.quiz.findFirst().catch(() => null);
        }
        if (targetQuiz) {
          await prisma.liveSession.upsert({
            where: { pin: session.code },
            update: {
              status: dbStatus,
              currentQuestion: session.currentSlideIndex || 0,
              totalQuestions: session.slides?.length || 1,
              participantsJson: snapshotPayload,
            },
            create: {
              pin: session.code,
              quizId: targetQuiz.id,
              hostName: session.hostName || "হোস্ট শিক্ষক",
              status: dbStatus,
              currentQuestion: session.currentSlideIndex || 0,
              totalQuestions: session.slides?.length || 1,
              participantsJson: snapshotPayload,
              startedAt: session.status === "ACTIVE" ? new Date() : null,
              endedAt: session.status === "ENDED" ? new Date() : null,
            },
          });
        }
      }
    } catch (dbErr: any) {
      const msg = dbErr?.message || String(dbErr);
      if (msg.includes("P1001") || msg.includes("ECONNREFUSED") || msg.includes("timed out")) {
        markPrismaFailure();
      }
    }
  } catch {
    // Safe non-blocking background sync
  }
}

function scheduleMysqlLiveSync(session: LiveSessionRecord): void {
  if (globalThis.__pgtscLiveMysqlSyncTimer) {
    clearTimeout(globalThis.__pgtscLiveMysqlSyncTimer);
  }
  globalThis.__pgtscLiveMysqlSyncTimer = setTimeout(() => {
    void syncLiveSessionToMysqlNow(session);
  }, 1500);
}

// ============================================================================
// GUARANTEED SLIDE NORMALIZATION (normalizeSlideForLive)
// ============================================================================

export function normalizeSlideForLive(raw: any, index: number): any {
  if (!raw) raw = {};
  const sType = String(raw.type || raw.questionType || "MCQ").toUpperCase();
  const validTypes = [
    "MCQ",
    "TRUE_FALSE",
    "FILL_BLANKS",
    "MATCHING",
    "REORDER",
    "WORD_CLOUD",
    "OPEN_ENDED",
    "IMAGE_COMPARE",
    "TEXT_SLIDE",
    "LIVE_QA",
    "LEADERBOARD",
  ];
  const type = validTypes.includes(sType) ? sType : "MCQ";

  const isContent = [
    "TEXT_SLIDE",
    "IMAGE_COMPARE",
    "OPEN_ENDED",
    "WORD_CLOUD",
    "LIVE_QA",
    "LEADERBOARD",
  ].includes(type);

  const rawLimit = Number(raw.timeLimit);
  const safeTimeLimit = isContent
    ? Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 0
    : Math.max(5, Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 20);

  const rawPoints = Number(raw.points || raw.marks);
  const safePoints = isContent
    ? 0
    : Math.max(10, Number.isFinite(rawPoints) && rawPoints > 0 ? rawPoints : 100);

  let options: string[] = [];
  if (Array.isArray(raw.options)) {
    options = raw.options.map((o: any) => String(o ?? ""));
  } else if (type === "TRUE_FALSE") {
    options = ["সত্য (True)", "মিথ্যা (False)"];
  }

  const matchingPairs = raw.matchingPairs || raw.pairs || raw.questionData?.pairs || [];
  const reorderItems = raw.reorderItems || raw.items || raw.correctOrder || raw.questionData?.items || [];
  const questionStr = String(
    raw.question ||
    raw.questionText ||
    raw.title ||
    raw.content ||
    `প্রশ্ন ${index + 1}`
  );
  const titleStr = String(raw.title || raw.questionText || raw.question || `স্লাইড ${index + 1}`);

  return {
    id: String(raw.id || raw.slideId || `slide-${index}`),
    type,
    questionType: type,
    title: titleStr,
    question: questionStr,
    questionText: questionStr,
    content: raw.content || "",
    options,
    timeLimit: safeTimeLimit,
    points: safePoints,
    marks: safePoints,
    correctAnswer: raw.correctAnswer !== undefined ? raw.correctAnswer : (raw.correctOptionIndex ?? 0),
    matchingPairs,
    pairs: matchingPairs,
    reorderItems,
    items: reorderItems,
    correctOrder: reorderItems,
    sentenceWithBlank: raw.sentenceWithBlank || titleStr || questionStr,
    blankAnswer: raw.blankAnswer || raw.correctAnswer || (raw.acceptedAnswers && raw.acceptedAnswers[0]) || "",
    acceptedAnswers: raw.acceptedAnswers || [],
    imageLeftUrl: raw.imageLeftUrl || raw.leftImage || "",
    imageRightUrl: raw.imageRightUrl || raw.rightImage || "",
    bulletPoints: Array.isArray(raw.bulletPoints) ? raw.bulletPoints : [],
    explanation: raw.explanation || "",
    questionData: raw.questionData || raw,
  };
}

// Backward-compatible alias
export const normalizeSlide = normalizeSlideForLive;

// ============================================================================
// HOST HEARTBEAT & 25-SECOND INACTIVITY / EXIT GUARD
// ============================================================================

export function isHostTimedOut(session: LiveSessionRecord, now = Date.now()): boolean {
  if (!session) return false;
  if (session.status !== "WAITING" && session.status !== "ACTIVE") return false;
  const lastSeen =
    Number(session.hostLastSeenAt) > 0
      ? Number(session.hostLastSeenAt)
      : Number(session.updatedAt) || Number(session.createdAt) || now;
  return now - lastSeen > HOST_HEARTBEAT_TIMEOUT_MS;
}

export function syncSessionHostLiveness(session: LiveSessionRecord, now = Date.now()): boolean {
  if (!isHostTimedOut(session, now)) return false;
  session.status = "PAUSED";
  session.pausedAt = now;
  session.updatedAt = now;
  if (session.stage === "COUNTDOWN_321") {
    session.stage = "READY_CHECK";
  }
  saveLiveSession(session);
  return true;
}

export function touchHostHeartbeat(idOrCode: string): LiveSessionRecord | null {
  const session = getLiveSession(idOrCode, { skipLivenessCheck: true });
  if (!session) return null;
  if (session.status === "WAITING" || session.status === "ACTIVE") {
    session.hostLastSeenAt = Date.now();
  }
  return session;
}

// ============================================================================
// SESSION LOOKUP, CREATION & PERSISTENCE
// ============================================================================

export function getLiveSession(
  idOrCode: string,
  options?: { skipLivenessCheck?: boolean }
): LiveSessionRecord | null {
  if (!idOrCode) return null;
  const map = syncMapFromDisk();
  const needle = String(idOrCode).trim();
  const digitsOnly = needle.replace(/\D/g, "");

  // 1. Direct ID lookup
  if (map.has(needle)) {
    const found = map.get(needle)!;
    if (!options?.skipLivenessCheck) {
      syncSessionHostLiveness(found);
    }
    return found;
  }

  // 2. Code lookup (prefer WAITING/ACTIVE, then PAUSED, then most recent ENDED)
  const codeMatches: LiveSessionRecord[] = [];
  for (const session of map.values()) {
    if (session.code === needle || (digitsOnly.length >= 4 && session.code === digitsOnly)) {
      codeMatches.push(session);
    }
  }
  if (codeMatches.length > 0) {
    codeMatches.sort((a, b) => {
      const rank = (s: LiveSessionRecord) =>
        s.status === "ACTIVE" ? 4 : s.status === "WAITING" ? 3 : s.status === "PAUSED" ? 2 : 1;
      const diff = rank(b) - rank(a);
      return diff !== 0 ? diff : (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    const best = codeMatches[0];
    if (!options?.skipLivenessCheck) {
      syncSessionHostLiveness(best);
    }
    return best;
  }

  // 3. Fallback: Check institutionalDb.liveSessions to bridge legacy in-memory sessions
  const legacy = institutionalDb.liveSessions.find(
    (s) =>
      s.id === needle ||
      s.sessionCode === needle ||
      (digitsOnly.length >= 4 && (s.sessionCode === digitsOnly || s.pinCode === digitsOnly))
  );

  if (legacy) {
    const rawSlides = (legacy as any).slides || (legacy as any).questions || [];
    const normalizedSlides = rawSlides.map((s: any, idx: number) => normalizeSlideForLive(s, idx));
    const now = Date.now();
    const mappedStatus: LiveSessionStatus =
      legacy.status === "COMPLETED"
        ? "ENDED"
        : (legacy.status as string) === "PAUSED"
        ? "PAUSED"
        : legacy.status === "LOBBY"
        ? "WAITING"
        : "ACTIVE";

    const converted: LiveSessionRecord = {
      id: legacy.id,
      code: legacy.sessionCode || digitsOnly || "100000",
      title: (legacy as any).subjectName || (legacy as any).title || "লাইভ কুইজ",
      className: legacy.className || "দশম শ্রেণি",
      trade: legacy.tradeName || "জেনারেল",
      subject: legacy.subjectName || "সাধারণ জ্ঞান",
      hostName: "হোস্ট শিক্ষক",
      status: mappedStatus,
      stage: (legacy as any).stage || (legacy.status === "LOBBY" ? "READY_CHECK" : "ANSWERING_ACTIVE"),
      currentSlideIndex: legacy.currentQuestionIndex || 0,
      stageStartedAt: (legacy as any).stageStartedAt ? Number((legacy as any).stageStartedAt) : now,
      stageEndsAt: (legacy as any).stageEndsAt ? Number((legacy as any).stageEndsAt) : now + 30000,
      hostLastSeenAt: legacy.hostLastSeenAt ? new Date(legacy.hostLastSeenAt).getTime() : now,
      slides: normalizedSlides.length > 0 ? normalizedSlides : [normalizeSlideForLive({}, 0)],
      players: {},
      answers: {},
      smsInterval: "EVERY_3",
      updatedAt: now,
      createdAt: now,
      quizId: legacy.quizId,
      scheduledStartTime: (legacy as any).scheduledStartTime,
      isLocked: legacy.isLocked || false,
    };

    // Hydrate existing participants from institutionalDb
    const activeParts = institutionalDb.liveParticipants.filter((p) => p.sessionId === legacy.id);
    for (const p of activeParts) {
      converted.players[p.id] = {
        id: p.id,
        name: p.displayName || `Student ${p.id.slice(-4)}`,
        roll: p.studentId || "—",
        avatar: (p as any).avatar || "🚀",
        isReady: Boolean((p as any).isReady),
        score: p.totalScore || 0,
        streak: p.currentStreak || 0,
        rank: p.rank || 0,
        lastSeenAt: now,
        joinedAt: now,
      };
    }

    map.set(converted.id, converted);
    flushMapToDisk();
    if (!options?.skipLivenessCheck) {
      syncSessionHostLiveness(converted);
    }
    return converted;
  }

  return null;
}

export function listLiveSessions(filters?: {
  quizId?: string;
  status?: LiveSessionStatus | "ALL";
}): LiveSessionRecord[] {
  const map = syncMapFromDisk();
  const list = Array.from(map.values());

  for (const s of list) {
    syncSessionHostLiveness(s);
  }

  let filtered = list;
  if (filters?.quizId) {
    const targetQuizId = String(filters.quizId).trim();
    filtered = filtered.filter((s) => String(s.quizId || "").trim() === targetQuizId);
  }
  if (filters?.status && filters.status !== "ALL") {
    filtered = filtered.filter((s) => s.status === filters.status);
  }

  return filtered.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
}

export function saveLiveSession(session: LiveSessionRecord, immediate = false): void {
  if (!session || !session.id) return;
  const map = syncMapFromDisk();

  // Strict numeric timestamps enforcement
  session.stageStartedAt = Number(session.stageStartedAt);
  if (!Number.isFinite(session.stageStartedAt)) session.stageStartedAt = Date.now();

  session.stageEndsAt = Number(session.stageEndsAt);
  if (!Number.isFinite(session.stageEndsAt)) session.stageEndsAt = Date.now() + 3000;

  if (!Number.isFinite(Number(session.hostLastSeenAt)) || Number(session.hostLastSeenAt) <= 0) {
    session.hostLastSeenAt = Date.now();
  }

  session.updatedAt = Date.now();
  map.set(session.id, session);
  flushMapToDisk(immediate);
  persistSessionToHybridStore(session);
  if (!immediate) {
    scheduleMysqlLiveSync(session);
  }

  // Sync to institutionalDb for legacy consumers
  const legacyIdx = institutionalDb.liveSessions.findIndex((s) => s.id === session.id);
  const legacyStatus =
    session.status === "ENDED"
      ? "COMPLETED"
      : session.status === "PAUSED"
      ? "PAUSED"
      : session.stage === "READY_CHECK"
      ? "READY"
      : session.status === "WAITING"
      ? "LOBBY"
      : "QUESTION_ACTIVE";

  if (legacyIdx >= 0) {
    const leg = institutionalDb.liveSessions[legacyIdx];
    leg.status = legacyStatus as any;
    leg.currentQuestionIndex = session.currentSlideIndex;
    leg.hostLastSeenAt = new Date(session.hostLastSeenAt).toISOString();
    (leg as any).stage = session.stage;
    (leg as any).stageStartedAt = session.stageStartedAt;
    (leg as any).stageEndsAt = session.stageEndsAt;
    (leg as any).slides = session.slides;
    (leg as any).updatedAt = new Date(session.updatedAt).toISOString();
  }
}

export function createLiveSession(data: Partial<LiveSessionRecord>): LiveSessionRecord {
  const map = syncMapFromDisk();
  const id = data.id || `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // Generate 6-digit room code if not provided
  let code = data.code || "";
  if (!code || code.length < 4) {
    let attempts = 0;
    while (attempts < 10) {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      let exists = false;
      for (const s of map.values()) {
        if (s.code === pin && s.status !== "ENDED") {
          exists = true;
          break;
        }
      }
      if (!exists) {
        code = pin;
        break;
      }
      attempts++;
    }
    if (!code) code = Math.floor(100000 + Math.random() * 900000).toString();
  }

  const rawSlides = Array.isArray(data.slides) && data.slides.length > 0 ? data.slides : [];
  const normalizedSlides = rawSlides.map((s, idx) => normalizeSlideForLive(s, idx));

  const now = Date.now();
  const sessionRecord: LiveSessionRecord = {
    id,
    code,
    title: data.title || "লাইভ কুইজ সেশন",
    className: data.className || "দশম শ্রেণি",
    trade: data.trade || "জেনারেল",
    subject: data.subject || "সাধারণ জ্ঞান",
    hostName: data.hostName || "হোস্ট শিক্ষক",
    status: data.status || "WAITING",
    stage: data.stage || "READY_CHECK",
    currentSlideIndex: Number(data.currentSlideIndex) || 0,
    stageStartedAt: Number(data.stageStartedAt) || now,
    stageEndsAt: Number(data.stageEndsAt) || now + 30000,
    hostLastSeenAt: Number(data.hostLastSeenAt) || now,
    slides: normalizedSlides.length > 0 ? normalizedSlides : [normalizeSlideForLive({}, 0)],
    players: data.players || {},
    answers: data.answers || {},
    smsInterval: data.smsInterval || "EVERY_3",
    updatedAt: now,
    createdAt: now,
    quizId: data.quizId,
    scheduledStartTime: data.scheduledStartTime,
    isLocked: data.isLocked || false,
    hostUserId: data.hostUserId || 3,
    joinToken: data.joinToken || `join-${now}-${Math.random().toString(36).substr(2, 7)}`,
  };

  saveLiveSession(sessionRecord, true);
  return sessionRecord;
}

/**
 * Pause and permanently save the live session (preserving currentSlideIndex, players, scores, answers).
 */
export async function pauseLiveSession(idOrCode: string): Promise<LiveSessionRecord | null> {
  const session = getLiveSession(idOrCode, { skipLivenessCheck: true });
  if (!session) return null;
  if (session.status === "ENDED") return session;

  const now = Date.now();
  session.status = "PAUSED";
  session.pausedAt = now;
  session.updatedAt = now;
  if (session.stage === "COUNTDOWN_321") {
    session.stage = "READY_CHECK";
  }

  saveLiveSession(session, true);
  await syncLiveSessionToMysqlNow(session);
  return session;
}

/**
 * Resume a previously PAUSED session from its saved question (or Q[X+1] if RESULT_REVEAL had finished),
 * reactivating status = "ACTIVE" and keeping every student's previous score & answers intact.
 */
export async function resumeLiveSession(
  idOrCode: string,
  slideIndexOverride?: number
): Promise<LiveSessionRecord | null> {
  const session = getLiveSession(idOrCode, { skipLivenessCheck: true });
  if (!session) return null;

  const now = Date.now();
  const totalSlides = Math.max(1, session.slides?.length || 1);

  let targetSlide = session.currentSlideIndex || 0;
  if (typeof slideIndexOverride === "number" && Number.isFinite(slideIndexOverride)) {
    targetSlide = slideIndexOverride;
  } else if (session.stage === "RESULT_REVEAL" && targetSlide + 1 < totalSlides) {
    // Finished previous question before pausing -> automatically continue on the next question!
    targetSlide = targetSlide + 1;
  }

  session.currentSlideIndex = Math.min(Math.max(0, targetSlide), totalSlides - 1);
  session.status = "ACTIVE";
  session.stage = "READY_CHECK";
  session.stageStartedAt = now;
  session.stageEndsAt = now + 60_000;
  session.hostLastSeenAt = now;
  session.pausedAt = undefined;
  session.updatedAt = now;

  saveLiveSession(session, true);
  await syncLiveSessionToMysqlNow(session);
  return session;
}

// ============================================================================
// CONCURRENT PLAYER & ANSWER MUTATIONS
// ============================================================================

export function addOrUpdatePlayer(
  sessionId: string,
  player: Partial<LivePlayerRecord> & { id: string; name: string }
): LivePlayerRecord | null {
  const session = getLiveSession(sessionId, { skipLivenessCheck: true });
  if (!session) return null;

  const existing = session.players[player.id];
  const now = Date.now();

  const updated: LivePlayerRecord = {
    id: player.id,
    name: player.name.trim(),
    roll: player.roll !== undefined ? player.roll : existing?.roll || "—",
    avatar: player.avatar || existing?.avatar || "🚀",
    isReady: player.isReady !== undefined ? player.isReady : existing?.isReady || false,
    score: existing?.score || 0,
    streak: existing?.streak || 0,
    rank: existing?.rank || Object.keys(session.players).length + 1,
    lastSeenAt: now,
    joinedAt: existing?.joinedAt || now,
    tabSwitchCount: player.tabSwitchCount !== undefined ? player.tabSwitchCount : existing?.tabSwitchCount || 0,
  };

  session.players[player.id] = updated;
  saveLiveSession(session);

  // Sync to institutionalDb.liveParticipants
  let part = institutionalDb.liveParticipants.find((p) => p.sessionId === session.id && p.id === player.id);
  if (!part) {
    part = {
      id: player.id,
      sessionId: session.id,
      displayName: updated.name,
      studentId: typeof updated.roll === "number" ? updated.roll : parseInt(String(updated.roll)) || undefined,
      avatar: updated.avatar,
      playerToken: `p-tok-${player.id}`,
      totalScore: updated.score,
      currentStreak: updated.streak,
      rank: updated.rank || 1,
      status: "JOINED",
      connectionStatus: "online",
      joinedAt: new Date(updated.joinedAt).toISOString(),
      lastSeenAt: new Date(updated.lastSeenAt).toISOString(),
      createdAt: new Date(updated.joinedAt).toISOString(),
      updatedAt: new Date(now).toISOString(),
    };
    institutionalDb.liveParticipants.push(part);
  } else {
    part.displayName = updated.name;
    part.avatar = updated.avatar;
    part.status = "JOINED";
    part.connectionStatus = "online";
    part.lastSeenAt = new Date(now).toISOString();
    part.totalScore = updated.score;
    part.currentStreak = updated.streak;
    (part as any).isReady = updated.isReady;
  }

  return updated;
}

export function setPlayerReady(sessionId: string, playerId: string, isReady: boolean): boolean {
  const session = getLiveSession(sessionId, { skipLivenessCheck: true });
  if (!session || !session.players[playerId]) return false;

  session.players[playerId].isReady = isReady;
  session.players[playerId].lastSeenAt = Date.now();
  saveLiveSession(session);

  const part = institutionalDb.liveParticipants.find((p) => p.sessionId === session.id && p.id === playerId);
  if (part) {
    (part as any).isReady = isReady;
  }
  return true;
}

export function recordPlayerAnswer(
  sessionId: string,
  slideIndex: number,
  playerId: string,
  answer: LiveAnswerRecord
): boolean {
  const session = getLiveSession(sessionId, { skipLivenessCheck: true });
  if (!session) return false;

  const slideKey = String(slideIndex);
  if (!session.answers[slideKey]) {
    session.answers[slideKey] = {};
  }

  session.answers[slideKey][playerId] = answer;

  const player = session.players[playerId];
  if (player) {
    player.score = (player.score || 0) + (answer.points || 0);
    if (answer.isCorrect) {
      player.streak = (player.streak || 0) + 1;
    } else {
      player.streak = 0;
    }
    player.lastSeenAt = Date.now();
  }

  saveLiveSession(session);
  return true;
}

// ============================================================================
// SERVER-SIDE AUTOMATIC STAGE PROGRESSION (syncAndAutoAdvanceSession)
// Guaranteed auto-transition so neither Host nor Students ever get stuck!
// ============================================================================

export function syncAndAutoAdvanceSession(session: LiveSessionRecord): boolean {
  if (!session) return false;
  const now = Date.now();

  // Check host 25-second timeout before advancing any timers
  if (syncSessionHostLiveness(session, now)) {
    return true;
  }

  if (session.status === "PAUSED" || session.status === "ENDED") {
    return false;
  }

  // Enforce strictly finite numeric timestamps
  if (!Number.isFinite(session.stageStartedAt)) session.stageStartedAt = now;
  if (!Number.isFinite(session.stageEndsAt)) session.stageEndsAt = now + 3000;

  let modified = false;
  const currentSlide = session.slides[session.currentSlideIndex] || session.slides[0];
  const safeTimeLimit = Math.max(5, Number(currentSlide?.timeLimit) || 20);

  // Auto-Advance Rule 1: COUNTDOWN_321 -> ANSWERING_ACTIVE
  if (session.stage === "COUNTDOWN_321" && now >= session.stageEndsAt) {
    session.stage = "ANSWERING_ACTIVE";
    session.stageStartedAt = now;
    session.stageEndsAt = now + safeTimeLimit * 1000;
    modified = true;
  }
  // Auto-Advance Rule 2: QUESTION_ONLY -> ANSWERING_ACTIVE
  else if (session.stage === "QUESTION_ONLY" && now >= session.stageEndsAt) {
    session.stage = "ANSWERING_ACTIVE";
    session.stageStartedAt = now;
    session.stageEndsAt = now + safeTimeLimit * 1000;
    modified = true;
  }
  // Auto-Advance Rule 3: ANSWERING_ACTIVE -> RESULT_REVEAL
  else if (session.stage === "ANSWERING_ACTIVE") {
    const totalPlayers = Object.keys(session.players || {}).length;
    const slideKey = String(session.currentSlideIndex);
    const submittedCount = Object.keys(session.answers[slideKey] || {}).length;

    if (now >= session.stageEndsAt || (totalPlayers > 0 && submittedCount >= totalPlayers)) {
      session.stage = "RESULT_REVEAL";
      session.stageStartedAt = now;
      session.stageEndsAt = now + 120000;

      // Recompute all player ranks (#1 to #60)
      const playerList = Object.values(session.players || {});
      playerList.sort((a, b) => (b.score || 0) - (a.score || 0));
      playerList.forEach((p, idx) => {
        p.rank = idx + 1;
      });

      modified = true;
    }
  }

  if (modified) {
    session.updatedAt = now;
    saveLiveSession(session);
  }

  return modified;
}

// Backward-compatible alias
export const evaluateAndAdvanceSessionStage = syncAndAutoAdvanceSession;

// ============================================================================
// NAN-PROOF COUNTDOWN UTILITY
// ============================================================================

export function computeSafeRemainingSeconds(
  stageEndsAt?: any,
  serverOffsetMs = 0,
  fallbackSeconds = 3
): number {
  const target = Number(stageEndsAt);
  if (!Number.isFinite(target) || target <= 0) return fallbackSeconds;
  const diff = Math.ceil((target - (Date.now() + serverOffsetMs)) / 1000);
  return Number.isFinite(diff) ? Math.max(0, diff) : fallbackSeconds;
}

// ============================================================================
// MYSQL & HYBRID PERSISTENCE ARCHIVER (archiveLiveSessionToDb)
// Automatically archives completed quiz sessions to both local disk & MySQL
// ============================================================================

export async function archiveLiveSessionToDb(sessionId: string): Promise<any> {
  const session = getLiveSession(sessionId, { skipLivenessCheck: true });
  if (!session) return null;

  const now = Date.now();
  session.stage = "ENDED";
  session.status = "ENDED";
  session.endedAt = now;
  session.updatedAt = now;
  saveLiveSession(session, true);

  const playersList = Object.values(session.players || {});
  const sortedPlayers = [...playersList].sort((a, b) => (b.score || 0) - (a.score || 0));
  sortedPlayers.forEach((p, idx) => {
    p.rank = idx + 1;
  });

  const totalQuestions = session.slides?.length || 0;
  const totalParticipants = sortedPlayers.length;
  const avgScore =
    totalParticipants > 0
      ? Math.round(sortedPlayers.reduce((acc, p) => acc + (p.score || 0), 0) / totalParticipants)
      : 0;

  // Question-by-question analytics
  const questionAnalytics = (session.slides || []).map((slide, idx) => {
    const slideAnswers = Object.values(session.answers[String(idx)] || {});
    const correctCount = slideAnswers.filter((a) => a.isCorrect).length;
    const answeredCount = slideAnswers.length;
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    return {
      slideIndex: idx,
      questionText: slide.questionText || slide.title || slide.question || `প্রশ্ন ${idx + 1}`,
      questionType: slide.type || slide.questionType || "MCQ",
      answeredCount,
      correctCount,
      accuracy,
    };
  });

  const quizResultRecord = {
    id: `result_${session.id}`,
    quizId: session.quizId || session.id,
    sessionId: session.id,
    sessionCode: session.code,
    title: session.title || "লাইভ কুইজ সেশন",
    className: session.className || "দশম শ্রেণি",
    trade: session.trade || "কম্পিউটার ও আইটি",
    subject: session.subject || "সাধারণ বিষয়",
    totalParticipants,
    totalQuestions,
    questionsCompleted: Math.min(totalQuestions, (session.currentSlideIndex || 0) + 1),
    avgScore,
    completedAt: new Date(now).toISOString(),
    topPerformers: sortedPlayers.slice(0, 10).map((p) => ({
      id: p.id,
      name: p.name,
      roll: p.roll,
      score: p.score,
      avatar: p.avatar,
      rank: p.rank,
    })),
    questionAnalytics,
    rawParticipants: sortedPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      roll: p.roll,
      score: p.score,
      streak: p.streak || 0,
      avatar: p.avatar,
      rank: p.rank,
    })),
    answers: session.answers || {},
  };

  try {
    const { getHybridStore, saveHybridStore } = await import("./hybridStorageEngine");
    const { prisma: prismaClient, isPrismaAvailable } = await import("./prisma");
    const store = getHybridStore();
    if (!store.quizResults) {
      store.quizResults = [];
    }
    const existingIdx = store.quizResults.findIndex(
      (r: any) => r.sessionId === session.id || r.id === quizResultRecord.id
    );
    if (existingIdx >= 0) {
      store.quizResults[existingIdx] = quizResultRecord;
    } else {
      store.quizResults.unshift(quizResultRecord);
    }
    saveHybridStore(store);

    await syncLiveSessionToMysqlNow(session);

    if (isPrismaAvailable() && prismaClient) {
      try {
        if (prismaClient.quizResult) {
          const numericQuizId = parseInt(String(session.quizId || "").replace(/\D/g, ""), 10) || 1;
          await prismaClient.quizResult.create({
            data: {
              quizId: numericQuizId,
              quizTitle: session.title || "লাইভ কুইজ সেশন",
              sessionPin: session.code,
              totalPlayers: totalParticipants,
              winnerName: sortedPlayers[0]?.name || null,
              winnerScore: sortedPlayers[0]?.score || 0,
              averageScore: avgScore,
              leaderboardJson: JSON.stringify(sortedPlayers),
              completedAt: new Date(now),
            },
          });
        }
      } catch (e) {
        console.warn("[archiveLiveSessionToDb] Prisma archive warning:", e);
      }
    }
  } catch (err) {
    console.error("[liveSessionStore] archiveLiveSessionToDb error:", err);
  }

  return quizResultRecord;
}
