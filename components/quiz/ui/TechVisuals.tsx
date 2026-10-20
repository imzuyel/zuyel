"use client";

import React from "react";
import { motion } from "motion/react";

export function TechBackground() {
  return (
    <div className="fixed inset-0 z-[-1] bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Animated Grid */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      >
        <motion.div 
          className="absolute inset-0 bg-linear-to-b from-transparent via-cyan-500/5 to-transparent h-[200%] w-full"
          animate={{
            y: ["-50%", "0%"]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Glow Orbs */}
      <motion.div 
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Tech Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <motion.path
          d="M -100 100 L 1000 100"
          stroke="url(#line-grad)"
          strokeWidth="1"
          fill="none"
          animate={{
            x: ["-100%", "100%"]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.path
          d="M -100 400 L 1000 400"
          stroke="url(#line-grad)"
          strokeWidth="1"
          fill="none"
          animate={{
            x: ["100%", "-100%"]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </svg>

      {/* Floating Student Gamified Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[
          { icon: "⚡", top: "18%", left: "8%", delay: 0, duration: 6, size: "text-2xl" },
          { icon: "❓", top: "25%", right: "10%", delay: 1, duration: 7, size: "text-3xl" },
          { icon: "🏆", top: "75%", left: "12%", delay: 2, duration: 8, size: "text-2xl" },
          { icon: "⭐", top: "68%", right: "14%", delay: 1.5, duration: 6.5, size: "text-2xl" },
          { icon: "🎯", top: "45%", left: "5%", delay: 2.5, duration: 9, size: "text-xl" },
          { icon: "💡", top: "82%", right: "8%", delay: 0.5, duration: 7.5, size: "text-2xl" },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            className={`absolute ${item.size} select-none opacity-20 filter drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]`}
            style={{
              top: item.top,
              left: (item as any).left,
              right: (item as any).right,
            }}
            animate={{
              y: [-12, 12, -12],
              rotate: [-10, 10, -10],
              scale: [0.9, 1.1, 0.9],
              opacity: [0.15, 0.35, 0.15],
            }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {item.icon}
          </motion.div>
        ))}
      </div>

      {/* Subtle Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />
    </div>
  );
}

export function GlowCard({
  children,
  className = "",
  innerClassName = "p-6 sm:p-8",
  delay = 0,
  glowVariant = "multi",
  animatedBorder = true,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  delay?: number;
  glowVariant?: "cyan" | "purple" | "multi" | "amber" | "emerald";
  animatedBorder?: boolean;
}) {
  const glowGradients = {
    cyan: "conic-gradient(from 0deg, #06b6d4 0deg, #3b82f6 120deg, #06b6d4 240deg, #38bdf8 360deg)",
    purple: "conic-gradient(from 0deg, #a855f7 0deg, #ec4899 120deg, #6366f1 240deg, #a855f7 360deg)",
    multi: "conic-gradient(from 0deg, #06b6d4 0deg, #6366f1 90deg, #a855f7 180deg, #ec4899 270deg, #06b6d4 360deg)",
    amber: "conic-gradient(from 0deg, #f59e0b 0deg, #ef4444 120deg, #eab308 240deg, #f59e0b 360deg)",
    emerald: "conic-gradient(from 0deg, #10b981 0deg, #06b6d4 120deg, #14b8a6 240deg, #10b981 360deg)",
  }[glowVariant];

  const ambientShadow = {
    cyan: "shadow-[0_0_50px_rgba(6,182,212,0.35)]",
    purple: "shadow-[0_0_50px_rgba(168,85,247,0.35)]",
    multi: "shadow-[0_0_50px_rgba(99,102,241,0.35)]",
    amber: "shadow-[0_0_50px_rgba(245,158,11,0.35)]",
    emerald: "shadow-[0_0_50px_rgba(16,185,129,0.35)]",
  }[glowVariant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`relative group p-[2px] rounded-[28px] overflow-hidden ${ambientShadow} transition-shadow duration-500 ${className}`}
    >
      {/* 1. Animated Conic Gradient Border Glow */}
      {animatedBorder && (
        <div
          className="absolute inset-[-150%] animate-[borderRotate_4s_linear_infinite] pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: glowGradients }}
        />
      )}

      {/* 2. Soft Ambient Blurred Aura behind card */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 rounded-[30px] blur-xl opacity-40 group-hover:opacity-65 transition duration-700 pointer-events-none" />

      {/* 3. Surface Container with Proper Padding & High Contrast */}
      <div
        className={`relative z-10 bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800/80 backdrop-blur-2xl rounded-[26px] overflow-hidden shadow-2xl transition-all duration-300 ${innerClassName}`}
      >
        {children}
      </div>
    </motion.div>
  );
}

export function TechBorder({ children, active = false }: { children: React.ReactNode, active?: boolean }) {
  return (
    <div className="relative p-[1px] overflow-hidden rounded-2xl">
      {active && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-white w-[150%] opacity-90 pointer-events-none shadow-[0_0_12px_#22d3ee]"
          animate={{
            x: ["-100%", "150%"]
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
        />
      )}
      <div className="relative bg-white dark:bg-slate-950 rounded-2xl">
        {children}
      </div>
    </div>
  );
}
