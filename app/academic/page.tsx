"use client";

import React from "react";
import Link from "next/link";
import {
  Layers,
  Cpu,
  Wifi,
  Zap,
  Scissors,
  BookOpen,
  Calendar,
  Clock,
  Award,
  Download,
  CheckCircle2,
  ChevronRight,
  School,
  Sliders,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import TradeAndLabView from "@/components/academic/TradeAndLabView";
import { AOSReveal } from "@/components/ui/animation-effects";

export default function AcademicPage() {
  const classesList = [
    {
      grade: "ষষ্ঠ শ্রেণি (Class 6)",
      type: "সাধারণ শিক্ষা (General)",
      trades: "ট্রেড প্রযোজ্য নয়",
      shift: "১ম শিফট (সকাল ৮:০০ - দুপুর ১২:৩০)",
      curriculum: "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)",
    },
    {
      grade: "সপ্তম শ্রেণি (Class 7)",
      type: "সাধারণ শিক্ষা (General)",
      trades: "ট্রেড প্রযোজ্য নয়",
      shift: "১ম শিফট (সকাল ৮:০০ - দুপুর ১২:৩০)",
      curriculum: "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)",
    },
    {
      grade: "অষ্টম শ্রেণি (Class 8)",
      type: "সাধারণ ও প্রাক-কারিগরি",
      trades: "ট্রেড প্রযোজ্য নয়",
      shift: "১ম শিফট (সকাল ৮:০০ - দুপুর ১:০০)",
      curriculum: "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)",
    },
    {
      grade: "নবম শ্রেণি (Class 9 - SSC Voc)",
      type: "কারিগরি শিক্ষা (Technical)",
      trades: "৪টি ট্রেড (GE, IT-IoT, EE, AMB)",
      shift: "১ম ও ২য় শিফট",
      curriculum: "বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)",
    },
    {
      grade: "দশম শ্রেণি (Class 10 - SSC Voc)",
      type: "কারিগরি শিক্ষা (Technical)",
      trades: "৪টি ট্রেড (GE, IT-IoT, EE, AMB)",
      shift: "১ম ও ২য় শিফট",
      curriculum: "বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)",
    },
    {
      grade: "একাদশ শ্রেণি (Class 11 - HSC Voc)",
      type: "উচ্চ মাধ্যমিক কারিগরি",
      trades: "৪টি ট্রেড (GE, IT-IoT, EE, AMB)",
      shift: "১ম ও ২য় শিফট",
      curriculum: "বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)",
    },
    {
      grade: "দ্বাদশ শ্রেণি (Class 12 - HSC Voc)",
      type: "উচ্চ মাধ্যমিক কারিগরি",
      trades: "৪টি ট্রেড (GE, IT-IoT, EE, AMB)",
      shift: "১ম ও ২য় শিফট",
      curriculum: "বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <PublicHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12 space-y-6 sm:space-y-10">
        
        {/* Header Title Banner with AOS Reveal */}
        <AOSReveal animation="fade-down" duration={0.5}>
          <div className="bg-slate-950 text-white p-5 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl border border-indigo-950 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-3 sm:space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] sm:text-xs font-bold font-mono">
                <Layers className="w-4 h-4" />
                <span>ACADEMIC STRUCTURE & CURRICULUM</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                একাডেমিক কাঠামো ও শিক্ষাক্রম
              </h1>

              <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
                পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজে ৬ষ্ঠ থেকে ১২শ শ্রেণি পর্যন্ত জাতীয় শিক্ষাক্রম এবং বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)-এর অধীনে যুগোপযোগী কারিগরি শিক্ষা পরিচালিত হয়।
              </p>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
                <Link
                  href="/academic/settings"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all duration-200 shadow-md shadow-indigo-600/30 active:scale-95"
                >
                  <Sliders className="w-4 h-4" />
                  <span>গ্লোবাল সেটিংস ও বিষয় ম্যাপিং হাব</span>
                </Link>
                <Link
                  href="/downloads"
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all duration-200 shadow-md shadow-cyan-500/20 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>সিলেবাস ও কারিকুলাম ডাউনলোড</span>
                </Link>
                <Link
                  href="/results"
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all duration-200 border border-white/20 hover:border-white/40 shadow-sm"
                >
                  <Award className="w-4 h-4" />
                  <span>পরীক্ষার ফলাফল পোর্টাল</span>
                </Link>
              </div>
            </div>
          </div>
        </AOSReveal>

        {/* Class-wise Structure Table */}
        <AOSReveal animation="fade-up" duration={0.5} delay={0.1}>
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              শ্রেণিভিত্তিক একাডেমিক বিন্যাস
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ৬ষ্ঠ-৮ম শ্রেণিতে কোনো ট্রেড নেই; ৯ম-১২শ শ্রেণিতে ৪টি বিশেষায়িত ট্রেড চালু রয়েছে।
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">শ্রেণি ও পর্যায়</th>
                  <th className="py-3.5 px-4">শিক্ষাধারা</th>
                  <th className="py-3.5 px-4">ট্রেড সুবিধা</th>
                  <th className="py-3.5 px-4">শিফট ও সময়</th>
                  <th className="py-3.5 px-4 rounded-r-xl">অনুমোদিত বোর্ড</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {classesList.map((cls, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                      {cls.grade}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-600 dark:text-cyan-400">
                      {cls.type}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                      {cls.trades}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {cls.shift}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-bold">
                      {cls.curriculum}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AOSReveal>

      {/* Embedded Full Trades and Laboratories Visuals */}
      <AOSReveal animation="fade-up" duration={0.5} delay={0.15}>
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <TradeAndLabView />
        </div>
      </AOSReveal>

      </main>

      <PublicFooter />
    </div>
  );
}
