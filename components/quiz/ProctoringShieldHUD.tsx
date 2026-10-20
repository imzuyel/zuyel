"use client";

import React from "react";
import { Shield, ShieldAlert, ShieldCheck, Maximize2, Minimize2, AlertTriangle, Lock } from "lucide-react";
import { motion } from "motion/react";

interface ProctoringShieldHUDProps {
  strikes: number;
  maxStrikes?: number;
  isFullscreen: boolean;
  onRequestFullscreen: () => void;
  strictMode?: boolean;
}

export default function ProctoringShieldHUD({
  strikes,
  maxStrikes = 3,
  isFullscreen,
  onRequestFullscreen,
  strictMode = true,
}: ProctoringShieldHUDProps) {
  const isHighRisk = strikes >= 2;
  const isViolated = strikes > 0;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 shadow-lg select-none">
      {/* Security Shield Icon */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
          isHighRisk
            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse shadow-xs shadow-rose-500/40"
            : isViolated
            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
            : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
        }`}
      >
        {isHighRisk ? (
          <ShieldAlert className="w-4 h-4" />
        ) : isViolated ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <ShieldCheck className="w-4 h-4" />
        )}
      </div>

      {/* Proctoring Status Label & Strike Pills */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black tracking-wider uppercase text-slate-300">
            {strictMode ? "প্রক্টর্ড এক্সাম মোড" : "অ্যান্টি-চিট সক্রিয়"}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isHighRisk ? "bg-rose-400 animate-ping" : "bg-emerald-400 animate-pulse"
            }`}
          />
        </div>

        {/* Warning Strikes Indicator */}
        <div className="flex items-center gap-1 mt-0.5">
          {Array.from({ length: maxStrikes }).map((_, idx) => {
            const isFilled = idx < strikes;
            return (
              <span
                key={idx}
                className={`w-2.5 h-1.5 rounded-xs transition-all ${
                  isFilled
                    ? idx === maxStrikes - 1
                      ? "bg-rose-500 shadow-xs shadow-rose-500/60 animate-pulse"
                      : "bg-amber-400 shadow-xs shadow-amber-400/40"
                    : "bg-slate-850 dark:bg-slate-700/80 border border-slate-600/40"
                }`}
                title={`Strike ${idx + 1}`}
              />
            );
          })}
          <span className="text-[9px] font-mono font-bold text-slate-400 ml-1">
            {strikes}/{maxStrikes} সতর্কতা
          </span>
        </div>
      </div>

      {/* Fullscreen Trigger */}
      {!isFullscreen && (
        <button
          type="button"
          onClick={onRequestFullscreen}
          className="ml-1.5 p-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
          title="ফুলস্ক্রিন মোড চালু করুন"
        >
          <Maximize2 className="w-3 h-3" />
          <span className="hidden sm:inline">ফুলস্ক্রিন</span>
        </button>
      )}
    </div>
  );
}
