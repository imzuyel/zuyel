import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { AIService } from "@/lib/aiService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = institutionalDb.aiGenerationJobs.find((j) => j.id === id);

    if (!job) {
      return NextResponse.json({ success: false, message: "AI generation history record not found" }, { status: 404 });
    }

    const questions = institutionalDb.aiGeneratedQuestions.filter((q) => q.generationJobId === id);

    // Refresh duplicate detection on request to stay up-to-date
    const enrichedQuestions = questions.map((q) => {
      const possibleMatches = AIService.findPossibleDuplicatesInBank(q.questionText);
      return {
        ...q,
        isDuplicate: possibleMatches.length > 0,
        possibleMatches,
      };
    });

    return NextResponse.json({
      success: true,
      job,
      questions: enrichedQuestions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch details" },
      { status: 500 }
    );
  }
}
