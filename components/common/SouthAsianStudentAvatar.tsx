"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface SouthAsianStudentAvatarProps {
  className?: string;
  glowColor?: "cyan" | "amber" | "purple" | "emerald" | "rose";
  animate?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  gender?: "male" | "female" | "neutral";
}

export interface StudentAvatarPreset {
  id: string;
  type: "south_asian" | "emoji";
  name: string;
  gender?: "male" | "female" | "neutral";
  glowColor?: "cyan" | "amber" | "purple" | "emerald" | "rose";
  emoji?: string;
  badgeBg?: string;
  border?: string;
}

export const STUDENT_AVATAR_PRESETS: StudentAvatarPreset[] = [
  // South Asian Student Characters
  { id: "sa_male_cyan", type: "south_asian", name: "ছাত্র (সায়ান)", gender: "male", glowColor: "cyan" },
  { id: "sa_female_purple", type: "south_asian", name: "ছাত্রী (পার্পল)", gender: "female", glowColor: "purple" },
  { id: "sa_male_emerald", type: "south_asian", name: "ছাত্র (গ্রিন)", gender: "male", glowColor: "emerald" },
  { id: "sa_female_rose", type: "south_asian", name: "ছাত্রী (রোজ)", gender: "female", glowColor: "rose" },
  { id: "sa_male_amber", type: "south_asian", name: "ছাত্র (অ্যাম্বার)", gender: "male", glowColor: "amber" },
  { id: "sa_female_cyan", type: "south_asian", name: "ছাত্রী (সায়ান)", gender: "female", glowColor: "cyan" },
  { id: "sa_neutral_purple", type: "south_asian", name: "স্কলার (পার্পল)", gender: "neutral", glowColor: "purple" },
  // Gamified 3D Tech Emojis
  { id: "emoji_rocket", type: "emoji", name: "রকেট", emoji: "🚀", badgeBg: "bg-rose-500/20", border: "border-rose-400" },
  { id: "emoji_robot", type: "emoji", name: "রোবট", emoji: "🤖", badgeBg: "bg-indigo-500/20", border: "border-indigo-400" },
  { id: "emoji_zap", type: "emoji", name: "ভোল্টেজ", emoji: "⚡", badgeBg: "bg-amber-500/20", border: "border-amber-400" },
  { id: "emoji_lion", type: "emoji", name: "সিংহ", emoji: "🦁", badgeBg: "bg-orange-500/20", border: "border-orange-400" },
  { id: "emoji_tiger", type: "emoji", name: "টাইগার", emoji: "🐯", badgeBg: "bg-yellow-500/20", border: "border-yellow-400" },
  { id: "emoji_panda", type: "emoji", name: "পান্ডা", emoji: "🐼", badgeBg: "bg-teal-500/20", border: "border-teal-400" },
  { id: "emoji_fox", type: "emoji", name: "ফক্স", emoji: "🦊", badgeBg: "bg-red-500/20", border: "border-red-400" },
  { id: "emoji_trophy", type: "emoji", name: "ট্রফি", emoji: "🏆", badgeBg: "bg-amber-500/20", border: "border-amber-400" },
  { id: "emoji_diamond", type: "emoji", name: "ডায়মন্ড", emoji: "💎", badgeBg: "bg-cyan-500/20", border: "border-cyan-400" },
  { id: "emoji_target", type: "emoji", name: "টার্গেট", emoji: "🎯", badgeBg: "bg-rose-500/20", border: "border-rose-400" },
  { id: "emoji_crown", type: "emoji", name: "ক্রাউন", emoji: "👑", badgeBg: "bg-yellow-500/20", border: "border-yellow-400" },
  { id: "emoji_fire", type: "emoji", name: "ফায়ার", emoji: "🔥", badgeBg: "bg-orange-500/20", border: "border-orange-400" },
  { id: "emoji_gamepad", type: "emoji", name: "গেমার", emoji: "🎮", badgeBg: "bg-purple-500/20", border: "border-purple-400" },
  { id: "emoji_atom", type: "emoji", name: "বিজ্ঞান", emoji: "🔬", badgeBg: "bg-blue-500/20", border: "border-blue-400" },
  { id: "emoji_gear", type: "emoji", name: "মেকানিক", emoji: "⚙️", badgeBg: "bg-slate-500/20", border: "border-slate-400" },
  { id: "emoji_laptop", type: "emoji", name: "কোডার", emoji: "💻", badgeBg: "bg-teal-500/20", border: "border-teal-400" },
];

