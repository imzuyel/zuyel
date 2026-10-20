"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileSpreadsheet,
  Printer,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import {
  Student,
  AttendanceRecord,
  AcademicHoliday,
  AttendanceStatus,
} from "@/lib/database";
import * as XLSX from "xlsx";

export interface MonthlyAttendanceRegisterViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  holidays: AcademicHoliday[];
  classId: string | number;
  classNameBangla?: string;
  tradeCode?: string;
  tradeNameBangla?: string;
  section: string;
  session: string;
  selectedMonth: string; // "01" to "12"
  onMonthChange: (month: string) => void;
  onCellClick: (
    student: Student,
    date: string,
    currentStatus: AttendanceStatus | "—",
    recordId?: string
  ) => void;
}

export const MONTH_NAMES_BN = [
  { id: "01", name: "জানুয়ারি (January)", short: "জানু", days: 31 },
  { id: "02", name: "ফেব্রুয়ারি (February)", short: "ফেব্রু", days: 28 },
  { id: "03", name: "মার্চ (March)", short: "মার্চ", days: 31 },
  { id: "04", name: "এপ্রিল (April)", short: "এপ্রি", days: 30 },
  { id: "05", name: "মে (May)", short: "মে", days: 31 },
  { id: "06", name: "জুন (June)", short: "জুন", days: 30 },
  { id: "07", name: "জুলাই (July)", short: "জুলাই", days: 31 },
  { id: "08", name: "আগস্ট (August)", short: "আগস্ট", days: 31 },
  { id: "09", name: "সেপ্টেম্বর (September)", short: "সেপ্টে", days: 30 },
  { id: "10", name: "অক্টোবর (October)", short: "অক্টো", days: 31 },
  { id: "11", name: "নভেম্বর (November)", short: "নভে", days: 30 },
  { id: "12", name: "ডিসেম্বর (December)", short: "ডিসে", days: 31 },
];

