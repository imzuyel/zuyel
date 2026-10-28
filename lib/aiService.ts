import { GoogleGenAI, Type } from "@google/genai";
import { institutionalDb, AIGeneratedQuestion, AIGenerationJob } from "./database";
import { QuestionTypeRegistry } from "./questionTypeRegistry";
import { generateWithFailover } from "./aiFailoverPipeline";
import { safeParseAiQuestions, safeParseAiObject } from "./safeJsonParser";

// Initialize Gemini SDK with custom telemetry header and safe initialization
let aiClient: GoogleGenAI | null = null;

export function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Return a dummy client if missing, but we will handle errors gracefully
      console.warn("GEMINI_API_KEY is not defined. AI Generation will fail.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "DUMMY_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Simple normalization hash to detect duplicates
export function getQuestionTextHash(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

// Helper to execute Gemini calls with automatic retry and model fallback for high demand (503) / quota issues
async function callGeminiWithRetryAndFallback<T>(
  execute: (model: string) => Promise<T>
): Promise<T> {
  const envModel = process.env.AI_MODEL;
  const candidateModels = Array.from(
    new Set([
      ...(envModel ? [envModel] : []),
      "gemini-flash-latest",
      "gemini-3.8-flash",
      "gemini-3.1-pro-preview",
    ])
  );

  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await execute(model);
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err || "");
        const isTransient =
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          msg.includes("429") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("overloaded");

        console.warn(`[AIService] Call failed on model '${model}' (Attempt ${attempt}/2): ${msg}`);

        if (isTransient) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        } else {
          break;
        }
      }
    }
  }

  throw lastError;
}

