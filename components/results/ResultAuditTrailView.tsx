"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Clock,
  User,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toBengaliNumerals } from "@/lib/utils";

export default function ResultAuditTrailView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marks");
      const data = await res.json();
      if (data.success && data.marks) {
        const auditEntries: any[] = [];
        data.marks.forEach((m: any) => {
          if (m.auditHistory && Array.isArray(m.auditHistory)) {
            m.auditHistory.forEach((a: any) => {
              auditEntries.push({
                ...a,
                studentName: m.studentName,
                studentCode: m.studentCode,
                roll: m.roll,
                subjectName: m.subjectNameBangla || m.subjectName,
                subjectCode: m.subjectCode,
                examName: m.examName,
              });
            });
          }
        });

        auditEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(auditEntries);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      (l.studentName && l.studentName.toLowerCase().includes(q)) ||
      (l.studentCode && l.studentCode.toLowerCase().includes(q)) ||
      (l.subjectName && l.subjectName.toLowerCase().includes(q)) ||
      (l.reason && l.reason.toLowerCase().includes(q)) ||
      (l.changedBy && l.changedBy.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                অডিট ট্রেইল ও নিরাপত্তা
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Immutable Compliance Log</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              নম্বর পরিবর্তন ও সংশোধন অডিট লগ (Audit History)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              ফলাফল ডাটাবেসে প্রতিটি এন্ট্রি, আপডেট বা বিশেষ সংশোধনীর অপরিবর্তনযোগ্য ইতিহাস ও সুনির্দিষ্ট কারণ।
            </p>
          </div>

          <button
            onClick={loadAuditLogs}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            লগ রিফ্রেশ করুন
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="শিক্ষার্থী, বিষয়, পরীক্ষক বা কারণ দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            মোট {toBengaliNumerals(filteredLogs.length)} টি অডিট রেকর্ড
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            অডিট রেকর্ড লোড হচ্ছে...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            কোনো অডিট লগ রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 w-44">তারিখ ও সময়</th>
                  <th className="p-3 w-40">কর্মকান্ডের ধরন</th>
                  <th className="p-3 w-56">শিক্ষার্থী ও বিষয়</th>
                  <th className="p-3 w-48">পূর্বের ও নতুন নম্বর</th>
                  <th className="p-3">সংশোধনের কারণ ও বিবরণ</th>
                  <th className="p-3 w-40 text-right pr-4">দায়িত্বপ্রাপ্ত ব্যক্তি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredLogs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">
                      {new Date(entry.timestamp).toLocaleString("bn-BD")}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold ${
                          entry.action === "correct"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : entry.action === "update"
                            ? "bg-blue-100 text-blue-900"
                            : "bg-emerald-100 text-emerald-900"
                        }`}
                      >
                        {entry.action === "correct"
                          ? "বিশেষ সংশোধন (Correct)"
                          : entry.action === "update"
                          ? "হালনাগাদ (Update)"
                          : "প্রাথমিক এন্ট্রি (Create)"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{entry.studentName}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        রোল: {entry.roll} | বিষয়: {entry.subjectName}
                      </div>
                    </td>
                    <td className="p-3 font-mono">
                      {entry.previousMarks ? (
                        <div>
                          <div className="text-slate-500 dark:text-slate-400 line-through">
                            পূর্ব: {entry.previousMarks.totalMarks} ({entry.previousMarks.grade})
                          </div>
                          <div className="text-emerald-700 font-bold">
                            নতুন: {entry.newMarks?.totalMarks} ({entry.newMarks?.grade})
                          </div>
                        </div>
                      ) : (
                        <div className="text-emerald-700 font-bold">
                          মোট: {entry.newMarks?.totalMarks} ({entry.newMarks?.grade})
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-800 dark:text-slate-200">
                      <p className="line-clamp-2">{entry.reason || "নিয়মিত মূল্যায়ন এন্ট্রি"}</p>
                    </td>
                    <td className="p-3 text-right pr-4 font-medium text-slate-700 dark:text-slate-300">
                      {entry.changedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
