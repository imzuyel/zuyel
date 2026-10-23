"use client";

import React from "react";
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
} from "lucide-react";
import {
  ChapterContentItemData,
  EnrichedContentItem,
} from "@/lib/chapterLearningEngine";
import GamifiedEdTechBackground from "@/components/learning/GamifiedEdTechBackground";


// Progressive Reward & Milestone Icon Sequence
const PROGRESSIVE_ICONS = [
  { icon: Rocket, name: "রকেট স্টার্ট", color: "text-amber-300", bg: "from-amber-500 to-rose-500", border: "border-b-rose-800", shadow: "#9f1239" },
  { icon: Zap, name: "এনার্জি পাওয়ার", color: "text-yellow-300", bg: "from-yellow-400 to-amber-600", border: "border-b-amber-800", shadow: "#92400e" },
  { icon: Shield, name: "গোল্ডেন শিল্ড", color: "text-emerald-300", bg: "from-emerald-400 to-teal-600", border: "border-b-teal-800", shadow: "#115e59" },
  { icon: Gem, name: "ডায়মন্ড মাস্টার", color: "text-cyan-300", bg: "from-cyan-400 to-blue-600", border: "border-b-blue-800", shadow: "#1e40af" },
  { icon: Target, name: "বুলসআই টার্গেট", color: "text-rose-300", bg: "from-rose-400 to-pink-600", border: "border-b-pink-800", shadow: "#9d174d" },
  { icon: Star, name: "সুপার স্টার", color: "text-amber-200", bg: "from-amber-400 to-orange-600", border: "border-b-orange-800", shadow: "#9a3412" },
  { icon: Crown, name: "মাস্টার ক্রাউন", color: "text-purple-300", bg: "from-purple-500 to-indigo-600", border: "border-b-indigo-800", shadow: "#3730a3" },
  { icon: Trophy, name: "গ্র্যান্ড ট্রফি", color: "text-yellow-200", bg: "from-amber-400 to-yellow-600", border: "border-b-yellow-800", shadow: "#854d0e" },
];

interface CurvedPathwayRoadmapProps {
  items: (ChapterContentItemData | EnrichedContentItem)[];
  activeItemId: number | null;
  onSelectItem: (item: ChapterContentItemData) => void;
  onLockedClick?: (item: ChapterContentItemData, reason: string) => void;
  progressPercentage?: number;
  completedCount?: number;
  totalCount?: number;
}

