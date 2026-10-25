"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  Gamepad2,
  Coins,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 08: RETRO 8-BIT PIXEL ARCADE
 * - 8-bit stepped pixel border styling (via stepped box-shadows)
 * - Arcade CRT scanline background texture with coin slot HUD
 * - High-contrast neon arcade yellow & cyan colors
 * - Flawless Light & Dark mode compatibility
 */
export const Template08: React.FC<QuizTemplateProps> = ({
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
      className="relative w-full p-6 sm:p-10 transition-colors duration-500 bg-[#16003b] dark:bg-[#0c0022] text-[#ffe600] border-4 border-[#ffe600] shadow-[0_0_25px_rgba(255,230,0,0.35)] font-mono"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 50%),
          linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06))
        `,
        backgroundSize: "100% 4px, 6px 100%",
      }}
    >
      {/* Top Arcade Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b-2 border-dashed border-[#ffe600] text-xs">
        <div className="flex items-center gap-2 text-[#00ffcc] font-black uppercase tracking-widest animate-pulse">
          <Gamepad2 className="w-5 h-5 text-[#ffe600]" />
          <span>ARCADE_08 // 1P READY</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#ff007f] font-bold">
            <Coins className="w-4 h-4 animate-spin" /> CREDIT 02
          </span>
          <span className="px-2 py-0.5 bg-[#ffe600] text-black font-black text-[10px]">
            STAGE {questionIndex + 1}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* TOP: Question Pixel Card */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="p-6 sm:p-8 bg-black/80 border-4 border-[#00ffcc] text-center shadow-[4px_4px_0px_#ff007f]">
          <span className="inline-block px-2 py-0.5 bg-[#ff007f] text-white font-black text-[10px] tracking-widest uppercase mb-2">
            ** MISSION PROMPT **
          </span>
          <h2 className="text-base sm:text-xl font-black text-white leading-relaxed">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* BOTTOM: Pixel Options */}
      <div className="max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let btnBorder = "border-[#00ffcc] bg-black/80 text-white hover:bg-[#00ffcc] hover:text-black";
              if (isSelected) {
                btnBorder = "border-[#ffe600] bg-[#ffe600] text-black font-black shadow-[4px_4px_0px_#ff007f]";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  btnBorder = "border-[#00ff00] bg-[#00ff00] text-black font-black";
                } else if (isSelected && !isCorrectOption) {
                  btnBorder = "border-[#ff0055] bg-[#ff0055] text-white font-black";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] p-4 border-4 transition-all flex items-center justify-between text-left ${
                    !isConfirmed && !disabled ? "cursor-pointer active:translate-x-1 active:translate-y-1" : "cursor-default"
                  } ${btnBorder}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 bg-black text-[#ffe600] border-2 border-current font-black text-xs flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm font-bold leading-snug">
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
              { label: "[TRUE]", value: true, bValue: "true" },
              { label: "[FALSE]", value: false, bValue: "false" },
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
                  className={`w-full p-6 border-4 border-[#00ffcc] transition-all flex items-center justify-between ${
                    isSelected ? "bg-[#ffe600] text-black font-black shadow-[4px_4px_0px_#ff007f]" : "bg-black text-white hover:bg-[#00ffcc] hover:text-black"
                  }`}
                >
                  <span className="text-base font-black">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-5 bg-black/90 border-4 border-[#ffe600] space-y-3">
            <span className="text-xs font-black uppercase text-[#00ffcc] block">
              &gt;&gt; LINK MATCHING TARGETS:
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
                  className="p-3 bg-[#16003b] border-2 border-[#00ffcc] text-xs font-bold text-white flex items-center justify-between cursor-grab"
                >
                  <span>{matchingPairs[idx]?.left} =&gt; {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-[#ffe600]" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-black/90 border-4 border-[#ffe600] space-y-3">
            <span className="text-xs font-black uppercase text-[#00ffcc] block">
              &gt;&gt; ORDER COMBO STACK:
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
                  className="p-3 bg-[#16003b] border-2 border-[#00ffcc] text-xs font-bold text-white flex items-center justify-between cursor-grab"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-[#ff007f] text-white font-black text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-[#ffe600]" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "FILL_BLANKS" && (
          <div className="p-5 bg-black/90 border-4 border-[#ffe600] space-y-3">
            <span className="text-xs font-black uppercase text-[#00ffcc] block">
              &gt;&gt; ENTER PASSCODE:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="ENTER ANSWER..."
              className="w-full p-4 bg-black border-2 border-[#00ffcc] text-[#ffe600] font-black text-sm uppercase focus:outline-hidden focus:border-[#ffe600]"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="mt-8 p-4 bg-black/90 border-2 border-[#ffe600] text-xs text-[#ffe600] flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-[#ff007f] shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-[#00ffcc]">HINT // </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template08;
