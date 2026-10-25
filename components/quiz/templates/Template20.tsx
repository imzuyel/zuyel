"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  Crosshair,
  ShieldAlert,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 20: HOLOGRAPHIC SCI-FI HUD VISOR
 * - Circular targeting HUD reticles and corner brackets
 * - Transparent sci-fi holographic visor (#030c14)
 * - Tactical telemetry labels, cyan vector lines
 * - Flawless Light & Dark mode compatibility
 */
export const Template20: React.FC<QuizTemplateProps> = ({
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
      className="relative w-full rounded-3xl p-6 sm:p-10 transition-colors duration-500 bg-[#030e17] text-cyan-100 border-2 border-cyan-400/50 shadow-[0_20px_60px_rgba(6,182,212,0.25)] font-mono overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(6,182,212,0.12) 0%, transparent 70%),
          linear-gradient(rgba(6,182,212,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.05) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 40px 40px, 40px 40px",
      }}
    >
      {/* Sci-Fi HUD Corner Brackets */}
      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between pb-4 mb-6 border-b border-cyan-400/30 text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider">
          <Crosshair className="w-4 h-4 animate-spin" />
          <span>HUD VISOR // TACTICAL #20</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-cyan-300">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> SHIELD: 100%
          </span>
          <span className="px-2.5 py-0.5 bg-cyan-950 border border-cyan-400/60 text-cyan-300 text-[10px] font-bold">
            SECTOR {questionIndex + 1}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* TOP: HUD Question Reticle Box */}
      <div className="relative z-10 max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="p-7 sm:p-10 bg-cyan-950/40 backdrop-blur-xl border border-cyan-400/50 rounded-2xl text-center shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase block mb-2 font-bold">
            [ENGAGEMENT OBJECTIVE]
          </span>
          <h2 className="text-base sm:text-xl font-black text-white leading-relaxed">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* BOTTOM: Holographic Visor Option Nodes */}
      <div className="relative z-10 max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let hudBg = "bg-cyan-950/30 border-cyan-400/40 text-cyan-100 hover:border-cyan-300 hover:bg-cyan-900/30";
              if (isSelected) {
                hudBg = "bg-cyan-500/30 border-cyan-300 text-white font-bold ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  hudBg = "bg-emerald-600/40 border-emerald-400 text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)]";
                } else if (isSelected && !isCorrectOption) {
                  hudBg = "bg-rose-600/40 border-rose-400 text-white font-bold shadow-[0_0_20px_rgba(244,63,94,0.4)]";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] p-4 rounded-xl border backdrop-blur-md transition-all flex items-center justify-between text-left ${
                    !isConfirmed && !disabled ? "cursor-pointer hover:-translate-y-0.5 active:scale-98" : "cursor-default"
                  } ${hudBg}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded border border-cyan-400/50 bg-black/40 font-mono font-bold text-xs flex items-center justify-center shrink-0 text-cyan-300">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold leading-snug">
                      {opt}
                    </span>
                  </div>

                  {isConfirmed && (
                    <div className="shrink-0">
                      {isCorrectOption ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5 text-rose-400" />
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
              { label: "CONFIRMED // TRUE", value: true, bValue: "true" },
              { label: "DENIED // FALSE", value: false, bValue: "false" },
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
                  className={`w-full p-6 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected ? "bg-cyan-500/30 border-cyan-300 text-white font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)]" : "bg-cyan-950/30 border-cyan-400/40 text-cyan-200"
                  }`}
                >
                  <span className="text-sm font-bold tracking-wider">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-5 bg-cyan-950/40 rounded-xl border border-cyan-400/40 space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-300 block uppercase">
              // TELEMETRY LINK MAPPING:
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
                  className="p-3 bg-black/60 border border-cyan-400/40 rounded text-xs font-semibold text-cyan-100 flex items-center justify-between cursor-grab"
                >
                  <span>{matchingPairs[idx]?.left} ──▶ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-cyan-400" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-cyan-950/40 rounded-xl border border-cyan-400/40 space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-300 block uppercase">
              // RETICLE TARGET SEQUENCE:
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
                  className="p-3 bg-black/60 border border-cyan-400/40 rounded text-xs font-semibold text-cyan-100 flex items-center justify-between cursor-grab"
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
          <div className="p-5 bg-cyan-950/40 rounded-xl border border-cyan-400/40 space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-300 block uppercase">
              // TELEMETRY KEYIN:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="ENTER TELEMETRY..."
              className="w-full p-4 bg-black/60 border border-cyan-400 text-cyan-200 text-sm font-mono focus:outline-hidden rounded"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="relative z-10 mt-8 p-4 rounded-xl bg-cyan-950/60 border border-cyan-400/30 text-xs text-cyan-200 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-300 font-bold">HUD DEBRIEF // </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template20;
