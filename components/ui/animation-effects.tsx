"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "motion/react";
import type { LucideIcon } from "lucide-react";

// Types
export type GlowVariant =
  | "indigo"
  | "emerald"
  | "purple"
  | "amber"
  | "cyan"
  | "rose"
  | "teal"
  | "blue"
  | "multi"
  | "neon";
export type GlowIntensity = "soft" | "medium" | "strong" | "highlight";

const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
function toBengaliNumber(numStr: string): string {
  return numStr.replace(/\d/g, (d) => BENGALI_DIGITS[parseInt(d, 10)] || d);
}

// 1. GlowCard Component
interface GlowCardProps {
  children: React.ReactNode;
  variant?: GlowVariant;
  intensity?: GlowIntensity;
  hoverEffect?: boolean;
  className?: string;
  onClick?: () => void;
  animatedBorder?: boolean | "hover" | "always" | "pulse";
  shineSweep?: boolean;
}

export function GlowCard({
  children,
  variant = "indigo",
  intensity = "soft",
  hoverEffect = true,
  className = "",
  onClick,
  animatedBorder = false,
  shineSweep = false,
}: GlowCardProps) {
  const glowMap: Record<
    GlowVariant,
    { border: string; glow: string; gradient: string; conic: string }
  > = {
    indigo: {
      border: "border-indigo-500/30 hover:border-indigo-500/70",
      glow: "hover:shadow-indigo-500/25",
      gradient: "from-indigo-500/10 via-purple-500/5 to-transparent",
      conic: "conic-gradient(from 0deg, transparent 0 300deg, #6366f1 360deg)",
    },
    emerald: {
      border: "border-emerald-500/30 hover:border-emerald-500/70",
      glow: "hover:shadow-emerald-500/25",
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      conic: "conic-gradient(from 0deg, transparent 0 300deg, #10b981 360deg)",
    },
    purple: {
      border: "border-purple-500/30 hover:border-purple-500/70",
      glow: "hover:shadow-purple-500/25",
      gradient: "from-purple-500/10 via-pink-500/5 to-transparent",
      conic: "conic-gradient(from 0deg, transparent 0 300deg, #a855f7 360deg)",
    },
    amber: {
      border: "border-amber-500/30 hover:border-amber-500/70",
      glow: "hover:shadow-amber-500/25",
      gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
      conic: "conic-gradient(from 0deg, transparent 0 300deg, #f59e0b 360deg)",
    },
    cyan: {
      border: "border-cyan-500/30 hover:border-cyan-500/70",
      glow: "hover:shadow-cyan-500/25",
      gradient: "from-cyan-500/10 via-blue-500/5 to-transparent",
      conic: "conic-gradient(from 0deg, transparent 0 300deg, #06b6d4 360deg)",
    },
    rose: {
      border: "border-rose-500/30 hover:border-rose-500/70",
      glow: "hover:shadow-rose-500/25",
      gradient: "from-rose-500/10 via-red-500/5 to-transparent",
      conic: "conic-gradient(from 0deg, transparent 0 300deg, #f43f5e 360deg)",
    },
    teal: {
      border: "border-teal-500/30 hover:border-teal-500/70",
      glow: "hover:shadow-teal-500/25",
      gradient: "from-teal-500/10 via-emerald-500/5 to-transparent",
      conic: "conic-gradient(from 0deg, transparent 0 300deg, #14b8a6 360deg)",
    },
    blue: {
      border: "border-blue-500/30 hover:border-blue-500/70",
      glow: "hover:shadow-blue-500/25",
      gradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
      conic: "conic-gradient(from 0deg, transparent 0 300deg, #3b82f6 360deg)",
    },
    multi: {
      border: "border-indigo-500/40 hover:border-purple-500/80",
      glow: "hover:shadow-purple-500/35",
      gradient: "from-indigo-500/15 via-purple-500/10 to-pink-500/15",
      conic:
        "conic-gradient(from 0deg, #6366f1 0deg, #a855f7 90deg, #ec4899 180deg, #06b6d4 270deg, #6366f1 360deg)",
    },
    neon: {
      border: "border-cyan-400/50 hover:border-cyan-400",
      glow: "hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]",
      gradient: "from-cyan-500/20 via-teal-500/10 to-transparent",
      conic: "conic-gradient(from 0deg, transparent 0 280deg, #22d3ee 360deg)",
    },
  };

  const shadowIntensity = {
    soft: "hover:shadow-md",
    medium: "hover:shadow-lg",
    strong: "hover:shadow-xl",
    highlight: "hover:shadow-2xl hover:scale-[1.015]",
  }[intensity];

  const style = glowMap[variant];

  const isBorderAlways = animatedBorder === true || animatedBorder === "always";
  const isBorderHover = animatedBorder === "hover";
  const isBorderPulse = animatedBorder === "pulse";

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -3, transition: { duration: 0.2 } } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-300 ${
        style.border
      } ${style.glow} ${shadowIntensity} ${shineSweep ? "shine-effect" : ""} ${
        isBorderPulse ? "animate-pulse-border" : ""
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {/* Background Soft Glow Gradient */}
      <div
        className={`absolute -inset-px bg-gradient-to-r ${style.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
      />

      {/* Rotating Conic Light Sweep Border */}
      {(isBorderAlways || isBorderHover) && (
        <div
          className={`absolute inset-[-100%] pointer-events-none transition-opacity duration-500 animate-[borderRotate_4s_linear_infinite] ${
            isBorderAlways ? "opacity-60 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          style={{ background: style.conic }}
        />
      )}

      {/* Card Content with Relative Positioning and Surface Mask */}
      <div className="relative rounded-2xl bg-white dark:bg-slate-900 z-10">{children}</div>
    </motion.div>
  );
}

