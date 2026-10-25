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
   ARCHETYPE 8: GLASSMORPHIIC CENTER CARD WITH FLOATING 3D TORUS RINGS (Templates 15 & 16)
   Frosted glass center card with responsive mobile GPU optimization and universal feedback.
========================================================================= */
export const Archetype08Component = React.memo(function Archetype08Component({
  question,
  selectedAnswer,
  onSelectAnswer,
  isConfirmed,
  disabled,
}: ArchetypeComponentProps) {
  return (
    <div className="relative w-full p-2">
      {/* Decorative SVG 3D Torus Rings Background (Desktop only to prevent mobile GPU thermal throttling) */}
      <div className="hidden md:block absolute -top-6 -left-6 w-32 h-32 pointer-events-none opacity-40">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full animate-spin"
          style={{ animationDuration: "25s" }}
        >
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="20"
            fill="none"
            stroke="url(#torusGrad)"
            strokeWidth="6"
            transform="rotate(-30 50 50)"
          />
          <defs>
            <linearGradient id="torusGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="hidden md:block absolute -bottom-6 -right-6 w-36 h-36 pointer-events-none opacity-30">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="#a855f7"
            strokeWidth="4"
            strokeDasharray="6 4"
          />
        </svg>
      </div>

      {/* Frosted Glass Center Card */}
      <div className="relative z-10 backdrop-blur-none md:backdrop-blur-xl bg-white/95 md:bg-white/25 dark:bg-slate-900/95 dark:md:bg-slate-900/40 border border-slate-300 dark:border-slate-800 md:border-white/30 md:dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-lg md:shadow-2xl space-y-6">
        <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-relaxed">
          {question.questionText}
        </h3>

        {/* Frosted Option Cards */}
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
                className={`p-4 sm:p-5 rounded-2xl backdrop-blur-none md:backdrop-blur-md text-left transition-all cursor-pointer flex items-center justify-between gap-3 border shadow-md md:shadow-lg ${
                  feedback.containerStyle
                    ? feedback.containerStyle
                    : "bg-slate-50 md:bg-white/40 dark:bg-slate-900/80 md:dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 md:border-white/20 md:dark:border-slate-700/40 text-slate-900 dark:text-slate-100 hover:bg-slate-100 md:hover:bg-white/60"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 shadow-xs ${
                      feedback.badgeStyle
                        ? feedback.badgeStyle
                        : "bg-indigo-600 text-white"
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

export default Archetype08Component;
