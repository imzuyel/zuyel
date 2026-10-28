import { NextRequest, NextResponse } from "next/server";
import { FinalResultService, QuizReportService } from "@/lib/reportService";
import { sendSmsGateway } from "@/lib/smsGatewayEngine";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const result = FinalResultService.finalize(id);

    let finalSmsCount = 0;
    if (body.sendFinalSummarySms) {
      try {
        const participants = QuizReportService.getParticipantsReport(id);
        const session = await prisma.liveQuizSession.findUnique({
          where: { id },
          include: { quiz: true }
        });
        const quizTitle = session?.quiz?.title || "আজকের লাইভ কুইজ";

        for (const p of participants) {
          const phone = p.phone || "01700000000";
          const msg = `সম্মানিত অভিভাবক, পঞ্চগড় টিএসসিতে '${quizTitle}'-এ আপনার সন্তান ${p.name} মোট ${p.score} পয়েন্ট পেয়ে ${p.rank}ম স্থান অর্জন করেছে (সঠিক উত্তর: ${p.correctCount}/${p.totalQuestions})। - PTSC`;
          await sendSmsGateway(phone, msg, "result", p.name, `${p.name} (অভিভাবক)`);
          finalSmsCount++;
        }
      } catch (smsErr) {
        console.error("Final SMS dispatch error:", smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: body.sendFinalSummarySms
        ? `লাইভ কুইজ সমাপ্ত এবং ${finalSmsCount} জন অভিভাবকের কাছে রেজাল্ট SMS পাঠানো হয়েছে!`
        : "Live quiz session completed and results finalized successfully.",
      session: result.session,
      finalSmsCount
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to end quiz session" },
      { status: 500 }
    );
  }
}

