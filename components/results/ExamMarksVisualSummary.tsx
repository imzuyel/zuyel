"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Award,
  Layers,
  Filter,
  Search,
  Printer,
  Download,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Eye,
  Edit3,
  SlidersHorizontal,
  ChevronDown,
  X,
  Calendar,
  Building,
  GraduationCap,
} from "lucide-react";
import { toBengaliNumerals } from "@/lib/utils";
import {
  ACADEMIC_CLASSES,
  BTEB_ACADEMIC_TRADES,
  doesClassHaveTrade,
  getSubjectsForClass,
  parseClassNumeric,
  SubjectItem,
} from "@/lib/academicStructure";
import { GRADING_SCALE } from "@/lib/resultCalculation";
import AcademicTranscriptModal from "./AcademicTranscriptModal";

interface InstitutionalExamItem {
  id: number;
  name: string;
  nameBangla: string;
  academicYear: number;
  term: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

export interface ExamMarksVisualSummaryProps {
  onNavigateToEntry?: () => void;
}

export default function ExamMarksVisualSummary({ onNavigateToEntry }: ExamMarksVisualSummaryProps = {}) {
  // Exam & Academic States
  const [exams, setExams] = useState<InstitutionalExamItem[]>([]);
  const [selectedExamName, setSelectedExamName] = useState<string>("বর্ষ মধ্য পরীক্ষা ২০২৬");
  const [academicYear, setAcademicYear] = useState<number>(2026);
  const [selectedClassId, setSelectedClassId] = useState<number>(4); // Class 9 (SSC Vocational)
  const [selectedTradeId, setSelectedTradeId] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"roll" | "merit" | "gpa" | "marks">("merit");

  // Data & Loading States
  const [loading, setLoading] = useState<boolean>(false);
  const [resultsData, setResultsData] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal States
  const [isCreateExamOpen, setIsCreateExamOpen] = useState<boolean>(false);
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);
  const [transcriptTarget, setTranscriptTarget] = useState<any | null>(null);

  // New Exam Form
  const [newExamForm, setNewExamForm] = useState({
    nameBangla: "",
    name: "",
    academicYear: 2026,
    term: "Half-Yearly",
    status: "Published",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  });

  const numericClass = useMemo(() => parseClassNumeric(selectedClassId), [selectedClassId]);
  const isTradeApplicable = useMemo(() => doesClassHaveTrade(numericClass), [numericClass]);

  // Expected subjects for current class & trade
  const classSubjects: SubjectItem[] = useMemo(() => {
    return getSubjectsForClass(selectedClassId, selectedTradeId);
  }, [selectedClassId, selectedTradeId]);

