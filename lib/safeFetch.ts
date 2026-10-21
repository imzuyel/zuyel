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
 * and never throws an unhandled promise rejection or uncaught AbortError.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<ApiResponse<T>> {
  const isDev = process.env.NODE_ENV === "development";
  const defaultTimeout = isDev ? 35000 : 20000;

  const {
    timeoutMs = defaultTimeout,
    onUnauthorized,
    onForbidden,
    suppressErrorLogging = false,
    ...fetchOptions
  } = options;

  // If external signal is already aborted, return immediately without network call
  if (options.signal?.aborted) {
    return {
      ok: false,
      success: false,
      status: 499,
      data: null,
      error: "অনুরোধটি বাতিল করা হয়েছে (Request Cancelled)",
      errorCode: "REQUEST_ABORTED",
      message: "অনুরোধটি বাতিল করা হয়েছে (Request Cancelled)",
    };
  }

  const timeoutController = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    try {
      const reason =
        typeof DOMException !== "undefined"
          ? new DOMException(
              `Request timed out — server took longer than ${timeoutMs}ms for ${url}`,
              "TimeoutError"
            )
          : new Error(`Request timed out — server took longer than ${timeoutMs}ms for ${url}`);
      timeoutController.abort(reason);
    } catch {
      // In older runtimes without abort reason support
      timeoutController.abort();
    }
  }, timeoutMs);

  // Safely combine external signal and internal timeout controller
  let signal: AbortSignal;
  let cleanupListeners: (() => void) | null = null;

  if (options.signal) {
    if (typeof AbortSignal.any === "function") {
      try {
        signal = AbortSignal.any([options.signal, timeoutController.signal]);
      } catch {
        signal = timeoutController.signal;
      }
    } else {
      const combinedController = new AbortController();
      const onAbort = () => {
        if (!combinedController.signal.aborted) {
          const reason = options.signal?.reason || timeoutController.signal.reason;
          try {
            combinedController.abort(reason);
          } catch {
            combinedController.abort();
          }
        }
      };

      options.signal.addEventListener("abort", onAbort, { once: true });
      timeoutController.signal.addEventListener("abort", onAbort, { once: true });

      cleanupListeners = () => {
        try {
          options.signal?.removeEventListener("abort", onAbort);
          timeoutController.signal.removeEventListener("abort", onAbort);
        } catch {
          // ignore
        }
      };

      signal = combinedController.signal;
    }
  } else {
    signal = timeoutController.signal;
  }

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal,
    });

    clearTimeout(timeoutId);
    if (cleanupListeners) cleanupListeners();

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
      if (!suppressErrorLogging && process.env.NODE_ENV !== "production") {
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
    if (cleanupListeners) cleanupListeners();

    const isAbort =
      err?.name === "AbortError" ||
      err?.name === "TimeoutError" ||
      err?.code === 20 ||
      err?.message?.includes("aborted") ||
      err?.message?.includes("timeout") ||
      Boolean(signal?.aborted) ||
      timedOut;

    const isExplicitTimeout = timedOut || err?.name === "TimeoutError";

    const errorMessage = isExplicitTimeout
      ? "সার্ভার থেকে সাড়া পেতে বেশি সময় লাগছে (Request Timed Out)"
      : isAbort
      ? "অনুরোধটি বাতিল করা হয়েছে (Request Cancelled)"
      : err?.message || "নেটওয়ার্ক সংযোগ ত্রুটি (Network Connection Error)";

    if (!suppressErrorLogging) {
      if (isAbort) {
        // Abort/timeout is an expected cancellation or slow dev compilation.
        // We log via console.warn only in dev so Next.js Dev Overlay never triggers a fatal red modal.
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[safeFetchJson] Fetch ${isExplicitTimeout ? "timed out" : "aborted"} for ${url}`);
        }
      } else {
        console.error(`[safeFetchJson] Network/Fetch failure for ${url}:`, err);
      }
    }

    return {
      ok: false,
      success: false,
      status: isExplicitTimeout ? 408 : isAbort ? 499 : 0,
      data: null,
      error: errorMessage,
      errorCode: isExplicitTimeout
        ? "REQUEST_TIMEOUT"
        : isAbort
        ? "REQUEST_ABORTED"
        : "NETWORK_ERROR",
      message: errorMessage,
    };
  }
}

export const safeFetch = safeFetchJson;
export default safeFetchJson;
