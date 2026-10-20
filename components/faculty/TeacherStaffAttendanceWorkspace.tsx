"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Calendar,
  Search,
  Filter,
  CheckCheck,
  RotateCcw,
  Lock,
  Unlock,
  MessageSquare,
  Sparkles,
  UserCheck,
  AlertTriangle,
  Award,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  HelpCircle,
  AlertCircle,
  Plus,
  Printer,
  Download,
  Upload,
  Eye,
  RefreshCw,
  BookOpen,
  ArrowRight,
  Check,
  X,
  FileText,
} from "lucide-react";
import {
  GlowCard,
  BorderGlowCard,
  GlowButton,
  AnimatedCounter,
  AnimatedProgress,
  PageTransition,
  AnimatedSection,
} from "@/components/ui/animation-effects";

export type AttendanceStatusKey =
  | "present"
  | "absent"
  | "late"
  | "on_leave"
  | "half_day"
  | "holiday"
  | "working_day"
  | "official_duty"
  | "early_leave"
  | "training";

interface EmployeeAttendanceItem {
  id: string;
  date: string;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  employeeNameBangla?: string;
  designation: string;
  department: string;
  type: "faculty" | "staff";
  photoUrl?: string;
  status: AttendanceStatusKey;
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
  updatedBy?: string;
  updatedAt?: string;
  auditHistory?: Array<{
    id: string;
    timestamp: string;
    changedBy: string;
    previousStatus?: string;
    newStatus: string;
    reason: string;
  }>;
}

interface TeacherWorkloadData {
  teacherId: number;
  name: string;
  nameBangla?: string;
  designation: string;
  department: string;
  tradeCode?: string;
  weeklyClassesCount: number;
  monthlyWorkloadEstimated: number;
  totalTeachingHours: number;
  theoryPeriods: number;
  practicalPeriods: number;
  assignedSubjects: Array<{
    code: string;
    name: string;
    class: string;
    section: string;
    isLab: boolean;
  }>;
  assignedSubjectsCount: number;
  dailyBreakdown: Record<string, { periods: number; practical: number; theory: number; routines: any[] }>;
  freePeriodsDaily: Record<string, number>;
  totalFreePeriodsWeekly: number;
  workloadPercentage: number;
  status: string;
  statusBangla: string;
}

interface LeaveRecord {
  id: string;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  employeeType: "faculty" | "staff";
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  substituteEmployeeId?: number;
  substituteEmployeeName?: string;
  status: "Draft" | "Submitted" | "Approved" | "Rejected" | "Cancelled";
  appliedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  remarks?: string;
}

interface SubstituteDuty {
  id: string;
  date: string;
  day: string;
  periodNo: number;
  classId: number;
  className: string;
  section: string;
  tradeCode?: string;
  subjectCode: string;
  subjectName: string;
  originalTeacherId: number;
  originalTeacherName: string;
  substituteTeacherId: number;
  substituteTeacherName: string;
  reason: string;
  authorizedBy: string;
  status: "assigned" | "completed" | "cancelled";
  createdAt: string;
}

const STATUS_CONFIG: Record<
  AttendanceStatusKey,
  { label: string; labelEn: string; color: string; badge: string; icon: any }
> = {
  present: {
    label: "উপস্থিত",
    labelEn: "Present",
    color: "emerald",
    badge: "bg-emerald-500 text-white shadow-emerald-500/20",
    icon: CheckCircle2,
  },
  absent: {
    label: "অনুপস্থিত",
    labelEn: "Absent",
    color: "rose",
    badge: "bg-rose-500 text-white shadow-rose-500/20",
    icon: XCircle,
  },
  late: {
    label: "বিলম্ব",
    labelEn: "Late",
    color: "amber",
    badge: "bg-amber-500 text-slate-950 font-bold shadow-amber-500/20",
    icon: Clock,
  },
  on_leave: {
    label: "ছুটিতে",
    labelEn: "Leave",
    color: "blue",
    badge: "bg-blue-600 text-white shadow-blue-500/20",
    icon: Calendar,
  },
  half_day: {
    label: "অর্ধদিবস",
    labelEn: "Half Day",
    color: "purple",
    badge: "bg-purple-600 text-white shadow-purple-500/20",
    icon: HelpCircle,
  },
  holiday: {
    label: "ছুটির দিন",
    labelEn: "Holiday",
    color: "indigo",
    badge: "bg-indigo-600 text-white shadow-indigo-500/20",
    icon: AlertCircle,
  },
  working_day: {
    label: "কার্যদিবস",
    labelEn: "Working Day",
    color: "teal",
    badge: "bg-teal-600 text-white shadow-teal-500/20",
    icon: Briefcase,
  },
  official_duty: {
    label: "অফিশিয়াল ডিউটি",
    labelEn: "Official Duty",
    color: "cyan",
    badge: "bg-cyan-600 text-white shadow-cyan-500/20",
    icon: Briefcase,
  },
  early_leave: {
    label: "আগাম প্রস্থান",
    labelEn: "Early Leave",
    color: "orange",
    badge: "bg-orange-500 text-white",
    icon: Clock,
  },
  training: {
    label: "প্রশিক্ষণ",
    labelEn: "Training",
    color: "violet",
    badge: "bg-violet-600 text-white",
    icon: Award,
  },
};

// Safe JSON Fetch Helper to prevent SyntaxError on 503 / HTML / server warmups
async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; data: T | null; error?: string }> {
  try {
    const res = await fetch(input, init);
    const text = await res.text();
    if (!text) {
      return { ok: res.ok, data: null };
    }
    try {
      const data = JSON.parse(text);
      return { ok: res.ok, data };
    } catch {
      return { ok: false, data: null, error: "Non-JSON response" };
    }
  } catch (err: any) {
    return { ok: false, data: null, error: err?.message || "Network request failed" };
  }
}

