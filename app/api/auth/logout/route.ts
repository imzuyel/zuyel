import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "সফলভাবে লগআউট করা হয়েছে।",
  });

  // Clear authentication token
  response.cookies.set("pgtsc_auth_token", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    httpOnly: true,
  });

  // Reset cookies to student guest mode
  response.cookies.set("pgtsc_user_role", "student", {
    path: "/",
    maxAge: 86400,
    sameSite: "lax",
  });

  response.cookies.set("pgtsc_user_id", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });

  response.cookies.set("pgtsc_user_name", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });

  return response;
}
