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
    const body = await req.json().catch(() => ({}));
    const simulateOcr = !!body.simulateOcr;

    const doc = await PdfDocumentService.getDocumentById(id);

    if (!doc) {
      return NextResponse.json({ success: false, message: "Document not found." }, { status: 404 });
    }

    // Check if the file actually exists
    const fileExists = await StorageService.exists(doc.storageKey);
    if (!fileExists) {
      return NextResponse.json({ success: false, message: "Physical PDF file not found in storage." }, { status: 404 });
    }

    // Download buffer from storage
    const buffer = await StorageService.download(doc.storageKey);

    // Extract text
    const extracted = PdfExtractor.extractText(buffer);

    let pagesToSave = extracted.pages;
    let chunksToSave = extracted.chunks;
    let isScanned = extracted.isScannedDoc;

    if (extracted.isScannedDoc && simulateOcr) {
      isScanned = false;
      const simulatedOcrTexts = [
        "Welding Lab Safety Code 402: Under the Bangladesh Technical Education Board guidelines, electric arc welding processes require a minimum shade 10 filter lens. Proper ventilation must be active to remove toxic gas emissions and chromium fumes during CAD-based welding automation.",
        "Section 4.3 CAD Blueprints: Weld symbols signify the joint type, weld size, and length. A triangle indicates a fillet weld. The tail of the welding arrow is used to specify process details, specifications, or other reference information."
      ];

      pagesToSave = [];
      for (let p = 1; p <= extracted.pageCount; p++) {
        const text = simulatedOcrTexts[p - 1] || `Simulated OCR Extracted Text for Page ${p}: Technical welding blueprint layouts.`;
        pagesToSave.push({
          pageNumber: p,
          text,
          isScanned: false,
        });
      }

      chunksToSave = [{
        chunkIndex: 1,
        startPage: 1,
        endPage: extracted.pageCount,
        text: simulatedOcrTexts.join(" "),
      }];
    }

    const { savedPages, savedChunks } = await PdfDocumentService.saveExtractedPagesAndChunks(
      id,
      pagesToSave,
      chunksToSave,
      isScanned
    );

    return NextResponse.json({
      success: true,
      ocrSimulated: simulateOcr && extracted.isScannedDoc,
      message: isScanned 
        ? "This PDF contains scanned pages that require OCR. Text extraction was unsuccessful." 
        : "PDF document processed and text extracted successfully.",
      pageCount: extracted.pageCount,
      totalChunks: savedChunks.length,
      pages: savedPages,
    });
  } catch (err: any) {
    console.error("PDF processing retry error:", err);
    return NextResponse.json({ success: false, message: err.message || "Internal Server Error" }, { status: 500 });
  }
}
