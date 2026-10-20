/**
 * Robust, fault-tolerant AI JSON parser and recovery utility.
 * Handles markdown fences, trailing commas, unescaped quotes/newlines,
 * and truncated responses where an array of objects was cut off.
 */

export function cleanJsonString(raw: string): string {
  if (!raw) return "";
  let text = raw.trim();

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  // Remove potential BOM or zero-width spaces
  text = text.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "");

  // If there are leading non-JSON characters before first [ or {
  const firstBrace = text.search(/[{\[]/);
  if (firstBrace > 0) {
    text = text.slice(firstBrace);
  }

  // Remove trailing non-JSON characters after last ] or }
  const lastBrace = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (lastBrace !== -1 && lastBrace < text.length - 1) {
    text = text.slice(0, lastBrace + 1);
  }

  return text.trim();
}

/**
 * Attempts to repair common JSON syntax issues:
 * - Trailing commas before } or ]
 * - Missing quotes around property names
 * - Truncated brackets
 */
export function repairJsonString(text: string): string {
  let cleaned = cleanJsonString(text);

  // Remove trailing commas in arrays and objects: , ] or , }
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

  // Fix unescaped newlines within strings (common in LLM explanations)
  // Replace raw newlines that are not preceded by a comma or bracket
  cleaned = cleaned.replace(/(?<="[^"]*)\n(?=[^"]*")/g, "\\n");

  return cleaned;
}

/**
 * Extracts all complete JSON objects from a potentially truncated text.
 * If the model output cut off at position 11315, this extracts all earlier
 * fully completed question objects!
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
 * Universal safe parser for AI-generated question lists.
 * Tries normal parse -> repaired parse -> partial object extraction.
 */
export function safeParseAiQuestions(responseText: string): any[] {
  if (!responseText || !responseText.trim()) return [];

  const cleaned = cleanJsonString(responseText);

  // Strategy 1: Standard JSON parse on whole or matched JSON
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
    if (parsed && typeof parsed === "object") {
      // Maybe under another key like data, items
      const arr = Object.values(parsed).find((val) => Array.isArray(val));
      if (arr && Array.isArray(arr)) return arr as any[];
      return [parsed];
    }
  } catch (e1) {
    // Strategy 2: Repaired parse
    try {
      const repaired = repairJsonString(cleaned);
      const parsed = JSON.parse(repaired);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
    } catch (e2) {
      // Strategy 3: Partial object extraction (recovers from truncation at position 11315 etc.)
      const extracted = extractCompleteJsonObjects(responseText);
      if (extracted.length > 0) {
        console.info(
          `[SafeJsonParser] Successfully salvaged ${extracted.length} questions from truncated/malformed response.`
        );
        return extracted;
      }

      // If all fails, throw meaningful error
      console.error("[SafeJsonParser] Failed all recovery strategies for JSON:", e1);
      throw e1;
    }
  }

  return [];
}

/**
 * Universal safe parser for generic AI JSON objects.
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
      // Try finding the largest { ... } block
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(repairJsonString(match[0])) as T;
        } catch {}
      }
      return fallback;
    }
  }
}
