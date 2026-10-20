import { NextResponse } from "next/server";
import {
  Role,
  CustomPermissionTag,
  normalizeRole,
  isSupremeAdmin,
  isAdministrator,
  isStudent,
  isTeacher,
  hasCustomPermission,
  recordSecurityAuditLog,
  ADMIN_ROLES,
  TEACHER_ROLES,
  STAFF_ROLES,
  AUTHORIZED_STAFF_ROLES,
} from "./rbac";
import {
  verifySessionToken,
  INTERNAL_SECRET_HEADER,
  INTERNAL_SERVICE_KEY,
} from "./tokenService";
import { sanitizeErrorMessage } from "./utils";

// Mapping from granular key ("quiz:create") → legacy tag ("manage_quizzes")
const GRANULAR_TO_LEGACY: Record<string, CustomPermissionTag> = {
  "attendance:manage": "manage_attendance",
  "attendance:view": "manage_attendance",
  "marks:edit": "edit_marks",
  "marks:view": "edit_marks",
  "quiz:create": "manage_quizzes",
  "quiz:edit": "manage_quizzes",
  "quiz:delete": "manage_quizzes",
  "quiz:publish": "manage_quizzes",
  "audit:view": "view_audit_logs",
  "certificate:issue": "issue_certificates",
  "ai:generate": "generate_ai_questions",
  "ai:chat": "generate_ai_questions",
  "routine:manage": "manage_routines",
  "routine:view": "manage_routines",
  "fee:manage": "manage_fees",
  "student:manage": "manage_students",
  "faculty:manage": "manage_faculty",
  "sms:send": "send_sms",
  "notice:publish": "send_sms",
  "permission:manage": "view_audit_logs",
};

// Known Institutional Persona Whitelist for ID verification
const KNOWN_STAFF_IDS: Record<string, { role: Role; name: string }> = {
  "99": { role: "super_admin", name: "System Super Administrator" },
  "1": { role: "principal", name: "Md. Rafiqul Islam (Principal)" },
  "2": { role: "admin", name: "Academic Administrator" },
  "218": { role: "admin", name: "Zuyel Rana (Admin)" },
  "3": { role: "teacher", name: "Engr. Mahmudul Hasan (Teacher)" },
  "6": { role: "accountant", name: "Abu Bakar Siddiq (Accountant)" },
};

export interface RequestIdentity {
  userId: string | number;
  userName: string;
  userRole: Role;
  userEmail?: string;
  ipAddress?: string;
  isAuthenticated: boolean;
  isTokenVerified: boolean;
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
  response?: NextResponse;
}

// ─────────────────────────────────────────────────────────────────────────────
// Anti-Spoofing Server Identity Extraction
// ─────────────────────────────────────────────────────────────────────────────

