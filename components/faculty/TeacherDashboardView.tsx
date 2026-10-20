"use client";

import React, { useState } from "react";
import {
  User,
  Calendar,
  Clock,
  BookOpen,
  Upload,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  CheckSquare,
  Square,
  Plus,
  Download,
  Trash2,
  Building,
  UserCheck,
  BrainCircuit,
  ClipboardPaste,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RoutineItem, FacultyMember } from "@/lib/database";
import { WEEK_DAYS, WEEK_DAYS_BN, DEFAULT_TIME_SLOTS } from "@/lib/routineEngine";
import { ACADEMIC_CLASSES } from "@/lib/academicStructure";
import { toBengaliNumerals } from "@/lib/utils";
import { GlowButton } from "@/components/ui/animation-effects";
import ClassWeakTopicAnalytics from "@/components/learning/ClassWeakTopicAnalytics";
import TeacherAiQuizImportStudio from "@/components/quiz/TeacherAiQuizImportStudio";

const EMPTY_ROUTINES: RoutineItem[] = [];
const EMPTY_FACULTY: FacultyMember[] = [];

interface TeacherDashboardViewProps {
  allRoutines?: RoutineItem[];
  facultyList?: FacultyMember[];
}

export default function TeacherDashboardView({
  allRoutines = EMPTY_ROUTINES,
  facultyList = EMPTY_FACULTY,
}: TeacherDashboardViewProps) {
  const { currentUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "routine" | "attendance" | "materials" | "analytics" | "ai_quiz_import">("overview");

  // Notification state
  const [notification, setNotification] = useState<string | null>(null);

  // Materials state
  const [materials, setMaterials] = useState<Array<{ id: string; title: string; subject: string; class: string; date: string; size: string }>>([
    { id: "mat-1", title: "কম্পিউটার ফান্ডামেন্টালস লেকচার ১-৩", subject: "CSE-211", class: "ডিপ্লোমা (৯ম শ্রেণি)", date: "২০২৬-০৩-২৮", size: "৪.২ এমবি" },
    { id: "mat-2", title: "আইওটি সেন্সর ও মাইক্রোকন্ট্রোলার গাইড", subject: "IOT-102", class: "ভোকেশনাল (১০ম শ্রেণি)", date: "২০২৬-০৩-২৫", size: "২.৮ এমবি" },
  ]);

  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialSubject, setNewMaterialSubject] = useState("CSE-211");
  const [newMaterialClass, setNewMaterialClass] = useState("ডিপ্লোমা (৯ম শ্রেণি)");

  // Attendance recording state
  const [attendanceClass, setAttendanceClass] = useState("ডিপ্লোমা (৯ম শ্রেণি)");
  const [attendanceSection, setAttendanceSection] = useState("ক");
  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
  const [studentAttendanceList, setStudentAttendanceList] = useState<Array<{ id: number; roll: string; name: string; present: boolean }>>([
    { id: 1, roll: "১০১", name: "তানভীর হাসান", present: true },
    { id: 2, roll: "১০২", name: "সাদিয়া আক্তার", present: true },
    { id: 3, roll: "১০৩", name: "রাশেদুল ইসলাম", present: false },
    { id: 4, roll: "১০৪", name: "নুসরাত জাহান", present: true },
    { id: 5, roll: "১০৫", name: "ফাহিম মুনতাসির", present: true },
  ]);

  // Filter routines for logged-in teacher
  const teacherName = currentUser?.nameBangla || currentUser?.fullName || "মাহমুদুল হাসান";
  const myRoutines = (allRoutines || []).filter((r) => {
    const tName = (r?.teacherName || "").toLowerCase();
    return tName.includes(teacherName.toLowerCase()) || tName.includes("mahmudul") || tName.includes("হাসান");
  });

  // Today's day (e.g. "Saturday" or default to Saturday)
  const todayDay = "Saturday"; 
  const todaysLectures = myRoutines.filter((r) => r?.day === todayDay || r?.day === "Sunday");

  const handleUploadMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialTitle.trim()) return;

    const newMat = {
      id: `mat-${Date.now()}`,
      title: newMaterialTitle,
      subject: newMaterialSubject,
      class: newMaterialClass,
      date: new Date().toISOString().slice(0, 10),
      size: "৩.৫ এমবি",
    };

    setMaterials([newMat, ...materials]);
    setNewMaterialTitle("");
    setNotification("ক্লাস মেটেরিয়াল সফলভাবে আপলোড করা হয়েছে!");
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveAttendance = () => {
    setAttendanceSubmitted(true);
    setNotification("আজকের ক্লাসের হাজিরা সফলভাবে সার্ভারে সংরক্ষিত হয়েছে!");
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Teacher Hero Greeting & Role Banner */}
      <div className="p-6 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white rounded-3xl shadow-xl border border-emerald-800/40 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/25 shrink-0">
            {currentUser.nameBangla ? currentUser.nameBangla.charAt(0) : "T"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                TEACHER FACULTY PORTAL (শিক্ষক প্যানেল)
              </span>
              <span className="text-xs text-emerald-200 font-bold">
                রোল: {currentUser.designation}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              স্বাগতম, {currentUser.nameBangla || currentUser.fullName}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ • বিভাগ: {currentUser.department || "কম্পিউটার ও আইওটি"}
            </p>
          </div>
        </div>

        {/* Quick Stats / Role Info */}
        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20">
          <div className="text-center px-3 border-r border-white/20">
            <div className="text-xs text-slate-300 font-bold">সাপ্তাহিক ক্লাস</div>
            <div className="text-lg font-black text-emerald-400">{toBengaliNumerals(myRoutines.length)} টি</div>
          </div>
          <div className="text-center px-3">
            <div className="text-xs text-slate-300 font-bold">অনুমতি স্তর</div>
            <div className="text-xs font-black text-cyan-300">হাজিরা ও নোট আপলোড</div>
          </div>
        </div>
      </div>

      {/* Role Permission Badge Explanation */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-black">রোল-বেসড পারমিশন নীতি (Role-Based Permissions):</span> এই অ্যাকাউন্টে আপনি আপনার ব্যক্তিগত রুটিন দেখা, ডিজিটাল হাজিরা নেওয়া এবং স্টাডি মেটেরিয়াল আপলোড করতে পারবেন। প্রাতিষ্ঠানিক মাস্টার রুটিন তৈরি বা সিস্টেম কনফিগারেশনের জন্য শুধুমাত্র <b>অ্যাডমিন ও অধ্যক্ষ</b> মহোদয়ের অনুমতি রয়েছে।
        </div>
      </div>

      {/* Global Notification */}
      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{notification}</span>
        </div>
      )}

      {/* Sub-tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: "overview", label: "আজকের লেকচার ও ড্যাশবোর্ড", icon: Clock },
          { id: "routine", label: "আমার ব্যক্তিগত রুটিন", icon: Calendar },
          { id: "attendance", label: "দৈনিক ক্লাস হাজিরা", icon: UserCheck },
          { id: "materials", label: "লেকচার নোট ও মেটেরিয়াল", icon: Upload },
          { id: "ai_quiz_import", label: "এআই কুইজ ইম্পোর্ট ও পাবলিশ", icon: ClipboardPaste },
          { id: "analytics", label: "শিক্ষক অ্যানালিটিক্স ও ক্লাস ট্র্যাকিং (Phase 4)", icon: BrainCircuit },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 1. OVERVIEW / TODAY'S LECTURES TAB                            */}
      {/* ============================================================== */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-black uppercase">আজকের নির্ধারিত ক্লাস</span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {toBengaliNumerals(todaysLectures.length > 0 ? todaysLectures.length : 3)} টি
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">প্রথম ক্লাস শুরু সকাল ০৮:০০ টায়</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-black uppercase">আপলোডকৃত লেকচার নোট</span>
                <FileText className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {toBengaliNumerals(materials.length)} টি
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">শিক্ষার্থীরা ডাউনলোড করতে পারবে</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-black uppercase">সাপ্তাহিক ওয়ার্কলোড</span>
                <Award className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {toBengaliNumerals(myRoutines.length)} পিরিয়ড
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">বিভাগীয় রুটিন অনুযায়ী বরাদ্দকৃত</p>
            </div>
          </div>

          {/* Today's Schedule List */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>আজকের আসন্ন লেকচার ও পিরিয়ড সূচি</span>
            </h3>

            <div className="space-y-3">
              {(todaysLectures.length > 0 ? todaysLectures : myRoutines.slice(0, 3)).map((routine, idx) => (
                <div
                  key={routine.id || idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-xs flex flex-col items-center justify-center shrink-0 shadow-sm">
                      <span>পিরিয়ড</span>
                      <span className="text-sm">{toBengaliNumerals(routine.periodNo)}</span>
                    </div>
                    <div>
                      <div className="font-black text-sm text-slate-900 dark:text-white">
                        {routine.subjectNameBangla || routine.subjectName} ({routine.subjectCode})
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                        শ্রেণি: {routine.className} {routine.tradeCode ? `• ট্রেড: ${routine.tradeCode}` : ""} • কক্ষ: {routine.roomNo}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold">
                      {routine.startTime} - {routine.endTime}
                    </span>
                    <button
                      onClick={() => setActiveSubTab("attendance")}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition"
                    >
                      হাজিরা নিন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. PERSONAL ROUTINE TAB (Only Teacher's Routine)               */}
      {/* ============================================================== */}
      {activeSubTab === "routine" && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                আপনার ব্যক্তিগত সাপ্তাহিক রুটিন (Personal Teacher Routine)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                রোল-বেসড সিকিউরিটি অনুযায়ী আপনি শুধুমাত্র আপনার নিজের রুটিন দেখতে পাচ্ছেন।
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-200">
              {currentUser.nameBangla || currentUser.fullName}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-left text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-center">
                  <th className="border p-2.5 w-24">বার / দিবস</th>
                  {DEFAULT_TIME_SLOTS.map((slot) => (
                    <th key={slot.period} className="border p-2 text-center">
                      <div>{slot.labelBangla}</div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{slot.start}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WEEK_DAYS.map((day) => {
                  const dayItems = myRoutines.filter((r) => r.day === day);
                  return (
                    <tr key={day} className="border-b border-slate-200 dark:border-slate-800">
                      <td className="border p-2.5 font-black text-center bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white">
                        {WEEK_DAYS_BN[day].split(" ")[0]}
                      </td>
                      {DEFAULT_TIME_SLOTS.map((slot) => {
                        const item = dayItems.find((r) => r.periodNo === slot.period);
                        if (slot.isBreak) {
                          return (
                            <td key={slot.period} className="border p-1 bg-amber-50 dark:bg-amber-950/30 text-center text-[10px] font-bold text-amber-800">
                              বিরতি
                            </td>
                          );
                        }
                        return (
                          <td key={slot.period} className="border p-2 align-top text-center">
                            {item ? (
                              <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 space-y-1">
                                <div className="font-extrabold text-[11px] text-emerald-950 dark:text-emerald-200">
                                  {item.subjectNameBangla || item.subjectName}
                                </div>
                                <div className="text-[10px] font-mono text-indigo-900 dark:text-indigo-300 font-bold">
                                  {item.className}
                                </div>
                                <div className="text-[9px] font-black text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 rounded px-1 inline-block border">
                                  കক্ষ: {item.roomNo}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. DAILY ATTENDANCE RECORDING TAB                              */}
      {/* ============================================================== */}
      {activeSubTab === "attendance" && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                দৈনিক ক্লাস হাজিরা রেকর্ডকরণ (Class Attendance Register)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                আপনার নির্ধারিত ক্লাসের শিক্ষার্থীদের উপস্থিতি গ্রহণ ও সংরক্ষণ করুন।
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={attendanceClass}
                onChange={(e) => setAttendanceClass(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              >
                {ACADEMIC_CLASSES.map((c) => (
                  <option key={c.id} value={c.nameBangla}>{c.nameBangla}</option>
                ))}
              </select>

              <button
                onClick={handleSaveAttendance}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>হাজিরা সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 dark:border-slate-800 text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-center">
                  <th className="border p-2.5 w-16">রোল</th>
                  <th className="border p-2.5 text-left">শিক্ষার্থীর নাম</th>
                  <th className="border p-2.5 w-32">উপস্থিতি (Present)</th>
                </tr>
              </thead>
              <tbody>
                {studentAttendanceList.map((st) => (
                  <tr key={st.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800/40">
                    <td className="border p-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {toBengaliNumerals(st.roll)}
                    </td>
                    <td className="border p-2 font-bold text-slate-900 dark:text-white">
                      {st.name}
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => {
                          setStudentAttendanceList((prev) =>
                            prev.map((item) => (item.id === st.id ? { ...item, present: !item.present } : item))
                          );
                        }}
                        className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                          st.present
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                        }`}
                      >
                        {st.present ? "উপস্থিত (Present)" : "অনুপস্থিত (Absent)"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. CLASS MATERIALS UPLOAD TAB                                  */}
      {/* ============================================================== */}
      {activeSubTab === "materials" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Form */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>নতুন লেকচার নোট বা ফাইল আপলোড</span>
            </h3>

            <form onSubmit={handleUploadMaterial} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  নোট বা ফাইলের শিরোনাম:
                </label>
                <input
                  type="text"
                  value={newMaterialTitle}
                  onChange={(e) => setNewMaterialTitle(e.target.value)}
                  placeholder="যেমন: অ্যাডভান্সড প্রোগ্রামিং লেকচার নোট"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  বিষয় কোড:
                </label>
                <input
                  type="text"
                  value={newMaterialSubject}
                  onChange={(e) => setNewMaterialSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  শ্রেণি ও বিভাগ:
                </label>
                <select
                  value={newMaterialClass}
                  onChange={(e) => setNewMaterialClass(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  {ACADEMIC_CLASSES.map((c) => (
                    <option key={c.id} value={c.nameBangla}>{c.nameBangla}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ফাইল সিলেক্ট করুন (PDF / Doc):
                </label>
                <input
                  type="file"
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 dark:bg-emerald-950/40 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <GlowButton
                type="submit"
                variant="cyan"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>ফাইল আপলোড করুন</span>
              </GlowButton>
            </form>
          </div>

          {/* Uploaded Materials List */}
          <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-600" />
              <span>আপলোডকৃত স্টাডি মেটেরিয়াল ও লেকচার নোটস</span>
            </h3>

            <div className="space-y-3">
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-black text-xs shrink-0">
                      PDF
                    </div>
                    <div>
                      <div className="font-black text-xs text-slate-900 dark:text-white">
                        {mat.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        বিষয়: <b>{mat.subject}</b> • শ্রেণি: {mat.class} • আপলোড: {mat.date} ({mat.size})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setNotification(`ডাউনলোড শুরু হচ্ছে: ${mat.title}`);
                        setTimeout(() => setNotification(null), 3000);
                      }}
                      className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 transition"
                      title="ডাউনলোড"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setMaterials((prev) => prev.filter((m) => m.id !== mat.id));
                        setNotification("মেটেরিয়াল মুছে ফেলা হয়েছে।");
                        setTimeout(() => setNotification(null), 3000);
                      }}
                      className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300 transition"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. TEACHER PERFORMANCE ANALYTICS & CLASS TRACKING (PHASE 4)    */}
      {/* ============================================================== */}
      {activeSubTab === "analytics" && (
        <div className="space-y-6">
          <ClassWeakTopicAnalytics />
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. EXTERNAL AI QUIZ IMPORT & PUBLISHER WORKFLOW                */}
      {/* ============================================================== */}
      {activeSubTab === "ai_quiz_import" && (
        <div className="space-y-6">
          <TeacherAiQuizImportStudio />
        </div>
      )}
    </div>
  );
}
