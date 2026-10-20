"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Layers,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Users,
  Edit2,
  Share2,
  Download,
  GraduationCap,
  Calendar,
  CreditCard,
  Award,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { Student } from "@/lib/database";
import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  doesClassHaveTrade,
  isTradeValidForClass,
  parseClassNumeric,
} from "@/lib/academicStructure";

export type BulkActionType =
  | "BULK_EDIT"
  | "BULK_SECTION_UPDATE"
  | "BULK_TRADE_UPDATE"
  | "BULK_STATUS_UPDATE"
  | "BULK_ARCHIVE"
  | "EXPORT_SELECTED"
  | "REDIRECT_PROMOTION"
  | "REDIRECT_ATTENDANCE"
  | "REDIRECT_RESULTS"
  | "REDIRECT_ID_GEN"
  | "SECTION_CHANGE"
  | "TRADE_ASSIGN"
  | "STATUS_UPDATE"
  | "ARCHIVE";

export interface SmartBulkOperationsModalProps {
  isOpen?: boolean;
  selectedStudents: Student[];
  allStudents?: Student[];
  allFilteredStudents?: Student[];
  initialAction?: BulkActionType;
  onClose: () => void;
  onSuccess: () => void;
  onNavigateToPromotion?: () => void;
  onNavigateToAttendance?: () => void;
  onNavigateToResults?: () => void;
  onNavigateToIdHub?: () => void;
}

const normalizeBulkAction = (act: BulkActionType): BulkActionType => {
  if (act === "SECTION_CHANGE") return "BULK_SECTION_UPDATE";
  if (act === "TRADE_ASSIGN") return "BULK_TRADE_UPDATE";
  if (act === "STATUS_UPDATE") return "BULK_STATUS_UPDATE";
  if (act === "ARCHIVE") return "BULK_ARCHIVE";
  return act;
};

