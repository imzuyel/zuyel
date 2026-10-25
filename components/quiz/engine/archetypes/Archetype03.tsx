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
   ARCHETYPE 3: KEYHOLE NOTCH NEON OUTLINE (Templates 5 & 6)
   Question box has circular '?' notch protruding from bottom-center border.
   Option buttons are keyhole-shaped with universal feedback styling.
========================================================================= */
export const Archetype03Component = React.memo(function Archetype03Component({
  question,
  selectedAnswer,
  onSelectAnswer,
  isConfirmed,
  disabled,
  accentColor = "#EC4899",
}: ArchetypeComponentProps) {
  return (
    <div className="w-full space-y-8">
      {/* Question Box with Bottom Keyhole Notch */}
      <div
        className="relative p-6 sm:p-8 rounded-3xl bg-slate-950 border-2 text-white shadow-lg md:shadow-2xl"
        style={{ borderColor: accentColor }}
      >
        <h3 className="text-lg sm:text-2xl font-black leading-relaxed text-center pb-2">
          {question.questionText}
        </h3>

        {/* Protruding Bottom-Center Circular Notch */}
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-slate-950 border-2 flex items-center justify-center font-black text-lg shadow-md md:shadow-xl"
          style={{ borderColor: accentColor, color: accentColor }}
        >
          ?
        </div>
      </div>

      {/* Keyhole Option Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
              className="group flex items-center text-left cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {/* Circle on Left */}
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center font-black text-sm shrink-0 z-10 transition-all ${
                  feedback.badgeStyle
                    ? feedback.badgeStyle
                    : "bg-slate-950 text-white border-slate-700 group-hover:border-current"
                }`}
                style={!feedback.badgeStyle ? { borderColor: accentColor } : undefined}
              >
                {letter}
              </div>

              {/* Smooth Pill Bar on Right overlapping the circle */}
              <div
                className={`-ml-5 flex-1 pl-7 pr-4 py-3.5 sm:py-4 rounded-r-2xl border-y-2 border-r-2 transition-all flex items-center justify-between gap-2 ${
                  feedback.containerStyle
                    ? feedback.containerStyle
                    : "bg-slate-900 text-slate-200 border-slate-800 group-hover:border-slate-700"
                }`}
              >
                <span className="text-xs sm:text-sm font-bold break-words leading-snug flex-1">
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
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default Archetype03Component;
