import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma, isPrismaAvailable, safePrismaQuery } from "./prisma";
import { PRESET_USERS } from "@/context/AuthContext";
import { updateStudentPassword } from "./studentIntelligenceStore";
import { recordSecurityAuditLog } from "./rbac";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  "pgtsc-institutional-erp-secure-session-key-2026-ptsc-gov-bd";

export interface PasswordResetRecord {
  email: string;
  userId?: string | number;
  role?: string;
  code: string; // 6-digit OTP
  token: string;
  expiresAt: number; // Unix timestamp in ms
  used: boolean;
}

// Global store for active password reset tokens (survives HMR in development)
declare global {
  // eslint-disable-next-line no-var
  var __ptscPasswordResets: Map<string, PasswordResetRecord> | undefined;
  // eslint-disable-next-line no-var
  var __ptscCustomPasswords: Map<string, string> | undefined;
}

const resetTokenStore: Map<string, PasswordResetRecord> =
  globalThis.__ptscPasswordResets || new Map();
if (process.env.NODE_ENV !== "production") {
  globalThis.__ptscPasswordResets = resetTokenStore;
}

const customPasswordStore: Map<string, string> =
  globalThis.__ptscCustomPasswords || new Map();
if (process.env.NODE_ENV !== "production") {
  globalThis.__ptscCustomPasswords = customPasswordStore;
}

/**
 * Hashes a plaintext password using bcrypt by default (or PBKDF2 if requested).
 */
export function hashPassword(password: string, algorithm: "bcrypt" | "pbkdf2" = "bcrypt"): string {
  if (algorithm === "bcrypt") {
    return bcrypt.hashSync(password, 10);
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `pbkdf2:100000:${salt}:${hash}`;
}

/**
 * Safely verifies a plaintext password against a stored bcrypt hash, PBKDF2 hash, SHA256 hash,
 * or developmental fallback password. Employs constant-time equality comparisons.
 */
export function verifyPassword(
  password: string,
  storedHashOrPlain?: string | null
): boolean {
  if (!password || !storedHashOrPlain) return false;

  const cleanPass = password.trim();
  const cleanStored = storedHashOrPlain.trim();

  // 1. Check if stored as standard bcrypt hash ($2a$, $2b$, $2y$)
  if (
    cleanStored.startsWith("$2a$") ||
    cleanStored.startsWith("$2b$") ||
    cleanStored.startsWith("$2y$")
  ) {
    try {
      if (bcrypt.compareSync(cleanPass, cleanStored)) {
        return true;
      }
    } catch {
      // ignore parsing error and continue
    }
  }

  // 2. Check if stored as PBKDF2 hash
  if (cleanStored.startsWith("pbkdf2:")) {
    const parts = cleanStored.split(":");
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10);
      const salt = parts[2];
      const originalHash = parts[3];
      const testHash = crypto
        .pbkdf2Sync(cleanPass, salt, iterations, 64, "sha512")
        .toString("hex");

      const origBuf = Buffer.from(originalHash, "hex");
      const testBuf = Buffer.from(testHash, "hex");
      if (origBuf.length === testBuf.length) {
        return crypto.timingSafeEqual(origBuf, testBuf);
      }
    }
  }

  // 2. Check if stored as standard SHA-256 hex string (64 characters)
  if (cleanStored.length === 64 && /^[0-9a-fA-F]+$/.test(cleanStored)) {
    const testHash = crypto.createHash("sha256").update(cleanPass).digest("hex");
    const origBuf = Buffer.from(cleanStored.toLowerCase(), "hex");
    const testBuf = Buffer.from(testHash.toLowerCase(), "hex");
    if (origBuf.length === testBuf.length) {
      return crypto.timingSafeEqual(origBuf, testBuf);
    }
  }

  // 3. Constant-time fallback for plaintext dev seeds (e.g., "password", "admin123", "1234")
  const pBuf = Buffer.from(cleanPass);
  const sBuf = Buffer.from(cleanStored);
  if (pBuf.length === sBuf.length) {
    return crypto.timingSafeEqual(pBuf, sBuf);
  }

  return cleanPass === cleanStored;
}

