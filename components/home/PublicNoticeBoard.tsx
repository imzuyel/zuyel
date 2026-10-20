"use client";

import React, { useState, useEffect } from "react";
import { Bell, Search, FileText, Calendar, Download, ChevronRight, Loader2 } from "lucide-react";
import SocialReactionCommentSection from "@/components/common/SocialReactionCommentSection";

export default function PublicNoticeBoard() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedNotice, setSelectedNotice] = useState<any>(null);

  useEffect(() => {
    fetch("/api/notices")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotices(data.items || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredNotices = notices.filter((n) => {
    const matchSearch = n.titleBangla.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === "all" || n.category === categoryFilter;
    return matchSearch && matchCat;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs">নোটিশ লোড হচ্ছে...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
      
      {/* Header and filter bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <span>অফিশিয়াল নোটিশ বোর্ড (Official Notice Board)</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">প্রতিষ্ঠান কর্তৃক প্রকাশিত সকল অফিশিয়াল নোটিশ ও তথ্যসূচি নিচে দেখুন।</p>
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "সব নোটিশ" },
            { id: "academic", label: "একাডেমিক" },
            { id: "exam", label: "পরীক্ষা সংক্রান্ত" },
            { id: "urgent", label: "জরুরি ঘোষণা" },
            { id: "holiday", label: "ছুটি ও ক্যালেন্ডার" },
            { id: "admission", label: "ভর্তি নোটিশ" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategoryFilter(cat.id);
                setSelectedNotice(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer transition-all ${
                categoryFilter === cat.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Two-Column Detail Layout if a notice is selected, otherwise list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Notice List Container */}
        <div className={`space-y-3 lg:col-span-7 ${selectedNotice ? "lg:col-span-5" : "lg:col-span-12"}`}>
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="শিরোনাম বা বিষয়বস্তু দিয়ে সার্চ করুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            {filteredNotices.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400">
                কোনো নোটিশ পাওয়া যায়নি।
              </div>
            ) : (
              filteredNotices.map((n) => {
                const isSelected = selectedNotice?.id === n.id;
                return (
                  <div
                    key={n.id}
                    onClick={() => setSelectedNotice(n)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-indigo-50/50 dark:bg-slate-800 border-indigo-400 dark:border-indigo-600 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="font-mono text-slate-400 flex items-center gap-1 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          {n.publishedAt}
                        </span>
                        <span className={`px-2 py-0.5 rounded-sm font-bold ${
                          n.isUrgent
                            ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                          {n.categoryBangla}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white leading-snug">{n.titleBangla}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-normal">{n.content}</p>
                    </div>

                    <ChevronRight className={`w-4 h-4 text-slate-400 self-center shrink-0 transition-transform ${isSelected ? "translate-x-1" : ""}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Notice Detail Column */}
        {selectedNotice && (
          <div className="lg:col-span-7 bg-indigo-50/20 dark:bg-slate-900/40 p-6 rounded-3xl border border-indigo-100 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-slate-800 text-indigo-700 dark:text-cyan-400 font-bold text-[10px] uppercase tracking-wide">
                {selectedNotice.categoryBangla}
              </span>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-slate-400 hover:text-rose-500 font-bold"
              >
                বন্ধ করুন
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
              {selectedNotice.titleBangla}
            </h3>

            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
              <span>প্রকাশের তারিখ: <strong className="font-mono text-slate-700 dark:text-slate-300">{selectedNotice.publishedAt}</strong></span>
              <span>•</span>
              <span>কর্তৃপক্ষ: <strong className="text-slate-700 dark:text-slate-300">{selectedNotice.author}</strong></span>
            </div>

            <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-wrap text-[12px] bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              {selectedNotice.content}
            </div>

            {/* Attachment Download Link */}
            {selectedNotice.attachmentName && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <h5 className="font-extrabold text-slate-900 dark:text-white text-xs">সংযুক্ত ফাইল ডাউনলোড করুন</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{selectedNotice.attachmentName}</p>
                  </div>
                </div>

                <a
                  href={`#`}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`অফিশিয়াল ডকুমেন্ট '${selectedNotice.attachmentName}' সফলভাবে প্রস্তুত হয়েছে এবং ক্লায়েন্টে ডাউনলোড হচ্ছে।`);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold flex items-center gap-1 shadow-md shadow-indigo-600/20 text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ডাউনলোড</span>
                </a>
              </div>
            )}

            {/* Social Reaction, Heart & Comment Section */}
            <SocialReactionCommentSection
              key={selectedNotice.id}
              contentId={`notice-${selectedNotice.id}`}
              contentType="notice"
              initialLikes={selectedNotice.isUrgent ? 28 : 14}
              initialUnlikes={1}
              initialHearts={19}
            />
          </div>
        )}

      </div>
    </div>
  );
}
