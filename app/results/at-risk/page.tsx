"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ChevronRight, ArrowLeft } from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import ClassWeakTopicAnalytics from "@/components/learning/ClassWeakTopicAnalytics";

export default function AtRiskStudentsPage() {
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
            <Link href="/results/analytics" className="hover:text-indigo-600 transition-colors">
              অ্যানালিটিক্স
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              ঝুঁকিপূর্ণ শিক্ষার্থী আর্লি-ওয়ার্নিং
            </span>
          </nav>

          <Link
            href="/results/analytics"
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>সার্বিক অ্যানালিটিক্সে ফিরে যান</span>
          </Link>
        </div>

        {/* Analytics Hub focused on At-Risk tab */}
        <ClassWeakTopicAnalytics initialTab="at_risk" />
      </main>

      <PublicFooter />
    </div>
  );
}

