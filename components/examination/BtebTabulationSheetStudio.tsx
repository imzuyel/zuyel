"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Award,
  Calendar,
  Layers,
  Search,
  Filter,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Sparkles,
  Calculator,
  X,
  Save,
  RotateCcw,
  GraduationCap,
  TrendingUp,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  User,
} from "lucide-react";
import { ACADEMIC_CLASSES, ALL_TRADES } from "@/lib/academicStructure";
import { toBengaliNumerals } from "@/lib/utils";
import {
  calculateSubjectGrade,
  calculateSemesterResult,
  SubjectConfig,
  SubjectGradeResult,
  SemesterResult,
  LetterGrade,
} from "@/lib/btebGrader";

export interface TabulationStudent {
  studentId: string;
  admissionNo: string;
  roll: number;
  name: string;
  nameBangla: string;
  tradeName?: string;
  tradeCode?: string;
  shift: string;
  section: string;
  results: SubjectGradeResult[];
  semesterSummary: SemesterResult;
}

export interface TabulationSubjectHeader {
  code: string;
  name: string;
  nameBangla: string;
  fullMarks: number;
  tcFullMarks: number;
  pcFullMarks: number;
  tfFullMarks: number;
  pfFullMarks: number;
}

export default function BtebTabulationSheetStudio() {
  // Query Filters
  const [selectedClassId, setSelectedClassId] = useState<number>(4); // Class 9
  const [selectedTradeId, setSelectedTradeId] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedShift, setSelectedShift] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<string>("2026");
  const [selectedExamName, setSelectedExamName] = useState<string>("১ম পর্ব সমাপনী পরীক্ষা ২০২৬");

  // Search Filter
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [subjects, setSubjects] = useState<TabulationSubjectHeader[]>([]);
  const [students, setStudents] = useState<TabulationStudent[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // Live BTEB Grading Calculator Modal State
  const [calculatorStudent, setCalculatorStudent] = useState<TabulationStudent | null>(null);
  const [editedMarks, setEditedMarks] = useState<{
    [subjectCode: string]: { tc: number; tf: number; pc: number; pf: number };
  }>({});
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);

  // Printable container ref
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Fetch Tabulation Data from Server
  const loadTabulationData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        classId: String(selectedClassId),
        tradeId: selectedTradeId,
        section: selectedSection,
        shift: selectedShift,
        session: selectedSession,
        examName: selectedExamName,
      });

      const res = await fetch(`/api/examination/tabulation?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setSubjects(json.subjects || []);
        setStudents(json.students || []);
      } else {
        throw new Error(json.error || "ট্যাবুলেশন শিট লোড করতে ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      console.error("Tabulation load error:", err);
      showToast(err.message || "ডাটা লোড ত্রুটি", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabulationData();
  }, [selectedClassId, selectedTradeId, selectedSection, selectedShift, selectedSession, selectedExamName]);

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const rollStr = String(s.roll);
      const name = (s.name || "").toLowerCase();
      const nameBn = (s.nameBangla || "").toLowerCase();
      const stId = (s.studentId || "").toLowerCase();
      return rollStr.includes(q) || name.includes(q) || nameBn.includes(q) || stId.includes(q);
    });
  }, [students, searchQuery]);

  // Overall Statistics
  const statistics = useMemo(() => {
    const total = students.length;
    if (total === 0) return { total: 0, passed: 0, referred: 0, passRate: 0, gpa5Count: 0, avgGpa: "0.00" };

    const passed = students.filter((s) => s.semesterSummary.status === "Passed").length;
    const referred = total - passed;
    const passRate = Math.round((passed / total) * 100);
    const gpa5Count = students.filter((s) => s.semesterSummary.gpa >= 5.0).length;
    const totalGpa = students.reduce((acc, s) => acc + (s.semesterSummary.gpa || 0), 0);
    const avgGpa = (totalGpa / total).toFixed(2);

    return { total, passed, referred, passRate, gpa5Count, avgGpa };
  }, [students]);

  // Open Live Grading Calculator for a student
  const handleOpenCalculator = (student: TabulationStudent) => {
    setCalculatorStudent(student);

    // Initialize marks map from student's current results
    const initialMarks: { [code: string]: { tc: number; tf: number; pc: number; pf: number } } = {};
    student.results.forEach((res) => {
      initialMarks[res.code] = {
        tc: res.tc.obtained,
        tf: res.tf.obtained,
        pc: res.pc?.obtained ?? 0,
        pf: res.pf?.obtained ?? 0,
      };
    });

    setEditedMarks(initialMarks);
    setIsCalculatorOpen(true);
  };

  // Live recalculated results inside Calculator Modal
  const liveCalculatedSemester = useMemo(() => {
    if (!calculatorStudent || !subjects.length) return null;

    const recalculatedSubjectResults: SubjectGradeResult[] = subjects.map((sub) => {
      const marks = editedMarks[sub.code] || { tc: 0, tf: 0, pc: 0, pf: 0 };
      const config: SubjectConfig = {
        code: sub.code,
        name: sub.name,
        nameBangla: sub.nameBangla,
        fullMarks: sub.fullMarks,
        tcFullMarks: sub.tcFullMarks,
        tfFullMarks: sub.tfFullMarks,
        pcFullMarks: sub.pcFullMarks,
        pfFullMarks: sub.pfFullMarks,
        passPercentage: 40,
      };

      return calculateSubjectGrade({
        subject: config,
        theoryContinuous: { total: Number(marks.tc) || 0 },
        theoryFinal: Number(marks.tf) || 0,
        practicalContinuous: sub.pcFullMarks > 0 ? { total: Number(marks.pc) || 0 } : undefined,
        practicalFinal: sub.pfFullMarks > 0 ? Number(marks.pf) || 0 : undefined,
      });
    });

    const summary = calculateSemesterResult(recalculatedSubjectResults);
    return {
      results: recalculatedSubjectResults,
      summary,
    };
  }, [calculatorStudent, subjects, editedMarks]);

  // Save recalculated marks into active state
  const handleSaveRecalculatedMarks = () => {
    if (!calculatorStudent || !liveCalculatedSemester) return;

    setStudents((prev) =>
      prev.map((st) =>
        st.studentId === calculatorStudent.studentId
          ? {
              ...st,
              results: liveCalculatedSemester.results,
              semesterSummary: liveCalculatedSemester.summary,
            }
          : st
      )
    );

    showToast(`রোল #${calculatorStudent.roll} এর সংশোধিত নম্বর ও গ্রেড সফলভাবে সেভ করা হয়েছে।`, "success");
    setIsCalculatorOpen(false);
    setCalculatorStudent(null);
  };

  // Export Tabulation Sheet as CSV
  const handleExportCSV = () => {
    if (!students.length) return;

    // Header row
    const headers = [
      "Roll",
      "Student ID",
      "Student Name",
      "Class",
      "Trade",
      "Section",
      "Shift",
      ...subjects.flatMap((s) => [
        `${s.name} (${s.code}) - TC`,
        `${s.name} (${s.code}) - TF`,
        ...(s.pcFullMarks > 0 ? [`${s.name} - PC`] : []),
        ...(s.pfFullMarks > 0 ? [`${s.name} - PF`] : []),
        `${s.name} - Total`,
        `${s.name} - GP`,
        `${s.name} - Grade`,
      ]),
      "Total Obtained",
      "GPA",
      "Letter Grade",
      "Result Status",
      "Failed Subjects",
    ];

    const rows = students.map((st) => {
      const subjectValues = subjects.flatMap((s) => {
        const res = st.results.find((r) => r.code === s.code);
        if (!res) return ["0", "0", ...(s.pcFullMarks > 0 ? ["0"] : []), ...(s.pfFullMarks > 0 ? ["0"] : []), "0", "0.0", "F"];
        return [
          String(res.tc.obtained),
          String(res.tf.obtained),
          ...(s.pcFullMarks > 0 ? [String(res.pc?.obtained ?? 0)] : []),
          ...(s.pfFullMarks > 0 ? [String(res.pf?.obtained ?? 0)] : []),
          String(res.totalObtained),
          res.gradePoint.toFixed(2),
          res.grade,
        ];
      });

      return [
        st.roll,
        st.studentId,
        `"${st.nameBangla || st.name}"`,
        `"${ACADEMIC_CLASSES.find((c) => c.id === selectedClassId)?.name || ""}"`,
        `"${st.tradeName || "General"}"`,
        st.section,
        st.shift,
        ...subjectValues,
        st.results.reduce((acc, r) => acc + r.totalObtained, 0),
        st.semesterSummary.formattedGpa,
        st.semesterSummary.letterGrade,
        st.semesterSummary.status,
        `"${st.semesterSummary.failedSubjects.map((f) => f.code).join(", ")}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PTSC_Tabulation_${selectedSession}_Class_${selectedClassId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("ট্যাবুলেশন শিট CSV ফাইলে এক্সপোর্ট সম্পন্ন হয়েছে।", "success");
  };

  // Native Print
  const handlePrint = () => {
    window.print();
  };

  // Grade badge styling helper
  const getGradeBadge = (grade: LetterGrade) => {
    switch (grade) {
      case "A+":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
      case "A":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800";
      case "A-":
        return "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800";
      case "B+":
      case "B":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800";
      case "C+":
      case "C":
      case "D":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800";
      case "F":
      default:
        return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP HERO & CONTROL BAR */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  বিটিইবি ট্যাবুলেশন শিট ও গ্রেডিং ক্যালকুলেটর
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  BTEB Grading v2.6
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                বাংলাদেশ কারিগরি শিক্ষা বোর্ড মূল্যায়ন নির্দেশিকা অনুযায়ী ধারাবাহিক ও সমাপনী মূল্যায়নের অটো-ট্যাবুলেশন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={loadTabulationData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>রিফ্রেশ</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-500" />
              <span>CSV এক্সপোর্ট</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ট্যাবুলেশন শিট প্রিন্ট</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* Class Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>শ্রেণি নির্বাচন</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              {ACADEMIC_CLASSES.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nameBangla} ({cls.name})
                </option>
              ))}
            </select>
          </div>

          {/* Trade Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-500" />
              <span>ট্রেড / বিভাগ</span>
            </label>
            <select
              value={selectedTradeId}
              onChange={(e) => setSelectedTradeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">সকল ট্রেড (All Trades)</option>
              {ALL_TRADES.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.nameBangla} ({tr.code})
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-purple-500" />
              <span>শাখা (Section)</span>
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">সকল শাখা (All)</option>
              <option value="A">শাখা A</option>
              <option value="B">শাখা B</option>
            </select>
          </div>

          {/* Exam Name Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span>পরীক্ষার নাম</span>
            </label>
            <select
              value={selectedExamName}
              onChange={(e) => setSelectedExamName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="১ম পর্ব সমাপনী পরীক্ষা ২০২৬">১ম পর্ব সমাপনী পরীক্ষা ২০২৬</option>
              <option value="২য় পর্ব সমাপনী পরীক্ষা ২০২৬">২য় পর্ব সমাপনী পরীক্ষা ২০২৬</option>
              <option value="প্রাক-নির্বাচনী পরীক্ষা ২০২৬">প্রাক-নির্বাচনী পরীক্ষা ২০২৬</option>
              <option value="নির্বাচনী পরীক্ষা (Test Exam) ২০২৬">নির্বাচনী পরীক্ষা (Test Exam) ২০২৬</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-500" />
              <span>রোল বা নাম খুঁজুন</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="রোল, আইডি বা নাম..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : notification.type === "error"
                ? "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                : "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : notification.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. STATISTICAL METRICS SUMMARY BAR */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">মোট শিক্ষার্থী</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {toBengaliNumerals(statistics.total)} জন
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            উত্তীর্ণ (Passed)
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {toBengaliNumerals(statistics.passed)} জন
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">রেফার্ড (Referred)</div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {toBengaliNumerals(statistics.referred)} জন
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">পাসের হার (Pass Rate)</div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {toBengaliNumerals(statistics.passRate)}%
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">জিপিএ ৫.০০ (A+)</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {toBengaliNumerals(statistics.gpa5Count)} জন
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider">গড় জিপিএ (Average GPA)</div>
          <div className="text-xl font-black text-cyan-600 dark:text-cyan-400 mt-1 font-mono">
            {toBengaliNumerals(statistics.avgGpa)}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TABULATION SHEET TABLE (PRINTABLE / EXPORTABLE) */}
      {/* ========================================================================= */}
      <div ref={printAreaRef} className="space-y-4">
        {/* Printable Official Letterhead */}
        <div className="hidden print:block text-center space-y-1 pb-4 border-b-2 border-slate-900">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ</h2>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">কারিগরি শিক্ষা অধিদপ্তর, বাংলাদেশ কারিগরি শিক্ষা বোর্ড, ঢাকা</p>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 pt-1">
            অফিশিয়াল বিটিইবি ট্যাবুলেশন শিট • {selectedExamName} ({selectedSession})
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            শ্রেণি: {ACADEMIC_CLASSES.find((c) => c.id === selectedClassId)?.nameBangla} • ট্রেড:{" "}
            {selectedTradeId === "all" ? "সকল ট্রেড" : ALL_TRADES.find((t) => t.id === Number(selectedTradeId))?.nameBangla}
          </div>
        </div>

        {/* Tabulation Table Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs min-w-[1250px]">
              <thead>
                {/* Row 1: Category Super-Headers */}
                <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <th className="py-3 px-3 font-black text-center w-14 border-r border-slate-200 dark:border-slate-700/60 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">
                    রোল
                  </th>
                  <th className="py-3 px-3 font-black w-48 border-r border-slate-200 dark:border-slate-700/60 sticky left-14 bg-slate-100 dark:bg-slate-800 z-10">
                    শিক্ষার্থীর নাম ও আইডি
                  </th>
                  {subjects.map((sub) => (
                    <th
                      key={sub.code}
                      colSpan={sub.pcFullMarks > 0 ? 6 : 4}
                      className="py-2.5 px-2 font-black text-center border-r border-slate-200 dark:border-slate-700/60"
                    >
                      <div className="text-slate-900 dark:text-white truncate">{sub.nameBangla || sub.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">
                        কোড: {sub.code} • পূর্ণমান: {sub.fullMarks}
                      </div>
                    </th>
                  ))}
                  <th colSpan={4} className="py-2.5 px-3 font-black text-center bg-indigo-50/50 dark:bg-indigo-950/20">
                    সেমিস্টার সারসংক্ষেপ (Summary)
                  </th>
                  <th className="py-3 px-2 font-black text-center w-14 print:hidden">অ্যাকশন</th>
                </tr>

                {/* Row 2: Sub-Component Headers (TC, TF, PC, PF, Total, Grade) */}
                <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[10.5px] font-bold text-slate-600 dark:text-slate-400 text-center">
                  <th className="py-2 px-1 border-r border-slate-200 dark:border-slate-700/60 sticky left-0 bg-slate-50 dark:bg-slate-850 z-10">
                    Roll
                  </th>
                  <th className="py-2 px-2 border-r border-slate-200 dark:border-slate-700/60 sticky left-14 bg-slate-50 dark:bg-slate-850 z-10 text-left">
                    Name / ID
                  </th>
                  {subjects.map((sub) => (
                    <React.Fragment key={sub.code}>
                      <th className="py-2 px-1.5 border-r border-slate-200 dark:border-slate-700/40 text-slate-500 dark:text-slate-400">TC</th>
                      <th className="py-2 px-1.5 border-r border-slate-200 dark:border-slate-700/40 text-slate-500 dark:text-slate-400">TF</th>
                      {sub.pcFullMarks > 0 && (
                        <th className="py-2 px-1.5 border-r border-slate-200 dark:border-slate-700/40 text-indigo-500">PC</th>
                      )}
                      {sub.pfFullMarks > 0 && (
                        <th className="py-2 px-1.5 border-r border-slate-200 dark:border-slate-700/40 text-indigo-500">PF</th>
                      )}
                      <th className="py-2 px-1.5 border-r border-slate-200 dark:border-slate-700/40 font-bold text-slate-900 dark:text-white">
                        মোট
                      </th>
                      <th className="py-2 px-1.5 border-r border-slate-200 dark:border-slate-700/60 font-black text-cyan-600 dark:text-cyan-400">
                        LG
                      </th>
                    </React.Fragment>
                  ))}
                  <th className="py-2 px-2 border-r border-slate-200 dark:border-slate-700/60 bg-indigo-50/30 dark:bg-indigo-950/10">
                    মোট নম্বর
                  </th>
                  <th className="py-2 px-2 border-r border-slate-200 dark:border-slate-700/60 bg-indigo-50/30 dark:bg-indigo-950/10">
                    GPA
                  </th>
                  <th className="py-2 px-2 border-r border-slate-200 dark:border-slate-700/60 bg-indigo-50/30 dark:bg-indigo-950/10">
                    গ্রেড
                  </th>
                  <th className="py-2 px-2 border-r border-slate-200 dark:border-slate-700/60 bg-indigo-50/30 dark:bg-indigo-950/10">
                    ফলাফল
                  </th>
                  <th className="py-2 px-1 print:hidden">এডিট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredStudents.map((st) => {
                  const isPassed = st.semesterSummary.status === "Passed";
                  const totalObtainedMarks = st.results.reduce((acc, r) => acc + r.totalObtained, 0);

                  return (
                    <tr
                      key={st.studentId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60/70 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* Roll Column (Sticky) */}
                      <td className="py-3 px-2 font-black text-center text-slate-900 dark:text-white bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:hover:bg-slate-800/60/90 dark:group-hover:bg-slate-800/80 sticky left-0 z-10 border-r border-slate-200 dark:border-slate-800 font-mono">
                        {toBengaliNumerals(st.roll)}
                      </td>

                      {/* Name Column (Sticky) */}
                      <td className="py-3 px-3 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:hover:bg-slate-800/60/90 dark:group-hover:bg-slate-800/80 sticky left-14 z-10 border-r border-slate-200 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {st.nameBangla || st.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {st.studentId} • শাখা {st.section}
                        </div>
                      </td>

                      {/* Subject Marks Breakdown Cells */}
                      {subjects.map((sub) => {
                        const res = st.results.find((r) => r.code === sub.code);
                        if (!res) {
                          return (
                            <React.Fragment key={sub.code}>
                              <td colSpan={sub.pcFullMarks > 0 ? 6 : 4} className="py-2 text-center text-slate-400">
                                -
                              </td>
                            </React.Fragment>
                          );
                        }

                        const subPassed = res.isPassed;

                        return (
                          <React.Fragment key={sub.code}>
                            {/* TC */}
                            <td
                              className={`py-2 px-1 text-center font-mono text-[11px] border-r border-slate-200 dark:border-slate-700/30 ${
                                res.tc.isPassed ? "text-slate-600 dark:text-slate-300" : "text-rose-500 font-bold bg-rose-50/40 dark:bg-rose-950/20"
                              }`}
                            >
                              {toBengaliNumerals(res.tc.obtained)}
                            </td>

                            {/* TF */}
                            <td
                              className={`py-2 px-1 text-center font-mono text-[11px] border-r border-slate-200 dark:border-slate-700/30 ${
                                res.tf.isPassed ? "text-slate-600 dark:text-slate-300" : "text-rose-500 font-bold bg-rose-50/40 dark:bg-rose-950/20"
                              }`}
                            >
                              {toBengaliNumerals(res.tf.obtained)}
                            </td>

                            {/* PC (if lab) */}
                            {sub.pcFullMarks > 0 && (
                              <td
                                className={`py-2 px-1 text-center font-mono text-[11px] border-r border-slate-200 dark:border-slate-700/30 ${
                                  res.pc?.isPassed !== false ? "text-indigo-600 dark:text-indigo-300" : "text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/40/40"
                                }`}
                              >
                                {toBengaliNumerals(res.pc?.obtained ?? 0)}
                              </td>
                            )}

                            {/* PF (if lab) */}
                            {sub.pfFullMarks > 0 && (
                              <td
                                className={`py-2 px-1 text-center font-mono text-[11px] border-r border-slate-200 dark:border-slate-700/30 ${
                                  res.pf?.isPassed !== false ? "text-indigo-600 dark:text-indigo-300" : "text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/40/40"
                                }`}
                              >
                                {toBengaliNumerals(res.pf?.obtained ?? 0)}
                              </td>
                            )}

                            {/* Total Marks */}
                            <td className="py-2 px-1 text-center font-mono font-bold text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700/30">
                              {toBengaliNumerals(res.totalObtained)}
                            </td>

                            {/* Letter Grade */}
                            <td className="py-2 px-1 text-center border-r border-slate-200 dark:border-slate-700/60">
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-black border ${getGradeBadge(
                                  res.grade
                                )}`}
                              >
                                {res.grade}
                              </span>
                            </td>
                          </React.Fragment>
                        );
                      })}

                      {/* Semester Summary Cells */}
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 bg-indigo-50/20 dark:bg-indigo-950/5">
                        {toBengaliNumerals(totalObtainedMarks)}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-black text-indigo-600 dark:text-indigo-400 border-r border-slate-200 dark:border-slate-800 bg-indigo-50/20 dark:bg-indigo-950/5">
                        {toBengaliNumerals(st.semesterSummary.formattedGpa)}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800 bg-indigo-50/20 dark:bg-indigo-950/5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${getGradeBadge(
                            st.semesterSummary.letterGrade
                          )}`}
                        >
                          {st.semesterSummary.letterGrade}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800 bg-indigo-50/20 dark:bg-indigo-950/5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            isPassed
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {st.semesterSummary.statusBangla}
                        </span>
                      </td>

                      {/* Edit / Quick Calculator Button */}
                      <td className="py-2 px-2 text-center print:hidden">
                        <button
                          onClick={() => handleOpenCalculator(st)}
                          title="নম্বর সংশোধন ও লাইভ গ্রেড ক্যালকুলেটর"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 transition cursor-pointer"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={subjects.length * 5 + 7}
                      className="py-12 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-850/50"
                    >
                      {loading ? "ট্যাবুলেশন শিটের তথ্য লোড হচ্ছে..." : "কোনো শিক্ষার্থীর ফলাফল পাওয়া যায়নি।"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printable Official Signatures Footer */}
        <div className="hidden print:flex pt-16 mt-8 border-t border-slate-400 items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
          <div className="text-center space-y-1">
            <div className="w-44 border-b border-slate-400 mb-1"></div>
            <span>পরীক্ষা নিয়ন্ত্রক / প্রস্তুতকারক</span>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">পঞ্চগড় টিএসসি</div>
          </div>
          <div className="text-center space-y-1">
            <div className="w-44 border-b border-slate-400 mb-1"></div>
            <span>বিভাগীয় প্রধান (চিফ ইন্সট্রাক্টর)</span>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">পঞ্চগড় টিএসসি</div>
          </div>
          <div className="text-center space-y-1">
            <div className="w-44 border-b border-slate-400 mb-1"></div>
            <span>অধ্যক্ষ (Principal)</span>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. LIVE BTEB GRADING CALCULATOR & MARKS EDITOR MODAL */}
      {/* ========================================================================= */}
      {isCalculatorOpen && calculatorStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    বিটিইবি লাইভ গ্রেডিং ক্যালকুলেটর ও নম্বর সংশোধন
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    রোল: #{calculatorStudent.roll} • {calculatorStudent.nameBangla || calculatorStudent.name} (
                    {calculatorStudent.studentId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCalculatorOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* BTEB Passing Criteria Explanation Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-black">BTEB পাসের আবশ্যিক শর্ত:</span> শিক্ষার্থীকে প্রতিটি বিষয়ে তত্ত্বীয় অংশ (TC+TF) এবং
                  ব্যবহারিক অংশ (PC+PF)-এ পৃথকভাবে কমপক্ষে ৪০% নম্বর পেয়ে উত্তীর্ণ হতে হবে। যে কোনো একটি অংশে ফেল করলে সামগ্রিক গ্রেড
                  হবে <span className="font-bold text-rose-500">F (০.০০)</span>।
                </div>
              </div>

              {/* Subject Breakdown Input Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-3">বিষয় ও কোড</th>
                      <th className="py-2.5 px-2 text-center">TC (তত্ত্বীয় ধারাবাহিক)</th>
                      <th className="py-2.5 px-2 text-center">TF (তত্ত্বীয় সমাপনী)</th>
                      <th className="py-2.5 px-2 text-center">PC (ব্যবহারিক ধারা.)</th>
                      <th className="py-2.5 px-2 text-center">PF (ব্যবহারিক সমাপনী)</th>
                      <th className="py-2.5 px-2 text-center">মোট প্রাপ্ত</th>
                      <th className="py-2.5 px-2 text-center">গ্রেড</th>
                      <th className="py-2.5 px-2 text-center">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {subjects.map((sub) => {
                      const marks = editedMarks[sub.code] || { tc: 0, tf: 0, pc: 0, pf: 0 };
                      const liveResult = liveCalculatedSemester?.results.find((r) => r.code === sub.code);

                      return (
                        <tr key={sub.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800/40">
                          {/* Subject Name */}
                          <td className="py-2.5 px-3 font-sans">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {sub.nameBangla || sub.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">কোড: {sub.code}</div>
                          </td>

                          {/* TC Input */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={sub.tcFullMarks}
                              value={marks.tc}
                              onChange={(e) =>
                                setEditedMarks((prev) => ({
                                  ...prev,
                                  [sub.code]: { ...prev[sub.code], tc: Number(e.target.value) },
                                }))
                              }
                              className="w-16 px-2 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                            />
                            <div className="text-[9px] text-slate-400 mt-0.5">পূর্ণমান: {sub.tcFullMarks}</div>
                          </td>

                          {/* TF Input */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={sub.tfFullMarks}
                              value={marks.tf}
                              onChange={(e) =>
                                setEditedMarks((prev) => ({
                                  ...prev,
                                  [sub.code]: { ...prev[sub.code], tf: Number(e.target.value) },
                                }))
                              }
                              className="w-16 px-2 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                            />
                            <div className="text-[9px] text-slate-400 mt-0.5">পূর্ণমান: {sub.tfFullMarks}</div>
                          </td>

                          {/* PC Input (If applicable) */}
                          <td className="py-2 px-2 text-center">
                            {sub.pcFullMarks > 0 ? (
                              <>
                                <input
                                  type="number"
                                  min={0}
                                  max={sub.pcFullMarks}
                                  value={marks.pc}
                                  onChange={(e) =>
                                    setEditedMarks((prev) => ({
                                      ...prev,
                                      [sub.code]: { ...prev[sub.code], pc: Number(e.target.value) },
                                    }))
                                  }
                                  className="w-16 px-2 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                />
                                <div className="text-[9px] text-slate-400 mt-0.5">পূর্ণমান: {sub.pcFullMarks}</div>
                              </>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* PF Input (If applicable) */}
                          <td className="py-2 px-2 text-center">
                            {sub.pfFullMarks > 0 ? (
                              <>
                                <input
                                  type="number"
                                  min={0}
                                  max={sub.pfFullMarks}
                                  value={marks.pf}
                                  onChange={(e) =>
                                    setEditedMarks((prev) => ({
                                      ...prev,
                                      [sub.code]: { ...prev[sub.code], pf: Number(e.target.value) },
                                    }))
                                  }
                                  className="w-16 px-2 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                />
                                <div className="text-[9px] text-slate-400 mt-0.5">পূর্ণমান: {sub.pfFullMarks}</div>
                              </>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Total Obtained */}
                          <td className="py-2 px-2 text-center font-bold text-slate-900 dark:text-white">
                            {liveResult ? toBengaliNumerals(liveResult.totalObtained) : 0}
                          </td>

                          {/* Letter Grade */}
                          <td className="py-2 px-2 text-center">
                            {liveResult && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${getGradeBadge(
                                  liveResult.grade
                                )}`}
                              >
                                {liveResult.grade} ({liveResult.gradePoint.toFixed(2)})
                              </span>
                            )}
                          </td>

                          {/* Pass/Fail Status */}
                          <td className="py-2 px-2 text-center font-sans">
                            {liveResult && (
                              <span
                                className={`text-[10px] font-bold ${
                                  liveResult.isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                                }`}
                              >
                                {liveResult.isPassed ? "পাস" : liveResult.failedReason || "ফেল"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Live Summary Bar */}
              {liveCalculatedSemester && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-[10px] text-slate-400">সামগ্রিক জিপিএ (GPA)</div>
                      <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        {toBengaliNumerals(liveCalculatedSemester.summary.formattedGpa)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">লেটার গ্রেড</div>
                      <div className="text-xl font-black text-slate-900 dark:text-white">
                        {liveCalculatedSemester.summary.letterGrade}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">ফলাফল স্ট্যাটাস</div>
                      <div
                        className={`text-sm font-black ${
                          liveCalculatedSemester.summary.status === "Passed"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-500"
                        }`}
                      >
                        {liveCalculatedSemester.summary.statusBangla}
                        {liveCalculatedSemester.summary.failedSubjects.length > 0 &&
                          ` (${liveCalculatedSemester.summary.failedSubjects.length} বিষয়ে রেফার্ড)`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveRecalculatedMarks}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>ট্যাবুলেশন শিটে আপডেট করুন</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-850/50">
              <button
                onClick={() => setIsCalculatorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                বাতিল করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
