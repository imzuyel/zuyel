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
      topic,
      count = 5,
      difficulty = "medium",
      language = "Bangla",
      questionType = "mcq_single",
      additionalInstructions = "",
    } = body;

    const doc = await PdfDocumentService.getDocumentById(id);
    if (!doc) {
      return NextResponse.json(
        { success: false, message: "ডকুমেন্টটি পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { success: false, message: "প্রশ্ন তৈরির বিষয়বস্তু বা টপিক নির্ধারণ করা আবশ্যক।" },
        { status: 400 }
      );
    }

    // Load available pages for this document
    const allPages = await PdfDocumentService.getPages(id);
    if (allPages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "এই ডকুমেন্টে কোনো প্রসেস করা পৃষ্ঠা পাওয়া যায়নি। অনুগ্রহ করে প্রথমে টেক্সট এক্সট্রাকশন সম্পন্ন করুন।",
        },
        { status: 400 }
      );
    }

    // Filter pages matching selected numbers
    let targetPages = allPages;
    if (Array.isArray(selectedPages) && selectedPages.length > 0) {
      targetPages = allPages.filter((p) => selectedPages.includes(p.pageNumber));
    }

    // Filter out pages that failed extraction or are blank
    const validPages = targetPages.filter(
      (p) => p.extractionStatus === "completed" && p.extractedText.trim().length > 0
    );

    if (validPages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "নির্বাচিত পৃষ্ঠাগুলো থেকে কোনো রিডেবল টেক্সট পাওয়া যায়নি। স্ক্যানকৃত ডকুমেন্টের জন্য ওসিআর রিট্রাই করুন।",
        },
        { status: 400 }
      );
    }

    const jobId = `job-pdf-${Date.now()}`;
    const nowStr = new Date().toISOString();

    const newJob: AIGenerationJob = {
      id: jobId,
      userId: 1,
      subjectId: doc.subjectId || 1,
      classId: doc.classId || 4,
      topic: topic.trim(),
      chapter: doc.chapter,
      lesson: "",
      learningObjective: `BTEB Grounded: ${doc.title} (${doc.topic || "PTSC"})`,
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
      pageRange:
        Array.isArray(selectedPages) && selectedPages.length > 0
          ? selectedPages.join(",")
          : `1-${doc.pageCount}`,
    };

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
        throw new Error("এআই মডেল প্রদত্ত পিডিএফ অংশ থেকে কোনো গ্রাউন্ডেড প্রশ্ন তৈরি করতে পারেনি।");
      }

      // Map generated questions
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

      // Persist job and questions to DB & memory via service
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
        message: `সফলভাবে ${questionsToSave.length}টি সোর্স-গ্রাউন্ডেড প্রশ্ন তৈরি ও সংরক্ষণ করা হয়েছে।`,
      });
    } catch (err: any) {
      newJob.status = "failed";
      newJob.errorMessage = err?.message || "PDF grounded generation failed.";
      newJob.updatedAt = new Date().toISOString();
      throw err;
    }
  } catch (err: any) {
    console.error("[API: /api/ai/pdf-manager/[id]/generate-questions POST] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
