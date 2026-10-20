import React from "react";

// Role Definitions & Types
export type Role =
  | "super_admin"
  | "principal"
  | "vice_principal"
  | "admin"
  | "teacher"
  | "accountant"
  | "staff"
  | "student"
  | "parent"
  | "guardian";

export type UserRole = Role;

// Role Constants
export const ADMIN = "admin";
export const TEACHER = "teacher";
export const STAFF = "staff";
export const PRINCIPAL = "principal";
export const SUPER_ADMIN = "super_admin";
export const STUDENT = "student";

export const ADMIN_ROLES: Role[] = ["super_admin", "principal", "admin", "vice_principal"];
export const TEACHER_ROLES: Role[] = ["teacher"];
export const STAFF_ROLES: Role[] = ["staff", "accountant"];

/**
 * Normalizes any raw role string (case-insensitive, aliases)
 * Defaults to "student" (lowest privilege fail-safe) if unrecognized or null
 */
export function normalizeRole(roleRaw?: string | null): Role {
  if (!roleRaw) return "student";
  const normalized = roleRaw.toString().toLowerCase().trim();
  
  if (normalized === "super_admin" || normalized === "superadmin" || normalized === "super-admin") {
    return "super_admin";
  }
  if (normalized === "principal") {
    return "principal";
  }
  if (normalized === "vice_principal" || normalized === "viceprincipal" || normalized === "vice-principal") {
    return "vice_principal";
  }
  if (normalized === "admin" || normalized === "administrator" || normalized === "system_admin") {
    return "admin";
  }
  if (
    normalized === "teacher" ||
    normalized === "instructor" ||
    normalized === "chief_instructor" ||
    normalized === "faculty"
  ) {
    return "teacher";
  }
  if (normalized === "accountant" || normalized === "finance_officer") {
    return "accountant";
  }
  if (normalized === "staff" || normalized === "office_assistant") {
    return "staff";
  }
  if (normalized === "parent") {
    return "parent";
  }
  if (normalized === "guardian") {
    return "guardian";
  }
  if (normalized === "student") {
    return "student";
  }

  // Fail-Safe Default: Deny elevated privileges
  return "student";
}

export const STUDENT_ROLES: Role[] = ["student"];
export const PUBLIC_ROLES: Role[] = ["parent", "guardian"];
export const AUTHORIZED_STAFF_ROLES = new Set<string>([
  "super_admin",
  "principal",
  "vice_principal",
  "admin",
  "teacher",
  "accountant",
  "staff",
]);

/**
 * Checks if a role is an absolute supreme administrator
 */
export function isSupremeAdmin(role: Role | string): boolean {
  const norm = normalizeRole(role);
  return norm === "super_admin" || norm === "principal";
}

/**
 * Checks if a role is an administrative persona
 */
export function isAdministrator(role: Role | string): boolean {
  const norm = normalizeRole(role);
  return ADMIN_ROLES.includes(norm);
}

/**
 * Checks if a role is a student identity (Zero-Trust Target)
 */
export function isStudent(role: Role | string): boolean {
  return normalizeRole(role) === "student";
}

/**
 * Checks if a role is a teacher or academic faculty
 */
export function isTeacher(role: Role | string): boolean {
  return normalizeRole(role) === "teacher";
}

/**
 * Checks if a role is an accountant or staff member
 */
export function isStaff(role: Role | string): boolean {
  const norm = normalizeRole(role);
  return STAFF_ROLES.includes(norm);
}

/**
 * Checks if a role is any authorized faculty, admin, or staff persona
 */
export function isAuthorizedStaff(role: Role | string): boolean {
  const norm = normalizeRole(role);
  return AUTHORIZED_STAFF_ROLES.has(norm);
}

/**
 * Checks if a role is student, parent, or guardian (non-staff public)
 */
export function isStudentOrPublic(role: Role | string): boolean {
  const norm = normalizeRole(role);
  return norm === "student" || norm === "parent" || norm === "guardian";
}

