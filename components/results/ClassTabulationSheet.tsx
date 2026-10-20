"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Printer,
  Download,
  Filter,
  Search,
  Lock,
  Unlock,
  Award,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { toBengaliNumerals } from "@/lib/utils";
import {
  ACADEMIC_CLASSES,
  BTEB_ACADEMIC_TRADES,
  doesClassHaveTrade,
  parseClassNumeric,
} from "@/lib/academicStructure";
import AcademicTranscriptModal from "./AcademicTranscriptModal";

export default function ClassTabulationSheet() {
  const [academicYear, setAcademicYear] = useState<number>(2026);
  const [examName, setExamName] = useState<string>("অর্ধবার্ষিক মূল্যায়ন ২০২৬");
  const [selectedClassId, setSelectedClassId] = useState<number>(4); // Class 9
  const [selectedTradeId, setSelectedTradeId] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"roll" | "merit" | "gpa" | "marks">("merit");

  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [resultsData, setResultsData] = useState<any>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Transcript Modal State
  const [transcriptTarget, setTranscriptTarget] = useState<any | null>(null);

  const numericClass = useMemo(() => parseClassNumeric(selectedClassId), [selectedClassId]);
  const isTradeApplicable = useMemo(() => doesClassHaveTrade(numericClass), [numericClass]);

  const loadTabulation = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      let url = `/api/results?type=class-sheet&classId=${selectedClassId}&academicYear=${academicYear}&examName=${encodeURIComponent(
        examName
      )}`;
      if (selectedSection && selectedSection !== "all") {
        url += `&section=${selectedSection}`;
      }
      if (isTradeApplicable && selectedTradeId && selectedTradeId !== "all") {
        url += `&tradeId=${selectedTradeId}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setResultsData(data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, academicYear, examName, selectedSection, isTradeApplicable, selectedTradeId]);

  useEffect(() => {
    loadTabulation();
  }, [loadTabulation]);

  // Lock / Unlock / Publish Class Results
  const handleBatchStatus = async (action: "lock" | "unlock" | "publish") => {
    const actionBangla = action === "lock" ? "লক" : action === "unlock" ? "আনলক" : "প্রকাশ";
    if (!confirm(`আপনি কি এই শ্রেণির সকল ফলাফল '${actionBangla}' করতে নিশ্চিত?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/marks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          classId: selectedClassId,
          examName,
          academicYear,
          changedBy: "পরীক্ষা নিয়ন্ত্রক (Exam Controller)",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(data.message || `ফলাফল সফলভাবে ${actionBangla} করা হয়েছে।`);
        loadTabulation();
      }
    } catch (err: any) {
      alert(`ত্রুটি: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Sort & Filter Student Results
  const sortedStudents = useMemo(() => {
    if (!resultsData?.students) return [];
    let list = [...resultsData.students];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.nameBangla && s.nameBangla.toLowerCase().includes(q)) ||
          s.studentCode.toLowerCase().includes(q) ||
          String(s.roll).includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === "roll") return a.roll - b.roll;
      if (sortBy === "merit") {
        if (a.meritPosition && b.meritPosition) return a.meritPosition - b.meritPosition;
        if (a.meritPosition) return -1;
        if (b.meritPosition) return 1;
        return a.roll - b.roll;
      }
      if (sortBy === "gpa") {
        return (b.numericGpa || 0) - (a.numericGpa || 0) || (b.totalMarks || 0) - (a.totalMarks || 0);
      }
      if (sortBy === "marks") {
        return (b.totalMarks || 0) - (a.totalMarks || 0);
      }
      return 0;
    });

    return list;
  }, [resultsData, searchQuery, sortBy]);

  // Export Tabulation to CSV
  const handleExportCsv = () => {
    if (!sortedStudents.length) return;
    const headers = ["Merit Rank", "Roll", "Student ID", "Name", "Trade", "Total Marks", "GPA", "Grade", "Status"];
    const rows = sortedStudents.map((s) => [
      s.meritPosition || "-",
      s.roll,
      s.studentCode,
      `"${s.name}"`,
      `"${s.tradeName || "General"}"`,
      s.totalMarks,
      s.gpa,
      s.letterGrade,
      s.resultStatus,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Tabulation_Class_${selectedClassId}_${academicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = resultsData?.statistics;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                ট্যাবুলেশন শিট ও ফলাফল বিবরণী
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Merit Rank & Gazette Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              শ্রেণি ও ট্রেডভিত্তিক ফলাফল বিবরণী ও মেধা তালিকা
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              সকল শিক্ষার্থীর মোট নম্বর, জিপিএ, লেটার গ্রেড, মেধা স্থান ও চূড়ান্ত উত্তীর্ণ বিবরণী।
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-sm font-medium transition"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              প্রিন্ট শিট
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 text-sm font-medium transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              এক্সেল / CSV এক্সপোর্ট
            </button>
            <button
              onClick={() => handleBatchStatus("publish")}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Award className="w-4 h-4" />
              ফলাফল প্রকাশ করুন
            </button>
          </div>
        </div>

        {feedback && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-lg text-emerald-900 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Filter Row */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Year */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">শিক্ষাবর্ষ</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(Number(e.target.value))}
              className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-950 font-medium"
            >
              <option value={2026}>২০২৬ (2026)</option>
              <option value={2025}>২০২৫ (2025)</option>
            </select>
          </div>

          {/* Exam Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">পরীক্ষা</label>
            <select
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-950 font-medium"
            >
              <option value="অর্ধবার্ষিক মূল্যায়ন ২০২৬">অর্ধবার্ষিক মূল্যায়ন ২০২৬</option>
              <option value="বার্ষিক মূল্যায়ন পরীক্ষা ২০২৬">বার্ষিক মূল্যায়ন পরীক্ষা ২০২৬</option>
              <option value="প্রাক-নির্বাচনী ও মডেল টেস্ট ২০২৬">প্রাক-নির্বাচনী ও মডেল টেস্ট ২০২৬</option>
              <option value="ক্লাস টেস্ট ও ধারাবাহিক মূল্যায়ন ২০২৬">ক্লাস টেস্ট ও ধারাবাহিক মূল্যায়ন ২০২৬</option>
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">শ্রেণি (Class)</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                const newCls = Number(e.target.value);
                setSelectedClassId(newCls);
                const num = parseClassNumeric(newCls);
                if (!doesClassHaveTrade(num)) setSelectedTradeId("all");
              }}
              className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-950 font-medium"
            >
              {ACADEMIC_CLASSES.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nameBangla} ({cls.name})
                </option>
              ))}
            </select>
          </div>

          {/* Trade: Strictly HIDDEN for Class 6-8 */}
          {isTradeApplicable ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ট্রেড</label>
              <select
                value={selectedTradeId}
                onChange={(e) => setSelectedTradeId(e.target.value)}
                className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-950 font-medium"
              >
                <option value="all">সব ট্রেড (All Trades)</option>
                {BTEB_ACADEMIC_TRADES.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.nameBangla} ({tr.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="opacity-60 pointer-events-none">
              <label className="block text-xs font-semibold text-slate-400 mb-1">ট্রেড</label>
              <div className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 italic">
                ট্রেড প্রযোজ্য নয় (General)
              </div>
            </div>
          )}

          {/* Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">শাখা (Section)</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-950 font-medium"
            >
              <option value="all">সকল শাখা (All)</option>
              <option value="A">শাখা ক (A)</option>
              <option value="B">শাখা খ (B)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Institutional Statistics Banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:grid-cols-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">মোট শিক্ষার্থী</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{toBengaliNumerals(stats.totalStudents)}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-emerald-200 bg-emerald-50/30 text-center">
            <div className="text-xs text-emerald-800 font-medium">উত্তীর্ণ (Passed)</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">{toBengaliNumerals(stats.passedStudents)}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-rose-200 bg-rose-50/30 text-center">
            <div className="text-xs text-rose-800 font-medium">অনুত্তীর্ণ (Failed)</div>
            <div className="text-xl font-bold text-rose-700 mt-0.5">{toBengaliNumerals(stats.failedStudents)}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-amber-200 bg-amber-50/30 text-center">
            <div className="text-xs text-amber-800 font-medium">অপেক্ষমান (Pending)</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">{toBengaliNumerals(stats.pendingStudents)}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-blue-200 bg-blue-50/30 text-center">
            <div className="text-xs text-blue-800 font-medium">পাসের হার</div>
            <div className="text-xl font-bold text-blue-700 mt-0.5">{toBengaliNumerals(stats.passPercentage)}%</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-purple-200 bg-purple-50/30 text-center">
            <div className="text-xs text-purple-800 font-medium">শ্রেণির গড় GPA</div>
            <div className="text-xl font-bold text-purple-700 mt-0.5">{toBengaliNumerals(stats.averageGpa)}</div>
          </div>
        </div>
      )}

      {/* Tabulation Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Print Only Official Document Header */}
        <div className="hidden print:block text-center p-6 border-b border-slate-800">
          <div className="text-xs uppercase font-bold text-slate-600 dark:text-slate-400">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার | কারিগরি শিক্ষা অধিদপ্তর</div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">পীরগঞ্জ টেকনিক্যাল স্কুল অ্যান্ড কলেজ (PTSC)</h1>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
            অফিশিয়াল ফলাফল বিবরণী ও মেধা তালিকা | {examName} ({toBengaliNumerals(academicYear)})
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            শ্রেণি: {ACADEMIC_CLASSES.find((c) => c.id === selectedClassId)?.nameBangla} | শাখা: {selectedSection}
          </div>
        </div>

        {/* Table Filter Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="রোল, নাম বা আইডি দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">সাজান:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs rounded-xl px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="merit">মেধা ক্রম অনুযায়ী (Merit Rank)</option>
              <option value="roll">রোল নম্বর অনুযায়ী (Roll)</option>
              <option value="gpa">সর্বোচ্চ জিপিএ (GPA)</option>
              <option value="marks">সর্বোচ্চ নম্বর (Marks)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600 dark:text-indigo-400" />
            ট্যাবুলেশন বিবরণী প্রস্তুত করা হচ্ছে...
          </div>
        ) : sortedStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            এই শ্রেণির জন্য কোনো ফলাফল রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-center w-16">মেধা স্থান</th>
                  <th className="py-3 px-4 text-center w-16">রোল</th>
                  <th className="py-3 px-4 w-56">শিক্ষার্থীর তথ্য</th>
                  {isTradeApplicable && <th className="py-3 px-4 w-40">ট্রেড</th>}
                  <th className="py-3 px-4 text-center w-28">বিষয় সংখ্যা</th>
                  <th className="py-3 px-4 text-center w-28">মোট প্রাপ্ত</th>
                  <th className="py-3 px-4 text-center w-20">GPA</th>
                  <th className="py-3 px-4 text-center w-20">গ্রেড</th>
                  <th className="py-3 px-4 text-center w-32">ফলাফল</th>
                  <th className="py-3 px-4 text-right w-28 print:hidden">ট্রান্সক্রিপ্ট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {sortedStudents.map((stu) => {
                  const isPassed = stu.resultStatus === "Passed";
                  const isPending = stu.resultStatus === "Pending";

                  return (
                    <tr key={stu.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Merit Rank */}
                      <td className="py-3 px-4 text-center font-bold">
                        {stu.meritPosition ? (
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold font-mono ${
                              stu.meritPosition <= 3
                                ? "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {toBengaliNumerals(stu.meritPosition)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">-</span>
                        )}
                      </td>

                      {/* Roll */}
                      <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {toBengaliNumerals(stu.roll)}
                        </span>
                      </td>

                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{stu.nameBangla || stu.name}</div>
                        <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{stu.studentCode}</div>
                      </td>

                      {/* Trade */}
                      {isTradeApplicable && (
                        <td className="py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {stu.tradeNameBangla || stu.tradeName || "সাধারণ"}
                        </td>
                      )}

                      {/* Subjects count */}
                      <td className="py-3 px-4 text-center text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                        {toBengaliNumerals(stu.marksCount)} টি বিষয়
                      </td>

                      {/* Total Marks */}
                      <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white font-mono tabular-nums text-xs">
                        {toBengaliNumerals(Number(stu.totalMarks || 0).toFixed(1))}
                      </td>

                      {/* GPA */}
                      <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums text-xs">
                        {stu.gpa}
                      </td>

                      {/* Letter Grade */}
                      <td className="py-3 px-4 text-center font-bold">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono border ${
                            stu.letterGrade === "A+"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                              : stu.letterGrade === "A"
                              ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                              : stu.letterGrade === "F"
                              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {stu.letterGrade}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {isPassed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                            উত্তীর্ণ (Pass)
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                            অসম্পূর্ণ (Pending)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800">
                            অনুত্তীর্ণ (Fail)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right print:hidden">
                        <button
                          onClick={() => setTranscriptTarget(stu)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                          title="অফিশিয়াল ট্রান্সক্রিপ্ট ও নম্বরপত্র"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>গ্রেডশিট</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Print Signatures Block */}
        <div className="hidden print:grid grid-cols-3 gap-6 text-center text-xs text-slate-700 dark:text-slate-300 p-8 pt-16 border-t border-slate-300 dark:border-slate-700">
          <div>
            <div className="w-32 border-b border-slate-700 mx-auto mb-1"></div>
            <div className="font-bold">শ্রেণি শিক্ষক</div>
          </div>
          <div>
            <div className="w-32 border-b border-slate-700 mx-auto mb-1"></div>
            <div className="font-bold">ট্যাবুলেটর ও যাচাইকারী</div>
          </div>
          <div>
            <div className="w-32 border-b border-slate-700 mx-auto mb-1"></div>
            <div className="font-bold">অধ্যক্ষ / পরীক্ষা নিয়ন্ত্রক</div>
          </div>
        </div>
      </div>

      {/* Transcript Modal */}
      {transcriptTarget && (
        <AcademicTranscriptModal
          student={transcriptTarget}
          marks={transcriptTarget.marks || []}
          examName={examName}
          academicYear={academicYear}
          onClose={() => setTranscriptTarget(null)}
        />
      )}
    </div>
  );
}
