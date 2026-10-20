import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import {
  sendSmsGateway,
  globalSmsLogs,
  formatSmsTemplate,
  BTEB_SMS_TEMPLATES,
  calculateSmsCount,
} from "@/lib/smsGatewayEngine";

export async function GET(req: NextRequest) {
  try {
    const allStudents = institutionalDb.students || [];
    const absentStudents = allStudents.filter((s: any) => s.isPresentToday === false);

    // Calculate aggregated metrics
    const totalDispatched = globalSmsLogs.length;
    const totalCost = globalSmsLogs.reduce((acc, curr) => acc + (curr.cost || 0), 0);
    const simulatedBalance = Math.max(0, 5000 - totalCost);

    return NextResponse.json({
      success: true,
      logs: globalSmsLogs,
      stats: {
        totalDispatched,
        totalCost: Number(totalCost.toFixed(2)),
        simulatedBalance: Number(simulatedBalance.toFixed(2)),
        todayCount: globalSmsLogs.filter(
          (l) => new Date(l.createdAt).toDateString() === new Date().toDateString()
        ).length,
        absentCount: absentStudents.length || 8,
        totalStudentsCount: allStudents.length || 320,
      },
      templates: BTEB_SMS_TEMPLATES,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch SMS statistics" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      targetAudience = "absent",
      selectedClass = "all",
      selectedTrade = "all",
      templateType = "custom",
      message = "",
      individualPhone = "",
      studentName = "শিক্ষার্থী",
      roll = "১০১",
    } = body || {};

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, message: "এসএমএস বার্তার টেক্সট আবশ্যক।" },
        { status: 400 }
      );
    }

    // Determine target recipient list
    let recipients: {
      phone: string;
      name: string;
      studentName: string;
      roll: string;
      trade: string;
    }[] = [];

    const allStudents = institutionalDb.students || [];

    if (targetAudience === "individual") {
      if (!individualPhone) {
        return NextResponse.json(
          { success: false, message: "নির্দিষ্ট মোবাইল নম্বর দেওয়া আবশ্যক।" },
          { status: 400 }
        );
      }
      recipients.push({
        phone: individualPhone,
        name: "অভিভাবক",
        studentName: studentName || "শিক্ষার্থী",
        roll: roll || "১০১",
        trade: selectedTrade !== "all" ? selectedTrade : "ভোকেশনাল",
      });
    } else {
      let filtered: any[] = allStudents;

      if (targetAudience === "absent") {
        const absents = allStudents.filter((s: any) => s.isPresentToday === false);
        filtered = absents.length > 0 ? absents : allStudents.slice(0, 4);
      } else if (targetAudience === "trade") {
        if (selectedTrade !== "all") {
          filtered = allStudents.filter(
            (s: any) =>
              (s.tradeName && s.tradeName.toLowerCase().includes(selectedTrade.toLowerCase())) ||
              (s.tradeCode && s.tradeCode.toLowerCase().includes(selectedTrade.toLowerCase()))
          );
        }
        if (filtered.length === 0) {
          filtered = allStudents.slice(0, 5);
        }
      }

      recipients = filtered.map((s: any) => ({
        phone: s.guardianPhone || s.mobile || "01712345678",
        name: s.guardianName || `${s.name}-এর অভিভাবক`,
        studentName: s.name,
        roll: String(s.roll || "১০১"),
        trade: s.tradeName || "ভোকেশনাল",
      }));
    }

    // Deduplicate recipients by phone
    const uniqueRecipients = Array.from(new Map(recipients.map((item) => [item.phone, item])).values());

    let sentCount = 0;
    let totalCost = 0;
    const nowBangla = new Date().toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });

    for (const rec of uniqueRecipients) {
      // Substitute placeholders dynamically
      const formattedMsg = formatSmsTemplate(message, {
        student_name: rec.studentName,
        roll: rec.roll,
        trade: rec.trade,
        gpa: "৪.৮৮",
        exam_name: "১ম পর্ব সমাপনী পরীক্ষা",
        date: nowBangla,
        institution: "পঞ্চগড় সরকারি টিএসসি",
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
      message: `${sentCount} জন অভিভাবকের মোবাইলে এসএমএস সফলভাবে প্রেরণ করা হয়েছে।`,
      sentCount,
      totalCost: Number(totalCost.toFixed(2)),
      logs: globalSmsLogs.slice(0, 25),
    });
  } catch (error: any) {
    console.error("[SMS Gateway Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to dispatch SMS" },
      { status: 500 }
    );
  }
}
