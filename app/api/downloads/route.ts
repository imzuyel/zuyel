import { NextRequest } from "next/server";
import { institutionalDb, DownloadItem } from "@/lib/database";
import { requireAdmin } from "@/lib/serverAuthGuard";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let list = [...(institutionalDb.downloads || [])];
    if (category && category !== "all") {
      list = list.filter((d) => d.category === category);
    }

    // Sort by display order
    list.sort((a, b) => a.displayOrder - b.displayOrder);

    return apiSuccess(list, {
      extraKeys: {
        items: list,
        downloads: list,
        total: list.length,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "ডাউনলোড তালিকা লোড করতে সমস্যা হয়েছে" });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req, "downloads:create");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    if (!body.title && !body.titleBangla) {
      return apiError("ফাইলের শিরোনাম আবশ্যক", { status: 400 });
    }

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
      title: (body.title || body.titleBangla).trim().slice(0, 200),
      titleBangla: (body.titleBangla || body.title).trim().slice(0, 200),
      category: body.category || "other",
      categoryBangla: categoryMap[body.category] || "অন্যান্য নোটিশ ও নথি",
      fileName: body.fileName || "document.pdf",
      fileSize: body.fileSize || "1.0 MB",
      downloadUrl: body.downloadUrl || "https://bteb.gov.bd",
      published: body.published !== undefined ? Boolean(body.published) : true,
      displayOrder: Number(body.displayOrder) || 10,
      description: (body.description || "").trim().slice(0, 1000),
      createdAt: new Date().toISOString(),
    };

    institutionalDb.downloads.unshift(newDownload);

    return apiSuccess(newDownload, {
      message: "ডাউনলোডযোগ্য ফাইল সফলভাবে যুক্ত করা হয়েছে।",
      extraKeys: {
        item: newDownload,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "ডাউনলোড ফাইল যুক্ত করতে সমস্যা হয়েছে" });
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req, "downloads:update");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const id = Number(body.id);
    const idx = institutionalDb.downloads.findIndex((d) => d.id === id);
    if (idx === -1) {
      return apiError("ফাইল পাওয়া যায়নি (Download item not found)", { status: 404 });
    }

    const categoryMap: Record<string, string> = {
      syllabus: "সিলেবাস ও কারিকুলাম",
      form: "ভর্তি ফরম ও আবেদন",
      routine: "পরীক্ষা ও ক্লাস রুটিন",
      calendar: "একাডেমিক ক্যালেন্ডার",
      question_paper: "বিগত বছরের প্রশ্নপত্র",
      other: "অন্যান্য নোটিশ ও নথি",
    };

    const updated: DownloadItem = {
      ...institutionalDb.downloads[idx],
      ...body,
      categoryBangla: categoryMap[body.category] || institutionalDb.downloads[idx].categoryBangla,
    };

    institutionalDb.downloads[idx] = updated;

    return apiSuccess(updated, {
      message: "ডাউনলোড ফাইল তথ্য সফলভাবে আপডেট করা হয়েছে।",
      extraKeys: {
        item: updated,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "ডাউনলোড ফাইল আপডেট করতে ব্যর্থ হয়েছে" });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req, "downloads:delete");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return apiError("আইডি প্রদান করুন", { status: 400 });
    }

    const initialLength = institutionalDb.downloads.length;
    institutionalDb.downloads = institutionalDb.downloads.filter((d) => d.id !== Number(id));

    if (institutionalDb.downloads.length === initialLength) {
      return apiError("ফাইল পাওয়া যায়নি", { status: 404 });
    }

    return apiSuccess({ deletedId: Number(id) }, {
      message: "ডাউনলোড ফাইল সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "ফাইল মুছে ফেলতে সমস্যা হয়েছে" });
  }
}
