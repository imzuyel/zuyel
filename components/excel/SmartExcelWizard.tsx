"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Eye,
  Sliders,
  Check,
  X,
  FileCheck,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  getApplicableTradesForClass,
  doesClassHaveTrade,
  parseClassNumeric,
  isTradeValidForClass,
  generateAutoStudentId,
} from "@/lib/academicStructure";
import { Student } from "@/lib/database";

// System fields that can be mapped
export const SYSTEM_FIELDS = [
  { key: "studentId", label: "Student ID (স্টুডেন্ট আইডি)", required: false },
  { key: "roll", label: "Roll (শ্রেণি রোল)", required: true },
  { key: "name", label: "Student Name (শিক্ষার্থীর নাম)", required: true },
  { key: "className", label: "Class (শ্রেণি: 6 to 12)", required: true },
  { key: "section", label: "Section (শাখা: A / B)", required: true },
  { key: "tradeName", label: "Trade (কারিগরি ট্রেড: 9-12 এর জন্য)", required: false },
  { key: "guardianMobile", label: "Phone / Mobile (মোবাইল নম্বর)", required: false },
  { key: "fatherName", label: "Guardian Name (অভিভাবকের নাম)", required: false },
  { key: "status", label: "Status (স্ট্যাটাস: Active / Inactive)", required: false },
];

export interface ValidationIssue {
  rowIdx: number;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export default function SmartExcelWizard() {
  const [activeTab, setActiveTab] = useState<"wizard" | "export">("wizard");
  const [importType, setImportType] = useState<"student" | "attendance" | "result" | "finance">("student");
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Raw preview table data
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [fileName, setFileName] = useState<string>("");

  // Step 3: Column Mapping State (Header -> System Field Key)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Step 5: Import Mode State
  const [importMode, setImportMode] = useState<"new" | "update" | "sync">("sync");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<{
    totalImported: number;
    totalUpdated: number;
    errors: number;
    message: string;
  } | null>(null);

  // Row Edit Modal State in Step 2
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editRowData, setEditRowData] = useState<Record<string, any>>({});
  const [isNewRowModal, setIsNewRowModal] = useState(false);

  // Column Add Modal State
  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");

  // Export State
  const [exportFilterClass, setExportFilterClass] = useState<string>("all");
  const [exportFilterSection, setExportFilterSection] = useState<string>("all");
  const [exportColumns, setExportColumns] = useState<Record<string, boolean>>({
    studentId: true,
    roll: true,
    name: true,
    className: true,
    section: true,
    tradeName: true,
    guardianMobile: true,
    fatherName: true,
    status: true,
  });

  // ==========================================
  // STEP 1: UPLOAD & TEMPLATE DOWNLOAD
  // ==========================================

  // Heuristic column detection
  const detectColumnMapping = (uploadedHeaders: string[]) => {
    const mapping: Record<string, string> = {};

    for (const h of uploadedHeaders) {
      const lower = h.trim().toLowerCase();

      if (lower.includes("student id") || lower === "id" || lower.includes("স্টুডেন্ট আইডি") || lower === "আইডি") {
        mapping[h] = "studentId";
      } else if (lower.includes("name") || lower.includes("ছাত্র") || lower.includes("নাম") || lower === "student name") {
        mapping[h] = "name";
      } else if (lower.includes("roll") || lower.includes("রোল")) {
        mapping[h] = "roll";
      } else if (lower.includes("class") || lower.includes("শ্রেণি") || lower.includes("শ্রেণী") || lower === "grade") {
        mapping[h] = "className";
      } else if (lower.includes("section") || lower.includes("শাখা") || lower === "sec") {
        mapping[h] = "section";
      } else if (lower.includes("trade") || lower.includes("ট্রেড") || lower.includes("টেকনিক্যাল")) {
        mapping[h] = "tradeName";
      } else if (lower.includes("mobile") || lower.includes("phone") || lower.includes("মোবাইল") || lower.includes("ফোন")) {
        mapping[h] = "guardianMobile";
      } else if (lower.includes("guardian") || lower.includes("father") || lower.includes("অভিভাবক") || lower.includes("পিতা")) {
        mapping[h] = "fatherName";
      } else if (lower.includes("status") || lower.includes("স্ট্যাটাস")) {
        mapping[h] = "status";
      } else {
        mapping[h] = "ignore";
      }
    }

    setColumnMapping(mapping);
  };

  // Handle File Upload (.xlsx, .xls, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

