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
      className="relative rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-b from-slate-100 via-white to-slate-200 dark:from-slate-900 dark:via-slate-850 dark:to-slate-950 text-slate-950 dark:text-white border-4 border-white/90 dark:border-slate-700/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-4px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] transition-all duration-300 [&_h3]:!text-slate-950 dark:[&_h3]:!text-white [&_p]:!text-slate-800 dark:[&_p]:!text-slate-200"
      data-plate-theme="3d-card"
    >
      {/* 3D Top Header Accent Tab */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-6 py-1 rounded-full bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-pink-500/30 border border-white/40 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-white dark:bg-slate-900 animate-pulse" />
        3D Arena Plate
      </div>

      {/* Background Circular Rings Motif */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl sm:rounded-[2.5rem] opacity-20 dark:opacity-10">
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

// =========================================================================
// Advanced Interactive Quiz Templates (Phase 3 & Live Arena Engine)
// =========================================================================
// Advanced Interactive Quiz Templates (Phase 3 & Live Arena Engine)
// =========================================================================
export * from "./types";
export { NodeConnectedTemplate } from "./NodeConnectedTemplate";
export { CyberShapeTemplate } from "./CyberShapeTemplate";
export { TemplateNeonCyberpunk } from "./TemplateNeonCyberpunk";
export { TemplateClaymorphism } from "./TemplateClaymorphism";
export { TemplateSunsetGradient } from "./TemplateSunsetGradient";

// 20 Unique Interactive Quiz Templates
export { Template01 } from "./Template01";
export { Template02 } from "./Template02";
export { Template03 } from "./Template03";
export { Template04 } from "./Template04";
export { Template05 } from "./Template05";
export { Template06 } from "./Template06";
export { Template07 } from "./Template07";
export { Template08 } from "./Template08";
export { Template09 } from "./Template09";
export { Template10 } from "./Template10";
export { Template11 } from "./Template11";
export { Template12 } from "./Template12";
export { Template13 } from "./Template13";
export { Template14 } from "./Template14";
export { Template15 } from "./Template15";
export { Template16 } from "./Template16";
export { Template17 } from "./Template17";
export { Template18 } from "./Template18";
export { Template19 } from "./Template19";
export { Template20 } from "./Template20";

import { Template01 } from "./Template01";
import { Template02 } from "./Template02";
import { Template03 } from "./Template03";
import { Template04 } from "./Template04";
import { Template05 } from "./Template05";
import { Template06 } from "./Template06";
import { Template07 } from "./Template07";
import { Template08 } from "./Template08";
import { Template09 } from "./Template09";
import { Template10 } from "./Template10";
import { Template11 } from "./Template11";
import { Template12 } from "./Template12";
import { Template13 } from "./Template13";
import { Template14 } from "./Template14";
import { Template15 } from "./Template15";
import { Template16 } from "./Template16";
import { Template17 } from "./Template17";
import { Template18 } from "./Template18";
import { Template19 } from "./Template19";
import { Template20 } from "./Template20";

import { TemplateDefinition } from "./types";

export const QUIZ_TEMPLATES: TemplateDefinition[] = [
  {
    id: 1,
    name: "Connected Nodes Network",
    nameBangla: "কানেক্টেড নোডস নেটওয়ার্ক",
    description: "Centrally positioned question node with real animated SVG cubic bezier lines branching to 4 option nodes.",
    category: "futuristic",
    accentColor: "#06B6D4",
    component: Template01,
  },
  {
    id: 2,
    name: "Cyberpunk Polygon Cut-Out",
    nameBangla: "সাইবারপাঙ্ক কাট-আউট",
    description: "Asymmetrical 7:5 split layout, clip-path hex-chamfered question card, and angled tech option buttons with left accent bars.",
    category: "cyberpunk",
    accentColor: "#EC4899",
    component: Template02,
  },
  {
    id: 3,
    name: "3D Playful Claymorphism",
    nameBangla: "থ্রিডি ক্লেমরফিজম",
    description: "Soft purple/blue background with 3D cloud speech bubble, golden sparkles and soft claymorphic pill buttons.",
    category: "claymorphism",
    accentColor: "#6C5CE7",
    component: Template03,
  },
  {
    id: 4,
    name: "Vibrant Sunset Glassmorphism",
    nameBangla: "ভাইব্রেন্ট সানসেট গ্লাস",
    description: "Warm sunset pink-orange gradients, translucent glassmorphism cards and luminous frosted buttons.",
    category: "gradient",
    accentColor: "#FF5E62",
    component: Template04,
  },
  {
    id: 5,
    name: "Neo-Brutalism Pop",
    nameBangla: "নিও-ব্রুটালিজম পপ",
    description: "Bold 3.5px solid borders, electric yellow badges, and high-impact hard offset block shadows.",
    category: "brutalist",
    accentColor: "#FBBF24",
    component: Template05,
  },
  {
    id: 6,
    name: "Soft Neumorphic Emboss",
    nameBangla: "সফট নিউমরফিক এমবস",
    description: "Extruded tactile surfaces with dual light/dark bevel shadows and soft debossed wells.",
    category: "neumorphic",
    accentColor: "#6366F1",
    component: Template06,
  },
  {
    id: 7,
    name: "Technical Blueprint CAD",
    nameBangla: "ব্লুপ্রিন্ট ক্যাড ড্রাফটিং",
    description: "Precision grid canvas with drafting coordinate markers, corner crosshairs, and cyan dimension lines.",
    category: "futuristic",
    accentColor: "#38BDF8",
    component: Template07,
  },
  {
    id: 8,
    name: "Retro 8-Bit Pixel Arcade",
    nameBangla: "রেট্রো ৮-বিট আর্কেড",
    description: "CRT scanline effects, chunky pixelated borders, and vintage gaming coin-op HUD styling.",
    category: "retro",
    accentColor: "#4ADE80",
    component: Template08,
  },
  {
    id: 9,
    name: "Minimalist Swiss Grid",
    nameBangla: "সুইস মিনিমালিস্ট গ্রিড",
    description: "Ultra-clean asymmetric editorial typography, heavy hair-line borders, and large modernist numeral index.",
    category: "minimal",
    accentColor: "#0F172A",
    component: Template09,
  },
  {
    id: 10,
    name: "Hand-Drawn Notebook Doodle",
    nameBangla: "হ্যান্ড-ড্রন নোটবুক ডুডল",
    description: "Ruled notebook paper texture with spiraled binder rings, washi tape badges, and organic sketched borders.",
    category: "sketch",
    accentColor: "#F59E0B",
    component: Template10,
  },
  {
    id: 11,
    name: "Matrix Terminal CLI",
    nameBangla: "ম্যাট্রিক্স টার্মিনাল সিএলআই",
    description: "Phosphor monochrome CRT scanline glow, blinking command cursor, and vintage console status telemetry.",
    category: "cyberpunk",
    accentColor: "#22C55E",
    component: Template11,
  },
  {
    id: 12,
    name: "Aurora Borealis Cosmic",
    nameBangla: "অরোরা বরিয়ালিস কসমিক",
    description: "Ethereal shimmering polar aurora waves, starfield dust backdrop, and cosmic translucent glass cards.",
    category: "gradient",
    accentColor: "#2DD4BF",
    component: Template12,
  },
  {
    id: 13,
    name: "Pop-Art Manga Comic Dot",
    nameBangla: "পপ-আর্ট কমিক মাঙ্গা",
    description: "Ben-Day halftone polka dot shading, dynamic comic speech balloons, and vibrant explosive onomatopoeia styling.",
    category: "comic",
    accentColor: "#EF4444",
    component: Template13,
  },
  {
    id: 14,
    name: "Luxury Midnight Gold",
    nameBangla: "লাক্সারি মিডনাইট গোল্ড",
    description: "Deep obsidian velvet backdrop with gilded metallic borders, royal crown flourishes, and art deco styling.",
    category: "luxury",
    accentColor: "#EAB308",
    component: Template14,
  },
  {
    id: 15,
    name: "Origami Folded Facets",
    nameBangla: "ওরিগামি ফোল্ডেড পেপার",
    description: "Geometric paper fold polygons with faceted angled clip-paths and clean crease highlights.",
    category: "origami",
    accentColor: "#F97316",
    component: Template15,
  },
  {
    id: 16,
    name: "Synthwave 80s Wireframe",
    nameBangla: "সিন্থওয়েভ এইটিজ গ্রিড",
    description: "Retro outrun perspective wireframe horizon, glowing neon sun, and vibrant fuchsia/cyan edge lighting.",
    category: "synthwave",
    accentColor: "#D946EF",
    component: Template16,
  },
  {
    id: 17,
    name: "Prismatic Frosted Crystal",
    nameBangla: "প্রিজম্যাটিক ক্রিস্টাল গ্লাস",
    description: "Diamond faceted crystalline borders, spectral dispersion highlights, and frosted refractive backdrops.",
    category: "crystal",
    accentColor: "#818CF8",
    component: Template17,
  },
  {
    id: 18,
    name: "Biomorphic Organic Fluid",
    nameBangla: "বায়োমর্ফিক অর্গানিক ফ্লুইড",
    description: "Curvilinear amoeboid blobs, fluid morphing water-droplet geometries, and serene pastel ecology tones.",
    category: "organic",
    accentColor: "#10B981",
    component: Template18,
  },
  {
    id: 19,
    name: "Steampunk Industrial Brass",
    nameBangla: "স্টিমপাঙ্ক ব্রাস রিভেট",
    description: "Riveted steel and antique bronze plating, mechanical pressure gauge dials, and heavy machined bezels.",
    category: "steampunk",
    accentColor: "#D97706",
    component: Template19,
  },
  {
    id: 20,
    name: "Holographic Sci-Fi HUD",
    nameBangla: "হলোগ্রাফিক সাই-ফাই এইচইউডি",
    description: "Heads-Up Visor reticles, tactical hex targeting brackets, and live radar frequency oscilloscopes.",
    category: "scifi",
    accentColor: "#06B6D4",
    component: Template20,
  },
];

export function getTemplateById(id: number): TemplateDefinition {
  const found = QUIZ_TEMPLATES.find((t) => t.id === id);
  return found || QUIZ_TEMPLATES[0];
}
