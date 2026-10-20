"use client";

import React from "react";
import { QuizSessionProvider } from "@/context/QuizSessionContext";
import { TechBackground } from "@/components/quiz/ui/TechVisuals";
import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isJoinPage = pathname === "/quiz/join" || pathname?.endsWith("/join");

  return (
    <QuizSessionProvider>
      <div className="h-screen max-h-screen w-full relative overflow-hidden font-sans selection:bg-cyan-500 selection:text-slate-950">
        <TechBackground />
        
        <main
          className={`relative z-10 w-full flex flex-col items-center justify-center ${
            isJoinPage
              ? "h-screen max-h-screen overflow-hidden px-2.5 sm:px-4 py-2"
              : "min-h-screen px-3.5 sm:px-6 pt-16 sm:pt-24 lg:pt-28 pb-8 sm:pb-16 overflow-y-auto"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full ${isJoinPage ? "max-w-md sm:max-w-lg h-full flex flex-col justify-center" : "max-w-xl mx-auto"}`}
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
