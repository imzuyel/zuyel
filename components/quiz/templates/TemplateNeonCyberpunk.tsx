"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Terminal,
  Zap,
} from "lucide-react";
import { Reorder, motion } from "framer-motion";

export const TemplateNeonCyberpunk: React.FC<QuizTemplateProps> = ({
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
  // MATCHING: Right-side draggable state
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

  const handleReorderMatching = (newOrder: string[]) => {
    if (disabled || isConfirmed) return;
    setRightOrder(newOrder);
    const updatedMap: Record<string, string> = {};
    matchingPairs.forEach((pair, idx) => {
      updatedMap[pair.left] = newOrder[idx] || "";
    });
    onSelectAnswer(updatedMap);
  };

  // =========================================================================
  // REORDER: Shuffled sequence state
  // =========================================================================
  const correctOrder = useMemo(() => {
    return (question.correctOrder && question.correctOrder.length > 0)
      ? question.correctOrder
      : (question.options || []);
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

  const handleReorderItems = (newOrder: string[]) => {
    if (disabled || isConfirmed) return;
    setReorderState(newOrder);
    onSelectAnswer(newOrder);
  };

  // =========================================================================
  // FILL_BLANKS: Inline bracket parser
  // =========================================================================
  const { blankSegments, blankCount } = useMemo(() => {
    if (qType !== "FILL_BLANKS") return { blankSegments: [], blankCount: 0 };
    const raw = question.questionText || "";
    const parts = raw.split(/(\[.*?\]|___)/g);
    let count = 0;
    const segments = parts.map((part) => {
      const isBlank = (part.startsWith("[") && part.endsWith("]")) || part === "___";
      if (isBlank) {
        const expectedWord = part.startsWith("[") && part.endsWith("]") ? part.slice(1, -1) : "";
        const blankIdx = count;
        count++;
        return { isBlank: true, blankIdx, expectedWord };
      }
      return { isBlank: false, text: part, blankIdx: -1, expectedWord: "" };
    });
    return { blankSegments: segments, blankCount: count };
  }, [question.questionText, qType]);

  const getBlankVal = (idx: number): string => {
    if (!selectedAnswer) return "";
    if (typeof selectedAnswer === "string") return idx === 0 ? selectedAnswer : "";
    if (typeof selectedAnswer === "object") return selectedAnswer[idx] ?? selectedAnswer[`blank_${idx}`] ?? "";
    return "";
  };

  const setBlankVal = (idx: number, val: string) => {
    if (disabled || isConfirmed) return;
    if (blankCount <= 1) {
      onSelectAnswer(val);
    } else {
      const cur = typeof selectedAnswer === "object" && selectedAnswer !== null ? { ...selectedAnswer } : {};
      cur[idx] = val;
      onSelectAnswer(cur);
    }
  };

  return (
    <div className="relative rounded-3xl p-5 sm:p-7 bg-[#0B0716] text-slate-100 overflow-hidden border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] font-sans">
      {/* Background Cyber Carbon Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px]" />
      
      {/* Outer Neon Glow Orbs */}
      <div className="absolute -top-20 -left-20 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Futuristic HUD Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-purple-500/20 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-cyan-400 font-bold uppercase tracking-widest text-[11px] flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5" />
            CYBER_ARENA // Q.{questionIndex + 1}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-950/80 text-fuchsia-300 border border-fuchsia-500/40 shadow-[0_0_10px_rgba(217,70,239,0.25)]">
            {qType}
          </span>
          <span className="text-slate-400 text-[11px]">
            [{questionIndex + 1}/{totalQuestions}]
          </span>
        </div>
      </div>

      {/* Main Question Display with Rainbow Neon Gradient Border (Reference Image 3) */}
      <div className="relative z-10 mt-5 mb-6">
        <div className="relative p-[2.5px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-400 via-pink-500 via-purple-500 via-cyan-400 to-emerald-400 shadow-[0_0_25px_rgba(236,72,153,0.35)]">
          <div className="relative rounded-[calc(1rem-1px)] sm:rounded-[calc(1.5rem-1px)] bg-[#120B24]/95 p-5 sm:p-6 backdrop-blur-xl">
            {/* Top Question Mark Neon Diamond */}
            <div className="absolute -top-3.5 left-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-mono font-black text-[10px] uppercase tracking-widest shadow-md shadow-cyan-500/40 border border-white/40 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 fill-current" /> HUD QUERY
            </div>

            <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-wide leading-relaxed pt-1">
              {question.questionText}
            </h2>
          </div>
        </div>
      </div>

      {/* Dynamic Question Type Interactive Body */}
      <div className="relative z-10 space-y-4">
        {/* ========================================================================= */}
        {/* 1. MCQ: 4 Rainbow Neon Outline Buttons (Reference Image 3)                 */}
        {/* ========================================================================= */}
        {(!qType || qType === "MCQ") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {(question.options || []).map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = question.correctOptionIndex === idx;

              let borderGradient = "from-cyan-500 via-purple-500 to-pink-500";
              let cardBg = "bg-[#140D2B]/85";
              let shadowEffect = "hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]";

              if (isConfirmed) {
                if (isCorrectOption) {
                  borderGradient = "from-emerald-400 to-cyan-400";
                  cardBg = "bg-emerald-950/80 text-emerald-200";
                  shadowEffect = "shadow-[0_0_25px_rgba(52,211,153,0.5)]";
                } else if (isSelected && !isCorrectOption) {
                  borderGradient = "from-rose-500 to-red-600";
                  cardBg = "bg-rose-950/80 text-rose-200";
                  shadowEffect = "shadow-[0_0_25px_rgba(244,63,94,0.5)]";
                } else {
                  cardBg = "bg-slate-900/40 opacity-50";
                }
              } else if (isSelected) {
                borderGradient = "from-fuchsia-400 via-pink-400 to-amber-300";
                cardBg = "bg-purple-900/90 text-white";
                shadowEffect = "shadow-[0_0_25px_rgba(217,70,239,0.6)] -translate-y-0.5";
              }

              return (
                <div
                  key={idx}
                  onClick={() => !disabled && !isConfirmed && onSelectAnswer(idx)}
                  className={`relative p-[2px] rounded-2xl bg-gradient-to-r ${borderGradient} transition-all duration-200 ${
                    disabled || isConfirmed ? "cursor-default" : "cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  } ${shadowEffect}`}
                >
                  <div
                    className={`rounded-[calc(1rem-1px)] p-3.5 sm:p-4 flex items-center justify-between gap-3 ${cardBg} backdrop-blur-md min-h-[58px]`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-black/60 border border-purple-500/40 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-xs sm:text-sm font-bold tracking-wide truncate">
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
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. TRUE_FALSE: Two Massive Distinct Cyber Neon Cards                       */}
        {/* ========================================================================= */}
        {qType === "TRUE_FALSE" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                label: "TRUE // সত্য",
                value: true,
                symbol: "✓",
                subtext: "STATEMENT CONFIRMED VALID",
                gradient: "from-cyan-400 via-teal-400 to-emerald-400",
                activeBg: "bg-emerald-950/90 text-emerald-100 shadow-[0_0_30px_rgba(52,211,153,0.5)]",
                iconColor: "text-emerald-400",
              },
              {
                label: "FALSE // মিথ্যা",
                value: false,
                symbol: "✗",
                subtext: "STATEMENT INVALID / VOID",
                gradient: "from-pink-500 via-rose-500 to-amber-500",
                activeBg: "bg-rose-950/90 text-rose-100 shadow-[0_0_30px_rgba(244,63,94,0.5)]",
                iconColor: "text-rose-400",
              },
            ].map((item, idx) => {
              const isSelected = selectedAnswer === item.value || selectedAnswer === String(item.value);
              const expBool = question.correctBoolean !== undefined ? question.correctBoolean : question.correctOptionIndex === 0;
              const isChoiceCorrect = expBool === item.value;

              return (
                <div
                  key={idx}
                  onClick={() => !disabled && !isConfirmed && onSelectAnswer(item.value)}
                  className={`relative p-[2.5px] rounded-2xl bg-gradient-to-r ${item.gradient} transition-all duration-200 cursor-pointer ${
                    isSelected ? "scale-[1.02] -translate-y-1" : "hover:scale-[1.01]"
                  }`}
                >
                  <div
                    className={`rounded-[calc(1rem-1px)] p-5 flex items-center justify-between gap-3 backdrop-blur-xl ${
                      isSelected ? item.activeBg : "bg-[#140D2B]/90 hover:bg-[#1A1238]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/20 flex items-center justify-center font-mono font-black text-xl text-white">
                        {item.symbol}
                      </div>
                      <div>
                        <span className="font-mono font-black text-sm sm:text-base tracking-wider block text-white">
                          {item.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.subtext}
                        </span>
                      </div>
                    </div>

                    {isConfirmed && isChoiceCorrect && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono text-[10px] font-bold">
                        CORRECT
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MATCHING: Drag & Drop with Glowing Neon Borders                         */}
        {/* ========================================================================= */}
        {qType === "MATCHING" && (
          <div className="space-y-3">
            <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" /> DRAG & DROP RIGHT CARDS TO ALIGN // বাম-ডান মিলকরণ:
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Left Static Column */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  LEFT ANCHOR [STATIC]
                </span>
                {matchingPairs.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-purple-500/30 bg-[#120B24]/90 flex items-center justify-between gap-2 min-h-[50px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-purple-900/60 border border-purple-400/40 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold truncate text-slate-200">
                        {p.left}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  </div>
                ))}
              </div>

              {/* Right Drag & Drop Sortable Column */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  RIGHT MATCH [DRAG ↕]
                </span>
                <Reorder.Group
                  axis="y"
                  values={rightOrder}
                  onReorder={handleReorderMatching}
                  className="space-y-2.5"
                >
                  {rightOrder.map((it, idx) => {
                    const targetPair = matchingPairs[idx];
                    const isPairCorrect =
                      isConfirmed &&
                      targetPair &&
                      it.trim().toLowerCase() === targetPair.right.trim().toLowerCase();

                    return (
                      <Reorder.Item
                        key={it}
                        value={it}
                        dragListener={!disabled && !isConfirmed}
                        whileDrag={{ scale: 1.02, zIndex: 40 }}
                        className={`p-[2px] rounded-xl bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 cursor-grab active:cursor-grabbing select-none shadow-[0_0_15px_rgba(6,182,212,0.25)]`}
                      >
                        <div
                          className={`rounded-[calc(0.75rem-1px)] p-2.5 px-3 flex items-center justify-between gap-2 min-h-[46px] ${
                            isConfirmed
                              ? isPairCorrect
                                ? "bg-emerald-950/90 text-emerald-200"
                                : "bg-rose-950/90 text-rose-200"
                              : "bg-[#160E30]"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <GripVertical className="w-4 h-4 text-cyan-400 shrink-0" />
                            <span className="text-xs font-bold truncate text-slate-100">
                              {it}
                            </span>
                          </div>
                          {isConfirmed && (
                            <div className="shrink-0">
                              {isPairCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-400" />
                              )}
                            </div>
                          )}
                        </div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. REORDER: Draggable List with Glowing Neon Connectors                    */}
        {/* ========================================================================= */}
        {qType === "REORDER" && (
          <div className="space-y-3">
            <span className="text-[11px] font-mono text-pink-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" /> DRAG & DROP ITEMS INTO PROPER SEQUENCE // ক্রমানুসারে সাজান:
            </span>

            <Reorder.Group
              axis="y"
              values={reorderState}
              onReorder={handleReorderItems}
              className="space-y-2.5"
            >
              {reorderState.map((item, idx) => {
                const isItemCorrect =
                  isConfirmed &&
                  correctOrder[idx] &&
                  item.trim().toLowerCase() === correctOrder[idx].trim().toLowerCase();

                return (
                  <Reorder.Item
                    key={item}
                    value={item}
                    dragListener={!disabled && !isConfirmed}
                    whileDrag={{ scale: 1.02, zIndex: 40 }}
                    className="p-[2px] rounded-xl bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 cursor-grab active:cursor-grabbing select-none shadow-[0_0_15px_rgba(236,72,153,0.25)]"
                  >
                    <div
                      className={`rounded-[calc(0.75rem-1px)] p-3 flex items-center justify-between gap-3 ${
                        isConfirmed
                          ? isItemCorrect
                            ? "bg-emerald-950/90 text-emerald-200"
                            : "bg-rose-950/90 text-rose-200"
                          : "bg-[#140D2B]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-md bg-black/60 border border-cyan-400/40 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-bold truncate text-slate-100">
                          {item}
                        </span>
                      </div>
                      <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. FILL_BLANKS: Inline Glowing Neon Input Boxes                            */}
        {/* ========================================================================= */}
        {qType === "FILL_BLANKS" && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#140D2B] border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)] space-y-3 font-mono">
            <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider block">
              // FILL MISSING DATA ENTRY //
            </span>

            <div className="text-xs sm:text-sm leading-loose text-slate-200">
              {blankCount > 0 ? (
                blankSegments.map((seg, sIdx) => {
                  if (seg.isBlank) {
                    return (
                      <span key={sIdx} className="inline-block mx-1.5 align-middle">
                        <input
                          type="text"
                          disabled={disabled || isConfirmed}
                          value={getBlankVal(seg.blankIdx)}
                          onChange={(e) => setBlankVal(seg.blankIdx, e.target.value)}
                          placeholder="DATA_INPUT"
                          className="px-3 py-1 rounded-lg text-center font-mono font-bold text-xs sm:text-sm bg-black/80 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] focus:outline-none focus:border-pink-400 min-w-[130px] max-w-[200px]"
                        />
                      </span>
                    );
                  }
                  return <span key={sIdx}>{seg.text}</span>;
                })
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    disabled={disabled || isConfirmed}
                    value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
                    onChange={(e) => onSelectAnswer(e.target.value)}
                    placeholder="ENTER RESPONSE..."
                    className="flex-1 p-2.5 rounded-xl font-mono text-sm bg-black/80 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Explanation Banner */}
      {isConfirmed && question.explanation && (
        <div className="relative z-10 mt-5 p-3.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-xs font-mono text-purple-200 flex items-start gap-2 shadow-sm">
          <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-300 font-bold uppercase tracking-wider">HUD INTEL: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};
