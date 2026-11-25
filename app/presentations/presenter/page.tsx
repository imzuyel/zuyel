"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import Link from "next/link";
import { Tv, Play, ChevronLeft, ChevronRight, Maximize2, Zap, Sparkles, Layers, Award } from "lucide-react";
import { toast } from "sonner";

export default function PresentationPresenterPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides = [
    {
      title: "ইন্ডাস্ট্রি ৪.০ ও স্মার্ট আইওটি অটোমেশন পরিচিতি",
      subtitle: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ • ভোকেশনাল এডুকেশন",
      bullets: [
        "স্মার্ট ম্যানুফ্যাকচারিং এবং এম্বেডেড ক্লাউড কানেক্টিভিটি",
        "মাইক্রোকন্ট্রোলার ও সেন্সর নেটওয়ার্কের মেলবন্ধন",
        "রিয়েল-টাইম ডাটা টেলিমেট্রি ও এজ কম্পিউটিং",
      ],
      tag: "লেকচার ১",
    },
    {
      title: "মাইক্রোকন্ট্রোলার আর্কিটেকচার ও সেন্সর ইন্টারফেসিং",
      subtitle: "আর্ডুইনো উনো আর৩ ও ইএসপি৩২ এর তুলনামূলক বিশ্লেষণ",
      bullets: [
        "ডিজিটাল আই/ও ও এনালগ রিড কার্যপদ্ধতি (PWM Modulations)",
        "UART, I2C এবং SPI কমিউনিকেশন প্রোটোকল",
        "ল্যাব এক্সপেরিমেন্ট: ৪-চ্যানেল অপ্টোকপলার রিলে ড্রাইভিং",
      ],
      tag: "লেকচার ২",
    },
    {
      title: "শিল্প কারখানায় নিরাপত্তা বিধি ও সার্কিট প্রোটেকশন",
      subtitle: "BTEB ল্যাব হ্যান্ডবুক ও ওয়ার্কশপ নিরাপত্তা মানদণ্ড",
      bullets: [
        "ইনসুলেটেড টুলস এবং স্ট্যাটিক ইলেকট্রিসিটি ডিসচার্জ কৌশল",
        "সার্কিট ব্রেকার, ফিউজ রেটিং এবং গ্রাউন্ডিং রেজিস্ট্যান্স চেক",
        "জরুরি শাটডাউন সুইচ ও প্রাথমিক চিকিৎসা প্রটোকল",
      ],
      tag: "লেকচার ৩",
    },
  ];

  const currentSlide = slides[currentSlideIndex];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex h-screen max-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <div className="hidden lg:block shrink-0 h-screen sticky top-0 overflow-hidden">
        <HierarchicalSidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 w-64 h-full bg-white dark:bg-slate-950 shadow-2xl">
            <HierarchicalSidebar isCollapsed={false} />
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onNavigate={() => {}} />

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Link href="/admin" className="hover:text-indigo-600 transition">
                অ্যাডমিন ড্যাশবোর্ড
              </Link>
              <span>/</span>
              <Link href="/presentations" className="hover:text-indigo-600 transition">
                প্রেজেন্টেশন গ্যালারি
              </Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-bold">লাইভ প্রেজেন্টার স্টেজ</span>
            </div>

            {/* Presenter Canvas Card */}
            <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-12 shadow-2xl border border-indigo-900/40 relative overflow-hidden min-h-[460px] flex flex-col justify-between">
              {/* Background Glow */}
              <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

              {/* Stage Top Controls */}
              <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
                    {currentSlide.tag}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    স্লাইড {currentSlideIndex + 1} / {slides.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                    title="প্রজেক্টর ফুলস্ক্রিন"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <Link
                    href="/quiz"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>লাইভ কুইজ ট্রিগার</span>
                  </Link>
                </div>
              </div>

              {/* Stage Body */}
              <div className="relative z-10 py-10 space-y-4 max-w-3xl">
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
                  {currentSlide.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-400 font-medium">
                  {currentSlide.subtitle}
                </p>

                <div className="pt-4 space-y-2.5">
                  {currentSlide.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slide Navigation Bottom Bar */}
              <div className="relative z-10 flex items-center justify-between border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentSlideIndex === 0}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>পূর্ববর্তী স্লাইড</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentSlideIndex(i)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        currentSlideIndex === i ? "bg-indigo-500 w-8" : "bg-slate-700 hover:bg-slate-600"
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>পরবর্তী স্লাইড</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

