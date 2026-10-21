"use client";

import React from "react";

interface PrintInstitutionalHeaderProps {
  documentTitle: string;
  classNameBangla?: string;
  tradeNameBangla?: string;
  academicYear?: string;
  institutionNameBangla?: string;
  institutionNameEnglish?: string;
  eiin?: string;
  btebCode?: string;
  establishedYear?: string;
  memoNumber?: string;
  subTitle?: string;
}

export default function PrintInstitutionalHeader({
  documentTitle,
  classNameBangla,
  tradeNameBangla,
  academicYear = "২০২৬",
  institutionNameBangla = "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
  institutionNameEnglish = "PANCHAGARH GOVT. TECHNICAL SCHOOL & COLLEGE",
  eiin = "132244",
  btebCode = "১৮০১৭",
  establishedYear = "১৯৯৯",
  memoNumber,
  subTitle,
}: PrintInstitutionalHeaderProps) {
  const currentDate = new Date().toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="w-full text-center space-y-2 border-b-2 border-double border-slate-600 dark:border-slate-400 pb-4 mb-5 print-only hidden">
      {/* Bangladesh Govt Logo Text representation */}
      <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none">
        গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
      </div>
      <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
        কারিগরি শিক্ষা অধিদপ্তর • ঢাকা
      </div>

      {/* Main Institution Header */}
      <div className="space-y-0.5">
        <h1 className="text-lg xl:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none uppercase">
          {institutionNameEnglish}
        </h1>
        <h2 className="text-base font-black text-slate-800 dark:text-slate-200 leading-tight">
          {institutionNameBangla}
        </h2>
        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold font-mono">
          স্থাপিত: {establishedYear} • EIIN: {eiin} • প্রতিষ্ঠান কোড: {btebCode}
        </p>
      </div>

      {/* Document Specific Info */}
      <div className="pt-1.5 space-y-1">
        <span className="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-400 dark:border-slate-600 text-xs font-black text-slate-900 dark:text-slate-100 tracking-wide inline-block uppercase">
          {documentTitle}
        </span>
        {subTitle && (
          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{subTitle}</p>
        )}
        
        <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-600 dark:text-slate-400 flex-wrap">
          {memoNumber && (
            <span>স্মারক নং: <strong className="text-slate-900 dark:text-slate-100 font-mono">{memoNumber}</strong></span>
          )}
          {classNameBangla && (
            <span>শ্রেণি: <strong className="text-slate-900 dark:text-slate-100">{classNameBangla}</strong></span>
          )}
          {tradeNameBangla && (
            <span>ট্রেড/বিষয়: <strong className="text-slate-900 dark:text-slate-100">{tradeNameBangla}</strong></span>
          )}
          <span>শিক্ষাবর্ষ: <strong className="text-slate-900 dark:text-slate-100">{academicYear}</strong></span>
          <span>মুদ্রণ তারিখ: <strong className="text-slate-900 dark:text-slate-100">{currentDate}</strong></span>
        </div>
      </div>
    </div>
  );
}
