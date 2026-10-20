import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, AIGeneratedQuestion } from "@/lib/database";
import { AIService } from "@/lib/aiService";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const index = institutionalDb.aiGeneratedQuestions.findIndex((q) => q.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: "Question not found" }, { status: 404 });
    }

    const removed = institutionalDb.aiGeneratedQuestions.splice(index, 1)[0];

    // Audit logs simulation
    console.log(`[AUDIT LOG] AI Generated Question deleted. ID: ${id}`);

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully",
      removed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete question" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const q = institutionalDb.aiGeneratedQuestions.find((item) => item.id === id);

    if (!q) {
      return NextResponse.json({ success: false, message: "Question not found" }, { status: 404 });
    }

    // Update fields
    if (body.questionText !== undefined) q.questionText = body.questionText;
    if (body.explanation !== undefined) q.explanation = body.explanation;
    if (body.difficulty !== undefined) q.difficulty = body.difficulty;
    if (body.tags !== undefined) q.tags = body.tags;
    if (body.questionData !== undefined) q.questionData = body.questionData;
    if (body.status !== undefined) q.status = body.status;

    q.updatedAt = new Date().toISOString();

    // Verify duplication indicators
    const possibleMatches = AIService.findPossibleDuplicatesInBank(q.questionText);
    const enriched = {
      ...q,
      isDuplicate: possibleMatches.length > 0,
      possibleMatches,
    };

    // Audit logs simulation
    console.log(`[AUDIT LOG] AI Generated Question updated/reviewed. ID: ${id}, Status: ${q.status}`);

    return NextResponse.json({
      success: true,
      question: enriched,
      message: "Question updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update question" },
      { status: 500 }
    );
  }
}
