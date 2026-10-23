"use client";

import React, { useState } from "react";
import {
  Lock,
  UserCheck,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Cloud,
  GraduationCap,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  loginStudentAccount,
  updateStudentPassword,
  StudentAuthAccount,
  UNIVERSAL_DEFAULT_PASSWORD,
  STUDENT_LOGIN_CLASSES,
} from "@/lib/studentIntelligenceStore";

interface StudentLoginModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccessLogin?: (account: StudentAuthAccount) => void;
  onSuccess?: (account?: StudentAuthAccount) => void;
  defaultClass?: string;
}

export default function StudentLoginModal({
  isOpen,
  onClose,
  onSuccessLogin,
  onSuccess,
  defaultClass = "class-10",
}: StudentLoginModalProps) {
  if (isOpen !== undefined && !isOpen) return null;
  // Modal flow modes: 'login' | 'change_password'
  const [modalMode, setModalMode] = useState<"login" | "change_password">("login");

  // Login inputs
  const [selectedClass, setSelectedClass] = useState(defaultClass);
  const [loginRoll, setLoginRoll] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Change password inputs
  const [pendingAccount, setPendingAccount] = useState<StudentAuthAccount | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Login Submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const res = loginStudentAccount(loginRoll, loginPassword, selectedClass);
    setIsSubmitting(false);

    if (res.success) {
      if (res.requiresPasswordChange && res.account) {
        // First login detected with universal default password (1234)!
        setPendingAccount(res.account);
        setModalMode("change_password");
        setMessage({
          text: "প্রথমবার লগইনে ডিফল্ট পাসওয়ার্ড (1234) পরিবর্তন করে আপনার নতুন ব্যক্তিগত পাসওয়ার্ড সেট করুন।",
          isError: false,
        });
      } else if (res.account) {
        // Normal successful login
        try {
          document.cookie = "ptsc_user_role=student; path=/; max-age=86400; SameSite=Lax";
          document.cookie = "pgtsc_user_role=student; path=/; max-age=86400; SameSite=Lax";
          document.cookie = `ptsc_student_roll=${res.account.rollNumber}; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `ptsc_student_class=${res.account.classLevel}; path=/; max-age=86400; SameSite=Lax`;
        } catch (e) {}

        setMessage({ text: res.message, isError: false });
        setTimeout(() => {
          if (typeof onSuccessLogin === "function") {
            onSuccessLogin(res.account!);
          } else if (typeof onSuccess === "function") {
            onSuccess(res.account);
          }
          onClose();
        }, 700);
      }
    } else {
      setMessage({ text: res.message, isError: true });
    }
  };

  // Handle Force Change Password Submission
  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!pendingAccount) return;

    if (newPassword === UNIVERSAL_DEFAULT_PASSWORD) {
      setMessage({
        text: "নতুন পাসওয়ার্ড ডিফল্ট পাসওয়ার্ড (1234)-এর মতো হতে পারবে না। ভিন্ন পাসওয়ার্ড নির্ধারণ করুন।",
        isError: true,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        text: "উভয় পাসওয়ার্ড হুবহু মেলেনি। অনুগ্রহ করে সতর্কতার সাথে মিলিয়ে লিখুন।",
        isError: true,
      });
      return;
    }

    if (newPassword.trim().length < 4) {
      setMessage({
        text: "পাসওয়ার্ডের দৈর্ঘ্য কমপক্ষে ৪ ডিজিট বা অক্ষরের হতে হবে।",
        isError: true,
      });
      return;
    }

    setIsSubmitting(true);
    const res = updateStudentPassword(
      pendingAccount.rollNumber,
      newPassword.trim(),
      pendingAccount.classLevel
    );
    setIsSubmitting(false);

    if (res.success && res.account) {
      try {
        document.cookie = "ptsc_user_role=student; path=/; max-age=86400; SameSite=Lax";
        document.cookie = "pgtsc_user_role=student; path=/; max-age=86400; SameSite=Lax";
        document.cookie = `ptsc_student_roll=${res.account.rollNumber}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `ptsc_student_class=${res.account.classLevel}; path=/; max-age=86400; SameSite=Lax`;
      } catch (e) {}

      setMessage({ text: res.message, isError: false });
      setTimeout(() => {
        if (typeof onSuccessLogin === "function") {
          onSuccessLogin(res.account!);
        } else if (typeof onSuccess === "function") {
          onSuccess(res.account);
        }
        onClose();
      }, 900);
    } else {
      setMessage({ text: res.message, isError: true });
    }
  };

  const handleDemoFill = (cls: string = "class-10", roll: string = "101") => {
    setSelectedClass(cls);
    setLoginRoll(roll);
    setLoginPassword(UNIVERSAL_DEFAULT_PASSWORD);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-500/30 shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto my-auto flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/20 shrink-0 sticky top-0 z-20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Cloud className="w-3 h-3 text-cyan-400" />
                PTSC STUDENT PORTAL
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <span>
                {modalMode === "login"
                  ? "শিক্ষার্থী স্মার্ট লগইন ও ক্লাউড সিঙ্ক"
                  : "নতুন পাসওয়ার্ড সেটআপ"}
              </span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title="বন্ধ করুন"
            aria-label="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Status Alert Banner */}
          {message && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-fade-in leading-relaxed ${
                message.isError
                  ? "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400"
                  : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {message.isError ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </div>
              <span>{message.text}</span>
            </div>
          )}

          {modalMode === "login" ? (
            /* 1. STANDARD LOGIN FORM WITH CLASS + ROLL DISAMBIGUATION */
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              
              {/* Class / Academic Year Dropdown */}
              <div className="space-y-1.5">
                <label htmlFor="student-login-class" className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  শ্রেণি ও শিক্ষাবর্ষ (Class / Academic Year):
                </label>
                <div className="relative">
                  <select
                    id="student-login-class"
                    name="studentClass"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
                  >
                    {STUDENT_LOGIN_CLASSES.map((cls) => (
                      <option
                        key={cls.id}
                        value={cls.id}
                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        {cls.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  * একই রোল নম্বর একাধিক শ্রেণিতে থাকতে পারে, তাই আপনার সঠিক শ্রেণি নির্বাচন করুন।
                </p>
              </div>

              {/* Roll Number Input */}
              <div className="space-y-1.5">
                <label htmlFor="student-login-roll" className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  রোল নম্বর (Roll Number):
                </label>
                <input
                  type="text"
                  id="student-login-roll"
                  name="studentRoll"
                  autoComplete="username"
                  aria-label="রোল নম্বর"
                  required
                  placeholder="যেমন: 101, 102, 1"
                  value={loginRoll}
                  onChange={(e) => setLoginRoll(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="student-login-password" className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                    পাসওয়ার্ড (Password):
                  </label>
                  <span className="text-[10px] text-indigo-500 dark:text-cyan-400 font-bold">
                    ডিফল্ট: 1234
                  </span>
                </div>
                <input
                  type="password"
                  id="student-login-password"
                  name="studentPassword"
                  autoComplete="current-password"
                  aria-label="পাসওয়ার্ড"
                  required
                  placeholder="প্রথমবার লগইনে '1234' দিন"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400" />
                  <span>প্রথমবার লগইনের নিয়মাবলী:</span>
                </p>
                <p>
                  সকল শ্রেণির শিক্ষার্থীদের ডিফল্ট পাসওয়ার্ড হলো <strong className="font-mono text-indigo-600 dark:text-cyan-400 font-black">1234</strong>। প্রথমবার লগইনে সফলভাবে প্রবেশ করার পর ব্যক্তিগত নতুন পাসওয়ার্ড সেট করতে হবে।
                </p>
              </div>

              {/* Quick Conflict Demo Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  দ্রুত টেস্ট ডেমো অ্যাকাউন্ট:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDemoFill("class-10", "101")}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-cyan-400 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                  >
                    ১০ম শ্রেণি · রোল ১০১
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoFill("class-9", "101")}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-[11px] font-bold border border-purple-200 dark:border-purple-800 transition cursor-pointer"
                  >
                    ৯ম শ্রেণি · রোল ১০১
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoFill("class-8", "101")}
                    className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 text-[11px] font-bold border border-teal-200 dark:border-teal-800 transition cursor-pointer"
                  >
                    ৮ম শ্রেণি · রোল ১০১
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all active:scale-[0.99]"
              >
                <Lock className="w-4 h-4" />
                <span>লগইন করুন (Login)</span>
              </button>
            </form>
          ) : (
            /* 2. FORCE CHANGE PASSWORD FORM (FIRST LOGIN) */
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 animate-fade-in">
              
              {/* Identity Pill */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>{pendingAccount?.studentName}</span>
                </span>
                <span className="font-mono">রোল: {pendingAccount?.rollNumber}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  নতুন পাসওয়ার্ড দিন (New Password):
                </label>
                <input
                  type="password"
                  required
                  placeholder="কমপক্ষে ৪ অক্ষরের নতুন গোপন পাসওয়ার্ড"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  পাসওয়ার্ড নিশ্চিত করুন (Confirm Password):
                </label>
                <input
                  type="password"
                  required
                  placeholder="একই পাসওয়ার্ড পুনরায় লিখুন"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ সতর্কতা: নতুন পাসওয়ার্ডটি ডিফল্ট পাসওয়ার্ড (1234) থেকে আলাদা হতে হবে। পরবর্তী সকল লগইনে এই নতুন পাসওয়ার্ডটি ব্যবহৃত হবে।
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode("login");
                    setMessage(null);
                  }}
                  className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  ফিরে যান
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>পাসওয়ার্ড সংরক্ষণ ও লগইন করুন</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
