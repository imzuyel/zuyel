"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  Zap,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 05: NEO-BRUTALISM POP
 * - Thick 3.5px solid black borders (dark:border-white)
 * - Hard block drop shadows: shadow-[6px_6px_0px_#000] (dark:shadow-[6px_6px_0px_#fff])
 * - Vivid yellow, hot pink, and cyan sticker tags
 * - Tactile button depression: active:translate-x-1 active:translate-y-1 active:shadow-none
 * - Flawless Light & Dark mode compatibility
 */
export const Template05: React.FC<QuizTemplateProps> = ({
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
    <div className="relative w-full rounded-2xl p-6 sm:p-10 transition-colors duration-500 bg-[#fffae0] dark:bg-[#1a1a2e] text-slate-900 dark:text-white border-[3.5px] border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
      {/* Top Header Sticker Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b-[3px] border-black dark:border-white">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ff4b72] text-white border-[2.5px] border-black dark:border-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] font-black text-xs uppercase tracking-wider -rotate-1">
          <Zap className="w-3.5 h-3.5 fill-current" /> NEO-BRUTALISM 05
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ffe600] text-black border-[2.5px] border-black dark:border-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] font-black text-xs uppercase tracking-wider rotate-1">
          Q {questionIndex + 1} / {totalQuestions}
        </div>
      </div>

      {/* TOP: Question Card with Chunky Shadow */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative p-6 sm:p-8 bg-white dark:bg-[#12121f] border-[3.5px] border-black dark:border-white shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] rounded-xl text-center">
          <span className="inline-block px-3 py-0.5 mb-3 bg-[#00f0ff] text-black border-2 border-black font-black text-[11px] uppercase tracking-wider">
            QUESTION BLOCK
          </span>
          <h2 className="text-lg sm:text-2xl font-black leading-snug">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* BOTTOM: Chunky Option Buttons */}
      <div className="max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let btnBg = "bg-white dark:bg-[#181829] text-slate-900 dark:text-white";
              let badgeBg = "bg-[#ffe600] text-black";

              if (isSelected) {
                btnBg = "bg-[#00f0ff] text-black font-black";
                badgeBg = "bg-black text-white";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  btnBg = "bg-[#10b981] text-white";
                  badgeBg = "bg-black text-white";
                } else if (isSelected && !isCorrectOption) {
                  btnBg = "bg-[#ff4b72] text-white";
                  badgeBg = "bg-black text-white";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] p-4 rounded-xl border-[3px] border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] transition-all flex items-center justify-between text-left ${
                    !isConfirmed && !disabled
                      ? "cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none"
                      : "cursor-default"
                  } ${btnBg}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-lg border-2 border-black dark:border-white font-black text-xs flex items-center justify-center shrink-0 ${badgeBg}`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm font-bold leading-snug">
                      {opt}
                    </span>
                  </div>

                  {isConfirmed && (
                    <div className="shrink-0">
                      {isCorrectOption ? (
                        <CheckCircle2 className="w-5 h-5 text-black dark:text-white" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5 text-black dark:text-white" />
                      ) : null}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {qType === "TRUE_FALSE" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "সত্য (True)", value: true, bValue: "true", color: "emerald", symbol: "✓", bg: "bg-[#10b981]" },
              { label: "মিথ্যা (False)", value: false, bValue: "false", color: "rose", symbol: "✗", bg: "bg-[#ff4b72]" },
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
                  className={`w-full p-6 rounded-xl border-[3px] border-black dark:border-white shadow-[5px_5px_0px_#000] dark:shadow-[5px_5px_0px_#fff] transition-all flex items-center justify-between text-left ${
                    !isConfirmed && !disabled ? "cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none" : "cursor-default"
                  } ${isSelected ? `${item.bg} text-white` : "bg-white dark:bg-[#181829] text-slate-900 dark:text-white"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-lg bg-black text-white font-black text-xl flex items-center justify-center">
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
          <div className="p-5 bg-white dark:bg-[#12121f] rounded-xl border-[3px] border-black dark:border-white shadow-[5px_5px_0px_#000] space-y-3">
            <span className="text-xs font-black uppercase text-black dark:text-white block">
              ⇄ বাম ↔ ডান মিল করুন:
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
              className="space-y-2"
            >
              {rightOrder.map((itemVal, idx) => (
                <Reorder.Item
                  key={itemVal}
                  value={itemVal}
                  dragListener={!disabled && !isConfirmed}
                  className="p-3 bg-[#ffe600] text-black border-2 border-black rounded-lg text-xs font-bold flex items-center justify-between cursor-grab shadow-[3px_3px_0px_#000]"
                >
                  <span>{matchingPairs[idx]?.left} ➔ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-black" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-white dark:bg-[#12121f] rounded-xl border-[3px] border-black dark:border-white shadow-[5px_5px_0px_#000] space-y-3">
            <span className="text-xs font-black uppercase text-black dark:text-white block">
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
              className="space-y-2"
            >
              {reorderState.map((itemVal, idx) => (
                <Reorder.Item
                  key={itemVal}
                  value={itemVal}
                  dragListener={!disabled && !isConfirmed}
                  className="p-3 bg-[#00f0ff] text-black border-2 border-black rounded-lg text-xs font-bold flex items-center justify-between cursor-grab shadow-[3px_3px_0px_#000]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-black text-white font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-black" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "FILL_BLANKS" && (
          <div className="p-5 bg-white dark:bg-[#12121f] rounded-xl border-[3px] border-black dark:border-white shadow-[5px_5px_0px_#000] space-y-3">
            <span className="text-xs font-black uppercase text-black dark:text-white block">
              খালি স্থান পূরণ করুন:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="এখানে লিখুন..."
              className="w-full p-4 rounded-lg bg-slate-50 dark:bg-black border-[3px] border-black dark:border-white font-black text-sm text-black dark:text-white focus:outline-hidden focus:bg-[#ffe600] focus:text-black transition-colors"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="mt-8 p-4 rounded-xl bg-white dark:bg-[#12121f] border-[3px] border-black dark:border-white text-xs text-black dark:text-white flex items-start gap-2.5 shadow-[4px_4px_0px_#000]">
          <HelpCircle className="w-4 h-4 text-[#ff4b72] shrink-0 mt-0.5" />
          <div>
            <strong className="font-black">ব্যাখ্যা: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template05;
