"use client";

import React, { Suspense } from "react";
import StudentModern3DJoinCard from "@/components/quiz/StudentModern3DJoinCard";
import { Loader2 } from "lucide-react";

export default function JoinPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-950 p-4 sm:p-6 relative overflow-hidden">
      {/* Background Neon ambient spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] sm:w-[48rem] h-[32rem] sm:h-[48rem] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/10 to-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
            <span className="text-xs font-bold text-cyan-300 tracking-wider">
              পোর্টাল লোড হচ্ছে...
            </span>
          </div>
        }
      >
        <StudentModern3DJoinCard />
      </Suspense>
    </div>
  );
}
