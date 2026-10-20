"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Bell,
  Calendar,
  ArrowLeft,
  Download,
  Printer,
  FileText,
  Share2,
  ChevronRight,
  ShieldCheck,
  Loader2,
  AlertCircle
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

export default function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [notice, setNotice] = useState<any>(null);
  const [relatedNotices, setRelatedNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/notices/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.notice) {
          setNotice(data.notice);
          setRelatedNotices(data.relatedNotices || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <PublicHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 no-print">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-cyan-400">
            হোম
          </Link>
          <span>/</span>
          <Link href="/notices" className="hover:text-indigo-600 dark:hover:text-cyan-400">
            নোটিশ বোর্ড
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white truncate max-w-xs">
            {notice?.titleBangla || "নোটিশ বিবরণ"}
          </span>
        </div>

        {/* Back Link */}
        <div className="no-print">
          <Link
            href="/notices"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>সকল নোটিশে ফিরে যান</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs text-slate-400">নোটিশ লোড হচ্ছে...</span>
          </div>
        ) : !notice ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">নোটিশটি পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">হয়তো নোটিশটি মুছে ফেলা হয়েছে বা মেয়াদ উত্তীর্ণ হয়েছে।</p>
            <Link
              href="/notices"
              className="inline-block px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
            >
              নোটিশ বোর্ডে যান
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Main Notice Document Card */}
            <article className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              
              {/* Notice Meta Header */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-cyan-300 text-xs font-bold">
                      {notice.categoryBangla}
                    </span>
                    {notice.isUrgent && (
                      <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                        জরুরি বিজ্ঞপ্তি
                      </span>
                    )}
                  </div>

                  {/* Print & Share Action Tools */}
                  <div className="flex items-center gap-2 no-print">
                    <button
                      onClick={handleShare}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{copied ? "লিংক কপি হয়েছে!" : "শেয়ার"}</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>প্রিন্ট</span>
                    </button>
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-snug">
                  {notice.titleBangla}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span>প্রকাশের তারিখ: <strong className="font-mono text-slate-800 dark:text-slate-200">{notice.publishedAt}</strong></span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>কর্তৃপক্ষ: <strong className="text-slate-800 dark:text-slate-200">{notice.author}</strong></span>
                  </div>
                </div>
              </div>

              {/* Notice Full Content Body */}
              <div className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed font-normal whitespace-pre-wrap py-2">
                {notice.content}
              </div>

              {/* Official Signature and Stamp Box */}
              <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">স্বাক্ষরিত/</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{notice.author}</p>
                  <p>পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ</p>
                </div>
                <div className="font-mono text-[11px] bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  স্মারক নং: PTSC/ADMIN/{notice.id}/২০২৬
                </div>
              </div>

              {/* Attachment Download Section */}
              {notice.attachmentName && (
                <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                        সংযুক্ত অফিশিয়াল ডকুমেন্ট
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {notice.attachmentName}
                      </p>
                    </div>
                  </div>

                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`সংযুক্ত ডকুমেন্ট '${notice.attachmentName}' সফলভাবে ক্লায়েন্টে ডাউনলোড হচ্ছে।`);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>ডাউনলোড করুন</span>
                  </a>
                </div>
              )}

            </article>

            {/* Related Notices */}
            {relatedNotices.length > 0 && (
              <div className="space-y-4 no-print">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  সম্পর্কিত অন্যান্য নোটিশ
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedNotices.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/notices/${rel.id}`}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all flex flex-col justify-between space-y-2 group"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 block font-bold">
                          {rel.publishedAt}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 line-clamp-2">
                          {rel.titleBangla}
                        </h4>
                      </div>
                      <div className="text-[11px] font-bold text-indigo-600 dark:text-cyan-400 flex items-center gap-0.5 pt-1">
                        <span>পড়ুন</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      <PublicFooter />
    </div>
  );
}
