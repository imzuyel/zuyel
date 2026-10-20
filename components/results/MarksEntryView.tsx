"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Save,
  Search,
  Filter,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Clock,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Info,
  Edit3,
  Calendar,
  Printer,
  BookOpen,
  SlidersHorizontal,
} from "lucide-react";
import { toBengaliNumerals, toBanglaDateString } from "@/lib/utils";
import {
  ACADEMIC_CLASSES,
  BTEB_ACADEMIC_TRADES,
  doesClassHaveTrade,
  getSubjectsForClass,
  parseClassNumeric,
  doesStudentMatchTrade,
  SubjectItem,
} from "@/lib/academicStructure";
import {
  calculateSubjectTotalAndGrade,
  calculateBtebContinuousBreakdown,
} from "@/lib/resultCalculation";
import AcademicTranscriptModal from "./AcademicTranscriptModal";
import BtebAssessmentDatesModal, { BtebAssessmentDatesConfig } from "./BtebAssessmentDatesModal";
import BtebRegisterPrintSheet from "./BtebRegisterPrintSheet";
import { getSingleSourceSubjects } from "@/lib/globalSubjectMappingHub";

export interface StudentRowState {
  studentId: number;
  studentCode: string;
  name: string;
  nameBangla: string;
  roll: number;
  classId: number;
  tradeId?: number;
  tradeName?: string;
  section: string;

  // Attendance
  totalAttendance?: number | string;

  // Theory Continuous Assessment (TC) - ছবির কলামসমূহ
  quizzes: (number | string)[]; // [Q1, Q2, Q3, Q4]
  quizTotal: number;
  classTests: (number | string)[]; // [CT1, CT2, CT3, CT4]
  classTestTotal: number;
  tcAttendanceConduct: number | string; // হাজিরা ও আচরণ
  midtermTheory: number | string; // বর্ষমধ্য পরীক্ষা (Mid-term Exam)
  assignment: number | string; // অ্যাসাইনমেন্ট
  tcTotal: number; // তাত্ত্বিক ধারাবাহিক মোট

  // Practical Continuous Assessment (PC) - ছবির কলামসমূহ
  jobs: (number | string)[]; // [Job 1 to 8]
  jobsTotal: number;
  midtermPractical: number | string; // বর্ষমধ্য পরীক্ষা (ব্যবহারিক)
  report: number | string; // রিপোর্ট
  viva: number | string; // মৌখিক
  pcAttendanceConduct: number | string; // হাজিরা ও আচরণ
  pcTotal: number; // ব্যবহারিক ধারাবাহিক মোট

  // Final and Summary Scores
  theoryMarks: number | string;
  practicalMarks: number | string;
  continuousAssessment: number | string; // TC + PC
  totalMarks: number;
  grade: string;
  gradePoint: number;
  status: "Passed" | "Failed";
  isLocked?: boolean;
  publicationStatus?: string;
  existingMarkId?: number;
  auditHistory?: any[];
}

