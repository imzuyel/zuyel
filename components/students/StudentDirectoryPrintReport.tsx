"use client";

import React, { useEffect, useState } from "react";
import { Student } from "@/lib/database";
import { Printer, Download, X, ShieldCheck, FileSpreadsheet, Building2, School } from "lucide-react";
import QRCode from "qrcode";
import { toBengaliNumerals } from "@/lib/utils";

interface StudentDirectoryPrintReportProps {
  students: Student[];
  filterInfo: {
    className: string;
    tradeName: string;
    section: string;
    status: string;
    session?: string;
  };
  onClose: () => void;
}

export default function StudentDirectoryPrintReport({
  students,
  filterInfo,
  onClose,
}: StudentDirectoryPrintReportProps) {
  const [verificationQr, setVerificationQr] = useState<string>("");

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://tsc.panchagarh.gov.bd";
    const verifyUrl = `${origin}/verify?type=student-directory&date=${new Date().toISOString().split("T")[0]}`;
    QRCode.toDataURL(verifyUrl, { width: 120, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
      .then((url) => setVerificationQr(url))
      .catch((err) => console.error("QR Code generation error:", err));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!students.length) return;

    const headers = [
      "SL",
      "Student ID",
      "Roll",
      "Name (English)",
      "Name (Bangla)",
      "Class",
      "Trade",
      "Section",
      "Shift",
      "Father's Name",
      "Guardian Mobile",
      "Blood Group",
      "Status",
    ];

    const rows = students.map((s, index) => [
      index + 1,
      s.studentId,
      s.roll,
      `"${s.name}"`,
      `"${s.nameBangla || s.name}"`,
      `"${s.className || ""}"`,
      `"${s.tradeName || "General"}"`,
      s.section || "A",
      s.shift || "First Shift",
      `"${s.fatherName || ""}"`,
      (s as any).guardianPhone || (s as any).mobile || (s as any).phone || "",
      s.bloodGroup || "",
      s.status || "Active",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `PTSC_Student_Directory_${filterInfo.className.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayBangla = new Date().toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* On-screen Preview Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full my-auto flex flex-col max-h-[94vh] overflow-hidden">
        {/* Modal Toolbar (Hidden on Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                শিক্ষার্থী তালিকা ও প্রাতিষ্ঠানিক রিপোর্ট প্রিভিউ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                মুদ্রণ বা PDF সেভ করার জন্য প্রস্তুতকৃত প্রাতিষ্ঠানিক A4 ফরম্যাট • মোট শিক্ষার্থী:{" "}
                <span className="font-bold text-indigo-600 dark:text-cyan-400">{toBengaliNumerals(students.length)}</span> জন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-500" />
              <span>CSV ডাউনলোড</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট / PDF সংরক্ষণ</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans print:p-0 print:overflow-visible">
          {/* Institutional Government Crest & Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full border border-slate-900 flex items-center justify-center text-xs font-black font-mono">
                PTSC
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                  গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
                </h1>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">কারিগরি শিক্ষা অধিদপ্তর, শিক্ষা মন্ত্রণালয়</p>
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
                </h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">জালাসী, পঞ্চগড়-৫০০০ • ওয়েবসাইট: tsc.panchagarh.gov.bd</p>
              </div>
            </div>

            <div className="pt-2">
              <span className="inline-block px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-black border border-slate-300 dark:border-slate-700">
                শিক্ষার্থী কেন্দ্রীয় রেজিস্টার ও ডিরেক্টরি বিবরণী (Student Master Enrolment List)
              </span>
            </div>

            {/* Filter Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-[11px] text-slate-700 dark:text-slate-300 font-medium text-left bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-500 dark:text-slate-400">শ্রেণি:</span>{" "}
                <strong className="text-slate-900 dark:text-slate-100">{filterInfo.className}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">ট্রেড/বিভাগ:</span>{" "}
                <strong className="text-slate-900 dark:text-slate-100">{filterInfo.tradeName}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">শাখা:</span>{" "}
                <strong className="text-slate-900 dark:text-slate-100">{filterInfo.section}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">তারিখ:</span>{" "}
                <strong className="text-slate-900 dark:text-slate-100 font-mono">{todayBangla}</strong>
              </div>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300 dark:border-slate-700">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-black text-[11px] border-b border-slate-300 dark:border-slate-700">
                  <th className="py-2.5 px-2 border-r border-slate-300 dark:border-slate-700 text-center w-10">ক্র.</th>
                  <th className="py-2.5 px-2 border-r border-slate-300 dark:border-slate-700 text-center w-14">রোল</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-300 dark:border-slate-700 w-32 font-mono">আইডি নম্বর</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">শিক্ষার্থীর নাম</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">শ্রেণি ও ট্রেড</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-300 dark:border-slate-700 text-center">শাখা / শিফট</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">পিতার নাম ও অভিভাবক ফোন</th>
                  <th className="py-2.5 px-2 border-r border-slate-300 dark:border-slate-700 text-center w-12">রক্ত</th>
                  <th className="py-2.5 px-2 text-center w-16">অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {students.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-950/50 page-break-avoid">
                    <td className="py-2 px-2 text-center border-r border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-600 dark:text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 dark:border-slate-700 font-mono font-black text-slate-900 dark:text-slate-100">
                      {toBengaliNumerals(st.roll)}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-300 dark:border-slate-700 font-mono text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                      {st.studentId}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100">
                      <div>{st.nameBangla || st.name}</div>
                      {st.nameBangla && st.name !== st.nameBangla && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{st.name}</div>
                      )}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 dark:border-slate-700">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{st.className}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400">{st.tradeName || "সাধারণ (Pre-Voc)"}</div>
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-300 dark:border-slate-700 text-center text-[11px]">
                      <span className="font-bold">শাখা {st.section || "A"}</span>
                      <div className="text-[9.5px] text-slate-500 dark:text-slate-400">{st.shift || "১ম শিফট"}</div>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 dark:border-slate-700 text-[11px]">
                      <div className="text-slate-800 dark:text-slate-200">{st.fatherName || "—"}</div>
                      <div className="font-mono text-slate-600 dark:text-slate-400 text-[10.5px]">
                        {(st as any).guardianPhone || (st as any).mobile || (st as any).phone || "—"}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 dark:border-slate-700 font-mono font-bold text-rose-700">
                      {st.bloodGroup || "—"}
                    </td>
                    <td className="py-2 px-2 text-center text-[10px] font-bold">
                      <span
                        className={`px-1.5 py-0.5 rounded ${
                          st.status === "Active" || !st.status
                            ? "text-emerald-800 bg-emerald-100"
                            : "text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700"
                        }`}
                      >
                        {st.status === "Active" || !st.status ? "সক্রিয়" : st.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {students.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      নির্বাচিত ফিল্টারে কোনো শিক্ষার্থী নেই।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Official Verification QR & Signatures Footer */}
          <div className="pt-12 mt-8 border-t-2 border-slate-300 dark:border-slate-700 flex items-end justify-between text-xs page-break-avoid">
            {/* Online Verification Stamp */}
            <div className="flex items-center gap-2.5">
              {verificationQr ? (
                <img src={verificationQr} alt="QR Verification" className="w-14 h-14 border border-slate-300 dark:border-slate-700 p-0.5" />
              ) : (
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
              )}
              <div className="text-[9.5px] text-slate-600 dark:text-slate-400 font-mono leading-tight">
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-[10px]">অফিশিয়াল ডাটাবেস ভেরিফাইড</span>
                <span>PTSC ERP Master System</span>
                <span className="block">তারিখ: {todayBangla}</span>
              </div>
            </div>

            {/* Signature Line 1: Class Teacher */}
            <div className="text-center space-y-1">
              <div className="w-36 border-b border-slate-900 mb-1"></div>
              <span className="font-bold text-slate-900 dark:text-slate-100">শ্রেণি শিক্ষক</span>
              <div className="text-[10px] text-slate-600 dark:text-slate-400">পঞ্চগড় টিএসসি</div>
            </div>

            {/* Signature Line 2: Head of Department */}
            <div className="text-center space-y-1">
              <div className="w-36 border-b border-slate-900 mb-1"></div>
              <span className="font-bold text-slate-900 dark:text-slate-100">বিভাগীয় প্রধান / চিফ ইন্সট্রাক্টর</span>
              <div className="text-[10px] text-slate-600 dark:text-slate-400">পঞ্চগড় টিএসসি</div>
            </div>

            {/* Signature Line 3: Principal */}
            <div className="text-center space-y-1">
              <div className="w-40 border-b border-slate-900 mb-1"></div>
              <span className="font-black text-slate-900 dark:text-slate-100">অধ্যক্ষ (Principal)</span>
              <div className="text-[10px] text-slate-600 dark:text-slate-400">পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
