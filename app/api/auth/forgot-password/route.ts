import { NextRequest, NextResponse } from "next/server";
import { prisma, safePrismaQuery, isPrismaAvailable } from "@/lib/prisma";
import { PRESET_USERS } from "@/lib/presetUsers";
import { createPasswordResetToken } from "@/lib/passwordService";
import { recordSecurityAuditLog } from "@/lib/rbac";
import { getStudentAccountByRoll } from "@/lib/studentIntelligenceStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawIdentifier = (
      body.identifier ||
      body.email ||
      body.emailOrId ||
      body.username ||
      ""
    ).trim();

    if (!rawIdentifier) {
      return NextResponse.json(
        {
          success: false,
          error: "অনুগ্রহ করে আপনার প্রাতিষ্ঠানিক ইমেইল, এমপ্লয়ি আইডি বা রোল নম্বর লিখুন।",
        },
        { status: 400 }
      );
    }

    const trimmedId = rawIdentifier.toLowerCase();
    let targetEmail = "";
    let targetName = "";
    let targetRole = "user";
    let targetUserId: string | number = 0;
    let userFound = false;

    // 1. Search in Prisma DB (SystemUser, Faculty, Student)
    if (isPrismaAvailable()) {
      try {
        const sysUser = await safePrismaQuery<any>(
          (db) =>
            db.systemUser.findFirst({
              where: {
                OR: [{ email: trimmedId }, { mobile: trimmedId }],
              },
              include: { role: true },
            }),
          null
        );

        if (sysUser) {
          targetEmail = sysUser.email;
          targetName = sysUser.fullName;
          targetRole = sysUser.role?.name || sysUser.roleName || "teacher";
          targetUserId = sysUser.id;
          userFound = true;
        }

        if (!userFound) {
          const faculty = await safePrismaQuery<any>(
            (db) =>
              db.faculty.findFirst({
                where: {
                  OR: [
                    { email: trimmedId },
                    { employeeId: trimmedId },
                    { mobile: trimmedId },
                  ],
                },
              }),
            null
          );

          if (faculty) {
            targetEmail = faculty.email;
            targetName = faculty.name;
            targetRole = faculty.type === "STAFF" ? "staff" : "teacher";
            targetUserId = faculty.id;
            userFound = true;
          }
        }

        if (!userFound) {
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
              }),
            null
          );

          if (student) {
            targetEmail = student.email || `student.${student.roll}@pgtsc.gov.bd`;
            targetName = student.nameBangla || student.name;
            targetRole = "student";
            targetUserId = student.id;
            userFound = true;
          }
        }
      } catch (dbErr) {
        console.warn("[ForgotPassword API] DB query failed, falling back to memory:", dbErr);
      }
    }

    // 2. Fallback check in PRESET_USERS & Student Intelligence Store
    if (!userFound) {
      // Check preset staff/admin personas
      for (const key of Object.keys(PRESET_USERS)) {
        const u = PRESET_USERS[key];
        if (
          key.toLowerCase() === trimmedId ||
          u.email.toLowerCase() === trimmedId ||
          u.fullName.toLowerCase() === trimmedId ||
          u.mobile.replace(/[^0-9]/g, "") === trimmedId.replace(/[^0-9]/g, "")
        ) {
          targetEmail = u.email;
          targetName = u.nameBangla || u.fullName;
          targetRole = u.role;
          targetUserId = u.id;
          userFound = true;
          break;
        }
      }

      // Check student roll in intelligence store
      if (!userFound) {
        const studentAcc = getStudentAccountByRoll(trimmedId);
        if (studentAcc) {
          targetEmail = `student.${studentAcc.rollNumber}@pgtsc.gov.bd`;
          targetName = studentAcc.studentName;
          targetRole = "student";
          targetUserId = studentAcc.rollNumber;
          userFound = true;
        }
      }

      // Special convenience aliases for common development testing
      if (!userFound) {
        if (trimmedId.includes("admin")) {
          const u = PRESET_USERS.admin;
          targetEmail = u.email;
          targetName = u.fullName;
          targetRole = u.role;
          targetUserId = u.id;
          userFound = true;
        } else if (trimmedId.includes("teacher")) {
          const u = PRESET_USERS.teacher;
          targetEmail = u.email;
          targetName = u.fullName;
          targetRole = u.role;
          targetUserId = u.id;
          userFound = true;
        } else if (trimmedId.includes("principal")) {
          const u = PRESET_USERS.principal;
          targetEmail = u.email;
          targetName = u.fullName;
          targetRole = u.role;
          targetUserId = u.id;
          userFound = true;
        }
      }
    }

    // In production, prevent user enumeration by giving a generic success response
    const isDev = process.env.NODE_ENV === "development";

    if (!userFound) {
      if (isDev) {
        return NextResponse.json(
          {
            success: false,
            error: "প্রদত্ত ইমেইল বা আইডি দিয়ে কোনো সক্রিয় অ্যাকাউন্ট পাওয়া যায়নি। (Dev Hinweis: Try 'admin@pgtsc.gov.bd' or 'admin')",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "যদি এই তথ্যটি আমাদের সিস্টেমে নিবন্ধিত থাকে, তবে পাসওয়ার্ড রিসেটের লিংক/কোড পাঠানো হয়েছে।",
      });
    }

    // 3. Generate cryptographic reset token & 6-digit OTP
    const { token, code, expiresAt } = createPasswordResetToken(
      targetEmail,
      targetUserId,
      targetRole,
      900 // 15 mins
    );

    // 4. Record audit log
    recordSecurityAuditLog({
      actionType: "PASSWORD_RESET_REQUESTED",
      actorRole: targetRole,
      actorName: targetName,
      actorEmail: targetEmail,
      routePath: "/api/auth/forgot-password",
      status: "ALLOWED",
      details: `Password reset token requested for ${targetEmail}. Expires at ${expiresAt.toISOString()}`,
      detailsBangla: `${targetName} (${targetEmail})-এর জন্য পাসওয়ার্ড রিসেট টোকেন তৈরি করা হয়েছে।`,
    });

    const resetUrl = `/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(
      targetEmail
    )}`;

    return NextResponse.json({
      success: true,
      message: "পাসওয়ার্ড রিসেটের যাচাইকরণ কোড ও লিংক সফলভাবে তৈরি হয়েছে।",
      email: targetEmail,
      name: targetName,
      // Provide developer testing helpers in development mode
      ...(isDev
        ? {
            devResetToken: token,
            devOtpCode: code,
            devResetUrl: resetUrl,
            expiresAt: expiresAt.toISOString(),
          }
        : {}),
    });
  } catch (error: any) {
    console.error("Forgot Password API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "পাসওয়ার্ড রিসেট প্রসেসিংয়ের সময় সমস্যা দেখা দিয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
      },
      { status: 500 }
    );
  }
}
