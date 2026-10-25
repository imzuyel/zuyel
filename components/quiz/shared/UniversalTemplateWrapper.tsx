"use client";

import React from "react";
import UniversalQuizShowcaseEngine from "../engine/UniversalQuizShowcaseEngine";

export interface UniversalTemplateWrapperProps {
  question: any;
  questionIndex?: number;
  totalQuestions?: number;
  selectedAnswer: any;
  onSelectAnswer: (ans: any) => void;
  onConfirmAnswer?: (ans: any) => void;
  isConfirmed?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
  templateId?: number;
  autoRandomize?: boolean;
  onTemplateChange?: (newTemplateId: number) => void;
  showControlsBar?: boolean;
  timeRemaining?: number;
}

export function UniversalTemplateWrapper({
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
  autoRandomize = true,
  onTemplateChange,
  timeRemaining,
}: UniversalTemplateWrapperProps) {
  return (
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
      templateId={templateId}
      autoRandomize={autoRandomize}
      onTemplateChange={onTemplateChange}
      showProofBadge={true}
    />
  );
}

export default UniversalTemplateWrapper;