export function RenderStudentAvatar({
  avatar,
  size = "md",
  animate = false,
  className = "",
}: {
  avatar?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  animate?: boolean;
  className?: string;
}) {
  const avStr = avatar || "sa_male_cyan";
  const matchedPreset = STUDENT_AVATAR_PRESETS.find((p) => p.id === avStr);

  if (avStr.startsWith("sa_") || matchedPreset?.type === "south_asian") {
    const gender = matchedPreset?.gender || (avStr.includes("female") ? "female" : avStr.includes("neutral") ? "neutral" : "male");
    const glow = matchedPreset?.glowColor || (avStr.includes("amber") ? "amber" : avStr.includes("purple") ? "purple" : avStr.includes("emerald") ? "emerald" : avStr.includes("rose") ? "rose" : "cyan");
    return (
      <SouthAsianStudentAvatar
        gender={gender}
        glowColor={glow}
        size={size}
        animate={animate}
        className={className}
      />
    );
  }

  // Emoji or Icon avatar
  const emojiChar = matchedPreset?.emoji || avStr;
  const sizeMap = {
    xs: "w-8 h-8 text-sm",
    sm: "w-10 h-10 text-base",
    md: "w-14 h-14 text-2xl",
    lg: "w-20 h-20 text-3xl",
    xl: "w-28 h-28 text-5xl",
    "2xl": "w-36 h-36 text-6xl",
  };

  return (
    <div
      className={cn(
        "rounded-full bg-slate-900/90 border-2 border-cyan-500/40 shadow-lg flex items-center justify-center shrink-0 transition-transform select-none",
        sizeMap[size] || sizeMap.md,
        className
      )}
    >
      <span>{emojiChar}</span>
    </div>
  );
}

