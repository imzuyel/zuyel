/**
 * Database-Backed RBAC Service for PTSC ERP
 * 
 * Provides granular Role-Based Access Control with:
 * - DB persistence via Prisma (MySQL) when available
 * - 100% In-memory fallback for preview/demo mode
 * - Colon-separated permission keys (e.g., "quiz:create", "attendance:manage")
 * - Role-level defaults + per-user overrides
 * 
 * Architecture: Hybrid (Database-First with In-Memory Resilience)
 */

import { prisma, isPrismaAvailable } from "./prisma";
import {
  Role,
  normalizeRole,
  isSupremeAdmin,
  isAdministrator,
  isStudent,
  CustomPermissionTag,
  PERMISSION_DEFINITIONS,
  ALL_CUSTOM_PERMISSIONS,
  getUserPermissions as getInMemoryPermissions,
  setDynamicUserPermissions as setInMemoryPermissions,
  grantCustomPermission as grantInMemoryPermission,
  revokeCustomPermission as revokeInMemoryPermission,
  recordSecurityAuditLog,
  type PermissionDefinition,
} from "./rbac";

// =====================================================
// GRANULAR PERMISSION KEY CATALOG (module:action format)
// =====================================================

export interface GranularPermission {
  key: string; // "quiz:create"
  module: string; // "quiz"
  action: string; // "create"
  title: string;
  titleBangla: string;
  description: string;
  descriptionBangla: string;
  category: "academic" | "examination" | "administrative" | "security" | "general";
  riskLevel: "low" | "medium" | "high" | "critical";
  defaultRoles: Role[];
}

/**
 * Complete Permission Catalog - Maps all ERP modules and actions
 * Each permission key is in "module:action" format
 */
