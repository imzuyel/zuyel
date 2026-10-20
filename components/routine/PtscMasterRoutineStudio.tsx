"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar,
  Clock,
  Sliders,
  Sparkles,
  CheckCircle2,
  Layers,
  Building,
  BookOpen,
  Settings,
  Coffee,
  Sun,
  ShieldCheck,
  ArrowRight,
  Printer,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit3,
  UserCheck,
  Grid,
  FileSpreadsheet,
  X,
  Check,
  AlertTriangle,
  GripVertical,
  Undo2,
  Redo2,
  Loader2,
  Search,
  FileText,
  Filter,
  Zap,
  UserX,
  Award,
  Palette,
  Eye,
  Maximize2,
  RotateCcw,
  Copy,
  Settings2,
  Bookmark
} from "lucide-react";
import QRCode from "qrcode";
import { toast, Toaster } from "sonner";
import { RoutineItem, FacultyMember, institutionalDb } from "@/lib/database";
import { WEEK_DAYS, WEEK_DAYS_BN } from "@/lib/routineEngine";
import { ACADEMIC_CLASSES, ALL_TRADES, parseClassNumeric, getApplicableTradesForClass, doesClassHaveTrade } from "@/lib/academicStructure";
import AcademicFilterBar from "@/components/common/AcademicFilterBar";
import { toBengaliNumerals } from "@/lib/utils";
import { getSingleSourceSubjects, DynamicSubjectItem } from "@/lib/globalSubjectMappingHub";
import AutoSubstituteEngineModal from "./AutoSubstituteEngineModal";

interface PtscMasterRoutineStudioProps {
  allRoutines?: RoutineItem[];
  facultyList?: FacultyMember[];
  onUpdateRoutine?: (updatedRoutines: RoutineItem[]) => void;
}

