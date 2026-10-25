"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  QUIZ_TEMPLATES,
  getTemplateById,
  NormalizedQuizQuestion,
  QuestionTypeUniversal,
} from "./templates";
import { AnimatePresence, motion } from "framer-motion";
import {
  Shuffle,
  Sparkles,
  Palette,
  ChevronDown,
  Layers,
  Lock,
  Unlock,
} from "lucide-react";
import MatchingQuestionPlayer from "./MatchingQuestionPlayer";

export interface QuizTemplateManagerProps {
  question: any;
  questionIndex?: number;
  totalQuestions?: number;
  selectedAnswer: any;
  onSelectAnswer: (ans: any) => void;
  onConfirmAnswer?: (ans: any) => void;
  isConfirmed?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
  templateId?: number; // Optional manual override
  autoRandomize?: boolean; // Default true: changes theme per question
  onTemplateChange?: (newTemplateId: number) => void;
  showControlsBar?: boolean; // Default true: shows template switcher bar
}

export function QuizTemplateManager({
  question,
  questionIndex = 0,
  totalQuestions = 1,
  selectedAnswer,
  onSelectAnswer,
  onConfirmAnswer,
  isConfirmed = false,
  isCorrect,
  disabled = false,
  templateId: forcedTemplateId,
  autoRandomize = true,
  onTemplateChange,
  showControlsBar = true,
}: QuizTemplateManagerProps) {
  // Mode: "random" (rotates every question) or "locked" (stays on chosen template)
  const [isAutoRandom, setIsAutoRandom] = useState<boolean>(autoRandomize);
  // Pick an initial truly random template between 1 and 20 if autoRandomize is enabled
  const [activeTemplateId, setActiveTemplateId] = useState<number>(() => {
    if (forcedTemplateId) return forcedTemplateId;
    if (autoRandomize) {
      return Math.floor(Math.random() * 20) + 1;
    }
    return 1;
  });
  const [showSelectorMenu, setShowSelectorMenu] = useState<boolean>(false);
  const activeTemplateIdRef = useRef<number>(activeTemplateId);
  activeTemplateIdRef.current = activeTemplateId;

  // Composite tracking key: combines ID and question index so EVERY "Next Question" triggers rotation
  const questionKey = useMemo(() => {
    const rawId = question?.id || question?.questionSnapshot?.id || "q";
    return `${rawId}_idx_${questionIndex}`;
  }, [question, questionIndex]);

  const lastQuestionKeyRef = useRef<string>(questionKey);

  // Normalize incoming question format from either Phase 3 LMS or LiveQuizArena
  const normalizedQuestion: NormalizedQuizQuestion = useMemo(() => {
    if (!question) {
      return {
        id: "placeholder",
        questionType: "MCQ",
        questionText: "প্রশ্ন প্রস্তুত হচ্ছে...",
        options: ["অপশন A", "অপশন B", "অপশন C", "অপশন D"],
        correctOptionIndex: 0,
      };
    }

    const snap = question.questionSnapshot || question.questionData || {};
    const rawType = String(
      question.questionType ||
      question.type ||
      snap.questionType ||
      snap.type ||
      "MCQ"
    ).toUpperCase();

    let resolvedType: QuestionTypeUniversal = "MCQ";
    if (rawType.includes("TRUE") || rawType.includes("TF") || rawType === "TRUE_FALSE") {
      resolvedType = "TRUE_FALSE";
    } else if (rawType.includes("BLANK") || rawType === "FILL_BLANKS" || rawType === "FILL_BLANK") {
      resolvedType = "FILL_BLANKS";
    } else if (rawType.includes("MATCH") || rawType === "MATCHING") {
      resolvedType = "MATCHING";
    } else if (rawType.includes("ORDER") || rawType.includes("REARRANGE") || rawType === "REORDER" || rawType === "ORDERING") {
      resolvedType = "REORDER";
    } else {
      resolvedType = "MCQ";
    }

    // Extract options
    let resolvedOptions: string[] = [];
    if (Array.isArray(question.options) && question.options.length > 0) {
      resolvedOptions = question.options;
    } else if (Array.isArray(snap.options) && snap.options.length > 0) {
      resolvedOptions = snap.options;
    } else if (Array.isArray(snap.steps) && snap.steps.length > 0) {
      resolvedOptions = snap.steps;
    }

    // Extract matching pairs
    let resolvedPairs = question.matchingPairs || question.pairs || snap.pairs || snap.matchingPairs || [];
    if ((!Array.isArray(resolvedPairs) || resolvedPairs.length === 0) && typeof (question.correctAnswer || snap.correctAnswer || question.optionsJson) === "string") {
      const candidate = String(question.correctAnswer || snap.correctAnswer || question.optionsJson).trim();
      if (candidate.startsWith("[")) {
        try {
          const parsed = JSON.parse(candidate);
          if (Array.isArray(parsed) && parsed.length > 0) {
            resolvedPairs = parsed;
          }
        } catch {}
      }
    }
    if (!Array.isArray(resolvedPairs) || resolvedPairs.length === 0) {
      if (resolvedType === "MATCHING") {
        resolvedPairs = [
          { left: "আইটেম ১", right: "ম্যাচ ১" },
          { left: "আইটেম ২", right: "ম্যাচ ২" },
        ];
      }
    }

    // Extract correct order
    let resolvedOrder = question.correctOrder || snap.steps || snap.correctOrder || resolvedOptions;

    return {
      id: question.id || `q-${questionIndex}`,
      questionType: resolvedType,
      questionText:
        question.questionText ||
        snap.questionText ||
        snap.prompt ||
        "একটি আদর্শ নমুনা প্রশ্ন?",
      options: resolvedOptions,
      correctOptionIndex: Number(question.correctOptionIndex ?? snap.correctOptionIndex ?? 0),
      correctBoolean:
        typeof question.correctBoolean === "boolean"
          ? question.correctBoolean
          : typeof snap.correctBoolean === "boolean"
          ? snap.correctBoolean
          : snap.correctAnswer === true || snap.correctAnswer === "true",
      acceptedAnswers: question.acceptedAnswers || snap.acceptedAnswers || [],
      matchingPairs: resolvedPairs,
      correctOrder: resolvedOrder,
      explanation: question.explanation || snap.explanation,
      marks: question.marks || snap.marks || 1,
      timeLimit: question.timeLimit || snap.timeLimit || 60,
    };
  }, [question, questionIndex]);

  // Handle TRUE Randomization on Question Transition (Runs on EVERY "Next Question" action)
  useEffect(() => {
    if (forcedTemplateId) {
      setActiveTemplateId(forcedTemplateId);
      return;
    }

    // Check if we navigated to a new question
    if (lastQuestionKeyRef.current !== questionKey) {
      lastQuestionKeyRef.current = questionKey;

      if (isAutoRandom) {
        const totalTemplates = QUIZ_TEMPLATES.length; // 20 templates
        const currentId = activeTemplateIdRef.current;
        // Unpredictable dynamic random selection from 1 to 20
        let nextId = Math.floor(Math.random() * totalTemplates) + 1;
        // Guarantee template rotation so every consecutive question feels uniquely fresh
        if (nextId === currentId && totalTemplates > 1) {
          const offset = Math.floor(Math.random() * (totalTemplates - 1)) + 1;
          nextId = ((currentId - 1 + offset) % totalTemplates) + 1;
        }

        setActiveTemplateId(nextId);
        if (onTemplateChange) onTemplateChange(nextId);
      }
    }
  }, [questionKey, isAutoRandom, forcedTemplateId, onTemplateChange]);

  const currentTemplateDef = useMemo(() => {
    return getTemplateById(activeTemplateId);
  }, [activeTemplateId]);

  const ActiveComponent = currentTemplateDef.component;

  const handleManualSelectTemplate = (id: number) => {
    setActiveTemplateId(id);
    setShowSelectorMenu(false);
    if (onTemplateChange) onTemplateChange(id);
  };

  const handleShuffleNow = () => {
    const totalTemplates = QUIZ_TEMPLATES.length;
    let nextId = Math.floor(Math.random() * totalTemplates) + 1;
    if (nextId === activeTemplateId && totalTemplates > 1) {
      nextId = (nextId % totalTemplates) + 1;
    }
    setActiveTemplateId(nextId);
    if (onTemplateChange) onTemplateChange(nextId);
  };

  return (
    <div className="w-full space-y-3">
      {/* Top Template Controls Bar */}
      {showControlsBar && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 px-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-xs shadow-2xs">
          {/* Active Template Badge & Theme Indicator */}
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: currentTemplateDef.accentColor }}
            />
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-800 dark:text-slate-100">
                থিম #{currentTemplateDef.id}: {currentTemplateDef.nameBangla}
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                ({currentTemplateDef.name})
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Auto-Randomize Toggle */}
            <button
              type="button"
              onClick={() => setIsAutoRandom((prev) => !prev)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition border ${
                isAutoRandom
                  ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-cyan-300 shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              }`}
              title={
                isAutoRandom
                  ? "স্বয়ংক্রিয় থিম রোটেশন সক্রিয় (প্রতি প্রশ্নে নতুন থিম আসবে)"
                  : "নির্দিষ্ট থিমে লক করা হয়েছে"
              }
            >
              {isAutoRandom ? (
                <>
                  <Unlock className="w-3 h-3" />
                  <span>রোটেশন চালু</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <span>লক করা</span>
                </>
              )}
            </button>

            {/* Instant Shuffle Button */}
            <button
              type="button"
              onClick={handleShuffleNow}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition"
              title="নতুন থিম এলোমেলোভাবে নির্বাচন করুন"
            >
              <Shuffle className="w-3 h-3" />
              <span className="hidden sm:inline">র‍্যান্ডম করুন</span>
            </button>

            {/* Template Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSelectorMenu((prev) => !prev)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 flex items-center gap-1 cursor-pointer transition"
              >
                <Palette className="w-3 h-3 text-indigo-500" />
                <span>২০টি থিম</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showSelectorMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 max-h-72 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 space-y-1 text-xs animate-in fade-in zoom-in-95">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block border-b border-slate-100 dark:border-slate-800">
                    পছন্দের থিম নির্বাচন করুন (১ - ২০)
                  </span>
                  {QUIZ_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleManualSelectTemplate(t.id)}
                      className={`w-full text-left p-2 rounded-xl flex items-center justify-between gap-2 transition cursor-pointer ${
                        t.id === activeTemplateId
                          ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-cyan-300 font-extrabold"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: t.accentColor }}
                        />
                        <span className="truncate">
                          #{t.id} {t.nameBangla}
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 uppercase font-mono">
                        {t.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animated Template Transition Canvas */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTemplateId}-${normalizedQuestion.id}`}
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -12 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-full"
        >
          {normalizedQuestion.questionType === "MATCHING" ? (
            <div className="w-full max-w-5xl mx-auto flex flex-col p-4 sm:p-6 bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Shuffle className="w-4 h-4" />
                  <span>বাম-ডান মিলকরণ (Interactive Line Matching & Tap Connect)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">মাউস দিয়ে টেনে লাইন টানুন বা ক্লিক করে মিলান</span>
              </div>
              <MatchingQuestionPlayer
                question={normalizedQuestion}
                selectedAnswer={selectedAnswer}
                onSelectAnswer={onSelectAnswer}
                onConfirmAnswer={onConfirmAnswer}
                isConfirmed={isConfirmed}
                isCorrect={isCorrect}
                disabled={disabled}
              />
            </div>
          ) : normalizedQuestion.questionType === "FILL_BLANKS" ? (
            <div className="w-full max-w-5xl mx-auto flex flex-col p-5 sm:p-7 bg-white/95 dark:bg-slate-900/95 rounded-3xl border-2 border-cyan-400/50 dark:border-cyan-600/50 shadow-xl backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  <span>শূন্যস্থান পূরণ (Fill in the Blanks)</span>
                </span>
                <span className="text-[11px] font-bold text-slate-400">খালি স্থানে সঠিক উত্তর লিখুন</span>
              </div>

              {(() => {
                const prompt = normalizedQuestion.questionText || "";
                const parts = prompt.split(/(\[.*?\]|___+)/g);
                let blankIndexCounter = 0;
                const hasInlineTokens = parts.length > 1;

                const getVal = (bIdx: number) => {
                  if (!selectedAnswer) return "";
                  if (typeof selectedAnswer === "string") return bIdx === 0 ? selectedAnswer : "";
                  if (typeof selectedAnswer === "object") {
                    return selectedAnswer[bIdx] ?? selectedAnswer[`blank_${bIdx}`] ?? "";
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
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-cyan-500/30 text-sm sm:text-base leading-loose font-bold text-slate-900 dark:text-white">
                    {hasInlineTokens ? (
                      parts.map((seg, sIdx) => {
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
                                className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black text-center bg-cyan-50 dark:bg-cyan-950/80 border-2 border-cyan-400 dark:border-cyan-500 text-cyan-950 dark:text-cyan-100 shadow-sm outline-none focus:ring-2 focus:ring-cyan-400 min-w-[130px] max-w-[200px]"
                              />
                            </span>
                          );
                        }
                        return <span key={sIdx}>{seg}</span>;
                      })
                    ) : (
                      <div className="space-y-4">
                        <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-relaxed">
                          {prompt}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 shrink-0">
                            উত্তর:
                          </span>
                          <input
                            type="text"
                            disabled={disabled || isConfirmed}
                            value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
                            onChange={(e) => onSelectAnswer(e.target.value)}
                            placeholder="সঠিক উত্তর এখানে টাইপ করুন..."
                            className="flex-1 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-cyan-400 dark:border-cyan-600 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <ActiveComponent
              question={normalizedQuestion}
              questionIndex={questionIndex}
              totalQuestions={totalQuestions}
              selectedAnswer={selectedAnswer}
              onSelectAnswer={onSelectAnswer}
              isConfirmed={isConfirmed}
              isCorrect={isCorrect}
              disabled={disabled}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default QuizTemplateManager;