export const GRANULAR_PERMISSIONS_CATALOG: GranularPermission[] = [
  // ===== Quiz Module =====
  {
    key: "quiz:create",
    module: "quiz",
    action: "create",
    title: "Create Quizzes",
    titleBangla: "কুইজ তৈরি",
    description: "Create new quiz sessions with questions and configuration",
    descriptionBangla: "নতুন কুইজ সেশন, প্রশ্ন ও কনফিগারেশন তৈরি করার অধিকার।",
    category: "examination",
    riskLevel: "medium",
    defaultRoles: ["super_admin", "principal", "admin", "teacher"],
  },
  {
    key: "quiz:edit",
    module: "quiz",
    action: "edit",
    title: "Edit Quizzes",
    titleBangla: "কুইজ সম্পাদনা",
    description: "Modify existing quiz questions, settings, and answers",
    descriptionBangla: "বিদ্যমান কুইজের প্রশ্ন, সেটিংস ও উত্তর পরিবর্তন করার অধিকার।",
    category: "examination",
    riskLevel: "medium",
    defaultRoles: ["super_admin", "principal", "admin", "teacher"],
  },
  {
    key: "quiz:delete",
    module: "quiz",
    action: "delete",
    title: "Delete Quizzes",
    titleBangla: "কুইজ মুছে ফেলা",
    description: "Permanently remove quiz sessions and related data",
    descriptionBangla: "কুইজ সেশন ও সম্পর্কিত ডেটা স্থায়ীভাবে মুছে ফেলার অধিকার।",
    category: "examination",
    riskLevel: "high",
    defaultRoles: ["super_admin", "principal", "admin"],
  },
  {
    key: "quiz:publish",
    module: "quiz",
    action: "publish",
    title: "Publish & Activate Quizzes",
    titleBangla: "কুইজ প্রকাশনা ও সক্রিয়করণ",
    description: "Make quizzes live for student participation",
    descriptionBangla: "শিক্ষার্থীদের অংশগ্রহণের জন্য কুইজ লাইভ প্রকাশ করার অধিকার।",
    category: "examination",
    riskLevel: "medium",
    defaultRoles: ["super_admin", "principal", "admin", "teacher"],
  },

  // ===== Routine Module =====
  {
    key: "routine:manage",
    module: "routine",
    action: "manage",
    title: "Master Routine Builder",
    titleBangla: "মাস্টার রুটিন বিন্যাস",
    description: "Create, edit and publish institutional class routines",
    descriptionBangla: "প্রতিষ্ঠানব্যাপী মাস্টার ক্লাস রুটিন তৈরি, পরিবর্তন ও প্রকাশনা।",
    category: "academic",
    riskLevel: "high",
    defaultRoles: ["super_admin", "principal", "admin"],
  },
  {
    key: "routine:view",
    module: "routine",
    action: "view",
    title: "View Routines",
    titleBangla: "রুটিন দেখা",
    description: "View class and exam routines",
    descriptionBangla: "ক্লাস ও পরীক্ষা রুটিন দেখার অধিকার।",
    category: "academic",
    riskLevel: "low",
    defaultRoles: ["super_admin", "principal", "admin", "teacher", "staff", "student"],
  },

  // ===== Attendance Module =====
  {
    key: "attendance:view",
    module: "attendance",
    action: "view",
    title: "View Attendance Reports",
    titleBangla: "হাজিরা রিপোর্ট দেখা",
    description: "View daily and monthly attendance reports",
    descriptionBangla: "দৈনিক ও মাসিক হাজিরা রিপোর্ট দেখার অধিকার।",
    category: "academic",
    riskLevel: "low",
    defaultRoles: ["super_admin", "principal", "admin", "teacher"],
  },
  {
    key: "attendance:manage",
    module: "attendance",
    action: "manage",
    title: "Manage Student Attendance",
    titleBangla: "হাজিরা গ্রহণ ও সম্পাদনা",
    description: "Take, edit and lock daily student attendance records",
    descriptionBangla: "দৈনিক হাজিরা গ্রহণ, বাল্ক সংশোধন এবং হাজিরা লক করার অধিকার।",
    category: "academic",
    riskLevel: "medium",
    defaultRoles: ["super_admin", "principal", "admin", "teacher"],
  },

  // ===== AI Module =====
  {
    key: "ai:generate",
    module: "ai",
    action: "generate",
    title: "AI Question Generation Studio",
    titleBangla: "AI প্রশ্ন জেনারেশন স্টুডিও",
    description: "Use Google Gemini to auto-generate questions and quizzes",
    descriptionBangla: "Google Gemini সমর্থিত স্বয়ংক্রিয় প্রশ্ন ও কুইজ জেনারেশন ইঞ্জিন ব্যবহারের অধিকার।",
    category: "academic",
    riskLevel: "medium",
    defaultRoles: ["super_admin", "principal", "admin", "teacher"],
  },
  {
    key: "ai:chat",
    module: "ai",
    action: "chat",
    title: "AI Chat & Summary Assistant",
    titleBangla: "AI চ্যাট ও সারমর্ম সহকারী",
    description: "Use AI chatbot for lesson summaries and educational queries",
    descriptionBangla: "পাঠ সারমর্ম ও শিক্ষামূলক প্রশ্নোত্তরে AI চ্যাটবট ব্যবহারের অধিকার।",
    category: "academic",
    riskLevel: "low",
    defaultRoles: ["super_admin", "principal", "admin", "teacher"],
  },

  // ===== Examination / Marks Module =====
  {
    key: "marks:edit",
    module: "marks",
    action: "edit",
    title: "Edit Examination Marks",
    titleBangla: "পরীক্ষা নম্বর ও মূল্যায়ন এন্ট্রি",
    description: "Enter, modify, and finalize examination marks for students",
    descriptionBangla: "ক্লাস টেস্ট, কুইজ, প্র্যাকটিক্যাল ও সেমিস্টার ফাইনাল নম্বর লিপিবদ্ধ করার অধিকার।",
    category: "examination",
    riskLevel: "high",
    defaultRoles: ["super_admin", "principal", "admin", "teacher"],
  },
  {
    key: "marks:view",
    module: "marks",
    action: "view",
    title: "View Exam Results",
    titleBangla: "পরীক্ষার ফলাফল দেখা",
    description: "View student exam marks and result sheets",
    descriptionBangla: "শিক্ষার্থীদের পরীক্ষার নম্বর ও ফলাফল শিট দেখার অধিকার।",
    category: "examination",
    riskLevel: "low",
    defaultRoles: ["super_admin", "principal", "admin", "teacher", "student"],
  },

  // ===== Certificate Module =====
  {
    key: "certificate:issue",
    module: "certificate",
    action: "issue",
    title: "Issue Certificates & Bangla Docs",
    titleBangla: "প্রত্যয়নপত্র ও প্রশংসাপত্র প্রদান",
    description: "Issue official certificates, testimonials and character certificates",
    descriptionBangla: "অফিসিয়াল প্রশংসাপত্র, প্রত্যয়নপত্র ও ক্যারেক্টার সার্টিফিকেট ইস্যু ও প্রিন্টের অধিকার।",
    category: "administrative",
    riskLevel: "high",
    defaultRoles: ["super_admin", "principal", "admin"],
  },

  // ===== Student Management Module =====
  {
    key: "student:manage",
    module: "student",
    action: "manage",
    title: "Student Lifecycle & Admission",
    titleBangla: "শিক্ষার্থী ভর্তি ও ডাটাবেজ",
    description: "Manage admissions, rollover, ID cards and student profiles",
    descriptionBangla: "শিক্ষার্থী ভর্তি, রোলওভার, আইডি কার্ড জেনারেশন ও প্রোফাইল সম্পাদন।",
    category: "administrative",
    riskLevel: "high",
    defaultRoles: ["super_admin", "principal", "admin"],
  },

  // ===== Faculty Management =====
  {
    key: "faculty:manage",
    module: "faculty",
    action: "manage",
    title: "Faculty Workload & Leave",
    titleBangla: "শিক্ষক ও স্টাফ প্রশাসন",
    description: "Review teacher workloads, assign duties and approve leaves",
    descriptionBangla: "শিক্ষক ওয়ার্কলোড পর্যালোচনা, দায়িত্ব বণ্টন ও ছুটি অনুমোদন।",
    category: "administrative",
    riskLevel: "high",
    defaultRoles: ["super_admin", "principal", "admin"],
  },

  // ===== Finance / Fee Module =====
  {
    key: "fee:manage",
    module: "fee",
    action: "manage",
    title: "Fee Accounts & Collection",
    titleBangla: "ফি আদায় ও হিসাব পোর্টাল",
    description: "Collect student fees, track outstanding dues, generate vouchers",
    descriptionBangla: "শিক্ষার্থী ফি সংগ্রহ, বকেয়া হিসাব ও আর্থিক ভাউচার জেনারেশন।",
    category: "administrative",
    riskLevel: "critical",
    defaultRoles: ["super_admin", "principal", "admin", "accountant"],
  },

  // ===== SMS Module =====
  {
    key: "sms:send",
    module: "sms",
    action: "send",
    title: "Institutional Bulk SMS Broadcast",
    titleBangla: "বাল্ক বাংলা এসএমএস প্রেরণ",
    description: "Send official SMS notifications to students and guardians",
    descriptionBangla: "শিক্ষার্থী ও অভিভাবকদের কাছে অফিসিয়াল বার্তা ও জরুরি নোটিশ প্রেরণ।",
    category: "administrative",
    riskLevel: "high",
    defaultRoles: ["super_admin", "principal", "admin"],
  },

  // ===== Notice Board =====
  {
    key: "notice:publish",
    module: "notice",
    action: "publish",
    title: "Publish Notices & Announcements",
    titleBangla: "নোটিশ ও ঘোষণা প্রকাশ",
    description: "Create and publish institutional notices and announcements",
    descriptionBangla: "প্রাতিষ্ঠানিক নোটিশ ও ঘোষণা তৈরি ও প্রকাশ করার অধিকার।",
    category: "administrative",
    riskLevel: "medium",
    defaultRoles: ["super_admin", "principal", "admin"],
  },

  // ===== Audit & Security =====
  {
    key: "audit:view",
    module: "audit",
    action: "view",
    title: "View Security Audit Logs",
    titleBangla: "নিরাপত্তা ও অডিট লগ পর্যবেক্ষণ",
    description: "View security logs, permission changes history and interception records",
    descriptionBangla: "সিস্টেম সিকিউরিটি লগ, অনুমোদন পরিবর্তন ইতিহাস ও ইন্টারসেপশন রেকর্ডস পর্যবেক্ষণের অধিকার।",
    category: "security",
    riskLevel: "critical",
    defaultRoles: ["super_admin", "principal"],
  },

  // ===== Admin / Permissions Management =====
  {
    key: "permission:manage",
    module: "permission",
    action: "manage",
    title: "Permission & Role Management",
    titleBangla: "পারমিশন ও রোল ম্যানেজমেন্ট",
    description: "Grant, revoke and configure user permissions and roles",
    descriptionBangla: "ব্যবহারকারীদের পারমিশন প্রদান, প্রত্যাহার ও কনফিগারেশন পরিচালনা।",
    category: "security",
    riskLevel: "critical",
    defaultRoles: ["super_admin", "principal"],
  },
];

