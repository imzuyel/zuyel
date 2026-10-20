"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  FileText,
  Printer,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  BookOpen,
  Filter,
} from "lucide-react";

export default function ExamRoutineView() {
  const { t, language } = useLanguage();
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("all");

  useEffect(() => {
    fetch("/api/exam-routine")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRoutines(data.items || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = routines.filter(
    (r) => filterClass === "all" || r.classLevel.includes(filterClass)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              পরীক্ষার সময়সূচি (Official Exam Timetable)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            অর্ধবার্ষিক ও চূড়ান্ত মূল্যায়ন পরীক্ষার তারিখ, বিষয় কোড, সময় ও হল বিন্যাস
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট / PDF ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* Routine Cards Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden text-xs">
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold">
          <span className="text-slate-900 dark:text-white">
            অর্ধবার্ষিক মূল্যায়ন ২০২৬ (মোট {filtered.length} টি পরীক্ষা)
          </span>
          <span className="text-[11px] font-mono text-indigo-600 dark:text-cyan-400">BTEB Routine</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
              <tr>
                <th className="p-3.5">তারিখ ও বার</th>
                <th className="p-3.5">সময়সূচি</th>
                <th className="p-3.5">শ্রেণি ও ট্রেড</th>
                <th className="p-3.5">বিষয় ও কোড</th>
                <th className="p-3.5 text-center">পরীক্ষার কক্ষ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    সময়সূচি লোড হচ্ছে...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    কোনও পরীক্ষার রুটিন পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      <div className="font-mono text-indigo-700 dark:text-cyan-400">{item.date}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.day}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{item.time}</span>
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                      <div>{item.classLevel}</div>
                      <div className="text-[10px] text-teal-700 dark:text-teal-400">{item.tradeName}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{item.subjectName}</div>
                      <div className="font-mono text-[10px] text-indigo-600 dark:text-cyan-400">
                        কোড: {item.subjectCode}
                      </div>
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {item.roomNo}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
