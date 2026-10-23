"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, Layers } from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import SimplifiedAcademicMappingView from "@/components/academic/SimplifiedAcademicMappingView";

export default function AcademicSettingsPage() {
  const router = useRouter();

  // Redirect legacy /academic/settings to unified /academic/mapping
  useEffect(() => {
    router.replace("/academic/mapping");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <PublicHeader />

      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-cyan-400 flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>হোম</span>
            </Link>
            <span>/</span>
            <Link href="/academic/mapping" className="text-cyan-400 font-semibold">
              সেন্ট্রাল একাডেমিক ম্যাপিং
            </Link>
          </div>

          <Link
            href="/admin?tab=classes_trades"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>এডমিন একাডেমিক সেটআপ</span>
          </Link>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SimplifiedAcademicMappingView />
      </main>

      <PublicFooter />
    </div>
  );
}
