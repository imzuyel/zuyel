"use client";

import React from "react";

export interface ColorfulStudentAvatar {
  id: string;
  name: string;
  emoji: string;
  gradient: string; // Tailwind gradient classes
  bgClass: string;
  borderClass: string;
  glowColor: string;
}

export const COLORFUL_STUDENT_AVATARS: ColorfulStudentAvatar[] = [
  // Animals & Mythical Creatures
  { id: "av_cyber_tiger", name: "সাইবার টাইগার", emoji: "🐯", gradient: "from-amber-400 via-orange-500 to-red-600", bgClass: "bg-orange-500/20", borderClass: "border-orange-400", glowColor: "rgba(249,115,22,0.4)" },
  { id: "av_neon_lion", name: "নিয়ন সিংহ", emoji: "🦁", gradient: "from-yellow-400 via-amber-500 to-orange-600", bgClass: "bg-amber-500/20", borderClass: "border-amber-400", glowColor: "rgba(245,158,11,0.4)" },
  { id: "av_space_falcon", name: "স্পেস ফ্যালকন", emoji: "🦅", gradient: "from-cyan-400 via-blue-500 to-indigo-600", bgClass: "bg-cyan-500/20", borderClass: "border-cyan-400", glowColor: "rgba(6,182,212,0.4)" },
  { id: "av_quantum_fox", name: "কোয়ান্টাম ফক্স", emoji: "🦊", gradient: "from-orange-400 via-red-500 to-pink-600", bgClass: "bg-red-500/20", borderClass: "border-red-400", glowColor: "rgba(239,68,68,0.4)" },
  { id: "av_ninja_panda", name: "নিনজা পান্ডা", emoji: "🐼", gradient: "from-emerald-400 via-teal-500 to-cyan-600", bgClass: "bg-emerald-500/20", borderClass: "border-emerald-400", glowColor: "rgba(16,185,129,0.4)" },
  { id: "av_cosmic_dragon", name: "কসমিক ড্রাগন", emoji: "🐉", gradient: "from-purple-500 via-indigo-600 to-blue-700", bgClass: "bg-purple-500/20", borderClass: "border-purple-400", glowColor: "rgba(168,85,247,0.4)" },
  { id: "av_star_unicorn", name: "স্টার ইউনিকর্ন", emoji: "🦄", gradient: "from-pink-400 via-fuchsia-500 to-purple-600", bgClass: "bg-fuchsia-500/20", borderClass: "border-fuchsia-400", glowColor: "rgba(217,70,239,0.4)" },
  { id: "av_arctic_wolf", name: "আর্কটিক উলফ", emoji: "🐺", gradient: "from-sky-300 via-blue-400 to-indigo-500", bgClass: "bg-sky-500/20", borderClass: "border-sky-400", glowColor: "rgba(56,189,248,0.4)" },
  { id: "av_wise_owl", name: "জ্ঞানী প্যাঁচা", emoji: "🦉", gradient: "from-yellow-500 via-amber-600 to-stone-700", bgClass: "bg-amber-600/20", borderClass: "border-amber-500", glowColor: "rgba(217,119,6,0.4)" },
  { id: "av_hyper_dolphin", name: "হাইপার ডলফিন", emoji: "🐬", gradient: "from-teal-300 via-cyan-400 to-blue-500", bgClass: "bg-teal-500/20", borderClass: "border-teal-400", glowColor: "rgba(20,184,166,0.4)" },

  // Tech, Science & Futurism
  { id: "av_turbo_robot", name: "টার্বো রোবট", emoji: "🤖", gradient: "from-indigo-400 via-purple-500 to-pink-500", bgClass: "bg-indigo-500/20", borderClass: "border-indigo-400", glowColor: "rgba(99,102,241,0.4)" },
  { id: "av_rocket_blaster", name: "রকেট ব্লাস্টার", emoji: "🚀", gradient: "from-rose-500 via-orange-500 to-amber-400", bgClass: "bg-rose-500/20", borderClass: "border-rose-400", glowColor: "rgba(244,63,94,0.4)" },
  { id: "av_lightning_volt", name: "মেগা ভোল্টেজ", emoji: "⚡", gradient: "from-amber-300 via-yellow-400 to-orange-500", bgClass: "bg-yellow-500/20", borderClass: "border-yellow-400", glowColor: "rgba(234,179,8,0.4)" },
  { id: "av_alien_saucer", name: "এলিয়েন সসার", emoji: "🛸", gradient: "from-emerald-400 via-green-500 to-teal-600", bgClass: "bg-green-500/20", borderClass: "border-green-400", glowColor: "rgba(34,197,94,0.4)" },
  { id: "av_cyber_brain", name: "সাইবার ব্রেন", emoji: "🧠", gradient: "from-pink-400 via-rose-500 to-purple-600", bgClass: "bg-pink-500/20", borderClass: "border-pink-400", glowColor: "rgba(236,72,153,0.4)" },
  { id: "av_code_ninja", name: "কোড নিনজা", emoji: "💻", gradient: "from-cyan-400 via-teal-500 to-emerald-600", bgClass: "bg-cyan-500/20", borderClass: "border-cyan-400", glowColor: "rgba(6,182,212,0.4)" },
  { id: "av_atom_scientist", name: "অ্যাটম বিজ্ঞানী", emoji: "🔬", gradient: "from-blue-400 via-indigo-500 to-violet-600", bgClass: "bg-blue-500/20", borderClass: "border-blue-400", glowColor: "rgba(59,130,246,0.4)" },
  { id: "av_gear_master", name: "গিয়ার মাস্টার", emoji: "⚙️", gradient: "from-slate-400 via-slate-500 to-zinc-600", bgClass: "bg-slate-500/20", borderClass: "border-slate-400", glowColor: "rgba(148,163,184,0.4)" },
  { id: "av_deep_satellite", name: "স্যাটেলাইট প্রব", emoji: "🛰️", gradient: "from-violet-400 via-purple-500 to-indigo-600", bgClass: "bg-violet-500/20", borderClass: "border-violet-400", glowColor: "rgba(139,92,246,0.4)" },
  { id: "av_crystal_planet", name: "ক্রিস্টাল প্ল্যানেট", emoji: "🪐", gradient: "from-amber-400 via-rose-500 to-purple-600", bgClass: "bg-rose-500/20", borderClass: "border-rose-400", glowColor: "rgba(244,63,94,0.4)" },

  // Royalty, Badges & Gaming
  { id: "av_gold_trophy", name: "গোল্ডেন ট্রফি", emoji: "🏆", gradient: "from-yellow-300 via-amber-400 to-orange-500", bgClass: "bg-amber-500/20", borderClass: "border-amber-300", glowColor: "rgba(251,191,36,0.5)" },
  { id: "av_royal_crown", name: "রয়্যাল ক্রাউন", emoji: "👑", gradient: "from-amber-300 via-yellow-400 to-amber-500", bgClass: "bg-yellow-500/20", borderClass: "border-yellow-300", glowColor: "rgba(234,179,8,0.5)" },
  { id: "av_neon_diamond", name: "নিয়ন ডায়মন্ড", emoji: "💎", gradient: "from-cyan-300 via-blue-400 to-indigo-500", bgClass: "bg-cyan-500/20", borderClass: "border-cyan-300", glowColor: "rgba(6,182,212,0.5)" },
  { id: "av_bullseye_target", name: "বুলসআই টার্গেট", emoji: "🎯", gradient: "from-red-400 via-rose-500 to-orange-500", bgClass: "bg-red-500/20", borderClass: "border-red-400", glowColor: "rgba(239,68,68,0.4)" },
  { id: "av_flame_champion", name: "ফ্লেম চ্যাম্পিয়ন", emoji: "🔥", gradient: "from-orange-400 via-red-500 to-rose-600", bgClass: "bg-orange-500/20", borderClass: "border-orange-400", glowColor: "rgba(249,115,22,0.5)" },
  { id: "av_pro_gamer", name: "প্রো গেমার", emoji: "🎮", gradient: "from-purple-400 via-fuchsia-500 to-pink-500", bgClass: "bg-purple-500/20", borderClass: "border-purple-400", glowColor: "rgba(168,85,247,0.4)" },
  { id: "av_speed_racer", name: "স্পিড রেসার", emoji: "🏎️", gradient: "from-red-500 via-orange-500 to-amber-400", bgClass: "bg-red-500/20", borderClass: "border-red-400", glowColor: "rgba(239,68,68,0.4)" },
  { id: "av_golden_star", name: "গোল্ডেন স্টার", emoji: "🌟", gradient: "from-yellow-300 via-amber-400 to-yellow-500", bgClass: "bg-yellow-500/20", borderClass: "border-yellow-400", glowColor: "rgba(234,179,8,0.5)" },
  { id: "av_magic_crystal", name: "ম্যাজিক স্ফিয়ার", emoji: "🔮", gradient: "from-purple-500 via-violet-600 to-indigo-700", bgClass: "bg-purple-500/20", borderClass: "border-purple-400", glowColor: "rgba(168,85,247,0.4)" },
  { id: "av_lucky_clover", name: "লাকি ক্লোভার", emoji: "🍀", gradient: "from-emerald-400 via-green-500 to-teal-600", bgClass: "bg-emerald-500/20", borderClass: "border-emerald-400", glowColor: "rgba(16,185,129,0.4)" },

  // South Asian Students & Academic Avatars
  { id: "av_scholar_male_cyan", name: "পলটেকনিক ছাত্র (সায়ান)", emoji: "👨‍🎓", gradient: "from-cyan-400 via-blue-500 to-indigo-600", bgClass: "bg-cyan-500/20", borderClass: "border-cyan-400", glowColor: "rgba(6,182,212,0.4)" },
  { id: "av_scholar_female_purple", name: "পলটেকনিক ছাত্রী (পার্পল)", emoji: "👩‍🎓", gradient: "from-purple-400 via-pink-500 to-rose-500", bgClass: "bg-purple-500/20", borderClass: "border-purple-400", glowColor: "rgba(168,85,247,0.4)" },
  { id: "av_engineer_male_amber", name: "ইঞ্জিনিয়ার ছাত্র (অ্যাম্বার)", emoji: "👷‍♂️", gradient: "from-amber-400 via-orange-500 to-red-500", bgClass: "bg-amber-500/20", borderClass: "border-amber-400", glowColor: "rgba(245,158,11,0.4)" },
  { id: "av_engineer_female_teal", name: "ইঞ্জিনিয়ার ছাত্রী (টিয়াল)", emoji: "👷‍♀️", gradient: "from-teal-400 via-emerald-500 to-cyan-500", bgClass: "bg-teal-500/20", borderClass: "border-teal-400", glowColor: "rgba(20,184,166,0.4)" },
  { id: "av_technician_emerald", name: "টেকনিশিয়ান (গ্রিন)", emoji: "🧑‍💻", gradient: "from-emerald-400 via-teal-500 to-blue-600", bgClass: "bg-emerald-500/20", borderClass: "border-emerald-400", glowColor: "rgba(16,185,129,0.4)" },
  { id: "av_artist_rose", name: "ডিজাইনার (রোজ)", emoji: "🎨", gradient: "from-rose-400 via-pink-500 to-purple-500", bgClass: "bg-rose-500/20", borderClass: "border-rose-400", glowColor: "rgba(244,63,94,0.4)" },
  { id: "av_rockstar_violet", name: "রকস্টার (ভায়োলেট)", emoji: "🎸", gradient: "from-violet-500 via-purple-600 to-indigo-700", bgClass: "bg-violet-500/20", borderClass: "border-violet-400", glowColor: "rgba(139,92,246,0.4)" },
  { id: "av_archer_hunter", name: "আর্চার লক্ষ্যভেদ", emoji: "🏹", gradient: "from-amber-500 via-orange-600 to-yellow-600", bgClass: "bg-amber-600/20", borderClass: "border-amber-500", glowColor: "rgba(217,119,6,0.4)" },
  { id: "av_shield_guardian", name: "শিল্ড গার্ডিয়ান", emoji: "🛡️", gradient: "from-blue-500 via-indigo-600 to-cyan-500", bgClass: "bg-blue-600/20", borderClass: "border-blue-400", glowColor: "rgba(37,99,235,0.4)" },
  { id: "av_ninja_swordsman", name: "সোর্ড ফাইটার", emoji: "⚔️", gradient: "from-rose-500 via-red-600 to-stone-800", bgClass: "bg-rose-600/20", borderClass: "border-rose-400", glowColor: "rgba(225,29,72,0.4)" },
  { id: "av_cool_shades", name: "স্মার্ট জিনিয়াস", emoji: "🕶️", gradient: "from-cyan-400 via-indigo-500 to-purple-600", bgClass: "bg-cyan-500/20", borderClass: "border-cyan-400", glowColor: "rgba(6,182,212,0.4)" },
  { id: "av_rainbow_scholar", name: "রংধনু স্কলার", emoji: "🌈", gradient: "from-red-400 via-yellow-400 to-blue-500", bgClass: "bg-yellow-500/20", borderClass: "border-amber-400", glowColor: "rgba(234,179,8,0.4)" },
];

