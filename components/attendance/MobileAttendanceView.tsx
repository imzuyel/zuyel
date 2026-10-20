"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  CheckCheck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  AlertCircle,
  Check,
  Users,
  Search,
  FileCheck,
  FileEdit,
  Lock,
  Unlock,
  Trash2,
  HelpCircle,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  Filter,
  Layers,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  getApplicableTradesForClass,
  doesClassHaveTrade,
  parseClassNumeric,
  doesStudentMatchTrade,
} from "@/lib/academicStructure";
import { Student, AttendanceRecord, AttendanceEntry } from "@/lib/database";
import { getDayType } from "@/lib/attendanceData";
import { useAuth } from "@/context/AuthContext";
import { useGlobalSubjects } from "@/lib/useGlobalSubjects";
import AcademicFilterBar from "@/components/common/AcademicFilterBar";

export const PERIOD_LIST = [
  { no: 1, label: "১ম পিরিয়ড (০৮:৩০ - ০৯:১৫)", short: "১ম পিরিয়ড", time: "০৮:৩০ - ০৯:১৫" },
  { no: 2, label: "২য় পিরিয়ড (০৯:১৫ - ১০:০০)", short: "২য় পিরিয়ড", time: "০৯:১৫ - ১০:০০" },
  { no: 3, label: "৩য় পিরিয়ড (১০:০০ - ১০:৪৫)", short: "৩য় পিরিয়ড", time: "১০:০০ - ১০:৪৫" },
  { no: 4, label: "৪র্থ পিরিয়ড (১০:৪৫ - ১১:৩০)", short: "৪র্থ পিরিয়ড", time: "১০:৪৫ - ১১:৩০" },
  { no: 5, label: "৫ম পিরিয়ড (১১:৪৫ - ১২:৩০)", short: "৫ম পিরিয়ড", time: "১১:৪৫ - ১২:৩০" },
  { no: 6, label: "৬ষ্ঠ পিরিয়ড (১২:৩০ - ০১:১৫)", short: "৬ষ্ঠ পিরিয়ড", time: "১২:৩০ - ০১:১৫" },
  { no: 7, label: "৭ম পিরিয়ড (০২:০০ - ০২:৪৫)", short: "৭ম পিরিয়ড", time: "০২:০০ - ০২:৪৫" },
  { no: 8, label: "৮ম পিরিয়ড (০২:৪৫ - ০৩:৩০)", short: "৮ম পিরিয়ড", time: "০২:৪৫ - ০৩:৩০" },
];

type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused" | "Medical" | "Unmarked";

interface StudentAttendanceState {
  status: AttendanceStatus;
  remark?: string;
}

interface AttendanceRecordMap {
  [studentId: string]: StudentAttendanceState;
}

const PRESET_REMARKS = [
  "অসুস্থতাজনিত ছুটি (Sick Leave)",
  "অনুমতিপ্রাপ্ত ছুটি (Authorized Leave)",
  "দেরিতে আগমন (Late Arrival)",
  "প্রাতিষ্ঠানিক দায়িত্ব (School Activity)",
  "চিকিৎসাজনিত ছুটি (Medical Leave)",
];

