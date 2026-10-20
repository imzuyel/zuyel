import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { AIService } from "@/lib/aiService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { instruction } = body;

    if (!instruction || !instruction.trim()) {
      return NextResponse.json({ success: false, message: "Refinement instruction is required" }, { status: 400 });
    }

    const q = institutionalDb.aiGeneratedQuestions.find((item) => item.id === id);

    if (!q) {
      return NextResponse.json({ success: false, message: "Question not found" }, { status: 404 });
    }

    // Call AIService.improveQuestion
    const improved = await AIService.improveQuestion(
      {
        type: q.type,
        questionText: q.questionText,
        explanation: q.explanation,
        difficulty: q.difficulty,
        tags: q.tags,
        questionData: q.questionData,
      },
      instruction.trim()
    );

    // Update fields
    q.questionText = improved.questionText;
    q.explanation = improved.explanation;
    q.difficulty = improved.difficulty as "easy" | "medium" | "hard";
    q.tags = improved.tags;
    q.questionData = improved.questionData;
    q.status = "reviewed";
    q.updatedAt = new Date().toISOString();

    const possibleMatches = AIService.findPossibleDuplicatesInBank(q.questionText);
    const enriched = {
      ...q,
      isDuplicate: possibleMatches.length > 0,
      possibleMatches,
    };

    // Audit logs simulation
    console.log(`[AUDIT LOG] AI Generated Question improved via custom instruction. ID: ${id}`);

    return NextResponse.json({
      success: true,
      question: enriched,
      message: "Question improved and refined successfully by AI",
    });
  } catch (error: any) {
    console.error("AI Improvement Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to improve question" },
      { status: 500 }
    );
  }
}
