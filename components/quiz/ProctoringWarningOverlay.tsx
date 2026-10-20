"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProctoringWarningOverlayProps {
  isOpen: boolean;
  onDismiss: () => void;
  strikes: number;
  maxStrikes?: number;
  message?: string;
  isDisqualified?: boolean;
}

export default function ProctoringWarningOverlay({
  isOpen,
  onDismiss,
  strikes,
  maxStrikes = 3,
  message,
  isDisqualified = false,
}: ProctoringWarningOverlayProps) {
  if (!isOpen) return null;

  const remaining = Math.max(0, maxStrikes - strikes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-rose-500/50 rounded-3xl p-6 text-center shadow-2xl shadow-rose-950/50 overflow-hidden space-y-5"
      >
        {/* Glowing Background Pulse */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-rose-500/20 border-2 border-rose-500/60 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/30">
          <ShieldAlert className="w-9 h-9 animate-bounce" />
        </div>

        {/* Header */}
        <div className="space-y-1">
          <span className="px-3 py-1 rounded-full bg-rose-950 border border-rose-500/40 text-[10px] font-black uppercase tracking-widest text-rose-300">
            {isDisqualified ? "নিরাপত্তা প্রটোকল সক্রিয়" : "অ্যান্টি-চিট সতর্কতা জারি"}
          </span>
          <h3 className="text-xl font-black text-white">
            {isDisqualified ? "পরীক্ষা অটো-সাবমিট হয়েছে!" : `সতর্কতা #${strikes} (${remaining}টি বাকি)`}
          </h3>
        </div>

        {/* Message body */}
        <div className="bg-slate-950/60 border border-rose-900/40 p-4 rounded-2xl text-xs text-slate-300 leading-relaxed font-semibold">
          {message || "পরীক্ষা চলাকালীন অন্য উইন্ডো, ট্যাব বা ফুলস্ক্রিন ত্যাগ করা নিষিদ্ধ।"}
        </div>

        {/* Strike Meter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>নিরাপত্তা স্ট্রাইক</span>
            <span className="text-rose-400 font-mono font-black">{strikes} / {maxStrikes}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 h-2">
            {Array.from({ length: maxStrikes }).map((_, idx) => (
              <div
                key={idx}
                className={`rounded-full transition-all ${
                  idx < strikes ? "bg-rose-500 shadow-xs shadow-rose-500" : "bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Explanation Alert */}
        <p className="text-[11px] text-slate-400 font-medium">
          {isDisqualified
            ? "৩টি সতর্কবার্তা অতিক্রম করায় আপনার উত্তরপত্র সুরক্ষিতভাবে জমা নেওয়া হয়েছে।"
            : "পুনরায় নিয়ম ভঙ্গ করলে পরীক্ষা তাৎক্ষণিক স্বয়ংক্রিয়ভাবে সমাপ্ত ঘোষণা করা হবে।"}
        </p>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>{isDisqualified ? "ফলাফল দেখুন" : "বুঝেছি, পরীক্ষায় ফিরে যান"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
