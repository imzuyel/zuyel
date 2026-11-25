/**
 * Pure Text & HTML Sanitization Utilities
 * Framework-agnostic, server/client-safe (NO "use client" directive and no DOM/browser globals).
 */

/**
 * Sanitizes raw HTML strings to prevent Cross-Site Scripting (XSS) attacks.
 * Strips script tags, iframes, object/embed tags, javascript: URIs, and dangerous on* event attributes.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  let sanitized = String(rawHtml);

  // 1. Remove dangerous script, iframe, object, embed, form tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "");
  sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "");
  sanitized = sanitized.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "");

  // 2. Remove javascript: URIs in href and src
  sanitized = sanitized.replace(/href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, "");

  // 3. Strip all inline on* event handlers (e.g. onerror, onload, onclick, onmouseover)
  sanitized = sanitized.replace(/\son\w+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, "");

  return sanitized;
}

/**
 * Sanitizes plain user input strings (e.g. Word Cloud, Open-Ended Answers, Notices, Player Names)
 * to prevent script injection while preserving legitimate Bangla/English characters.
 */
export function sanitizeUserTextInput(rawText: string, maxLength: number = 500): string {
  if (!rawText) return "";
  let text = String(rawText).trim();

  // Strip HTML tags entirely
  text = text.replace(/<[^>]*>/g, "");

  // Strip control characters
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

  // Truncate to maximum length
  if (text.length > maxLength) {
    text = text.slice(0, maxLength);
  }

  return text.trim();
}
