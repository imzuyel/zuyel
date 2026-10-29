import fs from "fs";
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

export type LiveSessionStatus = "WAITING" | "ACTIVE" | "ENDED";

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
// GLOBAL SINGLETON & DISK PERSISTENCE (.next/cache/live-sessions-v3.json)
// ============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __pgtscLiveSessions: Map<string, LiveSessionRecord> | undefined;
}

const CACHE_DIR = path.join(process.cwd(), ".next", "cache");
const CACHE_FILE = path.join(CACHE_DIR, "live-sessions-v3.json");

function getStorageMap(): Map<string, LiveSessionRecord> {
  if (!globalThis.__pgtscLiveSessions) {
    globalThis.__pgtscLiveSessions = new Map<string, LiveSessionRecord>();
    // Try restoring from atomic disk persistence file if present
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = fs.readFileSync(CACHE_FILE, "utf-8");
        const list: LiveSessionRecord[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item && item.id) {
              // Ensure numeric timestamps
              item.stageStartedAt = Number(item.stageStartedAt) || Date.now();
              item.stageEndsAt = Number(item.stageEndsAt) || (Date.now() + 3000);
              item.updatedAt = Number(item.updatedAt) || Date.now();
              item.createdAt = Number(item.createdAt) || Date.now();
              globalThis.__pgtscLiveSessions.set(item.id, item);
            }
          }
        }
      }
    } catch (err) {
      console.warn("[liveSessionStore] Initial cache read warning:", (err as Error).message);
    }
  }
  return globalThis.__pgtscLiveSessions;
}

let persistTimeout: NodeJS.Timeout | null = null;

function scheduleDiskPersistence() {
  if (persistTimeout) return;
  persistTimeout = setTimeout(() => {
    persistTimeout = null;
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      const map = getStorageMap();
      const list = Array.from(map.values());
      fs.writeFileSync(CACHE_FILE, JSON.stringify(list), "utf-8");
    } catch (err) {
      console.warn("[liveSessionStore] Atomic disk write warning:", (err as Error).message);
    }
  }, 100);
}

// ============================================================================
// SLIDE NORMALIZATION (Guarantee safe timeLimit and complete properties)
// ============================================================================

export function normalizeSlide(raw: any, index: number): any {
  if (!raw) raw = {};
  const sType = String(raw.type || raw.questionType || "MCQ").toUpperCase();
  const isContent = [
    "TEXT_SLIDE",
    "IMAGE_COMPARE",
    "OPEN_ENDED",
    "WORD_CLOUD",
    "LIVE_QA",
    "LEADERBOARD",
  ].includes(sType);

  const rawLimit = Number(raw.timeLimit);
  // For graded questions, minimum 5 seconds, default 20 seconds.
  // For content slides without timer, keep 0 or given limit.
  const safeTimeLimit = isContent
    ? (Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 0)
    : Math.max(5, Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 20);

  const options = Array.isArray(raw.options) ? raw.options : [];
  const matchingPairs = raw.matchingPairs || raw.pairs || raw.questionData?.pairs || [];
  const reorderItems = raw.reorderItems || raw.items || raw.correctOrder || raw.questionData?.items || [];
  const sentenceWithBlank = raw.sentenceWithBlank || raw.title || raw.questionText || raw.question;
  const blankAnswer = raw.blankAnswer || raw.correctAnswer || (raw.acceptedAnswers && raw.acceptedAnswers[0]) || "";
  const acceptedAnswers = raw.acceptedAnswers || (blankAnswer ? [blankAnswer] : []);

  return {
    id: String(raw.id || raw.slideId || `slide-${index}`),
    type: sType,
    questionType: sType,
    title: raw.title || raw.questionText || raw.question || `স্লাইড ${index + 1}`,
    questionText: raw.questionText || raw.question || raw.title || raw.content || `প্রশ্ন ${index + 1}`,
    content: raw.content || "",
    options,
    timeLimit: safeTimeLimit,
    points: Number(raw.points || raw.marks) || (isContent ? 0 : 100),
    marks: Number(raw.points || raw.marks) || (isContent ? 0 : 100),
    correctAnswer: raw.correctAnswer !== undefined ? raw.correctAnswer : (raw.correctOptionIndex ?? 0),
    matchingPairs,
    pairs: matchingPairs,
    reorderItems,
    items: reorderItems,
    correctOrder: reorderItems,
    sentenceWithBlank,
    blankAnswer,
    acceptedAnswers,
    imageLeftUrl: raw.imageLeftUrl || raw.leftImage || "",
    imageRightUrl: raw.imageRightUrl || raw.rightImage || "",
    bulletPoints: Array.isArray(raw.bulletPoints) ? raw.bulletPoints : [],
    explanation: raw.explanation || "",
    questionData: raw.questionData || raw,
  };
}

