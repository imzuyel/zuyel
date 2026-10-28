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

    const mappedQuizzes = filteredQuizzes.map((q) => {
      const questions = institutionalDb.quizQuestions
        .filter((qq) => qq.quizId === q.id)
        .sort((a, b) => a.orderIndex - b.orderIndex);
      return {
        ...q,
        questions,
      };
    });

    return NextResponse.json({
      success: true,
      quizzes: mappedQuizzes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
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
      scheduledStartTime,
      scheduledAt,
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

    const CONTENT_INTERACTIVE_TYPES = new Set([
      "TEXT_SLIDE",
      "IMAGE_COMPARE",
      "OPEN_ENDED",
      "WORD_CLOUD",
      "LIVE_QA",
    ]);

    const isGradedType = (t: string) => {
      const norm = (t || "").toUpperCase().replace(/^MCQ_SINGLE$/, "MCQ");
      return !CONTENT_INTERACTIVE_TYPES.has(norm);
    };

    // Cleanly process presentation slides preserving all 10 types and metadata
    const sanitizedSlides = Array.isArray(presentationSlides)
      ? presentationSlides.map((s: any, sIdx: number) => {
          const sType = (s.type || "TEXT_SLIDE").toUpperCase();
          const graded = isGradedType(sType);
          return {
            id: s.id || `slide-${sIdx + 1}`,
            type: sType,
            title: s.title ?? s.prompt ?? "",
            prompt: s.prompt ?? s.title ?? "",
            content: s.content || "",
            options: Array.isArray(s.options) ? s.options : [],
            correctAnswer: s.correctAnswer ?? 0,
            pairs: s.pairs || s.matchingPairs,
            items: s.items || s.reorderSequence,
            acceptedAnswers: s.acceptedAnswers || (s.blankAnswer ? [s.blankAnswer] : undefined),
            imageLeftUrl: s.imageLeftUrl || s.leftImage,
            imageRightUrl: s.imageRightUrl || s.rightImage,
            bulletPoints: s.bulletPoints,
            maxWordsPerStudent: s.maxWordsPerStudent,
            timeLimit: graded ? (Number(s.timeLimit) || Number(defaultQuestionTime) || 30) : 0,
            points: graded ? (Number(s.points) || Number(defaultMarks) || 100) : 0,
            explanation: s.explanation || "",
            metadata: {
              ...(s.metadata || {}),
              imageLeftUrl: s.imageLeftUrl || s.leftImage,
              imageRightUrl: s.imageRightUrl || s.rightImage,
              bulletPoints: s.bulletPoints,
              maxWordsPerStudent: s.maxWordsPerStudent,
            },
            orderIndex: sIdx + 1,
          };
        })
      : [];

    const quizId = body.id || uuidv4();
    const existingIndex = institutionalDb.quizzes.findIndex((q) => q.id === quizId);

    const quizPayload: Quiz = {
      id: quizId,
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
      presentationSlides: sanitizedSlides,
      scheduledStartTime: scheduledStartTime || scheduledAt || undefined,
      scheduledAt: scheduledAt || scheduledStartTime || undefined,
      createdAt: existingIndex !== -1 ? institutionalDb.quizzes[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      institutionalDb.quizzes[existingIndex] = quizPayload;
      // Purge old questions for update
      institutionalDb.quizQuestions = institutionalDb.quizQuestions.filter((qq) => qq.quizId !== quizId);
    } else {
      institutionalDb.quizzes.unshift(quizPayload);
    }

    // Save inline questions if provided
    const createdQuestions: QuizQuestion[] = [];
    if (Array.isArray(questions) && questions.length > 0) {
      questions.forEach((q: any, idx: number) => {
        const rawType = q.questionType || q.type || "MCQ";
        const qType = rawType.toUpperCase().replace(/^MCQ_SINGLE$/, "MCQ");
        const graded = isGradedType(qType);

        const questionText = q.questionText || q.question || q.title || `স্লাইড ${idx + 1}`;
        const optionsList = Array.isArray(q.options)
          ? q.options
          : q.questionData?.options || (graded ? ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"] : []);
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
          : q.matchingPairs || q.questionData?.pairs;
        const items = Array.isArray(q.items)
          ? q.items
          : q.reorderSequence || q.questionData?.items;
        const acceptedAnswers = Array.isArray(q.acceptedAnswers)
          ? q.acceptedAnswers
          : q.blankAnswer
          ? [q.blankAnswer]
          : q.questionData?.acceptedAnswers;
        const expectedAnswerKeyword = q.expectedAnswerKeyword || q.questionData?.expectedAnswerKeyword;
        const caseSensitive = q.caseSensitive ?? q.questionData?.caseSensitive;
        const explanation = q.explanation || q.questionData?.explanation || "";
        const imageLeftUrl = q.imageLeftUrl || q.leftImage || q.questionData?.imageLeftUrl || q.questionData?.leftImage;
        const imageRightUrl = q.imageRightUrl || q.rightImage || q.questionData?.imageRightUrl || q.questionData?.rightImage;
        const bulletPoints = Array.isArray(q.bulletPoints) ? q.bulletPoints : q.questionData?.bulletPoints;
        const maxWordsPerStudent = Number(q.maxWordsPerStudent) || q.questionData?.maxWordsPerStudent;

        // Strict Timer & Marks Enforcement: Content/Interactive MUST be 0
        const marks = graded ? (Number(q.marks) || Number(q.points) || Number(defaultMarks) || 100) : 0;
        const timeLimit = graded ? (Number(q.timeLimit) || Number(defaultQuestionTime) || 30) : 0;

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
          imageLeftUrl,
          imageRightUrl,
          bulletPoints,
          maxWordsPerStudent,
          metadata: {
            imageLeftUrl,
            imageRightUrl,
            bulletPoints,
            maxWordsPerStudent,
            ...(q.metadata || {}),
          },
          ...(q.questionData || {}),
        };

        const newQQ: QuizQuestion = {
          id: q.id && String(q.id).startsWith("qq-") ? String(q.id) : `qq-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          quizId: quizPayload.id,
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
            imageLeftUrl,
            imageRightUrl,
            bulletPoints,
            maxWordsPerStudent,
            questionData: fullQuestionData,
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
      quiz: quizPayload,
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
