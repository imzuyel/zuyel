"use client";

import React, { useState, useMemo } from "react";
import {
  Award,
  Search,
  Plus,
  Filter,
  Calendar,
  Clock,
  Layers,
  CheckCircle2,
  Lock,
  Unlock,
  Sliders,
  ChevronRight,
  BookOpen,
  ArrowRight,
  BarChart3,
  Sparkles,
  Users,
  Building,
  FileSpreadsheet,
} from "lucide-react";
import { ExamMaster, AssessmentCategory, ExamStatus } from "@/lib/examinationEngine";
import { toBengaliNumerals } from "@/lib/utils";
import ExamStatusModal from "./ExamStatusModal";

interface ExamDirectoryViewProps {
  exams: ExamMaster[];
  onCreateClick: () => void;
  onOpenMarksWorkspace: (examId: number) => void;
  onOpenSchedule: (examId: number) => void;
  onExamUpdated: (updatedExam: ExamMaster) => void;
}

export default function ExamDirectoryView({
  exams,
  onCreateClick,
  onOpenMarksWorkspace,
  onOpenSchedule,
  onExamUpdated,
}: ExamDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<AssessmentCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<ExamStatus | "all">("all");
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Status Change Modal State
  const [modalExam, setModalExam] = useState<ExamMaster | null>(null);

  // Filtered Exams
  const filteredExams = useMemo(() => {
    let list = [...exams];

    if (selectedYear) {
      list = list.filter((e) => e.academicYear === selectedYear);
    }
    if (selectedCategory !== "all") {
      list = list.filter((e) => e.category === selectedCategory);
    }
    if (selectedStatus !== "all") {
      list = list.filter((e) => e.status === selectedStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.nameBangla.includes(q) ||
          e.code.toLowerCase().includes(q) ||
          e.term.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [exams, selectedYear, selectedCategory, selectedStatus, searchQuery]);

  // Overall Live Metrics
  const metrics = useMemo(() => {
    const total = exams.length;
    const ongoing = exams.filter((e) => e.status === "Ongoing" || e.status === "MarksEntry").length;
    const completed = exams.filter((e) => e.status === "Completed" || e.status === "Locked").length;
    const locked = exams.filter((e) => e.isLocked).length;

    const totalSubs = exams.reduce((acc, e) => acc + (e.subjects?.length || 0), 0);
    const submittedSubs = exams.reduce(
      (acc, e) => acc + (e.subjects?.filter((s) => s.isMarksSubmitted).length || 0),
      0
    );
    const overallRate = totalSubs > 0 ? Math.round((submittedSubs / totalSubs) * 100) : 0;

    return { total, ongoing, completed, locked, totalSubs, submittedSubs, overallRate };
  }, [exams]);

  const getStatusBadge = (status: ExamStatus, isLocked: boolean) => {
    if (isLocked) {
      return {
        label: "লককৃত (Locked)",
        classes: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
      };
    }
    switch (status) {
      case "Draft":
        return {
          label: "খসড়া (Draft)",
          classes: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
        };
      case "Published":
        return {
          label: "ঘোষিত (Published)",
          classes: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300",
        };
      case "Ongoing":
        return {
          label: "চলমান (Ongoing)",
          classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300",
        };
      case "MarksEntry":
        return {
          label: "নম্বর এন্ট্রি উন্মুক্ত",
          classes: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300",
        };
      case "UnderReview":
        return {
          label: "যাচাইকরণাধীন",
          classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300",
        };
      case "Completed":
        return {
          label: "সমাপ্ত (Completed)",
          classes: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300",
        };
      default:
        return {
          label: status,
          classes: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
        };
    }
  };

  const getCategoryLabel = (category: AssessmentCategory) => {
    switch (category) {
      case "term":
        return "টার্ম পরীক্ষা";
      case "periodic":
        return "সাময়িক ও ক্লাস টেস্ট";
      case "practical_skills":
        return "ব্যবহারিক ও ল্যাব দক্ষতা";
      case "coursework":
        return "কোর্সওয়ার্ক ও অ্যাসাইনমেন্ট";
      default:
        return "অন্যান্য মূল্যায়ন";
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">সর্বমোট পরীক্ষা</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {toBengaliNumerals(metrics.total)} টি
            </span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
              চলমান ও এন্ট্রি চলছে
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {toBengaliNumerals(metrics.ongoing)} টি
            </span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-teal-600 dark:text-teal-400 font-bold block">
              মূল্যায়ন সমাপ্ত
            </span>
            <span className="text-xl font-black text-teal-600 dark:text-teal-400">
              {toBengaliNumerals(metrics.completed)} টি
            </span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">চূড়ান্ত লককৃত</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {toBengaliNumerals(metrics.locked)} টি
            </span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-blue-900/10 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200/60 dark:border-indigo-800/40 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-bold block">
              নম্বর এন্ট্রি অগ্রগতি
            </span>
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
              {toBengaliNumerals(metrics.overallRate)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Filter & Action Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              সকল পরীক্ষা ও অ্যাসেসমেন্ট তালিকা ({toBengaliNumerals(filteredExams.length)} টি)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              কারিগরি শিক্ষাক্রমের টার্ম, ক্লাস টেস্ট, প্র্যাকটিক্যাল ল্যাব ও অ্যাসাইনমেন্ট পরিচালনা করুন
            </p>
          </div>

          <button
            onClick={onCreateClick}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন পরীক্ষা তৈরি করুন</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>ক্যাটাগরি:</span>
          </span>

          {[
            { id: "all", label: "সকল মূল্যায়ন" },
            { id: "term", label: "টার্ম পরীক্ষা" },
            { id: "periodic", label: "ক্লাস টেস্ট / মাসিক" },
            { id: "practical_skills", label: "ব্যবহারিক ও ল্যাব" },
            { id: "coursework", label: "কোর্সওয়ার্ক ও প্রজেক্ট" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পরীক্ষার নাম বা কোড দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            >
              <option value="all">সকল অবস্থা (All Status)</option>
              <option value="Draft">Draft (খসড়া)</option>
              <option value="Published">Published (ঘোষিত)</option>
              <option value="Ongoing">Ongoing (চলমান)</option>
              <option value="MarksEntry">MarksEntry (নম্বর এন্ট্রি উন্মুক্ত)</option>
              <option value="Completed">Completed (মূল্যায়ন সমাপ্ত)</option>
              <option value="Locked">Locked (লককৃত)</option>
            </select>
          </div>

          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            >
              <option value={2026}>২০২৬ শিক্ষাবর্ষ</option>
              <option value={2025}>২০২৫ শিক্ষাবর্ষ</option>
              <option value={2027}>২০২৭ শিক্ষাবর্ষ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExams.map((exam) => {
          const badge = getStatusBadge(exam.status, exam.isLocked);
          const totalSubs = exam.subjects?.length || 0;
          const submittedSubs = exam.subjects?.filter((s) => s.isMarksSubmitted).length || 0;
          const progressPercent = totalSubs > 0 ? Math.round((submittedSubs / totalSubs) * 100) : 0;

          return (
            <div
              key={exam.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Card Top Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-bold">
                      {exam.code}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      {getCategoryLabel(exam.category)}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.classes}`}
                  >
                    {exam.isLocked && <Lock className="w-3 h-3" />}
                    <span>{badge.label}</span>
                  </span>
                </div>

                {/* Exam Title */}
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
                  {exam.nameBangla}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {exam.name}
                </p>

                {/* Date & Deadline info */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">পরীক্ষার সময়কাল</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                      {exam.startDate} - {exam.endDate}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">নম্বর জমার শেষ তারিখ</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-[11px]">
                      {exam.marksSubmissionDeadline}
                    </span>
                  </div>
                </div>

                {/* Progress Bar for Marks Entry */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">
                      নম্বর এন্ট্রি অগ্রগতি ({toBengaliNumerals(submittedSubs)} / {toBengaliNumerals(totalSubs)} বিষয়)
                    </span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400">
                      {toBengaliNumerals(progressPercent)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setModalExam(exam)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>স্ট্যাটাস</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenSchedule(exam.id)}
                    className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>রুটিন</span>
                  </button>

                  <button
                    onClick={() => onOpenMarksWorkspace(exam.id)}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                  >
                    <span>নম্বর এন্ট্রি</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Exam Status Modal */}
      {modalExam && (
        <ExamStatusModal
          exam={modalExam}
          isOpen={!!modalExam}
          onClose={() => setModalExam(null)}
          onSuccess={(updated) => {
            onExamUpdated(updated);
            setModalExam(null);
          }}
        />
      )}
    </div>
  );
}
