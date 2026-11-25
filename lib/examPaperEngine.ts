/**
 * Enterprise Exam Paper Engine
 * Strongly typed, framework-independent document manipulation engine for professional examination authoring.
 * Strictly adheres to BTEB and National Curriculum Standards.
 */

export type ExamBlockType =
  | "HEADER_BLOCK"
  | "HORIZONTAL_LINE"
  | "VERTICAL_DIVIDER"
  | "TEXT_OR_TABLE_BLOCK"
  | "SECTION_BLOCK";

export type QuestionType =
  | "mcq"
  | "short"
  | "broad"
  | "creative"
  | "true_false"
  | "fill_in"
  | "matching"
  | "ordering"
  | "numerical"
  | "diagram";

export type ExamNumberingSystem =
  | "BN_ALPHA" // ক, খ, গ, ঘ
  | "BN_ALPHA_PAREN" // (ক), (খ), (গ), (ঘ)
  | "BN_NUM" // ১, ২, ৩, ৪
  | "BN_NUM_PAREN" // (১), (২), (৩), (৪)
  | "ROMAN_LOWER" // i, ii, iii, iv
  | "ROMAN_UPPER" // I, II, III, IV
  | "EN_ALPHA" // A, B, C, D
  | "EN_ALPHA_PAREN" // (A), (B), (C), (D)
  | "EN_NUM" // 1, 2, 3, 4
  | "EN_NUM_PAREN"; // (1), (2), (3), (4)

export type OptionLayoutMode = "INLINE_4" | "GRID_2X2" | "VERTICAL_1" | "AUTO_LAYOUT";

export type FormattingZone =
  | "HEADER"
  | "SECTION_TITLE"
  | "QUESTION_STEM"
  | "OPTION_TEXT"
  | "INSTRUCTION"
  | "TABLE"
  | "CUSTOM_TEXT";

export interface NodeStyle {
  fontFamily?:
    | "Hind Siliguri"
    | "Noto Serif Bengali"
    | "Kalpurush"
    | "SolaimanLipi"
    | "Times New Roman"
    | "Inter";
  fontSizePt?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  color?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  lineHeight?: number;
  paragraphGapPx?: number;
}

export interface HeaderBlock {
  type: "HEADER_BLOCK";
  id: string;
  institutionName: string;
  subLocation?: string;
  examTitle: string;
  examType: string;
  examDate: string;
  academicYear: string;
  className: string;
  classId?: string;
  tradeName: string;
  tradeId?: string;
  subjectName: string;
  subjectCode: string;
  duration: string;
  totalMarks: number;
  instructions?: string;
}

export interface HorizontalLineBlock {
  type: "HORIZONTAL_LINE";
  id: string;
  lineStyle: "solid" | "double" | "dashed" | "thick";
  thicknessPx: number;
  marginY: number;
  visibility: boolean;
}

export interface VerticalDividerBlock {
  type: "VERTICAL_DIVIDER";
  id: string;
  lineStyle: "solid" | "dashed";
  thicknessPx: number;
  visibility: boolean;
}

export interface TextOrTableBlock {
  type: "TEXT_OR_TABLE_BLOCK";
  id: string;
  textType: "paragraph" | "instruction" | "formula" | "table" | "callout" | "image";
  content: string;
  htmlTable?: {
    rows: string[][];
    headers?: string[];
    colWidths?: string[];
    bordered?: boolean;
  };
  imageUrl?: string;
  caption?: string;
  imageWidthPx?: number;
  alignment?: "left" | "center" | "right";
}

export interface QuestionNode {
  id: string;
  questionType: QuestionType;
  customNumberOverride?: string;
  stem: string;
  marks: number;
  imageUrl?: string;
  options?: string[];
  correctAnswer?: string | number | string[];
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard" | "advanced";
  cognitiveLevel?: "knowledge" | "understanding" | "application" | "higher_order";
  chapter?: string;
  topic?: string;
  tags?: string[];
  sourceQuestionId?: string;
  subQuestions?: QuestionNode[];
  rubric?: string;
}

