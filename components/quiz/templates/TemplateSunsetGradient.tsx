"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  ArrowRight,
  Flame,
  Check,
  X,
  Compass,
} from "lucide-react";
import { Reorder, motion } from "framer-motion";

export const TemplateSunsetGradient: React.FC<QuizTemplateProps> = ({
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
    <div className="relative rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-tr from-[#FF4E50] via-[#F9705E] to-[#F9D423] text-white shadow-[0_20px_50px_rgba(249,112,94,0.35)] overflow-hidden font-sans select-none">
      {/* Dynamic Angled Background Geometry (Reference Image 2 Bottom-Left) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-yellow-300 blur-3xl" />
        {/* Diagonal speed lines */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] [background-size:40px_40px] opacity-15" />
      </div>

      {/* Header Strip with Angled Badges */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-white/20 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-black italic tracking-wide text-xs flex items-center gap-1.5 shadow-sm">
            <Flame className="w-3.5 h-3.5 text-yellow-300 fill-current" />
            SUNSET ARENA
          </span>
          <span className="font-extrabold text-white/90">
            প্রশ্ন {questionIndex + 1} / {totalQuestions}
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-lg bg-black/20 backdrop-blur-md text-yellow-200 text-[10px] font-black uppercase tracking-widest border border-white/20">
          {qType}
        </span>
      </div>

      {/* Main Question Display in Translucent Glassmorphism Card (Reference Image 2) */}
      <div className="relative z-10 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Slanted Question Mark Card */}
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-white text-orange-600 font-black italic text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-black/10 shrink-0 transform -rotate-3 border-2 border-white/80">
          ?
        </div>

        {/* Question Text Box */}
        <div className="flex-1 rounded-2xl sm:rounded-3xl p-5 sm:p-7 bg-white/25 backdrop-blur-xl border border-white/40 shadow-xl">
          <h2 className="text-base sm:text-lg md:text-xl font-black text-white leading-relaxed drop-shadow-sm">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* Dynamic Question Type Interactive Body */}
      <div className="relative z-10 space-y-4">
        {/* ========================================================================= */}
        {/* 1. MCQ: 4 Angled White/Glassmorphic Option Buttons (Reference Image 2)      */}
        {/* ========================================================================= */}
        {(!qType || qType === "MCQ") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {(question.options || []).map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = question.correctOptionIndex === idx;

              let cardStyle =
                "bg-white/85 text-slate-900 border-2 border-white/90 shadow-md hover:bg-white hover:-translate-y-0.5";

              if (isConfirmed) {
                if (isCorrectOption) {
                  cardStyle =
                    "bg-emerald-500 text-white border-2 border-emerald-300 shadow-lg shadow-emerald-600/40";
                } else if (isSelected && !isCorrectOption) {
                  cardStyle =
                    "bg-rose-600 text-white border-2 border-rose-300 shadow-lg shadow-rose-700/40";
                } else {
                  cardStyle = "bg-white/40 text-slate-700 opacity-60";
                }
              } else if (isSelected) {
                cardStyle =
                  "bg-gradient-to-r from-amber-300 to-yellow-300 text-slate-950 border-2 border-white shadow-lg -translate-y-1";
              }

              return (
                <div
                  key={idx}
                  onClick={() => !disabled && !isConfirmed && onSelectAnswer(idx)}
                  className={`rounded-2xl p-4 flex items-center justify-between gap-3 transition-all cursor-pointer select-none font-bold ${cardStyle}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 italic font-black text-xs flex items-center justify-center shrink-0 border border-orange-200">
                      {String.fromCharCode(97 + idx)}.
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold truncate">
                      {opt}
                    </span>
                  </div>

                  {isConfirmed && (
                    <div className="shrink-0">
                      {isCorrectOption ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5 text-white" />
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. TRUE_FALSE: Two Massive Sunset Glassmorphic Cards                       */}
        {/* ========================================================================= */}
        {qType === "TRUE_FALSE" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                label: "সত্য (TRUE)",
                value: true,
                subtext: "উক্তিটি সম্পূর্ণ সঠিক",
                badge: "a.",
                btnBg: "bg-emerald-500 text-white border-2 border-emerald-300 shadow-xl",
              },
              {
                label: "মিথ্যা (FALSE)",
                value: false,
                subtext: "উক্তিটি অসত্য বা ভুল",
                badge: "b.",
                btnBg: "bg-rose-600 text-white border-2 border-rose-300 shadow-xl",
              },
            ].map((item, idx) => {
              const isSelected = selectedAnswer === item.value || selectedAnswer === String(item.value);
              const expBool = question.correctBoolean !== undefined ? question.correctBoolean : question.correctOptionIndex === 0;
              const isChoiceCorrect = expBool === item.value;

              return (
                <div
                  key={idx}
                  onClick={() => !disabled && !isConfirmed && onSelectAnswer(item.value)}
                  className={`rounded-2xl sm:rounded-3xl p-5 flex items-center justify-between gap-4 transition-all cursor-pointer select-none ${
                    isSelected
                      ? `${item.btnBg} scale-[1.02] -translate-y-1`
                      : "bg-white/85 text-slate-900 border-2 border-white hover:bg-white hover:-translate-y-0.5 shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-700 italic font-black text-lg flex items-center justify-center shrink-0 border border-orange-200">
                      {item.badge}
                    </span>
                    <div>
                      <span className="text-base sm:text-lg font-black block">
                        {item.label}
                      </span>
                      <span className="text-[11px] font-medium opacity-80">
                        {item.subtext}
                      </span>
                    </div>
                  </div>

                  {isConfirmed && isChoiceCorrect && (
                    <span className="px-3 py-1 rounded-full bg-white text-emerald-700 font-black text-xs shadow-md">
                      সঠিক
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MATCHING: Drag & Drop Sunset Glassmorphic Cards                         */}
        {/* ========================================================================= */}
        {qType === "MATCHING" && (
          <div className="rounded-3xl p-5 sm:p-6 bg-white/25 backdrop-blur-xl border border-white/40 shadow-xl space-y-3.5">
            <span className="text-xs font-black text-white block uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-yellow-300" />
              ডান পাশের কার্ড ড্র্যাগ করে বাম পাশের সাথে সাজান:
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Left Column */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-white/80 block">বাম পাশ (নির্দিষ্ট)</span>
                {matchingPairs.map((p, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl p-3 px-4 bg-white/85 text-slate-900 border border-white shadow-sm flex items-center justify-between text-xs sm:text-sm font-bold min-h-[46px]"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-6 h-6 rounded-lg bg-orange-500 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{p.left}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-orange-400 shrink-0" />
                  </div>
                ))}
              </div>

              {/* Right Draggable Column */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-white/80 block">ডান পাশ (ড্র্যাগ ↕)</span>
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
                        whileDrag={{ scale: 1.03, zIndex: 40 }}
                        className={`rounded-2xl p-3 px-4 flex items-center justify-between text-xs sm:text-sm font-black cursor-grab active:cursor-grabbing select-none transition border min-h-[46px] ${
                          isConfirmed
                            ? isPairCorrect
                              ? "bg-emerald-500 text-white border-emerald-300 shadow-md"
                              : "bg-rose-600 text-white border-rose-300 shadow-md"
                            : "bg-white text-slate-900 border-white shadow-md hover:bg-yellow-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <GripVertical className="w-4 h-4 text-orange-400 shrink-0" />
                          <span className="truncate">{it}</span>
                        </div>
                        {isConfirmed && (
                          <div className="shrink-0">
                            {isPairCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            ) : (
                              <XCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                        )}
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. REORDER: Drag & Drop Sunset Glassmorphic List                           */}
        {/* ========================================================================= */}
        {qType === "REORDER" && (
          <div className="rounded-3xl p-5 sm:p-6 bg-white/25 backdrop-blur-xl border border-white/40 shadow-xl space-y-3.5">
            <span className="text-xs font-black text-white block uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-yellow-300" />
              আইটেমগুলো ড্র্যাগ করে পর্যায়ক্রমিক সঠিক ক্রমে সাজান:
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
                    whileDrag={{ scale: 1.03, zIndex: 40 }}
                    className={`rounded-2xl p-3.5 px-5 flex items-center justify-between text-xs sm:text-sm font-extrabold cursor-grab active:cursor-grabbing select-none transition border ${
                      isConfirmed
                        ? isItemCorrect
                          ? "bg-emerald-500 text-white border-emerald-300 shadow-md"
                          : "bg-rose-600 text-white border-rose-300 shadow-md"
                        : "bg-white text-slate-900 border-white shadow-md hover:bg-yellow-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-orange-500 text-white text-xs font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{item}</span>
                    </div>
                    <GripVertical className="w-4 h-4 text-orange-400 shrink-0" />
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. FILL_BLANKS: Inline Glassmorphic Input Fields                           */}
        {/* ========================================================================= */}
        {qType === "FILL_BLANKS" && (
          <div className="rounded-3xl p-5 sm:p-7 bg-white/25 backdrop-blur-xl border border-white/40 shadow-xl space-y-4">
            <span className="text-xs font-black text-yellow-200 uppercase tracking-wide block">
              ✍️ বাক্যের শূন্যস্থানে সঠিক উত্তর টাইপ করুন:
            </span>

            <div className="text-sm sm:text-base leading-loose font-extrabold text-white drop-shadow-sm">
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
                          placeholder="উত্তর লিখুন..."
                          className="px-4 py-1.5 rounded-xl font-black text-sm bg-white text-slate-900 border-2 border-yellow-300 shadow-lg text-center focus:outline-none focus:ring-4 focus:ring-yellow-400/50 min-w-[130px] max-w-[200px]"
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
                    placeholder="সঠিক উত্তর এখানে লিখুন..."
                    className="flex-1 p-3 px-6 rounded-2xl font-black text-sm bg-white text-slate-900 border-2 border-yellow-300 shadow-lg focus:outline-none focus:ring-4 focus:ring-yellow-400/50"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Explanation Banner */}
      {isConfirmed && question.explanation && (
        <div className="relative z-10 mt-5 p-4 rounded-2xl bg-white/90 text-xs text-slate-900 shadow-lg flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-orange-700 font-extrabold">উত্তরের ব্যাখ্যা: </strong>
            <span className="font-semibold">{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};
