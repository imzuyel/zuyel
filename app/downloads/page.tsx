"use client";

import React from "react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import PublicDownloadsHub from "@/components/home/PublicDownloadsHub";

export default function DownloadsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <PublicHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12 space-y-6 sm:space-y-8">
        <PublicDownloadsHub />
      </main>

      <PublicFooter />
    </div>
  );
}
