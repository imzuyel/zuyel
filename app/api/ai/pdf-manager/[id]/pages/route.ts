import { NextRequest, NextResponse } from "next/server";
import { PdfDocumentService } from "@/lib/pdfDocumentService";

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

    const pages = await PdfDocumentService.getPages(id);

    return NextResponse.json({
      success: true,
      documentId: id,
      pageCount: pages.length,
      pages,
    });
  } catch (err: any) {
    console.error("[API: /api/ai/pdf-manager/[id]/pages GET] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
