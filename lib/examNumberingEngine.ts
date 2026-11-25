/**
 * Advanced Examination Numbering Engine
 * Provides authentic Bengali and English numbering presets, hierarchical nested numbering,
 * conflict prevention, and custom numbering override retention.
 */

import { ExamNumberingSystem } from "./examPaperEngine";

export const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
export const BENGALI_ALPHABET = [
  "ক", "খ", "গ", "ঘ", "ঙ", "চ", "ছ", "জ", "ঝ", "ঞ",
  "ট", "ঠ", "ড", "ঢ", "ণ", "ত", "থ", "দ", "ধ", "ন",
  "প", "ফ", "ব", "ভ", "ম", "য", "র", "ল", "শ", "ষ", "স", "হ"
];

export const ROMAN_NUMERALS_LOWER = [
  "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x",
  "xi", "xii", "xiii", "xiv", "xv", "xvi", "xvii", "xviii", "xix", "xx"
];

export const ROMAN_NUMERALS_UPPER = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"
];

export const ENGLISH_ALPHABET = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
];

/**
 * Converts any number to Bengali string
 */
export function toBengaliNumberString(num: number): string {
  return num
    .toString()
    .split("")
    .map((char) => {
      const n = parseInt(char, 10);
      return !isNaN(n) ? BENGALI_DIGITS[n] : char;
    })
    .join("");
}

/**
 * Generates badge label for index (0-based) based on the specified numbering system
 */
export function formatIndexToBadge(
  index: number,
  system: ExamNumberingSystem,
  customOverride?: string
): string {
  if (customOverride && customOverride.trim() !== "") {
    return customOverride.trim();
  }

  const oneBased = index + 1;

  switch (system) {
    case "BN_NUM":
      return `${toBengaliNumberString(oneBased)}।`;
    case "BN_NUM_PAREN":
      return `(${toBengaliNumberString(oneBased)})`;
    case "BN_ALPHA": {
      const letter = BENGALI_ALPHABET[index % BENGALI_ALPHABET.length];
      return `${letter}।`;
    }
    case "BN_ALPHA_PAREN": {
      const letter = BENGALI_ALPHABET[index % BENGALI_ALPHABET.length];
      return `(${letter})`;
    }
    case "ROMAN_LOWER": {
      const roman = ROMAN_NUMERALS_LOWER[index % ROMAN_NUMERALS_LOWER.length] || `${oneBased}`;
      return `${roman}.`;
    }
    case "ROMAN_UPPER": {
      const roman = ROMAN_NUMERALS_UPPER[index % ROMAN_NUMERALS_UPPER.length] || `${oneBased}`;
      return `${roman}.`;
    }
    case "EN_ALPHA": {
      const letter = ENGLISH_ALPHABET[index % ENGLISH_ALPHABET.length];
      return `${letter}.`;
    }
    case "EN_ALPHA_PAREN": {
      const letter = ENGLISH_ALPHABET[index % ENGLISH_ALPHABET.length];
      return `(${letter})`;
    }
    case "EN_NUM":
      return `${oneBased}.`;
    case "EN_NUM_PAREN":
      return `(${oneBased})`;
    default:
      return `${oneBased}।`;
  }
}

/**
 * Conflict Prevention Algorithm
 * Ensures questions and their choices/subquestions never use ambiguous identical numbering styles.
 */
export function resolveSafeOptionNumbering(
  questionSystem: ExamNumberingSystem,
  preferredOptionSystem: ExamNumberingSystem
): ExamNumberingSystem {
  // If questions use Bengali alphabet (ক, খ...), options must NOT use Bengali alphabet!
  if (questionSystem === "BN_ALPHA" || questionSystem === "BN_ALPHA_PAREN") {
    if (preferredOptionSystem === "BN_ALPHA" || preferredOptionSystem === "BN_ALPHA_PAREN") {
      return "ROMAN_LOWER";
    }
  }

  // If questions use Bengali numbers (১, ২...), options ideally use Bengali alphabet with parentheses
  if (questionSystem === "BN_NUM" || questionSystem === "BN_NUM_PAREN") {
    if (preferredOptionSystem === "BN_NUM" || preferredOptionSystem === "BN_NUM_PAREN") {
      return "BN_ALPHA_PAREN";
    }
  }

  // If questions use English letters (A, B...), options must NOT use English letters
  if (questionSystem === "EN_ALPHA" || questionSystem === "EN_ALPHA_PAREN") {
    if (preferredOptionSystem === "EN_ALPHA" || preferredOptionSystem === "EN_ALPHA_PAREN") {
      return "ROMAN_LOWER";
    }
  }

  return preferredOptionSystem;
}

/**
 * Hierarchical Nested Numbering Formatter
 * Generates structured labels like:
 * ১। (Level 1)
 *   ক। (Level 2)
 *     i. (Level 3)
 */
export function getNestedNumberLabel(
  level: number,
  index: number,
  customOverride?: string
): string {
  if (customOverride && customOverride.trim() !== "") {
    return customOverride.trim();
  }

  if (level === 0) {
    return formatIndexToBadge(index, "BN_NUM");
  } else if (level === 1) {
    return formatIndexToBadge(index, "BN_ALPHA");
  } else {
    return formatIndexToBadge(index, "ROMAN_LOWER");
  }
}

