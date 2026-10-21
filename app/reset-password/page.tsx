import React, { Suspense } from "react";
import { Metadata } from "next";
import ResetPasswordView from "@/components/auth/ResetPasswordView";

export const metadata: Metadata = {
  title: "নতুন পাসওয়ার্ড নির্ধারণ | পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)",
  description:
    "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) এর নিরাপদ পাসওয়ার্ড পুনর্নির্ধারণ।",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400">
              পাসওয়ার্ড পুনর্নির্ধারণ পোর্টাল প্রস্তুত হচ্ছে...
            </p>
          </div>
        </div>
      }
    >
      <ResetPasswordView />
    </Suspense>
  );
}
