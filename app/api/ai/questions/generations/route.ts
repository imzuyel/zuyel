import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function GET(req: NextRequest) {
  try {
    const list = [...institutionalDb.aiGenerationJobs];
    return NextResponse.json({
      success: true,
      generations: list,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch AI generations history" },
      { status: 500 }
    );
  }
}
