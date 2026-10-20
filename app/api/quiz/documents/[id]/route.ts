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
      return NextResponse.json({ success: false, message: "Document not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, document: doc });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await req.json();

    const updated = await PdfDocumentService.updateDocument(id, {
      title: body.title,
      description: body.description,
      subjectId: body.subjectId ? parseInt(body.subjectId) : undefined,
      classId: body.classId ? parseInt(body.classId) : undefined,
      tradeId: body.tradeId ? parseInt(body.tradeId) : undefined,
      sectionId: body.sectionId ? parseInt(body.sectionId) : undefined,
      chapter: body.chapter,
      topic: body.topic,
      tags: Array.isArray(body.tags)
        ? body.tags
        : typeof body.tags === "string"
        ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : undefined,
      incrementVersion: Boolean(body.incrementVersion),
    });

    if (!updated) {
      return NextResponse.json({ success: false, message: "Document not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Document metadata updated successfully.",
      document: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const result = await PdfDocumentService.deleteOrArchiveDocument(id);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
