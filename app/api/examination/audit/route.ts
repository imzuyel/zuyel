import { NextResponse } from "next/server";
import { examinationEngine } from "@/lib/examinationEngine";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const action = searchParams.get("action") || undefined;
    const search = searchParams.get("search") || undefined;

    const filters: any = {};
    if (examId) filters.examId = Number(examId);
    if (action) filters.action = action;
    if (search) filters.search = search;

    const logs = examinationEngine.getAuditLogs(filters);

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
