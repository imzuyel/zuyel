/**
 * Professional Question Bank Engine
 * Manages institutional question repository, categorization, search, filtering,
 * duplicate detection, snapshots, and persistent storage.
 */

import { QuestionType, QuestionNode } from "./examPaperEngine";

export interface QuestionBankItem {
  id: string;
  questionType: QuestionType;
  questionText: string;
  options?: string[];
  correctAnswer?: string | number | string[];
  explanation?: string;
  marks: number;
  negativeMarks?: number;
  className: string;
  classId?: string;
  tradeName: string;
  tradeId?: string;
  subjectName: string;
  subjectCode: string;
  academicYear: string;
  chapter: string;
  topic?: string;
  subtopic?: string;
  difficulty: "easy" | "medium" | "hard" | "advanced";
  cognitiveLevel: "knowledge" | "understanding" | "application" | "higher_order";
  tags: string[];
  imageUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  source: "manual" | "ai_generated" | "quiz_import" | "pdf_import";
  status: "active" | "archived";
}

export interface QuestionFilterCriteria {
  searchQuery?: string;
  className?: string;
  tradeName?: string;
  subjectName?: string;
  chapter?: string;
  topic?: string;
  questionType?: QuestionType | "all";
  difficulty?: "easy" | "medium" | "hard" | "advanced" | "all";
  cognitiveLevel?: "knowledge" | "understanding" | "application" | "higher_order" | "all";
  tag?: string;
  status?: "active" | "archived" | "all";
}

// In-Memory & Local Storage persistence key
const QUESTION_BANK_LOCAL_KEY = "pgtsc_question_bank_items_v2";

/**
 * Realistic Initial BTEB Vocational Question Repository
 */
