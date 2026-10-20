"use client";

import React, { useState } from "react";
import {
  Layers,
  Play,
  Sparkles,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  BookOpen,
  Calendar,
  User,
  CheckCircle2,
  Upload,
  Plus,
} from "lucide-react";
import AiSlideToBlogModal from "./AiSlideToBlogModal";

interface PresentationItem {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  trade: string;
  totalSlides: number;
  author: string;
  date: string;
  thumbnailColor: string;
}

const SAMPLE_PRESENTATIONS: PresentationItem[] = [
  {
    id: "p1",
    title: "বেসিক ইলেকট্রিক্যাল সার্কিট ও ওহমের সূত্রের প্রয়োগ",
    subject: "ইলেকট্রিক্যাল ওয়ার্কস",
    classLevel: "ক্লাস ৯ (ভোকেশনাল)",
    trade: "Electrical",
    totalSlides: 18,
    author: "প্রকৌ: মো: রফিকুল ইসলাম",
    date: "২০২৬-১০-০২",
    thumbnailColor: "from-amber-500 to-orange-600",
  },
  {
    id: "p2",
    title: "কম্পিউটার হার্ডওয়্যার মাদারবোর্ড ও ট্রাবলশুটিং গাইড",
    subject: "কম্পিউটার ও আইওটি",
    classLevel: "ক্লাস ১০ (ভোকেশনাল)",
    trade: "Computer",
    totalSlides: 24,
    author: "মো: জহুরুল ইসলাম",
    date: "২০২৬-১০-০৪",
    thumbnailColor: "from-indigo-600 to-blue-700",
  },
  {
    id: "p3",
    title: "অটোমোবাইল ইঞ্জিন ওভারহোলিং ও সেফটি প্রিক্রেশন",
    subject: "অটোমোবাইল টেকনোলজি",
    classLevel: "ডিপ্লোমা ১ম পর্ব",
    trade: "Automobile",
    totalSlides: 15,
    author: "প্রকৌ: আমজাদ হোসেন",
    date: "২০২৬-০৯-২৮",
    thumbnailColor: "from-emerald-600 to-teal-700",
  },
  {
    id: "p4",
    title: "সিভিল ড্রাফটিং, ক্যাড ও বিল্ডিং প্ল্যান ডিজাইন",
    subject: "সিভিল কনস্ট্রাকশন",
    classLevel: "ক্লাস ৯ (ভোকেশনাল)",
    trade: "Civil",
    totalSlides: 20,
    author: "মোছা: নাসরিন আকতার",
    date: "২০২৬-১০-০১",
    thumbnailColor: "from-purple-600 to-indigo-700",
  },
];

