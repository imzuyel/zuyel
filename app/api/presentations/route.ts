import { NextRequest, NextResponse } from "next/server";
import {
  getHybridPresentations,
  upsertHybridPresentation,
  HybridPresentation,
} from "@/lib/hybridStorageEngine";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").toLowerCase().trim();
    const classFilter = searchParams.get("class") || "all";
    const tradeFilter = searchParams.get("trade") || "all";
    const themeFilter = searchParams.get("theme") || "all";

    let presentations = getHybridPresentations();

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
        total: presentations.length,
        presentations,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/presentations:", error);
    return apiError(error, { fallbackMessage: "প্রেজেন্টেশন তালিকা লোড করতে ব্যর্থ হয়েছে" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      className = "Class 9",
      trade = "Computer & IT",
      subject = "কারিগরি বিষয়",
      theme = "cyberpunk_neon",
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

    const saved = upsertHybridPresentation({
      id,
      title: title.trim(),
      className,
      trade,
      subject,
      theme,
      slides,
      author,
    });

    return NextResponse.json({
      success: true,
      message: "প্রেজেন্টেশন সফলভাবে সেভ করা হয়েছে",
      presentation: saved,
    });
  } catch (error: any) {
    console.error("Error in POST /api/presentations:", error);
    return apiError(error, { fallbackMessage: "প্রেজেন্টেশন সেভ করতে ব্যর্থ হয়েছে" });
  }
}

