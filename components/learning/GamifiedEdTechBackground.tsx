"use client";

import React, { useId } from "react";
import {
  Zap,
  Rocket,
  Trophy,
  Cpu,
  Lightbulb,
  Compass,
  Sparkles,
  Flame,
  Target,
  Award,
  HelpCircle,
  Atom,
  CheckCircle2,
} from "lucide-react";

interface GamifiedEdTechBackgroundProps {
  variant?: "roadmap" | "lesson" | "subject" | "compact";
  showGadgets?: boolean;
  showQuizFormulas?: boolean;
  className?: string;
}

export default function GamifiedEdTechBackground({
  variant = "roadmap",
  showGadgets = true,
  showQuizFormulas = true,
  className = "",
}: GamifiedEdTechBackgroundProps) {
  const uniqueId = useId().replace(/:/g, "");

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden z-0 ${className}`}
      aria-hidden="true"
    >
      {/* 1. AMBIENT GLOWING ENERGY BLOBS (GPU ACCELERATED) */}
      <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-cyan-500/12 dark:bg-cyan-500/20 blur-[90px] animate-pulse" />
      <div
        className="absolute top-1/4 -right-24 w-96 h-96 rounded-full bg-indigo-500/12 dark:bg-indigo-600/20 blur-[100px] animate-pulse"
        style={{ animationDelay: "2s", animationDuration: "7s" }}
      />
      <div
        className="absolute top-2/3 -left-20 w-88 h-88 rounded-full bg-purple-500/10 dark:bg-purple-600/18 blur-[95px] animate-pulse"
        style={{ animationDelay: "4s", animationDuration: "8s" }}
      />
      <div
        className="absolute -bottom-20 right-1/4 w-80 h-80 rounded-full bg-emerald-500/10 dark:bg-emerald-500/18 blur-[85px] animate-pulse"
        style={{ animationDelay: "1s", animationDuration: "6s" }}
      />

      {/* 2. SOFT GLOWING ENERGY GRID (SVG Isometric & Matrix Dots Pattern) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40 dark:opacity-50"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Cyber Dot Pattern */}
          <pattern
            id={`cyber-dots-${uniqueId}`}
            x="0"
            y="0"
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="18"
              cy="18"
              r="1.2"
              className="fill-cyan-600/25 dark:fill-cyan-400/35"
            />
          </pattern>

          {/* Luminous Energy Grid Lines Pattern */}
          <pattern
            id={`energy-grid-${uniqueId}`}
            x="0"
            y="0"
            width="72"
            height="72"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 72 0 L 0 0 0 72"
              fill="none"
              strokeWidth="0.75"
              className="stroke-indigo-400/15 dark:stroke-indigo-400/20"
            />
          </pattern>

          {/* Flowing Laser Gradients */}
          <linearGradient id={`laser-h-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>

          <linearGradient id={`laser-v-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Fill with Matrix Dots & Grid */}
        <rect width="100%" height="100%" fill={`url(#cyber-dots-${uniqueId})`} />
        <rect width="100%" height="100%" fill={`url(#energy-grid-${uniqueId})`} />

        {/* Floating Animated Horizon Energy Beams */}
        <line
          x1="0"
          y1="18%"
          x2="100%"
          y2="18%"
          stroke={`url(#laser-h-${uniqueId})`}
          strokeWidth="1.2"
          strokeDasharray="180 320"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-1000"
            dur="24s"
            repeatCount="indefinite"
          />
        </line>
        <line
          x1="0"
          y1="54%"
          x2="100%"
          y2="54%"
          stroke={`url(#laser-h-${uniqueId})`}
          strokeWidth="1"
          strokeDasharray="140 280"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="-500"
            to="500"
            dur="28s"
            repeatCount="indefinite"
          />
        </line>
        <line
          x1="0"
          y1="82%"
          x2="100%"
          y2="82%"
          stroke={`url(#laser-h-${uniqueId})`}
          strokeWidth="1"
          strokeDasharray="160 300"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-1000"
            dur="32s"
            repeatCount="indefinite"
          />
        </line>
      </svg>

      {/* 3. INTERACTIVE QUIZ & EDTECH FORMULAS PATTERN */}
      {showQuizFormulas && (
        <div className="absolute inset-0 overflow-hidden font-mono text-[11px] font-black">
          {/* Ohm's Law formula */}
          <div
            className="absolute top-16 left-8 sm:left-16 text-cyan-600/30 dark:text-cyan-400/30 tracking-widest rotate-[-8deg] animate-pulse"
            style={{ animationDuration: "6s" }}
          >
            V = I × R
          </div>

          {/* Sigma Summation Symbol */}
          <div
            className="absolute top-36 right-10 sm:right-20 text-3xl font-serif text-indigo-500/20 dark:text-indigo-400/25 rotate-[12deg] animate-pulse"
            style={{ animationDuration: "7s" }}
          >
            ∑
          </div>

          {/* Ohm Symbol (Ω) */}
          <div
            className="absolute top-1/3 left-12 text-4xl text-amber-500/20 dark:text-amber-400/25 rotate-[-15deg] animate-pulse"
            style={{ animationDuration: "8s" }}
          >
            Ω
          </div>

          {/* Quiz Question Pill */}
          <div className="absolute top-[48%] right-8 sm:right-28 px-2 py-0.5 rounded-full bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 text-purple-600/40 dark:text-purple-300/40 text-[10px] font-sans font-bold rotate-[6deg]">
            ? কুইজ চ্যালেঞ্জ
          </div>

          {/* Electric Power Formula */}
          <div
            className="absolute top-[68%] left-6 sm:left-24 text-emerald-600/30 dark:text-emerald-400/30 tracking-wider rotate-[5deg] animate-pulse"
            style={{ animationDuration: "6.5s" }}
          >
            P = V × I
          </div>

          {/* Lambda Wavelength */}
          <div className="absolute top-[78%] right-12 text-3xl font-serif text-rose-500/20 dark:text-rose-400/25 rotate-[-10deg]">
            λ
          </div>

          {/* XP Reward Badge Watermark */}
          <div className="absolute bottom-12 left-1/3 px-2.5 py-0.5 rounded-md bg-amber-400/10 dark:bg-amber-400/15 text-amber-600/40 dark:text-amber-400/40 text-[10px] font-mono font-black border border-amber-400/20 rotate-[-3deg]">
            ⚡ +100 XP
          </div>
        </div>
      )}

      {/* 4. FLOATING GADGET & GAMIFIED EDTECH ICONS */}
      {showGadgets && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Microchip / CPU Gadget */}
          <div
            className="absolute top-20 right-[15%] p-2 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-cyan-400/30 dark:border-cyan-500/40 shadow-sm dark:shadow-[0_0_15px_rgba(6,182,212,0.25)] text-cyan-600 dark:text-cyan-400 animate-bounce"
            style={{ animationDuration: "5.5s" }}
          >
            <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          {/* Rocket Start Gadget */}
          <div
            className="absolute top-1/4 left-[8%] p-2 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-amber-400/30 dark:border-amber-500/40 shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.25)] text-amber-500 dark:text-amber-400 animate-bounce"
            style={{ animationDuration: "6.5s", animationDelay: "1s" }}
          >
            <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          {/* Electric Zap Gadget */}
          <div
            className="absolute top-[42%] right-[6%] p-2 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-yellow-400/30 dark:border-yellow-500/40 shadow-sm dark:shadow-[0_0_15px_rgba(234,179,8,0.25)] text-yellow-500 dark:text-yellow-300 animate-bounce"
            style={{ animationDuration: "5s", animationDelay: "2s" }}
          >
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          {/* Idea Lightbulb Gadget */}
          <div
            className="absolute top-[62%] left-[10%] p-2 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-emerald-400/30 dark:border-emerald-500/40 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.25)] text-emerald-600 dark:text-emerald-400 animate-bounce"
            style={{ animationDuration: "6s", animationDelay: "1.5s" }}
          >
            <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          {/* Grand Trophy Gadget */}
          <div
            className="absolute bottom-28 right-[18%] p-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-purple-400/30 dark:border-purple-500/40 shadow-sm dark:shadow-[0_0_15px_rgba(168,85,247,0.25)] text-purple-600 dark:text-purple-400 animate-bounce"
            style={{ animationDuration: "7s", animationDelay: "0.5s" }}
          >
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          {/* Target Milestone Gadget */}
          <div
            className="absolute bottom-20 left-[18%] p-2 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-rose-400/30 dark:border-rose-500/40 shadow-sm dark:shadow-[0_0_15px_rgba(244,63,94,0.25)] text-rose-500 dark:text-rose-400 animate-bounce"
            style={{ animationDuration: "5.8s", animationDelay: "2.5s" }}
          >
            <Target className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      )}
    </div>
  );
}
