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
 * TEMPLATE 13: COMIC POP-ART / MANGA
 * - Ben-Day halftone dot pattern background
 * - Comic book panel borders with action exclamation bursts (POW! BAM!)
 * - Bold comic-strip primary colors (yellow/red/cyan)
 * - Flawless Light & Dark mode compatibility
 */
export const Template13: React.FC<QuizTemplateProps> = ({
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
      className="relative w-full rounded-2xl p-6 sm:p-10 transition-colors duration-500 bg-[#ffdd00] dark:bg-[#1f1738] text-slate-900 dark:text-white border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]"
      style={{
        backgroundImage: `
          radial-gradient(#ff0055 1.5px, transparent 1.5px)
        `,
        backgroundSize: "18px 18px",
      }}
    >
      {/* Comic Action Starburst */}
      <div className="absolute top-4 right-4 px-3 py-1 bg-[#ff0055] text-white border-2 border-black font-black text-xs uppercase tracking-wider rotate-6 shadow-[3px_3px_0px_#000]">
        POW! #13
      </div>

      {/* Header Panel */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b-4 border-black dark:border-white text-xs font-black">
        <span className="px-3 py-1 bg-white text-black border-2 border-black shadow-[2px_2px_0px_#000] -rotate-1">
          💥 COMIC STRIP ISSUE #{questionIndex + 1}
        </span>
        <span className="px-3 py-1 bg-[#00e5ff] text-black border-2 border-black shadow-[2px_2px_0px_#000]">
          PANEL {questionIndex + 1} OF {totalQuestions}
        </span>
      </div>

      {/* TOP: Speech Balloon Question Card */}
      <div className="max-w-2xl mx-auto mb-8 relative">
        <div className="relative p-6 sm:p-8 bg-white dark:bg-[#12121e] border-4 border-black dark:border-white rounded-3xl text-center shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]">
          <h2 className="text-base sm:text-xl font-black leading-snug">
            {question.questionText}
          </h2>
          {/* Speech bubble pointer notch */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-[#12121e] border-r-4 border-b-4 border-black dark:border-white rotate-45" />
        </div>
      </div>

      {/* BOTTOM: Comic Action Options */}
      <div className="max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let panelBg = "bg-white dark:bg-[#12121e] text-slate-900 dark:text-white";
              if (isSelected) {
                panelBg = "bg-[#00e5ff] text-black font-black shadow-[4px_4px_0px_#000]";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  panelBg = "bg-[#00e676] text-black font-black shadow-[4px_4px_0px_#000]";
                } else if (isSelected && !isCorrectOption) {
                  panelBg = "bg-[#ff1744] text-white font-black shadow-[4px_4px_0px_#000]";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] p-4 rounded-xl border-3 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] transition-all flex items-center justify-between text-left ${
                    !isConfirmed && !disabled ? "cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none" : "cursor-default"
                  } ${panelBg}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-[#ff0055] text-white border-2 border-black font-black text-xs flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm font-bold leading-snug">
                      {opt}
                    </span>
                  </div>

                  {isConfirmed && (
                    <div className="shrink-0">
                      {isCorrectOption ? (
                        <CheckCircle2 className="w-5 h-5 text-black" />
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
              { label: "সত্য (TRUE!)", value: true, bValue: "true", bg: "bg-[#00e676]" },
              { label: "মিথ্যা (FALSE!)", value: false, bValue: "false", bg: "bg-[#ff1744]" },
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
                  className={`w-full p-6 rounded-xl border-3 border-black dark:border-white shadow-[4px_4px_0px_#000] transition-all flex items-center justify-between ${
                    isSelected ? `${item.bg} text-black font-black` : "bg-white dark:bg-[#12121e]"
                  }`}
                >
                  <span className="text-base font-black">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-5 bg-white dark:bg-[#12121e] rounded-xl border-4 border-black dark:border-white shadow-[5px_5px_0px_#000] space-y-3">
            <span className="text-xs font-black uppercase text-black dark:text-white block">
              ⚡ MATCH THE HEROES:
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
                  className="p-3 bg-[#00e5ff] text-black border-2 border-black rounded-lg text-xs font-black flex items-center justify-between cursor-grab shadow-[2px_2px_0px_#000]"
                >
                  <span>{matchingPairs[idx]?.left} ➔ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-black" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-white dark:bg-[#12121e] rounded-xl border-4 border-black dark:border-white shadow-[5px_5px_0px_#000] space-y-3">
            <span className="text-xs font-black uppercase text-black dark:text-white block">
              ⚡ ACTION SEQUENCE:
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
                  className="p-3 bg-[#ffdd00] text-black border-2 border-black rounded-lg text-xs font-black flex items-center justify-between cursor-grab shadow-[2px_2px_0px_#000]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center">
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
          <div className="p-5 bg-white dark:bg-[#12121e] rounded-xl border-4 border-black dark:border-white shadow-[5px_5px_0px_#000] space-y-3">
            <span className="text-xs font-black uppercase text-black dark:text-white block">
              WRITE YOUR DIALOGUE:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="WRITE HERE..."
              className="w-full p-4 rounded-lg bg-yellow-50 dark:bg-black border-3 border-black dark:border-white font-black text-sm text-black dark:text-white focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="mt-8 p-4 bg-white dark:bg-[#12121e] border-3 border-black dark:border-white text-xs text-black dark:text-white flex items-start gap-2.5 shadow-[3px_3px_0px_#000]">
          <HelpCircle className="w-4 h-4 text-[#ff0055] shrink-0 mt-0.5" />
          <div>
            <strong className="font-black">EPISODE NOTES: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template13;
