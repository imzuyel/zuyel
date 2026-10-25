"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  ArrowRight,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Reorder, motion } from "framer-motion";

export const TemplateClaymorphism: React.FC<QuizTemplateProps> = ({
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
    <div className="relative rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-br from-[#6855F4] via-[#5A45ED] to-[#4834D4] text-slate-800 shadow-[0_20px_50px_rgba(72,52,212,0.35)] overflow-hidden font-sans select-none">
      {/* Decorative 3D Floating Sparkles (Reference Image 1) */}
      <div className="absolute top-6 left-8 pointer-events-none">
        <span className="text-amber-300 text-2xl drop-shadow-[0_4px_8px_rgba(251,191,36,0.6)] animate-bounce">
          ✦
        </span>
      </div>
      <div className="absolute top-12 right-12 pointer-events-none">
        <span className="text-amber-300 text-3xl drop-shadow-[0_4px_10px_rgba(251,191,36,0.6)]">
          ✦
        </span>
        <span className="text-amber-200 text-lg ml-1 drop-shadow-[0_2px_6px_rgba(251,191,36,0.5)]">
          ✦
        </span>
      </div>

      {/* Floating 3D Cloud "QUIZ" Speech Bubble (Reference Image 1) */}
      <div className="relative z-10 flex flex-col items-center justify-center mb-5">
        <div className="relative px-6 py-2 rounded-2xl bg-white text-slate-900 font-black text-sm sm:text-base tracking-wider shadow-[0_8px_0_0_#D5D8E4,0_12px_24px_rgba(0,0,0,0.15)] border-2 border-white/80 flex items-center gap-2">
          <span className="text-amber-400 text-lg">✨</span>
          <span>QUIZ #{questionIndex + 1}</span>
          <span className="text-amber-400 text-lg">✨</span>
          
          {/* Small Speech Bubble Tail */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-[#D5D8E4]" />
        </div>
      </div>

      {/* Large White 3D Bubble for the Question (Reference Image 1) */}
      <div className="relative z-10 mb-6">
        <div className="rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-9 bg-white text-slate-800 shadow-[0_18px_35px_rgba(0,0,0,0.18),inset_0_-8px_16px_rgba(0,0,0,0.06),inset_0_4px_8px_rgba(255,255,255,0.95)] border-4 border-white text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[11px] mb-2">
            প্রশ্ন {questionIndex + 1} / {totalQuestions} • {qType}
          </span>
          <h2 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 leading-snug">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* Dynamic Question Type Interactive Body */}
      <div className="relative z-10 space-y-4">
        {/* ========================================================================= */}
        {/* 1. MCQ: 2x2 Soft-Shadowed 3D Pill Buttons (Reference Image 1)              */}
        {/* ========================================================================= */}
        {(!qType || qType === "MCQ") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {(question.options || []).map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = question.correctOptionIndex === idx;

              let btnStyle =
                "bg-white text-slate-800 shadow-[0_7px_0_0_#D3D7E3,0_10px_20px_rgba(0,0,0,0.08)] active:translate-y-1 active:shadow-[0_2px_0_0_#D3D7E3] hover:bg-slate-50 border-2 border-white/90";

              if (isConfirmed) {
                if (isCorrectOption) {
                  btnStyle =
                    "bg-emerald-500 text-white shadow-[0_7px_0_0_#047857,0_10px_20px_rgba(4,120,87,0.3)] border-2 border-emerald-400";
                } else if (isSelected && !isCorrectOption) {
                  btnStyle =
                    "bg-rose-500 text-white shadow-[0_7px_0_0_#be123c,0_10px_20px_rgba(190,18,60,0.3)] border-2 border-rose-400";
                } else {
                  btnStyle = "bg-white/60 text-slate-400 shadow-[0_4px_0_0_#CBD5E1] opacity-70";
                }
              } else if (isSelected) {
                btnStyle =
                  "bg-amber-300 text-slate-950 shadow-[0_7px_0_0_#d97706,0_10px_20px_rgba(217,119,6,0.3)] -translate-y-0.5 border-2 border-amber-200";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full rounded-full py-3.5 px-5 text-left flex items-center justify-between gap-3 transition-all cursor-pointer font-bold ${btnStyle}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition ${
                        isSelected || (isConfirmed && isCorrectOption)
                          ? "bg-black/20 text-white"
                          : "bg-slate-100 text-slate-700 shadow-inner"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
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
                </button>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. TRUE_FALSE: Two Massive 3D Claymorphic Buttons                          */}
        {/* ========================================================================= */}
        {qType === "TRUE_FALSE" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                label: "সত্য (True)",
                value: true,
                icon: ThumbsUp,
                subtext: "উক্তিটি ১০০% সঠিক",
                btnBg: "bg-emerald-500 text-white shadow-[0_8px_0_0_#047857,0_12px_24px_rgba(4,120,87,0.3)]",
              },
              {
                label: "মিথ্যা (False)",
                value: false,
                icon: ThumbsDown,
                subtext: "উক্তিটি ভুল / অসত্য",
                btnBg: "bg-rose-500 text-white shadow-[0_8px_0_0_#be123c,0_12px_24px_rgba(190,18,60,0.3)]",
              },
            ].map((item, idx) => {
              const isSelected = selectedAnswer === item.value || selectedAnswer === String(item.value);
              const expBool = question.correctBoolean !== undefined ? question.correctBoolean : question.correctOptionIndex === 0;
              const isChoiceCorrect = expBool === item.value;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(item.value)}
                  className={`w-full rounded-[2rem] p-5 sm:p-6 text-left flex items-center justify-between gap-4 transition-all cursor-pointer ${
                    isSelected
                      ? `${item.btnBg} scale-[1.02] -translate-y-1`
                      : "bg-white text-slate-800 shadow-[0_8px_0_0_#D5D8E4,0_12px_20px_rgba(0,0,0,0.1)] hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                        isSelected ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700 shadow-inner"
                      }`}
                    >
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-base sm:text-lg font-black block">
                        {item.label}
                      </span>
                      <span className={`text-[11px] font-bold ${isSelected ? "text-white/80" : "text-slate-500"}`}>
                        {item.subtext}
                      </span>
                    </div>
                  </div>

                  {isConfirmed && isChoiceCorrect && (
                    <span className="px-3 py-1 rounded-full bg-white text-emerald-700 font-black text-xs shadow-md">
                      সঠিক
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MATCHING: 3D Claymorphic Draggable Pills                                */}
        {/* ========================================================================= */}
        {qType === "MATCHING" && (
          <div className="rounded-[2.2rem] p-5 sm:p-6 bg-white shadow-[0_12px_24px_rgba(0,0,0,0.12)] space-y-3.5">
            <span className="text-xs font-black text-purple-700 block uppercase tracking-wider">
              🔗 ডান পাশের পিল কার্ড টেনে বাম পাশের সাথে মিলান:
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Left Column */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-slate-500 block">বাম পাশ (নির্দিষ্ট)</span>
                {matchingPairs.map((p, idx) => (
                  <div
                    key={idx}
                    className="rounded-full p-3 px-4 bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 min-h-[46px]"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{p.left}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>

              {/* Right Draggable Column */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-slate-500 block">ডান পাশ (ড্র্যাগ করুন ↕)</span>
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
                        className={`rounded-full p-3 px-4 flex items-center justify-between text-xs sm:text-sm font-black cursor-grab active:cursor-grabbing select-none transition min-h-[46px] ${
                          isConfirmed
                            ? isPairCorrect
                              ? "bg-emerald-500 text-white shadow-[0_5px_0_0_#047857]"
                              : "bg-rose-500 text-white shadow-[0_5px_0_0_#be123c]"
                            : "bg-white text-slate-800 shadow-[0_5px_0_0_#D5D8E4,0_8px_16px_rgba(0,0,0,0.06)] border border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
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
        {/* 4. REORDER: 3D Playful Pill Reorderable List                               */}
        {/* ========================================================================= */}
        {qType === "REORDER" && (
          <div className="rounded-[2.2rem] p-5 sm:p-6 bg-white shadow-[0_12px_24px_rgba(0,0,0,0.12)] space-y-3.5">
            <span className="text-xs font-black text-purple-700 block uppercase tracking-wider">
              🔢 আইটেমগুলো টেনে পর্যায়ক্রমিক সঠিক ক্রমে সাজান:
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
                    className={`rounded-full p-3.5 px-5 flex items-center justify-between text-xs sm:text-sm font-extrabold cursor-grab active:cursor-grabbing select-none transition ${
                      isConfirmed
                        ? isItemCorrect
                          ? "bg-emerald-500 text-white shadow-[0_6px_0_0_#047857]"
                          : "bg-rose-500 text-white shadow-[0_6px_0_0_#be123c]"
                        : "bg-white text-slate-800 shadow-[0_6px_0_0_#D5D8E4,0_8px_16px_rgba(0,0,0,0.08)] border border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{item}</span>
                    </div>
                    <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. FILL_BLANKS: Inset Claymorphic Input Capsules                          */}
        {/* ========================================================================= */}
        {qType === "FILL_BLANKS" && (
          <div className="rounded-[2.2rem] p-5 sm:p-7 bg-white shadow-[0_12px_24px_rgba(0,0,0,0.12)] space-y-4 text-center">
            <span className="text-xs font-black text-purple-700 uppercase tracking-wide block">
              ✍️ বাক্যের খালি স্থানে সঠিক উত্তর টাইপ করুন:
            </span>

            <div className="text-sm sm:text-base leading-loose font-bold text-slate-800">
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
                          className="px-4 py-2 rounded-full font-black text-sm bg-slate-100 shadow-[inset_0_3px_6px_rgba(0,0,0,0.12)] border border-slate-300 text-slate-900 text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[130px] max-w-[200px]"
                        />
                      </span>
                    );
                  }
                  return <span key={sIdx}>{seg.text}</span>;
                })
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <input
                    type="text"
                    disabled={disabled || isConfirmed}
                    value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
                    onChange={(e) => onSelectAnswer(e.target.value)}
                    placeholder="সঠিক উত্তর এখানে লিখুন..."
                    className="w-full max-w-md p-3 px-6 rounded-full font-black text-sm bg-slate-100 shadow-[inset_0_3px_6px_rgba(0,0,0,0.12)] border border-slate-300 text-slate-900 text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Explanation Banner */}
      {isConfirmed && question.explanation && (
        <div className="relative z-10 mt-5 p-4 rounded-2xl bg-white/95 text-xs text-slate-800 shadow-md flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-purple-800 font-extrabold">উত্তরের ব্যাখ্যা: </strong>
            <span className="font-medium">{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};
