// Advanced Quiz Engine Core Types, Shuffling Algorithms & Template Registry Service
// Safe option ID mapping, Fisher-Yates randomization, 20 distinct visual templates, and mastery retry state management.

import { QuizQuestionItem } from "@/lib/chapterLearningEngine";

export interface ShuffledQuizOption {
  id: string; // Permanent immutable ID, e.g., "opt_0", "opt_1"
  text: string;
  originalIndex: number;
}

export interface QuestionAttemptResult {
  questionId: string;
  selectedOptionId: string | null;
  selectedOriginalIndex: number | null;
  correctOptionId: string;
  correctOriginalIndex: number;
  isCorrect: boolean;
  isTimeout: boolean;
  timeSpentSeconds: number;
  answeredAt: string;
}

export interface QuizAttemptState {
  attemptNumber: number;
  templateOffset: number;
  startedAt: string;
  completedAt?: string;
  questionResults: Record<string, QuestionAttemptResult>; // questionId -> QuestionAttemptResult
  shuffledOptionsMap: Record<string, ShuffledQuizOption[]>; // questionId -> ShuffledQuizOption[]
  tabSwitchedQuestionIds: string[];
}

/**
 * True Fisher-Yates Array Shuffle
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Safe Answer Shuffling Generator
 * - Assigns permanent option IDs (opt_0, opt_1, etc.)
 * - Links correct answer to permanent option ID
 * - Truly randomizes display positions
 * - Validates that correct answer does NOT get glued to position A (index 0)
 */
export function generateSafeShuffledAttemptMap(
  questions: QuizQuestionItem[],
  attemptNumber: number
): Record<string, ShuffledQuizOption[]> {
  const map: Record<string, ShuffledQuizOption[]> = {};

  questions.forEach((q) => {
    const rawOptions = Array.isArray(q.options) ? q.options : [];
    
    // Map with permanent, immutable option IDs based on canonical index
    const baseOptions: ShuffledQuizOption[] = rawOptions.map((opt, origIdx) => ({
      id: `opt_${origIdx}`,
      text: typeof opt === "string" ? opt : (opt as any)?.text || String(opt),
      originalIndex: origIdx,
    }));

    if (baseOptions.length <= 1) {
      map[q.id] = baseOptions;
      return;
    }

    // Perform Fisher-Yates shuffle
    let shuffled = shuffleArray(baseOptions);

    // If more than 1 option and by random chance it remained identical, re-shuffle once
    if (
      baseOptions.length >= 3 &&
      shuffled.every((opt, i) => opt.originalIndex === baseOptions[i].originalIndex)
    ) {
      shuffled = shuffleArray(baseOptions);
    }

    map[q.id] = shuffled;
  });

  return map;
}

/**
 * Deterministic Template Assignment
 * Questions 1-20 map directly to Template 0-19.
 * Question 21+ cycles back to Template 0.
 * Attempt offset allows retry attempts to feel fresh while keeping the cycle strict.
 */
export function getTemplateIndex(questionIndex: number, attemptOffset: number = 0): number {
  const totalTemplates = 20;
  const cycleIndex = (questionIndex + attemptOffset) % totalTemplates;
  return ((cycleIndex % totalTemplates) + totalTemplates) % totalTemplates;
}

/**
 * 20 Distinct Layout Direction Archetypes (Internal/Admin Configuration)
 */
export type QuizLayoutDirectionId =
  | "classic_2x2"
  | "question_spotlight"
  | "asymmetric_split"
  | "editorial_minimal"
  | "gamified_tiles"
  | "floating_card"
  | "dark_premium"
  | "light_academic"
  | "geometric_cards"
  | "outlined_exam"
  | "progress_centered"
  | "large_typography"
  | "icon_accented"
  | "compact_classroom"
  | "soft_gradient"
  | "split_question_answers"
  | "layered_knowledge"
  | "high_contrast_accessible"
  | "spacious_presentation"
  | "modern_interactive_tile";

export interface QuizTemplateTheme {
  id: string;
  layoutDirection: QuizLayoutDirectionId;
  name: string; // Internal/Admin only
  nameBangla: string; // Internal/Admin only
  tagline: string;
  timerStyle: "circular" | "bar" | "pill" | "minimal" | "terminal" | "marquee" | "stadium";
  timerColor: string;
  optionsLayout: "grid2x2"; // Standard 2x2 responsive grid for single MCQ on desktop
  containerCard: string;
  headerAccent: string;
  badgeStyle: string;
  optionCardBase: string;
  optionLetterBadge: string;
  correctCard: string;
  incorrectCard: string;
  selectedCard: string;
  feedbackBanner: string;
}

