"use client";

import React from "react";

/**
 * Lightweight Skeleton for dynamically loaded archetypes and question types.
 * Ensures zero layout shift (CLS = 0) while chunks are loaded asynchronously.
 */
export const ArchetypeSkeleton = React.memo(function ArchetypeSkeleton({
  title = "টেমপ্লেট লোড হচ্ছে...",
}: {
  title?: string;
}) {
  return (
    <div className="w-full space-y-4 animate-pulse">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-6 w-3/4 bg-slate-300 dark:bg-slate-700 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          />
        ))}
      </div>
    </div>
  );
});

export default ArchetypeSkeleton;
