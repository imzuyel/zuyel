import { NextResponse } from "next/server";
import { institutionalDb, GalleryItem } from "@/lib/database";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let list = [...institutionalDb.gallery];
    if (category && category !== "all") {
      list = list.filter((item) => item.category === category);
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
      campus: "ক্যাম্পাস",
      labs: "কারিগরি ল্যাব",
      fair: "বিজ্ঞান মেলা",
      cultural: "সাংস্কৃতিক",
      sports: "খেলাধুলা",
    };

    const newItem: GalleryItem = {
      id: Date.now(),
      title: body.title,
      titleBangla: body.titleBangla || body.title,
      category: body.category || "campus",
      categoryBangla: categoryMap[body.category] || "ক্যাম্পাস",
      imageUrl: body.imageUrl,
      date: body.date || new Date().toISOString().slice(0, 10),
      description: body.description || "",
    };

    institutionalDb.gallery.unshift(newItem);

    return NextResponse.json({
      success: true,
      item: newItem,
      message: "ছবি সফলভাবে গ্যালারিতে আপলোড করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const idx = institutionalDb.gallery.findIndex((g) => g.id === Number(body.id));
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Gallery item not found" }, { status: 404 });
    }

    const categoryMap: Record<string, string> = {
      campus: "ক্যাম্পাস",
      labs: "কারিগরি ল্যাব",
      fair: "বিজ্ঞান মেলা",
      cultural: "সাংস্কৃতিক",
      sports: "খেলাধুলা",
    };

    const updated = {
      ...institutionalDb.gallery[idx],
      ...body,
      categoryBangla: categoryMap[body.category] || institutionalDb.gallery[idx].categoryBangla,
    };

    institutionalDb.gallery[idx] = updated;

    return NextResponse.json({
      success: true,
      item: updated,
      message: "গ্যালারি ছবি সফলভাবে আপডেট করা হয়েছে।",
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

    institutionalDb.gallery = institutionalDb.gallery.filter((g) => g.id !== Number(id));

    return NextResponse.json({
      success: true,
      message: "ছবি সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
