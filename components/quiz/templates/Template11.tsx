"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  Terminal,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 11: MATRIX TERMINAL CLI
 * - Green phosphor CRT scanline overlay
 * - Monospace terminal shell prompt (root@quiz:~#)
 * - Blinking block cursor _
 * - Flawless Light & Dark mode compatibility
 */
export const Template11: React.FC<QuizTemplateProps> = ({
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
      className="relative w-full rounded-2xl p-6 sm:p-10 transition-colors duration-500 bg-[#051109] text-[#22c55e] border-2 border-[#22c55e]/60 shadow-[0_0_30px_rgba(34,197,94,0.25)] font-mono"
      style={{
        backgroundImage: `
          linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.5) 50%),
          linear-gradient(90deg, rgba(255,0,0,0.03), rgba(0,255,0,0.02), rgba(0,0,255,0.03))
        `,
        backgroundSize: "100% 3px, 6px 100%",
      }}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#22c55e]/30 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#22c55e]" />
          <span className="font-bold">bash // matrix-cli-11.sh</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span>PID: 4096</span>
          <span className="px-2 py-0.5 bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#22c55e] font-bold">
            Q {questionIndex + 1}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* TOP: Question CLI Output */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="p-6 bg-black/70 border border-[#22c55e]/50 rounded-lg">
          <p className="text-[10px] text-[#22c55e]/70 mb-2">
            root@quiz:~# cat /etc/question_{questionIndex + 1}.txt
          </p>
          <h2 className="text-base sm:text-xl font-bold leading-relaxed text-white">
            {question.questionText}
            <span className="inline-block w-2.5 h-4 ml-1 bg-[#22c55e] animate-pulse align-middle" />
          </h2>
        </div>
      </div>

      {/* BOTTOM: Terminal Choice Directives */}
      <div className="max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let style = "border-[#22c55e]/40 bg-black/60 text-[#22c55e] hover:border-[#22c55e] hover:bg-[#22c55e]/10";
              if (isSelected) {
                style = "border-[#22c55e] bg-[#22c55e] text-black font-black shadow-[0_0_15px_rgba(34,197,94,0.5)]";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  style = "border-cyan-400 bg-cyan-500 text-black font-black";
                } else if (isSelected && !isCorrectOption) {
                  style = "border-red-500 bg-red-600 text-white font-black";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] p-4 rounded-lg border-2 transition-all flex items-center justify-between text-left ${
                    !isConfirmed && !disabled ? "cursor-pointer" : "cursor-default"
                  } ${style}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold shrink-0">
                      [{String.fromCharCode(65 + idx)}]
                    </span>
                    <span className="text-xs sm:text-sm leading-snug">
                      {opt}
                    </span>
                  </div>

                  {isConfirmed && (
                    <div className="shrink-0">
                      {isCorrectOption ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5" />
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
              { label: "[1] RETURN TRUE (0x01)", value: true, bValue: "true" },
              { label: "[0] RETURN FALSE (0x00)", value: false, bValue: "false" },
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
                  className={`w-full p-6 rounded-lg border-2 border-[#22c55e]/50 transition-all flex items-center justify-between ${
                    isSelected ? "bg-[#22c55e] text-black font-black" : "bg-black/60 text-[#22c55e]"
                  }`}
                >
                  <span className="text-sm font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-5 bg-black/80 rounded-lg border border-[#22c55e]/40 space-y-3">
            <span className="text-xs text-[#22c55e] uppercase block font-bold">
              // PIPE STREAM REORDERING:
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
                  className="p-3 bg-black border border-[#22c55e]/30 text-xs text-[#22c55e] flex items-center justify-between cursor-grab"
                >
                  <span>{matchingPairs[idx]?.left} |&gt; {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-[#22c55e]" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-black/80 rounded-lg border border-[#22c55e]/40 space-y-3">
            <span className="text-xs text-[#22c55e] uppercase block font-bold">
              // ARRAY BUFFER SORT:
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
                  className="p-3 bg-black border border-[#22c55e]/30 text-xs text-[#22c55e] flex items-center justify-between cursor-grab"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400">0x0{idx + 1}:</span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-[#22c55e]" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "FILL_BLANKS" && (
          <div className="p-5 bg-black/80 rounded-lg border border-[#22c55e]/40 space-y-3">
            <span className="text-xs text-[#22c55e] uppercase block font-bold">
              // STDIN BUFFER:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="TYPE INPUT VALUE..."
              className="w-full p-4 bg-black border border-[#22c55e] text-[#22c55e] font-mono text-sm focus:outline-hidden focus:ring-1 focus:ring-[#22c55e]"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="mt-8 p-4 bg-black/80 border border-[#22c55e]/30 text-xs text-[#22c55e]/90 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#22c55e] font-bold">STDOUT EXPLANATION: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template11;
