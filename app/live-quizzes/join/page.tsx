"use client";

import React, { Suspense } from "react";
import { QuizSessionProvider } from "@/context/QuizSessionContext";
import LiveQuizJoinHeroView from "@/components/quiz/LiveQuizJoinHeroView";
import { Loader2 } from "lucide-react";

export default function LiveQuizzesJoinPage() {
  return (
    <QuizSessionProvider>
      <Suspense
        fallback={
          <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
            <span className="text-xs font-bold text-cyan-300 tracking-wider">
              লাইভ কুইজ পোর্টাল লোড হচ্ছে...
            </span>
          </div>
        }
      >
        <LiveQuizJoinHeroView />
      </Suspense>
    </QuizSessionProvider>
  );
}
