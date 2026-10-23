"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  GraduationCap,
  Calendar,
  Layers,
  Cpu,
  Wrench,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Search,
  RefreshCw,
  Building,
  ShieldCheck,
  Check,
  ArrowRight,
  TrendingUp,
  Sliders,
  Users,
} from "lucide-react";
import Link from "next/link";

type SetupSubTab = "years" | "classes" | "trades" | "labs" | "capacity_schedule";

export interface AcademicYearItem {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: "Draft" | "Active" | "Closed" | "Archived" | "Inactive";
  isCurrent: boolean;
  remarks?: string;
}

export interface AcademicClassItem {
  id: number;
  numericValue: number;
  name: string;
  nameBangla: string;
  code?: string;
  displayOrder?: number;
  hasTrade: boolean;
  defaultSections?: string[];
  defaultShifts?: string[];
  totalSeats?: number;
  status?: "Active" | "Inactive";
  description?: string;
}

export interface TradeItem {
  id: number;
  code: string;
  name: string;
  nameBangla: string;
  description?: string;
  intakeCapacity?: number;
  totalLabs?: number;
  status?: "Active" | "Inactive";
}

export interface LabItem {
  id: number;
  name: string;
  nameBangla: string;
  code: string;
  tradeId?: number | null;
  tradeName?: string | null;
  roomNumber?: string;
  capacity?: number;
  status?: "Active" | "Inactive";
  description?: string;
}

interface ClassesAndTradesViewProps {
  initialSubTab?: SetupSubTab;
  onNavigateToStudents?: (classId: number) => void;
  onNavigateToMapping?: () => void;
}

