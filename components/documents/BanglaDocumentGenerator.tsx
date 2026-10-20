"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FileText,
  Award,
  Printer,
  Sparkles,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  Search,
  BookOpen,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  History,
  Palette,
  ExternalLink,
  Info,
  Users,
  Plus,
  Trash2,
  Edit3,
  XCircle,
  Copy,
  Download,
  AlertTriangle,
  RotateCcw,
  Check,
  Layers,
  Lock,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import DigitalSeal from "./DigitalSeal";
import AcademicFilterBar, {
  AcademicFilterState,
  ACADEMIC_CLASSES,
  ACADEMIC_TRADES,
} from "@/components/common/AcademicFilterBar";
import {
  Student,
  GeneratedDocument,
  DocumentType,
  DocumentTemplate,
  DocumentSignatory,
  DocumentStatus,
} from "@/lib/database";
import {
  BANGLA_DOCUMENT_THEMES,
  DOCUMENT_TYPE_LABELS,
  DocumentThemeConfig,
  DEFAULT_SIGNATORIES,
  replaceDocumentTokens,
} from "@/lib/documentsData";
import { formatDocumentNo, toBanglaDateString } from "@/lib/utils";
import { doesClassHaveTrade } from "@/lib/academicStructure";
import QRCode from "qrcode";
import * as XLSX from "xlsx";

