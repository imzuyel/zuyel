import { NextRequest, NextResponse } from "next/server";
import {
  getHybridMistakeBank,
  recordHybridMistake,
  resolveHybridMistake,
  hydrateMistakeBankFromMySQL,
  syncMistakeBankWithMySQL,
} from "@/lib/hybridStorageEngine";
import {
  resolveStudentIdentity,
  buildCanonicalStudentKey,
} from "@/lib/studentEntityResolver";
import { sanitizeUserTextInput } from "@/lib/textSanitizer";

export async function GET(req: NextRequest) {
  try {
    await hydrateMistakeBankFromMySQL();

    const { searchParams } = new URL(req.url);
    const studentRoll = searchParams.get("studentRoll") || "";
    const className = searchParams.get("className") || "";
    const trade = searchParams.get("trade") || "";
    const studentId = searchParams.get("studentId") || "";

    let canonicalKey = searchParams.get("studentKey") || "";
    if (!canonicalKey && (studentRoll || studentId)) {
      const resolved = resolveStudentIdentity({
        studentId: studentId || undefined,
        roll: studentRoll || undefined,
        className: className || undefined,
        trade: trade || undefined,
      });
      if (resolved.isResolved && resolved.student) {
        canonicalKey = resolved.student.id;
      } else if (studentRoll) {
        canonicalKey = buildCanonicalStudentKey(className, trade, studentRoll);
      }
    }

    const mistakes = getHybridMistakeBank(
      studentRoll || canonicalKey
        ? {
            studentKey: canonicalKey || undefined,
            studentRoll: studentRoll || undefined,
            className: className || undefined,
          }
        : undefined
    );

    return NextResponse.json({
      success: true,
      count: mistakes.length,
      studentKey: canonicalKey || null,
      mistakes,
    });
  } catch (error: any) {
    console.error("GET /api/learning/mistakes error:", error);
    return NextResponse.json(
      { success: false, error: "ভুল প্রশ্নের তালিকা লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "practice";

    // Mode 1: Practice & verify answer on a Mistake Bank item
    if (action === "practice" && body.mistakeId) {
      const all = getHybridMistakeBank();
      const target = all.find((m) => m.id === String(body.mistakeId));
      if (!target) {
        return NextResponse.json(
          { success: false, error: "প্রশ্নটি পাওয়া যায়নি।" },
          { status: 404 }
        );
      }

      const submitted = sanitizeUserTextInput(String(body.selectedAnswer ?? ""), 500).trim();
      const expected = String(target.correctAnswer ?? "").trim();
      const isCorrect =
        submitted.length > 0 &&
        (submitted.toLowerCase() === expected.toLowerCase() ||
          (target.options &&
            !isNaN(Number(submitted)) &&
            target.options[Number(submitted)]?.trim().toLowerCase() === expected.toLowerCase()));

      let removed = false;
      if (isCorrect && body.resolveOnCorrect !== false) {
        removed = resolveHybridMistake(target.id);
        syncMistakeBankWithMySQL().catch(() => {});
      }

      return NextResponse.json({
        success: true,
        isCorrect,
        removed,
        correctAnswer: target.correctAnswer,
        explanation: target.explanation,
        message: isCorrect
          ? "চমৎকার! উত্তর সঠিক হয়েছে এবং প্রশ্নটি ভুলের তালিকা থেকে মাস্টারি হয়েছে।"
          : "উত্তরটি সঠিক নয়। সঠিক উত্তর ও ১-লাইনের ব্যাখ্যা দেখে নিন।",
      });
    }

    // Mode 2: Record a mistake directly
    const studentRoll = String(body.studentRoll || "").trim();
    if (!studentRoll || !body.questionText) {
      return NextResponse.json(
        { success: false, error: "studentRoll এবং questionText আবশ্যক।" },
        { status: 400 }
      );
    }

    const resolved = resolveStudentIdentity({
      studentId: body.studentId,
      roll: studentRoll,
      className: body.className,
      trade: body.trade,
      name: body.studentName,
    });

    const canonicalKey = resolved.student?.id || buildCanonicalStudentKey(body.className, body.trade, studentRoll);
    const saved = recordHybridMistake({
      studentKey: canonicalKey,
      studentId: resolved.student?.id,
      studentRoll: String(resolved.canonicalRoll || studentRoll),
      studentName: sanitizeUserTextInput(resolved.canonicalName || body.studentName || `শিক্ষার্থী ${studentRoll}`, 120),
      className: resolved.className || body.className || "Class 9",
      trade: resolved.trade || body.trade || "General",
      sourceType: body.sourceType === "LIVE_QUIZ" ? "LIVE_QUIZ" : "CHAPTER_QUIZ",
      sourceId: String(body.sourceId || "practice"),
      sourceTitle: sanitizeUserTextInput(body.sourceTitle || "", 180),
      topic: sanitizeUserTextInput(body.topic || "", 150),
      subject: sanitizeUserTextInput(body.subject || "", 150),
      questionId: String(body.questionId || `q_${Date.now()}`),
      questionText: sanitizeUserTextInput(body.questionText, 600),
      options: Array.isArray(body.options) ? body.options.map((o: any) => sanitizeUserTextInput(String(o), 300)) : [],
      studentAnswer: sanitizeUserTextInput(String(body.studentAnswer || "উত্তর দেওয়া হয়নি"), 300),
      correctAnswer: sanitizeUserTextInput(String(body.correctAnswer || ""), 300),
      explanation: sanitizeUserTextInput(String(body.explanation || ""), 600),
    });

    syncMistakeBankWithMySQL().catch(() => {});

    return NextResponse.json({
      success: true,
      mistake: saved,
    });
  } catch (error: any) {
    console.error("POST /api/learning/mistakes error:", error);
    return NextResponse.json(
      { success: false, error: "ভুলের তালিকা আপডেট করা যায়নি।" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mistakeId = searchParams.get("id");
    if (!mistakeId) {
      return NextResponse.json({ success: false, error: "Mistake ID is required" }, { status: 400 });
    }
    const removed = resolveHybridMistake(mistakeId);
    if (removed) {
      syncMistakeBankWithMySQL().catch(() => {});
    }
    return NextResponse.json({
      success: true,
      removed,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to delete mistake" }, { status: 500 });
  }
}
