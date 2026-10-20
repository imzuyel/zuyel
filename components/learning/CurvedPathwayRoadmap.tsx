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
} from "lucide-react";
import {
  ChapterContentItemData,
  EnrichedContentItem,
} from "@/lib/chapterLearningEngine";

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
  // Find index of the currently active item
  const activeIndex = items.findIndex((it) => it.id === activeItemId);

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-6">
      {/* Roadmap Header & Progress Bar */}
      <div className="space-y-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span>কার্ভড লার্নিং রোডম্যাপ (Curved Pathway)</span>
          </span>
          <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold text-[11px]">
            {progressPercentage}% সম্পন্ন
          </span>
        </div>

        {/* Sleek Progress Track */}
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            ধাপ {activeIndex >= 0 ? activeIndex + 1 : 1} / {items.length}
          </span>
          <span>
            {completedCount}/{totalCount || items.length} পাঠ শেষ
          </span>
        </div>
      </div>

      {/* Serpentine Zigzag SVG Road Container */}
      <div className="py-2 px-1 relative">
        <div className="max-w-[280px] sm:max-w-xs mx-auto space-y-8 relative">
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

            // Serpentine Zigzag Horizontal Alternation: [Center, Left, Center, Right]
            const alignments = [
              "justify-center",
              "justify-start pl-4 sm:pl-6",
              "justify-center",
              "justify-end pr-4 sm:pr-6",
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
                        animate={{ y: [0, -4, 0], opacity: 1 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="mb-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 z-20 cursor-pointer select-none"
                        onClick={handleNodeClick}
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>এখানেই আছো! 🚀</span>
                      </motion.div>
                    )}

                    {/* Subtle Micro-Pulse Ring (ring-2, sleek 6px pulse) */}
                    {isCurrentActive && (
                      <motion.div
                        className="absolute -inset-1 rounded-full pointer-events-none z-0 ring-2 ring-cyan-500/50"
                        animate={{
                          opacity: [0.4, 0.9, 0.4],
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      />
                    )}

                    {/* Milestone Button (w-12 h-12 sm:w-14 sm:h-14) */}
                    <button
                      type="button"
                      onClick={handleNodeClick}
                      disabled={isLocked}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black transition-all relative z-10 border-2 select-none ${
                        isLocked
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-70"
                          : isPassed
                          ? "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-sm border-emerald-500 cursor-pointer hover:scale-105 active:scale-95"
                          : isCurrentActive
                          ? "bg-gradient-to-b from-cyan-500 to-indigo-600 text-white border-cyan-300 ring-2 ring-cyan-500/40 shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                          : "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-400 shadow-xs cursor-pointer hover:scale-105 active:scale-95"
                      }`}
                      title={isLocked ? `লক করা ধাপ (Locked 🔒)` : item.titleBangla}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-5 h-5 text-white filter drop-shadow-xs" />
                      ) : isCurrentActive ? (
                        isQuiz ? (
                          <Award className="w-5 h-5 text-white filter drop-shadow-xs" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-white filter drop-shadow-xs" />
                        )
                      ) : isLocked ? (
                        <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      ) : (
                        <span className="text-xs font-black">{idx + 1}</span>
                      )}
                    </button>

                    {/* Node Title & Metadata Chip */}
                    <div
                      onClick={handleNodeClick}
                      className="mt-2 text-center max-w-[140px] sm:max-w-[160px] cursor-pointer group-hover:scale-102 transition-transform"
                    >
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                          isLocked
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                            : isCurrentActive
                            ? "bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800"
                            : isPassed
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {isQuiz
                          ? "কুইজ"
                          : `ব্লগ পার্ট ${item.blogPartNumber || idx + 1}`}
                      </span>

                      <p className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">
                        {item.titleBangla}
                      </p>

                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                        <span className="font-bold text-amber-500">
                          +{item.xpReward} XP
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
