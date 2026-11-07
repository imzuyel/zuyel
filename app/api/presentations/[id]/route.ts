import { NextRequest, NextResponse } from "next/server";
import {
  getHybridPresentationById,
  upsertHybridPresentation,
  deleteHybridPresentation,
} from "@/lib/hybridStorageEngine";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const presentation = getHybridPresentationById(id);

    if (!presentation) {
      return NextResponse.json(
        { success: false, message: "প্রেজেন্টেশন পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    return apiSuccess(presentation, {
      extraKeys: { presentation },
    });
  } catch (error: any) {
    console.error("Error in GET /api/presentations/[id]:", error);
    return apiError(error, { fallbackMessage: "প্রেজেন্টেশন লোড করতে ব্যর্থ হয়েছে" });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = getHybridPresentationById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "হালনাগাদ করার জন্য প্রেজেন্টেশন পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const updated = upsertHybridPresentation({
      ...existing,
      ...body,
      id,
    });

    return NextResponse.json({
      success: true,
      message: "প্রেজেন্টেশন সফলভাবে আপডেট করা হয়েছে",
      presentation: updated,
    });
  } catch (error: any) {
    console.error("Error in PUT /api/presentations/[id]:", error);
    return apiError(error, { fallbackMessage: "প্রেজেন্টেশন আপডেট করতে ব্যর্থ হয়েছে" });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteHybridPresentation(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "প্রেজেন্টেশন পাওয়া যায়নি বা ডিলিট করা যায়নি" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "প্রেজেন্টেশন সফলভাবে ডিলিট করা হয়েছে",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/presentations/[id]:", error);
    return apiError(error, { fallbackMessage: "প্রেজেন্টেশন মুছতে ব্যর্থ হয়েছে" });
  }
}

