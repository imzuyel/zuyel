"use client";

import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  Send,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Sparkles,
  ChevronDown,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import {
  getStudentDoubts,
  saveStudentDoubt,
  StudentDoubtItem,
} from "@/lib/studentIntelligenceStore";
import { PublishedLesson } from "@/lib/publishedLessonsStore";

interface StudentDoubtBoxProps {
  lesson: PublishedLesson;
}

export default function StudentDoubtBox({ lesson }: StudentDoubtBoxProps) {
  const [doubts, setDoubts] = useState<StudentDoubtItem[]>([]);
  const [studentName, setStudentName] = useState("");
  const [studentRoll, setStudentRoll] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    const all = getStudentDoubts();
    setDoubts(all.filter((d) => d.lessonId === lesson.id));
  }, [lesson.id]);

  const handleSubmitDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const sName = studentName.trim() || "PTSC শিক্ষার্থী";
    const sRoll = studentRoll.trim() ? `রোল: ${studentRoll.trim()}` : "রোল: উল্লেখহীন";

    const updated = saveStudentDoubt({
      lessonId: String(lesson.id),
      lessonTitle: lesson.title,
      studentName: sName,
      studentRoll: sRoll,
      tradeClass: `${lesson.classLabel} (${lesson.tradeLabel})`,
      question: questionText.trim(),
    });

    setDoubts(updated.filter((d) => d.lessonId === lesson.id));
    setQuestionText("");
    setSubmittedSuccess(true);
    setTimeout(() => setSubmittedSuccess(false), 4000);
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 shadow-lg space-y-6">
      
      {/* Box Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider">
              ACADEMIC DOUBT BOX
            </span>
            <span className="text-xs text-slate-500 font-mono">
              সরাসরি শিক্ষককে প্রশ্ন করুন
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
            <span>পাঠ সম্পর্কিত ডাউট / প্রশ্ন সাবমিট করুন</span>
          </h3>
        </div>

        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono">
          প্রশ্ন সংখ্যা: {doubts.length}
        </span>
      </div>

      {/* Submit Doubt Form */}
      <form onSubmit={handleSubmitDoubt} className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          নতুন প্রশ্ন জমা দিন (Submit a Question):
        </h4>

        {submittedSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>আপনার প্রশ্নটি সফলভাবে শিক্ষকের নিকট পাঠানো হয়েছে! বিষয়ভিত্তিক শিক্ষক উত্তর দিলে এখানে এবং নোটিফিকেশনে দেখতে পাবেন।</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="আপনার নাম (যেমন: আরিফুল ইসলাম)"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="আপনার রোল বা আইডি (যেমন: ১২)"
            value={studentRoll}
            onChange={(e) => setStudentRoll(e.target.value)}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
          />
        </div>

        <textarea
          rows={3}
          required
          placeholder="যেমন: স্যার, ওহমের সূত্রে গাণিতিক উদাহরণের ৩ নম্বর লাইনটা বুঝতে পারিনি..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer transition-all"
          >
            <Send className="w-4 h-4" />
            <span>শিক্ষকের নিকট প্রশ্ন পাঠান</span>
          </button>
        </div>
      </form>

      {/* Doubts List */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          শিক্ষার্থীদের জমা দেওয়া ডাউট ও শিক্ষকের সমাধান ({doubts.length})
        </h4>

        {doubts.length > 0 ? (
          <div className="space-y-4">
            {doubts.map((d) => (
              <div
                key={d.id}
                className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <strong className="text-slate-900 dark:text-white font-bold">{d.studentName}</strong>
                    <span className="text-slate-400 text-[10px]">({d.studentRoll})</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                      d.status === "answered"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                    }`}
                  >
                    {d.status === "answered" ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>শিক্ষকের উত্তর প্রদান করা হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                        <span>শিক্ষকের উত্তরের অপেক্ষায়</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Question Text */}
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                  ❓ <strong className="text-indigo-600 dark:text-cyan-400">প্রশ্ন:</strong> {d.question}
                </div>

                {/* Answer Box if answered */}
                {d.status === "answered" && d.answer && (
                  <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{d.answeredBy || lesson.author}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{d.answeredAt}</span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                      💡 {d.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            এই পাঠে এখনো কোনো ডাউট জমা হয়নি। আপনার কোনো অংশ বুঝতে সমস্যা হলে উপরে প্রশ্ন টাইপ করে শিক্ষককে জানান!
          </p>
        )}
      </div>

    </div>
  );
}
