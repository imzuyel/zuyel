import { NextRequest, NextResponse } from "next/server";
import { PRESET_USERS } from "@/lib/presetUsers";
import { extractRequestIdentity } from "@/lib/serverAuthGuard";

export async function GET(request: NextRequest) {
  const identity = extractRequestIdentity(request);

  if (!identity.isAuthenticated || !identity.isTokenVerified) {
    return NextResponse.json({
      authenticated: false,
      role: "student",
      userId: null,
      user: null,
    });
  }

  const user = PRESET_USERS[identity.userRole] || {
    id: identity.userId,
    role: identity.userRole,
    fullName: identity.userName,
    email: identity.userEmail || "",
  };

  return NextResponse.json({
    authenticated: true,
    role: identity.userRole,
    userId: identity.userId,
    user,
  });
}
