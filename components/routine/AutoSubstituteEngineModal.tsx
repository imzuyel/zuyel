"use client";

import React, { useState, useMemo } from "react";
import {
  UserCheck,
  UserX,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building,
  BookOpen,
  Printer,
  X,
  Check,
  RefreshCw,
  Search,
  Filter,
  Zap,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Award,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { RoutineItem, FacultyMember } from "@/lib/database";
import { toBengaliNumerals } from "@/lib/utils";
import QRCode from "qrcode";

interface AutoSubstituteEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  routines: RoutineItem[];
  facultyList: FacultyMember[];
  onCommitSubstitutions: (updatedRoutines: RoutineItem[]) => void;
  initialTeacherName?: string;
  initialDay?: string;
  initialPeriodNo?: number;
}

export interface SubstituteCandidate {
  faculty: FacultyMember;
  weeklyLoad: number;
  isTradeMatch: boolean;
  score: number;
  matchReason: string;
}

const ROUTINE_DAYS_BN: Record<string, string> = {
  Sunday: "রবিবার",
  Monday: "সোমবার",
  Tuesday: "মঙ্গলবার",
  Wednesday: "বুধবার",
  Thursday: "বৃহস্পতিবার",
  Friday: "শুক্রবার",
  Saturday: "শনিবার",
};

