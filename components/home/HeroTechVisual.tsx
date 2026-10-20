"use client";

import React from "react";
import { motion } from "motion/react";

export default function HeroTechVisual() {
  return (
    <div className="relative w-full aspect-square max-w-[260px] sm:max-w-[340px] lg:max-w-[420px] mx-auto flex items-center justify-center pointer-events-none select-none">
      {/* Outer ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-indigo-500/15 to-purple-500/20 rounded-full blur-3xl animate-pulse" />

      {/* SVG Technical Diagram & Circuit Architecture */}
      <svg
        className="w-full h-full relative z-10"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Tech Ring */}
        <circle
          cx="200"
          cy="200"
          r="170"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 8"
          className="text-cyan-500/30"
        />

        {/* Counter-rotating Tech Ring */}
        <circle
          cx="200"
          cy="200"
          r="140"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="12 12"
          className="text-indigo-500/40"
        />

        {/* Cardinal Grid Axis Lines */}
        <line x1="200" y1="20" x2="200" y2="380" stroke="currentColor" strokeWidth="1" className="text-slate-700 dark:text-slate-300/40" strokeDasharray="3 3" />
        <line x1="20" y1="200" x2="380" y2="200" stroke="currentColor" strokeWidth="1" className="text-slate-700 dark:text-slate-300/40" strokeDasharray="3 3" />

        {/* Diagonal Circuit Paths */}
        <path
          d="M 100 100 L 150 150 L 150 200 L 200 200"
          stroke="currentColor"
          strokeWidth="2"
          className="text-cyan-400"
        />
        <circle cx="100" cy="100" r="4" fill="#06b6d4" />
        <circle cx="150" cy="150" r="3" fill="#06b6d4" />

        <path
          d="M 300 100 L 250 150 L 250 200 L 200 200"
          stroke="currentColor"
          strokeWidth="2"
          className="text-indigo-400"
        />
        <circle cx="300" cy="100" r="4" fill="#6366f1" />
        <circle cx="250" cy="150" r="3" fill="#6366f1" />

        <path
          d="M 100 300 L 150 250 L 200 250 L 200 200"
          stroke="currentColor"
          strokeWidth="2"
          className="text-emerald-400"
        />
        <circle cx="100" cy="300" r="4" fill="#10b981" />
        <circle cx="150" cy="250" r="3" fill="#10b981" />

        <path
          d="M 300 300 L 250 250 L 200 250 L 200 200"
          stroke="currentColor"
          strokeWidth="2"
          className="text-amber-400"
        />
        <circle cx="300" cy="300" r="4" fill="#f59e0b" />
        <circle cx="250" cy="250" r="3" fill="#f59e0b" />

        {/* Central Core Hexagon */}
        <polygon
          points="200,140 252,170 252,230 200,260 148,230 148,170"
          fill="url(#coreGradient)"
          stroke="#06b6d4"
          strokeWidth="2"
          className="filter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
        />

        {/* Central Educational Symbol */}
        <text
          x="200"
          y="208"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="24"
          fontFamily="monospace"
          fontWeight="bold"
        >
          PTSC
        </text>
        <text
          x="200"
          y="226"
          textAnchor="middle"
          fill="#06b6d4"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          EIIN 132244
        </text>

        {/* Core Radial Gradient Def */}
        <defs>
          <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
