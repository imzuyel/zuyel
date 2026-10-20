"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  UserPlus,
  Filter,
  Edit2,
  Trash2,
  Eye,
  X,
  Check,
  AlertCircle,
  Phone,
  User,
  GraduationCap,
  Calendar,
  Layers,
  ChevronDown,
  Sparkles,
  Download,
  UploadCloud,
  MapPin,
  ShieldAlert,
  Printer,
  CreditCard,
  Building,
  Mail,
  Users,
  Award,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import IdCardRenderer from "@/components/documents/IdCardRenderer";
import AcademicTranscriptModal from "@/components/results/AcademicTranscriptModal";
import Student360ProfileModal from "@/components/students/Student360ProfileModal";
import SmartBulkOperationsModal, { BulkActionType } from "@/components/students/SmartBulkOperationsModal";
import StudentDirectoryPrintReport from "@/components/students/StudentDirectoryPrintReport";
import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  getApplicableTradesForClass,
  doesClassHaveTrade,
  parseClassNumeric,
} from "@/lib/academicStructure";
import { Student } from "@/lib/database";
import { useAuth } from "@/context/AuthContext";

interface StudentManagementViewProps {
  initialClassId?: number;
  openAddModalInitially?: boolean;
  onNavigateToAttendance?: () => void;
  onNavigateToIdHub?: () => void;
  onNavigateToPromotion?: () => void;
  onNavigateToResults?: () => void;
}

