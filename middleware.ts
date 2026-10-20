import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract role from custom headers or cookies
  const headerRole = request.headers.get("x-user-role");
  const cookieRole =
    request.cookies.get("pgtsc_user_role")?.value ||
    request.cookies.get("ptsc_user_role")?.value ||
    null;

  const rawRole = (headerRole || cookieRole || "").toLowerCase().trim();
  const isStudentRole = rawRole === "student" || rawRole === "guest" || rawRole === "guardian" || rawRole === "parent";

  // 1. Direct Page Route Interception for /admin & /live-quizzes (Live Host Control)
  // Always permit access to the backend login portal
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const isAuthorizedStaff = AUTHORIZED_STAFF_ROLES.has(rawRole);
    if (!isAuthorizedStaff || isStudentRole) {
      const loginUrl = new URL("/admin/login", request.url);
      if (pathname !== "/admin") {
        loginUrl.searchParams.set("callbackUrl", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/live-quizzes")) {
    if (isStudentRole) {
      // Direct ordinary students to the live quiz participant arena instead of host controls
      const joinUrl = new URL("/quiz/join", request.url);
      return NextResponse.redirect(joinUrl);
    }
  }

  // 2. Direct API Protection for sensitive administrative mutation endpoints
  const isProtectedMutation =
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/ai/questions") ||
    pathname.startsWith("/api/examination/marks") ||
    pathname.startsWith("/api/examination/tabulation") ||
    pathname.startsWith("/api/examination/audit") ||
    (pathname.startsWith("/api/attendance") && request.method !== "GET") ||
    (pathname === "/api/learning/courses" && request.method !== "GET") ||
    (pathname === "/api/learning/chapters" && request.method !== "GET") ||
    (pathname.startsWith("/api/learning/items/") && !pathname.endsWith("/submit-quiz") && !pathname.endsWith("/complete-blog") && request.method !== "GET");

  if (isProtectedMutation && isStudentRole) {
    return NextResponse.json(
      {
        success: false,
        status: 403,
        error: "Forbidden",
        code: "STUDENT_ACCESS_DENIED",
        message:
          "অ্যাক্সেস প্রত্যাখ্যান করা হয়েছে: শিক্ষার্থীরা প্রশাসনিক ব্যাকএন্ড বা ডেটা মিউটেশন এন্ডপয়েন্টে প্রবেশের অনুমতিপ্রাপ্ত নয় (Zero-Trust Student Exclusion Policy)।",
        timestamp: new Date().toISOString(),
      },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/live-quizzes/:path*",
    "/api/admin/:path*",
    "/api/ai/questions/:path*",
    "/api/examination/:path*",
    "/api/attendance/:path*",
    "/api/learning/:path*",
  ],
};
