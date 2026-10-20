"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import {
  Search,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Users,
  Award,
  BookOpen,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  Check,
  X,
  Sparkles,
  Info,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import {
  ExamMaster,
  ExamSubjectConfig,
  ExamMarkStudentEntry,
  StudentExamAttendanceStatus,
  ExamComponentRule,
} from "@/lib/examinationEngine";
import { ACADEMIC_CLASSES, ALL_TRADES, doesClassHaveTrade } from "@/lib/academicStructure";
import { toBengaliNumerals } from "@/lib/utils";

interface ExamMarkEntryWorkspaceProps {
  exams: ExamMaster[];
  initialExamId?: number;
  initialClassId?: number;
  initialSubjectCode?: string;
  onRefreshExams?: () => void;
}

export default function ExamMarkEntryWorkspace({
  exams,
  initialExamId,
  initialClassId,
  initialSubjectCode,
  onRefreshExams,
}: ExamMarkEntryWorkspaceProps) {
  // Context Selection States
  const [selectedExamId, setSelectedExamId] = useState<number>(initialExamId || exams[0]?.id || 1);
  const [selectedClassId, setSelectedClassId] = useState<number>(initialClassId || 4); // Default Class 9
  const [selectedTradeId, setSelectedTradeId] = useState<number | undefined>(2); // Default IT-IOT
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(initialSubjectCode || "");

  // Data Loading & Content
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeExam, setActiveExam] = useState<ExamMaster | null>(null);
  const [subjectConfig, setSubjectConfig] = useState<ExamSubjectConfig | null>(null);
  const [studentEntries, setStudentEntries] = useState<ExamMarkStudentEntry[]>([]);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Unlock Modal
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [unlockReason, setUnlockReason] = useState<string>("");
  const [unlockOperator, setUnlockOperator] = useState<string>("Head Teacher / Exam Controller");

  // Selected Exam
  const currentExam = useMemo(() => {
    return exams.find((e) => e.id === selectedExamId) || exams[0];
  }, [exams, selectedExamId]);

  // Current Class Object
  const currentClassObj = useMemo(() => {
    return ACADEMIC_CLASSES.find((c) => c.id === selectedClassId);
  }, [selectedClassId]);

  const hasTrade = useMemo(() => {
    return currentClassObj ? doesClassHaveTrade(currentClassObj.numericValue) : false;
  }, [currentClassObj]);

  // Available subjects for this exam and class
  const availableSubjects = useMemo(() => {
    if (!currentExam) return [];
    return currentExam.subjects.filter((s) => s.classId === selectedClassId);
  }, [currentExam, selectedClassId]);

  // Sync selected subject if empty or invalid
  useEffect(() => {
    if (availableSubjects.length > 0) {
      const exists = availableSubjects.some((s) => s.subjectCode === selectedSubjectCode);
      if (!exists) {
        setSelectedSubjectCode(availableSubjects[0].subjectCode);
      }
    }
  }, [availableSubjects, selectedSubjectCode]);

  // Load Marks Data from API
  const loadMarksData = async () => {
    if (!selectedExamId || !selectedClassId || !selectedSubjectCode) return;
    setLoading(true);
    setErrorMessage(null);
    setSaveSuccessMsg(null);

    try {
      const tradeParam = hasTrade && selectedTradeId ? `&tradeId=${selectedTradeId}` : "";
      const res = await fetch(
        `/api/examination/marks?examId=${selectedExamId}&classId=${selectedClassId}&section=${selectedSection}&subjectCode=${encodeURIComponent(
          selectedSubjectCode
        )}${tradeParam}`
      );
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "নম্বর তালিকা লোড করা যায়নি।");
      }

      setActiveExam(data.exam);
      setSubjectConfig(data.subjectConfig);
      setStudentEntries(data.students || []);
      setIsLocked(data.isLocked);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      setErrorMessage(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarksData();
  }, [selectedExamId, selectedClassId, selectedTradeId, selectedSection, selectedSubjectCode]);

  // Live calculation of student marks upon input change
  const handleMarkChange = (
    index: number,
    field: "theoryMarks" | "practicalMarks" | "vivaMarks" | "continuousMarks" | "attendanceStatus",
    value: any
  ) => {
    if (isLocked) return;

    setStudentEntries((prev) => {
      const updated = [...prev];
      const entry = { ...updated[index] };

      if (field === "attendanceStatus") {
        entry.attendanceStatus = value as StudentExamAttendanceStatus;
      } else {
        const numVal = value === "" || value === null ? null : Number(value);
        entry[field] = numVal;
      }

      // Re-evaluate
      const rule: ExamComponentRule = subjectConfig?.componentRule || {
        hasTheory: true,
        theoryMax: 60,
        theoryPass: 20,
        hasPractical: false,
        practicalMax: 0,
        practicalPass: 0,
        hasViva: false,
        vivaMax: 0,
        vivaPass: 0,
        hasContinuous: true,
        continuousMax: 40,
        continuousPass: 13,
        fullMarks: 100,
        passMarks: 33,
        requireSeparatePass: true,
      };

      if (entry.attendanceStatus === "Absent") {
        entry.totalMarks = 0;
        entry.grade = "F";
        entry.gradePoint = 0.0;
        entry.isPassed = false;
        entry.componentFailReasons = ["অনুপস্থিত"];
      } else if (entry.attendanceStatus === "Expelled") {
        entry.totalMarks = 0;
        entry.grade = "F";
        entry.gradePoint = 0.0;
        entry.isPassed = false;
        entry.componentFailReasons = ["বহিষ্কৃত"];
      } else if (entry.attendanceStatus === "Medical") {
        entry.totalMarks = 0;
        entry.grade = "I";
        entry.gradePoint = 0.0;
        entry.isPassed = false;
        entry.componentFailReasons = ["মেডিকেল ছুটি"];
      } else {
        const t = entry.theoryMarks ?? 0;
        const p = entry.practicalMarks ?? 0;
        const v = entry.vivaMarks ?? 0;
        const c = entry.continuousMarks ?? 0;
        const total = Math.round((t + p + v + c) * 10) / 10;
        entry.totalMarks = total;

        const failReasons: string[] = [];
        if (rule.requireSeparatePass) {
          if (rule.hasTheory && t < rule.theoryPass) failReasons.push("তাত্ত্বিকে অনুত্তীর্ণ");
          if (rule.hasPractical && p < rule.practicalPass) failReasons.push("ব্যবহারিকে অনুত্তীর্ণ");
          if (rule.hasViva && v < rule.vivaPass) failReasons.push("মৌখিকে অনুত্তীর্ণ");
          if (rule.hasContinuous && c < rule.continuousPass) failReasons.push("ধারাবাহিকে অনুত্তীর্ণ");
        }
        if (total < rule.passMarks) failReasons.push("মোট নম্বর পাস মার্কের নিচে");

        const isPassed = failReasons.length === 0;
        entry.isPassed = isPassed;
        entry.componentFailReasons = failReasons;

        const percentage = rule.fullMarks > 0 ? (total / rule.fullMarks) * 100 : 0;
        if (!isPassed) {
          entry.grade = "F";
          entry.gradePoint = 0.0;
        } else if (percentage >= 80) {
          entry.grade = "A+";
          entry.gradePoint = 5.0;
        } else if (percentage >= 70) {
          entry.grade = "A";
          entry.gradePoint = 4.0;
        } else if (percentage >= 60) {
          entry.grade = "A-";
          entry.gradePoint = 3.5;
        } else if (percentage >= 50) {
          entry.grade = "B";
          entry.gradePoint = 3.0;
        } else if (percentage >= 40) {
          entry.grade = "C";
          entry.gradePoint = 2.0;
        } else {
          entry.grade = "D";
          entry.gradePoint = 1.0;
        }
      }

      updated[index] = entry;
      return updated;
    });

    setHasUnsavedChanges(true);
  };

  // Quick Action: Mark All Present
  const handleMarkAllPresent = () => {
    if (isLocked) return;
    setStudentEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        attendanceStatus: "Present",
      }))
    );
    setHasUnsavedChanges(true);
  };

  // Save Marks (Draft or Final)
  const handleSaveMarks = async (isFinalSubmit: boolean = false) => {
    if (isLocked && !isFinalSubmit) return;
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccessMsg(null);

    try {
      const payload = {
        examId: selectedExamId,
        classId: selectedClassId,
        tradeId: hasTrade ? selectedTradeId : undefined,
        section: selectedSection,
        subjectCode: selectedSubjectCode,
        entries: studentEntries.map((e) => ({
          studentId: e.studentId,
          attendanceStatus: e.attendanceStatus,
          theoryMarks: e.theoryMarks,
          practicalMarks: e.practicalMarks,
          vivaMarks: e.vivaMarks,
          continuousMarks: e.continuousMarks,
        })),
        isFinalSubmit,
        operator: "Instructor (Evaluator)",
        reason: isFinalSubmit ? "নম্বরপত্র যাচাই ও চূড়ান্ত সাবমিট সম্পন্ন" : "খসড়া নম্বর সংরক্ষণ",
      };

      const res = await fetch("/api/examination/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "সংরক্ষণ ব্যর্থ হয়েছে।");
      }

      setSaveSuccessMsg(data.message);
      setHasUnsavedChanges(false);
      if (isFinalSubmit) {
        setIsLocked(true);
      }
      onRefreshExams?.();
    } catch (err: any) {
      setErrorMessage(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setSaving(false);
    }
  };

  // Handle Unlock Exam Request
  const handleUnlockExam = async () => {
    if (!unlockReason.trim()) {
      alert("অনুগ্রহ করে আনলক করার সুনির্দিষ্ট কারণ উল্লেখ করুন।");
      return;
    }

    try {
      const res = await fetch("/api/examination/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedExamId,
          status: "MarksEntry",
          operator: unlockOperator,
          reason: unlockReason,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "আনলক করা সম্ভব হয়নি।");
      }

      setIsLocked(false);
      setShowUnlockModal(false);
      setUnlockReason("");
      loadMarksData();
      onRefreshExams?.();
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    }
  };

  // Filtered Students for Table Search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentEntries;
    const q = searchQuery.toLowerCase();
    return studentEntries.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nameBangla.includes(q) ||
        String(s.roll).includes(q) ||
        s.studentCode.toLowerCase().includes(q)
    );
  }, [studentEntries, searchQuery]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = studentEntries.length;
    const present = studentEntries.filter((s) => s.attendanceStatus === "Present").length;
    const absent = studentEntries.filter((s) => s.attendanceStatus === "Absent").length;
    const passed = studentEntries.filter((s) => s.isPassed && s.attendanceStatus === "Present").length;
    const passRate = present > 0 ? Math.round((passed / present) * 100) : 0;
    return { total, present, absent, passed, passRate };
  }, [studentEntries]);

  const rule = subjectConfig?.componentRule;

  return (
    <div className="space-y-6">
      {/* Context Selection Toolbar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>নম্বর প্রদান ও মূল্যায়ন ওয়ার্কস্পেস (Marks Entry Workspace)</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              বিষয়ের মূল্যায়ন ও ফলাফল লিপিবদ্ধকরণ
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {isLocked ? (
              <button
                onClick={() => setShowUnlockModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <Unlock className="w-4 h-4" />
                <span>লক আনলক করুন</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSaveMarks(false)}
                  disabled={saving || loading}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>খসড়া সংরক্ষণ</span>
                </button>

                <button
                  onClick={() => handleSaveMarks(true)}
                  disabled={saving || loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs shadow-emerald-600/20 transition flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>চূড়ান্ত জমা ও লক</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* 1. Exam Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              পরীক্ষা নির্বাচন:
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            >
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.nameBangla} ({exam.academicYear})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Class Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              শ্রেণি:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            >
              {ACADEMIC_CLASSES.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nameBangla}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Trade Selector (if applicable) */}
          {hasTrade ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                কারিগরি ট্রেড:
              </label>
              <select
                value={selectedTradeId || 0}
                onChange={(e) => setSelectedTradeId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                {ALL_TRADES.slice(0, 4).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameBangla} ({t.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                শাখা / সেকশন:
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                <option value="all">সকল সেকশন (All)</option>
                <option value="A">সেকশন A</option>
                <option value="B">সেকশন B</option>
              </select>
            </div>
          )}

          {/* 4. Subject Selector */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              মূল্যায়ন বিষয়:
            </label>
            <select
              value={selectedSubjectCode}
              onChange={(e) => setSelectedSubjectCode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            >
              {availableSubjects.map((sub) => (
                <option key={sub.id} value={sub.subjectCode}>
                  {sub.subjectNameBangla} [{sub.subjectCode}] • পূর্ণমান: {sub.componentRule.fullMarks}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lock Status Banner */}
      {isLocked && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 shrink-0 text-amber-600" />
            <div>
              <span className="font-bold block">এই বিষয়ের মূল্যায়ন বর্তমানে লককৃত (Marks Sheet Locked)</span>
              <span className="text-[11px]">
                পরীক্ষা নিয়ন্ত্রক বা প্রধান শিক্ষক ব্যতীত নম্বর পরিবর্তন করা যাবে না।
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowUnlockModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
          >
            আনলক করুন
          </button>
        </div>
      )}

      {/* Save Success Alert */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-3 text-xs text-rose-800 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Subject Rule & Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 block">মোট শিক্ষার্থী</span>
          <span className="text-lg font-black text-slate-900 dark:text-white">
            {toBengaliNumerals(stats.total)} জন
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
            উপস্থিত শিক্ষার্থী
          </span>
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {toBengaliNumerals(stats.present)} জন
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-rose-500 font-bold block">অনুপস্থিত</span>
          <span className="text-lg font-black text-rose-500">
            {toBengaliNumerals(stats.absent)} জন
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold block">
            উত্তীর্ণ সংখ্যা
          </span>
          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
            {toBengaliNumerals(stats.passed)} জন ({toBengaliNumerals(stats.passRate)}%)
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 col-span-2">
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold block">
            বিষয় নম্বর বিভাজন (BTEB Rule):
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
            পূর্ণমান: {rule?.fullMarks} (পাস: {rule?.passMarks})
            {rule?.hasTheory ? ` • তাত্ত্বিক: ${rule?.theoryMax} (পাস: ${rule?.theoryPass})` : ""}
            {rule?.hasPractical ? ` • ব্যবহারিক: ${rule?.practicalMax} (পাস: ${rule?.practicalPass})` : ""}
            {rule?.hasContinuous ? ` • ধারাবাহিক: ${rule?.continuousMax} (পাস: ${rule?.continuousPass})` : ""}
          </span>
        </div>
      </div>

      {/* Main Mark Entry Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="রোল বা নাম দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {!isLocked && (
              <button
                onClick={handleMarkAllPresent}
                className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition"
              >
                সবাইকে উপস্থিত চিহ্নিত করুন
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট শিট</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 w-16 text-center">রোল</th>
                <th className="p-3 min-w-[180px]">শিক্ষার্থীর নাম ও আইডি</th>
                <th className="p-3 w-28 text-center">হাজিরা স্ট্যাটাস</th>
                {rule?.hasTheory && (
                  <th className="p-3 w-28 text-center">
                    তাত্ত্বিক (Theory)
                    <span className="block text-[10px] font-normal text-slate-400">
                      সর্বোচ্চ {rule?.theoryMax} (পাস {rule?.theoryPass})
                    </span>
                  </th>
                )}
                {rule?.hasPractical && (
                  <th className="p-3 w-28 text-center">
                    ব্যবহারিক (Practical)
                    <span className="block text-[10px] font-normal text-slate-400">
                      সর্বোচ্চ {rule?.practicalMax} (পাস {rule?.practicalPass})
                    </span>
                  </th>
                )}
                {rule?.hasViva && (
                  <th className="p-3 w-24 text-center">
                    মৌখিক (Viva)
                    <span className="block text-[10px] font-normal text-slate-400">
                      সর্বোচ্চ {rule?.vivaMax}
                    </span>
                  </th>
                )}
                {rule?.hasContinuous && (
                  <th className="p-3 w-28 text-center">
                    ধারাবাহিক (Cont.)
                    <span className="block text-[10px] font-normal text-slate-400">
                      সর্বোচ্চ {rule?.continuousMax} (পাস {rule?.continuousPass})
                    </span>
                  </th>
                )}
                <th className="p-3 w-20 text-center">মোট প্রাপ্ত</th>
                <th className="p-3 w-16 text-center">গ্রেড</th>
                <th className="p-3 w-24 text-center">ফলাফল</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>নম্বরপত্র লোড হচ্ছে...</span>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-400">
                    কোনো শিক্ষার্থী পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu, idx) => {
                  const isInvalidTheory =
                    rule?.hasTheory && stu.theoryMarks !== null && Number(stu.theoryMarks) > (rule?.theoryMax || 100);
                  const isInvalidPractical =
                    rule?.hasPractical &&
                    stu.practicalMarks !== null &&
                    Number(stu.practicalMarks) > (rule?.practicalMax || 100);

                  return (
                    <tr
                      key={stu.studentId}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60/70 dark:hover:bg-slate-800/50 transition ${
                        stu.attendanceStatus !== "Present" ? "bg-slate-50/40 dark:bg-slate-900/60 opacity-80" : ""
                      }`}
                    >
                      {/* Roll */}
                      <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {toBengaliNumerals(stu.roll)}
                      </td>

                      {/* Name & ID */}
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {stu.nameBangla}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono block">
                          {stu.studentCode} {stu.section ? `• সেকশন ${stu.section}` : ""}
                        </span>
                      </td>

                      {/* Attendance Status */}
                      <td className="p-3 text-center">
                        <select
                          disabled={isLocked}
                          value={stu.attendanceStatus}
                          onChange={(e) => handleMarkChange(idx, "attendanceStatus", e.target.value)}
                          className={`w-full px-2 py-1 rounded-lg text-xs font-bold text-center border ${
                            stu.attendanceStatus === "Present"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                              : stu.attendanceStatus === "Absent"
                              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300"
                              : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          <option value="Present">উপস্থিত (P)</option>
                          <option value="Absent">অনুপস্থিত (A)</option>
                          <option value="Expelled">বহিষ্কৃত (E)</option>
                          <option value="Medical">মেডিকেল (M)</option>
                        </select>
                      </td>

                      {/* Theory */}
                      {rule?.hasTheory && (
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            disabled={isLocked || stu.attendanceStatus !== "Present"}
                            value={stu.theoryMarks ?? ""}
                            onChange={(e) => handleMarkChange(idx, "theoryMarks", e.target.value)}
                            className={`w-20 px-2 py-1 rounded-lg text-center font-mono font-bold text-xs border ${
                              isInvalidTheory
                                ? "border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-600"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            }`}
                            placeholder="0"
                          />
                        </td>
                      )}

                      {/* Practical */}
                      {rule?.hasPractical && (
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            disabled={isLocked || stu.attendanceStatus !== "Present"}
                            value={stu.practicalMarks ?? ""}
                            onChange={(e) => handleMarkChange(idx, "practicalMarks", e.target.value)}
                            className={`w-20 px-2 py-1 rounded-lg text-center font-mono font-bold text-xs border ${
                              isInvalidPractical
                                ? "border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-600"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            }`}
                            placeholder="0"
                          />
                        </td>
                      )}

                      {/* Viva */}
                      {rule?.hasViva && (
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            disabled={isLocked || stu.attendanceStatus !== "Present"}
                            value={stu.vivaMarks ?? ""}
                            onChange={(e) => handleMarkChange(idx, "vivaMarks", e.target.value)}
                            className="w-16 px-2 py-1 rounded-lg text-center font-mono font-bold text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            placeholder="0"
                          />
                        </td>
                      )}

                      {/* Continuous */}
                      {rule?.hasContinuous && (
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            disabled={isLocked || stu.attendanceStatus !== "Present"}
                            value={stu.continuousMarks ?? ""}
                            onChange={(e) => handleMarkChange(idx, "continuousMarks", e.target.value)}
                            className="w-20 px-2 py-1 rounded-lg text-center font-mono font-bold text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            placeholder="0"
                          />
                        </td>
                      )}

                      {/* Total */}
                      <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                        {toBengaliNumerals(stu.totalMarks)}
                      </td>

                      {/* Grade */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-black text-xs ${
                            stu.grade === "A+"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : stu.grade === "A" || stu.grade === "A-"
                              ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300"
                              : stu.grade === "B" || stu.grade === "C" || stu.grade === "D"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {stu.grade}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span
                          className={`text-xs font-bold ${
                            stu.isPassed
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {stu.isPassed ? "উত্তীর্ণ" : "অনুত্তীর্ণ"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unlock Confirmation Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <Unlock className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                মূল্যায়নপত্র আনলক অনুমোদন
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              পরীক্ষার নম্বরপত্র আনলক করলে অডিট ট্রেইলে কারণ ও পরিবর্তনকারী কর্মকর্তার তথ্য সংরক্ষিত হবে।
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                অনুমোদনকারী কর্মকর্তা:
              </label>
              <input
                type="text"
                value={unlockOperator}
                onChange={(e) => setUnlockOperator(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                আনলক করার সুনির্দিষ্ট কারণ *
              </label>
              <textarea
                rows={3}
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="যেমন: খাতা পুনর্নিরীক্ষণ বা অনুপস্থিতি সংশোধনের আবেদন..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowUnlockModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                বাতিল
              </button>
              <button
                onClick={handleUnlockExam}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition"
              >
                নিশ্চিত আনলক করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