export function getAvatarById(avatarId?: string | null): ColorfulStudentAvatar {
  if (!avatarId) return COLORFUL_STUDENT_AVATARS[0];
  const found = COLORFUL_STUDENT_AVATARS.find((a) => a.id === avatarId || a.emoji === avatarId);
  if (found) return found;

  // Fallback if avatarId is an emoji itself (like "🚀")
  const emojiMatch = COLORFUL_STUDENT_AVATARS.find((a) => a.emoji === avatarId);
  if (emojiMatch) return emojiMatch;

  // South Asian preset map fallback
  if (avatarId.includes("cyan")) return COLORFUL_STUDENT_AVATARS[2];
  if (avatarId.includes("purple")) return COLORFUL_STUDENT_AVATARS[5];
  if (avatarId.includes("emerald") || avatarId.includes("green")) return COLORFUL_STUDENT_AVATARS[4];
  if (avatarId.includes("amber") || avatarId.includes("orange")) return COLORFUL_STUDENT_AVATARS[0];
  if (avatarId.includes("rose") || avatarId.includes("pink")) return COLORFUL_STUDENT_AVATARS[6];

  return COLORFUL_STUDENT_AVATARS[0];
}

export function RenderColorfulAvatar({
  avatarId,
  size = "md",
  className = "",
  showGlow = true,
}: {
  avatarId?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showGlow?: boolean;
}) {
  const avatar = getAvatarById(avatarId);

  const sizeClasses = {
    xs: "w-7 h-7 text-sm",
    sm: "w-9 h-9 text-base",
    md: "w-12 h-12 text-2xl",
    lg: "w-16 h-16 text-3xl",
    xl: "w-24 h-24 text-5xl",
    "2xl": "w-32 h-32 text-6xl",
  }[size] || "w-12 h-12 text-2xl";

  return (
    <div
      style={showGlow ? { boxShadow: `0 0 16px ${avatar.glowColor}` } : undefined}
      className={`relative rounded-full bg-gradient-to-tr ${avatar.gradient} p-[2.5px] shrink-0 flex items-center justify-center transition-transform ${sizeClasses} ${className}`}
      title={avatar.name}
    >
      <div className="w-full h-full rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center select-none shadow-inner">
        <span>{avatar.emoji}</span>
      </div>
    </div>
  );
}

