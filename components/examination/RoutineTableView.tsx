"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Clock,
  Printer,
  Calendar,
  Layers,
  MapPin,
  User,
  BookOpen,
  Filter,
  CheckCircle2,
} from "lucide-react";
import AnimatedGears from "../common/AnimatedGears";

export default function RoutineTableView() {
  const { t, language } = useLanguage();
  const [routines, setRoutines] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState("Sunday");
  const [selectedClass, setSelectedClass] = useState("4"); // Class 9
  const [loading, setLoading] = useState(true);

  const days = [
    { id: "Sunday", label: "রবিবার (Sun)" },
    { id: "Monday", label: "সোমবার (Mon)" },
    { id: "Tuesday", label: "মঙ্গলবার (Tue)" },
    { id: "Wednesday", label: "বুধবার (Wed)" },
    { id: "Thursday", label: "বৃহস্পতিবার (Thu)" },
  ];

  const classes = [
    { id: "1", label: "Class 6 (Pre-Voc)" },
    { id: "2", label: "Class 7 (Pre-Voc)" },
    { id: "3", label: "Class 8 (Junior Voc)" },
    { id: "4", label: "Class 9 (SSC Voc)" },
    { id: "5", label: "Class 10 (SSC Voc)" },
    { id: "6", label: "Class 11 (HSC Voc)" },
    { id: "7", label: "Class 12 (HSC Voc)" },
  ];

  useEffect(() => {
    let ignore = false;
    fetch(`/api/routine?classId=${selectedClass}&day=${selectedDay}`)
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) {
          return { success: false, items: [] };
        }
        return res.json();
      })
      .then((json) => {
        if (!ignore) {
          if (json.success) {
            setRoutines(json.items || []);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedClass, selectedDay]);

  const handleRefresh = () => {
    setLoading(true);
    fetch(`/api/routine?classId=${selectedClass}&day=${selectedDay}`)
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) {
          return { success: false, items: [] };
        }
        return res.json();
      })
      .then((json) => {
        if (json.success) {
          setRoutines(json.items || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400">
              <Clock className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              ক্লাস ও ব্যবহারিক ল্যাব রুটিন (Timetable)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            প্রতিটি ক্লাসের সময়সূচি, বিষয় কোড, শিক্ষক ও বরাদ্দকৃত ল্যাব/কক্ষ নম্বর
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>রুটিন প্রিন্ট / PDF</span>
        </button>
      </div>

      {/* Class & Day Selectors */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4 no-print text-xs">
        {/* Class Selection Tabs */}
        <div>
          <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">শ্রেণি নির্বাচন:</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClass(c.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedClass === c.id
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Day Selection Tabs */}
        <div>
          <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">বার নির্বাচন:</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {days.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDay(d.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedDay === d.id
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-[0_0_15px_rgba(20,184,166,0.4)]"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timetable View */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden text-xs">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold">
          <span className="text-slate-900 dark:text-white">
            {days.find((d) => d.id === selectedDay)?.label} — {classes.find((c) => c.id === selectedClass)?.label}
          </span>
          <span className="text-[11px] font-mono text-teal-700 dark:text-teal-400">
            ৪০ মি. তত্ত্বীয় ও ১২০ মি. ব্যবহারিক ক্লাস
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
              <tr>
                <th className="p-3.5 text-center">ক্রম</th>
                <th className="p-3.5">সময়সূচি</th>
                <th className="p-3.5">বিষয় ও কোড</th>
                <th className="p-3.5">ট্রেড</th>
                <th className="p-3.5">শিক্ষক / ইন্সট্রাক্টর</th>
                <th className="p-3.5 text-center">কক্ষ / ল্যাব নং</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    রুটিন লোড হচ্ছে...
                  </td>
                </tr>
              ) : routines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    এই দিনের জন্য কোনও ক্লাস বরাদ্দ নেই।
                  </td>
                </tr>
              ) : (
                routines.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800/40 transition-colors ${
                      item.durationMinutes >= 120
                        ? "bg-amber-50/50 dark:bg-amber-950/20 font-medium"
                        : ""
                    }`}
                  >
                    <td className="p-3.5 text-center font-mono font-black text-indigo-600 dark:text-cyan-400">
                      {item.periodNo}
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                      <div className="font-bold text-xs">{item.startTime} - {item.endTime}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.durationMinutes} মিনিট</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.subjectNameBangla || item.subjectName}
                      </div>
                      <div className="font-mono text-[10px] text-indigo-600 dark:text-cyan-400">
                        কোড: {item.subjectCode}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-400 border border-indigo-200 dark:border-indigo-800">
                        {item.tradeName || "All Trades"}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-800 dark:text-slate-200 font-medium">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.teacherName}</span>
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
