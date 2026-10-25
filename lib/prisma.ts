/**
 * Hybrid Database Client for Panchagarh Government Technical School & College (PTSC)
 *
 * Supports production MySQL database via Prisma ORM when DATABASE_URL is configured,
 * while providing a 100% resilient fallback for preview mode so that no external
 * database server is required to test or run the application.
 *
 * Connection pooling & Singleton Pattern
 * --------------------------------------
 * In Next.js App Router (especially in development with Hot Module Replacement / HMR),
 * modules can be re-evaluated repeatedly. Each un-cached `new PrismaClient()` instantiates
 * an entirely separate connection pool. In a classroom live quiz scenario with 50-100+
 * students, duplicate clients quickly exhaust MySQL's `max_connections` (default 100-151),
 * leading to `P2024: Timed out fetching a connection from the pool` or `ER_CON_COUNT_ERROR`.
 *
 * Connection Pooling Recommendations:
 * 1. MySQL DATABASE_URL Query Parameters:
 *    Add the following parameters to your DATABASE_URL in .env:
 *      mysql://user:password@host:3306/pts_db?connection_limit=10&pool_timeout=20&connect_timeout=10
 *    - `connection_limit`: Max active connections per Prisma instance (e.g. 5 in dev, 10 in prod).
 *    - `pool_timeout`: Seconds Prisma waits for an available pool connection before throwing P2024 (recommend 20).
 *    - `connect_timeout`: Seconds Prisma waits to establish initial TCP socket with MySQL (recommend 10).
 *
 * 2. MySQL Server max_connections:
 *    Formula: `app_instances * connection_limit < mysql_max_connections - 15`
 *    (Leaving 15 reserved connections for DBA, migrations, and health checks).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

// Global type augmentation for singleton pattern across Next.js HMR reloads
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaLike | undefined;
  // eslint-disable-next-line no-var
  var prismaGlobalInstance: PrismaLike | undefined;
  // eslint-disable-next-line no-var
  var prismaOperational: boolean | undefined;
  // eslint-disable-next-line no-var
  var prismaFailureAt: number | undefined;
  // eslint-disable-next-line no-var
  var __ptscPrismaShutdownHookRegistered: boolean | undefined;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaLike;
  prismaGlobalInstance?: PrismaLike;
  prismaOperational?: boolean;
  prismaFailureAt?: number;
  __ptscPrismaShutdownHookRegistered?: boolean;
};

const rawDbUrl = process.env.DATABASE_URL?.trim();

export const hasDatabaseUrl = Boolean(
  rawDbUrl &&
    rawDbUrl.trim() !== "" &&
    !rawDbUrl.toLowerCase().includes("placeholder") &&
    !rawDbUrl.toLowerCase().includes("dummy")
);

const DEFAULT_CONNECTION_LIMIT =
  process.env.NODE_ENV === "production" ? "10" : "5";

/**
 * Appends pool parameters without re-serialising the URL (which could alter
 * passwords containing special characters).
 */
