"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  NormalizedQuizQuestion,
  QuestionTypeUniversal,
  UniversalQuizEngineProps,
  MCQArchetypeTemplate,
} from "./types";
import { ArchetypeSkeleton } from "./archetypes/ArchetypeSkeleton";
import { isOptionMatch } from "./archetypes/shared";

/* =========================================================================
   LIGHT & FAST ARCHITECTURE (ZERO BLOAT, 1 SIGNATURE TEMPLATE PER TYPE):
   - MATCHING: Dedicated 2-Column SVG Cross-Line Matching Board
   - FILL_BLANKS: Dedicated Inline Capsule Input & Word-Bank Chips
   - REORDER: Dedicated Draggable / Arrow Sequence Reordering Cards
   - TRUE_FALSE: Dedicated Symmetrical True / False Cards
   - MCQ: 1 Ultra-Fast Responsive Light/Dark Mode 2x2 Interactive Cards (A, B, C, D)
========================================================================= */

const DynamicMatchingBoard = dynamic(() => import("./MatchingBoardTemplates"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton title="ম্যাচিং বোর্ড লোড হচ্ছে..." />,
});

const DynamicFillBlanks = dynamic(() => import("./FillBlanksTemplates"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton title="শূন্যস্থান পূরণ লোড হচ্ছে..." />,
});

const DynamicReorderSequence = dynamic(() => import("./ReorderSequenceTemplates"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton title="ক্রম সাজানো বোর্ড লোড হচ্ছে..." />,
});

const DynamicTrueFalse = dynamic(() => import("./TrueFalseTemplates"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton title="সত্য / মিথ্যা লোড হচ্ছে..." />,
});

// A, B, C, D Badges & Color Accents
const OPTION_BADGES = [
  { label: "A", shape: "▲", color: "from-cyan-500 to-blue-600", border: "border-cyan-500/50", text: "text-cyan-400", lightBg: "bg-cyan-50", darkBg: "bg-cyan-950/30" },
  { label: "B", shape: "◆", color: "from-purple-500 to-indigo-600", border: "border-purple-500/50", text: "text-purple-400", lightBg: "bg-purple-50", darkBg: "bg-purple-950/30" },
  { label: "C", shape: "●", color: "from-amber-500 to-orange-600", border: "border-amber-500/50", text: "text-amber-400", lightBg: "bg-amber-50", darkBg: "bg-amber-950/30" },
  { label: "D", shape: "■", color: "from-emerald-500 to-teal-600", border: "border-emerald-500/50", text: "text-emerald-400", lightBg: "bg-emerald-50", darkBg: "bg-emerald-950/30" },
];

/**
 * 1 SIGNATURE ULTRA-CLEAN FAST MCQ TEMPLATE (LIGHT & DARK MODE READY)
 */
