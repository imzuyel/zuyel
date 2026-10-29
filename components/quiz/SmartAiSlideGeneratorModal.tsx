"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  BookOpen,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Check,
  X,
  Layers,
  Clock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  HelpCircle,
  Sliders,
  Filter,
  CheckSquare,
  Square,
  BookMarked,
  FileCheck2,
  ChevronRight,
  MessageSquare,
  Hash,
  GraduationCap,
  Copy,
  ClipboardCheck,
  Wand2,
  Zap,
  ArrowUp,
  ArrowDown,
  Repeat,
  Sparkle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGlobalAcademic } from "@/context/GlobalAcademicContext";
import { PresentationSlide, SlideType, isGradedQuiz } from "./UnifiedQuizMentimeterWorkspace";
import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  doesClassHaveTrade,
  getApplicableTradesForClass,
  parseClassNumeric,
} from "@/lib/academicStructure";
import {
  getSingleSourceSubjects,
  fetchSubjectsByClassTrade,
  DynamicSubjectItem,
} from "@/lib/globalSubjectMappingHub";

export type GeneratorMode = "copy_paste" | "topic_prompt" | "pdf_book" | "copilot_existing";

interface CentralBookDoc {
  id: string;
  title: string;
  originalFilename?: string;
  description?: string;
  pageCount?: number;
  chapter?: string;
  topic?: string;
  tags?: string[];
  classId?: number;
  tradeId?: number;
  tradeName?: string;
  className?: string;
  createdAt?: string;
}

interface SmartAiSlideGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSlides: (
    newSlides: PresentationSlide[],
    mode?: "append" | "insert_after_active" | "update_in_place" | "replace_all"
  ) => void;
  activeTrade?: string;
  activeClass?: string;
  activeSubject?: string;
  activeClassId?: string | number;
  activeTradeId?: string | number;
  activeSubjectId?: string | number;
  activeSubjectCode?: string;
  existingSlides?: PresentationSlide[];
  activeSlideId?: string;
}

interface GeneratedItem {
  id: string;
  type: SlideType;
  title: string;
  content?: string;
  options: string[];
  correctAnswer: number | boolean | string;
  pairs?: { left: string; right: string }[];
  items?: string[];
  acceptedAnswers?: string[];
  timeLimit: number;
  points: number;
  explanation?: string;
  pageNumber?: number;
  sourceExcerpt?: string;
  isSelected: boolean;
  isRegenerating?: boolean;
}

const QUESTION_TYPE_OPTIONS = [
  { id: "MCQ", label: "MCQ (বহুনির্বাচনী)", icon: "🔘", desc: "৪টি অপশন" },
  { id: "FILL_BLANKS", label: "FILL_BLANKS (শূন্যস্থান)", icon: "📝", desc: "বাক্যের শূন্যস্থান" },
  { id: "MATCHING", label: "MATCHING (ডান-বাম মিল)", icon: "🔗", desc: "বাম-ডান জোড়া" },
  { id: "REORDER", label: "REORDER (ক্রম সাজানো)", icon: "🔢", desc: "ধারাবাহিক ধাপ" },
  { id: "TRUE_FALSE", label: "TRUE_FALSE (সত্য/মিথ্যা)", icon: "⚖️", desc: "যাচাই বিবৃতি" },
];

