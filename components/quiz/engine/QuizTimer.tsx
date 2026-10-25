"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock, Flame } from "lucide-react";

export interface QuizTimerProps {
  initialSeconds: number;
  onExpire?: () => void;
  isPaused?: boolean;
  timerStyle?: "circular" | "terminal" | "marquee" | "pill" | "minimal" | "stadium" | "bar" | string;
  timerColor?: string;
  className?: string;
}

/**
 * Isolated QuizTimer component.
 * Ensures 1-second interval ticks ONLY re-render this isolated component,
 * preventing expensive re-renders of the parent quiz page, templates, and SVG canvas.
 */
export const QuizTimer = React.memo(function QuizTimer({
  initialSeconds,
  onExpire,
  isPaused = false,
  timerStyle = "circular",
  timerColor = "stroke-cyan-500",
  className = "",
}: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Reset when initialSeconds changes (e.g. new question)
  useEffect(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  // Isolated countdown timer interval
  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          if (onExpireRef.current) {
            onExpireRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isPaused, initialSeconds]);

  const pct = Math.max(0, Math.min(100, (timeLeft / (initialSeconds || 30)) * 100));
  const isUrgent = timeLeft <= 7;

  switch (timerStyle) {
    case "circular": {
      const radius = 15;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (pct / 100) * circumference;
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <div className="relative w-9 h-9 flex items-center justify-center">
            <svg className="w-9 h-9 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r={radius}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="3"
                fill="transparent"
              />
              <circle
                cx="18"
                cy="18"
                r={radius}
                className={`${
                  isUrgent ? "stroke-rose-500 animate-pulse" : timerColor
                } transition-all duration-300`}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span
              className={`absolute text-xs font-black font-mono ${
                isUrgent ? "text-rose-500 animate-pulse" : "text-slate-800 dark:text-slate-200"
              }`}
            >
              {timeLeft}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">
            সেকেন্ড
          </span>
        </div>
      );
    }

    case "terminal": {
      return (
        <div
          className={`px-3 py-1.5 rounded-lg bg-black/90 border border-emerald-500/50 font-mono text-xs flex items-center gap-2 shadow-inner ${className}`}
        >
          <span className="text-emerald-400 font-bold animate-pulse">●</span>
          <span className="text-emerald-300">
            SYS_TIME:[
            <strong className={isUrgent ? "text-rose-400" : "text-emerald-400"}>
              {String(timeLeft).padStart(2, "0")}s
            </strong>
            ]
          </span>
        </div>
      );
    }

    case "marquee": {
      return (
        <div
          className={`px-2.5 py-1 rounded bg-yellow-400 text-slate-950 font-mono font-bold text-xs border border-black flex items-center gap-1.5 ${className}`}
        >
          <span>⏱ সময়</span>
          <span className="px-1.5 py-0.5 bg-black text-yellow-400 rounded">
            {String(timeLeft).padStart(2, "0")}s
          </span>
        </div>
      );
    }

    case "pill": {
      return (
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border shadow-xs transition-colors ${
            isUrgent
              ? "bg-rose-50 dark:bg-rose-950/80 border-rose-300 text-rose-600 animate-pulse"
              : "bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          } ${className}`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">{timeLeft}s বাকি</span>
        </div>
      );
    }

    case "minimal": {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <span className="text-[11px] text-slate-400 font-mono">সময়:</span>
          <span
            className={`font-mono text-sm font-bold ${
              isUrgent ? "text-rose-500 font-black animate-pulse" : "text-slate-700 dark:text-slate-200"
            }`}
          >
            {timeLeft}s
          </span>
        </div>
      );
    }

    case "stadium": {
      return (
        <div
          className={`px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5 ${className}`}
        >
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span className="font-mono">{timeLeft}s বাকি</span>
        </div>
      );
    }

    case "bar":
    default: {
      return (
        <div className={`w-24 sm:w-32 space-y-1 ${className}`}>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-500 dark:text-slate-400 font-bold">টাইমার</span>
            <span
              className={
                isUrgent
                  ? "text-rose-500 font-black"
                  : "text-slate-700 dark:text-slate-300 font-bold"
              }
            >
              {timeLeft}s
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isUrgent ? "bg-rose-500 animate-pulse" : timerColor.replace("stroke-", "bg-")
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    }
  }
});

export default QuizTimer;