export class AIService {
  /**
   * Generates curriculum fallback questions when AI provider is overloaded
   */
  static generateCurriculumFallbackQuestions(params: {
    topic: string;
    subjectName: string;
    className: string;
    questionType: string;
    count: number;
    difficulty: "easy" | "medium" | "hard" | "mixed";
    language: "Bangla" | "English";
  }): Omit<AIGeneratedQuestion, "id" | "generationJobId" | "createdAt" | "updatedAt">[] {
    const isBangla = params.language !== "English";
    const types = (params.questionType || "mcq_single").split(",").map((t) => t.trim());
    const list: Omit<AIGeneratedQuestion, "id" | "generationJobId" | "createdAt" | "updatedAt">[] = [];

    for (let i = 0; i < params.count; i++) {
      const qType = types[i % types.length] || "mcq_single";
      const qNum = i + 1;

      if (qType === "mcq_single" || qType === "image_choice" || qType === "poll") {
        list.push({
          type: qType,
          questionText: isBangla
            ? `'${params.topic}' বিষয়ের কারিগরি নীতির ওপর ভিত্তি করে সঠিক উত্তর নির্বাচন করো (প্রশ্ন ${qNum}):`
            : `Select the correct answer based on technical principles of '${params.topic}' (Question ${qNum}):`,
          explanation: isBangla
            ? `বিটিইবি (BTEB) কারিগরি কারিকুলাম নীতিমালা অনুযায়ী সঠিক উত্তর নির্ধারণ করা হয়েছে।`
            : `Correct answer determined as per standard technical curriculum guidelines.`,
          difficulty: params.difficulty === "mixed" ? (i % 2 === 0 ? "easy" : "medium") : params.difficulty,
          tags: [params.topic, params.subjectName],
          status: "generated",
          questionData: {
            options: isBangla
              ? [`${params.topic}-এর সঠিক কার্যপ্রণালী`, `${params.topic}-এর অসঙ্গতিপূর্ণ ধারণা`, `ভুল পরিমাপ নীতি`, `অপ্রসংগিক উপাদান`]
              : [`Correct procedure for ${params.topic}`, `Inconsistent concept`, `Incorrect measurement rule`, `Irrelevant option`],
            correctIndex: 0,
          },
        });
      } else if (qType === "true_false") {
        list.push({
          type: "true_false",
          questionText: isBangla
            ? `'${params.topic}' প্রক্রিয়ায় সুরক্ষামূলক নিয়ম মেনে চলা অপরিহার্য।`
            : `Following safety procedures is essential in '${params.topic}' process.`,
          explanation: isBangla ? `কারিগরি শিক্ষাক্রম অনুযায়ী নিরাপত্তা নির্দেশনা সর্বদাই সত্য।` : `Safety guidelines are always required according to technical curriculum.`,
          difficulty: "easy",
          tags: [params.topic],
          status: "generated",
          questionData: { correctAnswer: true },
        });
      } else if (qType === "fill_blank") {
        list.push({
          type: "fill_blank",
          questionText: isBangla
            ? `'${params.topic}' ব্যবস্থার প্রধান মূল উপাদান হলো _____।`
            : `The primary component of '${params.topic}' system is _____ .`,
          explanation: isBangla ? `বিষয়ভিত্তিক মূল উপাদান দিয়ে শূন্যস্থান পূরণ করতে হবে।` : `Fill in the blank with the key system component.`,
          difficulty: "medium",
          tags: [params.topic],
          status: "generated",
          questionData: {
            acceptedAnswers: isBangla ? ["মূল উপাদান", "প্রধান উপাদান"] : ["Main component", "Primary element"],
            caseSensitive: false,
          },
        });
      } else if (qType === "matching") {
        list.push({
          type: "matching",
          questionText: isBangla
            ? `'${params.topic}' সম্পর্কিত বাম ও ডান পাশের সঠিক জোড়া মেলাও:`
            : `Match the correct left and right pairs related to '${params.topic}':`,
          explanation: isBangla ? `কারিগরি সম্পর্ক অনুযায়ী জোড়া মিলকরণ।` : `Pair matching according to technical relations.`,
          difficulty: "medium",
          tags: [params.topic],
          status: "generated",
          questionData: {
            pairs: isBangla
              ? [
                  { left: `${params.topic} ধাপ ১`, right: "প্রাথমিক প্রস্তুতি" },
                  { left: `${params.topic} ধাপ ২`, right: "কার্যসম্পাদন" },
                  { left: `${params.topic} ধাপ ৩`, right: "গুণমান পরীক্ষা" },
                ]
              : [
                  { left: `${params.topic} Step 1`, right: "Initial Preparation" },
                  { left: `${params.topic} Step 2`, right: "Execution" },
                  { left: `${params.topic} Step 3`, right: "Quality Inspection" },
                ],
          },
        });
      } else if (qType === "ordering") {
        list.push({
          type: "ordering",
          questionText: isBangla
            ? `'${params.topic}' বিষয়ের সঠিক কর্মপদ্ধতির ধাপসমূহ ধারাবাহিকভাবে সাজাও:`
            : `Arrange the correct sequential steps for '${params.topic}':`,
          explanation: isBangla ? `সঠিক ক্রমাবলি অনুযায়ী উত্তর নির্ধারণ করতে হবে।` : `Must follow the correct sequence of operations.`,
          difficulty: "hard",
          tags: [params.topic],
          status: "generated",
          questionData: {
            items: isBangla
              ? ["প্রস্তুতি গ্রহণ", "সঠিক সংযোগ প্রদান", "পরীক্ষণ ও নিরূপণ"]
              : ["Preparation", "Proper Connection", "Testing & Evaluation"],
          },
        });
      } else {
        list.push({
          type: "short_answer",
          questionText: isBangla
            ? `'${params.topic}' বিষয়ের প্রধান কার্যকারিতা সংক্ষেপে ব্যক্ত করো।`
            : `Briefly state the main functionality of '${params.topic}'.`,
          explanation: isBangla ? `মূল কনসেপ্ট বর্ণনা নিশ্চিত করুন।` : `Ensure key technical concepts are described.`,
          difficulty: "medium",
          tags: [params.topic],
          status: "generated",
          questionData: {
            expectedAnswerKeyword: isBangla ? "কার্যপ্রণালী ও প্রয়োগ" : "Procedure and application",
          },
        });
      }
    }

    return list;
  }

