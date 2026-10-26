"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import {
  Layers,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Flame,
  Sparkles,
  Star,
  Lock,
} from "lucide-react";
import { StudentAuthAccount, getStudentCompletedItemIds } from "@/lib/studentIntelligenceStore";

/**
 * Converts Western digits to Bengali numerals cleanly
 */
export function toBanglaDigits(val: number | string): string {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(val).replace(/\d/g, (d) => bn[Number(d)] ?? d);
}

/**
 * Calculates realistic estimated study time for a chapter in Bengali
 */
export function calculateChapterEstimatedTime(chapter: any): string {
  const items = chapter.items || [];
  if (items.length === 0) return "১৫ মিনিট";
  const blogs = items.filter((it: any) => it.itemType === "BLOG_PART").length;
  const quizzes = items.filter((it: any) => it.itemType === "QUIZ").length;
  const totalMinutes = Math.max(blogs * 4 + quizzes * 6, items.length * 4, 10);
  if (totalMinutes < 60) {
    return `${toBanglaDigits(totalMinutes)} মিনিট`;
  }
  const hours = (totalMinutes / 60).toFixed(1);
  return `${toBanglaDigits(hours)} ঘণ্টা`;
}

export interface ChapterCardProps {
  chapter: any;
  idx: number;
  activeStudent?: StudentAuthAccount | null;
  onNavigate: (chapter: any, specificItem?: any) => void;
  isNavigating?: boolean;
}

// Curated colorful gradients for each card accent
const CARD_GRADIENTS = [
  "from-cyan-500 via-indigo-500 to-purple-500",
  "from-indigo-500 via-purple-500 to-pink-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-blue-500 via-cyan-500 to-teal-500",
  "from-fuchsia-500 via-purple-500 to-indigo-500",
];

