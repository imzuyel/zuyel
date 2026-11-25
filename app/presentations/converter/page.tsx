"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import Link from "next/link";
import { PlaySquare, Sparkles, BookOpen, Upload, Check, Copy, ArrowRight, Layers } from "lucide-react";
import { toast } from "sonner";

export default function SlideConverterPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertedText, setConvertedText] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState("IoT Microcontroller & Smart Embedded Sensors");

  const handleConvert = () => {
    setConverting(true);
    setTimeout(() => {
      setConvertedText(`# ${deckTitle} — সমন্বিত পাঠ্য সহায়িকা
**পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) • বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)**

---

### অধ্যায় সারসংক্ষেপ:
এই পাঠে শিক্ষার্থীরা আর্ডুইনো মাইক্রোকন্ট্রোলারের মৌলিক স্থাপত্য, এনালগ এবং ডিজিটাল পিনের কার্যপদ্ধতি এবং বিভিন্ন ইন্ডাস্ট্রিয়াল সেন্সর ইন্টারফেসিং সম্পর্কে বিস্তারিত শিখতে পারবে।

#### মূল শিখনফল:
1. **মাইক্রোকন্ট্রোলার পিনআউট বিশ্লেষণ:** পাওয়ার, ডিজিটাল আইও পিন, PWM পিন এবং এনালগ ইনপুট পিন চিহ্নিতকরণ।
2. **সেন্সর ওয়্যারিং ও ক্যালিব্রেশন:** তাপমাত্রা ও আর্দ্রতা সেন্সরের ডেটা রিডিং নির্ভুলভাবে আর্ডুইনো সিরিয়াল মনিটরে প্রদর্শন।
3. **প্র্যাকটিক্যাল কোডিং সিনট্যাক্স:** C/C++ ভিত্তিক সেটআপ \`void setup()\` এবং লুপ \`void loop()\` ফাংশন বাস্তবায়ন।

#### ল্যাব সতর্কতা:
- সার্কিটে অতিরিক্ত ভোল্টেজ বা রিভার্স পোলারিটি প্রয়োগ সম্পূর্ণ নিষিদ্ধ।
- প্রজেক্ট টেস্টিং শেষে পাওয়ার কর্ড যথাযথভাবে আনপ্লাগ করতে হবে।`);
      setConverting(false);
      toast.success("স্লাইড সফলভাবে ইন্টারঅ্যাক্টিভ লেসনে রূপান্তরিত হয়েছে!");
    }, 800);
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
              <span className="text-slate-900 dark:text-white font-bold">স্লাইড-টু-লেসন কনভার্টার</span>
            </div>

            {/* Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-purple-900/50 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-300 text-xs font-bold backdrop-blur-xs border border-white/20">
                  <PlaySquare className="w-3.5 h-3.5 text-purple-400" />
                  <span>Interactive Slide-to-Lesson Engine</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                  স্লাইড-টু-লেসন ও ব্লগ কনভার্টার
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  পাওয়ারপয়েন্ট স্লাইড ডেককে ১-ক্লিকে সমৃদ্ধ অধ্যায়ভিত্তিক টেকনিক্যাল রিডিং আর্টিকেলে রূপান্তর করুন।
                </p>
              </div>
            </div>

            {/* Conversion Box */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  স্লাইড ডেকের শিরোনাম
                </label>
                <input
                  type="text"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={converting}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{converting ? "রূপান্তর হচ্ছে..." : "লেসনে রূপান্তর করুন"}</span>
                </button>
              </div>
            </div>

            {/* Output Display */}
            {convertedText && (
              <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>কনভার্টেড স্টাডি লেসন</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(convertedText);
                      toast.success("ক্লিপবোর্ডে কপি হয়েছে!");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>কপি করুন</span>
                  </button>
                </div>

                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200">
                  {convertedText}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

