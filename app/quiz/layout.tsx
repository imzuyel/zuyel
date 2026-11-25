"use client";

import React from "react";
import { QuizSessionProvider } from "@/context/QuizSessionContext";
import { TechBackground } from "@/components/quiz/ui/TechVisuals";
import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isJoinPage = pathname === "/quiz/join" || pathname?.endsWith("/join");
  const isStudioRoot = pathname === "/quiz";

  return (
    <QuizSessionProvider>
      <div className="min-h-dvh w-full relative overflow-y-auto overflow-x-hidden pb-12 font-sans selection:bg-cyan-500 selection:text-slate-950 flex flex-col">
        <TechBackground />

        <main
          className={`relative z-10 w-full flex-1 flex flex-col items-center ${
            isStudioRoot
              ? "px-0 py-0"
              : isJoinPage
              ? "px-3 sm:px-6 py-4 sm:py-8 pb-12"
              : "px-3.5 sm:px-6 pt-20 sm:pt-24 pb-12"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full ${
                isStudioRoot
                  ? "w-full"
                  : isJoinPage
                  ? "max-w-lg mx-auto my-auto"
                  : "max-w-2xl mx-auto my-auto"
              }`}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        
        {/* Persistent Branding Header with Border Glow & Glassmorphism - Hidden on compact join page */}
        {!isJoinPage && (
          <div className="fixed top-0 left-0 right-0 p-3 sm:p-5 flex items-center justify-center z-30 pointer-events-none">
            <motion.div 
              initial={{ y: -25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.25)] pointer-events-auto"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 text-base sm:text-lg shadow-[0_0_15px_rgba(6,182,212,0.5)] font-bold">
                🎓
              </div>
              <div>
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] block leading-none mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  লাইভ কুইজ পোর্টাল
                </span>
                <h1 className="text-xs sm:text-sm font-black text-white leading-none tracking-wide">
                  PTSC ERP · শিক্ষার্থী জোন
                </h1>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </QuizSessionProvider>
  );
}
