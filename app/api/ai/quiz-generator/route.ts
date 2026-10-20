import { NextRequest, NextResponse } from "next/server";
import { generateBtebQuizQuestions, QuizAiGeneratorParams } from "@/lib/quizAiGenerator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      trade = "IT Support & IoT",
      gradeLevel = "Class 10 / SSC Vocational",
      topic = "কম্পিউটার নেটওয়ার্কিং",
      subjectCode = "",
      questionCount = 5,
      difficulty = "Mixed",
      language = "Bangla",
      questionType = "mcq_single",
      customInstructions = "",
      referencePdfTitle = "",
      referencePdfId = "",
      referenceText = "",
      bloomLevel = "Mixed"
    }: Partial<QuizAiGeneratorParams> = body || {};

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { success: false, message: "টপিক বা অধ্যায়ের নাম প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = await generateBtebQuizQuestions({
      trade,
      gradeLevel,
      topic: topic.trim(),
      subjectCode,
      questionCount: Number(questionCount) || 5,
      difficulty: difficulty as any,
      language: language as any,
      questionType: questionType as any,
      customInstructions,
      referencePdfTitle,
      referencePdfId,
      referenceText,
      bloomLevel: bloomLevel as any
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[API /api/ai/quiz-generator] Unexpected error:", error);

    // Ultra safe fallback even on unexpected controller errors
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "প্রশ্ন তৈরিতে অনাকাঙ্ক্ষিত সমস্যা দেখা দিয়েছে।",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
