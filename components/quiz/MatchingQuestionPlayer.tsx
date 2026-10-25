"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Link2,
  X,
  Shuffle,
  Info,
  Check,
  MousePointer,
  HelpCircle,
} from "lucide-react";

export interface MatchingPairItem {
  id?: string | number;
  left: string;
  right: string;
}

export interface MatchingQuestionPlayerProps {
  question: {
    id?: string | number;
    questionText?: string;
    matchingPairs?: MatchingPairItem[];
    pairs?: MatchingPairItem[];
    correctAnswer?: any;
    optionsJson?: string;
    marks?: number;
    explanation?: string;
    questionSnapshot?: any;
    questionData?: any;
    [key: string]: any;
  };
  selectedAnswer?: any;
  onSelectAnswer: (answer: any) => void;
  onConfirmAnswer?: (matches: any) => void;
  isConfirmed?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
  onEvaluate?: (evaluation: {
    isCorrect: boolean;
    score: number;
    correctCount: number;
    totalCount: number;
  }) => void;
}

const PAIR_PALETTES = [
  { stroke: "#6366f1", bg: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500", lightBg: "bg-indigo-50 dark:bg-indigo-950/40" },
  { stroke: "#ec4899", bg: "bg-pink-500", text: "text-pink-600 dark:text-pink-400", border: "border-pink-500", lightBg: "bg-pink-50 dark:bg-pink-950/40" },
  { stroke: "#06b6d4", bg: "bg-cyan-500", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-500", lightBg: "bg-cyan-50 dark:bg-cyan-950/40" },
  { stroke: "#f59e0b", bg: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500", lightBg: "bg-amber-50 dark:bg-amber-950/40" },
  { stroke: "#10b981", bg: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500", lightBg: "bg-emerald-50 dark:bg-emerald-950/40" },
  { stroke: "#8b5cf6", bg: "bg-purple-500", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500", lightBg: "bg-purple-50 dark:bg-purple-950/40" },
];

function extractPairsFromQuestion(question: any): MatchingPairItem[] {
  if (!question) return [];

  const rawPairs =
    question.matchingPairs ||
    question.pairs ||
    question.questionSnapshot?.questionData?.pairs ||
    question.questionSnapshot?.pairs ||
    question.questionData?.pairs ||
    [];

  if (Array.isArray(rawPairs) && rawPairs.length > 0) {
    return rawPairs
      .filter((p: any) => p && (p.left || p.right))
      .map((p: any, idx: number) => ({
        id: p.id !== undefined ? p.id : idx + 1,
        left: String(p.left || "").trim(),
        right: String(p.right || "").trim(),
      }));
  }

  const jsonCandidate =
    (typeof question.correctAnswer === "string" && question.correctAnswer) ||
    (typeof question.optionsJson === "string" && question.optionsJson);

  if (jsonCandidate && jsonCandidate.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(jsonCandidate);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((p: any) => p && (p.left || p.right))
          .map((p: any, idx: number) => ({
            id: p.id !== undefined ? p.id : idx + 1,
            left: String(p.left || "").trim(),
            right: String(p.right || "").trim(),
          }));
      }
    } catch {}
  }

  return [
    { id: 1, left: "উপাদান ১ (Left A)", right: "ম্যাচ ১ (Match A)" },
    { id: 2, left: "উপাদান ২ (Left B)", right: "ম্যাচ ২ (Match B)" },
    { id: 3, left: "উপাদান ৩ (Left C)", right: "ম্যাচ ৩ (Match C)" },
  ];
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  if (result.length <= 1) return result;
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  // Ensure it's not identical to input if length > 1
  if (result.every((val, idx) => val === array[idx])) {
    const last = result.pop()!;
    result.unshift(last);
  }
  return result;
}

export default function MatchingQuestionPlayer({
  question,
  selectedAnswer,
  onSelectAnswer,
  onConfirmAnswer,
  isConfirmed = false,
  isCorrect,
  disabled = false,
  onEvaluate,
}: MatchingQuestionPlayerProps) {
  const pairs: MatchingPairItem[] = useMemo(() => {
    return extractPairsFromQuestion(question);
  }, [question]);

  // Shuffled right items list (persisted per question)
  const [shuffledRights, setShuffledRights] = useState<string[]>([]);

  // Matches mapping: "drop-0" -> "Right item text"
  const [matches, setMatches] = useState<Record<string, string>>({});

  // Selection states for click-to-connect
  const [selectedLeftIdx, setSelectedLeftIdx] = useState<number | null>(null);
  const [selectedRightIdx, setSelectedRightIdx] = useState<number | null>(null);

  // Mouse / Touch Drag-to-Draw Live Line state
  const [dragLine, setDragLine] = useState<{
    fromLeftIdx: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Hovered target during drag
  const [hoveredRightIdx, setHoveredRightIdx] = useState<number | null>(null);

  // Local checked state
  const [isLocalChecked, setIsLocalChecked] = useState<boolean>(false);
  const effectiveConfirmed = isConfirmed || isLocalChecked;

  // Board and Port DOM Refs for computing exact pixel coordinates
  const boardRef = useRef<HTMLDivElement | null>(null);
  const leftPortRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightPortRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Stored pixel coordinates for Left and Right ports relative to boardRef
  const [portPositions, setPortPositions] = useState<{
    left: { x: number; y: number }[];
    right: { x: number; y: number }[];
  }>({ left: [], right: [] });

  // Initialize pairs and shuffled right-side pool
  useEffect(() => {
    if (!pairs || pairs.length === 0) return;

    const rights = pairs.map((p) => p.right.trim()).filter(Boolean);
    const shuffled = shuffleArray(rights);
    setShuffledRights(shuffled);

    // Initial matches if resuming
    const initialMatches: Record<string, string> = {};
    if (selectedAnswer) {
      if (Array.isArray(selectedAnswer)) {
        selectedAnswer.forEach((item, idx) => {
          if (typeof item === "object" && item !== null && item.right) {
            initialMatches[`drop-${idx}`] = String(item.right);
          } else if (typeof item === "string") {
            initialMatches[`drop-${idx}`] = String(item);
          }
        });
      } else if (typeof selectedAnswer === "object" && selectedAnswer !== null) {
        pairs.forEach((p, idx) => {
          const directKey = selectedAnswer[p.left] || selectedAnswer[`drop-${idx}`] || selectedAnswer[idx];
          if (directKey) {
            initialMatches[`drop-${idx}`] = String(directKey);
          }
        });
      }
    }

    setMatches(initialMatches);
    setSelectedLeftIdx(null);
    setSelectedRightIdx(null);
    setDragLine(null);
    setIsLocalChecked(false);
  }, [question.id, pairs]);

  // Recalculate port coordinates relative to board container
  const updatePortPositions = useCallback(() => {
    if (!boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();

    const leftPositions = leftPortRefs.current.map((el) => {
      if (!el) return { x: 0, y: 0 };
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - boardRect.left,
        y: r.top + r.height / 2 - boardRect.top,
      };
    });

    const rightPositions = rightPortRefs.current.map((el) => {
      if (!el) return { x: 0, y: 0 };
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - boardRect.left,
        y: r.top + r.height / 2 - boardRect.top,
      };
    });

    setPortPositions({ left: leftPositions, right: rightPositions });
  }, []);

  // Update port positions on mount, resize, scroll, and matches change
  useEffect(() => {
    updatePortPositions();
    const handleResize = () => updatePortPositions();
    window.addEventListener("resize", handleResize);

    const timer = setTimeout(updatePortPositions, 80);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [shuffledRights, matches, updatePortPositions]);

  // Synchronize state changes to parent via onSelectAnswer
  const emitMatches = useCallback(
    (currentMatches: Record<string, string>) => {
      const pairArray = pairs.map((p, idx) => ({
        id: p.id !== undefined ? p.id : idx + 1,
        left: p.left,
        right: currentMatches[`drop-${idx}`] || "",
      }));

      const compositeAnswer: any = [...pairArray];
      pairs.forEach((p, idx) => {
        compositeAnswer[p.left] = currentMatches[`drop-${idx}`] || "";
        compositeAnswer[`drop-${idx}`] = currentMatches[`drop-${idx}`] || "";
      });
      compositeAnswer.mapping = currentMatches;

      onSelectAnswer(compositeAnswer);

      if (effectiveConfirmed && onEvaluate) {
        let correctCount = 0;
        pairs.forEach((p, idx) => {
          const matched = currentMatches[`drop-${idx}`];
          if (matched && matched.trim().toLowerCase() === p.right.trim().toLowerCase()) {
            correctCount++;
          }
        });
        const isAllCorrect = correctCount === pairs.length && pairs.length > 0;
        const score = Math.round((correctCount / pairs.length) * (question.marks || 1));
        onEvaluate({
          isCorrect: isAllCorrect,
          score,
          correctCount,
          totalCount: pairs.length,
        });
      }
    },
    [pairs, question.marks, onSelectAnswer, onEvaluate, effectiveConfirmed]
  );

  // Connect Left item idx with Right item text
  const connectPair = (leftIdx: number, rightText: string) => {
    if (disabled || effectiveConfirmed) return;

    const nextMatches = { ...matches };

    // Clear any previous left item that was connected to this right item (1-to-1 matching)
    Object.keys(nextMatches).forEach((key) => {
      if (nextMatches[key] === rightText) {
        delete nextMatches[key];
      }
    });

    nextMatches[`drop-${leftIdx}`] = rightText;
    setMatches(nextMatches);
    setSelectedLeftIdx(null);
    setSelectedRightIdx(null);
    emitMatches(nextMatches);
  };

  // Disconnect a matched pair
  const handleDisconnect = (leftIdx: number) => {
    if (disabled || effectiveConfirmed) return;
    const nextMatches = { ...matches };
    delete nextMatches[`drop-${leftIdx}`];
    setMatches(nextMatches);
    setSelectedLeftIdx(null);
    setSelectedRightIdx(null);
    emitMatches(nextMatches);
  };

  // Reset all connections
  const handleResetAll = () => {
    if (disabled || effectiveConfirmed) return;
    setMatches({});
    setSelectedLeftIdx(null);
    setSelectedRightIdx(null);
    setDragLine(null);
    setIsLocalChecked(false);
    emitMatches({});
  };

  // Click-to-connect handler on Left Card
  const handleLeftCardClick = (leftIdx: number) => {
    if (disabled || effectiveConfirmed) return;

    // If already has right item selected, connect immediately
    if (selectedRightIdx !== null) {
      const rightText = shuffledRights[selectedRightIdx];
      if (rightText) {
        connectPair(leftIdx, rightText);
        return;
      }
    }

    // Toggle selection
    if (selectedLeftIdx === leftIdx) {
      setSelectedLeftIdx(null);
    } else {
      setSelectedLeftIdx(leftIdx);
      setSelectedRightIdx(null);
    }
  };

  // Click-to-connect handler on Right Card
  const handleRightCardClick = (rIdx: number) => {
    if (disabled || effectiveConfirmed) return;

    const rightText = shuffledRights[rIdx];
    if (!rightText) return;

    // If left item is selected, connect immediately
    if (selectedLeftIdx !== null) {
      connectPair(selectedLeftIdx, rightText);
      return;
    }

    // Toggle selection
    if (selectedRightIdx === rIdx) {
      setSelectedRightIdx(null);
    } else {
      setSelectedRightIdx(rIdx);
    }
  };

  // Start Line Drag (Mouse or Touch from Left Port / Card)
  const handleStartDrag = (e: React.MouseEvent | React.TouchEvent, leftIdx: number) => {
    if (disabled || effectiveConfirmed || !boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const portPos = portPositions.left[leftIdx];
    const startX = portPos ? portPos.x : clientX - boardRect.left;
    const startY = portPos ? portPos.y : clientY - boardRect.top;

    setDragLine({
      fromLeftIdx: leftIdx,
      startX,
      startY,
      currentX: clientX - boardRect.left,
      currentY: clientY - boardRect.top,
    });
    setSelectedLeftIdx(leftIdx);
  };

  // Live Move during drag
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragLine || !boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const curX = e.clientX - boardRect.left;
    const curY = e.clientY - boardRect.top;

    setDragLine((prev) => (prev ? { ...prev, currentX: curX, currentY: curY } : null));

    // Check hit test over right ports
    let hovered: number | null = null;
    rightPortRefs.current.forEach((el, rIdx) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (
        e.clientX >= r.left - 25 &&
        e.clientX <= r.right + 25 &&
        e.clientY >= r.top - 25 &&
        e.clientY <= r.bottom + 25
      ) {
        hovered = rIdx;
      }
    });
    setHoveredRightIdx(hovered);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragLine || !boardRef.current) return;
    const touch = e.touches[0];
    const boardRect = boardRef.current.getBoundingClientRect();
    const curX = touch.clientX - boardRect.left;
    const curY = touch.clientY - boardRect.top;

    setDragLine((prev) => (prev ? { ...prev, currentX: curX, currentY: curY } : null));

    let hovered: number | null = null;
    rightPortRefs.current.forEach((el, rIdx) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (
        touch.clientX >= r.left - 25 &&
        touch.clientX <= r.right + 25 &&
        touch.clientY >= r.top - 25 &&
        touch.clientY <= r.bottom + 25
      ) {
        hovered = rIdx;
      }
    });
    setHoveredRightIdx(hovered);
  };

  // End Drag and snap line if released over a right card
  const handleEndDrag = () => {
    if (!dragLine) return;

    if (hoveredRightIdx !== null) {
      const rightText = shuffledRights[hoveredRightIdx];
      if (rightText) {
        connectPair(dragLine.fromLeftIdx, rightText);
      }
    }

    setDragLine(null);
    setHoveredRightIdx(null);
  };

  // Confirm and Evaluate Answer
  const handleCheckAnswer = () => {
    setIsLocalChecked(true);

    let correctCount = 0;
    pairs.forEach((p, idx) => {
      const matched = matches[`drop-${idx}`];
      if (matched && matched.trim().toLowerCase() === p.right.trim().toLowerCase()) {
        correctCount++;
      }
    });
    const isAllCorrect = correctCount === pairs.length && pairs.length > 0;
    const score = Math.round((correctCount / pairs.length) * (question.marks || 1));

    if (onEvaluate) {
      onEvaluate({
        isCorrect: isAllCorrect,
        score,
        correctCount,
        totalCount: pairs.length,
      });
    }

    if (onConfirmAnswer) {
      onConfirmAnswer(matches);
    }
  };

  const totalPairs = pairs.length;
  const connectedCount = Object.keys(matches).filter((k) => k.startsWith("drop-") && matches[k]).length;
  const isAllConnected = connectedCount >= totalPairs && totalPairs > 0;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col space-y-4 select-none">
      {/* Top Header & Instruction Strip */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-slate-900 dark:text-white block sm:inline mr-2">
              লাইন দিয়ে মিলকরণ (Interactive Line Matching):
            </span>
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">
              মাউস দিয়ে টেনে লাইন টানুন অথবা বাম ও ডান আইটেমে ক্লিক করে জোড়া মিলান।
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress Pill */}
          <span className={`px-3 py-1 rounded-full text-[11px] font-black tracking-wide border ${
            isAllConnected
              ? "bg-emerald-100 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300"
              : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          }`}>
            {connectedCount} / {totalPairs} জোড়া সংযুক্ত
          </span>

          {/* Reset Button */}
          {!effectiveConfirmed && connectedCount > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleResetAll}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              title="সব লাইন মুছুন (Reset All)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Matching Board with SVG Connecting Lines */}
      <div
        ref={boardRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseUp={handleEndDrag}
        onTouchEnd={handleEndDrag}
        className="relative w-full rounded-3xl p-4 sm:p-6 bg-white dark:bg-[#0f111a] border-2 border-slate-200 dark:border-slate-800 shadow-md min-h-[300px] overflow-hidden"
      >
        {/* SVG Canvas for Drawing Connecting Bezier Curves */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ overflow: "visible" }}
        >
          {/* 1. Permanent Connected Lines */}
          {pairs.map((p, idx) => {
            const rightText = matches[`drop-${idx}`];
            if (!rightText) return null;
            const rightIdx = shuffledRights.indexOf(rightText);
            if (rightIdx === -1) return null;

            const p1 = portPositions.left[idx];
            const p2 = portPositions.right[rightIdx];
            if (!p1 || !p2) return null;

            const isCorrectPair = p.right.trim().toLowerCase() === rightText.trim().toLowerCase();
            const palette = PAIR_PALETTES[idx % PAIR_PALETTES.length];

            let strokeColor = palette.stroke;
            let strokeWidth = 3.5;

            if (effectiveConfirmed) {
              strokeColor = isCorrectPair ? "#10b981" : "#f43f5e";
              strokeWidth = 4;
            }

            const dx = Math.abs(p2.x - p1.x) * 0.45;
            const pathData = `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            return (
              <g key={`conn-${idx}-${rightIdx}`}>
                {/* Glow Filter Line */}
                <path
                  d={pathData}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth + 3}
                  strokeOpacity={0.25}
                  fill="none"
                />

                {/* Main Vibrant Line */}
                <path
                  d={pathData}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                />

                {/* Connector Endpoint Rings */}
                <circle cx={p1.x} cy={p1.y} r={5} fill={strokeColor} />
                <circle cx={p2.x} cy={p2.y} r={5} fill={strokeColor} />

                {/* Midpoint Status Icon when Confirmed */}
                {effectiveConfirmed && (
                  <circle
                    cx={midX}
                    cy={midY}
                    r={9}
                    fill={isCorrectPair ? "#10b981" : "#f43f5e"}
                    className="shadow-md"
                  />
                )}
              </g>
            );
          })}

          {/* 2. Real-time Live Rubberband Drag Line */}
          {dragLine && (
            <g>
              <path
                d={`M ${dragLine.startX} ${dragLine.startY} C ${dragLine.startX + 40} ${dragLine.startY}, ${dragLine.currentX - 40} ${dragLine.currentY}, ${dragLine.currentX} ${dragLine.currentY}`}
                stroke="#6366f1"
                strokeWidth={3.5}
                strokeDasharray="6,4"
                fill="none"
                strokeLinecap="round"
                className="animate-pulse"
              />
              <circle cx={dragLine.startX} cy={dragLine.startY} r={6} fill="#6366f1" />
              <circle cx={dragLine.currentX} cy={dragLine.currentY} r={5} fill="#a855f7" />
            </g>
          )}
        </svg>

        {/* Two Neat Columns (Left Items vs Right Items) with Central Line Space */}
        <div className="relative z-20 grid grid-cols-2 gap-8 sm:gap-16 items-start">
          {/* LEFT COLUMN: Fixed Left Items */}
          <div className="space-y-3.5">
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block pb-1 border-b border-slate-200 dark:border-slate-800">
              ১. বাম পাশের বিষয়সমূহ (Left Items)
            </span>

            {pairs.map((pair, idx) => {
              const dropKey = `drop-${idx}`;
              const matchedRight = matches[dropKey];
              const isSelected = selectedLeftIdx === idx;
              const isConnected = !!matchedRight;
              const palette = PAIR_PALETTES[idx % PAIR_PALETTES.length];

              const isCorrectPair =
                effectiveConfirmed && matchedRight
                  ? pair.right.trim().toLowerCase() === matchedRight.trim().toLowerCase()
                  : null;

              return (
                <div
                  key={`left-${idx}`}
                  onClick={() => handleLeftCardClick(idx)}
                  className={`group relative p-3 sm:p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? "ring-3 ring-indigo-500/40 border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-md scale-[1.01]"
                      : isConnected
                      ? effectiveConfirmed
                        ? isCorrectPair
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
                          : "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30"
                        : `${palette.border} ${palette.lightBg}`
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-850"
                  } ${!effectiveConfirmed && !disabled ? "cursor-pointer" : ""}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white break-words leading-snug">
                      {pair.left}
                    </span>
                  </div>

                  {/* Disconnect button if matched */}
                  {isConnected && !effectiveConfirmed && !disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDisconnect(idx);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition"
                      title="সংযোগ বিচ্ছিন্ন করুন"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Right Output Port Dot */}
                  <div
                    ref={(el) => {
                      leftPortRefs.current[idx] = el;
                    }}
                    onMouseDown={(e) => handleStartDrag(e, idx)}
                    onTouchStart={(e) => handleStartDrag(e, idx)}
                    className={`w-4 h-4 rounded-full border-2 transition-transform shrink-0 flex items-center justify-center ${
                      isConnected
                        ? effectiveConfirmed
                          ? isCorrectPair
                            ? "bg-emerald-500 border-white dark:border-slate-900"
                            : "bg-rose-500 border-white dark:border-slate-900"
                          : `${palette.bg} border-white dark:border-slate-900 shadow-xs`
                        : isSelected
                        ? "bg-indigo-600 border-white animate-pulse scale-125"
                        : "bg-slate-300 dark:bg-slate-700 border-white dark:border-slate-900 hover:scale-125"
                    }`}
                    title="ড্র্যাগ করে ডান পাশে যুক্ত করুন"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: Shuffled Right Items */}
          <div className="space-y-3.5">
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block pb-1 border-b border-slate-200 dark:border-slate-800">
              ২. ডান পাশের জোড়া মিলান (Right Matches)
            </span>

            {shuffledRights.map((rItem, rIdx) => {
              // Find which left item connects to this right item
              const connectedLeftDropKey = Object.keys(matches).find((k) => matches[k] === rItem);
              const connectedLeftIdx = connectedLeftDropKey
                ? parseInt(connectedLeftDropKey.replace("drop-", ""), 10)
                : null;
              const isConnected = connectedLeftIdx !== null;
              const isSelected = selectedRightIdx === rIdx;
              const isHovered = hoveredRightIdx === rIdx;
              const palette = connectedLeftIdx !== null ? PAIR_PALETTES[connectedLeftIdx % PAIR_PALETTES.length] : null;

              const isCorrectPair =
                effectiveConfirmed && connectedLeftIdx !== null
                  ? pairs[connectedLeftIdx]?.right.trim().toLowerCase() === rItem.trim().toLowerCase()
                  : null;

              return (
                <div
                  key={`right-${rIdx}`}
                  onClick={() => handleRightCardClick(rIdx)}
                  className={`group relative p-3 sm:p-3.5 rounded-2xl border-2 transition-all flex items-center gap-2.5 ${
                    isHovered
                      ? "ring-3 ring-cyan-500 border-cyan-500 bg-cyan-50 dark:bg-cyan-950/60 scale-[1.02]"
                      : isSelected
                      ? "ring-3 ring-indigo-500/40 border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 scale-[1.01]"
                      : isConnected && palette
                      ? effectiveConfirmed
                        ? isCorrectPair
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
                          : "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30"
                        : `${palette.border} ${palette.lightBg}`
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-850"
                  } ${!effectiveConfirmed && !disabled ? "cursor-pointer" : ""}`}
                >
                  {/* Left Input Port Dot */}
                  <div
                    ref={(el) => {
                      rightPortRefs.current[rIdx] = el;
                    }}
                    className={`w-4 h-4 rounded-full border-2 transition-transform shrink-0 flex items-center justify-center ${
                      isConnected && palette
                        ? effectiveConfirmed
                          ? isCorrectPair
                            ? "bg-emerald-500 border-white dark:border-slate-900"
                            : "bg-rose-500 border-white dark:border-slate-900"
                          : `${palette.bg} border-white dark:border-slate-900 shadow-xs`
                        : isHovered || isSelected
                        ? "bg-indigo-600 border-white animate-pulse scale-125"
                        : "bg-slate-300 dark:bg-slate-700 border-white dark:border-slate-900"
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-black flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + rIdx)}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white break-words leading-snug">
                      {rItem}
                    </span>
                  </div>

                  {/* Connected Left Tag Badge */}
                  {isConnected && connectedLeftIdx !== null && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                      ← {connectedLeftIdx + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Result Explanation Strip after confirmation */}
      {effectiveConfirmed && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 text-xs animate-fade-in">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>সঠিক মিলসমূহের সমাধান তালিকা (Correct Matches):</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pairs.map((p, idx) => {
              const studentMatched = matches[`drop-${idx}`];
              const isMatchRight = studentMatched && studentMatched.trim().toLowerCase() === p.right.trim().toLowerCase();
              return (
                <div
                  key={`sol-${idx}`}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
                    isMatchRight
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                  }`}
                >
                  <span>
                    <strong>{p.left}</strong> ➔ {p.right}
                  </span>
                  {isMatchRight ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dedicated Check Answer Button */}
      {!effectiveConfirmed && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={!isAllConnected || disabled}
            onClick={handleCheckAnswer}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md ${
              isAllConnected && !disabled
                ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-98 shadow-emerald-500/20"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700"
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>উত্তর জমা দিন / যাচাই করুন (Check Answer)</span>
          </button>
        </div>
      )}
    </div>
  );
}
