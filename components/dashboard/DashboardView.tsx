"use client";

import React from "react";
import CleanDashboardView from "./CleanDashboardView";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-4 sm:p-6" aria-label="Loading dashboard data">
      <div className="h-16 rounded-3xl bg-slate-200 dark:bg-slate-800/60 w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
        ))}
      </div>
    </div>
  );
}

interface DashboardViewProps {
  onNavigate?: (tab: string) => void;
}

export default function DashboardView({ onNavigate = () => {} }: DashboardViewProps) {
  return <CleanDashboardView onNavigate={onNavigate} />;
}