// -------------------------------------------------------------
// Granular Custom Permission Tags (Dynamic Delegation Model)
// -------------------------------------------------------------
export type CustomPermissionTag =
  | "manage_attendance"
  | "edit_marks"
  | "manage_quizzes"
  | "view_audit_logs"
  | "issue_certificates"
  | "generate_ai_questions"
  | "manage_routines"
  | "manage_fees"
  | "manage_students"
  | "manage_faculty"
  | "send_sms";

export interface PermissionDefinition {
  tag: CustomPermissionTag;
  title: string;
  titleBangla: string;
  descriptionBangla: string;
  category: "academic" | "examination" | "security" | "administrative";
  riskLevel: "low" | "medium" | "high" | "critical";
  defaultRoles: Role[];
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    tag: "manage_attendance",
    title: "Manage Student Attendance",
    titleBangla: "হাজিরা গ্রহণ ও সম্পাদন",
    descriptionBangla: "দৈনিক হাজিরা গ্রহণ, বাল্ক সংশোধন এবং হাজিরা লক করার অধিকার।",
    category: "academic",
    riskLevel: "medium",
    defaultRoles: ["super_admin", "principal", "admin", "teacher"],
  },
  {
    tag: "edit_marks",
    title: "Edit Examination Marks",
    titleBangla: "পরীক্ষা নম্বর ও মূল্যায়ন এন্ট্রি",
    descriptionBangla: "ক্লাস টেস্ট, কুইজ, প্র্যাকটিক্যাল এবং সেমিস্টার ফাইনাল নম্বর লিপিবদ্ধ করার অধিকার।",
    category: "examination",
    riskLevel: "high",
    defaultRoles: ["super_admin", "principal", "admin", "teacher"],
  },
  {
    tag: "manage_quizzes",
    title: "Manage & Publish Quizzes",
    titleBangla: "কুইজ তৈরি ও প্রকাশনা",
    descriptionBangla: "লাইভ কুইজ সেশন প্রস্তুত, টিম নির্ধারণ ও ফলাফল চূড়ান্তকরণের অধিকার।",
    category: "examination",
    riskLevel: "medium",
    defaultRoles: ["super_admin", "principal", "admin", "teacher"],
  },
  {
    tag: "generate_ai_questions",
    title: "AI Question Generation Studio",
    titleBangla: "AI প্রশ্ন জেনারেশন স্টুডিও",
    descriptionBangla: "Google Gemini সমর্থিত স্বয়ংক্রিয় প্রশ্ন ও কুইজ জেনারেশন ইঞ্জিন ব্যবহারের অধিকার।",
    category: "academic",
    riskLevel: "medium",
    defaultRoles: ["super_admin", "principal", "admin", "teacher"],
  },
  {
    tag: "issue_certificates",
    title: "Issue Certificates & Bangla Docs",
    titleBangla: "প্রত্যয়নপত্র ও প্রশংসাপত্র প্রদান",
    descriptionBangla: "অফিসিয়াল প্রশংসাপত্র, প্রত্যয়নপত্র ও ক্যারেক্টার সার্টিফিকেট ইস্যু ও প্রিন্টের অধিকার।",
    category: "administrative",
    riskLevel: "high",
    defaultRoles: ["super_admin", "principal", "admin"],
  },
  {
    tag: "view_audit_logs",
    title: "View Security Audit Logs",
    titleBangla: "নিরাপত্তা ও অডিট লগ পর্যবেক্ষণ",
    descriptionBangla: "সিস্টেম সিকিউরিটি লগ, অনুমোদন পরিবর্তন ইতিহাস ও ইন্টারসেপশন রেকর্ডস পর্যবেক্ষণের অধিকার।",
    category: "security",
    riskLevel: "critical",
    defaultRoles: ["super_admin", "principal"],
  },
  {
    tag: "manage_routines",
    title: "Master Routine Builder",
    titleBangla: "মাস্টার রুটিন ও শিডিউল বিন্যাস",
    descriptionBangla: "প্রতিষ্ঠানব্যাপী মাস্টার ক্লাস রুটিন তৈরি, পরিবর্তন ও প্রকাশনা।",
    category: "academic",
    riskLevel: "high",
    defaultRoles: ["super_admin", "principal", "admin"],
  },
  {
    tag: "manage_fees",
    title: "Fee Accounts & Collection",
    titleBangla: "ফি আদায় ও হিসাব পোর্টাল",
    descriptionBangla: "শিক্ষার্থী ফি সংগ্রহ, বকেয়া হিসাব ও আর্থিক ভাউচার জেনারেশন।",
    category: "administrative",
    riskLevel: "critical",
    defaultRoles: ["super_admin", "principal", "admin", "accountant"],
  },
  {
    tag: "manage_students",
    title: "Student Lifecycle & Admission",
    titleBangla: "শিক্ষার্থী ভর্তি ও ডাটাবেজ",
    descriptionBangla: "শিক্ষার্থী ভর্তি, রোলওভার, আইডি কার্ড জেনারেশন ও প্রোফাইল সম্পাদন।",
    category: "administrative",
    riskLevel: "high",
    defaultRoles: ["super_admin", "principal", "admin"],
  },
  {
    tag: "manage_faculty",
    title: "Faculty Workload & Leave",
    titleBangla: "শিক্ষক ও স্টাফ প্রশাসন",
    descriptionBangla: "শিক্ষক ওয়ার্কলোড পর্যালোচনা, দায়িত্ব বণ্টন ও ছুটি অনুমোদন।",
    category: "administrative",
    riskLevel: "high",
    defaultRoles: ["super_admin", "principal", "admin"],
  },
  {
    tag: "send_sms",
    title: "Institutional Bulk SMS Broadcast",
    titleBangla: "বাল্ক বাংলা এসএমএস প্রেরণ",
    descriptionBangla: "শিক্ষার্থী ও অভিভাবকদের কাছে অফিসিয়াল বার্তা ও জরুরি নোটিশ প্রেরণ।",
    category: "administrative",
    riskLevel: "high",
    defaultRoles: ["super_admin", "principal", "admin"],
  },
];

