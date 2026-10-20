import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { AIService } from "@/lib/aiService";
import { COMMON_SUBJECTS_9_12, PRE_VOCATIONAL_SUBJECTS } from "@/lib/academicStructure";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const q = institutionalDb.aiGeneratedQuestions.find((item) => item.id === id);

    if (!q) {
      return NextResponse.json({ success: false, message: "Question not found" }, { status: 404 });
    }

    const job = institutionalDb.aiGenerationJobs.find((j) => j.id === q.generationJobId);
    if (!job) {
      return NextResponse.json({ success: false, message: "Parent generation job not found" }, { status: 404 });
    }

    // Lookup subject/class
    const targetClass = institutionalDb.classes.find((c) => c.id === job.classId);
    const className = targetClass ? `${targetClass.name} (${targetClass.shift})` : `Class ${job.classId}`;
    const allSubjects = [...PRE_VOCATIONAL_SUBJECTS, ...COMMON_SUBJECTS_9_12];
    const targetSubject = allSubjects.find((s) => s.id === job.subjectId);
    const subjectName = targetSubject ? targetSubject.name : `Subject ID ${job.subjectId}`;

    // Call single question generation
    const generated = await AIService.generateQuestions({
      topic: job.topic,
      subjectName,
      className,
      chapter: job.chapter,
      lesson: job.lesson,
      learningObjective: job.learningObjective,
      additionalInstructions: "Please generate a fresh distinct question. Ensure it is unique from others.",
      questionType: job.questionType,
      count: 1,
      difficulty: job.difficulty === "mixed" ? "medium" : job.difficulty,
      language: job.language,
    });

    if (generated.length === 0) {
      throw new Error("AI provider returned no valid question during regeneration.");
    }

    const fresh = generated[0];

    // Update original question text and data
    q.questionText = fresh.questionText;
    q.explanation = fresh.explanation;
    q.difficulty = fresh.difficulty;
    q.tags = fresh.tags;
    q.questionData = fresh.questionData;
    q.status = "generated";
    q.updatedAt = new Date().toISOString();

    const possibleMatches = AIService.findPossibleDuplicatesInBank(q.questionText);
    const enriched = {
      ...q,
      isDuplicate: possibleMatches.length > 0,
      possibleMatches,
    };

    // Audit logs simulation
    console.log(`[AUDIT LOG] AI Generated Question regenerated. ID: ${id}`);

    return NextResponse.json({
      success: true,
      question: enriched,
      message: "Question regenerated successfully",
    });
  } catch (error: any) {
    console.error("AI Regeneration Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to regenerate question" },
      { status: 500 }
    );
  }
}