// 2. AnimatedBorder Wrapper
interface AnimatedBorderProps {
  children: React.ReactNode;
  variant?: GlowVariant;
  className?: string;
  active?: boolean;
  hoverOnly?: boolean;
  speed?: "fast" | "normal" | "slow";
}

export function AnimatedBorder({
  children,
  variant = "indigo",
  className = "",
  active = true,
  hoverOnly = false,
  speed = "normal",
}: AnimatedBorderProps) {
  const speedClass = {
    fast: "animate-[borderRotate_2.5s_linear_infinite]",
    normal: "animate-[borderRotate_4s_linear_infinite]",
    slow: "animate-[borderRotate_7s_linear_infinite]",
  }[speed];

  const conicMap: Record<GlowVariant, string> = {
    indigo: "conic-gradient(from 0deg, transparent 0 280deg, #6366f1 360deg)",
    emerald: "conic-gradient(from 0deg, transparent 0 280deg, #10b981 360deg)",
    purple: "conic-gradient(from 0deg, transparent 0 280deg, #a855f7 360deg)",
    amber: "conic-gradient(from 0deg, transparent 0 280deg, #f59e0b 360deg)",
    cyan: "conic-gradient(from 0deg, transparent 0 280deg, #06b6d4 360deg)",
    rose: "conic-gradient(from 0deg, transparent 0 280deg, #f43f5e 360deg)",
    teal: "conic-gradient(from 0deg, transparent 0 280deg, #14b8a6 360deg)",
    blue: "conic-gradient(from 0deg, transparent 0 280deg, #3b82f6 360deg)",
    multi:
      "conic-gradient(from 0deg, #6366f1 0deg, #a855f7 90deg, #ec4899 180deg, #06b6d4 270deg, #6366f1 360deg)",
    neon: "conic-gradient(from 0deg, transparent 0 270deg, #22d3ee 330deg, #a855f7 360deg)",
  };

  return (
    <div className={`relative p-[1px] rounded-2xl overflow-hidden group ${className}`}>
      {active && (
        <div
          className={`absolute inset-[-100%] ${speedClass} transition-opacity duration-300 pointer-events-none ${
            hoverOnly ? "opacity-0 group-hover:opacity-100" : "opacity-70 group-hover:opacity-100"
          }`}
          style={{ background: conicMap[variant] }}
        />
      )}
      <div className="relative rounded-2xl bg-white dark:bg-slate-900 z-10">{children}</div>
    </div>
  );
}

