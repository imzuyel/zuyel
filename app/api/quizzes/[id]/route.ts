import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { ACADEMIC_CLASSES, ALL_TRADES } from "@/lib/academicStructure";
import { extractRequestIdentity, requireTeacherOrAdmin } from "@/lib/serverAuthGuard";
import { isAuthorizedStaff } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quiz = institutionalDb.quizzes.find((q) => q.id === id);

    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }

    const identity = extractRequestIdentity(req);
    const isStaff = identity.isAuthenticated && isAuthorizedStaff(identity.userRole);

    // If caller is not staff, block access to draft or un-published quizzes
    if (!isStaff && quiz.status !== "published") {
      return NextResponse.json(
        {
          success: false,
          status: 403,
          error: "Forbidden",
          code: "QUIZ_NOT_PUBLISHED",
          message: "এই কুইজটি এখনও শিক্ষার্থীদের জন্য উন্মুক্ত করা হয়নি।",
        },
        { status: 403 }
      );
    }

    const questions = institutionalDb.quizQuestions
      .filter((qq) => qq.quizId === id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    // Answer Key Protection: Strip correct answers for students and unauthenticated callers
    const safeQuestions = questions.map((qq) => {
      if (isStaff) return qq;
      const snap = qq.questionSnapshot || {};
      const sanitizedSnap = {
        ...snap,
        correctIndex: undefined,
        correctAnswer: undefined,
        correctIndices: undefined,
        acceptedAnswers: undefined,
        expectedAnswerKeyword: undefined,
        explanation: undefined,
        questionData: snap.questionData
          ? {
              ...snap.questionData,
              correctIndex: undefined,
              correctAnswer: undefined,
              correctIndices: undefined,
              acceptedAnswers: undefined,
              expectedAnswerKeyword: undefined,
              explanation: undefined,
            }
          : undefined,
      };
      return {
        ...qq,
        questionSnapshot: sanitizedSnap,
      };
    });

    return NextResponse.json({
      success: true,
      quiz,
      questions: safeQuestions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireTeacherOrAdmin(req, `/api/quizzes/${id} (PUT)`);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const index = institutionalDb.quizzes.findIndex((q) => q.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const existing = institutionalDb.quizzes[index];
    const effectiveClassId = body.classId !== undefined ? Number(body.classId) : existing.classId;
    const effectiveClassName =
      body.className ||
      (effectiveClassId
        ? ACADEMIC_CLASSES.find((c) => String(c.id) === String(effectiveClassId) || c.numericValue === Number(effectiveClassId))?.nameBangla
        : existing.className);
    const effectiveTradeId = body.tradeId !== undefined ? Number(body.tradeId) : existing.tradeId;
    const effectiveTradeName =
      body.tradeName ||
      body.trade ||
      (effectiveTradeId ? ALL_TRADES.find((t) => String(t.id) === String(effectiveTradeId))?.nameBangla : existing.tradeName);
    const effectiveSubjectId = body.subjectId !== undefined ? Number(body.subjectId) : existing.subjectId;
    const effectiveSubjectName = body.subjectName || body.subject || existing.subjectName;
    const effectiveSubjectCode = body.subjectCode || existing.subjectCode;

    const updatedQuiz = {
      ...existing,
      ...body,
      classId: effectiveClassId,
      className: effectiveClassName,
      tradeId: effectiveTradeId,
      tradeName: effectiveTradeName,
      subjectId: effectiveSubjectId,
      subjectName: effectiveSubjectName,
      subjectCode: effectiveSubjectCode,
      updatedAt: new Date().toISOString(),
    };

    institutionalDb.quizzes[index] = updatedQuiz;

    return NextResponse.json({
      success: true,
      quiz: updatedQuiz,
      message: "Quiz updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update quiz" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireTeacherOrAdmin(req, `/api/quizzes/${id} (DELETE)`);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const index = institutionalDb.quizzes.findIndex((q) => q.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }

    institutionalDb.quizzes.splice(index, 1);
    institutionalDb.quizQuestions = institutionalDb.quizQuestions.filter(
      (qq) => qq.quizId !== id
    );

    return NextResponse.json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
