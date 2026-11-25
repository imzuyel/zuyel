import { NextRequest, NextResponse } from "next/server";
import {
  getHybridDoubts,
  saveHybridDoubt,
  answerHybridDoubt,
  addHybridDoubtReply,
  deleteHybridDoubt,
  hydrateDoubtsFromMySQL,
  syncDoubtsWithMySQL,
} from "@/lib/hybridStorageEngine";
import { resolveStudentIdentity } from "@/lib/studentEntityResolver";
import { sanitizeUserTextInput } from "@/lib/textSanitizer";

export async function GET(req: NextRequest) {
  try {
    await hydrateDoubtsFromMySQL();
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("lessonId") || undefined;
    const chapterId = searchParams.get("chapterId") || undefined;
    const tradeClass = searchParams.get("tradeClass") || undefined;
    const status = (searchParams.get("status") as "pending" | "answered" | "all" | null) || undefined;

    const doubts = getHybridDoubts({
      lessonId,
      chapterId,
      tradeClass,
      status,
    });

    return NextResponse.json({
      success: true,
      count: doubts.length,
      doubts,
    });
  } catch (error: any) {
    console.error("GET /api/learning/doubts error:", error);
    return NextResponse.json(
      { success: false, error: "শিক্ষার্থীদের ডাউট লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support adding reply to an existing doubt
    if (body.action === "reply" && body.doubtId && body.text) {
      const updated = addHybridDoubtReply(String(body.doubtId), {
        sender: body.sender === "teacher" ? "teacher" : "student",
        senderName: sanitizeUserTextInput(body.senderName || "PTSC ব্যবহারকারী", 100),
        text: sanitizeUserTextInput(body.text, 1200),
      });
      if (!updated) {
        return NextResponse.json({ success: false, error: "ডাউটটি পাওয়া যায়নি।" }, { status: 404 });
      }
      syncDoubtsWithMySQL().catch(() => {});
      return NextResponse.json({ success: true, doubt: updated });
    }

    const question = sanitizeUserTextInput(body.question || "", 1500).trim();
    if (!question) {
      return NextResponse.json(
        { success: false, error: "প্রশ্ন বা ডাউট লেখা আবশ্যক।" },
        { status: 400 }
      );
    }

    const rawRoll = String(body.studentRoll || "").trim();
    const rawName = sanitizeUserTextInput(body.studentName || "PTSC শিক্ষার্থী", 120);
    const rawClass = sanitizeUserTextInput(body.className || "", 80);
    const rawTradeClass = sanitizeUserTextInput(body.tradeClass || "কারিগরি শাখা", 150);

    // Resolve against canonical student directory so doubts map accurately
    const resolved = resolveStudentIdentity({
      studentId: body.studentId,
      roll: rawRoll || undefined,
      className: rawClass || rawTradeClass,
      trade: body.trade || rawTradeClass,
      name: rawName,
    });

    const created = saveHybridDoubt({
      lessonId: String(body.lessonId || body.chapterId || "general-lesson"),
      lessonTitle: sanitizeUserTextInput(body.lessonTitle || "অধ্যায়ভিত্তিক পাঠ", 200),
      chapterId: body.chapterId ? String(body.chapterId) : undefined,
      courseId: body.courseId ? String(body.courseId) : undefined,
      studentId: resolved.student?.id || undefined,
      studentName: resolved.canonicalName || rawName,
      studentRoll: String(resolved.canonicalRoll || rawRoll || "—"),
      className: resolved.className || rawClass || undefined,
      tradeClass:
        resolved.className && resolved.trade
          ? `${resolved.className} (${resolved.trade})`
          : rawTradeClass,
      question,
      contextType: body.contextType === "quiz_question" ? "quiz_question" : body.contextType === "chapter" ? "chapter" : "lesson",
      contextTitle: sanitizeUserTextInput(body.contextTitle || body.lessonTitle || "", 200),
      questionNumber: body.questionNumber ? String(body.questionNumber) : undefined,
    });

    syncDoubtsWithMySQL().catch(() => {});

    return NextResponse.json({
      success: true,
      message: "প্রশ্নটি সফলভাবে শিক্ষকের ইনবক্সে সংরক্ষিত হয়েছে!",
      doubt: created,
    });
  } catch (error: any) {
    console.error("POST /api/learning/doubts error:", error);
    return NextResponse.json(
      { success: false, error: "ডাউট জমা দেওয়া যায়নি।" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const doubtId = String(body.doubtId || body.id || "").trim();
    const answer = sanitizeUserTextInput(body.answer || body.text || "", 2000).trim();
    const teacherName = sanitizeUserTextInput(body.teacherName || "বিষয় শিক্ষক (PTSC)", 120);

    if (!doubtId || !answer) {
      return NextResponse.json(
        { success: false, error: "doubtId এবং উত্তর লেখা আবশ্যক।" },
        { status: 400 }
      );
    }

    const updated = answerHybridDoubt(doubtId, answer, teacherName);
    if (!updated) {
      return NextResponse.json({ success: false, error: "ডাউটটি পাওয়া যায়নি।" }, { status: 404 });
    }

    syncDoubtsWithMySQL().catch(() => {});

    return NextResponse.json({
      success: true,
      message: "উত্তর সফলভাবে সংরক্ষিত হয়েছে!",
      doubt: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/learning/doubts error:", error);
    return NextResponse.json(
      { success: false, error: "উত্তর সংরক্ষণ করা যায়নি।" },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Doubt id required" }, { status: 400 });
    }
    const deleted = deleteHybridDoubt(id);
    if (deleted) {
      syncDoubtsWithMySQL().catch(() => {});
    }
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to delete" }, { status: 500 });
  }
}
