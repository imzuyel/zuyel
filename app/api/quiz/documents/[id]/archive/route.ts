import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const doc = institutionalDb.pdfDocuments.find((d) => d.id === id);

    if (!doc) {
      return NextResponse.json({ success: false, message: "Document not found." }, { status: 404 });
    }

    doc.processingStatus = "archived";
    doc.archivedAt = new Date().toISOString();
    doc.updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: "Document successfully archived.",
      document: doc,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Internal Server Error" }, { status: 500 });
  }
}