export interface SectionBlock {
  type: "SECTION_BLOCK";
  id: string;
  parentNumberLabel?: string;
  title: string;
  columns: 1 | 2;
  showCenterLine: boolean;
  columnGapPx: number;
  questionNumberSystem: ExamNumberingSystem;
  optionNumberSystem: ExamNumberingSystem;
  optionLayout: OptionLayoutMode;
  questions: QuestionNode[];
  defaultMarks: number;
  sectionInstructions?: string;
  sectionTotalMarks: number;
  pageBreakBefore?: boolean;
}

export type ExamBlock =
  | HeaderBlock
  | HorizontalLineBlock
  | VerticalDividerBlock
  | TextOrTableBlock
  | SectionBlock;

export interface PageConfiguration {
  pageSize: "A4";
  widthMm: number; // 210
  heightMm: number; // 297
  orientation: "portrait" | "landscape";
  margins: {
    preset: "narrow" | "normal" | "wide" | "custom";
    topMm: number;
    rightMm: number;
    bottomMm: number;
    leftMm: number;
  };
  showPageNumbers: boolean;
  headerText?: string;
  footerText?: string;
  firstPageDifferent: boolean;
}

export interface ExamVariant {
  id: string;
  setLabel: "Set A" | "Set B" | "Set C" | "Set D";
  seed: number;
  createdAt: string;
  questionOrderMap: Record<string, string[]>; // sectionId -> questionIds
  optionShuffleMap: Record<string, number[]>; // questionId -> optionIndices
}

export interface ExamAnswerKeyItem {
  questionId: string;
  sectionId: string;
  questionNumberLabel: string;
  correctAnswerText: string;
  correctIndex?: number;
  markingRubric?: string;
  marks: number;
}

export interface ExamAnswerKeyConfig {
  items: ExamAnswerKeyItem[];
  generatedAt: string;
  updatedAt: string;
}

export interface ExamDocument {
  id: string;
  title: string;
  schemaVersion: "2.0.0";
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  academicMeta: {
    academicYear: string;
    classId?: string;
    className: string;
    tradeId?: string;
    tradeName: string;
    subjectId?: string;
    subjectName: string;
    subjectCode: string;
  };
  blocks: ExamBlock[];
  pageConfig: PageConfiguration;
  nodeStyles: Record<string, NodeStyle>;
  variants?: ExamVariant[];
  answerKeyConfig?: ExamAnswerKeyConfig;
}

export const DEFAULT_PAGE_CONFIG: PageConfiguration = {
  pageSize: "A4",
  widthMm: 210,
  heightMm: 297,
  orientation: "portrait",
  margins: {
    preset: "normal",
    topMm: 12,
    rightMm: 12,
    bottomMm: 12,
    leftMm: 12,
  },
  showPageNumbers: true,
  firstPageDifferent: true,
  footerText: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ • পরীক্ষা শাখা",
};

/**
 * Creates a brand-new, production-ready ExamDocument with authentic BTEB header
 */
