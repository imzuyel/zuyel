"use client";

import React from "react";
import { QuizPlateTemplate } from "@/lib/database";
import { motion } from "motion/react";
import { Sparkles, Zap, Shield, Crown } from "lucide-react";

export interface PlateProps {
  template: QuizPlateTemplate;
  children: React.ReactNode;
}

/**
 * 1. Neon Cyber Plate
 * Deep cyber dark canvas, vibrant glowing multi-color border lines, 
 * floating geometric neon accents, futuristic game badge style.
 */
export const NeonCyberPlate = ({ template, children }: PlateProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative rounded-3xl sm:rounded-[2.5rem] p-1 overflow-hidden transition-all duration-300 shadow-[0_0_50px_rgba(6,182,212,0.25)]"
    >
      {/* Outer animated gradient neon border line */}
      <div 
        className="absolute inset-0 rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-amber-500 opacity-90 blur-xs animate-moving-gradient"
      />
      <div className="absolute inset-[2px] rounded-[1.4rem] sm:rounded-[2.4rem] bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/95" />

      {/* Floating SVG Geometric Accents */}
      <div className="absolute top-4 left-6 pointer-events-none opacity-40">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <polygon points="12,2 22,20 2,20" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3 2" />
        </svg>
      </div>
      <div className="absolute top-4 right-8 pointer-events-none opacity-40">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="2" width="18" height="18" rx="4" stroke="#d946ef" strokeWidth="2" />
        </svg>
      </div>
      <div className="absolute bottom-5 left-8 pointer-events-none opacity-30">
        <div className="w-5 h-5 rounded-full border-2 border-emerald-400" />
      </div>
      <div className="absolute bottom-5 right-10 pointer-events-none opacity-35">
        <div className="w-6 h-6 rounded-full border-2 border-amber-400" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 p-5 sm:p-7 backdrop-blur-xl">
        {children}
      </div>
    </motion.div>
  );
};

/**
 * 2. Cyber Purple Plate
 * Electric violet glow, neon fuchsia streaks, high-tech grid texture.
 */
export const CyberPurplePlate = ({ template, children }: PlateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative rounded-3xl sm:rounded-[2.5rem] p-1 overflow-hidden transition-all duration-300 shadow-[0_0_55px_rgba(168,85,247,0.35)]"
    >
      <div className="absolute inset-0 rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-500 opacity-90 animate-moving-gradient" />
      <div className="absolute inset-[2px] rounded-[1.4rem] sm:rounded-[2.4rem] bg-gradient-to-b from-slate-950 via-purple-950/80 to-slate-950" />
      
      {/* Circuit lines */}
      <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
        <div className="w-full h-full bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      <div className="relative z-10 p-5 sm:p-7 backdrop-blur-xl">
        {children}
      </div>
    </motion.div>
  );
};

/**
 * 3. White 3D Floating Plate
 * Soft neumorphic / clean white layered 3D card with vibrant accent badge and embossed feel.
 */