export default function MarksEntryView() {
  // Filter States
  const [academicYear, setAcademicYear] = useState<number>(2026);
  const [examName, setExamName] = useState<string>("অর্ধবার্ষিক মূল্যায়ন ২০২৬");
  const [selectedClassId, setSelectedClassId] = useState<number>(4); // Default Class 9
  const [selectedTradeId, setSelectedTradeId] = useState<string>("2"); // Default IT-IOT or "all"
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>("IT-901");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // View Mode: 'register' (BTEB continuous evaluation register matching photo) or 'summary'
  const [viewMode, setViewMode] = useState<"register" | "summary">("register");

  // Assessment Dates State (with default BTEB routine dates)
  const [assessmentDates, setAssessmentDates] = useState<BtebAssessmentDatesConfig>({
    quizDates: ["2026-02-15", "2026-03-10", "2026-04-15", "2026-05-10"],
    classTestDates: ["2026-02-28", "2026-03-25", "2026-04-30", "2026-05-25"],
    tcMidtermDate: "2026-06-15",
    assignmentDate: "2026-06-05",
    jobDates: [
      "2026-01-25",
      "2026-02-08",
      "2026-02-22",
      "2026-03-08",
      "2026-03-22",
      "2026-04-05",
      "2026-04-19",
      "2026-05-03",
    ],
    pcMidtermDate: "2026-06-20",
    reportDate: "2026-06-22",
    vivaDate: "2026-06-24",
  });

  const [datesModalOpen, setDatesModalOpen] = useState<boolean>(false);
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false);

  // Data States
  const [students, setStudents] = useState<any[]>([]);
  const [examsList, setExamsList] = useState<any[]>([]);
  const [marksState, setMarksState] = useState<{ [studentId: number]: StudentRowState }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Correction Modal State
  const [correctionTarget, setCorrectionTarget] = useState<StudentRowState | null>(null);
  const [correctionReason, setCorrectionReason] = useState<string>("");
  const [correcting, setCorrecting] = useState<boolean>(false);

  // Transcript Modal State
  const [transcriptStudent, setTranscriptStudent] = useState<any | null>(null);
  const [transcriptMarks, setTranscriptMarks] = useState<any[]>([]);

  // Numeric Class and Trade Applicability (Strict Academic Structure Rule)
  const numericClass = useMemo(() => parseClassNumeric(selectedClassId), [selectedClassId]);
  const isTradeApplicable = useMemo(() => doesClassHaveTrade(numericClass), [numericClass]);

  // Dynamic Subjects List for Class and Trade (Synced with Global Subject Mapping Hub)
  const availableSubjects = useMemo(() => {
    const tradeForFilter = isTradeApplicable && selectedTradeId !== "all" ? selectedTradeId : undefined;
    const globalMapped = getSingleSourceSubjects({
      classVal: selectedClassId,
      tradeVal: tradeForFilter,
      academicYear: String(academicYear),
    });

    if (globalMapped.length > 0) {
      return globalMapped.map((s) => ({
        id: typeof s.id === "number" ? s.id : parseInt(String(s.id), 10) || 100,
        code: s.code,
        name: s.name,
        nameBangla: s.nameBangla || s.name,
        applicableClasses: [numericClass],
        tradeId: s.tradeId,
        tradeCode: s.tradeCode,
        isCommon: s.isCommon,
        type: (s.type || (s.isCommon ? "General" : "Trade")) as any,
        theoryMax: s.theoryMax || 60,
        practicalMax: s.practicalMax || 40,
        marks: s.marks || 100,
        passMarks: s.passMarks || 33,
      }));
    }
    return getSubjectsForClass(selectedClassId, tradeForFilter);
  }, [selectedClassId, isTradeApplicable, selectedTradeId, academicYear, numericClass]);

  // Active Subject Metadata
  const currentSubject = useMemo(() => {
    return availableSubjects.find((s) => s.code.toLowerCase() === selectedSubjectCode.toLowerCase()) || availableSubjects[0];
  }, [availableSubjects, selectedSubjectCode]);

  // Max and Pass Marks
  const theoryMax = currentSubject?.theoryMax ?? 60;
  const practicalMax = currentSubject?.practicalMax ?? 40;
  const totalMax = theoryMax + practicalMax;
  const passMarks = currentSubject?.passMarks ?? 33;

  // Unsaved changes browser guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Auto-switch subject when available subjects change
  useEffect(() => {
    if (availableSubjects.length > 0) {
      const exists = availableSubjects.some((s) => s.code.toLowerCase() === selectedSubjectCode.toLowerCase());
      if (!exists) {
        setSelectedSubjectCode(availableSubjects[0].code);
      }
    }
  }, [availableSubjects, selectedSubjectCode]);

  // Load Students and Existing Marks
  const loadData = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      // 1. Fetch Students
      const stuRes = await fetch(`/api/students?limit=200`);
      const stuData = await stuRes.json();
      const allStudents: any[] = stuData.success && stuData.students ? stuData.students : [];

      // 2. Filter students by class, trade, section
      let filtered = allStudents.filter((s) => s.classId === selectedClassId);

      if (selectedSection && selectedSection !== "all") {
        filtered = filtered.filter((s) => s.section === selectedSection);
      }

      if (isTradeApplicable && selectedTradeId && selectedTradeId !== "all") {
        filtered = filtered.filter((s) =>
          doesStudentMatchTrade(s.tradeId, s.tradeName, selectedTradeId)
        );
      }

      setStudents(filtered);

      // 3. Fetch Existing Marks for this class, exam, subject
      let marksUrl = `/api/marks?classId=${selectedClassId}&academicYear=${academicYear}&examName=${encodeURIComponent(
        examName
      )}`;
      if (selectedSubjectCode) {
        marksUrl += `&subjectCode=${encodeURIComponent(selectedSubjectCode)}`;
      }

      const marksRes = await fetch(marksUrl);
      const marksData = await marksRes.json();
      const existingMarks: any[] = marksData.success && marksData.marks ? marksData.marks : [];

      if (marksData.exams && Array.isArray(marksData.exams)) {
        setExamsList(marksData.exams);
      }

      // Check if dates are stored in any record
      const recordWithDates = existingMarks.find((m) => m.assessmentDates);
      if (recordWithDates && recordWithDates.assessmentDates) {
        setAssessmentDates((prev) => ({
          ...prev,
          ...recordWithDates.assessmentDates,
        }));
      }

      // Build State Dictionary
      const rowStateMap: { [studentId: number]: StudentRowState } = {};

      filtered.forEach((stu) => {
        const existing = existingMarks.find(
          (m) =>
            m.studentId === stu.id &&
            m.subjectCode.toLowerCase() === (currentSubject?.code || selectedSubjectCode).toLowerCase()
        );

        if (existing) {
          // Normalize quizzes, classTests, jobs arrays
          const quizzes = Array.isArray(existing.quizzes)
            ? [
                existing.quizzes[0] ?? "",
                existing.quizzes[1] ?? "",
                existing.quizzes[2] ?? "",
                existing.quizzes[3] ?? "",
              ]
            : ["", "", "", ""];

          const classTests = Array.isArray(existing.classTests)
            ? [
                existing.classTests[0] ?? "",
                existing.classTests[1] ?? "",
                existing.classTests[2] ?? "",
                existing.classTests[3] ?? "",
              ]
            : ["", "", "", ""];

          const jobs = Array.isArray(existing.jobs)
            ? [
                existing.jobs[0] ?? "",
                existing.jobs[1] ?? "",
                existing.jobs[2] ?? "",
                existing.jobs[3] ?? "",
                existing.jobs[4] ?? "",
                existing.jobs[5] ?? "",
                existing.jobs[6] ?? "",
                existing.jobs[7] ?? "",
              ]
            : ["", "", "", "", "", "", "", ""];

          const tcMidterm = existing.midtermTheory ?? "";
          const assignment = existing.assignment ?? "";
          const tcAtt = existing.tcAttendanceConduct ?? "";
          const pcMidterm = existing.midtermPractical ?? "";
          const report = existing.report ?? "";
          const viva = existing.viva ?? "";
          const pcAtt = existing.pcAttendanceConduct ?? "";
          const totAtt = existing.totalAttendance ?? "";

          // Calculate breakdown
          const breakdown = calculateBtebContinuousBreakdown({
            quizzes,
            classTests,
            midtermTheory: tcMidterm,
            assignment,
            tcAttendanceConduct: tcAtt,
            jobs,
            midtermPractical: pcMidterm,
            report,
            viva,
            pcAttendanceConduct: pcAtt,
            totalAttendance: totAtt,
          });

          rowStateMap[stu.id] = {
            studentId: stu.id,
            studentCode: stu.studentId,
            name: stu.name,
            nameBangla: stu.nameBangla || stu.name,
            roll: stu.roll,
            classId: stu.classId,
            tradeId: stu.tradeId,
            tradeName: stu.tradeName || "",
            section: stu.section || "A",

            totalAttendance: totAtt,
            quizzes,
            quizTotal: breakdown.quizTotal,
            classTests,
            classTestTotal: breakdown.classTestTotal,
            tcAttendanceConduct: tcAtt,
            midtermTheory: tcMidterm,
            assignment,
            tcTotal: breakdown.tcTotal,

            jobs,
            jobsTotal: breakdown.jobsTotal,
            midtermPractical: pcMidterm,
            report,
            viva,
            pcAttendanceConduct: pcAtt,
            pcTotal: breakdown.pcTotal,

            theoryMarks: existing.theoryMarks ?? "",
            practicalMarks: existing.practicalMarks ?? (existing.finalMarks ?? ""),
            continuousAssessment:
              existing.continuousAssessment !== undefined && existing.continuousAssessment !== ""
                ? existing.continuousAssessment
                : breakdown.totalContinuous,
            totalMarks: existing.totalMarks ?? 0,
            grade: existing.grade || "F",
            gradePoint: existing.gradePoint ?? 0,
            status: existing.status || (existing.grade === "F" ? "Failed" : "Passed"),
            isLocked: Boolean(existing.isLocked),
            publicationStatus: existing.publicationStatus || "Draft",
            existingMarkId: existing.id,
            auditHistory: existing.auditHistory || [],
          };
        } else {
          rowStateMap[stu.id] = {
            studentId: stu.id,
            studentCode: stu.studentId,
            name: stu.name,
            nameBangla: stu.nameBangla || stu.name,
            roll: stu.roll,
            classId: stu.classId,
            tradeId: stu.tradeId,
            tradeName: stu.tradeName || "",
            section: stu.section || "A",

            totalAttendance: "",
            quizzes: ["", "", "", ""],
            quizTotal: 0,
            classTests: ["", "", "", ""],
            classTestTotal: 0,
            tcAttendanceConduct: "",
            midtermTheory: "",
            assignment: "",
            tcTotal: 0,

            jobs: ["", "", "", "", "", "", "", ""],
            jobsTotal: 0,
            midtermPractical: "",
            report: "",
            viva: "",
            pcAttendanceConduct: "",
            pcTotal: 0,

            theoryMarks: "",
            practicalMarks: "",
            continuousAssessment: "",
            totalMarks: 0,
            grade: "F",
            gradePoint: 0,
            status: "Failed",
            isLocked: false,
            publicationStatus: "Draft",
          };
        }
      });

      setMarksState(rowStateMap);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      setFeedback({ type: "error", message: `তথ্য লোড করতে সমস্যা হয়েছে: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [
    selectedClassId,
    selectedSection,
    isTradeApplicable,
    selectedTradeId,
    academicYear,
    examName,
    selectedSubjectCode,
    currentSubject,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate row according to BTEB Continuous Assessment & Grading Act
  const recalculateRowWithBteb = (row: StudentRowState): StudentRowState => {
    const breakdown = calculateBtebContinuousBreakdown({
      quizzes: row.quizzes,
      classTests: row.classTests,
      midtermTheory: row.midtermTheory,
      assignment: row.assignment,
      tcAttendanceConduct: row.tcAttendanceConduct,
      jobs: row.jobs,
      midtermPractical: row.midtermPractical,
      report: row.report,
      viva: row.viva,
      pcAttendanceConduct: row.pcAttendanceConduct,
      totalAttendance: row.totalAttendance,
    });

    const continuousAssessment = breakdown.totalContinuous;
    const th = row.theoryMarks === "" ? 0 : Number(row.theoryMarks);
    const pr = row.practicalMarks === "" ? 0 : Number(row.practicalMarks);

    const calc = calculateSubjectTotalAndGrade({
      theoryMarks: th,
      practicalMarks: pr,
      continuousAssessment,
      maxMarks: totalMax,
      passMarks,
    });

    return {
      ...row,
      quizTotal: breakdown.quizTotal,
      classTestTotal: breakdown.classTestTotal,
      tcTotal: breakdown.tcTotal,
      jobsTotal: breakdown.jobsTotal,
      pcTotal: breakdown.pcTotal,
      continuousAssessment,
      totalMarks: calc.totalMarks,
      grade: calc.grade,
      gradePoint: calc.gradePoint,
      status: calc.status,
    };
  };

  // Handle Array Continuous Field Change (quizzes, classTests, jobs)
  const handleDetailedContinuousChange = (
    studentId: number,
    category: "quizzes" | "classTests" | "jobs",
    index: number,
    value: string
  ) => {
    setMarksState((prev) => {
      const current = prev[studentId];
      if (!current || current.isLocked) return prev;

      const arr = [...current[category]];
      arr[index] = value === "" ? "" : Number(value);

      const updatedRow = recalculateRowWithBteb({
        ...current,
        [category]: arr,
      });

      return { ...prev, [studentId]: updatedRow };
    });
    setHasUnsavedChanges(true);
  };

  // Handle Single Continuous Field Change (midtermTheory, assignment, attendance, etc.)
  const handleSingleContinuousChange = (
    studentId: number,
    field:
      | "midtermTheory"
      | "assignment"
      | "tcAttendanceConduct"
      | "midtermPractical"
      | "report"
      | "viva"
      | "pcAttendanceConduct"
      | "totalAttendance",
    value: string
  ) => {
    setMarksState((prev) => {
      const current = prev[studentId];
      if (!current || current.isLocked) return prev;

      const numVal = value === "" ? "" : Number(value);
      const updatedRow = recalculateRowWithBteb({
        ...current,
        [field]: numVal,
      });

      return { ...prev, [studentId]: updatedRow };
    });
    setHasUnsavedChanges(true);
  };

  // Handle Summary Mark Input Change (theoryMarks, practicalMarks, continuousAssessment)
  const handleMarkChange = (
    studentId: number,
    field: "theoryMarks" | "practicalMarks" | "continuousAssessment",
    value: string
  ) => {
    setMarksState((prev) => {
      const current = prev[studentId];
      if (!current || current.isLocked) return prev;

      const numVal = value === "" ? "" : Number(value);
      const updatedRow = { ...current, [field]: numVal };

      const th = updatedRow.theoryMarks === "" ? 0 : Number(updatedRow.theoryMarks);
      const pr = updatedRow.practicalMarks === "" ? 0 : Number(updatedRow.practicalMarks);
      const ca = updatedRow.continuousAssessment === "" ? 0 : Number(updatedRow.continuousAssessment);

      const calc = calculateSubjectTotalAndGrade({
        theoryMarks: th,
        practicalMarks: pr,
        continuousAssessment: ca,
        maxMarks: totalMax,
        passMarks,
      });

      updatedRow.totalMarks = calc.totalMarks;
      updatedRow.grade = calc.grade;
      updatedRow.gradePoint = calc.gradePoint;
      updatedRow.status = calc.status;

      return {
        ...prev,
        [studentId]: updatedRow,
      };
    });
    setHasUnsavedChanges(true);
  };

  // Batch Save Marks
  const handleSaveMarks = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const rowsToSave = Object.values(marksState).filter(
        (r) =>
          r.theoryMarks !== "" ||
          r.practicalMarks !== "" ||
          r.continuousAssessment !== "" ||
          r.midtermTheory !== "" ||
          r.quizTotal > 0 ||
          r.classTestTotal > 0 ||
          r.jobsTotal > 0
      );

      if (rowsToSave.length === 0) {
        setFeedback({
          type: "info",
          message: "সংরক্ষণ করার মতো কোনো নম্বর প্রদান করা হয়নি। অনুগ্রহ করে নম্বর পূরণ করুন।",
        });
        setSaving(false);
        return;
      }

      const payload = {
        batch: true,
        academicYear,
        examName,
        classId: selectedClassId,
        subjectCode: currentSubject?.code || selectedSubjectCode,
        subjectName: currentSubject?.name || "Subject",
        subjectNameBangla: currentSubject?.nameBangla || currentSubject?.name || "বিষয়",
        maxMarks: totalMax,
        passMarks,
        assessmentDates,
        savedBy: "পরীক্ষক / শ্রেণি শিক্ষক (Teacher)",
        items: rowsToSave.map((r) => ({
          studentId: r.studentId,
          classId: r.classId,
          tradeId: r.tradeId,
          tradeCode: r.tradeName,
          section: r.section,
          subjectCode: currentSubject?.code || selectedSubjectCode,
          subjectName: currentSubject?.name,
          subjectNameBangla: currentSubject?.nameBangla,

          totalAttendance: r.totalAttendance,
          quizzes: r.quizzes.map((q) => (q === "" ? null : Number(q))),
          classTests: r.classTests.map((c) => (c === "" ? null : Number(c))),
          tcAttendanceConduct: r.tcAttendanceConduct === "" ? null : Number(r.tcAttendanceConduct),
          midtermTheory: r.midtermTheory === "" ? null : Number(r.midtermTheory),
          assignment: r.assignment === "" ? null : Number(r.assignment),

          jobs: r.jobs.map((j) => (j === "" ? null : Number(j))),
          midtermPractical: r.midtermPractical === "" ? null : Number(r.midtermPractical),
          report: r.report === "" ? null : Number(r.report),
          viva: r.viva === "" ? null : Number(r.viva),
          pcAttendanceConduct: r.pcAttendanceConduct === "" ? null : Number(r.pcAttendanceConduct),

          theoryMarks: r.theoryMarks === "" ? 0 : Number(r.theoryMarks),
          practicalMarks: r.practicalMarks === "" ? 0 : Number(r.practicalMarks),
          continuousAssessment: r.continuousAssessment === "" ? 0 : Number(r.continuousAssessment),
          maxMarks: totalMax,
          passMarks,
          assessmentDates,
        })),
      };

      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (resData.success) {
        setFeedback({
          type: "success",
          message: resData.message || `সফলভাবে ${resData.savedCount} জন শিক্ষার্থীর নম্বর সংরক্ষিত হয়েছে।`,
        });
        setHasUnsavedChanges(false);
        loadData();
      } else {
        setFeedback({
          type: "error",
          message: resData.error || "সংরক্ষণ সম্পন্ন করা যায়নি। ত্রুটি লক্ষ্য করুন।",
        });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: `সংরক্ষণে ত্রুটি হয়েছে: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  // Submit Authorized Correction for Locked Marks
  const handleCorrectionSubmit = async () => {
    if (!correctionTarget || !correctionReason.trim()) {
      alert("সংশোধনের সুনির্দিষ্ট কারণ উল্লেখ করা বাধ্যতামূলক।");
      return;
    }

    setCorrecting(true);
    try {
      const res = await fetch("/api/marks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markId: correctionTarget.existingMarkId,
          theoryMarks: Number(correctionTarget.theoryMarks || 0),
          practicalMarks: Number(correctionTarget.practicalMarks || 0),
          continuousAssessment: Number(correctionTarget.continuousAssessment || 0),
          reason: correctionReason.trim(),
          changedBy: "প্রধান পরীক্ষক / অ্যাডমিন",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          message: "নম্বর সফলভাবে সংশোধন করা হয়েছে এবং অডিট ট্রেইলে যুক্ত হয়েছে।",
        });
        setCorrectionTarget(null);
        setCorrectionReason("");
        loadData();
      } else {
        alert(data.error || "সংশোধন ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(`ত্রুটি: ${err.message}`);
    } finally {
      setCorrecting(false);
    }
  };

  // Open Transcript View for a Student
  const handleViewTranscript = async (stu: any) => {
    try {
      const res = await fetch(
        `/api/results?studentId=${stu.studentId}&classId=${stu.classId}&roll=${stu.roll}&examName=${encodeURIComponent(
          examName
        )}&academicYear=${academicYear}`
      );
      const data = await res.json();
      if (data.success && data.student) {
        setTranscriptStudent(data.student);
        setTranscriptMarks(data.marks || []);
      } else {
        setTranscriptStudent(stu);
        const marksForStu = Object.values(marksState).filter((m) => m.studentId === stu.studentId);
        setTranscriptMarks(marksForStu);
      }
    } catch {
      setTranscriptStudent(stu);
      setTranscriptMarks([]);
    }
  };

  // Auto-fill Pass Marks for Empty Rows
  const handleAutoFillPassMarks = () => {
    if (
      !confirm(
        "আপনি কি ফাঁকা সকল শিক্ষার্থীর জন্য BTEB মান অনুযায়ী ন্যূনতম পাস নম্বর ও ধারাবাহিক মূল্যায়ন স্বয়ংক্রিয়ভাবে বসাতে চান?"
      )
    ) {
      return;
    }

    setMarksState((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((idStr) => {
        const id = Number(idStr);
        const row = updated[id];
        if (!row.isLocked && row.theoryMarks === "" && row.midtermTheory === "") {
          const defaultQuizzes = [8, 7, 8, 9];
          const defaultCTs = [14, 15, 16, 15];
          const defaultMidterm = Math.round(theoryMax * 0.45);
          const defaultAssign = 8;
          const defaultTcAtt = 9;

          const defaultJobs = [8, 9, 8, 8, 9, 9, 8, 9];
          const defaultPrMid = Math.round(practicalMax * 0.5);
          const defaultReport = 9;
          const defaultViva = 8;
          const defaultPcAtt = 9;

          const baseRow: StudentRowState = {
            ...row,
            quizzes: defaultQuizzes,
            classTests: defaultCTs,
            midtermTheory: defaultMidterm,
            assignment: defaultAssign,
            tcAttendanceConduct: defaultTcAtt,
            jobs: defaultJobs,
            midtermPractical: defaultPrMid,
            report: defaultReport,
            viva: defaultViva,
            pcAttendanceConduct: defaultPcAtt,
            totalAttendance: 88,
            theoryMarks: Math.round(theoryMax * 0.45),
            practicalMarks: Math.round(practicalMax * 0.55),
          };

          updated[id] = recalculateRowWithBteb(baseRow);
        }
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Format short date for display in table headers
  const formatHeaderDate = (d?: string) => {
    if (!d) return null;
    try {
      const parts = d.split("-");
      if (parts.length === 3) {
        return `${toBengaliNumerals(parts[2])}/${toBengaliNumerals(parts[1])}`;
      }
      return d;
    } catch {
      return d;
    }
  };

  // Filter display rows based on search
  const displayRows = useMemo(() => {
    const list = Object.values(marksState);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.nameBangla.toLowerCase().includes(q) ||
        r.studentCode.toLowerCase().includes(q) ||
        String(r.roll).includes(q)
    );
  }, [marksState, searchQuery]);

  // Summary Metrics
  const summary = useMemo(() => {
    const all = Object.values(marksState);
    const entered = all.filter(
      (r) =>
        r.theoryMarks !== "" ||
        r.practicalMarks !== "" ||
        r.continuousAssessment !== "" ||
        r.midtermTheory !== ""
    );
    const passed = all.filter((r) => r.status === "Passed" && r.totalMarks > 0);
    const failed = all.filter((r) => r.status === "Failed" && r.totalMarks > 0);

    const totalScoreSum = all.reduce((sum, r) => sum + (Number(r.totalMarks) || 0), 0);
    const avgScore = entered.length > 0 ? Number((totalScoreSum / entered.length).toFixed(1)) : 0;

    return {
      total: all.length,
      enteredCount: entered.length,
      pendingCount: all.length - entered.length,
      passedCount: passed.length,
      failedCount: failed.length,
      avgScore,
    };
  }, [marksState]);

  const activeClassName = ACADEMIC_CLASSES.find((c) => c.id === selectedClassId)?.nameBangla || "নবম শ্রেণি";
  const activeTradeName = isTradeApplicable && selectedTradeId !== "all"
    ? BTEB_ACADEMIC_TRADES.find((t) => String(t.id) === selectedTradeId)?.nameBangla
    : undefined;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                BTEB অ্যাক্ট ধারাবাহিক মূল্যায়ন রেজিস্টার
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">BTEB Continuous Evaluation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              ধারাবাহিক মূল্যায়ন ও নম্বর এন্ট্রি রেজিস্টার
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              কুইজ, ক্লাস টেস্ট, বর্ষমধ্য পরীক্ষা, অ্যাসাইনমেন্ট ও ব্যবহারিক জব নম্বর এন্ট্রি এবং স্বয়ংক্রিয় BTEB গ্রেড পয়েন্ট ক্যালকুলেশন।
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Set Dates Button */}
            <button
              onClick={() => setDatesModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 text-sm font-semibold shadow-xs transition"
              title="কুইজ, ক্লাস টেস্ট, বর্ষমধ্য ও ব্যবহারিক পরীক্ষার তারিখ নির্ধারণ করুন"
            >
              <Calendar className="w-4 h-4 text-emerald-700" />
              পরীক্ষার তারিখ নির্ধারণ
            </button>

            {/* Print Register Sheet Button */}
            <button
              onClick={() => setPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium transition"
              title="ছবির মতো হুবহু খাতা মুদ্রণ বা প্রিভিউ দেখুন"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              খাতা প্রিন্ট / প্রিভিউ
            </button>

            {/* Auto Fill Pass Marks */}
            <button
              onClick={handleAutoFillPassMarks}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-sm font-medium transition"
              title="ফাঁকা শিক্ষার্থীদের জন্য স্বয়ংক্রিয় পাস নম্বর বসান"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              অটো-ফিল ড্রাফট
            </button>

            {/* Save Marks Button */}
            <button
              onClick={handleSaveMarks}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold shadow-md transition"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  সংরক্ষণ হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  নম্বর সংরক্ষণ করুন
                </>
              )}
            </button>
          </div>
        </div>

        {/* Unsaved Changes Banner */}
        {hasUnsavedChanges && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-lg flex items-center justify-between text-amber-900 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>আপনার পরিবর্তনসমূহ এখনও সংরক্ষণ করা হয়নি। 'নম্বর সংরক্ষণ করুন' বাটনে ক্লিক করুন।</span>
            </div>
            <button
              onClick={handleSaveMarks}
              className="text-xs font-bold underline hover:text-amber-800"
            >
              এখনই সংরক্ষণ করুন
            </button>
          </div>
        )}

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-lg flex items-center gap-2.5 text-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-900"
                : feedback.type === "error"
                ? "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-900"
                : "bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-blue-900"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Filter Control Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            <Filter className="w-4 h-4 text-emerald-600" />
            একাডেমিক ফিল্টার ও বিষয় নির্বাচন
          </div>
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            রিফ্রেশ
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          {/* Academic Year */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">শিক্ষাবর্ষ</label>
            <select
              value={academicYear}
              onChange={(e) => {
                if (hasUnsavedChanges && !confirm("অসংরক্ষিত পরিবর্তন রয়েছে। আপনি কি ফিল্টার পরিবর্তন করতে চান?")) return;
                setAcademicYear(Number(e.target.value));
              }}
              className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-950 font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value={2026}>২০২৬ (2026)</option>
              <option value={2025}>২০২৫ (2025)</option>
              <option value={2024}>২০২৪ (2024)</option>
            </select>
          </div>

          {/* Exam Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">পরীক্ষা</label>
            <select
              value={examName}
              onChange={(e) => {
                if (hasUnsavedChanges && !confirm("অসংরক্ষিত পরিবর্তন রয়েছে। আপনি কি ফিল্টার পরিবর্তন করতে চান?")) return;
                setExamName(e.target.value);
              }}
              className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-950 font-medium focus:ring-2 focus:ring-emerald-500"
            >
              {examsList.length > 0 ? (
                examsList.map((ex) => (
                  <option key={ex.id} value={ex.nameBangla}>
                    {ex.nameBangla}
                  </option>
                ))
              ) : (
                <>
                  <option value="অর্ধবার্ষিক মূল্যায়ন ২০২৬">অর্ধবার্ষিক মূল্যায়ন ২০২৬</option>
                  <option value="বার্ষিক মূল্যায়ন পরীক্ষা ২০২৬">বার্ষিক মূল্যায়ন পরীক্ষা ২০২৬</option>
                  <option value="প্রাক-নির্বাচনী ও মডেল টেস্ট ২০২৬">প্রাক-নির্বাচনী ও মডেল টেস্ট ২০২৬</option>
                  <option value="ক্লাস টেস্ট ও ধারাবাহিক মূল্যায়ন ২০২৬">ক্লাস টেস্ট ও ধারাবাহিক মূল্যায়ন ২০২৬</option>
                </>
              )}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">শ্রেণি (Class)</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                if (hasUnsavedChanges && !confirm("অসংরক্ষিত পরিবর্তন রয়েছে। আপনি কি ফিল্টার পরিবর্তন করতে চান?")) return;
                const newCls = Number(e.target.value);
                setSelectedClassId(newCls);
                const num = parseClassNumeric(newCls);
                if (!doesClassHaveTrade(num)) {
                  setSelectedTradeId("all");
                }
              }}
              className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-950 font-medium focus:ring-2 focus:ring-emerald-500"
            >
              {ACADEMIC_CLASSES.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nameBangla} ({cls.name})
                </option>
              ))}
            </select>
          </div>

          {/* Trade */}
          {isTradeApplicable ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ট্রেড (Vocational Trade)
              </label>
              <select
                value={selectedTradeId}
                onChange={(e) => {
                  if (hasUnsavedChanges && !confirm("অসংরক্ষিত পরিবর্তন রয়েছে। আপনি কি ফিল্টার পরিবর্তন করতে চান?")) return;
                  setSelectedTradeId(e.target.value);
                }}
                className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-950 font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">সব ট্রেড (All Trades)</option>
                {BTEB_ACADEMIC_TRADES.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.nameBangla} ({tr.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="opacity-60 pointer-events-none">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                ট্রেড (সাধারণ শিক্ষাক্রম)
              </label>
              <div className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 italic">
                ট্রেড প্রযোজ্য নয় (Pre-Vocational)
              </div>
            </div>
          )}

          {/* Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">শাখা (Section)</label>
            <select
              value={selectedSection}
              onChange={(e) => {
                if (hasUnsavedChanges && !confirm("অসংরক্ষিত পরিবর্তন রয়েছে। আপনি কি ফিল্টার পরিবর্তন করতে চান?")) return;
                setSelectedSection(e.target.value);
              }}
              className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-950 font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">সকল শাখা (All)</option>
              <option value="A">শাখা ক (A)</option>
              <option value="B">শাখা খ (B)</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">বিষয় (Subject)</label>
            <select
              value={selectedSubjectCode}
              onChange={(e) => {
                if (hasUnsavedChanges && !confirm("অসংরক্ষিত পরিবর্তন রয়েছে। আপনি কি ফিল্টার পরিবর্তন করতে চান?")) return;
                setSelectedSubjectCode(e.target.value);
              }}
              className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-950 font-medium focus:ring-2 focus:ring-emerald-500"
            >
              {availableSubjects.map((sub) => (
                <option key={sub.code} value={sub.code}>
                  {sub.code} - {sub.nameBangla}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Subject Info Bar */}
        {currentSubject && (
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                নির্বাচিত বিষয়: {currentSubject.code} - {currentSubject.nameBangla} ({currentSubject.name})
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                {currentSubject.type || "আবশ্যিক"}
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
              <div>
                তত্ত্বীয় পূর্ণমান: <span className="font-bold text-slate-900 dark:text-slate-100">{toBengaliNumerals(theoryMax)}</span>
              </div>
              <div>
                ব্যবহারিক পূর্ণমান: <span className="font-bold text-slate-900 dark:text-slate-100">{toBengaliNumerals(practicalMax)}</span>
              </div>
              <div>
                সর্বমোট পূর্ণমান: <span className="font-bold text-emerald-700">{toBengaliNumerals(totalMax)}</span>
              </div>
              <div>
                পাস নম্বর: <span className="font-bold text-amber-700">{toBengaliNumerals(passMarks)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400">মোট পরীক্ষার্থী</div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{toBengaliNumerals(summary.total)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-emerald-200 bg-emerald-50/40 text-center">
          <div className="text-xs text-emerald-800 font-medium">এন্ট্রি সম্পন্ন</div>
          <div className="text-xl font-bold text-emerald-700 mt-0.5">{toBengaliNumerals(summary.enteredCount)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-amber-200 bg-amber-50/40 text-center">
          <div className="text-xs text-amber-800 font-medium">বাকি আছে</div>
          <div className="text-xl font-bold text-amber-700 mt-0.5">{toBengaliNumerals(summary.pendingCount)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-blue-200 bg-blue-50/40 text-center">
          <div className="text-xs text-blue-800 font-medium">উত্তীর্ণ (Pass)</div>
          <div className="text-xl font-bold text-blue-700 mt-0.5">{toBengaliNumerals(summary.passedCount)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-rose-200 bg-rose-50/40 text-center">
          <div className="text-xs text-rose-800 font-medium">অনুত্তীর্ণ (Fail)</div>
          <div className="text-xl font-bold text-rose-700 mt-0.5">{toBengaliNumerals(summary.failedCount)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-purple-200 bg-purple-50/40 text-center">
          <div className="text-xs text-purple-800 font-medium">গড় নম্বর</div>
          <div className="text-xl font-bold text-purple-700 mt-0.5">{toBengaliNumerals(summary.avgScore)}</div>
        </div>
      </div>

      {/* Marks Entry Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Table Controls: View Mode Switcher and Search Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* View Mode Switcher */}
            <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 text-xs font-semibold shadow-2xs">
              <button
                onClick={() => setViewMode("register")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  viewMode === "register"
                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                BTEB রেজিস্টার মোড (ছবির কাঠামো)
              </button>
              <button
                onClick={() => setViewMode("summary")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  viewMode === "summary"
                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                সংক্ষিপ্ত এন্ট্রি মোড
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="রোল বা নাম দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={() => setDatesModalOpen(true)}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-bold bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg border border-emerald-200 transition flex items-center gap-1 whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5" />
              তারিখ বদলান
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            শিক্ষার্থীদের তালিকা ও পূর্ববর্তী নম্বর লোড হচ্ছে...
          </div>
        ) : displayRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            এই শ্রেণি, শাখা বা ট্রেডের অধীনে কোনো শিক্ষার্থী পাওয়া যায়নি।
          </div>
        ) : viewMode === "register" ? (
          /* ========================================================================= */
          /* 1. BTEB CONTINUOUS ASSESSMENT REGISTER (হুবহু ব্যবহারকারীর ছবির ছক)          */
          /* ========================================================================= */
          <div className="overflow-x-auto max-h-[680px]">
            <table className="w-full text-center border-collapse text-[11px] leading-tight">
              <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs border-b border-slate-300 dark:border-slate-700 select-none">
                {/* Header Level 1 */}
                <tr className="bg-slate-200 dark:bg-slate-700 border-b border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100">
                  <th rowSpan={3} className="border-r border-slate-300 dark:border-slate-700 p-2 w-10">রোল</th>
                  <th rowSpan={3} className="border-r border-slate-300 dark:border-slate-700 p-2 w-36 text-left pl-3">শিক্ষার্থীর নাম</th>
                  <th rowSpan={3} className="border-r border-slate-300 dark:border-slate-700 p-1.5 w-16" title="মোট উপস্থিতি সংখ্যা বা শতকরা">
                    উপস্থিতি
                  </th>
                  {/* TC Big Section */}
                  <th colSpan={11} className="border-r border-slate-300 dark:border-slate-700 p-1.5 bg-emerald-100 text-emerald-950">
                    তাত্ত্বিক ধারাবাহিক মূল্যায়ন (Theory Continuous - TC)
                  </th>
                  {/* PC Big Section */}
                  <th colSpan={13} className="border-r border-slate-300 dark:border-slate-700 p-1.5 bg-teal-100 text-teal-950">
                    ব্যবহারিক ধারাবাহিক মূল্যায়ন (Practical Continuous - PC)
                  </th>
                  <th rowSpan={3} className="border-r border-slate-300 dark:border-slate-700 p-1.5 w-14 bg-slate-200 dark:bg-slate-700 font-black text-slate-950" title="TC + PC ধারাবাহিক মোট">
                    ধারাবাহিক (CA)
                  </th>
                  <th rowSpan={3} className="border-r border-slate-300 dark:border-slate-700 p-1.5 w-14 font-bold" title={`তত্ত্বীয় চূড়ান্ত পরীক্ষা (সর্বোচ্চ ${theoryMax})`}>
                    তত্ত্বীয় চূড়ান্ত
                  </th>
                  <th rowSpan={3} className="border-r border-slate-300 dark:border-slate-700 p-1.5 w-14 font-bold" title={`ব্যবহারিক চূড়ান্ত পরীক্ষা (সর্বোচ্চ ${practicalMax})`}>
                    ব্যবহারিক চূড়ান্ত
                  </th>
                  <th rowSpan={3} className="border-r border-slate-300 dark:border-slate-700 p-1.5 w-14 font-black bg-slate-300 text-slate-950">
                    সর্বমোট
                  </th>
                  <th rowSpan={3} className="border-r border-slate-300 dark:border-slate-700 p-1.5 w-10 font-bold">গ্রেড</th>
                  <th rowSpan={3} className="border-r border-slate-300 dark:border-slate-700 p-1.5 w-10 font-bold">পয়েন্ট</th>
                  <th rowSpan={3} className="p-1.5 w-16 font-bold">অ্যাকশন</th>
                </tr>

                {/* Header Level 2 */}
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 font-semibold">
                  {/* TC Subdivisions */}
                  <th colSpan={5} className="border-r border-slate-300 dark:border-slate-700 p-1">কুইজ টেস্ট (Quiz 1-4)</th>
                  <th colSpan={5} className="border-r border-slate-300 dark:border-slate-700 p-1">ক্লাস টেস্ট (CT 1-4)</th>
                  <th rowSpan={2} className="border-r border-slate-300 dark:border-slate-700 p-1 w-12 bg-emerald-50 dark:bg-emerald-950/40">
                    হাজিরা ও আচরণ
                  </th>
                  <th
                    rowSpan={2}
                    className="border-r border-slate-300 dark:border-slate-700 p-1 w-16 bg-amber-100 font-bold text-amber-950 cursor-pointer hover:bg-amber-200 transition"
                    onClick={() => setDatesModalOpen(true)}
                    title="বর্ষমধ্য পরীক্ষার তারিখ বদলাতে ক্লিক করুন"
                  >
                    বর্ষমধ্য পরীক্ষা
                    {formatHeaderDate(assessmentDates.tcMidtermDate) && (
                      <div className="text-[9px] text-amber-800 font-mono mt-0.5">
                        ({formatHeaderDate(assessmentDates.tcMidtermDate)})
                      </div>
                    )}
                  </th>
                  <th
                    rowSpan={2}
                    className="border-r border-slate-300 dark:border-slate-700 p-1 w-14 bg-purple-50 dark:bg-purple-950/40 cursor-pointer hover:bg-purple-100 transition"
                    onClick={() => setDatesModalOpen(true)}
                    title="অ্যাসাইনমেন্টের তারিখ বদলাতে ক্লিক করুন"
                  >
                    অ্যাসাইনমেন্ট
                    {formatHeaderDate(assessmentDates.assignmentDate) && (
                      <div className="text-[9px] text-purple-700 font-mono mt-0.5">
                        ({formatHeaderDate(assessmentDates.assignmentDate)})
                      </div>
                    )}
                  </th>
                  <th rowSpan={2} className="border-r border-slate-300 dark:border-slate-700 p-1 w-12 bg-emerald-200 font-black text-emerald-950">
                    মোট TC
                  </th>

                  {/* PC Subdivisions */}
                  <th colSpan={9} className="border-r border-slate-300 dark:border-slate-700 p-1">ব্যবহারিক জব (Job 1-8)</th>
                  <th
                    rowSpan={2}
                    className="border-r border-slate-300 dark:border-slate-700 p-1 w-14 bg-amber-50 dark:bg-amber-950/40 font-bold cursor-pointer hover:bg-amber-100 transition"
                    onClick={() => setDatesModalOpen(true)}
                    title="বর্ষমধ্য ব্যবহারিক পরীক্ষার তারিখ বদলাতে ক্লিক করুন"
                  >
                    বর্ষমধ্য (ব্যবহারিক)
                    {formatHeaderDate(assessmentDates.pcMidtermDate) && (
                      <div className="text-[9px] text-amber-700 font-mono mt-0.5">
                        ({formatHeaderDate(assessmentDates.pcMidtermDate)})
                      </div>
                    )}
                  </th>
                  <th
                    rowSpan={2}
                    className="border-r border-slate-300 dark:border-slate-700 p-1 w-12 bg-indigo-50 dark:bg-indigo-950/40 cursor-pointer hover:bg-indigo-100 transition"
                    onClick={() => setDatesModalOpen(true)}
                    title="রিপোর্টের তারিখ বদলাতে ক্লিক করুন"
                  >
                    রিপোর্ট
                    {formatHeaderDate(assessmentDates.reportDate) && (
                      <div className="text-[9px] text-indigo-700 font-mono mt-0.5">
                        ({formatHeaderDate(assessmentDates.reportDate)})
                      </div>
                    )}
                  </th>
                  <th
                    rowSpan={2}
                    className="border-r border-slate-300 dark:border-slate-700 p-1 w-12 bg-rose-50 dark:bg-rose-950/40 cursor-pointer hover:bg-rose-100 transition"
                    onClick={() => setDatesModalOpen(true)}
                    title="মৌখিক পরীক্ষার তারিখ বদলাতে ক্লিক করুন"
                  >
                    মৌখিক
                    {formatHeaderDate(assessmentDates.vivaDate) && (
                      <div className="text-[9px] text-rose-700 font-mono mt-0.5">
                        ({formatHeaderDate(assessmentDates.vivaDate)})
                      </div>
                    )}
                  </th>
                  <th rowSpan={2} className="border-r border-slate-300 dark:border-slate-700 p-1 w-12 bg-teal-50">
                    হাজিরা ও আচরণ
                  </th>
                  <th rowSpan={2} className="border-r border-slate-300 dark:border-slate-700 p-1 w-12 bg-teal-200 font-black text-teal-950">
                    মোট PC
                  </th>
                </tr>

                {/* Header Level 3: Individual Assessment Columns */}
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-300 dark:border-slate-700 text-[9px] text-slate-600 dark:text-slate-400">
                  {/* Quizzes 1-4 */}
                  {[0, 1, 2, 3].map((idx) => (
                    <th
                      key={`q-hdr-${idx}`}
                      className="border-r border-slate-200 dark:border-slate-800 p-0.5 w-10 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => setDatesModalOpen(true)}
                      title={`${idx + 1}ম কুইজের তারিখ বদলাতে ক্লিক করুন`}
                    >
                      <div>{toBengaliNumerals(idx + 1)}ম</div>
                      {formatHeaderDate(assessmentDates.quizDates[idx]) && (
                        <div className="text-[8px] text-emerald-700 font-mono">
                          {formatHeaderDate(assessmentDates.quizDates[idx])}
                        </div>
                      )}
                    </th>
                  ))}
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-11 font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">মোট</th>

                  {/* Class Tests 1-4 */}
                  {[0, 1, 2, 3].map((idx) => (
                    <th
                      key={`ct-hdr-${idx}`}
                      className="border-r border-slate-200 dark:border-slate-800 p-0.5 w-10 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => setDatesModalOpen(true)}
                      title={`${idx + 1}ম ক্লাস টেস্টের তারিখ বদলাতে ক্লিক করুন`}
                    >
                      <div>{toBengaliNumerals(idx + 1)}ম</div>
                      {formatHeaderDate(assessmentDates.classTestDates[idx]) && (
                        <div className="text-[8px] text-blue-700 font-mono">
                          {formatHeaderDate(assessmentDates.classTestDates[idx])}
                        </div>
                      )}
                    </th>
                  ))}
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-11 font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">মোট</th>

                  {/* Jobs 1-8 */}
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
                    <th
                      key={`job-hdr-${idx}`}
                      className="border-r border-slate-200 dark:border-slate-800 p-0.5 w-9 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => setDatesModalOpen(true)}
                      title={`${idx + 1}ম জবের তারিখ বদলাতে ক্লিক করুন`}
                    >
                      <div>{toBengaliNumerals(idx + 1)}</div>
                      {formatHeaderDate(assessmentDates.jobDates[idx]) && (
                        <div className="text-[8px] text-teal-700 font-mono">
                          {formatHeaderDate(assessmentDates.jobDates[idx])}
                        </div>
                      )}
                    </th>
                  ))}
                  <th className="border-r border-slate-300 dark:border-slate-700 p-0.5 w-10 font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">মোট</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px] font-sans">
                {displayRows.map((row) => {
                  const isLocked = Boolean(row.isLocked);

                  return (
                    <tr
                      key={row.studentId}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-950 transition ${
                        isLocked ? "bg-slate-50 dark:bg-slate-950/70" : ""
                      }`}
                    >
                      {/* Roll */}
                      <td className="border-r border-slate-200 dark:border-slate-800 p-1.5 font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950/50">
                        {toBengaliNumerals(row.roll)}
                      </td>

                      {/* Student Info */}
                      <td className="border-r border-slate-200 dark:border-slate-800 p-1.5 text-left pl-2">
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
                          {row.nameBangla || row.name}
                        </div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[130px]">
                          {row.studentCode}
                        </div>
                      </td>

                      {/* Total Attendance */}
                      <td className="border-r border-slate-200 dark:border-slate-800 p-1">
                        <input
                          type="text"
                          disabled={isLocked}
                          placeholder="-"
                          value={row.totalAttendance ?? ""}
                          onChange={(e) =>
                            handleSingleContinuousChange(row.studentId, "totalAttendance", e.target.value)
                          }
                          className="w-12 text-center py-1 px-0.5 border border-slate-200 dark:border-slate-800 rounded text-[11px] font-semibold focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 dark:bg-slate-800"
                        />
                      </td>

                      {/* Quizzes 1 to 4 */}
                      {[0, 1, 2, 3].map((qIdx) => (
                        <td key={qIdx} className="border-r border-slate-200 dark:border-slate-800 p-0.5">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            disabled={isLocked}
                            placeholder="-"
                            value={row.quizzes[qIdx] ?? ""}
                            onChange={(e) =>
                              handleDetailedContinuousChange(row.studentId, "quizzes", qIdx, e.target.value)
                            }
                            className="w-9 text-center py-1 px-0.5 border border-slate-200 dark:border-slate-800 rounded text-[11px] font-mono focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 dark:bg-slate-800"
                          />
                        </td>
                      ))}
                      {/* Quiz Total */}
                      <td className="border-r border-slate-300 dark:border-slate-700 p-1 font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {toBengaliNumerals(row.quizTotal || 0)}
                      </td>

                      {/* Class Tests 1 to 4 */}
                      {[0, 1, 2, 3].map((cIdx) => (
                        <td key={cIdx} className="border-r border-slate-200 dark:border-slate-800 p-0.5">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            step="0.5"
                            disabled={isLocked}
                            placeholder="-"
                            value={row.classTests[cIdx] ?? ""}
                            onChange={(e) =>
                              handleDetailedContinuousChange(row.studentId, "classTests", cIdx, e.target.value)
                            }
                            className="w-9 text-center py-1 px-0.5 border border-slate-200 dark:border-slate-800 rounded text-[11px] font-mono focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 dark:bg-slate-800"
                          />
                        </td>
                      ))}
                      {/* Class Test Total */}
                      <td className="border-r border-slate-300 dark:border-slate-700 p-1 font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {toBengaliNumerals(row.classTestTotal || 0)}
                      </td>

                      {/* TC Attendance & Conduct */}
                      <td className="border-r border-slate-200 dark:border-slate-800 p-0.5 bg-emerald-50 dark:bg-emerald-950/40/30">
                        <input
                          type="number"
                          min="0"
                          max="15"
                          step="0.5"
                          disabled={isLocked}
                          placeholder="-"
                          value={row.tcAttendanceConduct ?? ""}
                          onChange={(e) =>
                            handleSingleContinuousChange(row.studentId, "tcAttendanceConduct", e.target.value)
                          }
                          className="w-10 text-center py-1 px-0.5 border border-emerald-200 rounded text-[11px] font-mono focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 dark:bg-slate-800"
                        />
                      </td>

                      {/* Midterm Theory (বর্ষ মধ্য পরীক্ষা - BTEB Calculation) */}
                      <td className="border-r border-slate-300 dark:border-slate-700 p-0.5 bg-amber-50 dark:bg-amber-950/40">
                        <input
                          type="number"
                          min="0"
                          max="50"
                          step="0.5"
                          disabled={isLocked}
                          placeholder="-"
                          value={row.midtermTheory ?? ""}
                          onChange={(e) =>
                            handleSingleContinuousChange(row.studentId, "midtermTheory", e.target.value)
                          }
                          className="w-12 text-center py-1 px-0.5 border border-amber-300 rounded text-[11px] font-bold text-amber-950 font-mono focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 dark:bg-slate-800 shadow-2xs"
                        />
                      </td>

                      {/* Assignment */}
                      <td className="border-r border-slate-200 dark:border-slate-800 p-0.5 bg-purple-50 dark:bg-purple-950/40/30">
                        <input
                          type="number"
                          min="0"
                          max="15"
                          step="0.5"
                          disabled={isLocked}
                          placeholder="-"
                          value={row.assignment ?? ""}
                          onChange={(e) =>
                            handleSingleContinuousChange(row.studentId, "assignment", e.target.value)
                          }
                          className="w-10 text-center py-1 px-0.5 border border-purple-200 rounded text-[11px] font-mono focus:ring-1 focus:ring-purple-500 disabled:bg-slate-100 dark:bg-slate-800"
                        />
                      </td>

                      {/* TC Total (Auto Computed!) */}
                      <td className="border-r border-slate-300 dark:border-slate-700 p-1 font-mono font-black bg-emerald-100 text-emerald-950">
                        {toBengaliNumerals(row.tcTotal || 0)}
                      </td>

                      {/* Jobs 1 to 8 */}
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((jIdx) => (
                        <td key={jIdx} className="border-r border-slate-200 dark:border-slate-800 p-0.5">
                          <input
                            type="number"
                            min="0"
                            max="15"
                            step="0.5"
                            disabled={isLocked}
                            placeholder="-"
                            value={row.jobs[jIdx] ?? ""}
                            onChange={(e) =>
                              handleDetailedContinuousChange(row.studentId, "jobs", jIdx, e.target.value)
                            }
                            className="w-8 text-center py-1 px-0.5 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-mono focus:ring-1 focus:ring-teal-500 disabled:bg-slate-100 dark:bg-slate-800"
                          />
                        </td>
                      ))}
                      {/* Jobs Total */}
                      <td className="border-r border-slate-300 dark:border-slate-700 p-1 font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {toBengaliNumerals(row.jobsTotal || 0)}
                      </td>

                      {/* Midterm Practical */}
                      <td className="border-r border-slate-200 dark:border-slate-800 p-0.5 bg-amber-50 dark:bg-amber-950/40/30">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          step="0.5"
                          disabled={isLocked}
                          placeholder="-"
                          value={row.midtermPractical ?? ""}
                          onChange={(e) =>
                            handleSingleContinuousChange(row.studentId, "midtermPractical", e.target.value)
                          }
                          className="w-10 text-center py-1 px-0.5 border border-amber-200 rounded text-[11px] font-mono focus:ring-1 focus:ring-amber-500 disabled:bg-slate-100 dark:bg-slate-800"
                        />
                      </td>

                      {/* Report */}
                      <td className="border-r border-slate-200 dark:border-slate-800 p-0.5 bg-indigo-50 dark:bg-indigo-950/40/30">
                        <input
                          type="number"
                          min="0"
                          max="15"
                          step="0.5"
                          disabled={isLocked}
                          placeholder="-"
                          value={row.report ?? ""}
                          onChange={(e) =>
                            handleSingleContinuousChange(row.studentId, "report", e.target.value)
                          }
                          className="w-9 text-center py-1 px-0.5 border border-indigo-200 rounded text-[11px] font-mono focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 dark:bg-slate-800"
                        />
                      </td>

                      {/* Viva */}
                      <td className="border-r border-slate-200 dark:border-slate-800 p-0.5 bg-rose-50 dark:bg-rose-950/40/30">
                        <input
                          type="number"
                          min="0"
                          max="15"
                          step="0.5"
                          disabled={isLocked}
                          placeholder="-"
                          value={row.viva ?? ""}
                          onChange={(e) =>
                            handleSingleContinuousChange(row.studentId, "viva", e.target.value)
                          }
                          className="w-9 text-center py-1 px-0.5 border border-rose-200 rounded text-[11px] font-mono focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100 dark:bg-slate-800"
                        />
                      </td>

                      {/* PC Attendance & Conduct */}
                      <td className="border-r border-slate-200 dark:border-slate-800 p-0.5 bg-teal-50/30">
                        <input
                          type="number"
                          min="0"
                          max="15"
                          step="0.5"
                          disabled={isLocked}
                          placeholder="-"
                          value={row.pcAttendanceConduct ?? ""}
                          onChange={(e) =>
                            handleSingleContinuousChange(row.studentId, "pcAttendanceConduct", e.target.value)
                          }
                          className="w-9 text-center py-1 px-0.5 border border-teal-200 rounded text-[11px] font-mono focus:ring-1 focus:ring-teal-500 disabled:bg-slate-100 dark:bg-slate-800"
                        />
                      </td>

                      {/* PC Total (Auto Computed!) */}
                      <td className="border-r border-slate-300 dark:border-slate-700 p-1 font-mono font-black bg-teal-100 text-teal-950">
                        {toBengaliNumerals(row.pcTotal || 0)}
                      </td>

                      {/* Continuous Total (CA = TC + PC) */}
                      <td className="border-r border-slate-300 dark:border-slate-700 p-1 font-mono font-black bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                        {toBengaliNumerals(
                          typeof row.continuousAssessment === "number"
                            ? row.continuousAssessment.toFixed(1)
                            : row.continuousAssessment || 0
                        )}
                      </td>

                      {/* Theory Final (TF) */}
                      <td className="border-r border-slate-200 dark:border-slate-800 p-0.5">
                        <input
                          type="number"
                          min="0"
                          max={theoryMax}
                          step="0.5"
                          disabled={isLocked}
                          placeholder="-"
                          value={row.theoryMarks}
                          onChange={(e) =>
                            handleMarkChange(row.studentId, "theoryMarks", e.target.value)
                          }
                          className="w-12 text-center py-1 px-0.5 border border-slate-300 dark:border-slate-700 rounded text-[11px] font-semibold text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 dark:bg-slate-800"
                        />
                      </td>

                      {/* Practical Final (PF) */}
                      <td className="border-r border-slate-200 dark:border-slate-800 p-0.5">
                        <input
                          type="number"
                          min="0"
                          max={practicalMax}
                          step="0.5"
                          disabled={isLocked}
                          placeholder="-"
                          value={row.practicalMarks}
                          onChange={(e) =>
                            handleMarkChange(row.studentId, "practicalMarks", e.target.value)
                          }
                          className="w-12 text-center py-1 px-0.5 border border-slate-300 dark:border-slate-700 rounded text-[11px] font-semibold text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 dark:bg-slate-800"
                        />
                      </td>

                      {/* Grand Total */}
                      <td className="border-r border-slate-300 dark:border-slate-700 p-1 font-mono font-black bg-slate-300 text-slate-950">
                        {toBengaliNumerals(row.totalMarks.toFixed(1))}
                      </td>

                      {/* Letter Grade */}
                      <td className="border-r border-slate-200 dark:border-slate-800 p-1 font-bold">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.grade === "A+"
                              ? "bg-emerald-100 text-emerald-800"
                              : row.grade === "A"
                              ? "bg-blue-100 text-blue-800"
                              : row.grade === "F"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {row.grade}
                        </span>
                      </td>

                      {/* Grade Point */}
                      <td className="border-r border-slate-200 dark:border-slate-800 p-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {row.gradePoint.toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className="p-1 space-x-1">
                        {isLocked ? (
                          <button
                            onClick={() => {
                              setCorrectionTarget(row);
                              setCorrectionReason("");
                            }}
                            className="p-1 text-slate-500 dark:text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:bg-amber-950/40 rounded transition"
                            title="লকড ফলাফল সংশোধন অনুরোধ"
                          >
                            <Edit3 className="w-3.5 h-3.5 inline" />
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleViewTranscript(row)}
                          className="p-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:bg-emerald-950/40 rounded transition"
                          title="নম্বরপত্র / একাডেমিক ট্রান্সক্রিপ্ট দেখুন"
                        >
                          <FileText className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ========================================================================= */
          /* 2. COMPACT SUMMARY MODE (সংক্ষিপ্ত এন্ট্রি মোড)                             */
          /* ========================================================================= */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 text-center w-16">রোল</th>
                  <th className="p-3 w-56">শিক্ষার্থীর তথ্য</th>
                  {isTradeApplicable && <th className="p-3 w-36">ট্রেড</th>}
                  <th className="p-3 text-center w-28">
                    ধারাবাহিক (CA)
                    <div className="text-[10px] text-slate-400 font-normal">কুইজ/সিটি/ল্যাব</div>
                  </th>
                  <th className="p-3 text-center w-28">
                    তত্ত্বীয় (Theory)
                    <div className="text-[10px] text-slate-400 font-normal">সর্বোচ্চ {theoryMax}</div>
                  </th>
                  <th className="p-3 text-center w-28">
                    ব্যবহারিক (Lab)
                    <div className="text-[10px] text-slate-400 font-normal">সর্বোচ্চ {practicalMax}</div>
                  </th>
                  <th className="p-3 text-center w-24">
                    মোট প্রাপ্ত
                    <div className="text-[10px] text-slate-400 font-normal">মোট {totalMax}</div>
                  </th>
                  <th className="p-3 text-center w-20">গ্রেড</th>
                  <th className="p-3 text-center w-20">পয়েন্ট</th>
                  <th className="p-3 text-center w-24">স্ট্যাটাস</th>
                  <th className="p-3 text-right w-28 pr-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {displayRows.map((row) => {
                  const isLocked = row.isLocked;

                  return (
                    <tr
                      key={row.studentId}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-950/80 transition ${
                        isLocked ? "bg-slate-50 dark:bg-slate-950/60" : ""
                      }`}
                    >
                      <td className="p-3 text-center font-bold text-slate-900 dark:text-slate-100">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                          {toBengaliNumerals(row.roll)}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{row.nameBangla || row.name}</div>
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">{row.studentCode}</div>
                      </td>

                      {isTradeApplicable && (
                        <td className="p-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                          {row.tradeName || "জেনারেল"}
                        </td>
                      )}

                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="40"
                          step="0.5"
                          disabled={isLocked}
                          placeholder="-"
                          value={row.continuousAssessment}
                          onChange={(e) =>
                            handleMarkChange(row.studentId, "continuousAssessment", e.target.value)
                          }
                          className="w-20 text-center py-1.5 px-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:bg-slate-800 disabled:cursor-not-allowed focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max={theoryMax}
                          step="0.5"
                          disabled={isLocked}
                          placeholder="-"
                          value={row.theoryMarks}
                          onChange={(e) =>
                            handleMarkChange(row.studentId, "theoryMarks", e.target.value)
                          }
                          className="w-20 text-center py-1.5 px-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:bg-slate-800 disabled:cursor-not-allowed focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max={practicalMax}
                          step="0.5"
                          disabled={isLocked}
                          placeholder="-"
                          value={row.practicalMarks}
                          onChange={(e) =>
                            handleMarkChange(row.studentId, "practicalMarks", e.target.value)
                          }
                          className="w-20 text-center py-1.5 px-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:bg-slate-800 disabled:cursor-not-allowed focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="p-3 text-center font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        {toBengaliNumerals(row.totalMarks.toFixed(1))}
                      </td>

                      <td className="p-3 text-center font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            row.grade === "A+"
                              ? "bg-emerald-100 text-emerald-800"
                              : row.grade === "A"
                              ? "bg-blue-100 text-blue-800"
                              : row.grade === "F"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {row.grade}
                        </span>
                      </td>

                      <td className="p-3 text-center font-semibold text-slate-700 dark:text-slate-300 font-mono text-xs">
                        {row.gradePoint.toFixed(2)}
                      </td>

                      <td className="p-3 text-center">
                        {row.status === "Passed" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200">
                            উত্তীর্ণ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200">
                            অনুত্তীর্ণ
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right pr-4 space-x-1">
                        {isLocked ? (
                          <button
                            onClick={() => {
                              setCorrectionTarget(row);
                              setCorrectionReason("");
                            }}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:bg-amber-950/40 rounded transition"
                            title="লকড ফলাফল সংশোধন অনুরোধ"
                          >
                            <Edit3 className="w-4 h-4 inline" />
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleViewTranscript(row)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:bg-emerald-950/40 rounded transition"
                          title="নম্বরপত্র / একাডেমিক ট্রান্সক্রিপ্ট দেখুন"
                        >
                          <FileText className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer save strip */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            মোট <span className="font-bold text-slate-800 dark:text-slate-200">{toBengaliNumerals(displayRows.length)}</span> জন শিক্ষার্থী প্রদর্শিত হচ্ছে।
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              রেজিস্টার খাতা মুদ্রণ
            </button>
            <button
              onClick={handleSaveMarks}
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" />
              সংরক্ষণ করুন
            </button>
          </div>
        </div>
      </div>

      {/* 1. Assessment Dates Configuration Modal */}
      <BtebAssessmentDatesModal
        isOpen={datesModalOpen}
        onClose={() => setDatesModalOpen(false)}
        dates={assessmentDates}
        onSave={(updatedDates) => {
          setAssessmentDates(updatedDates);
          setHasUnsavedChanges(true);
          setFeedback({
            type: "success",
            message: "পরীক্ষার তারিখসমূহ আপডেট করা হয়েছে। সংরক্ষণের জন্য 'নম্বর সংরক্ষণ করুন' বাটনে ক্লিক করুন।",
          });
        }}
        subjectName={`${currentSubject?.code} - ${currentSubject?.nameBangla || currentSubject?.name}`}
        classNameStr={`${activeClassName}${activeTradeName ? ` • ${activeTradeName}` : ""}`}
      />

      {/* 2. Printable Register Sheet Modal (হুবহু ছবির রেজিস্টার খাতা) */}
      <BtebRegisterPrintSheet
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        studentsRows={displayRows}
        subject={currentSubject}
        classNameStr={activeClassName}
        tradeNameStr={activeTradeName}
        academicYear={academicYear}
        examName={examName}
        assessmentDates={assessmentDates}
      />

      {/* 3. Marks Correction Modal for Locked Marks */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">লকড নম্বর সংশোধন অনুরোধ</h3>
              </div>
              <button
                onClick={() => setCorrectionTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg text-xs space-y-1">
              <div>
                <span className="text-slate-500 dark:text-slate-400">শিক্ষার্থী:</span>{" "}
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {correctionTarget.nameBangla} ({correctionTarget.studentCode})
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">রোল:</span>{" "}
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{correctionTarget.roll}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">বিষয়:</span>{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">{currentSubject?.nameBangla}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">সংশোধিত তত্ত্বীয় নম্বর</label>
                <input
                  type="number"
                  min="0"
                  max={theoryMax}
                  value={correctionTarget.theoryMarks}
                  onChange={(e) =>
                    setCorrectionTarget({ ...correctionTarget, theoryMarks: e.target.value })
                  }
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">সংশোধিত ব্যবহারিক নম্বর</label>
                <input
                  type="number"
                  min="0"
                  max={practicalMax}
                  value={correctionTarget.practicalMarks}
                  onChange={(e) =>
                    setCorrectionTarget({ ...correctionTarget, practicalMarks: e.target.value })
                  }
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                নম্বর সংশোধনের সুনির্দিষ্ট কারণ (বাধ্যতামূলক) *
              </label>
              <textarea
                rows={3}
                placeholder="যেমন: খাতা পুনর্নিরীক্ষণে লিখিত অংশের ৩ নম্বর প্রশ্নে ৫ নম্বর বৃদ্ধি করা হয়েছে..."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCorrectionTarget(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleCorrectionSubmit}
                disabled={correcting || !correctionReason.trim()}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
              >
                {correcting ? "সংশোধন হচ্ছে..." : "সংশোধন অনুমোদন করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Transcript Modal */}
      {transcriptStudent && (
        <AcademicTranscriptModal
          student={transcriptStudent}
          marks={transcriptMarks}
          examName={examName}
          academicYear={academicYear}
          onClose={() => setTranscriptStudent(null)}
        />
      )}
    </div>
  );
}