export default function MobileAttendanceView() {
  const { currentUser, canTakeAttendance, isSuperOrPrincipal, showToast } = useAuth();
  const isAdminOrPrincipal = ["super_admin", "principal", "admin"].includes(currentUser?.role || "");

  // 1. Date defaults to today in YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // 2. Filter states
  const [selectedClassId, setSelectedClassId] = useState<number>(4); // default Class 9
  const [selectedTradeId, setSelectedTradeId] = useState<number>(0); // default 0 = All Trades
  const [selectedSection, setSelectedSection] = useState<string>("A");
  const [selectedPeriodNo, setSelectedPeriodNo] = useState<number>(1);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>("");
  const [searchStudent, setSearchStudent] = useState<string>("");

  // 3. Data & State
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [locking, setLocking] = useState(false);

  // Attendance maps
  const [attendanceMap, setAttendanceMap] = useState<AttendanceRecordMap>({});
  const [initialAttendanceMap, setInitialAttendanceMap] = useState<AttendanceRecordMap>({});
  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | null>(null);

  // UI helpers
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [activeRemarkStudentId, setActiveRemarkStudentId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Unsaved changes confirmation
  const [pendingFilterAction, setPendingFilterAction] = useState<(() => void) | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Status mapping helpers
  const mapStatusToUI = (status: string): AttendanceStatus => {
    const s = String(status || "").toUpperCase();
    if (s === "P" || s === "PRESENT") return "Present";
    if (s === "A" || s === "ABSENT") return "Absent";
    if (s === "L" || s === "LATE") return "Late";
    if (s === "E" || s === "EXCUSED") return "Excused";
    if (s === "M" || s === "MEDICAL") return "Medical";
    return "Present";
  };

  const mapStatusToDB = (status: AttendanceStatus): "P" | "A" | "L" | "E" | "M" => {
    if (status === "Present") return "P";
    if (status === "Absent") return "A";
    if (status === "Late") return "L";
    if (status === "Excused") return "E";
    if (status === "Medical") return "M";
    return "P";
  };

  // Academic logic
  const classNumeric = parseClassNumeric(selectedClassId);
  const hasTrade = doesClassHaveTrade(classNumeric);
  const applicableTrades = useMemo(() => {
    return getApplicableTradesForClass(classNumeric);
  }, [classNumeric]);

  // Global Subject Mapping Engine Integration
  const {
    subjects: availableSubjects,
    isLoading: subjectsLoading,
    commonSubjects,
    tradeSubjects,
  } = useGlobalSubjects({
    classVal: selectedClassId,
    tradeVal: hasTrade && selectedTradeId !== 0 ? selectedTradeId : undefined,
    academicYear: "2026",
  });

  // Auto-sync subject dropdown when class or trade changes
  useEffect(() => {
    if (availableSubjects.length > 0) {
      const exists = availableSubjects.some(
        (s) => s.code.toLowerCase() === selectedSubjectCode.toLowerCase()
      );
      if (!exists) {
        setSelectedSubjectCode(availableSubjects[0].code);
      }
    } else {
      setSelectedSubjectCode("");
    }
  }, [availableSubjects, selectedSubjectCode]);

  const currentSubjectObj = useMemo(() => {
    return (
      availableSubjects.find(
        (s) => s.code.toLowerCase() === selectedSubjectCode.toLowerCase()
      ) || availableSubjects[0]
    );
  }, [availableSubjects, selectedSubjectCode]);

  // Is dirty calculation
  const isDirty = useMemo(() => {
    if (students.length === 0) return false;
    for (const s of students) {
      const current = attendanceMap[s.studentId];
      const initial = initialAttendanceMap[s.studentId];
      if (!current && !initial) continue;
      if (!initial && current && current.status !== "Present") return true;
      if (initial && current) {
        if (initial.status !== current.status) return true;
        if ((initial.remark || "") !== (current.remark || "")) return true;
      }
    }
    return false;
  }, [students, attendanceMap, initialAttendanceMap]);

  // Browser reload guard when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Guard for filter switching when unsaved
  const triggerFilterChange = (action: () => void) => {
    if (isDirty) {
      setPendingFilterAction(() => action);
      setShowUnsavedModal(true);
    } else {
      action();
    }
  };

  const confirmDiscardAndSwitch = () => {
    setShowUnsavedModal(false);
    if (pendingFilterAction) {
      pendingFilterAction();
      setPendingFilterAction(null);
    }
  };

  const cancelDiscard = () => {
    setShowUnsavedModal(false);
    setPendingFilterAction(null);
  };

  // Fetch students and existing attendance
  const loadAttendanceData = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    const classNum = parseClassNumeric(selectedClassId);
    const tradeApplicable = doesClassHaveTrade(classNum);
    const tradeIdParam = tradeApplicable && selectedTradeId && selectedTradeId !== 0 ? `&tradeId=${selectedTradeId}` : "";
    const sectionParam = selectedSection !== "all" ? `&section=${selectedSection}` : "";

    try {
      // 1. Fetch Students
      const stuRes = await fetch(`/api/students?classId=${selectedClassId}${tradeIdParam}${sectionParam}&status=Active`);
      const stuData = await stuRes.json();

      // 2. Fetch Existing Attendance
      const attRes = await fetch(
        `/api/attendance?date=${selectedDate}&classId=${selectedClassId}${tradeIdParam}${sectionParam}&periodNo=${selectedPeriodNo}`
      );
      const attData = await attRes.json();

      let loadedStudents: Student[] = [];
      if (stuData.success) {
        loadedStudents = stuData.items || [];
        setStudents(loadedStudents);
      }

      // Handle existing attendance synchronization
      if (attData.success && attData.records && attData.records.length > 0) {
        const record: AttendanceRecord = attData.records[0];
        setExistingRecord(record);
        if (record.subjectCode) {
          setSelectedSubjectCode(record.subjectCode);
        }

        const newMap: AttendanceRecordMap = {};
        record.entries.forEach((entry: AttendanceEntry) => {
          newMap[entry.studentCode || String(entry.studentId)] = {
            status: mapStatusToUI(entry.status),
            remark: entry.remark,
          };
        });

        // For any student not in the saved record, default to Present
        loadedStudents.forEach((s) => {
          if (!newMap[s.studentId]) {
            newMap[s.studentId] = { status: "Present" };
          }
        });

        setAttendanceMap(newMap);
        setInitialAttendanceMap(JSON.parse(JSON.stringify(newMap)));
      } else {
        setExistingRecord(null);
        const defaultMap: AttendanceRecordMap = {};
        loadedStudents.forEach((s) => {
          defaultMap[s.studentId] = { status: "Present" };
        });
        setAttendanceMap(defaultMap);
        setInitialAttendanceMap(JSON.parse(JSON.stringify(defaultMap)));
      }
    } catch (err) {
      console.error("Failed to load attendance data:", err);
      setFeedback({ type: "error", message: "তথ্যাদি লোড করতে সমস্যা হয়েছে।" });
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedClassId, selectedTradeId, selectedSection, selectedPeriodNo]);

  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  // Handle class change
  const handleClassChange = (newClsId: number) => {
    triggerFilterChange(() => {
      setSelectedClassId(newClsId);
      const num = parseClassNumeric(newClsId);
      const isVocational = doesClassHaveTrade(num);
      if (isVocational) {
        setSelectedTradeId(0); // Default to "All Trades" for Class 9-12
      } else {
        setSelectedTradeId(0); // Class 6-8: Trade does NOT apply
      }
    });
  };

  // Filter students for local search
  const filteredStudents = useMemo(() => {
    if (!searchStudent.trim()) return students;
    const q = searchStudent.toLowerCase().trim();
    return students.filter((s) => {
      const matchName = s.name.toLowerCase().includes(q) || (s.nameBangla && s.nameBangla.includes(q));
      const matchId = String(s.studentId).toLowerCase().includes(q);
      const matchRoll = String(s.roll) === q;
      return matchName || matchId || matchRoll;
    });
  }, [students, searchStudent]);

  // One-tap status toggler
  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    if (existingRecord?.isLocked && !isAdminOrPrincipal) return;
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  // Set student remark
  const setStudentRemark = (studentId: string, remark: string) => {
    if (existingRecord?.isLocked && !isAdminOrPrincipal) return;
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remark,
      },
    }));
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    if (existingRecord?.isLocked && !isAdminOrPrincipal) return;
    const nextMap = { ...attendanceMap };
    for (const s of students) {
      nextMap[s.studentId] = { ...nextMap[s.studentId], status: "Present" };
    }
    setAttendanceMap(nextMap);
  };

  // Mark all absent
  const handleMarkAllAbsent = () => {
    if (existingRecord?.isLocked && !isAdminOrPrincipal) return;
    const nextMap = { ...attendanceMap };
    for (const s of students) {
      nextMap[s.studentId] = { ...nextMap[s.studentId], status: "Absent" };
    }
    setAttendanceMap(nextMap);
  };

  // Revert / Undo changes
  const handleUndoChanges = () => {
    setAttendanceMap(JSON.parse(JSON.stringify(initialAttendanceMap)));
    setFeedback({ type: "info", message: "পূর্বের অবস্থায় ফেরত নেওয়া হয়েছে (Reverted to initial state)।" });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Save attendance batch
  const handleSaveAttendance = async () => {
    if (students.length === 0) return;
    setSaving(true);
    setFeedback(null);

    try {
      const entries = students.map((s) => ({
        studentId: Number(s.id),
        studentCode: s.studentId,
        roll: Number(s.roll),
        name: s.nameBangla || s.name,
        status: mapStatusToDB(attendanceMap[s.studentId]?.status || "Present"),
        remark: attendanceMap[s.studentId]?.remark || "",
      }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          classId: selectedClassId,
          tradeId: hasTrade && selectedTradeId !== 0 ? selectedTradeId : null,
          section: selectedSection,
          periodNo: selectedPeriodNo,
          subjectCode: currentSubjectObj?.code || "GEN-01",
          subjectName: currentSubjectObj?.nameBangla || currentSubjectObj?.name || "দৈনিক শ্রেণি হাজিরা",
          entries: entries,
          session: "2026",
          teacherName: currentUser?.fullName || "Assigned Teacher",
          changedBy: `${currentUser?.fullName || "Teacher"} (${currentUser?.designation || "Staff"})`,
          reason: existingRecord ? "হাজিরা তথ্য হালনাগাদ সম্পন্ন" : "নতুন হাজিরা গ্রহণ সম্পন্ন",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          message: data.message || "হাজিরা সফলভাবে সংরক্ষিত হয়েছে।",
        });
        showToast(data.message || "হাজিরা সফলভাবে সংরক্ষিত হয়েছে।", "success");
        setExistingRecord(data.record);
        setInitialAttendanceMap(JSON.parse(JSON.stringify(attendanceMap)));
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({
          type: "error",
          message: data.error || "হাজিরা সংরক্ষণ ব্যর্থ হয়েছে।",
        });
        showToast(data.error || "হাজিরা সংরক্ষণ ব্যর্থ হয়েছে।", "error");
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: "সার্ভারের সাথে যোগাযোগে ত্রুটি হয়েছে।",
      });
      showToast("সার্ভারের সাথে যোগাযোগে ত্রুটি হয়েছে।", "error");
    } finally {
      setSaving(false);
    }
  };

  // Lock / Unlock Attendance
  const handleToggleLock = async () => {
    if (!existingRecord || !isAdminOrPrincipal) return;
    setLocking(true);
    try {
      const nextLockState = !existingRecord.isLocked;
      const res = await fetch("/api/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: existingRecord.id,
          isLocked: nextLockState,
          userRole: currentUser?.role || "admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExistingRecord(data.record);
        showToast(data.message, "info");
      } else {
        showToast(data.error || "লক অবস্থা পরিবর্তন ব্যর্থ হয়েছে।", "error");
      }
    } catch {
      showToast("নেটওয়ার্ক ত্রুটি।", "error");
    } finally {
      setLocking(false);
    }
  };

  // Delete Attendance Record
  const handleDeleteAttendance = async () => {
    if (!existingRecord || !isAdminOrPrincipal) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/attendance?recordId=${existingRecord.id}&userRole=${currentUser?.role || "admin"}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "হাজিরা রেকর্ড সফলভাবে মুছে ফেলা হয়েছে।", "success");
        setShowDeleteConfirm(false);
        setExistingRecord(null);
        // Reset to default Present
        const defaultMap: AttendanceRecordMap = {};
        students.forEach((s) => {
          defaultMap[s.studentId] = { status: "Present" };
        });
        setAttendanceMap(defaultMap);
        setInitialAttendanceMap(JSON.parse(JSON.stringify(defaultMap)));
      } else {
        showToast(data.error || "রেকর্ড মোছা সম্ভব হয়নি।", "error");
      }
    } catch {
      showToast("নেটওয়ার্ক ত্রুটি।", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Live summary
  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    let medical = 0;

    for (const s of students) {
      const st = attendanceMap[s.studentId]?.status || "Present";
      if (st === "Present") present++;
      else if (st === "Absent") absent++;
      else if (st === "Late") late++;
      else if (st === "Excused") excused++;
      else if (st === "Medical") medical++;
    }

    const total = students.length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      late,
      excused,
      medical,
      rate,
    };
  }, [students, attendanceMap]);

  const activeTradeObj = ALL_TRADES.find((t) => t.id === selectedTradeId);
  const activeClassObj = ACADEMIC_CLASSES.find((c) => c.id === selectedClassId);

  return (
    <div id="mobile_attendance_view_root" className="space-y-4 pb-28 max-w-4xl mx-auto">
      {/* 1. Page Header with Title & Role Actions */}
      <div
        id="attendance_page_header"
        className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              {existingRecord ? (
                <FileCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <FileEdit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              )}
              <span>{existingRecord ? "হাজিরা পর্যালোচনা ও হালনাগাদ" : "দৈনিক শিক্ষার্থী হাজিরা গ্রহণ"}</span>
            </h1>
            {existingRecord?.isLocked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                <Lock className="w-3 h-3" />
                লক করা
              </span>
            )}
            {isDirty && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 animate-pulse">
                অসংরক্ষিত পরিবর্তন
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ • মোবাইল-বান্ধব হাজিরা খাতা
          </p>
        </div>

        {/* Action buttons on desktop */}
        <div className="flex items-center gap-2 flex-wrap">
          {isDirty && (
            <button
              id="attendance_undo_btn"
              type="button"
              onClick={handleUndoChanges}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}

          {existingRecord && isAdminOrPrincipal && (
            <button
              id="attendance_lock_btn"
              type="button"
              onClick={handleToggleLock}
              disabled={locking}
              className="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 transition-all"
            >
              {existingRecord.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{existingRecord.isLocked ? "Unlock" : "Lock"}</span>
            </button>
          )}

          {existingRecord && isAdminOrPrincipal && (
            <button
              id="attendance_delete_btn"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>মুছে ফেলুন</span>
            </button>
          )}

          <button
            id="attendance_top_save_btn"
            type="button"
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0 || (existingRecord?.isLocked && !isAdminOrPrincipal)}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "সংরক্ষণ হচ্ছে..." : existingRecord ? "Update Record" : "Save Attendance"}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          id="attendance_feedback_banner"
          className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800"
              : feedback.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800"
              : "bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : feedback.type === "error" ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 2. Structured Academic Filters */}
      <div
        id="attendance_filter_panel"
        className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <Filter className="w-4 h-4" />
            <span>ফিল্টার ও শ্রেণি-বিষয় নির্বাচন (Academic Filters & Subject Sync)</span>
          </div>
          <div className="text-[11px] text-slate-400">ধাপ: তারিখ → শ্রেণি → ট্রেড → শাখা → পিরিয়ড ও বিষয়</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Step 1: Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>তারিখ (Date) *</span>
            </label>
            <input
              id="attendance_date_input"
              type="date"
              value={selectedDate}
              onChange={(e) => triggerFilterChange(() => setSelectedDate(e.target.value))}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-indigo-500"
            />
            {(() => {
              const dt = getDayType(selectedDate);
              const d = new Date(selectedDate + "T00:00:00");
              const day = d.getDay();
              if (dt.isWeekend) {
                return (
                  <div className="mt-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>সাপ্তাহিক ছুটি ({day === 5 ? "শুক্রবার" : "শনিবার"})</span>
                  </div>
                );
              }
              if (dt.isHoliday) {
                return (
                  <div className="mt-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>ছুটি: {dt.holidayTitle}</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Unified Academic Filter Bar Integration */}
          <div className="sm:col-span-2 lg:col-span-3">
            <AcademicFilterBar
              filter={{
                session: "2026",
                classId: String(selectedClassId),
                tradeId: selectedTradeId === 0 ? "all" : String(selectedTradeId),
                tradeCode: selectedTradeId === 0 ? "all" : "",
                section: selectedSection,
                department: "all"
              }}
              onChange={(newFilter) => {
                triggerFilterChange(() => {
                  handleClassChange(Number(newFilter.classId));
                  setSelectedTradeId(newFilter.tradeId === "all" || newFilter.tradeId === "" ? 0 : Number(newFilter.tradeId));
                  setSelectedSection(newFilter.section);
                });
              }}
              showSession={false}
              showDepartment={false}
              showSection={true}
              showAllOption={true}
              compact={true}
            />
          </div>
        </div>

        {/* Step 5 & Step 6: Period and Global Subject Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/70">
          {/* Period Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>পিরিয়ড (Period) *</span>
            </label>
            <select
              id="attendance_period_select"
              value={selectedPeriodNo}
              onChange={(e) => triggerFilterChange(() => setSelectedPeriodNo(Number(e.target.value)))}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-indigo-500"
            >
              {PERIOD_LIST.map((p) => (
                <option key={p.no} value={p.no}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Global Subject Dropdown (Auto-synced with Global Settings Hub) */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-cyan-600 dark:text-cyan-400 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
                <span>বিষয় নির্বাচন (Global Subject Mapping) *</span>
              </span>
              <span className="text-[10px] font-mono font-normal text-cyan-600 dark:text-cyan-400">
                {subjectsLoading ? "লোড হচ্ছে..." : `${availableSubjects.length}টি বিষয় সিঙ্কড`}
              </span>
            </label>
            <select
              id="attendance_subject_select"
              value={selectedSubjectCode}
              onChange={(e) => setSelectedSubjectCode(e.target.value)}
              disabled={subjectsLoading || availableSubjects.length === 0}
              className="w-full py-2.5 px-3 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-cyan-500"
            >
              {availableSubjects.length === 0 ? (
                <option value="">এই শ্রেণির কোনো বিষয় পাওয়া যায়নি</option>
              ) : (
                <>
                  {commonSubjects.length > 0 && (
                    <optgroup label="সাধারণ আবশ্যিক বিষয় (Common / Core NCTB)">
                      {commonSubjects.map((s) => (
                        <option key={s.code} value={s.code}>
                          [{s.code}] {s.nameBangla || s.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {tradeSubjects.length > 0 && (
                    <optgroup label="কারিগরি স্পেশালাইজড বিষয় (Trade Core BTEB)">
                      {tradeSubjects.map((s) => (
                        <option key={s.code} value={s.code}>
                          [{s.code}] {s.nameBangla || s.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </>
              )}
            </select>
          </div>
        </div>

        {/* Informative Synchronized Subject Badge */}
        {currentSubjectObj && (
          <div className="text-[11px] font-semibold text-cyan-800 dark:text-cyan-300 bg-cyan-50/70 dark:bg-cyan-950/50 p-2.5 rounded-xl border border-cyan-200 dark:border-cyan-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span>
                নির্বাচিত বিষয়:{" "}
                <strong className="text-cyan-950 dark:text-white">
                  {currentSubjectObj.nameBangla || currentSubjectObj.name}
                </strong>{" "}
                ({currentSubjectObj.code})
              </span>
              <span>•</span>
              <span className="font-medium">
                {currentSubjectObj.isCommon ? "সাধারণ বিষয়" : "ট্রেড স্পেশালাইজড"}
              </span>
              {currentSubjectObj.marks && (
                <>
                  <span>•</span>
                  <span className="font-mono">পূর্ণমান: {currentSubjectObj.marks}</span>
                </>
              )}
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/80 font-bold font-mono text-cyan-900 dark:text-cyan-200">
              গ্লোবাল Hub সিঙ্কড
            </span>
          </div>
        )}

        {/* Fast search filter */}
        <div className="relative pt-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" />
          <input
            id="attendance_search_input"
            type="text"
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            placeholder="শিক্ষার্থীর নাম, রোল অথবা আইডি দিয়ে দ্রুত খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-indigo-500"
          />
        </div>
      </div>

      {/* 3. Context Banner: Clear Active Context */}
      <div
        id="attendance_context_banner"
        className="bg-indigo-50/60 dark:bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
      >
        <div className="flex items-center gap-2 flex-wrap font-bold text-slate-800 dark:text-slate-200">
          <span className="text-indigo-700 dark:text-indigo-400">সক্রিয় খাতা:</span>
          <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
            {selectedDate}
          </span>
          <span>•</span>
          <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
            {activeClassObj?.nameBangla || `Class ${classNumeric}`}
          </span>
          <span>•</span>
          <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
            শাখা {selectedSection === "all" ? "উভয়" : selectedSection}
          </span>
          <span>•</span>
          <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
            {hasTrade ? (activeTradeObj ? activeTradeObj.nameBangla : "সকল ট্রেড (All Trades)") : "ট্রেড প্রযোজ্য নয় (Pre-Vocational)"}
          </span>
          <span>•</span>
          <span className="bg-cyan-50 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800 font-mono">
            {selectedPeriodNo}ম পিরিয়ড
          </span>
          {currentSubjectObj && (
            <>
              <span>•</span>
              <span className="bg-cyan-50 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800">
                {currentSubjectObj.nameBangla || currentSubjectObj.name} ({currentSubjectObj.code})
              </span>
            </>
          )}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {existingRecord ? (
            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              পূর্বে সংরক্ষিত • শিক্ষক: {existingRecord.teacherName || "Assigned"}
            </span>
          ) : (
            <span className="text-indigo-600 dark:text-indigo-400">নতুন হাজিরা খসড়া (Unsaved Draft)</span>
          )}
        </div>
      </div>

      {/* 4. Live Attendance Summary Header */}
      <div
        id="attendance_summary_cards"
        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>উপস্থিতি পরিসংখ্যান ও দ্রুত কন্ট্রোল:</span>
            <span className="text-indigo-600 font-bold">উপস্থিতির হার {summary.rate}%</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="attendance_mark_all_present"
              type="button"
              onClick={handleMarkAllPresent}
              disabled={existingRecord?.isLocked && !isAdminOrPrincipal}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-black border border-emerald-200 dark:border-emerald-800 transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>সকলকে উপস্থিত</span>
            </button>
            <button
              id="attendance_mark_all_absent"
              type="button"
              onClick={handleMarkAllAbsent}
              disabled={existingRecord?.isLocked && !isAdminOrPrincipal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-black border border-rose-200 dark:border-rose-800 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>সকলকে অনুপস্থিত</span>
            </button>
          </div>
        </div>

        {/* 5 Summary Badges with Progress Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">মোট শিক্ষার্থী</div>
            <div className="text-lg font-black text-slate-800 dark:text-white">{summary.total}</div>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
            <div className="text-[10px] text-emerald-600 font-bold">উপস্থিত (P)</div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{summary.present}</div>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
            <div className="text-[10px] text-rose-600 font-bold">অনুপস্থিত (A)</div>
            <div className="text-lg font-black text-rose-600 dark:text-rose-400">{summary.absent}</div>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
            <div className="text-[10px] text-amber-600 font-bold">দেরিতে (L)</div>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">{summary.late}</div>
          </div>
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-blue-600 font-bold">ছুটি (E)</div>
            <div className="text-lg font-black text-blue-600 dark:text-blue-400">{summary.excused}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${summary.total ? (summary.present / summary.total) * 100 : 0}%` }}
          />
          <div
            className="bg-amber-400 h-full transition-all duration-300"
            style={{ width: `${summary.total ? (summary.late / summary.total) * 100 : 0}%` }}
          />
          <div
            className="bg-blue-400 h-full transition-all duration-300"
            style={{ width: `${summary.total ? (summary.excused / summary.total) * 100 : 0}%` }}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-300"
            style={{ width: `${summary.total ? (summary.absent / summary.total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* 5. Student Attendance List: Single Column, Large Touch-Friendly Buttons */}
      <div id="attendance_student_list" className="space-y-2.5">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl text-center space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 animate-pulse">লোড হচ্ছে (শিক্ষার্থী তালিকা প্রস্তুত হচ্ছে)...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl text-center space-y-2 border border-slate-200 dark:border-slate-800">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              এই শ্রেণি ও ফিল্টারে কোনো শিক্ষার্থী পাওয়া যায়নি
            </p>
            <p className="text-xs text-slate-400">
              অনুগ্রহ করে অন্য শ্রেণি বা শাখা নির্বাচন করুন অথবা সঠিক ট্রেড বাছাই করুন।
            </p>
          </div>
        ) : (
          filteredStudents.map((student, idx) => {
            const currentItem = attendanceMap[student.studentId] || { status: "Present" };
            const currentStatus = currentItem.status;
            const hasRemark = Boolean(currentItem.remark);
            const isRemarkOpen = activeRemarkStudentId === student.studentId;

            return (
              <div
                key={student.studentId}
                id={`student_row_${student.studentId}`}
                className={`bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                  existingRecord?.isLocked && !isAdminOrPrincipal ? "opacity-80" : "hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs"
                } ${
                  currentStatus === "Absent"
                    ? "border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40/10"
                    : currentStatus === "Late"
                    ? "border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40/10"
                    : currentStatus === "Excused"
                    ? "border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40/10"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: SL, Roll, Student Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-black text-sm flex flex-col items-center justify-center border border-indigo-200 dark:border-indigo-800 shrink-0">
                      <span className="text-[9px] text-slate-400 font-normal">রোল</span>
                      <span>{String(student.roll).padStart(2, "0")}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {student.nameBangla || student.name}
                        </span>
                        {student.nameBangla && student.nameBangla !== student.name && (
                          <span className="text-[11px] text-slate-400 font-medium">({student.name})</span>
                        )}
                        {hasTrade && student.tradeName && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold border border-slate-200 dark:border-slate-700">
                            {student.tradeNameBangla || student.tradeName}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>ID: {student.studentId}</span>
                        <span>•</span>
                        <span>শাখা: {student.section || "A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: 1-Tap Touch Buttons: [ Present ] [ Absent ] [ Late ] [ Excused ] */}
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    {/* Present Button */}
                    <button
                      type="button"
                      id={`btn_present_${student.studentId}`}
                      disabled={existingRecord?.isLocked && !isAdminOrPrincipal}
                      onClick={() => setStudentStatus(student.studentId, "Present")}
                      className={`min-h-[44px] py-2 px-3 sm:px-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        currentStatus === "Present"
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                      } disabled:opacity-50`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>উপস্থিত</span>
                    </button>

                    {/* Absent Button */}
                    <button
                      type="button"
                      id={`btn_absent_${student.studentId}`}
                      disabled={existingRecord?.isLocked && !isAdminOrPrincipal}
                      onClick={() => setStudentStatus(student.studentId, "Absent")}
                      className={`min-h-[44px] py-2 px-3 sm:px-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        currentStatus === "Absent"
                          ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                      } disabled:opacity-50`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>অনুপস্থিত</span>
                    </button>

                    {/* Late Button */}
                    <button
                      type="button"
                      id={`btn_late_${student.studentId}`}
                      disabled={existingRecord?.isLocked && !isAdminOrPrincipal}
                      onClick={() => setStudentStatus(student.studentId, "Late")}
                      className={`min-h-[44px] py-2 px-2.5 sm:px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                        currentStatus === "Late"
                          ? "bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-400"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                      } disabled:opacity-50`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>দেরি</span>
                    </button>

                    {/* Excused Button */}
                    <button
                      type="button"
                      id={`btn_excused_${student.studentId}`}
                      disabled={existingRecord?.isLocked && !isAdminOrPrincipal}
                      onClick={() => setStudentStatus(student.studentId, "Excused")}
                      className={`min-h-[44px] py-2 px-2.5 sm:px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                        currentStatus === "Excused"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                      } disabled:opacity-50`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>ছুটি</span>
                    </button>

                    {/* Medical (M) Button */}
                    <button
                      type="button"
                      id={`btn_medical_${student.studentId}`}
                      disabled={existingRecord?.isLocked && !isAdminOrPrincipal}
                      onClick={() => setStudentStatus(student.studentId, "Medical")}
                      className={`min-h-[44px] py-2 px-2.5 sm:px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                        currentStatus === "Medical"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                      } disabled:opacity-50`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>মেডিকেল</span>
                    </button>

                    {/* Remark toggle button */}
                    <button
                      type="button"
                      id={`btn_remark_${student.studentId}`}
                      onClick={() =>
                        setActiveRemarkStudentId(isRemarkOpen ? null : student.studentId)
                      }
                      className={`min-h-[44px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        hasRemark
                          ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400"
                      }`}
                      title="মন্তব্য যোগ করুন"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {hasRemark && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                    </button>
                  </div>
                </div>

                {/* Inline Remark Drawer */}
                {isRemarkOpen && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      <span>মন্তব্য (Remark) — {student.nameBangla || student.name}:</span>
                      {hasRemark && (
                        <button
                          type="button"
                          onClick={() => setStudentRemark(student.studentId, "")}
                          className="text-rose-600 hover:underline"
                        >
                          মুছে ফেলুন
                        </button>
                      )}
                    </div>

                    {/* Quick Preset Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_REMARKS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setStudentRemark(student.studentId, preset)}
                          className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={currentItem.remark || ""}
                      onChange={(e) => setStudentRemark(student.studentId, e.target.value)}
                      placeholder="কাস্টম মন্তব্য লিখুন..."
                      className="w-full text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-indigo-500"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 6. Sticky Bottom Action Bar for Mobile Touch Convenience */}
      <div
        id="attendance_sticky_bottom_bar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xl"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 dark:text-slate-400">মোট: </span>
            <span className="font-black text-slate-900 dark:text-white">{summary.total}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-emerald-600 font-bold">উপ: {summary.present}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-rose-600 font-bold">অনু: {summary.absent}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-amber-600 font-bold">দেরি: {summary.late}</span>
          </div>

          <button
            id="attendance_bottom_save_btn"
            type="button"
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0 || (existingRecord?.isLocked && !isAdminOrPrincipal)}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "সংরক্ষণ হচ্ছে..." : existingRecord ? "Update Record" : "Save Attendance"}</span>
          </button>
        </div>
      </div>

      {/* 7. Modal: Unsaved Changes Guard */}
      {showUnsavedModal && (
        <div
          id="unsaved_changes_modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  অসংরক্ষিত হাজিরা রয়েছে
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  আপনি হাজিরা তালিকায় কিছু পরিবর্তন করেছেন যা এখনও সংরক্ষণ করা হয়নি। শ্রেণি বা তারিখ পরিবর্তন করলে এই পরিবর্তনগুলো মুছে যাবে।
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={cancelDiscard}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all"
              >
                সম্পাদনা চালিয়ে যান
              </button>
              <button
                type="button"
                onClick={confirmDiscardAndSwitch}
                className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all"
              >
                পরিবর্তন বাতিল করে এগিয়ে যান
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal: Delete Attendance Confirmation */}
      {showDeleteConfirm && existingRecord && (
        <div
          id="delete_attendance_modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  হাজিরা রেকর্ড মুছে ফেলা নিশ্চিত করুন
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  তারিখ: <span className="font-bold text-slate-800 dark:text-slate-200">{existingRecord.date}</span>, শ্রেণি: <span className="font-bold text-slate-800 dark:text-slate-200">{existingRecord.className}</span> (শাখা {existingRecord.section})।
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-2">
                  সতর্কতা: এই হাজিরা রেকর্ডের মোট {existingRecord.entries?.length || 0} জন শিক্ষার্থীর হাজিরা তথ্য স্থায়ীভাবে মুছে যাবে।
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleDeleteAttendance}
                disabled={deleting}
                className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছে ফেলুন"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