/**
 * All granular permission keys
 */
export const ALL_GRANULAR_PERMISSION_KEYS = GRANULAR_PERMISSIONS_CATALOG.map((p) => p.key);

// =====================================================
// MAPPING: Legacy CustomPermissionTag <-> Granular Keys
// =====================================================
const LEGACY_TO_GRANULAR: Record<CustomPermissionTag, string[]> = {
  manage_attendance: ["attendance:manage", "attendance:view"],
  edit_marks: ["marks:edit", "marks:view"],
  manage_quizzes: ["quiz:create", "quiz:edit", "quiz:delete", "quiz:publish"],
  view_audit_logs: ["audit:view"],
  issue_certificates: ["certificate:issue"],
  generate_ai_questions: ["ai:generate", "ai:chat"],
  manage_routines: ["routine:manage", "routine:view"],
  manage_fees: ["fee:manage"],
  manage_students: ["student:manage"],
  manage_faculty: ["faculty:manage"],
  send_sms: ["sms:send"],
};

const GRANULAR_TO_LEGACY: Record<string, CustomPermissionTag> = {};
for (const [legacy, granulars] of Object.entries(LEGACY_TO_GRANULAR)) {
  for (const g of granulars) {
    GRANULAR_TO_LEGACY[g] = legacy as CustomPermissionTag;
  }
}

