"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import StudentIdCardStudio from "@/components/documents/StudentIdCardStudio";
import StudentIdHub from "@/components/students/StudentIdHub";
import Link from "next/link";
import { CreditCard, Users, ShieldCheck, Printer, Sparkles, Layers } from "lucide-react";

export default function StudentIdCardsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"cards" | "hub">("cards");

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
          {/* Breadcrumb & Navigation Bar */}
          <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Link href="/admin" className="hover:text-cyan-500 transition">
                অ্যাডমিন ড্যাশবোর্ড
              </Link>
              <span>/</span>
              <Link href="/students" className="hover:text-cyan-500 transition">
                শিক্ষার্থী ব্যবস্থাপনা
              </Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-bold">স্মার্ট কিউআর আইডি কার্ড জেনারেটর</span>
            </div>

            {/* View Switcher Tabs & Back Link */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <div className="p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-1 shadow-2xs">
                <button
                  onClick={() => setActiveTab("cards")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === "cards"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>১. আইডি কার্ড স্টুডিও ও বাল্ক প্রিন্ট</span>
                </button>

                <button
                  onClick={() => setActiveTab("hub")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === "hub"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>২. প্রাতিষ্ঠানিক আইডি হাব ও অডিট</span>
                </button>
              </div>

              <Link
                href="/students"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition flex items-center gap-1.5 shadow-2xs"
              >
                <Users className="w-3.5 h-3.5" />
                <span>শিক্ষার্থী তালিকা</span>
              </Link>
            </div>
          </div>

          {/* Render Active View */}
          <div className="max-w-7xl mx-auto">
            {activeTab === "cards" ? <StudentIdCardStudio /> : <StudentIdHub />}
          </div>
        </div>
      </div>
    </div>
  );
}
