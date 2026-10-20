"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  Layers,
  Wand2,
  Trash2,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  BookOpen,
  Cpu,
  Zap,
  HelpCircle,
  Save,
  RotateCcw,
  Loader2,
  CheckSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BtebQuizQuestion } from "@/lib/quizAiGenerator";
import SmartPdfPickerDropdown from "@/components/common/SmartPdfPickerDropdown";
import { DocumentRepoItem } from "@/lib/documentRepository";

interface AiQuizGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchLiveQuiz?: (
    questions: BtebQuizQuestion[],
    metadata: { title: string; trade: string; topic: string },
  ) => void;
  onSaveToQuestionBank?: (
    questions: BtebQuizQuestion[],
    metadata: { title: string; trade: string; topic: string },
  ) => void;
}

const TRADES = [
  {
    id: "IT Support & IoT",
    label: "কম্পিউটার ও আইটি সাপোর্ট (IT Support & IoT)",
    icon: "💻",
  },
  {
    id: "Electrical Installation",
    label: "ইলেকট্রিক্যাল ইনস্টলেশন ও মেইনটেন্যান্স",
    icon: "⚡",
  },
  {
    id: "Civil Drafting & Construction",
    label: "সিভিল ড্রাফটিং ও কনস্ট্রাকশন",
    icon: "📐",
  },
  {
    id: "Automotive & Mechanical",
    label: "অটোমোটিভ ও মেকানিক্যাল ইঞ্জিনিয়ারিং",
    icon: "🚗",
  },
  {
    id: "Refrigeration & AC",
    label: "রেফ্রিজারেশন ও এয়ার কন্ডিশনিং (RAC)",
    icon: "❄️",
  },
  {
    id: "General Science & Math",
    label: "সাধারণ কারিগরি বিজ্ঞান ও ফলিত গণিত",
    icon: "🔬",
  },
];

export interface GradeOption {
  id: string;
  name: string;
  hasTrade: boolean;
  classId: string;
}

const GRADE_LEVELS: GradeOption[] = [
  {
    id: "Class 6 (Pre-Vocational)",
    name: "৬ষ্ঠ শ্রেণি (Pre-Vocational)",
    hasTrade: false,
    classId: "1",
  },
  {
    id: "Class 7 (Pre-Vocational)",
    name: "৭ম শ্রেণি (Pre-Vocational)",
    hasTrade: false,
    classId: "2",
  },
  {
    id: "Class 8 (Pre-Vocational)",
    name: "৮ম শ্রেণি (Pre-Vocational)",
    hasTrade: false,
    classId: "3",
  },
  {
    id: "Class 9 (Vocational)",
    name: "৯ম শ্রেণি (SSC Vocational)",
    hasTrade: true,
    classId: "4",
  },
  {
    id: "Class 10 (Vocational)",
    name: "১০ম শ্রেণি (SSC Vocational)",
    hasTrade: true,
    classId: "5",
  },
  {
    id: "HSC (Vocational - 1st Year)",
    name: "১১শ শ্রেণি (HSC Voc - ১ম বর্ষ)",
    hasTrade: true,
    classId: "6",
  },
  {
    id: "HSC (Vocational - 2nd Year)",
    name: "১২শ শ্রেণি (HSC Voc - ২য় বর্ষ)",
    hasTrade: true,
    classId: "7",
  },
];

const SUGGESTED_TOPICS_BY_TRADE: Record<string, string[]> = {
  "IT Support & IoT": [
    "কম্পিউটার নেটওয়ার্কিং ও আইপি অ্যাড্রেসিং",
    "মাদারবোর্ড ও হার্ডওয়্যার আর্কিটেকচার",
    "আইওটি সেন্সর ও মাইক্রোকন্ট্রোলার",
    "অপারেটিং সিস্টেম ট্রাবলশুটিং",
    "সাইবার সিকিউরিটি ও ফায়ারওয়াল",
  ],
  "Electrical Installation": [
    "ওহমের সূত্র ও কির্শফের সূত্র",
    "স্টেপ-আপ ও স্টেপ-ডাউন ট্রান্সফরমার",
    "আবাসিক ভবনে হাউজ ওয়্যারিং ও আর্থিং",
    "থ্রি-ফেজ এসি মোটর ও স্টার-ডেল্টা স্টার্টার",
    "সার্কিট ব্রেকার ও পাওয়ার ফ্যাক্টর উন্নয়ন",
  ],
  "Civil Drafting & Construction": [
    "আরসিসি ঢালাই ও কংক্রিটের অনুপাত",
    "সিমেন্টের প্রাথমিক ও চূড়ান্ত সেটিং টাইম",
    "থিওডোলাইট ও লেভেলিং সার্ভে",
    "কলাম ও বিমের রিইনফোর্সমেন্ট রড বাইন্ডিং",
    "অটোক্যাড ড্রাফটিং ও স্ট্রাকচারাল ডিজাইন",
  ],
  "Automotive & Mechanical": [
    "ফোর-স্ট্রোক ও টু-স্ট্রোক আইসি ইঞ্জিন",
    "ডিজেল ফুয়েল ইনজেকশন পাম্প ও ইএফআই",
    "অ্যান্টি-লক ব্রেকিং সিস্টেম (ABS)",
    "লুব্রিকেশন ও ইঞ্জিন কুলিং সিস্টেম",
    "ডিফারেনশিয়াল গিয়ার ও পাওয়ারট্রেন",
  ],
  "Refrigeration & AC": [
    "ভ্যাপার কম্প্রেশন রেফ্রিজারেশন সাইকেল",
    "পরিবেশবান্ধব রেফ্রিজারেন্ট গ্যাস (R-32, R-410A)",
    "ক্যাপিলারি টিউব ও এক্সপ্যানশন ভালভ",
    "ফ্রস্ট-ফ্রি রেফ্রিজারেটর ডিফ্রস্ট হিটার",
    "স্প্লিট এসি গ্যাস চার্জিং ও ট্রাবলশুটিং",
  ],
  "General Science & Math": [
    "ভার্নিয়ার ক্যালিপার্স ও স্ক্রু গজ পরিমাপ",
    "কাজ, ক্ষমতা ও বৈদ্যুতিক শক্তি ইউনিট",
    "তাপমাত্রা স্কেল ও আপেক্ষিক তাপ",
    "ত্রিকোণমিতি ও ঢাল পরিমাপ",
    "প্যাসকেলের সূত্র ও হাইড্রোলিক চাপ",
  ],
};

