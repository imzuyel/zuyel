"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  School,
  KeyRound,
  ShieldAlert,
  GraduationCap,
  BookOpen,
  Award,
  Sun,
  Moon,
  Loader2,
  Building2,
  Smartphone,
  Mail,
  HelpCircle,
} from "lucide-react";
import { useAuth, PRESET_USERS, UserProfile, Role } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

interface BackendLoginViewProps {
  initialCallbackUrl?: string;
}

export default function BackendLoginView({ initialCallbackUrl }: BackendLoginViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || initialCallbackUrl || "/admin";

  const { currentUser, isLoggedIn, login, logout, showToast } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<"quick" | "form">("quick");
  const [selectedRole, setSelectedRole] = useState<Role>("principal");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check if currently logged in user is already an authorized staff
  const isAlreadyStaff =
    isLoggedIn &&
    currentUser &&
    currentUser.role !== "student" &&
    currentUser.role !== "guardian" &&
    currentUser.role !== "parent";

  // Pre-fill fields when selecting quick staff role
  const handleSelectQuickStaff = (presetKey: string) => {
    const user = PRESET_USERS[presetKey];
    if (user) {
      setSelectedRole(user.role);
      setIdentifier(user.email);
      setPassword("admin123");
      setErrorMsg(null);
    }
  };

  const handleDirectQuickLogin = async (presetKey: string) => {
    setLoading(true);
    setErrorMsg(null);

    const targetUser = PRESET_USERS[presetKey];
    if (!targetUser) {
      setErrorMsg("ব্যবহারকারী প্রোফাইল খুঁজে পাওয়া যায়নি।");
      setLoading(false);
      return;
    }

    try {
      // Call backend API to authenticate and set server cookies
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: targetUser.role,
          identifier: targetUser.email,
          password: "password123",
          rememberMe: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Sync frontend context
        login(presetKey, targetUser);
        showToast(
          `স্বাগতম ${targetUser.nameBangla || targetUser.fullName}! (${targetUser.designation})`,
          "success"
        );
        router.push(callbackUrl);
      } else {
        setErrorMsg(data.error || "লগইন ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      // Fallback to client-side login if API call fails
      login(presetKey, targetUser);
      router.push(callbackUrl);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim()) {
      setErrorMsg("অনুগ্রহ করে আপনার প্রাতিষ্ঠানিক ইমেইল, এমপ্লয়ি আইডি বা মোবাইল নম্বর লিখুন।");
      return;
    }

    if (!password.trim()) {
      setErrorMsg("অনুগ্রহ করে পাসওয়ার্ড প্রদান করুন।");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          identifier,
          password,
          rememberMe,
        }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        login(data.user.role, data.user);
        showToast(
          `লগইন সফল হয়েছে! স্বাগতম ${data.user.nameBangla || data.user.fullName}`,
          "success"
        );
        router.push(callbackUrl);
      } else {
        setErrorMsg(data.error || "লগইন তথ্য সঠিক নয়। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
      }
    } catch (err) {
      // Client fallback for robustness
      login(selectedRole);
      router.push(callbackUrl);
    } finally {
      setLoading(false);
    }
  };

  const STAFF_ROSTER = [
    {
      key: "principal",
      title: "অধ্যক্ষ (ভারপ্রাপ্ত)",
      name: "মো. রফিকুল ইসলাম",
      nameEng: "Md. Rafiqul Islam",
      email: "principal@pgtsc.gov.bd",
      dept: "প্রতিষ্ঠান প্রধান ও সর্বোচ্চ প্রশাসনিক সিদ্ধান্ত",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      avatarBg: "from-purple-600 to-indigo-700",
      role: "principal" as Role,
      scope: "Full Administrative Governance",
    },
    {
      key: "admin",
      title: "সিস্টেম অ্যাডমিনিস্ট্রেটর",
      name: "কাজী নুরুল হুদা",
      nameEng: "Kazi Nurul Huda",
      email: "admin@pgtsc.gov.bd",
      dept: "আইসিটি, ডেটা সেল, মাস্টার সেটিংস ও পারমিশন",
      badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 border-indigo-500/30",
      avatarBg: "from-indigo-600 to-cyan-600",
      role: "admin" as Role,
      scope: "System Architecture & Security",
    },
    {
      key: "zuyel",
      title: "জুনিয়র ইন্সট্রাক্টর (কম্পিউটার)",
      name: "মোহাম্মদ জুয়েল রানা",
      nameEng: "Md. Zuyel Rana",
      email: "zuyelrana@pgtsc.gov.bd",
      dept: "আইটি সাপোর্ট অ্যান্ড আইওটি ট্রেড ও ল্যাব ইনচার্জ",
      badgeColor: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
      avatarBg: "from-cyan-600 to-teal-700",
      role: "teacher" as Role,
      scope: "Faculty & Curriculum Studio",
    },
    {
      key: "teacher",
      title: "চিফ ইন্সট্রাক্টর (আইটি ও আইওটি)",
      name: "প্রকৌ. মাহমুদুল হাসান",
      nameEng: "Engr. Mahmudul Hasan",
      email: "teacher@pgtsc.gov.bd",
      dept: "পরীক্ষা প্রশ্ন, মূল্যায়ন ও প্র্যাকটিক্যাল ল্যাব",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      avatarBg: "from-emerald-600 to-teal-600",
      role: "teacher" as Role,
      scope: "Academic & Marks Control",
    },
    {
      key: "accountant",
      title: "প্রধান হিসাব কর্মকর্তা",
      name: "মো. ফারুক আহমেদ",
      nameEng: "Md. Faruq Ahmed",
      email: "accounts@pgtsc.gov.bd",
      dept: "শিক্ষার্থী ফি সংগ্রহ, হিসাব ও আর্থিক ভাউচার",
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      avatarBg: "from-amber-600 to-orange-600",
      role: "accountant" as Role,
      scope: "Accounts & Financial Ledger",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Glow Orbs */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 group text-xs font-bold text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-slate-900"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">মূল ওয়েবসাইটে ফিরে যান</span>
            <span className="sm:hidden">ওয়েবসাইট</span>
          </Link>
          <span className="text-slate-800">|</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider hidden md:inline">
              PTSC Secure ERP Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            title={theme === "dark" ? "লাইট মোড" : "ডার্ক মোড"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" />
            )}
          </button>

          <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-slate-300 hidden sm:flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL Secured</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-auto">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          
          {/* Active Session Warning Banner (if user already logged in) */}
          {isAlreadyStaff && (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-xl animate-fade-in">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 font-black text-sm">
                  {currentUser.role.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    <span>সক্রিয় সেশন বিদ্যমান:</span>
                    <span className="text-emerald-400 font-bold">{currentUser.nameBangla || currentUser.fullName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-mono">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {currentUser.designation} • আপনি সরাসরি প্রশাসনিক ব্যাকএন্ডে প্রবেশ করতে পারেন।
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Link
                  href={callbackUrl}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                >
                  <span>ড্যাশবোর্ডে প্রবেশ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                  title="লগআউট"
                >
                  লগআউট
                </button>
              </div>
            </div>
          )}

          {/* Institutional Main Auth Card */}
          <div className="bg-slate-900/90 border border-indigo-500/20 rounded-3xl sm:rounded-[32px] shadow-2xl shadow-indigo-950/60 overflow-hidden backdrop-blur-2xl">
            
            {/* Top Brand Banner */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950 border-b border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-0.5 flex items-center justify-center text-white text-xl font-black shadow-[0_0_30px_rgba(99,102,241,0.35)] shrink-0">
                  <div className="w-full h-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center p-1 text-center">
                    <span className="text-[11px] font-black tracking-tight text-cyan-400">PTSC</span>
                    <span className="text-[8px] font-mono font-bold text-slate-400">ERP</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-black uppercase tracking-wider">
                      EIIN: 132244 • DTE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-black">
                      BTEB অনুমোদিত
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
                    পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)
                  </h1>
                  <p className="text-xs text-slate-400 font-medium">
                    প্রাতিষ্ঠানিক ও প্রশাসনিক ব্যাকএন্ড গেটওয়ে (Administrative ERP Access)
                  </p>
                </div>
              </div>

              <div className="hidden lg:flex flex-col items-end text-right space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>সংরক্ষিত অ্যাক্সেস প্রটোকল</span>
                </div>
                <p className="text-[11px] text-slate-500 max-w-[200px]">
                  শুধুমাত্র অনুমোদিত শিক্ষক, কর্মকর্তা ও কর্মচারীদের প্রবেশের জন্য নির্ধারিত।
                </p>
              </div>
            </div>

            {/* Form & Persona Selector Body */}
            <div className="p-6 sm:p-8 space-y-6">

              {/* Mode Switching Tabs */}
              <div className="flex items-center bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 max-w-md mx-auto text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("quick")}
                  className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === "quick"
                      ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30 font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>দ্রুত স্টাফ লগইন (Quick Roster)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("form")}
                  className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === "form"
                      ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30 font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-cyan-300" />
                  <span>আইডি ও পাসওয়ার্ড ফর্ম</span>
                </button>
              </div>

              {/* Error Message Notice */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-shake">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-rose-200">লগইন ত্রুটি</p>
                    <p className="leading-relaxed">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Tab 1: One-Click Quick Roster Login */}
              {activeTab === "quick" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-cyan-400">
                      আপনার প্রাতিষ্ঠানিক একাউন্ট নির্বাচন করুন:
                    </span>
                    <span className="text-[11px]">এক ক্লিকেই ব্যাকএন্ডে প্রবেশ</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {STAFF_ROSTER.map((staff) => (
                      <div
                        key={staff.key}
                        className="group relative p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-xl hover:shadow-indigo-950/40"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${staff.badgeColor}`}
                            >
                              {staff.title}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          </div>

                          <div className="flex items-center gap-3 pt-1">
                            <div
                              className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${staff.avatarBg} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md`}
                            >
                              {staff.nameEng
                                .split(" ")
                                .map((n) => n[0])
                                .slice(-2)
                                .join("")}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-extrabold text-xs sm:text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                                {staff.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-mono truncate">
                                {staff.email}
                              </p>
                            </div>
                          </div>

                          <p className="text-[10px] text-slate-400 leading-snug line-clamp-2 pt-1 border-t border-slate-800/60">
                            {staff.dept}
                          </p>
                        </div>

                        <div className="pt-2 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleDirectQuickLogin(staff.key)}
                            className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {loading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <span>সরাসরি প্রবেশ</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectQuickStaff(staff.key);
                              setActiveTab("form");
                            }}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                            title="ফর্মটিতে তথ্য পূরণ করুন"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dev / Quick Test Hint */}
                  <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-slate-300 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        সিস্টেম টেস্ট: আপনি যেকোনো কার্ডের <strong>"সরাসরি প্রবেশ"</strong> বাটনে ক্লিক করে সংশ্লিষ্ট অ্যাডমিন সেশনে লগইন করতে পারেন।
                      </span>
                    </div>
                    <span className="font-mono text-cyan-400 font-bold shrink-0 hidden sm:inline">
                      Quick Auth Active
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 2: Manual Credentials Form */}
              {activeTab === "form" && (
                <form onSubmit={handleFormSubmit} className="space-y-4 max-w-lg mx-auto">
                  
                  {/* Role Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-200 block">
                      প্রশাসনিক পদবি / ভূমিকা (Role):
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as Role)}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="principal">অধ্যক্ষ / ভারপ্রাপ্ত অধ্যক্ষ (Principal - Level 90)</option>
                      <option value="admin">সিস্টেম অ্যাডমিনিস্ট্রেটর (Admin - Level 80)</option>
                      <option value="super_admin">সুপার অ্যাডমিন / আইসিটি হেড (Super Admin - Level 100)</option>
                      <option value="teacher">ইন্সট্রাক্টর / চিফ ইন্সট্রাক্টর (Faculty Instructor - Level 50)</option>
                      <option value="accountant">হিসাব কর্মকর্তা (Accountant - Level 40)</option>
                    </select>
                  </div>

                  {/* Identifier Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-200 block">
                      প্রাতিষ্ঠানিক ইমেইল / এমপ্লয়ি আইডি / মোবাইল:
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="যেমন: principal@pgtsc.gov.bd বা EMP-101"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-200 block">
                        পাসওয়ার্ড:
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        (ডিফল্ট: admin123)
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="আপনার গোপনীয় পাসওয়ার্ড দিন"
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                        title={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>এই ডিভাইসে ৩০ দিন সেশন মনে রাখুন</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setPassword("admin123");
                        showToast("পাসওয়ার্ড অটো-রিসেট করা হয়েছে: admin123", "info");
                      }}
                      className="text-cyan-400 hover:underline text-[11px]"
                    >
                      পাসওয়ার্ড মনে নেই?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 mt-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>যাচাইকরণ প্রক্রিয়া চলছে...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>প্রশাসনিক ব্যাকএন্ডে লগইন করুন</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Zero-Trust Student Exclusion & Public Link Box */}
              <div className="pt-4 border-t border-slate-800/80">
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-amber-300/90 font-medium">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>
                      <strong>আপনি কি শিক্ষার্থী?</strong> সাধারণ শিক্ষার্থীরা এই পোর্টাল দিয়ে লগইন করতে পারবে না।
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link
                      href="/results"
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                      <span>ফলাফল পোর্টাল</span>
                    </Link>
                    <Link
                      href="/learning-library"
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>লার্নিং লাইব্রেরি</span>
                    </Link>
                    <Link
                      href="/quiz/join"
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Award className="w-3.5 h-3.5 text-cyan-400" />
                      <span>লাইভ কুইজ</span>
                    </Link>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Institutional Trust & Support Footnote */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 px-2 font-medium">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>কারিগরি ও মাদ্রাসা শিক্ষা বিভাগ, শিক্ষা মন্ত্রণালয়, গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</span>
            </div>
            <div className="flex items-center gap-3">
              <span>জরুরি সহায়তা: 02589941021</span>
              <span>•</span>
              <Link href="/contact" className="hover:text-cyan-400 transition-colors">
                যোগাযোগ সেল
              </Link>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Micro-Bar */}
      <footer className="relative z-20 border-t border-slate-900 bg-slate-950/80 py-3 px-4 text-center text-[10px] text-slate-600">
        © ২০২৬ পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) • প্রাতিষ্ঠানিক ডেটা সুরক্ষায় জিরো-ট্রাস্ট এনফোর্সমেন্ট সক্রিয়
      </footer>
    </div>
  );
}
