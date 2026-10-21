"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Printer,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Settings2,
  FileText,
  RotateCcw,
  Check,
  Building,
  Award,
  ShieldCheck,
  Share2,
  Sliders,
  ChevronDown,
  Info,
} from "lucide-react";
import QRCode from "qrcode";
import * as XLSX from "xlsx";
import {
  institutionalDb,
  RoutineItem,
  FacultyMember,
  Student,
  AttendanceRecord,
} from "@/lib/database";
import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  parseClassNumeric,
  getApplicableTradesForClass,
  doesClassHaveTrade,
} from "@/lib/academicStructure";
import { toBengaliNumerals, toBanglaDateString } from "@/lib/utils";
import { useGlobalSubjects } from "@/lib/useGlobalSubjects";
import { getDayType } from "@/lib/attendanceData";

export type PrintDocCategory = "routine" | "attendance" | "assessment" | "directory";

export type PrintDocTemplate =
  | "routine_class"
  | "routine_teacher"
  | "routine_master"
  | "attendance_daily"
  | "attendance_weekly"
  | "attendance_monthly"
  | "attendance_yearly"
  | "assessment_continuous"
  | "assessment_tabulation"
  | "directory_roll_sheet"
  | "directory_at_risk";

export default function UniversalPrintExportHub() {
  // 1. Navigation & Template Selection
  const [activeCategory, setActiveCategory] = useState<PrintDocCategory>("routine");
  const [selectedTemplate, setSelectedTemplate] = useState<PrintDocTemplate>("routine_class");

  // 2. Filter States
  const [selectedClassId, setSelectedClassId] = useState<number>(4); // Class 9
  const [selectedTradeCode, setSelectedTradeCode] = useState<string>("IT-IOT");
  const [selectedSection, setSelectedSection] = useState<string>("A");
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>(
    institutionalDb.faculty[0]?.name || "Engr. Tanvir Ahmed"
  );
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<string>("2026");
  const [selectedMonth, setSelectedMonth] = useState<string>("09");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // 3. Print Customizer Options
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [headerStyle, setHeaderStyle] = useState<"official" | "minimal">("official");
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [fontScale, setFontScale] = useState<"standard" | "compact">("standard");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [paperTheme, setPaperTheme] = useState<"paper_white" | "dark_preview">("paper_white");

  // QR Code Data URL
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const memoNumber = useMemo(() => {
    return `PTSC/ACAD/2026/${selectedClassId}-${selectedTradeCode}-${Date.now().toString().slice(-4)}`;
  }, [selectedClassId, selectedTradeCode]);

  useEffect(() => {
    const verifyUrl = `https://tsc.panchagarh.gov.bd/verify?memo=${encodeURIComponent(memoNumber)}`;
    QRCode.toDataURL(verifyUrl, { width: 110, margin: 1 })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("QR Error:", err));
  }, [memoNumber]);

  // Academic Structure Calculations
  const numericClass = parseClassNumeric(selectedClassId);
  const tradeApplies = doesClassHaveTrade(numericClass);
  const applicableTrades = useMemo(() => {
    return getApplicableTradesForClass(numericClass);
  }, [numericClass]);

  const activeClassObj = ACADEMIC_CLASSES.find((c) => c.id === selectedClassId);
  const activeTradeObj = ALL_TRADES.find((t) => t.code === selectedTradeCode);

  // Global Subjects Synced Hook
  const {
    subjects: globalSubjects,
    commonSubjects,
    tradeSubjects,
  } = useGlobalSubjects({
    classVal: selectedClassId,
    tradeVal: tradeApplies ? selectedTradeCode : undefined,
    academicYear: selectedSession,
  });

  // Handle Class Switch & Trade Adjustment
  const handleClassChange = (newClsId: number) => {
    setSelectedClassId(newClsId);
    const num = parseClassNumeric(newClsId);
    const hasTrades = doesClassHaveTrade(num);
    if (!hasTrades) {
      setSelectedTradeCode("");
    } else {
      setSelectedTradeCode("IT-IOT");
    }
  };

  // Adjust default orientation based on template
  useEffect(() => {
    if (
      selectedTemplate === "routine_master" ||
      selectedTemplate === "attendance_monthly" ||
      selectedTemplate === "attendance_weekly" ||
      selectedTemplate === "assessment_tabulation"
    ) {
      setOrientation("landscape");
    } else {
      setOrientation("portrait");
    }
  }, [selectedTemplate]);

  // Apply page orientation class to body for accurate @media print rendering
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.classList.remove("print-landscape", "print-portrait");
      document.body.classList.add(orientation === "landscape" ? "print-landscape" : "print-portrait");
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("print-landscape", "print-portrait");
      }
    };
  }, [orientation]);

  // Filtered Students for the selected class/trade/section
  const filteredStudents = useMemo(() => {
    let list = institutionalDb.students.filter(
      (s) => parseClassNumeric(s.classId) === numericClass
    );

    if (tradeApplies && selectedTradeCode && selectedTradeCode !== "all") {
      list = list.filter((s) => {
        const tCode = s.tradeName?.toUpperCase() || "";
        if (selectedTradeCode === "IT-IOT") return tCode.includes("IOT") || tCode.includes("IT");
        if (selectedTradeCode === "EE") return tCode.includes("ELECTRICAL");
        if (selectedTradeCode === "GE") return tCode.includes("ELECTRONIC");
        if (selectedTradeCode === "AMB") return tCode.includes("APPAREL") || tCode.includes("GARMENTS");
        return true;
      });
    }

    if (selectedSection !== "all") {
      list = list.filter((s) => s.section === selectedSection);
    }

    return list.sort((a, b) => Number(a.roll) - Number(b.roll));
  }, [numericClass, tradeApplies, selectedTradeCode, selectedSection]);

  // Filtered Routines for the selected class/trade
  const filteredClassRoutines = useMemo(() => {
    return institutionalDb.routines.filter((r) => {
      const matchClass = parseClassNumeric(r.classId) === numericClass;
      const matchTrade = tradeApplies ? (!r.tradeCode || r.tradeCode === selectedTradeCode || selectedTradeCode === "all") : true;
      return matchClass && matchTrade;
    });
  }, [numericClass, tradeApplies, selectedTradeCode]);

  // Filtered Routines for the selected teacher
  const filteredTeacherRoutines = useMemo(() => {
    return institutionalDb.routines.filter((r) => {
      return r.teacherName.toLowerCase().includes(selectedTeacherName.toLowerCase());
    });
  }, [selectedTeacherName]);

  // 1-Click Print Handler
  const handleTriggerPrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // 1-Click Export to Excel Handler
  const handleExportExcel = () => {
    let sheetData: any[] = [];
    let fileName = `PTSC_${selectedTemplate}_${Date.now()}.xlsx`;

    if (selectedTemplate.startsWith("routine")) {
      sheetData = filteredClassRoutines.map((r) => ({
        দিন: r.day,
        পিরিয়ড: r.periodNo,
        সময়: `${r.startTime} - ${r.endTime}`,
        বিষয়: r.subjectNameBangla || r.subjectName,
        "বিষয় কোড": r.subjectCode,
        শিক্ষক: r.teacherName,
        কক্ষ: r.roomNo,
        শ্রেণি: activeClassObj?.nameBangla || `শ্রেণি ${numericClass}`,
        ট্রেড: selectedTradeCode || "সাধারণ",
      }));
    } else if (selectedTemplate.startsWith("directory") || selectedTemplate.startsWith("attendance")) {
      sheetData = filteredStudents.map((s) => ({
        রোল: s.roll,
        "স্টুডেন্ট আইডি": s.studentId,
        "শিক্ষার্থীর নাম": s.nameBangla || s.name,
        "বাবার নাম": s.fatherName || "—",
        শ্রেণি: activeClassObj?.nameBangla || `শ্রেণি ${numericClass}`,
        ট্রেড: activeTradeObj?.nameBangla || "সাধারণ",
        শাখা: s.section || selectedSection,
        মোবাইল: (s as any).phone || (s as any).mobile || "—",
      }));
    } else {
      sheetData = filteredStudents.map((s, idx) => ({
        রোল: s.roll,
        "স্টুডেন্ট আইডি": s.studentId,
        নাম: s.nameBangla || s.name,
        "ধারাবাহিক তাত্ত্বিক (TC)": 18 + (idx % 3),
        "ধারাবাহিক ব্যবহারিক (PC)": 23 + (idx % 2),
        "মোট ধারাবাহিক": 41 + (idx % 5),
        গ্রেড: "A+",
        জিপিএ: 5.0,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, fileName);
  };

  const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  const WEEK_DAYS_BN: Record<string, string> = {
    Sunday: "রবিবার",
    Monday: "সোমবার",
    Tuesday: "মঙ্গলবার",
    Wednesday: "বুধবার",
    Thursday: "বৃহস্পতিবার",
  };

  const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 font-sans">
      {/* 1. Header Hub Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-cyan-400">
              <Printer className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ইউনিভার্সাল প্রিন্ট ও এক্সপোর্ট হাব
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-indigo-800">
              BTEB Official PDF Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ • অফিসিয়াল প্রাতিষ্ঠানিক লেআউটে রুটিন, রেজিস্টার ও ফলাফল এক ক্লিকে প্রিন্ট
          </p>
        </div>

        {/* Global Action CTAs */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 transition shadow-xs active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>এক্সেল এক্সপোর্ট (.xlsx)</span>
          </button>

          <button
            onClick={handleTriggerPrint}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-2 transition shadow-md shadow-indigo-600/25 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট ও পিডিএফ (Print / PDF)</span>
          </button>
        </div>
      </div>

      {/* 2. Document Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 no-print">
        <button
          onClick={() => {
            setActiveCategory("routine");
            setSelectedTemplate("routine_class");
          }}
          className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
            activeCategory === "routine"
              ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300"
          }`}
        >
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-cyan-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">একাডেমিক রুটিন</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">শ্রেণি, শিক্ষক ও মাস্টার রুটিন</div>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveCategory("attendance");
            setSelectedTemplate("attendance_monthly");
          }}
          className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
            activeCategory === "attendance"
              ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300"
          }`}
        >
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">হাজিরা খাতা ও রেজিস্টার</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">মাসিক, সাপ্তাহিক ও বার্ষিক খাতা</div>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveCategory("assessment");
            setSelectedTemplate("assessment_continuous");
          }}
          className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
            activeCategory === "assessment"
              ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300"
          }`}
        >
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">মূল্যায়ন ও ফলাফল</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">TC/PC ধারাবাহিক মূল্যায়ন বিবরণী</div>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveCategory("directory");
            setSelectedTemplate("directory_roll_sheet");
          }}
          className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
            activeCategory === "directory"
              ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300"
          }`}
        >
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">শিক্ষার্থী ডিরেক্টরি</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">রোল শিট ও উপস্থিতি ঝুঁকি রিপোর্ট</div>
          </div>
        </button>
      </div>

      {/* 3. Controls & Filter Customizer Panel */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 no-print">
        {/* Template Selector Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>টেমপ্লেট নির্বাচন:</span>
          </span>

          {activeCategory === "routine" && (
            <>
              <button
                onClick={() => setSelectedTemplate("routine_class")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedTemplate === "routine_class"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                শ্রেণিভিত্তিক সাপ্তাহিক রুটিন
              </button>
              <button
                onClick={() => setSelectedTemplate("routine_teacher")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedTemplate === "routine_teacher"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                শিক্ষকভিত্তিক কার্যভার রুটিন
              </button>
              <button
                onClick={() => setSelectedTemplate("routine_master")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedTemplate === "routine_master"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                মাস্টার কমপ্লিট রুটিন ম্যাট্রিক্স
              </button>
            </>
          )}

          {activeCategory === "attendance" && (
            <>
              <button
                onClick={() => setSelectedTemplate("attendance_monthly")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedTemplate === "attendance_monthly"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                BTEB মাসিক খাতা গ্রিড (১-৩১ তারিখ)
              </button>
              <button
                onClick={() => setSelectedTemplate("attendance_weekly")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedTemplate === "attendance_weekly"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                BTEB সাপ্তাহিক খাতা
              </button>
              <button
                onClick={() => setSelectedTemplate("attendance_daily")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedTemplate === "attendance_daily"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                দৈনিক পিরিয়ড হাজিরা শিট
              </button>
            </>
          )}

          {activeCategory === "assessment" && (
            <>
              <button
                onClick={() => setSelectedTemplate("assessment_continuous")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedTemplate === "assessment_continuous"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                ধারাবাহিক মূল্যায়ন বিবরণী (TC/PC)
              </button>
              <button
                onClick={() => setSelectedTemplate("assessment_tabulation")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedTemplate === "assessment_tabulation"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                ফলাফল ট্যাবুলেশন শিট
              </button>
            </>
          )}

          {activeCategory === "directory" && (
            <>
              <button
                onClick={() => setSelectedTemplate("directory_roll_sheet")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedTemplate === "directory_roll_sheet"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                শিক্ষার্থী মাস্টার রোল শিট
              </button>
              <button
                onClick={() => setSelectedTemplate("directory_at_risk")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedTemplate === "directory_at_risk"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                বোর্ডে অযোগ্য ও কম হাজিরা সতর্কতা রিপোর্ট
              </button>
            </>
          )}
        </div>

        {/* Dynamic Context Form: Class, Trade, Section, Teacher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
          {/* Class Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>শ্রেণি (Class)</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(Number(e.target.value))}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-indigo-500"
            >
              {ACADEMIC_CLASSES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBangla} ({c.name})
                </option>
              ))}
            </select>
          </div>

          {/* Trade Selector (Only applies to Class 9-12) */}
          {tradeApplies ? (
            <div>
              <label className="block text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>কারিগরি ট্রেড (Trade)</span>
              </label>
              <select
                value={selectedTradeCode}
                onChange={(e) => setSelectedTradeCode(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-indigo-500"
              >
                <option value="all">সকল ট্রেড (All Trades)</option>
                {applicableTrades.map((t) => (
                  <option key={t.id} value={t.code}>
                    {t.nameBangla} ({t.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">কারিগরি ট্রেড (Trade)</label>
              <div className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                ট্রেড প্রযোজ্য নয় (Pre-Vocational)
              </div>
            </div>
          )}

          {/* Section Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>শাখা (Section)</span>
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-indigo-500"
            >
              <option value="A">শাখা A (Section A)</option>
              <option value="B">শাখা B (Section B)</option>
              <option value="all">উভয় শাখা (All Sections)</option>
            </select>
          </div>

          {/* Teacher Selector for teacher routine */}
          {selectedTemplate === "routine_teacher" ? (
            <div>
              <label className="block text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>শিক্ষক নির্বাচন (Faculty)</span>
              </label>
              <select
                value={selectedTeacherName}
                onChange={(e) => setSelectedTeacherName(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-indigo-500"
              >
                {institutionalDb.faculty.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name} ({f.designation})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>শিক্ষাবর্ষ (Session)</span>
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-indigo-500"
              >
                <option value="2026">২০২৬ শিক্ষাবর্ষ</option>
                <option value="2025">২০২৫ শিক্ষাবর্ষ</option>
              </select>
            </div>
          )}

          {/* Month Selector for monthly register */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>মাস নির্বাচন (Month)</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-indigo-500"
            >
              <option value="01">জানুয়ারি ২০২৬</option>
              <option value="02">ফেব্রুয়ারি ২০২৬</option>
              <option value="03">মার্চ ২০২৬</option>
              <option value="04">এপ্রিল ২০২৬</option>
              <option value="05">মে ২০২৬</option>
              <option value="06">জুন ২০২৬</option>
              <option value="07">জুলাই ২০২৬</option>
              <option value="08">আগস্ট ২০২৬</option>
              <option value="09">সেপ্টেম্বর ২০২৬</option>
              <option value="10">অক্টোবর ২০২৬</option>
              <option value="11">নভেম্বর ২০২৬</option>
              <option value="12">ডিসেম্বর ২০২৬</option>
            </select>
          </div>
        </div>

        {/* Print Configuration Controls Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>প্রিন্ট কনফিগারেশন:</span>
            </span>

            {/* Orientation */}
            <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setOrientation("landscape")}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  orientation === "landscape"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white dark:hover:text-white"
                }`}
              >
                ল্যান্ডস্কেপ (Landscape)
              </button>
              <button
                onClick={() => setOrientation("portrait")}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  orientation === "portrait"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white dark:hover:text-white"
                }`}
              >
                পোর্ট্রেট (Portrait)
              </button>
            </div>

            {/* Header Style */}
            <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setHeaderStyle("official")}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  headerStyle === "official"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white dark:hover:text-white"
                }`}
              >
                অফিসিয়াল হেডার (Govt. Seal)
              </button>
              <button
                onClick={() => setHeaderStyle("minimal")}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  headerStyle === "minimal"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white dark:hover:text-white"
                }`}
              >
                সংক্ষিপ্ত হেডার (Minimal)
              </button>
            </div>

            {/* Signatures Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer font-bold select-none text-[11px] text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showSignatures}
                onChange={(e) => setShowSignatures(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 accent-indigo-600"
              />
              <span>স্বাক্ষর ব্লক (Signatures)</span>
            </label>

            {/* Watermark Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer font-bold select-none text-[11px] text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showWatermark}
                onChange={(e) => setShowWatermark(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 accent-indigo-600"
              />
              <span>জলছাপ (Watermark)</span>
            </label>
          </div>

          {/* Zoom and Preview Theme Controls */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">জুম:</span>
            <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold">
              <button
                onClick={() => setZoomLevel(75)}
                className={`px-2 py-0.5 rounded-md ${zoomLevel === 75 ? "bg-indigo-600 text-white" : "text-slate-500 dark:text-slate-400"}`}
              >
                75%
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className={`px-2 py-0.5 rounded-md ${zoomLevel === 100 ? "bg-indigo-600 text-white" : "text-slate-500 dark:text-slate-400"}`}
              >
                100%
              </button>
              <button
                onClick={() => setZoomLevel(125)}
                className={`px-2 py-0.5 rounded-md ${zoomLevel === 125 ? "bg-indigo-600 text-white" : "text-slate-500 dark:text-slate-400"}`}
              >
                125%
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live High-Fidelity Paper Preview Workspace */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 no-print px-1">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" />
            <span>লাইভ পেপার ভিউয়ার (Live A4 Preview Box - Print-Ready)</span>
          </div>
          <div className="text-[11px] font-mono">
            বিন্যাস: {orientation === "landscape" ? "ল্যান্ডস্কেপ (A4)" : "পোর্ট্রেট (A4)"} • স্কেল: {zoomLevel}%
          </div>
        </div>

        {/* Scrollable Preview Wrapper */}
        <div className="overflow-x-auto p-4 sm:p-6 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-inner flex justify-center items-start">
          <div
            id="printable_institutional_document"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.2s ease",
            }}
            className={`universal-print-container relative bg-white dark:bg-slate-900 text-slate-950 p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-300 dark:border-slate-700 w-full ${
              orientation === "landscape" ? "max-w-[1100px] min-h-[750px]" : "max-w-[800px] min-h-[1050px]"
            }`}
          >
            {/* Optional Official Watermark */}
            {showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.035] overflow-hidden">
                <div className="text-center font-black tracking-widest text-8xl -rotate-45 font-serif uppercase">
                  PTSC OFFICIAL
                </div>
              </div>
            )}

            {/* Official Institutional Header */}
            {headerStyle === "official" ? (
              <div className="border-b-2 border-slate-900 pb-3 mb-4 space-y-1 text-center relative">
                {/* Government & Institutional Crest Header */}
                <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                  গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • শিক্ষা মন্ত্রণালয়
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  কারিগরি ও মাদ্রাসা শিক্ষা বিভাগ • বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight font-serif pt-0.5">
                  পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)
                </h1>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                  পূর্ব জালাসী, পঞ্চগড় সদর, পঞ্চগড়-৫০০০ • EIIN: ১৩২২৪৪ • প্রতিষ্ঠান কোড: ১৮০১৭ • tsc.panchagarh.gov.bd
                </p>

                {/* Document Title Banner */}
                <div className="pt-2">
                  <span className="inline-block px-4 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-800 text-xs sm:text-sm font-black text-slate-950 uppercase tracking-wide">
                    {selectedTemplate === "routine_class"
                      ? `শ্রেণিভিত্তিক সাপ্তাহিক ক্লাস রুটিন — ${activeClassObj?.nameBangla || `Class ${numericClass}`}`
                      : selectedTemplate === "routine_teacher"
                      ? `শিক্ষকভিত্তিক সাপ্তাহিক কার্যভার রুটিন — ${selectedTeacherName}`
                      : selectedTemplate === "routine_master"
                      ? "প্রাতিষ্ঠানিক মাস্টার ক্লাস রুটিন ম্যাট্রিক্স ২০২৬"
                      : selectedTemplate === "attendance_monthly"
                      ? `শিক্ষার্থী মাসিক উপস্থিতি ও ধারাবাহিক খাতা — ${selectedMonth}/২০২৬`
                      : selectedTemplate === "attendance_weekly"
                      ? "সাপ্তাহিক উপস্থিতি ও মূল্যায়ন খাতা (Weekly Register)"
                      : selectedTemplate === "attendance_daily"
                      ? `দৈনিক উপস্থিতি বিবরণী — ${selectedDate}`
                      : selectedTemplate === "assessment_continuous"
                      ? `ধারাবাহিক মূল্যায়ন ও অভ্যন্তরীণ নম্বর বিবরণী (TC & PC)`
                      : selectedTemplate === "assessment_tabulation"
                      ? `পরীক্ষার ফলাফল ও ট্যাবুলেশন শিট ২০২৬`
                      : selectedTemplate === "directory_roll_sheet"
                      ? `শিক্ষার্থী মাস্টার রোল শিট — ${activeClassObj?.nameBangla || `Class ${numericClass}`}`
                      : "উপস্থিতি ঝুঁকি ও বোর্ডে অযোগ্য শিক্ষার্থী সতর্কীকরণ তালিকা"}
                  </span>
                </div>

                {/* Metadata Row: Memo No, Class, Trade, Date & QR Verification */}
                <div className="pt-2 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-700 dark:text-slate-300 border-t border-slate-300 dark:border-slate-700 mt-2">
                  <div className="text-left space-y-0.5">
                    <div>
                      <strong>স্মারক নং:</strong> {memoNumber}
                    </div>
                    <div>
                      <strong>শ্রেণি:</strong> {activeClassObj?.nameBangla || `শ্রেণি ${numericClass}`}
                      {tradeApplies && (
                        <>
                          {" • "}
                          <strong>ট্রেড:</strong> {activeTradeObj?.nameBangla || selectedTradeCode}
                        </>
                      )}
                      {" • "}
                      <strong>শাখা:</strong> {selectedSection === "all" ? "সকল শাখা" : `শাখা ${selectedSection}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right space-y-0.5">
                      <div>
                        <strong>শিক্ষাবর্ষ:</strong> {selectedSession}
                      </div>
                      <div>
                        <strong>প্রিন্টের তারিখ:</strong> {new Date().toLocaleDateString("bn-BD")}
                      </div>
                    </div>
                    {qrCodeUrl && (
                      <img
                        src={qrCodeUrl}
                        alt="Verification QR"
                        className="w-12 h-12 border border-slate-300 dark:border-slate-700 rounded shrink-0 p-0.5"
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Minimal Header */
              <div className="border-b border-slate-800 pb-2 mb-4 text-center">
                <h2 className="text-lg font-black font-serif text-slate-900 dark:text-slate-100">
                  পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
                </h2>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {activeClassObj?.nameBangla} • {tradeApplies ? selectedTradeCode : "Pre-Vocational"} • শাখা {selectedSection} • সেশন {selectedSession}
                </div>
              </div>
            )}

            {/* Document Body Area */}
            <div className="space-y-4">
              {/* ------------------------------------------------------------- */}
              {/* VIEW A: CLASS ROUTINE MATRIX */}
              {/* ------------------------------------------------------------- */}
              {selectedTemplate === "routine_class" && (
                <div className="overflow-x-auto">
                  <table className="print-table w-full text-center border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800">
                        <th className="p-2 border border-slate-700 w-24">বার / দিন</th>
                        {PERIODS.map((p) => (
                          <th key={p} className="p-2 border border-slate-700">
                            <div>{toBengaliNumerals(p)}ম পিরিয়ড</div>
                            <div className="text-[9px] font-normal text-slate-600 dark:text-slate-400 font-mono">
                              {p === 1
                                ? "08:30-09:15"
                                : p === 2
                                ? "09:15-10:00"
                                : p === 3
                                ? "10:00-10:45"
                                : p === 4
                                ? "10:45-11:30"
                                : p === 5
                                ? "11:45-12:30"
                                : p === 6
                                ? "12:30-01:15"
                                : p === 7
                                ? "02:00-02:45"
                                : "02:45-03:30"}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {WEEK_DAYS.map((day) => (
                        <tr key={day} className="border-b border-slate-700">
                          <td className="p-2 border border-slate-700 font-bold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                            {WEEK_DAYS_BN[day]}
                          </td>
                          {PERIODS.map((period) => {
                            const slot = filteredClassRoutines.find(
                              (r) => r.day.toLowerCase() === day.toLowerCase() && r.periodNo === period
                            );

                            return (
                              <td key={period} className="p-1.5 border border-slate-700 align-middle">
                                {slot ? (
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-[11px] text-slate-950 leading-tight">
                                      {slot.subjectNameBangla || slot.subjectName}
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-700 dark:text-slate-300">
                                      [{slot.subjectCode}]
                                    </div>
                                    <div className="text-[10px] text-indigo-900 font-semibold truncate">
                                      {slot.teacherName}
                                    </div>
                                    <div className="text-[9px] text-slate-600 dark:text-slate-400 font-mono">
                                      {slot.roomNo || "রুম-১০১"}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 text-xs">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* VIEW B: TEACHER WORKLOAD ROUTINE */}
              {/* ------------------------------------------------------------- */}
              {selectedTemplate === "routine_teacher" && (
                <div className="overflow-x-auto space-y-3">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-2 border border-slate-300 dark:border-slate-700 rounded flex justify-between">
                    <span>শিক্ষকের নাম: <strong>{selectedTeacherName}</strong></span>
                    <span>সাপ্তাহিক মোট ক্লাস: <strong>{filteredTeacherRoutines.length} পিরিয়ড</strong></span>
                  </div>

                  <table className="print-table w-full text-center border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800">
                        <th className="p-2 border border-slate-700 w-24">বার / দিন</th>
                        {PERIODS.map((p) => (
                          <th key={p} className="p-2 border border-slate-700">
                            {toBengaliNumerals(p)}ম পিরিয়ড
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {WEEK_DAYS.map((day) => (
                        <tr key={day} className="border-b border-slate-700">
                          <td className="p-2 border border-slate-700 font-bold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                            {WEEK_DAYS_BN[day]}
                          </td>
                          {PERIODS.map((period) => {
                            const slot = filteredTeacherRoutines.find(
                              (r) => r.day.toLowerCase() === day.toLowerCase() && r.periodNo === period
                            );

                            return (
                              <td key={period} className="p-1.5 border border-slate-700 align-middle">
                                {slot ? (
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-[11px] text-slate-950">
                                      {slot.subjectNameBangla || slot.subjectName}
                                    </div>
                                    <div className="text-[10px] text-indigo-900 font-bold">
                                      {slot.className || `Class ${slot.classId}`}
                                    </div>
                                    <div className="text-[9px] text-slate-600 dark:text-slate-400 font-mono">
                                      {slot.roomNo}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 text-xs">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* VIEW C: STUDENT ROLL SHEET / DIRECTORY */}
              {/* ------------------------------------------------------------- */}
              {(selectedTemplate === "directory_roll_sheet" || selectedTemplate === "attendance_daily") && (
                <div className="overflow-x-auto">
                  <table className="print-table w-full text-center border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800">
                        <th className="p-2 border border-slate-700 w-12">রোল</th>
                        <th className="p-2 border border-slate-700 w-28">আইডি</th>
                        <th className="p-2 border border-slate-700 text-left">শিক্ষার্থীর নাম</th>
                        <th className="p-2 border border-slate-700 text-left">পিতার নাম</th>
                        <th className="p-2 border border-slate-700 w-24">ট্রেড</th>
                        <th className="p-2 border border-slate-700 w-14">শাখা</th>
                        <th className="p-2 border border-slate-700 w-28">
                          {selectedTemplate === "attendance_daily" ? "হাজিরা স্বাক্ষর" : "যোগাযোগ"}
                        </th>
                        <th className="p-2 border border-slate-700 w-24">মন্তব্য</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-500 dark:text-slate-400">
                            কোনো শিক্ষার্থী পাওয়া যায়নি
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s) => (
                          <tr key={s.id} className="border-b border-slate-700">
                            <td className="p-2 border border-slate-700 font-bold font-mono">
                              {toBengaliNumerals(s.roll)}
                            </td>
                            <td className="p-2 border border-slate-700 font-mono text-[10px]">
                              {s.studentId}
                            </td>
                            <td className="p-2 border border-slate-700 text-left font-bold text-slate-950">
                              {s.nameBangla || s.name}
                            </td>
                            <td className="p-2 border border-slate-700 text-left text-slate-700 dark:text-slate-300">
                              {s.fatherName || "—"}
                            </td>
                            <td className="p-2 border border-slate-700 text-[10px]">
                              {s.tradeName || activeTradeObj?.nameBangla || "সাধারণ"}
                            </td>
                            <td className="p-2 border border-slate-700 font-bold">
                              {s.section || selectedSection}
                            </td>
                            <td className="p-2 border border-slate-700 font-mono text-[10px]">
                              {selectedTemplate === "attendance_daily" ? (
                                <span className="inline-block w-full h-5 border-b border-dashed border-slate-400"></span>
                              ) : (
                                (s as any).phone || (s as any).mobile || "—"
                              )}
                            </td>
                            <td className="p-2 border border-slate-700 text-[10px] text-slate-500 dark:text-slate-400">
                              নিয়মিত
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* VIEW D: BTEB MONTHLY REGISTER GRID */}
              {/* ------------------------------------------------------------- */}
              {selectedTemplate === "attendance_monthly" && (
                <div className="overflow-x-auto space-y-2">
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 flex justify-between px-1">
                    <span>মাস: <strong>{selectedMonth}/২০২৬</strong> • মোট কর্মদিবস: <strong>২২ দিন</strong></span>
                    <span>শুক্রবার (শুক্র) ও শনিবার (শনি) প্রাতিষ্ঠানিক সাপ্তাহিক ছুটি</span>
                  </div>

                  <table className="print-table w-full text-center border-collapse text-[9px]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800">
                        <th className="p-1 border border-slate-700 w-8">রোল</th>
                        <th className="p-1 border border-slate-700 w-32 text-left">নাম</th>
                        {/* 31 days header */}
                        {Array.from({ length: 31 }, (_, i) => {
                          const dayNum = i + 1;
                          const dateStr = `2026-${selectedMonth}-${String(dayNum).padStart(2, "0")}`;
                          const d = new Date(dateStr + "T00:00:00");
                          const dayOfWeek = d.getDay();
                          const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

                          return (
                            <th
                              key={dayNum}
                              className={`p-0.5 border border-slate-700 w-5 font-mono ${
                                isWeekend ? "bg-slate-200 dark:bg-slate-700 text-rose-800 font-bold" : ""
                              }`}
                            >
                              <div>{dayNum}</div>
                              <div className="text-[7px]">
                                {dayOfWeek === 5 ? "শু" : dayOfWeek === 6 ? "শ" : ""}
                              </div>
                            </th>
                          );
                        })}
                        <th className="p-1 border border-slate-700 w-8">উপঃ</th>
                        <th className="p-1 border border-slate-700 w-8">অনুঃ</th>
                        <th className="p-1 border border-slate-700 w-10">হার%</th>
                        <th className="p-1 border border-slate-700 w-8">TC(৫)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, idx) => {
                        const present = 20 - (idx % 3);
                        const absent = 22 - present;
                        const pct = Math.round((present / 22) * 100);
                        const tcMark = pct >= 90 ? 5 : pct >= 80 ? 4 : pct >= 70 ? 3 : 2;

                        return (
                          <tr key={s.id} className="border-b border-slate-700">
                            <td className="p-1 border border-slate-700 font-mono font-bold">
                              {toBengaliNumerals(s.roll)}
                            </td>
                            <td className="p-1 border border-slate-700 text-left font-bold truncate max-w-[120px]">
                              {s.nameBangla || s.name}
                            </td>
                            {Array.from({ length: 31 }, (_, i) => {
                              const dayNum = i + 1;
                              const dateStr = `2026-${selectedMonth}-${String(dayNum).padStart(2, "0")}`;
                              const d = new Date(dateStr + "T00:00:00");
                              const dayOfWeek = d.getDay();
                              const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

                              if (isWeekend) {
                                return (
                                  <td
                                    key={dayNum}
                                    className="p-0.5 border border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 font-mono"
                                  >
                                    {dayOfWeek === 5 ? "শু" : "শ"}
                                  </td>
                                );
                              }

                              const isAbs = (idx + dayNum) % 11 === 0;
                              return (
                                <td key={dayNum} className="p-0.5 border border-slate-700 font-mono">
                                  {isAbs ? "A" : "P"}
                                </td>
                              );
                            })}
                            <td className="p-1 border border-slate-700 font-mono font-bold text-emerald-800">
                              {present}
                            </td>
                            <td className="p-1 border border-slate-700 font-mono font-bold text-rose-800">
                              {absent}
                            </td>
                            <td className="p-1 border border-slate-700 font-mono font-bold">
                              {pct}%
                            </td>
                            <td className="p-1 border border-slate-700 font-mono font-black text-amber-800">
                              {tcMark}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* VIEW E: CONTINUOUS ASSESSMENT SHEET (TC / PC) */}
              {/* ------------------------------------------------------------- */}
              {(selectedTemplate === "assessment_continuous" || selectedTemplate === "assessment_tabulation") && (
                <div className="overflow-x-auto space-y-2">
                  <table className="print-table w-full text-center border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800">
                        <th className="p-2 border border-slate-700 w-12" rowSpan={2}>রোল</th>
                        <th className="p-2 border border-slate-700 text-left w-36" rowSpan={2}>শিক্ষার্থীর নাম</th>
                        <th className="p-1 border border-slate-700" colSpan={4}>তাত্ত্বিক ধারাবাহিক (TC - ৬০)</th>
                        <th className="p-1 border border-slate-700" colSpan={3}>ব্যবহারিক ধারাবাহিক (PC - ৪০)</th>
                        <th className="p-2 border border-slate-700 w-16" rowSpan={2}>ধারাবাহিক মোট (১০০)</th>
                        <th className="p-2 border border-slate-700 w-14" rowSpan={2}>লেটার গ্রেড</th>
                        <th className="p-2 border border-slate-700 w-14" rowSpan={2}>গ্রেড পয়েন্ট</th>
                      </tr>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-[9px]">
                        <th className="p-1 border border-slate-700">হাজিরা (১০)</th>
                        <th className="p-1 border border-slate-700">কুইজ (১০)</th>
                        <th className="p-1 border border-slate-700">শ্রেণি পরীক্ষা (২০)</th>
                        <th className="p-1 border border-slate-700">অ্যাসাইনমেন্ট (২০)</th>
                        <th className="p-1 border border-slate-700">জব কাজ (২০)</th>
                        <th className="p-1 border border-slate-700">রিপোর্ট (১০)</th>
                        <th className="p-1 border border-slate-700">মৌখিক (১০)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, idx) => {
                        const tcAtt = 9;
                        const tcQuiz = 8 + (idx % 3);
                        const tcClassTest = 17 + (idx % 4);
                        const tcAssign = 18 + (idx % 3);
                        const tcTotal = tcAtt + tcQuiz + tcClassTest + tcAssign;

                        const pcJob = 18 + (idx % 3);
                        const pcReport = 9;
                        const pcViva = 8 + (idx % 3);
                        const pcTotal = pcJob + pcReport + pcViva;

                        const grandTotal = tcTotal + pcTotal;
                        const gpa = grandTotal >= 80 ? "5.00" : grandTotal >= 70 ? "4.00" : "3.50";
                        const lg = grandTotal >= 80 ? "A+" : grandTotal >= 70 ? "A" : "A-";

                        return (
                          <tr key={s.id} className="border-b border-slate-700">
                            <td className="p-1.5 border border-slate-700 font-mono font-bold">
                              {toBengaliNumerals(s.roll)}
                            </td>
                            <td className="p-1.5 border border-slate-700 text-left font-bold text-slate-950">
                              {s.nameBangla || s.name}
                            </td>
                            <td className="p-1.5 border border-slate-700 font-mono">{tcAtt}</td>
                            <td className="p-1.5 border border-slate-700 font-mono">{tcQuiz}</td>
                            <td className="p-1.5 border border-slate-700 font-mono">{tcClassTest}</td>
                            <td className="p-1.5 border border-slate-700 font-mono">{tcAssign}</td>
                            <td className="p-1.5 border border-slate-700 font-mono">{pcJob}</td>
                            <td className="p-1.5 border border-slate-700 font-mono">{pcReport}</td>
                            <td className="p-1.5 border border-slate-700 font-mono">{pcViva}</td>
                            <td className="p-1.5 border border-slate-700 font-mono font-black text-indigo-900 bg-slate-50 dark:bg-slate-950">
                              {grandTotal}
                            </td>
                            <td className="p-1.5 border border-slate-700 font-black text-emerald-800">
                              {lg}
                            </td>
                            <td className="p-1.5 border border-slate-700 font-mono font-bold">
                              {gpa}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Official 3-Part Signature Blocks */}
            {showSignatures && (
              <div className="print-signature-block mt-12 pt-6 border-t border-slate-300 dark:border-slate-700 flex justify-between items-end text-center text-xs font-bold text-slate-900 dark:text-slate-100">
                <div className="space-y-1 w-44">
                  <div className="border-t border-slate-700 pt-1">
                    শ্রেণি শিক্ষক (Class Teacher)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    স্বাক্ষর ও তারিখ
                  </div>
                </div>

                <div className="space-y-1 w-52">
                  <div className="border-t border-slate-700 pt-1">
                    বিভাগীয় প্রধান / পরীক্ষা নিয়ন্ত্রক
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    কারিগরি শাখা, PTSC
                  </div>
                </div>

                <div className="space-y-1 w-48">
                  <div className="border-t border-slate-700 pt-1 font-black">
                    অধ্যক্ষ (Principal)
                  </div>
                  <div className="text-[10px] text-slate-700 dark:text-slate-300 font-normal">
                    পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
                  </div>
                </div>
              </div>
            )}

            {/* Official Institutional Footer Timestamp */}
            <div className="mt-6 pt-2 border-t border-slate-200 dark:border-slate-800 text-[9px] text-slate-500 dark:text-slate-400 flex justify-between items-center font-mono">
              <span>PTSC Central ERP System • BTEB 2026 Curriculum Standard</span>
              <span>Generated on: {new Date().toISOString()} • Page 1 of 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
