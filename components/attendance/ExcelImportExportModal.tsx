"use client";

import React, { useState } from "react";
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  RefreshCw,
  Table,
} from "lucide-react";
import * as XLSX from "xlsx";
import { AttendanceFilterState } from "./DynamicAttendanceContextBar";

interface ExcelImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: AttendanceFilterState;
  onImportComplete?: () => void;
}

export default function ExcelImportExportModal({
  isOpen,
  onClose,
  context,
  onImportComplete,
}: ExcelImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");

  // Import flow state: 1. Upload -> 2. Preview & Mapping -> 3. Commit
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importReport, setImportReport] = useState<any>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Export Daily Register to XLSX
  const handleExportRegister = async () => {
    try {
      // Query students for this class/section/trade
      const q = new URLSearchParams({
        action: "students_paged",
        classId: String(context.classId),
        section: context.section,
        tradeId: context.tradeId ? String(context.tradeId) : "0",
        session: context.session,
        limit: "200",
      });

      const res = await fetch(`/api/attendance?${q.toString()}`);
      const data = await res.json();
      const students = data.items || [];

      // Query existing record if available
      const recRes = await fetch(
        `/api/attendance?session=${context.session}&classId=${context.classId}&section=${context.section}&date=${context.date}&periodNo=${context.periodNo}`
      );
      const recData = await recRes.json();
      const record = (recData.records || []).find((r: any) => r.date === context.date);

      const rows = students.map((s: any) => {
        const entry = record?.entries?.find((e: any) => e.studentId === s.id);
        return {
          "রোল (Roll)": s.roll,
          "শিক্ষার্থী আইডি (Student ID)": s.studentId,
          "নাম (Name)": s.name,
          "বাংলা নাম (Bangla Name)": s.nameBangla || "",
          "শ্রেণি (Class)": s.className,
          "শাখা (Section)": s.section,
          "ট্রেড (Trade)": s.tradeName || "None",
          "তারিখ (Date)": context.date,
          "পিরিয়ড (Period)": `${context.periodNo}ম`,
          "হাজিরা স্থিতি (Status)": entry?.status || "P",
          "মন্তব্য (Remark)": entry?.remark || "",
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Daily Register");
      XLSX.writeFile(wb, `PTSC_Attendance_Class${context.classId}_${context.date}.xlsx`);
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  // Download Empty Template for Import
  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        "Student ID": "2026-04-001",
        "Roll": 1,
        "Name": "Sample Student",
        "Status": "P",
        "Remark": "",
      },
      {
        "Student ID": "2026-04-002",
        "Roll": 2,
        "Name": "Sample Student 2",
        "Status": "A",
        "Remark": "Sick",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance_Template");
    XLSX.writeFile(wb, "PTSC_Attendance_Import_Template.xlsx");
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        if (rawJson.length === 0) {
          setErrorMessage("ফাইলটি খালি বা কোনো ডাটা পাওয়া যায়নি।");
          return;
        }

        // Normalize columns
        const normalized = rawJson.map((row) => ({
          studentId: row["Student ID"] || row["শিক্ষার্থী আইডি"] || row["studentId"] || row["id"],
          roll: row["Roll"] || row["রোল"] || row["roll"],
          name: row["Name"] || row["নাম"] || row["name"],
          status: row["Status"] || row["স্থিতি"] || row["status"] || "P",
          remark: row["Remark"] || row["মন্তব্য"] || row["remark"] || "",
        }));

        setParsedRows(normalized);
        setImportStep(2);
      } catch (err: any) {
        setErrorMessage("এক্সেল ফাইল পার্স করতে সমস্যা হয়েছে: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Commit Imported Attendance to API
  const handleCommitImport = async () => {
    setImporting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import_excel",
          rows: parsedRows,
          session: context.session,
          classId: context.classId,
          section: context.section,
          tradeId: context.tradeId,
          date: context.date,
          periodNo: context.periodNo,
          subjectCode: context.subjectCode,
          subjectName: context.subjectName,
          changedBy: "Admin Excel Import",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setImportReport(data);
        setImportStep(3);
        if (onImportComplete) onImportComplete();
      } else {
        setErrorMessage(data.error || "ইমপোর্ট সম্পন্ন করতে সমস্যা হয়েছে।");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "সার্ভার সংযোগে ত্রুটি।");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                এক্সেল ডাটা হাব (Excel Import / Export)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ডিজিটাল রেজিস্টার এক্সপোর্ট অথবা এক্সেল শিট থেকে বাল্ক হাজিরা আপলোড
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("export")}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "export"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>রেজিস্টার এক্সপোর্ট (Export XLSX)</span>
          </button>

          <button
            onClick={() => setActiveTab("import")}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "import"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>এক্সেল শিট থেকে হাজিরা আপলোড (Import XLSX)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === "export" ? (
            /* Export View */
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  বর্তমান প্রেক্ষাপট (Current Context):
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                  <div>সেশন: <strong>{context.session}</strong></div>
                  <div>শ্রেণি আইডি: <strong>{context.classId}</strong></div>
                  <div>শাখা: <strong>{context.section}</strong></div>
                  <div>তারিখ: <strong>{context.date}</strong></div>
                  <div>পিরিয়ড: <strong>{context.periodNo}ম</strong></div>
                  <div>বিষয়: <strong>{context.subjectName}</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-emerald-950 dark:text-emerald-200">
                    দৈনিক হাজিরা শিট ডাউনলোড
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    রোল, শিক্ষার্থী আইডি, নাম, হাজিরা স্থিতি (P/A/L/E/M) এবং মন্তব্য সহ এক্সেল ফাইল
                  </p>
                </div>
                <button
                  onClick={handleExportRegister}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>এক্সপোর্ট করুন</span>
                </button>
              </div>
            </div>
          ) : (
            /* Import Multi-Step View */
            <div className="space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-800 dark:text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {importStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        নমুনা টেমপ্লেট
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        কলাম ফরম্যাট নিশ্চিত করতে এক্সেল টেমপ্লেট ডাউনলোড করুন
                      </span>
                    </div>
                    <button
                      onClick={handleDownloadTemplate}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>টেমপ্লেট</span>
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center space-y-3 hover:border-emerald-500 transition-colors">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        এক্সেল ফাইল (.xlsx বা .xls) নির্বাচন করুন
                      </p>
                      <p className="text-[11px] text-slate-400">
                        ফাইলে Student ID অথবা Roll এবং Status (P/A/L/E/M) কলাম থাকতে হবে
                      </p>
                    </div>
                    <label className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold cursor-pointer shadow-sm">
                      <span>ফাইল ব্রাউজ করুন</span>
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {importStep === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>প্রিভিউ: {parsedRows.length} জন শিক্ষার্থীর ডাটা পাওয়া গেছে</span>
                    </div>
                    <button
                      onClick={() => setImportStep(1)}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-700 text-xs underline"
                    >
                      অন্য ফাইল আপলোড করুন
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-1.5 px-3">রোল</th>
                          <th className="py-1.5 px-3">আইডি</th>
                          <th className="py-1.5 px-3">নাম</th>
                          <th className="py-1.5 px-3 text-center">স্থিতি</th>
                          <th className="py-1.5 px-3">মন্তব্য</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                        {parsedRows.slice(0, 10).map((r, i) => (
                          <tr key={i}>
                            <td className="py-1.5 px-3 font-bold">{r.roll}</td>
                            <td className="py-1.5 px-3 font-mono">{r.studentId}</td>
                            <td className="py-1.5 px-3">{r.name}</td>
                            <td className="py-1.5 px-3 text-center font-bold text-emerald-600">
                              {r.status}
                            </td>
                            <td className="py-1.5 px-3 text-slate-500 dark:text-slate-400">{r.remark}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedRows.length > 10 && (
                    <p className="text-[11px] text-slate-400 text-center">
                      ... আরও {parsedRows.length - 10} টি রেকর্ড প্রিভিউ তালিকায় রয়েছে
                    </p>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setImportStep(1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      বাতিল
                    </button>
                    <button
                      onClick={handleCommitImport}
                      disabled={importing}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{importing ? "আমদানি হচ্ছে..." : "ডাটাবেসে সংরক্ষণ করুন"}</span>
                    </button>
                  </div>
                </div>
              )}

              {importStep === 3 && importReport && (
                <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <div className="text-base font-bold text-emerald-950 dark:text-emerald-200">
                    এক্সেল হাজিরা সফলভাবে আমদানি হয়েছে!
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    মোট {importReport.importedCount} জন শিক্ষার্থীর হাজিরা ডাটাবেসে সফলভাবে প্রতিস্থাপিত হয়েছে।
                    {importReport.skippedCount > 0 && ` (${importReport.skippedCount} জন বাদ পড়েছে)`}
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-sm"
                  >
                    সম্পন্ন করুন
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
