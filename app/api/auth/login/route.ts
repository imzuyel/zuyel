import { NextRequest, NextResponse } from "next/server";
import { PRESET_USERS, UserProfile } from "@/context/AuthContext";
import { normalizeRole, recordSecurityAuditLog, Role } from "@/lib/rbac";
import { signSessionToken } from "@/lib/tokenService";
import { prisma, isPrismaAvailable, safePrismaQuery } from "@/lib/prisma";
import {
  verifyPassword,
  getCustomPassword,
} from "@/lib/passwordService";
import {
  getStudentAccountByRoll,
  UNIVERSAL_DEFAULT_PASSWORD,
} from "@/lib/studentIntelligenceStore";

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
    const body = await request.json().catch(() => ({}));
    const { identifier, password, role, rememberMe = true, source } = body;

    const trimmedId = (identifier || role || "").trim().toLowerCase();
    const trimmedPass = (password || "").trim();

    // 1. Validation check
    if (!trimmedId) {
      return NextResponse.json(
        {
          success: false,
          error: "ইউজারনেম, প্রাতিষ্ঠানিক ইমেইল বা আইডি প্রদান করুন।",
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

    // 2. Identify target user & verify credentials
    let user: UserProfile | null = null;
    let credentialsValid = false;

    // A. Check against Prisma Database if available
    if (isPrismaAvailable()) {
      try {
        // A1. Check Prisma SystemUser
        const sysUser = await safePrismaQuery<any>(
          (db) =>
            db.systemUser.findFirst({
              where: {
                OR: [
                  { email: trimmedId },
                  { email: `${trimmedId}@pgtsc.gov.bd` },
                  { mobile: trimmedId },
                ],
                isActive: true,
              },
              include: { role: true, faculty: true },
            }),
          null
        );

        if (sysUser) {
          const customPass = getCustomPassword(sysUser.email);
          const storedHash = customPass || sysUser.passwordHash;

          // Check stored hash or developmental defaults
          if (storedHash) {
            credentialsValid = verifyPassword(trimmedPass, storedHash);
          } else {
            // Default dev passwords if no hash set in DB
            credentialsValid =
              trimmedPass === "password" ||
              trimmedPass === "admin123" ||
              trimmedPass === "admin";
          }

          if (!credentialsValid) {
            return NextResponse.json(
              {
                success: false,
                error: "Invalid credentials. ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।",
              },
              { status: 401 }
            );
          }

          const resolvedRole = normalizeRole(
            sysUser.role?.name || sysUser.roleName || "admin"
          );

          user = {
            id: sysUser.id,
            email: sysUser.email,
            fullName: sysUser.fullName,
            nameBangla: sysUser.nameBangla || sysUser.fullName,
            role: resolvedRole,
            designation: sysUser.designation || "প্রশাসনিক কর্মকর্তা",
            department: sysUser.department || "প্রশাসন",
            mobile: sysUser.mobile || "01700-000000",
            avatarUrl:
              sysUser.avatarUrl ||
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          };
        }

        // A2. Check Prisma Faculty if not found in SystemUser
        if (!user) {
          const faculty = await safePrismaQuery<any>(
            (db) =>
              db.faculty.findFirst({
                where: {
                  OR: [
                    { email: trimmedId },
                    { email: `${trimmedId}@pgtsc.gov.bd` },
                    { employeeId: trimmedId },
                    { mobile: trimmedId },
                  ],
                },
                include: { systemUser: { include: { role: true } } },
              }),
            null
          );

          if (faculty) {
            const customPass =
              getCustomPassword(faculty.email) ||
              getCustomPassword(faculty.employeeId);
            const storedHash =
              customPass || faculty.systemUser?.passwordHash;

            if (storedHash) {
              credentialsValid = verifyPassword(trimmedPass, storedHash);
            } else {
              credentialsValid =
                trimmedPass === "password" ||
                trimmedPass === "admin123" ||
                trimmedPass === "teacher";
            }

            if (!credentialsValid) {
              return NextResponse.json(
                {
                  success: false,
                  error: "Invalid credentials. ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।",
                },
                { status: 401 }
              );
            }

            const rawRole =
              faculty.systemUser?.role?.name ||
              (faculty.type === "STAFF" ? "staff" : "teacher");

            user = {
              id: faculty.id,
              email: faculty.email,
              fullName: faculty.name,
              nameBangla: faculty.nameBangla || faculty.name,
              role: normalizeRole(rawRole),
              designation: faculty.designation,
              department: faculty.department,
              mobile: faculty.mobile,
              avatarUrl:
                faculty.photoUrl ||
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
            };
          }
        }

        // A3. Check Prisma Student if not found in Staff
        if (!user) {
          const student = await safePrismaQuery<any>(
            (db) =>
              db.student.findFirst({
                where: {
                  OR: [
                    { email: trimmedId },
                    { studentId: trimmedId },
                    { admissionNo: trimmedId },
                    { roll: parseInt(trimmedId, 10) || -1 },
                  ],
                },
                include: { class: true, trade: true },
              }),
            null
          );

          if (student) {
            const studentRoll = String(student.roll);
            const customPass =
              getCustomPassword(studentRoll) ||
              getCustomPassword(student.email || "");

            if (customPass) {
              credentialsValid = verifyPassword(trimmedPass, customPass);
            } else {
              credentialsValid =
                trimmedPass === "password" ||
                trimmedPass === UNIVERSAL_DEFAULT_PASSWORD || // "1234"
                trimmedPass === "123456";
            }

            if (!credentialsValid) {
              return NextResponse.json(
                {
                  success: false,
                  error: "Invalid credentials. রোল বা পাসওয়ার্ড সঠিক নয়।",
                },
                { status: 401 }
              );
            }

            user = {
              id: student.id,
              email: student.email || `student.${student.roll}@pgtsc.gov.bd`,
              fullName: student.name,
              nameBangla: student.nameBangla || student.name,
              role: "student",
              designation: `শিক্ষার্থী (${student.class?.name || "কারিগরি শাখা"})`,
              mobile: student.guardianMobile || "01700-000000",
              avatarUrl:
                student.photoUrl ||
                "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
              roll: student.roll,
              studentId: student.studentId,
            };
          }
        }
      } catch (dbErr) {
        console.warn("[Login API] Prisma lookup encountered an issue:", dbErr);
      }
    }

    // B. Fallback to PRESET_USERS & Student Intelligence Store
    if (!user) {
      // B1. Match against preset staff keys or emails
      for (const key of Object.keys(PRESET_USERS)) {
        const u = PRESET_USERS[key];
        const isKeyMatch = key.toLowerCase() === trimmedId;
        const isEmailMatch = u.email.toLowerCase() === trimmedId;
        const isNameMatch = u.fullName.toLowerCase() === trimmedId;
        const isMobileMatch =
          u.mobile.replace(/[^0-9]/g, "") === trimmedId.replace(/[^0-9]/g, "");

        if (isKeyMatch || isEmailMatch || isNameMatch || isMobileMatch) {
          user = u;
          break;
        }
      }

      // Check special aliases (e.g. "admin", "teacher", "principal", "zuyel")
      if (!user) {
        if (trimmedId === "admin" || trimmedId === "emp-002" || trimmedId === "emp-102") {
          user = PRESET_USERS.admin;
        } else if (
          trimmedId === "teacher" ||
          trimmedId.includes("hasan") ||
          trimmedId === "emp-003"
        ) {
          user = PRESET_USERS.teacher;
        } else if (
          trimmedId === "principal" ||
          trimmedId === "emp-001" ||
          trimmedId === "emp-101"
        ) {
          user = PRESET_USERS.principal;
        } else if (
          trimmedId === "zuyel" ||
          trimmedId === "emp-218" ||
          trimmedId === "zuyelrana"
        ) {
          user = PRESET_USERS.zuyel;
        } else if (
          trimmedId === "accountant" ||
          trimmedId === "accounts" ||
          trimmedId === "emp-006"
        ) {
          user = PRESET_USERS.accountant;
        } else if (
          trimmedId === "superadmin" ||
          trimmedId === "super_admin" ||
          trimmedId === "emp-099"
        ) {
          user = PRESET_USERS.super_admin;
        } else if (role && PRESET_USERS[role.toLowerCase()]) {
          user = PRESET_USERS[role.toLowerCase()];
        }
      }

      // B2. If found in preset staff, verify password securely
      if (user && user.role !== "student") {
        const customPass =
          getCustomPassword(user.email) ||
          getCustomPassword(user.role) ||
          getCustomPassword(trimmedId);

        if (customPass) {
          credentialsValid = verifyPassword(trimmedPass, customPass);
        } else {
          // Standard accepted passwords for staff in development & testing
          credentialsValid =
            trimmedPass === "password" ||
            trimmedPass === "admin123" ||
            trimmedPass === "password123" ||
            trimmedPass === "admin" ||
            trimmedPass === "teacher123";
        }

        if (!credentialsValid) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid credentials. ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।",
            },
            { status: 401 }
          );
        }
      }

      // B3. Check Student Intelligence Store for roll numbers
      if (!user) {
        const studentAcc = getStudentAccountByRoll(trimmedId);
        if (studentAcc) {
          const customPass =
            getCustomPassword(studentAcc.rollNumber) ||
            studentAcc.password;

          if (customPass) {
            credentialsValid = verifyPassword(trimmedPass, customPass);
          } else {
            credentialsValid =
              trimmedPass === "password" ||
              trimmedPass === UNIVERSAL_DEFAULT_PASSWORD || // "1234"
              trimmedPass === "123456";
          }

          if (!credentialsValid) {
            return NextResponse.json(
              {
                success: false,
                error: "Invalid credentials. রোল বা পাসওয়ার্ড সঠিক নয়।",
              },
              { status: 401 }
            );
          }

          user = {
            id: parseInt(studentAcc.rollNumber, 10) || 101,
            email: `student.${studentAcc.rollNumber}@pgtsc.gov.bd`,
            fullName: studentAcc.studentName,
            nameBangla: studentAcc.studentName,
            role: "student",
            designation: `শিক্ষার্থী (${studentAcc.classLevel})`,
            mobile: "01711-000004",
            avatarUrl:
              "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
            trade: studentAcc.trade,
            roll: studentAcc.rollNumber,
          };
        }
      }
    }

    // If still no valid user found
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid credentials. প্রদত্ত তথ্যানুযায়ী কোনো অনুমোদিত অ্যাকাউন্ট পাওয়া যায়নি।",
        },
        { status: 401 }
      );
    }

    const normalizedUserRole = normalizeRole(user.role);

    // 3. Zero-Trust Access Exclusion: Block students from Administrative Backend
    const isFromAdminPortal =
      source === "admin" ||
      request.headers.get("referer")?.includes("/admin/login");

    if (normalizedUserRole === "student" && isFromAdminPortal) {
      recordSecurityAuditLog({
        actionType: "STUDENT_ACCESS_BLOCKED",
        actorRole: normalizedUserRole,
        actorName: user.nameBangla || user.fullName,
        actorEmail: user.email,
        routePath: "/admin/login",
        status: "BLOCKED",
        details:
          "Student attempted to log in to administrative backend portal via /admin/login.",
        detailsBangla:
          "শিক্ষার্থী আইডি দিয়ে প্রশাসনিক ব্যাকএন্ডে লগইনের চেষ্টা প্রতিহত করা হয়েছে (Zero-Trust Enforcement)।",
      });

      return NextResponse.json(
        {
          success: false,
          code: "STUDENT_BACKEND_EXCLUSION",
          error:
            "অ্যাক্সেস সংরক্ষিত: পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের প্রাতিষ্ঠানিক নিরাপত্তা নীতি অনুসারে শিক্ষার্থী অ্যাকাউন্ট দিয়ে প্রশাসনিক ব্যাকএন্ডে প্রবেশ নিষিদ্ধ। অনুগ্রহ করে শিক্ষার্থী পোর্টাল (/login) ব্যবহার করুন।",
        },
        { status: 403 }
      );
    }

    // 4. Determine role-based redirection URL
    let redirectUrl = "/admin";
    if (normalizedUserRole === "student") {
      redirectUrl = "/student/profile";
    } else if (normalizedUserRole === "accountant") {
      redirectUrl = "/admin"; // or /accounts
    } else if (AUTHORIZED_STAFF_ROLES.has(normalizedUserRole)) {
      redirectUrl = "/admin";
    }

    // 5. Security audit log
    recordSecurityAuditLog({
      actionType: "ROLE_SWITCH",
      actorRole: normalizedUserRole,
      actorName: user.nameBangla || user.fullName,
      actorEmail: user.email,
      routePath: isFromAdminPortal ? "/admin/login" : "/login",
      status: "ALLOWED",
      details: `Successful authenticated login for ${user.fullName} (${user.role}) via credentials verification.`,
      detailsBangla: `${user.nameBangla || user.fullName} সফলভাবে লগইন করেছেন।`,
    });

    // 6. Generate cryptographically signed session token & cookies
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
      message: `স্বাগতম, ${user.nameBangla || user.fullName}! সফলভাবে লগইন সম্পন্ন হয়েছে।`,
      user,
      role: normalizedUserRole,
      token: authToken,
      redirectUrl,
    });

    // Protected HttpOnly session cookie
    response.cookies.set("pgtsc_auth_token", authToken, {
      path: "/",
      maxAge,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    // Public readable cookies for Edge middleware & client hydration
    response.cookies.set("pgtsc_user_role", normalizedUserRole, {
      path: "/",
      maxAge,
      sameSite: "lax",
      httpOnly: false,
    });

    response.cookies.set("ptsc_user_role", normalizedUserRole, {
      path: "/",
      maxAge,
      sameSite: "lax",
      httpOnly: false,
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

    if (normalizedUserRole === "student" && (user.roll || user.id)) {
      response.cookies.set("ptsc_student_roll", String(user.roll || user.id), {
        path: "/",
        maxAge,
        sameSite: "lax",
        httpOnly: false,
      });
      response.cookies.set("pgtsc_student_roll", String(user.roll || user.id), {
        path: "/",
        maxAge,
        sameSite: "lax",
        httpOnly: false,
      });
    }

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
