"use client";

import React from "react";

interface PrintSignatureBlockProps {
  preparedByTitle?: string;
  preparedBySub?: string;
  verifiedByTitle?: string;
  verifiedBySub?: string;
  approvedByTitle?: string;
  approvedBySub?: string;
  institutionName?: string;
}

export default function PrintSignatureBlock({
  preparedByTitle = "প্রস্তুতকারী (সহকারী শিক্ষক)",
  preparedBySub = "PTSC Academic Staff",
  verifiedByTitle = "যাচাইকারী (ট্রেড ইনস্ট্রাক্টর/বিভাগীয় প্রধান)",
  verifiedBySub = "PTSC Academic Committee",
  approvedByTitle = "অনুমোদনকারী (অধ্যক্ষ মহোদয়)",
  approvedBySub = "Principal / Head of Institution",
  institutionName = "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
}: PrintSignatureBlockProps = {}) {
  return (
    <div className="print-signature-block print-only hidden mt-10 w-full pt-12 page-break-avoid">
      <div className="flex justify-between items-end w-full px-6">
        {/* Prepared By */}
        <div className="text-center w-48 space-y-1">
          <div className="border-t border-slate-600 dark:border-slate-400 w-full pt-1.5" />
          <p className="text-[11px] font-black text-slate-800 dark:text-slate-200">{preparedByTitle}</p>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">{preparedBySub}</p>
        </div>

        {/* Verified By HOD */}
        <div className="text-center w-48 space-y-1">
          <div className="border-t border-slate-600 dark:border-slate-400 w-full pt-1.5" />
          <p className="text-[11px] font-black text-slate-800 dark:text-slate-200">{verifiedByTitle}</p>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">{verifiedBySub}</p>
        </div>

        {/* Principal / HoD */}
        <div className="text-center w-48 space-y-1">
          <div className="border-t border-slate-600 dark:border-slate-400 w-full pt-1.5" />
          <p className="text-[11px] font-black text-slate-800 dark:text-slate-200">{approvedByTitle}</p>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">{approvedBySub}</p>
          <p className="text-[8px] text-slate-500 dark:text-slate-400 font-serif">{institutionName}</p>
        </div>
      </div>
    </div>
  );
}