/**
 * Convert legacy permission tags to granular keys
 */
export function legacyToGranular(tags: CustomPermissionTag[]): string[] {
  const result = new Set<string>();
  for (const tag of tags) {
    const mapped = LEGACY_TO_GRANULAR[tag];
    if (mapped) {
      mapped.forEach((k) => result.add(k));
    }
  }
  return [...result];
}

/**
 * Convert granular keys to legacy tags
 */
export function granularToLegacy(keys: string[]): CustomPermissionTag[] {
  const result = new Set<CustomPermissionTag>();
  for (const key of keys) {
    const mapped = GRANULAR_TO_LEGACY[key];
    if (mapped) result.add(mapped);
  }
  return [...result];
}

// =====================================================
// DATABASE RBAC SERVICE
// =====================================================

export class RbacDatabaseService {
  private static instance: RbacDatabaseService;

  static getInstance(): RbacDatabaseService {
    if (!this.instance) {
      this.instance = new RbacDatabaseService();
    }
    return this.instance;
  }

  /**
   * Check if database RBAC is available
   */
  isDbAvailable(): boolean {
    return isPrismaAvailable();
  }

  /**
   * Get all permissions for a user (DB + fallback)
   * Returns granular keys like "quiz:create"
   */
  async getUserPermissionKeys(userId: string | number, role?: Role): Promise<string[]> {
    const normalizedRole = normalizeRole(role);

    // Zero-Trust: Students never have permissions
    if (isStudent(normalizedRole)) {
      return [];
    }

    // Supreme admins get all permissions
    if (isSupremeAdmin(normalizedRole)) {
      return [...ALL_GRANULAR_PERMISSION_KEYS];
    }

    // Admin gets all operational permissions
    if (isAdministrator(normalizedRole)) {
      return [...ALL_GRANULAR_PERMISSION_KEYS];
    }

    // Try database first
    if (this.isDbAvailable()) {
      try {
        const userPerms = await prisma.userPermission.findMany({
          where: { userId: Number(userId), granted: true },
          include: { permission: true },
        });

        if (userPerms.length > 0) {
          return userPerms.map((up: any) => up.permission.key);
        }

        // Fallback to role-level permissions from DB
        const systemUser = await prisma.systemUser.findFirst({
          where: { id: Number(userId) },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        });

        if (systemUser?.role?.rolePermissions?.length) {
          return systemUser.role.rolePermissions.map((rp: any) => rp.permission.key);
        }
      } catch (err) {
        console.warn("[RBAC DB] Database query failed, falling back to in-memory:", err);
      }
    }

    // In-memory fallback: convert legacy tags to granular keys
    const legacyPerms = getInMemoryPermissions(userId, normalizedRole);
    return legacyToGranular(legacyPerms);
  }

