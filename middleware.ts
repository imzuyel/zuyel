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

  // 1. PUBLIC ROUTES (Always Permit through without restriction)
  if (
    pathname === "/" ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/notices") ||
    pathname.startsWith("/gallery") ||
    pathname.startsWith("/downloads") ||
    pathname.startsWith("/results") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/documents/verify") ||
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/") ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/forbidden" ||
    pathname.startsWith("/quiz/join") ||
    pathname.startsWith("/live-quizzes/join") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Extract authentication cookies & headers
  const headerRole = request.headers.get("x-user-role");
  const cookieRole =
    request.cookies.get("pgtsc_user_role")?.value ||
    request.cookies.get("ptsc_user_role")?.value ||
    null;
  const cookieId = request.cookies.get("pgtsc_user_id")?.value || null;
  const authToken = request.cookies.get("pgtsc_auth_token")?.value || null;

  const rawRole = (headerRole || cookieRole || "").toLowerCase().trim();
  const isAuthenticated = Boolean(authToken || (cookieId && cookieRole));
  const isAuthorizedStaff = AUTHORIZED_STAFF_ROLES.has(rawRole);
  const isStudentRole =
    rawRole === "student" || rawRole === "guest" || rawRole === "guardian" || rawRole === "parent" || !rawRole;

  // 2. API ROUTE PROTECTION (MUST ALWAYS RETURN JSON 401/403, NEVER HTML REDIRECT)
  if (pathname.startsWith("/api/")) {
    // Whitelist public API endpoints
    const isPublicApi =
      pathname.startsWith("/api/auth/login") ||
      pathname.startsWith("/api/auth/logout") ||
      pathname.startsWith("/api/documents/public-verify") ||
      pathname.startsWith("/api/documents/verify") ||
      (pathname === "/api/results" && request.method === "GET") ||
      (pathname === "/api/notices" && request.method === "GET") ||
      pathname.startsWith("/api/live-quizzes/join") ||
      pathname.endsWith("/join") ||
      pathname.endsWith("/answers") ||
      pathname.endsWith("/state") ||
      pathname.endsWith("/realtime");

    if (isPublicApi) {
      return NextResponse.next();
    }

    const isSensitiveApi =
      pathname.startsWith("/api/admin") ||
      pathname.startsWith("/api/ai") ||
      pathname.startsWith("/api/examination") ||
      pathname.startsWith("/api/attendance") ||
      pathname.startsWith("/api/accounts") ||
      pathname.startsWith("/api/communication") ||
      pathname.startsWith("/api/students/bulk") ||
      pathname.startsWith("/api/students/rollover");

    if (isSensitiveApi) {
      if (!isAuthenticated) {
        return NextResponse.json(
          {
            success: false,
            status: 401,
            error: "Unauthorized",
            code: "AUTH_REQUIRED",
            message: "এই এন্ডপয়েন্টে প্রবেশের জন্য প্রাতিষ্ঠানিক লগইন প্রয়োজন।",
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        );
      }

      if (isStudentRole || !isAuthorizedStaff) {
        return NextResponse.json(
          {
            success: false,
            status: 403,
            error: "Forbidden",
            code: "STUDENT_ACCESS_DENIED",
            message: "শিক্ষার্থীরা প্রশাসনিক ব্যাকএন্ড বা সংবেদনশীল ডেটা মিউটেশনে প্রবেশের অনুমতিপ্রাপ্ত নয় (Zero-Trust Policy)।",
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  }

  // 3. PRIVATE ERP & ADMIN PAGE ROUTES (Redirect to Login or Forbidden)
  const isPrivateErpPage =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/accounts") ||
    pathname.startsWith("/academic") ||
    pathname.startsWith("/faculty") ||
    pathname.startsWith("/communication") ||
    pathname.startsWith("/bteb-annual-khata") ||
    (pathname.startsWith("/live-quizzes") && !pathname.startsWith("/live-quizzes/join"));

  if (isPrivateErpPage) {
    // If completely unauthenticated, redirect to admin login with return path
    if (!isAuthenticated) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If authenticated but role is student/guest, redirect to safe 403 forbidden page
    if (isStudentRole || !isAuthorizedStaff) {
      const forbiddenUrl = new URL("/forbidden", request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/accounts/:path*",
    "/academic/:path*",
    "/faculty/:path*",
    "/communication/:path*",
    "/bteb-annual-khata/:path*",
    "/live-quizzes/:path*",
    "/api/admin/:path*",
    "/api/ai/:path*",
    "/api/examination/:path*",
    "/api/attendance/:path*",
    "/api/accounts/:path*",
    "/api/communication/:path*",
    "/api/students/:path*",
    "/api/learning/:path*",
  ],
};