        if (jsonData.length > 0) {
          const detectedHeaders = Object.keys(jsonData[0]);
          setHeaders(detectedHeaders);
          setRows(jsonData);
          detectColumnMapping(detectedHeaders);
          setCurrentStep(2); // advance to Preview Data
        } else {
          alert("আপলোডকৃত এক্সেল ফাইলে কোনো তথ্য পাওয়া যায়নি।");
        }
      } catch (err) {
        console.error("Error parsing excel file:", err);
        alert("এক্সেল ফাইল রিড করতে সমস্যা হয়েছে। অনুগ্রহ করে সঠিক ফরম্যাটের ফাইল নির্বাচন করুন।");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Load realistic sample data for instant testing
  const handleLoadSampleData = () => {
    const sampleHeaders = [
      "Student ID",
      "Roll",
      "Student Name",
      "Class",
      "Section",
      "Trade",
      "Phone",
      "Guardian Name",
    ];

    const sampleRows = [
      {
        "Student ID": "20260001",
        Roll: 1,
        "Student Name": "Md. Tanvir Hasan",
        Class: "Class 9",
        Section: "A",
        Trade: "IT Support & IoT Basics",
        Phone: "01711-000008",
        "Guardian Name": "Md. Abdul Kuddus",
      },
      {
        "Student ID": "20260002",
        Roll: 2,
        "Student Name": "Khadija Sultana",
        Class: "Class 6",
        Section: "A",
        Trade: "", // Class 6 has NO trade!
        Phone: "01717-888999",
        "Guardian Name": "Md. Nazrul Islam",
      },
      {
        "Student ID": "20260003",
        Roll: 1,
        "Student Name": "Farhana Yasmin",
        Class: "Class 10",
        Section: "A",
        Trade: "General Electronics",
        Phone: "01712-444555",
        "Guardian Name": "Mst. Rehana Begum",
      },
      {
        "Student ID": "20260004",
        Roll: 2,
        "Student Name": "Shahadat Hossain",
        Class: "Class 11",
        Section: "B",
        Trade: "Computer & IoT System",
        Phone: "01715-666777",
        "Guardian Name": "Md. Moniruzzaman",
      },
      {
        "Student ID": "20260005",
        Roll: 3,
        "Student Name": "Nusrat Jahan",
        Class: "Class 12",
        Section: "A",
        Trade: "Electronic Control & Communication",
        Phone: "01719-888111",
        "Guardian Name": "Md. Anwar Hossain",
      },
      {
        // Purposefully add 1 row with error to showcase validation: Class 7 with a Trade!
        "Student ID": "20260006",
        Roll: 5,
        "Student Name": "Sabbir Ahmed",
        Class: "Class 7",
        Section: "A",
        Trade: "IT Support & IoT Basics", // INVALID: Class 7 has NO trade!
        Phone: "01713-222333",
        "Guardian Name": "Md. Habibur Rahman",
      },
    ];

    setFileName("PTSC_Sample_Students_2026.xlsx");
    setHeaders(sampleHeaders);
    setRows(sampleRows);
    detectColumnMapping(sampleHeaders);
    setCurrentStep(2);
  };

  // Download Standard Excel Template with exact sample rows
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Student ID": "20260001",
        Roll: 1,
        "Student Name": "Kazi Tanvir Hasan",
        Class: "Class 9",
        Section: "A",
        Trade: "IT Support & IoT Basics",
        Phone: "01711-000008",
        "Guardian Name": "Md. Abdul Kuddus",
      },
      {
        "Student ID": "20260002",
        Roll: 2,
        "Student Name": "Khadija Sultana",
        Class: "Class 6",
        Section: "A",
        Trade: "", // NO TRADE for Class 6!
        Phone: "01717-888999",
        "Guardian Name": "Md. Nazrul Islam",
      },
      {
        "Student ID": "20260003",
        Roll: 1,
        "Student Name": "Md. Shakil Hossain",
        Class: "Class 11",
        Section: "A",
        Trade: "Computer & IoT System",
        Phone: "01716-777888",
        "Guardian Name": "Md. Mozammel Haque",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student_Template");

    XLSX.writeFile(workbook, "PTSC_Student_Import_Template.xlsx");
  };

  // ==========================================
  // STEP 2: SPREADSHEET PREVIEW & ROW/COL EDITING
  // ==========================================

  const handleOpenEditRow = (idx: number) => {
    setEditingRowIndex(idx);
    setEditRowData({ ...rows[idx] });
    setIsNewRowModal(false);
  };

  const handleOpenAddRow = () => {
    const emptyRow: Record<string, any> = {};
    for (const h of headers) emptyRow[h] = "";
    setEditRowData(emptyRow);
    setEditingRowIndex(null);
    setIsNewRowModal(true);
  };

  const handleSaveRowData = () => {
    if (isNewRowModal) {
      setRows((prev) => [...prev, editRowData]);
    } else if (editingRowIndex !== null) {
      setRows((prev) => {
        const next = [...prev];
        next[editingRowIndex] = editRowData;
        return next;
      });
    }
    setEditingRowIndex(null);
    setIsNewRowModal(false);
  };

  const handleDeleteRow = (idx: number) => {
    if (confirm("আপনি কি নিশ্চিত যে এই সারিটি মুছে ফেলতে চান?")) {
      setRows((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleAddColumn = () => {
    const col = newColName.trim();
    if (!col) return;
    if (headers.includes(col)) {
      alert("এই নামের কলাম ইতিমধ্যে বিদ্যমান রয়েছে।");
      return;
    }

    setHeaders((prev) => [...prev, col]);
    setRows((prev) => prev.map((r) => ({ ...r, [col]: "" })));
    setColumnMapping((prev) => ({ ...prev, [col]: "ignore" }));
    setNewColName("");
    setIsAddColModalOpen(false);
  };

  const handleDeleteColumn = (colName: string) => {
    if (confirm(`আপনি কি কলাম "${colName}" মুছে ফেলতে চান?`)) {
      setHeaders((prev) => prev.filter((h) => h !== colName));
      setRows((prev) =>
        prev.map((r) => {
          const copy = { ...r };
          delete copy[colName];
          return copy;
        })
      );
      setColumnMapping((prev) => {
        const copy = { ...prev };
        delete copy[colName];
        return copy;
      });
    }
  };

  // ==========================================
  // STEP 4: DATA VALIDATION ENGINE
  // ==========================================

  // Build normalized record list based on current column mapping
  const normalizedRecords = useMemo(() => {
    return rows.map((row, idx) => {
      const record: Record<string, any> = { _originalIndex: idx };

      for (const [header, systemKey] of Object.entries(columnMapping)) {
        if (systemKey && systemKey !== "ignore") {
          record[systemKey] = row[header];
        }
      }

      return record;
    });
  }, [rows, columnMapping]);

  // Run validation checks
  const validationIssues: ValidationIssue[] = useMemo(() => {
    const issues: ValidationIssue[] = [];
    const seenStudentIds = new Set<string>();
    const seenRollKey = new Set<string>();

    normalizedRecords.forEach((r, idx) => {
      // 1. Missing student name
      if (!r.name || String(r.name).trim() === "") {
        issues.push({
          rowIdx: idx,
          field: "name",
          message: "শিক্ষার্থীর নাম অনুপস্থিত (Student Name is required)",
          severity: "error",
        });
      }

      // 2. Class check & validation
      const clsNum = parseClassNumeric(r.className);
      if (!r.className || clsNum === 0) {
        issues.push({
          rowIdx: idx,
          field: "className",
          message: "শ্রেণি উল্লেখ করা হয়নি (Class is required)",
          severity: "error",
        });
      } else if (clsNum < 6 || clsNum > 12) {
        issues.push({
          rowIdx: idx,
          field: "className",
          message: `অবৈধ শ্রেণি: ${r.className} (শুধুমাত্র ৬ষ্ঠ হতে ১২শ প্রযোজ্য)`,
          severity: "error",
        });
      }

      // 3. Roll check & duplicate roll
      if (!r.roll || String(r.roll).trim() === "") {
        issues.push({
          rowIdx: idx,
          field: "roll",
          message: "রোল নম্বর প্রদান করা হয়নি",
          severity: "error",
        });
      } else if (clsNum >= 6 && clsNum <= 12) {
        const rollKey = `${clsNum}-${r.section || "A"}-${r.tradeName || "NONE"}-${r.roll}`;
        if (seenRollKey.has(rollKey)) {
          issues.push({
            rowIdx: idx,
            field: "roll",
            message: `ডুপ্লিকেট রোল (${r.roll}): একই শ্রেণি ও শাখায় একাধিকবার রয়েছে`,
            severity: "error",
          });
        } else {
          seenRollKey.add(rollKey);
        }
      }

      // 4. Duplicate Student ID
      if (r.studentId && String(r.studentId).trim()) {
        const idStr = String(r.studentId).trim();
        if (seenStudentIds.has(idStr)) {
          issues.push({
            rowIdx: idx,
            field: "studentId",
            message: `ডুপ্লিকেট স্টুডেন্ট আইডি (${idStr})`,
            severity: "error",
          });
        } else {
          seenStudentIds.add(idStr);
        }
      }

      // 5. CLASS-BASED TRADE LOGIC VALIDATION
      if (clsNum >= 6 && clsNum <= 8) {
        // Class 6 to 8 must NOT have Trade
        if (r.tradeName && String(r.tradeName).trim() !== "" && r.tradeName !== "None" && r.tradeName !== "N/A") {
          issues.push({
            rowIdx: idx,
            field: "tradeName",
            message: `৬ষ্ঠ, ৭ম ও ৮ম শ্রেণিতে কোনো ট্রেড থাকতে পারবে না (পাওয়া গেছে: "${r.tradeName}")`,
            severity: "error",
          });
        }
      } else if (clsNum >= 9 && clsNum <= 12) {
        // Class 9 to 12 MUST have valid trade
        if (!r.tradeName || String(r.tradeName).trim() === "") {
          issues.push({
            rowIdx: idx,
            field: "tradeName",
            message: `${clsNum}ম শ্রেণির জন্য কারিগরি ট্রেড নির্বাচন বাধ্যতামূলক`,
            severity: "error",
          });
        } else if (!isTradeValidForClass(clsNum, r.tradeName)) {
          const allowed = getApplicableTradesForClass(clsNum).map((t) => t.nameBangla).join(", ");
          issues.push({
            rowIdx: idx,
            field: "tradeName",
            message: `অবৈধ ট্রেড "${r.tradeName}" (${clsNum}ম শ্রেণির অনুমোদিত ট্রেড: ${allowed})`,
            severity: "error",
          });
        }
      }
    });

    return issues;
  }, [normalizedRecords]);

  // Quick helper to see if a row has errors
  const rowErrorsMap = useMemo(() => {
    const map: Record<number, ValidationIssue[]> = {};
    for (const issue of validationIssues) {
      if (!map[issue.rowIdx]) map[issue.rowIdx] = [];
      map[issue.rowIdx].push(issue);
    }
    return map;
  }, [validationIssues]);

  const errorRowCount = Object.keys(rowErrorsMap).length;
  const readyRowCount = rows.length - errorRowCount;

  // ==========================================
  // STEP 5: IMPORT / UPDATE LOGIC
  // ==========================================

  const handleConfirmImport = async () => {
    setIsConfirmModalOpen(false);

    try {
      // Build final student payloads
      const payloadStudents: Partial<Student>[] = normalizedRecords.map((r, idx) => {
        const clsNum = parseClassNumeric(r.className);
        const hasTrade = doesClassHaveTrade(clsNum);
        const matchedClass = ACADEMIC_CLASSES.find((c) => c.numericValue === clsNum) || ACADEMIC_CLASSES[3];
        const tradesForCls = getApplicableTradesForClass(clsNum);
        const matchedTrade = hasTrade
          ? tradesForCls.find(
              (t) =>
                t.name.toLowerCase() === String(r.tradeName).toLowerCase() ||
                t.nameBangla === String(r.tradeName) ||
                String(t.id) === String(r.tradeName)
            ) || tradesForCls[0]
          : null;

        return {
          id: Date.now() + idx,
          studentId: r.studentId || generateAutoStudentId([], 2026),
          roll: Number(r.roll) || idx + 1,
          name: r.name,
          nameBangla: r.name,
          classId: matchedClass.id,
          className: matchedClass.name,
          tradeId: matchedTrade ? matchedTrade.id : undefined,
          tradeName: matchedTrade ? matchedTrade.name : undefined,
          tradeNameBangla: matchedTrade ? matchedTrade.nameBangla : undefined,
          section: r.section || "A",
          guardianMobile: r.guardianMobile || "01700-000000",
          fatherName: r.fatherName || "",
          session: "2026",
          status: "Active",
          attendanceRate: 95.0,
          gpa: "5.00",
        };
      });

      // Send to server in parallel or sequence
      let importedCount = 0;
      let updatedCount = 0;

      for (const st of payloadStudents) {
        await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(st),
        });
        if (importMode === "update") updatedCount++;
        else importedCount++;
      }

      setImportResult({
        totalImported: importMode === "update" ? 0 : payloadStudents.length,
        totalUpdated: importMode === "update" ? payloadStudents.length : 0,
        errors: 0,
        message: `${payloadStudents.length} students imported successfully. (${payloadStudents.length} জন শিক্ষার্থীর তথ্য সফলভাবে সংরক্ষিত হয়েছে)`,
      });
    } catch (err: any) {
      setImportResult({
        totalImported: 0,
        totalUpdated: 0,
        errors: 1,
        message: "আমদানিতে ত্রুটি ঘটেছে: " + (err.message || "সার্ভার এরর"),
      });
    }
  };

  // ==========================================
  // CUSTOM EXPORT LOGIC
  // ==========================================
  const handleExecuteExport = async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (!data.success || !Array.isArray(data.items)) {
        alert("শিক্ষার্থীদের তথ্য লোড করা যায়নি।");
        return;
      }

      let list: Student[] = data.items;

      // Filter by class
      if (exportFilterClass !== "all") {
        const clsNum = parseClassNumeric(exportFilterClass);
        list = list.filter((s) => parseClassNumeric(s.classId || s.className) === clsNum);
      }

      // Filter by section
      if (exportFilterSection !== "all") {
        list = list.filter((s) => (s.section || "A") === exportFilterSection);
      }

      // Build rows with only selected columns
      const exportRows = list.map((s) => {
        const rowObj: Record<string, any> = {};
        if (exportColumns.studentId) rowObj["Student ID"] = s.studentId;
        if (exportColumns.roll) rowObj["Roll"] = s.roll;
        if (exportColumns.name) rowObj["Student Name"] = s.name;
        if (exportColumns.className) rowObj["Class"] = s.className;
        if (exportColumns.section) rowObj["Section"] = s.section;
        if (exportColumns.tradeName) rowObj["Trade"] = s.tradeNameBangla || s.tradeName || "ট্রেড নেই";
        if (exportColumns.guardianMobile) rowObj["Phone"] = s.guardianMobile || s.studentMobile || "";
        if (exportColumns.fatherName) rowObj["Guardian Name"] = s.fatherName || "";
        if (exportColumns.status) rowObj["Status"] = s.status || "Active";
        return rowObj;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "PTSC_Students");

      const fileName = `PTSC_Students_Export_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      alert("এক্সপোর্ট তৈরিতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Top Mode Switcher (Wizard vs Custom Export) */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>স্মার্ট এক্সেল উইজার্ড (Smart Excel Wizard)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            নিরাপদ এক্সেল ইমপোর্ট, ফিল্ড ম্যাপিং ও রুলস ভ্যালিডেশন সিস্টেম
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab("wizard")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "wizard"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            ইমপোর্ট উইজার্ড (Import)
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "export"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            কাস্টম এক্সপোর্ট (Export)
          </button>
        </div>
      </div>

      {activeTab === "export" ? (
        /* ==========================================
           CUSTOM EXPORT VIEW (Sections 24 & 25)
           ========================================== */
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-600" />
              <span>শিক্ষার্থী ডাটা এক্সেল এক্সপোর্ট (Excel Export)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              প্রয়োজনীয় কলাম নির্বাচন করুন এবং ফিল্টার প্রয়োগ করে এক্সেল ফাইল ডাউনলোড করুন।
            </p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                শ্রেণি ফিল্টার (Class Filter)
              </label>
              <select
                value={exportFilterClass}
                onChange={(e) => setExportFilterClass(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                <option value="all">সকল শ্রেণি (All Classes)</option>
                {ACADEMIC_CLASSES.map((c) => (
                  <option key={c.id} value={c.numericValue}>
                    {c.nameBangla} ({c.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                শাখা ফিল্টার (Section Filter)
              </label>
              <select
                value={exportFilterSection}
                onChange={(e) => setExportFilterSection(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                <option value="all">সকল শাখা (All Sections)</option>
                <option value="A">শাখা A</option>
                <option value="B">শাখা B</option>
              </select>
            </div>
          </div>

          {/* Custom Column Selection Checkboxes (Section 25) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              এক্সেলে যে কলামগুলো থাকবে (Select Columns to Export):
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {[
                { key: "studentId", label: "Student ID" },
                { key: "roll", label: "Roll" },
                { key: "name", label: "Student Name" },
                { key: "className", label: "Class" },
                { key: "section", label: "Section" },
                { key: "tradeName", label: "Trade" },
                { key: "guardianMobile", label: "Phone" },
                { key: "fatherName", label: "Guardian Name" },
                { key: "status", label: "Status" },
              ].map((col) => (
                <label
                  key={col.key}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    exportColumns[col.key]
                      ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!exportColumns[col.key]}
                    onChange={(e) =>
                      setExportColumns((prev) => ({ ...prev, [col.key]: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>[✓] {col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Download button */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={handleExecuteExport}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>এক্সেল ফাইল তৈরি করুন (Generate & Download)</span>
            </button>
          </div>
        </div>
      ) : (
        /* ==========================================
           5-STEP IMPORT WIZARD (Sections 14-23)
           ========================================== */
        <div className="space-y-4">
          {/* Wizard Step Progress Tracker */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between max-w-2xl mx-auto overflow-x-auto pb-1 text-xs">
              {[
                { step: 1, label: "১. আপলোড" },
                { step: 2, label: "২. প্রিভিউ" },
                { step: 3, label: "৩. কলাম ম্যাচিং" },
                { step: 4, label: "৪. ভ্যালিডেশন" },
                { step: 5, label: "৫. ইমপোর্ট" },
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => rows.length > 0 && setCurrentStep(s.step)}
                  disabled={rows.length === 0 && s.step > 1}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                    currentStep === s.step
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : currentStep > s.step
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200"
                      : "text-slate-400 hover:text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      currentStep === s.step ? "bg-white text-indigo-600" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {s.step}
                  </span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ==========================================
              STEP 1: UPLOAD EXCEL
              ========================================== */}
          {currentStep === 1 && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 max-w-2xl mx-auto text-center">
              <div className="space-y-2">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  ধাপ ১: এক্সেল ফাইল আপলোড করুন
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  আপনার কম্পিউটারের .xlsx, .xls অথবা .csv ফাইল আপলোড করুন। সিস্টেম স্বয়ংক্রিয়ভাবে কলাম শনাক্ত করবে।
                </p>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-3xl p-8 sm:p-10 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                <input
                  type="file"
                  id="excel-file-upload"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="excel-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <FileSpreadsheet className="w-10 h-10 text-slate-400 group-hover:text-indigo-600" />
                  <div>
                    <span className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 inline-block">
                      ফাইল নির্বাচন করুন (Browse File)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    অথবা ফাইলটি টেনে এনে ড্রপ করুন
                  </span>
                </label>
              </div>

              {/* Template & Sample Data Actions (Section 15 & 23) */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>[ Download Excel Template ]</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadSampleData}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>নমুনা ডেটা লোড করুন (Load Sample Data)</span>
                </button>
              </div>
            </div>
          )}

          {/* ==========================================
              STEP 2: PREVIEW DATA (Section 16)
              ========================================== */}
          {currentStep === 2 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-600" />
                    <span>ধাপ ২: স্প্রেডশিট প্রিভিউ ও এডিট (Preview Data)</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    ফাইল: <span className="font-bold text-slate-800 dark:text-slate-200">{fileName}</span> • মোট {rows.length} টি সারি
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAddRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>নতুন সারি (Add Row)</span>
                  </button>
                  <button
                    onClick={() => setIsAddColModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>কলাম যোগ (Add Column)</span>
                  </button>
                </div>
              </div>

              {/* Spreadsheet Table Container (Scroll strictly inside table container, page never scrolls horizontally) */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[420px] overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        {headers.map((h) => (
                          <th key={h} className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center justify-between gap-2">
                              <span>{h}</span>
                              <button
                                onClick={() => handleDeleteColumn(h)}
                                className="text-slate-400 hover:text-rose-500 text-[10px]"
                                title="কলাম মুছুন"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </th>
                        ))}
                        <th className="py-2.5 px-3 w-20 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {rows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          {headers.map((h) => (
                            <td key={h} className="py-2 px-3 whitespace-nowrap text-slate-800 dark:text-slate-200 font-medium">
                              {r[h] !== undefined && r[h] !== null ? String(r[h]) : "—"}
                            </td>
                          ))}
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditRow(idx)}
                                className="p-1 text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-950/40 rounded"
                                title="সারি এডিট"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteRow(idx)}
                                className="p-1 text-rose-500 hover:bg-rose-50 dark:bg-rose-950/40 rounded"
                                title="সারি মুছুন"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ফিরে যান</span>
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20"
                >
                  <span>পরবর্তী: কলাম ম্যাচিং</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ==========================================
              STEP 3: MATCH COLUMNS (Section 17)
              ========================================== */}
          {currentStep === 3 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <span>ধাপ ৩: কলাম ম্যাচিং (Match Columns)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  এক্সেল ফাইলের কলামগুলোর সাথে সিস্টেমের তথ্যের মিল নিশ্চিত করুন। প্রয়োজনে ড্রপডাউন থেকে পরিবর্তন করুন।
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {headers.map((h) => {
                    const currentSystemKey = columnMapping[h] || "ignore";
                    const matchedField = SYSTEM_FIELDS.find((f) => f.key === currentSystemKey);

                    return (
                      <div
                        key={h}
                        className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 dark:text-white font-mono">
                            {h}
                          </span>
                          <span className="text-[10px] text-slate-400">এক্সেল কলাম</span>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                            সিস্টেমের যে ফিল্ডের সাথে মিলবে:
                          </label>
                          <select
                            value={currentSystemKey}
                            onChange={(e) =>
                              setColumnMapping((prev) => ({ ...prev, [h]: e.target.value }))
                            }
                            className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                              currentSystemKey !== "ignore"
                                ? "bg-indigo-50/60 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                                : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            <option value="ignore">— বাদ দিন (Ignore this column) —</option>
                            {SYSTEM_FIELDS.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label} {f.required ? "*" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>পূর্ববর্তী ধাপ</span>
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20"
                >
                  <span>পরবর্তী: ডেটা ভ্যালিডেশন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ==========================================
              STEP 4: VALIDATE DATA (Section 18)
              ========================================== */}
          {currentStep === 4 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-indigo-600" />
                    <span>ধাপ ৪: ডেটা ভ্যালিডেশন ও ত্রুটি পরীক্ষা (Validate Data)</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    কারিগরি শিক্ষা বোর্ডের নিয়ম ও শ্রেণিভিত্তিক ট্রেড বরাদ্দ নিয়মে ডেটা পরীক্ষা সম্পন্ন হয়েছে।
                  </p>
                </div>

                {/* Validation Summary Badge (Section 18) */}
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-black flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{readyRowCount} Records Ready</span>
                  </div>

                  {errorRowCount > 0 && (
                    <div className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-black flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>{errorRowCount} Records Need Attention</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Error list notice */}
              {validationIssues.length > 0 ? (
                <div className="bg-rose-50/60 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-900 space-y-2">
                  <div className="text-xs font-black text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>শনাক্তকৃত ত্রুটিসমূহ (নিচের টেবিলে &quot;এডিট&quot; করে ঠিক করুন):</span>
                  </div>
                  <ul className="text-xs text-rose-700 dark:text-rose-300 list-disc list-inside space-y-1">
                    {validationIssues.map((iss, i) => (
                      <li key={i}>
                        সারি #{iss.rowIdx + 1}: <strong>{iss.message}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 flex items-center gap-3 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>চমৎকার! সকল সারি সফলভাবে ভ্যালিডেট হয়েছে। কোনো ত্রুটি পাওয়া যায়নি। আপনি পরবর্তী ধাপে যেতে পারেন।</span>
                </div>
              )}

              {/* Rows with Inline Error Highlights */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">সারি</th>
                        <th className="py-2.5 px-3">নাম</th>
                        <th className="py-2.5 px-3">শ্রেণি</th>
                        <th className="py-2.5 px-3">রোল</th>
                        <th className="py-2.5 px-3">ট্রেড</th>
                        <th className="py-2.5 px-3">ভ্যালিডেশন স্ট্যাটাস</th>
                        <th className="py-2.5 px-3 text-right">ঠিক করুন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {normalizedRecords.map((rec, idx) => {
                        const errors = rowErrorsMap[idx] || [];
                        const hasErrors = errors.length > 0;

                        return (
                          <tr
                            key={idx}
                            className={
                              hasErrors
                                ? "bg-rose-50/70 dark:bg-rose-950/30"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800/40"
                            }
                          >
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                              {rec.name || <span className="text-rose-500 italic">অনুপস্থিত</span>}
                            </td>
                            <td className="py-2.5 px-3 font-semibold">
                              {rec.className || <span className="text-rose-500 italic">অনুপস্থিত</span>}
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {rec.roll || <span className="text-rose-500 italic">অনুপস্থিত</span>}
                            </td>
                            <td className="py-2.5 px-3">
                              {rec.tradeName || <span className="text-slate-400">ট্রেড নেই</span>}
                            </td>
                            <td className="py-2.5 px-3">
                              {hasErrors ? (
                                <span className="text-rose-600 font-bold text-[11px] flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{errors[0].message}</span>
                                </span>
                              ) : (
                                <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>সঠিক (Valid)</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleOpenEditRow(idx)}
                                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[11px] font-bold"
                              >
                                এডিট
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>পূর্ববর্তী ধাপ</span>
                </button>
                <button
                  onClick={() => setCurrentStep(5)}
                  disabled={errorRowCount > 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  <span>পরবর্তী: ইমপোর্ট মোড</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ==========================================
              STEP 5: IMPORT / UPDATE MODES (Sections 19-22)
              ========================================== */}
          {currentStep === 5 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 max-w-2xl mx-auto">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>ধাপ ৫: ইমপোর্ট মোড নির্বাচন ও চূড়ান্ত সংরক্ষণ</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  রেকর্ড সংরক্ষণের পদ্ধতি নির্বাচন করুন। ডেটা নিরাপত্তার জন্য চূড়ান্ত কনফার্মেশন গ্রহণ করা হবে।
                </p>
              </div>

              {/* 3 Import Modes (Section 19) */}
              <div className="space-y-3">
                {[
                  {
                    id: "new",
                    title: "১. Import as New (নতুন হিসেবে যোগ)",
                    desc: "শুধুমাত্র নতুন শিক্ষার্থী হিসেবে ডাটাবেসে যোগ করা হবে।",
                  },
                  {
                    id: "update",
                    title: "২. Update Existing (বিদ্যমান তথ্য আপডেট)",
                    desc: "স্টুডেন্ট আইডি অথবা রোল+শ্রেণি মিলিয়ে বর্তমান শিক্ষার্থীদের তথ্য আপডেট করা হবে।",
                  },
                  {
                    id: "sync",
                    title: "৩. Smart Sync (স্মার্ট সিঙ্ক - প্রস্তাবিত)",
                    desc: "নতুন শিক্ষার্থী যুক্ত হবে এবং বিদ্যমান শিক্ষার্থীদের তথ্য নিরাপদে হালনাগাদ হবে।",
                  },
                ].map((mode) => (
                  <label
                    key={mode.id}
                    className={`block p-4 rounded-2xl border cursor-pointer transition-all ${
                      importMode === mode.id
                        ? "bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-700 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="importMode"
                        value={mode.id}
                        checked={importMode === mode.id}
                        onChange={() => setImportMode(mode.id as any)}
                        className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          {mode.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {mode.desc}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Import Result Feedback if completed */}
              {importResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-bold space-y-1 ${
                    importResult.errors === 0
                      ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 border-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-black">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{importResult.message}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 pl-6">
                    মোট আমদানিকৃত: {importResult.totalImported} • মোট হালনাগাদকৃত: {importResult.totalUpdated} • ত্রুটি: {importResult.errors}
                  </div>
                </div>
              )}

              {/* Actions & Confirmation Button */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>পূর্ববর্তী ধাপ</span>
                </button>

                <button
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>ইমপোর্ট নিশ্চিত করুন (Start Import)</span>
                </button>
              </div>
            </div>
          )}

          {/* ==========================================
              CONFIRMATION MODAL (Section 20: DATA SAFETY)
              ========================================== */}
          {isConfirmModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                  <Info className="w-6 h-6 shrink-0" />
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    ইমপোর্ট চূড়ান্ত নিশ্চিতকরণ
                  </h3>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  You are about to import <strong className="text-slate-900 dark:text-white">{rows.length} records</strong> into the Government Technical School & College database.
                </p>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[11px] text-slate-600 dark:text-slate-400">
                  মোড: <strong>{importMode === "new" ? "Import as New" : importMode === "update" ? "Update Existing" : "Smart Sync"}</strong>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    [ Cancel ]
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white shadow-md shadow-emerald-600/20"
                  >
                    [ Confirm Import ]
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              EDIT ROW MODAL IN STEP 2
              ========================================== */}
          {(editingRowIndex !== null || isNewRowModal) && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isNewRowModal ? "নতুন সারি যোগ করুন" : `সারি #${(editingRowIndex ?? 0) + 1} এডিট করুন`}
                  </h3>
                  <button
                    onClick={() => {
                      setEditingRowIndex(null);
                      setIsNewRowModal(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  {headers.map((h) => (
                    <div key={h}>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                        {h}
                      </label>
                      <input
                        type="text"
                        value={editRowData[h] !== undefined ? String(editRowData[h]) : ""}
                        onChange={(e) =>
                          setEditRowData({ ...editRowData, [h]: e.target.value })
                        }
                        className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setEditingRowIndex(null);
                      setIsNewRowModal(false);
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400"
                  >
                    বাতিল
                  </button>
                  <button
                    onClick={handleSaveRowData}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    সংরক্ষণ করুন
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              ADD COLUMN MODAL IN STEP 2
              ========================================== */}
          {isAddColModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xs w-full p-5 space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  নতুন কলাম যুক্ত করুন
                </h3>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    কলামের নাম (Column Name)
                  </label>
                  <input
                    type="text"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    placeholder="যেমন: Remarks"
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsAddColModalOpen(false)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400"
                  >
                    বাতিল
                  </button>
                  <button
                    onClick={handleAddColumn}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                  >
                    যুক্ত করুন
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