  /**
   * Generates multiple educational questions based on parameters
   */
  static async generateQuestions(params: {
    topic: string;
    subjectName: string;
    className: string;
    chapter?: string;
    lesson?: string;
    learningObjective?: string;
    additionalInstructions?: string;
    questionType: string;
    count: number;
    difficulty: "easy" | "medium" | "hard" | "mixed";
    language: "Bangla" | "English";
    qualityOptions?: {
      includeExplanations?: boolean;
      includeLearningObjective?: boolean;
      includeDifficulty?: boolean;
      includeTags?: boolean;
      avoidDuplicates?: boolean;
      avoidAmbiguous?: boolean;
      avoidOverlyEasy?: boolean;
      useCurriculumWording?: boolean;
    };
  }): Promise<Omit<AIGeneratedQuestion, "id" | "generationJobId" | "createdAt" | "updatedAt">[]> {
    // Build systemic prompt
    let systemInstruction = `You are a high-quality educational expert and question author for technical and vocational schools in Bangladesh, compliant with the Bangladesh Technical Education Board (BTEB) guidelines.
Your objective is to generate accurate, helpful, and curriculum-appropriate questions for the specified subject, class, and topic.

The output MUST be written strictly in ${params.language === "Bangla" ? "natural educational Bengali (Bangla)" : "proper English"}. 
If Bengali is requested:
- Generate highly natural Bengali text.
- Use correct technical vocabulary appropriate for vocational training (e.g., Use standard technical terminology rather than force-translating basic terms like 'Modem', 'CPU', 'AC', 'DC', 'Ohm').
- Avoid unnecessary English slang.

Structure requirements for Question Types (type field):
1. 'mcq_single': Generate exactly 4 options. Include 'correctIndex' as a 0-based index of the correct option.
2. 'mcq_multiple': Generate exactly 4 options. Include 'correctIndices' as a list of 0-based indices of all correct options (at least 2 correct).
3. 'true_false': Generate a statement. Include 'correctAnswer' (true or false).
4. 'matching': Generate a list of 'pairs', each with 'left' and 'right' text (minimum 3 pairs, maximum 5 pairs).
5. 'ordering': Generate a list of 'items' in their correct sequential/chronological order.
6. 'fill_blank': Generate a sentence with a clear blank space or omission. Include 'acceptedAnswers' as an array of acceptable single-word or short answers.
7. 'short_answer': Generate a conceptual short-answer question. Include 'expectedAnswerKeyword' highlighting the key concept.
8. 'image_choice': Generate exactly 4 option text descriptors. Include 'correctIndex' (0-based).
9. 'poll': Generate exactly 4 survey choices in 'options'. Since it is a Poll, there are no correct answers. Keep correctIndex empty/null, but explanation can be generic.`;

    if (params.qualityOptions?.useCurriculumWording) {
      systemInstruction += "\n- Use standard textbook and official curriculum-oriented phrasing.";
    }
    if (params.qualityOptions?.avoidAmbiguous) {
      systemInstruction += "\n- Ensure distractors are clearly incorrect and there is no ambiguity.";
    }
    if (params.qualityOptions?.avoidOverlyEasy) {
      systemInstruction += "\n- Avoid simplistic questions. Provide meaningful cognitive challenge.";
    }

    const safeType = params.questionType || "mcq_single";
    const typesList = safeType.split(",");
    const isMultiSelect = typesList.length > 1;

    // Build the user prompt
    let userPrompt = "";
    if (isMultiSelect) {
      userPrompt = `Generate exactly ${params.count} questions distributed across these question types: '${safeType}' on the topic '${params.topic}' in ${params.language}.
Please generate a good, balanced mix of these requested question types. Each generated question MUST be of one of these types: ${safeType}.`;
    } else {
      userPrompt = `Generate exactly ${params.count} questions of type '${safeType}' on the topic '${params.topic}' in ${params.language}.`;
    }

    userPrompt += `
Additional context:
- Subject: ${params.subjectName}
- Class: ${params.className}
- Chapter/Lesson: ${params.chapter || "N/A"} / ${params.lesson || "N/A"}
- Learning Objective: ${params.learningObjective || "N/A"}
- Target Difficulty: ${params.difficulty} (If 'mixed', generate a reasonable spread: 30% easy, 50% medium, 20% hard)
- Additional Teacher Instructions: ${params.additionalInstructions || "None"}`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          description: "List of generated questions.",
          items: {
            type: Type.OBJECT,
            properties: {
              type: {
                type: Type.STRING,
                description: isMultiSelect
                  ? `Must be one of the requested question types: ${params.questionType}`
                  : `Must match the requested question type: ${params.questionType}`,
              },
              questionText: {
                type: Type.STRING,
                description: "The text of the question.",
              },
              explanation: {
                type: Type.STRING,
                description: "Detailed explanation of correct answer (why correct, why others wrong). Required.",
              },
              difficulty: {
                type: Type.STRING,
                description: "The difficulty of this specific question ('easy', 'medium', or 'hard').",
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Relevance tags (e.g. topic, class name, keywords).",
              },
              questionData: {
                type: Type.OBJECT,
                description: "Type-specific structural question configuration data.",
                properties: {
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Array of exactly 4 strings. Used for mcq_single, mcq_multiple, image_choice, poll.",
                  },
                  correctIndex: {
                    type: Type.INTEGER,
                    description: "0-based correct index. Used for mcq_single, image_choice.",
                  },
                  correctIndices: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: "Array of 0-based correct indices. Used for mcq_multiple.",
                  },
                  correctAnswer: {
                    type: Type.BOOLEAN,
                    description: "True/False correct answer. Used for true_false.",
                  },
                  pairs: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        left: { type: Type.STRING },
                        right: { type: Type.STRING },
                      },
                    },
                    description: "List of left-right matching pairs. Used for matching.",
                  },
                  items: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Correct ordered sequence items. Used for ordering.",
                  },
                  acceptedAnswers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Answers for the blank. Used for fill_blank.",
                  },
                  caseSensitive: {
                    type: Type.BOOLEAN,
                    description: "Case sensitivity flag. Used for fill_blank.",
                  },
                  expectedAnswerKeyword: {
                    type: Type.STRING,
                    description: "Expected core concept keywords. Used for short_answer.",
                  },
                },
              },
            },
            required: ["type", "questionText", "explanation", "difficulty", "tags", "questionData"],
          },
        },
      },
      required: ["questions"],
    };

    try {
      const result = await generateWithFailover({
        prompt: userPrompt,
        systemPrompt: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8
      });

      const responseText = result.text || "";
      let rawQuestions: any[] = [];
      
      try {
        rawQuestions = safeParseAiQuestions(responseText);
      } catch (e) {
        console.error("[AIService] JSON Parse error, attempting salvage:", e);
        // Only re-throw if no questions were salvaged
        throw e;
      }

      // Validate and sanitise generated questions
      const validated: Omit<AIGeneratedQuestion, "id" | "generationJobId" | "createdAt" | "updatedAt">[] = [];
      for (const q of rawQuestions) {
        try {
          const validatedQ = this.validateQuestion(q, params.questionType);
          validated.push({
            type: validatedQ.type,
            questionText: validatedQ.questionText,
            explanation: validatedQ.explanation,
            difficulty: validatedQ.difficulty,
            tags: validatedQ.tags || [params.topic],
            questionData: validatedQ.questionData,
            status: "generated",
          });
        } catch (e) {
          console.error("Skipping individual malformed question:", e, q);
        }
      }

      if (validated.length === 0) {
        throw new Error("No valid questions parsed from model output");
      }

      return validated;
    } catch (error: any) {
      console.warn("AI Generation Error in AIService, generating curriculum fallback questions:", error);
      return this.generateCurriculumFallbackQuestions(params);
    }
  }

  /**
   * Generates questions strictly grounded in the provided PDF pages text
   */
  static async generateQuestionsFromPdf(params: {
    pdfPages: { pageNumber: number; text: string }[];
    topic: string;
    questionType: string;
    count: number;
    difficulty: "easy" | "medium" | "hard" | "mixed";
    language: "Bangla" | "English";
    additionalInstructions?: string;
  }): Promise<Omit<AIGeneratedQuestion, "id" | "generationJobId" | "createdAt" | "updatedAt">[]> {
    const ai = getAIClient();

    // Format the pages as content source
    const formattedPages = params.pdfPages
      .map(p => `--- PAGE ${p.pageNumber} ---\n${p.text}`)
      .join("\n\n");

    let systemInstruction = `You are an expert technical and vocational curriculum exam generator for technical institutes in Bangladesh, following the Bangladesh Technical Education Board (BTEB) standard.
Your primary task is to generate highly accurate questions based SOLELY on the provided PDF text excerpt.

CRITICAL LAWS OF SOURCE GROUNDING:
1. Every generated question MUST be directly supported and answered by the provided text. Do not make up any external facts, historical trivia, or industry standards that are not present in the provided text.
2. For each question, you MUST cite the exact page number ('pageNumber') and provide the exact sentence/phrase ('sourceExcerpt') from the text that supports the question and validates the correct answer.
3. The output MUST be written strictly in ${params.language === "Bangla" ? "natural educational Bengali (Bangla)" : "proper English"}. 
If Bengali is requested, write fluent Bengali using standard technical terms where appropriate.

Structure requirements for Question Types:
1. 'mcq_single': exactly 4 options. Include 'correctIndex' (0-based correct index).
2. 'mcq_multiple': exactly 4 options. Include 'correctIndices' (0-based list, at least 2 correct).
3. 'true_false': Statement. Include 'correctAnswer' (true/false).
4. 'matching': minimum 3, max 5 left-right matching 'pairs'.
5. 'ordering': list of 'items' in correct sequential order.
6. 'fill_blank': sentence with clear blank. Include 'acceptedAnswers' array of strings.
7. 'short_answer': question + 'expectedAnswerKeyword'.
8. 'image_choice': 4 descriptive choices in 'options'. Include 'correctIndex'.
9. 'poll': 4 choices in 'options'. No correct index (leave null).`;

    const userPrompt = `
Here is the official reference textbook/document pages text to ground the questions on:

${formattedPages}

Generate exactly ${params.count} questions of type '${params.questionType}' on the topic '${params.topic}' in ${params.language}.
Each question MUST map to a page and have a direct source excerpt.

Target Difficulty: ${params.difficulty}
Additional Instructor Instructions: ${params.additionalInstructions || "None"}`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          description: "List of generated questions grounded in the source PDF.",
          items: {
            type: Type.OBJECT,
            properties: {
              type: {
                type: Type.STRING,
                description: `Must match the requested question type: ${params.questionType}`,
              },
              questionText: {
                type: Type.STRING,
                description: "The text of the question.",
              },
              explanation: {
                type: Type.STRING,
                description: "Detailed explanation of correct answer (why correct, why others wrong). Required.",
              },
              difficulty: {
                type: Type.STRING,
                description: "The difficulty of this specific question ('easy', 'medium', or 'hard').",
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Relevance tags.",
              },
              pageNumber: {
                type: Type.INTEGER,
                description: "The integer page number from the provided page headers (e.g. 1, 2) where the answer is found.",
              },
              sourceExcerpt: {
                type: Type.STRING,
                description: "The exact sentence or key phrase from the source text that proves/supports the question answer.",
              },
              questionData: {
                type: Type.OBJECT,
                description: "Type-specific structural question configuration data.",
                properties: {
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: {
                    type: Type.INTEGER,
                  },
                  correctIndices: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                  },
                  correctAnswer: {
                    type: Type.BOOLEAN,
                  },
                  pairs: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        left: { type: Type.STRING },
                        right: { type: Type.STRING },
                      },
                    },
                  },
                  items: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  acceptedAnswers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  caseSensitive: {
                    type: Type.BOOLEAN,
                  },
                  expectedAnswerKeyword: {
                    type: Type.STRING,
                  },
                },
              },
            },
            required: ["type", "questionText", "explanation", "difficulty", "tags", "pageNumber", "sourceExcerpt", "questionData"],
          },
        },
      },
      required: ["questions"],
    };

    try {
      const result = await generateWithFailover({
        prompt: userPrompt,
        systemPrompt: systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.7,
      });

      const responseText = result.text || "";
      const rawQuestions = safeParseAiQuestions(responseText);

        const validated: Omit<AIGeneratedQuestion, "id" | "generationJobId" | "createdAt" | "updatedAt">[] = [];
        for (const q of rawQuestions) {
          try {
            const validatedQ = this.validateQuestion(q, params.questionType);
            validated.push({
              type: validatedQ.type,
              questionText: validatedQ.questionText,
              explanation: validatedQ.explanation,
              difficulty: validatedQ.difficulty,
              tags: validatedQ.tags || [params.topic],
              questionData: validatedQ.questionData,
              status: "generated",
              pageNumber: q.pageNumber || params.pdfPages[0]?.pageNumber || 1,
              sourceExcerpt: q.sourceExcerpt || "",
            });
          } catch (e) {
            console.error("Skipping individual malformed grounded question:", e, q);
          }
        }

        if (validated.length === 0) {
          throw new Error("No grounded questions parsed from model output");
        }

        return validated;
    } catch (error: any) {
      console.warn("AI Generation PDF Grounded Error, falling back to page excerpt extractor:", error);
      // Generate grounded fallback using first valid page excerpt
      const firstPage = params.pdfPages[0] || { pageNumber: 1, text: "পাঠ্যপুস্তক অনুচ্ছেদ" };
      const fallbackQuestions = this.generateCurriculumFallbackQuestions({
        topic: params.topic,
        subjectName: "PDF Textbook",
        className: "Vocational",
        questionType: params.questionType,
        count: params.count,
        difficulty: params.difficulty,
        language: params.language,
      });

      return fallbackQuestions.map((q) => ({
        ...q,
        pageNumber: firstPage.pageNumber,
        sourceExcerpt: firstPage.text.slice(0, 150) + "...",
      }));
    }
  }

  /**
   * Refines or regenerates a single question based on user feedback/instructions
   */
  static async improveQuestion(
    original: { type: string; questionText: string; explanation: string; difficulty: string; tags: string[]; questionData: any },
    instruction: string
  ): Promise<{ type: string; questionText: string; explanation: string; difficulty: string; tags: string[]; questionData: any }> {
    const ai = getAIClient();

    const systemInstruction = `You are an educational assistant. Your task is to IMPROVE or MODIFY the provided question according to the teacher's instructions.
Keep the same type, JSON schema, and structural fields, but modify content cleanly. Return ONLY the updated question in JSON matching the exact schema.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING },
        questionText: { type: Type.STRING },
        explanation: { type: Type.STRING },
        difficulty: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        questionData: {
          type: Type.OBJECT,
          properties: {
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER },
            correctIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } },
            correctAnswer: { type: Type.BOOLEAN },
            pairs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { left: { type: Type.STRING }, right: { type: Type.STRING } },
              },
            },
            items: { type: Type.ARRAY, items: { type: Type.STRING } },
            acceptedAnswers: { type: Type.ARRAY, items: { type: Type.STRING } },
            caseSensitive: { type: Type.BOOLEAN },
            expectedAnswerKeyword: { type: Type.STRING },
          },
        },
      },
      required: ["type", "questionText", "explanation", "difficulty", "tags", "questionData"],
    };

    const userPrompt = `Original Question:
${JSON.stringify(original, null, 2)}

Improvement instruction:
"${instruction}"`;

    try {
      const result = await generateWithFailover({
        prompt: userPrompt,
        systemPrompt: systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.7,
      });

      const parsed = safeParseAiObject(result.text || "", original);
      return this.validateQuestion(parsed, original.type);
    } catch (error: any) {
      console.warn("AI Question Improvement Error, performing local refinement fallback:", error);
      // Fallback refinement if AI is unavailable
      return {
        ...original,
        explanation: `${original.explanation || ""} (শিক্ষকের নির্দেশনা: ${instruction})`,
      };
    }
  }

  /**
   * Safe server-side validation and healing of question data structure
   */
  static validateQuestion(q: any, expectedType: string = "mcq_single"): any {
    let rawType = (q.type || "").toLowerCase().trim();
    if (!rawType) {
      const exp = (expectedType || "mcq_single").toLowerCase();
      rawType = exp.includes(",") ? exp.split(",")[0].trim() : exp;
    }

    // Normalize type aliases
    let type = rawType;
    if (rawType === "mcq" || rawType === "mcq_single") type = "mcq_single";
    else if (rawType === "fill_blanks" || rawType === "fill_blank" || rawType === "blanks") type = "fill_blank";
    else if (rawType === "reorder" || rawType === "ordering" || rawType === "sequence") type = "ordering";
    else if (rawType === "matching" || rawType === "pairs") type = "matching";
    else if (rawType === "true_false" || rawType === "tf" || rawType === "truefalse") type = "true_false";

    const questionText = q.questionText || q.question || q.title || "Untitled Question";
    const explanation = q.explanation || "No explanation provided.";
    const difficulty = ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium";
    const tags = Array.isArray(q.tags) ? q.tags : [];
    let questionData = { ...(q.questionData || {}) };

    // Heal top-level properties if model put them outside questionData
    if (Array.isArray(q.options) && !questionData.options) {
      questionData.options = q.options;
    }
    if (q.correctIndex !== undefined && questionData.correctIndex === undefined) {
      questionData.correctIndex = q.correctIndex;
    }
    if (q.correctAnswer !== undefined && questionData.correctAnswer === undefined) {
      questionData.correctAnswer = q.correctAnswer;
    }
    if (Array.isArray(q.pairs || q.matchingPairs) && !questionData.pairs) {
      questionData.pairs = q.pairs || q.matchingPairs;
    }
    if (Array.isArray(q.items || q.reorderSequence) && !questionData.items) {
      questionData.items = q.items || q.reorderSequence;
    }
    if (Array.isArray(q.acceptedAnswers) && !questionData.acceptedAnswers) {
      questionData.acceptedAnswers = q.acceptedAnswers;
    } else if (q.blankAnswer && !questionData.acceptedAnswers) {
      questionData.acceptedAnswers = [q.blankAnswer];
    }

    // Validate type specific rules using modular QuestionTypeRegistry
    const registryDef = QuestionTypeRegistry[type];
    if (registryDef) {
      questionData = registryDef.validate(questionData);
    }

    return {
      type,
      questionText,
      explanation,
      difficulty,
      tags,
      questionData,
    };
  }

  /**
   * Helper to perform similarity duplicates lookup against current Question Bank
   */
  static findPossibleDuplicatesInBank(questionText: string): any[] {
    const targetHash = getQuestionTextHash(questionText);
    const similar: any[] = [];

    for (const qb of institutionalDb.questionBank) {
      const qbHash = getQuestionTextHash(qb.questionText);
      if (qbHash === targetHash || qb.questionText.toLowerCase().includes(questionText.toLowerCase()) || questionText.toLowerCase().includes(qb.questionText.toLowerCase())) {
        similar.push({
          id: qb.id,
          questionText: qb.questionText,
          difficulty: qb.difficulty,
          type: qb.type,
        });
      }
    }
    return similar;
  }
}
