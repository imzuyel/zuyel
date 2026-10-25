"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  Droplets,
} from "lucide-react";
import { Reorder } from "framer-motion";

/**
 * TEMPLATE 18: BIOMORPHIC ORGANIC FLUID
 * - Organic flowing amoeba liquid shapes
 * - Soft soothing pastel teal, violet & mint gradients
 * - Flowing non-linear borders and gentle curves
 * - Flawless Light & Dark mode compatibility
 */
export const Template18: React.FC<QuizTemplateProps> = ({
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
    <div className="relative w-full rounded-[44px] p-6 sm:p-10 transition-colors duration-500 bg-[#edf7f6] dark:bg-[#0f1f20] text-teal-950 dark:text-teal-100 border-2 border-teal-300/40 shadow-[0_20px_60px_rgba(45,212,191,0.18)] font-sans overflow-hidden">
      {/* Background Soft Fluid Droplets */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-teal-300/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-purple-300/20 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between pb-4 mb-6 border-b border-teal-200 dark:border-teal-800 text-xs font-semibold">
        <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 text-[10px] font-black uppercase tracking-wider">
          <Droplets className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> BIOMORPHIC FLUID 18
        </span>
        <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 text-teal-700 dark:text-teal-300 text-[10px] font-bold">
          DROPLET {questionIndex + 1}/{totalQuestions}
        </span>
      </div>

      {/* TOP: Organic Fluid Question Capsule */}
      <div className="relative z-10 max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="p-8 sm:p-10 rounded-[38px] bg-white dark:bg-[#162a2b] shadow-[0_12px_32px_rgba(45,212,191,0.12)] border border-teal-100 dark:border-teal-800 text-center">
          <span className="text-[10px] font-bold tracking-widest text-teal-600 dark:text-teal-400 uppercase block mb-2">
            ORGANIC CELL QUESTION
          </span>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
            {question.questionText}
          </h2>
        </div>
      </div>

      {/* BOTTOM: Organic Fluid Options */}
      <div className="relative z-10 max-w-2xl mx-auto space-y-4">
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let fluidBg = "bg-white/90 dark:bg-[#162a2b] text-slate-800 dark:text-teal-100 hover:bg-teal-50 dark:hover:bg-teal-900/40 border-teal-200 dark:border-teal-800";
              if (isSelected) {
                fluidBg = "bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold shadow-md border-transparent";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  fluidBg = "bg-emerald-600 text-white font-bold";
                } else if (isSelected && !isCorrectOption) {
                  fluidBg = "bg-rose-500 text-white font-bold";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isConfirmed}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full min-h-[58px] p-4 rounded-[26px] border transition-all flex items-center justify-between text-left shadow-xs ${
                    !isConfirmed && !disabled ? "cursor-pointer hover:-translate-y-0.5 active:scale-98" : "cursor-default"
                  } ${fluidBg}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 text-xs font-bold flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold leading-snug">
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
                  className={`w-full p-6 rounded-[28px] border transition-all flex items-center justify-between ${
                    isSelected ? "bg-teal-600 text-white font-bold" : "bg-white/90 dark:bg-[#162a2b] border-teal-200 dark:border-teal-800"
                  }`}
                >
                  <span className="text-base font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {qType === "MATCHING" && (
          <div className="p-5 bg-white dark:bg-[#162a2b] rounded-[32px] border border-teal-200 dark:border-teal-800 space-y-3">
            <span className="text-xs font-bold text-teal-700 dark:text-teal-300 block">
              ⇄ ড্র্যাগ করে জৈব বন্ধন মিলান:
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
                  className="p-3 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-700 rounded-2xl text-xs font-semibold text-teal-900 dark:text-teal-100 flex items-center justify-between cursor-grab"
                >
                  <span>{matchingPairs[idx]?.left} ➔ {itemVal}</span>
                  <GripVertical className="w-4 h-4 text-teal-500" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "REORDER" && (
          <div className="p-5 bg-white dark:bg-[#162a2b] rounded-[32px] border border-teal-200 dark:border-teal-800 space-y-3">
            <span className="text-xs font-bold text-teal-700 dark:text-teal-300 block">
              ⬇ জৈব ক্রম সাজান:
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
                  className="p-3 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-700 rounded-2xl text-xs font-semibold text-teal-900 dark:text-teal-100 flex items-center justify-between cursor-grab"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-teal-500" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {qType === "FILL_BLANKS" && (
          <div className="p-5 bg-white dark:bg-[#162a2b] rounded-[32px] border border-teal-200 dark:border-teal-800 space-y-3">
            <span className="text-xs font-bold text-teal-700 dark:text-teal-300 block">
              খালি স্থান পূরণ:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="এখানে লিখুন..."
              className="w-full p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-700 text-sm font-semibold focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {isConfirmed && question.explanation && (
        <div className="relative z-10 mt-8 p-4 rounded-2xl bg-white/90 dark:bg-[#162a2b] border border-teal-200 dark:border-teal-700 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">ব্যাখ্যা: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template18;
