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
   ARCHETYPE 1: OPEN CUT-FRAME & CORNER QUESTION MARK (Templates 1 & 2)
   Thick border around question box with top-left corner physically cut open
   where bold '?' sits. Option buttons have open left borders with letter badges.
========================================================================= */
export const Archetype01Component = React.memo(function Archetype01Component({
  question,
  selectedAnswer,
  onSelectAnswer,
  isConfirmed,
  disabled,
  accentColor = "#06B6D4",
  borderColor = "border-cyan-500",
  bgGradient = "bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/60",
}: ArchetypeComponentProps) {
  return (
    <div className="w-full space-y-6">
      {/* Cut-frame Question Box */}
      <div
        className={`relative mt-6 p-6 sm:p-8 rounded-3xl border-4 ${borderColor} ${bgGradient} text-white shadow-lg md:shadow-2xl`}
      >
        {/* Question Mark sitting directly inside cut gap */}
        <div
          className="absolute -top-7 -left-3 px-3 py-1 bg-slate-950 rounded-2xl border-2 border-current font-black text-5xl sm:text-6xl select-none leading-none shadow-md md:shadow-xl"
          style={{ color: accentColor }}
        >
          ?
        </div>

        <div className="pt-2 pl-4">
          <h3 className="text-lg sm:text-2xl font-black leading-relaxed">
            {question.questionText}
          </h3>
        </div>
      </div>

      {/* Options with Open Left Border Gap for Letter Badges */}
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
              className={`relative p-4 sm:p-5 rounded-2xl text-left transition-all cursor-pointer shadow-sm md:shadow-md flex items-center justify-between gap-3 border-2 ${
                feedback.containerStyle
                  ? feedback.containerStyle
                  : `${borderColor} bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white`
              }`}
            >
              {/* Letter sitting inside left border notch */}
              <div
                className={`absolute -left-3 px-2 py-0.5 rounded-lg font-black text-xs border shadow-xs ${
                  feedback.badgeStyle
                    ? feedback.badgeStyle
                    : "bg-slate-900 text-white border-current"
                }`}
                style={!feedback.badgeStyle ? { color: accentColor } : undefined}
              >
                {letter}:
              </div>
              <span className="pl-4 text-xs sm:text-sm font-bold leading-snug break-words flex-1">
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
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default Archetype01Component;
