"use client";

import React, { useRef } from "react";
import {
  Printer,
  FileSpreadsheet,
  Download,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  School,
  Calendar,
  Layers,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { SemesterResult, SubjectGradeResult, toBengaliNumber } from "@/lib/btebGrader";

export interface TabulationStudentRow {
  studentId: string;
  admissionNo: string;
  roll: number;
  name: string;
  nameBangla: string;
  tradeName?: string;
  tradeCode?: string;
  shift: string;
  section: string;
  results: SubjectGradeResult[];
  semesterSummary: SemesterResult;
}

export interface TabulationSheetProps {
  institutionName?: string;
  institutionNameBangla?: string;
  examName: string;
  academicYear: string;
  className: string;
  classNameBangla: string;
  tradeName?: string;
  section?: string;
  shift?: string;
  subjects: { code: string; name: string; nameBangla?: string; fullMarks: number }[];
  students: TabulationStudentRow[];
  onBack?: () => void;
}

export default function TabulationSheetPrint({
  institutionName = "Panchagarh Government Technical School and College",
  institutionNameBangla = "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
  examName = "১ম পর্ব সমাপনী পরীক্ষা ২০২৬ (1st Semester Final 2026)",
  academicYear = "২০২৬",
  className = "Class 9 (Vocational)",
  classNameBangla = "নবম শ্রেণি (ভোকেশনাল)",
  tradeName = "সকল ট্রেড (All Trades)",
  section = "A",
  shift = "১ম শিফট (First Shift)",
  subjects = [],
  students = [],
  onBack,
}: TabulationSheetProps) {
  const printContainerRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const totalStudents = students.length;
  const totalPassed = students.filter((s) => s.semesterSummary.status === "Passed").length;
  const totalReferred = students.filter((s) => s.semesterSummary.status === "Referred").length;
  const totalFailed = students.filter((s) => s.semesterSummary.status === "Failed").length;
  const passRate = totalStudents > 0 ? ((totalPassed / totalStudents) * 100).toFixed(1) : "0.0";

  return (
    <div className="w-full bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 lg:p-6 min-h-screen text-slate-900 dark:text-slate-100">
      {/* 1. TOP CONTROL BAR (Hidden during print) */}
      <div className="max-w-[1550px] mx-auto mb-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              title="ফিরে যান"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link
              href="/results"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              title="ফলাফল পাতা"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}

          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
              <span>BTEB প্রাতিষ্ঠানিক টেবুলেশন শিট (Tabulation Sheet)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A4 Landscape মোডে প্রিন্ট বা PDF হিসেবে সংরক্ষণ করার জন্য প্রস্তুত।
            </p>
          </div>
        </div>

        {/* Quick Statistical Summary Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            মোট পরীক্ষার্থী: {toBengaliNumber(totalStudents)}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
            পাস: {toBengaliNumber(totalPassed)} ({toBengaliNumber(passRate)}%)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
            রেফার্ড: {toBengaliNumber(totalReferred)}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400">
            অকৃতকার্য: {toBengaliNumber(totalFailed)}
          </span>
        </div>

        {/* Print Trigger Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট / PDF ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* 2. PRINT CANVAS (A4 Landscape Formatted) */}
      <div
        ref={printContainerRef}
        className="max-w-[1550px] mx-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-8 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full print:bg-white print:text-black"
        style={{ minWidth: "1000px" }}
      >
        {/* Institutional Header Banner */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center relative">
          {/* Government / Technical Education Seal */}
          <div className="absolute top-1 left-2 w-16 h-16 rounded-full border border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-1 bg-slate-50 dark:bg-slate-950 print:bg-transparent">
            <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 tracking-tighter">BTEB</span>
            <span className="text-[7px] text-slate-500 dark:text-slate-400 font-mono">CODE: 132244</span>
          </div>

          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • কারিগরি শিক্ষা অধিদপ্তর
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mt-0.5">
            {institutionNameBangla}
          </h1>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
            {institutionName} • EIIN: 132244 • জেলা কোড: ৫০
          </p>

          <div className="inline-block mt-2 px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              টেবুলেশন শিট ও সামগ্রিক ফলাফল বিবরণী (TABULATION SHEET)
            </h2>
          </div>

          {/* Academic Context Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200">
            <div>
              <span className="font-bold">পরীক্ষার নাম: </span>
              <span>{examName}</span>
            </div>
            <div>
              <span className="font-bold">শিক্ষাবর্ষ: </span>
              <span className="font-mono">{academicYear}</span>
            </div>
            <div>
              <span className="font-bold">শ্রেণি ও ট্রেড: </span>
              <span>{classNameBangla} {tradeName ? `(${tradeName})` : ""}</span>
            </div>
            <div>
              <span className="font-bold">শিফট ও শাখা: </span>
              <span>{shift}, শাখা: {section}</span>
            </div>
          </div>
        </div>

        {/* 3. MAIN TABULATION DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-800 text-[10px] leading-tight">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 text-slate-900 dark:text-slate-100 text-center font-bold">
                <th rowSpan={2} className="border border-slate-800 p-1.5 w-10">
                  রোল
                </th>
                <th rowSpan={2} className="border border-slate-800 p-1.5 min-w-[130px] text-left">
                  শিক্ষার্থীর নাম ও আইডি
                </th>
                <th rowSpan={2} className="border border-slate-800 p-1.5 w-16">
                  ট্রেড
                </th>

                {/* Dynamic Subject Headers */}
                {subjects.map((sub) => (
                  <th
                    key={sub.code}
                    colSpan={7}
                    className="border border-slate-800 p-1 text-center bg-slate-50 dark:bg-slate-950"
                  >
                    <div className="truncate font-black">{sub.nameBangla || sub.name}</div>
                    <div className="text-[9px] font-mono text-slate-600 dark:text-slate-400 font-normal">
                      {sub.code} (পূর্ণমান: {sub.fullMarks})
                    </div>
                  </th>
                ))}

                {/* Overall Performance Columns */}
                <th colSpan={3} className="border border-slate-800 p-1 bg-slate-200 dark:bg-slate-700 text-center font-black">
                  চূড়ান্ত মূল্যায়ন
                </th>
              </tr>

              {/* Sub-Header Columns for Each Subject */}
              <tr className="bg-slate-50 dark:bg-slate-950 text-[9px] text-center font-semibold">
                {subjects.map((sub) => (
                  <React.Fragment key={`${sub.code}-sub`}>
                    <th className="border border-slate-800 p-0.5 w-7 text-indigo-950" title="Theory Continuous">
                      TC
                    </th>
                    <th className="border border-slate-800 p-0.5 w-7 text-cyan-950" title="Practical Continuous">
                      PC
                    </th>
                    <th className="border border-slate-800 p-0.5 w-7 text-blue-950" title="Theory Final">
                      TF
                    </th>
                    <th className="border border-slate-800 p-0.5 w-7 text-teal-950" title="Practical Final">
                      PF
                    </th>
                    <th className="border border-slate-800 p-0.5 w-8 font-bold" title="Total Marks">
                      মোট
                    </th>
                    <th className="border border-slate-800 p-0.5 w-7 font-bold" title="Letter Grade">
                      LG
                    </th>
                    <th className="border border-slate-800 p-0.5 w-7 font-bold" title="Grade Point">
                      GP
                    </th>
                  </React.Fragment>
                ))}

                <th className="border border-slate-800 p-1 w-10 font-bold bg-slate-100 dark:bg-slate-800">
                  মোট
                </th>
                <th className="border border-slate-800 p-1 w-11 font-black bg-slate-100 dark:bg-slate-800 text-indigo-950">
                  GPA
                </th>
                <th className="border border-slate-800 p-1 w-16 font-bold bg-slate-100 dark:bg-slate-800">
                  ফলাফল
                </th>
              </tr>
            </thead>

            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={subjects.length * 7 + 6}
                    className="border border-slate-800 p-8 text-center text-xs text-slate-500 dark:text-slate-400 italic"
                  >
                    কোনো শিক্ষার্থীর ফলাফল রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => {
                  const summary = student.semesterSummary;
                  const isPassed = summary.status === "Passed";
                  const isReferred = summary.status === "Referred";
                  const totalObtainedMarks = summary.subjectResults.reduce(
                    (sum, s) => sum + s.totalObtained,
                    0
                  );

                  return (
                    <tr
                      key={student.studentId}
                      className={`text-center transition-colors ${
                        idx % 2 === 1 ? "bg-slate-50/70" : "bg-white dark:bg-slate-900"
                      } hover:bg-indigo-50 dark:bg-indigo-950/40/40`}
                    >
                      {/* Roll */}
                      <td className="border border-slate-800 p-1 font-mono font-bold">
                        {toBengaliNumber(student.roll)}
                      </td>

                      {/* Name & ID */}
                      <td className="border border-slate-800 p-1 text-left">
                        <div className="font-extrabold text-[11px] leading-tight text-slate-900 dark:text-slate-100 truncate">
                          {student.nameBangla || student.name}
                        </div>
                        <div className="font-mono text-[9px] text-slate-500 dark:text-slate-400">
                          {student.studentId}
                        </div>
                      </td>

                      {/* Trade */}
                      <td className="border border-slate-800 p-1 text-[9px] font-mono font-semibold">
                        {student.tradeCode || student.tradeName || "-"}
                      </td>

                      {/* Subject Mark Breakdown */}
                      {subjects.map((sub) => {
                        const subResult = student.results.find((r) => r.code === sub.code);

                        if (!subResult) {
                          return (
                            <React.Fragment key={`${student.studentId}-${sub.code}`}>
                              <td className="border border-slate-800 p-0.5">-</td>
                              <td className="border border-slate-800 p-0.5">-</td>
                              <td className="border border-slate-800 p-0.5">-</td>
                              <td className="border border-slate-800 p-0.5">-</td>
                              <td className="border border-slate-800 p-0.5">-</td>
                              <td className="border border-slate-800 p-0.5">-</td>
                              <td className="border border-slate-800 p-0.5">-</td>
                            </React.Fragment>
                          );
                        }

                        const hasFailed = !subResult.isPassed || subResult.grade === "F";

                        return (
                          <React.Fragment key={`${student.studentId}-${sub.code}`}>
                            {/* TC */}
                            <td
                              className={`border border-slate-800 p-0.5 font-mono ${
                                !subResult.tc.isPassed ? "bg-rose-100 font-bold text-rose-700" : ""
                              }`}
                            >
                              {subResult.tc.obtained}
                            </td>

                            {/* PC */}
                            <td
                              className={`border border-slate-800 p-0.5 font-mono ${
                                subResult.pc && !subResult.pc.isPassed
                                  ? "bg-rose-100 font-bold text-rose-700"
                                  : ""
                              }`}
                            >
                              {subResult.pc ? subResult.pc.obtained : "-"}
                            </td>

                            {/* TF */}
                            <td
                              className={`border border-slate-800 p-0.5 font-mono ${
                                !subResult.tf.isPassed ? "bg-rose-100 font-bold text-rose-700" : ""
                              }`}
                            >
                              {subResult.tf.obtained}
                            </td>

                            {/* PF */}
                            <td
                              className={`border border-slate-800 p-0.5 font-mono ${
                                subResult.pf && !subResult.pf.isPassed
                                  ? "bg-rose-100 font-bold text-rose-700"
                                  : ""
                              }`}
                            >
                              {subResult.pf ? subResult.pf.obtained : "-"}
                            </td>

                            {/* Total Marks */}
                            <td
                              className={`border border-slate-800 p-0.5 font-mono font-bold ${
                                hasFailed ? "text-rose-600 bg-rose-50 dark:bg-rose-950/40" : ""
                              }`}
                            >
                              {subResult.totalObtained}
                            </td>

                            {/* Letter Grade */}
                            <td
                              className={`border border-slate-800 p-0.5 font-bold ${
                                hasFailed
                                  ? "bg-rose-200 text-rose-900 font-black"
                                  : subResult.grade === "A+"
                                  ? "text-emerald-700 font-black"
                                  : ""
                              }`}
                            >
                              {subResult.grade}
                            </td>

                            {/* Grade Point */}
                            <td
                              className={`border border-slate-800 p-0.5 font-mono font-bold ${
                                hasFailed ? "text-rose-700" : ""
                              }`}
                            >
                              {subResult.gradePoint.toFixed(2)}
                            </td>
                          </React.Fragment>
                        );
                      })}

                      {/* Cumulative Total */}
                      <td className="border border-slate-800 p-1 font-mono font-bold bg-slate-50 dark:bg-slate-950">
                        {toBengaliNumber(totalObtainedMarks)}
                      </td>

                      {/* Semester GPA */}
                      <td
                        className={`border border-slate-800 p-1 font-mono font-black text-[11px] ${
                          isPassed
                            ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40/50"
                            : "text-rose-700 bg-rose-50 dark:bg-rose-950/40/50"
                        }`}
                      >
                        {toBengaliNumber(summary.formattedGpa)}
                      </td>

                      {/* Result Status Badge */}
                      <td className="border border-slate-800 p-1 font-extrabold text-[9px]">
                        {isPassed ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            উত্তীর্ণ
                          </span>
                        ) : isReferred ? (
                          <span className="inline-block px-1 py-0.5 rounded bg-amber-100 text-amber-900" title={`Failed in: ${summary.failedSubjects.map((f) => f.code).join(", ")}`}>
                            রেফার্ড ({toBengaliNumber(summary.totalFailed)})
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-900">
                            অকৃতকার্য
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. GRADING SCALE LEGEND & STATISTICAL FOOTER */}
        <div className="mt-4 pt-3 border-t border-slate-300 dark:border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-3 text-[10px] text-slate-700 dark:text-slate-300">
          {/* Official BTEB Grade Legend */}
          <div className="md:col-span-8 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="font-bold block mb-1">
              কারিগরি শিক্ষা বোর্ড (BTEB) গ্রেডিং নীতি ও শর্তাবলি:
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 font-mono text-[9px]">
              <div>৮০%-১০০%: A+ (৫.০০)</div>
              <div>৭০%-৭৯%: A (৪.০০)</div>
              <div>৬০%-৬৯%: A- (৩.৫০)</div>
              <div>৫০%-৫৯%: B (৩.০০)</div>
              <div>৪০%-৪৯%: C (২.০০)</div>
              <div>৩৩%-৩৯%: D (১.০০)</div>
              <div className="text-rose-600 font-bold">&lt;৩৩% / F: (০.০০)</div>
            </div>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 italic">
              * নিয়ম অনুযায়ী তত্ত্বীয় ধারাবাহিক (TC), ব্যবহারিক ধারাবাহিক (PC), তত্ত্বীয় সমাপনী (TF) এবং ব্যবহারিক সমাপনী (PF)-এ পৃথকভাবে ৪০% পাস মার্কস অর্জন বাধ্যতামূলক। যেকোনো অংশে অনুত্তীর্ণ হলে সামগ্রিক ফলাফল F বিবেচিত হয়েছে।
            </p>
          </div>

          {/* Quick Statistics */}
          <div className="md:col-span-4 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-medium">
            <span className="font-bold block mb-1">ফলাফল পরিসংখ্যান:</span>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>মোট মূল্যায়িত শিক্ষার্থী:</span>
                <span className="font-bold font-mono">{toBengaliNumber(totalStudents)} জন</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>উত্তীর্ণ (Passed):</span>
                <span className="font-bold font-mono">{toBengaliNumber(totalPassed)} জন ({toBengaliNumber(passRate)}%)</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>রেফার্ড (Referred):</span>
                <span className="font-bold font-mono">{toBengaliNumber(totalReferred)} জন</span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>অকৃতকার্য (Failed):</span>
                <span className="font-bold font-mono">{toBengaliNumber(totalFailed)} জন</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. OFFICIAL SIGNATURE SLOTS */}
        <div className="mt-14 pt-4 grid grid-cols-4 gap-6 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
          <div>
            <div className="border-t border-dashed border-slate-900 pt-1.5 mx-4">
              শ্রেণি শিক্ষক
            </div>
            <div className="text-[9px] text-slate-500 dark:text-slate-400 font-normal font-mono">Class Teacher</div>
          </div>

          <div>
            <div className="border-t border-dashed border-slate-900 pt-1.5 mx-4">
              টেবুলেটর
            </div>
            <div className="text-[9px] text-slate-500 dark:text-slate-400 font-normal font-mono">Tabulator</div>
          </div>

          <div>
            <div className="border-t border-dashed border-slate-900 pt-1.5 mx-4">
              পরীক্ষা নিয়ন্ত্রক / বিভাগীয় প্রধান
            </div>
            <div className="text-[9px] text-slate-500 dark:text-slate-400 font-normal font-mono">Exam Controller</div>
          </div>

          <div>
            <div className="border-t border-dashed border-slate-900 pt-1.5 mx-4 font-black">
              অধ্যক্ষ
            </div>
            <div className="text-[9px] text-slate-500 dark:text-slate-400 font-normal font-mono">Principal & Seal</div>
          </div>
        </div>
      </div>
    </div>
  );
}
