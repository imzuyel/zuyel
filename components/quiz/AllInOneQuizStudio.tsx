"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ClipboardPaste,
  Edit3,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Check,
  Share2,
  ArrowUp,
  ArrowDown,
  Copy,
  AlertTriangle,
  BookOpen,
  Award,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle,
  X,
  Radio,
  CheckSquare,
  FileText,
  Sliders,
  Send,
  Save,
  Trophy,
} from "lucide-react";
import { useQuizStudio, QuizStudioProvider, StudioQuestionItem } from "@/components/quiz/QuizStudioContext";
import AcademyClassTradeSelector from "@/components/common/AcademyClassTradeSelector";
import { saveCustomLessonQuiz, StudentQuizQuestion } from "@/lib/studentIntelligenceStore";
import { useGlobalAcademic } from "@/context/GlobalAcademicContext";

// Demo text sets for instant 1-click test fill
const SAMPLE_DEMOS = [
  {
    label: "ডেমো ১: কারিগরি MCQ (ইলেকট্রিক্যাল)",
    text: `1. ওহমের সূত্র (Ohm's Law) অনুযায়ী গাণিতিক সমীকরণ কোনটি?
A) V = IR
B) P = VI
C) I = VR
D) R = VI
Correct: A
Explanation: নির্দিষ্ট তাপমাত্রায় পরিবাহীর বিভব পার্থক্য কারেন্ট ও রেজিস্ট্যান্সের গুণফলের সমান (V = IR)।
Topic: ওহমের সূত্র

2. কোন যন্ত্রের সাহায্যে বৈদ্যুতিক লাইনের ভোল্টেজ পরিমাপ করা হয়?
A) অ্যামিটার (Ammeter)
B) ভোল্টমিটার (Voltmeter)
C) ওহমমিটার (Ohmmeter)
D) ওয়াটমিটার (Wattmeter)
Correct: B
Explanation: সার্কিটের দুই বিন্দুর বিভব পার্থক্য পরিমাপে ভোল্টমিটার সর্বদা প্যারালালে সংযোগ করা হয়।
Topic: পরিমাপক যন্ত্র

3. বৈদ্যুতিক আর্থিংয়ের (Earthing) প্রধান উদ্দেশ্য কী?
A) বিদ্যুৎ সাশ্রয় করা
B) লাইন ভোল্টেজ বাড়ানো
C) মানবদেহ ও যন্ত্রপাতিকে বৈদ্যুতিক শক থেকে রক্ষা করা
D) কারেন্ট প্রবাহ বন্ধ করা
Correct: C
Explanation: আর্থিং লিকেজ কারেন্টকে নিরাপদে মাটিতে পাঠিয়ে শক ও অগ্নিকাণ্ড রোধ করে।
Topic: সেফটি রুলস`,
  },
  {
    label: "ডেমো ২: মিশ্র প্রশ্ন (MCQ, শূন্যস্থান, মিলকরণ, সত্য/মিথ্যা)",
    text: `1. কম্পিউটার নেটওয়ার্কে IPv4 এড্রেস কত বিটের হয়ে থাকে?
A) ১৬ বিট
B) ৩২ বিট
C) ৬৪ বিট
D) ১২৮ বিট
Correct: B
Explanation: IPv4 এড্রেস ৩২ বিটের হয়ে থাকে যা চারটি ৮-বিট অক্টেটে বিভক্ত।
Topic: কম্পিউটার নেটওয়ার্ক

2. ওহমের সূত্র অনুযায়ী কারেন্ট (I) হলো ভোল্টেজ (V) এবং রেজিস্ট্যান্সের (R) ভাগফল, অর্থাৎ I = _______।
Answer: V/R, V / R
Explanation: I = V/R সমীকরণের মাধ্যমে সার্কিটের কারেন্ট হিসাব করা হয়।
Topic: ওহমের সূত্র

3. নিচের বাম পাশের উপাদানের সাথে ডান পাশের সঠিক একক মিল করুন:
- ভোল্টেজ (Voltage) -> ভোল্ট (Volt)
- কারেন্ট (Current) -> অ্যাম্পিয়ার (Ampere)
- রেজিস্ট্যান্স (Resistance) -> ওহম (Ohm)
- বৈদ্যুতিক ক্ষমতা (Power) -> ওয়াট (Watt)
Explanation: এসআই (SI) পদ্ধতিতে কারিগরি ভৌত রাশির সঠিক এককসমূহ।
Topic: ইলেকট্রিক্যাল একক

4. এসি (AC) কারেন্টের প্রবাহের দিক সময়ের সাথে সাথে পরিবর্তিত হয়। (True/False)
Answer: True
Explanation: অল্টারনেটিং কারেন্ট প্রতি অর্ধ-সাইকেলে এর পোলারিটি ও দিক পরিবর্তন করে।
Topic: এসি কারেন্ট`,
  },
  {
    label: "ডেমো ৩: কম্পিউটার ও আইওটি কুইজ",
    text: `1. আইওটি (IoT) এর পূর্ণরূপ কোনটি?
A) Internet of Things
B) Input Output Technology
C) Internal Operating Tool
D) Internet of Telephony
Correct: A
Explanation: IoT বিশ্বব্যাপী সংযুক্ত ডিভাইসগুলোর স্বয়ংক্রিয় যোগাযোগ নেটওয়ার্ক।
Topic: আইওটি প্রযুক্তি

2. আরডুইনো (Arduino) ইউএনও বোর্ডে সাধারণত কোন মাইক্রোকন্ট্রোলার ব্যবহৃত হয়?
A) ATmega328P
B) Intel 8086
C) PIC16F877A
D) ESP8266
Correct: A
Explanation: Arduino Uno বোর্ডে ৮-বিট AVR মাইক্রোকন্ট্রোলার ATmega328P ব্যবহৃত হয়।
Topic: মাইক্রোকন্ট্রোলার`,
  },
];

interface AllInOneQuizStudioProps {
  onQuizPublished?: (quizId: string) => void;
  defaultClassId?: string;
  defaultTradeId?: string;
}

