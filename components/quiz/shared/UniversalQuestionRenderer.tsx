"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Check,
  X,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  Shuffle,
  HelpCircle,
  Award,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import MatchingQuestionPlayer from "../MatchingQuestionPlayer";

export type UniversalQuestionType =
  | "MCQ"
  | "TRUE_FALSE"
  | "FILL_BLANKS"
  | "MATCHING"
  | "REORDER";

export interface UniversalQuestionProps {
  question: any;
  questionIndex?: number;
  totalQuestions?: number;
  selectedAnswer: any;
  onSelectAnswer: (ans: any) => void;
  onConfirmAnswer?: (ans: any) => void;
  isConfirmed?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
  timeRemaining?: number;
}

// Sortable item component for REORDER question type with Hybrid Controls (Drag, Chevrons, Click-to-Swap)
function SortableOrderItem({
  id,
  text,
  index,
  total,
  onMoveUp,
  onMoveDown,
  isSelectedForSwap,
  onCardClick,
  disabled,
}: {
  id: string;
  text: string;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isSelectedForSwap?: boolean;
  onCardClick?: () => void;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => {
        if (!disabled && onCardClick) onCardClick();
      }}
      className={`flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-2xl border transition-all duration-200 select-none cursor-pointer ${
        isDragging
          ? "bg-indigo-100 dark:bg-indigo-950/80 border-indigo-500 shadow-xl scale-[1.02] z-30"
          : isSelectedForSwap
          ? "bg-amber-50 dark:bg-amber-950/60 border-amber-500 ring-4 ring-amber-400/40 shadow-lg scale-[1.01]"
          : "bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs"
      }`}
    >
      {/* Drag Grip Handle */}
      <div
        {...attributes}
        {...listeners}
        className={`touch-none cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 ${
          disabled ? "pointer-events-none opacity-40" : ""
        }`}
        title="ধরে উপরে বা নিচে ড্র্যাগ করুন"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Numerical Sequence Badge */}
      <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-xs">
        {index + 1}
      </span>

      {/* Step Content */}
      <span className="flex-1 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug break-words">
        {text}
      </span>

      {/* Swap Status Indicator if selected */}
      {isSelectedForSwap && (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white shrink-0 animate-pulse">
          সোয়াপ নির্বাচন
        </span>
      )}

      {/* Mobile/Accessible Fallback Stepper Buttons: ChevronUp & ChevronDown */}
      {!disabled && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={index === 0}
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-500 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition cursor-pointer"
            title="উপরে নিন (Move Up)"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-500 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition cursor-pointer"
            title="নিচে নিন (Move Down)"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function UniversalQuestionRenderer({
  question,
  questionIndex = 0,
  totalQuestions = 1,
  selectedAnswer,
  onSelectAnswer,
  onConfirmAnswer,
  isConfirmed = false,
  isCorrect,
  disabled = false,
  timeRemaining,
}: UniversalQuestionProps) {
  // 1. Resolve Universal Question Type across System A (LMS chapter items) and System B (Live Quiz)
  const resolvedType: UniversalQuestionType = useMemo(() => {
    if (!question) return "MCQ";
    const snap = question.questionSnapshot || question.questionData || {};
    const rawType = String(
      question.questionType ||
      question.type ||
      snap.questionType ||
      snap.type ||
      "MCQ"
    ).toUpperCase();

    if (rawType.includes("MATCH")) return "MATCHING";
    if (rawType.includes("BLANK") || rawType === "FILL_BLANKS" || rawType === "FILL_BLANK" || rawType === "SHORT_ANSWER") {
      return "FILL_BLANKS";
    }
    if (rawType.includes("TRUE") || rawType.includes("TF") || rawType === "TRUE_FALSE") {
      return "TRUE_FALSE";
    }
    if (rawType.includes("ORDER") || rawType.includes("REARRANGE") || rawType === "REORDER" || rawType === "ORDERING" || rawType === "ARRANGE") {
      return "REORDER";
    }
    return "MCQ";
  }, [question]);

  // 2. Extract Question Text
  const questionPrompt = useMemo(() => {
    if (!question) return "প্রশ্ন প্রস্তুত হচ্ছে...";
    const snap = question.questionSnapshot || question.questionData || {};
    return (
      question.questionText ||
      snap.questionText ||
      snap.prompt ||
      "সঠিক উত্তর নির্ধারণ করুন:"
    );
  }, [question]);

  // 3. Extract Options for MCQ
  const optionsList: string[] = useMemo(() => {
    if (!question) return ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"];
    const snap = question.questionSnapshot || question.questionData || {};
    if (Array.isArray(question.options) && question.options.length > 0) return question.options;
    if (Array.isArray(snap.options) && snap.options.length > 0) return snap.options;
    if (question.optionA || question.optionB) {
      return [
        question.optionA || "",
        question.optionB || "",
        question.optionC || "",
        question.optionD || "",
      ].filter(Boolean);
    }
    return ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"];
  }, [question]);

  // 4. Extract Matching Pairs
  const matchingPairs = useMemo(() => {
    if (!question) return [];
    const snap = question.questionSnapshot || question.questionData || {};
    let pairs = question.matchingPairs || question.pairs || snap.pairs || snap.matchingPairs || [];
    if ((!Array.isArray(pairs) || pairs.length === 0) && typeof (question.correctAnswer || snap.correctAnswer || question.optionsJson) === "string") {
      const candidate = String(question.correctAnswer || snap.correctAnswer || question.optionsJson).trim();
      if (candidate.startsWith("[")) {
        try {
          const parsed = JSON.parse(candidate);
          if (Array.isArray(parsed) && parsed.length > 0) pairs = parsed;
        } catch {}
      }
    }
    if (!Array.isArray(pairs) || pairs.length === 0) {
      if (resolvedType === "MATCHING") {
        pairs = [
          { left: "আইটেম ১", right: "ম্যাচ ১" },
          { left: "আইটেম ২", right: "ম্যাচ ২" },
        ];
      }
    }
    return pairs;
  }, [question, resolvedType]);

  // 5. Setup Sortable Reorder state
  const rawOrderItems = useMemo(() => {
    if (!question) return [];
    const snap = question.questionSnapshot || question.questionData || {};
    if (Array.isArray(question.correctOrder) && question.correctOrder.length > 0) return question.correctOrder;
    if (Array.isArray(snap.items) && snap.items.length > 0) return snap.items;
    if (Array.isArray(snap.steps) && snap.steps.length > 0) return snap.steps;
    if (Array.isArray(question.options) && question.options.length > 0) return question.options;
    return ["ধাপ ১", "ধাপ ২", "ধাপ ৩"];
  }, [question]);

  // Internal ordered list for REORDER
  const [currentOrder, setCurrentOrder] = useState<string[]>([]);
  useEffect(() => {
    if (resolvedType === "REORDER") {
      if (Array.isArray(selectedAnswer) && selectedAnswer.length === rawOrderItems.length) {
        setCurrentOrder(selectedAnswer);
      } else {
        // Shuffled copy to begin
        const shuffled = [...rawOrderItems];
        if (shuffled.length > 1) {
          const first = shuffled.shift()!;
          shuffled.push(first);
        }
        setCurrentOrder(shuffled);
        if (!selectedAnswer) {
          onSelectAnswer(shuffled);
        }
      }
    }
  }, [question?.id, resolvedType, rawOrderItems]);

  const [selectedSwapIdx, setSelectedSwapIdx] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEndOrder = (event: DragEndEvent) => {
    if (disabled || isConfirmed) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentOrder.indexOf(String(active.id));
      const newIndex = currentOrder.indexOf(String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        const nextOrder = arrayMove(currentOrder, oldIndex, newIndex);
        setCurrentOrder(nextOrder);
        onSelectAnswer(nextOrder);
        setSelectedSwapIdx(null);
      }
    }
  };

  const handleMoveOrderItem = (fromIdx: number, toIdx: number) => {
    if (disabled || isConfirmed) return;
    if (toIdx < 0 || toIdx >= currentOrder.length) return;
    const nextOrder = arrayMove(currentOrder, fromIdx, toIdx);
    setCurrentOrder(nextOrder);
    onSelectAnswer(nextOrder);
    setSelectedSwapIdx(null);
  };

  const handleCardSwapTap = (idx: number) => {
    if (disabled || isConfirmed) return;
    if (selectedSwapIdx === null) {
      setSelectedSwapIdx(idx);
    } else if (selectedSwapIdx === idx) {
      setSelectedSwapIdx(null);
    } else {
      const nextOrder = [...currentOrder];
      const temp = nextOrder[selectedSwapIdx];
      nextOrder[selectedSwapIdx] = nextOrder[idx];
      nextOrder[idx] = temp;
      setCurrentOrder(nextOrder);
      onSelectAnswer(nextOrder);
      setSelectedSwapIdx(null);
    }
  };

  // =========================================================================
  // TYPE 1: MATCHING (Two-Column Drag & Drop / Tap-to-Pair Interface)
  // =========================================================================
  if (resolvedType === "MATCHING") {
    return (
      <div className="w-full space-y-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-300">
              বাম-ডান মিলকরণ (Interactive Line Matching & Tap Connect)
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            মাউস দিয়ে টেনে লাইন টানুন বা ক্লিক করে মিলান
          </span>
        </div>

        <MatchingQuestionPlayer
          question={{
            ...question,
            questionText: questionPrompt,
            matchingPairs,
            pairs: matchingPairs,
          }}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={onSelectAnswer}
          onConfirmAnswer={onConfirmAnswer}
          isConfirmed={isConfirmed}
          isCorrect={isCorrect}
          disabled={disabled}
        />
      </div>
    );
  }

  // =========================================================================
  // TYPE 2: FILL IN THE BLANKS (Inline Sentence Inputs or Glowing Field)
  // =========================================================================
  if (resolvedType === "FILL_BLANKS") {
    const parts = questionPrompt.split(/(\[.*?\]|___+)/g);
    let blankIndexCounter = 0;
    const hasInlineTokens = parts.length > 1;

    const getVal = (bIdx: number) => {
      if (!selectedAnswer) return "";
      if (typeof selectedAnswer === "string") return bIdx === 0 ? selectedAnswer : "";
      if (typeof selectedAnswer === "object") {
        return selectedAnswer[bIdx] ?? selectedAnswer[String(bIdx)] ?? selectedAnswer[`blank_${bIdx}`] ?? "";
      }
      return "";
    };

    const setVal = (bIdx: number, val: string) => {
      if (disabled || isConfirmed) return;
      if (!hasInlineTokens) {
        onSelectAnswer(val);
      } else {
        const prev = typeof selectedAnswer === "object" && selectedAnswer !== null
          ? { ...selectedAnswer }
          : (typeof selectedAnswer === "string" ? { 0: selectedAnswer } : {});
        prev[bIdx] = val;
        onSelectAnswer(prev);
      }
    };

    return (
      <div className="w-full space-y-5">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs sm:text-sm font-black text-cyan-700 dark:text-cyan-300">
              শূন্যস্থান পূরণ (Fill in the Blanks)
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            খালি ঘরে সঠিক উত্তর টাইপ করুন
          </span>
        </div>

        <div className="p-5 sm:p-7 rounded-3xl bg-white/95 dark:bg-slate-900/95 border-2 border-cyan-400/40 dark:border-cyan-600/40 shadow-xl backdrop-blur-xl">
          {hasInlineTokens ? (
            <div className="text-sm sm:text-base leading-loose font-bold text-slate-900 dark:text-white">
              {parts.map((seg: string, sIdx: number) => {
                const isBlank = (seg.startsWith("[") && seg.endsWith("]")) || seg.startsWith("___");
                if (isBlank) {
                  const bIdx = blankIndexCounter++;
                  return (
                    <span key={sIdx} className="inline-block mx-1.5 align-middle">
                      <input
                        type="text"
                        disabled={disabled || isConfirmed}
                        value={getVal(bIdx)}
                        onChange={(e) => setVal(bIdx, e.target.value)}
                        placeholder={`উত্তর ${bIdx + 1}`}
                        className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black text-center bg-cyan-50 dark:bg-cyan-950/80 border-2 border-cyan-400 dark:border-cyan-500 text-cyan-950 dark:text-cyan-100 shadow-sm outline-none focus:ring-2 focus:ring-cyan-400 min-w-[130px] max-w-[220px]"
                      />
                    </span>
                  );
                }
                return <span key={sIdx}>{seg}</span>;
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-relaxed">
                {questionPrompt}
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 shrink-0">
                  সঠিক উত্তর:
                </span>
                <input
                  type="text"
                  disabled={disabled || isConfirmed}
                  value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
                  onChange={(e) => onSelectAnswer(e.target.value)}
                  placeholder="সঠিক উত্তর এখানে টাইপ করুন..."
                  className="flex-1 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-cyan-400 dark:border-cyan-600 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // TYPE 3: REORDER (Sortable Sequence List with Mobile Chevrons & Click-to-Swap)
  // =========================================================================
  if (resolvedType === "REORDER") {
    return (
      <div className="w-full space-y-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs sm:text-sm font-black text-purple-700 dark:text-purple-300">
              ধারাবাহিক ক্রমানুসারে সাজান (Drag, Arrow Buttons or Tap-to-Swap)
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            {currentOrder.length} টি ধাপ
          </span>
        </div>

        {/* Interaction helper advice */}
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-500" />
            <span>ড্র্যাগ করুন, 🔼 🔽 বাটনে চাপুন, অথবা যেকোনো দুটি কার্ডে ট্যাপ করে জায়গা বদল করুন</span>
          </span>
          {selectedSwapIdx !== null && (
            <button
              type="button"
              onClick={() => setSelectedSwapIdx(null)}
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              সোয়াপ বাতিল
            </button>
          )}
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEndOrder}
        >
          <SortableContext items={currentOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-2.5">
              {currentOrder.map((itemText, idx) => (
                <SortableOrderItem
                  key={itemText}
                  id={itemText}
                  text={itemText}
                  index={idx}
                  total={currentOrder.length}
                  onMoveUp={() => handleMoveOrderItem(idx, idx - 1)}
                  onMoveDown={() => handleMoveOrderItem(idx, idx + 1)}
                  isSelectedForSwap={selectedSwapIdx === idx}
                  onCardClick={() => handleCardSwapTap(idx)}
                  disabled={disabled || isConfirmed}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    );
  }

  // =========================================================================
  // TYPE 4: TRUE / FALSE (Identical Neutral Cards Before Submission)
  // =========================================================================
  if (resolvedType === "TRUE_FALSE") {
    // Normalization of student selection
    const isSelectedTrue =
      selectedAnswer === true ||
      selectedAnswer === 0 ||
      String(selectedAnswer).toLowerCase() === "true" ||
      String(selectedAnswer) === "সত্য";

    const isSelectedFalse =
      selectedAnswer === false ||
      selectedAnswer === 1 ||
      String(selectedAnswer).toLowerCase() === "false" ||
      String(selectedAnswer) === "মিথ্যা";

    // Expected answer evaluation (only applied for feedback after isConfirmed === true)
    const snap = question?.questionSnapshot || question?.questionData || {};
    let expectedBool: boolean | null = null;
    if (question?.correctBoolean !== undefined) {
      expectedBool = Boolean(question.correctBoolean);
    } else if (snap.correctBoolean !== undefined) {
      expectedBool = Boolean(snap.correctBoolean);
    } else {
      const cand = question?.correctAnswer ?? snap.correctAnswer ?? question?.correct;
      if (typeof cand === "boolean") {
        expectedBool = cand;
      } else if (typeof cand === "string") {
        const lower = cand.trim().toLowerCase();
        if (lower === "true" || lower === "সত্য" || lower === "1") expectedBool = true;
        if (lower === "false" || lower === "মিথ্যা" || lower === "0") expectedBool = false;
      } else {
        const optIdx = question?.correctOptionIndex ?? snap.correctOptionIndex;
        if (optIdx !== undefined && optIdx !== null) {
          expectedBool = optIdx === 0;
        }
      }
    }

    // Determine visual states for TRUE (Card 1)
    let trueCardClass =
      "bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs";
    let trueIconClass =
      "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";

    // Determine visual states for FALSE (Card 2)
    let falseCardClass =
      "bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs";
    let falseIconClass =
      "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";

    if (!isConfirmed) {
      // PRE-CONFIRMATION: Exact identical neutral primary styling for both!
      if (isSelectedTrue) {
        trueCardClass =
          "bg-indigo-50/80 dark:bg-indigo-950/70 border-indigo-500 text-indigo-950 dark:text-cyan-200 shadow-md ring-4 ring-indigo-400/30 scale-[1.02]";
        trueIconClass =
          "bg-indigo-600 text-white shadow-md shadow-indigo-500/40 scale-105";
      }
      if (isSelectedFalse) {
        falseCardClass =
          "bg-indigo-50/80 dark:bg-indigo-950/70 border-indigo-500 text-indigo-950 dark:text-cyan-200 shadow-md ring-4 ring-indigo-400/30 scale-[1.02]";
        falseIconClass =
          "bg-indigo-600 text-white shadow-md shadow-indigo-500/40 scale-105";
      }
    } else {
      // POST-CONFIRMATION: Reveal green for correct and red for incorrect
      const isTrueCorrect = expectedBool === true;
      const isFalseCorrect = expectedBool === false;

      // Card 1 (TRUE)
      if (isSelectedTrue) {
        if (isTrueCorrect) {
          trueCardClass =
            "bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-4 ring-emerald-500/30 shadow-lg scale-[1.02]";
          trueIconClass = "bg-emerald-500 text-white shadow-md shadow-emerald-500/40 scale-110";
        } else {
          trueCardClass =
            "bg-rose-500/20 border-rose-500 text-rose-800 dark:text-rose-200 ring-4 ring-rose-500/30 shadow-lg scale-[1.02]";
          trueIconClass = "bg-rose-500 text-white shadow-md shadow-rose-500/40 scale-110";
        }
      } else if (isTrueCorrect) {
        trueCardClass =
          "bg-emerald-50/60 dark:bg-emerald-950/30 border-2 border-dashed border-emerald-400 text-emerald-800 dark:text-emerald-200";
        trueIconClass = "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300";
      }

      // Card 2 (FALSE)
      if (isSelectedFalse) {
        if (isFalseCorrect) {
          falseCardClass =
            "bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-4 ring-emerald-500/30 shadow-lg scale-[1.02]";
          falseIconClass = "bg-emerald-500 text-white shadow-md shadow-emerald-500/40 scale-110";
        } else {
          falseCardClass =
            "bg-rose-500/20 border-rose-500 text-rose-800 dark:text-rose-200 ring-4 ring-rose-500/30 shadow-lg scale-[1.02]";
          falseIconClass = "bg-rose-500 text-white shadow-md shadow-rose-500/40 scale-110";
        }
      } else if (isFalseCorrect) {
        falseCardClass =
          "bg-emerald-50/60 dark:bg-emerald-950/30 border-2 border-dashed border-emerald-400 text-emerald-800 dark:text-emerald-200";
        falseIconClass = "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300";
      }
    }

    return (
      <div className="w-full space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: TRUE (সত্য) */}
          <button
            type="button"
            disabled={disabled || isConfirmed}
            onClick={() => onSelectAnswer(true)}
            className={`p-6 sm:p-8 rounded-3xl border-3 flex flex-col items-center justify-center gap-3 transition-all duration-300 cursor-pointer ${trueCardClass}`}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${trueIconClass}`}
            >
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="text-center">
              <span className="text-xl sm:text-2xl font-black block">সত্য (True)</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                বিবৃতিটি পুরোপুরি সঠিক
              </span>
            </div>
          </button>

          {/* Card 2: FALSE (মিথ্যা) */}
          <button
            type="button"
            disabled={disabled || isConfirmed}
            onClick={() => onSelectAnswer(false)}
            className={`p-6 sm:p-8 rounded-3xl border-3 flex flex-col items-center justify-center gap-3 transition-all duration-300 cursor-pointer ${falseCardClass}`}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${falseIconClass}`}
            >
              <X className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="text-center">
              <span className="text-xl sm:text-2xl font-black block">মিথ্যা (False)</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                বিবৃতিটি ভুল বা অসত্য
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TYPE 5: MCQ (Standard Multiple Choice Options)
  // =========================================================================
  const letters = ["A", "B", "C", "D", "E", "F"];
  const banglaLetters = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {optionsList.map((optText, idx) => {
          const isSelected =
            selectedAnswer === idx ||
            selectedAnswer === String(idx) ||
            selectedAnswer === `opt_${idx}` ||
            selectedAnswer === optText;

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled || isConfirmed}
              onClick={() => onSelectAnswer(idx)}
              className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-3 cursor-pointer shadow-xs ${
                isSelected
                  ? "bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-950 dark:text-cyan-200 shadow-md ring-2 ring-indigo-400/40"
                  : "bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <span
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {banglaLetters[idx] || letters[idx]}
              </span>
              <span className="flex-1 text-xs sm:text-sm font-bold leading-snug break-words">
                {optText}
              </span>
              {isSelected && (
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-cyan-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default UniversalQuestionRenderer;
