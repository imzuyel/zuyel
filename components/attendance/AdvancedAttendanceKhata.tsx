"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  FileSpreadsheet,
  Printer,
  CalendarRange,
  GraduationCap,
  Sparkles,
  Smartphone,
  BookOpen,
  AlertTriangle,
  Award,
  Layers,
  BarChart3,
  UserCheck,
} from "lucide-react";
import AcademicFilterBar, {
  AcademicFilterState,
  ACADEMIC_CLASSES,
  ACADEMIC_TRADES,
} from "@/components/common/AcademicFilterBar";
import {
  AttendanceRecord,
  AttendanceEntry,
  AttendanceStatus,
  Student,
  ExamMark,
  AcademicHoliday,
} from "@/lib/database";
import { ACADEMIC_HOLIDAYS_2026, getDayType } from "@/lib/attendanceData";
import { doesClassHaveTrade, parseClassNumeric } from "@/lib/academicStructure";
import { toBanglaDateString } from "@/lib/utils";
import WeeklyAttendanceView from "./WeeklyAttendanceView";
import MonthlyAttendanceRegisterView, { MONTH_NAMES_BN } from "./MonthlyAttendanceRegisterView";
import AnnualKhataView from "./AnnualKhataView";
import BtebAnnualLongTermRegisterView from "@/components/academic/BtebAnnualLongTermRegisterView";
import MobileAttendanceView from "./MobileAttendanceView";
import AttendanceReportView from "@/components/reports/AttendanceReportView";
import TeacherStaffAttendanceWorkspace from "@/components/faculty/TeacherStaffAttendanceWorkspace";
import AttendanceCorrectionModal from "./AttendanceCorrectionModal";
import ExcelImportExportModal from "./ExcelImportExportModal";
import { useGlobalSubjects } from "@/lib/useGlobalSubjects";
import Link from "next/link";

export type StreamlinedAttendanceTab = "daily" | "weekly" | "monthly" | "yearly" | "report" | "staff";

interface AdvancedAttendanceKhataProps {
  initialTab?: StreamlinedAttendanceTab;
}

