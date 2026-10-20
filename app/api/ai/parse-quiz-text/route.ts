import { NextRequest, NextResponse } from "next/server";
import { generateJsonWithFailover } from "@/lib/aiFailoverPipeline";

export interface ParsedImportedQuestion {
  id: string;
  type: "mcq_single" | "mcq_multiple" | "fill_blank" | "matching" | "true_false";
  questionText: string;
  options?: string[];
  correctAnswer?: number | boolean; // index for MCQ single, or boolean for True/False
  correctIndices?: number[]; // for MCQ multiple
  acceptedAnswers?: string[]; // for fill in blank
  pairs?: { left: string; right: string }[]; // for matching
  explanation: string;
  conceptTopic: string;
  marks: number;
  timeLimit: number;
}

// Robust Algorithmic Parser as instant fail-safe or offline parser
function parseRawQuizTextAlgorithmically(rawText: string): ParsedImportedQuestion[] {
  if (!rawText || !rawText.trim()) return [];

  const questions: ParsedImportedQuestion[] = [];
  const text = rawText.replace(/\r\n/g, "\n");

  // Split into question blocks using common delimiters (e.g. 1., 2., Q1, প্রশ্ন ১)
  const questionBlocks = text.split(/\n(?=(?:[0-9]{1,3}[.)]|[Qq]uestion\s*[0-9]{1,3}[:.]|প্রশ্ন\s*[০-৯0-9]{1,3}[:.]|#+\s*[0-9]{1,3}[.)]))/);

  let qIndex = 1;
  for (const block of questionBlocks) {
    const cleanBlock = block.trim();
    if (!cleanBlock) continue;

    const lines = cleanBlock.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // Detect question type
    const isMatching =
      cleanBlock.toLowerCase().includes("match") ||
      cleanBlock.includes("মিলকরণ") ||
      cleanBlock.includes("->") ||
      cleanBlock.includes("col a") ||
      cleanBlock.includes("column");

    const isFillBlank =
      (cleanBlock.includes("___") || cleanBlock.includes(".....") || cleanBlock.includes("শূন্যস্থান")) &&
      !isMatching;

    const isTrueFalse =
      (cleanBlock.toLowerCase().includes("true/false") ||
        cleanBlock.toLowerCase().includes("true or false") ||
        cleanBlock.includes("সত্য/মিথ্যা") ||
        cleanBlock.includes("সত্য নাকি মিথ্যা")) &&
      !isMatching;

    let questionText = lines[0].replace(/^(?:[0-9]{1,3}[.)]|[Qq]uestion\s*[0-9]{1,3}[:.]|প্রশ্ন\s*[০-৯0-9]{1,3}[:.]|#+\s*[0-9]{1,3}[.)])\s*/, "").trim();
    if (!questionText) questionText = lines[0];

    // Extract explanation
    let explanation = "";
    const explanationLine = lines.find((l) =>
      /^(?:Explanation|ব্যাখ্যা|Note|মন্তব্য)[\s*:]+/i.test(l)
    );
    if (explanationLine) {
      explanation = explanationLine.replace(/^(?:Explanation|ব্যাখ্যা|Note|মন্তব্য)[\s*:]+/i, "").trim();
    }

    // Extract concept topic
    let conceptTopic = "সাধারণ কারিগরি জ্ঞান";
    const topicLine = lines.find((l) =>
      /^(?:Topic|টপিক|বিষয়|Concept)[\s*:]+/i.test(l)
    );
    if (topicLine) {
      conceptTopic = topicLine.replace(/^(?:Topic|টপিক|বিষয়|Concept)[\s*:]+/i, "").trim();
    }

    if (isMatching) {
      // Process Matching pairs
      const pairs: { left: string; right: string }[] = [];
      for (const line of lines) {
        if (line.includes("->") || line.includes(" - ") || line.includes(" : ") || line.includes("—")) {
          const parts = line.split(/(?:->|\s+-\s+|\s+:\s+|—)/);
          if (parts.length >= 2) {
            const left = parts[0].replace(/^[0-9A-Za-z১-৯ক-ঘ][.)\-]\s*/, "").trim();
            const right = parts[1].replace(/^[0-9A-Za-z১-৯ক-ঘ][.)\-]\s*/, "").trim();
            if (left && right && !left.toLowerCase().includes("match") && !left.includes("মিলকরণ")) {
              pairs.push({ left, right });
            }
          }
        }
      }

      if (pairs.length >= 2) {
        questions.push({
          id: `imp-${Date.now()}-${qIndex++}`,
          type: "matching",
          questionText: questionText || "বাম পাশের উপাদানের সাথে ডান পাশের সঠিক তথ্য মিল করুন",
          pairs,
          explanation: explanation || "সঠিক জোড়াগুলোর পারস্পরিক সম্পর্ক মিলিয়ে নিন।",
          conceptTopic,
          marks: pairs.length,
          timeLimit: 40,
        });
        continue;
      }
    }

    if (isFillBlank) {
      // Extract accepted answers
      let answerText = "";
      const ansLine = lines.find((l) =>
        /^(?:Answer|উত্তর|Correct|সঠিক উত্তর|Ans)[\s*:]+/i.test(l)
      );
      if (ansLine) {
        answerText = ansLine.replace(/^(?:Answer|উত্তর|Correct|সঠিক উত্তর|Ans)[\s*:]+/i, "").trim();
      }

      const acceptedAnswers = answerText
        ? answerText.split(/[,;/|]+/).map((a) => a.trim()).filter(Boolean)
        : ["সঠিক উত্তর"];

      questions.push({
        id: `imp-${Date.now()}-${qIndex++}`,
        type: "fill_blank",
        questionText,
        acceptedAnswers,
        explanation: explanation || `সঠিক উত্তর হলো: ${acceptedAnswers.join(", ")}`,
        conceptTopic,
        marks: 2,
        timeLimit: 25,
      });
      continue;
    }

    if (isTrueFalse) {
      let isTrue = true;
      const ansLine = lines.find((l) =>
        /^(?:Answer|উত্তর|Correct|সঠিক উত্তর|Ans)[\s*:]+/i.test(l)
      );
      if (ansLine) {
        const val = ansLine.toLowerCase();
        if (val.includes("false") || val.includes("মিথ্যা") || val.includes("f") || val.includes("না")) {
          isTrue = false;
        }
      }

      questions.push({
        id: `imp-${Date.now()}-${qIndex++}`,
        type: "true_false",
        questionText,
        correctAnswer: isTrue,
        explanation: explanation || (isTrue ? "প্রদত্ত বিবৃতিটি সম্পূর্ণ সত্য।" : "প্রদত্ত বিবৃতিটি সঠিক নয়।"),
        conceptTopic,
        marks: 1,
        timeLimit: 20,
      });
      continue;
    }

    // Default to MCQ
    const options: string[] = [];
    let correctIndex = 0;

    for (const line of lines) {
      // Option line detection: A) ..., B) ..., ক) ..., খ) ..., 1) ...
      const optMatch = line.match(/^([A-Da-dক-ঘ]|[1-4])[.)\-:]\s*(.+)$/);
      if (optMatch) {
        options.push(optMatch[2].trim());
      }
    }

    // Find correct answer indicator
    const ansLine = lines.find((l) =>
      /^(?:Answer|উত্তর|Correct|সঠিক উত্তর|Ans)[\s*:]+/i.test(l)
    );
    if (ansLine) {
      const match = ansLine.match(/(?:[A-Da-dক-ঘ1-4])/);
      if (match) {
        const char = match[0].toUpperCase();
        if (char === "A" || char === "ক" || char === "1") correctIndex = 0;
        else if (char === "B" || char === "খ" || char === "2") correctIndex = 1;
        else if (char === "C" || char === "গ" || char === "3") correctIndex = 2;
        else if (char === "D" || char === "ঘ" || char === "4") correctIndex = 3;
      }
    }

    // If no options were found, create clean default options
    if (options.length < 2) {
      options.push("অপশন ক (বিকল্প ১)", "অপশন খ (বিকল্প ২)", "অপশন গ (বিকল্প ৩)", "অপশন ঘ (বিকল্প ৪)");
    }

    // Ensure correctIndex is within range
    if (correctIndex >= options.length) correctIndex = 0;

    questions.push({
      id: `imp-${Date.now()}-${qIndex++}`,
      type: "mcq_single",
      questionText,
      options,
      correctAnswer: correctIndex,
      explanation: explanation || `সঠিক উত্তর হলো: ${options[correctIndex] || "বিকল্প ১"}`,
      conceptTopic,
      marks: 2,
      timeLimit: 30,
    });
  }

  return questions;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawText, trade = "General", classLevel = "class-9" } = body;

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        { success: false, message: "কোনো টেক্সট পাওয়া যায়নি। দয়া করে প্রশ্ন পেস্ট করুন।" },
        { status: 400 }
      );
    }

    // Execute multi-key AI failover parsing
    try {
      const prompt = `You are an expert educational assessment parser for technical/vocational and academic schools in Bangladesh.
A teacher has copied raw quiz questions from an external AI tool (ChatGPT, Gemini, Claude, etc.) and pasted it below.
Parse this raw text into a clean JSON array of structured questions.

Supported question types:
1. "mcq_single" (Single choice MCQ with options array and 0-based correctAnswer index)
2. "mcq_multiple" (Multiple choice MCQ with options array and correctIndices array)
3. "fill_blank" (Fill in the blanks with acceptedAnswers string array)
4. "matching" (Left-to-right matching with pairs array: [{ left: "...", right: "..." }])
5. "true_false" (True/False with boolean correctAnswer: true or false)

Return ONLY a pure JSON array of objects adhering strictly to this schema:
[
  {
    "id": "q-1",
    "type": "mcq_single" | "mcq_multiple" | "fill_blank" | "matching" | "true_false",
    "questionText": "Question string in original language (Bangla or English)",
    "options": ["Option A", "Option B", "Option C", "Option D"], // Required for mcq_single and mcq_multiple
    "correctAnswer": 0, // 0-based integer for mcq_single, boolean for true_false
    "correctIndices": [0, 2], // Only if mcq_multiple
    "acceptedAnswers": ["Answer string"], // Only if fill_blank
    "pairs": [{ "left": "...", "right": "..." }], // Only if matching
    "explanation": "Explanation in original language",
    "conceptTopic": "Core topic name",
    "marks": 2,
    "timeLimit": 30
  }
]

RAW TEXT TO PARSE:
"""
${rawText}
"""`;

      const { data: parsedData, result } = await generateJsonWithFailover<any>({
        prompt,
        temperature: 0.1,
      });

      let parsed = parsedData;
      if (!Array.isArray(parsed) && parsed?.questions && Array.isArray(parsed.questions)) {
        parsed = parsed.questions;
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitizedQuestions: ParsedImportedQuestion[] = parsed.map((q, idx) => ({
          id: `imp-${Date.now()}-${idx + 1}`,
          type: q.type || "mcq_single",
          questionText: q.questionText || `প্রশ্ন ${idx + 1}`,
          options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"],
          correctAnswer: typeof q.correctAnswer === "number" || typeof q.correctAnswer === "boolean" ? q.correctAnswer : 0,
          correctIndices: Array.isArray(q.correctIndices) ? q.correctIndices : undefined,
          acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : undefined,
          pairs: Array.isArray(q.pairs) ? q.pairs : undefined,
          explanation: q.explanation || "সঠিক উত্তরটি যাচাই করা হয়েছে।",
          conceptTopic: q.conceptTopic || trade || "কারিগরি বিষয়",
          marks: Number(q.marks) || 2,
          timeLimit: Number(q.timeLimit) || 30,
        }));

        return NextResponse.json({
          success: true,
          source: "ai_multi_key_pipeline",
          providerUsed: `${result.keyAlias} (${result.modelName})`,
          count: sanitizedQuestions.length,
          questions: sanitizedQuestions,
        });
      }
    } catch (aiError: any) {
      console.warn("AI parsing failed on all keys, falling back to algorithmic parser:", aiError?.message);
    }

    // High performance Algorithmic Fallback
    const fallbackQuestions = parseRawQuizTextAlgorithmically(rawText);

    return NextResponse.json({
      success: true,
      source: "algorithmic_parser",
      count: fallbackQuestions.length,
      questions: fallbackQuestions,
    });
  } catch (error: any) {
    console.error("Error in parse-quiz-text route:", error);
    return NextResponse.json(
      { success: false, message: error.message || "প্রশ্ন পার্স করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
