import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, GeneratedDocument, DocumentType, DocumentStatus, DocumentAuditLog } from "@/lib/database";
import { formatDocumentNo, toBanglaDateString } from "@/lib/utils";
import { DOCUMENT_TYPE_LABELS, replaceDocumentTokens, DEFAULT_SIGNATORIES } from "@/lib/documentsData";
import { verifyBackendAuthorization } from "@/lib/serverAuthGuard";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const docNumber = searchParams.get("docNumber");
    const studentId = searchParams.get("studentId");
    const docType = searchParams.get("docType");
    const status = searchParams.get("status");
    const classId = searchParams.get("classId");
    const tradeId = searchParams.get("tradeId");
    const session = searchParams.get("session");
    const search = searchParams.get("search");

    if (docNumber) {
      const found = institutionalDb.documents.find(
        (d) => d.docNumber.toLowerCase() === docNumber.trim().toLowerCase() || d.id === docNumber
      );
      if (!found) {
        return NextResponse.json({ success: false, error: "সনদপত্র বা নথি পাওয়া যায়নি" }, { status: 404 });
      }
      return NextResponse.json({ success: true, document: found });
    }

    let list = [...institutionalDb.documents];

    if (studentId) {
      list = list.filter((d) => d.studentId === Number(studentId));
    }

    if (docType && docType !== "all") {
      list = list.filter((d) => d.docType === docType);
    }

    if (status && status !== "all") {
      list = list.filter((d) => d.status === status);
    }

    if (classId && classId !== "all") {
      list = list.filter((d) => String(d.classId) === String(classId));
    }

    if (tradeId && tradeId !== "all") {
      list = list.filter((d) => String(d.tradeId) === String(tradeId));
    }

    if (session && session !== "all") {
      list = list.filter((d) => d.session === session);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.docNumber.toLowerCase().includes(q) ||
          d.studentName.toLowerCase().includes(q) ||
          (d.studentNameBangla && d.studentNameBangla.includes(q)) ||
          d.studentCode.toLowerCase().includes(q) ||
          (d.remarks && d.remarks.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate Summary Stats
    const stats = {
      total: institutionalDb.documents.length,
      issued: institutionalDb.documents.filter((d) => d.status === "issued").length,
      generated: institutionalDb.documents.filter((d) => d.status === "generated").length,
      draft: institutionalDb.documents.filter((d) => d.status === "draft").length,
      cancelled: institutionalDb.documents.filter((d) => d.status === "cancelled").length,
      byType: {
        testimonial: institutionalDb.documents.filter((d) => d.docType === "testimonial").length,
        certificate: institutionalDb.documents.filter((d) => d.docType === "certificate").length,
        transfer_certificate: institutionalDb.documents.filter((d) => d.docType === "transfer_certificate").length,
        bonafide: institutionalDb.documents.filter((d) => d.docType === "bonafide").length,
        character: institutionalDb.documents.filter((d) => d.docType === "character").length,
      }
    };

    return NextResponse.json({
      success: true,
      documents: list,
      total: list.length,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyBackendAuthorization(req, {
    requiredPermission: "issue_certificates",
    endpointName: "/api/documents (POST)",
  });
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const {
      studentId,
      docType = "testimonial",
      theme = "gov_classic",
      generatedBy = "Engr. Md. Aminul Islam (Principal)",
      remarks = "",
      customBodyText,
      customMemoNo,
      leavingReason,
      passingYear,
      issueDate,
      signatories,
      conductStatement,
      status = "issued",
      templateId,
    } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, error: "শিক্ষার্থী নির্বাচন করা আবশ্যক" }, { status: 400 });
    }

    const student = institutionalDb.students.find((s) => s.id === Number(studentId));
    if (!student) {
      return NextResponse.json({ success: false, error: "শিক্ষার্থী ডাটাবেসে পাওয়া যায়নি" }, { status: 404 });
    }

    const typeConfig = DOCUMENT_TYPE_LABELS[docType] || DOCUMENT_TYPE_LABELS.testimonial;
    const session = student.session || "2026";
    
    // Check if customMemoNo provided and is unique, else generate sequential unique number
    let docNumber = customMemoNo?.trim();
    if (!docNumber) {
      const serial = institutionalDb.documents.length + 101;
      docNumber = formatDocumentNo(typeConfig.code, session, serial);
    }

    // Prevent Duplicate Active Document Number
    const existing = institutionalDb.documents.find((d) => d.docNumber.toLowerCase() === docNumber.toLowerCase());
    if (existing) {
      const uniqueSerial = institutionalDb.documents.length + 1000 + Math.floor(Math.random() * 900);
      docNumber = formatDocumentNo(typeConfig.code, session, uniqueSerial);
    }

    const todayStr = issueDate || new Date().toISOString().slice(0, 10);
    const todayBangla = toBanglaDateString(todayStr);

    // Dynamic body text generation
    const finalBodyText =
      customBodyText && customBodyText.trim() !== ""
        ? customBodyText
        : replaceDocumentTokens(typeConfig.defaultBodyTemplate, student, {
            memoNo: docNumber,
            issueDate: todayStr,
            leavingReason,
            passingYear: passingYear || session,
          });

    const activeSignatories = signatories && Array.isArray(signatories) && signatories.length > 0
      ? signatories
      : DEFAULT_SIGNATORIES;

    const initialAuditLog: DocumentAuditLog = {
      id: `aud_${Date.now()}`,
      action: status === "issued" ? "issued" : "created",
      performedBy: generatedBy,
      timestamp: new Date().toISOString(),
      details: `${typeConfig.bn} সনদপত্র সফলভাবে তৈরি ও ${status === "issued" ? "ইস্যু" : "ড্রাফট হিসেবে সংরক্ষণ"} করা হয়েছে।`,
    };

    const newDoc: GeneratedDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      docNumber,
      docType: docType as DocumentType,
      docTypeBangla: typeConfig.bn,
      theme: theme || "gov_classic",
      studentId: student.id,
      studentCode: student.studentId,
      studentName: student.name,
      studentNameBangla: student.nameBangla || student.name,
      roll: student.roll,
      classId: student.classId,
      className: student.className,
      tradeId: student.tradeId,
      tradeName: student.tradeName,
      tradeNameBangla: student.tradeNameBangla,
      section: student.section,
      session: student.session || "2026",
      admissionNo: student.admissionNo || `ADM-${student.studentId}`,
      fatherName: student.fatherName || "মোঃ রফিকুল ইসলাম",
      motherName: student.motherName || "মোছাঃ রোকেয়া বেগম",
      dob: student.dob,
      dobBangla: student.dobBangla || toBanglaDateString(student.dob),
      birthRegNo: student.birthRegNo || "—",
      gpa: student.gpa || "5.00",
      resultStatus: student.resultStatus || "Passed",
      passingYear: passingYear || session,
      leavingReason: leavingReason || "উচ্চতর শিক্ষা ও পেশাগত কারিগরি ক্ষেত্রে ভর্তির সুবিধার্থে",
      issueDate: todayStr,
      issueDateBangla: todayBangla,
      generatedBy,
      qrCodeData: `https://tsc.panchagarh.gov.bd/verify?doc=${encodeURIComponent(docNumber)}&id=${student.studentId}`,
      customBodyText: finalBodyText,
      remarks: remarks || "অফিসিয়াল রেকর্ড অনুসারে যাচাইকৃত ও অনুমোদিত",
      status: (status as DocumentStatus) || "issued",
      version: 1,
      reprintCount: 0,
      reprintHistory: [],
      signatories: activeSignatories,
      templateId,
      conductStatement: conductStatement || typeConfig.conductStatement,
      auditLogs: [initialAuditLog],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    institutionalDb.documents.unshift(newDoc);

    return NextResponse.json({
      success: true,
      document: newDoc,
      message: `${typeConfig.bn} সফলভাবে তৈরি ও সংরক্ষিত হয়েছে। স্মারক নং: ${docNumber}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to generate document" }, { status: 500 });
  }
}
