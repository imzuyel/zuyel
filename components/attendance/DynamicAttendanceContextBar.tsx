"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Layers,
  Users,
  Clock,
  Sparkles,
  BookOpen,
  DoorOpen,
  GraduationCap,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  FileText,
  UserCheck,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  getApplicableTradesForClass,
  doesClassHaveTrade,
  parseClassNumeric,
  getSubjectsForClass,
} from "@/lib/academicStructure";
import { getSingleSourceSubjects } from "@/lib/globalSubjectMappingHub";
import { AttendanceRecordType } from "@/lib/database";
import { ATTENDANCE_TYPES_CONFIG, correlateRoutineContext } from "@/lib/attendanceEngine";
import { getDayType } from "@/lib/attendanceData";

export interface AttendanceFilterState {
  session: string;
  classId: number;
  section: string;
  tradeId?: number;
  subjectCode: string;
  subjectName: string;
  date: string;
  periodNo: number;
  attendanceType: AttendanceRecordType;
  teacherName?: string;
  teacherId?: number;
  substituteTeacherName?: string;
  roomNo?: string;
  isLab?: boolean;
}

interface DynamicAttendanceContextBarProps {
  filter: AttendanceFilterState;
  onChange: (updated: Partial<AttendanceFilterState>) => void;
  onRefresh?: () => void;
  onOpenTodaySchedule?: () => void;
  onOpenQuizEligibility?: () => void;
  onOpenAbsenceAnalytics?: () => void;
  onOpenExcelHub?: () => void;
}

const PERIODS = [
  { no: 1, label: "১ম পিরিয়ড", time: "০৮:৩০ - ০৯:১৫" },
  { no: 2, label: "২য় পিরিয়ড", time: "০৯:১৫ - ১০:০০" },
  { no: 3, label: "৩য় পিরিয়ড", time: "১০:০০ - ১০:৪৫" },
  { no: 4, label: "৪র্থ পিরিয়ড", time: "১০:৪৫ - ১১:৩০" },
  { no: 5, label: "৫ম পিরিয়ড", time: "১১:৪৫ - ১২:৩০" },
  { no: 6, label: "৬ষ্ঠ পিরিয়ড", time: "১২:৩০ - ০১:১৫" },
  { no: 7, label: "৭ম পিরিয়ড", time: "০২:০০ - ০২:৪৫" },
  { no: 8, label: "৮ম পিরিয়ড", time: "০২:৪৫ - ০৩:৩০" },
];

