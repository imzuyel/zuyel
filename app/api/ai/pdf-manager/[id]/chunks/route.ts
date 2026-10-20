import { NextRequest, NextResponse } from "next/server";
import { PdfDocumentService } from "@/lib/pdfDocumentService";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const { searchParams } = new URL(req.url);
    const pagesParam = searchParams.get("pages");

    const pageNumbers = pagesParam
      ? pagesParam
          .split(",")
          .map((n) => parseInt(n.trim()))
          .filter((n) => !isNaN(n))
      : undefined;

    const document = await PdfDocumentService.getDocumentById(id);
    if (!document) {
      return NextResponse.json(
        { success: false, message: "ডকুমেন্টটি পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const chunks = await PdfDocumentService.getChunks(id, pageNumbers);

    return NextResponse.json({
      success: true,
      documentId: id,
      totalChunks: chunks.length,
      chunks,
    });
  } catch (err: any) {
    console.error("[API: /api/ai/pdf-manager/[id]/chunks GET] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