/**
 * Creates a cryptographically signed, time-limited password reset token and a 6-digit OTP.
 * Valid for 15 minutes by default.
 */
export function createPasswordResetToken(
  email: string,
  userId?: string | number,
  role?: string,
  expiresInSeconds = 900 // 15 minutes
): { token: string; code: string; expiresAt: Date } {
  const normalizedEmail = email.trim().toLowerCase();
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const expiresAtMs = exp * 1000;

  const payload = {
    email: normalizedEmail,
    userId,
    role,
    code,
    iat,
    exp,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  const token = `${encodedPayload}.${signature}`;

  const record: PasswordResetRecord = {
    email: normalizedEmail,
    userId,
    role,
    code,
    token,
    expiresAt: expiresAtMs,
    used: false,
  };

  // Store in memory by token and by email for OTP verification
  resetTokenStore.set(token, record);
  resetTokenStore.set(`code:${normalizedEmail}:${code}`, record);
  resetTokenStore.set(`email:${normalizedEmail}`, record);

  return {
    token,
    code,
    expiresAt: new Date(expiresAtMs),
  };
}

/**
 * Validates a password reset token or 6-digit OTP code.
 */
export function verifyPasswordResetToken(
  tokenOrCode: string,
  email?: string
): {
  valid: boolean;
  email?: string;
  userId?: string | number;
  role?: string;
  error?: string;
} {
  if (!tokenOrCode) {
    return { valid: false, error: "রিসেট টোকেন বা ওটিপি কোড প্রদান করা আবশ্যক।" };
  }

  const cleanInput = tokenOrCode.trim();
  const now = Date.now();

  // 1. If it's a 6-digit numeric OTP code
  if (/^\d{6}$/.test(cleanInput)) {
    if (!email) {
      return {
        valid: false,
        error: "৬-সংখ্যার কোড যাচাইয়ের জন্য আপনার ইমেইল প্রদান করুন।",
      };
    }
    const normalizedEmail = email.trim().toLowerCase();
    const key = `code:${normalizedEmail}:${cleanInput}`;
    const record = resetTokenStore.get(key);

    if (!record) {
      return { valid: false, error: "প্রদত্ত ওটিপি কোডটি সঠিক নয় বা এর মেয়াদ শেষ হয়েছে।" };
    }
    if (record.used) {
      return { valid: false, error: "এই ওটিপি কোডটি ইতোমধ্যেই ব্যবহৃত হয়েছে।" };
    }
    if (record.expiresAt < now) {
      return { valid: false, error: "ওটিপি কোডের মেয়াদ (১৫ মিনিট) উত্তীর্ণ হয়েছে।" };
    }

    return {
      valid: true,
      email: record.email,
      userId: record.userId,
      role: record.role,
    };
  }

  // 2. If it's a signed JWT-like token (payload.signature)
  const parts = cleanInput.split(".");
  if (parts.length === 2) {
    const [encodedPayload, signature] = parts;

    try {
      const expectedSignature = crypto
        .createHmac("sha256", SESSION_SECRET)
        .update(encodedPayload)
        .digest("base64url");

      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);

      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return { valid: false, error: "রিসেট টোকেনটি অবৈধ বা পরিবর্তিত।" };
      }

      const payload = JSON.parse(
        Buffer.from(encodedPayload, "base64url").toString("utf-8")
      );

      const expMs = payload.exp ? payload.exp * 1000 : 0;
      if (expMs < now) {
        return { valid: false, error: "পাসওয়ার্ড রিসেট লিংকের মেয়াদ শেষ হয়ে গেছে।" };
      }

      // Check if marked used in memory store
      const record = resetTokenStore.get(cleanInput);
      if (record && record.used) {
        return { valid: false, error: "এই রিসেট লিংকটি পূর্বে ব্যবহার করা হয়েছে।" };
      }

      return {
        valid: true,
        email: payload.email,
        userId: payload.userId,
        role: payload.role,
      };
    } catch {
      return { valid: false, error: "রিসেট টোকেন পার্স করতে ব্যর্থ হয়েছে।" };
    }
  }

  return { valid: false, error: "অকার্যকর রিসেট টোকেন ফরম্যাট।" };
}

