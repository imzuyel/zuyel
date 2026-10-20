import { NextRequest, NextResponse } from "next/server";
import { PdfDocumentService } from "@/lib/pdfDocumentService";
import { StorageService } from "@/lib/storageService";
import { PdfExtractor } from "@/lib/pdfExtractor";

export async function POST(
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

    // Download buffer from storage
    let fileBuffer: Buffer;
    try {
      fileBuffer = await StorageService.download(document.storageKey);
    } catch (e) {
      return NextResponse.json(
        { success: false, message: "ডকুমেন্টের ফাইল স্টোরেজে পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // Re-extract
    const extracted = PdfExtractor.extractText(fileBuffer);
    const { savedPages, savedChunks } = await PdfDocumentService.saveExtractedPagesAndChunks(
      id,
      extracted.pages,
      extracted.chunks,
      extracted.isScannedDoc
    );

    return NextResponse.json({
      success: true,
      message: extracted.isScannedDoc
        ? "ডকুমেন্টটি স্ক্যানকৃত ইমেজ ফাইল। ওসিআর রিকগনিশন প্রয়োজন।"
        : "ডকুমেন্টের টেক্সট ও অধ্যায় সফলভাবে প্রসেস করা হয়েছে।",
      pageCount: extracted.pageCount,
      totalChunks: savedChunks.length,
      isScannedDoc: extracted.isScannedDoc,
      pages: savedPages,
    });
  } catch (err: any) {
    console.error("[API: /api/ai/pdf-manager/[id]/process POST] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
