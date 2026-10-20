import { NextResponse } from "next/server";
import { sanitizeErrorMessage } from "./utils";

export interface ApiPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  [key: string]: any;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: any;
}

export interface ApiSuccessPayload<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: ApiPaginationMeta;
  timestamp: string;
  [key: string]: any;
}

export interface ApiErrorPayload {
  success: false;
  error: ApiErrorDetail | string;
  message: string;
  code: string;
  details?: any;
  status: number;
  timestamp: string;
  [key: string]: any;
}

export interface ApiSuccessOptions {
  message?: string;
  status?: number;
  meta?: ApiPaginationMeta;
  extraKeys?: Record<string, any>;
  headers?: HeadersInit;
}

export interface ApiErrorOptions {
  fallbackMessage?: string;
  status?: number;
  code?: string;
  details?: any;
  extraKeys?: Record<string, any>;
  headers?: HeadersInit;
}

/**
 * Creates a standardized success response for Next.js App Router API endpoints.
 * Automatically preserves legacy top-level keys passed in `extraKeys` so existing
 * frontend callers are 100% backward-compatible.
 */
export function apiSuccess<T = any>(
  data: T,
  options: ApiSuccessOptions = {}
): NextResponse {
  const {
    message,
    status = 200,
    meta,
    extraKeys = {},
    headers = {},
  } = options;

  const payload: ApiSuccessPayload<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(meta ? { meta } : {}),
    timestamp: new Date().toISOString(),
    ...extraKeys,
  };

  return NextResponse.json(payload, { status, headers });
}

/**
 * Creates a standardized error response for Next.js App Router API endpoints.
 * Sanitizes stack traces, masks internal database URLs, logs errors securely
 * on the server, and provides structured error objects.
 */
export function apiError(
  error: unknown,
  options: ApiErrorOptions = {}
): NextResponse {
  const {
    fallbackMessage = "একটি অভ্যন্তরীণ সার্ভার সমস্যা হয়েছে (Internal server error)",
    details,
    extraKeys = {},
    headers = {},
  } = options;

  let inferredStatus = options.status || 500;
  let inferredCode = options.code || "INTERNAL_SERVER_ERROR";

  const rawMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : String(error || "");

  // Prisma & Known Database Error Code Inferences
  if (rawMessage.includes("P2002") || rawMessage.includes("Unique constraint")) {
    inferredStatus = options.status || 409;
    inferredCode = options.code || "RESOURCE_CONFLICT";
  } else if (rawMessage.includes("P2025") || rawMessage.includes("not found")) {
    inferredStatus = options.status || 404;
    inferredCode = options.code || "NOT_FOUND";
  } else if (rawMessage.includes("P2003") || rawMessage.includes("Foreign key")) {
    inferredStatus = options.status || 400;
    inferredCode = options.code || "FOREIGN_KEY_RESTRICTION";
  } else if (rawMessage.includes("P1001") || rawMessage.includes("ECONNREFUSED") || rawMessage.includes("ETIMEDOUT")) {
    inferredStatus = options.status || 503;
    inferredCode = options.code || "DATABASE_UNAVAILABLE";
  } else if (rawMessage.includes("Unauthorized") || rawMessage.includes("অনুমোদন নেই")) {
    inferredStatus = options.status || 401;
    inferredCode = options.code || "UNAUTHORIZED";
  } else if (rawMessage.includes("Forbidden") || rawMessage.includes("অনুমতি নেই")) {
    inferredStatus = options.status || 403;
    inferredCode = options.code || "FORBIDDEN";
  } else if (rawMessage.includes("Validation") || rawMessage.includes("Invalid")) {
    inferredStatus = options.status || 400;
    inferredCode = options.code || "VALIDATION_FAILED";
  }

  const sanitizedMessage = sanitizeErrorMessage(error, fallbackMessage);

  // Secure server logging
  if (inferredStatus >= 500) {
    console.error(`[API Server Error] [${inferredCode}] [${inferredStatus}]:`, error);
  } else {
    console.warn(`[API Client Error] [${inferredCode}] [${inferredStatus}]:`, sanitizedMessage);
  }

  const payload: ApiErrorPayload = {
    success: false,
    error: {
      code: inferredCode,
      message: sanitizedMessage,
      ...(details ? { details } : {}),
    },
    message: sanitizedMessage,
    code: inferredCode,
    ...(details ? { details } : {}),
    status: inferredStatus,
    timestamp: new Date().toISOString(),
    ...extraKeys,
  };

  return NextResponse.json(payload, { status: inferredStatus, headers });
}

/**
 * Higher-order wrapper for API route handlers that catches any unhandled
 * exceptions and returns a structured apiError response.
 */
export function withApiHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse | Response>
) {
  return async (req: Request, context?: any): Promise<NextResponse | Response> => {
    try {
      return await handler(req, context);
    } catch (err: unknown) {
      return apiError(err, {
        fallbackMessage: "অনাকাঙ্ক্ষিত অনুরোধ প্রক্রিয়াকরণ ত্রুটি (Unexpected API request failure)",
        status: 500,
        code: "UNHANDLED_EXCEPTION",
      });
    }
  };
}
