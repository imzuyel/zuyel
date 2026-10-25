"use client";

import React from "react";

export type QuestionTypeUniversal =
  | "MCQ"
  | "TRUE_FALSE"
  | "FILL_BLANKS"
  | "MATCHING"
  | "REORDER"
  | "DRAG_DROP";

export interface MatchingPairItem {
  id?: string;
  left: string;
  right: string;
}

export interface NormalizedQuizQuestion {
  id: string | number;
  questionType: QuestionTypeUniversal;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  correctBoolean?: boolean;
  acceptedAnswers?: string[];
  matchingPairs?: MatchingPairItem[];
  correctOrder?: string[];
  explanation?: string;
  marks?: number;
  timeLimit?: number;
}

export interface QuizTemplateProps {
  question: NormalizedQuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: any;
  onSelectAnswer: (answer: any) => void;
  isConfirmed?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
  timeRemaining?: number;
}

export interface TemplateDefinition {
  id: number;
  name: string;
  nameBangla: string;
  description: string;
  category:
    | "cyberpunk"
    | "claymorphism"
    | "gradient"
    | "minimal"
    | "retro"
    | "futuristic"
    | "brutalist"
    | "neumorphic"
    | "sketch"
    | "luxury"
    | "origami"
    | "synthwave"
    | "crystal"
    | "organic"
    | "steampunk"
    | "comic"
    | "scifi"
    | string;
  accentColor: string;
  component: React.ComponentType<QuizTemplateProps>;
}
