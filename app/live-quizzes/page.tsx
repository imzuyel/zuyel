"use client";

import React, { useState, Suspense } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import LiveQuizPortal from "@/components/quiz/LiveQuizPortal";
import UnifiedQuizMentimeterWorkspace from "@/components/quiz/UnifiedQuizMentimeterWorkspace";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Radio, Sparkles, BookOpen, Layers, Trophy, Plus, Shield } from "lucide-react";

function LiveQuizzesContent() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams ? searchParams.get("tab") : null;
  const initialSection = (
    requestedTab === "question_bank" ||
    requestedTab === "create_quiz" ||
    requestedTab === "my_quizzes" ||
    requestedTab === "ai_generator" ||
    requestedTab === "tournaments"
      ? requestedTab
      : "dashboard"
  ) as any;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);

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
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href="/live-quizzes?tab=dashboard"
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                    initialSection === "dashboard"
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>কুইজ এরিনা</span>
                </Link>

                <Link
                  href="/live-quizzes?tab=create_quiz"
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                    initialSection === "create_quiz"
                      ? "bg-purple-600 text-white border-purple-500"
                      : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI স্টুডিও</span>
                </Link>

                <Link
                  href="/live-quizzes?tab=question_bank"
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                    initialSection === "question_bank"
                      ? "bg-cyan-600 text-white border-cyan-500"
                      : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>প্রশ্ন ব্যাংক</span>
                </Link>

                <Link
                  href="/live-quizzes?tab=tournaments"
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                    initialSection === "tournaments"
                      ? "bg-amber-600 text-white border-amber-500"
                      : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>টুর্নামেন্ট</span>
                </Link>

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

          {/* Unified Quiz & Mentimeter Master Studio Engine */}
          <div className="w-full">
            <UnifiedQuizMentimeterWorkspace
              initialTab={
                requestedTab === "create_quiz" || requestedTab === "ai_generator"
                  ? "builder"
                  : requestedTab === "question_bank"
                  ? "bank"
                  : requestedTab === "tournaments"
                  ? "tournaments"
                  : "host"
              }
              onLiveStateChange={(live) => setIsLiveActive(live)}
              onExitLive={() => setIsLiveActive(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveQuizzesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span>লাইভ কুইজ হাব লোড হচ্ছে...</span>
          </div>
        </div>
      }
    >
      <LiveQuizzesContent />
    </Suspense>
  );
}
