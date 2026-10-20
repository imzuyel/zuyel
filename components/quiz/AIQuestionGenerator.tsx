"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Settings,
  HelpCircle,
  Layers,
  Check,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  RotateCw,
  AlertTriangle,
  Play,
  ChevronDown,
  ChevronUp,
  History,
  BookOpen,
  AlertCircle,
  RefreshCw,
  FileCheck,
  FileText,
  ArrowRight,
  Wand2,
  Info,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { PRE_VOCATIONAL_SUBJECTS, COMMON_SUBJECTS_9_12 } from "@/lib/academicStructure";
import PdfLibraryView from "./PdfLibraryView";
import { useAuth } from "@/context/AuthContext";

interface Subject {
  id: number;
  name: string;
  nameBangla: string;
  code: string;
}

interface ClassItem {
  id: number;
  name: string;
  nameBangla: string;
  shift?: string;
}

interface QuizItem {
  id: string;
  title: string;
  category: string;
}

interface AIGenerationJob {
  id: string;
  topic: string;
  subjectId: number;
  classId: number;
  questionType: string;
  questionCount: number;
  difficulty: string;
  language: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  errorMessage?: string;
  createdAt: string;
}

interface AIGeneratedQuestion {
  id: string;
  generationJobId: string;
  type: string;
  questionText: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  questionData: any;
  status: "generated" | "reviewed" | "approved" | "rejected" | "saved";
  duplicateHash?: string;
  isDuplicate?: boolean;
  possibleMatches?: any[];
}

interface AIQuestionGeneratorProps {
  initialSubTab?: "generate" | "pdf_library" | "history";
}

