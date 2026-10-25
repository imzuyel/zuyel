"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  Crown,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 14: LUXURY MIDNIGHT GOLD
 * - Deep midnight onyx canvas (#0b0c10)
 * - Metallic gold art deco borders and geometric corner brackets
 * - Executive serif typography and golden foil accents
 * - Flawless Light & Dark mode compatibility
 */
export const Template14: React.FC<QuizTemplateProps> = ({
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
      className="relative w-full rounded-2xl p-6 sm:p-12 transition-colors duration-500 bg-[#0f1117] dark:bg-[#07080b] text-[#d4af37] border-2 border-[#d4af37]/60 shadow-[0_25px_60px_rgba(0,0,0,0.8)] font-serif"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 0%, rgba(212,175,55,0.15) 0%, transparent 60%)
        `,
      }}
    >
      {/* Art Deco Gold Corner Accents */}
      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#d4af37]" />
      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#d4af37]" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#d4af37]" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#d4af37]" />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 mb-8 border-b border-[#d4af37]/30 text-xs">
        <div className="flex items-center gap-2 text-[#d4af37] tracking-[0.2em] uppercase font-bold">
          <Crown className="w-4 h-4" />
          <span>ROYAL EDITION // 14</span>
        </div>
        <span className="px-3 py-1 border border-[#d4af37]/50 text-[#d4af37] text-[10px] tracking-widest uppercase">
          OPUS {questionIndex + 1} / {totalQuestions}
        </span>
      </div>

      {/* TOP: Question Card with Gold Inlay */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="p-8 sm:p-10 bg-black/60 border border-[#d4af37]/40 rounded-xl text-center shadow-[inset_0_0_20px_rgba(212,175,55,0.1)]">
          <span className="text-[10px] tracking-[0.25em] text-[#d4af37]/70 uppercase block mb-3">
            EXECUTIVE INQUIRY
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed tracking-wide">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* BOTTOM: Luxury Gold Option Tiles */}
      <div className="max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let tileStyle = "border-[#d4af37]/30 bg-black/40 text-neutral-200 hover:border-[#d4af37] hover:bg-[#d4af37]/10";
              if (isSelected) {
                tileStyle = "border-[#d4af37] bg-[#d4af37] text-slate-950 font-bold shadow-[0_0_25px_rgba(212,175,55,0.4)]";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  tileStyle = "border-emerald-400 bg-emerald-600 text-white font-bold";
                } else if (isSelected && !isCorrectOption) {
                  tileStyle = "border-rose-400 bg-rose-700 text-white font-bold";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[60px] p-4 rounded-lg border transition-all flex items-center justify-between text-left ${
                    !isConfirmed && !disabled ? "cursor-pointer hover:-translate-y-0.5" : "cursor-default"
                  } ${tileStyle}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded border border-current text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm leading-snug">
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
              { label: "VERITAS (True)", value: true, bValue: "true" },
              { label: "FALSITAS (False)", value: false, bValue: "false" },
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
                  className={`w-full p-6 rounded-lg border transition-all flex items-center justify-between ${
                    isSelected ? "border-[#d4af37] bg-[#d4af37] text-slate-950 font-bold" : "border-[#d4af37]/40 bg-black/40 text-[#d4af37]"
                  }`}
                >
                  <span className="text-base font-bold tracking-wider">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-5 bg-black/60 rounded-xl border border-[#d4af37]/40 space-y-3">
            <span className="text-xs text-[#d4af37] uppercase tracking-wider block font-bold">
              CONCORDANCE MAPPING:
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
                  className="p-3 bg-neutral-900 border border-[#d4af37]/30 rounded text-xs text-neutral-200 flex items-center justify-between cursor-grab"
                >
                  <span>{matchingPairs[idx]?.left} ➔ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-[#d4af37]" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-black/60 rounded-xl border border-[#d4af37]/40 space-y-3">
            <span className="text-xs text-[#d4af37] uppercase tracking-wider block font-bold">
              HIERARCHICAL ORDER:
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
                  className="p-3 bg-neutral-900 border border-[#d4af37]/30 rounded text-xs text-neutral-200 flex items-center justify-between cursor-grab"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded border border-[#d4af37] text-[10px] flex items-center justify-center text-[#d4af37]">
                      {idx + 1}
                    </span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-[#d4af37]" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "FILL_BLANKS" && (
          <div className="p-5 bg-black/60 rounded-xl border border-[#d4af37]/40 space-y-3">
            <span className="text-xs text-[#d4af37] uppercase tracking-wider block font-bold">
              EXECUTIVE TESTIMONY:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="ENTER TESTIMONY..."
              className="w-full p-4 bg-black border border-[#d4af37]/60 text-[#d4af37] text-sm focus:outline-hidden rounded"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="mt-8 p-4 rounded-lg bg-black/70 border border-[#d4af37]/30 text-xs text-neutral-300 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#d4af37] font-bold">EXEGESIS // </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template14;
