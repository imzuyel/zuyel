"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Percent,
  TrendingDown,
  Users,
  Search,
  Phone,
  MessageSquare,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import * as XLSX from "xlsx";

interface AbsenceAnalyticsViewProps {
  onClose?: () => void;
}

export default function AbsenceAnalyticsView({ onClose }: AbsenceAnalyticsViewProps) {
  const [threshold, setThreshold] = useState<number>(75);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"consecutive" | "threshold">("consecutive");

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?action=absence_analytics&threshold=${threshold}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Error loading absence analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [threshold]);

  const handleExportAbsentees = () => {
    if (!data) return;

    const rows = (data.frequentAbsentees || []).map((s: any) => ({
      "Student ID": s.studentCode,
      "Roll": s.roll,
      "Name": s.name,
      "Class": s.className,
      "Trade": s.tradeName || "General",
      "Total Recorded Classes": s.totalClasses,
      "Absent Days": s.absentDays,
      "Attendance Rate (%)": s.attendanceRate,
      "Status": s.attendanceRate < 60 ? "Severe Warning (<60%)" : "Below Threshold (<75%)",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Frequent Absentees");
    XLSX.writeFile(wb, `PTSC_Absence_Analytics_Threshold_${threshold}pct.xlsx`);
  };

  const filteredConsecutive = (data?.consecutiveAlerts || []).filter((s: any) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.studentCode.toLowerCase().includes(term) ||
      String(s.roll).includes(term) ||
      s.className.toLowerCase().includes(term)
    );
  });

  const filteredFrequent = (data?.frequentAbsentees || []).filter((s: any) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.studentCode.toLowerCase().includes(term) ||
      String(s.roll).includes(term) ||
      s.className.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-rose-500 to-amber-600 text-white rounded-xl shadow-md shadow-rose-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>অনুপস্থিতি বিশ্লেষণ ও সতর্কীকরণ হাব (Absence Analytics)</span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                BTEB ৭%-৭৫% বিধিমালা
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              টানা ৩+ দিন অনুপস্থিত এবং নির্ধারিত থ্রেশহোল্ডের নিচে থাকা শিক্ষার্থীদের মনিটরিং
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Threshold selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400">ন্যূনতম থ্রেশহোল্ড:</span>
            <select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold focus:ring-2 focus:ring-rose-500"
            >
              <option value={75}>৭৫% (বোর্ড বাধ্যতামূলক)</option>
              <option value={80}>৮০% (উন্নত স্ট্যান্ডার্ড)</option>
              <option value={60}>৬০% (নন-কলেজিয়েট সীমা)</option>
            </select>
          </div>

          <button
            onClick={handleExportAbsentees}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>এক্সেল রিপোর্ট</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              বন্ধ করুন
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              প্রাতিষ্ঠানিক গড় উপস্থিতি
            </span>
            <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {data.institutionalAverageRate}%
            </div>
            <span className="text-[10px] text-slate-400">সকল শ্রেণি মিলিয়ে সার্বিক হার</span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 block mb-1">
              টানা ৩+ দিন অনুপস্থিত
            </span>
            <div className="text-xl font-extrabold text-rose-800 dark:text-rose-200">
              {data.consecutiveAbsenceCount} জন
            </div>
            <span className="text-[10px] text-rose-600 dark:text-rose-400">জরুরি অভিভাবক যোগাযোগ প্রয়োজন</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 block mb-1">
              থ্রেশহোল্ডের নিচে (&lt;{threshold}%)
            </span>
            <div className="text-xl font-extrabold text-amber-800 dark:text-amber-200">
              {data.belowThresholdCount} জন
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">পরীক্ষায় বসার অনুমতি ঝুঁকিপূর্ণ</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block mb-1">
              মোট পরীক্ষিত শিক্ষার্থী
            </span>
            <div className="text-xl font-extrabold text-emerald-800 dark:text-emerald-200">
              {data.totalAssessedStudents} জন
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">সক্রিয় রেজিস্টারকৃত ছাত্র-ছাত্রী</span>
          </div>
        </div>
      )}

      {/* Tabs and Search */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("consecutive")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === "consecutive"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>টানা অনুপস্থিতির সতর্কতা ({data?.consecutiveAbsenceCount || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("threshold")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === "threshold"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>কম উপস্থিতির তালিকা &lt;{threshold}% ({data?.belowThresholdCount || 0})</span>
            </button>
          </div>

          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="শিক্ষার্থী খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Tab 1: Consecutive Absences */}
        {activeTab === "consecutive" && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 w-16 text-center">রোল</th>
                  <th className="py-2.5 px-3">শিক্ষার্থী নাম</th>
                  <th className="py-2.5 px-3 font-mono">আইডি</th>
                  <th className="py-2.5 px-3">শ্রেণি</th>
                  <th className="py-2.5 px-3 text-center">টানা অনুপস্থিতির দিন</th>
                  <th className="py-2.5 px-3">সর্বশেষ উপস্থিতি</th>
                  <th className="py-2.5 px-3 text-center">জরুরি পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      ডাটা লোড হচ্ছে...
                    </td>
                  </tr>
                ) : filteredConsecutive.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      টানা ৩ বা ততোধিক দিন অনুপস্থিত কোনো শিক্ষার্থী পাওয়া যায়নি (সন্তোষজনক)।
                    </td>
                  </tr>
                ) : (
                  filteredConsecutive.map((s: any) => (
                    <tr key={s.studentId} className="hover:bg-rose-50 dark:bg-rose-950/40/30 dark:hover:bg-rose-950/20">
                      <td className="py-2.5 px-3 text-center font-bold">{s.roll}</td>
                      <td className="py-2.5 px-3 font-semibold">{s.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">{s.studentCode}</td>
                      <td className="py-2.5 px-3">{s.className}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-600 text-white">
                          {s.consecutiveDays} দিন
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                        {s.lastSeenDate || "অজ্ঞাত / তথ্য নেই"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => alert(`অভিভাবককে এসএমএস পাঠানো হয়েছে (${s.name})`)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200 transition-colors"
                        >
                          নোটিশ প্রেরণ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Below Threshold List */}
        {activeTab === "threshold" && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 w-16 text-center">রোল</th>
                  <th className="py-2.5 px-3">শিক্ষার্থী নাম</th>
                  <th className="py-2.5 px-3 font-mono">আইডি</th>
                  <th className="py-2.5 px-3">শ্রেণি ও ট্রেড</th>
                  <th className="py-2.5 px-3 text-center">অনুপস্থিত দিন</th>
                  <th className="py-2.5 px-3 text-center">উপস্থিতি হার (%)</th>
                  <th className="py-2.5 px-3">অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      ডাটা লোড হচ্ছে...
                    </td>
                  </tr>
                ) : filteredFrequent.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      নির্বাচিত থ্রেশহোল্ড ({threshold}%) এর নিচে কোনো শিক্ষার্থী নেই।
                    </td>
                  </tr>
                ) : (
                  filteredFrequent.map((s: any) => (
                    <tr key={s.studentId} className="hover:bg-amber-50 dark:bg-amber-950/40/30 dark:hover:bg-amber-950/20">
                      <td className="py-2.5 px-3 text-center font-bold">{s.roll}</td>
                      <td className="py-2.5 px-3 font-semibold">{s.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">{s.studentCode}</td>
                      <td className="py-2.5 px-3">
                        {s.className} {s.tradeName && `• ${s.tradeName}`}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-rose-600">
                        {s.absentDays} / {s.totalClasses}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                        {s.attendanceRate}%
                      </td>
                      <td className="py-2.5 px-3">
                        {s.warning === "severe" ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            মারাত্মক ঝুঁকি (&lt;৬০%)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            নন-কলেজিয়েট ঝুঁকি
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