export const INITIAL_QUESTION_BANK: QuestionBankItem[] = [
  {
    id: "qb-ge-101",
    questionType: "mcq",
    questionText: "পিএন জংশন ডায়োডে ফরোয়ার্ড বায়াস প্রয়োগ করলে ডিপ্লেশন লেয়ারের কী পরিবর্তন হয়?",
    options: ["কমে যায়", "বৃদ্ধি পায়", "অপরিবর্তিত থাকে", "সম্পূর্ণ নষ্ট হয়"],
    correctAnswer: "কমে যায়",
    explanation: "ফরোয়ার্ড বায়াসে মেজরিটি ক্যারিয়ার ডিপ্লেশন অঞ্চলের দিকে ধাবিত হয় ফলে এর প্রস্থ হ্রাস পায়।",
    marks: 1,
    className: "দশম শ্রেণি",
    classId: "class-10",
    tradeName: "জেনারেল ইলেকট্রনিক্স",
    tradeId: "trade-ge",
    subjectName: "জেনারেল ইলেকট্রনিক্স-২ (তত্ত্বীয়)",
    subjectCode: "৬২১২",
    academicYear: "2026",
    chapter: "অধ্যায় ১",
    topic: "সেমিকন্ডাক্টর ডায়োড",
    difficulty: "medium",
    cognitiveLevel: "understanding",
    tags: ["ডায়োড", "বায়াসিং", "সেমিকন্ডাক্টর"],
    createdBy: "PTSC Head of Dept",
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z",
    source: "manual",
    status: "active",
  },
  {
    id: "qb-ge-102",
    questionType: "mcq",
    questionText: "রেকটিফায়ার সার্কিটে এসি সিগন্যালকে কোন সিগন্যালে রূপান্তরিত করা হয়?",
    options: ["পালসেটিং ডিসি", "বিশুদ্ধ এসি", "সাইকেল এসি", "উচ্চ ভোল্টেজ এসি"],
    correctAnswer: "পালসেটিং ডিসি",
    explanation: "রেকটিফায়ারের মৌলিক কাজ হলো এসি প্রবাহকে একমুখী বা পালসেটিং ডিসিতে রূপান্তর করা।",
    marks: 1,
    className: "দশম শ্রেণি",
    classId: "class-10",
    tradeName: "জেনারেল ইলেকট্রনিক্স",
    tradeId: "trade-ge",
    subjectName: "জেনারেল ইলেকট্রনিক্স-২ (তত্ত্বীয়)",
    subjectCode: "৬২১২",
    academicYear: "2026",
    chapter: "অধ্যায় ২",
    topic: "রেকটিফিকেশন",
    difficulty: "easy",
    cognitiveLevel: "knowledge",
    tags: ["রেকটিফায়ার", "ডিসি", "পাওয়ার সাপ্লাই"],
    createdBy: "PTSC Head of Dept",
    createdAt: "2026-01-15T08:10:00.000Z",
    updatedAt: "2026-01-15T08:10:00.000Z",
    source: "manual",
    status: "active",
  },
  {
    id: "qb-ge-103",
    questionType: "short",
    questionText: "ফিল্টার সার্কিট বলতে কী বোঝায়? এর প্রধান দুটি প্রকারভেদ লেখ।",
    marks: 2,
    explanation: "পালসেটিং ডিসি থেকে রিপল দূর করার সার্কিটকে ফিল্টার সার্কিট বলে। যেমন: ক্যাপাসিটর ফিল্টার ও চোক ইনপুট ফিল্টার।",
    className: "দশম শ্রেণি",
    classId: "class-10",
    tradeName: "জেনারেল ইলেকট্রনিক্স",
    tradeId: "trade-ge",
    subjectName: "জেনারেল ইলেকট্রনিক্স-২ (তত্ত্বীয়)",
    subjectCode: "৬২১২",
    academicYear: "2026",
    chapter: "অধ্যায় ২",
    topic: "ফিল্টার সার্কিট",
    difficulty: "medium",
    cognitiveLevel: "understanding",
    tags: ["ফিল্টার", "রিপল", "ক্যাপাসিটর"],
    createdBy: "PTSC Instructor",
    createdAt: "2026-01-16T09:00:00.000Z",
    updatedAt: "2026-01-16T09:00:00.000Z",
    source: "manual",
    status: "active",
  },
  {
    id: "qb-ge-104",
    questionType: "broad",
    questionText: "একটি ফুল-ওয়েভ ব্রিজ রেকটিফায়ারের সার্কিট ডায়াগ্রাম অঙ্কন কর এবং এর কার্যপ্রণালী বিস্তারিত বর্ণনা কর।",
    marks: 5,
    explanation: "চারটি ডায়োড সমন্বিত ব্রিজ নেটওয়ার্কের মাধ্যমে এসি সিগন্যালের উভয় অর্ধ-চক্রে একমুখী প্রবাহ তৈরি হয়।",
    className: "দশম শ্রেণি",
    classId: "class-10",
    tradeName: "জেনারেল ইলেকট্রনিক্স",
    tradeId: "trade-ge",
    subjectName: "জেনারেল ইলেকট্রনিক্স-২ (তত্ত্বীয়)",
    subjectCode: "৬২১২",
    academicYear: "2026",
    chapter: "অধ্যায় ৩",
    topic: "ব্রিজ রেকটিফায়ার",
    difficulty: "hard",
    cognitiveLevel: "higher_order",
    tags: ["ব্রিজ রেকটিফায়ার", "সার্কিট ডায়াগ্রাম", "কার্যপ্রণালী"],
    createdBy: "PTSC Instructor",
    createdAt: "2026-01-16T09:30:00.000Z",
    updatedAt: "2026-01-16T09:30:00.000Z",
    source: "manual",
    status: "active",
  },
  {
    id: "qb-cs-201",
    questionType: "mcq",
    questionText: "কম্পিউটার নেটওয়ার্কে ব্যবহৃত ওএসআই (OSI) মডেলের মোট কতটি লেয়ার রয়েছে?",
    options: ["৫টি", "৬টি", "৭টি", "৪টি"],
    correctAnswer: "৭টি",
    explanation: "OSI রেফারেন্স মডেলে মোট ৭টি স্তর বা লেয়ার বিদ্যমান।",
    marks: 1,
    className: "দশম শ্রেণি",
    classId: "class-10",
    tradeName: "কম্পিউটার ও তথ্য প্রযুক্তি",
    tradeId: "trade-cit",
    subjectName: "কম্পিউটার ও তথ্য প্রযুক্তি-২ (তত্ত্বীয়)",
    subjectCode: "৬৮১২",
    academicYear: "2026",
    chapter: "অধ্যায় ৪",
    topic: "ওএসআই মডেল",
    difficulty: "easy",
    cognitiveLevel: "knowledge",
    tags: ["নেটওয়ার্ক", "OSI", "কম্পিউটার"],
    createdBy: "PTSC IT Teacher",
    createdAt: "2026-01-17T10:00:00.000Z",
    updatedAt: "2026-01-17T10:00:00.000Z",
    source: "manual",
    status: "active",
  },
  {
    id: "qb-cs-202",
    questionType: "short",
    questionText: "আইপি অ্যাড্রেস (IP Address) এবং ম্যাক অ্যাড্রেস (MAC Address)-এর মধ্যে ৩টি পার্থক্য লেখ।",
    marks: 3,
    explanation: "IP হলো লজিক্যাল অ্যাড্রেস এবং MAC হলো হার্ডওয়্যার ফিজিক্যাল অ্যাড্রেস।",
    className: "দশম শ্রেণি",
    classId: "class-10",
    tradeName: "কম্পিউটার ও তথ্য প্রযুক্তি",
    tradeId: "trade-cit",
    subjectName: "কম্পিউটার ও তথ্য প্রযুক্তি-২ (তত্ত্বীয়)",
    subjectCode: "৬৮১২",
    academicYear: "2026",
    chapter: "অধ্যায় ৫",
    topic: "আইপি ও ম্যাক অ্যাড্রেস",
    difficulty: "medium",
    cognitiveLevel: "understanding",
    tags: ["IP", "MAC", "নেটওয়ার্কিং"],
    createdBy: "PTSC IT Teacher",
    createdAt: "2026-01-17T10:30:00.000Z",
    updatedAt: "2026-01-17T10:30:00.000Z",
    source: "manual",
    status: "active",
  },
  {
    id: "qb-wl-301",
    questionType: "mcq",
    questionText: "আর্ক ওয়েল্ডিংয়ে ফ্লাক্সের প্রধান কাজ নিচের কোনটি?",
    options: ["ধাতুকে গলানো", "বায়ুমণ্ডলের অক্সিজেন রোধ করা", "বিদ্যুৎ প্রবাহ কমানো", "তাপমাত্রা স্থির রাখা"],
    correctAnswer: "বায়ুমণ্ডলের অক্সিজেন রোধ করা",
    explanation: "ফ্লাক্স গলে গ্যাসীয় আবরণ তৈরি করে যা গলিত ওয়েল্ড ধাতুকে বায়ুমণ্ডলের অক্সিজেন ও নাইট্রোজেন থেকে রক্ষা করে।",
    marks: 1,
    className: "দশম শ্রেণি",
    classId: "class-10",
    tradeName: "ওয়েল্ডিং অ্যান্ড ফেব্রিকেশন",
    tradeId: "trade-wf",
    subjectName: "ওয়েল্ডিং অ্যান্ড ফেব্রিকেশন-২ (তত্ত্বীয়)",
    subjectCode: "৬৯১২",
    academicYear: "2026",
    chapter: "অধ্যায় ১",
    topic: "আর্ক ওয়েল্ডিং নীতি",
    difficulty: "medium",
    cognitiveLevel: "understanding",
    tags: ["ওয়েল্ডিং", "ফ্লাক্স", "আর্ক"],
    createdBy: "PTSC Welding Specialist",
    createdAt: "2026-01-18T11:00:00.000Z",
    updatedAt: "2026-01-18T11:00:00.000Z",
    source: "manual",
    status: "active",
  },
];

