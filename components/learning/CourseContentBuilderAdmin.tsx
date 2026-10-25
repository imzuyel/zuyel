"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import {
  Layers,
  BookOpen,
  Plus,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Sparkles,
  FileText,
  HelpCircle,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Target,
  Loader2,
  ExternalLink,
  Flame,
  Check,
  XCircle,
  Printer,
  Copy,
  Upload,
  ArrowLeft,
  ArrowRight,
  Play,
  Compass,
  BookMarked,
  GraduationCap,
  Zap,
  CheckSquare,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { InternationalStoryLessonRenderer } from "@/components/learning/InternationalStoryLessonRenderer";
import { RichTextEditor } from "@/components/learning/RichTextEditor";
import {
  CourseItem,
  CourseChapterItem,
  ChapterContentItemData,
  QuizQuestionItem,
  QuizQuestionType,
  MatchingPair,
  ContentItemType,
} from "@/lib/chapterLearningEngine";
import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  MANDATORY_FOUR_TRADES,
  BTEB_ACADEMIC_TRADES,
  doesClassHaveTrade,
  getApplicableTradesForClass,
  parseClassNumeric,
} from "@/lib/academicStructure";
import { useAcademySettings } from "@/lib/useAcademySettings";
import { saveCustomLessonQuiz, StudentQuizQuestion } from "@/lib/studentIntelligenceStore";
import { TWENTY_QUIZ_TEMPLATES, QuizTemplateTheme } from "@/lib/quizEngineTypes";
import UniversalQuestionRenderer from "@/components/quiz/shared/UniversalQuestionRenderer";

interface CourseContentBuilderAdminProps {
  initialSubTab?: "builder" | "ai_prep" | "preview" | "template_gallery";
}

interface GeneratedClassPackage {
  lessonSummary: {
    briefOverview: string;
    objectives: string[];
    keyConcepts: string[];
    labPracticalGuidance: string[];
    safetyTips: string[];
  };
  blogPost: {
    title: string;
    estimatedReadMinutes: number;
    markdownContent: string;
  };
  quizSet: StudentQuizQuestion[];
}

const AVAILABLE_PRESENTATIONS = [
  {
    id: "pres-1",
    title: "বেসিক ইলেকট্রিক্যাল সার্কিট ও ওহমের সূত্রের প্রয়োগ",
    subject: "ইলেকট্রিক্যাল ওয়ার্কস-১",
    trade: "Electrical",
    classLevel: "class-9",
    totalSlides: 28,
    author: "প্রকৌ: মো: রফিকুল ইসলাম",
  },
  {
    id: "pres-2",
    title: "কম্পিউটার মাদারবোর্ড আর্কিটেকচার ও ট্রাবলশুটিং গাইড",
    subject: "কম্পিউটার অ্যাপ্লিকেশন",
    trade: "Computer",
    classLevel: "class-10",
    totalSlides: 32,
    author: "মো: জহুরুল ইসলাম",
  },
  {
    id: "pres-3",
    title: "ফোর-স্ট্রোক আইসি ইঞ্জিন ওভারহোলিং ও সেফটি প্রিক্রেশন",
    subject: "অটোমোবাইল পাওয়ার ট্রেন",
    trade: "Automobile",
    classLevel: "diploma",
    totalSlides: 25,
    author: "প্রকৌ: আমজাদ হোসেন",
  },
  {
    id: "pres-4",
    title: "রেফ্রিজারেশন সাইকেল ও কম্প্রেসর ওয়্যারিং ডায়াগ্রাম",
    subject: "আরএসি মেকানিক্স",
    trade: "RAC",
    classLevel: "class-9",
    totalSlides: 22,
    author: "মো: আল আমিন",
  },
  {
    id: "pres-5",
    title: "সিভিল ড্রাফটিং, আরসিসি কলাম ডিজাইন ও সাইট সেফটি",
    subject: "সিভিল ইঞ্জিনিয়ারিং",
    trade: "Civil",
    classLevel: "class-10",
    totalSlides: 24,
    author: "মোছা: নাসরিন আকতার",
  },
];