function SignatureFastMCQ({
  question,
  questionIndex = 0,
  totalQuestions = 1,
  selectedAnswer,
  onSelectAnswer,
  isConfirmed = false,
  isCorrect,
  disabled = false,
}: {
  question: NormalizedQuizQuestion;
  questionIndex?: number;
  totalQuestions?: number;
  selectedAnswer: any;
  onSelectAnswer?: (ans: any) => void;
  isConfirmed?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
}) {
  const options = question.options || [];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      {/* Question Header Card */}
      <div className="relative p-5 sm:p-7 rounded-3xl bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border-2 border-slate-800 dark:border-slate-800 shadow-xl backdrop-blur-md transition-all">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black tracking-wider uppercase">
            <span>বহুনির্বাচনী প্রশ্ন (MCQ)</span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            প্রশ্ন {questionIndex + 1} / {totalQuestions}
          </span>
        </div>

        <h3 className="text-lg sm:text-2xl font-black text-white dark:text-white light:text-slate-900 leading-snug pt-3">
          {question.questionText}
        </h3>
      </div>

      {/* 2x2 Interactive Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {options.map((optText, idx) => {
          const badge = OPTION_BADGES[idx % OPTION_BADGES.length];
          const isSelected = selectedAnswer !== null && selectedAnswer !== undefined && (
            selectedAnswer === idx ||
            String(selectedAnswer) === String(idx) ||
            String(selectedAnswer) === String(optText)
          );

          // Feedback Styling when answer is confirmed & revealed
          let stateStyle = "bg-slate-900/70 dark:bg-slate-900/70 light:bg-slate-50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 text-slate-200";

          if (isConfirmed && isCorrect !== undefined) {
            const isTrueCorrect = question.correctOptionIndex === idx || isOptionMatch(optText, idx, question.correctAnswer);
            if (isTrueCorrect) {
              stateStyle = "bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]";
            } else if (isSelected && !isTrueCorrect) {
              stateStyle = "bg-rose-500/20 border-2 border-rose-400 text-rose-200 ring-2 ring-rose-400/40";
            } else {
              stateStyle = "bg-slate-950/40 border-slate-900 text-slate-600 opacity-35";
            }
          } else if (isSelected) {
            stateStyle = `bg-gradient-to-r ${badge.color} text-white border-white/60 shadow-lg scale-[1.01] ring-2 ring-cyan-400/50`;
          }

          return (
            <motion.button
              key={idx}
              type="button"
              whileHover={!disabled ? { scale: 1.015 } : {}}
              whileTap={!disabled ? { scale: 0.985 } : {}}
              disabled={disabled}
              onClick={() => onSelectAnswer && onSelectAnswer(idx)}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center gap-3.5 text-left cursor-pointer disabled:cursor-not-allowed ${stateStyle}`}
            >
              {/* Badge Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs font-mono shrink-0 shadow-md transition-all ${
                  isSelected
                    ? "bg-white text-slate-950"
                    : `bg-gradient-to-br ${badge.color} text-white`
                }`}
              >
                <span>{badge.label}</span>
              </div>

              {/* Option Text */}
              <span className="flex-1 font-bold text-sm sm:text-base leading-snug">
                {optText}
              </span>

              {/* Selection Check Indicator */}
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-white text-slate-950 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black">✓</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export const SHOWCASE_TEMPLATES: MCQArchetypeTemplate[] = [
  {
    id: 1,
    archetypeId: 1,
    archetypeName: "Signature Light & Dark Fast Engine",
    archetypeNameBangla: "সিগনেচার ফাস্ট লাইট/ডার্ক ইঞ্জিন",
    variantName: "Dark High-Contrast",
    accentColor: "#06B6D4",
    glowColor: "rgba(6,182,212,0.3)",
    component: (props: any) => <SignatureFastMCQ {...props} />,
  },
  {
    id: 2,
    archetypeId: 1,
    archetypeName: "Signature Light & Dark Fast Engine",
    archetypeNameBangla: "সিগনেচার ফাস্ট লাইট/ডার্ক ইঞ্জিন",
    variantName: "Light Mode Clean",
    accentColor: "#3B82F6",
    glowColor: "rgba(59,130,246,0.3)",
    component: (props: any) => <SignatureFastMCQ {...props} />,
  },
];

export function getShowcaseTemplateById(id?: number): MCQArchetypeTemplate {
  return SHOWCASE_TEMPLATES[0];
}

