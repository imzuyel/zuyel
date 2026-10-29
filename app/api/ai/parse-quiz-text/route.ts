import { NextRequest, NextResponse } from "next/server";
import { generateJsonWithFailover } from "@/lib/aiFailoverPipeline";

export interface ParsedImportedQuestion {
  id: string;
  type: "mcq_single" | "mcq_multiple" | "fill_blank" | "matching" | "true_false" | "reorder" | "word_cloud" | "open_ended" | "text_slide";
  questionText: string;
  options?: string[];
  correctAnswer?: number | boolean | string; // index for MCQ single, or boolean for True/False
  correctIndices?: number[]; // for MCQ multiple
  acceptedAnswers?: string[]; // for fill in blank
  pairs?: { left: string; right: string }[]; // for matching
  items?: string[]; // for reorder
  content?: string;
  explanation: string;
  conceptTopic: string;
  marks: number;
  timeLimit: number;
}

export interface ParsedPresentationSlide {
  id: string;
  type: "MCQ" | "MATCHING" | "FILL_BLANKS" | "REORDER" | "TRUE_FALSE" | "WORD_CLOUD" | "OPEN_ENDED" | "TEXT_SLIDE" | "IMAGE_COMPARE" | "LIVE_QA";
  title: string;
  content?: string;
  options?: string[];
  correctAnswer?: number | boolean | string;
  pairs?: { left: string; right: string }[];
  items?: string[];
  acceptedAnswers?: string[];
  explanation: string;
  points: number;
  timeLimit: number;
}

