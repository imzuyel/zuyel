"use client";

import React from "react";
import { ExamDocument } from "@/lib/examPaperEngine";
import { formatIndexToBadge } from "@/lib/examNumberingEngine";
import { KeyRound, X, Printer, Copy, CheckCircle2, ShieldAlert } from "lucide-react";

interface ExamAnswerKeyModalProps {
  doc: ExamDocument;
  onClose: () => void;
}

export default function ExamAnswerKeyModal({ doc, onClose }: ExamAnswerKeyModalProps) {
  // Collect all questions with their correct answers and rubrics
  const sections = doc.blocks.filter((b) => b.type === "SECTION_BLOCK");

  const handlePrintAnswerKey = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 text-xs font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>শিক্ষকের উত্তরমালা ও মূল্যায়ন নির্দেশিকা (Teacher Answer Key)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {doc.title} • শুধুমাত্র পরীক্ষক ও শিক্ষকের ব্যবহারের জন্য সংরক্ষিত
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

        {/* Security Alert Banner */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex items-center gap-2 text-amber-800 dark:text-amber-300 text-[11px]">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>গোপনীয়তা নিশ্চিতকরণ:</strong> এই উত্তরমালাটি শিক্ষার্থীর মূল প্রশ্নপত্রে মুদ্রিত
            হবে না। এটি শুধুমাত্র অভ্যন্তরীণ নিরীক্ষণ ও খাতা মূল্যায়নের জন্য প্রস্তুতকৃত।
          </span>
        </div>

        {/* Answer Table Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sections.map((sec: any) => (
            <div key={sec.id} className="space-y-2">
              <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>
                  {sec.parentNumberLabel ? `${sec.parentNumberLabel}: ` : ""}
                  {sec.title}
                </span>
                <span>মোট প্রশ্ন: {sec.questions.length} টি</span>
              </div>

              <div className="space-y-1.5">
                {sec.questions.map((q: any, qIdx: number) => {
                  const badge = formatIndexToBadge(
                    qIdx,
                    sec.questionNumberSystem,
                    q.customNumberOverride
                  );
                  return (
                    <div
                      key={q.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {badge}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {q.stem}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pl-6 text-emerald-700 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            সঠিক উত্তর: {String(q.correctAnswer || "বর্ণনামূলক বিস্তারিত উত্তর")}
                          </span>
                        </div>
                        {q.explanation && (
                          <p className="text-[10px] text-slate-500 pl-6 italic">
                            ব্যাখ্যা/রুব্রিক: {q.explanation}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-slate-500 font-mono shrink-0">
                        [{q.marks} নম্বর]
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 cursor-pointer"
          >
            বন্ধ করুন
          </button>
          <button
            type="button"
            onClick={handlePrintAnswerKey}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>উত্তরমালা প্রিন্ট করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
}