  /**
   * Check if user has a specific granular permission
   */
  async hasPermissionKey(userId: string | number, role: Role | string, key: string): Promise<boolean> {
    const normalizedRole = normalizeRole(role);

    // Zero-Trust: Students blocked
    if (isStudent(normalizedRole)) return false;

    // Supreme admins have everything
    if (isSupremeAdmin(normalizedRole) || isAdministrator(normalizedRole)) return true;

    const userKeys = await this.getUserPermissionKeys(userId, normalizedRole);
    return userKeys.includes(key);
  }

  /**
   * Synchronous permission check (uses in-memory store for speed)
   * For use in serverAuthGuard and other sync contexts
   */
  hasPermissionKeySync(userId: string | number, role: Role | string, key: string): boolean {
    const normalizedRole = normalizeRole(role);

    if (isStudent(normalizedRole)) return false;
    if (isSupremeAdmin(normalizedRole) || isAdministrator(normalizedRole)) return true;

    // Convert granular key to legacy tag and check in-memory
    const legacyTag = GRANULAR_TO_LEGACY[key];
    if (legacyTag) {
      const { hasCustomPermission } = require("./rbac");
      return hasCustomPermission(userId, normalizedRole, legacyTag);
    }

    // Check by module defaults
    const perm = GRANULAR_PERMISSIONS_CATALOG.find((p) => p.key === key);
    if (perm) {
      return perm.defaultRoles.includes(normalizedRole);
    }

    return false;
  }

  /**
   * Set all permissions for a user (bulk update)
   */
  async setUserPermissions(
    adminActor: { id: any; name: string; role: Role | string; email?: string },
    targetUser: { id: string | number; name: string; role: Role | string },
    permissionKeys: string[],
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const adminNorm = normalizeRole(adminActor.role);
    const targetNorm = normalizeRole(targetUser.role);

    if (!isAdministrator(adminNorm)) {
      return { success: false, message: "অননুমোদিত: শুধুমাত্র অ্যাডমিনিস্ট্রেটর পারমিশন পরিবর্তন করতে পারেন।" };
    }

    if (isStudent(targetNorm)) {
      return { success: false, message: "জিরো-ট্রাস্ট: শিক্ষার্থীদের পারমিশন প্রদান নিষিদ্ধ।" };
    }

    // Try database persistence
    if (this.isDbAvailable()) {
      try {
        const targetId = Number(targetUser.id);

        // Delete existing user permissions
        await prisma.userPermission.deleteMany({
          where: { userId: targetId },
        });

        // Find or create permission records
        for (const key of permissionKeys) {
          const perm = await prisma.permissionCatalog.findUnique({
            where: { key },
          });

          if (perm) {
            await prisma.userPermission.create({
              data: {
                userId: targetId,
                permissionId: perm.id,
                granted: true,
                grantedBy: adminActor.name,
                reason: reason || "Admin Configuration",
              },
            });
          }
        }

        // Record audit
        await prisma.securityAuditEntry.create({
          data: {
            actionType: "PERMISSION_GRANTED",
            actorId: Number(adminActor.id),
            actorName: adminActor.name,
            actorRole: adminNorm,
            actorEmail: adminActor.email,
            targetId: targetId,
            targetName: targetUser.name,
            targetRole: targetNorm,
            permissionKey: permissionKeys.join(", "),
            status: "MODIFIED",
            details: `Updated permissions for ${targetUser.name}: [${permissionKeys.join(", ")}]`,
            detailsBangla: `${targetUser.name}-এর পারমিশন তালিকা হালনাগাদ (${permissionKeys.length} টি পারমিশন)।`,
          },
        });
      } catch (err) {
        console.warn("[RBAC DB] Database write failed, falling back to in-memory:", err);
      }
    }

    // Also update in-memory store for immediate effect
    const legacyTags = granularToLegacy(permissionKeys);
    setInMemoryPermissions(
      { id: adminActor.id, name: adminActor.name, role: adminActor.role },
      { id: targetUser.id, name: targetUser.name, role: targetUser.role },
      legacyTags,
      reason
    );

    return {
      success: true,
      message: `${targetUser.name}-এর জন্য ${permissionKeys.length} টি পারমিশন সফলভাবে হালনাগাদ করা হয়েছে।`,
    };
  }

