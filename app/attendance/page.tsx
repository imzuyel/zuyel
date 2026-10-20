"use client";

import React, { useState, Suspense } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import AdvancedAttendanceKhata, { StreamlinedAttendanceTab } from "@/components/attendance/AdvancedAttendanceKhata";
import Link from "next/link";
import { CalendarCheck, Smartphone, FileSpreadsheet, Printer, BookOpen } from "lucide-react";
import { useSearchParams } from "next/navigation";

function AttendanceContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: StreamlinedAttendanceTab =
    tabParam === "yearly" || tabParam === "annual" || tabParam === "longterm" || tabParam === "bteb-annual"
      ? "yearly"
      : tabParam === "weekly"
      ? "weekly"
      : tabParam === "monthly"
      ? "monthly"
      : tabParam === "report" || tabParam === "analytics"
      ? "report"
      : tabParam === "staff" || tabParam === "teacher"
      ? "staff"
      : "daily";

  return <AdvancedAttendanceKhata initialTab={initialTab} />;
}

export default function AttendancePage() {
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

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          {/* Breadcrumb & Navigation Bar */}
          <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Link href="/admin" className="hover:text-cyan-500 transition">
                অ্যাডমিন ড্যাশবোর্ড
              </Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-bold">
                হাজিরা ও রেজিস্টার ব্যবস্থাপনা (Attendance Hub)
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>BTEB অফিসিয়াল রেজিস্টার</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>কারিকুলাম ২০২৬</span>
              </span>
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<div className="p-8 text-center text-slate-500">লোড হচ্ছে...</div>}>
              <AttendanceContent />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
