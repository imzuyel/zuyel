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
   ARCHETYPE 2: HEXAGONAL CONNECTED NODES (Templates 3 & 4)
   Both Question box and Option buttons use hexagonal clip-path.
========================================================================= */
export const Archetype02Component = React.memo(function Archetype02Component({
  question,
  selectedAnswer,
  onSelectAnswer,
  isConfirmed,
  disabled,
  accentColor = "#10B981",
  bgClass = "bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950",
}: ArchetypeComponentProps) {
  const hexClip = "polygon(4% 0%, 96% 0%, 100% 50%, 96% 100%, 4% 100%, 0% 50%)";

  return (
    <div className="w-full space-y-6">
      {/* Hexagonal Question Node */}
      <div className="relative">
        <div
          className={`p-6 sm:p-8 text-white text-center shadow-md md:shadow-xl ${bgClass}`}
          style={{ clipPath: hexClip }}
        >
          <h3 className="text-lg sm:text-2xl font-black leading-relaxed max-w-3xl mx-auto px-4">
            {question.questionText}
          </h3>
        </div>

        {/* Central Vertical Connector Line */}
        <div className="w-1 h-6 mx-auto" style={{ backgroundColor: accentColor }} />
      </div>

      {/* Hexagonal Connected Option Buttons */}
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
            <div key={idx} className="relative flex items-center">
              {/* Horizontal Connecting Wire */}
              <div
                className="hidden sm:block w-4 h-[3px] shrink-0"
                style={{ backgroundColor: accentColor }}
              />

              <button
                type="button"
                disabled={disabled || isConfirmed}
                onClick={() => onSelectAnswer(idx)}
                style={{ clipPath: hexClip }}
                className={`flex-1 p-4 sm:p-5 transition-all cursor-pointer flex items-center justify-between gap-3 text-left shadow-md md:shadow-lg ${
                  feedback.containerStyle
                    ? feedback.containerStyle
                    : "bg-slate-900 text-slate-100 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 border ${
                      feedback.badgeStyle
                        ? feedback.badgeStyle
                        : "bg-slate-950 text-white border-current"
                    }`}
                    style={!feedback.badgeStyle ? { color: accentColor } : undefined}
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
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default Archetype02Component;
