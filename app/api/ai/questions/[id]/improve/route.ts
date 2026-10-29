import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { AIService } from "@/lib/aiService";
import { generateJsonWithFailover } from "@/lib/aiFailoverPipeline";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { instruction, action, targetType, slide } = body;

    const rawInstruction = (instruction || "").trim();
    if (!rawInstruction && !action && !targetType) {
      return NextResponse.json(
        { success: false, message: "Refinement instruction or action is required" },
        { status: 400 }
      );
    }

    // 1. DIRECT PRESENTATION SLIDE IMPROVEMENT (Task 3 On-Canvas AI & Task 1 Tab 4)
    if (slide) {
      let promptDirective = rawInstruction;
      if (action === "beautify") {
        promptDirective = "লেখাটি আরও আকর্ষণীয়, প্রাঞ্জল ও মানসম্মত ভাষায় উন্নত করো। বানান ও ব্যাকরণ নির্ভুল করো এবং বিকল্পগুলো বাস্তবসম্মত করো।";
      } else if (action === "harder") {
        promptDirective = "প্রশ্নটিকে আরেকটু গভীর চিন্তাশীল, কারিগরিভাবে নির্ভুল এবং চ্যালেঞ্জিং করো যাতে মুখস্থ না করে মেধা খাটিয়ে উত্তর দিতে হয়।";
      } else if (action === "convert") {
        promptDirective = `এই প্রশ্নটিকে '${targetType || "MATCHING"}' ধরনে রূপান্তর করো। মূল তথ্য ও বিষয় অপরিবর্তিত রেখে নতুন ফরম্যাটের উপযোগী কাঠামো তৈরি করো।`;
      } else if (action === "explain") {
        promptDirective = "এই প্রশ্নের সঠিক উত্তরের জন্য স্পষ্ট, সহজবোধ্য এবং তথ্যবহুল একটি বাংলা ব্যাখ্যা তৈরি করো।";
      }

      const prompt = `You are an expert curriculum and educational assessment AI for technical and general secondary/higher schools in Bangladesh (BTEB curriculum).
A teacher wants to improve, modify, or convert a presentation slide in real-time.

CURRENT SLIDE DATA:
${JSON.stringify(slide, null, 2)}

TEACHER'S INSTRUCTION / DIRECTIVE:
"${promptDirective}"
${targetType ? `TARGET FORMAT / TYPE: "${targetType}"` : ""}

Respond ONLY with a valid JSON object representing the improved slide adhering to this schema:
{
  "id": "${slide.id || id}",
  "type": "${targetType || slide.type || "MCQ"}",
  "title": "Improved question or slide title in Bangla",
  "content": "Updated content string if TEXT_SLIDE",
  "options": ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"],
  "correctAnswer": 0, // integer index for MCQ, boolean for TRUE_FALSE
  "pairs": [{ "left": "বাম পাশ", "right": "ডান পাশ" }], // if MATCHING
  "items": ["ধাপ ১", "ধাপ ২", "ধাপ ৩"], // if REORDER
  "acceptedAnswers": ["সঠিক উত্তর"], // if FILL_BLANKS
  "explanation": "Clear, informative explanation in Bangla",
  "points": ${slide.points || 100},
  "timeLimit": ${slide.timeLimit || 30}
}`;

      const { data: improvedSlide } = await generateJsonWithFailover<any>({
        prompt,
        temperature: 0.2,
      });

      if (improvedSlide && improvedSlide.title) {
        return NextResponse.json({
          success: true,
          slide: {
            ...slide,
            ...improvedSlide,
            id: slide.id || id,
            type: targetType || improvedSlide.type || slide.type,
          },
          message: "স্লাইডটি AI দ্বারা সফলভাবে আপডেট করা হয়েছে",
        });
      }
    }

    // 2. FALLBACK: Database AI Generated Question Refinement
    const q = institutionalDb.aiGeneratedQuestions.find((item) => item.id === id);

    if (!q) {
      // If not in database and no slide provided, synthesize from instruction
      return NextResponse.json(
        { success: false, message: "Question or slide not found" },
        { status: 404 }
      );
    }

    const improved = await AIService.improveQuestion(
      {
        type: q.type,
        questionText: q.questionText,
        explanation: q.explanation,
        difficulty: q.difficulty,
        tags: q.tags,
        questionData: q.questionData,
      },
      rawInstruction || "Make it clearer and more engaging."
    );

    q.questionText = improved.questionText;
    q.explanation = improved.explanation;
    q.difficulty = improved.difficulty as "easy" | "medium" | "hard";
    q.tags = improved.tags;
    q.questionData = improved.questionData;
    q.status = "reviewed";
    q.updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      question: q,
      message: "Question improved and refined successfully by AI",
    });
  } catch (error: any) {
    console.error("AI Improvement Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to improve slide/question" },
      { status: 500 }
    );
  }
}
