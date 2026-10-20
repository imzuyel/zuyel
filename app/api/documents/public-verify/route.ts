import { NextResponse } from "next/server";
import { verifyDocumentRecord } from "@/lib/certificateVerifier";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const docQuery =
      searchParams.get("docNumber") ||
      searchParams.get("doc") ||
      searchParams.get("id") ||
      "";

    if (!docQuery.trim()) {
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

    const verificationResult = await verifyDocumentRecord(docQuery);

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
