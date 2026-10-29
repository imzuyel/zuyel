/**
 * Ultra-Fast In-Memory State Cache for Live Quizzes
 * 
 * Provides a 600ms TTL cache in global memory (`globalThis.__liveSessionCache`)
 * so 50-60+ concurrent students polling every 1-1.5s hit memory instead of
 * exhausting the database connection pool.
 */

interface CachedSessionState {
  data: any;
  expiresAt: number;
}

declare global {
  var __liveSessionCache: Record<string, CachedSessionState> | undefined;
}

if (!globalThis.__liveSessionCache) {
  globalThis.__liveSessionCache = {};
}

/**
 * Retrieve cached session state if available and not expired
 */
export function getSessionCache(sessionId: string): any | null {
  if (!globalThis.__liveSessionCache) return null;
  const entry = globalThis.__liveSessionCache[sessionId];
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    delete globalThis.__liveSessionCache[sessionId];
    return null;
  }
  return entry.data;
}

/**
 * Store session state in memory with specified TTL (default 600ms)
 */
export function setSessionCache(sessionId: string, data: any, ttlMs = 600): void {
  if (!globalThis.__liveSessionCache) {
    globalThis.__liveSessionCache = {};
  }
  globalThis.__liveSessionCache[sessionId] = {
    data,
    expiresAt: Date.now() + ttlMs,
  };
}

/**
 * Instantly invalidate cache when host navigates (/next), an answer is submitted (/answers),
 * or ready status is toggled.
 */
export function invalidateSessionCache(sessionId: string): void {
  if (globalThis.__liveSessionCache && globalThis.__liveSessionCache[sessionId]) {
    delete globalThis.__liveSessionCache[sessionId];
  }
}

