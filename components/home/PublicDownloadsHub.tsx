"use client";

import React, { useState, useEffect } from "react";
import { FileText, Search, Download, ExternalLink, ShieldCheck, HelpCircle } from "lucide-react";
import { DownloadsListSkeleton } from "@/components/ui/SkeletonScreens";
import { AOSReveal } from "@/components/ui/animation-effects";
import { useLoading } from "@/context/LoadingContext";
import SocialReactionCommentSection from "@/components/common/SocialReactionCommentSection";

export default function PublicDownloadsHub() {
  const { startLoading, stopLoading } = useLoading();
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetch("/api/downloads")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDownloads(data.items || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredDownloads = downloads.filter((d) => {
    const matchSearch = d.titleBangla.toLowerCase().includes(searchQuery.toLowerCase()) || d.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "all" || d.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleDownload = (dl: any) => {
    startLoading(`'${dl.fileName}' ডাউনলোড প্রস্তুত করা হচ্ছে...`);
    setTimeout(() => {
      stopLoading(`'${dl.fileName}' সফলভাবে ডাউনলোড হয়েছে`);
      const link = document.createElement("a");
      link.href = dl.downloadUrl;
      link.download = dl.fileName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 600);
  };

  if (loading) {
    return (
      <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>ডাউনলোড হাব ও সিলেবাস ডিরেক্টরি (Downloads & Syllabus Hub)</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">এসএসসি ও এইচএসসি ভোকেশনাল শিক্ষাক্রমের সিলেবাস, ভর্তি ফর্ম এবং একাডেমিক ক্যালেন্ডার এখান থেকে ডাউনলোড করুন।</p>
        </div>
        <DownloadsListSkeleton count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
      
      {/* Upper header */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <span>ডাউনলোড হাব ও সিলেবাস ডিরেক্টরি (Downloads & Syllabus Hub)</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">এসএসসি ও এইচএসসি ভোকেশনাল শিক্ষাক্রমের সিলেবাস, ভর্তি ফর্ম এবং একাডেমিক ক্যালেন্ডার এখান থেকে ডাউনলোড করুন।</p>
      </div>

      {/* Grid of Search & Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="relative md:col-span-8">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="কাঙ্ক্ষিত ফাইলের নাম বা কিওয়ার্ড দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 text-xs"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 cursor-pointer md:col-span-4 text-xs"
        >
          <option value="all">সকল ক্যাটাগরি</option>
          <option value="syllabus">সিলেবাস ও কারিকুলাম</option>
          <option value="form">ভর্তি ফরম ও আবেদন</option>
          <option value="routine">পরীক্ষা ও ক্লাস রুটিন</option>
          <option value="calendar">একাডেমিক ক্যালেন্ডার</option>
          <option value="question_paper">বিগত বছরের প্রশ্নপত্র</option>
          <option value="other">অন্যান্য নোটিশ ও নথি</option>
        </select>
      </div>

      {/* List Directory view */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredDownloads.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400">
            কোনো ফাইল বা সিলেবাস পাওয়া যায়নি।
          </div>
        ) : (
          filteredDownloads.map((dl) => (
            <div
              key={dl.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md shadow-xs"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-indigo-100 dark:border-indigo-800/60 shrink-0 mt-0.5">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 font-bold text-[10px]">
                      {dl.categoryBangla}
                    </span>
                    <span className="font-mono text-slate-400 font-bold text-[10px]">
                      ফাইল সাইজ: {dl.fileSize}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white leading-snug">{dl.titleBangla}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">{dl.description || `অফিশিয়াল ফাইল: ${dl.fileName}`}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={dl.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800 font-extrabold flex items-center gap-1.5 transition-colors text-xs whitespace-nowrap cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>লিঙ্ক</span>
                  </a>

                  <button
                    onClick={() => handleDownload(dl)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black flex items-center gap-1.5 transition-all duration-200 shadow-md shadow-indigo-600/20 text-xs whitespace-nowrap cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ডাউনলোড করুন</span>
                  </button>
                </div>
              </div>

              {/* Social Reaction, Heart & Comment Section */}
              <SocialReactionCommentSection
                contentId={`download-${dl.id}`}
                contentType="download"
                initialLikes={15}
                initialUnlikes={0}
                initialHearts={10}
                compact={true}
              />
            </div>
          ))
        )}
      </div>

      {/* Safety & Verification Alert footer */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h5 className="font-bold text-slate-900 dark:text-white">নিরাপদ ও ভাইরাসমুক্ত ডাউনলোড গ্যারান্টি</h5>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-normal">
            আমাদের পাবলিক ডাউনলোড হাবের সমস্ত ফাইল সরাসরি সরকারি শিক্ষা মন্ত্রণালয় এবং বাংলাদেশ কারিগরি শিক্ষা বোর্ডের অফিশিয়াল স্টোরেজ হতে ভেরিফাই করে সংযুক্ত করা হয়েছে।
          </p>
        </div>
      </div>
    </div>
  );
}
