import { NextResponse } from "next/server";
import { institutionalDb, Notice } from "@/lib/database";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let list = [...institutionalDb.notices];
    if (category && category !== "all") {
      list = list.filter((n) => n.category === category);
    }

    return NextResponse.json({
      success: true,
      items: list,
      total: list.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const categoryMap: Record<string, string> = {
      academic: "একাডেমিক",
      exam: "পরীক্ষা সংক্রান্ত",
      urgent: "জরুরি বিজ্ঞপ্তি",
      holiday: "ছুটি ও দিবস",
      admission: "ভর্তি সংক্রান্ত",
    };

    const newNotice: Notice = {
      id: Date.now(),
      title: body.title,
      titleBangla: body.titleBangla || body.title,
      content: body.content,
      category: body.category || "academic",
      categoryBangla: categoryMap[body.category] || "একাডেমিক",
      publishedAt: body.publishedAt || new Date().toISOString().slice(0, 10),
      expiryAt: body.expiryAt,
      author: body.author || "অধ্যক্ষের কার্যালয়",
      attachmentName: body.attachmentName,
      isUrgent: Boolean(body.isUrgent),
      status: body.status || "published",
      targetAudience: body.targetAudience || { type: "all" },
    };

    institutionalDb.notices.unshift(newNotice);

    return NextResponse.json({
      success: true,
      notice: newNotice,
      message: "নোটিশ সফলভাবে প্রচার করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const idx = institutionalDb.notices.findIndex((n) => n.id === Number(body.id));
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Notice not found" }, { status: 404 });
    }

    const categoryMap: Record<string, string> = {
      academic: "একাডেমিক",
      exam: "পরীক্ষা সংক্রান্ত",
      urgent: "জরুরি বিজ্ঞপ্তি",
      holiday: "ছুটি ও দিবস",
      admission: "ভর্তি সংক্রান্ত",
    };

    const updated = {
      ...institutionalDb.notices[idx],
      ...body,
      categoryBangla: categoryMap[body.category] || institutionalDb.notices[idx].categoryBangla,
      status: body.status || institutionalDb.notices[idx].status,
      targetAudience: body.targetAudience || institutionalDb.notices[idx].targetAudience,
    };

    institutionalDb.notices[idx] = updated;

    return NextResponse.json({
      success: true,
      notice: updated,
      message: "নোটিশ সফলভাবে আপডেট করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing ID parameter" }, { status: 400 });
    }

    institutionalDb.notices = institutionalDb.notices.filter((n) => n.id !== Number(id));

    return NextResponse.json({
      success: true,
      message: "নোটিশ সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
