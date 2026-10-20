"use client";

import React from "react";
import { Printer, X, Download, ShieldCheck } from "lucide-react";
import { toBengaliNumerals, toBanglaDateString } from "@/lib/utils";
import { BtebAssessmentDatesConfig } from "./BtebAssessmentDatesModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  studentsRows: any[];
  subject: any;
  classNameStr: string;
  tradeNameStr?: string;
  academicYear: number;
  examName: string;
  assessmentDates: BtebAssessmentDatesConfig;
}

export default function BtebRegisterPrintSheet({
  isOpen,
  onClose,
  studentsRows,
  subject,
  classNameStr,
  tradeNameStr,
  academicYear,
  examName,
  assessmentDates,
}: Props) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDateShort = (d?: string) => {
    if (!d) return "-";
    try {
      const p = d.split("-");
      if (p.length === 3) return `${toBengaliNumerals(p[2])}/${toBengaliNumerals(p[1])}`;
      return d;
    } catch {
      return d;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-700 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="p-4 bg-slate-800 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                BTEB ধারাবাহিক মূল্যায়ন রেজিস্টার (ছবির মতো মুদ্রণযোগ্য খাতা)
              </h3>
              <p className="text-xs text-slate-300">
                বাংলাদেশ কারিগরি শিক্ষা বোর্ড প্রণীত অফিসিয়াল ছক ও ফরম্যাট
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition"
            >
              <Printer className="w-4 h-4" />
              প্রিন্ট করুন (Print Register)
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Register Sheet */}
        <div className="p-6 sm:p-8 overflow-y-auto font-sans bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 print:p-0 print:m-0 print:overflow-visible" id="bteb-print-container">
          {/* Institutional Header */}
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">বাংলাদেশ কারিগরি শিক্ষা বোর্ড, ঢাকা</div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 mt-0.5 tracking-tight">
              পাহাড়তলী গভঃ টেকনিক্যাল স্কুল ও কলেজ, চট্টগ্রাম
            </h1>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Pahartali, Chattogram • Website: www.pgtsc.gov.bd • Technical & Vocational Education
            </div>
            <div className="inline-block mt-2 px-5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-400 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-wide uppercase">
              ধারাবাহিক মূল্যায়ন রেজিস্টার / মার্কশিট (Continuous Assessment Sheet)
            </div>
          </div>

          {/* Academic Meta Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-300 dark:border-slate-700 p-2.5 rounded bg-slate-50 dark:bg-slate-950 mb-3">
            <div>
              <span className="font-semibold text-slate-600 dark:text-slate-400">শিক্ষাবর্ষ:</span>{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">{toBengaliNumerals(academicYear)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 dark:text-slate-400">শ্রেণি:</span>{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">{classNameStr}</span>
            </div>
            {tradeNameStr && (
              <div>
                <span className="font-semibold text-slate-600 dark:text-slate-400">ট্রেড:</span>{" "}
                <span className="font-bold text-slate-900 dark:text-slate-100">{tradeNameStr}</span>
              </div>
            )}
            <div>
              <span className="font-semibold text-slate-600 dark:text-slate-400">বিষয়:</span>{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {subject?.code} - {subject?.nameBangla || subject?.name}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 dark:text-slate-400">মূল্যায়ন:</span>{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">{examName}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 dark:text-slate-400">পূর্ণমান:</span>{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                তত্ত্বীয় ({toBengaliNumerals(subject?.theoryMax || 60)}) + ব্যবহারিক ({toBengaliNumerals(subject?.practicalMax || 40)}) = {toBengaliNumerals((subject?.theoryMax || 60) + (subject?.practicalMax || 40))}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 dark:text-slate-400">তারিখ:</span>{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">{toBanglaDateString(new Date().toISOString().split("T")[0])}</span>
            </div>
          </div>

          {/* Continuous Assessment Multi-Tier Grid (Matching the Physical Image) */}
          <div className="overflow-x-auto border border-slate-900 rounded">
            <table className="w-full text-center border-collapse text-[10px] leading-tight">
              <thead>
                {/* Header Row 1 */}
                <tr className="bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-b border-slate-900 font-bold">
                  <th rowSpan={3} className="border-r border-slate-900 p-1 w-8">ক্র: নং</th>
                  <th rowSpan={3} className="border-r border-slate-900 p-1 w-28 text-left pl-2">শিক্ষার্থীর নাম ও রোল</th>
                  <th rowSpan={3} className="border-r border-slate-900 p-1 w-10">মোট উপস্থিতি</th>
                  <th colSpan={11} className="border-r border-slate-900 p-1 bg-emerald-100">
                    তাত্ত্বিক ধারাবাহিক মূল্যায়ন (TC)
                  </th>
                  <th colSpan={13} className="border-r border-slate-900 p-1 bg-teal-100">
                    ব্যবহারিক ধারাবাহিক মূল্যায়ন (PC)
                  </th>
                  <th rowSpan={3} className="border-r border-slate-900 p-1 w-10 bg-slate-100 dark:bg-slate-800 font-extrabold">
                    মোট ধারাবাহিক (CA)
                  </th>
                  <th rowSpan={3} className="border-r border-slate-900 p-1 w-10 font-bold">তত্ত্বীয় চূড়ান্ত</th>
                  <th rowSpan={3} className="border-r border-slate-900 p-1 w-10 font-bold">ব্যবহারিক চূড়ান্ত</th>
                  <th rowSpan={3} className="border-r border-slate-900 p-1 w-10 font-extrabold bg-slate-200 dark:bg-slate-700">
                    সর্বমোট
                  </th>
                  <th rowSpan={3} className="border-r border-slate-900 p-1 w-8 font-bold">গ্রেড</th>
                  <th rowSpan={3} className="p-1 w-8 font-bold">জিপিএ</th>
                </tr>

                {/* Header Row 2 */}
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-900 font-semibold text-[9px]">
                  {/* TC Subheadings */}
                  <th colSpan={5} className="border-r border-slate-400 p-0.5">কুইজ টেস্ট</th>
                  <th colSpan={5} className="border-r border-slate-400 p-0.5">ক্লাস টেস্ট</th>
                  <th rowSpan={2} className="border-r border-slate-900 p-1 w-10 bg-emerald-50 dark:bg-emerald-950/40">
                    হাজিরা ও আচরণ
                  </th>
                  <th rowSpan={2} className="border-r border-slate-900 p-1 w-11 bg-amber-100 font-bold">
                    বর্ষমধ্য পরীক্ষা
                    <div className="text-[8px] font-normal text-slate-600 dark:text-slate-400">
                      {formatDateShort(assessmentDates.tcMidtermDate)}
                    </div>
                  </th>
                  <th rowSpan={2} className="border-r border-slate-900 p-1 w-10 bg-purple-50 dark:bg-purple-950/40">
                    অ্যাসাইনমেন্ট
                    <div className="text-[8px] font-normal text-slate-600 dark:text-slate-400">
                      {formatDateShort(assessmentDates.assignmentDate)}
                    </div>
                  </th>
                  <th rowSpan={2} className="border-r border-slate-900 p-1 w-10 bg-emerald-200 font-black">
                    মোট TC
                  </th>

                  {/* PC Subheadings */}
                  <th colSpan={9} className="border-r border-slate-400 p-0.5">ব্যবহারিক জব (Job / Experiment)</th>
                  <th rowSpan={2} className="border-r border-slate-900 p-1 w-10 bg-amber-50 dark:bg-amber-950/40 font-bold">
                    বর্ষমধ্য ব্যবহারিক
                    <div className="text-[8px] font-normal text-slate-600 dark:text-slate-400">
                      {formatDateShort(assessmentDates.pcMidtermDate)}
                    </div>
                  </th>
                  <th rowSpan={2} className="border-r border-slate-900 p-1 w-9 bg-indigo-50 dark:bg-indigo-950/40">
                    রিপোর্ট
                    <div className="text-[8px] font-normal text-slate-600 dark:text-slate-400">
                      {formatDateShort(assessmentDates.reportDate)}
                    </div>
                  </th>
                  <th rowSpan={2} className="border-r border-slate-900 p-1 w-9 bg-rose-50 dark:bg-rose-950/40">
                    মৌখিক
                    <div className="text-[8px] font-normal text-slate-600 dark:text-slate-400">
                      {formatDateShort(assessmentDates.vivaDate)}
                    </div>
                  </th>
                  <th rowSpan={2} className="border-r border-slate-900 p-1 w-10 bg-teal-50">
                    হাজিরা ও আচরণ
                  </th>
                  <th rowSpan={2} className="border-r border-slate-900 p-1 w-10 bg-teal-200 font-black">
                    মোট PC
                  </th>
                </tr>

                {/* Header Row 3 */}
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-900 text-[8px]">
                  {/* Quiz columns */}
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-6">১ম<br/>{formatDateShort(assessmentDates.quizDates[0])}</th>
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-6">২য়<br/>{formatDateShort(assessmentDates.quizDates[1])}</th>
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-6">৩য়<br/>{formatDateShort(assessmentDates.quizDates[2])}</th>
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-6">৪র্থ<br/>{formatDateShort(assessmentDates.quizDates[3])}</th>
                  <th className="border-r border-slate-400 p-0.5 w-7 font-bold bg-slate-200 dark:bg-slate-700">মোট</th>

                  {/* Class Test columns */}
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-6">১ম<br/>{formatDateShort(assessmentDates.classTestDates[0])}</th>
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-6">২য়<br/>{formatDateShort(assessmentDates.classTestDates[1])}</th>
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-6">৩য়<br/>{formatDateShort(assessmentDates.classTestDates[2])}</th>
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-6">৪র্থ<br/>{formatDateShort(assessmentDates.classTestDates[3])}</th>
                  <th className="border-r border-slate-400 p-0.5 w-7 font-bold bg-slate-200 dark:bg-slate-700">মোট</th>

                  {/* Jobs columns */}
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-5">১<br/>{formatDateShort(assessmentDates.jobDates[0])}</th>
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-5">২<br/>{formatDateShort(assessmentDates.jobDates[1])}</th>
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-5">৩<br/>{formatDateShort(assessmentDates.jobDates[2])}</th>
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-5">৪<br/>{formatDateShort(assessmentDates.jobDates[3])}</th>
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-5">৫<br/>{formatDateShort(assessmentDates.jobDates[4])}</th>
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-5">৬<br/>{formatDateShort(assessmentDates.jobDates[5])}</th>
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-5">৭<br/>{formatDateShort(assessmentDates.jobDates[6])}</th>
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-5">৮<br/>{formatDateShort(assessmentDates.jobDates[7])}</th>
                  <th className="border-r border-slate-400 p-0.5 w-6 font-bold bg-slate-200 dark:bg-slate-700">মোট</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-300 dark:divide-slate-700 text-[10px]">
                {studentsRows.map((stu, i) => (
                  <tr key={stu.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="border-r border-slate-900 p-1 font-mono font-bold">
                      {toBengaliNumerals(stu.roll || i + 1)}
                    </td>
                    <td className="border-r border-slate-900 p-1 text-left pl-2 font-medium">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{stu.nameBangla || stu.name}</div>
                      <div className="text-[8px] text-slate-500 dark:text-slate-400 font-mono">{stu.studentCode}</div>
                    </td>
                    <td className="border-r border-slate-900 p-1 font-mono">
                      {stu.totalAttendance ? toBengaliNumerals(stu.totalAttendance) : "-"}
                    </td>

                    {/* Quizzes 1-4 */}
                    {[0, 1, 2, 3].map((qIdx) => (
                      <td key={qIdx} className="border-r border-slate-300 dark:border-slate-700 p-0.5 font-mono">
                        {stu.quizzes?.[qIdx] !== undefined && stu.quizzes?.[qIdx] !== ""
                          ? toBengaliNumerals(stu.quizzes[qIdx])
                          : "-"}
                      </td>
                    ))}
                    <td className="border-r border-slate-400 p-0.5 font-mono font-bold bg-slate-50 dark:bg-slate-950">
                      {toBengaliNumerals(stu.quizTotal || 0)}
                    </td>

                    {/* Class Tests 1-4 */}
                    {[0, 1, 2, 3].map((cIdx) => (
                      <td key={cIdx} className="border-r border-slate-300 dark:border-slate-700 p-0.5 font-mono">
                        {stu.classTests?.[cIdx] !== undefined && stu.classTests?.[cIdx] !== ""
                          ? toBengaliNumerals(stu.classTests[cIdx])
                          : "-"}
                      </td>
                    ))}
                    <td className="border-r border-slate-400 p-0.5 font-mono font-bold bg-slate-50 dark:bg-slate-950">
                      {toBengaliNumerals(stu.classTestTotal || 0)}
                    </td>

                    {/* Attendance & Conduct */}
                    <td className="border-r border-slate-900 p-0.5 font-mono">
                      {stu.tcAttendanceConduct ? toBengaliNumerals(stu.tcAttendanceConduct) : "-"}
                    </td>

                    {/* Midterm Theory (বর্ষমধ্য পরীক্ষা) */}
                    <td className="border-r border-slate-900 p-0.5 font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-950">
                      {stu.midtermTheory !== undefined && stu.midtermTheory !== ""
                        ? toBengaliNumerals(stu.midtermTheory)
                        : "-"}
                    </td>

                    {/* Assignment */}
                    <td className="border-r border-slate-900 p-0.5 font-mono">
                      {stu.assignment ? toBengaliNumerals(stu.assignment) : "-"}
                    </td>

                    {/* TC Total */}
                    <td className="border-r border-slate-900 p-0.5 font-mono font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950">
                      {toBengaliNumerals(stu.tcTotal || 0)}
                    </td>

                    {/* Jobs 1-8 */}
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((jIdx) => (
                      <td key={jIdx} className="border-r border-slate-300 dark:border-slate-700 p-0.5 font-mono">
                        {stu.jobs?.[jIdx] !== undefined && stu.jobs?.[jIdx] !== ""
                          ? toBengaliNumerals(stu.jobs[jIdx])
                          : "-"}
                      </td>
                    ))}
                    <td className="border-r border-slate-400 p-0.5 font-mono font-bold bg-slate-50 dark:bg-slate-950">
                      {toBengaliNumerals(stu.jobsTotal || 0)}
                    </td>

                    {/* Midterm Practical */}
                    <td className="border-r border-slate-900 p-0.5 font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-950">
                      {stu.midtermPractical ? toBengaliNumerals(stu.midtermPractical) : "-"}
                    </td>

                    {/* Report */}
                    <td className="border-r border-slate-900 p-0.5 font-mono">
                      {stu.report ? toBengaliNumerals(stu.report) : "-"}
                    </td>

                    {/* Viva */}
                    <td className="border-r border-slate-900 p-0.5 font-mono">
                      {stu.viva ? toBengaliNumerals(stu.viva) : "-"}
                    </td>

                    {/* Practical Attendance & Conduct */}
                    <td className="border-r border-slate-900 p-0.5 font-mono">
                      {stu.pcAttendanceConduct ? toBengaliNumerals(stu.pcAttendanceConduct) : "-"}
                    </td>

                    {/* PC Total */}
                    <td className="border-r border-slate-900 p-0.5 font-mono font-black bg-teal-50 text-teal-950">
                      {toBengaliNumerals(stu.pcTotal || 0)}
                    </td>

                    {/* Continuous Assessment Total (CA) */}
                    <td className="border-r border-slate-900 p-0.5 font-mono font-extrabold bg-slate-100 dark:bg-slate-800">
                      {toBengaliNumerals((stu.continuousAssessment || 0).toFixed ? (stu.continuousAssessment || 0).toFixed(1) : stu.continuousAssessment)}
                    </td>

                    {/* Final Theory */}
                    <td className="border-r border-slate-900 p-0.5 font-mono">
                      {stu.theoryMarks ? toBengaliNumerals(stu.theoryMarks) : "-"}
                    </td>

                    {/* Final Practical */}
                    <td className="border-r border-slate-900 p-0.5 font-mono">
                      {stu.practicalMarks ? toBengaliNumerals(stu.practicalMarks) : "-"}
                    </td>

                    {/* Grand Total */}
                    <td className="border-r border-slate-900 p-0.5 font-mono font-black bg-slate-200 dark:bg-slate-700 text-slate-950">
                      {toBengaliNumerals((stu.totalMarks || 0).toFixed ? (stu.totalMarks || 0).toFixed(1) : stu.totalMarks)}
                    </td>

                    {/* Letter Grade */}
                    <td className="border-r border-slate-900 p-0.5 font-bold">
                      <span className={stu.grade === "F" ? "text-rose-700 font-black" : "text-emerald-800"}>
                        {stu.grade || "F"}
                      </span>
                    </td>

                    {/* Grade Point */}
                    <td className="p-0.5 font-mono font-bold">
                      {(stu.gradePoint || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Official Signatures Section */}
          <div className="mt-12 pt-6 grid grid-cols-3 gap-8 text-center text-xs font-semibold text-slate-800 dark:text-slate-200">
            <div>
              <div className="border-t border-slate-900 pt-1">
                বিষয় শিক্ষকের স্বাক্ষর ও তারিখ
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">(Subject Teacher)</div>
            </div>
            <div>
              <div className="border-t border-slate-900 pt-1">
                বিভাগীয় প্রধানের স্বাক্ষর ও তারিখ
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">(Head of Department)</div>
            </div>
            <div>
              <div className="border-t border-slate-900 pt-1">
                অধ্যক্ষ / উপাধ্যক্ষের প্রতিস্বাক্ষর ও সিল
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">(Principal / Vice-Principal)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
