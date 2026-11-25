import { NextRequest, NextResponse } from "next/server";
import { generateJsonWithFailover } from "@/lib/aiFailoverPipeline";
import { verifyBackendAuthorization } from "@/lib/serverAuthGuard";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const QUICK_QUIZ_FILE = path.join(DATA_DIR, "quick-quiz.json");

export interface QuickQuiz {
  id: string;
  title: string;
  classId: number;
  subjectName: string;
  questions: {
    questionText: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }[];
  createdAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __pgtscQuickQuizCache: QuickQuiz | null | undefined;
  // eslint-disable-next-line no-var
  var __pgtscQuickQuizWriteTimer: ReturnType<typeof setTimeout> | undefined;
}

// Load active quick quiz from in-memory cache (cold-start disk read only)
function loadActiveQuickQuiz(): QuickQuiz | null {
  if (globalThis.__pgtscQuickQuizCache !== undefined) {
    return globalThis.__pgtscQuickQuizCache;
  }
  if (fs.existsSync(QUICK_QUIZ_FILE)) {
    try {
      const data = fs.readFileSync(QUICK_QUIZ_FILE, "utf-8");
      globalThis.__pgtscQuickQuizCache = JSON.parse(data);
      return globalThis.__pgtscQuickQuizCache ?? null;
    } catch (e) {
      console.error("Error reading quick quiz file:", e);
    }
  }
  globalThis.__pgtscQuickQuizCache = null;
  return null;
}

// Save active quick quiz in memory + debounced async disk snapshot
function saveActiveQuickQuiz(quiz: QuickQuiz | null) {
  globalThis.__pgtscQuickQuizCache = quiz;
  if (globalThis.__pgtscQuickQuizWriteTimer) {
    clearTimeout(globalThis.__pgtscQuickQuizWriteTimer);
  }
  globalThis.__pgtscQuickQuizWriteTimer = setTimeout(async () => {
    try {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      if (quiz === null) {
        await fs.promises.unlink(QUICK_QUIZ_FILE).catch(() => { });
      } else {
        await fs.promises.writeFile(QUICK_QUIZ_FILE, JSON.stringify(quiz, null, 2), "utf-8");
      }
    } catch (e) {
      console.error("Error writing quick quiz file:", e);
    }
  }, 1500);
  return true;
}

// GET active quick quiz
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    const quiz = loadActiveQuickQuiz();
    if (!quiz) {
      return NextResponse.json({ success: true, active: false, quiz: null });
    }

    // Filter by classId if provided
    if (classId && quiz.classId !== Number(classId)) {
      return NextResponse.json({ success: true, active: false, quiz: null });
    }

    return NextResponse.json({ success: true, active: true, quiz });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST to either generate or publish a quick quiz
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Generate questions using AI
    if (action === "generate") {
      const { classId, subjectName, topic } = body;

      if (!subjectName || !topic) {
        return NextResponse.json(
          { success: false, message: "Subject and Topic are required for generation" },
          { status: 400 }
        );
      }

      const prompt = `Create a high-quality academic multiple choice quiz with exactly 5 questions for BTEB (Bangladesh Technical Education Board) vocational students.
Class: Class ${classId}
Subject: ${subjectName}
Topic: ${topic}

Requirements:
1. Provide exactly 5 questions.
2. Write all question texts, options (4 options per question), and explanations in fluent and encouraging BTEB vocational-style Bengali.
3. Keep questions appropriate for Class ${classId} level.
4. Return ONLY a valid JSON object matching the requested schema. No markdown formatting outside the JSON block.

JSON Schema:
{
  "questions": [
    {
      "questionText": "Question text in Bengali here...",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctIndex": 0,
      "explanation": "Brief encouraging explanation in Bengali here..."
    }
  ]
}`;

      const { data } = await generateJsonWithFailover<{ questions: any[] }>({
        prompt,
        systemPrompt: "You are a professional BTEB vocational teacher and quiz master specializing in Bengali-medium technical curriculum.",
        temperature: 0.6,
        model: "gemini-3.8-flash",
      });

      if (!data || !Array.isArray(data.questions)) {
        return NextResponse.json(
          { success: false, message: "AI failed to generate clean structured questions" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        questions: data.questions.slice(0, 5),
      });
    }

    // 2. Publish or Clear a Quick Quiz
    // Ensure the caller is authorized as a teacher/admin
    const auth = verifyBackendAuthorization(req, {
      requiredPermission: "manage_quizzes",
      endpointName: "/api/quick-quiz",
    });

    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    if (action === "clear") {
      saveActiveQuickQuiz(null);
      return NextResponse.json({ success: true, message: "সক্রিয় কুইক কুইজটি মুছে ফেলা হয়েছে।" });
    }

    if (action === "publish") {
      const { title, classId, subjectName, questions } = body;

      if (!title || !classId || !subjectName || !Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json(
          { success: false, message: "Title, Class, Subject, and Questions are required" },
          { status: 400 }
        );
      }

      const newQuickQuiz: QuickQuiz = {
        id: `quick-quiz-${Date.now()}`,
        title,
        classId: Number(classId),
        subjectName,
        questions: questions.slice(0, 5).map((q: any) => ({
          questionText: q.questionText,
          options: q.options || [],
          correctIndex: Number(q.correctIndex) ?? 0,
          explanation: q.explanation || "",
        })),
        createdAt: new Date().toISOString(),
      };

      saveActiveQuickQuiz(newQuickQuiz);

      return NextResponse.json({
        success: true,
        quiz: newQuickQuiz,
        message: `ক্লাস ${classId} এর জন্য "${title}" নামক কুইক কুইজটি সফলভাবে প্রকাশ করা হয়েছে!`,
      });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
