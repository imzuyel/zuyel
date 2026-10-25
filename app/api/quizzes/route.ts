import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, Quiz, QuizQuestion } from "@/lib/database";
import { validateSubjectEligibility, getTeacherSubjectAssignments } from "@/lib/subjectEngine";
import { v4 as uuidv4 } from "uuid";
import { extractRequestIdentity, verifyBackendAuthorization } from "@/lib/serverAuthGuard";
import { isAuthorizedStaff } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get("academicYearId");
    const classId = searchParams.get("classId");
    const tradeId = searchParams.get("tradeId");
    const subjectId = searchParams.get("subjectId");
    const mode = searchParams.get("mode");
    const status = searchParams.get("status");
    const creatorId = searchParams.get("creatorId");

    const identity = extractRequestIdentity(req);
    const isStaff = identity.isAuthenticated && isAuthorizedStaff(identity.userRole);

    let filteredQuizzes = [...institutionalDb.quizzes];

    // Non-staff callers can ONLY see published quizzes
    if (!isStaff) {
      filteredQuizzes = filteredQuizzes.filter(q => q.status === "published");
    } else if (status) {
      filteredQuizzes = filteredQuizzes.filter(q => q.status === status);
    }

    if (academicYearId) {
      filteredQuizzes = filteredQuizzes.filter(q => q.academicYearId === Number(academicYearId));
    }
    if (classId) {
      filteredQuizzes = filteredQuizzes.filter(q => q.classId === Number(classId));
    }
    if (tradeId) {
      filteredQuizzes = filteredQuizzes.filter(q => q.tradeId === Number(tradeId));
    }
    if (subjectId) {
      filteredQuizzes = filteredQuizzes.filter(q => q.subjectId === Number(subjectId));
    }
    if (mode) {
      filteredQuizzes = filteredQuizzes.filter(q => q.mode === mode);
    }
    if (status) {
      filteredQuizzes = filteredQuizzes.filter(q => q.status === status);
    }
    if (creatorId) {
      filteredQuizzes = filteredQuizzes.filter(q => q.creatorId === Number(creatorId));
    }

    return NextResponse.json({
      success: true,
      quizzes: filteredQuizzes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // SECURITY RBAC ENFORCEMENT: Zero-Trust for Students & Conditional Access for Teachers
  const auth = verifyBackendAuthorization(req, {
    requiredPermission: "manage_quizzes",
    endpointName: "/api/quizzes",
  });
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { 
      title, description, thumbnail, mode, 
      subjectId, classId, sectionId, tradeId, academicYearId, 
      chapterId, topicId, creatorId = 1, category,
      defaultMarks, negativeMarking, randomizeQuestions, randomizeOptions,
      defaultQuestionTime, totalDuration, showScore, showCorrectAnswer,
      showExplanation, showLeaderboard,
      questions = [],
      presentationSlides = [],
      publish = false,
    } = body;

    if (!title || !mode) {
      return NextResponse.json(
        { success: false, message: "Title and Mode are required" },
        { status: 400 }
      );
    }

    const effectiveCreatorId = Number(auth.identity.userId) || 1;

    // Server-side context validation for Academic quizzes
    if (mode === "academic") {
      if (!academicYearId || !classId || !subjectId) {
        return NextResponse.json(
          { success: false, message: "Academic Year, Class, and Subject are required for academic quizzes" },
          { status: 400 }
        );
      }

      // 1. Basic Academic Rule Validation
      const valResult = validateSubjectEligibility({
        academicYear: String(academicYearId),
        classId: Number(classId),
        tradeId: tradeId ? Number(tradeId) : undefined,
        subjectId: Number(subjectId),
        teacherId: effectiveCreatorId
      });

      if (!valResult.valid) {
        return NextResponse.json(
          { success: false, message: "Invalid academic context", errors: valResult.errors },
          { status: 400 }
        );
      }
    }

    const newQuiz: Quiz = {
      id: uuidv4(),
      title,
      description: description || "",
      thumbnail: thumbnail || "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=500&auto=format&fit=crop&q=60",
      mode: mode as "academic" | "general",
      subjectId: subjectId ? Number(subjectId) : undefined,
      classId: classId ? Number(classId) : undefined,
      sectionId: sectionId ? Number(sectionId) : undefined,
      tradeId: tradeId ? Number(tradeId) : undefined,
      academicYearId: academicYearId ? Number(academicYearId) : undefined,
      chapterId,
      topicId,
      creatorId: effectiveCreatorId,
      category: category || "Practice",
      status: publish ? "published" : "draft",
      defaultMarks: Number(defaultMarks) || 2,
      negativeMarking: !!negativeMarking,
      randomizeQuestions: !!randomizeQuestions,
      randomizeOptions: !!randomizeOptions,
      defaultQuestionTime: Number(defaultQuestionTime) || 30,
      totalDuration: Number(totalDuration) || (questions.length * 0.5),
      showScore: showScore !== false,
      showCorrectAnswer: showCorrectAnswer !== false,
      showExplanation: showExplanation !== false,
      showLeaderboard: showLeaderboard !== false,
      presentationSlides: Array.isArray(presentationSlides) ? presentationSlides : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    institutionalDb.quizzes.unshift(newQuiz);

    // Save inline questions if provided
    const createdQuestions: QuizQuestion[] = [];
    if (Array.isArray(questions) && questions.length > 0) {
      questions.forEach((q: any, idx: number) => {
        const qType = q.questionType || q.type || "mcq_single";
        const questionText = q.questionText || q.question || `প্রশ্ন ${idx + 1}`;
        const optionsList = Array.isArray(q.options)
          ? q.options
          : q.questionData?.options || ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"];
        const correctIndex = typeof q.correctAnswer === "number"
          ? q.correctAnswer
          : typeof q.correctIndex === "number"
          ? q.correctIndex
          : q.questionData?.correctIndex ?? 0;
        const correctAnswer = typeof q.correctAnswer === "boolean"
          ? q.correctAnswer
          : q.questionData?.correctAnswer;
        const correctIndices = Array.isArray(q.correctIndices)
          ? q.correctIndices
          : q.questionData?.correctIndices;
        const pairs = Array.isArray(q.pairs)
          ? q.pairs
          : q.questionData?.pairs;
        const items = Array.isArray(q.items)
          ? q.items
          : q.questionData?.items;
        const acceptedAnswers = Array.isArray(q.acceptedAnswers)
          ? q.acceptedAnswers
          : q.questionData?.acceptedAnswers;
        const expectedAnswerKeyword = q.expectedAnswerKeyword || q.questionData?.expectedAnswerKeyword;
        const caseSensitive = q.caseSensitive ?? q.questionData?.caseSensitive;
        const explanation = q.explanation || q.questionData?.explanation || "";
        const marks = Number(q.marks) || Number(defaultMarks) || 2;
        const timeLimit = Number(q.timeLimit) || Number(defaultQuestionTime) || 30;

        const fullQuestionData = {
          options: optionsList,
          correctIndex,
          correctAnswer,
          correctIndices,
          pairs,
          items,
          acceptedAnswers,
          expectedAnswerKeyword,
          caseSensitive,
          explanation,
          marks,
          timeLimit,
          ...(q.questionData || {})
        };

        const newQQ: QuizQuestion = {
          id: q.id && String(q.id).startsWith("qq-") ? String(q.id) : `qq-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          quizId: newQuiz.id,
          questionBankId: q.questionBankId || "",
          questionType: qType,
          questionSnapshot: {
            questionText,
            type: qType,
            options: optionsList,
            correctIndex,
            correctAnswer,
            correctIndices,
            pairs,
            items,
            acceptedAnswers,
            expectedAnswerKeyword,
            caseSensitive,
            explanation,
            questionData: fullQuestionData
          },
          orderIndex: idx,
          marks,
          timeLimit,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        institutionalDb.quizQuestions.push(newQQ);
        createdQuestions.push(newQQ);
      });
    }

    return NextResponse.json({
      success: true,
      quiz: newQuiz,
      questions: createdQuestions,
      message: publish ? "কুইজ সফলভাবে সংরক্ষণ ও প্রকাশ করা হয়েছে" : "কুইজ সফলভাবে তৈরি হয়েছে",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create quiz" },
      { status: 500 }
    );
  }
}
