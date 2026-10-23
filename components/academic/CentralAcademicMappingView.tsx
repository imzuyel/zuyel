"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Sparkles,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Calendar,
  Building2,
  Cpu,
  GraduationCap,
  ShieldCheck,
  Check,
  X,
  Info,
  Clock,
  ArrowRight,
  Database,
  Lock,
} from "lucide-react";
import {
  AcademicMappingRecord,
  AcademicProgramRecord,
  ClassMasterRecord,
  TradeMasterRecord,
  AcademicYearRecord,
  MasterDataSnapshot,
} from "@/lib/masterDataEngine";

export default function CentralAcademicMappingView() {
  const [snapshot, setSnapshot] = useState<MasterDataSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form State for New Mapping
  const [formYear, setFormYear] = useState<string>("2026");
  const [formProgramCode, setFormProgramCode] = useState<string>("SSC_VOC");
  const [formClassNumeric, setFormClassNumeric] = useState<number>(9);
  const [formTradeId, setFormTradeId] = useState<string>("101");
  const [formSection, setFormSection] = useState<string>("A");
  const [formShift, setFormShift] = useState<string>("FIRST_SHIFT");
  const [formCapacity, setFormCapacity] = useState<number>(50);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot(selectedYear);
  }, [selectedYear]);

  // Derived options from snapshot
  const programs = snapshot?.programs || [];
  const classes = snapshot?.classes || [];
  const trades = snapshot?.trades || [];
  const academicYears = snapshot?.academicYears || [];
  const mappings = snapshot?.mappings || [];

  // When Program changes in Form, auto-adjust Class
  const availableClassesForSelectedProgram = useMemo(() => {
    const prog = programs.find((p) => p.code === formProgramCode);
    if (!prog) return classes;
    return classes.filter((c) => prog.applicableClassNumerics.includes(c.numericValue));
  }, [programs, classes, formProgramCode]);

  // Sync Class if not within available program classes
  useEffect(() => {
    if (availableClassesForSelectedProgram.length > 0) {
      const isCurrentClassValid = availableClassesForSelectedProgram.some(
        (c) => c.numericValue === formClassNumeric
      );
      if (!isCurrentClassValid) {
        setFormClassNumeric(availableClassesForSelectedProgram[0].numericValue);
      }
    }
  }, [availableClassesForSelectedProgram, formClassNumeric]);

  // Is trade applicable for currently selected class in form?
  const isTradeApplicableForForm = useMemo(() => {
    return formClassNumeric >= 9;
  }, [formClassNumeric]);

  // Real-time Duplicate / Conflict Detector
  const duplicateConflict = useMemo(() => {
    const tradeKey = isTradeApplicableForForm ? formTradeId : "0";
    const secKey = formSection.trim().toUpperCase();
    const shiftKey = formShift.trim();

    return mappings.find(
      (m) =>
        m.academicYear === formYear &&
        m.classNumeric === formClassNumeric &&
        (m.tradeId ? String(m.tradeId) : "0") === tradeKey &&
        m.section.trim().toUpperCase() === secKey &&
        m.shift.trim() === shiftKey
    );
  }, [mappings, formYear, formClassNumeric, formTradeId, isTradeApplicableForForm, formSection, formShift]);

  // Filtered Mappings for display table
  const filteredMappings = useMemo(() => {
    let result = mappings;

    if (programFilter !== "all") {
      result = result.filter((m) => m.programCode === programFilter);
    }

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
          m.programName.toLowerCase().includes(q) ||
          (m.tradeName && m.tradeName.toLowerCase().includes(q)) ||
          (m.tradeCode && m.tradeCode.toLowerCase().includes(q)) ||
          m.section.toLowerCase().includes(q) ||
          m.shiftNameBangla.toLowerCase().includes(q)
      );
    }

    return result;
  }, [mappings, programFilter, classFilter, statusFilter, searchQuery]);

  // Toggle active status
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
        setToast({
          type: "success",
          message: `ম্যাপিং ${mapping.className} (${mapping.tradeName || "সাধারণ"}) সফলভাবে ${
            targetStatus === "Active" ? "সক্রিয়" : "নিষ্ক্রিয়"
          } করা হয়েছে।`,
        });
        fetchSnapshot(selectedYear);
      } else {
        setToast({ type: "error", message: data.error || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।" });
      }
    } catch {
      setToast({ type: "error", message: "নেটওয়ার্ক ত্রুটি ঘটেছে।" });
    }
  };

  // Submit New Mapping
  const handleSubmitMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateConflict) {
      setToast({ type: "error", message: "একই সমন্বয়ে পূর্বেই একটি ম্যাপিং বিদ্যমান রয়েছে!" });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/academic/master-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_mapping",
          payload: {
            academicYear: formYear,
            programCode: formProgramCode,
            classNumeric: formClassNumeric,
            tradeId: isTradeApplicableForForm ? Number(formTradeId) : null,
            section: formSection,
            shift: formShift,
            capacity: formCapacity,
            status: "Active",
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setToast({ type: "success", message: "নতুন একাডেমিক ম্যাপিং সফলভাবে যুক্ত হয়েছে।" });
        setIsCreateModalOpen(false);
        fetchSnapshot(formYear);
      } else {
        setToast({ type: "error", message: data.error || "ম্যাপিং যুক্ত করতে সমস্যা হয়েছে।" });
      }
    } catch {
      setToast({ type: "error", message: "ম্যাপিং সংরক্ষণ ব্যর্থ হয়েছে।" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/20 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>কেন্দ্রীয় একাডেমিক ম্যাপিং ফাউন্ডেশন (Single Source of Truth)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              একাডেমিক প্রোগ্রাম, শ্রেণি ও কারিগরি ট্রেড ম্যাপিং হাব
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              নির্দিষ্ট শিক্ষাবর্ষে কোন প্রোগ্রাম, শ্রেণি, কারিগরি ট্রেড এবং শাখা চালু থাকবে তা এখান থেকে নির্ধারিত হয়।
              উপস্থিতি, ফলাফল, রুটিন এবং ফি মডিউল স্বয়ংক্রিয়ভাবে এই ম্যাপিং অনুসরণ করে।
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchSnapshot(selectedYear)}
              disabled={loading}
              title="রিফ্রেশ করুন"
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            </button>

            <button
              onClick={() => {
                setFormYear(selectedYear);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ম্যাপিং তৈরি করুন</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-indigo-500/20 text-xs">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold block">সক্রিয় শিক্ষাবর্ষ</span>
            <span className="text-sm font-black text-white mt-0.5 block">{selectedYear}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold block">মোট প্রোগ্রাম</span>
            <span className="text-sm font-black text-cyan-400 mt-0.5 block">{programs.length} টি স্ট্রিম</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold block">অনুমোদিত শ্রেণি কাঠামো</span>
            <span className="text-sm font-black text-indigo-300 mt-0.5 block">৬ষ্ঠ থেকে ১২শ শ্রেণি</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold block">মোট সক্রিয় ম্যাপিং</span>
            <span className="text-sm font-black text-emerald-400 mt-0.5 block">
              {mappings.filter((m) => m.status === "Active").length} টি ক্লাস-ট্রেড ইউনিট
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-semibold">
          {/* Year Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">শিক্ষাবর্ষ (Session)</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              {academicYears.map((y) => (
                <option key={y.id} value={y.name}>
                  {y.name} {y.isCurrent ? "★ (চলতি সক্রিয়)" : `(${y.status})`}
                </option>
              ))}
            </select>
          </div>

          {/* Program Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">প্রোগ্রাম (Program)</label>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="all">সকল প্রোগ্রাম ({programs.length})</option>
              {programs.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.nameBangla}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">শ্রেণি (Class)</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="all">সকল শ্রেণি (৬ষ্ঠ - ১২শ)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.numericValue}>
                  {c.nameBangla}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">স্ট্যাটাস (Status)</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="all">সকল স্ট্যাটাস</option>
              <option value="Active">সক্রিয় (Active)</option>
              <option value="Inactive">নিষ্ক্রিয় (Inactive)</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">মেনু বা ট্রেড অনুসন্ধান</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নাম বা কোড খুঁজুন..."
                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Academic Mappings Data Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              নির্ধারিত একাডেমিক ম্যাপিং সূচি ({filteredMappings.length} টি রেকর্ড)
            </h3>
          </div>

          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>সেশন {selectedYear} সক্রিয়</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">প্রোগ্রাম</th>
                <th className="py-3 px-4">শ্রেণি</th>
                <th className="py-3 px-4">কারিগরি ট্রেড / বিশেষায়ন</th>
                <th className="py-3 px-4 text-center">শাখা</th>
                <th className="py-3 px-4 text-center">শিফট</th>
                <th className="py-3 px-4 text-center">আসন সংখ্যা</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
              {filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-bold text-slate-400">কোনো একাডেমিক ম্যাপিং পাওয়া যায়নি</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      ফিল্টার পরিবর্তন করুন অথবা &apos;নতুন ম্যাপিং তৈরি করুন&apos; বাটনে ক্লিক করুন।
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMappings.map((m) => {
                  const isPreVoc = m.classNumeric <= 8;
                  const isActive = m.status === "Active";

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Program */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            m.programCode === "PRE_VOC"
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                              : m.programCode === "SSC_VOC"
                              ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                              : "bg-teal-500/10 text-teal-300 border-teal-500/20"
                          }`}
                        >
                          {m.programName}
                        </span>
                      </td>

                      {/* Class */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">{m.className}</div>
                        <span className="text-[10px] text-slate-400 font-mono">Class {m.classNumeric}</span>
                      </td>

                      {/* Trade */}
                      <td className="py-3 px-4">
                        {isPreVoc ? (
                          <span className="text-slate-500 text-[11px] italic font-medium">
                            সাধারণ কারিগরি ভিত্তি (ট্রেড প্রযোজ্য নয়)
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            <span className="font-bold text-white">{m.tradeName}</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
                              {m.tradeCode}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Section */}
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-white font-bold text-[11px]">
                          শাখা {m.section}
                        </span>
                      </td>

                      {/* Shift */}
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400">
                        {m.shiftNameBangla}
                      </td>

                      {/* Capacity */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                        {m.capacity} টি
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isActive
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-slate-800 text-slate-500 border-slate-700"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-slate-500"}`} />
                          <span>{isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(m)}
                          title={
                            isActive
                              ? "নিষ্ক্রিয় করুন (পূর্বে সংরক্ষিত শিক্ষার্থীদের ডাটা অক্ষত থাকবে)"
                              : "পুনরায় সক্রিয় করুন"
                          }
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            isActive
                              ? "bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 border border-slate-700"
                              : "bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900"
                          }`}
                        >
                          {isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                        </button>
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
      {/* MODAL: CREATE NEW ACADEMIC MAPPING WITH LIVE DEPENDENT VALIDATION        */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">নতুন একাডেমিক ম্যাপিং তৈরি করুন</h3>
                  <p className="text-[11px] text-slate-400">
                    শিক্ষাবর্ষ, প্রোগ্রাম, শ্রেণি, কারিগরি ট্রেড ও শাখার সমন্বয় নির্ধারণ করুন।
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitMapping} className="p-5 space-y-4 text-xs font-semibold">
              {/* Conflict / Duplicate Alert */}
              {duplicateConflict && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">সতর্কতা: ম্যাপিং পূর্বেই বিদ্যমান</span>
                    <span className="text-[11px]">
                      একই শিক্ষাবর্ষ ({formYear}), শ্রেণি ({formClassNumeric}), ট্রেড এবং শাখায় পূর্বেই ম্যাপিং রয়েছে।
                    </span>
                  </div>
                </div>
              )}

              {/* Academic Year */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">১. শিক্ষাবর্ষ (Academic Year)</label>
                <select
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.name}>
                      {y.name} {y.isCurrent ? "★ (চলতি শিক্ষাবর্ষ)" : `(${y.status})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Program & Class Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">২. একাডেমিক প্রোগ্রাম</label>
                  <select
                    value={formProgramCode}
                    onChange={(e) => setFormProgramCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.code}>
                        {p.nameBangla}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">৩. প্রযোজ্য শ্রেণি</label>
                  <select
                    value={formClassNumeric}
                    onChange={(e) => setFormClassNumeric(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    {availableClassesForSelectedProgram.map((c) => (
                      <option key={c.id} value={c.numericValue}>
                        {c.nameBangla}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trade Selection (Conditional) */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  ৪. কারিগরি ভোকেশনাল ট্রেড
                </label>
                {isTradeApplicableForForm ? (
                  <select
                    value={formTradeId}
                    onChange={(e) => setFormTradeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    {trades.map((t) => (
                      <option key={t.id} value={t.id}>
                        ট্রেড {t.tradeNumber}: {t.nameBangla} ({t.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-[11px] flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>৬ষ্ঠ - ৮ম শ্রেণি প্রাক-ভোকেশনাল; কোনো বিশেষায়িত ট্রেড প্রযোজ্য নয়।</span>
                  </div>
                )}
              </div>

              {/* Section, Shift, Capacity Row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">৫. শাখা</label>
                  <select
                    value={formSection}
                    onChange={(e) => setFormSection(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="A">শাখা A</option>
                    <option value="B">শাখা B</option>
                    <option value="C">শাখা C</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">৬. শিফট</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="FIRST_SHIFT">১ম শিফট</option>
                    <option value="SECOND_SHIFT">২য় শিফট</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">৭. আসন সক্ষমতা</label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                >
                  বাতিল
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !!duplicateConflict}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
