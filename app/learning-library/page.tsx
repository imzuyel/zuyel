"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

export default function LearningLibraryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/learning");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      <PublicHeader />
      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-8 rounded-3xl bg-slate-900 border border-slate-800">
          <BookOpen className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
          <h2 className="text-lg font-black">বিষয় ও লার্নিং প্ল্যাটফর্মে নিয়ে যাওয়া হচ্ছে...</h2>
          <p className="text-xs text-slate-400">
            স্বয়ংক্রিয়ভাবে রিডাইরেক্ট না হলে নিচের বাটনে ক্লিক করুন।
          </p>
          <Link
            href="/learning"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
          >
            <span>লার্নিং প্ল্যাটফর্মে প্রবেশ করুন</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
