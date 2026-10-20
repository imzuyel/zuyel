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

    const doc = await PdfDocumentService.getDocumentById(id);
    if (!doc) {
      return NextResponse.json({ success: false, message: "Document not found." }, { status: 404 });
    }

    if (!topic || !topic.trim()) {
      return NextResponse.json({ success: false, message: "Topic is required for question generation." }, { status: 400 });
    }

    // Load available pages for this document
    const allPages = await PdfDocumentService.getPages(id);
    if (allPages.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "No processed pages found for this document. Please ensure it is processed successfully before generation." 
      }, { status: 400 });
    }

    // Filter pages matching selected numbers
    let targetPages = allPages;
    if (Array.isArray(selectedPages) && selectedPages.length > 0) {
      targetPages = allPages.filter((p) => selectedPages.includes(p.pageNumber));
    }

    // Filter out pages that failed extraction (image-only/needs OCR)
    const validPages = targetPages.filter((p) => p.extractionStatus === "completed" && p.extractedText.trim().length > 0);

    if (validPages.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "None of the selected pages contain extractable text. Scanned documents require OCR simulation retry." 
      }, { status: 400 });
    }

    // Create Job record
    const jobId = `job-${Date.now()}`;
    const nowStr = new Date().toISOString();

    const newJob: AIGenerationJob = {
      id: jobId,
      userId: 1, // Current teacher ID
      subjectId: doc.subjectId || 1,
      classId: doc.classId || 4,
      topic: topic.trim(),
      chapter: doc.chapter,
      lesson: "",
      learningObjective: `BTEB Grounded: ${doc.title}`,
      language,
      difficulty,
      questionType,
      questionCount: count,
      provider: "Google Gemini",
      model: "gemini-3.8-flash",
      status: "processing",
      createdAt: nowStr,
      updatedAt: nowStr,
      documentId: id,
      documentVersion: doc.version || 1,
      pageRange: Array.isArray(selectedPages) && selectedPages.length > 0 ? selectedPages.join(",") : `1-${doc.pageCount}`,
    };

    // Call AIService PDF generation
    try {
      const generated = await AIService.generateQuestionsFromPdf({
        pdfPages: validPages.map((p) => ({ pageNumber: p.pageNumber, text: p.extractedText })),
        topic: topic.trim(),
        questionType,
        count,
        difficulty,
        language,
        additionalInstructions,
      });

      if (generated.length === 0) {
        throw new Error("Gemini did not return any grounded questions from the provided PDF pages.");
      }

      // Map and save questions
      const questionsToSave: AIGeneratedQuestion[] = generated.map((q, idx) => {
        const qId = `aiq-pdf-${Date.now()}-${idx}`;
        const possibleMatches = AIService.findPossibleDuplicatesInBank(q.questionText);

        return {
          ...q,
          id: qId,
          generationJobId: jobId,
          documentId: id,
          status: "generated",
          reviewedBy: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          duplicateHash: possibleMatches.length > 0 ? "similar_found" : undefined,
        } as AIGeneratedQuestion;
      });

      newJob.status = "completed";
      newJob.updatedAt = new Date().toISOString();

      await PdfDocumentService.recordGenerationJob(
        {
          ...newJob,
          documentId: id,
          groundedPagesJson: JSON.stringify(validPages.map((p) => p.pageNumber)),
        },
        questionsToSave
      );

      return NextResponse.json({
        success: true,
        job: newJob,
        questions: questionsToSave,
        message: `Successfully generated ${questionsToSave.length} source-grounded questions.`,
      });
    } catch (err: any) {
      newJob.status = "failed";
      newJob.errorMessage = err.message || "Failed during PDF grounded AI prompt generation.";
      newJob.updatedAt = new Date().toISOString();
      throw err;
    }
  } catch (err: any) {
    console.error("PDF generation route error:", err);
    return NextResponse.json({ success: false, message: err.message || "Internal Server Error" }, { status: 500 });
  }
}
