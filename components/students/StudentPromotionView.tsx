"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Calendar,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Info,
  Check,
  Award,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface StudentPromotionRecord {
  id: number;
  studentId: string;
  name: string;
  nameBangla?: string;
  roll?: string;
  classId: number;
  className: string;
  tradeId?: number;
  tradeName?: string;
  section?: string;
  status: string;
  finalGpa?: number;
  examCount?: number;
  passed: boolean;
  eligibility: "ELIGIBLE" | "INELIGIBLE" | "PENDING_RESULTS";
  eligibilityReason: string;
}

interface CapacityInfo {
  configured: number;
  current: number;
  projected: number;
  exceeded: boolean;
}

interface PromotionResultDetail {
  studentId: string;
  name: string;
  reason?: string;
  error?: string;
  newRoll?: string;
}

interface PromotionResultSummary {
  total: number;
  promoted: number;
  skipped: number;
  failed: number;
  details: {
    promoted: PromotionResultDetail[];
    skipped: PromotionResultDetail[];
    failed: PromotionResultDetail[];
  };
}

export default function StudentPromotionView() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role !== "teacher";

  // Master options from backend
  const [years, setYears] = useState<{ id: string; name: string; isCurrent: boolean; status: string }[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string; nameBangla: string; hasTrade: boolean }[]>([]);
  const [trades, setTrades] = useState<{ id: number; name: string; nameBangla: string }[]>([]);

  // Selection states - Source
  const [sourceYear, setSourceYear] = useState<string>("");
  const [sourceClassId, setSourceClassId] = useState<string>("");
  const [sourceSection, setSourceSection] = useState<string>("all");
  const [sourceTradeId, setSourceTradeId] = useState<string>("all");

  // Selection states - Destination
  const [destinationYear, setDestinationYear] = useState<string>("");
  const [destinationClassId, setDestinationClassId] = useState<string>("");
  const [destinationSection, setDestinationSection] = useState<string>("A");
  const [destinationTradeId, setDestinationTradeId] = useState<string>("all");

  // Loading & Data states
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [students, setStudents] = useState<StudentPromotionRecord[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [eligibilityFilter, setEligibilityFilter] = useState<"ALL" | "ELIGIBLE" | "INELIGIBLE" | "PENDING">("ALL");

  // Preview & Override Modal
  const [previewing, setPreviewing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [previewCapacity, setPreviewCapacity] = useState<CapacityInfo | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  // Result summary
  const [promotionSummary, setPromotionSummary] = useState<PromotionResultSummary | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // 1. Fetch initial Master metadata (Years, Classes, Trades)
  useEffect(() => {
    async function loadMasterData() {
      setLoadingMetadata(true);
      try {
        const [yearsRes, classesRes, tradesRes] = await Promise.all([
          fetch("/api/academic/years").then((r) => r.json()),
          fetch("/api/academic/classes").then((r) => r.json()),
          fetch("/api/academic/trades").then((r) => r.json()),
        ]);

        if (yearsRes.success && yearsRes.data) {
          const loadedYears = yearsRes.data;
          setYears(loadedYears);
          const activeYear = loadedYears.find((y: any) => y.isCurrent || y.status === "ACTIVE") || loadedYears[0];
          if (activeYear) {
            setSourceYear(activeYear.id || activeYear.name);
            // Suggest next year for destination
            const nextYear = loadedYears.find((y: any) => y.name !== activeYear.name);
            if (nextYear) {
              setDestinationYear(nextYear.id || nextYear.name);
            }
          }
        }

        if (classesRes.success && classesRes.data) {
          setClasses(classesRes.data);
          if (classesRes.data.length > 0) {
            setSourceClassId(String(classesRes.data[0].id));
            if (classesRes.data.length > 1) {
              setDestinationClassId(String(classesRes.data[1].id));
            } else {
              setDestinationClassId(String(classesRes.data[0].id));
            }
          }
        }

        if (tradesRes.success && tradesRes.data) {
          setTrades(tradesRes.data);
        }
      } catch (err: any) {
        console.error("Failed to load master metadata:", err);
        setNotification({
          type: "error",
          message: "একাডেমিক মাস্টার ডাটা লোড করতে ব্যর্থ হয়েছে।",
        });
      } finally {
        setLoadingMetadata(false);
      }
    }
    loadMasterData();
  }, []);

  // Selected class helpers
  const selectedSourceClass = useMemo(
    () => classes.find((c) => String(c.id) === sourceClassId),
    [classes, sourceClassId]
  );

  const selectedDestinationClass = useMemo(
    () => classes.find((c) => String(c.id) === destinationClassId),
    [classes, destinationClassId]
  );

  // 2. Fetch Source Students whenever source parameters change
  const fetchSourceStudents = async () => {
    if (!sourceYear || !sourceClassId) return;
    setLoadingStudents(true);
    setNotification(null);
    setSelectedStudentIds([]);
    setPromotionSummary(null);

    try {
      const query = new URLSearchParams({
        sourceYear,
        sourceClassId,
        sourceSection,
        sourceTradeId,
      });

      const res = await fetch(`/api/students/promotion?${query.toString()}`);
      const data = await res.json();

      if (data.success) {
        const studentList: StudentPromotionRecord[] = data.students || [];
        setStudents(studentList);
        // Pre-select all eligible students by default
        const eligibleIds = studentList
          .filter((s) => s.eligibility === "ELIGIBLE")
          .map((s) => s.id);
        setSelectedStudentIds(eligibleIds);

        if (studentList.length === 0) {
          setNotification({
            type: "info",
            message: "নির্বাচিত শিক্ষাবর্ষ ও শ্রেণিতে কোনো শিক্ষার্থী পাওয়া যায়নি।",
          });
        }
      } else {
        setNotification({
          type: "error",
          message: data.error || "শিক্ষার্থীদের তথ্য লোড করা যায়নি।",
        });
      }
    } catch (err: any) {
      console.error("Error loading students for promotion:", err);
      setNotification({
        type: "error",
        message: "সার্ভার এরর: শিক্ষার্থীদের তালিকা লোড করা যায়নি।",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (sourceYear && sourceClassId) {
      fetchSourceStudents();
    }
  }, [sourceYear, sourceClassId, sourceSection, sourceTradeId]);

  // Filter students based on UI search & eligibility badge
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchQuery =
        !searchFilter ||
        s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (s.roll && s.roll.includes(searchFilter));

      const matchEligibility =
        eligibilityFilter === "ALL" ||
        (eligibilityFilter === "ELIGIBLE" && s.eligibility === "ELIGIBLE") ||
        (eligibilityFilter === "INELIGIBLE" && s.eligibility === "INELIGIBLE") ||
        (eligibilityFilter === "PENDING" && s.eligibility === "PENDING_RESULTS");

      return matchQuery && matchEligibility;
    });
  }, [students, searchFilter, eligibilityFilter]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleSelectEligibleOnly = () => {
    const eligibleIds = filteredStudents
      .filter((s) => s.eligibility === "ELIGIBLE")
      .map((s) => s.id);
    setSelectedStudentIds(eligibleIds);
  };

  const toggleSelectStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Check if any selected student is ineligible or pending
  const hasIneligibleSelected = useMemo(() => {
    return students.some(
      (s) => selectedStudentIds.includes(s.id) && s.eligibility !== "ELIGIBLE"
    );
  }, [students, selectedStudentIds]);

  // 3. Preview Batch Promotion
  const handlePreviewPromotion = async () => {
    if (selectedStudentIds.length === 0) {
      setNotification({
        type: "error",
        message: "অনুগ্রহ করে প্রমোশনের জন্য কমপক্ষে একজন শিক্ষার্থী নির্বাচন করুন।",
      });
      return;
    }

    if (!destinationYear || !destinationClassId) {
      setNotification({
        type: "error",
        message: "অনুগ্রহ করে গন্তব্য শিক্ষাবর্ষ ও শ্রেণি নির্বাচন করুন।",
      });
      return;
    }

    if (sourceYear === destinationYear && sourceClassId === destinationClassId) {
      setNotification({
        type: "error",
        message: "উৎস এবং গন্তব্য শিক্ষাবর্ষ ও শ্রেণি একই হতে পারে না।",
      });
      return;
    }

    setPreviewing(true);
    setNotification(null);

    try {
      const res = await fetch("/api/students/promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preview",
          sourceYear,
          sourceClassId: Number(sourceClassId),
          destinationYear,
          destinationClassId: Number(destinationClassId),
          destinationSection,
          destinationTradeId: destinationTradeId !== "all" ? Number(destinationTradeId) : undefined,
          selectedStudentIds,
          manualOverride,
          overrideReason: manualOverride ? overrideReason : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPreviewCapacity(data.capacity || null);
        setShowOverrideModal(true);
      } else {
        setNotification({
          type: "error",
          message: data.error || "প্রমোশন প্রিভিউ সম্পন্ন করা যায়নি।",
        });
      }
    } catch (err: any) {
      console.error("Preview failed:", err);
      setNotification({
        type: "error",
        message: "প্রমোশন প্রিভিউ করার সময় সার্ভারে সমস্যা হয়েছে।",
      });
    } finally {
      setPreviewing(false);
    }
  };

  // 4. Execute Batch Promotion
  const handleExecutePromotion = async () => {
    if (hasIneligibleSelected && !manualOverride) {
      setNotification({
        type: "error",
        message: "অনুত্তীর্ণ শিক্ষার্থীদের প্রমোশন দিতে হলে অ্যাডমিনিস্ট্রেটিভ ওভাররাইড কারণ উল্লেখ করতে হবে।",
      });
      return;
    }

    if (manualOverride && !overrideReason.trim()) {
      setNotification({
        type: "error",
        message: "অনুগ্রহ করে ম্যানুয়াল ওভাররাইড করার সুনির্দিষ্ট কারণ লিখুন।",
      });
      return;
    }

    setExecuting(true);
    setNotification(null);

    try {
      const res = await fetch("/api/students/promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          sourceYear,
          sourceClassId: Number(sourceClassId),
          destinationYear,
          destinationClassId: Number(destinationClassId),
          destinationSection,
          destinationTradeId: destinationTradeId !== "all" ? Number(destinationTradeId) : undefined,
          selectedStudentIds,
          manualOverride,
          overrideReason: manualOverride ? overrideReason : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPromotionSummary({
          total: data.summary.total,
          promoted: data.summary.promoted,
          skipped: data.summary.skipped,
          failed: data.summary.failed,
          details: data.details,
        });
        setShowOverrideModal(false);
        setNotification({
          type: "success",
          message: `সফলভাবে ${data.summary.promoted} জন শিক্ষার্থীকে প্রমোশন দেওয়া হয়েছে!`,
        });
        // Refresh source list
        fetchSourceStudents();
      } else {
        setNotification({
          type: "error",
          message: data.error || "প্রমোশন সম্পন্ন করা যায়নি।",
        });
      }
    } catch (err: any) {
      console.error("Execution failed:", err);
      setNotification({
        type: "error",
        message: "প্রমোশন এক্সিকিউট করার সময় সিস্টেম ত্রুটি দেখা দিয়েছে।",
      });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-indigo-600/30 shrink-0">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Student Promotion Engine
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  PTSC Academic Lifecycle
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mt-1">
                শিক্ষার্থী বার্ষিক প্রমোশন ও শ্রেণি মাইগ্রেশন
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                ফলাফলের ভিত্তিতে নির্ভুল ব্যাচ প্রমোশন, সিট ক্যাপাসিটি চেক এবং পূর্ববর্তী হিস্টোরি সংরক্ষণ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSourceStudents}
              disabled={loadingStudents}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStudents ? "animate-spin" : ""}`} />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Global Feedback / Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-bold border transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
              : notification.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800"
              : "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-200 border-cyan-300 dark:border-cyan-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            {notification.type === "error" && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
            {notification.type === "info" && <Info className="w-5 h-5 text-cyan-500 shrink-0" />}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-normal underline"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* 3. Source & Destination Mapping Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Configuration Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                ১
              </span>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">
                উৎস শিক্ষাবর্ষ ও শ্রেণি (Source Context)
              </h2>
            </div>
            <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
              বর্তমান রেকর্ড
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Source Year */}
            <div>
              <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                শিক্ষাবর্ষ (Source Year) *
              </label>
              <select
                value={sourceYear}
                onChange={(e) => setSourceYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {years.map((y) => (
                  <option key={y.id || y.name} value={y.id || y.name}>
                    {y.name} {y.isCurrent ? "(বর্তমান)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Class */}
            <div>
              <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                শ্রেণি (Source Class) *
              </label>
              <select
                value={sourceClassId}
                onChange={(e) => setSourceClassId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {classes.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nameBangla || c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Section */}
            <div>
              <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                শাখা / গ্রুপ (Section)
              </label>
              <select
                value={sourceSection}
                onChange={(e) => setSourceSection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">সকল শাখা (All Sections)</option>
                <option value="A">শাখা A</option>
                <option value="B">শাখা B</option>
                <option value="C">শাখা C</option>
              </select>
            </div>

            {/* Source Trade (if class has trade) */}
            <div>
              <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                কারিগরি ট্রেড (Trade)
              </label>
              <select
                value={sourceTradeId}
                onChange={(e) => setSourceTradeId(e.target.value)}
                disabled={!selectedSourceClass?.hasTrade}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
              >
                <option value="all">
                  {selectedSourceClass?.hasTrade ? "সকল ট্রেড (All Trades)" : "ট্রেড প্রযোজ্য নয় (General)"}
                </option>
                {selectedSourceClass?.hasTrade &&
                  trades.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.nameBangla || t.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Destination Configuration Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                ২
              </span>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">
                গন্তব্য শিক্ষাবর্ষ ও শ্রেণি (Destination Target)
              </h2>
            </div>
            <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              প্রমোশন গন্তব্য
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Destination Year */}
            <div>
              <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                গন্তব্য শিক্ষাবর্ষ (Target Year) *
              </label>
              <select
                value={destinationYear}
                onChange={(e) => setDestinationYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {years.map((y) => (
                  <option key={y.id || y.name} value={y.id || y.name}>
                    {y.name} {y.isCurrent ? "(বর্তমান)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Class */}
            <div>
              <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                গন্তব্য শ্রেণি (Target Class) *
              </label>
              <select
                value={destinationClassId}
                onChange={(e) => setDestinationClassId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {classes.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nameBangla || c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Section */}
            <div>
              <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                গন্তব্য শাখা (Target Section)
              </label>
              <select
                value={destinationSection}
                onChange={(e) => setDestinationSection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="A">শাখা A</option>
                <option value="B">শাখা B</option>
                <option value="C">শাখা C</option>
              </select>
            </div>

            {/* Destination Trade */}
            <div>
              <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                গন্তব্য ট্রেড (Target Trade)
              </label>
              <select
                value={destinationTradeId}
                onChange={(e) => setDestinationTradeId(e.target.value)}
                disabled={!selectedDestinationClass?.hasTrade}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40"
              >
                <option value="all">
                  {selectedDestinationClass?.hasTrade ? "একই ট্রেড বজায় রাখুন (Keep Current)" : "ট্রেড প্রযোজ্য নয় (General)"}
                </option>
                {selectedDestinationClass?.hasTrade &&
                  trades.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.nameBangla || t.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Student Selection Table & Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Action Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 font-black text-xs flex items-center justify-center border border-cyan-200 dark:border-cyan-800">
              ৩
            </span>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              শিক্ষার্থী নির্বাচন ({students.length} জনের মধ্যে {selectedStudentIds.length} জন নির্বাচিত)
            </h3>
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={handleSelectEligibleOnly}
                className="px-2.5 py-1 text-2xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
              >
                শুধুমাত্র উত্তীর্ণ নির্বাচন করুন
              </button>
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1 text-2xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200"
              >
                {selectedStudentIds.length === filteredStudents.length ? "সব আনচেক" : "সকল নির্বাচন"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="নাম বা রোল দিয়ে খুঁজুন..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
              />
            </div>

            {/* Eligibility Filter Tab */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-2xs font-bold">
              <button
                onClick={() => setEligibilityFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  eligibilityFilter === "ALL"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                সকল
              </button>
              <button
                onClick={() => setEligibilityFilter("ELIGIBLE")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  eligibilityFilter === "ELIGIBLE"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                উত্তীর্ণ ({students.filter((s) => s.eligibility === "ELIGIBLE").length})
              </button>
              <button
                onClick={() => setEligibilityFilter("INELIGIBLE")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  eligibilityFilter === "INELIGIBLE"
                    ? "bg-rose-500 text-white shadow-xs"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                অনুত্তীর্ণ ({students.filter((s) => s.eligibility === "INELIGIBLE").length})
              </button>
              <button
                onClick={() => setEligibilityFilter("PENDING")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  eligibilityFilter === "PENDING"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                পেন্ডিং ({students.filter((s) => s.eligibility === "PENDING_RESULTS").length})
              </button>
            </div>

            {/* Execute Trigger Button */}
            <button
              onClick={handlePreviewPromotion}
              disabled={selectedStudentIds.length === 0 || previewing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>প্রমোশন প্রিভিউ ও নিশ্চিতকরণ ({selectedStudentIds.length})</span>
            </button>
          </div>
        </div>

        {/* Student List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-2xs uppercase tracking-wider font-extrabold border-b border-slate-200/80 dark:border-slate-800">
                <th className="py-3 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredStudents.length > 0 &&
                      selectedStudentIds.length === filteredStudents.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="py-3 px-4">শিক্ষার্থী ও আইডি</th>
                <th className="py-3 px-4">বর্তমান শ্রেণি ও শাখা</th>
                <th className="py-3 px-4">ট্রেড (যদি থাকে)</th>
                <th className="py-3 px-4 text-center">পরীক্ষার ফলাফল / GPA</th>
                <th className="py-3 px-4 text-center">যোগ্যতা স্ট্যাটাস</th>
                <th className="py-3 px-4">মন্তব্য / বিবরণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {loadingStudents ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>শিক্ষার্থীদের তথ্য ও ফলাফল লোড হচ্ছে...</span>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="max-w-xs mx-auto text-slate-400 space-y-2">
                      <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-600 dark:text-slate-300">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
                      <p className="text-2xs">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন অথবা নতুন শিক্ষার্থী ভর্তি করুন।</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const isSelected = selectedStudentIds.includes(st.id);
                  return (
                    <tr
                      key={st.id}
                      onClick={() => toggleSelectStudent(st.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-indigo-50/50 dark:bg-indigo-950/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                      }`}
                    >
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectStudent(st.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Student Identity */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {st.nameBangla || st.name}
                        </div>
                        <div className="text-2xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>{st.studentId}</span>
                          {st.roll && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-sans text-slate-500">রোল: {st.roll}</span>}
                        </div>
                      </td>

                      {/* Class & Section */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        <div>{st.className}</div>
                        <div className="text-2xs text-slate-400">শাখা: {st.section || "A"}</div>
                      </td>

                      {/* Trade */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {st.tradeName || "সাধারণ (General)"}
                      </td>

                      {/* Result / GPA */}
                      <td className="py-3 px-4 text-center">
                        {st.finalGpa !== undefined && st.finalGpa > 0 ? (
                          <span className="font-black text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            GPA {st.finalGpa.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-2xs text-slate-400 italic">ফলাফল প্রকাশিত হয়নি</span>
                        )}
                      </td>

                      {/* Eligibility Badge */}
                      <td className="py-3 px-4 text-center">
                        {st.eligibility === "ELIGIBLE" ? (
                          <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>উত্তীর্ণ (Eligible)</span>
                          </span>
                        ) : st.eligibility === "INELIGIBLE" ? (
                          <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            <XCircle className="w-3 h-3" />
                            <span>অনুত্তীর্ণ (Ineligible)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>পেন্ডিং (Pending)</span>
                          </span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-4 text-2xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {st.eligibilityReason}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Execution Summary Report Card (After Execution) */}
      {promotionSummary && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-900/60 p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                প্রমোশন এক্সিকিউশন রিপোর্ট (Batch Promotion Summary)
              </h3>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              সফলভাবে সম্পন্ন
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-2xs font-bold text-slate-400 uppercase">মোট প্রক্রিয়াকৃত</span>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{promotionSummary.total}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-2xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">সফল প্রমোশন</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{promotionSummary.promoted}</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
              <span className="text-2xs font-bold text-amber-600 dark:text-amber-400 uppercase">স্কিপড (ইতিমধ্যে ভর্তি)</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{promotionSummary.skipped}</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
              <span className="text-2xs font-bold text-rose-600 dark:text-rose-400 uppercase">ব্যর্থ রেকর্ড</span>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{promotionSummary.failed}</p>
            </div>
          </div>

          {/* Details list if any skipped or failed */}
          {promotionSummary.details.skipped.length > 0 && (
            <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 text-2xs space-y-1">
              <span className="font-bold text-amber-800 dark:text-amber-300">স্কিপ করা শিক্ষার্থী:</span>
              <ul className="list-disc list-inside text-amber-700 dark:text-amber-400 space-y-0.5">
                {promotionSummary.details.skipped.map((sk, idx) => (
                  <li key={idx}>
                    {sk.name} ({sk.studentId}): {sk.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 6. Preview & Administrative Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  প্রমোশন প্রিভিউ ও নিশ্চিতকরণ
                </h3>
              </div>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                বাতিল
              </button>
            </div>

            {/* Target context banner */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-bold">নির্বাচিত শিক্ষার্থী সংখ্যা:</span>
                <span className="font-black text-indigo-700 dark:text-indigo-300 text-sm">
                  {selectedStudentIds.length} জন
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-bold">গন্তব্য শ্রেণি ও শিক্ষাবর্ষ:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedDestinationClass?.nameBangla || selectedDestinationClass?.name} ({destinationYear})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-bold">গন্তব্য শাখা:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">শাখা {destinationSection}</span>
              </div>
            </div>

            {/* Capacity Warning Card if applicable */}
            {previewCapacity && previewCapacity.configured > 0 && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                  previewCapacity.exceeded
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
                }`}
              >
                <div>
                  <div className="font-bold">সিট ক্যাপাসিটি অ্যানালাইসিস</div>
                  <div className="text-2xs opacity-80 mt-0.5">
                    মোট আসন: {previewCapacity.configured} | বর্তমান: {previewCapacity.current} | নতুন সহ মোট:{" "}
                    {previewCapacity.projected}
                  </div>
                </div>
                {previewCapacity.exceeded && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-2xs">
                    আসন অতিক্রম করেছে
                  </span>
                )}
              </div>
            )}

            {/* Ineligible Warning & Override Requirement */}
            {hasIneligibleSelected && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>সতর্কতা: নির্বাচিত শিক্ষার্থীদের মধ্যে অনুত্তীর্ণ শিক্ষার্থী রয়েছে!</span>
                </div>
                <p className="text-2xs text-amber-700 dark:text-amber-300">
                  ইনস্টিটিউশনাল রুল অনুযায়ী অনুত্তীর্ণ বা পেন্ডিং ফলাফলপ্রাপ্ত শিক্ষার্থীদের প্রমোশন দিতে একাডেমিক কাউন্সিলের অনুমোদন সাপেক্ষে ম্যানুয়াল ওভাররাইড কারণ রেকর্ড করা বাধ্যতামূলক।
                </p>

                <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualOverride}
                      onChange={(e) => setManualOverride(e.target.checked)}
                      className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                    />
                    <span>অ্যাডমিনিস্ট্রেটিভ ম্যানুয়াল ওভাররাইড প্রয়োগ করুন</span>
                  </label>

                  {manualOverride && (
                    <div>
                      <textarea
                        rows={2}
                        placeholder="ওভাররাইড করার কারণ বা রেজুলেশন নম্বর লিখুন (যেমন: একাডেমিক কাউন্সিল বিশেষ বিবেচনা)..."
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Safety Declaration */}
            <p className="text-2xs text-slate-400 leading-relaxed">
              * প্রমোশন এক্সিকিউট করলে শিক্ষার্থীদের বর্তমান স্থায়ী প্রোফাইল অক্ষত থাকবে, আগের শিক্ষাবর্ষের উপস্থিতি ও মার্কস সংরক্ষিত থাকবে এবং নতুন শিক্ষাবর্ষের জন্য নতুন এনরোলমেন্ট তৈরি হবে।
            </p>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleExecutePromotion}
                disabled={executing || (hasIneligibleSelected && (!manualOverride || !overrideReason.trim()))}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
              >
                {executing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>প্রসেসিং...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>নিশ্চিত করুন ও প্রমোশন দিন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
