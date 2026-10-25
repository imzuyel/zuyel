"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "motion/react";
import {
  BookOpen,
  Award,
  CheckCircle2,
  Lock,
  Play,
  Sparkles,
  Zap,
  Rocket,
  Shield,
  Gem,
  Target,
  Star,
  Crown,
  Trophy,
  Flame,
  Check,
  CheckCheck,
} from "lucide-react";
import {
  ChapterContentItemData,
  EnrichedContentItem,
} from "@/lib/chapterLearningEngine";
import GamifiedEdTechBackground from "@/components/learning/GamifiedEdTechBackground";
import { formatSmartTime, getItemMarks } from "@/components/learning/SequentialLearningPathView";
import { triggerBlockCompletionCelebration } from "@/lib/confetti";

// Progressive Reward & Milestone Icon Sequence with rich colors & tactile depths
export const PROGRESSIVE_ICONS = [
  {
    icon: Rocket,
    name: "রকেট স্টার্ট",
    gradient: "from-rose-500 via-amber-500 to-orange-500",
    shadow: "#9f1239",
    accent: "text-amber-200",
  },
  {
    icon: Zap,
    name: "এনার্জি পাওয়ার",
    gradient: "from-amber-400 via-yellow-500 to-orange-500",
    shadow: "#92400e",
    accent: "text-yellow-100",
  },
  {
    icon: Shield,
    name: "গোল্ডেন শিল্ড",
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    shadow: "#115e59",
    accent: "text-emerald-100",
  },
  {
    icon: Gem,
    name: "ডায়মন্ড মাস্টার",
    gradient: "from-cyan-400 via-sky-500 to-blue-600",
    shadow: "#1e40af",
    accent: "text-cyan-100",
  },
  {
    icon: Target,
    name: "বুলসআই টার্গেট",
    gradient: "from-pink-500 via-rose-500 to-red-600",
    shadow: "#9d174d",
    accent: "text-rose-100",
  },
  {
    icon: Star,
    name: "সুপার স্টার",
    gradient: "from-amber-400 via-orange-500 to-amber-600",
    shadow: "#9a3412",
    accent: "text-amber-100",
  },
  {
    icon: Crown,
    name: "মাস্টার ক্রাউন",
    gradient: "from-purple-500 via-indigo-600 to-violet-700",
    shadow: "#3730a3",
    accent: "text-purple-100",
  },
  {
    icon: Trophy,
    name: "গ্র্যান্ড ট্রফি",
    gradient: "from-amber-400 via-yellow-400 to-amber-600",
    shadow: "#854d0e",
    accent: "text-amber-100",
  },
];

// Timeline Roadmap Stagger Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const blockVariants: any = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

interface CurvedPathwayRoadmapProps {
  items: (ChapterContentItemData | EnrichedContentItem)[];
  activeItemId: number | null;
  onSelectItem: (item: ChapterContentItemData) => void;
  onLockedClick?: (item: ChapterContentItemData, reason: string) => void;
  progressPercentage?: number;
  completedCount?: number;
  totalCount?: number;
  totalEarnedStars?: number;
  maxPossibleStars?: number;
}

