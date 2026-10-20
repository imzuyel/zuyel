"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Filter,
  Download,
  Printer,
  History,
  Settings,
  UserCheck,
  Eye,
  Sliders,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  Check,
  X,
  Lock,
  Unlock,
} from "lucide-react";
import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  doesClassHaveTrade,
  getApplicableTradesForClass,
  parseClassNumeric,
} from "@/lib/academicStructure";
import { Student, StudentIdConfig, StudentIdAuditLog } from "@/lib/database";
import { IdGenerationPreviewItem, IdCollisionReport } from "@/lib/studentIdEngine";
import { useAuth } from "@/context/AuthContext";

interface StudentIdHubProps {
  onNavigate?: (tab: string) => void;
  initialClassId?: number;
}

export default function StudentIdHub({ onNavigate, initialClassId }: StudentIdHubProps) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role !== "teacher";

  // Tab State
  const [activeTab, setActiveTab] = useState<
    "bulk" | "single" | "integrity" | "audit" | "config"
  >("bulk");

  // Core Data State
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<StudentIdConfig>({
    prefix: "PTSC",
    includeYear: true,
    yearFormat: "YYYY",
    includeClass: true,
    includeTradeForVocational: false,
    tradeFormat: "short",
    separator: "-",
    sequenceLength: 4,
    sequenceBasis: "roll",
  });
  const [previewPattern, setPreviewPattern] = useState("PTSC-2026-090001");
  const [integrityReport, setIntegrityReport] = useState<IdCollisionReport | null>(null);
  const [auditLogs, setAuditLogs] = useState<StudentIdAuditLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Bulk Generator Filters
  const [bulkClassId, setBulkClassId] = useState<string>(
    initialClassId ? String(initialClassId) : "4" // Default Class 9
  );
  const [bulkTradeId, setBulkTradeId] = useState<string>("all");
  const [bulkSection, setBulkSection] = useState<string>("all");
  const [bulkSession, setBulkSession] = useState<string>("2026");
  const [bulkMissingOnly, setBulkMissingOnly] = useState<boolean>(false);
  const [allowOverwriteExisting, setAllowOverwriteExisting] = useState<boolean>(false);
  const [previewItems, setPreviewItems] = useState<IdGenerationPreviewItem[]>([]);
  const [selectedPreviewMap, setSelectedPreviewMap] = useState<Record<number, boolean>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [bulkReason, setBulkReason] = useState("বার্ষিক সেশন অনুযায়ী স্টুডেন্ট আইডি প্রদান");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Single Generator State
  const [singleSearch, setSingleSearch] = useState("");
  const [selectedStudentForSingle, setSelectedStudentForSingle] = useState<Student | null>(null);
  const [singleCustomId, setSingleCustomId] = useState("");
  const [singleReason, setSingleReason] = useState("");
  const [isSingleSaving, setIsSingleSaving] = useState(false);

  // Config Form State
  const [editableConfig, setEditableConfig] = useState<StudentIdConfig>({ ...config });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Search in Audit Logs
  const [auditSearch, setAuditSearch] = useState("");

  // Academic Trade Applicability Check for Bulk View
  const bulkClassNumeric = parseClassNumeric(bulkClassId);
  const bulkHasTrade = doesClassHaveTrade(bulkClassNumeric);
  const bulkApplicableTrades = useMemo(() => {
    return getApplicableTradesForClass(bulkClassNumeric);
  }, [bulkClassNumeric]);

  // Load Initial ID Engine State
  const fetchHubData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/students/id-generator");
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setEditableConfig(data.config);
        setPreviewPattern(data.previewPattern);
        setIntegrityReport(data.integrityReport);
        setAuditLogs(data.auditLogs || []);
        setStudents(data.students || []);
      } else {
        setFeedback({ type: "error", message: data.error || "ডাটা লোড ব্যর্থ হয়েছে।" });
      }
    } catch (err: any) {
      console.error("Fetch ID Hub Error:", err);
      setFeedback({ type: "error", message: "সার্ভার সংযোগে ত্রুটি ঘটেছে।" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, []);

  // Handle Class change in Bulk tab
  const handleBulkClassChange = (newCls: string) => {
    setBulkClassId(newCls);
    if (!doesClassHaveTrade(newCls)) {
      setBulkTradeId("all");
    }
    setPreviewItems([]);
    setSelectedPreviewMap({});
  };

  // Run Pre-flight Preview for Bulk Generation
  const handleRunPreview = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch("/api/students/id-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preview",
          classId: bulkClassId,
          tradeId: bulkTradeId,
          section: bulkSection,
          session: bulkSession,
          missingOnly: bulkMissingOnly,
          allowOverwriteExisting,
          configOverride: config,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewItems(data.previewItems || []);
        // Pre-select valid items
        const initialMap: Record<number, boolean> = {};
        (data.previewItems as IdGenerationPreviewItem[]).forEach((item) => {
          if (item.status !== "collision") {
            initialMap[item.student.id] = item.status === "new" || (item.status === "overwrite" && allowOverwriteExisting);
          }
        });
        setSelectedPreviewMap(initialMap);
      } else {
        setFeedback({ type: "error", message: data.error || "প্রিভিউ তৈরি ব্যর্থ হয়েছে।" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "প্রিভিউ তৈরিতে ত্রুটি ঘটেছে।" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle selection for single item
  const toggleSelectStudent = (id: number) => {
    setSelectedPreviewMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Toggle Select All
  const toggleSelectAll = () => {
    const allSelected = previewItems.every(
      (item) => item.status === "collision" || selectedPreviewMap[item.student.id]
    );
    const updated: Record<number, boolean> = {};
    previewItems.forEach((item) => {
      if (item.status !== "collision") {
        updated[item.student.id] = !allSelected;
      }
    });
    setSelectedPreviewMap(updated);
  };

  // Count Selected Items
  const selectedCount = useMemo(() => {
    return Object.values(selectedPreviewMap).filter(Boolean).length;
  }, [selectedPreviewMap]);

  // Apply Bulk Generated IDs to Database
  const handleApplyBulkIds = async () => {
    const itemsToSave = previewItems
      .filter((item) => selectedPreviewMap[item.student.id] && item.status !== "collision")
      .map((item) => ({
        internalId: item.student.id,
        proposedId: item.proposedStudentId,
        allowOverwrite: allowOverwriteExisting,
      }));

    if (itemsToSave.length === 0) {
      setFeedback({ type: "error", message: "সংরক্ষণের জন্য কোন শিক্ষার্থী নির্বাচিত নেই।" });
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch("/api/students/id-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_generate",
          items: itemsToSave,
          reason: bulkReason,
          changedBy: currentUser?.fullName || currentUser?.nameBangla || "Admin / Principal",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", message: data.message });
        setShowConfirmModal(false);
        setPreviewItems([]);
        setSelectedPreviewMap({});
        fetchHubData();
      } else {
        setFeedback({ type: "error", message: data.error || "আইডি সংরক্ষণ ব্যর্থ হয়েছে।" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "সংরক্ষণে সার্ভার ত্রুটি ঘটেছে।" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Single Student Selection
  const handleSelectStudentForSingle = (stu: Student) => {
    setSelectedStudentForSingle(stu);
    // Auto-generate suggested ID based on current config
    const clsNumeric = parseClassNumeric(stu.classId);
    const clsCode = clsNumeric < 10 ? `0${clsNumeric}` : `${clsNumeric}`;
    const paddedRoll = String(stu.roll || 1).padStart(config.sequenceLength || 4, "0");
    const suggested = `${config.prefix || "PTSC"}-${stu.session || "2026"}-${clsCode}${paddedRoll}`;
    setSingleCustomId(suggested);
    setSingleReason("একক শিক্ষার্থী আইডি হালনাগাদ");
  };

  // Save Single Student ID
  const handleSaveSingleId = async (forceOverride = false) => {
    if (!selectedStudentForSingle) return;
    try {
      setIsSingleSaving(true);
      const res = await fetch("/api/students/id-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "single_generate",
          internalId: selectedStudentForSingle.id,
          newStudentId: singleCustomId,
          reason: singleReason || "একক আইডি নির্ধারণ",
          changedBy: currentUser?.fullName || currentUser?.nameBangla || "System Admin",
          forceOverride,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", message: data.message });
        setSelectedStudentForSingle(null);
        fetchHubData();
      } else if (data.needsConfirmation) {
        // Confirmation required to overwrite existing ID
        const confirmOverwrite = window.confirm(
          `${data.message}\n\nআপনি কি নিশ্চিত যে বর্তমান আইডি (${data.currentId}) পরিবর্তন করে নতুন আইডি (${data.proposedId}) বরাদ্দ করতে চান?`
        );
        if (confirmOverwrite) {
          handleSaveSingleId(true);
        }
      } else {
        setFeedback({ type: "error", message: data.error || "আইডি সংরক্ষণ ব্যর্থ হয়েছে।" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "সার্ভার সংযোগে ত্রুটি ঘটেছে।" });
    } finally {
      setIsSingleSaving(false);
    }
  };

  // Auto-resolve Duplicate / Collision
  const handleAutoResolveDuplicate = async (studentId: number) => {
    try {
      const res = await fetch("/api/students/id-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fix_duplicate",
          studentId,
          reason: "ডুপ্লিকেট আইডি বিরোধ স্বয়ংক্রিয়ভাবে সমাধান",
          changedBy: currentUser?.fullName || currentUser?.nameBangla || "Audit Engine",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", message: data.message });
        fetchHubData();
      } else {
        setFeedback({ type: "error", message: data.error || "বিরোধ নিরসনে ব্যর্থ হয়েছে।" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "সার্ভার সংযোগে ত্রুটি ঘটেছে।" });
    }
  };

  // Save Config Settings
  const handleSaveConfig = async () => {
    try {
      setIsSavingConfig(true);
      const res = await fetch("/api/students/id-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_config",
          config: editableConfig,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setPreviewPattern(data.previewPattern);
        setFeedback({ type: "success", message: data.message });
      } else {
        setFeedback({ type: "error", message: data.error || "কনফিগারেশন সংরক্ষণ ব্যর্থ।" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "সার্ভার ত্রুটি ঘটেছে।" });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Filtered Students for Single Tab Search
  const filteredStudentsForSingle = useMemo(() => {
    if (!singleSearch.trim()) return students.slice(0, 15);
    const q = singleSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.studentId?.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.nameBangla?.includes(q) ||
        s.admissionNo?.toLowerCase().includes(q) ||
        String(s.roll) === q
    );
  }, [students, singleSearch]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    if (!auditSearch.trim()) return auditLogs;
    const q = auditSearch.toLowerCase();
    return auditLogs.filter(
      (l) =>
        l.newStudentId?.toLowerCase().includes(q) ||
        l.previousStudentId?.toLowerCase().includes(q) ||
        l.studentName?.toLowerCase().includes(q) ||
        l.className?.toLowerCase().includes(q) ||
        l.reason?.toLowerCase().includes(q)
    );
  }, [auditLogs, auditSearch]);

  return (
    <div className="space-y-5 pb-16">
      {/* 1. Header Banner & Institutional KPI */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
              <CreditCard className="w-4 h-4" />
              <span>Smart Student ID Engine • BTEB Compliant</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              স্মার্ট স্টুডেন্ট আইডি হাব ও জেনারেটর (Student ID Management)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
              পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের প্রাতিষ্ঠানিক ও কারিগরি নিয়ম অনুসারে
              স্বতন্ত্র আইডি তৈরি, বাল্ক আইডি বরাদ্দ, ডুপ্লিকেট প্রতিরোধ এবং অডিট ট্রেইল ব্যবস্থাপনা।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onNavigate && (
              <button
                id="btn-open-id-card-studio"
                onClick={() => onNavigate("id_cards")}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold shadow-md shadow-fuchsia-500/15 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>আইডি কার্ড স্টুডিও (ID Card Studio)</span>
              </button>
            )}

            <button
              id="btn-refresh-hub"
              onClick={fetchHubData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              মোট শিক্ষার্থী
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {integrityReport?.totalStudents ?? students.length} জন
            </div>
          </div>

          <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                সঠিক ও সক্রিয় আইডি
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
              {integrityReport?.validIdCount ?? 0} জন
            </div>
          </div>

          <div className="bg-amber-50/80 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                আইডিবিহীন শিক্ষার্থী
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5">
              {integrityReport?.missingIds?.length ?? 0} জন
            </div>
          </div>

          <div className="bg-indigo-50/80 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300">
                স্ট্যান্ডার্ড আইডি প্যাটার্ন
              </span>
              <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-xs font-mono font-black text-indigo-700 dark:text-indigo-400 mt-1 truncate">
              {previewPattern}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Global Feedback Message */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-bold border animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto">
        <button
          id="tab-bulk-generator"
          onClick={() => setActiveTab("bulk")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "bulk"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-cyan-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>বাল্ক আইডি জেনারেটর (Bulk Generator)</span>
        </button>

        <button
          id="tab-single-generator"
          onClick={() => setActiveTab("single")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "single"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-cyan-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>একক শিক্ষার্থী আইডি (Single ID)</span>
        </button>

        <button
          id="tab-integrity"
          onClick={() => setActiveTab("integrity")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer relative ${
            activeTab === "integrity"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-cyan-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>ডুপ্লিকেট ও অখণ্ডতা যাচাই (Integrity Hub)</span>
          {(integrityReport?.duplicateIds?.length ?? 0) > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          id="tab-audit-logs"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "audit"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-cyan-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <History className="w-4 h-4" />
          <span>আইডি অডিট ট্রেইল (Audit Logs)</span>
        </button>

        {isAdmin && (
          <button
            id="tab-id-config"
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "config"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-cyan-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>আইডি ফরম্যাট সেটিংস (Config)</span>
          </button>
        )}
      </div>

      {/* 4. TAB CONTENT 1: BULK GENERATOR */}
      {activeTab === "bulk" && (
        <div className="space-y-4">
          {/* Filter & Control Bar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {/* Session / Year */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  শিক্ষাবর্ষ / সেশন
                </label>
                <select
                  value={bulkSession}
                  onChange={(e) => setBulkSession(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="2026">২০২৬ সেশন</option>
                  <option value="2025">২০২৫ সেশন</option>
                  <option value="2027">২০২৭ সেশন</option>
                </select>
              </div>

              {/* Class Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  শ্রেণি নির্বাচন
                </label>
                <select
                  value={bulkClassId}
                  onChange={(e) => handleBulkClassChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ACADEMIC_CLASSES.map((cls) => (
                    <option key={cls.id} value={String(cls.id)}>
                      {cls.nameBangla}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trade Selector - ONLY for Class 9-12; Hidden for Class 6-8 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  কারিগরি ট্রেড
                </label>
                {bulkHasTrade ? (
                  <select
                    value={bulkTradeId}
                    onChange={(e) => setBulkTradeId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">সকল ট্রেড</option>
                    {bulkApplicableTrades.map((trade) => (
                      <option key={trade.id} value={String(trade.id)}>
                        {trade.nameBangla}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-slate-400 text-xs font-bold rounded-xl px-3 py-2.5 flex items-center gap-1.5 cursor-not-allowed">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span>জেনারেল (ট্রেড প্রযোজ্য নয়)</span>
                  </div>
                )}
              </div>

              {/* Section Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  শাখা / সেকশন
                </label>
                <select
                  value={bulkSection}
                  onChange={(e) => setBulkSection(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">সকল শাখা</option>
                  <option value="A">শাখা A</option>
                  <option value="B">শাখা B</option>
                </select>
              </div>

              {/* Action Preview Button */}
              <div className="flex items-end">
                <button
                  id="btn-run-preview"
                  onClick={handleRunPreview}
                  disabled={isGenerating}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sliders className="w-4 h-4" />
                  <span>{isGenerating ? "যাচাই হচ্ছে..." : "প্রিভিউ যাচাই করুন"}</span>
                </button>
              </div>
            </div>

            {/* Advanced Safeguards & Checkboxes */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={bulkMissingOnly}
                    onChange={(e) => setBulkMissingOnly(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>শুধুমাত্র যাদের আইডি নেই তাদের অন্তর্ভুক্ত করুন (Missing Only)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-700 dark:text-amber-400">
                  <input
                    type="checkbox"
                    checked={allowOverwriteExisting}
                    onChange={(e) => setAllowOverwriteExisting(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <span>বিদ্যমান আইডি প্রতিস্থাপন করার অনুমতি দিন (Allow Overwrite)</span>
                </label>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                ফরম্যাট: <span className="font-bold text-indigo-600">{previewPattern}</span>
              </div>
            </div>
          </div>

          {/* Preview Results Table */}
          {previewItems.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              {/* Batch Action Bar */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                  >
                    সবগুলো নির্বাচন / বাতিল
                  </button>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    নির্বাচিত: <span className="text-indigo-600 font-black">{selectedCount}</span> জন
                    / মোট: {previewItems.length} জন
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-apply-bulk-ids"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={selectedCount === 0 || isGenerating}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>প্রস্তাবিত আইডি ডাটাবেসে সেভ করুন ({selectedCount})</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">✓</th>
                      <th className="py-3 px-4 w-16 text-center">রোল</th>
                      <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                      <th className="py-3 px-4">শ্রেণি ও ট্রেড</th>
                      <th className="py-3 px-4">বর্তমান আইডি</th>
                      <th className="py-3 px-4">প্রস্তাবিত নতুন আইডি</th>
                      <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                    {previewItems.map((item) => {
                      const isSelected = Boolean(selectedPreviewMap[item.student.id]);
                      const isCollision = item.status === "collision";

                      return (
                        <tr
                          key={item.student.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/60/80 dark:hover:bg-slate-800/40 transition-colors ${
                            isCollision ? "bg-rose-50/40 dark:bg-rose-950/20" : ""
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isCollision}
                              onChange={() => toggleSelectStudent(item.student.id)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer disabled:opacity-30 border-slate-300 dark:border-slate-600"
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            {String(item.student.roll).padStart(2, "0")}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white text-xs">
                              {item.student.nameBangla || item.student.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              {item.student.name} • {item.student.admissionNo}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                              {item.student.className}
                            </span>
                            {item.student.tradeName && (
                              <div className="text-[11px] text-indigo-600 dark:text-cyan-400 font-medium truncate max-w-xs mt-0.5">
                                {item.student.tradeNameBangla || item.student.tradeName}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-600 dark:text-slate-400 tabular-nums text-xs">
                            {item.currentStudentId}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-cyan-400 tabular-nums text-xs">
                            {item.proposedStudentId}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.status === "new" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                                নতুন আইডি
                              </span>
                            )}
                            {item.status === "unchanged" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                                অপরিবর্তিত
                              </span>
                            )}
                            {item.status === "overwrite" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                                পরিবর্তন হবে
                              </span>
                            )}
                            {item.status === "collision" && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800">
                                  সংঘর্ষ / ডুপ্লিকেট
                                </span>
                                {item.collisionReason && (
                                  <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                                    {item.collisionReason}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                শ্রেণি ও ফিল্টার নির্বাচন করে প্রিভিউ যাচাই করুন
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                উপরে শ্রেণি, ট্রেড ও শাখা নির্বাচন করে &quot;প্রিভিউ যাচাই করুন&quot; বোতামে ক্লিক করুন।
                যাদের ইতিমধ্যেই বৈধ আইডি রয়েছে তারা স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে।
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB CONTENT 2: SINGLE STUDENT GENERATOR */}
      {activeTab === "single" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Student Search & Selection List */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                শিক্ষার্থী খুঁজুন ও নির্বাচন করুন
              </h2>
              <div className="relative mt-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={singleSearch}
                  onChange={(e) => setSingleSearch(e.target.value)}
                  placeholder="নাম, রোল, স্টুডেন্ট আইডি বা ভর্তি নং দিয়ে খুঁজুন..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-9 pr-3 py-2 text-xs font-medium rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredStudentsForSingle.map((stu) => {
                const isSelected = selectedStudentForSingle?.id === stu.id;
                return (
                  <div
                    key={stu.id}
                    onClick={() => handleSelectStudentForSingle(stu)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700"
                        : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{stu.nameBangla || stu.name}</span>
                        <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono">
                          রোল {stu.roll}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {stu.className} • শাখা {stu.section}
                      </div>
                      <div className="text-[11px] font-mono text-indigo-600 dark:text-cyan-400 mt-0.5">
                        আইডি: {stu.studentId || "— (নির্ধারিত নেই)"}
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Single Student Inspector & Generator Card */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            {selectedStudentForSingle ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">
                      নির্বাচিত শিক্ষার্থী
                    </span>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {selectedStudentForSingle.nameBangla || selectedStudentForSingle.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {selectedStudentForSingle.name} • ভর্তি নং: {selectedStudentForSingle.admissionNo}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 rounded-lg text-xs font-bold">
                      {selectedStudentForSingle.className}
                    </span>
                  </div>
                </div>

                {/* Status Alert if student already has valid ID */}
                {selectedStudentForSingle.studentId &&
                  selectedStudentForSingle.studentId !== "—" && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">সতর্কবার্তা:</span> এই শিক্ষার্থীর পূর্বেই একটি
                        আইডি রয়েছে (<span className="font-mono font-bold">{selectedStudentForSingle.studentId}</span>)।
                        অপ্রয়োজনে আইডি পরিবর্তন করলে পূর্বের রেজাল্ট ও হাজিরা নথির রেফারেন্স বিভ্রান্ত হতে পারে।
                      </div>
                    </div>
                  )}

                {/* ID Assignment Controls */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      প্রস্তাবিত / কাস্টম স্টুডেন্ট আইডি
                    </label>
                    <input
                      type="text"
                      value={singleCustomId}
                      onChange={(e) => setSingleCustomId(e.target.value)}
                      placeholder="e.g. PTSC-2026-090001"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      আইডি পরিবর্তন বা বরাদ্দের কারণ (Audit Justification)
                    </label>
                    <input
                      type="text"
                      value={singleReason}
                      onChange={(e) => setSingleReason(e.target.value)}
                      placeholder="e.g. ভর্তি নিবন্ধন হালনাগাদ / রোল পরিবর্তন..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Save and ID Card Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    অডিট লগ স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে
                  </div>

                  <div className="flex items-center gap-2">
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate("id_cards")}
                        className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        আইডি কার্ড দেখুন
                      </button>
                    )}

                    <button
                      id="btn-save-single-id"
                      onClick={() => handleSaveSingleId(false)}
                      disabled={isSingleSaving || !singleCustomId.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSingleSaving ? "সংরক্ষণ হচ্ছে..." : "আইডি নিশ্চিত ও সংরক্ষণ"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  বাম পাশের তালিকা থেকে শিক্ষার্থী নির্বাচন করুন
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  একক শিক্ষার্থীর আইডি বরাদ্দ, পরিবর্তন বা বিদ্যমান আইডি যাচাই করতে শিক্ষার্থীকে বেছে নিন।
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT 3: INTEGRITY & DUPLICATE HUB */}
      {activeTab === "integrity" && (
        <div className="space-y-5">
          {/* Integrity Report Header */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>প্রতিষ্ঠানব্যাপী আইডি অখণ্ডতা ও সংঘর্ষ নিরসন (Collision Resolver)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              সম্পূর্ণ ডাটাবেসে ডুপ্লিকেট স্টুডেন্ট আইডি, ডুপ্লিকেট ক্লাস রোল বা আইডিবিহীন শিক্ষার্থী চিহ্নিতকরণ রিপোর্ট।
            </p>
          </div>

          {/* Section 1: Duplicate Student IDs */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>ডুপ্লিকেট স্টুডেন্ট আইডি সংঘর্ষ ({integrityReport?.duplicateIds?.length ?? 0} টি)</span>
              </h3>
            </div>

            {integrityReport?.duplicateIds && integrityReport.duplicateIds.length > 0 ? (
              <div className="space-y-3">
                {integrityReport.duplicateIds.map((dup, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-rose-700 dark:text-rose-400 text-sm">
                          {dup.studentId}
                        </span>
                        <span className="px-2 py-0.5 bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 text-[10px] font-bold rounded-full">
                          {dup.count} জন শিক্ষার্থীর একই আইডি
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {dup.students.map((st) => (
                          <span
                            key={st.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 border border-rose-200 dark:border-rose-800"
                          >
                            <span>{st.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({st.className}, রোল {st.roll})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAutoResolveDuplicate(dup.students[dup.students.length - 1].id)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer"
                    >
                      স্বতন্ত্র নতুন আইডি প্রদান করুন
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  অভিনন্দন! কোনো ডুপ্লিকেট স্টুডেন্ট আইডি নেই
                </h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  প্রতিষ্ঠানের সমস্ত সক্রিয় শিক্ষার্থীর স্টুডেন্ট আইডি সম্পূর্ণ ইউনিক ও সুসংরক্ষিত।
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Missing Student IDs */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600" />
              <span>আইডি বরাদ্দ করা হয়নি এমন শিক্ষার্থী ({integrityReport?.missingIds?.length ?? 0} জন)</span>
            </h3>

            {integrityReport?.missingIds && integrityReport.missingIds.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {integrityReport.missingIds.map((st) => (
                  <div
                    key={st.id}
                    className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {st.nameBangla || st.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {st.className} • রোল {st.roll}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedStudentForSingle(st);
                        setActiveTab("single");
                      }}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      আইডি দিন
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                সকল শিক্ষার্থীর জন্য স্টুডেন্ট আইডি নির্ধারিত রয়েছে।
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT 4: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span>স্টুডেন্ট আইডি অডিট ট্রেইল (Audit Logs)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                আইডি তৈরি, বাল্ক এসাইনমেন্ট এবং ম্যানুয়াল সংশোধনের সম্পূর্ণ ডিজিটাল ইতিহাস।
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="অডিট লগ খুঁজুন..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-9 pr-3 py-1.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-44">তারিখ ও সময়</th>
                  <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                  <th className="py-3 px-4 w-36">শ্রেণি ও রোল</th>
                  <th className="py-3 px-4 w-40">পূর্বের আইডি</th>
                  <th className="py-3 px-4 w-40">নতুন আইডি</th>
                  <th className="py-3 px-4 w-40">পরিবর্তনকারী</th>
                  <th className="py-3 px-4">কারণ / জাস্টিফিকেশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredAuditLogs.length > 0 ? (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {new Date(log.timestamp).toLocaleString("bn-BD")}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {log.studentName}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {log.className} <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-bold">(রোল {log.roll})</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 dark:text-slate-500 line-through tabular-nums text-xs">
                        {log.previousStudentId}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-cyan-400 tabular-nums text-xs">
                        {log.newStudentId}
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                        {log.changedBy}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 italic max-w-xs truncate">
                        {log.reason}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center text-slate-400 text-xs">
                      কোনো অডিট লগ রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. TAB CONTENT 5: CONFIGURATION SETTINGS */}
      {activeTab === "config" && isAdmin && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <span>স্টুডেন্ট আইডি ফরম্যাট কনফিগারেশন ইঞ্জিন</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                প্রতিষ্ঠানের নির্দিষ্ট কোড, শিক্ষাবর্ষ ও শ্রেণি বিন্যাস অনুযায়ী আইডি কাঠামো পরিবর্তন করুন।
              </p>
            </div>

            {/* Live Preview Box */}
            <div className="bg-indigo-50 dark:bg-indigo-950/60 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 text-right">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider">
                লাইভ আইডি প্যাটার্ন
              </span>
              <span className="text-base font-mono font-black text-indigo-900 dark:text-cyan-300">
                {previewPattern}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Prefix */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ইনস্টিটিউশন প্রিফিক্স (Prefix)
              </label>
              <input
                type="text"
                value={editableConfig.prefix}
                onChange={(e) => setEditableConfig({ ...editableConfig, prefix: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs font-bold rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">যেমন: PTSC বা TSCP</span>
            </div>

            {/* Year Format */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                শিক্ষাবর্ষ ফরম্যাট (Year Format)
              </label>
              <select
                value={editableConfig.yearFormat}
                onChange={(e) =>
                  setEditableConfig({
                    ...editableConfig,
                    yearFormat: e.target.value as "YYYY" | "YY",
                  })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs font-bold rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="YYYY">পূর্ণ সাল (e.g. 2026)</option>
                <option value="YY">সংক্ষিপ্ত সাল (e.g. 26)</option>
              </select>
            </div>

            {/* Separator */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                বিভাজক চিহ্ন (Separator)
              </label>
              <select
                value={editableConfig.separator}
                onChange={(e) =>
                  setEditableConfig({
                    ...editableConfig,
                    separator: e.target.value as any,
                  })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs font-bold rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="-">হাইফেন (-)</option>
                <option value="/">স্ল্যাশ (/)</option>
                <option value="_">আন্ডারস্কোর (_)</option>
                <option value="">কোনো বিভাজক নেই</option>
              </select>
            </div>

            {/* Sequence Length */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ক্রমিক ডিজিটের দৈর্ঘ্য (Sequence Padding)
              </label>
              <select
                value={editableConfig.sequenceLength}
                onChange={(e) =>
                  setEditableConfig({
                    ...editableConfig,
                    sequenceLength: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs font-bold rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={3}>৩ ডিজিট (e.g. 001)</option>
                <option value={4}>৪ ডিজিট (e.g. 0001 - স্ট্যান্ডার্ড)</option>
                <option value={5}>৫ ডিজিট (e.g. 00001)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              id="btn-save-config"
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSavingConfig ? "সংরক্ষণ হচ্ছে..." : "কনফিগারেশন সেভ করুন"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 9. BULK CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  বাল্ক আইডি চূড়ান্ত নিশ্চিতকরণ
                </h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>
                আপনি নির্বাচিত <span className="font-black text-indigo-600">{selectedCount}</span> জন
                শিক্ষার্থীর জন্য নতুন স্টুডেন্ট আইডি ডাটাবেসে সেভ করতে যাচ্ছেন।
              </p>

              {allowOverwriteExisting && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-bold">
                  সতর্কতা: বিদ্যমান আইডি প্রতিস্থাপনের অনুমোদন সক্রিয় রয়েছে।
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  অডিট ট্রেইল কারণ (Reason for Audit Log)
                </label>
                <input
                  type="text"
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                বাতিল
              </button>

              <button
                id="btn-confirm-save-bulk"
                onClick={handleApplyBulkIds}
                disabled={isGenerating}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {isGenerating ? "সংরক্ষণ হচ্ছে..." : "হ্যাঁ, নিশ্চিত সংরক্ষণ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
