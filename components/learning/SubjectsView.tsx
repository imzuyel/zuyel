"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  BookOpen,
  Clock,
  Layers,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { CourseItem } from "@/lib/chapterLearningEngine";
import { StudentAuthAccount } from "@/lib/studentIntelligenceStore";
import { getSubjectVisualTheme } from "@/lib/subjectIconRegistry";
import ChapterCard from "./ChapterCard";

export { ChapterCard };

interface SubjectsViewProps {
  courses: CourseItem[];
  activeStudent?: StudentAuthAccount | null;
  onSelectSubject: (course: CourseItem) => void;
  navigatingCourseId?: number | null;
  isLoading?: boolean;
}

/**
 * Converts Western digits to Bengali numerals cleanly
 */
function toBanglaDigits(val: number | string): string {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(val).replace(/\d/g, (d) => bn[Number(d)] ?? d);
}

/**
 * Calculates a sensible estimated study time for a subject in Bengali
 * Approximates 4 minutes per blog part and 6 minutes per quiz, or 15 mins per chapter.
 */
function calculateSubjectEstimatedTime(course: CourseItem): string {
  const chapters = course.chapters || [];
  let totalMinutes = 0;

  for (const ch of chapters) {
    const items = ch.items || [];
    if (items.length > 0) {
      const blogs = items.filter((it) => it.itemType === "BLOG_PART").length;
      const quizzes = items.filter((it) => it.itemType === "QUIZ").length;
      totalMinutes += blogs * 4 + quizzes * 6;
    } else {
      totalMinutes += 15; // default 15 min per chapter
    }
  }

  if (totalMinutes === 0) {
    totalMinutes = Math.max(chapters.length * 15, 20);
  }

  if (totalMinutes < 60) {
    return `${toBanglaDigits(totalMinutes)} মিনিট`;
  }

  const hours = (totalMinutes / 60).toFixed(1);
  return `${toBanglaDigits(hours)} ঘণ্টা`;
}

/**
 * Individual Premium Subject Card
 * Decluttered: strictly displays only Subject Name, Total Lessons/Blocks, and Estimated Time,
 * paired with colorful badges, glassmorphism, soft shadow, and progress tracking.
 */
export function SubjectCard({
  course,
  activeStudent,
  onSelect,
  isNavigating,
}: {
  course: CourseItem;
  activeStudent?: StudentAuthAccount | null;
  onSelect: (course: CourseItem) => void;
  isNavigating?: boolean;
}) {
  const theme = getSubjectVisualTheme(course);
  const SubjectIcon = theme.icon;

  const totalChapters = course.chapters?.length || 0;
  const totalItems = useMemo(() => {
    return (
      course.chapters?.reduce((acc, ch) => acc + (ch.items?.length || 0), 0) ||
      totalChapters
    );
  }, [course.chapters, totalChapters]);

  const estimatedTime = useMemo(
    () => calculateSubjectEstimatedTime(course),
    [course]
  );

  const enrichedCourse = course as any;
  const progressPercentage = enrichedCourse.courseProgressPercentage ?? 0;
  const isCompleted = enrichedCourse.isCompleted ?? false;

  return (
    <div
      onClick={() => !isNavigating && onSelect(course)}
      className={`group relative rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-cyan-500/60 dark:hover:border-cyan-400/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer ${
        isNavigating ? "opacity-75 pointer-events-none scale-[0.99]" : ""
      }`}
    >
      {/* Top Colorful Gradient Aura / Accent Border */}
      <div
        className={`h-1.5 w-full bg-gradient-to-r ${theme.iconGradient || "from-cyan-500 via-indigo-500 to-purple-500"}`}
      />

      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Class Badge */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border shadow-xs ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
            >
              {course.className}
            </span>

            {/* Trade Badge (if applicable) */}
            {course.tradeName && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200/70 dark:border-indigo-800/60 truncate max-w-[140px]">
                {course.tradeName}
              </span>
            )}
          </div>

          {/* Subject Code */}
          <span className="font-mono text-[10px] font-extrabold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/70 dark:border-slate-700/60">
            {course.code}
          </span>
        </div>

        {/* Subject Header & Icon */}
        <div className="flex items-start gap-3.5 pt-0.5">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${theme.iconGradient} text-white flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20 group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300`}
          >
            <SubjectIcon className="w-6 h-6 drop-shadow-xs" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-snug line-clamp-2">
              {course.titleBangla}
            </h3>
          </div>
        </div>

        {/* Essential Decluttered Data: Total Lessons/Blocks & Estimated Time */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold">
          {/* Total Lessons / Blocks */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none">
                মোট পাঠ ও ব্লক
              </div>
              <div className="text-xs font-black truncate mt-0.5">
                {toBanglaDigits(totalItems)} টি পাঠ
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none">
                আনুমানিক সময়
              </div>
              <div className="text-xs font-black truncate mt-0.5">
                ⏱ {estimatedTime}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar (When Student is Logged in) */}
        {activeStudent && (
          <div className="pt-1 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>আপনার অগ্রগতি</span>
                {isCompleted && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 inline" />
                )}
              </span>
              <span
                className={`font-mono text-xs font-black ${
                  isCompleted
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-cyan-600 dark:text-cyan-400"
                }`}
              >
                {isCompleted ? "সম্পন্ন (১০০%) ✨" : `${toBanglaDigits(progressPercentage)}%`}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60 relative">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.45)]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.85, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Footer Button */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <button
          type="button"
          disabled={isNavigating}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(course);
          }}
          className={`w-full py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
            isNavigating
              ? "bg-cyan-500 text-slate-950 shadow-cyan-500/25"
              : "bg-slate-900 dark:bg-slate-800 hover:bg-gradient-to-r hover:from-cyan-600 hover:to-indigo-600 text-white shadow-slate-900/10 hover:shadow-cyan-500/25 active:scale-98"
          }`}
        >
          {isNavigating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>অধ্যায় তালিকা লোড হচ্ছে...</span>
            </>
          ) : (
            <>
              <span>চ্যাপ্টার তালিকা দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function SubjectsView({
  courses,
  activeStudent,
  onSelectSubject,
  navigatingCourseId,
  isLoading,
}: SubjectsViewProps) {
  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
          কারিকুলামের বিষয়সমূহ লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="p-12 text-center bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700/80 space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-inner border border-indigo-100 dark:border-indigo-800/40">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
            কোনো বিষয় পাওয়া যায়নি
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            নির্বাচিত শ্রেণি বা ট্রেডে কোনো অনুমোদিত বিষয় মেলেনি। আপনি ফিল্টার পরিবর্তন করতে পারেন অথবা নতুন বিষয় ও অধ্যায় তৈরি করতে পারেন।
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/learning/lessons"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <span>➕ নতুন বিষয় বা অধ্যায় তৈরি করুন</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {courses.map((course) => (
        <SubjectCard
          key={course.id}
          course={course}
          activeStudent={activeStudent}
          onSelect={onSelectSubject}
          isNavigating={navigatingCourseId === course.id}
        />
      ))}
    </div>
  );
}
