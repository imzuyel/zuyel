"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  Code2,
  Play,
  Users,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { AttendanceFilterState } from "./DynamicAttendanceContextBar";

interface QuizEligibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: AttendanceFilterState;
  onLaunchQuizWithEligibleStudents?: (studentIds: number[]) => void;
}

export default function QuizEligibilityModal({
  isOpen,
  onClose,
  context,
  onLaunchQuizWithEligibleStudents,
}: QuizEligibilityModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [includeLate, setIncludeLate] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"students" | "api_contract">("students");

  const queryParams = new URLSearchParams({
    action: "quiz_eligibility",
    session: context.session,
    classId: String(context.classId),
    section: context.section,
    tradeId: context.tradeId ? String(context.tradeId) : "0",
    date: context.date,
    periodNo: String(context.periodNo),
    includeLate: String(includeLate),
  });

  const apiUrl = `/api/attendance?${queryParams.toString()}`;

  const fetchEligibility = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error checking quiz eligibility:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEligibility();
    }
  }, [isOpen, context, includeLate]);

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(`${window.location.origin}${apiUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>কুইজ অংশগ্রহণ যোগ্যতা যাচাই (Quiz Eligibility Contract)</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Phase 5 Foundation
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                হাজিরা ডাটাবেস থেকে শুধু অনুমোদিত উপস্থিত শিক্ষার্থীদের তালিকা কুইজ ইঞ্জিনের জন্য প্রস্তুত
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Context Summary Bar */}
        <div className="px-5 py-3 bg-purple-50/50 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-purple-950 dark:text-purple-200">
            <span>সেশন: <strong>{context.session}</strong></span>
            <span>শ্রেণি আইডি: <strong>{context.classId}</strong></span>
            <span>শাখা: <strong>{context.section}</strong></span>
            {context.tradeId && <span>ট্রেড আইডি: <strong>{context.tradeId}</strong></span>}
            <span>তারিখ: <strong>{context.date}</strong></span>
            <span>পিরিয়ড: <strong>{context.periodNo}ম</strong></span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={includeLate}
              onChange={(e) => setIncludeLate(e.target.checked)}
              className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
            />
            <span>দেরিতে উপস্থিত (Late) শিক্ষার্থীদের অন্তর্ভুক্ত করুন</span>
          </label>
        </div>

        {/* Sub-tabs */}
        <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("students")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "students"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            যোগ্য শিক্ষার্থীদের তালিকা ({data?.totalPresent || 0})
          </button>
          <button
            onClick={() => setActiveTab("api_contract")}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "api_contract"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>API চুক্তি ও JSON আউটপুট (Integration Contract)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              হাজিরা ডাটাবেস যাচাই করা হচ্ছে...
            </div>
          ) : !data || !data.recordFound ? (
            <div className="p-8 text-center bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
              <div className="font-bold text-sm">হাজিরা রেকর্ড সম্পন্ন হয়নি</div>
              <p className="text-xs text-amber-700 dark:text-amber-400 max-w-md mx-auto">
                এই তারিখ ও পিরিয়ডের জন্য কোনো সক্রিয় হাজিরা পাওয়া যায়নি। কুইজে অংশগ্রহণের পূর্বে শিক্ষকের ডিজিটাল হাজিরা গ্রহণ সম্পন্ন হতে হবে।
              </p>
            </div>
          ) : activeTab === "students" ? (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {data.totalPresent} জন শিক্ষার্থী কুইজ শুরুর জন্য প্রস্তুত ও যোগ্য।
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>
                    অনুপস্থিত ({data.absentStudentsCount} জন) স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়েছে।
                  </span>
                </div>
              </div>

              {/* Eligible Students Table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3 w-16 text-center">রোল</th>
                      <th className="py-2 px-3">নাম</th>
                      <th className="py-2 px-3 font-mono">আইডি</th>
                      <th className="py-2 px-3 text-center">হাজিরা স্থিতি</th>
                      <th className="py-2 px-3">যোগ্যতা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {data.eligibleStudents.map((st: any) => (
                      <tr key={st.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800/50">
                        <td className="py-2 px-3 text-center font-bold">{st.roll}</td>
                        <td className="py-2 px-3 font-medium">{st.nameBangla || st.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-500 dark:text-slate-400">{st.studentCode}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              st.status === "P"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {st.status === "P" ? "Present" : "Late"}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>অনুমোদিত</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Excluded Absentees Note */}
              {data.excludedStudentCodes?.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>অনুপস্থিত থাকায় কুইজ থেকে বহির্ভূত শিক্ষার্থী আইডি ({data.excludedStudentCodes.length} জন):</span>
                  </div>
                  <div className="font-mono text-[11px] text-rose-600 dark:text-rose-400">
                    {data.excludedStudentCodes.join(", ")}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* API Contract View */
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono">
                <span className="truncate">{apiUrl}</span>
                <button
                  onClick={handleCopyEndpoint}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px] shrink-0"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "কপি হয়েছে!" : "এন্ডপয়েন্ট কপি"}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl overflow-x-auto max-h-80">
                <pre>{JSON.stringify(data, null, 2)}</pre>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  ভবিষ্যতের লাইভ কুইজ ইন্টিগ্রেশন নির্দেশিকা:
                </p>
                <p>
                  ১. শিক্ষক কুইজ শুরুর পূর্বে এই এন্ডপয়েন্ট কল করে সরাসরি উপস্থিত রোল ও আইডি তালিকা গ্রহণ করবে।
                </p>
                <p>২. কুইজ সিস্টেম শিক্ষার্থীদের নিজস্ব তালিকা মেইনটেইন না করে হাজিরা ডাটাবেসের সত্যতা নিশ্চিত করবে।</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Authoritative Attendance & Quiz Gateway • Panchagarh Govt. TSC
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              বন্ধ করুন
            </button>
            {data?.recordFound && data?.eligibleStudents?.length > 0 && onLaunchQuizWithEligibleStudents && (
              <button
                onClick={() => {
                  onLaunchQuizWithEligibleStudents(data.eligibleStudents.map((s: any) => s.studentId));
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>কুইজ এরিনায় প্রেরণ করুন</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
