"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Sliders,
  Users,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  FileText,
  Activity,
  History,
  Info,
  Calendar,
  Lock,
  RefreshCw,
  Search,
  Check,
  ChevronRight,
  Sparkles,
  Download,
  Eye,
  X,
  TrendingDown,
  ShieldAlert
} from "lucide-react";
import * as XLSX from "xlsx";
import { ACADEMIC_CLASSES, ALL_TRADES, COMMON_SUBJECTS_9_12 } from "@/lib/academicStructure";
import { institutionalDb } from "@/lib/database";

export default function QuizEligibilityEngine() {
  const [activeSubTab, setActiveSubTab] = useState<"batch" | "policies" | "exceptions" | "audit">("batch");
  
  // Loading & Data States
  const [loading, setLoading] = useState<boolean>(false);
  const [policies, setPolicies] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Query States for Batch
  const [selectedClass, setSelectedClass] = useState<string>("4"); // Default Class 9
  const [selectedSection, setSelectedSection] = useState<string>("A");
  const [selectedTrade, setSelectedTrade] = useState<string>("101"); // Default IT Support
  const [selectedQuiz, setSelectedQuiz] = useState<string>("quiz-1");
  const [decisions, setDecisions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, eligible: 0, notEligible: 0, exception: 0, override: 0 });

  // Filtering & Search
  const [statusFilter, setStatusFilter] = useState<"all" | "eligible" | "not_eligible" | "exception" | "override">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Detailed Student Modal State
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    decision: any | null;
    student: any | null;
  }>({
    isOpen: false,
    decision: null,
    student: null
  });

  // Quiz Choices
  const quizzes = [
    { id: "quiz-1", title: "Electrical Circuits & Ohm's Law (Midterm)" },
    { id: "quiz-2", title: "IT Support & Networking Basics (Evaluation)" },
    { id: "quiz-3", title: "General Knowledge Technical Quiz 2026" }
  ];

  // Forms States
  const [newPolicy, setNewPolicy] = useState({
    name: "",
    description: "",
    type: "attendance_percentage",
    scope: "global",
    scopeId: "",
    minAttendancePercentage: 75,
    calculationWindow: "current_academic_year",
    subjectSpecific: false,
    priority: 1
  });

  const [newException, setNewException] = useState({
    studentId: "",
    scope: "global",
    scopeId: "",
    effectiveDate: "2026-01-01",
    expiryDate: "2026-12-31",
    approvedBy: "",
    reason: "",
    reference: ""
  });

  // Override Dialog State
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    studentId: number | null;
    studentName: string;
    originalDecision: string;
    newDecision: string;
    reason: string;
    reference: string;
  }>({
    isOpen: false,
    studentId: null,
    studentName: "",
    originalDecision: "",
    newDecision: "ELIGIBLE",
    reason: "",
    reference: ""
  });

  // Success / Error Alert
  const [alert, setAlert] = useState<{ message: string; type: "success" | "error" | null }>({ message: "", type: null });

  const showAlert = (message: string, type: "success" | "error") => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: null }), 4000);
  };

  // Fetch Policies
  const fetchPolicies = async () => {
    try {
      const res = await fetch("/api/eligibility?action=get_policies");
      const json = await res.json();
      if (json.success) {
        setPolicies(json.policies);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Exceptions
  const fetchExceptions = async () => {
    try {
      const res = await fetch("/api/eligibility?action=get_exceptions");
      const json = await res.json();
      if (json.success) {
        setExceptions(json.exceptions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/eligibility?action=get_audit_logs");
      const json = await res.json();
      if (json.success) {
        setAuditLogs(json.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Calculated Decisions for chosen context
  const fetchDecisions = async () => {
    setLoading(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("quiz:eligibility-calculation-started", {
        detail: { quizId: selectedQuiz, classId: selectedClass, section: selectedSection }
      }));
    }

    try {
      const params = new URLSearchParams({
        action: "check_eligibility",
        quizId: selectedQuiz,
        classId: selectedClass,
        section: selectedSection,
        tradeId: selectedTrade
      });
      const res = await fetch(`/api/eligibility?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDecisions(json.decisions || []);
        setSummary(json.summary || { total: 0, eligible: 0, notEligible: 0, exception: 0, override: 0 });

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("quiz:eligibility-calculation-completed", {
            detail: { summary: json.summary, count: json.decisions?.length }
          }));
          window.dispatchEvent(new CustomEvent("quiz:eligibility-updated", {
            detail: { timestamp: new Date().toISOString() }
          }));
        }
      } else {
        showAlert(json.error || "যোগ্যতা হিসাব করতে ব্যর্থ", "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("সার্ভার যোগাযোগ ত্রুটি", "error");
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel (Phase 14 Requirement 48)
  const handleExportToExcel = () => {
    if (decisions.length === 0) {
      showAlert("এক্সপোর্ট করার মতো কোনো ডেটা নেই", "error");
      return;
    }

    const exportData = decisions.map((dec) => {
      const student = institutionalDb.students.find(s => s.id === dec.studentId);
      const tradeName = student?.tradeId
        ? (ALL_TRADES.find(t => String(t.id) === String(student.tradeId))?.nameBangla || student.tradeId)
        : "প্রযোজ্য নয়";

      return {
        "রোল নম্বর": student?.roll || "—",
        "শিক্ষার্থীর নাম": student?.nameBangla || student?.name || "Unknown",
        "শিক্ষার্থী আইডি": student?.studentId || dec.studentId,
        "শ্রেণি": student?.className || "—",
        "শাখা": student?.section || "—",
        "কারিগরি ট্রেড": tradeName,
        "উপস্থিতি শতাংশ (%)": `${dec.attendanceContext.attendancePercentage}%`,
        "প্রয়োজনীয় শতাংশ (%)": `${dec.policyUsed.threshold}%`,
        "উপস্থিত ক্লাস": `${dec.attendanceContext.presentClasses}/${dec.attendanceContext.totalClasses}`,
        "চূড়ান্ত সিদ্ধান্ত": dec.finalDecision === "ELIGIBLE" ? "ELIGIBLE (যোগ্য)" : "NOT_ELIGIBLE (অযোগ্য)",
        "সিদ্ধান্তের কারণ": dec.decisionReason,
        "প্রযোজ্য পলিসি": dec.policyUsed.name,
        "পলিসি ভার্সন": `v${dec.policyUsed.version}`,
        "বিশেষ অব্যাহতি": dec.exceptionApplied ? `${dec.exceptionApplied.reason} (${dec.exceptionApplied.approvedBy})` : "না",
        "ম্যানুয়াল ওভাররাইড": dec.overrideApplied ? `${dec.overrideApplied.performedBy} (${dec.overrideApplied.reason})` : "না",
        "গণনার সময়": new Date(dec.calculatedAt).toLocaleString("bn-BD")
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Eligibility Report");
    XLSX.writeFile(workbook, `PTSC_Quiz_Eligibility_Report_${Date.now()}.xlsx`);
    showAlert("এক্সেল ফাইল (.xlsx) সফলভাবে ডাউনলোড হয়েছে", "success");
  };

  useEffect(() => {
    fetchPolicies();
    fetchExceptions();
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    fetchDecisions();
  }, [selectedClass, selectedSection, selectedTrade, selectedQuiz]);

  // Create Policy Handler
  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicy.name || !newPolicy.minAttendancePercentage) {
      showAlert("অনুগ্রহ করে সব প্রয়োজনীয় ক্ষেত্র পূরণ করুন", "error");
      return;
    }

    try {
      const res = await fetch("/api/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_policy",
          ...newPolicy
        })
      });
      const json = await res.json();
      if (json.success) {
        showAlert(`পলিসি [${newPolicy.name}] সফলভাবে তৈরি হয়েছে`, "success");
        setNewPolicy({
          name: "",
          description: "",
          type: "attendance_percentage",
          scope: "global",
          scopeId: "",
          minAttendancePercentage: 75,
          calculationWindow: "current_academic_year",
          subjectSpecific: false,
          priority: 1
        });
        fetchPolicies();
        fetchAuditLogs();
        fetchDecisions();
      } else {
        showAlert(json.error || "পলিসি তৈরি করা যায়নি", "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("সার্ভার ত্রুটি", "error");
    }
  };

  // Create Exemption Handler
  const handleCreateException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newException.studentId || !newException.reason || !newException.approvedBy) {
      showAlert("সব ক্ষেত্র পূরণ করুন", "error");
      return;
    }

    try {
      const res = await fetch("/api/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_exception",
          ...newException
        })
      });
      const json = await res.json();
      if (json.success) {
        showAlert("বিশেষ অব্যাহতি সফলভাবে অনুমোদিত হয়েছে", "success");
        setNewException({
          studentId: "",
          scope: "global",
          scopeId: "",
          effectiveDate: "2026-01-01",
          expiryDate: "2026-12-31",
          approvedBy: "",
          reason: "",
          reference: ""
        });
        fetchExceptions();
        fetchAuditLogs();
        fetchDecisions();
      } else {
        showAlert(json.error || "ব্যতিক্রম যোগ করা যায়নি", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Override Handler
  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModal.reason) {
      showAlert("ম্যানুয়াল পরিবর্তনের সুনির্দিষ্ট কারণ উল্লেখ করুন", "error");
      return;
    }

    try {
      const res = await fetch("/api/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_override",
          studentId: overrideModal.studentId,
          quizId: selectedQuiz,
          originalDecision: overrideModal.originalDecision,
          newDecision: overrideModal.newDecision,
          reason: overrideModal.reason,
          reference: overrideModal.reference,
          performedBy: "মোহাম্মদ শাহজাহান (ট্রেড ইনস্ট্রাক্টর)"
        })
      });
      const json = await res.json();
      if (json.success) {
        showAlert("শিক্ষার্থীর যোগ্যতা ম্যানুয়ালি পরিবর্তন সম্পন্ন হয়েছে (অডিটেড)", "success");
        setOverrideModal({
          isOpen: false,
          studentId: null,
          studentName: "",
          originalDecision: "",
          newDecision: "ELIGIBLE",
          reason: "",
          reference: ""
        });
        fetchAuditLogs();
        fetchDecisions();
      } else {
        showAlert(json.error || "যোগ্যতা পরিবর্তন করা যায়নি", "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("সার্ভার ত্রুটি", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
      
      {/* Top Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl shadow-indigo-950/10">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-xl shadow-rose-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full">
              Phase 14 Engine
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1.5">
              অ্যাডভান্সড কুইজ উপস্থিতি যোগ্যতা নির্ধারণ ইঞ্জিন
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) বিধিমালায় কুইজ ও মূল্যায়নে অংশগ্রহণের স্বয়ংক্রিয় গেটওয়ে
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchPolicies();
            fetchExceptions();
            fetchAuditLogs();
            fetchDecisions();
            showAlert("সব তথ্য পুনঃসংযোজন করা হয়েছে", "success");
          }}
          className="relative px-4 py-2 text-xs font-semibold rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800 text-slate-300 transition-all flex items-center gap-2 hover:bg-slate-700/50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>রিফ্রেশ ও পুনঃগণনা</span>
        </button>
      </div>

      {/* Quick Status Bar */}
      {alert.type && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200 ${
            alert.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          }`}
        >
          {alert.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-bold no-print">
        <button
          onClick={() => setActiveSubTab("batch")}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "batch"
              ? "border-rose-500 text-rose-600 dark:text-rose-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>শিক্ষার্থী যোগ্যতা রিপোর্ট ({summary.total})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("policies")}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "policies"
              ? "border-rose-500 text-rose-600 dark:text-rose-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>হাজিরা পলিসি কনফিগারেশন ({policies.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("exceptions")}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "exceptions"
              ? "border-rose-500 text-rose-600 dark:text-rose-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>বিশেষ অব্যাহতি ও এক্সেপশন ({exceptions.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("audit")}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "audit"
              ? "border-rose-500 text-rose-600 dark:text-rose-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <History className="w-4 h-4" />
          <span>অডিট ও অ্যাক্টিভিটি ট্রেইল ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Batch Calculator */}
      {activeSubTab === "batch" && (
        <div className="space-y-6">
          {/* Filters Context Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-rose-500" />
              <span>একাডেমিক কনটেক্সট ফিল্টার (Academic Authorization Context)</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Academic Year */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">শিক্ষাবর্ষ</label>
                <select className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-medium outline-none">
                  <option value="2026">২০২৬ সেশন</option>
                </select>
              </div>

              {/* Class */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">শ্রেণি</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-medium outline-none"
                >
                  {ACADEMIC_CLASSES.map(c => (
                    <option key={c.id} value={c.id}>{c.nameBangla}</option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">শাখা</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-medium outline-none"
                >
                  <option value="A">A শাখা</option>
                  <option value="B">B শাখা</option>
                </select>
              </div>

              {/* Trade (If Class >= 9) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">কারিগরি ট্রেড</label>
                <select
                  value={selectedTrade}
                  disabled={Number(selectedClass) < 4}
                  onChange={(e) => setSelectedTrade(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-medium outline-none disabled:opacity-40"
                >
                  <option value="0">ট্রেড প্রযোজ্য নয় (Pre-Vocational)</option>
                  {ALL_TRADES.filter(t => t.applicableClass === (Number(selectedClass) + 5)).map(t => (
                    <option key={t.id} value={t.id}>{t.nameBangla}</option>
                  ))}
                </select>
              </div>

              {/* Active Quiz Target */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">লক্ষ্য কুইজ সেশন</label>
                <select
                  value={selectedQuiz}
                  onChange={(e) => setSelectedQuiz(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-rose-600 dark:text-rose-400 outline-none"
                >
                  {quizzes.map(q => (
                    <option key={q.id} value={q.id}>{q.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Summary Widgets */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-bold text-slate-400">সর্বমোট শিক্ষার্থী</span>
              <span className="text-xl sm:text-2xl font-black mt-1">{summary.total} জন</span>
            </div>
            <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/30 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">যোগ্য (Eligible)</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{summary.eligible} জন</span>
            </div>
            <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/30 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">অযোগ্য (Blocked)</span>
              <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{summary.notEligible} জন</span>
            </div>
            <div className="bg-sky-50/50 dark:bg-sky-950/10 border border-sky-200/50 dark:border-sky-900/30 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">অব্যাহতি প্রাপ্ত (Exception)</span>
              <span className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{summary.exception} জন</span>
            </div>
            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">ম্যানুয়াল ওভাররাইড (Override)</span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{summary.override} জন</span>
            </div>
          </div>

          {/* Filter, Search & Export Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === "all"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                <span>সবাই</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {summary.total}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter("eligible")}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === "eligible"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>যোগ্য</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                  {summary.eligible}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter("not_eligible")}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === "not_eligible"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100"
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>অযোগ্য</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-300">
                  {summary.notEligible}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter("exception")}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === "exception"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 hover:bg-sky-100"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>অব্যাহতি</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-300">
                  {summary.exception}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter("override")}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === "override"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>ওভাররাইড</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                  {summary.override}
                </span>
              </button>
            </div>

            {/* Search and Export Buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="নাম বা রোল দিয়ে অনুসন্ধান..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8.5 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <button
                onClick={handleExportToExcel}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                title="স্মার্ট এক্সেল ফাইল হিসেবে রিপোর্ট ডাউনলোড করুন"
              >
                <Download className="w-3.5 h-3.5" />
                <span>এক্সেল (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Student Status List Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4 bg-slate-50/30 dark:bg-slate-800/10">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  সিস্টেম অথোরিটেটিভ ফলাফল তালিকা (Authoritative Batch Result)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  সরাসরি উপস্থিতি ট্র্যাকিং এবং নীতিমালার ভিত্তিতে হিসাবকৃত কুইজ গেটওয়ে সিদ্ধান্ত
                </p>
              </div>
              <span className="text-xs font-mono bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full font-bold">
                🔒 Server Authorized Protocol Active
              </span>
            </div>

            {loading ? (
              <div className="p-16 text-center space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin text-rose-500 mx-auto" />
                <p className="text-xs font-bold text-slate-400">যোগ্যতা ইঞ্জিন স্বয়ংক্রিয়ভাবে হিসাব করছে...</p>
              </div>
            ) : decisions.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                এই একাডেমিক কনটেক্সটে কোনো সক্রিয় শিক্ষার্থী পাওয়া যায়নি।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 text-center w-16">রোল</th>
                      <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                      <th className="py-3 px-4">আইডি নম্বর</th>
                      <th className="py-3 px-4">হাজিরা শতাংশ</th>
                      <th className="py-3 px-4">প্রযোজ্য হাজিরা পলিসি</th>
                      <th className="py-3 px-4">সিদ্ধান্ত স্থিতি</th>
                      <th className="py-3 px-4">ব্যতিক্রম / কারণ ব্যাখ্যা</th>
                      <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {decisions
                      .filter((dec: any) => {
                        // Status Filter
                        if (statusFilter === "eligible" && dec.finalDecision !== "ELIGIBLE") return false;
                        if (statusFilter === "not_eligible" && dec.finalDecision !== "NOT_ELIGIBLE") return false;
                        if (statusFilter === "exception" && !dec.exceptionApplied) return false;
                        if (statusFilter === "override" && !dec.overrideApplied) return false;

                        // Search Query
                        if (searchQuery.trim()) {
                          const student = dec.studentId ? institutionalDb.students.find(s => s.id === dec.studentId) : null;
                          const q = searchQuery.toLowerCase();
                          const matchesName = student?.nameBangla?.toLowerCase().includes(q) || student?.name?.toLowerCase().includes(q);
                          const matchesRoll = String(student?.roll).includes(q);
                          const matchesId = String(student?.studentId || dec.studentId).includes(q);
                          if (!matchesName && !matchesRoll && !matchesId) return false;
                        }

                        return true;
                      })
                      .map((dec: any) => {
                        const student = dec.studentId ? institutionalDb.students.find(s => s.id === dec.studentId) : null;
                        
                        return (
                          <tr key={dec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                              {student?.roll || "—"}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {student?.nameBangla || student?.name || "Unmapped Student"}
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {student?.className} • শাখা: {student?.section}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 font-medium">
                              {student?.studentId || "—"}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold font-mono ${
                                  dec.attendanceContext.attendancePercentage >= dec.policyUsed.threshold
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }`}>
                                  {dec.attendanceContext.attendancePercentage}%
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ({dec.attendanceContext.presentClasses}/{dec.attendanceContext.totalClasses} ক্লাস)
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-slate-700 dark:text-slate-300 max-w-[150px] truncate" title={dec.policyUsed.name}>
                                {dec.policyUsed.name}
                              </div>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                ন্যূনতম: {dec.policyUsed.threshold}% (v{dec.policyUsed.version})
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {dec.finalDecision === "ELIGIBLE" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/30">
                                  <Check className="w-3 h-3" />
                                  <span>ELIGIBLE</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900/30">
                                  <XCircle className="w-3 h-3" />
                                  <span>BLOCKED</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={dec.decisionReason}>
                                {dec.decisionReason}
                              </div>
                              {dec.exceptionApplied && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-300 px-1.5 py-0.5 rounded border border-sky-100 dark:border-sky-900/30">
                                  <Info className="w-2.5 h-2.5" />
                                  <span>অব্যাহতি: {dec.exceptionApplied.reason}</span>
                                </span>
                              )}
                              {dec.overrideApplied && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/30">
                                  <Sliders className="w-2.5 h-2.5" />
                                  <span>ওভাররাইড: {dec.overrideApplied.reason}</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setDetailModal({
                                    isOpen: true,
                                    decision: dec,
                                    student: student
                                  })}
                                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                  title="সম্পূর্ণ বিস্তারিত অবজেক্ট দেখুন"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setOverrideModal({
                                    isOpen: true,
                                    studentId: dec.studentId,
                                    studentName: student?.name || "Student",
                                    originalDecision: dec.finalDecision,
                                    newDecision: dec.finalDecision === "ELIGIBLE" ? "NOT_ELIGIBLE" : "ELIGIBLE",
                                    reason: "",
                                    reference: ""
                                  })}
                                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-200 hover:border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800 text-indigo-600 dark:text-cyan-400"
                                >
                                  হস্তক্ষেপ
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Policies Configurator */}
      {activeSubTab === "policies" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Policy Creation Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-rose-500" />
              <span>নতুন কুইজ পলিসি যোগ করুন</span>
            </h3>

            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">পলিসি নাম (Bangla / English)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বিটিইবি ৭৫% সাধারণ নিয়ম"
                  value={newPolicy.name}
                  onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">পলিসি বর্ণনা</label>
                <textarea
                  placeholder="সংক্ষিপ্ত বিবরণ"
                  value={newPolicy.description}
                  onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none focus:border-rose-500 font-medium h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">পলিসি পরিধি (Scope)</label>
                  <select
                    value={newPolicy.scope}
                    onChange={(e) => setNewPolicy({ ...newPolicy, scope: e.target.value })}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none"
                  >
                    <option value="global">সারা প্রতিষ্ঠান (Global)</option>
                    <option value="class">সুনির্দিষ্ট শ্রেণি (Class)</option>
                    <option value="trade">সুনির্দিষ্ট ট্রেড (Trade)</option>
                    <option value="subject">সুনির্দিষ্ট বিষয় (Subject)</option>
                    <option value="quiz">সুনির্দিষ্ট কুইজ (Quiz)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">স্কোপ আইডি (Scope ID)</label>
                  <input
                    type="text"
                    placeholder="যেমন: Class 9, IT-901"
                    value={newPolicy.scopeId}
                    onChange={(e) => setNewPolicy({ ...newPolicy, scopeId: e.target.value })}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ন্যূনতম হাজিরা শতাংশ</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={newPolicy.minAttendancePercentage}
                    onChange={(e) => setNewPolicy({ ...newPolicy, minAttendancePercentage: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">অগ্রাধিকার স্তর (Priority)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="10"
                    value={newPolicy.priority}
                    onChange={(e) => setNewPolicy({ ...newPolicy, priority: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">গণনা উইন্ডো (Calculation Window)</label>
                <select
                  value={newPolicy.calculationWindow}
                  onChange={(e) => setNewPolicy({ ...newPolicy, calculationWindow: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none"
                >
                  <option value="current_day">চলতি দিন (Current Day)</option>
                  <option value="current_week">চলতি সপ্তাহ (Current Week)</option>
                  <option value="current_month">চলতি মাস (Current Month)</option>
                  <option value="current_academic_year">চলতি শিক্ষাবর্ষ (Full Year)</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2 font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={newPolicy.subjectSpecific}
                  onChange={(e) => setNewPolicy({ ...newPolicy, subjectSpecific: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-700 text-rose-600 focus:ring-rose-500"
                />
                <span>শুধু সংশ্লিষ্ট বিষয়ের হাজিরা গণ্য করুন</span>
              </label>

              {/* Policy Safety & Impact Preview (Phase 14 Requirement 34) */}
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>নীতিমালা নিরাপত্তা ও প্রভাব পর্যালোচনা (Impact Preview)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-400">
                  বর্তমান ক্লাসে সম্ভাব্য প্রভাবিত শিক্ষার্থী:{" "}
                  <strong className="font-mono text-amber-950 dark:text-amber-200 underline">
                    {decisions.filter(d => d.attendanceContext.attendancePercentage < newPolicy.minAttendancePercentage).length} জন
                  </strong>
                  {" "}(যাদের হাজিরা {newPolicy.minAttendancePercentage}% এর নিচে)।
                </p>
                <span className="text-[10px] block opacity-80 italic">
                  * নতুন নীতি কেবল পরবর্তী গণনায় প্রযুক্ত হবে; চলমান বা সম্পন্ন কুইজের কোনো ফলাফল প্রভাবিত হবে না।
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/10 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>পলিসি সংরক্ষণ ও কার্যকর করুন</span>
              </button>
            </form>
          </div>

          {/* Active Policies List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                বর্তমানে সক্রিয় হাজিরা নীতিসমূহ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                অগ্রাধিকার এবং পরিধি স্তরের ভিত্তিতে চালিত ইঞ্জিন
              </p>
            </div>

            <div className="space-y-4">
              {policies.map(p => (
                <div key={p.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{p.name}</span>
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 uppercase tracking-wide">
                        Priority: {p.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">{p.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-mono">
                      <span>পরিধি: <strong>{p.scope}</strong></span>
                      {p.scopeId && <span>আইডি: <strong>{p.scopeId}</strong></span>}
                      <span>গণনা উইন্ডো: <strong>{p.calculationWindow}</strong></span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-center min-w-[100px]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">ন্যূনতম হাজিরা</span>
                    <span className="text-2xl font-black text-rose-500">{p.minAttendancePercentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Exceptions / Exemptions */}
      {activeSubTab === "exceptions" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exemption Creation Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-rose-500" />
              <span>নতুন বিশেষ অব্যাহতি (Medical / Exemption)</span>
            </h3>

            <form onSubmit={handleCreateException} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">শিক্ষার্থী আইডি (Student database integer ID)</label>
                <input
                  type="number"
                  required
                  placeholder="যেমন: 101, 102"
                  value={newException.studentId}
                  onChange={(e) => setNewException({ ...newException, studentId: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ব্যতিক্রম পরিধি (Scope)</label>
                <select
                  value={newException.scope}
                  onChange={(e) => setNewException({ ...newException, scope: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none"
                >
                  <option value="global">সার্বিক অব্যাহতি (Global)</option>
                  <option value="subject">সুনির্দিষ্ট বিষয় অব্যাহতি (Subject)</option>
                  <option value="quiz">সুনির্দিষ্ট কুইজ অব্যাহতি (Quiz)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">শুরুর তারিখ</label>
                  <input
                    type="date"
                    required
                    value={newException.effectiveDate}
                    onChange={(e) => setNewException({ ...newException, effectiveDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">শেষ তারিখ</label>
                  <input
                    type="date"
                    required
                    value={newException.expiryDate}
                    onChange={(e) => setNewException({ ...newException, expiryDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">অনুমোদনকারী অ্যাডমিন / অধ্যক্ষ</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ড. এম এ রহমান (অধ্যক্ষ)"
                  value={newException.approvedBy}
                  onChange={(e) => setNewException({ ...newException, approvedBy: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">অব্যাহতির কারণ (মেডিকেল / অফিসিয়াল ছুটি)</label>
                <textarea
                  required
                  placeholder="কারণ উল্লেখ করুন..."
                  value={newException.reason}
                  onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none h-16 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">স্মারক / রেফারেন্স নং</label>
                <input
                  type="text"
                  placeholder="যেমন: MEMO-2026/899"
                  value={newException.reference}
                  onChange={(e) => setNewException({ ...newException, reference: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ব্যতিক্রম অনুমোদন করুন</span>
              </button>
            </form>
          </div>

          {/* Active Exceptions List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                অনুমোদিত সক্রিয় বিশেষ ব্যতিক্রম তালিকা
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                মেডিকেল অথবা দাপ্তরিক কারণে উপস্থিতি শিথিলপ্রাপ্ত শিক্ষার্থীদের রেজিস্টার
              </p>
            </div>

            <div className="space-y-4">
              {exceptions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  বর্তমানে কোনো সক্রিয় অব্যাহতি রেকর্ড নেই।
                </div>
              ) : (
                exceptions.map(exc => {
                  const student = institutionalDb.students.find(s => s.id === exc.studentId);
                  
                  return (
                    <div key={exc.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold text-[10px]">
                            ACTIVE
                          </span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {student?.nameBangla || student?.name || `Student ID: ${exc.studentId}`}
                          </span>
                          <span className="text-slate-400 text-xs">
                            (রোল: {student?.roll || "—"} • {student?.className})
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          রেফারেন্স: <strong>{exc.reference || "—"}</strong>
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                        {exc.reason}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-mono">
                        <span>অনুমোদনকারী: <strong>{exc.approvedBy}</strong></span>
                        <span>মেয়াদ: <strong>{exc.effectiveDate} হতে {exc.expiryDate}</strong></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Trail */}
      {activeSubTab === "audit" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <History className="w-4 h-4 text-rose-500" />
              <span>যোগ্যতা ইঞ্জিন সিকিউরিটি ও অডিট ট্রেইল</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              পলিসি পরিবর্তন, ম্যানুয়াল পরিবর্তন এবং শিক্ষক হস্তক্ষেপের সম্পূর্ণ বাস্তবভিত্তিক তালিকা (Immutable System Log)
            </p>
          </div>

          <div className="space-y-3">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-800/60/50 dark:hover:bg-slate-800/20 transition-all text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {log.eventType === "POLICY_CREATED" && <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[9px]">POLICY</span>}
                    {log.eventType === "OVERRIDE_CREATED" && <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[9px]">OVERRIDE</span>}
                    {log.eventType === "EXCEPTION_APPROVED" && <span className="p-1.5 rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold text-[9px]">EXEMPTION</span>}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{log.message}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">কর্তা: {log.performedBy}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleString("bn-BD")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Override Dialog Overlay */}
      {overrideModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-5 h-5 text-amber-500" />
                <span>শিক্ষক ম্যানুয়াল যোগ্যতা পরিবর্তন</span>
              </h3>
              <button
                onClick={() => setOverrideModal({ ...overrideModal, isOpen: false })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-bold">⚠️ সতর্কীকরণ (Security Warning):</p>
              <p>
                এই সিদ্ধান্তটি স্বয়ংক্রিয় হাজিরার চেয়ে বেশি অগ্রাধিকার পাবে। এটি সম্পূর্ণভাবে অডিট ট্রেইলে সংরক্ষিত হবে।
              </p>
            </div>

            <form onSubmit={handleApplyOverride} className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">শিক্ষার্থীর নাম</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">
                  {overrideModal.studentName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">বর্তমান অবস্থা</label>
                  <span className="block px-2.5 py-1 text-xs font-bold rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {overrideModal.originalDecision}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">নতুন অবস্থা নির্ধারণ</label>
                  <select
                    value={overrideModal.newDecision}
                    onChange={(e) => setOverrideModal({ ...overrideModal, newDecision: e.target.value })}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-bold"
                  >
                    <option value="ELIGIBLE">ELIGIBLE (অনুমোদিত)</option>
                    <option value="NOT_ELIGIBLE">BLOCKED (অনুপস্থিত)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ম্যানুয়াল পরিবর্তনের যৌক্তিক কারণ</label>
                <textarea
                  required
                  placeholder="যেমন: ক্রীড়া প্রতিযোগিতায় অংশগ্রহণকারী শিক্ষার্থী"
                  value={overrideModal.reason}
                  onChange={(e) => setOverrideModal({ ...overrideModal, reason: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none focus:border-amber-500 h-20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">অনুমোদন পত্র বা রেফারেন্স স্মারক নং</label>
                <input
                  type="text"
                  placeholder="যেমন: MEMO-2026/09"
                  value={overrideModal.reference}
                  onChange={(e) => setOverrideModal({ ...overrideModal, reference: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModal({ ...overrideModal, isOpen: false })}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>ওভাররাইড নিশ্চিত করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Student Decision Object Modal (Phase 14 Requirements 16, 17, 18, 22) */}
      {detailModal.isOpen && detailModal.decision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${
                  detailModal.decision.finalDecision === "ELIGIBLE"
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                }`}>
                  {detailModal.decision.finalDecision === "ELIGIBLE" ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <XCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {detailModal.student?.nameBangla || detailModal.student?.name || "শিক্ষার্থী"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    রোল: {detailModal.student?.roll || "—"} • শ্রেণি: {detailModal.student?.className} • শাখা: {detailModal.student?.section}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailModal({ isOpen: false, decision: null, student: null })}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Decision Status Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              detailModal.decision.finalDecision === "ELIGIBLE"
                ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                : "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
            }`}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                  সার্ভার নির্ধারিত চূড়ান্ত সিদ্ধান্ত (Final Decision)
                </span>
                <span className="text-lg font-black">{detailModal.decision.finalDecision}</span>
                <p className="text-xs mt-1 leading-relaxed">{detailModal.decision.decisionReason}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-black font-mono">
                  {detailModal.decision.attendanceContext.attendancePercentage}%
                </span>
                <span className="text-[10px] block opacity-75">
                  ন্যূনতম শর্ত: {detailModal.decision.policyUsed.threshold}%
                </span>
              </div>
            </div>

            {/* Context Grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Academic Placement Context */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-500" />
                  <span>একাডেমিক অবস্থান ও ট্রেড যাচাই</span>
                </h4>
                <div className="space-y-1 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>শিক্ষাবর্ষ:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{detailModal.decision.academicContext.academicYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>শ্রেণি ও শাখা:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      শ্রেণি {detailModal.decision.academicContext.classId}, শাখা {detailModal.decision.academicContext.section}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>কারিগরি ট্রেড:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {detailModal.decision.academicContext.tradeId || "প্রযোজ্য নয় (সাধারণ/প্রাক-ভোকেশনাল)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>শিক্ষার্থী স্থিতি:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">সক্রিয় (Active)</span>
                  </div>
                </div>
              </div>

              {/* Attendance Context */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  <span>হাজিরা গণনা ও উইন্ডো</span>
                </h4>
                <div className="space-y-1 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>মোট অনুষ্ঠিত ক্লাস:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{detailModal.decision.attendanceContext.totalClasses} টি</span>
                  </div>
                  <div className="flex justify-between">
                    <span>উপস্থিত ক্লাস:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{detailModal.decision.attendanceContext.presentClasses} টি</span>
                  </div>
                  <div className="flex justify-between">
                    <span>গণনা উইন্ডো:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{detailModal.decision.attendanceContext.window}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>বিষয়-নির্দিষ্ট হাজিরা:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {detailModal.decision.academicContext.subjectId ? `বিষয় আইডি: ${detailModal.decision.academicContext.subjectId}` : "সাধারণ হাজিরা"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolved Policy & Priority */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>প্রযুক্ত নীতি ও নির্দিষ্টতা স্কোর (MSAP Resolution)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 dark:text-slate-400">
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] block opacity-75">পলিসি নাম</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {detailModal.decision.policyUsed.name}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] block opacity-75">নীতি ভার্সন</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">v{detailModal.decision.policyUsed.version}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] block opacity-75">ন্যূনতম থ্রেশহোল্ড</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{detailModal.decision.policyUsed.threshold}%</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] block opacity-75">গণনার সময়কাল</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[10px]">
                    {new Date(detailModal.decision.calculatedAt).toLocaleTimeString("bn-BD")}
                  </span>
                </div>
              </div>
            </div>

            {/* Exceptions & Overrides where applicable */}
            {(detailModal.decision.exceptionApplied || detailModal.decision.overrideApplied) && (
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-xs space-y-2">
                <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>বিশেষ ছাড় / ম্যানুয়াল পরিবর্তন বিবরণ</span>
                </h4>
                {detailModal.decision.exceptionApplied && (
                  <p className="text-amber-800 dark:text-amber-300">
                    <strong>অনুমোদিত অব্যাহতি:</strong> {detailModal.decision.exceptionApplied.reason} (অনুমোদনকারী: {detailModal.decision.exceptionApplied.approvedBy})
                  </p>
                )}
                {detailModal.decision.overrideApplied && (
                  <p className="text-amber-800 dark:text-amber-300">
                    <strong>ম্যানুয়াল ওভাররাইড:</strong> {detailModal.decision.overrideApplied.reason} (কর্তৃক: {detailModal.decision.overrideApplied.performedBy})
                  </p>
                )}
              </div>
            )}

            {/* Action Footer */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDetailModal({ isOpen: false, decision: null, student: null })}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
