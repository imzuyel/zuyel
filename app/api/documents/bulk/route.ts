import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, GeneratedDocument, DocumentType, DocumentStatus, DocumentAuditLog } from "@/lib/database";
import { formatDocumentNo, toBanglaDateString } from "@/lib/utils";
import { DOCUMENT_TYPE_LABELS, replaceDocumentTokens, DEFAULT_SIGNATORIES } from "@/lib/documentsData";
import { verifyBackendAuthorization } from "@/lib/serverAuthGuard";

export async function POST(req: NextRequest) {
  const auth = verifyBackendAuthorization(req, {
    requiredPermission: "issue_certificates",
    endpointName: "/api/documents/bulk",
  });
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const {
      studentIds,
      classId,
      tradeId,
      section,
      session = "2026",
      docType = "testimonial",
      theme = "gov_classic",
      generatedBy = "Engr. Md. Aminul Islam (Principal)",
      remarks = "বাল্ক জেনারেশন - প্রাতিষ্ঠানিক রেজিস্ট্রি অন্তর্ভুক্ত",
      leavingReason,
      passingYear,
      issueDate,
      signatories,
      status = "issued",
      templateId,
    } = body;

    let targetStudents: any[] = [];

    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      targetStudents = institutionalDb.students.filter((s) => studentIds.includes(s.id));
    } else if (classId && classId !== "all") {
      targetStudents = institutionalDb.students.filter((s) => {
        if (String(s.classId) !== String(classId)) return false;
        if (tradeId && tradeId !== "all" && String(s.tradeId) !== String(tradeId)) return false;
        if (section && section !== "all" && s.section !== section) return false;
        if (session && session !== "all" && s.session !== session) return false;
        return true;
      });
    }

    if (targetStudents.length === 0) {
      return NextResponse.json(
        { success: false, error: "বাল্ক জেনারেশনের জন্য কোনো শিক্ষার্থী পাওয়া যায়নি।" },
        { status: 400 }
      );
    }

    const typeConfig = DOCUMENT_TYPE_LABELS[docType] || DOCUMENT_TYPE_LABELS.testimonial;
    const todayStr = issueDate || new Date().toISOString().slice(0, 10);
    const todayBangla = toBanglaDateString(todayStr);
    const activeSignatories = signatories && Array.isArray(signatories) && signatories.length > 0
      ? signatories
      : DEFAULT_SIGNATORIES;

    const generatedDocs: GeneratedDocument[] = [];
    let startSerial = institutionalDb.documents.length + 101;

    for (const student of targetStudents) {
      const docNumber = formatDocumentNo(typeConfig.code, student.session || session, startSerial);
      startSerial++;

      const personalizedBody = replaceDocumentTokens(typeConfig.defaultBodyTemplate, student, {
        memoNo: docNumber,
        issueDate: todayStr,
        leavingReason,
        passingYear: passingYear || student.session || session,
      });

      const auditLog: DocumentAuditLog = {
        id: `aud_${Date.now()}_${student.id}`,
        action: status === "issued" ? "issued" : "created",
        performedBy: generatedBy,
        timestamp: new Date().toISOString(),
        details: `বাল্ক অপারেশনে ${typeConfig.bn} সফলভাবে প্রস্তুত ও ইস্যু করা হয়েছে।`,
      };

      const newDoc: GeneratedDocument = {
        id: `doc_${Date.now()}_${student.id}_${Math.random().toString(36).substr(2, 4)}`,
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
        session: student.session || session,
        admissionNo: student.admissionNo || `ADM-${student.studentId}`,
        fatherName: student.fatherName || "মোঃ রফিকুল ইসলাম",
        motherName: student.motherName || "মোছাঃ রোকেয়া বেগম",
        dob: student.dob,
        dobBangla: student.dobBangla || toBanglaDateString(student.dob),
        birthRegNo: student.birthRegNo || "—",
        gpa: student.gpa || "5.00",
        resultStatus: student.resultStatus || "Passed",
        passingYear: passingYear || student.session || session,
        leavingReason: leavingReason || "উচ্চতর শিক্ষা ও পেশাগত কারিগরি ক্ষেত্রে ভর্তির সুবিধার্থে",
        issueDate: todayStr,
        issueDateBangla: todayBangla,
        generatedBy,
        qrCodeData: `https://tsc.panchagarh.gov.bd/verify?doc=${encodeURIComponent(docNumber)}&id=${student.studentId}`,
        customBodyText: personalizedBody,
        remarks,
        status: (status as DocumentStatus) || "issued",
        version: 1,
        reprintCount: 0,
        reprintHistory: [],
        signatories: activeSignatories,
        templateId,
        conductStatement: typeConfig.conductStatement,
        auditLogs: [auditLog],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      institutionalDb.documents.unshift(newDoc);
      generatedDocs.push(newDoc);
    }

    return NextResponse.json({
      success: true,
      count: generatedDocs.length,
      documents: generatedDocs,
      message: `একসাথে ${generatedDocs.length} জন শিক্ষার্থীর জন্য ${typeConfig.bn} সফলভাবে তৈরি ও ইস্যু করা হয়েছে!`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Bulk generation failed" }, { status: 500 });
  }
}
