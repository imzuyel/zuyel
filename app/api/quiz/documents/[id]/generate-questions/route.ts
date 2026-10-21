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
      pages: selectedPages, // Array of page numbers, e.g. [1, 2]
      topic,
      count = 5,
      difficulty = "medium",
      language = "Bangla",
      questionType = "mcq_single",
      additionalInstructions = "",
    } = body;

    const result = await PdfDocumentService.generateQuestionsFromDocument({
      documentId: id,
      selectedPages,
      topic: topic || "Technical Curriculum",
      count: Number(count) || 5,
      difficulty,
      language,
      questionType,
      additionalInstructions,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("PDF generation route error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal Server Error" },
      { status: err?.message?.includes("not found") || err?.message?.includes("পাওয়া যায়নি") ? 404 : 500 }
    );
  }
}
