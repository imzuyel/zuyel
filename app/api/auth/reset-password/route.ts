import { NextRequest, NextResponse } from "next/server";
import {
  verifyPasswordResetToken,
  consumePasswordResetToken,
  updateUserPassword,
} from "@/lib/passwordService";
import { recordSecurityAuditLog } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token, code, email, newPassword, confirmPassword } = body;

    const tokenOrCode = (token || code || "").trim();
    const cleanPassword = (newPassword || "").trim();
    const cleanConfirm = (confirmPassword || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();

    // 1. Password validation
    if (!cleanPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "নতুন পাসওয়ার্ড প্রদান করা আবশ্যক।",
        },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 4) {
      return NextResponse.json(
        {
          success: false,
          error: "পাসওয়ার্ডের দৈর্ঘ্য কমপক্ষে ৪ ডিজিট বা অক্ষরের হতে হবে।",
        },
        { status: 400 }
      );
    }

    if (cleanConfirm && cleanPassword !== cleanConfirm) {
      return NextResponse.json(
        {
          success: false,
          error: "উভয় পাসওয়ার্ড হুবহু মেলেনি। অনুগ্রহ করে সতর্কতার সাথে মিলিয়ে লিখুন।",
        },
        { status: 400 }
      );
    }

    if (!tokenOrCode) {
      return NextResponse.json(
        {
          success: false,
          error: "রিসেট টোকেন বা যাচাইকরণ কোড প্রদান করুন।",
        },
        { status: 400 }
      );
    }

    // 2. Cryptographic token / OTP verification
    const verification = verifyPasswordResetToken(tokenOrCode, cleanEmail);
    if (!verification.valid || !verification.email) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error || "টোকেন বা যাচাইকরণ কোডটি অবৈধ বা মেয়াদোত্তীর্ণ।",
        },
        { status: 400 }
      );
    }

    const targetAccountEmail = verification.email;

    // 3. Update the password in Prisma and secure memory caches
    const updateResult = await updateUserPassword(
      targetAccountEmail,
      cleanPassword
    );

    if (!updateResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: updateResult.message,
        },
        { status: 500 }
      );
    }

    // 4. Invalidate the token/code to prevent replay attacks
    consumePasswordResetToken(tokenOrCode, targetAccountEmail);

    // 5. Audit log
    recordSecurityAuditLog({
      actionType: "PASSWORD_RESET_SUCCESS",
      actorRole: verification.role || "user",
      actorName: targetAccountEmail,
      actorEmail: targetAccountEmail,
      routePath: "/api/auth/reset-password",
      status: "ALLOWED",
      details: `Password changed successfully via reset flow for ${targetAccountEmail}`,
      detailsBangla: `${targetAccountEmail}-এর পাসওয়ার্ড সফলভাবে পুনর্নির্ধারণ করা হয়েছে।`,
    });

    const isStudent = verification.role === "student";
    const redirectUrl = isStudent ? "/login?role=student" : "/login?role=admin";

    return NextResponse.json({
      success: true,
      message:
        "আপনার নতুন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে! এখন নতুন পাসওয়ার্ড ব্যবহার করে লগইন করতে পারেন।",
      redirectUrl,
      role: verification.role,
    });
  } catch (error: any) {
    console.error("Reset Password API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "পাসওয়ার্ড সংরক্ষণের সময় সার্ভারে সমস্যা দেখা দিয়েছে।",
      },
      { status: 500 }
    );
  }
}
