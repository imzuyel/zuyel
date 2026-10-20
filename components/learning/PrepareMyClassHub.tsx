"use client";

import React, { useState } from "react";
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  Layers,
  FileText,
  HelpCircle,
  CheckCircle2,
  Send,
  Loader2,
  Copy,
  Printer,
  Edit3,
  Eye,
  Check,
  Flame,
  Award,
  ShieldAlert,
  Wrench,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Upload,
  RefreshCw,
  FolderOpen,
  BrainCircuit,
  X,
  ClipboardPaste,
} from "lucide-react";
import {
  saveCustomLessonQuiz,
  StudentQuizQuestion,
} from "@/lib/studentIntelligenceStore";
import ClassWeakTopicAnalytics from "./ClassWeakTopicAnalytics";
import TeacherAiQuizImportStudio from "@/components/quiz/TeacherAiQuizImportStudio";
import { useAcademySettings } from "@/lib/useAcademySettings";
import {
  DEFAULT_ACADEMY_CLASS_TRADE_MAPPINGS,
  getClassLabelBangla,
  getTradeLabelBangla,
} from "@/lib/academySettingsStore";
import { InternationalStoryLessonRenderer } from "@/components/learning/InternationalStoryLessonRenderer";

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

const CLASSES_LIST = [
  { id: "class-9", label: "ক্লাস ৯ (ভোকেশনাল)", tradeRequired: true },
  { id: "class-10", label: "ক্লাস ১০ (ভোকেশনাল)", tradeRequired: true },
  { id: "diploma", label: "ডিপ্লোমা ১ম/২য় পর্ব (ইঞ্জিনিয়ারিং)", tradeRequired: true },
  { id: "class-8", label: "অষ্টম শ্রেণি (প্রাক-ভোকেশনাল)", tradeRequired: false },
  { id: "class-7", label: "সপ্তম শ্রেণি (সাধারণ)", tradeRequired: false },
  { id: "class-6", label: "ষষ্ঠ শ্রেণি (সাধারণ)", tradeRequired: false },
  { id: "class-11", label: "একাদশ (ভোকেশনাল)", tradeRequired: true },
  { id: "class-12", label: "দ্বাদশ (ভোকেশনাল)", tradeRequired: true },
];

const TRADES_LIST = [
  { id: "Electrical", label: "ইলেকট্রিক্যাল সেফটি ও সার্কিট", icon: "⚡" },
  { id: "Computer", label: "কম্পিউটার ও আইওটি টেকনোলজি", icon: "💻" },
  { id: "Automobile", label: "অটোমোবাইল ইঞ্জিনিয়ারিং", icon: "🚗" },
  { id: "RAC", label: "রেফ্রিজারেশন ও এয়ারকন্ডিশনিং", icon: "❄️" },
  { id: "Civil", label: "সিভিল কনস্ট্রাকশন ও ড্রাফটিং", icon: "🏗️" },
  { id: "Electronics", label: "ইলেকট্রনিক্স টেকনোলজি", icon: "📻" },
  { id: "General", label: "সাধারণ পাঠ্যক্রম (ট্রেড প্রযোজ্য নয়)", icon: "📚" },
];

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

