"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import BtebTabulationSheetStudio from "@/components/examination/BtebTabulationSheetStudio";
import Link from "next/link";
import { Award, Calendar, Layers } from "lucide-react";

export default function TabulationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen max-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 h-screen sticky top-0 overflow-hidden">
        <HierarchicalSidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 w-64 h-full bg-white dark:bg-slate-950 shadow-2xl">
            <HierarchicalSidebar isCollapsed={false} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onNavigate={() => {}} />

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          {/* Breadcrumb / Top Bar */}
          <div className="max-w-7xl mx-auto mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Link href="/admin" className="hover:text-cyan-500 transition">
                অ্যাডমিন ড্যাশবোর্ড
              </Link>
              <span>/</span>
              <Link href="/examination" className="hover:text-cyan-500 transition">
                পরীক্ষা ব্যবস্থাপনা
              </Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-bold">বিটিইবি ট্যাবুলেশন শিট</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/examination"
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition flex items-center gap-1.5 shadow-2xs"
              >
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>পরীক্ষা হাব ও শিডিউল</span>
              </Link>
            </div>
          </div>

          {/* Main Tabulation Studio */}
          <BtebTabulationSheetStudio />
        </div>
      </div>
    </div>
  );
}