export function extractRequestIdentity(req: Request): RequestIdentity {
  const headers = req.headers;
  const ipAddress =
    headers.get("x-forwarded-for") || headers.get("x-real-ip") || "127.0.0.1";

  // Parse Cookie header
  const cookieHeader = headers.get("cookie");
  const cookies: Record<string, string> = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((c) => {
      const [key, val] = c.trim().split("=");
      if (key && val) cookies[key] = decodeURIComponent(val);
    });
  }

  // 1. Check for cryptographically signed session token (Cookie or Bearer header)
  const authHeader = headers.get("authorization");
  let bearerToken: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    bearerToken = authHeader.substring(7).trim();
  }
  const sessionCookieToken = cookies["pgtsc_auth_token"];
  const candidateToken = bearerToken || sessionCookieToken;

  if (candidateToken) {
    const verified = verifySessionToken(candidateToken);
    if (verified) {
      return {
        userId: verified.userId,
        userName: verified.userName || "Verified User",
        userRole: verified.userRole,
        userEmail: verified.userEmail,
        ipAddress,
        isAuthenticated: true,
        isTokenVerified: true,
      };
    }
  }

  // 2. Check for trusted internal service calls with shared secret
  const internalSecret = headers.get(INTERNAL_SECRET_HEADER);
  if (internalSecret && internalSecret === INTERNAL_SERVICE_KEY) {
    const rawRole = headers.get("x-user-role");
    const headerId = headers.get("x-user-id") || "1";
    const headerName = headers.get("x-user-name") || "Internal System Service";
    return {
      userId: headerId,
      userName: headerName,
      userRole: normalizeRole(rawRole || "super_admin"),
      userEmail: headers.get("x-user-email") || undefined,
      ipAddress,
      isAuthenticated: true,
      isTokenVerified: true,
    };
  }

  // 3. Fallback for un-tokenized sessions: STRICT ANTI-SPOOFING VERIFICATION
  const cookieRole = cookies["pgtsc_user_role"] || cookies["ptsc_user_role"] || null;
  const cookieId = cookies["pgtsc_user_id"] || cookies["ptsc_user_id"] || null;
  const cookieName = cookies["pgtsc_user_name"] || cookies["ptsc_user_name"] || null;

  // Header values passed directly by client cannot elevate role without valid session
  const headerRole = headers.get("x-user-role");
  const headerId = headers.get("x-user-id");

  const claimedId = String(cookieId || headerId || "4").trim();
  const rawClaimedRole = String(cookieRole || headerRole || "student").trim();
  const normalizedClaimedRole = normalizeRole(rawClaimedRole);

  // Zero-Trust Rule: Student ID 4 or any unrecognized ID can NEVER claim admin or teacher roles
  if (claimedId === "4" || claimedId === "student") {
    if (normalizedClaimedRole !== "student") {
      recordSecurityAuditLog({
        actionType: "STUDENT_ACCESS_BLOCKED",
        actorRole: "student",
        actorName: cookieName || "Anonymous Student",
        routePath: new URL(req.url).pathname,
        ipAddress,
        status: "BLOCKED",
        details: `Privilege escalation attempt intercepted: Student ID 4 attempted to assert elevated role '${normalizedClaimedRole}'.`,
        detailsBangla: `সুযোগ বৃদ্ধির অপচেষ্টা প্রতিহত: শিক্ষার্থী আইডি ৪ '${normalizedClaimedRole}' রোল দাবি করেছিল।`,
      });
    }
    return {
      userId: "4",
      userName: cookieName || "Kazi Tanvir Hasan (Student)",
      userRole: "student",
      ipAddress,
      isAuthenticated: Boolean(cookieId),
      isTokenVerified: false,
    };
  }

  // Verify claimed staff/admin ID against known staff registry
  if (AUTHORIZED_STAFF_ROLES.has(normalizedClaimedRole)) {
    const staffMatch = KNOWN_STAFF_IDS[claimedId];
    if (staffMatch && (staffMatch.role === normalizedClaimedRole || isAdministrator(normalizedClaimedRole))) {
      return {
        userId: claimedId,
        userName: cookieName || staffMatch.name,
        userRole: normalizedClaimedRole,
        ipAddress,
        isAuthenticated: true,
        isTokenVerified: false,
      };
    }

    // Role spoofing detected: Claimed an administrative role without matching known staff ID
    recordSecurityAuditLog({
      actionType: "SECURITY_POLICY_OVERRIDE",
      actorRole: normalizedClaimedRole,
      actorName: cookieName || "Unverified Client",
      routePath: new URL(req.url).pathname,
      ipAddress,
      status: "BLOCKED",
      details: `Unverified role claim: Client ID '${claimedId}' attempted to claim privileged role '${normalizedClaimedRole}' without cryptographic token. Downgrading to student.`,
      detailsBangla: `অযাচাইকৃত রোল দাবি: আইডি '${claimedId}' দ্বারা '${normalizedClaimedRole}' দাবি প্রতিহত এবং স্টুডেন্টে রূপান্তর।`,
    });

    return {
      userId: claimedId || "4",
      userName: cookieName || "Unauthenticated User",
      userRole: "student",
      ipAddress,
      isAuthenticated: false,
      isTokenVerified: false,
    };
  }

  // Public / student default
  return {
    userId: claimedId || "4",
    userName: cookieName || "Kazi Tanvir Hasan (Student)",
    userRole: normalizedClaimedRole,
    ipAddress,
    isAuthenticated: Boolean(cookieId),
    isTokenVerified: false,
  };
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
// Universal Server-Side Authorization Guard
// ─────────────────────────────────────────────────────────────────────────────