// 2b. BorderGlowCard Component - Advanced multi-state animated border & glow system
export interface BorderGlowCardProps {
  children: React.ReactNode;
  glowColor?: GlowVariant;
  glowType?: "conic-spin" | "neon" | "pulse" | "moving-light" | "gradient" | "inner-outer" | "subtle";
  status?: "normal" | "hover" | "active" | "focus" | "success" | "error";
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

export function BorderGlowCard({
  children,
  glowColor = "indigo",
  glowType = "conic-spin",
  status = "normal",
  interactive = true,
  className = "",
  onClick,
}: BorderGlowCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Status Overrides
  const currentStatus = status !== "normal" ? status : isFocused ? "focus" : isHovered ? "hover" : "normal";

  // Color mappings
  const colorHex: Record<GlowVariant, { primary: string; secondary: string; shadow: string }> = {
    indigo: { primary: "#6366f1", secondary: "#a855f7", shadow: "rgba(99, 102, 241, 0.4)" },
    emerald: { primary: "#10b981", secondary: "#14b8a6", shadow: "rgba(16, 185, 129, 0.4)" },
    purple: { primary: "#a855f7", secondary: "#ec4899", shadow: "rgba(168, 85, 247, 0.4)" },
    amber: { primary: "#f59e0b", secondary: "#f97316", shadow: "rgba(245, 158, 11, 0.4)" },
    cyan: { primary: "#06b6d4", secondary: "#3b82f6", shadow: "rgba(6, 182, 212, 0.4)" },
    rose: { primary: "#f43f5e", secondary: "#e11d48", shadow: "rgba(244, 63, 94, 0.4)" },
    teal: { primary: "#14b8a6", secondary: "#10b981", shadow: "rgba(20, 184, 166, 0.4)" },
    blue: { primary: "#3b82f6", secondary: "#6366f1", shadow: "rgba(59, 130, 246, 0.4)" },
    multi: { primary: "#6366f1", secondary: "#ec4899", shadow: "rgba(168, 85, 247, 0.5)" },
    neon: { primary: "#22d3ee", secondary: "#a855f7", shadow: "rgba(34, 211, 238, 0.6)" },
  };

  const activeColor = colorHex[glowColor] || colorHex.indigo;

  // Dynamic borders based on status
  let borderClasses = "border-slate-200/80 dark:border-slate-800";
  let outerGlow = "";
  let innerGlow = "";

  if (currentStatus === "success") {
    borderClasses = "border-emerald-500/80";
    outerGlow = "shadow-[0_0_20px_rgba(16,185,129,0.35)]";
    innerGlow = "shadow-[inset_0_0_12px_rgba(16,185,129,0.15)]";
  } else if (currentStatus === "error") {
    borderClasses = "border-rose-500/80";
    outerGlow = "shadow-[0_0_20px_rgba(244,63,94,0.35)]";
    innerGlow = "shadow-[inset_0_0_12px_rgba(244,63,94,0.15)]";
  } else if (currentStatus === "active") {
    borderClasses = "border-indigo-500/80 dark:border-indigo-400";
    outerGlow = `shadow-[0_0_25px_${activeColor.shadow}]`;
    innerGlow = `shadow-[inset_0_0_15px_${activeColor.shadow}]`;
  } else if (currentStatus === "focus") {
    borderClasses = "border-cyan-400 ring-2 ring-cyan-400/40";
    outerGlow = "shadow-[0_0_20px_rgba(34,211,238,0.45)]";
  } else if (currentStatus === "hover") {
    borderClasses = "border-transparent";
    outerGlow = `shadow-[0_0_22px_${activeColor.shadow}]`;
  }

  return (
    <motion.div
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      onFocus={() => interactive && setIsFocused(true)}
      onBlur={() => interactive && setIsFocused(false)}
      whileHover={interactive ? { y: -2, transition: { duration: 0.2 } } : undefined}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      onClick={onClick}
      className={`relative p-[1.5px] rounded-3xl overflow-hidden transition-all duration-300 ${outerGlow} ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {/* 1. Animated Conic/Moving Light Background for Border */}
      {(isHovered || currentStatus === "active") && (
        <div
          className="absolute inset-[-150%] animate-[borderRotate_3.5s_linear_infinite] pointer-events-none transition-opacity duration-500"
          style={{
            background:
              glowType === "neon"
                ? `conic-gradient(from 0deg, transparent 0 260deg, ${activeColor.primary} 320deg, ${activeColor.secondary} 360deg)`
                : `conic-gradient(from 0deg, transparent 0 280deg, ${activeColor.primary} 360deg)`,
          }}
        />
      )}

      {/* 2. Pulse or subtle border in normal state */}
      {!isHovered && currentStatus === "normal" && (
        <div
          className="absolute inset-0 rounded-3xl border transition-colors duration-300 pointer-events-none"
          style={{
            borderColor: glowType === "pulse" ? activeColor.shadow : undefined,
          }}
        />
      )}

      {/* 3. Surface Container with Inner Glow */}
      <div
        className={`relative z-10 rounded-[22px] bg-white dark:bg-slate-900 border transition-all duration-300 ${borderClasses} ${innerGlow}`}
      >
        {children}
      </div>
    </motion.div>
  );
}

// 3. AnimatedCounter Component
interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  isBengali?: boolean;
  formatNumber?: boolean;
}

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 1.2,
  className = "",
  isBengali = false,
  formatNumber = true,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const startValue = 0;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease Out Cubic
      const current = startValue + easeProgress * (endValue - startValue);

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(step);
  }, [isInView, value, duration]);

  let formattedNum = count.toFixed(decimals);

  if (formatNumber) {
    const parts = formattedNum.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    formattedNum = parts.join(".");
  }

  const displayNum = isBengali ? toBengaliNumber(formattedNum) : formattedNum;

  return (
    <span ref={ref} className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {displayNum}
      {suffix}
    </span>
  );
}

// 4. AnimatedProgress Component
interface AnimatedProgressProps {
  value: number;
  max?: number;
  color?: "indigo" | "emerald" | "purple" | "amber" | "rose" | "cyan" | "multi";
  height?: string;
  showGlow?: boolean;
  className?: string;
}

export function AnimatedProgress({
  value,
  max = 100,
  color = "indigo",
  height = "h-2",
  showGlow = true,
  className = "",
}: AnimatedProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const colorMap = {
    indigo: {
      bar: "bg-gradient-to-r from-indigo-600 to-purple-600",
      glow: "shadow-[0_0_12px_rgba(99,102,241,0.8)]",
    },
    emerald: {
      bar: "bg-gradient-to-r from-emerald-500 to-teal-500",
      glow: "shadow-[0_0_12px_rgba(16,185,129,0.8)]",
    },
    purple: {
      bar: "bg-gradient-to-r from-purple-600 to-pink-600",
      glow: "shadow-[0_0_12px_rgba(168,85,247,0.8)]",
    },
    amber: {
      bar: "bg-gradient-to-r from-amber-500 to-orange-500",
      glow: "shadow-[0_0_12px_rgba(245,158,11,0.8)]",
    },
    rose: {
      bar: "bg-gradient-to-r from-rose-500 to-red-500",
      glow: "shadow-[0_0_12px_rgba(244,63,94,0.8)]",
    },
    cyan: {
      bar: "bg-gradient-to-r from-cyan-500 to-blue-500",
      glow: "shadow-[0_0_12px_rgba(6,182,212,0.8)]",
    },
    multi: {
      bar: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
      glow: "shadow-[0_0_15px_rgba(168,85,247,0.8)]",
    },
  }[color];

  return (
    <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${height} ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full rounded-full relative ${colorMap.bar} ${showGlow ? colorMap.glow : ""}`}
      >
        {percentage > 0 && percentage < 100 && (
          <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white dark:bg-slate-900/90 rounded-full blur-[1px] animate-pulse" />
        )}
      </motion.div>
    </div>
  );
}

// 5. AnimatedCircularProgress Component
interface AnimatedCircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: "indigo" | "emerald" | "purple" | "amber" | "cyan" | "rose";
  showValue?: boolean;
  suffix?: string;
  className?: string;
  isBengali?: boolean;
}

