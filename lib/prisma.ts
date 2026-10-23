/**
 * Hybrid Database Client for Panchagarh Government Technical School & College (PTSC)
 * 
 * Supports production MySQL database via Prisma ORM when DATABASE_URL is configured,
 * while providing a 100% resilient fallback for Google AI Studio live preview mode
 * so that no external database server is required to test or run the application.
 */

// Global type augmentation for singleton pattern across Next.js HMR reloads
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobalInstance: any | undefined;
}

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
  prismaOperational?: boolean;
};

const rawDbUrl = process.env.DATABASE_URL;

export const hasDatabaseUrl = Boolean(
  rawDbUrl &&
  rawDbUrl.trim() !== "" &&
  !rawDbUrl.includes("placeholder") &&
  !rawDbUrl.includes("dummy")
);

let prismaClientInstance: any = null;
let prismaOperational = false;

// Check existing singleton from previous HMR cycle
if (globalForPrisma.prisma) {
  prismaClientInstance = globalForPrisma.prisma;
  prismaOperational = globalForPrisma.prismaOperational ?? true;
} else if (hasDatabaseUrl) {
  try {
    // Dynamically require @prisma/client if available in node_modules
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("@prisma/client");

    prismaClientInstance = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });

    prismaOperational = true;

    // Cache on global in non-production to avoid connection pool exhaustion
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaClientInstance;
      globalForPrisma.prismaOperational = true;
      globalThis.prismaGlobalInstance = prismaClientInstance;
    }
  } catch (error: any) {
    // Preview Mode Graceful Fallback:
    // If Prisma client is not generated or MySQL host is unreachable in preview,
    // we log an informative notice and allow the system to operate via institutionalDb.
    console.warn(
      "[Hybrid Database] Prisma client initialized in Preview/Fallback mode (in-memory store active). Reason:",
      error?.message || "PrismaClient not compiled"
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
  create: async (d: any) => d?.data ?? {},
  createMany: async () => ({ count: 0 }),
  update: async (d: any) => d?.data ?? {},
  updateMany: async () => ({ count: 0 }),
  delete: async () => ({}),
  deleteMany: async () => ({ count: 0 }),
  count: async () => 0,
  aggregate: async () => ({}),
  groupBy: async () => [],
  upsert: async (d: any) => d?.create ?? {},
};

// Root methods on Prisma client
const rootDelegates: Record<string, any> = {
  $transaction: async (arg: any) => {
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

export const mockPrisma: any = new Proxy(rootDelegates, {
  get: (target: any, prop: any) => {
    if (typeof prop === "string" && prop in target) {
      return target[prop];
    }
    return new Proxy(modelDelegate, {
      get: (modelTarget: any, modelProp: any) => {
        if (modelProp in modelTarget) {
          return modelTarget[modelProp];
        }
        return async () => [];
      },
    });
  },
});

let lastDbFailureTime = 0;
const DB_RETRY_COOLDOWN_MS = 60000; // 60 seconds cooldown before attempting reconnect if database is offline

/**
 * Returns true if Prisma client is initialized, DATABASE_URL is configured,
 * and the database is not in an active connection failure cooldown.
 */
export function isPrismaAvailable(): boolean {
  if (lastDbFailureTime > 0 && Date.now() - lastDbFailureTime < DB_RETRY_COOLDOWN_MS) {
    return false;
  }
  return prismaOperational && prismaClientInstance !== null;
}

/**
 * Singleton Prisma instance (or mock proxy in preview fallback mode)
 */
export const prisma = prismaClientInstance || mockPrisma;

/**
 * Safely executes a query on Prisma with automatic fallback if Prisma is
 * unavailable or if the query throws (e.g. database connection lost, timeout).
 */
export async function safePrismaQuery<T>(
  queryFn: (client: any) => Promise<T>,
  fallbackValue: T
): Promise<T> {
  if (!isPrismaAvailable()) {
    return fallbackValue;
  }
  try {
    return await queryFn(prisma);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("Can't reach database server") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("Connection refused") ||
      msg.includes("ETIMEDOUT") ||
      msg.includes("timed out")
    ) {
      lastDbFailureTime = Date.now();
    }
    console.warn("[Prisma SafeQuery] Query failed gracefully:", msg);
    return fallbackValue;
  }
}

export default prisma;
