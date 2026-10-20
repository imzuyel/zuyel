import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, DocumentStatus, DocumentReprintLog, DocumentAuditLog } from "@/lib/database";
import { verifyBackendAuthorization } from "@/lib/serverAuthGuard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = institutionalDb.documents.find(
      (d) => d.id === id || d.docNumber.toLowerCase() === id.toLowerCase()
    );

    if (!doc) {
      return NextResponse.json({ success: false, error: "সনদপত্র বা নথি খুঁজে পাওয়া যায়নি" }, { status: 404 });
    }

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyBackendAuthorization(req, {
    requiredPermission: "issue_certificates",
    endpointName: "/api/documents/[id] (PATCH)",
  });
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const {
      action, // "issue" | "cancel" | "reprint" | "update_remarks" | "update_content"
      reason,
      performedBy = "Engr. Md. Aminul Islam (Principal)",
      customBodyText,
      remarks,
      theme,
      signatories,
    } = body;

    const docIndex = institutionalDb.documents.findIndex(
      (d) => d.id === id || d.docNumber.toLowerCase() === id.toLowerCase()
    );

    if (docIndex === -1) {
      return NextResponse.json({ success: false, error: "সনদপত্র পাওয়া যায়নি" }, { status: 404 });
    }

    const doc = institutionalDb.documents[docIndex];

    if (!doc.auditLogs) doc.auditLogs = [];
    if (!doc.reprintHistory) doc.reprintHistory = [];

    if (action === "reprint") {
      doc.reprintCount = (doc.reprintCount || 0) + 1;
      const reprintLog: DocumentReprintLog = {
        reprintedAt: new Date().toISOString(),
        reprintedBy: performedBy,
        reason: reason || "পুনর্মুদ্রণ (Official Reprint)",
        copyNumber: doc.reprintCount + 1,
      };
      doc.reprintHistory.push(reprintLog);

      doc.auditLogs.push({
        id: `aud_${Date.now()}`,
        action: "reprinted",
        performedBy,
        timestamp: new Date().toISOString(),
        details: `নথি ${doc.docNumber} কপি #${doc.reprintCount + 1} পুনর্মুদ্রণ করা হয়েছে। কারণ: ${reason || "দাপ্তরিক কপি"}`,
      });

      doc.updatedAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        document: doc,
        message: `স্মারক নং ${doc.docNumber} এর পুনর্মুদ্রণ রেকর্ড সম্পন্ন হয়েছে (কপি #${doc.reprintCount + 1})`,
      });
    }

    if (action === "cancel") {
      if (!reason || reason.trim() === "") {
        return NextResponse.json({ success: false, error: "বাতিলকরণের সুনির্দিষ্ট কারণ উল্লেখ করা বাধ্যতামূলক" }, { status: 400 });
      }

      doc.status = "cancelled";
      doc.cancelledAt = new Date().toISOString();
      doc.cancelledBy = performedBy;
      doc.cancellationReason = reason;

      doc.auditLogs.push({
        id: `aud_${Date.now()}`,
        action: "cancelled",
        performedBy,
        timestamp: new Date().toISOString(),
        details: `নথি বাতিল করা হয়েছে। কারণ: ${reason}`,
      });

      doc.updatedAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        document: doc,
        message: `স্মারক নং ${doc.docNumber} সফলভাবে বাতিল করা হয়েছে।`,
      });
    }

    if (action === "issue") {
      doc.status = "issued";
      doc.auditLogs.push({
        id: `aud_${Date.now()}`,
        action: "issued",
        performedBy,
        timestamp: new Date().toISOString(),
        details: `ড্রাফট সনদপত্র অফিশিয়ালি ইস্যু ও অনুমোদন করা হয়েছে।`,
      });

      doc.updatedAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        document: doc,
        message: `স্মারক নং ${doc.docNumber} অফিশিয়ালি ইস্যু করা হয়েছে।`,
      });
    }

    // Normal update / edit (only permitted if not cancelled or admin overrides)
    if (doc.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "বাতিলকৃত সনদের বিবরণ সরাসরি পরিবর্তন করা সম্ভব নয়।" },
        { status: 400 }
      );
    }

    if (customBodyText !== undefined) doc.customBodyText = customBodyText;
    if (remarks !== undefined) doc.remarks = remarks;
    if (theme !== undefined) doc.theme = theme;
    if (signatories !== undefined) doc.signatories = signatories;

    doc.version = (doc.version || 1) + 1;
    doc.updatedAt = new Date().toISOString();

    doc.auditLogs.push({
      id: `aud_${Date.now()}`,
      action: "updated",
      performedBy,
      timestamp: new Date().toISOString(),
      details: `সনদপত্রের বিবরণ ও সেটিংস সংস্করণ #${doc.version}-এ হালনাগাদ করা হয়েছে।`,
    });

    return NextResponse.json({
      success: true,
      document: doc,
      message: `সনদপত্রের তথ্য সফলভাবে হালনাগাদ করা হয়েছে।`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyBackendAuthorization(req, {
    requiredPermission: "issue_certificates",
    endpointName: "/api/documents/[id] (DELETE)",
  });
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { id } = await params;
    const docIndex = institutionalDb.documents.findIndex((d) => d.id === id || d.docNumber === id);

    if (docIndex === -1) {
      return NextResponse.json({ success: false, error: "ডকুমেন্ট পাওয়া যায়নি" }, { status: 404 });
    }

    const doc = institutionalDb.documents[docIndex];
    if (doc.status === "issued") {
      return NextResponse.json(
        { success: false, error: "ইস্যুকৃত অফিশিয়াল নথি মুছে ফেলা নিষিদ্ধ। এটি বাতিল (Cancel) করুন।" },
        { status: 400 }
      );
    }

    institutionalDb.documents.splice(docIndex, 1);
    return NextResponse.json({ success: true, message: "ড্রাফট নথি সফলভাবে মুছে ফেলা হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
