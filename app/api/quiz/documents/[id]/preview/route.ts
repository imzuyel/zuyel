import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { StorageService } from "@/lib/storageService";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const doc = institutionalDb.pdfDocuments.find((d) => d.id === id);

    if (!doc) {
      return NextResponse.json({ success: false, message: "Document not found." }, { status: 404 });
    }

    // Load page list
    const pages = institutionalDb.pdfPages
      .filter((p) => p.documentId === id)
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map((p) => ({
        id: p.id,
        pageNumber: p.pageNumber,
        status: p.extractionStatus,
        textSnippet: p.extractedText ? p.extractedText.slice(0, 150) + "..." : "",
        wordCount: p.extractedText ? p.extractedText.split(/\s+/).length : 0,
      }));

    const url = StorageService.getUrl(doc.storageKey);

    return NextResponse.json({
      success: true,
      document: doc,
      pages,
      previewUrl: url,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Internal Server Error" }, { status: 500 });
  }
}
