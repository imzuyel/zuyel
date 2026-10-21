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
    pathname === "/forgot-password" ||
    pathname.startsWith("/forgot-password/") ||
    pathname === "/reset-password" ||
    pathname.startsWith("/reset-password/") ||
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
  const cookieId =
    request.cookies.get("pgtsc_user_id")?.value ||
    request.cookies.get("ptsc_student_roll")?.value ||
    null;
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
      pathname.startsWith("/api/auth/forgot-password") ||
      pathname.startsWith("/api/auth/reset-password") ||
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

    // Student Self-Service API (Must only be accessed by authenticated students)
    if (pathname.startsWith("/api/student/")) {
      if (!isAuthenticated) {
        return NextResponse.json(
          {
            success: false,
            status: 401,
            error: "Unauthorized",
            code: "AUTH_REQUIRED",
            message: "শিক্ষার্থী প্রোফাইল এপিআইতে প্রবেশের জন্য লগইন করা আবশ্যক।",
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        );
      }

      if (!isStudentRole || isAuthorizedStaff) {
        return NextResponse.json(
          {
            success: false,
            status: 403,
            error: "Forbidden",
            code: "STUDENT_ONLY_API",
            message:
              "এই এন্ডপয়েন্টটি শুধুমাত্র শিক্ষার্থীদের নিজস্ব প্রোফাইলের জন্য নির্ধারিত। শিক্ষক বা প্রশাসনিক কর্মকর্তা হিসেবে ব্যাকএন্ড প্যানেল (/api/auth/profile) ব্যবহার করুন।",
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        );
      }

      return NextResponse.next();
    }

    // Backend Staff/Admin Profile API (Must only be accessed by authenticated staff)
    if (pathname.startsWith("/api/auth/profile")) {
      if (!isAuthenticated) {
        return NextResponse.json(
          {
            success: false,
            status: 401,
            error: "Unauthorized",
            code: "AUTH_REQUIRED",
            message: "প্রশাসনিক প্রোফাইল এপিআইতে প্রবেশের জন্য প্রাতিষ্ঠানিক লগইন প্রয়োজন।",
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
            message: "শিক্ষার্থীরা প্রশাসনিক স্টাফ প্রোফাইল বা ব্যাকএন্ড সেটিংস পরিবর্তনের অনুমতিপ্রাপ্ত নয়।",
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        );
      }

      return NextResponse.next();
    }

    // Sensitive Backend ERP and AI APIs
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

  // 3. FRONTEND STUDENT PORTAL ROUTES (Redirect to /login)
  if (pathname.startsWith("/student")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 4. PRIVATE ERP & ADMIN PAGE ROUTES (Redirect to /login?role=admin or Forbidden)
  const isPrivateErpPage =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/accounts") ||
    pathname.startsWith("/academic") ||
    pathname.startsWith("/faculty") ||
    pathname.startsWith("/students") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/examination") ||
    pathname.startsWith("/routine") ||
    pathname.startsWith("/communication") ||
    pathname.startsWith("/bteb-annual-khata") ||
    (pathname.startsWith("/live-quizzes") && !pathname.startsWith("/live-quizzes/join"));

  if (isPrivateErpPage) {
    // If completely unauthenticated, redirect to unified master login with return path
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("role", "admin");
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
    "/students/:path*",
    "/student/:path*",
    "/attendance/:path*",
    "/examination/:path*",
    "/routine/:path*",
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
    "/api/student/:path*",
    "/api/auth/profile/:path*",
    "/api/learning/:path*",
  ],
};