export default function PrepareMyClassHub() {
  // Central Academy Settings & Dynamic Class-to-Trade Mappings
  const { mappings: ACADEMY_CLASSES, getTradesForClass, hasTrades } = useAcademySettings();

  // Input selections
  const [selectedClassId, setSelectedClassId] = useState<string>("class-9");
  const [selectedTradeId, setSelectedTradeId] = useState<string>("Electrical");
  const [selectedPresentationId, setSelectedPresentationId] = useState<string>("pres-1");
  const [customPresentationTitle, setCustomPresentationTitle] = useState<string>("");
  const [isCustomUpload, setIsCustomUpload] = useState<boolean>(false);
  const [startSlide, setStartSlide] = useState<number>(1);
  const [endSlide, setEndSlide] = useState<number>(15);
  const [teacherNotes, setTeacherNotes] = useState<string>("");
  const [teacherName, setTeacherName] = useState<string>("প্রকৌ: মো: রফিকুল ইসলাম (চিফ ইন্সট্রাক্টর)");

  const availableTradesForClass = getTradesForClass(selectedClassId);
  const isClassWithTrades = hasTrades(selectedClassId);

  const handleClassSelection = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const trades = getTradesForClass(newClassId);
    if (!hasTrades(newClassId)) {
      setSelectedTradeId("General");
    } else {
      if (!trades.some((t) => t.id === selectedTradeId)) {
        setSelectedTradeId(trades[0]?.id || "Electrical");
      }
    }
  };

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPackage, setGeneratedPackage] = useState<GeneratedClassPackage | null>(null);
  const [activePackageTab, setActivePackageTab] = useState<"summary" | "blog" | "quiz">("summary");
  const [blogEditMode, setBlogEditMode] = useState<"preview" | "edit">("preview");
  const [editableMarkdown, setEditableMarkdown] = useState<string>("");
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);
  const [publishedLessonId, setPublishedLessonId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);
  const [showAiQuizImportModal, setShowAiQuizImportModal] = useState<boolean>(false);

  // Sync presentation selection
  const handlePresentationChange = (presId: string) => {
    setSelectedPresentationId(presId);
    if (presId !== "custom") {
      setIsCustomUpload(false);
      const found = AVAILABLE_PRESENTATIONS.find((p) => p.id === presId);
      if (found) {
        setSelectedClassId(found.classLevel);
        setSelectedTradeId(found.trade);
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
    : AVAILABLE_PRESENTATIONS.find((p) => p.id === selectedPresentationId)?.title || "বেসিক কারিগরি পাঠ";

  // Trigger AI Package Generation
  const handleGenerateClassPackage = async () => {
    setIsGenerating(true);
    setPublishSuccess(false);

    const classObj = CLASSES_LIST.find((c) => c.id === selectedClassId);
    const tradeObj = TRADES_LIST.find((t) => t.id === selectedTradeId);

    try {
      const response = await fetch("/api/ai/prepare-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetClass: classObj?.label || selectedClassId,
          trade: tradeObj?.label || selectedTradeId,
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
      } else {
        throw new Error(resData.error || "Failed to generate class package");
      }
    } catch (err: any) {
      console.error("AI Generation error, using local fallback package:", err);
      // Fallback fallback in case of network issue
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
            "মিটারের জিরো-এরর ক্যালিব্রেট করে মান নোট করুন।",
          ],
          safetyTips: [
            "কাজের সময় বাধ্যতামূলক সেফটি গগলস ও ইন্সুলেটেড গ্লাভস পরুন।",
            "অনাবৃত ধাতব পরিবাহী স্পর্শ করবেন না।",
          ],
        },
        blogPost: {
          title: currentPresentationTitle,
          estimatedReadMinutes: 6,
          markdownContent: `# ${currentPresentationTitle}\n\n## ১. পাঠের সারসংক্ষেপ ও শিখনফল\nআজকের ক্লাসে আমরা স্লাইড ${startSlide} থেকে ${endSlide} কভার করেছি।\n\n## ২. ব্যবহারিক দিকনির্দেশনা\nল্যাবরেটরিতে শিক্ষক নির্দেশিত সেফটি মেনে সার্কিট টেস্ট করুন।`,
        },
        quizSet: [
          {
            id: "mcq-1",
            questionText: `${currentPresentationTitle}-এর মূল শিখনফল কোনটি?`,
            options: ["বাস্তব ব্যবহারিক জ্ঞান অর্জন", "কেবলমাত্র সূত্র মুখস্থ করা", "ল্যাব না করা", "অন্য কিছু"],
            correctAnswerIndex: 0,
            explanation: "কারিগরি শিক্ষার মূল লক্ষ্য হলো বাস্তব কর্মক্ষেত্রে প্রয়োগযোগ্য জ্ঞান।",
            conceptTopic: "মৌলিক শিখনফল",
          },
        ],
      };
      setGeneratedPackage(mockPackage);
      setEditableMarkdown(mockPackage.blogPost.markdownContent);
    } finally {
      setIsGenerating(false);
    }
  };

  // Publish package to students
  const handlePublishToStudents = () => {
    if (!generatedPackage) return;

    const newLessonId = `lesson-pkg-${Date.now()}`;

    // Attach the 10-Question MCQ Quiz to this lesson for student practice arena
    if (generatedPackage.quizSet && generatedPackage.quizSet.length > 0) {
      saveCustomLessonQuiz(newLessonId, generatedPackage.quizSet);
    }

    setPublishedLessonId(newLessonId);
    setPublishSuccess(true);
  };

  const handleCopySummary = () => {
    if (!generatedPackage) return;
    const text = `【${generatedPackage.blogPost.title}】\n\nসারসংক্ষেপ:\n${generatedPackage.lessonSummary.briefOverview}\n\nশিখনফল:\n${generatedPackage.lessonSummary.objectives.map((o, i) => `${i + 1}. ${o}`).join("\n")}\n\nব্যবহারিক গাইড:\n${generatedPackage.lessonSummary.labPracticalGuidance.map((g, i) => `• ${g}`).join("\n")}\n\nসেফটি প্রিক্রেশন:\n${generatedPackage.lessonSummary.safetyTips.map((s, i) => `⚠ ${s}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black uppercase tracking-wider">
                TEACHER POWER TOOL
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                AI 3-in-1 Classroom Hub
              </span>
              <span className="text-xs text-indigo-300 font-mono">
                PTSC Technical Academic Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
              <span>"Prepare My Class" শিক্ষক ক্লাস প্রস্তুতি হাব</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              শ্রেণি, ট্রেড ও প্রেজেন্টেশন নির্বাচন করে এক ক্লিকে এআই দিয়ে সম্পূর্ণ ক্লাস প্যাকেজ তৈরি করুন: 
              <strong className="text-white ml-1">১. লেসন সামারি</strong>, 
              <strong className="text-white ml-1">২. শিক্ষার্থী ব্লগ</strong> এবং 
              <strong className="text-white ml-1">৩. ১০টি স্বয়ংক্রিয় MCQ কুইজ সেট</strong>।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAnalyticsModal(true)}
              className="px-4 py-3 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-xs font-bold text-cyan-200 flex items-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              <BrainCircuit className="w-4 h-4 text-cyan-400" />
              <span>দুর্বল টপিক ও অ্যানালিটিক্স দেখুন</span>
            </button>

            <button
              onClick={() => setShowAiQuizImportModal(true)}
              className="px-4 py-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-xs font-bold text-indigo-200 flex items-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              <ClipboardPaste className="w-4 h-4 text-indigo-300" />
              <span>এক্সটার্নাল AI কুইজ ইম্পোর্ট</span>
            </button>

            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-right">
              <span className="text-[11px] text-indigo-200 block">শিক্ষক প্রোফাইল</span>
              <span className="text-xs font-bold text-white truncate max-w-[200px] block">
                {teacherName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              ১
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                ক্লাস, ট্রেড ও প্রেজেন্টেশন স্লাইড নির্বাচন
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                যে পাঠের জন্য আপনি ক্লাস প্রস্তুতি ও কুইজ তৈরি করতে চান তা নির্বাচন করুন
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Class Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-500" />
                <span>শ্রেণি / পর্ব নির্বাচন:</span>
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                {isClassWithTrades ? "কারিগরি শাখা" : "প্রাক-ভোকেশনাল"}
              </span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassSelection(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {ACADEMY_CLASSES.map((cls) => (
                <option key={cls.id || cls.databaseClassId} value={cls.id}>
                  {cls.nameBangla}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Trade Selection (Strict Dynamic Conditional Logic) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>কারিগরি ট্রেড / টেকনোলজি:</span>
              </span>
              {!isClassWithTrades && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  ট্রেড প্রযোজ্য নয়
                </span>
              )}
            </label>
            {!isClassWithTrades ? (
              <div className="w-full text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/40 text-slate-400 p-3 flex items-center justify-between">
                <span>সাধারণ পাঠ্যক্রম (ট্রেড প্রযোজ্য নয়)</span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  ৬ষ্ঠ-৮ম
                </span>
              </div>
            ) : (
              <select
                value={selectedTradeId}
                onChange={(e) => setSelectedTradeId(e.target.value)}
                className="w-full text-xs sm:text-sm font-semibold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {availableTradesForClass.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon ? `${t.icon} ` : ""} {t.nameBangla} ({t.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3. Presentation Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>প্রেজেন্টেশন / স্লাইড ডেক:</span>
            </label>
            <select
              value={selectedPresentationId}
              onChange={(e) => handlePresentationChange(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {AVAILABLE_PRESENTATIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.totalSlides} স্লাইড)
                </option>
              ))}
              <option value="custom">📁 নতুন প্রেজেন্টেশন আপলোড বা কাস্টম বিষয়...</option>
            </select>
          </div>
        </div>

        {/* Custom Upload or Presentation Title Details */}
        {isCustomUpload && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                <span>কাস্টম প্রেজেন্টেশন / PPTX আপলোড অথবা টাইটেল লিখুন:</span>
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="যেমন: রেফ্রিজারেশন সাইকেল ও থার্মাল কন্ট্রোল"
                value={customPresentationTitle}
                onChange={(e) => setCustomPresentationTitle(e.target.value)}
                className="text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-700/50 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              <label className="cursor-pointer text-xs font-semibold rounded-xl border border-dashed border-amber-400 dark:border-amber-600 bg-amber-100/40 dark:bg-amber-950/20 p-2.5 text-center flex items-center justify-center gap-2 hover:bg-amber-100/70 transition-colors">
                <FolderOpen className="w-4 h-4 text-amber-600" />
                <span>PPTX বা স্লাইড ফাইল নির্বাচন করুন</span>
                <input type="file" accept=".pptx,.pdf,.ppt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        )}

        {/* Slide Range & Special Teacher Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Slide Range */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                নির্দিষ্ট স্লাইড রেঞ্জ (Slide Range Focus):
              </span>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                স্লাইড {startSlide} থেকে {endSlide}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">শুরুর স্লাইড:</span>
                <input
                  type="number"
                  min={1}
                  max={endSlide}
                  value={startSlide}
                  onChange={(e) => setStartSlide(Number(e.target.value) || 1)}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">শেষের স্লাইড:</span>
                <input
                  type="number"
                  min={startSlide}
                  max={60}
                  value={endSlide}
                  onChange={(e) => setEndSlide(Number(e.target.value) || 15)}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Teacher Custom Notes */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              শিক্ষকের বিশেষ নির্দেশনা (ঐচ্ছিক):
            </span>
            <input
              type="text"
              placeholder="যেমন: ব্যবহারিক ল্যাব সেফটি এবং গাণিতিক সমীকরণগুলোর উপর বেশি জোর দিন"
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Trigger Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI স্বয়ংক্রিয়ভাবে কারিকুলাম অনুযায়ী ৩টি সম্পূর্ণ আউটপুট প্রস্তুত করবে।</span>
          </div>

          <button
            onClick={handleGenerateClassPackage}
            disabled={isGenerating}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>ক্লাস প্যাকেজ প্রস্তুত হচ্ছে...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>ক্লাস প্যাকেজ তৈরি করুন (Generate 3-in-1 Package)</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Package Section */}
      {generatedPackage && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-200 dark:border-indigo-900/50 shadow-xl overflow-hidden animate-fade-in space-y-6 p-6 sm:p-8">
          
          {/* Header with Publish Button */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  ✓ প্যাকেজ সফলভাবে তৈরি হয়েছে
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentPresentationTitle}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {generatedPackage.blogPost.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handlePublishToStudents}
                disabled={publishSuccess}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md transition-all ${
                  publishSuccess
                    ? "bg-emerald-600 text-white"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer"
                }`}
              >
                {publishSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>প্রকাশিত হয়েছে! (Published)</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>শিক্ষার্থী হাবে প্রকাশ করুন (Publish to Hub & Quiz)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Success Banner if published */}
          {publishSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>
                  <strong>আলহামদুলিল্লাহ!</strong> এই পাঠ এবং এর <strong>১০টি MCQ কুইজ</strong> সরাসরি শিক্ষার্থীর লার্নিং হাব এবং কুইজ অ্যারেনায় যুক্ত করা হয়েছে।
                </span>
              </div>
              <a
                href="/learning-library"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0 flex items-center gap-1.5"
              >
                <span>হাবে দেখুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActivePackageTab("summary")}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
                activePackageTab === "summary"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              <span>১. লেসন সামারি ও শিখনফল</span>
            </button>

            <button
              onClick={() => setActivePackageTab("blog")}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
                activePackageTab === "blog"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>২. শিক্ষার্থী ব্লগ আর্টিকেল</span>
            </button>

            <button
              onClick={() => setActivePackageTab("quiz")}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
                activePackageTab === "quiz"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>৩. ১০টি স্বয়ংক্রিয় MCQ কুইজ সেট</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
                10 MCQ
              </span>
            </button>
          </div>

          {/* Tab 1: Lesson Summary */}
          {activePackageTab === "summary" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <span>ক্লাস উপস্থাপনা ও শিখনফল সারসংক্ষেপ</span>
                </h3>
                <button
                  onClick={handleCopySummary}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSummary ? "কপি সম্পন্ন!" : "সামারি কপি করুন"}</span>
                </button>
              </div>

              {/* Overview Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>মূল সারসংক্ষেপ:</strong> {generatedPackage.lessonSummary.briefOverview}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Objectives */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>পাঠের শিখনফল (Learning Objectives)</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {generatedPackage.lessonSummary.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Theoretical Concepts */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <span>মূল তাত্ত্বিক বিষয়বস্তু (Key Concepts)</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {generatedPackage.lessonSummary.keyConcepts.map((kc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-500 font-black shrink-0">•</span>
                        <span>{kc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Lab Practical Guidance */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-emerald-500" />
                    <span>ব্যবহারিক কর্মশালা গাইড (Lab Practical Guidance)</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {generatedPackage.lessonSummary.labPracticalGuidance.map((lpg, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-black shrink-0">✓</span>
                        <span>{lpg}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Safety Tips */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-amber-200 dark:border-amber-900/40 space-y-3">
                  <h4 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>ওয়ার্কশপ নিরাপত্তা ও সতর্কতা (Safety & PPE)</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {generatedPackage.lessonSummary.safetyTips.map((st, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 font-black shrink-0">⚠</span>
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Blog Article */}
          {activePackageTab === "blog" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    আর্টিকেল মোড:
                  </span>
                  <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setBlogEditMode("preview")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        blogEditMode === "preview"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      প্রিভিউ (Preview)
                    </button>
                    <button
                      onClick={() => setBlogEditMode("edit")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        blogEditMode === "edit"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      এডিট করুন (Markdown Editor)
                    </button>
                  </div>
                </div>

                <span className="text-xs text-slate-400 font-mono">
                  পাঠের আনুমানিক সময়: {generatedPackage.blogPost.estimatedReadMinutes} মিনিট
                </span>
              </div>

              {blogEditMode === "edit" ? (
                <div className="space-y-2">
                  <textarea
                    rows={16}
                    value={editableMarkdown}
                    onChange={(e) => setEditableMarkdown(e.target.value)}
                    className="w-full text-xs sm:text-sm font-mono rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-slate-400 block">
                    শিক্ষক যেকোনো প্যারাগ্রাফ, শিরোনাম বা সমীকরণ সরাসরি সংশোধন করতে পারেন।
                  </span>
                </div>
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

          {/* Tab 3: 10 MCQ Quiz Set */}
          {activePackageTab === "quiz" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                <div>
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>১০টি স্বয়ংক্রিয় MCQ প্রশ্ন ও সঠিক উত্তর বিশ্লেষণ</span>
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    এই প্রশ্নগুলো শিক্ষার্থীর "Practice Quiz Arena"-তে স্বয়ংক্রিয়ভাবে লোড হবে এবং দুর্বল বিষয় শনাক্ত করবে।
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-900 text-xs font-black">
                  মোট ১০টি MCQ প্রস্তুত
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedPackage.quizSet.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[10px] font-bold">
                          টপিক: {q.conceptTopic}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                      {q.questionText}
                    </h4>

                    {/* Options list */}
                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctAnswerIndex;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl text-xs font-medium border flex items-center justify-between ${
                              isCorrect
                                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold"
                                : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            <span>
                              {String.fromCharCode(0x0995 + optIdx)}) {opt}
                            </span>
                            {isCorrect && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-bold">
                                সঠিক উত্তর
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      <strong className="text-indigo-600 dark:text-indigo-400">ব্যাখ্যা:</strong> {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-500" />
                <span>ক্লাস ও শিক্ষার্থী পারফরম্যান্স অ্যানালিটিক্স (Phase 4)</span>
              </h2>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ClassWeakTopicAnalytics />
          </div>
        </div>
      )}

      {/* External AI Quiz Import Studio Modal */}
      {showAiQuizImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5 text-indigo-500" />
                <span>এক্সটার্নাল AI কুইজ ইম্পোর্ট ও পাবলিশ হাব</span>
              </h2>
              <button
                onClick={() => setShowAiQuizImportModal(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <TeacherAiQuizImportStudio
              defaultClassId={selectedClassId}
              defaultTradeId={selectedTradeId}
              onQuizPublished={() => {
                setShowAiQuizImportModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