export const White3DPlate = ({ template, children }: PlateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-b from-slate-100 via-white to-slate-200 text-slate-900 dark:text-slate-100 border-4 border-white/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-4px_8px_rgba(0,0,0,0.1)] transition-all duration-300"
    >
      {/* 3D Top Header Accent Tab */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-6 py-1 rounded-full bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-pink-500/30 border border-white/40 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-white dark:bg-slate-900 animate-pulse" />
        3D Arena Plate
      </div>

      {/* Background Circular Rings Motif */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl sm:rounded-[2.5rem] opacity-20">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-pink-400" />
        <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full border border-purple-400" />
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full border border-indigo-400" />
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

/**
 * 4. Glassmorphism Cyber Plate
 * Frosted ultra-translucent glass, glowing cyan/purple edges, high readability.
 */
export const GlassmorphismPlate = ({ template, children }: PlateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 bg-slate-900/75 backdrop-blur-2xl border-2 border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] transition-all duration-300 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-3xl sm:rounded-t-[2.5rem]" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

/**
 * 5. Pink-Purple Vibrant Gradient Plate
 * Electric sunset gradient, high contrast, smooth neon glow.
 */
export const GradientVibrantPlate = ({ template, children }: PlateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 border-2 border-pink-500/50 shadow-[0_0_40px_rgba(236,72,153,0.3)] transition-all duration-300 overflow-hidden"
    >
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

/**
 * 6. Rainbow Animated Border Plate
 * Kinetic multi-color border cycle, playful and engaging for students.
 */
export const RainbowPlate = ({ template, children }: PlateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative rounded-3xl sm:rounded-[2.5rem] p-[3px] bg-gradient-to-r from-red-500 via-amber-500 via-emerald-500 via-cyan-500 via-blue-500 to-purple-500 bg-[length:200%_200%] animate-moving-gradient shadow-[0_0_35px_rgba(168,85,247,0.35)]"
    >
      <div className="rounded-[1.35rem] sm:rounded-[2.35rem] p-6 sm:p-8 bg-slate-950/95 backdrop-blur-md">
        {children}
      </div>
    </motion.div>
  );
};

/**
 * 7. Midnight Gold Plate
 * Luxurious 24k gold hairline metallic borders on obsidian dark canvas.
 */
export const MidnightGoldPlate = ({ template, children }: PlateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative rounded-3xl sm:rounded-[2.5rem] p-[2px] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_50px_rgba(245,158,11,0.25)]"
    >
      <div className="rounded-[1.4rem] sm:rounded-[2.4rem] p-6 sm:p-8 bg-gradient-to-b from-stone-950 via-slate-950 to-neutral-950 text-white relative overflow-hidden">
        {/* Subtle gold crown watermark badge */}
        <div className="absolute top-4 right-6 pointer-events-none opacity-20">
          <Crown className="w-8 h-8 text-amber-400" />
        </div>
        <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 8. Emerald Matrix Plate
 * Deep tech green glow, cyber forensic matrix feel.
 */
export const EmeraldMatrixPlate = ({ template, children }: PlateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative rounded-3xl sm:rounded-[2.5rem] p-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
    >
      <div className="rounded-[1.4rem] sm:rounded-[2.4rem] p-6 sm:p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950/70 text-white relative overflow-hidden">
        <div className="absolute top-3 right-6 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400/80">MATRIX GRID</span>
        </div>

        <div className="relative z-10">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 9. Minimal Tech Plate
 * Crisp technical borders, monochrome with emerald accents.
 */
export const MinimalTechPlate = ({ template, children }: PlateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 bg-slate-900 border border-slate-700/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
    >
      <div className="absolute top-3 right-6 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">ENGINE V2</span>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

// Universal Factory Component
export const QuizPlate = ({ template, children }: PlateProps) => {
  if (!template) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        {children}
      </div>
    );
  }

  switch (template.id) {
    case "neon-blue":
      return <NeonCyberPlate template={template}>{children}</NeonCyberPlate>;
    case "cyber-purple":
      return <CyberPurplePlate template={template}>{children}</CyberPurplePlate>;
    case "3d-card":
      return <White3DPlate template={template}>{children}</White3DPlate>;
    case "glass-morphism":
      return <GlassmorphismPlate template={template}>{children}</GlassmorphismPlate>;
    case "pink-grad":
      return <GradientVibrantPlate template={template}>{children}</GradientVibrantPlate>;
    case "rainbow":
      return <RainbowPlate template={template}>{children}</RainbowPlate>;
    case "midnight-gold":
      return <MidnightGoldPlate template={template}>{children}</MidnightGoldPlate>;
    case "emerald-matrix":
      return <EmeraldMatrixPlate template={template}>{children}</EmeraldMatrixPlate>;
    default:
      if (template.category === "3d") {
        return <White3DPlate template={template}>{children}</White3DPlate>;
      }
      if (template.category === "glass") {
        return <GlassmorphismPlate template={template}>{children}</GlassmorphismPlate>;
      }
      if (template.category === "gradient") {
        return <GradientVibrantPlate template={template}>{children}</GradientVibrantPlate>;
      }
      return <NeonCyberPlate template={template}>{children}</NeonCyberPlate>;
  }
};
