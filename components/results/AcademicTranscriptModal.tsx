"use client";

import React, { useRef } from "react";
import {
  Printer,
  Download,
  X,
  Award,
  CheckCircle2,
  Calendar,
  Building,
  GraduationCap,
  ShieldCheck,
  QrCode,
} from "lucide-react";
import { toBengaliNumerals } from "@/lib/utils";
import { GRADING_SCALE, calculateStudentOverallGpa } from "@/lib/resultCalculation";

interface AcademicTranscriptModalProps {
  student: any;
  marks: any[];
  examName?: string;
  academicYear?: number;
  institution?: any;
  summary?: any;
  onClose: () => void;
}

export default function AcademicTranscriptModal({
  student,
  marks,
  examName = "অর্ধবার্ষিক মূল্যায়ন ২০২৬",
  academicYear = 2026,
  institution,
  summary,
  onClose,
}: AcademicTranscriptModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Overall GPA calculation (Fallback if summary not provided)
  const localOverall = calculateStudentOverallGpa(
    marks.map((m) => ({
      grade: m.grade,
      gradePoint: m.gradePoint,
      totalMarks: m.totalMarks,
    }))
  );

  const overall = summary || localOverall;

  const totalMarksObtained = summary?.totalMarksObtained || marks.reduce((sum, m) => sum + (m.totalMarks || 0), 0);
  const totalMaxMarks = summary?.totalMaxMarks || marks.reduce((sum, m) => sum + (m.maxMarks || 100), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Modal Top Bar (hidden during print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-base sm:text-lg">
              অফিশিয়াল একাডেমিক ট্রান্সক্রিপ্ট ও নম্বরপত্র (Academic Transcript)
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              প্রিন্ট / PDF সংরক্ষণ
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Transcript Document Area */}
        <div ref={printAreaRef} className="p-6 sm:p-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans print:p-6 print:m-0">
          {/* Institutional Crest & Header */}
          <div className="border-b-2 border-slate-800 pb-5 mb-6 text-center relative">
            <div className="text-xs uppercase tracking-widest font-bold text-slate-600 dark:text-slate-400 mb-1">
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকার | কারিগরি শিক্ষা অধিদপ্তর
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {institution?.nameBangla || "পীরগঞ্জ টেকনিক্যাল স্কুল অ্যান্ড কলেজ (PTSC)"}
            </h1>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">
              {institution?.nameEnglish || "Pirganj Government Technical School and College"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              পীরগঞ্জ, রংপুর | ইআইআইএন (EIIN): ১৩৮৯৭৫ | কোড: ৫০১১৭ | বাংলাদেশ কারিগরি শিক্ষা বোর্ড
            </p>

            <div className="mt-4 inline-block px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700">
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                একাডেমিক গ্রেডশিট ও নম্বরপত্র | {examName} ({toBengaliNumerals(academicYear)})
              </span>
            </div>
          </div>

          {/* Student Demographic Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 text-sm mb-6">
            <div className="space-y-2">
              <div className="flex">
                <span className="w-32 text-slate-500 dark:text-slate-400 font-medium">শিক্ষার্থীর নাম:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {student?.nameBangla || student?.name}
                  {student?.name && student?.nameBangla && (
                    <span className="block text-xs font-normal text-slate-600 dark:text-slate-400">{student.name}</span>
                  )}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 dark:text-slate-400 font-medium">আইডি (Student ID):</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{student?.studentId || student?.studentCode}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 dark:text-slate-400 font-medium">ভর্তি নম্বর (Adm No):</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{student?.admissionNo || "ADM-2026-042"}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 dark:text-slate-400 font-medium">পিতার নাম:</span>
                <span className="text-slate-800 dark:text-slate-200">{student?.fatherName || "মোঃ কাওসার আহমেদ"}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 dark:text-slate-400 font-medium">মাতার নাম:</span>
                <span className="text-slate-800 dark:text-slate-200">{student?.motherName || "মোছাঃ পারভীন আক্তার"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex">
                <span className="w-32 text-slate-500 dark:text-slate-400 font-medium">শ্রেণি (Class):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{student?.className || "Class 9 (SSC Vocational)"}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 dark:text-slate-400 font-medium">রোল নম্বর (Roll):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                  {toBengaliNumerals(student?.roll || 1)} ({student?.roll})
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 dark:text-slate-400 font-medium">ট্রেড / বিভাগ:</span>
                <span className="font-semibold text-emerald-800">
                  {student?.tradeNameBangla || student?.tradeName || "সাধারণ (Pre-Vocational)"}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 dark:text-slate-400 font-medium">শাখা ও শিফট:</span>
                <span className="text-slate-800 dark:text-slate-200">শাখা {student?.section || "A"} | {student?.shift === "Morning" ? "প্রভাতি (Morning)" : "দিবা (Day)"}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 dark:text-slate-400 font-medium">উপস্থিতির হার:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {toBengaliNumerals(student?.attendanceRate || 95)}% (নিয়মিত শিক্ষার্থী)
                </span>
              </div>
            </div>
          </div>

          {/* Marks Breakdown Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-xs sm:text-sm border-collapse border border-slate-300 dark:border-slate-700">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-300 dark:border-slate-700">
                  <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center w-10">ক্র.</th>
                  <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 w-24">কোড</th>
                  <th className="p-2.5 border-r border-slate-300 dark:border-slate-700">বিষয় ও পত্র (Subject Name)</th>
                  <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center w-16">পূর্ণমান</th>
                  <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center w-16">তত্ত্বীয়</th>
                  <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center w-16">ব্যবহারিক</th>
                  <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center w-20">ধারাবাহিক</th>
                  <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center w-20 font-extrabold text-slate-900 dark:text-slate-100">মোট প্রাপ্ত</th>
                  <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center w-16">লেটার গ্রেড</th>
                  <th className="p-2.5 text-center w-16">গ্রেড পয়েন্ট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {marks && marks.length > 0 ? (
                  marks.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center font-medium text-slate-600 dark:text-slate-400">
                        {toBengaliNumerals(idx + 1)}
                      </td>
                      <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {m.subjectCode}
                      </td>
                      <td className="p-2.5 border-r border-slate-300 dark:border-slate-700">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{m.subjectNameBangla || m.subjectName}</div>
                        {m.subjectName && m.subjectNameBangla && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.subjectName}</div>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center text-slate-700 dark:text-slate-300">
                        {toBengaliNumerals(m.maxMarks || 100)}
                      </td>
                      <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center text-slate-700 dark:text-slate-300">
                        {toBengaliNumerals(m.theoryMarks ?? "-")}
                      </td>
                      <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center text-slate-700 dark:text-slate-300">
                        {toBengaliNumerals(m.practicalMarks || m.finalMarks || 0)}
                      </td>
                      <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center text-slate-700 dark:text-slate-300">
                        {toBengaliNumerals(Number(m.continuousAssessment || 0).toFixed(1))}
                      </td>
                      <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950">
                        {toBengaliNumerals(Number(m.totalMarks || 0).toFixed(1))}
                      </td>
                      <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            m.grade === "A+"
                              ? "bg-emerald-100 text-emerald-800"
                              : m.grade === "A"
                              ? "bg-blue-100 text-blue-800"
                              : m.grade === "F"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {m.grade}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-800 dark:text-slate-200">
                        {Number(m.gradePoint || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-slate-500 dark:text-slate-400 italic">
                      এই শিক্ষার্থীর জন্য এখনও পর্যন্ত কোনও বিষয়ের নম্বর এন্ট্রি করা হয়নি।
                    </td>
                  </tr>
                )}
              </tbody>
              {marks && marks.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <td colSpan={3} className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-right pr-4">
                      সর্বমোট প্রাপ্ত নম্বর ও ফলাফল:
                    </td>
                    <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center">
                      {toBengaliNumerals(totalMaxMarks)}
                    </td>
                    <td colSpan={3} className="p-2.5 border-r border-slate-300 dark:border-slate-700"></td>
                    <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center text-emerald-700 font-extrabold">
                      {toBengaliNumerals(totalMarksObtained.toFixed(1))}
                    </td>
                    <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center text-emerald-700 font-extrabold">
                      {overall.letterGrade}
                    </td>
                    <td className="p-2.5 text-center text-emerald-700 font-extrabold">
                      {overall.gpa}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Result Summary Card & BTEB Scale Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* GPA Summary Box */}
            <div className="md:col-span-1 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex flex-col justify-center items-center text-center">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                গ্রেড পয়েন্ট এভারেজ (GPA)
              </span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-950 my-1">
                {overall.gpa}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-emerald-800 font-medium">লেটার গ্রেড:</span>
                <span className="text-sm font-bold px-2.5 py-0.5 rounded bg-emerald-600 text-white">
                  {overall.letterGrade}
                </span>
              </div>
              <div className="mt-2 text-xs font-semibold text-emerald-900 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ফলাফল স্ট্যাটাস: {overall.resultStatus === "Passed" ? "উত্তীর্ণ (PASSED)" : "অনুত্তীর্ণ (FAILED)"}
              </div>
            </div>

            {/* BTEB Grading Scale Reference */}
            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 text-[11px] text-slate-700 dark:text-slate-300">
              <div className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) গ্রেডিং স্কেল নির্দেশিকা:
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 text-center font-mono">
                {GRADING_SCALE.map((g) => (
                  <div key={g.grade} className="bg-white dark:bg-slate-900 p-1 rounded border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{g.grade}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{g.minMark}-{g.maxMark}%</div>
                    <div className="text-[10px] font-semibold text-emerald-700">GP {g.point.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Official Signatures & Verification Block */}
          <div className="pt-12 border-t border-dashed border-slate-300 dark:border-slate-700 grid grid-cols-3 gap-6 text-center text-xs text-slate-700 dark:text-slate-300">
            <div>
              <div className="w-32 sm:w-40 border-b border-slate-700 mx-auto mb-1"></div>
              <div className="font-bold text-slate-900 dark:text-slate-100">শ্রেণি শিক্ষক</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Class Teacher</div>
            </div>
            <div>
              <div className="w-32 sm:w-40 border-b border-slate-700 mx-auto mb-1"></div>
              <div className="font-bold text-slate-900 dark:text-slate-100">বিভাগীয় প্রধান / পরীক্ষক</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Head of Department / Examiner</div>
            </div>
            <div>
              <div className="w-32 sm:w-40 border-b border-slate-700 mx-auto mb-1"></div>
              <div className="font-bold text-slate-900 dark:text-slate-100">অধ্যক্ষ / পরীক্ষা নিয়ন্ত্রক</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Principal / Exam Controller</div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400">
            <div>
              ইলেকট্রনিক্যালি জেনারেটেড সনদপত্র | মুদ্রণের তারিখ: {new Date().toLocaleDateString("bn-BD")}
            </div>
            <div className="font-mono">
              Verification Hash: PTSC-RES-{student?.roll}-{academicYear}-AUTH
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
