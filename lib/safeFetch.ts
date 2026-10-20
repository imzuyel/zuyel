/**
 * Universal Resilient Frontend Fetch Utility for Panchagarh Govt. TSC ERP & LMS
 * 
 * Provides:
 * - Built-in request timeout protection (default 15s)
 * - Automatic HTTP 401/403 interception and event dispatch
 * - Fault-tolerant response parsing (JSON, plain text, empty body)
 * - Dual contract compatibility (`ok`, `success`, `data`, `error`, `message`)
 * - Backward-compatible spread of backend payload keys
 */

export interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number;
  onUnauthorized?: () => void;
  onForbidden?: () => void;
  suppressErrorLogging?: boolean;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  success: boolean;
  status: number;
  data: T | null;
  error?: string;
  errorCode?: string;
  errorDetails?: any;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Universal safe fetch function that guarantees returning a structured response
 * and never throws an unhandled promise rejection.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<ApiResponse<T>> {
  const {
    timeoutMs = 15000,
    onUnauthorized,
    onForbidden,
    suppressErrorLogging = false,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const signal = options.signal || controller.signal;

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal,
    });

    clearTimeout(timeoutId);

    const status = res.status;

    // Handle 401 Unauthorized
    if (status === 401) {
      if (onUnauthorized) {
        onUnauthorized();
      } else if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("pgtsc:unauthorized", { detail: { url, status } })
        );
      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      if (onForbidden) {
        onForbidden();
      } else if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("pgtsc:forbidden", { detail: { url, status } })
        );
      }
    }

    let parsedBody: any = null;
    const contentType = res.headers.get("content-type") || "";

    try {
      const text = await res.text();
      if (text && text.trim().length > 0) {
        if (
          contentType.includes("application/json") ||
          text.trim().startsWith("{") ||
          text.trim().startsWith("[")
        ) {
          parsedBody = JSON.parse(text);
        } else {
          parsedBody = { text };
        }
      }
    } catch (parseErr) {
      if (!suppressErrorLogging) {
        console.warn(`[safeFetchJson] Failed parsing body from ${url}:`, parseErr);
      }
    }

    const isOk = res.ok;
    const bodySuccess = parsedBody?.success !== false;
    const overallSuccess = isOk && bodySuccess;

    // Extract standardized error details if any
    let extractedError: string | undefined = undefined;
    let extractedCode: string | undefined = undefined;
    let extractedDetails: any = undefined;

    if (!overallSuccess) {
      if (parsedBody && typeof parsedBody === "object") {
        if (typeof parsedBody.error === "string") {
          extractedError = parsedBody.error;
        } else if (parsedBody.error && typeof parsedBody.error === "object") {
          extractedError = parsedBody.error.message || parsedBody.error.code;
          extractedCode = parsedBody.error.code;
          extractedDetails = parsedBody.error.details;
        }

        if (!extractedError && parsedBody.message) {
          extractedError = parsedBody.message;
        }

        if (!extractedCode && parsedBody.code) {
          extractedCode = parsedBody.code;
        }
      }

      if (!extractedError) {
        extractedError =
          status === 401
            ? "আপনার সেশনের মেয়াদ শেষ হয়েছে বা লগইন প্রয়োজন (Unauthorized)"
            : status === 403
            ? "আপনার এই কার্য সম্পাদনের অনুমতি নেই (Access Forbidden)"
            : status === 404
            ? "অনুরোধকৃত তথ্য বা সেবা পাওয়া যায়নি (Resource Not Found)"
            : status >= 500
            ? `সার্ভার সমস্যা হয়েছে (Error ${status})`
            : `অনুরোধ ব্যর্থ হয়েছে (Error ${status})`;
      }
    }

    // Prepare unified result combining data and spreading original keys
    const rawData =
      parsedBody && typeof parsedBody === "object"
        ? parsedBody.data !== undefined
          ? parsedBody.data
          : parsedBody
        : parsedBody;

    const result: ApiResponse<T> = {
      ok: isOk,
      success: overallSuccess,
      status,
      data: rawData,
      ...(extractedError ? { error: extractedError } : {}),
      ...(extractedCode ? { errorCode: extractedCode } : {}),
      ...(extractedDetails ? { errorDetails: extractedDetails } : {}),
      ...(parsedBody?.message ? { message: parsedBody.message } : {}),
      ...(parsedBody?.meta ? { meta: parsedBody.meta } : {}),
      // Spread parsed body top-level keys for backward-compatibility
      ...(parsedBody && typeof parsedBody === "object" && !Array.isArray(parsedBody)
        ? parsedBody
        : {}),
    };

    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);

    const isAbort = err?.name === "AbortError";
    const errorMessage = isAbort
      ? "সার্ভার থেকে সাড়া পেতে বেশি সময় লাগছে (Request Timed Out)"
      : err?.message || "নেটওয়ার্ক সংযোগ ত্রুটি (Network Connection Error)";

    if (!suppressErrorLogging) {
      console.error(`[safeFetchJson] Network/Fetch failure for ${url}:`, err);
    }

    return {
      ok: false,
      success: false,
      status: isAbort ? 408 : 0,
      data: null,
      error: errorMessage,
      errorCode: isAbort ? "REQUEST_TIMEOUT" : "NETWORK_ERROR",
      message: errorMessage,
    };
  }
}

export const safeFetch = safeFetchJson;
export default safeFetchJson;
