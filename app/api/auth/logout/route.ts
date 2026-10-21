import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return handleLogout();
}

export async function GET(request: NextRequest) {
  return handleLogout();
}

function handleLogout() {
  const response = NextResponse.json({
    success: true,
    message: "সফলভাবে লগআউট করা হয়েছে।",
    timestamp: new Date().toISOString(),
  });

  // Cookies to invalidate completely
  const authCookieNames = [
    "pgtsc_auth_token",
    "pgtsc_user_role",
    "ptsc_user_role",
    "pgtsc_user_id",
    "ptsc_user_id",
    "pgtsc_user_name",
    "ptsc_user_name",
    "ptsc_student_roll",
    "pgtsc_student_roll",
    "pgtsc_is_logged_in",
  ];

  // Invalidate HTTP-only signed session token
  response.cookies.set("pgtsc_auth_token", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    sameSite: "lax",
    httpOnly: true,
  });

  // Invalidate all other session and role cookies
  for (const name of authCookieNames) {
    if (name === "pgtsc_auth_token") continue;
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      sameSite: "lax",
    });
  }

  return response;
}
