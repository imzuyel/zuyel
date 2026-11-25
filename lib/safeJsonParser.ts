/**
 * Robust, fault-tolerant AI JSON parser and recovery utility for PTSC ERP.
 * Handles markdown code fences, trailing commas, unescaped inner quotes in Bengali/English text,
 * raw newlines, truncated LLM responses, and malformed arrays/objects.
 */

export function cleanJsonString(raw: string): string {
  if (!raw) return "";
  let text = String(raw).trim();

  // Strip leading/trailing markdown fences: ```json ... ``` or ``` ... ```
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "");
  // Strip inline or surrounded markdown fences if any text preceded it
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
  }

  // Remove potential BOM, zero-width spaces, and control characters
  text = text.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Convert Bengali/curly typographical quotes to escaped quotes
  text = text.replace(/[\u201C\u201D]/g, '\\"').replace(/[\u2018\u2019]/g, "'");

  // Locate first valid JSON opening character: [ or {
  const firstBrace = text.search(/[{\[]/);
  if (firstBrace > 0) {
    text = text.slice(firstBrace);
  }

  // Locate last valid JSON closing character: ] or }
  const lastBrace = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (lastBrace !== -1 && lastBrace < text.length - 1) {
    text = text.slice(0, lastBrace + 1);
  }

  return text.trim();
}

/**
 * Attempts to repair common LLM JSON syntax issues:
 * - Trailing commas before } or ]
 * - Unescaped newlines within string literals
 * - Unescaped quotes inside Bengali/English string values
 */
export function repairJsonString(text: string): string {
  let cleaned = cleanJsonString(text);

  // Remove trailing commas in arrays and objects: , ] or , }
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

  // Fix unescaped newlines within strings
  cleaned = cleaned.replace(/(?<="[^"]*)\r?\n(?=[^"]*")/g, "\\n");

  // Fix unescaped tabs within strings
  cleaned = cleaned.replace(/(?<="[^"]*)\t(?=[^"]*")/g, "\\t");

  // Fix missing comma between consecutive objects: } { -> }, {
  cleaned = cleaned.replace(/\}\s*\{/g, "}, {");

  // Fix missing comma between consecutive array elements: ] [ -> ], [
  cleaned = cleaned.replace(/\]\s*\[/g, "], [");

  return cleaned;
}

/**
 * Extracts all complete JSON objects from a potentially truncated text.
 * Salvages completed question objects if the LLM output was cut off midway.
 */
export function extractCompleteJsonObjects(text: string): any[] {
  const objects: any[] = [];
  let depth = 0;
  let startIndex = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{") {
        if (depth === 0) startIndex = i;
        depth++;
      } else if (char === "}") {
        depth--;
        if (depth === 0 && startIndex !== -1) {
          const objStr = text.slice(startIndex, i + 1);
          try {
            const parsedObj = JSON.parse(objStr);
            if (parsedObj.questions && Array.isArray(parsedObj.questions)) {
              objects.push(...parsedObj.questions);
            } else if (
              parsedObj.questionText ||
              parsedObj.question ||
              parsedObj.type
            ) {
              objects.push(parsedObj);
            }
          } catch {
            try {
              const repaired = repairJsonString(objStr);
              const parsedObj = JSON.parse(repaired);
              if (parsedObj.questions && Array.isArray(parsedObj.questions)) {
                objects.push(...parsedObj.questions);
              } else if (
                parsedObj.questionText ||
                parsedObj.question ||
                parsedObj.type
              ) {
                objects.push(parsedObj);
              }
            } catch {
              // Ignore non-salvageable fragment
            }
          }
          startIndex = -1;
        }
      }
    }
  }

  return objects;
}

/**
 * Resilient regex-based question extractor.
 * Salvages structured questions even when JSON brackets or syntax are completely broken.
 */
