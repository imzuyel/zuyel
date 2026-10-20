"use client";

import React from "react";

interface AnimatedGearsProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  animate?: boolean;
}

export default function AnimatedGears({
  size = "md",
  className = "",
  animate = true,
}: AnimatedGearsProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-14 h-14",
    lg: "w-24 h-24",
  };

  const spinClass = animate ? "animate-[spin_16s_linear_infinite]" : "";
  const reverseSpinClass = animate ? "animate-[spin_10s_linear_infinite_reverse]" : "";

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      aria-hidden="true"
    >
      {/* Primary Outer Gear (Clockwise rotation) */}
      <svg
        className={`${sizeMap[size]} text-indigo-500 will-change-transform motion-reduce:animate-none ${spinClass}`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g stroke="currentColor" strokeWidth="2">
          {/* 12 Outer Teeth */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <rect
              key={deg}
              x="45"
              y="2"
              width="10"
              height="14"
              rx="2"
              fill="currentColor"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
          {/* Main Gear Ring */}
          <circle cx="50" cy="50" r="38" fill="currentColor" fillOpacity="0.12" />
          <circle cx="50" cy="50" r="34" strokeDasharray="4 2" />
          {/* 4 Spokes */}
          <line x1="50" y1="18" x2="50" y2="82" strokeWidth="2.5" />
          <line x1="18" y1="50" x2="82" y2="50" strokeWidth="2.5" />
          {/* Center Hub */}
          <circle cx="50" cy="50" r="16" fill="currentColor" fillOpacity="0.3" />
          <circle cx="50" cy="50" r="8" fill="white" className="dark:fill-slate-900" />
        </g>
      </svg>

      {/* Secondary Intermeshing Gear (Counter-clockwise rotation) */}
      <svg
        className={`absolute -bottom-2 -right-3 w-8 h-8 text-amber-500 will-change-transform motion-reduce:animate-none ${reverseSpinClass}`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g stroke="currentColor" strokeWidth="2.5">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect
              key={deg}
              x="44"
              y="4"
              width="12"
              height="14"
              rx="2"
              fill="currentColor"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="36" fill="currentColor" fillOpacity="0.15" />
          <circle cx="50" cy="50" r="14" fill="white" className="dark:fill-slate-900" />
        </g>
      </svg>
    </div>
  );
}