export default function AIQuestionGenerator({
  initialSubTab = "generate"
}: AIQuestionGeneratorProps = {}) {
  const { currentUser, hasCustomPermission, isSuperOrPrincipal } = useAuth();
  // Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState<"generate" | "pdf_library" | "history">(initialSubTab);

  // Applet Database States (Loaded from APIs)
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);

  // Generation Config States
  const [topic, setTopic] = useState("");
  const [selectedClass, setSelectedClass] = useState("4"); // Default Class 9
  const [selectedSubject, setSelectedSubject] = useState("1"); // Default Subject English
  const [chapter, setChapter] = useState("");
  const [lesson, setLesson] = useState("");
  const [learningObjective, setLearningObjective] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [selectedEngine, setSelectedEngine] = useState<"gemini" | "openai" | "claude" | "grok">("gemini");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["mcq_single"]);
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("medium");
  const [language, setLanguage] = useState<"Bangla" | "English" | "Bilingual">("Bangla");
  const [selectedPdfId, setSelectedPdfId] = useState<string>("");
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);

  // Quality checkmarks
  const [qualityOptions, setQualityOptions] = useState({
    includeExplanations: true,
    useCurriculumWording: true,
    avoidAmbiguous: true,
    avoidOverlyEasy: false,
  });

  // Dynamic status/progress indicator list for realistic generation
  const [generationSteps, setGenerationSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  // Status & Progress states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // History & Active Job Results
  const [historyJobs, setHistoryJobs] = useState<AIGenerationJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<AIGenerationJob | null>(null);
  const [batchQuestions, setBatchQuestions] = useState<AIGeneratedQuestion[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Editing & Refining Workspace
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState("");
  const [editedExplanation, setEditedExplanation] = useState("");
  const [editedDifficulty, setEditedDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [editedData, setEditedData] = useState<any>(null);

  // Refinement Instructions
  const [refinementText, setRefinementText] = useState("");
  const [isRefining, setIsRefining] = useState<string | null>(null); // holds questionId

  // Action states
  const [isSavingSelected, setIsSavingSelected] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [showAddToQuizModal, setShowAddToQuizModal] = useState(false);

  // Success Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // PHASE 3 — PDF Document Management & Generation States
  const [pdfDocuments, setPdfDocuments] = useState<any[]>([]);
  const [pdfStats, setPdfStats] = useState<any>({
    totalDocuments: 0,
    processedCount: 0,
    processingCount: 0,
    pendingCount: 0,
    failedCount: 0,
    archivedCount: 0,
    totalQuestionsCount: 0,
  });
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfSearch, setPdfSearch] = useState("");
  const [pdfFilterSubject, setPdfFilterSubject] = useState("all");
  const [pdfFilterClass, setPdfFilterClass] = useState("all");
  const [pdfFilterStatus, setPdfFilterStatus] = useState("all");
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(1);

  // Upload States
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfDescription, setPdfDescription] = useState("");
  const [pdfSubjectId, setPdfSubjectId] = useState("1");
  const [pdfClassId, setPdfClassId] = useState("4");
  const [pdfChapter, setPdfChapter] = useState("");
  const [pdfTopic, setPdfTopic] = useState("");
  const [pdfTags, setPdfTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Active Document Preview & Generation Workspace States
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docPages, setDocPages] = useState<any[]>([]);
  const [previewTab, setPreviewTab] = useState<"preview" | "generation" | "history">("preview");
  const [docPageChecklist, setDocPageChecklist] = useState<number[]>([]);
  
  // PDF grounded generation states
  const [pdfGenTopic, setPdfGenTopic] = useState("");
  const [pdfGenCount, setPdfGenCount] = useState(5);
  const [pdfGenTypes, setPdfGenTypes] = useState<string[]>(["mcq_single"]);
  const [pdfGenDifficulty, setPdfGenDifficulty] = useState<string>("medium");
  const [pdfGenLanguage, setPdfGenLanguage] = useState<"Bangla" | "English">("Bangla");
  const [pdfGenInstructions, setPdfGenInstructions] = useState("");
  const [isGeneratingFromPdf, setIsGeneratingFromPdf] = useState(false);
  const [pdfGeneratedQuestions, setPdfGeneratedQuestions] = useState<any[]>([]);
  const [docHistoryJobs, setDocHistoryJobs] = useState<any[]>([]);
  const [docHistoryQuestions, setDocHistoryQuestions] = useState<any[]>([]);

  const fetchPdfDocuments = async () => {
    setIsPdfLoading(true);
    try {
      const q = new URLSearchParams({
        search: pdfSearch,
        subjectId: pdfFilterSubject,
        classId: pdfFilterClass,
        status: pdfFilterStatus,
        page: pdfPage.toString(),
        limit: "8",
      });
      const res = await fetch(`/api/quiz/documents?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPdfDocuments(data.documents);
          setPdfStats(data.stats);
          setPdfTotalPages(data.pagination.totalPages);
        }
      }
    } catch (e) {
      console.error("Error loading PDF documents:", e);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/ai/questions/generations");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHistoryJobs(data.generations);
        }
      }
    } catch (e) {
      console.error("Error loading past jobs history:", e);
    }
  };

  // Load Metadata & History
  useEffect(() => {
    let isMounted = true;

    const loadMetadataAndHistory = async () => {
      try {
        // Load classes
        const cRes = await fetch("/api/students");
        if (cRes.ok && isMounted) {
          const cData = await cRes.json();
          // Extract distinct classes or use default list
          const distinctClasses = Array.isArray(cData.students)
            ? Array.from(new Set(cData.students.map((s: any) => s.classVal))).map((val, idx) => ({
                id: idx + 1,
                name: `Class ${val}`,
                nameBangla: `${val}ম শ্রেণি`,
              }))
            : [];
          setClasses(distinctClasses.length ? distinctClasses : [
            { id: 1, name: "Class 6", nameBangla: "৬ষ্ঠ শ্রেণি" },
            { id: 2, name: "Class 7", nameBangla: "৭ম শ্রেণি" },
            { id: 3, name: "Class 8", nameBangla: "৮ম শ্রেণি" },
            { id: 4, name: "Class 9", nameBangla: "৯ম শ্রেণি" },
            { id: 5, name: "Class 10", nameBangla: "১০ম শ্রেণি" },
            { id: 6, name: "Class 11", nameBangla: "১১শ শ্রেণি" },
            { id: 7, name: "Class 12", nameBangla: "১২শ শ্রেণি" },
          ]);
        }

        // Load subjects
        const combinedSubjects = [...PRE_VOCATIONAL_SUBJECTS, ...COMMON_SUBJECTS_9_12];
        if (isMounted) {
          setSubjects(combinedSubjects.map((s) => ({
            id: s.id,
            name: s.name,
            nameBangla: s.nameBangla,
            code: s.code,
          })));
        }

        // Load quizzes
        const qRes = await fetch("/api/quizzes");
        if (qRes.ok && isMounted) {
          const qData = await qRes.json();
          if (qData.success && Array.isArray(qData.quizzes)) {
            setQuizzes(qData.quizzes);
          }
        }

        // Load History
        const hRes = await fetch("/api/ai/questions/generations");
        if (hRes.ok && isMounted) {
          const hData = await hRes.json();
          if (hData.success) {
            setHistoryJobs(hData.generations);
          }
        }
      } catch (e) {
        console.error("Error loading generator metadata:", e);
      }
    };

    loadMetadataAndHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  // Perform PDF documents load when filters or pagination change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPdfDocuments();
    }, 0);
    return () => clearTimeout(timer);
  }, [pdfSearch, pdfFilterSubject, pdfFilterClass, pdfFilterStatus, pdfPage]);

  // Perform AI Question Generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    // DIRECTIVE 1 & 3: RBAC Clearance Verification
    if (currentUser.role === "student") {
      showToast("জিরো-ট্রাস্ট শিক্ষার্থী সুরক্ষা নীতি: শিক্ষার্থীরা AI প্রশ্ন জেনারেশন স্টুডিও ব্যবহারের অনুমতিপ্রাপ্ত নয়।", "error");
      return;
    }
    if (!isSuperOrPrincipal && !hasCustomPermission("generate_ai_questions")) {
      showToast("প্রশাসনিক ক্লিয়ারেন্স প্রয়োজন: আপনার অ্যাকাউন্টে 'generate_ai_questions' পারমিশন অনুমোদন দেওয়া হয়নি।", "error");
      return;
    }

    if (!topic.trim()) {
      showToast("দয়া করে প্রশ্ন তৈরির টপিক/বিষয়টি লিখুন।", "error");
      return;
    }

    setIsGenerating(true);
    setGenerationStatus("loading");
    setErrorMessage("");
    setSelectedJob(null);
    setBatchQuestions([]);

    // Initialize animation steps for realistic loading
    const steps = [
      "Connecting securely to Google Gemini AI Engine...",
      "Parsing institutional curriculum guidelines...",
      "Analyzing topic and target cognitive difficulty constraints...",
      "Synthesizing high-quality structured questions and answers...",
      "Validating response schemas and checking format compliance...",
      "Executing standard duplicate checks against Question Bank...",
      "Finalizing question snapshot batch..."
    ];
    setGenerationSteps(steps);
    setCurrentStepIndex(0);

    // Simulate step progression
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        clearInterval(stepInterval);
        return prev;
      });
    }, 1500);

    try {
      const response = await fetch("/api/ai/questions/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser.role,
          "x-user-id": String(currentUser.id),
          "x-user-name": currentUser.nameBangla || currentUser.fullName,
        },
        body: JSON.stringify({
          topic: topic.trim(),
          classId: selectedClass,
          subjectId: selectedSubject,
          chapter,
          lesson,
          learningObjective,
          additionalInstructions,
          questionType: selectedTypes.join(","),
          count: questionCount,
          difficulty,
          language,
          referencePdfId: selectedPdfId || undefined,
          qualityOptions,
          aiEngine: selectedEngine,
        }),
      });

      clearInterval(stepInterval);
      const data = await response.json();

      if (response.ok && data.success) {
        setGenerationStatus("success");
        setSelectedJob(data.job);
        setBatchQuestions(data.questions);
        setSelectedQuestionIds(data.questions.map((q: any) => q.id));
        showToast(`${data.questions.length}টি প্রশ্ন সফলভাবে তৈরি হয়েছে!`, "success");
        fetchHistory(); // refresh history logs
      } else {
        setGenerationStatus("error");
        setErrorMessage(data.message || "প্রশ্ন তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        showToast(data.message || "প্রশ্ন তৈরি ব্যর্থ হয়েছে", "error");
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setGenerationStatus("error");
      setErrorMessage(err.message || "নেটওয়ার্ক ত্রুটি। সার্ভারের সাথে সংযোগ করা যায়নি।");
      showToast("সার্ভার ত্রুটি ঘটেছে", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch past job details to review
  const handleInspectJob = async (job: AIGenerationJob) => {
    setSelectedJob(job);
    setBatchQuestions([]);
    setGenerationStatus("success");
    setActiveSubTab("generate"); // switch to view questions

    try {
      const res = await fetch(`/api/ai/questions/generations/${job.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBatchQuestions(data.questions);
          setSelectedQuestionIds(data.questions.map((q: any) => q.id));
        } else {
          showToast("রেকর্ড লোড করা যায়নি", "error");
        }
      }
    } catch (e) {
      showToast("নেটওয়ার্ক ত্রুটি ঘটেছে", "error");
    }
  };

  // Start Inline Edit mode for a question
  const startEditing = (q: AIGeneratedQuestion) => {
    setEditingQuestionId(q.id);
    setEditedText(q.questionText);
    setEditedExplanation(q.explanation);
    setEditedDifficulty(q.difficulty);
    setEditedData(JSON.parse(JSON.stringify(q.questionData)));
  };

  // Save updated local question state via PATCH API
  const saveEditedQuestion = async (id: string) => {
    try {
      const res = await fetch(`/api/ai/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: editedText,
          explanation: editedExplanation,
          difficulty: editedDifficulty,
          questionData: editedData,
          status: "reviewed",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBatchQuestions((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...data.question, status: "reviewed" } : item))
          );
          setEditingQuestionId(null);
          showToast("প্রশ্ন আপডেট করা হয়েছে!", "success");
        }
      } else {
        showToast("সংরক্ষণ ব্যর্থ হয়েছে", "error");
      }
    } catch (e) {
      showToast("সার্ভার ত্রুটি ঘটেছে", "error");
    }
  };

  // Delete question from batch using DELETE API
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই প্রশ্নটি এই ব্যাচ থেকে মুছে ফেলতে চান?")) return;

    try {
      const res = await fetch(`/api/ai/questions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setBatchQuestions((prev) => prev.filter((item) => item.id !== id));
        setSelectedQuestionIds((prev) => prev.filter((qId) => qId !== id));
        showToast("প্রশ্নটি মুছে ফেলা হয়েছে।", "success");
      } else {
        showToast("মুছে ফেলা যায়নি", "error");
      }
    } catch (e) {
      showToast("ত্রুটি ঘটেছে", "error");
    }
  };

  // Re-generate individual question with AI based on parent parameters
  const handleRegenerateSingle = async (id: string) => {
    setIsRefining(id);
    try {
      const res = await fetch(`/api/ai/questions/${id}/regenerate`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBatchQuestions((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...data.question } : item))
          );
          showToast("সফলভাবে নতুন বিকল্প প্রশ্ন তৈরি করা হয়েছে!", "success");
        } else {
          showToast(data.message || "পুনরায় তৈরি করা যায়নি", "error");
        }
      } else {
        showToast("সার্ভার ত্রুটি ঘটেছে", "error");
      }
    } catch (e) {
      showToast("সংযোগ ব্যর্থ হয়েছে", "error");
    } finally {
      setIsRefining(null);
    }
  };

  // Refine single question based on teacher instructions
  const handleRefineSingle = async (id: string) => {
    if (!refinementText.trim()) {
      showToast("দয়া করে রিফাইন করার নির্দেশনাটি লিখুন।", "error");
      return;
    }

    setIsRefining(id);
    try {
      const res = await fetch(`/api/ai/questions/${id}/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: refinementText.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBatchQuestions((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...data.question } : item))
          );
          setRefinementText("");
          showToast("এআই দিয়ে প্রশ্ন সফলভাবে রিফাইন ও সংশোধন করা হয়েছে!", "success");
        } else {
          showToast(data.message || "রিফাইন করা যায়নি", "error");
        }
      } else {
        showToast("ত্রুটি ঘটেছে", "error");
      }
    } catch (e) {
      showToast("সার্ভার ত্রুটি ঘটেছে", "error");
    } finally {
      setIsRefining(null);
    }
  };

  // Save selected questions to Question Bank
  const handleSaveSelectedToBank = async () => {
    if (selectedQuestionIds.length === 0) {
      showToast("কোনো প্রশ্ন সিলেক্ট করা নেই।", "error");
      return;
    }

    setIsSavingSelected(true);
    try {
      const res = await fetch("/api/ai/questions/save-selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: selectedQuestionIds }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Update status of questions in current view
          setBatchQuestions((prev) =>
            prev.map((item) => (selectedQuestionIds.includes(item.id) ? { ...item, status: "saved" } : item))
          );
          showToast(`${selectedQuestionIds.length}টি প্রশ্ন সফলভাবে সেন্ট্রাল কোয়েশ্চেন ব্যাংকে সংরক্ষণ করা হয়েছে!`, "success");
        } else {
          showToast(data.message || "সংরক্ষণ ব্যর্থ হয়েছে", "error");
        }
      } else {
        showToast("ত্রুটি ঘটেছে", "error");
      }
    } catch (e) {
      showToast("সার্ভার সংযোগ ত্রুটি", "error");
    } finally {
      setIsSavingSelected(false);
    }
  };

  // Add selected questions to selected Quiz
  const handleAddSelectedToQuiz = async () => {
    if (!selectedQuizId) {
      showToast("দয়া করে একটি কুইজ সিলেক্ট করুন।", "error");
      return;
    }

    setIsSavingSelected(true);
    try {
      const res = await fetch("/api/ai/questions/add-to-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIds: selectedQuestionIds,
          quizId: selectedQuizId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBatchQuestions((prev) =>
            prev.map((item) => (selectedQuestionIds.includes(item.id) ? { ...item, status: "saved" } : item))
          );
          setShowAddToQuizModal(false);
          showToast(`${selectedQuestionIds.length}টি প্রশ্ন সফলভাবে কুইজে যুক্ত করা হয়েছে!`, "success");
        } else {
          showToast(data.message || "যোগ করা যায়নি", "error");
        }
      } else {
        showToast("সার্ভার ত্রুটি", "error");
      }
    } catch (e) {
      showToast("সার্ভার সংযোগ ত্রুটি", "error");
    } finally {
      setIsSavingSelected(false);
    }
  };

  // Toggle selection checkmark of a question
  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select/deselect all questions in current batch
  const toggleSelectAll = () => {
    if (selectedQuestionIds.length === batchQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(batchQuestions.map((q) => q.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 animate-fade-in ${
          toastMessage.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
            : toastMessage.type === "error"
            ? "bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
            : "bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200"
        }`}>
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span className="text-xs font-bold font-sans">{toastMessage.text}</span>
        </div>
      )}

      {/* Primary Generator Header Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-500/30 backdrop-blur-md rounded-full text-[10px] uppercase font-mono tracking-widest text-indigo-300 font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-current" /> AI COGNITIVE GENERATOR
            </span>
            <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[9px] rounded-full font-black uppercase">
              Phase 2 Active
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            এআই প্রশ্ন ব্যাংক ক্রিয়েটর <span className="text-xs font-normal text-indigo-200 font-mono">(AI Arena)</span>
          </h1>
          <p className="text-xs text-indigo-200 max-w-2xl font-medium leading-relaxed">
            Google Gemini 3.8-Flash মডেলের মাধ্যমে যেকোনো কারিগরি ও সাধারণ বিষয়ে বোর্ড সিলেবাস অনুযায়ী স্বয়ংক্রিয়ভাবে বহুবিধ সৃজনশীল প্রশ্ন তৈরি করুন এবং যাচাই ও রিভিউ করে সরাসরি পরীক্ষা ও কুইজ সেকশনে অ্যাড করুন।
          </p>
        </div>

        {/* Dynamic Navigation Sub Tabs */}
        <div className="flex bg-indigo-950/60 p-1.5 rounded-2xl border border-indigo-700/40 self-stretch md:self-auto text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveSubTab("generate")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === "generate" ? "bg-indigo-600 text-white shadow-md font-black" : "text-indigo-300 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>নতুন জেনারেশন</span>
          </button>
          <button
            onClick={() => setActiveSubTab("pdf_library")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === "pdf_library" ? "bg-indigo-600 text-white shadow-md font-black" : "text-indigo-300 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>পিডিএফ ডকুমেন্ট লাইব্রেরি (Phase 3)</span>
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === "history" ? "bg-indigo-600 text-white shadow-md font-black" : "text-indigo-300 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            <span>জেনারেশন রেকর্ডস ({historyJobs.length})</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER CONTENT */}
      {activeSubTab === "generate" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Setup Configuration Panel */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-5 text-xs font-bold shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <span>পরামিতি সেটআপ (Generator Parameters)</span>
              </h3>
              <span className="text-[10px] text-slate-400 uppercase font-mono">BTEB Standards</span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Multi-AI Model Provider Choice Engine */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-slate-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-indigo-900 dark:text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    <span>এআই মডেল ইঞ্জিন পছন্দ (Select AI Provider)</span>
                  </label>
                  <span className="text-[9px] font-mono font-bold text-indigo-600 dark:text-cyan-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
                    {selectedEngine === "gemini" && "Gemini 3.8 Flash"}
                    {selectedEngine === "openai" && "OpenAI GPT-4o"}
                    {selectedEngine === "claude" && "Claude 3.5 Sonnet"}
                    {selectedEngine === "grok" && "xAI Grok-3 Engine"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedEngine("gemini")}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2 ${
                      selectedEngine === "gemini"
                        ? "bg-white dark:bg-slate-800 border-indigo-500 shadow-xs ring-2 ring-indigo-500/30"
                        : "bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-base shrink-0">♊</span>
                    <div className="min-w-0">
                      <span className="block font-black text-[11px] text-slate-900 dark:text-white truncate">Google Gemini</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400 truncate">3.8 Flash (Fast BTEB)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedEngine("openai")}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2 ${
                      selectedEngine === "openai"
                        ? "bg-white dark:bg-slate-800 border-emerald-500 shadow-xs ring-2 ring-emerald-500/30"
                        : "bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-base shrink-0">🟢</span>
                    <div className="min-w-0">
                      <span className="block font-black text-[11px] text-slate-900 dark:text-white truncate">OpenAI GPT-4o</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400 truncate">Math & Code Logic</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedEngine("claude")}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2 ${
                      selectedEngine === "claude"
                        ? "bg-white dark:bg-slate-800 border-purple-500 shadow-xs ring-2 ring-purple-500/30"
                        : "bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-base shrink-0">🟣</span>
                    <div className="min-w-0">
                      <span className="block font-black text-[11px] text-slate-900 dark:text-white truncate">Claude 3.5</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400 truncate">Linguistic Precision</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedEngine("grok")}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2 ${
                      selectedEngine === "grok"
                        ? "bg-white dark:bg-slate-800 border-rose-500 shadow-xs ring-2 ring-rose-500/30"
                        : "bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-base shrink-0">🚀</span>
                    <div className="min-w-0">
                      <span className="block font-black text-[11px] text-slate-900 dark:text-white truncate">xAI Grok-3</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400 truncate">Technical Insights</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Target Topic Input */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>প্রশ্ন তৈরির বিষয়বস্তু / টপিক (Topic) *</span>
                  <span title="টপিকের মূল কি-ওয়ার্ড লিখুন যেমন: ওহমের সূত্র, IoT Basics, AC motor repair">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আরডুইনো আরডিপি, রেজিস্ট্যান্স হিসাব, ওহমের সূত্র..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Subject and Class Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">শ্রেণি (Target Class)</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {language === "Bangla" ? c.nameBangla : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">শিক্ষাবর্ষের বিষয় (Subject)</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {language === "Bangla" ? s.nameBangla : s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sub-context (Chapter & Lesson) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-400">অধ্যায় (Chapter/Module - Optional)</label>
                  <input
                    type="text"
                    placeholder="যেমন: প্রথম অধ্যায়"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-400">পাঠ (Lesson - Optional)</label>
                  <input
                    type="text"
                    placeholder="যেমন: পাঠ ১.৩"
                    value={lesson}
                    onChange={(e) => setLesson(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              {/* Learning Objective & Cognitive Level */}
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400">লার্নিং অবজেক্টিভ (Learning Objective - Optional)</label>
                <input
                  type="text"
                  placeholder="যেমন: শিক্ষার্থীরা ওহমের সূত্র ব্যবহার করে রোধ নির্ণয় করতে পারবে"
                  value={learningObjective}
                  onChange={(e) => setLearningObjective(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium"
                />
              </div>

              {/* Question Type Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                    <span>প্রশ্নপত্রের ধরন (Question Types) *</span>
                  </label>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
                    এক বা একাধিক সিলেক্ট করুন
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "mcq_single", label: "MCQ (একক উত্তর)" },
                    { id: "mcq_multiple", label: "MCQ (বহু উত্তর)" },
                    { id: "true_false", label: "সত্য / মিথ্যা" },
                    { id: "matching", label: "বাম-ডান মিলকরণ" },
                    { id: "ordering", label: "ক্রম বিন্যাস" },
                    { id: "fill_blank", label: "শূন্যস্থান পূরণ" },
                    { id: "short_answer", label: "সংক্ষিপ্ত প্রশ্ন" },
                    { id: "image_choice", label: "চিত্র ভিত্তিক MCQ" },
                    { id: "poll", label: "পোল / জরিপ" },
                  ].map((t) => {
                    const isSelected = selectedTypes.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (selectedTypes.length > 1) {
                              setSelectedTypes(selectedTypes.filter((x) => x !== t.id));
                            } else {
                              showToast("কমপক্ষে একটি প্রশ্নের ধরন নির্বাচন করতে হবে।", "info");
                            }
                          } else {
                            setSelectedTypes([...selectedTypes, t.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-[11px] font-bold text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs font-black"
                            : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity, Difficulty, Language & Reference PDF */}
              <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                {/* Question Count Exact Control */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                      <span>প্রশ্নের সংখ্যা (Exact Count Control) *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCount(!isCustomCount)}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold underline cursor-pointer"
                    >
                      {isCustomCount ? "প্রিসেট পিল দেখুন" : "কাস্টম সংখ্যা লিখুন"}
                    </button>
                  </div>

                  {!isCustomCount ? (
                    <div className="grid grid-cols-6 gap-1.5">
                      {[5, 10, 15, 20, 25, 30].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setQuestionCount(num)}
                          className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                            questionCount === num
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {num}টি
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        placeholder="১ থেকে ৩০ পর্যন্ত নির্দিষ্ট সংখ্যা লিখুন"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold shrink-0">টি প্রশ্ন (১-৩০)</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Difficulty */}
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                      <span>কাঠিন্য স্তর (Difficulty)</span>
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      <option value="easy">সহজ (Easy - জ্ঞান স্তর)</option>
                      <option value="medium">মধ্যম (Medium - অনুধাবন ও প্রয়োগ)</option>
                      <option value="hard">কঠিন (Hard - উচ্চতর দক্ষতা)</option>
                      <option value="mixed">মিশ্র (Mixed - BTEB বোর্ড স্ট্যান্ডার্ড)</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                      <span>ভাষা (Language)</span>
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      <option value="Bangla">বাংলা (Bengali - প্রমিত কারিগরি)</option>
                      <option value="English">English (Standard)</option>
                      <option value="Bilingual">দ্বিভাষিক (Bilingual - বাংলা ও ইংরেজি)</option>
                    </select>
                  </div>
                </div>

                {/* Reference Curriculum PDF Selector from Repository */}
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-500" />
                      <span>কারিকুলাম পাঠ্যবই / সিলেবাস রেফারেন্স (PDF Grounding)</span>
                    </span>
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-normal font-mono">
                      {pdfDocuments.length}টি ডকুমেন্ট উপলব্ধ
                    </span>
                  </label>
                  <select
                    value={selectedPdfId}
                    onChange={(e) => setSelectedPdfId(e.target.value)}
                    className="w-full p-2.5 bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/80 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">কোনো নির্দিষ্ট পিডিএফ ছাড়াই সাধারণ BTEB কারিকুলাম অনুসরণ করুন</option>
                    {pdfDocuments.map((doc: any) => (
                      <option key={doc.id} value={doc.id}>
                        📄 {doc.title} {doc.chapter ? `(${doc.chapter})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quality Standards Config */}
              <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-bold">
                  কোয়ালিটি ও পেডাগজি সেটিংস
                </label>
                <div className="space-y-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qualityOptions.includeExplanations}
                      onChange={(e) => setQualityOptions({ ...qualityOptions, includeExplanations: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600"
                    />
                    <span>সঠিক উত্তরের বিস্তারিত ব্যাখ্যা ও সমাধান সহ জেনারেট করুন</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qualityOptions.useCurriculumWording}
                      onChange={(e) => setQualityOptions({ ...qualityOptions, useCurriculumWording: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600"
                    />
                    <span>কারিগরি বোর্ড সিলেবাস ও পাঠ্যপুস্তকের ভাষা ব্যবহার করুন</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qualityOptions.avoidAmbiguous}
                      onChange={(e) => setQualityOptions({ ...qualityOptions, avoidAmbiguous: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600"
                    />
                    <span>বিভ্রান্তিকর ও দ্ব্যর্থক উত্তর বিকল্প বা অপশনসমূহ এড়িয়ে চলুন</span>
                  </label>
                </div>
              </div>

              {/* Custom Teacher Instructions */}
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400">এআই এর প্রতি বিশেষ নির্দেশাবলী (Additional Instructions)</label>
                <textarea
                  rows={2}
                  placeholder="যেমন: বাস্তব জীবনের উদাহরণ দিন বা একটু বেশি ট্রিকি কোশ্চেন করুন..."
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Zero-Trust & Permission Clearance Guidance Notices */}
              {currentUser.role === "student" && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>জিরো-ট্রাস্ট শিক্ষার্থী সুরক্ষা নীতি: শিক্ষার্থীরা AI প্রশ্ন জেনারেশন স্টুডিও ব্যবহারের অনুমতিপ্রাপ্ত নয়।</span>
                </div>
              )}

              {currentUser.role === "teacher" && !hasCustomPermission("generate_ai_questions") && !isSuperOrPrincipal && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-2.5">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>প্রশাসনিক ক্লিয়ারেন্স প্রয়োজন: আপনার শিক্ষক প্রোফাইলে 'generate_ai_questions' পারমিশন অনুমোদন দেওয়া হয়নি।</span>
                </div>
              )}

              {/* Action Trigger Button */}
              <button
                type="submit"
                disabled={
                  isGenerating ||
                  currentUser.role === "student" ||
                  (!isSuperOrPrincipal && !hasCustomPermission("generate_ai_questions"))
                }
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>জেনারেট হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-current animate-pulse" />
                    <span>এআই দিয়ে প্রশ্ন তৈরি করুন (Generate with AI)</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: Interactive Review Board or Loading Placeholder */}
          <div className="lg:col-span-7 space-y-4">
            {generationStatus === "idle" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-full flex items-center justify-center mx-auto ring-4 ring-indigo-100 dark:ring-indigo-900/50">
                  <Wand2 className="w-8 h-8 text-indigo-500 animate-pulse" />
                </div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200">কোয়েশ্চেন জেনারেশন প্যানেল</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  বামদিকের প্যানেলে আপনার কাঙ্ক্ষিত বিষয়বস্তু ও প্রশ্নসংখ্যা সেট করে জেনারেট বাটনে ক্লিক করুন। কয়েক সেকেন্ডের মধ্যে নিখুঁত একাডেমিক প্রশ্নপত্র এখানে এসে হাজির হবে।
                </p>
              </div>
            )}

            {generationStatus === "loading" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-xs">
                <div className="text-center space-y-2">
                  <RotateCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-200">এআই প্রশ্নমালা তৈরি হচ্ছে...</h3>
                  <p className="text-xs text-slate-400">এই প্রক্রিয়া সম্পন্ন হতে ১০-১৫ সেকেন্ড সময় লাগতে পারে।</p>
                </div>

                {/* Simulated Step Progress Timeline */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>প্রগতি সূচক (Status Indicator)</span>
                    <span>{Math.round(((currentStepIndex + 1) / generationSteps.length) * 100)}% Completed</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-1000"
                      style={{ width: `${((currentStepIndex + 1) / generationSteps.length) * 100}%` }}
                    />
                  </div>

                  {/* Steps List */}
                  <div className="space-y-2 text-[11px] font-bold">
                    {generationSteps.map((step, idx) => {
                      const isActive = idx === currentStepIndex;
                      const isCompleted = idx < currentStepIndex;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 transition-all duration-300 ${
                            isActive
                              ? "text-indigo-600 dark:text-indigo-400 font-extrabold translate-x-1"
                              : isCompleted
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : isActive ? (
                            <RotateCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700" />
                          )}
                          <span>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {generationStatus === "error" && (
              <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950 rounded-3xl p-8 text-center space-y-4 shadow-xs">
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200">জেনারেশন ব্যর্থ হয়েছে</h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 p-4 rounded-xl max-w-md mx-auto border border-rose-100">
                  {errorMessage}
                </p>
                <button
                  onClick={handleGenerate}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                >
                  আবার চেষ্টা করুন
                </button>
              </div>
            )}

            {/* GENERATED QUESTIONS LIST (REVIEW PANELS) */}
            {generationStatus === "success" && (
              <div className="space-y-4">
                {/* Batch Header Controls */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap gap-3 items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedQuestionIds.length === batchQuestions.length && batchQuestions.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600"
                      />
                      <span>সকল প্রশ্ন সিলেক্ট করুন ({selectedQuestionIds.length}/{batchQuestions.length})</span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveSelectedToBank}
                      disabled={selectedQuestionIds.length === 0 || isSavingSelected}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 disabled:bg-slate-300 flex items-center gap-1.5 shadow-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>কোয়েশ্চেন ব্যাংকে যুক্ত করুন</span>
                    </button>
                    <button
                      onClick={() => setShowAddToQuizModal(true)}
                      disabled={selectedQuestionIds.length === 0 || isSavingSelected}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 disabled:bg-slate-300 flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>কুইজে যোগ করুন</span>
                    </button>
                  </div>
                </div>

                {/* Question Cards Accordion / List */}
                <div className="space-y-4">
                  {batchQuestions.map((q, idx) => {
                    const isSelected = selectedQuestionIds.includes(q.id);
                    const isEditing = editingQuestionId === q.id;
                    const isCurrentlyProcessing = isRefining === q.id;

                    return (
                      <div
                        key={q.id}
                        className={`bg-white dark:bg-slate-900 border rounded-2xl transition-all shadow-xs overflow-hidden ${
                          isSelected ? "border-indigo-500/50 ring-1 ring-indigo-400/20" : "border-slate-200/80 dark:border-slate-800"
                        }`}
                      >
                        {/* Card Header Info */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectQuestion(q.id)}
                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 mt-0.5"
                          />
                          <div className="flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold uppercase">
                                #{idx + 1} {q.type}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                q.difficulty === "easy"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : q.difficulty === "hard"
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}>
                                {q.difficulty}
                              </span>

                              {q.status === "saved" && (
                                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] rounded-full font-bold">
                                  Saved ✓
                                </span>
                              )}

                              {/* Duplicate Warning indicator */}
                              {q.duplicateHash === "similar_found" && (
                                <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] rounded-full font-black flex items-center gap-1 shadow-xs animate-pulse">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>সদৃশ প্রশ্ন ব্যাংকে রয়েছে (Warning)</span>
                                </span>
                              )}
                            </div>

                            {/* Normal Render or Editing Fields */}
                            {isEditing ? (
                              <div className="space-y-3 pt-2 text-xs font-bold">
                                <div className="space-y-1">
                                  <label className="text-slate-700 dark:text-slate-300">প্রশ্নের বিবরণ (Edit Text)</label>
                                  <textarea
                                    value={editedText}
                                    onChange={(e) => setEditedText(e.target.value)}
                                    rows={2}
                                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl font-semibold"
                                  />
                                </div>

                                {/* Custom Editor UI depending on Type */}
                                {(q.type === "mcq_single" || q.type === "mcq_multiple" || q.type === "image_choice" || q.type === "poll") && (
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-slate-600 dark:text-slate-400">
                                        {q.type === "mcq_multiple" ? "অপশনসমূহ ও একাধিক সঠিক উত্তর:" : "অপশনসমূহ ও সঠিক উত্তর:"}
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const opts = [...(editedData?.options || [])];
                                          if (opts.length < 6) {
                                            opts.push(`নতুন অপশন ${String.fromCharCode(65 + opts.length)}`);
                                            setEditedData({ ...editedData, options: opts });
                                          }
                                        }}
                                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                                      >
                                        + অপশন যোগ
                                      </button>
                                    </div>
                                    {(editedData?.options || []).map((opt: string, optIdx: number) => {
                                      const isCorrectSingle = q.type === "mcq_single" && editedData.correctIndex === optIdx;
                                      const isCorrectMultiple = q.type === "mcq_multiple" && (editedData.correctIndices || []).includes(optIdx);

                                      return (
                                        <div key={optIdx} className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (q.type === "mcq_single") {
                                                setEditedData({ ...editedData, correctIndex: optIdx });
                                              } else if (q.type === "mcq_multiple") {
                                                const currents = [...(editedData.correctIndices || [])];
                                                const nexts = currents.includes(optIdx)
                                                  ? currents.filter((i) => i !== optIdx)
                                                  : [...currents, optIdx];
                                                setEditedData({ ...editedData, correctIndices: nexts });
                                              }
                                            }}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all shrink-0 ${
                                              isCorrectSingle || isCorrectMultiple
                                                ? "bg-emerald-600 text-white"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                            }`}
                                          >
                                            {isCorrectSingle || isCorrectMultiple ? "✓ Correct" : `Set ${String.fromCharCode(65 + optIdx)}`}
                                          </button>
                                          <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                              const opts = [...(editedData.options || [])];
                                              opts[optIdx] = e.target.value;
                                              setEditedData({ ...editedData, options: opts });
                                            }}
                                            className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                                          />
                                          {(editedData?.options || []).length > 2 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const opts = (editedData.options || []).filter((_: any, idx: number) => idx !== optIdx);
                                                let newIdx = editedData.correctIndex;
                                                if (newIdx >= opts.length) newIdx = 0;
                                                setEditedData({ ...editedData, options: opts, correctIndex: newIdx });
                                              }}
                                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-xs"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {q.type === "true_false" && (
                                  <div className="flex gap-3 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditedData({ ...editedData, correctAnswer: true })}
                                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                                        editedData?.correctAnswer === true ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                      }`}
                                    >
                                      True (সত্য)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditedData({ ...editedData, correctAnswer: false })}
                                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                                        editedData?.correctAnswer === false ? "bg-rose-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                      }`}
                                    >
                                      False (মিথ্যা)
                                    </button>
                                  </div>
                                )}

                                {q.type === "matching" && (
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-slate-600 dark:text-slate-400">বাম-ডান মিলকরণ জোড়সমূহ (Matching Pairs):</label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const pairs = [...(editedData?.pairs || [])];
                                          if (pairs.length < 6) {
                                            pairs.push({ left: `বাম পাশ ${pairs.length + 1}`, right: `ডান পাশ ${pairs.length + 1}` });
                                            setEditedData({ ...editedData, pairs });
                                          }
                                        }}
                                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                                      >
                                        + নতুন জোড়
                                      </button>
                                    </div>
                                    {(editedData?.pairs || []).map((p: any, pIdx: number) => (
                                      <div key={pIdx} className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                          {pIdx + 1}
                                        </span>
                                        <input
                                          type="text"
                                          value={p.left}
                                          onChange={(e) => {
                                            const pairs = [...(editedData.pairs || [])];
                                            pairs[pIdx] = { ...pairs[pIdx], left: e.target.value };
                                            setEditedData({ ...editedData, pairs });
                                          }}
                                          placeholder="বাম পাশ"
                                          className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                                        />
                                        <span className="text-slate-400 font-bold">↔</span>
                                        <input
                                          type="text"
                                          value={p.right}
                                          onChange={(e) => {
                                            const pairs = [...(editedData.pairs || [])];
                                            pairs[pIdx] = { ...pairs[pIdx], right: e.target.value };
                                            setEditedData({ ...editedData, pairs });
                                          }}
                                          placeholder="ডান পাশ"
                                          className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                                        />
                                        {(editedData?.pairs || []).length > 2 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const pairs = (editedData.pairs || []).filter((_: any, idx: number) => idx !== pIdx);
                                              setEditedData({ ...editedData, pairs });
                                            }}
                                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-xs"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {q.type === "fill_blank" && (
                                  <div className="space-y-2 pt-1">
                                    <label className="text-slate-600 dark:text-slate-400">গ্রহণযোগ্য সঠিক উত্তরসমূহ (Accepted answers):</label>
                                    <div className="flex flex-wrap gap-2">
                                      {(editedData?.acceptedAnswers || []).map((ans: string, aIdx: number) => (
                                        <span key={aIdx} className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5">
                                          <span>{ans}</span>
                                          {(editedData.acceptedAnswers || []).length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const answers = (editedData.acceptedAnswers || []).filter((_: any, idx: number) => idx !== aIdx);
                                                setEditedData({ ...editedData, acceptedAnswers: answers });
                                              }}
                                              className="text-rose-500 hover:text-rose-700"
                                            >
                                              ×
                                            </button>
                                          )}
                                        </span>
                                      ))}
                                    </div>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        id={`generator-blank-input-${q.id}`}
                                        placeholder="নতুন গ্রহণযোগ্য উত্তর লিখুন..."
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            const val = e.currentTarget.value.trim();
                                            if (val) {
                                              const answers = [...(editedData.acceptedAnswers || [])];
                                              if (!answers.includes(val)) answers.push(val);
                                              setEditedData({ ...editedData, acceptedAnswers: answers });
                                              e.currentTarget.value = "";
                                            }
                                          }
                                        }}
                                        className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const el = document.getElementById(`generator-blank-input-${q.id}`) as HTMLInputElement;
                                          if (el && el.value.trim()) {
                                            const answers = [...(editedData.acceptedAnswers || [])];
                                            if (!answers.includes(el.value.trim())) answers.push(el.value.trim());
                                            setEditedData({ ...editedData, acceptedAnswers: answers });
                                            el.value = "";
                                          }
                                        }}
                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                                      >
                                        + যোগ
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {q.type === "ordering" && (
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-slate-600 dark:text-slate-400">সঠিক ক্রম সাজান (Sequence Steps):</label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const items = [...(editedData?.items || [])];
                                          if (items.length < 6) {
                                            items.push(`ধাপ ${items.length + 1}`);
                                            setEditedData({ ...editedData, items });
                                          }
                                        }}
                                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                                      >
                                        + ধাপ যোগ
                                      </button>
                                    </div>
                                    {(editedData?.items || []).map((itemText: string, iIdx: number) => (
                                      <div key={iIdx} className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                          {iIdx + 1}
                                        </span>
                                        <input
                                          type="text"
                                          value={itemText}
                                          onChange={(e) => {
                                            const items = [...(editedData.items || [])];
                                            items[iIdx] = e.target.value;
                                            setEditedData({ ...editedData, items });
                                          }}
                                          className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                                        />
                                        {(editedData?.items || []).length > 2 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const items = (editedData.items || []).filter((_: any, idx: number) => idx !== iIdx);
                                              setEditedData({ ...editedData, items });
                                            }}
                                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-xs"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {q.type === "short_answer" && (
                                  <div className="space-y-1 pt-1">
                                    <label className="text-slate-600 dark:text-slate-400">মূল ধারণা কি-ওয়ার্ড (Core Keyword):</label>
                                    <input
                                      type="text"
                                      value={editedData?.expectedAnswerKeyword || ""}
                                      onChange={(e) => setEditedData({ ...editedData, expectedAnswerKeyword: e.target.value })}
                                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                                      placeholder="যেমন: ওহমের সূত্র..."
                                    />
                                  </div>
                                )}

                                <div className="space-y-1">
                                  <label className="text-slate-700 dark:text-slate-300">সঠিক উত্তরের ব্যাখ্যা (Explanation)</label>
                                  <textarea
                                    value={editedExplanation}
                                    onChange={(e) => setEditedExplanation(e.target.value)}
                                    rows={2}
                                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl font-medium"
                                  />
                                </div>

                                <div className="flex gap-2 justify-end pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingQuestionId(null)}
                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
                                  >
                                    বাতিল
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => saveEditedQuestion(q.id)}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs"
                                  >
                                    সংরক্ষণ করুন
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3 pt-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                <p className="font-extrabold text-sm leading-snug">{q.questionText}</p>

                                {/* Visual rendering of specific choices */}
                                {(q.type === "mcq_single" || q.type === "mcq_multiple" || q.type === "image_choice" || q.type === "poll") && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                                    {(q.questionData?.options || []).map((opt: string, optIdx: number) => {
                                      const isCorrectSingle = q.type === "mcq_single" && q.questionData.correctIndex === optIdx;
                                      const isCorrectMultiple = q.type === "mcq_multiple" && q.questionData.correctIndices?.includes(optIdx);

                                      return (
                                        <div
                                          key={optIdx}
                                          className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                            isCorrectSingle || isCorrectMultiple
                                              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300"
                                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/80"
                                          }`}
                                        >
                                          <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                          {(isCorrectSingle || isCorrectMultiple) && <Check className="w-4 h-4 text-emerald-600" />}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {q.type === "true_false" && (
                                  <div className="flex gap-2 font-bold">
                                    <span className={`px-4 py-1.5 rounded-xl border text-center flex-1 ${q.questionData?.correctAnswer === true ? "bg-emerald-100 border-emerald-400 text-emerald-800" : "bg-slate-50 dark:bg-slate-950 text-slate-400"}`}>
                                      True (সত্য)
                                    </span>
                                    <span className={`px-4 py-1.5 rounded-xl border text-center flex-1 ${q.questionData?.correctAnswer === false ? "bg-rose-100 border-rose-400 text-rose-800" : "bg-slate-50 dark:bg-slate-950 text-slate-400"}`}>
                                      False (মিথ্যা)
                                    </span>
                                  </div>
                                )}

                                {q.type === "matching" && (
                                  <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border">
                                    <p className="text-[11px] text-slate-400 mb-1">সঠিক ম্যাচিং জোড়সমূহ (Matching Pairs):</p>
                                    {(q.questionData?.pairs || []).map((p: any, pIdx: number) => (
                                      <div key={pIdx} className="flex justify-between text-xs font-bold border-b border-dashed border-slate-100 dark:border-slate-800/80 pb-1">
                                        <span>{p.left}</span>
                                        <span className="text-slate-400">↔</span>
                                        <span>{p.right}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {q.type === "ordering" && (
                                  <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border text-xs font-bold">
                                    <p className="text-[11px] text-slate-400 mb-1">সঠিক বিন্যাসক্রম (Correct Order Sequence):</p>
                                    {(q.questionData?.items || []).map((item: string, itemIdx: number) => (
                                      <div key={itemIdx} className="flex items-center gap-2">
                                        <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px]">{itemIdx + 1}</span>
                                        <span>{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {q.type === "fill_blank" && (
                                  <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border">
                                    <span className="text-[11px] text-slate-400 font-bold">সঠিক উত্তরসমূহ (Accepted answers): </span>
                                    <span className="text-emerald-700 font-mono">{(q.questionData?.acceptedAnswers || []).join(" | ")}</span>
                                  </div>
                                )}

                                {q.type === "short_answer" && (
                                  <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border text-xs font-bold">
                                    <span className="text-slate-400">মূল ধারণা কি-ওয়ার্ড (Core Keyword): </span>
                                    <span className="text-indigo-700">{q.questionData?.expectedAnswerKeyword || "N/A"}</span>
                                  </div>
                                )}

                                {/* Explanation output */}
                                {q.explanation && (
                                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/30 rounded-xl text-xs flex gap-2">
                                    <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                                      <span className="font-extrabold block">ব্যাখ্যা ও সমাধান:</span>
                                      {q.explanation}
                                    </p>
                                  </div>
                                )}

                                {/* ACTION BUTTONS: EDIT, RE-GENERATE, REFINE */}
                                <div className="flex flex-wrap items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 gap-2">
                                  {isCurrentlyProcessing ? (
                                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold">
                                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                      <span>এআই রিফাইন ও রিক্রিয়েট করছে...</span>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => startEditing(q)}
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg flex items-center gap-1"
                                        title="ম্যানুয়ালি এডিট করুন"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <span>ম্যানুয়াল এডিট</span>
                                      </button>
                                      <button
                                        onClick={() => handleRegenerateSingle(q.id)}
                                        className="p-1.5 hover:bg-indigo-50 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/30 text-indigo-600 rounded-lg flex items-center gap-1"
                                        title="পুনরায় বিকল্প প্রশ্ন তৈরি করুন"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>বিকল্প প্রশ্ন তৈরি</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteQuestion(q.id)}
                                        className="p-1.5 hover:bg-rose-50 dark:bg-rose-950/40 dark:hover:bg-rose-950/30 text-rose-600 rounded-lg flex items-center gap-1"
                                        title="মুছে ফেলুন"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>মুছে ফেলুন</span>
                                      </button>
                                    </div>
                                  )}

                                  {/* Refinement instruction input */}
                                  <div className="flex items-center gap-1 w-full sm:w-auto">
                                    <input
                                      type="text"
                                      placeholder="যেমন: অপশন সি পরিবর্তন করুন..."
                                      value={refinementText}
                                      onChange={(e) => setRefinementText(e.target.value)}
                                      className="flex-1 sm:w-48 p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-[11px] font-semibold"
                                    />
                                    <button
                                      onClick={() => handleRefineSingle(q.id)}
                                      disabled={isCurrentlyProcessing}
                                      className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                                    >
                                      <Sparkles className="w-3 h-3 fill-current" />
                                      <span>রিফাইন</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : activeSubTab === "pdf_library" ? (
        /* TAB: PDF DOCUMENT LIBRARY (PHASE 3) */
        <PdfLibraryView
          classes={classes}
          subjects={subjects}
          quizzes={quizzes}
          showToast={showToast}
          onRefreshHistory={fetchHistory}
        />
      ) : (
        /* TAB: GENERATOR HISTORY (PAST RECORD LOGS) */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 text-xs font-bold shadow-xs">
          <div className="flex justify-between items-center pb-3 border-b">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">এআই জেনারেশন রিসিভ ও হিস্ট্রি লগ</h3>
              <p className="text-[11px] text-slate-400">এই শিক্ষাবর্ষে আপনার তৈরি করা সকল এআই প্রশ্নমালা ও জবের রেকর্ড তালিকা।</p>
            </div>
            <button
              onClick={fetchHistory}
              className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-1"
            >
              <RotateCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>রিফ্রেশ লিস্টিং</span>
            </button>
          </div>

          {historyJobs.length === 0 ? (
            <div className="text-center p-12 text-slate-400 space-y-2">
              <History className="w-12 h-12 text-slate-300 mx-auto" />
              <p>কোনো জেনারেশন ইতিহাস পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] uppercase">
                    <th className="py-3 px-4">তারিখ ও সময়</th>
                    <th className="py-3 px-4">টপিক / বিষয়বস্তু</th>
                    <th className="py-3 px-4">প্রশ্ন টাইপ</th>
                    <th className="py-3 px-4">সংখ্যা</th>
                    <th className="py-3 px-4">ডিফিকাল্টি</th>
                    <th className="py-3 px-4">অবস্থা (Status)</th>
                    <th className="py-3 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {historyJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-950/50">
                      <td className="py-3 px-4 font-mono font-medium text-slate-500 dark:text-slate-400">
                        {new Date(job.createdAt).toLocaleString("bn-BD")}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                        {job.topic}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {job.questionType.split(",").map((tStr) => {
                            const trimmed = tStr.trim();
                            const label = {
                              mcq_single: "MCQ (একক)",
                              mcq_multiple: "MCQ (বহু)",
                              true_false: "সত্য/মিথ্যা",
                              matching: "মিলকরণ",
                              ordering: "ক্রম",
                              fill_blank: "শূন্যস্থান",
                              short_answer: "সংক্ষিপ্ত",
                              image_choice: "চিত্র MCQ",
                              poll: "পোল",
                            }[trimmed] || trimmed;
                            return (
                              <span key={trimmed} className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-[9px] uppercase tracking-wide">
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">{job.questionCount}টি</td>
                      <td className="py-3 px-4 capitalize font-bold text-amber-700">{job.difficulty}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          job.status === "completed"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : job.status === "failed"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleInspectJob(job)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 ml-auto"
                        >
                          <span>প্রশ্নসমূহ দেখুন</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADD TO QUIZ MODAL */}
      {showAddToQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>কুইজ নির্বাচন করুন (Select Target Quiz)</span>
              </h3>
              <button
                onClick={() => setShowAddToQuizModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              আপনি আপনার তৈরি করা **{selectedQuestionIds.length}টি প্রশ্ন** নিচের যেকোনো একটি কুইজের ভেতরে প্রশ্ন হিসেবে কপি করতে যাচ্ছেন।
            </p>

            <div className="space-y-3 font-bold text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400">কুইজের তালিকা (Available Quizzes):</label>
                <select
                  value={selectedQuizId}
                  onChange={(e) => setSelectedQuizId(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="">-- একটি কুইজ সিলেক্ট করুন --</option>
                  {quizzes.map((quiz) => (
                    <option key={quiz.id} value={quiz.id}>
                      {quiz.title} ({quiz.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setShowAddToQuizModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleAddSelectedToQuiz}
                disabled={isSavingSelected || !selectedQuizId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
              >
                {isSavingSelected ? "সংরক্ষণ হচ্ছে..." : "কুইজে যোগ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
