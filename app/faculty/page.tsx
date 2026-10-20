"use client";

import React from "react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import FacultyStaffView from "@/components/home/FacultyStaffView";
import { Users } from "lucide-react";

export default function FacultyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      <PublicHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-indigo-950 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 backdrop-blur-md rounded-full text-cyan-300 text-[11px] sm:text-xs font-bold font-mono">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>FACULTY & STAFF DIRECTORY</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              সম্মানিত শিক্ষক ও কর্মকর্তা-কর্মচারীবৃন্দ
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের সম্মানিত অধ্যক্ষ, প্রধান শিক্ষক, চীফ ইন্সট্রাক্টর, ইন্সট্রাক্টর ও কর্মচারীবৃন্দের পরিচিতি এবং প্রাতিষ্ঠানিক তথ্য।
            </p>
          </div>
        </div>

        {/* Public Directory View */}
        <FacultyStaffView />
      </main>

      <PublicFooter />
    </div>
  );
}