// All permissions array for easy lookup
export const ALL_CUSTOM_PERMISSIONS: CustomPermissionTag[] = PERMISSION_DEFINITIONS.map((p) => p.tag);

// -------------------------------------------------------------
// Security Audit Logging Engine
// -------------------------------------------------------------
export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  actionType:
    | "PERMISSION_GRANTED"
    | "PERMISSION_REVOKED"
    | "ROLE_SWITCH"
    | "STUDENT_ACCESS_BLOCKED"
    | "CLEARANCE_DENIED"
    | "SECURITY_POLICY_OVERRIDE"
    | "BACKEND_ACCESS_INTERCEPTED";
  actorRole: string;
  actorName: string;
  actorEmail?: string;
  targetUserId?: string | number;
  targetUserName?: string;
  targetUserRole?: string;
  permissionTag?: CustomPermissionTag | string;
  routePath?: string;
  ipAddress?: string;
  status: "ALLOWED" | "BLOCKED" | "INTERCEPTED" | "MODIFIED";
  details: string;
  detailsBangla: string;
}

// In-Memory Audit Trail (Persisted also to localStorage in client environment)
let globalAuditLogs: SecurityAuditLog[] = [
  {
    id: "sec-init-1",
    timestamp: "2026-10-09T04:15:00.000Z",
    actionType: "SECURITY_POLICY_OVERRIDE",
    actorRole: "super_admin",
    actorName: "Md. Rafiqul Islam (Principal)",
    actorEmail: "principal@pgtsc.gov.bd",
    status: "ALLOWED",
    details: "Zero-Trust Student Exclusion & Dynamic RBAC Governance Engine Initialized.",
    detailsBangla: "জিরো-ট্রাস্ট শিক্ষার্থী সুরক্ষা ও গতিশীল আরবিক গভর্ন্যান্স ইঞ্জিন সক্রিয় করা হয়েছে।",
  },
  {
    id: "sec-init-2",
    timestamp: "2026-10-09T04:20:00.000Z",
    actionType: "PERMISSION_GRANTED",
    actorRole: "principal",
    actorName: "Md. Rafiqul Islam (Principal)",
    targetUserId: 3,
    targetUserName: "Engr. Mahmudul Hasan",
    targetUserRole: "teacher",
    permissionTag: "generate_ai_questions",
    status: "MODIFIED",
    details: "Granted AI Question Studio permission to Chief Instructor IT/IoT.",
    detailsBangla: "চিফ ইন্সট্রাক্টর (আইটি ও আইওটি) কে AI প্রশ্ন জেনারেশন স্টুডিও অনুমতি প্রদান করা হয়েছে।",
  },
  {
    id: "sec-init-3",
    timestamp: "2026-10-09T04:30:12.000Z",
    actionType: "STUDENT_ACCESS_BLOCKED",
    actorRole: "student",
    actorName: "Kazi Tanvir Hasan (Roll 101)",
    routePath: "/admin/examination/marks",
    status: "BLOCKED",
    details: "Student attempted to access administrative marks modification endpoint. Intercepted with 403 Forbidden.",
    detailsBangla: "শিক্ষার্থী পরীক্ষা নম্বর পরিবর্তন এন্ডপয়েন্টে প্রবেশের চেষ্টা করেছিল। ৪০৩ নিষিদ্ধ কোড দিয়ে তাৎক্ষণিক আটকানো হয়েছে।",
  },
];

