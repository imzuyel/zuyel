"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  Gem,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 17: PRISMATIC FROSTED CRYSTAL
 * - Diamond-cut faceted polygon geometry
 * - Iridescent chromatic refraction borders (cyan/magenta/yellow)
 * - Hyper-frosted glassmorphism background
 * - Flawless Light & Dark mode compatibility
 */
export const Template17: React.FC<QuizTemplateProps> = ({
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

  const crystalClip =
    "polygon(16px 0%, calc(100% - 16px) 0%, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0% calc(100% - 16px), 0% 16px)";

  return (
    <div
      className="relative w-full rounded-[32px] p-6 sm:p-10 transition-colors duration-500 bg-gradient-to-br from-[#0e1726] via-[#121028] to-[#1c183a] text-slate-100 border border-cyan-400/30 shadow-[0_20px_60px_rgba(6,182,212,0.2)] overflow-hidden font-sans"
    >
      {/* Prismatic Shimmer Highlight */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-gradient-to-tr from-cyan-400/20 via-fuchsia-500/20 to-amber-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between pb-4 mb-6 border-b border-cyan-400/20 text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase tracking-wider">
          <Gem className="w-4 h-4 text-cyan-400" />
          <span>PRISMATIC CRYSTAL // 17</span>
        </div>
        <span className="px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-400/40 text-cyan-200 text-[10px] font-bold">
          FACET {questionIndex + 1} / {totalQuestions}
        </span>
      </div>

      {/* TOP: Diamond Faceted Question Card */}
      <div className="relative z-10 max-w-2xl mx-auto mb-8 sm:mb-10">
        <div
          className="p-7 sm:p-10 bg-white/10 dark:bg-slate-900/60 backdrop-blur-2xl border border-cyan-300/40 text-center shadow-[0_12px_40px_rgba(6,182,212,0.15)]"
          style={{ clipPath: crystalClip }}
        >
          <span className="text-[10px] font-mono tracking-widest text-cyan-300 uppercase block mb-2 font-bold">
            REFRACTIVE INQUIRY
          </span>
          <h2 className="text-lg sm:text-2xl font-black text-white leading-snug">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* BOTTOM: Prismatic Options */}
      <div className="relative z-10 max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let glassBg = "bg-white/10 hover:bg-white/15 border-cyan-400/30 text-slate-100";
              if (isSelected) {
                glassBg = "bg-cyan-500/30 border-cyan-300 text-white font-bold ring-2 ring-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.4)]";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  glassBg = "bg-emerald-600/40 border-emerald-300 text-white font-bold";
                } else if (isSelected && !isCorrectOption) {
                  glassBg = "bg-rose-600/40 border-rose-300 text-white font-bold";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] p-4 backdrop-blur-xl border transition-all flex items-center justify-between text-left ${
                    !isConfirmed && !disabled ? "cursor-pointer hover:-translate-y-0.5 active:scale-98" : "cursor-default"
                  } ${glassBg}`}
                  style={{ clipPath: crystalClip }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-black/40 border border-cyan-400/40 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
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
              { label: "VERIFIED // TRUE", value: true, bValue: "true" },
              { label: "INVALID // FALSE", value: false, bValue: "false" },
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
                  className={`w-full p-6 backdrop-blur-xl border transition-all flex items-center justify-between ${
                    isSelected ? "bg-cyan-500/30 border-cyan-300 text-white font-black" : "bg-white/10 border-cyan-400/30 text-cyan-100"
                  }`}
                  style={{ clipPath: crystalClip }}
                >
                  <span className="text-base font-bold tracking-wider">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-5 bg-white/10 backdrop-blur-xl border border-cyan-400/40 space-y-3" style={{ clipPath: crystalClip }}>
            <span className="text-xs font-mono font-bold text-cyan-300 block">
              // REFRACTION LINKAGE:
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
                  className="p-3 bg-black/40 border border-cyan-300/40 text-xs font-semibold text-cyan-100 flex items-center justify-between cursor-grab"
                >
                  <span>{matchingPairs[idx]?.left} ➔ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-cyan-400" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-white/10 backdrop-blur-xl border border-cyan-400/40 space-y-3" style={{ clipPath: crystalClip }}>
            <span className="text-xs font-mono font-bold text-cyan-300 block">
              // CRYSTALLINE ORDER:
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
                  className="p-3 bg-black/40 border border-cyan-300/40 text-xs font-semibold text-cyan-100 flex items-center justify-between cursor-grab"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-cyan-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
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
          <div className="p-5 bg-white/10 backdrop-blur-xl border border-cyan-400/40 space-y-3" style={{ clipPath: crystalClip }}>
            <span className="text-xs font-mono font-bold text-cyan-300 block">
              // INPUT VALUE:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="ENTER INPUT..."
              className="w-full p-4 bg-black/50 border border-cyan-400 text-cyan-200 text-sm font-mono focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="relative z-10 mt-8 p-4 bg-white/10 backdrop-blur-md border border-cyan-400/30 text-xs text-slate-200 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-300 font-bold">NOTE: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template17;
