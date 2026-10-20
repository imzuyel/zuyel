import { NextResponse } from "next/server";
import { institutionalDb, EventItem } from "@/lib/database";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    let list = [...institutionalDb.events];
    if (type && type !== "all") {
      list = list.filter((e) => e.type === type);
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

    const newEvent: EventItem = {
      id: Date.now(),
      title: body.title,
      startDate: body.startDate || new Date().toISOString().slice(0, 10),
      endDate: body.endDate || body.startDate || new Date().toISOString().slice(0, 10),
      type: body.type || "academic",
      location: body.location || "Campus Hall",
      description: body.description || "",
      published: body.published !== undefined ? Boolean(body.published) : true,
      featured: body.featured !== undefined ? Boolean(body.featured) : false,
    };

    institutionalDb.events.unshift(newEvent);

    return NextResponse.json({
      success: true,
      event: newEvent,
      message: "ইভেন্ট সফলভাবে তৈরি করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const idx = institutionalDb.events.findIndex((e) => e.id === Number(body.id));
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    const updated = {
      ...institutionalDb.events[idx],
      ...body,
    };

    institutionalDb.events[idx] = updated;

    return NextResponse.json({
      success: true,
      event: updated,
      message: "ইভেন্ট সফলভাবে আপডেট করা হয়েছে।",
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

    institutionalDb.events = institutionalDb.events.filter((e) => e.id !== Number(id));

    return NextResponse.json({
      success: true,
      message: "ইভেন্ট সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
