import { NextRequest, NextResponse } from "next/server";
import { 
  documentRepository, 
  getMatchingDocuments, 
  addDocumentToRepository, 
  DocumentRepoItem 
} from "@/lib/documentRepository";
import { v4 as uuidv4 } from "uuid";
import { verifyBackendAuthorization } from "@/lib/serverAuthGuard";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId") || undefined;
    const tradeCode = searchParams.get("tradeCode") || undefined;
    const category = searchParams.get("category") || undefined;

    const items = getMatchingDocuments(classId, tradeCode, category);

    return NextResponse.json({
      success: true,
      count: items.length,
      documents: items,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "সার্ভার এরর।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyBackendAuthorization(req, {
    requiredPermission: "issue_certificates",
    endpointName: "/api/documents/repository",
  });
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { 
      title, 
      titleBangla, 
      classId, 
      classNameBangla, 
      tradeCode, 
      tradeNameBangla, 
      category, 
      extractedTextSnippet, 
      fileSize 
    } = body;

    if (!title || !classId) {
      return NextResponse.json(
        { success: false, error: "ডকুমেন্ট শিরোনাম ও শ্রেণি প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const newDoc: DocumentRepoItem = {
      id: `doc-${uuidv4().substring(0, 8)}`,
      title,
      titleBangla: titleBangla || title,
      classId,
      classNameBangla: classNameBangla || "শ্রেণি",
      tradeCode: tradeCode || "SSC-T1",
      tradeNameBangla: tradeNameBangla || "কারিগরি বিষয়",
      category: category || "Curriculum PDF",
      fileUrl: `/documents/uploads/${uuidv4().substring(0, 6)}.pdf`,
      fileSize: fileSize || "2.1 MB",
      uploadDate: new Date().toISOString().split("T")[0],
      extractedTextSnippet: extractedTextSnippet || "বিটিইবি প্রাকটিক্যাল ল্যাব নির্দেশিকা ও বিষয়বস্তু।"
    };

    const saved = addDocumentToRepository(newDoc);

    return NextResponse.json({
      success: true,
      document: saved,
      message: "ডকুমেন্ট সেন্ট্রাল রিপোজিটরিতে সফলভাবে সংযুক্ত হয়েছে।"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "ডাটাবেজ সেভ এরর।" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = verifyBackendAuthorization(req, {
    requiredPermission: "issue_certificates",
    endpointName: "/api/documents/repository (DELETE)",
  });
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ডকুমেন্ট আইডি প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const { removeDocumentFromRepository } = await import("@/lib/documentRepository");
    const removed = removeDocumentFromRepository(id);

    if (!removed) {
      return NextResponse.json(
        { success: false, error: "ডকুমেন্ট রিপোজিটরিতে পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ডকুমেন্ট সেন্ট্রাল রিপোজিটরি থেকে সফলভাবে অপসারিত হয়েছে।"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "ডিলিট করার সময় সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

