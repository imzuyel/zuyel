"use client";

import React from "react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import PresentationViewer from "@/components/learning/PresentationViewer";

export default function PresentationsPage() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between">
      <PublicHeader />
      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <PresentationViewer />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
