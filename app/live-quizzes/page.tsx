"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import LiveQuizPortal from "@/components/quiz/LiveQuizPortal";
import Link from "next/link";
import { Radio, Sparkles, BookOpen, Layers, Trophy } from "lucide-react";

export default function LiveQuizzesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"lobby" | "question_bank" | "ai_generator">("lobby");

  return (
    <div className="flex h-screen max-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Desktop Sidebar (hidden when in active fullscreen live session for maximum projection immersion) */}
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
          {/* Top Quick Breadcrumb and Navigation (only in setup mode) */}
          {!isLiveActive && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Link href="/admin" className="hover:text-cyan-400 transition">
                  অ্যাডমিন ড্যাশবোর্ড
                </Link>
                <span>/</span>
                <span className="text-white font-bold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  লাইভ মাল্টিপ্লেয়ার কুইজ ও অ্যাসেসমেন্ট হাব
                </span>
              </div>

              {/* Direct Quick-links to Modes */}
              <div className="flex items-center gap-2">
                <Link
                  href="/quiz/join"
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <span>শিক্ষার্থী জয়েন ভিউ ↗</span>
                </Link>
              </div>
            </div>
          )}

          {/* Interactive Live Quiz Portal Engine */}
          <div className="max-w-7xl mx-auto">
            <LiveQuizPortal
              initialSection="dashboard"
              onLiveStateChange={(live) => setIsLiveActive(live)}
              onExitLive={() => setIsLiveActive(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
