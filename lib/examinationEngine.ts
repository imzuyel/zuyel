// Authoritative Examination & Assessment Management Engine
// Compliant with Bangladesh Technical Education Board (BTEB) & DTE Regulations
// Standardized for Panchagarh Govt. Technical School & College (PTSC)

import { institutionalDb, FacultyMember, Student, InstitutionalExam, ExamMark, ExamRoutineItem } from "./database";
import { ACADEMIC_CLASSES, ALL_TRADES, parseClassNumeric, doesClassHaveTrade, doesStudentMatchTrade } from "./academicStructure";
import * as subjectEngine from "./subjectEngine";
import { calculateSubjectTotalAndGrade, calculateBtebContinuousBreakdown } from "./resultCalculation";

// ==========================================
// 1. TYPES & CORE INTERFACES
// ==========================================

export type AssessmentCategory =
  | "term"              // অর্ধবার্ষিক, বার্ষিক, প্রাক-নির্বাচনী, মডেল টেস্ট
  | "periodic"          // মাসিক পরীক্ষা, ক্লাস টেস্ট, সাপ্তাহিক পরীক্ষা
  | "practical_skills"  // ব্যবহারিক পরীক্ষা, ভাইভা / মৌখিক, ল্যাব কর্মদক্ষতা
  | "coursework"        // অ্যাসাইনমেন্ট, প্রজেক্ট, শিল্প সংযুক্তি মূল্যায়ন, ধারাবাহিক মূল্যায়ন
  | "other";            // অন্যান্য কাস্টম মূল্যায়ন

export type AssessmentType =
  // Term
  | "Half-Yearly"
  | "Annual"
  | "Mid-Term"
  | "Model-Test"
  | "Pre-Test"
  // Periodic
  | "Monthly"
  | "Class-Test"
  | "Weekly-Test"
  // Practical & Skills
  | "Practical"
  | "Viva"
  | "Lab-Performance"
  // Coursework
  | "Assignment"
  | "Project"
  | "Continuous-Assessment"
  | "Internal-Assessment"
  | "Industrial-Attachment"
  // Custom
  | "Custom";

export type ExamStatus =
  | "Draft"           // খসড়া প্রস্তুত
  | "Published"       // ঘোষিত / প্রকাশিত
  | "Ongoing"         // চলমান পরীক্ষা
  | "MarksEntry"      // নম্বর এন্ট্রি উন্মুক্ত
  | "UnderReview"     // যাচাই ও নিরীক্ষণ চলছে
  | "Completed"       // মূল্যায়ন সমাপ্ত
  | "Locked"          // ফলাফল ও নম্বর লককৃত
  | "Archived";       // আর্কাইভকৃত

export type StudentExamAttendanceStatus = "Present" | "Absent" | "Expelled" | "Medical";

export interface ExamComponentRule {
  hasTheory: boolean;
  theoryMax: number;
  theoryPass: number;
  hasPractical: boolean;
  practicalMax: number;
  practicalPass: number;
  hasViva: boolean;
  vivaMax: number;
  vivaPass: number;
  hasContinuous: boolean;
  continuousMax: number;
  continuousPass: number;
  fullMarks: number;
  passMarks: number;
  requireSeparatePass: boolean; // BTEB Standard: তাত্ত্বিক ও ব্যবহারিকে আলাদা পাস বাধ্যতামূলক
}

export interface ExamSubjectConfig {
  id: string; // `${examId}_${classId}_${tradeId || 0}_${subjectCode}`
  examId: number;
  classId: number;
  className: string;
  tradeId?: number;
  tradeCode?: string;
  tradeName?: string;
  subjectCode: string;
  subjectName: string;
  subjectNameBangla: string;
  componentRule: ExamComponentRule;
  evaluatorTeacherId?: number;
  evaluatorTeacherName?: string;
  secondEvaluatorTeacherId?: number;
  secondEvaluatorTeacherName?: string;
  scheduleDate?: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  roomNo?: string;
  invigilatorIds?: number[];
  invigilatorNames?: string[];
  maxEntriesCount?: number;
  enteredCount?: number;
  isMarksSubmitted?: boolean;
  submittedAt?: string;
  submittedBy?: string;
  isLocked?: boolean;
}

