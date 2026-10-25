"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, RotateCcw, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error Boundary]:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4 sm:p-6">
      <Card className="max-w-md w-full border-slate-200/80 dark:border-slate-800/80 shadow-lg bg-white dark:bg-slate-900 rounded-3xl">
        <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 pt-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <LayoutDashboard className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              ড্যাশবোর্ড মডিউলে ত্রুটি দেখা দিয়েছে
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              ড্যাশবোর্ড বা ডকুমেন্টস ডেটা লোড করার সময় অপ্রত্যাশিত ত্রুটি ঘটেছে। পুনরায় লোড করতে নিচের বাটনে ক্লিক করুন।
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

            <Link href="/" passHref legacyBehavior>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Home className="w-3.5 h-3.5" />}
              >
                হোমপেজ (Home)
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
