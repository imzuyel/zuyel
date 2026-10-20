"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Layers,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Save,
  Wand2,
  Users,
  Building,
  Info,
  Sliders,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { ACADEMIC_CLASSES, ALL_TRADES, doesClassHaveTrade } from "@/lib/academicStructure";
import * as subjectEngine from "@/lib/subjectEngine";
import { institutionalDb } from "@/lib/database";
import {
  AssessmentCategory,
  AssessmentType,
  ExamMaster,
  ExamSubjectConfig,
  ExamComponentRule,
} from "@/lib/examinationEngine";
import { toBengaliNumerals } from "@/lib/utils";

interface ExamCreationWizardProps {
  onSuccess: (exam: ExamMaster) => void;
  onCancel: () => void;
}

export default function ExamCreationWizard({ onSuccess, onCancel }: ExamCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Basic Info
  const [name, setName] = useState<string>("Half Yearly Examination 2026");
  const [nameBangla, setNameBangla] = useState<string>("অর্ধবার্ষিক মূল্যায়ন ২০২৬");
  const [academicYear, setAcademicYear] = useState<number>(2026);
  const [term, setTerm] = useState<string>("Half-Yearly");
  const [category, setCategory] = useState<AssessmentCategory>("term");
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("Half-Yearly");
  const [startDate, setStartDate] = useState<string>("2026-06-10");
  const [endDate, setEndDate] = useState<string>("2026-06-25");
  const [marksSubmissionDeadline, setMarksSubmissionDeadline] = useState<string>("2026-06-30");
  const [description, setDescription] = useState<string>(
    "প্রাতিষ্ঠানিক অর্ধবার্ষিক মূল্যায়ন ও কারিগরি বোর্ডের প্রস্তুতি পরীক্ষা।"
  );
  const [instructions, setInstructions] = useState<string>(
    "সকল শিক্ষককে নির্ধারিত সময়সীমার মধ্যে নম্বরপত্র ও ব্যবহারিক মূল্যায়ন চূড়ান্ত করার নির্দেশ দেওয়া হলো।"
  );

  // Step 2: Target Classes & Trades
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([4, 5]); // Default Class 9, 10
  const [selectedTradeIds, setSelectedTradeIds] = useState<number[]>([1, 2, 3, 4]);
  const [selectedSections, setSelectedSections] = useState<string[]>(["A", "B"]);

  // Step 3: Subject & Component Configuration
  const [configuredSubjects, setConfiguredSubjects] = useState<ExamSubjectConfig[]>([]);

  // Step 4: Schedule Information (initialized when entering Step 4)
  // Step 5: Verification & Rules
  const [gradingStandard, setGradingStandard] = useState<"BTEB" | "GENERAL">("BTEB");
  const [allowTeacherMarksEntry, setAllowTeacherMarksEntry] = useState<boolean>(true);
  const [initialStatus, setInitialStatus] = useState<"Draft" | "Published">("Published");

  // Generate Suggested Subjects on entering Step 3
  const generateSubjectList = () => {
    const list: ExamSubjectConfig[] = [];

    selectedClassIds.forEach((classId) => {
      const cls = ACADEMIC_CLASSES.find((c) => c.id === classId);
      if (!cls) return;

      const mappings = subjectEngine.getSubjectMappings(cls.id);

      if (mappings && mappings.length > 0) {
        mappings.forEach((m) => {
          let fullMarks = m.fullMarks || 100;
          let passMarks = m.passMarks || 33;
          let theoryMax = m.theoryMarks || (m.subjectType.includes("Practical") ? 0 : fullMarks);
          let practicalMax = m.practicalMarks || (m.subjectType.includes("Practical") ? fullMarks : 0);
          let vivaMax = m.vivaMarks || 0;
          let continuousMax = m.continuousMarks || 0;

          if (category === "periodic") {
            fullMarks = 25;
            passMarks = 10;
            theoryMax = 25;
            practicalMax = 0;
            vivaMax = 0;
            continuousMax = 0;
          } else if (category === "practical_skills") {
            fullMarks = 50;
            passMarks = 20;
            theoryMax = 0;
            practicalMax = 40;
            vivaMax = 10;
            continuousMax = 0;
          }

          const instructor =
            institutionalDb.faculty.find((f) => f.tradeCode === m.tradeCode) || institutionalDb.faculty[1];

          list.push({
            id: `new_${classId}_${m.tradeId || 0}_${m.subjectCode}`,
            examId: 0,
            classId,
            className: cls.name,
            tradeId: m.tradeId,
            tradeCode: m.tradeCode,
            tradeName: m.tradeName,
            subjectCode: m.subjectCode,
            subjectName: m.subjectName,
            subjectNameBangla: m.subjectNameBangla,
            componentRule: {
              hasTheory: theoryMax > 0,
              theoryMax,
              theoryPass: Math.round(theoryMax * 0.33),
              hasPractical: practicalMax > 0,
              practicalMax,
              practicalPass: Math.round(practicalMax * 0.33),
              hasViva: vivaMax > 0,
              vivaMax,
              vivaPass: Math.round(vivaMax * 0.33),
              hasContinuous: continuousMax > 0,
              continuousMax,
              continuousPass: Math.round(continuousMax * 0.33),
              fullMarks,
              passMarks,
              requireSeparatePass: true,
            },
            evaluatorTeacherId: instructor?.id,
            evaluatorTeacherName: instructor?.name,
            scheduleDate: startDate,
            startTime: "10:00 AM",
            endTime: "01:00 PM",
            durationMinutes: category === "periodic" ? 45 : 180,
            roomNo: m.subjectType.includes("Practical") ? "Lab 202" : "Room 101, 102",
            invigilatorNames: [institutionalDb.faculty[2]?.name || "Engr. Mahmuda Begum"],
          });
        });
      }
    });

    setConfiguredSubjects(list);
  };

  // Toggle Class selection
  const handleToggleClass = (classId: number) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  // Toggle Trade selection
  const handleToggleTrade = (tradeId: number) => {
    setSelectedTradeIds((prev) =>
      prev.includes(tradeId) ? prev.filter((id) => id !== tradeId) : [...prev, tradeId]
    );
  };

  // Move to Next Step
  const handleNext = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!name || !nameBangla) {
        setErrorMessage("অনুগ্রহ করে পরীক্ষার ইংরেজি ও বাংলা নাম সঠিকভাবে লিখুন।");
        return;
      }
      if (!startDate || !endDate) {
        setErrorMessage("অনুগ্রহ করে পরীক্ষার শুরু ও সমাপ্তির তারিখ নির্বাচন করুন।");
        return;
      }
    }

    if (currentStep === 2) {
      if (selectedClassIds.length === 0) {
        setErrorMessage("কমপক্ষে একটি শ্রেণি নির্বাচন করতে হবে।");
        return;
      }
      // Populate subjects for Step 3
      if (configuredSubjects.length === 0) {
        generateSubjectList();
      }
    }

    if (currentStep === 3) {
      if (configuredSubjects.length === 0) {
        setErrorMessage("কোনো বিষয় যুক্ত করা হয়নি।");
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit Wizard
  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        name,
        nameBangla,
        academicYear,
        term,
        category,
        assessmentType,
        targetClassIds: selectedClassIds,
        targetTradeIds: selectedTradeIds,
        targetSections: selectedSections,
        startDate,
        endDate,
        marksSubmissionDeadline,
        status: initialStatus,
        gradingStandard,
        allowTeacherMarksEntry,
        description,
        instructions,
        subjects: configuredSubjects,
        operator: "Exam Controller (Admin)",
      };

      const res = await fetch("/api/examination/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "পরীক্ষা তৈরি ব্যর্থ হয়েছে।");
      }

      onSuccess(data.exam);
    } catch (err: any) {
      setErrorMessage(err.message || "ত্রুটি ঘটেছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
      {/* Wizard Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-900/10 via-slate-900/5 to-purple-900/10 dark:from-indigo-950/40 dark:to-slate-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
              <Wand2 className="w-3.5 h-3.5" />
              <span>পরীক্ষা ও মূল্যায়ন প্রস্তুতকরণ উইজার্ড (Multi-Step Creation Wizard)</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              নতুন পরীক্ষা / অ্যাসেসমেন্ট যুক্ত করুন
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              কারিগরি শিক্ষাক্রম ও বোর্ড নীতিমালা অনুসারে সম্পূর্ণ পরীক্ষার রূপরেখা প্রণয়ন করুন
            </p>
          </div>

          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            বাতিল করুন
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="mt-6">
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold">
            {[
              { num: 1, label: "সাধারণ তথ্য", labelEn: "Basic Info" },
              { num: 2, label: "শ্রেণি ও ট্রেড", labelEn: "Scope" },
              { num: 3, label: "বিষয় ও নম্বর বিন্যাস", labelEn: "Subjects" },
              { num: 4, label: "রুটিন ও হল", labelEn: "Schedule" },
              { num: 5, label: "যাচাই ও চূড়ান্তকরণ", labelEn: "Verify" },
            ].map((s) => (
              <div
                key={s.num}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${
                  currentStep === s.num
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : currentStep > s.num
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    currentStep === s.num
                      ? "bg-white dark:bg-slate-900 text-indigo-600"
                      : currentStep > s.num
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {s.num}
                </span>
                <span className="text-[11px] truncate max-w-[100px]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mx-6 mt-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center gap-3 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Wizard Body Content */}
      <div className="p-6">
        {/* STEP 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  পরীক্ষার নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  value={nameBangla}
                  onChange={(e) => setNameBangla(e.target.value)}
                  placeholder="যেমন: অর্ধবার্ষিক মূল্যায়ন ২০২৬"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  পরীক্ষার নাম (English) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Half Yearly Examination 2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  একাডেমিক শিক্ষাবর্ষ *
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value={2026}>২০২৬ (বর্তমান শিক্ষাবর্ষ)</option>
                  <option value={2027}>২০২৭ (আগামী শিক্ষাবর্ষ)</option>
                  <option value={2025}>২০২৫ (পূর্ববর্তী)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  মূল্যায়নের বিভাগ (Category) *
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const val = e.target.value as AssessmentCategory;
                    setCategory(val);
                    if (val === "term") setAssessmentType("Half-Yearly");
                    else if (val === "periodic") setAssessmentType("Class-Test");
                    else if (val === "practical_skills") setAssessmentType("Practical");
                    else if (val === "coursework") setAssessmentType("Assignment");
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="term">টার্ম পরীক্ষা (Half-Yearly, Annual, Midterm, Model Test)</option>
                  <option value="periodic">সাময়িক ও ক্লাস টেস্ট (Monthly Exam, Class Test, Weekly)</option>
                  <option value="practical_skills">ব্যবহারিক ও ল্যাব দক্ষতা (Practical, Viva, Lab Skills)</option>
                  <option value="coursework">ধারাবাহিক কোর্সওয়ার্ক (Assignment, Project, Internship)</option>
                  <option value="other">অন্যান্য কাস্টম মূল্যায়ন</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  মূল্যায়নের ধরন (Assessment Type) *
                </label>
                <select
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value as AssessmentType)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {category === "term" && (
                    <>
                      <option value="Half-Yearly">অর্ধবার্ষিক মূল্যায়ন (Half-Yearly)</option>
                      <option value="Annual">বার্ষিক মূল্যায়ন (Annual Exam)</option>
                      <option value="Mid-Term">পর্বমধ্য পরীক্ষা (Mid-Term)</option>
                      <option value="Model-Test">মডেল টেস্ট (Model Test)</option>
                      <option value="Pre-Test">প্রাক-নির্বাচনী পরীক্ষা (Pre-Test)</option>
                    </>
                  )}
                  {category === "periodic" && (
                    <>
                      <option value="Class-Test">ক্লাস টেস্ট (Class Test)</option>
                      <option value="Monthly">মাসিক পরীক্ষা (Monthly Exam)</option>
                      <option value="Weekly-Test">সাপ্তাহিক কুইজ টেস্ট (Weekly Test)</option>
                    </>
                  )}
                  {category === "practical_skills" && (
                    <>
                      <option value="Practical">ব্যবহারিক ল্যাব পরীক্ষা (Practical Exam)</option>
                      <option value="Viva">মৌখিক / ভাইভা (Viva / Oral)</option>
                      <option value="Lab-Performance">ল্যাব কর্মদক্ষতা (Lab Performance)</option>
                    </>
                  )}
                  {category === "coursework" && (
                    <>
                      <option value="Assignment">অ্যাসাইনমেন্ট মূল্যায়ন (Assignment)</option>
                      <option value="Project">কারিগরি উদ্ভাবনী প্রজেক্ট (Project Work)</option>
                      <option value="Continuous-Assessment">ধারাবাহিক সার্বিক মূল্যায়ন (Continuous)</option>
                      <option value="Industrial-Attachment">শিল্প সংযুক্তি ইন্টার্নশিপ (Attachment)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    শুরুর তারিখ *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    সমাপ্তির তারিখ *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                শিক্ষকদের নম্বর প্রদানের শেষ সময়সীমা (Submission Deadline)
              </label>
              <input
                type="date"
                value={marksSubmissionDeadline}
                onChange={(e) => setMarksSubmissionDeadline(e.target.value)}
                className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                পরীক্ষা সংক্রান্ত বিবরণ ও নির্দেশাবলি
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="পরীক্ষার সাধারণ লক্ষ্য ও নির্দেশাবলি লিখুন..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Scope (Classes & Trades) */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                লক্ষ্য শ্রেণি নির্বাচন করুন (Target Classes)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                যে সকল শ্রেণির জন্য এই পরীক্ষা প্রযোজ্য হবে তা নির্বাচন করুন
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ACADEMIC_CLASSES.map((cls) => {
                  const isSelected = selectedClassIds.includes(cls.id);
                  return (
                    <div
                      key={cls.id}
                      onClick={() => handleToggleClass(cls.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20"
                          : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center ${
                            isSelected ? "bg-indigo-600 text-white" : "border border-slate-400"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {cls.nameBangla}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {cls.tier} • আসন: {cls.totalSeats}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          cls.hasTrade
                            ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {cls.hasTrade ? "কারিগরি ট্রেড" : "সাধারণ"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vocational Trades filter (if classes 4..7 selected) */}
            {selectedClassIds.some((id) => id >= 4) && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  ভোকেশনাল কারিগরি ট্রেডসমূহ (Vocational Trades)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  কারিগরি শাখার জন্য প্রযোজ্য ট্রেড নির্বাচন করুন
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {ALL_TRADES.slice(0, 4).map((t) => {
                    const isSelected = selectedTradeIds.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleToggleTrade(t.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? "bg-cyan-50/70 dark:bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/20"
                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center ${
                            isSelected ? "bg-cyan-600 text-white" : "border border-slate-400"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {t.nameBangla}
                          </span>
                          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
                            {t.code}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Subject & Component Matrix */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  নির্বাচিত বিষয় ও নম্বর বণ্টন রূপরেখা ({configuredSubjects.length} টি বিষয়)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  প্রতিটি বিষয়ের তাত্ত্বিক, ব্যবহারিক ও ধারাবাহিক মূল্যায়নের পূর্ণমান এবং পরীক্ষক শিক্ষক নির্ধারণ করুন
                </p>
              </div>

              <button
                onClick={generateSubjectList}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>পাঠ্যক্রম থেকে বিষয় পুনর্লোড</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">শ্রেণি ও বিষয়</th>
                    <th className="p-3 text-center">পূর্ণমান</th>
                    <th className="p-3 text-center">তাত্ত্বিক (Theory)</th>
                    <th className="p-3 text-center">ব্যবহারিক (Practical)</th>
                    <th className="p-3 text-center">মৌখিক (Viva)</th>
                    <th className="p-3 text-center">ধারাবাহিক (Cont.)</th>
                    <th className="p-3">মূল্যায়নকারী শিক্ষক</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {configuredSubjects.map((sub, idx) => (
                    <tr key={sub.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/60 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {sub.subjectNameBangla}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {sub.className} • কোড: {sub.subjectCode} {sub.tradeCode ? `(${sub.tradeCode})` : ""}
                        </span>
                      </td>

                      <td className="p-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                        {sub.componentRule.fullMarks}
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="number"
                          value={sub.componentRule.theoryMax}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...configuredSubjects];
                            updated[idx].componentRule.theoryMax = val;
                            updated[idx].componentRule.hasTheory = val > 0;
                            updated[idx].componentRule.theoryPass = Math.round(val * 0.33);
                            updated[idx].componentRule.fullMarks =
                              val +
                              updated[idx].componentRule.practicalMax +
                              updated[idx].componentRule.vivaMax +
                              updated[idx].componentRule.continuousMax;
                            setConfiguredSubjects(updated);
                          }}
                          className="w-16 px-2 py-1 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="number"
                          value={sub.componentRule.practicalMax}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...configuredSubjects];
                            updated[idx].componentRule.practicalMax = val;
                            updated[idx].componentRule.hasPractical = val > 0;
                            updated[idx].componentRule.practicalPass = Math.round(val * 0.33);
                            updated[idx].componentRule.fullMarks =
                              updated[idx].componentRule.theoryMax +
                              val +
                              updated[idx].componentRule.vivaMax +
                              updated[idx].componentRule.continuousMax;
                            setConfiguredSubjects(updated);
                          }}
                          className="w-16 px-2 py-1 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="number"
                          value={sub.componentRule.vivaMax}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...configuredSubjects];
                            updated[idx].componentRule.vivaMax = val;
                            updated[idx].componentRule.hasViva = val > 0;
                            updated[idx].componentRule.vivaPass = Math.round(val * 0.33);
                            updated[idx].componentRule.fullMarks =
                              updated[idx].componentRule.theoryMax +
                              updated[idx].componentRule.practicalMax +
                              val +
                              updated[idx].componentRule.continuousMax;
                            setConfiguredSubjects(updated);
                          }}
                          className="w-16 px-2 py-1 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="number"
                          value={sub.componentRule.continuousMax}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...configuredSubjects];
                            updated[idx].componentRule.continuousMax = val;
                            updated[idx].componentRule.hasContinuous = val > 0;
                            updated[idx].componentRule.continuousPass = Math.round(val * 0.33);
                            updated[idx].componentRule.fullMarks =
                              updated[idx].componentRule.theoryMax +
                              updated[idx].componentRule.practicalMax +
                              updated[idx].componentRule.vivaMax +
                              val;
                            setConfiguredSubjects(updated);
                          }}
                          className="w-16 px-2 py-1 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                        />
                      </td>

                      <td className="p-3">
                        <select
                          value={sub.evaluatorTeacherId || ""}
                          onChange={(e) => {
                            const teacherId = Number(e.target.value);
                            const teacher = institutionalDb.faculty.find((f) => f.id === teacherId);
                            const updated = [...configuredSubjects];
                            updated[idx].evaluatorTeacherId = teacherId;
                            updated[idx].evaluatorTeacherName = teacher?.name;
                            setConfiguredSubjects(updated);
                          }}
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        >
                          <option value="">শিক্ষক নির্বাচন...</option>
                          {institutionalDb.faculty.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.designation})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 4: Timetable & Room Allocation */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
              <Clock className="w-5 h-5 shrink-0 text-amber-600" />
              <div>
                <span className="font-bold">সময়সূচি ও পরীক্ষার হল বণ্টন:</span>
                <span> প্রতিটি বিষয়ের জন্য তারিখ, সময় ও কক্ষ নম্বর নির্ধারণ করুন।</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">বিষয় ও শ্রেণি</th>
                    <th className="p-3">পরীক্ষার তারিখ</th>
                    <th className="p-3">সময়সূচি</th>
                    <th className="p-3">পরীক্ষার কক্ষ / ল্যাব</th>
                    <th className="p-3">হল পরিদর্শক (Invigilator)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {configuredSubjects.map((sub, idx) => (
                    <tr key={sub.id || idx}>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {sub.subjectNameBangla}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {sub.className} • {sub.subjectCode}
                        </span>
                      </td>

                      <td className="p-3">
                        <input
                          type="date"
                          value={sub.scheduleDate || startDate}
                          onChange={(e) => {
                            const updated = [...configuredSubjects];
                            updated[idx].scheduleDate = e.target.value;
                            setConfiguredSubjects(updated);
                          }}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </td>

                      <td className="p-3">
                        <input
                          type="text"
                          value={sub.startTime || "10:00 AM - 01:00 PM"}
                          onChange={(e) => {
                            const updated = [...configuredSubjects];
                            updated[idx].startTime = e.target.value;
                            setConfiguredSubjects(updated);
                          }}
                          placeholder="10:00 AM - 01:00 PM"
                          className="w-36 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                        />
                      </td>

                      <td className="p-3">
                        <input
                          type="text"
                          value={sub.roomNo || "Room 101"}
                          onChange={(e) => {
                            const updated = [...configuredSubjects];
                            updated[idx].roomNo = e.target.value;
                            setConfiguredSubjects(updated);
                          }}
                          className="w-32 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                        />
                      </td>

                      <td className="p-3">
                        <input
                          type="text"
                          value={sub.invigilatorNames?.[0] || ""}
                          onChange={(e) => {
                            const updated = [...configuredSubjects];
                            updated[idx].invigilatorNames = [e.target.value];
                            setConfiguredSubjects(updated);
                          }}
                          placeholder="শিক্ষকের নাম লিখুন"
                          className="w-40 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 5: Verification & Rules */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>পরীক্ষার বিবরণ ও চূড়ান্ত যাচাই সামারি</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[11px]">পরীক্ষার নাম</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{nameBangla}</span>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[11px]">শিক্ষাবর্ষ ও বিভাগ</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {academicYear} • {category.toUpperCase()}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[11px]">পরীক্ষার সময়কাল</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {startDate} হতে {endDate}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[11px]">অন্তর্ভুক্ত বিষয় সংখ্যা</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    মোট {configuredSubjects.length} টি বিষয়
                  </span>
                </div>
              </div>
            </div>

            {/* Grading Rules Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <span>গ্রেডিং স্কেল ও পাসিং পলিসি</span>
                </h4>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="gradingStandard"
                      checked={gradingStandard === "BTEB"}
                      onChange={() => setGradingStandard("BTEB")}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      <strong>BTEB Standard (কারিগরি বোর্ড):</strong> তাত্ত্বিক ও ব্যবহারিকে পৃথক পাস বাধ্যতামূলক
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="gradingStandard"
                      checked={gradingStandard === "GENERAL"}
                      onChange={() => setGradingStandard("GENERAL")}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      <strong>General Standard:</strong> সামগ্রিক ৩৩% নম্বর প্রাপ্তিতে উত্তীর্ণ
                    </span>
                  </label>
                </div>
              </div>

              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>নম্বর প্রদান অ্যাক্সেস ও প্রাথমিক স্ট্যাটাস</span>
                </h4>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowTeacherMarksEntry}
                      onChange={(e) => setAllowTeacherMarksEntry(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      সংশ্লিষ্ট শিক্ষকদের অনলাইন নম্বর প্রদান পোর্টালে সরাসরি অ্যাক্সেস উন্মুক্ত থাকবে
                    </span>
                  </label>

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      প্রাথমিক পাবলিকেশন স্ট্যাটাস:
                    </label>
                    <select
                      value={initialStatus}
                      onChange={(e) => setInitialStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="Published">Published (ঘোষিত ও রুটিন দৃশ্যমান)</option>
                      <option value="Draft">Draft (খসড়া সংরক্ষিত থাকবে)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Footer Controls */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <button
              onClick={handlePrev}
              disabled={submitting}
              className="px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>পূর্ববর্তী ধাপ</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
            >
              <span>পরবর্তী ধাপ</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
            >
              {submitting ? (
                <span>সংরক্ষণ হচ্ছে...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>পরীক্ষা সংরক্ষণ ও চূড়ান্ত ঘোষণা করুন</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
