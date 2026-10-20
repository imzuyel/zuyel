"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  ShieldAlert,
  Search,
  Users,
  Save,
  Lock,
  Unlock,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  MessageSquare,
  AlertCircle,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Edit2,
  Check,
  ArrowUpDown,
  Laptop,
} from "lucide-react";
import {
  Student,
  AttendanceRecord,
  AttendanceEntry,
  AttendanceStatus,
  AttendanceWorkflowStatus,
} from "@/lib/database";
import {
  ATTENDANCE_STATUS_META,
  AttendanceContext,
} from "@/lib/attendanceEngine";
import { AttendanceFilterState } from "./DynamicAttendanceContextBar";
import { useAuth } from "@/context/AuthContext";
import AttendanceCorrectionModal from "./AttendanceCorrectionModal";

interface DigitalAttendanceRegisterProps {
  filter: AttendanceFilterState;
  onRecordSaved?: (record: AttendanceRecord) => void;
  onOpenExcelHub?: () => void;
}

const PRESET_REMARKS = [
  "অসুস্থতাজনিত অনুপস্থিতি (Sick)",
  "অনুমতিপ্রাপ্ত ছুটি (Authorized Leave)",
  "দেরিতে ক্লাসে আগমন (Late Arrival)",
  "প্রাতিষ্ঠানিক দায়িত্ব পালন (School Duty)",
  "পারিবারিক কারণ (Family Reason)",
];

