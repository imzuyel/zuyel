"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { 
  FileText, Search, UploadCloud, Layers, ShieldCheck, Download, 
  ExternalLink, Filter, Plus, Trash2, Info, Sparkles, Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DocumentRepoItem } from "@/lib/documentRepository";
import { ACADEMIC_CLASSES, ALL_TRADES } from "@/lib/academicStructure";
import { toast } from "sonner";

const BanglaDocumentGenerator = dynamic(
  () => import("@/components/documents/BanglaDocumentGenerator"),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold">বাংলা ডকুমেন্ট স্টুডিও লোড হচ্ছে...</p>
      </div>
    ),
    ssr: false,
  }
);

function DocumentDashboardContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") === "generator" ? "generator" : "repository";

  const [activeView, setActiveView] = useState<"repository" | "generator">(initialTab);
  const [documents, setDocuments] = useState<DocumentRepoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedTrade, setSelectedTrade] = useState("All");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents/repository");
      if (!res.ok) {
        toast.error("ডকুমেন্ট লোড করতে ব্যর্থ হয়েছে।");
        return;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        toast.error("রেসপন্স ফরম্যাট সঠিক নয়।");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast.error("ডকুমেন্ট লোড করতে ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.titleBangla.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === "All" || doc.classId === selectedClass;
    const matchesTrade = selectedTrade === "All" || doc.tradeCode === selectedTrade;
    return matchesSearch && matchesClass && matchesTrade;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 sm:p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                স্মার্ট ডকুমেন্ট রিপোজিটরি ও স্টুডিও
              </h1>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl font-medium">
              পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের (PTSC) সকল একাডেমিক সনদপত্র প্রস্তুত, বিটিইবি সিলেবাস এবং টেকনিক্যাল গাইডলাইন এখানে কেন্দ্রীয়ভাবে সংরক্ষিত থাকে।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Switcher Pills */}
            <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl">
              <button
                onClick={() => setActiveView("repository")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeView === "repository"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>রিপোজিটরি ফাইলস</span>
              </button>
              <button
                onClick={() => setActiveView("generator")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeView === "generator"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>বাংলা ডকুমেন্ট স্টুডিও</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Module
            </div>
          </div>
        </div>
      </div>

      {activeView === "generator" ? (
        <div className="max-w-7xl mx-auto">
          <BanglaDocumentGenerator />
        </div>
      ) : (
        <>
          {/* Filter & Search Bar */}
          <div className="max-w-7xl mx-auto mb-8">
            <div className="p-4 rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-xl flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="ফাইলের নাম বা টপিক দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-300 focus:outline-none"
                >
                  <option value="All">সকল শ্রেণি</option>
                  {ACADEMIC_CLASSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBangla}
                    </option>
                  ))}
                </select>

                <select 
                  value={selectedTrade}
                  onChange={(e) => setSelectedTrade(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-300 focus:outline-none"
                >
                  <option value="All">সকল ট্রেড</option>
                  {ALL_TRADES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.nameBangla}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Document Grid */}
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-bold animate-pulse">রিপোজিটরি লোড হচ্ছে...</p>
              </div>
            ) : filteredDocs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.map((doc, idx) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group p-5 rounded-3xl bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="flex gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <FileText className="w-7 h-7 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white leading-tight mb-1 line-clamp-2">
                          {doc.titleBangla}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">{doc.category}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span className="text-[10px] font-bold text-indigo-400">{doc.classNameBangla}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-bold">ট্রেড:</span>
                        <span className="text-slate-300 font-bold">{doc.tradeNameBangla}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-bold">ফাইল সাইজ:</span>
                        <span className="text-slate-300 font-mono">{doc.fileSize}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
                      <button className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer">
                        <ExternalLink className="w-3.5 h-3.5" />
                        প্রিভিউ
                      </button>
                      <button className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                <Info className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">কোনো ডকুমেন্ট পাওয়া যায়নি।</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function DocumentRepositoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DocumentDashboardContent />
    </Suspense>
  );
}
