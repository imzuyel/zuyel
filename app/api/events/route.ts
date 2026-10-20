import { NextRequest } from "next/server";
import { institutionalDb, EventItem } from "@/lib/database";
import { requireAdmin } from "@/lib/serverAuthGuard";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    let list = [...(institutionalDb.events || [])];
    if (type && type !== "all") {
      list = list.filter((e) => e.type === type);
    }

    return apiSuccess(list, {
      extraKeys: {
        items: list,
        events: list,
        total: list.length,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "ইভেন্ট তালিকা লোড করতে ব্যর্থ হয়েছে" });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req, "events:create");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    if (!body.title) {
      return apiError("ইভেন্টের শিরোনাম আবশ্যক", { status: 400 });
    }

    const newEvent: EventItem = {
      id: Date.now(),
      title: body.title.trim().slice(0, 300),
      startDate: body.startDate || new Date().toISOString().slice(0, 10),
      endDate: body.endDate || body.startDate || new Date().toISOString().slice(0, 10),
      type: body.type || "academic",
      location: body.location || "ক্যাম্পাস অডিটোরিয়াম",
      description: body.description || "",
      published: body.published !== undefined ? Boolean(body.published) : true,
      featured: body.featured !== undefined ? Boolean(body.featured) : false,
    };

    institutionalDb.events.unshift(newEvent);

    return apiSuccess(newEvent, {
      message: "ইভেন্ট সফলভাবে তৈরি করা হয়েছে।",
      extraKeys: {
        event: newEvent,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "ইভেন্ট তৈরি করতে সমস্যা হয়েছে" });
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req, "events:update");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const id = Number(body.id);
    const idx = institutionalDb.events.findIndex((e) => e.id === id);
    if (idx === -1) {
      return apiError("ইভেন্ট পাওয়া যায়নি (Event not found)", { status: 404 });
    }

    const updated: EventItem = {
      ...institutionalDb.events[idx],
      ...body,
    };

    institutionalDb.events[idx] = updated;

    return apiSuccess(updated, {
      message: "ইভেন্ট সফলভাবে আপডেট করা হয়েছে।",
      extraKeys: {
        event: updated,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "ইভেন্ট আপডেট করতে সমস্যা হয়েছে" });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req, "events:delete");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return apiError("ইভেন্ট আইডি আবশ্যক", { status: 400 });
    }

    const initialLength = institutionalDb.events.length;
    institutionalDb.events = institutionalDb.events.filter((e) => e.id !== Number(id));

    if (institutionalDb.events.length === initialLength) {
      return apiError("ইভেন্ট পাওয়া যায়নি", { status: 404 });
    }

    return apiSuccess({ deletedId: Number(id) }, {
      message: "ইভেন্ট সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "ইভেন্ট মুছে ফেলতে ব্যর্থ হয়েছে" });
  }
}
