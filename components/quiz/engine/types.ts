"use client";

import React from "react";

export type QuestionTypeUniversal =
  | "MCQ"
  | "TRUE_FALSE"
  | "FILL_BLANKS"
  | "MATCHING"
  | "REORDER";

export interface MatchingPairItem {
  id?: string | number;
  left: string;
  right: string;
}

export interface NormalizedQuizQuestion {
  id: string | number;
  questionType: QuestionTypeUniversal;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  correctAnswer?: any;
  correctBoolean?: boolean;
  acceptedAnswers?: string[];
  matchingPairs?: MatchingPairItem[];
  correctOrder?: string[];
  explanation?: string;
  marks?: number;
  timeLimit?: number;
  conceptTopic?: string;
  imageUrl?: string;
}

export interface UniversalQuizEngineProps {
  question: any;
  questionIndex?: number;
  totalQuestions?: number;
  selectedAnswer: any;
  onSelectAnswer: (answer: any) => void;
  onConfirmAnswer?: (answer: any) => void;
  isConfirmed?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
  timeRemaining?: number;
  templateId?: number; // Optional forced template 1-20
  autoRandomize?: boolean; // Default true: changes on each question
  onTemplateChange?: (newTemplateId: number) => void;
  showProofBadge?: boolean; // Default true: shows top-right visual proof badge
  showControlsBar?: boolean; // Default false or subtle
  hideQuestionHeader?: boolean; // If parent renders question text
}

export interface MCQArchetypeTemplate {
  id: number;
  archetypeId: number;
  archetypeName: string;
  archetypeNameBangla: string;
  variantName: string;
  accentColor: string;
  glowColor: string;
  component: React.ComponentType<{
    question: NormalizedQuizQuestion;
    questionIndex: number;
    totalQuestions: number;
    selectedAnswer: any;
    onSelectAnswer: (answer: any) => void;
    isConfirmed?: boolean;
    isCorrect?: boolean;
    disabled?: boolean;
  }>;
}
