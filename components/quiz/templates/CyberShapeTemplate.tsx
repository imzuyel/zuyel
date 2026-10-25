"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  ArrowRight,
  Terminal,
  Zap,
  Activity,
  Cpu,
} from "lucide-react";
import { motion, Reorder } from "framer-motion";

export const CyberShapeTemplate: React.FC<QuizTemplateProps> = ({
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

  // =========================================================================
  // MATCHING & REORDER DATA STATES
  // =========================================================================
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
      if (!selectedAnswer) {
        onSelectAnswer(initialMap);
      }
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

  // Tech Polygon Clip-Path Strings
  const questionClipPath =
    "polygon(0 0, calc(100% - 32px) 0, 100% 32px, 100% 100%, 32px 100%, 0 calc(100% - 32px))";
  const optionClipPath =
    "polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 14px 100%, 0 calc(100% - 14px))";

  const isInteractive =
    (qType as string) === "MATCHING" ||
    (qType as string) === "REORDER" ||
    (qType as string) === "DRAG_DROP";

  return (
    <div
      className="relative w-full rounded-[28px] p-4 sm:p-8 overflow-hidden transition-all duration-500 bg-[#0a0814] text-slate-100 border border-pink-500/30 shadow-[0_20px_70px_rgba(236,72,153,0.18)]"
      style={{
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(236,72,153,0.18) 0%, transparent 40%),
          radial-gradient(circle at 90% 80%, rgba(6,182,212,0.15) 0%, transparent 40%),
          linear-gradient(rgba(244,63,94,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(244,63,94,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 100% 100%, 30px 30px, 30px 30px",
      }}
    >
      {/* HUD Header Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-pink-500/20 text-xs font-mono">
        <div className="flex items-center gap-2 text-pink-400 font-black tracking-widest uppercase">
          <Terminal className="w-4 h-4 text-pink-500" />
          <span>CYBER_SHAPE_ENGINE // HUD-2049</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-pink-950/70 border border-pink-500/50 text-pink-300 rounded-sm text-[10px] font-bold">
            SECTOR {questionIndex + 1} / {totalQuestions}
          </span>
          <span className="px-2 py-1 bg-cyan-950/70 border border-cyan-500/50 text-cyan-300 rounded-sm text-[10px] font-bold flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" /> 60 FPS
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ASYMMETRICAL SPLIT LAYOUT (OVERRIDDEN TO FULL-WIDTH FOR INTERACTIVE QUESTIONS) */}
      {/* ===================================================================== */}
      <div className={isInteractive ? "w-full max-w-5xl mx-auto flex flex-col space-y-6" : "grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch"}>
        {/* LEFT COLUMN: Large Cut-out Polygon Question Card */}
        <div className={isInteractive ? "w-full" : "lg:col-span-7 flex flex-col justify-center"}>
          {/* Dual-Shell Glowing Polygon Border Container */}
          <div
            className="p-[2.5px] transition-all duration-300 shadow-[0_0_35px_rgba(236,72,153,0.3)] hover:shadow-[0_0_50px_rgba(236,72,153,0.5)]"
            style={{
              clipPath: questionClipPath,
              background: "linear-gradient(135deg, #ec4899 0%, #f59e0b 50%, #06b6d4 100%)",
            }}
          >
            {/* Inner Angled Box */}
            <div
              className={`relative w-full h-full ${isInteractive ? "min-h-[140px]" : "min-h-[280px] sm:min-h-[340px]"} bg-[#120f24] p-6 sm:p-10 flex flex-col justify-between`}
              style={{ clipPath: questionClipPath }}
            >
              {/* Broken Corner Tech Accents */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-pink-400 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

              {/* Top Tech Meta Badges */}
              <div className="flex items-center justify-between font-mono text-[10px] text-pink-400/80">
                <span className="flex items-center gap-1.5 font-bold">
                  <Activity className="w-3.5 h-3.5 text-pink-500 animate-pulse" /> TARGET_PROMPT_MATRIX
                </span>
                <span className="tracking-widest opacity-60">CHAMFER_HEX // 32PX</span>
              </div>

              {/* Giant Background Watermark Symbol */}
              <div className="absolute right-4 bottom-2 text-[120px] sm:text-[160px] font-black text-pink-500/5 select-none pointer-events-none font-mono">
                ?
              </div>

              {/* Question Text */}
              <div className="my-auto py-4 relative z-10">
                <h2 className="text-lg sm:text-2xl font-black text-white leading-snug tracking-tight font-sans drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                  {question.questionText}
                </h2>
              </div>

              {/* Bottom Tech Status Bar */}
              <div className="pt-4 border-t border-pink-500/20 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>CORE_STATUS: ACTIVE</span>
                </div>
                <span className="text-amber-400 font-bold">MARKS: +{question.marks || 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Stacked Angled Cyber Options */}
        <div className={isInteractive ? "w-full space-y-4" : "lg:col-span-5 flex flex-col justify-center space-y-3.5"}>
          {/* 1. MCQ: Stacked Custom Clipped Buttons */}
          {qType === "MCQ" && (
            <div className="space-y-3.5">
              {question.options.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrectOption = idx === question.correctOptionIndex;

                let borderGrad = "linear-gradient(135deg, rgba(236,72,153,0.4) 0%, rgba(6,182,212,0.4) 100%)";
                let barColor = "from-pink-500 to-rose-600";
                let innerBg = "bg-[#141126]";
                let textCol = "text-slate-200";

                if (isSelected) {
                  borderGrad = "linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #06b6d4 100%)";
                  barColor = "from-amber-400 to-pink-500";
                  innerBg = "bg-[#1e153b]";
                  textCol = "text-white font-bold";
                }

                if (isConfirmed) {
                  if (isCorrectOption) {
                    borderGrad = "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)";
                    barColor = "from-emerald-400 to-teal-500";
                    innerBg = "bg-[#0b241b]";
                    textCol = "text-emerald-200 font-bold";
                  } else if (isSelected && !isCorrectOption) {
                    borderGrad = "linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)";
                    barColor = "from-rose-500 to-red-600";
                    innerBg = "bg-[#291118]";
                    textCol = "text-rose-200 font-bold";
                  }
                }

                return (
                  <div
                    key={idx}
                    className="p-[2px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] group shadow-[0_4px_18px_rgba(0,0,0,0.5)]"
                    style={{
                      clipPath: optionClipPath,
                      background: borderGrad,
                    }}
                  >
                    <button
                      type="button"
                      disabled={disabled || isConfirmed}
                      onClick={() => onSelectAnswer(idx)}
                      className={`w-full min-h-[58px] p-3.5 flex items-center justify-between text-left transition-colors duration-200 relative ${innerBg} ${
                        !isConfirmed && !disabled ? "cursor-pointer" : "cursor-default"
                      }`}
                      style={{ clipPath: optionClipPath }}
                    >
                      {/* Left Distinct Tech Color Bar */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-b ${barColor} shadow-[0_0_12px_rgba(236,72,153,0.8)]`}
                      />

                      <div className="flex items-center gap-3.5 pl-3 min-w-0">
                        {/* Cut-out Tech Identifier Badge */}
                        <span className="w-7 h-7 rounded-md bg-slate-900 border border-pink-500/40 font-mono font-black text-xs text-pink-300 flex items-center justify-center shrink-0 shadow-inner group-hover:border-pink-400 group-hover:text-white transition-colors">
                          {String.fromCharCode(65 + idx)}
                        </span>

                        <span className={`text-xs sm:text-sm font-sans leading-snug ${textCol}`}>
                          {opt}
                        </span>
                      </div>

                      {/* Right Status Indicator */}
                      <div className="shrink-0 pr-4">
                        {isConfirmed ? (
                          isCorrectOption ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
                          ) : isSelected ? (
                            <XCircle className="w-5 h-5 text-rose-400" />
                          ) : null
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-pink-500/40 group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_#22d3ee] transition-all" />
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. TRUE_FALSE: Two Large Angled Cards */}
          {qType === "TRUE_FALSE" && (
            <div className="space-y-4">
              {[
                { label: "সত্য (True)", value: true, bValue: "true", code: "DATA_TRUE" },
                { label: "মিথ্যা (False)", value: false, bValue: "false", code: "DATA_FALSE" },
              ].map((item, idx) => {
                const isSelected =
                  selectedAnswer === item.value ||
                  selectedAnswer === item.bValue ||
                  selectedAnswer === idx;

                const expectedBool =
                  question.correctBoolean !== undefined
                    ? question.correctBoolean
                    : question.correctOptionIndex === 0;

                const isCorrectChoice = expectedBool === item.value;

                let borderGrad = isSelected
                  ? "linear-gradient(135deg, #ec4899 0%, #06b6d4 100%)"
                  : "linear-gradient(135deg, rgba(236,72,153,0.35) 0%, rgba(6,182,212,0.35) 100%)";
                let innerBg = isSelected ? "bg-[#1c1638]" : "bg-[#141126]";

                if (isConfirmed) {
                  if (isCorrectChoice) {
                    borderGrad = "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)";
                    innerBg = "bg-[#0b241b]";
                  } else if (isSelected) {
                    borderGrad = "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)";
                    innerBg = "bg-[#33111b]";
                  } else {
                    borderGrad = "linear-gradient(135deg, rgba(148,163,184,0.2) 0%, rgba(148,163,184,0.1) 100%)";
                    innerBg = "bg-[#141126]/60";
                  }
                }

                return (
                  <div
                    key={idx}
                    className="p-[2.5px] transition-all duration-300 hover:scale-[1.02] shadow-[0_6px_22px_rgba(0,0,0,0.6)]"
                    style={{
                      clipPath: optionClipPath,
                      background: borderGrad,
                    }}
                  >
                    <button
                      type="button"
                      disabled={disabled || isConfirmed}
                      onClick={() => onSelectAnswer(item.value)}
                      className={`w-full p-5 flex items-center justify-between text-left relative ${innerBg} ${
                        !isConfirmed && !disabled ? "cursor-pointer" : "cursor-default"
                      }`}
                      style={{ clipPath: optionClipPath }}
                    >
                      <div className="flex items-center gap-4 pl-3">
                        <span className={`w-10 h-10 rounded-lg border font-mono text-xl font-black text-white flex items-center justify-center ${
                          isSelected ? "bg-pink-950/80 border-pink-500 text-pink-300" : "bg-slate-900 border-slate-700 text-white"
                        }`}>
                          {idx === 0 ? "1" : "2"}
                        </span>
                        <div>
                          <span className="text-base font-black text-white block">
                            {item.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            HEX // {item.code}
                          </span>
                        </div>
                      </div>

                      <div className="pr-4">
                        {isConfirmed && (
                          isCorrectChoice ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
                          ) : isSelected ? (
                            <XCircle className="w-6 h-6 text-rose-400" />
                          ) : null
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. MATCHING: Cyber Reorder Blocks */}
          {qType === "MATCHING" && (
            <div className="p-4 bg-[#141126] rounded-xl border border-pink-500/30 space-y-3">
              <span className="text-[10px] font-mono font-bold text-pink-400 uppercase tracking-wider block">
                ⇄ MATCHING MATRIX:
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
                    className="p-3 bg-slate-900 border border-pink-500/40 text-xs font-semibold text-pink-200 flex items-center justify-between cursor-grab rounded-lg"
                  >
                    <span>{matchingPairs[idx]?.left} ➔ {itemVal}</span>
                    <GripVertical className="w-4 h-4 text-pink-400" />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          )}

          {/* 4. REORDER: Angled Chevron Sequence */}
          {qType === "REORDER" && (
            <div className="p-4 bg-[#141126] rounded-xl border border-cyan-500/30 space-y-3">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                ⬇ SEQUENCE REORDER:
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
                    className="p-3 bg-slate-900 border border-cyan-500/40 text-xs font-semibold text-cyan-200 flex items-center justify-between cursor-grab rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono text-[10px] flex items-center justify-center rounded-sm">
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

          {/* 5. FILL_BLANKS: Angled Tech Input Terminal */}
          {qType === "FILL_BLANKS" && (
            <div
              className="p-[2px] shadow-[0_0_25px_rgba(6,182,212,0.3)]"
              style={{
                clipPath: optionClipPath,
                background: "linear-gradient(135deg, #06b6d4 0%, #ec4899 100%)",
              }}
            >
              <div className="p-5 bg-[#120f24] space-y-3" style={{ clipPath: optionClipPath }}>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
                  TERMINAL_KEYIN //
                </span>
                <input
                  type="text"
                  disabled={disabled || isConfirmed}
                  value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
                  onChange={(e) => onSelectAnswer(e.target.value)}
                  placeholder="INPUT TEXT VALUE..."
                  className="w-full p-3 bg-slate-950 border border-cyan-500/50 text-cyan-200 text-xs font-mono focus:outline-hidden focus:border-cyan-300 rounded-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Explanation Banner */}
      {isConfirmed && question.explanation && (
        <div className="mt-6 p-4 rounded-xl bg-slate-900/90 border border-pink-500/40 text-xs text-slate-300 flex items-start gap-2.5 font-mono">
          <HelpCircle className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-pink-300 font-bold">EXPLANATION // LOG: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CyberShapeTemplate;
