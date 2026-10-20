"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  Sparkles,
  Printer,
  Plus,
  Trash2,
  Edit3,
  Save,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  FileUp,
  ClipboardList,
  RefreshCw,
  Settings,
  X,
  FileCheck,
  Search,
  ArrowUp,
  ArrowDown,
  Copy,
  Layers,
  CheckSquare,
  Square,
  Sliders,
  HelpCircle,
  Check,
} from "lucide-react";
import { ACADEMIC_CLASSES, ALL_TRADES, getSubjectsForClass, getApplicableTradesForClass } from "@/lib/academicStructure";
import { toBengaliNumerals, isTradeApplicable } from "@/lib/utils";
import AcademicFilterBar from "@/components/common/AcademicFilterBar";
import SmartPdfPickerDropdown from "@/components/common/SmartPdfPickerDropdown";
import { DocumentRepoItem } from "@/lib/documentRepository";

// 4 Primary Question Types required by BTEB & NCTB Examination Pattern
export type WrittenQuestionType = "mcq" | "very_short" | "short" | "broad";

export const QUESTION_TYPE_LABELS: Record<
  WrittenQuestionType,
  { nameBangla: string; code: string; defaultMarks: number; defaultSectionTitle: string }
> = {
  mcq: {
    nameBangla: "১. বহুনির্বাচনী প্রশ্ন (MCQ)",
    code: "MCQ",
    defaultMarks: 0.5,
    defaultSectionTitle: "১। বহুনির্বাচনী প্রশ্ন (সকল প্রশ্নের উত্তর আবশ্যক)",
  },
  very_short: {
    nameBangla: "২. অতি সংক্ষিপ্ত প্রশ্ন (Very Short)",
    code: "VERY_SHORT",
    defaultMarks: 1.0,
    defaultSectionTitle: "২। অতি সংক্ষিপ্ত প্রশ্ন (যেকোনো ৫টি প্রশ্নের উত্তর দাও)",
  },
  short: {
    nameBangla: "৩. সংক্ষিপ্ত প্রশ্ন (Short Answer)",
    code: "SHORT",
    defaultMarks: 2.5,
    defaultSectionTitle: "৩। সংক্ষিপ্ত প্রশ্ন (যেকোনো ৪টি প্রশ্নের উত্তর দাও)",
  },
  broad: {
    nameBangla: "৪. রচনামূলক / সৃজনশীল প্রশ্ন (Broad / Essay)",
    code: "BROAD",
    defaultMarks: 12.5,
    defaultSectionTitle: "৪। রচনামূলক / সৃজনশীল প্রশ্ন (উদ্দীপকসহ ক, খ, গ, ঘ)",
  },
};

export interface WrittenQuestionSubpart {
  id: string;
  label: string; // "ক", "খ", "গ", "ঘ", "ঙ"
  questionText: string;
  marks: number; // Decimal float e.g. 0.5, 1.0, 1.5, 2.5, 3.5, 5.0
}

export interface WrittenQuestion {
  id: string;
  sectionTitle?: string;
  type: WrittenQuestionType;
  stimulusText?: string; // উদ্দীপক
  questionText: string;
  options?: string[]; // for MCQ (ক, খ, গ, ঘ)
  correctAnswer?: string;
  subparts?: WrittenQuestionSubpart[];
  marks: number; // Float/decimal e.g. 0.5, 1.0, 1.5, 2.5, 5.0, 10.0, 12.5
  chapterOrTopic?: string;
}

