"use client";

import React from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">
        সাময়িক ত্রুটি দেখা দিয়েছে
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        পৃষ্ঠাটি লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          পুনরায় চেষ্টা করুন
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
        >
          হোমে ফিরে যান
        </Link>
      </div>
    </div>
  );
}
