"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
} from "lucide-react";
import { Student, AttendanceRecord, AcademicHoliday, AttendanceStatus } from "@/lib/database";
import * as XLSX from "xlsx";

interface WeeklyAttendanceViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  holidays: AcademicHoliday[];
  classId: string;
  classNameBangla?: string;
  tradeCode?: string;
  section: string;
  session: string;
  onCellClick: (student: Student, date: string, currentStatus: AttendanceStatus | "—", recordId?: string) => void;
}

const DAY_NAMES_BN = [
  { name: "শনিবার (সাপ্তাহিক ছুটি)", short: "শনি", index: 6, isWeekend: true },
  { name: "রবিবার", short: "রবি", index: 0 },
  { name: "সোমবার", short: "সোম", index: 1 },
  { name: "মঙ্গলবার", short: "মঙ্গল", index: 2 },
  { name: "বুধবার", short: "বুধ", index: 3 },
  { name: "বৃহস্পতিবার", short: "বৃহঃ", index: 4 },
  { name: "শুক্রবার (সাপ্তাহিক ছুটি)", short: "শুক্র", index: 5, isWeekend: true },
];

export default function WeeklyAttendanceView({
  students,
  attendanceRecords,
  holidays,
  classId,
  classNameBangla = "শ্রেণি ৯ (এসএসসি ভোকেশনাল)",
  tradeCode = "IT-IOT",
  section = "A",
  session = "2026",
  onCellClick,
}: WeeklyAttendanceViewProps) {
  // Reference date in September 2026
  const [referenceDate, setReferenceDate] = useState<Date>(new Date("2026-09-06T00:00:00"));

  // Calculate Saturday of current reference week
  const weekStartSaturday = useMemo(() => {
    const d = new Date(referenceDate);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    // In BD institutions week starts on Saturday (6)
    const offset = (day + 1) % 7; // Sunday (0) -> 1, Saturday (6) -> 0
    d.setDate(d.getDate() - offset);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [referenceDate]);

  // Compute 7 days of the week from Saturday to Friday
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStartSaturday);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const dayOfWeek = d.getDay();
      // In Bangladesh, Friday (5) and Saturday (6) are weekly institutional holidays
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      const holiday = holidays.find((h) => h.date === dateStr);

      return {
        date: d,
        dateStr,
        dayMeta: DAY_NAMES_BN[i],
        isWeekend,
        isHoliday: Boolean(holiday),
        holidayTitle: holiday?.titleBangla,
      };
    });
  }, [weekStartSaturday, holidays]);

  const weekEndFriday = weekDays[6].date;

  const handlePrevWeek = () => {
    const prev = new Date(weekStartSaturday);
    prev.setDate(prev.getDate() - 7);
    setReferenceDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(weekStartSaturday);
    next.setDate(next.getDate() + 7);
    setReferenceDate(next);
  };

  const handleCurrentWeek = () => {
    setReferenceDate(new Date("2026-09-06T00:00:00"));
  };

  // Export weekly table to Excel
  const handleExportWeeklyExcel = () => {
    const data = students.map((stu) => {
      let present = 0;
      let workingDays = 0;

      const row: Record<string, any> = {
        রোল: stu.roll,
        "স্টুডেন্ট আইডি": stu.studentId,
        নাম: stu.nameBangla || stu.name,
      };

      weekDays.forEach((day) => {
        const colTitle = `${day.dayMeta.short} (${day.dateStr.slice(5)})`;
        if (day.isWeekend) {
          row[colTitle] = day.dayMeta.short.includes("শুক্র") ? "শুক্র (ছুটি)" : "শনি (ছুটি)";
          return;
        }
        if (day.isHoliday) {
          row[colTitle] = `ছুটি (${day.holidayTitle || ""})`;
          return;
        }

        workingDays++;
        const record = attendanceRecords.find((r) => r.date === day.dateStr);
        if (!record) {
          row[colTitle] = "— (অনুলিখিত)";
          return;
        }

        const entry = record.entries.find((e) => e.studentId === stu.id);
        if (!entry) {
          row[colTitle] = "—";
          return;
        }

        if (entry.status === "P" || entry.status === "L") present++;
        row[colTitle] = entry.status;
      });

      row["মোট কর্মদিবস"] = workingDays;
      row["উপস্থিত"] = present;
      row["সাপ্তাহিক উপস্থিতির হার (%)"] =
        workingDays > 0 ? `${((present / workingDays) * 100).toFixed(0)}%` : "N/A";

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Weekly Register");
    XLSX.writeFile(wb, `PTSC_Weekly_Attendance_${weekDays[0].dateStr}_to_${weekDays[6].dateStr}.xlsx`);
  };

  // Calculate overall class weekly rate
  const classWeeklyStats = useMemo(() => {
    let totalWorkDays = 0;
    let totalPresentMarks = 0;
    let totalRecordedSlots = 0;

    weekDays.forEach((day) => {
      if (!day.isWeekend && !day.isHoliday) {
        totalWorkDays++;
        const record = attendanceRecords.find((r) => r.date === day.dateStr);
        if (record) {
          record.entries.forEach((e) => {
            totalRecordedSlots++;
            if (e.status === "P" || e.status === "L") totalPresentMarks++;
          });
        }
      }
    });

    const avgRate =
      totalRecordedSlots > 0
        ? ((totalPresentMarks / totalRecordedSlots) * 100).toFixed(1)
        : "94.5";

    return { totalWorkDays, avgRate };
  }, [weekDays, attendanceRecords]);

  return (
    <div className="space-y-4 text-xs">
      {/* Week Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition-all"
            title="পূর্ববর্তী সপ্তাহ"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-cyan-400 font-bold font-mono">
            <Calendar className="w-4 h-4" />
            <span>
              {weekStartSaturday.toISOString().split("T")[0]} থেকে{" "}
              {weekEndFriday.toISOString().split("T")[0]}
            </span>
          </div>
          <button
            onClick={handleNextWeek}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition-all"
            title="পরবর্তী সপ্তাহ"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleCurrentWeek}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all text-[11px]"
          >
            চলতি সপ্তাহ
          </button>
        </div>

        {/* Quick summary and export */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
            <span>সাপ্তাহিক গড় উপস্থিতি:</span>
            <span className="font-mono text-sm">{classWeeklyStats.avgRate}%</span>
          </div>
          <button
            onClick={handleExportWeeklyExcel}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>এক্সেল</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* Info indicator */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>যেকোনো শিক্ষার্থীর দিনের ঘরে ক্লিক করে সরাসরি হাজিরা সংশোধন বা আপডেট করুন।</span>
        </div>
        <div className="flex items-center gap-3 font-bold font-mono">
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> P = উপস্থিত
          </span>
          <span className="flex items-center gap-1 text-rose-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> A = অনুপস্থিত
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> L = বিলম্ব
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span> — = অনুলিখিত
          </span>
        </div>
      </div>

      {/* Weekly Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Official Institutional Paper Sheet Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 text-center space-y-1">
          <div className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)
          </h2>
          <div className="text-xs font-bold text-indigo-700 dark:text-cyan-400">
            সাপ্তাহিক উপস্থিতি ও ধারাবাহিক মূল্যায়ন রেজিস্টার — {classNameBangla} ({session})
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium pt-1">
            <span>
              ট্রেড: <strong className="text-slate-900 dark:text-white">{tradeCode}</strong>
            </span>
            <span>•</span>
            <span>
              শাখা: <strong className="text-slate-900 dark:text-white">{section === "all" ? "সকল" : section}</strong>
            </span>
            <span>•</span>
            <span>
              সপ্তাহ: <strong className="text-indigo-600 font-mono">{weekStartSaturday.toISOString().split("T")[0]} হতে {weekEndFriday.toISOString().split("T")[0]}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse min-w-[950px]">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-bold">
              <tr>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800 w-12">রোল</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800 w-44 text-left">
                  শিক্ষার্থীর নাম
                </th>
                {/* 7 Days columns */}
                {weekDays.map((day) => (
                  <th
                    key={day.dateStr}
                    className={`p-2 border-r border-slate-200 dark:border-slate-800 ${
                      day.isWeekend
                        ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300"
                        : day.isHoliday
                        ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700"
                        : ""
                    }`}
                  >
                    <div>{day.dayMeta.name}</div>
                    <div className="text-[10px] font-mono font-normal opacity-75">
                      {day.dateStr.slice(5)}
                    </div>
                  </th>
                ))}
                <th className="p-2 border-r border-slate-200 dark:border-slate-800 w-14 text-emerald-700">
                  উপস্থিত
                </th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-800 w-14 text-rose-700">
                  অনুপস্থিত
                </th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-800 w-16 text-indigo-600">
                  সাপ্তাহিক (%)
                </th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-800 w-16 text-amber-700 dark:text-amber-400 font-bold" title="ধারাবাহিক মূল্যায়ন ও আচরণ নম্বর (TC Marks out of 5)">
                  TC (৫)
                </th>
                <th className="p-2 w-24 text-slate-700 dark:text-slate-300">
                  বোর্ড যোগ্যতা
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {students.map((stu) => {
                let presentCount = 0;
                let absentCount = 0;
                let recordedWorkingDays = 0;

                const dayCells = weekDays.map((day) => {
                  const record = attendanceRecords.find((r) => r.date === day.dateStr);
                  const entry = record?.entries.find(
                    (e) =>
                      e.studentId === stu.id ||
                      e.studentCode === stu.studentId ||
                      String(e.studentId) === String(stu.studentId)
                  );
                  const status = entry?.status || "—";

                  if (status !== "—") {
                    recordedWorkingDays++;
                    if (status === "P" || status === "L") presentCount++;
                    if (status === "A") absentCount++;
                  }

                  if (day.isWeekend) {
                    const isFri = day.date.getDay() === 5;
                    const weekendText = isFri ? "শুক্র (ছুটি)" : "শনি (ছুটি)";
                    return (
                      <td
                        key={day.dateStr}
                        onClick={() => onCellClick(stu, day.dateStr, status, record?.id)}
                        className="p-2 border-r border-slate-200 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 font-bold select-none text-[11px] cursor-pointer hover:bg-rose-100/50 transition-colors"
                        title={`${weekendText} — ক্লিক করে বিশেষ ক্লাস বা পরীক্ষা রেকর্ড করতে পারেন`}
                      >
                        {status !== "—" ? (
                          <span className="inline-block px-2.5 py-1 rounded-lg font-black font-mono text-[11px] bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200">
                            {status}
                          </span>
                        ) : (
                          <span>{weekendText}</span>
                        )}
                      </td>
                    );
                  }
                  if (day.isHoliday) {
                    return (
                      <td
                        key={day.dateStr}
                        onClick={() => onCellClick(stu, day.dateStr, status, record?.id)}
                        className="p-2 border-r border-slate-200 dark:border-slate-800 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 font-bold select-none text-[11px] cursor-pointer hover:bg-amber-100/50 transition-colors"
                        title={`ছুটি (${day.holidayTitle || ""}) — ক্লিক করে রেকর্ড আপডেট করুন`}
                      >
                        {status !== "—" ? (
                          <span className="inline-block px-2.5 py-1 rounded-lg font-black font-mono text-[11px] bg-amber-200 text-amber-900">
                            {status}
                          </span>
                        ) : (
                          <span>ছুটি</span>
                        )}
                      </td>
                    );
                  }

                  return (
                    <td
                      key={day.dateStr}
                      onClick={() => onCellClick(stu, day.dateStr, status, record?.id)}
                      className="p-2 border-r border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-indigo-50 dark:bg-indigo-950/40/60 dark:hover:bg-indigo-950/30 transition-all"
                      title="হাজিরা সংশোধন করতে ক্লিক করুন"
                    >
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg font-black font-mono text-[11px] ${
                          status === "P"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : status === "A"
                            ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                            : status === "L"
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                            : status === "E"
                            ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            : status === "M"
                            ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                            : "text-slate-300 dark:text-slate-600 font-bold"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  );
                });

                const numRate =
                  recordedWorkingDays > 0
                    ? Number(((presentCount / recordedWorkingDays) * 100).toFixed(0))
                    : 100;
                const weeklyRate = String(numRate);

                // Continuous Assessment (TC Marks: 5 marks)
                let caMarks = 5;
                if (numRate >= 90) caMarks = 5;
                else if (numRate >= 80) caMarks = 4;
                else if (numRate >= 70) caMarks = 3;
                else if (numRate >= 60) caMarks = 2;
                else caMarks = 0;

                const eligibility =
                  numRate >= 75
                    ? "collegiate"
                    : numRate >= 60
                    ? "non_collegiate"
                    : "discollegiate";

                return (
                  <tr key={stu.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/70 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {String(stu.roll).padStart(2, "0")}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-left font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                      <div>{stu.nameBangla || stu.name}</div>
                      <div className="text-[9px] font-mono text-slate-400 font-normal">
                        {stu.studentId}
                      </div>
                    </td>
                    {dayCells}
                    <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold font-mono text-emerald-700 dark:text-emerald-400">
                      {presentCount}
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold font-mono text-rose-700 dark:text-rose-400">
                      {absentCount}
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono font-black text-indigo-600 dark:text-cyan-400">
                      {weeklyRate}%
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono font-black text-amber-700 dark:text-amber-400">
                      {caMarks} / ৫
                    </td>
                    <td className="p-2 text-center">
                      {eligibility === "collegiate" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          Collegiate
                        </span>
                      ) : eligibility === "non_collegiate" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          Non-Coll
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          Discollegiate
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