export default function SmartBulkOperationsModal({
  isOpen = true,
  selectedStudents,
  allStudents,
  allFilteredStudents,
  initialAction = "BULK_EDIT",
  onClose,
  onSuccess,
  onNavigateToPromotion,
  onNavigateToAttendance,
  onNavigateToResults,
  onNavigateToIdHub,
}: SmartBulkOperationsModalProps) {
  const [currentAction, setCurrentAction] = useState<BulkActionType>(normalizeBulkAction(initialAction));
  const [step, setStep] = useState<"configure" | "preview" | "executing" | "result">("configure");

  if (!isOpen) return null;

  // Form State for Bulk Updates
  const [targetSection, setTargetSection] = useState("A");
  const [targetTradeId, setTargetTradeId] = useState<number>(101);
  const [targetStatus, setTargetStatus] = useState("Active");
  const [targetShift, setTargetShift] = useState<"First Shift" | "Second Shift">("First Shift");
  const [targetPresentAddress, setTargetPresentAddress] = useState("");
  const [targetPermanentAddress, setTargetPermanentAddress] = useState("");
  const [targetSession, setTargetSession] = useState("2026");

  // Execution Results
  const [executing, setExecuting] = useState(false);
  const [resultData, setResultData] = useState<{
    successCount: number;
    failureCount: number;
    errors: { studentId: string; name: string; error: string }[];
    auditRecord?: any;
    message?: string;
  } | null>(null);

  // Determine trade list from global trades
  const availableTrades = ALL_TRADES;

  // Real-time Preview / Diff Calculation
  const previewDiff = useMemo(() => {
    return selectedStudents.map((s) => {
      const clsNum = parseClassNumeric(s.classId);
      const hasTrade = doesClassHaveTrade(clsNum);
      let isValid = true;
      let warningOrError: string | null = null;
      let oldValue = "";
      let newValue = "";

      switch (currentAction) {
        case "BULK_SECTION_UPDATE":
          oldValue = `শাখা ${s.section || "A"}`;
          newValue = `শাখা ${targetSection}`;
          if (s.section === targetSection) {
            warningOrError = "ইতিমধ্যে এই শাখায় রয়েছে (No Change)";
          }
          break;

        case "BULK_TRADE_UPDATE":
          oldValue = s.tradeNameBangla || s.tradeName || "সাধারণ (No Trade)";
          const matchedTrade = availableTrades.find((t) => t.id === Number(targetTradeId));
          newValue = matchedTrade ? matchedTrade.nameBangla : "Unknown Trade";

          if (!hasTrade) {
            isValid = false;
            warningOrError = `শ্রেণি ${clsNum}-এ কারিগরি ট্রেড প্রযোজ্য নয় (Pre-Vocational)`;
          } else if (!isTradeValidForClass(clsNum, Number(targetTradeId))) {
            isValid = false;
            warningOrError = `ট্রেডটি শ্রেণি ${clsNum}-এর জন্য অনুমোদিত নয়`;
          }
          break;

        case "BULK_STATUS_UPDATE":
          oldValue = s.status || "Active";
          newValue = targetStatus;
          if (s.status === targetStatus) {
            warningOrError = "ইতিমধ্যে এই স্ট্যাটাসে রয়েছে";
          }
          break;

        case "BULK_ARCHIVE":
          oldValue = s.status || "Active";
          newValue = "Archived (আর্কাইভ)";
          break;

        case "BULK_EDIT":
          const changes: string[] = [];
          if (targetSection) changes.push(`শাখা: ${targetSection}`);
          if (targetShift) changes.push(`শিফট: ${targetShift === "Second Shift" ? "২য়" : "১ম"}`);
          if (targetStatus) changes.push(`স্ট্যাটাস: ${targetStatus}`);
          if (targetPresentAddress) changes.push(`ঠিকানা পরিবর্তন`);
          oldValue = `শাখা ${s.section}, ${s.status}`;
          newValue = changes.length > 0 ? changes.join(", ") : "কোনো পরিবর্তন নির্বাচিত হয়নি";
          break;

        default:
          oldValue = "—";
          newValue = "—";
      }

      return {
        student: s,
        oldValue,
        newValue,
        isValid,
        warningOrError,
      };
    });
  }, [
    selectedStudents,
    currentAction,
    targetSection,
    targetTradeId,
    targetStatus,
    targetShift,
    targetPresentAddress,
    targetPermanentAddress,
    availableTrades,
  ]);

  const hasCriticalErrors = previewDiff.some((d) => !d.isValid);

  // Execute Bulk Operation
  const handleExecuteBulk = async () => {
    setExecuting(true);
    setStep("executing");

    try {
      let updatesPayload: any = {};

      if (currentAction === "BULK_SECTION_UPDATE") {
        updatesPayload = { targetSection };
      } else if (currentAction === "BULK_TRADE_UPDATE") {
        updatesPayload = { targetTradeId };
      } else if (currentAction === "BULK_STATUS_UPDATE") {
        updatesPayload = { targetStatus };
      } else if (currentAction === "BULK_ARCHIVE") {
        updatesPayload = {};
      } else if (currentAction === "BULK_EDIT") {
        updatesPayload = {
          section: targetSection,
          shift: targetShift,
          status: targetStatus,
          presentAddress: targetPresentAddress,
          permanentAddress: targetPermanentAddress,
          session: targetSession,
        };
      }

      const res = await fetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: currentAction,
          studentIds: selectedStudents.map((s) => s.id),
          updates: updatesPayload,
          performedBy: "Authorized Admin",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResultData({
          successCount: data.successCount,
          failureCount: data.failureCount,
          errors: data.errors || [],
          auditRecord: data.auditRecord,
          message: data.message,
        });
        setStep("result");
        onSuccess();
      } else {
        alert(`বাল্ক অপারেশন ব্যর্থ হয়েছে: ${data.error}`);
        setStep("configure");
      }
    } catch (err: any) {
      console.error(err);
      alert(`সার্ভার সংযোগে ত্রুটি: ${err.message}`);
      setStep("configure");
    } finally {
      setExecuting(false);
    }
  };

  // Quick Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "Student ID",
      "Roll",
      "Name English",
      "Name Bangla",
      "Class",
      "Section",
      "Trade",
      "Shift",
      "Session",
      "Guardian Mobile",
      "Status",
    ];

    const rows = selectedStudents.map((s) => [
      `"${s.studentId}"`,
      `"${s.roll}"`,
      `"${s.name}"`,
      `"${s.nameBangla || ""}"`,
      `"${s.className}"`,
      `"${s.section}"`,
      `"${s.tradeNameBangla || s.tradeName || "General"}"`,
      `"${s.shiftBangla || s.shift}"`,
      `"${s.session || "2026"}"`,
      `"${s.guardianMobile || ""}"`,
      `"${s.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PTSC_Students_Selected_${selectedStudents.length}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full my-auto overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-indigo-600/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black flex items-center gap-2">
                <span>স্মার্ট বাল্ক স্টুডেন্ট অপারেশন (Smart Bulk Operations)</span>
                <span className="bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {selectedStudents.length} জন শিক্ষার্থী নির্বাচিত
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                একসাথে একাধিক শিক্ষার্থীর তথ্য নিরাপদ ও ট্রানজেকশন-সেফ পদ্ধতিতে হালনাগাদ করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: CONFIGURE & CHOOSE ACTION */}
        {step === "configure" && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50 dark:bg-slate-950/50">
            {/* Action Selector Bar */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                অপারেশনের ধরন নির্বাচন করুন (Select Bulk Action)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentAction("BULK_EDIT")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    currentAction === "BULK_EDIT"
                      ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 text-indigo-900 shadow-xs ring-2 ring-indigo-600/10"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Edit2 className="w-4 h-4 mb-1 text-indigo-600" />
                  <div className="font-bold text-xs">বাল্ক এডিট</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">শাখা, শিফট, ঠিকানা</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentAction("BULK_SECTION_UPDATE")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    currentAction === "BULK_SECTION_UPDATE"
                      ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 text-indigo-900 shadow-xs ring-2 ring-indigo-600/10"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Users className="w-4 h-4 mb-1 text-indigo-600" />
                  <div className="font-bold text-xs">শাখা পরিবর্তন</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Section A/B পরিবর্তন</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentAction("BULK_TRADE_UPDATE")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    currentAction === "BULK_TRADE_UPDATE"
                      ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 text-indigo-900 shadow-xs ring-2 ring-indigo-600/10"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <GraduationCap className="w-4 h-4 mb-1 text-indigo-600" />
                  <div className="font-bold text-xs">ট্রেড নির্ধারণ</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">৯ম-১২শ কারিগরি ট্রেড</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentAction("BULK_STATUS_UPDATE")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    currentAction === "BULK_STATUS_UPDATE"
                      ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 text-indigo-900 shadow-xs ring-2 ring-indigo-600/10"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Sparkles className="w-4 h-4 mb-1 text-indigo-600" />
                  <div className="font-bold text-xs">স্ট্যাটাস আপডেট</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">সক্রিয়, উত্তীর্ণ, ড্রপ ইত্যাদি</div>
                </button>
              </div>
            </div>

            {/* ACTION PARAMETERS CONFIGURATION */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                ফিল্ড পরিবর্তন কনফিগারেশন (Field-Level Settings)
              </h3>

              {currentAction === "BULK_SECTION_UPDATE" && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    টার্গেট নতুন শ্রেণি শাখা (Target Section) *
                  </label>
                  <div className="flex gap-3">
                    {["A", "B", "C"].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setTargetSection(sec)}
                        className={`py-2 px-6 rounded-xl font-bold text-xs border cursor-pointer transition-all ${
                          targetSection === sec
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                            : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        শাখা {sec}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentAction === "BULK_TRADE_UPDATE" && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 text-[11px] text-amber-800 font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      বিটিইবি নিয়ম: ৬ষ্ঠ–৮ম শ্রেণির শিক্ষার্থীদের কোনো ট্রেড থাকবে না। ট্রেড শুধুমাত্র ৯ম–১২শ শ্রেণির জন্য প্রযোজ্য।
                    </span>
                  </div>

                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    টার্গেট কারিগরি ট্রেড (Target Trade) *
                  </label>
                  <select
                    value={targetTradeId}
                    onChange={(e) => setTargetTradeId(Number(e.target.value))}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                  >
                    {availableTrades.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameBangla} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {currentAction === "BULK_STATUS_UPDATE" && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    টার্গেট স্ট্যাটাস (Target Status) *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: "Active", label: "সক্রিয় (Active)", color: "emerald" },
                      { id: "Inactive", label: "নিষ্ক্রিয় (Inactive)", color: "slate" },
                      { id: "Transferred", label: "স্থানান্তরিত (Transferred)", color: "blue" },
                      { id: "Dropped", label: "ঝরে পড়া (Dropped)", color: "rose" },
                      { id: "Graduated", label: "উত্তীর্ণ (Graduated)", color: "indigo" },
                      { id: "Alumni", label: "অ্যালামনাই (Alumni)", color: "purple" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setTargetStatus(st.id)}
                        className={`p-2.5 rounded-xl font-bold text-xs border text-center cursor-pointer transition-all ${
                          targetStatus === st.id
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                            : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentAction === "BULK_EDIT" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">নতুন শাখা (Section)</label>
                    <select
                      value={targetSection}
                      onChange={(e) => setTargetSection(e.target.value)}
                      className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 font-bold"
                    >
                      <option value="A">শাখা A</option>
                      <option value="B">শাখা B</option>
                      <option value="C">শাখা C</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">শিফট (Shift)</label>
                    <select
                      value={targetShift}
                      onChange={(e) => setTargetShift(e.target.value as any)}
                      className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 font-bold"
                    >
                      <option value="First Shift">১ম শিফট (First Shift)</option>
                      <option value="Second Shift">২য় শিফট (Second Shift)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">বর্তমান স্ট্যাটাস</label>
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value)}
                      className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 font-bold"
                    >
                      <option value="Active">সক্রিয় (Active)</option>
                      <option value="Inactive">নিষ্ক্রিয় (Inactive)</option>
                      <option value="Transferred">স্থানান্তরিত (Transferred)</option>
                      <option value="Dropped">ঝরে পড়া (Dropped)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">শিক্ষাবর্ষ সেশন (Session)</label>
                    <input
                      type="text"
                      value={targetSession}
                      onChange={(e) => setTargetSession(e.target.value)}
                      placeholder="2026"
                      className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 font-bold font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SPECIALIZED MODULE REDIRECTIONS */}
            <div className="bg-indigo-50 dark:bg-indigo-950/40/50 p-4 rounded-2xl border border-indigo-100 space-y-2">
              <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                <span>বিশেষায়িত মডিউল অ্যাকশন (Direct Module Integrations)</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {onNavigateToPromotion && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToPromotion();
                    }}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>প্রমোশন মডিউলে যান</span>
                  </button>
                )}
                {onNavigateToAttendance && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToAttendance();
                    }}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>হাজিরা খাতায় যান</span>
                  </button>
                )}
                {onNavigateToResults && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToResults();
                    }}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>ফলাফল সংকলনে যান</span>
                  </button>
                )}
                {onNavigateToIdHub && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToIdHub();
                    }}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>আইডি কার্ড স্টুডিও</span>
                  </button>
                )}
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>নির্বাচিতদের এক্সেল/CSV এক্সপোর্ট</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & DIFF TABLE */}
        {step === "preview" && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50 dark:bg-slate-950/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">
                  পরিবর্তন প্রিভিউ ও ভ্যালিডেশন (Before / After Diff)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  নিশ্চিত করার আগে প্রতিটি শিক্ষার্থীর বর্তমান ও নতুন মানের পার্থক্য যাচাই করুন
                </p>
              </div>
              {hasCriticalErrors && (
                <div className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>কিছু ত্রুটি রয়েছে (Fix before commit)</span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-3">রোল ও নাম</th>
                    <th className="p-3">শ্রেণি</th>
                    <th className="p-3">বর্তমান মান (Before)</th>
                    <th className="p-3">প্রস্তাবিত নতুন মান (After)</th>
                    <th className="p-3 text-center">ভ্যালিডেশন স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewDiff.map((diff, i) => (
                    <tr key={i} className={!diff.isValid ? "bg-rose-50/50" : "hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-950"}>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{diff.student.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {diff.student.studentId} • রোল: {diff.student.roll}
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{diff.student.className}</td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">{diff.oldValue}</td>
                      <td className="p-3 font-bold text-indigo-700">{diff.newValue}</td>
                      <td className="p-3 text-center">
                        {diff.isValid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>সঠিক</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 border border-rose-200"
                            title={diff.warningOrError || ""}
                          >
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>{diff.warningOrError || "ত্রুটি"}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 3: EXECUTING SPINNER */}
        {step === "executing" && (
          <div className="p-16 text-center space-y-4 flex-1 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
              বাল্ক অপারেশন প্রসেস করা হচ্ছে...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedStudents.length} জন শিক্ষার্থীর তথ্য ট্রানজেকশন-সেফ পদ্ধতিতে ডাটাবেসে সেভ হচ্ছে।
            </p>
          </div>
        )}

        {/* STEP 4: FINAL RESULT SUMMARY */}
        {step === "result" && resultData && (
          <div className="p-6 text-center space-y-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                বাল্ক অপারেশন সফলভাবে সম্পন্ন হয়েছে!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{resultData.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-xs">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-600 block">সফল হয়েছে</span>
                <span className="text-xl font-black text-emerald-700">{resultData.successCount} জন</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block">ব্যর্থ / সতর্কবার্তা</span>
                <span className="text-xl font-black text-slate-700 dark:text-slate-300">{resultData.failureCount} জন</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onSuccess();
              }}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-indigo-600/20"
            >
              সম্পন্ন ও উইন্ডো বন্ধ করুন
            </button>
          </div>
        )}

        {/* MODAL FOOTER */}
        {step !== "executing" && step !== "result" && (
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              বাতিল (Cancel)
            </button>

            <div className="flex items-center gap-2">
              {step === "configure" ? (
                <button
                  type="button"
                  onClick={() => setStep("preview")}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <span>প্রিভিউ দেখুন (Next)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStep("configure")}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    আগের ধাপে যান
                  </button>
                  <button
                    type="button"
                    disabled={hasCriticalErrors}
                    onClick={handleExecuteBulk}
                    className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer ${
                      hasCriticalErrors
                        ? "bg-slate-300 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>নিশ্চিত ও সংরক্ষণ করুন ({selectedStudents.length} জন)</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
