"use client";

import React from "react";
import {
  User,
  ShieldCheck,
  Lock,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Flame,
  Award,
  LogOut,
  Sparkles,
  Info,
  Calendar,
  Phone,
  Mail,
  Layers,
} from "lucide-react";
import {
  StudentAuthAccount,
  logoutStudentAccount,
  getStudentStats,
  getQuizAttempts,
} from "@/lib/studentIntelligenceStore";
import { institutionalDb } from "@/lib/database";

interface StudentProfileViewProps {
  account: StudentAuthAccount;
  onLogout: () => void;
  onClose?: () => void;
}

export default function StudentProfileView({
  account,
  onLogout,
  onClose,
}: StudentProfileViewProps) {
  const stats = getStudentStats(account.rollNumber);
  const attempts = getQuizAttempts(account.rollNumber);

  // Find official student record in institutionalDb if available
  const officialRecord = React.useMemo(() => {
    return institutionalDb.students.find(
      (s) => String(s.roll) === String(account.rollNumber) || s.studentId === account.rollNumber
    );
  }, [account.rollNumber]);

  const regNo = officialRecord?.studentId || `BTEB-REG-2026-${account.rollNumber.padStart(4, "0")}`;
  const avatarUrl = officialRecord?.photoUrl || `https://picsum.photos/seed/ptsc_student_${account.rollNumber}/300/300`;
  const fatherName = officialRecord?.fatherName || "মোঃ রফিকুল ইসলাম";
  const session = officialRecord?.session || "2025-2026";
  const shift = officialRecord?.shiftBangla || "প্রথম শিফট";

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      
      {/* Profile Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          
          {/* Read-Only Official Avatar Container */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 shadow-xl overflow-hidden">
              <img
                src={avatarUrl}
                alt={account.studentName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-2xl bg-slate-800"
              />
            </div>
            
            {/* Read-Only Lock Badge */}
            <div
              className="absolute -bottom-2 inset-x-0 mx-auto w-fit px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-slate-700 text-[10px] font-bold text-amber-400 flex items-center gap-1 shadow-md whitespace-nowrap"
              title="অফিসিয়াল রেকর্ড ছবির পরিবর্তন কেবল টিচার/অ্যাডমিন প্যানেল থেকে করা সম্ভব"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span>সুরক্ষিত ছবি (Read-Only)</span>
            </div>
          </div>

          {/* Student Info Details */}
          <div className="space-y-2 text-center md:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider">
                অফিসিয়াল স্টুডেন্ট রেকর্ড
              </span>
              <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-cyan-300 border border-indigo-400/30 text-[10px] font-bold font-mono">
                সেশন: {session}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white truncate">
              {account.studentName}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span>রোল নম্বর: <strong className="text-cyan-300 font-mono font-black">{account.rollNumber}</strong></span>
              <span>•</span>
              <span>রেজিস্ট্রেশন নম্বর: <strong className="text-amber-300 font-mono font-black">{regNo}</strong></span>
            </p>

            <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-bold text-slate-300">
              <span className="px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80">
                {account.classLevel}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80">
                ট্রেড: {account.trade}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80">
                {shift}
              </span>
            </div>
          </div>

          {/* Logout & Action Button */}
          <div className="shrink-0 space-y-2 w-full md:w-auto text-center">
            <button
              onClick={() => {
                onLogout();
                if (onClose) onClose();
              }}
              className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>লগআউট করুন</span>
            </button>
          </div>

        </div>
      </div>

      {/* Read-Only Photo Upload Restriction Notice */}
      <div className="p-4 bg-amber-500/10 dark:bg-amber-950/30 rounded-2xl border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-black block">
            প্রোফাইল ছবি সংক্রান্ত সিকিউরিটি নীতি (Profile Photo Policy):
          </strong>
          <p className="text-[11px] leading-relaxed">
            বিটিইবি সরকারি রেজিস্ট্রেশন নিয়ম অনুযায়ী, শিক্ষার্থীরা ফ্রন্টএন্ড থেকে প্রোফাইল ছবি সরাসরি আপলোড বা পরিবর্তন করতে পারবেন না। আপনার ছবি পরিবর্তন করতে ইনস্টিটিউটের অ্যাডমিন/শিক্ষক প্যানেলে সরাসরি যোগাযোগ করুন।
          </p>
        </div>
      </div>

      {/* Academic Credentials Card & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: BTEB Identity Details */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
              <span>বিটিইবি ও ইনস্টিটিউশনাল আইডি পরিচিতি</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
              সক্রিয় রেকর্ড
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">পিতার নাম</span>
              <p className="font-bold text-slate-900 dark:text-white">{fatherName}</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">ইনস্টিটিউট</span>
              <p className="font-bold text-slate-900 dark:text-white">পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">EIIN কোড</span>
              <p className="font-bold text-slate-900 dark:text-white font-mono">132244</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">অনলাইন ক্লাউড স্ট্যাটাস</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>স্থায়ী সিঙ্ক চালু রয়েছে</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Quick Learning Stats */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Award className="w-5 h-5 text-amber-500" />
            <span>শিক্ষার্থীর অনলাইন রেকর্ড</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">পঠিত পাঠ:</span>
              <strong className="text-sm font-black font-mono text-indigo-600 dark:text-cyan-400">{stats.completedLessonsCount} টি</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">সম্পন্ন কুইজ:</span>
              <strong className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">{stats.quizzesTakenCount} টি</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">লগইন স্ট্রিক:</span>
              <strong className="text-sm font-black font-mono text-amber-500 flex items-center gap-1">
                <Flame className="w-4 h-4 fill-current" />
                <span>{stats.currentStreakDays} দিন</span>
              </strong>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
