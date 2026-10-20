import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { sendSmsGateway, globalSmsLogs, formatSmsTemplate } from "@/lib/smsGatewayEngine";
import { requireAdmin } from "@/lib/serverAuthGuard";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req, "/api/communication/sms/send");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    return NextResponse.json({
      success: true,
      logs: globalSmsLogs
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch SMS logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req, "/api/communication/sms/send");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const {
      targetAudience = "absent",
      selectedTrade = "IT Support & IoT",
      templateType = "custom",
      message = "",
      individualPhone = "",
      studentName = "শিক্ষার্থী"
    } = body || {};

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, message: "SMS message text is required" },
        { status: 400 }
      );
    }

    // Determine target recipient list
    let recipients: { phone: string; name: string; studentName: string }[] = [];

    if (targetAudience === "individual") {
      if (!individualPhone) {
        return NextResponse.json(
          { success: false, message: "Individual phone number is required" },
          { status: 400 }
        );
      }
      recipients.push({
        phone: individualPhone,
        name: "অভিভাবক",
        studentName: studentName || "শিক্ষার্থী"
      });
    } else {
      // Collect students from institutionalDb or mock sample
      const allStudents = institutionalDb.students || [];

      let filtered = allStudents;
      if (targetAudience === "absent") {
        filtered = allStudents.filter((s: any) => s.isPresentToday === false);
        if (filtered.length === 0) {
          // Fallback sample if none marked absent
          filtered = [allStudents[0]];
        }
      } else if (targetAudience === "trade") {
        filtered = allStudents.filter((s: any) => s.tradeName === selectedTrade || s.tradeCode === selectedTrade);
        if (filtered.length === 0) {
          filtered = allStudents.slice(0, 3);
        }
      }

      recipients = filtered.map((s: any) => ({
        phone: s.guardianPhone || s.mobile || "01700000000",
        name: s.guardianName || `${s.name}-এর অভিভাবক`,
        studentName: s.name
      }));
    }

    // Remove duplicate phone numbers
    const uniqueRecipients = Array.from(new Map(recipients.map(item => [item.phone, item])).values());

    let sentCount = 0;
    let totalCost = 0;

    for (const rec of uniqueRecipients) {
      // Format message with individual replacement
      const formattedMsg = formatSmsTemplate(message, {
        student_name: rec.studentName,
        roll: "১০৪",
        trade: selectedTrade,
        gpa: "৪.৮৮",
        exam_name: "অর্ধবার্ষিক পরীক্ষা"
      });

      const log = await sendSmsGateway(
        rec.phone,
        formattedMsg,
        templateType,
        rec.studentName,
        rec.name
      );

      sentCount++;
      totalCost += log.cost;
    }

    return NextResponse.json({
      success: true,
      message: `${sentCount} SMS successfully dispatched`,
      sentCount,
      totalCost,
      logs: globalSmsLogs.slice(0, 20)
    });
  } catch (error: any) {
    console.error("[SMS API Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send SMS" },
      { status: 500 }
    );
  }
}
