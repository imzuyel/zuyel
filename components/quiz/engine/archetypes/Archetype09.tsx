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
   ARCHETYPE 9: SVG TREE-BRANCH MINDMAP CONNECTORS (Templates 17 & 18)
   Question node at top with SVG curved Bezier lines branching into each option card.
========================================================================= */
export const Archetype09Component = React.memo(function Archetype09Component({
  question,
  selectedAnswer,
  onSelectAnswer,
  isConfirmed,
  disabled,
  branchColor = "#06B6D4",
}: ArchetypeComponentProps) {
  return (
    <div className="w-full space-y-4">
      {/* Central Question Node */}
      <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-slate-900 text-white text-center border-2 border-cyan-500/50 shadow-lg md:shadow-2xl relative z-10">
        <h3 className="text-lg sm:text-xl font-black leading-relaxed">
          {question.questionText}
        </h3>
      </div>

      {/* SVG Tree-Branch Bezier Connectors */}
      <div className="w-full h-10 relative pointer-events-none">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
          <path
            d="M 50 0 C 50 20, 15 20, 15 40"
            stroke={branchColor}
            strokeWidth="2.5"
            fill="none"
            strokeDasharray="3 2"
          />
          <path
            d="M 50 0 C 50 20, 38 20, 38 40"
            stroke={branchColor}
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M 50 0 C 50 20, 62 20, 62 40"
            stroke={branchColor}
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M 50 0 C 50 20, 85 20, 85 40"
            stroke={branchColor}
            strokeWidth="2.5"
            fill="none"
            strokeDasharray="3 2"
          />
        </svg>
      </div>

      {/* Option Leaf Cards */}
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
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 text-left shadow-sm md:shadow-lg ${
                feedback.containerStyle
                  ? feedback.containerStyle
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:border-cyan-300"
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span
                  className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                    feedback.badgeStyle
                      ? feedback.badgeStyle
                      : "text-slate-950"
                  }`}
                  style={!feedback.badgeStyle ? { backgroundColor: branchColor } : undefined}
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

export default Archetype09Component;
