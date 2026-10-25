"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { QuizTemplateProps } from "./types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  GripVertical,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Sparkles,
  GitBranch,
  Radio,
  Check,
  X,
  Zap,
} from "lucide-react";
import { motion, Reorder } from "framer-motion";

interface ConnectorLine {
  id: string;
  path: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
}

export const NodeConnectedTemplate: React.FC<QuizTemplateProps> = ({
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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const questionCardRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [connectors, setConnectors] = useState<ConnectorLine[]>([]);

  // =========================================================================
  // MATCHING & REORDER DATA STATES
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

  // =========================================================================
  // DYNAMIC SVG CONNECTOR PATH CALCULATOR
  // Calculates exact cubic bezier curves from Question port to Option ports
  // =========================================================================
  const recalculateConnectors = useCallback(() => {
    if (!containerRef.current || !questionCardRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const qRect = questionCardRef.current.getBoundingClientRect();

    // Question Card Source Port: Bottom-Center
    const startX = qRect.left + qRect.width / 2 - containerRect.left;
    const startY = qRect.bottom - containerRect.top;

    const newConnectors: ConnectorLine[] = [];
    const colors = ["#06b6d4", "#a855f7", "#ec4899", "#3b82f6"];

    optionRefs.current.forEach((optEl, idx) => {
      if (!optEl) return;
      const optRect = optEl.getBoundingClientRect();

      // Option Destination Port: Top-Center
      const endX = optRect.left + optRect.width / 2 - containerRect.left;
      const endY = optRect.top - containerRect.top;

      // Cubic Bezier curve with vertical tangents
      const deltaY = endY - startY;
      const cp1X = startX;
      const cp1Y = startY + deltaY * 0.45;
      const cp2X = endX;
      const cp2Y = endY - deltaY * 0.45;

      const path = `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${cp1X.toFixed(1)} ${cp1Y.toFixed(1)}, ${cp2X.toFixed(1)} ${cp2Y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;

      newConnectors.push({
        id: `conn-${idx}`,
        path,
        startX,
        startY,
        endX,
        endY,
        color: colors[idx % colors.length],
      });
    });

    setConnectors(newConnectors);
  }, []);

  useEffect(() => {
    // Initial recalculation after mount and next animation frames
    const timer1 = setTimeout(recalculateConnectors, 50);
    const timer2 = setTimeout(recalculateConnectors, 250);

    const observer = new ResizeObserver(() => {
      recalculateConnectors();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener("resize", recalculateConnectors);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      observer.disconnect();
      window.removeEventListener("resize", recalculateConnectors);
    };
  }, [recalculateConnectors, question.id, qType]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-[32px] p-4 sm:p-8 overflow-hidden transition-all duration-500 min-h-[560px] bg-[#0c1222] text-slate-100 border border-cyan-500/30 shadow-[0_20px_60px_rgba(6,182,212,0.15)]"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 0%, rgba(6,182,212,0.18) 0%, transparent 60%),
          radial-gradient(circle at 10% 90%, rgba(168,85,247,0.14) 0%, transparent 50%),
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 100% 100%, 36px 36px, 36px 36px",
      }}
    >
      {/* ===================================================================== */}
      {/* SVG CONNECTOR LAYER: Real Bezier lines branching from question to opts */}
      {/* ===================================================================== */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
        style={{ filter: "drop-shadow(0 0 6px rgba(6,182,212,0.6))" }}
      >
        <defs>
          <linearGradient id="nodeLineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.9" />
          </linearGradient>

          <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {connectors.map((conn, idx) => (
          <g key={conn.id}>
            {/* Background wider glow track */}
            <motion.path
              d={conn.path}
              fill="none"
              stroke={conn.color}
              strokeWidth="6"
              strokeOpacity="0.18"
              strokeLinecap="round"
            />

            {/* Main animated connecting line */}
            <motion.path
              d={conn.path}
              fill="none"
              stroke="url(#nodeLineGrad)"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 0.85,
                delay: idx * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
            />

            {/* Origin Pin on Question Card */}
            <circle
              cx={conn.startX}
              cy={conn.startY}
              r="4.5"
              fill="#06b6d4"
              filter="url(#nodeGlow)"
            />
            <circle cx={conn.startX} cy={conn.startY} r="8" fill="none" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.5" />

            {/* Destination Pin on Option Card */}
            <circle
              cx={conn.endX}
              cy={conn.endY}
              r="4.5"
              fill={conn.color}
              filter="url(#nodeGlow)"
            />
          </g>
        ))}
      </svg>

      {/* Top Controls & Node Network Status Bar */}
      <div className="relative z-10 flex items-center justify-between mb-4 pb-3 border-b border-cyan-500/20 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-extrabold text-cyan-400 tracking-wider flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" /> CONNECTED NODE TOPOLOGY
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold">
            NODE {questionIndex + 1} OF {totalQuestions}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
            ⚡ {question.marks || 1} MARKS
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TOP: QUESTION CARD NODE (Central Root Source)                          */}
      {/* ===================================================================== */}
      <div className="relative z-10 max-w-2xl mx-auto mb-10 sm:mb-14">
        <div
          ref={questionCardRef}
          className="relative bg-slate-900/90 backdrop-blur-xl border-2 border-cyan-400/50 rounded-2xl p-6 sm:p-8 text-center shadow-[0_10px_35px_rgba(6,182,212,0.25)]"
        >
          {/* Header Node Icon */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-cyan-500 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-md shadow-cyan-500/40 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>ROOT QUESTION NODE</span>
          </div>

          <h2 className="mt-2 text-base sm:text-xl font-black text-white leading-snug tracking-tight">
            {question.questionText}
          </h2>

          {/* Bottom Root Connection Socket */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.8)]">
            <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BOTTOM: OPTION NODES (MCQ, TRUE_FALSE, MATCHING, REORDER, FILL_BLANK) */}
      {/* ===================================================================== */}
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* 1. MCQ: 2x2 Connected Grid */}
        {qType === "MCQ" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctOptionIndex;

              let cardBg = "bg-slate-900/80 hover:bg-slate-850/90 border-slate-700/80 hover:border-cyan-400/60";
              let badgeBg = "bg-slate-800 text-cyan-300 border border-cyan-500/30";

              if (isSelected) {
                cardBg = "bg-cyan-950/70 border-cyan-400 text-cyan-100 ring-2 ring-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]";
                badgeBg = "bg-cyan-400 text-slate-950 font-black shadow-md shadow-cyan-400/50";
              }

              if (isConfirmed) {
                if (isCorrectOption) {
                  cardBg = "bg-emerald-950/80 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.4)]";
                  badgeBg = "bg-emerald-400 text-slate-950 font-black";
                } else if (isSelected && !isCorrectOption) {
                  cardBg = "bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.4)]";
                  badgeBg = "bg-rose-500 text-white font-black";
                }
              }

              return (
                <div
                  key={idx}
                  ref={(el) => {
                    optionRefs.current[idx] = el;
                  }}
                  className="relative group"
                >
                  {/* Top Target Pin Socket */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-950 border border-cyan-400/70 z-10 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  </div>

                  <button
                    type="button"
                    disabled={disabled || isConfirmed}
                    onClick={() => onSelectAnswer(idx)}
                    className={`w-full p-4 sm:p-5 rounded-2xl border-2 backdrop-blur-md transition-all duration-300 flex items-center justify-between gap-3 text-left ${
                      !isConfirmed && !disabled
                        ? "cursor-pointer hover:-translate-y-1 active:scale-98"
                        : "cursor-default"
                    } ${cardBg}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 transition-transform group-hover:scale-110 ${badgeBg}`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold leading-relaxed">
                        {opt}
                      </span>
                    </div>

                    {isConfirmed && (
                      <div className="shrink-0">
                        {isCorrectOption ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
                        ) : isSelected ? (
                          <XCircle className="w-5 h-5 text-rose-400" />
                        ) : null}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. TRUE_FALSE: Dual Branching Node Cards */}
        {qType === "TRUE_FALSE" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: "সত্য (True)", value: true, bValue: "true", color: "emerald", symbol: "✓", code: "T" },
              { label: "মিথ্যা (False)", value: false, bValue: "false", color: "rose", symbol: "✗", code: "F" },
            ].map((item, idx) => {
              const isSelected =
                selectedAnswer === item.value ||
                selectedAnswer === item.bValue ||
                selectedAnswer === idx;

              const expectedBool =
                question.correctBoolean !== undefined
                  ? question.correctBoolean
                  : question.correctOptionIndex === 0;

              const isCorrectChoice = expectedBool === item.value;

              let cardBg = "bg-slate-900/80 hover:bg-slate-850 border-slate-700/80";
              if (isSelected) {
                cardBg =
                  item.color === "emerald"
                    ? "bg-emerald-950/70 border-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                    : "bg-rose-950/70 border-rose-400 ring-2 ring-rose-400/50 shadow-[0_0_25px_rgba(244,63,94,0.4)]";
              }

              if (isConfirmed) {
                if (isCorrectChoice) {
                  cardBg = "bg-emerald-900/80 border-emerald-400 text-white ring-2 ring-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]";
                } else if (isSelected && !isCorrectChoice) {
                  cardBg = "bg-rose-900/80 border-rose-400 text-white ring-2 ring-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.5)]";
                }
              }

              return (
                <div
                  key={idx}
                  ref={(el) => {
                    optionRefs.current[idx] = el;
                  }}
                  className="relative"
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-950 border border-cyan-400/70 z-10 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  </div>

                  <button
                    type="button"
                    disabled={disabled || isConfirmed}
                    onClick={() => onSelectAnswer(item.value)}
                    className={`w-full p-6 rounded-2xl border-2 backdrop-blur-md transition-all flex items-center justify-between ${
                      !isConfirmed && !disabled
                        ? "cursor-pointer hover:-translate-y-1 active:scale-98"
                        : "cursor-default"
                    } ${cardBg}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-xl font-black flex items-center justify-center">
                        {item.symbol}
                      </span>
                      <div className="text-left">
                        <span className="text-base font-extrabold block text-white">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          NODE PORT // {item.code}
                        </span>
                      </div>
                    </div>

                    {isConfirmed && (
                      <div>
                        {isCorrectChoice ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
                        ) : isSelected ? (
                          <XCircle className="w-6 h-6 text-rose-400" />
                        ) : null}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. MATCHING: Drag & Drop Node Network */}
        {qType === "MATCHING" && (
          <div
            ref={(el) => {
              optionRefs.current[0] = el;
            }}
            className="space-y-3 bg-slate-900/80 p-5 rounded-2xl border border-cyan-500/40"
          >
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              ⇄ DRAG TO MAP MATCHING TOPOLOGY NODES:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">ROOT NODES (FIXED)</span>
                {matchingPairs.map((pair, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-xs font-bold text-cyan-200 flex items-center justify-between">
                    <span>{pair.left}</span>
                    <span className="text-cyan-400 font-mono">──▶</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">TERMINAL NODES (DRAGGABLE)</span>
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
                  className="space-y-2.5"
                >
                  {rightOrder.map((itemVal) => (
                    <Reorder.Item
                      key={itemVal}
                      value={itemVal}
                      dragListener={!disabled && !isConfirmed}
                      className="p-3 rounded-xl bg-purple-950/70 border border-purple-500/40 text-xs font-semibold text-purple-200 flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-purple-400"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-purple-400" />
                        <span>{itemVal}</span>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            </div>
          </div>
        )}

        {/* 4. REORDER: Vertical Serial Sequence Nodes */}
        {qType === "REORDER" && (
          <div
            ref={(el) => {
              optionRefs.current[0] = el;
            }}
            className="space-y-3 bg-slate-900/80 p-5 rounded-2xl border border-cyan-500/40"
          >
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              ⬇ REORDER SEQUENCE NODES (DRAG UP / DOWN):
            </span>
            <Reorder.Group
              axis="y"
              values={reorderState}
              onReorder={(newOrder) => {
                if (disabled || isConfirmed) return;
                setReorderState(newOrder);
                onSelectAnswer(newOrder);
              }}
              className="space-y-2.5"
            >
              {reorderState.map((itemVal, idx) => (
                <Reorder.Item
                  key={itemVal}
                  value={itemVal}
                  dragListener={!disabled && !isConfirmed}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-xs font-semibold text-cyan-100 flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-cyan-400"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-cyan-900/60 border border-cyan-400/50 text-cyan-300 font-mono font-bold text-[11px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{itemVal}</span>
                  </div>
                  <GripVertical className="w-4 h-4 text-cyan-400" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {/* 5. FILL_BLANKS: Center Terminal Input */}
        {qType === "FILL_BLANKS" && (
          <div
            ref={(el) => {
              optionRefs.current[0] = el;
            }}
            className="p-6 rounded-2xl bg-slate-900/90 border-2 border-cyan-400/50 space-y-4 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
          >
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              ⌨ INPUT TERMINAL DATA:
            </span>
            <input
              type="text"
              disabled={disabled || isConfirmed}
              value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="এখানে উত্তর টাইপ করুন..."
              className="w-full p-4 rounded-xl bg-slate-950 border-2 border-cyan-500/60 text-cyan-200 text-sm font-mono focus:border-cyan-400 focus:outline-hidden focus:ring-4 focus:ring-cyan-500/20 shadow-inner"
            />
          </div>
        )}
      </div>

      {/* Explanation Banner */}
      {isConfirmed && question.explanation && (
        <div className="relative z-10 mt-8 p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 text-xs text-slate-300 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-300 font-mono font-bold">NODE EXPLANATION: </strong>
            <span>{question.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeConnectedTemplate;
