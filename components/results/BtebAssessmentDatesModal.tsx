"use client";

import React, { useState } from "react";
import { Calendar, Check, Clock, X, AlertCircle, Save } from "lucide-react";
import { toBengaliNumerals } from "@/lib/utils";

export interface BtebAssessmentDatesConfig {
  quizDates: string[]; // 4 dates
  classTestDates: string[]; // 4 dates
  tcMidtermDate: string; // বর্ষমধ্য পরীক্ষা
  assignmentDate: string; // অ্যাসাইনমেন্ট
  jobDates: string[]; // 8 dates
  pcMidtermDate: string; // বর্ষমধ্য ব্যবহারিক
  reportDate: string; // রিপোর্ট
  vivaDate: string; // মৌখিক
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dates: BtebAssessmentDatesConfig;
  onSave: (updatedDates: BtebAssessmentDatesConfig) => void;
  subjectName?: string;
  classNameStr?: string;
}

export default function BtebAssessmentDatesModal({
  isOpen,
  onClose,
  dates,
  onSave,
  subjectName = "বিষয়",
  classNameStr = "নবম শ্রেণি",
}: Props) {
  const [formData, setFormData] = useState<BtebAssessmentDatesConfig>(dates);
  const [activeTab, setActiveTab] = useState<"tc" | "pc">("tc");

  if (!isOpen) return null;

  const handleQuizDateChange = (index: number, val: string) => {
    const updated = [...formData.quizDates];
    updated[index] = val;
    setFormData({ ...formData, quizDates: updated });
  };

  const handleClassTestDateChange = (index: number, val: string) => {
    const updated = [...formData.classTestDates];
    updated[index] = val;
    setFormData({ ...formData, classTestDates: updated });
  };

  const handleJobDateChange = (index: number, val: string) => {
    const updated = [...formData.jobDates];
    updated[index] = val;
    setFormData({ ...formData, jobDates: updated });
  };

  const handleQuickFillCurrentYear = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData({
      quizDates: ["2026-02-15", "2026-03-10", "2026-04-15", "2026-05-10"],
      classTestDates: ["2026-02-28", "2026-03-25", "2026-04-30", "2026-05-25"],
      tcMidtermDate: "2026-06-15",
      assignmentDate: "2026-06-05",
      jobDates: [
        "2026-01-25",
        "2026-02-08",
        "2026-02-22",
        "2026-03-08",
        "2026-03-22",
        "2026-04-05",
        "2026-04-19",
        "2026-05-03",
      ],
      pcMidtermDate: "2026-06-20",
      reportDate: "2026-06-22",
      vivaDate: "2026-06-24",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900/10 text-emerald-200 backdrop-blur-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                পরীক্ষার তারিখসমূহ নির্ধারণ (BTEB Assessment Dates)
              </h3>
              <p className="text-xs text-emerald-100">
                {classNameStr} • {subjectName} • ধারাবাহিক মূল্যায়ন রেজিস্টার
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 pt-3 gap-2 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("tc")}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === "tc"
                ? "border-emerald-600 text-emerald-800 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            ১. তাত্ত্বিক ধারাবাহিক পরীক্ষা (TC)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pc")}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === "pc"
                ? "border-emerald-600 text-emerald-800 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            ২. ব্যবহারিক ধারাবাহিক পরীক্ষা (PC)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {activeTab === "tc" ? (
            <div className="space-y-5">
              {/* Quizzes 1-4 */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40/50 rounded-xl p-4 border border-emerald-100">
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wide mb-2.5">
                  কুইজ টেস্টের তারিখ (Quiz Dates - ১ম থেকে ৪র্থ)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {toBengaliNumerals(idx + 1)}ম কুইজ:
                      </span>
                      <input
                        type="date"
                        value={formData.quizDates[idx] || ""}
                        onChange={(e) => handleQuizDateChange(idx, e.target.value)}
                        className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Class Tests 1-4 */}
              <div className="bg-blue-50 dark:bg-blue-950/40/50 rounded-xl p-4 border border-blue-100">
                <label className="block text-xs font-bold text-blue-900 uppercase tracking-wide mb-2.5">
                  ক্লাস টেস্টের তারিখ (Class Test Dates - ১ম থেকে ৪র্থ)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {toBengaliNumerals(idx + 1)}ম ক্লাস টেস্ট:
                      </span>
                      <input
                        type="date"
                        value={formData.classTestDates[idx] || ""}
                        onChange={(e) => handleClassTestDateChange(idx, e.target.value)}
                        className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mid-term and Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-amber-50 dark:bg-amber-950/40/60 rounded-xl p-4 border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900 mb-1.5">
                    বর্ষমধ্য পরীক্ষার তারিখ (Theory Mid-term Exam)
                  </label>
                  <p className="text-[11px] text-amber-700 mb-2">
                    তত্ত্বীয় বর্ষমধ্য পরীক্ষা গ্রহণের নির্দিষ্ট তারিখ
                  </p>
                  <input
                    type="date"
                    value={formData.tcMidtermDate || ""}
                    onChange={(e) => setFormData({ ...formData, tcMidtermDate: e.target.value })}
                    className="w-full text-xs border border-amber-300 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/40/60 rounded-xl p-4 border border-purple-200">
                  <label className="block text-xs font-bold text-purple-900 mb-1.5">
                    অ্যাসাইনমেন্ট জমা/মূল্যায়নের তারিখ (Assignment Date)
                  </label>
                  <p className="text-[11px] text-purple-700 mb-2">
                    শিক্ষার্থীদের নির্ধারিত বিষয়ভিত্তিক অ্যাসাইনমেন্ট জমার তারিখ
                  </p>
                  <input
                    type="date"
                    value={formData.assignmentDate || ""}
                    onChange={(e) => setFormData({ ...formData, assignmentDate: e.target.value })}
                    className="w-full text-xs border border-purple-300 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Jobs 1-8 */}
              <div className="bg-teal-50/50 rounded-xl p-4 border border-teal-100">
                <label className="block text-xs font-bold text-teal-900 uppercase tracking-wide mb-2.5">
                  ব্যবহারিক জব / এক্সপেরিমেন্ট তারিখ (Practical Jobs 1 - 8)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {toBengaliNumerals(idx + 1)}ম জব:
                      </span>
                      <input
                        type="date"
                        value={formData.jobDates[idx] || ""}
                        onChange={(e) => handleJobDateChange(idx, e.target.value)}
                        className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mid-term Practical, Report, Viva */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-amber-50 dark:bg-amber-950/40/60 rounded-xl p-3.5 border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    বর্ষমধ্য ব্যবহারিক পরীক্ষা
                  </label>
                  <input
                    type="date"
                    value={formData.pcMidtermDate || ""}
                    onChange={(e) => setFormData({ ...formData, pcMidtermDate: e.target.value })}
                    className="w-full text-xs border border-amber-300 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-950/40/60 rounded-xl p-3.5 border border-indigo-200">
                  <label className="block text-xs font-bold text-indigo-900 mb-1">
                    ব্যবহারিক রিপোর্ট / খাতা জমা
                  </label>
                  <input
                    type="date"
                    value={formData.reportDate || ""}
                    onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                    className="w-full text-xs border border-indigo-300 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="bg-rose-50 dark:bg-rose-950/40/60 rounded-xl p-3.5 border border-rose-200">
                  <label className="block text-xs font-bold text-rose-900 mb-1">
                    মৌখিক পরীক্ষা (Viva)
                  </label>
                  <input
                    type="date"
                    value={formData.vivaDate || ""}
                    onChange={(e) => setFormData({ ...formData, vivaDate: e.target.value })}
                    className="w-full text-xs border border-rose-300 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleQuickFillCurrentYear}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-700 underline font-medium"
            >
              ২০২৬ শিক্ষাবর্ষের আদর্শ রুটিন তারিখ অটো-ফিল করুন
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
              >
                <Save className="w-3.5 h-3.5" />
                তারিখসমূহ সেভ করুন
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
