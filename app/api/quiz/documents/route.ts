import { NextRequest, NextResponse } from "next/server";
import { PdfDocumentService } from "@/lib/pdfDocumentService";
import { StorageService } from "@/lib/storageService";
import { PdfExtractor } from "@/lib/pdfExtractor";

// Background PDF processor
async function backgroundProcessPdf(docId: string, fileBuffer: Buffer) {
  try {
    const extracted = PdfExtractor.extractText(fileBuffer);
    await PdfDocumentService.saveExtractedPagesAndChunks(
      docId,
      extracted.pages,
      extracted.chunks,
      extracted.isScannedDoc
    );
    console.log(`[BACKGROUND PDF PROCESSOR] Processed document: ${docId}. Page count: ${extracted.pageCount}. Scanned: ${extracted.isScannedDoc}`);
  } catch (err: any) {
    console.error(`[BACKGROUND PDF PROCESSOR ERROR] Failed to process document ${docId}:`, err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const subjectId = searchParams.get("subjectId") || undefined;
    const classId = searchParams.get("classId") || undefined;
    const tradeId = searchParams.get("tradeId") || undefined;
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
    console.error("PDF documents list error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Internal Server Error" }, { status: 500 });
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
      return NextResponse.json({ success: false, message: "No PDF file provided." }, { status: 400 });
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, message: "Document title is required." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const validation = StorageService.validate(file.name, file.type, buffer.length);
    if (!validation.isValid) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
    }

    const { storageKey, size } = await StorageService.upload(buffer, file.name);

    const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);

    const newDoc = await PdfDocumentService.createDocument({
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
      storageProvider: "local",
      storageKey,
      mimeType: file.type || "application/pdf",
      fileSize: size,
      uploadedBy: 1,
    });

    // Run extraction asynchronously
    backgroundProcessPdf(newDoc.id, buffer);

    return NextResponse.json(
      {
        success: true,
        message: "File uploaded successfully. Text processing has started in the background.",
        document: newDoc,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("PDF upload route error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
