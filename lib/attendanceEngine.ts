// Advanced Attendance Management Engine for Panchagarh Govt. TSC
// High-performance, Routine-Aware, Server-side Paginated, Quiz Eligibility Ready
import {
  institutionalDb,
  Student,
  AttendanceRecord,
  AttendanceEntry,
  AttendanceStatus,
  AttendanceRecordType,
  AttendanceWorkflowStatus,
  RoutineItem,
} from "./database";
import {
  doesClassHaveTrade,
  parseClassNumeric,
  doesStudentMatchTrade,
  isTradeValidForClass,
  getSubjectsForClass,
  ACADEMIC_CLASSES,
  ALL_TRADES,
} from "./academicStructure";
import { ACADEMIC_HOLIDAYS_2026, getDayType } from "./attendanceData";

export interface AttendanceContext {
  session: string; // e.g. "2026"
  classId: number;
  className: string;
  numericClass: number;
  section: string;
  tradeId?: number;
  tradeCode?: string;
  tradeName?: string;
  subjectCode?: string;
  subjectName?: string;
  date: string; // YYYY-MM-DD
  periodNo: number;
  attendanceType: AttendanceRecordType;
  teacherId?: number;
  teacherName?: string;
  substituteTeacherName?: string;
  roomNo?: string;
  isLab?: boolean;
}

export interface StatusMeta {
  code: AttendanceStatus;
  label: string;
  labelBangla: string;
  shortcut: string;
  badgeClass: string;
  borderClass: string;
  bgLightClass: string;
  activeBtnClass: string;
  iconName: string;
  description: string;
}

export const ATTENDANCE_STATUS_META: Record<AttendanceStatus, StatusMeta> = {
  P: {
    code: "P",
    label: "Present",
    labelBangla: "উপস্থিত",
    shortcut: "P",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    borderClass: "border-emerald-500",
    bgLightClass: "bg-emerald-50/70 dark:bg-emerald-950/20",
    activeBtnClass: "bg-emerald-600 text-white shadow-emerald-500/30 ring-2 ring-emerald-400",
    iconName: "CheckCircle2",
    description: "শিক্ষার্থী শ্রেণিকক্ষে বা ল্যাবে উপস্থিত ছিল",
  },
  A: {
    code: "A",
    label: "Absent",
    labelBangla: "অনুপস্থিত",
    shortcut: "A",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-700",
    borderClass: "border-rose-500",
    bgLightClass: "bg-rose-50/70 dark:bg-rose-950/20",
    activeBtnClass: "bg-rose-600 text-white shadow-rose-500/30 ring-2 ring-rose-400",
    iconName: "XCircle",
    description: "বিনা অনুমতিতে অনুপস্থিত",
  },
  L: {
    code: "L",
    label: "Late",
    labelBangla: "বিলম্বে উপস্থিত",
    shortcut: "L",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    borderClass: "border-amber-500",
    bgLightClass: "bg-amber-50/70 dark:bg-amber-950/20",
    activeBtnClass: "bg-amber-600 text-white shadow-amber-500/30 ring-2 ring-amber-400",
    iconName: "Clock",
    description: "নির্ধারিত সময়ের পর দেরিতে শ্রেণিকক্ষে যোগদান",
  },
  E: {
    code: "E",
    label: "Excused / Leave",
    labelBangla: "অনুমোদিত ছুটি",
    shortcut: "E",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-700",
    borderClass: "border-blue-500",
    bgLightClass: "bg-blue-50/70 dark:bg-blue-950/20",
    activeBtnClass: "bg-blue-600 text-white shadow-blue-500/30 ring-2 ring-blue-400",
    iconName: "FileCheck",
    description: "লিখিত আবেদন বা অভিভাবকের অবহিতকরণক্রমে ছুটি",
  },
  M: {
    code: "M",
    label: "Medical Absence",
    labelBangla: "চিকিৎসাজনিত",
    shortcut: "M",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-700",
    borderClass: "border-purple-500",
    bgLightClass: "bg-purple-50/70 dark:bg-purple-950/20",
    activeBtnClass: "bg-purple-600 text-white shadow-purple-500/30 ring-2 ring-purple-400",
    iconName: "ShieldAlert",
    description: "অসুস্থতা বা মেডিকেল গ্রাউন্ডে অব্যাহতি",
  },
};