export default function TeacherStaffAttendanceWorkspace() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState<"attendance" | "workload" | "leave" | "substitute" | "reports">("attendance");
  const [employeeType, setEmployeeType] = useState<"all" | "faculty" | "staff">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Core Data Stores
  const [attendanceRecords, setAttendanceRecords] = useState<EmployeeAttendanceItem[]>([]);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockDetails, setLockDetails] = useState<any>(null);
  const [holidayInfo, setHolidayInfo] = useState<{ isHoliday: boolean; holidayName?: string }>({ isHoliday: false });
  const [facultyList, setFacultyList] = useState<any[]>([]);

  // Workload Data Store
  const [workloads, setWorkloads] = useState<any[]>([]);
  const [institutionalAvg, setInstitutionalAvg] = useState<number>(0);
  const [selectedTeacherWorkload, setSelectedTeacherWorkload] = useState<TeacherWorkloadData | null>(null);

  // Leave Data Store
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [newLeaveForm, setNewLeaveForm] = useState({
    employeeId: "",
    leaveType: "Casual Leave",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
    substituteEmployeeId: "",
  });

  // Substitute Data Store
  const [substituteDuties, setSubstituteDuties] = useState<SubstituteDuty[]>([]);
  const [showSubstituteModal, setShowSubstituteModal] = useState<boolean>(false);
  const [substituteWizard, setSubstituteWizard] = useState({
    date: selectedDate,
    absentTeacherId: "",
    affectedClasses: [] as any[],
    selectedRoutine: null as any,
    candidates: [] as any[],
    selectedSubstituteId: "",
    reason: "মূল শিক্ষক অনুপস্থিত / ছুটিতে থাকায় বিকল্প শিক্ষক বরাদ্দ",
  });

  // Audit Log & Profile Viewer Modals
  const [auditModalRecord, setAuditModalRecord] = useState<EmployeeAttendanceItem | null>(null);
  const [profileModalTeacher, setProfileModalTeacher] = useState<any | null>(null);
  const [showExcelImportModal, setShowExcelImportModal] = useState<boolean>(false);
  const [excelImportRows, setExcelImportRows] = useState<any[]>([]);
  const [excelImportText, setExcelImportText] = useState<string>("");

  // User State
  const [currentUserRole, setCurrentUserRole] = useState<string>("admin");

  useEffect(() => {
    const stored = localStorage.getItem("pgtsc_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.role?.toLowerCase().includes("principal") || u.role?.toLowerCase().includes("admin")) {
          setCurrentUserRole("admin");
        } else if (u.role?.toLowerCase().includes("teacher")) {
          setCurrentUserRole("teacher");
        }
      } catch (e) {}
    }
  }, []);

  // 1. Fetch Attendance for Selected Date
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { ok, data } = await safeFetchJson<any>(`/api/faculty/attendance?date=${selectedDate}`);
      if (ok && data?.success) {
        setAttendanceRecords(data.records || []);
        setIsLocked(!!data.isLocked);
        setLockDetails(data.lockInfo || null);
        setHolidayInfo(data.holidayInfo || { isHoliday: false });
      }
    } catch (err: any) {
      // Handled cleanly
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Faculty List & Workload
  const fetchWorkloads = async () => {
    try {
      const { ok, data } = await safeFetchJson<any>("/api/faculty/workload");
      if (ok && data?.success) {
        setWorkloads(data.teachers || []);
        setInstitutionalAvg(data.institutionalAverage || 0);
      }
    } catch (err) {
      // Handled cleanly
    }
  };

  // 3. Fetch Leaves
  const fetchLeaves = async () => {
    try {
      const { ok, data } = await safeFetchJson<any>("/api/faculty/leave");
      if (ok && data?.success) {
        setLeaves(data.leaves || []);
      }
    } catch (err) {
      // Handled cleanly
    }
  };

  // 4. Fetch Substitute Duties
  const fetchSubstituteDuties = async () => {
    try {
      const { ok, data } = await safeFetchJson<any>(`/api/faculty/substitute?date=${selectedDate}`);
      if (ok && data?.success) {
        setSubstituteDuties(data.duties || []);
      }
    } catch (err) {
      // Handled cleanly
    }
  };

  // Initial Load & On Date Change
  useEffect(() => {
    fetchAttendance();
    fetchSubstituteDuties();
  }, [selectedDate]);

  useEffect(() => {
    fetchWorkloads();
    fetchLeaves();
    // Also fetch faculty master list
    safeFetchJson<any>("/api/faculty")
      .then(({ ok, data }) => {
        if (ok && data?.success) setFacultyList(data.items || []);
      })
      .catch(() => {});
  }, []);

  // Show Flash Message
  const showFlash = (text: string, type: "success" | "error" = "success") => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Summary Metrics Computed from Live Attendance Records
  const metrics = useMemo(() => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter((r) => r.status === "present").length;
    const absent = attendanceRecords.filter((r) => r.status === "absent").length;
    const late = attendanceRecords.filter((r) => r.status === "late").length;
    const onLeave = attendanceRecords.filter((r) => r.status === "on_leave").length;
    const halfDay = attendanceRecords.filter((r) => r.status === "half_day").length;
    const holiday = attendanceRecords.filter((r) => r.status === "holiday").length;
    const officialDuty = attendanceRecords.filter((r) => r.status === "official_duty").length;

    const effectivePresent = present + late + halfDay * 0.5 + officialDuty;
    const percentage = total > 0 ? ((effectivePresent / total) * 100).toFixed(1) : "0";

    return { total, present, absent, late, onLeave, halfDay, holiday, officialDuty, percentage };
  }, [attendanceRecords]);

  // Filtered Attendance List
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((r) => {
      if (employeeType !== "all" && r.type !== employeeType) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.employeeName.toLowerCase().includes(q) ||
          (r.employeeNameBangla && r.employeeNameBangla.includes(q)) ||
          r.employeeCode.toLowerCase().includes(q) ||
          r.designation.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [attendanceRecords, employeeType, statusFilter, searchQuery]);

  // Handle Quick Status Change
  const handleStatusChange = async (employeeId: number, newStatus: AttendanceStatusKey) => {
    if (isLocked) {
      showFlash("হাজিরা লক করা আছে। পরিবর্তন করতে প্রথমে আনলক করুন।", "error");
      return;
    }

    const defaultTime = newStatus === "present" || newStatus === "late" ? "08:50 AM" : undefined;

    // Optimistic UI update
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.employeeId === employeeId ? { ...r, status: newStatus, checkInTime: defaultTime || r.checkInTime } : r))
    );

    try {
      const { ok, data, error } = await safeFetchJson<any>("/api/faculty/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          employeeId,
          status: newStatus,
          checkInTime: defaultTime,
          changedBy: "অনলাইন শিক্ষক হাজিরা পোর্টাল",
        }),
      });
      if (!ok || !data?.success) {
        showFlash(data?.error || error || "হাজিরা সংরক্ষণ ব্যর্থ হয়েছে।", "error");
        fetchAttendance(); // Revert
      } else {
        showFlash(`হাজিরা সফলভাবে সংরক্ষিত হয়েছে।`);
      }
    } catch (e: any) {
      showFlash("সার্ভারের সাথে সংযোগে সমস্যা হয়েছে।", "error");
      fetchAttendance();
    }
  };

  // Bulk Status Setter
  const handleBulkStatusSet = async (status: AttendanceStatusKey) => {
    if (isLocked) {
      showFlash("হাজিরা লক করা আছে। পরিবর্তন করা সম্ভব নয়।", "error");
      return;
    }

    const updated = attendanceRecords.map((r) => {
      if (employeeType !== "all" && r.type !== employeeType) return r;
      return { ...r, status };
    });

    setAttendanceRecords(updated);

    try {
      const { ok, data, error } = await safeFetchJson<any>("/api/faculty/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_save",
          date: selectedDate,
          records: updated,
          changedBy: "অ্যাডমিন (বাল্ক সংরক্ষণ)",
        }),
      });
      if (ok && data?.success) {
        showFlash(`সকলের জন্য '${STATUS_CONFIG[status].label}' স্থিতি সফলভাবে সংরক্ষণ করা হয়েছে।`);
      } else {
        showFlash(data?.error || error || "বাল্ক সংরক্ষণ ব্যর্থ হয়েছে।", "error");
        fetchAttendance();
      }
    } catch (err) {
      showFlash("সংযোগ ত্রুটি", "error");
      fetchAttendance();
    }
  };

  // Toggle Lock
  const handleToggleLock = async () => {
    const action = !isLocked;
    const confirmMsg = action
      ? "আপনি কি নিশ্চিত যে এই তারিখের শিক্ষক/স্টাফ হাজিরা লক করতে চান? লক করার পর অনুমতি ছাড়া কেউ পরিবর্তন করতে পারবে না।"
      : "আপনি কি হাজিরা আনলক করতে চান?";

    if (!confirm(confirmMsg)) return;

    try {
      const { ok, data, error } = await safeFetchJson<any>("/api/faculty/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_lock",
          date: selectedDate,
          isLocked: action,
          reason: action ? "অধ্যক্ষ কর্তৃক চূড়ান্ত যাচাই ও লক সম্পন্ন" : "প্রশাসনিক সংশোধনের জন্য আনলক",
          changedBy: "অধ্যক্ষ",
          userRole: currentUserRole,
        }),
      });
      if (ok && data?.success) {
        setIsLocked(action);
        showFlash(data.message);
      } else {
        showFlash(data?.error || error || "লক স্ট্যাটাস পরিবর্তন ব্যর্থ", "error");
      }
    } catch (err) {
      showFlash("লক স্ট্যাটাস পরিবর্তন ব্যর্থ", "error");
    }
  };

  // View Teacher Detail Workload
  const handleInspectTeacherWorkload = async (teacherId: number) => {
    try {
      const { ok, data } = await safeFetchJson<any>(`/api/faculty/workload?teacherId=${teacherId}`);
      if (ok && data?.success) {
        setSelectedTeacherWorkload(data.workload);
      }
    } catch (err) {
      showFlash("ওয়ার্কলোড বিবরণ লোড করা যায়নি", "error");
    }
  };

  // Submit Leave Request
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveForm.employeeId || !newLeaveForm.reason) {
      showFlash("শিক্ষক নির্বাচন ও ছুটির কারণ প্রদান বাধ্যতামূলক।", "error");
      return;
    }

    try {
      const { ok, data, error } = await safeFetchJson<any>("/api/faculty/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newLeaveForm,
          userRole: currentUserRole,
        }),
      });
      if (ok && data?.success) {
        showFlash(data.message);
        setShowLeaveModal(false);
        fetchLeaves();
        fetchAttendance(); // refresh attendance if auto-approved
      } else {
        showFlash(data?.error || error || "ছুটির আবেদন ব্যর্থ হয়েছে", "error");
      }
    } catch (err) {
      showFlash("ছুটির আবেদন প্রেরণ ব্যর্থ হয়েছে", "error");
    }
  };

  // Approve / Reject Leave
  const handleUpdateLeaveStatus = async (id: string, newStatus: "Approved" | "Rejected") => {
    const remarks = prompt(
      newStatus === "Approved"
        ? "ছুটি অনুমোদনের কোনো মন্তব্য থাকলে লিখুন (ঐচ্ছিক):"
        : "ছুটি প্রত্যাখ্যানের সুনির্দিষ্ট কারণ লিখুন:"
    );

    if (newStatus === "Rejected" && !remarks) {
      showFlash("প্রত্যাখ্যানের কারণ উল্লেখ করা আবশ্যক।", "error");
      return;
    }

    try {
      const { ok, data, error } = await safeFetchJson<any>("/api/faculty/leave", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: newStatus,
          remarks: remarks || undefined,
          rejectionReason: newStatus === "Rejected" ? remarks : undefined,
          approvedBy: "অধ্যক্ষ (ভারপ্রাপ্ত)",
          userRole: currentUserRole,
        }),
      });
      if (ok && data?.success) {
        showFlash(data.message);
        fetchLeaves();
        fetchAttendance();
      } else {
        showFlash(data?.error || error || "স্ট্যাটাস আপডেট ব্যর্থ", "error");
      }
    } catch (err) {
      showFlash("স্ট্যাটাস আপডেট ব্যর্থ", "error");
    }
  };

  // Open Substitute Wizard for Absent Teacher
  const handleOpenSubstituteWizard = async (teacherId?: number) => {
    const tId = teacherId || attendanceRecords.find((r) => r.status === "absent" || r.status === "on_leave")?.employeeId;
    if (!tId) {
      showFlash("কোনো অনুপস্থিত শিক্ষক পাওয়া যায়নি।", "error");
      return;
    }

    try {
      const { ok, data } = await safeFetchJson<any>(
        `/api/faculty/substitute?action=affected_classes&date=${selectedDate}&teacherId=${tId}`
      );
      if (ok && data?.success) {
        setSubstituteWizard({
          date: selectedDate,
          absentTeacherId: String(tId),
          affectedClasses: data.affectedClasses || [],
          selectedRoutine: data.affectedClasses?.[0] || null,
          candidates: [],
          selectedSubstituteId: "",
          reason: "নৈমিত্তিক/অফিশিয়াল ছুটির কারণে বিকল্প শিক্ষক বরাদ্দ",
        });

        if (data.affectedClasses?.[0]) {
          handleFetchCandidates(data.affectedClasses[0], tId);
        }

        setShowSubstituteModal(true);
      }
    } catch (err) {
      showFlash("ক্লাস তথ্য লোড ব্যর্থ", "error");
    }
  };

  // Fetch Free Substitute Candidates for a Slot
  const handleFetchCandidates = async (routine: any, originalTeacherId: number) => {
    try {
      const { ok, data } = await safeFetchJson<any>(
        `/api/faculty/substitute?action=find_candidates&date=${selectedDate}&routineId=${routine.id}&periodNo=${routine.periodNo}&classId=${routine.classId}&tradeCode=${routine.tradeCode || ""}&originalTeacherId=${originalTeacherId}`
      );
      if (ok && data?.success) {
        setSubstituteWizard((prev) => ({
          ...prev,
          selectedRoutine: routine,
          candidates: data.candidates || [],
          selectedSubstituteId: data.candidates?.[0]?.teacherId ? String(data.candidates[0].teacherId) : "",
        }));
      }
    } catch (err) {
      // Cleanly handled
    }
  };

  // Commit Substitute Assignment
  const handleAssignSubstituteCommit = async () => {
    if (!substituteWizard.selectedRoutine || !substituteWizard.selectedSubstituteId) {
      showFlash("বিকল্প শিক্ষক নির্বাচন আবশ্যক।", "error");
      return;
    }

    try {
      const routine = substituteWizard.selectedRoutine;
      const { ok, data, error } = await safeFetchJson<any>("/api/faculty/substitute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          periodNo: routine.periodNo,
          classId: routine.classId,
          className: routine.className,
          section: routine.section,
          tradeCode: routine.tradeCode,
          subjectCode: routine.subjectCode,
          subjectName: routine.subjectName,
          originalTeacherId: Number(substituteWizard.absentTeacherId),
          substituteTeacherId: Number(substituteWizard.selectedSubstituteId),
          reason: substituteWizard.reason,
          authorizedBy: "অধ্যক্ষ (ভারপ্রাপ্ত)",
          userRole: currentUserRole,
        }),
      });

      if (ok && data?.success) {
        showFlash(data.message);
        setShowSubstituteModal(false);
        fetchSubstituteDuties();
      } else {
        showFlash(data?.error || error || "বিকল্প শিক্ষক বরাদ্দ ব্যর্থ", "error");
      }
    } catch (err) {
      showFlash("বিকল্প শিক্ষক বরাদ্দ ব্যর্থ", "error");
    }
  };

  // Smart Excel Export Handler
  const handleExportAttendanceExcel = () => {
    const csvRows = [
      ["Employee Code", "Employee Name", "Designation", "Department", "Type", "Status", "Check-In", "Check-Out", "Remarks"].join(","),
      ...attendanceRecords.map((r) =>
        [
          `"${r.employeeCode}"`,
          `"${r.employeeName}"`,
          `"${r.designation}"`,
          `"${r.department}"`,
          `"${r.type}"`,
          `"${r.status}"`,
          `"${r.checkInTime || ""}"`,
          `"${r.checkOutTime || ""}"`,
          `"${r.remarks || ""}"`,
        ].join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `PTSC_Faculty_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFlash("হাজিরা শিট এক্সেল/সিএসভি ফরম্যাটে ডাউনলোড করা হয়েছে।");
  };

  // Smart Excel Import Parse & Commit
  const handleParseExcelText = () => {
    if (!excelImportText.trim()) {
      showFlash("এক্সেল ডাটা পেস্ট করুন।", "error");
      return;
    }

    const lines = excelImportText.trim().split("\n");
    const parsedRows: any[] = [];

    lines.forEach((line) => {
      const cols = line.split("\t").length > 1 ? line.split("\t") : line.split(",");
      if (cols.length >= 2) {
        parsedRows.push({
          employeeCode: cols[0]?.trim(),
          name: cols[1]?.trim(),
          status: cols[2]?.trim().toLowerCase() || "present",
          checkIn: cols[3]?.trim() || "08:50 AM",
          remarks: cols[4]?.trim() || "Excel Imported",
        });
      }
    });

    setExcelImportRows(parsedRows);
  };

  const handleCommitExcelImport = async () => {
    if (excelImportRows.length === 0) {
      showFlash("কোনো ডাটা পাওয়া যায়নি।", "error");
      return;
    }

    try {
      const { ok, data, error } = await safeFetchJson<any>("/api/faculty/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import_excel",
          date: selectedDate,
          rows: excelImportRows,
          changedBy: "স্মার্ট এক্সেল উইজার্ড",
        }),
      });

      if (ok && data?.success) {
        showFlash(data.message);
        setShowExcelImportModal(false);
        setExcelImportRows([]);
        setExcelImportText("");
        fetchAttendance();
      } else {
        showFlash(data?.error || error || "এক্সেল ইমপোর্ট ব্যর্থ", "error");
      }
    } catch (err) {
      showFlash("এক্সেল ইমপোর্ট ব্যর্থ", "error");
    }
  };

  return (
    <PageTransition className="space-y-4 sm:space-y-6 pb-20">
      {/* Toast Notification Alert */}
      {actionMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold transition-all border ${
            actionMessage.type === "success"
              ? "bg-slate-900 text-emerald-400 border-emerald-500/40"
              : "bg-rose-950 text-rose-300 border-rose-500/40"
          }`}
        >
          {actionMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Top Banner with Quick Actions & Lock Status */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 rounded-3xl border border-indigo-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Phase 17 • শিক্ষক ও স্টাফ ডিজিটাল হাজিরা ও কর্মভার (Workload Engine)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-indigo-400 shrink-0" />
            <span>শিক্ষক ও কর্মচারী হাজিরা ও ওয়ার্কলোড পোর্টাল</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            ১-ট্যাপ মোবাইল কুইক হাজিরা, রুটিনভিত্তিক স্বয়ংক্রিয় টিচার ওয়ার্কলোড, বিকল্প শিক্ষক (Substitute) অটোমেশন এবং সমন্বিত ছুটি ব্যবস্থাপনা।
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportAttendanceExcel}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>এক্সেল রপ্তানি</span>
          </button>

          <button
            onClick={() => setShowExcelImportModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>এক্সেল আমদানি</span>
          </button>

          {isLocked ? (
            <button
              onClick={handleToggleLock}
              className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-500/30 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>হাজিরা লক আছে (আনলক করুন)</span>
            </button>
          ) : (
            <GlowButton
              variant="primary"
              onClick={handleToggleLock}
              icon={Lock}
              className="justify-center"
            >
              আজকের হাজিরা লক করুন
            </GlowButton>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        {[
          { id: "attendance", label: "১. ডিজিটাল হাজিরা মাস্টার খাতা", icon: UserCheck, count: metrics.total },
          { id: "workload", label: "২. শিক্ষক ওয়ার্কলোড ও রুটিন লোড", icon: Briefcase, count: workloads.length },
          { id: "leave", label: "৩. ছুটি ব্যবস্থাপনা ও আবেদন", icon: Calendar, count: leaves.filter((l) => l.status === "Submitted").length },
          { id: "substitute", label: "৪. বিকল্প শিক্ষক বরাদ্দ (Substitute)", icon: Users, count: substituteDuties.length },
          { id: "reports", label: "৫. রিপোর্ট ও প্রিন্ট ভিউ", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary KPI Cards with Real Counter & Border Glow */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
        <BorderGlowCard glowColor="indigo" glowType="subtle" className="p-3 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">মোট জনবল</div>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
            <AnimatedCounter value={metrics.total} suffix=" জন" />
          </div>
        </BorderGlowCard>

        <BorderGlowCard glowColor="emerald" glowType="subtle" className="p-3 text-center">
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">উপস্থিত</div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 mt-1">
            <AnimatedCounter value={metrics.present} suffix=" জন" />
          </div>
        </BorderGlowCard>

        <BorderGlowCard glowColor="rose" glowType="subtle" className="p-3 text-center">
          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">অনুপস্থিত</div>
          <div className="text-lg sm:text-xl font-black text-rose-600 mt-1">
            <AnimatedCounter value={metrics.absent} suffix=" জন" />
          </div>
        </BorderGlowCard>

        <BorderGlowCard glowColor="amber" glowType="subtle" className="p-3 text-center">
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">বিলম্ব (Late)</div>
          <div className="text-lg sm:text-xl font-black text-amber-600 mt-1">
            <AnimatedCounter value={metrics.late} suffix=" জন" />
          </div>
        </BorderGlowCard>

        <BorderGlowCard glowColor="blue" glowType="subtle" className="p-3 text-center">
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">ছুটি (Leave)</div>
          <div className="text-lg sm:text-xl font-black text-blue-600 mt-1">
            <AnimatedCounter value={metrics.onLeave} suffix=" জন" />
          </div>
        </BorderGlowCard>

        <BorderGlowCard glowColor="purple" glowType="subtle" className="p-3 text-center">
          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">অর্ধদিবস</div>
          <div className="text-lg sm:text-xl font-black text-purple-600 mt-1">
            <AnimatedCounter value={metrics.halfDay} suffix=" জন" />
          </div>
        </BorderGlowCard>

        <BorderGlowCard glowColor="indigo" glowType="subtle" className="p-3 text-center">
          <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">ডিউটি/প্রশিক্ষণ</div>
          <div className="text-lg sm:text-xl font-black text-indigo-500 mt-1">
            <AnimatedCounter value={metrics.officialDuty} suffix=" জন" />
          </div>
        </BorderGlowCard>

        <BorderGlowCard glowColor="cyan" glowType="conic-spin" className="p-3 text-center">
          <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">উপস্থিতির হার</div>
          <div className="text-lg sm:text-xl font-black text-cyan-600 mt-1">
            <AnimatedCounter value={Number(metrics.percentage)} suffix="%" decimals={1} />
          </div>
        </BorderGlowCard>
      </div>

      {/* Holiday Alert Banner if Target Date is a Holiday */}
      {holidayInfo.isHoliday && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <span className="font-black">ছুটির দিন বিজ্ঞাপ্তি:</span> নির্বাচিত তারিখটি{" "}
            <span className="font-bold underline">{holidayInfo.holidayName}</span> হিসেবে তালিকাভুক্ত।
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: ATTENDANCE MASTER SHEET (হাজিরা খাতা)
         ========================================================================= */}
      {activeTab === "attendance" && (
        <AnimatedSection className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Date Selector with Presets */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>তারিখ নির্বাচন:</span>
                  </span>
                  <button
                    onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 underline cursor-pointer"
                  >
                    আজকে
                  </button>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                />
              </div>

              {/* Employee Type Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-purple-500" />
                  <span>কর্মচারী ধরন:</span>
                </label>
                <select
                  value={employeeType}
                  onChange={(e) => setEmployeeType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                >
                  <option value="all">সকল শিক্ষক ও স্টাফ ({attendanceRecords.length})</option>
                  <option value="faculty">শুধুমাত্র শিক্ষকবৃন্দ ({attendanceRecords.filter((r) => r.type === "faculty").length})</option>
                  <option value="staff">শুধুমাত্র স্টাফ/কর্মচারী ({attendanceRecords.filter((r) => r.type === "staff").length})</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-emerald-500" />
                  <span>হাজিরা স্থিতি:</span>
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                >
                  <option value="all">সকল স্থিতি</option>
                  <option value="present">উপস্থিত (Present)</option>
                  <option value="absent">অনুপস্থিত (Absent)</option>
                  <option value="late">বিলম্ব (Late)</option>
                  <option value="on_leave">ছুটিতে (On Leave)</option>
                  <option value="half_day">অর্ধদিবস (Half Day)</option>
                  <option value="holiday">ছুটির দিন (Holiday)</option>
                  <option value="official_duty">অফিশিয়াল ডিউটি (Official Duty)</option>
                </select>
              </div>

              {/* Search Box */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-amber-500" />
                  <span>অনুসন্ধান:</span>
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="নাম, কোড বা পদবি..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none"
                />
              </div>
            </div>

            {/* Quick Bulk Actions Bar */}
            {!isLocked && (
              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                <div className="text-[11px] font-bold text-slate-400">
                  ১-ক্লিকে বাল্ক হাজিরা একশন ({employeeType === "all" ? "সকলের জন্য" : employeeType === "faculty" ? "শিক্ষকদের জন্য" : "স্টাফদের জন্য"}):
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleBulkStatusSet("present")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs hover:bg-emerald-100 cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>সবাই উপস্থিত</span>
                  </button>

                  <button
                    onClick={() => handleBulkStatusSet("absent")}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs hover:bg-rose-100 cursor-pointer flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>সবাই অনুপস্থিত</span>
                  </button>

                  <button
                    onClick={() => handleBulkStatusSet("holiday")}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs hover:bg-indigo-100 cursor-pointer flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>ছুটির দিন চিহ্নিত করুন</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Attendance Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredRecords.map((emp) => {
              const currentStatusMeta = STATUS_CONFIG[emp.status] || STATUS_CONFIG.present;
              const StatusIcon = currentStatusMeta.icon;

              return (
                <BorderGlowCard
                  key={emp.employeeId}
                  glowColor={currentStatusMeta.color as any}
                  glowType="subtle"
                  className="p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header with Photo & Details */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {emp.photoUrl ? (
                          <img
                            src={emp.photoUrl}
                            alt={emp.employeeName}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                            {emp.employeeName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              {emp.employeeCode}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              {emp.type === "faculty" ? "শিক্ষক" : "স্টাফ"}
                            </span>
                          </div>
                          <h3
                            onClick={() => setProfileModalTeacher(emp)}
                            className="font-black text-xs sm:text-sm text-slate-900 dark:text-white mt-1 cursor-pointer hover:text-indigo-600 transition-colors"
                          >
                            {emp.employeeNameBangla || emp.employeeName}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            {emp.designation} • {emp.department}
                          </p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shrink-0 ${currentStatusMeta.badge}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{currentStatusMeta.label}</span>
                      </span>
                    </div>

                    {/* 1-Tap Touch Buttons for Quick Attendance */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        ১-ট্যাপ দ্রুত হাজিরা স্থিতি:
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(["present", "absent", "late", "on_leave", "half_day", "holiday", "official_duty", "working_day"] as AttendanceStatusKey[]).map((st) => {
                          const conf = STATUS_CONFIG[st];
                          const isSelected = emp.status === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleStatusChange(emp.employeeId, st)}
                              className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer disabled:opacity-50 ${
                                isSelected
                                  ? `${conf.badge} ring-2 ring-indigo-400 scale-[1.02]`
                                  : "bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <span>{conf.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time & Remarks Details */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span>চেক-ইন: <strong className="text-slate-800 dark:text-slate-200">{emp.checkInTime || "নির্ধারিত নয়"}</strong></span>
                        <span>চেক-আউট: <strong className="text-slate-800 dark:text-slate-200">{emp.checkOutTime || "নির্ধারিত নয়"}</strong></span>
                      </div>
                      {emp.remarks && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                          মন্তব্য: {emp.remarks}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Action buttons: Audit History & Routine */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <button
                      onClick={() => setAuditModalRecord(emp)}
                      className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Clock className="w-3 h-3" />
                      <span>অডিট ইতিহাস ({emp.auditHistory?.length || 0})</span>
                    </button>

                    {emp.type === "faculty" && (
                      <button
                        onClick={() => handleInspectTeacherWorkload(emp.employeeId)}
                        className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Briefcase className="w-3 h-3" />
                        <span>ওয়ার্কলোড দেখুন →</span>
                      </button>
                    )}
                  </div>
                </BorderGlowCard>
              );
            })}
          </div>
        </AnimatedSection>
      )}

      {/* =========================================================================
          TAB 2: TEACHER WORKLOAD (রুটিনভিত্তিক কর্মভার ড্যাশবোর্ড)
         ========================================================================= */}
      {activeTab === "workload" && (
        <AnimatedSection className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  <span>রুটিনভিত্তিক স্বয়ংক্রিয় শিক্ষক ওয়ার্কলোড ক্যালকুলেটর</span>
                </h3>
                <p className="text-xs text-slate-400">
                  ক্লাস রুটিন থেকে রিয়েল-টাইমে দৈনিক ক্লাস, সাপ্তাহিক ও মাসিক পিরিয়ড সংখ্যা, থিওরি ও ল্যাব ঘণ্টা হিসাব করা হয়।
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <span>প্রতিষ্ঠানিক গড় সাপ্তাহিক লোড:</span>
                <span className="font-mono text-sm font-black">{institutionalAvg} পিরিয়ড</span>
              </div>
            </div>

            {/* Teacher Workload Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">শিক্ষক ও পদবি</th>
                    <th className="p-3">বিভাগ / ট্রেড</th>
                    <th className="p-3 text-center">সাপ্তাহিক পিরিয়ড</th>
                    <th className="p-3 text-center">মাসিক আনুমানিক</th>
                    <th className="p-3 text-center">থিওরি / ল্যাব</th>
                    <th className="p-3 text-center">পাঠদানের ঘণ্টা</th>
                    <th className="p-3 text-center">মুক্ত পিরিয়ড (Free)</th>
                    <th className="p-3 text-center">ওয়ার্কলোড স্থিতি</th>
                    <th className="p-3 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {workloads.map((t) => (
                    <tr key={t.teacherId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="font-black text-slate-900 dark:text-white">
                          {t.nameBangla || t.name}
                        </div>
                        <div className="text-[11px] text-slate-400">{t.designation}</div>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-600 dark:text-slate-300">{t.department}</span>
                        {t.tradeCode && <span className="ml-1 text-[10px] font-mono px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{t.tradeCode}</span>}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-indigo-600 text-sm">
                        {t.totalWeeklyPeriods} টি
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400">
                        {t.monthlyWorkloadEstimated} টি
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-slate-700 dark:text-slate-300 font-bold">{t.theoryPeriods}T</span> /{" "}
                        <span className="text-purple-600 dark:text-purple-400 font-bold">{t.practicalPeriods}P</span>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-700 dark:text-slate-300">
                        {t.totalTeachingHours} ঘণ্টা
                      </td>
                      <td className="p-3 text-center font-mono text-emerald-600 font-bold">
                        {t.freePeriodsCount} টি
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === "overloaded"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : t.status === "light"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {t.statusBangla}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleInspectTeacherWorkload(t.teacherId)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] hover:bg-indigo-100 cursor-pointer"
                        >
                          বিস্তারিত
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* =========================================================================
          TAB 3: LEAVE MANAGEMENT (ছুটি ও অনুমতি)
         ========================================================================= */}
      {activeTab === "leave" && (
        <AnimatedSection className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span>শিক্ষক ও কর্মচারী ছুটি ব্যবস্থাপনা (Leave Management)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  ছুটি অনুমোদিত হলে স্বয়ংক্রিয়ভাবে উক্ত তারিখগুলোতে শিক্ষকের হাজিরা "ছুটিতে" স্থিতি হিসেবে রেকর্ড হবে।
                </p>
              </div>

              <button
                onClick={() => setShowLeaveModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 hover:bg-indigo-700 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ছুটির আবেদন</span>
              </button>
            </div>

            {/* Leave Requests Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">আবেদনকারী</th>
                    <th className="p-3">ছুটির ধরন</th>
                    <th className="p-3">মেয়াদকাল</th>
                    <th className="p-3 text-center">দিন</th>
                    <th className="p-3">কারণ</th>
                    <th className="p-3">বিকল্প শিক্ষক</th>
                    <th className="p-3 text-center">অনুমোদনের স্থিতি</th>
                    <th className="p-3 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="font-black text-slate-900 dark:text-white">{l.employeeName}</div>
                        <div className="text-[11px] text-slate-400">{l.designation} • {l.employeeCode}</div>
                      </td>
                      <td className="p-3 font-bold text-slate-700 dark:text-slate-300">{l.leaveType}</td>
                      <td className="p-3 font-mono text-[11px]">
                        {l.startDate} থেকে {l.endDate}
                      </td>
                      <td className="p-3 text-center font-bold text-indigo-600">{l.totalDays} দিন</td>
                      <td className="p-3 max-w-xs truncate text-slate-600 dark:text-slate-400">{l.reason}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {l.substituteEmployeeName || "নির্ধারিত হয়নি"}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === "Approved"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : l.status === "Rejected"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {l.status === "Approved" ? "অনুমোদিত" : l.status === "Rejected" ? "প্রত্যাখ্যাত" : "অপেক্ষমাণ"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {l.status === "Submitted" && currentUserRole === "admin" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdateLeaveStatus(l.id, "Approved")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 cursor-pointer"
                            >
                              অনুমোদন
                            </button>
                            <button
                              onClick={() => handleUpdateLeaveStatus(l.id, "Rejected")}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700 cursor-pointer"
                            >
                              বাতিল
                            </button>
                          </div>
                        )}
                        {l.status === "Approved" && (
                          <span className="text-[10px] text-slate-400 font-bold">অনুমোদিত সম্পন্ন</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* =========================================================================
          TAB 4: SUBSTITUTE TEACHER (বিকল্প শিক্ষক ব্যবস্থাপনা)
         ========================================================================= */}
      {activeTab === "substitute" && (
        <AnimatedSection className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>বিকল্প শিক্ষক বরাদ্দ ও ট্র্যাকিং (Substitute Teacher Engine)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  কোনো শিক্ষক অনুপস্থিত বা ছুটিতে থাকলে তাঁর নির্ধারিত ক্লাসের জন্য ফ্রি শিক্ষক স্বয়ংক্রিয়ভাবে খুঁজে বরাদ্দ করুন।
                </p>
              </div>

              <button
                onClick={() => handleOpenSubstituteWizard()}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 hover:bg-indigo-700 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>বিকল্প শিক্ষক বরাদ্দ উইজার্ড</span>
              </button>
            </div>

            {/* Substitute Duties Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">তারিখ ও বার</th>
                    <th className="p-3 text-center">পিরিয়ড</th>
                    <th className="p-3">শ্রেণি ও বিষয়</th>
                    <th className="p-3">মূল শিক্ষক</th>
                    <th className="p-3">বিকল্প শিক্ষক</th>
                    <th className="p-3">কারণ</th>
                    <th className="p-3 text-center">স্থিতি</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {substituteDuties.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono text-[11px]">
                        {d.date} ({d.day})
                      </td>
                      <td className="p-3 text-center font-bold text-indigo-600">{d.periodNo} নং পিরিয়ড</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{d.className} ({d.section})</div>
                        <div className="text-[11px] text-slate-400">{d.subjectName} ({d.subjectCode})</div>
                      </td>
                      <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">{d.originalTeacherName}</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">
                        {d.substituteTeacherName}
                      </td>
                      <td className="p-3 max-w-xs truncate text-slate-500 dark:text-slate-400">{d.reason}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {d.status === "assigned" ? "বরাদ্দকৃত" : "সম্পন্ন"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {substituteDuties.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        আজকের জন্য কোনো বিকল্প শিক্ষক দায়িত্ব রেকর্ড নেই।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* =========================================================================
          TAB 5: REPORTS & PRINTING (রিপোর্ট ও প্রিন্ট)
         ========================================================================= */}
      {activeTab === "reports" && (
        <AnimatedSection className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  শিক্ষক ও কর্মকর্তা দৈনিক উপস্থিতি রেজিস্টার (Print Sheet)
                </h3>
                <p className="text-xs text-slate-400">তারিখ: {selectedDate}</p>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800 space-y-1">
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">শিক্ষক ও কর্মকর্তা হাজিরা রেজিস্টার শিট • তারিখ: {selectedDate}</p>
              </div>

              <div className="overflow-x-auto pt-3">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-slate-600 dark:text-slate-400 font-bold">
                      <th className="py-2">ক্রমিক</th>
                      <th className="py-2">নাম ও পদবি</th>
                      <th className="py-2">বিভাগ</th>
                      <th className="py-2 text-center">উপস্থিতি স্থিতি</th>
                      <th className="py-2 text-center">চেক-ইন সময়</th>
                      <th className="py-2 text-right">স্বাক্ষর</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {attendanceRecords.map((r, idx) => (
                      <tr key={r.employeeId}>
                        <td className="py-2 font-mono">{idx + 1}</td>
                        <td className="py-2 font-bold text-slate-900 dark:text-white">
                          {r.employeeNameBangla || r.employeeName} ({r.designation})
                        </td>
                        <td className="py-2 text-slate-500 dark:text-slate-400">{r.department}</td>
                        <td className="py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_CONFIG[r.status]?.badge}`}>
                            {STATUS_CONFIG[r.status]?.label}
                          </span>
                        </td>
                        <td className="py-2 text-center font-mono">{r.checkInTime || "—"}</td>
                        <td className="py-2 text-right">__________________</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* =========================================================================
          MODAL: APPLY FOR LEAVE
         ========================================================================= */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>নতুন ছুটির আবেদন পত্র</span>
              </h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300">শিক্ষক / কর্মচারী:</label>
                <select
                  value={newLeaveForm.employeeId}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold outline-none"
                  required
                >
                  <option value="">শিক্ষক বা কর্মকর্তা নির্বাচন করুন</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nameBangla || f.name} — {f.designation} ({f.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300">ছুটির ধরন:</label>
                <select
                  value={newLeaveForm.leaveType}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, leaveType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold outline-none"
                >
                  <option value="Casual Leave">নৈমিত্তিক ছুটি (Casual Leave)</option>
                  <option value="Sick Leave">চিকিৎসা ছুটি (Sick/Medical Leave)</option>
                  <option value="Earned Leave">অর্জিত ছুটি (Earned Leave)</option>
                  <option value="Official Duty">সরকারি দাপ্তরিক কাজ (Official Duty)</option>
                  <option value="Study Leave">অধ্যয়ন ছুটি (Study Leave)</option>
                  <option value="Maternity Leave">মাতৃত্বকালীন ছুটি (Maternity Leave)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300">শুরুর তারিখ:</label>
                  <input
                    type="date"
                    value={newLeaveForm.startDate}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300">শেষ তারিখ:</label>
                  <input
                    type="date"
                    value={newLeaveForm.endDate}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300">ছুটির কারণ:</label>
                <textarea
                  rows={2}
                  value={newLeaveForm.reason}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, reason: e.target.value })}
                  placeholder="ছুটির সুনির্দিষ্ট কারণ লিখুন..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300">বিকল্প দায়িত্বপ্রাপ্ত শিক্ষক (ঐচ্ছিক):</label>
                <select
                  value={newLeaveForm.substituteEmployeeId}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, substituteEmployeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs outline-none"
                >
                  <option value="">বিকল্প শিক্ষক নির্বাচন করুন (যদি থাকে)</option>
                  {facultyList
                    .filter((f) => f.id !== Number(newLeaveForm.employeeId) && f.type === "faculty")
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nameBangla || f.name} ({f.department})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/30"
                >
                  ছুটির আবেদন দাখিল করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SUBSTITUTE TEACHER ASSIGNMENT WIZARD
         ========================================================================= */}
      {showSubstituteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>বিকল্প শিক্ষক (Substitute Teacher) নিয়োগ উইজার্ড</span>
              </h3>
              <button
                onClick={() => setShowSubstituteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 dark:text-slate-300">অনুপস্থিত শিক্ষক নির্বাচন:</label>
                <select
                  value={substituteWizard.absentTeacherId}
                  onChange={(e) => handleOpenSubstituteWizard(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold outline-none"
                >
                  {facultyList
                    .filter((f) => f.type === "faculty")
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nameBangla || f.name} — {f.department}
                      </option>
                    ))}
                </select>
              </div>

              {/* Affected Class Routine Slots */}
              <div className="space-y-2">
                <label className="font-bold text-slate-600 dark:text-slate-300">
                  উক্ত শিক্ষকের আজকের নির্ধারিত ক্লাসসমূহ ({substituteWizard.affectedClasses.length}টি):
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {substituteWizard.affectedClasses.map((cl) => {
                    const isSelected = substituteWizard.selectedRoutine?.id === cl.id;
                    return (
                      <div
                        key={cl.id}
                        onClick={() =>
                          handleFetchCandidates(cl, Number(substituteWizard.absentTeacherId))
                        }
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {cl.periodNo} নং পিরিয়ড • {cl.className} ({cl.section})
                          </div>
                          <div className="text-[11px] text-slate-400">
                            বিষয়: {cl.subjectName} ({cl.subjectCode})
                          </div>
                        </div>
                        {cl.hasSubstitute && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            বরাদ্দকৃত
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {substituteWizard.affectedClasses.length === 0 && (
                    <div className="p-3 text-center text-slate-400 italic">
                      আজকের দিনে এই শিক্ষকের কোনো রুটিন ক্লাস নেই।
                    </div>
                  )}
                </div>
              </div>

              {/* Free Teacher Candidates Suggestion List */}
              {substituteWizard.selectedRoutine && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span>এই পিরিয়ডে মুক্ত ও উপযুক্ত বিকল্প শিক্ষকবৃন্দ:</span>
                    <span className="text-[10px] text-emerald-600 font-mono">
                      {substituteWizard.candidates.length} জন মুক্ত
                    </span>
                  </label>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {substituteWizard.candidates.map((cand) => {
                      const isChosen = substituteWizard.selectedSubstituteId === String(cand.teacherId);
                      return (
                        <div
                          key={cand.teacherId}
                          onClick={() =>
                            setSubstituteWizard((prev) => ({
                              ...prev,
                              selectedSubstituteId: String(cand.teacherId),
                            }))
                          }
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                            isChosen
                              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {cand.nameBangla || cand.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{cand.reasonBangla}</div>
                          </div>

                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                              উপযুক্ততা: {cand.suitabilityScore}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowSubstituteModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleAssignSubstituteCommit}
                  disabled={!substituteWizard.selectedSubstituteId}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  বিকল্প শিক্ষক নিশ্চিত করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TEACHER DETAILED WORKLOAD VIEWER
         ========================================================================= */}
      {selectedTeacherWorkload && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <span>{selectedTeacherWorkload.nameBangla || selectedTeacherWorkload.name} — সম্পূর্ণ কর্মভার বিশ্লেষণ</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedTeacherWorkload.designation} • {selectedTeacherWorkload.department}
                </p>
              </div>
              <button
                onClick={() => setSelectedTeacherWorkload(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Metric stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">সাপ্তাহিক ক্লাস</div>
                  <div className="text-base font-black text-indigo-600 mt-1">
                    {selectedTeacherWorkload.weeklyClassesCount} পিরিয়ড
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">মাসিক আনুমানিক</div>
                  <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-1">
                    {selectedTeacherWorkload.monthlyWorkloadEstimated} পিরিয়ড
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">থিওরি / ল্যাব</div>
                  <div className="text-base font-black text-purple-600 mt-1">
                    {selectedTeacherWorkload.theoryPeriods}T / {selectedTeacherWorkload.practicalPeriods}P
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">সাপ্তাহিক পাঠদান</div>
                  <div className="text-base font-black text-emerald-600 mt-1">
                    {selectedTeacherWorkload.totalTeachingHours} ঘণ্টা
                  </div>
                </div>
              </div>

              {/* Day-by-Day Schedule Distribution */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 dark:text-white">দৈনিক ক্লাস বণ্টন (রবিবার থেকে বৃহস্পতিবার):</h4>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(selectedTeacherWorkload.dailyBreakdown).map(([day, val]) => (
                    <div key={day} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
                      <div className="font-bold text-slate-500 dark:text-slate-400 text-[10px]">
                        {day === "Sunday" ? "রবিবার" : day === "Monday" ? "সোমবার" : day === "Tuesday" ? "মঙ্গলবার" : day === "Wednesday" ? "বুধবার" : "বৃহস্পতিবার"}
                      </div>
                      <div className="text-sm font-black text-indigo-600">{val.periods} টি</div>
                      <div className="text-[10px] text-emerald-600 font-bold">
                        মুক্ত: {selectedTeacherWorkload.freePeriodsDaily[day] || 0}টি
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned Subjects & Classes */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 dark:text-white">অ্যাসাইনকৃত বিষয় ও শ্রেণিসমূহ:</h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedTeacherWorkload.assignedSubjects.map((s, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                        <span className="text-slate-400 font-mono ml-1.5">({s.code})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                          {s.class} ({s.section})
                        </span>
                        {s.isLab && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold text-[10px]">
                            ল্যাব
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SMART EXCEL IMPORT
         ========================================================================= */}
      {showExcelImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>স্মার্ট এক্সেল হাজিরা আমদানি (Smart Excel Import)</span>
              </h3>
              <button
                onClick={() => setShowExcelImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                এক্সেল শিট থেকে নিচের কলাম অনুসারে ডাটা কপি করে এখানে পেস্ট করুন:
                <br />
                <code className="text-indigo-600 font-mono">EmployeeCode [TAB] Name [TAB] Status [TAB] CheckIn</code>
              </p>

              <textarea
                rows={5}
                value={excelImportText}
                onChange={(e) => setExcelImportText(e.target.value)}
                placeholder="EMP-101	Engr. Rafiqul	present	08:45 AM&#10;EMP-102	Engr. Tanvir	late	09:15 AM"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-xs outline-none"
              />

              <button
                onClick={handleParseExcelText}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold"
              >
                প্রিভিউ ও ভ্যালিডেশন
              </button>

              {excelImportRows.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-emerald-600">
                    {excelImportRows.length} টি রেকর্ড সফলভাবে পার্স করা হয়েছে:
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {excelImportRows.map((r, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 flex justify-between font-mono text-[11px]">
                        <span>{r.employeeCode} - {r.name}</span>
                        <span className="font-bold text-indigo-600">{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowExcelImportModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleCommitExcelImport}
                  disabled={excelImportRows.length === 0}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/30 disabled:opacity-50"
                >
                  ডাটাবেসে ইমপোর্ট করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ATTENDANCE AUDIT LOG
         ========================================================================= */}
      {auditModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>হাজিরা অডিট ইতিহাস (Audit Trail)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {auditModalRecord.employeeName} ({auditModalRecord.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setAuditModalRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
              {auditModalRecord.auditHistory && auditModalRecord.auditHistory.length > 0 ? (
                auditModalRecord.auditHistory.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>পরিবর্তনকারী: <strong>{item.changedBy}</strong></span>
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      স্থিতি: {item.previousStatus || "প্রাথমিক"} → <span className="text-indigo-600">{item.newStatus}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.reason}</div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 italic">
                  এই রেকর্ডের জন্য কোনো পূর্ববর্তী সংশোধনের অডিট লগ নেই।
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
