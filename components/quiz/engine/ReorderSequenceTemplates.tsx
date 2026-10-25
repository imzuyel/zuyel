"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Check,
} from "lucide-react";
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
import { NormalizedQuizQuestion } from "./types";

interface ReorderSequenceProps {
  question: NormalizedQuizQuestion;
  selectedAnswer: any;
  onSelectAnswer: (answer: any) => void;
  onConfirmAnswer?: (answer: any) => void;
  isConfirmed?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
}

// Sortable item wrapper for Vertical Timeline
const TimelineSortableItem = React.memo(function TimelineSortableItem({
  id,
  text,
  index,
  total,
  onMoveUp,
  onMoveDown,
  disabled,
  isConfirmed,
  isSlotCorrect,
}: {
  id: string;
  text: string;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disabled?: boolean;
  isConfirmed?: boolean;
  isSlotCorrect?: boolean;
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

  let feedbackClass = "";
  if (isConfirmed) {
    if (isSlotCorrect) {
      feedbackClass =
        "!bg-emerald-500/15 dark:!bg-emerald-500/25 !border-emerald-500 !text-emerald-950 dark:!text-emerald-100 ring-2 ring-emerald-500";
    } else {
      feedbackClass =
        "!bg-rose-500/15 dark:!bg-rose-500/25 !border-rose-500 !text-rose-950 dark:!text-rose-100 ring-2 ring-rose-500";
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 transition-all flex items-center justify-between gap-3 ${
        feedbackClass
          ? feedbackClass
          : isDragging
          ? "border-indigo-500 shadow-2xl z-30 scale-105 opacity-90"
          : "border-slate-200 dark:border-slate-800 hover:border-indigo-400/50 shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled || isConfirmed}
          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-grab active:cursor-grabbing shrink-0 disabled:opacity-40"
          title="ড্র্যাগ করে ক্রম পরিবর্তন করুন"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Text */}
        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white break-words leading-snug">
          {text}
        </span>
      </div>

      {/* Explicit Up / Down Mobile & PC buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          disabled={disabled || isConfirmed || index === 0}
          onClick={onMoveUp}
          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer transition shadow-2xs"
          title="উপরে নিন"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={disabled || isConfirmed || index === total - 1}
          onClick={onMoveDown}
          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer transition shadow-2xs"
          title="নিচে নিন"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

/**
 * REORDER SEQUENCE - Strictly Locked to Accessible Vertical Timeline Style
 */
export const ReorderSequenceTemplates = React.memo(function ReorderSequenceTemplates({
  question,
  selectedAnswer,
  onSelectAnswer,
  onConfirmAnswer,
  isConfirmed = false,
  isCorrect,
  disabled = false,
}: ReorderSequenceProps) {
  // Base correct list
  const baseItems = useMemo(() => {
    if (Array.isArray(question.correctOrder) && question.correctOrder.length > 0) {
      return question.correctOrder;
    }
    if (Array.isArray(question.options) && question.options.length > 0) {
      return question.options;
    }
    return ["ধাপ ১: প্রস্তুতি", "ধাপ ২: সংযোগ", "ধাপ ৩: পরীক্ষা"];
  }, [question]);

  // Current ordering list
  const [items, setItems] = useState<{ id: string; text: string }[]>([]);

  // Initialize or restore
  useEffect(() => {
    if (Array.isArray(selectedAnswer) && selectedAnswer.length > 0) {
      setItems(
        selectedAnswer.map((text: string, idx: number) => ({
          id: `step_${text}_${idx}`,
          text,
        }))
      );
    } else {
      // Create initial shuffled state so steps don't already start in correct sequence
      const formatted = baseItems.map((text, idx) => ({
        id: `step_${idx}`,
        text,
        origIdx: idx,
      }));
      const shuffled = [...formatted].sort(
        (a, b) => ((a.origIdx * 5 + 3) % 7) - ((b.origIdx * 5 + 3) % 7)
      );
      setItems(shuffled.map(({ id, text }) => ({ id, text })));
    }
  }, [baseItems, selectedAnswer, question.id]);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || disabled || isConfirmed) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      const updated = arrayMove(prev, oldIndex, newIndex);
      onSelectAnswer(updated.map((u) => u.text));
      return updated;
    });
  };

  const handleMoveStep = (idx: number, direction: "up" | "down") => {
    if (disabled || isConfirmed) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const updated = arrayMove(items, idx, targetIdx);
    setItems(updated);
    onSelectAnswer(updated.map((u) => u.text));
  };

  return (
    <div className="w-full space-y-4">
      {/* Clean Student Header (Task 1 & 5: No debug badges or style tabs) */}
      <div className="flex items-center gap-2 p-3 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
        <span className="p-1.5 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 shrink-0">
          <ArrowUpDown className="w-4 h-4" />
        </span>
        <span className="font-extrabold break-words">
          ড্র্যাগ করে বা ডান পাশের তীর চিহ্নে (↑ ↓) ক্লিক করে আইটেমগুলো সঠিক ক্রমানুসারে সাজান।
        </span>
      </div>

      {/* STRICTLY LOCKED: VERTICAL 3D CONNECTED TIMELINE */}
      <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 border-2 border-purple-500/30 rounded-3xl space-y-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="relative grid grid-cols-[48px_1fr] gap-4 items-stretch">
              {/* Left Fixed Rank Slots Rail with Vertical Spine */}
              <div className="relative flex flex-col justify-around items-center py-2">
                <div className="absolute top-6 bottom-6 w-1 bg-gradient-to-b from-purple-500 via-indigo-500 to-cyan-500 rounded-full" />
                {items.map((_, rIdx) => (
                  <div
                    key={rIdx}
                    className="relative z-10 w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-md shadow-purple-500/30"
                  >
                    #{rIdx + 1}
                  </div>
                ))}
              </div>

              {/* Right Draggable Step Cards */}
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const isSlotCorrect = baseItems[idx] === item.text;
                  return (
                    <TimelineSortableItem
                      key={item.id}
                      id={item.id}
                      text={item.text}
                      index={idx}
                      total={items.length}
                      onMoveUp={() => handleMoveStep(idx, "up")}
                      onMoveDown={() => handleMoveStep(idx, "down")}
                      disabled={disabled || isConfirmed}
                      isConfirmed={isConfirmed}
                      isSlotCorrect={isSlotCorrect}
                    />
                  );
                })}
              </div>
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Submit Action Bar */}
      {onConfirmAnswer && !isConfirmed && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onConfirmAnswer(items.map((i) => i.text))}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-2 shadow-lg active:scale-95 cursor-pointer transition"
          >
            <Check className="w-4 h-4" />
            <span>ক্রম যাচাই করুন (Submit)</span>
          </button>
        </div>
      )}

      {/* Post-submission evaluation feedback (Universal Green / Red) */}
      {isConfirmed && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            isCorrect
              ? "!bg-emerald-500/20 dark:!bg-emerald-500/30 !border-emerald-500 !text-emerald-950 dark:!text-emerald-100 ring-2 ring-emerald-500"
              : "!bg-rose-500/20 dark:!bg-rose-500/30 !border-rose-500 !text-rose-950 dark:!text-rose-100 ring-2 ring-rose-500"
          }`}
        >
          {isCorrect ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>চমৎকার! আপনার ধারাবাহিক ক্রম সম্পূর্ণ সঠিক হয়েছে।</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>ক্রমটিতে কিছু ভুল ছিল। সঠিক ক্রমটি পর্যালোচনা করুন।</span>
            </>
          )}
        </div>
      )}
    </div>
  );
});

export default ReorderSequenceTemplates;
