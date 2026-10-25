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
   ARCHETYPE 6: GIANT FLOATING 3D '?' & ASYMMETRIC LEAF PILLS (Templates 11 & 12)
   Open header with floating '?' and geometric SVG triangles.
   Option buttons have asymmetric leaf badges with universal feedback styling.
========================================================================= */
export const Archetype06Component = React.memo(function Archetype06Component({
  question,
  selectedAnswer,
  onSelectAnswer,
  isConfirmed,
  disabled,
  accentColor = "#06B6D4",
}: ArchetypeComponentProps) {
  return (
    <div className="w-full space-y-6">
      {/* Open Header with Floating Giant '?' and Geometric SVG Triangles */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-slate-900 text-white overflow-hidden shadow-lg md:shadow-2xl flex items-center justify-between gap-4">
        {/* Decorative Floating Triangles */}
        <svg
          className="absolute -top-2 right-20 w-16 h-16 text-white/5 pointer-events-none hidden sm:block"
          viewBox="0 0 100 100"
        >
          <polygon points="50,15 90,85 10,85" fill="currentColor" />
        </svg>

        <div className="flex-1 space-y-2 z-10">
          <h3 className="text-lg sm:text-2xl font-black leading-relaxed">
            {question.questionText}
          </h3>
        </div>

        {/* Giant Floating 3D '?' */}
        <div
          className="text-6xl sm:text-8xl font-black select-none pointer-events-none drop-shadow-sm md:drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] shrink-0"
          style={{ color: accentColor }}
        >
          ?
        </div>
      </div>

      {/* Asymmetric Leaf Pills */}
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
              className={`p-1.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 text-left shadow-sm md:shadow-md ${
                feedback.containerStyle
                  ? feedback.containerStyle
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Asymmetric Leaf-Shaped Badge */}
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-tl-3xl rounded-bl-3xl rounded-tr-none rounded-br-3xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                    feedback.badgeStyle
                      ? feedback.badgeStyle
                      : "text-slate-950"
                  }`}
                  style={!feedback.badgeStyle ? { backgroundColor: accentColor } : undefined}
                >
                  {letter}
                </div>
                <span className="text-xs sm:text-sm font-semibold break-words leading-snug flex-1 pr-1">
                  {opt}
                </span>
              </div>

              {feedback.statusIcon === "correct" && (
                <span className="shrink-0 mr-2 p-1 rounded-full bg-emerald-500 text-white shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
              {feedback.statusIcon === "incorrect" && (
                <span className="shrink-0 mr-2 p-1 rounded-full bg-rose-500 text-white shadow-xs">
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
              {feedback.statusIcon === "selected" && (
                <span className="shrink-0 mr-2 p-1 rounded-full bg-indigo-600 text-white shadow-xs">
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

export default Archetype06Component;
