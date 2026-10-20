import { NextResponse } from "next/server";
import {
  Role,
  CustomPermissionTag,
  normalizeRole,
  isSupremeAdmin,
  isAdministrator,
  isStudent,
  hasCustomPermission,
  recordSecurityAuditLog,
} from "./rbac";

// Mapping from granular key ("quiz:create") → legacy tag ("manage_quizzes")
const GRANULAR_TO_LEGACY: Record<string, CustomPermissionTag> = {
  "attendance:manage": "manage_attendance",
  "attendance:view":   "manage_attendance",
  "marks:edit":        "edit_marks",
  "marks:view":        "edit_marks",
  "quiz:create":       "manage_quizzes",
  "quiz:edit":         "manage_quizzes",
  "quiz:delete":       "manage_quizzes",
  "quiz:publish":      "manage_quizzes",
  "audit:view":        "view_audit_logs",
  "certificate:issue": "issue_certificates",
  "ai:generate":       "generate_ai_questions",
  "ai:chat":           "generate_ai_questions",
  "routine:manage":    "manage_routines",
  "routine:view":      "manage_routines",
  "fee:manage":        "manage_fees",
  "student:manage":    "manage_students",
  "faculty:manage":    "manage_faculty",
  "sms:send":          "send_sms",
  "notice:publish":    "send_sms",
  "permission:manage": "view_audit_logs",
};

export interface RequestIdentity {
  userId: string | number;
  userName: string;
  userRole: Role;
  userEmail?: string;
  ipAddress?: string;
}

export interface AuthGuardOptions {
  /** Legacy CustomPermissionTag check */
  requiredPermission?: CustomPermissionTag;
  /** Granular key check e.g. "quiz:create" */
  requiredPermissionKey?: string;
  /** Multiple granular keys (any one is sufficient) */
  requiredPermissionKeys?: string[];
  /** Require ALL listed keys (default: false = any one) */
  requireAllKeys?: boolean;
  requiredModule?: string;
  allowReadOnlyForStaff?: boolean;
  endpointName?: string;
}

export interface AuthGuardResult {
  authorized: boolean;
  identity: RequestIdentity;
  errorResponse?: NextResponse;
}

// ─────────────────────────────────────────────────────────────────────────────
// Identity extraction
// ─────────────────────────────────────────────────────────────────────────────

export function extractRequestIdentity(req: Request): RequestIdentity {
  const headers = req.headers;

  const headerRole  = headers.get("x-user-role");
  const headerId    = headers.get("x-user-id");
  const headerName  = headers.get("x-user-name");
  const headerEmail = headers.get("x-user-email");
  const ipAddress   =
    headers.get("x-forwarded-for") || headers.get("x-real-ip") || "127.0.0.1";

  let cookieRole: string | null = null;
  let cookieId: string | null   = null;
  let cookieName: string | null = null;

  const cookieHeader = headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce((acc, c) => {
      const [key, val] = c.trim().split("=");
      if (key && val) acc[key] = decodeURIComponent(val);
      return acc;
    }, {} as Record<string, string>);

    cookieRole = cookies["pgtsc_user_role"] || cookies["ptsc_user_role"] || null;
    cookieId   = cookies["pgtsc_user_id"]   || cookies["ptsc_user_id"]   || null;
    cookieName = cookies["pgtsc_user_name"] || cookies["ptsc_user_name"] || null;
  }

  const rawRole       = headerRole || cookieRole || "student";
  const normalizedRole = normalizeRole(rawRole);
  const userId =
    headerId ||
    cookieId ||
    (normalizedRole === "teacher" ? "3" : normalizedRole === "student" ? "4" : "1");
  const userName =
    headerName ||
    cookieName ||
    (normalizedRole === "student"
      ? "Kazi Tanvir Hasan (Student)"
      : normalizedRole === "teacher"
      ? "Engr. Mahmudul Hasan (Teacher)"
      : "Md. Rafiqul Islam (Principal)");

  return { userId, userName, userRole: normalizedRole, userEmail: headerEmail || undefined, ipAddress };
}

// ─────────────────────────────────────────────────────────────────────────────
// Granular permission check (sync – uses in-memory store)
// ─────────────────────────────────────────────────────────────────────────────

