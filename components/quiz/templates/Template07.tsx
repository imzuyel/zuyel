"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  Crosshair,
  Compass,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 07: TECHNICAL BLUEPRINT CAD
 * - Blueprint drafting grid paper background (deep blueprint blue #0d3b66, dark: #081d33)
 * - Measurement ticks, crosshair drafting marks and dimension callouts
 * - Monospace drafting technical font & white CAD lines
 * - Flawless Light & Dark mode compatibility
 */
export const Template07: React.FC<QuizTemplateProps> = ({
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
      className="relative w-full rounded-2xl p-6 sm:p-10 transition-colors duration-500 bg-[#0d3b66] dark:bg-[#07192d] text-white border-2 border-cyan-300/60 shadow-[0_20px_50px_rgba(13,59,102,0.4)] font-mono"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px),
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px, 80px 80px, 16px 16px, 16px 16px",
      }}
    >
      {/* CAD Corner Crosshairs */}
      <div className="absolute top-3 left-3 text-cyan-300 opacity-60">
        <Crosshair className="w-5 h-5" />
      </div>
      <div className="absolute top-3 right-3 text-cyan-300 opacity-60">
        <Crosshair className="w-5 h-5" />
      </div>
      <div className="absolute bottom-3 left-3 text-cyan-300 opacity-60">
        <Crosshair className="w-5 h-5" />
      </div>
      <div className="absolute bottom-3 right-3 text-cyan-300 opacity-60">
        <Crosshair className="w-5 h-5" />
      </div>

      {/* Blueprint Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-cyan-300/40 text-xs">
        <div className="flex items-center gap-2 text-cyan-200">
          <Compass className="w-4 h-4 text-cyan-300" />
          <span className="font-bold tracking-widest uppercase">DWG_SPEC // 07-BLUEPRINT</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 border border-cyan-300 text-cyan-200 text-[10px] font-bold">
            SHEET {questionIndex + 1}/{totalQuestions}
          </span>
          <span className="text-[10px] text-cyan-400">SCALE: 1:1</span>
        </div>
      </div>

      {/* TOP: Question Drafting Box with Dimension Lines */}
      <div className="max-w-2xl mx-auto mb-8 relative">
        <div className="relative p-6 sm:p-8 bg-[#092c4e] dark:bg-[#051424] border-2 border-dashed border-cyan-300/70 rounded-lg text-center">
          <span className="inline-block px-2 py-0.5 bg-cyan-400 text-slate-950 font-black text-[10px] tracking-widest uppercase mb-2">
            SPECIFICATION_PROMPT
          </span>
          <h2 className="text-base sm:text-xl font-bold leading-relaxed text-cyan-50">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* BOTTOM: Blueprint Option Wireframes */}
      <div className="max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let borderStyle = "border-cyan-300/50 bg-[#092c4e]/70 text-cyan-100 hover:border-cyan-300";
              if (isSelected) {
                borderStyle = "border-cyan-300 bg-cyan-400 text-slate-950 font-black ring-2 ring-cyan-200";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  borderStyle = "border-emerald-400 bg-emerald-500 text-white font-black";
                } else if (isSelected && !isCorrectOption) {
                  borderStyle = "border-rose-400 bg-rose-600 text-white font-black";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] p-4 rounded-lg border-2 transition-all flex items-center justify-between text-left ${
                    !isConfirmed && !disabled ? "cursor-pointer hover:-translate-y-0.5" : "cursor-default"
                  } ${borderStyle}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded border border-current font-bold text-xs flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm font-medium leading-snug">
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
              { label: "TRUE [VERIFIED]", value: true, bValue: "true" },
              { label: "FALSE [REJECTED]", value: false, bValue: "false" },
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
                  className={`w-full p-6 rounded-lg border-2 border-cyan-300 transition-all flex items-center justify-between text-left ${
                    isSelected ? "bg-cyan-400 text-slate-950 font-black" : "bg-[#092c4e]/80 text-cyan-100"
                  }`}
                >
                  <span className="text-sm font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-5 bg-[#092c4e] rounded-lg border-2 border-cyan-300/60 space-y-3">
            <span className="text-xs text-cyan-300 uppercase block font-bold">
              [CROSS-REFERENCE LINKAGE MAPPING]:
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
                  className="p-3 bg-[#0d3b66] border border-cyan-300/40 rounded text-xs text-cyan-100 flex items-center justify-between cursor-grab"
                >
                  <span>{matchingPairs[idx]?.left} ──▶ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-cyan-300" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-[#092c4e] rounded-lg border-2 border-cyan-300/60 space-y-3">
            <span className="text-xs text-cyan-300 uppercase block font-bold">
              [LINEAR ASSEMBLY SEQUENCE]:
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
                  className="p-3 bg-[#0d3b66] border border-cyan-300/40 rounded text-xs text-cyan-100 flex items-center justify-between cursor-grab"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-cyan-400 text-slate-950 font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-cyan-300" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "FILL_BLANKS" && (
          <div className="p-5 bg-[#092c4e] rounded-lg border-2 border-cyan-300/60 space-y-3">
            <span className="text-xs text-cyan-300 uppercase block font-bold">
              [KEYIN VARIABLE VALUE]:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="INPUT PARAMETER..."
              className="w-full p-3.5 bg-[#0d3b66] border border-cyan-300 text-cyan-100 font-mono text-xs focus:outline-hidden rounded"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="mt-8 p-4 rounded-lg bg-[#092c4e] border border-cyan-300/40 text-xs text-cyan-200 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-300 font-bold">NOTE: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template07;
