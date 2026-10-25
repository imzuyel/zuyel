"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  Sparkles,
  Compass,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 12: AURORA BOREALIS COSMIC
 * - Deep obsidian night sky (#060814)
 * - Glowing polar northern lights emerald & violet auroral ribbons
 * - Starlight shimmer particles
 * - Flawless Light & Dark mode compatibility
 */
export const Template12: React.FC<QuizTemplateProps> = ({
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
      className="relative w-full rounded-[36px] p-6 sm:p-10 transition-colors duration-500 bg-[#060814] text-slate-100 border border-emerald-400/40 shadow-[0_20px_70px_rgba(16,185,129,0.2)] overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 10%, rgba(16,185,129,0.25) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(168,85,247,0.22) 0%, transparent 50%),
          radial-gradient(circle at 50% 80%, rgba(6,182,212,0.18) 0%, transparent 60%)
        `,
      }}
    >
      {/* Aurora Ambient Ribbon */}
      <div className="absolute -top-24 left-1/4 w-96 h-48 bg-gradient-to-r from-emerald-500/30 via-cyan-400/25 to-purple-500/30 blur-3xl pointer-events-none rounded-full" />

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between pb-4 mb-6 border-b border-emerald-500/20 text-xs">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AURORA BOREALIS // 12
        </span>
        <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-bold">
          CONSTELLATION {questionIndex + 1}/{totalQuestions}
        </span>
      </div>

      {/* TOP: Cosmic Question Capsule */}
      <div className="relative z-10 max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="relative p-7 sm:p-10 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-emerald-400/30 text-center shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase block mb-2">
            POLAR TRANSMISSION
          </span>
          <h2 className="text-lg sm:text-2xl font-black text-white leading-relaxed">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* BOTTOM: Glowing Aurora Options */}
      <div className="relative z-10 max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let cardBg = "bg-slate-900/70 hover:bg-slate-850/80 border-slate-700/60 text-slate-200";
              if (isSelected) {
                cardBg = "bg-emerald-950/80 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  cardBg = "bg-emerald-900/90 border-emerald-300 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]";
                } else if (isSelected && !isCorrectOption) {
                  cardBg = "bg-rose-950/90 border-rose-400 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.4)]";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] p-4 rounded-2xl border backdrop-blur-md transition-all flex items-center justify-between text-left ${
                    !isConfirmed && !disabled ? "cursor-pointer hover:-translate-y-0.5" : "cursor-default"
                  } ${cardBg}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-slate-800 border border-emerald-400/40 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
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
              { label: "সত্য (True)", value: true, bValue: "true" },
              { label: "মিথ্যা (False)", value: false, bValue: "false" },
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
                  className={`w-full p-6 rounded-2xl border transition-all flex items-center justify-between ${
                    isSelected ? "bg-emerald-950 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-slate-900/70 border-slate-700/60"
                  }`}
                >
                  <span className="text-base font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-5 bg-slate-900/80 rounded-2xl border border-emerald-400/40 space-y-3">
            <span className="text-xs font-bold text-emerald-300 block">
              ⇄ ড্র্যাগ করে তারার সংযোগ মিলান:
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
                  className="p-3.5 bg-slate-950 border border-emerald-400/30 rounded-xl text-xs font-semibold text-emerald-100 flex items-center justify-between cursor-grab"
                >
                  <span>{matchingPairs[idx]?.left} ──★ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-emerald-400" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-slate-900/80 rounded-2xl border border-emerald-400/40 space-y-3">
            <span className="text-xs font-bold text-emerald-300 block">
              ⬇ তারকামণ্ডলীর ক্রম অনুযায়ী সাজান:
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
                  className="p-3.5 bg-slate-950 border border-emerald-400/30 rounded-xl text-xs font-semibold text-emerald-100 flex items-center justify-between cursor-grab"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-emerald-400" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "FILL_BLANKS" && (
          <div className="p-6 bg-slate-900/80 rounded-2xl border border-emerald-400/40 space-y-3">
            <span className="text-xs font-bold text-emerald-300 block">
              খালি স্থানে উত্তর লিখুন:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="এখানে লিখুন..."
              className="w-full p-4 rounded-xl bg-slate-950 border border-emerald-400/60 text-emerald-200 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="relative z-10 mt-8 p-4 rounded-2xl bg-slate-900/80 border border-emerald-400/30 text-xs text-slate-300 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-emerald-300 font-bold">মহাজাগতিক ব্যাখ্যা: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template12;
