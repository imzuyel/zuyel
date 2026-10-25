"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  Flame,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 04: VIBRANT SUNSET GLASSMORPHISM
 * - Warm radiant sunset gradient canvas (amber/rose/fuchsia)
 * - Translucent frosted glass question card (backdrop-blur-md bg-white/20 dark:bg-slate-900/40)
 * - Luminous gradient option buttons with high-contrast text
 * - Flawless Light & Dark mode compatibility
 */
export const Template04: React.FC<QuizTemplateProps> = ({
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
    <div className="relative w-full rounded-[36px] p-6 sm:p-10 overflow-hidden transition-all duration-500 bg-gradient-to-br from-amber-500 via-rose-500 to-fuchsia-600 dark:from-amber-600 dark:via-rose-700 dark:to-purple-900 text-white shadow-[0_20px_60px_rgba(244,63,94,0.35)]">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-300/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-fuchsia-400/20 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between pb-4 mb-6 border-b border-white/20 text-xs font-semibold">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-black uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5 text-amber-300" /> SUNSET GLASS 04
        </span>
        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-bold">
          Q {questionIndex + 1} OF {totalQuestions}
        </span>
      </div>

      {/* TOP: Frosted Glass Question Card with Slanted Badge */}
      <div className="relative z-10 max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="relative p-7 sm:p-10 rounded-[30px] bg-white/25 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-white/20 text-center shadow-[0_15px_35px_rgba(0,0,0,0.15)]">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-400 text-slate-950 font-black text-lg flex items-center justify-center -rotate-6 shadow-md border-2 border-white">
            ?
          </div>
          <h2 className="mt-2 text-lg sm:text-2xl font-black text-white leading-snug drop-shadow-xs">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* BOTTOM: Glassmorphic Answer Grid */}
      <div className="relative z-10 max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let glassBg = "bg-white/20 hover:bg-white/30 border-white/30 text-white";
              if (isSelected) {
                glassBg = "bg-white text-rose-600 font-extrabold shadow-lg scale-[1.02] border-white";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  glassBg = "bg-emerald-500 text-white border-emerald-300 shadow-lg";
                } else if (isSelected && !isCorrectOption) {
                  glassBg = "bg-rose-700 text-white border-rose-400 shadow-lg";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] p-4 rounded-2xl backdrop-blur-md border transition-all duration-200 flex items-center justify-between text-left ${
                    !isConfirmed && !disabled ? "cursor-pointer active:scale-98" : "cursor-default"
                  } ${glassBg}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-white/25 text-white font-black text-xs flex items-center justify-center shrink-0 border border-white/30">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm font-bold leading-snug">
                      {opt}
                    </span>
                  </div>

                  {isConfirmed && (
                    <div className="shrink-0">
                      {isCorrectOption ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5 text-white" />
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
              { label: "সত্য (True)", value: true, bValue: "true", color: "emerald", symbol: "✓" },
              { label: "মিথ্যা (False)", value: false, bValue: "false", color: "rose", symbol: "✗" },
            ].map((item, idx) => {
              const isSelected =
                selectedAnswer === item.value ||
                selectedAnswer === item.bValue ||
                selectedAnswer === idx;

              let glassBg = "bg-white/20 hover:bg-white/30 border-white/30";
              if (isSelected) {
                glassBg = item.color === "emerald" ? "bg-emerald-500 text-white border-emerald-300" : "bg-rose-700 text-white border-rose-400";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(item.value)}
                  className={`w-full p-5 rounded-2xl backdrop-blur-md border transition-all flex items-center justify-between ${
                    !isConfirmed && !disabled ? "cursor-pointer" : "cursor-default"
                  } ${glassBg}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-white/25 border border-white/40 text-xl font-black flex items-center justify-center">
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
          <div className="p-5 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 space-y-3">
            <span className="text-xs font-bold text-amber-200 block">
              ⇄ বাম ↔ ডান মিলকরণ:
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
                  className="p-3.5 bg-white/30 backdrop-blur-md rounded-xl text-xs font-bold flex items-center justify-between cursor-grab border border-white/40"
                >
                  <span>{matchingPairs[idx]?.left} ➔ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-white" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 space-y-3">
            <span className="text-xs font-bold text-amber-200 block">
              ⬇ সঠিক ক্রমে সাজান:
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
                  className="p-3.5 bg-white/30 backdrop-blur-md rounded-xl text-xs font-bold flex items-center justify-between cursor-grab border border-white/40"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-white" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "FILL_BLANKS" && (
          <div className="p-6 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 space-y-3">
            <span className="text-xs font-bold text-amber-200 block">
              খালি স্থানে উত্তর লিখুন:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="এখানে লিখুন..."
              className="w-full p-4 rounded-xl bg-white/30 border border-white/40 text-white placeholder-white/60 text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-white"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="relative z-10 mt-8 p-4 rounded-2xl bg-white/25 backdrop-blur-md border border-white/30 text-xs text-white flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-200 font-bold">ব্যাখ্যা: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template04;
