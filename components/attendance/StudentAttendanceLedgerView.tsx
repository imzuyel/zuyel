"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  UserCheck,
  UserX,
  Clock,
  Award,
  AlertTriangle,
  Phone,
  MessageSquare,
  FileSpreadsheet,
  Printer,
  Calendar,
  CheckCircle2,
  XCircle,
  Edit2,
  Filter,
} from "lucide-react";
import { Student, AttendanceRecord, AttendanceStatus } from "@/lib/database";
import { toBanglaDateString } from "@/lib/utils";
import * as XLSX from "xlsx";

interface StudentAttendanceLedgerViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  classNameBangla?: string;
  tradeCode?: string;
  section: string;
  onEditEntry: (student: Student, date: string, currentStatus: AttendanceStatus, recordId?: string, remark?: string) => void;
}

export default function StudentAttendanceLedgerView({
  students,
  attendanceRecords,
  classNameBangla = "শ্রেণি ৯ (এসএসসি ভোকেশনাল)",
  tradeCode = "IT-IOT",
  section = "A",
  onEditEntry,
}: StudentAttendanceLedgerViewProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<number>(
    students.length > 0 ? students[0].id : 1
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "P" | "A" | "L" | "E">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [smsSentNotice, setSmsSentNotice] = useState<string | null>(null);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  // Extract all sessions / entries for this selected student
  const studentChronologicalEntries = useMemo(() => {
    if (!selectedStudent) return [];

    const list: {
      date: string;
      periodNo: number;
      subjectName: string;
      teacherName: string;
      status: AttendanceStatus;
      remark: string;
      recordId: string;
      isLocked: boolean;
    }[] = [];

    attendanceRecords.forEach((record) => {
      const entry = record.entries.find((e) => e.studentId === selectedStudent.id);
      if (entry) {
        list.push({
          date: record.date,
          periodNo: record.periodNo || 1,
          subjectName: record.subjectName || "সাধারণ শ্রেণি হাজিরা",
          teacherName: record.teacherName || "নির্ধারিত শিক্ষক",
          status: entry.status,
          remark: entry.remark || "",
          recordId: record.id,
          isLocked: record.isLocked,
        });
      }
    });

    // Sort descending by date
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [attendanceRecords, selectedStudent]);

  // Filtered by status
  const filteredEntries = useMemo(() => {
    if (statusFilter === "all") return studentChronologicalEntries;
    return studentChronologicalEntries.filter((e) => e.status === statusFilter);
  }, [studentChronologicalEntries, statusFilter]);

  // KPIs
  const totalClasses = studentChronologicalEntries.length;
  const presentCount = studentChronologicalEntries.filter((e) => e.status === "P").length;
  const absentCount = studentChronologicalEntries.filter((e) => e.status === "A").length;
  const lateCount = studentChronologicalEntries.filter((e) => e.status === "L").length;
  const excusedCount = studentChronologicalEntries.filter((e) => e.status === "E").length;

  const attendanceRate =
    totalClasses > 0
      ? Number((((presentCount + lateCount) / totalClasses) * 100).toFixed(1))
      : selectedStudent?.attendanceRate || 95.0;

  const isCollegiate = attendanceRate >= 75.0;
  const isNonCollegiate = attendanceRate >= 60.0 && attendanceRate < 75.0;
  const isDiscollegiate = attendanceRate < 60.0;

  // Handle Simulated SMS
  const handleSendGuardianSms = () => {
    setSmsSentNotice(
      `অভিভাবকের মোবাইল (${selectedStudent?.guardianMobile}) নম্বরে স্বয়ংক্রিয় হাজিরা সতর্কবার্তা সফলভাবে প্রেরিত হয়েছে!`
    );
    setTimeout(() => setSmsSentNotice(null), 5000);
  };

  // Export to Excel
  const handleExportStudentExcel = () => {
    if (!selectedStudent) return;
    const data = studentChronologicalEntries.map((e) => ({
      তারিখ: e.date,
      পিরিয়ড: `${e.periodNo}ম পিরিয়ড`,
      বিষয়: e.subjectName,
      শিক্ষক: e.teacherName,
      স্ট্যাটাস:
        e.status === "P"
          ? "উপস্থিত (Present)"
          : e.status === "A"
          ? "অনুপস্থিত (Absent)"
          : e.status === "L"
          ? "বিলম্ব (Late)"
          : "ছুটি (Excused)",
      মন্তব্য: e.remark,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance History");
    XLSX.writeFile(wb, `PTSC_Student_${selectedStudent.studentId}_Attendance_Report.xlsx`);
  };

  if (!selectedStudent) {
    return (
      <div className="p-8 text-center text-slate-400">
        কোনো শিক্ষার্থী পাওয়া যায়নি। ফিল্টার পরিবর্তন করুন।
      </div>
    );
  }

  return (
    <div className="space-y-5 text-xs">
      {/* Toast Notice */}
      {smsSentNotice && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2 animate-fade-in no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{smsSentNotice}</span>
        </div>
      )}

      {/* Student Selection Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">শিক্ষার্থী নির্বাচন করুন:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(Number(e.target.value))}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                রোল {s.roll} — {s.nameBangla || s.name} ({s.studentId})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportStudentExcel}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>শিক্ষার্থীর রিপোর্ট এক্সেল</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* Student Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-400 font-mono font-black text-2xl flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shrink-0">
              {selectedStudent.roll}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedStudent.nameBangla || selectedStudent.name}
                </h3>
                <span className="font-mono text-xs text-slate-400">({selectedStudent.name})</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                আইডি: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedStudent.studentId}</span> | 
                শ্রেণি: {classNameBangla} | ট্রেড: {tradeCode} | শাখা: {section}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                পিতা: {selectedStudent.fatherName || "মোঃ রফিকুল ইসলাম"} | মাতা: {selectedStudent.motherName || "মোছাঃ রোকেয়া বেগম"}
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="text-[11px] font-bold text-slate-400">বোর্ড পরীক্ষার যোগ্যতা স্ট্যাটাস:</div>
            {isCollegiate ? (
              <span className="inline-block px-3 py-1 rounded-xl text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                ✓ নিয়মিত (Collegiate Eligible)
              </span>
            ) : isNonCollegiate ? (
              <span className="inline-block px-3 py-1 rounded-xl text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                ⚠ শর্তসাপেক্ষ (Non-Collegiate)
              </span>
            ) : (
              <span className="inline-block px-3 py-1 rounded-xl text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                ✕ অযোগ্য (Discollegiate)
              </span>
            )}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              অভিভাবকের মোবাইল: {selectedStudent.guardianMobile}
            </div>
          </div>
        </div>

        {/* 4 Big KPI Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-400">মোট ক্লাস সেশন</div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {totalClasses}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">উপস্থিত দিবস</div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
              {presentCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
            <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400">অনুপস্থিত দিবস</div>
            <div className="text-xl font-black text-rose-700 dark:text-rose-400 font-mono mt-0.5">
              {absentCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400">বিলম্ব ও ছুটি</div>
            <div className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono mt-0.5">
              {lateCount + excusedCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
            <div className="text-[11px] font-bold text-indigo-700 dark:text-cyan-400">উপস্থিতির শতকরা হার</div>
            <div className="text-xl font-black text-indigo-700 dark:text-cyan-400 font-mono mt-0.5">
              {attendanceRate}%
            </div>
          </div>
        </div>

        {/* 75% BTEB Benchmark Gauge & Progress */}
        <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-600 dark:text-slate-300">
              কারিগরি শিক্ষা বোর্ড (BTEB) ন্যূনতম হাজিরা বাধ্যবাধকতা: ৭৫.০%
            </span>
            <span
              className={`font-mono text-xs ${
                attendanceRate >= 75 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              বর্তমান: {attendanceRate}%
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                attendanceRate >= 75
                  ? "bg-emerald-500"
                  : attendanceRate >= 60
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, attendanceRate)}%` }}
            ></div>
            {/* 75% target marker line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-900 dark:bg-white z-10"
              style={{ left: "75%" }}
              title="৭৫% ন্যূনতম সীমারেখা"
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>০%</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">৭৫% (যোগ্যতা সীমানা)</span>
            <span>১০০%</span>
          </div>
        </div>

        {/* Warning & Guardian Alert if < 75% */}
        {attendanceRate < 75 && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-amber-900 dark:text-amber-200 no-print">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="font-bold">সতর্কবার্তা: শিক্ষার্থীর উপস্থিতি বোর্ড সীমার নিচে!</div>
                <div className="text-[11px] text-amber-700 dark:text-amber-300">
                  ৭৫% এর কম হওয়ায় পরীক্ষায় অংশগ্রহণের অনুমতি পেতে অতিরিক্ত ক্লাস বা জরিমানার প্রয়োজন হতে পারে।
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSendGuardianSms}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>অভিভাবককে এসএমএস পাঠান</span>
              </button>
              <a
                href={`tel:${selectedStudent.guardianMobile}`}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center gap-1.5 transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>কল করুন</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Chronological Attendance History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 font-bold">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>দৈনিক হাজিরা ইতিহাস ও সেশন লগ ({studentChronologicalEntries.length} সেশন)</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 no-print">
            {(["all", "P", "A", "L", "E"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  statusFilter === st
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                {st === "all" ? "সকল" : st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-bold">
              <tr>
                <th className="p-2.5 w-28">তারিখ</th>
                <th className="p-2.5 w-20">পিরিয়ড</th>
                <th className="p-2.5 w-52">বিষয়</th>
                <th className="p-2.5 w-40">দায়িত্বপ্রাপ্ত শিক্ষক</th>
                <th className="p-2.5 w-24 text-center">স্ট্যাটাস</th>
                <th className="p-2.5">মন্তব্য / নোট</th>
                <th className="p-2.5 w-24 text-center no-print">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredEntries.map((e, idx) => {
                return (
                  <tr key={`${e.date}_${e.periodNo}_${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/70 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {e.date}
                    </td>
                    <td className="p-2.5 font-medium">{e.periodNo}ম পিরিয়ড</td>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                      {e.subjectName}
                    </td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">{e.teacherName}</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg font-black font-mono text-[11px] ${
                          e.status === "P"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : e.status === "A"
                            ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black"
                            : e.status === "L"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-500 dark:text-slate-400 font-medium">
                      {e.remark || "—"}
                    </td>
                    <td className="p-2.5 text-center no-print">
                      <button
                        onClick={() =>
                          onEditEntry(selectedStudent, e.date, e.status, e.recordId, e.remark)
                        }
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1 mx-auto transition-all"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>সংশোধন</span>
                      </button>
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
