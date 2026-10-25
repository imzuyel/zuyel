import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { PresenceService, SecurityService } from "@/lib/reconnectService";

/**
 * Ultra-Lightweight Heartbeat Endpoint
 *
 * Called by every student and host roughly every 2.5 seconds during live quizzes.
 *
 * Architectural & High-Concurrency Principles:
 * 1. Zero Database Operations (Strict In-Memory Execution):
 *    No Prisma or MySQL queries are performed on this path. Ephemeral presence
 *    (lastSeenAt, connectionStatus) is managed purely in the high-speed in-memory
 *    store. Persisting heartbeats directly to MySQL causes immediate connection
 *    pool exhaustion during live sessions with 50-100+ concurrent students.
 *
 * 2. Multi-Method Support (GET & POST):
 *    Supports both POST with JSON body and fast GET pings with query parameters.
 *
 * 3. Throttled Presence Sweeps:
 *    Global timeout reconciliation is throttled to execute at most once every 2s
 *    across all incoming requests, eliminating O(n^2) CPU loops.
 *
 * 4. On-Demand Presence Aggregation:
 *    Presence count calculations are skipped for regular student pings and only
 *    computed when requested by the host (or when `?counts=1` is set).
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PRESENCE_SWEEP_INTERVAL_MS = 2_000;
const HEARTBEAT_LIMIT_PER_MINUTE = 60;
const MAX_BODY_BYTES = 2_048;
const MAX_ID_LENGTH = 128;

type HeartbeatPayload = {
  playerId?: string;
  role?: string;
  connectionId?: string;
};

type PresenceCounts = {
  online: number;
  reconnecting: number;
  disconnected: number;
};

const heartbeatRuntime = globalThis as typeof globalThis & {
  __ptscLastPresenceSweepAt?: number;
};

/**
 * Globally throttled presence sweep.
 */
function maybeProcessPresenceTimeouts(now: number): void {
  const lastSweep = heartbeatRuntime.__ptscLastPresenceSweepAt ?? 0;
  if (now - lastSweep < PRESENCE_SWEEP_INTERVAL_MS) return;

  heartbeatRuntime.__ptscLastPresenceSweepAt = now;
  PresenceService.processPresenceTimeouts();
}

/**
 * Single-pass session presence counting (only computed for host or when requested).
 */
function countSessionPresence(sessionId: string): PresenceCounts {
  let online = 0;
  let reconnecting = 0;
  let disconnected = 0;
  const participants = institutionalDb.liveParticipants;

  for (let i = 0; i < participants.length; i += 1) {
    const participant = participants[i];
    if (participant.sessionId !== sessionId) continue;

    if (participant.status === "LEFT" || participant.connectionStatus === "left") {
      disconnected += 1;
      continue;
    }

    if (participant.status !== "JOINED") continue;

    if (participant.connectionStatus === "online") {
      online += 1;
    } else if (
      participant.connectionStatus === "disconnected" ||
      participant.connectionStatus === "reconnecting"
    ) {
      reconnecting += 1;
    }
  }

  return { online, reconnecting, disconnected };
}

function jsonResponse(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}

function isSafeId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_ID_LENGTH
  );
}

/**
 * Common handler for processing lightweight heartbeats
 */
async function processHeartbeat(
  req: NextRequest,
  sessionId: string,
  payload: HeartbeatPayload
) {
  const { playerId, role, connectionId } = payload;
  const isHost = role === "host";

  if (!isHost && !isSafeId(playerId)) {
    return jsonResponse(
      { success: false, message: "A valid playerId is required" },
      400
    );
  }

  if (
    connectionId !== undefined &&
    (typeof connectionId !== "string" || connectionId.length > MAX_ID_LENGTH)
  ) {
    return jsonResponse(
      { success: false, message: "Invalid connectionId" },
      400
    );
  }

  // Rate limiter keyed by sessionId and playerId (prevents NAT-gateway collisions)
  const limiterKey = `hb:${sessionId}:${isHost ? "host" : playerId}`;
  if (
    SecurityService.isRateLimited(
      limiterKey,
      HEARTBEAT_LIMIT_PER_MINUTE,
      60_000
    )
  ) {
    return jsonResponse(
      { success: false, message: "Too many heartbeats" },
      429
    );
  }

  const now = Date.now();
  maybeProcessPresenceTimeouts(now);

  // In-memory update - zero database connection used
  const updated = isHost
    ? PresenceService.updateHostHeartbeat(sessionId, connectionId)
    : PresenceService.updateHeartbeat(sessionId, playerId!, connectionId);

  if (!updated) {
    return jsonResponse(
      { success: false, message: "Session or player not found" },
      404
    );
  }

  const wantsCounts =
    isHost || req.nextUrl.searchParams.get("counts") === "1";

  return jsonResponse({
    success: true,
    timestamp: new Date(now).toISOString(),
    ...(wantsCounts ? { counts: countSessionPresence(sessionId) } : null),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    // Fast-path: check if query parameters provide playerId (skips JSON parsing)
    const urlPlayerId = req.nextUrl.searchParams.get("playerId") || undefined;
    const urlRole = req.nextUrl.searchParams.get("role") || undefined;
    const urlConnectionId = req.nextUrl.searchParams.get("connectionId") || undefined;

    let payload: HeartbeatPayload = {
      playerId: urlPlayerId,
      role: urlRole,
      connectionId: urlConnectionId,
    };

    if (!payload.playerId && payload.role !== "host") {
      const contentLength = Number(req.headers.get("content-length") || "0");
      if (contentLength > MAX_BODY_BYTES) {
        return jsonResponse({ success: false, message: "Payload too large" }, 413);
      }

      try {
        const body = (await req.json()) as HeartbeatPayload;
        payload = {
          playerId: body.playerId || payload.playerId,
          role: body.role || payload.role,
          connectionId: body.connectionId || payload.connectionId,
        };
      } catch {
        // Empty or non-JSON body falls back to validation
      }
    }

    return await processHeartbeat(req, sessionId, payload);
  } catch (error: unknown) {
    const message =
      process.env.NODE_ENV === "production"
        ? "Failed to process heartbeat"
        : error instanceof Error
          ? error.message
          : "Failed to process heartbeat";

    return jsonResponse({ success: false, message }, 500);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    const payload: HeartbeatPayload = {
      playerId: req.nextUrl.searchParams.get("playerId") || undefined,
      role: req.nextUrl.searchParams.get("role") || undefined,
      connectionId: req.nextUrl.searchParams.get("connectionId") || undefined,
    };

    return await processHeartbeat(req, sessionId, payload);
  } catch (error: unknown) {
    const message =
      process.env.NODE_ENV === "production"
        ? "Failed to process heartbeat"
        : error instanceof Error
          ? error.message
          : "Failed to process heartbeat";

    return jsonResponse({ success: false, message }, 500);
  }
}