export default function StudentManagementView({
  initialClassId,
  openAddModalInitially = false,
  onNavigateToAttendance,
  onNavigateToIdHub,
  onNavigateToPromotion,
  onNavigateToResults,
}: StudentManagementViewProps) {
  const { currentUser } = useAuth();
  const currentRole = currentUser?.role || "admin";
  const isAdmin = currentRole !== "teacher";

  // Core database state
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Bulk Selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkModalAction, setBulkModalAction] = useState<BulkActionType>("BULK_EDIT");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId ? String(initialClassId) : "all"
  );
  const [selectedTradeId, setSelectedTradeId] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("Active");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(openAddModalInitially);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Duplicate Warning Modal state
  const [duplicateWarning, setDuplicateWarning] = useState<{
    message: string;
    payload: any;
  } | null>(null);

  // Universal Print & PDF Report modal state
  const [showPrintReport, setShowPrintReport] = useState<boolean>(false);
  const [customPrintStudents, setCustomPrintStudents] = useState<Student[] | null>(null);

  const handleOpenPrintDirectory = (studentsSubset?: Student[]) => {
    setCustomPrintStudents(studentsSubset || null);
    setShowPrintReport(true);
  };

  const currentFilterInfo = useMemo(() => {
    const cls = ACADEMIC_CLASSES.find((c) => String(c.id) === selectedClassId);
    const trd = ALL_TRADES.find((t) => String(t.id) === selectedTradeId);
    return {
      className: cls ? cls.nameBangla : "সকল শ্রেণি (All Classes)",
      tradeName: trd ? trd.nameBangla : "সকল ট্রেড (All Trades)",
      section: selectedSection === "all" ? "সকল শাখা (All Sections)" : `শাখা ${selectedSection}`,
      status: selectedStatus === "all" ? "সকল স্ট্যাটাস (All)" : selectedStatus,
    };
  }, [selectedClassId, selectedTradeId, selectedSection, selectedStatus]);

  // Form state for multi-section Add/Edit
  const [formData, setFormData] = useState({
    studentId: "",
    roll: "",
    name: "",
    nameBangla: "",
    classId: 4, // default Class 9
    tradeId: 101, // default Trade
    section: "A",
    shift: "First Shift" as "First Shift" | "Second Shift",
    session: "2026",
    studentMobile: "",
    guardianMobile: "",
    guardianName: "",
    guardianRelationship: "Father",
    fatherName: "",
    motherName: "",
    presentAddress: "",
    permanentAddress: "",
    gender: "Male",
    bloodGroup: "B+",
    status: "Active" as any,
    dob: "",
    nationality: "Bangladeshi",
    birthRegNo: "",
    email: "",
    emergencyContact: "",
    admissionDate: "",
    admissionNo: "",
    photoUrl: "",
  });

  // Photo Drag and Drop State
  const [isDragOver, setIsDragOver] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load students from the API for refetching on demand
  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setStudents(data.items);
      }
    } catch (err) {
      console.error("Failed to reload students:", err);
    }
  };

  useEffect(() => {
    let active = true;
    const loadInitialStudents = async () => {
      try {
        const res = await fetch("/api/students");
        const data = await res.json();
        if (active && data.success && Array.isArray(data.items)) {
          setStudents(data.items);
        }
      } catch (err) {
        console.error("Failed to load students on mount:", err);
        if (active) {
          setFeedback({ type: "error", message: "শিক্ষার্থীদের তথ্য লোড করতে ব্যর্থ হয়েছে।" });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadInitialStudents();
    return () => {
      active = false;
    };
  }, []);

  // Sync conditional trades when filters are selected
  const classNumeric = parseClassNumeric(selectedClassId);
  const showTradeFilter = doesClassHaveTrade(selectedClassId);
  const applicableTradesForFilter = useMemo(() => {
    return getApplicableTradesForClass(selectedClassId);
  }, [selectedClassId]);

  const handleClassFilterChange = (newCls: string) => {
    setSelectedClassId(newCls);
    if (!doesClassHaveTrade(newCls)) {
      setSelectedTradeId("all");
    }
  };

  // Filter computation
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Class filter
      if (selectedClassId !== "all") {
        const studentClassId = s.classId;
        const selectedId = Number(selectedClassId);
        // Compare database class IDs directly
        if (studentClassId !== selectedId) return false;
      }

      // Trade filter
      if (showTradeFilter && selectedTradeId !== "all") {
        if (Number(s.tradeId) !== Number(selectedTradeId)) {
          return false;
        }
      }

      // Section filter
      if (selectedSection !== "all" && s.section !== selectedSection) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all") {
        if (s.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      }

      // Full search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          s.name.toLowerCase().includes(q) ||
          (s.nameBangla && s.nameBangla.toLowerCase().includes(q)) ||
          s.studentId.toLowerCase().includes(q) ||
          (s.admissionNo && s.admissionNo.toLowerCase().includes(q)) ||
          String(s.roll) === q ||
          (s.guardianMobile && s.guardianMobile.includes(q)) ||
          (s.fatherName && s.fatherName.toLowerCase().includes(q));

        if (!matches) return false;
      }

      return true;
    });
  }, [students, selectedClassId, showTradeFilter, selectedTradeId, selectedSection, selectedStatus, searchQuery]);

  // Bulk selection helper handlers
  const toggleSelectStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFiltered = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const clearSelection = () => {
    setSelectedStudentIds([]);
  };

  const openBulkOperation = (action: BulkActionType) => {
    setBulkModalAction(action);
    setIsBulkModalOpen(true);
  };

  const selectedStudentsList = useMemo(() => {
    return students.filter((s) => selectedStudentIds.includes(s.id));
  }, [students, selectedStudentIds]);

  // Open & Reset Add student modal
  const openAddStudentModal = () => {
    setPhotoError(null);
    setFormData({
      studentId: "", // let server auto-generate or customize
      roll: "",
      name: "",
      nameBangla: "",
      classId: 4, // Class 9
      tradeId: 101, // First trade
      section: "A",
      shift: "First Shift",
      session: "2026",
      studentMobile: "",
      guardianMobile: "",
      guardianName: "",
      guardianRelationship: "Father",
      fatherName: "",
      motherName: "",
      presentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
      permanentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
      gender: "Male",
      bloodGroup: "B+",
      status: "Active",
      dob: "2010-01-01",
      nationality: "Bangladeshi",
      birthRegNo: "",
      email: "",
      emergencyContact: "",
      admissionDate: new Date().toISOString().split("T")[0],
      admissionNo: "",
      photoUrl: "",
    });
    setIsAddModalOpen(true);
  };

  // Open & Populate Edit student modal
  const openEditStudentModal = (student: Student) => {
    setPhotoError(null);
    setEditingStudent(student);
    setFormData({
      studentId: student.studentId,
      roll: String(student.roll),
      name: student.name,
      nameBangla: student.nameBangla || student.name,
      classId: student.classId || 4,
      tradeId: student.tradeId || 101,
      section: student.section || "A",
      shift: student.shift || "First Shift",
      session: student.session || "2026",
      studentMobile: student.studentMobile || "",
      guardianMobile: student.guardianMobile || "",
      guardianName: student.guardianName || student.fatherName || "",
      guardianRelationship: student.guardianRelationship || "Father",
      fatherName: student.fatherName || "",
      motherName: student.motherName || "",
      presentAddress: student.presentAddress || "",
      permanentAddress: student.permanentAddress || "",
      gender: student.gender || "Male",
      bloodGroup: student.bloodGroup || "B+",
      status: student.status || "Active",
      dob: student.dob || "",
      nationality: student.nationality || "Bangladeshi",
      birthRegNo: student.birthRegNo || "",
      email: student.email || "",
      emergencyContact: student.emergencyContact || "",
      admissionDate: student.admissionDate || "",
      admissionNo: student.admissionNo || "",
      photoUrl: student.photoUrl || "",
    });
  };

  // Conditional trade behavior based on class change
  const handleFormClassChange = (newClassId: number) => {
    const num = parseClassNumeric(newClassId);
    const hasTrades = doesClassHaveTrade(num);
    const trades = getApplicableTradesForClass(num);

    setFormData((prev) => ({
      ...prev,
      classId: newClassId,
      tradeId: hasTrades && trades.length > 0 ? trades[0].id : 0,
    }));
  };

  // Image File Validations
  const validateAndProcessFile = (file: File) => {
    setPhotoError(null);

    // Size limit: 2MB
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("ফাইলের সাইজ অনেক বড়। সর্বোচ্চ ২ মেগাবাইট (2MB) গ্রহণযোগ্য।");
      return;
    }

    // MIME and Extension checks
    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimes.includes(file.type)) {
      setPhotoError("ভুল ফাইল ফরম্যাট। শুধুমাত্র JPG, JPEG, PNG এবং WEBP গ্রহণযোগ্য।");
      return;
    }

    // Convert file to base64 for preview & persistence
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormData((prev) => ({ ...prev, photoUrl: reader.result as string }));
      }
    };
    reader.onerror = () => {
      setPhotoError("ফাইলটি প্রসেস করতে সমস্যা হয়েছে। অনুগ্রহ করে অন্য ছবি ব্যবহার করুন।");
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop event triggers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedPhoto = () => {
    setFormData((prev) => ({ ...prev, photoUrl: "" }));
    setPhotoError(null);
  };

  // Submit Save Student Payload
  const handleSaveStudent = async (e?: React.FormEvent, forceSave = false) => {
    if (e) e.preventDefault();

    if (!formData.name.trim()) {
      setFeedback({ type: "error", message: "শিক্ষার্থীর নাম দেওয়া আবশ্যক।" });
      return;
    }
    if (!formData.guardianMobile.trim()) {
      setFeedback({ type: "error", message: "অভিভাবকের মোবাইল নম্বর দেওয়া আবশ্যক।" });
      return;
    }

    try {
      const payload = {
        ...formData,
        id: editingStudent ? editingStudent.id : undefined,
        force: forceSave, // bypass fuzzy duplicate warnings
      };

      const url = "/api/students";
      const method = editingStudent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 400 && data.isWarning) {
        // Trigger Interactive Duplicate Warning Dialog
        setDuplicateWarning({
          message: data.error,
          payload,
        });
        return;
      }

      if (data.success) {
        setFeedback({
          type: "success",
          message: editingStudent
            ? "শিক্ষার্থীর তথ্য সফলভাবে হালনাগাদ করা হয়েছে।"
            : "নতুন শিক্ষার্থী সফলভাবে ডাটাবেসে যুক্ত হয়েছে।",
        });
        setIsAddModalOpen(false);
        setEditingStudent(null);
        setDuplicateWarning(null);
        fetchStudents();
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: "error", message: data.error || "সংরক্ষণ ব্যর্থ হয়েছে।" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "সার্ভার সংযোগে ত্রুটি ঘটেছে।" });
    }
  };

  // Confirm deletion
  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    try {
      const res = await fetch(`/api/students?id=${deletingStudent.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", message: "শিক্ষার্থী রেকর্ড সফলভাবে অপসারিত হয়েছে।" });
        setDeletingStudent(null);
        fetchStudents();
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: "error", message: data.error || "রেকর্ডটি মুছতে ব্যর্থ হয়েছে।" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "সার্ভার সংযোগে ত্রুটি ঘটেছে।" });
    }
  };

  const handlePrintIDCard = () => {
    window.print();
  };

  // Compute form-based conditional items
  const formClassNum = parseClassNumeric(formData.classId);
  const formHasTrades = doesClassHaveTrade(formClassNum);
  const formApplicableTrades = getApplicableTradesForClass(formClassNum);

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header and Add Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
            <GraduationCap className="w-6 h-6 text-white filter drop-shadow(0 0 6px rgba(255,255,255,0.8)) animate-bounce-subtle" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>শিক্ষার্থী রেজিষ্টার ও ভর্তি ফাউন্ডেশন (Student Master)</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              মোট তালিকাভুক্ত শিক্ষার্থী: <span className="font-bold text-emerald-600 dark:text-emerald-400">{students.length}</span> জন • বর্তমান ফিল্টারে: <span className="font-bold text-teal-600 dark:text-teal-400">{filteredStudents.length}</span> জন
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenPrintDirectory()}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs group"
          >
            <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-125 transition-transform">
              <Printer className="w-3.5 h-3.5" />
            </div>
            <span>তালিকা প্রিন্ট / PDF</span>
          </button>

          {onNavigateToIdHub && (
            <button
              id="btn-open-id-hub"
              onClick={onNavigateToIdHub}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer group"
            >
              <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-125 transition-transform">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <span>স্মার্ট আইডি হাব</span>
            </button>
          )}

          {onNavigateToPromotion && (
            <button
              onClick={onNavigateToPromotion}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer group"
            >
              <div className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
                <RefreshCw className="w-3.5 h-3.5" />
              </div>
              <span>একাডেমিক লাইফসাইকেল</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={openAddStudentModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-600/25 border border-emerald-400/30 group"
            >
              <div className="w-5 h-5 rounded-md bg-white dark:bg-slate-900/20 text-white flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-transform">
                <UserPlus className="w-3.5 h-3.5 text-white" />
              </div>
              <span>নতুন শিক্ষার্থী ভর্তি</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Global Feedback Bar */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-bold border ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 3. Advanced Filtering Panel */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, স্টুডেন্ট আইডি (যেমন: PTSC-2026-090001), সেশন, বাবার নাম অথবা মোবাইল নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Class Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              ভর্তিকৃত শ্রেণি (Class Filter)
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassFilterChange(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">সকল শ্রেণি (All Classes)</option>
              {ACADEMIC_CLASSES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBangla}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional Trade Filter */}
          {showTradeFilter ? (
            <div>
              <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                কারিগরি ট্রেড (Trade Filter)
              </label>
              <select
                value={selectedTradeId}
                onChange={(e) => setSelectedTradeId(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">সকল ট্রেড (All Trades)</option>
                {applicableTradesForFilter.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameBangla} ({t.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col justify-end">
              <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1.5">
                কারিগরি ট্রেড
              </label>
              <div className="flex items-center justify-center bg-slate-50/80 dark:bg-slate-800/50 p-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[11px] h-9">
                <span>{selectedClassId === "all" ? "ট্রেড দেখতে শ্রেণি নির্ধারণ করুন" : "ট্রেড প্রযোজ্য নয় (Pre-Vocational)"}</span>
              </div>
            </div>
          )}

          {/* Section Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              শ্রেণি শাখা (Section Filter)
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">সকল শাখা (All Sections)</option>
              <option value="A">শাখা A</option>
              <option value="B">শাখা B</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              বর্তমান স্ট্যাটাস (Status Filter)
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">সকল স্ট্যাটাস (All)</option>
              <option value="Active">সক্রিয় (Active)</option>
              <option value="Inactive">নিষ্ক্রিয় (Inactive)</option>
              <option value="Transferred">স্থানান্তরিত (Transferred)</option>
              <option value="Dropped">ঝরে পড়া (Dropped)</option>
              <option value="Graduated">উত্তীর্ণ (Graduated)</option>
              <option value="Alumni">অ্যালামনাই (Alumni)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Student Master List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span>শিক্ষার্থীদের তালিকা লোড হচ্ছে...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center space-y-3 max-w-md mx-auto">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-black text-slate-700 dark:text-slate-200">কোনো শিক্ষার্থী রেকর্ড খুঁজে পাওয়া যায়নি</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              অনুগ্রহ করে খোঁজার কিওয়ার্ড বা ফিল্টারের শর্ত পরিবর্তন করুন অথবা নতুন শিক্ষার্থী ম্যানুয়ালি ভর্তি করতে উপরোক্ত বাটনটি চাপুন।
            </p>
          </div>
        ) : (
          <>
            {/* Bulk Selection Action Bar */}
            {selectedStudentIds.length > 0 && (
              <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-mono font-black">
                    {selectedStudentIds.length}
                  </span>
                  <span>শিক্ষার্থী নির্বাচিত (Selected)</span>
                  {selectedStudentIds.length < filteredStudents.length && (
                    <button
                      onClick={toggleSelectAllFiltered}
                      className="text-indigo-400 hover:text-indigo-300 underline ml-2 text-[11px] cursor-pointer"
                    >
                      ফিল্টারকৃত সকল ({filteredStudents.length}) শিক্ষার্থী নির্বাচন করুন
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => {
                      const subset = filteredStudents.filter((s) => selectedStudentIds.includes(s.id));
                      handleOpenPrintDirectory(subset);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>নির্বাচিতদের প্রিন্ট / PDF ({selectedStudentIds.length})</span>
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => openBulkOperation("BULK_EDIT")}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>বাল্ক এডিট (Bulk Edit)</span>
                      </button>

                      <button
                        onClick={() => openBulkOperation("SECTION_CHANGE")}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                      >
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span> শাখা পরিবর্তন</span>
                      </button>

                      <button
                        onClick={() => openBulkOperation("TRADE_ASSIGN")}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                        <span>ট্রেড বণ্টন</span>
                      </button>

                      <button
                        onClick={() => openBulkOperation("STATUS_UPDATE")}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                      >
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        <span>স্ট্যাটাস পরিবর্তন</span>
                      </button>

                      <button
                        onClick={() => openBulkOperation("ARCHIVE")}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-rose-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>আর্কাইভ</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={clearSelection}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>ক্লিয়ার</span>
                  </button>
                </div>
              </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredStudents.length > 0 &&
                          selectedStudentIds.length === filteredStudents.length
                        }
                        onChange={toggleSelectAllFiltered}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                        title="সবগুলো নির্বাচন করুন"
                      />
                    </th>
                    <th className="py-3 px-4 w-16 text-center">রোল</th>
                    <th className="py-3 px-4 w-44">স্টুডেন্ট আইডি</th>
                    <th className="py-3 px-4">নাম ও জন্ম তারিখ</th>
                    <th className="py-3 px-4 w-36">শ্রেণি ও শাখা</th>
                    <th className="py-3 px-4 min-w-[140px]">ভোকেশনাল ট্রেড</th>
                    <th className="py-3 px-4 w-36">অভিভাবকের মোবাইল</th>
                    <th className="py-3 px-4 w-28 text-center">বর্তমান অবস্থা</th>
                    <th className="py-3 px-4 text-right w-28">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {filteredStudents.map((s) => {
                    const clsNum = parseClassNumeric(s.classId);
                    const hasTrade = clsNum >= 9 && clsNum <= 12;
                    const isSelected = selectedStudentIds.includes(s.id);

                    return (
                      <tr
                        key={s.id}
                        className={`transition-all duration-200 hover:scale-[1.005] hover:shadow-sm cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50/70 dark:bg-indigo-950/50 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60"
                            : "hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                        }`}
                        onClick={() => setViewingStudent(s)}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectStudent(s.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-center text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {String(s.roll).padStart(2, "0")}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                          <div className="flex items-center gap-2">
                            {s.photoUrl ? (
                              <img
                                src={s.photoUrl}
                                alt={s.name}
                                className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-bold">
                                ছবি
                              </div>
                            )}
                            <span className="tracking-tight">{s.studentId}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{s.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                            <span>{s.nameBangla}</span>
                            {s.dob && (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">·</span>
                                <span className="font-mono tabular-nums">{s.dob}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                              {s.className || `Class ${clsNum}`}
                            </span>
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                              শাখা {s.section || "A"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {hasTrade && s.tradeName ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {s.tradeNameBangla || s.tradeName}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-[11px] italic font-medium">সাধারণ (No Trade)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                          {s.guardianMobile || "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                              s.status === "Active"
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                : s.status === "Inactive"
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                : s.status === "Transferred"
                                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                : s.status === "Dropped"
                                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                                : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            {s.status === "Active"
                              ? "সক্রিয়"
                              : s.status === "Inactive"
                              ? "নিষ্ক্রিয়"
                              : s.status === "Transferred"
                              ? "স্থানান্তরিত"
                              : s.status === "Dropped"
                              ? "ঝরে পড়া"
                              : s.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setViewingStudent(s);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                              title="360° পূর্ণাঙ্গ প্রোফাইল"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => openEditStudentModal(s)}
                                  className="p-1.5 rounded-lg hover:bg-indigo-50 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 transition-colors"
                                  title="তথ্য সংশোধন"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeletingStudent(s)}
                                  className="p-1.5 rounded-lg hover:bg-rose-50 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-colors"
                                  title="অপসারণ"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Cards View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((s) => {
                const clsNum = parseClassNumeric(s.classId);
                const hasTrade = clsNum >= 9 && clsNum <= 12;
                const isSelected = selectedStudentIds.includes(s.id);

                return (
                  <div
                    key={s.id}
                    className={`p-4 space-y-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 cursor-pointer ${
                      isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/30" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectStudent(s.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                        />
                        <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                          {String(s.roll).padStart(2, "0")}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{s.name}</h4>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5">ID: {s.studentId}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {s.className || `Class ${clsNum}`} • {s.section || "A"}
                      </span>
                    </div>

                    {hasTrade && s.tradeName && (
                      <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-50/50 dark:bg-indigo-950/40 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-800">
                        ট্রেড: {s.tradeNameBangla || s.tradeName}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-1 font-mono text-slate-600 dark:text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.guardianMobile || "মোবাইল নেই"}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setViewingStudent(s);
                          }}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-md text-xs font-semibold"
                        >
                          360° প্রোফাইল
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEditStudentModal(s)}
                              className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-md text-xs font-semibold"
                            >
                              সংশোধন
                            </button>
                            <button
                              onClick={() => setDeletingStudent(s)}
                              className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 5. MANUAL ADMISSION FORM MODAL (MULTI-SECTION) */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {editingStudent ? "শিক্ষার্থীর তথ্য সংশোধন ফরম (Edit Profile)" : "নতুন শিক্ষার্থী ম্যানুয়াল ভর্তি ফরম (Manual Admission)"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveStudent(e)} className="space-y-5 text-[11px] text-slate-700 dark:text-slate-300">
              
              {/* SECTION A: Student Information & Photo Drag-and-Drop */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/60">
                <h3 className="font-black text-indigo-700 text-xs flex items-center gap-1.5 border-b border-indigo-100 pb-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>সেকশন A: শিক্ষার্থীর মৌলিক তথ্য (Basic Student Info)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Photo Dropzone Block */}
                  <div className="md:col-span-1 space-y-2">
                    <label className="block font-bold text-slate-600 dark:text-slate-400">শিক্ষার্থীর ছবি (Photo) *</label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={triggerFileSelect}
                      className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer ${
                        formData.photoUrl
                          ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40/10"
                          : isDragOver
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40/30"
                          : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-900"
                      }`}
                    >
                      {formData.photoUrl ? (
                        <div className="relative w-full h-full">
                          <img
                            src={formData.photoUrl}
                            alt="Student preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSelectedPhoto();
                            }}
                            className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-md transition-colors"
                            title="ছবি অপসারণ"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">ড্রাগ করে ছাড়ুন বা ক্লিক করুন</p>
                          <p className="text-[8px] text-slate-400 font-semibold">JPG, PNG, WEBP (সর্বোচ্চ ২MB)</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                    />
                    {photoError && (
                      <p className="text-[9px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{photoError}</span>
                      </p>
                    )}
                  </div>

                  {/* Basic Inputs */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">শিক্ষার্থীর নাম (ইংরেজিতে) *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="MD. REZWAN HASAN"
                        className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">শিক্ষার্থীর নাম (বাংলায়)</label>
                      <input
                        type="text"
                        value={formData.nameBangla}
                        onChange={(e) => setFormData({ ...formData, nameBangla: e.target.value })}
                        placeholder="মো. রেজওয়ান হাসান"
                        className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">জন্ম তারিখ (DOB) *</label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        required
                        className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">জাতীয়তা (Nationality)</label>
                      <input
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        placeholder="Bangladeshi"
                        className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">লিঙ্গ (Gender) *</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold"
                      >
                        <option value="Male">ছাত্র (Male)</option>
                        <option value="Female">ছাত্রী (Female)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">রক্তের গ্রুপ (Blood Group) *</label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      >
                        <option value="A+">A+ (পজিটিভ)</option>
                        <option value="A-">A- (নেগেটিভ)</option>
                        <option value="B+">B+ (পজিটিভ)</option>
                        <option value="B-">B- (নেগেটিভ)</option>
                        <option value="O+">O+ (পজিটিভ)</option>
                        <option value="O-">O- (নেগেটিভ)</option>
                        <option value="AB+">AB+ (পজিটিভ)</option>
                        <option value="AB-">AB- (নেগেটিভ)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION B: Guardian Information */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/60">
                <h3 className="font-black text-indigo-700 text-xs flex items-center gap-1.5 border-b border-indigo-100 pb-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>সেকশন B: অভিভাবকের বিবরণ (Guardian Details)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">পিতার নাম (Father&apos;s Name)</label>
                    <input
                      type="text"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      placeholder="MD. ABDUR RAHMAN"
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">মাতার নাম (Mother&apos;s Name)</label>
                    <input
                      type="text"
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      placeholder="MRS. FATEMA BEGUM"
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">অভিভাবকের নাম (পিতা ছাড়া হলে)</label>
                    <input
                      type="text"
                      value={formData.guardianName}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      placeholder="Guardian Name"
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">অভিভাবকের মোবাইল নম্বর *</label>
                    <input
                      type="text"
                      value={formData.guardianMobile}
                      onChange={(e) => setFormData({ ...formData, guardianMobile: e.target.value })}
                      required
                      placeholder="01712-345678"
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono font-bold text-indigo-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">অভিভাবকের সাথে সম্পর্ক</label>
                    <select
                      value={formData.guardianRelationship}
                      onChange={(e) => setFormData({ ...formData, guardianRelationship: e.target.value })}
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none"
                    >
                      <option value="Father">পিতা (Father)</option>
                      <option value="Mother">মাতা (Mother)</option>
                      <option value="Brother">ভাই (Brother)</option>
                      <option value="Uncle">চাচা/মামু (Uncle)</option>
                      <option value="Other">অন্যান্য (Other)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">জরুরী যোগাযোগ নম্বর (Emergency Contact)</label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="01712-XXXXXX"
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: Academic Details */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/60">
                <h3 className="font-black text-indigo-700 text-xs flex items-center gap-1.5 border-b border-indigo-100 pb-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>সেকশন C: প্রাতিষ্ঠানিক বিবরণ (Academic Details)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">শিক্ষাবর্ষ সেশন (Session)</label>
                    <input
                      type="text"
                      value={formData.session}
                      onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                      placeholder="2026"
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">শ্রেণি (Class) *</label>
                    <select
                      value={formData.classId}
                      onChange={(e) => handleFormClassChange(Number(e.target.value))}
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-indigo-600"
                    >
                      {ACADEMIC_CLASSES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameBangla}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Conditional Trade selector - Authoritative Frontend */}
                  {formHasTrades ? (
                    <div>
                      <label className="block font-bold text-indigo-600 mb-1">কারিগরি ট্রেড (Trade) *</label>
                      <select
                        value={formData.tradeId}
                        onChange={(e) => setFormData({ ...formData, tradeId: Number(e.target.value) })}
                        required
                        className="w-full py-1.5 px-3 rounded-lg border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/40/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-indigo-900"
                      >
                        {formApplicableTrades.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nameBangla}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] font-semibold h-9 self-end">
                      <span>ট্রেড প্রযোজ্য নয় (Pre-Voc)</span>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">শ্রেণি রোল (Roll) *</label>
                    <input
                      type="number"
                      value={formData.roll}
                      onChange={(e) => setFormData({ ...formData, roll: e.target.value })}
                      required
                      placeholder="e.g. 1"
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">শ্রেণি শাখা (Section) *</label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none"
                    >
                      <option value="A">শাখা A</option>
                      <option value="B">শাখা B</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">শিফট (Shift) *</label>
                    <select
                      value={formData.shift}
                      onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none font-bold"
                    >
                      <option value="First Shift">১ম শিফট (First Shift)</option>
                      <option value="Second Shift">২য় শিফট (Second Shift)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">ভর্তির তারিখ</label>
                    <input
                      type="date"
                      value={formData.admissionDate}
                      onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">ভর্তি ফরম নং (Admission No)</label>
                    <input
                      type="text"
                      value={formData.admissionNo}
                      onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
                      placeholder="e.g. ADM-2026-0001"
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {editingStudent && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">স্টুডেন্ট আইডি (Student ID)</label>
                      <input
                        type="text"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        required
                        className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none font-mono font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40/10"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">বর্তমান অবস্থা (Status) *</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none font-bold text-indigo-600"
                      >
                        <option value="Active">সক্রিয় (Active)</option>
                        <option value="Inactive">নিষ্ক্রিয় (Inactive)</option>
                        <option value="Transferred">স্থানান্তরিত (Transferred)</option>
                        <option value="Dropped">ঝরে পড়া (Dropped)</option>
                        <option value="Graduated">উত্তীর্ণ (Graduated)</option>
                        <option value="Alumni">অ্যালামনাই (Alumni)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION D: Address Details */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/60">
                <h3 className="font-black text-indigo-700 text-xs flex items-center gap-1.5 border-b border-indigo-100 pb-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>সেকশন D: যোগাযোগের ঠিকানা (Address Information)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">বর্তমান ঠিকানা (Present Address) *</label>
                    <textarea
                      value={formData.presentAddress}
                      onChange={(e) => setFormData({ ...formData, presentAddress: e.target.value })}
                      rows={2}
                      placeholder="গ্রাম, পোস্ট, উপজেলা, জেলা"
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">স্থায়ী ঠিকানা (Permanent Address) *</label>
                    <textarea
                      value={formData.permanentAddress}
                      onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                      rows={2}
                      placeholder="গ্রাম, পোস্ট, উপজেলা, জেলা"
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION E: Additional Information */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/60">
                <h3 className="font-black text-indigo-700 text-xs flex items-center gap-1.5 border-b border-indigo-100 pb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>সেকশন E: অন্যান্য অতিরিক্ত তথ্য (Additional Details)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">শিক্ষার্থীর নিজের মোবাইল (যদি থাকে)</label>
                    <input
                      type="text"
                      value={formData.studentMobile}
                      onChange={(e) => setFormData({ ...formData, studentMobile: e.target.value })}
                      placeholder="017XX-XXXXXX"
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">ইমেইল ঠিকানা (Email Address)</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="student@example.com"
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">জন্ম নিবন্ধন সনদ নম্বর (Birth Registration No)</label>
                    <input
                      type="text"
                      value={formData.birthRegNo}
                      onChange={(e) => setFormData({ ...formData, birthRegNo: e.target.value })}
                      placeholder="১৭ ডিজিটের জন্ম নিবন্ধন নং"
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/15 cursor-pointer"
                >
                  {editingStudent ? "হালনাগাদ সম্পন্ন করুন" : "ভর্তি নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERACTIVE DUPLICATE WARNING MODAL */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-7 h-7 shrink-0 animate-bounce" />
              <h3 className="font-black text-sm">সম্ভাব্য ডুপ্লিকেট তথ্য সনাক্তকরণ! (Warning)</h3>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-rose-50 dark:bg-rose-950/40/50 p-3 rounded-xl border border-rose-100 font-bold">
              {duplicateWarning.message}
            </p>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              একই নাম এবং জন্ম তারিখ বিশিষ্ট শিক্ষার্থী পূর্বে ডাটাবেসে নিবন্ধিত হয়ে থাকতে পারে। আপনি কি এই সতর্কতা অগ্রাহ্য করে ভর্তি চূড়ান্ত করতে চান?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => setDuplicateWarning(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                onClick={() => handleSaveStudent(undefined, true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-[11px] font-bold text-white shadow-md shadow-rose-600/15 cursor-pointer"
              >
                হ্যাঁ, জোরপূর্বক সংরক্ষণ করুন (Force Save)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. COMPLETE STUDENT 360° PROFILE MODAL (PHASE 12) */}
      {viewingStudent && (
        <Student360ProfileModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
          onEditStudent={(s) => {
            setViewingStudent(null);
            openEditStudentModal(s);
          }}
          onNavigateToAttendance={onNavigateToAttendance}
          onNavigateToPromotion={onNavigateToPromotion}
          onNavigateToResults={onNavigateToResults}
        />
      )}

      {/* 6.1 SMART BULK OPERATIONS MODAL (PHASE 13) */}
      {isBulkModalOpen && (
        <SmartBulkOperationsModal
          isOpen={isBulkModalOpen}
          initialAction={bulkModalAction}
          selectedStudents={selectedStudentsList}
          allStudents={students}
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={() => {
            fetchStudents();
            setSelectedStudentIds([]);
            setFeedback({
              type: "success",
              message: "বাল্ক অপারেশন সফলভাবে সম্পন্ন হয়েছে।",
            });
          }}
        />
      )}

      {/* 7. DELETE CONFIRMATION MODAL */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertCircle className="w-5.5 h-5.5 shrink-0" />
              <h3 className="font-black text-sm">শিক্ষার্থী রেকর্ড স্থায়ী অপসারণ</h3>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              আপনি কি নিশ্চিত যে আপনি শিক্ষার্থী <strong className="text-slate-900 dark:text-slate-100">{deletingStudent.name}</strong> (আইডি: {deletingStudent.studentId}) এর রেকর্ড ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা সম্ভব নয়।
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md shadow-rose-600/15 cursor-pointer"
              >
                নিশ্চিত অপসারণ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. UNIVERSAL PRINT & PDF DIRECTORY REPORT MODAL */}
      {showPrintReport && (
        <StudentDirectoryPrintReport
          students={customPrintStudents || filteredStudents}
          filterInfo={currentFilterInfo}
          onClose={() => {
            setShowPrintReport(false);
            setCustomPrintStudents(null);
          }}
        />
      )}
    </div>
  );
}