function checkGranularKeySync(
  userId: string | number,
  role: Role,
  key: string
): boolean {
  if (isStudent(role)) return false;
  if (isSupremeAdmin(role) || isAdministrator(role)) return true;

  // Map to legacy tag and check in-memory store
  const legacyTag = GRANULAR_TO_LEGACY[key];
  if (legacyTag) {
    return hasCustomPermission(userId, role, legacyTag);
  }

  // View-only permissions are generally allowed for teachers/staff
  if (key.endsWith(":view") && !["audit:view"].includes(key)) {
    return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Authorization Guard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Universal server-side auth guard.
 *
 * Checks (in order):
 * 1. Zero-Trust student exclusion
 * 2. Supreme admin pass-through
 * 3. Administrator pass-through
 * 4. Granular permission key check (new)
 * 5. Legacy CustomPermissionTag check (backward compat)
 */
export function verifyBackendAuthorization(
  req: Request,
  options: AuthGuardOptions = {}
): AuthGuardResult {
  const identity  = extractRequestIdentity(req);
  const routePath = new URL(req.url).pathname;
  const {
    requiredPermission,
    requiredPermissionKey,
    requiredPermissionKeys,
    requireAllKeys = false,
    endpointName = routePath,
  } = options;

  // ── DIRECTIVE 1: Absolute Student Zero-Trust ──────────────────────────────
  if (isStudent(identity.userRole) || String(identity.userId) === "4") {
    recordSecurityAuditLog({
      actionType: "STUDENT_ACCESS_BLOCKED",
      actorRole: "student",
      actorName: identity.userName,
      actorEmail: identity.userEmail,
      routePath,
      ipAddress: identity.ipAddress,
      status: "BLOCKED",
      details: `Student '${identity.userName}' intercepted at protected route: ${endpointName}.`,
      detailsBangla: `শিক্ষার্থী '${identity.userName}' সংরক্ষিত রুট (${endpointName})-এ প্রবেশের চেষ্টায় ৪০৩ প্রতিহত।`,
    });

    return {
      authorized: false,
      identity,
      errorResponse: NextResponse.json(
        {
          success: false,
          status: 403,
          error: "Forbidden",
          code: "STUDENT_ACCESS_DENIED",
          message:
            "শিক্ষার্থীরা প্রশাসনিক ব্যাকএন্ড বা AI মডিউলে প্রবেশের অনুমতিপ্রাপ্ত নয় (Zero-Trust Policy)।",
          timestamp: new Date().toISOString(),
          incidentRef: `SEC-${Date.now().toString(36).toUpperCase()}`,
        },
        { status: 403 }
      ),
    };
  }

  // ── DIRECTIVE 2: Supreme Admin pass-through ───────────────────────────────
  if (isSupremeAdmin(identity.userRole)) {
    return { authorized: true, identity };
  }

  // ── DIRECTIVE 3: System Admin pass-through ────────────────────────────────
  if (isAdministrator(identity.userRole)) {
    return { authorized: true, identity };
  }

  // ── DIRECTIVE 4: Granular key checks ─────────────────────────────────────
  const allRequiredKeys: string[] = [];
  if (requiredPermissionKey)          allRequiredKeys.push(requiredPermissionKey);
  if (requiredPermissionKeys?.length) allRequiredKeys.push(...requiredPermissionKeys);

  if (allRequiredKeys.length > 0) {
    const results = allRequiredKeys.map((key) =>
      checkGranularKeySync(identity.userId, identity.userRole, key)
    );
    const hasClearance = requireAllKeys
      ? results.every(Boolean)
      : results.some(Boolean);

    if (!hasClearance) {
      const failedKey = allRequiredKeys.find(
        (_, i) => !results[i]
      ) || allRequiredKeys[0];

      recordSecurityAuditLog({
        actionType: "CLEARANCE_DENIED",
        actorRole: identity.userRole,
        actorName: identity.userName,
        actorEmail: identity.userEmail,
        permissionTag: failedKey as CustomPermissionTag,
        routePath,
        ipAddress: identity.ipAddress,
        status: "BLOCKED",
        details: `User '${identity.userName}' (${identity.userRole}) lacks '${failedKey}' on ${endpointName}.`,
        detailsBangla: `'${identity.userName}'-এর '${failedKey}' পারমিশন নেই (${endpointName})।`,
      });

      return {
        authorized: false,
        identity,
        errorResponse: NextResponse.json(
          {
            success: false,
            status: 403,
            error: "Forbidden",
            code: "PERMISSION_REQUIRED",
            requiredPermission: failedKey,
            message: `প্রশাসনিক ক্লিয়ারেন্স প্রয়োজন: '${failedKey}' পারমিশন আপনার অ্যাকাউন্টে নেই। অধ্যক্ষ বা অ্যাডমিনের সাথে যোগাযোগ করুন।`,
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        ),
      };
    }
  }

  // ── DIRECTIVE 5: Legacy CustomPermissionTag check ─────────────────────────
  if (requiredPermission) {
    const hasClearance = hasCustomPermission(
      identity.userId,
      identity.userRole,
      requiredPermission
    );

    if (!hasClearance) {
      recordSecurityAuditLog({
        actionType: "CLEARANCE_DENIED",
        actorRole: identity.userRole,
        actorName: identity.userName,
        actorEmail: identity.userEmail,
        permissionTag: requiredPermission,
        routePath,
        ipAddress: identity.ipAddress,
        status: "BLOCKED",
        details: `User '${identity.userName}' (${identity.userRole}) lacks '${requiredPermission}' on ${endpointName}.`,
        detailsBangla: `'${identity.userName}'-এর '${requiredPermission}' পারমিশন নেই।`,
      });

      return {
        authorized: false,
        identity,
        errorResponse: NextResponse.json(
          {
            success: false,
            status: 403,
            error: "Forbidden",
            code: "ADMIN_CLEARANCE_REQUIRED",
            requiredPermission,
            message: `প্রশাসনিক ক্লিয়ারেন্স প্রয়োজন: '${requiredPermission}' পারমিশন আপনার অ্যাকাউন্টে নেই।`,
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        ),
      };
    }
  }

  // ── DIRECTIVE 6: Default allow for validated faculty ──────────────────────
  return { authorized: true, identity };
}
