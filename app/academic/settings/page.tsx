"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, Sliders, ShieldCheck } from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import GlobalSettingsSubjectMappingHub from "@/components/academic/GlobalSettingsSubjectMappingHub";

export default function AcademicSettingsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <PublicHeader />

      {/* Breadcrumb Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-cyan-400 flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>হোম</span>
            </Link>
            <span>/</span>
            <Link href="/academic" className="hover:text-cyan-400">
              একাডেমিক
            </Link>
            <span>/</span>
            <span className="text-white font-semibold">গ্লোবাল সেটিংস ও বিষয় ম্যাপিং</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>এডমিন ড্যাশবোর্ড</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Hub Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <GlobalSettingsSubjectMappingHub />
      </main>

      <PublicFooter />
    </div>
  );
}