export default function AutoSubstituteEngineModal({
  isOpen,
  onClose,
  routines,
  facultyList,
  onCommitSubstitutions,
  initialTeacherName = "",
  initialDay = "Sunday",
  initialPeriodNo,
}: AutoSubstituteEngineModalProps) {
  const [selectedDay, setSelectedDay] = useState<string>(initialDay || "Sunday");
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [selectedAbsentTeacherId, setSelectedAbsentTeacherId] = useState<number | string>(() => {
    if (initialTeacherName) {
      const match = facultyList.find(
        (f) =>
          f.name.toLowerCase() === initialTeacherName.toLowerCase() ||
          (f.nameBangla && f.nameBangla.includes(initialTeacherName))
      );
      return match ? match.id : "";
    }
    return "";
  });

  const [absenceReason, setAbsenceReason] = useState<string>("আকস্মিক অসুস্থতাজনিত ছুটি / দাপ্তরিক দায়িত্ব");
  const [selectedSubstitutes, setSelectedSubstitutes] = useState<Record<number, { substituteTeacherName: string; substituteTeacherId: number; reason: string }>>({});
  const [filterOnlyTradeMatches, setFilterOnlyTradeMatches] = useState<boolean>(false);
  const [substituteSearchQuery, setSubstituteSearchQuery] = useState<string>("");
  const [memoNo, setMemoNo] = useState<string>(`পসটেস্ক/বদলি-দায়িত্ব/২০২৬/${Math.floor(100 + Math.random() * 900)}`);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  React.useEffect(() => {
    const url = `https://tsc.panchagarh.gov.bd/verify-substitute?memo=${encodeURIComponent(memoNo)}&date=${selectedDate}`;
    QRCode.toDataURL(url, { width: 100, margin: 1 })
      .then((dataUrl) => setQrCodeDataUrl(dataUrl))
      .catch((err) => console.error("QR Code error:", err));
  }, [memoNo, selectedDate]);

  const safeFaculty = useMemo(() => {
    return facultyList.filter((f) => f.type === "faculty");
  }, [facultyList]);

  // Find absent teacher object
  const absentTeacher = useMemo(() => {
    if (!selectedAbsentTeacherId) return null;
    return safeFaculty.find((f) => String(f.id) === String(selectedAbsentTeacherId)) || null;
  }, [selectedAbsentTeacherId, safeFaculty]);

  // Compute total weekly load for all teachers
  const teacherLoadMap = useMemo(() => {
    const map = new Map<string, number>();
    safeFaculty.forEach((f) => {
      const fName = f.name.trim().toLowerCase();
      const count = routines.filter((r) => {
        if (!r.teacherName) return false;
        const rName = r.teacherName.trim().toLowerCase();
        return rName.includes(fName) || (f.nameBangla && r.teacherName.includes(f.nameBangla));
      }).length;
      map.set(fName, count);
    });
    return map;
  }, [safeFaculty, routines]);

  // Get all affected class slots for the absent teacher on the selected day
  const affectedSlots = useMemo(() => {
    if (!absentTeacher) return [];
    const tName = absentTeacher.name.trim().toLowerCase();
    const tNameBn = absentTeacher.nameBangla?.trim() || "";

    return routines
      .filter((r) => {
        if (r.day?.toLowerCase() !== selectedDay.toLowerCase()) return false;
        if (!r.teacherName) return false;
        const rName = r.teacherName.trim().toLowerCase();
        return rName.includes(tName) || (tNameBn && r.teacherName.includes(tNameBn));
      })
      .sort((a, b) => a.periodNo - b.periodNo);
  }, [absentTeacher, selectedDay, routines]);

  // Helper to find slot span
  const getSlotSpan = (durationMinutes?: number) => {
    if (!durationMinutes) return 1;
    if (durationMinutes >= 160) return 4;
    if (durationMinutes >= 120) return 3;
    if (durationMinutes >= 80) return 2;
    return 1;
  };

  // Function to get free teachers for a specific routine slot
  const getRecommendationsForSlot = (slot: RoutineItem): SubstituteCandidate[] => {
    const spanA = getSlotSpan(slot.durationMinutes);
    const startA = slot.periodNo;
    const endA = startA + spanA - 1;
    const absentTrimmed = absentTeacher ? absentTeacher.name.trim().toLowerCase() : "";

    // Find busy teachers during this period span
    const busyTeacherNames = new Set<string>();
    routines.forEach((r) => {
      if (r.day?.toLowerCase() === slot.day?.toLowerCase() && r.teacherName && r.id !== slot.id) {
        const spanB = getSlotSpan(r.durationMinutes);
        const startB = r.periodNo;
        const endB = startB + spanB - 1;
        const overlaps = !(endA < startB || endB < startA);
        if (overlaps) {
          busyTeacherNames.add(r.teacherName.trim().toLowerCase());
        }
      }
    });

    const candidates: SubstituteCandidate[] = [];

    safeFaculty.forEach((faculty) => {
      const fName = faculty.name.trim().toLowerCase();
      if (fName === absentTrimmed) return;
      if (busyTeacherNames.has(fName)) return;

      const weeklyLoad = teacherLoadMap.get(fName) || 0;
      const dept = (faculty.department || "").toLowerCase();
      const desig = (faculty.designation || "").toLowerCase();
      const trade = (slot.tradeCode || "").toLowerCase();
      const subj = (slot.subjectName || "").toLowerCase();

      let isTradeMatch = false;
      if (trade.includes("it") || trade.includes("iot") || trade.includes("cse") || subj.includes("computer") || subj.includes("কম্পিউটার")) {
        isTradeMatch = dept.includes("computer") || dept.includes("it") || desig.includes("কম্পিউটার");
      } else if (trade.includes("ee") || trade.includes("electrical") || subj.includes("electric") || subj.includes("ইলেকট্রিক্যাল")) {
        isTradeMatch = dept.includes("electrical") || desig.includes("ইলেকট্রিক্যাল");
      } else if (trade.includes("rac") || trade.includes("ref") || subj.includes("rac") || subj.includes("রেফ্রিজারেশন")) {
        isTradeMatch = dept.includes("rac") || dept.includes("refrigeration") || desig.includes("আরএসি");
      } else if (trade.includes("civil") || trade.includes("draft") || subj.includes("civil") || subj.includes("সিভিল")) {
        isTradeMatch = dept.includes("civil") || desig.includes("সিভিল");
      } else if (subj.includes("bangla") || subj.includes("বাংলা") || subj.includes("english") || subj.includes("math") || subj.includes("পদার্থ") || subj.includes("রসায়ন")) {
        isTradeMatch = dept.includes("general") || dept.includes("basic") || dept.includes("science") || desig.includes("জেনারেল");
      }

      // Base scoring: 100 - (weeklyLoad * 2.5) + (isTradeMatch ? 25 : 0)
      let score = 100 - weeklyLoad * 2.5;
      if (isTradeMatch) score += 25;
      score = Math.max(15, Math.min(99, Math.round(score)));

      let matchReason = "";
      if (isTradeMatch && weeklyLoad <= 16) {
        matchReason = "ট্রেড বিশেষজ্ঞ ও সর্বনিম্ন কর্মভার (আদর্শ পছন্দ)";
      } else if (isTradeMatch) {
        matchReason = "ট্রেড বিষয়ের সাথে সামঞ্জস্যপূর্ণ শিক্ষক";
      } else if (weeklyLoad <= 14) {
        matchReason = "সর্বনিম্ন কর্মভার (Low Load) সম্পন্ন ফ্রি শিক্ষক";
      } else {
        matchReason = "এই পিরিয়ডে ক্লাস নেই (উপলব্ধ)";
      }

      candidates.push({
        faculty,
        weeklyLoad,
        isTradeMatch,
        score,
        matchReason,
      });
    });

    return candidates.sort((a, b) => b.score - a.score || a.weeklyLoad - b.weeklyLoad);
  };

  // 1-Click Auto Assign for all slots of the day
  const handleAutoAssignAll = () => {
    if (affectedSlots.length === 0) {
      toast.info("এই দিনে কোনো ক্লাস নেই।");
      return;
    }

    const assignments: Record<number, { substituteTeacherName: string; substituteTeacherId: number; reason: string }> = {};
    const assignedInSlot = new Set<string>();

    affectedSlots.forEach((slot) => {
      const recs = getRecommendationsForSlot(slot);
      // Pick highest score candidate not already assigned in same period
      const best = recs.find((c) => !assignedInSlot.has(`${slot.periodNo}_${c.faculty.name.toLowerCase()}`));
      if (best) {
        assignments[slot.id] = {
          substituteTeacherName: best.faculty.name,
          substituteTeacherId: Number(best.faculty.id),
          reason: best.matchReason,
        };
        assignedInSlot.add(`${slot.periodNo}_${best.faculty.name.toLowerCase()}`);
      }
    });

    setSelectedSubstitutes(assignments);
    toast.success(`সফলভাবে ${Object.keys(assignments).length}টি ক্লাসের জন্য সর্বনিম্ন-লোডের বদলি শিক্ষক নির্বাচন করা হয়েছে!`);
  };

  // Commit and update routines
  const handleConfirmSubstitutions = () => {
    const keys = Object.keys(selectedSubstitutes);
    if (keys.length === 0) {
      toast.error("অনুগ্রহ করে কমপক্ষে একটি ক্লাসের জন্য বদলি শিক্ষক নির্বাচন করুন।");
      return;
    }

    const updatedRoutines = routines.map((r) => {
      const sub = selectedSubstitutes[r.id];
      if (sub) {
        return {
          ...r,
          teacherName: sub.substituteTeacherName,
          teacherId: sub.substituteTeacherId,
          isSubstituted: true,
          originalTeacherName: absentTeacher ? absentTeacher.name : r.teacherName,
          substitutionReason: absenceReason,
        };
      }
      return r;
    });

    onCommitSubstitutions(updatedRoutines);
    toast.success("বদলি শিক্ষকের শিডিউল সফলভাবে রুটিনে কার্যকর ও সংরক্ষণ করা হয়েছে!");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  অটো-সাবস্টিটিউট রিকমেন্ডেশন ইঞ্জিন (Auto-Substitute Engine)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-black uppercase font-mono">
                  Smart Load Balancer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                অনুপস্থিত শিক্ষকের পিরিয়ড স্লটের জন্য সর্বনিম্ন-লোডের যোগ্য শিক্ষক স্বয়ংক্রিয়ভাবে খুঁজে বের করুন।
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Control Bar: Date, Day, Absent Teacher */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 shrink-0">
          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>তারিখ (Date):</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-bold focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>সপ্তাহের দিন (Day):</span>
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-bold"
            >
              {Object.entries(ROUTINE_DAYS_BN).slice(0, 5).map(([enDay, bnDay]) => (
                <option key={enDay} value={enDay}>
                  {bnDay} ({enDay})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-6 space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-rose-400" />
                <span>অনুপস্থিত শিক্ষক নির্বাচন করুন (Absent Teacher):</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {safeFaculty.length} জন ফ্যাকাল্টি
              </span>
            </label>
            <select
              value={selectedAbsentTeacherId}
              onChange={(e) => {
                setSelectedAbsentTeacherId(e.target.value);
                setSelectedSubstitutes({});
              }}
              className="w-full px-3 py-2 bg-slate-900 border border-rose-900/60 rounded-xl text-xs text-rose-200 font-bold focus:ring-1 focus:ring-rose-500"
            >
              <option value="">-- অনুপস্থিত শিক্ষক বেছে নিন --</option>
              {safeFaculty.map((f) => {
                const totalLoad = teacherLoadMap.get(f.name.toLowerCase()) || 0;
                return (
                  <option key={f.id} value={f.id}>
                    🔴 {f.name} ({f.nameBangla || f.designation}) · {f.department} · {totalLoad} ক্লাস/সপ্তাহ
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Absent Teacher Banner & Quick Action Buttons */}
        {absentTeacher && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 font-black text-sm">
                {absentTeacher.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">{absentTeacher.name}</h4>
                  <span className="text-xs text-rose-300">({absentTeacher.designation || "ইন্সট্রাক্টর"})</span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-bold">
                    {absentTeacher.department}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {ROUTINE_DAYS_BN[selectedDay] || selectedDay} এ মোট ক্লাস: <strong className="text-white font-mono">{affectedSlots.length}</strong>টি · সাপ্তাহিক মোট কর্মভার: <strong className="text-cyan-300 font-mono">{teacherLoadMap.get(absentTeacher.name.toLowerCase()) || 0}</strong> পিরিয়ড
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoAssignAll}
                disabled={affectedSlots.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ স্মার্ট অটো-ম্যাচ (Auto-Assign All)</span>
              </button>
            </div>
          </div>
        )}

        {/* Affected Slots & Recommendations List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {!absentTeacher ? (
            <div className="py-14 text-center space-y-3 bg-slate-950/40 border border-dashed border-slate-800 rounded-3xl">
              <UserX className="w-10 h-10 text-slate-600 dark:text-slate-400 mx-auto" />
              <p className="text-sm text-slate-400 font-medium">
                অনুপস্থিত শিক্ষক নির্বাচন করলে তাদের আজকের ক্লাসগুলো ও ফ্রি শিক্ষক তালিকা প্রদর্শিত হবে।
              </p>
            </div>
          ) : affectedSlots.length === 0 ? (
            <div className="py-14 text-center space-y-3 bg-slate-950/40 border border-dashed border-slate-800 rounded-3xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm text-emerald-400 font-bold">
                {ROUTINE_DAYS_BN[selectedDay] || selectedDay} এ {absentTeacher.name}-এর কোনো ক্লাস বরাদ্দ নেই!
              </p>
              <p className="text-xs text-slate-400">অন্য কোনো দিন বা শিক্ষক নির্বাচন করুন।</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                <span>আজকের ক্ষতিগ্রস্ত ক্লাস ও বদলি শিক্ষক সুপারিশ ({affectedSlots.length}টি ক্লাস)</span>
                <span className="text-cyan-400 font-mono">
                  নির্বাচিত: {Object.keys(selectedSubstitutes).length} / {affectedSlots.length}
                </span>
              </div>

              {affectedSlots.map((slot, index) => {
                const recommendations = getRecommendationsForSlot(slot);
                const currentSub = selectedSubstitutes[slot.id];

                return (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      currentSub
                        ? "bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-950/20"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Class details */}
                      <div className="space-y-1.5 min-w-[240px]">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black font-mono">
                            পিরিয়ড #{slot.periodNo}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {toBengaliNumerals(slot.startTime)} - {toBengaliNumerals(slot.endTime)}
                          </span>
                          {slot.durationMinutes && slot.durationMinutes > 40 && (
                            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-bold">
                              {toBengaliNumerals(slot.durationMinutes)} মিনিট
                            </span>
                          )}
                        </div>

                        <h5 className="text-sm font-black text-white">
                          {slot.className} {slot.tradeName ? `(${slot.tradeName})` : ""}
                        </h5>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                          <span className="text-cyan-400 font-semibold">{slot.subjectNameBangla || slot.subjectName}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono">[{slot.subjectCode}]</span>
                          <span>•</span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Building className="w-3 h-3 text-amber-400" />
                            {slot.roomNo}
                          </span>
                        </div>
                      </div>

                      {/* Middle/Right: Recommended Substitutes List */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>স্মার্ট বদলি সুপারিশ (সর্বনিম্ন লোড অগ্রাধিকার):</span>
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {recommendations.length} জন ফ্রি শিক্ষক
                          </span>
                        </div>

                        {recommendations.length === 0 ? (
                          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-900/50 text-amber-300 text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>এই সময়ে কোনো ফ্রি শিক্ষক পাওয়া যায়নি। অন্য ডিপার্টমেন্ট থেকে ম্যানুয়াল বরাদ্দ দিন।</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {recommendations.slice(0, 3).map((candidate, rankIdx) => {
                              const isSelected = currentSub?.substituteTeacherName === candidate.faculty.name;

                              return (
                                <button
                                  key={candidate.faculty.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSubstitutes({
                                      ...selectedSubstitutes,
                                      [slot.id]: {
                                        substituteTeacherName: candidate.faculty.name,
                                        substituteTeacherId: Number(candidate.faculty.id),
                                        reason: candidate.matchReason,
                                      },
                                    });
                                    toast.success(`পিরিয়ড #${slot.periodNo} এ ${candidate.faculty.name} কে নির্বাচন করা হয়েছে`);
                                  }}
                                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                    isSelected
                                      ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400"
                                      : rankIdx === 0
                                      ? "bg-slate-900 hover:bg-slate-800 border-cyan-500/50 hover:border-cyan-400"
                                      : "bg-slate-900/70 hover:bg-slate-800 border-slate-800 text-slate-300"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="min-w-0">
                                      <p className="text-xs font-black truncate text-white">
                                        {candidate.faculty.name}
                                      </p>
                                      <p className="text-[10px] text-slate-400 truncate">
                                        {candidate.faculty.department}
                                      </p>
                                    </div>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 ${
                                        isSelected
                                          ? "bg-white dark:bg-slate-900 text-emerald-800"
                                          : candidate.score >= 90
                                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                          : "bg-slate-800 text-slate-300"
                                      }`}
                                    >
                                      {candidate.score}% ম্যাচ
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60">
                                    <span className="font-mono text-slate-300 font-bold">
                                      লোড: {candidate.weeklyLoad} ক্লাস
                                    </span>
                                    {isSelected ? (
                                      <span className="text-white font-bold flex items-center gap-1">
                                        <Check className="w-3 h-3" /> নির্বাচিত
                                      </span>
                                    ) : (
                                      <span className="text-cyan-400 font-bold hover:underline">
                                        বেছে নিন
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              স্মারক নং: <strong className="text-white font-mono">{memoNo}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              বাতিল
            </button>

            <button
              type="button"
              onClick={handleConfirmSubstitutions}
              disabled={Object.keys(selectedSubstitutes).length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              <span>বদলি দায়িত্ব নিশ্চিত ও সংরক্ষণ করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
