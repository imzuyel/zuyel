"use client";

import React, { useState } from "react";
import { X, Check, AlertCircle, Clock, ShieldAlert } from "lucide-react";
import { AttendanceStatus } from "@/lib/database";

interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: number;
    roll: number;
    studentId: string;
    name: string;
    nameBangla?: string;
  };
  date: string;
  periodNo?: number;
  classId?: number;
  tradeId?: number;
  section?: string;
  session?: string;
  currentStatus: AttendanceStatus | "—";
  currentRemark?: string;
  recordId?: string;
  onSuccess: (updatedRecord: any) => void;
}

export default function AttendanceCorrectionModal({
  isOpen,
  onClose,
  student,
  date,
  periodNo = 1,
  classId = 4,
  tradeId,
  section = "A",
  session = "2026",
  currentStatus,
  currentRemark = "",
  recordId,
  onSuccess,
}: AttendanceCorrectionModalProps) {
  const [newStatus, setNewStatus] = useState<AttendanceStatus>(
    currentStatus === "—" ? "P" : currentStatus
  );
  const [remark, setRemark] = useState<string>(currentRemark);
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    const effectiveReason = reason.trim() || "রেজিস্টার গ্রিড থেকে সরাসরি হাজিরা আপডেট";

    setLoading(true);
    setError(null);

    try {
      if (recordId) {
        // Use existing PUT /api/attendance endpoint for direct student correction with audit trail
        const res = await fetch("/api/attendance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recordId,
            studentId: student.id,
            newStatus,
            remark,
            reason: effectiveReason,
            changedBy: "Faculty / Academic Admin",
          }),
        });
        const json = await res.json();
        if (json.success) {
          onSuccess(json.record);
          onClose();
        } else {
          setError(json.error || "হাজিরা সংশোধন করতে সমস্যা হয়েছে।");
        }
      } else {
        // If no master session record exists yet for this date, trigger create via POST
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            periodNo,
            classId,
            tradeId: tradeId || undefined,
            section,
            session,
            teacherName: "Assigned Faculty",
            entries: [
              {
                studentId: student.id,
                roll: student.roll,
                name: student.nameBangla || student.name,
                studentCode: student.studentId,
                status: newStatus,
                remark,
              },
            ],
            changedBy: "Faculty / Academic Admin",
          }),
        });
        const json = await res.json();
        if (json.success) {
          onSuccess(json.record);
          onClose();
        } else {
          setError(json.error || "হাজিরা রেকর্ড তৈরি করতে সমস্যা হয়েছে।");
        }
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার সংযোগে ত্রুটি ঘটেছে।");
    } finally {
      setLoading(false);
    }
  };

  const statusOptions: { value: AttendanceStatus; label: string; bg: string; text: string }[] = [
    { value: "P", label: "উপস্থিত (Present)", bg: "bg-emerald-500 text-white", text: "text-emerald-700" },
    { value: "A", label: "অনুপস্থিত (Absent)", bg: "bg-rose-500 text-white", text: "text-rose-700" },
    { value: "L", label: "বিলম্ব (Late)", bg: "bg-amber-500 text-white", text: "text-amber-700" },
    { value: "E", label: "ছুটি (Excused)", bg: "bg-blue-500 text-white", text: "text-blue-700" },
    { value: "M", label: "মেডিকেল (Medical)", bg: "bg-purple-500 text-white", text: "text-purple-700" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 no-print animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                হাজিরা দ্রুত সংশোধন ও হালনাগাদ
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                তারিখ: {date} | পিরিয়ড: {periodNo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Info Card */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400">শিক্ষার্থী:</div>
              <div className="font-black text-sm text-slate-900 dark:text-white">
                {student.nameBangla || student.name}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                রোল: {student.roll} | আইডি: {student.studentId}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">বর্তমান স্ট্যাটাস</span>
              <span
                className={`px-2.5 py-1 rounded-lg font-bold font-mono text-xs ${
                  currentStatus === "P"
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                    : currentStatus === "A"
                    ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black"
                    : currentStatus === "L"
                    ? "bg-amber-100 text-amber-700"
                    : currentStatus === "E"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                {currentStatus === "—" ? "অনুলিখিত (—)" : currentStatus}
              </span>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">
              নতুন স্ট্যাটাস নির্বাচন করুন:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statusOptions.map((opt) => {
                const isSelected = newStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewStatus(opt.value)}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? `${opt.bg} border-transparent shadow-xs scale-102`
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    <span className="font-mono text-sm font-black">{opt.value}</span>
                    <span className="text-[10px]">{opt.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Remark */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              মন্তব্য (ঐচ্ছিক):
            </label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="যেমন: বৃষ্টির কারণে দেরি, চিকিৎসাজনিত অসুস্থতা..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
            />
          </div>

          {/* Audit Reason */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              সংশোধনের সুনির্দিষ্ট কারণ <span className="text-rose-500">*</span>:
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="অডিট ট্রেইলে সংরক্ষণের জন্য কারণ লিখুন (যেমন: মেডিকেল ছাড়পত্র উপস্থাপিত)..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
            />
            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-500" />
              <span>এই কারণটি স্থায়ীভাবে প্রাতিষ্ঠানিক অডিট লগে সংরক্ষিত হবে।</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <span>সংরক্ষণ হচ্ছে...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>হালনাগাদ নিশ্চিত করুন</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
