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
   ARCHETYPE 5: 3D FOLDED RIBBON HEADER & DETACHED SQUARE BADGES (Templates 9 & 10)
   Question box has 3D folded ribbon accent. Options are full-width horizontal
   bars with detached square boxes and universal feedback styling.
========================================================================= */
export const Archetype05Component = React.memo(function Archetype05Component({
  question,
  selectedAnswer,
  onSelectAnswer,
  isConfirmed,
  disabled,
  ribbonColor = "bg-amber-500",
}: ArchetypeComponentProps) {
  return (
    <div className="w-full space-y-6">
      {/* Question Box with Overlapping Ribbon */}
      <div className="relative pt-6 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-md md:shadow-xl">
        {/* 3D Folded Ribbon Accent Overlapping Top */}
        <div className="absolute -top-3 left-6 flex items-center">
          <div className={`w-12 h-3.5 shadow-sm md:shadow-md rounded-t-sm ${ribbonColor}`} />
          <div
            className="w-3 h-5 bg-black/40"
            style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
          />
        </div>

        <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-relaxed mt-1">
          {question.questionText}
        </h3>
      </div>

      {/* Options with Detached Square Badges */}
      <div className="space-y-3">
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
            <div
              key={idx}
              onClick={() => !disabled && !isConfirmed && onSelectAnswer(idx)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              {/* Detached Square Badge */}
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border-2 shadow-xs md:shadow-md transition-transform group-hover:scale-105 ${
                  feedback.badgeStyle
                    ? feedback.badgeStyle
                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                }`}
              >
                {letter}
              </div>

              {/* Full-Width Horizontal Bar */}
              <div
                className={`flex-1 p-3.5 sm:p-4 rounded-xl border-2 transition-all shadow-xs md:shadow-sm flex items-center justify-between gap-3 ${
                  feedback.containerStyle
                    ? feedback.containerStyle
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 group-hover:border-slate-300"
                }`}
              >
                <span className="text-xs sm:text-sm font-semibold break-words leading-snug flex-1">
                  {opt}
                </span>

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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default Archetype05Component;