// Convert any question format to unified presentation slide
function convertToPresentationSlide(q: any, idx: number): ParsedPresentationSlide {
  let sType: ParsedPresentationSlide["type"] = "MCQ";
  const rawType = (q.type || "").toUpperCase().replace(/-/g, "_");

  if (rawType.includes("MATCH")) sType = "MATCHING";
  else if (rawType.includes("BLANK") || rawType.includes("FILL")) sType = "FILL_BLANKS";
  else if (rawType.includes("REORDER") || rawType.includes("ORDER") || rawType.includes("SEQUENCE")) sType = "REORDER";
  else if (rawType.includes("TRUE") || rawType.includes("FALSE") || rawType.includes("TF")) sType = "TRUE_FALSE";
  else if (rawType.includes("CLOUD")) sType = "WORD_CLOUD";
  else if (rawType.includes("OPEN")) sType = "OPEN_ENDED";
  else if (rawType.includes("TEXT") || rawType.includes("HEADING")) sType = "TEXT_SLIDE";
  else sType = "MCQ";

  const isGraded = !["TEXT_SLIDE", "IMAGE_COMPARE", "WORD_CLOUD", "OPEN_ENDED", "LIVE_QA"].includes(sType);

  return {
    id: q.id || `slide-${Date.now()}-${idx + 1}`,
    type: sType,
    title: q.questionText || q.title || q.prompt || `প্রশ্ন ${idx + 1}`,
    content: q.content || "",
    options: Array.isArray(q.options) && q.options.length > 0
      ? q.options
      : sType === "TRUE_FALSE"
        ? ["সত্য (True)", "মিথ্যা (False)"]
        : sType === "MCQ"
          ? ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"]
          : [],
    correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
    pairs: Array.isArray(q.pairs) ? q.pairs : undefined,
    items: Array.isArray(q.items) ? q.items : undefined,
    acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : undefined,
    explanation: q.explanation || "সঠিক উত্তরটি যাচাই করা হয়েছে।",
    points: isGraded ? (Number(q.marks) || Number(q.points) || 100) : 0,
    timeLimit: isGraded ? (Number(q.timeLimit) || 30) : 0,
  };
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

    const isReorder =
      (cleanBlock.toLowerCase().includes("reorder") ||
        cleanBlock.toLowerCase().includes("sequence") ||
        cleanBlock.toLowerCase().includes("arrange") ||
        cleanBlock.includes("ক্রম") ||
        cleanBlock.includes("সাজাও") ||
        cleanBlock.includes("ধারাবাহিক")) &&
      !isMatching;

    const isFillBlank =
      (cleanBlock.includes("___") || cleanBlock.includes(".....") || cleanBlock.includes("শূন্যস্থান")) &&
      !isMatching &&
      !isReorder;

    const isTrueFalse =
      (cleanBlock.toLowerCase().includes("true/false") ||
        cleanBlock.toLowerCase().includes("true or false") ||
        cleanBlock.includes("সত্য/মিথ্যা") ||
        cleanBlock.includes("সত্য নাকি মিথ্যা")) &&
      !isMatching &&
      !isReorder;

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
          marks: 100,
          timeLimit: 40,
        });
        continue;
      }
    }

    if (isReorder) {
      const items: string[] = [];
      for (const line of lines.slice(1)) {
        const itemMatch = line.match(/^(?:ধাপ\s*[০-৯0-9]+|[0-9A-Za-z১-৯ক-ঘ])[.)\-:]\s*(.+)$/);
        if (itemMatch) {
          items.push(itemMatch[1].trim());
        } else if (line.length > 2 && !line.toLowerCase().includes("answer") && !line.includes("ব্যাখ্যা")) {
          items.push(line);
        }
      }

      if (items.length >= 2) {
        questions.push({
          id: `imp-${Date.now()}-${qIndex++}`,
          type: "reorder",
          questionText: questionText || "নিচের ধাপগুলোকে সঠিক ক্রমানুসারে সাজান",
          items,
          explanation: explanation || "ধারাবাহিক ধাপগুলো সঠিকভাবে ক্রমানুসারে সাজানো হয়েছে।",
          conceptTopic,
          marks: 100,
          timeLimit: 35,
        });
        continue;
      }
    }

    if (isFillBlank) {
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
        marks: 100,
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
        marks: 100,
        timeLimit: 20,
      });
      continue;
    }

    // Default to MCQ
    const options: string[] = [];
    let correctIndex = 0;

    for (const line of lines) {
      const optMatch = line.match(/^([A-Da-dক-ঘ]|[1-4])[.)\-:]\s*(.+)$/);
      if (optMatch) {
        options.push(optMatch[2].trim());
      }
    }

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

    if (options.length < 2) {
      options.push("অপশন ক (বিকল্প ১)", "অপশন খ (বিকল্প ২)", "অপশন গ (বিকল্প ৩)", "অপশন ঘ (বিকল্প ৪)");
    }

    if (correctIndex >= options.length) correctIndex = 0;

    questions.push({
      id: `imp-${Date.now()}-${qIndex++}`,
      type: "mcq_single",
      questionText,
      options,
      correctAnswer: correctIndex,
      explanation: explanation || `সঠিক উত্তর হলো: ${options[correctIndex] || "বিকল্প ১"}`,
      conceptTopic,
      marks: 100,
      timeLimit: 30,
    });
  }

  return questions;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawText, trade = "General", classLevel = "class-9", format = "both" } = body;

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        { success: false, message: "কোনো টেক্সট পাওয়া যায়নি। দয়া করে প্রশ্ন বা নোট পেস্ট করুন।" },
        { status: 400 }
      );
    }

    const cleanRaw = rawText.trim();

    // 1. FAST-PATH JSON PARSER: Instant 0ms execution if user pasted JSON array or object
    if (cleanRaw.startsWith("[") || cleanRaw.startsWith("{")) {
      try {
        let parsedJson = JSON.parse(cleanRaw);
        if (!Array.isArray(parsedJson) && parsedJson?.slides && Array.isArray(parsedJson.slides)) {
          parsedJson = parsedJson.slides;
        } else if (!Array.isArray(parsedJson) && parsedJson?.questions && Array.isArray(parsedJson.questions)) {
          parsedJson = parsedJson.questions;
        }

        if (Array.isArray(parsedJson) && parsedJson.length > 0) {
          const slides = parsedJson.map((item, idx) => convertToPresentationSlide(item, idx));
          return NextResponse.json({
            success: true,
            source: "fast_json_parser",
            count: slides.length,
            slides,
            questions: parsedJson,
          });
        }
      } catch (jsonErr) {
        // Not clean JSON, proceed to algorithmic / AI
      }
    }

    // 2. High-performance Instant Algorithmic Parsing
    const algorithmicQuestions = parseRawQuizTextAlgorithmically(cleanRaw);
    if (algorithmicQuestions.length >= 2 && !body.forceAi) {
      const slides = algorithmicQuestions.map((q, idx) => convertToPresentationSlide(q, idx));
      return NextResponse.json({
        success: true,
        source: "instant_algorithmic_parser",
        count: slides.length,
        slides,
        questions: algorithmicQuestions,
      });
    }

    // 3. Multi-Key AI Failover Pipeline for complex, unstructured, or raw paragraphs
    try {
      const prompt = `You are an expert educational assessment parser for technical/vocational and academic schools under BTEB, Bangladesh.
A teacher has copied raw notes, questions, or text from an external AI (ChatGPT, Claude, Gemini, Google Docs, etc.) and pasted it below.
Convert this raw text into a clean JSON array of structured presentation slides and quiz questions.

Supported slide types:
1. "MCQ": Single choice with 4 options and 0-based correctAnswer index (0 to 3).
2. "MATCHING": Left-to-right matching with pairs array: [{ "left": "...", "right": "..." }].
3. "FILL_BLANKS": Sentence with blank, acceptedAnswers string array, and explanation.
4. "REORDER": Sequence ordering with items string array in the correct chronological order.
5. "TRUE_FALSE": Verification with boolean correctAnswer (true/false) and options ["সত্য (True)", "মিথ্যা (False)"].
6. "WORD_CLOUD": Interactive prompt with options array representing popular keywords.
7. "OPEN_ENDED": Discussion/reflection prompt.
8. "TEXT_SLIDE": Informational slide with title and content summary.

Return ONLY a pure JSON array of objects adhering strictly to this schema:
[
  {
    "id": "slide-1",
    "type": "MCQ" | "MATCHING" | "FILL_BLANKS" | "REORDER" | "TRUE_FALSE" | "WORD_CLOUD" | "OPEN_ENDED" | "TEXT_SLIDE",
    "title": "Clean question or slide title in Bangla/English",
    "content": "Detailed text content if TEXT_SLIDE",
    "options": ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"],
    "correctAnswer": 0,
    "pairs": [{ "left": "বাম পাশ", "right": "ডান পাশ" }],
    "items": ["ধাপ ১", "ধাপ ২", "ধাপ ৩"],
    "acceptedAnswers": ["সঠিক উত্তর"],
    "explanation": "Clear explanation in original language",
    "points": 100,
    "timeLimit": 30
  }
]

RAW TEXT TO PARSE:
"""
${cleanRaw}
"""`;

      const { data: parsedData, result } = await generateJsonWithFailover<any>({
        prompt,
        temperature: 0.1,
      });

      let parsed = parsedData;
      if (!Array.isArray(parsed) && parsed?.slides && Array.isArray(parsed.slides)) {
        parsed = parsed.slides;
      } else if (!Array.isArray(parsed) && parsed?.questions && Array.isArray(parsed.questions)) {
        parsed = parsed.questions;
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        const slides = parsed.map((item, idx) => convertToPresentationSlide(item, idx));
        return NextResponse.json({
          success: true,
          source: "ai_multi_key_pipeline",
          providerUsed: `${result.keyAlias} (${result.modelName})`,
          count: slides.length,
          slides,
          questions: parsed,
        });
      }
    } catch (aiError: any) {
      console.warn("AI parsing failed on all keys, falling back to algorithmic parser:", aiError?.message);
    }

    // Final Fallback: Return whatever algorithmic parser found
    const finalSlides = algorithmicQuestions.map((q, idx) => convertToPresentationSlide(q, idx));

    return NextResponse.json({
      success: true,
      source: "algorithmic_fallback",
      count: finalSlides.length,
      slides: finalSlides,
      questions: algorithmicQuestions,
    });
  } catch (error: any) {
    console.error("Error in parse-quiz-text route:", error);
    return NextResponse.json(
      { success: false, message: error.message || "প্রশ্ন পার্স করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
