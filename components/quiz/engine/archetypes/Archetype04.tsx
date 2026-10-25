"use client";

import React from "react";
import { Check, X } from "lucide-react";
import {
  ArchetypeComponentProps,
  isOptSelected,
  isOptCorrect,
  getUniversalOptionFeedback,
} from "./shared";

/* =========================================================================
   ARCHETYPE 4: 3D CLAYMORPHISM PUFFY PILLOW & SPARKLES (Templates 7 & 8)
   Puffy pillow question container with universal feedback styling.
========================================================================= */
export const Archetype04Component = React.memo(function Archetype04Component({
  question,
  selectedAnswer,
  onSelectAnswer,
  isConfirmed,
  disabled,
  pillowBg = "bg-gradient-to-b from-purple-100 to-pink-100 dark:from-purple-950/60 dark:to-pink-950/60",
}: ArchetypeComponentProps) {
  return (
    <div className="w-full space-y-6">
      {/* Puffy Pillow Question Card */}
      <div
        className={`p-6 sm:p-9 rounded-[2rem] sm:rounded-[2.5rem] border-4 border-white/60 dark:border-slate-700/60 shadow-lg md:shadow-[inset_0_-8px_12px_rgba(0,0,0,0.15),0_12px_20px_rgba(0,0,0,0.2),0_6px_0_rgba(0,0,0,0.1)] ${pillowBg}`}
      >
        <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-relaxed text-center">
          {question.questionText}
        </h3>
      </div>

      {/* Puffy 3D Clay Option Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {question.options.map((opt: string, idx: number) => {
          const letter = String.fromCharCode(65 + idx);
          const isSelected = isOptSelected(selectedAnswer, idx, opt);
          const isCorrectAnswer = isOptCorrect(
            question.correctOptionIndex,
            idx,
            opt,
            (question as any).correctAnswer
          );
          const feedback = getUniversalOptionFeedback(isSelected, isConfirmed, isCorrectAnswer);

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled || isConfirmed}
              onClick={() => onSelectAnswer(idx)}
              className={`p-4 sm:p-5 rounded-[1.75rem] sm:rounded-[2rem] text-left transition-all cursor-pointer flex items-center justify-between gap-3 border-2 border-white/70 dark:border-slate-700/70 shadow-md md:shadow-[inset_0_-6px_8px_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.15),0_4px_0_rgba(0,0,0,0.1)] active:translate-y-1 ${
                feedback.containerStyle
                  ? feedback.containerStyle
                  : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span
                  className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 shadow-inner ${
                    feedback.badgeStyle
                      ? feedback.badgeStyle
                      : "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white"
                  }`}
                >
                  {letter}
                </span>
                <span className="text-xs sm:text-sm font-bold leading-snug break-words flex-1">
                  {opt}
                </span>
              </div>

              {feedback.statusIcon === "correct" && (
                <span className="shrink-0 p-1 rounded-full bg-emerald-500 text-white shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
              {feedback.statusIcon === "incorrect" && (
                <span className="shrink-0 p-1 rounded-full bg-rose-500 text-white shadow-xs">
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
              {feedback.statusIcon === "selected" && (
                <span className="shrink-0 p-1 rounded-full bg-indigo-600 text-white shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default Archetype04Component;
