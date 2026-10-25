"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  Cog,
  Gauge,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 19: STEAMPUNK INDUSTRIAL BRASS
 * - Riveted iron boiler plate background (#1e1b18)
 * - Warm polished brass and copper borders with rivet bolts
 * - Victorian industrial steam gauge telemetry
 * - Flawless Light & Dark mode compatibility
 */
export const Template19: React.FC<QuizTemplateProps> = ({
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
      className="relative w-full rounded-2xl p-6 sm:p-10 transition-colors duration-500 bg-[#2b241e] dark:bg-[#18130e] text-[#d9a05b] border-4 border-[#b87333] shadow-[0_20px_60px_rgba(0,0,0,0.6)] font-serif"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(184,115,51,0.15) 0%, transparent 60%)
        `,
      }}
    >
      {/* Brass Rivet Screws in Corners */}
      <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-[#b87333] border border-black shadow-inner" />
      <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#b87333] border border-black shadow-inner" />
      <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-[#b87333] border border-black shadow-inner" />
      <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-[#b87333] border border-black shadow-inner" />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-[#b87333]/40 text-xs">
        <div className="flex items-center gap-2 text-[#d9a05b] uppercase tracking-wider font-bold">
          <Cog className="w-4 h-4 animate-spin" />
          <span>STEAMPUNK APPARATUS // 19</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-[#e0a96d]">
            <Gauge className="w-3.5 h-3.5" /> 85 PSI
          </span>
          <span className="px-2.5 py-0.5 bg-[#3a2f26] border border-[#b87333] text-[10px] font-bold">
            STAGE {questionIndex + 1}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* TOP: Brass Boiler Question Plate */}
      <div className="max-w-2xl mx-auto mb-8 relative">
        <div className="p-7 sm:p-10 bg-[#382d23] dark:bg-[#201811] border-2 border-[#b87333] rounded-xl text-center shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <span className="text-[10px] font-mono tracking-widest text-[#d9a05b] uppercase block mb-2">
            STEAM TELEGRAPH INQUIRY
          </span>
          <h2 className="text-base sm:text-xl font-bold leading-relaxed text-[#f3dfc1]">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* BOTTOM: Industrial Copper Options */}
      <div className="max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let plateBg = "bg-[#382d23]/80 border-[#b87333]/50 text-[#f3dfc1] hover:border-[#d9a05b]";
              if (isSelected) {
                plateBg = "bg-[#b87333] border-[#ffe0b2] text-slate-950 font-bold shadow-md";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  plateBg = "bg-[#2e7d32] border-emerald-300 text-white font-bold";
                } else if (isSelected && !isCorrectOption) {
                  plateBg = "bg-[#c62828] border-rose-300 text-white font-bold";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] p-4 rounded-xl border-2 transition-all flex items-center justify-between text-left ${
                    !isConfirmed && !disabled ? "cursor-pointer hover:-translate-y-0.5 active:scale-98" : "cursor-default"
                  } ${plateBg}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded border border-current font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold leading-snug">
                      {opt}
                    </span>
                  </div>

                  {isConfirmed && (
                    <div className="shrink-0">
                      {isCorrectOption ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5 text-rose-300" />
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
              { label: "AFFIRMATIVE (True)", value: true, bValue: "true" },
              { label: "NEGATIVE (False)", value: false, bValue: "false" },
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
                  className={`w-full p-6 rounded-xl border-2 transition-all flex items-center justify-between ${
                    isSelected ? "bg-[#b87333] border-[#ffe0b2] text-slate-950 font-bold" : "bg-[#382d23] border-[#b87333]/50 text-[#f3dfc1]"
                  }`}
                >
                  <span className="text-base font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-5 bg-[#382d23] rounded-xl border-2 border-[#b87333]/60 space-y-3">
            <span className="text-xs uppercase text-[#d9a05b] block font-bold">
              // GEAR LINKAGE RATIO:
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
                  className="p-3 bg-[#241c15] border border-[#b87333]/40 rounded-lg text-xs text-[#f3dfc1] flex items-center justify-between cursor-grab"
                >
                  <span>{matchingPairs[idx]?.left} ⚙ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-[#d9a05b]" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-[#382d23] rounded-xl border-2 border-[#b87333]/60 space-y-3">
            <span className="text-xs uppercase text-[#d9a05b] block font-bold">
              // STEAM VALVE SEQUENCE:
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
                  className="p-3 bg-[#241c15] border border-[#b87333]/40 rounded-lg text-xs text-[#f3dfc1] flex items-center justify-between cursor-grab"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded bg-[#b87333] text-black text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-[#d9a05b]" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "FILL_BLANKS" && (
          <div className="p-5 bg-[#382d23] rounded-xl border-2 border-[#b87333]/60 space-y-3">
            <span className="text-xs uppercase text-[#d9a05b] block font-bold">
              // TELEGRAPH DISPATCH:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="ENTER DISPATCH..."
              className="w-full p-4 bg-[#241c15] border border-[#b87333] text-[#f3dfc1] font-mono text-sm focus:outline-hidden rounded"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="mt-8 p-4 rounded-lg bg-[#241c15] border border-[#b87333]/40 text-xs text-[#d9a05b] flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-[#d9a05b] shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">TELEGRAM EXPLANATION: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template19;