export function withPoolParameters(url: string): string {
  if (!/^(mysql|mariadb|postgres|postgresql):\/\//i.test(url)) return url;

  const params: string[] = [];

  if (!/[?&]connection_limit=/i.test(url)) {
    params.push(
      `connection_limit=${process.env.PRISMA_CONNECTION_LIMIT || DEFAULT_CONNECTION_LIMIT}`
    );
  }
  if (!/[?&]pool_timeout=/i.test(url)) {
    params.push(`pool_timeout=${process.env.PRISMA_POOL_TIMEOUT || "20"}`);
  }
  if (!/[?&]connect_timeout=/i.test(url)) {
    params.push(`connect_timeout=${process.env.PRISMA_CONNECT_TIMEOUT || "10"}`);
  }

  if (params.length === 0) return url;

  const separator = url.includes("?")
    ? url.endsWith("?") || url.endsWith("&")
      ? ""
      : "&"
    : "?";

  return `${url}${separator}${params.join("&")}`;
}

const pooledDbUrl = rawDbUrl ? withPoolParameters(rawDbUrl) : undefined;

let prismaClientInstance: PrismaLike = null;
let prismaOperational = false;

// 1. Strict Singleton Lookup: Check global cache first to prevent connection leaks during HMR
const existingInstance = globalForPrisma.prisma || globalForPrisma.prismaGlobalInstance;

if (existingInstance) {
  prismaClientInstance = existingInstance;
  prismaOperational = globalForPrisma.prismaOperational ?? true;
} else if (hasDatabaseUrl) {
  try {
    // Dynamically require @prisma/client if available in node_modules
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("@prisma/client") as {
      PrismaClient: new (options?: Record<string, unknown>) => PrismaLike;
    };

    prismaClientInstance = new PrismaClient({
      datasources: {
        db: {
          url: pooledDbUrl,
        },
      },
      log:
        process.env.NODE_ENV === "development"
          ? ["warn", "error"]
          : ["error"],
      ...(process.env.NODE_ENV === "production"
        ? { errorFormat: "minimal" }
        : {}),
    });

    prismaOperational = true;

    // Cache in globalThis in both development and production
    // (survives HMR in dev and prevents duplicate route chunk instantiations in prod)
    globalForPrisma.prisma = prismaClientInstance;
    globalForPrisma.prismaGlobalInstance = prismaClientInstance;
    globalForPrisma.prismaOperational = true;

    // Gracefully release MySQL connection pool when process terminates or restarts
    if (!globalForPrisma.__ptscPrismaShutdownHookRegistered && typeof process !== "undefined") {
      globalForPrisma.__ptscPrismaShutdownHookRegistered = true;
      const cleanDisconnect = async () => {
        try {
          if (globalForPrisma.prisma?.$disconnect) {
            await globalForPrisma.prisma.$disconnect();
          }
        } catch {
          // Ignore teardown disconnect errors
        }
      };

      process.once("beforeExit", cleanDisconnect);
      process.once("SIGINT", cleanDisconnect);
      process.once("SIGTERM", cleanDisconnect);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      "[Hybrid Database] Prisma client initialized in Preview/Fallback mode (in-memory store active). Reason:",
      message || "PrismaClient not compiled"
    );
    prismaClientInstance = null;
    prismaOperational = false;
  }
}

// Complete mock model delegate for preview / in-memory mode
const modelDelegate = {
  findMany: async () => [],
  findFirst: async () => null,
  findUnique: async () => null,
  findFirstOrThrow: async () => null,
  findUniqueOrThrow: async () => null,
  create: async (d: PrismaLike) => d?.data ?? {},
  createMany: async () => ({ count: 0 }),
  update: async (d: PrismaLike) => d?.data ?? {},
  updateMany: async () => ({ count: 0 }),
  delete: async () => ({}),
  deleteMany: async () => ({ count: 0 }),
  count: async () => 0,
  aggregate: async () => ({}),
  groupBy: async () => [],
  upsert: async (d: PrismaLike) => d?.create ?? {},
};

// Root methods on Prisma client
const rootDelegates: Record<string, PrismaLike> = {
  $transaction: async (arg: PrismaLike) => {
    if (typeof arg === "function") {
      return await arg(mockPrisma);
    }
    if (Array.isArray(arg)) {
      return await Promise.all(arg);
    }
    return [];
  },
  $queryRaw: async () => [],
  $queryRawUnsafe: async () => [],
  $executeRaw: async () => 0,
  $executeRawUnsafe: async () => 0,
  $connect: async () => {},
  $disconnect: async () => {},
  $use: () => {},
  $on: () => {},
  $extends: () => mockPrisma,
};

export const mockPrisma: PrismaLike = new Proxy(rootDelegates, {
  get: (target: PrismaLike, prop: PrismaLike) => {
    if (typeof prop === "string" && prop in target) {
      return target[prop];
    }
    return new Proxy(modelDelegate, {
      get: (modelTarget: PrismaLike, modelProp: PrismaLike) => {
        if (modelProp in modelTarget) {
          return modelTarget[modelProp];
        }
        return async () => [];
      },
    });
  },
});

const DB_RETRY_COOLDOWN_MS = 60_000; // 60s cooldown before retrying an exhausted database

/**
 * Returns true if Prisma client is initialized, DATABASE_URL is configured,
 * and the database is not in an active connection failure cooldown.
 */
export function isPrismaAvailable(): boolean {
  const failedAt = globalForPrisma.prismaFailureAt ?? 0;
  if (failedAt > 0 && Date.now() - failedAt < DB_RETRY_COOLDOWN_MS) {
    return false;
  }
  return prismaOperational && prismaClientInstance !== null;
}

/**
 * Singleton Prisma instance (or mock proxy in preview fallback mode)
 */
export const prisma: PrismaLike = prismaClientInstance || mockPrisma;

function isConnectionFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  return (
    code === "P1001" || // Can't reach database server
    code === "P1002" || // Database server timed out
    code === "P1008" || // Operation timed out
    code === "P1017" || // Server has closed the connection
    code === "P2024" || // Timed out fetching a connection from the pool
    message.includes("Can't reach database server") ||
    message.includes("ECONNREFUSED") ||
    message.includes("Connection refused") ||
    message.includes("ETIMEDOUT") ||
    message.includes("timed out") ||
    message.includes("connection pool")
  );
}

/**
 * Safely executes a query on Prisma with automatic fallback if Prisma is
 * unavailable or if the query throws (e.g. database connection lost, timeout).
 */
export async function safePrismaQuery<T>(
  queryFn: (client: PrismaLike) => Promise<T>,
  fallbackValue: T
): Promise<T> {
  if (!isPrismaAvailable()) {
    return fallbackValue;
  }

  try {
    return await queryFn(prisma);
  } catch (err: unknown) {
    if (isConnectionFailure(err)) {
      // Shared across route bundles so all callers back off together instead
      // of hammering an already-exhausted pool.
      globalForPrisma.prismaFailureAt = Date.now();
    }

    const message = err instanceof Error ? err.message : String(err);
    console.warn("[Prisma SafeQuery] Query failed gracefully:", message);
    return fallbackValue;
  }
}

export default prisma;
