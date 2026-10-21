import React, { Suspense } from "react";
import { Metadata } from "next";
import UnifiedGameAuthPortal from "@/components/auth/UnifiedGameAuthPortal";

export const metadata: Metadata = {
  title: "লগইন | পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)",
  description:
    "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) অফিসিয়াল নিরাপদ লগইন পোর্টাল।",
};

export default function RootLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 font-sans">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400">
              নিরাপদ পোর্টাল গেটওয়ে প্রস্তুত হচ্ছে...
            </p>
          </div>
        </div>
      }
    >
      <UnifiedGameAuthPortal />
    </Suspense>
  );
}