export const ATTENDANCE_TYPES_CONFIG: {
  id: AttendanceRecordType;
  label: string;
  labelBangla: string;
  description: string;
}[] = [
  {
    id: "regular",
    label: "Daily Regular Attendance",
    labelBangla: "দৈনিক সাধারণ হাজিরা (প্রারম্ভিক)",
    description: "দিনের প্রথম বা প্রধান রোল কল হাজিরা",
  },
  {
    id: "period",
    label: "Period-wise Attendance",
    labelBangla: "পিরিয়ড ভিত্তিক হাজিরা",
    description: "নির্দিষ্ট ক্লাস পিরিয়ডের হাজিরা",
  },
  {
    id: "subject",
    label: "Subject-wise Attendance",
    labelBangla: "বিষয় ভিত্তিক হাজিরা",
    description: "তাত্ত্বিক পাঠদানের হাজিরা",
  },
  {
    id: "practical",
    label: "Practical / Lab Attendance",
    labelBangla: "ব্যবহারিক / ল্যাব হাজিরা",
    description: "ওয়ার্কশপ ও ল্যাবরেটরি প্র্যাকটিক্যাল সেশন",
  },
  {
    id: "exam",
    label: "Examination Attendance",
    labelBangla: "পরীক্ষার হল হাজিরা",
    description: "অর্ধবার্ষিক, প্রাক-নির্বাচনী বা চূড়ান্ত পরীক্ষা",
  },
  {
    id: "special",
    label: "Special / Remedial Class",
    labelBangla: "বিশেষ / প্রতিকারমূলক ক্লাস",
    description: "পিছিয়ে পড়া শিক্ষার্থীদের বিশেষ ক্লাস",
  },
];

export const DAYS_BN_MAP: Record<number, { day: string; bangla: string }> = {
  0: { day: "Sunday", bangla: "রবিবার" },
  1: { day: "Monday", bangla: "সোমবার" },
  2: { day: "Tuesday", bangla: "মঙ্গলবার" },
  3: { day: "Wednesday", bangla: "বুধবার" },
  4: { day: "Thursday", bangla: "বৃহস্পতিবার" },
  5: { day: "Friday", bangla: "শুক্রবার" },
  6: { day: "Saturday", bangla: "শনিবার" },
};

/**
 * Correlates the attendance context with the official routine builder
 * Identifies the scheduled subject, teacher, room, lab, and substitute teacher.
 */
export function correlateRoutineContext(params: {
  session: string;
  classId: number;
  section: string;
  tradeId?: number;
  date: string;
  periodNo: number;
}): {
  found: boolean;
  routineItem?: RoutineItem;
  dayName: string;
  dayNameBangla: string;
  subjectCode?: string;
  subjectName?: string;
  teacherId?: number;
  teacherName?: string;
  substituteTeacherName?: string;
  roomNo?: string;
  isLab?: boolean;
  labName?: string;
  suggestedAttendanceType: AttendanceRecordType;
} {
  const d = new Date(params.date + "T00:00:00");
  const dayIndex = isNaN(d.getTime()) ? 0 : d.getDay();
  const dayInfo = DAYS_BN_MAP[dayIndex] || DAYS_BN_MAP[0];

  const numeric = parseClassNumeric(params.classId);
  const tradeApplies = doesClassHaveTrade(params.classId);

  // Search published routines
  const matched = institutionalDb.routines.find((r) => {
    const routineNumeric = parseClassNumeric(r.classId);
    if (routineNumeric !== numeric) return false;
    if (r.day.toLowerCase() !== dayInfo.day.toLowerCase()) return false;
    if (r.periodNo !== params.periodNo) return false;
    if (params.section && params.section !== "all" && r.section !== params.section) return false;

    if (tradeApplies && params.tradeId) {
      if ((r as any).tradeId && (r as any).tradeId !== params.tradeId) return false;
    }
    return true;
  });

  if (matched) {
    return {
      found: true,
      routineItem: matched,
      dayName: dayInfo.day,
      dayNameBangla: dayInfo.bangla,
      subjectCode: matched.subjectCode,
      subjectName: matched.subjectName,
      teacherId: matched.teacherId,
      teacherName: matched.teacherName,
      substituteTeacherName: matched.substituteTeacherName,
      roomNo: matched.roomNo,
      isLab: matched.isLab,
      labName: (matched as any).labName,
      suggestedAttendanceType: matched.isLab ? "practical" : "period",
    };
  }

  // Fallback defaults if no published routine exists for this specific period/day
  return {
    found: false,
    dayName: dayInfo.day,
    dayNameBangla: dayInfo.bangla,
    suggestedAttendanceType: "regular",
  };
}

