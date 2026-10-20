"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  Filter,
  GraduationCap,
  Layers,
  Award,
  Clock,
  Zap,
  CheckCircle2,
  Lock,
  User,
  LogOut,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Loader2,
  RotateCcw,
  Check,
  Trophy,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import StudentLoginModal from "@/components/auth/StudentLoginModal";
import {
  getActiveStudentAccount,
  logoutStudentAccount,
  StudentAuthAccount,
  getStudentLeaderboard,
} from "@/lib/studentIntelligenceStore";
import { CourseItem } from "@/lib/chapterLearningEngine";
import {
  doesClassHaveTrade,
  getApplicableTradesForClass,
  MANDATORY_FOUR_TRADES,
  parseClassNumeric,
} from "@/lib/academicStructure";
import { getSubjectIcon } from "@/components/learning/SequentialLearningPathView";
import StudentLearningLeaderboard from "@/components/learning/StudentLearningLeaderboard";

const ACADEMIC_CLASSES = [
  { id: "all", label: "সকল শ্রেণি (All Classes)" },
  { id: "6", label: "৬ষ্ঠ শ্রেণি (প্রাক-ভোকেশনাল · ট্রেড নেই)" },
  { id: "7", label: "৭ম শ্রেণি (প্রাক-ভোকেশনাল · ট্রেড নেই)" },
  { id: "8", label: "৮ম শ্রেণি (প্রাক-ভোকেশনাল · ট্রেড নেই)" },
  { id: "9", label: "৯ম শ্রেণি (ভোকেশনাল · ৪টি ট্রেড)" },
  { id: "10", label: "১০ম শ্রেণি (ভোকেশনাল · ৪টি ট্রেড)" },
  { id: "11", label: "একাদশ শ্রেণি (ভোকেশনাল · ৪টি ট্রেড)" },
  { id: "12", label: "দ্বাদশ শ্রেণি (ভোকেশনাল · ৪টি ট্রেড)" },
];