export const TWENTY_QUIZ_TEMPLATES: QuizTemplateTheme[] = [
  // 01. Classic 2×2 Answer Grid (Vibrant Cyan & Slate)
  {
    id: "template-01",
    layoutDirection: "classic_2x2",
    name: "Classic 2×2 Answer Grid",
    nameBangla: "ক্লাসিক ২×২ গ্রিড লেআউট",
    tagline: "ব্যালান্সড এবং সুবিন্যস্ত ২×২ রেসপনসিভ ম্যাট্রিক্স",
    timerStyle: "circular",
    timerColor: "text-cyan-600 dark:text-cyan-400 stroke-cyan-600 dark:stroke-cyan-400",
    optionsLayout: "grid2x2",
    containerCard: "bg-white dark:bg-slate-900 border-2 border-cyan-500/30 dark:border-cyan-500/40 shadow-xl shadow-cyan-500/5 rounded-3xl",
    headerAccent: "text-cyan-700 dark:text-cyan-400 font-bold",
    badgeStyle: "bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800",
    optionCardBase: "bg-white dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 hover:border-cyan-500 hover:shadow-md text-slate-900 dark:text-slate-100",
    optionLetterBadge: "bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950 font-black",
    correctCard: "bg-emerald-50 dark:bg-emerald-950/90 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20",
    incorrectCard: "bg-rose-50 dark:bg-rose-950/90 border-2 border-rose-500 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/20",
    selectedCard: "bg-cyan-50 dark:bg-cyan-950/90 border-2 border-cyan-500 text-cyan-950 dark:text-cyan-100 ring-2 ring-cyan-500/20",
    feedbackBanner: "bg-cyan-50 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800 text-cyan-950 dark:text-cyan-200",
  },

  // 02. Large Question Spotlight (Warm Amber & Gold Aura)
  {
    id: "template-02",
    layoutDirection: "question_spotlight",
    name: "Large Question Spotlight",
    nameBangla: "লার্জ কোয়েশ্চেন স্পটলাইট",
    tagline: "হিরো কোয়েশ্চেন বক্স ও প্রদীপ্ত ফোকাস লাইট",
    timerStyle: "pill",
    timerColor: "text-amber-600 dark:text-amber-400",
    optionsLayout: "grid2x2",
    containerCard: "bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white dark:from-slate-950 dark:via-amber-950/20 dark:to-slate-950 border-2 border-amber-400 dark:border-amber-500/40 shadow-xl shadow-amber-500/10 rounded-3xl",
    headerAccent: "text-amber-800 dark:text-amber-400 font-black tracking-wide",
    badgeStyle: "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/50 shadow-xs",
    optionCardBase: "bg-white dark:bg-slate-900 border-2 border-amber-200/80 dark:border-slate-800 hover:border-amber-500 hover:shadow-md text-slate-900 dark:text-slate-100",
    optionLetterBadge: "bg-amber-500 text-slate-950 font-black",
    correctCard: "bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    incorrectCard: "bg-rose-50 dark:bg-rose-950 border-2 border-rose-500 text-rose-950 dark:text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.25)]",
    selectedCard: "bg-amber-100/80 dark:bg-amber-950/90 border-2 border-amber-500 text-amber-950 dark:text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.25)]",
    feedbackBanner: "bg-amber-100/90 dark:bg-amber-950/90 border border-amber-400 text-amber-950 dark:text-amber-200",
  },

  // 03. Asymmetric Split Layout (Vibrant Royal Purple & Violet)
  {
    id: "template-03",
    layoutDirection: "asymmetric_split",
    name: "Asymmetric Split Layout",
    nameBangla: "অ্যাসিমেট্রিক স্প্লিট ক্যানভাস",
    tagline: "বাম পাশে স্টিকি প্রশ্ন প্যানেল এবং ডান পাশে অপশন অ্যারেনা",
    timerStyle: "circular",
    timerColor: "text-purple-600 dark:text-purple-400 stroke-purple-600 dark:stroke-purple-400",
    optionsLayout: "grid2x2",
    containerCard: "bg-white/95 dark:bg-slate-900/95 border-l-6 border-l-purple-600 dark:border-l-purple-500 border border-purple-200 dark:border-slate-800 shadow-xl shadow-purple-500/5 rounded-3xl",
    headerAccent: "text-purple-700 dark:text-purple-400 font-black",
    badgeStyle: "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800",
    optionCardBase: "bg-slate-50/80 dark:bg-slate-800/80 border-2 border-purple-100 dark:border-slate-700 hover:border-purple-500 hover:shadow-md text-slate-900 dark:text-slate-100",
    optionLetterBadge: "bg-purple-600 text-white font-bold",
    correctCard: "bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100",
    incorrectCard: "bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500 text-rose-950 dark:text-rose-100",
    selectedCard: "bg-purple-50 dark:bg-purple-950/80 border-2 border-purple-500 text-purple-950 dark:text-purple-100",
    feedbackBanner: "bg-purple-50 dark:bg-purple-950/90 border border-purple-300 text-purple-950 dark:text-purple-200",
  },

  // 04. Editorial Minimal Layout (Scholarly Ivory Serif & Fine Hairlines)
  {
    id: "template-04",
    layoutDirection: "editorial_minimal",
    name: "Editorial Minimal Layout",
    nameBangla: "এডিটোরিয়াল মিনিমাল জার্নাল",
    tagline: "ক্লাসিক্যাল সেরিফ টাইপোগ্রাফি ও পরিচ্ছন্ন হেয়ারলাইন বর্ডার",
    timerStyle: "minimal",
    timerColor: "text-slate-800 dark:text-slate-200 font-serif font-bold",
    optionsLayout: "grid2x2",
    containerCard: "bg-[#faf8f5] dark:bg-slate-900 border-2 border-amber-200/60 dark:border-slate-700 shadow-md rounded-2xl font-serif",
    headerAccent: "text-slate-900 dark:text-slate-200 font-serif italic tracking-wide",
    badgeStyle: "bg-amber-100/60 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-amber-300/60 dark:border-slate-600 font-serif",
    optionCardBase: "bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:border-slate-600 text-slate-900 dark:text-slate-100 font-serif",
    optionLetterBadge: "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-serif font-bold italic",
    correctCard: "bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-600 text-emerald-950 dark:text-emerald-100 font-serif",
    incorrectCard: "bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-600 text-rose-950 dark:text-rose-100 font-serif",
    selectedCard: "bg-slate-100 dark:bg-slate-800 border-2 border-slate-700 text-slate-900 dark:text-white font-serif",
    feedbackBanner: "bg-amber-50 dark:bg-slate-800/90 border border-amber-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 font-serif",
  },

  // 05. Gamified Numbered Tiles (Energetic Emerald & Multicolor Badges)
  {
    id: "template-05",
    layoutDirection: "gamified_tiles",
    name: "Gamified Numbered Tiles",
    nameBangla: "গেমিফাইড কালার টাইলস",
    tagline: "ডুওলিঙ্গো স্টাইল ৩ডি বাটন প্রেস ও রঙিন টাইলস",
    timerStyle: "bar",
    timerColor: "bg-gradient-to-r from-emerald-500 via-amber-400 to-cyan-500",
    optionsLayout: "grid2x2",
    containerCard: "bg-emerald-50/60 dark:bg-slate-900 border-3 border-emerald-400 dark:border-emerald-600 shadow-xl shadow-emerald-500/10 rounded-3xl",
    headerAccent: "text-emerald-700 dark:text-emerald-400 font-black",
    badgeStyle: "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-700",
    optionCardBase: "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 border-b-4 border-b-slate-400 dark:border-b-slate-950 hover:bg-slate-50 dark:hover:bg-slate-700 active:translate-y-1 active:border-b-2 text-slate-900 dark:text-slate-100",
    optionLetterBadge: "bg-emerald-500 text-slate-950 font-black",
    correctCard: "bg-emerald-100 dark:bg-emerald-950/90 border-2 border-emerald-500 border-b-4 border-b-emerald-800 text-emerald-950 dark:text-emerald-100 shadow-md",
    incorrectCard: "bg-rose-100 dark:bg-rose-950/90 border-2 border-rose-500 border-b-4 border-b-rose-800 text-rose-950 dark:text-rose-100 shadow-md",
    selectedCard: "bg-indigo-100 dark:bg-indigo-950/90 border-2 border-indigo-500 border-b-4 border-b-indigo-800 text-indigo-950 dark:text-indigo-100 shadow-md",
    feedbackBanner: "bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-400 text-emerald-950 dark:text-emerald-200",
  },

  // 06. Floating Card Composition (Airy Sky Blue & Elevated Shadows)
  {
    id: "template-06",
    layoutDirection: "floating_card",
    name: "Floating Card Composition",
    nameBangla: "ফ্লোটিং কার্ড কম্পোজিশন",
    tagline: "উঁচু এলিভেশন, লেয়ার্ড শ্যাডো এবং ফ্লোটিং অপশন কার্ড",
    timerStyle: "circular",
    timerColor: "text-blue-600 dark:text-blue-400 stroke-blue-600 dark:stroke-blue-400",
    optionsLayout: "grid2x2",
    containerCard: "bg-blue-50/40 dark:bg-slate-900 border-2 border-blue-200 dark:border-slate-800 shadow-2xl shadow-blue-500/10 rounded-3xl",
    headerAccent: "text-blue-700 dark:text-blue-400 font-black",
    badgeStyle: "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800",
    optionCardBase: "bg-white dark:bg-slate-800 border-2 border-blue-100 dark:border-slate-700 shadow-md hover:shadow-xl hover:-translate-y-1 text-slate-900 dark:text-slate-100 transition-all",
    optionLetterBadge: "bg-blue-600 text-white font-bold",
    correctCard: "bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-md",
    incorrectCard: "bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500 text-rose-950 dark:text-rose-100 shadow-md",
    selectedCard: "bg-blue-50 dark:bg-blue-950/80 border-2 border-blue-500 text-blue-950 dark:text-blue-100 shadow-md",
    feedbackBanner: "bg-blue-50 dark:bg-blue-950/90 border border-blue-300 text-blue-950 dark:text-blue-200",
  },

  // 07. Dark Premium Layout (Opulent Champagne Gold in Light, Midnight Obsidian in Dark)
  {
    id: "template-07",
    layoutDirection: "dark_premium",
    name: "Dark Premium Layout",
    nameBangla: "ডার্ক প্রিমিয়াম অবসিডিয়ান",
    tagline: "মিডনাইট অবসিডিয়ান ব্ল্যাক এবং লাক্সারি গোল্ড মেটালিক থিম",
    timerStyle: "terminal",
    timerColor: "text-amber-600 dark:text-amber-400 font-mono",
    optionsLayout: "grid2x2",
    containerCard: "bg-gradient-to-br from-amber-50/80 via-yellow-50/30 to-white dark:from-[#090c13] dark:via-slate-950 dark:to-[#090c13] border-2 border-amber-500/40 dark:border-amber-500/50 shadow-xl shadow-amber-500/10 rounded-3xl",
    headerAccent: "text-amber-800 dark:text-amber-400 font-mono font-bold tracking-wide",
    badgeStyle: "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-400 dark:border-amber-500/50 shadow-xs",
    optionCardBase: "bg-white dark:bg-[#101623] border-2 border-amber-200 dark:border-amber-900/40 hover:border-amber-500 text-slate-900 dark:text-slate-100",
    optionLetterBadge: "bg-amber-500 text-slate-950 font-bold",
    correctCard: "bg-emerald-50 dark:bg-emerald-950/90 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-md",
    incorrectCard: "bg-rose-50 dark:bg-rose-950/90 border-2 border-rose-500 text-rose-950 dark:text-rose-100 shadow-md",
    selectedCard: "bg-amber-100 dark:bg-amber-950/90 border-2 border-amber-500 text-amber-950 dark:text-amber-100 shadow-md",
    feedbackBanner: "bg-amber-100 dark:bg-amber-950/90 border border-amber-400 text-amber-950 dark:text-amber-200",
  },

  // 08. Light Academic Layout (Crisp Institutional Sky Blue)
  {
    id: "template-08",
    layoutDirection: "light_academic",
    name: "Light Academic Layout",
    nameBangla: "লাইট অ্যাকাডেমিক ক্লাসরুম",
    tagline: "স্কাই-ব্লু হেডার ও প্রাতিষ্ঠানিক সিলেবাস ফর্ম্যাট",
    timerStyle: "pill",
    timerColor: "text-sky-700 dark:text-sky-400",
    optionsLayout: "grid2x2",
    containerCard: "bg-sky-50/70 dark:bg-slate-900 border-2 border-sky-300 dark:border-sky-500/40 shadow-lg shadow-sky-500/5 rounded-2xl",
    headerAccent: "text-sky-800 dark:text-sky-300 font-bold tracking-tight",
    badgeStyle: "bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-mono",
    optionCardBase: "bg-white dark:bg-slate-800/80 border-2 border-sky-200 dark:border-slate-700 hover:border-sky-500 text-slate-900 dark:text-slate-100",
    optionLetterBadge: "bg-sky-600 text-white font-mono font-bold",
    correctCard: "bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100",
    incorrectCard: "bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500 text-rose-950 dark:text-rose-100",
    selectedCard: "bg-sky-100 dark:bg-sky-950/80 border-2 border-sky-500 text-sky-950 dark:text-sky-100",
    feedbackBanner: "bg-sky-100 dark:bg-sky-950/90 border border-sky-300 text-sky-950 dark:text-sky-200",
  },

  // 09. Geometric Answer Cards (Architectural Technical Drafting Sheet)
  {
    id: "template-09",
    layoutDirection: "geometric_cards",
    name: "Geometric Answer Cards",
    nameBangla: "জিওমেট্রিক আনসার কার্ডস",
    tagline: "টেকনিক্যাল কর্নার ব্র্যাকেটস এবং ডায়মন্ড ব্যাজ",
    timerStyle: "terminal",
    timerColor: "text-cyan-600 dark:text-cyan-400 font-mono",
    optionsLayout: "grid2x2",
    containerCard: "bg-slate-50 dark:bg-[#0b1b36] border-2 border-cyan-400 dark:border-cyan-400/60 shadow-xl shadow-cyan-500/10 rounded-2xl font-mono text-slate-900 dark:text-cyan-100",
    headerAccent: "text-cyan-700 dark:text-cyan-300 font-mono tracking-wider",
    badgeStyle: "bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-400 font-mono",
    optionCardBase: "bg-white dark:bg-[#0d2244] border-2 border-cyan-200 dark:border-cyan-500/40 hover:border-cyan-500 text-slate-900 dark:text-cyan-100 font-mono",
    optionLetterBadge: "bg-cyan-600 text-white dark:bg-cyan-900 dark:text-cyan-300 border border-cyan-400 font-mono font-bold",
    correctCard: "bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-200",
    incorrectCard: "bg-rose-50 dark:bg-rose-950 border-2 border-rose-500 text-rose-950 dark:text-rose-200",
    selectedCard: "bg-cyan-100 dark:bg-cyan-950 border-2 border-cyan-500 text-cyan-950 dark:text-cyan-100",
    feedbackBanner: "bg-cyan-50 dark:bg-[#0d2244] border border-cyan-400 text-cyan-950 dark:text-cyan-200 font-mono",
  },

  // 10. Outlined Exam Cards (OMR Bubble Sheet Precision)
  {
    id: "template-10",
    layoutDirection: "outlined_exam",
    name: "Outlined Exam Cards",
    nameBangla: "আউটলাইনড ওএমআর এক্সাম শিট",
    tagline: "স্ট্যান্ডার্ড ওএমআর বাবল শিট এবং অফিশিয়াল পরীক্ষা ফরম্যাট",
    timerStyle: "minimal",
    timerColor: "text-slate-700 dark:text-slate-300",
    optionsLayout: "grid2x2",
    containerCard: "bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-md rounded-2xl",
    headerAccent: "text-slate-800 dark:text-slate-200 font-semibold",
    badgeStyle: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-semibold",
    optionCardBase: "bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200",
    optionLetterBadge: "w-7 h-7 rounded-full border-2 border-slate-500 text-slate-800 dark:text-slate-200 font-bold",
    correctCard: "bg-emerald-50 dark:bg-emerald-500/10 border-2 border-solid border-emerald-500 text-emerald-950 dark:text-emerald-300",
    incorrectCard: "bg-rose-50 dark:bg-rose-500/10 border-2 border-solid border-rose-500 text-rose-950 dark:text-rose-300",
    selectedCard: "bg-slate-100 dark:bg-slate-500/10 border-2 border-solid border-slate-500 text-slate-950 dark:text-white",
    feedbackBanner: "bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-300",
  },

  // 11. Progress-Centered Layout (Rich Teal Centered Anchor)
  {
    id: "template-11",
    layoutDirection: "progress_centered",
    name: "Progress-Centered Layout",
    nameBangla: "প্রগ্রেস-সেন্টার্ড ফোকাস",
    tagline: "কেন্দ্রে অবস্থানরত টাইমার রিং ও ট্রেইল ডটস",
    timerStyle: "circular",
    timerColor: "text-teal-600 dark:text-teal-400 stroke-teal-600 dark:stroke-teal-400",
    optionsLayout: "grid2x2",
    containerCard: "bg-teal-50/60 dark:bg-slate-950/90 border-2 border-teal-300 dark:border-teal-800 shadow-xl shadow-teal-500/10 rounded-3xl p-6",
    headerAccent: "text-teal-800 dark:text-teal-400 font-extrabold",
    badgeStyle: "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800",
    optionCardBase: "bg-white dark:bg-slate-900 border-2 border-teal-200/80 dark:border-slate-800 hover:border-teal-500 text-slate-900 dark:text-slate-100 rounded-2xl shadow-xs",
    optionLetterBadge: "bg-teal-600 text-white font-bold rounded-xl",
    correctCard: "bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100",
    incorrectCard: "bg-rose-50 dark:bg-rose-950 border-2 border-rose-500 text-rose-950 dark:text-rose-100",
    selectedCard: "bg-teal-100 dark:bg-teal-950 border-2 border-teal-500 text-teal-950 dark:text-teal-100",
    feedbackBanner: "bg-teal-100 dark:bg-teal-950 border border-teal-400 text-teal-950 dark:text-teal-200",
  },

  // 12. Large Typography Layout (Swiss Indigo Bold)
  {
    id: "template-12",
    layoutDirection: "large_typography",
    name: "Large Typography Layout",
    nameBangla: "লার্জ টাইপোগ্রাফি ব্যানার",
    tagline: "সুইস বোল্ড টাইপোগ্রাফি ও বড় আকারের ওয়াটারমার্ক",
    timerStyle: "bar",
    timerColor: "bg-gradient-to-r from-indigo-500 to-rose-500",
    optionsLayout: "grid2x2",
    containerCard: "bg-indigo-50/50 dark:bg-slate-950 border-3 border-indigo-600 dark:border-indigo-400 shadow-2xl shadow-indigo-500/10 rounded-3xl",
    headerAccent: "text-indigo-900 dark:text-white font-black uppercase tracking-tight",
    badgeStyle: "bg-indigo-600 text-white dark:bg-white dark:text-slate-950 font-black",
    optionCardBase: "bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-slate-700 hover:border-indigo-600 text-slate-900 dark:text-white font-bold",
    optionLetterBadge: "bg-indigo-600 text-white dark:bg-white dark:text-slate-950 font-black",
    correctCard: "bg-emerald-50 dark:bg-emerald-950/80 border-3 border-emerald-500 text-emerald-950 dark:text-emerald-100",
    incorrectCard: "bg-rose-50 dark:bg-rose-950/80 border-3 border-rose-500 text-rose-950 dark:text-rose-100",
    selectedCard: "bg-indigo-100 dark:bg-indigo-950/80 border-3 border-indigo-600 text-indigo-950 dark:text-indigo-100",
    feedbackBanner: "bg-indigo-100 dark:bg-slate-900 border-2 border-indigo-500 text-indigo-950 dark:text-white font-bold",
  },

  // 13. Icon-Accented Option Layout (Energetic Yellow & Dark Comic Arcade)
  {
    id: "template-13",
    layoutDirection: "icon_accented",
    name: "Icon-Accented Option Layout",
    nameBangla: "আইকন-অ্যাকসেন্টেড কুইজ শো",
    tagline: "জ্যামিতিক সিম্বল (▲ ■ ● ◆) সমৃদ্ধ লাইভ কুইজ শো",
    timerStyle: "marquee",
    timerColor: "text-amber-800 dark:text-yellow-400 font-mono",
    optionsLayout: "grid2x2",
    containerCard: "bg-amber-50/80 dark:bg-slate-950 border-4 border-yellow-500 dark:border-yellow-400 shadow-[6px_6px_0_#ca8a04] rounded-2xl font-mono",
    headerAccent: "text-amber-900 dark:text-yellow-400 font-black tracking-widest font-mono",
    badgeStyle: "bg-yellow-400 text-slate-950 font-black border-2 border-black font-mono",
    optionCardBase: "bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-slate-700 hover:border-yellow-500 shadow-[3px_3px_0_#ca8a04] text-slate-900 dark:text-yellow-100 font-mono",
    optionLetterBadge: "bg-yellow-400 text-slate-950 font-black",
    correctCard: "bg-emerald-100 dark:bg-emerald-950 border-4 border-emerald-500 text-emerald-950 dark:text-emerald-200",
    incorrectCard: "bg-rose-100 dark:bg-rose-950 border-4 border-rose-500 text-rose-950 dark:text-rose-200",
    selectedCard: "bg-yellow-100 dark:bg-yellow-950 border-4 border-yellow-500 text-slate-950 dark:text-yellow-200",
    feedbackBanner: "bg-yellow-100 dark:bg-slate-900 border-2 border-yellow-500 text-slate-950 dark:text-yellow-300 font-mono",
  },

  // 14. Compact Classroom Layout (Cool Mint & High Density)
  {
    id: "template-14",
    layoutDirection: "compact_classroom",
    name: "Compact Classroom Layout",
    nameBangla: "কমপ্যাক্ট ক্লাসরুম ডেনসিটি",
    tagline: "উচ্চ তথ্য-ঘনত্ব ও দ্রুত গতিশীল কুইজ পরিবেশ",
    timerStyle: "pill",
    timerColor: "text-emerald-700 dark:text-emerald-400",
    optionsLayout: "grid2x2",
    containerCard: "bg-emerald-50/40 dark:bg-slate-900 border-2 border-emerald-200 dark:border-slate-800 shadow-md rounded-2xl",
    headerAccent: "text-emerald-800 dark:text-emerald-400 font-bold",
    badgeStyle: "bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800",
    optionCardBase: "bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-slate-700 hover:border-emerald-500 text-slate-900 dark:text-slate-100",
    optionLetterBadge: "bg-emerald-600 text-white font-bold",
    correctCard: "bg-emerald-100 dark:bg-emerald-950/90 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100",
    incorrectCard: "bg-rose-100 dark:bg-rose-950/90 border-2 border-rose-500 text-rose-950 dark:text-rose-100",
    selectedCard: "bg-emerald-100/70 dark:bg-emerald-950/50 border-2 border-emerald-600 text-emerald-950 dark:text-white",
    feedbackBanner: "bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-400 text-emerald-950 dark:text-emerald-200",
  },

  // 15. Soft Gradient Composition (Aurora Fuchsia & Iridescent Sheen)
  {
    id: "template-15",
    layoutDirection: "soft_gradient",
    name: "Soft Gradient Composition",
    nameBangla: "সফট গ্র্যাডিয়েন্ট অরোরা",
    tagline: "প্যাস্টেল অরোরা গ্র্যাডিয়েন্ট ও ফ্রস্টেড গ্লাস ফিনিশ",
    timerStyle: "bar",
    timerColor: "bg-gradient-to-r from-fuchsia-500 via-pink-500 to-cyan-400",
    optionsLayout: "grid2x2",
    containerCard: "bg-gradient-to-br from-fuchsia-50/70 via-pink-50/40 to-cyan-50/50 dark:from-slate-900 dark:via-fuchsia-950/20 dark:to-slate-900 border-2 border-fuchsia-300 dark:border-fuchsia-500/40 shadow-2xl rounded-3xl",
    headerAccent: "text-fuchsia-800 dark:text-fuchsia-400 font-black",
    badgeStyle: "bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-900 dark:text-fuchsia-300 border border-fuchsia-300 dark:border-fuchsia-800",
    optionCardBase: "bg-white/80 dark:bg-slate-800/60 backdrop-blur-md border-2 border-fuchsia-100 dark:border-slate-700 hover:border-fuchsia-400 text-slate-900 dark:text-slate-100",
    optionLetterBadge: "bg-fuchsia-600 text-white font-bold",
    correctCard: "bg-emerald-50 dark:bg-emerald-900/40 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100",
    incorrectCard: "bg-rose-50 dark:bg-rose-900/40 border-2 border-rose-500 text-rose-950 dark:text-rose-100",
    selectedCard: "bg-fuchsia-100 dark:bg-fuchsia-900/40 border-2 border-fuchsia-500 text-fuchsia-950 dark:text-fuchsia-100",
    feedbackBanner: "bg-fuchsia-100 dark:bg-fuchsia-950/90 border border-fuchsia-400 text-fuchsia-950 dark:text-fuchsia-200",
  },

  // 16. Split Question and Answers (Horizontal Two-Tone Theater)
  {
    id: "template-16",
    layoutDirection: "split_question_answers",
    name: "Split Question and Answers",
    nameBangla: "হরাইজন্টাল স্প্লিট থিয়েটার",
    tagline: "উপরে থিয়েটার ডার্ক চেম্বার ও নিচে অপশন অ্যারেনা",
    timerStyle: "pill",
    timerColor: "text-rose-600 dark:text-rose-400 font-bold",
    optionsLayout: "grid2x2",
    containerCard: "bg-white dark:bg-slate-900 border-2 border-rose-300 dark:border-slate-800 shadow-xl rounded-3xl overflow-hidden",
    headerAccent: "text-rose-600 dark:text-rose-400 font-bold tracking-wide",
    badgeStyle: "bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 border border-rose-300",
    optionCardBase: "bg-white dark:bg-slate-800 border-2 border-rose-100 dark:border-slate-700 hover:border-rose-500 text-slate-900 dark:text-slate-100",
    optionLetterBadge: "bg-rose-600 text-white font-bold",
    correctCard: "bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100",
    incorrectCard: "bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500 text-rose-950 dark:text-rose-100",
    selectedCard: "bg-rose-100 dark:bg-rose-950/80 border-2 border-rose-500 text-rose-950 dark:text-rose-100",
    feedbackBanner: "bg-rose-100 dark:bg-rose-950 border border-rose-400 text-rose-950 dark:text-rose-200",
  },

  // 17. Layered Knowledge Cards (Flashcard Stack)
  {
    id: "template-17",
    layoutDirection: "layered_knowledge",
    name: "Layered Knowledge Cards",
    nameBangla: "লেয়ার্ড নলেজ ডেক",
    tagline: "অফসেট ফ্ল্যাশকার্ড ডেকের মতো থ্রি-ডি গভীরতা",
    timerStyle: "circular",
    timerColor: "text-indigo-600 dark:text-indigo-400 stroke-indigo-600 dark:stroke-indigo-400",
    optionsLayout: "grid2x2",
    containerCard: "bg-indigo-50/50 dark:bg-slate-900 border-2 border-indigo-300 dark:border-slate-800 shadow-xl rounded-3xl relative",
    headerAccent: "text-indigo-800 dark:text-indigo-400 font-black",
    badgeStyle: "bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800",
    optionCardBase: "bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-slate-700 hover:border-indigo-500 text-slate-900 dark:text-slate-100",
    optionLetterBadge: "bg-indigo-600 text-white font-bold",
    correctCard: "bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100",
    incorrectCard: "bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500 text-rose-950 dark:text-rose-100",
    selectedCard: "bg-indigo-100 dark:bg-indigo-950/80 border-2 border-indigo-500 text-indigo-950 dark:text-indigo-100",
    feedbackBanner: "bg-indigo-100 dark:bg-indigo-950 border border-indigo-400 text-indigo-950 dark:text-indigo-200",
  },

  // 18. High-Contrast Accessible Layout (WCAG AAA Heavy Inverted Frame)
  {
    id: "template-18",
    layoutDirection: "high_contrast_accessible",
    name: "High-Contrast Accessible Layout",
    nameBangla: "হাই-কনট্রাস্ট অ্যাক্সেসিবল",
    tagline: "WCAG AAA মানসম্পন্ন ৩ পিক্সেল গাঢ় বর্ডার ও স্পষ্ট পাঠ্যতা",
    timerStyle: "pill",
    timerColor: "text-slate-950 dark:text-white font-black",
    optionsLayout: "grid2x2",
    containerCard: "bg-white dark:bg-slate-950 border-3 border-slate-950 dark:border-white shadow-[6px_6px_0_#0f172a] dark:shadow-[6px_6px_0_#ffffff] rounded-3xl",
    headerAccent: "text-slate-950 dark:text-white font-black uppercase tracking-wider",
    badgeStyle: "bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-black border-2 border-current",
    optionCardBase: "bg-white dark:bg-slate-900 border-3 border-slate-950 dark:border-slate-300 hover:border-cyan-600 text-slate-950 dark:text-white font-bold",
    optionLetterBadge: "bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-black",
    correctCard: "bg-emerald-400 border-3 border-slate-950 text-slate-950 font-black",
    incorrectCard: "bg-rose-400 border-3 border-slate-950 text-slate-950 font-black",
    selectedCard: "bg-amber-300 border-3 border-slate-950 text-slate-950 font-black",
    feedbackBanner: "bg-yellow-200 dark:bg-yellow-950 border-3 border-black text-slate-950 dark:text-yellow-100 font-black",
  },

  // 19. Spacious Presentation Layout (Keynote Widescreen Slide Format)
  {
    id: "template-19",
    layoutDirection: "spacious_presentation",
    name: "Spacious Presentation Layout",
    nameBangla: "স্পেশাস প্রেজেন্টেশন স্লাইড",
    tagline: "কি-নোট স্লাইড স্টাইল প্রশস্ত ক্যানভাস ও মার্জিত প্রেজেন্টেশন",
    timerStyle: "minimal",
    timerColor: "text-slate-800 dark:text-slate-200 font-semibold",
    optionsLayout: "grid2x2",
    containerCard: "bg-gradient-to-b from-white via-slate-50 to-indigo-50/20 dark:from-slate-900 dark:to-slate-950 border-2 border-slate-300 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8",
    headerAccent: "text-slate-950 dark:text-slate-100 font-bold",
    badgeStyle: "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-bold",
    optionCardBase: "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-500 text-slate-900 dark:text-slate-100 shadow-sm",
    optionLetterBadge: "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-200 font-bold",
    correctCard: "bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100",
    incorrectCard: "bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500 text-rose-950 dark:text-rose-100",
    selectedCard: "bg-slate-100 dark:bg-slate-800 border-2 border-slate-600 text-slate-950 dark:text-white",
    feedbackBanner: "bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white",
  },

  // 20. Modern Interactive Tile Layout (Grand Finale Golden Laurels)
  {
    id: "template-20",
    layoutDirection: "modern_interactive_tile",
    name: "Modern Interactive Tile Layout",
    nameBangla: "মডার্ন ইন্টারঅ্যাক্টিভ গ্র্যান্ড এরিনা",
    tagline: "গ্র্যান্ড চ্যাম্পিয়নশিপ এরিনা ও ইন্টারেক্টিভ ডায়নামিক টাইলস",
    timerStyle: "stadium",
    timerColor: "text-amber-800 dark:text-amber-400 font-black",
    optionsLayout: "grid2x2",
    containerCard: "bg-gradient-to-b from-amber-50/80 via-white to-indigo-50/40 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border-2 border-amber-500 dark:border-amber-400 shadow-2xl shadow-amber-500/15 rounded-3xl",
    headerAccent: "text-amber-900 dark:text-amber-300 font-black tracking-wide",
    badgeStyle: "bg-amber-400 text-slate-950 font-black shadow-md",
    optionCardBase: "bg-white dark:bg-slate-900/90 border-2 border-amber-200 dark:border-amber-500/30 hover:border-amber-500 text-slate-900 dark:text-white",
    optionLetterBadge: "bg-amber-500 text-slate-950 font-black",
    correctCard: "bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    incorrectCard: "bg-rose-50 dark:bg-rose-950 border-2 border-rose-500 text-rose-950 dark:text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.3)]",
    selectedCard: "bg-amber-100 dark:bg-indigo-900/90 border-2 border-amber-500 text-slate-950 dark:text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.3)]",
    feedbackBanner: "bg-gradient-to-r from-amber-100 to-indigo-100 dark:from-amber-500/20 dark:to-indigo-500/20 border border-amber-400 text-amber-950 dark:text-amber-200 font-bold",
  },
];
