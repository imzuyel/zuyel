"use client";

/**
 * PermissionGuard Component for PTSC ERP
 * 
 * Dynamic UI rendering based on granular permissions.
 * Supports both new granular format ("quiz:create") and legacy format ("manage_quizzes").
 * 
 * Usage:
 *   <PermissionGuard permission="quiz:create">
 *     <CreateQuizButton />
 *   </PermissionGuard>
 * 
 *   <PermissionGuard permission="attendance:manage" fallback={<LockedBanner />}>
 *     <AttendanceForm />
 *   </PermissionGuard>
 * 
 *   <PermissionGuard permissions={["quiz:create", "quiz:edit"]} requireAll={false}>
 *     <QuizPanel />
 *   </PermissionGuard>
 */

import React, { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  normalizeRole,
  isSupremeAdmin,
  isAdministrator,
  isStudent,
  hasCustomPermission,
  CustomPermissionTag,
  type Role,
} from "@/lib/rbac";
import { ShieldAlert } from "lucide-react";

// Mapping from granular keys to legacy CustomPermissionTag
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

interface PermissionGuardProps {
  /** Single granular permission key (e.g., "quiz:create") */
  permission?: string;
  /** Multiple permission keys for complex checks */
  permissions?: string[];
  /** If true, ALL permissions must be granted. If false (default), ANY one is sufficient */
  requireAll?: boolean;
  /** Legacy module-based permission check */
  module?: string;
  /** Legacy action-based permission check */
  action?: "view" | "create" | "edit" | "delete" | "approve" | "export" | "publish" | "manage";
  /** Legacy custom permission tag */
  customTag?: CustomPermissionTag;
  /** Content to render when permission is granted */
  children: React.ReactNode;
  /** Content to render when permission is denied (defaults to nothing) */
  fallback?: React.ReactNode;
  /** Show a styled access-denied card instead of nothing */
  showDeniedCard?: boolean;
  /** Silent mode - if true, renders nothing on denial (no error UI) */
  silent?: boolean;
}

/**
 * Check if a user has a specific granular permission key
 */
function checkGranularPermission(
  userId: string | number,
  role: Role,
  permissionKey: string
): boolean {
  // Supreme admins always have access
  if (isSupremeAdmin(role) || isAdministrator(role)) return true;

  // Students never have admin permissions
  if (isStudent(role)) return false;

  // View-only permissions are generally allowed for authenticated users
  if (permissionKey.endsWith(":view")) {
    // Some view permissions are restricted (audit logs)
    const restrictedViews = ["audit:view"];
    if (!restrictedViews.includes(permissionKey)) return true;
  }

  // Map granular key to legacy tag
  const legacyTag = GRANULAR_TO_LEGACY[permissionKey];
  if (legacyTag) {
    return hasCustomPermission(userId, role, legacyTag);
  }

  // Default: check if the permission exists in the user's defaults
  return false;
}

/**
 * Hook: Check if current user has a specific permission
 */
export function useHasPermission(permissionKey: string): boolean {
  const { currentUser } = useAuth();

  return useMemo(() => {
    if (!currentUser) return false;
    const role = normalizeRole(currentUser.role);
    const userId = currentUser.id;
    return checkGranularPermission(userId, role, permissionKey);
  }, [currentUser, permissionKey]);
}

/**
 * Hook: Check multiple permissions at once
 */
export function useHasPermissions(
  permissionKeys: string[],
  requireAll: boolean = false
): boolean {
  const { currentUser } = useAuth();

  return useMemo(() => {
    if (!currentUser || !permissionKeys.length) return false;
    const role = normalizeRole(currentUser.role);
    const userId = currentUser.id;

    const results = permissionKeys.map((key) =>
      checkGranularPermission(userId, role, key)
    );

    return requireAll
      ? results.every(Boolean)
      : results.some(Boolean);
  }, [currentUser, permissionKeys, requireAll]);
}

/**
 * PermissionGuard - Wrapper component for dynamic permission-based UI rendering
 * 
 * @example
 * // Single permission check
 * <PermissionGuard permission="quiz:create">
 *   <Button>Create Quiz</Button>
 * </PermissionGuard>
 * 
 * @example
 * // Multiple permissions (any)
 * <PermissionGuard permissions={["quiz:create", "quiz:edit"]}>
 *   <QuizEditor />
 * </PermissionGuard>
 * 
 * @example
 * // With denied card UI
 * <PermissionGuard permission="fee:manage" showDeniedCard>
 *   <FeeCollectionForm />
 * </PermissionGuard>
 */
export default function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  module,
  action = "view",
  customTag,
  children,
  fallback = null,
  showDeniedCard = false,
  silent = false,
}: PermissionGuardProps) {
  const { currentUser, hasPermission: hasLegacyPermission, hasCustomPermission: hasLegacyCustomPerm } = useAuth();

  const isAllowed = useMemo(() => {
    if (!currentUser) return false;
    const role = normalizeRole(currentUser.role);
    const userId = currentUser.id;

    // Granular permission check (new format)
    if (permission) {
      return checkGranularPermission(userId, role, permission);
    }

    // Multiple granular permissions
    if (permissions && permissions.length > 0) {
      const results = permissions.map((key) =>
        checkGranularPermission(userId, role, key)
      );
      return requireAll ? results.every(Boolean) : results.some(Boolean);
    }

    // Legacy custom tag check
    if (customTag) {
      return hasLegacyCustomPerm(customTag);
    }

    // Legacy module/action check
    if (module) {
      return hasLegacyPermission(module, action as any);
    }

    // No permission specified - allow by default
    return true;
  }, [currentUser, permission, permissions, requireAll, module, action, customTag]);

  if (isAllowed) {
    return <>{children}</>;
  }

  // Render denied state
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showDeniedCard) {
    return <AccessDeniedCard permissionKey={permission || permissions?.[0] || customTag || "unknown"} />;
  }

  if (silent) {
    return null;
  }

  return null;
}

/**
 * Styled Access Denied Card
 */
function AccessDeniedCard({ permissionKey }: { permissionKey: string }) {
  return (
    <div className="p-6 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
          সংরক্ষিত এলাকা
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          এই ফিচারটি ব্যবহারের জন্য আপনার অ্যাকাউন্টে{" "}
          <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-mono text-[10px]">
            {permissionKey}
          </code>{" "}
          পারমিশন প্রয়োজন। অধ্যক্ষ বা অ্যাডমিনিস্ট্রেটরের সাথে যোগাযোগ করুন।
        </p>
      </div>
    </div>
  );
}

/**
 * Export for direct use
 */
export { PermissionGuard };
export type { PermissionGuardProps };