/* =========================================================================
   UNIVERSAL QUIZ SHOWCASE ENGINE COMPONENT (React.memo)
========================================================================= */
export const UniversalQuizShowcaseEngine = React.memo(function UniversalQuizShowcaseEngine({
  question,
  questionIndex = 0,
  totalQuestions = 1,
  selectedAnswer,
  onSelectAnswer,
  onConfirmAnswer,
  isConfirmed = false,
  isCorrect,
  disabled = false,
  templateId,
  autoRandomize = false,
  onTemplateChange,
  showProofBadge = true,
}: UniversalQuizEngineProps) {
  // Normalize Question from ANY structure (Chapter Quiz, Studio Slides or Live Quiz)
  const normalizedQuestion: NormalizedQuizQuestion = useMemo(() => {
    if (!question) {
      return {
        id: "placeholder",
        questionType: "MCQ",
        questionText: "প্রশ্ন প্রস্তুত হচ্ছে...",
        options: ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
        correctOptionIndex: 0,
      };
    }

    const snap = question.questionSnapshot || question.questionData || {};
    const rawType = String(
      question.questionType ||
      question.type ||
      snap.questionType ||
      snap.type ||
      "MCQ"
    ).toUpperCase();

    let resolvedType: QuestionTypeUniversal = "MCQ";
    if (rawType.includes("TRUE") || rawType.includes("TF") || rawType === "TRUE_FALSE") {
      resolvedType = "TRUE_FALSE";
    } else if (rawType.includes("BLANK") || rawType === "FILL_BLANKS" || rawType === "FILL_BLANK") {
      resolvedType = "FILL_BLANKS";
    } else if (rawType.includes("MATCH") || rawType === "MATCHING") {
      resolvedType = "MATCHING";
    } else if (
      rawType.includes("ORDER") ||
      rawType.includes("REARRANGE") ||
      rawType === "REORDER" ||
      rawType === "ORDERING"
    ) {
      resolvedType = "REORDER";
    }

    // Extract options
    let resolvedOptions: string[] = [];
    if (Array.isArray(question.options) && question.options.length > 0) {
      resolvedOptions = question.options.map((o: any) =>
        typeof o === "string" ? o : o.text || String(o)
      );
    } else if (Array.isArray(snap.options) && snap.options.length > 0) {
      resolvedOptions = snap.options.map((o: any) =>
        typeof o === "string" ? o : o.text || String(o)
      );
    } else if (Array.isArray(question.items) && question.items.length > 0) {
      resolvedOptions = question.items;
    } else if (Array.isArray(snap.items) && snap.items.length > 0) {
      resolvedOptions = snap.items;
    } else if (Array.isArray(snap.steps) && snap.steps.length > 0) {
      resolvedOptions = snap.steps;
    }

    // Extract pairs
    let resolvedPairs =
      question.pairs || question.matchingPairs || snap.pairs || snap.matchingPairs || [];
    if (
      (!Array.isArray(resolvedPairs) || resolvedPairs.length === 0) &&
      typeof (question.correctAnswer || snap.correctAnswer) === "string"
    ) {
      const candidate = String(question.correctAnswer || snap.correctAnswer).trim();
      if (candidate.startsWith("[")) {
        try {
          const parsed = JSON.parse(candidate);
          if (Array.isArray(parsed) && parsed.length > 0) resolvedPairs = parsed;
        } catch {}
      }
    }

    // Extract reorder items
    const resolvedOrder =
      question.reorderItems ||
      question.items ||
      question.correctOrder ||
      snap.reorderItems ||
      snap.items ||
      snap.steps ||
      resolvedOptions;

    // Resolve prompt text (with proper fallbacks for content / title in Fill Blanks, Matching, etc.)
    const resolvedPrompt =
      question.questionText ||
      (resolvedType === "FILL_BLANKS"
        ? (question.sentenceWithBlank || question.content || question.title)
        : (question.title || question.content)) ||
      snap.sentenceWithBlank ||
      snap.questionText ||
      snap.prompt ||
      snap.content ||
      snap.title ||
      "প্রশ্ন প্রস্তুত হচ্ছে...";

    // Resolve raw correct answer
    const rawCorrect =
      question.correctAnswer ??
      snap.correctAnswer ??
      question.blankAnswer ??
      snap.blankAnswer ??
      question.correctOption ??
      snap.correctOption;

    let resolvedCorrectIndex = Number(
      question.correctOptionIndex ?? snap.correctOptionIndex ?? snap.correctIndex ?? -1
    );

    if (resolvedCorrectIndex < 0 || resolvedCorrectIndex >= resolvedOptions.length) {
      if (rawCorrect !== undefined && rawCorrect !== null) {
        const found = resolvedOptions.findIndex((optStr, idx) =>
          isOptionMatch(optStr, idx, rawCorrect)
        );
        if (found !== -1) {
          resolvedCorrectIndex = found;
        } else if (
          !isNaN(Number(rawCorrect)) &&
          Number(rawCorrect) >= 0 &&
          Number(rawCorrect) < resolvedOptions.length
        ) {
          resolvedCorrectIndex = Number(rawCorrect);
        } else {
          resolvedCorrectIndex = 0;
        }
      } else {
        resolvedCorrectIndex = 0;
      }
    }

    return {
      id: question.id || `q-${questionIndex}`,
      questionType: resolvedType,
      questionText: resolvedPrompt,
      options: resolvedOptions,
      correctOptionIndex: resolvedCorrectIndex,
      correctAnswer: rawCorrect,
      correctBoolean:
        typeof question.correctBoolean === "boolean"
          ? question.correctBoolean
          : typeof question.correctAnswer === "boolean"
          ? question.correctAnswer
          : rawCorrect === true || rawCorrect === "true" || snap.correctAnswer === true || snap.correctAnswer === "true",
      acceptedAnswers:
        question.acceptedAnswers ||
        snap.acceptedAnswers ||
        (question.blankAnswer ? [question.blankAnswer] : []) ||
        (rawCorrect && typeof rawCorrect === "string" ? [rawCorrect] : []),
      matchingPairs: resolvedPairs,
      correctOrder: resolvedOrder,
      explanation: question.explanation || snap.explanation,
      marks: question.marks || snap.marks || 100,
      timeLimit: question.timeLimit || snap.timeLimit || 30,
      conceptTopic: question.conceptTopic || snap.conceptTopic,
    };
  }, [question, questionIndex]);

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${normalizedQuestion.id}-${normalizedQuestion.questionType}`}
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="w-full"
        >
          {/* 1. MATCHING: Interactive 2-Column Cross-Line SVG Board */}
          {normalizedQuestion.questionType === "MATCHING" ? (
            <div className="w-full max-w-5xl mx-auto">
              <DynamicMatchingBoard
                question={normalizedQuestion}
                selectedAnswer={selectedAnswer}
                onSelectAnswer={onSelectAnswer || (() => {})}
                onConfirmAnswer={onConfirmAnswer}
                isConfirmed={isConfirmed}
                isCorrect={isCorrect}
                disabled={disabled}
              />
            </div>
          ) : normalizedQuestion.questionType === "FILL_BLANKS" ? (
            /* 2. FILL_BLANKS: Interactive Glowing Capsule Slot & Word-Bank */
            <div className="w-full max-w-5xl mx-auto">
              <DynamicFillBlanks
                question={normalizedQuestion}
                selectedAnswer={selectedAnswer}
                onSelectAnswer={onSelectAnswer || (() => {})}
                onConfirmAnswer={onConfirmAnswer}
                isConfirmed={isConfirmed}
                isCorrect={isCorrect}
                disabled={disabled}
              />
            </div>
          ) : normalizedQuestion.questionType === "REORDER" ? (
            /* 3. REORDER: Draggable / Up-Down Sequence Rearranging Board */
            <div className="w-full max-w-5xl mx-auto">
              <DynamicReorderSequence
                question={normalizedQuestion}
                selectedAnswer={selectedAnswer}
                onSelectAnswer={onSelectAnswer || (() => {})}
                onConfirmAnswer={onConfirmAnswer}
                isConfirmed={isConfirmed}
                isCorrect={isCorrect}
                disabled={disabled}
              />
            </div>
          ) : normalizedQuestion.questionType === "TRUE_FALSE" ? (
            /* 4. TRUE_FALSE: Symmetrical Neutral Dual Cards */
            <div className="w-full max-w-5xl mx-auto">
              <DynamicTrueFalse
                question={normalizedQuestion}
                selectedAnswer={selectedAnswer}
                onSelectAnswer={onSelectAnswer || (() => {})}
                onConfirmAnswer={onConfirmAnswer}
                isConfirmed={isConfirmed}
                isCorrect={isCorrect}
                disabled={disabled}
              />
            </div>
          ) : (
            /* 5. MCQ: 1 Signature Ultra-Fast Responsive Template */
            <SignatureFastMCQ
              question={normalizedQuestion}
              questionIndex={questionIndex}
              totalQuestions={totalQuestions}
              selectedAnswer={selectedAnswer}
              onSelectAnswer={onSelectAnswer}
              isConfirmed={isConfirmed}
              isCorrect={isCorrect}
              disabled={disabled}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

export default UniversalQuizShowcaseEngine;
