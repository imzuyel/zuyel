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
 * TEMPLATE 16: SYNTHWAVE 80S WIREFRAME HORIZON
 * - Perspective wireframe grid floor receding into horizon
 * - Retro neon glowing vector sun & fuchsia/cyan laser aesthetic
 * - 80s synth retro arcade styling
 * - Flawless Light & Dark mode compatibility
 */
export const Template16: React.FC<QuizTemplateProps> = ({
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
      className="relative w-full rounded-[32px] p-6 sm:p-10 transition-colors duration-500 bg-[#12072b] text-fuchsia-100 border-2 border-fuchsia-500/50 shadow-[0_20px_60px_rgba(217,70,239,0.3)] overflow-hidden font-sans"
      style={{
        backgroundImage: `
          linear-gradient(rgba(217,70,239,0.18) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.15) 1px, transparent 1px)
        `,
        backgroundSize: "36px 36px, 36px 36px",
      }}
    >
      {/* Retro Wireframe Horizon Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-fuchsia-950/80 to-transparent pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between pb-4 mb-6 border-b border-fuchsia-500/30 text-xs font-mono">
        <div className="flex items-center gap-2 text-fuchsia-400 font-bold uppercase tracking-widest">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>SYNTHWAVE_80S // TRACK 16</span>
        </div>
        <span className="px-3 py-1 rounded-full bg-fuchsia-950 border border-fuchsia-500/40 text-fuchsia-300 text-[10px] font-bold">
          STAGE {questionIndex + 1} OF {totalQuestions}
        </span>
      </div>

      {/* TOP: Neon Synthwave Question Capsule */}
      <div className="relative z-10 max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="p-7 sm:p-10 rounded-2xl bg-[#1e0e45]/90 border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] text-center">
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase block mb-2 font-bold">
            NEON VECTOR PROMPT
          </span>
          <h2 className="text-lg sm:text-2xl font-black text-white leading-snug">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* BOTTOM: Synthwave Glow Options */}
      <div className="relative z-10 max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let cardBg = "bg-[#1c0c3f]/80 border-fuchsia-500/40 text-fuchsia-100 hover:border-cyan-400";
              if (isSelected) {
                cardBg = "bg-gradient-to-r from-fuchsia-600 to-pink-600 border-white text-white font-bold shadow-[0_0_25px_rgba(217,70,239,0.5)]";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  cardBg = "bg-emerald-600 border-emerald-300 text-white font-bold";
                } else if (isSelected && !isCorrectOption) {
                  cardBg = "bg-rose-600 border-rose-300 text-white font-bold";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] p-4 rounded-xl border-2 transition-all flex items-center justify-between text-left ${
                    !isConfirmed && !disabled ? "cursor-pointer hover:-translate-y-0.5" : "cursor-default"
                  } ${cardBg}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-black/60 border border-current font-mono font-bold text-xs flex items-center justify-center shrink-0">
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
              { label: "TRUE // 1", value: true, bValue: "true" },
              { label: "FALSE // 0", value: false, bValue: "false" },
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
                    isSelected ? "bg-fuchsia-600 border-cyan-400 text-white font-black shadow-[0_0_25px_rgba(217,70,239,0.5)]" : "bg-[#1c0c3f]/80 border-fuchsia-500/40 text-fuchsia-200"
                  }`}
                >
                  <span className="text-base font-bold tracking-wider">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-5 bg-[#1e0e45]/90 rounded-xl border-2 border-fuchsia-500/40 space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 block">
              // REORDER DATA LINKS:
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
                  className="p-3 bg-black/60 border border-fuchsia-400/50 rounded-lg text-xs font-bold text-fuchsia-200 flex items-center justify-between cursor-grab"
                >
                  <span>{matchingPairs[idx]?.left} ➔ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-cyan-400" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-[#1e0e45]/90 rounded-xl border-2 border-fuchsia-500/40 space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 block">
              // VECTOR SEQUENCE:
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
                  className="p-3 bg-black/60 border border-fuchsia-400/50 rounded-lg text-xs font-bold text-fuchsia-200 flex items-center justify-between cursor-grab"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-fuchsia-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-cyan-400" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "FILL_BLANKS" && (
          <div className="p-5 bg-[#1e0e45]/90 rounded-xl border-2 border-fuchsia-500/40 space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 block">
              INPUT KEY:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="ENTER STRING..."
              className="w-full p-4 bg-black/80 border border-fuchsia-400 text-cyan-300 font-mono text-sm focus:outline-hidden rounded-lg"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="relative z-10 mt-8 p-4 rounded-xl bg-black/60 border border-fuchsia-500/40 text-xs text-fuchsia-200 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-400 font-bold">NOTE: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template16;
