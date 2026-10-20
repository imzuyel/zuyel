import { NextRequest } from "next/server";
import { institutionalDb, GalleryItem } from "@/lib/database";
import { requireAdmin } from "@/lib/serverAuthGuard";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let list = [...(institutionalDb.gallery || [])];
    if (category && category !== "all") {
      list = list.filter((item) => item.category === category);
    }

    return apiSuccess(list, {
      extraKeys: {
        items: list,
        gallery: list,
        total: list.length,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "গ্যালারি ছবি লোড করতে সমস্যা হয়েছে" });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req, "gallery:create");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    if (!body.title && !body.titleBangla) {
      return apiError("ছবির শিরোনাম প্রদান করুন", { status: 400 });
    }

    const categoryMap: Record<string, string> = {
      campus: "ক্যাম্পাস",
      labs: "কারিগরি ল্যাব",
      fair: "বিজ্ঞান মেলা",
      cultural: "সাংস্কৃতিক",
      sports: "খেলাধুলা",
    };

    const newItem: GalleryItem = {
      id: Date.now(),
      title: (body.title || body.titleBangla).trim().slice(0, 200),
      titleBangla: (body.titleBangla || body.title).trim().slice(0, 200),
      category: body.category || "campus",
      categoryBangla: categoryMap[body.category] || "ক্যাম্পাস",
      imageUrl: body.imageUrl || "/images/campus-default.jpg",
      date: body.date || new Date().toISOString().slice(0, 10),
      description: (body.description || "").trim().slice(0, 1000),
    };

    institutionalDb.gallery.unshift(newItem);

    return apiSuccess(newItem, {
      message: "ছবি সফলভাবে গ্যালারিতে আপলোড করা হয়েছে।",
      extraKeys: {
        item: newItem,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "ছবি আপলোড করতে ব্যর্থ হয়েছে" });
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req, "gallery:update");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const id = Number(body.id);
    const idx = institutionalDb.gallery.findIndex((g) => g.id === id);
    if (idx === -1) {
      return apiError("গ্যালারি ছবি পাওয়া যায়নি (Gallery item not found)", { status: 404 });
    }

    const categoryMap: Record<string, string> = {
      campus: "ক্যাম্পাস",
      labs: "কারিগরি ল্যাব",
      fair: "বিজ্ঞান মেলা",
      cultural: "সাংস্কৃতিক",
      sports: "খেলাধুলা",
    };

    const updated: GalleryItem = {
      ...institutionalDb.gallery[idx],
      ...body,
      categoryBangla: categoryMap[body.category] || institutionalDb.gallery[idx].categoryBangla,
    };

    institutionalDb.gallery[idx] = updated;

    return apiSuccess(updated, {
      message: "গ্যালারি ছবি সফলভাবে আপডেট করা হয়েছে।",
      extraKeys: {
        item: updated,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "গ্যালারি ছবি আপডেট করতে সমস্যা হয়েছে" });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req, "gallery:delete");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return apiError("আইডি প্রদান করুন", { status: 400 });
    }

    const initialLength = institutionalDb.gallery.length;
    institutionalDb.gallery = institutionalDb.gallery.filter((g) => g.id !== Number(id));

    if (institutionalDb.gallery.length === initialLength) {
      return apiError("ছবি পাওয়া যায়নি", { status: 404 });
    }

    return apiSuccess({ deletedId: Number(id) }, {
      message: "ছবি সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "ছবি মুছে ফেলতে ব্যর্থ হয়েছে" });
  }
}
