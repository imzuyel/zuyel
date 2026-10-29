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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGlobalAcademic } from "@/context/GlobalAcademicContext";
import { PresentationSlide, SlideType, isGradedQuiz } from "./UnifiedQuizMentimeterWorkspace";

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
  onInsertSlides: (newSlides: PresentationSlide[]) => void;
  activeTrade?: string;
  activeClass?: string;
}

interface GeneratedItem {
  id: string;
  type: SlideType;
  title: string;
  options: string[];
  correctAnswer: number | boolean | string;
  pairs?: { left: string; right: string }[];
  items?: string[];
  acceptedAnswers?: string[];
  timeLimit: number;
  points: number;
  explanation: string;
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

  // Books list & loading
  const [books, setBooks] = useState<CentralBookDoc[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [bookSearch, setBookSearch] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  // Quick book upload dropzone inside modal
  const [showUploadDropzone, setShowUploadDropzone] = useState(false);
  const [isUploadingBook, setIsUploadingBook] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");

  // Configuration Inputs
  const [chapterPrompt, setChapterPrompt] = useState("");
  const [fromPage, setFromPage] = useState<number | string>(1);
  const [toPage, setToPage] = useState<number | string>(15);
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

  // TASK 2: Complete Smart Class Flow State (সম্ভাষণ + ওয়ার্মআপ + কুইজ + লিডারবোর্ড + সমাপনী)
  const [includeGreeting, setIncludeGreeting] = useState<boolean>(true);
  const [includeIcebreaker, setIncludeIcebreaker] = useState<boolean>(true);
  const [includePrepCheck, setIncludePrepCheck] = useState<boolean>(true);
  const [leaderboardInterval, setLeaderboardInterval] = useState<"none" | "every_1" | "every_3" | "every_5">("every_3");
  const [includeClosingFeedback, setIncludeClosingFeedback] = useState<boolean>(true);
  const [customFlowPrompt, setCustomFlowPrompt] = useState<string>("");

  // Generation Progress & State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(1);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Review Items State
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

  // Fetch Central Books Library on mount or open
  useEffect(() => {
    if (!isOpen) return;

    const fetchCentralBooks = async () => {
      setIsLoadingBooks(true);
      try {
        const res = await fetch("/api/ai/pdf-manager?limit=50");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.documents)) {
            setBooks(data.documents);
            // Default select the first matching book if available
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
  }, [isOpen, activeTrade]);

  // Selected book details
  const selectedBook = useMemo(() => {
    return books.find((b) => b.id === selectedBookId) || null;
  }, [books, selectedBookId]);

  // Auto-fill page ranges and chapter when book changes
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

  // Filtered books list based on search and active trade
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

  // Toggle question type chip
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
    } catch (err: any) {
      showToast("আপলোডে ত্রুটি দেখা দিয়েছে", "error");
    } finally {
      setIsUploadingBook(false);
    }
  };

