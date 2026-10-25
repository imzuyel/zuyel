"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Shuffle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
  X,
} from "lucide-react";
import { NormalizedQuizQuestion } from "./types";

interface MatchingBoardProps {
  question: NormalizedQuizQuestion;
  selectedAnswer: any;
  onSelectAnswer: (answer: any) => void;
  onConfirmAnswer?: (answer: any) => void;
  isConfirmed?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
}

const PAIR_COLORS = [
  { stroke: "#06B6D4", bg: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-500" },
  { stroke: "#A855F7", bg: "bg-purple-500", text: "text-purple-400", border: "border-purple-500" },
  { stroke: "#F59E0B", bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500" },
  { stroke: "#EC4899", bg: "bg-pink-500", text: "text-pink-400", border: "border-pink-500" },
  { stroke: "#10B981", bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500" },
  { stroke: "#3B82F6", bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500" },
];

interface SvgLineCanvasProps {
  lineCoords: { x1: number; y1: number; x2: number; y2: number; color: string }[];
}

/**
 * Isolated, memoized SVG line-drawing canvas.
 * Prevents re-rendering the SVG canvas unless line coordinates actually change.
 */
export const SvgLineCanvas = React.memo(function SvgLineCanvas({ lineCoords }: SvgLineCanvasProps) {
  return (
    <svg className="absolute inset-0 pointer-events-none w-full h-full z-20">
      <defs>
        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {lineCoords.map((line, idx) => {
        const dx = (line.x2 - line.x1) * 0.5;
        const pathD = `M ${line.x1} ${line.y1} C ${line.x1 + dx} ${line.y1}, ${line.x2 - dx} ${line.y2}, ${line.x2} ${line.y2}`;
        return (
          <g key={idx}>
            <path
              d={pathD}
              stroke={line.color}
              strokeWidth="6"
              strokeOpacity="0.4"
              fill="none"
              filter="url(#neonGlow)"
            />
            <path
              d={pathD}
              stroke={line.color}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        );
      })}
    </svg>
  );
});

/**
 * MATCHING BOARD - Strictly Locked to Interactive SVG Cross-Line Style (Task 2)
 * Connects left column and right column cards via interactive bezier curve lines.
 */
export const MatchingBoardTemplates = React.memo(function MatchingBoardTemplates({
  question,
  selectedAnswer,
  onSelectAnswer,
  onConfirmAnswer,
  isConfirmed = false,
  isCorrect,
  disabled = false,
}: MatchingBoardProps) {
  // Extract pairs safely
  const originalPairs = useMemo(() => {
    const raw = question.matchingPairs || [];
    if (raw.length > 0) return raw;
    return [
      { left: "বাম পাশ ১", right: "ডান পাশ ১" },
      { left: "বাম পাশ ২", right: "ডান পাশ ২" },
      { left: "বাম পাশ ৩", right: "ডান পাশ ৩" },
    ];
  }, [question]);

  // Shuffled right items for game play
  const [shuffledRightItems, setShuffledRightItems] = useState<
    { id: string; text: string; origIndex: number }[]
  >([]);
  const [matches, setMatches] = useState<Record<number, number>>({}); // leftIdx -> rightItemIdx
  const [activeLeftSelected, setActiveLeftSelected] = useState<number | null>(null);

  // For SVG Cross-Line Canvas
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPortRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightPortRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lineCoords, setLineCoords] = useState<
    { x1: number; y1: number; x2: number; y2: number; color: string }[]
  >([]);

  // Initialize shuffled right items
  useEffect(() => {
    const rightList = originalPairs.map((p, i) => ({
      id: `right_${i}`,
      text: p.right,
      origIndex: i,
    }));
    // deterministic initial pseudo-random shuffle to ensure they don't start already aligned
    const shuffled = [...rightList].sort(
      (a, b) => ((a.origIndex * 7 + 3) % 11) - ((b.origIndex * 7 + 3) % 11)
    );
    setShuffledRightItems(shuffled);

    // If answer already exists, restore
    if (selectedAnswer && typeof selectedAnswer === "object") {
      if (selectedAnswer.mapping) {
        setMatches(selectedAnswer.mapping);
      } else if (!Array.isArray(selectedAnswer)) {
        setMatches(selectedAnswer);
      }
    } else {
      setMatches({});
    }
    setActiveLeftSelected(null);
  }, [originalPairs, question.id]);

  // Update line coordinates on resize or match change
  const updateLines = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newCoords: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];

    Object.entries(matches).forEach(([leftIdxStr, rightIdx]) => {
      const leftIdx = Number(leftIdxStr);
      const lEl = leftPortRefs.current[leftIdx];
      const rEl = rightPortRefs.current[rightIdx];
      if (lEl && rEl) {
        const lRect = lEl.getBoundingClientRect();
        const rRect = rEl.getBoundingClientRect();

        let strokeColor = PAIR_COLORS[leftIdx % PAIR_COLORS.length].stroke;
        if (isConfirmed) {
          const isPairCorrect = shuffledRightItems[rightIdx]?.origIndex === leftIdx;
          strokeColor = isPairCorrect ? "#10B981" : "#F43F5E";
        }

        newCoords.push({
          x1: lRect.left + lRect.width / 2 - containerRect.left,
          y1: lRect.top + lRect.height / 2 - containerRect.top,
          x2: rRect.left + rRect.width / 2 - containerRect.left,
          y2: rRect.top + rRect.height / 2 - containerRect.top,
          color: strokeColor,
        });
      }
    });

    setLineCoords(newCoords);
  };

  useEffect(() => {
    updateLines();
    window.addEventListener("resize", updateLines);
    const t = setTimeout(updateLines, 100);
    return () => {
      window.removeEventListener("resize", updateLines);
      clearTimeout(t);
    };
  }, [matches, shuffledRightItems, isConfirmed]);

  // Handle Match Pairing (Click-to-pair)
  const handleLeftClick = (leftIdx: number) => {
    if (disabled || isConfirmed) return;
    if (activeLeftSelected === leftIdx) {
      setActiveLeftSelected(null);
    } else {
      setActiveLeftSelected(leftIdx);
    }
  };

  const handleRightClick = (rightIdx: number) => {
    if (disabled || isConfirmed) return;
    if (activeLeftSelected !== null) {
      // Connect activeLeftSelected to rightIdx
      const updated = { ...matches };
      // Remove any existing connection to this right item
      Object.keys(updated).forEach((k) => {
        if (updated[Number(k)] === rightIdx) delete updated[Number(k)];
      });
      updated[activeLeftSelected] = rightIdx;
      setMatches(updated);
      setActiveLeftSelected(null);

      // Report payload to parent with both index mapping and text pairs
      const textPairs: Record<string, string> = {};
      Object.entries(updated).forEach(([lIdx, rIdx]) => {
        const leftItem = originalPairs[Number(lIdx)];
        const rightItem = shuffledRightItems[rIdx];
        if (leftItem && rightItem) {
          textPairs[leftItem.left] = rightItem.text;
        }
      });
      onSelectAnswer({ ...updated, ...textPairs, mapping: updated, pairs: textPairs });
    } else {
      // If student clicks right first and already has a match, disconnect it
      const connectedLeft = Object.keys(matches).find((k) => matches[Number(k)] === rightIdx);
      if (connectedLeft !== undefined) {
        const updated = { ...matches };
        delete updated[Number(connectedLeft)];
        setMatches(updated);

        const textPairs: Record<string, string> = {};
        Object.entries(updated).forEach(([lIdx, rIdx]) => {
          const leftItem = originalPairs[Number(lIdx)];
          const rightItem = shuffledRightItems[rIdx];
          if (leftItem && rightItem) {
            textPairs[leftItem.left] = rightItem.text;
          }
        });
        onSelectAnswer({ ...updated, ...textPairs, mapping: updated, pairs: textPairs });
      }
    }
  };

  // Reset Matches
  const handleReset = () => {
    if (disabled || isConfirmed) return;
    setMatches({});
    setActiveLeftSelected(null);
    onSelectAnswer({});
  };

  // Check whether all pairs are matched
  const allMatched = originalPairs.length > 0 && Object.keys(matches).length >= originalPairs.length;

  // Evaluate correctness on submit
  const handleEvaluateSubmit = () => {
    if (!allMatched || disabled) return;
    if (onConfirmAnswer) {
      onConfirmAnswer(matches);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Clean Student Matching Header (Task 1 & 5: No debug badges or style tabs) */}
      <div className="flex items-center justify-between gap-3 p-3 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
            <Shuffle className="w-4 h-4" />
          </span>
          <span className="font-extrabold text-slate-800 dark:text-slate-100">
            বাম পাশের কার্ডে ক্লিক করে ডান পাশের সংশ্লিষ্ট কার্ডে ক্লিক করে জোড়া মিলান
          </span>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={disabled || isConfirmed || Object.keys(matches).length === 0}
          className="px-2.5 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer transition flex items-center gap-1.5 font-bold text-[11px]"
          title="সব মিল রিসেট করুন"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>রিসেট</span>
        </button>
      </div>

      {/* STRICTLY LOCKED: INTERACTIVE SVG CROSS-LINE CANVAS (Task 2) */}
      <div
        ref={containerRef}
        className="relative w-full p-4 sm:p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/80 rounded-3xl border-2 border-cyan-500/40 shadow-xl overflow-hidden min-h-[380px]"
      >
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* Interactive SVG Lines Overlay (Isolated Memoized Component) */}
        <SvgLineCanvas lineCoords={lineCoords} />

        {/* Columns Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-8 sm:gap-16 items-start">
          {/* Left Column (A, B, C...) */}
          <div className="space-y-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 block px-1">
              বাম কলাম (Left Column)
            </span>
            {originalPairs.map((pair, leftIdx) => {
              const matchedRightIdx = matches[leftIdx];
              const isMatched = matchedRightIdx !== undefined;
              const isSelected = activeLeftSelected === leftIdx;
              const pairColor = PAIR_COLORS[leftIdx % PAIR_COLORS.length];

              // Universal Green / Red feedback (Task 4)
              let universalContainer = "";
              let statusIcon: "correct" | "incorrect" | null = null;
              if (isConfirmed && isMatched) {
                const isPairCorrect = shuffledRightItems[matchedRightIdx]?.origIndex === leftIdx;
                if (isPairCorrect) {
                  universalContainer =
                    "!bg-emerald-500/20 dark:!bg-emerald-500/30 !border-emerald-500 !text-emerald-100 ring-2 ring-emerald-500";
                  statusIcon = "correct";
                } else {
                  universalContainer =
                    "!bg-rose-500/20 dark:!bg-rose-500/30 !border-rose-500 !text-rose-100 ring-2 ring-rose-500";
                  statusIcon = "incorrect";
                }
              }

              return (
                <div
                  key={leftIdx}
                  onClick={() => handleLeftClick(leftIdx)}
                  className={`relative p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    universalContainer
                      ? universalContainer
                      : isSelected
                      ? "!bg-indigo-500/20 !border-indigo-400 ring-2 ring-indigo-400 scale-[1.02]"
                      : isMatched
                      ? "bg-slate-900/90 border-slate-700 hover:border-cyan-500/60"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        statusIcon === "correct"
                          ? "!bg-emerald-500 text-white"
                          : statusIcon === "incorrect"
                          ? "!bg-rose-500 text-white"
                          : isMatched
                          ? pairColor.bg + " text-slate-950"
                          : "bg-slate-800 text-cyan-400"
                      }`}
                    >
                      {statusIcon === "correct" ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : statusIcon === "incorrect" ? (
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        String.fromCharCode(65 + leftIdx)
                      )}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white break-words leading-snug">
                      {pair.left}
                    </span>
                  </div>

                  {/* Connector Port Dot on Right Edge */}
                  <div
                    ref={(el) => {
                      leftPortRefs.current[leftIdx] = el;
                    }}
                    className={`w-4 h-4 rounded-full border-2 transition-transform shrink-0 ${
                      statusIcon === "correct"
                        ? "border-emerald-500 bg-emerald-400 scale-125"
                        : statusIcon === "incorrect"
                        ? "border-rose-500 bg-rose-400 scale-125"
                        : isMatched
                        ? `${pairColor.border} bg-white scale-125 shadow-md`
                        : isSelected
                        ? "border-cyan-400 bg-cyan-400 animate-ping"
                        : "border-slate-600 bg-slate-900"
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Right Column (1, 2, 3...) */}
          <div className="space-y-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 block px-1 text-right">
              ডান কলাম (Right Column)
            </span>
            {shuffledRightItems.map((rightItem, rightIdx) => {
              const connectedLeftKey = Object.keys(matches).find(
                (k) => matches[Number(k)] === rightIdx
              );
              const isMatched = connectedLeftKey !== undefined;
              const leftIdx = isMatched ? Number(connectedLeftKey) : null;
              const pairColor =
                leftIdx !== null ? PAIR_COLORS[leftIdx % PAIR_COLORS.length] : null;

              // Universal Green / Red feedback (Task 4)
              let universalContainer = "";
              let statusIcon: "correct" | "incorrect" | null = null;
              if (isConfirmed && isMatched && leftIdx !== null) {
                const isPairCorrect = rightItem.origIndex === leftIdx;
                if (isPairCorrect) {
                  universalContainer =
                    "!bg-emerald-500/20 dark:!bg-emerald-500/30 !border-emerald-500 !text-emerald-100 ring-2 ring-emerald-500";
                  statusIcon = "correct";
                } else {
                  universalContainer =
                    "!bg-rose-500/20 dark:!bg-rose-500/30 !border-rose-500 !text-rose-100 ring-2 ring-rose-500";
                  statusIcon = "incorrect";
                }
              }

              return (
                <div
                  key={rightItem.id}
                  onClick={() => handleRightClick(rightIdx)}
                  className={`relative p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    universalContainer
                      ? universalContainer
                      : isMatched
                      ? "bg-slate-900/90 border-purple-500/70 shadow-sm md:shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                      : "bg-slate-900/60 border-slate-800 hover:border-purple-400/50"
                  }`}
                >
                  {/* Connector Port Dot on Left Edge */}
                  <div
                    ref={(el) => {
                      rightPortRefs.current[rightIdx] = el;
                    }}
                    className={`w-4 h-4 rounded-full border-2 transition-transform shrink-0 ${
                      statusIcon === "correct"
                        ? "border-emerald-500 bg-emerald-400 scale-125"
                        : statusIcon === "incorrect"
                        ? "border-rose-500 bg-rose-400 scale-125"
                        : isMatched && pairColor
                        ? `${pairColor.border} bg-white scale-125 shadow-md`
                        : "border-slate-600 bg-slate-900"
                    }`}
                  />

                  <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-end text-right">
                    <span className="text-xs sm:text-sm font-bold text-white break-words leading-snug">
                      {rightItem.text}
                    </span>
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        statusIcon === "correct"
                          ? "!bg-emerald-500 text-white"
                          : statusIcon === "incorrect"
                          ? "!bg-rose-500 text-white"
                          : isMatched && pairColor
                          ? pairColor.bg + " text-slate-950"
                          : "bg-slate-800 text-purple-400"
                      }`}
                    >
                      {statusIcon === "correct" ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : statusIcon === "incorrect" ? (
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        rightIdx + 1
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress & Submit Action Bar */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">
          {allMatched ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>সবগুলো ({originalPairs.length} টি) জোড়া মিলানো সম্পন্ন হয়েছে!</span>
            </span>
          ) : (
            <span>
              অগ্রগতি: {Object.keys(matches).length} / {originalPairs.length} জোড়া মিলানো হয়েছে
            </span>
          )}
        </div>

        {onConfirmAnswer && !isConfirmed && (
          <button
            type="button"
            disabled={!allMatched || disabled}
            onClick={handleEvaluateSubmit}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              allMatched
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 active:scale-95"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50"
            }`}
          >
            <Check className="w-4 h-4" />
            <span>উত্তর যাচাই করুন (Submit)</span>
          </button>
        )}
      </div>

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
              <span>চমৎকার! আপনার সবগুলো মিলকরণ সঠিক হয়েছে।</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>কিছু জোড়া ভুল হয়েছে। সঠিক উত্তর পর্যালোচনা করুন।</span>
            </>
          )}
        </div>
      )}
    </div>
  );
});

export default MatchingBoardTemplates;
