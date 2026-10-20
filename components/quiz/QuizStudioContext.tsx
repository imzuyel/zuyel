import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ParsedImportedQuestion } from "@/app/api/ai/parse-quiz-text/route";

export interface StudioQuestionItem {
  id: string;
  type: "mcq_single" | "mcq_multiple" | "fill_blank" | "matching" | "true_false" | "short_answer" | "ordering";
  questionText: string;
  options?: string[];
  correctAnswer?: number | boolean;
  correctIndices?: number[];
  acceptedAnswers?: string[];
  pairs?: { left: string; right: string }[];
  expectedAnswerKeyword?: string;
  explanation: string;
  conceptTopic: string;
  marks: number;
  timeLimit: number;
}

interface QuizStudioContextProps {
  draftQuestions: StudioQuestionItem[];
  setDraftQuestions: React.Dispatch<React.SetStateAction<StudioQuestionItem[]>>;
  appendDraftQuestions: (newQuestions: StudioQuestionItem[]) => void;
  removeDraftQuestion: (id: string) => void;
  updateDraftQuestion: (id: string, updates: Partial<StudioQuestionItem>) => void;
  clearDraftQuestions: () => void;
}

const QuizStudioContext = createContext<QuizStudioContextProps | undefined>(undefined);

export const useQuizStudio = () => {
  const ctx = useContext(QuizStudioContext);
  if (!ctx) {
    throw new Error('useQuizStudio must be used within QuizStudioProvider');
  }
  return ctx;
};

export const QuizStudioProvider = ({ children }: { children: ReactNode }) => {
  const [draftQuestions, setDraftQuestions] = useState<StudioQuestionItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('quizStudioDraft');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDraftQuestions(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load draft questions from localStorage:", e);
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('quizStudioDraft', JSON.stringify(draftQuestions));
    } catch (e) {
      console.warn("Failed to save draft questions to localStorage:", e);
    }
  }, [draftQuestions]);

  const appendDraftQuestions = (newQuestions: StudioQuestionItem[]) => {
    if (!Array.isArray(newQuestions) || newQuestions.length === 0) return;
    setDraftQuestions((prev) => [...prev, ...newQuestions]);
  };

  const removeDraftQuestion = (id: string) => {
    setDraftQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateDraftQuestion = (id: string, updates: Partial<StudioQuestionItem>) => {
    setDraftQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const clearDraftQuestions = () => {
    setDraftQuestions([]);
  };

  const value: QuizStudioContextProps = {
    draftQuestions,
    setDraftQuestions,
    appendDraftQuestions,
    removeDraftQuestion,
    updateDraftQuestion,
    clearDraftQuestions,
  };
  return <QuizStudioContext.Provider value={value}>{children}</QuizStudioContext.Provider>;
};
