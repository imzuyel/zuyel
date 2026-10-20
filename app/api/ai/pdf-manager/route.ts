import { NextRequest, NextResponse } from "next/server";
import { PdfDocumentService } from "@/lib/pdfDocumentService";
import { StorageService } from "@/lib/storageService";
import { PdfExtractor } from "@/lib/pdfExtractor";

async function processPdfExtraction(documentId: string, fileBuffer: Buffer) {
  try {
    const extracted = PdfExtractor.extractText(fileBuffer);
    await PdfDocumentService.saveExtractedPagesAndChunks(
      documentId,
      extracted.pages,
      extracted.chunks,
      extracted.isScannedDoc
    );
  } catch (err) {
    console.error(`[PDF COGNITIVE PARSER ERROR] Failed to parse document ${documentId}:`, err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const classId = searchParams.get("classId") || undefined;
    const tradeId = searchParams.get("tradeId") || undefined;
    const subjectId = searchParams.get("subjectId") || undefined;
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await PdfDocumentService.listDocuments({
      search,
      classId,
      tradeId,
      subjectId,
      status,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error("[API: /api/ai/pdf-manager GET] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to retrieve documents." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || "";
    const subjectIdStr = formData.get("subjectId") as string;
    const classIdStr = formData.get("classId") as string;
    const tradeIdStr = formData.get("tradeId") as string;
    const sectionIdStr = formData.get("sectionId") as string;
    const academicYearIdStr = formData.get("academicYearId") as string;
    const chapter = (formData.get("chapter") as string) || "";
    const topic = (formData.get("topic") as string) || "";
    const tagsStr = (formData.get("tags") as string) || "";

    if (!file) {
      return NextResponse.json(
        { success: false, message: "দয়া করে একটি বৈধ পিডিএফ ফাইল সিলেক্ট করুন।" },
        { status: 400 }
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "ডকুমেন্টের শিরোনাম (Title) আবশ্যক।" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const validation = StorageService.validate(file.name, file.type, buffer.length);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.error || "ফাইলের আকার বা ফরম্যাট সঠিক নয়।" },
        { status: 400 }
      );
    }

    const { storageKey, size } = await StorageService.upload(buffer, file.name);

    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const document = await PdfDocumentService.createDocument({
      title: title.trim(),
      originalFilename: file.name,
      description,
      subjectId: subjectIdStr ? parseInt(subjectIdStr) : undefined,
      classId: classIdStr ? parseInt(classIdStr) : undefined,
      tradeId: tradeIdStr ? parseInt(tradeIdStr) : undefined,
      sectionId: sectionIdStr ? parseInt(sectionIdStr) : undefined,
      academicYearId: academicYearIdStr ? parseInt(academicYearIdStr) : 2026,
      chapter,
      topic,
      tags,
      storageKey,
      mimeType: file.type || "application/pdf",
      fileSize: size,
      storageProvider: "local",
      uploadedBy: 1,
    });

    // Run extraction asynchronously
    processPdfExtraction(document.id, buffer);

    return NextResponse.json(
      {
        success: true,
        message: "পিডিএফ সফলভাবে আপলোড হয়েছে এবং স্বয়ংক্রিয় টেক্সট এক্সট্রাকশন শুরু হয়েছে।",
        document,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[API: /api/ai/pdf-manager POST] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "পিডিএফ ফাইল প্রসেস করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
