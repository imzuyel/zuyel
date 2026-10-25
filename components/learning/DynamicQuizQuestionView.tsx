"use client";

import React, { useMemo, useState } from "react";
import { QuizQuestionItem } from "@/lib/chapterLearningEngine";
import { Sparkles, HelpCircle } from "lucide-react";
import UniversalQuizShowcaseEngine from "@/components/quiz/engine/UniversalQuizShowcaseEngine";

interface DynamicQuizQuestionViewProps {
  question: QuizQuestionItem;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: any;
  onSelectAnswer: (answer: any) => void;
  onConfirmAnswer?: (answer: any) => void;
  isConfirmed?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
}

export function DynamicQuizQuestionView({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  onConfirmAnswer,
  isConfirmed = false,
  isCorrect,
  disabled = false,
}: DynamicQuizQuestionViewProps) {
  return (
    <div className="w-full space-y-3">
      <UniversalQuizShowcaseEngine
        question={question}
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={onSelectAnswer}
        onConfirmAnswer={onConfirmAnswer}
        isConfirmed={isConfirmed}
        isCorrect={isCorrect}
        disabled={disabled}
        autoRandomize={true}
        showProofBadge={true}
      />

      {isConfirmed && question.explanation && (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900 dark:text-white font-bold">ব্যাখ্যা: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DynamicQuizQuestionView;