// ============================================================================
// SESSION LOOKUP, CREATION & PERSISTENCE
// ============================================================================

export function getLiveSession(idOrCode: string): LiveSessionRecord | null {
  if (!idOrCode) return null;
  const map = getStorageMap();
  const needle = String(idOrCode).trim();
  const digitsOnly = needle.replace(/\D/g, "");

  // 1. Direct ID lookup
  if (map.has(needle)) {
    return map.get(needle)!;
  }

  // 2. Code lookup
  for (const session of map.values()) {
    if (session.code === needle || (digitsOnly.length >= 4 && session.code === digitsOnly)) {
      return session;
    }
  }

  // 3. Fallback: check institutionalDb.liveSessions to bridge legacy sessions
  const legacy = institutionalDb.liveSessions.find(
    (s) =>
      s.id === needle ||
      s.sessionCode === needle ||
      (digitsOnly.length >= 4 && (s.sessionCode === digitsOnly || s.pinCode === digitsOnly))
  );

  if (legacy) {
    const rawSlides = (legacy as any).slides || (legacy as any).questions || [];
    const normalizedSlides = rawSlides.map((s: any, idx: number) => normalizeSlide(s, idx));

    const converted: LiveSessionRecord = {
      id: legacy.id,
      code: legacy.sessionCode || digitsOnly || "100000",
      title: (legacy as any).subjectName || (legacy as any).title || "লাইভ কুইজ",
      className: legacy.className || "দশম শ্রেণি",
      trade: legacy.tradeName || "জেনারেল",
      subject: legacy.subjectName || "সাধারণ জ্ঞান",
      hostName: "হোস্ট শিক্ষক",
      status: legacy.status === "COMPLETED" ? "ENDED" : legacy.status === "LOBBY" ? "WAITING" : "ACTIVE",
      stage: (legacy as any).stage || (legacy.status === "LOBBY" ? "READY_CHECK" : "ANSWERING_ACTIVE"),
      currentSlideIndex: legacy.currentQuestionIndex || 0,
      stageStartedAt: (legacy as any).stageStartedAt ? Number((legacy as any).stageStartedAt) : Date.now(),
      stageEndsAt: (legacy as any).stageEndsAt ? Number((legacy as any).stageEndsAt) : Date.now() + 30000,
      slides: normalizedSlides.length > 0 ? normalizedSlides : [normalizeSlide({}, 0)],
      players: {},
      answers: {},
      smsInterval: "EVERY_3",
      updatedAt: Date.now(),
      createdAt: Date.now(),
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
        lastSeenAt: Date.now(),
        joinedAt: Date.now(),
      };
    }

    map.set(converted.id, converted);
    scheduleDiskPersistence();
    return converted;
  }

  return null;
}

export function saveLiveSession(session: LiveSessionRecord): void {
  if (!session || !session.id) return;
  const map = getStorageMap();

  // Strict numeric timestamps enforcement
  session.stageStartedAt = Number(session.stageStartedAt);
  if (!Number.isFinite(session.stageStartedAt)) session.stageStartedAt = Date.now();

  session.stageEndsAt = Number(session.stageEndsAt);
  if (!Number.isFinite(session.stageEndsAt)) session.stageEndsAt = Date.now() + 3000;

  session.updatedAt = Date.now();
  map.set(session.id, session);
  scheduleDiskPersistence();

  // Sync to institutionalDb so legacy route consumers continue to see valid data
  const legacyIdx = institutionalDb.liveSessions.findIndex((s) => s.id === session.id);
  const legacyStatus =
    session.status === "ENDED" ? "COMPLETED" : session.stage === "READY_CHECK" ? "READY" : session.status === "WAITING" ? "LOBBY" : "QUESTION_ACTIVE";

  if (legacyIdx >= 0) {
    const leg = institutionalDb.liveSessions[legacyIdx];
    leg.status = legacyStatus as any;
    leg.currentQuestionIndex = session.currentSlideIndex;
    (leg as any).stage = session.stage;
    (leg as any).stageStartedAt = session.stageStartedAt;
    (leg as any).stageEndsAt = session.stageEndsAt;
    (leg as any).slides = session.slides;
    (leg as any).updatedAt = new Date(session.updatedAt).toISOString();
  }
}

