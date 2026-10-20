"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  FileText,
  Clock,
  User,
  History,
} from "lucide-react";
import { ExamAuditLog } from "@/lib/examinationEngine";
import { toBengaliNumerals } from "@/lib/utils";

export default function ExamAuditTrailView() {
  const [logs, setLogs] = useState<ExamAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const actionParam = actionFilter !== "all" ? `?action=${actionFilter}` : "";
      const res = await fetch(`/api/examination/audit${actionParam}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(
      (l) =>
        l.examName.toLowerCase().includes(q) ||
        l.changedBy.toLowerCase().includes(q) ||
        l.reason.toLowerCase().includes(q) ||
        (l.studentName && l.studentName.toLowerCase().includes(q)) ||
        (l.subjectName && l.subjectName.toLowerCase().includes(q))
    );
  }, [logs, searchQuery]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "LOCK_EXAM":
        return {
          label: "লক করা হয়েছে",
          icon: Lock,
          classes: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300",
        };
      case "UNLOCK_EXAM":
        return {
          label: "আনলক করা হয়েছে",
          icon: Unlock,
          classes: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
        };
      case "BULK_MARKS_SUBMIT":
        return {
          label: "চূড়ান্ত নম্বর সাবমিট",
          icon: CheckCircle2,
          classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300",
        };
      case "MODIFY_MARKS":
        return {
          label: "নম্বর সংশোধন",
          icon: FileText,
          classes: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300",
        };
      case "CREATE_EXAM":
        return {
          label: "পরীক্ষা তৈরি",
          icon: History,
          classes: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300",
        };
      default:
        return {
          label: action,
          icon: Clock,
          classes: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>অডিট ও সংশোধন লগ (Audit & Correction History)</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            পরীক্ষার নম্বর পরিবর্তন ও প্রাতিষ্ঠানিক অডিট ট্রেইল
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            প্রতিটি নম্বর প্রদান, সংশোধন, আনলক ও স্ট্যাটাস পরিবর্তনের স্বচ্ছ ডিজিটাল রেকর্ড
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="শিক্ষক, শিক্ষার্থী বা কারণ দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-500 dark:text-slate-400">অ্যাকশন ফিল্টার:</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
            >
              <option value="all">সকল অ্যাকশন</option>
              <option value="LOCK_EXAM">লক (Locked)</option>
              <option value="UNLOCK_EXAM">আনলক (Unlocked)</option>
              <option value="MODIFY_MARKS">নম্বর সংশোধন (Modify Marks)</option>
              <option value="BULK_MARKS_SUBMIT">চূড়ান্ত সাবমিট</option>
              <option value="UPDATE_STATUS">স্ট্যাটাস পরিবর্তন</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">সময় ও তারিখ</th>
                <th className="p-3.5">অ্যাকশন টাইপ</th>
                <th className="p-3.5">পরীক্ষা ও সংশ্লিষ্ট বিষয়</th>
                <th className="p-3.5">সম্পাদনকারী কর্মকর্তা</th>
                <th className="p-3.5">কারণ ও পরিবর্তন বিবরণী</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    কোনো অডিট রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const Icon = badge.icon;
                  const dateStr = new Date(log.timestamp).toLocaleString("bn-BD", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/60 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">
                        {dateStr}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.classes}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {log.examName}
                        </span>
                        {log.subjectName && (
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                            {log.subjectName} {log.subjectCode ? `(${log.subjectCode})` : ""}
                          </span>
                        )}
                        {log.studentName && (
                          <span className="text-[11px] text-slate-400 block">
                            শিক্ষার্থী: {log.studentName} (রোল: {toBengaliNumerals(log.roll || 0)})
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{log.changedBy}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        <span className="font-medium block">{log.reason}</span>
                        {log.previousValues && log.newValues && (
                          <div className="mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-mono">
                            <span className="text-rose-500">পূর্বের মান: {JSON.stringify(log.previousValues)}</span>
                            <br />
                            <span className="text-emerald-500">নতুন মান: {JSON.stringify(log.newValues)}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
