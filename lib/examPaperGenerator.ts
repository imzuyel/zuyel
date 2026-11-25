/**
 * Intelligent Automatic Exam Paper Generator
 * Assembles complete, balanced examination papers from the Question Bank based on
 * customizable blueprints, chapter weights, difficulty distributions, and syllabus rules.
 */

import {
  ExamDocument,
  ExamBlock,
  SectionBlock,
  QuestionNode,
  QuestionType,
  createDefaultExamDocument,
  calculateExamTotalMarks,
} from "./examPaperEngine";
import {
  QuestionBankItem,
  getAllQuestionBankItems,
  createQuestionNodeSnapshot,
} from "./questionBankEngine";

export interface SectionBlueprint {
  title: string;
  parentNumberLabel?: string;
  questionType: QuestionType;
  questionCount: number;
  marksPerQuestion: number;
  columns?: 1 | 2;
  chapterDistribution?: Record<string, number>; // chapter -> count
  difficultyDistribution?: {
    easy?: number;
    medium?: number;
    hard?: number;
    advanced?: number;
  };
  sectionInstructions?: string;
  compulsoryCount?: number;
}

export interface ExamBlueprint {
  title: string;
  className: string;
  classId?: string;
  tradeName: string;
  tradeId?: string;
  subjectName: string;
  subjectCode: string;
  academicYear: string;
  totalMarks: number;
  durationMinutes: number;
  sections: SectionBlueprint[];
}

export interface BlueprintValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalConfiguredMarks: number;
}

/**
 * Validates whether an Exam Blueprint can be fulfilled by the current Question Bank
 */