  // Generate Questions via Central PDF / AI Failover Pipeline
  const handleGenerate = async () => {
    setGenerationError(null);
    setIsGenerating(true);
    setGenerationStep(1);

    // Simulated progress steps
    const timer1 = setTimeout(() => setGenerationStep(2), 1200);
    const timer2 = setTimeout(() => setGenerationStep(3), 2800);

    try {
      let res: Response;
      const combinedInstructions = [
        customFlowPrompt.trim() ? `[শিক্ষকের বিশেষ সেশন ফ্লো নির্দেশনা]: ${customFlowPrompt.trim()}` : "",
        `BTEB কারিগরি বোর্ডের কারিকুলাম ও পাঠ্যবইয়ের পৃষ্ঠা ${fromPage}-${toPage} এর ওপর ভিত্তি করে প্রশ্ন তৈরি করুন।`,
      ]
        .filter(Boolean)
        .join("\n\n");

      if (selectedBookId) {
        // Generate grounded directly from central PDF endpoint with granular page range
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
          }),
        });
      } else {
        // Fallback general generation
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
          }),
        });
      }

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();

      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        // Map returned questions into GeneratedItem list
        const mappedItems: GeneratedItem[] = [];

        // 1. 👋 শুরুর সম্ভাষণ স্লাইড (Welcome & Greeting Slide - TEXT_SLIDE)
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

        // 2. ☁️ আগের ক্লাস কেমন লেগেছে / আজ কেমন আছো? (Icebreaker Word Cloud - WORD_CLOUD)
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

        // 3. 🎯 আজকের ক্লাসের প্রস্তুতি কেমন? (Preparation Check-in - OPEN_ENDED)
        if (includePrepCheck) {
          mappedItems.push({
            id: `prep-check-${Date.now()}`,
            type: "OPEN_ENDED",
            title: `🎯 আজকের বিষয়বস্তুর ওপর আপনার বর্তমান প্রস্তুতি বা কোনো বিশেষ প্রত্যাশা থাকলে ১-২ বাক্যে লিখুন:`,
            options: [],
            correctAnswer: 0,
            timeLimit: 0,
            points: 0,
            explanation: "শিক্ষার্থীদের উন্মুক্ত প্রতিক্রিয়া ও প্রাক-প্রস্তুতি নিরীক্ষণ।",
            isSelected: true,
          });
        }

        // 4. Graded Quiz Questions + Auto-Inserted Leaderboard Slides
        const autoInterval =
          leaderboardInterval === "every_1"
            ? 1
            : leaderboardInterval === "every_3"
            ? 3
            : leaderboardInterval === "every_5"
            ? 5
            : 0;
        let gradedCount = 0;

        data.questions.forEach((q: any, idx: number) => {
          const rawType = (q.type || q.questionType || "MCQ").toUpperCase().replace(/^MCQ_SINGLE$/, "MCQ");
          let normalizedType: SlideType = "MCQ";
          if (["MCQ", "FILL_BLANKS", "MATCHING", "REORDER", "TRUE_FALSE"].includes(rawType)) {
            normalizedType = rawType as SlideType;
          } else if (rawType === "ORDERING") {
            normalizedType = "REORDER";
          } else if (rawType === "FILL_BLANK") {
            normalizedType = "FILL_BLANKS";
          }

          const qData = q.questionData || {};
          const optionsList = Array.isArray(q.options)
            ? q.options
            : Array.isArray(qData.options)
            ? qData.options
            : ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"];

          const correctAns =
            q.correctAnswer !== undefined
              ? q.correctAnswer
              : qData.correctIndex !== undefined
              ? qData.correctIndex
              : qData.correctAnswer !== undefined
              ? qData.correctAnswer
              : 0;

          mappedItems.push({
            id: q.id || `gen-${Date.now()}-${idx}`,
            type: normalizedType,
            title: q.questionText || q.question || `প্রশ্ন #${idx + 1}`,
            options: optionsList,
            correctAnswer: correctAns,
            pairs: q.pairs || qData.pairs || (normalizedType === "MATCHING" ? [{ left: "কলাম ১", right: "কলাম ২" }] : undefined),
            items: q.items || qData.items || (normalizedType === "REORDER" ? ["ধাপ ১", "ধাপ ২", "ধাপ ৩"] : undefined),
            acceptedAnswers: q.acceptedAnswers || qData.acceptedAnswers || (normalizedType === "FILL_BLANKS" ? ["সঠিক উত্তর"] : undefined),
            timeLimit: isGradedQuiz(normalizedType) ? 30 : 0,
            points: isGradedQuiz(normalizedType) ? 100 : 0,
            explanation: q.explanation || qData.explanation || "",
            pageNumber: q.pageNumber,
            sourceExcerpt: q.sourceExcerpt,
            isSelected: true,
          });

          gradedCount++;

          // Auto-Insert Leaderboard Slides (Task 2 & 3)
          if (autoInterval > 0 && gradedCount % autoInterval === 0) {
            mappedItems.push({
              id: `leaderboard-auto-${Date.now()}-${gradedCount}`,
              type: "LEADERBOARD",
              title: `🏆 লাইভ লিডারবোর্ড — রাউন্ড ${Math.floor(gradedCount / autoInterval)} এর ফলাফল`,
              options: [],
              correctAnswer: 0,
              timeLimit: 0,
              points: 0,
              explanation: "শীর্ষ শিক্ষার্থীদের তাৎক্ষণিক র‍্যাংকিং ও স্কোরবোর্ড প্রদর্শন।",
              isSelected: true,
            });
          }
        });

        // 5. 💬 আজকের ক্লাস ও কুইজ কেমন লাগলো? (Closing Reflection & Feedback - OPEN_ENDED / WORD_CLOUD)
        if (includeClosingFeedback) {
          mappedItems.push({
            id: `closing-feedback-${Date.now()}`,
            type: "WORD_CLOUD",
            title: `💬 আজকের পুরো ক্লাস ও কুইজ সেশন কেমন লাগলো? ১টি শব্দে আপনার মূল্যবান ফিডব্যাক দিন!`,
            options: ["অসাধারণ", "সহজবোধ্য", "উপকারী", "আনন্দদায়ক", "প্রেরণাদায়ক"],
            correctAnswer: 0,
            timeLimit: 0,
            points: 0,
            explanation: "ক্লাস শেষে শিক্ষার্থীদের স্বতঃস্ফূর্ত মূল্যায়ন ও অনুভূতি সংগ্রহ।",
            isSelected: true,
          });
        }

        setGeneratedItems(mappedItems);
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

  // Toggle single item selection in Review Stage
  const handleToggleItemSelection = (id: string) => {
    setGeneratedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isSelected: !item.isSelected } : item))
    );
  };

  // Toggle all selection
  const handleToggleSelectAll = () => {
    const allSelected = generatedItems.every((item) => item.isSelected);
    setGeneratedItems((prev) => prev.map((item) => ({ ...item, isSelected: !allSelected })));
  };

  // Edit item inline
  const handleEditItemField = (id: string, field: keyof GeneratedItem, value: any) => {
    setGeneratedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Remove single item from review list
  const handleDeleteItem = (id: string) => {
    setGeneratedItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Regenerate single question
  const handleRegenerateItem = async (id: string) => {
    const target = generatedItems.find((i) => i.id === id);
    if (!target) return;

    setGeneratedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRegenerating: true } : item))
    );

    try {
      const res = await fetch("/api/ai/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: chapterPrompt || activeTrade || target.title,
          count: 1,
          questionType: target.type.toLowerCase(),
          additionalInstructions: "পূর্ববর্তী প্রশ্নের চেয়ে ভিন্ন এবং বাস্তবমুখী কারিগরি উদাহরণ দিন।",
        }),
      });

      const data = await res.json();
      if (data.success && data.questions && data.questions.length > 0) {
        const newQ = data.questions[0];
        setGeneratedItems((prev) =>
          prev.map((item) => {
            if (item.id === id) {
              return {
                ...item,
                title: newQ.questionText || item.title,
                options: newQ.questionData?.options || item.options,
                correctAnswer: newQ.questionData?.correctIndex ?? item.correctAnswer,
                explanation: newQ.explanation || item.explanation,
                isRegenerating: false,
              };
            }
            return item;
          })
        );
        showToast("প্রশ্নটি নতুনভাবে আপডেট হয়েছে!", "success");
      } else {
        setGeneratedItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isRegenerating: false } : item))
        );
      }
    } catch {
      setGeneratedItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRegenerating: false } : item))
      );
    }
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
      content: "",
      options: item.options || [],
      correctAnswer: item.correctAnswer,
      pairs: item.pairs,
      items: item.items,
      acceptedAnswers: item.acceptedAnswers,
      timeLimit: item.timeLimit,
      points: item.points,
      explanation: item.explanation,
    }));

    onInsertSlides(presentationSlides);
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
            className={`fixed top-6 z-60 px-5 py-3 rounded-2xl shadow-2xl text-xs font-black flex items-center gap-2 border ${
              toastMessage.type === "success"
                ? "bg-emerald-500 text-white border-emerald-400"
                : toastMessage.type === "error"
                ? "bg-rose-500 text-white border-rose-400"
                : "bg-indigo-600 text-white border-indigo-400"
            }`}
          >
            {toastMessage.type === "success" && <Check className="w-4 h-4" />}
            {toastMessage.type === "error" && <AlertCircle className="w-4 h-4" />}
            {toastMessage.type === "info" && <Sparkles className="w-4 h-4" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-amber-50/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-amber-950/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  স্মার্ট কেন্দ্রীয় বই ও PDF এআই স্টুডিও
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Zero Re-Upload
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                কেন্দ্রীয় লাইব্রেরির পাঠ্যবই বা নির্দিষ্ট অধ্যায়/পেজ রেঞ্জ থেকে সরাসরি ইন্টারেক্টিভ স্লাইড ডেক তৈরি করুন
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
            /* =========================================================================
               STEP 1: CONFIGURATION & CENTRAL BOOK SELECTION
               ========================================================================= */
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* SECTION 1: SMART CENTRAL BOOK LIBRARY SUGGESTION */}
              <div className="rounded-3xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      ১. কেন্দ্রীয় পাঠ্যবই ও ডকুমেন্ট নির্বাচন (স্মার্ট সাজেশন)
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search inside central books */}
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

                {/* Secondary Dropzone (Upload once, saved permanently to central library!) */}
                {showUploadDropzone && (
                  <form
                    onSubmit={handleUploadNewBook}
                    className="rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700/60 bg-white dark:bg-slate-900 p-4 space-y-3 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4" />
                        নতুন বই বা PDF কেন্দ্রীয় লাইব্রেরিতে যুক্ত করুন (স্থায়ী সংরক্ষণ)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowUploadDropzone(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        বাতিল
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
                          placeholder="e.g. কম্পিউটার ট্রেড — আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস"
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
                        <span>{isUploadingBook ? "আপলোড ও প্রসেসিং হচ্ছে..." : "কেন্দ্রীয় লাইব্রেরিতে সংরক্ষণ করুন"}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Central Books Cards Grid */}
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
                      const isContextMatch =
                        activeTrade &&
                        (book.title.toLowerCase().includes(activeTrade.toLowerCase()) ||
                          book.tradeName?.toLowerCase().includes(activeTrade.toLowerCase()));

                      return (
                        <div
                          key={book.id}
                          onClick={() => setSelectedBookId(book.id)}
                          className={`group relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "bg-white dark:bg-slate-900 border-indigo-600 shadow-lg shadow-indigo-600/10 ring-2 ring-indigo-500/20"
                              : "bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                          }`}
                        >
                          <div>
                            {/* Card Top Badges */}
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                📖 {book.pageCount || 12} পৃষ্ঠা
                              </span>

                              {isContextMatch && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  ট্রেড ম্যাচ ✨
                                </span>
                              )}
                            </div>

                            {/* Book Title */}
                            <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-relaxed">
                              {book.title}
                            </h4>

                            {/* Chapter/Topic info */}
                            {(book.chapter || book.topic) && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                {book.chapter || book.topic}
                              </p>
                            )}
                          </div>

                          {/* Card Footer State */}
                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 text-[10px]">
                              {book.tradeName || "সাধারণ ভোকেশনাল"}
                            </span>

                            <div className="flex items-center gap-1 font-black">
                              {isSelected ? (
                                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>সিলেক্টেড</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 group-hover:text-indigo-600 transition">
                                  সিলেক্ট করুন
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 2: GRANULAR CHAPTER & PAGE RANGE SELECTOR */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    ২. নির্দিষ্ট অধ্যায় ও পেজ রেঞ্জ নির্ধারণ
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Chapter / Prompt Input */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>অধ্যায় বা নির্দিষ্ট বিষয়বস্তু (Chapter / Topic Prompt):</span>
                      <span className="text-[11px] font-normal text-slate-400">উদাহরণ: ৩য় অধ্যায় — মেমোরি ও স্টোরেজ ডিভাইস</span>
                    </label>
                    <input
                      type="text"
                      value={chapterPrompt}
                      onChange={(e) => setChapterPrompt(e.target.value)}
                      placeholder="e.g. কম্পিউটার হার্ডওয়্যার ও নেটওয়ার্কিং বেসিকস (বা অধ্যায় নং)"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Exact Page Range Selector (From Page to To Page) */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-indigo-500" />
                        পেজ রেঞ্জ (From Page — To Page)
                      </span>
                      {selectedBook?.pageCount && (
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          মোট {selectedBook.pageCount} পৃষ্ঠা
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                          শুরুর পেজ (From):
                        </span>
                        <input
                          type="number"
                          min="1"
                          max={selectedBook?.pageCount || 999}
                          value={fromPage}
                          onChange={(e) => setFromPage(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-white text-center"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                          শেষ পেজ (To):
                        </span>
                        <input
                          type="number"
                          min={Number(fromPage) || 1}
                          max={selectedBook?.pageCount || 999}
                          value={toPage}
                          onChange={(e) => setToPage(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-white text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Question Count Quick Pills */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                      কতটি কুইজ/স্লাইড তৈরি করবে? (Count)
                    </span>
                    <div className="flex items-center gap-1.5 pt-1">
                      {[5, 10, 15, 20].map((countVal) => (
                        <button
                          key={countVal}
                          type="button"
                          onClick={() => setSlideCount(countVal)}
                          className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                            slideCount === countVal
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                          }`}
                        >
                          {countVal}টি
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Question Type Mix Multi-Select Chips */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      প্রশ্নের ধরন (Question Type Mix):
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleType("ALL")}
                      className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {selectedTypes.length === QUESTION_TYPE_OPTIONS.length
                        ? "ক্লিয়ার করুন"
                        : "🤖 স্মার্ট মিক্স (সব ধরন)"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {QUESTION_TYPE_OPTIONS.map((opt) => {
                      const isTypeActive = selectedTypes.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleToggleType(opt.id)}
                          className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                            isTypeActive
                              ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20"
                              : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">{opt.icon}</span>
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                                isTypeActive
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "border-slate-300 dark:border-slate-600"
                              }`}
                            >
                              {isTypeActive && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                          <span className="text-[11px] font-black block leading-tight">{opt.label}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION: 🎭 AI দিয়ে সম্পূর্ণ ইন্টারঅ্যাক্টিভ সেশন ডিজাইন (TASK 2) */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-amber-50/60 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-amber-950/30 border-2 border-indigo-200 dark:border-indigo-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎭</span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200">
                          AI দিয়ে সম্পূর্ণ ইন্টারঅ্যাক্টিভ সেশন ডিজাইন (Full Classroom Flow)
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          শুধু কুইজ নয় — শুরু থেকে শেষ পর্যন্ত একটি আকর্ষণীয় স্মার্ট ক্লাস কাঠামো তৈরি করুন
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Flow Components Checkbox / Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* 1. Greeting */}
                    <label className={`p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${includeGreeting ? "bg-white dark:bg-slate-900 border-indigo-500 shadow-sm ring-1 ring-indigo-400/40" : "bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"}`}>
                      <input
                        type="checkbox"
                        checked={includeGreeting}
                        onChange={(e) => setIncludeGreeting(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>👋 শুরুর সম্ভাষণ স্লাইড</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">TEXT_SLIDE</span>
                        </span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          ক্লাসের শুরুতে আন্তরিক শুভেচ্ছা ও আজকের পাঠের মূল বিষয়বস্তু
                        </p>
                      </div>
                    </label>

                    {/* 2. Icebreaker Word Cloud */}
                    <label className={`p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${includeIcebreaker ? "bg-white dark:bg-slate-900 border-fuchsia-500 shadow-sm ring-1 ring-fuchsia-400/40" : "bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"}`}>
                      <input
                        type="checkbox"
                        checked={includeIcebreaker}
                        onChange={(e) => setIncludeIcebreaker(e.target.checked)}
                        className="w-4 h-4 rounded text-fuchsia-600 focus:ring-fuchsia-500 mt-0.5 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>☁️ আইসব্রেকার ওয়ার্ড ক্লাউড</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-fuchsia-100 dark:bg-fuchsia-900/60 text-fuchsia-700 dark:text-fuchsia-300">WORD_CLOUD</span>
                        </span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          আগের ক্লাস কেমন লেগেছে / আজ কেমন আছো?
                        </p>
                      </div>
                    </label>

                    {/* 3. Prep Check */}
                    <label className={`p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${includePrepCheck ? "bg-white dark:bg-slate-900 border-purple-500 shadow-sm ring-1 ring-purple-400/40" : "bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"}`}>
                      <input
                        type="checkbox"
                        checked={includePrepCheck}
                        onChange={(e) => setIncludePrepCheck(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 mt-0.5 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>🎯 ক্লাসের প্রস্তুতি চেক-ইন</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">OPEN_ENDED</span>
                        </span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          আজকের বিষয়ের ওপর স্টুডেন্টদের পূর্বজ্ঞান ও প্রস্তুতি যাচাই
                        </p>
                      </div>
                    </label>

                    {/* 4. Closing Feedback */}
                    <label className={`p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${includeClosingFeedback ? "bg-white dark:bg-slate-900 border-emerald-500 shadow-sm ring-1 ring-emerald-400/40" : "bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"}`}>
                      <input
                        type="checkbox"
                        checked={includeClosingFeedback}
                        onChange={(e) => setIncludeClosingFeedback(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>💬 সমাপনী ফিডব্যাক ও রিফ্লেকশন</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">FEEDBACK</span>
                        </span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          আজকের ক্লাস ও কুইজ কেমন লাগলো? ১টি শব্দে ফিডব্যাক
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* 5. Auto-Insert Leaderboard Slides Interval Selector */}
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <span>🏆 মাঝখানে ও শেষে লিডারবোর্ড স্লাইড অটো-ইনসার্ট</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold">LEADERBOARD</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: "none", label: "বন্ধ (Manual)" },
                        { id: "every_1", label: "প্রতি ১টি পর" },
                        { id: "every_3", label: "প্রতি ৩টি পর" },
                        { id: "every_5", label: "প্রতি ৫টি পর" },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setLeaderboardInterval(lvl.id as any)}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition cursor-pointer border ${
                            leaderboardInterval === lvl.id
                              ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs"
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-300"
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 6. Custom Prompt Box */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>✍️ AI-কে বিশেষ নির্দেশনা দিন (Custom Session Directive):</span>
                      <span className="text-[10px] text-slate-400 font-normal">ঐচ্ছিক (Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={customFlowPrompt}
                      onChange={(e) => setCustomFlowPrompt(e.target.value)}
                      placeholder="যেমন: প্রথমে স্বাগতম জানাও, তারপর তারা কেমন আছে জানতে চাও, এরপর ৫টি কুইজ দাও এবং শেষে আজকের ক্লাসের ফিডব্যাক নাও..."
                      className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {generationError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{generationError}</span>
                </div>
              )}

              {/* Generation Loader State */}
              {isGenerating && (
                <div className="p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center space-y-3 animate-in fade-in">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-200">
                      এআই মডেল ও সেন্ট্রাল বই থেকে প্রশ্ন প্রস্তুত হচ্ছে...
                    </h4>
                    <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 font-medium font-mono">
                      {generationStep === 1 && "১/৩ পাঠ্যবইয়ের পৃষ্ঠা বিশ্লেষণ ও এক্সট্রাকশন..."}
                      {generationStep === 2 && "২/৩ মাল্টি-মডেল এআই ফেইলওভার সংযোগ ও প্রশ্ন জেনারেশন..."}
                      {generationStep === 3 && "৩/৩ কারিকুলাম মান যাচাই ও অপশন ফরম্যাটিং..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Footer Action */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  বাতিল
                </button>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-amber-500 hover:from-indigo-700 hover:to-amber-600 disabled:opacity-50 text-white text-xs font-black shadow-xl shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isGenerating ? "তৈরি হচ্ছে..." : "⚡ এআই দিয়ে স্লাইড ও কুইজ তৈরি করুন"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* =========================================================================
               STEP 2: INTERACTIVE AI REVIEW & INLINE EDIT STAGE
               ========================================================================= */
            <div className="space-y-5">
              {/* Review Controls Header */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {generatedItems.every((i) => i.isSelected) ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span>সবগুলো সিলেক্ট ({generatedItems.length}টি)</span>
                  </button>

                  <span className="text-slate-300 dark:text-slate-700">|</span>

                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    নির্বাচিত: <strong className="text-indigo-600 dark:text-indigo-400 font-mono font-black">{selectedCount}</strong> / {generatedItems.length}
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  স্লাইডের টেক্সট সরাসরি এডিট করতে পারবেন বা অপ্রয়োজনীয় স্লাইড আনচেক করুন
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-4">
                {generatedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border-2 transition-all p-4.5 space-y-3 ${
                      item.isSelected
                        ? "bg-white dark:bg-slate-900 border-indigo-500/80 shadow-md"
                        : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60"
                    }`}
                  >
                    {/* Item Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleItemSelection(item.id)}
                          className="cursor-pointer text-indigo-600 dark:text-indigo-400"
                        >
                          {item.isSelected ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </button>

                        <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-black flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                          {idx + 1}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
                          {item.type}
                        </span>

                        {item.pageNumber && (
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            📖 পৃষ্ঠা {item.pageNumber}
                          </span>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleEditItem(item.id)}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            editingItemIds[item.id]
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                          }`}
                          title="প্রশ্ন, অপশন ও ধরন সম্পূর্ণ এডিট করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{editingItemIds[item.id] ? "✓ সম্পন্ন" : "✏️ এডিট করুন"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRegenerateItem(item.id)}
                          disabled={item.isRegenerating}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition text-xs flex items-center gap-1 cursor-pointer"
                          title="এই প্রশ্নটি পুনরায় তৈরি করুন"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${item.isRegenerating ? "animate-spin" : ""}`} />
                          <span className="text-[10px] font-bold hidden sm:inline">পুনরায় তৈরি</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question / Title Textarea (Inline Editable) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>প্রশ্নের শিরোনাম বা বিষয়বস্তু:</span>
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-slate-400">টাইপ:</label>
                          <select
                            value={item.type}
                            onChange={(e) => handleEditItemField(item.id, "type", e.target.value as SlideType)}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer"
                          >
                            <option value="MCQ">🔘 MCQ</option>
                            <option value="FILL_BLANKS">📝 শূন্যস্থান</option>
                            <option value="MATCHING">🔗 মিলকরণ</option>
                            <option value="REORDER">🔢 ক্রম সাজানো</option>
                            <option value="TRUE_FALSE">⚖️ সত্য/মিথ্যা</option>
                            <option value="WORD_CLOUD">☁️ ক্লাউড</option>
                            <option value="OPEN_ENDED">💭 মুক্ত মতামত</option>
                            <option value="TEXT_SLIDE">📄 টেক্সট স্লাইড</option>
                            <option value="LEADERBOARD">🏆 লিডারবোর্ড</option>
                          </select>
                        </div>
                      </div>
                      <textarea
                        value={item.title}
                        onChange={(e) => handleEditItemField(item.id, "title", e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
                        placeholder="প্রশ্ন বা আলোচনার বিষয়..."
                      />
                    </div>

                    {/* Type-Specific Options Editor */}
                    {item.type === "MCQ" && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {item.options.map((opt, optIdx) => {
                            const isCorrect = Number(item.correctAnswer) === optIdx;
                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                                  isCorrect
                                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-400/40"
                                    : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleEditItemField(item.id, "correctAnswer", optIdx)}
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 cursor-pointer ${
                                    isCorrect
                                      ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                      : "border-slate-400 text-slate-400 hover:border-emerald-500"
                                  }`}
                                  title="সঠিক উত্তর হিসেবে চিহ্নিত করুন"
                                >
                                  {isCorrect ? <Check className="w-3 h-3 stroke-[3]" /> : String.fromCharCode(65 + optIdx)}
                                </button>

                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const updated = [...item.options];
                                    updated[optIdx] = e.target.value;
                                    handleEditItemField(item.id, "options", updated);
                                  }}
                                  className="flex-1 bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
                                />

                                {item.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = item.options.filter((_, i) => i !== optIdx);
                                      handleEditItemField(item.id, "options", updated);
                                      if (Number(item.correctAnswer) >= updated.length) {
                                        handleEditItemField(item.id, "correctAnswer", 0);
                                      }
                                    }}
                                    className="text-slate-400 hover:text-rose-500 p-0.5"
                                    title="অপশন মুছুন"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {item.options.length < 6 && (
                          <button
                            type="button"
                            onClick={() => {
                              handleEditItemField(item.id, "options", [...item.options, `নতুন অপশন`]);
                            }}
                            className="py-1 px-3 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ অপশন যোগ করুন</span>
                          </button>
                        )}
                      </div>
                    )}

                    {item.type === "TRUE_FALSE" && (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleEditItemField(item.id, "correctAnswer", true)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            item.correctAnswer === true
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>সত্য (True) — সঠিক উত্তর</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditItemField(item.id, "correctAnswer", false)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            item.correctAnswer === false
                              ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <X className="w-4 h-4 stroke-[3]" />
                          <span>মিথ্যা (False) — সঠিক উত্তর</span>
                        </button>
                      </div>
                    )}

                    {item.type === "FILL_BLANKS" && (
                      <div className="space-y-2.5">
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase">
                              বাক্যে শূন্যস্থান কোড (___):
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = item.title || "";
                                handleEditItemField(item.id, "title", cur ? `${cur} ___` : "___");
                              }}
                              className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold hover:bg-amber-500/30"
                            >
                              + [ ___ শূন্যস্থান যোগ ]
                            </button>
                          </div>
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex flex-wrap gap-1">
                            {(item.title || "").split(/(___+)/g).map((s, idx) =>
                              s.startsWith("___") ? (
                                <span key={idx} className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-800 dark:text-amber-200 text-[10px] font-black border border-amber-400">
                                  [ক্যাপসুল: {item.acceptedAnswers?.[0] || "উত্তর"}]
                                </span>
                              ) : (
                                <span key={idx}>{s}</span>
                              )
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400">গ্রহণযোগ্য সঠিক উত্তর (কমা দিয়ে একাধিক):</span>
                          <input
                            type="text"
                            value={item.acceptedAnswers?.join(", ") || ""}
                            onChange={(e) =>
                              handleEditItemField(
                                item.id,
                                "acceptedAnswers",
                                e.target.value.split(",").map((s) => s.trim())
                              )
                            }
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                            placeholder="কমা দিয়ে পৃথক উত্তর লিখুন (যেমন: ৩২, 32, ৩২ বিট)"
                          />
                        </div>
                      </div>
                    )}

                    {item.type === "MATCHING" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                          <span>ডান-বাম জোড়া তালিকা:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newPairs = [...(item.pairs || []), { left: "", right: "" }];
                              handleEditItemField(item.id, "pairs", newPairs);
                            }}
                            className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-bold"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ নতুন জোড়া</span>
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {(item.pairs || []).map((p, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={p.left}
                                onChange={(e) => {
                                  const newPairs = [...(item.pairs || [])];
                                  newPairs[pIdx].left = e.target.value;
                                  handleEditItemField(item.id, "pairs", newPairs);
                                }}
                                placeholder="বাম পাশ"
                                className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                              />
                              <ArrowRight className="w-3 h-3 text-emerald-500 shrink-0" />
                              <input
                                type="text"
                                value={p.right}
                                onChange={(e) => {
                                  const newPairs = [...(item.pairs || [])];
                                  newPairs[pIdx].right = e.target.value;
                                  handleEditItemField(item.id, "pairs", newPairs);
                                }}
                                placeholder="ডান পাশ"
                                className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                              />
                              {(item.pairs || []).length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPairs = (item.pairs || []).filter((_, i) => i !== pIdx);
                                    handleEditItemField(item.id, "pairs", newPairs);
                                  }}
                                  className="text-slate-400 hover:text-rose-500 p-0.5"
                                  title="জোড়া মুছুন"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.type === "REORDER" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                          <span>ধারাবাহিক ধাপসমূহ (সঠিক ক্রমানুসারে):</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = [...(item.items || []), `নতুন ধাপ`];
                              handleEditItemField(item.id, "items", newItems);
                            }}
                            className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5 font-bold"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ নতুন ধাপ</span>
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {(item.items || []).map((it, itIdx) => {
                            const total = (item.items || []).length;
                            return (
                              <div key={itIdx} className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-mono flex items-center justify-center font-bold shrink-0">
                                  {itIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={it}
                                  onChange={(e) => {
                                    const newItems = [...(item.items || [])];
                                    newItems[itIdx] = e.target.value;
                                    handleEditItemField(item.id, "items", newItems);
                                  }}
                                  className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                                />
                                {itIdx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newItems = [...(item.items || [])];
                                      const tmp = newItems[itIdx];
                                      newItems[itIdx] = newItems[itIdx - 1];
                                      newItems[itIdx - 1] = tmp;
                                      handleEditItemField(item.id, "items", newItems);
                                    }}
                                    className="p-1 text-slate-400 hover:text-indigo-600"
                                    title="উপরে নিন"
                                  >
                                    ↑
                                  </button>
                                )}
                                {itIdx < total - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newItems = [...(item.items || [])];
                                      const tmp = newItems[itIdx];
                                      newItems[itIdx] = newItems[itIdx + 1];
                                      newItems[itIdx + 1] = tmp;
                                      handleEditItemField(item.id, "items", newItems);
                                    }}
                                    className="p-1 text-slate-400 hover:text-indigo-600"
                                    title="নিচে নিন"
                                  >
                                    ↓
                                  </button>
                                )}
                                {total > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newItems = (item.items || []).filter((_, i) => i !== itIdx);
                                      handleEditItemField(item.id, "items", newItems);
                                    }}
                                    className="text-slate-400 hover:text-rose-500 p-0.5"
                                    title="ধাপ মুছুন"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Non-Graded & Special Slide Previews */}
                    {item.type === "TEXT_SLIDE" && (
                      <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 flex items-center gap-2">
                        <span>👋</span>
                        <span>প্রারম্ভিক সম্ভাষণ / কন্টেন্ট স্লাইড — টাইমার ছাড়া স্মার্টবোর্ডে তথ্য প্রদর্শিত হবে।</span>
                      </div>
                    )}

                    {item.type === "WORD_CLOUD" && (
                      <div className="p-3 bg-fuchsia-50/70 dark:bg-fuchsia-950/30 rounded-xl border border-fuchsia-200 dark:border-fuchsia-800 text-xs text-fuchsia-900 dark:text-fuchsia-300 flex items-center gap-2">
                        <span>☁️</span>
                        <span>লাইভ ওয়ার্ড ক্লাউড — শিক্ষার্থীরা তাদের মোবাইল ডিভাইস থেকে শব্দ সাবমিট করবে।</span>
                      </div>
                    )}

                    {item.type === "OPEN_ENDED" && (
                      <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-300 flex items-center gap-2">
                        <span>🎯</span>
                        <span>উন্মুক্ত মতামত / প্রস্তুতি যাচাই — শিক্ষার্থীরা ফোন থেকে ১-২ বাক্যে উত্তর পাঠাবে।</span>
                      </div>
                    )}

                    {item.type === "LEADERBOARD" && (
                      <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2 font-bold">
                        <span>🏆</span>
                        <span>স্বয়ংক্রিয় লাইভ লিডারবোর্ড — হোস্ট এই স্লাইডে আসলে স্টুডেন্টদের ফোনে র‍্যাঙ্ক প্রদর্শিত হবে।</span>
                      </div>
                    )}

                    {/* Explanation snippet */}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-1.5">
                      <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">💡 সঠিক উত্তরের ব্যাখ্যা:</span>
                      <input
                        type="text"
                        value={item.explanation || ""}
                        placeholder="ব্যাখ্যা বা শিক্ষকের নোট লিখুন..."
                        onChange={(e) => handleEditItemField(item.id, "explanation", e.target.value)}
                        className="flex-1 bg-transparent text-[11px] focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer for Review Stage */}
        {step === "review" && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 shrink-0">
            <button
              type="button"
              onClick={() => setStep("configure")}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>কনফিগারেশনে ফিরুন</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                নির্বাচিত <strong className="text-indigo-600 dark:text-indigo-400 font-mono font-black">{selectedCount}</strong>টি স্লাইড
              </span>

              <button
                type="button"
                onClick={handleInsertSelectedSlides}
                disabled={selectedCount === 0}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-700 hover:to-emerald-600 disabled:opacity-40 text-white text-xs font-black shadow-xl shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>➕ নির্বাচিত স্লাইডগুলো প্রেজেন্টেশনে যুক্ত করুন</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
