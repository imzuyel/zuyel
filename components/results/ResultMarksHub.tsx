"use client";

import React, { useState } from "react";
import {
  Award,
  Edit3,
  FileSpreadsheet,
  Search,
  ShieldCheck,
  BarChart3,
  Layers,
} from "lucide-react";
import MarksEntryView from "./MarksEntryView";
import ClassTabulationSheet from "./ClassTabulationSheet";
import PublicResultPortal from "./PublicResultPortal";
import ResultAuditTrailView from "./ResultAuditTrailView";
import ExamMarksVisualSummary from "./ExamMarksVisualSummary";
import ResultLifecycleManager from "./ResultLifecycleManager";

type ResultHubTab = "entry" | "summary" | "tabulation" | "lifecycle" | "public" | "audit";

export default function ResultMarksHub() {
  const [activeTab, setActiveTab] = useState<ResultHubTab>("entry");

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 print:hidden">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("entry")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition whitespace-nowrap ${
              activeTab === "entry"
                ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30"
                : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Edit3 className="w-4 h-4" />
            ১. নম্বর এন্ট্রি ও ধারাবাহিক মূল্যায়ন (Marks Entry)
          </button>

          <button
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "summary"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            ২. ভিজ্যুয়াল গ্রেড সামারি (Visual Summary)
          </button>

          <button
            onClick={() => setActiveTab("tabulation")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "tabulation"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            ৩. ফলাফল শিট ও মেরিট তালিকা
          </button>

          <button
            onClick={() => setActiveTab("lifecycle")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "lifecycle"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            ৪. ফলাফল জেনারেশন ও লাইফসাইকেল
          </button>

          <button
            onClick={() => setActiveTab("public")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "public"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Search className="w-4 h-4" />
            ৫. পাবলিক রেজাল্ট সার্চ ও গেজেট
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "audit"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            ৬. সংশোধন ও অডিট হিস্ট্রি
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "entry" && <MarksEntryView />}
        {activeTab === "summary" && <ExamMarksVisualSummary onNavigateToEntry={() => setActiveTab("entry")} />}
        {activeTab === "tabulation" && <ClassTabulationSheet />}
        {activeTab === "lifecycle" && <ResultLifecycleManager />}
        {activeTab === "public" && <PublicResultPortal />}
        {activeTab === "audit" && <ResultAuditTrailView />}
      </div>
    </div>
  );
}
