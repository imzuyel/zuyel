"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 09: MINIMALIST SWISS TYPOGRAPHY GRID
 * - International Typographic Style (Swiss Grid)
 * - Massive serial numerals (01, 02, 03, 04)
 * - Hairline geometric rules and strict asymmetric hierarchy
 * - Flawless Light & Dark mode compatibility
 */
export const Template09: React.FC<QuizTemplateProps> = ({
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
    <div className="relative w-full rounded-none p-6 sm:p-12 transition-colors duration-500 bg-white dark:bg-[#111111] text-black dark:text-white border-t-8 border-b-8 border-black dark:border-white font-sans">
      {/* Swiss Metadata Header */}
      <div className="flex flex-wrap items-end justify-between pb-6 mb-8 border-b border-black dark:border-white">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase font-black text-neutral-400 block mb-1">
            SWISS INTERNATIONAL SYSTEM // 09
          </span>
          <span className="text-3xl sm:text-4xl font-black tracking-tighter">
            QUESTION {String(questionIndex + 1).padStart(2, "0")}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono text-neutral-500">
            TOTAL POOL: {String(totalQuestions).padStart(2, "0")} / MARKS: {question.marks || 1}
          </span>
        </div>
      </div>

      {/* TOP: Question Typography Hero */}
      <div className="max-w-3xl mb-10">
        <h2 className="text-xl sm:text-3xl font-black leading-tight tracking-tight text-neutral-900 dark:text-neutral-100">
          {question.questionText}
        </h2>
      </div>

      {/* BOTTOM: Minimalist Rule Options */}
      <div className="max-w-3xl space-y-3">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let border = "border-neutral-300 dark:border-neutral-800 bg-transparent hover:border-black dark:hover:border-white";
              if (isSelected) {
                border = "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-black";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  border = "border-emerald-600 bg-emerald-600 text-white font-black";
                } else if (isSelected && !isCorrectOption) {
                  border = "border-rose-600 bg-rose-600 text-white font-black";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[64px] p-4 border-2 transition-all flex items-start justify-between text-left ${
                    !isConfirmed && !disabled ? "cursor-pointer" : "cursor-default"
                  } ${border}`}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <span className="text-xs font-mono font-black opacity-60 pt-0.5">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-bold leading-snug">
                      {opt}
                    </span>
                  </div>

                  {isConfirmed && (
                    <div className="shrink-0 pt-0.5">
                      {isCorrectOption ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : isSelected ? (
                        <XCircle className="w-4 h-4 text-rose-500" />
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
              { label: "01 // TRUE", value: true, bValue: "true" },
              { label: "02 // FALSE", value: false, bValue: "false" },
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
                  className={`w-full p-6 border-2 transition-all flex items-center justify-between text-left ${
                    isSelected ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-black" : "border-neutral-300 dark:border-neutral-800"
                  }`}
                >
                  <span className="text-base font-black tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-6 border-2 border-black dark:border-white space-y-3">
            <span className="text-xs font-mono font-black uppercase text-neutral-500 block">
              // REORDER TO ASSOCIATE:
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
                  className="p-3 border border-neutral-300 dark:border-neutral-800 text-xs font-bold flex items-center justify-between cursor-grab"
                >
                  <span>{matchingPairs[idx]?.left} ──▶ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-neutral-400" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-6 border-2 border-black dark:border-white space-y-3">
            <span className="text-xs font-mono font-black uppercase text-neutral-500 block">
              // SEQUENCE REORDER:
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
                  className="p-3 border border-neutral-300 dark:border-neutral-800 text-xs font-bold flex items-center justify-between cursor-grab"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-neutral-400">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-neutral-400" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "FILL_BLANKS" && (
          <div className="p-6 border-2 border-black dark:border-white space-y-3">
            <span className="text-xs font-mono font-black uppercase text-neutral-500 block">
              // VALUE INPUT:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="INPUT REQUIRED STRING..."
              className="w-full p-4 border-2 border-neutral-400 dark:border-neutral-700 bg-transparent text-sm font-bold focus:border-black dark:focus:border-white focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="mt-8 p-4 border border-black dark:border-white text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong className="font-black">CRITIQUE // </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template09;
