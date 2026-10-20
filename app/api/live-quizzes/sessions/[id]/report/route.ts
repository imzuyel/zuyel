import { NextRequest, NextResponse } from "next/server";
import { QuizReportService } from "@/lib/reportService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const format = req.nextUrl.searchParams.get("format");

    if (format === "csv") {
      const csv = QuizReportService.exportParticipantsCsv(sessionId);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="quiz-results-${sessionId}.csv"`
        }
      });
    }

    const overview = QuizReportService.getSessionOverview(sessionId);
    const scoreDistribution = QuizReportService.getScoreDistribution(sessionId);
    const questions = QuizReportService.getQuestionPerformance(sessionId);
    const participants = QuizReportService.getParticipantsReport(sessionId);

    return NextResponse.json({
      success: true,
      overview,
      scoreDistribution,
      questions,
      participants
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