export default function LearningFilterPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedTrade, setSelectedTrade] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStudent, setActiveStudent] = useState<StudentAuthAccount | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [navigatingCourseId, setNavigatingCourseId] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState<"courses" | "leaderboard">("courses");

  // Current student rank and merit score info for header badge
  const studentRankInfo = useMemo(() => {
    if (!activeStudent?.rollNumber) return null;
    try {
      const list = getStudentLeaderboard("all", "all");
      const found = list.find((s) => s.rollNumber === activeStudent.rollNumber);
      return found ? { rank: found.rank, totalScore: found.totalScore, streakDays: found.streakDays } : null;
    } catch {
      return null;
    }
  }, [activeStudent?.rollNumber]);

  const classHasTrade = useMemo(() => {
    return doesClassHaveTrade(selectedClass);
  }, [selectedClass]);

  const applicableTrades = useMemo(() => {
    if (selectedClass === "all") return MANDATORY_FOUR_TRADES;
    return classHasTrade ? getApplicableTradesForClass(selectedClass) : [];
  }, [selectedClass, classHasTrade]);

  // Handle class selection with strict trade reset
  const handleSelectClass = (clsId: string) => {
    setSelectedClass(clsId);
    setSelectedTrade("all");
  };

  // Check student auth on mount
  useEffect(() => {
    setActiveStudent(getActiveStudentAccount());

    const handleAuthEvent = () => {
      setActiveStudent(getActiveStudentAccount());
    };

    window.addEventListener("ptsc_student_auth_changed", handleAuthEvent);
    window.addEventListener("ptsc_student_logout", handleAuthEvent);
    return () => {
      window.removeEventListener("ptsc_student_auth_changed", handleAuthEvent);
      window.removeEventListener("ptsc_student_logout", handleAuthEvent);
    };
  }, []);

  // Fetch courses from database
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const studentRoll = activeStudent?.rollNumber;
      const url = studentRoll
        ? `/api/learning/courses?studentRoll=${encodeURIComponent(studentRoll)}`
        : `/api/learning/courses`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.courses)) {
        setCourses(data.courses);
      }
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [activeStudent?.rollNumber]);

  // Handle logout
  const handleLogout = () => {
    logoutStudentAccount();
    setActiveStudent(null);
  };

  // Navigate to dedicated Subject Chapters Page (Step 2)
  const handleNavigateToSubject = (courseId: number) => {
    setNavigatingCourseId(courseId);
    router.push(`/learning/subjects/${courseId}`);
  };

  // Filtered Subject Courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // 1. Class filter
      if (selectedClass !== "all") {
        const clsNum = Number(selectedClass);
        if (course.numericClass !== clsNum && course.classId !== clsNum) {
          return false;
        }

        // 2. Strict Pre-Vocational Rule: Class 6, 7, 8 must NOT have trade courses
        if (!classHasTrade) {
          if (course.tradeCode && course.tradeCode !== "General" && course.tradeCode !== "GEN") {
            return false;
          }
        }
      }

      // 3. Trade filter for Classes 9-12
      if (selectedTrade !== "all") {
        const t = selectedTrade.toLowerCase();
        const matchesTrade =
          course.tradeCode === selectedTrade ||
          (course.tradeCode && course.tradeCode.toLowerCase().includes(t)) ||
          (course.code && course.code.toLowerCase().includes(t)) ||
          (course.tradeName && course.tradeName.toLowerCase().includes(t));
        if (!matchesTrade) {
          return false;
        }
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (course.title || "").toLowerCase().includes(q);
        const matchBangla = (course.titleBangla || "").toLowerCase().includes(q);
        const matchSubject = (course.subjectName || "").toLowerCase().includes(q);
        const matchCode = (course.code || "").toLowerCase().includes(q);
        const matchDesc = (course.description || "").toLowerCase().includes(q);
        if (!matchTitle && !matchBangla && !matchSubject && !matchCode && !matchDesc) {
          return false;
        }
      }

      return true;
    });
  }, [courses, selectedClass, selectedTrade, classHasTrade, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      <PublicHeader />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in">
        {/* Step Indicator Header (Step 1 of 3: Filter & Subjects) */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-cyan-400 border border-indigo-200 dark:border-indigo-800 font-mono">
            ধাপ ১ / ৩
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold">শ্রেণি ও বিষয় নির্বাচন</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">ধাপ ২: অধ্যায় তালিকা</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">ধাপ ৩: লার্নিং পাথওয়ে ও কুইজ</span>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-5 sm:p-8 shadow-xl text-white">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>PTSC Interactive Learning Platform</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400 shrink-0" />
                <span>বিষয় ও কারিকুলাম ফিল্টার</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-medium">
                শ্রেণি ও অনুমোদিত ট্রেড অনুযায়ী বিষয় নির্বাচন করুন। যেকোনো কার্ডে ক্লিক করলে সরাসরি ওই বিষয়ের সকল অধ্যায়ের তালিকা দেখতে পাবেন।
              </p>
            </div>

            {/* Student Auth Bar */}
            <div className="bg-slate-900/90 backdrop-blur-xl p-4 rounded-xl sm:rounded-2xl border border-indigo-500/30 space-y-2 shrink-0 text-center w-full lg:w-auto">
              {activeStudent ? (
                <div className="space-y-1.5">
                  <div className="text-xs text-indigo-200 font-bold flex items-center justify-center gap-2">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>স্বাগতম, <strong className="text-white">{activeStudent.studentName}</strong></span>
                  </div>
                  <div className="text-[11px] text-cyan-300 font-mono">
                    রোল: {activeStudent.rollNumber} • {activeStudent.classLevel || "PTSC"}
                  </div>
                  {studentRankInfo && (
                    <button
                      onClick={() => setCurrentTab("leaderboard")}
                      className="w-full px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 text-[11px] font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5 fill-current text-amber-400" />
                      <span>ক্লাস র‍্যাঙ্ক #{studentRankInfo.rank} • {studentRankInfo.totalScore} XP</span>
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-300 border border-rose-800/50 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>লগআউট</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-xs text-amber-300 font-bold">
                    কুইজ দেওয়া ও অগ্রগতি সংরক্ষণের জন্য:
                  </p>
                  <button
                    onClick={() => setLoginModalOpen(true)}
                    className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>শিক্ষার্থী লগইন করুন</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs: Courses vs Leaderboard */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setCurrentTab("courses")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              currentTab === "courses"
                ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>বিষয় ও কারিকুলাম তালিকা ({courses.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab("leaderboard")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              currentTab === "leaderboard"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500 fill-current" />
            <span>🏆 শিক্ষার্থী লিডারবোর্ড ও মেধা তালিকা</span>
          </button>
        </div>

        {currentTab === "leaderboard" ? (
          <StudentLearningLeaderboard onOpenLoginModal={() => setLoginModalOpen(true)} />
        ) : (
          <>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              <Filter className="w-4 h-4" />
              <span>শ্রেণি ও ট্রেড ফিল্টার</span>
            </div>
            {(selectedClass !== "all" || selectedTrade !== "all" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedClass("all");
                  setSelectedTrade("all");
                  setSearchQuery("");
                }}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ফিল্টার রিসেট</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="বিষয়ের নাম বা কোড খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              />
            </div>

            {/* Class Dropdown */}
            <div>
              <select
                value={selectedClass}
                onChange={(e) => handleSelectClass(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                {ACADEMIC_CLASSES.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Trade Dropdown */}
            <div>
              {!classHasTrade && selectedClass !== "all" ? (
                <div className="w-full p-2.5 bg-slate-100 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>ট্রেড প্রযোজ্য নয় (সাধারণ পাঠ্যক্রম)</span>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono">
                    ৬-৮ সাধারণ
                  </span>
                </div>
              ) : (
                <select
                  value={selectedTrade}
                  onChange={(e) => setSelectedTrade(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                >
                  <option value="all">
                    সকল অনুমোদিত ট্রেড ({applicableTrades.length} টি ট্রেড)
                  </option>
                  {applicableTrades.map((tr) => (
                    <option key={tr.id} value={tr.code}>
                      {tr.nameBangla} ({tr.code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Active Filter Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-bold">
            <div className="flex items-center gap-2">
              <span>উপলব্ধ বিষয়:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 font-mono text-[11px]">
                {filteredCourses.length} টি বিষয় পাওয়া গেছে
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              কার্ডে ক্লিক করে পরবর্তী ধাপে অধ্যায় তালিকা দেখুন
            </span>
          </div>
        </div>

        {/* Subject Cards Grid (Step 1) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
              <span>কারিকুলাম বিষয়সমূহ (Click Subject to View Chapters)</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              স্টেপ ২: বিষয়ের অধ্যায় তালিকায় যাওয়ার জন্য কার্ডে ক্লিক করুন
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">বিষয় তালিকা লোড হচ্ছে...</p>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredCourses.map((course) => {
                const totalLessons = course.chapters?.length || 0;
                const blogPartsCount = course.chapters?.reduce(
                  (acc, ch) => acc + (ch.items?.filter((it) => it.itemType === "BLOG_PART").length || 0),
                  0
                ) || 0;
                const quizzesCount = course.chapters?.reduce(
                  (acc, ch) => acc + (ch.items?.filter((it) => it.itemType === "QUIZ").length || 0),
                  0
                ) || 0;

                const enrichedCourse = course as any;
                const progressPercentage = enrichedCourse.courseProgressPercentage ?? 0;
                const isCompleted = enrichedCourse.isCompleted ?? false;
                const isNavigating = navigatingCourseId === course.id;
                const SubjectIcon = getSubjectIcon(course.tradeCode, course.code);

                return (
                  <div
                    key={course.id}
                    onClick={() => !navigatingCourseId && handleNavigateToSubject(course.id)}
                    className={`group bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md cursor-pointer relative overflow-hidden transform hover:-translate-y-0.5 ${
                      isNavigating
                        ? "border-cyan-500 ring-2 ring-cyan-500/30 opacity-80 pointer-events-none"
                        : "border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 dark:hover:border-cyan-500/40"
                    }`}
                  >
                    {/* Top Accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 opacity-70 group-hover:opacity-100 transition-opacity" />

                    <div className="space-y-3.5">
                      {/* Badge row */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-[10px] font-black border border-cyan-200 dark:border-cyan-800/60">
                            {course.className}
                          </span>
                          {course.tradeName && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800/60 truncate max-w-[120px]">
                              {course.tradeName}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {course.code}
                        </span>
                      </div>

                      {/* Subject Title & Icon Header */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-slate-700/80 group-hover:scale-105 transition-transform">
                          <SubjectIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-snug line-clamp-1">
                            {course.titleBangla}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5 truncate">
                            {course.title}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      {course.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-sans">
                          {course.description}
                        </p>
                      )}

                      {/* Metrics breakdown */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
                          <span>{totalLessons} টি অধ্যায় (Chapters)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{blogPartsCount} টি ব্লগ পাঠ</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>{quizzesCount} টি অনুশীলন কুইজ</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-emerald-500" />
                          <span>+{course.totalXp} XP পুরস্কার</span>
                        </div>
                      </div>

                      {/* Student Progress */}
                      {activeStudent && (
                        <div className="pt-1 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-400">অগ্রগতি:</span>
                            <span className={isCompleted ? "text-emerald-500" : "text-cyan-600 dark:text-cyan-400 font-mono font-bold"}>
                              {isCompleted ? "সম্পন্ন (100%)" : `${progressPercentage}%`}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Button with Loader */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        type="button"
                        disabled={navigatingCourseId !== null}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateToSubject(course.id);
                        }}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isNavigating
                            ? "bg-cyan-500 text-slate-950 shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-cyan-500 hover:text-slate-950 dark:hover:bg-cyan-500 dark:hover:text-slate-950"
                        }`}
                      >
                        {isNavigating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>অধ্যায় তালিকা লোড হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <span>অধ্যায় তালিকা দেখুন (View Chapters)</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">কোনো বিষয় পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                নির্বাচিত শ্রেণি বা ট্রেডে কোনো বিষয় মেলেনি। অনুগ্রহ করে ফিল্টার পরিবর্তন করুন।
              </p>
            </div>
          )}
        </div>
          </>
        )}
      </main>

      <PublicFooter />

      {/* Login Modal */}
      {loginModalOpen && (
        <StudentLoginModal
          onClose={() => setLoginModalOpen(false)}
          onSuccessLogin={(acc) => {
            setActiveStudent(acc);
            setLoginModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
