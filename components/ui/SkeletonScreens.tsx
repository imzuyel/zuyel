"use client";

import React from "react";
import { Loader2, Sparkles, FileText, Award, Calendar, ChevronRight, Download } from "lucide-react";

/**
 * Base Shimmer Box with animated gradient sweep
 */
export function SkeletonBox({
  className = "",
  rounded = "rounded-xl",
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200/80 dark:bg-slate-800/80 ${rounded} ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmerSlide_1.6s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-slate-700/50 to-transparent" />
    </div>
  );
}

/**
 * Skeleton for Notice Cards Grid
 */
export function NoticeCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-xs"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SkeletonBox className="w-4 h-4" rounded="rounded-md" />
                <SkeletonBox className="w-24 h-3.5" rounded="rounded-md" />
              </div>
              <SkeletonBox className="w-20 h-5" rounded="rounded-md" />
            </div>
            <SkeletonBox className="w-3/4 h-5" rounded="rounded-md" />
            <div className="space-y-1.5 pt-1">
              <SkeletonBox className="w-full h-3" rounded="rounded-sm" />
              <SkeletonBox className="w-5/6 h-3" rounded="rounded-sm" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <SkeletonBox className="w-28 h-3" rounded="rounded-sm" />
            <SkeletonBox className="w-16 h-4" rounded="rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for Downloads Hub items
 */
export function DownloadsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-start gap-3.5 flex-1">
            <SkeletonBox className="w-10 h-10 shrink-0" rounded="rounded-xl" />
            <div className="space-y-2 flex-1">
              <SkeletonBox className="w-48 sm:w-72 h-4" rounded="rounded-md" />
              <div className="flex items-center gap-3">
                <SkeletonBox className="w-20 h-3" rounded="rounded-sm" />
                <SkeletonBox className="w-16 h-3" rounded="rounded-sm" />
                <SkeletonBox className="w-24 h-3" rounded="rounded-sm" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBox className="w-24 h-8" rounded="rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for Result Marksheet in PublicResultPortal
 */
export function MarksheetSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden text-xs animate-in fade-in duration-300">
      {/* Print Action Header Skeleton */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SkeletonBox className="w-5 h-5" rounded="rounded-full" />
          <SkeletonBox className="w-48 h-4" rounded="rounded-md" />
        </div>
        <SkeletonBox className="w-32 h-8" rounded="rounded-xl" />
      </div>

      {/* Marksheet Body Skeleton */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Institution Header Skeleton */}
        <div className="text-center space-y-2 border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col items-center">
          <SkeletonBox className="w-72 sm:w-96 h-6" rounded="rounded-lg" />
          <SkeletonBox className="w-48 h-3.5" rounded="rounded-md" />
          <SkeletonBox className="w-64 h-5 mt-1" rounded="rounded-full" />
        </div>

        {/* Student Info Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <SkeletonBox className="w-16 h-2.5" rounded="rounded-xs" />
              <SkeletonBox className="w-28 h-4" rounded="rounded-md" />
            </div>
          ))}
        </div>

        {/* Table Rows Skeleton */}
        <div className="space-y-2">
          <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center px-4 justify-between">
            <SkeletonBox className="w-32 h-3" rounded="rounded-sm" />
            <SkeletonBox className="w-24 h-3" rounded="rounded-sm" />
            <SkeletonBox className="w-16 h-3" rounded="rounded-sm" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-11 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center px-4 justify-between"
            >
              <SkeletonBox className="w-40 sm:w-56 h-3.5" rounded="rounded-md" />
              <SkeletonBox className="w-16 h-3" rounded="rounded-sm" />
              <SkeletonBox className="w-12 h-5" rounded="rounded-md" />
            </div>
          ))}
        </div>

        {/* Bottom GPA Banner Skeleton */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
          <div className="space-y-1.5">
            <SkeletonBox className="w-32 h-4" rounded="rounded-md" />
            <SkeletonBox className="w-44 h-3" rounded="rounded-sm" />
          </div>
          <SkeletonBox className="w-20 h-10" rounded="rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Photo Gallery Grid
 */
export function GalleryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800"
        >
          <div className="absolute inset-0 -translate-x-full animate-[shimmerSlide_1.6s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-slate-700/40 to-transparent" />
        </div>
      ))}
    </div>
  );
}

/**
 * Consistent Inline Loading Spinner for Buttons & Inputs
 */
export function InlineLoadingSpinner({
  text = "কাজ চলছে...",
  size = "md",
}: {
  text?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }[size];

  return (
    <div className="inline-flex items-center gap-2">
      <Loader2 className={`${sizeMap} animate-spin shrink-0 text-current`} />
      {text && <span className="font-semibold text-xs sm:text-sm">{text}</span>}
    </div>
  );
}

/**
 * Global Loading Overlay with Glassmorphism
 */
export function AsyncLoadingModal({
  show,
  title = "তথ্য প্রক্রিয়াকরণ হচ্ছে...",
  description = "অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন",
}: {
  show: boolean;
  title?: string;
  description?: string;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 text-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-[0_0_50px_rgba(6,182,212,0.4)] relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-28 h-28 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative mx-auto w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="absolute w-3 h-3 rounded-full bg-cyan-300 animate-ping" />
        </div>

        <div className="space-y-1 relative z-10">
          <h3 className="font-extrabold text-base text-white flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>{title}</span>
          </h3>
          <p className="text-xs text-slate-300">{description}</p>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full w-2/3 animate-[shimmerSlide_1.5s_infinite]" />
        </div>
      </div>
    </div>
  );
}