export default function SouthAsianStudentAvatar({
  className,
  glowColor = "cyan",
  animate = true,
  size = "md",
  gender = "neutral",
}: SouthAsianStudentAvatarProps) {
  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
    "2xl": "w-48 h-48",
  };

  const glowColors = {
    cyan: "from-cyan-500/40 via-blue-500/40 to-indigo-500/40 shadow-cyan-500/20",
    amber: "from-amber-500/40 via-orange-500/40 to-yellow-500/40 shadow-amber-500/20",
    purple: "from-purple-500/40 via-fuchsia-500/40 to-pink-500/40 shadow-purple-500/20",
    emerald: "from-emerald-500/40 via-teal-500/40 to-cyan-500/40 shadow-emerald-500/20",
    rose: "from-rose-500/40 via-pink-500/40 to-orange-500/40 shadow-rose-500/20",
  };

  return (
    <div className={cn("relative group flex items-center justify-center", className)}>
      {/* Border Glow Animation */}
      {animate && (
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.4, 0.7, 0.4],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
          className={cn(
            "absolute -inset-2 rounded-full blur-xl opacity-50 bg-gradient-to-tr transition-opacity duration-500 group-hover:opacity-100",
            glowColors[glowColor] || glowColors.cyan
          )}
        />
      )}

      {/* Main Avatar Container */}
      <motion.div
        whileHover={{ scale: 1.05, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative bg-slate-900 rounded-full border-2 border-white/20 overflow-hidden shadow-2xl flex items-center justify-center z-10",
          sizeClasses[size]
        )}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Background Gradient */}
          <defs>
            <linearGradient id="avatarGradient" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="skinGradient" x1="0" y1="0" x2="0" y2="100">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#avatarGradient)" />

          {/* Torso / School Uniform */}
          <path
            d="M15 100C15 80 30 68 50 68C70 68 85 80 85 100"
            fill="#334155"
            stroke="#475569"
            strokeWidth="0.5"
          />
          {/* Shirt Collar */}
          <path d="M38 68L50 82L62 68H38Z" fill="white" />
          <path d="M50 82V100" stroke="#cbd5e1" strokeWidth="1.2" />
          
          {/* Subtle Tie/Button Line */}
          <line x1="50" y1="85" x2="50" y2="95" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1 2" />

          {/* Neck */}
          <rect x="43" y="58" width="14" height="12" fill="#d29e7c" />
          <rect x="43" y="58" width="14" height="12" fill="url(#skinGradient)" />

          {/* Face */}
          <path
            d="M32 42C32 30.5 40 22 50 22C60 22 68 30.5 68 42V55C68 65.5 60 74 50 74C40 74 32 65.5 32 55V42Z"
            fill="#d29e7c"
          />
          <path
            d="M32 42C32 30.5 40 22 50 22C60 22 68 30.5 68 42V55C68 65.5 60 74 50 74C40 74 32 65.5 32 55V42Z"
            fill="url(#skinGradient)"
          />

          {/* Eyes (Typical South Asian Dark Brown/Black Eyes) */}
          <g className="animate-pulse">
            <ellipse cx="43" cy="48" rx="3" ry="3.5" fill="#1e293b" />
            <ellipse cx="57" cy="48" rx="3" ry="3.5" fill="#1e293b" />
            {/* Eye Shine */}
            <circle cx="44.2" cy="46.5" r="0.8" fill="white" opacity="0.6" />
            <circle cx="58.2" cy="46.5" r="0.8" fill="white" opacity="0.6" />
          </g>

          {/* Eyebrows */}
          <path
            d="M37 42C39 40 44 40 47 42"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M53 42C56 40 61 40 63 42"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Nose */}
          <path
            d="M48 55C49 57 51 57 52 55"
            stroke="#92400e"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Mouth (Friendly smile) */}
          <path
            d="M42 64C45 67 55 67 58 64"
            stroke="#92400e"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Hair Styles */}
          {gender === "female" ? (
            <g>
              <path
                d="M32 42C32 30 38 20 50 20C62 20 68 30 68 42V55L75 65V40C75 25 65 15 50 15C35 15 25 25 25 40V65L32 55V42Z"
                fill="#0f172a"
              />
              {/* Ponytail hint */}
              <path d="M50 20L45 10L55 10L50 20Z" fill="#0f172a" opacity="0.8" />
            </g>
          ) : (
            <g>
              {/* Professional Male/Neutral Hair Cut */}
              <path
                d="M32 42C32 32 38 22 50 22C62 22 68 32 68 42V45C68 45 62 35 50 35C38 35 32 45 32 45V42Z"
                fill="#0f172a"
              />
              <path
                d="M32 42C32 32 40 21 50 21C60 21 68 32 68 42"
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.5"
              />
              {/* Sideburns */}
              <path d="M32 42V50" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              <path d="M68 42V50" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {/* Glasses (Optional Aesthetic) */}
          {/* <path d="M38 48H48M52 48H62M48 48C48 48 50 47 52 48" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.4" /> */}
        </svg>
      </motion.div>

      {/* Floating Sparkle Particles */}
      {animate && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -40 - Math.random() * 40],
                x: [0, (Math.random() - 0.5) * 40],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
              className={cn(
                "absolute w-1 h-1 rounded-full blur-[1px]",
                i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-cyan-400"
              )}
              style={{
                top: "50%",
                left: "50%",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