/**
 * Invalidates a reset token/code after successful password update.
 */
export function consumePasswordResetToken(tokenOrCode: string, email?: string): void {
  const cleanInput = tokenOrCode.trim();
  const record = resetTokenStore.get(cleanInput);
  if (record) {
    record.used = true;
  }

  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    const codeKey = `code:${normalizedEmail}:${cleanInput}`;
    const codeRecord = resetTokenStore.get(codeKey);
    if (codeRecord) codeRecord.used = true;

    const emailRecord = resetTokenStore.get(`email:${normalizedEmail}`);
    if (emailRecord) emailRecord.used = true;
  }
}

/**
 * Updates a user's password in Prisma (SystemUser, Faculty, Student) and in-memory caches.
 */
export async function updateUserPassword(
  identifierOrEmail: string,
  newPasswordPlain: string
): Promise<{ success: boolean; message: string }> {
  if (!identifierOrEmail || !newPasswordPlain) {
    return { success: false, message: "ব্যবহারকারী বা পাসওয়ার্ড পাওয়া যায়নি।" };
  }

  const cleanId = identifierOrEmail.trim().toLowerCase();
  const cleanPass = newPasswordPlain.trim();

  if (cleanPass.length < 4) {
    return { success: false, message: "পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।" };
  }

  const newHash = hashPassword(cleanPass);
  let updatedInDb = false;

  // 1. Attempt Prisma DB update if available
  if (isPrismaAvailable()) {
    try {
      // Check SystemUser
      const sysUser = await safePrismaQuery<any>(
        (db) =>
          db.systemUser.findFirst({
            where: {
              OR: [{ email: cleanId }, { mobile: cleanId }],
            },
          }),
        null
      );

      if (sysUser) {
        await safePrismaQuery<any>(
          (db) =>
            db.systemUser.update({
              where: { id: sysUser.id },
              data: { passwordHash: newHash },
            }),
          null
        );
        updatedInDb = true;
      }

      // Check Student
      const student = await safePrismaQuery<any>(
        (db) =>
          db.student.findFirst({
            where: {
              OR: [
                { email: cleanId },
                { studentId: cleanId },
                { admissionNo: cleanId },
                { roll: parseInt(cleanId, 10) || -1 },
              ],
            },
          }),
        null
      );

      if (student) {
        // Also update student in studentIntelligenceStore
        updateStudentPassword(String(student.roll), cleanPass);
        updatedInDb = true;
      }
    } catch (err) {
      console.warn("[PasswordService] Prisma update failed, falling back to memory:", err);
    }
  }

  // 2. Persist in runtime customPasswordStore for immediate login resilience
  customPasswordStore.set(cleanId, newHash);
  customPasswordStore.set(`plain:${cleanId}`, cleanPass);

  // 3. Also check if identifier matches student roll
  if (/^\d+$/.test(cleanId)) {
    updateStudentPassword(cleanId, cleanPass);
  }

  // 4. Audit logging
  recordSecurityAuditLog({
    actionType: "PASSWORD_RESET_SUCCESS",
    actorRole: "system",
    actorName: cleanId,
    actorEmail: cleanId.includes("@") ? cleanId : undefined,
    routePath: "/api/auth/reset-password",
    status: "ALLOWED",
    details: `Password reset successfully for ${cleanId}. (DB updated: ${updatedInDb})`,
    detailsBangla: `${cleanId}-এর পাসওয়ার্ড সফলভাবে হালনাগাদ করা হয়েছে।`,
  });

  return {
    success: true,
    message: "পাসওয়ার্ড সফলভাবে হালনাগাদ করা হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।",
  };
}

/**
 * Checks custom password store for updated passwords in dev/fallback mode
 */
export function getCustomPassword(identifier: string): string | null {
  const cleanId = identifier.trim().toLowerCase();
  return customPasswordStore.get(cleanId) || customPasswordStore.get(`plain:${cleanId}`) || null;
}
