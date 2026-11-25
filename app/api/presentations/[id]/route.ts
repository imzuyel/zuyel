import { NextRequest, NextResponse } from "next/server";
import {
  getHybridPresentationById,
  upsertHybridPresentation,
  deleteHybridPresentation,
} from "@/lib/hybridStorageEngine";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { isPrismaAvailable, safePrismaQuery } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let presentation = getHybridPresentationById(id);

    if (!presentation && isPrismaAvailable()) {
      const dbRow = await safePrismaQuery(async (p) => {
        return await p.presentation.findUnique({ where: { id } });
      }, null);

      if (dbRow) {
        let parsedSlides: any[] = [];
        try {
          parsedSlides = JSON.parse(dbRow.slidesJson || "[]");
        } catch {}
        presentation = upsertHybridPresentation({
          id: dbRow.id,
          title: dbRow.title,
          className: dbRow.className,
          trade: dbRow.trade,
          subject: dbRow.subject,
          theme: dbRow.theme || "twilight_indigo",
          slides: parsedSlides,
          author: dbRow.author,
        });
      }
    }

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
    console.error("GET /api/presentations/[id] error:", error);
    return apiError(error, { fallbackMessage: "প্রেজেন্টেশন লোড করতে সমস্যা হয়েছে" });
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
    if (!existing && !isPrismaAvailable()) {
      return NextResponse.json(
        { success: false, message: "হালনাগাদ করার জন্য প্রেজেন্টেশন পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    const updated = upsertHybridPresentation({
      ...(existing || { title: body.title || "প্রেজেন্টেশন ডেক" }),
      ...body,
      id,
    });

    if (isPrismaAvailable()) {
      await safePrismaQuery(async (p) => {
        await p.presentation.upsert({
          where: { id },
          create: {
            id: updated.id,
            title: updated.title,
            className: updated.className,
            trade: updated.trade || "All",
            subject: updated.subject,
            theme: updated.theme,
            slideCount: updated.slideCount || updated.slides.length,
            slidesJson: JSON.stringify(updated.slides || []),
            author: updated.author,
            isPublished: true,
          },
          update: {
            title: updated.title,
            className: updated.className,
            trade: updated.trade || "All",
            subject: updated.subject,
            theme: updated.theme,
            slideCount: updated.slideCount || updated.slides.length,
            slidesJson: JSON.stringify(updated.slides || []),
            author: updated.author,
          },
        });
        return true;
      }, false);
    }

    return NextResponse.json({
      success: true,
      message: "প্রেজেন্টেশন সফলভাবে আপডেট করা হয়েছে",
      presentation: updated,
    });
  } catch (error: any) {
    console.error("Error in PUT /api/presentations/[id]:", error);
    return apiError(error, { fallbackMessage: "প্রেজেন্টেশন আপডেট করতে সমস্যা হয়েছে" });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteHybridPresentation(id);
    let dbDeleted = false;

    if (isPrismaAvailable()) {
      dbDeleted = await safePrismaQuery(async (p) => {
        await p.presentation.delete({ where: { id } });
        return true;
      }, false);
    }

    if (!deleted && !dbDeleted) {
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
