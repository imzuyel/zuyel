import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docNumber: string }> }
) {
  try {
    const { docNumber } = await params;
    const decodedMemo = decodeURIComponent(docNumber).trim();

    const doc = institutionalDb.documents.find(
      (d) =>
        d.docNumber.toLowerCase() === decodedMemo.toLowerCase() ||
        d.id.toLowerCase() === decodedMemo.toLowerCase()
    );

    if (!doc) {
      return NextResponse.json({
        success: false,
        verified: false,
        message: "স্মারক নম্বরটি প্রাতিষ্ঠানিক ডাটাবেসে পাওয়া যায়নি বা এটি একটি অনিবন্ধিত নথি।",
        queriedMemo: decodedMemo,
      });
    }

    // Mask sensitive details for public privacy
    const maskedStudentId = doc.studentCode
      ? doc.studentCode.replace(/^(.{6})(.*)(.{3})$/, "$1***$3")
      : "PTSC-***";

    const isAuthentic = doc.status === "issued" || doc.status === "generated";

    return NextResponse.json({
      success: true,
      verified: isAuthentic,
      document: {
        docNumber: doc.docNumber,
        docType: doc.docType,
        docTypeBangla: doc.docTypeBangla,
        studentName: doc.studentNameBangla || doc.studentName,
        studentIdMasked: maskedStudentId,
        className: doc.className,
        tradeName: doc.tradeNameBangla || doc.tradeName || "—",
        session: doc.session,
        roll: doc.roll,
        issueDate: doc.issueDate,
        issueDateBangla: doc.issueDateBangla,
        generatedBy: doc.generatedBy,
        status: doc.status,
        statusBangla:
          doc.status === "issued"
            ? "বৈধ ও সক্রিয় (Officially Issued)"
            : doc.status === "cancelled"
            ? "বাতিলকৃত (Cancelled / Revoked)"
            : "খসড়া (Draft)",
        cancelledAt: doc.cancelledAt,
        cancellationReason: doc.cancellationReason,
        institution: {
          name: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
          nameEnglish: "Panchagarh Government Technical School and College (PTSC)",
          eiin: "132244",
          code: "18017",
          location: "পঞ্চগড় সদর, পঞ্চগড়",
          directorate: "কারিগরি শিক্ষা অধিদপ্তর (DTE), শিক্ষা মন্ত্রণালয়",
        },
        securitySeal: "VERIFIED-GOVT-BTEB-SECURED",
        reprintCount: doc.reprintCount || 0,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
