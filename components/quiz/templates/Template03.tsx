"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  Sparkles,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 03: 3D PLAYFUL CLAYMORPHISM
 * - Lavender / Soft blue background canvas
 * - Floating 3D "QUIZ" speech bubble with golden sparkles ✨
 * - White 3D bubble capsule with deep claymorphic drop shadow
 * - Heavily rounded tactile pill buttons with active 3D compression
 * - Flawless Light & Dark mode compatibility
 */
export const Template03: React.FC<QuizTemplateProps> = ({
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
    <div className="relative w-full rounded-[40px] p-6 sm:p-10 transition-colors duration-500 bg-[#705df2] dark:bg-[#2c2269] text-slate-900 border-4 border-white/40 dark:border-purple-400/30 shadow-[0_25px_60px_rgba(112,93,242,0.35)]">
      {/* 3D Decorative Floating Golden Stars ✨ */}
      <div className="absolute top-6 left-8 pointer-events-none text-amber-300 drop-shadow-[0_4px_8px_rgba(251,191,36,0.6)] animate-bounce">
        <Sparkles className="w-8 h-8 fill-amber-300" />
      </div>
      <div className="absolute top-10 right-10 pointer-events-none text-amber-300 drop-shadow-[0_4px_8px_rgba(251,191,36,0.6)] animate-pulse">
        <Sparkles className="w-7 h-7 fill-amber-300" />
      </div>

      {/* Floating 3D "QUIZ" Cloud Speech Bubble */}
      <div className="relative flex justify-center mb-6">
        <div className="relative px-8 py-2.5 rounded-full bg-white text-slate-950 font-black text-sm uppercase tracking-widest shadow-[inset_0_-4px_6px_rgba(0,0,0,0.1),0_8px_20px_rgba(0,0,0,0.2)] flex items-center gap-2 border-2 border-slate-100">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
          <span>QUIZ 03</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
            {questionIndex + 1}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* TOP: Large White 3D Bubble Question Capsule */}
      <div className="relative max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="w-full min-h-[160px] sm:min-h-[190px] rounded-[36px] bg-white text-slate-900 dark:text-slate-950 p-6 sm:p-10 flex flex-col justify-center items-center text-center shadow-[inset_0_-8px_16px_rgba(0,0,0,0.08),inset_0_4px_8px_rgba(255,255,255,0.95),0_18px_45px_rgba(0,0,0,0.22)] border-2 border-white">
          <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 mb-2">
            প্রশ্ন {questionIndex + 1}
          </span>
          <h2 className="text-lg sm:text-2xl font-black leading-snug">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* BOTTOM: 3D Heavily Rounded Claymorphic Pill Buttons */}
      <div className="max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let pillBg = "bg-white text-slate-800 hover:bg-slate-50";
              let badgeBg = "bg-slate-100 text-slate-800";

              if (isSelected) {
                pillBg = "bg-purple-600 text-white shadow-[0_4px_14px_rgba(147,51,234,0.4)]";
                badgeBg = "bg-white text-purple-700 font-black";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  pillBg = "bg-emerald-500 text-white";
                  badgeBg = "bg-white text-emerald-700 font-black";
                } else if (isSelected && !isCorrectOption) {
                  pillBg = "bg-rose-500 text-white";
                  badgeBg = "bg-white text-rose-700 font-black";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] px-5 py-3.5 rounded-full flex items-center justify-between text-left transition-all duration-200 shadow-[inset_0_-4px_6px_rgba(0,0,0,0.08),0_8px_18px_rgba(0,0,0,0.14)] active:translate-y-1 active:shadow-xs border-2 border-white/60 ${
                    !isConfirmed && !disabled ? "cursor-pointer" : "cursor-default"
                  } ${pillBg}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${badgeBg}`}>
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

              const expectedBool =
                question.correctBoolean !== undefined
                  ? question.correctBoolean
                  : question.correctOptionIndex === 0;

              const isCorrectChoice = expectedBool === item.value;

              let pillBg = "bg-white text-slate-800";
              if (isSelected) {
                pillBg = item.color === "emerald" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(item.value)}
                  className={`w-full p-5 rounded-full flex items-center justify-between text-left transition-all shadow-[inset_0_-4px_6px_rgba(0,0,0,0.08),0_8px_18px_rgba(0,0,0,0.14)] active:translate-y-1 border-2 border-white/60 ${
                    !isConfirmed && !disabled ? "cursor-pointer" : "cursor-default"
                  } ${pillBg}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-slate-100 text-slate-900 font-black text-lg flex items-center justify-center">
                      {item.symbol}
                    </span>
                    <span className="text-base font-black">{item.label}</span>
                  </div>

                  {isConfirmed && (
                    <div>
                      {isCorrectChoice ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : isSelected ? (
                        <XCircle className="w-6 h-6 text-white" />
                      ) : null}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-5 bg-white/95 rounded-[32px] shadow-[inset_0_-6px_10px_rgba(0,0,0,0.06),0_12px_24px_rgba(0,0,0,0.15)] space-y-3">
            <span className="text-xs font-black text-purple-700 block">
              ⇄ বাম ↔ ডান ড্র্যাগ করে মিল করুন:
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
                  className="p-3.5 bg-slate-50 border border-purple-200 rounded-full text-xs font-bold text-slate-800 flex items-center justify-between cursor-grab shadow-xs"
                >
                  <span>{matchingPairs[idx]?.left} ➔ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-purple-500" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-white/95 rounded-[32px] shadow-[inset_0_-6px_10px_rgba(0,0,0,0.06),0_12px_24px_rgba(0,0,0,0.15)] space-y-3">
            <span className="text-xs font-black text-purple-700 block">
              ⬇ ড্র্যাগ করে সঠিক ক্রমানুসারে সাজান:
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
                  className="p-3.5 bg-slate-50 border border-purple-200 rounded-full text-xs font-bold text-slate-800 flex items-center justify-between cursor-grab shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-[11px] font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-purple-500" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "FILL_BLANKS" && (
          <div className="p-6 bg-white/95 rounded-[32px] shadow-[inset_0_-6px_10px_rgba(0,0,0,0.06),0_12px_24px_rgba(0,0,0,0.15)] space-y-3">
            <span className="text-xs font-black text-purple-700 block">
              খালি স্থানে উত্তর লিখুন:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="এখানে টাইপ করুন..."
              className="w-full p-4 rounded-full bg-slate-100 border border-purple-200 text-slate-900 text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="mt-8 p-4 rounded-2xl bg-white/90 text-xs text-slate-800 flex items-start gap-2.5 shadow-md">
          <HelpCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-purple-700 font-bold">ব্যাখ্যা: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template03;
