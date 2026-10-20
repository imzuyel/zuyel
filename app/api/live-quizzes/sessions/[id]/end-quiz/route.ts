import { NextRequest, NextResponse } from "next/server";
import { FinalResultService } from "@/lib/reportService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = FinalResultService.finalize(id);

    return NextResponse.json({
      success: true,
      message: "Live quiz session completed and results finalized successfully.",
      session: result.session
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to end quiz session" },
      { status: 500 }
    );
  }
}
