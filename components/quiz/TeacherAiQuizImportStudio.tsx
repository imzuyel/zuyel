"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ClipboardPaste,
  Edit3,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  FileText,
  Check,
  Share2,
  HelpCircle,
  Layers,
  ArrowUp,
  ArrowDown,
  Copy,
  AlertTriangle,
  BookOpen,
  Award,
  Clock,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { saveCustomLessonQuiz, StudentQuizQuestion } from "@/lib/studentIntelligenceStore";
import { ParsedImportedQuestion } from "@/app/api/ai/parse-quiz-text/route";
import { useQuizStudio } from "@/components/quiz/QuizStudioContext";
import AcademyClassTradeSelector from "@/components/common/AcademyClassTradeSelector";

interface TeacherAiQuizImportStudioProps {
  onQuizPublished?: (quizId: string) => void;
  defaultClassId?: string;
  defaultTradeId?: string;
}

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
    label: "ডেমো ২: মিশ্র প্রশ্ন (MCQ, শূন্যস্থান, মিলকরণ)",
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

export default function TeacherAiQuizImportStudio({
  onQuizPublished,
  defaultClassId = "class-9",
  defaultTradeId = "Electrical",
}: TeacherAiQuizImportStudioProps) {
  // Navigation workflow step: 1 = Import / Paste, 2 = Review & Edit, 3 = Published Success
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Metadata Configuration
  const [quizTitle, setQuizTitle] = useState("ইলেকট্রিক্যাল সেফটি ও মৌলিক সার্কিট কুইজ (AI Import)");
  const [selectedClass, setSelectedClass] = useState(defaultClassId);
  const [selectedTrade, setSelectedTrade] = useState(defaultTradeId);
  const [subjectName, setSubjectName] = useState("ইলেকট্রিক্যাল ওয়ার্কস-১");
  const [quizCategory, setQuizCategory] = useState("Practice");
  const [defaultTimeLimit, setDefaultTimeLimit] = useState(30);
  const [passMarkPercentage, setPassMarkPercentage] = useState(60);

  // Raw Text State
  const [rawText, setRawText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const { draftQuestions, setDraftQuestions } = useQuizStudio();
  const questions: ParsedImportedQuestion[] = draftQuestions as any;
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Add More Additional Text Paste State
  const [showAddPasteModal, setShowAddPasteModal] = useState(false);
  const [additionalRawText, setAdditionalRawText] = useState("");
  const [isParsingAdditional, setIsParsingAdditional] = useState(false);

  // Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedQuizId, setPublishedQuizId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // ----------------------------------------------------
  // STEP 1: Parse Raw External AI Text
  // ----------------------------------------------------
  const handleParseRawText = async (textToParse: string, isAppend = false) => {
    if (!textToParse.trim()) {
      setParseError("দয়া করে টেক্সট বক্সে প্রশ্ন ও উত্তর পেস্ট করুন।");
      return;
    }

    setParseError(null);
    if (isAppend) setIsParsingAdditional(true);
    else setIsParsing(true);

    try {
      const response = await fetch("/api/ai/parse-quiz-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: textToParse,
          trade: selectedTrade,
          classLevel: selectedClass,
        }),
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        if (isAppend) {
          setDraftQuestions((prev) => [...prev, ...data.questions]);
          setShowAddPasteModal(false);
          setAdditionalRawText("");
        } else {
          setDraftQuestions((prev) => [...prev, ...data.questions]);
          setCurrentStep(2); // Move to Review & Edit Step
        }
      } else {
        throw new Error(data.message || "প্রশ্ন পার্স করা সম্ভব হয়নি। টেক্সট ফরম্যাটটি যাচাই করুন।");
      }
    } catch (err: any) {
      console.error("Quiz parsing error:", err);
      setParseError(err.message || "সার্ভার বা পার্সিং সমস্যা দেখা দিয়েছে।");
    } finally {
      setIsParsing(false);
      setIsParsingAdditional(false);
    }
  };

  // ----------------------------------------------------
  // QUESTION MANAGEMENT ACTIONS
  // ----------------------------------------------------
  const handleUpdateQuestion = (id: string, updates: Partial<ParsedImportedQuestion>) => {
    setDraftQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const handleDeleteQuestion = (id: string) => {
    setDraftQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleDuplicateQuestion = (id: string) => {
    const target = questions.find((q) => q.id === id);
    if (!target) return;
    const duplicated: ParsedImportedQuestion = {
      ...target,
      id: `imp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      questionText: `${target.questionText} (কপি)`,
    };
    const index = questions.findIndex((q) => q.id === id);
    const updated = [...questions];
    updated.splice(index + 1, 0, duplicated);
    setDraftQuestions(updated);
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    )
      return;
    const updated = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setDraftQuestions(updated);
  };

  const handleAddNewBlankQuestion = (type: ParsedImportedQuestion["type"] = "mcq_single") => {
    const newQ: ParsedImportedQuestion = {
      id: `imp-manual-${Date.now()}`,
      type,
      questionText: `নতুন প্রশ্ন ${draftQuestions.length + 1}`,
      options:
        type === "mcq_single" || type === "mcq_multiple"
          ? ["বিকল্প ১", "বিকল্প ২", "বিকল্প ৩", "বিকল্প ৪"]
          : undefined,
      correctAnswer: type === "true_false" ? true : 0,
      acceptedAnswers: type === "fill_blank" ? ["সঠিক উত্তর"] : undefined,
      pairs:
        type === "matching"
          ? [
              { left: "আইটেম ১", right: "ম্যাচিং তথ্য ১" },
              { left: "আইটেম ২", right: "ম্যাচিং তথ্য ২" },
            ]
          : undefined,
      explanation: "সঠিক উত্তরের ব্যাখ্যা লিখুন।",
      conceptTopic: selectedTrade || "কারিগরি জ্ঞান",
      marks: 2,
      timeLimit: defaultTimeLimit,
    };
    // Update local UI state
    // setQuestions removed; using draftQuestions via context
    // Persist to draftQuestions
    setDraftQuestions((prev) => [...prev, newQ]);
    setExpandedQuestionId(newQ.id);
  };

  // ----------------------------------------------------
  // STEP 3: Validate & Publish Quiz
  // ----------------------------------------------------
  const handlePublishQuiz = async () => {
    if (questions.length === 0) {
      alert("কমপক্ষে একটি প্রশ্ন অন্তর্ভুক্ত থাকতে হবে।");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        alert(`প্রশ্ন #${i + 1}-এর টেক্সট খালি রাখা যাবে না।`);
        return;
      }
      if (q.type === "mcq_single" || q.type === "mcq_multiple") {
        if (!q.options || q.options.length < 2) {
          alert(`প্রশ্ন #${i + 1}-এ কমপক্ষে ২টি অপশন থাকতে হবে।`);
          return;
        }
      }
      if (q.type === "matching") {
        if (!q.pairs || q.pairs.length < 2) {
          alert(`প্রশ্ন #${i + 1}-এ মিলকরণের জন্য কমপক্ষে ২টি জোড়া থাকতে হবে।`);
          return;
        }
      }
      if (q.type === "fill_blank") {
        if (!q.acceptedAnswers || q.acceptedAnswers.length === 0) {
          alert(`প্রশ্ন #${i + 1}-এ শূন্যস্থানের জন্য গ্রহণযোগ্য উত্তর থাকতে হবে।`);
          return;
        }
      }
    }

    setIsPublishing(true);

    try {
      const generatedQuizId = `quiz-${Date.now()}`;

      // 1. Convert questions to standard institutional question format
      const formattedQuestions = questions.map((q, idx) => ({
        id: `qq-${Date.now()}-${idx}`,
        questionText: q.questionText,
        type: q.type,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        correctIndices: q.correctIndices,
        acceptedAnswers: q.acceptedAnswers,
        pairs: q.pairs,
        explanation: q.explanation,
        marks: q.marks,
        timeLimit: q.timeLimit || defaultTimeLimit,
        conceptTopic: q.conceptTopic,
      }));

      // 2. Post to /api/quizzes to persist in institutional database
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizTitle.trim() || "কারিগরি অনলাইন কুইজ",
          description: `${selectedClass} ও ${selectedTrade} শিক্ষার্থীদের জন্য এক্সটার্নাল এআই থেকে ইম্পোর্টকৃত যাচাইকৃত কুইজ।`,
          mode: "academic",
          category: quizCategory,
          subjectId: 1,
          classId: selectedClass === "class-9" ? 4 : selectedClass === "class-10" ? 5 : 6,
          tradeId: selectedTrade === "Electrical" ? 1 : selectedTrade === "Computer" ? 2 : 3,
          academicYearId: 2026,
          defaultMarks: 2,
          defaultQuestionTime: defaultTimeLimit,
          publish: true,
          questions: formattedQuestions,
        }),
      });

      const resData = await res.json();
      const actualQuizId = resData.quiz?.id || generatedQuizId;

      // 3. Also save to Student Learning Hub store for instant practice
      const studentPracticeQuestions: StudentQuizQuestion[] = questions.map((q, idx) => ({
        id: `sq-${actualQuizId}-${idx}`,
        questionText: q.questionText,
        options: q.options && q.options.length > 0 ? q.options : ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"],
        correctAnswerIndex: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
        explanation: q.explanation || "সঠিক উত্তরটি যাচাই করা হয়েছে।",
        conceptTopic: q.conceptTopic || selectedTrade,
      }));

      saveCustomLessonQuiz(actualQuizId, studentPracticeQuestions);

      // Dispatch global events for live UI sync
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ptsc_quiz_published", { detail: { quizId: actualQuizId } }));
      }

      setPublishedQuizId(actualQuizId);
      setCurrentStep(3); // Move to Success Screen

      if (onQuizPublished) {
        onQuizPublished(actualQuizId);
      }
    } catch (err: any) {
      console.error("Failed to publish quiz:", err);
      alert("কুইজ সংরক্ষণ করতে সমস্যা হয়েছে: " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window === "undefined" || !publishedQuizId) return;
    const link = `${window.location.origin}/quiz/lobby?id=${publishedQuizId}`;
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ========================================================
          TOP HERO BANNER & WORKFLOW STEPPER
         ======================================================== */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                TEACHER AI QUIZ WORKFLOW
              </span>
              <span className="text-xs text-indigo-300 font-mono">
                External AI Raw Text Importer & Publisher
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <ClipboardPaste className="w-8 h-8 text-cyan-400" />
              <span>এক্সটার্নাল AI কুইজ ইম্পোর্টার ও পাবলিশার</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ChatGPT, Gemini বা যেকোনো AI থেকে কপি করা কাঁচা প্রশ্ন-উত্তর এখানে পেস্ট করুন। এআই স্বয়ংক্রিয়ভাবে পার্স করে এডিটেবল কার্ড তৈরি করবে এবং শিক্ষার্থীদের জন্য সরাসরি পাবলিশ করবে।
            </p>
          </div>

          {/* Stepper Status Indicators */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-md">
            {[
              { step: 1, label: "১. টেক্সট পেস্ট" },
              { step: 2, label: "২. রিভিউ ও এডিট" },
              { step: 3, label: "৩. পাবলিশ সম্পন্ন" },
            ].map((s) => (
              <button
                key={s.step}
                onClick={() => {
                  if (s.step === 1 || (s.step === 2 && questions.length > 0)) {
                    setCurrentStep(s.step as any);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  currentStep === s.step
                    ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                    : currentStep > s.step
                    ? "bg-white/20 text-white"
                    : "text-slate-400 cursor-not-allowed"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================
          STEP 1: RAW TEXT IMPORT & METADATA CONFIGURATION
         ======================================================== */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>কুইজ মেটাডাটা ও টার্গেট ক্লাস কনফিগারেশন</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Quiz Title */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  কুইজের শিরোনাম (Quiz Title) *
                </label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="যেমন: ইলেকট্রিক্যাল সেফটি ও ওহমের সূত্র কুইজ"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Dynamic Centralized Class & Trade Selection */}
              <div className="sm:col-span-2">
                <AcademyClassTradeSelector
                  selectedClass={selectedClass}
                  selectedTrade={selectedTrade}
                  onClassChange={(cls) => setSelectedClass(cls)}
                  onTradeChange={(trd) => setSelectedTrade(trd)}
                  classLabel="টার্গেট শ্রেণি (Class Level) *"
                  tradeLabel="কারিগরি ট্রেড / বিভাগ (Trade) *"
                  showTierBadges={true}
                  showNoticeBanner={true}
                  required={true}
                />
              </div>

              {/* Subject Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  পাঠ্য বিষয় (Subject)
                </label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="যেমন: ট্রেড থিওরি-১"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ক্যাটাগরি (Category)
                </label>
                <select
                  value={quizCategory}
                  onChange={(e) => setQuizCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="Practice">অনুশীলন ও সেলফ-টেস্ট (Practice)</option>
                  <option value="Weekly Assessment">সাপ্তাহিক মূল্যায়ন পরীক্ষা</option>
                  <option value="Model Test">মডেল টেস্ট ও রিভিশন</option>
                  <option value="Competition">কুইজ প্রতিযোগিতা</option>
                </select>
              </div>
            </div>
          </div>

          {/* Copy-Paste Text Area Box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ClipboardPaste className="w-4 h-4 text-cyan-500" />
                  <span>এক্সটার্নাল AI টেক্সট কপি-পেস্ট বক্স (Copy-Paste Raw Text)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ChatGPT, Gemini বা যেকোনো টেক্সট ফরম্যাট থেকে প্রশ্ন ও উত্তর পেস্ট করুন
                </p>
              </div>

              {/* Demo Fill Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">নমুনা টেক্সট:</span>
                {SAMPLE_DEMOS.map((demo, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setRawText(demo.text);
                      setParseError(null);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400 text-[11px] font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Large Text Area */}
            <div className="relative">
              <textarea
                rows={14}
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  if (parseError) setParseError(null);
                }}
                placeholder={`এখানে আপনার কাঁচা প্রশ্ন-উত্তর পেস্ট করুন (Paste Here)...

সমর্থিত ফরম্যাট নমুনা:
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
                className="w-full p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
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
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span>এআই মডেল টেক্সটের কাঠামো বিশ্লেষণ করে সরাসরি এডিটেবল প্রশ্ন তৈরি করবে</span>
              </div>

              <button
                onClick={() => handleParseRawText(rawText)}
                disabled={isParsing || !rawText.trim()}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-95"
              >
                {isParsing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-white" />
                    <span>এআই বিশ্লেষণ ও পার্সিং হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>এআই দিয়ে পার্স করুন (Parse & Review)</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 2: REVIEW & EDIT STRUCTURED QUESTION CARDS
         ======================================================== */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Action Toolbar Header */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                  পার্সড প্রশ্নসংখ্যা: {questions.length}টি
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {selectedClass} • {selectedTrade}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {quizTitle}
              </h2>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Back to Paste */}
              <button
                onClick={() => setCurrentStep(1)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>টেক্সট বক্সে ফিরুন</span>
              </button>

              {/* Add More Paste */}
              <button
                onClick={() => setShowAddPasteModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-900"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>আরও টেক্সট পেস্ট করুন</span>
              </button>

              {/* Add Manual Question */}
              <button
                onClick={() => handleAddNewBlankQuestion("mcq_single")}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                <span>ম্যানুয়াল প্রশ্ন যোগ</span>
              </button>

              {/* Final Publish CTA */}
              <button
                onClick={handlePublishQuiz}
                disabled={isPublishing || questions.length === 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-white" />
                    <span>পাবলিশ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>কুইজ পাবলিশ করুন ({questions.length}টি প্রশ্ন)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* List of Individual Editable Question Cards */}
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const isExpanded = expandedQuestionId === q.id || expandedQuestionId === null;

              return (
                <div
                  key={q.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:border-indigo-300 dark:hover:border-indigo-800"
                >
                  {/* Card Header Bar */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                        {idx + 1}
                      </span>

                      {/* Question Type Switcher */}
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const newType = e.target.value as any;
                          handleUpdateQuestion(q.id, {
                            type: newType,
                            options:
                              newType === "mcq_single" || newType === "mcq_multiple"
                                ? q.options || ["বিকল্প ১", "বিকল্প ২", "বিকল্প ৩", "বিকল্প ৪"]
                                : undefined,
                            pairs:
                              newType === "matching"
                                ? q.pairs || [
                                    { left: "আইটেম ১", right: "তথ্য ১" },
                                    { left: "আইটেম ২", right: "তথ্য ২" },
                                  ]
                                : undefined,
                            acceptedAnswers:
                              newType === "fill_blank" ? q.acceptedAnswers || ["উত্তর"] : undefined,
                          });
                        }}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-indigo-700 dark:text-cyan-400"
                      >
                        <option value="mcq_single">MCQ (একক উত্তর)</option>
                        <option value="mcq_multiple">MCQ (একাধিক উত্তর)</option>
                        <option value="fill_blank">শূন্যস্থান পূরণ (Fill in Blanks)</option>
                        <option value="matching">বাম-ডান মিলকরণ (Matching)</option>
                        <option value="true_false">সত্য / মিথ্যা (True/False)</option>
                      </select>

                      <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
                        ({q.marks} নম্বর • {q.timeLimit} সে.)
                      </span>
                    </div>

                    {/* Card Actions: Move Up, Move Down, Duplicate, Delete, Collapse */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveQuestion(idx, "up")}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                        title="উপরে নিন"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleMoveQuestion(idx, "down")}
                        disabled={idx === 0 || idx === questions.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                        title="নিচে নিন"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDuplicateQuestion(q.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-400 cursor-pointer"
                        title="কপি করুন"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() =>
                          setExpandedQuestionId(expandedQuestionId === q.id ? "none" : q.id)
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer ml-1"
                        title="সংকোচন / সম্প্রসারণ"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Content Area */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 space-y-5">
                      {/* Question Text Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>প্রশ্ন (Question Statement) *</span>
                          <span className="text-[10px] text-slate-400">
                            প্রয়োজনে ফরম্যাটিং বা সমীকরণ সংশোধন করুন
                          </span>
                        </label>
                        <textarea
                          rows={2}
                          value={q.questionText}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, { questionText: e.target.value })
                          }
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Question Format Specific Editors */}
                      {/* 1. MCQ SINGLE / MULTIPLE */}
                      {(q.type === "mcq_single" || q.type === "mcq_multiple") && (
                        <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span>অপশনসমূহ ও সঠিক উত্তর নির্বাচন:</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                              {q.type === "mcq_single"
                                ? "রেডিও বাটনে ক্লিক করে সঠিক উত্তর চিহ্নিত করুন"
                                : "চেকবক্স টিক দিয়ে একাধিক সঠিক উত্তর চিহ্নিত করুন"}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {(q.options || []).map((opt, oIdx) => {
                              const isChecked =
                                q.type === "mcq_single"
                                  ? q.correctAnswer === oIdx
                                  : Array.isArray(q.correctIndices) &&
                                    q.correctIndices.includes(oIdx);

                              return (
                                <div
                                  key={oIdx}
                                  className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                                    isChecked
                                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                  }`}
                                >
                                  {q.type === "mcq_single" ? (
                                    <input
                                      type="radio"
                                      name={`correct-${q.id}`}
                                      checked={q.correctAnswer === oIdx}
                                      onChange={() =>
                                        handleUpdateQuestion(q.id, { correctAnswer: oIdx })
                                      }
                                      className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer shrink-0"
                                    />
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={
                                        Array.isArray(q.correctIndices) &&
                                        q.correctIndices.includes(oIdx)
                                      }
                                      onChange={(e) => {
                                        const current = q.correctIndices || [];
                                        const updated = e.target.checked
                                          ? [...current, oIdx]
                                          : current.filter((i) => i !== oIdx);
                                        handleUpdateQuestion(q.id, { correctIndices: updated });
                                      }}
                                      className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer shrink-0"
                                    />
                                  )}

                                  <span className="w-5 font-mono font-bold text-xs text-slate-400 shrink-0">
                                    {String.fromCharCode(65 + oIdx)})
                                  </span>

                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const updatedOpts = [...(q.options || [])];
                                      updatedOpts[oIdx] = e.target.value;
                                      handleUpdateQuestion(q.id, { options: updatedOpts });
                                    }}
                                    className="flex-1 px-3 py-1.5 bg-transparent border-none text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                                  />

                                  {/* Delete option button if > 2 */}
                                  {(q.options || []).length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedOpts = (q.options || []).filter(
                                          (_, idx2) => idx2 !== oIdx
                                        );
                                        let updatedCorrect =
                                          typeof q.correctAnswer === "number" ? q.correctAnswer : 0;
                                        if (updatedCorrect >= updatedOpts.length)
                                          updatedCorrect = 0;
                                        handleUpdateQuestion(q.id, {
                                          options: updatedOpts,
                                          correctAnswer: updatedCorrect,
                                        });
                                      }}
                                      className="p-1 text-slate-300 hover:text-rose-500 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Add Option Button */}
                          {(q.options || []).length < 6 && (
                            <button
                              type="button"
                              onClick={() => {
                                const currentOpts = q.options || [];
                                const newOpts = [
                                  ...currentOpts,
                                  `বিকল্প ${String.fromCharCode(65 + currentOpts.length)}`,
                                ];
                                handleUpdateQuestion(q.id, { options: newOpts });
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-indigo-600 dark:text-cyan-400 flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>নতুন অপশন যোগ করুন</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* 2. FILL IN THE BLANKS */}
                      {q.type === "fill_blank" && (
                        <div className="space-y-3 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                          <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                            গ্রহণযোগ্য উত্তরসমূহ (কমা বা সেমিকোলন দিয়ে পৃথক করুন):
                          </label>
                          <input
                            type="text"
                            value={(q.acceptedAnswers || []).join(", ")}
                            onChange={(e) => {
                              const list = e.target.value
                                .split(/[,;]+/)
                                .map((a) => a.trim())
                                .filter(Boolean);
                              handleUpdateQuestion(q.id, { acceptedAnswers: list });
                            }}
                            placeholder="যেমন: V/R, V / R, v/r"
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                          />
                          <p className="text-[11px] text-amber-700 dark:text-amber-300">
                            শিক্ষার্থীরা এই তালিকার যেকোনো একটি উত্তর লিখলে সঠিক বলে বিবেচিত হবে।
                          </p>
                        </div>
                      )}

                      {/* 3. MATCHING (LEFT-RIGHT PAIRS) */}
                      {q.type === "matching" && (
                        <div className="space-y-3 p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                          <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200">
                            <span>বাম পাশ ও ডান পাশের জোড়াসমূহ (Matching Pairs):</span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentPairs = q.pairs || [];
                                handleUpdateQuestion(q.id, {
                                  pairs: [
                                    ...currentPairs,
                                    {
                                      left: `আইটেম ${currentPairs.length + 1}`,
                                      right: `ম্যাচিং তথ্য ${currentPairs.length + 1}`,
                                    },
                                  ],
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 text-[11px] font-bold border border-purple-300 cursor-pointer"
                            >
                              + নতুন জোড়া যোগ
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(q.pairs || []).map((pair, pIdx) => (
                              <div
                                key={pIdx}
                                className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-purple-200 dark:border-purple-900 text-xs"
                              >
                                <span className="font-mono font-bold text-slate-400 w-5">
                                  #{pIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={pair.left}
                                  onChange={(e) => {
                                    const updated = [...(q.pairs || [])];
                                    updated[pIdx].left = e.target.value;
                                    handleUpdateQuestion(q.id, { pairs: updated });
                                  }}
                                  placeholder="বাম কলাম"
                                  className="flex-1 p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-bold"
                                />
                                <span className="text-slate-400 font-bold">➔</span>
                                <input
                                  type="text"
                                  value={pair.right}
                                  onChange={(e) => {
                                    const updated = [...(q.pairs || [])];
                                    updated[pIdx].right = e.target.value;
                                    handleUpdateQuestion(q.id, { pairs: updated });
                                  }}
                                  placeholder="ডান কলাম"
                                  className="flex-1 p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-bold"
                                />

                                {(q.pairs || []).length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = (q.pairs || []).filter(
                                        (_, idx2) => idx2 !== pIdx
                                      );
                                      handleUpdateQuestion(q.id, { pairs: updated });
                                    }}
                                    className="p-1 text-slate-300 hover:text-rose-500 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. TRUE / FALSE */}
                      {q.type === "true_false" && (
                        <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-900/40 flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-900 dark:text-cyan-200">
                            সঠিক উত্তর নির্বাচন করুন:
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuestion(q.id, { correctAnswer: true })}
                              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                q.correctAnswer === true
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200"
                              }`}
                            >
                              ✓ সত্য (True)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuestion(q.id, { correctAnswer: false })}
                              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                q.correctAnswer === false
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200"
                              }`}
                            >
                              ✕ মিথ্যা (False)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Explanation & Concept Topic Metadata */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {/* Explanation */}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            ব্যাখ্যা (Explanation / Feedback)
                          </label>
                          <input
                            type="text"
                            value={q.explanation}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, { explanation: e.target.value })
                            }
                            placeholder="সঠিক উত্তরের কারণ বা ব্যাখ্যা লিখুন"
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Concept Topic */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            টপিক / কনসেপ্ট (Topic)
                          </label>
                          <input
                            type="text"
                            value={q.conceptTopic}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, { conceptTopic: e.target.value })
                            }
                            placeholder="যেমন: ওহমের সূত্র"
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Control Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddNewBlankQuestion("mcq_single")}
                className="px-4 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>+ নতুন প্রশ্ন যোগ করুন</span>
              </button>

              <button
                onClick={() => setShowAddPasteModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <ClipboardPaste className="w-4 h-4 text-cyan-500" />
                <span>আরও টেক্সট পেস্ট করুন</span>
              </button>
            </div>

            <button
              onClick={handlePublishQuiz}
              disabled={isPublishing || questions.length === 0}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50 transform hover:scale-[1.02] active:scale-95"
            >
              {isPublishing ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin text-white" />
                  <span>পাবলিশ ও ডাটাবেজে সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>কুইজ সরাসরি পাবলিশ করুন (Publish Now)</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 3: SUCCESS CONFIRMATION & SHARING
         ======================================================== */}
      {currentStep === 3 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-xl text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase">
              কুইজ সফলভাবে সংরক্ষিত ও প্রকাশিত!
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {quizTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              কুইজটি এখন PTSC ইনস্টিটিউশনাল ডাটাবেজে লাইভ রয়েছে। শিক্ষার্থীরা তাঁদের লার্নিং হাব এবং কুইজ লবি থেকে অংশগ্রহণ করতে পারবে।
            </p>
          </div>

          {/* Quick Summary Pill */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">মোট প্রশ্ন</span>
              <strong className="text-indigo-600 dark:text-cyan-400 font-mono text-sm">
                {questions.length} টি
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">শ্রেণি ও ট্রেড</span>
              <strong className="text-slate-800 dark:text-slate-200 truncate block">
                {selectedTrade}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">কুইজ আইডি</span>
              <strong className="text-emerald-600 font-mono text-xs truncate block">
                {publishedQuizId}
              </strong>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>লিংক কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>কুইজ লিংক কপি করুন</span>
                </>
              )}
            </button>

            <a
              href="/learning-library"
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>লার্নিং হাবে দেখুন</span>
            </a>

            <button
              onClick={() => {
                setRawText("");
                setDraftQuestions([]);
                setCurrentStep(1);
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>আরেকটি কুইজ ইম্পোর্ট করুন</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PASTE ADDITIONAL TEXT TO APPEND
         ======================================================== */}
      {showAddPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-xl w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4 text-indigo-500" />
                <span>আরও অতিরিক্ত প্রশ্ন টেক্সট পেস্ট করুন</span>
              </h3>
              <button
                onClick={() => setShowAddPasteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              নিচের বক্সে অতিরিক্ত প্রশ্নগুলো পেস্ট করুন। এগুলো স্বয়ংক্রিয়ভাবে পার্স হয়ে আপনার বর্তমান তালিকার শেষে যুক্ত হবে।
            </p>

            <textarea
              rows={8}
              value={additionalRawText}
              onChange={(e) => setAdditionalRawText(e.target.value)}
              placeholder="অতিরিক্ত প্রশ্ন ও উত্তর পেস্ট করুন..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddPasteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                বাতিল
              </button>

              <button
                type="button"
                onClick={() => handleParseRawText(additionalRawText, true)}
                disabled={isParsingAdditional || !additionalRawText.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isParsingAdditional ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>পার্স হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>পার্স করে যুক্ত করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