export function ChapterCard({
  chapter,
  idx,
  activeStudent,
  onNavigate,
  isNavigating = false,
}: ChapterCardProps) {
  const totalItems = chapter.items?.length || chapter.totalItemsCount || 0;
  const estimatedTime = useMemo(() => calculateChapterEstimatedTime(chapter), [chapter]);

  const studentRoll = activeStudent?.rollNumber;

  // True completion percentage calculation:
  // 1. Direct from Task 1 Backend calculation if present
  // 2. Computed from chapter.items and student progress
  // 3. Fallback to client-side localStorage completed item sync
  const { chapterProgressPct, completedItemsCount, isCompleted } = useMemo(() => {
    let completedCount = 0;
    const completedLocalIds = studentRoll ? getStudentCompletedItemIds(studentRoll) : [];

    if (Array.isArray(chapter.items) && chapter.items.length > 0) {
      completedCount = chapter.items.filter((it: any) => {
        const isLocallyDone = completedLocalIds.includes(it.id);
        const prog = it.progress;
        return isLocallyDone || prog?.isPassed || prog?.status === "COMPLETED";
      }).length;
    } else if (typeof chapter.completedItemsCount === "number") {
      completedCount = chapter.completedItemsCount;
    }

    // STRICT DYNAMIC PROGRESS RECALCULATION:
    // (completed_items_count / total_items_count) * 100
    // Never hardcoded or frozen as "completed: true"
    const finalPct = totalItems > 0 ? Math.min(100, Math.max(0, Math.round((completedCount / totalItems) * 100))) : 0;
    const completed = totalItems > 0 && completedCount >= totalItems;

    return {
      chapterProgressPct: finalPct,
      completedItemsCount: completedCount,
      isCompleted: completed,
    };
  }, [chapter, totalItems, studentRoll]);

  const cardGradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
  const isInProgress = chapterProgressPct > 0 && chapterProgressPct < 100;

  // Breakdown of lessons vs quizzes
  const totalBlogs = useMemo(() => {
    return chapter.items?.filter((it: any) => it.itemType === "BLOG_PART").length || 0;
  }, [chapter.items]);

  const totalQuizzes = useMemo(() => {
    return chapter.items?.filter((it: any) => it.itemType === "QUIZ").length || 0;
  }, [chapter.items]);

  // Earned Stars calculation (1-5 stars per completed item)
  const { earnedStars, maxPossibleStars } = useMemo(() => {
    let stars = 0;
    if (Array.isArray(chapter.items) && chapter.items.length > 0) {
      chapter.items.forEach((it: any) => {
        const prog = it.progress;
        if (prog?.isPassed || prog?.status === "COMPLETED") {
          stars += Math.max(1, Math.min(5, Number(prog.stars) || 1));
        }
      });
    } else if (typeof chapter.earnedStars === "number") {
      stars = chapter.earnedStars;
    }
    const max = totalItems > 0 ? totalItems * 5 : 5;
    return {
      earnedStars: stars,
      maxPossibleStars: max,
    };
  }, [chapter, totalItems]);

  // Lock / Unlock status determination
  const isLocked = chapter.isLocked === true;
  const isActiveMission = !isLocked && !isCompleted;

  return (
    <div
      onClick={() => !isNavigating && !isLocked && onNavigate(chapter)}
      className={`group relative rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer ${
        isLocked
          ? "border-slate-300 dark:border-slate-800 opacity-75 cursor-not-allowed shadow-none"
          : isCompleted
          ? "border-emerald-300 dark:border-emerald-800/80 shadow-md hover:shadow-xl hover:-translate-y-1"
          : isActiveMission
          ? "border-cyan-400 dark:border-cyan-500 ring-2 ring-cyan-400/40 dark:ring-cyan-400/30 shadow-[0_0_24px_rgba(6,182,212,0.18)] hover:-translate-y-1"
          : "border-slate-200/80 dark:border-slate-800/80 hover:border-cyan-500/60 shadow-sm hover:shadow-xl hover:-translate-y-1"
      } ${isNavigating ? "opacity-75 pointer-events-none scale-[0.99]" : ""}`}
    >
      {/* Colorful Top Gradient Accent */}
      <div className={`h-2 w-full bg-gradient-to-r ${cardGradient}`} />

      {/* Floating Active Glowing Indicator for Active Mission */}
      {isActiveMission && (
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-20 pointer-events-none">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 shadow-[0_0_8px_#22d3ee]" />
          </span>
          <span className="text-[9.5px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-300 dark:border-cyan-800 shadow-xs">
            সক্রিয় মিশন 🚀
          </span>
        </div>
      )}

      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
        {/* Badges Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-[11px] font-black border border-indigo-200/70 dark:border-indigo-800/60 shadow-xs">
              অধ্যায় {toBanglaDigits(chapter.chapterNumber || idx + 1)}
            </span>

            {/* Lock / Unlock Icon Status Badge */}
            {isLocked ? (
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>লক করা</span>
              </span>
            ) : isCompleted ? (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>সম্পন্ন</span>
              </span>
            ) : null}
          </div>

          {/* Earned Stars Badge (⭐ X / Y) */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/60 text-[11px] font-black shadow-xs">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]" />
            <span>
              {toBanglaDigits(earnedStars)} / {toBanglaDigits(maxPossibleStars)} স্টার
            </span>
          </div>
        </div>

        {/* Chapter Title */}
        <div className="pt-0.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-snug line-clamp-2">
            {chapter.titleBangla}
          </h3>
          {chapter.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 font-medium leading-relaxed">
              {chapter.description}
            </p>
          )}
        </div>

        {/* Total Lessons, Quizzes Breakdown & Estimated Time */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold">
          {/* Lessons & Quizzes Breakdown */}
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200">
            <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none">
                পাঠ ও কুইজ
              </div>
              <div className="text-xs font-black truncate mt-0.5">
                {totalBlogs > 0 || totalQuizzes > 0
                  ? `${toBanglaDigits(totalBlogs)} পাঠ • ${toBanglaDigits(totalQuizzes)} কুইজ`
                  : `${toBanglaDigits(totalItems)} টি ব্লক`}
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200">
            <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none">
                আনুমানিক সময়
              </div>
              <div className="text-xs font-black truncate mt-0.5">
                ⏱ {estimatedTime}
              </div>
            </div>
          </div>
        </div>

        {/* Premium Animated Progress Bar */}
        <div className="pt-1 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>অধ্যায় অগ্রগতি:</span>
              {isCompleted && (
                <CheckCircle2 className="w-3 h-3 text-emerald-500 inline" />
              )}
            </span>
            <span
              className={`font-mono text-xs font-black ${
                isCompleted
                  ? "text-emerald-600 dark:text-emerald-400"
                  : chapterProgressPct > 0
                  ? "text-cyan-600 dark:text-cyan-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {isCompleted
                ? "সম্পন্ন (১০০%) ✨"
                : `${toBanglaDigits(chapterProgressPct)}%`}
            </span>
          </div>

          {/* Premium Animated Track with Glow and Shimmer */}
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-200/70 dark:border-slate-700/70 shadow-inner relative">
            <motion.div
              className={`h-full rounded-full relative overflow-hidden transition-all duration-700 ${
                isCompleted
                  ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 shadow-[0_0_12px_rgba(16,185,129,0.55)]"
                  : "bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-500 shadow-[0_0_10px_rgba(6,182,212,0.45)]"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${chapterProgressPct}%` }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Soft Ambient Animated Shimmer sweep */}
              {chapterProgressPct > 0 && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none -skew-x-12"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                />
              )}
            </motion.div>
          </div>

          {/* Micro Block Summary */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium pt-0.5">
            <span>
              {completedItemsCount > 0 ? (
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {toBanglaDigits(completedItemsCount)} / {toBanglaDigits(totalItems)} ব্লক সম্পন্ন
                </strong>
              ) : (
                <span>০ / {toBanglaDigits(totalItems)} ব্লক</span>
              )}
            </span>
            {isCompleted ? (
              <span className="text-emerald-500 font-black flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 inline" /> অধ্যায় শেষ
              </span>
            ) : isInProgress ? (
              <span className="text-amber-500 font-bold">চলমান শিখন 🔥</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action Footer Button */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <button
          type="button"
          disabled={isNavigating}
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(chapter);
          }}
          className={`w-full py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
            isNavigating
              ? "bg-cyan-500 text-slate-950 shadow-cyan-500/25"
              : isCompleted
              ? "bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 text-white shadow-slate-900/10 hover:shadow-emerald-500/25 active:scale-98"
              : isInProgress
              ? "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-600/20 active:scale-98"
              : "bg-slate-900 dark:bg-slate-800 hover:bg-gradient-to-r hover:from-cyan-600 hover:to-indigo-600 text-white shadow-slate-900/10 hover:shadow-cyan-500/25 active:scale-98"
          }`}
        >
          {isNavigating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>স্প্লিট-স্ক্রিন লোড হচ্ছে...</span>
            </>
          ) : isCompleted ? (
            <>
              <span>পুনরায় অনুশীলন করুন</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </>
          ) : isInProgress ? (
            <>
              <span>শিখন চালিয়ে যান</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </>
          ) : (
            <>
              <span>শিখন শুরু করুন</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ChapterCard;
