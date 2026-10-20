import { NextRequest, NextResponse } from "next/server";
import {
  getUserPermissions,
  grantCustomPermission,
  revokeCustomPermission,
  setDynamicUserPermissions,
  PERMISSION_DEFINITIONS,
  ALL_CUSTOM_PERMISSIONS,
  CustomPermissionTag,
  Role,
  normalizeRole,
  isAdministrator,
  isStudent,
} from "@/lib/rbac";
import {
  GRANULAR_PERMISSIONS_CATALOG,
  ALL_GRANULAR_PERMISSION_KEYS,
  rbacService,
  legacyToGranular,
  granularToLegacy,
  type GranularPermission,
} from "@/lib/rbac-db";
import { verifyBackendAuthorization, requireAdmin } from "@/lib/serverAuthGuard";
import { institutionalDb } from "@/lib/database";

// =====================================================
// GET /api/admin/permissions
// Returns: users list + full permissions catalog
// =====================================================
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req, "/api/admin/permissions");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    // Build user list from facultyMember records in institutionalDb
    const facultyList = institutionalDb.faculty || [];

    const mappedUsers = await Promise.all(
      facultyList.map(async (f: any) => {
        // Determine role
        let role: Role = f.type === "faculty" ? "teacher" : "staff";
        if (f.id === 1) role = "principal";
        if (f.id === 37 || f.employeeId === "EMP-218") role = "admin";

        // Get legacy permissions
        const legacyPerms =
          role === "principal" || role === "admin"
            ? [...ALL_CUSTOM_PERMISSIONS]
            : getUserPermissions(f.id, role);

        // Convert to granular keys
        const granularKeys = legacyToGranular(legacyPerms);

        return {
          id: f.id,
          employeeId: f.employeeId,
          name: f.name,
          nameBangla: f.nameBangla,
          designation: f.designation,
          department: f.department,
          tradeCode: f.tradeCode,
          type: f.type,
          role,
          permissions: legacyPerms,           // Legacy string[] for backward compat
          granularPermissions: granularKeys,   // New granular keys
          isStudent: false,
        };
      })
    );

    // Core profiles (admin + principal always present)
    const coreProfiles = [
      {
        id: 1,
        employeeId: "EMP-101",
        name: "Engr. Md. Rafiqul Islam",
        nameBangla: "প্রকৌ. মো. রফিকুল ইসলাম",
        designation: "অধ্যক্ষ (ভারপ্রাপ্ত)",
        department: "প্রশাসন ও একাডেমিক",
        role: "principal" as Role,
        permissions: [...ALL_CUSTOM_PERMISSIONS],
        granularPermissions: [...ALL_GRANULAR_PERMISSION_KEYS],
        isStudent: false,
      },
      {
        id: 37,
        employeeId: "EMP-218",
        name: "Md. Zuyel Rana",
        nameBangla: "মোহাম্মদ জুয়েল রানা",
        designation: "জুনিয়র ইন্সট্রাক্টর (কম্পিউটার) ও সিস্টেম অ্যাডমিন",
        department: "আইটি সাপোর্ট অ্যান্ড আইওটি",
        tradeCode: "IT-IOT",
        role: "admin" as Role,
        permissions: [...ALL_CUSTOM_PERMISSIONS],
        granularPermissions: [...ALL_GRANULAR_PERMISSION_KEYS],
        isStudent: false,
      },
    ];

    // Merge, avoiding duplicates
    const finalUsers = [...coreProfiles];
    mappedUsers.forEach((u: any) => {
      if (!finalUsers.some((p) => p.id === u.id || p.employeeId === u.employeeId)) {
        finalUsers.push(u);
      }
    });

    // Group catalog by category for frontend convenience
    const catalogByCategory = GRANULAR_PERMISSIONS_CATALOG.reduce(
      (acc, p) => {
        if (!acc[p.category]) acc[p.category] = [];
        acc[p.category].push(p);
        return acc;
      },
      {} as Record<string, GranularPermission[]>
    );

    return NextResponse.json({
      success: true,
      // Legacy fields (backward compat with existing page)
      definitions: PERMISSION_DEFINITIONS,
      permissionsCatalog: PERMISSION_DEFINITIONS,
      // New granular catalog
      granularCatalog: GRANULAR_PERMISSIONS_CATALOG,
      catalogByCategory,
      allGranularKeys: ALL_GRANULAR_PERMISSION_KEYS,
      allTags: ALL_CUSTOM_PERMISSIONS,
      users: finalUsers,
      totalUsers: finalUsers.length,
      policy: {
        zeroTrustStudentPolicy: "ACTIVE_IMMUTABLE",
        supremeAdminControl: "ACTIVE",
        dynamicDelegationEngine: "ACTIVE",
        granularPermissionsEngine: "ACTIVE",
      },
    });
  } catch (error: any) {
    console.error("[permissions GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve permissions" },
      { status: 500 }
    );
  }
}