export default function DigitalAttendanceRegister({
  filter,
  onRecordSaved,
  onOpenExcelHub,
}: DigitalAttendanceRegisterProps) {
  const { currentUser, isSuperOrPrincipal } = useAuth();
  const isAdminOrPrincipal = ["super_admin", "principal", "admin", "head_master"].includes(
    currentUser?.role || ""
  );

  // 1. Pagination & Search State (Server-Side)
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // 2. Data State
  const [pagedStudents, setPagedStudents] = useState<Student[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | null>(null);

  // 3. IN-FLIGHT CHANGE PRESERVATION
  // Key: studentId (number) -> { status: AttendanceStatus, inTime?: string, remark?: string }
  // When switching pages or applying bulk actions, this accumulator is strictly retained!
  const [pendingChanges, setPendingChanges] = useState<
    Record<number, { status: AttendanceStatus; inTime?: string; remark?: string }>
  >({});

  // 4. Multi-selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());

  // 5. Fast Attendance Mode (Mark All Present by default)
  const [fastMode, setFastMode] = useState<boolean>(true);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);

  // 6. Action States
  const [saving, setSaving] = useState<boolean>(false);
  const [locking, setLocking] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [activeRemarkStudentId, setActiveRemarkStudentId] = useState<number | null>(null);

  // 7. Correction Modal
  const [correctionTarget, setCorrectionTarget] = useState<{
    isOpen: boolean;
    student?: Student;
    currentStatus?: AttendanceStatus;
    currentRemark?: string;
  }>({ isOpen: false });

  // 8. Fetch Existing Attendance Record for Context
  const fetchExistingRecord = useCallback(async () => {
    try {
      const q = new URLSearchParams({
        session: filter.session,
        classId: String(filter.classId),
        section: filter.section,
        tradeId: filter.tradeId ? String(filter.tradeId) : "0",
        date: filter.date,
        periodNo: String(filter.periodNo),
      });

      const res = await fetch(`/api/attendance?${q.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.records)) {
        const found = data.records.find(
          (r: AttendanceRecord) =>
            r.date === filter.date &&
            r.periodNo === filter.periodNo &&
            r.section === filter.section
        );

        if (found) {
          setExistingRecord(found);
          // Populate pending changes from existing record
          const initialMap: Record<number, { status: AttendanceStatus; inTime?: string; remark?: string }> = {};
          found.entries.forEach((e: AttendanceEntry) => {
            initialMap[e.studentId] = {
              status: e.status,
              inTime: e.inTime,
              remark: e.remark,
            };
          });
          setPendingChanges(initialMap);
          return;
        }
      }
      setExistingRecord(null);
    } catch (err) {
      console.error("Error fetching existing attendance record:", err);
    }
  }, [filter.session, filter.classId, filter.section, filter.tradeId, filter.date, filter.periodNo]);

  // 9. Fetch Paginated Students from Server
  const fetchPagedStudents = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        action: "students_paged",
        classId: String(filter.classId),
        section: filter.section,
        tradeId: filter.tradeId ? String(filter.tradeId) : "0",
        session: filter.session,
        search: debouncedSearch,
        page: String(page),
        limit: String(limit),
      });

      const res = await fetch(`/api/attendance?${q.toString()}`);
      const data = await res.json();

      if (data.success) {
        setPagedStudents(data.items || []);
        setTotalStudents(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  }, [filter.classId, filter.section, filter.tradeId, filter.session, debouncedSearch, page, limit]);

  useEffect(() => {
    fetchExistingRecord();
  }, [fetchExistingRecord]);

  useEffect(() => {
    fetchPagedStudents();
  }, [fetchPagedStudents]);

  // Clear in-flight changes when class or date completely shifts
  useEffect(() => {
    setSelectedStudentIds(new Set());
  }, [filter.classId, filter.section, filter.tradeId, filter.date, filter.periodNo]);

  // Helper to get status of student: Pending change -> Existing record -> Fast mode default 'P'
  const getStudentStatus = (studentId: number): AttendanceStatus => {
    if (pendingChanges[studentId]) {
      return pendingChanges[studentId].status;
    }
    if (existingRecord) {
      const e = existingRecord.entries.find((en) => en.studentId === studentId);
      if (e) return e.status;
    }
    return fastMode ? "P" : "P";
  };

  const getStudentRemark = (studentId: number): string => {
    if (pendingChanges[studentId]?.remark !== undefined) {
      return pendingChanges[studentId].remark || "";
    }
    if (existingRecord) {
      const e = existingRecord.entries.find((en) => en.studentId === studentId);
      if (e?.remark) return e.remark;
    }
    return "";
  };

  const getStudentInTime = (studentId: number): string => {
    if (pendingChanges[studentId]?.inTime !== undefined) {
      return pendingChanges[studentId].inTime || "";
    }
    if (existingRecord) {
      const e = existingRecord.entries.find((en) => en.studentId === studentId);
      if (e?.inTime) return e.inTime;
    }
    return "";
  };

  // Change individual student status
  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    if (existingRecord?.isLocked && !isAdminOrPrincipal) {
      setFeedback({
        type: "error",
        message: "এই রেকর্ডটি চূড়ান্ত ও লক করা আছে। সাধারণ ব্যবহারকারী এটি পরিবর্তন করতে পারবেন না।",
      });
      return;
    }

    setPendingChanges((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        status,
      },
    }));
  };

  const handleRemarkChange = (studentId: number, remark: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: getStudentStatus(studentId) }),
        remark,
      },
    }));
  };

  const handleInTimeChange = (studentId: number, inTime: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: getStudentStatus(studentId) }),
        inTime,
      },
    }));
  };

  // Bulk Actions
  const handleBulkSetStatus = (status: AttendanceStatus, target: "all" | "selected") => {
    if (existingRecord?.isLocked && !isAdminOrPrincipal) {
      setFeedback({
        type: "error",
        message: "রেকর্ডটি লক করা আছে। পরিবর্তন করতে অধ্যক্ষের অনুমতি আবশ্যক।",
      });
      return;
    }

    const newChanges = { ...pendingChanges };
    const targets = target === "selected" ? Array.from(selectedStudentIds) : pagedStudents.map((s) => s.id);

    targets.forEach((id) => {
      newChanges[id] = {
        ...(newChanges[id] || {}),
        status,
      };
    });

    setPendingChanges(newChanges);
    setFeedback({
      type: "info",
      message: `${targets.length} জন শিক্ষার্থীর স্থিতি '${ATTENDANCE_STATUS_META[status].labelBangla}' এ নির্ধারণ করা হয়েছে।`,
    });
  };

  // Multi-selection toggles
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.size === pagedStudents.length && pagedStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(pagedStudents.map((s) => s.id)));
    }
  };

  const handleToggleSelectStudent = (id: number) => {
    const updated = new Set(selectedStudentIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedStudentIds(updated);
  };

  // Keyboard navigation & fast mark
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (focusedRowIndex < 0 || focusedRowIndex >= pagedStudents.length) return;
      const currentStudent = pagedStudents[focusedRowIndex];
      if (!currentStudent) return;

      const key = e.key.toUpperCase();
      if (key === "P" || key === "A" || key === "L" || key === "E" || key === "M") {
        e.preventDefault();
        handleStatusChange(currentStudent.id, key as AttendanceStatus);
        // Move to next student automatically for super fast entry
        if (focusedRowIndex < pagedStudents.length - 1) {
          setFocusedRowIndex(focusedRowIndex + 1);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedRowIndex(Math.min(pagedStudents.length - 1, focusedRowIndex + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedRowIndex(Math.max(0, focusedRowIndex - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedRowIndex, pagedStudents, pendingChanges]);

  // Calculate live statistics for this context (combines pending + existing)
  const currentSummary = useMemo(() => {
    let pCount = 0;
    let aCount = 0;
    let lCount = 0;
    let eCount = 0;
    let mCount = 0;

    pagedStudents.forEach((s) => {
      const st = getStudentStatus(s.id);
      if (st === "P") pCount++;
      else if (st === "A") aCount++;
      else if (st === "L") lCount++;
      else if (st === "E") eCount++;
      else if (st === "M") mCount++;
    });

    const total = pagedStudents.length;
    const rate = total > 0 ? Number((((pCount + lCount) / total) * 100).toFixed(1)) : 100;

    return { pCount, aCount, lCount, eCount, mCount, total, rate };
  }, [pagedStudents, pendingChanges, existingRecord, fastMode]);

  // Save Attendance to Server (Supports Draft, Saved, and Finalized)
  const handleSaveAttendance = async (workflowStatus: AttendanceWorkflowStatus = "saved") => {
    setSaving(true);
    setFeedback(null);

    try {
      // Build full entries payload for all students in current class/section
      // Note: If paginated, build entries from all students available or paged students
      const entries: AttendanceEntry[] = pagedStudents.map((s) => {
        const st = getStudentStatus(s.id);
        const remark = getStudentRemark(s.id);
        const inTime = getStudentInTime(s.id);

        return {
          studentId: s.id,
          roll: s.roll,
          studentCode: s.studentId,
          name: s.name,
          nameBangla: s.nameBangla,
          status: st,
          remark: remark || undefined,
          inTime: inTime || undefined,
          photoUrl: s.photoUrl,
        };
      });

      const payload = {
        session: filter.session,
        classId: filter.classId,
        section: filter.section,
        tradeId: filter.tradeId,
        date: filter.date,
        periodNo: filter.periodNo,
        subjectCode: filter.subjectCode,
        subjectName: filter.subjectName,
        teacherName: filter.teacherName || currentUser?.fullName || "Teacher",
        teacherId: filter.teacherId,
        substituteTeacherName: filter.substituteTeacherName,
        roomNo: filter.roomNo,
        isLab: filter.isLab,
        attendanceType: filter.attendanceType,
        status: workflowStatus,
        isLocked: workflowStatus === "finalized",
        entries,
        changedBy: currentUser?.fullName || "Faculty Member",
        overrideLock: isAdminOrPrincipal,
      };

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setExistingRecord(data.record);
        setPendingChanges({});
        setFeedback({
          type: "success",
          message:
            workflowStatus === "finalized"
              ? "হাজিরা চূড়ান্ত ও লক করা হয়েছে। কুইজ ও পরীক্ষার জন্য এটি অনুমোদিত।"
              : workflowStatus === "draft"
              ? "খসড়া সফলভাবে সংরক্ষিত হয়েছে।"
              : "হাজিরা সফলভাবে ডাটাবেসে সংরক্ষিত হয়েছে।",
        });
        if (onRecordSaved) onRecordSaved(data.record);
      } else {
        setFeedback({ type: "error", message: data.error || "সংরক্ষণ করতে সমস্যা হয়েছে।" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "সার্ভার সংযোগে ত্রুটি।" });
    } finally {
      setSaving(false);
    }
  };

  // Lock / Unlock toggle
  const handleToggleLock = async () => {
    if (!existingRecord) {
      setFeedback({ type: "error", message: "লক করার পূর্বে হাজিরা সংরক্ষণ করুন।" });
      return;
    }

    if (!isAdminOrPrincipal) {
      setFeedback({ type: "error", message: "লক বা আনলক করার অনুমতি শুধু অধ্যক্ষ ও অ্যাডমিনের রয়েছে।" });
      return;
    }

    setLocking(true);
    try {
      const willLock = !existingRecord.isLocked;
      const res = await fetch("/api/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: existingRecord.id,
          isLocked: willLock,
          userRole: currentUser?.role || "admin",
          changedBy: currentUser?.name || "Principal",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setExistingRecord(data.record);
        setFeedback({
          type: "success",
          message: willLock ? "হাজিরা রেকর্ড সফলভাবে লক করা হয়েছে।" : "হাজিরা রেকর্ড সফলভাবে আনলক করা হয়েছে।",
        });
      } else {
        setFeedback({ type: "error", message: data.error });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLocking(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      {/* Sticky Top Status & Action Bar */}
      <div className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-3">
        {/* Metric Badges & Lock State */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>মোট শিক্ষার্থী: {totalStudents}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>উপস্থিত (P): {currentSummary.pCount}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100/80 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-bold border border-rose-300 dark:border-rose-800">
              <XCircle className="w-3.5 h-3.5" />
              <span>অনুপস্থিত (A): {currentSummary.aCount}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800">
              <Clock className="w-3.5 h-3.5" />
              <span>বিলম্ব (L): {currentSummary.lCount}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100/80 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold border border-blue-300 dark:border-blue-800">
              <FileCheck className="w-3.5 h-3.5" />
              <span>ছুটি (E/M): {currentSummary.eCount + currentSummary.mCount}</span>
            </div>

            <div className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-sm">
              উপস্থিতির হার: {currentSummary.rate}%
            </div>
          </div>

          {/* Workflow Status Badge & Actions */}
          <div className="flex items-center gap-2">
            {existingRecord?.isLocked ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-sm">
                <Lock className="w-3.5 h-3.5" />
                <span>চূড়ান্ত ও লককৃত (Finalized)</span>
              </div>
            ) : existingRecord ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-sm">
                <Check className="w-3.5 h-3.5" />
                <span>সংরক্ষিত (Saved)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-bold shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>নতুন / অসংরক্ষিত (Unsaved)</span>
              </div>
            )}

            {isAdminOrPrincipal && existingRecord && (
              <button
                onClick={handleToggleLock}
                disabled={locking}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                title={existingRecord.isLocked ? "হাজিরা আনলক করুন" : "হাজিরা লক করুন"}
              >
                {existingRecord.isLocked ? <Unlock className="w-3.5 h-3.5 text-amber-600" /> : <Lock className="w-3.5 h-3.5 text-rose-600" />}
                <span>{existingRecord.isLocked ? "আনলক" : "লক করুন"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Toolbar: Search, Page Size, Bulk Actions, Keyboard Mode */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Server-Side Search & Page Size */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="নাম, রোল, শিক্ষার্থী আইডি বা মোবাইল দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
              title="প্রতি পৃষ্ঠায় শিক্ষার্থী সংখ্যা"
            >
              <option value={25}>২৫ জন</option>
              <option value={50}>৫০ জন</option>
              <option value={100}>১০০ জন</option>
            </select>
          </div>

          {/* Bulk Actions & Keyboard Hint */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleBulkSetStatus("P", "all")}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              সকলকে P
            </button>
            <button
              onClick={() => handleBulkSetStatus("A", "all")}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors"
            >
              সকলকে A
            </button>

            {selectedStudentIds.size > 0 && (
              <>
                <button
                  onClick={() => handleBulkSetStatus("P", "selected")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  নির্বাচিত ({selectedStudentIds.size}) P
                </button>
                <button
                  onClick={() => handleBulkSetStatus("A", "selected")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-colors"
                >
                  নির্বাচিত ({selectedStudentIds.size}) A
                </button>
              </>
            )}

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

            <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              <Laptop className="w-3.5 h-3.5 text-indigo-500" />
              <span>শর্টকাট: P (উপস্থিত), A (অনুপস্থিত), L (দেরি), ↑ ↓ (নেভিগেশন)</span>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
                : feedback.type === "error"
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
                : "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
            }`}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Digital Register Table */}
      <div className="overflow-x-auto flex-1 min-h-[380px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">শিক্ষার্থীদের রেজিস্টার লোড হচ্ছে...</p>
          </div>
        ) : pagedStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400">ফিল্টার অথবা সার্চ কিওয়ার্ড পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.size === pagedStudents.length && pagedStudents.length > 0}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="py-2.5 px-2 w-16 text-center">রোল</th>
                <th className="py-2.5 px-3">শিক্ষার্থী পরিচিতি</th>
                <th className="py-2.5 px-3 text-center">হাজিরা স্থিতি (1-Tap Mark)</th>
                <th className="py-2.5 px-2 w-28 text-center hidden md:table-cell">প্রবেশ সময়</th>
                <th className="py-2.5 px-3 hidden sm:table-cell">মন্তব্য / ছুটি কারণ</th>
                <th className="py-2.5 px-2 w-14 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
              {pagedStudents.map((student, idx) => {
                const status = getStudentStatus(student.id);
                const remark = getStudentRemark(student.id);
                const inTime = getStudentInTime(student.id);
                const isSelected = selectedStudentIds.has(student.id);
                const isFocused = focusedRowIndex === idx;

                return (
                  <tr
                    key={student.id}
                    onClick={() => setFocusedRowIndex(idx)}
                    className={`transition-colors ${
                      isFocused
                        ? "bg-indigo-50/70 dark:bg-indigo-950/30 ring-1 ring-inset ring-indigo-400"
                        : isSelected
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20"
                        : idx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/50 dark:bg-slate-800/30"
                    }`}
                  >
                    {/* Row Select Checkbox */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectStudent(student.id)}
                        className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>

                    {/* Roll Number */}
                    <td className="py-2.5 px-2 text-center font-bold text-slate-900 dark:text-white">
                      {String(student.roll).padStart(2, "0")}
                    </td>

                    {/* Student Info */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-700">
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                              {student.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{student.nameBangla || student.name}</span>
                            {student.nameBangla && (
                              <span className="text-[10px] text-slate-400 font-normal hidden lg:inline">
                                ({student.name})
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span className="font-mono">{student.studentId}</span>
                            {student.tradeName && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                                  {student.tradeName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Quick 1-Tap Status Toggles (P, A, L, E, M) */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1">
                        {(["P", "A", "L", "E", "M"] as AttendanceStatus[]).map((stCode) => {
                          const meta = ATTENDANCE_STATUS_META[stCode];
                          const isActive = status === stCode;

                          return (
                            <button
                              key={stCode}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(student.id, stCode);
                              }}
                              title={`${meta.labelBangla} (${stCode}) - শর্টকাট`}
                              aria-label={`Mark ${student.name} as ${meta.label}`}
                              className={`w-8 h-8 sm:w-9 sm:h-8 rounded-lg font-bold text-xs transition-all flex items-center justify-center ${
                                isActive
                                  ? meta.activeBtnClass
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              {stCode}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* In-Time input (Optional) */}
                    <td className="py-2.5 px-2 text-center hidden md:table-cell">
                      <input
                        type="time"
                        value={inTime}
                        onChange={(e) => handleInTimeChange(student.id, e.target.value)}
                        className="px-1.5 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-24 text-center"
                      />
                    </td>

                    {/* Remarks Input */}
                    <td className="py-2.5 px-3 hidden sm:table-cell relative">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="মন্তব্য লিখুন..."
                          value={remark}
                          onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                          className="w-full px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          onClick={() =>
                            setActiveRemarkStudentId(
                              activeRemarkStudentId === student.id ? null : student.id
                            )
                          }
                          title="প্রিসেট মন্তব্য নির্বাচন করুন"
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Preset Remarks Dropdown */}
                      {activeRemarkStudentId === student.id && (
                        <div className="absolute right-3 top-10 z-30 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-1.5 space-y-1">
                          <p className="text-[10px] font-semibold text-slate-400 px-2 py-0.5">
                            দ্রুত মন্তব্য নির্বাচন:
                          </p>
                          {PRESET_REMARKS.map((pre) => (
                            <button
                              key={pre}
                              onClick={() => {
                                handleRemarkChange(student.id, pre);
                                setActiveRemarkStudentId(null);
                              }}
                              className="w-full text-left px-2 py-1 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                            >
                              {pre}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Actions / Controlled Correction */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() =>
                          setCorrectionTarget({
                            isOpen: true,
                            student,
                            currentStatus: status,
                            currentRemark: remark,
                          })
                        }
                        title="সংশোধন অডিট লগ"
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Sticky Bottom Actions & Pagination Bar */}
      <div className="sticky bottom-0 z-20 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Pagination Controls */}
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>
            পৃষ্ঠা <strong className="text-slate-900 dark:text-white">{page}</strong> / {totalPages} (মোট {totalStudents} শিক্ষার্থী)
          </span>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {Object.keys(pendingChanges).length > 0 && (
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              {Object.keys(pendingChanges).length} টি পরিবর্তন সংরক্ষিত নয়
            </span>
          )}
        </div>

        {/* Workflow Submission Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Draft Save */}
          <button
            onClick={() => handleSaveAttendance("draft")}
            disabled={saving}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>খসড়া সংরক্ষণ (Draft)</span>
          </button>

          {/* Standard Save */}
          <button
            onClick={() => handleSaveAttendance("saved")}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "সংরক্ষণ হচ্ছে..." : "হাজিরা সংরক্ষণ করুন"}</span>
          </button>

          {/* Finalize & Lock (Admin / Authorized Teacher) */}
          <button
            onClick={() => handleSaveAttendance("finalized")}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>চূড়ান্ত ও লক করুন (Finalize)</span>
          </button>
        </div>
      </div>

      {/* Controlled Attendance Correction Modal */}
      {correctionTarget.isOpen && correctionTarget.student && (
        <AttendanceCorrectionModal
          isOpen={correctionTarget.isOpen}
          onClose={() => setCorrectionTarget({ isOpen: false })}
          student={correctionTarget.student}
          date={filter.date}
          periodNo={filter.periodNo}
          currentStatus={correctionTarget.currentStatus || "P"}
          currentRemark={correctionTarget.currentRemark}
          recordId={existingRecord?.id}
          onSuccess={(updatedRecord) => {
            setExistingRecord(updatedRecord);
            fetchExistingRecord();
            setFeedback({
              type: "success",
              message: "অডিট ট্রেইল সহ হাজিরা সফলভাবে সংশোধন করা হয়েছে।",
            });
          }}
        />
      )}
    </div>
  );
}