export interface ExamMaster {
  id: number;
  code: string; // e.g. "EXAM-2026-HY-01"
  name: string;
  nameBangla: string;
  academicYear: number;
  term: string;
  category: AssessmentCategory;
  assessmentType: AssessmentType;
  targetClassIds: number[]; // e.g. [1, 2, 3, 4, 5, 6, 7]
  targetTradeIds?: number[];
  targetSections: string[];
  startDate: string;
  endDate: string;
  marksSubmissionDeadline: string;
  status: ExamStatus;
  gradingStandard: "BTEB" | "GENERAL";
  allowTeacherMarksEntry: boolean;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  description?: string;
  instructions?: string;
  subjects: ExamSubjectConfig[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamMarkStudentEntry {
  studentId: number;
  roll: number;
  name: string;
  nameBangla: string;
  studentCode: string;
  gender: string;
  section: string;
  tradeCode?: string;
  attendanceStatus: StudentExamAttendanceStatus;
  theoryMarks?: number | null;
  practicalMarks?: number | null;
  vivaMarks?: number | null;
  continuousMarks?: number | null;
  totalMarks: number;
  grade: string;
  gradePoint: number;
  isPassed: boolean;
  componentFailReasons?: string[];
  remarks?: string;
  status: "Draft" | "Submitted" | "Verified" | "Locked";
  updatedAt: string;
  updatedBy?: string;
}

export interface ExamAuditLog {
  id: string;
  examId: number;
  examName: string;
  studentId?: number;
  studentName?: string;
  roll?: number;
  subjectCode?: string;
  subjectName?: string;
  action:
    | "CREATE_EXAM"
    | "UPDATE_EXAM"
    | "UPDATE_STATUS"
    | "ENTER_MARKS"
    | "MODIFY_MARKS"
    | "LOCK_EXAM"
    | "UNLOCK_EXAM"
    | "SCHEDULE_UPDATE"
    | "BULK_MARKS_SUBMIT";
  changedBy: string;
  reason: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: string;
}

// ==========================================
// 2. INITIAL SEED DATA BUILDER
// ==========================================

function buildInitialSubjectConfigs(examId: number, targetClassIds: number[], category: AssessmentCategory): ExamSubjectConfig[] {
  const configs: ExamSubjectConfig[] = [];

  targetClassIds.forEach((classId) => {
    const cls = ACADEMIC_CLASSES.find((c) => c.id === classId);
    if (!cls) return;

    const hasTrade = doesClassHaveTrade(cls.numericValue);
    const applicableTrades = hasTrade ? ALL_TRADES.filter((t) => t.applicableClass === cls.numericValue) : [];

    // Retrieve subjects from subjectEngine for this class
    const mappings = subjectEngine.getSubjectMappings(cls.id);

    if (mappings && mappings.length > 0) {
      mappings.forEach((m) => {
        // Default components based on category & subject properties
        let fullMarks = m.fullMarks || 100;
        let passMarks = m.passMarks || 33;
        let theoryMax = m.theoryMarks || (m.subjectType.includes("Practical") ? 0 : fullMarks);
        let practicalMax = m.practicalMarks || (m.subjectType.includes("Practical") ? fullMarks : 0);
        let vivaMax = m.vivaMarks || 0;
        let continuousMax = m.continuousMarks || 0;

        // Custom adjustments for quick assessments
        if (category === "periodic") {
          fullMarks = 25;
          passMarks = 10;
          theoryMax = 25;
          practicalMax = 0;
          vivaMax = 0;
          continuousMax = 0;
        } else if (category === "practical_skills") {
          fullMarks = 50;
          passMarks = 20;
          theoryMax = 0;
          practicalMax = 40;
          vivaMax = 10;
          continuousMax = 0;
        }

        const rule: ExamComponentRule = {
          hasTheory: theoryMax > 0,
          theoryMax,
          theoryPass: Math.round(theoryMax * 0.33),
          hasPractical: practicalMax > 0,
          practicalMax,
          practicalPass: Math.round(practicalMax * 0.33),
          hasViva: vivaMax > 0,
          vivaMax,
          vivaPass: Math.round(vivaMax * 0.33),
          hasContinuous: continuousMax > 0,
          continuousMax,
          continuousPass: Math.round(continuousMax * 0.33),
          fullMarks,
          passMarks,
          requireSeparatePass: true,
        };

        // Assign sample instructor
        const instructor = institutionalDb.faculty.find((f) => f.tradeCode === m.tradeCode) || institutionalDb.faculty[1];

        configs.push({
          id: `${examId}_${classId}_${m.tradeId || 0}_${m.subjectCode}`,
          examId,
          classId,
          className: cls.name,
          tradeId: m.tradeId,
          tradeCode: m.tradeCode,
          tradeName: m.tradeName,
          subjectCode: m.subjectCode,
          subjectName: m.subjectName,
          subjectNameBangla: m.subjectNameBangla,
          componentRule: rule,
          evaluatorTeacherId: instructor?.id,
          evaluatorTeacherName: instructor?.name,
          durationMinutes: category === "periodic" ? 45 : 180,
          roomNo: m.subjectType.includes("Practical") ? "Lab 202 (IoT & Hardware)" : "Room 101, 102",
          invigilatorNames: [institutionalDb.faculty[2]?.name || "Engr. Mahmuda Begum"],
          isMarksSubmitted: examId <= 2,
        });
      });
    } else {
      // Fallback standard subjects
      const sampleCodes = [
        { code: "GEN-901", name: "Bangla", nameBn: "বাংলা", t: 60, p: 0, v: 0, c: 40 },
        { code: "GEN-902", name: "English", nameBn: "ইংরেজি", t: 60, p: 0, v: 0, c: 40 },
        { code: "GEN-903", name: "Mathematics", nameBn: "গণিত", t: 60, p: 0, v: 0, c: 40 },
      ];

      sampleCodes.forEach((s) => {
        configs.push({
          id: `${examId}_${classId}_0_${s.code}`,
          examId,
          classId,
          className: cls.name,
          subjectCode: s.code,
          subjectName: s.name,
          subjectNameBangla: s.nameBn,
          componentRule: {
            hasTheory: true,
            theoryMax: s.t,
            theoryPass: 20,
            hasPractical: false,
            practicalMax: 0,
            practicalPass: 0,
            hasViva: false,
            vivaMax: 0,
            vivaPass: 0,
            hasContinuous: true,
            continuousMax: s.c,
            continuousPass: 13,
            fullMarks: 100,
            passMarks: 33,
            requireSeparatePass: true,
          },
          evaluatorTeacherId: 6,
          evaluatorTeacherName: "Md. Mominul Haque",
          durationMinutes: 180,
          roomNo: "Room 101",
          invigilatorNames: ["Engr. Tanvir Ahmed"],
          isMarksSubmitted: examId <= 2,
        });
      });
    }
  });

  return configs;
}

const initialExamMasters: ExamMaster[] = [
  {
    id: 1,
    code: "EXAM-2026-HY-01",
    name: "Half Yearly Examination 2026",
    nameBangla: "অর্ধবার্ষিক মূল্যায়ন ২০২৬",
    academicYear: 2026,
    term: "Half-Yearly",
    category: "term",
    assessmentType: "Half-Yearly",
    targetClassIds: [1, 2, 3, 4, 5, 6, 7],
    targetSections: ["A", "B"],
    startDate: "2026-06-10",
    endDate: "2026-06-25",
    marksSubmissionDeadline: "2026-06-30",
    status: "Published",
    gradingStandard: "BTEB",
    allowTeacherMarksEntry: true,
    isLocked: false,
    description: "প্রাতিষ্ঠানিক অর্ধবার্ষিক মূল্যায়ন ও কারিগরি বোর্ডের প্রস্তুতি পরীক্ষা।",
    instructions: "সকল শিক্ষককে নির্ধারিত সময়সীমার মধ্যে নম্বরপত্র ও ব্যবহারিক মূল্যায়ন চূড়ান্ত করার নির্দেশ দেওয়া হলো।",
    subjects: buildInitialSubjectConfigs(1, [1, 4, 5], "term"),
    createdBy: "Academic Council",
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-03-01T12:00:00.000Z",
  },
  {
    id: 2,
    code: "EXAM-2026-MID-02",
    name: "Midterm Assessment 2026",
    nameBangla: "বর্ষ মধ্য পরীক্ষা ২০২৬",
    academicYear: 2026,
    term: "Half-Yearly",
    category: "term",
    assessmentType: "Mid-Term",
    targetClassIds: [4, 5],
    targetTradeIds: [1, 2, 3, 4],
    targetSections: ["A", "B"],
    startDate: "2026-04-10",
    endDate: "2026-04-24",
    marksSubmissionDeadline: "2026-04-28",
    status: "Completed",
    gradingStandard: "BTEB",
    allowTeacherMarksEntry: false,
    isLocked: true,
    lockedAt: "2026-04-29T18:00:00.000Z",
    lockedBy: "Controller of Examinations",
    description: "ভোকেশনাল শাখা ৯ ও ১০ম শ্রেণির পর্বমধ্য মূল্যায়ন।",
    subjects: buildInitialSubjectConfigs(2, [4, 5], "term"),
    createdBy: "Controller of Examinations",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-04-29T18:00:00.000Z",
  },
  {
    id: 3,
    code: "EXAM-2026-ANN-03",
    name: "Annual Examination 2026",
    nameBangla: "বার্ষিক মূল্যায়ন পরীক্ষা ২০২৬",
    academicYear: 2026,
    term: "Annual",
    category: "term",
    assessmentType: "Annual",
    targetClassIds: [1, 2, 3, 4, 6],
    targetSections: ["A", "B"],
    startDate: "2026-11-15",
    endDate: "2026-11-30",
    marksSubmissionDeadline: "2026-12-05",
    status: "Draft",
    gradingStandard: "BTEB",
    allowTeacherMarksEntry: false,
    isLocked: false,
    description: "২০২৬ শিক্ষাবর্ষের বার্ষিক পদোন্নতি পরীক্ষা।",
    subjects: buildInitialSubjectConfigs(3, [1, 4], "term"),
    createdBy: "Academic Committee",
    createdAt: "2026-02-01T11:00:00.000Z",
    updatedAt: "2026-02-01T11:00:00.000Z",
  },
  {
    id: 4,
    code: "EXAM-2026-MODEL-04",
    name: "Pre-Board Model Test 2026",
    nameBangla: "প্রাক-নির্বাচনী ও মডেল টেস্ট ২০২৬",
    academicYear: 2026,
    term: "Pre-Test",
    category: "term",
    assessmentType: "Model-Test",
    targetClassIds: [5, 7],
    targetTradeIds: [1, 2, 3, 4],
    targetSections: ["A"],
    startDate: "2026-03-01",
    endDate: "2026-03-12",
    marksSubmissionDeadline: "2026-03-18",
    status: "MarksEntry",
    gradingStandard: "BTEB",
    allowTeacherMarksEntry: true,
    isLocked: false,
    description: "এসএসসি ও এইচএসসি ভোকেশনাল সমাপনী পরীক্ষার্থীদের বোর্ড স্ট্যান্ডার্ড মডেল টেস্ট।",
    subjects: buildInitialSubjectConfigs(4, [5, 7], "term"),
    createdBy: "Controller of Examinations",
    createdAt: "2026-01-20T10:00:00.000Z",
    updatedAt: "2026-03-05T08:30:00.000Z",
  },
  {
    id: 5,
    code: "EXAM-2026-CT-05",
    name: "Class Test & Continuous Assessment 2026",
    nameBangla: "ক্লাস টেস্ট ও ধারাবাহিক মূল্যায়ন ২০২৬",
    academicYear: 2026,
    term: "Continuous",
    category: "periodic",
    assessmentType: "Class-Test",
    targetClassIds: [1, 2, 3, 4, 5, 6, 7],
    targetSections: ["A", "B"],
    startDate: "2026-02-01",
    endDate: "2026-12-10",
    marksSubmissionDeadline: "2026-12-15",
    status: "Ongoing",
    gradingStandard: "BTEB",
    allowTeacherMarksEntry: true,
    isLocked: false,
    description: "বছরব্যাপী ধারাবাহিক ক্লাস টেস্ট (CT-1, CT-2, CT-3, CT-4) এবং হাজিরা ভিত্তিক মূল্যায়ন।",
    subjects: buildInitialSubjectConfigs(5, [1, 4], "periodic"),
    createdBy: "Academic Committee",
    createdAt: "2026-01-05T08:00:00.000Z",
    updatedAt: "2026-03-02T14:00:00.000Z",
  },
  {
    id: 6,
    code: "EXAM-2026-PRAC-06",
    name: "Midterm Practical & Skills Assessment 2026",
    nameBangla: "কারিগরি ব্যবহারিক ও মৌখিক দক্ষতা মূল্যায়ন ২০২৬",
    academicYear: 2026,
    term: "Half-Yearly",
    category: "practical_skills",
    assessmentType: "Practical",
    targetClassIds: [4, 5, 6, 7],
    targetTradeIds: [1, 2, 3, 4],
    targetSections: ["A", "B"],
    startDate: "2026-06-26",
    endDate: "2026-06-30",
    marksSubmissionDeadline: "2026-07-05",
    status: "Published",
    gradingStandard: "BTEB",
    allowTeacherMarksEntry: true,
    isLocked: false,
    description: "ল্যাব ভিত্তিক প্র্যাকটিক্যাল জব মূল্যায়ন, রিপোর্ট সংরক্ষণ এবং এক্সটার্নাল মৌখিক পরীক্ষা।",
    subjects: buildInitialSubjectConfigs(6, [4, 5], "practical_skills"),
    createdBy: "Vocational Technical Board",
    createdAt: "2026-02-15T09:30:00.000Z",
    updatedAt: "2026-03-01T10:00:00.000Z",
  },
  {
    id: 7,
    code: "EXAM-2026-ASSIGN-07",
    name: "Technical Coursework & Assignment 2026",
    nameBangla: "কারিগরি কোর্সওয়ার্ক ও প্রজেক্ট অ্যাসাইনমেন্ট ২০২৬",
    academicYear: 2026,
    term: "Continuous",
    category: "coursework",
    assessmentType: "Assignment",
    targetClassIds: [4, 5, 6, 7],
    targetSections: ["A"],
    startDate: "2026-03-01",
    endDate: "2026-05-30",
    marksSubmissionDeadline: "2026-06-05",
    status: "Ongoing",
    gradingStandard: "BTEB",
    allowTeacherMarksEntry: true,
    isLocked: false,
    description: "শিক্ষার্থীদের বাস্তবমুখী প্রযুক্তিগত প্রজেক্ট, কেস স্টাডি ও রিপোর্ট মূল্যায়ন।",
    subjects: buildInitialSubjectConfigs(7, [4], "coursework"),
    createdBy: "Chief Instructor (IoT & IT)",
    createdAt: "2026-02-20T10:00:00.000Z",
    updatedAt: "2026-03-01T11:00:00.000Z",
  },
];

const initialAuditLogs: ExamAuditLog[] = [
  {
    id: "audit-001",
    examId: 2,
    examName: "বর্ষ মধ্য পরীক্ষা ২০২৬",
    action: "LOCK_EXAM",
    changedBy: "Controller of Examinations (Engr. Rafiqul Islam)",
    reason: "বোর্ড স্ট্যান্ডার্ড রেজাল্ট যাচাই সম্পূর্ণ হওয়ায় ফলাফল চূড়ান্ত লক করা হয়েছে।",
    previousValues: { isLocked: false, status: "UnderReview" },
    newValues: { isLocked: true, status: "Completed" },
    timestamp: "2026-04-29T18:00:00.000Z",
  },
  {
    id: "audit-002",
    examId: 4,
    examName: "প্রাক-নির্বাচনী ও মডেল টেস্ট ২০২৬",
    action: "UPDATE_STATUS",
    changedBy: "Academic Admin",
    reason: "শিক্ষকবৃন্দের জন্য নম্বর প্রদানের সুযোগ চালু করা হলো।",
    previousValues: { status: "Ongoing" },
    newValues: { status: "MarksEntry" },
    timestamp: "2026-03-05T08:30:00.000Z",
  },
  {
    id: "audit-003",
    examId: 1,
    examName: "অর্ধবার্ষিক মূল্যায়ন ২০২৬",
    studentId: 1,
    studentName: "Kazi Tanvir Hasan",
    roll: 1,
    subjectCode: "IT-901",
    subjectName: "IT Support Fundamentals & OS",
    action: "MODIFY_MARKS",
    changedBy: "Engr. Tanvir Ahmed",
    reason: "খাতা পুনর্নিরীক্ষণের পর তাত্ত্বিক অংশে নম্বর ৪২ থেকে ৪৪-এ বৃদ্ধি করা হলো।",
    previousValues: { theoryMarks: 42, totalMarks: 87, grade: "A" },
    newValues: { theoryMarks: 44, totalMarks: 89, grade: "A+" },
    timestamp: "2026-03-02T11:15:00.000Z",
  },
];

// ==========================================
// 3. SINGLETON EXAMINATION ENGINE
// ==========================================

class ExaminationEngine {
  private exams: ExamMaster[] = [...initialExamMasters];
  private auditLogs: ExamAuditLog[] = [...initialAuditLogs];

  constructor() {
    // Sync with database.ts initialExams if needed
    this.syncWithInstitutionalDb();
  }

  private syncWithInstitutionalDb() {
    // Ensure all institutionalDb.exams are represented
    institutionalDb.exams.forEach((dbExam) => {
      const exists = this.exams.find((e) => e.id === dbExam.id);
      if (!exists) {
        this.exams.push({
          id: dbExam.id,
          code: `EXAM-${dbExam.academicYear}-${dbExam.id}`,
          name: dbExam.name,
          nameBangla: dbExam.nameBangla,
          academicYear: dbExam.academicYear,
          term: dbExam.term,
          category: dbExam.term === "Continuous" ? "periodic" : "term",
          assessmentType: dbExam.term as any,
          targetClassIds: [1, 2, 3, 4, 5, 6, 7],
          targetSections: ["A", "B"],
          startDate: dbExam.startDate,
          endDate: dbExam.endDate,
          marksSubmissionDeadline: dbExam.endDate,
          status: dbExam.status as ExamStatus,
          gradingStandard: "BTEB",
          allowTeacherMarksEntry: true,
          isLocked: dbExam.status === "Locked",
          subjects: buildInitialSubjectConfigs(dbExam.id, [1, 4], "term"),
          createdBy: "System Sync",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });
  }

  // --- QUERY EXAMS ---
  public getAllExams(filters?: {
    academicYear?: number;
    category?: AssessmentCategory | "all";
    status?: ExamStatus | "all";
    classId?: number;
    search?: string;
  }): ExamMaster[] {
    let list = [...this.exams];

    if (filters?.academicYear) {
      list = list.filter((e) => e.academicYear === filters.academicYear);
    }
    if (filters?.category && filters.category !== "all") {
      list = list.filter((e) => e.category === filters.category);
    }
    if (filters?.status && filters.status !== "all") {
      list = list.filter((e) => e.status === filters.status);
    }
    if (filters?.classId) {
      list = list.filter((e) => e.targetClassIds.includes(filters.classId!));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.nameBangla.includes(q) ||
          e.code.toLowerCase().includes(q) ||
          e.term.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  public getExamById(id: number): ExamMaster | undefined {
    return this.exams.find((e) => e.id === id);
  }

  // --- CREATE & UPDATE EXAM ---
  public createExam(data: Partial<ExamMaster>, operator: string = "Exam Controller"): ExamMaster {
    const nextId = this.exams.length > 0 ? Math.max(...this.exams.map((e) => e.id)) + 1 : 1;
    const year = data.academicYear || 2026;
    const termCode = (data.term || "EXAM").substring(0, 3).toUpperCase();
    const code = data.code || `EXAM-${year}-${termCode}-${String(nextId).padStart(2, "0")}`;

    const newExam: ExamMaster = {
      id: nextId,
      code,
      name: data.name || `Examination ${year}`,
      nameBangla: data.nameBangla || `মূল্যায়ন পরীক্ষা ${year}`,
      academicYear: year,
      term: data.term || "Half-Yearly",
      category: data.category || "term",
      assessmentType: data.assessmentType || "Half-Yearly",
      targetClassIds: data.targetClassIds && data.targetClassIds.length > 0 ? data.targetClassIds : [1, 2, 3, 4],
      targetTradeIds: data.targetTradeIds || [],
      targetSections: data.targetSections && data.targetSections.length > 0 ? data.targetSections : ["A", "B"],
      startDate: data.startDate || new Date().toISOString().split("T")[0],
      endDate: data.endDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      marksSubmissionDeadline: data.marksSubmissionDeadline || new Date(Date.now() + 20 * 86400000).toISOString().split("T")[0],
      status: data.status || "Draft",
      gradingStandard: data.gradingStandard || "BTEB",
      allowTeacherMarksEntry: data.allowTeacherMarksEntry ?? true,
      isLocked: false,
      description: data.description || "",
      instructions: data.instructions || "",
      subjects: data.subjects || buildInitialSubjectConfigs(nextId, data.targetClassIds || [1, 4], data.category || "term"),
      createdBy: operator,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.exams.unshift(newExam);

    // Sync with institutionalDb.exams
    institutionalDb.exams.push({
      id: newExam.id,
      name: newExam.name,
      nameBangla: newExam.nameBangla,
      academicYear: newExam.academicYear,
      term: newExam.term as any,
      status: (newExam.status === "Published" || newExam.status === "Ongoing" || newExam.status === "Locked"
        ? newExam.status
        : "Draft") as any,
      startDate: newExam.startDate,
      endDate: newExam.endDate,
    });

    // Audit log
    this.addAuditLog({
      examId: newExam.id,
      examName: newExam.nameBangla,
      action: "CREATE_EXAM",
      changedBy: operator,
      reason: `নতুন পরীক্ষা তৈরি করা হয়েছে (${newExam.code})`,
      newValues: { code: newExam.code, name: newExam.name, status: newExam.status },
    });

    return newExam;
  }

  public updateExam(id: number, updates: Partial<ExamMaster>, operator: string = "Admin"): ExamMaster {
    const exam = this.getExamById(id);
    if (!exam) throw new Error(`Exam with ID ${id} not found.`);

    if (exam.isLocked && updates.status !== "Draft" && updates.status !== "MarksEntry" && !updates.isLocked) {
      throw new Error("পরীক্ষাটি বর্তমানে লককৃত। কোনো তথ্য পরিবর্তনের আগে এটি আনলক করতে হবে।");
    }

    const prevValues: Record<string, any> = { ...exam };

    Object.assign(exam, updates, {
      updatedAt: new Date().toISOString(),
    });

    // Keep institutionalDb sync
    const dbIndex = institutionalDb.exams.findIndex((e) => e.id === id);
    if (dbIndex !== -1) {
      institutionalDb.exams[dbIndex].name = exam.name;
      institutionalDb.exams[dbIndex].nameBangla = exam.nameBangla;
      institutionalDb.exams[dbIndex].startDate = exam.startDate;
      institutionalDb.exams[dbIndex].endDate = exam.endDate;
      institutionalDb.exams[dbIndex].status = (exam.status === "Published" || exam.status === "Ongoing" || exam.status === "Locked"
        ? exam.status
        : "Draft") as any;
    }

    this.addAuditLog({
      examId: exam.id,
      examName: exam.nameBangla,
      action: "UPDATE_EXAM",
      changedBy: operator,
      reason: "পরীক্ষার সাধারণ তথ্য বা বিষয় রূপরেখা পরিবর্তন করা হয়েছে।",
      previousValues: { name: prevValues.name, status: prevValues.status },
      newValues: { name: exam.name, status: exam.status },
    });

    return exam;
  }

  // --- STATE TRANSITION MACHINE ---
  public transitionStatus(
    id: number,
    newStatus: ExamStatus,
    operator: string,
    reason: string = "স্ট্যাটাস পরিবর্তন"
  ): ExamMaster {
    const exam = this.getExamById(id);
    if (!exam) throw new Error(`Exam ${id} not found.`);

    const oldStatus = exam.status;
    if (oldStatus === newStatus) return exam;

    // Enforce business state rules
    if (oldStatus === "Locked" && newStatus !== "MarksEntry" && newStatus !== "UnderReview") {
      throw new Error("লককৃত পরীক্ষার অবস্থা সরাসরি পরিবর্তন সম্ভব নয়। প্রথমে কারণ দর্শিয়ে আনলক করুন।");
    }

    exam.status = newStatus;
    exam.updatedAt = new Date().toISOString();

    if (newStatus === "Locked") {
      exam.isLocked = true;
      exam.lockedAt = new Date().toISOString();
      exam.lockedBy = operator;
    } else if (oldStatus === "Locked") {
      exam.isLocked = false;
      exam.lockedAt = undefined;
      exam.lockedBy = undefined;
    }

    // Sync institutionalDb
    const dbExam = institutionalDb.exams.find((e) => e.id === id);
    if (dbExam) {
      if (newStatus === "Locked") dbExam.status = "Locked";
      else if (newStatus === "Published" || newStatus === "Ongoing") dbExam.status = newStatus as any;
    }

    this.addAuditLog({
      examId: exam.id,
      examName: exam.nameBangla,
      action: newStatus === "Locked" ? "LOCK_EXAM" : oldStatus === "Locked" ? "UNLOCK_EXAM" : "UPDATE_STATUS",
      changedBy: operator,
      reason,
      previousValues: { status: oldStatus, isLocked: oldStatus === "Locked" },
      newValues: { status: newStatus, isLocked: exam.isLocked },
    });

    return exam;
  }

  // --- MARKS EVALUATION LOGIC ---
  public calculateStudentMark(
    input: {
      attendanceStatus: StudentExamAttendanceStatus;
      theoryMarks?: number | null;
      practicalMarks?: number | null;
      vivaMarks?: number | null;
      continuousMarks?: number | null;
    },
    rule: ExamComponentRule
  ): {
    totalMarks: number;
    grade: string;
    gradePoint: number;
    isPassed: boolean;
    failReasons: string[];
  } {
    const failReasons: string[] = [];

    // Absent / Expelled / Medical cases
    if (input.attendanceStatus === "Absent") {
      return { totalMarks: 0, grade: "F", gradePoint: 0.0, isPassed: false, failReasons: ["অনুপস্থিত (Absent)"] };
    }
    if (input.attendanceStatus === "Expelled") {
      return { totalMarks: 0, grade: "F", gradePoint: 0.0, isPassed: false, failReasons: ["বহিষ্কৃত (Expelled)"] };
    }
    if (input.attendanceStatus === "Medical") {
      return { totalMarks: 0, grade: "I", gradePoint: 0.0, isPassed: false, failReasons: ["মেডিকেল ছুটি (Incomplete)"] };
    }

    const theory = Number(input.theoryMarks || 0);
    const practical = Number(input.practicalMarks || 0);
    const viva = Number(input.vivaMarks || 0);
    const continuous = Number(input.continuousMarks || 0);

    const totalMarks = Math.round((theory + practical + viva + continuous) * 10) / 10;
    const percentage = rule.fullMarks > 0 ? (totalMarks / rule.fullMarks) * 100 : 0;

    // Component-wise pass checks (BTEB requirement)
    if (rule.requireSeparatePass) {
      if (rule.hasTheory && theory < rule.theoryPass) {
        failReasons.push(`তাত্ত্বিক অংশে অনুত্তীর্ণ (নম্বর: ${theory}, পাস: ${rule.theoryPass})`);
      }
      if (rule.hasPractical && practical < rule.practicalPass) {
        failReasons.push(`ব্যবহারিক অংশে অনুত্তীর্ণ (নম্বর: ${practical}, পাস: ${rule.practicalPass})`);
      }
      if (rule.hasViva && viva < rule.vivaPass) {
        failReasons.push(`মৌখিক/ভাইভায় অনুত্তীর্ণ (নম্বর: ${viva}, পাস: ${rule.vivaPass})`);
      }
      if (rule.hasContinuous && continuous < rule.continuousPass) {
        failReasons.push(`ধারাবাহিক মূল্যায়নে অনুত্তীর্ণ (নম্বর: ${continuous}, পাস: ${rule.continuousPass})`);
      }
    }

    if (totalMarks < rule.passMarks) {
      failReasons.push(`মোট প্রাপ্ত নম্বর পাঁচ নম্বরের নিচে (${totalMarks}/${rule.passMarks})`);
    }

    const isPassed = failReasons.length === 0;

    // BTEB Grade computation
    let grade = "F";
    let gradePoint = 0.0;

    if (!isPassed) {
      grade = "F";
      gradePoint = 0.0;
    } else {
      if (percentage >= 80) {
        grade = "A+";
        gradePoint = 5.0;
      } else if (percentage >= 70) {
        grade = "A";
        gradePoint = 4.0;
      } else if (percentage >= 60) {
        grade = "A-";
        gradePoint = 3.5;
      } else if (percentage >= 50) {
        grade = "B";
        gradePoint = 3.0;
      } else if (percentage >= 40) {
        grade = "C";
        gradePoint = 2.0;
      } else if (percentage >= 33) {
        grade = "D";
        gradePoint = 1.0;
      } else {
        grade = "F";
        gradePoint = 0.0;
      }
    }

    return { totalMarks, grade, gradePoint, isPassed, failReasons };
  }

  // --- QUERY MARKS WORKSPACE ---
  public getMarksWorkspaceData(
    examId: number,
    classId: number,
    tradeId?: number,
    section: string = "all",
    subjectCode?: string
  ): {
    exam: ExamMaster;
    subjectConfig: ExamSubjectConfig;
    students: ExamMarkStudentEntry[];
    isLocked: boolean;
  } {
    const exam = this.getExamById(examId);
    if (!exam) throw new Error(`Exam ${examId} not found.`);

    // Find subject config
    let subjectConfig = exam.subjects.find(
      (s) =>
        s.classId === classId &&
        (subjectCode ? s.subjectCode.toLowerCase() === subjectCode.toLowerCase() : true) &&
        (tradeId && tradeId !== 0 ? s.tradeId === tradeId : true)
    );

    if (!subjectConfig && exam.subjects.length > 0) {
      subjectConfig = exam.subjects.find((s) => s.classId === classId) || exam.subjects[0];
    }

    if (!subjectConfig) {
      // Build on-the-fly config if missing
      const cls = ACADEMIC_CLASSES.find((c) => c.id === classId);
      subjectConfig = {
        id: `${examId}_${classId}_${tradeId || 0}_${subjectCode || "SUB"}`,
        examId,
        classId,
        className: cls?.name || "Class",
        subjectCode: subjectCode || "101",
        subjectName: "General Subject",
        subjectNameBangla: "সাধারণ বিষয়",
        componentRule: {
          hasTheory: true,
          theoryMax: 60,
          theoryPass: 20,
          hasPractical: false,
          practicalMax: 0,
          practicalPass: 0,
          hasViva: false,
          vivaMax: 0,
          vivaPass: 0,
          hasContinuous: true,
          continuousMax: 40,
          continuousPass: 13,
          fullMarks: 100,
          passMarks: 33,
          requireSeparatePass: true,
        },
      };
    }

    // Filter Students
    let eligibleStudents = institutionalDb.students.filter((s) => s.classId === classId);

    if (section && section !== "all") {
      eligibleStudents = eligibleStudents.filter((s) => s.section === section);
    }

    const clsObj = ACADEMIC_CLASSES.find((c) => c.id === classId);
    const hasTrade = clsObj ? doesClassHaveTrade(clsObj.numericValue) : false;

    if (hasTrade && tradeId && tradeId !== 0) {
      const targetTrade = ALL_TRADES.find((t) => t.id === tradeId);
      eligibleStudents = eligibleStudents.filter((s) =>
        doesStudentMatchTrade(s.tradeId, s.tradeName, targetTrade?.code || String(tradeId))
      );
    }

    // Sort by Roll
    eligibleStudents.sort((a, b) => a.roll - b.roll);

    // Map to student entries with existing marks from institutionalDb.marks
    const studentEntries: ExamMarkStudentEntry[] = eligibleStudents.map((stu) => {
      const existing = institutionalDb.marks.find(
        (m) =>
          m.studentId === stu.id &&
          (m.examId === examId || m.examName?.includes(exam.nameBangla) || m.examName?.includes(exam.name)) &&
          m.subjectCode.toLowerCase() === subjectConfig!.subjectCode.toLowerCase()
      );

      if (existing) {
        const evalRes = this.calculateStudentMark(
          {
            attendanceStatus: (existing.status === "Failed" && existing.totalMarks === 0 ? "Absent" : "Present") as any,
            theoryMarks: existing.theoryMarks,
            practicalMarks: existing.practicalMarks,
            vivaMarks: existing.viva,
            continuousMarks: existing.continuousAssessment,
          },
          subjectConfig!.componentRule
        );

        return {
          studentId: stu.id,
          roll: stu.roll,
          name: stu.name,
          nameBangla: stu.nameBangla || stu.name,
          studentCode: stu.studentId,
          gender: stu.gender,
          section: stu.section,
          tradeCode: stu.tradeName ? (ALL_TRADES.find((t) => stu.tradeName?.includes(t.name))?.code) : undefined,
          attendanceStatus: "Present",
          theoryMarks: existing.theoryMarks ?? null,
          practicalMarks: existing.practicalMarks ?? null,
          vivaMarks: existing.viva ?? null,
          continuousMarks: existing.continuousAssessment ?? null,
          totalMarks: existing.totalMarks,
          grade: existing.grade,
          gradePoint: existing.gradePoint,
          isPassed: existing.status === "Passed",
          componentFailReasons: evalRes.failReasons,
          status: (existing.publicationStatus === "Published" || existing.isLocked ? "Locked" : "Submitted") as any,
          updatedAt: new Date().toISOString(),
        };
      }

      // Default blank row
      return {
        studentId: stu.id,
        roll: stu.roll,
        name: stu.name,
        nameBangla: stu.nameBangla || stu.name,
        studentCode: stu.studentId,
        gender: stu.gender,
        section: stu.section,
        attendanceStatus: "Present",
        theoryMarks: null,
        practicalMarks: null,
        vivaMarks: null,
        continuousMarks: null,
        totalMarks: 0,
        grade: "—",
        gradePoint: 0.0,
        isPassed: false,
        status: "Draft",
        updatedAt: new Date().toISOString(),
      };
    });

    return {
      exam,
      subjectConfig,
      students: studentEntries,
      isLocked: exam.isLocked || subjectConfig.isLocked || false,
    };
  }

  // --- BULK SAVE MARKS ---
  public saveMarks(
    examId: number,
    classId: number,
    tradeId: number | undefined,
    section: string,
    subjectCode: string,
    entries: {
      studentId: number;
      attendanceStatus: StudentExamAttendanceStatus;
      theoryMarks?: number | null;
      practicalMarks?: number | null;
      vivaMarks?: number | null;
      continuousMarks?: number | null;
      remarks?: string;
    }[],
    operator: string = "Teacher",
    isFinalSubmit: boolean = false,
    reason: string = "নম্বর হালনাগাদ"
  ): { savedCount: number; exam: ExamMaster } {
    const exam = this.getExamById(examId);
    if (!exam) throw new Error(`Exam ${examId} not found.`);

    if (exam.isLocked) {
      throw new Error("পরীক্ষাটি বর্তমানে লককৃত। কোনো নম্বর সংরক্ষণ করা যাবে না।");
    }

    const subjectConfig = exam.subjects.find(
      (s) =>
        s.classId === classId &&
        s.subjectCode.toLowerCase() === subjectCode.toLowerCase() &&
        (tradeId && tradeId !== 0 ? s.tradeId === tradeId : true)
    );

    const rule: ExamComponentRule = subjectConfig?.componentRule || {
      hasTheory: true,
      theoryMax: 60,
      theoryPass: 20,
      hasPractical: false,
      practicalMax: 0,
      practicalPass: 0,
      hasViva: false,
      vivaMax: 0,
      vivaPass: 0,
      hasContinuous: true,
      continuousMax: 40,
      continuousPass: 13,
      fullMarks: 100,
      passMarks: 33,
      requireSeparatePass: true,
    };

    let savedCount = 0;

    entries.forEach((entry) => {
      const student = institutionalDb.students.find((s) => s.id === entry.studentId);
      if (!student) return;

      const evalRes = this.calculateStudentMark(entry, rule);

      const existingIndex = institutionalDb.marks.findIndex(
        (m) =>
          m.studentId === student.id &&
          (m.examId === examId || m.examName?.includes(exam.nameBangla)) &&
          m.subjectCode.toLowerCase() === subjectCode.toLowerCase()
      );

      const markRecord: ExamMark = {
        id: existingIndex !== -1 ? institutionalDb.marks[existingIndex].id : Date.now() + Math.floor(Math.random() * 10000),
        studentId: student.id,
        studentCode: student.studentId,
        studentName: student.name,
        roll: student.roll,
        academicYear: exam.academicYear,
        examName: exam.nameBangla,
        examId: exam.id,
        classId: student.classId,
        tradeId: student.tradeId,
        tradeCode: student.tradeName ? ALL_TRADES.find((t) => student.tradeName?.includes(t.name))?.code : undefined,
        section: student.section,
        subjectCode: subjectConfig?.subjectCode || subjectCode,
        subjectName: subjectConfig?.subjectName || subjectCode,
        subjectNameBangla: subjectConfig?.subjectNameBangla || subjectCode,
        theoryMarks: Number(entry.theoryMarks || 0),
        practicalMarks: Number(entry.practicalMarks || 0),
        viva: Number(entry.vivaMarks || 0),
        continuousAssessment: Number(entry.continuousMarks || 0),
        ctAvg: Math.round((Number(entry.continuousMarks || 0) / 2) * 10) / 10,
        quizAvg: Math.round((Number(entry.continuousMarks || 0) / 4) * 10) / 10,
        practicalAvg: Number(entry.practicalMarks || 0),
        finalMarks: Number(entry.theoryMarks || 0) + Number(entry.practicalMarks || 0),
        totalMarks: evalRes.totalMarks,
        maxMarks: rule.fullMarks,
        passMarks: rule.passMarks,
        grade: evalRes.grade,
        gradePoint: evalRes.gradePoint,
        status: evalRes.isPassed ? "Passed" : "Failed",
        publicationStatus: isFinalSubmit ? "Published" : "Draft",
        isLocked: isFinalSubmit,
        lockedAt: isFinalSubmit ? new Date().toISOString() : undefined,
        lockedBy: isFinalSubmit ? operator : undefined,
      };

      if (existingIndex !== -1) {
        institutionalDb.marks[existingIndex] = markRecord;
      } else {
        institutionalDb.marks.push(markRecord);
      }

      savedCount++;
    });

    if (subjectConfig) {
      subjectConfig.enteredCount = entries.length;
      if (isFinalSubmit) {
        subjectConfig.isMarksSubmitted = true;
        subjectConfig.submittedAt = new Date().toISOString();
        subjectConfig.submittedBy = operator;
      }
    }

    exam.updatedAt = new Date().toISOString();

    // Log Audit
    this.addAuditLog({
      examId: exam.id,
      examName: exam.nameBangla,
      subjectCode,
      subjectName: subjectConfig?.subjectName || subjectCode,
      action: isFinalSubmit ? "BULK_MARKS_SUBMIT" : "ENTER_MARKS",
      changedBy: operator,
      reason: isFinalSubmit ? "চূড়ান্ত মূল্যায়ন ও লক সাবমিশন সম্পন্ন" : reason,
      newValues: { studentCount: entries.length, isFinalSubmit },
    });

    return { savedCount, exam };
  }

  // --- TIMETABLE & ROUTINE SYNC ---
  public getExamSchedules(examId: number): ExamRoutineItem[] {
    const exam = this.getExamById(examId);
    if (!exam) return [];

    return institutionalDb.examRoutines.filter(
      (r) => r.examName.includes(exam.nameBangla) || r.examName.includes(exam.name)
    );
  }

  public addExamScheduleItem(examId: number, item: Omit<ExamRoutineItem, "id">, operator: string): ExamRoutineItem {
    const exam = this.getExamById(examId);
    if (!exam) throw new Error(`Exam ${examId} not found.`);

    const newItem: ExamRoutineItem = {
      id: Date.now(),
      examName: exam.nameBangla,
      date: item.date,
      day: item.day,
      time: item.time,
      classLevel: item.classLevel,
      tradeName: item.tradeName || "All Trades",
      subjectCode: item.subjectCode,
      subjectName: item.subjectName,
      roomNo: item.roomNo || "Room 101",
    };

    institutionalDb.examRoutines.push(newItem);

    this.addAuditLog({
      examId: exam.id,
      examName: exam.nameBangla,
      action: "SCHEDULE_UPDATE",
      changedBy: operator,
      reason: `নতুন পরীক্ষার সময়সূচি যুক্ত করা হয়েছে (${newItem.subjectName}, তারিখ: ${newItem.date})`,
      newValues: newItem,
    });

    return newItem;
  }

  // --- AUDIT LOGS ---
  public addAuditLog(log: Omit<ExamAuditLog, "id" | "timestamp">) {
    const newLog: ExamAuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
  }

  public getAuditLogs(filters?: { examId?: number; action?: string; search?: string }): ExamAuditLog[] {
    let list = [...this.auditLogs];
    if (filters?.examId) list = list.filter((l) => l.examId === filters.examId);
    if (filters?.action) list = list.filter((l) => l.action === filters.action);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.examName.toLowerCase().includes(q) ||
          l.changedBy.toLowerCase().includes(q) ||
          l.reason.toLowerCase().includes(q) ||
          (l.studentName && l.studentName.toLowerCase().includes(q))
      );
    }
    return list;
  }

  // --- OVERALL METRICS ---
  public getMetrics(academicYear: number = 2026) {
    const exams = this.exams.filter((e) => e.academicYear === academicYear);
    const totalExams = exams.length;
    const ongoing = exams.filter((e) => e.status === "Ongoing" || e.status === "MarksEntry").length;
    const completed = exams.filter((e) => e.status === "Completed" || e.status === "Locked").length;
    const locked = exams.filter((e) => e.isLocked).length;

    const totalSubjects = exams.reduce((acc, e) => acc + (e.subjects?.length || 0), 0);
    const submittedSubjects = exams.reduce(
      (acc, e) => acc + (e.subjects?.filter((s) => s.isMarksSubmitted).length || 0),
      0
    );

    const completionRate = totalSubjects > 0 ? Math.round((submittedSubjects / totalSubjects) * 100) : 0;

    return {
      academicYear,
      totalExams,
      ongoing,
      completed,
      locked,
      totalSubjects,
      submittedSubjects,
      completionRate,
    };
  }
}

export const examinationEngine = new ExaminationEngine();