export default function CourseContentBuilderAdmin({
  initialSubTab = "builder",
}: CourseContentBuilderAdminProps) {
  // Top Sub-Tab State
  const [activeSubTab, setActiveSubTab] = useState<
    "builder" | "ai_prep" | "preview" | "template_gallery"
  >(initialSubTab);

  // Quiz Template Gallery Admin States
  const [galleryPreviewTheme, setGalleryPreviewTheme] = useState<"dark" | "light">("dark");
  const [selectedGalleryTemplateId, setSelectedGalleryTemplateId] = useState<string>("template-01");
  const [gallerySelectedOption, setGallerySelectedOption] = useState<number | null>(null);

  // Courses state
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Filters for Class and Trade (Strict rule: 6-8 NO trade, 9-12 has trade)
  const [filterClass, setFilterClass] = useState<number>(9);
  const [filterTrade, setFilterTrade] = useState<string>("all");

  const adminClassHasTrade = useMemo(() => {
    return doesClassHaveTrade(filterClass);
  }, [filterClass]);

  const adminApplicableTrades = useMemo(() => {
    return adminClassHasTrade ? getApplicableTradesForClass(filterClass) : [];
  }, [filterClass, adminClassHasTrade]);

  const handleAdminClassChange = (val: number) => {
    setFilterClass(val);
    const hasTrade = doesClassHaveTrade(val);
    if (!hasTrade) {
      setFilterTrade("General");
    } else {
      setFilterTrade("all");
    }
    const match = courses.find((c) => c.numericClass === val);
    if (match) setSelectedCourseId(match.id);
  };

  // Drag and drop state
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [draggedOverItemId, setDraggedOverItemId] = useState<number | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);

  // Modals for Builder
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemModalType, setItemModalType] = useState<ContentItemType>("BLOG_PART");
  const [editingItem, setEditingItem] = useState<ChapterContentItemData | null>(null);
  const [editingChapter, setEditingChapter] = useState<CourseChapterItem | null>(null);
  const [targetChapterId, setTargetChapterId] = useState<number | null>(null);

  // Custom Animated Delete Confirmation Modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: "chapter" | "item";
    id: number | null;
    title: string;
    description: string;
    itemName?: string;
  }>({
    isOpen: false,
    type: "chapter",
    id: null,
    title: "",
    description: "",
    itemName: "",
  });
  const [isDeletingEntity, setIsDeletingEntity] = useState(false);

  // New Course Form State
  const [newCourseForm, setNewCourseForm] = useState({
    title: "",
    titleBangla: "",
    description: "",
    code: "",
    classId: 9,
    className: "Class 9 (Vocational)",
    tradeCode: "EE",
    tradeName: "Electrical Works",
    subjectName: "ইলেকট্রিক্যাল ওয়ার্কস-১",
    badgeGradient: "from-amber-600 to-orange-700",
    difficulty: "Intermediate" as "Beginner" | "Intermediate" | "Advanced",
  });

  // New Chapter Form State
  const [newChapterForm, setNewChapterForm] = useState({
    title: "",
    titleBangla: "",
    description: "",
    unlockRule: "PREVIOUS_COMPLETED" as "IMMEDIATE" | "PREVIOUS_COMPLETED",
  });

  // Content Item Form State
  const [itemForm, setItemForm] = useState({
    title: "",
    titleBangla: "",
    isMandatory: true,
    isPublished: true,
    xpReward: 50,
    passingScore: 60,
    minScoreToUnlockNext: 60,
    attemptLimit: 3,
    durationMinutes: 6,
    blogPartNumber: 1,
    contentMarkdown: "",
    summary: "",
    keyTakeawaysText: "",
    timeLimitSeconds: 300,
    quizQuestions: [] as QuizQuestionItem[],
  });

  // Question editing sub-state for quiz builder
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isSavingQuestionItem, setIsSavingQuestionItem] = useState<boolean>(false);
  const [newQuestion, setNewQuestion] = useState<{
    questionType: QuizQuestionType;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOptionIndex: number;
    correctBoolean: boolean;
    acceptedAnswersText: string;
    matchingPairs: { left: string; right: string }[];
    reorderItems: string[];
    explanation: string;
  }>({
    questionType: "MCQ",
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOptionIndex: 0,
    correctBoolean: true,
    acceptedAnswersText: "",
    matchingPairs: [
      { left: "", right: "" },
      { left: "", right: "" },
    ],
    reorderItems: ["প্রথম ধাপ / উপাদান ১", "দ্বিতীয় ধাপ / উপাদান ২", "তৃতীয় ধাপ / উপাদান ৩"],
    explanation: "",
  });

  // ==========================================
  // SUB-TAB 2: AI CLASS PREP & SLIDE TO BLOG
  // ==========================================
  const { getTradesForClass, hasTrades } = useAcademySettings();
  const [prepClassId, setPrepClassId] = useState<string>("class-9");
  const [prepTradeId, setPrepTradeId] = useState<string>("Electrical");
  const [selectedPresentationId, setSelectedPresentationId] = useState<string>("pres-1");
  const [customPresentationTitle, setCustomPresentationTitle] = useState<string>("");
  const [isCustomUpload, setIsCustomUpload] = useState<boolean>(false);
  const [startSlide, setStartSlide] = useState<number>(1);
  const [endSlide, setEndSlide] = useState<number>(15);
  const [teacherNotes, setTeacherNotes] = useState<string>("");
  const [teacherName, setTeacherName] = useState<string>(
    "প্রকৌ: মো: রফিকুল ইসলাম (চিফ ইন্সট্রাক্টর)"
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPackage, setGeneratedPackage] = useState<GeneratedClassPackage | null>(null);
  const [activePackageTab, setActivePackageTab] = useState<"summary" | "blog" | "quiz">("summary");
  const [blogEditMode, setBlogEditMode] = useState<"preview" | "edit">("preview");
  const [editableMarkdown, setEditableMarkdown] = useState<string>("");
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [isAddingToChapter, setIsAddingToChapter] = useState<boolean>(false);

  // Sync presentation selection
  const handlePresentationChange = (presId: string) => {
    setSelectedPresentationId(presId);
    if (presId !== "custom") {
      setIsCustomUpload(false);
      const found = AVAILABLE_PRESENTATIONS.find((p) => p.id === presId);
      if (found) {
        setPrepClassId(found.classLevel);
        setPrepTradeId(found.trade);
        setStartSlide(1);
        setEndSlide(Math.min(15, found.totalSlides));
      }
    } else {
      setIsCustomUpload(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setCustomPresentationTitle(cleanName);
      setIsCustomUpload(true);
      setSelectedPresentationId("custom");
    }
  };

  const currentPresentationTitle = isCustomUpload
    ? customPresentationTitle || "নতুন কারিগরি প্রেজেন্টেশন"
    : AVAILABLE_PRESENTATIONS.find((p) => p.id === selectedPresentationId)?.title ||
      "বেসিক কারিগরি পাঠ";

  const handleGenerateClassPackage = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/prepare-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetClass: prepClassId,
          trade: prepTradeId,
          presentationTitle: currentPresentationTitle,
          slideRange: `স্লাইড ${startSlide} থেকে ${endSlide}`,
          customNotes: teacherNotes.trim(),
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const pkg: GeneratedClassPackage = resData.data;
        setGeneratedPackage(pkg);
        setEditableMarkdown(pkg.blogPost.markdownContent);
        toast.success("AI ক্লাস প্যাকেজ সফলভাবে তৈরি হয়েছে!");
      } else {
        throw new Error(resData.error || "Failed to generate class package");
      }
    } catch (err: any) {
      console.error("AI Generation error, using fallback package:", err);
      // Resilient fallback
      const mockPackage: GeneratedClassPackage = {
        lessonSummary: {
          briefOverview: `${currentPresentationTitle} পাঠের স্লাইড ${startSlide}-${endSlide} থেকে সংগৃহীত মূল পয়েন্ট ও শিখনফল।`,
          objectives: [
            `${currentPresentationTitle}-এর মূল নীতি ব্যাখ্যা করতে পারবে।`,
            "ব্যবহারিক কর্মশালায় উপযুক্ত সেফটি নিয়মাবলি মেনে চলতে পারবে।",
            "সমস্যা চিহ্নিত করে ট্রাবলশুটিং সমাধান করতে পারবে।",
          ],
          keyConcepts: [
            "তাত্ত্বিক ভিত্তি ও মূল গাণিতিক নীতি।",
            "যন্ত্রাংশের কালার কোডিং এবং কার্যপ্রণালী।",
            "পরিমাপক মিটার দিয়ে সঠিক রিডিং গ্রহণ।",
          ],
          labPracticalGuidance: [
            "ওয়ার্কবেঞ্চে প্রয়োজনীয় টুলকিট গুছিয়ে টেস্ট সার্কিট রেডি করুন।",
            "প্রথমে পাওয়ার অফ অবস্থায় তারের সংযোগ যাচাই করুন।",
          ],
          safetyTips: [
            "রাবার গ্লাভস ও ইনসুলেটেড শু পরিধান নিশ্চিত করুন।",
            "ওয়েট সারফেসে কাজ করা সম্পূর্ণ নিষিদ্ধ।",
          ],
        },
        blogPost: {
          title: `${currentPresentationTitle}: ব্যবহারিক প্রয়োগ ও টেকনিক্যাল গাইড`,
          estimatedReadMinutes: 6,
          markdownContent: `# ${currentPresentationTitle}\n\n## মূল শিখনফল\nএই ব্লগে স্লাইড ${startSlide} থেকে ${endSlide} এর মূল কারিগরি পয়েন্টগুলো আলোচনা করা হয়েছে।\n\n### ১. প্রধান সূত্র ও নীতি\nইলেকট্রিক্যাল ও ভোকেশনাল কাজের ক্ষেত্রে মানদণ্ড বজায় রেখে ধারাবাহিক পর্যবেক্ষণ জরুরি।\n\n### ২. কর্মক্ষেত্রের নিরাপত্তা\n- ইনসুলেটেড টুলস ব্যবহার করুন।\n- সার্কিট টেস্ট করার আগে সংযোগ ডাবল চেক করুন।`,
        },
        quizSet: [
          {
            id: "q-ai-1",
            questionText: `${currentPresentationTitle}-এর মূল উদ্দেশ্য কী?`,
            options: [
              "সার্কিটের মূল উপাদান বিশ্লেষণ",
              "কেবল তাত্ত্বিক পড়াশোনা",
              "অপ্রয়োজনীয় সংযোগ তৈরি",
              "সরাসরি শর্ট সার্কিট করা",
            ],
            correctAnswerIndex: 0,
            explanation: "সার্কিট উপাদান ও সুরক্ষা বজায় রাখা এই পাঠের মূল লক্ষ্য।",
            conceptTopic: "বেসিক কনসেপ্ট",
          },
          {
            id: "q-ai-2",
            questionText: "কর্মশালায় কাজ শুরুর পূর্বে সবচেয়ে গুরুত্বপূর্ণ ধাপ কোনটি?",
            options: [
              "ব্যক্তিগত সুরক্ষা সামগ্রী (PPE) পরিধান",
              "সার্কিট দ্রুত অন করা",
              "টুলস এলোমেলো রাখা",
              "সুরক্ষা ফিউজ খুলে রাখা",
            ],
            correctAnswerIndex: 0,
            explanation: "ল্যাব ও ওয়ার্কশপে ব্যক্তিগত নিরাপত্তা সরঞ্জাম (PPE) সবার আগে প্রয়োজন।",
            conceptTopic: "ল্যাব সেফটি",
          },
        ],
      };
      setGeneratedPackage(mockPackage);
      setEditableMarkdown(mockPackage.blogPost.markdownContent);
      toast.info("অফলাইন রেসিলিয়েন্ট ক্লাস প্যাকেজ লোড হয়েছে!");
    } finally {
      setIsGenerating(false);
    }
  };

  // Add AI Package directly into the Selected Course Chapter as Blocks!
  const handleAddAiPackageToChapter = async () => {
    if (!generatedPackage) return;
    if (!selectedCourse) {
      toast.error("প্রথমে কোর্স নির্বাচন করুন");
      return;
    }
    const targetChapter = selectedCourse.chapters[0];
    if (!targetChapter) {
      toast.error("নির্বাচিত কোর্সে কোনো অধ্যায় নেই। প্রথমে একটি অধ্যায় তৈরি করুন।");
      return;
    }

    try {
      setIsAddingToChapter(true);

      // 1. Post Blog Part Block
      await fetch(`/api/learning/chapters/${targetChapter.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "BLOG_PART",
          title: generatedPackage.blogPost.title,
          titleBangla: generatedPackage.blogPost.title,
          contentMarkdown: editableMarkdown || generatedPackage.blogPost.markdownContent,
          summary: generatedPackage.lessonSummary.briefOverview,
          keyTakeaways: generatedPackage.lessonSummary.keyConcepts,
          readTimeMinutes: generatedPackage.blogPost.estimatedReadMinutes || 6,
          isMandatory: true,
          isPublished: true,
          xpReward: 50,
          unlockRule: "UNLOCKED",
        }),
      });

      // 2. Post Checkpoint Quiz Block
      if (generatedPackage.quizSet && generatedPackage.quizSet.length > 0) {
        await fetch(`/api/learning/chapters/${targetChapter.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemType: "QUIZ",
            title: `Checkpoint Assessment: ${generatedPackage.blogPost.title}`,
            titleBangla: `চেকপয়েন্ট মূল্যায়ন কুইজ: ${generatedPackage.blogPost.title}`,
            quizQuestions: generatedPackage.quizSet.map((q, idx) => ({
              id: `q-gen-${Date.now()}-${idx}`,
              questionText: q.questionText,
              options: q.options,
              correctOptionIndex: q.correctAnswerIndex ?? 0,
              explanation: q.explanation || "সঠিক উত্তর নির্বাচন করা হয়েছে।",
              marks: 1,
            })),
            isMandatory: true,
            isPublished: true,
            xpReward: 75,
            passingScore: 60,
            minScoreToUnlockNext: 60,
            attemptLimit: 3,
            timeLimitSeconds: 300,
            unlockRule: "PREVIOUS_ITEM_COMPLETED",
          }),
        });
      }

      toast.success("সফলভাবে অধ্যায়ে রিচ ব্লগ পার্ট ও চেকপয়েন্ট কুইজ ব্লক যুক্ত হয়েছে!");
      await fetchCourses();
      setActiveSubTab("builder");
    } catch (err) {
      console.error(err);
      toast.error("অধ্যায়ে ব্লক যুক্ত করতে ব্যর্থ হয়েছে");
    } finally {
      setIsAddingToChapter(false);
    }
  };

  // ==========================================
  // SUB-TAB 3: SEQUENTIAL BLOCK FLOW PREVIEW & ONE-BY-ONE QUIZ
  // ==========================================
  // Interactive Session State for Progressive Locking Demonstration
  const [completedItemIds, setCompletedItemIds] = useState<number[]>([1001]);
  const [activePreviewItem, setActivePreviewItem] = useState<ChapterContentItemData | null>(null);
  const [previewQuizCurrentQ, setPreviewQuizCurrentQ] = useState<number>(0);
  const [previewQuizAnswers, setPreviewQuizAnswers] = useState<Record<string, number>>({});
  const [previewConfirmedQs, setPreviewConfirmedQs] = useState<Record<string, boolean>>({});
  const [previewStreak, setPreviewStreak] = useState<number>(0);
  const [previewXpEarned, setPreviewXpEarned] = useState<number>(0);

  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/learning/courses");
      const data = await res.json();
      if (data.success && data.courses) {
        setCourses(data.courses);
        if (!selectedCourseId && data.courses.length > 0) {
          const match = data.courses.find(
            (c: CourseItem) =>
              c.numericClass === filterClass &&
              (!c.tradeCode || c.tradeCode === filterTrade)
          );
          setSelectedCourseId(match ? match.id : data.courses[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("কোর্স লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const selectedCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  const adminFilteredCourses = useMemo(() => {
    const list = courses.filter((c) => {
      if (c.numericClass !== filterClass) return false;
      if (adminClassHasTrade && filterTrade !== "all") {
        if (c.tradeCode !== filterTrade && !c.code.includes(filterTrade)) return false;
      }
      return true;
    });
    return list.length > 0 ? list : courses;
  }, [courses, filterClass, adminClassHasTrade, filterTrade]);

  // Handle Drag & Drop reordering
  const handleDragStart = (itemId: number, chapterId: number) => {
    setDraggedItemId(itemId);
    setActiveChapterId(chapterId);
  };

  const handleDragOver = (e: React.DragEvent, itemId: number) => {
    e.preventDefault();
    setDraggedOverItemId(itemId);
  };

  const handleDrop = async (e: React.DragEvent, targetItemId: number, chapterId: number) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetItemId || activeChapterId !== chapterId) {
      setDraggedItemId(null);
      setDraggedOverItemId(null);
      return;
    }

    const chapter = selectedCourse?.chapters.find((ch) => ch.id === chapterId);
    if (!chapter) return;

    const items = [...chapter.items].sort((a, b) => a.orderIndex - b.orderIndex);
    const draggedIdx = items.findIndex((i) => i.id === draggedItemId);
    const targetIdx = items.findIndex((i) => i.id === targetItemId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const [moved] = items.splice(draggedIdx, 1);
    items.splice(targetIdx, 0, moved);

    const newOrderIds = items.map((i) => i.id);
    const movedTitle = moved.titleBangla || moved.title || "আইটেম";

    // Optimistic UI update
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== selectedCourse?.id) return c;
        return {
          ...c,
          chapters: c.chapters.map((ch) => {
            if (ch.id !== chapterId) return ch;
            return {
              ...ch,
              items: items.map((it, idx) => ({ ...it, orderIndex: idx + 1 })),
            };
          }),
        };
      })
    );

    setDraggedItemId(null);
    setDraggedOverItemId(null);

    try {
      const res = await fetch(`/api/learning/chapters/${chapterId}/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIdsInOrder: newOrderIds }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("আইটেম সফলভাবে পুনর্বিন্যাস করা হয়েছে", {
          description: `"${movedTitle}" এখন ক্রম #${targetIdx + 1}-এ অবস্থান করছে।`,
        });
      } else {
        toast.error(data.error || "পুনর্বিন্যাস ব্যর্থ হয়েছে");
        fetchCourses();
      }
    } catch {
      toast.error("সার্ভার ত্রুটি");
      fetchCourses();
    }
  };

  // Move Up / Move Down buttons for accessible reordering
  const handleMoveStep = async (chapterId: number, itemId: number, direction: "up" | "down") => {
    const chapter = selectedCourse?.chapters.find((ch) => ch.id === chapterId);
    if (!chapter) return;

    const items = [...chapter.items].sort((a, b) => a.orderIndex - b.orderIndex);
    const idx = items.findIndex((i) => i.id === itemId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === items.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const temp = items[idx];
    items[idx] = items[swapIdx];
    items[swapIdx] = temp;

    const newOrderIds = items.map((i) => i.id);
    const movedTitle = temp.titleBangla || temp.title || "আইটেম";

    // Optimistic UI update
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== selectedCourse?.id) return c;
        return {
          ...c,
          chapters: c.chapters.map((ch) => {
            if (ch.id !== chapterId) return ch;
            return {
              ...ch,
              items: items.map((it, i) => ({ ...it, orderIndex: i + 1 })),
            };
          }),
        };
      })
    );

    try {
      const res = await fetch(`/api/learning/chapters/${chapterId}/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIdsInOrder: newOrderIds }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("আইটেম সফলভাবে পুনর্বিন্যাস করা হয়েছে", {
          description: `"${movedTitle}" এখন ক্রম #${swapIdx + 1}-এ অবস্থান করছে।`,
        });
        fetchCourses();
      } else {
        toast.error(data.error || "পুনর্বিন্যাস ব্যর্থ হয়েছে");
        fetchCourses();
      }
    } catch {
      toast.error("পুনর্বিন্যাস ব্যর্থ হয়েছে");
      fetchCourses();
    }
  };

  // Create Course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/learning/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourseForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("কোর্স সফলভাবে তৈরি হয়েছে!");
        setShowCourseModal(false);
        await fetchCourses();
        setSelectedCourseId(data.course.id);
      } else {
        toast.error(data.error || "কোর্স তৈরি করা যায়নি");
      }
    } catch {
      toast.error("নেটওয়ার্ক ত্রুটি");
    }
  };

  // Open Add Chapter Modal
  const openAddChapterModal = () => {
    setEditingChapter(null);
    setNewChapterForm({
      title: "",
      titleBangla: "",
      description: "",
      unlockRule: "PREVIOUS_COMPLETED",
    });
    setShowChapterModal(true);
  };

  // Open Edit Chapter Modal
  const openEditChapterModal = (chapter: CourseChapterItem) => {
    setEditingChapter(chapter);
    setNewChapterForm({
      title: chapter.title || "",
      titleBangla: chapter.titleBangla || "",
      description: chapter.description || "",
      unlockRule: chapter.unlockRule || "PREVIOUS_COMPLETED",
    });
    setShowChapterModal(true);
  };

  // Create or Update Chapter (PUT if editing, POST if creating)
  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    try {
      const url = editingChapter
        ? `/api/learning/chapters/${editingChapter.id}`
        : "/api/learning/chapters";
      const method = editingChapter ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          ...newChapterForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          editingChapter
            ? "অধ্যায় সফলভাবে আপডেট করা হয়েছে!"
            : "অধ্যায় সফলভাবে যুক্ত করা হয়েছে!"
        );
        setShowChapterModal(false);
        setEditingChapter(null);
        setNewChapterForm({
          title: "",
          titleBangla: "",
          description: "",
          unlockRule: "PREVIOUS_COMPLETED",
        });
        fetchCourses();
      } else {
        toast.error(data.error || "অধ্যায় সংরক্ষণ করা যায়নি");
      }
    } catch {
      toast.error("নেটওয়ার্ক ত্রুটি");
    }
  };

  // Open Custom Animated Delete Confirmation Modal for Chapter
  const openDeleteChapterModal = (chapterId: number, chapterTitle?: string) => {
    const chapter = selectedCourse?.chapters.find((ch) => ch.id === chapterId);
    setDeleteModalState({
      isOpen: true,
      type: "chapter",
      id: chapterId,
      title: "অধ্যায় মুছে ফেলার নিশ্চিতকরণ",
      description:
        "আপনি কি নিশ্চিতভাবে এই অধ্যায়টি মুছে ফেলতে চান? এর অধীনস্থ সকল ব্লগ পার্ট, কুইজ ও প্রোগ্রেসিভ লকিং পাথওয়ে স্থায়ীভাবে মুছে যাবে।",
      itemName: chapterTitle || chapter?.titleBangla || chapter?.title || `অধ্যায় #${chapterId}`,
    });
  };

  const handleDeleteChapter = (chapterId: number, chapterTitle?: string) => {
    openDeleteChapterModal(chapterId, chapterTitle);
  };

  // Unified execution of delete action from custom animated modal
  const handleExecuteDelete = async () => {
    if (!deleteModalState.id) return;
    setIsDeletingEntity(true);
    try {
      if (deleteModalState.type === "chapter") {
        const res = await fetch(`/api/learning/chapters/${deleteModalState.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          toast.success("অধ্যায় সফলভাবে মুছে ফেলা হয়েছে", {
            description: deleteModalState.itemName
              ? `"${deleteModalState.itemName}" সম্পূর্ণ সরানো হয়েছে`
              : undefined,
          });
          fetchCourses();
        } else {
          toast.error(data.error || "অধ্যায় মোছা যায়নি");
        }
      } else if (deleteModalState.type === "item") {
        const res = await fetch(`/api/learning/items/${deleteModalState.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          toast.success("কনটেন্ট ব্লক সফলভাবে মুছে ফেলা হয়েছে", {
            description: deleteModalState.itemName
              ? `"${deleteModalState.itemName}" সম্পূর্ণ সরানো হয়েছে`
              : undefined,
          });
          fetchCourses();
        } else {
          toast.error(data.error || "আইটেম মোছা যায়নি");
        }
      }
    } catch {
      toast.error("সার্ভার ত্রুটি ঘটেছে");
    } finally {
      setIsDeletingEntity(false);
      setDeleteModalState((prev) => ({ ...prev, isOpen: false, id: null }));
    }
  };

  // Open Item Creator Modal
  const openAddItemModal = (chapterId: number, type: ContentItemType) => {
    setTargetChapterId(chapterId);
    setItemModalType(type);
    setEditingItem(null);

    const chapter = selectedCourse?.chapters.find((ch) => ch.id === chapterId);
    const existingParts = chapter?.items.filter((i) => i.itemType === "BLOG_PART").length || 0;

    setItemForm({
      title:
        type === "BLOG_PART"
          ? `Part ${existingParts + 1}: Technical Guide`
          : "Checkpoint Assessment Quiz",
      titleBangla:
        type === "BLOG_PART"
          ? `পার্ট ${existingParts + 1}: ব্যবহারিক নির্দেশিকা`
          : "চেকপয়েন্ট মূল্যায়ন কুইজ",
      isMandatory: true,
      isPublished: true,
      xpReward: type === "BLOG_PART" ? 50 : 75,
      passingScore: 60,
      minScoreToUnlockNext: 60,
      attemptLimit: type === "QUIZ" ? 3 : 0,
      durationMinutes: type === "BLOG_PART" ? 6 : 5,
      blogPartNumber: existingParts + 1,
      contentMarkdown:
        type === "BLOG_PART"
          ? `# পার্ট ${existingParts + 1}: পাঠ্য বিষয়\n\n## ভূমিকা\nএখানে বিস্তারিত কারিগরি নির্দেশনা লিখুন...`
          : "",
      summary: "",
      keyTakeawaysText: "",
      timeLimitSeconds: 300,
      quizQuestions: [
        {
          id: `q-init-1`,
          questionText: "একটি আদর্শ মূল্যায়ন প্রশ্ন?",
          options: ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"],
          correctOptionIndex: 0,
          explanation: "সঠিক উত্তরের কারণ এখানে লিখুন।",
          marks: 1,
        },
      ],
    });

    setShowItemModal(true);
  };

  // Open Item Editor Modal (Pre-populate with existing block part or quiz data)
  const openEditItemModal = (chapterId: number, item: ChapterContentItemData) => {
    setTargetChapterId(chapterId);
    setItemModalType(item.itemType);
    setEditingItem(item);

    setItemForm({
      title: item.title || "",
      titleBangla: item.titleBangla || "",
      isMandatory: item.isMandatory !== undefined ? item.isMandatory : true,
      isPublished: item.isPublished !== undefined ? item.isPublished : true,
      xpReward: item.xpReward || (item.itemType === "BLOG_PART" ? 50 : 75),
      passingScore: item.passingScore || 60,
      minScoreToUnlockNext: item.minScoreToUnlockNext || 60,
      attemptLimit: item.attemptLimit || (item.itemType === "QUIZ" ? 3 : 0),
      durationMinutes: item.durationMinutes || (item.itemType === "BLOG_PART" ? 6 : 5),
      blogPartNumber: item.blogPartNumber || 1,
      contentMarkdown: item.contentMarkdown || "",
      summary: item.summary || "",
      keyTakeawaysText: Array.isArray(item.keyTakeaways) ? item.keyTakeaways.join("\n") : "",
      timeLimitSeconds: item.timeLimitSeconds || 300,
      quizQuestions: item.quizQuestions || [],
    });

    setShowItemModal(true);
  };

  // Save Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetChapterId) return;

    setIsUpdating(true);
    const payload = {
      ...itemForm,
      itemType: itemModalType,
      keyTakeaways: itemForm.keyTakeawaysText
        ? itemForm.keyTakeawaysText
            .split("\n")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    };

    try {
      const url = editingItem
        ? `/api/learning/items/${editingItem.id}`
        : `/api/learning/chapters/${targetChapterId}/items`;
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          editingItem ? "আইটেম ও কুইজ প্রশ্ন সফলভাবে আপডেট হয়েছে!" : "নতুন আইটেম সফলভাবে যোগ করা হয়েছে!"
        );
        setShowItemModal(false);
        fetchCourses();
      } else {
        toast.error(data.error || "সংরক্ষণ করা যায়নি");
      }
    } catch {
      toast.error("সার্ভার ত্রুটি");
    } finally {
      setIsUpdating(false);
    }
  };

  // Open Custom Animated Delete Confirmation Modal for Content Item
  const openDeleteItemModal = (itemId: number, itemTitle?: string) => {
    let resolvedTitle = itemTitle;
    if (!resolvedTitle && selectedCourse) {
      for (const ch of selectedCourse.chapters) {
        const found = ch.items.find((it) => it.id === itemId);
        if (found) {
          resolvedTitle = found.titleBangla || found.title;
          break;
        }
      }
    }
    setDeleteModalState({
      isOpen: true,
      type: "item",
      id: itemId,
      title: "কনটেন্ট ব্লক মুছে ফেলার নিশ্চিতকরণ",
      description:
        "আপনি কি নিশ্চিতভাবে এই আইটেমটি মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফিরিয়ে আনা যাবে না।",
      itemName: resolvedTitle || `আইটেম #${itemId}`,
    });
  };

  const handleDeleteItem = (itemId: number, itemTitle?: string) => {
    openDeleteItemModal(itemId, itemTitle);
  };

  // Add or update question in quiz form
  const handleAddQuestionToQuiz = async () => {
    setIsSavingQuestionItem(true);
    await new Promise((r) => setTimeout(r, 150));
    try {
      if (!newQuestion.questionText.trim()) {
        toast.error("প্রশ্নের বিবরণ পূরণ করুন");
        setIsSavingQuestionItem(false);
        return;
      }

    let options: string[] = [];
    let correctOptionIndex = 0;
    let correctBoolean: boolean | undefined = undefined;
    let acceptedAnswers: string[] | undefined = undefined;
    let matchingPairs: MatchingPair[] | undefined = undefined;
    let correctOrder: string[] | undefined = undefined;
    let correctAnswer: string | undefined = undefined;
    let optionsJson: string | undefined = undefined;

    if (newQuestion.questionType === "MCQ") {
      if (!newQuestion.optionA || !newQuestion.optionB) {
        toast.error("MCQ প্রশ্নের জন্য অন্তত ২টি অপশন (A ও B) পূরণ করুন");
        return;
      }
      options = [newQuestion.optionA, newQuestion.optionB];
      if (newQuestion.optionC) options.push(newQuestion.optionC);
      if (newQuestion.optionD) options.push(newQuestion.optionD);
      correctOptionIndex = Number(newQuestion.correctOptionIndex);
      correctAnswer = options[correctOptionIndex] || "";
    } else if (newQuestion.questionType === "TRUE_FALSE") {
      options = ["সত্য", "মিথ্যা"];
      correctBoolean = newQuestion.correctBoolean;
      correctOptionIndex = newQuestion.correctBoolean ? 0 : 1;
      correctAnswer = String(newQuestion.correctBoolean);
    } else if (newQuestion.questionType === "FILL_BLANKS") {
      // Check for inline bracketed words: e.g. [CPU]
      const bracketMatches = Array.from(
        newQuestion.questionText.matchAll(/\[(.*?)\]/g)
      ).map((m) => m[1].trim());

      const parsedAnswers = newQuestion.acceptedAnswersText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const combinedAnswers = Array.from(
        new Set([...bracketMatches, ...parsedAnswers])
      ).filter(Boolean);

      if (combinedAnswers.length === 0) {
        toast.error("শূন্যস্থান পূরণের জন্য বাক্যে [সঠিক উত্তর] ব্র্যাকেটে লিখুন অথবা নিচে গ্রহণযোগ্য উত্তর ইনপুট দিন");
        return;
      }
      acceptedAnswers = combinedAnswers;
      options = combinedAnswers;
      correctOptionIndex = 0;
      correctAnswer = combinedAnswers[0];
    } else if (newQuestion.questionType === "MATCHING") {
      const validPairs = (newQuestion.matchingPairs || []).filter(
        (p) => p.left.trim() && p.right.trim()
      );
      if (validPairs.length < 2) {
        toast.error("বাম-ডান মিলকরণের জন্য অন্তত ২টি পূর্ণাঙ্গ জোড়া (Left-Right Pair) লিখুন");
        return;
      }
      const formattedPairs: MatchingPair[] = validPairs.map((p, idx) => ({
        id: idx + 1,
        left: p.left.trim(),
        right: p.right.trim(),
      }));
      matchingPairs = formattedPairs;
      const jsonPairs = JSON.stringify(formattedPairs);
      correctAnswer = jsonPairs;
      optionsJson = jsonPairs;
      options = validPairs.map((p) => p.left.trim());
      correctOptionIndex = 0;
    } else if (newQuestion.questionType === "REORDER") {
      const validItems = (newQuestion.reorderItems || [])
        .map((item) => item.trim())
        .filter(Boolean);

      if (validItems.length < 2) {
        toast.error("সঠিক ক্রমে সাজানোর জন্য অন্তত ২টি আইটেম ক্রমানুসারে ইনপুট দিন");
        return;
      }
      correctOrder = validItems;
      options = validItems;
      correctOptionIndex = 0;
      correctAnswer = JSON.stringify(validItems);
    }

    if (editingQuestionId) {
      setItemForm((prev) => ({
        ...prev,
        quizQuestions: prev.quizQuestions.map((q) =>
          q.id === editingQuestionId
            ? {
                ...q,
                questionType: newQuestion.questionType,
                questionText: newQuestion.questionText,
                options,
                correctOptionIndex,
                correctBoolean,
                acceptedAnswers,
                matchingPairs,
                correctOrder,
                correctAnswer,
                optionsJson,
                explanation: newQuestion.explanation || "সঠিক উত্তর নির্বাচন করা হয়েছে।",
              }
            : q
        ),
      }));
      setEditingQuestionId(null);
      toast.success("প্রশ্নটি সফলভাবে আপডেট করা হয়েছে!");
    } else {
      const questionItem: QuizQuestionItem = {
        id: `q-${Date.now()}`,
        questionType: newQuestion.questionType,
        questionText: newQuestion.questionText,
        options,
        correctOptionIndex,
        correctBoolean,
        acceptedAnswers,
        matchingPairs,
        correctOrder,
        correctAnswer,
        optionsJson,
        explanation: newQuestion.explanation || "সঠিক উত্তর নির্বাচন করা হয়েছে।",
        marks: 1,
      };

      setItemForm((prev) => ({
        ...prev,
        quizQuestions: [...prev.quizQuestions, questionItem],
      }));
      toast.success("প্রশ্ন কুইজে যোগ হয়েছে!");
    }

    // Reset question form
    setNewQuestion({
      questionType: "MCQ",
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOptionIndex: 0,
      correctBoolean: true,
      acceptedAnswersText: "",
      matchingPairs: [
        { left: "", right: "" },
        { left: "", right: "" },
      ],
      reorderItems: ["প্রথম ধাপ / উপাদান ১", "দ্বিতীয় ধাপ / উপাদান ২", "তৃতীয় ধাপ / উপাদান ৩"],
      explanation: "",
    });
    } finally {
      setIsSavingQuestionItem(false);
    }
  };

  const handleEditQuestionInQuiz = (q: QuizQuestionItem) => {
    setEditingQuestionId(q.id);
    const qType = q.questionType || "MCQ";

    // Safely extract matching pairs from either q.matchingPairs or q.correctAnswer or q.optionsJson
    let loadedMatchingPairs = [
      { left: "", right: "" },
      { left: "", right: "" },
    ];
    if (q.matchingPairs && q.matchingPairs.length > 0) {
      loadedMatchingPairs = q.matchingPairs.map((p) => ({ left: p.left, right: p.right }));
    } else if (typeof q.correctAnswer === "string" && q.correctAnswer.startsWith("[")) {
      try {
        const parsed = JSON.parse(q.correctAnswer);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedMatchingPairs = parsed.map((p: any) => ({ left: p.left || "", right: p.right || "" }));
        }
      } catch {}
    } else if (typeof q.optionsJson === "string" && q.optionsJson.startsWith("[")) {
      try {
        const parsed = JSON.parse(q.optionsJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedMatchingPairs = parsed.map((p: any) => ({ left: p.left || "", right: p.right || "" }));
        }
      } catch {}
    }

    setNewQuestion({
      questionType: qType,
      questionText: q.questionText,
      optionA: (q.options && q.options[0]) || "",
      optionB: (q.options && q.options[1]) || "",
      optionC: (q.options && q.options[2]) || "",
      optionD: (q.options && q.options[3]) || "",
      correctOptionIndex: q.correctOptionIndex ?? 0,
      correctBoolean: q.correctBoolean !== undefined ? q.correctBoolean : q.correctOptionIndex === 0,
      acceptedAnswersText: (q.acceptedAnswers || []).join(", "),
      matchingPairs: loadedMatchingPairs,
      reorderItems:
        q.correctOrder && q.correctOrder.length > 0
          ? [...q.correctOrder]
          : q.options && q.options.length > 0
          ? [...q.options]
          : ["প্রথম ধাপ / উপাদান ১", "দ্বিতীয় ধাপ / উপাদান ২", "তৃতীয় ধাপ / উপাদান ৩"],
      explanation: q.explanation || "",
    });
  };

  const handleRemoveQuestion = (qId: string) => {
    if (editingQuestionId === qId) {
      setEditingQuestionId(null);
      setNewQuestion({
        questionType: "MCQ",
        questionText: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOptionIndex: 0,
        correctBoolean: true,
        acceptedAnswersText: "",
        matchingPairs: [
          { left: "", right: "" },
          { left: "", right: "" },
        ],
        reorderItems: ["প্রথম ধাপ / উপাদান ১", "দ্বিতীয় ধাপ / উপাদান ২", "তৃতীয় ধাপ / উপাদান ৩"],
        explanation: "",
      });
    }
    setItemForm((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.filter((q) => q.id !== qId),
    }));
  };

  // Interactive Preview: Quiz option select with Immediate Feedback
  const handlePreviewSelectOption = (
    questionId: string,
    optIdx: number,
    correctIdx: number,
    explanation: string
  ) => {
    if (previewConfirmedQs[questionId]) return;

    setPreviewQuizAnswers((prev) => ({ ...prev, [questionId]: optIdx }));
    setPreviewConfirmedQs((prev) => ({ ...prev, [questionId]: true }));

    const isCorrect = optIdx === correctIdx;
    if (isCorrect) {
      setPreviewStreak((prev) => prev + 1);
      setPreviewXpEarned((prev) => prev + 25);
    } else {
      setPreviewStreak(0);
    }
  };

  // Complete Block Part in Preview
  const handleCompletePreviewBlog = (itemId: number) => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#10b981", "#06b6d4", "#6366f1", "#f59e0b"],
      });
    } catch {}

    setCompletedItemIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
    toast.success("ব্লক পড়া সম্পন্ন হয়েছে! পরবর্তী চেকপয়েন্ট কুইজ আনলক হয়েছে।");
    setActivePreviewItem(null);
  };

  // Complete Quiz in Preview
  const handleCompletePreviewQuiz = (itemId: number) => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 },
        colors: ["#10b981", "#3b82f6", "#f59e0b", "#ec4899"],
      });
    } catch {}

    setCompletedItemIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
    toast.success("অভিনন্দন! কুইজ উত্তীর্ণ হয়েছেন এবং পরবর্তী ব্লক পার্ট আনলক হয়েছে!");
    setActivePreviewItem(null);
    setPreviewQuizCurrentQ(0);
    setPreviewQuizAnswers({});
    setPreviewConfirmedQs({});
  };

  return (
    <div className="space-y-6 pb-12 overflow-y-auto">
      {/* Top Main Banner & Segmented Studio Tabs */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-xl text-white">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider">
                UNIFIED ACADEMIC STUDIO
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold">
                PTSC Chapter & Class Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              📚 অধ্যায়ভিত্তিক কন্টেন্ট ও ক্লাস স্টুডিও
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              স্লাইড থেকে ব্লগ তৈরি, লেসন প্ল্যান জেনারেশন এবং সিকোয়েন্সিয়াল চ্যাপ্টার ও ব্লক
              পাথওয়ে ম্যানেজমেন্ট—সবকিছু একক প্রিমিয়াম প্ল্যাটফর্মে।
            </p>
          </div>

          {/* Sub-Tab Switcher Pills (Modern, High Contrast, Subtle Ring, No Spread-Out Glow) */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 dark:bg-slate-950/90 border border-slate-700/60 rounded-2xl backdrop-blur-md self-start lg:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveSubTab("builder")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/50 ${
                activeSubTab === "builder"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 ring-1 ring-white/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/50"
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>১. ব্লগ পাথওয়ে (Blog Pathway)</span>
            </button>

            <button
              onClick={() => setActiveSubTab("ai_prep")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                activeSubTab === "ai_prep"
                  ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white ring-1 ring-white/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/50"
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>২. স্লাইড ও লেসন প্ল্যান (Slide & Lesson Plan)</span>
            </button>

            <button
              onClick={() => setActiveSubTab("preview")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${
                activeSubTab === "preview"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 ring-1 ring-white/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/50"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>৩. সিকিউরিটি ও ফ্লো (Security & Flow)</span>
            </button>

            <button
              onClick={() => setActiveSubTab("template_gallery")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400/50 ${
                activeSubTab === "template_gallery"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white ring-1 ring-white/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/50"
              }`}
            >
              <Award className="w-4 h-4 text-purple-400" />
              <span>৪. কুইজ টেমপ্লেট গ্যালারি</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: CHAPTER & SEQUENTIAL BLOCK PATHWAY BUILDER                     */}
      {/* ========================================================================= */}
      {activeSubTab === "builder" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Filter and Course Selection Strip */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Class Filter */}
            <div className="md:col-span-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                শ্রেণি ফিল্টার (Class) *
              </label>
              <select
                value={filterClass}
                onChange={(e) => handleAdminClassChange(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {ACADEMIC_CLASSES.map((cls) => (
                  <option key={cls.id} value={cls.numericValue}>
                    {cls.nameBangla} {cls.hasTrade ? "(ট্রেড আছে)" : "(ট্রেড নেই)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Trade Filter */}
            <div className="md:col-span-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                ট্রেড ফিল্টার (Trade)
              </label>
              {!adminClassHasTrade ? (
                <div className="w-full p-2 bg-slate-100 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>ট্রেড প্রযোজ্য নয়</span>
                  </span>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">
                    ৬-৮ সাধারণ
                  </span>
                </div>
              ) : (
                <select
                  value={filterTrade}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterTrade(val);
                    const match = courses.find(
                      (c) =>
                        c.numericClass === filterClass &&
                        (val === "all" || c.tradeCode === val || c.code.includes(val))
                    );
                    if (match) setSelectedCourseId(match.id);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">সব ট্রেড ({adminApplicableTrades.length} টি ট্রেড)</option>
                  {adminApplicableTrades.map((tr) => (
                    <option key={tr.id} value={tr.code}>
                      {tr.nameBangla} ({tr.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Course Select Box */}
            <div className="md:col-span-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  সক্রিয় বিষয় / কোর্স নির্বাচন ({adminFilteredCourses.length} টি কোর্স পাওয়া গেছে)
                </label>
                <button
                  onClick={() => setShowCourseModal(true)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ নতুন কোর্স</span>
                </button>
              </div>
              <select
                value={selectedCourseId || ""}
                onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {adminFilteredCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.titleBangla} — {c.className} {c.tradeName ? `(${c.tradeName})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-bold">কোর্স ও অধ্যায় লোড হচ্ছে...</p>
            </div>
          ) : !selectedCourse ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">কোনো কোর্স পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500">নির্বাচিত শ্রেণি ও ট্রেডের জন্য একটি নতুন কোর্স তৈরি করুন।</p>
              <button
                onClick={() => setShowCourseModal(true)}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                কোর্স তৈরি করুন
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Course Banner */}
              <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 relative overflow-hidden shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950/90 border border-emerald-700/80 text-emerald-300 font-bold">
                        {selectedCourse.code}
                      </span>
                      <span>·</span>
                      <span>{selectedCourse.className}</span>
                      {selectedCourse.tradeName && (
                        <>
                          <span>·</span>
                          <span className="text-cyan-400 font-bold">{selectedCourse.tradeName}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="text-amber-400 font-bold">মোট {selectedCourse.totalXp} XP</span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                      {selectedCourse.titleBangla}
                    </h2>
                    <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                      {selectedCourse.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
                    <button
                      onClick={() => setActiveSubTab("ai_prep")}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-2 ring-1 ring-cyan-400/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 active:scale-95 transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>AI দিয়ে স্লাইড থেকে ব্লক বানান</span>
                    </button>
                    <button
                      onClick={openAddChapterModal}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 ring-1 ring-emerald-400/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 active:scale-95 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ নতুন অধ্যায় যোগ</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Chapters List */}
              {selectedCourse.chapters.length === 0 ? (
                <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 font-bold">এই কোর্সে এখনও কোনো অধ্যায় নেই।</p>
                  <button
                    onClick={openAddChapterModal}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  >
                    প্রথম অধ্যায় যোগ করুন
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedCourse.chapters
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((chapter, chapterIdx) => (
                      <div
                        key={chapter.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                      >
                        {/* Chapter Header */}
                        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-500/20">
                              {chapterIdx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span className="font-bold">অধ্যায় {chapter.chapterNumber}</span>
                                <span>·</span>
                                <span>{chapter.items.length} টি কনটেন্ট ব্লক</span>
                                <span>·</span>
                                <span className="text-emerald-600 dark:text-cyan-400 font-bold">
                                   {chapter.unlockRule === "PREVIOUS_COMPLETED"
                                    ? "🔒 পূর্ববর্তী অধ্যায় সম্পন্নে আনলক"
                                    : "তাৎক্ষণিক উন্মুক্ত"}
                                </span>
                              </div>
                              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                                {chapter.titleBangla}
                              </h3>
                            </div>
                          </div>

                          {/* Chapter Actions: Add Blog, Add Quiz, Edit Chapter, Delete Chapter */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => openAddItemModal(chapter.id, "BLOG_PART")}
                              className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                              <span>+ ব্লক পার্ট (Blog)</span>
                            </button>
                            <button
                              onClick={() => openAddItemModal(chapter.id, "QUIZ")}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                            >
                              <Award className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                              <span>+ চেকপয়েন্ট কুইজ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditChapterModal(chapter)}
                              className="px-3.5 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/80 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                              title="অধ্যায় তথ্য এডিট করুন"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                              <span>অধ্যায় এডিট ✏️</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteChapterModal(chapter.id, chapter.titleBangla)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                              title="অধ্যায় মুছুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Sequential Content Flow Items */}
                        <div className="p-4 sm:p-5 space-y-2.5">
                          {chapter.items.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                              এই অধ্যায়ে এখনও কোনো ব্লক পার্ট বা কুইজ নেই। উপরের বোতাম দিয়ে ব্লক পার্ট বা কুইজ যোগ করুন।
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-2 mb-1">
                                <span>সিকোয়েন্সিয়াল ফ্লো (Sequential Flow) — ক্রমানুসারে সাজানো ব্লকসমূহ</span>
                                <span>প্রোগ্রেসিভ লকিং ও অ্যাকশন</span>
                              </div>

                              {chapter.items
                                .sort((a, b) => a.orderIndex - b.orderIndex)
                                .map((item, itemIdx) => {
                                  const isQuiz = item.itemType === "QUIZ";
                                  const isDragging = draggedItemId === item.id;
                                  const isDragOver = draggedOverItemId === item.id;

                                  return (
                                    <div
                                      key={item.id}
                                      draggable
                                      onDragStart={() => handleDragStart(item.id, chapter.id)}
                                      onDragOver={(e) => handleDragOver(e, item.id)}
                                      onDrop={(e) => handleDrop(e, item.id, chapter.id)}
                                      className={`group relative rounded-2xl border transition-all duration-200 p-4 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                        isDragging
                                          ? "opacity-40 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[0.99]"
                                          : ""
                                      } ${
                                        isDragOver
                                          ? "border-cyan-500 ring-2 ring-cyan-500/30 bg-cyan-50/30 dark:bg-cyan-950/30 scale-[1.01]"
                                          : ""
                                      } ${
                                        isQuiz
                                          ? "border-l-4 border-l-emerald-500 bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700"
                                          : "border-l-4 border-l-indigo-500 bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700"
                                      } ${
                                        !item.isPublished
                                          ? "bg-slate-50/60 dark:bg-slate-900/50 opacity-60 border-dashed"
                                          : "shadow-xs hover:shadow-sm"
                                      }`}
                                    >
                                      {/* Left: Drag Handle, Sequence Badge, Type Icon, Metadata & Title */}
                                      <div className="flex items-start md:items-center gap-3.5 min-w-0 flex-1">
                                        {/* Drag handle */}
                                        <div
                                          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
                                          title="ড্র্যাগ করে ক্রম পরিবর্তন করুন (Drag to Reorder)"
                                        >
                                          <GripVertical className="w-4 h-4" />
                                        </div>

                                        {/* Order sequence badge */}
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-mono font-black flex items-center justify-center shrink-0">
                                          #{item.orderIndex}
                                        </div>

                                        {/* Content Type Graphic Icon */}
                                        <div
                                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                            isQuiz
                                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                                              : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25"
                                          }`}
                                        >
                                          {isQuiz ? (
                                            <Award className="w-5 h-5" />
                                          ) : (
                                            <BookOpen className="w-5 h-5" />
                                          )}
                                        </div>

                                        {/* Metadata & Title */}
                                        <div className="min-w-0 flex-1 space-y-1">
                                          <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                            {/* Type Badge */}
                                            <span
                                              className={`px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider border ${
                                                isQuiz
                                                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                                                  : "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60"
                                              }`}
                                            >
                                              {isQuiz
                                                ? `চেকপয়েন্ট কুইজ (${item.quizQuestions?.length || 0} টি প্রশ্ন)`
                                                : `ব্লক পার্ট ${item.blogPartNumber || itemIdx + 1}`}
                                            </span>

                                            {/* Read / Duration time */}
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                                              <Clock className="w-3 h-3 text-slate-400" />
                                              <span>{item.durationMinutes} মিনিট</span>
                                            </span>

                                            {/* XP Reward */}
                                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold flex items-center gap-1">
                                              <Zap className="w-3 h-3 text-amber-500" />
                                              <span>+{item.xpReward} XP</span>
                                            </span>

                                            {/* Passing Score (Quiz only) */}
                                            {isQuiz && (
                                              <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 font-medium flex items-center gap-1">
                                                <Target className="w-3 h-3 text-teal-500" />
                                                <span>পাস মার্ক: {item.passingScore || 70}%</span>
                                              </span>
                                            )}

                                            {/* Sequential lock rule */}
                                            {item.unlockRule === "PREVIOUS_ITEM_COMPLETED" && (
                                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                                                <Lock className="w-3 h-3 text-amber-500" />
                                                <span>পূর্ববর্তী ব্লক সাপেক্ষ (Locked 🔒)</span>
                                              </span>
                                            )}
                                          </div>

                                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {item.titleBangla}
                                          </h4>
                                        </div>
                                      </div>

                                      {/* Right: Step Move, Edit, and Delete */}
                                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 w-full md:w-auto justify-end">
                                        {/* Accessible Move Up / Move Down */}
                                        <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5">
                                          <button
                                            type="button"
                                            onClick={() => handleMoveStep(chapter.id, item.id, "up")}
                                            disabled={itemIdx === 0}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-20 cursor-pointer transition"
                                            title="উপরে নিন (Move Up)"
                                          >
                                            <ArrowUp className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleMoveStep(chapter.id, item.id, "down")}
                                            disabled={itemIdx === chapter.items.length - 1}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-20 cursor-pointer transition"
                                            title="নিচে নিন (Move Down)"
                                          >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                          </button>
                                        </div>

                                        {/* Edit Button */}
                                        <button
                                          type="button"
                                          onClick={() => openEditItemModal(chapter.id, item)}
                                          className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/80 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                                          title="ব্লক পার্ট এডিট ও আপডেট করুন (Edit)"
                                        >
                                          <Edit3 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                          <span>এডিট ✏️</span>
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                          type="button"
                                          onClick={() => openDeleteItemModal(item.id, item.titleBangla || item.title)}
                                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl cursor-pointer transition border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 focus:outline-none focus:ring-2 focus:ring-rose-400/40"
                                          title="আইটেম মুছুন"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: AI SLIDE TO BLOG & TEACHER LESSON PLAN GENERATOR               */}
      {/* ========================================================================= */}
      {activeSubTab === "ai_prep" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Controls Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <span>AI স্লাইড টু ব্লগ ও লেসন প্ল্যান জেনারেটর</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ভোকেশনাল পাওয়ারপয়েন্ট স্লাইড নির্বাচন করে ১-ক্লিকে রিচ ব্লগ এবং কুইজ সেট তৈরি করুন।
                </p>
              </div>

              {/* Quick Add to Chapter Button if package is ready */}
              {generatedPackage && (
                <button
                  onClick={handleAddAiPackageToChapter}
                  disabled={isAddingToChapter}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-1.5 ring-1 ring-emerald-300/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition active:scale-95 cursor-pointer"
                >
                  {isAddingToChapter ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Layers className="w-4 h-4" />
                  )}
                  <span>📥 সরাসরি এই অধ্যায়ে ব্লক হিসেবে যুক্ত করুন</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold">
              {/* Presentation select */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-slate-500">প্রেজেন্টেশন নির্বাচন করুন *</label>
                <select
                  value={selectedPresentationId}
                  onChange={(e) => handlePresentationChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  {AVAILABLE_PRESENTATIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.subject} · {p.totalSlides} স্লাইড)
                    </option>
                  ))}
                  <option value="custom">+ নতুন ফাইল আপলোড করুন (Custom PPTX)</option>
                </select>
              </div>

              {/* Slide Range */}
              <div className="space-y-1.5">
                <label className="text-slate-500">শুরু স্লাইড</label>
                <input
                  type="number"
                  min={1}
                  value={startSlide}
                  onChange={(e) => setStartSlide(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500">শেষ স্লাইড</label>
                <input
                  type="number"
                  min={1}
                  value={endSlide}
                  onChange={(e) => setEndSlide(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            {/* Custom file upload if custom is selected */}
            {isCustomUpload && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">
                      কারিগরি প্রেজেন্টেশন ফাইল (.pptx) নির্বাচন করুন
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {customPresentationTitle || "কোনো ফাইল নির্বাচিত হয়নি"}
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".pptx,.ppt,.pdf"
                  onChange={handleFileUpload}
                  className="text-xs"
                />
              </div>
            )}

            {/* Custom Teacher notes */}
            <div className="space-y-1.5 text-xs font-bold">
              <label className="text-slate-500">শিক্ষকের বিশেষ নির্দেশনা (ঐচ্ছিক)</label>
              <textarea
                rows={2}
                placeholder="যেমন: ওহমের সূত্রের গাণিতিক উদাহরণ ও সিরিজ সার্কিট সেফটি নিয়মে বেশি জোর দিন..."
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-normal text-xs leading-relaxed focus:outline-none"
              />
            </div>

            <button
              onClick={handleGenerateClassPackage}
              disabled={isGenerating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-black text-xs flex items-center justify-center gap-2 ring-1 ring-cyan-400/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 shadow-xs transition active:scale-[0.99] cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI স্লাইড প্রসেস করছে ও প্যাকেজ বানাচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>AI দিয়ে ৩-ইন-১ লেসন প্যাকেজ জেনারেট করুন</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Package Output Area */}
          {generatedPackage && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              {/* Output Sub-Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivePackageTab("summary")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      activePackageTab === "summary"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    ১. লেসন প্ল্যান ও সামারি
                  </button>
                  <button
                    onClick={() => setActivePackageTab("blog")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      activePackageTab === "blog"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    ২. স্লাইড টু রিচ ব্লগ
                  </button>
                  <button
                    onClick={() => setActivePackageTab("quiz")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      activePackageTab === "quiz"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    ৩. চেকপয়েন্ট কুইজ ({generatedPackage.quizSet.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddAiPackageToChapter}
                    disabled={isAddingToChapter}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    {isAddingToChapter ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>অধ্যায়ে ব্লক হিসেবে যুক্ত করুন</span>
                  </button>
                </div>
              </div>

              {/* View 1: Lesson Summary */}
              {activePackageTab === "summary" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50">
                    <span className="text-[10px] uppercase font-bold text-indigo-500 block">
                      পাঠের সারসংক্ষেপ (Overview)
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                      {generatedPackage.lessonSummary.briefOverview}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <GraduationCap className="w-4 h-4 text-emerald-500" />
                        <span>শিখনফল (Objectives)</span>
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                        {generatedPackage.lessonSummary.objectives.map((obj, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold shrink-0">•</span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        <span>সেফটি ও ব্যবহারিক টিপস</span>
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                        {generatedPackage.lessonSummary.safetyTips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-amber-700 dark:text-amber-300">
                            <span className="shrink-0">⚠</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* View 2: Slide to Blog */}
              {activePackageTab === "blog" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      ব্লগ পোস্ট: {generatedPackage.blogPost.title} ({generatedPackage.blogPost.estimatedReadMinutes} মিনিট পাঠ)
                    </span>
                    <button
                      onClick={() =>
                        setBlogEditMode((prev) => (prev === "preview" ? "edit" : "preview"))
                      }
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      {blogEditMode === "preview" ? "✏️ এডিট মোড" : "👁️ প্রিভিউ মোড"}
                    </button>
                  </div>

                  {blogEditMode === "edit" ? (
                    <textarea
                      rows={12}
                      value={editableMarkdown}
                      onChange={(e) => setEditableMarkdown(e.target.value)}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 font-mono text-xs leading-relaxed rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                  ) : (
                    <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <InternationalStoryLessonRenderer
                        markdown={editableMarkdown}
                        titleBangla={generatedPackage?.blogPost?.title}
                        summary={generatedPackage?.lessonSummary?.briefOverview}
                        keyTakeaways={generatedPackage?.lessonSummary?.keyConcepts}
                        durationMinutes={generatedPackage?.blogPost?.estimatedReadMinutes}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* View 3: Checkpoint Quiz */}
              {activePackageTab === "quiz" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {generatedPackage.quizSet.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                      >
                        <p className="font-black text-slate-900 dark:text-white">
                          {qIdx + 1}. {q.questionText}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-lg border ${
                                oIdx === q.correctAnswerIndex
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}. {opt}
                              {oIdx === q.correctAnswerIndex && " ✓"}
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200 dark:border-slate-700">
                            ব্যাখ্যা: {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: SEQUENTIAL BLOCK FLOW PREVIEW & ONE-BY-ONE QUIZ ARENA           */}
      {/* ========================================================================= */}
      {activeSubTab === "preview" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Header Strip with Subject & Class info */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-bold text-amber-500">🎮 লাইভ সিকোয়েন্সিয়াল ফ্লো</span>
                <span>·</span>
                <span>প্রোগ্রেসিভ লকিং ও স্টেপ কুইজ টেস্ট</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {selectedCourse?.titleBangla || "বিষয় নির্বাচন করুন"}
              </h3>
              <p className="text-xs text-slate-500">
                নিচের ব্লক পার্টগুলো ক্রমানুসারে সাজানো আছে। পূর্ববর্তী ব্লক বা কুইজ সম্পন্ন না করলে পরবর্তী ব্লক লক থাকবে।
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>স্ট্রিক: {previewStreak}x</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
                অর্জন: +{previewXpEarned} XP
              </div>
            </div>
          </div>

          {/* Chapters and Sequential Blocks Map */}
          {selectedCourse?.chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  অধ্যায় {chapter.chapterNumber}: {chapter.titleBangla}
                </h4>
                <span className="text-xs text-slate-500">
                  {chapter.items.length} টি ব্লক পার্ট ও কুইজ
                </span>
              </div>

              {/* Sequential Path Flow Nodes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {chapter.items
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((item, itemIdx) => {
                    const isCompleted = completedItemIds.includes(item.id);
                    const prevItem = chapter.items[itemIdx - 1];
                    const isLocked =
                      itemIdx > 0 &&
                      prevItem &&
                      !completedItemIds.includes(prevItem.id);

                    const isQuiz = item.itemType === "QUIZ";

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (isLocked) {
                            toast.warning(
                              "ধারাবাহিক নিয়ম অনুযায়ী পূর্ববর্তী ধাপ সম্পন্ন না করে সামনে যাওয়া যাবে না (Locked 🔒)"
                            );
                            return;
                          }
                          setActivePreviewItem(item);
                          setPreviewQuizCurrentQ(0);
                        }}
                        className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                          isLocked
                            ? "opacity-50 bg-slate-100 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-800 cursor-not-allowed"
                            : isCompleted
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/50 hover:border-emerald-500 cursor-pointer shadow-xs"
                            : "bg-white dark:bg-slate-900 border-indigo-500/40 ring-1 ring-indigo-500/20 hover:scale-[1.02] cursor-pointer shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                              isQuiz
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            }`}
                          >
                            {isQuiz ? "চেকপয়েন্ট কুইজ" : `ব্লক পার্ট ${item.blogPartNumber || itemIdx + 1}`}
                          </span>

                          {isCompleted ? (
                            <span className="text-emerald-500 flex items-center gap-1 text-[11px] font-bold">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>সম্পন্ন</span>
                            </span>
                          ) : isLocked ? (
                            <span className="text-slate-400 flex items-center gap-1 text-[11px] font-bold">
                              <Lock className="w-3.5 h-3.5" />
                              <span>লকড 🔒</span>
                            </span>
                          ) : (
                            <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 text-[11px] font-bold animate-pulse">
                              <Zap className="w-3.5 h-3.5" />
                              <span>উন্মুক্ত</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                            {item.titleBangla}
                          </h5>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                            <span>{item.durationMinutes} মিনিট</span>
                            <span>·</span>
                            <span className="text-amber-600 font-bold">+{item.xpReward} XP</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            isLocked
                              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                              : isCompleted
                              ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
                          }`}
                        >
                          {isLocked ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>লকড (পূর্ববর্তী ব্লক করুন)</span>
                            </>
                          ) : isCompleted ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>পুনরায় পড়ুন</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>{isQuiz ? "কুইজ শুরু করুন" : "পাঠটি পড়ুন"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}

          {/* Interactive Modal / Drawer for active preview item */}
          <AnimatePresence>
            {activePreviewItem && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase">
                        {activePreviewItem.itemType === "QUIZ" ? "কুইজ মূল্যায়ন" : "রিচ ব্লগ কনটেন্ট"}
                      </span>
                      <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                        {activePreviewItem.titleBangla}
                      </h3>
                    </div>
                    <button
                      onClick={() => setActivePreviewItem(null)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Render Blog Part View */}
                  {activePreviewItem.itemType === "BLOG_PART" ? (
                    <div className="space-y-4">
                      {activePreviewItem.summary && (
                        <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 text-xs text-slate-800 dark:text-slate-200">
                          <strong>💡 সারসংক্ষেপ:</strong> {activePreviewItem.summary}
                        </div>
                      )}

                      {activePreviewItem.keyTakeaways &&
                        activePreviewItem.keyTakeaways.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-500 uppercase">
                              মূল শিখন পয়েন্ট:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {activePreviewItem.keyTakeaways.map((k, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                                >
                                  ✓ {k}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        {activePreviewItem.contentMarkdown || "কোনো কনটেন্ট লেখা হয়নি।"}
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleCompletePreviewBlog(activePreviewItem.id)}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md cursor-pointer hover:scale-102 active:scale-95 transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>✅ পড়া শেষ - পরবর্তী চেকপয়েন্ট কুইজ আনলক করুন</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Render Checkpoint Quiz: One-by-One Question Flow with Immediate Feedback */
                    <div className="space-y-5">
                      {(() => {
                        const questions = activePreviewItem.quizQuestions || [];
                        const totalQ = questions.length;
                        const currentQ = questions[previewQuizCurrentQ];

                        if (!currentQ) {
                          return (
                            <div className="py-6 text-center text-xs text-slate-500">
                              এই কুইজে এখনও কোনো প্রশ্ন সংযুক্ত নেই।
                            </div>
                          );
                        }

                        const currentSelected = previewQuizAnswers[currentQ.id];
                        const isConfirmed = !!previewConfirmedQs[currentQ.id];

                        return (
                          <div className="space-y-4">
                            {/* Question Step Circles with Forward Locking */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500">
                                প্রশ্ন {previewQuizCurrentQ + 1} / {totalQ}
                              </span>
                              <div className="flex items-center gap-1">
                                {questions.map((q, qIdx) => {
                                  const isAns = previewConfirmedQs[q.id];
                                  const isCur = qIdx === previewQuizCurrentQ;
                                  const isLock = qIdx > previewQuizCurrentQ && !isAns;

                                  return (
                                    <div
                                      key={q.id || qIdx}
                                      className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center font-mono ${
                                        isCur
                                          ? "bg-indigo-600 text-white ring-2 ring-indigo-400"
                                          : isAns
                                          ? "bg-emerald-500 text-white"
                                          : isLock
                                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                          : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                      }`}
                                    >
                                      {isLock ? <Lock className="w-2.5 h-2.5" /> : qIdx + 1}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Question Card */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
                              <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                                {previewQuizCurrentQ + 1}. {currentQ.questionText}
                              </h4>

                              {/* Options List / Interactive Question Renderer */}
                              {currentQ.questionType && currentQ.questionType !== "MCQ" ? (
                                <UniversalQuestionRenderer
                                  question={currentQ}
                                  selectedAnswer={currentSelected}
                                  onSelectAnswer={(ans) => {
                                    handlePreviewSelectOption(
                                      currentQ.id,
                                      ans,
                                      currentQ.correctOptionIndex ?? 0,
                                      currentQ.explanation || ""
                                    );
                                  }}
                                  isConfirmed={isConfirmed}
                                  isCorrect={currentSelected === currentQ.correctOptionIndex}
                                  disabled={isConfirmed}
                                />
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {currentQ.options.map((option, oIdx) => {
                                    const isSelected = currentSelected === oIdx;
                                    const isCorrect = oIdx === currentQ.correctOptionIndex;

                                    let optStyle =
                                      "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400";

                                    if (isConfirmed) {
                                      if (isCorrect) {
                                        optStyle =
                                          "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/40";
                                      } else if (isSelected && !isCorrect) {
                                        optStyle =
                                          "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200 font-bold ring-2 ring-rose-500/40";
                                      } else {
                                        optStyle =
                                          "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60";
                                      }
                                    }

                                    return (
                                      <button
                                        key={oIdx}
                                        onClick={() =>
                                          handlePreviewSelectOption(
                                            currentQ.id,
                                            oIdx,
                                            currentQ.correctOptionIndex ?? 0,
                                            currentQ.explanation || ""
                                          )
                                        }
                                        disabled={isConfirmed}
                                        className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition flex items-center justify-between gap-2 ${
                                          !isConfirmed ? "cursor-pointer" : "cursor-default"
                                        } ${optStyle}`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                            {String.fromCharCode(65 + oIdx)}
                                          </span>
                                          <span>{option}</span>
                                        </div>

                                        {isConfirmed && (
                                          <span className="shrink-0 text-xs font-bold">
                                            {isCorrect ? (
                                              <span className="text-emerald-600 flex items-center gap-0.5">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>সঠিক</span>
                                              </span>
                                            ) : isSelected ? (
                                              <span className="text-rose-600 flex items-center gap-0.5">
                                                <XCircle className="w-4 h-4" />
                                                <span>ভুল</span>
                                              </span>
                                            ) : null}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Immediate Feedback Explanation Box */}
                              {isConfirmed && (
                                <div
                                  className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 animate-fade-in ${
                                    currentSelected === currentQ.correctOptionIndex
                                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 text-emerald-800 dark:text-emerald-200"
                                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-500/50 text-rose-800 dark:text-rose-200"
                                  }`}
                                >
                                  {currentSelected === currentQ.correctOptionIndex ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                  )}
                                  <div>
                                    <span className="font-black block">
                                      {currentSelected === currentQ.correctOptionIndex
                                        ? "🎉 চমৎকার! সঠিক উত্তর।"
                                        : `ভুল উত্তর। সঠিক উত্তর হলো: (${String.fromCharCode(
                                            65 + (currentQ.correctOptionIndex ?? 0)
                                          )}) ${currentQ.options ? currentQ.options[currentQ.correctOptionIndex ?? 0] : ""}`}
                                    </span>
                                    <span className="text-[11px] text-slate-600 dark:text-slate-300 block mt-0.5">
                                      💡 ব্যাখ্যা: {currentQ.explanation}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Stepper Navigation */}
                            <div className="flex items-center justify-between pt-2">
                              <button
                                onClick={() => setPreviewQuizCurrentQ((prev) => Math.max(0, prev - 1))}
                                disabled={previewQuizCurrentQ === 0}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>পূর্ববর্তী</span>
                              </button>

                              {previewQuizCurrentQ < totalQ - 1 ? (
                                <button
                                  onClick={() => {
                                    if (!isConfirmed) {
                                      toast.warning("পরবর্তী প্রশ্নে যেতে উত্তর নির্বাচন করুন (Locked 🔒)");
                                      return;
                                    }
                                    setPreviewQuizCurrentQ((prev) => prev + 1);
                                  }}
                                  disabled={!isConfirmed}
                                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <span>পরবর্তী প্রশ্নে যান</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCompletePreviewQuiz(activePreviewItem.id)}
                                  disabled={!isConfirmed}
                                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 disabled:opacity-40 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-102 active:scale-95 transition"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>কুইজ সম্পন্ন ও পরবর্তী ব্লক আনলক করুন</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: QUIZ TEMPLATE GALLERY (ADMIN-ONLY PREVIEW & AUDIT)             */}
      {/* ========================================================================= */}
      {activeSubTab === "template_gallery" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Studio Header */}
          <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  অ্যাডমিন-অনলি ডিজাইন স্টুডিও
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  (শিক্ষার্থীদের ইন্টারফেসে সম্পূর্ণ গোপন)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                ২০টি স্বতন্ত্র কুইজ টেমপ্লেট ও লাইভ থিম গ্যালারি
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                প্রতিটি টেমপ্লেট আলাদা লেআউট আইডেন্টিটি, টাইমার স্টাইল এবং কালারফুল ডার্ক ও লাইট মোড সমর্থন করে।
                ডেস্কটপ ও ট্যাবলেটে বাধ্যতামূলক ২×২ গ্রিড বজায় রেখে ডিজাইন করা হয়েছে।
              </p>
            </div>

            {/* Light / Dark Mode Toggle for Preview */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-800/90 rounded-2xl border border-slate-700/80 shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setGalleryPreviewTheme("light")}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  galleryPreviewTheme === "light"
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>☀️ Light Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setGalleryPreviewTheme("dark")}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  galleryPreviewTheme === "dark"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>🌙 Dark Mode</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Template Selector List (4 cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 max-h-[750px] overflow-y-auto">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>টেমপ্লেট তালিকা ({TWENTY_QUIZ_TEMPLATES.length} টি)</span>
                <span className="text-[10px] text-emerald-600 font-mono">2x2 Grid Standard</span>
              </div>

              {TWENTY_QUIZ_TEMPLATES.map((tmpl, idx) => {
                const isSelected = tmpl.id === selectedGalleryTemplateId;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedGalleryTemplateId(tmpl.id);
                      setGallerySelectedOption(null);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-md ring-2 ring-purple-500/20"
                        : "bg-slate-50/60 dark:bg-slate-850 border-slate-200/80 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl text-xs font-mono font-black flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {tmpl.nameBangla}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                          {tmpl.timerStyle}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug">
                        {tmpl.tagline}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Live Interactive Template Stage (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {(() => {
                const currentTmpl =
                  TWENTY_QUIZ_TEMPLATES.find((t) => t.id === selectedGalleryTemplateId) ||
                  TWENTY_QUIZ_TEMPLATES[0];

                const sampleQuestion = {
                  id: "sample_q1",
                  questionText:
                    "কম্পিউটার মাদারবোর্ডে মাইক্রোপ্রসেসর ও হাই-স্পিড মেমোরির মধ্যে ডেটা আদান-প্রদান নিয়ন্ত্রণ করে নিচের কোনটি?",
                  conceptTopic: "মাদারবোর্ড ও চিপসেট আর্কিটেকচার",
                  options: [
                    "নর্থব্রিজ (Northbridge) চিপসেট আর্কিটেকচার",
                    "সাউথব্রিজ (Southbridge) আই/ও কন্ট্রোলার",
                    "পাওয়ার সাপ্লাই ইউনিট (SMPS) রেগুলেটর",
                    "সিডি/ডিভিডি ড্রাইভ ইন্টারফেস কন্ট্রোলার",
                  ],
                  correctIndex: 0,
                  explanation:
                    "নর্থব্রিজ চিপসেট সিপিইউ, র্যা ম ও গ্রাফিক্স কার্ডের মতো দ্রুতগতির বাসের ডেটা আদান-প্রদান সরাসরি নিয়ন্ত্রণ করে।",
                };

                return (
                  <div
                    className={`rounded-3xl p-6 sm:p-8 transition-all border shadow-2xl ${
                      galleryPreviewTheme === "dark"
                        ? "dark bg-[#0a0f1d] border-slate-800 text-slate-100"
                        : "bg-slate-100 border-slate-300 text-slate-900"
                    }`}
                  >
                    {/* Live Preview Bar */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-300/60 dark:border-slate-800 mb-6 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>লাইভ প্রিভিউ স্টেজ: {currentTmpl.nameBangla}</span>
                      </div>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        {galleryPreviewTheme.toUpperCase()} MODE
                      </span>
                    </div>

                    {/* Template Canvas */}
                    <div className={`p-5 sm:p-7 transition-all ${currentTmpl.containerCard}`}>
                      {/* Question Header & Timer */}
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-current/20 mb-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase ${currentTmpl.badgeStyle}`}
                          >
                            প্রশ্ন ১ / ৫
                          </span>
                          <span className={`text-xs font-bold ${currentTmpl.headerAccent}`}>
                            বিষয়: {sampleQuestion.conceptTopic}
                          </span>
                        </div>

                        {/* Simulated Timer Badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-mono font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>30s CLOCK</span>
                        </div>
                      </div>

                      {/* Question Text */}
                      <h3 className="text-base sm:text-xl font-black leading-relaxed break-words mb-5">
                        {sampleQuestion.questionText}
                      </h3>

                      {/* 2x2 Option Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                        {sampleQuestion.options.map((optText, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isSelected = gallerySelectedOption === optIdx;
                          const isCorrect = optIdx === sampleQuestion.correctIndex;
                          const hasAnswered = gallerySelectedOption !== null;

                          let cardClass = currentTmpl.optionCardBase;
                          if (hasAnswered) {
                            if (isSelected) {
                              cardClass = isCorrect
                                ? currentTmpl.correctCard
                                : currentTmpl.incorrectCard;
                            } else if (isCorrect) {
                              cardClass = currentTmpl.correctCard;
                            } else {
                              cardClass += " opacity-40";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => setGallerySelectedOption(optIdx)}
                              className={`w-full min-h-[4rem] p-3.5 sm:p-4 rounded-2xl border text-left flex items-start justify-between gap-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${cardClass}`}
                            >
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <span
                                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${currentTmpl.optionLetterBadge}`}
                                >
                                  {letter}
                                </span>
                                <span className="leading-snug break-words text-wrap flex-1 pt-0.5">
                                  {optText}
                                </span>
                              </div>

                              {hasAnswered && isCorrect && (
                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </span>
                              )}
                              {hasAnswered && isSelected && !isCorrect && (
                                <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                                  <X className="w-3.5 h-3.5 stroke-[3]" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Simulated Feedback Banner */}
                      {gallerySelectedOption !== null && (
                        <div
                          className={`p-4 rounded-2xl border transition-all mt-5 space-y-1 ${currentTmpl.feedbackBanner}`}
                        >
                          <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                            {gallerySelectedOption === sampleQuestion.correctIndex ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>চমৎকার! আপনার উত্তরটি সঠিক হয়েছে।</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                <span>উত্তরটি ভুল হয়েছে। সঠিক উত্তরটি দেখে নিন।</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed opacity-90 pt-1 border-t border-current/20">
                            <strong>ব্যাখ্যা:</strong> {sampleQuestion.explanation}
                          </p>
                        </div>
                      )}

                      {/* Reset simulation button */}
                      <div className="pt-4 mt-4 border-t border-current/20 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-bold">
                          ক্লিক করে বিকল্প বেছে দেখুন (Interactive Test)
                        </span>
                        {gallerySelectedOption !== null && (
                          <button
                            type="button"
                            onClick={() => setGallerySelectedOption(null)}
                            className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold cursor-pointer hover:bg-slate-300"
                          >
                            পুনরায় নির্বাচন করুন 🔄
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Technical Specs Card */}
                    <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <div className="font-mono font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                        টেকনিক্যাল স্পেসিফিকেশন ও টোকেন মেটাডাটা
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 dark:text-slate-300">
                        <div>
                          <span className="text-slate-400 block text-[10px]">লেআউট ডিরেকশন:</span>
                          <span className="font-mono font-bold">{currentTmpl.layoutDirection}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">টাইমার স্টাইল:</span>
                          <span className="font-mono font-bold">{currentTmpl.timerStyle}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">অপশন ম্যাট্রিক্স:</span>
                          <span className="font-mono font-bold">2×2 MCQ Grid</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">স্টুডেন্ট এক্সপোজার:</span>
                          <span className="font-bold text-emerald-600">গোপন (Hidden 🔒)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: CREATE COURSE, CREATE CHAPTER, ADD ITEM                           */}
      {/* ========================================================================= */}
      {/* Create Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                নতুন কোর্স / বিষয় তৈরি করুন
              </h3>
              <button
                onClick={() => setShowCourseModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">কোর্সের কোড (যেমন: CRS-VOC-EE-901)</label>
                <input
                  type="text"
                  required
                  placeholder="CRS-VOC-EE-901"
                  value={newCourseForm.code}
                  onChange={(e) => setNewCourseForm({ ...newCourseForm, code: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">কোর্সের শিরোনাম (বাংলায়)</label>
                <input
                  type="text"
                  required
                  placeholder="ইলেকট্রিক্যাল সেফটি ও ওহমের সূত্র"
                  value={newCourseForm.titleBangla}
                  onChange={(e) =>
                    setNewCourseForm({ ...newCourseForm, titleBangla: e.target.value, title: e.target.value })
                  }
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">বিবরণ (Description)</label>
                <textarea
                  rows={2}
                  placeholder="এই কোর্সের মূল বিষয়বস্তু..."
                  value={newCourseForm.description}
                  onChange={(e) => setNewCourseForm({ ...newCourseForm, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs"
                >
                  তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Chapter Modal */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                {editingChapter ? "অধ্যায় এডিট ও আপডেট ✏️" : "নতুন অধ্যায় যোগ করুন"}
              </h3>
              <button
                onClick={() => {
                  setShowChapterModal(false);
                  setEditingChapter(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">অধ্যায়ের নাম (বাংলায়)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: অধ্যায় ১: বেসিক সার্কিট উপাদান"
                  value={newChapterForm.titleBangla}
                  onChange={(e) =>
                    setNewChapterForm({
                      ...newChapterForm,
                      titleBangla: e.target.value,
                      title: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">অধ্যায়ের সংক্ষিপ্ত বিবরণ</label>
                <textarea
                  rows={2}
                  placeholder="সার্কিটের মূল উপাদান ও ওহমের সূত্র..."
                  value={newChapterForm.description}
                  onChange={(e) =>
                    setNewChapterForm({ ...newChapterForm, description: e.target.value })
                  }
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowChapterModal(false);
                    setEditingChapter(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingChapter ? "অধ্যায় আপডেট করুন ✏️" : "অধ্যায় যোগ করুন"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal (Blog Part / Quiz) */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                {itemModalType === "BLOG_PART"
                  ? (editingItem ? "ব্লগ পার্ট এডিট ও আপডেট ✏️" : "নতুন ব্লগ পার্ট যোগ")
                  : (editingItem ? "চেকপয়েন্ট কুইজ এডিট ও আপডেট ✏️" : "নতুন চেকপয়েন্ট কুইজ যোগ")}
              </h3>
              <button
                onClick={() => {
                  setShowItemModal(false);
                  setEditingItem(null);
                  setEditingQuestionId(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs relative">
              {/* Premium Animated Loading Overlay */}
              {isUpdating && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center z-50 animate-in fade-in duration-200">
                  <div className="p-4 px-6 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3.5">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {editingItem ? "কনটেন্ট ও কুইজ প্রশ্ন আপডেট করা হচ্ছে..." : "নতুন কনটেন্ট সংরক্ষণ করা হচ্ছে..."}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        অনুগ্রহ করে অপেক্ষা করুন, ব্যাকগ্রাউন্ড প্রসেস সম্পন্ন হচ্ছে...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <fieldset disabled={isUpdating} className="space-y-4 border-0 p-0 m-0 disabled:opacity-60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-500">শিরোনাম (বাংলায়) *</label>
                  <input
                    type="text"
                    required
                    value={itemForm.titleBangla}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        titleBangla: e.target.value,
                        title: e.target.value,
                      })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500">আনুমানিক সময় (মিনিট)</label>
                  <input
                    type="number"
                    value={itemForm.durationMinutes}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500">XP রিওয়ার্ড পয়েন্ট</label>
                  <input
                    type="number"
                    value={itemForm.xpReward}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, xpReward: Number(e.target.value) })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              {itemModalType === "BLOG_PART" ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">সারসংক্ষেপ (Summary)</label>
                    <textarea
                      rows={2}
                      placeholder="পাঠের মূল পয়েন্ট..."
                      value={itemForm.summary}
                      onChange={(e) => setItemForm({ ...itemForm, summary: e.target.value })}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        মূল ব্লগ কনটেন্ট (Rich Text Editor)
                      </label>
                      <span className="text-[10px] text-indigo-500 font-semibold">
                        হেডিংস, বোল্ড, ইটালিক, হাইলাইট ও লিস্ট সমর্থনযোগ্য
                      </span>
                    </div>
                    <RichTextEditor
                      content={itemForm.contentMarkdown}
                      onChange={(html) =>
                        setItemForm({ ...itemForm, contentMarkdown: html })
                      }
                      placeholder="এখানে আকর্ষণীয় ও সুন্দরভাবে সাজানো পাঠ্য বিষয় লিখুন বা পেস্ট করুন..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        কুইজের প্রশ্নাবলি ({itemForm.quizQuestions.length} টি সংযুক্ত)
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        MCQ, সত্য/মিথ্যা, শূন্যস্থান ও মিলকরণ
                      </span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {itemForm.quizQuestions.map((q, idx) => {
                        const qType = q.questionType || "MCQ";
                        let answerPreview = "";
                        let typeBadgeLabel = "MCQ";
                        let badgeColor = "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300";

                        if (qType === "TRUE_FALSE") {
                          typeBadgeLabel = "সত্য / মিথ্যা";
                          badgeColor = "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300";
                          answerPreview = q.correctBoolean ? "সত্য (True)" : "মিথ্যা (False)";
                        } else if (qType === "FILL_BLANKS") {
                          typeBadgeLabel = "শূন্যস্থান পূরণ";
                          badgeColor = "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300";
                          answerPreview = (q.acceptedAnswers || []).join(", ") || (q.options || []).join(", ");
                        } else if (qType === "MATCHING") {
                          typeBadgeLabel = "বাম-ডান মিলকরণ";
                          badgeColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300";
                          answerPreview = `${(q.matchingPairs || []).length} টি জোড়া পেয়ার`;
                        } else if (qType === "REORDER") {
                          typeBadgeLabel = "সঠিক ক্রমে সাজানো";
                          badgeColor = "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300";
                          const orderList = q.correctOrder || q.options || [];
                          answerPreview = orderList.join(" ➔ ");
                        } else {
                          typeBadgeLabel = "MCQ";
                          badgeColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
                          answerPreview = q.options[q.correctOptionIndex] || "N/A";
                        }

                        return (
                          <div
                            key={q.id || idx}
                            className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2 shadow-2xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badgeColor}`}>
                                  {typeBadgeLabel}
                                </span>
                                <p className="font-bold text-slate-800 dark:text-white text-xs">
                                  {idx + 1}. {q.questionText}
                                </p>
                              </div>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                সঠিক উত্তর: {answerPreview}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditQuestionInQuiz(q)}
                                className="p-1 text-slate-400 hover:text-cyan-500 rounded-lg cursor-pointer transition"
                                title="প্রশ্ন এডিট করুন"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(q.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer transition"
                                title="প্রশ্ন মুছুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* New Question Form with Dynamic Type Switcher */}
                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 block text-[11px]">
                          {editingQuestionId ? "✏️ প্রশ্নটি সংশোধন / এডিট করুন" : "+ নতুন প্রশ্ন যোগ করুন"}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                          <span>ধরণ:</span>
                          <select
                            value={newQuestion.questionType}
                            onChange={(e) =>
                              setNewQuestion({
                                ...newQuestion,
                                questionType: e.target.value as QuizQuestionType,
                              })
                            }
                            className="p-1 px-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-indigo-600 dark:text-indigo-400 font-bold"
                          >
                            <option value="MCQ">বহুনির্বাচনী প্রশ্ন (MCQ)</option>
                            <option value="TRUE_FALSE">সত্য / মিথ্যা (True/False)</option>
                            <option value="FILL_BLANKS">শূন্যস্থান পূরণ (Fill in Blanks)</option>
                            <option value="MATCHING">বাম-ডান মিলকরণ (Matching Pairs)</option>
                            <option value="REORDER">সঠিক ক্রমে সাজানো (Reordering)</option>
                          </select>
                        </div>
                      </div>

                      {/* Question Text / Prompt (Hidden if Fill Blanks uses dedicated sentence textarea) */}
                      {newQuestion.questionType !== "FILL_BLANKS" && (
                        <input
                          type="text"
                          placeholder="প্রশ্নের মূল শিরোনাম / প্রশ্নটি লিখুন..."
                          value={newQuestion.questionText}
                          onChange={(e) =>
                            setNewQuestion({ ...newQuestion, questionText: e.target.value })
                          }
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                        />
                      )}

                      {/* 1. MCQ OPTIONS */}
                      {newQuestion.questionType === "MCQ" && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="অপশন A (বাধ্যতামূলক)"
                              value={newQuestion.optionA}
                              onChange={(e) =>
                                setNewQuestion({ ...newQuestion, optionA: e.target.value })
                              }
                              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                            />
                            <input
                              type="text"
                              placeholder="অপশন B (বাধ্যতামূলক)"
                              value={newQuestion.optionB}
                              onChange={(e) =>
                                setNewQuestion({ ...newQuestion, optionB: e.target.value })
                              }
                              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                            />
                            <input
                              type="text"
                              placeholder="অপশন C (ঐচ্ছিক)"
                              value={newQuestion.optionC}
                              onChange={(e) =>
                                setNewQuestion({ ...newQuestion, optionC: e.target.value })
                              }
                              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                            />
                            <input
                              type="text"
                              placeholder="অপশন D (ঐচ্ছিক)"
                              value={newQuestion.optionD}
                              onChange={(e) =>
                                setNewQuestion({ ...newQuestion, optionD: e.target.value })
                              }
                              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] font-bold text-slate-500 shrink-0">
                              সঠিক অপশন:
                            </label>
                            <select
                              value={newQuestion.correctOptionIndex}
                              onChange={(e) =>
                                setNewQuestion({
                                  ...newQuestion,
                                  correctOptionIndex: Number(e.target.value),
                                })
                              }
                              className="p-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400"
                            >
                              <option value={0}>অপশন A সঠিক</option>
                              <option value={1}>অপশন B সঠিক</option>
                              <option value={2}>অপশন C সঠিক</option>
                              <option value={3}>অপশন D সঠিক</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* 2. TRUE / FALSE OPTIONS (Simple Radio Toggle) */}
                      {newQuestion.questionType === "TRUE_FALSE" && (
                        <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              সঠিক উত্তর নির্বাচন করুন (Radio Toggle):
                            </label>
                            <span className="text-[10px] text-slate-500 font-medium">
                              একটি বিকল্প রেডিও সিলেক্ট করুন
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <label
                              onClick={() => setNewQuestion({ ...newQuestion, correctBoolean: true })}
                              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition select-none ${
                                newQuestion.correctBoolean
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="tfRadio"
                                checked={newQuestion.correctBoolean === true}
                                onChange={() => setNewQuestion({ ...newQuestion, correctBoolean: true })}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className={`w-4 h-4 ${newQuestion.correctBoolean ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                                <span className={`text-xs font-black ${newQuestion.correctBoolean ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"}`}>
                                  সত্য (True)
                                </span>
                              </div>
                            </label>

                            <label
                              onClick={() => setNewQuestion({ ...newQuestion, correctBoolean: false })}
                              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition select-none ${
                                !newQuestion.correctBoolean
                                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-xs"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="tfRadio"
                                checked={newQuestion.correctBoolean === false}
                                onChange={() => setNewQuestion({ ...newQuestion, correctBoolean: false })}
                                className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                              />
                              <div className="flex items-center gap-2">
                                <XCircle className={`w-4 h-4 ${!newQuestion.correctBoolean ? "text-rose-600 dark:text-rose-400" : "text-slate-400"}`} />
                                <span className={`text-xs font-black ${!newQuestion.correctBoolean ? "text-rose-700 dark:text-rose-300" : "text-slate-700 dark:text-slate-300"}`}>
                                  মিথ্যা (False)
                                </span>
                              </div>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* 3. FILL IN THE BLANKS (Sentence with Explicit Blanks & Accepted Answers) */}
                      {newQuestion.questionType === "FILL_BLANKS" && (
                        <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200/80 dark:border-purple-800/40 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              বাক্য লিখুন এবং শূন্যস্থানের স্থানে ব্র্যাকেটে [সঠিক উত্তর] দিন:
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setNewQuestion({
                                  ...newQuestion,
                                  questionText: (newQuestion.questionText || "") + " [সঠিক উত্তর]",
                                });
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold transition cursor-pointer"
                            >
                              + [ব্র্যাকেট ইনসার্ট]
                            </button>
                          </div>

                          <textarea
                            rows={3}
                            placeholder="যেমন: কম্পিউটারের মস্তিষ্ক হলো [CPU] এবং বিদ্যুৎ প্রবাহের একক [অ্যাম্পিয়ার]।"
                            value={newQuestion.questionText}
                            onChange={(e) =>
                              setNewQuestion({ ...newQuestion, questionText: e.target.value })
                            }
                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500/20"
                          />

                          {/* Live Sentence Preview with inline blanks */}
                          {newQuestion.questionText && (
                            <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-purple-200 dark:border-purple-900/50 text-xs text-slate-700 dark:text-slate-300">
                              <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block mb-1">
                                শিক্ষার্থীর ভিউ প্রিভিউ:
                              </span>
                              <div className="leading-relaxed">
                                {newQuestion.questionText.split(/(\[.*?\])/g).map((part, pIdx) => {
                                  if (part.startsWith("[") && part.endsWith("]")) {
                                    const blankWord = part.slice(1, -1);
                                    return (
                                      <span
                                        key={pIdx}
                                        className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200 rounded font-mono font-bold text-[11px]"
                                        title={`সঠিক উত্তর: ${blankWord}`}
                                      >
                                        ___ ({blankWord || "খালি"}) ___
                                      </span>
                                    );
                                  }
                                  return <span key={pIdx}>{part}</span>;
                                })}
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                              বিকল্প গ্রহণযোগ্য উত্তরসমূহ (কমা দিয়ে পৃথক করুন):
                            </label>
                            <input
                              type="text"
                              placeholder="যেমন: CPU, Central Processing Unit, সিপইউ"
                              value={newQuestion.acceptedAnswersText}
                              onChange={(e) =>
                                setNewQuestion({ ...newQuestion, acceptedAnswersText: e.target.value })
                              }
                              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                            />
                            <p className="text-[10px] text-slate-500">
                              * কেস-ইনসেনসিটিভ চেক: শিক্ষার্থী ছোট বা বড় হাতের অক্ষরে লিখলেও উত্তর গৃহীত হবে।
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 4. MATCHING PAIRS (Left & Right Items Inputted Directly) */}
                      {newQuestion.questionType === "MATCHING" && (
                        <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/90 dark:border-emerald-800/50 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <label className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                                  বাম-ডান মিলকরণ বিল্ডার (Left-Right Pair Builder):
                                </label>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold">
                                  {newQuestion.matchingPairs.length} টি জোড়া
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                সরাসরি সঠিক মিল জোড়া লিখুন (ডেটাবেজে JSON অ্যারে হিসেবে সেভ হবে এবং শিক্ষার্থীর জন্য ডান পাশ স্বয়ংক্রিয়ভাবে এলোমেলো হবে)
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setNewQuestion({
                                  ...newQuestion,
                                  matchingPairs: [
                                    ...newQuestion.matchingPairs,
                                    { left: "", right: "" },
                                  ],
                                })
                              }
                              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-xl shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ নতুন পেয়ার যোগ করুন</span>
                            </button>
                          </div>

                          {/* Column Headers */}
                          <div className="grid grid-cols-[20px_1fr_24px_1fr_28px] items-center gap-2 px-1 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            <span className="text-center">#</span>
                            <span>Left Side Item (বাম পাশ)</span>
                            <span className="text-center">ম্যাচ</span>
                            <span>Right Side Match (ডান পাশ)</span>
                            <span className="text-center">মুছুন</span>
                          </div>

                          {/* Dynamic Pair Rows */}
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {newQuestion.matchingPairs.map((pair, pIdx) => (
                              <div key={pIdx} className="grid grid-cols-[20px_1fr_24px_1fr_28px] items-center gap-2">
                                <span className="text-[11px] font-black text-slate-400 text-center">
                                  {pIdx + 1}.
                                </span>
                                <input
                                  type="text"
                                  placeholder="যেমন: ভোল্টমিটার / Apple"
                                  value={pair.left}
                                  onChange={(e) => {
                                    const updated = [...newQuestion.matchingPairs];
                                    updated[pIdx].left = e.target.value;
                                    setNewQuestion({ ...newQuestion, matchingPairs: updated });
                                  }}
                                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20"
                                />
                                <span className="text-emerald-500 font-bold text-center text-sm">⇄</span>
                                <input
                                  type="text"
                                  placeholder="যেমন: ভোল্টেজ পরিমাপক / Red"
                                  value={pair.right}
                                  onChange={(e) => {
                                    const updated = [...newQuestion.matchingPairs];
                                    updated[pIdx].right = e.target.value;
                                    setNewQuestion({ ...newQuestion, matchingPairs: updated });
                                  }}
                                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20"
                                />
                                <div className="flex items-center justify-center">
                                  {newQuestion.matchingPairs.length > 2 ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = newQuestion.matchingPairs.filter(
                                          (_, idx) => idx !== pIdx
                                        );
                                        setNewQuestion({ ...newQuestion, matchingPairs: updated });
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition"
                                      title="পেয়ার মুছুন"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-300 dark:text-slate-700 text-center" title="অন্তত ২টি পেয়ার প্রয়োজন">
                                      -
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 5. REORDERING (Teacher Inputs Items in CORRECT Sequence) */}
                      {newQuestion.questionType === "REORDER" && (
                        <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-200/80 dark:border-teal-800/40 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                সঠিক পর্যায়ক্রমিক তালিকা (Correct Sequence Order):
                              </label>
                              <span className="text-[10px] text-slate-500">
                                সঠিক ক্রমে (১, ২, ৩...) সাজিয়ে লিখুন। শিক্ষার্থীর সামনে এগুলো এলোমেলো থাকবে।
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setNewQuestion({
                                  ...newQuestion,
                                  reorderItems: [
                                    ...(newQuestion.reorderItems || []),
                                    `ধাপ ${(newQuestion.reorderItems?.length || 0) + 1}`,
                                  ],
                                })
                              }
                              className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer bg-teal-100/70 dark:bg-teal-900/40 px-2.5 py-1 rounded-lg"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ নতুন আইটেম যোগ করুন</span>
                            </button>
                          </div>

                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {(newQuestion.reorderItems || []).map((item, rIdx) => (
                              <div key={rIdx} className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-teal-200 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {rIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  placeholder={`ধাপ ${rIdx + 1} এর বিবরণ লিখুন...`}
                                  value={item}
                                  onChange={(e) => {
                                    const updated = [...(newQuestion.reorderItems || [])];
                                    updated[rIdx] = e.target.value;
                                    setNewQuestion({ ...newQuestion, reorderItems: updated });
                                  }}
                                  className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                                />
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    disabled={rIdx === 0}
                                    onClick={() => {
                                      if (rIdx === 0) return;
                                      const updated = [...newQuestion.reorderItems];
                                      const temp = updated[rIdx - 1];
                                      updated[rIdx - 1] = updated[rIdx];
                                      updated[rIdx] = temp;
                                      setNewQuestion({ ...newQuestion, reorderItems: updated });
                                    }}
                                    className="p-1 text-slate-400 hover:text-teal-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                                    title="উপরে নিন"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={rIdx === (newQuestion.reorderItems?.length || 0) - 1}
                                    onClick={() => {
                                      if (rIdx >= (newQuestion.reorderItems?.length || 0) - 1) return;
                                      const updated = [...newQuestion.reorderItems];
                                      const temp = updated[rIdx + 1];
                                      updated[rIdx + 1] = updated[rIdx];
                                      updated[rIdx] = temp;
                                      setNewQuestion({ ...newQuestion, reorderItems: updated });
                                    }}
                                    className="p-1 text-slate-400 hover:text-teal-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                                    title="নিচে নিন"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  {(newQuestion.reorderItems || []).length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = newQuestion.reorderItems.filter(
                                          (_, idx) => idx !== rIdx
                                        );
                                        setNewQuestion({ ...newQuestion, reorderItems: updated });
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                                      title="আইটেম মুছুন"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Explanation Input */}
                      <input
                        type="text"
                        placeholder="উত্তরের বিস্তারিত ব্যাখ্যা (অপশনাল)..."
                        value={newQuestion.explanation}
                        onChange={(e) =>
                          setNewQuestion({ ...newQuestion, explanation: e.target.value })
                        }
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isSavingQuestionItem}
                          onClick={handleAddQuestionToQuiz}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs active:scale-95 text-xs"
                        >
                          {isSavingQuestionItem ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          ) : editingQuestionId ? (
                            <Save className="w-3.5 h-3.5" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isSavingQuestionItem
                              ? "সংরক্ষণ হচ্ছে..."
                              : editingQuestionId
                              ? "প্রশ্ন আপডেট সংরক্ষণ"
                              : "প্রশ্নটি যোগ করুন"}
                          </span>
                        </button>
                        {editingQuestionId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuestionId(null);
                              setNewQuestion({
                                questionType: "MCQ",
                                questionText: "",
                                optionA: "",
                                optionB: "",
                                optionC: "",
                                optionD: "",
                                correctOptionIndex: 0,
                                correctBoolean: true,
                                acceptedAnswersText: "",
                                matchingPairs: [
                                  { left: "", right: "" },
                                  { left: "", right: "" },
                                ],
                                reorderItems: ["প্রথম ধাপ / উপাদান ১", "দ্বিতীয় ধাপ / উপাদান ২", "তৃতীয় ধাপ / উপাদান ৩"],
                                explanation: "",
                              });
                            }}
                            className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
                          >
                            বাতিল
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              </fieldset>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => {
                    setShowItemModal(false);
                    setEditingItem(null);
                    setEditingQuestionId(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-2 transition active:scale-95"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{editingItem ? "আপডেট সংরক্ষণ করা হচ্ছে..." : "সংরক্ষণ হচ্ছে..."}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingItem ? "আপডেট সংরক্ষণ করুন ✏️" : "ব্লক যোগ করুন"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Animated Delete Confirmation Modal (Replaces all native confirm() dialogs) */}
      <DeleteConfirmationModal
        isOpen={deleteModalState.isOpen}
        onClose={() =>
          setDeleteModalState((prev) => ({ ...prev, isOpen: false, id: null }))
        }
        onConfirm={handleExecuteDelete}
        title={deleteModalState.title}
        description={deleteModalState.description}
        itemName={deleteModalState.itemName}
        isDeleting={isDeletingEntity}
      />
    </div>
  );
}
