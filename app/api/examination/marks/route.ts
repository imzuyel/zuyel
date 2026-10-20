import { NextResponse } from "next/server";
import { examinationEngine } from "@/lib/examinationEngine";
import { verifyBackendAuthorization } from "@/lib/serverAuthGuard";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = Number(searchParams.get("examId"));
    const classId = Number(searchParams.get("classId"));
    const rawTradeId = searchParams.get("tradeId");
    const section = searchParams.get("section") || "all";
    const subjectCode = searchParams.get("subjectCode") || undefined;

    if (!examId || !classId) {
      return NextResponse.json(
        { success: false, error: "পরীক্ষা ও শ্রেণি নির্বাচন আবশ্যক।" },
        { status: 400 }
      );
    }

    const tradeId = rawTradeId && rawTradeId !== "all" ? Number(rawTradeId) : undefined;

    const data = examinationEngine.getMarksWorkspaceData(
      examId,
      classId,
      tradeId,
      section,
      subjectCode
    );

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // SECURITY RBAC ENFORCEMENT: Zero-Trust for Students & Conditional Access for Teachers
  const auth = verifyBackendAuthorization(req, {
    requiredPermission: "edit_marks",
    endpointName: "/api/examination/marks",
  });
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const {
      examId,
      classId,
      tradeId,
      section = "all",
      subjectCode,
      entries,
      operator = "Teacher",
      isFinalSubmit = false,
      reason = "নম্বর সংরক্ষণ",
    } = body;

    if (!examId || !classId || !subjectCode || !Array.isArray(entries)) {
      return NextResponse.json(
        { success: false, error: "পরীক্ষা, শ্রেণি, বিষয় কোড এবং শিক্ষার্থীদের নম্বর তালিকা আবশ্যক।" },
        { status: 400 }
      );
    }

    const tradeIdNum = tradeId && tradeId !== "all" ? Number(tradeId) : undefined;

    const result = examinationEngine.saveMarks(
      Number(examId),
      Number(classId),
      tradeIdNum,
      section,
      subjectCode,
      entries,
      operator,
      isFinalSubmit,
      reason
    );

    return NextResponse.json({
      success: true,
      savedCount: result.savedCount,
      exam: result.exam,
      message: isFinalSubmit
        ? "সকল নম্বর সফলভাবে যাচাই ও চূড়ান্ত লক করা হয়েছে।"
        : `${result.savedCount} জন শিক্ষার্থীর নম্বর সফলভাবে ড্রাফট সংরক্ষিত হয়েছে।`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
