"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Root Error Boundary]:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 py-12">
      <Card className="max-w-md w-full border-slate-200/80 dark:border-slate-800/80 shadow-lg">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-5 pt-8">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertOctagon className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              সাময়িক ত্রুটি দেখা দিয়েছে
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              অনুরোধকৃত পৃষ্ঠা বা মডিউলটি লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।
            </p>
            {error?.digest && (
              <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                ত্রুটি কোড: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => reset()}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              পুনরায় চেষ্টা করুন (Try Again)
            </Button>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>হোমপেজ (Home)</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
