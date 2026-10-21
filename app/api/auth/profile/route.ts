import { NextRequest, NextResponse } from "next/server";
import {
  verifyBackendAuthorization,
  createApiErrorResponse,
  extractRequestIdentity,
} from "@/lib/serverAuthGuard";
import {
  isStudent,
  isSupremeAdmin,
  isAdministrator,
  getUserPermissions,
  recordSecurityAuditLog,
  Role,
  normalizeRole,
  AUTHORIZED_STAFF_ROLES,
} from "@/lib/rbac";
import { PRESET_USERS, UserProfile } from "@/context/AuthContext";
import { institutionalDb } from "@/lib/database";
import { safePrismaQuery, isPrismaAvailable } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // 1. Strict staff-only authentication check
  const guard = verifyBackendAuthorization(request, {
    endpointName: "/api/auth/profile",
  });

  if (!guard.authorized) {
    return guard.errorResponse!;
  }

  // Zero-trust verification: students can never access staff profile API
  if (isStudent(guard.identity.userRole)) {
    return NextResponse.json(
      {
        success: false,
        status: 403,
        error: "Forbidden",
        code: "STUDENT_ACCESS_DENIED",
        message: "শিক্ষার্থীরা প্রশাসনিক স্টাফ প্রোফাইল বা ব্যাকএন্ড সেটিংস অ্যাক্সেস করতে পারবে না।",
      },
      { status: 403 }
    );
  }

  try {
    const userId = guard.identity.userId;
    const userRole = guard.identity.userRole;

    // Resolve staff user record from PRESET_USERS or institutionalDb.faculty
    let staffUser: UserProfile =
      (userRole && PRESET_USERS[userRole]) ||
      PRESET_USERS.super_admin ||
      PRESET_USERS.principal ||
      PRESET_USERS.admin;

    // Check if ID matches a known preset
    for (const key of Object.keys(PRESET_USERS)) {
      const candidate = PRESET_USERS[key];
      if (candidate && String(candidate.id) === String(userId)) {
        staffUser = candidate;
        break;
      }
    }

    // Check faculty database
    const facultyMatch = institutionalDb.faculty.find(
      (f) => String(f.id) === String(userId) || (Boolean(f.email) && Boolean(guard.identity.userEmail) && f.email?.toLowerCase() === guard.identity.userEmail?.toLowerCase())
    );

    if (facultyMatch) {
      staffUser = {
        id: facultyMatch.id,
        email: facultyMatch.email,
        fullName: facultyMatch.name,
        nameBangla: facultyMatch.nameBangla,
        role: userRole,
        designation: facultyMatch.designation,
        department: facultyMatch.department,
        mobile: facultyMatch.mobile,
        avatarUrl:
          facultyMatch.photoUrl ||
          staffUser?.avatarUrl ||
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        trade: facultyMatch.tradeCode,
      };
    }

    if (!staffUser || !staffUser.id) {
      staffUser = {
        id: typeof userId === "number" ? userId : parseInt(String(userId), 10) || 99,
        email: guard.identity.userEmail || "admin@pgtsc.gov.bd",
        fullName: guard.identity.userName || "System Administrator",
        nameBangla: "সিস্টেম অ্যাডমিনিস্ট্রেটর",
        role: userRole || "super_admin",
        designation: "প্রশাসনিক কর্মকর্তা",
        department: "প্রশাসন",
        mobile: "01711-000000",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      };
    }

    // Retrieve active granular permissions for staff member
    const permissions = getUserPermissions(staffUser.id, staffUser.role);

    return NextResponse.json({
      success: true,
      user: {
        id: staffUser.id,
        fullName: staffUser.fullName,
        nameBangla: staffUser.nameBangla,
        email: staffUser.email,
        mobile: staffUser.mobile,
        role: staffUser.role,
        designation: staffUser.designation,
        department: staffUser.department,
        avatarUrl: staffUser.avatarUrl,
        trade: staffUser.trade,
        address: (staffUser as any).address || "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ ক্যাম্পাস, পঞ্চগড়",
        permissions,
        isSupremeAdmin: isSupremeAdmin(staffUser.role),
        isAdministrator: isAdministrator(staffUser.role),
      },
    });
  } catch (error) {
    console.error("GET /api/auth/profile error:", error);
    return createApiErrorResponse(error, "স্টাফ প্রোফাইল ডেটা লোড করতে ব্যর্থ হয়েছে।", 500);
  }
}

