"use client";

import { NormalizedQuizQuestion } from "../types";

export interface ArchetypeComponentProps {
  question: NormalizedQuizQuestion;
  questionIndex?: number;
  totalQuestions?: number;
  selectedAnswer: any;
  onSelectAnswer: (answer: any) => void;
  isConfirmed?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
  accentColor?: string;
  borderColor?: string;
  bgGradient?: string;
  bgClass?: string;
  glowColor?: string;
  pillowBg?: string;
  accentBubble?: string;
  ribbonColor?: string;
  trayBorder?: string;
  headerBar?: string;
  ringGradient?: string;
  branchColor?: string;
  techColor?: string;
}

/**
 * Bulletproof option matching helper
 * Normalizes index, letter, Bangla letter/digit, option ID, and full option text
 */
export function isOptionMatch(optionValue: any, optionIndex: number, targetAnswer: any): boolean {
  if (targetAnswer === undefined || targetAnswer === null) return false;

  // Unwrap object payload if needed
  let target = targetAnswer;
  if (typeof target === "object") {
    if (target.selectedOptionId !== undefined) target = target.selectedOptionId;
    else if (target.id !== undefined) target = target.id;
    else if (target.text !== undefined) target = target.text;
    else if (target.answer !== undefined) target = target.answer;
    else if (target.value !== undefined) target = target.value;
  }

  // Extract clean text from optionValue
  const optText =
    typeof optionValue === "string"
      ? optionValue
      : optionValue && typeof optionValue === "object"
      ? optionValue.text || optionValue.id || String(optionValue)
      : String(optionValue ?? "");

  const trimmedOpt = String(optText).trim().toLowerCase();

  // 1) Explicit numeric match
  if (typeof target === "number") {
    return target === optionIndex;
  }

  const strTarget = String(target).trim().toLowerCase();

  // 2) String representation of numeric index ("0", "1", ...)
  if (strTarget === String(optionIndex)) {
    return true;
  }

  // 3) Normalized trimmed string match with option text
  if (trimmedOpt && trimmedOpt === strTarget) {
    return true;
  }

  // 4) Option ID format: opt_0, opt_1, option_0
  if (strTarget === `opt_${optionIndex}` || strTarget === `option_${optionIndex}`) {
    return true;
  }

  // 5) Letter match A, B, C, D (where A=0, B=1, C=2, D=3...)
  const letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
  if (optionIndex < letters.length && strTarget === letters[optionIndex]) {
    return true;
  }

  // 6) Bangla letter match: ক=0, খ=1, গ=2, ঘ=3, ঙ=4, চ=5
  const banglaLetters = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];
  if (optionIndex < banglaLetters.length && strTarget === banglaLetters[optionIndex]) {
    return true;
  }

  // 7) Bangla digit match: ০=0, ১=1, ২=2, ৩=3, ৪=4, ৫=5
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫"];
  if (optionIndex < banglaDigits.length && strTarget === banglaDigits[optionIndex]) {
    return true;
  }

  return false;
}

export function isOptSelected(selectedAnswer: any, optIndex: number, optText?: string): boolean {
  return isOptionMatch(optText, optIndex, selectedAnswer);
}

export function isOptCorrect(
  correctTarget: any,
  optIndex: number,
  optText?: string,
  rawCorrectAnswer?: any
): boolean {
  if (isOptionMatch(optText, optIndex, correctTarget)) return true;
  if (rawCorrectAnswer !== undefined && isOptionMatch(optText, optIndex, rawCorrectAnswer)) return true;
  return false;
}

export interface UniversalOptionFeedback {
  containerStyle: string;
  badgeStyle: string;
  statusIcon: "correct" | "incorrect" | "selected" | null;
}

/**
 * Universal Answer State Styling Helper (Task 1 & Task 4)
 * Strict 3-State Option Styling Rule upon submission:
 * 1. isThisOptionCorrect -> EMERALD GREEN (!bg-emerald-500/20 ...) with checkmark badge
 * 2. isSelectedByStudent && !isThisOptionCorrect -> ONLY if student clicked this specific option AND it is wrong -> ROSE RED
 * 3. Unselected Other Options -> NEUTRAL & DIMMED (opacity-50 grayscale-[30%] ...). NEVER RED!
 */
export function getUniversalOptionFeedback(
  isSelected: boolean,
  isConfirmed: boolean | undefined,
  isCorrectAnswer: boolean
): UniversalOptionFeedback {
  if (isConfirmed) {
    // State 1: True correct option -> High-contrast Emerald Green
    if (isCorrectAnswer) {
      return {
        containerStyle:
          "!bg-emerald-500/20 dark:!bg-emerald-500/30 !border-emerald-500 !text-emerald-950 dark:!text-emerald-100 ring-2 ring-emerald-500 shadow-md",
        badgeStyle: "!bg-emerald-500 !text-white !border-emerald-500",
        statusIcon: "correct",
      };
    }

    // State 2: ONLY if student explicitly selected THIS option AND it is wrong -> Rose Red
    if (isSelected && !isCorrectAnswer) {
      return {
        containerStyle:
          "!bg-rose-500/20 dark:!bg-rose-500/30 !border-rose-500 !text-rose-950 dark:!text-rose-100 ring-2 ring-rose-500 shadow-md",
        badgeStyle: "!bg-rose-500 !text-white !border-rose-500",
        statusIcon: "incorrect",
      };
    }

    // State 3: Unselected other options -> NEUTRAL & DIMMED (NEVER RED!)
    return {
      containerStyle:
        "opacity-50 grayscale-[30%] cursor-not-allowed border-slate-300 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400",
      badgeStyle: "opacity-60 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
      statusIcon: null,
    };
  }

  // Pre-submission: Active/Selected option state
  if (isSelected) {
    return {
      containerStyle:
        "!bg-indigo-500/15 dark:!bg-indigo-500/25 !border-indigo-500 !text-slate-900 dark:!text-white ring-2 ring-indigo-400 shadow-sm",
      badgeStyle: "!bg-indigo-600 !text-white !border-indigo-500",
      statusIcon: "selected",
    };
  }

  // Pre-submission: Default unselected state
  return {
    containerStyle: "",
    badgeStyle: "",
    statusIcon: null,
  };
}

// Re-export ArchetypeSkeleton from its dedicated TSX component file
export { ArchetypeSkeleton } from "./ArchetypeSkeleton";