export default function AdvancedAttendanceKhata({ initialTab = "daily" }: AdvancedAttendanceKhataProps) {
  // 1. Streamlined Navigation Tabs: ONLY Daily, Weekly, Monthly, Yearly
  const [activeTab, setActiveTab] = useState<StreamlinedAttendanceTab>(initialTab);
  const [yearlyViewMode, setYearlyViewMode] = useState<"matrix" | "comprehensive">("comprehensive");

  // 2. Academic Filter State
  const [filter, setFilter] = useState<AcademicFilterState>({
    department: "Computer & IT",
    classId: "4", // Class 9
    tradeId: "2", // IT-IOT
    tradeCode: "IT-IOT",
    section: "A",
    session: "2026",
  });

  const [selectedMonth, setSelectedMonth] = useState<string>("09"); // September 2026 default
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>("all");
  const [excelHubOpen, setExcelHubOpen] = useState<boolean>(false);

  // Derived metadata for labels
  const classNumeric = parseClassNumeric(filter.classId);
  const hasTrade = doesClassHaveTrade(classNumeric);
  const activeClassObj = ACADEMIC_CLASSES.find((c) => String(c.id) === String(filter.classId));
  const activeTradeObj = ACADEMIC_TRADES.find((t) => String(t.id) === String(filter.tradeId));
  const classNameBangla = activeClassObj?.nameBangla || `শ্রেণি ${classNumeric}`;
  const tradeCode = hasTrade ? (activeTradeObj?.code || filter.tradeCode || "ট্রেড") : "প্রাক-ভোকেশনাল (ট্রেড প্রযোজ্য নয়)";
  const tradeNameBangla = hasTrade ? (activeTradeObj?.nameBangla || "কারিগরি ট্রেড") : "প্রাক-ভোকেশনাল";

  // Global Subject Mapping Engine Integration
  const {
    subjects: availableSubjects,
    isLoading: subjectsLoading,
    commonSubjects,
    tradeSubjects,
  } = useGlobalSubjects({
    classVal: filter.classId,
    tradeVal: hasTrade && filter.tradeId !== "all" ? filter.tradeId : undefined,
    academicYear: filter.session,
  });

  // Reset or validate selected subject when subjects change
  useEffect(() => {
    if (selectedSubjectCode !== "all") {
      const exists = availableSubjects.some((s) => s.code.toLowerCase() === selectedSubjectCode.toLowerCase());
      if (!exists) {
        setSelectedSubjectCode("all");
      }
    }
  }, [availableSubjects, selectedSubjectCode]);

  // 3. Quick Attendance Correction Modal state for interactive grid cells
  const [correctionModal, setCorrectionModal] = useState<{
    isOpen: boolean;
    student?: Student;
    date: string;
    periodNo: number;
    classId: number;
    tradeId?: number;
    section: string;
    session: string;
    currentStatus: AttendanceStatus | "—";
    currentRemark?: string;
    recordId?: string;
  }>({
    isOpen: false,
    date: new Date().toISOString().split("T")[0],
    periodNo: 1,
    classId: 4,
    section: "A",
    session: "2026",
    currentStatus: "P",
  });

  // 4. Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<ExamMark[]>([]);
  const [holidays, setHolidays] = useState<AcademicHoliday[]>(ACADEMIC_HOLIDAYS_2026);
  const [loading, setLoading] = useState<boolean>(true);
  const [banner, setBanner] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  // Fetch students, attendance records, and exam marks
  const fetchStudentsAndMarks = () => {
    setLoading(true);

    let studentUrl = `/api/students?classId=${filter.classId}&status=all`;
    if (hasTrade && filter.tradeId && filter.tradeId !== "all") {
      studentUrl += `&tradeId=${filter.tradeId}`;
    }
    if (filter.section && filter.section !== "all") {
      studentUrl += `&section=${filter.section}`;
    }

    let attUrl = `/api/attendance?session=${filter.session}&classId=${filter.classId}&section=${filter.section}${
      hasTrade && filter.tradeId && filter.tradeId !== "all" ? `&tradeId=${filter.tradeId}` : ""
    }`;
    if (selectedSubjectCode !== "all") {
      attUrl += `&subjectCode=${selectedSubjectCode}`;
    }

    Promise.all([
      fetch(studentUrl).then((r) => r.json()),
      fetch(attUrl).then((r) => r.json()),
      fetch(
        `/api/marks?classId=${filter.classId}&session=${filter.session}${
          hasTrade && filter.tradeId && filter.tradeId !== "all" ? `&tradeId=${filter.tradeId}` : ""
        }`
      ).then((r) => r.json()),
    ])
      .then(([stuRes, attRes, markRes]) => {
        if (stuRes.success) setStudents(stuRes.data || []);
        if (attRes.success) setAttendanceRecords(attRes.records || []);
        if (markRes.success) setMarks(markRes.marks || []);
      })
      .catch((err) => console.error("Error loading attendance data:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudentsAndMarks();
  }, [filter.classId, filter.tradeId, filter.section, filter.session, selectedSubjectCode]);

  // Cell click handler for interactive grid cells in Weekly & Monthly views
  const handleCellClick = (
    student: Student,
    date: string,
    currentStatus: AttendanceStatus | "—",
    recordId?: string
  ) => {
    setCorrectionModal({
      isOpen: true,
      student,
      date,
      periodNo: 1,
      classId: Number(filter.classId),
      tradeId: hasTrade && filter.tradeId && filter.tradeId !== "all" ? Number(filter.tradeId) : undefined,
      section: filter.section,
      session: filter.session,
      currentStatus,
      recordId,
    });
  };

  return (
    <div className="space-y-5 text-slate-900 dark:text-slate-100 font-sans">
      {/* 1. Header Banner & Quick Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-cyan-400">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              স্মার্ট হাজিরা ও বিটিইবি রেজিস্টার ব্যবস্থাপনা
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              BTEB Official 2026
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ • টাচ-ফ্রেন্ডলি কার্ড ভিউ ও প্রথাগত রেজিস্টার খাতা
          </p>
        </div>

        {/* Global Hub Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setExcelHubOpen(true)}
            className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>এক্সেল হাব ও রিপোর্ট</span>
          </button>

          <Link
            href="/print"
            className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 transition-all"
            title="BTEB অফিসিয়াল প্রিন্ট ও পিডিএফ এক্সপোর্ট হাব"
          >
            <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>ইউনিভার্সাল প্রিন্ট হাব</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>কুইক প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* 2. Streamlined Navigation Switcher (Consolidated All Attendance Views) */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2 no-print">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 w-full">
          {/* Tab 1: Daily (Universal Mobile Card Attendance View) */}
          <button
            id="tab_daily_card"
            type="button"
            onClick={() => setActiveTab("daily")}
            className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "daily"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-300 pointer-events-none" />
            <span className="pointer-events-none truncate">১. দৈনিক কার্ড</span>
          </button>

          {/* Tab 2: Weekly (Traditional Register Grid) */}
          <button
            id="tab_weekly_grid"
            type="button"
            onClick={() => setActiveTab("weekly")}
            className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "weekly"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5 text-emerald-300 pointer-events-none" />
            <span className="pointer-events-none truncate">২. সাপ্তাহিক খাতা</span>
          </button>

          {/* Tab 3: Monthly (Traditional Register Grid) */}
          <button
            id="tab_monthly_grid"
            type="button"
            onClick={() => setActiveTab("monthly")}
            className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "monthly"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-300 pointer-events-none" />
            <span className="pointer-events-none truncate">৩. মাসিক খাতা</span>
          </button>

          {/* Tab 4: Yearly (Traditional BTEB Long-Term Khata) */}
          <button
            id="tab_yearly_khata"
            type="button"
            onClick={() => setActiveTab("yearly")}
            className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "yearly"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-purple-300 pointer-events-none" />
            <span className="pointer-events-none truncate">৪. BTEB বার্ষিক</span>
            <span className="text-[9px] px-1 py-0.2 rounded-full font-black bg-purple-400/20 text-purple-200 border border-purple-300/40 uppercase hidden xl:inline pointer-events-none">
              BTEB
            </span>
          </button>

          {/* Tab 5: Report & Analytics */}
          <button
            id="tab_attendance_report"
            type="button"
            onClick={() => setActiveTab("report")}
            className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "report"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-300 pointer-events-none" />
            <span className="pointer-events-none truncate">৫. রিপোর্ট ও পরিসংখ্যান</span>
          </button>

          {/* Tab 6: Teacher/Staff Attendance */}
          <button
            id="tab_staff_attendance"
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "staff"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-rose-300 pointer-events-none" />
            <span className="pointer-events-none truncate">৬. শিক্ষক ও স্টাফ</span>
          </button>
        </div>
      </div>

      {/* 3. Feedback Banner */}
      {banner && (
        <div
          className={`p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold no-print animate-fade-in ${
            banner.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800"
              : banner.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800"
              : "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800"
          }`}
        >
          {banner.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : banner.type === "error" ? (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          )}
          <span>{banner.msg}</span>
        </div>
      )}

      {/* 4. Filter Bar (Used for Weekly, Monthly, and Yearly views) */}
      {(activeTab === "weekly" || activeTab === "monthly" || activeTab === "yearly") && (
        <div className="no-print space-y-3">
          <AcademicFilterBar filter={filter} onChange={setFilter} showDepartment={true} />

          {/* Global Subject Selector for Register Grid Views */}
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400">
                <BookOpen className="w-4 h-4" />
              </span>
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white">বিষয় ফিল্টার (Subject Register): </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {selectedSubjectCode === "all"
                    ? "সকল বিষয় (সামগ্রিক দৈনিক হাজিরা)"
                    : availableSubjects.find((s) => s.code === selectedSubjectCode)?.nameBangla ||
                      selectedSubjectCode}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                id="khata_subject_filter_select"
                value={selectedSubjectCode}
                onChange={(e) => setSelectedSubjectCode(e.target.value)}
                className="w-full sm:w-64 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-cyan-500"
              >
                <option value="all">সকল বিষয় (All Subjects / সামগ্রিক হাজিরা)</option>
                {commonSubjects.length > 0 && (
                  <optgroup label="সাধারণ আবশ্যিক বিষয় (Common / Core)">
                    {commonSubjects.map((s) => (
                      <option key={s.code} value={s.code}>
                        [{s.code}] {s.nameBangla || s.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {tradeSubjects.length > 0 && (
                  <optgroup label="কারিগরি স্পেশালাইজড বিষয় (Trade Core)">
                    {tradeSubjects.map((s) => (
                      <option key={s.code} value={s.code}>
                        [{s.code}] {s.nameBangla || s.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              <Link
                href="/academic/settings"
                className="hidden lg:inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[11px] font-bold shrink-0 transition"
                title="গ্লোবাল সেটিংস ও বিষয় ম্যাপিং হাব দেখুন"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                <span>ম্যাপিং হাব</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* VIEW 1: UNIVERSAL MOBILE CARD ATTENDANCE VIEW (DAILY) */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === "daily" && (
        <div id="view_daily_card" className="space-y-4">
          <MobileAttendanceView />
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* VIEW 2: STREAMLINED WEEKLY BTEB REGISTER GRID */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === "weekly" && (
        <div id="view_weekly_grid" className="space-y-4">
          <WeeklyAttendanceView
            students={students}
            attendanceRecords={attendanceRecords}
            holidays={holidays}
            classId={filter.classId}
            classNameBangla={classNameBangla}
            tradeCode={tradeCode}
            section={filter.section}
            session={filter.session}
            onCellClick={handleCellClick}
          />
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* VIEW 3: STREAMLINED MONTHLY BTEB REGISTER GRID */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === "monthly" && (
        <div id="view_monthly_grid" className="space-y-4">
          <MonthlyAttendanceRegisterView
            students={students}
            attendanceRecords={attendanceRecords}
            holidays={holidays}
            classId={filter.classId}
            classNameBangla={classNameBangla}
            tradeCode={tradeCode}
            tradeNameBangla={tradeNameBangla}
            section={filter.section}
            session={filter.session}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onCellClick={handleCellClick}
          />
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* VIEW 4: STREAMLINED YEARLY BTEB ANNUAL KHATA */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === "yearly" && (
        <div id="view_yearly_khata" className="space-y-4">
          {/* Sub-view switcher for BTEB Long-term Khata */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
                <BookOpen className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  BTEB বার্ষিক দীর্ঘমেয়াদী খাতা ও ধারাবাহিক মূল্যায়ন রেজিস্টার
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  কারিগরি শিক্ষাক্রম অনুযায়ী তাত্ত্বিক, ব্যবহারিক সেশনাল ও বার্ষিক উপস্থিতির পূর্ণ বিবরণী
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-1">
                <button
                  onClick={() => setYearlyViewMode("comprehensive")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    yearlyViewMode === "comprehensive"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>১. সার্বিক বিটিইবি লেজার (সেশনাল ও উপস্থিতি)</span>
                </button>

                <button
                  onClick={() => setYearlyViewMode("matrix")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    yearlyViewMode === "matrix"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>২. ১২-মাস হাজিরা মেট্রিক্স খাতা</span>
                </button>
              </div>

              <Link
                href="/academic/bteb-annual-ledger"
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition flex items-center gap-1.5"
                title="পূর্ণ স্ক্রিন মোডে ওপেন করুন"
              >
                <span>ফুল পেজ</span>
              </Link>
            </div>
          </div>

          {yearlyViewMode === "comprehensive" ? (
            <BtebAnnualLongTermRegisterView
              initialClassId={filter.classId}
              initialTradeId={filter.tradeId}
              initialYear={filter.session}
            />
          ) : (
            <AnnualKhataView
              students={students}
              attendanceRecords={attendanceRecords}
              marks={marks}
              holidays={holidays}
              classNameBangla={classNameBangla}
              tradeCode={tradeCode}
              section={filter.section}
              session={filter.session}
              onSwitchToMonth={(monthId) => {
                setSelectedMonth(monthId);
                setActiveTab("monthly");
              }}
              onCellClick={(student, monthId) => {
                setSelectedMonth(monthId);
                setActiveTab("monthly");
              }}
            />
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* VIEW 5: ATTENDANCE REPORT & ANALYTICS */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === "report" && (
        <div id="view_attendance_report" className="space-y-4">
          <AttendanceReportView />
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* VIEW 6: TEACHER & STAFF ATTENDANCE WORKSPACE */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === "staff" && (
        <div id="view_staff_attendance" className="space-y-4">
          <TeacherStaffAttendanceWorkspace />
        </div>
      )}

      {/* Quick Attendance Correction Modal for Interactive Grid Cells */}
      {correctionModal.isOpen && correctionModal.student && (
        <AttendanceCorrectionModal
          isOpen={correctionModal.isOpen}
          onClose={() => setCorrectionModal((prev) => ({ ...prev, isOpen: false }))}
          student={correctionModal.student}
          date={correctionModal.date}
          periodNo={correctionModal.periodNo}
          classId={correctionModal.classId}
          tradeId={correctionModal.tradeId}
          section={correctionModal.section}
          session={correctionModal.session}
          currentStatus={correctionModal.currentStatus}
          currentRemark={correctionModal.currentRemark}
          recordId={correctionModal.recordId}
          onSuccess={(updatedRecord) => {
            setBanner({
              type: "success",
              msg: `${correctionModal.student?.nameBangla || correctionModal.student?.name}-এর হাজিরা সফলভাবে আপডেট ও সংরক্ষিত হয়েছে।`,
            });
            fetchStudentsAndMarks();
          }}
        />
      )}

      {/* Excel Hub Modal */}
      {excelHubOpen && (
        <ExcelImportExportModal
          isOpen={excelHubOpen}
          onClose={() => setExcelHubOpen(false)}
          context={filter as any}
          onImportComplete={() => {
            fetchStudentsAndMarks();
            setBanner({ type: "success", msg: "এক্সেল হাজিরা সফলভাবে ইমপোর্ট সম্পন্ন হয়েছে।" });
          }}
        />
      )}
    </div>
  );
}
