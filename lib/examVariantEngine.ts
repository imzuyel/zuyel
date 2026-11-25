/**
 * Exam Variant Shuffler & Answer Key Engine
 * Generates Set A, Set B, Set C, Set D variants with deterministic seeds.
 * Crucially maintains synchronized Answer Key mappings whenever options are shuffled.
 */

import {
  ExamDocument,
  ExamVariant,
  ExamAnswerKeyConfig,
  ExamAnswerKeyItem,
  SectionBlock,
  QuestionNode,
} from "./examPaperEngine";
import { formatIndexToBadge } from "./examNumberingEngine";

// Simple Linear Congruential Generator for reproducible pseudo-random sequences
function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Generates an ExamVariant (Set B, C, or D) by shuffling question order and option positions.
 * Synchronizes the answer key so that the teacher copy remains 100% accurate.
 */
export function generateExamVariant(
  originalDoc: ExamDocument,
  setLabel: "Set A" | "Set B" | "Set C" | "Set D",
  seed: number
): { variantDoc: ExamDocument; variantMeta: ExamVariant; answerKey: ExamAnswerKeyConfig } {
  const rng = createSeededRandom(seed);
  const variantDoc: ExamDocument = JSON.parse(JSON.stringify(originalDoc));

  // Update title & header to reflect Set
  variantDoc.title = `${originalDoc.title} (${setLabel})`;
  const headerBlock = variantDoc.blocks.find((b) => b.type === "HEADER_BLOCK");
  if (headerBlock && headerBlock.type === "HEADER_BLOCK") {
    headerBlock.examTitle = `${headerBlock.examTitle} [${setLabel}]`;
  }

  const questionOrderMap: Record<string, string[]> = {};
  const optionShuffleMap: Record<string, number[]> = {};
  const answerKeyItems: ExamAnswerKeyItem[] = [];

  for (const block of variantDoc.blocks) {
    if (block.type !== "SECTION_BLOCK") continue;
    const sec = block as SectionBlock;

    // Shuffle questions within section (if not Set A)
    if (setLabel !== "Set A" && sec.questions.length > 1) {
      // Fisher-Yates with seeded RNG
      for (let i = sec.questions.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [sec.questions[i], sec.questions[j]] = [sec.questions[j], sec.questions[i]];
      }
    }

    questionOrderMap[sec.id] = sec.questions.map((q) => q.id);

    // Shuffle MCQ options and maintain exact Answer Key mapping
    for (let qIdx = 0; qIdx < sec.questions.length; qIdx++) {
      const q = sec.questions[qIdx];
      const qBadge = formatIndexToBadge(qIdx, sec.questionNumberSystem, q.customNumberOverride);

      if (q.questionType === "mcq" && q.options && q.options.length > 1) {
        const originalOptions = [...q.options];
        const originalCorrectAnswerText =
          typeof q.correctAnswer === "string"
            ? q.correctAnswer
            : typeof q.correctAnswer === "number"
            ? originalOptions[q.correctAnswer]
            : originalOptions[0];

        // Create index array [0, 1, 2, 3]
        const indices = originalOptions.map((_, i) => i);

        if (setLabel !== "Set A") {
          for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
          }
        }

        optionShuffleMap[q.id] = indices;
        const newOptions = indices.map((idx) => originalOptions[idx]);
        q.options = newOptions;

        // Find new correct index
        const newCorrectIndex = newOptions.findIndex(
          (opt) => opt.trim().toLowerCase() === originalCorrectAnswerText.trim().toLowerCase()
        );

        if (newCorrectIndex !== -1) {
          q.correctAnswer = newOptions[newCorrectIndex];
          const optionBadge = formatIndexToBadge(newCorrectIndex, sec.optionNumberSystem);

          answerKeyItems.push({
            questionId: q.id,
            sectionId: sec.id,
            questionNumberLabel: qBadge,
            correctAnswerText: `${optionBadge} ${newOptions[newCorrectIndex]}`,
            correctIndex: newCorrectIndex,
            marks: q.marks,
            markingRubric: q.explanation,
          });
        }
      } else {
        // Non-MCQ question answer key entry
        answerKeyItems.push({
          questionId: q.id,
          sectionId: sec.id,
          questionNumberLabel: qBadge,
          correctAnswerText: String(q.correctAnswer || "বর্ণনামূলক উত্তর"),
          marks: q.marks,
          markingRubric: q.rubric || q.explanation,
        });
      }
    }
  }

  const variantMeta: ExamVariant = {
    id: `var-${Date.now()}-${setLabel.replace(/\s+/g, "")}`,
    setLabel,
    seed,
    createdAt: new Date().toISOString(),
    questionOrderMap,
    optionShuffleMap,
  };

  const answerKey: ExamAnswerKeyConfig = {
    items: answerKeyItems,
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  variantDoc.answerKeyConfig = answerKey;

  return { variantDoc, variantMeta, answerKey };
}

