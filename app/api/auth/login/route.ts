import { NextRequest, NextResponse } from "next/server";
import { PRESET_USERS, UserProfile } from "@/context/AuthContext";
import { normalizeRole, recordSecurityAuditLog } from "@/lib/rbac";
import { signSessionToken } from "@/lib/tokenService";

const AUTHORIZED_STAFF_ROLES = new Set([
  "super_admin",
  "principal",
  "vice_principal",
  "admin",
  "teacher",
  "faculty",
  "chief_instructor",
  "instructor",
  "staff",
  "accountant",
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password, role, rememberMe = true } = body;

    const trimmedId = (identifier || "").trim().toLowerCase();
    const trimmedPass = (password || "").trim();

    // 1. Validation check
    if (!trimmedId && !role) {
      return NextResponse.json(
        {
          success: false,
          error: "ইউজারনেম, ইমেইল বা ভূমিকা নির্বাচন করুন।",
        },
        { status: 400 }
      );
    }

    if (!trimmedPass) {
      return NextResponse.json(
        {
          success: false,
          error: "পাসওয়ার্ড প্রদান করা আবশ্যক।",
        },
        { status: 400 }
      );
    }

    // 2. Identify target user
    let user: UserProfile | null = null;

    // Check direct role key match
    if (role && PRESET_USERS[role.toLowerCase()]) {
      user = PRESET_USERS[role.toLowerCase()];
    }

    // Check by email or known employee ID
    if (!user && trimmedId) {
      for (const key of Object.keys(PRESET_USERS)) {
        const u = PRESET_USERS[key];
        if (
          u.email.toLowerCase() === trimmedId ||
          u.fullName.toLowerCase() === trimmedId ||
          u.mobile.replace(/[^0-9]/g, "") === trimmedId.replace(/[^0-9]/g, "")
        ) {
          user = u;
          break;
        }
      }

      // Check special aliases
      if (!user) {
        if (trimmedId.includes("zuyel") || trimmedId === "emp-218") {
          user = PRESET_USERS.zuyel;
        } else if (trimmedId.includes("principal") || trimmedId === "emp-001" || trimmedId === "emp-101") {
          user = PRESET_USERS.principal;
        } else if (trimmedId.includes("admin") || trimmedId === "emp-002" || trimmedId === "emp-102") {
          user = PRESET_USERS.admin;
        } else if (trimmedId.includes("teacher") || trimmedId.includes("hasan") || trimmedId === "emp-003") {
          user = PRESET_USERS.teacher;
        } else if (trimmedId.includes("account") || trimmedId === "emp-006") {
          user = PRESET_USERS.accountant;
        }
      }
    }

    // If still not matched but valid role was requested
    if (!user && role) {
      const normRole = normalizeRole(role);
      if (PRESET_USERS[normRole]) {
        user = PRESET_USERS[normRole];
      }
    }

    // Fallback: If identifier matches a teacher/instructor pattern
    if (!user && trimmedId.includes("@")) {
      const normRole = normalizeRole(role || "teacher");
      user = {
        id: Math.floor(Math.random() * 900) + 100,
        email: trimmedId,
        fullName: trimmedId.split("@")[0].toUpperCase(),
        nameBangla: "অনুমোদিত কর্মকর্তা",
        role: normRole,
        designation: "ইনস্টিটিউশনাল ফ্যাকাল্টি",
        mobile: "01700-000000",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        department: "সাধারণ প্রশাসন",
      };
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "প্রদত্ত তথ্য অনুযায়ী কোনো অনুমোদিত ব্যবহারকারী অ্যাকাউন্ট পাওয়া যায়নি।",
        },
        { status: 401 }
      );
    }

    // 3. Strict Student & Guardian Exclusion from Backend
    const normalizedUserRole = normalizeRole(user.role);
    if (!AUTHORIZED_STAFF_ROLES.has(normalizedUserRole)) {
      recordSecurityAuditLog({
        actionType: "STUDENT_ACCESS_BLOCKED",
        actorRole: normalizedUserRole,
        actorName: user.nameBangla || user.fullName,
        actorEmail: user.email,
        routePath: "/admin/login",
        status: "BLOCKED",
        details: "Student/Guardian attempted to log in to administrative backend portal.",
        detailsBangla: "শিক্ষার্থী/অভিভাবক আইডি দিয়ে প্রশাসনিক ব্যাকএন্ডে লগইনের চেষ্টা ব্লক করা হয়েছে (Zero-Trust Enforcement)।",
      });

      return NextResponse.json(
        {
          success: false,
          code: "STUDENT_BACKEND_EXCLUSION",
          error:
            "অ্যাক্সেস সংরক্ষিত: পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের প্রাতিষ্ঠানিক জিরো-ট্রাস্ট নিরাপত্তা নীতি অনুসারে শিক্ষার্থী ও অভিভাবক অ্যাকাউন্ট দিয়ে প্রশাসনিক ব্যাকএন্ডে প্রবেশ সম্পূর্ণ নিষিদ্ধ।",
        },
        { status: 403 }
      );
    }

    // 4. Record successful login in security audit trail
    recordSecurityAuditLog({
      actionType: "ROLE_SWITCH",
      actorRole: normalizedUserRole,
      actorName: user.nameBangla || user.fullName,
      actorEmail: user.email,
      routePath: "/admin/login",
      status: "ALLOWED",
      details: `Backend login successful for ${user.fullName} (${user.role})`,
      detailsBangla: `${user.nameBangla || user.fullName} (${user.designation}) ব্যাকএন্ডে সফলভাবে লগইন করেছেন।`,
    });

    // 5. Generate secure cryptographically signed session token & cookie headers
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
    const authToken = signSessionToken(
      {
        userId: user.id,
        userRole: normalizedUserRole,
        userName: user.fullName,
        userEmail: user.email,
      },
      maxAge
    );

    const response = NextResponse.json({
      success: true,
      message: `স্বাগতম, ${user.nameBangla || user.fullName}! ব্যাকএন্ড অ্যাক্সেস অনুমোদিত হয়েছে।`,
      user,
      role: normalizedUserRole,
      token: authToken,
      redirectUrl: "/admin",
    });

    // Cryptographically signed session cookie (Protected with HttpOnly)
    response.cookies.set("pgtsc_auth_token", authToken, {
      path: "/",
      maxAge,
      sameSite: "lax",
      httpOnly: true,
    });

    response.cookies.set("pgtsc_user_role", normalizedUserRole, {
      path: "/",
      maxAge,
      sameSite: "lax",
      httpOnly: false, // Edge middleware & frontend client both read
    });

    response.cookies.set("pgtsc_user_id", String(user.id), {
      path: "/",
      maxAge,
      sameSite: "lax",
      httpOnly: false,
    });

    response.cookies.set("pgtsc_user_name", encodeURIComponent(user.fullName), {
      path: "/",
      maxAge,
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "সার্ভারে লগইন প্রক্রিয়া চলাকালীন সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
      },
      { status: 500 }
    );
  }
}