export default function DynamicAttendanceContextBar({
  filter,
  onChange,
  onRefresh,
  onOpenTodaySchedule,
  onOpenQuizEligibility,
  onOpenAbsenceAnalytics,
  onOpenExcelHub,
}: DynamicAttendanceContextBarProps) {
  const numericClass = parseClassNumeric(filter.classId);
  const tradeApplies = doesClassHaveTrade(filter.classId);
  const applicableTrades = tradeApplies ? getApplicableTradesForClass(filter.classId) : [];
  const globalSubjects = getSingleSourceSubjects({
    classVal: filter.classId,
    tradeVal: filter.tradeId,
    academicYear: filter.session || "2026",
  });
  const subjects =
    globalSubjects.length > 0
      ? globalSubjects.map((s) => ({
          id: typeof s.id === "number" ? s.id : parseInt(String(s.id), 10) || 100,
          code: s.code,
          name: s.name,
          nameBangla: s.nameBangla || s.name,
          applicableClasses: [numericClass],
          tradeId: s.tradeId,
          tradeCode: s.tradeCode,
          isCommon: s.isCommon,
          type: (s.type || (s.isCommon ? "General" : "Trade")) as any,
          marks: s.marks || 100,
        }))
      : getSubjectsForClass(filter.classId, filter.tradeId);
  const dayType = getDayType(filter.date);

  // Check routine auto-match
  const [routineMatch, setRoutineMatch] = useState<any>(null);

  useEffect(() => {
    const match = correlateRoutineContext({
      session: filter.session,
      classId: filter.classId,
      section: filter.section,
      tradeId: filter.tradeId,
      date: filter.date,
      periodNo: filter.periodNo,
    });
    setRoutineMatch(match);
  }, [filter.session, filter.classId, filter.section, filter.tradeId, filter.date, filter.periodNo]);

  const handleApplyRoutineSuggestion = () => {
    if (routineMatch && routineMatch.found) {
      onChange({
        subjectCode: routineMatch.subjectCode || filter.subjectCode,
        subjectName: routineMatch.subjectName || filter.subjectName,
        teacherName: routineMatch.teacherName || filter.teacherName,
        teacherId: routineMatch.teacherId,
        substituteTeacherName: routineMatch.substituteTeacherName,
        roomNo: routineMatch.roomNo || filter.roomNo,
        isLab: routineMatch.isLab,
        attendanceType: routineMatch.suggestedAttendanceType || filter.attendanceType,
      });
    }
  };

  const handleClassChange = (newClassId: number) => {
    const newNumeric = parseClassNumeric(newClassId);
    const hasTrades = doesClassHaveTrade(newClassId);
    let newTradeId: number | undefined = undefined;

    if (hasTrades) {
      const trades = getApplicableTradesForClass(newClassId);
      newTradeId = trades.length > 0 ? trades[0].id : 2;
    }

    const availableSubjects = getSubjectsForClass(newClassId, newTradeId);
    const firstSubject = availableSubjects.length > 0 ? availableSubjects[0] : null;

    onChange({
      classId: newClassId,
      tradeId: newTradeId,
      subjectCode: firstSubject ? firstSubject.code : "GEN-01",
      subjectName: firstSubject ? firstSubject.nameBangla || firstSubject.name : "সাধারণ বিষয়",
    });
  };

  const handleTradeChange = (newTradeId: number) => {
    const availableSubjects = getSubjectsForClass(filter.classId, newTradeId);
    const firstSubject = availableSubjects.length > 0 ? availableSubjects[0] : null;

    onChange({
      tradeId: newTradeId,
      subjectCode: firstSubject ? firstSubject.code : filter.subjectCode,
      subjectName: firstSubject ? firstSubject.nameBangla || firstSubject.name : filter.subjectName,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-4">
      {/* Top Header & Fast Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
              একাডেমিক হাজিরা প্রেক্ষাপট (Academic Context)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              সেশন, শ্রেণি, সেকশন, ট্রেড, তারিখ ও পিরিয়ডের সমন্বিত রুটিন-সচেতন ডিজিটাল রেজিস্টার
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenTodaySchedule && (
            <button
              onClick={onOpenTodaySchedule}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center gap-1.5 transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>আজকের রুটিন ড্যাশবোর্ড</span>
            </button>
          )}

          {onOpenQuizEligibility && (
            <button
              onClick={onOpenQuizEligibility}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 flex items-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>কুইজ যোগ্যতা পরীক্ষা</span>
            </button>
          )}

          {onOpenAbsenceAnalytics && (
            <button
              onClick={onOpenAbsenceAnalytics}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center gap-1.5 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>অনুপস্থিতি সতর্কতা (&lt;৭৫%)</span>
            </button>
          )}

          {onOpenExcelHub && (
            <button
              onClick={onOpenExcelHub}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>এক্সেল হাব</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="রিফ্রেশ করুন"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Filter Controls Flow (Step 1 to Step 8) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3 text-xs">
        {/* 1. Academic Year */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            ১. শিক্ষাবর্ষ (Year)
          </label>
          <select
            value={filter.session}
            onChange={(e) => onChange({ session: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="2026">২০২৬ (চলতি শিক্ষাবর্ষ)</option>
            <option value="2025">২০২৫</option>
            <option value="2024">২০২৪</option>
          </select>
        </div>

        {/* 2. Class Selection */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            ২. শ্রেণি (Class)
          </label>
          <select
            value={filter.classId}
            onChange={(e) => handleClassChange(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {ACADEMIC_CLASSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameBangla}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Section Selection */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            ৩. শাখা (Section)
          </label>
          <select
            value={filter.section}
            onChange={(e) => onChange({ section: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="A">শাখা - ক (Section A)</option>
            <option value="B">শাখা - খ (Section B)</option>
            <option value="all">উভয় শাখা (All Sections)</option>
          </select>
        </div>

        {/* 4. Trade Selection (Strictly hidden for 6-8, visible for 9-12) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            ৪. কারিগরি ট্রেড
          </label>
          {tradeApplies ? (
            <select
              value={filter.tradeId || 0}
              onChange={(e) => handleTradeChange(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value={0}>সকল ট্রেড (কমন পাঠদান)</option>
              {applicableTrades.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nameBangla}
                </option>
              ))}
            </select>
          ) : (
            <div className="px-2.5 py-1.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-center font-normal bg-slate-100/50 dark:bg-slate-800/40">
              প্রাক-ভোকেশনাল (প্রযোজ্য নয়)
            </div>
          )}
        </div>

        {/* 5. Date Selection */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
            <span>৫. তারিখ (Date)</span>
            {dayType.isHoliday && (
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-normal">ছুটি</span>
            )}
          </label>
          <input
            type="date"
            value={filter.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className={`w-full px-2.5 py-1.5 rounded-lg border text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
              dayType.isHoliday
                ? "border-rose-300 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/20"
                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80"
            }`}
          />
        </div>

        {/* 6. Period Selection */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            ৬. পিরিয়ড (Period)
          </label>
          <select
            value={filter.periodNo}
            onChange={(e) => onChange({ periodNo: Number(e.target.value) })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {PERIODS.map((p) => (
              <option key={p.no} value={p.no}>
                {p.label} ({p.time})
              </option>
            ))}
          </select>
        </div>

        {/* 7. Subject Selection */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            ৭. পাঠ্য বিষয় (Subject)
          </label>
          <select
            value={filter.subjectCode}
            onChange={(e) => {
              const matchedSub = subjects.find((s) => s.code === e.target.value);
              onChange({
                subjectCode: e.target.value,
                subjectName: matchedSub ? matchedSub.nameBangla || matchedSub.name : filter.subjectName,
              });
            }}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.code}>
                {s.nameBangla || s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        {/* 8. Attendance Type Selection */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            ৮. হাজিরার ধরণ (Type)
          </label>
          <select
            value={filter.attendanceType}
            onChange={(e) => onChange({ attendanceType: e.target.value as AttendanceRecordType })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {ATTENDANCE_TYPES_CONFIG.map((t) => (
              <option key={t.id} value={t.id}>
                {t.labelBangla}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Routine Correlated Intelligence Banner */}
      {routineMatch && routineMatch.found ? (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <span>রুটিন অটো-ম্যাচ: {routineMatch.dayNameBangla} - {filter.periodNo}ম পিরিয়ড</span>
                {routineMatch.isLab && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200">
                    ব্যবহারিক ল্যাব ({routineMatch.labName || "Lab"})
                  </span>
                )}
              </div>
              <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                বিষয়: <span className="font-medium text-slate-800 dark:text-slate-200">{routineMatch.subjectName} ({routineMatch.subjectCode})</span>
                {" • "}
                শিক্ষক: <span className="font-medium text-slate-800 dark:text-slate-200">{routineMatch.teacherName}</span>
                {routineMatch.substituteTeacherName && (
                  <span className="text-amber-700 dark:text-amber-300 font-medium"> (বদলি: {routineMatch.substituteTeacherName})</span>
                )}
                {" • "}
                কক্ষ: <span className="font-medium text-slate-800 dark:text-slate-200">{routineMatch.roomNo || "Room 201"}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleApplyRoutineSuggestion}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>অটো-ফিল প্রয়োগ করুন</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>
            তথ্য: {filter.date} তারিখে {filter.periodNo}ম পিরিয়ডে কোনো প্রকাশিত রুটিন সূচি নির্ধারিত নেই (অফ-রুটিন / সাধারণ হাজিরা মোড)।
          </span>
          {dayType.isHoliday && (
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              ছুটির দিন: {dayType.holidayTitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
