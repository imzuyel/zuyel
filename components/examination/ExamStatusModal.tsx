"use client";

import React, { useState } from "react";
import { Sliders, CheckCircle2, AlertCircle, X, ShieldCheck } from "lucide-react";
import { ExamMaster, ExamStatus } from "@/lib/examinationEngine";

interface ExamStatusModalProps {
  exam: ExamMaster;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedExam: ExamMaster) => void;
}

export default function ExamStatusModal({
  exam,
  isOpen,
  onClose,
  onSuccess,
}: ExamStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ExamStatus>(exam.status);
  const [operator, setOperator] = useState<string>("Controller of Examinations");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage("অনুগ্রহ করে অবস্থা পরিবর্তনের কারণ লিখুন।");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/examination/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: exam.id,
          status: selectedStatus,
          operator,
          reason,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি।");
      }

      onSuccess(data.exam);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              পরীক্ষার অবস্থা পরিবর্তন
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
          <span className="text-slate-400 block text-[11px]">পরীক্ষার নাম:</span>
          <span className="font-bold text-slate-900 dark:text-white block">{exam.nameBangla}</span>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5 block font-mono">
            বর্তমান অবস্থা: {exam.status} {exam.isLocked ? "(লককৃত)" : ""}
          </span>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              নতুন অবস্থা নির্ধারণ করুন *
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ExamStatus)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
            >
              <option value="Draft">Draft (খসড়া প্রস্তুত)</option>
              <option value="Published">Published (ঘোষিত ও রুটিন দৃশ্যমান)</option>
              <option value="Ongoing">Ongoing (চলমান পরীক্ষা)</option>
              <option value="MarksEntry">MarksEntry (নম্বর এন্ট্রি উন্মুক্ত)</option>
              <option value="UnderReview">UnderReview (যাচাই ও নিরীক্ষণ চলছে)</option>
              <option value="Completed">Completed (মূল্যায়ন সমাপ্ত)</option>
              <option value="Locked">Locked (ফলাফল ও নম্বর লককৃত)</option>
              <option value="Archived">Archived (আর্কাইভকৃত)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              অনুমোদনকারী কর্মকর্তা / ইউজার:
            </label>
            <input
              type="text"
              required
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              পরিবর্তনের সুনির্দিষ্ট কারণ *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="যেমন: শিক্ষকদের নম্বর প্রদানের সুযোগ চালু করা হলো..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition"
            >
              {loading ? "পরিবর্তন হচ্ছে..." : "স্ট্যাটাস পরিবর্তন নিশ্চিত করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