  // Load Exam Types
  const loadExams = useCallback(async () => {
    try {
      const res = await fetch("/api/exams");
      if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.exams)) {
        setExams(data.exams);
        // If current selected exam not in list, fallback
        if (!data.exams.some((e: any) => e.nameBangla === selectedExamName)) {
          if (data.exams.length > 0) {
            setSelectedExamName(data.exams[0].nameBangla);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load exams:", err);
    }
  }, [selectedExamName]);

  // Load Results for Current Class, Exam & Year
  const loadResults = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      let url = `/api/results?type=class-sheet&classId=${selectedClassId}&academicYear=${academicYear}&examName=${encodeURIComponent(
        selectedExamName
      )}`;
      if (selectedSection && selectedSection !== "all") {
        url += `&section=${selectedSection}`;
      }
      if (isTradeApplicable && selectedTradeId && selectedTradeId !== "all") {
        url += `&tradeId=${selectedTradeId}`;
      }

      const res = await fetch(url);
      if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) {
        setResultsData(null);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setResultsData(data);
        if (data.exams && Array.isArray(data.exams)) {
          setExams(data.exams);
        }
      } else {
        setResultsData(null);
      }
    } catch (err: any) {
      console.error("Failed to load result marks:", err);
      setFeedback({ type: "error", message: "ফলাফল লোড করতে ব্যর্থ হয়েছে।" });
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, academicYear, selectedExamName, selectedSection, isTradeApplicable, selectedTradeId]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Handle Create New Exam Type
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamForm.nameBangla.trim()) {
      alert("পরীক্ষার নাম (বাংলা) প্রদান করুন।");
      return;
    }

    setCreateSubmitting(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExamForm),
      });
      const data = await res.json();
      if (data.success) {
        setExams(data.exams);
        setSelectedExamName(data.exam.nameBangla);
        setIsCreateExamOpen(false);
        setFeedback({
          type: "success",
          message: `'${data.exam.nameBangla}' পরীক্ষার নতুন ধরন সফলভাবে তৈরি হয়েছে।`,
        });
        setNewExamForm({
          nameBangla: "",
          name: "",
          academicYear: 2026,
          term: "Half-Yearly",
          status: "Published",
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        });
      } else {
        alert(data.error || "পরীক্ষার ধরন তৈরিতে সমস্যা হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "নেটওয়ার্ক সমস্যা");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Helper for BTEB Grade Badges
  const renderBtebGradeBadge = (grade: string, gradePoint?: number) => {
    switch (grade) {
      case "A+":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-black bg-emerald-600 text-white shadow-xs border border-emerald-500">
            <Sparkles className="w-3 h-3 text-amber-300" />
            {grade}
            {gradePoint !== undefined && <span className="opacity-90 font-medium">({gradePoint.toFixed(2)})</span>}
          </span>
        );
      case "A":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            {grade}
            {gradePoint !== undefined && <span className="opacity-80 font-medium">({gradePoint.toFixed(2)})</span>}
          </span>
        );
      case "A-":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">
            {grade}
            {gradePoint !== undefined && <span className="opacity-80 font-medium">({gradePoint.toFixed(2)})</span>}
          </span>
        );
      case "B":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            {grade}
            {gradePoint !== undefined && <span className="opacity-80 font-medium">({gradePoint.toFixed(2)})</span>}
          </span>
        );
      case "C":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            {grade}
            {gradePoint !== undefined && <span className="opacity-80 font-medium">({gradePoint.toFixed(2)})</span>}
          </span>
        );
      case "D":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
            {grade}
            {gradePoint !== undefined && <span className="opacity-80 font-medium">({gradePoint.toFixed(2)})</span>}
          </span>
        );
      case "F":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-black bg-rose-600 text-white shadow-xs border border-rose-700">
            {grade}
            {gradePoint !== undefined && <span className="opacity-90 font-medium">(০.০০)</span>}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
            —
          </span>
        );
    }
  };

  // Process & Filter Students
  const processedStudents = useMemo(() => {
    if (!resultsData || !Array.isArray(resultsData.students)) return [];

    let list = [...resultsData.students];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s: any) => {
        return (
          String(s.roll).includes(q) ||
          (s.studentCode && s.studentCode.toLowerCase().includes(q)) ||
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.nameBangla && s.nameBangla.toLowerCase().includes(q))
        );
      });
    }

    // Grade filter
    if (selectedGradeFilter !== "all") {
      list = list.filter((s: any) => s.letterGrade === selectedGradeFilter);
    }

    // Sorting
    list.sort((a: any, b: any) => {
      if (sortBy === "merit") {
        return (a.meritPosition || 9999) - (b.meritPosition || 9999);
      }
      if (sortBy === "roll") {
        return a.roll - b.roll;
      }
      if (sortBy === "gpa") {
        return (b.numericGpa || 0) - (a.numericGpa || 0);
      }
      if (sortBy === "marks") {
        return (b.totalMarks || 0) - (a.totalMarks || 0);
      }
      return 0;
    });

    return list;
  }, [resultsData, searchQuery, selectedGradeFilter, sortBy]);

  // Grade Distribution Counts
  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "A+": 0,
      A: 0,
      "A-": 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0,
    };
    if (!resultsData || !Array.isArray(resultsData.students)) return counts;

    resultsData.students.forEach((s: any) => {
      if (s.letterGrade && counts[s.letterGrade] !== undefined) {
        counts[s.letterGrade]++;
      }
    });
    return counts;
  }, [resultsData]);

  // Subject-wise Breakdown Metrics
  const subjectPerformanceStats = useMemo(() => {
    if (!resultsData || !Array.isArray(resultsData.students) || classSubjects.length === 0) {
      return [];
    }

    return classSubjects.map((subject) => {
      let examineesCount = 0;
      let totalMarksSum = 0;
      let highestMarks = 0;
      let aPlusCount = 0;
      let passedCount = 0;

      resultsData.students.forEach((stu: any) => {
        const mark = stu.marks?.find(
          (m: any) => m.subjectCode?.toLowerCase() === subject.code?.toLowerCase()
        );
        if (mark && mark.totalMarks !== undefined) {
          examineesCount++;
          totalMarksSum += mark.totalMarks;
          if (mark.totalMarks > highestMarks) highestMarks = mark.totalMarks;
          if (mark.grade === "A+") aPlusCount++;
          if (mark.grade !== "F") passedCount++;
        }
      });

      const avgMarks = examineesCount > 0 ? Number((totalMarksSum / examineesCount).toFixed(1)) : 0;
      const passRate = examineesCount > 0 ? Number(((passedCount / examineesCount) * 100).toFixed(1)) : 0;

      return {
        subject,
        examineesCount,
        highestMarks,
        avgMarks,
        aPlusCount,
        passRate,
      };
    });
  }, [resultsData, classSubjects]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-4 sm:p-6 print:border-none print:p-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border border-emerald-200">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  পরীক্ষাভিত্তিক ফলাফল ও BTEB গ্রেড ভিজ্যুয়াল সামারি
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    BTEB Grading Matrix
                  </span>
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  নতুন তৈরি করা সকল পরীক্ষা ও বিষয়ভিত্তিক মূল্যায়নের প্রাপ্ত নম্বর এবং নির্ধারিত বিটিইবি লেটার গ্রেড বিশ্লেষণ
                </p>
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 flex-wrap print:hidden">
            {onNavigateToEntry && (
              <button
                onClick={onNavigateToEntry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/25 transition cursor-pointer"
                title="সরাসরি নম্বর এন্ট্রি ও মূল্যায়ন শিটে যান"
              >
                <Edit3 className="w-4 h-4" />
                নম্বর এন্ট্রি করুন (Marks Entry)
              </button>
            )}
            <button
              onClick={() => setIsCreateExamOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              নতুন পরীক্ষা যোগ করুন
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold transition border border-slate-300 dark:border-slate-700"
            >
              <Printer className="w-4 h-4" />
              প্রিন্ট সামারি
            </button>
            <button
              onClick={loadResults}
              disabled={loading}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Exam Types Selector Bar (Pills) */}
        <div className="mt-5 print:hidden">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              পরীক্ষার ধরন নির্বাচন করুন (Select Exam Type):
            </label>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              মোট পরীক্ষা: {toBengaliNumerals(exams.length)} টি
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {exams.map((ex) => {
              const isSelected = selectedExamName === ex.nameBangla;
              return (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExamName(ex.nameBangla)}
                  className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition shrink-0 border ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span>{ex.nameBangla}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      isSelected
                        ? "bg-emerald-700 text-emerald-100"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 group-hover:bg-slate-300"
                    }`}
                  >
                    {ex.term || "Exam"}
                  </span>
                  {ex.status === "Published" && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? "bg-amber-300" : "bg-emerald-500"
                      }`}
                      title="ফলাফল প্রকাশিত"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Filter Row */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 print:hidden">
          {/* Class Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">শ্রেণি (Class)</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(Number(e.target.value));
                setSelectedTradeId("all");
              }}
              className="w-full text-sm font-medium border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {ACADEMIC_CLASSES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBangla}
                </option>
              ))}
            </select>
          </div>

          {/* Trade Selector (Conditional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              ট্রেড / বিভাগ {isTradeApplicable ? "" : "(প্রযোজ্য নয়)"}
            </label>
            <select
              value={selectedTradeId}
              disabled={!isTradeApplicable}
              onChange={(e) => setSelectedTradeId(e.target.value)}
              className={`w-full text-sm font-medium border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                isTradeApplicable
                  ? "border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 cursor-not-allowed"
              }`}
            >
              <option value="all">সব ট্রেড (All Trades)</option>
              {BTEB_ACADEMIC_TRADES.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.nameBangla} ({t.code})
                </option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">শাখা (Section)</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full text-sm font-medium border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">সকল শাখা (All Sections)</option>
              <option value="A">শাখা - ক (Section A)</option>
              <option value="B">শাখা - খ (Section B)</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">রোল বা নাম দিয়ে খুঁজুন</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="রোল / নাম / আইডি..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">ক্রমবিন্যাস (Sort By)</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-sm font-medium border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="merit">মেধাক্রম অনুসারে (Merit Rank)</option>
              <option value="roll">রোল নম্বর অনুসারে (Roll)</option>
              <option value="gpa">জিপিএ অনুসারে (Highest GPA)</option>
              <option value="marks">সর্বমোট প্রাপ্ত নম্বর (Total Marks)</option>
            </select>
          </div>
        </div>

        {/* Statistical Summary Overview Cards */}
        {resultsData?.statistics && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">মোট পরীক্ষার্থী</span>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {toBengaliNumerals(resultsData.statistics.totalStudents || 0)} জন
              </span>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-700 font-medium block">কৃতকার্য (উত্তীর্ণ)</span>
              <span className="text-xl font-bold text-emerald-800">
                {toBengaliNumerals(resultsData.statistics.passedStudents || 0)} জন
              </span>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200">
              <span className="text-xs text-rose-700 font-medium block">অকৃতকার্য (F গ্রেড)</span>
              <span className="text-xl font-bold text-rose-800">
                {toBengaliNumerals(resultsData.statistics.failedStudents || 0)} জন
              </span>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200">
              <span className="text-xs text-blue-700 font-medium block">পাসের হার (Pass Rate)</span>
              <span className="text-xl font-bold text-blue-800">
                {toBengaliNumerals(resultsData.statistics.passPercentage || 0)}%
              </span>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200">
              <span className="text-xs text-amber-700 font-medium block">গড় জিপিএ (Average GPA)</span>
              <span className="text-xl font-bold text-amber-800">
                {toBengaliNumerals(resultsData.statistics.averageGpa || 0)}
              </span>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200">
              <span className="text-xs text-purple-700 font-medium block">বর্তমান পরীক্ষা</span>
              <span className="text-sm font-bold text-purple-800 truncate block" title={selectedExamName}>
                {selectedExamName}
              </span>
            </div>
          </div>
        )}

        {/* BTEB Grade Distribution Filters */}
        <div className="mt-4 flex items-center gap-1.5 flex-wrap print:hidden">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            গ্রেড অনুযায়ী ফিল্টার:
          </span>
          <button
            onClick={() => setSelectedGradeFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              selectedGradeFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            সকল গ্রেড ({toBengaliNumerals(resultsData?.students?.length || 0)})
          </button>
          {["A+", "A", "A-", "B", "C", "D", "F"].map((grade) => {
            const count = gradeCounts[grade] || 0;
            const isSelected = selectedGradeFilter === grade;
            return (
              <button
                key={grade}
                onClick={() => setSelectedGradeFilter(isSelected ? "all" : grade)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 border ${
                  isSelected
                    ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300"
                    : grade === "A+"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : grade === "F"
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 border-rose-200 hover:bg-rose-100"
                    : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{grade}:</span>
                <span>{toBengaliNumerals(count)} জন</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Official Print Header (Only visible on paper print) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) অনুমোদিত প্রতিষ্ঠান কোড: ২৫০১৬</p>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2">
          {selectedExamName} - পরীক্ষাভিত্তিক ফলাফল ও BTEB গ্রেড শিট ({toBengaliNumerals(academicYear)})
        </h2>
        <div className="flex justify-center gap-6 text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
          <span>শ্রেণি: {ACADEMIC_CLASSES.find((c) => c.id === selectedClassId)?.nameBangla}</span>
          {isTradeApplicable && selectedTradeId !== "all" && (
            <span>ট্রেড: {BTEB_ACADEMIC_TRADES.find((t) => String(t.id) === selectedTradeId)?.nameBangla}</span>
          )}
          <span>তারিখ: {new Date().toLocaleDateString("bn-BD")}</span>
        </div>
      </div>

      {/* The Visual Summary Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden print:border-none print:shadow-none">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">ফলাফল ও BTEB গ্রেড শিট প্রস্তুত হচ্ছে...</p>
            <p className="text-xs text-slate-400 mt-1">অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন</p>
          </div>
        ) : processedStudents.length === 0 ? (
          <div className="py-16 text-center px-4">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              এই পরীক্ষার কোনো শিক্ষার্থীর নম্বর রেকর্ড পাওয়া যায়নি
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
              নির্বাচিত পরীক্ষা &apos;{selectedExamName}&apos;-এ এখনো কোনো নম্বর এন্ট্রি করা হয়নি অথবা ফিল্টারের সাথে কোনো শিক্ষার্থী মিলেনি।
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {onNavigateToEntry && (
                <button
                  onClick={onNavigateToEntry}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  নম্বর এন্ট্রি ফরমে যান
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedGradeFilter("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                ফিল্টার রিসেট করুন
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px] text-xs">
              {/* Table Header */}
              <thead>
                <tr className="bg-slate-900 dark:bg-slate-950 text-white text-xs uppercase tracking-wider font-bold border-b border-slate-800">
                  <th className="py-3 px-3.5 text-center w-16 sticky left-0 bg-slate-900 dark:bg-slate-950 z-10">রোল</th>
                  <th className="py-3 px-3.5 min-w-[190px] sticky left-16 bg-slate-900 dark:bg-slate-950 z-10">শিক্ষার্থীর বিবরণ</th>
                  
                  {/* Subject Columns */}
                  {classSubjects.map((sub) => (
                    <th key={sub.code} className="py-3 px-3 text-center border-l border-slate-800 min-w-[130px]">
                      <div className="font-bold text-slate-100 truncate text-xs" title={sub.nameBangla}>
                        {sub.nameBangla}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {sub.code} ({toBengaliNumerals(sub.fullMarks || 100)})
                      </div>
                    </th>
                  ))}

                  {/* Aggregated Performance Columns */}
                  <th className="py-3 px-3 text-center border-l border-slate-800 bg-slate-800 dark:bg-slate-900 text-amber-300 font-bold min-w-[110px] text-xs">
                    মোট নম্বর
                  </th>
                  <th className="py-3 px-3 text-center bg-slate-800 dark:bg-slate-900 text-emerald-300 font-bold min-w-[100px] text-xs">
                    জিপিএ (GPA)
                  </th>
                  <th className="py-3 px-3 text-center bg-slate-800 dark:bg-slate-900 text-white font-bold min-w-[110px] text-xs">
                    BTEB গ্রেড
                  </th>
                  <th className="py-3 px-3 text-center bg-slate-800 dark:bg-slate-900 text-white font-bold min-w-[100px] text-xs">
                    ফলাফল
                  </th>
                  <th className="py-3 px-3 text-center bg-slate-800 dark:bg-slate-900 text-slate-300 font-bold min-w-[80px] text-xs">
                    মেধা
                  </th>
                  <th className="py-3 px-3 text-center bg-slate-800 dark:bg-slate-900 text-slate-300 font-bold min-w-[90px] text-xs print:hidden">
                    অ্যাকশন
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {processedStudents.map((stu: any, idx: number) => {
                  const isPassed = stu.resultStatus === "Passed";
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={stu.studentId}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isEven ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/30"
                      }`}
                    >
                      {/* Roll */}
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-900 dark:text-white sticky left-0 bg-inherit z-10 border-r border-slate-200 dark:border-slate-800 tabular-nums">
                        {toBengaliNumerals(stu.roll)}
                      </td>

                      {/* Student Info */}
                      <td className="py-3 px-3.5 sticky left-16 bg-inherit z-10 border-r border-slate-200 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                          {stu.nameBangla || stu.name}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          {stu.studentCode || `ID-${stu.studentId}`}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold border border-slate-200 dark:border-slate-700">
                            শাখা: {stu.section || "A"}
                          </span>
                          {stu.tradeName && stu.tradeName !== "সাধারণ" && (
                            <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded font-semibold border border-indigo-200 dark:border-indigo-800 truncate max-w-[110px]" title={stu.tradeName}>
                              {stu.tradeName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Subjects & Calculated BTEB Grades */}
                      {classSubjects.map((sub) => {
                        const markRecord = stu.marks?.find(
                          (m: any) => m.subjectCode?.toLowerCase() === sub.code?.toLowerCase()
                        );

                        if (!markRecord) {
                          return (
                            <td key={sub.code} className="py-3 px-2 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                              <span className="text-[11px] text-slate-400 font-medium">এন্ট্রি হয়নি</span>
                            </td>
                          );
                        }

                        return (
                          <td key={sub.code} className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                            <div className="flex flex-col items-center justify-center gap-1">
                              {/* Highlighted BTEB Grade Badge */}
                              <div>{renderBtebGradeBadge(markRecord.grade, markRecord.gradePoint)}</div>
                              {/* Total Obtained Marks */}
                              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                                {toBengaliNumerals(markRecord.totalMarks || 0)}
                                <span className="text-[10px] text-slate-400 font-normal">
                                  /{toBengaliNumerals(markRecord.maxMarks || 100)}
                                </span>
                              </div>
                              {/* Continuous / Practical breakdown snippet if available */}
                              {markRecord.continuousAssessment !== undefined && (
                                <div className="text-[10px] text-slate-400" title={`ধারাবাহিক: ${markRecord.continuousAssessment}, চূড়ান্ত: ${markRecord.theoryMarks || 0}`}>
                                  ধরাবাহিক: {toBengaliNumerals(markRecord.continuousAssessment)}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Total Marks */}
                      <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white bg-slate-50/60 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-mono font-bold tabular-nums">
                          {toBengaliNumerals(stu.totalMarks || 0)}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          পূর্ণ: {toBengaliNumerals(stu.maxMarks || 0)}
                        </div>
                      </td>

                      {/* GPA */}
                      <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-800">
                        <span
                          className={`text-xs font-mono font-bold tabular-nums ${
                            stu.numericGpa >= 5.0
                              ? "text-emerald-600 dark:text-emerald-400 font-black"
                              : stu.numericGpa >= 4.0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : stu.numericGpa > 0
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {toBengaliNumerals(stu.gpa || "০.০০")}
                        </span>
                      </td>

                      {/* Final Overall BTEB Grade Badge */}
                      <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-800">
                        {renderBtebGradeBadge(stu.letterGrade, stu.numericGpa)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-800">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                            isPassed
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                              : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {isPassed ? "উত্তীর্ণ" : "অনুত্তীর্ণ"}
                        </span>
                      </td>

                      {/* Merit Rank */}
                      <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                        {stu.meritPosition ? (
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold font-mono ${
                              stu.meritPosition <= 3
                                ? "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {toBengaliNumerals(stu.meritPosition)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {onNavigateToEntry && (
                            <button
                              onClick={onNavigateToEntry}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold transition-colors border border-emerald-300 dark:border-emerald-700 cursor-pointer"
                              title="এই শ্রেণির নম্বর এন্ট্রি শিট খুলুন"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>নম্বর এন্ট্রি</span>
                            </button>
                          )}
                          <button
                            onClick={() => setTranscriptTarget(stu)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                            title="মার্কশিট / ট্রান্সক্রিপ্ট দেখুন"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ট্রান্সক্রিপ্ট</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Printable Signature Lines (Print Only) */}
        <div className="hidden print:flex justify-between items-end mt-16 px-8 pt-8 border-t border-slate-300 dark:border-slate-700">
          <div className="text-center">
            <div className="w-44 border-t border-slate-700 mb-1"></div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">শ্রেণি শিক্ষক</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ</p>
          </div>
          <div className="text-center">
            <div className="w-44 border-t border-slate-700 mb-1"></div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">পরীক্ষা নিয়ন্ত্রক / প্রত্যয়নকারী</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">কারিগরি পরীক্ষা মূল্যায়ন শাখা</p>
          </div>
          <div className="text-center">
            <div className="w-44 border-t border-slate-700 mb-1"></div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">অধ্যক্ষ (ভারপ্রাপ্ত)</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ</p>
          </div>
        </div>
      </div>

      {/* Subject-Wise Performance & BTEB Grade Breakdown Cards */}
      {subjectPerformanceStats.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-5 print:hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                বিষয়ভিত্তিক BTEB গ্রেড ও পাসের পরিসংখ্যান (Subject-wise Analysis)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                প্রতিটি বিষয়ে শিক্ষার্থীদের গড় নম্বর, সর্বোচ্চ প্রাপ্ত নম্বর এবং A+ পাওয়ার হার
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              মোট বিষয়: {toBengaliNumerals(subjectPerformanceStats.length)} টি
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {subjectPerformanceStats.map((item) => (
              <div
                key={item.subject.code}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      {item.subject.nameBangla}
                    </h4>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      কোড: {item.subject.code} | পূর্ণমান: {toBengaliNumerals(item.subject.fullMarks || 100)}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      item.passRate >= 80
                        ? "bg-emerald-100 text-emerald-800"
                        : item.passRate >= 50
                        ? "bg-blue-100 text-blue-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    পাস {toBengaliNumerals(item.passRate)}%
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">পরীক্ষার্থী</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{toBengaliNumerals(item.examineesCount)} জন</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">সর্বোচ্চ নম্বর</span>
                    <span className="font-bold text-emerald-700">{toBengaliNumerals(item.highestMarks)}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">A+ পেয়েছে</span>
                    <span className="font-bold text-purple-700">{toBengaliNumerals(item.aPlusCount)} জন</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create New Exam Type */}
      {isCreateExamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">নতুন পরীক্ষার ধরন তৈরি করুন</h3>
              </div>
              <button
                onClick={() => setIsCreateExamOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  পরীক্ষার নাম (বাংলায়) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বর্ষ মধ্য পরীক্ষা ২০২৬, কুইজ টেস্ট ২০২৬"
                  value={newExamForm.nameBangla}
                  onChange={(e) => setNewExamForm({ ...newExamForm, nameBangla: e.target.value })}
                  className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  পরীক্ষার নাম (ইংরেজি)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Assessment 2026, Quiz Test 2026"
                  value={newExamForm.name}
                  onChange={(e) => setNewExamForm({ ...newExamForm, name: e.target.value })}
                  className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">টার্ম / ধরন</label>
                  <select
                    value={newExamForm.term}
                    onChange={(e) => setNewExamForm({ ...newExamForm, term: e.target.value })}
                    className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Half-Yearly">Half-Yearly (বর্ষ মধ্য / অর্ধবার্ষিক)</option>
                    <option value="Continuous">Continuous (ধারাবাহিক / কুইজ)</option>
                    <option value="Pre-Test">Pre-Test (প্রাক-নির্বাচনী)</option>
                    <option value="Model-Test">Model-Test (মডেল টেস্ট)</option>
                    <option value="Annual">Annual (বার্ষিক পরীক্ষা)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">শিক্ষাবর্ষ</label>
                  <input
                    type="number"
                    value={newExamForm.academicYear}
                    onChange={(e) => setNewExamForm({ ...newExamForm, academicYear: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">শুরুর তারিখ</label>
                  <input
                    type="date"
                    value={newExamForm.startDate}
                    onChange={(e) => setNewExamForm({ ...newExamForm, startDate: e.target.value })}
                    className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">সমাপ্তির তারিখ</label>
                  <input
                    type="date"
                    value={newExamForm.endDate}
                    onChange={(e) => setNewExamForm({ ...newExamForm, endDate: e.target.value })}
                    className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">স্ট্যাটাস</label>
                <select
                  value={newExamForm.status}
                  onChange={(e) => setNewExamForm({ ...newExamForm, status: e.target.value })}
                  className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Published">Published (ফলাফল উন্মুক্ত)</option>
                  <option value="Ongoing">Ongoing (চলমান পরীক্ষা)</option>
                  <option value="Draft">Draft (খসড়া)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsCreateExamOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition disabled:opacity-50"
                >
                  {createSubmitting ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ ও সক্রিয় করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Academic Transcript View for Selected Student */}
      {transcriptTarget && (
        <AcademicTranscriptModal
          student={transcriptTarget}
          marks={transcriptTarget.marks || []}
          examName={selectedExamName}
          academicYear={academicYear}
          institution={resultsData?.institution}
          onClose={() => setTranscriptTarget(null)}
        />
      )}
    </div>
  );
}
