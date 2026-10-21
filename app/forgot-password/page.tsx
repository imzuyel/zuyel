import React, { Suspense } from "react";
import { Metadata } from "next";
import ForgotPasswordView from "@/components/auth/ForgotPasswordView";

export const metadata: Metadata = {
  title: "পাসওয়ার্ড পুনরুদ্ধার | পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)",
  description:
    "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) এর নিরাপদ পাসওয়ার্ড পুনরুদ্ধার ও অ্যাকাউন্ট যাচাইকরণ পোর্টাল।",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400">
              নিরাপদ পাসওয়ার্ড পুনরুদ্ধার গেটওয়ে প্রস্তুত হচ্ছে...
            </p>
          </div>
        </div>
      }
    >
      <ForgotPasswordView />
    </Suspense>
  );
}