export function createDefaultExamDocument(overrides?: Partial<ExamDocument>): ExamDocument {
  const docId = `exam-doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  const defaultHeader: HeaderBlock = {
    type: "HEADER_BLOCK",
    id: `hdr-${Date.now()}`,
    institutionName: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
    subLocation: "কারিগরি শিক্ষা বোর্ড অনুমোদিত • পঞ্চগড়-৫০০০",
    examTitle: "বার্ষিক পরীক্ষা - ২০২৬",
    examType: "তত্ত্বীয় চূড়ান্ত পরীক্ষা",
    examDate: "2026-11-13",
    academicYear: "2026",
    className: overrides?.academicMeta?.className || "দশম শ্রেণি",
    classId: overrides?.academicMeta?.classId || "class-10",
    tradeName: overrides?.academicMeta?.tradeName || "জেনারেল ইলেকট্রনিক্স",
    tradeId: overrides?.academicMeta?.tradeId || "trade-ge",
    subjectName: overrides?.academicMeta?.subjectName || "জেনারেল ইলেকট্রনিক্স-২ (তত্ত্বীয়)",
    subjectCode: overrides?.academicMeta?.subjectCode || "৬২১২",
    duration: "২ ঘণ্টা ৩০ মিনিট",
    totalMarks: 50,
    instructions: "[দ্রষ্টব্য: সকল প্রশ্নের মান সমান। ডান পাশের সংখ্যা প্রশ্নের পূর্ণমান নির্দেশ করে।]",
  };

  const defaultDivider: HorizontalLineBlock = {
    type: "HORIZONTAL_LINE",
    id: `line-${Date.now()}`,
    lineStyle: "double",
    thicknessPx: 1.5,
    marginY: 8,
    visibility: true,
  };

  const defaultMcqSection: SectionBlock = {
    type: "SECTION_BLOCK",
    id: `sec-${Date.now()}-1`,
    parentNumberLabel: "ক-বিভাগ",
    title: "বহুনির্বাচনি প্রশ্ন (যেকোনো ১০টি প্রশ্নের উত্তর দাও)",
    columns: 2,
    showCenterLine: true,
    columnGapPx: 20,
    questionNumberSystem: "BN_NUM",
    optionNumberSystem: "BN_ALPHA_PAREN",
    optionLayout: "AUTO_LAYOUT",
    defaultMarks: 1,
    sectionInstructions: "প্রতিটি প্রশ্নের মান ১। সঠিক উত্তরের পাশে টিকচিহ্ন দিন।",
    sectionTotalMarks: 10,
    questions: [
      {
        id: `q-${Date.now()}-1`,
        questionType: "mcq",
        stem: "পিএন জংশন ডায়োডে ফরোয়ার্ড বায়াস প্রয়োগ করলে ডিপ্লেশন লেয়ারের কী পরিবর্তন হয়?",
        marks: 1,
        options: ["কমে যায়", "বৃদ্ধি পায়", "অপরিবর্তিত থাকে", "সম্পূর্ণ নষ্ট হয়"],
        correctAnswer: "কমে যায়",
        difficulty: "medium",
        chapter: "অধ্যায় ১",
      },
      {
        id: `q-${Date.now()}-2`,
        questionType: "mcq",
        stem: "রেকটিফায়ার সার্কিটে এসি সিগন্যালকে কোন সিগন্যালে রূপান্তরিত করা হয়?",
        marks: 1,
        options: ["পালসেটিং ডিসি", "বিশুদ্ধ এসি", "সাইকেল এসি", "উচ্চ ভোল্টেজ এসি"],
        correctAnswer: "পালসেটিং ডিসি",
        difficulty: "easy",
        chapter: "অধ্যায় ২",
      },
    ],
  };

  const defaultShortSection: SectionBlock = {
    type: "SECTION_BLOCK",
    id: `sec-${Date.now()}-2`,
    parentNumberLabel: "খ-বিভাগ",
    title: "সংক্ষিপ্ত উত্তর প্রশ্ন (যেকোনো ৫টি প্রশ্নের উত্তর দাও)",
    columns: 1,
    showCenterLine: false,
    columnGapPx: 16,
    questionNumberSystem: "BN_NUM",
    optionNumberSystem: "BN_ALPHA",
    optionLayout: "VERTICAL_1",
    defaultMarks: 2,
    sectionInstructions: "প্রতিটি প্রশ্নের মান ২। সংক্ষেপে উত্তর দাও।",
    sectionTotalMarks: 10,
    questions: [
      {
        id: `q-${Date.now()}-3`,
        questionType: "short",
        stem: "ফিল্টার সার্কিট বলতে কী বোঝায়? এর প্রধান দুটি প্রকারভেদ লেখ।",
        marks: 2,
        difficulty: "medium",
        chapter: "অধ্যায় ২",
      },
    ],
  };

  const defaultBroadSection: SectionBlock = {
    type: "SECTION_BLOCK",
    id: `sec-${Date.now()}-3`,
    parentNumberLabel: "গ-বিভাগ",
    title: "রচনামূলক / বর্ণনামূলক প্রশ্ন (যেকোনো ৬টি প্রশ্নের উত্তর দাও)",
    columns: 1,
    showCenterLine: false,
    columnGapPx: 16,
    questionNumberSystem: "BN_NUM",
    optionNumberSystem: "BN_ALPHA",
    optionLayout: "VERTICAL_1",
    defaultMarks: 5,
    sectionInstructions: "প্রতিটি প্রশ্নের মান ৫। চিত্রসহ বিস্তারিত ব্যাখ্যা কর।",
    sectionTotalMarks: 30,
    questions: [
      {
        id: `q-${Date.now()}-4`,
        questionType: "broad",
        stem: "একটি ফুল-ওয়েভ ব্রিজ রেকটিফায়ারের সার্কিট ডায়াগ্রাম অঙ্কন কর এবং এর কার্যপ্রণালী বর্ণনা কর।",
        marks: 5,
        difficulty: "hard",
        chapter: "অধ্যায় ৩",
      },
    ],
  };

  return {
    id: docId,
    title: overrides?.title || "জেনারেল ইলেকট্রনিক্স-২ (তত্ত্বীয়) - বার্ষিক পরীক্ষা ২০২৬",
    schemaVersion: "2.0.0",
    createdAt: now,
    updatedAt: now,
    createdBy: "PTSC Teacher",
    academicMeta: {
      academicYear: "2026",
      className: overrides?.academicMeta?.className || "দশম শ্রেণি",
      classId: overrides?.academicMeta?.classId || "class-10",
      tradeName: overrides?.academicMeta?.tradeName || "জেনারেল ইলেকট্রনিক্স",
      tradeId: overrides?.academicMeta?.tradeId || "trade-ge",
      subjectName: overrides?.academicMeta?.subjectName || "জেনারেল ইলেকট্রনিক্স-২ (তত্ত্বীয়)",
      subjectCode: overrides?.academicMeta?.subjectCode || "৬২১২",
      ...overrides?.academicMeta,
    },
    blocks: overrides?.blocks || [
      defaultHeader,
      defaultDivider,
      defaultMcqSection,
      defaultShortSection,
      defaultBroadSection,
    ],
    pageConfig: overrides?.pageConfig || DEFAULT_PAGE_CONFIG,
    nodeStyles: overrides?.nodeStyles || {},
    variants: overrides?.variants || [],
    answerKeyConfig: overrides?.answerKeyConfig,
  };
}

/**
 * Migration-safe document serializer
 */
export function serializeExamDocument(doc: ExamDocument): string {
  return JSON.stringify(doc);
}

/**
 * Migration-safe document deserializer
 */
export function deserializeExamDocument(rawJson: string): ExamDocument {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== "object") {
      return createDefaultExamDocument();
    }
    // Schema version check and upgrade if required
    if (parsed.schemaVersion !== "2.0.0") {
      parsed.schemaVersion = "2.0.0";
    }
    if (!Array.isArray(parsed.blocks)) {
      parsed.blocks = [];
    }
    if (!parsed.pageConfig) {
      parsed.pageConfig = DEFAULT_PAGE_CONFIG;
    }
    if (!parsed.nodeStyles) {
      parsed.nodeStyles = {};
    }
    return parsed as ExamDocument;
  } catch (e) {
    console.error("Failed to deserialize exam document, falling back to default:", e);
    return createDefaultExamDocument();
  }
}

/**
 * Helper to calculate total marks across all sections
 */
export function calculateExamTotalMarks(doc: ExamDocument): number {
  let total = 0;
  for (const block of doc.blocks) {
    if (block.type === "SECTION_BLOCK") {
      if (block.sectionTotalMarks && block.sectionTotalMarks > 0) {
        total += block.sectionTotalMarks;
      } else {
        total += block.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
      }
    }
  }
  return total;
}

/**
 * Helper to count total questions across all sections
 */
export function countExamQuestions(doc: ExamDocument): number {
  let count = 0;
  for (const block of doc.blocks) {
    if (block.type === "SECTION_BLOCK") {
      count += block.questions.length;
    }
  }
  return count;
}

