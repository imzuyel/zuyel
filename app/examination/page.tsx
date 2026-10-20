"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import BtebTabulationSheetStudio from "@/components/examination/BtebTabulationSheetStudio";
import ExaminationManagementView from "@/components/examination/ExaminationManagementView";
import BtebAnnualLongTermRegisterView from "@/components/academic/BtebAnnualLongTermRegisterView";
import Link from "next/link";
import { Award, FileSpreadsheet, Calendar, BookOpen } from "lucide-react";

export default function ExaminationHubPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"tabulation" | "management" | "annual_ledger">("tabulation");

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
          {/* Top Switcher Bar */}
          <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Link href="/admin" className="hover:text-cyan-500 transition">
                অ্যাডমিন ড্যাশবোর্ড
              </Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-bold">পরীক্ষা ও বিটিইবি মূল্যায়ন হাব</span>
            </div>

            {/* View Switcher Tabs */}
            <div className="p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-1 shadow-2xs self-start sm:self-auto flex-wrap">
              <button
                onClick={() => setActiveTab("tabulation")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "tabulation"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>১. ট্যাবুলেশন শিট</span>
              </button>

              <button
                onClick={() => setActiveTab("management")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "management"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>২. পরীক্ষা সূচি</span>
              </button>

              <button
                onClick={() => setActiveTab("annual_ledger")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "annual_ledger"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>৩. BTEB বার্ষিক দীর্ঘমেয়াদী খাতা</span>
              </button>
            </div>
          </div>

          {/* Render Active View */}
          {activeTab === "tabulation" ? (
            <BtebTabulationSheetStudio />
          ) : activeTab === "management" ? (
            <ExaminationManagementView />
          ) : (
            <BtebAnnualLongTermRegisterView />
          )}
        </div>
      </div>
    </div>
  );
}
