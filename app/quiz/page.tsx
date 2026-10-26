"use client";

import React, { useState, Suspense } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import UnifiedQuizMentimeterWorkspace from "@/components/quiz/UnifiedQuizMentimeterWorkspace";
import { Radio } from "lucide-react";

function QuizPageContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);

  return (
    <div className="flex h-screen max-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      {!isLiveActive && (
        <div className="hidden lg:block shrink-0 h-screen sticky top-0 overflow-hidden border-r border-slate-800/80">
          <HierarchicalSidebar />
        </div>
      )}

      {/* Mobile Drawer Sidebar */}
      {sidebarOpen && !isLiveActive && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 h-full bg-white dark:bg-slate-950 shadow-2xl">
            <HierarchicalSidebar isCollapsed={false} />
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0 h-screen overflow-hidden">
        {!isLiveActive && (
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onNavigate={() => {}} />
        )}

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-800">
          <UnifiedQuizMentimeterWorkspace
            initialTab="builder"
            onLiveStateChange={(live) => setIsLiveActive(live)}
            onExitLive={() => setIsLiveActive(false)}
          />
        </div>
      </div>
    </div>
  );
}

export default function QuizLandingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span>কুইজ ও মেন্টিমিটার স্টুডিও লোড হচ্ছে...</span>
          </div>
        </div>
      }
    >
      <QuizPageContent />
    </Suspense>
  );
}
