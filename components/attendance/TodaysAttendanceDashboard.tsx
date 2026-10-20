"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  ShieldCheck,
  Users,
  Search,
  ArrowRight,
  Sparkles,
  BookOpen,
  Filter,
  BarChart2,
  Calendar,
  Layers,
} from "lucide-react";
import { AttendanceFilterState } from "./DynamicAttendanceContextBar";
import { useAuth } from "@/context/AuthContext";

interface TodaysAttendanceDashboardProps {
  onSelectSession: (context: Partial<AttendanceFilterState>) => void;
  onClose?: () => void;
}

export default function TodaysAttendanceDashboard({
  onSelectSession,
  onClose,
}: TodaysAttendanceDashboardProps) {
  const { currentUser } = useAuth();
  const [date, setDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterClass, setFilterClass] = useState<string>("all");

  const loadTodayDashboard = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        action: "today_dashboard",
        date,
      });
      const res = await fetch(`/api/attendance?${q.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
      }
    } catch (err) {
      console.error("Error loading today dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayDashboard();
  }, [date]);

  const filteredSessions = (dashboardData?.scheduledSessions || []).filter((s: any) => {
    if (filterClass !== "all" && String(s.numericClass) !== filterClass) return false;
    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-cyan-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>দৈনিক ক্লাস রুটিন ও হাজিরা মনিটরিং</span>
              {dashboardData?.isHoliday && (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  ছুটি: {dashboardData.holidayTitle}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              রুটিন অনুয়ায়ী নির্ধারিত সকল পিরিয়ডের সরাসরি হাজিরা স্ট্যাটাস ও ১-ক্লিক হাজিরা গ্রহণ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              বন্ধ করুন
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {dashboardData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              নির্ধারিত পিরিয়ড
            </span>
            <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {dashboardData.totalScheduled}
            </div>
            <span className="text-[10px] text-slate-400">রুটিন অনুযায়ী ক্লাসের সংখ্যা</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block mb-1">
              সম্পন্ন হাজিরা
            </span>
            <div className="text-xl font-extrabold text-emerald-800 dark:text-emerald-200">
              {dashboardData.completedCount}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
              হাজিরা গ্রহণ সম্পন্ন হয়েছে
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 block mb-1">
              অপেক্ষমান (Pending)
            </span>
            <div className="text-xl font-extrabold text-amber-800 dark:text-amber-200">
              {dashboardData.pendingCount}
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">এখনো হাজিরা গ্রহণ বাকি</span>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50">
            <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 block mb-1">
              লক/চূড়ান্তকৃত
            </span>
            <div className="text-xl font-extrabold text-indigo-800 dark:text-indigo-200">
              {dashboardData.finalizedCount}
            </div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400">কুইজ/পরীক্ষার জন্য প্রস্তুত</span>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50">
            <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 block mb-1">
              সম্পূর্ণতা হার
            </span>
            <div className="text-xl font-extrabold text-purple-800 dark:text-purple-200">
              {dashboardData.completionRatePct}%
            </div>
            <span className="text-[10px] text-purple-600 dark:text-purple-400">আজকের কার্যক্রম অগ্রগতি</span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 block mb-1">
              মোট অনুপস্থিত
            </span>
            <div className="text-xl font-extrabold text-rose-800 dark:text-rose-200">
              {dashboardData.totalAbsenteesToday}
            </div>
            <span className="text-[10px] text-rose-600 dark:text-rose-400">শিক্ষার্থী ক্লাসে অনুপস্থিত</span>
          </div>
        </div>
      )}

      {/* Class filter and table */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>শ্রেণি অনুযায়ী ফিল্টার:</span>
            {["all", "6", "7", "8", "9", "10", "11", "12"].map((cls) => (
              <button
                key={cls}
                onClick={() => setFilterClass(cls)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterClass === cls
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cls === "all" ? "সকল শ্রেণি" : `শ্রেণি ${cls}`}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            মোট প্রদর্শিত: {filteredSessions.length} টি পিরিয়ড
          </span>
        </div>

        {/* Schedule List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">রুটিন ডাটা লোড হচ্ছে...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            এই তারিখে কোনো ক্লাস রুটিন সূচি নির্ধারিত নেই অথবা ছুটির দিন।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSessions.map((session: any) => {
              const isCompleted = session.status === "saved" || session.status === "finalized";
              const isLocked = session.status === "finalized";

              return (
                <div
                  key={session.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isLocked
                      ? "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                      : isCompleted
                      ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/60"
                      : "bg-white dark:bg-slate-800/80 border-amber-200 dark:border-amber-800/60 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{session.periodNo}ম পিরিয়ড ({session.startTime} - {session.endTime})</span>
                    </span>

                    {isLocked ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>লককৃত</span>
                      </span>
                    ) : isCompleted ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>গৃহীত ({session.attendanceRate}%)</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>অপেক্ষমান</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mb-3 text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{session.className} (শাখা {session.section})</span>
                      {session.tradeName && (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                          • {session.tradeName}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>{session.subjectName} ({session.subjectCode})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>শিক্ষক: <strong>{session.teacherName}</strong></span>
                      <span>কক্ষ: {session.roomNo}</span>
                    </div>
                    {session.substituteTeacherName && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                        বদলি শিক্ষক: {session.substituteTeacherName}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onSelectSession({
                        classId: session.classId,
                        section: session.section,
                        tradeId: session.tradeId,
                        periodNo: session.periodNo,
                        subjectCode: session.subjectCode,
                        subjectName: session.subjectName,
                        date,
                        teacherName: session.teacherName,
                        substituteTeacherName: session.substituteTeacherName,
                        roomNo: session.roomNo,
                        isLab: session.isLab,
                      });
                    }}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      isCompleted
                        ? "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    }`}
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>{isCompleted ? "হাজিরা দেখুন / পরিবর্তন" : "হাজিরা গ্রহণ করুন"}</span>
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
