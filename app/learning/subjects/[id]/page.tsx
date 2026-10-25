"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Layers,
  Award,
  Clock,
  Zap,
  CheckCircle2,
  Lock,
  User,
  LogOut,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FolderOpen,
  Loader2,
  Flame,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import StudentLoginModal from "@/components/auth/StudentLoginModal";
import {
  getActiveStudentAccount,
  logoutStudentAccount,
  StudentAuthAccount,
} from "@/lib/studentIntelligenceStore";
import { CourseItem, CourseChapterItem } from "@/lib/chapterLearningEngine";
import { buildSubjectUrl, buildChapterUrl, buildLessonUrl } from "@/lib/learningSlugService";
import ChapterCard from "@/components/learning/ChapterCard";


interface SubjectPageProps {
  params: Promise<{ id: string }>;
}

export default function SubjectLessonsPage({ params }: SubjectPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [course, setCourse] = useState<CourseItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStudent, setActiveStudent] = useState<StudentAuthAccount | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [navigatingChapterId, setNavigatingChapterId] = useState<number | null>(null);

  // Student auth sync
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

  // Fetch Subject Course Details with all Chapters (Lessons) from database
  const fetchSubject = async () => {
    try {
      setLoading(true);
      setError(null);
      const studentRoll = activeStudent?.rollNumber;
      const url = studentRoll
        ? `/api/learning/courses/${id}?studentRoll=${encodeURIComponent(studentRoll)}`
        : `/api/learning/courses/${id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.course) {
        setCourse(data.course);
        router.replace(buildSubjectUrl(data.course));
        return;
      } else {
        setError(data.error || "বিষয়টির তথ্য পাওয়া যায়নি");
      }
    } catch (err: any) {
      console.error("Failed to load subject:", err);
      setError("সার্ভার থেকে বিষয়ের তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubject();
  }, [id, activeStudent?.rollNumber]);

  const handleLogout = () => {
    logoutStudentAccount();
    setActiveStudent(null);
  };

  const handleNavigateToChapter = (chapterId: number) => {
    if (navigatingChapterId) return;
    setNavigatingChapterId(chapterId);
    if (course) {
      const ch = course.chapters.find((c) => c.id === chapterId);
      if (ch) {
        if (ch.items && ch.items.length > 0) {
          const activeItem =
            ch.items.find(
              (it: any) => !it.isLocked && !it.progress?.isPassed && it.progress?.status !== "COMPLETED"
            ) ||
            ch.items.find((it: any) => !it.isLocked) ||
            ch.items[0];
          router.push(buildLessonUrl(course, ch, activeItem));
          return;
        }
        router.push(buildChapterUrl(course, ch));
        return;
      }
    }
    router.push(`/learning/lessons/${chapterId}`);
  };

  const enrichedCourse = course as any;
  const progressPercentage = enrichedCourse?.courseProgressPercentage ?? 0;
  const isCourseCompleted = enrichedCourse?.isCompleted ?? false;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white transition-colors duration-200">
      <PublicHeader />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 animate-fade-in overflow-x-clip">
        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            হোম
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
          <Link href="/learning" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            বিষয় ফিল্টার
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
          <span className="text-cyan-600 dark:text-cyan-300 font-bold truncate max-w-xs">
            {course ? course.titleBangla : "অধ্যায় তালিকা"}
          </span>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="p-12 sm:p-16 text-center bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">বিষয়ের তথ্য ও অধ্যায় তালিকা লোড হচ্ছে...</p>
          </div>
        ) : error || !course ? (
          <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900/80 rounded-2xl border border-rose-200 dark:border-rose-900/40 space-y-3 shadow-sm">
            <p className="text-rose-600 dark:text-rose-400 font-bold text-sm">{error || "বিষয় পাওয়া যায়নি"}</p>
            <Link
              href="/learning"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>বিষয় ফিল্টারে ফিরে যান</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Subject Hero Card - Compact & Elegant */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/20 p-5 sm:p-7 shadow-lg">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-black tracking-wide uppercase">
                        {course.className}
                      </span>
                      {course.tradeName && (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                          {course.tradeName}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 text-xs font-mono border border-slate-700/60">
                        কোড: {course.code}
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
                      {course.titleBangla}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                      {course.description || "এই বিষয়ের সকল অধ্যায়, পড়ার পার্ট ও কুইজ নিচের তালিকায় সাজানো রয়েছে। যেকোনো অধ্যায়ে ক্লিক করে লার্নিং পাথওয়েতে প্রবেশ করুন।"}
                    </p>
                  </div>

                  {/* Student Status Card */}
                  <div className="bg-slate-900/90 backdrop-blur-xl p-4 rounded-xl border border-indigo-500/30 space-y-2 shrink-0 text-center w-full lg:w-64">
                    {activeStudent ? (
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-2 text-xs text-indigo-200 font-bold">
                          <User className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="truncate">{activeStudent.studentName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          রোল: {activeStudent.rollNumber}
                        </div>
                        <div className="pt-2 border-t border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-400">অগ্রগতি:</span>
                            <span className={isCourseCompleted ? "text-emerald-400" : "text-cyan-400 font-mono"}>
                              {isCourseCompleted ? "সম্পন্ন" : `${progressPercentage}%`}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full mt-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-300 border border-rose-800/50 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>লগআউট</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-amber-300 font-bold">
                          অগ্রগতি সংরক্ষণের জন্য:
                        </p>
                        <button
                          onClick={() => setLoginModalOpen(true)}
                          className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                        >
                          <Lock className="w-3 h-3" />
                          <span>শিক্ষার্থী লগইন</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-800/80 text-xs text-slate-300 font-bold">
                  <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>মোট অধ্যায়: <strong className="text-white">{course.chapters.length}</strong> টি</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>
                      ব্লগ পার্ট:{" "}
                      <strong className="text-white">
                        {course.chapters.reduce(
                          (acc, ch) => acc + (ch.items?.filter((i) => i.itemType === "BLOG_PART").length || 0),
                          0
                        )}
                      </strong>{" "}
                      টি
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      কুইজ:{" "}
                      <strong className="text-white">
                        {course.chapters.reduce(
                          (acc, ch) => acc + (ch.items?.filter((i) => i.itemType === "QUIZ").length || 0),
                          0
                        )}
                      </strong>{" "}
                      টি
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>মোট রিওয়ার্ড: <strong className="text-white">{course.totalXp} XP</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chapters List Section (Step 2 Dedicated View) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    অধ্যায় ও পাঠ্যসূচি ({course.chapters.length} টি)
                  </h2>
                </div>
                <Link
                  href="/learning"
                  className="text-xs font-bold text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>অন্য বিষয় দেখুন</span>
                </Link>
              </div>

              {course.chapters.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    এই বিষয়ের অধীনে এখনো কোনো অধ্যায় যুক্ত করা হয়নি।
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {course.chapters.map((chapter, idx) => (
                    <ChapterCard
                      key={chapter.id}
                      chapter={chapter}
                      idx={idx}
                      activeStudent={activeStudent}
                      onNavigate={(ch) => !navigatingChapterId && handleNavigateToChapter(ch.id)}
                      isNavigating={navigatingChapterId === chapter.id}
                    />
                  ))}
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

