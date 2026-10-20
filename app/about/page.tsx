"use client";

import React from "react";
import Link from "next/link";
import {
  School,
  Compass,
  Award,
  ShieldCheck,
  Target,
  Sparkles,
  Users,
  Layers,
  MapPin,
  ChevronRight,
  BookOpen,
  Cpu,
  Zap,
  Wifi,
  Scissors
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import CampusAboutView from "@/components/home/CampusAboutView";
import { AOSReveal } from "@/components/ui/animation-effects";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <PublicHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12 space-y-6 sm:space-y-10">
        
        {/* Page Header Banner with AOS Reveal */}
        <AOSReveal animation="fade-down" duration={0.5}>
          <div className="bg-slate-950 text-white p-5 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl border border-indigo-950 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-3 sm:space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] sm:text-xs font-bold font-mono">
                <Compass className="w-4 h-4" />
                <span>ESTABLISHED 1999 • EIIN: 132244</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                প্রতিষ্ঠান পরিচিতি ও ঐতিহাসিক পটভূমি
              </h1>

              <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
                পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের কারিগরি ও মাদ্রাসা শিক্ষা বিভাগ এবং কারিগরি শিক্ষা অধিদপ্তর (DTE)-এর অধীনস্থ একটি ঐতিহ্যবাহী সরকারি কারিগরি শিক্ষাপ্রতিষ্ঠান।
              </p>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
                <Link
                  href="/academic"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>একাডেমিক কাঠামো</span>
                </Link>
                <Link
                  href="/faculty"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-white/20 hover:border-white/40 shadow-sm"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>শিক্ষক ও কর্মকর্তা পরিষদ</span>
                </Link>
              </div>
            </div>
          </div>
        </AOSReveal>

        {/* Vision & Mission Cards */}
        <AOSReveal animation="fade-up" duration={0.5} delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-black">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                আমাদের রূপকল্প (Vision)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                আন্তর্জাতিক মানের দক্ষ কারিগরি ও বৃত্তিমূলক মানবসম্পদ উন্নয়ন, ৪র্থ শিল্পবিপ্লবের প্রযুক্তিগত চ্যালেঞ্জ মোকাবিলা এবং প্রযুক্তিভিত্তিক স্বনির্ভর স্মার্ট বাংলাদেশ বিনির্মাণ।
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                আমাদের অভিলক্ষ্য (Mission)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                যুগোপযোগী পাঠ্যক্রম, বিশ্বমানের অত্যাধুনিক ব্যবহারিক কর্মশালা ও দক্ষ শিক্ষক দ্বারা প্রতিটি শিক্ষার্থীকে কর্মসংস্থান, উচ্চশিক্ষা এবং আত্মকর্মসংস্থানে সক্ষম ও আত্মবিশ্বাসী করে গড়ে তোলা।
              </p>
            </div>
          </div>
        </AOSReveal>

        {/* Embedded Complete Campus Details View */}
        <AOSReveal animation="fade-up" duration={0.5} delay={0.15}>
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <CampusAboutView />
          </div>
        </AOSReveal>

      </main>

      <PublicFooter />
    </div>
  );
}
