"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  Scissors,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 15: ORIGAMI FOLDED PAPER
 * - Faceted polygon clip-path origami geometric shapes
 * - Layered paper fold drop shadows
 * - Soft crisp papercraft aesthetic
 * - Flawless Light & Dark mode compatibility
 */
export const Template15: React.FC<QuizTemplateProps> = ({
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

  const origamiClip =
    "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))";

  return (
    <div className="relative w-full rounded-3xl p-6 sm:p-10 transition-colors duration-500 bg-[#f4efe6] dark:bg-[#1a1714] text-[#332a24] dark:text-[#f4efe6] border border-stone-300 dark:border-stone-800 shadow-xl font-sans">
      {/* Header Fold */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-300 dark:border-stone-800 text-xs">
        <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider">
          <Scissors className="w-4 h-4 text-orange-600" />
          <span>ORIGAMI PAPERCRAFT // 15</span>
        </div>
        <span className="px-3 py-1 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-sm text-[10px] font-bold">
          FOLD {questionIndex + 1} / {totalQuestions}
        </span>
      </div>

      {/* TOP: Folded Question Block */}
      <div className="max-w-2xl mx-auto mb-8">
        <div
          className="p-6 sm:p-9 bg-white dark:bg-[#24201c] shadow-[0_12px_24px_rgba(0,0,0,0.08)] text-center relative"
          style={{ clipPath: origamiClip }}
        >
          {/* Fold Corner Shading */}
          <div className="absolute top-0 right-0 w-6 h-6 bg-stone-300 dark:bg-stone-700 shadow-inner" />
          <div className="absolute bottom-0 left-0 w-6 h-6 bg-stone-300 dark:bg-stone-700 shadow-inner" />

          <span className="text-[10px] font-bold tracking-widest text-orange-600 dark:text-orange-400 uppercase block mb-2">
            CREASED PROMPT
          </span>
          <h2 className="text-base sm:text-xl font-extrabold leading-snug">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* BOTTOM: Origami Option Tiles */}
      <div className="max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let tileBg = "bg-white dark:bg-[#24201c] text-stone-800 dark:text-stone-100 hover:bg-orange-50 dark:hover:bg-stone-800";
              if (isSelected) {
                tileBg = "bg-orange-500 text-white font-bold shadow-md";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  tileBg = "bg-emerald-600 text-white font-bold";
                } else if (isSelected && !isCorrectOption) {
                  tileBg = "bg-rose-600 text-white font-bold";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all flex items-center justify-between text-left relative ${
                    !isConfirmed && !disabled ? "cursor-pointer hover:-translate-y-0.5 active:scale-98" : "cursor-default"
                  } ${tileBg}`}
                  style={{ clipPath: origamiClip }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold leading-snug">
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
              { label: "সত্য (True)", value: true, bValue: "true" },
              { label: "মিথ্যা (False)", value: false, bValue: "false" },
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
                  className={`w-full p-6 shadow-md transition-all flex items-center justify-between text-left ${
                    isSelected ? "bg-orange-500 text-white font-black" : "bg-white dark:bg-[#24201c]"
                  }`}
                  style={{ clipPath: origamiClip }}
                >
                  <span className="text-base font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-5 bg-white dark:bg-[#24201c] shadow-md space-y-3" style={{ clipPath: origamiClip }}>
            <span className="text-xs font-bold text-orange-600 block">
              ⇄ কাগজের অংশ মিলান:
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
                  className="p-3 bg-stone-100 dark:bg-stone-900 border border-stone-300 text-xs font-bold flex items-center justify-between cursor-grab"
                >
                  <span>{matchingPairs[idx]?.left} ➔ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-orange-600" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-white dark:bg-[#24201c] shadow-md space-y-3" style={{ clipPath: origamiClip }}>
            <span className="text-xs font-bold text-orange-600 block">
              ⬇ ভাঁজ করার ক্রম:
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
                  className="p-3 bg-stone-100 dark:bg-stone-900 border border-stone-300 text-xs font-bold flex items-center justify-between cursor-grab"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-orange-600" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "FILL_BLANKS" && (
          <div className="p-5 bg-white dark:bg-[#24201c] shadow-md space-y-3" style={{ clipPath: origamiClip }}>
            <span className="text-xs font-bold text-orange-600 block">
              কাগজে লিখুন:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="এখানে লিখুন..."
              className="w-full p-3.5 bg-stone-100 dark:bg-stone-900 border border-stone-300 text-sm font-semibold focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="mt-8 p-4 bg-white dark:bg-[#24201c] border border-stone-300 text-xs flex items-start gap-2.5 shadow-sm">
          <HelpCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">ব্যাখ্যা: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template15;