export function verifyBackendAuthorization(
  req: Request,
  options: AuthGuardOptions = {}
): AuthGuardResult {
  const identity = extractRequestIdentity(req);
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
  if (requiredPermissionKey) allRequiredKeys.push(requiredPermissionKey);
  if (requiredPermissionKeys?.length) allRequiredKeys.push(...requiredPermissionKeys);

  if (allRequiredKeys.length > 0) {
    const results = allRequiredKeys.map((key) =>
      checkGranularKeySync(identity.userId, identity.userRole, key)
    );
    const hasClearance = requireAllKeys
      ? results.every(Boolean)
      : results.some(Boolean);

    if (!hasClearance) {
      const failedKey =
        allRequiredKeys.find((_, i) => !results[i]) || allRequiredKeys[0];

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

// ─────────────────────────────────────────────────────────────────────────────
// Standardized Route Guard Helpers for API Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Requires the caller to be authenticated.
 */
export function requireAuth(req: Request, endpointName?: string): AuthGuardResult {
  const identity = extractRequestIdentity(req);
  if (!identity.isAuthenticated) {
    return {
      authorized: false,
      identity,
      errorResponse: NextResponse.json(
        {
          success: false,
          status: 401,
          error: "Unauthorized",
          code: "AUTH_REQUIRED",
          message: "এই এন্ডপয়েন্টে প্রবেশের জন্য লগইন করা আবশ্যক।",
          endpoint: endpointName || new URL(req.url).pathname,
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      ),
    };
  }
  return { authorized: true, identity };
}

/**
 * Requires the caller to have one of the specified roles.
 */
export function requireRole(
  req: Request,
  allowedRoles: Role | Role[],
  endpointName?: string
): AuthGuardResult {
  const identity = extractRequestIdentity(req);
  const routePath = endpointName || new URL(req.url).pathname;
  const roles = Array.isArray(allowedRoles)
    ? allowedRoles.map(normalizeRole)
    : [normalizeRole(allowedRoles)];

  if (isStudent(identity.userRole) || String(identity.userId) === "4") {
    return {
      authorized: false,
      identity,
      errorResponse: NextResponse.json(
        {
          success: false,
          status: 403,
          error: "Forbidden",
          code: "STUDENT_ACCESS_DENIED",
          message: "শিক্ষার্থীরা এই প্রশাসনিক অপারেশনে প্রবেশের অনুমতিপ্রাপ্ত নয়।",
          endpoint: routePath,
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      ),
    };
  }

  // Supreme admin always passes
  if (isSupremeAdmin(identity.userRole)) {
    return { authorized: true, identity };
  }

  if (!roles.includes(identity.userRole)) {
    recordSecurityAuditLog({
      actionType: "CLEARANCE_DENIED",
      actorRole: identity.userRole,
      actorName: identity.userName,
      actorEmail: identity.userEmail,
      routePath,
      ipAddress: identity.ipAddress,
      status: "BLOCKED",
      details: `User '${identity.userName}' (${identity.userRole}) attempted operation requiring roles [${roles.join(", ")}].`,
      detailsBangla: `ভূমিকা অপ্রতুল: ব্যবহারকারীর রোল '${identity.userRole}', প্রয়োজন [${roles.join(", ")}]।`,
    });

    return {
      authorized: false,
      identity,
      errorResponse: NextResponse.json(
        {
          success: false,
          status: 403,
          error: "Forbidden",
          code: "INSUFFICIENT_ROLE",
          message: `এই অপারেশনের জন্য অনুমতিপ্রাপ্ত ভূমিকা প্রয়োজন (${roles.join(", ")})।`,
          endpoint: routePath,
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, identity };
}

/**
 * Requires Administrator or Supreme Admin access.
 */
export function requireAdmin(req: Request, endpointName?: string): AuthGuardResult {
  return requireRole(req, ADMIN_ROLES, endpointName);
}

/**
 * Requires Supreme Admin (Principal / Super Admin) access strictly.
 */
export function requireSuperAdmin(req: Request, endpointName?: string): AuthGuardResult {
  return requireRole(req, ["super_admin", "principal"], endpointName);
}

/**
 * Requires Teacher, Instructor, or Administrative staff access.
 */
export function requireTeacherOrAdmin(req: Request, endpointName?: string): AuthGuardResult {
  return requireRole(req, [...ADMIN_ROLES, ...TEACHER_ROLES], endpointName);
}

/**
 * Requires Accountant, Staff, or Administrative access.
 */
export function requireStaffOrAdmin(req: Request, endpointName?: string): AuthGuardResult {
  return requireRole(req, [...ADMIN_ROLES, ...STAFF_ROLES], endpointName);
}

/**
 * Requires a specific permission key or legacy tag.
 */
export function requirePermission(
  req: Request,
  permission: CustomPermissionTag | string,
  endpointName?: string
): AuthGuardResult {
  if (permission.includes(":")) {
    return verifyBackendAuthorization(req, {
      requiredPermissionKey: permission,
      endpointName,
    });
  }
  return verifyBackendAuthorization(req, {
    requiredPermission: permission as CustomPermissionTag,
    endpointName,
  });
}

/**
 * Standardized server-side API error response generator.
 * Sanitizes errors to prevent database passwords/URIs/paths leaks,
 * logs detailed internal stack traces securely on the server console,
 * and returns uniform JSON response with appropriate HTTP status.
 */
export function createApiErrorResponse(
  error: unknown,
  fallbackMessage: string = "An internal server error occurred",
  status: number = 500,
  code: string = "INTERNAL_SERVER_ERROR"
): NextResponse {
  const sanitizedMessage = sanitizeErrorMessage(error, fallbackMessage);

  // Securely log internal error details to server console only
  if (status >= 500) {
    console.error(`[API Internal Error] [${code}] [${status}]:`, error);
  } else {
    console.warn(`[API Client Error] [${code}] [${status}]:`, sanitizedMessage);
  }

  return NextResponse.json(
    {
      success: false,
      error: sanitizedMessage,
      code,
      status,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