// =====================================================
// POST /api/admin/permissions
// Actions: grant | revoke | set_permissions | set_granular
// =====================================================
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req, "/api/admin/permissions");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const {
      action,
      targetUserId,
      targetUserName,
      targetRole,
      permissionTag,
      permissions,
      granularKeys,
      reason,
    } = body;

    const actor = {
      id: auth.identity.userId,
      name: auth.identity.userName,
      role: auth.identity.userRole,
      email: auth.identity.userEmail,
    };

    const target = {
      id: targetUserId,
      name: targetUserName || `User #${targetUserId}`,
      role: (targetRole as Role) || "teacher",
    };

    // Zero-Trust Student Exclusion
    if (isStudent(normalizeRole(target.role))) {
      return NextResponse.json(
        {
          success: false,
          status: 403,
          error: "Forbidden",
          code: "STUDENT_ACCESS_DENIED",
          message:
            "জিরো-ট্রাস্ট শিক্ষার্থী সুরক্ষা নীতি: শিক্ষার্থীদের প্রশাসনিক পারমিশন প্রদান সম্পূর্ণ নিষিদ্ধ।",
        },
        { status: 403 }
      );
    }

    // ── Action: set_granular (new granular keys array) ──
    if (action === "set_granular") {
      if (!Array.isArray(granularKeys)) {
        return NextResponse.json(
          { success: false, error: "granularKeys must be an array of permission keys" },
          { status: 400 }
        );
      }

      // Validate all keys exist in catalog
      const validKeys = granularKeys.filter((k: string) =>
        ALL_GRANULAR_PERMISSION_KEYS.includes(k)
      );

      const res = await rbacService.setUserPermissions(actor, target, validKeys, reason);

      // Also update legacy in-memory for immediate effect
      const legacyTags = granularToLegacy(validKeys);
      setDynamicUserPermissions(actor, target, legacyTags, reason);

      return NextResponse.json({ ...res, granularKeys: validKeys });
    }

    // ── Action: set_permissions (legacy tags array) ──
    if (action === "set_permissions") {
      if (!Array.isArray(permissions)) {
        return NextResponse.json(
          { success: false, error: "permissions must be an array of tags" },
          { status: 400 }
        );
      }
      const res = setDynamicUserPermissions(
        actor,
        target,
        permissions as CustomPermissionTag[],
        reason
      );

      // Convert and persist granular equivalent
      const granularEquiv = legacyToGranular(permissions as CustomPermissionTag[]);
      await rbacService.setUserPermissions(actor, target, granularEquiv, reason).catch(() => {});

      return NextResponse.json(res);
    }

    // ── Action: grant (single permission tag) ──
    if (action === "grant") {
      if (!permissionTag) {
        return NextResponse.json(
          { success: false, error: "permissionTag is required" },
          { status: 400 }
        );
      }
      const res = grantCustomPermission(actor, target, permissionTag as CustomPermissionTag, reason);
      return NextResponse.json(res);
    }

    // ── Action: revoke (single permission tag) ──
    if (action === "revoke") {
      if (!permissionTag) {
        return NextResponse.json(
          { success: false, error: "permissionTag is required" },
          { status: 400 }
        );
      }
      const res = revokeCustomPermission(
        actor,
        target,
        permissionTag as CustomPermissionTag,
        reason
      );
      return NextResponse.json(res);
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Invalid action. Supported: grant, revoke, set_permissions, set_granular",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[permissions POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update permission" },
      { status: 500 }
    );
  }
}