  /**
   * Seed the default permissions catalog and roles into database
   */
  async seedDefaultPermissions(): Promise<void> {
    if (!this.isDbAvailable()) return;

    try {
      // Seed Permission Catalog
      for (const perm of GRANULAR_PERMISSIONS_CATALOG) {
        await prisma.permissionCatalog.upsert({
          where: { key: perm.key },
          create: {
            key: perm.key,
            module: perm.module,
            action: perm.action,
            title: perm.title,
            titleBangla: perm.titleBangla,
            description: perm.description,
            descriptionBangla: perm.descriptionBangla,
            category: perm.category,
            riskLevel: perm.riskLevel,
          },
          update: {
            title: perm.title,
            titleBangla: perm.titleBangla,
          },
        });
      }

      // Seed Role Definitions
      const roles: Array<{
        name: string;
        displayName: string;
        displayNameBangla: string;
        level: number;
        isSystemRole: boolean;
      }> = [
        { name: "super_admin", displayName: "Super Administrator", displayNameBangla: "সুপার অ্যাডমিন", level: 100, isSystemRole: true },
        { name: "principal", displayName: "Principal", displayNameBangla: "অধ্যক্ষ", level: 90, isSystemRole: true },
        { name: "vice_principal", displayName: "Vice Principal", displayNameBangla: "উপাধ্যক্ষ", level: 80, isSystemRole: true },
        { name: "admin", displayName: "System Administrator", displayNameBangla: "সিস্টেম অ্যাডমিন", level: 70, isSystemRole: true },
        { name: "teacher", displayName: "Teacher / Instructor", displayNameBangla: "শিক্ষক / ইন্সট্রাক্টর", level: 50, isSystemRole: true },
        { name: "accountant", displayName: "Accountant", displayNameBangla: "হিসাবরক্ষক", level: 40, isSystemRole: true },
        { name: "staff", displayName: "Staff", displayNameBangla: "কর্মচারী", level: 30, isSystemRole: true },
        { name: "student", displayName: "Student", displayNameBangla: "শিক্ষার্থী", level: 10, isSystemRole: true },
        { name: "guardian", displayName: "Guardian", displayNameBangla: "অভিভাবক", level: 5, isSystemRole: true },
      ];

      for (const role of roles) {
        await prisma.roleDefinition.upsert({
          where: { name: role.name },
          create: role,
          update: { displayName: role.displayName, level: role.level },
        });
      }

      // Seed Role-Permission mappings
      for (const perm of GRANULAR_PERMISSIONS_CATALOG) {
        const permRecord = await prisma.permissionCatalog.findUnique({
          where: { key: perm.key },
        });
        if (!permRecord) continue;

        for (const roleName of perm.defaultRoles) {
          const roleRecord = await prisma.roleDefinition.findUnique({
            where: { name: roleName },
          });
          if (!roleRecord) continue;

          await prisma.rolePermission.upsert({
            where: {
              unique_role_permission: {
                roleId: roleRecord.id,
                permissionId: permRecord.id,
              },
            },
            create: {
              roleId: roleRecord.id,
              permissionId: permRecord.id,
              grantedBy: "System Seed",
            },
            update: {},
          });
        }
      }

      console.info("[RBAC DB] Default permissions and roles seeded successfully.");
    } catch (err) {
      console.warn("[RBAC DB] Seed failed (this is normal if tables don't exist yet):", err);
    }
  }

  /**
   * Get the full permissions catalog with user's current grants
   */
  async getPermissionsCatalogForUser(
    userId: string | number,
    role: Role
  ): Promise<{
    catalog: GranularPermission[];
    userGrantedKeys: string[];
  }> {
    const userGrantedKeys = await this.getUserPermissionKeys(userId, role);
    return {
      catalog: GRANULAR_PERMISSIONS_CATALOG,
      userGrantedKeys,
    };
  }
}

/**
 * Singleton export
 */
export const rbacService = RbacDatabaseService.getInstance();
