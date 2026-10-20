import { NextRequest, NextResponse } from "next/server";
import {
  getSecurityAuditLogs,
  recordSecurityAuditLog,
  SecurityAuditLog,
} from "@/lib/rbac";
import { verifyBackendAuthorization, requireAdmin } from "@/lib/serverAuthGuard";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  // Guard check: Must be administrative personnel or have view_audit_logs permission
  const auth = verifyBackendAuthorization(req, {
    requiredPermission: "view_audit_logs",
    endpointName: "/api/admin/audit-logs",
  });

  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  const { searchParams } = new URL(req.url);
  const actionType = searchParams.get("actionType") || undefined;
  const status = searchParams.get("status") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 100;

  try {
    const logs = getSecurityAuditLogs({
      actionType,
      status,
      limit,
    });

    return apiSuccess(logs, {
      extraKeys: {
        logs,
        totalCount: logs.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "অডিট লগ লোড করতে ব্যর্থ হয়েছে" });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req, "/api/admin/audit-logs");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const {
      actionType,
      actorRole = "system",
      actorName = "System Sentinel",
      targetUserId,
      targetUserName,
      targetUserRole,
      permissionTag,
      routePath,
      status = "MODIFIED",
      details,
      detailsBangla,
    } = body;

    const newLog = recordSecurityAuditLog({
      actionType,
      actorRole,
      actorName,
      targetUserId,
      targetUserName,
      targetUserRole,
      permissionTag,
      routePath,
      status,
      details: details || "Security event registered",
      detailsBangla: detailsBangla || "নিরাপত্তা ইভেন্ট রেকর্ড করা হয়েছে।",
    });

    return apiSuccess(newLog, {
      message: "নিরাপত্তা অডিট লগ সফলভাবে সংরক্ষিত হয়েছে।",
      extraKeys: {
        log: newLog,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "অডিট লগ সংরক্ষণ করতে ব্যর্থ হয়েছে" });
  }
}
