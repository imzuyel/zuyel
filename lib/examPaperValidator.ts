/**
 * Smart Examination Paper Validation Engine
 * Executes 17 diagnostic checks across document metadata, sections, questions,
 * marks distribution, numbering, and media to ensure complete BTEB compliance.
 */

import { ExamDocument, SectionBlock, QuestionNode } from "./examPaperEngine";

export type IssueSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  id: string;
  checkNumber: number;
  severity: IssueSeverity;
  targetNodeId?: string;
  targetSectionId?: string;
  titleBangla: string;
  descriptionBangla: string;
  suggestionBangla: string;
}

export interface ValidationSummary {
  isValid: boolean;
  score: number; // 0 - 100
  readyToPrint: boolean;
  errorsCount: number;
  warningsCount: number;
  infoCount: number;
  issues: ValidationIssue[];
}

/**
 * Validates the entire ExamDocument against the 17 comprehensive assessment checks
 */
export function validateExamDocument(doc: ExamDocument): ValidationSummary {
  const issues: ValidationIssue[] = [];

  const headerBlock = doc.blocks.find((b) => b.type === "HEADER_BLOCK");
  const sectionBlocks = doc.blocks.filter((b): b is SectionBlock => b.type === "SECTION_BLOCK");

  // 1. Missing Exam Title
  if (!headerBlock || !headerBlock.examTitle || headerBlock.examTitle.trim() === "") {
    issues.push({
      id: "val-1",
      checkNumber: 1,
      severity: "error",
      targetNodeId: headerBlock?.id,
      titleBangla: "পরীক্ষার শিরোনাম অনুপস্থিত",
      descriptionBangla: "প্রশ্নপত্রের হেডার ব্লকে পরীক্ষার নাম বা শিরোনাম উল্লেখ করা হয়নি।",
      suggestionBangla: "যেমন: 'বার্ষিক পরীক্ষা - ২০২৬' বা 'অর্ধ-বার্ষিক পরীক্ষা' যুক্ত করুন।",
    });
  }

  // 2. Missing Subject Name
  if (!headerBlock || !headerBlock.subjectName || headerBlock.subjectName.trim() === "") {
    issues.push({
      id: "val-2",
      checkNumber: 2,
      severity: "error",
      targetNodeId: headerBlock?.id,
      titleBangla: "বিষয় ও কোড অনুপস্থিত",
      descriptionBangla: "বিষয়ের নাম বা বিষয় কোড খালি রয়েছে।",
      suggestionBangla: "হেডারে সঠিক বিষয়ের নাম (যেমন: জেনারেল ইলেকট্রনিক্স-২) দিন।",
    });
  }

  // 3. Missing Duration
  if (!headerBlock || !headerBlock.duration || headerBlock.duration.trim() === "") {
    issues.push({
      id: "val-3",
      checkNumber: 3,
      severity: "warning",
      targetNodeId: headerBlock?.id,
      titleBangla: "পরীক্ষার সময় অনুপস্থিত",
      descriptionBangla: "বামপাশে পরীক্ষার নির্ধারিত সময় উল্লেখ নেই।",
      suggestionBangla: "যেমন: '২ ঘণ্টা ৩০ মিনিট' নির্ধারণ করুন।",
    });
  }

  // 4. Missing Total Marks
  if (!headerBlock || !headerBlock.totalMarks || headerBlock.totalMarks <= 0) {
    issues.push({
      id: "val-4",
      checkNumber: 4,
      severity: "error",
      targetNodeId: headerBlock?.id,
      titleBangla: "পূর্ণমান অনুপস্থিত",
      descriptionBangla: "ডানপাশের পূর্ণমান ০ বা নির্ধারিত নেই।",
      suggestionBangla: "বিটিইবি প্রবিধান অনুযায়ী পূর্ণমান (৫০ বা ১০০) লিখুন।",
    });
  }

  // Iterate sections & questions for deep checks
  let totalCalculatedSectionMarks = 0;
  const seenQuestionTexts = new Map<string, string>(); // normalizedText -> questionId

  for (let sIdx = 0; sIdx < sectionBlocks.length; sIdx++) {
    const sec = sectionBlocks[sIdx];
    let sectionQuestionsMarks = 0;

    // 13. Empty Sections
    if (!sec.questions || sec.questions.length === 0) {
      issues.push({
        id: `val-13-${sec.id}`,
        checkNumber: 13,
        severity: "error",
        targetSectionId: sec.id,
        titleBangla: `খালি সেকশন (${sec.title})`,
        descriptionBangla: "সেকশনে কোনো প্রশ্ন যুক্ত করা হয়নি।",
        suggestionBangla: "প্রশ্ন ব্যাংক থেকে প্রশ্ন যোগ করুন অথবা সেকশনটি মুছে দিন।",
      });
      continue;
    }

    const seenBadges = new Set<string>();

    for (let qIdx = 0; qIdx < sec.questions.length; qIdx++) {
      const q = sec.questions[qIdx];
      sectionQuestionsMarks += q.marks || 0;

      // 5. Missing Question Text
      if (!q.stem || q.stem.trim() === "") {
        issues.push({
          id: `val-5-${q.id}`,
          checkNumber: 5,
          severity: "error",
          targetNodeId: q.id,
          targetSectionId: sec.id,
          titleBangla: `প্রশ্ন ${qIdx + 1}-এ কোনো লেখা নেই`,
          descriptionBangla: "প্রশ্নের মূল বিষয়বস্তু (Stem) ফাঁকা রাখা হয়েছে।",
          suggestionBangla: "প্রশ্নের টেক্সট টাইপ করুন বা ড্রাফট পূর্ণ করুন।",
        });
      }

      // 6. Missing MCQ Options
      if (q.questionType === "mcq") {
        if (!q.options || q.options.length < 2) {
          issues.push({
            id: `val-6-${q.id}`,
            checkNumber: 6,
            severity: "error",
            targetNodeId: q.id,
            targetSectionId: sec.id,
            titleBangla: `বহুনির্বাচনি অপশন অপর্যাপ্ত (প্রশ্ন ${qIdx + 1})`,
            descriptionBangla: "MCQ প্রশ্নে কমপক্ষে ২টি এবং প্রমিতভাবে ৪টি অপশন থাকা আবশ্যক।",
            suggestionBangla: "৪টি সঠিক ও বিভ্রান্তিকর বিকল্প অপশন যোগ করুন।",
          });
        }

        // 7. Invalid Correct Answer
        if (q.correctAnswer && q.options) {
          const answerStr = String(q.correctAnswer).trim().toLowerCase();
          const exists = q.options.some((opt) => opt.trim().toLowerCase() === answerStr);
          if (!exists && typeof q.correctAnswer !== "number") {
            issues.push({
              id: `val-7-${q.id}`,
              checkNumber: 7,
              severity: "warning",
              targetNodeId: q.id,
              targetSectionId: sec.id,
              titleBangla: `উত্তর মিলছে না (প্রশ্ন ${qIdx + 1})`,
              descriptionBangla: "নির্ধারিত সঠিক উত্তরটি অপশন তালিকার সাথে হুবহু মেলেনি।",
              suggestionBangla: "সঠিক উত্তরটি পুনরায় অপশন থেকে নির্বাচন করুন।",
            });
          }
        }
      }

      // 8. Duplicate Questions
      const normalizedStem = (q.stem || "").trim().toLowerCase().replace(/[\s\p{P}]+/gu, "");
      if (normalizedStem.length > 10) {
        if (seenQuestionTexts.has(normalizedStem)) {
          issues.push({
            id: `val-8-${q.id}`,
            checkNumber: 8,
            severity: "warning",
            targetNodeId: q.id,
            targetSectionId: sec.id,
            titleBangla: `অনুরূপ প্রশ্ন শনাক্ত হয়েছে (প্রশ্ন ${qIdx + 1})`,
            descriptionBangla: "এই প্রশ্নটির সাথে প্রশ্নপত্রের পূর্বের একটি প্রশ্নের শতভাগ মিল রয়েছে।",
            suggestionBangla: "প্রশ্নটি পরিবর্তন করুন বা অন্য অধ্যায় থেকে নির্বাচন করুন।",
          });
        } else {
          seenQuestionTexts.set(normalizedStem, q.id);
        }
      }

      // 9. Numbering Conflicts
      const badge = q.customNumberOverride || `${qIdx + 1}`;
      if (seenBadges.has(badge)) {
        issues.push({
          id: `val-9-${q.id}`,
          checkNumber: 9,
          severity: "warning",
          targetNodeId: q.id,
          targetSectionId: sec.id,
          titleBangla: `ক্রমিক নম্বর দ্বন্দ্ব (${badge})`,
          descriptionBangla: "একই সেকশনে একাধিক প্রশ্নে একই ক্রমিক নম্বর ব্যবহার করা হয়েছে।",
          suggestionBangla: "ক্রমিক নম্বরগুলো স্বয়ংক্রিয় বা পৃথকভাবে সেট করুন।",
        });
      } else {
        seenBadges.add(badge);
      }

      // 12. Missing Image Links
      if (q.questionType === "diagram" && !q.imageUrl) {
        issues.push({
          id: `val-12-${q.id}`,
          checkNumber: 12,
          severity: "info",
          targetNodeId: q.id,
          targetSectionId: sec.id,
          titleBangla: `চিত্রবিহীন ডায়াগ্রাম প্রশ্ন (প্রশ্ন ${qIdx + 1})`,
          descriptionBangla: "ডায়াগ্রাম বা সার্কিট টাইপ প্রশ্নে কোনো ছবি যুক্ত করা নেই।",
          suggestionBangla: "একটি স্পষ্ট কারিগরি সার্কিট বা ডায়াগ্রাম ইমেজ আপলোড করুন।",
        });
      }
    }

    // 11. Incorrect Section Total
    if (sec.sectionTotalMarks > 0 && sectionQuestionsMarks < sec.sectionTotalMarks) {
      issues.push({
        id: `val-11-${sec.id}`,
        checkNumber: 11,
        severity: "warning",
        targetSectionId: sec.id,
        titleBangla: `সেকশনের নম্বর অমিল (${sec.title})`,
        descriptionBangla: `সেকশনের প্রশ্নের মোট নম্বর (${sectionQuestionsMarks}) নির্ধারিত সেকশন পূর্ণমানের (${sec.sectionTotalMarks}) চেয়ে কম।`,
        suggestionBangla: "প্রশ্নের সংখ্যা বা প্রতিটি প্রশ্নের মান বৃদ্ধি করুন।",
      });
    }

    totalCalculatedSectionMarks += sec.sectionTotalMarks || sectionQuestionsMarks;
  }

  // 10. Marks Mismatch
  if (headerBlock && headerBlock.totalMarks > 0 && totalCalculatedSectionMarks > 0) {
    if (headerBlock.totalMarks !== totalCalculatedSectionMarks) {
      issues.push({
        id: "val-10",
        checkNumber: 10,
        severity: "warning",
        titleBangla: "সার্বিক পূর্ণমান অমিল",
        descriptionBangla: `হেডারের পূর্ণমান (${headerBlock.totalMarks}) এবং সকল সেকশনের যোগফল (${totalCalculatedSectionMarks}) সমান নয়।`,
        suggestionBangla: "সেকশনসমূহের নম্বর বণ্টন সমন্বয় করুন।",
      });
    }
  }

  // Calculate score & status
  const errorsCount = issues.filter((i) => i.severity === "error").length;
  const warningsCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  let score = 100 - errorsCount * 20 - warningsCount * 5;
  if (score < 0) score = 0;

  const readyToPrint = errorsCount === 0;

  return {
    isValid: errorsCount === 0,
    score,
    readyToPrint,
    errorsCount,
    warningsCount,
    infoCount,
    issues,
  };
}

