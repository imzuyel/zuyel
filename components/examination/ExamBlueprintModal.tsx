"use client";

import React, { useState } from "react";
import {
  ExamBlueprint,
  SectionBlueprint,
  validateExamBlueprint,
  generateExamFromBlueprint,
} from "@/lib/examPaperGenerator";
import { ExamDocument } from "@/lib/examPaperEngine";
import { ACADEMIC_CLASSES, ALL_TRADES } from "@/lib/academicStructure";
import { Sparkles, X, Plus, Trash2, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

interface ExamBlueprintModalProps {
  onApplyGeneratedDoc: (doc: ExamDocument) => void;
  onClose: () => void;
}

export default function ExamBlueprintModal({
  onApplyGeneratedDoc,
  onClose,
}: ExamBlueprintModalProps) {
  const [title, setTitle] = useState("জেনারেল ইলেকট্রনিক্স-২ (তত্ত্বীয়) - বার্ষিক পরীক্ষা ২০২৬");
  const [className, setClassName] = useState("দশম শ্রেণি");
  const [tradeName, setTradeName] = useState("জেনারেল ইলেকট্রনিক্স");
  const [subjectName, setSubjectName] = useState("জেনারেল ইলেকট্রনিক্স-২ (তত্ত্বীয়)");
  const [subjectCode, setSubjectCode] = useState("৬২১২");
  const [totalMarks, setTotalMarks] = useState(50);
  const [durationMinutes, setDurationMinutes] = useState(150);

  const [sections, setSections] = useState<SectionBlueprint[]>([
    {
      title: "বহুনির্বাচনি প্রশ্ন (MCQ)",
      parentNumberLabel: "ক-বিভাগ",
      questionType: "mcq",
      questionCount: 10,
      marksPerQuestion: 1,
      columns: 2,
      sectionInstructions: "সকল প্রশ্নের উত্তর দাও। প্রতিটি প্রশ্নের মান ১।",
    },
    {
      title: "সংক্ষিপ্ত উত্তর প্রশ্ন",
      parentNumberLabel: "খ-বিভাগ",
      questionType: "short",
      questionCount: 5,
      marksPerQuestion: 2,
      columns: 1,
      sectionInstructions: "যেকোনো ৫টি প্রশ্নের উত্তর দাও। প্রতিটি প্রশ্নের মান ২।",
    },
    {
      title: "রচনামূলক / বর্ণনামূলক প্রশ্ন",
      parentNumberLabel: "গ-বিভাগ",
      questionType: "broad",
      questionCount: 6,
      marksPerQuestion: 5,
      columns: 1,
      sectionInstructions: "যেকোনো ৬টি প্রশ্নের উত্তর দাও। প্রতিটি প্রশ্নের মান ৫।",
    },
  ]);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        title: "নতুন সেকশন",
        parentNumberLabel: `বিভাগ-${sections.length + 1}`,
        questionType: "short",
        questionCount: 4,
        marksPerQuestion: 2,
        columns: 1,
      },
    ]);
  };

  const handleDeleteSection = (index: number) => {
    setSections(sections.filter((_, idx) => idx !== index));
  };

  const handleUpdateSection = (index: number, updates: Partial<SectionBlueprint>) => {
    const next = [...sections];
    next[index] = { ...next[index], ...updates };
    setSections(next);
  };

  const handleGenerate = () => {
    const blueprint: ExamBlueprint = {
      title,
      className,
      tradeName,
      subjectName,
      subjectCode,
      academicYear: "2026",
      totalMarks,
      durationMinutes,
      sections,
    };

    const val = validateExamBlueprint(blueprint);
    if (!val.isValid) {
      setValidationErrors(val.errors);
      return;
    }

    const generatedDoc = generateExamFromBlueprint(blueprint);
    onApplyGeneratedDoc(generatedDoc);
    onClose();
  };

  const currentSum = sections.reduce((acc, s) => acc + s.questionCount * s.marksPerQuestion, 0);

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 text-xs font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                স্মার্ট অটোমেটিক প্রশ্নপত্র জেনারেটর (Blueprint Engine)
              </h3>
              <p className="text-[11px] text-slate-500">
                প্রশ্ন ব্যাংক থেকে স্বয়ংক্রিয়ভাবে পূর্ণাঙ্গ প্রশ্নপত্র অ্যাসেম্বল করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Blueprint Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold">শ্রেণি:</label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                {ACADEMIC_CLASSES.map((c) => (
                  <option key={c.id} value={c.nameBangla}>
                    {c.nameBangla}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold">ট্রেড:</label>
              <select
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                {ALL_TRADES.map((t) => (
                  <option key={t.id} value={t.nameBangla}>
                    {t.nameBangla}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold">পূর্ণমান:</label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(parseInt(e.target.value, 10) || 50)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
          </div>

          {/* Section Blueprints */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
              <span>সেকশন ও নম্বর বণ্টন প্ল্যান:</span>
              <span
                className={`font-mono ${
                  currentSum === totalMarks ? "text-emerald-600 font-black" : "text-amber-600 font-black"
                }`}
              >
                মোট নির্ধারিত: {currentSum} / {totalMarks}
              </span>
            </div>

            {sections.map((sec, sIdx) => (
              <div
                key={sIdx}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => handleUpdateSection(sIdx, { title: e.target.value })}
                    className="flex-1 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteSection(sIdx)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">ধরন:</label>
                    <select
                      value={sec.questionType}
                      onChange={(e) =>
                        handleUpdateSection(sIdx, { questionType: e.target.value as any })
                      }
                      className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <option value="mcq">MCQ</option>
                      <option value="short">সংক্ষিপ্ত</option>
                      <option value="broad">রচনামূলক</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">প্রশ্নের সংখ্যা:</label>
                    <input
                      type="number"
                      min={1}
                      value={sec.questionCount}
                      onChange={(e) =>
                        handleUpdateSection(sIdx, {
                          questionCount: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">প্রতিটির মান:</label>
                    <input
                      type="number"
                      min={1}
                      value={sec.marksPerQuestion}
                      onChange={(e) =>
                        handleUpdateSection(sIdx, {
                          marksPerQuestion: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddSection}
              className="w-full py-2 rounded-xl border border-dashed border-indigo-400 text-indigo-600 font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন সেকশন যোগ করুন</span>
            </button>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded-2xl space-y-1 text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-1 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>ব্লুপ্রিন্ট যাচাইকরণ ত্রুটি:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>প্রশ্নপত্র তৈরি ও লোড করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
}

