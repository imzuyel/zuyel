"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Layers,
  Award,
  Zap,
  CheckCircle2,
  Lock,
  User,
  LogOut,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  FolderOpen,
  Loader2,
  Flame,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import StudentLoginModal from "@/components/auth/StudentLoginModal";
import GamifiedEdTechBackground from "@/components/learning/GamifiedEdTechBackground";
import {
  getActiveStudentAccount,
  logoutStudentAccount,
  StudentAuthAccount,
} from "@/lib/studentIntelligenceStore";
import { CourseItem } from "@/lib/chapterLearningEngine";
import {
  buildChapterUrl,
  buildLessonUrl,
  resolveCourse,
} from "@/lib/learningSlugService";

interface SubjectPageProps {
  params: Promise<{ class: string; subject: string }>;
}

export default function DedicatedSubjectPage({ params }: SubjectPageProps) {
  const router = useRouter();
  const { class: classParam, subject: subjectParam } = use(params);

  const [course, setCourse] = useState<CourseItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStudent, setActiveStudent] = useState<StudentAuthAccount | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [navigatingChapterId, setNavigatingChapterId] = useState<number | null>(null);

  // Sync active student
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

  // Fetch subject details with slug resolution
  const fetchSubject = async () => {
    try {
      setLoading(true);
      setError(null);
      const studentRoll = activeStudent?.rollNumber;

      // 1. Fetch courses list to resolve slug accurately
      const listRes = await fetch("/api/learning/courses");
      const listData = await listRes.json();
      if (!listData.success || !Array.isArray(listData.courses)) {
        throw new Error("বিষয়ের তালিকা লোড করা যায়নি");
      }

      const matchedCourse = resolveCourse(classParam, subjectParam, listData.courses);
      if (!matchedCourse) {
        setError("অনুরোধকৃত বিষয় বা কারিকুলাম পাওয়া যায়নি");
        return;
      }

      // 2. Fetch enriched course data by course ID
      const courseUrl = studentRoll
        ? `/api/learning/courses/${matchedCourse.id}?studentRoll=${encodeURIComponent(studentRoll)}`
        : `/api/learning/courses/${matchedCourse.id}`;

      const res = await fetch(courseUrl);
      const data = await res.json();
      if (data.success && data.course) {
        setCourse(data.course);
      } else {
        setCourse(matchedCourse);
      }
    } catch (err: any) {
      console.error("Failed to load subject by slug:", err);
      setError("সার্ভার থেকে বিষয়ের তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubject();
  }, [classParam, subjectParam, activeStudent?.rollNumber]);

  const handleLogout = () => {
    logoutStudentAccount();
    setActiveStudent(null);
  };

  const handleNavigateToChapter = (chapter: any, specificItem?: any) => {
    if (navigatingChapterId || !course) return;
    if (specificItem?.isLocked && !activeStudent) {
      setLoginModalOpen(true);
      return;
    }
    setNavigatingChapterId(chapter.id);

    // If a specific item was clicked, navigate directly to it
    if (specificItem) {
      const targetUrl = buildLessonUrl(course, chapter, specificItem);
      router.push(targetUrl);
      return;
    }

    // Otherwise find the first uncompleted active milestone (or first item)
    if (chapter.items && chapter.items.length > 0) {
      const activeItem =
        chapter.items.find(
          (it: any) => !it.isLocked && !it.progress?.isPassed && it.progress?.status !== "COMPLETED"
        ) ||
        chapter.items.find((it: any) => !it.isLocked) ||
        chapter.items[0];
      const targetUrl = buildLessonUrl(course, chapter, activeItem);
      router.push(targetUrl);
    } else {
      const targetUrl = buildChapterUrl(course, chapter);
      router.push(targetUrl);
    }
  };

  const enrichedCourse = course as any;
  const progressPercentage = enrichedCourse?.courseProgressPercentage ?? 0;
  const isCourseCompleted = enrichedCourse?.isCompleted ?? false;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white transition-colors duration-200 relative overflow-x-clip">
      {/* Gamified EdTech Background Canvas */}
      <GamifiedEdTechBackground variant="subject" showGadgets={true} showQuizFormulas={true} />

      <PublicHeader />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 relative z-10 animate-fade-in">
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
            {course ? course.titleBangla : subjectParam}
          </span>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="p-12 sm:p-16 text-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xl">
            <Loader2 className="w-9 h-9 border-cyan-500 animate-spin mx-auto text-cyan-500" />
            <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">
              বিষয়ের তথ্য ও অধ্যায় তালিকা লোড হচ্ছে...
            </p>
          </div>
        ) : error || !course ? (
          <div className="p-8 sm:p-12 text-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-rose-200 dark:border-rose-900/40 space-y-4 shadow-xl">
            <p className="text-rose-600 dark:text-rose-400 font-bold text-sm">
              {error || "বিষয় পাওয়া যায়নি"}
            </p>
            <Link
              href="/learning"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>বিষয় ফিল্টারে ফিরে যান</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Subject Hero Card with Gamified Badges */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 p-5 sm:p-8 shadow-2xl">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-black tracking-wide uppercase shadow-xs">
                        {course.className}
                      </span>
                      {course.tradeName && (
                        <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold shadow-xs">
                          {course.tradeName}
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full bg-slate-800/90 text-slate-300 text-xs font-mono border border-slate-700/60">
                        কোড: {course.code}
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
                      {course.titleBangla}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-medium">
                      {course.description ||
                        "এই বিষয়ের সকল অধ্যায় ও লার্নিং পাথওয়ে রোডম্যাপ নিচে সাজানো রয়েছে। যেকোনো অধ্যায়ে ক্লিক করে বিশ্বমানের গেমিফাইড লার্নিংয়ে প্রবেশ করুন।"}
                    </p>
                  </div>

                  {/* Student Status Card */}
                  <div className="bg-slate-900/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-indigo-500/30 space-y-2.5 shrink-0 text-center w-full lg:w-72 shadow-lg">
                    {activeStudent ? (
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-2 text-xs text-indigo-200 font-bold">
                          <User className="w-4 h-4 text-emerald-400" />
                          <span className="truncate">{activeStudent.studentName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          রোল: {activeStudent.rollNumber} • {activeStudent.classLevel || "PTSC"}
                        </div>
                        <div className="pt-2 border-t border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-400">সামগ্রিক অগ্রগতি:</span>
                            <span className={isCourseCompleted ? "text-emerald-400 font-black" : "text-cyan-400 font-mono font-black"}>
                              {isCourseCompleted ? "সম্পন্ন ✨" : `${progressPercentage}%`}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full mt-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 border border-rose-800/50 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>লগআউট</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-amber-300 font-bold">
                          কুইজ ও অগ্রগতি সংরক্ষণের জন্য:
                        </p>
                        <button
                          onClick={() => setLoginModalOpen(true)}
                          className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>শিক্ষার্থী লগইন</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300 font-bold">
                  <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>মোট অধ্যায়: <strong className="text-white">{course.chapters.length}</strong> টি</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
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
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      কুইজ পরীক্ষা:{" "}
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
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>মোট রিওয়ার্ড: <strong className="text-white">{course.totalXp} XP</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chapters Grid Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    অধ্যায় ও শিক্ষণ রোডম্যাপ ({course.chapters.length} টি)
                  </h2>
                </div>
                <Link
                  href="/learning"
                  className="text-xs font-bold text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>অন্যান্য বিষয়</span>
                </Link>
              </div>

              {course.chapters.length === 0 ? (
                <div className="p-8 text-center bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    এই বিষয়ের অধীনে এখনো কোনো অধ্যায় যুক্ত করা হয়নি।
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {course.chapters.map((chapter, idx) => {
                    const blogParts = chapter.items?.filter((it) => it.itemType === "BLOG_PART") || [];
                    const quizzes = chapter.items?.filter((it) => it.itemType === "QUIZ") || [];
                    const totalMarks = quizzes.reduce((sum, qz) => {
                      const marks = qz.quizQuestions?.reduce((qm, q) => qm + (q.marks || 1), 0) || (qz.quizQuestions?.length ? qz.quizQuestions.length * 1 : 5);
                      return sum + marks;
                    }, 0);
                    const totalChapterXp = chapter.items?.reduce((s, it) => s + (it.xpReward || 0), 0) || 0;

                    const enrichedChapter = chapter as any;
                    const isCompleted = enrichedChapter.isCompleted ?? false;
                    const isNavigating = navigatingChapterId === chapter.id;

                    return (
                      <div
                        key={chapter.id}
                        onClick={() => !navigatingChapterId && handleNavigateToChapter(chapter)}
                        className={`rgb-neon-border-card group flex flex-col h-full cursor-pointer transition-transform hover:-translate-y-1 ${
                          isNavigating ? "opacity-80 pointer-events-none" : ""
                        }`}
                      >
                        <div className="rgb-neon-border-inner p-5 flex flex-col justify-between h-full space-y-4">
                          <div className="space-y-3 flex-1 min-w-0">
                            {/* Badges Row */}
                            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                              <span className="px-2.5 py-1 rounded-xl bg-indigo-100/90 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-[11px] font-black border border-indigo-300/70 dark:border-indigo-800/80 shadow-xs">
                                অধ্যায় {chapter.chapterNumber || idx + 1}
                              </span>
                              {isCompleted ? (
                                <span className="px-2.5 py-1 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 text-[10px] font-black border border-emerald-300/70 dark:border-emerald-800/80 flex items-center gap-1 shadow-xs">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>সম্পন্ন ✨</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-xl bg-cyan-100/80 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 text-[10px] font-bold border border-cyan-300/60 dark:border-cyan-800/60">
                                  শিখন প্রস্তুত
                                </span>
                              )}
                            </div>

                            {/* Chapter Title */}
                            <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-snug line-clamp-2">
                              {chapter.titleBangla}
                            </h3>

                            {/* Chapter Description */}
                            {chapter.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans line-clamp-2 font-medium">
                                {chapter.description}
                              </p>
                            )}

                            {/* Clean Chapter Summary Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 pb-0.5">
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-900 dark:text-cyan-200">
                                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 shrink-0">
                                  <BookOpen className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">ব্লগ পাঠ</div>
                                  <div className="text-xs font-black truncate">{blogParts.length} টি</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-200">
                                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                                  <Award className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">কুইজ পরীক্ষা</div>
                                  <div className="text-xs font-black truncate">{quizzes.length} টি</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200">
                                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 shrink-0">
                                  <Zap className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">মোট নম্বর</div>
                                  <div className="text-xs font-black truncate">{totalMarks} নম্বর</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                                  <Flame className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">মোট রিওয়ার্ড</div>
                                  <div className="text-xs font-black truncate">+{totalChapterXp} XP</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer Action Button */}
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1 text-amber-500 font-mono text-[11px]">
                              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>
                                +{chapter.items?.reduce((s, it) => s + (it.xpReward || 0), 0) || 0} XP
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
                              {isNavigating ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>স্প্লিট-স্ক্রিন লোড হচ্ছে...</span>
                                </>
                              ) : (
                                <>
                                  <span>শিখন শুরু করুন 🚀</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <PublicFooter />

      {/* Student Login Modal */}
      {loginModalOpen && (
        <StudentLoginModal
          onClose={() => setLoginModalOpen(false)}
          onSuccessLogin={(acc) => {
            setActiveStudent(acc);
            setLoginModalOpen(false);
            fetchSubject();
          }}
        />
      )}
    </div>
  );
}
