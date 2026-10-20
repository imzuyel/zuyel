"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Award,
  GraduationCap,
  Calendar,
  Building,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useLoading } from "@/context/LoadingContext";
import { toBengaliNumerals } from "@/lib/utils";
import { MarksheetSkeleton, InlineLoadingSpinner } from "@/components/ui/SkeletonScreens";

export default function PublicResultPortal() {
  const { t } = useLanguage();
  const { startLoading, stopLoading } = useLoading();
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("4");
  const [shiftFilter, setShiftFilter] = useState("Morning");
  const [rollInput, setRollInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Published PDFs
  const [pdfList, setPdfList] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/results")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.pdfs) {
          setPdfList(data.pdfs);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSearched(true);
    setLoading(true);
    startLoading("শিক্ষার্থী পরীক্ষার ফলাফল অনুসন্ধান করা হচ্ছে...");

    try {
      let url = "/api/results?";
      if (searchQuery.trim()) {
        url += `query=${encodeURIComponent(searchQuery.trim())}`;
      } else if (rollInput.trim()) {
        url += `classId=${classFilter}&shift=${shiftFilter}&roll=${rollInput.trim()}`;
      } else {
        url += `query=PTSC-2026-001`; // fallback test student
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setResultData(json);
        stopLoading("ফলাফল সফলভাবে পাওয়া গেছে");
      } else {
        setResultData(null);
        setErrorMsg(json.error || "ফলাফল পাওয়া যায়নি");
        stopLoading();
      }
    } catch (err: any) {
      setErrorMsg("সার্ভারের সাথে যোগাযোগে সমস্যা হয়েছে।");
      stopLoading();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900/10 text-cyan-300 text-xs font-bold backdrop-blur-xs border border-white/15">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span>অফিসিয়াল রেজাল্ট ও গ্রেডিং পোর্টাল</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
            পরীক্ষার ফলাফল অনুসন্ধান ও নম্বরপত্র (Result Portal)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            শিক্ষার্থী আইডি বা রোল নম্বর প্রদান করে অর্ধবার্ষিক ও বার্ষিক পরীক্ষার নম্বরপত্র এবং জিপিএ দেখুন
          </p>
        </div>
      </div>

      {/* Search Filter Box */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4 text-xs">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
          <span>শিক্ষার্থী ফলাফল অনুসন্ধান ফিল্টার</span>
        </h3>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                শ্রেণি নির্বাচন
              </label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white"
              >
                <option value="1">Class 6 (Pre-Vocational)</option>
                <option value="2">Class 7 (Pre-Vocational)</option>
                <option value="3">Class 8 (Junior Vocational)</option>
                <option value="4">Class 9 (SSC Vocational)</option>
                <option value="5">Class 10 (SSC Vocational)</option>
                <option value="6">Class 11 (HSC Vocational)</option>
                <option value="7">Class 12 (HSC Vocational)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                শিফট
              </label>
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white"
              >
                <option value="Morning">প্রভাতি (Morning)</option>
                <option value="Day">দিবা (Day)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                রোল নম্বর
              </label>
              <input
                type="number"
                placeholder="যেমন: ১ বা 1"
                value={rollInput}
                onChange={(e) => setRollInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                বা স্টুডেন্ট আইডি
              </label>
              <input
                type="text"
                placeholder="যেমন: PTSC-2026-001"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all duration-200 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <InlineLoadingSpinner text="অনুসন্ধান চলছে..." size="sm" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>ফলাফল দেখুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Loading Skeleton Screen */}
      {loading && <MarksheetSkeleton />}

      {/* Error Message */}
      {errorMsg && !loading && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Result Marksheet Display */}
      {!loading && resultData && resultData.student && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden text-xs transition-all duration-300 animate-in fade-in">
          {/* Print Action Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                অফিসিয়াল মার্কশিট (Official Marksheet)
              </span>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট / PDF সংরক্ষণ</span>
            </button>
          </div>

          {/* Marksheet Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Institution Header */}
            <div className="text-center space-y-1 border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {resultData.institution?.nameBangla || "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ"}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                পূর্ব জালাসী, পঞ্চগড় সদর • EIIN: {resultData.institution?.eiin || "132244"}
              </p>
              <span className="inline-block px-3 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-400 font-bold font-mono text-[11px] mt-1">
                অর্ধবার্ষিক মূল্যায়ন পরীক্ষা ২০২৬ — একাডেমিক ট্রান্সক্রিপ্ট
              </span>
            </div>

            {/* Student Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">শিক্ষার্থীর নাম</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {resultData.student.nameBangla || resultData.student.name}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">স্টুডেন্ট আইডি</span>
                <span className="font-bold text-indigo-600 dark:text-cyan-400">
                  {resultData.student.studentId}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">শ্রেণি ও শিফট</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {resultData.student.className} ({resultData.student.shift})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">ট্রেড ও রোল</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {resultData.student.tradeName || "সাধারণ"} (রোল: {resultData.student.roll})
                </span>
              </div>
            </div>

            {/* Marks Breakdown Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">বিষয় কোড ও নাম</th>
                    <th className="p-3 text-center">তত্ত্বীয় (Theory)</th>
                    <th className="p-3 text-center">ব্যবহারিক (Practical)</th>
                    <th className="p-3 text-center">মোট নম্বর (Total)</th>
                    <th className="p-3 text-center">লেটার গ্রেড (LG)</th>
                    <th className="p-3 text-center">গ্রেড পয়েন্ট (GP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {resultData.marks.map((m: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-medium">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {m.subjectNameBangla || m.subjectName}
                        </span>
                        <span className="text-[10px] text-slate-400 block">কোড: {m.subjectCode}</span>
                      </td>
                      <td className="p-3 text-center text-slate-700 dark:text-slate-300">
                        {m.theoryMarks}
                      </td>
                      <td className="p-3 text-center text-slate-700 dark:text-slate-300">
                        {m.practicalMarks}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                        {m.totalMarks}
                      </td>
                      <td className="p-3 text-center font-bold text-indigo-600 dark:text-cyan-400">
                        {m.letterGrade}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                        {m.gradePoint}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* GPA Summary Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-teal-50 to-emerald-50 dark:from-indigo-950/60 dark:to-emerald-950/60 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  ফলাফল স্থিতি (Result Status)
                </span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {resultData.resultStatus === "Passed" ? "উত্তীর্ণ (PASSED)" : "অনুত্তীর্ণ (FAILED)"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  অর্জিত জিপিএ (Grade Point Average)
                </span>
                <span className="text-2xl font-black text-indigo-700 dark:text-cyan-400 font-mono">
                  GPA {resultData.gpa}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Published Official Result Gazettes & PDF Downloads */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4 text-xs">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
          <span>প্রকাশিত অফিশিয়াল ফলাফল শিট ও গেজেট ডাউনলোড (Official Gazettes)</span>
        </h3>

        <div className="space-y-3">
          {pdfList.map((pdf) => (
            <div
              key={pdf.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-indigo-400 dark:hover:border-cyan-500 transition-all shadow-2xs"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{pdf.title}</h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    <span>{pdf.className}</span>
                    <span>•</span>
                    <span className="text-teal-700 dark:text-teal-400">{pdf.tradeName}</span>
                    <span>•</span>
                    <span>প্রকাশের তারিখ: {pdf.publishedDate}</span>
                    <span>•</span>
                    <span className="text-indigo-600">{pdf.fileSize}</span>
                  </div>
                </div>
              </div>

              <a
                href={pdf.downloadUrl}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-cyan-400 font-bold transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ডাউনলোড (PDF)</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
