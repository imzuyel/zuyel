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
   ARCHETYPE 7: 3D TILTED ISOMETRIC TRAY CARD (Templates 13 & 14)
   Thick molded tray with header bar and tactile push-buttons with universal feedback.
========================================================================= */
export const Archetype07Component = React.memo(function Archetype07Component({
  question,
  selectedAnswer,
  onSelectAnswer,
  isConfirmed,
  disabled,
  trayBorder = "border-amber-500",
  headerBar = "bg-amber-500",
}: ArchetypeComponentProps) {
  return (
    <div
      className={`rounded-3xl border-2 border-r-4 md:border-r-6 border-b-6 md:border-b-8 ${trayBorder} bg-slate-100 dark:bg-slate-950 overflow-hidden shadow-lg md:shadow-2xl`}
    >
      {/* Colored Header Bar Accent */}
      <div className={`h-2.5 w-full ${headerBar}`} />

      {/* Recessed Inner Body */}
      <div className="p-6 sm:p-8 space-y-6 shadow-inner">
        <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-relaxed">
          {question.questionText}
        </h3>

        {/* Raised 3D Push-Buttons */}
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
                className={`p-4 sm:p-5 rounded-2xl text-left border-2 border-r-3 md:border-r-4 border-b-4 md:border-b-6 transition-all cursor-pointer flex items-center justify-between gap-3 active:translate-y-1 active:border-b-2 ${
                  feedback.containerStyle
                    ? feedback.containerStyle
                    : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 hover:border-slate-400"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                      feedback.badgeStyle
                        ? feedback.badgeStyle
                        : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
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
    </div>
  );
});

export default Archetype07Component;