export function getSecurityAuditLogs(filter?: {
  actionType?: string;
  status?: string;
  limit?: number;
}): SecurityAuditLog[] {
  // Sync from localStorage if in browser
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("ptsc_security_audit_logs");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          globalAuditLogs = parsed;
        }
      }
    } catch {}
  }

  let logs = [...globalAuditLogs];
  if (filter?.actionType && filter.actionType !== "all") {
    logs = logs.filter((l) => l.actionType === filter.actionType);
  }
  if (filter?.status && filter.status !== "all") {
    logs = logs.filter((l) => l.status === filter.status);
  }
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (filter?.limit && filter.limit > 0) {
    return logs.slice(0, filter.limit);
  }
  return logs;
}

export function recordSecurityAuditLog(
  entry: Omit<SecurityAuditLog, "id" | "timestamp">
): SecurityAuditLog {
  const newLog: SecurityAuditLog = {
    id: `sec-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  globalAuditLogs.unshift(newLog);
  if (globalAuditLogs.length > 300) {
    globalAuditLogs = globalAuditLogs.slice(0, 300);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("ptsc_security_audit_logs", JSON.stringify(globalAuditLogs));
    } catch {}
  }

  if (entry.status === "BLOCKED" || entry.status === "INTERCEPTED") {
    console.warn(`[PTSC Security Engine - 403 INTERCEPTED]`, {
      action: entry.actionType,
      actor: entry.actorName,
      role: entry.actorRole,
      route: entry.routePath,
      detail: entry.details,
    });
  } else {
    console.info(`[PTSC Security Engine - AUDIT]`, {
      action: entry.actionType,
      actor: entry.actorName,
      status: entry.status,
    });
  }

  return newLog;
}

// -------------------------------------------------------------
// Dynamic User Permissions Store
// Key: string userId (e.g. "1", "2", "3")
// Value: CustomPermissionTag[]
// -------------------------------------------------------------
export interface UserDynamicPermissions {
  userId: string | number;
  userEmail: string;
  userName: string;
  role: Role;
  designation: string;
  department?: string;
  trade?: string;
  customPermissions: CustomPermissionTag[];
  updatedAt: string;
  updatedBy: string;
}

// Default initial delegations for core staff & teachers
const INITIAL_DELEGATED_PERMISSIONS: Record<string, CustomPermissionTag[]> = {
  // Principal: Full supreme capabilities
  "1": [...ALL_CUSTOM_PERMISSIONS],
  // Admin: All operational capabilities
  "2": [
    "manage_attendance",
    "edit_marks",
    "manage_quizzes",
    "generate_ai_questions",
    "issue_certificates",
    "manage_routines",
    "manage_fees",
    "manage_students",
    "manage_faculty",
    "send_sms",
    "view_audit_logs",
  ],
  // Chief Instructor IT/IoT (Engr. Mahmudul Hasan)
  "3": [
    "manage_attendance",
    "manage_quizzes",
    "generate_ai_questions",
    "edit_marks",
  ],
  // Student (Zero-Trust Immutable: ALWAYS EMPTY)
  "4": [],
  // Guardian / Parent: ALWAYS EMPTY
  "5": [],
  // Default staff/instructors seeded with attendance & quiz permissions
  "101": ["manage_attendance", "manage_quizzes"],
  "102": ["manage_attendance", "manage_quizzes", "generate_ai_questions"],
  "103": ["manage_attendance", "edit_marks"],
  "104": ["manage_attendance"],
  "105": ["manage_attendance", "manage_quizzes"],
};

let userDynamicPermissionsStore: Record<string, CustomPermissionTag[]> = {
  ...INITIAL_DELEGATED_PERMISSIONS,
};

function getPersistedDynamicStore(): Record<string, CustomPermissionTag[]> {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("ptsc_dynamic_permissions_store");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === "object" && parsed !== null) {
          // STRICT ZERO-TRUST SANITIZATION: Never allow Student (id 4 or any student) to possess permissions
          if (parsed["4"]) parsed["4"] = [];
          userDynamicPermissionsStore = { ...userDynamicPermissionsStore, ...parsed, "4": [] };
        }
      }
    } catch {}
  }
  return userDynamicPermissionsStore;
}

function persistDynamicStore() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        "ptsc_dynamic_permissions_store",
        JSON.stringify(userDynamicPermissionsStore)
      );
    } catch {}
  }
}

/**
 * Returns the currently active custom permissions for a specific user ID
 */
export function getUserPermissions(userId: string | number, role?: Role): CustomPermissionTag[] {
  const store = getPersistedDynamicStore();
  const normalizedUserRole = normalizeRole(role);

  // DIRECTIVE 1: Absolute Student Backend Exclusion (Zero-Trust)
  if (normalizedUserRole === "student" || String(userId) === "4") {
    return [];
  }

  // DIRECTIVE 2: Supreme Administrator Governance
  if (normalizedUserRole === "super_admin" || normalizedUserRole === "principal") {
    return [...ALL_CUSTOM_PERMISSIONS];
  }

  const userKey = String(userId);
  if (store[userKey]) {
    return [...store[userKey]];
  }

  // Fallback defaults based on role definition
  return PERMISSION_DEFINITIONS.filter((p) => p.defaultRoles.includes(normalizedUserRole)).map(
    (p) => p.tag
  );
}

/**
 * Evaluates whether a user has a specific custom permission tag
 */
export function hasCustomPermission(
  userId: string | number,
  role: Role | string,
  permission: CustomPermissionTag
): boolean {
  const normRole = normalizeRole(role);

  // DIRECTIVE 1: Absolute Zero-Trust for Students
  if (normRole === "student" || String(userId) === "4") {
    return false;
  }

  // DIRECTIVE 2: Supreme Administrator Control
  if (normRole === "super_admin" || normRole === "principal") {
    return true;
  }

  // DIRECTIVE 3: Teacher & Staff Conditional Evaluation
  const permissions = getUserPermissions(userId, normRole);
  return permissions.includes(permission);
}

/**
 * Dynamic Permission Delegation: Admin grants a permission to a teacher or staff member
 */
export function grantCustomPermission(
  adminActor: { id: any; name: string; role: Role | string; email?: string },
  targetUser: { id: string | number; name: string; role: Role | string; email?: string },
  permission: CustomPermissionTag,
  reason?: string
): { success: boolean; message: string } {
  const adminNorm = normalizeRole(adminActor.role);
  const targetNorm = normalizeRole(targetUser.role);

  // DIRECTIVE 2 Enforcement: Only SUPER_ADMIN and PRINCIPAL have exclusive authority
  if (!isAdministrator(adminNorm)) {
    recordSecurityAuditLog({
      actionType: "SECURITY_POLICY_OVERRIDE",
      actorRole: adminNorm,
      actorName: adminActor.name,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      permissionTag: permission,
      status: "BLOCKED",
      details: "Unauthorized attempt to grant permission by non-admin.",
      detailsBangla: "অ্যাডমিন ব্যতীত অন্য কেউ পারমিশন প্রদানের ব্যর্থ চেষ্টা করেছে।",
    });
    throw new Error("অননুমোদিত: শুধুমাত্র অধ্যক্ষ বা সুপার অ্যাডমিনিস্ট্রেটর পারমিশন প্রদান করতে পারেন।");
  }

  // DIRECTIVE 1 Enforcement: Absolute Student Zero-Trust Prohibition
  if (targetNorm === "student" || String(targetUser.id) === "4") {
    recordSecurityAuditLog({
      actionType: "STUDENT_ACCESS_BLOCKED",
      actorRole: adminNorm,
      actorName: adminActor.name,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      targetUserRole: "student",
      permissionTag: permission,
      status: "BLOCKED",
      details: "Attempted to grant administrative permission to a student. Strictly blocked by Zero-Trust policy.",
      detailsBangla: "শিক্ষার্থীকে প্রশাসনিক পারমিশন প্রদানের চেষ্টা প্রতিহত করা হয়েছে (জিরো-ট্রাস্ট শিক্ষার্থী নীতি)।",
    });
    return {
      success: false,
      message: "নিরাপত্তা সতর্কতা: শিক্ষার্থীদের প্রশাসনিক বা মিউটেশন পারমিশন প্রদান করা সম্পূর্ণ নিষিদ্ধ।",
    };
  }

  const targetKey = String(targetUser.id);
  const current = getUserPermissions(targetUser.id, targetNorm);
  if (!current.includes(permission)) {
    userDynamicPermissionsStore[targetKey] = [...current, permission];
    persistDynamicStore();

    recordSecurityAuditLog({
      actionType: "PERMISSION_GRANTED",
      actorRole: adminNorm,
      actorName: adminActor.name,
      actorEmail: adminActor.email,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      targetUserRole: targetNorm,
      permissionTag: permission,
      status: "MODIFIED",
      details: `Admin ${adminActor.name} granted permission '${permission}' to ${targetUser.name}. Reason: ${reason || "Admin Delegation"}`,
      detailsBangla: `অ্যাডমিন ${adminActor.name} কর্তৃক ${targetUser.name} কে '${permission}' পারমিশন অনুমোদন দেওয়া হয়েছে।`,
    });
  }

  return {
    success: true,
    message: `${targetUser.name}-কে সফলভাবে '${permission}' পারমিশন প্রদান করা হয়েছে।`,
  };
}

/**
 * Dynamic Permission Revocation: Admin revokes a permission from a teacher or staff member
 */
export function revokeCustomPermission(
  adminActor: { id: any; name: string; role: Role | string; email?: string },
  targetUser: { id: string | number; name: string; role: Role | string; email?: string },
  permission: CustomPermissionTag,
  reason?: string
): { success: boolean; message: string } {
  const adminNorm = normalizeRole(adminActor.role);
  const targetNorm = normalizeRole(targetUser.role);

  if (!isAdministrator(adminNorm)) {
    throw new Error("অননুমোদিত: শুধুমাত্র অধ্যক্ষ বা সুপার অ্যাডমিনিস্ট্রেটর পারমিশন প্রত্যাহার করতে পারেন।");
  }

  const targetKey = String(targetUser.id);
  const current = getUserPermissions(targetUser.id, targetNorm);
  userDynamicPermissionsStore[targetKey] = current.filter((p) => p !== permission);
  persistDynamicStore();

  recordSecurityAuditLog({
    actionType: "PERMISSION_REVOKED",
    actorRole: adminNorm,
    actorName: adminActor.name,
    actorEmail: adminActor.email,
    targetUserId: targetUser.id,
    targetUserName: targetUser.name,
    targetUserRole: targetNorm,
    permissionTag: permission,
    status: "MODIFIED",
    details: `Admin ${adminActor.name} revoked permission '${permission}' from ${targetUser.name}. Reason: ${reason || "Admin Revocation"}`,
    detailsBangla: `অ্যাডমিন ${adminActor.name} কর্তৃক ${targetUser.name}-এর '${permission}' পারমিশন প্রত্যাহার করা হয়েছে।`,
  });

  return {
    success: true,
    message: `${targetUser.name}-এর থেকে '${permission}' পারমিশন সফলভাবে প্রত্যাহার করা হয়েছে।`,
  };
}

/**
 * Bulk updates the full set of custom permissions for a target user
 */
export function setDynamicUserPermissions(
  adminActor: { id: any; name: string; role: Role | string; email?: string },
  targetUser: { id: string | number; name: string; role: Role | string },
  permissions: CustomPermissionTag[],
  reason?: string
): { success: boolean; message: string } {
  const adminNorm = normalizeRole(adminActor.role);
  const targetNorm = normalizeRole(targetUser.role);

  if (!isAdministrator(adminNorm)) {
    throw new Error("অননুমোদিত: প্রশাসনিক অধিকার ব্যতীত পারমিশন আপডেট করা সম্ভব নয়।");
  }

  // Zero-Trust: If target is a student, force empty array
  if (targetNorm === "student" || String(targetUser.id) === "4") {
    userDynamicPermissionsStore[String(targetUser.id)] = [];
    persistDynamicStore();
    return {
      success: false,
      message: "জিরো-ট্রাস্ট শিক্ষার্থী নীতি: শিক্ষার্থীদের পারমিশন সর্বদা শূন্য (০) থাকবে।",
    };
  }

  const targetKey = String(targetUser.id);
  userDynamicPermissionsStore[targetKey] = [...permissions];
  persistDynamicStore();

  recordSecurityAuditLog({
    actionType: "PERMISSION_GRANTED",
    actorRole: adminNorm,
    actorName: adminActor.name,
    targetUserId: targetUser.id,
    targetUserName: targetUser.name,
    targetUserRole: targetNorm,
    status: "MODIFIED",
    details: `Updated permissions for ${targetUser.name}: [${permissions.join(", ")}]. Reason: ${reason || "Admin Configuration"}`,
    detailsBangla: `${targetUser.name}-এর পারমিশন তালিকা হালনাগাদ করা হয়েছে (${permissions.length} টি পারমিশন)।`,
  });

  return {
    success: true,
    message: `${targetUser.name}-এর জন্য পারমিশন তালিকা সফলভাবে হালনাগাদ করা হয়েছে।`,
  };
}

// -------------------------------------------------------------
// Legacy Role-to-Module Action Map (Maintained for UI compatibility)
// -------------------------------------------------------------
export type Action = "view" | "create" | "edit" | "delete" | "approve" | "export" | "publish" | "manage";

export const PERMISSION_MAP: Record<Role, Record<string, Action[]>> = {
  super_admin: {
    all: ["view", "create", "edit", "delete", "approve", "export", "publish", "manage"],
  },
  principal: {
    all: ["view", "create", "edit", "approve", "export", "publish", "manage"],
  },
  admin: {
    student: ["view", "create", "edit", "export"],
    attendance: ["view", "create", "edit", "export"],
    quiz: ["view", "create", "edit", "publish"],
    results: ["view", "create", "edit", "export"],
    finance: ["view", "create", "edit"],
    notice: ["view", "create", "edit", "publish"],
    routine: ["view", "create", "edit", "delete", "manage"],
  },
  teacher: {
    student: ["view"],
    attendance: ["view", "create", "edit"],
    quiz: ["view", "create", "edit"],
    results: ["view", "create", "edit"],
    notice: ["view"],
    routine: ["view"],
  },
  accountant: {
    finance: ["view", "create", "edit", "export"],
    student: ["view"],
  },
  staff: {
    attendance: ["view"],
    notice: ["view"],
  },
  student: {
    quiz: ["view"],
    results: ["view"],
    notice: ["view"],
    routine: ["view"],
  },
  parent: {
    results: ["view"],
    notice: ["view"],
  },
  guardian: {
    results: ["view"],
    notice: ["view"],
  },
  vice_principal: {
    all: ["view", "create", "edit", "approve", "export", "publish"],
  },
};

export const hasPermission = (role: Role | string, module: string, action: Action): boolean => {
  const normRole = normalizeRole(role);

  // DIRECTIVE 1: Zero-Trust Student Exclusion for administrative actions
  if (normRole === "student") {
    if (action !== "view") return false;
    const allowedStudentModules = ["quiz", "results", "notice", "routine", "library"];
    return allowedStudentModules.includes(module);
  }

  const rolePermissions = PERMISSION_MAP[normRole];
  if (!rolePermissions) return false;

  // Super Admin & Principal bypass
  if (rolePermissions.all?.includes(action)) return true;

  const modulePermissions = rolePermissions[module];
  return modulePermissions?.includes(action) || false;
};

/**
 * Custom React hook to check role and custom permissions
 */
export function usePermissions(module: string, action: Action = "view", customTag?: CustomPermissionTag) {
  try {
    // Dynamic import avoidance; check window/context
    if (typeof window === "undefined") return false;
    const savedUserRole = (localStorage.getItem("pgtsc_user_role") || "student") as Role;
    const norm = normalizeRole(savedUserRole);
    
    if (norm === "student") {
      if (action !== "view") return false;
      return ["quiz", "results", "notice", "routine"].includes(module);
    }

    if (customTag) {
      // Check custom permission tag
      const userId = localStorage.getItem("pgtsc_user_id") || (norm === "teacher" ? "3" : "1");
      return hasCustomPermission(userId, norm, customTag);
    }

    return hasPermission(norm, module, action);
  } catch {
    return false;
  }
}

/**
 * Higher-Order Component (HOC) to restrict UI components based on permissions
 */
export function withPermissions<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredModule: string,
  requiredAction: Action = "view",
  fallbackComponent?: React.ReactNode
) {
  return function ProtectedComponent(props: P) {
    const allowed = usePermissions(requiredModule, requiredAction);

    if (!allowed) {
      if (fallbackComponent) {
        return React.createElement(React.Fragment, null, fallbackComponent);
      }
      return React.createElement(
        "div",
        {
          className:
            "p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3",
        },
        React.createElement(
          "div",
          {
            className:
              "w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center mx-auto font-black text-lg",
          },
          "🔒"
        ),
        React.createElement(
          "h3",
          { className: "text-sm font-black text-slate-900 dark:text-white" },
          "সংরক্ষিত এলাকা (Access Restricted)"
        ),
        React.createElement(
          "p",
          { className: "text-xs text-slate-500" },
          `এই মডিউলটি (${requiredModule}) দেখার বা সম্পাদনা করার প্রয়োজনীয় অনুমতি আপনার রোল বা অ্যাকাউন্টে নেই। প্রশাসনিক ক্লিয়ারেন্স প্রয়োজন।`
        )
      );
    }

    return React.createElement(WrappedComponent, props);
  };
}

/**
 * Guard Component for inline conditional rendering based on role/permission
 */
export function PermissionGuard({
  module,
  action = "view",
  customTag,
  children,
  fallback = null,
}: {
  module: string;
  action?: Action;
  customTag?: CustomPermissionTag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const allowed = usePermissions(module, action, customTag);
  if (!allowed) return React.createElement(React.Fragment, null, fallback);
  return React.createElement(React.Fragment, null, children);
}