export default function SmartAiSlideGeneratorModal({
  isOpen,
  onClose,
  onInsertSlides,
  activeTrade,
  activeClass,
  activeSubject,
  activeClassId,
  activeTradeId,
  activeSubjectId,
  activeSubjectCode,
  existingSlides = [],
  activeSlideId,
}: SmartAiSlideGeneratorModalProps) {
  // Global Academic Context
  let globalCtx: any = null;
  try {
    globalCtx = useGlobalAcademic();
  } catch (e) {
    // outside provider safe fallback
  }

  // Active step: "configure" | "review"
  const [step, setStep] = useState<"configure" | "review">("configure");

  // TASK 1: 4 Top Mode Tabs (Default: topic_prompt or copy_paste)
  const [generatorMode, setGeneratorMode] = useState<GeneratorMode>(() => {
    return existingSlides.length > 0 ? "topic_prompt" : "topic_prompt";
  });

  // Step 1, 2, 3: Cascading Academic Mapping States
  const [modalClassId, setModalClassId] = useState<string>(() => {
    return String(activeClassId || activeClass || "4");
  });
  const [modalTradeId, setModalTradeId] = useState<string>(() => {
    return String(activeTradeId || "102");
  });
  const [modalSubjectId, setModalSubjectId] = useState<string>(() => {
    return String(activeSubjectId || "");
  });
  const [modalSubjectCode, setModalSubjectCode] = useState<string>(() => {
    return String(activeSubjectCode || "");
  });
  const [modalSubjects, setModalSubjects] = useState<DynamicSubjectItem[]>(() => {
    return getSingleSourceSubjects({
      classVal: activeClassId || activeClass || "4",
      tradeVal: activeTradeId || "102",
      academicYear: "2026",
    });
  });

  const modalHasTrade = useMemo(() => doesClassHaveTrade(modalClassId), [modalClassId]);
  const modalApplicableTrades = useMemo(() => {
    if (!modalHasTrade) return [];
    return getApplicableTradesForClass(modalClassId);
  }, [modalClassId, modalHasTrade]);

  // Sync with incoming props or global context whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    const initialCls = String(activeClassId || activeClass || globalCtx?.selectedClassId || "4");
    const initialTrd = String(activeTradeId || globalCtx?.selectedTradeId || "102");
    setModalClassId(initialCls);
    setModalTradeId(initialTrd);
    if (activeSubjectId) setModalSubjectId(String(activeSubjectId));
    if (activeSubjectCode) setModalSubjectCode(activeSubjectCode);

    const subs = getSingleSourceSubjects({ classVal: initialCls, tradeVal: initialTrd, academicYear: "2026" });
    setModalSubjects(subs);
    if (subs.length > 0 && !activeSubjectId) {
      setModalSubjectId(String(subs[0].id));
      setModalSubjectCode(subs[0].code);
      if (!chapterPrompt) setChapterPrompt(subs[0].nameBangla || subs[0].name);
    }
  }, [isOpen, activeClassId, activeClass, activeTradeId, activeSubjectId, activeSubjectCode, globalCtx?.selectedClassId, globalCtx?.selectedTradeId]);

  // Handle Class change in Modal
  const handleModalClassChange = async (newClassId: string) => {
    setModalClassId(newClassId);
    const hasTrade = doesClassHaveTrade(newClassId);
    let nextTrade = modalTradeId;
    if (!hasTrade) {
      nextTrade = "all";
      setModalTradeId("all");
    } else {
      const trades = getApplicableTradesForClass(newClassId);
      const isStillValid = trades.some((t) => String(t.id) === modalTradeId || t.code === modalTradeId);
      if (!isStillValid && trades.length > 0) {
        nextTrade = String(trades[0].id);
        setModalTradeId(nextTrade);
      }
    }

    const subs = await fetchSubjectsByClassTrade(newClassId, nextTrade, "2026");
    setModalSubjects(subs);
    if (subs.length > 0) {
      setModalSubjectId(String(subs[0].id));
      setModalSubjectCode(subs[0].code);
      setChapterPrompt(subs[0].nameBangla || subs[0].name);
    } else {
      setModalSubjectId("");
      setModalSubjectCode("");
    }
  };

  const handleModalTradeChange = async (newTradeId: string) => {
    setModalTradeId(newTradeId);
    const subs = await fetchSubjectsByClassTrade(modalClassId, newTradeId, "2026");
    setModalSubjects(subs);
    if (subs.length > 0) {
      const stillValid = subs.some((s) => String(s.id) === modalSubjectId || s.code === modalSubjectCode);
      if (!stillValid) {
        setModalSubjectId(String(subs[0].id));
        setModalSubjectCode(subs[0].code);
        setChapterPrompt(subs[0].nameBangla || subs[0].name);
      }
    }
  };

  const handleModalSubjectChange = (subjectIdStr: string) => {
    setModalSubjectId(subjectIdStr);
    const sub = modalSubjects.find((s) => String(s.id) === subjectIdStr);
    if (sub) {
      setModalSubjectCode(sub.code);
      setChapterPrompt(sub.nameBangla || sub.name);
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 1: COPY-PASTE IMPORT STATES (Task 1.1)
  // ---------------------------------------------------------------------------
  const [copyPasteText, setCopyPasteText] = useState("");
  const [isCopiedPrompt, setIsCopiedPrompt] = useState(false);
  const [isParsingText, setIsParsingText] = useState(false);

  // Copy Ready Prompt to Clipboard for external AI (ChatGPT/Claude/Gemini)
  const handleCopyReadyPrompt = () => {
    const subName = modalSubjects.find((s) => String(s.id) === modalSubjectId)?.nameBangla || activeSubject || "কারিগরি বিষয়";
    const trdName = ALL_TRADES.find((t) => String(t.id) === modalTradeId)?.nameBangla || activeTrade || "ভোকেশনাল ট্রেড";
    const clsName = ACADEMIC_CLASSES.find((c) => String(c.id) === modalClassId)?.nameBangla || `Class ${modalClassId}`;

    const promptText = `তুমি একজন অভিজ্ঞ কারিগরি শিক্ষা (BTEB) শিক্ষক ও কুইজ মাস্টার।
শ্রেণি: ${clsName}
ট্রেড/বিভাগ: ${trdName}
বিষয়: ${subName}

দয়া করে এই বিষয়ের ওপর ৫টি বৈচিত্র্যময় ও আকর্ষণীয় কুইজ প্রশ্ন তৈরি করে দাও:
১. একটি বহুনির্বাচনী প্রশ্ন (MCQ): ৪টি অপশন (ক, খ, গ, ঘ) ও সঠিক উত্তর।
২. একটি সত্য/মিথ্যা প্রশ্ন (True/False): বিবৃতি ও সঠিক উত্তর।
৩. একটি শূন্যস্থান পূরণ প্রশ্ন (Fill Blanks): বাক্য ও সঠিক উত্তর।
৪. একটি মিলকরণ প্রশ্ন (Matching): বাম পাশ -> ডান পাশ ৩টি জোড়া।
৫. একটি ধারাবাহিক ক্রম সাজানো (Reorder): ৩টি কাজের ধাপ।

প্রতিটি প্রশ্নের সাথে ১ লাইনের সুন্দর ব্যাখ্যা যোগ করো।
আউটপুটটি বাংলায় পরিষ্কার টেক্সট অথবা JSON আকারে দাও যাতে সহজে কপি করা যায়।`;

    navigator.clipboard.writeText(promptText);
    setIsCopiedPrompt(true);
    showToast("✅ প্রম্পট কপি হয়েছে! ChatGPT বা Gemini-তে পেস্ট করুন", "success");
    setTimeout(() => setIsCopiedPrompt(false), 3000);
  };

  // Parse Raw Text via Enhanced /api/ai/parse-quiz-text
  const handleParseQuizText = async () => {
    if (!copyPasteText.trim()) {
      showToast("দয়া করে যেকোনো টেক্সট বা প্রশ্ন পেস্ট করুন", "error");
      return;
    }

    setIsParsingText(true);
    try {
      const res = await fetch("/api/ai/parse-quiz-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: copyPasteText,
          trade: ALL_TRADES.find((t) => String(t.id) === modalTradeId)?.name || activeTrade,
          classLevel: modalClassId,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.slides) && data.slides.length > 0) {
        const mapped: GeneratedItem[] = data.slides.map((s: any, idx: number) => ({
          id: s.id || `pasted-${Date.now()}-${idx + 1}`,
          type: s.type || "MCQ",
          title: s.title || `প্রশ্ন ${idx + 1}`,
          content: s.content || "",
          options: Array.isArray(s.options) ? s.options : [],
          correctAnswer: s.correctAnswer ?? 0,
          pairs: s.pairs,
          items: s.items,
          acceptedAnswers: s.acceptedAnswers,
          timeLimit: s.timeLimit || 30,
          points: s.points || 100,
          explanation: s.explanation || "",
          isSelected: true,
        }));

        setGeneratedItems(mapped);
        setInsertMode("append");
        setStep("review");
        showToast(`✨ ${mapped.length}টি স্লাইড সফলভাবে পার্স করা হয়েছে!`, "success");
      } else {
        showToast(data.message || "কোনো প্রশ্ন বা স্লাইড পার্স করা সম্ভব হয়নি", "error");
      }
    } catch (err: any) {
      showToast("টেক্সট পার্স করতে সমস্যা হয়েছে", "error");
    } finally {
      setIsParsingText(false);
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 3: CENTRAL BOOKS & PDF STATES (Task 1.3)
  // ---------------------------------------------------------------------------
  const [books, setBooks] = useState<CentralBookDoc[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [bookSearch, setBookSearch] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const [showUploadDropzone, setShowUploadDropzone] = useState(false);
  const [isUploadingBook, setIsUploadingBook] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");

  const [fromPage, setFromPage] = useState<number | string>(1);
  const [toPage, setToPage] = useState<number | string>(15);

  // ---------------------------------------------------------------------------
  // TAB 2 & GENERAL CONFIGURATION STATES (Task 1.2)
  // ---------------------------------------------------------------------------
  const [chapterPrompt, setChapterPrompt] = useState("");
  const [slideCount, setSlideCount] = useState<number>(10);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "MCQ",
    "FILL_BLANKS",
    "MATCHING",
    "REORDER",
    "TRUE_FALSE",
  ]);
  const [includeWarmup, setIncludeWarmup] = useState<boolean>(true);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("mixed");

  const [includeGreeting, setIncludeGreeting] = useState<boolean>(true);
  const [includeIcebreaker, setIncludeIcebreaker] = useState<boolean>(true);
  const [includePrepCheck, setIncludePrepCheck] = useState<boolean>(true);
  const [leaderboardInterval, setLeaderboardInterval] = useState<"none" | "every_1" | "every_3" | "every_5">("every_3");
  const [includeClosingFeedback, setIncludeClosingFeedback] = useState<boolean>(true);
  const [customFlowPrompt, setCustomFlowPrompt] = useState<string>("");

  // ---------------------------------------------------------------------------
  // TAB 4: EXISTING SLIDES AI CO-PILOT STATES (Task 1.4)
  // ---------------------------------------------------------------------------
  const [selectedExistingSlideIds, setSelectedExistingSlideIds] = useState<Set<string>>(() => {
    return new Set(existingSlides.map((s) => s.id));
  });
  const [coPilotAction, setCoPilotAction] = useState<"beautify" | "extend" | "convert" | "cleanup">("beautify");
  const [coPilotTargetType, setCoPilotTargetType] = useState<SlideType>("MATCHING");
  const [coPilotCustomInstruction, setCoPilotCustomInstruction] = useState("");
  const [isExecutingCoPilot, setIsExecutingCoPilot] = useState(false);

  // Review & Insertion Mode
  const [insertMode, setInsertMode] = useState<"append" | "insert_after_active" | "update_in_place" | "replace_all">("append");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(1);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const [editingItemIds, setEditingItemIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const toggleEditItem = (id: string) => {
    setEditingItemIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Central Books Library
  useEffect(() => {
    if (!isOpen) return;

    const fetchCentralBooks = async () => {
      setIsLoadingBooks(true);
      try {
        const query = new URLSearchParams();
        query.set("limit", "50");
        if (modalClassId && modalClassId !== "all") query.set("classId", modalClassId);
        if (modalTradeId && modalTradeId !== "all") query.set("tradeId", modalTradeId);
        if (modalSubjectId && modalSubjectId !== "all") query.set("subjectId", modalSubjectId);

        const res = await fetch(`/api/ai/pdf-manager?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.documents)) {
            setBooks(data.documents);
            if (data.documents.length > 0 && !selectedBookId) {
              const matched = data.documents.find(
                (d: any) =>
                  (activeTrade && d.tradeName?.toLowerCase().includes(activeTrade.toLowerCase())) ||
                  (d.title && activeTrade && d.title.toLowerCase().includes(activeTrade.toLowerCase()))
              );
              setSelectedBookId(matched ? matched.id : data.documents[0].id);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch central books:", err);
      } finally {
        setIsLoadingBooks(false);
      }
    };

    fetchCentralBooks();
  }, [isOpen, modalClassId, modalTradeId, modalSubjectId, activeTrade]);

  const selectedBook = useMemo(() => {
    return books.find((b) => b.id === selectedBookId) || null;
  }, [books, selectedBookId]);

  useEffect(() => {
    if (selectedBook) {
      setFromPage(1);
      setToPage(Math.max(1, selectedBook.pageCount || 10));
      if (selectedBook.chapter && !chapterPrompt) {
        setChapterPrompt(selectedBook.chapter);
      } else if (selectedBook.topic && !chapterPrompt) {
        setChapterPrompt(selectedBook.topic);
      }
    }
  }, [selectedBookId]);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        !bookSearch.trim() ||
        b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
        (b.topic && b.topic.toLowerCase().includes(bookSearch.toLowerCase())) ||
        (b.chapter && b.chapter.toLowerCase().includes(bookSearch.toLowerCase())) ||
        (b.tradeName && b.tradeName.toLowerCase().includes(bookSearch.toLowerCase()));

      return matchSearch;
    });
  }, [books, bookSearch]);

  const handleToggleType = (typeId: string) => {
    if (typeId === "ALL") {
      if (selectedTypes.length === QUESTION_TYPE_OPTIONS.length) {
        setSelectedTypes(["MCQ"]);
      } else {
        setSelectedTypes(QUESTION_TYPE_OPTIONS.map((t) => t.id));
      }
      return;
    }

    if (selectedTypes.includes(typeId)) {
      if (selectedTypes.length === 1) {
        showToast("কমপক্ষে একটি প্রশ্নের ধরন সিলেক্ট রাখতে হবে", "error");
        return;
      }
      setSelectedTypes(selectedTypes.filter((t) => t !== typeId));
    } else {
      setSelectedTypes([...selectedTypes, typeId]);
    }
  };

  // Upload book directly to central library
  const handleUploadNewBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast("দয়া করে একটি PDF ফাইল সিলেক্ট করুন", "error");
      return;
    }
    if (!uploadTitle.trim()) {
      showToast("বই বা ডকুমেন্টের শিরোনাম লিখুন", "error");
      return;
    }

    setIsUploadingBook(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle.trim());
      formData.append("description", `কেন্দ্রীয় লাইব্রেরি আপলোড — ${activeTrade || "ভোকেশনাল পাঠ্যবই"}`);
      if (chapterPrompt) formData.append("chapter", chapterPrompt);
      if (modalClassId && modalClassId !== "all") formData.append("classId", modalClassId);
      if (modalTradeId && modalTradeId !== "all") formData.append("tradeId", modalTradeId);
      if (modalSubjectId && modalSubjectId !== "all") formData.append("subjectId", modalSubjectId);

      const res = await fetch("/api/ai/pdf-manager", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.document) {
        showToast("✨ বইটি সফলভাবে কেন্দ্রীয় লাইব্রেরিতে যুক্ত হয়েছে!", "success");
        setBooks((prev) => [data.document, ...prev]);
        setSelectedBookId(data.document.id);
        setShowUploadDropzone(false);
        setUploadFile(null);
        setUploadTitle("");
      } else {
        showToast(data.message || "আপলোড ব্যর্থ হয়েছে", "error");
      }
    } catch {
      showToast("আপলোডে ত্রুটি দেখা দিয়েছে", "error");
    } finally {
      setIsUploadingBook(false);
    }
  };

  // ---------------------------------------------------------------------------
  // GENERATION HANDLER (TAB 2: Topic & TAB 3: PDF Book)
  // ---------------------------------------------------------------------------
  const handleGenerate = async () => {
    setGenerationError(null);
    setIsGenerating(true);
    setGenerationStep(1);

    const timer1 = setTimeout(() => setGenerationStep(2), 1200);
    const timer2 = setTimeout(() => setGenerationStep(3), 2800);

    try {
      let res: Response;
      const combinedInstructions = [
        customFlowPrompt.trim() ? `[শিক্ষকের বিশেষ নির্দেশনা]: ${customFlowPrompt.trim()}` : "",
        generatorMode === "pdf_book" && selectedBookId
          ? `BTEB কারিগরি বোর্ডের কারিকুলাম ও পাঠ্যবইয়ের পৃষ্ঠা ${fromPage}-${toPage} এর ওপর ভিত্তি করে প্রশ্ন তৈরি করুন।`
          : "BTEB কারিগরি বোর্ডের কারিকুলাম অনুসারে বৈচিত্র্যময় ও মানসম্মত প্রশ্ন তৈরি করুন।",
      ]
        .filter(Boolean)
        .join("\n\n");

      if (generatorMode === "pdf_book" && selectedBookId) {
        // Tab 3: Grounded directly from central PDF
        res = await fetch(`/api/ai/pdf-manager/${selectedBookId}/generate-questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromPage: Number(fromPage) || 1,
            toPage: Number(toPage) || 10,
            topic: chapterPrompt.trim() || selectedBook?.topic || selectedBook?.title || "সাধারণ পাঠ",
            chapter: chapterPrompt.trim(),
            count: slideCount,
            questionTypes: selectedTypes,
            difficulty,
            includeWarmup: includeIcebreaker || includeWarmup,
            additionalInstructions: combinedInstructions,
            classId: modalClassId,
            tradeId: modalTradeId,
            subjectId: modalSubjectId,
            trade: ALL_TRADES.find((t) => String(t.id) === modalTradeId)?.name || activeTrade,
            subject: modalSubjects.find((s) => String(s.id) === modalSubjectId)?.nameBangla || modalSubjects.find((s) => String(s.id) === modalSubjectId)?.name,
          }),
        });
      } else {
        // Tab 2: Topic & Custom Prompt — NO PDF REQUIRED!
        res = await fetch("/api/ai/questions/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: chapterPrompt.trim() || activeTrade || "কম্পিউটার ও আইটি সাপোর্ট",
            chapter: chapterPrompt.trim(),
            count: slideCount,
            questionType: selectedTypes.join(",").toLowerCase(),
            difficulty,
            includeWarmup: includeIcebreaker || includeWarmup,
            additionalInstructions: combinedInstructions,
            classId: modalClassId,
            tradeId: modalTradeId,
            subjectId: modalSubjectId,
            trade: ALL_TRADES.find((t) => String(t.id) === modalTradeId)?.name || activeTrade,
            subject: modalSubjects.find((s) => String(s.id) === modalSubjectId)?.nameBangla || modalSubjects.find((s) => String(s.id) === modalSubjectId)?.name,
          }),
        });
      }

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();

      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        const mappedItems: GeneratedItem[] = [];

        // 1. 👋 শুরুর সম্ভাষণ স্লাইড
        if (includeGreeting) {
          mappedItems.push({
            id: `greeting-${Date.now()}`,
            type: "TEXT_SLIDE",
            title: `👋 স্বাগতম: ${chapterPrompt.trim() || selectedBook?.title || "আজকের পাঠ ও কুইজ সেশন"}`,
            options: [],
            correctAnswer: 0,
            timeLimit: 0,
            points: 0,
            explanation: "আজকের ক্লাসে সবাইকে স্বাগতম! সবাই নিজ নিজ ডিভাইস থেকে সক্রিয়ভাবে অংশ নিন।",
            isSelected: true,
          });
        }

        // 2. ☁️ ওয়ার্ড ক্লাউড
        if (includeIcebreaker) {
          mappedItems.push({
            id: `icebreaker-${Date.now()}`,
            type: "WORD_CLOUD",
            title: `☁️ আজকের ক্লাস শুরু করার আগে — আপনার মন কেমন আছে বা আগের ক্লাস কেমন লেগেছিল? ১টি শব্দে জানান!`,
            options: ["উৎসাহী", "ভালো", "প্রস্তুত", "আগ্রহী", "চমৎকার"],
            correctAnswer: 0,
            timeLimit: 0,
            points: 0,
            explanation: "শিক্ষার্থীদের চিন্তাভাবনা ও শব্দগুচ্ছ লাইভ ওয়ার্ড ক্লাউড হিসেবে বোর্ডে ভেসে উঠবে।",
            isSelected: true,
          });
        }

        // 3. 🎯 মূল কুইজ প্রশ্ন ও ইন্টারভ্যাল লিডারবোর্ড
        let gradedCount = 0;
        data.questions.forEach((q: any, idx: number) => {
          const rawType = (q.type || "MCQ").toUpperCase().replace(/-/g, "_");
          let normType: SlideType = "MCQ";
          if (rawType.includes("MATCH")) normType = "MATCHING";
          else if (rawType.includes("BLANK") || rawType.includes("FILL")) normType = "FILL_BLANKS";
          else if (rawType.includes("REORDER") || rawType.includes("ORDER")) normType = "REORDER";
          else if (rawType.includes("TRUE") || rawType.includes("FALSE")) normType = "TRUE_FALSE";

          const isGraded = isGradedQuiz(normType);
          if (isGraded) gradedCount++;

          mappedItems.push({
            id: `gen-slide-${Date.now()}-${idx + 1}`,
            type: normType,
            title: q.questionText || q.title || `প্রশ্ন ${idx + 1}`,
            options: q.options || q.questionData?.options || ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"],
            correctAnswer: q.correctAnswer ?? q.questionData?.correctIndex ?? 0,
            pairs: q.pairs || q.matchingPairs || q.questionData?.pairs,
            items: q.items || q.reorderSequence || q.questionData?.items,
            acceptedAnswers: q.acceptedAnswers || (q.blankAnswer ? [q.blankAnswer] : undefined),
            timeLimit: isGraded ? (Number(q.timeLimit) || 30) : 0,
            points: isGraded ? (Number(q.marks) || Number(q.points) || 100) : 0,
            explanation: q.explanation || "",
            pageNumber: q.pageNumber,
            sourceExcerpt: q.sourceExcerpt,
            isSelected: true,
          });

          // Periodic Leaderboard injection
          const shouldInsertLeaderboard =
            leaderboardInterval === "every_1" ||
            (leaderboardInterval === "every_3" && gradedCount % 3 === 0) ||
            (leaderboardInterval === "every_5" && gradedCount % 5 === 0);

          if (shouldInsertLeaderboard && idx < data.questions.length - 1) {
            mappedItems.push({
              id: `lb-${Date.now()}-${idx}`,
              type: "LEADERBOARD",
              title: "🏆 শীর্ষ মেধাতালিকা ও লাইভ র‍্যাংকিং",
              options: [],
              correctAnswer: 0,
              timeLimit: 0,
              points: 0,
              explanation: "হোস্ট স্ক্রিনে রিয়েল-টাইম পোডিয়াম ও স্টুডেন্টদের ফোনে ব্যক্তিগত র‍্যাঙ্ক প্রদর্শিত হবে।",
              isSelected: true,
            });
          }
        });

        // 4. 💬 সমাপনী ফিডব্যাক স্লাইড
        if (includeClosingFeedback) {
          mappedItems.push({
            id: `closing-${Date.now()}`,
            type: "OPEN_ENDED",
            title: `💬 আজকের পাঠ থেকে নতুন কী শিখলেন? কোনো প্রশ্ন বা মতামত থাকলে লিখুন।`,
            options: [],
            correctAnswer: 0,
            timeLimit: 0,
            points: 0,
            explanation: "শিক্ষার্থীরা স্বাধীনভাবে তাদের ফিডব্যাক ও অনুধাবন শেয়ার করতে পারবে।",
            isSelected: true,
          });
        }

        setGeneratedItems(mappedItems);
        setInsertMode("append");
        setStep("review");
        showToast(`✨ ${mappedItems.length}টি স্লাইড সফলভাবে তৈরি হয়েছে!`, "success");
      } else {
        throw new Error(data.message || "কোনো প্রশ্ন তৈরি করা সম্ভব হয়নি।");
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setGenerationError(err?.message || "এআই মডেল সংযোগে সমস্যা দেখা দিয়েছে। পুনরায় চেষ্টা করুন।");
      showToast("প্রশ্ন তৈরিতে ত্রুটি দেখা দিয়েছে", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 4: EXECUTE EXISTING DECK AI CO-PILOT (Task 1.4)
  // ---------------------------------------------------------------------------
  const handleExecuteCoPilot = async (actionType: "beautify" | "extend" | "convert" | "cleanup") => {
    const selectedSlides = existingSlides.filter((s) => selectedExistingSlideIds.has(s.id));
    if (selectedSlides.length === 0 && actionType !== "extend") {
      showToast("দয়া করে কমপক্ষে একটি স্লাইড নির্বাচন করুন", "error");
      return;
    }

    setIsExecutingCoPilot(true);
    try {
      if (actionType === "beautify") {
        // Beautify selected slides
        const updatedList: GeneratedItem[] = [];
        for (const slide of selectedSlides) {
          const res = await fetch(`/api/ai/questions/${slide.id}/improve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slide,
              action: "beautify",
              instruction: coPilotCustomInstruction || "লেখা ও অপশনগুলো আরও মানসম্মত ও আকর্ষণীয় করো",
            }),
          });
          const data = await res.json();
          if (data.success && data.slide) {
            updatedList.push({
              ...data.slide,
              isSelected: true,
            });
          } else {
            updatedList.push({ ...slide, isSelected: true });
          }
        }

        setGeneratedItems(updatedList);
        setInsertMode("update_in_place");
        setStep("review");
        showToast(`✨ ${updatedList.length}টি স্লাইড সফলভাবে পরিমার্জন করা হয়েছে!`, "success");
      } else if (actionType === "convert") {
        // Convert slide types
        const convertedList: GeneratedItem[] = [];
        for (const slide of selectedSlides) {
          const res = await fetch(`/api/ai/questions/${slide.id}/improve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slide,
              action: "convert",
              targetType: coPilotTargetType,
              instruction: `এই প্রশ্নটিকে ${coPilotTargetType} ফরম্যাটে রূপান্তর করো।`,
            }),
          });
          const data = await res.json();
          if (data.success && data.slide) {
            convertedList.push({
              ...data.slide,
              isSelected: true,
            });
          } else {
            convertedList.push({ ...slide, isSelected: true });
          }
        }

        setGeneratedItems(convertedList);
        setInsertMode("update_in_place");
        setStep("review");
        showToast(`✨ ${convertedList.length}টি স্লাইড ${coPilotTargetType}-এ রূপান্তরিত হয়েছে!`, "success");
      } else if (actionType === "extend") {
        // Extend deck with N new non-duplicate slides
        const existingTitles = existingSlides.map((s) => s.title).filter(Boolean);
        const res = await fetch("/api/ai/questions/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: chapterPrompt || activeSubject || activeTrade || "কারিগরি বিষয়",
            count: 5,
            questionType: selectedTypes.join(",").toLowerCase(),
            additionalInstructions: `বিদ্যমান প্রশ্নগুলোর সাথে সম্পূর্ণ সামঞ্জস্যপূর্ণ কিন্তু সম্পূর্ণ নতুন ও বৈচিত্র্যময় প্রশ্ন তৈরি করো। নিচের প্রশ্নগুলোর পুনরাবৃত্তি কঠোরভাবে এড়িয়ে চলো:\n- ${existingTitles.join("\n- ")}\n${coPilotCustomInstruction}`,
          }),
        });

        const data = await res.json();
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          const newItems: GeneratedItem[] = data.questions.map((q: any, idx: number) => ({
            id: `ext-${Date.now()}-${idx + 1}`,
            type: q.type || "MCQ",
            title: q.questionText || q.title || `নতুন প্রশ্ন ${idx + 1}`,
            options: q.options || q.questionData?.options || ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"],
            correctAnswer: q.correctAnswer ?? q.questionData?.correctIndex ?? 0,
            pairs: q.pairs || q.questionData?.pairs,
            items: q.items || q.questionData?.items,
            acceptedAnswers: q.acceptedAnswers,
            timeLimit: Number(q.timeLimit) || 30,
            points: Number(q.marks) || Number(q.points) || 100,
            explanation: q.explanation || "",
            isSelected: true,
          }));

          setGeneratedItems(newItems);
          setInsertMode("append");
          setStep("review");
          showToast(`✨ ${newItems.length}টি নতুন পরিপূরক স্লাইড তৈরি হয়েছে!`, "success");
        } else {
          showToast("নতুন স্লাইড তৈরি করা সম্ভব হয়নি", "error");
        }
      } else if (actionType === "cleanup") {
        // Cleanup / filter redundant slides
        showToast("স্লাইডগুলো যাচাই সম্পন্ন হয়েছে", "info");
      }
    } catch {
      showToast("কো-পাইলট অ্যাকশনে ত্রুটি দেখা দিয়েছে", "error");
    } finally {
      setIsExecutingCoPilot(false);
    }
  };

  // Toggle single item selection in Review Stage
  const handleToggleItemSelection = (id: string) => {
    setGeneratedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isSelected: !item.isSelected } : item))
    );
  };

  const handleToggleSelectAll = () => {
    const allSelected = generatedItems.every((item) => item.isSelected);
    setGeneratedItems((prev) => prev.map((item) => ({ ...item, isSelected: !allSelected })));
  };

  const handleEditItemField = (id: string, field: keyof GeneratedItem, value: any) => {
    setGeneratedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setGeneratedItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Final Action: Insert Selected Slides into Studio Deck
  const handleInsertSelectedSlides = () => {
    const selected = generatedItems.filter((i) => i.isSelected);
    if (selected.length === 0) {
      showToast("অন্তত একটি স্লাইড নির্বাচন করুন", "error");
      return;
    }

    const presentationSlides: PresentationSlide[] = selected.map((item, idx) => ({
      id: item.id || `slide-ai-${Date.now()}-${idx}`,
      type: item.type,
      title: item.title,
      content: item.content || "",
      options: item.options || [],
      correctAnswer: item.correctAnswer,
      pairs: item.pairs,
      items: item.items,
      acceptedAnswers: item.acceptedAnswers,
      timeLimit: item.timeLimit,
      points: item.points,
      explanation: item.explanation,
    }));

    onInsertSlides(presentationSlides, insertMode);
    onClose();
  };

  if (!isOpen) return null;

  const selectedCount = generatedItems.filter((i) => i.isSelected).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 lg:p-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-[60] px-4 py-2.5 rounded-2xl border shadow-2xl flex items-center gap-2.5 text-xs font-bold backdrop-blur-xl ${
              toastMessage.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/80 shadow-emerald-500/20"
                : toastMessage.type === "error"
                  ? "bg-rose-950/90 text-rose-200 border-rose-500/80 shadow-rose-500/20"
                  : "bg-cyan-950/90 text-cyan-200 border-cyan-500/80 shadow-cyan-500/20"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>স্মার্ট এআই ও কপি-পেস্ট স্লাইড স্টুডিও</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                  Universal AI 2.0
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                {step === "configure"
                  ? "কপি-পেস্ট, যেকোনো টপিক প্রম্পট, বই বা বর্তমান স্লাইড উন্নত করে প্রেজেন্টেশন তৈরি করুন"
                  : `জেনারেট হওয়া ${generatedItems.length}টি স্লাইড যাচাই ও এডিট করুন`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === "review" && (
              <button
                type="button"
                onClick={() => setStep("configure")}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>সেটিংস পরিবর্তন</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {step === "configure" ? (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* SECTION 0: GLOBAL ACADEMIC MAPPING CASCADE */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      একাডেমিক স্তর ও বিষয় ম্যাপিং (Academic Mapping)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    BTEB Central
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Step 1: Class Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                      <span>১. শ্রেণি নির্বাচন</span>
                    </label>
                    <select
                      value={modalClassId}
                      onChange={(e) => handleModalClassChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                      {ACADEMIC_CLASSES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameBangla}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Class-Wise Trade Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                      <span>২. ট্রেড / বিভাগ</span>
                    </label>
                    {!modalHasTrade ? (
                      <div className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-400 select-none">
                        সাধারণ পাঠ্যক্রম (ট্রেড নেই)
                      </div>
                    ) : (
                      <select
                        value={modalTradeId}
                        onChange={(e) => handleModalTradeChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                      >
                        {modalApplicableTrades.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nameBangla} ({t.code})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Step 3: Mapped Subject Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                      <span>৩. অনুমোদিত বিষয়</span>
                    </label>
                    <select
                      value={modalSubjectId}
                      onChange={(e) => handleModalSubjectChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                    >
                      {modalSubjects.length === 0 ? (
                        <option value="">কোনো বিষয় ম্যাপ করা নেই</option>
                      ) : (
                        modalSubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nameBangla || s.name} ({s.code})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* -----------------------------------------------------------------
                  TASK 1: 4 CLEAR TOP MODE TABS
                  ----------------------------------------------------------------- */}
              <div className="p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 grid grid-cols-2 lg:grid-cols-4 gap-1.5">
                {[
                  {
                    id: "copy_paste",
                    title: "📋 কপি-পেস্ট ইম্পোর্ট",
                    subtitle: "ChatGPT/Gemini/Notes",
                    color: "text-indigo-600 dark:text-indigo-400",
                  },
                  {
                    id: "topic_prompt",
                    title: "💡 টপিক ও নির্দেশনা",
                    subtitle: "PDF ছাড়াই ডিরেক্ট AI",
                    color: "text-amber-600 dark:text-amber-400",
                  },
                  {
                    id: "pdf_book",
                    title: "📚 কেন্দ্রীয় বই ও PDF",
                    subtitle: "পাঠ্যবই ও পেজ রেঞ্জ",
                    color: "text-emerald-600 dark:text-emerald-400",
                  },
                  {
                    id: "copilot_existing",
                    title: "🔄 স্লাইড আপডেট ও কো-পাইলট",
                    subtitle: `${existingSlides.length}টি বর্তমান স্লাইড`,
                    color: "text-purple-600 dark:text-purple-400",
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setGeneratorMode(tab.id as GeneratorMode)}
                    className={`py-2.5 px-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between ${
                      generatorMode === tab.id
                        ? "bg-white dark:bg-slate-900 shadow-md ring-2 ring-indigo-500/30"
                        : "hover:bg-white/50 dark:hover:bg-slate-900/40 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{tab.title}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {tab.subtitle}
                    </span>
                  </button>
                ))}
              </div>

              {/* =================================================================
                  TAB 1: COPY-PASTE IMPORT FROM ANY AI / NOTES (Task 1.1)
                  ================================================================= */}
              {generatorMode === "copy_paste" && (
                <div className="rounded-3xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/20 p-5 space-y-4 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>📋 ChatGPT, Claude, Gemini বা নোটস থেকে পেস্ট করুন</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        যেকোনো ফরম্যাটের প্রশ্ন, অনুচ্ছেদ বা JSON এখানে পেস্ট করলেই AI স্বয়ংক্রিয়ভাবে স্লাইড বানিয়ে দেবে।
                      </p>
                    </div>

                    {/* Quick Ready Prompt Copy Button */}
                    <button
                      type="button"
                      onClick={handleCopyReadyPrompt}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer shrink-0"
                    >
                      {isCopiedPrompt ? <ClipboardCheck className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>🤖 ChatGPT/Gemini-এর জন্য রেডি প্রম্পট কপি</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <textarea
                      rows={9}
                      value={copyPasteText}
                      onChange={(e) => setCopyPasteText(e.target.value)}
                      placeholder={`এখানে প্রশ্ন বা টেক্সট পেস্ট করুন...\n\nযেমন:\n১. আইওটি (IoT)-এর পূর্ণরূপ কী?\nক) Internet of Technology\nখ) Internet of Things\nগ) Input Output Transfer\nঘ) Internal Optical Telemetry\nউত্তর: খ\nব্যাখ্যা: IoT মানে Internet of Things যা স্মার্ট সেন্সর ও ডিভাইসকে সংযুক্ত করে।\n\nঅথবা সরাসরি ChatGPT / Claude থেকে পাওয়া সম্পূর্ণ প্রশ্ন তালিকা পেস্ট করে দিন!`}
                      className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-sans text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition leading-relaxed"
                    />

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{copyPasteText.length} অক্ষর • {copyPasteText.split("\n").filter(Boolean).length} লাইন</span>
                      <button
                        type="button"
                        onClick={() => setCopyPasteText("")}
                        className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                      >
                        ক্লিয়ার করুন
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={isParsingText || !copyPasteText.trim()}
                      onClick={handleParseQuizText}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                    >
                      {isParsingText ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>স্মার্ট পার্সিং ও স্লাইড তৈরি হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>⚡ পার্স ও স্লাইড তৈরি করুন (Review)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* =================================================================
                  TAB 2: TOPIC & CUSTOM PROMPT — NO PDF REQUIRED (Task 1.2)
                  ================================================================= */}
              {generatorMode === "topic_prompt" && (
                <div className="rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/20 p-5 space-y-5 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-amber-500" />
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        💡 টপিক বা নির্দেশনায় ডিরেক্ট AI জেনারেটর (কোনো PDF প্রয়োজন নেই)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        বই আপলোড ছাড়াও যেকোনো বিষয়ের নাম বা প্রম্পট দিয়ে ১ ক্লিকে প্রেজেন্টেশন ও কুইজ তৈরি করুন।
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        পাঠ বা অধ্যায়ের টপিক (Topic / Chapter):
                      </label>
                      <input
                        type="text"
                        value={chapterPrompt}
                        onChange={(e) => setChapterPrompt(e.target.value)}
                        placeholder="যেমন: কম্পিউটার মেমোরি, ডাটাবেজ মডেলিং, ওহমের সূত্র ও সার্কিট..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        বিশেষ শিক্ষক নির্দেশনা (Optional Custom Prompt):
                      </label>
                      <textarea
                        rows={2}
                        value={customFlowPrompt}
                        onChange={(e) => setCustomFlowPrompt(e.target.value)}
                        placeholder="যেমন: শুরুতে ১টি ওয়ার্মআপ দিন, ৩টি সহজ ও ২টি কঠিন প্রশ্ন দিন এবং বাস্তব কারিগরি উদাহরণ রাখুন..."
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================
                  TAB 3: CENTRAL BOOKS & UPLOADED PDF (Task 1.3)
                  ================================================================= */}
              {generatorMode === "pdf_book" && (
                <div className="rounded-3xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 p-5 space-y-4 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <BookMarked className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        কেন্দ্রীয় পাঠ্যবই ও ডকুমেন্ট নির্বাচন (Smart Suggestions)
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={bookSearch}
                          onChange={(e) => setBookSearch(e.target.value)}
                          placeholder="বই বা বিষয় খুঁজুন..."
                          className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-44"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowUploadDropzone(!showUploadDropzone)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/30"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{showUploadDropzone ? "বন্ধ করুন" : "নতুন বই আপলোড"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Upload Dropzone */}
                  {showUploadDropzone && (
                    <form
                      onSubmit={handleUploadNewBook}
                      className="rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700/60 bg-white dark:bg-slate-900 p-4 space-y-3 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                          <UploadCloud className="w-4 h-4" />
                          নতুন বই বা PDF কেন্দ্রীয় লাইব্রেরিতে যুক্ত করুন
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowUploadDropzone(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                            বইয়ের শিরোনাম / নাম *
                          </label>
                          <input
                            type="text"
                            value={uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            placeholder="e.g. কম্পিউটার ট্রেড — আইটি সাপোর্ট অ্যান্ড আইওটি"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                            PDF ফাইল নির্বাচন করুন *
                          </label>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={isUploadingBook}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/30"
                        >
                          {isUploadingBook ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                          <span>{isUploadingBook ? "আপলোড হচ্ছে..." : "সংরক্ষণ করুন"}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Books Grid */}
                  {isLoadingBooks ? (
                    <div className="py-8 flex items-center justify-center gap-2 text-slate-400 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>কেন্দ্রীয় লাইব্রেরির বইগুলো লোড হচ্ছে...</span>
                    </div>
                  ) : filteredBooks.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      কোনো বই পাওয়া যায়নি। উপরের "নতুন বই আপলোড" দিয়ে PDF যুক্ত করুন।
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredBooks.map((book) => {
                        const isSelected = book.id === selectedBookId;
                        return (
                          <div
                            key={book.id}
                            onClick={() => setSelectedBookId(book.id)}
                            className={`group relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? "bg-white dark:bg-slate-900 border-indigo-600 shadow-lg shadow-indigo-600/10 ring-2 ring-indigo-500/20"
                                : "bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-2">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                  📖 {book.pageCount || 12} পৃষ্ঠা
                                </span>
                              </div>
                              <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2">
                                {book.title}
                              </h4>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
                              <span className="text-slate-400">{book.tradeName || "সাধারণ"}</span>
                              {isSelected && <span className="text-indigo-600 dark:text-indigo-400 font-black">✓ নির্বাচিত</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Page Range inputs */}
                  {selectedBook && (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                        📄 পৃষ্ঠা রেঞ্জ:
                      </span>
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span>পৃষ্ঠা</span>
                        <input
                          type="number"
                          min={1}
                          max={selectedBook.pageCount || 100}
                          value={fromPage}
                          onChange={(e) => setFromPage(e.target.value)}
                          className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-center"
                        />
                        <span>হতে</span>
                        <input
                          type="number"
                          min={1}
                          max={selectedBook.pageCount || 100}
                          value={toPage}
                          onChange={(e) => setToPage(e.target.value)}
                          className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =================================================================
                  TAB 4: AI CO-PILOT FOR EXISTING DECK (Task 1.4)
                  ================================================================= */}
              {generatorMode === "copilot_existing" && (
                <div className="rounded-3xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/20 dark:bg-purple-950/20 p-5 space-y-5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          🔄 বর্তমান স্লাইড এআই কো-পাইলট (Slide Co-Pilot)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          বর্তমান ডেকের স্লাইডগুলো সুন্দর করুন, পরিপূরক নতুন স্লাইড যোগ করুন, বা ধরন রূপান্তর করুন।
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-black px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono">
                      মোট স্লাইড: {existingSlides.length}টি
                    </span>
                  </div>

                  {existingSlides.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-purple-300 dark:border-purple-800 space-y-2">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        বর্তমানে কোনো স্লাইড নেই। প্রথমে ট্যাব ১, ২ বা ৩ থেকে স্লাইড তৈরি করুন।
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Existing Slides Mini Grid for selection */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>সংশোধনের জন্য স্লাইড নির্বাচন করুন ({selectedExistingSlideIds.size}/{existingSlides.length}):</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedExistingSlideIds.size === existingSlides.length) {
                                setSelectedExistingSlideIds(new Set());
                              } else {
                                setSelectedExistingSlideIds(new Set(existingSlides.map((s) => s.id)));
                              }
                            }}
                            className="text-indigo-600 hover:underline"
                          >
                            {selectedExistingSlideIds.size === existingSlides.length ? "সব আনসিলেক্ট" : "সব সিলেক্ট"}
                          </button>
                        </div>

                        <div className="max-h-48 overflow-y-auto p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 scrollbar-thin">
                          {existingSlides.map((s, idx) => {
                            const isChecked = selectedExistingSlideIds.has(s.id);
                            return (
                              <label
                                key={s.id}
                                className={`flex items-center gap-3 p-2 rounded-xl border text-xs cursor-pointer transition ${
                                  isChecked
                                    ? "bg-purple-50 dark:bg-purple-950/40 border-purple-400 text-slate-900 dark:text-white font-bold"
                                    : "bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const next = new Set(selectedExistingSlideIds);
                                    if (e.target.checked) next.add(s.id);
                                    else next.delete(s.id);
                                    setSelectedExistingSlideIds(next);
                                  }}
                                  className="w-4 h-4 accent-purple-600 rounded"
                                />
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                                  #{idx + 1}
                                </span>
                                <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">
                                  {s.type}
                                </span>
                                <span className="truncate flex-1">{s.title || "নামহীন স্লাইড"}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* 4 Co-Pilot Action Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleExecuteCoPilot("beautify")}
                          disabled={isExecutingCoPilot || selectedExistingSlideIds.size === 0}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:shadow-md text-left space-y-1 transition cursor-pointer disabled:opacity-50"
                        >
                          <div className="flex items-center gap-2 text-xs font-black text-purple-600 dark:text-purple-400">
                            <Sparkles className="w-4 h-4" />
                            <span>✨ সুন্দর ও পরিমার্জন করুন (Beautify)</span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            নির্বাচিত স্লাইডগুলোর ভাষা ও ব্যাকরণ উন্নত করুন, বিকল্পগুলো আরও আকর্ষণীয় করুন।
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExecuteCoPilot("extend")}
                          disabled={isExecutingCoPilot}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md text-left space-y-1 transition cursor-pointer disabled:opacity-50"
                        >
                          <div className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-400">
                            <Plus className="w-4 h-4" />
                            <span>➕ ডেক এক্সটেন্ড করুন (Extend Deck)</span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            বর্তমান স্লাইডগুলোর সাথে মিল রেখে নতুন পরিপূরক প্রশ্ন তৈরি করে শেষে যোগ করুন।
                          </p>
                        </button>

                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs font-black text-emerald-600 dark:text-emerald-400">
                            <div className="flex items-center gap-1.5">
                              <Repeat className="w-4 h-4" />
                              <span>🔄 প্রশ্নের ধরন রূপান্তর</span>
                            </div>
                            <select
                              value={coPilotTargetType}
                              onChange={(e) => setCoPilotTargetType(e.target.value as SlideType)}
                              className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold"
                            >
                              <option value="MATCHING">MATCHING (মিলকরণ)</option>
                              <option value="FILL_BLANKS">FILL_BLANKS (শূন্যস্থান)</option>
                              <option value="TRUE_FALSE">TRUE_FALSE (সত্য/মিথ্যা)</option>
                              <option value="REORDER">REORDER (ক্রম)</option>
                              <option value="MCQ">MCQ (বহুনির্বাচনী)</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleExecuteCoPilot("convert")}
                            disabled={isExecutingCoPilot || selectedExistingSlideIds.size === 0}
                            className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer"
                          >
                            {isExecutingCoPilot ? "রূপান্তর হচ্ছে..." : "রূপান্তর কার্যকর করুন"}
                          </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="text-xs font-black text-slate-700 dark:text-slate-300">
                            ✍️ কাস্টম Co-Pilot নির্দেশনা:
                          </div>
                          <input
                            type="text"
                            value={coPilotCustomInstruction}
                            onChange={(e) => setCoPilotCustomInstruction(e.target.value)}
                            placeholder="যেমন: সবগুলোর সাথে বাস্তব জীবনের কারিগরি উদাহরণ যোগ করো..."
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* COMMON GENERATION CONTROLS (Only for Mode 2 & 3) */}
              {(generatorMode === "topic_prompt" || generatorMode === "pdf_book") && (
                <>
                  {/* Question Type Selection */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        প্রশ্নের ধরন নির্বাচন (Question Types)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleType("ALL")}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {selectedTypes.length === QUESTION_TYPE_OPTIONS.length ? "রিসেট করুন" : "সবগুলো সিলেক্ট করুন"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {QUESTION_TYPE_OPTIONS.map((t) => {
                        const isSelected = selectedTypes.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleToggleType(t.id)}
                            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                              isSelected
                                ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-base mb-1">{t.icon}</span>
                            <div className="font-black text-xs">{t.label.split(" ")[0]}</div>
                            <div className="text-[10px] opacity-70">{t.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slide Count & Flow Toggles */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        কুইজ প্রশ্ন সংখ্যা (Slide Count):
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[3, 5, 10, 15, 20].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setSlideCount(num)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                              slideCount === num
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                            }`}
                          >
                            {num}টি
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeGreeting}
                          onChange={(e) => setIncludeGreeting(e.target.checked)}
                          className="w-4 h-4 accent-indigo-600 rounded"
                        />
                        <span>👋 শুরুতে স্বাগতম</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeIcebreaker}
                          onChange={(e) => setIncludeIcebreaker(e.target.checked)}
                          className="w-4 h-4 accent-indigo-600 rounded"
                        />
                        <span>☁️ ওয়ার্ড ক্লাউড</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={leaderboardInterval !== "none"}
                          onChange={(e) => setLeaderboardInterval(e.target.checked ? "every_3" : "none")}
                          className="w-4 h-4 accent-indigo-600 rounded"
                        />
                        <span>🏆 লাইভ লিডারবোর্ড</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeClosingFeedback}
                          onChange={(e) => setIncludeClosingFeedback(e.target.checked)}
                          className="w-4 h-4 accent-indigo-600 rounded"
                        />
                        <span>💬 সমাপনী ফিডব্যাক</span>
                      </label>
                    </div>
                  </div>

                  {/* Primary Trigger Button for Mode 2 & 3 */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={isGenerating || (generatorMode === "pdf_book" && !selectedBookId)}
                      onClick={handleGenerate}
                      className="px-7 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-xl shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                          <span>
                            {generationStep === 1
                              ? "কারিকুলাম ও বিষয় বিশ্লেষণ হচ্ছে..."
                              : generationStep === 2
                                ? "বৈচিত্র্যময় প্রশ্ন ও অপশন সাজানো হচ্ছে..."
                                : "ইন্টারেক্টিভ স্লাইড রেন্ডার হচ্ছে..."}
                          </span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>
                            {generatorMode === "pdf_book"
                              ? "📚 বই থেকে স্লাইড তৈরি করুন"
                              : "✨ AI দিয়ে স্লাইড তৈরি করুন (Review)"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* =========================================================================
               STEP 2: REVIEW, EDIT & SELECT GENERATED SLIDES
               ========================================================================= */
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    নির্বাচিত: {selectedCount} / {generatedItems.length}টি স্লাইড
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    {selectedCount === generatedItems.length ? "সব আনসিলেক্ট" : "সব সিলেক্ট করুন"}
                  </button>
                </div>

                {/* Insertion Mode Pill Switcher (Task 2) */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 px-1">যোগ করার নিয়ম:</span>
                  <button
                    type="button"
                    onClick={() => setInsertMode("append")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      insertMode === "append"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    ➕ শেষে যোগ (Append)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInsertMode("update_in_place")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      insertMode === "update_in_place"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    🎯 আপডেট (In-Place)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInsertMode("replace_all")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      insertMode === "replace_all"
                        ? "bg-white dark:bg-slate-900 text-rose-600 shadow-xs font-black"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    🔄 সম্পূর্ণ রিপ্লেস
                  </button>
                </div>
              </div>

              {/* Review Slide Cards */}
              <div className="space-y-3.5">
                {generatedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                      item.isSelected
                        ? "bg-white dark:bg-slate-900 border-indigo-500/80 shadow-md"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.isSelected}
                          onChange={() => handleToggleItemSelection(item.id)}
                          className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                          #{idx + 1}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase">
                          {item.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isGradedQuiz(item.type) && (
                          <span className="text-[10px] font-bold text-amber-500 font-mono">
                            {item.points} pt • {item.timeLimit}s
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Title input */}
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleEditItemField(item.id, "title", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />

                    {/* Options / Pairs / Items preview */}
                    {item.type === "MCQ" && item.options && item.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {item.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-xl border flex items-center gap-2 ${
                              Number(item.correctAnswer) === optIdx
                                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] bg-slate-100 dark:bg-slate-800">
                              {["ক", "খ", "গ", "ঘ"][optIdx] || optIdx + 1}
                            </span>
                            <span className="flex-1 truncate">{opt}</span>
                            {Number(item.correctAnswer) === optIdx && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                        ))}
                      </div>
                    )}

                    {item.explanation && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                        💡 <span className="font-semibold">ব্যাখ্যা:</span> {item.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep("configure")}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  ← পুনরায় সেটিংস
                </button>

                <button
                  type="button"
                  disabled={selectedCount === 0}
                  onClick={handleInsertSelectedSlides}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {insertMode === "update_in_place"
                      ? `নির্বাচিত ${selectedCount}টি স্লাইড আপডেট করুন`
                      : `প্রেজেন্টেশনে ${selectedCount}টি স্লাইড যুক্ত করুন`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
