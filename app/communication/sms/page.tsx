"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import GuardianSmsStudio from "@/components/communication/GuardianSmsStudio";
import NoticeManagementView from "@/components/communication/NoticeManagementView";
import Link from "next/link";
import { MessageSquare, Bell, Calendar, Sparkles } from "lucide-react";

export default function CommunicationSmsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"sms" | "notices">("sms");

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
              <span className="text-slate-900 dark:text-white font-bold">যোগাযোগ ও নোটিশ হাব</span>
              <span>/</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">এসএমএস গেটওয়ে</span>
            </div>

            {/* View Switcher Tabs */}
            <div className="p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-1 shadow-2xs self-start sm:self-auto">
              <button
                onClick={() => setActiveTab("sms")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "sms"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>১. অভিভাবক এসএমএস গেটওয়ে</span>
              </button>

              <button
                onClick={() => setActiveTab("notices")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "notices"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>২. প্রাতিষ্ঠানিক নোটিশ বোর্ড</span>
              </button>
            </div>
          </div>

          {/* Render Active View */}
          <div className="max-w-7xl mx-auto">
            {activeTab === "sms" ? <GuardianSmsStudio /> : <NoticeManagementView />}
          </div>
        </div>
      </div>
    </div>
  );
}