export default function AiQuizGeneratorModal({
  isOpen,
  onClose,
  onLaunchLiveQuiz,
  onSaveToQuestionBank,
}: AiQuizGeneratorModalProps) {
  // Form controls
  const [selectedTrade, setSelectedTrade] =
    useState<string>("IT Support & IoT");
  const [selectedGrade, setSelectedGrade] = useState<string>(
    "Class 10 (Vocational)",
  );
  const [topic, setTopic] = useState<string>(
    "কম্পিউটার নেটওয়ার্কিং ও আইপি অ্যাড্রেসিং",
  );
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<string>("mcq_single");
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<
    "Easy" | "Medium" | "Hard" | "Mixed"
  >("Mixed");
  const [language, setLanguage] = useState<"Bangla" | "English" | "Bilingual">(
    "Bangla",
  );
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [selectedPdfDocId, setSelectedPdfDocId] = useState<string>("");

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [generatedQuestions, setGeneratedQuestions] = useState<
    BtebQuizQuestion[]
  >([]);
  const [generationMeta, setGenerationMeta] = useState<{
    provider: string;
    isFallback: boolean;
    message: string;
  } | null>(null);

  // Editor states
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);

  if (!isOpen) return null;

  // Handle AI generation request
  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setGenerationStep("কারিকুলাম প্যারামিটার সমন্বয় করা হচ্ছে...");
    setSavedSuccess(false);

    try {
      setTimeout(
        () =>
          setGenerationStep(
            "জেমিনাই এআই মডেলের সাথে সংযোগ স্থাপন করা হচ্ছে...",
          ),
        600,
      );
      setTimeout(
        () =>
          setGenerationStep(
            "বিটিইবি কারিগরি প্রশ্ন ও ডিস্ট্রাক্টর তৈরি হচ্ছে...",
          ),
        1300,
      );

      const res = await fetch("/api/ai/quiz-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trade: selectedTrade,
          gradeLevel: selectedGrade,
          topic: topic.trim(),
          questionCount,
          questionType,
          difficulty,
          language,
          customInstructions: customPrompt.trim(),
          referencePdfId: selectedPdfDocId,
        }),
      });

      const data = await res.json();

      if (
        data.success &&
        Array.isArray(data.questions) &&
        data.questions.length > 0
      ) {
        setGeneratedQuestions(data.questions);
        setGenerationMeta({
          provider: data.provider,
          isFallback: data.isFallback,
          message: data.message,
        });
        setExpandedIndex(0);
      } else {
        throw new Error(data.message || "Failed to generate questions");
      }
    } catch (err: any) {
      console.warn(
        "Quiz generation API warning, using internal mock generator:",
        err,
      );
      // Emergency safe local fallback
      const mockQs: BtebQuizQuestion[] = [
        {
          id: `local-${Date.now()}-1`,
          question: `${topic} সম্পর্কিত মূল কারিগরি নীতি কোনটি?`,
          options: [
            "কার্যক্ষমতা ও নিরাপত্তা বৃদ্ধি",
            "অপ্রয়োজনীয় বিদ্যুৎ অপচয়",
            "ম্যানুয়াল নিয়ন্ত্রণের বাধ্যবাধকতা",
            "সার্কিটের রোধ বৃদ্ধি",
          ],
          correctAnswer: 0,
          explanation:
            "আধুনিক কারিগরি শিক্ষায় মূল লক্ষ্য কার্যক্ষমতা ও নিরাপত্তা নিশ্চিতকরণ।",
          timeLimit: 30,
          difficulty: "Medium",
          trade: selectedTrade,
          topic: topic,
        },
      ];
      setGeneratedQuestions(mockQs);
      setGenerationMeta({
        provider: "bteb_offline_engine",
        isFallback: true,
        message: "অফলাইন প্রিভিউ ইঞ্জিন থেকে প্রশ্ন সেট প্রস্তুত করা হয়েছে।",
      });
      setExpandedIndex(0);
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  // Inline Question Editing
  const updateQuestionText = (index: number, text: string) => {
    setGeneratedQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], question: text };
      return copy;
    });
  };

  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    setGeneratedQuestions((prev) => {
      const copy = [...prev];
      const newOpts = [...(copy[qIndex].options || [])];
      newOpts[optIndex] = text;
      copy[qIndex] = { ...copy[qIndex], options: newOpts };
      return copy;
    });
  };

  const updateCorrectAnswer = (qIndex: number, optIndex: number) => {
    setGeneratedQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], correctAnswer: optIndex };
      return copy;
    });
  };

  const updateExplanation = (qIndex: number, text: string) => {
    setGeneratedQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], explanation: text };
      return copy;
    });
  };

  const deleteQuestion = (index: number) => {
    setGeneratedQuestions((prev) => prev.filter((_, idx) => idx !== index));
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const addNewBlankQuestion = (type: string = "mcq_single") => {
    let qData: Partial<BtebQuizQuestion> = {
      id: `custom-${Date.now()}`,
      type: type as any,
      question: "নতুন প্রশ্ন লিখুন...",
      explanation: "সঠিক উত্তরের ব্যাখ্যা লিখুন।",
      timeLimit: 30,
      difficulty: "Medium",
      trade: selectedTrade,
      topic: topic,
    };

    if (type === "true_false") {
      qData.question = "নিচের বক্তব্যটি বিবেচনা করো: এটি সত্য নাকি মিথ্যা?";
      qData.options = ["সত্য (True)", "মিথ্যা (False)"];
      qData.correctAnswer = true;
    } else if (type === "matching") {
      qData.question = "বাম পাশের সাথে ডান পাশের সঠিক তথ্য মিলকরণ করো";
      qData.pairs = [
        { left: "বাম পাশ ১", right: "ডান পাশ ১" },
        { left: "বাম পাশ ২", right: "ডান পাশ ২" },
        { left: "বাম পাশ ৩", right: "ডান পাশ ৩" },
      ];
    } else if (type === "fill_blank") {
      qData.question =
        "বাক্যের শূন্যস্থানে সঠিক শব্দ বসাও: গুরুত্বপূর্ণ সূত্র হলো ___।";
      qData.acceptedAnswers = ["সঠিক উত্তর"];
    } else if (type === "ordering") {
      qData.question = "সঠিক পর্যায়ক্রম অনুসারে সাজাও:";
      qData.items = ["ধাপ ১", "ধাপ ২", "ধাপ ৩"];
    } else if (type === "short_answer") {
      qData.question = "সংক্ষিপ্ত প্রশ্নের উত্তর দিন:";
      qData.expectedAnswerKeyword = "সঠিক উত্তর";
    } else {
      qData.options = ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"];
      qData.correctAnswer = 0;
    }

    setGeneratedQuestions((prev) => [...prev, qData as BtebQuizQuestion]);
    setExpandedIndex(generatedQuestions.length);
  };

  const handleSwitchModalQuestionType = (qIndex: number, newType: string) => {
    setGeneratedQuestions((prev) => {
      const copy = [...prev];
      const item = { ...copy[qIndex], type: newType as any };
      if (newType === "true_false") {
        item.correctAnswer = true;
        item.options = ["সত্য (True)", "মিথ্যা (False)"];
      } else if (newType === "matching") {
        if (!item.pairs || item.pairs.length === 0) {
          item.pairs = [
            { left: "বাম পাশ ১", right: "ডান পাশ ১" },
            { left: "বাম পাশ ২", right: "ডান পাশ ২" },
            { left: "বাম পাশ ৩", right: "ডান পাশ ৩" },
          ];
        }
      } else if (newType === "fill_blank") {
        if (!item.acceptedAnswers || item.acceptedAnswers.length === 0) {
          item.acceptedAnswers = ["সঠিক উত্তর"];
        }
      } else if (newType === "ordering") {
        if (!item.items || item.items.length === 0) {
          item.items = ["ধাপ ১", "ধাপ ২", "ধাপ ৩"];
        }
      } else if (newType === "short_answer") {
        if (!item.expectedAnswerKeyword) {
          item.expectedAnswerKeyword = "সঠিক উত্তর";
        }
      } else if (newType === "mcq_single" || newType === "mcq_multiple") {
        if (!item.options || item.options.length < 2) {
          item.options = ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"];
        }
      }
      copy[qIndex] = item;
      return copy;
    });
  };

  // Launch Live Quiz Action
  const handleLaunchLive = () => {
    if (generatedQuestions.length === 0) return;
    const quizTitle = `${selectedTrade} - ${topic}`;
    if (onLaunchLiveQuiz) {
      onLaunchLiveQuiz(generatedQuestions, {
        title: quizTitle,
        trade: selectedTrade,
        topic: topic,
      });
    }
    onClose();
  };

  // Save to Question Bank Action
  const handleSaveToBank = () => {
    if (generatedQuestions.length === 0) return;
    const quizTitle = `${selectedTrade} - ${topic}`;
    if (onSaveToQuestionBank) {
      onSaveToQuestionBank(generatedQuestions, {
        title: quizTitle,
        trade: selectedTrade,
        topic: topic,
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Copy JSON
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(generatedQuestions, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                  Gemini AI BTEB কুইজ জেনারেটর
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30">
                  Phase 6B
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                বিটিইবি কারিকুলাম অনুযায়ী কারিগরি প্রশ্ন ও লাইভ কুইজ সেট তৈরি
                করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          {/* Top Form Controls Grid - Grade First & Conditional Trade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Grade Level */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  শ্রেণী / কারিকুলাম স্তর
                </label>
                {!(GRADE_LEVELS.find((g) => g.id === selectedGrade)?.hasTrade ?? true) && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
                    ট্রেড প্রযোজ্য নয় (Pre-Voc)
                  </span>
                )}
              </div>
              <select
                value={selectedGrade}
                onChange={(e) => {
                  const newGrade = e.target.value;
                  setSelectedGrade(newGrade);
                  const gObj = GRADE_LEVELS.find((g) => g.id === newGrade);
                  if (!gObj?.hasTrade) {
                    setSelectedTrade("");
                  } else if (!selectedTrade || selectedTrade === "") {
                    setSelectedTrade(TRADES[0].id);
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                {GRADE_LEVELS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trade Selector - Conditionally Rendered for 9-12 */}
            {(GRADE_LEVELS.find((g) => g.id === selectedGrade)?.hasTrade ?? true) && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  টেকনিক্যাল ট্রেড / প্রযুক্তি (৯ম-১২শ)
                </label>
                <select
                  value={selectedTrade || TRADES[0].id}
                  onChange={(e) => {
                    setSelectedTrade(e.target.value);
                    const firstTopic =
                      SUGGESTED_TOPICS_BY_TRADE[e.target.value]?.[0];
                    if (firstTopic) setTopic(firstTopic);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  {TRADES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {/* Topic Input with Chips */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  অধ্যায় / সুনির্দিষ্ট পাঠের টপিক
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  নিচ থেকে ক্লিকে সিলেক্ট করুন
                </span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="যেমন: ওহমের সূত্র, ট্রান্সফরমার, আইপি সাবনেটিং, আরসিসি ঢালাই..."
                className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />

              {/* Smart PDF Auto-Detection Hub Integration */}
              <div className="pt-2">
                <SmartPdfPickerDropdown
                  classId={selectedGrade.includes("9") ? "4" : "5"}
                  tradeCode={selectedTrade}
                  activeDocumentId={selectedPdfDocId}
                  onSelectDocument={(doc: DocumentRepoItem) => {
                    setSelectedPdfDocId(doc.id);
                    setCustomPrompt(
                      `Based on this syllabus section: ${doc.extractedTextSnippet}`,
                    );
                    if (!topic.trim()) setTopic(doc.titleBangla);
                  }}
                  onClearDocument={() => {
                    setSelectedPdfDocId("");
                    setCustomPrompt("");
                  }}
                />
              </div>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(SUGGESTED_TOPICS_BY_TRADE[selectedTrade] || []).map(
                  (suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTopic(suggestion)}
                      className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                        topic === suggestion
                          ? "bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
                      }`}
                    >
                      {suggestion}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Question Count & Question Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    প্রশ্নের সংখ্যা
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCount(!isCustomCount)}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                  >
                    {isCustomCount ? "প্রিসেট পিল" : "কাস্টম সংখ্যা"}
                  </button>
                </div>

                {!isCustomCount ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setQuestionCount(cnt)}
                        className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          questionCount === cnt
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60"
                        }`}
                      >
                        {cnt} টি
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
                      onChange={(e) =>
                        setQuestionCount(
                          Math.min(
                            30,
                            Math.max(1, Number(e.target.value) || 1),
                          ),
                        )
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500"
                      placeholder="১ থেকে ৩০ পর্যন্ত লিখুন"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold shrink-0">
                      টি
                    </span>
                  </div>
                )}
              </div>

              {/* Question Type Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  প্রশ্নের ধরন (Question Format)
                </label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="mcq_single">
                    🔘 বহুনির্বাচনী প্রশ্ন (Single MCQ - ৪ অপশন)
                  </option>
                  <option value="mcq_multiple">
                    ☑️ একাধিক সঠিক উত্তর (Multiple MCQ)
                  </option>
                  <option value="matching">
                    ↔️ বাম-ডান মিলকরণ (Matching Pairs)
                  </option>
                  <option value="fill_blank">
                    ✍️ শূন্যস্থান পূরণ (Fill in the Blank)
                  </option>
                  <option value="true_false">
                    ⚖️ সত্য / মিথ্যা (True or False)
                  </option>
                  <option value="ordering">
                    🔢 সঠিক ক্রমবিন্যাস (Ordering Sequence)
                  </option>
                  <option value="short_answer">
                    📝 সংক্ষিপ্ত প্রশ্ন (Short Question)
                  </option>
                  <option value="mixed">
                    ✨ মিশ্র ধরন (Mixed BTEB Formats)
                  </option>
                </select>
              </div>
            </div>

            {/* Language & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  কাঠিন্য স্তর (Difficulty)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "Easy", label: "সহজ" },
                    { id: "Medium", label: "মাঝারি" },
                    { id: "Hard", label: "কঠিন" },
                    { id: "Mixed", label: "মিশ্র" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDifficulty(d.id as any)}
                      className={`py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                        difficulty === d.id
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  ভাষা (Language)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "Bangla", label: "বাংলা" },
                    { id: "English", label: "English" },
                    { id: "Bilingual", label: "দ্বিভাষিক" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLanguage(l.id as any)}
                      className={`py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                        language === l.id
                          ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-indigo-50/60 dark:bg-gradient-to-r dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/20">
            <div className="text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                স্মার্ট কোটা সুরক্ষা:
              </span>{" "}
              জেমিনাই কোটা শেষ হলেও সিস্টেম ক্র্যাশ না করে তাৎক্ষণিকভাবে BTEB
              প্রশ্নব্যাংক লোড করবে।
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>জেনারেট হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-amber-300" />
                  <span>AI দিয়ে প্রশ্ন তৈরি করুন</span>
                </>
              )}
            </button>
          </div>

          {/* Progress / Step Feedback */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-indigo-300 dark:border-indigo-500/40 flex items-center gap-3 text-indigo-700 dark:text-indigo-300 text-xs"
            >
              <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span>{generationStep}</span>
            </motion.div>
          )}

          {/* Generation Success Meta Badge */}
          {generationMeta && !isGenerating && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                generationMeta.isFallback
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300"
                  : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{generationMeta.message}</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                {generationMeta.isFallback
                  ? "অফলাইন কারিকুলাম ব্যাকআপ"
                  : "Google Gemini AI"}
              </span>
            </div>
          )}

          {/* Generated Questions List & Editor */}
          <div className="space-y-4 pt-2">
            {generatedQuestions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">এখনো কোনো প্রশ্ন তৈরি করা হয়নি।</p>
                <p className="text-[11px] text-slate-400">ওপরের ফর্মে বিষয়, শ্রেণি ও প্রশ্নসংখ্যা নির্ধারণ করে "AI দিয়ে প্রশ্ন তৈরি করুন" বাটনে ক্লিক করুন অথবা নতুন প্রশ্ন যোগ করুন।</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    তৈরিকৃত প্রশ্নাবলী ({generatedQuestions.length} টি)
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    (যে কোনো প্রশ্ন বা উত্তর সরাসরি সম্পাদনাযোগ্য)
                  </span>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => addNewBlankQuestion("mcq_single")}
                      className="text-xs font-semibold px-2.5 py-1 rounded-l-lg bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      নতুন প্রশ্ন যোগ
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddMenu(!showAddMenu)}
                      className="text-xs font-semibold px-1.5 py-1 rounded-r-lg bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border-y border-r border-indigo-200 dark:border-indigo-500/30 transition-colors cursor-pointer"
                      title="প্রশ্নের ধরন নির্বাচন করুন"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {showAddMenu && (
                    <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                      <p className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        প্রশ্নের ধরন নির্বাচন করুন:
                      </p>
                      {[
                        {
                          id: "mcq_single",
                          label: "🔘 বহুনির্বাচনী (MCQ Single)",
                        },
                        {
                          id: "mcq_multiple",
                          label: "☑️ বহুপদী (MCQ Multiple)",
                        },
                        {
                          id: "true_false",
                          label: "⚖️ সত্য / মিথ্যা (True/False)",
                        },
                        {
                          id: "matching",
                          label: "🔗 ডান পাশ-বাম পাশ মিলকরণ (Matching)",
                        },
                        {
                          id: "fill_blank",
                          label: "📝 শূন্যস্থান পূরণ (Fill in Blanks)",
                        },
                        {
                          id: "ordering",
                          label: "🔢 ধারাবাহিক ক্রমবিন্যাস (Ordering)",
                        },
                        {
                          id: "short_answer",
                          label: "✍️ সংক্ষিপ্ত উত্তর (Short Answer)",
                        },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            addNewBlankQuestion(t.id);
                            setShowAddMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Accordion / Card Question List */}
              <div className="space-y-3">
                {generatedQuestions.map((q, qIndex) => {
                  const isExpanded = expandedIndex === qIndex;

                  return (
                    <div
                      key={q.id || qIndex}
                      className="border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50 dark:bg-slate-800/50 overflow-hidden transition-all"
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() =>
                          setExpandedIndex(isExpanded ? null : qIndex)
                        }
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 select-none"
                      >
                        <div className="flex items-center gap-3 flex-1 pr-3">
                          <span className="w-6 h-6 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-500/20 dark:border-indigo-500/30">
                            {qIndex + 1}
                          </span>
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                            {q.question}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {q.type === "true_false" ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold">
                              ⚖️{" "}
                              {q.correctAnswer === false
                                ? "মিথ্যা (False)"
                                : "সত্য (True)"}
                            </span>
                          ) : q.type === "matching" ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold">
                              🔗 মিলকরণ ({(q.pairs || []).length} জোড়া)
                            </span>
                          ) : q.type === "fill_blank" ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700 font-bold">
                              📝 শূন্যস্থান
                            </span>
                          ) : q.type === "ordering" ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 font-bold">
                              🔢 ক্রমবিন্যাস ({(q.items || []).length} ধাপ)
                            </span>
                          ) : q.type === "short_answer" ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 font-bold">
                              ✍️ সংক্ষিপ্ত
                            </span>
                          ) : q.type === "mcq_multiple" ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 font-bold">
                              ☑️ বহু MCQ
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                              সঠিক: অপশন{" "}
                              {["ক", "খ", "গ", "ঘ"][
                                typeof q.correctAnswer === "number"
                                  ? q.correctAnswer
                                  : 0
                              ] || "ক"}
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-medium">
                            {q.timeLimit || 30} সে.
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Accordion Body Editor */}
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/60 space-y-4">
                          {/* Question Format Switcher */}
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-indigo-500" />
                              <span>প্রশ্নের ধরন (Question Format):</span>
                            </label>
                            <select
                              value={q.type || "mcq_single"}
                              onChange={(e) =>
                                handleSwitchModalQuestionType(
                                  qIndex,
                                  e.target.value,
                                )
                              }
                              className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 text-xs font-bold outline-none cursor-pointer"
                            >
                              <option value="mcq_single">
                                🔘 একক বহুনির্বাচনী (MCQ Single)
                              </option>
                              <option value="mcq_multiple">
                                ☑️ একাধিক সঠিক উত্তর (MCQ Multiple)
                              </option>
                              <option value="true_false">
                                ⚖️ সত্য / মিথ্যা (True / False)
                              </option>
                              <option value="matching">
                                🔗 ডান পাশ-বাম পাশ মিলকরণ (Matching)
                              </option>
                              <option value="fill_blank">
                                📝 শূন্যস্থান পূরণ (Fill in Blanks)
                              </option>
                              <option value="ordering">
                                🔢 ধারাবাহিক ক্রমবিন্যাস (Ordering)
                              </option>
                              <option value="short_answer">
                                ✍️ সংক্ষিপ্ত উত্তর (Short Answer)
                              </option>
                            </select>
                          </div>

                          {/* Question Text */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              প্রশ্নের বিবরণ:
                            </label>
                            <textarea
                              rows={2}
                              value={q.question}
                              onChange={(e) =>
                                updateQuestionText(qIndex, e.target.value)
                              }
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Options Radio Grid or Specialized Type Editors */}
                          {(!q.type ||
                            q.type === "mcq_single" ||
                            q.type === "mcq_multiple") && (
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                <span>
                                  {q.type === "mcq_multiple"
                                    ? "অপশনসমূহ ও সঠিক উত্তরসমূহ (টিক দিন):"
                                    : "সম্ভাব্য অপশনসমূহ (সঠিক উত্তরে টিক দিন):"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOpts = [...(q.options || [])];
                                    if (newOpts.length < 6) {
                                      newOpts.push(
                                        `অপশন ${String.fromCharCode(65 + newOpts.length)}`,
                                      );
                                      setGeneratedQuestions((prev) => {
                                        const copy = [...prev];
                                        copy[qIndex] = {
                                          ...copy[qIndex],
                                          options: newOpts,
                                        };
                                        return copy;
                                      });
                                    }
                                  }}
                                  className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                                >
                                  + অপশন যোগ
                                </button>
                              </label>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {(q.options || []).map((opt, optIndex) => {
                                  const isCorrect =
                                    typeof q.correctAnswer === "number"
                                      ? q.correctAnswer === optIndex
                                      : (q.correctIndices || []).includes(
                                          optIndex,
                                        );
                                  return (
                                    <div
                                      key={optIndex}
                                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                        isCorrect
                                          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/50"
                                          : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60"
                                      }`}
                                    >
                                      <input
                                        type={
                                          q.type === "mcq_multiple"
                                            ? "checkbox"
                                            : "radio"
                                        }
                                        name={`correct-${qIndex}`}
                                        checked={isCorrect}
                                        onChange={() => {
                                          if (q.type === "mcq_multiple") {
                                            const cur = q.correctIndices || [];
                                            const next = cur.includes(optIndex)
                                              ? cur.filter(
                                                  (i) => i !== optIndex,
                                                )
                                              : [...cur, optIndex];
                                            setGeneratedQuestions((prev) => {
                                              const copy = [...prev];
                                              copy[qIndex] = {
                                                ...copy[qIndex],
                                                correctIndices: next,
                                              };
                                              return copy;
                                            });
                                          } else {
                                            updateCorrectAnswer(
                                              qIndex,
                                              optIndex,
                                            );
                                          }
                                        }}
                                        className="accent-emerald-500 w-4 h-4 cursor-pointer"
                                      />
                                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {["ক", "খ", "গ", "ঘ", "ঙ", "চ"][
                                          optIndex
                                        ] || String.fromCharCode(65 + optIndex)}
                                        .
                                      </span>
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) =>
                                          updateOptionText(
                                            qIndex,
                                            optIndex,
                                            e.target.value,
                                          )
                                        }
                                        className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none font-medium"
                                      />
                                      {(q.options || []).length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newOpts = (
                                              q.options || []
                                            ).filter(
                                              (_, idx) => idx !== optIndex,
                                            );
                                            let newAns =
                                              typeof q.correctAnswer ===
                                              "number"
                                                ? q.correctAnswer
                                                : 0;
                                            if (newAns >= newOpts.length)
                                              newAns = 0;
                                            setGeneratedQuestions((prev) => {
                                              const copy = [...prev];
                                              copy[qIndex] = {
                                                ...copy[qIndex],
                                                options: newOpts,
                                                correctAnswer: newAns,
                                              };
                                              return copy;
                                            });
                                          }}
                                          className="p-1 text-slate-400 hover:text-rose-500"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Matching Pairs Editor */}
                          {(q.type === "matching" || (!q.type && q.pairs)) && (
                            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                  বাম-ডান মিলকরণ জোড়সমূহ (Matching Pairs):
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const pairs = [...(q.pairs || [])];
                                    if (pairs.length < 6) {
                                      pairs.push({
                                        left: `বাম পাশ ${pairs.length + 1}`,
                                        right: `ডান পাশ ${pairs.length + 1}`,
                                      });
                                      setGeneratedQuestions((prev) => {
                                        const copy = [...prev];
                                        copy[qIndex] = {
                                          ...copy[qIndex],
                                          pairs,
                                        };
                                        return copy;
                                      });
                                    }
                                  }}
                                  className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                                >
                                  + জোড় যোগ
                                </button>
                              </div>
                              <div className="space-y-1.5">
                                {(
                                  q.pairs || [
                                    { left: "বাম পাশ ১", right: "ডান পাশ ১" },
                                    { left: "বাম পাশ ২", right: "ডান পাশ ২" },
                                  ]
                                ).map((p, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                      {pIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={p.left}
                                      onChange={(e) => {
                                        const pairs = [...(q.pairs || [])];
                                        pairs[pIdx] = {
                                          ...pairs[pIdx],
                                          left: e.target.value,
                                        };
                                        setGeneratedQuestions((prev) => {
                                          const copy = [...prev];
                                          copy[qIndex] = {
                                            ...copy[qIndex],
                                            pairs,
                                          };
                                          return copy;
                                        });
                                      }}
                                      placeholder="বাম পাশ"
                                      className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                                    />
                                    <span className="text-slate-400 font-bold">
                                      ↔
                                    </span>
                                    <input
                                      type="text"
                                      value={p.right}
                                      onChange={(e) => {
                                        const pairs = [...(q.pairs || [])];
                                        pairs[pIdx] = {
                                          ...pairs[pIdx],
                                          right: e.target.value,
                                        };
                                        setGeneratedQuestions((prev) => {
                                          const copy = [...prev];
                                          copy[qIndex] = {
                                            ...copy[qIndex],
                                            pairs,
                                          };
                                          return copy;
                                        });
                                      }}
                                      placeholder="ডান পাশ"
                                      className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                                    />
                                    {(q.pairs || []).length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const pairs = (q.pairs || []).filter(
                                            (_, idx) => idx !== pIdx,
                                          );
                                          setGeneratedQuestions((prev) => {
                                            const copy = [...prev];
                                            copy[qIndex] = {
                                              ...copy[qIndex],
                                              pairs,
                                            };
                                            return copy;
                                          });
                                        }}
                                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Fill in the Blank Editor */}
                          {(q.type === "fill_blank" ||
                            (!q.type && q.acceptedAnswers)) && (
                            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                              <label className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                গ্রহণযোগ্য সঠিক উত্তরসমূহ (Accepted Answers):
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {(q.acceptedAnswers || ["সঠিক উত্তর"]).map(
                                  (ans, aIdx) => (
                                    <span
                                      key={aIdx}
                                      className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5"
                                    >
                                      <span>{ans}</span>
                                      {(q.acceptedAnswers || []).length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const answers = (
                                              q.acceptedAnswers || []
                                            ).filter((_, idx) => idx !== aIdx);
                                            setGeneratedQuestions((prev) => {
                                              const copy = [...prev];
                                              copy[qIndex] = {
                                                ...copy[qIndex],
                                                acceptedAnswers: answers,
                                              };
                                              return copy;
                                            });
                                          }}
                                          className="text-rose-500 hover:text-rose-700"
                                        >
                                          ×
                                        </button>
                                      )}
                                    </span>
                                  ),
                                )}
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  id={`modal-blank-input-${qIndex}`}
                                  placeholder="বিকল্প উত্তর লিখুন..."
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      const val = e.currentTarget.value.trim();
                                      if (val) {
                                        const answers = [
                                          ...(q.acceptedAnswers || []),
                                        ];
                                        if (!answers.includes(val))
                                          answers.push(val);
                                        setGeneratedQuestions((prev) => {
                                          const copy = [...prev];
                                          copy[qIndex] = {
                                            ...copy[qIndex],
                                            acceptedAnswers: answers,
                                          };
                                          return copy;
                                        });
                                        e.currentTarget.value = "";
                                      }
                                    }
                                  }}
                                  className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const el = document.getElementById(
                                      `modal-blank-input-${qIndex}`,
                                    ) as HTMLInputElement;
                                    if (el && el.value.trim()) {
                                      const answers = [
                                        ...(q.acceptedAnswers || []),
                                      ];
                                      if (!answers.includes(el.value.trim()))
                                        answers.push(el.value.trim());
                                      setGeneratedQuestions((prev) => {
                                        const copy = [...prev];
                                        copy[qIndex] = {
                                          ...copy[qIndex],
                                          acceptedAnswers: answers,
                                        };
                                        return copy;
                                      });
                                      el.value = "";
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                                >
                                  + যোগ
                                </button>
                              </div>
                            </div>
                          )}

                          {/* True / False Editor */}
                          {q.type === "true_false" && (
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setGeneratedQuestions((prev) => {
                                    const copy = [...prev];
                                    copy[qIndex] = {
                                      ...copy[qIndex],
                                      correctAnswer: true as any,
                                    };
                                    return copy;
                                  });
                                }}
                                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                                  q.correctAnswer === true
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                True (সত্য)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setGeneratedQuestions((prev) => {
                                    const copy = [...prev];
                                    copy[qIndex] = {
                                      ...copy[qIndex],
                                      correctAnswer: false as any,
                                    };
                                    return copy;
                                  });
                                }}
                                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                                  q.correctAnswer === false
                                    ? "bg-rose-600 text-white border-rose-600"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                False (মিথ্যা)
                              </button>
                            </div>
                          )}

                          {/* Ordering Sequence Editor */}
                          {q.type === "ordering" && (
                            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                                  সঠিক ক্রমবিন্যাস সাজান (Sequence Steps):
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const items = [...(q.items || [])];
                                    if (items.length < 6) {
                                      items.push(`ধাপ ${items.length + 1}`);
                                      setGeneratedQuestions((prev) => {
                                        const copy = [...prev];
                                        copy[qIndex] = {
                                          ...copy[qIndex],
                                          items,
                                        };
                                        return copy;
                                      });
                                    }
                                  }}
                                  className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
                                >
                                  + ধাপ যোগ
                                </button>
                              </div>
                              <div className="space-y-1.5">
                                {(q.items || ["ধাপ ১", "ধাপ ২", "ধাপ ৩"]).map(
                                  (itemText, iIdx) => (
                                    <div
                                      key={iIdx}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="w-5 h-5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                        {iIdx + 1}
                                      </span>
                                      <input
                                        type="text"
                                        value={itemText}
                                        onChange={(e) => {
                                          const items = [...(q.items || [])];
                                          items[iIdx] = e.target.value;
                                          setGeneratedQuestions((prev) => {
                                            const copy = [...prev];
                                            copy[qIndex] = {
                                              ...copy[qIndex],
                                              items,
                                            };
                                            return copy;
                                          });
                                        }}
                                        className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                                      />
                                      {(q.items || []).length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const items = (
                                              q.items || []
                                            ).filter((_, idx) => idx !== iIdx);
                                            setGeneratedQuestions((prev) => {
                                              const copy = [...prev];
                                              copy[qIndex] = {
                                                ...copy[qIndex],
                                                items,
                                              };
                                              return copy;
                                            });
                                          }}
                                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                          {/* Short Answer Editor */}
                          {q.type === "short_answer" && (
                            <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                              <label className="text-xs font-bold text-purple-700 dark:text-purple-300">
                                মূল ধারণা কি-ওয়ার্ড (Core Keyword):
                              </label>
                              <input
                                type="text"
                                value={q.expectedAnswerKeyword || ""}
                                onChange={(e) => {
                                  setGeneratedQuestions((prev) => {
                                    const copy = [...prev];
                                    copy[qIndex] = {
                                      ...copy[qIndex],
                                      expectedAnswerKeyword: e.target.value,
                                    };
                                    return copy;
                                  });
                                }}
                                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                                placeholder="যেমন: ওহমের সূত্র..."
                              />
                            </div>
                          )}

                          {/* Explanation */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              কারিগরি ব্যাখ্যা (শিক্ষার্থীদের ফলাফলের পর
                              প্রদর্শিত হবে):
                            </label>
                            <input
                              type="text"
                              value={q.explanation || ""}
                              onChange={(e) =>
                                updateExplanation(qIndex, e.target.value)
                              }
                              placeholder="১ লাইনের বৈজ্ঞানিক ব্যাখ্যা..."
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Delete Question Button */}
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => deleteQuestion(qIndex)}
                              className="text-xs font-semibold text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 flex items-center gap-1.5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              প্রশ্নটি মুছে ফেলুন
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              disabled={generatedQuestions.length === 0}
              className="text-xs px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 disabled:opacity-40 transition-colors"
            >
              {copiedJson ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedJson ? "কপি হয়েছে!" : "JSON কপি"}</span>
            </button>

            {savedSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                প্রশ্নব্যাংকে সফলভাবে সংরক্ষিত!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveToBank}
              disabled={generatedQuestions.length === 0}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>প্রশ্নব্যাংকে সেভ করুন</span>
            </button>

            <button
              type="button"
              onClick={handleLaunchLive}
              disabled={generatedQuestions.length === 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center gap-2 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>সরাসরি লাইভ কুইজ খেলুন</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
