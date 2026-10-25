"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  Edit3,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 10: HAND-DRAWN NOTEBOOK DOODLE
 * - Lined notebook paper texture with left margin line
 * - Organic hand-drawn/wobbly doodle borders
 * - Ballpoint pen & highlighter aesthetics
 * - Flawless Light & Dark mode compatibility
 */
export const Template10: React.FC<QuizTemplateProps> = ({
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
    <div
      className="relative w-full rounded-3xl p-6 sm:p-10 transition-colors duration-500 bg-[#fffdf5] dark:bg-[#1a1816] text-[#2b2520] dark:text-[#f3eee8] border-3 border-amber-900/30 dark:border-amber-100/20 shadow-xl font-sans"
      style={{
        backgroundImage: `
          linear-gradient(90deg, rgba(239,68,68,0.25) 1px, transparent 1px),
          linear-gradient(rgba(147,197,253,0.3) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 100% 30px",
        backgroundPosition: "40px 0, 0 0",
      }}
    >
      {/* Notebook Binder Rings Top */}
      <div className="flex justify-center gap-6 -mt-9 mb-6">
        {[1, 2, 3, 4, 5].map((ring) => (
          <div key={ring} className="w-4 h-8 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-600 shadow-inner" />
        ))}
      </div>

      {/* Header Doodle Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-dashed border-amber-900/30 text-xs font-serif">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
          <Edit3 className="w-4 h-4" />
          <span className="underline decoration-wavy decoration-amber-500">CLASS NOTEBOOK #10</span>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 text-amber-900 dark:text-amber-200 text-xs font-bold">
          প্রশ্ন {questionIndex + 1} / {totalQuestions}
        </span>
      </div>

      {/* TOP: Question Sticky Box */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="p-6 sm:p-8 bg-amber-100/70 dark:bg-amber-950/40 rounded-2xl border-2 border-dashed border-amber-800/40 text-center -rotate-0.5 shadow-sm">
          <span className="text-[11px] font-black uppercase text-amber-700 dark:text-amber-300 tracking-wider block mb-1">
            ✏️ আজকের কুইজ নোট:
          </span>
          <h2 className="text-base sm:text-xl font-bold leading-relaxed">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* BOTTOM: Doodle Options */}
      <div className="max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let doodleBg = "bg-white/80 dark:bg-slate-900/80 border-amber-900/30 dark:border-amber-200/20";
              if (isSelected) {
                doodleBg = "bg-amber-200/80 dark:bg-amber-900/60 border-amber-700 font-bold scale-[1.01]";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  doodleBg = "bg-emerald-100 dark:bg-emerald-950/70 border-emerald-600 font-bold";
                } else if (isSelected && !isCorrectOption) {
                  doodleBg = "bg-rose-100 dark:bg-rose-950/70 border-rose-600 font-bold";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left shadow-xs ${
                    !isConfirmed && !disabled ? "cursor-pointer hover:-rotate-0.5" : "cursor-default"
                  } ${doodleBg}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full border-2 border-current font-bold text-xs flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm leading-snug">
                      {opt}
                    </span>
                  </div>

                  {isConfirmed && (
                    <div className="shrink-0">
                      {isCorrectOption ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5 text-rose-600" />
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
                  className={`w-full p-6 rounded-2xl border-2 border-amber-900/40 transition-all flex items-center justify-between ${
                    isSelected ? "bg-amber-300 dark:bg-amber-900 text-black dark:text-white font-black" : "bg-white/80 dark:bg-slate-900/80"
                  }`}
                >
                  <span className="text-base font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-5 bg-white/80 dark:bg-slate-900/80 rounded-2xl border-2 border-amber-900/30 space-y-3">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
              ✏️ ড্র্যাগ করে জোড়া মিলান:
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
                  className="p-3 bg-amber-50 dark:bg-slate-800 border border-amber-300 rounded-xl text-xs font-semibold flex items-center justify-between cursor-grab"
                >
                  <span>{matchingPairs[idx]?.left} ➔ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-amber-700" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-white/80 dark:bg-slate-900/80 rounded-2xl border-2 border-amber-900/30 space-y-3">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
              ✏️ ক্রম অনুযায়ী সাজান:
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
                  className="p-3 bg-amber-50 dark:bg-slate-800 border border-amber-300 rounded-xl text-xs font-semibold flex items-center justify-between cursor-grab"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-amber-700" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "FILL_BLANKS" && (
          <div className="p-5 bg-white/80 dark:bg-slate-900/80 rounded-2xl border-2 border-amber-900/30 space-y-3">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
              ✏️ শূন্যস্থানে লিখুন:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="এখানে লিখুন..."
              className="w-full p-3.5 bg-amber-50 dark:bg-slate-950 border-b-2 border-amber-600 text-sm font-serif focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="mt-8 p-4 rounded-xl bg-amber-100/60 dark:bg-slate-900/90 border border-amber-400 text-xs flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">ব্যাখ্যা: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template10;