export function CurvedPathwayRoadmap({
  items,
  activeItemId,
  onSelectItem,
  onLockedClick,
  progressPercentage = 0,
  completedCount = 0,
  totalCount = 0,
  totalEarnedStars,
  maxPossibleStars,
}: CurvedPathwayRoadmapProps) {
  // Active milestone index tracking
  const activeIndex = items.findIndex((it) => it.id === activeItemId);

  // Compute stars dynamically if not directly provided
  const computedStars = items.reduce((acc, it) => {
    const p = (it as any).progress;
    if (p?.isPassed || p?.status === "COMPLETED") {
      const starVal = p.stars !== undefined && p.stars !== null && Number(p.stars) > 0
        ? Math.max(1, Math.min(5, Number(p.stars)))
        : 1;
      return acc + starVal;
    }
    return acc;
  }, 0);
  const earnedStarsCount = totalEarnedStars !== undefined ? totalEarnedStars : computedStars;
  const maxStarsCount = maxPossibleStars || (totalCount > 0 ? totalCount * 5 : items.length * 5);

  // Active block DOM reference for smooth auto-centering (Task 1: Auto-Scroll UX Fix)
  const activeNodeRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll smoothly to center the active block whenever activeItemId changes or on mount
  useEffect(() => {
    if (activeNodeRef.current) {
      const timer = setTimeout(() => {
        activeNodeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeItemId]);

  return (
    <div className="w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Gamified EdTech Background: Floating Gadgets, Luminous Energy Grid & Formulas */}
      <GamifiedEdTechBackground variant="roadmap" showGadgets={true} showQuizFormulas={true} />

      {/* Roadmap Header & Premium Animated Progress Bar */}
      <div className="space-y-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
              শিক্ষণ রোডম্যাপ
            </span>
          </div>

          {/* Standout Percentage Badge with Bold Gradient Text */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.18)]">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              অগ্রগতি
            </span>
            <span className="text-sm sm:text-base font-black font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400">
              {progressPercentage}%
            </span>
          </div>
        </div>

        {/* Premium Animated Gradient Progress Track with Soft Glow & Light Sheen */}
        <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-700/80 shadow-inner relative">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-green-500 rounded-full relative overflow-hidden shadow-[0_0_14px_rgba(16,185,129,0.55)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Soft Ambient Animated Shimmer moving across the progress fill */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none -skew-x-12"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            />
          </motion.div>
        </div>

        {/* Progress Stats: Modern Colorful Pill Badges with SVG Icons & Total Stars Earned */}
        <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
          {/* Milestone Step Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/50 shadow-xs text-[11px] font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
            <span>
              ধাপ <strong className="font-mono font-black text-amber-600 dark:text-amber-200">{activeIndex >= 0 ? activeIndex + 1 : 1}</strong> / {items.length}
            </span>
          </div>

          {/* Total Chapter Stars Earned Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-yellow-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.2)] text-[11px] font-bold">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.7)] shrink-0 animate-pulse" />
            <span>
              <strong className="font-mono font-black text-amber-600 dark:text-amber-200">{earnedStarsCount}</strong> / {maxStarsCount} স্টার
            </span>
          </div>

          {/* Completed Lessons Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/50 shadow-xs text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span>
              <strong className="font-mono font-black text-emerald-600 dark:text-emerald-200">{completedCount}</strong> / {totalCount || items.length} পাঠ শেষ ✨
            </span>
          </div>
        </div>
      </div>

      {/* Serpentine Zigzag SVG Road Container */}
      <div className="py-2 px-1 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[280px] sm:max-w-xs mx-auto space-y-10 relative"
        >
          {items.map((item, idx) => {
            const enriched = item as Partial<EnrichedContentItem>;
            const isQuiz = item.itemType === "QUIZ";

            // Determine passed / locked / active state
            // Once an item is completed, it is PERMANENTLY passed and will NEVER be re-locked
            const isPassed =
              enriched.progress?.isPassed === true ||
              enriched.progress?.status === "COMPLETED" ||
              Boolean(enriched.progress?.completedAt);

            // Previous item passed state in the chain
            const prevItemPassed =
              idx === 0 ||
              Boolean(
                (items[idx - 1] as Partial<EnrichedContentItem>)?.progress?.isPassed ||
                (items[idx - 1] as Partial<EnrichedContentItem>)?.progress?.status === "COMPLETED" ||
                (items[idx - 1] as Partial<EnrichedContentItem>)?.progress?.completedAt
              );

            // Strict Forward Locking: Completed items are NEVER locked
            const isLocked = !isPassed && (enriched.isLocked !== undefined ? enriched.isLocked : !prevItemPassed);

            const isCurrentActive = item.id === activeItemId;
            const isCurrentNext = enriched.isCurrentNextStep || (!isPassed && !isLocked);

            // Progressive icon data for this step
            const progressiveData = PROGRESSIVE_ICONS[idx % PROGRESSIVE_ICONS.length];
            const MilestoneIcon = isQuiz ? Trophy : progressiveData.icon;

            // Serpentine Zigzag Horizontal Alternation: [Center, Left, Center, Right]
            const alignments = [
              "justify-center",
              "justify-start pl-3 sm:pl-5",
              "justify-center",
              "justify-end pr-3 sm:pr-5",
            ];
            const alignClass = alignments[idx % alignments.length];

            const lockReason =
              enriched.lockReason ||
              "ধারাবাহিক কারিকুলাম নিয়ম অনুযায়ী পূর্ববর্তী ধাপ সম্পন্ন না করে এই ধাপে যাওয়া যাবে না।";

            const handleNodeClick = () => {
              if (isLocked) {
                if (onLockedClick) {
                  onLockedClick(item, lockReason);
                } else {
                  alert(`🔒 লক করা ধাপ: ${lockReason}`);
                }
                return;
              }

              // Auto-center the clicked block smoothly
              const nodeEl = document.getElementById(`roadmap-node-${item.id}`);
              nodeEl?.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
              });

              onSelectItem(item);
            };

            return (
              <React.Fragment key={item.id}>
                <motion.div
                  variants={blockVariants}
                  className={`flex ${alignClass} relative z-10`}
                >
                  {/* Duolingo Gamified Milestone Node */}
                  <div
                    ref={isCurrentActive ? activeNodeRef : null}
                    id={`roadmap-node-${item.id}`}
                    className="flex flex-col items-center group relative scroll-mt-28"
                  >
                    {/* Floating Speech Bubble for Current Active Step */}
                    {isCurrentActive && (
                      <motion.div
                        initial={{ y: -4, opacity: 0 }}
                        animate={{ y: [0, -5, 0], opacity: 1 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="mb-2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[9.5px] font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 z-20 cursor-pointer select-none border border-indigo-400/40"
                        onClick={handleNodeClick}
                      >
                        <Play className="w-2.5 h-2.5 fill-current text-cyan-300" />
                        <span>এখানেই আছো! 🚀</span>
                      </motion.div>
                    )}

                    {/* Subtle Pulse Halo for Active */}
                    {isCurrentActive && (
                      <motion.div
                        className="absolute -inset-2 rounded-full pointer-events-none z-0 ring-2 ring-indigo-400/50"
                        animate={{
                          opacity: [0.35, 0.75, 0.35],
                          scale: [0.98, 1.07, 0.98],
                        }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      />
                    )}

                    {/* Milestone Button with 3D Tactile EdTech Styling (Completed / Active / Locked) */}
                    <motion.button
                      type="button"
                      whileTap={!isLocked ? { scale: 0.94 } : {}}
                      onClick={handleNodeClick}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-black transition-all relative z-10 select-none cursor-pointer border-2 ${
                        isPassed
                          ? "bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 text-white border-emerald-300 shadow-[0_6px_0_#065f46] active:translate-y-1.5 active:shadow-[0_0px_0_#065f46] hover:brightness-105"
                          : isCurrentActive
                          ? "bg-gradient-to-b from-indigo-500 via-indigo-600 to-indigo-700 text-white border-indigo-300 shadow-[0_6px_0_#312e81] active:translate-y-1.5 active:shadow-[0_0px_0_#312e81] ring-4 ring-indigo-400/35 hover:brightness-105"
                          : isLocked
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-700/80 shadow-[0_5px_0_#94a3b8] dark:shadow-[0_5px_0_#0f172a] opacity-75 cursor-not-allowed"
                          : isQuiz
                          ? "bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-slate-950 border-amber-300 shadow-[0_6px_0_#78350f] active:translate-y-1.5 active:shadow-[0_0px_0_#78350f] hover:brightness-105"
                          : "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700 shadow-[0_5px_0_#cbd5e1] dark:shadow-[0_5px_0_#1e293b] active:translate-y-1 active:shadow-[0_0px_0_#cbd5e1] hover:brightness-105"
                      }`}
                      title={
                        isLocked
                          ? `লক করা ধাপ (পূর্ববর্তী পাঠ সম্পন্ন করে আনলক করুন 🔒): ${item.titleBangla}`
                          : item.titleBangla
                      }
                    >
                      {/* Top Gloss Sheen Reflection for 3D Feel */}
                      {!isLocked && (
                        <span className="absolute inset-x-3 top-1.5 h-2.5 rounded-full bg-white/30 pointer-events-none" />
                      )}

                      {/* Icon Rendering */}
                      {isPassed ? (
                        <>
                          <CheckCircle2 className="w-7 h-7 text-white stroke-[2.4] drop-shadow-sm" />
                          {/* Mini Golden Star Badge on Completed */}
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center">
                            ★
                          </span>
                        </>
                      ) : isLocked ? (
                        <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      ) : isCurrentActive ? (
                        <Play className="w-6 h-6 text-white fill-current drop-shadow-sm ml-0.5" />
                      ) : isQuiz ? (
                        <Trophy className="w-6 h-6 text-amber-950 drop-shadow-sm" />
                      ) : (
                        <MilestoneIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </motion.button>

                    {/* Minimalist Gamified Card: strictly displays ONLY XP, Marks, and Smart Time */}
                    <div
                      onClick={handleNodeClick}
                      className={`mt-2 px-3 py-1 rounded-full text-center max-w-[155px] transition-all duration-200 ${
                        isLocked
                          ? "opacity-60 cursor-not-allowed bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/40"
                          : isPassed
                          ? "cursor-pointer bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:-translate-y-0.5 hover:border-emerald-400"
                          : isCurrentActive
                          ? "cursor-pointer bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 hover:-translate-y-0.5 hover:border-indigo-400"
                          : "cursor-pointer bg-white/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800/70 hover:-translate-y-0.5 hover:border-indigo-400"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-tight select-none">
                        <span className="font-semibold text-amber-500 dark:text-amber-400">+{item.xpReward || 10} XP</span>
                        <span className="text-slate-300 dark:text-slate-600 font-normal">•</span>
                        <span className="font-semibold text-cyan-600 dark:text-cyan-400">{getItemMarks(item as any)} Marks</span>
                        <span className="text-slate-300 dark:text-slate-600 font-normal">•</span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{formatSmartTime(item)}</span>
                      </div>
                    </div>

                    {/* 1-to-5 Star Rating Display for Completed Blocks with Staggered Pop Animation */}
                    {isPassed && (
                      (() => {
                        const earnedStars = Math.max(1, Math.min(5, Number((item as any).progress?.stars) || 1));
                        return (
                          <div className="mt-1 flex items-center justify-center gap-0.5" title={`${earnedStars} / 5 স্টার অর্জিত`}>
                            {[1, 2, 3, 4, 5].map((starIdx) => {
                              const isEarned = starIdx <= earnedStars;
                              return (
                            <motion.span
                              key={starIdx}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 450,
                                damping: 18,
                                delay: starIdx * 0.05,
                              }}
                            >
                              <Star
                                className={`w-3 h-3 ${
                                  isEarned
                                    ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.7)]"
                                    : "text-slate-300 dark:text-slate-700 fill-transparent"
                                }`}
                              />
                            </motion.span>
                          );
                        })}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </motion.div>

                {/* Curved Serpentine SVG Connector Road to Next Node (Framer Motion Animated Path Drawing) */}
                {idx < items.length - 1 && (() => {
                  const pathD =
                    idx % 4 === 0
                      ? "M 100 0 C 100 24, 45 24, 45 48"
                      : idx % 4 === 1
                      ? "M 45 0 C 45 24, 100 24, 100 48"
                      : idx % 4 === 2
                      ? "M 100 0 C 100 24, 155 24, 155 48"
                      : "M 155 0 C 155 24, 100 24, 100 48";

                  const isElectricActive = isCurrentActive || isCurrentNext;

                  return (
                    <div className="w-full flex justify-center -my-3 pointer-events-none relative z-0">
                      <svg
                        className="w-48 sm:w-60 h-12 overflow-visible"
                        viewBox="0 0 200 48"
                      >
                        <defs>
                          {/* Vibrant Electric Gradient */}
                          <linearGradient
                            id={`road-grad-${item.id}`}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="50%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>

                          {/* Sleek Electric Glow Filter */}
                          <filter id={`electric-glow-${item.id}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        {/* Ambient Sleek Guide Track (Thin 2px) */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-800/80"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        {/* Completed Solid Track with Framer Motion Draw Animation */}
                        {isPassed && (
                          <motion.path
                            d={pathD}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.9, ease: "easeOut" }}
                            className="filter drop-shadow-[0_0_3px_rgba(16,185,129,0.5)]"
                          />
                        )}

                        {/* Active Electric Animated Path Drawing using Framer Motion */}
                        {isElectricActive && (
                          <>
                            {/* Glowing Electric Underlayer */}
                            <motion.path
                              d={pathD}
                              fill="none"
                              stroke={`url(#road-grad-${item.id})`}
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              opacity="0.6"
                              filter={`url(#electric-glow-${item.id})`}
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.2, ease: "easeInOut" }}
                            />

                            {/* Flowing Electric Lightning Pulse Line (strokeDashoffset animation) */}
                            <motion.path
                              d={pathD}
                              fill="none"
                              stroke={`url(#road-grad-${item.id})`}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeDasharray="8 6"
                              initial={{ strokeDashoffset: 28 }}
                              animate={{ strokeDashoffset: [28, 0] }}
                              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                              className="filter drop-shadow-[0_0_5px_rgba(6,182,212,0.9)]"
                            />

                            {/* Traveling Electric Energy Light Photon along the path */}
                            <circle r="3" fill="#38bdf8" filter={`url(#electric-glow-${item.id})`}>
                              <animateMotion
                                path={pathD}
                                dur="1.6s"
                                repeatCount="indefinite"
                              />
                            </circle>
                            <circle r="1.5" fill="#ffffff">
                              <animateMotion
                                path={pathD}
                                dur="1.6s"
                                repeatCount="indefinite"
                              />
                            </circle>
                          </>
                        )}
                      </svg>
                    </div>
                  );
                })()}
              </React.Fragment>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
