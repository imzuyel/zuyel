import { NextResponse } from "next/server";
import { verifyDocumentRecord } from "@/lib/certificateVerifier";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = (
      searchParams.get("docNumber") ||
      searchParams.get("doc") ||
      searchParams.get("id") ||
      ""
    ).trim();

    if (!rawQuery) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "সনদের স্মারক বা ট্র্যাকিং নম্বর প্রদান করা আবশ্যক।",
          errorCode: "MISSING_QUERY",
        },
        { status: 400 }
      );
    }

    if (rawQuery.length > 100) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "সনদ নম্বরটি অতিরিক্ত দীর্ঘ (সর্বোচ্চ ১০০ অক্ষর)।",
          errorCode: "INVALID_LENGTH",
        },
        { status: 400 }
      );
    }

    // Sanitize query to prevent injection or malformed strings
    const sanitizedQuery = rawQuery.replace(/[^a-zA-Z0-9\-_/.\s]/g, "").trim();
    if (!sanitizedQuery) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "সনদ নম্বরে শুধুমাত্র বর্ণ, সংখ্যা এবং হাইফেন/স্ল্যাশ গ্রহণযোগ্য।",
          errorCode: "INVALID_FORMAT",
        },
        { status: 400 }
      );
    }

    const verificationResult = await verifyDocumentRecord(sanitizedQuery);

    return NextResponse.json({
      success: true,
      verified: verificationResult.verified,
      message: verificationResult.message,
      messageBangla: verificationResult.messageBangla,
      document: verificationResult.document || null,
      errorCode: verificationResult.errorCode,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        verified: false,
        error: error.message || "ভেরিফিকেশন প্রক্রিয়ায় অপ্রত্যাশিত সমস্যা দেখা দিয়েছে।",
      },
      { status: 500 }
    );
  }
}
