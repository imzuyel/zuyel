"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Check,
  X,
  Sparkles,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { NormalizedQuizQuestion } from "./types";

interface TrueFalseProps {
  question: NormalizedQuizQuestion;
  selectedAnswer: any;
  onSelectAnswer: (answer: boolean) => void;
  onConfirmAnswer?: (answer: boolean) => void;
  isConfirmed?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
}

export const TrueFalseTemplates = React.memo(function TrueFalseTemplates({
  question,
  selectedAnswer,
  onSelectAnswer,
  onConfirmAnswer,
  isConfirmed = false,
  isCorrect,
  disabled = false,
}: TrueFalseProps) {
  // Parse boolean selection
  const currentSelection: boolean | null = useMemo(() => {
    if (selectedAnswer === true || selectedAnswer === "true") return true;
    if (selectedAnswer === false || selectedAnswer === "false") return false;
    return null;
  }, [selectedAnswer]);

  const correctBool: boolean = useMemo(() => {
    if (typeof question.correctBoolean === "boolean") return question.correctBoolean;
    const rawCorrect = (question as any).correctAnswer;
    if (typeof rawCorrect === "boolean") return rawCorrect;
    if (rawCorrect === "true" || rawCorrect === "TRUE") return true;
    if (rawCorrect === "false" || rawCorrect === "FALSE") return false;
    return question.correctOptionIndex === 0;
  }, [question]);

  const handleSelect = (val: boolean) => {
    if (disabled || isConfirmed) return;
    onSelectAnswer(val);
  };

  const handleConfirm = (val: boolean) => {
    if (disabled || isConfirmed) return;
    onSelectAnswer(val);
    if (onConfirmAnswer) {
      onConfirmAnswer(val);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Question Prompt Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-100/90 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 shadow-md md:shadow-xl backdrop-blur-none md:backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-indigo-600 dark:text-cyan-400 font-extrabold">
            <HelpCircle className="w-4 h-4" />
            <span>বিবৃতি মূল্যায়ন (Statement Evaluation)</span>
          </span>
          <span>সত্য নাকি মিথ্যা নির্ধারণ করুন</span>
        </div>

        <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-relaxed">
          {question.questionText}
        </h3>
      </div>

      {/* 2 Massive Symmetrical Side-by-Side 3D Cards
          CRITICAL RULE: Both "সত্য (True)" and "মিথ্যা (False)" MUST have the EXACT SAME neutral theme color before answering!
          DO NOT color True green and False red initially! Only reveal green/red after submission! */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* ===================== TRUE CARD ===================== */}
        {(() => {
          const isSelected = currentSelection === true;
          let cardStyle =
            "bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-150 shadow-sm md:shadow-[0_10px_0_rgba(100,116,139,0.3)] hover:border-slate-400 dark:hover:border-slate-500";
          let badgeStyle = "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300";

          if (isSelected && !isConfirmed) {
            // Selected state before submission: neutral indigo highlight for BOTH True and False
            cardStyle =
              "!bg-indigo-500/15 dark:!bg-indigo-500/25 !border-indigo-500 !text-slate-900 dark:!text-white ring-2 ring-indigo-400 shadow-md scale-[1.02]";
            badgeStyle = "!bg-indigo-600 !text-white font-black";
          } else if (isConfirmed) {
            if (correctBool === true) {
              // Post submission: this was the correct answer
              cardStyle =
                "!bg-emerald-500/20 dark:!bg-emerald-500/30 !border-emerald-500 !text-emerald-950 dark:!text-emerald-100 ring-2 ring-emerald-500 shadow-sm";
              badgeStyle = "!bg-emerald-500 !text-white font-black";
            } else if (isSelected && correctBool === false) {
              // Post submission: user wrongly picked True
              cardStyle =
                "!bg-rose-500/20 dark:!bg-rose-500/30 !border-rose-500 !text-rose-950 dark:!text-rose-100 ring-2 ring-rose-500 shadow-sm";
              badgeStyle = "!bg-rose-500 !text-white font-black";
            } else {
              cardStyle = "opacity-40 border-2 border-slate-350 dark:border-slate-800";
            }
          }

          return (
            <motion.button
              type="button"
              whileHover={!disabled && !isConfirmed ? { y: -4 } : {}}
              whileTap={!disabled && !isConfirmed ? { y: 2 } : {}}
              disabled={disabled || isConfirmed}
              onClick={() => handleSelect(true)}
              className={`relative p-6 sm:p-8 rounded-[2rem] transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 min-h-[180px] ${cardStyle}`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black transition-transform ${badgeStyle}`}
              >
                ✓
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-wide block">
                  সত্য (True)
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mt-1">
                  বিবৃতিটি পুরোপুরি সত্য ও নির্ভুল
                </span>
              </div>
            </motion.button>
          );
        })()}

        {/* ===================== FALSE CARD ===================== */}
        {(() => {
          const isSelected = currentSelection === false;
          let cardStyle =
            "bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-150 shadow-sm md:shadow-[0_10px_0_rgba(100,116,139,0.3)] hover:border-slate-400 dark:hover:border-slate-500";
          let badgeStyle = "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300";

          if (isSelected && !isConfirmed) {
            // Selected state before submission: neutral indigo highlight for BOTH True and False
            cardStyle =
              "!bg-indigo-500/15 dark:!bg-indigo-500/25 !border-indigo-500 !text-slate-900 dark:!text-white ring-2 ring-indigo-400 shadow-md scale-[1.02]";
            badgeStyle = "!bg-indigo-600 !text-white font-black";
          } else if (isConfirmed) {
            if (correctBool === false) {
              // Post submission: this was the correct answer
              cardStyle =
                "!bg-emerald-500/20 dark:!bg-emerald-500/30 !border-emerald-500 !text-emerald-950 dark:!text-emerald-100 ring-2 ring-emerald-500 shadow-sm";
              badgeStyle = "!bg-emerald-500 !text-white font-black";
            } else if (isSelected && correctBool === true) {
              // Post submission: user wrongly picked False
              cardStyle =
                "!bg-rose-500/20 dark:!bg-rose-500/30 !border-rose-500 !text-rose-950 dark:!text-rose-100 ring-2 ring-rose-500 shadow-sm";
              badgeStyle = "!bg-rose-500 !text-white font-black";
            } else {
              cardStyle = "opacity-40 border-2 border-slate-350 dark:border-slate-800";
            }
          }

          return (
            <motion.button
              type="button"
              whileHover={!disabled && !isConfirmed ? { y: -4 } : {}}
              whileTap={!disabled && !isConfirmed ? { y: 2 } : {}}
              disabled={disabled || isConfirmed}
              onClick={() => handleSelect(false)}
              className={`relative p-6 sm:p-8 rounded-[2rem] transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 min-h-[180px] ${cardStyle}`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black transition-transform ${badgeStyle}`}
              >
                ✕
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-wide block">
                  মিথ্যা (False)
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mt-1">
                  বিবৃতিটি ভুল বা অসামঞ্জস্যপূর্ণ
                </span>
              </div>
            </motion.button>
          );
        })()}
      </div>

      {/* Submit Button */}
      {onConfirmAnswer && !isConfirmed && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={currentSelection === null || disabled}
            onClick={() => handleConfirm(currentSelection!)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              currentSelection !== null
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg active:scale-95"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50"
            }`}
          >
            <Check className="w-4 h-4" />
            <span>উত্তর নিশ্চিত করুন (Confirm Selection)</span>
          </button>
        </div>
      )}

      {/* Post-submission evaluation feedback */}
      {isConfirmed && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            isCorrect
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
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
                উত্তরটি সঠিক হয়নি। সঠিক উত্তর ছিল:{" "}
                <strong>{correctBool ? "সত্য (True)" : "মিথ্যা (False)"}</strong>
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
});

export default TrueFalseTemplates;
