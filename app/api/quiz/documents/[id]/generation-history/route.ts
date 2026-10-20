import { NextRequest, NextResponse } from "next/server";
import { PdfDocumentService } from "@/lib/pdfDocumentService";
import { institutionalDb } from "@/lib/database";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const doc = await PdfDocumentService.getDocumentById(id);
    if (!doc) {
      return NextResponse.json({ success: false, message: "Document not found." }, { status: 404 });
    }

    const jobs = await PdfDocumentService.getGenerationHistory(id);
    const questions = institutionalDb.aiGeneratedQuestions.filter((q) => q.documentId === id);

    return NextResponse.json({
      success: true,
      documentName: doc.title,
      jobs,
      questions,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Internal Server Error" }, { status: 500 });
  }
}