function AllInOneQuizStudioInner({
  onQuizPublished,
  defaultClassId = "class-9",
  defaultTradeId = "Electrical",
}: AllInOneQuizStudioProps) {
  const { draftQuestions, setDraftQuestions, clearDraftQuestions } = useQuizStudio();

  // Active Creation Tab:
  // "prompt" = (ক) ✨ AI প্রম্পট জেনারেটর
  // "paste_import" = (খ) 📋 AI টেক্সট ইম্পোর্ট (Copy-Paste)
  // "manual" = (গ) ✍️ ম্যানুয়ালি যোগ
  const [activeTab, setActiveTab] = useState<"prompt" | "paste_import" | "manual">("paste_import");

  const { selectedClass: globalClass, selectedTrade: globalTrade } = useGlobalAcademic();

  // Global Quiz Metadata
  const [quizTitle, setQuizTitle] = useState("কারিগরি ও একাডেমিক মূল্যায়ন কুইজ");
  const [selectedClass, setSelectedClass] = useState(defaultClassId);
  const [selectedTrade, setSelectedTrade] = useState(defaultTradeId);
  const [quizCategory, setQuizCategory] = useState("Practice");
  const [defaultMarks, setDefaultMarks] = useState<number>(2);
  const [defaultTime, setDefaultTime] = useState<number>(30);

  // Sync with global academic filter
  useEffect(() => {
    if (globalClass) {
      setSelectedClass(globalClass);
    }
  }, [globalClass]);

  useEffect(() => {
    if (globalTrade && globalTrade !== "all") {
      setSelectedTrade(globalTrade);
    }
  }, [globalTrade]);

  // Tab (ক) AI Prompt Generator State
  const [promptTopic, setPromptTopic] = useState("");
  const [promptQuestionCount, setPromptQuestionCount] = useState<number>(5);
  const [promptDifficulty, setPromptDifficulty] = useState<"Easy" | "Medium" | "Hard" | "Mixed">("Mixed");
  const [promptQuestionType, setPromptQuestionType] = useState<string>("mixed");
  const [promptCustomInstructions, setPromptCustomInstructions] = useState("");
  const [isPromptGenerating, setIsPromptGenerating] = useState(false);

  // Tab (খ) AI Text Import (Copy-Paste) State
  const [rawText, setRawText] = useState("");
  const [isParsingText, setIsParsingText] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Tab (গ) Manual Question Creator Form State
  const [manualType, setManualType] = useState<"mcq_single" | "mcq_multiple" | "true_false" | "fill_blank" | "matching" | "short_answer">("mcq_single");
  const [manualQuestionText, setManualQuestionText] = useState("");
  const [manualOptions, setManualOptions] = useState<string[]>([
    "অপশন ক (বিকল্প ১)",
    "অপশন খ (বিকল্প ২)",
    "অপশন গ (বিকল্প ৩)",
    "অপশন ঘ (বিকল্প ৪)",
  ]);
  const [manualCorrectIndex, setManualCorrectIndex] = useState<number>(0);
  const [manualCorrectIndices, setManualCorrectIndices] = useState<number[]>([0]);
  const [manualTfCorrect, setManualTfCorrect] = useState<boolean>(true);
  const [manualAcceptedAnswers, setManualAcceptedAnswers] = useState("সঠিক উত্তর");
  const [manualPairs, setManualPairs] = useState<{ left: string; right: string }[]>([
    { left: "বাম পাশ ১", right: "ডান পাশ ১" },
    { left: "বাম পাশ ২", right: "ডান পাশ ২" },
  ]);
  const [manualShortKeyword, setManualShortKeyword] = useState("");
  const [manualMarks, setManualMarks] = useState<number>(2);
  const [manualTime, setManualTime] = useState<number>(30);
  const [manualTopic, setManualTopic] = useState("");
  const [manualExplanation, setManualExplanation] = useState("");

  // Right Panel Editing & Publishing State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedQuizId, setPublishedQuizId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // ----------------------------------------------------------------------
  // HANDLER: (ক) AI Prompt Generator -> Appends to draftQuestions
  // ----------------------------------------------------------------------
  const handleGenerateFromPrompt = async () => {
    if (!promptTopic.trim()) {
      showToast("দয়া করে কুইজের টপিক বা অধ্যায়ের নাম লিখুন।", "error");
      return;
    }

    setIsPromptGenerating(true);
    try {
      const response = await fetch("/api/ai/quiz-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: promptTopic.trim(),
          trade: selectedTrade,
          gradeLevel: selectedClass,
          questionCount: promptQuestionCount,
          difficulty: promptDifficulty,
          questionType: promptQuestionType,
          customInstructions: promptCustomInstructions.trim(),
          language: "Bangla",
        }),
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        // Sanitize & map into consistent StudioQuestionItem format
        const newQuestions: StudioQuestionItem[] = data.questions.map((q: any, idx: number) => ({
          id: `ai-gen-${Date.now()}-${idx + 1}`,
          type: q.type || (promptQuestionType === "mixed" ? "mcq_single" : promptQuestionType),
          questionText: q.question || q.questionText || `প্রশ্ন ${draftQuestions.length + idx + 1}`,
          options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
          correctAnswer: typeof q.correctAnswer === "number" || typeof q.correctAnswer === "boolean" ? q.correctAnswer : 0,
          correctIndices: Array.isArray(q.correctIndices) ? q.correctIndices : undefined,
          acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : undefined,
          pairs: Array.isArray(q.pairs) ? q.pairs : undefined,
          explanation: q.explanation || "সঠিক উত্তরটি যাচাই করা হয়েছে।",
          conceptTopic: q.topic || promptTopic.trim() || selectedTrade,
          marks: Number(q.marks || q.points) || defaultMarks,
          timeLimit: Number(q.timeLimit) || defaultTime,
        }));

        // CRITICAL RULE: Append to draftQuestions, NEVER overwrite!
        setDraftQuestions((prev) => [...prev, ...newQuestions]);
        showToast(`🎉 এআই সফলভাবে ${newQuestions.length}টি প্রশ্ন তৈরি করেছে এবং ড্রাফট তালিকায় যুক্ত হয়েছে!`);
      } else {
        throw new Error(data.message || "এআই প্রশ্ন তৈরি করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
      }
    } catch (err: any) {
      console.error("AI Generation error:", err);
      showToast(err.message || "প্রশ্ন তৈরিতে সমস্যা দেখা দিয়েছে।", "error");
    } finally {
      setIsPromptGenerating(false);
    }
  };

  // ----------------------------------------------------------------------
  // HANDLER: (খ) AI Text Import (Copy-Paste) -> Appends to draftQuestions
  // ----------------------------------------------------------------------
  const handleParseAndAppendRawText = async () => {
    if (!rawText.trim()) {
      setParseError("দয়া করে টেক্সট বক্সে অন্য AI থেকে কপি করা প্রশ্ন পেস্ট করুন।");
      return;
    }

    setParseError(null);
    setIsParsingText(true);

    try {
      const response = await fetch("/api/ai/parse-quiz-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: rawText.trim(),
          trade: selectedTrade,
          classLevel: selectedClass,
        }),
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        // CRITICAL RULE: Append to draftQuestions, NEVER overwrite!
        setDraftQuestions((prev) => [...prev, ...data.questions]);
        showToast(`📋 সফলভাবে ${data.questions.length}টি প্রশ্ন পার্স করে ড্রাফট তালিকায় যুক্ত করা হয়েছে!`);
        setRawText(""); // Clear text area on success
      } else {
        throw new Error(data.message || "প্রশ্ন পার্স করা সম্ভব হয়নি। টেক্সট ফরম্যাটটি যাচাই করুন।");
      }
    } catch (err: any) {
      console.error("Quiz parsing error:", err);
      setParseError(err.message || "সার্ভার বা পার্সিং সমস্যা দেখা দিয়েছে।");
      showToast(err.message || "পার্সিং সমস্যা দেখা দিয়েছে।", "error");
    } finally {
      setIsParsingText(false);
    }
  };

  // ----------------------------------------------------------------------
  // HANDLER: (গ) Manual Question Addition -> Appends to draftQuestions
  // ----------------------------------------------------------------------
  const handleAddManualQuestion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!manualQuestionText.trim()) {
      showToast("প্রশ্নের বিবরণ খালি রাখা যাবে না।", "error");
      return;
    }

    if (manualType === "mcq_single" || manualType === "mcq_multiple") {
      const validOptions = manualOptions.filter((opt) => opt.trim().length > 0);
      if (validOptions.length < 2) {
        showToast("MCQ প্রশ্নের জন্য কমপক্ষে ২টি অপশন প্রদান করুন।", "error");
        return;
      }
    }

    if (manualType === "matching") {
      const validPairs = manualPairs.filter((p) => p.left.trim() && p.right.trim());
      if (validPairs.length < 2) {
        showToast("মিলকরণের জন্য কমপক্ষে ২টি সম্পূর্ণ জোড়া তৈরি করুন।", "error");
        return;
      }
    }

    // Construct the clean new question
    const newQuestion: StudioQuestionItem = {
      id: `manual-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: manualType,
      questionText: manualQuestionText.trim(),
      options:
        manualType === "mcq_single" || manualType === "mcq_multiple"
          ? manualOptions.filter((opt) => opt.trim().length > 0)
          : undefined,
      correctAnswer: manualType === "true_false" ? manualTfCorrect : manualCorrectIndex,
      correctIndices: manualType === "mcq_multiple" ? manualCorrectIndices : undefined,
      acceptedAnswers:
        manualType === "fill_blank"
          ? manualAcceptedAnswers
              .split(/[,;|]+/)
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      pairs:
        manualType === "matching"
          ? manualPairs.filter((p) => p.left.trim() && p.right.trim())
          : undefined,
      explanation: manualExplanation.trim() || "সঠিক উত্তরটি শিক্ষক কর্তৃক যাচাইকৃত।",
      conceptTopic: manualTopic.trim() || selectedTrade || "সাধারণ কারিগরি জ্ঞান",
      marks: Number(manualMarks) || defaultMarks,
      timeLimit: Number(manualTime) || defaultTime,
    };

    // CRITICAL RULE: Append to draftQuestions, NEVER overwrite!
    setDraftQuestions((prev) => [...prev, newQuestion]);
    showToast(`✍️ নতুন প্রশ্নটি (#${draftQuestions.length + 1}) ড্রাফট তালিকায় যুক্ত হয়েছে!`);

    // Reset manual form fields for the next question
    setManualQuestionText("");
    setManualExplanation("");
    setManualOptions([
      "অপশন ক (বিকল্প ১)",
      "অপশন খ (বিকল্প ২)",
      "অপশন গ (বিকল্প ৩)",
      "অপশন ঘ (বিকল্প ৪)",
    ]);
    setManualCorrectIndex(0);
    setManualCorrectIndices([0]);
    setManualTfCorrect(true);
    setManualAcceptedAnswers("সঠিক উত্তর");
    setManualPairs([
      { left: "বাম পাশ ১", right: "ডান পাশ ১" },
      { left: "বাম পাশ ২", right: "ডান পাশ ২" },
    ]);
  };

  // ----------------------------------------------------------------------
  // DRAFT LIST ACTIONS: Reorder, Duplicate, Edit, Delete
  // ----------------------------------------------------------------------
  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === draftQuestions.length - 1)
    ) {
      return;
    }
    const updated = [...draftQuestions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setDraftQuestions(updated);
  };

  const handleDuplicateQuestion = (id: string) => {
    const target = draftQuestions.find((q) => q.id === id);
    if (!target) return;
    const duplicated: StudioQuestionItem = {
      ...target,
      id: `copy-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      questionText: `${target.questionText} (কপি)`,
    };
    const index = draftQuestions.findIndex((q) => q.id === id);
    const updated = [...draftQuestions];
    updated.splice(index + 1, 0, duplicated);
    setDraftQuestions(updated);
    showToast("প্রশ্নটি ডুপ্লিকেট করা হয়েছে।");
  };

  const handleDeleteQuestion = (id: string) => {
    setDraftQuestions((prev) => prev.filter((q) => q.id !== id));
    if (editingQuestionId === id) setEditingQuestionId(null);
    showToast("প্রশ্নটি ড্রাফট তালিকা থেকে মুছে ফেলা হয়েছে।");
  };

  const handleUpdateDraftQuestion = (id: string, updates: Partial<StudioQuestionItem>) => {
    setDraftQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  // ----------------------------------------------------------------------
  // PUBLISH HANDLER: Persists to /api/quizzes and student intelligence hub
  // ----------------------------------------------------------------------
  const handlePublishQuiz = async () => {
    if (draftQuestions.length === 0) {
      showToast("কুইজ প্রকাশ করতে কমপক্ষে একটি প্রশ্ন ড্রাফট তালিকায় থাকতে হবে।", "error");
      return;
    }

    setIsPublishing(true);
    try {
      const generatedQuizId = `quiz-${Date.now()}`;

      // Formatted institutional questions
      const formattedQuestions = draftQuestions.map((q, idx) => ({
        id: `qq-${Date.now()}-${idx}`,
        questionText: q.questionText,
        type: q.type,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        correctIndices: q.correctIndices,
        acceptedAnswers: q.acceptedAnswers,
        pairs: q.pairs,
        explanation: q.explanation,
        marks: q.marks || defaultMarks,
        timeLimit: q.timeLimit || defaultTime,
        conceptTopic: q.conceptTopic || selectedTrade,
      }));

      // Post to institutional quiz database
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizTitle.trim() || "কারিগরি অনলাইন কুইজ",
          description: `${selectedClass} ও ${selectedTrade} এর জন্য স্বয়ংক্রিয় এআই ও ম্যানুয়াল প্রক্রিয়ায় প্রণীত কুইজ।`,
          mode: "academic",
          category: quizCategory,
          subjectId: 1,
          classId: selectedClass === "class-9" ? 4 : selectedClass === "class-10" ? 5 : 6,
          tradeId: selectedTrade === "Electrical" ? 1 : selectedTrade === "Computer" ? 2 : 3,
          academicYearId: 2026,
          defaultMarks: defaultMarks,
          defaultQuestionTime: defaultTime,
          publish: true,
          questions: formattedQuestions,
        }),
      });

      const resData = await res.json();
      const actualQuizId = resData.quiz?.id || generatedQuizId;

      // Also persist to Student Practice Store
      const studentPracticeQuestions: StudentQuizQuestion[] = draftQuestions.map((q, idx) => ({
        id: `sq-${actualQuizId}-${idx}`,
        questionText: q.questionText,
        options: q.options && q.options.length > 0 ? q.options : ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"],
        correctAnswerIndex: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
        explanation: q.explanation || "সঠিক উত্তরটি যাচাই করা হয়েছে।",
        conceptTopic: q.conceptTopic || selectedTrade,
      }));

      saveCustomLessonQuiz(actualQuizId, studentPracticeQuestions);

      // Notify window listeners
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ptsc_quiz_published", { detail: { quizId: actualQuizId } }));
      }

      setPublishedQuizId(actualQuizId);
      showToast("🎉 কুইজ সফলভাবে সংরক্ষিত ও প্রকাশিত হয়েছে!");

      if (onQuizPublished) {
        onQuizPublished(actualQuizId);
      }
    } catch (err: any) {
      console.error("Failed to publish quiz:", err);
      showToast("কুইজ সংরক্ষণ করতে সমস্যা হয়েছে: " + err.message, "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyLobbyLink = () => {
    if (typeof window === "undefined" || !publishedQuizId) return;
    const link = `${window.location.origin}/quiz/lobby?id=${publishedQuizId}`;
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Canvas Calculations
  const totalMarks = draftQuestions.reduce((sum, q) => sum + (Number(q.marks) || defaultMarks), 0);
  const totalMinutes = Math.ceil(
    draftQuestions.reduce((sum, q) => sum + (Number(q.timeLimit) || defaultTime), 0) / 60
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in font-sans">
      {/* Toast Feedback Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-bounce-in">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-black flex items-center gap-3 backdrop-blur-md ${
              feedbackToast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-500/20"
                : "bg-rose-950/90 border-rose-500/50 text-rose-200 shadow-rose-500/20"
            }`}
          >
            {feedbackToast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="flex-1">{feedbackToast.message}</span>
            <button
              onClick={() => setFeedbackToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          HERO BANNER & WORKSPACE HEADER
         ======================================================== */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                ALL-IN-ONE QUIZ CREATION STUDIO
              </span>
              <span className="text-xs text-indigo-300 font-mono">
                Persistent Draft Canvas Engine
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-2.5">
              <Layers className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
              <span>সার্বজনীন এআই কুইজ ক্রিয়েটর ও ড্রাফট স্টুডিও</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              তিনটি শক্তিশালী উপায়: এআই দিয়ে সরাসরি তৈরি করুন, ChatGPT/Gemini থেকে কপি-পেস্ট করে পার্স করুন, অথবা নিজের হাতে নতুন প্রশ্ন লিখুন। আপনার তৈরি করা সমস্ত প্রশ্ন ডান পাশের ড্রাফট তালিকায় স্বয়ংক্রিয়ভাবে সংরক্ষিত ও যুক্ত থাকবে।
            </p>
          </div>

          {/* Quick Metrics & CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center">
              <div className="text-[10px] text-cyan-300 uppercase font-black">মোট প্রশ্ন</div>
              <div className="text-lg font-black text-white">{draftQuestions.length}টি</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center">
              <div className="text-[10px] text-emerald-300 uppercase font-black">মোট নম্বর</div>
              <div className="text-lg font-black text-white">{totalMarks}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center">
              <div className="text-[10px] text-purple-300 uppercase font-black">সময়সীমা</div>
              <div className="text-lg font-black text-white">~{totalMinutes} মিনিট</div>
            </div>

            <button
              onClick={handlePublishQuiz}
              disabled={isPublishing || draftQuestions.length === 0}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-95"
            >
              {isPublishing ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>পাবলিশ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>কুইজ পাবলিশ করুন ({draftQuestions.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          THREE CREATION TABS (ক), (খ), (গ)
         ======================================================== */}
      <div className="bg-slate-900/90 rounded-2xl p-1.5 border border-slate-800 flex flex-wrap sm:flex-nowrap items-center gap-1 shadow-md">
        <button
          onClick={() => setActiveTab("prompt")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "prompt"
              ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>(ক) ✨ AI প্রম্পট জেনারেটর</span>
        </button>

        <button
          onClick={() => setActiveTab("paste_import")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "paste_import"
              ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <ClipboardPaste className="w-4 h-4 text-cyan-300" />
          <span>(খ) 📋 AI টেক্সট ইম্পোর্ট (Copy-Paste)</span>
        </button>

        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "manual"
              ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Edit3 className="w-4 h-4 text-emerald-300" />
          <span>(গ) ✍️ ম্যানুয়ালি যোগ</span>
        </button>
      </div>

      {/* ========================================================
          TWO-COLUMN MAIN WORKSPACE
          Left (Col 7): Creation Form (Tab dependent)
          Right (Col 5): Persistent draftQuestions Canvas & Publish
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================
            LEFT COLUMN: ACTIVE CREATION TAB CONTENT
           ====================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* ----------------------------------------------------
              TAB (ক): ✨ AI PROMPT GENERATOR
             ---------------------------------------------------- */}
          {activeTab === "prompt" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      (ক) এআই প্রম্পট থেকে সরাসরি কুইজ তৈরি (AI Prompt Generator)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      টপিক বা পাঠ্য অধ্যায় এবং নির্দেশিকা লিখে এআই দিয়ে এক ক্লিকে নতুন প্রশ্ন তৈরি করুন।
                    </p>
                  </div>
                </div>
              </div>

              {/* Topic Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>কুইজের বিষয় / অধ্যায় (Topic) *</span>
                  <span className="text-[11px] text-slate-400 font-normal">যেমন: ওহমের সূত্র ও সার্কিট উপাদান</span>
                </label>
                <input
                  type="text"
                  value={promptTopic}
                  onChange={(e) => setPromptTopic(e.target.value)}
                  placeholder="যেমন: ইলেকট্রিক্যাল সেফটি, ট্রান্সফরমার প্রিন্সিপাল, সিএনসি মেশিন..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Class & Trade Selection */}
              <AcademyClassTradeSelector
                selectedClass={selectedClass}
                selectedTrade={selectedTrade}
                onClassChange={(cls) => setSelectedClass(cls)}
                onTradeChange={(trd) => setSelectedTrade(trd)}
                classLabel="টার্গেট শ্রেণি (Class Level) *"
                tradeLabel="কারিগরি ট্রেড / বিভাগ (Trade) *"
                showTierBadges={true}
                showNoticeBanner={false}
                required={true}
              />

              {/* Generation Settings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Question Count */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    প্রশ্নের সংখ্যা
                  </label>
                  <select
                    value={promptQuestionCount}
                    onChange={(e) => setPromptQuestionCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value={3}>৩টি প্রশ্ন</option>
                    <option value={5}>৫টি প্রশ্ন (প্রস্তাবিত)</option>
                    <option value={10}>১০টি প্রশ্ন</option>
                    <option value={15}>১৫টি প্রশ্ন</option>
                    <option value={20}>২০টি প্রশ্ন</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    কঠিনতার স্তর
                  </label>
                  <select
                    value={promptDifficulty}
                    onChange={(e) => setPromptDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Mixed">মিশ্র (সহজ ও মাঝারি)</option>
                    <option value="Easy">সহজ (মৌলিক ধারণা)</option>
                    <option value="Medium">মাঝারি (বোর্ড স্ট্যান্ডার্ড)</option>
                    <option value="Hard">উচ্চতর (প্র্যাকটিক্যাল)</option>
                  </select>
                </div>

                {/* Question Type */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    প্রশ্নের ধরন
                  </label>
                  <select
                    value={promptQuestionType}
                    onChange={(e) => setPromptQuestionType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="mixed">মিশ্র (MCQ, শূন্যস্থান, মিল)</option>
                    <option value="mcq_single">শুধুমাত্র MCQ (একক উত্তর)</option>
                    <option value="true_false">সত্য / মিথ্যা</option>
                    <option value="fill_blank">শূন্যস্থান পূরণ</option>
                    <option value="matching">বাম-ডান মিলকরণ</option>
                  </select>
                </div>
              </div>

              {/* Custom Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  বিশেষ নির্দেশিকা বা প্রম্পট নোট (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={promptCustomInstructions}
                  onChange={(e) => setPromptCustomInstructions(e.target.value)}
                  placeholder="যেমন: কারিগরি ল্যাব প্র্যাকটিক্যাল ভিত্তিক প্রশ্ন দিন, সমীকরণ ব্যাখ্যা করুন..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* CTA Button */}
              <button
                onClick={handleGenerateFromPrompt}
                disabled={isPromptGenerating || !promptTopic.trim()}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-95"
              >
                {isPromptGenerating ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-white" />
                    <span>এআই মডেল প্রশ্ন তৈরি করছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>✨ এআই দিয়ে প্রশ্ন তৈরি ও ড্রাফটে যুক্ত করুন (Append)</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ----------------------------------------------------
              TAB (খ): 📋 AI TEXT IMPORT (COPY-PASTE)
             ---------------------------------------------------- */}
          {activeTab === "paste_import" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                    <ClipboardPaste className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      (খ) 📋 AI টেক্সট ইম্পোর্ট (Copy-Paste)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      অন্য যেকোনো AI (ChatGPT/Claude/Gemini) থেকে কপি করা প্রশ্ন পেস্ট করে <code className="text-cyan-600 dark:text-cyan-400 font-mono text-[11px]">/api/ai/parse-quiz-text</code> দিয়ে এক ক্লিকে পার্স করুন।
                    </p>
                  </div>
                </div>

                {/* Sample Test Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 mr-1 hidden sm:inline">নমুনা:</span>
                  {SAMPLE_DEMOS.map((demo, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setRawText(demo.text);
                        setParseError(null);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 text-[11px] font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      {demo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class & Trade Selection */}
              <AcademyClassTradeSelector
                selectedClass={selectedClass}
                selectedTrade={selectedTrade}
                onClassChange={(cls) => setSelectedClass(cls)}
                onTradeChange={(trd) => setSelectedTrade(trd)}
                classLabel="টার্গেট শ্রেণি (Class Level) *"
                tradeLabel="কারিগরি ট্রেড / বিভাগ (Trade) *"
                showTierBadges={true}
                showNoticeBanner={false}
                required={true}
              />

              {/* Big Textarea Box */}
              <div className="relative">
                <textarea
                  rows={13}
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    if (parseError) setParseError(null);
                  }}
                  placeholder={`এখানে আপনার এক্সটার্নাল এআই (ChatGPT / Claude / Gemini) থেকে কপি করা কাঁচা প্রশ্ন-উত্তর পেস্ট করুন...

নমুনা ফরম্যাট:
1. ওহমের সূত্র কোনটি?
A) V = IR
B) P = VI
C) I = VR
D) R = VI
Correct: A
Explanation: V = IR হলো ওহমের সূত্রের স্ট্যান্ডার্ড রূপ।

2. কারেন্ট পরিমাপে _______ মিটার ব্যবহার করা হয়।
Answer: অ্যামিটার, Ammeter

3. বাম পাশের সাথে ডান পাশ মিলকরণ:
- ভোল্টেজ -> ভোল্ট
- কারেন্ট -> অ্যাম্পিয়ার

4. এসি কারেন্টের দিক নিয়মিত পরিবর্তিত হয়। (True/False)
Answer: True`}
                  className="w-full p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 leading-relaxed resize-y"
                />

                {rawText && (
                  <div className="absolute right-4 bottom-4 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-500 text-[10px] font-mono border border-slate-200 dark:border-slate-800 shadow-xs">
                      {rawText.length} অক্ষর • {rawText.split("\n").filter(Boolean).length} লাইন
                    </span>
                    <button
                      onClick={() => setRawText("")}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-[10px] font-bold border border-rose-200 dark:border-rose-900 cursor-pointer"
                    >
                      মুছে ফেলুন
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {parseError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Action Parse CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span>পার্স করা প্রশ্নগুলো ডানপাশের ড্রাফট তালিকায় <strong className="text-cyan-600 dark:text-cyan-400">[...prev, ...newQuestions]</strong> হিসেবে যুক্ত হবে। আগের কোনো প্রশ্ন মুছবে না।</span>
                </div>

                <button
                  onClick={handleParseAndAppendRawText}
                  disabled={isParsingText || !rawText.trim()}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-95"
                >
                  {isParsingText ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin text-white" />
                      <span>এআই বিশ্লেষণ ও পার্সিং হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <ClipboardPaste className="w-4 h-4 text-white" />
                      <span>এক ক্লিকে পার্স ও ড্রাফটে যোগ করুন (Parse & Append)</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------
              TAB (গ): ✍️ MANUALLY ADD FORM
             ---------------------------------------------------- */}
          {activeTab === "manual" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <Edit3 className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      (গ) ✍️ ম্যানুয়ালি প্রশ্ন ও অপশন যোগ (Manual Question Form)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      নিজের হাতে নতুন ফাঁকা প্রশ্ন ও অপশন লেখার ফর্ম। তৈরি করা প্রতিটি প্রশ্ন সরাসরি ডান পাশের ড্রাফট তালিকায় যুক্ত হবে।
                    </p>
                  </div>
                </div>
              </div>

              {/* Question Type Switcher */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  প্রশ্নের ধরন (Question Type)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "mcq_single", label: "🔘 বহুনির্বাচনী (MCQ একক)" },
                    { id: "mcq_multiple", label: "☑️ বহুপদী (MCQ একাধিক)" },
                    { id: "true_false", label: "⚖️ সত্য / মিথ্যা (True/False)" },
                    { id: "fill_blank", label: "📝 শূন্যস্থান পূরণ" },
                    { id: "matching", label: "🔗 বাম-ডান মিলকরণ" },
                    { id: "short_answer", label: "✍️ এক কথায় উত্তর" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setManualType(t.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-left transition border cursor-pointer ${
                        manualType === t.id
                          ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs font-black"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  প্রশ্নের বিবরণ (Question Text) *
                </label>
                <textarea
                  rows={3}
                  value={manualQuestionText}
                  onChange={(e) => setManualQuestionText(e.target.value)}
                  placeholder="যেমন: ওহমের সূত্রানুসারে সার্কিটে ভোল্টেজ দ্বিগুণ করলে কারেন্টের কী পরিবর্তন হবে?"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* DYNAMIC FORM ACCORDING TO TYPE */}
              {/* Type: MCQ Single */}
              {manualType === "mcq_single" && (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      বিকল্প অপশনসমূহ (সঠিক উত্তরটি রেডিও বাটনে সিলেক্ট করুন)
                    </label>
                    {manualOptions.length < 6 && (
                      <button
                        type="button"
                        onClick={() => setManualOptions([...manualOptions, `অপশন ${manualOptions.length + 1}`])}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>অপশন যোগ করুন</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {manualOptions.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="manual_correct_opt"
                            checked={manualCorrectIndex === oIdx}
                            onChange={() => setManualCorrectIndex(oIdx)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="text-[11px] font-bold text-slate-500 w-6">
                            {String.fromCharCode(65 + oIdx)})
                          </span>
                        </label>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...manualOptions];
                            newOpts[oIdx] = e.target.value;
                            setManualOptions(newOpts);
                          }}
                          placeholder={`অপশন ${oIdx + 1} লিখুন`}
                          className={`flex-1 px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold ${
                            manualCorrectIndex === oIdx
                              ? "border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-50/30"
                              : "border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                          }`}
                        />
                        {manualOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = manualOptions.filter((_, i) => i !== oIdx);
                              setManualOptions(newOpts);
                              if (manualCorrectIndex >= newOpts.length) setManualCorrectIndex(0);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                            title="অপশনটি মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Type: MCQ Multiple */}
              {manualType === "mcq_multiple" && (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      একাধিক সঠিক উত্তর সিলেক্ট করুন (Checkboxes)
                    </label>
                  </div>
                  <div className="space-y-2">
                    {manualOptions.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={manualCorrectIndices.includes(oIdx)}
                          onChange={() => {
                            if (manualCorrectIndices.includes(oIdx)) {
                              setManualCorrectIndices(manualCorrectIndices.filter((i) => i !== oIdx));
                            } else {
                              setManualCorrectIndices([...manualCorrectIndices, oIdx]);
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...manualOptions];
                            newOpts[oIdx] = e.target.value;
                            setManualOptions(newOpts);
                          }}
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Type: True / False */}
              {manualType === "true_false" && (
                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    সঠিক বিবৃতি নির্বাচন করুন
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setManualTfCorrect(true)}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition border flex items-center justify-center gap-2 cursor-pointer ${
                        manualTfCorrect
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>সত্য (True)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualTfCorrect(false)}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition border flex items-center justify-center gap-2 cursor-pointer ${
                        !manualTfCorrect
                          ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <X className="w-4 h-4" />
                      <span>মিথ্যা (False)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Type: Fill in the Blank */}
              {manualType === "fill_blank" && (
                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    গ্রহণযোগ্য সঠিক উত্তরসমূহ (কমা দিয়ে একাধিক সমার্থক শব্দ দিতে পারেন)
                  </label>
                  <input
                    type="text"
                    value={manualAcceptedAnswers}
                    onChange={(e) => setManualAcceptedAnswers(e.target.value)}
                    placeholder="যেমন: ভোল্টেজ, Voltage, বিভব পার্থক্য"
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-400">
                    শিক্ষার্থী এই শব্দগুলোর যেকোনো একটি টাইপ করলে উত্তরটি সঠিক হিসেবে গণ্য হবে।
                  </p>
                </div>
              )}

              {/* Type: Matching Pairs */}
              {manualType === "matching" && (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      বাম পাশ ও ডান পাশ জোড়া নির্ধারণ
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setManualPairs([...manualPairs, { left: `আইটেম ${manualPairs.length + 1}`, right: `তথ্য ${manualPairs.length + 1}` }])
                      }
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>জোড়া যোগ করুন</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {manualPairs.map((pair, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={pair.left}
                          onChange={(e) => {
                            const newPairs = [...manualPairs];
                            newPairs[pIdx].left = e.target.value;
                            setManualPairs(newPairs);
                          }}
                          placeholder="বাম পাশ (আইটেম)"
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                        />
                        <span className="text-slate-400 font-bold">➔</span>
                        <input
                          type="text"
                          value={pair.right}
                          onChange={(e) => {
                            const newPairs = [...manualPairs];
                            newPairs[pIdx].right = e.target.value;
                            setManualPairs(newPairs);
                          }}
                          placeholder="ডান পাশ (সঠিক তথ্য)"
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                        />
                        {manualPairs.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setManualPairs(manualPairs.filter((_, i) => i !== pIdx))}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Type: Short Answer */}
              {manualType === "short_answer" && (
                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    প্রত্যাশিত মূল শব্দ বা কি-ওয়ার্ড (Expected Keyword)
                  </label>
                  <input
                    type="text"
                    value={manualShortKeyword}
                    onChange={(e) => setManualShortKeyword(e.target.value)}
                    placeholder="যেমন: ক্যাপাসিট্যান্স"
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Question Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    নম্বর (Marks)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={manualMarks}
                    onChange={(e) => setManualMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    সময়সীমা (সেকেন্ড)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={manualTime}
                    onChange={(e) => setManualTime(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    টপিক / বিষয়
                  </label>
                  <input
                    type="text"
                    value={manualTopic}
                    onChange={(e) => setManualTopic(e.target.value)}
                    placeholder={selectedTrade || "টপিক নাম"}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* Explanation Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  উত্তরের ব্যাখ্যা বা নোট (Explanation)
                </label>
                <input
                  type="text"
                  value={manualExplanation}
                  onChange={(e) => setManualExplanation(e.target.value)}
                  placeholder="যেমন: ওহমের সূত্রমতে কারেন্ট ভোল্টেজের সমানুপাতিক (I = V/R)।"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={() => handleAddManualQuestion()}
                disabled={!manualQuestionText.trim()}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-95"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>✍️ ড্রাফট তালিকায় যুক্ত করুন (Append Question #{draftQuestions.length + 1})</span>
              </button>
            </div>
          )}
        </div>

        {/* ======================================================
            RIGHT COLUMN: PERSISTENT draftQuestions LIST CANVAS
           ====================================================== */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
            {/* Header of Draft Canvas */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-3 border-b border-indigo-500/20">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>ড্রাফট প্রশ্ন তালিকা</span>
                    <span className="font-mono text-cyan-300">({draftQuestions.length})</span>
                  </h3>
                </div>
                <p className="text-[10px] text-slate-300 font-mono">
                  {totalMarks} নম্বর • আনুমানিক {totalMinutes} মিনিট
                </p>
              </div>

              {/* Clear All Confirmation */}
              {draftQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("আপনি কি ড্রাফটের সকল প্রশ্ন মুছে ফেলতে চান?")) {
                      clearDraftQuestions();
                      showToast("সকল ড্রাফট প্রশ্ন মুছে ফেলা হয়েছে।");
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border border-white/10"
                  title="ড্রাফট তালিকা খালি করুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ক্লিয়ার</span>
                </button>
              )}
            </div>

            {/* Quiz Metadata Config Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  কুইজের শিরোনাম
                </label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="যেমন: কারিগরি পরীক্ষা ও সেলফ-অ্যাসেসমেন্ট"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">শ্রেণি ও ট্রেড</span>
                  <span className="font-bold text-indigo-600 dark:text-cyan-400 truncate block">
                    {selectedClass} • {selectedTrade}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">ক্যাটাগরি</span>
                  <select
                    value={quizCategory}
                    onChange={(e) => setQuizCategory(e.target.value)}
                    className="w-full py-1 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold"
                  >
                    <option value="Practice">অনুশীলন (Practice)</option>
                    <option value="Weekly Assessment">সাপ্তাহিক মূল্যায়ন</option>
                    <option value="Model Test">মডেল টেস্ট</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Questions List Container */}
            <div className="p-4 space-y-3 max-h-[620px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              {draftQuestions.length === 0 ? (
                /* Empty State */
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                      ড্রাফট তালিকা বর্তমানে খালি
                    </h4>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                      বামপাশের <span className="text-indigo-600 font-bold">(ক) AI প্রম্পট</span>, <span className="text-cyan-600 font-bold">(খ) AI টেক্সট ইম্পোর্ট</span> অথবা <span className="text-emerald-600 font-bold">(গ) ম্যানুয়ালি যোগ</span> থেকে প্রশ্ন তৈরি বা ইম্পোর্ট করুন। প্রতিটি প্রশ্ন এখানে স্বয়ংক্রিয়ভাবে জমা হবে।
                    </p>
                  </div>
                </div>
              ) : (
                /* Interactive Question Cards */
                draftQuestions.map((q: StudioQuestionItem, idx: number) => {
                  const isEditing = editingQuestionId === q.id;

                  return (
                    <div
                      key={q.id || idx}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-700 transition"
                    >
                      {/* Card Header Bar */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono font-black text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase">
                            {q.type === "mcq_single"
                              ? "MCQ"
                              : q.type === "mcq_multiple"
                              ? "Multi-MCQ"
                              : q.type === "true_false"
                              ? "True/False"
                              : q.type === "fill_blank"
                              ? "Fill Blank"
                              : q.type === "matching"
                              ? "Matching"
                              : "Short Ans"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {q.marks || defaultMarks} নম্বর • {q.timeLimit || defaultTime} সে.
                          </span>
                        </div>

                        {/* Card Controls */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                            title="উপরে নিন"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(idx, "down")}
                            disabled={idx === draftQuestions.length - 1}
                            className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                            title="নিচে নিন"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateQuestion(q.id)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-400 cursor-pointer"
                            title="কপি করুন"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingQuestionId(isEditing ? null : q.id)}
                            className={`p-1 rounded cursor-pointer ${
                              isEditing ? "text-cyan-400 bg-cyan-950/40" : "text-slate-400 hover:text-cyan-400"
                            }`}
                            title="সম্পাদনা করুন"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      {isEditing ? (
                        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <textarea
                            rows={2}
                            value={q.questionText}
                            onChange={(e) =>
                              handleUpdateDraftQuestion(q.id, { questionText: e.target.value })
                            }
                            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-indigo-400/50 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {q.questionText}
                        </p>
                      )}

                      {/* Display / Render according to Question Type */}
                      {/* MCQ Single / Multiple Options */}
                      {(q.type === "mcq_single" || q.type === "mcq_multiple") && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect =
                              q.type === "mcq_single"
                                ? q.correctAnswer === oIdx
                                : Array.isArray(q.correctIndices) && q.correctIndices.includes(oIdx);

                            return (
                              <div
                                key={oIdx}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-between border ${
                                  isCorrect
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-800 dark:text-emerald-300"
                                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                <span className="truncate">
                                  <strong className="mr-1 text-slate-400 font-mono">
                                    {String.fromCharCode(65 + oIdx)})
                                  </strong>
                                  {opt}
                                </span>
                                {isCorrect && <Check className="w-3 h-3 text-emerald-600 shrink-0 ml-1" />}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* True / False Display */}
                      {q.type === "true_false" && (
                        <div className="flex items-center gap-2 pt-1">
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                              q.correctAnswer === true
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-400"
                                : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-400"
                            }`}
                          >
                            {q.correctAnswer === true ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            <span>সঠিক উত্তর: {q.correctAnswer === true ? "সত্য (True)" : "মিথ্যা (False)"}</span>
                          </span>
                        </div>
                      )}

                      {/* Fill in Blank Display */}
                      {q.type === "fill_blank" && (
                        <div className="pt-1">
                          <span className="text-[11px] text-slate-400 font-bold block mb-1">গ্রহণযোগ্য উত্তর:</span>
                          <div className="flex flex-wrap gap-1">
                            {(q.acceptedAnswers || ["সঠিক উত্তর"]).map((ans, aIdx) => (
                              <span
                                key={aIdx}
                                className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 text-[10px] font-bold"
                              >
                                {ans}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Matching Display */}
                      {q.type === "matching" && q.pairs && (
                        <div className="space-y-1 pt-1">
                          {q.pairs.map((pair, pIdx) => (
                            <div
                              key={pIdx}
                              className="text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 px-2 py-1 rounded-lg"
                            >
                              <span>{pair.left}</span>
                              <span className="text-slate-400">➔</span>
                              <span className="text-emerald-600 dark:text-emerald-400">{pair.right}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Explanation Snippet */}
                      {q.explanation && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                          ব্যাখ্যা: {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Final Publish Action Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handlePublishQuiz}
                disabled={isPublishing || draftQuestions.length === 0}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPublishing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>পাবলিশ ও সেভ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>কুইজ পাবলিশ করুন ({draftQuestions.length}টি প্রশ্ন)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          PUBLISH SUCCESS MODAL
         ======================================================== */}
      {publishedQuizId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                PUBLISHED SUCCESSFULLY
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                কুইজটি সফলভাবে পাবলিশ হয়েছে!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                মোট {draftQuestions.length}টি প্রশ্ন সহ কুইজটি শিক্ষার্থীদের অনুশীলন ও লাইভ অ্যাসেসমেন্টের জন্য উন্মুক্ত করা হয়েছে।
              </p>
            </div>

            {/* Quiz Info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-left text-xs font-bold space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">কুইজ আইডি:</span>
                <span className="font-mono text-indigo-600 dark:text-cyan-400">{publishedQuizId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">শিরোনাম:</span>
                <span className="text-slate-900 dark:text-white">{quizTitle}</span>
              </div>
            </div>

            {/* Lobby Link Box */}
            <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                readOnly
                value={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/quiz/lobby?id=${publishedQuizId}`
                    : `/quiz/lobby?id=${publishedQuizId}`
                }
                className="flex-1 bg-transparent px-3 py-1 text-xs font-mono text-slate-700 dark:text-slate-300 outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLobbyLink}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copySuccess ? "কপি হয়েছে!" : "কপি"}</span>
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPublishedQuizId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold cursor-pointer transition"
              >
                বন্ধ করুন
              </button>
              <a
                href={`/quiz/lobby?id=${publishedQuizId}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <span>লবি ওপেন করুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AllInOneQuizStudio(props: AllInOneQuizStudioProps) {
  return (
    <QuizStudioProvider>
      <AllInOneQuizStudioInner {...props} />
    </QuizStudioProvider>
  );
}