export function createLiveSession(data: Partial<LiveSessionRecord>): LiveSessionRecord {
  const map = getStorageMap();
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
  const normalizedSlides = rawSlides.map((s, idx) => normalizeSlide(s, idx));

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
    stageEndsAt: Number(data.stageEndsAt) || (now + 30000),
    slides: normalizedSlides.length > 0 ? normalizedSlides : [normalizeSlide({}, 0)],
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

  saveLiveSession(sessionRecord);
  return sessionRecord;
}

// ============================================================================
// CONCURRENT PLAYER & ANSWER MUTATIONS
// ============================================================================

export function addOrUpdatePlayer(
  sessionId: string,
  player: Partial<LivePlayerRecord> & { id: string; name: string }
): LivePlayerRecord | null {
  const session = getLiveSession(sessionId);
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
    (part as any).isReady = updated.isReady;
  }

  return updated;
}

export function setPlayerReady(sessionId: string, playerId: string, isReady: boolean): boolean {
  const session = getLiveSession(sessionId);
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
  const session = getLiveSession(sessionId);
  if (!session) return false;

  const slideKey = String(slideIndex);
  if (!session.answers[slideKey]) {
    session.answers[slideKey] = {};
  }

  session.answers[slideKey][playerId] = answer;

  // Update player score & streak in O(1)
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
// SERVER-SIDE AUTO-STAGE PROGRESSION (TASK 2)
// Evaluates stage timers & auto-advances. Called on EVERY /state request!
// ============================================================================

export function evaluateAndAdvanceSessionStage(session: LiveSessionRecord): boolean {
  if (!session) return false;
  const now = Date.now();

  // Enforce valid finite numeric timestamps
  if (!Number.isFinite(session.stageStartedAt)) session.stageStartedAt = now;
  if (!Number.isFinite(session.stageEndsAt)) session.stageEndsAt = now + 3000;

  let modified = false;
  const currentSlide = session.slides[session.currentSlideIndex] || session.slides[0];
  const safeTimeLimit = Math.max(5, Number(currentSlide?.timeLimit) || 20);

  // Auto-Transition Rule 1 (COUNTDOWN_321 -> ANSWERING_ACTIVE):
  // When 3-second countdown expires, immediately open answering.
  if (session.stage === "COUNTDOWN_321" && now >= session.stageEndsAt) {
    session.stage = "ANSWERING_ACTIVE";
    session.stageStartedAt = now;
    session.stageEndsAt = now + safeTimeLimit * 1000;
    modified = true;
  }
  // Auto-Transition Rule 2 (QUESTION_ONLY -> ANSWERING_ACTIVE):
  else if (session.stage === "QUESTION_ONLY" && now >= session.stageEndsAt) {
    session.stage = "ANSWERING_ACTIVE";
    session.stageStartedAt = now;
    session.stageEndsAt = now + safeTimeLimit * 1000;
    modified = true;
  }
  // Auto-Transition Rule 3 (ANSWERING_ACTIVE -> RESULT_REVEAL):
  // When time runs out OR all joined students have submitted:
  else if (session.stage === "ANSWERING_ACTIVE") {
    const totalPlayers = Object.keys(session.players || {}).length;
    const slideKey = String(session.currentSlideIndex);
    const submittedCount = Object.keys(session.answers[slideKey] || {}).length;

    if (now >= session.stageEndsAt || (totalPlayers > 0 && submittedCount >= totalPlayers)) {
      session.stage = "RESULT_REVEAL";
      session.stageStartedAt = now;
      session.stageEndsAt = now + 120000; // ample time for teacher reveal/review
      modified = true;
    }
  }

  if (modified) {
    session.updatedAt = now;
    saveLiveSession(session);
  }

  return modified;
}

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