/**
 * In-Memory cache of Question Bank
 */
let memoryBank: QuestionBankItem[] = [...INITIAL_QUESTION_BANK];

/**
 * Retrieves all Question Bank items (combines local storage with memory)
 */
export function getAllQuestionBankItems(): QuestionBankItem[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(QUESTION_BANK_LOCAL_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryBank = parsed;
          return memoryBank;
        }
      }
    } catch (e) {
      console.warn("Could not read question bank from localStorage:", e);
    }
  }
  return memoryBank;
}

/**
 * Saves Question Bank items to memory and localStorage
 */
export function persistQuestionBankItems(items: QuestionBankItem[]): void {
  memoryBank = [...items];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(QUESTION_BANK_LOCAL_KEY, JSON.stringify(memoryBank));
    } catch (e) {
      console.warn("Could not persist question bank to localStorage:", e);
    }
  }
}

/**
 * Filters and searches Question Bank items
 */
export function queryQuestionBank(criteria: QuestionFilterCriteria): QuestionBankItem[] {
  const allItems = getAllQuestionBankItems();

  return allItems.filter((item) => {
    // Status filter
    if (criteria.status && criteria.status !== "all") {
      if (item.status !== criteria.status) return false;
    } else {
      // Default to active questions only
      if (item.status === "archived") return false;
    }

    // Class filter
    if (criteria.className && criteria.className !== "all") {
      if (item.className !== criteria.className) return false;
    }

    // Trade filter
    if (criteria.tradeName && criteria.tradeName !== "all") {
      if (item.tradeName !== criteria.tradeName) return false;
    }

    // Subject filter
    if (criteria.subjectName && criteria.subjectName !== "all") {
      if (item.subjectName !== criteria.subjectName) return false;
    }

    // Question type filter
    if (criteria.questionType && criteria.questionType !== "all") {
      if (item.questionType !== criteria.questionType) return false;
    }

    // Difficulty filter
    if (criteria.difficulty && criteria.difficulty !== "all") {
      if (item.difficulty !== criteria.difficulty) return false;
    }

    // Cognitive Level filter
    if (criteria.cognitiveLevel && criteria.cognitiveLevel !== "all") {
      if (item.cognitiveLevel !== criteria.cognitiveLevel) return false;
    }

    // Chapter filter
    if (criteria.chapter && criteria.chapter !== "all") {
      if (item.chapter !== criteria.chapter) return false;
    }

    // Tag filter
    if (criteria.tag && criteria.tag !== "all") {
      if (!item.tags.includes(criteria.tag)) return false;
    }

    // Search query filter (matches question text, tags, topic, explanation)
    if (criteria.searchQuery && criteria.searchQuery.trim() !== "") {
      const q = criteria.searchQuery.toLowerCase().trim();
      const matchText = item.questionText.toLowerCase().includes(q);
      const matchTopic = (item.topic || "").toLowerCase().includes(q);
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
      const matchExplanation = (item.explanation || "").toLowerCase().includes(q);
      if (!matchText && !matchTopic && !matchTags && !matchExplanation) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Creates a QuestionNode snapshot to insert into an Exam Document.
 * Ensures document-level immutability: editing the question inside the exam
 * will NEVER mutate the original Question Bank item.
 */
export function createQuestionNodeSnapshot(item: QuestionBankItem): QuestionNode {
  return {
    id: `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sourceQuestionId: item.id,
    questionType: item.questionType,
    stem: item.questionText,
    marks: item.marks,
    options: item.options ? [...item.options] : undefined,
    correctAnswer: item.correctAnswer,
    explanation: item.explanation,
    difficulty: item.difficulty,
    cognitiveLevel: item.cognitiveLevel,
    chapter: item.chapter,
    topic: item.topic,
    tags: [...item.tags],
    imageUrl: item.imageUrl,
  };
}

/**
 * Creates a new Question Bank item
 */
export function addQuestionBankItem(
  data: Omit<QuestionBankItem, "id" | "createdAt" | "updatedAt" | "status">
): QuestionBankItem {
  const newItem: QuestionBankItem = {
    ...data,
    id: `qb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "active",
  };

  const current = getAllQuestionBankItems();
  persistQuestionBankItems([newItem, ...current]);
  return newItem;
}

/**
 * Updates an existing Question Bank item
 */
export function updateQuestionBankItem(
  id: string,
  updates: Partial<QuestionBankItem>
): QuestionBankItem | null {
  const current = getAllQuestionBankItems();
  const index = current.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const updated: QuestionBankItem = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updated;
  persistQuestionBankItems([...current]);
  return updated;
}

/**
 * Duplicates a Question Bank item
 */
export function duplicateQuestionBankItem(id: string): QuestionBankItem | null {
  const current = getAllQuestionBankItems();
  const item = current.find((i) => i.id === id);
  if (!item) return null;

  const duplicated: QuestionBankItem = {
    ...item,
    id: `qb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    questionText: `${item.questionText} (অনুলিপি)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  persistQuestionBankItems([duplicated, ...current]);
  return duplicated;
}

/**
 * Archives a Question Bank item (soft-delete)
 */
export function archiveQuestionBankItem(id: string): boolean {
  const updated = updateQuestionBankItem(id, { status: "archived" });
  return updated !== null;
}

/**
 * Permanently deletes a Question Bank item
 */
export function deleteQuestionBankItem(id: string): boolean {
  const current = getAllQuestionBankItems();
  const filtered = current.filter((item) => item.id !== id);
  if (filtered.length !== current.length) {
    persistQuestionBankItems(filtered);
    return true;
  }
  return false;
}

/**
 * Duplicate Question Detection based on normalized text similarity
 */
export function detectDuplicateInBank(text: string, excludeId?: string): QuestionBankItem | null {
  const normalized = text.trim().toLowerCase().replace(/[\s\p{P}]+/gu, "");
  if (!normalized) return null;

  const all = getAllQuestionBankItems();
  for (const item of all) {
    if (excludeId && item.id === excludeId) continue;
    const existingNorm = item.questionText.trim().toLowerCase().replace(/[\s\p{P}]+/gu, "");
    if (existingNorm === normalized) {
      return item;
    }
  }
  return null;
}

