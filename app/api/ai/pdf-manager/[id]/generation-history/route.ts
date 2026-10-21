import { NextRequest, NextResponse } from "next/server";
import { PdfDocumentService } from "@/lib/pdfDocumentService";
import { institutionalDb } from "@/lib/database";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const document = await PdfDocumentService.getDocumentById(id);

    if (!document) {
      return NextResponse.json(
        { success: false, message: "ডকুমেন্টটি পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const jobs = await PdfDocumentService.getGenerationHistory(id);
    const questions = institutionalDb.aiGeneratedQuestions.filter((q) => q.documentId === id);

    return NextResponse.json({
      success: true,
      documentId: id,
      documentName: document.title,
      totalJobs: jobs.length,
      jobs,
      questions,
    });
  } catch (err: any) {
    console.error("[API: /api/ai/pdf-manager/[id]/generation-history GET] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