export default function BanglaDocumentGenerator() {
  const [activeTab, setActiveTab] = useState<"generator" | "bulk" | "history" | "templates" | "audit">("generator");

  // Academic Filter for Single & Bulk
  const [filter, setFilter] = useState<AcademicFilterState>({
    department: "all",
    classId: "4", // Class 9
    tradeId: "2", // IT-IOT
    tradeCode: "IT-IOT",
    section: "A",
    session: "2026",
  });

  // Students list from API / DB
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Single Generator States
  const [documentType, setDocumentType] = useState<string>("testimonial");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("gov_classic");
  const [customMemoNo, setCustomMemoNo] = useState<string>("");
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [customBodyText, setCustomBodyText] = useState<string>("");
  const [leavingReason, setLeavingReason] = useState<string>("উচ্চতর কারিগরি শিক্ষায় ভর্তির সুবিধার্থে");
  const [principalName, setPrincipalName] = useState<string>("প্রকৌঃ মোঃ আমিনুল ইসলাম");
  const [headOfTrade, setHeadOfTrade] = useState<string>("প্রকৌঃ মোঃ তানভীর আহমেদ");
  const [verificationOfficer, setVerificationOfficer] = useState<string>("মোঃ রুহুল আমিন");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Bulk Generator States
  const [bulkSelectedStudentIds, setBulkSelectedStudentIds] = useState<number[]>([]);
  const [bulkDocType, setBulkDocType] = useState<string>("testimonial");
  const [bulkThemeId, setBulkThemeId] = useState<string>("gov_classic");
  const [bulkLeavingReason, setBulkLeavingReason] = useState<string>("উচ্চতর কারিগরি শিক্ষা গ্রহণের লক্ষ্যে");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Registry & History States
  const [historyList, setHistoryList] = useState<GeneratedDocument[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string>("all");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("all");
  const [historySearch, setHistorySearch] = useState<string>("");

  // Modals & Actions
  const [cancelModalDoc, setCancelModalDoc] = useState<GeneratedDocument | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>("");
  const [reprintModalDoc, setReprintModalDoc] = useState<GeneratedDocument | null>(null);
  const [reprintReasonInput, setReprintReasonInput] = useState<string>("পাসপোর্ট ও অফিশিয়াল ভেরিফিকেশনের জন্য পুনঃমুদ্রণ");
  const [docStatus, setDocStatus] = useState<DocumentStatus>("draft");

  // Templates Management States
  const [templatesList, setTemplatesList] = useState<DocumentTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState<Partial<DocumentTemplate>>({
    titleBangla: "",
    docType: "custom",
    code: "CRT",
    themeId: "gov_classic",
    bodyTemplate: "এই মর্মে প্রত্যয়ন করা যাইতেছে যে, {STUDENT_NAME}, পিতা: {FATHER_NAME}, মাতা: {MOTHER_NAME}, শ্রেণি: {CLASS_NAME}, ট্রেড: {TRADE_NAME}, শিক্ষাবর্ষ: {SESSION}...",
    conductStatement: "তাহার আচরণ সন্তোষজনক এবং শৃঙ্খলা পরিপন্থী কোনো কাজে জড়িত ছিল না।",
  });

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  const documentCanvasRef = useRef<HTMLDivElement>(null);

  // Fetch Students based on Filter
  useEffect(() => {
    let url = `/api/students?classId=${filter.classId}&status=all`;
    if (filter.tradeId && filter.tradeId !== "all") {
      url += `&tradeId=${filter.tradeId}`;
    }
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.items) {
          setStudents(data.items);
          if (data.items.length > 0) {
            setSelectedStudent(data.items[0]);
            setBulkSelectedStudentIds(data.items.map((s: Student) => s.id));
          } else {
            setSelectedStudent(null);
            setBulkSelectedStudentIds([]);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [filter.classId, filter.tradeId, filter.section]);

  // Fetch Documents History
  const fetchHistory = () => {
    fetch("/api/documents")
      .then((res) => (res.ok && res.headers.get("content-type")?.includes("application/json") ? res.json() : null))
      .then((json) => {
        if (json && json.success && json.documents) {
          setHistoryList(json.documents);
        }
      })
      .catch((err) => console.error(err));
  };

  // Fetch Templates
  const fetchTemplates = () => {
    fetch("/api/documents/templates")
      .then((res) => (res.ok && res.headers.get("content-type")?.includes("application/json") ? res.json() : null))
      .then((json) => {
        if (json && json.success && json.templates) {
          setTemplatesList(json.templates);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchHistory();
    fetchTemplates();
  }, []);

  // Auto-calculated Memo No with user override
  const autoMemoNo = useMemo(() => {
    const config = DOCUMENT_TYPE_LABELS[documentType] || DOCUMENT_TYPE_LABELS.testimonial;
    const serial = 100 + historyList.length + 1;
    return formatDocumentNo(config.code, filter.session || "2026", serial);
  }, [documentType, filter.session, historyList.length]);

  const activeMemoNo = customMemoNo || autoMemoNo;

  // Auto-generated formal Bengali phrasing with user override
  const autoBodyText = useMemo(() => {
    if (!selectedStudent) return "";
    const config = DOCUMENT_TYPE_LABELS[documentType] || DOCUMENT_TYPE_LABELS.testimonial;
    return replaceDocumentTokens(config.defaultBodyTemplate, selectedStudent, {
      memoNo: activeMemoNo,
      issueDate,
      leavingReason,
      passingYear: filter.session || "2026",
    });
  }, [selectedStudent, documentType, activeMemoNo, issueDate, leavingReason, filter.session]);

  const activeBodyText = customBodyText !== "" ? customBodyText : autoBodyText;

  // Generate QR Code data URL
  useEffect(() => {
    const verificationUrl = typeof window !== "undefined"
      ? `${window.location.origin}/verify?doc=${encodeURIComponent(activeMemoNo)}`
      : `https://tsc.panchagarh.gov.bd/verify?doc=${encodeURIComponent(activeMemoNo)}`;

    QRCode.toDataURL(verificationUrl, { width: 140, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
      .then((url: string) => setQrCodeDataUrl(url))
      .catch((err: any) => console.error(err));
  }, [activeMemoNo]);

  // Selected Theme Config
  const currentTheme =
    BANGLA_DOCUMENT_THEMES.find((t) => t.id === selectedThemeId) || BANGLA_DOCUMENT_THEMES[0];

  // Active Signatories Array
  const currentSignatories: DocumentSignatory[] = useMemo(
    () => [
      {
        id: "sig_officer",
        title: "যাচাইকৃত",
        name: verificationOfficer,
        designation: "অফিস সহকারী কাম কম্পিউটার অপারেটর",
        institutionName: "পঞ্চগড় সরকারি টিএসসি",
        isVisible: true,
      },
      {
        id: "sig_head",
        title: "বিভাগীয় প্রধান / ট্রেড ইন-চার্জ",
        name: headOfTrade,
        designation: "চীফ ইন্সট্রাক্টর",
        institutionName: "পঞ্চগড় সরকারি টিএসসি",
        isVisible: true,
      },
      {
        id: "sig_principal",
        title: "অধ্যক্ষ",
        name: principalName,
        designation: "অধ্যক্ষ (ভারপ্রাপ্ত)",
        institutionName: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
        isVisible: true,
      },
    ],
    [verificationOfficer, headOfTrade, principalName]
  );

  // Save Single Document
  const handleSaveDocument = async (status: DocumentStatus = "issued") => {
    if (!selectedStudent) {
      setToastMessage({ type: "error", msg: "অনুগ্রহ করে একজন শিক্ষার্থী নির্বাচন করুন।" });
      return;
    }

    try {
      const payload = {
        studentId: selectedStudent.id,
        docType: documentType,
        theme: selectedThemeId,
        generatedBy: `${principalName} (অধ্যক্ষ)`,
        remarks: "প্রাতিষ্ঠানিক রেকর্ড অনুযায়ী যাচাইকৃত ও অনুমোদিত",
        customBodyText: activeBodyText,
        customMemoNo: activeMemoNo,
        leavingReason,
        passingYear: filter.session,
        issueDate,
        signatories: currentSignatories,
        status,
      };

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setDocStatus(status);
        setToastMessage({
          type: "success",
          msg: `সনদপত্র সফলভাবে ${status === "issued" ? "ইস্যু ও রেজিস্ট্রিভুক্ত" : "ড্রাফট হিসেবে সংরক্ষিত"} হয়েছে! স্মারক নং: ${json.document.docNumber}`,
        });
        fetchHistory();
      } else {
        setToastMessage({ type: "error", msg: json.error || "সংরক্ষণ ব্যর্থ হয়েছে।" });
      }
    } catch (err: any) {
      setToastMessage({ type: "error", msg: err.message });
    }
  };

  // Export PDF using html2pdf.js
  const handleDownloadPdf = async () => {
    if (!documentCanvasRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = documentCanvasRef.current;
      const opt = {
        margin: [6, 6, 6, 6] as [number, number, number, number],
        filename: `PTSC_Document_${selectedStudent?.roll || "Student"}_${activeMemoNo.replace(/[\/\\:]/g, "_")}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      };

      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf().set(opt).from(element).save();
      setToastMessage({ type: "success", msg: "অফিশিয়াল সনদপত্র PDF সফলভাবে ডাউনলোড হয়েছে!" });
    } catch (err: any) {
      console.error(err);
      setToastMessage({ type: "error", msg: "PDF তৈরি করতে সমস্যা হয়েছে।" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Bulk Generator Action
  const handleBulkGenerate = async () => {
    if (bulkSelectedStudentIds.length === 0) {
      setToastMessage({ type: "error", msg: "বাল্ক জেনারেশনের জন্য কমপক্ষে একজন শিক্ষার্থী সিলেক্ট করুন।" });
      return;
    }

    setIsBulkProcessing(true);
    try {
      const res = await fetch("/api/documents/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: bulkSelectedStudentIds,
          docType: bulkDocType,
          theme: bulkThemeId,
          leavingReason: bulkLeavingReason,
          generatedBy: `${principalName} (অধ্যক্ষ)`,
          issueDate,
          signatories: currentSignatories,
          status: "issued",
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMessage({
          type: "success",
          msg: `${json.count} জন শিক্ষার্থীর জন্য সনদপত্র সফলভাবে ইস্যু করা হয়েছে!`,
        });
        fetchHistory();
        setActiveTab("history");
      } else {
        setToastMessage({ type: "error", msg: json.error || "বাল্ক অপারেশন ব্যর্থ হয়েছে।" });
      }
    } catch (e: any) {
      setToastMessage({ type: "error", msg: e.message });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Re-print Action
  const handleConfirmReprint = async () => {
    if (!reprintModalDoc) return;

    try {
      const res = await fetch(`/api/documents/${reprintModalDoc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reprint",
          reason: reprintReasonInput,
          performedBy: `${principalName} (অধ্যক্ষ)`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMessage({
          type: "success",
          msg: `সনদ ${reprintModalDoc.docNumber} এর পুনর্মুদ্রণ রেকর্ড সম্পন্ন হয়েছে।`,
        });
        fetchHistory();
        handleLoadFromHistory(json.document);
        setReprintModalDoc(null);
      } else {
        setToastMessage({ type: "error", msg: json.error });
      }
    } catch (err: any) {
      setToastMessage({ type: "error", msg: err.message });
    }
  };

  // Cancel Document Action
  const handleConfirmCancel = async () => {
    if (!cancelModalDoc) return;
    if (!cancelReasonInput.trim()) {
      setToastMessage({ type: "error", msg: "বাতিলকরণের কারণ লিখুন।" });
      return;
    }

    try {
      const res = await fetch(`/api/documents/${cancelModalDoc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          reason: cancelReasonInput,
          performedBy: `${principalName} (অধ্যক্ষ)`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMessage({
          type: "success",
          msg: `স্মারক নং ${cancelModalDoc.docNumber} বাতিল করা হয়েছে।`,
        });
        fetchHistory();
        setCancelModalDoc(null);
        setCancelReasonInput("");
      } else {
        setToastMessage({ type: "error", msg: json.error });
      }
    } catch (err: any) {
      setToastMessage({ type: "error", msg: err.message });
    }
  };

  // Load Document from History into Single Preview
  const handleLoadFromHistory = (doc: GeneratedDocument) => {
    const matched = students.find((s) => s.id === doc.studentId);
    if (matched) setSelectedStudent(matched);
    setDocumentType(doc.docType);
    setSelectedThemeId(doc.theme);
    setCustomMemoNo(doc.docNumber);
    setIssueDate(doc.issueDate);
    if (doc.customBodyText) setCustomBodyText(doc.customBodyText);
    setDocStatus(doc.status);
    if (doc.signatories && doc.signatories.length >= 3) {
      setVerificationOfficer(doc.signatories[0].name);
      setHeadOfTrade(doc.signatories[1].name);
      setPrincipalName(doc.signatories[2].name);
    }
    setActiveTab("generator");
    setToastMessage({
      type: "info",
      msg: `পূর্ববর্তী নথি ${doc.docNumber} প্রিভিউতে লোড করা হয়েছে।`,
    });
  };

  // Export History to Excel
  const handleExportHistoryExcel = () => {
    const exportData = historyList.map((d) => ({
      "স্মারক নং": d.docNumber,
      "নথির ধরন": d.docTypeBangla,
      স্ট্যাটাস: d.status,
      "পুনর্মুদ্রণ সংখ্যা": d.reprintCount || 0,
      "স্টুডেন্ট আইডি": d.studentCode,
      "শিক্ষার্থীর নাম": d.studentNameBangla || d.studentName,
      শ্রেণি: d.className,
      ট্রেড: doesClassHaveTrade(d.className) ? d.tradeNameBangla || d.tradeName || "ট্রেড নির্বাচন করা হয়নি" : "ট্রেড নেই",
      রোল: d.roll,
      "ইস্যুর তারিখ": d.issueDateBangla || d.issueDate,
      অনুমোদনকারী: d.generatedBy,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Document Registry");
    XLSX.writeFile(wb, `PTSC_Official_Documents_Registry_2026.xlsx`);
    setToastMessage({ type: "success", msg: "নথি রেজিস্ট্রি সফলভাবে Excel ফাইলে ডাউনলোড হয়েছে!" });
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    return historyList.filter((d) => {
      if (historyFilter !== "all" && d.docType !== historyFilter) return false;
      if (historyStatusFilter !== "all" && d.status !== historyStatusFilter) return false;
      if (historySearch) {
        const q = historySearch.toLowerCase();
        return (
          d.docNumber.toLowerCase().includes(q) ||
          d.studentName.toLowerCase().includes(q) ||
          (d.studentNameBangla && d.studentNameBangla.includes(q)) ||
          d.studentCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [historyList, historyFilter, historyStatusFilter, historySearch]);

  // Aggregate Audit Trail
  const aggregatedAuditLogs = useMemo(() => {
    const logs: any[] = [];
    historyList.forEach((d) => {
      if (d.auditLogs) {
        d.auditLogs.forEach((l) => {
          logs.push({ ...l, docNumber: d.docNumber, docType: d.docTypeBangla, studentName: d.studentNameBangla || d.studentName });
        });
      }
    });
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return logs;
  }, [historyList]);

  return (
    <div id="bangla-document-generator" className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition-all shadow-lg ${
            toastMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
              : toastMessage.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
              : "bg-blue-50 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {toastMessage.type === "info" && <Info className="w-4 h-4 text-blue-600" />}
            {toastMessage.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{toastMessage.msg}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="hover:opacity-75 cursor-pointer font-bold px-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Award className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>সার্টিফিকেট ও প্রাতিষ্ঠানিক সনদপত্র ব্যবস্থাপনা</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Phase 19 Enterprise
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                প্রশংসাপত্র, প্রত্যয়নপত্র, ছাড়পত্র (TC), চারিত্রিক সনদ, মেধা পুরস্কার এবং কিউআর ভেরিফাইড প্রাতিষ্ঠানিক নথি
              </p>
            </div>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveTab("generator")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "generator"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              সনদপত্র স্টুডিও
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "bulk"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              বাল্ক জেনারেটর
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              নথি রেজিস্ট্রি ({historyList.length})
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "templates"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              টেমপ্লেট ম্যানেজার
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "audit"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              অডিট লগ
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: SINGLE CERTIFICATE GENERATOR & LIVE A4 CANVAS */}
      {/* ============================================================== */}
      {activeTab === "generator" && (
        <div className="space-y-6">
          {/* Global Academic Filter Hierarchy Bar */}
          <AcademicFilterBar filter={filter} onChange={setFilter} showDepartment={true} />

          {/* Configuration and Controls Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 no-print">
            {/* Column 1: Student Selection */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>১. শিক্ষার্থী নির্বাচন ({students.length})</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Roll Sorted</span>
              </h3>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {students.map((stu) => (
                  <div
                    key={stu.id}
                    onClick={() => {
                      setSelectedStudent(stu);
                      setCustomBodyText("");
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedStudent?.id === stu.id
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-950 dark:text-indigo-200 font-bold shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate pr-1">{stu.nameBangla || stu.name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 shrink-0">
                        রোল {stu.roll}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">{stu.studentId}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Document Type */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>২. নথির ধরন ও টেমপ্লেট</span>
              </h3>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {Object.keys(DOCUMENT_TYPE_LABELS).map((typeKey) => {
                  const item = DOCUMENT_TYPE_LABELS[typeKey];
                  return (
                    <button
                      key={typeKey}
                      onClick={() => {
                        setDocumentType(typeKey);
                        setCustomBodyText("");
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        documentType === typeKey
                          ? "bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-200 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="truncate pr-1">{item.bn}</span>
                      <span className="font-mono text-[10px] uppercase text-slate-400 shrink-0">{item.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 3: Themes / Border Styles */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Palette className="w-4 h-4 text-emerald-600" />
                <span>৩. সনদপত্রের অফিশিয়াল থিম</span>
              </h3>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {BANGLA_DOCUMENT_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedThemeId === theme.id
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="truncate">{theme.nameBangla}</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate">{theme.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Column 4: Memo No & Signatories */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>৪. স্মারক নং ও স্বাক্ষরকারী</span>
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">স্মারক নং:</label>
                <input
                  type="text"
                  value={activeMemoNo}
                  onChange={(e) => setCustomMemoNo(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-indigo-700 dark:text-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">ইস্যুর তারিখ:</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">অধ্যক্ষের নাম:</label>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">বিভাগীয় প্রধান:</label>
                <input
                  type="text"
                  value={headOfTrade}
                  onChange={(e) => setHeadOfTrade(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>
            </div>
          </div>

          {/* EDITABLE BODY TEXT AREA */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 no-print">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>সনদের মূল বক্তব্যের বিবরণ (প্রয়োজনে সম্পাদনাযোগ্য):</span>
              </label>
              <button
                onClick={() => setCustomBodyText("")}
                className="text-[11px] font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ডিফল্ট বয়ানে রিসেট</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={activeBodyText}
              onChange={(e) => setCustomBodyText(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs leading-relaxed focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* ACTION BUTTONS TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 no-print">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span>নির্বাচিত শিক্ষার্থী:</span>
              <span className="text-slate-900 dark:text-white font-black">
                {selectedStudent ? `${selectedStudent.nameBangla || selectedStudent.name} (রোল ${selectedStudent.roll})` : "কেউ নয়"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSaveDocument("draft")}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ড্রাফট সংরক্ষণ</span>
              </button>

              <button
                onClick={() => handleSaveDocument("issued")}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>অফিশিয়াল ইস্যু ও রেজিস্ট্রি</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className={`w-3.5 h-3.5 ${isGeneratingPdf ? "animate-bounce" : ""}`} />
                <span>{isGeneratingPdf ? "PDF তৈরি হচ্ছে..." : "PDF ডাউনলোড"}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>
          </div>

          {/* LIVE A4 DOCUMENT PREVIEW CANVAS (PRINT READY) */}
          <div className="bg-slate-200 dark:bg-slate-950 p-4 sm:p-8 rounded-3xl flex justify-center overflow-x-auto print:p-0 print:bg-white">
            <div
              ref={documentCanvasRef}
              id="printable-official-document"
              className={`w-[210mm] min-h-[297mm] p-12 bg-white text-slate-900 shadow-2xl relative flex flex-col justify-between print:shadow-none print:w-full print:min-h-screen ${currentTheme.borderStyle} ${currentTheme.fontFamily}`}
            >
              {/* Institutional Watermark in background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                <div className="w-96 h-96 rounded-full border-8 border-slate-800 flex items-center justify-center text-center p-8">
                  <div className="text-4xl font-black font-serif uppercase tracking-widest text-slate-800 dark:text-slate-200 leading-tight">
                    PTSC <br /> PANCHAGARH <br /> EIIN: 132244
                  </div>
                </div>
              </div>

              {/* Digital Verified Seal */}
              {docStatus === "issued" && (
                <div className="absolute bottom-10 right-10 z-50">
                  <DigitalSeal />
                </div>
              )}

              {/* TOP INSTITUTIONAL HEADER */}
              <div className="relative z-10 space-y-2 border-b-2 border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  {/* Bangladesh National Emblem */}
                  <div className="w-16 h-16 rounded-full border-2 border-emerald-700 p-1 flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 shrink-0">
                    <div className="text-center font-bold text-[9px] text-emerald-900 leading-tight">
                      গণপ্রজাতন্ত্রী বাংলাদেশ
                    </div>
                  </div>

                  {/* Header Titles */}
                  <div className="text-center space-y-1 flex-1 px-4">
                    <div className="text-xs font-serif font-bold text-slate-700 dark:text-slate-300 tracking-wide">
                      গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
                    </div>
                    <div className="text-[11px] font-serif text-slate-600 dark:text-slate-400">
                      কারিগরি শিক্ষা অধিদপ্তর • শিক্ষা মন্ত্রণালয়
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 font-serif">
                      পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
                    </h1>
                    <div className="text-xs font-serif text-slate-700 dark:text-slate-300 font-semibold">
                      Panchagarh Government Technical School & College (PTSC)
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      EIIN: ১৩২২৪৪ • প্রতিষ্ঠান কোড: ১৮০১৭ • পঞ্চগড় সদর, পঞ্চগড়
                    </div>
                  </div>

                  {/* BTEB / TSC Emblem */}
                  <div className="w-16 h-16 rounded-full border-2 border-indigo-700 p-1 flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 shrink-0">
                    <div className="text-center font-bold text-[9px] text-indigo-900 leading-tight">
                      BTEB <br /> কোড: ১৮০১৭
                    </div>
                  </div>
                </div>
              </div>

              {/* MEMO NUMBER AND DATE ROW */}
              <div className="relative z-10 flex items-center justify-between text-xs font-serif font-bold pt-3 pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                <div className="font-mono">
                  স্মারক নং: <span className="text-indigo-900 font-black">{activeMemoNo}</span>
                </div>
                <div>
                  তারিখ:{" "}
                  <span className="font-mono">{toBanglaDateString(issueDate)}</span> ({issueDate})
                </div>
              </div>

              {/* DOCUMENT TITLE BADGE */}
              <div className="relative z-10 text-center py-5">
                <div className="inline-block px-8 py-2 rounded-2xl border-2 border-slate-800 text-lg font-black font-serif uppercase tracking-wider bg-slate-50 dark:bg-slate-950 shadow-xs">
                  {DOCUMENT_TYPE_LABELS[documentType]?.bn || "সনদপত্র"}
                </div>
              </div>

              {/* STUDENT FORMAL CREDENTIALS LEDGER */}
              {selectedStudent && (
                <div className="relative z-10 my-2 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-y-2 gap-x-6 text-xs font-serif">
                  <div>
                    <span className="font-bold text-slate-600 dark:text-slate-400">শিক্ষার্থীর নাম:</span>{" "}
                    <span className="font-black text-slate-900 dark:text-slate-100">
                      {selectedStudent.nameBangla || selectedStudent.name}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 dark:text-slate-400">স্টুডেন্ট আইডি:</span>{" "}
                    <span className="font-mono font-bold text-indigo-900">{selectedStudent.studentId}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 dark:text-slate-400">পিতার নাম:</span>{" "}
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedStudent.fatherName || "মোঃ রফিকুল ইসলাম"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 dark:text-slate-400">মাতার নাম:</span>{" "}
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedStudent.motherName || "মোছাঃ রোকেয়া বেগম"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 dark:text-slate-400">শ্রেণি ও শাখা:</span>{" "}
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedStudent.className} (শাখা {selectedStudent.section || "A"})
                    </span>
                  </div>
                  {doesClassHaveTrade(selectedStudent.classId || selectedStudent.className) ? (
                    <div>
                      <span className="font-bold text-slate-600 dark:text-slate-400">কারিগরি ট্রেড:</span>{" "}
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedStudent.tradeNameBangla || selectedStudent.tradeName || "ট্রেড নির্বাচন করা হয়নি"}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-slate-600 dark:text-slate-400">বিভাগ:</span>{" "}
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        প্রাক-ভোকেশনাল (ট্রেড নেই)
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-slate-600 dark:text-slate-400">শ্রেণি রোল:</span>{" "}
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedStudent.roll}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 dark:text-slate-400">শিক্ষাবর্ষ / সেশন:</span>{" "}
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedStudent.session}</span>
                  </div>
                </div>
              )}

              {/* MAIN BODY PARAGRAPH */}
              <div className="relative z-10 py-5 text-sm font-serif leading-loose text-justify indent-8 text-slate-900 dark:text-slate-100">
                {activeBodyText}
              </div>

              {/* SPECIAL STATEMENT / CONDUCT */}
              <div className="relative z-10 text-xs font-serif leading-relaxed text-slate-700 dark:text-slate-300 italic border-l-4 border-slate-400 pl-4 my-2">
                &ldquo;{DOCUMENT_TYPE_LABELS[documentType]?.conductStatement || "অত্র বিদ্যালয়ের নথি ও রেজিস্টার বই অনুসারে তাহার পাঠ্যকালীন আচরণ সন্তোষজনক ছিল এবং সে কখনোই রাষ্ট্রবিরোধী বা কোনো ধরনের শৃঙ্খলা পরিপন্থী কার্যকলাপে জড়িত ছিল না।"}&rdquo;
              </div>

              {/* BOTTOM VERIFICATION & OFFICIAL SIGNATURE BLOCKS */}
              <div className="relative z-10 pt-12 mt-auto">
                <div className="grid grid-cols-4 items-end gap-4 text-center font-serif text-xs">
                  {/* QR Code Verification */}
                  <div className="flex flex-col items-center justify-center">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="Security QR Code"
                        className="w-20 h-20 border border-slate-300 dark:border-slate-700 p-1 bg-white dark:bg-slate-900 rounded-lg shadow-xs"
                      />
                    ) : (
                      <div className="w-20 h-20 border flex items-center justify-center text-[10px] text-slate-400">
                        QR Code
                      </div>
                    )}
                    <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 mt-1">অনলাইন যাচাইযোগ্য</span>
                  </div>

                  {/* Signatory 1: Verification Officer */}
                  <div>
                    <div className="border-b border-dashed border-slate-500 pb-1 mb-1 font-medium text-[11px] text-slate-800 dark:text-slate-200">
                      {verificationOfficer}
                    </div>
                    <div className="font-bold text-[11px] text-slate-700 dark:text-slate-300">অফিস সহকারী</div>
                    <div className="text-[9px] text-slate-400">পিজিটিএসসি</div>
                  </div>

                  {/* Signatory 2: Head of Trade / Dept */}
                  <div>
                    <div className="border-b border-dashed border-slate-500 pb-1 mb-1 font-bold text-[11px] text-slate-900 dark:text-slate-100">
                      {headOfTrade}
                    </div>
                    <div className="font-bold text-[11px] text-slate-700 dark:text-slate-300">বিভাগীয় প্রধান</div>
                    <div className="text-[9px] text-slate-400">পঞ্চগড় সরকারি টিএসসি</div>
                  </div>

                  {/* Signatory 3: Principal */}
                  <div>
                    <div className="border-b-2 border-slate-800 pb-1 mb-1 font-black text-xs text-slate-950">
                      {principalName}
                    </div>
                    <div className="font-black text-xs text-slate-900 dark:text-slate-100">অধ্যক্ষ</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                      পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: BULK CERTIFICATE GENERATOR */}
      {/* ============================================================== */}
      {activeTab === "bulk" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>বাল্ক সনদপত্র ও নথি জেনারেটর (Bulk Certificate Studio)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              একটি নির্দিষ্ট শ্রেণি বা ট্রেডের সকল শিক্ষার্থীর জন্য একসাথে স্বয়ংক্রিয় স্মারক নম্বর সহ প্রশংসাপত্র বা প্রত্যয়নপত্র তৈরি করুন।
            </p>
          </div>

          <AcademicFilterBar filter={filter} onChange={setFilter} showDepartment={true} />

          {/* Bulk Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">নথির ধরন নির্বাচন:</label>
              <select
                value={bulkDocType}
                onChange={(e) => setBulkDocType(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl font-bold"
              >
                {Object.keys(DOCUMENT_TYPE_LABELS).map((k) => (
                  <option key={k} value={k}>
                    {DOCUMENT_TYPE_LABELS[k].bn} ({DOCUMENT_TYPE_LABELS[k].code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">সনদের বর্ডার থিম:</label>
              <select
                value={bulkThemeId}
                onChange={(e) => setBulkThemeId(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl font-bold"
              >
                {BANGLA_DOCUMENT_THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameBangla}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ইস্যুর তারিখ:</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Student Multi-Select Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <span>শিক্ষার্থী তালিকা ({students.length} জনের মধ্যে {bulkSelectedStudentIds.length} জন নির্বাচিত)</span>
              </h3>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setBulkSelectedStudentIds(students.map((s) => s.id))}
                  className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-lg font-bold hover:bg-indigo-100 cursor-pointer"
                >
                  সবাইকে নির্বাচন করুন
                </button>
                <button
                  onClick={() => setBulkSelectedStudentIds([])}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg font-bold hover:bg-slate-200 cursor-pointer"
                >
                  বাতিল করুন
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b text-slate-600 dark:text-slate-300 font-bold text-[11px]">
                  <tr>
                    <th className="p-3 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={students.length > 0 && bulkSelectedStudentIds.length === students.length}
                        onChange={(e) => {
                          if (e.target.checked) setBulkSelectedStudentIds(students.map((s) => s.id));
                          else setBulkSelectedStudentIds([]);
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 w-20 text-center">রোল</th>
                    <th className="p-3">শিক্ষার্থীর নাম</th>
                    <th className="p-3">স্টুডেন্ট আইডি</th>
                    <th className="p-3">পিতার নাম</th>
                    <th className="p-3">শ্রেণি ও ট্রেড</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map((stu) => {
                    const isSelected = bulkSelectedStudentIds.includes(stu.id);
                    return (
                      <tr
                        key={stu.id}
                        onClick={() => {
                          if (isSelected) setBulkSelectedStudentIds((prev) => prev.filter((id) => id !== stu.id));
                          else setBulkSelectedStudentIds((prev) => [...prev, stu.id]);
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-indigo-50/50 dark:bg-indigo-950/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) setBulkSelectedStudentIds((prev) => prev.filter((id) => id !== stu.id));
                              else setBulkSelectedStudentIds((prev) => [...prev, stu.id]);
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-600">{stu.roll}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {stu.nameBangla || stu.name}
                        </td>
                        <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{stu.studentId}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{stu.fatherName || "—"}</td>
                        <td className="p-3">
                          <span>{stu.className}</span>
                          <span className="text-slate-400 block text-[10px]">
                            {doesClassHaveTrade(stu.className) ? stu.tradeNameBangla || stu.tradeName : "প্রাক-ভোকেশনাল"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              onClick={handleBulkGenerate}
              disabled={isBulkProcessing || bulkSelectedStudentIds.length === 0}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isBulkProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>বাল্ক প্রক্রিয়াকরণ চলছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{bulkSelectedStudentIds.length} জনের সনদপত্র একসাথে ইস্যু করুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ISSUED DOCUMENTS REGISTRY & HISTORY */}
      {/* ============================================================== */}
      {activeTab === "history" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <span>ইস্যুকৃত প্রাতিষ্ঠানিক সনদ ও নথির রেজিস্ট্রি (Official Documents Registry)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                স্মারক নম্বর ট্র্যাকিং, পুনর্মুদ্রণ (Reprint) ইতিহাস এবং কিউআর কোড অনলাইন ভেরিফিকেশন
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportHistoryExcel}
                className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>রেজিস্ট্রি এক্সেল (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="স্মারক নং, নাম বা আইডি দিয়ে খুঁজুন..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-hidden"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">নথির ধরন:</span>
                <select
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="all">সকল ধরন</option>
                  {Object.keys(DOCUMENT_TYPE_LABELS).map((k) => (
                    <option key={k} value={k}>
                      {DOCUMENT_TYPE_LABELS[k].bn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">স্ট্যাটাস:</span>
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="all">সকল স্ট্যাটাস</option>
                  <option value="issued">ইস্যুকৃত (Issued)</option>
                  <option value="draft">ড্রাফট (Draft)</option>
                  <option value="cancelled">বাতিলকৃত (Cancelled)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Registry Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                <tr>
                  <th className="p-3 w-44">স্মারক নং (Memo No)</th>
                  <th className="p-3 w-36">নথির ধরন</th>
                  <th className="p-3">শিক্ষার্থীর নাম ও আইডি</th>
                  <th className="p-3">শ্রেণি ও ট্রেড</th>
                  <th className="p-3 text-center">স্ট্যাটাস</th>
                  <th className="p-3">ইস্যু তারিখ</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredHistory.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-cyan-400">
                      <div>{doc.docNumber}</div>
                      {doc.reprintCount && doc.reprintCount > 0 ? (
                        <span className="text-[9px] font-sans font-semibold text-amber-600 dark:text-amber-400 block">
                          কপি #{doc.reprintCount + 1} (Reprinted)
                        </span>
                      ) : null}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {doc.docTypeBangla}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {doc.studentNameBangla || doc.studentName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{doc.studentCode} (রোল: {doc.roll})</div>
                    </td>
                    <td className="p-3">
                      <div>{doc.className}</div>
                      <div className="text-[10px] text-slate-400">
                        {doesClassHaveTrade(doc.className)
                          ? doc.tradeNameBangla || doc.tradeName || "ট্রেড নির্বাচন করা হয়নি"
                          : "ট্রেড নেই (প্রাক-ভোকেশনাল)"}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.status === "issued"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : doc.status === "cancelled"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {doc.status === "issued" ? "ইস্যুকৃত" : doc.status === "cancelled" ? "বাতিল" : "ড্রাফট"}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{doc.issueDate}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleLoadFromHistory(doc)}
                          className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-cyan-400 hover:bg-indigo-100 rounded-lg text-xs font-bold"
                          title="প্রিভিউ ও প্রিন্ট"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setReprintModalDoc(doc)}
                          className="p-1.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 hover:bg-amber-100 rounded-lg text-xs font-bold"
                          title="পুনর্মুদ্রণ (Reprint Log)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={`/verify?doc=${encodeURIComponent(doc.docNumber)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-xs font-bold"
                          title="অনলাইন কিউআর যাচাই"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </a>

                        {doc.status !== "cancelled" && (
                          <button
                            onClick={() => setCancelModalDoc(doc)}
                            className="p-1.5 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-lg text-xs font-bold"
                            title="সনদ বাতিল করুন"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: TEMPLATES STUDIO / MANAGER */}
      {/* ============================================================== */}
      {activeTab === "templates" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>প্রাতিষ্ঠানিক সনদ টেমপ্লেট স্টুডিও (Document Templates Manager)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                নতুন সনদের কাঠামো তৈরি করুন এবং ডাইনামিক ফিল্ড ({`{STUDENT_NAME}`}, {`{CLASS_NAME}`}, {`{GPA}`}) কাস্টমাইজ করুন।
              </p>
            </div>

            <button
              onClick={() => setIsCreatingTemplate(!isCreatingTemplate)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreatingTemplate ? "ফর্ম বন্ধ করুন" : "নতুন টেমপ্লেট যোগ করুন"}</span>
            </button>
          </div>

          {/* New / Edit Template Form */}
          {isCreatingTemplate && (
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in">
              <h4 className="font-black text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                নতুন প্রাতিষ্ঠানিক টেমপ্লেট কনফিগারেশন
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold mb-1">টেমপ্লেটের নাম (বাংলায়):</label>
                  <input
                    type="text"
                    value={newTemplateData.titleBangla || ""}
                    onChange={(e) => setNewTemplateData({ ...newTemplateData, titleBangla: e.target.value })}
                    placeholder="যেমন: বিশেষ বৃত্তি ও মেধা সনদপত্র"
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">নথির কোড (Memo Code):</label>
                  <input
                    type="text"
                    value={newTemplateData.code || ""}
                    onChange={(e) => setNewTemplateData({ ...newTemplateData, code: e.target.value })}
                    placeholder="যেমন: SCH / MRT"
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">বর্ডার থিম:</label>
                  <select
                    value={newTemplateData.themeId || "gov_classic"}
                    onChange={(e) => setNewTemplateData({ ...newTemplateData, themeId: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl"
                  >
                    {BANGLA_DOCUMENT_THEMES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameBangla}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-xs mb-1">মূল বক্তব্য খসড়া (Body Template):</label>
                <textarea
                  rows={4}
                  value={newTemplateData.bodyTemplate || ""}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, bodyTemplate: e.target.value })}
                  className="w-full p-3 bg-white dark:bg-slate-800 border rounded-xl text-xs leading-relaxed"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-bold">সহজলভ্য ডাইনামিক ফিল্ডসমূহ:</span>
                  {[
                    "{STUDENT_NAME}",
                    "{FATHER_NAME}",
                    "{MOTHER_NAME}",
                    "{ROLL}",
                    "{STUDENT_ID}",
                    "{CLASS_NAME}",
                    "{TRADE_NAME}",
                    "{SESSION}",
                    "{GPA}",
                    "{DOB}",
                    "{LEAVING_REASON}",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() =>
                        setNewTemplateData({
                          ...newTemplateData,
                          bodyTemplate: (newTemplateData.bodyTemplate || "") + ` ${chip} `,
                        })
                      }
                      className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold hover:bg-indigo-100"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingTemplate(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newTemplateData.titleBangla || !newTemplateData.bodyTemplate) {
                      setToastMessage({ type: "error", msg: "শিরোনাম ও বয়ান পূরণ করুন।" });
                      return;
                    }
                    try {
                      const res = await fetch("/api/documents/templates", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(newTemplateData),
                      });
                      const json = await res.json();
                      if (json.success) {
                        setToastMessage({ type: "success", msg: "টেমপ্লেট সফলভাবে সংরক্ষিত হয়েছে।" });
                        fetchTemplates();
                        setIsCreatingTemplate(false);
                      }
                    } catch (e: any) {
                      setToastMessage({ type: "error", msg: e.message });
                    }
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  টেমপ্লেট সংরক্ষণ করুন
                </button>
              </div>
            </div>
          )}

          {/* Templates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templatesList.map((tpl) => (
              <div
                key={tpl.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                      {tpl.code}
                    </span>
                    {tpl.isSystemDefault && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        সিস্টেম ডিফল্ট
                      </span>
                    )}
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">{tpl.titleBangla}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{tpl.bodyTemplate}</p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setDocumentType(tpl.docType);
                      setSelectedThemeId(tpl.themeId || "gov_classic");
                      setCustomBodyText(tpl.bodyTemplate);
                      setActiveTab("generator");
                    }}
                    className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>এই টেমপ্লেটে সনদ বানান</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: SECURITY AUDIT TRAIL */}
      {/* ============================================================== */}
      {activeTab === "audit" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <span>সনদপত্র অডিট ও নিরাপত্তা ট্রেইল (Certificate Audit Trail & History)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              কে কখন সনদ তৈরি, ইস্যু, পুনর্মুদ্রণ (Reprint) বা বাতিল করেছে তার সম্পূর্ণ টাইমস্ট্যাম্পযুক্ত বিবরণী
            </p>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {aggregatedAuditLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        log.action === "issued"
                          ? "bg-emerald-100 text-emerald-800"
                          : log.action === "cancelled"
                          ? "bg-rose-100 text-rose-800"
                          : log.action === "reprinted"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{log.docNumber}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-bold text-slate-900 dark:text-white">{log.studentName}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{log.details}</p>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                  <div>{new Date(log.timestamp).toLocaleDateString("bn-BD")}</div>
                  <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                  <div className="text-slate-500 dark:text-slate-400 font-sans text-[10px]">{log.performedBy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REPRINT CONFIRMATION & LOG */}
      {/* ============================================================== */}
      {reprintModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">সনদ পুনর্মুদ্রণ (Reprint Log)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">স্মারক: {reprintModalDoc.docNumber}</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-xs text-amber-900 dark:text-amber-200">
              পুনর্মুদ্রণে মূল সনদের অফিসিয়াল নম্বর পরিবর্তন হবে না। এটি কপি #{(reprintModalDoc.reprintCount || 0) + 2} হিসেবে রেজিস্ট্রিভুক্ত হবে।
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300">পুনর্মুদ্রণের সুনির্দিষ্ট কারণ:</label>
              <textarea
                rows={2}
                value={reprintReasonInput}
                onChange={(e) => setReprintReasonInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReprintModalDoc(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={handleConfirmReprint}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
              >
                পুনর্মুদ্রণ সম্পন্ন ও প্রিন্ট ভিউ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CANCEL CERTIFICATE */}
      {/* ============================================================== */}
      {cancelModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">সনদপত্র বাতিলকরণ (Cancel Certificate)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">স্মারক: {cancelModalDoc.docNumber}</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-xs text-rose-900 dark:text-rose-200">
              সতর্কতা: একবার বাতিল করা হলে অনলাইন কিউআর ভেরিফিকেশনে এই নথিটি "বাতিলকৃত" হিসেবে প্রদর্শিত হবে।
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300">বাতিল করার অফিশিয়াল কারণ:</label>
              <textarea
                rows={3}
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="যেমন: ভুল নাম সংশোধন পূর্বক নতুন সনদ ইস্যুর কারণে পূর্ববর্তী নথি বাতিল..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalDoc(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold cursor-pointer"
              >
                ফিরে যান
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
              >
                নিশ্চিত বাতিল করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
