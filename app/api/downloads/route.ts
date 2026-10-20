import { NextResponse } from "next/server";
import { institutionalDb, DownloadItem } from "@/lib/database";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let list = [...institutionalDb.downloads];
    if (category && category !== "all") {
      list = list.filter((d) => d.category === category);
    }

    // Sort by display order
    list.sort((a, b) => a.displayOrder - b.displayOrder);

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
      syllabus: "সিলেবাস ও কারিকুলাম",
      form: "ভর্তি ফরম ও আবেদন",
      routine: "পরীক্ষা ও ক্লাস রুটিন",
      calendar: "একাডেমিক ক্যালেন্ডার",
      question_paper: "বিগত বছরের প্রশ্নপত্র",
      other: "অন্যান্য নোটিশ ও নথি",
    };

    const newDownload: DownloadItem = {
      id: Date.now(),
      title: body.title,
      titleBangla: body.titleBangla || body.title,
      category: body.category || "other",
      categoryBangla: categoryMap[body.category] || "অন্যান্য নোটিশ ও নথি",
      fileName: body.fileName || "document.pdf",
      fileSize: body.fileSize || "1.0 MB",
      downloadUrl: body.downloadUrl || "https://bteb.gov.bd",
      published: body.published !== undefined ? Boolean(body.published) : true,
      displayOrder: Number(body.displayOrder) || 10,
      description: body.description || "",
      createdAt: new Date().toISOString(),
    };

    institutionalDb.downloads.unshift(newDownload);

    return NextResponse.json({
      success: true,
      item: newDownload,
      message: "ডাউনলোডযোগ্য ফাইল সফলভাবে যুক্ত করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const idx = institutionalDb.downloads.findIndex((d) => d.id === Number(body.id));
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Download item not found" }, { status: 404 });
    }

    const categoryMap: Record<string, string> = {
      syllabus: "সিলেবাস ও কারিকুলাম",
      form: "ভর্তি ফরম ও আবেদন",
      routine: "পরীক্ষা ও ক্লাস রুটিন",
      calendar: "একাডেমিক ক্যালেন্ডার",
      question_paper: "বিগত বছরের প্রশ্নপত্র",
      other: "অন্যান্য নোটিশ ও নথি",
    };

    const updated = {
      ...institutionalDb.downloads[idx],
      ...body,
      categoryBangla: categoryMap[body.category] || institutionalDb.downloads[idx].categoryBangla,
    };

    institutionalDb.downloads[idx] = updated;

    return NextResponse.json({
      success: true,
      item: updated,
      message: "ডাউনলোড ফাইল তথ্য সফলভাবে আপডেট করা হয়েছে।",
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

    institutionalDb.downloads = institutionalDb.downloads.filter((d) => d.id !== Number(id));

    return NextResponse.json({
      success: true,
      message: "ডাউনলোড ফাইল সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
