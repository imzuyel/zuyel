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
   ARCHETYPE 10: CYBERPUNK CHAMFERED HUD POLYGONS (Templates 19 & 20)
   45-degree sliced corners with universal feedback styling.
========================================================================= */
export const Archetype10Component = React.memo(function Archetype10Component({
  question,
  selectedAnswer,
  onSelectAnswer,
  isConfirmed,
  disabled,
  techColor = "#22C55E",
}: ArchetypeComponentProps) {
  const chamferClip =
    "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)";

  return (
    <div className="w-full space-y-6 font-mono">
      {/* Chamfered Question HUD Card */}
      <div
        style={{ clipPath: chamferClip }}
        className="relative p-6 sm:p-8 bg-slate-950 border-2 text-white shadow-lg md:shadow-2xl"
      >
        <h3 className="text-lg sm:text-2xl font-black leading-relaxed">
          {question.questionText}
        </h3>
      </div>

      {/* Chamfered Option Buttons */}
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
              style={{
                clipPath: chamferClip,
                borderColor: !feedback.containerStyle && isSelected ? techColor : undefined,
              }}
              className={`p-4 sm:p-5 text-left transition-all cursor-pointer flex items-center justify-between gap-3 border shadow-sm md:shadow-lg ${
                feedback.containerStyle
                  ? feedback.containerStyle
                  : "bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span
                  className={`w-7 h-7 flex items-center justify-center font-black text-xs shrink-0 ${
                    feedback.badgeStyle
                      ? feedback.badgeStyle
                      : "text-slate-950"
                  }`}
                  style={!feedback.badgeStyle ? { backgroundColor: techColor } : undefined}
                >
                  {letter}
                </span>
                <span className="text-xs sm:text-sm font-semibold break-words leading-snug flex-1">
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

export default Archetype10Component;
