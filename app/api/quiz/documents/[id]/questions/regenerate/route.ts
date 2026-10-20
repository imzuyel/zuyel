import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, AIGeneratedQuestion } from "@/lib/database";
import { AIService } from "@/lib/aiService";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: docId } = await props.params;
    const body = await req.json();
    const { questionId, instruction } = body;

    if (!questionId || !instruction) {
      return NextResponse.json({ success: false, message: "questionId and instruction are required." }, { status: 400 });
    }

    const questionIndex = institutionalDb.aiGeneratedQuestions.findIndex((q) => q.id === questionId && q.documentId === docId);
    if (questionIndex === -1) {
      return NextResponse.json({ success: false, message: "Generated question not found for this document." }, { status: 404 });
    }

    const original = institutionalDb.aiGeneratedQuestions[questionIndex];

    // Call AI Service to refine the question based on teacher instructions
    const improved = await AIService.improveQuestion(
      {
        type: original.type,
        questionText: original.questionText,
        explanation: original.explanation,
        difficulty: original.difficulty,
        tags: original.tags,
        questionData: original.questionData,
      },
      instruction
    );

    // Save back to db
    const updatedQuestion: AIGeneratedQuestion = {
      ...original,
      ...improved,
      difficulty: (improved.difficulty as any) || original.difficulty,
      updatedAt: new Date().toISOString(),
    };

    institutionalDb.aiGeneratedQuestions[questionIndex] = updatedQuestion;

    return NextResponse.json({
      success: true,
      question: updatedQuestion,
      message: "Question successfully refined by AI.",
    });
  } catch (err: any) {
    console.error("PDF question regenerate error:", err);
    return NextResponse.json({ success: false, message: err.message || "Internal Server Error" }, { status: 500 });
  }
}
