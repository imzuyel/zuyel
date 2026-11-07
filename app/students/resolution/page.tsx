"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import StudentManagementView from "@/components/students/StudentManagementView";
import Link from "next/link";
import { Sparkles, Users, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StudentDataResolutionPage() {
  const router = useRouter();
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
              <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>ডাটা রেজোলিউশন ও মার্জ স্টুডিও</span>
              </span>
            </div>

            {/* Quick Action Links */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/students"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition flex items-center gap-2 border border-slate-200 dark:border-slate-700"
              >
                <Users className="w-4 h-4 text-emerald-500" />
                <span>শিক্ষার্থী ডিরেক্টরি</span>
              </Link>
              <Link
                href="/students/id-cards"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white transition flex items-center gap-2 shadow-sm"
              >
                <CreditCard className="w-4 h-4" />
                <span>আইডি কার্ড জেনারেটর</span>
              </Link>
            </div>
          </div>

          {/* Student Management View with Resolution Studio Active Initially */}
          <StudentManagementView
            initialSubTab="resolution"
            onNavigateToIdHub={() => router.push("/students/id-cards")}
            onNavigateToResults={() => router.push("/examination/tabulation")}
          />
        </div>
      </div>
    </div>
  );
}