export function AnimatedCircularProgress({
  value,
  max = 100,
  size = 72,
  strokeWidth = 6,
  color = "indigo",
  showValue = true,
  suffix = "%",
  className = "",
  isBengali = false,
}: AnimatedCircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    indigo: { stroke: "#6366f1", filter: "drop-shadow(0 0 6px rgba(99,102,241,0.6))" },
    emerald: { stroke: "#10b981", filter: "drop-shadow(0 0 6px rgba(16,185,129,0.6))" },
    purple: { stroke: "#a855f7", filter: "drop-shadow(0 0 6px rgba(168,85,247,0.6))" },
    amber: { stroke: "#f59e0b", filter: "drop-shadow(0 0 6px rgba(245,158,11,0.6))" },
    cyan: { stroke: "#06b6d4", filter: "drop-shadow(0 0 6px rgba(6,182,212,0.6))" },
    rose: { stroke: "#f43f5e", filter: "drop-shadow(0 0 6px rgba(244,63,94,0.6))" },
  }[color];

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-100 dark:stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorMap.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeLinecap="round"
          fill="transparent"
          style={{ filter: colorMap.filter }}
        />
      </svg>
      {showValue && (
        <span className="absolute font-mono font-black text-xs text-slate-800 dark:text-slate-100">
          <AnimatedCounter value={Math.round(percentage)} suffix={suffix} isBengali={isBengali} />
        </span>
      )}
    </div>
  );
}

