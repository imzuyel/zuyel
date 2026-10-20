"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  Building,
  Users,
  Search,
  Plus,
  Printer,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from "lucide-react";
import { ExamMaster } from "@/lib/examinationEngine";
import { ExamRoutineItem } from "@/lib/database";
import { ACADEMIC_CLASSES } from "@/lib/academicStructure";
import { toBengaliNumerals } from "@/lib/utils";

interface ExamScheduleTimetableProps {
  exams: ExamMaster[];
  initialExamId?: number;
}

export default function ExamScheduleTimetable({
  exams,
  initialExamId,
}: ExamScheduleTimetableProps) {
  const [selectedExamId, setSelectedExamId] = useState<number>(initialExamId || exams[0]?.id || 1);
  const [routines, setRoutines] = useState<ExamRoutineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterClass, setFilterClass] = useState<string>("all");

  // New Schedule Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newDate, setNewDate] = useState<string>("2026-06-10");
  const [newDay, setNewDay] = useState<string>("Wednesday");
  const [newTime, setNewTime] = useState<string>("10:00 AM - 01:00 PM");
  const [newClassLevel, setNewClassLevel] = useState<string>("Class 9 (SSC Vocational)");
  const [newTradeName, setNewTradeName] = useState<string>("All Trades");
  const [newSubjectCode, setNewSubjectCode] = useState<string>("IT-901");
  const [newSubjectName, setNewSubjectName] = useState<string>("IT Support Fundamentals & OS (Theory)");
  const [newRoomNo, setNewRoomNo] = useState<string>("Room 101, 102");

  const currentExam = useMemo(() => {
    return exams.find((e) => e.id === selectedExamId) || exams[0];
  }, [exams, selectedExamId]);

  const loadSchedules = async () => {
    if (!selectedExamId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/examination/schedule?examId=${selectedExamId}`);
      const data = await res.json();
      if (data.success) {
        setRoutines(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [selectedExamId]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        examId: selectedExamId,
        schedule: {
          date: newDate,
          day: newDay,
          time: newTime,
          classLevel: newClassLevel,
          tradeName: newTradeName,
          subjectCode: newSubjectCode,
          subjectName: newSubjectName,
          roomNo: newRoomNo,
        },
        operator: "Exam Controller",
      };

      const res = await fetch("/api/examination/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        loadSchedules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Routines
  const filteredRoutines = useMemo(() => {
    let list = [...routines];
    if (filterClass !== "all") {
      list = list.filter((r) => r.classLevel.includes(filterClass));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.subjectName.toLowerCase().includes(q) ||
          r.subjectCode.toLowerCase().includes(q) ||
          r.tradeName.toLowerCase().includes(q) ||
          r.roomNo.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [routines, filterClass, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header & Exam Selector */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>পরীক্ষার সময়সূচি ও সিট প্ল্যান (Timetable & Invigilation)</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            অফিশিয়াল পরীক্ষার রুটিন ও পরীক্ষার হল বণ্টন
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(Number(e.target.value))}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
          >
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.nameBangla} ({exam.academicYear})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs shadow-indigo-600/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>সময়সূচি যোগ</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>রুটিন প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* Routine Cards / Printable Gazette Format */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Institutional Formal Banner */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-center">
          <span className="text-[11px] font-bold tracking-widest text-indigo-300 uppercase block mb-1">
            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • কারিগরি শিক্ষা অধিদপ্তর
          </span>
          <h1 className="text-xl font-black">পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)</h1>
          <p className="text-xs text-indigo-200 mt-1">
            {currentExam?.nameBangla} — সময়সূচি ও পরীক্ষার হল বণ্টন
          </p>
          <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 text-[11px] font-mono border border-indigo-400/30">
            সময়কাল: {currentExam?.startDate} হতে {currentExam?.endDate}
          </span>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="বিষয় বা কোড দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-500 dark:text-slate-400">শ্রেণি ফিল্টার:</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
            >
              <option value="all">সকল শ্রেণি (All)</option>
              <option value="Class 9">Class 9 (এসএসসি ভোকেশনাল)</option>
              <option value="Class 10">Class 10 (এসএসসি ভোকেশনাল)</option>
              <option value="Class 11">Class 11 (এইচএসসি ভোকেশনাল)</option>
              <option value="Class 6">Class 6-8 (সাধারণ)</option>
            </select>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">তারিখ ও বার</th>
                <th className="p-3.5">সময়সূচি</th>
                <th className="p-3.5">শ্রেণি ও কারিগরি ট্রেড</th>
                <th className="p-3.5">বিষয় কোড ও বিষয়ের নাম</th>
                <th className="p-3.5">পরীক্ষার কক্ষ / ল্যাব</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredRoutines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    এই পরীক্ষার জন্য কোনো সময়সূচি নির্ধারিত হয়নি।
                  </td>
                </tr>
              ) : (
                filteredRoutines.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/60 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block font-mono">
                        {item.date}
                      </span>
                      <span className="text-[11px] text-slate-400">{item.day}</span>
                    </td>

                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.time}</span>
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {item.classLevel}
                      </span>
                      <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
                        {item.tradeName}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {item.subjectName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        কোড: {item.subjectCode}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-800 dark:text-slate-200">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.roomNo}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <span>নতুন পরীক্ষার সময়সূচি যুক্ত করুন</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">বার</label>
                  <input
                    type="text"
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    placeholder="Wednesday"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  সময়সূচি *
                </label>
                <input
                  type="text"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="10:00 AM - 01:00 PM"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    শ্রেণি স্তর *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClassLevel}
                    onChange={(e) => setNewClassLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ট্রেডের নাম
                  </label>
                  <input
                    type="text"
                    value={newTradeName}
                    onChange={(e) => setNewTradeName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    বিষয় কোড *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubjectCode}
                    onChange={(e) => setNewSubjectCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    কক্ষ / ল্যাব নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoomNo}
                    onChange={(e) => setNewRoomNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বিষয়ের পুরো নাম *
                </label>
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