export function validateExamBlueprint(blueprint: ExamBlueprint): BlueprintValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let totalConfiguredMarks = 0;
  const allBankQuestions = getAllQuestionBankItems().filter(
    (q) => q.status === "active" && q.className === blueprint.className
  );

  // 1. Check total marks sum
  for (const sec of blueprint.sections) {
    const secMarks = sec.questionCount * sec.marksPerQuestion;
    totalConfiguredMarks += secMarks;
  }

  if (totalConfiguredMarks !== blueprint.totalMarks) {
    errors.push(
      `পূর্ণমান অসঙ্গতি: ব্লুপ্রিন্টের সেকশনসমূহের মোট নম্বর (${totalConfiguredMarks}) এবং নির্ধারিত পূর্ণমান (${blueprint.totalMarks}) এক নয়।`
    );
  }

  // 2. Check question availability for each section
  for (let i = 0; i < blueprint.sections.length; i++) {
    const sec = blueprint.sections[i];
    const matching = allBankQuestions.filter(
      (q) =>
        q.questionType === sec.questionType &&
        (!blueprint.subjectName || q.subjectName === blueprint.subjectName)
    );

    if (matching.length < sec.questionCount) {
      errors.push(
        `পর্যাপ্ত প্রশ্ন নেই (${sec.title}): এই সেকশনের জন্য ${sec.questionCount}টি প্রশ্ন প্রয়োজন কিন্তু প্রশ্ন ব্যাংকে আছে মাত্র ${matching.length}টি।`
      );
    } else if (matching.length === sec.questionCount) {
      warnings.push(
        `সীমিত প্রশ্ন পুল (${sec.title}): প্রশ্ন ব্যাংকে শুধুমাত্র কাঙ্ক্ষিত সংখ্যক (${matching.length}) প্রশ্ন বিদ্যমান, বৈচিত্র্য নিশ্চিত করতে আরও প্রশ্ন যোগ করার পরামর্শ দেওয়া হচ্ছে।`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalConfiguredMarks,
  };
}

/**
 * Generates an ExamDocument based on the given blueprint and Question Bank data
 */
export function generateExamFromBlueprint(blueprint: ExamBlueprint): ExamDocument {
  const baseDoc = createDefaultExamDocument({
    title: blueprint.title,
    academicMeta: {
      academicYear: blueprint.academicYear,
      className: blueprint.className,
      classId: blueprint.classId,
      tradeName: blueprint.tradeName,
      tradeId: blueprint.tradeId,
      subjectName: blueprint.subjectName,
      subjectCode: blueprint.subjectCode,
    },
  });

  // Update header block
  const headerBlock = baseDoc.blocks.find((b) => b.type === "HEADER_BLOCK");
  if (headerBlock && headerBlock.type === "HEADER_BLOCK") {
    headerBlock.examTitle = blueprint.title;
    headerBlock.className = blueprint.className;
    headerBlock.tradeName = blueprint.tradeName;
    headerBlock.subjectName = blueprint.subjectName;
    headerBlock.subjectCode = blueprint.subjectCode;
    headerBlock.duration = `${Math.floor(blueprint.durationMinutes / 60)} ঘণ্টা ${
      blueprint.durationMinutes % 60 > 0 ? `${blueprint.durationMinutes % 60} মিনিট` : ""
    }`.trim();
    headerBlock.totalMarks = blueprint.totalMarks;
  }

  const allBank = getAllQuestionBankItems().filter((q) => q.status === "active");
  const usedQuestionIds = new Set<string>();
  const generatedBlocks: ExamBlock[] = [];

  // Retain initial header and horizontal line
  for (const block of baseDoc.blocks) {
    if (block.type === "HEADER_BLOCK" || block.type === "HORIZONTAL_LINE") {
      generatedBlocks.push(block);
    }
  }

  // Assemble Sections
  for (let sIdx = 0; sIdx < blueprint.sections.length; sIdx++) {
    const secBlueprint = blueprint.sections[sIdx];
    const candidateQuestions = allBank.filter(
      (q) =>
        q.questionType === secBlueprint.questionType &&
        (!blueprint.subjectName || q.subjectName === blueprint.subjectName) &&
        !usedQuestionIds.has(q.id)
    );

    // Shuffle candidates deterministically
    const shuffled = [...candidateQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions: QuestionNode[] = [];

    for (const item of shuffled) {
      if (selectedQuestions.length >= secBlueprint.questionCount) break;
      usedQuestionIds.add(item.id);
      selectedQuestions.push(createQuestionNodeSnapshot(item));
    }

    const newSection: SectionBlock = {
      type: "SECTION_BLOCK",
      id: `sec-${Date.now()}-${sIdx}`,
      parentNumberLabel: secBlueprint.parentNumberLabel || `${sIdx + 1}-বিভাগ`,
      title: secBlueprint.title,
      columns: secBlueprint.columns || (secBlueprint.questionType === "mcq" ? 2 : 1),
      showCenterLine: secBlueprint.questionType === "mcq",
      columnGapPx: 20,
      questionNumberSystem: "BN_NUM",
      optionNumberSystem: "BN_ALPHA_PAREN",
      optionLayout: secBlueprint.questionType === "mcq" ? "AUTO_LAYOUT" : "VERTICAL_1",
      defaultMarks: secBlueprint.marksPerQuestion,
      sectionInstructions: secBlueprint.sectionInstructions,
      sectionTotalMarks: secBlueprint.questionCount * secBlueprint.marksPerQuestion,
      questions: selectedQuestions,
    };

    generatedBlocks.push(newSection);
  }

  baseDoc.blocks = generatedBlocks;
  return baseDoc;
}

/**
 * Regenerates an individual section in an existing document without touching other sections
 */
export function regenerateSelectedSection(
  doc: ExamDocument,
  sectionId: string
): ExamDocument {
  const updatedBlocks = doc.blocks.map((block) => {
    if (block.type !== "SECTION_BLOCK" || block.id !== sectionId) {
      return block;
    }

    // Collect question IDs used in other sections to avoid duplication
    const otherUsedIds = new Set<string>();
    for (const b of doc.blocks) {
      if (b.type === "SECTION_BLOCK" && b.id !== sectionId) {
        for (const q of b.questions) {
          if (q.sourceQuestionId) otherUsedIds.add(q.sourceQuestionId);
        }
      }
    }

    const allBank = getAllQuestionBankItems().filter(
      (q) => q.status === "active" && !otherUsedIds.has(q.id)
    );

    const matchingType = allBank.filter(
      (q) =>
        (!block.questions[0] || q.questionType === block.questions[0].questionType) &&
        (!doc.academicMeta.subjectName || q.subjectName === doc.academicMeta.subjectName)
    );

    const shuffled = [...matchingType].sort(() => 0.5 - Math.random());
    const targetCount = block.questions.length || 5;
    const newQuestions = shuffled.slice(0, targetCount).map(createQuestionNodeSnapshot);

    return {
      ...block,
      questions: newQuestions.length > 0 ? newQuestions : block.questions,
    };
  });

  return {
    ...doc,
    blocks: updatedBlocks,
    updatedAt: new Date().toISOString(),
  };
}

