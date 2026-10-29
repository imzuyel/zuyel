/**
 * Session Mutex & Atomic Memory Store for High-Concurrency Live Quizzes (40-60+ Concurrent Students)
 * Prevents race conditions during simultaneous answers and ready taps.
 */

declare global {
  // eslint-disable-next-line no-var
  var __sessionMutexes: Map<string, Promise<any>> | undefined;
  // eslint-disable-next-line no-var
  var __atomicSessionAnswers: Map<string, Map<string, any>> | undefined;
  // eslint-disable-next-line no-var
  var __atomicSessionReady: Map<string, Map<string, any>> | undefined;
}

if (!globalThis.__sessionMutexes) {
  globalThis.__sessionMutexes = new Map<string, Promise<any>>();
}

if (!globalThis.__atomicSessionAnswers) {
  globalThis.__atomicSessionAnswers = new Map<string, Map<string, any>>();
}

if (!globalThis.__atomicSessionReady) {
  globalThis.__atomicSessionReady = new Map<string, Map<string, any>>();
}

/**
 * Execute an async operation with a serialized mutex lock scoped to a session ID.
 * Guarantees that concurrent requests for the same session are queued and executed one after another.
 */
export async function withSessionLock<T>(sessionId: string, fn: () => Promise<T>): Promise<T> {
  const currentLock = globalThis.__sessionMutexes!.get(sessionId) || Promise.resolve();

  let releaseLock: () => void;
  const newLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  // Chain the next lock onto the queue
  globalThis.__sessionMutexes!.set(sessionId, currentLock.then(() => newLock));

  try {
    await currentLock;
    return await fn();
  } finally {
    releaseLock!();
  }
}

/**
 * Key all student answers strictly by `${slideId}_${playerId}` (and `${slideIndex}_${playerId}`)
 * inside a dictionary/Map structure so 60 students submitting within the exact same 50ms window
 * NEVER overwrite each other's responses.
 */
export function getAtomicAnswers(sessionId: string): Map<string, any> {
  let store = globalThis.__atomicSessionAnswers!.get(sessionId);
  if (!store) {
    store = new Map<string, any>();
    globalThis.__atomicSessionAnswers!.set(sessionId, store);
  }
  return store;
}

/**
 * Key all ready student states strictly by `playerId`.
 */
export function getAtomicReadyPlayers(sessionId: string): Map<string, any> {
  let store = globalThis.__atomicSessionReady!.get(sessionId);
  if (!store) {
    store = new Map<string, any>();
    globalThis.__atomicSessionReady!.set(sessionId, store);
  }
  return store;
}

/**
 * Clear memory for completed sessions.
 */
export function cleanupSessionStore(sessionId: string): void {
  globalThis.__sessionMutexes?.delete(sessionId);
  globalThis.__atomicSessionAnswers?.delete(sessionId);
  globalThis.__atomicSessionReady?.delete(sessionId);
}

