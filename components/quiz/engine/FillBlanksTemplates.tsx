"use client";

import React, { useState, useMemo } from "react";
import { CheckCircle2, XCircle, Check, HelpCircle } from "lucide-react";
import { NormalizedQuizQuestion } from "./types";

interface FillBlanksProps {
  question: NormalizedQuizQuestion;
  selectedAnswer: any;
  onSelectAnswer: (answer: any) => void;
  onConfirmAnswer?: (answer: any) => void;
  isConfirmed?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
}

/**
 * FILL IN THE BLANKS - Strictly Locked to Inline Glowing Capsule Slot Style (Task 3)
 * Full responsive wrapping, zero text/input overflow on mobile or desktop.
 */
export const FillBlanksTemplates = React.memo(function FillBlanksTemplates({
  question,
  selectedAnswer,
  onSelectAnswer,
  onConfirmAnswer,
  isConfirmed = false,
  isCorrect,
  disabled = false,
}: FillBlanksProps) {
  const prompt =
    question.questionText || "শূন্যস্থানে সঠিক শব্দ লিখুন: ___ একটি গুরুত্বপূর্ণ উপাদান।";

  // Parse prompt for inline blanks: [word] or ___
  const segments = useMemo(() => {
    return prompt.split(/(\[.*?\]|___+)/g);
  }, [prompt]);

  const hasInlineTokens = segments.length > 1;

  // Extract initial input values from selectedAnswer
  const getInputValue = (idx: number): string => {
    if (!selectedAnswer) return "";
    if (typeof selectedAnswer === "string") {
      return idx === 0 ? selectedAnswer : "";
    }
    if (Array.isArray(selectedAnswer)) {
      return selectedAnswer[idx] || "";
    }
    if (typeof selectedAnswer === "object") {
      return selectedAnswer[idx] || selectedAnswer[String(idx)] || "";
    }
    return "";
  };

  const handleUpdateValue = (blankIdx: number, val: string) => {
    if (disabled || isConfirmed) return;

    if (!hasInlineTokens) {
      onSelectAnswer(val);
      return;
    }

    const currentMap: Record<number, string> =
      typeof selectedAnswer === "object" && !Array.isArray(selectedAnswer) && selectedAnswer !== null
        ? { ...selectedAnswer }
        : {};

    currentMap[blankIdx] = val;
    onSelectAnswer(currentMap);
  };

  // Check if at least one blank has text
  const isAnswerProvided = useMemo(() => {
    if (!selectedAnswer) return false;
    if (typeof selectedAnswer === "string") return selectedAnswer.trim().length > 0;
    if (typeof selectedAnswer === "object") {
      return Object.values(selectedAnswer).some(
        (v) => typeof v === "string" && v.trim().length > 0
      );
    }
    return false;
  }, [selectedAnswer]);

  return (
    <div className="w-full max-w-full space-y-4 overflow-hidden">
      {/* Clean Student Header (Task 1 & 5: No debug badges or style tabs) */}
      <div className="flex items-center gap-2 p-3 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
        <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 shrink-0">
          <HelpCircle className="w-4 h-4" />
        </span>
        <span className="font-extrabold break-words">
          শূন্যস্থানে সঠিক শব্দটি টাইপ করে নিচের &ldquo;জমা দিন&rdquo; বাটনে ক্লিক করুন।
        </span>
      </div>

      {/* STRICTLY LOCKED: INLINE GLOWING CAPSULE SLOT (Task 3 with Overflow Fix) */}
      <div
        className={`w-full max-w-full p-5 sm:p-8 rounded-3xl border-2 transition-all shadow-sm md:shadow-[0_0_35px_rgba(6,182,212,0.2)] text-white space-y-5 overflow-hidden break-words ${
          isConfirmed
            ? isCorrect
              ? "!bg-emerald-500/15 dark:!bg-emerald-500/25 !border-emerald-500 ring-2 ring-emerald-500"
              : "!bg-rose-500/15 dark:!bg-rose-500/25 !border-rose-500 ring-2 ring-rose-500"
            : "bg-slate-950 border-cyan-400/50"
        }`}
      >
        <div className="w-full max-w-full text-base sm:text-xl font-bold leading-relaxed sm:leading-loose break-words">
          {hasInlineTokens ? (
            (() => {
              let blankCounter = 0;
              return (
                <div className="flex flex-wrap items-baseline gap-y-3 gap-x-2">
                  {segments.map((seg, sIdx) => {
                    const isBlank =
                      (seg.startsWith("[") && seg.endsWith("]")) || seg.startsWith("___");
                    if (isBlank) {
                      const bIdx = blankCounter++;
                      const currentVal = getInputValue(bIdx);
                      return (
                        <span key={sIdx} className="inline-flex max-w-full align-middle my-1">
                          <input
                            type="text"
                            disabled={disabled || isConfirmed}
                            value={currentVal}
                            onChange={(e) => handleUpdateValue(bIdx, e.target.value)}
                            placeholder={`উত্তর ${bIdx + 1}`}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-sm sm:text-base font-black text-center outline-none transition-all w-[140px] sm:w-[180px] max-w-full ${
                              isConfirmed
                                ? isCorrect
                                  ? "!bg-emerald-950/80 !border-b-4 !border-emerald-400 text-emerald-100 ring-1 ring-emerald-400"
                                  : "!bg-rose-950/80 !border-b-4 !border-rose-400 text-rose-100 ring-1 ring-rose-400"
                                : "bg-cyan-950/70 border-b-4 border-dashed border-cyan-400 text-cyan-100 shadow-inner focus:border-solid focus:border-cyan-300"
                            }`}
                          />
                        </span>
                      );
                    }
                    return (
                      <span key={sIdx} className="break-words">
                        {seg}
                      </span>
                    );
                  })}
                </div>
              );
            })()
          ) : (
            <div className="space-y-4 w-full max-w-full">
              <p className="text-base sm:text-2xl font-black text-white leading-relaxed break-words">
                {prompt}
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2 w-full max-w-full">
                <span className="text-xs font-mono font-bold text-cyan-400 shrink-0">
                  উত্তর লিখুন:
                </span>
                <input
                  type="text"
                  disabled={disabled || isConfirmed}
                  value={getInputValue(0)}
                  onChange={(e) => handleUpdateValue(0, e.target.value)}
                  placeholder="সঠিক উত্তর এখানে টাইপ করুন..."
                  className={`w-full max-w-full flex-1 p-3 sm:p-3.5 rounded-2xl text-sm sm:text-base font-bold text-white outline-none transition-all ${
                    isConfirmed
                      ? isCorrect
                        ? "!bg-emerald-950/80 !border-2 !border-emerald-500 ring-2 ring-emerald-500 text-emerald-100"
                        : "!bg-rose-950/80 !border-2 !border-rose-500 ring-2 ring-rose-500 text-rose-100"
                      : "bg-cyan-950/60 border-2 border-cyan-400 shadow-sm focus:ring-2 focus:ring-cyan-300"
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Action Bar */}
      {onConfirmAnswer && !isConfirmed && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={!isAnswerProvided || disabled}
            onClick={() => onConfirmAnswer(selectedAnswer)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              isAnswerProvided
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg active:scale-95"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50"
            }`}
          >
            <Check className="w-4 h-4" />
            <span>জমা দিন (Submit)</span>
          </button>
        </div>
      )}

      {/* Post-submission evaluation feedback (Universal Green / Red) */}
      {isConfirmed && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            isCorrect
              ? "!bg-emerald-500/20 dark:!bg-emerald-500/30 !border-emerald-500 !text-emerald-950 dark:!text-emerald-100 ring-2 ring-emerald-500"
              : "!bg-rose-500/20 dark:!bg-rose-500/30 !border-rose-500 !text-rose-950 dark:!text-rose-100 ring-2 ring-rose-500"
          }`}
        >
          {isCorrect ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>চমৎকার! আপনার উত্তরটি সঠিক হয়েছে।</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                উত্তরটি সঠিক হয়নি।
                {question.acceptedAnswers && question.acceptedAnswers.length > 0 && (
                  <span className="ml-1 font-bold">
                    গ্রহণযোগ্য উত্তর: {question.acceptedAnswers.join(", ")}
                  </span>
                )}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
});

export default FillBlanksTemplates;
