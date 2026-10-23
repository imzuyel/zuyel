"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  BookOpen,
  Settings,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Edit3,
  Sliders,
  Sparkles,
  ArrowRight,
  Database,
  ShieldCheck,
  Check,
  Clock,
  HelpCircle,
  Copy,
  ExternalLink,
  Laptop,
  Cpu,
  Zap,
  Scissors,
  BookmarkCheck,
  Flame,
  LayoutGrid,
  List,
  GraduationCap,
  Save,
  RotateCcw,
} from "lucide-react";
import {
  ClassConfiguration,
  TradeConfiguration,
  DynamicSubjectItem,
  getAllClassConfigurations,
  getAllTradeConfigurations,
} from "@/lib/globalSubjectMappingHub";
import { ALL_TRADES, ACADEMIC_CLASSES } from "@/lib/academicStructure";
import CentralAcademicMappingView from "@/components/academic/CentralAcademicMappingView";
import AcademicYearsManagerView from "@/components/academic/AcademicYearsManagerView";
import InstitutionSettingsView from "@/components/academic/InstitutionSettingsView";

export default function GlobalSettingsSubjectMappingHub() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    "mappings" | "mapping" | "years" | "classes" | "catalog" | "institution" | "playground"
  >("mappings");

  // Global settings state
  const [academicYear, setAcademicYear] = useState<string>("2026");
  const [selectedClassVal, setSelectedClassVal] = useState<number>(4); // Class 9 by default
  const [selectedTradeVal, setSelectedTradeVal] = useState<string>("101"); // IT-IoT by default
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Data states
  const [classes, setClasses] = useState<ClassConfiguration[]>([]);
  const [trades, setTrades] = useState<TradeConfiguration[]>([]);
  const [mappedSubjects, setMappedSubjects] = useState<DynamicSubjectItem[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Modal states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<ClassConfiguration | null>(null);
  const [isCreateMasterModalOpen, setIsCreateMasterModalOpen] = useState<boolean>(false);

  // New assignment form state
  const [assignForm, setAssignForm] = useState({
    subjectId: 0,
    customCode: "",
    customName: "",
    customNameBangla: "",
    subjectType: "Theory + Practical",
    weeklyPeriods: 4,
    theoryPeriods: 2,
    practicalPeriods: 2,
    labPeriods: 0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 60,
    practicalMarks: 40,
    continuousMarks: 20,
    isOptional: false,
  });

  // New master subject form state
  const [masterForm, setMasterForm] = useState({
    code: "",
    name: "",
    nameBangla: "",
    shortName: "",
    subjectType: "Theory + Practical",
    creditHours: 3.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 60,
    practicalMarks: 40,
    continuousMarks: 20,
    description: "",
    btebCurriculumRef: "BTEB-2026",
  });

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Initial Overview & Classes
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/academic/global-settings?action=overview&academicYear=${academicYear}`);
      if (res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setClasses(data.classes || getAllClassConfigurations());
          setTrades(data.trades || getAllTradeConfigurations());
        } else {
          setClasses(getAllClassConfigurations());
          setTrades(getAllTradeConfigurations());
        }
      } else {
        setClasses(getAllClassConfigurations());
        setTrades(getAllTradeConfigurations());
      }
    } catch {
      setClasses(getAllClassConfigurations());
      setTrades(getAllTradeConfigurations());
    } finally {
      setIsLoading(false);
    }
  };

  // Load Mapped Subjects for Selected Class & Trade
  const loadMappedSubjects = async () => {
    try {
      const params = new URLSearchParams({
        action: "mapped_subjects",
        classVal: String(selectedClassVal),
        academicYear,
      });
      if (selectedTradeVal && selectedTradeVal !== "all") {
        params.append("tradeVal", selectedTradeVal);
      }

      const res = await fetch(`/api/academic/global-settings?${params.toString()}`);
      if (res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
        const data = await res.json();
        if (data.success && Array.isArray(data.subjects)) {
          setMappedSubjects(data.subjects);
        } else {
          setMappedSubjects([]);
        }
      } else {
        setMappedSubjects([]);
      }
    } catch {
      setMappedSubjects([]);
    }
  };

  // Load Master Catalog
  const loadMasterCatalog = async () => {
    try {
      const res = await fetch(`/api/academic/global-settings?action=master_subjects`);
      if (res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
        const data = await res.json();
        if (data.success && Array.isArray(data.subjects)) {
          setMasterCatalog(data.subjects);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadInitialData();
    loadMasterCatalog();
  }, [academicYear]);

  useEffect(() => {
    loadMappedSubjects();
  }, [selectedClassVal, selectedTradeVal, academicYear]);

  // Selected Class details
  const currentClassObj = useMemo(() => {
    return classes.find((c) => c.numericValue === selectedClassVal || c.id === selectedClassVal);
  }, [classes, selectedClassVal]);

  const hasTrade = useMemo(() => {
    return selectedClassVal >= 9 && selectedClassVal <= 12;
  }, [selectedClassVal]);

  const applicableTrades = useMemo(() => {
    if (!hasTrade) return [];
    return trades.filter((t) => t.applicableClass === selectedClassVal);
  }, [trades, hasTrade, selectedClassVal]);

  // Ensure valid trade selection when class changes
  useEffect(() => {
    if (hasTrade && applicableTrades.length > 0) {
      const exists = applicableTrades.some((t) => String(t.id) === selectedTradeVal);
      if (!exists) {
        setSelectedTradeVal(String(applicableTrades[0].id));
      }
    } else {
      setSelectedTradeVal("all");
    }
  }, [selectedClassVal, hasTrade, applicableTrades]);

  // Handle Remove Subject Mapping
  const handleRemoveMapping = async (mappingId?: string) => {
    if (!mappingId) return;
    if (!confirm("আপনি কি নিশ্চিতভাবে এই শ্রেণি থেকে বিষয়টি বাদ দিতে চান?")) return;

    try {
      const res = await fetch("/api/academic/global-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_mapping",
          mappingId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("বিষয়টি সফলভাবে রিমুভ করা হয়েছে!", "success");
        loadMappedSubjects();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("pts-academic-mapping-updated"));
        }
      } else {
        showToast(data.error || "রিমুভ করতে ব্যর্থ হয়েছে", "error");
      }
    } catch {
      showToast("নেটওয়ার্ক সমস্যা", "error");
    }
  };

  // Handle Apply BTEB Official Preset
  const handleApplyPreset = async () => {
    if (
      !confirm(
        `আপনি কি ${currentClassObj?.nameBangla || `Class ${selectedClassVal}`}-এর জন্য সরকারি BTEB/NCTB প্রিসেট স্বয়ংক্রিয়ভাবে ম্যাপ করতে চান?`
      )
    )
      return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/academic/global-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_preset",
          classVal: selectedClassVal,
          tradeVal: selectedTradeVal,
          academicYear,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        loadMappedSubjects();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("pts-academic-mapping-updated"));
        }
      } else {
        showToast(data.error || "প্রিসেট অ্যাপ্লাই ব্যর্থ হয়েছে", "error");
      }
    } catch {
      showToast("সার্ভার এরর", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save New Subject Mapping
  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    let selectedSub = masterCatalog.find((m) => m.id === assignForm.subjectId);

    if (!selectedSub && assignForm.customCode && assignForm.customName) {
      selectedSub = {
        id: Date.now(),
        code: assignForm.customCode,
        name: assignForm.customName,
        nameBangla: assignForm.customNameBangla || assignForm.customName,
        subjectType: assignForm.subjectType,
      };
    }

    if (!selectedSub) {
      showToast("অনুগ্রহ করে একটি বিষয় নির্বাচন করুন বা তৈরি করুন", "error");
      return;
    }

    const tradeNum = selectedTradeVal !== "all" && Number(selectedTradeVal) > 0 ? Number(selectedTradeVal) : undefined;
    const tradeObj = tradeNum ? trades.find((t) => t.id === tradeNum) : undefined;

    const payload = {
      academicYear,
      classId: selectedClassVal <= 7 ? selectedClassVal : selectedClassVal - 5,
      className: currentClassObj?.name || `Class ${selectedClassVal}`,
      numericClass: selectedClassVal,
      section: "all",
      tradeId: tradeObj?.id,
      tradeCode: tradeObj?.code,
      tradeName: tradeObj?.name,
      subjectId: selectedSub.id,
      subjectCode: selectedSub.code,
      subjectName: selectedSub.name,
      subjectNameBangla: selectedSub.nameBangla || selectedSub.name,
      subjectType: assignForm.subjectType,
      isOptional: assignForm.isOptional,
      weeklyPeriods: Number(assignForm.weeklyPeriods),
      theoryPeriods: Number(assignForm.theoryPeriods),
      practicalPeriods: Number(assignForm.practicalPeriods),
      labPeriods: Number(assignForm.labPeriods),
      requiredWeeklyHours: Number(assignForm.weeklyPeriods) * 0.75,
      fullMarks: Number(assignForm.fullMarks),
      passMarks: Number(assignForm.passMarks),
      theoryMarks: Number(assignForm.theoryMarks),
      practicalMarks: Number(assignForm.practicalMarks),
      vivaMarks: 0,
      continuousMarks: Number(assignForm.continuousMarks),
      displayOrder: mappedSubjects.length + 1,
      status: "Active",
    };

    setIsSaving(true);
    try {
      const res = await fetch("/api/academic/global-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_mapping",
          mapping: payload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("বিষয়টি সফলভাবে ম্যাপ করা হয়েছে!", "success");
        setIsAssignModalOpen(false);
        loadMappedSubjects();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("pts-academic-mapping-updated"));
        }
      } else {
        showToast(data.error || "ম্যাপিং ব্যর্থ হয়েছে", "error");
      }
    } catch {
      showToast("নেটওয়ার্ক সমস্যা", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save Class Configuration Edit
  const handleSaveClassConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    try {
      const res = await fetch("/api/academic/global-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_class",
          classId: editingClass.id,
          updates: {
            totalSeats: Number(editingClass.totalSeats),
            sections: editingClass.sections,
            shifts: editingClass.shifts,
            status: editingClass.status,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("শ্রেণি কনফিগারেশন সংরক্ষিত হয়েছে!", "success");
        setIsEditClassModalOpen(false);
        loadInitialData();
      } else {
        showToast(data.error || "আপডেট ব্যর্থ হয়েছে", "error");
      }
    } catch {
      showToast("সার্ভার এরর", "error");
    }
  };

  // Filter mapped subjects
  const filteredSubjects = useMemo(() => {
    if (!searchFilter.trim()) return mappedSubjects;
    const q = searchFilter.toLowerCase();
    return mappedSubjects.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.nameBangla.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [mappedSubjects, searchFilter]);

  const totalWeeklyPeriods = useMemo(() => {
    return filteredSubjects.reduce((acc, s) => acc + (s.weeklyPeriods || 0), 0);
  }, [filteredSubjects]);

  const totalFullMarks = useMemo(() => {
    return filteredSubjects.reduce((acc, s) => acc + (s.fullMarks || 0), 0);
  }, [filteredSubjects]);

  return (
    <div className="space-y-6 text-slate-100 font-sans pb-16">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium transition-all duration-300 ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
              : toastMessage.type === "error"
              ? "bg-rose-950/90 text-rose-200 border-rose-500/40"
              : "bg-cyan-950/90 text-cyan-200 border-cyan-500/40"
          }`}
        >
          {toastMessage.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toastMessage.type === "info" && <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0" />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>CENTRAL CURRICULUM AUTHORITY · BTEB & DTE COMPLIANT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              গ্লোবাল সেটিংস ও বিষয় ম্যাপিং হাব (Single Source of Truth)
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের ৬ষ্ঠ থেকে ১২শ শ্রেণির সকল কারিগরি ট্রেড ও বিষয় ম্যাপিংয়ের কেন্দ্রীয় ডাটাবেজ। এখানে সংরক্ষিত বিষয় ও কারিকুলাম কনফিগারেশন সরাসরি রুটিন, ডিজিটাল হাজিরা এবং ফলাফল মডিউলে ব্যবহৃত হয়।
            </p>
            <div className="flex items-center gap-3 pt-1 text-xs text-slate-400">
              <span className="font-semibold text-indigo-400">PTSC Institutional Engine</span>
              <span>·</span>
              <span>একাডেমিক সেশন: {academicYear}</span>
              <span>·</span>
              <span>মোট শ্রেণি: {classes.length}টি</span>
              <span>·</span>
              <span>ভোকেশনাল ট্রেড: {trades.length}টি</span>
            </div>
          </div>

          {/* Quick Academic Year Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400 pl-2">সেশন:</span>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
              >
                <option value="2026">২০২৬ শিক্ষাবর্ষ</option>
                <option value="2027">২০২৭ শিক্ষাবর্ষ</option>
              </select>
            </div>

            <button
              onClick={() => {
                loadInitialData();
                loadMappedSubjects();
                showToast("সকল তথ্য রিফ্রেশ করা হয়েছে!", "info");
              }}
              className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-6 mt-6 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab("mappings")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "mappings"
                ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-300" />
            <span>কেন্দ্রীয় একাডেমিক ম্যাপিং (Academic Mapping)</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 font-mono">
              Core
            </span>
          </button>

          <button
            onClick={() => setActiveTab("mapping")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "mapping"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>বিষয় ম্যাপিং (Subject Mapping)</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 text-indigo-200">
              {mappedSubjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("years")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "years"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>শিক্ষাবর্ষ ও সেশন (Academic Years)</span>
          </button>

          <button
            onClick={() => setActiveTab("classes")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "classes"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>শ্রেণি ও ট্রেড কনফিগারেশন (Classes & Trades)</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 text-indigo-200">
              {classes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "catalog"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>বিষয় ভান্ডার (Master Catalog)</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 text-indigo-200">
              {masterCatalog.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("institution")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "institution"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>প্রতিষ্ঠান প্রোফাইল (Institution)</span>
          </button>

          <button
            onClick={() => setActiveTab("playground")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "playground"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>লাইভ টেস্ট ও ইন্টিগ্রেশন (Playground)</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 0: CENTRAL ACADEMIC MAPPING (PHASE 3 GLOBAL FOUNDATION)*/}
      {/* ========================================================= */}
      {activeTab === "mappings" && (
        <CentralAcademicMappingView />
      )}

      {/* ========================================================= */}
      {/* TAB: ACADEMIC YEARS & SESSIONS MANAGER                   */}
      {/* ========================================================= */}
      {activeTab === "years" && (
        <AcademicYearsManagerView />
      )}

      {/* ========================================================= */}
      {/* TAB: INSTITUTION SETTINGS & PROFILE                       */}
      {/* ========================================================= */}
      {activeTab === "institution" && (
        <InstitutionSettingsView />
      )}

      {/* ========================================================= */}
      {/* TAB 1: SUBJECT MAPPING ENGINE (SINGLE SOURCE OF TRUTH)     */}
      {/* ========================================================= */}
      {activeTab === "mapping" && (
        <div className="space-y-6">
          {/* Class & Trade Control Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>শ্রেণি ও ট্রেড ফিল্টার করুন</span>
                </h2>
                <p className="text-xs text-slate-400">
                  যে শ্রেণির কারিকুলাম ও বিষয় নির্ধারণ করতে চান সেটি নির্বাচন করুন।
                </p>
              </div>

              {/* Action Buttons: Assign Subject & BTEB Preset */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleApplyPreset}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  title="সরকারি বিটিইবি কারিকুলাম প্রিসেট স্বয়ংক্রিয়ভাবে অ্যাপ্লাই করুন"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>BTEB স্ট্যান্ডার্ড প্রিসেট লোড</span>
                </button>

                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন বিষয় যুক্ত করুন</span>
                </button>
              </div>
            </div>

            {/* Class Pill-Free Button Switcher */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
              {classes.map((cls) => {
                const isSelected = selectedClassVal === cls.numericValue;
                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassVal(cls.numericValue)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-sm">{cls.name}</span>
                      {cls.hasTrade && (
                        <span className="text-[10px] text-cyan-400 font-mono font-bold">Vocational</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{cls.nameBangla}</div>
                  </button>
                );
              })}
            </div>

            {/* If class has trades (Class 9-12), show Trade Switcher */}
            {hasTrade && (
              <div className="pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>ট্রেড নির্বাচন করুন ({currentClassObj?.name}):</span>
                </span>

                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <button
                    onClick={() => setSelectedTradeVal("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedTradeVal === "all"
                        ? "bg-white dark:bg-slate-900 text-slate-950 shadow-sm"
                        : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    সকল সাধারণ ও ট্রেড বিষয় (All)
                  </button>

                  {applicableTrades.map((t) => {
                    const isSelected = selectedTradeVal === String(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTradeVal(String(t.id))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                            : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        {t.tradeNumber === 1 && <Laptop className="w-3.5 h-3.5" />}
                        {t.tradeNumber === 2 && <Zap className="w-3.5 h-3.5" />}
                        {t.tradeNumber === 3 && <Cpu className="w-3.5 h-3.5" />}
                        {t.tradeNumber === 4 && <Scissors className="w-3.5 h-3.5" />}
                        <span>
                          {t.name} ({t.code})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Mapping Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-400 font-medium">নির্ধারিত মোট বিষয়</span>
              <div className="text-xl font-black text-white">{filteredSubjects.length}টি</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentClassObj?.nameBangla || `Class ${selectedClassVal}`}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-400 font-medium">সাপ্তাহিক মোট পিরিয়ড</span>
              <div className="text-xl font-black text-indigo-400">{totalWeeklyPeriods}টি</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">ক্লাস রুটিন সামঞ্জস্যপূর্ণ</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-400 font-medium">মোট নম্বর (Full Marks)</span>
              <div className="text-xl font-black text-cyan-400">{totalFullMarks}</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">বোর্ড পরীক্ষা মূল্যায়ন</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-400 font-medium">কারিকুলাম স্ট্যাটাস</span>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>অ্যাক্টিভ ও সিঙ্কড</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">সকল মডিউলে কার্যকর</span>
            </div>
          </div>

          {/* Subjects Table & Search */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Table Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500 dark:text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="কোড বা বিষয়ের নামে খুঁজুন..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>প্রদর্শিত হচ্ছে: {filteredSubjects.length}টি বিষয়</span>
              </div>
            </div>

            {/* Main Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">কোড</th>
                    <th className="py-3 px-4">বিষয় ও পাঠ্যবই (Subject Title)</th>
                    <th className="py-3 px-4">ক্যাটাগরি</th>
                    <th className="py-3 px-4">সাপ্তাহিক লোড (পিরিয়ড)</th>
                    <th className="py-3 px-4">নম্বর বণ্টন</th>
                    <th className="py-3 px-4">টাইপ</th>
                    <th className="py-3 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        <BookOpen className="w-10 h-10 mx-auto text-slate-600 dark:text-slate-400 mb-2" />
                        <p className="text-sm font-semibold text-slate-300">কোনো বিষয় ম্যাপ করা নেই</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          "BTEB স্ট্যান্ডার্ড প্রিসেট লোড" বা "নতুন বিষয় যুক্ত করুন" বাটনে ক্লিক করুন।
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredSubjects.map((sub) => (
                      <tr key={sub.mappingId || sub.code} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{sub.code}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{sub.nameBangla}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <span>{sub.name}</span>
                            {sub.tradeCode && (
                              <>
                                <span>·</span>
                                <span className="text-cyan-400 font-mono font-semibold">{sub.tradeCode} Trade</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              sub.category === "Lab" || sub.category === "Workshop"
                                ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                                : sub.category === "Theory + Practical"
                                ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                                : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                            }`}
                          >
                            {sub.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-200">{sub.weeklyPeriods} পিরিয়ড / সপ্তাহ</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            তত্ত্বীয়: {sub.theoryPeriods} · ব্যবহারিক: {sub.practicalPeriods}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-200">পূর্ণমান: {sub.fullMarks}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            পাস: {sub.passMarks} · অবিচ্ছিন্ন: {sub.continuousMarks}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {sub.isOptional ? (
                            <span className="text-slate-400 text-xs">ঐচ্ছিক (Optional)</span>
                          ) : (
                            <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>আবশ্যিক</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleRemoveMapping(sub.mappingId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="বাদ দিন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CLASS & TRADE CONFIGURATION                        */}
      {/* ========================================================= */}
      {activeTab === "classes" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">প্রতিষ্ঠানভিত্তিক শ্রেণি ও ট্রেড কনফিগারেশন</h2>
                <p className="text-xs text-slate-400">
                  ৬ষ্ঠ থেকে ১২শ শ্রেণির মোট আসন সংখ্যা, শিফট, সেকশন এবং কারিগরি ট্রেড অ্যাসাইনমেন্ট পরিচালনা করুন।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {classes.map((cls) => {
                const assignedTrades = trades.filter((t) => t.applicableClass === cls.numericValue);
                return (
                  <div
                    key={cls.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-white">{cls.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                            cls.hasTrade
                              ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {cls.tier}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium">{cls.nameBangla}</div>

                      <div className="space-y-1.5 pt-2 text-xs text-slate-400 border-t border-slate-900">
                        <div className="flex justify-between">
                          <span>মোট অনুমোদিত আসন:</span>
                          <span className="font-bold text-white">{cls.totalSeats} জন</span>
                        </div>
                        <div className="flex justify-between">
                          <span>সেকশন:</span>
                          <span className="font-bold text-slate-300">{cls.sections.join(", ")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>শিফট:</span>
                          <span className="font-bold text-slate-300">১ম ও ২য় শিফট</span>
                        </div>
                      </div>

                      {/* Trade Binding */}
                      {cls.hasTrade && (
                        <div className="pt-2 border-t border-slate-900 space-y-1.5">
                          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                            যুক্ত কারিগরি ট্রেড ({assignedTrades.length}টি):
                          </span>
                          <div className="space-y-1">
                            {assignedTrades.map((t) => (
                              <div
                                key={t.id}
                                className="bg-slate-900/90 rounded-lg p-2 text-[11px] text-slate-300 flex items-center justify-between"
                              >
                                <span className="font-semibold">{t.name}</span>
                                <span className="font-mono text-cyan-400 text-[10px] font-bold">{t.code}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setEditingClass(cls);
                        setIsEditClassModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>কনফিগারেশন সম্পাদনা</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MASTER SUBJECT CATALOG                             */}
      {/* ========================================================= */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">কেন্দ্রীয় পাঠ্যবই ও বিষয় ভান্ডার (Master Catalog)</h2>
                <p className="text-xs text-slate-400">
                  জাতীয় শিক্ষাক্রম (NCTB) ও কারিগরি শিক্ষা বোর্ড (BTEB) অনুমোদিত সকল বিষয়ের তালিকা।
                </p>
              </div>

              <button
                onClick={() => setIsCreateMasterModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন মাস্টার বিষয় তৈরি করুন</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {masterCatalog.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-400 font-black text-sm">{sub.code}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {sub.subjectType}
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm">{sub.nameBangla}</div>
                    <div className="text-xs text-slate-400">{sub.name}</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 pt-1">{sub.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-900 text-xs text-slate-400 flex items-center justify-between">
                    <span>পূর্ণমান: {sub.fullMarks}</span>
                    <span>তত্ত্বীয়: {sub.theoryMarks}</span>
                    <span>ব্যবহারিক: {sub.practicalMarks}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: LIVE TEST & INTEGRATION PLAYGROUND                 */}
      {/* ========================================================= */}
      {activeTab === "playground" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold uppercase">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>CROSS-MODULE SIMULATION PLAYGROUND</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                রুটিন, হাজিরা ও নম্বর এন্ট্রি মডিউল টেস্ট কনসোল
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                এই প্লেগ্রাউন্ডে যাচাই করুন কীভাবে বিভিন্ন মডিউল নির্বাচিত শ্রেণির ওপর ভিত্তি করে রিয়েলটাইমে বিষয় ও তথ্য ফেচ করছে।
              </p>
            </div>

            {/* Simulation Control */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">টেস্ট শ্রেণি নির্বাচন করুন:</label>
                <select
                  value={selectedClassVal}
                  onChange={(e) => setSelectedClassVal(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.numericValue}>
                      {cls.name} - {cls.nameBangla}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">ট্রেড নির্বাচন করুন:</label>
                <select
                  value={selectedTradeVal}
                  onChange={(e) => setSelectedTradeVal(e.target.value)}
                  disabled={!hasTrade}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium disabled:opacity-50"
                >
                  <option value="all">সকল বিষয় (All)</option>
                  {applicableTrades.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic Output Result */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">
                  মডিউলে স্বয়ংক্রিয়ভাবে প্রেরিত বিষয়ের তালিকা ({mappedSubjects.length}টি বিষয় ফেচড):
                </span>
                <span className="text-emerald-400 font-mono">Status: 200 OK (Single Source of Truth)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {mappedSubjects.map((s) => (
                  <div key={s.code} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-400 font-bold text-xs">{s.code}</span>
                      <span className="text-[10px] text-slate-400">{s.category}</span>
                    </div>
                    <div className="font-bold text-white text-xs truncate">{s.nameBangla}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between pt-1 border-t border-slate-900">
                      <span>সাপ্তাহিক: {s.weeklyPeriods} পিরিয়ড</span>
                      <span>পূর্ণমান: {s.fullMarks}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Snippet for Developers */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="font-mono">React Hook Usage (অন্যান্য মডিউলে ব্যবহারের নিয়ম):</span>
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 font-mono text-[11px] text-indigo-300 overflow-x-auto">
{`import { useGlobalSubjects } from "@/lib/useGlobalSubjects";

// Inside Routine, Attendance, or Marks component:
const { subjects, isLoading } = useGlobalSubjects({
  classVal: ${selectedClassVal},
  tradeVal: "${selectedTradeVal}",
  academicYear: "${academicYear}",
});`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ASSIGN SUBJECT TO CLASS MODAL                    */}
      {/* ========================================================= */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <span>শ্রেণিতে বিষয় ম্যাপ করুন</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {currentClassObj?.nameBangla || `Class ${selectedClassVal}`}-এর জন্য পাঠ্যসূচি নির্ধারণ।
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMapping} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">মাস্টার ক্যাটালগ থেকে বিষয় নির্বাচন:</label>
                <select
                  value={assignForm.subjectId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const sub = masterCatalog.find((m) => m.id === id);
                    if (sub) {
                      setAssignForm({
                        ...assignForm,
                        subjectId: id,
                        subjectType: sub.subjectType,
                        fullMarks: sub.fullMarks,
                        passMarks: sub.passMarks,
                        theoryMarks: sub.theoryMarks,
                        practicalMarks: sub.practicalMarks,
                        continuousMarks: sub.continuousMarks,
                      });
                    } else {
                      setAssignForm({ ...assignForm, subjectId: id });
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={0}>-- তালিকা থেকে বিষয় বেছে নিন --</option>
                  {masterCatalog.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.code}] {m.nameBangla} ({m.name}) - {m.subjectType}
                    </option>
                  ))}
                </select>
              </div>

              {/* Or Custom Subject Fields */}
              {assignForm.subjectId === 0 && (
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="text-[11px] font-bold text-cyan-400">বা নতুন বিষয়ের তথ্য লিখুন:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1">বিষয় কোড:</label>
                      <input
                        type="text"
                        value={assignForm.customCode}
                        onChange={(e) => setAssignForm({ ...assignForm, customCode: e.target.value })}
                        placeholder="e.g. IT-901"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">ক্যাটাগরি:</label>
                      <select
                        value={assignForm.subjectType}
                        onChange={(e) => setAssignForm({ ...assignForm, subjectType: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                      >
                        <option value="Theory">Theory</option>
                        <option value="Practical">Practical</option>
                        <option value="Theory + Practical">Theory + Practical</option>
                        <option value="Lab">Lab</option>
                        <option value="Workshop">Workshop</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">বিষয়ের নাম (বাংলা):</label>
                    <input
                      type="text"
                      value={assignForm.customNameBangla}
                      onChange={(e) => setAssignForm({ ...assignForm, customNameBangla: e.target.value })}
                      placeholder="e.g. কম্পিউটার অ্যাপ্লিকেশন"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Periods and Marks Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-slate-400 block mb-1">সাপ্তাহিক পিরিয়ড:</label>
                  <input
                    type="number"
                    value={assignForm.weeklyPeriods}
                    onChange={(e) => setAssignForm({ ...assignForm, weeklyPeriods: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">তত্ত্বীয় পিরিয়ড:</label>
                  <input
                    type="number"
                    value={assignForm.theoryPeriods}
                    onChange={(e) => setAssignForm({ ...assignForm, theoryPeriods: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">ব্যবহারিক পিরিয়ড:</label>
                  <input
                    type="number"
                    value={assignForm.practicalPeriods}
                    onChange={(e) => setAssignForm({ ...assignForm, practicalPeriods: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">পূর্ণমান (Marks):</label>
                  <input
                    type="number"
                    value={assignForm.fullMarks}
                    onChange={(e) => setAssignForm({ ...assignForm, fullMarks: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <Save className="w-4 h-4" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT CLASS CONFIGURATION MODAL                   */}
      {/* ========================================================= */}
      {isEditClassModalOpen && editingClass && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <span>শ্রেণি কনফিগারেশন সম্পাদনা</span>
              </h3>
              <button
                onClick={() => setIsEditClassModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClassConfig} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">শ্রেণির নাম:</label>
                <input
                  type="text"
                  disabled
                  value={`${editingClass.name} (${editingClass.nameBangla})`}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">মোট অনুমোদিত আসন সংখ্যা:</label>
                <input
                  type="number"
                  value={editingClass.totalSeats}
                  onChange={(e) => setEditingClass({ ...editingClass, totalSeats: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">সেকশনসমূহ (কমা দিয়ে লিখুন):</label>
                <input
                  type="text"
                  value={editingClass.sections.join(", ")}
                  onChange={(e) =>
                    setEditingClass({
                      ...editingClass,
                      sections: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CREATE MASTER SUBJECT MODAL                      */}
      {/* ========================================================= */}
      {isCreateMasterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <span>নতুন মাস্টার বিষয় তৈরি করুন</span>
              </h3>
              <button
                onClick={() => setIsCreateMasterModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">বিষয় কোড (BTEB Code):</label>
                  <input
                    type="text"
                    value={masterForm.code}
                    onChange={(e) => setMasterForm({ ...masterForm, code: e.target.value })}
                    placeholder="e.g. 1911"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">ক্যাটাগরি:</label>
                  <select
                    value={masterForm.subjectType}
                    onChange={(e) => setMasterForm({ ...masterForm, subjectType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                    <option value="Theory + Practical">Theory + Practical</option>
                    <option value="Lab">Lab</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">বিষয়ের নাম (বাংলা):</label>
                <input
                  type="text"
                  value={masterForm.nameBangla}
                  onChange={(e) => setMasterForm({ ...masterForm, nameBangla: e.target.value })}
                  placeholder="e.g. কম্পিউটার অ্যান্ড আইওটি সিস্টেম"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">বিষয়ের নাম (English):</label>
                <input
                  type="text"
                  value={masterForm.name}
                  onChange={(e) => setMasterForm({ ...masterForm, name: e.target.value })}
                  placeholder="e.g. Computer & IoT System"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">পূর্ণমান:</label>
                  <input
                    type="number"
                    value={masterForm.fullMarks}
                    onChange={(e) => setMasterForm({ ...masterForm, fullMarks: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">তত্ত্বীয়:</label>
                  <input
                    type="number"
                    value={masterForm.theoryMarks}
                    onChange={(e) => setMasterForm({ ...masterForm, theoryMarks: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">ব্যবহারিক:</label>
                  <input
                    type="number"
                    value={masterForm.practicalMarks}
                    onChange={(e) => setMasterForm({ ...masterForm, practicalMarks: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateMasterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!masterForm.code || !masterForm.nameBangla) {
                      showToast("কোড ও নাম পূরণ করুন", "error");
                      return;
                    }
                    const newSub = {
                      id: Date.now(),
                      code: masterForm.code,
                      name: masterForm.name || masterForm.nameBangla,
                      nameBangla: masterForm.nameBangla,
                      shortName: masterForm.shortName || masterForm.code,
                      subjectType: masterForm.subjectType,
                      creditHours: masterForm.creditHours,
                      fullMarks: masterForm.fullMarks,
                      passMarks: masterForm.passMarks,
                      theoryMarks: masterForm.theoryMarks,
                      practicalMarks: masterForm.practicalMarks,
                      continuousMarks: masterForm.continuousMarks,
                      status: "Active",
                      description: masterForm.description || "BTEB Curriculum Subject",
                      btebCurriculumRef: masterForm.btebCurriculumRef,
                    };
                    setMasterCatalog([newSub, ...masterCatalog]);
                    showToast("নতুন মাস্টার বিষয় সফলভাবে যুক্ত হয়েছে!", "success");
                    setIsCreateMasterModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>তৈরি করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