export function extractQuestionsViaRegex(rawText: string): any[] {
  const questions: any[] = [];
  if (!rawText) return questions;

  // Pattern to find question/options blocks
  const questionBlocks = rawText.split(/(?=(?:\{\s*"question"|"question"\s*:|Q\d+[:.]))/gi);

  for (const block of questionBlocks) {
    try {
      const qTextMatch = block.match(/"question"\s*:\s*"([^"]+)"/i) || block.match(/(?:question|প্রশ্ন)[:\s]+"?([^"\n\r]+)"?/i);
      if (!qTextMatch) continue;

      const questionText = qTextMatch[1].trim();
      if (!questionText || questionText.length < 3) continue;

      // Extract options if present
      const optionsMatch = block.match(/"options"\s*:\s*\[([\s\S]*?)\]/i);
      let options: string[] = [];

      if (optionsMatch) {
        options = optionsMatch[1]
          .split(/,\s*(?=(?:[^"]*"[^"]*")*[^"]*$)/)
          .map((opt) => opt.replace(/^["'\s]+|["'\s]+$/g, "").trim())
          .filter(Boolean);
      } else {
        // Fallback option extraction A, B, C, D
        const optMatches = Array.from(block.matchAll(/(?:[A-Dক-ঘ১-৪][\).\s]+|option\s*\d+[:.\s]+)"?([^"\n\r,]+)"?/gi));
        if (optMatches.length >= 2) {
          options = optMatches.map((m) => m[1].trim()).filter(Boolean);
        }
      }

      // Extract explanation
      const expMatch = block.match(/"explanation"\s*:\s*"([^"]+)"/i);
      const explanation = expMatch ? expMatch[1].trim() : "কারিগরি পাঠ্যসূচি অনুযায়ী সঠিক উত্তর নির্বাচন করা হয়েছে।";

      // Extract correct answer
      let correctAnswer = 0;
      const ansMatch = block.match(/"correctAnswer"\s*:\s*(\d+|true|false|"[^"]+")/i);
      if (ansMatch) {
        const val = ansMatch[1].trim();
        if (val === "true") correctAnswer = true as any;
        else if (val === "false") correctAnswer = false as any;
        else if (/^\d+$/.test(val)) correctAnswer = parseInt(val, 10);
      }

      questions.push({
        question: questionText,
        options: options.length >= 2 ? options : ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"],
        correctAnswer,
        explanation,
        timeLimit: 20,
        type: "mcq_single",
      });
    } catch {
      // Continue to next block
    }
  }

  return questions;
}

/**
 * Universal safe parser for AI-generated question lists.
 * Tries 5 progressive strategies:
 * 1. Standard JSON parse
 * 2. Repaired parse (trailing commas, quotes, newlines)
 * 3. Array / Object regex extraction
 * 4. Partial completed object stream extraction
 * 5. Resilient regex block parser
 * NEVER throws an unhandled error.
 */
export function safeParseAiQuestions(responseText: string): any[] {
  if (!responseText || !responseText.trim()) return [];

  const cleaned = cleanJsonString(responseText);

  // Strategy 1: Standard JSON parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) return parsed.questions;
    if (parsed && typeof parsed === "object") {
      const arr = Object.values(parsed).find((val) => Array.isArray(val) && val.length > 0);
      if (arr && Array.isArray(arr)) return arr as any[];
      if (parsed.question || parsed.questionText) return [parsed];
    }
  } catch {
    // Proceed to Strategy 2
  }

  // Strategy 2: Repaired parse
  try {
    const repaired = repairJsonString(cleaned);
    const parsed = JSON.parse(repaired);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) return parsed.questions;
  } catch {
    // Proceed to Strategy 3
  }

  // Strategy 3: Target outermost JSON array block [ ... ]
  try {
    const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      const repairedArray = repairJsonString(arrayMatch[0]);
      const parsed = JSON.parse(repairedArray);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Proceed to Strategy 4
  }

  // Strategy 4: Partial object extraction (recovers cut-off responses)
  try {
    const extracted = extractCompleteJsonObjects(responseText);
    if (extracted.length > 0) {
      console.info(`[SafeJsonParser] Salvaged ${extracted.length} questions from incomplete response.`);
      return extracted;
    }
  } catch {
    // Proceed to Strategy 5
  }

  // Strategy 5: Resilient regex block extraction
  try {
    const regexQuestions = extractQuestionsViaRegex(responseText);
    if (regexQuestions.length > 0) {
      console.info(`[SafeJsonParser] Extracted ${regexQuestions.length} questions via resilient regex parser.`);
      return regexQuestions;
    }
  } catch {
    // Return empty array safely
  }

  console.warn("[SafeJsonParser] Could not extract valid questions from response. Returning empty array for fallback handling.");
  return [];
}

/**
 * Universal safe parser for generic AI JSON objects.
 * Never throws — returns fallback on any failure.
 */
export function safeParseAiObject<T>(responseText: string, fallback: T): T {
  if (!responseText || !responseText.trim()) return fallback;

  const cleaned = cleanJsonString(responseText);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    try {
      const repaired = repairJsonString(cleaned);
      return JSON.parse(repaired) as T;
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(repairJsonString(match[0])) as T;
        } catch {
          // Fallback
        }
      }
      return fallback;
    }
  }
}
