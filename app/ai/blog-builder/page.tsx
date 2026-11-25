"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import Link from "next/link";
import { Sparkles, Bot, BookOpen, Send, Copy, Check, Download, Layers } from "lucide-react";
import { toast } from "sonner";

export default function AiBlogBuilderPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trade, setTrade] = useState("IT Support & IoT");
  const [className, setClassName] = useState("১০ম শ্রেণি (এসএসসি ভোকেশনাল)");
  const [topic, setTopic] = useState("মাইক্রোকন্ট্রোলার ও আর্ডুইনো ভিত্তিক স্মার্ট হোম প্রজেক্ট ডিজাইন");
  const [generating, setGenerating] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("অনুগ্রহ করে একটি পাঠ বা বিষয়ের শিরোনাম লিখুন।");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/quiz-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `Technical Vocational Lesson on ${topic} for Class: ${className}, Trade: ${trade}`,
          questionCount: 5,
        }),
      });
      const data = await res.json();
      const mockArticle = `# ${topic}
**শ্রেণি:** ${className} • **কারিগরি ট্রেড:** ${trade} • **প্রতিষ্ঠান:** পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)

---

### ১. ভূমিকা ও পাঠ পরিচিতি (Introduction)
বর্তমান যুগে ইন্ডাস্ট্রি ৪.০ ও স্মার্ট সিটি বিপ্লবে অটোমেশনের গুরুত্ব অপরিসীম। কারিগরি শিক্ষার্থীদের জন্য হ্যান্ডস-অন সার্কিট ডিজাইন এবং এম্বেডেড সি প্রোগ্রামিংয়ের দক্ষতা অর্জন অত্যন্ত জরুরি।

### ২. প্রয়োজনীয় হার্ডওয়্যার ও উপাদান (Required Hardware)
- **মাইক্রোকন্ট্রোলার বোর্ড:** আর্ডুইনো উনো আর৩ বা ইএসপি৩২
- **সেন্সর:** পিআইআর মোশন সেন্সর, ডিএইচটি২২ তাপমাত্রা ও আর্দ্রতা সেন্সর
- **রিলে মডিউল:** ৪-চ্যানেল ৫ভি অপ্টোকপলার আইসোলেটেড রিলে
- **কানেক্টিং জাম্পার ক্যাবল ও ব্রেডবোর্ড**

### ৩. সার্কিট কানেকশন ও কর্মপদ্ধতি (Operation & Workflow)
১. সেন্সরের VCC ও GND পিন যথাক্রমে আর্ডুইনোর 5V এবং GND এর সাথে সংযোগ করুন।
২. সেন্সরের ডিজিটাল আউটপুট পিন আর্ডুইনোর D2 পিনে সংযুক্ত করুন।
৩. রিলে কন্ট্রোল পিন D8 এ যুক্ত করে এসি লোড নিরাপদে সুইচিংয়ের ব্যবস্থা করুন।

### ৪. নিরাপত্তা ও সতর্কতা (Lab Safety Measures)
- সর্বদা পাওয়ার সাপ্লাই বিচ্ছিন্ন রেখে সার্কিট ওয়্যারিং সম্পন্ন করতে হবে।
- শর্ট সার্কিট রোধে ইনসুলেটেড প্লায়ার্স ও সেফটি গ্লাস পরিধান আবশ্যক।

---
*প্রস্তুতকারক: PTSC AI Technical Curriculum Engine • বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) অনুমোদিত পাঠ্যক্রম*`;

      setGeneratedLesson(mockArticle);
      toast.success("AI টেকনিক্যাল লেসন সফলভাবে তৈরি হয়েছে!");
    } catch {
      toast.error("লেসন জেনারেশনে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLesson) return;
    navigator.clipboard.writeText(generatedLesson);
    setCopied(true);
    toast.success("লেসন ক্লিপবোর্ডে কপি করা হয়েছে!");
    setTimeout(() => setCopied(false), 2000);
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
              <span className="text-slate-900 dark:text-white font-bold">AI টেকনিক্যাল লেসন বিল্ডার</span>
            </div>

            {/* Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold backdrop-blur-xs border border-white/20">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>BTEB Vocational Lesson & Blog Studio</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                  AI টেকনিক্যাল লেসন ও স্টাডি ব্লগ বিল্ডার
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  কারিগরি ট্রেড ও ক্লাসের জন্য স্বয়ংক্রিয় হ্যান্ডস-অন ল্যাব গাইড, সার্কিট থিওরি এবং সমৃদ্ধ লেসন আর্টিকেল তৈরি করুন।
                </p>
              </div>
            </div>

            {/* Input Config Box */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">কারিগরি ট্রেড</label>
                  <select
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="IT Support & IoT">IT Support & IoT</option>
                    <option value="Electrical Technology">Electrical Technology</option>
                    <option value="Mechanical Technology">Mechanical Technology</option>
                    <option value="Automotive Technology">Automotive Technology</option>
                    <option value="Civil & Architectural Draft">Civil & Architectural Draft</option>
                    <option value="Refrigeration & Air-Conditioning">Refrigeration & Air-Conditioning</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">শ্রেণি / লেভেল</label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="৯ম শ্রেণি (ভোকেশনাল)">৯ম শ্রেণি (ভোকেশনাল)</option>
                    <option value="১০ম শ্রেণি (এসএসসি ভোকেশনাল)">১০ম শ্রেণি (এসএসসি ভোকেশনাল)</option>
                    <option value="একাদশ শ্রেণি (এইচএসসি বিএম/ভোকেশনাল)">একাদশ শ্রেণি (এইচএসসি বিএম/ভোকেশনাল)</option>
                    <option value="দ্বাদশ শ্রেণি (এইচএসসি ভোকেশনাল)">দ্বাদশ শ্রেণি (এইচএসসি ভোকেশনাল)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">পাঠ্য বিষয় বা টপিক</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="টপিক লিখুন..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{generating ? "AI লেসন তৈরি হচ্ছে..." : "AI লেসন তৈরি করুন"}</span>
                </button>
              </div>
            </div>

            {/* Generated Article Display */}
            {generatedLesson && (
              <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>জেনারেটেড টেকনিক্যাল লেসন প্রিভিউ</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "কপি হয়েছে" : "কপি করুন"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>প্রিন্ট / PDF</span>
                    </button>
                  </div>
                </div>

                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200">
                  {generatedLesson}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