export default function PtscMasterRoutineStudio({
  allRoutines,
  facultyList,
  onUpdateRoutine,
}: PtscMasterRoutineStudioProps) {
  const safeRoutines = (allRoutines && allRoutines.length > 0)
    ? allRoutines
    : (institutionalDb?.routines || []);
  const safeFaculty = (facultyList && facultyList.length > 0)
    ? facultyList
    : (institutionalDb?.faculty || []);

  // Phase 1: Global Configuration & Settings Hub
  const [academicYear, setAcademicYear] = useState<string>("2026");
  const [selectedClassId, setSelectedClassId] = useState<string>("4");
  const [selectedTradeCode, setSelectedTradeCode] = useState<string>("IT-IOT");
  const [shift, setShift] = useState<string>("morning");
  const [schoolStartTime, setSchoolStartTime] = useState<string>("08:00");
  const [periodDuration, setPeriodDuration] = useState<number>(40);
  const [totalPeriods, setTotalPeriods] = useState<number>(8);
  
  const [tiffinBreakEnabled, setTiffinBreakEnabled] = useState<boolean>(true);
  const [tiffinBreakDuration, setTiffinBreakDuration] = useState<number>(30);
  const [tiffinBreakAfterPeriod, setTiffinBreakAfterPeriod] = useState<number>(4);
  const [showWorkloadModal, setShowWorkloadModal] = useState<boolean>(false);
  const [periodDurations, setPeriodDurations] = useState<Record<number, number>>({});
  const [workloadSearchQuery, setWorkloadSearchQuery] = useState<string>("");
  const [workloadStatusFilter, setWorkloadStatusFilter] = useState<"all" | "overloaded" | "normal" | "underloaded">("all");

  const [memoNo, setMemoNo] = useState<string>("পসটেস্ক/একাড/মাস্টার-রুটিন-২০২৬/০৯৫");
  const [convenerName, setConvenerName] = useState<string>("প্রকৌঃ মোঃ তানভীর আহমেদ");
  const [principalName, setPrincipalName] = useState<string>("প্রকৌঃ মোঃ রফিকুল ইসলাম");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Dynamic Auto-Substitute Engine & Room Conflict Prevention States
  const [showSubstituteModal, setShowSubstituteModal] = useState<boolean>(false);
  const [substituteModalTargetTeacher, setSubstituteModalTargetTeacher] = useState<string>("");
  const [substituteModalTargetDay, setSubstituteModalTargetDay] = useState<string>("Sunday");
  const [substituteModalTargetPeriod, setSubstituteModalTargetPeriod] = useState<number | undefined>(undefined);

  // Routines state (CRUD) with Undo/Redo Stacks & Auto-saving indicator
  const [routines, setRoutines] = useState<RoutineItem[]>(() => safeRoutines);
  const [history, setHistory] = useState<RoutineItem[][]>([]);
  const [redoStack, setRedoStack] = useState<RoutineItem[][]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState<string | null>(null);

  // Colorful Theme & Print Customization Engine
  const [screenTheme, setScreenTheme] = useState<"vivid" | "pastel" | "emerald" | "cyber" | "royal" | "slate">("vivid");
  const [printTheme, setPrintTheme] = useState<"vivid-print" | "pastel-print" | "eco-ink" | "classic-gov">("vivid-print");
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printShowSignatures, setPrintShowSignatures] = useState<boolean>(true);
  const [printShowQr, setPrintShowQr] = useState<boolean>(true);
  const [printShowNotes, setPrintShowNotes] = useState<boolean>(true);
  const [printShowTeacherSummary, setPrintShowTeacherSummary] = useState<boolean>(true);
  const [printOrientation, setPrintOrientation] = useState<"landscape" | "portrait">("landscape");

  // Advanced AI Auto-Schedule & Physical Space Matrix States
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState<boolean>(false);
  const [showRoomMatrixModal, setShowRoomMatrixModal] = useState<boolean>(false);

  // Advanced AI JSON Routine Upload Studio States
  const [showJsonUploadModal, setShowJsonUploadModal] = useState<boolean>(false);
  const [uploadedJsonData, setUploadedJsonData] = useState<any>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [isProcessingAiJson, setIsProcessingAiJson] = useState<boolean>(false);
  const [aiGeneratedPreview, setAiGeneratedPreview] = useState<RoutineItem[] | null>(null);
  const [jsonImportStrategy, setJsonImportStrategy] = useState<"merge" | "replace">("replace");

  // Dynamic Subject Category Color Styling Engine for Screen & Print
  const getSubjectThemeStyle = (
    subjectCode: string,
    isLab: boolean = false,
    subjectName?: string,
    curScreenTheme = screenTheme,
    curPrintTheme = printTheme
  ) => {
    const codeUpper = (subjectCode || "").toUpperCase();
    const nameStr = (subjectName || "").toLowerCase();

    let category = "general";
    if (
      isLab ||
      nameStr.includes("ল্যাব") ||
      nameStr.includes("ওয়ার্কশপ") ||
      nameStr.includes("lab") ||
      nameStr.includes("practical") ||
      nameStr.includes("ব্যবহারিক")
    ) {
      category = "lab";
    } else if (
      codeUpper.includes("CSE") ||
      codeUpper.includes("IT") ||
      nameStr.includes("কম্পিউটার") ||
      nameStr.includes("প্রোগ্রামিং") ||
      nameStr.includes("আইওটি")
    ) {
      category = "computer";
    } else if (
      codeUpper.includes("PHY") ||
      codeUpper.includes("CHEM") ||
      codeUpper.includes("MATH") ||
      nameStr.includes("গণিত") ||
      nameStr.includes("পদার্থ") ||
      nameStr.includes("রসায়ন")
    ) {
      category = "science";
    } else if (
      codeUpper.includes("BANG") ||
      codeUpper.includes("ENG") ||
      nameStr.includes("বাংলা") ||
      nameStr.includes("ইংরেজি")
    ) {
      category = "language";
    } else if (
      codeUpper.includes("EEE") ||
      codeUpper.includes("RAC") ||
      codeUpper.includes("WELD") ||
      codeUpper.includes("CIVIL") ||
      nameStr.includes("ইলেকট্রিক্যাল") ||
      nameStr.includes("টেকনোলজি")
    ) {
      category = "trade";
    }

    const screenStyles: Record<string, Record<string, string>> = {
      vivid: {
        lab: "bg-gradient-to-br from-amber-950/90 via-orange-950/80 to-amber-900/70 border-amber-500/80 text-amber-200 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/30",
        computer: "bg-gradient-to-br from-indigo-950/90 via-cyan-950/80 to-blue-900/70 border-cyan-500/80 text-cyan-200 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/30",
        science: "bg-gradient-to-br from-teal-950/90 via-emerald-950/80 to-teal-900/70 border-emerald-500/80 text-emerald-200 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30",
        language: "bg-gradient-to-br from-purple-950/90 via-fuchsia-950/80 to-purple-900/70 border-fuchsia-500/80 text-fuchsia-200 shadow-md shadow-fuchsia-950/40 ring-1 ring-fuchsia-500/30",
        trade: "bg-gradient-to-br from-blue-950/90 via-sky-950/80 to-indigo-900/70 border-sky-500/80 text-sky-200 shadow-md shadow-sky-950/40 ring-1 ring-sky-500/30",
        general: "bg-slate-800/95 border-slate-700 text-slate-200 shadow-xs",
      },
      pastel: {
        lab: "bg-amber-950/60 border-amber-400/90 text-amber-100 shadow-xs",
        computer: "bg-cyan-950/60 border-cyan-400/90 text-cyan-100 shadow-xs",
        science: "bg-emerald-950/60 border-emerald-400/90 text-emerald-100 shadow-xs",
        language: "bg-fuchsia-950/60 border-fuchsia-400/90 text-fuchsia-100 shadow-xs",
        trade: "bg-sky-950/60 border-sky-400/90 text-sky-100 shadow-xs",
        general: "bg-slate-800/80 border-slate-600 text-slate-100",
      },
      emerald: {
        lab: "bg-emerald-950/90 border-amber-400/90 text-amber-200 shadow-xs",
        computer: "bg-emerald-950/80 border-cyan-400/80 text-cyan-200",
        science: "bg-emerald-900/90 border-emerald-400/90 text-emerald-200",
        language: "bg-emerald-950/80 border-teal-400/80 text-teal-200",
        trade: "bg-emerald-950/90 border-lime-400/90 text-lime-200",
        general: "bg-emerald-950/60 border-emerald-700/80 text-emerald-100",
      },
      cyber: {
        lab: "bg-rose-950/90 border-rose-500 text-rose-200 glow-cyber-rose shadow-lg animate-cyber-glow",
        computer: "bg-cyan-950/90 border-cyan-400 text-cyan-200 glow-cyber-cyan shadow-lg animate-cyber-glow",
        science: "bg-emerald-950/90 border-emerald-400 text-emerald-200 glow-cyber-emerald shadow-lg",
        language: "bg-indigo-950/90 border-indigo-400 text-indigo-200 glow-cyber-indigo shadow-lg",
        trade: "bg-amber-950/90 border-amber-400 text-amber-200 glow-cyber-amber shadow-lg",
        general: "bg-slate-900 border-cyan-500/40 text-cyan-200",
      },
      royal: {
        lab: "bg-amber-950/90 border-amber-400 text-amber-200 shadow-md",
        computer: "bg-purple-950/90 border-purple-400 text-purple-200 shadow-md",
        science: "bg-indigo-950/90 border-indigo-400 text-indigo-200 shadow-md",
        language: "bg-fuchsia-950/90 border-fuchsia-400 text-fuchsia-200 shadow-md",
        trade: "bg-violet-950/90 border-violet-400 text-violet-200 shadow-md",
        general: "bg-purple-950/50 border-purple-800 text-purple-100",
      },
      slate: {
        lab: "bg-slate-800 border-amber-500/80 text-amber-300",
        computer: "bg-slate-800 border-indigo-500/80 text-indigo-300",
        science: "bg-slate-800 border-emerald-500/80 text-emerald-300",
        language: "bg-slate-800 border-purple-500/80 text-purple-300",
        trade: "bg-slate-800 border-cyan-500/80 text-cyan-300",
        general: "bg-slate-800 border-slate-700 text-slate-200",
      },
    };

    const printStyles: Record<string, Record<string, string>> = {
      "vivid-print": {
        lab: "print:bg-amber-100 print:text-amber-950 print:border-2 print:border-amber-600 print:font-extrabold",
        computer: "print:bg-cyan-100 print:text-cyan-950 print:border-2 print:border-cyan-600 print:font-extrabold",
        science: "print:bg-emerald-100 print:text-emerald-950 print:border-2 print:border-emerald-600 print:font-extrabold",
        language: "print:bg-purple-100 print:text-purple-950 print:border-2 print:border-purple-600 print:font-extrabold",
        trade: "print:bg-sky-100 print:text-sky-950 print:border-2 print:border-sky-600 print:font-extrabold",
        general: "print:bg-slate-100 print:text-slate-950 print:border-2 print:border-slate-500 print:font-bold",
      },
      "pastel-print": {
        lab: "print:bg-amber-50 print:text-amber-900 print:border print:border-amber-400",
        computer: "print:bg-cyan-50 print:text-cyan-900 print:border print:border-cyan-400",
        science: "print:bg-emerald-50 print:text-emerald-900 print:border print:border-emerald-400",
        language: "print:bg-fuchsia-50 print:text-fuchsia-900 print:border print:border-fuchsia-400",
        trade: "print:bg-sky-50 print:text-sky-900 print:border print:border-sky-400",
        general: "print:bg-slate-50 print:text-slate-900 print:border print:border-slate-300",
      },
      "eco-ink": {
        lab: "print:bg-white print:text-black print:border-2 print:border-black print:font-extrabold",
        computer: "print:bg-white print:text-black print:border print:border-black print:font-bold",
        science: "print:bg-white print:text-black print:border print:border-black print:font-bold",
        language: "print:bg-white print:text-black print:border print:border-black print:font-bold",
        trade: "print:bg-white print:text-black print:border print:border-black print:font-bold",
        general: "print:bg-white print:text-black print:border print:border-black",
      },
      "classic-gov": {
        lab: "print:bg-slate-100 print:text-black print:border-2 print:border-black print:font-extrabold",
        computer: "print:bg-slate-50 print:text-black print:border print:border-black",
        science: "print:bg-slate-50 print:text-black print:border print:border-black",
        language: "print:bg-slate-50 print:text-black print:border print:border-black",
        trade: "print:bg-slate-50 print:text-black print:border print:border-black",
        general: "print:bg-white print:text-black print:border print:border-black",
      },
    };

    const curScreenMap = screenStyles[curScreenTheme] || screenStyles.vivid;
    const curPrintMap = printStyles[curPrintTheme] || printStyles["vivid-print"];

    return `${curScreenMap[category] || curScreenMap.general} ${curPrintMap[category] || curPrintMap.general}`;
  };

  // Helper to commit state change with history tracking and auto-save simulation
  const commitRoutineChange = (newRoutines: RoutineItem[]) => {
    setIsSaving(true);
    setHistory((prev) => [...prev, routines]);
    setRedoStack([]);
    setRoutines(newRoutines);
    if (onUpdateRoutine) onUpdateRoutine(newRoutines);

    setTimeout(() => {
      setIsSaving(false);
    }, 700);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setIsSaving(true);
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);
    setRedoStack((prev) => [routines, ...prev]);
    setHistory(newHistory);
    setRoutines(previous);
    if (onUpdateRoutine) onUpdateRoutine(previous);
    toast.info("পূর্বাবস্থায় ফিরে যাওয়া হয়েছে (Undo)");

    setTimeout(() => {
      setIsSaving(false);
    }, 700);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    setIsSaving(true);
    const next = redoStack[0];
    const newRedo = redoStack.slice(1);
    setHistory((prev) => [...prev, routines]);
    setRedoStack(newRedo);
    setRoutines(next);
    if (onUpdateRoutine) onUpdateRoutine(next);
    toast.info("পুনরায় প্রয়োগ করা হয়েছে (Redo)");

    setTimeout(() => {
      setIsSaving(false);
    }, 700);
  };

  // Drag & Drop State for Ghost & Drop Zones
  const [draggingRoutineId, setDraggingRoutineId] = useState<number | string | null>(null);

  // Teacher Availability overrides map
  const [teacherAvailability, setTeacherAvailability] = useState<Record<string, "Busy" | "Available">>({});

  useEffect(() => {
    if (allRoutines && allRoutines.length > 0) {
      setRoutines(allRoutines);
    }
  }, [allRoutines]);

  // View tabs: "class" | "teacher" | "config"
  const [activeTab, setActiveTab] = useState<"class" | "teacher" | "config">("class");
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>("");

  // Modal State for Slot Assignment / CRUD
  const [activeModalCell, setActiveModalCell] = useState<{
    day: string;
    periodNo: number;
    classId?: number;
    tradeCode?: string;
  } | null>(null);

  const [modalTeacher, setModalTeacher] = useState<string>("");
  const [modalSubject, setModalSubject] = useState<string>("কম্পিউটার ও তথ্যপ্রযুক্তি প্রোগ্রামিং");
  const [modalSubjectCode, setModalSubjectCode] = useState<string>("CSE-212");
  const [modalRoom, setModalRoom] = useState<string>("ল্যাব-০১");
  const [modalClassId, setModalClassId] = useState<number>(4);
  const [modalTradeCode, setModalTradeCode] = useState<string>("IT-IOT");
  const [modalDuration, setModalDuration] = useState<number>(40);
  const [filterOnlyFreeTeachers, setFilterOnlyFreeTeachers] = useState<boolean>(false);
  const [isCustomSubjectMode, setIsCustomSubjectMode] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // QR Code generator
  useEffect(() => {
    const url = `https://tsc.panchagarh.gov.bd/verify-master-routine-2026?memo=${encodeURIComponent(memoNo)}`;
    QRCode.toDataURL(url, { width: 120, margin: 1 })
      .then((dataUrl) => setQrCodeDataUrl(dataUrl))
      .catch((err) => console.error("QR Code error:", err));
  }, [memoNo]);

  // Global Mapping Sync Listener
  const [, setMappingVersion] = useState<number>(0);
  useEffect(() => {
    const handleMappingUpdate = () => {
      setMappingVersion((v) => v + 1);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("pts-academic-mapping-updated", handleMappingUpdate);
      return () => window.removeEventListener("pts-academic-mapping-updated", handleMappingUpdate);
    }
  }, []);

  const ROUTINE_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] as const;
  const ROUTINE_DAYS_BN: Record<string, string> = {
    Sunday: "রবিবার",
    Monday: "সোমবার",
    Tuesday: "মঙ্গলবার",
    Wednesday: "বুধবার",
    Thursday: "বৃহস্পতিবার",
    SUNDAY: "রবিবার",
    MONDAY: "সোমবার",
    TUESDAY: "মঙ্গলবার",
    WEDNESDAY: "বুধবার",
    THURSDAY: "বৃহস্পতিবার",
  };

  // Dynamic Time Slot Calculator (Standard 8 periods of 40 mins with Tiffin break after 4th period)
  const generatedTimeSlots = useMemo(() => {
    const slots = [];
    const [startH, startM] = schoolStartTime.split(":").map(Number);
    let curH = startH || 8;
    let curM = startM || 0;

    const formatTime = (h: number, m: number) => {
      const hh = String(h % 24).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      return `${hh}:${mm}`;
    };

    const addMinutes = (h: number, m: number, mins: number) => {
      let totalM = h * 60 + m + mins;
      return { h: Math.floor(totalM / 60), m: totalM % 60 };
    };

    for (let p = 1; p <= totalPeriods; p++) {
      const dur = periodDuration || 40;
      const startTime = formatTime(curH, curM);
      const next = addMinutes(curH, curM, dur);
      const endTime = formatTime(next.h, next.m);
      curH = next.h;
      curM = next.m;

      slots.push({
        period: p,
        startTime,
        endTime,
        duration: dur,
        label: `${toBengaliNumerals(startTime)} - ${toBengaliNumerals(endTime)}`,
        periodNoBn: toBengaliNumerals(p),
        timeRange: `${startTime}-${endTime}`,
        isBreak: false,
      });

      if (tiffinBreakEnabled && p === tiffinBreakAfterPeriod) {
        const breakStart = endTime;
        const breakNext = addMinutes(curH, curM, tiffinBreakDuration);
        const breakEnd = formatTime(breakNext.h, breakNext.m);
        curH = breakNext.h;
        curM = breakNext.m;

        slots.push({
          period: 0,
          startTime: breakStart,
          endTime: breakEnd,
          duration: tiffinBreakDuration,
          label: "টিফিন বিরতি",
          periodNoBn: "টিফিন",
          timeRange: `${breakStart}-${breakEnd}`,
          isBreak: true,
        });
      }
    }
    return slots;
  }, [schoolStartTime, periodDuration, totalPeriods, tiffinBreakEnabled, tiffinBreakDuration, tiffinBreakAfterPeriod]);

  const getSlotSpan = (durationMinutes?: number) => {
    if (!durationMinutes) return 1;
    if (durationMinutes >= 160) return 4;
    if (durationMinutes >= 120) return 3;
    if (durationMinutes >= 80) return 2;
    return 1;
  };

  const getSlotTimeText = (startPeriod: number, durationMinutes: number) => {
    const span = getSlotSpan(durationMinutes);
    const startSlot = generatedTimeSlots.find((s) => s.period === startPeriod);
    const endSlot = generatedTimeSlots.find((s) => s.period === startPeriod + span - 1);
    if (!startSlot) return `${toBengaliNumerals(durationMinutes)} মিনিট`;
    const startT = toBengaliNumerals(startSlot.startTime);
    const endT = toBengaliNumerals(endSlot ? endSlot.endTime : startSlot.endTime);
    return `${startT} থেকে ${endT}`;
  };

  // Real-time Range-aware Conflict Detection Engine (Teacher & Classroom Overlap)
  const checkSlotConflict = (routine: RoutineItem) => {
    if (!routine) return false;
    const tName = routine.teacherName?.trim().toLowerCase();
    const rNo = routine.roomNo?.trim().toLowerCase();

    const spanA = getSlotSpan(routine.durationMinutes);
    const startA = routine.periodNo;
    const endA = startA + spanA - 1;

    return routines.some((r) => {
      if (r.id === routine.id || r.day?.toLowerCase() !== routine.day?.toLowerCase()) return false;
      const spanB = getSlotSpan(r.durationMinutes);
      const startB = r.periodNo;
      const endB = startB + spanB - 1;

      const hasOverlap = !(endA < startB || endB < startA);
      if (!hasOverlap) return false;

      const teacherConflict = tName && r.teacherName?.trim().toLowerCase() === tName;
      const roomConflict = rNo && r.roomNo?.trim().toLowerCase() === rNo && r.classId !== routine.classId;
      return teacherConflict || roomConflict;
    });
  };

  const getTeacherConflictDetails = (
    teacherName: string,
    day: string,
    periodNo: number,
    currentClassId: number,
    durationMinutes = 40
  ): { hasConflict: boolean; conflictingSlot?: RoutineItem } => {
    if (!teacherName) return { hasConflict: false };
    const trimmed = teacherName.trim().toLowerCase();
    const spanA = getSlotSpan(durationMinutes);
    const startA = periodNo;
    const endA = startA + spanA - 1;

    const conflicting = routines.find((r) => {
      if (r.day?.toLowerCase() !== day.toLowerCase() || r.classId === currentClassId || !r.teacherName) return false;
      if (r.teacherName.trim().toLowerCase() !== trimmed) return false;
      const spanB = getSlotSpan(r.durationMinutes);
      const startB = r.periodNo;
      const endB = startB + spanB - 1;
      return !(endA < startB || endB < startA);
    });

    if (conflicting) {
      return {
        hasConflict: true,
        conflictingSlot: conflicting,
      };
    }
    return { hasConflict: false };
  };

  const checkTeacherConflict = (
    teacherName: string,
    day: string,
    periodNo: number,
    currentClassId: number,
    durationMinutes = 40
  ) => {
    return getTeacherConflictDetails(teacherName, day, periodNo, currentClassId, durationMinutes).hasConflict;
  };

  // Free Teacher Detector (Span-aware for requested duration)
  const getFreeTeachers = (day: string, periodNo: number, durationMinutes = 40) => {
    const busyTeachers = new Set<string>();
    const spanA = getSlotSpan(durationMinutes);
    const startA = periodNo;
    const endA = startA + spanA - 1;

    routines.forEach((r) => {
      if (r.day?.toLowerCase() === day.toLowerCase() && r.teacherName) {
        const spanB = getSlotSpan(r.durationMinutes);
        const startB = r.periodNo;
        const endB = startB + spanB - 1;
        const overlaps = !(endA < startB || endB < startA);
        if (overlaps) {
          busyTeachers.add(r.teacherName.trim().toLowerCase());
        }
      }
    });

    return safeFaculty.filter(
      (f) => f.type === "faculty" && !busyTeachers.has(f.name.trim().toLowerCase())
    );
  };

  const getTeacherConflictForSlot = (teacherName: string, day: string, periodNo: number, durationMinutes = 40) => {
    const spanA = getSlotSpan(durationMinutes);
    const startA = periodNo;
    const endA = startA + spanA - 1;
    const trimmed = teacherName.trim().toLowerCase();

    return routines.find((r) => {
      if (r.day?.toLowerCase() !== day.toLowerCase() || !r.teacherName) return false;
      if (r.teacherName.trim().toLowerCase() !== trimmed) return false;
      const spanB = getSlotSpan(r.durationMinutes);
      const startB = r.periodNo;
      const endB = startB + spanB - 1;
      return !(endA < startB || endB < startA);
    });
  };

  // PTSC Specialized Physical Spaces & Labs Catalog
  const PTSC_ROOMS_CATALOG = [
    { id: "lab-01", name: "ল্যাব-০১ (কম্পিউটার ও আইওটি ল্যাব)", shortName: "ল্যাব-০১", type: "lab", floor: "২য় তলা (একাডেমিক ভবন)" },
    { id: "lab-02", name: "ল্যাব-০২ (সফটওয়্যার ও নেটওয়ার্কিং ল্যাব)", shortName: "ল্যাব-০২", type: "lab", floor: "২য় তলা (একাডেমিক ভবন)" },
    { id: "ws-ee", name: "ওয়ার্কশপ-০১ (ইলেকট্রিক্যাল টেকনোলজি ও ওয়্যারিং ল্যাব)", shortName: "ওয়ার্কশপ-০১ (ইলেকট্রিক্যাল)", type: "workshop", floor: "নিচতলা (শেড-১)" },
    { id: "ws-rac", name: "ওয়ার্কশপ-০২ (রেফ্রিজারেশন ও এয়ার কন্ডিশনিং - RAC ল্যাব)", shortName: "ওয়ার্কশপ-০২ (RAC)", type: "workshop", floor: "নিচতলা (শেড-২)" },
    { id: "ws-weld", name: "ওয়ার্কশপ-০৩ (ওয়েল্ডিং ও মেটাল ফেব্রিকেশন ল্যাব)", shortName: "ওয়ার্কশপ-০৩ (ওয়েল্ডিং)", type: "workshop", floor: "নিচতলা (শেড-৩)" },
    { id: "ws-civil", name: "ওয়ার্কশপ-০৪ (সিভিল ড্রাফটিং ও কনস্ট্রাকশন রুম)", shortName: "ওয়ার্কশপ-০৪ (সিভিল)", type: "workshop", floor: "৩য় তলা (একাডেমিক ভবন)" },
    { id: "lab-phy", name: "ল্যাব-০৩ (পদার্থবিজ্ঞান ও সাধারণ বিজ্ঞান ল্যাব)", shortName: "ল্যাব-০৩ (বিজ্ঞান)", type: "lab", floor: "৩য় তলা (একাডেমিক ভবন)" },
    { id: "room-101", name: "রুম-১০১ (মেইন একাডেমিক থিওরি ক্লাসরুম)", shortName: "রুম-১০১", type: "theory", floor: "১ম তলা" },
    { id: "room-102", name: "রুম-১০২ (থিওরি ক্লাসরুম)", shortName: "রুম-১০২", type: "theory", floor: "১ম তলা" },
    { id: "room-201", name: "রুম-২০১ (থিওরি ক্লাসরুম)", shortName: "রুম-২০১", type: "theory", floor: "২য় তলা" },
    { id: "room-202", name: "রুম-২০২ (থিওরি ক্লাসরুম)", shortName: "রুম-২০২", type: "theory", floor: "২য় তলা" },
    { id: "room-203", name: "রুম-২০৩ (স্মার্ট মাল্টিমিডিয়া ক্লাসরুম)", shortName: "রুম-২০৩ (স্মার্ট)", type: "theory", floor: "২য় তলা" },
    { id: "room-204", name: "রুম-২০৪ (আইওটি ও প্রজেক্ট রুম)", shortName: "রুম-২০৪", type: "lab", floor: "২য় তলা" },
    { id: "room-301", name: "রুম-৩০১ (উচ্চতর কারিগরি থিওরি রুম)", shortName: "রুম-৩০১", type: "theory", floor: "৩য় তলা" },
    { id: "room-402", name: "রুম-৪০২ (মাল্টিমিডিয়া থিওরি রুম)", shortName: "রুম-৪০২", type: "theory", floor: "৪র্থ তলা" },
  ];

  // Real-time Room Conflict Detection Engine
  const getRoomConflictDetails = (
    roomNo: string,
    day: string,
    periodNo: number,
    currentClassId: number,
    durationMinutes = 40,
    currentTradeCode?: string
  ): { hasConflict: boolean; conflictingSlot?: RoutineItem } => {
    if (!roomNo || !roomNo.trim()) return { hasConflict: false };
    const trimmed = roomNo.trim().toLowerCase();
    const spanA = getSlotSpan(durationMinutes);
    const startA = periodNo;
    const endA = startA + spanA - 1;

    const conflicting = routines.find((r) => {
      if (r.day?.toLowerCase() !== day.toLowerCase() || !r.roomNo) return false;
      if (r.classId === currentClassId && (r.tradeCode === currentTradeCode || !r.tradeCode || !currentTradeCode)) {
        return false;
      }
      const rRoom = r.roomNo.trim().toLowerCase();
      const isMatch = rRoom === trimmed ||
        (trimmed.includes("ল্যাব-০১") && rRoom.includes("ল্যাব-০১")) ||
        (trimmed.includes("ল্যাব-০২") && rRoom.includes("ল্যাব-০২")) ||
        (trimmed.includes("ওয়ার্কশপ-০১") && rRoom.includes("ওয়ার্কশপ-০১")) ||
        (trimmed.includes("ওয়ার্কশপ-০২") && rRoom.includes("ওয়ার্কশপ-০২")) ||
        (trimmed.includes("ওয়ার্কশপ-০৩") && rRoom.includes("ওয়ার্কশপ-০৩")) ||
        (trimmed.includes("ওয়ার্কশপ-০৪") && rRoom.includes("ওয়ার্কশপ-০৪")) ||
        (trimmed.includes("রুম-৪০২") && rRoom.includes("রুম-৪০২")) ||
        (trimmed.includes("204") && rRoom.includes("204"));

      if (!isMatch) return false;

      const spanB = getSlotSpan(r.durationMinutes);
      const startB = r.periodNo;
      const endB = startB + spanB - 1;
      return !(endA < startB || endB < startA);
    });

    if (conflicting) {
      return {
        hasConflict: true,
        conflictingSlot: conflicting,
      };
    }
    return { hasConflict: false };
  };

  const checkRoomConflictForSlot = (
    roomNo: string,
    day: string,
    periodNo: number,
    currentClassId: number,
    durationMinutes = 40,
    currentTradeCode?: string
  ) => {
    return getRoomConflictDetails(roomNo, day, periodNo, currentClassId, durationMinutes, currentTradeCode).hasConflict;
  };

  // Drag and Drop Handlers with Ghost Effect
  const handleDragStart = (e: React.DragEvent, routineId: number | string) => {
    setDraggingRoutineId(routineId);
    e.dataTransfer.setData("text/plain", String(routineId));
  };

  const handleDragEnd = () => {
    setDraggingRoutineId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDay: string, targetPeriodNo: number, targetClassId: number, targetTradeCode: string) => {
    e.preventDefault();
    setDraggingRoutineId(null);
    const routineIdStr = e.dataTransfer.getData("text/plain");
    if (!routineIdStr) return;

    const sourceRoutine = routines.find((r) => String(r.id) === routineIdStr);
    if (!sourceRoutine) return;

    const slotInfo = generatedTimeSlots.find((s) => s.period === targetPeriodNo);
    const targetClass = ACADEMIC_CLASSES.find((c) => c.id === targetClassId) || ACADEMIC_CLASSES[0];

    const hasConflict = checkTeacherConflict(sourceRoutine.teacherName, targetDay, targetPeriodNo, targetClassId);

    const updatedItem: RoutineItem = {
      ...sourceRoutine,
      day: targetDay as any,
      periodNo: targetPeriodNo,
      classId: targetClassId,
      className: targetClass.name,
      tradeCode: targetTradeCode,
      startTime: slotInfo?.startTime || sourceRoutine.startTime,
      endTime: slotInfo?.endTime || sourceRoutine.endTime,
    };

    const filtered = routines.filter((r) => String(r.id) !== routineIdStr && !(r.day === targetDay && r.periodNo === targetPeriodNo && r.classId === targetClassId));
    const updated = [...filtered, updatedItem];

    commitRoutineChange(updated);

    if (hasConflict) {
      toast.error(`⚠️ ড্রপ করার পর কনফ্লিক্ট সনাক্ত হয়েছে! (${sourceRoutine.teacherName}) এই সময়ে অন্য ক্লাসেও ব্যস্ত আছেন।`);
    } else {
      toast.success("স্লট সফলভাবে ড্রপ ও স্থানান্তরিত হয়েছে!");
    }
  };

  // Open Cell Modal for CRUD with Global Subjects & Teacher Sync
  const handleOpenCellModal = (
    day: string,
    periodNo: number,
    classId = 4,
    tradeCode = "IT-IOT",
    preselectedTeacher?: string
  ) => {
    setActiveModalCell({ day, periodNo, classId, tradeCode });
    setModalClassId(classId);
    setModalTradeCode(tradeCode);
    setIsCustomSubjectMode(false);

    const existing = routines.find(
      (r) => r.day === day && r.periodNo === periodNo && r.classId === classId && (r.tradeCode === tradeCode || !r.tradeCode)
    );

    if (existing) {
      setModalTeacher(existing.teacherName);
      setModalSubject(existing.subjectNameBangla || existing.subjectName);
      setModalSubjectCode(existing.subjectCode);
      setModalRoom(existing.roomNo);
      setModalDuration(existing.durationMinutes || 40);
    } else {
      const freeList = getFreeTeachers(day, periodNo, 40);
      const chosenTeacher = preselectedTeacher || (freeList.length > 0 ? freeList[0].name : (safeFaculty[0]?.name || ""));
      setModalTeacher(chosenTeacher);

      // Automatically sync mapped subjects from Global Settings
      const mapped = getSingleSourceSubjects({
        classVal: classId,
        tradeVal: tradeCode,
        academicYear,
      });

      if (mapped.length > 0) {
        setModalSubject(mapped[0].nameBangla || mapped[0].name);
        setModalSubjectCode(mapped[0].code);
        if (mapped[0].category === "Lab" || mapped[0].category === "Workshop") {
          setModalDuration(80);
          setModalRoom("ল্যাব-০১");
        } else {
          setModalDuration(40);
          setModalRoom("রুম-১০১");
        }
      } else {
        setModalSubject("সাধারণ বিষয়");
        setModalSubjectCode("GEN-101");
        setModalRoom("রুম-১০১");
        setModalDuration(40);
      }
    }
  };

  // Save / Update Slot with Range Merging, Undo/Redo & Sonner Toast
  const handleSaveSlot = () => {
    if (!activeModalCell) return;
    const { day, periodNo } = activeModalCell;

    const span = getSlotSpan(modalDuration);
    const targetStart = periodNo;
    const targetEnd = periodNo + span - 1;

    const startSlotInfo = generatedTimeSlots.find((s) => s.period === targetStart);
    const endSlotInfo = generatedTimeSlots.find((s) => s.period === targetEnd);
    const targetClass = ACADEMIC_CLASSES.find((c) => c.id === modalClassId) || ACADEMIC_CLASSES[0];

    const hasConflict = checkTeacherConflict(modalTeacher, day, periodNo, modalClassId, modalDuration);

    const newItem: RoutineItem = {
      id: Date.now(),
      academicYear,
      classId: modalClassId,
      className: targetClass.name,
      tradeCode: modalTradeCode,
      day: day as any,
      periodNo,
      startTime: startSlotInfo?.startTime || "08:00",
      endTime: endSlotInfo?.endTime || startSlotInfo?.endTime || "08:40",
      durationMinutes: modalDuration,
      subjectCode: modalSubjectCode,
      subjectName: modalSubject,
      subjectNameBangla: modalSubject,
      teacherName: modalTeacher,
      teacherBangla: modalTeacher,
      roomNo: modalRoom,
      isLab: modalRoom.includes("ল্যাব") || modalRoom.includes("Lab") || modalDuration >= 80,
      status: "published",
    };

    // Remove any existing slots for this class/trade that overlap with the new merged range
    const filtered = routines.filter((r) => {
      if (r.day !== day) return true;
      const isSameClass = r.classId === modalClassId && (r.tradeCode === modalTradeCode || !r.tradeCode || !modalTradeCode);
      if (!isSameClass) return true;
      const rSpan = getSlotSpan(r.durationMinutes);
      const rStart = r.periodNo;
      const rEnd = rStart + rSpan - 1;
      const overlaps = !(targetEnd < rStart || rEnd < targetStart);
      return !overlaps;
    });

    const updated = [...filtered, newItem];
    commitRoutineChange(updated);

    const successMsg = "রুটিন স্লট সফলভাবে সংরক্ষণ করা হয়েছে!";
    toast.success(successMsg);
    setSaveSuccessBanner(successMsg);

    if (hasConflict) {
      toast.warning(`⚠️ শিক্ষক কনফ্লিক্ট সনাক্ত হয়েছে! (${modalTeacher}) একই সময়ে অন্য ক্লাসেও ব্যস্ত আছেন।`);
    }

    setActiveModalCell(null);
  };

  // Delete Slot with Undo/Redo Support
  const handleDeleteSlot = (day: string, periodNo: number, classId: number, tradeCode?: string) => {
    const updated = routines.filter((r) => {
      if (r.day?.toLowerCase() !== day.toLowerCase()) return true;
      const isSameClass = r.classId === classId && (r.tradeCode === tradeCode || !r.tradeCode || !tradeCode);
      if (!isSameClass) return true;
      const rSpan = getSlotSpan(r.durationMinutes);
      const rStart = r.periodNo;
      const rEnd = rStart + rSpan - 1;
      const covers = periodNo >= rStart && periodNo <= rEnd;
      return !covers;
    });
    commitRoutineChange(updated);
    toast.info("স্লট সফলভাবে মুছে ফেলা হয়েছে। (Undo করতে উপরের বাটন ব্যবহার করুন)");
  };

  // Split merged multi-period slot back to single 40m period
  const handleSplitSlot = (routineItem: RoutineItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const startSlotInfo = generatedTimeSlots.find((s) => s.period === routineItem.periodNo);
    const updatedItem: RoutineItem = {
      ...routineItem,
      durationMinutes: 40,
      endTime: startSlotInfo?.endTime || routineItem.endTime,
      isLab: false,
    };
    const updated = routines.map((r) => (r.id === routineItem.id ? updatedItem : r));
    commitRoutineChange(updated);
    toast.success("স্লটটি সফলভাবে ৪০ মিনিটের ক্লাসে স্প্লিট করা হয়েছে!");
  };

  // Expand slot to double (80m), triple (120m), or quadruple (160m) period
  const handleExpandSlot = (routineItem: RoutineItem, newDuration: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const span = getSlotSpan(newDuration);
    const targetStart = routineItem.periodNo;
    const targetEnd = targetStart + span - 1;
    const startSlotInfo = generatedTimeSlots.find((s) => s.period === targetStart);
    const endSlotInfo = generatedTimeSlots.find((s) => s.period === targetEnd);

    const updatedItem: RoutineItem = {
      ...routineItem,
      durationMinutes: newDuration,
      startTime: startSlotInfo?.startTime || routineItem.startTime,
      endTime: endSlotInfo?.endTime || routineItem.endTime,
      isLab: newDuration >= 80,
    };

    const filtered = routines.filter((r) => {
      if (r.id === routineItem.id) return false;
      if (r.day?.toLowerCase() !== routineItem.day?.toLowerCase()) return true;
      const isSameClass = r.classId === routineItem.classId && (r.tradeCode === routineItem.tradeCode || !r.tradeCode || !routineItem.tradeCode);
      if (!isSameClass) return true;
      const rSpan = getSlotSpan(r.durationMinutes);
      const rStart = r.periodNo;
      const rEnd = rStart + rSpan - 1;
      return targetEnd < rStart || rEnd < targetStart;
    });

    commitRoutineChange([...filtered, updatedItem]);
    toast.success(`সফলভাবে ${toBengaliNumerals(newDuration)} মিনিটের ক্লাসে সম্প্রসারিত করা হয়েছে!`);
  };

  // Toggle Teacher Availability Block
  const toggleTeacherAvailability = (teacherName: string, day: string, periodNo: number) => {
    const key = `${teacherName}_${day}_${periodNo}`;
    const current = teacherAvailability[key] || "Available";
    const next = current === "Available" ? "Busy" : "Available";
    setTeacherAvailability({ ...teacherAvailability, [key]: next });
    toast(`শিক্ষক স্ট্যাটাস আপডেট: ${teacherName} (${next})`);
  };

  // Export & Print & Import
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(routines, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `PTSC_Master_Routine_${academicYear}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    toast.success("JSON ফাইল সফলভাবে ডাউনলোড হয়েছে।");
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const textContent = event.target?.result as string;
        const parsed = JSON.parse(textContent);
        setUploadedJsonData(parsed);

        // If it's already a valid RoutineItem array, also pre-set as preview
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].periodNo !== undefined) {
          setAiGeneratedPreview(parsed);
        } else {
          setAiGeneratedPreview(null);
        }

        setShowJsonUploadModal(true);
        toast.info("JSON ফাইল আপলোড হয়েছে। এআই দিয়ে রুটিন তৈরি বা ডাইরেক্ট ইমপোর্ট সিলেক্ট করুন।");
      } catch (err) {
        toast.error("JSON ফাইল রিড করতে সমস্যা হয়েছে। এটি একটি বৈধ JSON ফাইল হতে হবে।");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // AI Assistant processing uploaded JSON file into Routine Items
  const handleProcessJsonWithAi = async (dataToProcess = uploadedJsonData) => {
    if (!dataToProcess) {
      toast.error("কোনো JSON ডেটা প্রদান করা হয়নি!");
      return;
    }

    setIsProcessingAiJson(true);
    setAiGeneratedPreview(null);

    try {
      const res = await fetch("/api/ai/generate-routine-from-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonContent: dataToProcess,
          academicYear,
          defaultClassId: selectedClassId,
          defaultTradeCode: selectedTradeCode,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "এআই দিয়ে রুটিন তৈরি করতে ব্যর্থ হয়েছে।");
      }

      setAiGeneratedPreview(result.routines);
      toast.success(`✨ এআই সফলভাবে ${result.count}টি রুটিন স্লট তৈরি করেছে!`);
    } catch (err: any) {
      console.error("AI Processing Error:", err);
      toast.error(err.message || "এআই দিয়ে রুটিন প্রসেস করার সময় ত্রুটি ঘটেছে।");
    } finally {
      setIsProcessingAiJson(false);
    }
  };

  // Apply Generated/Parsed JSON Routine Preview to Application State
  const handleApplyJsonPreview = () => {
    if (!aiGeneratedPreview || aiGeneratedPreview.length === 0) {
      toast.error("প্রয়োগ করার মতো কোনো রুটিন স্লট তৈরি হয়নি!");
      return;
    }

    if (jsonImportStrategy === "replace") {
      commitRoutineChange(aiGeneratedPreview);
      toast.success(`🎉 ${aiGeneratedPreview.length}টি রুটিন স্লট সম্পূর্ণভাবে নতুন রুটিন হিসেবে প্রতিস্থাপন করা হয়েছে!`);
    } else {
      const existingKeys = new Set(
        routines.map((r) => `${r.day}_${r.periodNo}_${r.classId}_${r.tradeCode || ''}`)
      );
      const newItems = aiGeneratedPreview.filter(
        (r) => !existingKeys.has(`${r.day}_${r.periodNo}_${r.classId}_${r.tradeCode || ''}`)
      );
      commitRoutineChange([...routines, ...newItems]);
      toast.success(`🎉 ${newItems.length}টি নতুন রুটিন স্লট বর্তমান রুটিনের সাথে সংযুক্ত করা হয়েছে!`);
    }

    setShowJsonUploadModal(false);
    setUploadedJsonData(null);
    setAiGeneratedPreview(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // AI Smart Routine Generator Engine
  const handleAutoGenerateRoutine = () => {
    setIsSaving(true);
    const targetClass = ACADEMIC_CLASSES.find((c) => String(c.id) === selectedClassId) || ACADEMIC_CLASSES[0];

    const mappedSubjects = getSingleSourceSubjects({
      classVal: selectedClassId,
      tradeVal: targetClass.hasTrade ? selectedTradeCode : undefined,
      academicYear,
    });

    if (mappedSubjects.length === 0) {
      toast.error("এই শ্রেণির জন্য কোনো পাঠ্যসূচি ম্যাপ করা নেই!");
      setIsSaving(false);
      return;
    }

    const remainingRoutines = routines.filter(
      (r) => !(r.classId === targetClass.id && (r.tradeCode === selectedTradeCode || !r.tradeCode || !targetClass.hasTrade))
    );

    const newSlots: RoutineItem[] = [];
    const facultyPool = safeFaculty.filter((f) => f.type === "faculty");
    let subjectIndex = 0;

    ROUTINE_DAYS.forEach((day) => {
      let p = 1;
      while (p <= totalPeriods) {
        if (tiffinBreakEnabled && p === tiffinBreakAfterPeriod) {
          p++;
          continue;
        }

        const subj = mappedSubjects[subjectIndex % mappedSubjects.length];
        subjectIndex++;

        const isLabSubj = subj.category === "Lab" || subj.category === "Workshop";
        const duration = isLabSubj ? 80 : 40;
        const span = getSlotSpan(duration);

        if (p + span - 1 > totalPeriods) {
          p++;
          continue;
        }

        const busyTeachers = new Set<string>();
        [...remainingRoutines, ...newSlots].forEach((r) => {
          if (r.day?.toLowerCase() === day.toLowerCase() && r.teacherName) {
            const rSpan = getSlotSpan(r.durationMinutes);
            const rStart = r.periodNo;
            const rEnd = rStart + rSpan - 1;
            const overlaps = !(p + span - 1 < rStart || rEnd < p);
            if (overlaps) busyTeachers.add(r.teacherName.trim().toLowerCase());
          }
        });

        const freeFaculty = facultyPool.filter((f) => !busyTeachers.has(f.name.trim().toLowerCase()));
        const assignedTeacher = freeFaculty.length > 0 ? freeFaculty[0].name : (facultyPool[0]?.name || "ইন্সট্রাক্টর");

        const assignedRoom = isLabSubj ? "ল্যাব-০১" : `রুম-${100 + (p % 4) + 1}`;

        const startSlot = generatedTimeSlots.find((s) => s.period === p);
        const endSlot = generatedTimeSlots.find((s) => s.period === p + span - 1);

        newSlots.push({
          id: Date.now() + Math.random(),
          academicYear,
          classId: targetClass.id,
          className: targetClass.name,
          tradeCode: targetClass.hasTrade ? selectedTradeCode : "",
          day: day as any,
          periodNo: p,
          startTime: startSlot?.startTime || "08:00",
          endTime: endSlot?.endTime || startSlot?.endTime || "08:40",
          durationMinutes: duration,
          subjectCode: subj.code,
          subjectName: subj.nameBangla || subj.name,
          subjectNameBangla: subj.nameBangla || subj.name,
          teacherName: assignedTeacher,
          teacherBangla: assignedTeacher,
          roomNo: assignedRoom,
          isLab: isLabSubj,
          status: "published",
        });

        p += span;
      }
    });

    const updated = [...remainingRoutines, ...newSlots];
    commitRoutineChange(updated);
    toast.success(`✨ ${targetClass.name} শ্রেণির জন্য ${newSlots.length}টি শূন্য-কনফ্লিক্ট রুটিন স্লট অটো-জেনারেট করা হয়েছে!`);
    setShowAutoScheduleModal(false);
  };

  // Smart 1-Click Conflict Resolver Engine
  const handleResolveConflicts = () => {
    let resolvedCount = 0;
    const updatedRoutines = routines.map((r) => {
      if (!checkSlotConflict(r)) return r;

      const freeTeachers = getFreeTeachers(r.day, r.periodNo, r.durationMinutes || 40);
      if (freeTeachers.length > 0) {
        resolvedCount++;
        return {
          ...r,
          teacherName: freeTeachers[0].name,
          teacherBangla: freeTeachers[0].name,
        };
      }
      return r;
    });

    if (resolvedCount > 0) {
      commitRoutineChange(updatedRoutines);
      toast.success(`🎉 ${resolvedCount}টি ক্লাসের শিক্ষক কনফ্লিক্ট স্বয়ংক্রিয়ভাবে নিরসন করা হয়েছে!`);
    } else {
      toast.info("স্বয়ংক্রিয়ভাবে সমাধান করার মতো কোনো মুক্ত কনফ্লিক্ট পাওয়া যায়নি।");
    }
  };

  // Automated Load Validator Calculation (Sums teaching minutes, checks institutional thresholds)
  const facultyWorkloadStats = useMemo(() => {
    const allFac = safeFaculty.filter((f) => f.type === "faculty");
    return allFac.map((teacher) => {
      const teacherRoutines = routines.filter(
        (r) =>
          r.teacherName?.toLowerCase().includes(teacher.name.toLowerCase()) ||
          (teacher.nameBangla && r.teacherName?.includes(teacher.nameBangla))
      );

      const totalMinutes = teacherRoutines.reduce((acc, r) => acc + (r.durationMinutes || 40), 0);
      const totalPeriodsLoad = teacherRoutines.reduce((acc, r) => {
        const dur = r.durationMinutes || 40;
        if (dur >= 160) return acc + 4;
        if (dur >= 120) return acc + 3;
        if (dur >= 80) return acc + 2;
        return acc + 1;
      }, 0);

      const singlePeriods = teacherRoutines.filter((r) => !r.durationMinutes || r.durationMinutes <= 40).length;
      const doublePeriods = teacherRoutines.filter((r) => r.durationMinutes && r.durationMinutes >= 80 && r.durationMinutes < 120).length;
      const triplePeriods = teacherRoutines.filter((r) => r.durationMinutes && r.durationMinutes >= 120 && r.durationMinutes < 160).length;
      const quadPeriods = teacherRoutines.filter((r) => r.durationMinutes && r.durationMinutes >= 160).length;
      const labCount = teacherRoutines.filter((r) => r.isLab || (r.durationMinutes && r.durationMinutes >= 80)).length;

      // Institutional capacity: Standard maximum is 24 periods / 960 minutes per week
      const maxCapacityPeriods = 24;
      const maxCapacityMinutes = 960;
      const isOverloaded = totalPeriodsLoad > maxCapacityPeriods || totalMinutes > maxCapacityMinutes;
      const isUnderloaded = totalPeriodsLoad < 16;
      const isNormal = !isOverloaded && !isUnderloaded;

      const percentage = Math.min(100, Math.round((totalMinutes / maxCapacityMinutes) * 100));

      return {
        teacher,
        routines: teacherRoutines,
        classCount: teacherRoutines.length,
        totalMinutes,
        totalPeriodsLoad,
        singlePeriods,
        doublePeriods,
        triplePeriods,
        quadPeriods,
        labCount,
        isOverloaded,
        isUnderloaded,
        isNormal,
        percentage,
        excessPeriods: Math.max(0, totalPeriodsLoad - maxCapacityPeriods),
        excessMinutes: Math.max(0, totalMinutes - maxCapacityMinutes),
      };
    });
  }, [safeFaculty, routines]);

  const filteredWorkloadStats = useMemo(() => {
    return facultyWorkloadStats.filter((item) => {
      const q = workloadSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.teacher.name.toLowerCase().includes(q) ||
        (item.teacher.nameBangla && item.teacher.nameBangla.toLowerCase().includes(q)) ||
        (item.teacher.department && item.teacher.department.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (workloadStatusFilter === "overloaded") return item.isOverloaded;
      if (workloadStatusFilter === "normal") return item.isNormal;
      if (workloadStatusFilter === "underloaded") return item.isUnderloaded;
      return true;
    });
  }, [facultyWorkloadStats, workloadSearchQuery, workloadStatusFilter]);

  const handleExportWorkloadCsv = () => {
    const headers = "ক্রমিক,শিক্ষকের নাম,পদবি,বিভাগ,মোট ক্লাস সংখ্যা,মোট সময় (মিনিট),৪০ মি. ক্লাস,৮০ মি. ক্লাস,ল্যাব ক্লাস (১২০/১৬০ মি.),স্ট্যাটাস\n";
    const rows = facultyWorkloadStats.map((s, idx) =>
      `"${idx + 1}","${s.teacher.name} (${s.teacher.nameBangla || ''})","${s.teacher.designation || ''}","${s.teacher.department || ''}","${s.totalPeriodsLoad}","${s.totalMinutes}","${s.singlePeriods}","${s.doublePeriods}","${s.triplePeriods + s.quadPeriods}","${s.isOverloaded ? 'অতিরিক্ত লোড (ওভারলোডেড)' : s.isNormal ? 'সন্তোষজনক' : 'আন্ডারলোড'}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PTSC_Teacher_Workload_Audit_${academicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("শিক্ষক লোড অডিট রিপোর্ট CSV ফাইল ডাউনলোড হয়েছে।");
  };

  return (
    <div className="ptsc-master-routine-studio space-y-8 w-full max-w-7xl mx-auto text-slate-100 font-sans pb-16 bg-slate-950 p-2 sm:p-6 rounded-3xl relative overflow-x-hidden">
      <Toaster position="top-right" richColors />

      {/* Floating Success Alert Banner */}
      {saveSuccessBanner && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white font-black text-xs shadow-2xl border border-emerald-400/60 flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-white animate-bounce shrink-0" />
          <span className="tracking-wide text-white">{saveSuccessBanner}</span>
          <button
            type="button"
            onClick={() => setSaveSuccessBanner(null)}
            className="ml-2 p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Perspective Header with Export to PDF, Undo/Redo & Auto-Saving Indicator in Top-Right */}
      <div className="perspective-header p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden relative">
        {/* Subtle Auto-Saving Indicator in Top-Right Corner */}
        <div className="absolute top-4 right-6 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-[11px] font-medium shadow-xs">
          {isSaving ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-300 flex items-center gap-1 font-semibold">
                <Loader2 className="w-3 h-3 animate-spin" /> Auto-saving...
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-slate-300">All changes saved</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 pt-4 sm:pt-0">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">
                MASTER ROUTINE STUDIO • AUTO-SAVING & UNDO/REDO
              </span>
              <span className="text-xs text-slate-400">পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ</span>
            </div>
            <h1 className="text-xl font-black text-white mt-1">
              মাস্টার রুটিন স্টুডিও (অটো-সেভিং স্ট্যাটাস ও আনডু/রিডো ইঞ্জিন)
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Undo / Redo Controls */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-slate-900 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Undo ({history.length})</span>
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-slate-900 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Redo ({redoStack.length})</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJson}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition cursor-pointer"
            title="JSON রুটিন ফাইল আপলোড ও ইমপোর্ট করুন"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import JSON</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <button
            id="print-routine-btn"
            onClick={() => setShowPrintModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition cursor-pointer print:hidden"
            title="ক্লাসরুম উপযোগী রুটিন প্রিন্ট বা PDF তৈরি করুন"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট কাস্টমাইজার (Print Studio)</span>
          </button>
        </div>
      </div>

      {/* View Switcher Tabs Bar */}
      <div className="print:hidden flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl self-start">
        <button
          onClick={() => setActiveTab("class")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "class" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>ক্লাস-ভিত্তিক দৃষ্টিভঙ্গি (Class Matrix)</span>
        </button>

        <button
          onClick={() => setActiveTab("teacher")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "teacher" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>শিক্ষক-ভিত্তিক দৃষ্টিভঙ্গি ও অ্যাভেইলাবিলিটি</span>
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "config" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>গ্লোবাল কনফিগারেশন (Phase 1)</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: CLASS-WISE PERSPECTIVE (WITH GHOST DRAG & GREEN DROP-ZONE) */}
      {/* ============================================================== */}
      {activeTab === "class" && (
        <div className="space-y-6">
          {/* Official Timing, Theme Selector & Advanced Control Bar */}
          <div className="print:hidden p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  সময়সূচি: সকাল ০৮:০০ - দুপুর ০১:৫০
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-amber-300 border border-slate-700 font-bold flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-400" />
                  টিফিন: সকাল ১০:৪০ - ১১:১০
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                  রবিবার - বৃহস্পতিবার
                </span>
              </div>

              {/* Color Theme Selector Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto max-w-full">
                <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1 shrink-0">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  <span>কালার থিম:</span>
                </span>
                {[
                  { id: "vivid", name: "🌈 ভ্যালিড কালারফুল", color: "from-cyan-500 to-indigo-500" },
                  { id: "pastel", name: "🌸 সফট প্যাস্টেল", color: "from-amber-400 to-rose-400" },
                  { id: "emerald", name: "🌲 একাডেমি গ্রিন", color: "from-emerald-500 to-teal-500" },
                  { id: "cyber", name: "⚡ নিয়ন সাইবার", color: "from-cyan-400 to-fuchsia-500" },
                  { id: "royal", name: "👑 রয়েল পার্পল", color: "from-purple-500 to-indigo-600" },
                  { id: "slate", name: "📓 ক্লাসিক স্লেট", color: "from-slate-600 to-slate-400" },
                ].map((thm) => (
                  <button
                    key={thm.id}
                    onClick={() => setScreenTheme(thm.id as any)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                      screenTheme === thm.id
                        ? `bg-gradient-to-r ${thm.color} text-white shadow-md ring-1 ring-white/30`
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {thm.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced AI & Resource Helper Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowAutoScheduleModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="এআই দিয়ে স্বয়ংক্রিয় শূন্য-কনফ্লিক্ট রুটিন জেনারেট করুন"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: "6s" }} />
                  <span>✨ এআই স্মার্ট রুটিন জেনারেটর</span>
                </button>

                <button
                  onClick={() => setShowRoomMatrixModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="১৫টি ক্লাসরুম ও টেকনিক্যাল ল্যাবের বাস্তব সময় ব্যবহার দেখুন"
                >
                  <Building className="w-4 h-4 text-indigo-400" />
                  <span>🏢 রুম ও ল্যাব দখল সূচক</span>
                </button>

                {routines.some((r) => checkSlotConflict(r)) && (
                  <button
                    onClick={handleResolveConflicts}
                    className="px-3.5 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer animate-pulse"
                    title="১-ক্লিকে সকল শিক্ষক কনফ্লিক্ট স্বয়ংক্রিয়ভাবে নিরসন করুন"
                  >
                    <Zap className="w-4 h-4 text-rose-400" />
                    <span>⚠️ ১-ক্লিক কনফ্লিক্ট নিরসন</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSubstituteModalTargetTeacher("");
                    setSubstituteModalTargetDay("Sunday");
                    setSubstituteModalTargetPeriod(undefined);
                    setShowSubstituteModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="অনুপস্থিত শিক্ষক ও অটো-সাবস্টিটিউট ফাইন্ডার"
                >
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>অটো-সাবস্টিটিউট ফাইন্ডার</span>
                </button>

                <button
                  onClick={() => setShowWorkloadModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>শিক্ষক কর্মঘণ্টা অডিট</span>
                </button>
              </div>
            </div>
          </div>

          <div className="print:hidden p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            {(() => {
              const cls = ACADEMIC_CLASSES.find((c) => String(c.id) === selectedClassId) || ACADEMIC_CLASSES[0];
              const classMappedSubjects = getSingleSourceSubjects({
                classVal: selectedClassId,
                tradeVal: cls.hasTrade ? selectedTradeCode : undefined,
                academicYear,
              });
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-9 rounded-3xl overflow-hidden border border-slate-800 p-1 bg-slate-900 text-left">
                      <AcademicFilterBar
                        filter={{
                          session: "2026",
                          classId: selectedClassId,
                          tradeId: (() => {
                            const matched = ALL_TRADES.find((t) => t.code === selectedTradeCode);
                            return matched ? String(matched.id) : "";
                          })(),
                          tradeCode: selectedTradeCode,
                          section: "all",
                          department: "all"
                        }}
                        onChange={(newFilter) => {
                          setSelectedClassId(newFilter.classId);
                          if (newFilter.tradeId && newFilter.tradeId !== "all") {
                            const matched = ALL_TRADES.find((t) => String(t.id) === String(newFilter.tradeId));
                            if (matched) {
                              setSelectedTradeCode(matched.code);
                            }
                          } else {
                            const applicable = getApplicableTradesForClass(newFilter.classId);
                            setSelectedTradeCode(applicable[0]?.code || "");
                          }
                        }}
                        showSession={false}
                        showDepartment={false}
                        showSection={false}
                        compact={true}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <button
                        onClick={() => setShowPrintModal(true)}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                        title="এই ক্লাসের রুটিন কাস্টমাইজ ও প্রিন্ট বা PDF তৈরি করুন"
                      >
                        <Printer className="w-4 h-4" />
                        <span>প্রিন্ট কাস্টমাইজার (Print Studio)</span>
                      </button>
                    </div>
                  </div>

                  {/* Mapped Subjects Bar from Global Settings */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-400 font-bold flex items-center gap-1.5 shrink-0">
                        <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                        <span>গ্লোবাল ম্যাপড পাঠ্যসূচি ({classMappedSubjects.length}টি বিষয়):</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {classMappedSubjects.map((s) => (
                          <span
                            key={s.code}
                            className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-medium"
                            title={`${s.name} · ${s.category} · সাপ্তাহিক ${s.weeklyPeriods} পিরিয়ড`}
                          >
                            <strong className="text-cyan-400 font-mono mr-1">{s.code}</strong>
                            {s.nameBangla}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Render Class Matrix with Ghost Drag & Drop-Zone Indicator */}
          {(() => {
            const cls = ACADEMIC_CLASSES.find((c) => String(c.id) === selectedClassId) || ACADEMIC_CLASSES[0];
            const trade = ALL_TRADES.find((t) => t.code === selectedTradeCode) || ALL_TRADES[0];

            return (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 print:bg-white print:text-black print:border-none print:shadow-none print:p-0 print:m-0 print:space-y-3">
                {/* Official Institutional Classroom Print Header */}
                <div className="hidden print:block border-b-2 border-black pb-3 text-center space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-black/30 text-[10px] text-slate-800 dark:text-slate-200 font-semibold">
                    <span>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · কারিগরি শিক্ষা অধিদপ্তর</span>
                    <span>স্মারক নং: {memoNo}</span>
                  </div>
                  <h1 className="text-xl font-black tracking-wide text-black dark:text-white uppercase">
                    পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ, পঞ্চগড়
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    ওয়েবসাইট: tsc.panchagarh.gov.bd · ইমেইল: principal@panchagarhtsc.edu.bd
                  </p>
                  <div className="pt-1">
                    <span className="inline-block px-4 py-1 border-2 border-black rounded-full font-black text-xs tracking-wider uppercase bg-slate-100 dark:bg-slate-800 text-black dark:text-white">
                      শ্রেণিভিত্তিক মাস্টার ক্লাস রুটিন — শিক্ষাবর্ষ: {academicYear}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 text-xs pt-2 font-bold text-slate-900 dark:text-slate-100 border-t border-dashed border-black/50">
                    <div className="text-left">
                      শ্রেণি: <span className="underline">{cls.name} ({cls.nameBangla})</span>
                    </div>
                    <div className="text-center">
                      ট্রেড: <span className="underline">{cls.hasTrade ? `${trade.nameBangla} (${trade.code})` : "সাধারণ শিক্ষা (Pre-Vocational)"}</span>
                    </div>
                    <div className="text-right">
                      শিফট: <span className="underline">{shift === "morning" ? "প্রভাতি (Morning)" : "দিবা (Day)"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800 print:hidden">
                  <div>
                    <h3 className="text-base font-bold text-white print:text-black">
                      {cls.name} — {trade.nameBangla} ({trade.code})
                    </h3>
                    <p className="text-xs text-slate-400">শিক্ষাবর্ষ: {academicYear} | শিফট: {shift === 'morning' ? 'প্রভাতি' : 'দিবা'}</p>
                  </div>
                  <div className="text-xs font-mono bg-indigo-950 text-indigo-300 px-3 py-1 rounded-lg border border-indigo-800 print:bg-slate-100 print:text-black">
                    স্মারক: {memoNo}
                  </div>
                </div>

                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-left border-collapse text-xs print:border-2 print:border-black print:text-[10px]">
                    <thead>
                      <tr className="bg-slate-950 text-slate-300 print:bg-slate-100 print:text-black border-b border-slate-800 print:border-b-2 print:border-black">
                        <th className="p-3 font-bold border-r border-slate-800 print:border-r print:border-black w-24 text-center print:text-black">
                          বার / দিন
                        </th>
                        {generatedTimeSlots.map((slot, idx) => (
                          <th
                            key={idx}
                            className={`p-2.5 font-bold border-r border-slate-800 print:border-r print:border-black text-center ${
                              slot.isBreak ? "bg-amber-950/40 text-amber-300 print:bg-slate-200 print:text-black" : ""
                            }`}
                          >
                            {slot.isBreak ? (
                              <div>
                                <div className="font-bold text-xs text-amber-400 print:text-black">টিফিন বিরতি</div>
                                <div className="text-[10px] text-amber-300/80 print:text-slate-700 font-mono">
                                  {toBengaliNumerals(slot.startTime)} - {toBengaliNumerals(slot.endTime)}
                                </div>
                              </div>
                            ) : (
                              <div className="font-black text-xs text-white print:text-black tracking-wide font-mono">
                                {toBengaliNumerals(slot.startTime)} - {toBengaliNumerals(slot.endTime)}
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 print:divide-black">
                      {ROUTINE_DAYS.map((day) => {
                        let skipCount = 0;
                        return (
                          <tr key={day} className="hover:bg-slate-800/40 transition print:border-b print:border-black">
                            <td className="p-3 font-black bg-slate-950/60 border-r border-slate-800 text-indigo-300 print:bg-slate-100 print:text-black print:border-r print:border-black text-center">
                              {ROUTINE_DAYS_BN[day] || day}
                            </td>
                            {generatedTimeSlots.map((slot, idx) => {
                              if (skipCount > 0) {
                                skipCount--;
                                return null;
                              }

                              if (slot.isBreak) {
                                return (
                                  <td
                                    key={idx}
                                    className="p-2 text-center bg-amber-950/20 text-amber-400 font-bold border-r border-slate-800 print:border-r print:border-black print:bg-slate-200 print:text-black italic text-[11px]"
                                  >
                                    টিফিন বিরতি
                                    <div className="text-[9px] opacity-80 font-mono">({slot.startTime} - {slot.endTime})</div>
                                  </td>
                                );
                              }

                              const routineItem = routines.find(
                                (r) => r.day?.toLowerCase() === day.toLowerCase() &&
                                       r.periodNo === slot.period &&
                                       r.classId === cls.id &&
                                       (r.tradeCode === trade.code || !r.tradeCode || !cls.hasTrade)
                              );

                              const rawSpan = routineItem ? getSlotSpan(routineItem.durationMinutes) : 1;
                              const maxSpan = slot.period <= 4 ? (4 - slot.period + 1) : (8 - slot.period + 1);
                              const colSpan = Math.min(rawSpan, maxSpan);

                              if (colSpan > 1) {
                                skipCount = colSpan - 1;
                              }

                              const endSlot = colSpan > 1 ? generatedTimeSlots.find((s) => s.period === slot.period + colSpan - 1) : null;
                              const displayTimeRange = colSpan > 1 && endSlot
                                ? `${slot.startTime} - ${endSlot.endTime}`
                                : `${slot.startTime} - ${slot.endTime}`;

                              const hasConflict = routineItem ? checkSlotConflict(routineItem) : false;
                              const isBeingDragged = draggingRoutineId !== null && routineItem && String(routineItem.id) === String(draggingRoutineId);
                              const isDropZone = draggingRoutineId !== null && !routineItem;

                              return (
                                <td
                                  key={idx}
                                  colSpan={colSpan}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, day, slot.period, cls.id, trade.code)}
                                  onClick={() => handleOpenCellModal(day, slot.period, cls.id, trade.code)}
                                  className={`p-1.5 border-r border-slate-800 print:border-r print:border-black cursor-pointer group transition-all duration-300 align-top print:p-1.5 ${
                                    isDropZone ? "bg-emerald-950/40 border-emerald-500/80 ring-2 ring-emerald-500/30 animate-pulse" : "hover:bg-indigo-950/30"
                                  }`}
                                >
                                {routineItem ? (
                                  <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, routineItem.id)}
                                    onDragEnd={handleDragEnd}
                                    className={`p-2.5 rounded-2xl border space-y-1.5 transition-all duration-300 cursor-grab active:cursor-grabbing ${
                                      isBeingDragged ? "opacity-40 scale-95 border-dashed border-cyan-400 bg-slate-900" : ""
                                    } ${
                                      hasConflict
                                        ? "bg-rose-950/90 border-rose-500 animate-pulse shadow-lg shadow-rose-500/30 print:animate-none print:bg-rose-100 print:text-rose-950 print:border-rose-600"
                                        : getSubjectThemeStyle(routineItem.subjectCode, routineItem.isLab, routineItem.subjectName)
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      {/* বিষয় (Subject) */}
                                      <div className="flex items-center justify-between gap-1">
                                        <div className="font-black text-white print:text-black text-xs sm:text-[13px] leading-tight truncate flex items-center gap-1">
                                          <GripVertical className="w-3 h-3 text-slate-400 inline print:hidden shrink-0" />
                                          <span className="truncate">
                                            {routineItem.subjectNameBangla || routineItem.subjectName}
                                          </span>
                                        </div>
                                        {hasConflict && (
                                          <span className="text-[9px] px-1 bg-rose-600 text-white rounded font-mono print:hidden shrink-0">
                                            কনফ্লিক্ট
                                          </span>
                                        )}
                                      </div>

                                      {/* কোন স্যারের ক্লাস (Teacher Name) */}
                                      <div className={`text-[11px] print:text-[10px] truncate font-bold ${
                                        hasConflict ? "text-rose-200 print:text-black" : "text-cyan-300 print:text-black"
                                      }`}>
                                        👤 শিক্ষক: {routineItem.teacherName}
                                      </div>

                                      {/* কোন ল্যাবে বা রুমে (Room / Lab) */}
                                      <div className="text-[10px] print:text-[9px] font-semibold text-emerald-300 print:text-black flex items-center justify-between">
                                        <span>
                                          {routineItem.isLab || routineItem.roomNo.includes("ল্যাব") || routineItem.roomNo.includes("Lab") ? "🔬 ল্যাব:" : "🏢 রুম:"} {routineItem.roomNo}
                                        </span>
                                        {routineItem.subjectCode && (
                                          <span className="font-mono text-[9px] text-slate-400 print:text-slate-700">[{routineItem.subjectCode}]</span>
                                        )}
                                      </div>

                                      {/* সময় (Time: যেমন ০৮:০০ - ০৮:৪০ বা ০৮:০০ - ১০:০০) */}
                                      <div className="text-[10px] print:text-[9px] text-amber-300 print:text-black font-extrabold font-mono pt-1 border-t border-slate-700/60 print:border-black/30 flex items-center justify-between">
                                        <span className="font-semibold text-slate-400 print:text-slate-800">সময়:</span>
                                        <span>{toBengaliNumerals(displayTimeRange)}</span>
                                      </div>

                                      {/* Quick Hover Controls (Split / Expand / Edit) */}
                                      <div className="print:hidden pt-1 flex items-center justify-between text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">
                                        {colSpan > 1 ? (
                                          <button
                                            type="button"
                                            onClick={(e) => handleSplitSlot(routineItem, e)}
                                            className="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold transition flex items-center gap-1"
                                            title="স্প্লিট করে ৪০ মিনিটের ক্লাসে রূপান্তর করুন"
                                          >
                                            <span>স্প্লিট</span>
                                          </button>
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            {maxSpan >= 2 && (
                                              <button
                                                type="button"
                                                onClick={(e) => handleExpandSlot(routineItem, 80, e)}
                                                className="px-1.5 py-0.5 rounded bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800 font-bold transition"
                                                title="৮০ মিনিট পর্যন্ত বর্ধিত করুন"
                                              >
                                                +৮০মি
                                              </button>
                                            )}
                                            {maxSpan >= 3 && (
                                              <button
                                                type="button"
                                                onClick={(e) => handleExpandSlot(routineItem, 120, e)}
                                                className="px-1.5 py-0.5 rounded bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800 font-bold transition"
                                                title="১২০ মিনিট পর্যন্ত বর্ধিত করুন"
                                              >
                                                +১২০মি
                                              </button>
                                            )}
                                          </div>
                                        )}
                                        <span className="text-indigo-400 font-bold hover:underline">এডিট</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className={`h-16 rounded-2xl border border-dashed flex flex-col items-center justify-center text-[10px] transition print:border-none print:h-7 ${
                                    isDropZone
                                      ? "border-emerald-500 text-emerald-300 bg-emerald-950/30 font-bold"
                                      : "border-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/50 group-hover:bg-indigo-950/20"
                                  }`}>
                                    <span className="print:hidden font-medium">
                                      {isDropZone ? "এখানে ড্রপ করুন" : "+ ক্লাস যোগ করুন"}
                                    </span>
                                    <span className="print:hidden text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                                      {toBengaliNumerals(slot.startTime)} - {toBengaliNumerals(slot.endTime)}
                                    </span>
                                    <span className="hidden print:inline text-slate-400 font-bold">—</span>
                                  </div>
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

                {/* Official Institutional Signature & Verification Seal for Clean PDF Print */}
                <div className="hidden print:block pt-6 mt-6 border-t-2 border-black page-break-avoid">
                  <div className="grid grid-cols-3 gap-6 items-end text-center">
                    <div className="space-y-1">
                      <div className="h-10 flex items-end justify-center">
                        <span className="font-serif italic text-xs text-slate-700 dark:text-slate-300">[স্বাক্ষরিত]</span>
                      </div>
                      <div className="w-52 mx-auto border-t border-black pt-1">
                        <div className="font-black text-xs text-black dark:text-white">{convenerName}</div>
                        <div className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">আহ্বায়ক / সদস্য-সচিব</div>
                        <div className="text-[9px] text-slate-600 dark:text-slate-400">রুটিন প্রণয়ন ও বাস্তবায়ন কমিটি</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-1">
                      {qrCodeDataUrl ? (
                        <img
                          src={qrCodeDataUrl}
                          alt="Digital Routine Verification QR"
                          className="w-16 h-16 object-contain border border-black p-0.5"
                        />
                      ) : (
                        <div className="w-16 h-16 border border-dashed border-black flex items-center justify-center text-[8px] font-mono">
                          SEAL
                        </div>
                      )}
                      <div className="text-[8px] font-mono text-slate-800 dark:text-slate-200 font-bold">ডিজিটাল ভেরিফিকেশন QR কোড</div>
                      <div className="text-[8px] text-slate-600 dark:text-slate-400">প্রতিষ্ঠানের অফিসিয়াল সিল</div>
                    </div>

                    <div className="space-y-1">
                      <div className="h-10 flex items-end justify-center">
                        <span className="font-serif italic text-xs text-slate-700 dark:text-slate-300">[স্বাক্ষরিত ও অনুমোদিত]</span>
                      </div>
                      <div className="w-52 mx-auto border-t border-black pt-1">
                        <div className="font-black text-xs text-black dark:text-white">{principalName}</div>
                        <div className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">অধ্যক্ষ</div>
                        <div className="text-[9px] text-slate-600 dark:text-slate-400">পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ, পঞ্চগড়</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-dashed border-black/40 flex items-center justify-between text-[9px] text-slate-700 dark:text-slate-300 font-medium">
                    <span>* বিশেষ নির্দেশিকা: ১. ক্লাসের নির্ধারিত সময় অনুযায়ী শিক্ষক ও শিক্ষার্থীদের শ্রেণিকক্ষে উপস্থিতি বাধ্যতামূলক। ২. রুটিনের যে কোনো পরিবর্তন অধ্যক্ষ মহোদয়ের পূর্বানুমোদন সাপেক্ষে হতে হবে।</span>
                    <span>মুদ্রণ তারিখ: {new Date().toLocaleDateString('bn-BD')}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: TEACHER-WISE PERSPECTIVE (DIRECT CRUD & ASSIGNMENT)     */}
      {/* ============================================================== */}
      {activeTab === "teacher" && (
        <div className="teacher-perspective-table space-y-6">
          {/* Official Timing & Institutional Info Bar */}
          <div className="print:hidden p-4 bg-slate-900 border border-slate-800 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-lg">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                ক্লাসের সময়সূচি: সকাল ০৮:০০ - দুপুর ০১:৫০
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-amber-300 border border-slate-700 font-bold flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-400" />
                টিফিন বিরতি: সকাল ১০:৪০ - ১১:১০
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                রবিবার - বৃহস্পতিবার (শুক্রবার ও শনিবার বন্ধ)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSubstituteModalTargetTeacher(selectedTeacherName || "");
                  setSubstituteModalTargetDay("Sunday");
                  setSubstituteModalTargetPeriod(undefined);
                  setShowSubstituteModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="অনুপস্থিত শিক্ষক ও অটো-সাবস্টিটিউট ফাইন্ডার"
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>অটো-সাবস্টিটিউট ফাইন্ডার</span>
              </button>

              <button
                onClick={() => setShowWorkloadModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-2 transition"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>২২ জন শিক্ষকের ক্লাস ও কর্মঘণ্টা ভ্যালিডেটর</span>
              </button>
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">শিক্ষক নির্বাচন করুন:</label>
              <select
                value={selectedTeacherName}
                onChange={(e) => setSelectedTeacherName(e.target.value)}
                className="w-full sm:w-80 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-semibold"
              >
                <option value="">সকল শিক্ষক (All Faculty Members)</option>
                {safeFaculty.filter(f => f.type === "faculty").map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name} ({f.designation || "Instructor"})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition cursor-pointer"
                title="JSON রুটিন ফাইল আপলোড ও ইমপোর্ট করুন"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Import JSON</span>
              </button>

              <button
                onClick={handleExportJson}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition cursor-pointer"
                title="রুটিন JSON ডাউনলোড করুন"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Export JSON</span>
              </button>

              <button
                id="print-routine-teacher-btn"
                onClick={handlePrint}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition cursor-pointer print:hidden"
                title="শিক্ষকের রুটিন প্রিন্ট বা PDF তৈরি করুন"
              >
                <Printer className="w-4 h-4" />
                <span>Print Routine ({selectedTeacherName ? `${selectedTeacherName}-এর রুটিন প্রিন্ট` : "সকল শিক্ষকের রুটিন প্রিন্ট"})</span>
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {safeFaculty
              .filter((f) => f.type === "faculty" && (!selectedTeacherName || f.name === selectedTeacherName))
              .map((teacher) => {
                const teacherRoutines = routines.filter(
                  (r) => r.teacherName.toLowerCase().includes(teacher.name.toLowerCase()) || (teacher.nameBangla && r.teacherName.includes(teacher.nameBangla))
                );

                const classLoad = teacherRoutines.length;
                const uniqueGroups = new Set(teacherRoutines.map(r => r.className)).size;
                const practicalLoad = teacherRoutines.filter(r => r.isLab || r.subjectName.includes("TP") || r.subjectName.includes("Practical") || r.subjectName.includes("ল্যাব")).length;
                const theoryLoad = classLoad - practicalLoad;
                
                const totalTeachingMinutes = teacherRoutines.reduce((acc, r) => acc + (r.durationMinutes || 40), 0);
                const institutionalMaxMinutes = 1350; // max weekly capacity threshold
                const isOverloaded = totalTeachingMinutes > institutionalMaxMinutes;

                return (
                  <div key={teacher.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 print:bg-white print:text-black print:border-none print:shadow-none print:p-0 print:m-0 print:space-y-3 page-break-always">
                    {/* Official Institutional Classroom Print Header for Teacher */}
                    <div className="hidden print:block border-b-2 border-black pb-3 text-center space-y-1.5">
                      <div className="flex items-center justify-between pb-1 border-b border-black/30 text-[10px] text-slate-800 dark:text-slate-200 font-semibold">
                        <span>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · কারিগরি শিক্ষা অধিদপ্তর</span>
                        <span>স্মারক নং: {memoNo}</span>
                      </div>
                      <h1 className="text-xl font-black tracking-wide text-black dark:text-white uppercase">
                        পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ, পঞ্চগড়
                      </h1>
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        ওয়েবসাইট: tsc.panchagarh.gov.bd · ইমেইল: principal@panchagarhtsc.edu.bd
                      </p>
                      <div className="pt-1">
                        <span className="inline-block px-4 py-1 border-2 border-black rounded-full font-black text-xs tracking-wider uppercase bg-slate-100 dark:bg-slate-800 text-black dark:text-white">
                          শিক্ষকভিত্তিক ক্লাস রুটিন ও কর্মঘণ্টা — শিক্ষাবর্ষ: {academicYear}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 text-xs pt-2 font-bold text-slate-900 dark:text-slate-100 border-t border-dashed border-black/50">
                        <div className="text-left">
                          শিক্ষকের নাম: <span className="underline">{teacher.name} ({teacher.nameBangla || teacher.name})</span>
                        </div>
                        <div className="text-center">
                          পদবি ও বিভাগ: <span className="underline">{teacher.designation || "ইন্সট্রাক্টর"} ({teacher.department || "প্রকৌশল"})</span>
                        </div>
                        <div className="text-right">
                          মোট ক্লাস: <span className="underline">{toBengaliNumerals(classLoad)} টি ({toBengaliNumerals(totalTeachingMinutes)} মিনিট)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 print:hidden gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white print:text-black">শিক্ষক: {teacher.name} {teacher.nameBangla ? `(${teacher.nameBangla})` : ""}</h3>
                          {isOverloaded && (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> ⚠️ অতিরিক্ত ক্লাস লোড ({toBengaliNumerals(totalTeachingMinutes)} মি.)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 print:text-slate-600">{teacher.designation} · {teacher.department}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-slate-950/90 border border-slate-800 rounded-2xl text-xs font-bold text-slate-300 print:bg-slate-100 print:text-black print:border-slate-300 shadow">
                        <span>মোট ক্লাস: <strong className="text-cyan-400 print:text-black">{toBengaliNumerals(classLoad)}টি</strong></span>
                        <span>|</span>
                        <span>শ্রেণি সংখ্যা: <strong className="text-indigo-400 print:text-black">{toBengaliNumerals(uniqueGroups)}টি</strong></span>
                        <span>|</span>
                        <span>ব্যবহারিক/ল্যাব: <strong className="text-emerald-400 print:text-black">{toBengaliNumerals(practicalLoad)}টি</strong></span>
                        <span>|</span>
                        <span>তত্ত্বীয়: <strong className="text-amber-400 print:text-black">{toBengaliNumerals(theoryLoad)}টি</strong></span>
                        <span>|</span>
                        <span>মোট সময়: <strong className={isOverloaded ? "text-rose-400" : "text-cyan-300"}>{toBengaliNumerals(totalTeachingMinutes)} মিনিট</strong></span>
                      </div>
                    </div>

                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full text-left border-collapse text-xs print:border-2 print:border-black print:text-[10px]">
                        <thead>
                          <tr className="bg-slate-950 text-slate-300 print:bg-slate-100 print:text-black border-b border-slate-800 print:border-b-2 print:border-black">
                            <th className="p-3 font-bold border-r border-slate-800 print:border-r print:border-black w-24 text-center print:text-black">
                              বার / দিন
                            </th>
                            {generatedTimeSlots.map((slot, idx) => (
                              <th
                                key={idx}
                                className={`p-2.5 font-bold border-r border-slate-800 print:border-r print:border-black text-center ${
                                  slot.isBreak ? "bg-amber-950/40 text-amber-300 print:bg-slate-200 print:text-black" : ""
                                }`}
                              >
                                {slot.isBreak ? (
                                  <div>
                                    <div className="font-bold text-xs text-amber-400 print:text-black">টিফিন বিরতি</div>
                                    <div className="text-[10px] text-amber-300/80 print:text-slate-700 font-mono">
                                      {toBengaliNumerals(slot.startTime)} - {toBengaliNumerals(slot.endTime)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="font-black text-xs text-white print:text-black tracking-wide font-mono">
                                    {toBengaliNumerals(slot.startTime)} - {toBengaliNumerals(slot.endTime)}
                                  </div>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 print:divide-black">
                          {ROUTINE_DAYS.map((day) => {
                            let skipCount = 0;
                            return (
                              <tr key={day} className="hover:bg-slate-800/40 transition print:border-b print:border-black">
                                <td className="p-3 font-black bg-slate-950/60 border-r border-slate-800 text-indigo-300 print:bg-slate-100 print:text-black print:border-r print:border-black text-center">
                                  {ROUTINE_DAYS_BN[day] || day}
                                </td>
                                {generatedTimeSlots.map((slot, idx) => {
                                  if (skipCount > 0) {
                                    skipCount--;
                                    return null;
                                  }

                                  if (slot.isBreak) {
                                    return (
                                      <td
                                        key={idx}
                                        className="p-2 text-center bg-amber-950/20 text-amber-400 font-bold border-r border-slate-800 print:border-r print:border-black print:bg-slate-200 print:text-black italic text-[11px]"
                                      >
                                        টিফিন বিরতি
                                        <div className="text-[9px] opacity-80 font-mono">({slot.startTime} - {slot.endTime})</div>
                                      </td>
                                    );
                                  }

                                  const routineItem = teacherRoutines.find(
                                    (r) => r.day?.toLowerCase() === day.toLowerCase() && r.periodNo === slot.period
                                  );

                                  const rawSpan = routineItem ? getSlotSpan(routineItem.durationMinutes) : 1;
                                  const maxSpan = slot.period <= 4 ? (4 - slot.period + 1) : (8 - slot.period + 1);
                                  const colSpan = Math.min(rawSpan, maxSpan);
                                  if (colSpan > 1) {
                                    skipCount = colSpan - 1;
                                  }

                                  const endSlot = colSpan > 1 ? generatedTimeSlots.find((s) => s.period === slot.period + colSpan - 1) : null;
                                  const displayTimeRange = colSpan > 1 && endSlot
                                    ? `${slot.startTime} - ${endSlot.endTime}`
                                    : `${slot.startTime} - ${slot.endTime}`;

                                  const hasConflict = routineItem ? checkSlotConflict(routineItem) : false;

                                  return (
                                    <td
                                      key={idx}
                                      colSpan={colSpan}
                                      onClick={() => handleOpenCellModal(day, slot.period, routineItem?.classId || 4, routineItem?.tradeCode || "IT-IOT", teacher.name)}
                                      className="p-1.5 border-r border-slate-800 print:border-r print:border-black align-top cursor-pointer group hover:bg-indigo-950/30 transition-all duration-300 print:p-1.5"
                                    >
                                      {routineItem ? (
                                        <div className={`p-2.5 rounded-2xl border space-y-1.5 relative shadow transition-all duration-300 print:border print:border-black print:p-2 print:bg-white print:shadow-none ${
                                          hasConflict
                                            ? "bg-rose-950/90 border-rose-500 animate-pulse shadow-lg shadow-rose-500/30 print:animate-none print:border-black"
                                            : colSpan > 1
                                              ? "bg-gradient-to-br from-indigo-950/90 via-slate-900 to-indigo-950/70 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/30"
                                              : "bg-indigo-950/80 border-indigo-700"
                                        }`}>
                                          {/* শ্রেণি ও ট্রেড */}
                                          <div className="font-extrabold text-indigo-300 print:text-black text-[11px] print:text-[10px] truncate flex items-center justify-between gap-1">
                                            <span className="font-black truncate">
                                              🎓 শ্রেণি: {routineItem.className} {routineItem.tradeCode ? `(${routineItem.tradeCode})` : ""}
                                            </span>
                                            {hasConflict && <span className="text-[9px] px-1 bg-rose-600 text-white rounded font-mono print:hidden">CONFLICT</span>}
                                          </div>

                                          {/* বিষয় (Subject) */}
                                          <div className={`text-[12px] print:text-[11px] leading-tight font-black ${
                                            hasConflict ? "text-rose-200 print:text-black" : "text-white print:text-black"
                                          }`}>
                                            📚 বিষয়: {routineItem.subjectNameBangla || routineItem.subjectName}
                                          </div>

                                          {/* রুম বা ল্যাব */}
                                          <div className="text-[10px] print:text-[9px] font-semibold text-emerald-300 print:text-black flex items-center justify-between">
                                            <span>
                                              {routineItem.isLab || routineItem.roomNo.includes("ল্যাব") || routineItem.roomNo.includes("Lab") ? "🔬 ল্যাব:" : "🏢 রুম:"} {routineItem.roomNo}
                                            </span>
                                            {routineItem.subjectCode && (
                                              <span className="font-mono text-[9px] text-slate-400 print:text-slate-700">[{routineItem.subjectCode}]</span>
                                            )}
                                          </div>

                                          {/* সময় (Time) যেমন: ০৮:০০ - ০৮:৪০ বা ০৮:০০ - ১০:০০ */}
                                          <div className="text-[10px] print:text-[9px] font-black text-amber-300 print:text-black font-mono pt-1 border-t border-indigo-900/60 print:border-black/30 flex items-center justify-between">
                                            <span className="font-semibold text-slate-400 print:text-slate-800">সময়:</span>
                                            <span>{toBengaliNumerals(displayTimeRange)}</span>
                                          </div>

                                          {colSpan > 1 && (
                                            <div className="print:hidden pt-1 flex items-center justify-between text-[9px]">
                                              <button
                                                type="button"
                                                onClick={(e) => handleSplitSlot(routineItem, e)}
                                                className="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold transition flex items-center gap-1"
                                                title="স্প্লিট করে ৪০ মিনিটের ক্লাসে রূপান্তর করুন"
                                              >
                                                <span>স্প্লিট</span>
                                              </button>
                                              <span className="text-indigo-400 group-hover:underline font-bold">এডিট</span>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="h-14 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-[10px] text-slate-600 dark:text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/50 transition print:border-none print:h-7">
                                          <span className="print:hidden font-medium">+ ক্লাস এসাইন</span>
                                          <span className="print:hidden text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                                            {toBengaliNumerals(slot.startTime)} - {toBengaliNumerals(slot.endTime)}
                                          </span>
                                          <span className="hidden print:inline text-slate-400 font-bold">—</span>
                                        </div>
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

                    {/* Official Institutional Signature & Verification Seal for Clean PDF Print */}
                    <div className="hidden print:block pt-6 mt-6 border-t-2 border-black page-break-avoid">
                      <div className="grid grid-cols-3 gap-6 items-end text-center">
                        <div className="space-y-1">
                          <div className="h-10 flex items-end justify-center">
                            <span className="font-serif italic text-xs text-slate-700 dark:text-slate-300">[স্বাক্ষরিত]</span>
                          </div>
                          <div className="w-52 mx-auto border-t border-black pt-1">
                            <div className="font-black text-xs text-black dark:text-white">{convenerName}</div>
                            <div className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">আহ্বায়ক / সদস্য-সচিব</div>
                            <div className="text-[9px] text-slate-600 dark:text-slate-400">রুটিন প্রণয়ন ও বাস্তবায়ন কমিটি</div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center space-y-1">
                          {qrCodeDataUrl ? (
                            <img
                              src={qrCodeDataUrl}
                              alt="Digital Routine Verification QR"
                              className="w-16 h-16 object-contain border border-black p-0.5"
                            />
                          ) : (
                            <div className="w-16 h-16 border border-dashed border-black flex items-center justify-center text-[8px] font-mono">
                              SEAL
                            </div>
                          )}
                          <div className="text-[8px] font-mono text-slate-800 dark:text-slate-200 font-bold">ডিজিটাল ভেরিফিকেশন QR কোড</div>
                          <div className="text-[8px] text-slate-600 dark:text-slate-400">প্রতিষ্ঠানের অফিসিয়াল সিল</div>
                        </div>

                        <div className="space-y-1">
                          <div className="h-10 flex items-end justify-center">
                            <span className="font-serif italic text-xs text-slate-700 dark:text-slate-300">[স্বাক্ষরিত ও অনুমোদিত]</span>
                          </div>
                          <div className="w-52 mx-auto border-t border-black pt-1">
                            <div className="font-black text-xs text-black dark:text-white">{principalName}</div>
                            <div className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">অধ্যক্ষ</div>
                            <div className="text-[9px] text-slate-600 dark:text-slate-400">পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ, পঞ্চগড়</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-2 border-t border-dashed border-black/40 flex items-center justify-between text-[9px] text-slate-700 dark:text-slate-300 font-medium">
                        <span>* বিশেষ নির্দেশিকা: ১. সংশ্লিষ্ট শিক্ষককে রুটিনের নির্ধারিত সময় অনুযায়ী পাঠদান কার্যক্রম পরিচালনা করতে হবে। ২. কর্তৃপক্ষ প্রয়োজনবোধে রুটিনে পরিবর্তন আনার অধিকার সংরক্ষণ করে।</span>
                        <span>মুদ্রণ তারিখ: {new Date().toLocaleDateString('bn-BD')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: GLOBAL CONFIGURATION (PHASE 1)                          */}
      {/* ============================================================== */}
      {activeTab === "config" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white">গ্লোবাল কনফিগারেশন ও সেটিংস (Phase 1)</h3>
              <p className="text-xs text-slate-400">একাডেমিক বছর, ক্লাসের সময়সীমা এবং টিফিন বিরতি কাস্টমাইজ করুন।</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">একাডেমিক বছর (Academic Year):</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">ডিফল্ট ক্লাসের সময়কাল (Default Class Duration):</label>
                <select
                  value={periodDuration}
                  onChange={(e) => setPeriodDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold"
                >
                  <option value={40}>৪০ মিনিট (Standard 40 Mins)</option>
                  <option value={45}>৪৫ মিনিট (Standard 45 Mins)</option>
                  <option value={50}>৫০ মিনিট (50 Mins)</option>
                  <option value={60}>৬০ মিনিট (1 Hour)</option>
                  <option value={80}>৮০ মিনিট (ডাবল ক্লাস)</option>
                  <option value={120}>১২০ মিনিট (ল্যাব সেশন)</option>
                </select>
              </div>

              {/* Per-Period Individual Customization */}
              <div className="md:col-span-2 pt-4 border-t border-slate-800">
                <label className="text-xs font-bold text-indigo-300 block mb-2">
                  ⚙️ প্রতিটি ক্লাসের পৃথক সময়কাল কাস্টমাইজেশন (যেমন: ৪০ মি., ৪৫ মি., ৮০ মি., ১২০ মি. ল্যাব):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: totalPeriods }, (_, i) => i + 1).map((p) => (
                    <div key={p} className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl space-y-1">
                      <div className="text-[11px] font-bold text-slate-200">ক্লাস {toBengaliNumerals(p)} ({generatedTimeSlots.find(s => s.period === p)?.startTime || ''})</div>
                      <select
                        value={periodDurations[p] || periodDuration}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPeriodDurations({ ...periodDurations, [p]: val });
                        }}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-cyan-300 font-bold"
                      >
                        <option value={40}>৪০ মিনিট</option>
                        <option value={45}>৪৫ মিনিট</option>
                        <option value={50}>৫০ মিনিট</option>
                        <option value={60}>৬০ মিনিট</option>
                        <option value={80}>৮০ মিনিট</option>
                        <option value={120}>১২০ মিনিট (ল্যাব)</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">টিফিন ও বিরতি সক্রিয়করণ:</label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={tiffinBreakEnabled}
                    onChange={(e) => setTiffinBreakEnabled(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-300 font-semibold">টিফিন ও প্রাতের বিরতি চালু রাখুন</span>
                </div>
              </div>

              {tiffinBreakEnabled && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">বিরতির স্থায়িত্ব (Duration):</label>
                    <select
                      value={tiffinBreakDuration}
                      onChange={(e) => setTiffinBreakDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold"
                    >
                      <option value={20}>২০ মিনিট</option>
                      <option value={30}>৩০ মিনিট</option>
                      <option value={45}>৪৫ মিনিট</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">কখন টিফিন বিরতি হবে?</label>
                    <select
                      value={tiffinBreakAfterPeriod}
                      onChange={(e) => setTiffinBreakAfterPeriod(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold"
                    >
                      <option value={3}>৩য় ক্লাসের পর</option>
                      <option value={4}>৪র্থ ক্লাসের পর (সকাল ১০:৪০)</option>
                      <option value={5}>৫ম ক্লাসের পর</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">স্মারক নম্বর (Memo No):</label>
                <input
                  type="text"
                  value={memoNo}
                  onChange={(e) => setMemoNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">রুটিন কমিটির আহ্বায়ক:</label>
                <input
                  type="text"
                  value={convenerName}
                  onChange={(e) => setConvenerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">প্রতিষ্ঠান প্রধান (অধ্যক্ষ):</label>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  toast.success("গ্লোবাল কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!");
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg transition"
              >
                কনফিগারেশন সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CRUD MODAL FOR SLOT ASSIGNMENT & EDIT                          */}
      {/* ============================================================== */}
      {activeModalCell && (() => {
        const modalNumericClass = parseClassNumeric(modalClassId);
        const modalHasTrade = doesClassHaveTrade(modalNumericClass);
        const modalApplicableTrades = modalHasTrade ? getApplicableTradesForClass(modalNumericClass) : [];
        const availableModalSubjects = getSingleSourceSubjects({
          classVal: modalClassId,
          tradeVal: modalTradeCode,
          academicYear,
        });

        const freeTeachersList = getFreeTeachers(activeModalCell.day, activeModalCell.periodNo, modalDuration);
        const conflictInfo = getTeacherConflictDetails(
          modalTeacher,
          activeModalCell.day,
          activeModalCell.periodNo,
          modalClassId,
          modalDuration
        );
        const roomConflictInfo = getRoomConflictDetails(
          modalRoom,
          activeModalCell.day,
          activeModalCell.periodNo,
          modalClassId,
          modalDuration,
          modalTradeCode
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>ক্লাস শিডিউল ও রুটিন নির্ধারণ</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    দিন: <strong className="text-indigo-300">{ROUTINE_DAYS_BN[activeModalCell.day] || activeModalCell.day}</strong> · ক্লাসের সময়: <strong className="text-cyan-300 font-mono">{getSlotTimeText(activeModalCell.periodNo, modalDuration)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setActiveModalCell(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">শ্রেণি (Class):</label>
                    <select
                      value={modalClassId}
                      onChange={(e) => {
                        const newId = Number(e.target.value);
                        setModalClassId(newId);
                        const numeric = parseClassNumeric(newId);
                        const hasT = doesClassHaveTrade(numeric);
                        let newTrade = modalTradeCode;
                        if (hasT) {
                          const appTrades = getApplicableTradesForClass(numeric);
                          if (appTrades.length > 0) {
                            newTrade = appTrades[0].code;
                            setModalTradeCode(newTrade);
                          }
                        } else {
                          newTrade = "";
                          setModalTradeCode("");
                        }
                        // Refresh subjects for new class
                        const newSubjects = getSingleSourceSubjects({
                          classVal: newId,
                          tradeVal: newTrade,
                          academicYear,
                        });
                        if (newSubjects.length > 0) {
                          setModalSubject(newSubjects[0].nameBangla || newSubjects[0].name);
                          setModalSubjectCode(newSubjects[0].code);
                          if (newSubjects[0].category === "Lab" || newSubjects[0].category === "Workshop") {
                            setModalDuration(80);
                            setModalRoom("ল্যাব-০১");
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold"
                    >
                      {ACADEMIC_CLASSES.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.nameBangla})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      {modalHasTrade ? "ট্রেড (Trade):" : "ট্রেড স্ট্যাটাস:"}
                    </label>
                    {modalHasTrade ? (
                      <select
                        value={modalTradeCode}
                        onChange={(e) => {
                          const newCode = e.target.value;
                          setModalTradeCode(newCode);
                          const newSubjects = getSingleSourceSubjects({
                            classVal: modalClassId,
                            tradeVal: newCode,
                            academicYear,
                          });
                          if (newSubjects.length > 0) {
                            setModalSubject(newSubjects[0].nameBangla || newSubjects[0].name);
                            setModalSubjectCode(newSubjects[0].code);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold"
                      >
                        {modalApplicableTrades.map((t) => (
                          <option key={t.code} value={t.code}>{t.nameBangla} ({t.code})</option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-3 py-2 bg-slate-800/50 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono">
                        ট্রেড প্রযোজ্য নয় (Pre-Voc)
                      </div>
                    )}
                  </div>
                </div>

                {/* 1. Global Dropdown Sync: Subject Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                      <span>গ্লোবাল ম্যাপড বিষয় (Subject Selection):</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomSubjectMode(!isCustomSubjectMode)}
                      className="text-[11px] text-cyan-400 hover:underline font-bold cursor-pointer"
                    >
                      {isCustomSubjectMode ? "ম্যাপড ড্রপডাউন ব্যবহার করুন" : "+ কাস্টম বিষয় লিখুন"}
                    </button>
                  </div>

                  {!isCustomSubjectMode ? (
                    <div className="space-y-1.5">
                      <select
                        value={modalSubjectCode}
                        onChange={(e) => {
                          const code = e.target.value;
                          setModalSubjectCode(code);
                          const matched = availableModalSubjects.find((s) => s.code === code);
                          if (matched) {
                            setModalSubject(matched.nameBangla || matched.name);
                            if (matched.category === "Lab" || matched.category === "Workshop") {
                              if (modalDuration < 80) setModalDuration(80);
                              if (!modalRoom || modalRoom.includes("রুম")) setModalRoom("ল্যাব-০১");
                            }
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                      >
                        {availableModalSubjects.length === 0 ? (
                          <option value="">-- কোনো বিষয় ম্যাপ করা নেই --</option>
                        ) : (
                          availableModalSubjects.map((s) => (
                            <option key={s.code} value={s.code}>
                              [{s.code}] {s.nameBangla} ({s.category} · সাপ্তাহিক {s.weeklyPeriods} পিরিয়ড)
                            </option>
                          ))
                        )}
                      </select>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                        <span>নির্বাচিত বিষয়: <strong className="text-white">{modalSubject}</strong></span>
                        <span className="font-mono text-cyan-400 font-bold">[{modalSubjectCode}]</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">কাস্টম বিষয়ের নাম:</label>
                        <input
                          type="text"
                          value={modalSubject}
                          onChange={(e) => setModalSubject(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                          placeholder="যেমন: বাংলা ১ম পত্র"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">বিষয় কোড:</label>
                        <input
                          type="text"
                          value={modalSubjectCode}
                          onChange={(e) => setModalSubjectCode(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono"
                          placeholder="যেমন: 101"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Smart Conflict Detection & Free Teacher Finder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>শিক্ষক নির্বাচন করুন:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSubstituteModalTargetTeacher(modalTeacher);
                          setSubstituteModalTargetDay(activeModalCell.day);
                          setSubstituteModalTargetPeriod(activeModalCell.periodNo);
                          setShowSubstituteModal(true);
                        }}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-800/80 cursor-pointer"
                        title="এই স্লটের জন্য স্মার্ট বদলি শিক্ষক খুঁজুন"
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>অটো-সাবস্টিটিউট সহকারী</span>
                      </button>
                      <label className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterOnlyFreeTeachers}
                          onChange={(e) => setFilterOnlyFreeTeachers(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                        />
                        <span>ফ্রি শিক্ষক ({freeTeachersList.length} জন)</span>
                      </label>
                    </div>
                  </div>

                  <select
                    value={modalTeacher}
                    onChange={(e) => setModalTeacher(e.target.value)}
                    className={`w-full px-3 py-2 bg-slate-800 border rounded-xl text-xs font-bold transition-colors ${
                      conflictInfo.hasConflict
                        ? "border-rose-500 text-rose-200"
                        : "border-slate-700 text-white"
                    }`}
                  >
                    <option value="">-- শিক্ষক বেছে নিন --</option>
                    {filterOnlyFreeTeachers ? (
                      freeTeachersList.map((t) => (
                        <option key={t.id} value={t.name}>
                          🟢 {t.name} ({t.designation || "Instructor"}) - উপলব্ধ
                        </option>
                      ))
                    ) : (
                      <>
                        <optgroup label="🟢 এই পিরিয়ডে উপলব্ধ শিক্ষকগণ (Free)">
                          {freeTeachersList.map((t) => (
                            <option key={t.id} value={t.name}>
                              🟢 {t.name} ({t.designation || "Instructor"})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="🔴 অন্যান্য শিক্ষকগণ (ব্যস্ত থাকতে পারেন)">
                          {safeFaculty
                            .filter((f) => f.type === "faculty")
                            .filter((f) => !freeTeachersList.some((free) => free.id === f.id))
                            .map((t) => {
                              const conflictSlot = getTeacherConflictForSlot(t.name, activeModalCell.day, activeModalCell.periodNo, modalDuration);
                              return (
                                <option key={t.id} value={t.name}>
                                  🔴 {t.name} ({t.designation || "Instructor"}) {conflictSlot ? `[ব্যস্ত: ${conflictSlot.className}]` : ""}
                                </option>
                              );
                            })}
                        </optgroup>
                      </>
                    )}
                  </select>

                  {/* Real-time Conflict Alert Box with Tooltip & Details */}
                  {conflictInfo.hasConflict && conflictInfo.conflictingSlot && (
                    <div className="p-3 rounded-2xl bg-rose-950/90 border border-rose-500/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in shadow-lg shadow-rose-950/40">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                      <div className="space-y-1">
                        <div className="font-black text-rose-200 flex items-center gap-1.5">
                          <span>⚠️ শিক্ষক দ্বৈত বুকিং (Conflict) সনাক্ত হয়েছে!</span>
                        </div>
                        <p className="text-[11px] text-rose-300 leading-relaxed">
                          <strong>{modalTeacher}</strong> একই সময়ে <strong>{conflictInfo.conflictingSlot.className}</strong> শ্রেণির <strong>{conflictInfo.conflictingSlot.subjectNameBangla || conflictInfo.conflictingSlot.subjectName}</strong> ক্লাসে ({conflictInfo.conflictingSlot.roomNo}) যুক্ত আছেন।
                        </p>
                        <div className="text-[10px] text-rose-400 font-mono flex items-center gap-2 pt-0.5">
                          <span>সময়: {toBengaliNumerals(conflictInfo.conflictingSlot.startTime)} - {toBengaliNumerals(conflictInfo.conflictingSlot.endTime)}</span>
                          <span>·</span>
                          <span>পিরিয়ড: {toBengaliNumerals(conflictInfo.conflictingSlot.periodNo)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Physical Resource Mapping & Room/Lab Conflict Prevention */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-cyan-400" />
                      <span>রুম / ল্যাব নির্বাচন (Physical Space):</span>
                    </label>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                      roomConflictInfo.hasConflict
                        ? "bg-rose-950 text-rose-300 border border-rose-800"
                        : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    }`}>
                      {roomConflictInfo.hasConflict ? "🔴 দ্বৈত বুকিং কনফ্লিক্ট" : "🟢 রুম উপলব্ধ"}
                    </span>
                  </div>

                  <select
                    value={modalRoom}
                    onChange={(e) => setModalRoom(e.target.value)}
                    className={`w-full px-3 py-2 bg-slate-800 border rounded-xl text-xs font-bold transition-colors ${
                      roomConflictInfo.hasConflict
                        ? "border-rose-500 text-rose-200"
                        : "border-slate-700 text-white"
                    }`}
                  >
                    <option value="">-- প্রতিষ্ঠানিক রুম বা ল্যাব নির্বাচন করুন --</option>
                    <optgroup label="🔬 স্পেশালাইজড টেকনিক্যাল ল্যাব ও ওয়ার্কশপ">
                      {PTSC_ROOMS_CATALOG.filter(r => r.type === "lab" || r.type === "workshop").map((r) => {
                        const isBusy = checkRoomConflictForSlot(r.shortName, activeModalCell.day, activeModalCell.periodNo, modalClassId, modalDuration, modalTradeCode);
                        return (
                          <option key={r.id} value={r.shortName}>
                            {isBusy ? "🔴 [ব্যস্ত] " : "🟢 [খালি] "} {r.name} ({r.floor})
                          </option>
                        );
                      })}
                    </optgroup>
                    <optgroup label="🏢 জেনারেল ও থিওরি ক্লাসরুম">
                      {PTSC_ROOMS_CATALOG.filter(r => r.type === "theory").map((r) => {
                        const isBusy = checkRoomConflictForSlot(r.shortName, activeModalCell.day, activeModalCell.periodNo, modalClassId, modalDuration, modalTradeCode);
                        return (
                          <option key={r.id} value={r.shortName}>
                            {isBusy ? "🔴 [ব্যস্ত] " : "🟢 [খালি] "} {r.name}
                          </option>
                        );
                      })}
                    </optgroup>
                  </select>

                  {/* Quick Room Preset Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {["ল্যাব-০১", "ল্যাব-০২", "ওয়ার্কশপ-০১ (ইলেকট্রিক্যাল)", "ওয়ার্কশপ-০২ (RAC)", "ওয়ার্কশপ-০৩ (ওয়েল্ডিং)", "ওয়ার্কশপ-০৪ (সিভিল)", "রুম-১০১", "রুম-২০১", "রুম-২০৪", "রুম-৪০২"].map((roomChip) => {
                      const isSelected = modalRoom === roomChip;
                      const isBusy = checkRoomConflictForSlot(roomChip, activeModalCell.day, activeModalCell.periodNo, modalClassId, modalDuration, modalTradeCode);
                      return (
                        <button
                          key={roomChip}
                          type="button"
                          onClick={() => setModalRoom(roomChip)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-cyan-600 text-white ring-1 ring-cyan-400 shadow-xs"
                              : isBusy
                              ? "bg-slate-800/80 text-rose-300 border border-rose-900/60 hover:bg-rose-950/40"
                              : "bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700"
                          }`}
                        >
                          {isBusy ? "🔴 " : "🟢 "}
                          {roomChip}
                        </button>
                      );
                    })}
                  </div>

                  {/* Real-time Room Conflict Alert Box */}
                  {roomConflictInfo.hasConflict && roomConflictInfo.conflictingSlot && (
                    <div className="p-3 rounded-2xl bg-rose-950/90 border border-rose-500/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in shadow-lg shadow-rose-950/40">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                      <div className="space-y-1">
                        <div className="font-black text-rose-200 flex items-center gap-1.5">
                          <span>⚠️ রুম বা ল্যাব দ্বৈত বুকিং (Room Conflict) সনাক্ত হয়েছে!</span>
                        </div>
                        <p className="text-[11px] text-rose-300 leading-relaxed">
                          <strong>{modalRoom}</strong> একই সময়ে <strong>{roomConflictInfo.conflictingSlot.className}</strong> শ্রেণির <strong>{roomConflictInfo.conflictingSlot.subjectNameBangla || roomConflictInfo.conflictingSlot.subjectName}</strong> ক্লাসে ({roomConflictInfo.conflictingSlot.teacherName}) বরাদ্দ রয়েছে।
                        </p>
                        <div className="text-[10px] text-rose-400 font-mono flex items-center gap-2 pt-0.5">
                          <span>সময়: {toBengaliNumerals(roomConflictInfo.conflictingSlot.startTime)} - {toBengaliNumerals(roomConflictInfo.conflictingSlot.endTime)}</span>
                          <span>·</span>
                          <span>পিরিয়ড: {toBengaliNumerals(roomConflictInfo.conflictingSlot.periodNo)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">ক্লাসের সময়সীমা ও স্থায়িত্ব (Class Timing):</label>
                  <select
                    value={modalDuration}
                    onChange={(e) => setModalDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-cyan-300 font-bold"
                  >
                    <option value={40}>
                      {activeModalCell ? getSlotTimeText(activeModalCell.periodNo, 40) : "৪০ মিনিট ক্লাস"}
                    </option>
                    <option value={80}>
                      {activeModalCell ? getSlotTimeText(activeModalCell.periodNo, 80) : "৮০ মিনিট ক্লাস"}
                    </option>
                    <option value={120}>
                      {activeModalCell ? getSlotTimeText(activeModalCell.periodNo, 120) : "১২০ মিনিট (ল্যাব ক্লাস)"}
                    </option>
                    <option value={160}>
                      {activeModalCell ? getSlotTimeText(activeModalCell.periodNo, 160) : "১৬০ মিনিট (দীর্ঘ ল্যাব সেশন)"}
                    </option>
                  </select>

                  <div className="p-3 mt-2 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-indigo-300 font-bold">
                      <span>ক্লাসের সময়: {activeModalCell ? getSlotTimeText(activeModalCell.periodNo, modalDuration) : ""}</span>
                      <span className="font-mono text-cyan-400 font-extrabold">{toBengaliNumerals(modalDuration)} মিনিট</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      * রুটিনে এই ক্লাসের সময়সূচি {activeModalCell ? getSlotTimeText(activeModalCell.periodNo, modalDuration) : ""} হিসেবে প্রদর্শিত হবে।
                    </p>
                    {activeModalCell.periodNo <= 4 && activeModalCell.periodNo + getSlotSpan(modalDuration) - 1 > 4 && (
                      <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1 pt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>সতর্কতা: সকাল ১০:৪০ এ টিফিন বিরতি রয়েছে। টিফিন বিরতির পূর্বে ক্লাস শেষ হতে সর্বোচ্চ {getSlotTimeText(activeModalCell.periodNo, (4 - activeModalCell.periodNo + 1) * 40)} নির্বাচন করুন।</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (activeModalCell) {
                      handleDeleteSlot(activeModalCell.day, activeModalCell.periodNo, modalClassId, modalTradeCode);
                      setActiveModalCell(null);
                    }
                  }}
                  className="px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                  title="এই পিরিয়ডের স্লট মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>স্লট মুছুন</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveModalCell(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700 active:scale-95"
                  >
                    বাতিল (Cancel)
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSlot}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-950/50 transition flex items-center gap-2 cursor-pointer border border-emerald-400/40 ring-2 ring-emerald-500/20 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>সংরক্ষণ করুন (Save / Update)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* INSTITUTIONAL WORKLOAD VALIDATOR & CAPACITY AUDIT MODAL        */}
      {/* ============================================================== */}
      {showWorkloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ — শিক্ষকভিত্তিক ক্লাস ও কর্মঘণ্টা অডিট</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      সাপ্তাহিক প্রতিষ্ঠান নির্দেশিকা: আদর্শ কর্মঘণ্টা ৮০০-৯৬০ মিনিট (২০-২৪টি ক্লাস)। অতিরিক্ত ক্লাস বা সময়ের ঘাটতি স্বয়ংক্রিয়ভাবে চিহ্নিত।
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowWorkloadModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400">মোট শিক্ষক</div>
                <div className="text-xl font-black text-white mt-1">
                  {facultyWorkloadStats.length} <span className="text-xs font-normal text-slate-400">জন</span>
                </div>
                <div className="text-[10px] text-cyan-400 mt-0.5">সবাই পিটিএসসি অনুষদ</div>
              </div>

              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400">মোট শিডিউলড ক্লাস</div>
                <div className="text-xl font-black text-indigo-300 mt-1">
                  {routines.length} <span className="text-xs font-normal text-slate-400">টি ক্লাস</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">রবি - বৃহস্পতি</div>
              </div>

              <div className="p-3.5 bg-rose-950/30 border border-rose-900/40 rounded-2xl">
                <div className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>অতিরিক্ত কর্মঘণ্টা (&gt;৯৬০ মি.)</span>
                </div>
                <div className="text-xl font-black text-rose-400 mt-1">
                  {facultyWorkloadStats.filter((s) => s.isOverloaded).length}{" "}
                  <span className="text-xs font-normal text-slate-400">জন</span>
                </div>
                <div className="text-[10px] text-rose-300/80 mt-0.5">ক্যাপাসিটি অতিক্রমকারী</div>
              </div>

              <div className="p-3.5 bg-emerald-950/30 border border-emerald-900/40 rounded-2xl">
                <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>আদর্শ কর্মঘণ্টা (৮০০-৯৬০ মি.)</span>
                </div>
                <div className="text-xl font-black text-emerald-400 mt-1">
                  {facultyWorkloadStats.filter((s) => s.isNormal).length}{" "}
                  <span className="text-xs font-normal text-slate-400">জন</span>
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">ভারসাম্যপূর্ণ কর্মঘণ্টা</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500 dark:text-slate-400" />
                <input
                  type="text"
                  placeholder="শিক্ষকের নাম বা বিভাগ দিয়ে খুঁজুন..."
                  value={workloadSearchQuery}
                  onChange={(e) => setWorkloadSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setWorkloadStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    workloadStatusFilter === "all"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  সকল শিক্ষক ({facultyWorkloadStats.length})
                </button>
                <button
                  onClick={() => setWorkloadStatusFilter("overloaded")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                    workloadStatusFilter === "overloaded"
                      ? "bg-rose-600 text-white"
                      : "bg-slate-800 text-rose-300 hover:text-white"
                  }`}
                >
                  অতিরিক্ত লোড ({facultyWorkloadStats.filter((s) => s.isOverloaded).length})
                </button>
                <button
                  onClick={() => setWorkloadStatusFilter("normal")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    workloadStatusFilter === "normal"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-emerald-300 hover:text-white"
                  }`}
                >
                  ভারসাম্যপূর্ণ ({facultyWorkloadStats.filter((s) => s.isNormal).length})
                </button>
                <button
                  onClick={() => setWorkloadStatusFilter("underloaded")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    workloadStatusFilter === "underloaded"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-800 text-amber-300 hover:text-white"
                  }`}
                >
                  আন্ডারলোড ({facultyWorkloadStats.filter((s) => s.isUnderloaded).length})
                </button>
              </div>
            </div>

            {/* Table Area (Scrollable) */}
            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 text-slate-300 border-b border-slate-800 z-10">
                  <tr>
                    <th className="p-3 font-bold w-12 text-center">ক্রম</th>
                    <th className="p-3 font-bold">শিক্ষক ও পদবি</th>
                    <th className="p-3 font-bold">বিভাগ</th>
                    <th className="p-3 font-bold text-center">সাপ্তাহিক ক্লাস সংখ্যা</th>
                    <th className="p-3 font-bold text-center">মোট সময়</th>
                    <th className="p-3 font-bold text-center">ক্লাস ব্যাপ্তি বিশ্লেষণ</th>
                    <th className="p-3 font-bold text-center">ক্যাপাসিটি প্রোগ্রেস (৯৬০ মি.)</th>
                    <th className="p-3 font-bold text-center">অডিট স্ট্যাটাস</th>
                    <th className="p-3 font-bold text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredWorkloadStats.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                        কোনো শিক্ষক পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredWorkloadStats.map((item, idx) => (
                      <tr
                        key={item.teacher.id}
                        className={`hover:bg-slate-800/40 transition ${
                          item.isOverloaded ? "bg-rose-950/15" : ""
                        }`}
                      >
                        <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{item.teacher.name}</span>
                            {item.teacher.nameBangla && (
                              <span className="text-slate-400 font-normal">({item.teacher.nameBangla})</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{item.teacher.designation || "ইন্সট্রাক্টর"}</div>
                        </td>
                        <td className="p-3 text-slate-300">{item.teacher.department || "প্রকৌশল"}</td>
                        <td className="p-3 text-center font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-xs ${
                              item.isOverloaded
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                            }`}
                          >
                            {toBengaliNumerals(item.totalPeriodsLoad)}টি ক্লাস
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-200">
                          {toBengaliNumerals(item.totalMinutes)} মি.
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-[11px] font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300" title="৪০ মিনিট একক ক্লাস">
                              ৪০মি: {item.singlePeriods}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300" title="৮০ মিনিট ডাবল ক্লাস">
                              ৮০মি: {item.doublePeriods}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300" title="ল্যাব সেশন (১২০/১৬০ মি.)">
                              ল্যাব: {item.triplePeriods + item.quadPeriods}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center w-40">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-slate-400">{item.percentage}%</span>
                              <span className={item.isOverloaded ? "text-rose-400 font-bold" : "text-slate-400"}>
                                {item.totalMinutes}/৯৬০ মি.
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  item.isOverloaded
                                    ? "bg-rose-500"
                                    : item.isUnderloaded
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, (item.totalMinutes / 960) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {item.isOverloaded ? (
                            <span className="px-2 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold inline-flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              অতিরিক্ত ক্লাস (+{toBengaliNumerals(item.excessMinutes)} মি.)
                            </span>
                          ) : item.isUnderloaded ? (
                            <span className="px-2 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold inline-flex items-center gap-1">
                              আন্ডারলোড (মুক্ত স্লট আছে)
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              আদর্শ লোড
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedTeacherName(item.teacher.name);
                              setActiveTab("teacher");
                              setShowWorkloadModal(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-[11px] font-bold transition whitespace-nowrap"
                          >
                            রুটিন দেখুন
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer with Export & Close */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-800 shrink-0 gap-3">
              <div className="text-xs text-slate-400">
                * বাংলাদেশ কারিগরি শিক্ষা বোর্ডের বিধিমালা অনুসারে একজন শিক্ষকের সাপ্তাহিক আদর্শ কর্মঘণ্টা নির্ধারিত।
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportWorkloadCsv}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>CSV রিপোর্ট ডাউনলোড</span>
                </button>
                <button
                  onClick={() => setShowWorkloadModal(false)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Substitute Recommendation Engine Modal */}
      <AutoSubstituteEngineModal
        isOpen={showSubstituteModal}
        onClose={() => setShowSubstituteModal(false)}
        routines={routines}
        facultyList={safeFaculty}
        onCommitSubstitutions={(updated) => commitRoutineChange(updated)}
        initialTeacherName={substituteModalTargetTeacher}
        initialDay={substituteModalTargetDay}
        initialPeriodNo={substituteModalTargetPeriod}
      />

      {/* ============================================================== */}
      {/* 1. ADVANCED PRINT STUDIO & LIVE CUSTOMIZER MODAL               */}
      {/* ============================================================== */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl space-y-5 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>প্রিন্ট ও পোর্টেবল কাস্টমাইজেশন স্টুডিও (Custom Print Studio)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    ক্লাসরুম পোস্টার, অফিশিয়াল নোটিশ বোর্ড বা নোটিশ প্রিন্টের জন্য থিম ও হেডার পরিবর্তন করুন।
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 space-y-6 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {/* Print Theme Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <span>প্রিন্ট কালার থিম নির্বাচন করুন (Paper / PDF Print Theme):</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "vivid-print", title: "🎨 রঙিন মেগা প্রিন্ট", desc: "হাই-কনট্রাস্ট রঙিন সাবজেক্ট ফিল" },
                    { id: "pastel-print", title: "🌸 সফট প্যাস্টেল", desc: "হালকা রঙিন মার্জিত বর্ডার" },
                    { id: "eco-ink", title: "🍃 ইঙ্ক-সেভার ইকো", desc: "কম কালি খরচ (Monochrome)" },
                    { id: "classic-gov", title: "🏛️ গভঃ অফিশিয়াল", desc: "ফরমাল ক্লাসিক টেবিল স্ট্রাকচার" },
                  ].map((pTheme) => (
                    <button
                      key={pTheme.id}
                      onClick={() => setPrintTheme(pTheme.id as any)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        printTheme === pTheme.id
                          ? "bg-indigo-950/80 border-cyan-400 ring-2 ring-cyan-500/30 text-white shadow-lg"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <div className="font-bold text-xs text-white">{pTheme.title}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{pTheme.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editable Header Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">স্মারক নম্বর (Memo No):</label>
                  <input
                    type="text"
                    value={memoNo}
                    onChange={(e) => setMemoNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">আহ্বায়ক (রুটিন কমিটি):</label>
                  <input
                    type="text"
                    value={convenerName}
                    onChange={(e) => setConvenerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">অধ্যক্ষ (ভারপ্রাপ্ত):</label>
                  <input
                    type="text"
                    value={principalName}
                    onChange={(e) => setPrincipalName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Print Section Toggles */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">প্রিন্ট আউটপুট উপাদানসমূহ:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <label className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center gap-2 cursor-pointer text-slate-300 font-bold">
                    <input
                      type="checkbox"
                      checked={printShowQr}
                      onChange={(e) => setPrintShowQr(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
                    />
                    <span>ডিজিটাল QR কোড</span>
                  </label>

                  <label className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center gap-2 cursor-pointer text-slate-300 font-bold">
                    <input
                      type="checkbox"
                      checked={printShowSignatures}
                      onChange={(e) => setPrintShowSignatures(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
                    />
                    <span>স্বাক্ষর ও অফিশিয়াল সিল</span>
                  </label>

                  <label className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center gap-2 cursor-pointer text-slate-300 font-bold">
                    <input
                      type="checkbox"
                      checked={printShowNotes}
                      onChange={(e) => setPrintShowNotes(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
                    />
                    <span>প্রাতিষ্ঠানিক নিয়মাবলী</span>
                  </label>

                  <label className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center gap-2 cursor-pointer text-slate-300 font-bold">
                    <input
                      type="checkbox"
                      checked={printShowTeacherSummary}
                      onChange={(e) => setPrintShowTeacherSummary(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
                    />
                    <span>শিক্ষক তালিকা নোট</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-800 shrink-0 gap-3">
              <div className="text-xs text-slate-400">
                * প্রিন্ট ডায়ালগ ওপেন হলে PDF আকারে সেভ করতে &apos;Save as PDF&apos; সিলেক্ট করুন।
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  onClick={() => {
                    setShowPrintModal(false);
                    setTimeout(() => window.print(), 200);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-950/50 transition flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-200" />
                  <span>এখনই প্রিন্ট করুন / PDF তৈরি করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. AI SMART ROUTINE GENERATOR MODAL                            */}
      {/* ============================================================== */}
      {showAutoScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    এআই স্মার্ট রুটিন জেনারেটর (Auto-Scheduler)
                  </h3>
                  <p className="text-xs text-slate-400">
                    নির্বাচিত শ্রেণির জন্য শূন্য-কনফ্লিক্ট সাপ্তাহিক রুটিন অটো-পপুলেট করুন।
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoScheduleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-300 font-bold border-b border-slate-800 pb-2">
                <span>লক্ষ্যভিত্তিক শ্রেণি:</span>
                <span className="text-cyan-400 font-mono">
                  {ACADEMIC_CLASSES.find((c) => String(c.id) === selectedClassId)?.name}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300 font-bold border-b border-slate-800 pb-2">
                <span>ট্রেড কোড:</span>
                <span className="text-indigo-400 font-mono">{selectedTradeCode}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 font-bold">
                <span>মোট পিরিয়ড ও ল্যাব:</span>
                <span className="text-emerald-400 font-mono">৮ পিরিয়ড (রবি-বৃহস্পতি)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-800/80 text-indigo-200 text-xs leading-relaxed space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>অটো-জেনারেটর অ্যালগরিদম নিশ্চয়তা:</span>
              </div>
              <p className="text-[11px] text-indigo-300">
                • অন্যান্য ক্লাসের সাথে শিক্ষকদের ওভারল্যাপ স্বয়ংক্রিয়ভাবে এড়িয়ে যাবে।<br />
                • থিওরি ও ব্যবহারিক ল্যাব (৮০ মিনিট) সামঞ্জস্যপূর্ণভাবে সাজাবে।<br />
                • টিফিন বিরতির পর পিরিয়ড সঠিকভাবে রিক্যালকুলেট করবে।
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAutoScheduleModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={handleAutoGenerateRoutine}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black rounded-xl text-xs shadow-lg shadow-cyan-950/50 transition flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>স্বয়ংক্রিয় রুটিন জেনারেট শুরু করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. CLASSROOM & LAB PHYSICAL RESOURCE MATRIX MODAL              */}
      {/* ============================================================== */}
      {showRoomMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl space-y-5">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    ১৫টি ক্লাসরুম ও টেকনিক্যাল ল্যাব দখল সূচক (Physical Space Matrix)
                  </h3>
                  <p className="text-xs text-slate-400">
                    কোন ল্যাব বা ক্লাসরুম কখন খালি রয়েছে তা রিয়েল-টাইমে দেখুন।
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRoomMatrixModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 text-slate-300 border-b border-slate-800 z-10">
                  <tr>
                    <th className="p-3 font-bold w-44">রুম / ল্যাবের নাম</th>
                    <th className="p-3 font-bold">ধরন ও অবস্থান</th>
                    <th className="p-3 font-bold text-center">বুকড স্লট সংখ্যা</th>
                    <th className="p-3 font-bold text-center">আজকের ব্যস্ততা (রবিবার)</th>
                    <th className="p-3 font-bold text-center">বর্তমান স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {PTSC_ROOMS_CATALOG.map((room) => {
                    const roomRoutines = routines.filter((r) => r.roomNo?.includes(room.shortName));
                    const isBusyNow = roomRoutines.length > 0;

                    return (
                      <tr key={room.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <Building className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>{room.name}</span>
                        </td>
                        <td className="p-3 text-slate-400">
                          {room.floor} ({room.type === "lab" ? "🔬 ল্যাব" : room.type === "workshop" ? "🛠️ ওয়ার্কশপ" : "🏢 থিওরি"})
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-300">
                          {toBengaliNumerals(roomRoutines.length)}টি স্লট
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
                            {roomRoutines.slice(0, 3).map((r) => (
                              <span key={r.id} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {r.className}
                              </span>
                            ))}
                            {roomRoutines.length > 3 && (
                              <span className="text-slate-500 font-bold">+{roomRoutines.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isBusyNow
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            }`}
                          >
                            {isBusyNow ? "🔴 ব্যবহৃত হচ্ছে" : "🟢 একদম খালি"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowRoomMatrixModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. AI GENERATIVE JSON ROUTINE IMPORT STUDIO MODAL              */}
      {/* ============================================================== */}
      {showJsonUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl space-y-5 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>এআই জেনারেটিভ JSON রুটিন কনভার্টার ও শিডিউল স্টুডিও</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    যেকোনো JSON ফাইল (পাঠ্যসূচি, শিক্ষক বরাদ্দ বা রুটিন স্ট্রাকচার) থেকে স্বয়ংক্রিয় রুটিন তৈরি করুন।
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowJsonUploadModal(false);
                  setUploadedJsonData(null);
                  setAiGeneratedPreview(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="overflow-y-auto flex-1 space-y-5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 text-xs">
              {/* Uploaded File Info Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white">{uploadedFileName || "আপলোডকৃত ফাইল.json"}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[10px] font-bold">
                    {Array.isArray(uploadedJsonData)
                      ? `Array (${uploadedJsonData.length}টি এন্ট্রি)`
                      : `Object (${Object.keys(uploadedJsonData || {}).length}টি কি)`}
                  </span>
                </div>

                {/* Raw JSON Snippet Preview */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">JSON ফাইল স্নানিপেট (Preview):</label>
                  <pre className="p-3 bg-slate-900 rounded-xl text-[10px] font-mono text-slate-300 overflow-x-auto max-h-32 border border-slate-800">
                    {JSON.stringify(uploadedJsonData, null, 2)?.slice(0, 500)}
                    {(JSON.stringify(uploadedJsonData)?.length || 0) > 500 ? "\n..." : ""}
                  </pre>
                </div>
              </div>

              {/* AI Processing Mode Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-200 block">রুটিন প্রসেসিং মোড নির্বাচন করুন:</label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-700/80 space-y-2">
                    <div className="font-black text-white text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>✨ এআই স্মার্ট রুটিন জেনারেটর (Gemini AI)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      যেকোনো ফরম্যাটের JSON পাঠ্যসূচি বা শিক্ষক বরাদ্দ বিশ্লেষণ করে স্বয়ংক্রিয়ভাবে শূন্য-কনফ্লিক্ট সাপ্তাহিক রুটিন তৈরি করে।
                    </p>
                    <button
                      type="button"
                      disabled={isProcessingAiJson}
                      onClick={() => handleProcessJsonWithAi()}
                      className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                      {isProcessingAiJson ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>এআই দিয়ে তৈরি হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-cyan-200" />
                          <span>এআই দিয়ে রুটিন তৈরি করুন</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="font-black text-white text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>⚡ ডাইরেক্ট ইমপোর্ট (Direct Parse)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      যদি আপনার JSON ফাইলটি পূর্বে এক্সপোর্ট করা রুটিন স্ট্রাকচার হয়ে থাকে, তবে কোনো এআই রূপান্তর ছাড়াই সরাসরি লোড হবে।
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (Array.isArray(uploadedJsonData) && uploadedJsonData.length > 0) {
                          setAiGeneratedPreview(uploadedJsonData);
                          toast.success(`সরাসরি ${uploadedJsonData.length}টি স্লট প্রিভিউ করা হয়েছে!`);
                        } else {
                          toast.error("ফাইলটি স্ট্যান্ডার্ড রুটিন অ্যারে নয়। অনুগ্রহ করে 'এআই স্মার্ট রুটিন জেনারেটর' ব্যবহার করুন।");
                        }
                      }}
                      className="w-full mt-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
                    >
                      <span>সরাসরি প্রিভিউ করুন</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Import Strategy Options */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <label className="text-xs font-bold text-slate-300 block">ইমপোর্ট করার ধরন (Strategy):</label>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300">
                    <input
                      type="radio"
                      name="strategy"
                      value="replace"
                      checked={jsonImportStrategy === "replace"}
                      onChange={() => setJsonImportStrategy("replace")}
                      className="text-cyan-500 focus:ring-0"
                    />
                    <span>সম্পূর্ণ বর্তমান রুটিন প্রতিস্থাপন করুন (Replace All)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300">
                    <input
                      type="radio"
                      name="strategy"
                      value="merge"
                      checked={jsonImportStrategy === "merge"}
                      onChange={() => setJsonImportStrategy("merge")}
                      className="text-cyan-500 focus:ring-0"
                    />
                    <span>বর্তমান রুটিনের সাথে যুক্ত করুন (Merge)</span>
                  </label>
                </div>
              </div>

              {/* AI Generated Preview Table */}
              {aiGeneratedPreview && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>জেনারেট হওয়া রুটিন প্রিভিউ ({aiGeneratedPreview.length}টি ক্লাস স্লট)</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-700">
                      0-Conflict Guaranteed
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-emerald-900/60 rounded-xl">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-emerald-950 text-emerald-200 border-b border-emerald-900 font-bold">
                        <tr>
                          <th className="p-2">দিন</th>
                          <th className="p-2 text-center">পিরিয়ড</th>
                          <th className="p-2">শ্রেণি</th>
                          <th className="p-2">বিষয়</th>
                          <th className="p-2">শিক্ষক</th>
                          <th className="p-2 text-center">রুম</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-950/60 text-slate-200 font-medium">
                        {aiGeneratedPreview.slice(0, 6).map((item, idx) => (
                          <tr key={idx} className="hover:bg-emerald-950/30">
                            <td className="p-2 font-bold text-emerald-300">{item.day}</td>
                            <td className="p-2 text-center font-mono">{toBengaliNumerals(item.periodNo)}</td>
                            <td className="p-2">{item.className}</td>
                            <td className="p-2 font-bold text-white">{item.subjectNameBangla || item.subjectName}</td>
                            <td className="p-2 text-cyan-300">{item.teacherName}</td>
                            <td className="p-2 text-center font-mono">{item.roomNo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {aiGeneratedPreview.length > 6 && (
                    <div className="text-[10px] text-emerald-400 text-center font-mono">
                      ...এবং আরও {toBengaliNumerals(aiGeneratedPreview.length - 6)}টি পিরিয়ড স্লট রয়েছে।
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-800 shrink-0 gap-3">
              <button
                onClick={() => {
                  setShowJsonUploadModal(false);
                  setUploadedJsonData(null);
                  setAiGeneratedPreview(null);
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                বাতিল
              </button>

              <button
                disabled={!aiGeneratedPreview || aiGeneratedPreview.length === 0}
                onClick={handleApplyJsonPreview}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-950/50 transition flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>রুটিনে প্রয়োগ করুন (Apply to Routine Builder)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
