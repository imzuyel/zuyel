import { NextRequest, NextResponse } from "next/server";
import {
  getHybridPresentations,
  upsertHybridPresentation,
  HybridPresentation,
} from "@/lib/hybridStorageEngine";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { isPrismaAvailable, safePrismaQuery } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").toLowerCase().trim();
    const classFilter = searchParams.get("class") || "all";
    const tradeFilter = searchParams.get("trade") || "all";
    const themeFilter = searchParams.get("theme") || "all";

    let presentations = getHybridPresentations();

    // Hydrate & merge from MySQL Prisma Presentation table when online
    if (isPrismaAvailable()) {
      const dbRows = await safePrismaQuery(async (p) => {
        return await p.presentation.findMany({
          where: { isPublished: true },
          orderBy: { updatedAt: "desc" },
          take: 150,
        });
      }, []);

      if (dbRows && dbRows.length > 0) {
        const byId = new Map<string, HybridPresentation>();
        for (const p of presentations) {
          byId.set(p.id, p);
        }
        for (const row of dbRows) {
          let parsedSlides: any[] = [];
          try {
            parsedSlides = JSON.parse(row.slidesJson || "[]");
          } catch {}
          const merged: HybridPresentation = {
            id: row.id,
            title: row.title,
            className: row.className,
            trade: row.trade,
            subject: row.subject,
            theme: row.theme || "twilight_indigo",
            slideCount: row.slideCount || parsedSlides.length,
            slides: parsedSlides,
            author: row.author,
            updatedAt: row.updatedAt.toISOString(),
          };
          const existing = byId.get(row.id);
          if (!existing || new Date(merged.updatedAt) >= new Date(existing.updatedAt)) {
            byId.set(row.id, merged);
          }
        }
        presentations = Array.from(byId.values()).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
    }

    if (search) {
      presentations = presentations.filter((p) => {
        return (
          p.title?.toLowerCase().includes(search) ||
          p.subject?.toLowerCase().includes(search) ||
          p.trade?.toLowerCase().includes(search) ||
          p.author?.toLowerCase().includes(search)
        );
      });
    }

    if (classFilter !== "all") {
      presentations = presentations.filter((p) => {
        const cls = p.className?.toLowerCase() || "";
        return cls.includes(classFilter.toLowerCase()) || classFilter.toLowerCase().includes(cls);
      });
    }

    if (tradeFilter !== "all") {
      presentations = presentations.filter((p) => {
        const trd = p.trade?.toLowerCase() || "";
        return trd.includes(tradeFilter.toLowerCase()) || tradeFilter.toLowerCase().includes(trd);
      });
    }

    if (themeFilter !== "all") {
      presentations = presentations.filter((p) => {
        return p.theme?.toLowerCase() === themeFilter.toLowerCase();
      });
    }

    return apiSuccess(presentations, {
      extraKeys: {
        presentations,
        count: presentations.length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/presentations error:", error);
    return apiError(error, {
      fallbackMessage: "প্রেজেন্টেশন ডেটা লোড করতে সমস্যা হয়েছে",
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      className = "Class 9",
      trade = "All",
      subject = "সাধারণ বিষয়",
      theme = "twilight_indigo",
      slides = [],
      author = "শিক্ষক (PTSC)",
      id,
    } = body || {};

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "প্রেজেন্টেশনের শিরোনাম দেওয়া আবশ্যক" },
        { status: 400 }
      );
    }

    const normalizedTheme = theme === "cyberpunk_neon" ? "twilight_indigo" : theme;

    const saved = upsertHybridPresentation({
      id,
      title: title.trim(),
      className,
      trade,
      subject,
      theme: normalizedTheme,
      slides,
      author,
    });

    if (isPrismaAvailable()) {
      await safePrismaQuery(async (p) => {
        await p.presentation.upsert({
          where: { id: saved.id },
          create: {
            id: saved.id,
            title: saved.title,
            className: saved.className,
            trade: saved.trade || "All",
            subject: saved.subject,
            theme: saved.theme,
            slideCount: saved.slideCount || saved.slides.length,
            slidesJson: JSON.stringify(saved.slides || []),
            author: saved.author,
            isPublished: true,
          },
          update: {
            title: saved.title,
            className: saved.className,
            trade: saved.trade || "All",
            subject: saved.subject,
            theme: saved.theme,
            slideCount: saved.slideCount || saved.slides.length,
            slidesJson: JSON.stringify(saved.slides || []),
            author: saved.author,
          },
        });
        return true;
      }, false);
    }

    return NextResponse.json({
      success: true,
      message: "প্রেজেন্টেশন সফলভাবে সেভ করা হয়েছে",
      presentation: saved,
    });
  } catch (error: any) {
    console.error("POST /api/presentations error:", error);
    return NextResponse.json(
      { success: false, message: "প্রেজেন্টেশন সংরক্ষণে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
