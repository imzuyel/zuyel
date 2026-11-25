"use client";

import React, { useState } from "react";
import { ExamDocument } from "@/lib/examPaperEngine";
import { generateExamVariant } from "@/lib/examVariantEngine";
import { Shuffle, X, CheckCircle2, KeyRound, Sparkles, AlertCircle } from "lucide-react";

interface ExamVariantModalProps {
  doc: ExamDocument;
  onApplyVariant: (variantDoc: ExamDocument) => void;
  onClose: () => void;
}

export default function ExamVariantModal({
  doc,
  onApplyVariant,
  onClose,
}: ExamVariantModalProps) {
  const [selectedSet, setSelectedSet] = useState<"Set A" | "Set B" | "Set C" | "Set D">("Set B");
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 89999) + 10000);

  const handleGenerateAndApply = () => {
    const { variantDoc } = generateExamVariant(doc, selectedSet, seed);
    onApplyVariant(variantDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 text-xs font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                মাল্টিপল সেট জেনারেটর (Variant Shuffler)
              </h3>
              <p className="text-[11px] text-slate-500">
                Set A, B, C, D স্বয়ংক্রিয় প্রশ্ন ও অপশন পুনর্বিন্যাস
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Set Selector Cards */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 dark:text-slate-200 block">
            কোন সেট তৈরি করতে চান:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["Set A", "Set B", "Set C", "Set D"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSet(s)}
                className={`p-3 rounded-2xl border font-bold text-center transition cursor-pointer flex items-center justify-between ${
                  selectedSet === s
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span>{s}</span>
                {selectedSet === s && <CheckCircle2 className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Deterministic Seed Input */}
        <div className="space-y-1">
          <label className="font-bold text-slate-800 dark:text-slate-200 block">
            র‍্যান্ডমাইজেশন সীড (Deterministic Seed):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value, 10) || 12345)}
              className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
            />
            <button
              type="button"
              onClick={() => setSeed(Math.floor(Math.random() * 89999) + 10000)}
              className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
            >
              নতুন সীড
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            * একই সীড ব্যবহার করে পরবর্তীতে যেকোনো সময় হুবহু একই প্রশ্নবিন্যাস ও উত্তরমালা পুনরায় পাওয়া সম্ভব।
          </p>
        </div>

        {/* Guarantee Banner */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-2 text-emerald-800 dark:text-emerald-300 text-[11px]">
          <KeyRound className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>উত্তরমালা সিঙ্ক গ্যারান্টি:</strong> অপশন ও প্রশ্ন শাফল হলেও শিক্ষকের উত্তরমালায়
            সঠিক উত্তরের পজিশন স্বয়ংক্রিয়ভাবে আপডেট থাকবে।
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleGenerateAndApply}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs"
          >
            {selectedSet} জেনারেট ও লোড করুন
          </button>
        </div>
      </div>
    </div>
  );
}

