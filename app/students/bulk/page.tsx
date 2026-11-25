"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import HierarchicalSidebar from "@/components/navigation/HierarchicalSidebar";
import Link from "next/link";
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle, RefreshCw, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function BulkStudentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [parsedStudents, setParsedStudents] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((row: any, idx: number) => ({
            id: row.roll ? 1000 + Number(row.roll) : Date.now() + idx,
            name: row["Name"] || row["Student Name"] || row["নাম"] || `Student ${idx + 1}`,
            nameBangla: row["Name Bangla"] || row["নাম (বাংলা)"] || row["নাম"],
            roll: String(row["Roll"] || row["রোল"] || 101 + idx),
            className: row["Class"] || row["শ্রেণি"] || "ডিপ্লোমা (৯ম শ্রেণি)",
            tradeName: row["Trade"] || row["ট্রেড"] || "IT Support & IoT",
            gender: row["Gender"] || row["লিঙ্গ"] || "male",
            guardianPhone: row["Phone"] || row["মোবাইল"] || row["Guardian Phone"] || "01712345678",
            studentId: row["ID"] || row["Student ID"] || `PTSC-${row.roll || 101 + idx}`,
            session: "2026",
            status: "active",
          }));
          setParsedStudents(formatted);
          toast.success(`${formatted.length} জন শিক্ষার্থীর ডাটা এক্সেল শিট থেকে সফলভাবে পড়া হয়েছে!`);
        } else {
          toast.error("ফাইলে কোনো শিক্ষার্থীর সারি পাওয়া যায়নি।");
        }
      } catch {
        toast.error("এক্সেল বা CSV ফাইল প্রসেস করতে ত্রুটি হয়েছে।");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleSyncToDatabase = async () => {
    if (parsedStudents.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: parsedStudents }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${parsedStudents.length} জন শিক্ষার্থী সফলভাবে ডাটাবেসে সেভ হয়েছে!`);
        setParsedStudents([]);
      } else {
        toast.error(data.error || "ডাটাবেস সিঙ্ক সম্পন্ন হয়নি।");
      }
    } catch {
      toast.error("সার্ভার ত্রুটি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Student ID": "PTSC-101",
        "Roll": "101",
        "Student Name": "Md. Rakibul Hasan",
        "নাম (বাংলা)": "মো: রাকিবুল হাসান",
        "Class": "৯ম শ্রেণি (ভোকেশনাল)",
        "Trade": "IT Support & IoT",
        "Gender": "male",
        "Guardian Phone": "01712345678",
      },
      {
        "Student ID": "PTSC-102",
        "Roll": "102",
        "Student Name": "Sumaiya Akter",
        "নাম (বাংলা)": "সুমাইয়া আক্তার",
        "Class": "৯ম শ্রেণি (ভোকেশনাল)",
        "Trade": "IT Support & IoT",
        "Gender": "female",
        "Guardian Phone": "01812345678",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students_Template");
    XLSX.writeFile(wb, "PTSC_Students_Bulk_Upload_Template.xlsx");
    toast.success("নমুনা এক্সেল টেমপ্লেট ডাউনলোড হয়েছে!");
  };

  return (
    <div className="flex h-screen max-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <div className="hidden lg:block shrink-0 h-screen sticky top-0 overflow-hidden">
        <HierarchicalSidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 w-64 h-full bg-white dark:bg-slate-950 shadow-2xl">
            <HierarchicalSidebar isCollapsed={false} />
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onNavigate={() => {}} />

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Link href="/admin" className="hover:text-indigo-600 transition">
                অ্যাডমিন ড্যাশবোর্ড
              </Link>
              <span>/</span>
              <Link href="/students" className="hover:text-indigo-600 transition">
                শিক্ষার্থী ব্যবস্থাপনা
              </Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-bold">বাল্ক শিক্ষার্থী আপলোড ও সিঙ্ক</span>
            </div>

            {/* Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold backdrop-blur-xs border border-white/20">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>BTEB Bulk Admissions & Student Sync</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                  বাল্ক শিক্ষার্থী আপলোড ও এক্সেল সিঙ্ক স্টুডিও
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  শত শত শিক্ষার্থীর তথ্য এক্সেল বা CSV ফাইল থেকে ১-ক্লিকে সেন্ট্রাল ডাটাবেসে ইমপোর্ট ও স্বয়ংক্রিয় রোল/আইডি সিঙ্ক করুন।
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer self-start md:self-auto"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>নমুনা টেমপ্লেট ডাউনলোড (.xlsx)</span>
              </button>
            </div>

            {/* Upload Dropzone */}
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/70 transition-all text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                এক্সেল (.xlsx, .xls) অথবা CSV ফাইল আপলোড করুন
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                রোল, শিক্ষার্থীর নাম, শ্রেণি, ট্রেড ও অভিভাবকের ফোন নম্বর সংবলিত স্প্রেডশিট নির্বাচন করুন।
              </p>

              <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95">
                <FileSpreadsheet className="w-4 h-4" />
                <span>{uploading ? "পড়া হচ্ছে..." : "ফাইল নির্বাচন করুন"}</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Parsed Students Preview Table */}
            {parsedStudents.length > 0 && (
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      প্রিভিউ তালিকা ({parsedStudents.length} জন শিক্ষার্থী)
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncToDatabase}
                    disabled={isProcessing}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isProcessing ? "ডাটাবেসে সেভ হচ্ছে..." : "সেন্ট্রাল ডাটাবেসে সেভ করুন"}</span>
                  </button>
                </div>

                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">রোল</th>
                        <th className="p-2.5">নাম (ইংরেজি)</th>
                        <th className="p-2.5">নাম (বাংলা)</th>
                        <th className="p-2.5">শ্রেণি</th>
                        <th className="p-2.5">ট্রেড</th>
                        <th className="p-2.5">মোবাইল</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedStudents.map((st, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <td className="p-2.5 font-bold text-indigo-600">{st.roll}</td>
                          <td className="p-2.5 text-slate-900 dark:text-white">{st.name}</td>
                          <td className="p-2.5 text-slate-800 dark:text-slate-200">{st.nameBangla || "-"}</td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-300">{st.className}</td>
                          <td className="p-2.5 text-teal-600 dark:text-teal-400 font-bold">{st.tradeName}</td>
                          <td className="p-2.5 text-slate-500">{st.guardianPhone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

