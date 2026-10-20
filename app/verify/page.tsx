"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Printer,
  School,
  FileText,
  QrCode,
  ArrowRight,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { PublicVerifiedDocument } from "@/lib/certificateVerifier";

function VerifyContent() {
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);
  const [verifiedDoc, setVerifiedDoc] = useState<PublicVerifiedDocument | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleVerify = useCallback(async (queryValue: string) => {
    const q = (queryValue || "").trim();
    if (!q) return;

    setLoading(true);
    setSearched(true);
    setErrorMessage("");
    setVerifiedDoc(null);

    try {
      const res = await fetch(`/api/documents/public-verify?docNumber=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (data.success && data.verified && data.document) {
        setVerifiedDoc(data.document);
      } else {
        setErrorMessage(data.messageBangla || data.error || "সনদটি প্রাতিষ্ঠানিক ডাটাবেসে নিবন্ধিত পাওয়া যায়নি।");
        if (data.document) {
          setVerifiedDoc(data.document);
        }
      }
    } catch {
      setErrorMessage("যাচাইকরণ সার্ভারে সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const docParam = searchParams.get("doc") || searchParams.get("docNumber") || searchParams.get("id");
    if (docParam) {
      setSearchInput(docParam);
      handleVerify(docParam);
    }
  }, [searchParams, handleVerify]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* 1. TOP NAVIGATION / PUBLIC HEADER (Hidden on print) */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-8 print:hidden shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
              </h1>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                PTSC Central Document & Certificate Verification Portal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DTE & BTEB অনুমোদিত</span>
            </span>
          </div>
        </div>
      </header>

      {/* 2. SEARCH & HERO SECTION (Hidden on print) */}
      <section className="w-full py-8 px-4 sm:px-6 print:hidden">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
            <QrCode className="w-3.5 h-3.5" />
            <span>স্মার্ট কিউআর ও স্মারক নম্বর দ্বারা অনলাইন যাচাই</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            সনদপত্র ও প্রশংসাপত্র সত্যতা যাচাইকরণ
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            নিয়োগকর্তা, বিশ্ববিদ্যালয় বা সরকারি দপ্তরের সুবিধার্থে পঞ্চগড় সরকারি টিএসসি কর্তৃক ইস্যুকৃত সকল একাডেমিক নথি এই পোর্টাল থেকে তাৎক্ষণিক যাচাই করা যায়।
          </p>

          {/* Search Box */}
          <div className="pt-2 max-w-2xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify(searchInput);
              }}
              className="flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border-2 border-indigo-600/30 dark:border-indigo-500/40 rounded-2xl shadow-lg focus-within:border-indigo-600 transition-all"
            >
              <div className="flex items-center gap-2.5 px-3 w-full">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="স্মারক নং লিখুন (যেমন: PTSC/TSM/2026/00101 বা doc_1001)..."
                  className="w-full bg-transparent py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !searchInput.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all transform active:scale-95 disabled:opacity-50 shrink-0"
              >
                {loading ? (
                  <span>যাচাই হচ্ছে...</span>
                ) : (
                  <>
                    <span>যাচাই করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Sample Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span>নমুনা স্মারক:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchInput("PTSC/TSM/2026/00101");
                  handleVerify("PTSC/TSM/2026/00101");
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-mono text-slate-700 dark:text-slate-300 transition-colors"
              >
                PTSC/TSM/2026/00101
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput("doc_1001");
                  handleVerify("doc_1001");
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-mono text-slate-700 dark:text-slate-300 transition-colors"
              >
                doc_1001
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VERIFICATION RESULT SECTION */}
      <main className="w-full max-w-4xl mx-auto px-4 pb-12 flex-1">
        {/* Loading Spinner */}
        {loading && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-md">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              কেন্দ্রীয় প্রাতিষ্ঠানিক ডাটাবেসে অনুসন্ধান চলছে...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ডিজিটাল সিগনেচার ও স্মারক রেকর্ড যাচাই করা হচ্ছে।
            </p>
          </div>
        )}

        {/* Case A: Authenticated Genuine Document */}
        {!loading && searched && verifiedDoc && verifiedDoc.isAuthentic && (
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
            {/* Top Official Authenticity Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 sm:p-5 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold text-emerald-100 flex items-center gap-1.5">
                    <span>অফিশিয়াল ভেরিফিকেশন স্ট্যাটাস</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black leading-tight">
                    বাংলাদেশ কারিগরি শিক্ষা অধিদপ্তর কর্তৃক অনুমোদিত ও সঠিক
                  </h3>
                </div>
              </div>

              {/* Print Slip Button (Hidden during print) */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 text-emerald-900 hover:bg-emerald-50 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-transform active:scale-95 print:hidden"
              >
                <Printer className="w-4 h-4" />
                <span>ভেরিফিকেশন স্লিপ প্রিন্ট</span>
              </button>
            </div>

            {/* Document Certificate Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Institutional Crest Header */}
              <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-5 relative">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • কারিগরি শিক্ষা অধিদপ্তর
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                  পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                  Panchagarh-5000, Bangladesh • EIIN: 132244 • BTEB Code: 132244
                </p>

                <div className="inline-block mt-3 px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
                  নথির ধরন: {verifiedDoc.docTypeBangla}
                </div>
              </div>

              {/* Student & Document Core Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Student Photo & Vital Identifiers */}
                <div className="md:col-span-4 flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-inner mb-3 bg-slate-200 dark:bg-slate-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={verifiedDoc.student.photoUrl || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80"}
                      alt={verifiedDoc.student.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {verifiedDoc.student.nameBangla}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {verifiedDoc.student.name}
                  </p>

                  <div className="w-full mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">শিক্ষার্থী আইডি:</span>
                      <span className="font-mono font-bold">{verifiedDoc.student.studentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">ভর্তি নম্বর:</span>
                      <span className="font-mono font-semibold">{verifiedDoc.student.admissionNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">রোল নম্বর:</span>
                      <span className="font-mono font-bold">{verifiedDoc.student.roll}</span>
                    </div>
                  </div>
                </div>

                {/* Academic Achievement & Parentage Details */}
                <div className="md:col-span-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">পিতার নাম:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{verifiedDoc.student.fatherName}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">মাতার নাম:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{verifiedDoc.student.motherName}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">শ্রেণি / শিক্ষাক্রম:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{verifiedDoc.student.className}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">কারিগরি ট্রেড:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{verifiedDoc.student.tradeNameBangla || verifiedDoc.student.tradeName || "সাধারণ (Pre-Voc)"}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">শিক্ষাবর্ষ ও পাসের সাল:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{verifiedDoc.student.session} ({verifiedDoc.student.passingYear})</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40/70 border border-emerald-200">
                      <span className="text-emerald-700 block mb-0.5 font-medium">অর্জিত ফলাফল (GPA):</span>
                      <span className="font-mono font-black text-emerald-900 text-base">{verifiedDoc.student.gpa} ({verifiedDoc.student.resultStatus})</span>
                    </div>
                  </div>

                  {/* Masked Sensitive Identifiers (Privacy Compliance) */}
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>জন্মনিবন্ধন নং (সুরক্ষিত):</span>
                      <strong className="font-mono text-slate-800 dark:text-slate-200">{verifiedDoc.student.maskedBirthRegNo}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <span>অভিভাবকের মোবাইল:</span>
                      <strong className="font-mono text-slate-800 dark:text-slate-200">{verifiedDoc.student.maskedMobile}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cryptographic Authenticity Footer & Seal */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end text-xs">
                {/* Security Hash & Signer Notice */}
                <div className="space-y-1 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>ডিজিটাল সিকিউরিটি সিগনেচার হ্যাশ</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-[10px] break-all border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    {verifiedDoc.security.verificationHash}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    যাচাইকৃত সময়: {new Date(verifiedDoc.security.verifiedAt).toLocaleString("bn-BD")}
                  </p>
                </div>

                {/* Issuing Authority Signature Block */}
                <div className="text-right sm:text-right space-y-1">
                  <div className="inline-block border-b border-dashed border-slate-400 pb-1 px-4 text-center">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {verifiedDoc.issuedBy}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    স্মারক নম্বর: <strong className="font-mono text-slate-800 dark:text-slate-200">{verifiedDoc.docNumber}</strong> • ইস্যু তারিখ: {verifiedDoc.issueDateBangla}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Case B: Invalid, Revoked or Not Found Document */}
        {!loading && searched && (!verifiedDoc || !verifiedDoc.isAuthentic) && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-rose-200 dark:border-rose-900 overflow-hidden text-center p-8 sm:p-12 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <XCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
                যাচাইকরণ ব্যর্থ • অনিবন্ধিত বা বাতিলকৃত নথি
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                সনদটির সত্যতা নিশ্চিত করা সম্ভব হয়নি
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
              {errorMessage || "প্রদত্ত স্মারক বা ট্র্যাকিং নম্বরের কোনো বৈধ নথি প্রাতিষ্ঠানিক ডাটাবেসে খুঁজে পাওয়া যায়নি। নথিটি সম্ভবত ভুয়া বা মেয়াদোত্তীর্ণ/বাতিল করা হয়েছে।"}
            </p>

            {/* Assistance helpline */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 max-w-md mx-auto text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <p>
                যদি আপনি মনে করেন এটি একটি সিস্টেম ত্রুটি, তবে সরাসরি কলেজের প্রশাসনিক শাখার সাথে যোগাযোগ করুন:
              </p>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200">
                ইমেইল: <span className="font-bold">panchagarhtsc@gmail.com</span> • হেল্পলাইন: <span className="font-bold">০১৭১৩-৮৩৯৯৭৮</span>
              </div>
            </div>
          </div>
        )}

        {/* Initial Empty State Guide */}
        {!loading && !searched && (
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                যাচাই করতে সনদের স্মারক নম্বর লিখুন
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                শিক্ষার্থীর প্রশংসাপত্র, প্রত্যয়নপত্র বা চারিত্রিক সনদের উপরের ডান কোনায় মুদ্রিত ট্র্যাকিং নম্বরটি প্রবেশ করিয়ে &quot;যাচাই করুন&quot; বাটনে চাপুন।
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 4. FOOTER (Hidden on print) */}
      <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400 print:hidden">
        <div className="max-w-4xl mx-auto space-y-1">
          <p className="font-medium text-slate-700 dark:text-slate-300">
            কারিগরি শিক্ষা অধিদপ্তর ও বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) অনুমোদিত কেন্দ্রীয় যাচাইকরণ প্ল্যাটফর্ম
          </p>
          <p className="text-[11px] font-mono">
            © ২০২৬ পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) ERP. সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
