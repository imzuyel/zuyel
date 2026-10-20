"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Edit,
  UserCheck,
  Calendar,
  GraduationCap,
  Wrench,
  Sparkles,
  ArrowRight,
  Eye,
  FileText,
  Copy,
  Download,
  Upload,
  ShieldCheck,
  Layers,
  Users,
  Info,
  FileSpreadsheet,
  Check,
  Clock,
  HelpCircle,
  FileDown,
  History,
} from "lucide-react";
import {
  ACADEMIC_CLASSES,
  doesClassHaveTrade,
  getApplicableTradesForClass,
  parseClassNumeric,
} from "@/lib/academicStructure";
import { useAuth } from "@/context/AuthContext";
import {
  GlowCard,
  GlowButton,
  AnimatedCounter,
  PageTransition,
  AnimatedSection,
} from "@/components/ui/animation-effects";

// Types
type ViewTab =
  | "mapping"
  | "master"
  | "teachers"
  | "teacher_view"
  | "subject_360"
  | "topics"
  | "rollover"
  | "import_export"
  | "audit";

type SubjectCategoryType =
  | "Theory"
  | "Practical"
  | "Theory + Practical"
  | "Lab"
  | "Workshop"
  | "Viva/Oral"
  | "Assignment/Assessment";

type TeacherRole =
  | "Primary Teacher"
  | "Additional Teacher"
  | "Practical Teacher"
  | "Lab Instructor";

interface SubjectMaster {
  id: number;
  code: string;
  name: string;
  nameBangla: string;
  shortName: string;
  subjectType: SubjectCategoryType;
  creditHours: number;
  fullMarks: number;
  passMarks: number;
  theoryMarks: number;
  practicalMarks: number;
  vivaMarks: number;
  continuousMarks: number;
  displayOrder: number;
  status: string;
  description?: string;
}

interface ClassSubjectMapping {
  id: string;
  academicYear: string;
  classId: number;
  className: string;
  tradeId?: number;
  tradeName?: string;
  section: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  subjectNameBangla: string;
  subjectType: SubjectCategoryType;
  fullMarks: number;
  passMarks: number;
  theoryMarks: number;
  practicalMarks: number;
  weeklyPeriods: number;
  status: string;
}

interface TeacherAssignment {
  id: string;
  academicYear: string;
  classId: number;
  className: string;
  tradeId?: number;
  tradeName?: string;
  section: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  subjectNameBangla: string;
  teacherId: number;
  teacherName: string;
  teacherDesignation: string;
  department: string;
  role: TeacherRole;
  weeklyAssignedPeriods: number;
  isClassTeacher: boolean;
}