export default function PresentationViewer() {
  const [presentations, setPresentations] = useState<PresentationItem[]>(SAMPLE_PRESENTATIONS);
  const [activePres, setActivePres] = useState<PresentationItem | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isProjectionMode, setIsProjectionMode] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Upload Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newClassLevel, setNewClassLevel] = useState("ক্লাস ৯ (ভোকেশনাল)");
  const [newTrade, setNewTrade] = useState("Electrical");
  const [newTotalSlides, setNewTotalSlides] = useState<number>(15);
  const [newAuthor, setNewAuthor] = useState("শিক্ষক (PTSC)");
  const [selectedFileName, setSelectedFileName] = useState("");

  const handleOpenProjection = (pres: PresentationItem) => {
    setActivePres(pres);
    setCurrentSlideIndex(0);
    setIsProjectionMode(true);
  };

  const handleNextSlide = () => {
    if (activePres) {
      setCurrentSlideIndex((prev) => Math.min(activePres.totalSlides - 1, prev + 1));
    }
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSaveUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const colors = [
      "from-indigo-600 to-purple-700",
      "from-cyan-600 to-blue-700",
      "from-emerald-600 to-teal-700",
      "from-amber-600 to-orange-700",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const item: PresentationItem = {
      id: `pres-${Date.now()}`,
      title: newTitle,
      subject: newSubject || "কারিগরি বিষয়",
      classLevel: newClassLevel,
      trade: newTrade,
      totalSlides: Number(newTotalSlides) || 12,
      author: newAuthor,
      date: new Date().toISOString().split("T")[0],
      thumbnailColor: randomColor,
    };

    setPresentations([item, ...presentations]);
    setIsUploadModalOpen(false);
    setNewTitle("");
    setNewSubject("");
    setSelectedFileName("");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                PRESENTATION LIBRARY & SLIDES
              </span>
              <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-bold">
                মাল্টিমিডিয়া প্রজেকশন মডিউল
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-cyan-400" />
              <span>ডিজিটাল স্লাইড ও প্রেজেন্টেশন লাইব্রেরি</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের শিক্ষকবৃন্দের তৈরি করা ডিজিটাল লেসন স্লাইড, প্রজেকশন স্ক্রিন এবং AI Slide-to-Blog জেনারেটর হাব।
            </p>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-xl shadow-cyan-500/20 flex items-center gap-2 transition-all transform hover:scale-[1.03] active:scale-95 cursor-pointer shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>নতুন PPTX / PDF আপলোড</span>
          </button>
        </div>
      </div>

      {/* Presentation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {presentations.map((pres) => (
          <div
            key={pres.id}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
          >
            {/* Card Header Thumbnail Simulation */}
            <div className={`p-6 bg-gradient-to-br ${pres.thumbnailColor} text-white relative overflow-hidden`}>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/20 backdrop-blur-md">
                    {pres.classLevel}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-black/20 backdrop-blur-md text-cyan-200">
                    {pres.totalSlides} স্লাইড
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                  {pres.title}
                </h3>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>বিষয় / ট্রেড:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{pres.subject} ({pres.trade})</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>প্রস্তুতকারক:</span>
                  <strong className="text-slate-900 dark:text-white">{pres.author}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>আপলোড তারিখ:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{pres.date}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenProjection(pres)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>প্রজেকশন মোড (Slide Deck)</span>
                </button>
                <button
                  onClick={() => {
                    setActivePres(pres);
                    setIsAiModalOpen(true);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 font-bold text-xs border border-cyan-200 dark:border-cyan-800 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="AI দিয়ে স্লাইড থেকে লেসন ব্লগ তৈরি করুন"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                  <span>AI Blog</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Projection Viewer Modal */}
      {isProjectionMode && activePres && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-lg p-3 sm:p-8 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-3xl border border-indigo-500/30 shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            {/* Projection Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">{activePres.title}</h2>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {activePres.subject} • স্লাইড {currentSlideIndex + 1} / {activePres.totalSlides}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsProjectionMode(false);
                    setIsAiModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Slide-to-Blog</span>
                </button>
                <button
                  onClick={() => setIsProjectionMode(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slide Screen Canvas */}
            <div className="flex-1 bg-slate-950 p-6 sm:p-12 flex flex-col justify-between items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/30 via-transparent to-cyan-950/30 pointer-events-none" />

              <div className="max-w-2xl space-y-6 relative z-10 my-auto">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-cyan-300 border border-indigo-400/30 text-xs font-mono font-bold">
                  স্লাইড নং {currentSlideIndex + 1} অব {activePres.totalSlides}
                </span>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {activePres.title} — লেসন অংশ {currentSlideIndex + 1}
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
                  এখানে স্লাইডের মূল টেকনিক্যাল কনটেন্ট, সার্কিট চিত্র, ডায়াগ্রাম এবং গুরুত্বপূর্ণ পয়েন্টসমূহ প্রদর্শিত হচ্ছে। পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের ক্লাসরুম প্রজেক্টরের জন্য এটি অপ্টিমাইজড।
                </p>
              </div>

              {/* Navigation Footer */}
              <div className="relative z-10 w-full flex items-center justify-between pt-6 border-t border-slate-800/80">
                <button
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>পেছনের স্লাইড</span>
                </button>

                <div className="flex gap-1.5 overflow-x-auto max-w-xs">
                  {Array.from({ length: activePres.totalSlides }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                        currentSlideIndex === idx ? "bg-cyan-400 w-6" : "bg-slate-700 hover:bg-slate-600"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNextSlide}
                  disabled={currentSlideIndex >= activePres.totalSlides - 1}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>পরবর্তী স্লাইড</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Slide-to-Blog Modal */}
      <AiSlideToBlogModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        presentationTitle={activePres?.title || "বেসিক ইলেকট্রিক্যাল সার্কিট"}
        totalSlides={activePres?.totalSlides || 15}
      />

      {/* Teacher Upload Presentation Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-cyan-500/30 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 border-b border-indigo-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">নতুন প্রেজেন্টেশন / স্লাইড ডেক আপলোড</h3>
                  <p className="text-[11px] text-slate-300">PowerPoint (.pptx) বা PDF স্লাইড ফাইল সংযোজন করুন</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUpload} className="p-6 overflow-y-auto space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="space-y-1">
                <label>প্রেজেন্টেশন / পাঠের শিরোনাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ইলেকট্রিক্যাল সার্কিট ও ওহমের সূত্র"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label>বিষয় (Subject)</label>
                  <input
                    type="text"
                    placeholder="যেমন: ইলেকট্রিক্যাল ওয়ার্কস"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label>স্লাইড সংখ্যা (Total Slides)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newTotalSlides}
                    onChange={(e) => setNewTotalSlides(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label>শ্রেণি (Class Level)</label>
                  <select
                    value={newClassLevel}
                    onChange={(e) => setNewClassLevel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="ক্লাস ৯ (ভোকেশনাল)">ক্লাস ৯ (ভোকেশনাল)</option>
                    <option value="ক্লাস ১০ (ভোকেশনাল)">ক্লাস ১০ (ভোকেশনাল)</option>
                    <option value="ডিপ্লোমা ১ম পর্ব">ডিপ্লোমা ১ম পর্ব</option>
                    <option value="ডিপ্লোমা ২য় পর্ব">ডিপ্লোমা ২য় পর্ব</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label>কারিগরি ট্রেড (Trade)</label>
                  <select
                    value={newTrade}
                    onChange={(e) => setNewTrade(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="Electrical">ইলেকট্রিক্যাল</option>
                    <option value="Computer">কম্পিউটার</option>
                    <option value="Automobile">অটোমোবাইল</option>
                    <option value="Civil">সিভিল</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label>ফাইল সিলেক্ট করুন (.pptx বা .pdf)</label>
                <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-indigo-500" />
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedFileName || "PowerPoint (.pptx) বা PDF ফাইল ব্রাউজ করুন"}
                  </p>
                  <input
                    type="file"
                    accept=".pptx,.pdf,.ppt"
                    onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name || "")}
                    className="hidden"
                    id="pptx-file-input"
                  />
                  <label
                    htmlFor="pptx-file-input"
                    className="inline-block px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer transition-all"
                  >
                    ফাইল ব্রাউজ করুন
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>সংরক্ষণ ও পাবলিশ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
