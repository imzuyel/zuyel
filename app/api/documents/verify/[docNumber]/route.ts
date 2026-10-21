import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { initialGeneratedDocuments } from "@/lib/documentsData";
import { maskSensitiveInfo } from "@/lib/certificateVerifier";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docNumber: string }> }
) {
  try {
    const { docNumber } = await params;
    const { searchParams } = new URL(req.url);

    // Support both path parameter and query parameter fallback
    let rawMemo = (
      searchParams.get("docNumber") ||
      searchParams.get("doc") ||
      searchParams.get("id") ||
      docNumber ||
      ""
    );

    // Safe multi-pass URI decoding (handles slashes %2F, hyphens, and spaces)
    for (let i = 0; i < 2; i++) {
      try {
        if (rawMemo.includes("%")) {
          rawMemo = decodeURIComponent(rawMemo);
        }
      } catch {
        break;
      }
    }
    rawMemo = rawMemo.trim();

    if (!rawMemo || rawMemo.length > 100) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          verificationStatus: "NOT_FOUND",
          errorCode: "INVALID_LENGTH",
          message: "স্মারক নম্বরটি সঠিক নয় বা অতিরিক্ত দীর্ঘ।",
          queriedMemo: rawMemo ? rawMemo.slice(0, 50) : "",
        },
        { status: 400 }
      );
    }

    const decodedMemo = rawMemo.replace(/[^a-zA-Z0-9\-_/.\s]/g, "").trim();
    const queryUpper = decodedMemo.toUpperCase();

    // Search across in-memory database and initial documents
    const allDocs = [
      ...(institutionalDb.documents || []),
      ...initialGeneratedDocuments,
    ];

    const doc = allDocs.find((d: any) => {
      const num = (d.docNumber || "").toUpperCase();
      const id = (d.id || "").toUpperCase();
      const sCode = (d.studentCode || "").toUpperCase();
      return num === queryUpper || num.includes(queryUpper) || id === queryUpper || sCode === queryUpper;
    });

    if (!doc) {
      return NextResponse.json({
        success: false,
        verified: false,
        verificationStatus: "NOT_FOUND",
        errorCode: "NOT_FOUND",
        message: "স্মারক নম্বরটি প্রাতিষ্ঠানিক ডাটাবেসে পাওয়া যায়নি বা এটি একটি অনিবন্ধিত নথি।",
        queriedMemo: decodedMemo,
      });
    }

    const docAny = doc as any;
    const isRevoked = docAny.status === "cancelled" || docAny.status === "revoked";
    const isExpired = Boolean(docAny.validityDate && new Date(docAny.validityDate).getTime() < Date.now());
    const isIssued = (doc.status === "issued" || doc.status === "generated") && !isRevoked && !isExpired;

    const verificationStatus = isRevoked ? "REVOKED" : isExpired ? "EXPIRED" : isIssued ? "VALID" : "REVOKED";

    // Mask sensitive details for public privacy
    const maskedStudentId = maskSensitiveInfo(doc.studentCode || `PTSC-${doc.roll || 1}`, 6, 2);

    return NextResponse.json({
      success: true,
      verified: isIssued,
      verificationStatus,
      errorCode: !isIssued ? verificationStatus : undefined,
      document: {
        docNumber: doc.docNumber,
        docType: doc.docType,
        docTypeBangla: doc.docTypeBangla || "প্রশংসাপত্র / সনদ",
        studentName: doc.studentNameBangla || doc.studentName,
        studentIdMasked: maskedStudentId,
        className: doc.className,
        tradeName: doc.tradeNameBangla || doc.tradeName || "—",
        session: doc.session,
        roll: doc.roll,
        issueDate: doc.issueDate,
        issueDateBangla: doc.issueDateBangla,
        generatedBy: doc.generatedBy || "প্রকৌঃ মোঃ আমিনুল ইসলাম (অধ্যক্ষ)",
        status: doc.status,
        statusBangla:
          verificationStatus === "VALID"
            ? "বৈধ ও সক্রিয় (Officially Issued)"
            : verificationStatus === "REVOKED"
            ? "বাতিলকৃত বা অকার্যকর (Cancelled / Revoked)"
            : verificationStatus === "EXPIRED"
            ? "মেয়াদোত্তীর্ণ (Expired)"
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