export interface SavedQuestionPaper {
  id: string;
  title: string;
  examType: string;
  academicYear: string;
  classId: number;
  className: string;
  section?: string;
  tradeCode?: string;
  tradeName?: string;
  subjectCode: string;
  subjectName: string;
  examDate?: string;
  durationMinutes: number;
  fullMarks: number;
  passMarks?: number;
  instructions: string[];
  questions: WrittenQuestion[];
  status: "draft" | "finalized";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Sample Master Question Bank Database
const DEFAULT_QUESTION_BANK: WrittenQuestion[] = [
  {
    id: "qb-1",
    type: "mcq",
    sectionTitle: "১। বহুনির্বাচনী প্রশ্ন",
    questionText: "কম্পিউটার নেটওয়ার্কের প্রধান ট্রান্সমিশন কন্ট্রোল প্রটোকল কোনটি?",
    options: ["TCP/IP", "HTTP", "FTP", "SMTP"],
    correctAnswer: "TCP/IP",
    marks: 0.5,
    chapterOrTopic: "অধ্যায় ১: নেটওয়ার্কিং",
  },
  {
    id: "qb-2",
    type: "mcq",
    sectionTitle: "১। বহুনির্বাচনী প্রশ্ন",
    questionText: "আইওটি (IoT) সিস্টেমে পরিবেশ থেকে অ্যানালগ তথ্য সংগ্রাহক উপাদান কোনটি?",
    options: ["সেন্সর (Sensor)", "অ্যাকচুয়েটর", "রাউটার", "সুইচ"],
    correctAnswer: "সেন্সর (Sensor)",
    marks: 0.5,
    chapterOrTopic: "অধ্যায় ২: আইওটি পরিচিতি",
  },
  {
    id: "qb-3",
    type: "very_short",
    sectionTitle: "২। অতি সংক্ষিপ্ত প্রশ্ন",
    questionText: "রাউটার ও সুইচের মধ্যে মূল ১টি কারিগরি পার্থক্য লিখ।",
    marks: 1.0,
    chapterOrTopic: "অধ্যায় ১: নেটওয়ার্ক ডিভাইস",
  },
  {
    id: "qb-4",
    type: "very_short",
    sectionTitle: "২। অতি সংক্ষিপ্ত প্রশ্ন",
    questionText: "অপারেটিং সিস্টেম (OS)-এর মূল ২টি কাজ উল্লেখ কর।",
    marks: 1.0,
    chapterOrTopic: "অধ্যায় ৩: সিস্টেম সফটওয়্যার",
  },
  {
    id: "qb-5",
    type: "short",
    sectionTitle: "৩। সংক্ষিপ্ত প্রশ্ন",
    questionText: "ইএসপি-৩২ আর্ডুইনো বোর্ডের ২টি প্রধান সুবিধা ও ১টি সীমাবদ্ধতা সংক্ষেপে আলোচনা কর।",
    marks: 2.5,
    chapterOrTopic: "অধ্যায় ৪: ইএসপি-৩২ কন্ট্রোলার",
  },
  {
    id: "qb-6",
    type: "short",
    sectionTitle: "৩। সংক্ষিপ্ত প্রশ্ন",
    questionText: "স্টার ট্রপোলজি ও মেশ টপোলজির মধ্যে পার্থক্য ও ডায়াগ্রাম আঁক।",
    marks: 2.5,
    chapterOrTopic: "অধ্যায় ১: নেটওয়ার্ক টপোলজি",
  },
  {
    id: "qb-7",
    type: "broad",
    sectionTitle: "৪। রচনামূলক / সৃজনশীল প্রশ্ন",
    stimulusText: "উদ্দীপক: পঞ্চগড় সরকারি টিএসসি-র ল্যাব ২০১-এ একটি সোলার চালিত স্বয়ংক্রিয় সেচ ব্যবস্থা স্থাপন করা হয়েছে। সেন্সর মাটির আর্দ্রতা মেপে পানির পাম্প চালু বা বন্ধ করে।",
    questionText: "উদ্দীপকের তথ্য বিশ্লেষণ করে নিচের প্রশ্নগুলোর উত্তর দাও:",
    subparts: [
      { id: "sub-1", label: "ক", questionText: "সেচ সেন্সর কি?", marks: 1.5 },
      { id: "sub-2", label: "খ", questionText: "মাইক্রোকন্ট্রোলার ও মাইক্রোপ্রসেসরের প্রধান পার্থক্য ব্যাখ্যা কর।", marks: 2.5 },
      { id: "sub-3", label: "গ", questionText: "উদ্দীপকের সোলার সেচ সার্কিটের মূল ব্লক ডায়াগ্রাম চিত্রসহ বর্ণনা কর।", marks: 3.5 },
      { id: "sub-4", label: "ঘ", questionText: "কৃষি ক্ষেত্রে এই সোলার আইওটি প্রযুক্তির প্রয়োগের যৌক্তিকতা বিশ্লেষণ কর।", marks: 5.0 },
    ],
    marks: 12.5,
    chapterOrTopic: "অধ্যায় ৫: স্মার্ট কৃষি প্রজেক্ট",
  },
];

export default function WrittenQuestionPaperBuilder() {
  const [activeTab, setActiveTab] = useState<"builder" | "saved">("builder");
  const [creationMethod, setCreationMethod] = useState<"ai" | "bank" | "manual" | "pdf" | "paste">("ai");

  // Exam Header Configuration
  const [examConfig, setExamConfig] = useState({
    title: "অর্ধবার্ষিক মূল্যায়ন পরীক্ষা ২০২৬",
    examType: "Half-Yearly Examination",
    academicYear: "2026",
    classId: 4, // Class 9
    className: "Class 9 (SSC Vocational)",
    section: "A",
    tradeCode: "IT-IOT",
    tradeName: "আইটি সাপোর্ট অ্যান্ড আইওটি",
    subjectCode: "IT-901",
    subjectName: "IT Support Fundamentals & OS",
    subjectNameBangla: "আইটি সাপোর্ট ফান্ডামেন্টালস ও ওএস",
    examDate: "2026-06-15",
    durationMinutes: 180,
    fullMarks: 50,
    passMarks: 16.5,
    instructions: [
      "দ্রষ্টব্য: সকল প্রশ্নের মান সমান। ডানপাশের সংখ্যা প্রশ্নের পূর্ণমান নির্দেশ করে।",
      "ক-বিভাগ হতে সকল বহুনির্বাচনী এবং খ, গ ও ঘ-বিভাগ হতে প্রয়োজনীয় সংখ্যক প্রশ্নের উত্তর দাও।",
    ],
  });

  // Granular AI Question Count & Marks Allocation Configuration
  const [aiConfig, setAiConfig] = useState({
    mcqCount: 5,
    mcqMarks: 0.5,
    veryShortCount: 5,
    veryShortMarks: 1.0,
    shortCount: 4,
    shortMarks: 2.5,
    broadCount: 2,
    broadMarks: 12.5,
  });

  // Calculate requested counts and total marks
  const totalRequestedCount = useMemo(() => {
    return (
      (Number(aiConfig.mcqCount) || 0) +
      (Number(aiConfig.veryShortCount) || 0) +
      (Number(aiConfig.shortCount) || 0) +
      (Number(aiConfig.broadCount) || 0)
    );
  }, [aiConfig]);

  const totalRequestedMarks = useMemo(() => {
    return Number(
      (
        (Number(aiConfig.mcqCount) || 0) * (Number(aiConfig.mcqMarks) || 0) +
        (Number(aiConfig.veryShortCount) || 0) * (Number(aiConfig.veryShortMarks) || 0) +
        (Number(aiConfig.shortCount) || 0) * (Number(aiConfig.shortMarks) || 0) +
        (Number(aiConfig.broadCount) || 0) * (Number(aiConfig.broadMarks) || 0)
      ).toFixed(2)
    );
  }, [aiConfig]);

  // Sample Demo Question Paper Set for Quick Preview
  const SAMPLE_DEMO_QUESTIONS: WrittenQuestion[] = [
    {
      id: "demo-q-1",
      sectionTitle: "১। বহুনির্বাচনী প্রশ্ন (১০ × ০.৫ = ৫ নম্বর)",
      type: "mcq",
      questionText: "১.১. কম্পিউটার নেটওয়ার্কের প্রধান প্রটোকল কোনটি?",
      options: ["TCP/IP", "HTTP", "FTP", "SMTP"],
      correctAnswer: "TCP/IP",
      marks: 0.5,
      chapterOrTopic: "অধ্যায় ১: নেটওয়ার্কিং",
    },
    {
      id: "demo-q-2",
      sectionTitle: "১। বহুনির্বাচনী প্রশ্ন (১০ × ০.৫ = ৫ নম্বর)",
      type: "mcq",
      questionText: "১.২. আইওটি (IoT) সিস্টেমে পরিবেশ থেকে তথ্য সংগ্রাহক উপাদান কোনটি?",
      options: ["সেন্সর (Sensor)", "অ্যাকচুয়েটর", "রাউটার", "সুইচ"],
      correctAnswer: "সেন্সর (Sensor)",
      marks: 0.5,
      chapterOrTopic: "অধ্যায় ২: আইওটি পরিচিতি",
    },
    {
      id: "demo-q-3",
      sectionTitle: "২। অতি সংক্ষিপ্ত প্রশ্ন (৫ × ১.০ = ৫ নম্বর)",
      type: "very_short",
      questionText: "২.১. রাউটার ও সুইচের মধ্যে মূল ১টি কারিগরি পার্থক্য লিখ।",
      marks: 1.0,
      chapterOrTopic: "অধ্যায় ১: নেটওয়ার্ক ডিভাইস",
    },
    {
      id: "demo-q-4",
      sectionTitle: "৩। সংক্ষিপ্ত প্রশ্ন (৪ × ২.৫ = ১০ নম্বর)",
      type: "short",
      questionText: "৩.১. ইএসপি-৩২ আর্ডুইনো বোর্ডের ২টি প্রধান সুবিধা ও ১টি সীমাবদ্ধতা সংক্ষেপে আলোচনা কর।",
      marks: 2.5,
      chapterOrTopic: "অধ্যায় ৩: ইএসপি-৩২ কন্ট্রোলার",
    },
    {
      id: "demo-q-5",
      sectionTitle: "৪। রচনামূলক / সৃজনশীল প্রশ্ন (২ × ১২.৫ = ২৫ নম্বর)",
      type: "broad",
      stimulusText: "উদ্দীপক: পঞ্চগড় সরকারি টিএসসি-র ল্যাব ২০১-এ একটি সোলার চালিত স্বয়ংক্রিয় সেচ ব্যবস্থা স্থাপন করা হয়েছে। সেন্সর মাটির আর্দ্রতা মেপে পানির পাম্প চালু বা বন্ধ করে।",
      questionText: "৪.১. উদ্দীপকের তথ্য বিশ্লেষণ করে নিচের প্রশ্নগুলোর উত্তর দাও:",
      subparts: [
        { id: "demo-sub-1", label: "ক", questionText: "সেচ সেন্সর কি?", marks: 1.5 },
        { id: "demo-sub-2", label: "খ", questionText: "মাইক্রোকন্ট্রোলার ও মাইক্রোপ্রসেসরের প্রধান পার্থক্য ব্যাখ্যা কর।", marks: 2.5 },
        { id: "demo-sub-3", label: "গ", questionText: "উদ্দীপকের সোলার সেচ সার্কিটের মূল ব্লক ডায়াগ্রাম চিত্রসহ বর্ণনা কর।", marks: 3.5 },
        { id: "demo-sub-4", label: "ঘ", questionText: "কৃষি ক্ষেত্রে এই সোলার আইওটি প্রযুক্তির প্রয়োগের যৌক্তিকতা বিশ্লেষণ কর।", marks: 5.0 },
      ],
      marks: 12.5,
      chapterOrTopic: "অধ্যায় ৪: স্মার্ট সেচ প্রকল্প",
    },
  ];

  // Current Active Question List on Paper Canvas (Empty initially as required)
  const [questions, setQuestions] = useState<WrittenQuestion[]>([]);

  // Load Demo Questions Handler
  const handleLoadDemoQuestions = () => {
    setQuestions(SAMPLE_DEMO_QUESTIONS);
  };

  // Master Question Bank & Saved Papers State
  const [questionBank, setQuestionBank] = useState<WrittenQuestion[]>(DEFAULT_QUESTION_BANK);
  const [savedPapers, setSavedPapers] = useState<SavedQuestionPaper[]>([]);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [pdfTextContent, setPdfTextContent] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [previewPrintModal, setPreviewPrintModal] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [bankTypeFilter, setBankTypeFilter] = useState<string>("all");

  // Draft AI Questions Staging Area for Review before Inserting into Paper
  const [draftGeneratedQuestions, setDraftGeneratedQuestions] = useState<WrittenQuestion[]>([]);
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [showDraftReviewModal, setShowDraftReviewModal] = useState(false);

  // Modal State for Editing Question (Works both on Paper Canvas and Draft Review Staging)
  const [editingQuestion, setEditingQuestion] = useState<WrittenQuestion | null>(null);
  const [editingContext, setEditingQuestionContext] = useState<"canvas" | "draft">("canvas");

  // Manual Form State with MCQ options and subparts
  const [manualForm, setManualForm] = useState<{
    type: WrittenQuestionType;
    sectionTitle: string;
    questionText: string;
    stimulusText: string;
    options: string[];
    correctAnswer: string;
    marks: number;
    subparts: WrittenQuestionSubpart[];
  }>({
    type: "short",
    sectionTitle: QUESTION_TYPE_LABELS.short.defaultSectionTitle,
    questionText: "",
    stimulusText: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    marks: 2.5,
    subparts: [
      { id: "s1", label: "ক", questionText: "", marks: 1.5 },
      { id: "s2", label: "খ", questionText: "", marks: 2.5 },
      { id: "s3", label: "গ", questionText: "", marks: 3.5 },
      { id: "s4", label: "ঘ", questionText: "", marks: 5.0 },
    ],
  });

  // Calculate Exact Decimal Total Marks on Paper Canvas
  const calculatedTotalMarks = useMemo(() => {
    const total = questions.reduce((sum, q) => {
      if (q.subparts && q.subparts.length > 0) {
        const subSum = q.subparts.reduce((s, sub) => s + (Number(sub.marks) || 0), 0);
        return sum + subSum;
      }
      return sum + (Number(q.marks) || 0);
    }, 0);
    return Number(total.toFixed(2));
  }, [questions]);

  // Type-wise Question Breakdown Summary
  const typeSummary = useMemo(() => {
    const summary: Record<
      WrittenQuestionType,
      { count: number; totalMarks: number; label: string }
    > = {
      mcq: { count: 0, totalMarks: 0, label: "১. বহুনির্বাচনী" },
      very_short: { count: 0, totalMarks: 0, label: "২. অতি সংক্ষিপ্ত" },
      short: { count: 0, totalMarks: 0, label: "৩. সংক্ষিপ্ত" },
      broad: { count: 0, totalMarks: 0, label: "৪. রচনামূলক/সৃজনশীল" },
    };

    questions.forEach((q) => {
      const qType = (q.type || "short") as WrittenQuestionType;
      const qMarks =
        q.subparts && q.subparts.length > 0
          ? q.subparts.reduce((s, sub) => s + (Number(sub.marks) || 0), 0)
          : Number(q.marks) || 0;

      if (summary[qType]) {
        summary[qType].count += 1;
        summary[qType].totalMarks += qMarks;
      }
    });

    (Object.keys(summary) as WrittenQuestionType[]).forEach((key) => {
      summary[key].totalMarks = Number(summary[key].totalMarks.toFixed(2));
    });

    return summary;
  }, [questions]);

  // Handle Class selection update
  const handleClassChange = (cId: number) => {
    const cls = ACADEMIC_CLASSES.find((c) => c.id === cId);
    const trades = getApplicableTradesForClass(cId);
    const subjects = getSubjectsForClass(cId, trades[0]?.code);

    setExamConfig((prev) => ({
      ...prev,
      classId: cId,
      className: cls ? cls.nameBangla : `Class ${cId}`,
      tradeCode: trades[0]?.code || "",
      tradeName: trades[0]?.nameBangla || "",
      subjectCode: subjects[0]?.code || "101",
      subjectName: subjects[0]?.name || "Subject",
      subjectNameBangla: subjects[0]?.nameBangla || "বিষয়",
    }));
  };

  // AI Question Generator Handler with Custom Type Breakdown & Staging Review
  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    let generatedSuccessfully = false;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `তুমি বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) ও এনসিটিবি (NCTB) কারিকুলামের জন্য লিখিত পরীক্ষা প্রশ্নপত্র প্রণেতা।
          
          শ্রেণি: ${examConfig.className}
          বিষয়: ${examConfig.subjectNameBangla} (${examConfig.subjectCode})
          টপিক/সিলেবাস: ${aiPrompt}
          
          প্রশ্নপত্র তৈরির জন্য নির্দিষ্ট সংখ্যা ও মান বন্টন:
          ১. "mcq" (বহুনির্বাচনী): ${aiConfig.mcqCount}টি (প্রতিটি ${aiConfig.mcqMarks} নম্বর)
          ২. "very_short" (অতি সংক্ষিপ্ত): ${aiConfig.veryShortCount}টি (প্রতিটি ${aiConfig.veryShortMarks} নম্বর)
          ৩. "short" (সংক্ষিপ্ত): ${aiConfig.shortCount}টি (প্রতিটি ${aiConfig.shortMarks} নম্বর)
          ৪. "broad" (রচনামূলক/সৃজনশীল): ${aiConfig.broadCount}টি (প্রতিটি ${aiConfig.broadMarks} নম্বর, উদ্দীপকসহ ক, খ, গ, ঘ সাব-প্রশ্ন)
          
          JSON ফরম্যাটে মোট ${totalRequestedCount}টি নতুন প্রশ্ন রেসপন্স দাও:
          [
            {
              "type": "mcq",
              "sectionTitle": "১। বহুনির্বাচনী প্রশ্ন (MCQ)",
              "questionText": "বহুনির্বাচনী প্রশ্ন টেক্সট...",
              "options": ["বিকল্প ১", "বিকল্প ২", "বিকল্প ৩", "বিকল্প ৪"],
              "correctAnswer": "বিকল্প ১",
              "marks": ${aiConfig.mcqMarks}
            },
            {
              "type": "very_short",
              "sectionTitle": "২। অতি সংক্ষিপ্ত প্রশ্ন",
              "questionText": "অতি সংক্ষিপ্ত প্রশ্ন টেক্সট...",
              "marks": ${aiConfig.veryShortMarks}
            },
            {
              "type": "short",
              "sectionTitle": "৩। সংক্ষিপ্ত প্রশ্ন",
              "questionText": "সংক্ষিপ্ত প্রশ্ন টেক্সট...",
              "marks": ${aiConfig.shortMarks}
            },
            {
              "type": "broad",
              "sectionTitle": "৪। রচনামূলক প্রশ্ন",
              "stimulusText": "উদ্দীপক বা বাস্তব বিষয়বস্তু টেক্সট...",
              "questionText": "উদ্দীপকটি পড়ে নিচের প্রশ্নগুলোর উত্তর দাও:",
              "subparts": [
                {"label": "ক", "questionText": "জ্ঞানমূলক প্রশ্ন...", "marks": 1.5},
                {"label": "খ", "questionText": "অনুধাবনমূলক প্রশ্ন...", "marks": 2.5},
                {"label": "গ", "questionText": "প্রয়োগমূলক প্রশ্ন...", "marks": 3.5},
                {"label": "ঘ", "questionText": "উচ্চতর দক্ষতা প্রশ্ন...", "marks": 5.0}
              ],
              "marks": ${aiConfig.broadMarks}
            }
          ]`,
        }),
      });

      if (res && res.ok) {
        const json = await res.json();
        if (json && json.text) {
          const cleanText = json.text.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const formattedNewQuestions: WrittenQuestion[] = parsed.map((item, idx) => {
              const subSum = item.subparts
                ? item.subparts.reduce((s: number, sp: any) => s + (parseFloat(sp.marks) || 0), 0)
                : undefined;

              return {
                id: `ai-q-${Date.now()}-${idx}`,
                type: ["mcq", "very_short", "short", "broad"].includes(item.type) ? item.type : "short",
                sectionTitle: item.sectionTitle || QUESTION_TYPE_LABELS[item.type as WrittenQuestionType]?.defaultSectionTitle || "প্রশ্নাবলী",
                stimulusText: item.stimulusText,
                questionText: item.questionText,
                options: item.options,
                correctAnswer: item.correctAnswer,
                subparts: item.subparts
                  ? item.subparts.map((s: any, sIdx: number) => ({
                      id: `sub-${idx}-${sIdx}`,
                      label: s.label || ["ক", "খ", "গ", "ঘ", "ঙ"][sIdx],
                      questionText: s.questionText,
                      marks: parseFloat(s.marks) || 1.0,
                    }))
                  : undefined,
                marks: subSum !== undefined ? subSum : parseFloat(item.marks) || 2.5,
              };
            });

            setDraftGeneratedQuestions(formattedNewQuestions);
            setSelectedDraftIds(formattedNewQuestions.map((q) => q.id));
            setShowDraftReviewModal(true);
            generatedSuccessfully = true;
          }
        }
      }
    } catch {
      // Silent fallback
    }

    if (!generatedSuccessfully) {
      const timestamp = Date.now();
      const topicTitle = aiPrompt.length > 30 ? aiPrompt.substring(0, 30) + "..." : aiPrompt;
      const fallbackSet: WrittenQuestion[] = [];

      // 1. Generate MCQ questions
      for (let i = 0; i < aiConfig.mcqCount; i++) {
        fallbackSet.push({
          id: `fallback-mcq-${timestamp}-${i}`,
          type: "mcq",
          sectionTitle: "১। বহুনির্বাচনী প্রশ্ন (MCQ)",
          questionText: `${topicTitle} বিষয়ের ${toBengaliNumerals(i + 1)}নং বহুনির্বাচনী প্রশ্ন: নিম্নের কোনটি সত্য?`,
          options: ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "সবকয়টি"],
          correctAnswer: "সবকয়টি",
          marks: aiConfig.mcqMarks,
          chapterOrTopic: topicTitle,
        });
      }

      // 2. Generate Very Short questions
      for (let i = 0; i < aiConfig.veryShortCount; i++) {
        fallbackSet.push({
          id: `fallback-vs-${timestamp}-${i}`,
          type: "very_short",
          sectionTitle: "২। অতি সংক্ষিপ্ত প্রশ্ন",
          questionText: `${topicTitle} প্রক্রিয়ার ${toBengaliNumerals(i + 1)}নং অতি সংক্ষিপ্ত সংজ্ঞা লিখ।`,
          marks: aiConfig.veryShortMarks,
          chapterOrTopic: topicTitle,
        });
      }

      // 3. Generate Short questions
      for (let i = 0; i < aiConfig.shortCount; i++) {
        fallbackSet.push({
          id: `fallback-short-${timestamp}-${i}`,
          type: "short",
          sectionTitle: "৩। সংক্ষিপ্ত প্রশ্ন",
          questionText: `${topicTitle}-এর ${toBengaliNumerals(i + 1)}নং সংক্ষিপ্ত কারিগরি সুবিধা আলোচনা কর।`,
          marks: aiConfig.shortMarks,
          chapterOrTopic: topicTitle,
        });
      }

      // 4. Generate Creative / Broad questions
      for (let i = 0; i < aiConfig.broadCount; i++) {
        fallbackSet.push({
          id: `fallback-broad-${timestamp}-${i}`,
          type: "broad",
          sectionTitle: "৪। রচনামূলক / সৃজনশীল প্রশ্ন",
          stimulusText: `উদ্দীপক ${toBengaliNumerals(i + 1)}: পঞ্চগড় সরকারি টিএসসি-র ল্যাবে ${topicTitle} সম্পর্কিত প্র্যাকটিক্যাল প্রজেক্ট।`,
          questionText: "উপরোক্ত উদ্দীপকের আলোকে প্রশ্নগুলোর উত্তর দাও:",
          subparts: [
            { id: `sb-1-${timestamp}-${i}`, label: "ক", questionText: "মৌলিক সংজ্ঞা দাও।", marks: 1.5 },
            { id: `sb-2-${timestamp}-${i}`, label: "খ", questionText: "কার্যপ্রক্রিয়া সংক্ষেপে ব্যাখ্যা কর।", marks: 2.5 },
            { id: `sb-3-${timestamp}-${i}`, label: "গ", questionText: "সার্কিট/ব্লক ডায়াগ্রাম বর্ণনা কর।", marks: 3.5 },
            { id: `sb-4-${timestamp}-${i}`, label: "ঘ", questionText: "বাস্তব প্রয়োগ ও যৌক্তিকতা বিশ্লেষণ কর।", marks: 5.0 },
          ],
          marks: aiConfig.broadMarks,
          chapterOrTopic: topicTitle,
        });
      }

      setDraftGeneratedQuestions(fallbackSet);
      setSelectedDraftIds(fallbackSet.map((q) => q.id));
      setShowDraftReviewModal(true);
    }

    setIsAiGenerating(false);
  };

  // Confirm and Insert Selected Draft AI Questions into Paper Canvas
  const handleConfirmInsertDrafts = () => {
    const selectedQuestions = draftGeneratedQuestions.filter((q) =>
      selectedDraftIds.includes(q.id)
    );
    if (selectedQuestions.length === 0) {
      alert("অনুগ্রহ করে অন্তত ১টি প্রশ্ন নির্বাচন করুন!");
      return;
    }

    setQuestions((prev) => [...prev, ...selectedQuestions]);
    setShowDraftReviewModal(false);
    setDraftGeneratedQuestions([]);
    setSelectedDraftIds([]);
    alert(`সফলভাবে ${toBengaliNumerals(selectedQuestions.length)}টি রিভিউকৃত প্রশ্ন প্রশ্নপত্রে ইনসার্ট করা হয়েছে!`);
  };

  // Add Manual Question Handler
  const handleAddManualQuestion = () => {
    if (!manualForm.questionText?.trim()) return;

    let qMarks = parseFloat(String(manualForm.marks)) || 2.5;
    let finalSubparts = undefined;
    let finalOptions = undefined;

    if (manualForm.type === "mcq") {
      finalOptions = manualForm.options.filter((o) => o.trim() !== "");
    } else if (manualForm.type === "broad" && manualForm.subparts && manualForm.subparts.length > 0) {
      finalSubparts = manualForm.subparts.map((sp) => ({
        ...sp,
        marks: parseFloat(String(sp.marks)) || 1.0,
      }));
      qMarks = finalSubparts.reduce((sum, sp) => sum + sp.marks, 0);
    }

    const newQ: WrittenQuestion = {
      id: `manual-${Date.now()}`,
      type: manualForm.type,
      sectionTitle: manualForm.sectionTitle || QUESTION_TYPE_LABELS[manualForm.type].defaultSectionTitle,
      stimulusText: manualForm.stimulusText,
      questionText: manualForm.questionText,
      options: finalOptions,
      correctAnswer: manualForm.correctAnswer,
      subparts: finalSubparts,
      marks: qMarks,
    };

    setQuestions((prev) => [...prev, newQ]);
    setQuestionBank((prev) => [newQ, ...prev]);

    setManualForm({
      type: "short",
      sectionTitle: QUESTION_TYPE_LABELS.short.defaultSectionTitle,
      questionText: "",
      stimulusText: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      marks: 2.5,
      subparts: [
        { id: `s-${Date.now()}-1`, label: "ক", questionText: "", marks: 1.5 },
        { id: `s-${Date.now()}-2`, label: "খ", questionText: "", marks: 2.5 },
        { id: `s-${Date.now()}-3`, label: "গ", questionText: "", marks: 3.5 },
        { id: `s-${Date.now()}-4`, label: "ঘ", questionText: "", marks: 5.0 },
      ],
    });
    alert("প্রশ্ন সফলভাবে প্রশ্নপত্রে ও কোশ্চেন ব্যাংকে যুক্ত করা হয়েছে!");
  };

  // Move Question Up/Down on Canvas
  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIndex];
    newQuestions[targetIndex] = temp;
    setQuestions(newQuestions);
  };

  // Duplicate Question
  const handleDuplicateQuestion = (q: WrittenQuestion) => {
    const duplicated: WrittenQuestion = {
      ...q,
      id: `dup-${Date.now()}`,
      questionText: `${q.questionText} (অনুরুপ)`,
    };
    setQuestions((prev) => [...prev, duplicated]);
  };

  // Update Question Decimal Marks directly
  const handleUpdateQuestionMarks = (id: string, newMarks: number, isDraft = false) => {
    const updateFn = (qList: WrittenQuestion[]) =>
      qList.map((q) => (q.id === id ? { ...q, marks: Number(newMarks) } : q));

    if (isDraft) {
      setDraftGeneratedQuestions(updateFn);
    } else {
      setQuestions(updateFn);
    }
  };

  // Update Subpart Marks directly
  const handleUpdateSubpartMarks = (questionId: string, subpartId: string, newMarks: number, isDraft = false) => {
    const updateFn = (qList: WrittenQuestion[]) =>
      qList.map((q) => {
        if (q.id === questionId && q.subparts) {
          const updatedSubparts = q.subparts.map((s) =>
            s.id === subpartId ? { ...s, marks: Number(newMarks) } : s
          );
          const newTotal = updatedSubparts.reduce((sum, s) => sum + s.marks, 0);
          return {
            ...q,
            subparts: updatedSubparts,
            marks: Number(newTotal.toFixed(2)),
          };
        }
        return q;
      });

    if (isDraft) {
      setDraftGeneratedQuestions(updateFn);
    } else {
      setQuestions(updateFn);
    }
  };

  // Save Question Paper
  const handleSavePaper = () => {
    const newPaper: SavedQuestionPaper = {
      id: `paper-${Date.now()}`,
      title: examConfig.title,
      examType: examConfig.examType,
      academicYear: examConfig.academicYear,
      classId: examConfig.classId,
      className: examConfig.className,
      section: examConfig.section,
      tradeCode: examConfig.tradeCode,
      tradeName: examConfig.tradeName,
      subjectCode: examConfig.subjectCode,
      subjectName: examConfig.subjectNameBangla,
      examDate: examConfig.examDate,
      durationMinutes: examConfig.durationMinutes,
      fullMarks: examConfig.fullMarks,
      passMarks: examConfig.passMarks,
      instructions: examConfig.instructions,
      questions: questions,
      status: "finalized",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "Engr. Md. Rafiqul Islam (Principal)",
    };

    setSavedPapers((prev) => [newPaper, ...prev]);
    alert("প্রশ্নপত্র সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!");
  };

  // Filter Question Bank
  const filteredBank = useMemo(() => {
    return questionBank.filter((q) => {
      const matchesSearch =
        !bankSearchQuery ||
        q.questionText.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
        q.chapterOrTopic?.toLowerCase().includes(bankSearchQuery.toLowerCase());
      const matchesType = bankTypeFilter === "all" || q.type === bankTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [questionBank, bankSearchQuery, bankTypeFilter]);

  return (
    <div className="space-y-6">
      {/* CSS Print Styles for standard A4 Bangladesh Examination Paper */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-paper-canvas,
          #printable-paper-canvas * {
            visibility: visible;
          }
          #printable-paper-canvas {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl border border-indigo-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-cyan-300">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                AI প্রশ্ন রিভিউ, কাস্টম সংখ্যা ও ফ্র্যাকশনাল মার্কস
              </span>
              <span className="text-xs text-slate-400">পঞ্চগড় সরকারি টিএসসি</span>
            </div>
            <h1 className="text-xl font-black text-white mt-1">
              লিখিত প্রশ্নপত্র বিল্ডার (Written Question Paper Studio)
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              এমসিকিউ, অতি সংক্ষিপ্ত, সংক্ষিপ্ত ও সৃজনশীল প্রশ্নের নির্দিষ্ট সংখ্যা, নম্বর ও AI জেনারেটেড রিভিউ এবং লাইভ এডিট
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "builder"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>প্রশ্নপত্র স্টুডিও</span>
          </button>

          <button
            onClick={() => setActiveTab("saved")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "saved"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>সংরক্ষিত প্রশ্নপত্র ({toBengaliNumerals(savedPapers.length)})</span>
          </button>
        </div>
      </div>

      {/* Main Mode: Builder */}
      {activeTab === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Exam Details & Creation Method Controls */}
          <div className="lg:col-span-5 space-y-6">
            {/* Step 1: Exam Header Card */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                <Settings className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>১. পরীক্ষার তথ্য ও প্রাতিষ্ঠানিক কনফিগারেশন</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পরীক্ষার শিরোনাম (Exam Title) *
                  </label>
                  <input
                    type="text"
                    value={examConfig.title}
                    onChange={(e) => setExamConfig({ ...examConfig, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <AcademicFilterBar
                    filter={{
                      session: examConfig.academicYear,
                      classId: String(examConfig.classId),
                      tradeId: (() => {
                        const t = ALL_TRADES.find((tr) => tr.code === examConfig.tradeCode);
                        return t ? String(t.id) : "";
                      })(),
                      tradeCode: examConfig.tradeCode || "",
                      section: "all",
                      department: "all"
                    }}
                    onChange={(newFilter) => {
                      const cId = Number(newFilter.classId);
                      const matchedClass = ACADEMIC_CLASSES.find((c) => c.id === cId);
                      const trades = getApplicableTradesForClass(cId);
                      const subjects = getSubjectsForClass(cId, trades[0]?.code);
                      
                      let newTradeCode = "";
                      let newTradeName = "";
                      if (newFilter.tradeId && newFilter.tradeId !== "all") {
                        const matchedTrade = ALL_TRADES.find((t) => String(t.id) === String(newFilter.tradeId));
                        if (matchedTrade) {
                          newTradeCode = matchedTrade.code;
                          newTradeName = matchedTrade.nameBangla;
                        }
                      } else if (trades.length > 0) {
                        newTradeCode = trades[0].code;
                        newTradeName = trades[0].nameBangla;
                      }

                      setExamConfig({
                        ...examConfig,
                        classId: cId,
                        className: matchedClass ? matchedClass.nameBangla : `Class ${cId}`,
                        tradeCode: newTradeCode,
                        tradeName: newTradeName,
                        subjectCode: subjects[0]?.code || "101",
                        subjectName: subjects[0]?.name || "Subject",
                        subjectNameBangla: subjects[0]?.nameBangla || "বিষয়",
                      });
                    }}
                    showSession={false}
                    showDepartment={false}
                    showSection={false}
                    compact={true}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    বিষয় নির্বাচন (Subject) *
                  </label>
                  <select
                    value={examConfig.subjectCode}
                    onChange={(e) => {
                      const subCode = e.target.value;
                      const subs = getSubjectsForClass(examConfig.classId, examConfig.tradeCode);
                      const found = subs.find((s) => s.code === subCode);
                      if (found) {
                        setExamConfig({
                          ...examConfig,
                          subjectCode: found.code,
                          subjectName: found.name,
                          subjectNameBangla: found.nameBangla,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    {getSubjectsForClass(examConfig.classId, examConfig.tradeCode).map((s) => (
                      <option key={s.id} value={s.code}>
                        {s.nameBangla} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      সময় (মিনিট)
                    </label>
                    <input
                      type="number"
                      value={examConfig.durationMinutes}
                      onChange={(e) => setExamConfig({ ...examConfig, durationMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      পূর্ণমান (Full)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={examConfig.fullMarks}
                      onChange={(e) => setExamConfig({ ...examConfig, fullMarks: parseFloat(e.target.value) || 50 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-center font-bold text-indigo-600 dark:text-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      উত্তীর্ণ মান
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={examConfig.passMarks}
                      onChange={(e) => setExamConfig({ ...examConfig, passMarks: parseFloat(e.target.value) || 16.5 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Question Creation Methods */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>২. প্রশ্ন তৈরির পদ্ধতি নির্বাচন করুন</span>
              </div>

              {/* Method Switcher Tabs */}
              <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                {[
                  { id: "ai", label: "AI জেনারেটর", icon: Sparkles },
                  { id: "bank", label: "প্রশ্ন ব্যাংক", icon: BookOpen },
                  { id: "manual", label: "ম্যানুয়াল", icon: Plus },
                  { id: "pdf", label: "PDF এক্সট্র্যাক্ট", icon: FileUp },
                  { id: "paste", label: "কপি-পেস্ট", icon: ClipboardList },
                ].map((m) => {
                  const Icon = m.icon;
                  const isActive = creationMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setCreationMethod(m.id as any)}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* METHOD 1: AI GENERATOR WITH GRANULAR TYPE COUNTS & MARKS CONFIG */}
              {creationMethod === "ai" && (
                <div className="space-y-4 text-xs">
                  {/* Smart PDF Auto-Detection Hub */}
                  <SmartPdfPickerDropdown
                    classId={String(examConfig.classId)}
                    tradeCode={examConfig.tradeCode}
                    onSelectDocument={(doc: DocumentRepoItem) => {
                      setAiPrompt(doc.extractedTextSnippet);
                    }}
                    onClearDocument={() => {
                      setAiPrompt("");
                    }}
                  />

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      AI প্রম্পট / টপিক বা অধ্যায়ের বিবরণ লিখুন:
                    </label>
                    <textarea
                      rows={2}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="যেমন: কম্পিউটার নেটওয়ার্ক, রাউটিং ও আইওটি পরিচিতি থেকে প্রশ্নপত্র তৈরি কর..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Granular Question Count & Mark Controls */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-[11px]">
                        <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                        কাস্টম প্রশ্ন সংখ্যা ও নম্বর বিন্যাস
                      </span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-cyan-400 border border-indigo-200 dark:border-indigo-800">
                        মোট: {toBengaliNumerals(totalRequestedCount)}টি ({toBengaliNumerals(totalRequestedMarks)} মান)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* MCQ Row */}
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300 block">
                          ১. বহুনির্বাচনী (MCQ)
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={aiConfig.mcqCount}
                            onChange={(e) => setAiConfig({ ...aiConfig, mcqCount: parseInt(e.target.value) || 0 })}
                            className="w-12 px-1.5 py-1 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                            title="MCQ সংখ্যা"
                          />
                          <span className="text-[10px] text-slate-400">টি ×</span>
                          <input
                            type="number"
                            step="0.5"
                            value={aiConfig.mcqMarks}
                            onChange={(e) => setAiConfig({ ...aiConfig, mcqMarks: parseFloat(e.target.value) || 0 })}
                            className="w-14 px-1.5 py-1 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-indigo-600 dark:text-cyan-400"
                            title="প্রতিটির নম্বর"
                          />
                          <span className="text-[10px] text-slate-400">মান</span>
                        </div>
                      </div>

                      {/* Very Short Row */}
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300 block">
                          ২. অতি সংক্ষিপ্ত
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={aiConfig.veryShortCount}
                            onChange={(e) => setAiConfig({ ...aiConfig, veryShortCount: parseInt(e.target.value) || 0 })}
                            className="w-12 px-1.5 py-1 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                            title="অতি সংক্ষিপ্ত সংখ্যা"
                          />
                          <span className="text-[10px] text-slate-400">টি ×</span>
                          <input
                            type="number"
                            step="0.5"
                            value={aiConfig.veryShortMarks}
                            onChange={(e) => setAiConfig({ ...aiConfig, veryShortMarks: parseFloat(e.target.value) || 0 })}
                            className="w-14 px-1.5 py-1 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-indigo-600 dark:text-cyan-400"
                            title="প্রতিটির নম্বর"
                          />
                          <span className="text-[10px] text-slate-400">মান</span>
                        </div>
                      </div>

                      {/* Short Row */}
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300 block">
                          ৩. সংক্ষিপ্ত প্রশ্ন
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={aiConfig.shortCount}
                            onChange={(e) => setAiConfig({ ...aiConfig, shortCount: parseInt(e.target.value) || 0 })}
                            className="w-12 px-1.5 py-1 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                            title="সংক্ষিপ্ত প্রশ্ন সংখ্যা"
                          />
                          <span className="text-[10px] text-slate-400">টি ×</span>
                          <input
                            type="number"
                            step="0.5"
                            value={aiConfig.shortMarks}
                            onChange={(e) => setAiConfig({ ...aiConfig, shortMarks: parseFloat(e.target.value) || 0 })}
                            className="w-14 px-1.5 py-1 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-indigo-600 dark:text-cyan-400"
                            title="প্রতিটির নম্বর"
                          />
                          <span className="text-[10px] text-slate-400">মান</span>
                        </div>
                      </div>

                      {/* Creative / Broad Row */}
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300 block">
                          ৪. রচনামূলক/সৃজনশীল
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={aiConfig.broadCount}
                            onChange={(e) => setAiConfig({ ...aiConfig, broadCount: parseInt(e.target.value) || 0 })}
                            className="w-12 px-1.5 py-1 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                            title="রচনামূলক সংখ্যা"
                          />
                          <span className="text-[10px] text-slate-400">টি ×</span>
                          <input
                            type="number"
                            step="0.5"
                            value={aiConfig.broadMarks}
                            onChange={(e) => setAiConfig({ ...aiConfig, broadMarks: parseFloat(e.target.value) || 0 })}
                            className="w-14 px-1.5 py-1 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-indigo-600 dark:text-cyan-400"
                            title="প্রতিটির নম্বর"
                          />
                          <span className="text-[10px] text-slate-400">মান</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateWithAI}
                    disabled={isAiGenerating || !aiPrompt.trim() || totalRequestedCount === 0}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {isAiGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>AI {toBengaliNumerals(totalRequestedCount)}টি প্রশ্ন জেনারেট করছে...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                        <span>AI দিয়ে প্রশ্ন তৈরি ও রিভিউ করুন ({toBengaliNumerals(totalRequestedCount)}টি)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* METHOD 2: QUESTION BANK BROWSER */}
              {creationMethod === "bank" && (
                <div className="space-y-3 text-xs">
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={bankSearchQuery}
                        onChange={(e) => setBankSearchQuery(e.target.value)}
                        placeholder="প্রশ্ন ব্যাংকে সার্চ করুন..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                      {[
                        { id: "all", label: "সকল ধরন" },
                        { id: "mcq", label: "১. MCQ" },
                        { id: "very_short", label: "২. অতি সংক্ষিপ্ত" },
                        { id: "short", label: "৩. সংক্ষিপ্ত" },
                        { id: "broad", label: "৪. রচনামূলক" },
                      ].map((tf) => (
                        <button
                          key={tf.id}
                          onClick={() => setBankTypeFilter(tf.id)}
                          className={`px-2.5 py-1 rounded-lg border whitespace-nowrap font-bold cursor-pointer ${
                            bankTypeFilter === tf.id
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {filteredBank.map((q) => (
                      <div
                        key={q.id}
                        className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1 hover:border-indigo-400 transition-all"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-indigo-600 dark:text-cyan-400">
                            {QUESTION_TYPE_LABELS[q.type]?.nameBangla}
                          </span>
                          <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
                            [{toBengaliNumerals(q.marks)} মান]
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-2">
                          {q.questionText}
                        </p>
                        <button
                          onClick={() => {
                            setQuestions((prev) => [...prev, { ...q, id: `bank-q-${Date.now()}` }]);
                            alert("প্রশ্নপত্রে যোগ করা হয়েছে!");
                          }}
                          className="w-full py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> প্রশ্নপত্রে যোগ করুন
                        </button>
                      </div>
                    ))}

                    {filteredBank.length === 0 && (
                      <p className="text-center text-slate-400 py-4 text-[11px]">
                        কোশ্চেন ব্যাংকে কোনো প্রশ্ন পাওয়া যায়নি।
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* METHOD 3: MANUAL ENTRY FORM WITH ALL 4 TYPES & SUBPARTS */}
              {creationMethod === "manual" && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ১. প্রশ্ন ক্যাটাগরি (Primary Question Type) *
                    </label>
                    <select
                      value={manualForm.type}
                      onChange={(e) => {
                        const newType = e.target.value as WrittenQuestionType;
                        setManualForm({
                          ...manualForm,
                          type: newType,
                          sectionTitle: QUESTION_TYPE_LABELS[newType]?.defaultSectionTitle,
                          marks: QUESTION_TYPE_LABELS[newType]?.defaultMarks || 2.5,
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="mcq">১. বহুনির্বাচনী প্রশ্ন (MCQ - যেমন: ০.৫ মান)</option>
                      <option value="very_short">২. অতি সংক্ষিপ্ত প্রশ্ন (Very Short - যেমন: ১.০ মান)</option>
                      <option value="short">৩. সংক্ষিপ্ত প্রশ্ন (Short Answer - যেমন: ২.৫ মান)</option>
                      <option value="broad">৪. রচনামূলক / সৃজনশীল প্রশ্ন (Broad - যেমন: ৫.০ বা ১২.৫ মান)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      বিভাগ / সেকশন হেডার:
                    </label>
                    <input
                      type="text"
                      value={manualForm.sectionTitle}
                      onChange={(e) => setManualForm({ ...manualForm, sectionTitle: e.target.value })}
                      placeholder="যেমন: ৩। সংক্ষিপ্ত প্রশ্ন"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  {manualForm.type === "broad" && (
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        উদ্দীপক (Stimulus Text):
                      </label>
                      <textarea
                        rows={2}
                        value={manualForm.stimulusText}
                        onChange={(e) => setManualForm({ ...manualForm, stimulusText: e.target.value })}
                        placeholder="উদ্দীপকের বিস্তারিত তথ্য বা সিনারিও লিখুন..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      মূল প্রশ্ন বিবরণ *
                    </label>
                    <input
                      type="text"
                      value={manualForm.questionText}
                      onChange={(e) => setManualForm({ ...manualForm, questionText: e.target.value })}
                      placeholder="প্রশ্ন এখানে টাইপ করুন..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  {/* MCQ Options Form Input */}
                  {manualForm.type === "mcq" && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 block">
                        বহুনির্বাচনী বিকল্পসমূহ (ক, খ, গ, ঘ):
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {["ক", "খ", "গ", "ঘ"].map((label, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="font-bold text-slate-500 dark:text-slate-400 w-3">{label}.</span>
                            <input
                              type="text"
                              value={manualForm.options[idx] || ""}
                              onChange={(e) => {
                                const newOpts = [...manualForm.options];
                                newOpts[idx] = e.target.value;
                                setManualForm({ ...manualForm, options: newOpts });
                              }}
                              placeholder={`বিকল্প ${label}`}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fractional Marks Input & Quick Presets */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        প্রশ্নের নম্বর মান (Decimal Marks):
                      </label>
                      <span className="font-mono font-bold text-indigo-600 dark:text-cyan-400">
                        {toBengaliNumerals(manualForm.marks || 0)} নম্বর
                      </span>
                    </div>

                    <input
                      type="number"
                      step="0.5"
                      value={manualForm.marks || 0}
                      onChange={(e) => setManualForm({ ...manualForm, marks: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm"
                    />

                    {/* Fractional Marks Presets */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 5.0, 10.0, 12.5].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setManualForm({ ...manualForm, marks: preset })}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            manualForm.marks === preset
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                          }`}
                        >
                          {toBengaliNumerals(preset)} মান
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subparts for Creative/Broad Questions */}
                  {manualForm.type === "broad" && (
                    <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-indigo-900 dark:text-indigo-300">
                          সাব-প্রশ্ন ও নম্বর বণ্টন (ক, খ, গ, ঘ):
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const currentLen = manualForm.subparts.length;
                            const labels = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];
                            setManualForm({
                              ...manualForm,
                              subparts: [
                                ...manualForm.subparts,
                                {
                                  id: `s-${Date.now()}`,
                                  label: labels[currentLen] || `${currentLen + 1}`,
                                  questionText: "",
                                  marks: 1.0,
                                },
                              ],
                            });
                          }}
                          className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                        >
                          + সাব-প্রশ্ন যোগ করুন
                        </button>
                      </div>

                      {manualForm.subparts.map((sp, idx) => (
                        <div key={sp.id} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={sp.label}
                            onChange={(e) => {
                              const newSubs = [...manualForm.subparts];
                              newSubs[idx].label = e.target.value;
                              setManualForm({ ...manualForm, subparts: newSubs });
                            }}
                            className="w-6 px-1 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 text-center font-bold"
                          />
                          <input
                            type="text"
                            value={sp.questionText}
                            onChange={(e) => {
                              const newSubs = [...manualForm.subparts];
                              newSubs[idx].questionText = e.target.value;
                              setManualForm({ ...manualForm, subparts: newSubs });
                            }}
                            placeholder={`সাব-প্রশ্ন ${sp.label}...`}
                            className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                          <input
                            type="number"
                            step="0.5"
                            value={sp.marks}
                            onChange={(e) => {
                              const newSubs = [...manualForm.subparts];
                              newSubs[idx].marks = parseFloat(e.target.value) || 0;
                              const subSum = newSubs.reduce((s, item) => s + item.marks, 0);
                              setManualForm({
                                ...manualForm,
                                subparts: newSubs,
                                marks: Number(subSum.toFixed(2)),
                              });
                            }}
                            className="w-14 px-1 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newSubs = manualForm.subparts.filter((_, i) => i !== idx);
                              const subSum = newSubs.reduce((s, item) => s + item.marks, 0);
                              setManualForm({
                                ...manualForm,
                                subparts: newSubs,
                                marks: Number(subSum.toFixed(2)),
                              });
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleAddManualQuestion}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" /> প্রশ্নপত্রে যোগ করুন
                  </button>
                </div>
              )}

              {/* METHOD 4: PDF IMPORT */}
              {creationMethod === "pdf" && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-2">
                    <FileUp className="w-8 h-8 text-indigo-500 mx-auto" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      সিলেবাস বা পুরনো প্রশ্নপত্রের PDF ফাইল আপলোড করুন
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPdfTextContent(`[${file.name} থেকে এক্সট্র্যাক্টকৃত টেক্সট - ০.৫, ১.৫, ২.৫ নম্বর ধারণ করে]`);
                        }
                      }}
                      className="text-xs text-slate-500 dark:text-slate-400"
                    />
                  </div>

                  {pdfTextContent && (
                    <button
                      onClick={() => {
                        setAiPrompt(`আপলোডকৃত PDF থেকে ০.৫, ১.৫, ২.৫ মানসম্পন্ন প্রশ্ন তৈরি কর: ${pdfTextContent}`);
                        setCreationMethod("ai");
                      }}
                      className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> PDF থেকে AI দিয়ে প্রশ্ন তৈরি
                    </button>
                  )}
                </div>
              )}

              {/* METHOD 5: COPY PASTE */}
              {creationMethod === "paste" && (
                <div className="space-y-3 text-xs">
                  <textarea
                    rows={4}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="অন্য যেকোনো উৎস থেকে প্রশ্নসমূহ এখানে পেস্ট করুন (যেমন: ১.১ নেটওয়ার্ক কি? [নম্বর: ০.৫])..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => {
                      if (!pastedText.trim()) return;
                      setQuestions((prev) => [
                        ...prev,
                        {
                          id: `pasted-${Date.now()}`,
                          type: "short",
                          sectionTitle: "৩। সংক্ষিপ্ত প্রশ্ন (ইম্পোর্টেড)",
                          questionText: pastedText,
                          marks: 2.5,
                        },
                      ]);
                      setPastedText("");
                      alert("পেস্ট করা প্রশ্ন ইম্পোর্ট করা হয়েছে!");
                    }}
                    className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer"
                  >
                    ইম্পোর্ট করুন
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Printable Paper Canvas & Review Editor */}
          <div className="lg:col-span-7 space-y-4">
            {/* Action & Marks Breakdown Bar */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    মোট প্রশ্ন: {toBengaliNumerals(questions.length)} টি
                  </span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                      calculatedTotalMarks === examConfig.fullMarks
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    প্রাপ্ত মান: {toBengaliNumerals(calculatedTotalMarks)} / {toBengaliNumerals(examConfig.fullMarks)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewPrintModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-700 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" /> A4 প্রিন্ট প্রিভিউ
                  </button>

                  <button
                    onClick={handleSavePaper}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-700 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> সংরক্ষণ করুন
                  </button>
                </div>
              </div>

              {/* 4 Primary Question Categories Breakdown Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                {(Object.keys(typeSummary) as WrittenQuestionType[]).map((key) => {
                  const item = typeSummary[key];
                  return (
                    <div
                      key={key}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5"
                    >
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block truncate">
                        {item.label}
                      </span>
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span>{toBengaliNumerals(item.count)} টি</span>
                        <span className="text-indigo-600 dark:text-cyan-400">
                          {toBengaliNumerals(item.totalMarks)} মান
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Marks Mismatch Warning Banner */}
              {calculatedTotalMarks !== examConfig.fullMarks && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    সতর্কতা: প্রশ্নের মোট মান ({toBengaliNumerals(calculatedTotalMarks)}) নির্ধারিত পূর্ণমানের ({toBengaliNumerals(examConfig.fullMarks)}) সাথে মেলেনি! প্রয়োজন মতো নম্বর পরিবর্তন করুন।
                  </span>
                </div>
              )}
            </div>

            {/* Live Paper Canvas (A4 Bangladesh Examination Format) */}
            <div
              id="printable-paper-canvas"
              className="p-6 md:p-8 bg-white dark:bg-slate-900 text-slate-950 rounded-3xl border border-slate-300 dark:border-slate-700 shadow-xl space-y-6 font-serif"
            >
              {/* Institutional Board Header */}
              <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                <h2 className="text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                  পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
                </h2>
                <p className="text-xs font-sans text-slate-700 dark:text-slate-300">
                  পঞ্চগড় সদর, পঞ্চগড় • EIIN: ১৩২২৪৪ • বিটিইবি বোর্ড কোড: ২৫০২৫
                </p>
                <div className="pt-1">
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 font-bold text-xs border border-slate-400 rounded-md">
                    {examConfig.title}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-sans font-bold pt-2 text-slate-800 dark:text-slate-200">
                  <span>শ্রেণি: {examConfig.className}</span>
                  {examConfig.tradeName && <span>ট্রেড: {examConfig.tradeName}</span>}
                  <span>বিষয়: {examConfig.subjectNameBangla} ({examConfig.subjectCode})</span>
                </div>
                <div className="flex items-center justify-between text-xs font-sans pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>সময়: {toBengaliNumerals(examConfig.durationMinutes / 60)} ঘন্টা</span>
                  <span>পূর্ণমান: {toBengaliNumerals(examConfig.fullMarks)}</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-xs italic space-y-0.5 text-slate-800 dark:text-slate-200 font-sans border-b border-slate-200 dark:border-slate-800 pb-2">
                {examConfig.instructions.map((inst, idx) => (
                  <p key={idx}>{inst}</p>
                ))}
              </div>

              {/* Questions List displaying exact fractional marks */}
              {questions.length === 0 ? (
                <div className="py-12 px-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/70 text-center my-4 space-y-4 print:hidden">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
                    <FileText className="w-7 h-7 animate-pulse" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-base font-black text-slate-800 dark:text-slate-200">
                      প্রশ্নপত্রটিতে এখনো কোনো প্রশ্ন যোগ করা হয়নি
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                      হেডারের প্রাতিষ্ঠানিক তথ্য ও নির্দেশনাসমূহ প্রস্তুত রয়েছে। প্রশ্ন যোগ করতে বামপাশের টুলস ব্যবহার করে <strong>AI দিয়ে প্রশ্ন জেনারেট</strong>, <strong>প্রশ্ন ব্যাংক</strong> অথবা <strong>ম্যানুয়ালি প্রশ্ন</strong> যুক্ত করুন।
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setCreationMethod("ai")}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-300" />
                      <span>⚡ AI দিয়ে প্রশ্ন তৈরি ও রিভিউ করুন</span>
                    </button>
                    <button
                      onClick={() => setCreationMethod("bank")}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>📚 প্রশ্ন ব্যাংক থেকে নির্বাচন করুন</span>
                    </button>
                    <button
                      onClick={() => setCreationMethod("manual")}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>✍️ ম্যানুয়ালি প্রশ্ন লিখুন</span>
                    </button>
                    <button
                      onClick={handleLoadDemoQuestions}
                      className="px-4 py-2 rounded-xl bg-amber-500/15 text-amber-900 border border-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 text-amber-700" />
                      <span>📋 নমুনা প্রশ্নপত্র দেখুন</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-sm">
                  {questions.map((q, qIdx) => {
                    const showSectionHeader =
                      qIdx === 0 ||
                      questions[qIdx - 1].type !== q.type ||
                      (Boolean(q.sectionTitle) && questions[qIdx - 1].sectionTitle !== q.sectionTitle);

                    return (
                      <React.Fragment key={q.id}>
                        {/* Section Header - Render ONCE per category section */}
                        {showSectionHeader && (
                          <div className="font-bold text-xs sm:text-sm text-indigo-950 border-b-2 border-indigo-900 pb-1.5 pt-4 mt-2 font-sans flex items-center justify-between">
                            <span>
                              {q.sectionTitle ||
                                QUESTION_TYPE_LABELS[q.type]?.defaultSectionTitle ||
                                "প্রশ্নাবলী"}
                            </span>
                          </div>
                        )}

                        <div className="group relative p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all space-y-2">
                          {/* Action Bar (Delete, Move Up/Down, Duplicate, Edit) */}
                          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
                            <button
                              onClick={() => handleMoveQuestion(qIdx, "up")}
                              disabled={qIdx === 0}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 disabled:opacity-30 cursor-pointer"
                              title="উপরে সরান"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveQuestion(qIdx, "down")}
                              disabled={qIdx === questions.length - 1}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 disabled:opacity-30 cursor-pointer"
                              title="নিচে সরান"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateQuestion(q)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-indigo-600 cursor-pointer"
                              title="কপি করুন"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingQuestion(q);
                                setEditingQuestionContext("canvas");
                              }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-emerald-600 cursor-pointer"
                              title="সম্পাদনা করুন"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setQuestions(questions.filter((item) => item.id !== q.id))}
                              className="p-1 hover:bg-rose-100 rounded text-rose-600 cursor-pointer"
                              title="প্রশ্ন মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                    {/* Stimulus / উদ্দীপক */}
                    {q.stimulusText && (
                      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs italic font-sans border border-slate-300 dark:border-slate-700">
                        {q.stimulusText}
                      </div>
                    )}

                    {/* Question Text & Decimal Marks */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100 leading-relaxed flex-1">
                        {q.questionText}
                      </div>

                      {/* Configurable Decimal Marks Badge / Input */}
                      <div className="flex items-center gap-1 font-sans text-xs shrink-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          [{toBengaliNumerals(q.marks)}]
                        </span>
                        <input
                          type="number"
                          step="0.5"
                          value={q.marks}
                          onChange={(e) => handleUpdateQuestionMarks(q.id, parseFloat(e.target.value) || 0, false)}
                          className="w-12 px-1 py-0.5 text-[10px] rounded border border-slate-300 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity font-mono font-bold print:hidden"
                          title="দশমিক নম্বর সম্পাদনা করুন"
                        />
                      </div>
                    </div>

                    {/* MCQ Options */}
                    {q.type === "mcq" && q.options && (
                      <div className="grid grid-cols-2 gap-2 text-xs font-sans pl-4">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx}>
                            ({["ক", "খ", "গ", "ঘ"][optIdx]}) {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Subparts with individual decimal marks */}
                    {q.subparts && (
                      <div className="space-y-1.5 pl-4 text-xs font-sans">
                        {q.subparts.map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between">
                            <span>
                              <strong>{sub.label}.</strong> {sub.questionText}
                            </span>
                            <div className="flex items-center gap-1 font-bold">
                              <span>[{toBengaliNumerals(sub.marks)}]</span>
                              <input
                                type="number"
                                step="0.5"
                                value={sub.marks}
                                 onChange={(e) =>
                                  handleUpdateSubpartMarks(q.id, sub.id, parseFloat(e.target.value) || 0, false)
                                }
                                className="w-10 px-1 py-0.5 text-[10px] rounded border border-slate-300 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity font-mono font-bold print:hidden"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mode: Saved Question Papers List */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedPapers.map((paper) => (
              <div
                key={paper.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-cyan-400">
                    {paper.className}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                    পূর্ণমান: {toBengaliNumerals(paper.fullMarks)}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {paper.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{paper.subjectName}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[10px]">
                    {new Date(paper.createdAt).toLocaleDateString("bn-BD")}
                  </span>
                  <button
                    onClick={() => {
                      setQuestions(paper.questions);
                      setActiveTab("builder");
                    }}
                    className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer"
                  >
                    পুনরায় ওপেন করুন
                  </button>
                </div>
              </div>
            ))}

            {savedPapers.length === 0 && (
              <div className="col-span-full p-12 text-center text-slate-400 text-xs">
                কোনো সংরক্ষিত প্রশ্নপত্র পাওয়া যায়নি।
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGING MODAL: DRAFT AI GENERATED QUESTIONS REVIEW & EDIT MODAL */}
      {showDraftReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-3xl w-full space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    AI জেনারেটেড প্রশ্নাবলী রিভিউ ও এডিটিং স্টেজিং
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    প্রশ্নপত্রে ইনসার্ট করার আগে প্রশ্নসমূহ রিভিউ, টেক্সট বা নম্বর সংশোধন করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDraftReviewModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selection Actions & Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-xs">
              <div className="flex items-center gap-3 font-bold">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedDraftIds.length === draftGeneratedQuestions.length) {
                      setSelectedDraftIds([]);
                    } else {
                      setSelectedDraftIds(draftGeneratedQuestions.map((q) => q.id));
                    }
                  }}
                  className="flex items-center gap-1.5 text-indigo-600 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                  {selectedDraftIds.length === draftGeneratedQuestions.length ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span>সবকয়টি সিলেক্ট করুন ({toBengaliNumerals(draftGeneratedQuestions.length)}টি)</span>
                </button>
              </div>

              <span className="font-bold text-slate-700 dark:text-slate-300">
                ইনসার্টযোগ্য নির্বাচিত:{" "}
                <strong className="text-indigo-600 dark:text-cyan-400">
                  {toBengaliNumerals(selectedDraftIds.length)}টি
                </strong>
              </span>
            </div>

            {/* Draft Questions List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {draftGeneratedQuestions.map((q, idx) => {
                const isSelected = selectedDraftIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border transition-all space-y-2 ${
                      isSelected
                        ? "bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDraftIds((prev) =>
                              prev.includes(q.id) ? prev.filter((id) => id !== q.id) : [...prev, q.id]
                            );
                          }}
                          className="text-indigo-600 dark:text-cyan-400 cursor-pointer"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
                          {QUESTION_TYPE_LABELS[q.type]?.nameBangla}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="font-bold text-slate-500 dark:text-slate-400">নম্বর:</span>
                          <input
                            type="number"
                            step="0.5"
                            value={q.marks}
                            onChange={(e) =>
                              handleUpdateQuestionMarks(q.id, parseFloat(e.target.value) || 0, true)
                            }
                            className="w-12 px-1 py-0.5 text-center font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestion(q);
                            setEditingQuestionContext("draft");
                          }}
                          className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-indigo-100 text-indigo-600 dark:text-cyan-300 text-xs font-bold flex items-center gap-1 px-2 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> এডিট
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDraftGeneratedQuestions((prev) => prev.filter((item) => item.id !== q.id));
                            setSelectedDraftIds((prev) => prev.filter((id) => id !== q.id));
                          }}
                          className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stimulus */}
                    {q.stimulusText && (
                      <p className="text-xs italic text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        {q.stimulusText}
                      </p>
                    )}

                    {/* Question Text */}
                    <p className="font-bold text-xs text-slate-900 dark:text-white">
                      {toBengaliNumerals(idx + 1)}. {q.questionText}
                    </p>

                    {/* MCQ Options */}
                    {q.type === "mcq" && q.options && (
                      <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-300 pl-3">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx}>
                            ({["ক", "খ", "গ", "ঘ"][optIdx]}) {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Subparts */}
                    {q.subparts && (
                      <div className="space-y-1 pl-3 text-xs text-slate-700 dark:text-slate-300">
                        {q.subparts.map((s) => (
                          <div key={s.id} className="flex justify-between">
                            <span>
                              <strong>{s.label}.</strong> {s.questionText}
                            </span>
                            <span className="font-bold font-mono">[{toBengaliNumerals(s.marks)}]</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Confirm Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDraftReviewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                বাতিল করুন
              </button>

              <button
                type="button"
                onClick={handleConfirmInsertDrafts}
                disabled={selectedDraftIds.length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>নির্বাচনকৃত ({toBengaliNumerals(selectedDraftIds.length)}টি) প্রশ্ন প্রশ্নপত্রে ইনসার্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT QUESTION MODAL (Works both for Canvas items and Draft Staging items) */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" /> প্রশ্ন ও নম্বর সম্পাদনা করুন
              </h3>
              <button onClick={() => setEditingQuestion(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বিভাগ / সেকশন হেডার:
                </label>
                <input
                  type="text"
                  value={editingQuestion.sectionTitle || ""}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, sectionTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {editingQuestion.type === "broad" && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    উদ্দীপক:
                  </label>
                  <textarea
                    rows={2}
                    value={editingQuestion.stimulusText || ""}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, stimulusText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মূল প্রশ্ন বিবরণ:
                </label>
                <input
                  type="text"
                  value={editingQuestion.questionText}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              {/* MCQ Options Edit */}
              {editingQuestion.type === "mcq" && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 block">
                    বহুনির্বাচনী বিকল্পসমূহ:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {["ক", "খ", "গ", "ঘ"].map((label, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="font-bold text-slate-500 dark:text-slate-400 w-3">{label}.</span>
                        <input
                          type="text"
                          value={editingQuestion.options?.[idx] || ""}
                          onChange={(e) => {
                            const newOpts = [...(editingQuestion.options || ["", "", "", ""])];
                            newOpts[idx] = e.target.value;
                            setEditingQuestion({ ...editingQuestion, options: newOpts });
                          }}
                          placeholder={`বিকল্প ${label}`}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subparts Edit */}
              {editingQuestion.type === "broad" && editingQuestion.subparts && (
                <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-2">
                  <span className="font-bold text-[11px] text-indigo-900 dark:text-indigo-300 block">
                    সাব-প্রশ্ন ও মান বণ্টন:
                  </span>
                  {editingQuestion.subparts.map((sp, idx) => (
                    <div key={sp.id} className="flex items-center gap-1.5">
                      <span className="font-bold w-4 text-center">{sp.label}.</span>
                      <input
                        type="text"
                        value={sp.questionText}
                        onChange={(e) => {
                          const newSubs = [...(editingQuestion.subparts || [])];
                          newSubs[idx].questionText = e.target.value;
                          setEditingQuestion({ ...editingQuestion, subparts: newSubs });
                        }}
                        className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <input
                        type="number"
                        step="0.5"
                        value={sp.marks}
                        onChange={(e) => {
                          const newSubs = [...(editingQuestion.subparts || [])];
                          newSubs[idx].marks = parseFloat(e.target.value) || 0;
                          const subSum = newSubs.reduce((s, item) => s + item.marks, 0);
                          setEditingQuestion({
                            ...editingQuestion,
                            subparts: newSubs,
                            marks: Number(subSum.toFixed(2)),
                          });
                        }}
                        className="w-14 px-1 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মোট নম্বর (Marks):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={editingQuestion.marks}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, marks: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                onClick={() => {
                  if (editingContext === "draft") {
                    setDraftGeneratedQuestions((prev) =>
                      prev.map((item) => (item.id === editingQuestion.id ? editingQuestion : item))
                    );
                  } else {
                    setQuestions((prev) =>
                      prev.map((item) => (item.id === editingQuestion.id ? editingQuestion : item))
                    );
                  }
                  setEditingQuestion(null);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> আপডেট সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A4 Print Modal View */}
      {previewPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 text-slate-950 rounded-3xl p-8 space-y-6 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <span className="font-bold text-sm text-indigo-900 flex items-center gap-1.5">
                <Printer className="w-4 h-4" /> A4 প্রিন্ট প্রিভিউ (বিটিইবি বাংলাদেশ ফরম্যাট)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" /> প্রিন্ট করুন (Print)
                </button>
                <button
                  onClick={() => setPreviewPrintModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Standard Printable Paper */}
            <div className="space-y-6 font-serif p-4">
              <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
                </h2>
                <p className="text-xs font-sans text-slate-700 dark:text-slate-300">
                  পঞ্চগড় সদর, পঞ্চগড় • EIIN: ১৩২২৪৪ • বিটিইবি বোর্ড কোড: ২৫০২৫
                </p>
                <h3 className="text-sm font-bold pt-1">{examConfig.title}</h3>
                <div className="flex items-center justify-between text-xs font-sans font-bold pt-2">
                  <span>শ্রেণি: {examConfig.className}</span>
                  {examConfig.tradeName && <span>ট্রেড: {examConfig.tradeName}</span>}
                  <span>বিষয়: {examConfig.subjectNameBangla} ({examConfig.subjectCode})</span>
                </div>
                <div className="flex items-center justify-between text-xs font-sans pt-1">
                  <span>সময়: {toBengaliNumerals(examConfig.durationMinutes / 60)} ঘন্টা</span>
                  <span>পূর্ণমান: {toBengaliNumerals(examConfig.fullMarks)}</span>
                </div>
              </div>

              <div className="space-y-4">
                {questions.map((q, qIdx) => {
                  const showSectionHeader =
                    qIdx === 0 ||
                    questions[qIdx - 1].type !== q.type ||
                    (Boolean(q.sectionTitle) && questions[qIdx - 1].sectionTitle !== q.sectionTitle);

                  return (
                    <React.Fragment key={q.id}>
                      {/* Section Header - Render ONCE per category section */}
                      {showSectionHeader && (
                        <div className="font-bold text-xs sm:text-sm text-slate-950 border-b-2 border-slate-900 pb-1 pt-3 mt-2 font-sans">
                          {q.sectionTitle ||
                            QUESTION_TYPE_LABELS[q.type]?.defaultSectionTitle ||
                            "প্রশ্নাবলী"}
                        </div>
                      )}

                      <div className="space-y-1">
                        {q.stimulusText && (
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 text-xs italic font-sans border border-slate-200 dark:border-slate-800">
                            {q.stimulusText}
                          </div>
                        )}
                        <div className="flex items-start justify-between text-sm">
                          <span className="font-bold">{q.questionText}</span>
                          <span className="font-bold font-sans text-xs">[{toBengaliNumerals(q.marks)}]</span>
                        </div>
                        {q.type === "mcq" && q.options && (
                          <div className="grid grid-cols-2 gap-2 text-xs font-sans pl-4">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx}>
                                ({["ক", "খ", "গ", "ঘ"][optIdx]}) {opt}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.subparts && (
                          <div className="pl-4 text-xs font-sans space-y-1">
                            {q.subparts.map((s) => (
                              <div key={s.id} className="flex justify-between">
                                <span>
                                  <strong>{s.label}.</strong> {s.questionText}
                                </span>
                                <span className="font-bold">[{toBengaliNumerals(s.marks)}]</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
