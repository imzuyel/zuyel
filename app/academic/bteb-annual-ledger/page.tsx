"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import BtebAnnualLongTermRegisterView from "@/components/academic/BtebAnnualLongTermRegisterView";
import Link from "next/link";
import { BookOpen, ShieldCheck, Printer, FileSpreadsheet, ArrowLeft } from "lucide-react";

export default function BtebAnnualLedgerPage() {
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
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 h-full bg-white dark:bg-slate-950 shadow-2xl">
            <HierarchicalSidebar isCollapsed={false} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onNavigate={() => {}} />

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          {/* Breadcrumb & Quick Action Bar */}
          <div className="max-w-7xl mx-auto mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Link href="/admin" className="hover:text-cyan-500 transition flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>অ্যাডমিন ড্যাশবোর্ড</span>
              </Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>BTEB বার্ষিক দীর্ঘমেয়াদী খাতা (Annual Register)</span>
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-black flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>BTEB Official Curriculum 2026</span>
              </span>
              <Link
                href="/print"
                className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট হাব</span>
              </Link>
            </div>
          </div>

          {/* Full BTEB Annual Long Term Register Component */}
          <div className="max-w-7xl mx-auto">
            <BtebAnnualLongTermRegisterView />
          </div>
        </div>
      </div>
    </div>
  );
}
