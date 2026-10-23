"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
  ArrowRight,
  RefreshCw,
  Calendar,
  GraduationCap,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Sliders,
  Filter,
} from "lucide-react";
import {
  AcademicMappingRecord,
  AcademicProgramRecord,
  ClassMasterRecord,
  TradeMasterRecord,
  AcademicYearRecord,
  MasterDataSnapshot,
} from "@/lib/masterDataEngine";

export default function SimplifiedAcademicMappingView() {
  const [snapshot, setSnapshot] = useState<MasterDataSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Filter States
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Selected mapping for Edit, Delete, or View
  const [activeMapping, setActiveMapping] = useState<AcademicMappingRecord | null>(null);
  const [usageCheck, setUsageCheck] = useState<{
    referenced: boolean;
    studentCount: number;
    attendanceCount: number;
    reason?: string;
  } | null>(null);

  // 5-Step Form State (Used for both Create and Edit)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formYear, setFormYear] = useState<string>("2026");
  const [formClassNumeric, setFormClassNumeric] = useState<number>(9);
  const [formSection, setFormSection] = useState<string>("A");
  const [formShift, setFormShift] = useState<string>("FIRST_SHIFT");
  const [formTradeId, setFormTradeId] = useState<string>("101");
  const [formCapacity, setFormCapacity] = useState<number>(50);
  const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Master Data Snapshot
  const fetchSnapshot = async (year = selectedYear) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/academic/master-data?year=${encodeURIComponent(year)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSnapshot(json.data);
      }
    } catch (e) {
      console.error("Failed loading master data snapshot", e);
      showToast("মাস্টার ডাটা লোড করতে সমস্যা হয়েছে", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot(selectedYear);
  }, [selectedYear]);

  // Derived options from snapshot
  const academicYears = snapshot?.academicYears || [];
  const classes = snapshot?.classes || [];
  const trades = snapshot?.trades || [];
  const mappings = snapshot?.mappings || [];

  // Determine if trade is applicable for selected class based on admin class configuration
  const isTradeApplicable = useMemo(() => {
    const cls = classes.find((c) => c.numericValue === formClassNumeric);
    return cls ? Boolean(cls.hasTrade) : false;
  }, [classes, formClassNumeric]);

  // Auto-adjust Trade when class changes
  useEffect(() => {
    if (!isTradeApplicable) {
      setFormTradeId("0");
    } else if (formTradeId === "0" && trades.length > 0) {
      setFormTradeId(String(trades[0].id));
    }
  }, [formClassNumeric, isTradeApplicable, trades]);

  // Selected Class details object
  const selectedClassObj = useMemo(() => {
    return classes.find((c) => c.numericValue === formClassNumeric);
  }, [classes, formClassNumeric]);

  // Selected Trade details object
  const selectedTradeObj = useMemo(() => {
    if (!isTradeApplicable) return null;
    return trades.find((t) => String(t.id) === formTradeId) || null;
  }, [isTradeApplicable, trades, formTradeId]);

  // Duplicate / Conflict validation check
  const duplicateConflict = useMemo(() => {
    const tradeKey = isTradeApplicable ? formTradeId : "0";
    const secKey = formSection.trim().toUpperCase();
    const shiftKey = formShift.trim();

    return mappings.find(
      (m) =>
        (!activeMapping || m.id !== activeMapping.id) &&
        m.academicYear === formYear &&
        m.classNumeric === formClassNumeric &&
        (m.tradeId ? String(m.tradeId) : "0") === tradeKey &&
        m.section.trim().toUpperCase() === secKey &&
        m.shift.trim() === shiftKey
    );
  }, [mappings, activeMapping, formYear, formClassNumeric, formTradeId, isTradeApplicable, formSection, formShift]);

  // Filtered Mappings for display table
  const filteredMappings = useMemo(() => {
    let result = mappings;

    if (classFilter !== "all") {
      result = result.filter((m) => String(m.classNumeric) === classFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((m) => m.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.className.toLowerCase().includes(q) ||
          (m.tradeName && m.tradeName.toLowerCase().includes(q)) ||
          (m.tradeCode && m.tradeCode.toLowerCase().includes(q)) ||
          m.section.toLowerCase().includes(q) ||
          m.shiftNameBangla.toLowerCase().includes(q)
      );
    }

    return result;
  }, [mappings, classFilter, statusFilter, searchQuery]);

  // Summary counts
  const totalCount = filteredMappings.length;
  const activeCount = filteredMappings.filter((m) => m.status === "Active").length;
  const inactiveCount = filteredMappings.filter((m) => m.status === "Inactive").length;

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setActiveMapping(null);
    setCurrentStep(1);
    setFormYear(selectedYear);
    setFormClassNumeric(9);
    setFormSection("A");
    setFormShift("FIRST_SHIFT");
    setFormTradeId(trades.length > 0 ? String(trades[0].id) : "101");
    setFormCapacity(50);
    setFormStatus("Active");
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal with pre-filled mapping details
  const handleOpenEditModal = (mapping: AcademicMappingRecord) => {
    setActiveMapping(mapping);
    setCurrentStep(1);
    setFormYear(mapping.academicYear);
    setFormClassNumeric(mapping.classNumeric);
    setFormSection(mapping.section);
    setFormShift(mapping.shift);
    setFormTradeId(mapping.tradeId ? String(mapping.tradeId) : "0");
    setFormCapacity(mapping.capacity);
    setFormStatus(mapping.status);
    setIsEditModalOpen(true);
  };

  // Open View Modal
  const handleOpenViewModal = (mapping: AcademicMappingRecord) => {
    setActiveMapping(mapping);
    setIsViewModalOpen(true);
  };

  // Open Delete Modal and check reference usage
  const handleOpenDeleteModal = async (mapping: AcademicMappingRecord) => {
    setActiveMapping(mapping);
    setUsageCheck(null);
    setIsDeleteModalOpen(true);

    try {
      const res = await fetch(`/api/academic/master-data?check_usage=${encodeURIComponent(mapping.id)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setUsageCheck(json.data);
      }
    } catch {
      // Fallback
    }
  };

  // Toggle active status directly
  const handleToggleStatus = async (mapping: AcademicMappingRecord) => {
    const targetStatus = mapping.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch("/api/academic/master-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_mapping",
          payload: { mappingId: mapping.id, newStatus: targetStatus },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          `ম্যাপিংটি সফলভাবে ${targetStatus === "Active" ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে (পূর্বে সংরক্ষিত ডাটা অক্ষত রয়েছে)।`,
          "success"
        );
        fetchSnapshot(selectedYear);
      } else {
        showToast(data.error || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।", "error");
      }
    } catch {
      showToast("নেটওয়ার্ক সমস্যা ঘটেছে।", "error");
    }
  };

  // Submit Save (Create or Update)
  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();

    if (duplicateConflict) {
      showToast("একই সমন্বয়ে পূর্বেই একটি ম্যাপিং বিদ্যমান রয়েছে!", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const isEditing = Boolean(activeMapping);

      const payload = {
        originalId: activeMapping ? activeMapping.id : undefined,
        academicYear: formYear,
        classNumeric: formClassNumeric,
        tradeId: isTradeApplicable ? Number(formTradeId) : null,
        section: formSection.trim().toUpperCase(),
        shift: formShift,
        capacity: formCapacity,
        status: formStatus,
      };

      const res = await fetch("/api/academic/master-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_mapping",
          payload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          isEditing ? "একাডেমিক ম্যাপিং সফলভাবে সম্পাদন (Edit) করা হয়েছে।" : "নতুন একাডেমিক ম্যাপিং সফলভাবে তৈরি হয়েছে।",
          "success"
        );
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setActiveMapping(null);
        fetchSnapshot(formYear);
      } else {
        showToast(data.error || "সংরক্ষণ করতে সমস্যা হয়েছে।", "error");
      }
    } catch {
      showToast("সার্ভার ত্রুটি ঘটেছে।", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Perform Safe Delete
  const handleConfirmDelete = async (force = false) => {
    if (!activeMapping) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/academic/master-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_mapping",
          payload: {
            mappingId: activeMapping.id,
            force,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("একাডেমিক ম্যাপিং সফলভাবে মুছে ফেলা হয়েছে (Permanently deleted)।", "success");
        setIsDeleteModalOpen(false);
        setActiveMapping(null);
        fetchSnapshot(selectedYear);
      } else {
        showToast(data.error || "ডিলিট করতে ব্যর্থ হয়েছে।", "error");
      }
    } catch {
      showToast("নেটওয়ার্ক সমস্যা ঘটেছে।", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans pb-16">
      {/* Toast Alert Banner */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-bold transition-all duration-300 ${
            toast.type === "success"
              ? "bg-emerald-950/95 text-emerald-200 border-emerald-500/40"
              : toast.type === "error"
              ? "bg-rose-950/95 text-rose-200 border-rose-500/40"
              : "bg-cyan-950/95 text-cyan-200 border-cyan-500/40"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toast.type === "info" && <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>CENTRAL ACADEMIC MAPPING ENGINE · BTEB & DTE COMPLIANT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              একাডেমিক ম্যাপিং (Academic Mapping)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের কেন্দ্রীয় শিক্ষাবর্ষ, শ্রেণি, শাখা ও কারিগরি ট্রেড সমন্বয়। এটি সমগ্র ERP-এর (ভর্তি, হাজিরা, রুটিন ও পরীক্ষার ফলাফল) একক ভিত্তি হিসেবে কাজ করে।
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
              <span className="font-semibold text-indigo-400">PTSC Institutional Engine</span>
              <span>·</span>
              <span>সক্রিয় শিক্ষাবর্ষ: {selectedYear}</span>
              <span>·</span>
              <span>মোট ম্যাপিং: {totalCount} টি</span>
              <span>·</span>
              <span className="text-emerald-400">চালু: {activeCount} টি</span>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                fetchSnapshot(selectedYear);
                showToast("সকল তথ্য রিফ্রেশ করা হয়েছে!", "info");
              }}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ম্যাপিং তৈরি করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Academic Year Filter */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>শিক্ষাবর্ষ (Academic Year):</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
            >
              {academicYears.map((y) => (
                <option key={y.id} value={y.name}>
                  {y.name} শিক্ষাবর্ষ {y.status === "Active" ? "(চলতি সক্রিয়)" : `(${y.status})`}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Class Filter */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
              <span>শ্রেণি (Class Filter):</span>
            </label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="all">সকল শ্রেণি (Class 6 - 12)</option>
              {classes.map((cls) => (
                <option key={cls.id} value={String(cls.numericValue)}>
                  {cls.nameBangla} ({cls.name})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Status Filter */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>স্ট্যাটাস (Status):</span>
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="all">সকল স্ট্যাটাস (All Status)</option>
              <option value="Active">সক্রিয় (Active)</option>
              <option value="Inactive">নিষ্ক্রিয় (Inactive)</option>
            </select>
          </div>

          {/* 4. Search Filter */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>অনুসন্ধান (Search):</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="শ্রেণি, ট্রেডের নাম বা কোড খুঁজুন..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Academic Mapping Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              একাডেমিক ম্যাপিং সূচি ({filteredMappings.length} টি রেকর্ড)
            </h3>
          </div>

          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>সক্রিয়: {activeCount}</span>
            </span>
            {inactiveCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>নিষ্ক্রিয়: {inactiveCount}</span>
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4">শিক্ষাবর্ষ</th>
                <th className="py-3.5 px-4">শ্রেণি (Class)</th>
                <th className="py-3.5 px-4">গ্রুপ / শাখা (Section)</th>
                <th className="py-3.5 px-4">কারিগরি ট্রেড (Trade)</th>
                <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3.5 px-4 text-center">সর্বশেষ আপডেট</th>
                <th className="py-3.5 px-4 text-right">অ্যাকশন (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
              {filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-bold text-slate-400">কোনো একাডেমিক ম্যাপিং পাওয়া যায়নি</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      ফিল্টার পরিবর্তন করুন অথবা &apos;নতুন ম্যাপিং তৈরি করুন&apos; বাটনে ক্লিক করে নতুন ম্যাপিং যুক্ত করুন।
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMappings.map((m) => {
                  const isPreVoc = m.classNumeric <= 8;
                  const isActive = m.status === "Active";

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors group">
                      {/* 1. Academic Year */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200">
                          {m.academicYear}
                        </span>
                      </td>

                      {/* 2. Class */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-xs">{m.className}</div>
                        <span className="text-[10px] text-slate-400 font-mono">Class {m.classNumeric}</span>
                      </td>

                      {/* 3. Group / Section */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold text-[11px]">
                            শাখা {m.section}
                          </span>
                          <span className="text-[10px] text-slate-400">({m.shiftNameBangla})</span>
                        </div>
                      </td>

                      {/* 4. Trade */}
                      <td className="py-3.5 px-4">
                        {isPreVoc ? (
                          <span className="text-slate-500 text-[11px] font-medium">প্রযোজ্য নয়</span>
                        ) : m.tradeName ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                            <span className="font-bold text-white">{m.tradeName}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
                              {m.tradeCode}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">প্রযোজ্য নয়</span>
                        )}
                      </td>

                      {/* 5. Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(m)}
                          title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                            isActive
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-slate-500"}`} />
                          <span>{isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}</span>
                        </button>
                      </td>

                      {/* 6. Last Updated */}
                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400">
                        {new Date(m.updatedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* 7. Actions: View, Edit, Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Button */}
                          <button
                            onClick={() => handleOpenViewModal(m)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            title="বিস্তারিত দেখুন (View Details)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(m)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600/30 text-cyan-300 hover:text-cyan-200 border border-slate-700 transition-colors"
                            title="ম্যাপিং সম্পাদনা করুন (Edit Mapping)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleOpenDeleteModal(m)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-rose-400 hover:text-rose-200 border border-slate-700 transition-colors"
                            title="ম্যাপিং মুছুন (Delete Mapping)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5-STEP MODAL: CREATE / EDIT ACADEMIC MAPPING                             */}
      {/* ========================================================================= */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {isEditModalOpen ? "একাডেমিক ম্যাপিং সম্পাদনা (Edit Mapping)" : "নতুন একাডেমিক ম্যাপিং (Step-by-Step)"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isEditModalOpen ? "বিদ্যমান ম্যাপিংটির তথ্য সংশোধন করুন।" : "সহজ ৫টি ধাপে নতুন ম্যাপিং নির্ধারণ করুন।"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 5-Step Progress Indicators */}
            <div className="bg-slate-950/60 px-5 py-3 border-b border-slate-800/80 flex items-center justify-between">
              {[
                { num: 1, label: "শিক্ষাবর্ষ" },
                { num: 2, label: "শ্রেণি" },
                { num: 3, label: "শাখা/শিফট" },
                { num: 4, label: "ট্রেড" },
                { num: 5, label: "রিভিউ ও সংরক্ষণ" },
              ].map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                    currentStep === s.num
                      ? "text-cyan-400"
                      : currentStep > s.num
                      ? "text-emerald-400"
                      : "text-slate-500"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                      currentStep === s.num
                        ? "bg-cyan-500 text-slate-950 font-black"
                        : currentStep > s.num
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {currentStep > s.num ? <Check className="w-3 h-3" /> : s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveMapping} className="p-6 space-y-5 text-xs font-semibold">
              {/* STEP 1: Academic Year নির্বাচন */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                      Step 1 of 5
                    </span>
                    <h4 className="text-base font-bold text-white">শিক্ষাবর্ষ (Academic Year) নির্বাচন করুন</h4>
                    <p className="text-slate-400 text-xs">
                      যে শিক্ষাবর্ষের জন্য এই ম্যাপিং প্রযোজ্য হবে তা নির্ধারণ করুন।
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                    {academicYears.map((yr) => {
                      const isSelected = formYear === yr.name;
                      return (
                        <button
                          key={yr.id}
                          type="button"
                          onClick={() => setFormYear(yr.name)}
                          className={`p-3.5 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? "bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          <div className="text-sm font-black font-mono">{yr.name}</div>
                          <div className="text-[10px] text-slate-400 mt-1">{yr.status}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: Class নির্বাচন */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                      Step 2 of 5
                    </span>
                    <h4 className="text-base font-bold text-white">শ্রেণি (Class) নির্বাচন করুন</h4>
                    <p className="text-slate-400 text-xs">
                      প্রতিষ্ঠানের কোন শ্রেণিতে এই ম্যাপিং পরিচালিত হবে তা বেছে নিন।
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 max-h-60 overflow-y-auto pr-1">
                    {classes.map((cls) => {
                      const isSelected = formClassNumeric === cls.numericValue;
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => setFormClassNumeric(cls.numericValue)}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs">{cls.nameBangla}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{cls.name}</div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              cls.numericValue <= 8
                                ? "bg-amber-500/10 text-amber-300"
                                : "bg-cyan-500/10 text-cyan-300"
                            }`}
                          >
                            {cls.numericValue <= 8 ? "প্রাক-ভোকেশনাল" : "ভোকেশনাল"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: Group / Section / Shift নির্বাচন */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                      Step 3 of 5
                    </span>
                    <h4 className="text-base font-bold text-white">গ্রুপ, শাখা ও শিফট নির্ধারণ করুন</h4>
                    <p className="text-slate-400 text-xs">
                      {selectedClassObj?.nameBangla || `Class ${formClassNumeric}`}-এর জন্য প্রযোজ্য শাখা ও শিফট নির্ধারণ করুন।
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1.5">শাখা (Section):</label>
                      <select
                        value={formSection}
                        onChange={(e) => setFormSection(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                      >
                        <option value="A">শাখা A (Section A)</option>
                        <option value="B">শাখা B (Section B)</option>
                        <option value="C">শাখা C (Section C)</option>
                        <option value="NA">প্রযোজ্য নয় (N/A)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1.5">শিফট (Shift):</label>
                      <select
                        value={formShift}
                        onChange={(e) => setFormShift(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                      >
                        <option value="FIRST_SHIFT">১ম শিফট (সকাল ৮:০০ - দুপুর ১:০০)</option>
                        <option value="SECOND_SHIFT">২য় শিফট (দুপুর ১:৩০ - সন্ধ্যা ৬:০০)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1.5">অনুমোদিত সর্বোচ্চ আসন সংখ্যা:</label>
                    <input
                      type="number"
                      value={formCapacity}
                      onChange={(e) => setFormCapacity(Number(e.target.value))}
                      min={10}
                      max={200}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Trade নির্বাচন */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                      Step 4 of 5
                    </span>
                    <h4 className="text-base font-bold text-white">কারিগরি ট্রেড (Trade) নির্বাচন করুন</h4>
                    <p className="text-slate-400 text-xs">
                      {isTradeApplicable
                        ? "৯ম থেকে ১২শ শ্রেণির জন্য সরকারি অনুমোদিত ৪টি বিটিইবি ট্রেড থেকে একটি নির্বাচন করুন।"
                        : "৬ষ্ঠ থেকে ৮ম শ্রেণিতে কোনো কারিগরি ট্রেড নেই (প্রযোজ্য নয়)।"}
                    </p>
                  </div>

                  {!isTradeApplicable ? (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span>ট্রেড প্রযোজ্য নয় (Pre-Vocational)</span>
                      </div>
                      <p className="text-[11px] text-amber-300/80">
                        নির্বাচিত {selectedClassObj?.nameBangla}-এ সাধারণ কারিগরি ভিত্তি পরিচালিত হয়। কোনো নির্দিষ্ট ট্রেড নির্বাচন প্রয়োজন নেই।
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {trades.map((trd) => {
                        const isSelected = formTradeId === String(trd.id);
                        return (
                          <button
                            key={trd.id}
                            type="button"
                            onClick={() => setFormTradeId(String(trd.id))}
                            className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                              isSelected
                                ? "bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                            }`}
                          >
                            <div>
                              <div className="font-bold text-xs">{trd.nameBangla}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{trd.name}</div>
                            </div>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">
                              {trd.code}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: Review & Save */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                      Step 5 of 5
                    </span>
                    <h4 className="text-base font-bold text-white">রিভিউ ও সংরক্ষণ (Review & Save)</h4>
                    <p className="text-slate-400 text-xs">
                      নিচের তথ্যাবলি যাচাই করে চূড়ান্ত সংরক্ষণ করুন।
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-400 block">শিক্ষাবর্ষ:</span>
                        <span className="font-bold text-white text-sm">{formYear} সেশন</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">শ্রেণি:</span>
                        <span className="font-bold text-white text-sm">{selectedClassObj?.nameBangla}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-400 block">শাখা ও শিফট:</span>
                        <span className="font-bold text-white">
                          শাখা {formSection} · {formShift === "FIRST_SHIFT" ? "১ম শিফট" : "২য় শিফট"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">কারিগরি ট্রেড:</span>
                        <span className="font-bold text-white">
                          {isTradeApplicable ? selectedTradeObj?.nameBangla || "ট্রেড" : "প্রযোজ্য নয়"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">আসন সংখ্যা:</span>
                        <span className="font-bold text-white">{formCapacity} জন</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">স্ট্যাটাস:</span>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-bold"
                        >
                          <option value="Active">সক্রিয় (Active)</option>
                          <option value="Inactive">নিষ্ক্রিয় (Inactive)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Conflict alert if duplicate */}
                  {duplicateConflict && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>সতর্কতা: একই শিক্ষাবর্ষ, শ্রেণি, ট্রেড ও শাখায় পূর্বেই একটি ম্যাপিং সক্রিয় রয়েছে!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation & Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    পূর্ববর্তী ধাপ
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2.5">
                  {currentStep < 5 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((prev) => prev + 1)}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5"
                    >
                      <span>পরবর্তী ধাপ</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || Boolean(duplicateConflict)}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSubmitting ? "সংরক্ষণ হচ্ছে..." : "চূড়ান্ত সংরক্ষণ করুন"}</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW DETAILS                                                       */}
      {/* ========================================================================= */}
      {isViewModalOpen && activeMapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">একাডেমিক ম্যাপিং বিবরণ</h3>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">ম্যাপিং আইডি:</span>
                <span className="font-mono text-cyan-400 text-[11px] truncate max-w-[200px]">{activeMapping.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">শিক্ষাবর্ষ:</span>
                <span className="font-bold text-white">{activeMapping.academicYear} সেশন</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">শ্রেণি:</span>
                <span className="font-bold text-white">{activeMapping.className} (Class {activeMapping.classNumeric})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">শাখা ও শিফট:</span>
                <span className="font-bold text-white">শাখা {activeMapping.section} ({activeMapping.shiftNameBangla})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">কারিগরি ট্রেড:</span>
                <span className="font-bold text-white">{activeMapping.tradeName || "প্রযোজ্য নয়"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">আসন ধারণক্ষমতা:</span>
                <span className="font-bold text-white">{activeMapping.capacity} জন</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">বর্তমান স্ট্যাটাস:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    activeMapping.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {activeMapping.status === "Active" ? "সক্রিয় (Active)" : "নিষ্ক্রিয় (Inactive)"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEditModal(activeMapping);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>সম্পাদনা করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SAFE DELETE CONFIRMATION                                           */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && activeMapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/30 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">একাডেমিক ম্যাপিং ডিলিট নিশ্চিতকরণ</h3>
                <p className="text-[11px] text-slate-400">
                  নিচের ম্যাপিং রেকর্ডটি স্থায়ীভাবে মুছে ফেলা বা নিষ্ক্রিয় করার পূর্বে যাচাই করুন।
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">শ্রেণি ও শিক্ষাবর্ষ:</span>
                <span className="font-bold text-white">
                  {activeMapping.className} ({activeMapping.academicYear})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">শাখা ও ট্রেড:</span>
                <span className="font-bold text-white">
                  শাখা {activeMapping.section} · {activeMapping.tradeName || "সাধারণ"}
                </span>
              </div>
            </div>

            {/* Reference Dependency Warning */}
            {usageCheck && usageCheck.referenced ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>হিস্টোরিক্যাল ডাটা ডিপেনডেন্সি বিদ্যমান!</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-200/90">
                  এই ম্যাপিংয়ের অধীনে <strong>{usageCheck.studentCount} জন শিক্ষার্থী</strong> এবং <strong>{usageCheck.attendanceCount}টি ক্লাসের হাজিরা রেকর্ড</strong> সংরক্ষিত রয়েছে।
                  হিস্টোরিক্যাল রেজাল্ট বা রিপোর্ট যাতে বিনষ্ট না হয়, সেজন্য এটিকে ডিলিট না করে <strong>&apos;নিষ্ক্রিয় (Deactivate)&apos;</strong> করার সুপারিশ করা হলো।
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                এই ম্যাপিংয়ের অধীনে কোনো শিক্ষার্থী বা হাজিরা রেকর্ড সংরক্ষিত নেই। এটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা নিরাপদ।
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                বাতিল
              </button>

              {usageCheck?.referenced ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleStatus(activeMapping);
                      setIsDeleteModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20"
                  >
                    নিষ্ক্রিয় করুন (নিরাপদ)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmDelete(true)}
                    disabled={isSubmitting}
                    className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 font-bold text-xs"
                  >
                    স্থায়ীভাবে ডিলিট
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "মুছে ফেলা হচ্ছে..." : "স্থায়ীভাবে মুছুন"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
