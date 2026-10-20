import { NextRequest, NextResponse } from "next/server";
import { PRESET_USERS } from "@/context/AuthContext";
import { normalizeRole } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const headerRole = request.headers.get("x-user-role");
  const cookieRole = request.cookies.get("pgtsc_user_role")?.value;
  const cookieId = request.cookies.get("pgtsc_user_id")?.value;

  const rawRole = (headerRole || cookieRole || "student").toLowerCase().trim();
  const normalizedRole = normalizeRole(rawRole);

  const user = PRESET_USERS[normalizedRole] || PRESET_USERS.student;

  return NextResponse.json({
    authenticated: normalizedRole !== "student",
    role: normalizedRole,
    userId: cookieId || user.id,
    user,
  });
}
