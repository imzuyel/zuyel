import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { sendSmsGateway, globalSmsLogs, formatSmsTemplate } from "@/lib/smsGatewayEngine";
import { requireTeacherOrAdmin } from "@/lib/serverAuthGuard";
import { getHybridSmsLogs, getHybridStore } from "@/lib/hybridStorageEngine";

export async function GET(req: NextRequest) {
  const auth = requireTeacherOrAdmin(req, "/api/communication/sms/send");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const hybridLogs = getHybridSmsLogs();
    const seenIds = new Set<string>();
    const mergedLogs: any[] = [];
    for (const log of [...hybridLogs, ...globalSmsLogs]) {
      if (log && log.id && !seenIds.has(String(log.id))) {
        seenIds.add(String(log.id));
        mergedLogs.push(log);
      }
    }

    return NextResponse.json({
      success: true,
      logs: mergedLogs
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch SMS logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = requireTeacherOrAdmin(req, "/api/communication/sms/send");
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
      studentName = "শিক্ষার্থী",
      recipients: customRecipients = []
    } = body || {};

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, message: "SMS message text is required" },
        { status: 400 }
      );
    }

    // Determine target recipient list
    let recipients: { phone: string; name: string; studentName: string; score?: string | number; quizTitle?: string }[] = [];

    if (Array.isArray(customRecipients) && customRecipients.length > 0) {
      recipients = customRecipients.map((r: any) => ({
        phone: r.phone || r.guardianPhone || "01700000000",
        name: r.name || r.guardianName || `${r.studentName || "শিক্ষার্থী"}-এর অভিভাবক`,
        studentName: r.studentName || "শিক্ষার্থী",
        score: r.score,
        quizTitle: r.quizTitle
      }));
    } else if (targetAudience === "individual") {
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
      // Collect students from hybridStore or institutionalDb
      const hybridStore = getHybridStore();
      const allStudents: any[] = hybridStore.students?.length ? hybridStore.students : (institutionalDb.students || []);

      let filtered: any[] = allStudents;
      if (targetAudience === "absent") {
        filtered = allStudents.filter((s: any) => s.isPresentToday === false);
        if (filtered.length === 0) {
          filtered = [allStudents[0]];
        }
      } else if (targetAudience === "trade" || targetAudience === "department") {
        filtered = allStudents.filter((s: any) => 
          (s.tradeName && s.tradeName.toLowerCase().includes(selectedTrade.toLowerCase())) ||
          (s.tradeCode && s.tradeCode.toLowerCase().includes(selectedTrade.toLowerCase()))
        );
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
      let formattedMsg = formatSmsTemplate(message, {
        student_name: rec.studentName,
        Name: rec.studentName,
        roll: "১০৪",
        trade: selectedTrade,
        quiz_title: rec.quizTitle || "লাইভ কুইজ",
        "Quiz Title": rec.quizTitle || "লাইভ কুইজ",
        score: rec.score !== undefined ? `${rec.score}` : "৮৫",
        "X%": rec.score !== undefined ? `${rec.score}%` : "৮৫%",
        gpa: "৪.৮৮",
        exam_name: "কুইজ মূল্যায়ন"
      });
      // Also handle direct [Name] and [Quiz Title] and [Score] bracket tokens if used in templates
      formattedMsg = formattedMsg
        .replace(/\[Name\]/gi, rec.studentName)
        .replace(/\[Quiz Title\]/gi, rec.quizTitle || "লাইভ কুইজ")
        .replace(/\[স্কোর[:\s]*X%\]/gi, `স্কোর: ${rec.score !== undefined ? rec.score : 85}%`)
        .replace(/X%/g, `${rec.score !== undefined ? rec.score : 85}%`);

      const effectiveTemplateType = (templateType === "absence" || templateType === "result" || templateType === "emergency")
        ? templateType
        : "custom";

      const log = await sendSmsGateway(
        rec.phone,
        formattedMsg,
        effectiveTemplateType,
        rec.studentName,
        rec.name
      );

      sentCount++;
      totalCost += log.cost;
    }

    const updatedLogs = getHybridSmsLogs();

    return NextResponse.json({
      success: true,
      message: `${sentCount} SMS successfully dispatched`,
      sentCount,
      totalCost: Number(totalCost.toFixed(2)),
      logs: updatedLogs.slice(0, 20)
    });
  } catch (error: any) {
    console.error("[SMS API Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send SMS" },
      { status: 500 }
    );
  }
}
