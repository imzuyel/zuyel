import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, QuestionBankQuestion } from "@/lib/database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionIds } = body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ success: false, message: "No question IDs provided" }, { status: 400 });
    }

    const savedList: QuestionBankQuestion[] = [];
    const nowStr = new Date().toISOString();

    for (const qId of questionIds) {
      const q = institutionalDb.aiGeneratedQuestions.find((item) => item.id === qId);
      if (!q) continue;

      // Find parent job to get subject and class context
      const job = institutionalDb.aiGenerationJobs.find((j) => j.id === q.generationJobId);
      const subjectId = job ? job.subjectId : 1;
      const classId = job ? job.classId : 4;

      // Create Question Bank item
      const qbId = `qb-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const qbQuestion: QuestionBankQuestion = {
        id: qbId,
        type: q.type as any,
        questionText: q.questionText,
        questionData: q.questionData,
        subjectId,
        classId,
        difficulty: q.difficulty,
        explanation: q.explanation,
        createdBy: 1, // Simulated current teacher ID
        status: "active",
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      // Add to central bank
      institutionalDb.questionBank.unshift(qbQuestion);

      // Mark original generated question as saved
      q.status = "saved";
      q.updatedAt = nowStr;

      savedList.push(qbQuestion);
    }

    // Audit logs simulation
    console.log(`[AUDIT LOG] Batch added AI questions to Question Bank. Count: ${savedList.length}`);

    return NextResponse.json({
      success: true,
      savedQuestions: savedList,
      message: `Successfully saved ${savedList.length} questions to the central Question Bank!`,
    });
  } catch (error: any) {
    console.error("AI Save Selected Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save questions to Question Bank" },
      { status: 500 }
    );
  }
}
