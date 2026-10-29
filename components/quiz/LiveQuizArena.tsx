"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  ClipboardPaste,
  Search,
  Filter,
  Copy,
  Trash2,
  Edit2,
  Edit3,
  Eye,
  CheckCircle2,
  Clock,
  BookOpen,
  Layers,
  ArrowRight,
  Save,
  HelpCircle,
  FileText,
  Settings,
  Archive,
  RefreshCw,
  FolderPlus,
  GraduationCap,
  ListOrdered,
  Grid,
  CheckSquare,
  Shuffle,
  AlignLeft,
  Image as ImageIcon,
  BarChart2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Play,
  Monitor,
  Radio,
  Smartphone,
  ChevronRight,
  AlertTriangle,
  Zap,
  GripVertical,
  XCircle,
  Loader2,
  Trophy,
} from "lucide-react";
import { institutionalDb, Quiz, QuestionBankQuestion, QuizQuestion } from "@/lib/database";
import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  getApplicableTradesForClass,
  getSubjectsForClass,
  parseClassNumeric,
} from "@/lib/academicStructure";
import ManualQuestionCreatorModal from "./ManualQuestionCreatorModal";
import MentimeterInteractiveAiQuizStudio from "./MentimeterInteractiveAiQuizStudio";
import QuizTemplateManager from "./QuizTemplateManager";
import MatchingQuestionPlayer from "./MatchingQuestionPlayer";
import UniversalTemplateWrapper from "./shared/UniversalTemplateWrapper";
import UniversalQuizShowcaseEngine from "./engine/UniversalQuizShowcaseEngine";
import TournamentDashboard from "./TournamentDashboard";
import { useGlobalAcademic } from "@/context/GlobalAcademicContext";
import {
  GlowCard,
  AnimatedCounter,
  GlowButton,
} from "@/components/ui/animation-effects";

type ArenaTab =
  | "dashboard"
  | "my_quizzes"
  | "create_quiz"
  | "builder"
  | "question_bank"
  | "preview"
  | "settings"
  | "ai_generator"
  | "tournaments";

// Question Types Registry
export const QUESTION_TYPES = [
  {
    type: "mcq_single",
    label: "MCQ — Single Answer",
    icon: CheckCircle2,
    color: "bg-indigo-500",
    description: "Standard multiple choice with 1 correct option",
  },
  {
    type: "mcq_multiple",
    label: "MCQ — Multiple Answers",
    icon: CheckSquare,
    color: "bg-purple-500",
    description: "Multiple choice with multiple correct options",
  },
  {
    type: "true_false",
    label: "True / False",
    icon: HelpCircle,
    color: "bg-emerald-500",
    description: "Simple statement evaluation",
  },
  {
    type: "matching",
    label: "Matching Pairs",
    icon: Grid,
    color: "bg-amber-500",
    description: "Match column A items with column B items",
  },
  {
    type: "ordering",
    label: "Ordering / Arrange",
    icon: ListOrdered,
    color: "bg-cyan-500",
    description: "Arrange items in correct chronological or logical order",
  },
  {
    type: "fill_blank",
    label: "Fill in the Blank",
    icon: AlignLeft,
    color: "bg-rose-500",
    description: "Fill missing key terms or values",
  },
  {
    type: "short_answer",
    label: "Short Answer",
    icon: FileText,
    color: "bg-teal-500",
    description: "Text response with auto/manual grading config",
  },
  {
    type: "image_choice",
    label: "Image Choice",
    icon: ImageIcon,
    color: "bg-blue-500",
    description: "Visual question with image-based choices",
  },
  {
    type: "poll",
    label: "Poll / Opinion",
    icon: BarChart2,
    color: "bg-violet-500",
    description: "Survey/voting without right or wrong answer",
  },
];