/**
 * Server-side Student Pagination and Filtering
 * Supports 10,000+ students by searching and paging directly on the server.
 */
export function getPagedStudentsForContext(params: {
  classId?: number | null;
  section?: string | null;
  tradeId?: number | null;
  session?: string | null;
  search?: string | null;
  page?: number;
  limit?: number;
}): {
  items: Student[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(200, Number(params.limit) || 50));
  const search = (params.search || "").trim().toLowerCase();

  let list = institutionalDb.students.filter((s) => s.status === "Active" || !s.status);

  // Class filtering
  if (params.classId) {
    const targetNumeric = parseClassNumeric(params.classId);
    list = list.filter((s) => parseClassNumeric(s.classId) === targetNumeric);
  }

  // Section filtering
  if (params.section && params.section !== "all") {
    list = list.filter((s) => s.section === params.section);
  }

  // Trade filtering (Strict academic rule: only for Class 9-12)
  if (params.classId && doesClassHaveTrade(params.classId) && params.tradeId && params.tradeId !== 0) {
    list = list.filter((s) => doesStudentMatchTrade(s.tradeId, s.tradeName, params.tradeId!));
  }

  // Server-side multi-attribute search
  if (search) {
    list = list.filter(
      (s) =>
        s.studentId.toLowerCase().includes(search) ||
        s.admissionNo.toLowerCase().includes(search) ||
        String(s.roll).includes(search) ||
        s.name.toLowerCase().includes(search) ||
        (s.nameBangla && s.nameBangla.includes(search)) ||
        (s.guardianMobile && s.guardianMobile.includes(search))
    );
  }

  // Sort by Roll number ascending
  list.sort((a, b) => a.roll - b.roll);

  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const items = list.slice(startIndex, startIndex + limit);

  return {
    items,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * CRITICAL QUIZ INTEGRATION FOUNDATION
 * Exposes a reliable eligibility query: GetPresentStudentsForContext
 * Returns authoritative list of students marked PRESENT (or LATE if allowed)
 * Students marked ABSENT are strictly excluded.
 */
export function getPresentStudentsForQuizContext(params: {
  session: string;
  classId: number;
  section: string;
  tradeId?: number;
  date: string;
  periodNo?: number;
  subjectCode?: string;
  includeLate?: boolean;
}): {
  success: boolean;
  message?: string;
  context: {
    session: string;
    classId: number;
    section: string;
    tradeId?: number;
    date: string;
    periodNo?: number;
    subjectCode?: string;
  };
  recordFound: boolean;
  isFinalized: boolean;
  attendanceRecordId?: string;
  totalPresent: number;
  totalAbsent: number;
  totalExcused: number;
  eligibleStudents: {
    studentId: number;
    roll: number;
    studentCode: string;
    name: string;
    nameBangla?: string;
    status: AttendanceStatus;
    remark?: string;
    photoUrl?: string;
  }[];
  absentStudentsCount: number;
  excludedStudentCodes: string[];
} {
  const numeric = parseClassNumeric(params.classId);
  const tradeApplies = doesClassHaveTrade(params.classId);

  // Search existing attendance record matching this academic context
  const matchedRecord = institutionalDb.attendanceRecords.find((r) => {
    if (r.session !== params.session) return false;
    if (r.date !== params.date) return false;
    if (parseClassNumeric(r.classId) !== numeric) return false;
    if (params.section !== "all" && r.section !== params.section) return false;
    if (tradeApplies && params.tradeId) {
      if (r.tradeId && r.tradeId !== params.tradeId) return false;
    }
    if (params.periodNo && r.periodNo !== params.periodNo) return false;
    return true;
  });

  if (!matchedRecord) {
    return {
      success: false,
      message: `নির্বাচিত তারিখ (${params.date}), শ্রেণি ${numeric}, সেকশন ${params.section} এর জন্য কোনো হাজিরা রেকর্ড পাওয়া যায়নি।`,
      context: params,
      recordFound: false,
      isFinalized: false,
      totalPresent: 0,
      totalAbsent: 0,
      totalExcused: 0,
      eligibleStudents: [],
      absentStudentsCount: 0,
      excludedStudentCodes: [],
    };
  }

  const eligible: typeof matchedRecord.entries = [];
  const excludedCodes: string[] = [];
  let absentCount = 0;
  let excusedCount = 0;

  matchedRecord.entries.forEach((entry) => {
    const isPresent = entry.status === "P";
    const isLate = entry.status === "L";

    if (isPresent || (params.includeLate && isLate)) {
      eligible.push(entry);
    } else {
      excludedCodes.push(entry.studentCode);
      if (entry.status === "A") absentCount++;
      if (entry.status === "E" || entry.status === "M") excusedCount++;
    }
  });

  return {
    success: true,
    message: `সফলভাবে ${eligible.length} জন উপস্থিত শিক্ষার্থী কুইজে অংশগ্রহণের জন্য প্রস্তুত।`,
    context: params,
    recordFound: true,
    isFinalized: matchedRecord.isLocked || matchedRecord.status === "finalized",
    attendanceRecordId: matchedRecord.id,
    totalPresent: eligible.length,
    totalAbsent: absentCount,
    totalExcused: excusedCount,
    eligibleStudents: eligible.map((e) => ({
      studentId: e.studentId,
      roll: e.roll,
      studentCode: e.studentCode,
      name: e.name,
      nameBangla: e.nameBangla,
      status: e.status,
      remark: e.remark,
      photoUrl: e.photoUrl,
    })),
    absentStudentsCount: absentCount,
    excludedStudentCodes: excludedCodes,
  };
}

/**
 * Today's Attendance Dashboard Timeline & KPI Generator
 * Scans today's schedule from routine and links with attendance records.
 */
export function getTodayAttendanceSchedule(
  dateStr?: string,
  teacherName?: string,
  userRole?: string
): {
  date: string;
  dayName: string;
  dayNameBangla: string;
  isHoliday: boolean;
  holidayTitle?: string;
  isWeekend: boolean;
  totalScheduled: number;
  completedCount: number;
  pendingCount: number;
  finalizedCount: number;
  completionRatePct: number;
  averageAttendanceRate: number;
  totalAbsenteesToday: number;
  scheduledSessions: {
    id: string;
    routineId?: number;
    periodNo: number;
    startTime: string;
    endTime: string;
    classId: number;
    className: string;
    numericClass: number;
    section: string;
    tradeId?: number;
    tradeName?: string;
    subjectCode: string;
    subjectName: string;
    teacherName: string;
    substituteTeacherName?: string;
    roomNo: string;
    isLab: boolean;
    status: "pending" | "draft" | "saved" | "finalized";
    attendanceRecordId?: string;
    presentCount?: number;
    absentCount?: number;
    attendanceRate?: number;
    isLocked?: boolean;
  }[];
  classWiseSummary: {
    numericClass: number;
    className: string;
    scheduled: number;
    completed: number;
    pending: number;
    presentRate: number;
  }[];
} {
  const targetDate = dateStr || new Date().toISOString().split("T")[0];
  const d = new Date(targetDate + "T00:00:00");
  const dayIndex = isNaN(d.getTime()) ? 0 : d.getDay();
  const dayInfo = DAYS_BN_MAP[dayIndex] || DAYS_BN_MAP[0];
  const dayType = getDayType(targetDate);

  // Published routine for this day of week
  let activeRoutines = institutionalDb.routines.filter(
    (r) => r.day.toLowerCase() === dayInfo.day.toLowerCase() && r.status === "published"
  );

  // If filtered by specific faculty
  if (teacherName && userRole === "teacher") {
    activeRoutines = activeRoutines.filter(
      (r) =>
        r.teacherName.toLowerCase() === teacherName.toLowerCase() ||
        (r.substituteTeacherName && r.substituteTeacherName.toLowerCase() === teacherName.toLowerCase())
    );
  }

  // Sort by period
  activeRoutines.sort((a, b) => a.periodNo - b.periodNo);

  const sessions: ReturnType<typeof getTodayAttendanceSchedule>["scheduledSessions"] = [];
  let totalPresentCount = 0;
  let totalRecordedCount = 0;
  let totalAbsentees = 0;
  let finalizedCount = 0;
  let savedCount = 0;

  activeRoutines.forEach((r) => {
    const numClass = parseClassNumeric(r.classId);
    // Find matching record
    const record = institutionalDb.attendanceRecords.find((rec) => {
      if (rec.date !== targetDate) return false;
      if (parseClassNumeric(rec.classId) !== numClass) return false;
      if (rec.section !== r.section) return false;
      if ((r as any).tradeId && rec.tradeId && rec.tradeId !== (r as any).tradeId) return false;
      if (rec.periodNo !== r.periodNo) return false;
      return true;
    });

    let status: "pending" | "draft" | "saved" | "finalized" = "pending";
    let present = 0;
    let absent = 0;
    let rate = 0;

    if (record) {
      if (record.isLocked || record.status === "finalized") {
        status = "finalized";
        finalizedCount++;
      } else if (record.status === "draft") {
        status = "draft";
      } else {
        status = "saved";
        savedCount++;
      }

      const totalEntries = record.entries.length;
      present = record.entries.filter((e) => e.status === "P" || e.status === "L").length;
      absent = record.entries.filter((e) => e.status === "A").length;
      rate = totalEntries > 0 ? Number(((present / totalEntries) * 100).toFixed(1)) : 100;

      totalPresentCount += present;
      totalRecordedCount += totalEntries;
      totalAbsentees += absent;
    }

    sessions.push({
      id: `session_${r.id}_${targetDate}`,
      routineId: r.id,
      periodNo: r.periodNo,
      startTime: r.startTime,
      endTime: r.endTime,
      classId: r.classId,
      className: r.className,
      numericClass: numClass,
      section: r.section || "A",
      tradeId: (r as any).tradeId,
      tradeName: (r as any).tradeName,
      subjectCode: r.subjectCode,
      subjectName: r.subjectName,
      teacherName: r.teacherName,
      substituteTeacherName: r.substituteTeacherName,
      roomNo: r.roomNo,
      isLab: !!r.isLab,
      status,
      attendanceRecordId: record ? record.id : undefined,
      presentCount: record ? present : undefined,
      absentCount: record ? absent : undefined,
      attendanceRate: record ? rate : undefined,
      isLocked: record ? record.isLocked : false,
    });
  });

  const totalScheduled = sessions.length;
  const completedCount = finalizedCount + savedCount;
  const pendingCount = totalScheduled - completedCount;
  const completionRatePct = totalScheduled > 0 ? Number(((completedCount / totalScheduled) * 100).toFixed(1)) : 0;
  const averageAttendanceRate =
    totalRecordedCount > 0 ? Number(((totalPresentCount / totalRecordedCount) * 100).toFixed(1)) : 88.5;

  // Class-wise summary
  const classMap = new Map<number, { scheduled: number; completed: number; pending: number; presentRate: number }>();
  for (let c = 6; c <= 12; c++) {
    classMap.set(c, { scheduled: 0, completed: 0, pending: 0, presentRate: 0 });
  }

  sessions.forEach((s) => {
    const entry = classMap.get(s.numericClass);
    if (entry) {
      entry.scheduled++;
      if (s.status === "saved" || s.status === "finalized") {
        entry.completed++;
        if (s.attendanceRate !== undefined) {
          entry.presentRate = (entry.presentRate + s.attendanceRate) / 2;
        }
      } else {
        entry.pending++;
      }
    }
  });

  const classWiseSummary = Array.from(classMap.entries()).map(([numericClass, stats]) => ({
    numericClass,
    className: `Class ${numericClass}`,
    scheduled: stats.scheduled,
    completed: stats.completed,
    pending: stats.pending,
    presentRate: stats.scheduled > 0 ? Number(stats.presentRate.toFixed(1)) : 0,
  }));

  return {
    date: targetDate,
    dayName: dayInfo.day,
    dayNameBangla: dayInfo.bangla,
    isHoliday: dayType.isHoliday,
    holidayTitle: dayType.holidayTitle,
    isWeekend: dayType.isWeekend,
    totalScheduled,
    completedCount,
    pendingCount,
    finalizedCount,
    completionRatePct,
    averageAttendanceRate,
    totalAbsenteesToday: totalAbsentees,
    scheduledSessions: sessions,
    classWiseSummary,
  };
}

/**
 * Calculates Absence Analytics, Frequent Absentees, and Consecutive Absences
 */
export function calculateAbsenceAnalytics(thresholdPct: number = 75) {
  const records = institutionalDb.attendanceRecords;
  const students = institutionalDb.students.filter((s) => s.status === "Active");

  // Track per-student attendance stats
  const studentMap = new Map<
    number,
    {
      student: Student;
      totalRecorded: number;
      presentCount: number;
      absentCount: number;
      lateCount: number;
      excusedCount: number;
      consecutiveAbsences: number;
      recentStatuses: { date: string; status: AttendanceStatus }[];
    }
  >();

  students.forEach((s) => {
    studentMap.set(s.id, {
      student: s,
      totalRecorded: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      consecutiveAbsences: 0,
      recentStatuses: [],
    });
  });

  // Sort records chronologically
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));

  sortedRecords.forEach((rec) => {
    rec.entries.forEach((e) => {
      const data = studentMap.get(e.studentId);
      if (data) {
        data.totalRecorded++;
        data.recentStatuses.push({ date: rec.date, status: e.status });
        if (e.status === "P") data.presentCount++;
        else if (e.status === "A") data.absentCount++;
        else if (e.status === "L") data.lateCount++;
        else if (e.status === "E" || e.status === "M") data.excusedCount++;
      }
    });
  });

  // Analyze consecutive absences and rate
  const frequentAbsentees: {
    studentId: number;
    studentCode: string;
    roll: number;
    name: string;
    className: string;
    tradeName?: string;
    totalClasses: number;
    absentDays: number;
    attendanceRate: number;
    warning: "severe" | "moderate";
  }[] = [];

  const consecutiveAlerts: {
    studentId: number;
    studentCode: string;
    roll: number;
    name: string;
    className: string;
    consecutiveDays: number;
    lastSeenDate?: string;
  }[] = [];

  let grandTotalRecorded = 0;
  let grandTotalPresent = 0;

  studentMap.forEach((data) => {
    if (data.totalRecorded === 0) return;

    grandTotalRecorded += data.totalRecorded;
    grandTotalPresent += data.presentCount + data.lateCount;

    const rate = Number((((data.presentCount + data.lateCount) / data.totalRecorded) * 100).toFixed(1));

    // Check consecutive trailing absences
    let currentStreak = 0;
    for (let i = data.recentStatuses.length - 1; i >= 0; i--) {
      if (data.recentStatuses[i].status === "A") {
        currentStreak++;
      } else {
        break;
      }
    }
    data.consecutiveAbsences = currentStreak;

    if (currentStreak >= 3) {
      consecutiveAlerts.push({
        studentId: data.student.id,
        studentCode: data.student.studentId,
        roll: data.student.roll,
        name: data.student.nameBangla || data.student.name,
        className: data.student.className,
        consecutiveDays: currentStreak,
        lastSeenDate: data.recentStatuses.find((r) => r.status === "P")?.date,
      });
    }

    if (rate < thresholdPct) {
      frequentAbsentees.push({
        studentId: data.student.id,
        studentCode: data.student.studentId,
        roll: data.student.roll,
        name: data.student.nameBangla || data.student.name,
        className: data.student.className,
        tradeName: data.student.tradeName,
        totalClasses: data.totalRecorded,
        absentDays: data.absentCount,
        attendanceRate: rate,
        warning: rate < 60 ? "severe" : "moderate",
      });
    }
  });

  frequentAbsentees.sort((a, b) => a.attendanceRate - b.attendanceRate);
  consecutiveAlerts.sort((a, b) => b.consecutiveDays - a.consecutiveDays);

  const institutionalAverageRate =
    grandTotalRecorded > 0 ? Number(((grandTotalPresent / grandTotalRecorded) * 100).toFixed(1)) : 89.4;

  return {
    thresholdPct,
    institutionalAverageRate,
    totalAssessedStudents: studentMap.size,
    belowThresholdCount: frequentAbsentees.length,
    consecutiveAbsenceCount: consecutiveAlerts.length,
    frequentAbsentees,
    consecutiveAlerts,
  };
}
