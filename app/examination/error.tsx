"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ExaminationErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Examination Error Boundary]:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4 sm:p-6">
      <Card className="max-w-md w-full border-slate-200/80 dark:border-slate-800/80 shadow-lg bg-white dark:bg-slate-900 rounded-3xl">
        <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 pt-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              পরীক্ষা মডিউলে ত্রুটি দেখা দিয়েছে
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              পরীক্ষার তালিকা বা ফলাফল প্রক্রিয়াকরণে সাময়িক সমস্যা হয়েছে। প্রধান ড্যাশবোর্ড ও মেন্যু অক্ষত রয়েছে।
            </p>
            {error?.digest && (
              <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 pt-1">
                ত্রুটি কোড: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => reset()}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              পুনরায় চেষ্টা করুন (Try Again)
            </Button>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-1.5 h-8 px-3 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ড্যাশবোর্ডে ফিরুন</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