export default function LiveQuizArena({
  onLaunchLiveArena,
  initialTab = "dashboard",
}: {
  onLaunchLiveArena?: (quizId: string) => void;
  initialTab?: ArenaTab;
}) {
  const [activeTab, setActiveTab] = useState<ArenaTab>(initialTab);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questionBank, setQuestionBank] = useState<QuestionBankQuestion[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[]>([]);

  // Operating loading states
  const { selectedClass: globalClass, selectedTrade: globalTrade } = useGlobalAcademic();
  const [operatingQuizId, setOperatingQuizId] = useState<string | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState<boolean>(false);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Question Bank filters
  const [qbSearch, setQbSearch] = useState("");
  const [qbTypeFilter, setQbTypeFilter] = useState("all");
  const [qbDifficultyFilter, setQbDifficultyFilter] = useState("all");
  const [selectedQbIds, setSelectedQbIds] = useState<string[]>([]);
  const [showManualCreatorModal, setShowManualCreatorModal] = useState(false);

  // Quiz Builder state
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [isQbDrawerOpen, setIsQbDrawerOpen] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewCurrentQIndex, setPreviewCurrentQIndex] = useState(0);
  const [previewSelectedAnswer, setPreviewSelectedAnswer] = useState<any>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<number | undefined>(undefined);
  const [builderViewMode, setBuilderViewMode] = useState<"mentimeter_studio" | "column">("mentimeter_studio");

  // Quiz Creation Modes: Unified AI Studio (Recommended) vs Manual Entry vs CopyPaste
  const [creationMode, setCreationMode] = useState<"mentimeter_studio" | "manual" | "copypaste">("mentimeter_studio");
  const [copyPasteText, setCopyPasteText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [editingParsedIndex, setEditingParsedIndex] = useState<number | null>(null);

  // New Quiz Form State
  const [newQuizForm, setNewQuizForm] = useState({
    title: "",
    description: "",
    thumbnail: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=500&auto=format&fit=crop&q=60",
    mode: "academic" as "academic" | "general",
    subjectId: undefined as number | undefined,
    classId: 4,
    sectionId: undefined as number | undefined,
    tradeId: undefined as number | undefined,
    academicYearId: 2026,
    chapterId: undefined as string | undefined,
    topicId: undefined as string | undefined,
    category: "Practice",
    instructions: "Answer all questions within the given time limit. Good luck!",
    defaultMarks: 2,
    negativeMarking: false,
    randomizeQuestions: true,
    randomizeOptions: true,
    defaultQuestionTime: 60,
    totalDuration: 15,
  });

  // Academic Cascading Selectors State (Initialized with robust defaults)
  const [academicContext, setAcademicContext] = useState<any>({
    years: ["2025", "2026", "2027", "2028"],
    classes: ACADEMIC_CLASSES,
    trades: ALL_TRADES,
    allTrades: ALL_TRADES,
    sections: [
      { id: 1, sectionName: "A" },
      { id: 2, sectionName: "B" },
    ],
    subjects: [],
    topics: [],
    chapters: [],
  });
  const [academicLoading, setAcademicLoading] = useState(false);

  // Fetch initial academic context safely
  useEffect(() => {
    let isMounted = true;
    const fetchInitialContext = async () => {
      try {
        const res = await fetch("/api/academic/context");
        if (res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const data = await res.json();
            if (isMounted && data?.success && data?.context) {
              setAcademicContext((prev: any) => ({
                ...prev,
                classes: data.context.classes?.length ? data.context.classes : ACADEMIC_CLASSES,
                allTrades: data.context.allTrades?.length ? data.context.allTrades : ALL_TRADES,
              }));
              return;
            }
          }
        }
      } catch {
        // Silently use offline defaults
      }
      if (isMounted) {
        setAcademicContext((prev: any) => ({
          ...prev,
          classes: ACADEMIC_CLASSES,
          allTrades: ALL_TRADES,
        }));
      }
    };
    fetchInitialContext();
    return () => {
      isMounted = false;
    };
  }, []);

  // Cascading effect: Fetch trades, sections, subjects when class changes
  useEffect(() => {
    if (newQuizForm.mode !== "academic" || !newQuizForm.classId) return;

    let isMounted = true;
    const fetchCascadingData = async () => {
      setAcademicLoading(true);
      const numClass = parseClassNumeric(newQuizForm.classId);
      const fallbackTrades = numClass > 0 ? getApplicableTradesForClass(numClass) : ALL_TRADES;
      const fallbackSubjects =
        numClass > 0
          ? getSubjectsForClass(
              numClass,
              newQuizForm.tradeId ? String(newQuizForm.tradeId) : undefined
            )
          : [];
      const fallbackSections = [
        { id: 1, sectionName: "A", classNumeric: numClass },
        { id: 2, sectionName: "B", classNumeric: numClass },
      ];

      let applicableTrades = fallbackTrades;
      let applicableSubjects = fallbackSubjects;
      let sections = fallbackSections;

      try {
        // Fetch Context (Trades & Subjects)
        const ctxRes = await fetch(
          `/api/academic/context?classVal=${newQuizForm.classId}&tradeVal=${newQuizForm.tradeId || ""}`
        );
        if (ctxRes.ok && (ctxRes.headers.get("content-type") || "").includes("application/json")) {
          const ctxData = await ctxRes.json();
          if (ctxData?.success && ctxData?.context) {
            if (Array.isArray(ctxData.context.applicableTrades) && ctxData.context.applicableTrades.length > 0) {
              applicableTrades = ctxData.context.applicableTrades;
            }
            if (Array.isArray(ctxData.context.applicableSubjects) && ctxData.context.applicableSubjects.length > 0) {
              applicableSubjects = ctxData.context.applicableSubjects;
            }
          }
        }
      } catch {}

      try {
        // Fetch Sections
        const secRes = await fetch(`/api/academic/sections?classNumeric=${newQuizForm.classId}`);
        if (secRes.ok && (secRes.headers.get("content-type") || "").includes("application/json")) {
          const secData = await secRes.json();
          if (secData?.success && Array.isArray(secData?.sections) && secData.sections.length > 0) {
            sections = secData.sections;
          }
        }
      } catch {}

      if (isMounted) {
        setAcademicContext((prev: any) => ({
          ...prev,
          trades: applicableTrades,
          sections,
          subjects: applicableSubjects,
        }));

        // Reset dependent fields if they are no longer valid
        const isTradeValid = applicableTrades.some((t: any) => t.id === newQuizForm.tradeId);
        if (newQuizForm.tradeId && !isTradeValid) {
          setNewQuizForm((prev) => ({ ...prev, tradeId: undefined }));
        }
        setAcademicLoading(false);
      }
    };

    fetchCascadingData();
    return () => {
      isMounted = false;
    };
  }, [newQuizForm.classId, newQuizForm.tradeId, newQuizForm.mode]);

  // Fetch topics when subject changes
  useEffect(() => {
    if (newQuizForm.mode !== "academic" || !newQuizForm.subjectId) return;

    let isMounted = true;
    const fetchTopics = async () => {
      try {
        const res = await fetch(`/api/academic/subjects?action=topics&subjectId=${newQuizForm.subjectId}`);
        if (res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
          const data = await res.json();
          if (isMounted && data?.success) {
            const topics = data.topics || [];
            // Group by chapter
            const chapters = Array.from(new Set(topics.map((t: any) => t.chapterName))).map((name) => {
              return topics.find((t: any) => t.chapterName === name);
            });
            setAcademicContext((prev: any) => ({
              ...prev,
              topics,
              chapters,
            }));
          }
        }
      } catch {}
    };

    fetchTopics();
    return () => {
      isMounted = false;
    };
  }, [newQuizForm.subjectId, newQuizForm.mode]);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch("/api/quizzes");
      const data = await res.json();
      if (data.success) {
        setQuizzes(data.quizzes);
      } else {
        setQuizzes(institutionalDb.quizzes);
      }
    } catch (e) {
      setQuizzes(institutionalDb.quizzes);
    }
  };

  // Load initial data
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const res = await fetch("/api/quizzes");
        const data = await res.json();
        if (isMounted) {
          if (data.success) {
            setQuizzes(data.quizzes);
          } else {
            setQuizzes(institutionalDb.quizzes);
          }
        }
      } catch (e) {
        if (isMounted) setQuizzes(institutionalDb.quizzes);
      }

      try {
        const res = await fetch("/api/question-bank");
        const data = await res.json();
        if (isMounted) {
          if (data.success) {
            setQuestionBank(data.questions);
          } else {
            setQuestionBank(institutionalDb.questionBank);
          }
        }
      } catch (e) {
        if (isMounted) setQuestionBank(institutionalDb.questionBank);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchQuestionBank = async () => {
    try {
      const res = await fetch("/api/question-bank");
      const data = await res.json();
      if (data.success && data.questions) {
        setQuestionBank(data.questions);
      } else {
        setQuestionBank(institutionalDb.questionBank);
      }
    } catch (e) {
      setQuestionBank(institutionalDb.questionBank);
    }
  };

  const loadQuizForBuilder = async (quiz: Quiz) => {
    setActiveQuiz(quiz);
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`);
      const data = await res.json();
      if (data.success) {
        setActiveQuiz(data.quiz);
        setActiveQuizQuestions(data.questions || []);
      } else {
        const qqs = institutionalDb.quizQuestions.filter((qq) => qq.quizId === quiz.id);
        setActiveQuizQuestions(qqs);
      }
    } catch (e) {
      const qqs = institutionalDb.quizQuestions.filter((qq) => qq.quizId === quiz.id);
      setActiveQuizQuestions(qqs);
    }
    setSelectedQuestionIndex(0);
    setActiveTab("builder");
  };

  // Copy Paste Text Parser & Creator
  const handleParseText = (text: string) => {
    setCopyPasteText(text);
    if (!text.trim()) {
      setParsedQuestions([]);
      return;
    }

    const parsed: any[] = [];
    const blocks = text.split(/(?=\n\s*\d+[\.\:\)])|(?=\n\s*Q\d+[\.\:\)])/gi);
    
    for (let block of blocks) {
      block = block.trim();
      if (!block) continue;
      
      const lines = block.split("\n").map(l => l.trim()).filter(l => l);
      if (lines.length === 0) continue;
      
      let questionText = lines[0];
      questionText = questionText.replace(/^\s*(Question\s*\d+\s*[\.\:\)]|Q\d+\s*[\.\:\)]|\d+\s*[\.\:\)])/i, "").trim();
      
      const options: string[] = [];
      let correctLetter = "";
      let explanation = "";
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const optMatch = line.match(/^\s*([A-D])\s*[\.\)\-]\s*(.*)$/i);
        if (optMatch) {
          options.push(optMatch[2].trim());
          continue;
        }
        
        const ansMatch = line.match(/^\s*(Correct\s*Answer|Correct|Ans|Answer)\s*[\:\=]\s*([A-D|True|False|Yes|No])/i);
        if (ansMatch) {
          correctLetter = ansMatch[2].trim().toUpperCase();
          continue;
        }
        
        const expMatch = line.match(/^\s*(Explanation|Reason|বিবরণ|ব্যাখ্যা)\s*[\:\=]\s*(.*)$/i);
        if (expMatch) {
          explanation = expMatch[2].trim();
          continue;
        }
        
        if (line.toLowerCase().includes("correct:") || line.toLowerCase().includes("ans:")) {
          const parts = line.split(/[:=]/);
          if (parts.length > 1) {
            correctLetter = parts[1].trim().toUpperCase();
          }
          continue;
        }
        
        if (explanation) {
          explanation += " " + line;
        } else {
          explanation = line;
        }
      }
      
      let type = "mcq_single";
      let questionData: any = {};
      
      if (options.length > 0) {
        type = "mcq_single";
        let correctIndex = 0;
        if (correctLetter) {
          correctIndex = correctLetter.charCodeAt(0) - 65;
          if (correctIndex < 0 || correctIndex >= options.length) correctIndex = 0;
        }
        questionData = { options, correctIndex };
      } else if (correctLetter === "TRUE" || correctLetter === "FALSE" || questionText.toLowerCase().includes("সত্য") || questionText.toLowerCase().includes("মিথ্যা")) {
        type = "true_false";
        questionData = { correctAnswer: correctLetter !== "FALSE" };
      } else {
        type = "short_answer";
        questionData = { expectedAnswerKeyword: correctLetter || "" };
      }
      
      parsed.push({
        id: `parsed-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type,
        questionText,
        explanation: explanation || "No explanation provided.",
        questionData,
      });
    }
    
    setParsedQuestions(parsed);
  };

  const handleCreateQuizWithBulkQuestions = async (autoPublish: boolean = false, launchLive: boolean = false) => {
    if (parsedQuestions.length === 0) {
      alert("কোনো প্রশ্ন পাওয়া যায়নি। অনুগ্রহ করে সঠিক ফরম্যাটে টেক্সট পেস্ট করুন।");
      return;
    }
    const finalTitle = newQuizForm.title.trim() || `লাইভ কুইজ - ${new Date().toLocaleDateString('bn-BD')}`;

    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newQuizForm,
          title: finalTitle,
          creatorId: 1, // Default teacher/admin ID
          status: autoPublish || launchLive ? "published" : "draft"
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert("কুইজ তৈরি করতে ব্যর্থ হয়েছে।");
        return;
      }

      const quiz = data.quiz;

      for (const q of parsedQuestions) {
        await fetch(`/api/quizzes/${quiz.id}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: q.type,
            questionText: q.questionText,
            questionData: q.questionData,
            explanation: q.explanation,
            saveToQuestionBank: true,
          }),
        });
      }

      fetchQuizzes();

      if (launchLive && onLaunchLiveArena) {
        onLaunchLiveArena(quiz.id);
      } else if (autoPublish) {
        alert(`সফলভাবে "${quiz.title}" কুইজটি পাবলিশ করা হয়েছে!`);
        setActiveTab("my_quizzes");
      } else {
        alert("ড্রাফট কুইজ তৈরি হয়েছে। এখন রিভিউ এবং এডিট করার জন্য কুইজ বিল্ডারে লোড করা হয়েছে।");
        loadQuizForBuilder(quiz);
      }

      setCopyPasteText("");
      setParsedQuestions([]);
    } catch (e) {
      alert("Error generating bulk quiz");
    }
  };

  // Actions
  const handleCreateQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingQuiz(true);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newQuizForm,
          creatorId: 1, // Default teacher/admin ID
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchQuizzes();
        loadQuizForBuilder(data.quiz);
      } else {
        alert(data.message || "Failed to create quiz");
      }
    } catch (e) {
      alert("Failed to create quiz");
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleDuplicateQuiz = async (quizId: string) => {
    setOperatingQuizId(quizId);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        fetchQuizzes();
      }
    } catch (e) {
      alert("Error duplicating quiz");
    } finally {
      setOperatingQuizId(null);
    }
  };

  const handlePublishQuiz = async (quizId: string) => {
    setOperatingQuizId(quizId);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/publish`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        fetchQuizzes();
        if (activeQuiz && activeQuiz.id === quizId) {
          setActiveQuiz({ ...activeQuiz, status: "published" });
        }
      }
    } catch (e) {
      alert("Error publishing quiz");
    } finally {
      setOperatingQuizId(null);
    }
  };

  const handleArchiveQuiz = async (quizId: string) => {
    setOperatingQuizId(quizId);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/archive`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        fetchQuizzes();
      }
    } catch (e) {
      alert("Error updating archive status");
    } finally {
      setOperatingQuizId(null);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz? This cannot be undone.")) return;
    setOperatingQuizId(quizId);
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchQuizzes();
        if (activeQuiz?.id === quizId) {
          setActiveQuiz(null);
          setActiveTab("dashboard");
        }
      }
    } catch (e) {
      alert("Error deleting quiz");
    } finally {
      setOperatingQuizId(null);
    }
  };

  // Question Management in Quiz Builder
  const handleAddNewQuestionToQuiz = async (type: string = "mcq_single") => {
    if (!activeQuiz) return;
    setAutosaveStatus("saving");
    try {
      let defaultText = "নতুন প্রশ্ন";
      let initialData: any = {
        options: ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
        correctIndex: 0,
      };

      if (type === "true_false") {
        defaultText = "নিচের বিবৃতিটি সত্য নাকি মিথ্যা?";
        initialData = {
          options: ["সত্য (True)", "মিথ্যা (False)"],
          correctAnswer: true,
          correctIndex: 0,
        };
      } else if (type === "matching") {
        defaultText = "বাম পাশের সাথে ডান পাশের সঠিক তথ্য মিলকরণ করো";
        initialData = {
          pairs: [
            { left: "বাম পাশ ১ (আইটেম ক)", right: "ডান পাশ ১ (সম্পর্কিত তথ্য)" },
            { left: "বাম পাশ ২ (আইটেম খ)", right: "ডান পাশ ২ (সম্পর্কিত তথ্য)" },
            { left: "বাম পাশ ৩ (আইটেম গ)", right: "ডান পাশ ৩ (সম্পর্কিত তথ্য)" },
          ],
        };
      } else if (type === "fill_blank") {
        defaultText = "বাক্যের শূন্যস্থানে সঠিক শব্দ বসাও: গুরুত্বপূর্ণ রাশি হলো ___।";
        initialData = {
          acceptedAnswers: ["সঠিক উত্তর"],
        };
      } else if (type === "ordering") {
        defaultText = "কাজের সঠিক ধারাবাহিক পর্যায়ক্রম সাজাও";
        initialData = {
          items: ["ধাপ ১: প্রস্তুতি গ্রহণ", "ধাপ ২: সংযোগ স্থাপন", "ধাপ ৩: পরীক্ষণ সম্পন্ন"],
        };
      } else if (type === "short_answer") {
        defaultText = "সংক্ষিপ্ত প্রশ্নের উত্তর লিখুন";
        initialData = {
          expectedAnswerKeyword: "সঠিক উত্তর",
        };
      } else if (type === "mcq_multiple") {
        defaultText = "নিচের কোনটি/কোনগুলো সঠিক? একাধিক নির্বাচন করুন।";
        initialData = {
          options: ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
          correctIndices: [0, 1],
        };
      }

      const res = await fetch(`/api/quizzes/${activeQuiz.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          questionText: defaultText,
          questionData: initialData,
          marks: activeQuiz.defaultMarks || 2,
          timeLimit: activeQuiz.defaultQuestionTime || 60,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = [...activeQuizQuestions, data.question];
        setActiveQuizQuestions(updated);
        setSelectedQuestionIndex(updated.length - 1);
        setAutosaveStatus("saved");
      }
    } catch (e) {
      setAutosaveStatus("unsaved");
    }
  };

  const handleAddFromQuestionBank = async (qbItem: QuestionBankQuestion) => {
    if (!activeQuiz) return;
    setAutosaveStatus("saving");
    try {
      const res = await fetch(`/api/quizzes/${activeQuiz.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionBankId: qbItem.id,
          marks: activeQuiz.defaultMarks || 2,
          timeLimit: activeQuiz.defaultQuestionTime || 60,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = [...activeQuizQuestions, data.question];
        setActiveQuizQuestions(updated);
        setSelectedQuestionIndex(updated.length - 1);
        setAutosaveStatus("saved");
      }
    } catch (e) {
      setAutosaveStatus("unsaved");
    }
  };

  const handleDeleteQuestionFromQuiz = async (questionId: string) => {
    if (!activeQuiz) return;
    setAutosaveStatus("saving");
    try {
      const res = await fetch(
        `/api/quizzes/${activeQuiz.id}/questions?questionId=${questionId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        const updated = activeQuizQuestions.filter((q) => q.id !== questionId);
        setActiveQuizQuestions(updated);
        if (selectedQuestionIndex >= updated.length) {
          setSelectedQuestionIndex(Math.max(0, updated.length - 1));
        }
        setAutosaveStatus("saved");
      }
    } catch (e) {
      setAutosaveStatus("unsaved");
    }
  };

  const handleMoveQuestion = async (index: number, direction: "up" | "down") => {
    if (!activeQuiz) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeQuizQuestions.length) return;

    const updated = [...activeQuizQuestions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    updated.forEach((q, i) => (q.orderIndex = i));
    setActiveQuizQuestions(updated);
    setSelectedQuestionIndex(targetIndex);

    setAutosaveStatus("saving");
    try {
      await fetch(`/api/quizzes/${activeQuiz.id}/questions/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: updated.map((q) => q.id) }),
      });
      setAutosaveStatus("saved");
    } catch (e) {
      setAutosaveStatus("unsaved");
    }
  };

  const handleUpdateActiveQuestion = (field: string, value: any) => {
    if (selectedQuestionIndex < 0 || selectedQuestionIndex >= activeQuizQuestions.length) return;
    setAutosaveStatus("unsaved");

    const updated = [...activeQuizQuestions];
    const current = { ...updated[selectedQuestionIndex] };

    if (field === "questionText" || field === "explanation") {
      current.questionSnapshot = {
        ...current.questionSnapshot,
        [field]: value,
      };
    } else if (field === "type") {
      current.questionType = value;
      let qData = current.questionSnapshot?.questionData || {};
      if (value === "true_false") {
        qData = {
          ...qData,
          options: ["সত্য (True)", "মিথ্যা (False)"],
          correctAnswer: typeof qData.correctAnswer === "boolean" ? qData.correctAnswer : true,
          correctIndex: 0,
        };
      } else if (value === "matching") {
        if (!qData.pairs || qData.pairs.length === 0) {
          qData = {
            ...qData,
            pairs: [
              { left: "বাম পাশ ১ (আইটেম ক)", right: "ডান পাশ ১ (সম্পর্কিত তথ্য)" },
              { left: "বাম পাশ ২ (আইটেম খ)", right: "ডান পাশ ২ (সম্পর্কিত তথ্য)" },
              { left: "বাম পাশ ৩ (আইটেম গ)", right: "ডান পাশ ৩ (সম্পর্কিত তথ্য)" },
            ],
          };
        }
      } else if (value === "fill_blank") {
        if (!qData.acceptedAnswers || qData.acceptedAnswers.length === 0) {
          qData = {
            ...qData,
            acceptedAnswers: ["সঠিক উত্তর"],
          };
        }
      } else if (value === "ordering") {
        if (!qData.items || qData.items.length === 0) {
          qData = {
            ...qData,
            items: ["ধাপ ১: প্রস্তুতি", "ধাপ ২: সংযোগ", "ধাপ ৩: পরীক্ষণ"],
          };
        }
      } else if (value === "short_answer") {
        if (!qData.expectedAnswerKeyword) {
          qData = {
            ...qData,
            expectedAnswerKeyword: "সঠিক উত্তর",
          };
        }
      } else if (value === "mcq_single" || value === "mcq_multiple") {
        if (!qData.options || qData.options.length < 2) {
          qData = {
            ...qData,
            options: ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
            correctIndex: 0,
          };
        }
      }
      current.questionSnapshot = {
        ...current.questionSnapshot,
        questionData: qData,
      };
    } else if (field === "marks" || field === "timeLimit") {
      (current as any)[field] = value;
    } else if (field.startsWith("data.")) {
      const subKey = field.replace("data.", "");
      current.questionSnapshot = {
        ...current.questionSnapshot,
        questionData: {
          ...current.questionSnapshot.questionData,
          [subKey]: value,
        },
      };
    }

    updated[selectedQuestionIndex] = current;
    setActiveQuizQuestions(updated);

    // Auto debounce save
    setTimeout(() => {
      setAutosaveStatus("saved");
    }, 1000);
  };

  // Stats calculation
  const totalQuizzes = quizzes.length;
  const draftQuizzes = quizzes.filter((q) => q.status === "draft").length;
  const publishedQuizzes = quizzes.filter((q) => q.status === "published").length;
  const archivedQuizzes = quizzes.filter((q) => q.status === "archived").length;
  const totalQuestions = questionBank.length;

  const totalQuizMarks = activeQuizQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
  const totalQuizDuration = activeQuiz
    ? activeQuiz.totalDuration || Math.ceil((activeQuizQuestions.length * 45) / 60)
    : 0;

  // Filtered Quizzes
  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || q.category === categoryFilter;
    const matchesMode = modeFilter === "all" || q.mode === modeFilter;
    const matchesClass = classFilter === "all" || q.classId === Number(classFilter);
    return matchesSearch && matchesStatus && matchesCategory && matchesMode && matchesClass;
  });

  const paginatedQuizzes = filteredQuizzes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Step resolution & dynamic counts
  const isStep1 = activeTab === "create_quiz" || activeTab === "ai_generator" || activeTab === "question_bank";
  const isStep2 =
    activeTab === "my_quizzes" ||
    activeTab === "dashboard" ||
    activeTab === "builder" ||
    activeTab === "preview" ||
    activeTab === "settings" ||
    activeTab === "tournaments";

  let localStudioDraftCount = 0;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("quizStudioDraft");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) localStudioDraftCount = arr.length;
      }
    } catch {}
  }
  const draftCount = parsedQuestions.length || activeQuizQuestions.length || localStudioDraftCount || 0;

  const handleLaunchLive = () => {
    if (onLaunchLiveArena) {
      if (activeQuiz) {
        onLaunchLiveArena(activeQuiz.id);
      } else if (quizzes.length > 0) {
        onLaunchLiveArena(quizzes[0].id);
      } else {
        onLaunchLiveArena("comp-iot");
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ============ SIMPLIFIED STEP 1-2-3 PILL TAB NAVIGATION ============ */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Live Quiz Arena Module
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              লাইভ কুইজ এরিনা (Quiz Builder & Question Bank)
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              কারিগরি ও সাধারণ ট্রেডের জন্য কুইজ তৈরি, কোয়েশ্চেন ব্যাংক হ্যান্ডলিং, এবং প্রিমিয়াম কুইজ বিল্ডার এনভায়রনমেন্ট।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowManualCreatorModal(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> ম্যানুয়াল প্রশ্ন তৈরি
            </button>
            <button
              onClick={() => setActiveTab("create_quiz")}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> নতুন কুইজ তৈরি করুন
            </button>
            <button
              onClick={() => setActiveTab("question_bank")}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <BookOpen className="w-4 h-4" /> কোয়েশ্চেন ব্যাংক
            </button>
          </div>
        </div>

        {/* ========================================================
            3-STEP PILL TAB NAVIGATION (১-২-৩ ধাপ নেভিগেশন)
            ======================================================== */}
        <div className="mt-8 pt-5 border-t border-indigo-500/20 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => setActiveTab("create_quiz")}
              className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer select-none text-left ${
                isStep1
                  ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-black shadow-xl shadow-indigo-500/40 ring-2 ring-cyan-300 scale-[1.01]"
                  : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm transition-all ${
                    isStep1
                      ? "bg-white text-indigo-700 shadow-md"
                      : "bg-indigo-900/60 text-indigo-300 border border-indigo-500/30"
                  }`}
                >
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider opacity-85 font-bold">ধাপ ১ • প্রশ্ন স্টুডিও</div>
                  <div className="text-sm sm:text-base font-black tracking-tight">১. ➕ স্লাইড ও প্রশ্ন তৈরি</div>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black shadow-xs shrink-0 transition-all ${
                  isStep1
                    ? "bg-white text-indigo-950 font-black"
                    : "bg-indigo-500/20 text-cyan-300 border border-indigo-400/30"
                }`}
                title="ড্রাফট প্রশ্ন সংখ্যা"
              >
                {draftCount} টি
              </span>
            </button>

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => {
                if (!isStep2) setActiveTab("my_quizzes");
              }}
              className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer select-none text-left ${
                isStep2
                  ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-black shadow-xl shadow-indigo-500/40 ring-2 ring-cyan-300 scale-[1.01]"
                  : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm transition-all ${
                    isStep2
                      ? "bg-white text-indigo-700 shadow-md"
                      : "bg-indigo-900/60 text-indigo-300 border border-indigo-500/30"
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider opacity-85 font-bold">ধাপ ২ • সংরক্ষিত ভল্ট</div>
                  <div className="text-sm sm:text-base font-black tracking-tight">২. সংরক্ষিত কুইজ</div>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black shadow-xs shrink-0 transition-all ${
                  isStep2
                    ? "bg-white text-indigo-950 font-black"
                    : "bg-indigo-500/20 text-cyan-300 border border-indigo-400/30"
                }`}
                title="সংরক্ষিত কুইজের মোট সংখ্যা"
              >
                {totalQuizzes} টি
              </span>
            </button>

            {/* Step 3 Pill */}
            <button
              type="button"
              onClick={handleLaunchLive}
              className="p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer select-none text-left bg-gradient-to-r from-rose-950/70 via-slate-900 to-indigo-950/70 hover:from-rose-900/80 hover:to-indigo-900/80 border border-rose-500/40 hover:border-rose-400 text-white shadow-lg hover:shadow-rose-500/20 group active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/30 text-rose-400 border border-rose-500/40 flex items-center justify-center font-black text-sm shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                  <Play className="w-4 h-4 fill-current text-rose-400" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider opacity-85 font-bold flex items-center gap-1.5 text-rose-300">
                    ধাপ ৩ • রিয়েল-টাইম এরিনা
                  </div>
                  <div className="text-sm sm:text-base font-black flex items-center gap-2">
                    <span>৩. 🔴 লাইভ ক্লাসরুম</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                </span>
                <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-xs">
                  লাইভ শুরু
                </span>
              </div>
            </button>
          </div>

          {/* Sub-Pills Bar for Step 1 or Step 2 */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 no-scrollbar text-xs font-bold">
            {isStep1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab("create_quiz")}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "create_quiz"
                      ? "bg-white text-slate-950 font-black shadow-md ring-1 ring-indigo-400"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>কুইজ তৈরির স্টুডিও</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("question_bank")}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "question_bank"
                      ? "bg-white text-slate-950 font-black shadow-md ring-1 ring-indigo-400"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>প্রশ্ন ব্যাংক ও রিসোর্স ({totalQuestions})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualCreatorModal(true)}
                  className="px-4 py-2 rounded-xl text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>দ্রুত ম্যানুয়াল প্রশ্ন যোগ</span>
                </button>
              </>
            )}

            {isStep2 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab("my_quizzes")}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "my_quizzes"
                      ? "bg-white text-slate-950 font-black shadow-md ring-1 ring-indigo-400"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>সংরক্ষিত কুইজ তালিকা ({totalQuizzes})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "dashboard"
                      ? "bg-white text-slate-950 font-black shadow-md ring-1 ring-indigo-400"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>অ্যানালিটিক্স ড্যাশবোর্ড</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("tournaments")}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "tournaments"
                      ? "bg-white text-slate-950 font-black shadow-md ring-1 ring-amber-400"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>টুর্নামেন্ট ও ব্র্যাকেট</span>
                </button>
                {activeQuiz && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab("builder")}
                      className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === "builder"
                          ? "bg-white text-slate-950 font-black shadow-md ring-1 ring-indigo-400"
                          : "text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>বিল্ডার: {activeQuiz.title.slice(0, 15)}...</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("preview")}
                      className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === "preview"
                          ? "bg-white text-slate-950 font-black shadow-md ring-1 ring-indigo-400"
                          : "text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <span>প্রিভিউ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === "settings"
                          ? "bg-white text-slate-950 font-black shadow-md ring-1 ring-indigo-400"
                          : "text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-300" />
                      <span>সেটিংস</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            <GlowCard
              variant="indigo"
              intensity="soft"
              animatedBorder="hover"
              shineSweep={true}
              className="p-5 flex items-center gap-4 group"
            >
              <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl text-white shadow-md shadow-indigo-500/30 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                <Layers className="w-6 h-6 filter drop-shadow(0 0 4px rgba(255,255,255,0.7))" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">মোট কুইজ</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  <AnimatedCounter value={totalQuizzes} />
                </h3>
              </div>
            </GlowCard>

            <GlowCard
              variant="emerald"
              intensity="soft"
              animatedBorder="hover"
              shineSweep={true}
              className="p-5 flex items-center gap-4 group"
            >
              <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl text-white shadow-md shadow-emerald-500/30 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-300">
                <CheckCircle2 className="w-6 h-6 filter drop-shadow(0 0 4px rgba(255,255,255,0.7))" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">পাবলিশড (Live)</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  <AnimatedCounter value={publishedQuizzes} />
                </h3>
              </div>
            </GlowCard>

            <GlowCard
              variant="amber"
              intensity="soft"
              animatedBorder="hover"
              shineSweep={true}
              className="p-5 flex items-center gap-4 group"
            >
              <div className="p-3 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-2xl text-white shadow-md shadow-amber-500/30 group-hover:scale-125 transition-all duration-300">
                <Edit3 className="w-6 h-6 filter drop-shadow(0 0 4px rgba(255,255,255,0.7))" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">ড্রাফট কুইজ</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  <AnimatedCounter value={draftQuizzes} />
                </h3>
              </div>
            </GlowCard>

            <GlowCard
              variant="rose"
              intensity="soft"
              animatedBorder="hover"
              shineSweep={true}
              className="p-5 flex items-center gap-4 group"
            >
              <div className="p-3 bg-gradient-to-tr from-rose-500 to-red-600 rounded-2xl text-white shadow-md shadow-rose-500/30 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                <Archive className="w-6 h-6 filter drop-shadow(0 0 4px rgba(255,255,255,0.7))" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">আর্কাইভড</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  <AnimatedCounter value={archivedQuizzes} />
                </h3>
              </div>
            </GlowCard>

            <GlowCard
              variant="purple"
              intensity="soft"
              animatedBorder="hover"
              shineSweep={true}
              className="p-5 flex items-center gap-4 col-span-2 sm:col-span-1 group"
            >
              <div className="p-3 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-2xl text-white shadow-md shadow-purple-500/30 group-hover:scale-125 transition-all duration-300">
                <BookOpen className="w-6 h-6 filter drop-shadow(0 0 4px rgba(255,255,255,0.7))" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">মোট প্রশ্ন</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  <AnimatedCounter value={totalQuestions} />
                </h3>
              </div>
            </GlowCard>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200 dark:border-indigo-900/50 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  কুইজ অ্যাকশন সেন্টার (Quick Quiz Actions)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  নতুন প্রশ্ন যোগ করুন অথবা ড্রাফট থেকে এডিটিং কন্টিনিউ করুন
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
              <button
                onClick={() => setActiveTab("create_quiz")}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> নতুন কুইজ
              </button>
              <button
                onClick={() => setActiveTab("question_bank")}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" /> কোয়েশ্চেন ব্যাংক খুলুন
              </button>
            </div>
          </div>

          {/* Quiz Cards Section with Search/Filter */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="কুইজের নাম খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs font-bold">
                {["all", "published", "draft", "archived"].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-2 rounded-xl capitalize transition-all whitespace-nowrap ${
                      statusFilter === st
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold shadow-sm"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    {st === "all" ? "সকল কুইজ" : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <div className="relative h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={quiz.thumbnail}
                      alt={quiz.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          quiz.status === "published"
                            ? "bg-emerald-500 text-white shadow-md"
                            : quiz.status === "draft"
                            ? "bg-amber-500 text-white shadow-md"
                            : "bg-slate-600 text-white"
                        }`}
                      >
                        {quiz.status}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold">
                        {quiz.category}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" /> {quiz.totalDuration} min
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-black text-slate-900 dark:text-white text-base line-clamp-2 leading-snug">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {quiz.description || "কোনো বিস্তারিত ডেসক্রিপশন দেওয়া নেই।"}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> Class {quiz.classId}
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Subject #{quiz.subjectId}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <Layers className="w-3.5 h-3.5" />
                        <span>
                          {institutionalDb.quizQuestions.filter((qq) => qq.quizId === quiz.id).length} Questions
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => loadQuizForBuilder(quiz)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/50 rounded-xl transition-all"
                          title="Edit in Builder"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          disabled={operatingQuizId === quiz.id}
                          onClick={() => handleDuplicateQuiz(quiz.id)}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-all cursor-pointer"
                          title="Duplicate Quiz"
                        >
                          {operatingQuizId === quiz.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={async () => {
                            await loadQuizForBuilder(quiz);
                            setActiveTab("preview");
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 dark:bg-purple-950/40 dark:hover:bg-purple-950/50 rounded-xl transition-all cursor-pointer"
                          title="কুইজ প্রিভিউ দেখুন (Preview Quiz)"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {quiz.status === "draft" ? (
                          <button
                            disabled={operatingQuizId === quiz.id}
                            onClick={() => handlePublishQuiz(quiz.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            {operatingQuizId === quiz.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-white" />
                                <span>Publishing...</span>
                              </>
                            ) : (
                              <span>Publish</span>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => onLaunchLiveArena && onLaunchLiveArena(quiz.id)}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" /> Live Mode
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {filteredQuizzes.length > itemsPerPage && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(currentPage * itemsPerPage, filteredQuizzes.length)} of {filteredQuizzes.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage * itemsPerPage >= filteredQuizzes.length}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY QUIZZES */}
      {activeTab === "my_quizzes" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="কুইজ খুঁজুন (Search Quiz)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
            >
              <option value="all">সকল মোড (All Modes)</option>
              <option value="academic">Academic</option>
              <option value="general">General</option>
            </select>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
            >
              <option value="all">সকল শ্রেণি (All Classes)</option>
              {academicContext.classes.map((c: any) => (
                <option key={c.id} value={c.numericValue}>Class {c.numericValue}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
            >
              <option value="all">স্ট্যাটাস (Status)</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Quiz Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Class / Trade</th>
                  <th className="p-3">Questions</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quizzes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{q.title}</td>
                    <td className="p-3">{q.category}</td>
                    <td className="p-3">Class {q.classId}</td>
                    <td className="p-3">
                      {institutionalDb.quizQuestions.filter((qq) => qq.quizId === q.id).length} Qs
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          q.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : q.status === "draft"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (onLaunchLiveArena) {
                              onLaunchLiveArena(q.id);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 cursor-pointer transition-all active:scale-95"
                          title="সরাসরি লাইভ ক্লাসরুম শুরু করুন"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>▶️ লাইভ করুন</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => loadQuizForBuilder(q)}
                          className="px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-950/40 dark:hover:bg-indigo-950 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 cursor-pointer transition-all"
                          title="এডিট করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>✏️ এডিট</span>
                        </button>
                        <button
                          type="button"
                          disabled={operatingQuizId === q.id}
                          onClick={() => handleDuplicateQuiz(q.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 rounded-xl cursor-pointer transition-all"
                          title="ডুপ্লিকেট"
                        >
                          {operatingQuizId === q.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={operatingQuizId === q.id}
                          onClick={() => handleDeleteQuiz(q.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50 rounded-xl cursor-pointer transition-all"
                          title="মুছে ফেলুন"
                        >
                          {operatingQuizId === q.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CREATE QUIZ FORM & DIRECT INLINE AI EDITOR */}
      {activeTab === "create_quiz" && (
        <div className="space-y-6">
          {/* Unified Creation Mode Selector */}
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/90 rounded-2xl border border-indigo-500/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white">কুইজ তৈরির মোড নির্বাচন করুন</h3>
                <p className="text-[10px] text-slate-400">এআই ইনলাইন এডিটর, সাধারণ ফর্ম অথবা প্রশ্ন পেস্ট করে দ্রুত কুইজ প্রস্তুত করুন।</p>
              </div>
            </div>

            <div className="flex flex-wrap bg-slate-950 p-1.5 rounded-2xl gap-1.5 font-bold text-xs border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setCreationMode("mentimeter_studio")}
                className={`py-2 px-3.5 sm:px-4 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  creationMode === "mentimeter_studio"
                    ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-md font-extrabold ring-1 ring-cyan-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>✨ AI দিয়ে তৈরি</span>
              </button>
              <button
                type="button"
                onClick={() => setCreationMode("copypaste")}
                className={`py-2 px-3.5 sm:px-4 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  creationMode === "copypaste"
                    ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-md font-extrabold ring-1 ring-cyan-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <ClipboardPaste className="w-4 h-4 text-cyan-300" />
                <span>📋 কপি-পেস্ট</span>
              </button>
              <button
                type="button"
                onClick={() => setCreationMode("manual")}
                className={`py-2 px-3.5 sm:px-4 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  creationMode === "manual"
                    ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-md font-extrabold ring-1 ring-cyan-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Edit3 className="w-4 h-4 text-emerald-300" />
                <span>✍️ নিজে লিখুন</span>
              </button>
            </div>
          </div>

          {creationMode === "mentimeter_studio" ? (
            <MentimeterInteractiveAiQuizStudio
              onSaveSuccess={(savedQuiz, published) => {
                fetchQuizzes();
                if (published && onLaunchLiveArena) {
                  onLaunchLiveArena(savedQuiz.id);
                } else {
                  loadQuizForBuilder(savedQuiz);
                }
              }}
              onCancel={() => setActiveTab("my_quizzes")}
              onLaunchLiveArena={onLaunchLiveArena}
            />
          ) : (
            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    নতুন কুইজ তৈরি করুন (Create New Quiz)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ম্যানুয়ালি অথবা কপি-পেস্ট করে দ্রুততম সময়ে আকর্ষণীয় লাইভ কুইজ তৈরি করুন।
                  </p>
                </div>
              </div>

          <form onSubmit={handleCreateQuizSubmit} className="space-y-4 text-xs font-bold">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300">কুইজের শিরোনাম (Quiz Title) *</label>
              <input
                type="text"
                required
                value={newQuizForm.title}
                onChange={(e) => setNewQuizForm({ ...newQuizForm, title: e.target.value })}
                placeholder="যেমন: ইলেকট্রিক্যাল সেফটি ও ওহমস ল কুইজ"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300">বিবরণ (Description)</label>
              <textarea
                rows={2}
                value={newQuizForm.description}
                onChange={(e) => setNewQuizForm({ ...newQuizForm, description: e.target.value })}
                placeholder="কুইজের বিষয়বস্তু সংক্ষেপে বর্ণনা করুন..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300">কুইজ মোড (Quiz Mode)</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setNewQuizForm({ ...newQuizForm, mode: "academic" })}
                    className={`flex-1 py-2 rounded-lg transition-all text-[10px] font-bold ${
                      newQuizForm.mode === "academic"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:bg-slate-700"
                    }`}
                  >
                    🎓 Academic
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewQuizForm({ ...newQuizForm, mode: "general" })}
                    className={`flex-1 py-2 rounded-lg transition-all text-[10px] font-bold ${
                      newQuizForm.mode === "general"
                        ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:bg-slate-700"
                    }`}
                  >
                    🌍 General
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300">ক্যাটাগরি (Category)</label>
                <select
                  value={newQuizForm.category}
                  onChange={(e) => setNewQuizForm({ ...newQuizForm, category: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                >
                  <option value="Practice">Practice</option>
                  <option value="Class Test">Class Test</option>
                  <option value="Model Test">Model Test</option>
                  <option value="Competition">Competition</option>
                  <option value="Revision">Revision</option>
                  <option value="Assessment">Assessment</option>
                </select>
              </div>
            </div>

            {newQuizForm.mode === "academic" && (
              <div className="bg-indigo-50/30 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">শিক্ষাবর্ষ (Year)</label>
                    <select
                      value={newQuizForm.academicYearId}
                      onChange={(e) => setNewQuizForm({ ...newQuizForm, academicYearId: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                    >
                      {academicContext.years.map((y: string) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">শ্রেণি (Class)</label>
                    <select
                      value={newQuizForm.classId}
                      onChange={(e) => setNewQuizForm({ ...newQuizForm, classId: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                    >
                      {academicContext.classes.map((c: any) => (
                        <option key={c.id} value={c.numericValue}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">শাখা (Section)</label>
                    <select
                      value={newQuizForm.sectionId}
                      onChange={(e) => setNewQuizForm({ ...newQuizForm, sectionId: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                    >
                      <option value="">সকল শাখা (All)</option>
                      {academicContext.sections.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.sectionName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {academicContext.trades.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">ট্রেড (Trade)</label>
                      <select
                        value={newQuizForm.tradeId || ""}
                        onChange={(e) => setNewQuizForm({ ...newQuizForm, tradeId: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                      >
                        <option value="">সাধারণ (General/Core)</option>
                        {academicContext.trades.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className={academicContext.trades.length > 0 ? "space-y-1" : "col-span-2 space-y-1"}>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">বিষয় (Subject)</label>
                    <select
                      required={newQuizForm.mode === "academic"}
                      value={newQuizForm.subjectId || ""}
                      onChange={(e) => setNewQuizForm({ ...newQuizForm, subjectId: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                    >
                      <option value="">বিষয় নির্বাচন করুন</option>
                      {academicContext.subjects.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {newQuizForm.subjectId && academicContext.chapters.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">অধ্যায় (Chapter)</label>
                      <select
                        value={newQuizForm.chapterId || ""}
                        onChange={(e) => setNewQuizForm({ ...newQuizForm, chapterId: e.target.value || undefined })}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                      >
                        <option value="">পুরো বই (Full Subject)</option>
                        {academicContext.chapters.map((c: any) => (
                          <option key={c.id} value={c.chapterName}>{c.chapterNameBangla || c.chapterName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">টপিক (Topic)</label>
                      <select
                        value={newQuizForm.topicId || ""}
                        onChange={(e) => setNewQuizForm({ ...newQuizForm, topicId: e.target.value || undefined })}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                      >
                        <option value="">পুরো অধ্যায় (Full Chapter)</option>
                        {academicContext.topics
                          .filter((t: any) => !newQuizForm.chapterId || t.chapterName === newQuizForm.chapterId)
                          .map((t: any) => (
                            <option key={t.id} value={t.id}>{t.topicNameBangla || t.topicName}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300">ডিফল্ট নম্বর প্রতি প্রশ্ন (Default Marks)</label>
                <input
                  type="number"
                  value={newQuizForm.defaultMarks}
                  onChange={(e) => setNewQuizForm({ ...newQuizForm, defaultMarks: Number(e.target.value) })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300">ডিফল্ট সময় (সেকেন্ড)</label>
                <input
                  type="number"
                  value={newQuizForm.defaultQuestionTime}
                  onChange={(e) => setNewQuizForm({ ...newQuizForm, defaultQuestionTime: Number(e.target.value) })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
            </div>

            {/* IF COPY PASTE CREATION MODE IS SELECTED */}
            {creationMode === "copypaste" ? (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                      <span>📋 প্রশ্ন কপি-পেস্ট করুন (Bulk Copy-Paste Parser)</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">নিচের বক্সে আপনার প্রশ্ন পেস্ট করুন। সিস্টেম স্বয়ংক্রিয়ভাবে রিয়েল-টাইমে পার্স করবে।</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleParseText(`1. ওহমের সূত্র কোনটি?
A) V = IR
B) P = VI
C) I = VR
D) R = VI
Correct: A
Explanation: V = IR is the standard mathematical expression of Ohm's Law.

2. এসি (AC) কারেন্টের প্রবাহের দিক পরিবর্তন হয় কি?
A) হ্যাঁ
B) না
C) মাঝে মাঝে
D) স্থির থাকে
Correct: A
Explanation: Alternating current constantly reverses its direction.`);
                    }}
                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all"
                  >
                    💡 ডেমো টেক্সট লোড করুন
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={copyPasteText}
                  onChange={(e) => handleParseText(e.target.value)}
                  placeholder={`ফরম্যাট উদাহরণ (Format Example):

1. আপনার প্রশ্নের টেক্সট এখানে লিখুন
A) প্রথম অপশন
B) দ্বিতীয় অপশন
C) তৃতীয় অপশন
D) চতুর্থ অপশন
Correct: A
Explanation: এটি সঠিক উত্তরের ব্যাখ্যা।`}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 font-semibold"
                />

                {/* Parsed Preview Panel */}
                {parsedQuestions.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/50 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-700 dark:text-indigo-400">
                          🔍 পার্সড প্রিভিউ (Parsed Questions: {parsedQuestions.length}টি)
                        </span>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-extrabold">
                          Ready to Create
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCreateQuizWithBulkQuestions(true, true)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs font-black shadow-md shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <span>🚀 কুইজ সেভ ও লাইভ শুরু করুন</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {parsedQuestions.map((q, idx) => (
                        <div key={q.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                          {editingParsedIndex === idx ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">প্রশ্ন (Question Text)</label>
                                <input
                                  type="text"
                                  value={q.questionText}
                                  onChange={(e) => {
                                    const updated = [...parsedQuestions];
                                    updated[idx].questionText = e.target.value;
                                    setParsedQuestions(updated);
                                  }}
                                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                                />
                              </div>
                              
                              {q.type === "mcq_single" && (
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">অপশন ও সঠিক উত্তর</label>
                                  {q.questionData.options.map((opt: string, oIdx: number) => (
                                    <div key={oIdx} className="flex items-center gap-1.5">
                                      <input
                                        type="radio"
                                        name={`correct-${q.id}`}
                                        checked={String(q.questionData.correctIndex ?? "") === String(oIdx)}
                                        onChange={() => {
                                          const updated = [...parsedQuestions];
                                          updated[idx].questionData.correctIndex = oIdx;
                                          setParsedQuestions(updated);
                                        }}
                                      />
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                          const updated = [...parsedQuestions];
                                          updated[idx].questionData.options[oIdx] = e.target.value;
                                          setParsedQuestions(updated);
                                        }}
                                        className="flex-1 p-1 px-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">ব্যাখ্যা (Explanation)</label>
                                <input
                                  type="text"
                                  value={q.explanation}
                                  onChange={(e) => {
                                    const updated = [...parsedQuestions];
                                    updated[idx].explanation = e.target.value;
                                    setParsedQuestions(updated);
                                  }}
                                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => setEditingParsedIndex(null)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                সংরক্ষণ করুন
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                                  <span>{idx + 1}. {q.questionText}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 uppercase font-mono font-black scale-90">
                                    {q.type}
                                  </span>
                                </div>
                                {q.type === "mcq_single" && (
                                  <div className="grid grid-cols-2 gap-1.5 mt-2 pl-3">
                                    {q.questionData.options.map((opt: string, oIdx: number) => (
                                      <div key={oIdx} className={`p-1.5 px-2 rounded-lg text-[10px] font-bold ${
                                        String(q.questionData.correctIndex ?? "") === String(oIdx)
                                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-black"
                                          : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                      }`}>
                                        {String.fromCharCode(65 + oIdx)}) {opt}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 pl-3 italic font-medium">ব্যাখ্যা: {q.explanation}</p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setEditingParsedIndex(idx)}
                                  className="p-1 text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-950/40 dark:hover:bg-indigo-950 rounded cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setParsedQuestions(parsedQuestions.filter((_, qIdx) => qIdx !== idx));
                                  }}
                                  className="p-1 text-rose-500 hover:bg-rose-50 dark:bg-rose-950/40 dark:hover:bg-rose-950 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Bulk creator CTAs */}
                    <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800/40">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCreateQuizWithBulkQuestions(false)}
                          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Edit2 className="w-4 h-4 text-indigo-600" /> ড্রাফট হিসেবে সেভ ও রিভিউ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateQuizWithBulkQuestions(true)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> শুধু পাবলিশ করুন
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCreateQuizWithBulkQuestions(true, true)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs font-black shadow-lg shadow-emerald-500/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <span className="text-sm">🚀</span>
                        <span>কুইজ সেভ ও লাইভ শুরু করুন</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* IF MANUAL MODE: JUST SHOW SUBMIT AT THE END */
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className="px-5 py-2.5 rounded-xl border font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuiz}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  {isSubmittingQuiz ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>কুইজ তৈরি হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" /> <span>কুইজ তৈরি ও বিল্ডারে প্রবেশ</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  )}

      {/* TAB 4: QUIZ BUILDER */}
      {activeTab === "builder" && activeQuiz && (
        <div className="space-y-4">
          {/* Builder Top Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {activeQuiz.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Status: <span className="font-bold capitalize text-indigo-600">{activeQuiz.status}</span>
                </p>
              </div>
            </div>

            {/* Top Bar Stats & Autosave */}
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Questions: {activeQuizQuestions.length}</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Total Marks: {totalQuizMarks}</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Est. Duration: {totalQuizDuration} min</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs">
                {autosaveStatus === "saving" && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />}
                {autosaveStatus === "saved" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                {autosaveStatus === "unsaved" && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                <span className="capitalize">{autosaveStatus}</span>
              </div>

              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setBuilderViewMode("mentimeter_studio")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    builderViewMode === "mentimeter_studio"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white dark:hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>মেন্টমিটার এআই স্টুডিও</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderViewMode("column")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    builderViewMode === "column"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>৩-কলাম ভিউ</span>
                </button>
              </div>

              <button
                onClick={() => setActiveTab("preview")}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4" /> Preview
              </button>
            </div>
          </div>

          {builderViewMode === "mentimeter_studio" ? (
            <MentimeterInteractiveAiQuizStudio
              initialQuiz={activeQuiz}
              onSaveSuccess={(savedQuiz, published) => {
                fetchQuizzes();
                loadQuizForBuilder(savedQuiz);
                if (published && onLaunchLiveArena) {
                  onLaunchLiveArena(savedQuiz.id);
                }
              }}
              onCancel={() => setActiveTab("my_quizzes")}
              onLaunchLiveArena={onLaunchLiveArena}
            />
          ) : (
            /* Builder 3-Column Layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Question List & Adders */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    প্রশ্নসমূহ ({activeQuizQuestions.length})
                  </h3>
                  <button
                    onClick={() => setIsQbDrawerOpen(true)}
                    className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-lg hover:bg-indigo-100 text-[11px] font-bold flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> কোয়েশ্চেন ব্যাংক
                  </button>
                </div>

                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                  {activeQuizQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      onClick={() => setSelectedQuestionIndex(idx)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        selectedQuestionIndex === idx
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md font-bold"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="truncate flex items-center gap-2 pr-2">
                        <span className="opacity-70 font-mono">Q{idx + 1}.</span>
                        <span className="truncate">{q.questionSnapshot?.questionText || "Untitled"}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(idx, "up");
                          }}
                          className="p-1 hover:bg-black/10 rounded"
                          disabled={idx === 0}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(idx, "down");
                          }}
                          className="p-1 hover:bg-black/10 rounded"
                          disabled={idx === activeQuizQuestions.length - 1}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestionFromQuiz(q.id);
                          }}
                          className="p-1 hover:bg-rose-500/20 text-rose-500 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                  {/* Add New Question Palette */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-[10px] font-bold uppercase text-slate-400">নতুন প্রশ্ন যোগ করুন (Type)</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUESTION_TYPES.map((qt) => (
                      <button
                        key={qt.type}
                        onClick={() => handleAddNewQuestionToQuiz(qt.type)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 text-left truncate flex items-center gap-1.5 transition"
                      >
                        <qt.icon className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {qt.label.split(" — ")[0].split(" / ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: Main Question Editor */}
            <div className="lg:col-span-6 space-y-4">
              {activeQuizQuestions[selectedQuestionIndex] ? (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>প্রশ্ন #{selectedQuestionIndex + 1} এডিটিং</span>
                      <select
                        value={activeQuizQuestions[selectedQuestionIndex].questionType}
                        onChange={(e) => handleUpdateActiveQuestion("type", e.target.value)}
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold outline-none cursor-pointer"
                      >
                        {QUESTION_TYPES.map((qt) => (
                          <option key={qt.type} value={qt.type}>
                            {qt.label}
                          </option>
                        ))}
                      </select>
                    </h3>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1 text-xs font-bold">
                    <label className="text-slate-700 dark:text-slate-300">প্রশ্নের বিবরণ (Question Text) *</label>
                    <textarea
                      rows={3}
                      value={activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionText || ""}
                      onChange={(e) => handleUpdateActiveQuestion("questionText", e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                    />
                  </div>

                  {/* Options Editor (Dynamic based on Question Type) */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      উত্তর ও অপশনসমূহ (Answers & Configuration)
                    </label>

                    {/* 1. MCQ Single Choice */}
                    {activeQuizQuestions[selectedQuestionIndex].questionType === "mcq_single" && (
                      <div className="space-y-2">
                        {(
                          activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.options || [
                            "Option A",
                            "Option B",
                          ]
                        ).map((opt: string, optIdx: number) => {
                          const isCorrect =
                            String(activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.correctIndex ?? "") === String(optIdx);
                          return (
                            <div key={optIdx} className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateActiveQuestion("data.correctIndex", optIdx)}
                                className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                                  isCorrect
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                }`}
                              >
                                {isCorrect ? "Correct ✓" : `Select ${String.fromCharCode(65 + optIdx)}`}
                              </button>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const opts = [
                                    ...(activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.options || []),
                                  ];
                                  opts[optIdx] = e.target.value;
                                  handleUpdateActiveQuestion("data.options", opts);
                                }}
                                className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. MCQ Multiple Choice */}
                    {activeQuizQuestions[selectedQuestionIndex].questionType === "mcq_multiple" && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">একাধিক সঠিক উত্তর চিহ্নিত করতে বাটনে ক্লিক করুন:</p>
                        {(
                          activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.options || [
                            "Option A",
                            "Option B",
                            "Option C",
                            "Option D",
                          ]
                        ).map((opt: string, optIdx: number) => {
                          const curIndices: any[] =
                            activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.correctIndices || [0];
                          const isCorrect = curIndices.map(String).includes(String(optIdx));
                          return (
                            <div key={optIdx} className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const next = isCorrect
                                    ? curIndices.filter((i) => String(i) !== String(optIdx))
                                    : [...curIndices, optIdx];
                                  handleUpdateActiveQuestion("data.correctIndices", next.length > 0 ? next : [optIdx]);
                                }}
                                className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                                  isCorrect
                                    ? "bg-purple-600 text-white border-purple-600"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                }`}
                              >
                                {isCorrect ? "✓ Selected" : `Option ${String.fromCharCode(65 + optIdx)}`}
                              </button>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const opts = [
                                    ...(activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.options || []),
                                  ];
                                  opts[optIdx] = e.target.value;
                                  handleUpdateActiveQuestion("data.options", opts);
                                }}
                                className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 3. True / False */}
                    {activeQuizQuestions[selectedQuestionIndex].questionType === "true_false" && (
                      <div className="flex items-center gap-4 text-xs font-bold">
                        <button
                          onClick={() => handleUpdateActiveQuestion("data.correctAnswer", true)}
                          className={`flex-1 py-3 rounded-xl border font-black transition-all ${
                            activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.correctAnswer === true
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          True (সত্য)
                        </button>
                        <button
                          onClick={() => handleUpdateActiveQuestion("data.correctAnswer", false)}
                          className={`flex-1 py-3 rounded-xl border font-black transition-all ${
                            activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.correctAnswer === false
                              ? "bg-rose-600 text-white border-rose-600 shadow-md"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          False (মিথ্যা)
                        </button>
                      </div>
                    )}

                    {/* 4. Matching Pairs (ডান পাশ - বাম পাশ) */}
                    {(activeQuizQuestions[selectedQuestionIndex].questionType === "matching" ||
                      (activeQuizQuestions[selectedQuestionIndex] as any).type === "matching") && (
                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-amber-200 dark:border-amber-900/40">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-amber-700 dark:text-amber-300">🔗 বাম পাশ ↔ ডান পাশ মিলকরণ জোড়াসমূহ (Matching Pairs):</span>
                          <button
                            type="button"
                            onClick={() => {
                              const curPairs = [
                                ...(activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.pairs || []),
                              ];
                              if (curPairs.length < 10) {
                                curPairs.push({
                                  id: curPairs.length + 1,
                                  left: `বাম পাশ ${curPairs.length + 1}`,
                                  right: `ডান পাশ ${curPairs.length + 1}`,
                                });
                                handleUpdateActiveQuestion("data.pairs", curPairs);
                                handleUpdateActiveQuestion("data.correctAnswer", JSON.stringify(curPairs));
                              }
                            }}
                            className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                          >
                            + জোড়া যোগ
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(
                            activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.pairs || [
                              { left: "বাম পাশ ১", right: "ডান পাশ ১" },
                              { left: "বাম পাশ ২", right: "ডান পাশ ২" },
                            ]
                          ).map((p: any, pIdx: number) => (
                            <div key={pIdx} className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {pIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={p.left}
                                onChange={(e) => {
                                  const pairs = [
                                    ...(activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.pairs || []),
                                  ];
                                  pairs[pIdx] = { ...pairs[pIdx], left: e.target.value };
                                  handleUpdateActiveQuestion("data.pairs", pairs);
                                }}
                                placeholder="বাম পাশ"
                                className="flex-1 p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                              />
                              <span className="text-amber-500 font-bold">↔</span>
                              <input
                                type="text"
                                value={p.right}
                                onChange={(e) => {
                                  const pairs = [
                                    ...(activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.pairs || []),
                                  ];
                                  pairs[pIdx] = { ...pairs[pIdx], right: e.target.value };
                                  handleUpdateActiveQuestion("data.pairs", pairs);
                                }}
                                placeholder="ডান পাশ"
                                className="flex-1 p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                              />
                              {(activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.pairs || []).length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const pairs = (
                                      activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.pairs || []
                                    ).filter((_: any, idx: number) => idx !== pIdx);
                                    handleUpdateActiveQuestion("data.pairs", pairs);
                                  }}
                                  className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 5. Fill in the Blank */}
                    {activeQuizQuestions[selectedQuestionIndex].questionType === "fill_blank" && (
                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-cyan-200 dark:border-cyan-900/40">
                        <label className="text-xs font-bold text-cyan-700 dark:text-cyan-300 block">
                          📝 গ্রহণযোগ্য সঠিক উত্তরসমূহ (Accepted Answers):
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(
                            activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.acceptedAnswers || ["সঠিক উত্তর"]
                          ).map((ans: string, aIdx: number) => (
                            <span
                              key={aIdx}
                              className="px-2.5 py-1 bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-200 rounded-lg text-xs font-bold flex items-center gap-1.5"
                            >
                              <span>{ans}</span>
                              {(
                                activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.acceptedAnswers || []
                              ).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cur = (
                                      activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.acceptedAnswers || []
                                    ).filter((_: any, idx: number) => idx !== aIdx);
                                    handleUpdateActiveQuestion("data.acceptedAnswers", cur);
                                  }}
                                  className="text-rose-500 hover:text-rose-700"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="বিকল্প উত্তর লিখে Enter চাপুন..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val) {
                                const cur = [
                                  ...(activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.acceptedAnswers || []),
                                ];
                                if (!cur.includes(val)) cur.push(val);
                                handleUpdateActiveQuestion("data.acceptedAnswers", cur);
                                e.currentTarget.value = "";
                              }
                            }
                          }}
                          className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                        />
                      </div>
                    )}

                    {/* 6. Short Answer */}
                    {activeQuizQuestions[selectedQuestionIndex].questionType === "short_answer" && (
                      <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-teal-200 dark:border-teal-900/40">
                        <label className="text-xs font-bold text-teal-700 dark:text-teal-300 block">
                          ✍️ প্রধান কী-ওয়ার্ড (Expected Keyword):
                        </label>
                        <input
                          type="text"
                          value={
                            activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.expectedAnswerKeyword || ""
                          }
                          onChange={(e) => handleUpdateActiveQuestion("data.expectedAnswerKeyword", e.target.value)}
                          placeholder="যেমন: ওহমের সূত্র"
                          className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                        />
                      </div>
                    )}

                    {/* 7. Ordering Sequence */}
                    {activeQuizQuestions[selectedQuestionIndex].questionType === "ordering" && (
                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-purple-200 dark:border-purple-900/40">
                        <label className="text-xs font-bold text-purple-700 dark:text-purple-300 block">
                          🔢 সঠিক ক্রমানুসারে সাজানো ধাপসমূহ (Ordering):
                        </label>
                        <div className="space-y-2">
                          {(
                            activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.items || [
                              "ধাপ ১",
                              "ধাপ ২",
                              "ধাপ ৩",
                            ]
                          ).map((it: string, itIdx: number) => (
                            <div key={itIdx} className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {itIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={it}
                                onChange={(e) => {
                                  const items = [
                                    ...(activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.questionData?.items || []),
                                  ];
                                  items[itIdx] = e.target.value;
                                  handleUpdateActiveQuestion("data.items", items);
                                }}
                                className="flex-1 p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Explanation */}
                  <div className="space-y-1 text-xs font-bold pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-slate-700 dark:text-slate-300">ব্যাখ্যা / সমাধান (Explanation)</label>
                    <textarea
                      rows={2}
                      value={activeQuizQuestions[selectedQuestionIndex].questionSnapshot?.explanation || ""}
                      onChange={(e) => handleUpdateActiveQuestion("explanation", e.target.value)}
                      placeholder="শিক্ষার্থীদের প্রদর্শনের জন্য সঠিক উত্তরের ব্যাখ্যা দিন..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
                  <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="font-bold text-slate-700 dark:text-slate-300">কোনো প্রশ্ন নির্বাচিত নেই</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    বামদিকের তালিকা থেকে যেকোনো প্রশ্ন সিলেক্ট করুন অথবা নিচের যেকোনো বাটন চেপে সরাসরি নতুন প্রশ্ন যোগ করুন:
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto pt-2">
                    {QUESTION_TYPES.map((qt) => (
                      <button
                        key={qt.type}
                        onClick={() => handleAddNewQuestionToQuiz(qt.type)}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <qt.icon className="w-3.5 h-3.5" />
                        <span>+ {qt.label.split(" — ")[0].split(" / ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Question Settings & Config */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs font-bold">
                <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  প্রশ্ন সেটিংস (Marks & Timer)
                </h3>

                {activeQuizQuestions[selectedQuestionIndex] && (
                  <>
                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-400">নম্বর (Marks)</label>
                      <input
                        type="number"
                        value={activeQuizQuestions[selectedQuestionIndex].marks}
                        onChange={(e) => handleUpdateActiveQuestion("marks", Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-400">সময়সীমা (Seconds)</label>
                      <input
                        type="number"
                        value={activeQuizQuestions[selectedQuestionIndex].timeLimit || 60}
                        onChange={(e) => handleUpdateActiveQuestion("timeLimit", Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                      />
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {/* Question Stepper Navigation */}
                  <div className="flex items-center justify-between gap-2 pb-1">
                    <button
                      type="button"
                      disabled={selectedQuestionIndex <= 0}
                      onClick={() => setSelectedQuestionIndex((prev) => Math.max(0, prev - 1))}
                      className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl disabled:opacity-40 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-center"
                    >
                      ← Previous Question
                    </button>
                    <button
                      type="button"
                      disabled={selectedQuestionIndex >= activeQuizQuestions.length - 1}
                      onClick={() => setSelectedQuestionIndex((prev) => {
                        const next = prev + 1;
                        return next < activeQuizQuestions.length ? next : prev;
                      })}
                      className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl disabled:opacity-40 cursor-pointer hover:bg-indigo-700 transition-all text-center"
                    >
                      Next Question →
                    </button>
                  </div>

                  <button
                    onClick={() => handlePublishQuiz(activeQuiz.id)}
                    className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md"
                  >
                    পাবলিশ কুইজ (Publish Quiz)
                  </button>
                  <button
                    onClick={() => onLaunchLiveArena && onLaunchLiveArena(activeQuiz.id)}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-current" /> লাইভ গেম স্টার্ট
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

      {/* TAB 5: QUESTION BANK */}
      {activeTab === "question_bank" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-black uppercase tracking-wider border border-cyan-500/20">
                  সেন্ট্রাল ডাটাবেস
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  মোট প্রশ্ন: {questionBank.length} টি
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                সেন্ট্রাল কোয়েশ্চেন ব্যাংক (Central Question Bank Repository)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সকল বিষয়ের মাস্টার প্রশ্ন সংগ্রহশালা। প্রশ্ন বাছাই করে সরাসরি লাইভ কাহুট পিন লবি শুরু করুন অথবা কুইজে যুক্ত করুন।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => setShowManualCreatorModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> ম্যানুয়াল প্রশ্ন তৈরি
              </button>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="প্রশ্ন বা সমাধান খুঁজুন..."
                  value={qbSearch}
                  onChange={(e) => setQbSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Launch Live Lobby with Selected or All */}
              <button
                type="button"
                onClick={() => {
                  const targetQuestions = selectedQbIds.length > 0
                    ? questionBank.filter((q) => selectedQbIds.includes(q.id))
                    : questionBank;

                  if (targetQuestions.length === 0) {
                    alert("দয়া করে কমপক্ষে ১টি প্রশ্ন নির্বাচন করুন");
                    return;
                  }

                  // Create dynamic quiz in institutionalDb and launch
                  const dynamicQuizId = `quiz-bank-${Date.now()}`;
                  const convertedList = targetQuestions.map((q, idx) => {
                    const qData = q.questionData || {};
                    let options = ["Option A", "Option B", "Option C", "Option D"];
                    let correctAnswer = 0;

                    if (qData.options && Array.isArray(qData.options) && qData.options.length > 0) {
                      options = qData.options;
                      correctAnswer = qData.correctIndex ?? 0;
                    } else if (q.type === "true_false") {
                      options = ["সত্য (True)", "মিথ্যা (False)"];
                      correctAnswer = qData.correctAnswer ? 0 : 1;
                    } else if (q.type === "short_answer") {
                      options = [qData.expectedAnswerKeyword || "সঠিক উত্তর", "বিকল্প ১", "বিকল্প ২", "বিকল্প ৩"];
                      correctAnswer = 0;
                    }

                    return {
                      id: idx + 1,
                      question: q.questionText,
                      options,
                      correctAnswer,
                      explanation: q.explanation || "",
                    };
                  });

                  const newQuiz: any = {
                    id: dynamicQuizId,
                    title: `কোয়েশ্চেন ব্যাংক লাইভ সেশন (${convertedList.length}টি প্রশ্ন)`,
                    trade: "PTSC General & Vocational",
                    level: "Standard",
                    questions: convertedList,
                  };

                  // Register in memory DB
                  institutionalDb.quizzes.unshift({
                    id: String(Date.now()),
                    title: newQuiz.title,
                    description: "Created directly from Central Question Bank",
                    thumbnail: "",
                    mode: "general",
                    academicYearId: 2026,
                    category: "General",
                    defaultMarks: 10,
                    negativeMarking: false,
                    randomizeQuestions: true,
                    randomizeOptions: true,
                    defaultQuestionTime: 30,
                    totalDuration: 15,
                    showScore: true,
                    showCorrectAnswer: true,
                    showExplanation: true,
                    showLeaderboard: true,
                    status: "published",
                    creatorId: 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  });

                  if (onLaunchLiveArena) {
                    onLaunchLiveArena(dynamicQuizId);
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition transform active:scale-95"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>
                  {selectedQbIds.length > 0
                    ? `🚀 নির্বাচিত ${selectedQbIds.length}টি প্রশ্ন দিয়ে লাইভ পিন লবি চালু করুন`
                    : `🚀 সব প্রশ্ন দিয়ে লাইভ পিন লবি চালু করুন`}
                </span>
              </button>
            </div>
          </div>

          {/* Filters Bar: Types & Difficulty */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Question Type Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">টাইপ:</span>
              {[
                { id: "all", label: "সকল টাইপ" },
                { id: "mcq_single", label: "MCQ একক" },
                { id: "mcq_multiple", label: "MCQ বহু" },
                { id: "short_answer", label: "সংক্ষিপ্ত প্রশ্ন" },
                { id: "true_false", label: "সত্য / মিথ্যা" },
                { id: "matching", label: "মিলকরণ" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setQbTypeFilter(t.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs cursor-pointer ${
                    qbTypeFilter === t.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">কাঠিন্য:</span>
              {[
                { id: "all", label: "সব" },
                { id: "easy", label: "সহজ" },
                { id: "medium", label: "মধ্যম" },
                { id: "hard", label: "কঠিন" },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setQbDifficultyFilter(d.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                    qbDifficultyFilter === d.id
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {d.label}
                </button>
              ))}

              {/* Select All Toggle */}
              <button
                type="button"
                onClick={() => {
                  const filtered = questionBank.filter((q) => {
                    const matchSearch = q.questionText.toLowerCase().includes(qbSearch.toLowerCase());
                    const matchType = qbTypeFilter === "all" || q.type === qbTypeFilter;
                    const matchDiff = qbDifficultyFilter === "all" || q.difficulty === qbDifficultyFilter;
                    return matchSearch && matchType && matchDiff;
                  });

                  if (selectedQbIds.length === filtered.length) {
                    setSelectedQbIds([]);
                  } else {
                    setSelectedQbIds(filtered.map((q) => q.id));
                  }
                }}
                className="ml-2 px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                {selectedQbIds.length > 0 ? "সিলেকশন মুছুন" : "সব সিলেক্ট করুন"}
              </button>
            </div>
          </div>

          {/* Questions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questionBank
              .filter((q) => {
                const matchSearch = q.questionText.toLowerCase().includes(qbSearch.toLowerCase());
                const matchType = qbTypeFilter === "all" || q.type === qbTypeFilter;
                const matchDiff = qbDifficultyFilter === "all" || q.difficulty === qbDifficultyFilter;
                return matchSearch && matchType && matchDiff;
              })
              .map((q) => {
                const isSelected = selectedQbIds.includes(q.id);
                const qData = q.questionData || {};

                return (
                  <div
                    key={q.id}
                    className={`p-4 bg-slate-50 dark:bg-slate-800/60 border rounded-2xl space-y-3 text-xs transition-all relative ${
                      isSelected
                        ? "border-cyan-500 ring-2 ring-cyan-500/20 shadow-md"
                        : "border-slate-200 dark:border-slate-700/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedQbIds(selectedQbIds.filter((id) => id !== q.id));
                            } else {
                              setSelectedQbIds([...selectedQbIds, q.id]);
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                        />
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase">
                          {q.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                          {q.difficulty}
                        </span>
                        <span>Class {q.classId || "All"}</span>
                      </div>
                    </div>

                    <p className="font-bold text-slate-900 dark:text-white text-sm leading-relaxed">
                      {q.questionText}
                    </p>

                    {/* Options / Answers Preview - Strictly Conditional based on Question Type */}
                    {((q.type as string) === "mcq_single" || (q.type as string) === "mcq_multiple" || (q.type as string) === "MCQ" || (!q.type && !qData.pairs && !qData.acceptedAnswers)) && qData.options && Array.isArray(qData.options) && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {qData.options.map((opt: string, optIdx: number) => {
                          const isCorrect = String(qData.correctIndex ?? "") === String(optIdx) || 
                            (Array.isArray(qData.correctIndices) && qData.correctIndices.map(String).includes(String(optIdx)));
                          return (
                            <div
                              key={optIdx}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-between border ${
                                isCorrect
                                  ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              <span className="truncate">{opt}</span>
                              {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* MATCHING PAIRS PREVIEW */}
                    {((q.type as string) === "matching" || (q.type as string) === "MATCHING" || (qData.pairs && qData.pairs.length > 0)) && (
                      <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block uppercase tracking-wider">
                          🔗 বাম ↔ ডান মিলকরণ জোড়াসমূহ (Matching Pairs):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {((qData.pairs || (q as any).matchingPairs || [])).map((p: any, pIdx: number) => (
                            <div key={pIdx} className="p-1.5 px-2.5 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800 text-xs flex items-center justify-between">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{p.left}</span>
                              <span className="text-amber-500 font-bold mx-1">↔</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{p.right}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FILL IN THE BLANKS PREVIEW */}
                    {((q.type as string) === "fill_blank" || (q.type as string) === "FILL_BLANKS" || (q.type as string) === "fill_in_blank") && (
                      <div className="p-3 bg-cyan-50/70 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-800/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 block uppercase tracking-wider">
                          📝 শূন্যস্থান পূরণের গ্রহণযোগ্য উত্তরসমূহ (Accepted Answers):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {((qData.acceptedAnswers || (q as any).acceptedAnswers || ["সঠিক উত্তর"])).map((ans: string, aIdx: number) => (
                            <span key={aIdx} className="px-2.5 py-0.5 bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-200 rounded-md text-xs font-bold font-mono">
                              {ans}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ORDERING PREVIEW */}
                    {((q.type as string) === "ordering" || (q.type as string) === "REORDER") && (
                      <div className="p-3 bg-teal-50/70 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 block uppercase tracking-wider">
                          ⬇ সঠিক ক্রম ধাপসমূহ (Sequence Steps):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {((qData.items || (q as any).correctOrder || [])).map((item: string, iIdx: number) => (
                            <span key={iIdx} className="px-2.5 py-0.5 bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 rounded-md text-xs font-bold">
                              {iIdx + 1}. {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.type === "short_answer" && (
                      <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-[11px]">
                        <span className="font-bold text-teal-800 dark:text-teal-300">মূল ধারণা / কীওয়ার্ড: </span>
                        <span className="text-teal-700 dark:text-teal-400 font-mono">
                          {qData.expectedAnswerKeyword || "ধারণাগত নির্ভুলতা ও সংশ্লিষ্ট সূত্রের প্রয়োগ"}
                        </span>
                      </div>
                    )}

                    {q.type === "true_false" && (
                      <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        সঠিক উত্তর:{" "}
                        <span className={qData.correctAnswer ? "text-emerald-500" : "text-rose-500"}>
                          {qData.correctAnswer ? "সত্য (True)" : "মিথ্যা (False)"}
                        </span>
                      </div>
                    )}

                    {q.explanation && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        💡 সমাধান/ব্যাখ্যা: {q.explanation}
                      </p>
                    )}

                    {activeQuiz && (
                      <button
                        onClick={() => handleAddFromQuestionBank(q)}
                        className="mt-2 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> বর্তমান কুইজে যুক্ত করুন
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB: UNIFIED AI GENERATOR */}
      {activeTab === "ai_generator" && (
        <MentimeterInteractiveAiQuizStudio
          onSaveSuccess={(savedQuiz, published) => {
            fetchQuizzes();
            if (published && onLaunchLiveArena) {
              onLaunchLiveArena(savedQuiz.id);
            } else {
              loadQuizForBuilder(savedQuiz);
            }
          }}
          onCancel={() => setActiveTab("my_quizzes")}
          onLaunchLiveArena={onLaunchLiveArena}
        />
      )}

      {/* TAB 6: PREVIEW */}
      {activeTab === "preview" && activeQuiz && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" /> কুইজ প্রিভিউ: {activeQuiz.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                শিক্ষার্থীরা যেভাবে কুইজটি দেখবে তার সরাসরি ইন্টারেক্টিভ সিমুলেটর।
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden p-0.5 bg-slate-100 dark:bg-slate-800">
                <button
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    previewDevice === "desktop" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title="ডেস্কটপ ভিউ"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    previewDevice === "mobile" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title="মোবাইল ভিউ"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>

              {/* Direct Live Launch Button from Preview */}
              <button
                onClick={() => onLaunchLiveArena && onLaunchLiveArena(activeQuiz.id)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> এই কুইজ লাইভ শুরু করুন
              </button>
            </div>
          </div>

          <div
            className={`mx-auto transition-all duration-300 ${
              previewDevice === "mobile"
                ? "max-w-md border-[10px] border-slate-900 rounded-[40px] shadow-2xl overflow-hidden p-2 bg-slate-950 text-white"
                : "w-full max-w-5xl"
            }`}
          >
            {activeQuizQuestions[previewCurrentQIndex] ? (
              <div className="space-y-4">
                <UniversalQuizShowcaseEngine
                  question={activeQuizQuestions[previewCurrentQIndex]}
                  questionIndex={previewCurrentQIndex}
                  totalQuestions={activeQuizQuestions.length}
                  templateId={previewTemplateId || (((previewCurrentQIndex || 0) % 20) + 1)}
                  selectedAnswer={previewSelectedAnswer}
                  onSelectAnswer={(ans) => setPreviewSelectedAnswer(ans)}
                  onTemplateChange={(newId) => setPreviewTemplateId(newId)}
                  showProofBadge={true}
                  autoRandomize={true}
                />

                <div className="flex items-center justify-between pt-2 px-2 gap-2 flex-wrap">
                  <button
                    disabled={previewCurrentQIndex <= 0}
                    onClick={() => {
                      setPreviewSelectedAnswer(null);
                      setPreviewCurrentQIndex((p) => Math.max(0, p - 1));
                    }}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl disabled:opacity-40 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                  >
                    ← পূর্ববর্তী প্রশ্ন (Previous)
                  </button>

                  <button
                    onClick={() => onLaunchLiveArena && onLaunchLiveArena(activeQuiz.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> লাইভ হোস্ট করুন
                  </button>

                  <button
                    disabled={previewCurrentQIndex >= activeQuizQuestions.length - 1}
                    onClick={() => {
                      setPreviewSelectedAnswer(null);
                      setPreviewCurrentQIndex((prev) => {
                        const nextIdx = prev + 1;
                        return nextIdx < activeQuizQuestions.length ? nextIdx : prev;
                      });
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl disabled:opacity-40 cursor-pointer shadow-md shadow-indigo-600/20 transition-all"
                  >
                    পরবর্তী প্রশ্ন (Next Question) →
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <p className="text-xs text-slate-400">প্রিভিউ করার মতো কোনো প্রশ্ন নেই।</p>
                <button
                  onClick={() => onLaunchLiveArena && onLaunchLiveArena(activeQuiz.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> লাইভ মোডে চালু করুন
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fallback when Preview tab is clicked without active quiz */}
      {activeTab === "preview" && !activeQuiz && (
        <div className="max-w-xl mx-auto p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mx-auto">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
            প্রিভিউ করার জন্য একটি কুইজ নির্বাচন করুন
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            যেকোনো কুইজের প্রিভিউ দেখতে অথবা সরাসরি লাইভ হোস্ট শুরু করতে নিচের একটি কুইজ নির্বাচন করুন:
          </p>
          <div className="space-y-2 pt-2">
            {(quizzes.length > 0 ? quizzes : institutionalDb.quizzes).slice(0, 4).map((q: any) => (
              <div key={q.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="text-left">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100">{q.title}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{q.category || "General"} • Class {q.classId || "All"}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={async () => {
                      await loadQuizForBuilder(q);
                      setActiveTab("preview");
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> প্রিভিউ
                  </button>
                  <button
                    onClick={() => onLaunchLiveArena && onLaunchLiveArena(q.id)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> লাইভ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: TOURNAMENTS & ELIMINATION BRACKETS */}
      {activeTab === "tournaments" && (
        <div className="space-y-6">
          <TournamentDashboard
            quizzes={quizzes.length > 0 ? quizzes : institutionalDb.quizzes}
            students={institutionalDb.students}
            onStartMatchSession={(_sessionId, quizId) => {
              if (onLaunchLiveArena) {
                onLaunchLiveArena(quizId);
              }
            }}
          />
        </div>
      )}

      {/* Manual Custom MCQ Authoring Modal */}
      <ManualQuestionCreatorModal
        isOpen={showManualCreatorModal}
        onClose={() => setShowManualCreatorModal(false)}
        quizzes={quizzes}
        activeQuizId={activeQuiz?.id}
        onQuestionCreated={async () => {
          await fetchQuestionBank();
          if (activeQuiz) {
            await loadQuizForBuilder(activeQuiz);
          }
        }}
      />
    </div>
  );
}
