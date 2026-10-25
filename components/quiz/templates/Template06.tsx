"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  Layers,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 06: SOFT NEUMORPHISM (EMBOSSED & DEBOSSED)
 * - Pure off-white/slate-200 background (dark: #1e2430)
 * - Embossed outer soft shadow bevels
 * - Debossed inner recessed shadow wells for selected states
 * - Tactile soft-press feeling
 * - Flawless Light & Dark mode compatibility
 */
export const Template06: React.FC<QuizTemplateProps> = ({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  isConfirmed = false,
  isCorrect,
  disabled = false,
}) => {
  const qType = question.questionType || "MCQ";

  const matchingPairs = useMemo(() => question.matchingPairs || [], [question.matchingPairs]);
  const [rightOrder, setRightOrder] = useState<string[]>([]);

  useEffect(() => {
    if (qType === "MATCHING" && matchingPairs.length > 0) {
      const rights = matchingPairs.map((p) => p.right.trim()).filter(Boolean);
      const shuffled = [...rights];
      if (shuffled.length > 1) {
        const last = shuffled.pop()!;
        shuffled.unshift(last);
      }
      setRightOrder(shuffled);
      const initialMap: Record<string, string> = {};
      matchingPairs.forEach((pair, idx) => {
        initialMap[pair.left] = shuffled[idx] || "";
      });
      if (!selectedAnswer) onSelectAnswer(initialMap);
    }
  }, [question.id, qType, matchingPairs]);

  const correctOrder = useMemo(() => {
    return question.correctOrder && question.correctOrder.length > 0
      ? question.correctOrder
      : question.options || [];
  }, [question.correctOrder, question.options]);

  const [reorderState, setReorderState] = useState<string[]>([]);

  useEffect(() => {
    if (qType === "REORDER" && correctOrder.length > 0) {
      if (Array.isArray(selectedAnswer) && selectedAnswer.length === correctOrder.length) {
        setReorderState(selectedAnswer);
      } else {
        const shuffled = [...correctOrder];
        if (shuffled.length > 1) {
          const first = shuffled.shift()!;
          shuffled.push(first);
        }
        setReorderState(shuffled);
        onSelectAnswer(shuffled);
      }
    }
  }, [question.id, qType, correctOrder]);

  return (
    <div className="relative w-full rounded-[36px] p-6 sm:p-10 transition-colors duration-500 bg-[#e6ebf4] dark:bg-[#1a202c] text-slate-800 dark:text-slate-100 shadow-[16px_16px_32px_#c5c9d2,-16px_-16px_32px_#ffffff] dark:shadow-[16px_16px_32px_#12161f,-16px_-16px_32px_#222a39] border border-white/50 dark:border-slate-800/60">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-300 dark:border-slate-700/60 text-xs font-semibold">
        <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#e6ebf4] dark:bg-[#1a202c] text-slate-600 dark:text-slate-300 shadow-[4px_4px_8px_#c5c9d2,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_#12161f,-4px_-4px_8px_#222a39] text-[10px] font-black uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-indigo-500" /> NEUMORPHIC 06
        </span>
        <span className="px-4 py-1.5 rounded-full bg-[#e6ebf4] dark:bg-[#1a202c] text-slate-600 dark:text-slate-300 shadow-[inset_3px_3px_6px_#c5c9d2,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_6px_#12161f,inset_-3px_-3px_6px_#222a39] text-[10px] font-bold">
          Q {questionIndex + 1} / {totalQuestions}
        </span>
      </div>

      {/* TOP: Embossed Question Capsule */}
      <div className="max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="p-7 sm:p-10 rounded-[30px] bg-[#e6ebf4] dark:bg-[#1a202c] shadow-[10px_10px_20px_#c5c9d2,-10px_-10px_20px_#ffffff] dark:shadow-[10px_10px_20px_#12161f,-10px_-10px_20px_#222a39] text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 block mb-2">
            NEUMORPHIC BEVEL QUESTION
          </span>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* BOTTOM: Neumorphic Options */}
      <div className="max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let style =
                "shadow-[6px_6px_12px_#c5c9d2,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#12161f,-6px_-6px_12px_#222a39] text-slate-700 dark:text-slate-200";

              if (isSelected) {
                style =
                  "shadow-[inset_6px_6px_12px_#c5c9d2,inset_-6px_-6px_12px_#ffffff] dark:shadow-[inset_6px_6px_12px_#12161f,inset_-6px_-6px_12px_#222a39] text-indigo-600 dark:text-indigo-400 font-extrabold";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  style =
                    "shadow-[inset_4px_4px_8px_#a7f3d0,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#064e3b,inset_-4px_-4px_8px_#065f46] text-emerald-600 dark:text-emerald-300 font-bold";
                } else if (isSelected && !isCorrectOption) {
                  style =
                    "shadow-[inset_4px_4px_8px_#fecdd3,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#881337,inset_-4px_-4px_8px_#9f1239] text-rose-600 dark:text-rose-300 font-bold";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] p-4 rounded-2xl bg-[#e6ebf4] dark:bg-[#1a202c] transition-all flex items-center justify-between text-left ${
                    !isConfirmed && !disabled ? "cursor-pointer active:scale-99" : "cursor-default"
                  } ${style}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-[#e6ebf4] dark:bg-[#1a202c] shadow-[inset_2px_2px_4px_#c5c9d2,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_#12161f,inset_-2px_-2px_4px_#222a39] font-black text-xs flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold leading-snug">
                      {opt}
                    </span>
                  </div>

                  {isConfirmed && (
                    <div className="shrink-0">
                      {isCorrectOption ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5 text-rose-500" />
                      ) : null}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {qType === "TRUE_FALSE" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: "সত্য (True)", value: true, bValue: "true", color: "emerald", symbol: "✓" },
              { label: "মিথ্যা (False)", value: false, bValue: "false", color: "rose", symbol: "✗" },
            ].map((item, idx) => {
              const isSelected =
                selectedAnswer === item.value ||
                selectedAnswer === item.bValue ||
                selectedAnswer === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(item.value)}
                  className={`w-full p-6 rounded-2xl bg-[#e6ebf4] dark:bg-[#1a202c] transition-all flex items-center justify-between text-left ${
                    isSelected
                      ? "shadow-[inset_6px_6px_12px_#c5c9d2,inset_-6px_-6px_12px_#ffffff] dark:shadow-[inset_6px_6px_12px_#12161f,inset_-6px_-6px_12px_#222a39] text-indigo-600 font-black"
                      : "shadow-[8px_8px_16px_#c5c9d2,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#12161f,-8px_-8px_16px_#222a39]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-[#e6ebf4] dark:bg-[#1a202c] shadow-[inset_3px_3px_6px_#c5c9d2,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_6px_#12161f,inset_-3px_-3px_6px_#222a39] text-xl font-black flex items-center justify-center">
                      {item.symbol}
                    </span>
                    <span className="text-base font-black">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-5 rounded-[28px] bg-[#e6ebf4] dark:bg-[#1a202c] shadow-[inset_6px_6px_12px_#c5c9d2,inset_-6px_-6px_12px_#ffffff] dark:shadow-[inset_6px_6px_12px_#12161f,inset_-6px_-6px_12px_#222a39] space-y-3">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
              ⇄ ড্র্যাগ করে মিল করুন:
            </span>
            <Reorder.Group
              axis="y"
              values={rightOrder}
              onReorder={(newOrder) => {
                if (disabled || isConfirmed) return;
                setRightOrder(newOrder);
                const updatedMap: Record<string, string> = {};
                matchingPairs.forEach((pair, idx) => {
                  updatedMap[pair.left] = newOrder[idx] || "";
                });
                onSelectAnswer(updatedMap);
              }}
              className="space-y-2.5"
            >
              {rightOrder.map((itemVal, idx) => (
                <Reorder.Item
                  key={itemVal}
                  value={itemVal}
                  dragListener={!disabled && !isConfirmed}
                  className="p-3.5 rounded-xl bg-[#e6ebf4] dark:bg-[#1a202c] shadow-[4px_4px_8px_#c5c9d2,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_#12161f,-4px_-4px_8px_#222a39] text-xs font-bold flex items-center justify-between cursor-grab"
                >
                  <span>{matchingPairs[idx]?.left} ➔ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-indigo-500" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 rounded-[28px] bg-[#e6ebf4] dark:bg-[#1a202c] shadow-[inset_6px_6px_12px_#c5c9d2,inset_-6px_-6px_12px_#ffffff] dark:shadow-[inset_6px_6px_12px_#12161f,inset_-6px_-6px_12px_#222a39] space-y-3">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
              ⬇ ক্রমানুসারে সাজান:
            </span>
            <Reorder.Group
              axis="y"
              values={reorderState}
              onReorder={(newOrder) => {
                if (disabled || isConfirmed) return;
                setReorderState(newOrder);
                onSelectAnswer(newOrder);
              }}
              className="space-y-2.5"
            >
              {reorderState.map((itemVal, idx) => (
                <Reorder.Item
                  key={itemVal}
                  value={itemVal}
                  dragListener={!disabled && !isConfirmed}
                  className="p-3.5 rounded-xl bg-[#e6ebf4] dark:bg-[#1a202c] shadow-[4px_4px_8px_#c5c9d2,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_#12161f,-4px_-4px_8px_#222a39] text-xs font-bold flex items-center justify-between cursor-grab"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-[#e6ebf4] dark:bg-[#1a202c] shadow-[inset_2px_2px_4px_#c5c9d2,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_#12161f,inset_-2px_-2px_4px_#222a39] text-[10px] font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-indigo-500" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "FILL_BLANKS" && (
          <div className="p-6 rounded-[28px] bg-[#e6ebf4] dark:bg-[#1a202c] shadow-[inset_6px_6px_12px_#c5c9d2,inset_-6px_-6px_12px_#ffffff] dark:shadow-[inset_6px_6px_12px_#12161f,inset_-6px_-6px_12px_#222a39] space-y-3">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
              খালি স্থান পূরণ:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="এখানে উত্তর লিখুন..."
              className="w-full p-4 rounded-xl bg-[#e6ebf4] dark:bg-[#1a202c] shadow-[inset_4px_4px_8px_#c5c9d2,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#12161f,inset_-4px_-4px_8px_#222a39] text-slate-800 dark:text-white text-sm font-bold focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="mt-8 p-4 rounded-2xl bg-[#e6ebf4] dark:bg-[#1a202c] shadow-[6px_6px_12px_#c5c9d2,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#12161f,-6px_-6px_12px_#222a39] text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-indigo-600 dark:text-indigo-400 font-bold">ব্যাখ্যা: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template06;
