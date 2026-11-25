"use client";

import React from "react";
import { ValidationSummary, ValidationIssue } from "@/lib/examPaperValidator";
import { CheckCircle2, AlertTriangle, AlertCircle, X, ShieldCheck, ArrowRight } from "lucide-react";

interface ExamValidationModalProps {
  summary: ValidationSummary;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}

export default function ExamValidationModal({
  summary,
  onClose,
  onSelectNode,
}: ExamValidationModalProps) {
  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                summary.readyToPrint
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                স্মার্ট প্রশ্নপত্র পরীক্ষণ রিপোর্ট (17-Point Audit)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                স্কোর: <span className="font-bold text-indigo-600">{summary.score}%</span> •{" "}
                {summary.readyToPrint ? "প্রিন্টের জন্য প্রস্তুত" : "সংশোধন প্রয়োজন"}
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

        {/* Issue List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs">
          {summary.issues.length === 0 ? (
            <div className="py-12 text-center text-emerald-600 dark:text-emerald-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto" />
              <p className="font-black text-sm">অভিনন্দন! কোনো ত্রুটি বা অসঙ্গতি পাওয়া যায়নি।</p>
              <p className="text-slate-500 text-xs">প্রশ্নপত্রটি বিটিইবি মানদণ্ড অনুসারে ১০০% প্রস্তুত।</p>
            </div>
          ) : (
            summary.issues.map((issue) => (
              <div
                key={issue.id}
                className={`p-3.5 rounded-2xl border transition ${
                  issue.severity === "error"
                    ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900"
                    : issue.severity === "warning"
                    ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
                    : "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    {issue.severity === "error" ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : issue.severity === "warning" ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          #{issue.checkNumber}. {issue.titleBangla}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded uppercase font-mono text-[9px] font-bold ${
                            issue.severity === "error"
                              ? "bg-rose-200 text-rose-800"
                              : "bg-amber-200 text-amber-800"
                          }`}
                        >
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {issue.descriptionBangla}
                      </p>
                      <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                        💡 পরামর্শ: {issue.suggestionBangla}
                      </p>
                    </div>
                  </div>

                  {issue.targetNodeId && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectNode(issue.targetNodeId!);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-[10px] hover:text-indigo-600 flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span>সংশোধন</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            বুঝেছি / বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}

