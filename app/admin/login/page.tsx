import React, { Suspense } from "react";
import { Metadata } from "next";
import BackendLoginView from "@/components/auth/BackendLoginView";

export const metadata: Metadata = {
  title: "প্রশাসনিক ব্যাকএন্ড লগইন | পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)",
  description:
    "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) এর প্রাতিষ্ঠানিক ও প্রশাসনিক ব্যাকএন্ড এক্সেস গেটওয়ে। শুধুমাত্র অনুমোদিত শিক্ষক ও প্রশাসনিক কর্মকর্তাদের জন্য সংরক্ষিত।",
};

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400">
              নিরাপদ লগইন গেটওয়ে প্রস্তুত হচ্ছে...
            </p>
          </div>
        </div>
      }
    >
      <BackendLoginView initialCallbackUrl="/admin" />
    </Suspense>
  );
}
