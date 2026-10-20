"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Search,
  Calendar,
  ChevronRight,
  FileText,
  Download,
  AlertCircle,
  Filter,
  Loader2
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { NoticeCardSkeleton } from "@/components/ui/SkeletonScreens";
import { AOSReveal } from "@/components/ui/animation-effects";

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetch("/api/notices")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.items) {
          setNotices(data.items);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { id: "all", label: "সকল নোটিশ" },
    { id: "academic", label: "একাডেমিক" },
    { id: "exam", label: "পরীক্ষা সংক্রান্ত" },
    { id: "urgent", label: "জরুরি বিজ্ঞপ্তি" },
    { id: "holiday", label: "ছুটি ও দিবস" },
    { id: "admission", label: "ভর্তি বিজ্ঞপ্তি" },
  ];

  const filteredNotices = notices.filter((n) => {
    const isPublished = n.status === "published";
    const matchCat = selectedCategory === "all" || n.category === selectedCategory;
    const matchSearch =
      n.titleBangla?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return isPublished && matchCat && matchSearch;
  });

  const totalPages = Math.ceil(filteredNotices.length / itemsPerPage);
  const paginatedNotices = filteredNotices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <PublicHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12 space-y-6 sm:space-y-8">
        
        {/* Header Title Banner with AOS Reveal */}
        <AOSReveal animation="fade-down" duration={0.5}>
          <div className="bg-slate-950 text-white p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-indigo-950 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-2.5 sm:space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] sm:text-xs font-bold font-mono">
                <Bell className="w-3.5 h-3.5 text-cyan-400" />
                <span>OFFICIAL NOTICE BOARD</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                প্রাতিষ্ঠানিক নোটিশ ও সার্কুলার
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের সকল একাডেমিক নির্দেশনা, পরীক্ষার রুটিন, ফলাফল ও জরুরি প্রজ্ঞাপন নিচে দেখুন।
              </p>
            </div>
          </div>
        </AOSReveal>

        {/* Filter and Search Bar */}
        <AOSReveal animation="fade-up" duration={0.4} delay={0.1}>
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              
              {/* Category tabs */}
              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      selectedCategory === cat.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="নোটিশ খুঁজুন..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

            </div>
          </div>
        </AOSReveal>

        {/* Notices Cards Grid */}
        {loading ? (
          <NoticeCardSkeleton count={itemsPerPage} />
        ) : paginatedNotices.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">কোনো নোটিশ পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">অন্য কোনো ক্যাটাগরি বা কি-ওয়ার্ড দিয়ে পুনরায় চেষ্টা করুন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedNotices.map((notice) => (
              <AOSReveal key={notice.id} animation="fade-up" duration={0.4}>
                <Link
                  href={`/notices/${notice.id}`}
                  className="group p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between space-y-4 shadow-xs h-full"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-slate-400 flex items-center gap-1 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        {notice.publishedAt}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                        notice.isUrgent
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}>
                        {notice.categoryBangla}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors leading-snug">
                      {notice.titleBangla}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {notice.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-cyan-400">
                    <span className="text-slate-400 text-[11px] font-normal">কর্তৃপক্ষ: {notice.author}</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-200">
                      <span>বিস্তারিত পড়ুন</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </AOSReveal>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold disabled:opacity-40 cursor-pointer"
            >
              পূর্ববর্তী
            </button>
            <span className="px-4 py-2 text-xs font-bold font-mono text-slate-500 dark:text-slate-400">
              পৃষ্ঠা {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold disabled:opacity-40 cursor-pointer"
            >
              পরবর্তী
            </button>
          </div>
        )}

      </main>

      <PublicFooter />
    </div>
  );
}