export default function MonthlyAttendanceRegisterView({
  students,
  attendanceRecords,
  holidays,
  classId,
  classNameBangla = "শ্রেণি ৯ (এসএসসি ভোকেশনাল)",
  tradeCode = "IT-IOT",
  tradeNameBangla = "আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস",
  section = "A",
  session = "2026",
  selectedMonth,
  onMonthChange,
  onCellClick,
}: MonthlyAttendanceRegisterViewProps) {
  const currentMonthMeta = useMemo(() => {
    return (
      MONTH_NAMES_BN.find((m) => m.id === selectedMonth) || MONTH_NAMES_BN[8]
    );
  }, [selectedMonth]);

  // Compute every day of the month with weekend (Friday + Saturday) and holiday detection
  const daysOfMonth = useMemo(() => {
    const totalDays = currentMonthMeta.days;
    return Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${session}-${selectedMonth}-${String(dayNum).padStart(2, "0")}`;
      const d = new Date(dateStr + "T00:00:00");
      const dayOfWeek = d.getDay(); // 0: Sun, 1: Mon, ... 5: Fri, 6: Sat

      // Bangladesh Institutional Weekends: BOTH Friday (5) and Saturday (6)
      const isFriday = dayOfWeek === 5;
      const isSaturday = dayOfWeek === 6;
      const isWeekend = isFriday || isSaturday;

      const foundHoliday = holidays.find((h) => h.date === dateStr);

      let dayNameBangla = "রবি";
      if (dayOfWeek === 1) dayNameBangla = "সোম";
      else if (dayOfWeek === 2) dayNameBangla = "মঙ্গল";
      else if (dayOfWeek === 3) dayNameBangla = "বুধ";
      else if (dayOfWeek === 4) dayNameBangla = "বৃহঃ";
      else if (dayOfWeek === 5) dayNameBangla = "শুক্র";
      else if (dayOfWeek === 6) dayNameBangla = "শনি";

      return {
        dayNum,
        dateStr,
        dayOfWeek,
        dayNameBangla,
        isFriday,
        isSaturday,
        isWeekend,
        isHoliday: Boolean(foundHoliday),
        holidayTitle: foundHoliday?.titleBangla,
        isWorkingDay: !isWeekend && !foundHoliday,
      };
    });
  }, [session, selectedMonth, currentMonthMeta.days, holidays]);

  // Total working days in this month
  const totalWorkingDaysInMonth = useMemo(() => {
    return daysOfMonth.filter((d) => d.isWorkingDay).length;
  }, [daysOfMonth]);

  // Calculate student monthly attendance metrics and BTEB Continuous Assessment (CA) scores
  const studentMetrics = useMemo(() => {
    return students.map((stu) => {
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let excusedCount = 0;
      let medicalCount = 0;
      let recordedDays = 0;

      // Day-by-day cell data
      const cellData = daysOfMonth.map((day) => {
        // Search attendance record on this date
        const record = attendanceRecords.find((r) => r.date === day.dateStr);
        const entry = record?.entries.find(
          (e) =>
            e.studentId === stu.id ||
            e.studentCode === stu.studentId ||
            String(e.studentId) === String(stu.studentId)
        );

        const status: AttendanceStatus | "—" = entry?.status || "—";

        if (status !== "—") {
          recordedDays++;
          if (status === "P") presentCount++;
          else if (status === "A") absentCount++;
          else if (status === "L") {
            presentCount++;
            lateCount++;
          } else if (status === "E") excusedCount++;
          else if (status === "M") medicalCount++;
        }

        return {
          day,
          status,
          recordId: record?.id,
          remark: entry?.remark,
        };
      });

      // Attendance percentage
      const effectiveWorkingDays =
        totalWorkingDaysInMonth > 0 ? totalWorkingDaysInMonth : recordedDays || 1;
      const rate =
        totalWorkingDaysInMonth > 0
          ? Number(((presentCount / totalWorkingDaysInMonth) * 100).toFixed(1))
          : (stu.attendanceRate || 92);

      // BTEB Continuous Assessment (CA / TC Marks): Attendance & Conduct out of 5 marks
      // BTEB Official Formula:
      // >= 90%: 5 marks
      // 80% - 89%: 4 marks
      // 70% - 79%: 3 marks
      // 60% - 69%: 2 marks
      // < 60%: 0 marks
      let caAttendanceMarks = 0;
      if (rate >= 90) caAttendanceMarks = 5;
      else if (rate >= 80) caAttendanceMarks = 4;
      else if (rate >= 70) caAttendanceMarks = 3;
      else if (rate >= 60) caAttendanceMarks = 2;
      else caAttendanceMarks = 0;

      // Board eligibility
      let eligibility: "collegiate" | "non_collegiate" | "discollegiate" = "collegiate";
      if (rate < 60) {
        eligibility = "discollegiate";
      } else if (rate < 75) {
        eligibility = "non_collegiate";
      }

      return {
        student: stu,
        cellData,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        medicalCount,
        effectiveWorkingDays,
        rate,
        caAttendanceMarks,
        eligibility,
      };
    });
  }, [students, daysOfMonth, attendanceRecords, totalWorkingDaysInMonth]);

  // Overall class average for this month
  const classAvgRate = useMemo(() => {
    if (studentMetrics.length === 0) return "92.4";
    const sum = studentMetrics.reduce((acc, m) => acc + m.rate, 0);
    return (sum / studentMetrics.length).toFixed(1);
  }, [studentMetrics]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    const currentIdx = MONTH_NAMES_BN.findIndex((m) => m.id === selectedMonth);
    if (currentIdx > 0) {
      onMonthChange(MONTH_NAMES_BN[currentIdx - 1].id);
    } else {
      onMonthChange("12");
    }
  };

  const handleNextMonth = () => {
    const currentIdx = MONTH_NAMES_BN.findIndex((m) => m.id === selectedMonth);
    if (currentIdx < MONTH_NAMES_BN.length - 1) {
      onMonthChange(MONTH_NAMES_BN[currentIdx + 1].id);
    } else {
      onMonthChange("01");
    }
  };

  // Export Monthly Register to Excel
  const handleExportExcel = () => {
    const data = studentMetrics.map((m) => {
      const row: Record<string, any> = {
        রোল: m.student.roll,
        "স্টুডেন্ট আইডি": m.student.studentId,
        "শিক্ষার্থীর নাম": m.student.nameBangla || m.student.name,
      };

      m.cellData.forEach((cd) => {
        const colTitle = `${cd.day.dayNum} (${cd.day.dayNameBangla})`;
        if (cd.day.isWeekend) {
          row[colTitle] = cd.day.isFriday ? "শুক্র (সাপ্তাহিক ছুটি)" : "শনি (সাপ্তাহিক ছুটি)";
          return;
        }
        if (cd.day.isHoliday) {
          row[colTitle] = `ছুটি (${cd.day.holidayTitle || ""})`;
          return;
        }
        row[colTitle] = cd.status === "—" ? "অনুলিখিত" : cd.status;
      });

      row["মোট কর্মদিবস"] = m.effectiveWorkingDays;
      row["উপস্থিত (দিন)"] = m.presentCount;
      row["অনুপস্থিত (দিন)"] = m.absentCount;
      row["উপস্থিতির হার (%)"] = `${m.rate}%`;
      row["ধারাবাহিক মূল্যায়ন নম্বর (TC / ৫)"] = m.caAttendanceMarks;
      row["বোর্ড পরীক্ষার যোগ্যতা"] =
        m.eligibility === "collegiate"
          ? "Collegiate (যোগ্য)"
          : m.eligibility === "non_collegiate"
          ? "Non-Collegiate (শর্তসাপেক্ষ)"
          : "Discollegiate (অযোগ্য)";

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Register");
    XLSX.writeFile(
      wb,
      `PTSC_Monthly_Register_${session}_${selectedMonth}_Class_${classId}.xlsx`
    );
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* 1. Header & Month Switcher Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition-all"
            title="পূর্ববর্তী মাস"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-cyan-400 font-bold">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-transparent border-none text-xs font-bold focus:outline-none cursor-pointer text-indigo-900 dark:text-cyan-300"
            >
              {MONTH_NAMES_BN.map((m) => (
                <option key={m.id} value={m.id} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                  {m.name} {session}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition-all"
            title="পরবর্তী মাস"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-bold">
            <span>মাসিক কর্মদিবস:</span>
            <span className="font-mono text-indigo-600 dark:text-cyan-400 font-black">
              {totalWorkingDaysInMonth} দিন
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
            <span>গড় উপস্থিতি:</span>
            <span className="font-mono text-sm">{classAvgRate}%</span>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>এক্সেল</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট ও PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Guidance Banner */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 gap-2 no-print">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>
            <strong>ইন্টারেক্টিভ গ্রিড:</strong> যেকোনো তারিখের ঘরে ক্লিক করে সরাসরি হাজিরা সংশোধন (P/A/L/E/M) করুন।
          </span>
        </div>
        <div className="flex items-center gap-3 font-bold font-mono text-[10px] flex-wrap">
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> P = উপস্থিত
          </span>
          <span className="flex items-center gap-1 text-rose-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> A = অনুপস্থিত
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> L = বিলম্ব
          </span>
          <span className="flex items-center gap-1 text-blue-600">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> E = ছুটি
          </span>
          <span className="flex items-center gap-1 text-purple-600">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> M = চিকিৎসা
          </span>
          <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-300 dark:bg-rose-800"></span> শু/শ = সাপ্তাহিক ছুটি
          </span>
        </div>
      </div>

      {/* 3. Official BTEB Traditional Register Paper Sheet */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Institutional Paper Sheet Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 text-center space-y-1">
          <div className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)
          </h2>
          <div className="text-xs font-bold text-indigo-700 dark:text-cyan-400">
            শিক্ষার্থী উপস্থিতি ও ধারাবাহিক মূল্যায়ন রেজিস্টার খাতা — {currentMonthMeta.name} {session}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium pt-1">
            <span>
              শ্রেণি: <strong className="text-slate-900 dark:text-white">{classNameBangla}</strong>
            </span>
            <span>•</span>
            <span>
              ট্রেড: <strong className="text-slate-900 dark:text-white">{tradeNameBangla} ({tradeCode})</strong>
            </span>
            <span>•</span>
            <span>
              শাখা: <strong className="text-slate-900 dark:text-white">{section === "all" ? "সকল" : section}</strong>
            </span>
            <span>•</span>
            <span>
              মাসিক কর্মদিবস: <strong className="text-indigo-600 font-mono">{totalWorkingDaysInMonth} দিন</strong>
            </span>
          </div>
        </div>

        {/* 1 to 31 Day Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse min-w-[1300px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10">
              <tr>
                <th className="p-2 border-r border-slate-200 dark:border-slate-800 w-12 text-center">
                  রোল
                </th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-800 w-44 text-left">
                  শিক্ষার্থীর নাম
                </th>

                {/* Day Columns (1 to 28/30/31) */}
                {daysOfMonth.map((day) => {
                  return (
                    <th
                      key={day.dayNum}
                      className={`p-1 border-r border-slate-200 dark:border-slate-800 w-7 font-mono ${
                        day.isWeekend
                          ? "bg-rose-100/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300"
                          : day.isHoliday
                          ? "bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300"
                          : ""
                      }`}
                      title={
                        day.isFriday
                          ? "শুক্রবার (সাপ্তাহিক ছুটি)"
                          : day.isSaturday
                          ? "শনিবার (সাপ্তাহিক ছুটি)"
                          : day.isHoliday
                          ? `সরকারি ছুটি: ${day.holidayTitle}`
                          : `${day.dayNum} তারিখ (${day.dayNameBangla})`
                      }
                    >
                      <div className="text-[11px] leading-tight font-black">{day.dayNum}</div>
                      <div className="text-[8px] font-normal leading-tight opacity-80">
                        {day.isFriday ? "শুক্র" : day.isSaturday ? "শনি" : day.dayNameBangla}
                      </div>
                    </th>
                  );
                })}

                {/* BTEB Continuous Assessment & Attendance Columns */}
                <th className="p-2 border-r border-slate-200 dark:border-slate-800 w-14 text-emerald-700 dark:text-emerald-400 font-black">
                  উপস্থিত
                </th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-800 w-14 text-rose-700 dark:text-rose-400 font-black">
                  অনুপস্থিত
                </th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-800 w-16 text-indigo-700 dark:text-cyan-400 font-black">
                  হার (%)
                </th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-800 w-16 text-amber-700 dark:text-amber-400 font-black" title="ধারাবাহিক মূল্যায়ন ও আচরণ নম্বর (TC Marks out of 5)">
                  TC (৫)
                </th>
                <th className="p-2 w-24 text-slate-700 dark:text-slate-300 font-black">
                  বোর্ড যোগ্যতা
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              {studentMetrics.length === 0 ? (
                <tr>
                  <td
                    colSpan={daysOfMonth.length + 7}
                    className="p-8 text-center text-slate-400 text-xs"
                  >
                    কোনো শিক্ষার্থী পাওয়া যায়নি। অনুগ্রহ করে সঠিক শ্রেণি ও শাখা নির্বাচন করুন।
                  </td>
                </tr>
              ) : (
                studentMetrics.map((m) => {
                  return (
                    <tr
                      key={m.student.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Roll */}
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {String(m.student.roll).padStart(2, "0")}
                      </td>

                      {/* Name */}
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-left font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                        <div>{m.student.nameBangla || m.student.name}</div>
                        <div className="text-[9px] font-mono text-slate-400 font-normal">
                          {m.student.studentId}
                        </div>
                      </td>

                      {/* Day cells (interactive!) */}
                      {m.cellData.map(({ day, status, recordId }) => {
                        // 1. Weekend Cell: Friday (শুক্র) & Saturday (শনি)
                        if (day.isWeekend) {
                          const weekendText = day.isFriday ? "শু" : "শ";
                          const weekendFull = day.isFriday
                            ? "শুক্রবার (সাপ্তাহিক ছুটি)"
                            : "শনিবার (সাপ্তাহিক ছুটি)";

                          return (
                            <td
                              key={day.dayNum}
                              onClick={() =>
                                onCellClick(m.student, day.dateStr, status, recordId)
                              }
                              className="p-1 border-r border-slate-200 dark:border-slate-800 bg-rose-50/40 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 font-bold select-none text-[10px] cursor-pointer hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition-colors"
                              title={`${weekendFull} — ক্লিক করে বিশেষ ক্লাস বা হাজিরা আপডেট করতে পারেন`}
                            >
                              {status !== "—" ? (
                                <span className="inline-block px-1.5 py-0.5 rounded font-black font-mono text-[10px] bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200">
                                  {status}
                                </span>
                              ) : (
                                <span>{weekendText}</span>
                              )}
                            </td>
                          );
                        }

                        // 2. Academic Holiday Cell
                        if (day.isHoliday) {
                          return (
                            <td
                              key={day.dayNum}
                              onClick={() =>
                                onCellClick(m.student, day.dateStr, status, recordId)
                              }
                              className="p-1 border-r border-slate-200 dark:border-slate-800 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-bold select-none text-[10px] cursor-pointer hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-colors"
                              title={`সরকারি ছুটি: ${day.holidayTitle || ""} — ক্লিক করে হাজিরা আপডেট করুন`}
                            >
                              {status !== "—" ? (
                                <span className="inline-block px-1.5 py-0.5 rounded font-black font-mono text-[10px] bg-amber-200 text-amber-900">
                                  {status}
                                </span>
                              ) : (
                                <span>ছু</span>
                              )}
                            </td>
                          );
                        }

                        // 3. Regular Interactive Working Day Cell
                        return (
                          <td
                            key={day.dayNum}
                            onClick={() =>
                              onCellClick(m.student, day.dateStr, status, recordId)
                            }
                            className="p-1 border-r border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-indigo-50 dark:bg-indigo-950/40/80 dark:hover:bg-indigo-950/50 transition-colors select-none"
                            title={`${day.dayNum} তারিখ: ${status === "—" ? "অনুলিখিত" : status} — ক্লিক করে সংশোধন করুন`}
                          >
                            {status === "P" ? (
                              <span className="inline-block px-1.5 py-0.5 rounded font-black font-mono text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                                P
                              </span>
                            ) : status === "A" ? (
                              <span className="inline-block px-1.5 py-0.5 rounded font-black font-mono text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                                A
                              </span>
                            ) : status === "L" ? (
                              <span className="inline-block px-1.5 py-0.5 rounded font-black font-mono text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                                L
                              </span>
                            ) : status === "E" ? (
                              <span className="inline-block px-1.5 py-0.5 rounded font-black font-mono text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                                E
                              </span>
                            ) : status === "M" ? (
                              <span className="inline-block px-1.5 py-0.5 rounded font-black font-mono text-[10px] bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                                M
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 font-mono text-[10px]">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Present */}
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {m.presentCount}
                      </td>

                      {/* Total Absent */}
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-rose-700 dark:text-rose-400">
                        {m.absentCount}
                      </td>

                      {/* Attendance Rate */}
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono font-black text-indigo-700 dark:text-cyan-400">
                        {m.rate}%
                      </td>

                      {/* TC Continuous Assessment Mark out of 5 */}
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono font-black text-amber-700 dark:text-amber-400">
                        {m.caAttendanceMarks} / ৫
                      </td>

                      {/* Board Eligibility */}
                      <td className="p-2 text-center">
                        {m.eligibility === "collegiate" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Collegiate
                          </span>
                        ) : m.eligibility === "non_collegiate" ? (
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
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paper Sheet Footer with Signature Placeholders */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="space-y-1">
            <p className="font-bold text-slate-700 dark:text-slate-300">
              * বিটিইবি নিয়মানুযায়ী উপস্থিতির স্কোরিং নির্দেশিকা:
            </p>
            <p className="text-[11px]">
              ৯০% বা তদূর্ধ্ব: ৫/৫ • ৮০%-৮৯%: ৪/৫ • ৭০%-৭৯%: ৩/৫ • ৬০%-৬৯%: ২/৫ • ৬০% এর নিচে: ০ (পরীক্ষায় অযোগ্য)।
            </p>
          </div>

          <div className="flex items-center gap-12 text-center text-xs font-bold text-slate-700 dark:text-slate-300 pt-6 sm:pt-0">
            <div className="space-y-1">
              <div className="w-32 border-b border-dashed border-slate-400"></div>
              <span>শ্রেণি শিক্ষকের স্বাক্ষর</span>
            </div>
            <div className="space-y-1">
              <div className="w-32 border-b border-dashed border-slate-400"></div>
              <span>অধ্যক্ষ / শাখা প্রধানের স্বাক্ষর</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
