"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import AIQuestionGenerator from "@/components/quiz/AIQuestionGenerator";
import Link from "next/link";
import { Sparkles, Bot, Radio, FileText, ArrowRight } from "lucide-react";

export default function AiGeneratorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen max-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 h-screen sticky top-0 overflow-hidden border-r border-slate-800/80">
        <HierarchicalSidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {sidebarOpen && (
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
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onNavigate={() => {}} />

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Navigation Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Link href="/admin" className="hover:text-cyan-400 transition">
                  অ্যাডমিন ড্যাশবোর্ড
                </Link>
                <span>/</span>
                <Link href="/live-quizzes" className="hover:text-cyan-400 transition">
                  কুইজ হাব
                </Link>
                <span>/</span>
                <span className="text-white font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  এআই প্রশ্ন জেনারেটর ও কারিকুলাম পাইপলাইন
                </span>
              </div>

              {/* Quick Switch to Live Lobby & AI Studio */}
              <div className="flex items-center gap-2">
                <Link
                  href="/live-quizzes?tab=create_quiz"
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>ইন্টারঅ্যাক্টিভ এআই কুইজ স্টুডিও</span>
                </Link>
                <Link
                  href="/live-quizzes"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 text-emerald-300 text-xs font-bold transition flex items-center gap-2"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>লাইভ লবি</span>
                </Link>
                <Link
                  href="/ai/pdf-manager"
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 text-cyan-300 text-xs font-bold transition flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>পিডিএফ রিপোজিটরি</span>
                </Link>
              </div>
            </div>

            {/* AI Question Generator Component */}
            <AIQuestionGenerator />
          </div>
        </div>
      </div>
    </div>
  );
}