export default function SubjectsView() {
  const { user } = useAuth();

  // Active Navigation
  const [activeTab, setActiveTab] = useState<ViewTab>("mapping");

  // Global Context Selectors
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedClassId, setSelectedClassId] = useState<number>(9);
  const [selectedTradeId, setSelectedTradeId] = useState<number>(101);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<number | "all">("all");

  // Data States
  const [subjectMasters, setSubjectMasters] = useState<SubjectMaster[]>([]);
  const [mappings, setMappings] = useState<ClassSubjectMapping[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Subject 360 Analytics State
  const [activeSubject360Id, setActiveSubject360Id] = useState<number | null>(null);
  const [subject360Data, setSubject360Data] = useState<any | null>(null);

  // Teacher Profile Academic View State
  const [activeTeacherProfileId, setActiveTeacherProfileId] = useState<number | null>(null);
  const [teacherProfileData, setTeacherProfileData] = useState<any | null>(null);

  // Topics State
  const [selectedTopicSubjectId, setSelectedTopicSubjectId] = useState<number | null>(null);
  const [topicsList, setTopicsList] = useState<any[]>([]);

  // Modals Controls
  const [isCreateMasterModalOpen, setIsCreateMasterModalOpen] = useState<boolean>(false);
  const [editingMaster, setEditingMaster] = useState<SubjectMaster | null>(null);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState<boolean>(false);
  const [selectedBulkSubjectIds, setSelectedBulkSubjectIds] = useState<number[]>([]);
  const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState<boolean>(false);
  const [assigningMapping, setAssigningMapping] = useState<ClassSubjectMapping | null>(null);
  const [isCopyPreviewModalOpen, setIsCopyPreviewModalOpen] = useState<boolean>(false);
  const [copyPreviewData, setCopyPreviewData] = useState<any | null>(null);

  // Master Subject Form State
  const [masterForm, setMasterForm] = useState({
    code: "",
    name: "",
    nameBangla: "",
    shortName: "",
    subjectType: "Theory" as SubjectCategoryType,
    creditHours: 3.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    displayOrder: 10,
    description: "",
  });

  // Assign Teacher Form State
  const [teacherAssignForm, setTeacherAssignForm] = useState({
    teacherId: 0,
    role: "Primary Teacher" as TeacherRole,
    weeklyAssignedPeriods: 3,
    isClassTeacher: false,
  });

  // Rollover Form State
  const [rolloverForm, setRolloverForm] = useState({
    sourceYear: "2025",
    targetYear: "2026",
    classId: 9,
    tradeId: 101,
    copyTeacherAssignments: true,
    overwriteConflicts: false,
  });

  // Fetch Core Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const resMaster = await fetch("/api/academic/subjects?action=master");
      if (resMaster.ok && (resMaster.headers.get("content-type") || "").includes("application/json")) {
        const dataMaster = await resMaster.json();
        if (dataMaster.success && Array.isArray(dataMaster.subjects)) setSubjectMasters(dataMaster.subjects);
      }

      const resMap = await fetch(
        `/api/academic/subjects?action=mapping&academicYear=${selectedYear}&classId=${selectedClassId}`
      );
      if (resMap.ok && (resMap.headers.get("content-type") || "").includes("application/json")) {
        const dataMap = await resMap.json();
        if (dataMap.success && Array.isArray(dataMap.mappings)) setMappings(dataMap.mappings);
      }

      const resTeach = await fetch(
        `/api/academic/subjects?action=teachers&academicYear=${selectedYear}`
      );
      if (resTeach.ok && (resTeach.headers.get("content-type") || "").includes("application/json")) {
        const dataTeach = await resTeach.json();
        if (dataTeach.success) {
          if (Array.isArray(dataTeach.assignments)) setTeacherAssignments(dataTeach.assignments);
          if (Array.isArray(dataTeach.facultyList)) setFacultyList(dataTeach.facultyList);
        }
      }

      const resAudit = await fetch("/api/academic/subjects?action=audit&limit=30");
      if (resAudit.ok && (resAudit.headers.get("content-type") || "").includes("application/json")) {
        const dataAudit = await resAudit.json();
        if (dataAudit.success && Array.isArray(dataAudit.logs)) setAuditLogs(dataAudit.logs);
      }
    } catch (err: any) {
      console.warn("Could not reach academic subjects API, using cached state", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedClassId]);

  // Dynamic Rules
  const numericClass = useMemo(() => parseClassNumeric(selectedClassId), [selectedClassId]);
  const hasTrade = useMemo(() => doesClassHaveTrade(numericClass), [numericClass]);
  const applicableTrades = useMemo(() => getApplicableTradesForClass(numericClass), [numericClass]);

  useEffect(() => {
    if (!hasTrade) {
      setSelectedTradeId(0);
    } else {
      if (applicableTrades.length > 0 && (!selectedTradeId || !applicableTrades.some((t) => t.id === selectedTradeId))) {
        setSelectedTradeId(applicableTrades[0].id);
      }
    }
  }, [selectedClassId, hasTrade, applicableTrades]);

  const showFeedback = (type: "success" | "error" | "info", text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 5000);
  };

  // Filtered Mappings for Current Class/Trade
  const filteredMappings = useMemo(() => {
    return mappings.filter((m) => {
      if (hasTrade && selectedTradeId > 0 && m.tradeId) {
        if (m.tradeId !== selectedTradeId) return false;
      }
      if (typeFilter !== "all" && m.subjectType !== typeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          m.subjectCode.toLowerCase().includes(q) ||
          m.subjectName.toLowerCase().includes(q) ||
          m.subjectNameBangla.includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [mappings, hasTrade, selectedTradeId, typeFilter, searchQuery]);

  // Filtered Masters Catalog
  const filteredMasters = useMemo(() => {
    return subjectMasters.filter((s) => {
      if (typeFilter !== "all" && s.subjectType !== typeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.nameBangla.includes(q)
        );
      }
      return true;
    });
  }, [subjectMasters, typeFilter, searchQuery]);

  // Filtered Teacher Assignments
  const filteredTeacherAssignments = useMemo(() => {
    return teacherAssignments.filter((t) => {
      if (selectedTeacherFilter !== "all" && t.teacherId !== selectedTeacherFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.teacherName.toLowerCase().includes(q) ||
          t.subjectNameBangla.includes(q) ||
          t.subjectCode.toLowerCase().includes(q) ||
          t.className.includes(q)
        );
      }
      return true;
    });
  }, [teacherAssignments, selectedTeacherFilter, searchQuery]);

  // Load Subject 360 View
  const loadSubject360 = async (subjectId: number) => {
    setActiveSubject360Id(subjectId);
    try {
      const res = await fetch(`/api/academic/subjects?action=subject_360&id=${subjectId}&academicYear=${selectedYear}`);
      const data = await res.json();
      if (data.success) {
        setSubject360Data(data.view);
        setActiveTab("subject_360");
      }
    } catch (e: any) {
      showFeedback("error", "৩৬০° ভিউ লোড করা সম্ভব হয়নি");
    }
  };

  // Load Teacher Profile
  const loadTeacherProfile = async (teacherId: number) => {
    setActiveTeacherProfileId(teacherId);
    try {
      const res = await fetch(`/api/academic/subjects?action=teacher_profile&id=${teacherId}&academicYear=${selectedYear}`);
      const data = await res.json();
      if (data.success) {
        setTeacherProfileData(data.profile);
      }
    } catch (e: any) {
      showFeedback("error", "শিক্ষক একাডেমিক প্রোফাইল লোড করতে ব্যর্থ");
    }
  };

  // Load Topics
  const loadTopics = async (subjectId: number) => {
    setSelectedTopicSubjectId(subjectId);
    try {
      const res = await fetch(`/api/academic/subjects?action=topics&subjectId=${subjectId}`);
      const data = await res.json();
      if (data.success) {
        setTopicsList(data.topics);
      } else {
        // Fallback default sample topics
        setTopicsList([
          { id: 1, chapterNumber: 1, name: "মৌলিক পরিচিতি ও ভিত্তি", nameBangla: "অধ্যায় ১: প্রাথমিক ধারণা ও পরিধি", questionCount: 15, isQuizReady: true, estimatedPeriods: 4 },
          { id: 2, chapterNumber: 2, name: "তাত্ত্বিক ও প্রায়োগিক বিশ্লেষণ", nameBangla: "অধ্যায় ২: মূল তত্ত্ব ও নীতিসমূহ", questionCount: 22, isQuizReady: true, estimatedPeriods: 6 },
          { id: 3, chapterNumber: 3, name: "ল্যাব ও ব্যবহারিক কার্যক্রম", nameBangla: "অধ্যায় ৩: ব্যবহারিক প্রয়োগ ও ওয়ার্কশপ নিরাপত্তা", questionCount: 10, isQuizReady: false, estimatedPeriods: 8 },
        ]);
      }
    } catch (e: any) {
      setTopicsList([
        { id: 1, chapterNumber: 1, name: "মৌলিক পরিচিতি ও ভিত্তি", nameBangla: "অধ্যায় ১: প্রাথমিক ধারণা ও পরিধি", questionCount: 15, isQuizReady: true, estimatedPeriods: 4 },
        { id: 2, chapterNumber: 2, name: "তাত্ত্বিক ও প্রায়োগিক বিশ্লেষণ", nameBangla: "অধ্যায় ২: মূল তত্ত্ব ও নীতিসমূহ", questionCount: 22, isQuizReady: true, estimatedPeriods: 6 },
      ]);
    }
  };

  // Save Master Subject
  const handleSaveMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMaster) {
        const res = await fetch("/api/academic/subjects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_master",
            id: editingMaster.id,
            ...masterForm,
            user: user?.name || "Admin",
          }),
        });
        const data = await res.json();
        if (data.success) {
          showFeedback("success", data.message);
          setIsCreateMasterModalOpen(false);
          setEditingMaster(null);
          fetchData();
        } else {
          showFeedback("error", data.error || "আপডেট ব্যর্থ হয়েছে");
        }
      } else {
        const res = await fetch("/api/academic/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_master",
            ...masterForm,
            user: user?.name || "Admin",
          }),
        });
        const data = await res.json();
        if (data.success) {
          showFeedback("success", data.message);
          setIsCreateMasterModalOpen(false);
          fetchData();
        } else {
          showFeedback("error", data.error || "তৈরি ব্যর্থ হয়েছে");
        }
      }
    } catch (err: any) {
      showFeedback("error", err.message || "সার্ভার এরর");
    }
  };

  // Open Edit Master
  const openEditMaster = (sub: SubjectMaster) => {
    setEditingMaster(sub);
    setMasterForm({
      code: sub.code,
      name: sub.name,
      nameBangla: sub.nameBangla,
      shortName: sub.shortName,
      subjectType: sub.subjectType,
      creditHours: sub.creditHours,
      fullMarks: sub.fullMarks,
      passMarks: sub.passMarks,
      theoryMarks: sub.theoryMarks,
      practicalMarks: sub.practicalMarks,
      vivaMarks: sub.vivaMarks,
      continuousMarks: sub.continuousMarks,
      displayOrder: sub.displayOrder,
      description: sub.description || "",
    });
    setIsCreateMasterModalOpen(true);
  };

  // Delete Master
  const handleDeleteMaster = async (sub: SubjectMaster) => {
    if (!confirm(`আপনি কি নিশ্চিত যে আপনি বিষয় [${sub.code}] ${sub.nameBangla} মুছে ফেলতে চান?`)) return;

    try {
      const res = await fetch(`/api/academic/subjects?action=delete_master&id=${sub.id}&user=${user?.name || "Admin"}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", data.message);
        fetchData();
      } else {
        showFeedback("error", data.error || data.message);
      }
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  // Bulk Assign Subjects
  const handleBulkAssign = async () => {
    if (selectedBulkSubjectIds.length === 0) {
      showFeedback("error", "কমপক্ষে একটি বিষয় নির্বাচন করুন।");
      return;
    }

    try {
      const res = await fetch("/api/academic/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_assign_subjects",
          academicYear: selectedYear,
          classId: selectedClassId,
          tradeId: hasTrade ? selectedTradeId : undefined,
          subjectIds: selectedBulkSubjectIds,
          user: user?.name || "Admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", data.message);
        setIsBulkAssignModalOpen(false);
        setSelectedBulkSubjectIds([]);
        fetchData();
      } else {
        showFeedback("error", data.errors?.join(" ") || "ম্যাপিং ব্যর্থ হয়েছে");
      }
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  // Assign Teacher
  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningMapping || !teacherAssignForm.teacherId) {
      showFeedback("error", "শিক্ষক নির্বাচন করুন।");
      return;
    }

    try {
      const res = await fetch("/api/academic/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_teacher",
          academicYear: selectedYear,
          classId: assigningMapping.classId,
          tradeId: assigningMapping.tradeId,
          section: assigningMapping.section,
          subjectId: assigningMapping.subjectId,
          teacherId: teacherAssignForm.teacherId,
          role: teacherAssignForm.role,
          weeklyAssignedPeriods: teacherAssignForm.weeklyAssignedPeriods,
          isClassTeacher: teacherAssignForm.isClassTeacher,
          user: user?.name || "Admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", data.message);
        setIsAssignTeacherModalOpen(false);
        setAssigningMapping(null);
        fetchData();
      } else {
        showFeedback("error", data.error || "এসাইনমেন্ট ব্যর্থ হয়েছে");
      }
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  // Remove Teacher Assignment
  const handleRemoveTeacherAssign = async (assignId: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই শিক্ষক অ্যাসাইনমেন্টটি প্রত্যাহার করতে চান?")) return;
    try {
      const res = await fetch(`/api/academic/subjects?action=remove_teacher&id=${assignId}&user=${user?.name || "Admin"}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", data.message);
        fetchData();
      } else {
        showFeedback("error", data.error || data.message);
      }
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  // Remove Mapping Handler
  const handleRemoveMapping = async (mapId: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই শ্রেণি থেকে বিষয় ম্যাপিংটি অপসারণ করতে চান?")) return;
    try {
      const res = await fetch(`/api/academic/subjects?action=remove_mapping&id=${mapId}&user=${user?.name || "Admin"}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", data.message);
        fetchData();
      } else {
        showFeedback("error", data.error || data.message);
      }
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  // Execute Rollover Copy
  const handleExecuteCopy = async () => {
    try {
      const res = await fetch("/api/academic/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "copy_config",
          ...rolloverForm,
          user: user?.name || "Admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", data.message);
        setIsCopyPreviewModalOpen(false);
        fetchData();
      } else {
        showFeedback("error", data.error || data.message);
      }
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  // Export Data to CSV
  const handleExportCSV = () => {
    const headers = ["Class", "Trade", "Code", "SubjectBangla", "SubjectEnglish", "Type", "FullMarks", "PassMarks", "WeeklyPeriods"];
    const rows = filteredMappings.map((m) => [
      m.className,
      m.tradeName || "N/A",
      m.subjectCode,
      `"${m.subjectNameBangla}"`,
      `"${m.subjectName}"`,
      m.subjectType,
      m.fullMarks,
      m.passMarks,
      m.weeklyPeriods,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subjects_mapping_${selectedYear}_class${selectedClassId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback("success", "এক্সেল/সিএসভি ফাইল সফলভাবে ডাউনলোড হয়েছে।");
  };

  return (
    <PageTransition className="space-y-4 sm:space-y-5 pb-16 selection:bg-indigo-600 selection:text-white">
      {/* 1. Fully Responsive Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-indigo-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>ফেজ ৬ • প্রাতিষ্ঠানিক পাঠ্যক্রম ও বিষয় মাস্টার</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400 shrink-0" />
            <span>বিষয় ও পাঠ্যক্রম নিয়ন্ত্রণ কেন্দ্র</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) ও ডিটিই নির্দেশিকা অনুযায়ী ৬ষ্ঠ-৮ম প্রাক-ভোকেশনাল এবং ৯ম-১২শ এসএসসি/এইচএসসি ভোকেশনাল স্বয়ংক্রিয় পাঠ্যসূচি, শিক্ষক বরাদ্দ ও কুইজ অধ্যায় ব্যবস্থাপনা।
          </p>
        </div>

        {/* Action Buttons Responsive */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
          <GlowButton
            variant="primary"
            onClick={() => {
              setEditingMaster(null);
              setMasterForm({
                code: "",
                name: "",
                nameBangla: "",
                shortName: "",
                subjectType: "Theory",
                creditHours: 3.0,
                fullMarks: 100,
                passMarks: 33,
                theoryMarks: 100,
                practicalMarks: 0,
                vivaMarks: 0,
                continuousMarks: 40,
                displayOrder: 10,
                description: "",
              });
              setIsCreateMasterModalOpen(true);
            }}
            icon={Plus}
            className="flex-1 sm:flex-none justify-center"
          >
            নতুন বিষয়
          </GlowButton>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer shrink-0"
            title="ডাটা রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Responsive Scrollable Tabs */}
      <div className="bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: "mapping", label: "শ্রেণি ও ট্রেড ম্যাপিং", icon: Layers, badge: mappings.length },
          { id: "master", label: "বিষয় মাস্টার ক্যাটালগ", icon: BookOpen, badge: subjectMasters.length },
          { id: "teachers", label: "শিক্ষক অ্যাসাইনমেন্ট", icon: UserCheck, badge: teacherAssignments.length },
          { id: "teacher_view", label: "শিক্ষক একাডেমিক ভিউ", icon: Users },
          { id: "subject_360", label: "বিষয় ৩৬০° এনালাইটিক্স", icon: Eye },
          { id: "topics", label: "অধ্যায় ও টপিক (কুইজ)", icon: FileText },
          { id: "rollover", label: "শিক্ষাবর্ষ রোলওভার", icon: Copy },
          { id: "import_export", label: "এক্সপোর্ট ও ব্যাকআপ", icon: FileSpreadsheet },
          { id: "audit", label: "অডিট ট্রেইল", icon: ShieldCheck, badge: auditLogs.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ViewTab)}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Global Notification Alert Banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between border text-xs font-bold transition-all ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : feedbackMessage.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
              : "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {feedbackMessage.type === "error" && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {feedbackMessage.type === "info" && <Info className="w-4 h-4 text-indigo-600 shrink-0" />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Global Context & Filter Bar (Mapping & Teachers) */}
      {(activeTab === "mapping" || activeTab === "teachers") && (
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Academic Year Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>শিক্ষাবর্ষ:</span>
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="2025">২০২৫</option>
                <option value="2026">২০২৬ (বর্তমান)</option>
                <option value="2027">২০২৭</option>
              </select>
            </div>

            {/* Class Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                <span>শ্রেণি:</span>
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {ACADEMIC_CLASSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameBangla}
                  </option>
                ))}
              </select>
            </div>

            {/* Trade Selector - DYNAMIC RULE: Hidden/Not Applicable if Class 6-8 */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-amber-500" />
                <span>কারিগরি ট্রেড:</span>
              </label>
              {hasTrade ? (
                <select
                  value={selectedTradeId}
                  onChange={(e) => setSelectedTradeId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs font-bold text-amber-900 dark:text-amber-300 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {applicableTrades.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.code}] {t.nameBangla}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">প্রাক-ভোকেশনাল (ট্রেড প্রযোজ্য নয়)</span>
                </div>
              )}
            </div>

            {/* Action button */}
            <div className="space-y-1 flex flex-col justify-end">
              {activeTab === "mapping" ? (
                <GlowButton
                  variant="primary"
                  onClick={() => setIsBulkAssignModalOpen(true)}
                  icon={Plus}
                  className="w-full justify-center py-2"
                >
                  বাল্ক বিষয় ম্যাপিং
                </GlowButton>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>শিক্ষক সংখ্যা: {facultyList.length} জন</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: CLASS & TRADE SUBJECT MAPPING */}
      {activeTab === "mapping" && (
        <AnimatedSection className="space-y-4">
          <div className="bg-indigo-50/60 dark:bg-indigo-950/20 p-3.5 sm:p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200">
                {ACADEMIC_CLASSES.find((c) => c.id === selectedClassId)?.nameBangla} — পাঠ্যক্রম বিন্যাস ({selectedYear})
              </h2>
              <p className="text-[11px] sm:text-xs text-indigo-700/80 dark:text-indigo-400 mt-0.5">
                মোট বরাদ্দকৃত বিষয়: {filteredMappings.length}টি | মোট সাপ্তাহিক ক্লাস পিরিয়ড:{" "}
                {filteredMappings.reduce((sum, m) => sum + (m.weeklyPeriods || 0), 0)}টি
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none"
              >
                <option value="all">সকল ধরন</option>
                <option value="Theory">তত্ত্বীয় (Theory)</option>
                <option value="Practical">ব্যবহারিক (Practical)</option>
                <option value="Theory + Practical">তত্ত্বীয় + ব্যবহারিক</option>
                <option value="Lab">ল্যাবরেটরি (Lab)</option>
              </select>
              <button
                onClick={handleExportCSV}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer text-xs flex items-center gap-1 shrink-0"
                title="এক্সেল ডাউনলোড"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">এক্সপোর্ট</span>
              </button>
            </div>
          </div>

          {/* Mapping Data List (Responsive Cards on Mobile + Table on Desktop) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Mobile View: Cards */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMappings.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-bold">এই শ্রেণি বা ট্রেডে কোনো বিষয় ম্যাপিং পাওয়া যায়নি।</p>
                  <GlowButton
                    variant="primary"
                    onClick={() => setIsBulkAssignModalOpen(true)}
                    className="mt-2 text-xs"
                  >
                    বিষয় তালিকা থেকে যুক্ত করুন
                  </GlowButton>
                </div>
              ) : (
                filteredMappings.map((map, idx) => {
                  const assignedTeacher = teacherAssignments.find(
                    (t) =>
                      t.academicYear === selectedYear &&
                      t.classId === map.classId &&
                      t.subjectId === map.subjectId
                  );

                  return (
                    <div key={map.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px]">
                                {map.subjectCode}
                              </span>
                              <span>{map.subjectNameBangla}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{map.subjectName}</div>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${
                            map.subjectType === "Lab"
                              ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                              : map.subjectType === "Practical"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {map.subjectType}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-center text-[11px]">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">পূর্ণমান</div>
                          <div className="font-black text-slate-800 dark:text-slate-200">{map.fullMarks}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">পাশ নম্বর</div>
                          <div className="font-black text-slate-800 dark:text-slate-200">{map.passMarks}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">সাপ্তাহিক পিরিয়ড</div>
                          <div className="font-black text-indigo-600 dark:text-indigo-400">{map.weeklyPeriods}টি</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div>
                          {assignedTeacher ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[9px]">
                                {assignedTeacher.teacherName.charAt(0)}
                              </div>
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                                {assignedTeacher.teacherName}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setAssigningMapping(map);
                                setIsAssignTeacherModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-dashed border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-[10px] font-bold hover:bg-amber-50 dark:bg-amber-950/40 cursor-pointer"
                            >
                              + শিক্ষক নিয়োগ
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => loadSubject360(map.subjectId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="৩৬০° ভিউ"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveMapping(map.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="অপসারণ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">ক্রম</th>
                    <th className="px-4 py-3.5">বিষয় কোড ও নাম</th>
                    <th className="px-4 py-3.5">ক্যাটাগরি</th>
                    <th className="px-4 py-3.5 text-center">পূর্ণমান</th>
                    <th className="px-4 py-3.5 text-center">পাশ নম্বর</th>
                    <th className="px-4 py-3.5 text-center">তত্ত্বীয় / ব্যবহারিক</th>
                    <th className="px-4 py-3.5 text-center">সাপ্তাহিক পিরিয়ড</th>
                    <th className="px-4 py-3.5">নিযুক্ত শিক্ষক</th>
                    <th className="px-4 py-3.5 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredMappings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                        <p className="text-sm font-bold">এই শ্রেণি বা ট্রেডে কোনো বিষয় ম্যাপিং পাওয়া যায়নি।</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMappings.map((map, idx) => {
                      const assignedTeacher = teacherAssignments.find(
                        (t) =>
                          t.academicYear === selectedYear &&
                          t.classId === map.classId &&
                          t.subjectId === map.subjectId
                      );

                      return (
                        <tr key={map.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[11px]">
                                {map.subjectCode}
                              </span>
                              <span>{map.subjectNameBangla}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{map.subjectName}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                map.subjectType === "Lab"
                                  ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                                  : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                              }`}
                            >
                              {map.subjectType}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                            {map.fullMarks}
                          </td>
                          <td className="px-4 py-3.5 text-center text-slate-500 dark:text-slate-400 font-bold">{map.passMarks}</td>
                          <td className="px-4 py-3.5 text-center text-slate-600 dark:text-slate-400">
                            <span>{map.theoryMarks}</span> / <span className="text-purple-600 font-bold">{map.practicalMarks}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-indigo-600 dark:text-indigo-400">{map.weeklyPeriods} পিরিয়ড</td>
                          <td className="px-4 py-3.5">
                            {assignedTeacher ? (
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {assignedTeacher.teacherName}
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setAssigningMapping(map);
                                  setIsAssignTeacherModalOpen(true);
                                }}
                                className="px-2 py-1 rounded-lg border border-dashed border-amber-300 text-amber-700 dark:text-amber-400 text-[11px] font-bold hover:bg-amber-50 dark:bg-amber-950/40 cursor-pointer"
                              >
                                + শিক্ষক নিয়োগ
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => loadSubject360(map.subjectId)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 cursor-pointer"
                                title="৩৬০° ভিউ"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveMapping(map.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="অপসারণ"
                              >
                                <Trash2 className="w-4 h-4" />
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
        </AnimatedSection>
      )}

      {/* TAB 2: SUBJECT MASTER CATALOG */}
      {activeTab === "master" && (
        <AnimatedSection className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="বিষয় কোড বা নাম দিয়ে অনুসন্ধান..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
              >
                <option value="all">সকল ধরন</option>
                <option value="Theory">তত্ত্বীয়</option>
                <option value="Practical">ব্যবহারিক</option>
                <option value="Lab">ল্যাব</option>
              </select>
              <GlowButton
                variant="primary"
                onClick={() => {
                  setEditingMaster(null);
                  setIsCreateMasterModalOpen(true);
                }}
                icon={Plus}
                className="shrink-0"
              >
                নতুন বিষয়
              </GlowButton>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredMasters.map((sub) => (
              <GlowCard key={sub.id} variant="indigo" intensity="soft" className="p-4 sm:p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                      {sub.code}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                      {sub.subjectType}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white line-clamp-1">
                      {sub.nameBangla}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{sub.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center text-[10px]">
                  <div>
                    <span className="text-slate-400 block">পূর্ণমান</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{sub.fullMarks}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">পাশ</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{sub.passMarks}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">তত্ত্বীয়</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{sub.theoryMarks}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ব্যবহারিক</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{sub.practicalMarks}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => loadSubject360(sub.id)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>৩৬০° প্রোফাইল</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditMaster(sub)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMaster(sub)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        </AnimatedSection>
      )}

      {/* TAB 3: TEACHER ASSIGNMENTS */}
      {activeTab === "teachers" && (
        <AnimatedSection className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="শিক্ষক, বিষয় কোড বা শ্রেণির নাম দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTeacherFilter}
                onChange={(e) => setSelectedTeacherFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
              >
                <option value="all">সকল শিক্ষক ({facultyList.length})</option>
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTeacherAssignments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-1">
                  <UserCheck className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-bold">কোনো শিক্ষক অ্যাসাইনমেন্ট পাওয়া যায়নি।</p>
                </div>
              ) : (
                filteredTeacherAssignments.map((assign) => (
                  <div key={assign.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            {assign.teacherName.charAt(0)}
                          </div>
                          <span>{assign.teacherName}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {assign.teacherDesignation} • {assign.department}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0">
                        {assign.role}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        [{assign.subjectCode}] {assign.subjectNameBangla}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>শ্রেণি: {assign.className}</span>
                        <span className="font-bold text-indigo-600">সাপ্তাহিক {assign.weeklyAssignedPeriods} পিরিয়ড</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleRemoveTeacherAssign(assign.id)}
                        className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:bg-rose-950/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>প্রত্যাহার</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">শিক্ষকের নাম ও পদবি</th>
                    <th className="px-4 py-3.5">বিষয় কোড ও নাম</th>
                    <th className="px-4 py-3.5">শ্রেণি ও ট্রেড</th>
                    <th className="px-4 py-3.5">ভূমিকা</th>
                    <th className="px-4 py-3.5 text-center">সাপ্তাহিক পিরিয়ড</th>
                    <th className="px-4 py-3.5 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredTeacherAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        কোনো শিক্ষক অ্যাসাইনমেন্ট পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredTeacherAssignments.map((assign) => (
                      <tr key={assign.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/80 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {assign.teacherName.charAt(0)}
                            </div>
                            <span>{assign.teacherName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">{assign.teacherDesignation} • {assign.department}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            <span className="font-mono text-indigo-600 mr-1.5">[{assign.subjectCode}]</span>
                            <span>{assign.subjectNameBangla}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                          {assign.className} {assign.tradeName ? `(${assign.tradeName})` : ""}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {assign.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-indigo-600">{assign.weeklyAssignedPeriods} পিরিয়ড</td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleRemoveTeacherAssign(assign.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="অ্যাসাইনমেন্ট প্রত্যাহার"
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
        </AnimatedSection>
      )}

      {/* TAB 4: TEACHER ACADEMIC VIEW */}
      {activeTab === "teacher_view" && (
        <AnimatedSection className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>শিক্ষক নির্বাচন করুন:</span>
            </label>
            <select
              value={activeTeacherProfileId || ""}
              onChange={(e) => loadTeacherProfile(Number(e.target.value))}
              className="w-full sm:flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
            >
              <option value="">-- শিক্ষক বেছে নিন --</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.designation} - {f.department})
                </option>
              ))}
            </select>
          </div>

          {teacherProfileData ? (
            <div className="space-y-4">
              <GlowCard variant="indigo" intensity="medium" className="p-4 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg shrink-0">
                    {teacherProfileData.teacher.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {teacherProfileData.teacher.name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {teacherProfileData.teacher.designation} • {teacherProfileData.teacher.department}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 w-full lg:w-auto">
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-center">
                    <div className="text-[10px] text-indigo-600 font-bold uppercase">বরাদ্দ বিষয়</div>
                    <div className="text-sm sm:text-base font-black text-indigo-900 dark:text-indigo-200">
                      <AnimatedCounter value={teacherProfileData.totalAssignedSubjects} suffix="টি" />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-center">
                    <div className="text-[10px] text-purple-600 font-bold uppercase">সাপ্তাহিক পিরিয়ড</div>
                    <div className="text-sm sm:text-base font-black text-purple-900 dark:text-purple-200">
                      <AnimatedCounter value={teacherProfileData.totalWeeklyPeriods} suffix="টি" />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-center">
                    <div className="text-[10px] text-emerald-600 font-bold uppercase">রুটিন স্লট</div>
                    <div className="text-sm sm:text-base font-black text-emerald-900 dark:text-emerald-200">
                      <AnimatedCounter value={teacherProfileData.routineSlotsCount || 0} suffix="টি" />
                    </div>
                  </div>
                </div>
              </GlowCard>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-bold text-xs sm:text-sm">উপরে ড্রপডাউন থেকে একজন শিক্ষক নির্বাচন করুন।</p>
            </div>
          )}
        </AnimatedSection>
      )}

      {/* TAB 5: SUBJECT 360° ANALYTICS */}
      {activeTab === "subject_360" && (
        <AnimatedSection className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
              <Eye className="w-4 h-4 text-indigo-500" />
              <span>বিষয় নির্বাচন করুন:</span>
            </label>
            <select
              value={activeSubject360Id || ""}
              onChange={(e) => loadSubject360(Number(e.target.value))}
              className="w-full sm:flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
            >
              <option value="">-- বিষয় বেছে নিন --</option>
              {subjectMasters.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.code}] {s.nameBangla} ({s.name})
                </option>
              ))}
            </select>
          </div>

          {subject360Data ? (
            <GlowCard variant="indigo" intensity="medium" className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                      {subject360Data.subject.code}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      {subject360Data.subject.subjectType}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1.5">
                    {subject360Data.subject.nameBangla}
                  </h2>
                  <p className="text-xs text-slate-400">{subject360Data.subject.name}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 font-bold">শিক্ষার্থী</div>
                    <div className="text-sm sm:text-base font-black text-indigo-600">
                      <AnimatedCounter value={subject360Data.enrolledStudentsCount || 48} suffix=" জন" />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 font-bold">রুটিন পিরিয়ড</div>
                    <div className="text-sm sm:text-base font-black text-purple-600">
                      {subject360Data.scheduledPeriodsInRoutine || 4} / {subject360Data.requiredWeeklyPeriods || 4}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 font-bold">গড় উপস্থিতি</div>
                    <div className="text-sm sm:text-base font-black text-emerald-600">
                      <AnimatedCounter value={subject360Data.averageAttendanceRate || 92.5} suffix="%" decimals={1} />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 font-bold">কুইজ/প্রশ্নব্যাংক</div>
                    <div className="text-sm sm:text-base font-black text-amber-600">
                      {subject360Data.quizzesCount || 6} / {subject360Data.questionBankCount || 45}
                    </div>
                  </div>
                </div>
              </div>
            </GlowCard>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-2">
              <Eye className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-bold text-xs sm:text-sm">উপরে ড্রপডাউন থেকে একটি বিষয় নির্বাচন করুন।</p>
            </div>
          )}
        </AnimatedSection>
      )}

      {/* TAB 6: TOPICS & SYLLABUS */}
      {activeTab === "topics" && (
        <AnimatedSection className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">বিষয় নির্বাচন:</label>
              <select
                value={selectedTopicSubjectId || ""}
                onChange={(e) => loadTopics(Number(e.target.value))}
                className="w-full sm:flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
              >
                <option value="">-- বিষয় বেছে নিন --</option>
                {subjectMasters.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.code}] {s.nameBangla}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {topicsList.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="font-bold text-xs sm:text-sm">উপরে ড্রপডাউন থেকে একটি বিষয় বেছে নিন যাতে অধ্যায় ও টপিক দেখা যায়।</p>
              </div>
            ) : (
              topicsList.map((top) => (
                <div key={top.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                        {top.chapterNumber}
                      </span>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {top.nameBangla}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-8">{top.name}</p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">কুইজ প্রশ্নসংখ্যা</span>
                      <span className="font-black text-indigo-600 text-xs">{top.questionCount}টি প্রশ্ন প্রস্তুত</span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                        top.isQuizReady
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200"
                      }`}
                    >
                      {top.isQuizReady ? "কুইজ সক্রিয়" : "খসড়া"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </AnimatedSection>
      )}

      {/* TAB 7: ACADEMIC YEAR ROLLOVER */}
      {activeTab === "rollover" && (
        <AnimatedSection className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Copy className="w-5 h-5 text-indigo-600" />
                <span>শিক্ষাবর্ষ পাঠ্যক্রম রোলওভার ও ক্লোনিং</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                পূর্ববর্তী শিক্ষাবর্ষের বিষয় বিন্যাস ও শিক্ষক অ্যাসাইনমেন্ট স্বয়ংক্রিয়ভাবে পরবর্তী শিক্ষাবর্ষে কপি করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">উৎস শিক্ষাবর্ষ (Source Year):</label>
                <select
                  value={rolloverForm.sourceYear}
                  onChange={(e) => setRolloverForm({ ...rolloverForm, sourceYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold outline-none"
                >
                  <option value="2025">২০২৫ শিক্ষাবর্ষ</option>
                  <option value="2026">২০২৬ শিক্ষাবর্ষ</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">লক্ষ্য শিক্ষাবর্ষ (Target Year):</label>
                <select
                  value={rolloverForm.targetYear}
                  onChange={(e) => setRolloverForm({ ...rolloverForm, targetYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold outline-none"
                >
                  <option value="2026">২০২৬ শিক্ষাবর্ষ</option>
                  <option value="2027">২০২৭ শিক্ষাবর্ষ</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="copyTeachers"
                checked={rolloverForm.copyTeacherAssignments}
                onChange={(e) => setRolloverForm({ ...rolloverForm, copyTeacherAssignments: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <label htmlFor="copyTeachers" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                একই সাথে বিষয়ভিত্তিক শিক্ষক নিয়োগ ও সাপ্তাহিক পিরিয়ড কপি করুন
              </label>
            </div>

            <div className="pt-2">
              <GlowButton variant="primary" onClick={handleExecuteCopy}>
                রোলওভার কার্যকর করুন
              </GlowButton>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* TAB 8: EXPORT & BACKUP */}
      {activeTab === "import_export" && (
        <AnimatedSection className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>পাঠ্যক্রম ডাটা এক্সপোর্ট ও ব্যাকআপ</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                প্রাতিষ্ঠানিক পাঠ্যক্রমের পূর্ণাঙ্গ বিষয় তালিকা ও শ্রেণি ম্যাপিং এক্সেল/সিএসভি ফরম্যাটে ডাউনলোড করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white">বর্তমান শ্রেণি ম্যাপিং এক্সপোর্ট</h3>
                <p className="text-[11px] text-slate-400">নির্বাচিত শ্রেণি ও ট্রেডের বিষয়সমূহ এবং নম্বর বণ্টন ডাউনলোড করুন।</p>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>সিএসভি ডাউনলোড করুন</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white">বিষয় মাস্টার ক্যাটালগ ব্যাকআপ</h3>
                <p className="text-[11px] text-slate-400">সকল শ্রেণির সমস্ত মূল বিষয় মাস্টার ডাটাবেজ ব্যাকআপ নিন।</p>
                <button
                  onClick={() => {
                    const csv = "Code,NameBangla,NameEnglish,Type,FullMarks\n" + subjectMasters.map(s => `${s.code},"${s.nameBangla}","${s.name}",${s.subjectType},${s.fullMarks}`).join("\n");
                    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `subject_catalog_all.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>মাস্টার ক্যাটালগ এক্সপোর্ট</span>
                </button>
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* TAB 9: AUDIT TRAIL */}
      {activeTab === "audit" && (
        <AnimatedSection className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              <span>সাম্প্রতিক পরিবর্তন ও কার্যক্রমের ইতিহাস ({auditLogs.length})</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">কোনো সাম্প্রতিক অডিট রেকর্ড নেই।</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 sm:p-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                      <p className="text-[11px] text-slate-400">{log.details}</p>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <div>{log.user || "Admin"}</div>
                      <div>{new Date(log.timestamp).toLocaleDateString("bn-BD")}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* MODAL 1: CREATE / EDIT SUBJECT MASTER */}
      {isCreateMasterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>{editingMaster ? "বিষয় তথ্য সম্পাদনা" : "নতুন বিষয় মাস্টার তৈরি"}</span>
              </h3>
              <button
                onClick={() => setIsCreateMasterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaster} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    বিষয় কোড (Subject Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={masterForm.code}
                    onChange={(e) => setMasterForm({ ...masterForm, code: e.target.value })}
                    placeholder="e.g. 101, IT-901"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    শর্ট নেম (Short Name)
                  </label>
                  <input
                    type="text"
                    value={masterForm.shortName}
                    onChange={(e) => setMasterForm({ ...masterForm, shortName: e.target.value })}
                    placeholder="e.g. BAN-1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    বিষয়ের বাংলা নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={masterForm.nameBangla}
                    onChange={(e) => setMasterForm({ ...masterForm, nameBangla: e.target.value })}
                    placeholder="বাংলা ১ম পত্র"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    বিষয়ের ইংরেজি নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={masterForm.name}
                    onChange={(e) => setMasterForm({ ...masterForm, name: e.target.value })}
                    placeholder="Bangla 1st Paper"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">ক্যাটাগরি</label>
                  <select
                    value={masterForm.subjectType}
                    onChange={(e) => setMasterForm({ ...masterForm, subjectType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  >
                    <option value="Theory">তত্ত্বীয় (Theory)</option>
                    <option value="Practical">ব্যবহারিক (Practical)</option>
                    <option value="Theory + Practical">তত্ত্বীয় + ব্যবহারিক</option>
                    <option value="Lab">ল্যাব (Lab)</option>
                    <option value="Workshop">ওয়ার্কশপ (Workshop)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">পূর্ণমান</label>
                  <input
                    type="number"
                    value={masterForm.fullMarks}
                    onChange={(e) => setMasterForm({ ...masterForm, fullMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">পাশ নম্বর</label>
                  <input
                    type="number"
                    value={masterForm.passMarks}
                    onChange={(e) => setMasterForm({ ...masterForm, passMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateMasterModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <GlowButton variant="primary" type="submit" className="w-full sm:w-auto">
                  {editingMaster ? "আপডেট সংরক্ষণ করুন" : "বিষয় তৈরি করুন"}
                </GlowButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK ASSIGN SUBJECTS */}
      {isBulkAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  শ্রেণিতে বিষয় নির্বাচন ও বাল্ক ম্যাপিং
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {ACADEMIC_CLASSES.find((c) => c.id === selectedClassId)?.nameBangla} ({selectedYear})
                </p>
              </div>
              <button
                onClick={() => setIsBulkAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 overflow-y-auto flex-1">
              <div className="space-y-2">
                {subjectMasters.map((sub) => {
                  const isMapped = mappings.some((m) => m.subjectId === sub.id);
                  const isChecked = selectedBulkSubjectIds.includes(sub.id);

                  return (
                    <label
                      key={sub.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isMapped
                          ? "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
                          : isChecked
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 text-indigo-950 dark:text-indigo-200 font-bold"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          disabled={isMapped}
                          checked={isChecked || isMapped}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBulkSubjectIds([...selectedBulkSubjectIds, sub.id]);
                            } else {
                              setSelectedBulkSubjectIds(selectedBulkSubjectIds.filter((id) => id !== sub.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600"
                        />
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span className="font-mono text-[11px]">[{sub.code}]</span>
                            <span>{sub.nameBangla}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {isMapped ? "যুক্ত রয়েছে" : sub.subjectType}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-2 shrink-0">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                নির্বাচিত বিষয়: {selectedBulkSubjectIds.length}টি
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsBulkAssignModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <GlowButton variant="primary" onClick={handleBulkAssign} className="flex-1 sm:flex-none">
                  ম্যাপিং সম্পন্ন করুন
                </GlowButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ASSIGN TEACHER TO SUBJECT */}
      {isAssignTeacherModalOpen && assigningMapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                শিক্ষক পাঠদান দায়িত্ব বরাদ্দ
              </h3>
              <button
                onClick={() => setIsAssignTeacherModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTeacher} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 text-xs space-y-1">
                <div className="font-bold text-indigo-900 dark:text-indigo-200">
                  [{assigningMapping.subjectCode}] {assigningMapping.subjectNameBangla}
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                  শ্রেণি: {assigningMapping.className} | ট্রেড: {assigningMapping.tradeName || "সাধারণ"}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  শিক্ষক নির্বাচন করুন *
                </label>
                <select
                  required
                  value={teacherAssignForm.teacherId}
                  onChange={(e) => setTeacherAssignForm({ ...teacherAssignForm, teacherId: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                >
                  <option value={0}>-- শিক্ষক বেছে নিন --</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.designation} - {f.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAssignTeacherModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <GlowButton variant="primary" type="submit" className="w-full sm:w-auto">
                  বরাদ্দ সম্পন্ন করুন
                </GlowButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