export default function ClassesAndTradesView({
  initialSubTab = "years",
  onNavigateToStudents,
  onNavigateToMapping,
}: ClassesAndTradesViewProps) {
  const [activeTab, setActiveTab] = useState<SetupSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Core Data States
  const [years, setYears] = useState<AcademicYearItem[]>([]);
  const [classes, setClasses] = useState<AcademicClassItem[]>([]);
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [labs, setLabs] = useState<LabItem[]>([]);
  const [studentsCountMap, setStudentsCountMap] = useState<Record<number, number>>({});

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: SetupSubTab; item: any } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form States for CRUD
  // 1. Year Form
  const [yearName, setYearName] = useState("");
  const [yearStartDate, setYearStartDate] = useState("");
  const [yearEndDate, setYearEndDate] = useState("");
  const [yearStatus, setYearStatus] = useState<"Draft" | "Active" | "Archived">("Active");
  const [yearIsCurrent, setYearIsCurrent] = useState(false);
  const [yearRemarks, setYearRemarks] = useState("");

  // 2. Class Form
  const [className, setClassName] = useState("");
  const [classNameBangla, setClassNameBangla] = useState("");
  const [classNumeric, setClassNumeric] = useState<number>(6);
  const [classCode, setClassCode] = useState("");
  const [classDisplayOrder, setClassDisplayOrder] = useState<number>(1);
  const [classHasTrade, setClassHasTrade] = useState<boolean>(false);
  const [classSections, setClassSections] = useState<string>("A, B");
  const [classShifts, setClassShifts] = useState<string>("FIRST_SHIFT");
  const [classTotalSeats, setClassTotalSeats] = useState<number>(80);
  const [classStatus, setClassStatus] = useState<"Active" | "Inactive">("Active");
  const [classDescription, setClassDescription] = useState<string>("");

  // 3. Trade Form
  const [tradeCode, setTradeCode] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [tradeNameBangla, setTradeNameBangla] = useState("");
  const [tradeDescription, setTradeDescription] = useState("");
  const [tradeCapacity, setTradeCapacity] = useState<number>(50);
  const [tradeLabsCount, setTradeLabsCount] = useState<number>(2);
  const [tradeStatus, setTradeStatus] = useState<"Active" | "Inactive">("Active");

  // 4. Lab Form
  const [labName, setLabName] = useState("");
  const [labNameBangla, setLabNameBangla] = useState("");
  const [labCode, setLabCode] = useState("");
  const [labTradeId, setLabTradeId] = useState<string>("");
  const [labRoom, setLabRoom] = useState("");
  const [labCapacity, setLabCapacity] = useState<number>(40);
  const [labStatus, setLabStatus] = useState<"Active" | "Inactive">("Active");
  const [labDescription, setLabDescription] = useState("");

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Load all master datasets
  const loadData = async () => {
    try {
      setLoading(true);
      const [yearsRes, classesRes, tradesRes, labsRes, studentsRes] = await Promise.all([
        fetch("/api/academic/years").then((r) => r.json()).catch(() => ({ academicYears: [] })),
        fetch("/api/academic/classes").then((r) => r.json()).catch(() => ({ classes: [] })),
        fetch("/api/academic/trades").then((r) => r.json()).catch(() => ({ trades: [] })),
        fetch("/api/academic/labs").then((r) => r.json()).catch(() => ({ labs: [] })),
        fetch("/api/students").then((r) => r.json()).catch(() => ({ items: [] })),
      ]);

      if (yearsRes.academicYears) setYears(yearsRes.academicYears);
      if (classesRes.classes) setClasses(classesRes.classes);
      if (tradesRes.trades) setTrades(tradesRes.trades);
      if (labsRes.labs) setLabs(labsRes.labs);

      // Student enrollment count map
      if (Array.isArray(studentsRes.items)) {
        const counts: Record<number, number> = {};
        studentsRes.items.forEach((s: any) => {
          const num = typeof s.classId === "number" && s.classId <= 7 ? s.classId + 5 : Number(s.classId);
          counts[num] = (counts[num] || 0) + 1;
        });
        setStudentsCountMap(counts);
      }
    } catch (e) {
      console.error("Error loading academic setup data:", e);
      showToast("ডাটা লোড করতে সমস্যা হয়েছে", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter lists based on search
  const filteredYears = useMemo(() => {
    if (!searchQuery) return years;
    return years.filter((y) => y.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [years, searchQuery]);

  const filteredClasses = useMemo(() => {
    if (!searchQuery) return classes;
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nameBangla.includes(searchQuery) ||
        String(c.numericValue).includes(searchQuery)
    );
  }, [classes, searchQuery]);

  const filteredTrades = useMemo(() => {
    if (!searchQuery) return trades;
    return trades.filter(
      (t) =>
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.nameBangla.includes(searchQuery)
    );
  }, [trades, searchQuery]);

  const filteredLabs = useMemo(() => {
    if (!searchQuery) return labs;
    return labs.filter(
      (l) =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.nameBangla.includes(searchQuery)
    );
  }, [labs, searchQuery]);

  // Modal Open Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    if (activeTab === "years") {
      const nextY = new Date().getFullYear();
      setYearName(String(nextY));
      setYearStartDate(`${nextY}-01-01`);
      setYearEndDate(`${nextY}-12-31`);
      setYearStatus("Active");
      setYearIsCurrent(false);
      setYearRemarks("");
    } else if (activeTab === "classes") {
      const nextNum = classes.length > 0 ? Math.max(...classes.map((c) => c.numericValue)) + 1 : 6;
      setClassNumeric(nextNum);
      setClassName(`Class ${nextNum}`);
      setClassNameBangla(`${nextNum}ম শ্রেণি`);
      setClassCode(`CLS-${nextNum}`);
      setClassDisplayOrder(nextNum);
      setClassHasTrade(false);
      setClassSections("A, B");
      setClassShifts("FIRST_SHIFT");
      setClassTotalSeats(80);
      setClassStatus("Active");
      setClassDescription("");
    } else if (activeTab === "trades") {
      setTradeCode("");
      setTradeName("");
      setTradeNameBangla("");
      setTradeDescription("");
      setTradeCapacity(50);
      setTradeLabsCount(2);
      setTradeStatus("Active");
    } else if (activeTab === "labs") {
      setLabName("");
      setLabNameBangla("");
      setLabCode("");
      setLabTradeId(trades[0] ? String(trades[0].id) : "");
      setLabRoom("");
      setLabCapacity(40);
      setLabStatus("Active");
      setLabDescription("");
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === "years") {
      setYearName(item.name);
      setYearStartDate(item.startDate);
      setYearEndDate(item.endDate);
      setYearStatus(item.status);
      setYearIsCurrent(item.isCurrent);
      setYearRemarks(item.remarks || "");
    } else if (activeTab === "classes") {
      setClassNumeric(item.numericValue);
      setClassName(item.name);
      setClassNameBangla(item.nameBangla);
      setClassCode(item.code || `CLS-${item.numericValue}`);
      setClassDisplayOrder(item.displayOrder || item.numericValue);
      setClassHasTrade(Boolean(item.hasTrade));
      setClassSections(Array.isArray(item.defaultSections) ? item.defaultSections.join(", ") : item.sections || "A, B");
      setClassShifts(Array.isArray(item.defaultShifts) ? item.defaultShifts.join(", ") : item.shifts || "FIRST_SHIFT");
      setClassTotalSeats(item.totalSeats || 80);
      setClassStatus(item.status || "Active");
      setClassDescription(item.description || "");
    } else if (activeTab === "trades") {
      setTradeCode(item.code);
      setTradeName(item.name);
      setTradeNameBangla(item.nameBangla);
      setTradeDescription(item.description || "");
      setTradeCapacity(item.intakeCapacity || 50);
      setTradeLabsCount(item.totalLabs || 2);
      setTradeStatus(item.status || "Active");
    } else if (activeTab === "labs") {
      setLabName(item.name);
      setLabNameBangla(item.nameBangla);
      setLabCode(item.code);
      setLabTradeId(item.tradeId ? String(item.tradeId) : "");
      setLabRoom(item.roomNumber || "");
      setLabCapacity(item.capacity || 40);
      setLabStatus(item.status || "Active");
      setLabDescription(item.description || "");
    }
    setIsModalOpen(true);
  };

  // Form Submit Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (activeTab === "years") {
        if (!yearName.trim()) {
          showToast("শিক্ষাবর্ষের নাম বা লেবেল আবশ্যক", "error");
          setIsSubmitting(false);
          return;
        }
        if (yearStartDate && yearEndDate && new Date(yearStartDate) > new Date(yearEndDate)) {
          showToast("শুরুর তারিখ অবশ্যই শেষের তারিখের পূর্ববর্তী হতে হবে", "error");
          setIsSubmitting(false);
          return;
        }

        const endpoint = "/api/academic/years";
        const method = editingItem ? "PUT" : "POST";
        const payload = {
          id: editingItem?.id,
          name: yearName.trim(),
          startDate: yearStartDate,
          endDate: yearEndDate,
          status: yearStatus,
          isCurrent: yearIsCurrent,
          remarks: yearRemarks,
        };

        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!data.success) {
          showToast(data.error || "সংরক্ষণ ব্যর্থ হয়েছে", "error");
          setIsSubmitting(false);
          return;
        }

        showToast(data.message || "শিক্ষাবর্ষ সফলভাবে সংরক্ষিত হয়েছে");
        setIsModalOpen(false);
        loadData();
      } else if (activeTab === "classes") {
        if (!classNameBangla.trim() || !classNumeric) {
          showToast("শ্রেণির সংখ্যাগত মান ও নাম আবশ্যক", "error");
          setIsSubmitting(false);
          return;
        }

        const endpoint = "/api/academic/classes";
        const method = editingItem ? "PUT" : "POST";
        const payload = {
          id: editingItem?.id,
          numericValue: classNumeric,
          name: className.trim(),
          nameBangla: classNameBangla.trim(),
          hasTrade: classHasTrade,
          sections: classSections,
          shifts: classShifts,
          totalSeats: classTotalSeats,
          displayOrder: classDisplayOrder,
          status: classStatus,
          description: classDescription,
        };

        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!data.success) {
          showToast(data.error || "শ্রেণি সংরক্ষণ ব্যর্থ হয়েছে", "error");
          setIsSubmitting(false);
          return;
        }

        showToast(data.message || "শ্রেণি সফলভাবে সংরক্ষিত হয়েছে");
        setIsModalOpen(false);
        loadData();
      } else if (activeTab === "trades") {
        if (!tradeCode.trim() || !tradeNameBangla.trim()) {
          showToast("ট্রেডের কোড ও বাংলা নাম আবশ্যক", "error");
          setIsSubmitting(false);
          return;
        }

        const endpoint = "/api/academic/trades";
        const method = editingItem ? "PUT" : "POST";
        const payload = {
          id: editingItem?.id,
          code: tradeCode.trim(),
          name: tradeName.trim() || tradeCode.trim(),
          nameBangla: tradeNameBangla.trim(),
          description: tradeDescription,
          intakeCapacity: tradeCapacity,
          totalLabs: tradeLabsCount,
          status: tradeStatus,
        };

        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!data.success) {
          showToast(data.error || "ট্রেড সংরক্ষণ ব্যর্থ হয়েছে", "error");
          setIsSubmitting(false);
          return;
        }

        showToast(data.message || "কারিগরি ট্রেড সফলভাবে সংরক্ষিত হয়েছে");
        setIsModalOpen(false);
        loadData();
      } else if (activeTab === "labs") {
        if (!labName.trim() || !labCode.trim()) {
          showToast("ল্যাবের নাম ও কোড আবশ্যক", "error");
          setIsSubmitting(false);
          return;
        }

        const endpoint = "/api/academic/labs";
        const method = editingItem ? "PUT" : "POST";
        const payload = {
          id: editingItem?.id,
          name: labName.trim(),
          nameBangla: labNameBangla.trim() || labName.trim(),
          code: labCode.trim(),
          tradeId: labTradeId ? Number(labTradeId) : null,
          roomNumber: labRoom,
          capacity: labCapacity,
          status: labStatus,
          description: labDescription,
        };

        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!data.success) {
          showToast(data.error || "ল্যাব সংরক্ষণ ব্যর্থ হয়েছে", "error");
          setIsSubmitting(false);
          return;
        }

        showToast(data.message || "ল্যাব সফলভাবে সংরক্ষিত হয়েছে");
        setIsModalOpen(false);
        loadData();
      }
    } catch (e: any) {
      showToast(e.message || "অপ্রত্যাশিত ত্রুটি ঘটেছে", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe Deletion Handler
  const confirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);

    try {
      let endpoint = "";
      if (deletingItem.type === "years") {
        endpoint = `/api/academic/years?id=${deletingItem.item.id}&name=${encodeURIComponent(deletingItem.item.name)}`;
      } else if (deletingItem.type === "classes") {
        endpoint = `/api/academic/classes?id=${deletingItem.item.id}&numericValue=${deletingItem.item.numericValue}`;
      } else if (deletingItem.type === "trades") {
        endpoint = `/api/academic/trades?id=${deletingItem.item.id}`;
      } else if (deletingItem.type === "labs") {
        endpoint = `/api/academic/labs?id=${deletingItem.item.id}`;
      }

      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json();

      if (!data.success) {
        showToast(data.error || "মুছে ফেলা সম্ভব হয়নি। নির্ভরশীল রেকর্ড বিদ্যমান।", "error");
        setDeletingItem(null);
        setIsDeleting(false);
        return;
      }

      showToast(data.message || "সফলভাবে মুছে ফেলা হয়েছে");
      setDeletingItem(null);
      loadData();
    } catch (e: any) {
      showToast(e.message || "ডিলিট করার সময় ত্রুটি ঘটেছে", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-900 dark:text-slate-100">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all border ${
            toast.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-950/20"
              : toast.type === "error"
              ? "bg-rose-600 text-white border-rose-500 shadow-rose-950/20"
              : "bg-indigo-600 text-white border-indigo-500 shadow-indigo-950/20"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {toast.type === "error" && <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner & Control Area */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-bold mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>ACADEMIC MASTER SETUP</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            একাডেমিক মাস্টার কনফিগারেশন ও শ্রেণি কাঠামো
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            শিক্ষাবর্ষ, শ্রেণি, ভোকেশনাল ট্রেড, ব্যবহারিক ল্যাব ও আসন নিয়ন্ত্রণ ম্যানুয়ালি পরিচালনা করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={onNavigateToMapping}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-all border border-slate-300/80 dark:border-slate-700 shadow-xs"
          >
            <Sliders className="w-4 h-4 text-indigo-500" />
            <span>সেন্ট্রাল একাডেমিক ম্যাপিং</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === "years" && "নতুন শিক্ষাবর্ষ যোগ করুন"}
              {activeTab === "classes" && "নতুন শ্রেণি যোগ করুন"}
              {activeTab === "trades" && "নতুন ট্রেড যোগ করুন"}
              {activeTab === "labs" && "নতুন ল্যাব যোগ করুন"}
              {activeTab === "capacity_schedule" && "নতুন শ্রেণি যোগ করুন"}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => {
            setActiveTab("years");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "years"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>শিক্ষাবর্ষ ({years.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("classes");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "classes"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>শ্রেণিসমূহ ({classes.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("trades");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "trades"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>কারিগরি ট্রেড ({trades.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("labs");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "labs"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>ব্যবহারিক ল্যাব ({labs.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("capacity_schedule");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "capacity_schedule"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>আসন ও শিফট পর্যবেক্ষণ</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="অনুসন্ধান করুন..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
        />
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* TAB 1: ACADEMIC YEARS */}
      {activeTab === "years" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>একাডেমিক শিক্ষাবর্ষ তালিকা</span>
            </h2>
            <span className="text-[11px] text-slate-500">মোট {filteredYears.length} টি শিক্ষাবর্ষ</span>
          </div>

          {filteredYears.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">কোনো শিক্ষাবর্ষ যুক্ত করা হয়নি</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                ডাটাবেজ বর্তমানে সম্পূর্ণ ফাঁকা রয়েছে। &apos;নতুন শিক্ষাবর্ষ যোগ করুন&apos; বাটনে ক্লিক করে ম্যানুয়ালি যুক্ত করুন।
              </p>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন শিক্ষাবর্ষ যোগ করুন</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">শিক্ষাবর্ষ</th>
                    <th className="py-3 px-4">মেয়াদ (শুরু - সমাপ্তি)</th>
                    <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                    <th className="py-3 px-4 text-center">চলতি সক্রিয় বর্ষ</th>
                    <th className="py-3 px-4">মন্তব্য</th>
                    <th className="py-3 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredYears.map((y) => (
                    <tr key={y.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold font-mono text-indigo-600 dark:text-indigo-400 text-sm">
                        {y.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {y.startDate} হতে {y.endDate}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            y.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : y.status === "Draft"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {y.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {y.isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>চলতি শিক্ষাবর্ষ</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate">
                        {y.remarks || "-"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(y)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                            title="সম্পাদনা করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ type: "years", item: y })}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLASSES */}
      {activeTab === "classes" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>প্রাতিষ্ঠানিক শ্রেণিসমূহ (Academic Classes)</span>
            </h2>
            <span className="text-[11px] text-slate-500">মোট {filteredClasses.length} টি শ্রেণি</span>
          </div>

          {filteredClasses.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">কোনো শ্রেণি তৈরি করা হয়নি</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                ডাটাবেজে কোনো শ্রেণি নেই। আপনার প্রতিষ্ঠানের প্রয়োজন অনুসারে শ্রেণি যোগ করুন (যেমন: ৬ষ্ঠ হতে ১২শ শ্রেণি)।
              </p>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন শ্রেণি যোগ করুন</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">শ্রেণি</th>
                    <th className="py-3 px-4">সংখ্যাগত মান (Numeric)</th>
                    <th className="py-3 px-4 text-center">কারিগরি ট্রেড সুবিধা</th>
                    <th className="py-3 px-4 text-center">অনুমোদিত শাখা</th>
                    <th className="py-3 px-4 text-center">মোট আসন</th>
                    <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                    <th className="py-3 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredClasses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{c.nameBangla}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{c.name}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        Class {c.numericValue}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {c.hasTrade ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                            <Cpu className="w-3 h-3" />
                            <span>ট্রেড প্রযোজ্য</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            ট্রেড নেই (সাধারণ)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px]">
                        {Array.isArray(c.defaultSections) ? c.defaultSections.join(", ") : "A, B"}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                        {c.totalSeats || 80}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {c.status || "Active"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                            title="সম্পাদনা করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ type: "classes", item: c })}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRADES */}
      {activeTab === "trades" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>কারিগরি ও ভোকেশনাল ট্রেড মাস্টার (Vocational Trades)</span>
            </h2>
            <span className="text-[11px] text-slate-500">মোট {filteredTrades.length} টি ট্রেড</span>
          </div>

          {filteredTrades.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Cpu className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">কোনো কারিগরি ট্রেড তৈরি করা হয়নি</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                ভোকেশনাল শিক্ষার জন্য প্রয়োজনীয় ট্রেডসমূহ ম্যানুয়ালি যোগ করুন (যেমন: Computer, Electrical, Electronics ইত্যাদি)।
              </p>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন ট্রেড যোগ করুন</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">ট্রেডের নাম</th>
                    <th className="py-3 px-4">ট্রেড কোড</th>
                    <th className="py-3 px-4 text-center">আসন সংখ্যা (Cap)</th>
                    <th className="py-3 px-4 text-center">সংযুক্ত ল্যাব</th>
                    <th className="py-3 px-4">বিবরণ</th>
                    <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                    <th className="py-3 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredTrades.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{t.nameBangla}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{t.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {t.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {t.intakeCapacity || 50}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-400">
                        {t.totalLabs || 2} টি
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                        {t.description || "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {t.status || "Active"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                            title="সম্পাদনা করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ type: "trades", item: t })}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LABS */}
      {activeTab === "labs" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-indigo-600" />
              <span>কারিগরি ল্যাব ও ব্যবহারিক কর্মশালা (Practical Labs)</span>
            </h2>
            <span className="text-[11px] text-slate-500">মোট {filteredLabs.length} টি ল্যাব</span>
          </div>

          {filteredLabs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Wrench className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">কোনো ল্যাব কনফিগার করা হয়নি</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                ব্যবহারিক ক্লাসের জন্য প্রয়োজনীয় ল্যাব ও ওয়ার্কশপ ম্যানুয়ালি যোগ করুন।
              </p>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন ল্যাব যোগ করুন</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">ল্যাবের নাম</th>
                    <th className="py-3 px-4">কোড</th>
                    <th className="py-3 px-4">সংযুক্ত ট্রেড</th>
                    <th className="py-3 px-4">রুম / অবস্থান</th>
                    <th className="py-3 px-4 text-center">ধারণক্ষমতা</th>
                    <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                    <th className="py-3 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredLabs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{l.nameBangla}</div>
                        <div className="text-[11px] text-slate-400">{l.name}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {l.code}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {l.tradeName || "সাধারণ / প্রযোজ্য নয়"}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {l.roomNumber || "-"}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {l.capacity || 40} জন
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {l.status || "Active"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(l)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                            title="সম্পাদনা করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ type: "labs", item: l })}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CAPACITY & SCHEDULE MONITOR */}
      {activeTab === "capacity_schedule" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>আসন ধারণক্ষমতা ও ভর্তি অনুপাত পর্যবেক্ষণ</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  নির্ধারিত আসন অপেক্ষা এনরোলমেন্ট বেশি হলে স্বয়ংক্রিয় সতর্কবার্তা প্রদর্শিত হয়।
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">শ্রেণি</th>
                    <th className="py-3 px-4 text-center">অনুমোদিত আসন</th>
                    <th className="py-3 px-4 text-center">ভর্তিকৃত শিক্ষার্থী</th>
                    <th className="py-3 px-4 text-center">পূরণ হার</th>
                    <th className="py-3 px-4">ধারণক্ষমতা স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {classes.map((cls) => {
                    const enrolled = studentsCountMap[cls.numericValue] || 0;
                    const capacity = cls.totalSeats || 80;
                    const ratio = Math.round((enrolled / capacity) * 100);
                    const isOver = enrolled > capacity;

                    return (
                      <tr key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {cls.nameBangla}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {capacity}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {enrolled}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isOver ? "bg-rose-500" : ratio > 80 ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, ratio)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-bold">{ratio}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isOver ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>ধারণক্ষমতা অতিক্রম করেছে ({enrolled - capacity} জন অতিরিক্ত)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span>স্বাভাবিক ({capacity - enrolled} টি আসন খালি)</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>
                  {editingItem ? "রেকর্ড সম্পাদনা (Edit)" : "নতুন রেকর্ড সংযোজন (Add New)"}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-normal">
                  {activeTab === "years" && "শিক্ষাবর্ষ"}
                  {activeTab === "classes" && "শ্রেণি"}
                  {activeTab === "trades" && "কারিগরি ট্রেড"}
                  {activeTab === "labs" && "ল্যাব"}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* YEARS FORM */}
              {activeTab === "years" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      শিক্ষাবর্ষের নাম বা লেবেল <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={yearName}
                      onChange={(e) => setYearName(e.target.value)}
                      placeholder="e.g. 2026 বা 2026-2027"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        শুরুর তারিখ
                      </label>
                      <input
                        type="date"
                        value={yearStartDate}
                        onChange={(e) => setYearStartDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        সমাপ্তির তারিখ
                      </label>
                      <input
                        type="date"
                        value={yearEndDate}
                        onChange={(e) => setYearEndDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      স্ট্যাটাস
                    </label>
                    <select
                      value={yearStatus}
                      onChange={(e) => setYearStatus(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Active">Active (সক্রিয়)</option>
                      <option value="Draft">Draft (খসড়া)</option>
                      <option value="Archived">Archived (আর্কাইভড)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input
                      type="checkbox"
                      id="yearIsCurrent"
                      checked={yearIsCurrent}
                      onChange={(e) => setYearIsCurrent(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <label htmlFor="yearIsCurrent" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      চলতি সক্রিয় শিক্ষাবর্ষ হিসেবে নির্ধারণ করুন (Single Active Current Year)
                    </label>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      মন্তব্য (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={yearRemarks}
                      onChange={(e) => setYearRemarks(e.target.value)}
                      placeholder="e.g. নতুন শিক্ষাবর্ষ"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* CLASSES FORM */}
              {activeTab === "classes" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        বাংলা নাম <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={classNameBangla}
                        onChange={(e) => setClassNameBangla(e.target.value)}
                        placeholder="e.g. ৯ম শ্রেণি"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        ইংরেজি নাম <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        placeholder="e.g. Class 9"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        সংখ্যাগত মান (Numeric) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="20"
                        value={classNumeric}
                        onChange={(e) => setClassNumeric(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        অনুমোদিত আসন সংখ্যা
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={classTotalSeats}
                        onChange={(e) => setClassTotalSeats(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input
                      type="checkbox"
                      id="classHasTrade"
                      checked={classHasTrade}
                      onChange={(e) => setClassHasTrade(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <label htmlFor="classHasTrade" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      এই শ্রেণিতে কারিগরি ট্রেড অন্তর্ভুক্ত হবে (Vocational Trade Applicable)
                    </label>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      ডিফল্ট শাখা (কমা দিয়ে লিখুন)
                    </label>
                    <input
                      type="text"
                      value={classSections}
                      onChange={(e) => setClassSections(e.target.value)}
                      placeholder="e.g. A, B, C"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* TRADES FORM */}
              {activeTab === "trades" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        ট্রেড কোড <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tradeCode}
                        onChange={(e) => setTradeCode(e.target.value)}
                        placeholder="e.g. CE, IT-IoT, EE"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        আসন ধারণক্ষমতা
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tradeCapacity}
                        onChange={(e) => setTradeCapacity(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      বাংলা নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tradeNameBangla}
                      onChange={(e) => setTradeNameBangla(e.target.value)}
                      placeholder="e.g. কনজিউমার ইলেকট্রনিক্স"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      ইংরেজি নাম
                    </label>
                    <input
                      type="text"
                      value={tradeName}
                      onChange={(e) => setTradeName(e.target.value)}
                      placeholder="e.g. Consumer Electronics"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      বিবরণ ও ক্যারিয়ার সম্ভাবনা
                    </label>
                    <textarea
                      rows={2}
                      value={tradeDescription}
                      onChange={(e) => setTradeDescription(e.target.value)}
                      placeholder="ট্রেডের সংক্ষিপ্ত পরিচিতি..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* LABS FORM */}
              {activeTab === "labs" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        ল্যাবের নাম (বাংলা) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={labNameBangla}
                        onChange={(e) => setLabNameBangla(e.target.value)}
                        placeholder="e.g. রোবোটিক্স ল্যাব"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        ল্যাব কোড <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={labCode}
                        onChange={(e) => setLabCode(e.target.value)}
                        placeholder="e.g. LAB-ROBOTICS"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        সংযুক্ত ট্রেড (ঐচ্ছিক)
                      </label>
                      <select
                        value={labTradeId}
                        onChange={(e) => setLabTradeId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">সাধারণ ল্যাব (সকলের জন্য)</option>
                        {trades.map((t) => (
                          <option key={t.id} value={String(t.id)}>
                            {t.nameBangla} ({t.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        রুম বা অবস্থান
                      </label>
                      <input
                        type="text"
                        value={labRoom}
                        onChange={(e) => setLabRoom(e.target.value)}
                        placeholder="e.g. Room 201"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      ধারণক্ষমতা (জন)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={labCapacity}
                      onChange={(e) => setLabCapacity(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? "হালনাগাদ করুন" : "সংরক্ষণ করুন"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                আপনি কি নিশ্চিতভাবে মুছে ফেলতে চান?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                রেকর্ড: <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{deletingItem.item.nameBangla || deletingItem.item.name}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                সতর্কতা: যদি এই রেকর্ডের সাথে শিক্ষার্থী, হাজিরা বা পরীক্ষার তথ্য সংযুক্ত থাকে, তবে ডাটা সুরক্ষার স্বার্থে স্বয়ংক্রিয়ভাবে মুছে ফেলা প্রতিরোধ করা হবে।
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>হ্যাঁ, মুছে ফেলুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
