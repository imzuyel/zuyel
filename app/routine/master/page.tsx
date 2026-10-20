"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import PtscMasterRoutineStudio from "@/components/routine/PtscMasterRoutineStudio";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import Link from "next/link";
import { Calendar } from "lucide-react";

export default function RoutineMasterPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen max-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 h-screen sticky top-0 overflow-hidden">
        <HierarchicalSidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 w-64 h-full bg-white dark:bg-slate-950 shadow-2xl">
            <HierarchicalSidebar isCollapsed={false} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onNavigate={() => {}} />

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Link href="/admin" className="hover:text-cyan-400 transition">
                অ্যাডমিন ড্যাশবোর্ড
              </Link>
              <span>/</span>
              <span className="text-white font-bold">মাস্টার রুটিন স্টুডিও (Phase 2 - Dual Perspective & CRUD)</span>
            </div>
          </div>

          <ErrorBoundary name="মাস্টার রুটিন স্টুডিও">
            <PtscMasterRoutineStudio />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
