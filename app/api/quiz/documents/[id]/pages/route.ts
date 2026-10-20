import { NextRequest, NextResponse } from "next/server";
import { PdfDocumentService } from "@/lib/pdfDocumentService";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const doc = await PdfDocumentService.getDocumentById(id);

    if (!doc) {
      return NextResponse.json({ success: false, message: "ডকুমেন্টটি পাওয়া যায়নি।" }, { status: 404 });
    }

    const pages = await PdfDocumentService.getPages(id);

    return NextResponse.json({
      success: true,
      document: doc,
      pages,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Internal Server Error" }, { status: 500 });
  }
}
