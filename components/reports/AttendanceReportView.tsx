"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Filter,
  Download,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Percent,
  Layers,
  ArrowUpDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  getApplicableTradesForClass,
  doesClassHaveTrade,
  parseClassNumeric,
} from "@/lib/academicStructure";
import { Student } from "@/lib/database";
import AcademicFilterBar from "@/components/common/AcademicFilterBar";

interface AttendanceReportRow {
  studentId: string;
  roll: number;
  name: string;
  nameBangla: string;
  className: string;
  classNumeric: number;
  tradeName: string;
  section: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  percentage: number;
}

export default function AttendanceReportView() {
  // 1. Date range filters
  const [dateMode, setDateMode] = useState<"single" | "range">("range");
  const [singleDate, setSingleDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  // 2. Class, Trade, Section & Student search filters
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedTradeId, setSelectedTradeId] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 3. Students Data
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items)) {
          setStudents(data.items);
        }
      })
      .catch((err) => console.error("Error loading students for report:", err))
      .finally(() => setLoading(false));
  }, []);

  // Class-based trade logic
  const classNumeric = parseClassNumeric(selectedClassId);
  const showTradeFilter = doesClassHaveTrade(selectedClassId);
  const applicableTrades = useMemo(() => {
    return getApplicableTradesForClass(selectedClassId);
  }, [selectedClassId]);

  const handleClassChange = (newCls: string) => {
    setSelectedClassId(newCls);
    if (!doesClassHaveTrade(newCls)) {
      setSelectedTradeId("all");
    }
  };

  // Generate Report Rows
  const reportRows: AttendanceReportRow[] = useMemo(() => {
    return students
      .filter((s) => {
        // Class check
        if (selectedClassId !== "all") {
          const sCls = parseClassNumeric(s.classId || s.className);
          if (sCls !== classNumeric) return false;
        }

        // Trade check (only for 9-12)
        if (showTradeFilter && selectedTradeId !== "all") {
          const tId = Number(selectedTradeId);
          const matchTrade = ALL_TRADES.find((t) => t.id === tId);
          if (matchTrade) {
            const sTradeId = Number(s.tradeId);
            const sTradeStr = String(s.tradeName || "").toLowerCase();
            const matchCode = matchTrade.code.toLowerCase();
            const matchName = matchTrade.name.toLowerCase();
            if (sTradeId !== tId && !sTradeStr.includes(matchCode) && !sTradeStr.includes(matchName)) {
              return false;
            }
          }
        }

        // Section check
        if (selectedSection !== "all" && (s.section || "A") !== selectedSection) {
          return false;
        }

        // Student search (Name, ID, Roll)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = s.name.toLowerCase().includes(q) || (s.nameBangla && s.nameBangla.includes(q));
          const matchId = s.studentId.toLowerCase().includes(q);
          const matchRoll = String(s.roll) === q;
          if (!matchName && !matchId && !matchRoll) return false;
        }

        return true;
      })
      .map((s) => {
        const clsNum = parseClassNumeric(s.classId || s.className);
        const hasTrade = clsNum >= 9 && clsNum <= 12;
        // Deterministic mock attendance generation based on student ID hash
        const seed = s.studentId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const totalDays = 45;
        const absentDays = (seed % 4) === 0 ? (seed % 5) + 1 : seed % 3;
        const lateDays = seed % 3 === 0 ? 1 : 0;
        const presentDays = Math.max(0, totalDays - absentDays - lateDays);
        const percentage = Number(((presentDays / totalDays) * 100).toFixed(1));

        return {
          studentId: s.studentId,
          roll: Number(s.roll) || 1,
          name: s.name,
          nameBangla: s.nameBangla || s.name,
          className: s.className || `Class ${clsNum}`,
          classNumeric: clsNum,
          tradeName: hasTrade ? s.tradeNameBangla || s.tradeName || "ট্রেড নির্বাচন করা হয়নি" : "ট্রেড নেই (প্রাক-ভোকেশনাল)",
          section: s.section || "A",
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          percentage,
        };
      })
      .sort((a, b) => a.roll - b.roll);
  }, [students, selectedClassId, classNumeric, showTradeFilter, selectedTradeId, selectedSection, searchQuery]);

  // Aggregate Metrics
  const aggregateMetrics = useMemo(() => {
    if (reportRows.length === 0) {
      return { totalClasses: 45, avgPresent: 0, avgAbsent: 0, avgLate: 0, overallPercentage: 0 };
    }
    const totalStudents = reportRows.length;
    const totalPresent = reportRows.reduce((acc, r) => acc + r.presentDays, 0);
    const totalAbsent = reportRows.reduce((acc, r) => acc + r.absentDays, 0);
    const totalLate = reportRows.reduce((acc, r) => acc + r.lateDays, 0);
    const totalPossible = totalStudents * 45;
    const overallPercentage = totalPossible > 0 ? Number(((totalPresent / totalPossible) * 100).toFixed(1)) : 0;

    return {
      totalClasses: 45,
      avgPresent: Math.round(totalPresent / totalStudents),
      avgAbsent: Math.round(totalAbsent / totalStudents),
      avgLate: Math.round(totalLate / totalStudents),
      overallPercentage,
    };
  }, [reportRows]);

  // Excel Export Handler
  const handleExportExcel = () => {
    if (reportRows.length === 0) return;

    const exportData = reportRows.map((r, idx) => ({
      "ক্রমিক (SL)": idx + 1,
      "রোল (Roll)": r.roll,
      "স্টুডেন্ট আইডি (Student ID)": r.studentId,
      "শিক্ষার্থীর নাম (Student Name)": r.name,
      "নাম (বাংলায়)": r.nameBangla,
      "শ্রেণি (Class)": r.className,
      "শাখা (Section)": r.section,
      "কারিগরি ট্রেড (Trade)": r.tradeName,
      "মোট কর্মদিবস (Total Days)": r.totalDays,
      "উপস্থিত (Present Days)": r.presentDays,
      "অনুপস্থিত (Absent Days)": r.absentDays,
      "দেরি (Late Days)": r.lateDays,
      "উপস্থিতি হার (%)": `${r.percentage}%`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance_Report");

    // Dynamic filename
    const dateStamp = new Date().toISOString().split("T")[0];
    const fileName = `PTSC_Attendance_Report_${selectedClassId !== "all" ? `Class${classNumeric}_` : ""}${dateStamp}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header & Export CTA */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>উপস্থিতি রিপোর্ট ও বিশ্লেষণ (Attendance Report)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            তারিখভিত্তিক ও শ্রেণিকেন্দ্রিক উপস্থিতি পরিসংখ্যান • এক্সেল এক্সপোর্ট সুবিধা
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={reportRows.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>এক্সেলে ডাউনলোড (Export to Excel)</span>
        </button>
      </div>

      {/* 2. Top Aggregate Metrics (Total Classes, Present, Absent, Late, Attendance %) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">মোট ক্লাস (Total Classes)</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {aggregateMetrics.totalClasses} দিন
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">বর্তমান সেশন</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-600 mb-1">গড় উপস্থিত (Present)</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {aggregateMetrics.avgPresent} দিন
          </div>
          <div className="text-[10px] text-emerald-600/80 font-medium mt-0.5">শিক্ষার্থী প্রতি</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-rose-600 mb-1">গড় অনুপস্থিত (Absent)</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {aggregateMetrics.avgAbsent} দিন
          </div>
          <div className="text-[10px] text-rose-600/80 font-medium mt-0.5">শিক্ষার্থী প্রতি</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-amber-600 mb-1">দেরি (Late)</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {aggregateMetrics.avgLate} দিন
          </div>
          <div className="text-[10px] text-amber-600/80 font-medium mt-0.5">শিক্ষার্থী প্রতি</div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
            উপস্থিতি হার (Attendance %)
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {aggregateMetrics.overallPercentage}%
          </div>
          <div className="text-[10px] text-indigo-500 font-medium mt-0.5">সামগ্রিক গড়</div>
        </div>
      </div>

      {/* 3. Comprehensive Filters (Date / Date Range, Class, Trade [hidden for 6-8], Section, Student) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Date Mode Toggle & Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              তারিখ নির্বাচন মোড
            </label>
            <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDateMode("single")}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  dateMode === "single"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                নির্দিষ্ট দিন
              </button>
              <button
                type="button"
                onClick={() => setDateMode("range")}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  dateMode === "range"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                তারিখের ব্যাপ্তি (Range)
              </button>
            </div>
          </div>

          {dateMode === "single" ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                তারিখ (Date)
              </label>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  হতে (From Date)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  পর্যন্ত (To Date)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </>
          )}
        </div>

        {/* Academic Filters using Unified Component */}
        <div className="sm:col-span-4 lg:col-span-5">
          <AcademicFilterBar
            filter={{
              session: "2026",
              classId: (() => {
                if (selectedClassId === "all") return "all";
                const matched = ACADEMIC_CLASSES.find((c) => String(c.numericValue) === String(selectedClassId));
                return matched ? String(matched.id) : "all";
              })(),
              tradeId: selectedTradeId,
              tradeCode: selectedTradeId === "all" ? "all" : "",
              section: selectedSection,
              department: "all"
            }}
            onChange={(newFilter) => {
              if (newFilter.classId === "all") {
                setSelectedClassId("all");
              } else {
                const matched = ACADEMIC_CLASSES.find((c) => String(c.id) === String(newFilter.classId));
                if (matched) {
                  setSelectedClassId(String(matched.numericValue));
                }
              }
              setSelectedTradeId(newFilter.tradeId || "all");
              setSelectedSection(newFilter.section);
            }}
            showSession={false}
            showDepartment={false}
            showSection={true}
            showAllOption={true}
            compact={true}
          />
        </div>

          {/* Student Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              শিক্ষার্থী সার্চ (Search)
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="রোল বা নাম..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>
        </div>

      {/* 4. Report Table (Desktop & Mobile) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs font-black text-slate-900 dark:text-white">
            রিপোর্ট তালিকা ({reportRows.length} জন শিক্ষার্থী)
          </div>
          <button
            onClick={handleExportExcel}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>এক্সেল ফাইল</span>
          </button>
        </div>

        {reportRows.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            নির্বাচিত ফিল্টারে কোনো তথ্য পাওয়া যায়নি।
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-12">রোল</th>
                    <th className="py-3 px-4">আইডি</th>
                    <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                    <th className="py-3 px-4">শ্রেণি ও শাখা</th>
                    <th className="py-3 px-4">ট্রেড</th>
                    <th className="py-3 px-4 text-center">মোট দিন</th>
                    <th className="py-3 px-4 text-center text-emerald-600">উপস্থিত</th>
                    <th className="py-3 px-4 text-center text-rose-600">অনুপস্থিত</th>
                    <th className="py-3 px-4 text-center text-amber-600">দেরি</th>
                    <th className="py-3 px-4 text-right">উপস্থিতি %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportRows.map((r) => (
                    <tr key={r.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/60 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {String(r.roll).padStart(2, "0")}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {r.studentId}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {r.name}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {r.className} ({r.section})
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                          {r.tradeName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {r.totalDays}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">
                        {r.presentDays}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-rose-600">
                        {r.absentDays}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-600">
                        {r.lateDays}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-black font-mono px-2 py-0.5 rounded-full text-xs ${
                            r.percentage >= 85
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : r.percentage >= 75
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                          }`}
                        >
                          {r.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Single column) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {reportRows.map((r) => (
                <div key={r.studentId} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 font-mono font-black text-xs flex items-center justify-center">
                        {String(r.roll).padStart(2, "0")}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {r.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {r.studentId}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`font-mono font-black text-xs px-2 py-0.5 rounded-full ${
                        r.percentage >= 85
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-700"
                      }`}
                    >
                      {r.percentage}%
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {r.className} ({r.section}) • {r.tradeName}
                  </div>

                  {/* Attendance counts */}
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] pt-1">
                    <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg">
                      <div className="text-[9px] text-slate-400">মোট</div>
                      <div className="font-bold text-slate-800 dark:text-white">{r.totalDays}</div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg">
                      <div className="text-[9px] text-emerald-600">উপস্থিত</div>
                      <div className="font-bold text-emerald-600">{r.presentDays}</div>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-lg">
                      <div className="text-[9px] text-rose-600">অনুপস্থিত</div>
                      <div className="font-bold text-rose-600">{r.absentDays}</div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg">
                      <div className="text-[9px] text-amber-600">দেরি</div>
                      <div className="font-bold text-amber-600">{r.lateDays}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