export function CurvedPathwayRoadmap({
  items,
  activeItemId,
  onSelectItem,
  onLockedClick,
  progressPercentage = 0,
  completedCount = 0,
  totalCount = 0,
}: CurvedPathwayRoadmapProps) {
  // Active milestone index tracking
  const activeIndex = items.findIndex((it) => it.id === activeItemId);

  return (
    <div className="w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Gamified EdTech Background: Floating Gadgets, Luminous Energy Grid & Quiz Formulas */}
      <GamifiedEdTechBackground variant="roadmap" showGadgets={true} showQuizFormulas={true} />


      {/* Roadmap Header & Progress Bar */}
      <div className="space-y-2.5 pb-3.5 border-b border-slate-200 dark:border-slate-800 relative z-10">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <span>শিক্ষণ রোডম্যাপ</span>
          </span>
          <span className="font-mono text-emerald-600 dark:text-cyan-400 font-extrabold text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-cyan-950/50 border border-emerald-200 dark:border-cyan-800">
            {progressPercentage}% সম্পন্ন
          </span>
        </div>

        {/* Sleek Progress Track */}
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold">
          <span>
            ধাপ {activeIndex >= 0 ? activeIndex + 1 : 1} / {items.length}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-black">
            {completedCount}/{totalCount || items.length} পাঠ শেষ ✨
          </span>
        </div>
      </div>

      {/* Serpentine Zigzag SVG Road Container */}
      <div className="py-2 px-1 relative z-10">
        <div className="max-w-[280px] sm:max-w-xs mx-auto space-y-9 relative">
          {items.map((item, idx) => {
            const enriched = item as Partial<EnrichedContentItem>;
            const isQuiz = item.itemType === "QUIZ";

            // Determine passed / locked / active state
            // Once an item is completed, it is PERMANENTLY passed and will NEVER be re-locked!
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

            // Strict Forward Locking: Completed items are NEVER locked.
            // Incomplete items are unlocked ONLY IF the previous item was passed (or it's step 1)
            const isLocked = !isPassed && (enriched.isLocked !== undefined ? enriched.isLocked : !prevItemPassed);

            const isCurrentActive = item.id === activeItemId;
            const isCurrentNext = enriched.isCurrentNextStep || (!isPassed && !isLocked);

            // Progressive icon for this step
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
              onSelectItem(item);
            };

            return (
              <React.Fragment key={item.id}>
                <div className={`flex ${alignClass} relative z-10`}>
                  {/* Duolingo Milestone Node */}
                  <div className="flex flex-col items-center group relative">
                    {/* Floating Speech Bubble for Current Active Step */}
                    {isCurrentActive && (
                      <motion.div
                        initial={{ y: -4, opacity: 0 }}
                        animate={{ y: [0, -5, 0], opacity: 1 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="mb-2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-cyan-500/30 flex items-center gap-1.5 z-20 cursor-pointer select-none"
                        onClick={handleNodeClick}
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>এখানেই আছো! 🚀</span>
                      </motion.div>
                    )}

                    {/* Subtle Micro-Pulse Ring (ring-4 pulse for active node) */}
                    {isCurrentActive && (
                      <motion.div
                        className="absolute -inset-1.5 rounded-full pointer-events-none z-0 ring-4 ring-cyan-400/60"
                        animate={{
                          opacity: [0.3, 0.9, 0.3],
                          scale: [0.98, 1.08, 0.98],
                        }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                      />
                    )}

                    {/* Milestone Button with Duolingo-style 3D Depth & Teasing Preview */}
                    <button
                      type="button"
                      onClick={handleNodeClick}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-black transition-all relative z-10 select-none cursor-pointer ${
                        isLocked
                          ? "bg-slate-100/90 dark:bg-slate-800/80 text-slate-400 border-2 border-slate-300 dark:border-slate-700 border-b-4 border-b-slate-400 dark:border-b-slate-700 hover:border-amber-400/60 transition-all shadow-xs"
                          : isPassed
                          ? "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white border-2 border-emerald-300 border-b-4 border-b-emerald-800 shadow-[0_4px_0_#065f46,0_0_20px_rgba(16,185,129,0.45)] hover:brightness-110 active:border-b-0 active:translate-y-1 active:shadow-none"
                          : isCurrentActive
                          ? `bg-gradient-to-b ${progressiveData.bg} text-white border-2 border-white/60 border-b-4 ${progressiveData.border} shadow-[0_4px_0_${progressiveData.shadow},0_0_25px_rgba(6,182,212,0.6)] ring-4 ring-cyan-400/40 hover:brightness-110 active:border-b-0 active:translate-y-1 active:shadow-none`
                          : `bg-gradient-to-b from-indigo-500 to-purple-600 text-white border-2 border-indigo-300 border-b-4 border-b-purple-900 shadow-[0_4px_0_#581c87,0_0_15px_rgba(99,102,241,0.35)] hover:brightness-110 active:border-b-0 active:translate-y-1 active:shadow-none`
                      }`}
                      title={isLocked ? `লক করা ধাপ (পূর্ববর্তী পাঠ সম্পন্ন করে আনলক করুন 🔒): ${item.titleBangla}` : item.titleBangla}
                    >
                      {isPassed ? (
                        <div className="relative flex items-center justify-center">
                          <CheckCircle2 className="w-7 h-7 text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-emerald-600 text-[8px] font-black shadow-xs">
                            ✓
                          </span>
                        </div>
                      ) : isLocked ? (
                        <div className="relative flex items-center justify-center">
                          {/* Teasing Locked Milestone Icon with subtle opacity & blur */}
                          <MilestoneIcon className="w-7 h-7 text-slate-400 dark:text-slate-500 opacity-50 blur-[0.5px] group-hover:opacity-75 transition-all" />
                          <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900/90 text-amber-400 shadow-md border border-slate-700">
                            <Lock className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      ) : (
                        <MilestoneIcon className={`w-7 h-7 ${isCurrentActive ? "text-white" : progressiveData.color} filter drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]`} />
                      )}
                    </button>

                    {/* Node Title & Metadata Chip */}
                    <div
                      onClick={handleNodeClick}
                      className="mt-2 text-center max-w-[140px] sm:max-w-[160px] cursor-pointer group-hover:scale-102 transition-transform"
                    >
                      {/* Completed celebration badge */}
                      {isPassed ? (
                        <div className="mb-1 flex items-center justify-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/30 flex items-center gap-1 shadow-xs">
                            <span>✅ সম্পন্ন</span>
                          </span>
                        </div>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                            isLocked
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                              : isCurrentActive
                              ? "bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800"
                              : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                          }`}
                        >
                          {isQuiz
                            ? "🏆 কুইজ"
                            : `${progressiveData.name} · পার্ট ${item.blogPartNumber || idx + 1}`}
                        </span>
                      )}

                      <p className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">
                        {item.titleBangla}
                      </p>

                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                        <span className="font-bold text-amber-500 flex items-center gap-0.5">
                          <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>+{item.xpReward} XP</span>
                        </span>
                        {item.durationMinutes && (
                          <>
                            <span>•</span>
                            <span>{item.durationMinutes} মি.</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Curved Serpentine SVG Connector Road to Next Node */}
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
                          strokeWidth="2"
                          strokeLinecap="round"
                        />

                        {/* Completed Solid Sleek Track (Thin 2.5px) */}
                        {isPassed && (
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            className="filter drop-shadow-[0_0_3px_rgba(16,185,129,0.5)]"
                          />
                        )}

                        {/* Active Electric Glowing SVG Animation Line */}
                        {isElectricActive && (
                          <>
                            {/* Glowing Electric Underlayer */}
                            <path
                              d={pathD}
                              fill="none"
                              stroke={`url(#road-grad-${item.id})`}
                              strokeWidth="3"
                              strokeLinecap="round"
                              opacity="0.6"
                              filter={`url(#electric-glow-${item.id})`}
                            />

                            {/* Flowing Electric Lightning Pulse Line */}
                            <path
                              d={pathD}
                              fill="none"
                              stroke={`url(#road-grad-${item.id})`}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeDasharray="8 6"
                              className="animate-svg-dash-flow filter drop-shadow-[0_0_5px_rgba(6,182,212,0.9)]"
                            >
                              <animate
                                attributeName="stroke-dashoffset"
                                from="28"
                                to="0"
                                dur="1.2s"
                                repeatCount="indefinite"
                              />
                            </path>

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
        </div>
      </div>
    </div>
  );
}