// 6. GlowButton Component
interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "amber"
    | "cyan"
    | "purple"
    | "ghost"
    | "emerald"
    | "teal"
    | "blue"
    | "rose";
  isLoading?: boolean;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function GlowButton({
  variant = "primary",
  isLoading = false,
  icon: Icon,
  children,
  className = "",
  disabled,
  ...props
}: GlowButtonProps) {
  const variantStyles = {
    primary:
      "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:shadow-lg border border-indigo-500/30",
    secondary:
      "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700 shadow-sm",
    success:
      "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 hover:shadow-emerald-500/50 hover:shadow-lg border border-emerald-500/30",
    emerald:
      "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 hover:shadow-emerald-500/50 hover:shadow-lg border border-emerald-500/30",
    danger:
      "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 hover:shadow-rose-500/50 border border-rose-500/30",
    rose:
      "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 hover:shadow-rose-500/50 border border-rose-500/30",
    amber:
      "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/30 hover:shadow-amber-400/50 border border-amber-400/30",
    cyan:
      "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-md shadow-cyan-500/30 hover:shadow-cyan-400/50 border border-cyan-400/30",
    blue:
      "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 hover:shadow-blue-500/50 border border-blue-500/30",
    teal:
      "bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/30 hover:shadow-teal-500/50 border border-teal-500/30",
    purple:
      "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 hover:shadow-purple-500/50 border border-purple-500/30",
    ghost:
      "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-200 border border-transparent",
  }[variant];

  return (
    <motion.button
      whileHover={!disabled && !isLoading ? { scale: 1.02, y: -1 } : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.97 } : undefined}
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shine-effect disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${variantStyles} ${className}`}
      {...(props as any)}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
}

// 7. GradientText Component
export function GradientText({
  children,
  variant = "multi",
  animated = true,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "multi" | "cyan-blue" | "emerald-teal" | "amber-orange" | "purple-pink";
  animated?: boolean;
  className?: string;
}) {
  const gradientClass = {
    multi: "from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400",
    "cyan-blue": "from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-400",
    "emerald-teal": "from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-400",
    "amber-orange": "from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-400",
    "purple-pink": "from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400",
  }[variant];

  return (
    <span
      className={`bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent font-black ${
        animated ? "animate-moving-gradient" : ""
      } ${className}`}
    >
      {children}
    </span>
  );
}

// 8. AnimatedIcon Component
export function AnimatedIcon({
  icon: Icon,
  variant = "pulse",
  className = "",
  size = 20,
}: {
  icon: LucideIcon;
  variant?: "pulse" | "bounce" | "spin" | "glow" | "tilt";
  className?: string;
  size?: number;
}) {
  const animClasses = {
    pulse: "animate-glow-pulse",
    bounce: "animate-bounce",
    spin: "hover:rotate-180 transition-transform duration-500",
    glow: "animate-neon",
    tilt: "hover:rotate-12 transition-transform duration-300",
  }[variant];

  return <Icon size={size} className={`${animClasses} ${className}`} />;
}

// 9. AnimatedBackground Component
export function AnimatedBackground({
  variant = "tech-grid",
  className = "",
  children,
}: {
  variant?: "tech-grid" | "gradient-mesh" | "student-glow";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {variant === "tech-grid" && (
        <>
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="tech-mesh-grid" width="36" height="36" patternUnits="userSpaceOnUse">
                  <path d="M 36 0 L 0 0 0 36" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#tech-mesh-grid)" />
            </svg>
          </div>
        </>
      )}

      {variant === "student-glow" && (
        <>
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-float pointer-events-none" />
        </>
      )}

      {variant === "gradient-mesh" && (
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-purple-500/5 to-cyan-500/5 pointer-events-none" />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}

// 10. ShimmerLoader Component
interface ShimmerLoaderProps {
  className?: string;
  variant?: "text" | "card" | "avatar" | "table";
}

export function ShimmerLoader({ className = "h-4 w-full", variant = "text" }: ShimmerLoaderProps) {
  const shapeClass = {
    text: "rounded-md",
    card: "rounded-2xl h-32",
    avatar: "rounded-full w-10 h-10",
    table: "rounded-xl h-12",
  }[variant];

  return (
    <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-800 ${shapeClass} ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-slate-700/50 to-transparent animate-[shimmerSlide_1.5s_infinite]" />
    </div>
  );
}

// 11. AnimatedSection Wrapper
interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale";
  className?: string;
}

export function AnimatedSection({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: AnimatedSectionProps) {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 20 : direction === "down" ? -20 : 0,
      x: direction === "left" ? 20 : direction === "right" ? -20 : 0,
      scale: direction === "scale" ? 0.95 : 1,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: { duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1.0] as const },
    },
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={variants} className={className}>
      {children}
    </motion.div>
  );
}

// 12. PageTransition Wrapper
export function PageTransition({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 13. CelebrationEffect Component (Confetti)
export function CelebrationEffect({ active = false }: { active?: boolean }) {
  if (!active) return null;

  const particles = Array.from({ length: 25 });

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((_, i) => {
        const left = Math.random() * 100;
        const color = ["#6366f1", "#10b981", "#a855f7", "#f59e0b", "#ec4899", "#06b6d4"][i % 6];
        const delay = Math.random() * 0.4;
        const size = Math.random() * 8 + 6;

        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: `${left}vw`, opacity: 1, rotate: 0 }}
            animate={{
              y: "105vh",
              x: `${left + (Math.random() * 20 - 10)}vw`,
              opacity: 0,
              rotate: Math.random() * 360,
            }}
            transition={{ duration: 2.5, delay, ease: "easeOut" }}
            style={{
              position: "absolute",
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: i % 2 === 0 ? "50%" : "2px",
            }}
          />
        );
      })}
    </div>
  );
}

// 14. AOS (Animate On Scroll) Reveal System
export type AOSAnimation =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in"
  | "zoom-out"
  | "flip-up"
  | "flip-left"
  | "slide-up"
  | "scale-up";

interface AOSRevealProps {
  children: React.ReactNode;
  animation?: AOSAnimation;
  delay?: number;
  duration?: number;
  once?: boolean;
  className?: string;
  threshold?: number;
}

export function AOSReveal({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 0.55,
  once = true,
  className = "",
}: AOSRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "0px" });

  const variants = {
    hidden: {
      opacity: 0,
      y: animation === "fade-up" || animation === "slide-up" ? 35 : animation === "fade-down" ? -35 : 0,
      x: animation === "fade-left" ? 40 : animation === "fade-right" ? -40 : 0,
      scale: animation === "zoom-in" ? 0.82 : animation === "zoom-out" ? 1.15 : animation === "scale-up" ? 0.9 : 1,
      rotateX: animation === "flip-up" ? 60 : 0,
      rotateY: animation === "flip-left" ? 60 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      rotateX: 0,
      rotateY: 0,
      transition: {
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 15. StaggerContainer & StaggerItem for Scroll Animations
export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className = "",
  once = true,
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-40px" });

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  animation = "fade-up",
  duration = 0.5,
  className = "",
}: {
  children: React.ReactNode;
  animation?: AOSAnimation;
  duration?: number;
  className?: string;
}) {
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: animation === "fade-up" ? 30 : animation === "fade-down" ? -30 : 0,
      x: animation === "fade-left" ? 30 : animation === "fade-right" ? -30 : 0,
      scale: animation === "zoom-in" ? 0.85 : 1,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// 16. ParallaxElement Component
export function ParallaxElement({
  children,
  speed = 0.12,
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY * speed);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return (
    <div
      className={className}
      style={{ transform: `translateY(${offsetY}px)`, transition: "transform 0.1s ease-out" }}
    >
      {children}
    </div>
  );
}

// 17. ScrollGlowReveal Component (Illuminates glow on scroll view)
export function ScrollGlowReveal({
  children,
  glowColor = "indigo",
  className = "",
}: {
  children: React.ReactNode;
  glowColor?: GlowVariant;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-60px" });

  const glowShadowMap: Record<GlowVariant, string> = {
    indigo: "shadow-[0_0_35px_rgba(99,102,241,0.35)]",
    emerald: "shadow-[0_0_35px_rgba(16,185,129,0.35)]",
    purple: "shadow-[0_0_35px_rgba(168,85,247,0.35)]",
    amber: "shadow-[0_0_35px_rgba(245,158,11,0.35)]",
    cyan: "shadow-[0_0_35px_rgba(6,182,212,0.35)]",
    rose: "shadow-[0_0_35px_rgba(244,63,94,0.35)]",
    teal: "shadow-[0_0_35px_rgba(20,184,166,0.35)]",
    blue: "shadow-[0_0_35px_rgba(59,130,246,0.35)]",
    multi: "shadow-[0_0_40px_rgba(168,85,247,0.4)]",
    neon: "shadow-[0_0_45px_rgba(34,211,238,0.5)]",
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out rounded-2xl ${
        isInView ? `${glowShadowMap[glowColor]} scale-[1.01]` : "opacity-80 scale-100"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// =========================================================================
// 18. ElectricTechLine Component (Dynamic Animated Electric Current Flow Line)
// =========================================================================
export interface ElectricTechLineProps {
  variant?: "cyan" | "indigo" | "emerald" | "amber" | "rose" | "multi" | "neon";
  direction?: "horizontal" | "vertical";
  thickness?: number;
  showNodes?: boolean;
  speed?: "slow" | "normal" | "fast";
  pulseGlow?: boolean;
  className?: string;
  glowIntensity?: "soft" | "medium" | "laser";
}

export function ElectricTechLine({
  variant = "cyan",
  direction = "horizontal",
  thickness = 2,
  showNodes = true,
  speed = "normal",
  pulseGlow = true,
  className = "",
  glowIntensity = "medium",
}: ElectricTechLineProps) {
  const colorSchemes = {
    cyan: {
      primary: "#06b6d4",
      secondary: "#22d3ee",
      glow: "rgba(6, 182, 212, 0.6)",
      bgBase: "bg-cyan-500/15 dark:bg-cyan-500/20",
      lightNode: "bg-cyan-600 border-cyan-300",
      darkNode: "dark:bg-cyan-400 dark:border-cyan-200",
      gradient: "from-transparent via-cyan-400 to-transparent",
    },
    indigo: {
      primary: "#6366f1",
      secondary: "#818cf8",
      glow: "rgba(99, 102, 241, 0.6)",
      bgBase: "bg-indigo-500/15 dark:bg-indigo-500/20",
      lightNode: "bg-indigo-600 border-indigo-300",
      darkNode: "dark:bg-indigo-400 dark:border-indigo-200",
      gradient: "from-transparent via-indigo-400 to-transparent",
    },
    emerald: {
      primary: "#10b981",
      secondary: "#34d399",
      glow: "rgba(16, 185, 129, 0.6)",
      bgBase: "bg-emerald-500/15 dark:bg-emerald-500/20",
      lightNode: "bg-emerald-600 border-emerald-300",
      darkNode: "dark:bg-emerald-400 dark:border-emerald-200",
      gradient: "from-transparent via-emerald-400 to-transparent",
    },
    amber: {
      primary: "#f59e0b",
      secondary: "#fbbf24",
      glow: "rgba(245, 158, 11, 0.6)",
      bgBase: "bg-amber-500/15 dark:bg-amber-500/20",
      lightNode: "bg-amber-600 border-amber-300",
      darkNode: "dark:bg-amber-400 dark:border-amber-200",
      gradient: "from-transparent via-amber-400 to-transparent",
    },
    rose: {
      primary: "#f43f5e",
      secondary: "#fb7185",
      glow: "rgba(244, 63, 94, 0.6)",
      bgBase: "bg-rose-500/15 dark:bg-rose-500/20",
      lightNode: "bg-rose-600 border-rose-300",
      darkNode: "dark:bg-rose-400 dark:border-rose-200",
      gradient: "from-transparent via-rose-400 to-transparent",
    },
    multi: {
      primary: "#6366f1",
      secondary: "#06b6d4",
      glow: "rgba(168, 85, 247, 0.6)",
      bgBase: "bg-purple-500/15 dark:bg-purple-500/20",
      lightNode: "bg-purple-600 border-indigo-300",
      darkNode: "dark:bg-purple-400 dark:border-cyan-200",
      gradient: "from-indigo-500 via-cyan-400 to-pink-500",
    },
    neon: {
      primary: "#22d3ee",
      secondary: "#a855f7",
      glow: "rgba(34, 211, 238, 0.8)",
      bgBase: "bg-cyan-400/20 dark:bg-cyan-400/25",
      lightNode: "bg-cyan-500 border-purple-300",
      darkNode: "dark:bg-cyan-300 dark:border-purple-200",
      gradient: "from-transparent via-cyan-300 to-purple-400",
    },
  }[variant];

  const speedDuration = {
    slow: "4s",
    normal: "2.5s",
    fast: "1.4s",
  }[speed];

  const glowShadow = {
    soft: `drop-shadow(0 0 3px ${colorSchemes.primary})`,
    medium: `drop-shadow(0 0 6px ${colorSchemes.primary}) drop-shadow(0 0 12px ${colorSchemes.glow})`,
    laser: `drop-shadow(0 0 8px ${colorSchemes.secondary}) drop-shadow(0 0 18px ${colorSchemes.glow})`,
  }[glowIntensity];

  if (direction === "vertical") {
    return (
      <div className={`relative flex flex-col items-center justify-center h-full min-h-[40px] select-none ${className}`}>
        {/* Top Node */}
        {showNodes && (
          <div className="relative -mb-1 z-10">
            <span
              className={`block w-2.5 h-2.5 rounded-full border ${colorSchemes.lightNode} ${colorSchemes.darkNode} shadow-sm animate-circuit-node`}
              style={{ boxShadow: `0 0 8px ${colorSchemes.glow}` }}
            />
          </div>
        )}

        {/* Vertical Rail Container */}
        <div
          className={`relative w-full flex-1 overflow-hidden rounded-full ${colorSchemes.bgBase}`}
          style={{ width: `${thickness}px` }}
        >
          {/* Base Flowing Dash Track */}
          <div
            className="absolute inset-0 w-full animate-electric-flow"
            style={{
              backgroundImage: `repeating-linear-gradient(180deg, ${colorSchemes.primary} 0, ${colorSchemes.primary} 6px, transparent 6px, transparent 14px)`,
              backgroundSize: "100% 28px",
            }}
          />

          {/* Traveling Laser Pulse Packet */}
          <div
            className="absolute left-0 right-0 h-10 -top-10 bg-gradient-to-b from-transparent via-white dark:via-cyan-100 to-transparent animate-laser-packet"
            style={{
              animationDuration: speedDuration,
              filter: glowShadow,
            }}
          />
        </div>

        {/* Bottom Node */}
        {showNodes && (
          <div className="relative -mt-1 z-10">
            <span
              className={`block w-2.5 h-2.5 rounded-full border ${colorSchemes.lightNode} ${colorSchemes.darkNode} shadow-sm animate-circuit-node`}
              style={{ boxShadow: `0 0 8px ${colorSchemes.glow}`, animationDelay: "1s" }}
            />
          </div>
        )}
      </div>
    );
  }

  // Horizontal Electric Tech Line
  return (
    <div className={`relative flex items-center justify-between w-full min-w-[60px] select-none ${className}`}>
      {/* Left Terminal Node */}
      {showNodes && (
        <div className="relative -mr-1 z-10 shrink-0">
          <span
            className={`block w-2.5 h-2.5 rounded-full border ${colorSchemes.lightNode} ${colorSchemes.darkNode} shadow-sm animate-circuit-node`}
            style={{ boxShadow: `0 0 8px ${colorSchemes.glow}` }}
          />
        </div>
      )}

      {/* Main Track with Electric Current Flow */}
      <div
        className={`relative flex-1 overflow-hidden rounded-full ${colorSchemes.bgBase}`}
        style={{ height: `${thickness}px` }}
      >
        {/* Dash Stroke Stream */}
        <div
          className="absolute inset-0 h-full animate-electric-flow"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${colorSchemes.primary} 0, ${colorSchemes.primary} 8px, transparent 8px, transparent 16px)`,
            backgroundSize: "32px 100%",
            opacity: 0.85,
          }}
        />

        {/* Traveling Laser Photon / Electric Packet */}
        <div
          className="absolute top-0 bottom-0 w-24 -left-24 bg-gradient-to-r from-transparent via-white dark:via-cyan-100 to-transparent animate-laser-packet pointer-events-none"
          style={{
            animationDuration: speedDuration,
            filter: pulseGlow ? glowShadow : undefined,
          }}
        />

        {/* Secondary Micro-Packet in Reverse or Delayed */}
        <div
          className="absolute top-0 bottom-0 w-16 -left-16 bg-gradient-to-r from-transparent via-cyan-300 dark:via-indigo-300 to-transparent animate-laser-packet pointer-events-none"
          style={{
            animationDuration: "3.8s",
            animationDelay: "1.2s",
            opacity: 0.75,
          }}
        />
      </div>

      {/* Right Terminal Node */}
      {showNodes && (
        <div className="relative -ml-1 z-10 shrink-0">
          <span
            className={`block w-2.5 h-2.5 rounded-full border ${colorSchemes.lightNode} ${colorSchemes.darkNode} shadow-sm animate-circuit-node`}
            style={{ boxShadow: `0 0 8px ${colorSchemes.glow}`, animationDelay: "1s" }}
          />
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 19. CyberHeaderDecoration Component (High-Tech Decorative Section Header)
// =========================================================================
export interface CyberHeaderDecorationProps {
  title?: string;
  badge?: string;
  variant?: "cyan" | "indigo" | "emerald" | "amber" | "rose" | "multi";
  className?: string;
  showGrid?: boolean;
}

export function CyberHeaderDecoration({
  title,
  badge = "PTSC.SYS.SEC",
  variant = "cyan",
  className = "",
  showGrid = true,
}: CyberHeaderDecorationProps) {
  const badgeColors = {
    cyan: "border-cyan-500/40 text-cyan-700 dark:text-cyan-300 bg-cyan-500/10",
    indigo: "border-indigo-500/40 text-indigo-700 dark:text-indigo-300 bg-indigo-500/10",
    emerald: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10",
    amber: "border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10",
    rose: "border-rose-500/40 text-rose-700 dark:text-rose-300 bg-rose-500/10",
    multi: "border-purple-500/40 text-purple-700 dark:text-purple-300 bg-purple-500/10",
  }[variant];

  return (
    <div className={`relative flex items-center gap-3 w-full my-4 select-none ${className}`}>
      {/* Left Cyber Line with Pulse */}
      <ElectricTechLine variant={variant} thickness={2} showNodes={true} speed="normal" className="flex-1" />

      {/* Center Cyber Emblem Badge */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-xl border text-[10px] font-mono font-black tracking-wider uppercase backdrop-blur-md shrink-0 shadow-sm transition-transform hover:scale-105"
        style={{
          boxShadow: "0 0 15px rgba(6, 182, 212, 0.15)",
        }}
      >
        <span className={`w-2 h-2 rounded-full animate-ping ${variant === "cyan" ? "bg-cyan-400" : "bg-indigo-400"}`} />
        <span className={badgeColors}>{badge}</span>
        {title && <span className="text-slate-700 dark:text-slate-300 font-sans font-bold">| {title}</span>}
      </div>

      {/* Right Cyber Line with Pulse */}
      <ElectricTechLine variant={variant} thickness={2} showNodes={true} speed="fast" className="flex-1" />
    </div>
  );
}

// =========================================================================
// 20. ElectricBorderBeam Component (Animated Perimeter Light Stream)
// =========================================================================
export function ElectricBorderBeam({
  children,
  variant = "cyan",
  className = "",
  active = true,
}: {
  children: React.ReactNode;
  variant?: "cyan" | "indigo" | "emerald" | "amber" | "rose" | "multi";
  className?: string;
  active?: boolean;
}) {
  const gradientMap = {
    cyan: "conic-gradient(from 0deg, transparent 0 270deg, #06b6d4 320deg, #22d3ee 360deg)",
    indigo: "conic-gradient(from 0deg, transparent 0 270deg, #6366f1 320deg, #818cf8 360deg)",
    emerald: "conic-gradient(from 0deg, transparent 0 270deg, #10b981 320deg, #34d399 360deg)",
    amber: "conic-gradient(from 0deg, transparent 0 270deg, #f59e0b 320deg, #fbbf24 360deg)",
    rose: "conic-gradient(from 0deg, transparent 0 270deg, #f43f5e 320deg, #fb7185 360deg)",
    multi: "conic-gradient(from 0deg, #6366f1 0deg, #06b6d4 120deg, #10b981 240deg, #6366f1 360deg)",
  }[variant];

  return (
    <div className={`relative p-[1.5px] rounded-3xl overflow-hidden group ${className}`}>
      {active && (
        <div
          className="absolute inset-[-150%] animate-[borderRotate_3.5s_linear_infinite] pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: gradientMap }}
        />
      )}
      <div className="relative z-10 rounded-[22.5px] bg-white dark:bg-slate-900 overflow-hidden h-full">
        {children}
      </div>
    </div>
  );
}

// =========================================================================
// 21. CyberBadge Component (Glowing Cybernetic Status Pill)
// =========================================================================
export function CyberBadge({
  children,
  variant = "cyan",
  pulse = true,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "cyan" | "indigo" | "emerald" | "amber" | "rose";
  pulse?: boolean;
  className?: string;
}) {
  const style = {
    cyan: "bg-cyan-500/10 border-cyan-500/40 text-cyan-800 dark:text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]",
    indigo: "bg-indigo-500/10 border-indigo-500/40 text-indigo-800 dark:text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.25)]",
    emerald: "bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]",
    amber: "bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
    rose: "bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-black uppercase tracking-wider backdrop-blur-md ${style} ${className}`}
    >
      {pulse && (
        <span
          className={`w-1.5 h-1.5 rounded-full animate-ping ${
            variant === "cyan"
              ? "bg-cyan-400"
              : variant === "emerald"
              ? "bg-emerald-400"
              : variant === "amber"
              ? "bg-amber-400"
              : variant === "rose"
              ? "bg-rose-400"
              : "bg-indigo-400"
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
