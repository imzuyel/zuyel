import { NextRequest, NextResponse } from "next/server";
import { PdfDocumentService } from "@/lib/pdfDocumentService";
import { AIService } from "@/lib/aiService";
import { AIGenerationJob, AIGeneratedQuestion } from "@/lib/database";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await req.json();

    const {
      pages: selectedPages, // Array of page numbers, e.g. [1, 2, 3]
      fromPage,
      toPage,
      topic,
      chapter,
      count = 5,
      difficulty = "medium",
      language = "Bangla",
      questionType = "mcq_single",
      questionTypes,
      includeWarmup = false,
      additionalInstructions = "",
    } = body;

    const result = await PdfDocumentService.generateQuestionsFromDocument({
      documentId: id,
      fromPage: fromPage !== undefined ? Number(fromPage) : undefined,
      toPage: toPage !== undefined ? Number(toPage) : undefined,
      selectedPages,
      topic: topic || chapter || "সাধারণ কারিগরি জ্ঞান",
      chapter,
      count: Number(count) || 5,
      difficulty,
      language,
      questionType,
      questionTypes,
      includeWarmup: !!includeWarmup,
      additionalInstructions,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[API: /api/ai/pdf-manager/[id]/generate-questions POST] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal Server Error" },
      { status: err?.message?.includes("পাওয়া যায়নি") ? 404 : 500 }
    );
  }
}
