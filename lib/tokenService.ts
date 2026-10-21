import crypto from "crypto";
import { Role, normalizeRole } from "./rbac";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  "pgtsc-institutional-erp-secure-session-key-2026-ptsc-gov-bd";

export const SESSION_COOKIE_NAME = "pgtsc_auth_token";
export const INTERNAL_SECRET_HEADER = "x-internal-secret";
export const INTERNAL_SERVICE_KEY =
  process.env.INTERNAL_SERVICE_KEY || "pgtsc-internal-service-token-2026";

export interface SessionTokenPayload {
  userId: string | number;
  userRole: Role;
  userName?: string;
  userEmail?: string;
  iat?: number;
  exp?: number;
}

/**
 * Signs a tamper-proof session token with HMAC-SHA256
 */
export function signSessionToken(
  payload: { userId: string | number; userRole: Role; userName?: string; userEmail?: string },
  expiresInSeconds = 86400 * 30 // 30 days
): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const fullPayload: SessionTokenPayload = {
    ...payload,
    userRole: normalizeRole(payload.userRole),
    iat,
    exp,
  };

  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

/**
 * Validates a signed session token. Returns parsed payload if authentic, null if forged or expired.
 */
export function verifySessionToken(token?: string | null): SessionTokenPayload | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.trim().split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(encodedPayload)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8")
    ) as SessionTokenPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return {
      ...payload,
      userRole: normalizeRole(payload.userRole),
    };
  } catch {
    return null;
  }
}

export {
  hashPassword,
  verifyPassword,
  createPasswordResetToken,
  verifyPasswordResetToken,
  consumePasswordResetToken,
  updateUserPassword,
} from "./passwordService";
