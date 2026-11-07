"use client";

import React from "react";
import Link from "next/link";
import { BrainCircuit, ChevronRight, ArrowLeft } from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import ClassWeakTopicAnalytics from "@/components/learning/ClassWeakTopicAnalytics";

export default function TeacherAnalyticsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <PublicHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-indigo-600 transition-colors">
              হোম
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/results" className="hover:text-indigo-600 transition-colors">
              ফলাফল ও মূল্যায়ন
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 dark:text-slate-200 font-bold">
              শিক্ষক অ্যানালিটিক্স ও ট্র্যাকিং
            </span>
          </nav>

          <Link
            href="/results/at-risk"
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition flex items-center gap-1.5"
          >
            <span>🚨 ঝুঁকিপূর্ণ শিক্ষার্থী তালিকা</span>
          </Link>
        </div>

        {/* Analytics Hub */}
        <ClassWeakTopicAnalytics initialTab="overview" />
      </main>

      <PublicFooter />
    </div>
  );
}

