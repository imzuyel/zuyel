"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Building,
  Award,
  Calendar,
  User,
  GraduationCap,
  ArrowLeft,
  QrCode,
  FileText,
  Printer,
  ExternalLink,
  Lock,
  Download,
  FileCheck2,
  Share2,
  Check,
  Sparkles,
} from "lucide-react";
import SignedVerificationReport from "@/components/documents/SignedVerificationReport";

function VerifyDocumentContent() {
  const searchParams = useSearchParams();
  const initialDoc = searchParams.get("doc") || "";
  const [memoInput, setMemoInput] = useState(initialDoc);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleVerify = async (memo: string) => {
    if (!memo || memo.trim() === "") return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/documents/verify/${encodeURIComponent(memo.trim())}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ success: false, verified: false, message: "সার্ভারে সংযোগ ব্যর্থ হয়েছে।" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialDoc) {
      handleVerify(initialDoc);
    }
  }, [initialDoc]);

  // Handle direct export of signed verification report
  const handleDirectExport = async () => {
    if (!result?.document) return;
    setIsDownloadingReport(true);
    try {
      // Find the hidden printable template created by SignedVerificationReport
      const reportElement = document.getElementById("verification-pdf-template");
      if (!reportElement) {
        setShowReportModal(true);
        setIsDownloadingReport(false);
        return;
      }

      const opt = {
        margin: [6, 6, 6, 6] as [number, number, number, number],
        filename: `PTSC_Signed_Verification_Report_${result.document.docNumber.replace(/[\/\\:]/g, "_")}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2.5,
          useCORS: true,
          logging: false,
          letterRendering: true,
          backgroundColor: "#ffffff",
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      };

      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf().set(opt).from(reportElement).save();
      setToastMsg("সত্যায়িত ভেরিফিকেশন রিপোর্ট PDF সফলভাবে ডাউনলোড হয়েছে!");
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err) {
      console.error(err);
      setShowReportModal(true);
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const handleCopyVerificationUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setToastMsg("ভেরিফিকেশন লিংক ক্লিপবোর্ডে কপি করা হয়েছে!");
    setTimeout(() => {
      setCopiedLink(false);
      setToastMsg(null);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Banner */}
      <header className="bg-slate-950/80 border-b border-slate-800 backdrop-blur-md px-4 py-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white">
                পঞ্চগড় সরকারি টিএসসি • অনলাইন সনদ ও নথি যাচাইকরণ
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">
                Official Document & Certificate Verification Portal • PTSC
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">মূল ওয়েবসাইটে ফিরুন</span>
          </Link>
        </div>
      </header>

      {/* Main Search & Verification Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Verification Input Card */}
        <div className="bg-slate-950/60 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-1">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-400" />
              <span>স্মারক নম্বর দিয়ে প্রাতিষ্ঠানিক সনদ যাচাই করুন</span>
            </h2>
            <p className="text-xs text-slate-400">
              সনদপত্র, প্রশংসাপত্র, প্রত্যয়নপত্র বা ছাড়পত্রের নিচে মুদ্রিত অফিসিয়াল স্মারক নম্বর (যেমন:{" "}
              <code className="text-emerald-400 font-mono font-bold">PTSC/TSM/2026/00101</code>) লিখুন।
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(memoInput);
            }}
            className="flex flex-col sm:flex-row gap-3 pt-2"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="উদাহরণ: PTSC/TSM/2026/00101 বা doc_1001"
                value={memoInput}
                onChange={(e) => setMemoInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-2xl text-sm font-mono text-white placeholder:text-slate-600 dark:text-slate-400 focus:outline-hidden transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !memoInput.trim()}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>যাচাই হচ্ছে...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>সনদ যাচাই করুন</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Verification Result Area */}
        {searched && !loading && result && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-200">
            {result.verified ? (
              /* AUTHENTIC AND VALID CERTIFICATE */
              <div className="bg-slate-950 rounded-3xl border-2 border-emerald-500/60 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
                {/* Glowing status banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-[10px] uppercase tracking-wider">
                          Official Verified
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          EIIN: {result.document.institution.eiin}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white mt-0.5">
                        নথিটি পঞ্চগড় সরকারি টিএসসি কর্তৃক সত্যায়িত ও বৈধ
                      </h3>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      স্মারক নম্বর
                    </span>
                    <span className="font-mono font-black text-emerald-400 text-sm sm:text-base">
                      {result.document.docNumber}
                    </span>
                  </div>
                </div>

                {/* Verified Student & Document Data Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      নথির ধরন
                    </span>
                    <p className="font-black text-white text-sm flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>{result.document.docTypeBangla}</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      শিক্ষার্থীর নাম
                    </span>
                    <p className="font-black text-white text-sm flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-400" />
                      <span>{result.document.studentName}</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      স্টুডেন্ট আইডি (সুরক্ষিত)
                    </span>
                    <p className="font-mono font-black text-slate-200 text-sm">
                      {result.document.studentIdMasked}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      শ্রেণি ও ট্রেড
                    </span>
                    <p className="font-bold text-slate-200">
                      {result.document.className}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      ট্রেড: {result.document.tradeName}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      শিক্ষাবর্ষ / সেশন
                    </span>
                    <p className="font-mono font-bold text-slate-200 text-sm">
                      সেশন {result.document.session} (রোল: {result.document.roll})
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      ইস্যুর তারিখ
                    </span>
                    <p className="font-mono font-bold text-slate-200 text-sm flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span>{result.document.issueDateBangla} ({result.document.issueDate})</span>
                    </p>
                  </div>
                </div>

                {/* Institutional Issuer & Security Seal */}
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white">
                        অনুমোদনকারী: {result.document.generatedBy}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {result.document.institution.name} • কোড: {result.document.institution.code}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>সিকিউরড ডিজিটাল ভেরিফিকেশন সাইকেল</span>
                  </div>
                </div>

                {/* Export & Actions Section */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>অফিসিয়াল সত্যায়িত ও ডিজিটাল স্বাক্ষরযুক্ত প্রতিবেদন</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Share / Copy Verification Link */}
                    <button
                      type="button"
                      onClick={handleCopyVerificationUrl}
                      className="px-3 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      title="অনলাইন ভেরিফিকেশন লিংক কপি করুন"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>লিংক কপি</span>
                        </>
                      )}
                    </button>

                    {/* Preview Report Modal Button */}
                    <button
                      type="button"
                      onClick={() => setShowReportModal(true)}
                      className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="স্বাক্ষরিত ভেরিফিকেশন রিপোর্ট প্রিভিউ দেখুন"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>রিপোর্ট প্রিভিউ</span>
                    </button>

                    {/* Primary Action: Export Verification Report PDF */}
                    <button
                      type="button"
                      onClick={handleDirectExport}
                      disabled={isDownloadingReport}
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isDownloadingReport ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>রিপোর্ট তৈরি হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Export Verification Report (PDF)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Signed Verification Report Component (includes hidden printable template and modal) */}
                <SignedVerificationReport
                  documentData={result.document}
                  isOpen={showReportModal}
                  onClose={() => setShowReportModal(false)}
                />
              </div>
            ) : result.document?.status === "cancelled" ? (
              /* CANCELLED / REVOKED DOCUMENT */
              <div className="bg-slate-950 rounded-3xl border-2 border-rose-500/60 p-6 sm:p-8 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500 text-rose-400 flex items-center justify-center">
                    <XCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-rose-400">
                      এই সনদপত্রটি প্রাতিষ্ঠানিকভাবে বাতিল (Cancelled) করা হয়েছে
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      স্মারক নং: {result.document.docNumber}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-xs text-rose-200 space-y-1">
                  <span className="font-bold block">বাতিলকরণের বিবরণ:</span>
                  <p>{result.document.cancellationReason || "প্রাতিষ্ঠানিক আদেশে বাতিলকৃত।"}</p>
                  {result.document.cancelledAt && (
                    <p className="text-[10px] text-rose-400 font-mono">
                      বাতিলের তারিখ: {new Date(result.document.cancelledAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* NOT FOUND OR INVALID */
              <div className="bg-slate-950 rounded-3xl border-2 border-amber-500/60 p-6 sm:p-8 space-y-4 shadow-2xl text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500 text-amber-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">
                    সনদপত্রটি প্রাতিষ্ঠানিক ডেটাবেসে খুঁজে পাওয়া যায়নি
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {result.message || "স্মারক নম্বরটি সঠিক কিনা তা পুনরায় যাচাই করুন অথবা পঞ্চগড় সরকারি টিএসসি প্রশাসনিক কার্যালয়ে যোগাযোগ করুন।"}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setMemoInput("")}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
                  >
                    পুনরায় অনুসন্ধান করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="px-4 py-3 rounded-2xl bg-slate-950 border border-emerald-500/60 shadow-2xl text-xs font-bold text-emerald-400 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toastMsg}</span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 p-4 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
        পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ • পঞ্চগড় সদর, পঞ্চগড় • EIIN: ১৩২২৪৪
      </footer>
    </div>
  );
}

export default function VerifyDocumentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-sm font-mono">যাচাইকরণ পোর্টাল লোড হচ্ছে...</div>}>
      <VerifyDocumentContent />
    </Suspense>
  );
}
