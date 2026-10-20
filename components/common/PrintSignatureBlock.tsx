"use client";

import React from "react";

export default function PrintSignatureBlock() {
  return (
    <div className="print-signature-block print-only hidden mt-10 w-full pt-12">
      <div className="flex justify-between items-end w-full px-6">
        {/* Prepared By */}
        <div className="text-center w-48 space-y-1">
          <div className="border-t border-slate-400 w-full pt-1.5" />
          <p className="text-[11px] font-black text-slate-800 dark:text-slate-200">প্রস্তুতকারী (সহকারী শিক্ষক)</p>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">PTSC Office Staff</p>
        </div>

        {/* Verified By HOD */}
        <div className="text-center w-48 space-y-1">
          <div className="border-t border-slate-400 w-full pt-1.5" />
          <p className="text-[11px] font-black text-slate-800 dark:text-slate-200">যাচাইকারী (ট্রেড ইনস্ট্রাক্টর/বিভাগীয় প্রধান)</p>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">PTSC Academic Committee</p>
        </div>

        {/* Principal / HoD */}
        <div className="text-center w-48 space-y-1">
          <div className="border-t border-slate-400 w-full pt-1.5" />
          <p className="text-[11px] font-black text-slate-800 dark:text-slate-200">অনুমোদনকারী (অধ্যক্ষ মহোদয়)</p>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">Principal / Head of Institution</p>
        </div>
      </div>
    </div>
  );
}