export async function PUT(request: NextRequest) {
  // 1. Strict staff-only authentication check
  const guard = verifyBackendAuthorization(request, {
    endpointName: "/api/auth/profile",
  });

  if (!guard.authorized) {
    return guard.errorResponse!;
  }

  // Zero-trust verification: students can never access staff profile API
  if (isStudent(guard.identity.userRole)) {
    return NextResponse.json(
      {
        success: false,
        status: 403,
        error: "Forbidden",
        code: "STUDENT_ACCESS_DENIED",
        message: "শিক্ষার্থীরা প্রশাসনিক স্টাফ প্রোফাইল বা ব্যাকএন্ড সেটিংস অ্যাক্সেস করতে পারবে না।",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const currentRole = guard.identity.userRole;
    const currentUserId = guard.identity.userId;

    // 2. PRIVILEGE ESCALATION PROTECTION
    // Disallow altering own role unless caller is already a verified super_admin
    if (body.role || body.userRole || body.roleName || body.level) {
      const requestedRole = normalizeRole(body.role || body.userRole || body.roleName);
      if (requestedRole !== currentRole && !isSupremeAdmin(currentRole)) {
        recordSecurityAuditLog({
          actionType: "SECURITY_POLICY_OVERRIDE",
          actorRole: currentRole,
          actorName: guard.identity.userName,
          actorEmail: guard.identity.userEmail,
          routePath: "/api/auth/profile",
          ipAddress: guard.identity.ipAddress,
          status: "BLOCKED",
          details: `Privilege escalation attempt intercepted: User '${guard.identity.userName}' (${currentRole}) attempted to elevate role to '${requestedRole}'.`,
          detailsBangla: `সুযোগ বৃদ্ধির অপচেষ্টা প্রতিহত: ব্যবহারকারী '${guard.identity.userName}' (${currentRole}) নিজের রোল '${requestedRole}'-এ রূপান্তরের চেষ্টা করেছিল।`,
        });

        return NextResponse.json(
          {
            success: false,
            status: 403,
            code: "PRIVILEGE_ESCALATION_DENIED",
            error:
              "সুযোগ বৃদ্ধির অপচেষ্টা প্রতিহত: নিজস্ব প্রোফাইল থেকে ভূমিকা (Role) বা প্রশাসনিক প্রিভিলেজ পরিবর্তন করা সম্পূর্ণ নিষিদ্ধ। শুধুমাত্র গভর্নিং কাউন্সিল বা সুপার অ্যাডমিন পদবি পরিবর্তন করতে পারেন।",
          },
          { status: 403 }
        );
      }
    }

    // 3. Extract and sanitize allowed editable staff fields
    const updates: Partial<UserProfile> = {};
    if (typeof body.fullName === "string" && body.fullName.trim()) updates.fullName = body.fullName.trim();
    if (typeof body.nameBangla === "string" && body.nameBangla.trim()) updates.nameBangla = body.nameBangla.trim();
    if (typeof body.mobile === "string") updates.mobile = body.mobile.trim();
    if (typeof body.email === "string" && body.email.trim()) updates.email = body.email.trim();
    if (typeof body.designation === "string" && body.designation.trim()) updates.designation = body.designation.trim();
    if (typeof body.department === "string" && body.department.trim()) updates.department = body.department.trim();
    if (typeof body.avatarUrl === "string" && body.avatarUrl.trim()) updates.avatarUrl = body.avatarUrl.trim();
    if (typeof body.address === "string") updates.address = body.address.trim();

    // 4. Handle Secure Password Change
    let passwordUpdated = false;
    if (body.newPassword) {
      const newPassword = String(body.newPassword).trim();
      if (newPassword.length < 6) {
        return NextResponse.json(
          {
            success: false,
            status: 400,
            code: "WEAK_PASSWORD",
            error: "নতুন পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।",
          },
          { status: 400 }
        );
      }
      passwordUpdated = true;

      // Update in Prisma SystemUser if available
      if (isPrismaAvailable()) {
        await safePrismaQuery(async (p) => {
          const numId = parseInt(String(currentUserId), 10);
          return await p.systemUser.updateMany({
            where: {
              OR: [
                { email: guard.identity.userEmail || "" },
                { id: isNaN(numId) ? -1 : numId },
              ],
            },
            data: {
              passwordHash: newPassword,
            },
          });
        }, null);
      }

      recordSecurityAuditLog({
        actionType: "ROLE_SWITCH",
        actorRole: currentRole,
        actorName: updates.nameBangla || updates.fullName || guard.identity.userName,
        actorEmail: updates.email || guard.identity.userEmail,
        routePath: "/api/auth/profile",
        ipAddress: guard.identity.ipAddress,
        status: "ALLOWED",
        details: `Account credentials updated (password changed) for ${guard.identity.userName} (${currentRole})`,
        detailsBangla: `${guard.identity.userName} (${currentRole}) অ্যাকাউন্টের নিরাপত্তা পাসওয়ার্ড সফলভাবে পরিবর্তন করেছেন।`,
      });
    }

    // 5. Update in PRESET_USERS in-memory registry
    if (PRESET_USERS[currentRole]) {
      PRESET_USERS[currentRole] = {
        ...PRESET_USERS[currentRole],
        ...updates,
      };
    }

    // 6. Update institutionalDb.faculty if matching member exists
    const facultyIdx = institutionalDb.faculty.findIndex(
      (f) => String(f.id) === String(currentUserId) || (Boolean(f.email) && Boolean(guard.identity.userEmail) && f.email?.toLowerCase() === guard.identity.userEmail?.toLowerCase())
    );

    if (facultyIdx !== -1) {
      institutionalDb.faculty[facultyIdx] = {
        ...institutionalDb.faculty[facultyIdx],
        ...(updates.fullName && { name: updates.fullName }),
        ...(updates.nameBangla && { nameBangla: updates.nameBangla }),
        ...(updates.mobile && { mobile: updates.mobile }),
        ...(updates.email && { email: updates.email }),
        ...(updates.designation && { designation: updates.designation }),
        ...(updates.department && { department: updates.department }),
        ...(updates.avatarUrl && { photoUrl: updates.avatarUrl }),
      };
    }

    // 7. Update Prisma if database available
    if (isPrismaAvailable()) {
      await safePrismaQuery(async (p) => {
        const numId = parseInt(String(currentUserId), 10);
        return await p.faculty.updateMany({
          where: {
            OR: [
              { id: isNaN(numId) ? -1 : numId },
              { email: guard.identity.userEmail || "" },
            ],
          },
          data: {
            ...(updates.fullName && { name: updates.fullName }),
            ...(updates.nameBangla && { nameBangla: updates.nameBangla }),
            ...(updates.mobile && { mobile: updates.mobile }),
            ...(updates.email && { email: updates.email }),
            ...(updates.designation && { designation: updates.designation }),
            ...(updates.department && { department: updates.department }),
            ...(updates.avatarUrl && { photoUrl: updates.avatarUrl }),
          },
        });
      }, null);
    }

    // 8. Record security audit log for credential/profile update
    recordSecurityAuditLog({
      actionType: "ROLE_SWITCH",
      actorRole: currentRole,
      actorName: updates.nameBangla || updates.fullName || guard.identity.userName,
      actorEmail: updates.email || guard.identity.userEmail,
      routePath: "/api/auth/profile",
      ipAddress: guard.identity.ipAddress,
      status: "ALLOWED",
      details: `Staff profile updated for ${guard.identity.userName} (${currentRole})`,
      detailsBangla: `${guard.identity.userName} (${currentRole}) তাদের প্রাতিষ্ঠানিক প্রোফাইল সেটিংস হালনাগাদ করেছেন।`,
    });

    const updatedUser = {
      id: currentUserId,
      role: currentRole,
      ...updates,
      permissions: getUserPermissions(currentUserId, currentRole),
    };

    return NextResponse.json({
      success: true,
      message: passwordUpdated
        ? "স্টাফ প্রোফাইল ও নিরাপত্তা পাসওয়ার্ড সফলভাবে সংরক্ষণ করা হয়েছে।"
        : "স্টাফ প্রোফাইল ও নিরাপত্তা সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে।",
      user: updatedUser,
      passwordUpdated,
    });
  } catch (error) {
    return createApiErrorResponse(error, "প্রোফাইল তথ্য আপডেট করতে সমস্যা হয়েছে।", 500);
  }
}
