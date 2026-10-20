"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Plus,
  Layers,
  Clock,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Sliders,
  Wand2,
  FileText,
} from "lucide-react";
import { ExamMaster } from "@/lib/examinationEngine";
import ExamDirectoryView from "./ExamDirectoryView";
import ExamCreationWizard from "./ExamCreationWizard";
import ExamMarkEntryWorkspace from "./ExamMarkEntryWorkspace";
import ExamScheduleTimetable from "./ExamScheduleTimetable";
import ExamAuditTrailView from "./ExamAuditTrailView";
import WrittenQuestionPaperBuilder from "./WrittenQuestionPaperBuilder";

export default function ExaminationManagementView() {
  const [activeTab, setActiveTab] = useState<
    "directory" | "wizard" | "marks" | "schedule" | "written_question" | "class_routine" | "audit"
  >("directory");

  const [exams, setExams] = useState<ExamMaster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedExamId, setSelectedExamId] = useState<number | undefined>(undefined);
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch all exams from API
  const fetchExams = async () => {
    try {
      const res = await fetch("/api/examination/exams?metrics=true");
      if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) {
        console.warn("Non-JSON or error response from /api/examination/exams");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setExams(data.exams || []);
      }
    } catch (err) {
      console.error("Error fetching exams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleOpenMarksWorkspace = (examId: number) => {
    setSelectedExamId(examId);
    setActiveTab("marks");
  };

  const handleOpenSchedule = (examId: number) => {
    setSelectedExamId(examId);
    setActiveTab("schedule");
  };

  const handleWizardSuccess = (newExam: ExamMaster) => {
    setExams((prev) => [newExam, ...prev]);
    setSelectedExamId(newExam.id);
    setActiveTab("directory");
    setNotification(`নতুন পরীক্ষা '${newExam.nameBangla}' সফলভাবে সংযুক্ত ও ঘোষিত হয়েছে।`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleExamUpdated = (updated: ExamMaster) => {
    setExams((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setNotification(`পরীক্ষা '${updated.nameBangla}' এর তথ্য সফলভাবে আপডেট হয়েছে।`);
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
              <Award className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-black">
                  PHASE 7 • BTEB COMPLIANT
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                উন্নত পরীক্ষা ও সামগ্রিক মূল্যায়ন ব্যবস্থাপনা (Examination & Assessment)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            {activeTab !== "wizard" && (
              <button
                onClick={() => setActiveTab("wizard")}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন পরীক্ষা উইজার্ড</span>
              </button>
            )}

            <button
              onClick={fetchExams}
              className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="রিফ্রেশ"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          {[
            { id: "directory", label: "পরীক্ষা ড্যাশবোর্ড ও তালিকা", icon: Layers },
            { id: "written_question", label: "লিখিত প্রশ্নপত্র বিল্ডার (Question Studio)", icon: FileText },
            { id: "wizard", label: "নতুন পরীক্ষা তৈরি উইজার্ড", icon: Wand2 },
            { id: "marks", label: "নম্বর প্রদান ও মূল্যায়ন ওয়ার্কস্পেস", icon: Award },
            { id: "schedule", label: "পরীক্ষার রুটিন ও সিট প্ল্যান", icon: Calendar },
            { id: "audit", label: "অডিট ও সংশোধন লগ", icon: ShieldCheck },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Notification */}
      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{notification}</span>
        </div>
      )}

      {/* Active Tab Submodule Render */}
      {activeTab === "written_question" && <WrittenQuestionPaperBuilder />}

      {activeTab === "directory" && (
        <ExamDirectoryView
          exams={exams}
          onCreateClick={() => setActiveTab("wizard")}
          onOpenMarksWorkspace={handleOpenMarksWorkspace}
          onOpenSchedule={handleOpenSchedule}
          onExamUpdated={handleExamUpdated}
        />
      )}

      {activeTab === "wizard" && (
        <ExamCreationWizard
          onSuccess={handleWizardSuccess}
          onCancel={() => setActiveTab("directory")}
        />
      )}

      {activeTab === "marks" && (
        <ExamMarkEntryWorkspace
          exams={exams}
          initialExamId={selectedExamId}
          onRefreshExams={fetchExams}
        />
      )}

      {activeTab === "schedule" && (
        <ExamScheduleTimetable
          exams={exams}
          initialExamId={selectedExamId}
        />
      )}



      {activeTab === "audit" && <ExamAuditTrailView />}
    </div>
  );
}
