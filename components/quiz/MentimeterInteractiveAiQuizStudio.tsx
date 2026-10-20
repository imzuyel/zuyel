"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  BookOpen,
  Layers,
  ArrowRight,
  ArrowLeft,
  Save,
  HelpCircle,
  FileText,
  Settings,
  RefreshCw,
  Check,
  X,
  Play,
  ArrowUp,
  ArrowDown,
  Copy,
  Eye,
  AlertCircle,
  Wand2,
  Radio,
  Cpu,
  Zap,
  CheckSquare,
  ShieldCheck,
  Flame,
  Award,
  Loader2,
  Send,
  UploadCloud,
  FileCheck,
  Bot,
  User,
  Sliders,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Volume2,
  Shuffle,
  Trophy,
  Lock,
  Unlock,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { institutionalDb, Quiz } from "@/lib/database";
import { BtebQuizQuestion } from "@/lib/quizAiGenerator";
import SmartPdfPickerDropdown from "@/components/common/SmartPdfPickerDropdown";

export type MentimeterQuestionType =
  | "mcq_single"
  | "true_false"
  | "matching"
  | "fill_blank"
  | "ordering"
  | "mcq_multiple"
  | "short_answer"
  // Mentimeter Interactive Presentation & Engagement Slides
  | "word_cloud"
  | "open_ended"
  | "scales_rating"
  | "qa_slide"
  | "welcome_intro"
  | "rules_guidelines"
  | "feedback_pulse"
  | "leaderboard_break";

export const isSlideType = (type: MentimeterQuestionType | string): boolean => {
  return [
    "welcome_intro",
    "rules_guidelines",
    "feedback_pulse",
    "leaderboard_break",
    "word_cloud",
    "open_ended",
    "scales_rating",
    "qa_slide"
  ].includes(type);
};

export const isQuizPart = (type: MentimeterQuestionType | string): boolean => {
  return !isSlideType(type);
};

export interface MentimeterQuestionItem {
  id: string;
  type: MentimeterQuestionType;
  questionText: string;
  options: string[];
  correctIndex: number;
  correctIndices?: number[];
  correctAnswer?: boolean;
  pairs?: { left: string; right: string }[];
  items?: string[];
  acceptedAnswers?: string[];
  expectedAnswerKeyword?: string;
  explanation: string;
  marks: number;
  timeLimit: number;
  isQuizPart?: boolean; // Scored competitive quiz (true) vs Mentimeter un-timed interactive slide (false)
  slideCategory?: "quiz" | "slide";
  difficulty?: "Easy" | "Medium" | "Hard";
  sourcePrompt?: string;
  isAiGenerated?: boolean;
}

export const QUESTION_TYPES_REGISTRY = [
  // Interactive Quiz Questions (isQuizPart: true)
  { id: "mcq_single", label: "🔘 বহুনির্বাচনী প্রশ্ন (MCQ Single)", short: "MCQ", icon: "🔘", desc: "৪টি অপশন থেকে ১টি সঠিক উত্তর", category: "question", isQuizPart: true },
  { id: "true_false", label: "⚖️ সত্য / মিথ্যা (True / False)", short: "সত্য/মিথ্যা", icon: "⚖️", desc: "বিবৃতিটি সত্য নাকি মিথ্যা নির্বাচন", category: "question", isQuizPart: true },
  { id: "matching", label: "🔗 ডান পাশ - বাম পাশ মিলকরণ", short: "ডান-বাম মিল", icon: "🔗", desc: "বাম কলামের সাথে ডান কলাম জোড়া মিল", category: "question", isQuizPart: true },
  { id: "fill_blank", label: "📝 শূন্যস্থান পূরণ (Fill Blank)", short: "শূন্যস্থান", icon: "📝", desc: "বাক্যের মধ্যে সঠিক শব্দ বসানো", category: "question", isQuizPart: true },
  { id: "ordering", label: "🔢 ধারাবাহিক ক্রম সাজানো (Ordering)", short: "ক্রম সাজানো", icon: "🔢", desc: "কাজের ধাপ ক্রমানুসারে সাজানো", category: "question", isQuizPart: true },
  { id: "mcq_multiple", label: "☑️ বহুপদী সমাপ্তিসূচক (Multi-Select)", short: "বহুপদী", icon: "☑️", desc: "একাধিক সঠিক উত্তর নির্বাচন", category: "question", isQuizPart: true },
  { id: "short_answer", label: "✍️ এক কথায় উত্তর (Short Answer)", short: "এক কথায়", icon: "✍️", desc: "কিবোর্ড দিয়ে সংক্ষিপ্ত উত্তর টাইপ", category: "question", isQuizPart: true },
  // Mentimeter Interactive Presentation & Engagement Slides (isQuizPart: false - Un-timed & No scoring)
  { id: "word_cloud", label: "☁️ ওয়ার্ড ক্লাউড (Word Cloud)", short: "ওয়ার্ড ক্লাউড", icon: "☁️", desc: "শিক্ষার্থীদের মতামত ও শব্দগুচ্ছ নিয়ে লাইভ ক্লাউড", category: "slide", isQuizPart: false },
  { id: "open_ended", label: "💭 মুক্ত মতামত (Open Ended)", short: "মুক্ত মতামত", icon: "💭", desc: "শিক্ষার্থীদের উন্মুক্ত প্রতিক্রিয়া ও চিন্তাভাবনা সংগ্রহ", category: "slide", isQuizPart: false },
  { id: "scales_rating", label: "⭐ রেটিং স্কেল (Scales / Rating)", short: "রেটিং স্কেল", icon: "⭐", desc: "১ থেকে ৫ তারকা রেটিং বা আত্মবিশ্বাসের স্কেল", category: "slide", isQuizPart: false },
  { id: "qa_slide", label: "🙋 উন্মুক্ত প্রশ্নোত্তর (Audience Q&A)", short: "প্রশ্নোত্তর", icon: "🙋", desc: "শিক্ষার্থীরা সরাসরি শিক্ষককে প্রশ্ন পাঠাতে পারবে", category: "slide", isQuizPart: false },
  { id: "welcome_intro", label: "👋 স্বাগতম ও পরিচিতি (Welcome & Intro)", short: "স্বাগতম", icon: "👋", desc: "কুইজের বিষয়, উপস্থাপক/শিক্ষকের পরিচয় ও শুভেচ্ছা", category: "slide", isQuizPart: false },
  { id: "rules_guidelines", label: "📜 কুইজের নিয়মাবলী ও গাইডলাইন (Rules)", short: "নিয়মাবলী", icon: "📜", desc: "সময়, পয়েন্ট কাঠামো, সততা ও নির্দেশনা", category: "slide", isQuizPart: false },
  { id: "feedback_pulse", label: "💬 শিক্ষার্থী ফিডব্যাক ও পালস চেক (Feedback)", short: "ফিডব্যাক", icon: "💬", desc: "গত ক্লাসের অভিজ্ঞতা বা মতামত সংগ্রহ", category: "slide", isQuizPart: false },
  { id: "leaderboard_break", label: "🏆 লিডারবোর্ড বিরতি (Leaderboard Break)", short: "লিডারবোর্ড", icon: "🏆", desc: "নির্দিষ্ট প্রশ্নের পর অন্তর্বর্তীকালীন র‍্যাঙ্কিং", category: "slide", isQuizPart: false },
] as const;

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  actionSummary?: string;
  generatedCount?: number;
}

interface MentimeterInteractiveAiQuizStudioProps {
  initialQuiz?: Quiz | null;
  onSaveSuccess?: (quiz: Quiz, published: boolean) => void;
  onCancel?: () => void;
  onLaunchLiveArena?: (quizId: string) => void;
  isLiveMode?: boolean;
}

const CLASS_OPTIONS = [
  { id: 1, numeric: 6, name: "৬ষ্ঠ শ্রেণি (Pre-Voc)", levelBadge: "Pre-Vocational", hasTrade: false },
  { id: 2, numeric: 7, name: "৭ম শ্রেণি (Pre-Voc)", levelBadge: "Pre-Vocational", hasTrade: false },
  { id: 3, numeric: 8, name: "৮ম শ্রেণি (Pre-Voc)", levelBadge: "Pre-Vocational", hasTrade: false },
  { id: 4, numeric: 9, name: "৯ম শ্রেণি (SSC Voc)", levelBadge: "SSC Voc", hasTrade: true },
  { id: 5, numeric: 10, name: "১০ম শ্রেণি (SSC Voc)", levelBadge: "SSC Voc", hasTrade: true },
  { id: 6, numeric: 11, name: "১১শ শ্রেণি (HSC Voc)", levelBadge: "HSC Voc", hasTrade: true },
  { id: 7, numeric: 12, name: "১২শ শ্রেণি (HSC Voc)", levelBadge: "HSC Voc", hasTrade: true },
];

const isClassTradeEligible = (classId: number): boolean => {
  return classId >= 4; // Class 9, 10, 11, 12 (IDs 4..7)
};

const TRADE_LIST = [
  { id: "IT Support & IoT", name: "কম্পিউটার ও আইটি সাপোর্ট (IT Support & IoT)", icon: "💻" },
  { id: "Electrical Installation", name: "ইলেকট্রিক্যাল ইনস্টলেশন ও মেইনটেন্যান্স", icon: "⚡" },
  { id: "Civil Drafting & Construction", name: "সিভিল ড্রাফটিং ও কনস্ট্রাকশন", icon: "📐" },
  { id: "Automotive & Mechanical", name: "অটোমোটিভ ও মেকানিক্যাল ইঞ্জিনিয়ারিং", icon: "🚗" },
  { id: "Refrigeration & AC", name: "রেফ্রিজারেশন ও এয়ার কন্ডিশনিং (RAC)", icon: "❄️" },
  { id: "General Science & Math", name: "সাধারণ কারিগরি বিজ্ঞান ও ফলিত গণিত", icon: "🔬" }
];

const FAST_SUGGESTION_PROMPTS = [
  "এই টপিক থেকে আরও ৫টি জটিল প্রশ্ন তৈরি করুন",
  "ল্যাব প্র্যাকটিক্যাল ও হ্যান্ডস-অন ভিত্তিক ৩টি প্রশ্ন দিন",
  "ভুল বোঝাবুঝি দূর করার মতো ট্রিকি MCQ যুক্ত করুন",
  "বিটিইবি কারিগরি বোর্ড পরীক্ষার উপযোগী ৫টি প্রশ্ন দিন",
  "ব্যাখ্যাগুলো আরও বিস্তারিত ও তথ্যবহুল করুন"
];

export default function MentimeterInteractiveAiQuizStudio({
  initialQuiz,
  onSaveSuccess,
  onCancel,
  onLaunchLiveArena,
}: MentimeterInteractiveAiQuizStudioProps) {
  // Quiz Meta State
  const [quizTitle, setQuizTitle] = useState(initialQuiz?.title || "");
  const [quizDescription, setQuizDescription] = useState(initialQuiz?.description || "");
  const [selectedTrade, setSelectedTrade] = useState("IT Support & IoT");
  const [selectedClassId, setSelectedClassId] = useState<number>(initialQuiz?.classId || 4);
  const [defaultMarks, setDefaultMarks] = useState<number>(initialQuiz?.defaultMarks || 2);
  const [defaultTime, setDefaultTime] = useState<number>(initialQuiz?.defaultQuestionTime || 30);
  const [category, setCategory] = useState(initialQuiz?.category || "Class Test");

  // Questions Canvas State (Right Panel)
  const [questions, setQuestions] = useState<MentimeterQuestionItem[]>([]);
  const [presentationSlides, setPresentationSlides] = useState<MentimeterQuestionItem[]>([]);
  const [activeCanvasTab, setActiveCanvasTab] = useState<"questions" | "presentation">("questions");
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  // Left Panel Assistant & Chat State
  const [chatInput, setChatInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [selectedPdfDoc, setSelectedPdfDoc] = useState<any | null>(null);
  const [referenceText, setReferenceText] = useState("");
  const [isDocContextOpen, setIsDocContextOpen] = useState(false);
  const [questionCountPill, setQuestionCountPill] = useState<number>(5);
  const [difficultyPill, setDifficultyPill] = useState<"Easy" | "Medium" | "Hard" | "Mixed">("Mixed");
  const [languagePill, setLanguagePill] = useState<"Bangla" | "English" | "Bilingual">("Bangla");
  const [aiQuestionType, setAiQuestionType] = useState<string>("mixed");
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Chat Log History
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "স্বাগতম! আমি আপনার ইন্টারেক্টিভ কুইজ ও ডকুমেন্ট অ্যাসিস্ট্যান্ট। নিচে আপনার টপিক বা নির্দেশিকা লিখুন, অথবা রেফারেন্স পিডিএফ সিলেক্ট করে প্রশ্ন তৈরি করতে বলুন। ডানপাশের ক্যানভাসে সরাসরি প্রশ্নসমূহ যোগ হবে।",
      timestamp: "10:00 AM",
    }
  ]);

  // Saving / Feedback States
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Live Student Simulator Modal
  const [showSimulator, setShowSimulator] = useState(false);
  const [simActiveIndex, setSimActiveIndex] = useState(0);
  const [simSelectedOption, setSimSelectedOption] = useState<number | null>(null);
  const [simShowExplanation, setSimShowExplanation] = useState(false);

  // Leaderboard Auto-Insert & Placement State
  const [leaderboardInterval, setLeaderboardInterval] = useState<number>(5);
  const [showLeaderboardTool, setShowLeaderboardTool] = useState(false);

  // Live Presenter Session & Editing Lock State
  const [isLiveActive, setIsLiveActive] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const canvasEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isGenerating]);

  // Load initial questions if editing an existing quiz
  useEffect(() => {
    if (initialQuiz?.id) {
      setQuizTitle(initialQuiz.title);
      setQuizDescription(initialQuiz.description || "");
      setDefaultMarks(initialQuiz.defaultMarks || 2);
      setDefaultTime(initialQuiz.defaultQuestionTime || 30);

      fetch(`/api/quizzes/${initialQuiz.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (Array.isArray(data.presentationSlides)) {
              const mappedSlides: MentimeterQuestionItem[] = data.presentationSlides.map((s: any, idx: number) => ({
                id: s.id || `s-init-${idx}`,
                type: s.type as MentimeterQuestionType,
                questionText: s.questionText || s.question || "",
                options: s.options || [],
                correctIndex: s.correctIndex ?? 0,
                correctAnswer: s.correctAnswer,
                explanation: s.explanation || "",
                marks: 0,
                timeLimit: s.timeLimit || 15,
              }));
              setPresentationSlides(mappedSlides);
            } else if (initialQuiz.presentationSlides) {
              setPresentationSlides(initialQuiz.presentationSlides);
            }

            if (Array.isArray(data.questions) && data.questions.length > 0) {
              const mapped: MentimeterQuestionItem[] = data.questions.map((qq: any, idx: number) => {
                const snap = qq.questionSnapshot || qq;
                const snapData = snap.questionData || {};
                const detectedType = qq.questionType || snap.type || snapData.type || (snap.pairs || snapData.pairs ? "matching" : "mcq_single");
                return {
                  id: qq.id || `q-init-${idx}`,
                  type: detectedType as MentimeterQuestionType,
                  questionText: snap.questionText || qq.questionText || `প্রশ্ন ${idx + 1}`,
                  options: snap.options || snapData.options || ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
                  correctIndex: typeof snap.correctIndex === "number" ? snap.correctIndex : snapData.correctIndex ?? 0,
                  correctIndices: snap.correctIndices || snapData.correctIndices,
                  correctAnswer: typeof snap.correctAnswer === "boolean" ? snap.correctAnswer : snapData.correctAnswer,
                  pairs: snap.pairs || snapData.pairs,
                  acceptedAnswers: snap.acceptedAnswers || snapData.acceptedAnswers,
                  items: snap.items || snapData.items,
                  expectedAnswerKeyword: snap.expectedAnswerKeyword || snapData.expectedAnswerKeyword,
                  explanation: snap.explanation || snapData.explanation || "",
                  marks: qq.marks || 2,
                  timeLimit: qq.timeLimit || 30,
                  isAiGenerated: false,
                };
              });
              setQuestions(mapped);
              setActiveQuestionId(mapped[0]?.id || null);
            }
          }
        })
        .catch(() => {
          const qqs = institutionalDb.quizQuestions.filter((qq) => qq.quizId === initialQuiz.id);
          if (qqs.length > 0) {
            const mapped: MentimeterQuestionItem[] = qqs.map((qq, idx) => {
              const snap = qq.questionSnapshot || {};
              const snapData = snap.questionData || {};
              const detectedType = qq.questionType || snap.type || snapData.type || (snap.pairs || snapData.pairs ? "matching" : "mcq_single");
              return {
                id: qq.id,
                type: detectedType as MentimeterQuestionType,
                questionText: snap.questionText || `প্রশ্ন ${idx + 1}`,
                options: snap.options || snapData.options || ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
                correctIndex: typeof snap.correctIndex === "number" ? snap.correctIndex : 0,
                correctIndices: snap.correctIndices || snapData.correctIndices,
                correctAnswer: typeof snap.correctAnswer === "boolean" ? snap.correctAnswer : snapData.correctAnswer,
                pairs: snap.pairs || snapData.pairs,
                acceptedAnswers: snap.acceptedAnswers || snapData.acceptedAnswers,
                items: snap.items || snapData.items,
                expectedAnswerKeyword: snap.expectedAnswerKeyword || snapData.expectedAnswerKeyword,
                explanation: snap.explanation || "",
                marks: qq.marks || 2,
                timeLimit: qq.timeLimit || 30,
              };
            });
            setQuestions(mapped);
          }
        });
    }
  }, [initialQuiz]);

  // ==========================================================
  // CONTINUOUS AI CHAT & QUESTION GENERATOR HANDLER
  // Appends/refines questions into right canvas without data loss
  // ==========================================================
  const handleSendChatMessage = async (promptOverride?: string) => {
    const promptToSend = (promptOverride || chatInput).trim();
    if (!promptToSend && !referenceText.trim() && !selectedPdfDoc) {
      setFeedback({ message: "অনুগ্রহ করে কোনো নির্দেশিকা বা টপিক লিখুন।", type: "error" });
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: promptToSend || "রেফারেন্স ডকুমেন্ট থেকে প্রশ্ন তৈরি করো",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsGenerating(true);
    setFeedback(null);
    setGenerationStep("কারিগরি প্যারামিটার ও ডকুমেন্ট বিশ্লেষণ করা হচ্ছে...");

    try {
      setTimeout(() => setGenerationStep("জেমিনাই এআই মডেলের মাধ্যমে প্রশ্ন তৈরি হচ্ছে..."), 600);
      setTimeout(() => setGenerationStep("বোর্ড কারিকুলাম ও সঠিক উত্তরের যুক্তি যাচাই হচ্ছে..."), 1400);

      // Determine topic from prompt or trade
      const isTradeEligible = isClassTradeEligible(selectedClassId);
      const currentClassObj = CLASS_OPTIONS.find((c) => c.id === selectedClassId);
      const currentTrade = isTradeEligible ? (selectedTrade || TRADE_LIST[0].id) : "সাধারণ বিষয় ও দক্ষতা";
      const gradeTitle = currentClassObj ? `${currentClassObj.name} (${currentClassObj.levelBadge})` : `Class ${selectedClassId}`;
      const topicText = promptToSend || selectedPdfDoc?.title || (isTradeEligible ? `${currentTrade} - প্র্যাকটিক্যাল স্কিলস` : `${gradeTitle} - পাঠ্যবই ও সাধারণ দক্ষতা`);

      const res = await fetch("/api/ai/quiz-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trade: isTradeEligible ? currentTrade : "General / Pre-Vocational (সাধারণ বিষয়)",
          gradeLevel: gradeTitle,
          topic: topicText,
          questionCount: questionCountPill,
          difficulty: difficultyPill,
          language: languagePill,
          questionType: aiQuestionType,
          customInstructions: promptToSend,
          referencePdfTitle: selectedPdfDoc?.title || "",
          referencePdfId: selectedPdfDoc?.id || "",
          referenceText: referenceText.trim(),
        }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        const newFormatted: MentimeterQuestionItem[] = data.questions.map((q: BtebQuizQuestion, idx: number) => {
          const detectedType: MentimeterQuestionType =
            (q.type as any) ||
            (q.pairs && q.pairs.length > 0
              ? "matching"
              : q.acceptedAnswers && q.acceptedAnswers.length > 0
              ? "fill_blank"
              : typeof q.correctAnswer === "boolean"
              ? "true_false"
              : q.items && q.items.length > 0
              ? "ordering"
              : "mcq_single");

          return {
            id: `ai-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            type: detectedType,
            questionText: q.question,
            options: q.options && q.options.length >= 2 ? q.options : ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
            correctIndex: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
            correctIndices: q.correctIndices,
            correctAnswer: typeof q.correctAnswer === "boolean" ? q.correctAnswer : true,
            pairs: q.pairs && q.pairs.length > 0 ? q.pairs : detectedType === "matching" ? [
              { left: "বাম আইটেম ১", right: "ডান তথ্য ১" },
              { left: "বাম আইটেম ২", right: "ডান তথ্য ২" },
              { left: "বাম আইটেম ৩", right: "ডান তথ্য ৩" },
            ] : undefined,
            acceptedAnswers: q.acceptedAnswers,
            items: q.items,
            expectedAnswerKeyword: q.expectedAnswerKeyword,
            explanation: q.explanation || "সঠিক উত্তরের কারিগরি বিশ্লেষণ।",
            marks: defaultMarks,
            timeLimit: q.timeLimit || defaultTime,
            difficulty: q.difficulty || (difficultyPill === "Mixed" ? "Medium" : difficultyPill),
            sourcePrompt: promptToSend,
            isAiGenerated: true,
          };
        });

        // Set quiz title if empty
        if (!quizTitle.trim()) {
          if (isTradeEligible) {
            setQuizTitle(`${currentTrade} — ${topicText.slice(0, 30)} কুইজ`);
          } else {
            setQuizTitle(`${currentClassObj?.name || "শ্রেণি"} — ${topicText.slice(0, 30)} কুইজ`);
          }
        }

        // Seamlessly APPEND new questions directly to existing questions canvas
        setQuestions((prev) => [...prev, ...newFormatted]);
        setActiveQuestionId(newFormatted[0]?.id || null);

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "assistant",
          text: `আপনার নির্দেশিকা অনুযায়ী ${newFormatted.length}টি প্রশ্ন সফলভাবে তৈরি হয়ে ডানপাশের ক্যানভাসে যুক্ত হয়েছে!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actionSummary: `+${newFormatted.length}টি প্রশ্ন যুক্ত হয়েছে`,
          generatedCount: newFormatted.length,
        };
        setChatMessages((prev) => [...prev, aiMsg]);

        // Auto-scroll canvas to bottom
        setTimeout(() => {
          canvasEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const failMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          sender: "system",
          text: data.message || "প্রশ্ন তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatMessages((prev) => [...prev, failMsg]);
      }
    } catch (err: any) {
      const errSysMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "system",
        text: "সার্ভার সংযোগে ত্রুটি দেখা দিয়েছে। অফলাইন ব্যাকআপ ব্যবহার করতে পারেন।",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, errSysMsg]);
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  // ==========================================================
  // HYBRID EDITING & CRUD HANDLERS ON RIGHT CANVAS
  // ==========================================================
  const getActiveSetter = () => {
    return activeCanvasTab === "questions" ? setQuestions : setPresentationSlides;
  };

  const handleUpdateQuestion = (id: string, updates: Partial<MentimeterQuestionItem>) => {
    const setter = getActiveSetter();
    setter((prev) => {
      return prev.map((q) => (q.id === id ? { ...q, ...updates } : q));
    });
  };

  const handleOptionChange = (questionId: string, optIndex: number, newText: string) => {
    const setter = getActiveSetter();
    setter((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const newOpts = [...q.options];
        newOpts[optIndex] = newText;
        return { ...q, options: newOpts };
      })
    );
  };

  const handleAddOption = (questionId: string) => {
    const setter = getActiveSetter();
    setter((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        if (q.options.length >= 6) return q;
        const letter = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"][q.options.length] || String.fromCharCode(65 + q.options.length);
        return { ...q, options: [...q.options, `নতুন অপশন ${letter}`] };
      })
    );
  };

  const handleDeleteOption = (questionId: string, optIndex: number) => {
    const setter = getActiveSetter();
    setter((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        if (q.options.length <= 2) return q;
        const newOpts = q.options.filter((_, idx) => idx !== optIndex);
        let newCorrect = q.correctIndex;
        if (newCorrect >= newOpts.length) {
          newCorrect = 0;
        } else if (newCorrect > optIndex) {
          newCorrect -= 1;
        }
        return { ...q, options: newOpts, correctIndex: newCorrect };
      })
    );
  };

  const handleAddNewManualQuestion = (type: MentimeterQuestionType = "mcq_single") => {
    const newId = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    let defaultQuestionText = `নতুন প্রশ্ন ${questions.length + 1}`;
    let defaultOptions = ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"];
    let defaultCorrectIndex = 0;
    let defaultCorrectAnswer: boolean | undefined = undefined;
    let defaultPairs: { left: string; right: string }[] | undefined = undefined;
    let defaultAcceptedAnswers: string[] | undefined = undefined;
    let defaultItems: string[] | undefined = undefined;
    let defaultExpectedAnswerKeyword: string | undefined = undefined;
    let internalExplanation = "";

    const isSlide = isSlideType(type);

    if (type === "word_cloud") {
      defaultQuestionText = `আজকের বিষয়কে ১ বা ২ শব্দে প্রকাশ করো (Word Cloud):`;
      defaultOptions = ["উদ্ভাবন", "প্রযুক্তি", "ভবিষ্যৎ", "দক্ষতা", "পরিশ্রম"];
      internalExplanation = "শিক্ষার্থীদের দেওয়া শব্দ দিয়ে স্ক্রিনে লাইভ ওয়ার্ড ক্লাউড তৈরি হবে।";
    } else if (type === "open_ended") {
      defaultQuestionText = `আজকের ক্লাস বা টপিক সম্পর্কে তোমার মুক্ত মতামত বা উপলব্ধি লিখো:`;
      defaultOptions = [];
      internalExplanation = "কোনো নম্বর বা পয়েন্ট ছাড়াই শিক্ষার্থীরা তাদের চিন্তা প্রকাশ করতে পারবে।";
    } else if (type === "scales_rating") {
      defaultQuestionText = `আজকের অনুশীলনের বিষয়বস্তুর ওপর তোমার আত্মবিশ্বাস কতটুকু? (১ থেকে ৫ রেটিং দাও):`;
      defaultOptions = ["১ - দুর্বল", "২ - মোটামুটি", "৩ - সন্তোষজনক", "৪ - ভালো", "৫ - চমৎকার"];
      internalExplanation = "শিক্ষার্থীদের আত্মবিশ্বাস ও সন্তুষ্টির লাইভ স্কেল।";
    } else if (type === "qa_slide") {
      defaultQuestionText = `উন্মুক্ত প্রশ্নোত্তর সেশন: পাঠ সম্পর্কিত যেকোনো প্রশ্ন উপস্থাপককে জিজ্ঞেস করুন:`;
      defaultOptions = [];
      internalExplanation = "শিক্ষার্থীদের প্রশ্নাবলি উপস্থাপকের স্ক্রিনে রিয়েল-টাইমে প্রদর্শিত হবে।";
    } else if (type === "true_false") {
      defaultQuestionText = `নিচের বক্তব্যটি বিবেচনা করুন: এটি সত্য নাকি মিথ্যা?`;
      defaultOptions = ["সত্য (True)", "মিথ্যা (False)"];
      defaultCorrectAnswer = true;
    } else if (type === "matching") {
      defaultQuestionText = `বাম পাশের সাথে ডান পাশের সঠিক তথ্য বা উপাদানের মিলকরণ করো`;
      defaultPairs = [
        { left: "বাম আইটেম ১", right: "ডান তথ্য ১" },
        { left: "বাম আইটেম ২", right: "ডান তথ্য ২" },
        { left: "বাম আইটেম ৩", right: "ডান তথ্য ৩" },
      ];
    } else if (type === "fill_blank") {
      defaultQuestionText = `শূন্যস্থানে সঠিক শব্দ বসাও: গুরুত্বপূর্ণ সূত্রানুসারে V = ___।`;
      defaultAcceptedAnswers = ["IR", "I*R"];
    } else if (type === "ordering") {
      defaultQuestionText = `সঠিক কাজের পর্যায়ক্রম সাজাও`;
      defaultItems = ["ধাপ ১: প্রস্তুতি গ্রহণ", "ধাপ ২: সংযোগ স্থাপন", "ধাপ ৩: পরীক্ষণ সম্পন্ন"];
    } else if (type === "short_answer") {
      defaultQuestionText = `সংক্ষিপ্ত প্রশ্নের উত্তর দিন:`;
      defaultExpectedAnswerKeyword = "সঠিক উত্তর";
    } else if (type === "mcq_multiple") {
      defaultQuestionText = `নিচের কোনটি/কোনগুলো সঠিক? একাধিক নির্বাচন করুন।`;
    } else if (type === "welcome_intro") {
      defaultQuestionText = `আজকের বাংলা ১ম পত্র লাইভ কুইজে সবাইকে স্বাগতম!`;
      defaultOptions = [
        "আজকের বিশেষ লাইভ ক্লাসরুম কুইজ ও প্রেজেন্টেশনে সবাইকে স্বাগতম! সবাই মোবাইল দিয়ে পিন কোড ইনপুট করে যুক্ত হও।"
      ];
      defaultExpectedAnswerKeyword = "মাহমুদুল হাসান • জুনিয়র ইনস্ট্রাক্টর, বাংলা";
      internalExplanation = "৯ম শ্রেণি (ভোক) • বাংলা ১ম পত্র";
    } else if (type === "rules_guidelines") {
      defaultQuestionText = `কুইজের সাধারণ নিয়মাবলী ও আচরণবিধি`;
      defaultOptions = [
        "প্রতিটি প্রশ্নের জন্য সময় ৩০ সেকেন্ড বরাদ্দ থাকবে",
        "যত দ্রুত সঠিক উত্তর দিবে তত বেশি বোনাস পয়েন্ট মিলবে",
        "কোনো নেগেটিভ মার্কিং নেই",
        "অন্যের সাহায্য ছাড়া নিজে একা উত্তর প্রদান করো"
      ];
      internalExplanation = "নিয়মগুলো মনোযোগ দিয়ে পড়ে কুইজে অংশ নাও।";
    } else if (type === "feedback_pulse") {
      defaultQuestionText = `গত ক্লাসের পাঠ তোমাদের কেমন লেগেছে? আজকের ক্লাসের প্রস্তুতি কেমন?`;
      defaultOptions = [
        "খুবই ভালো লেগেছে 😍",
        "মোটামুটি বুঝেছি 👍",
        "কিছুটা কঠিন ছিল 🤔",
        "আবার আলোচনা প্রয়োজন 💡"
      ];
      internalExplanation = "তোমাদের লাইভ মতামত প্রজেক্টরে প্রদর্শিত হবে।";
    } else if (type === "leaderboard_break") {
      defaultQuestionText = `🏆 অন্তর্বর্তীকালীন লিডারবোর্ড বিরতি (Leaderboard Break)`;
      defaultOptions = ["শীর্ষ ৫ জন শিক্ষার্থী", "রিয়েল-টাইম স্কোর ও স্ট্রিক"];
      defaultExpectedAnswerKeyword = "top5";
      internalExplanation = "এখন পর্যন্ত শীর্ষ পয়েন্টধারী শিক্ষার্থীদের তালিকা দেখুন।";
    }

    const newQ: MentimeterQuestionItem = {
      id: newId,
      type,
      questionText: defaultQuestionText,
      options: defaultOptions,
      correctIndex: defaultCorrectIndex,
      correctIndices: type === "mcq_multiple" ? [0, 1] : undefined,
      correctAnswer: defaultCorrectAnswer,
      pairs: defaultPairs,
      acceptedAnswers: defaultAcceptedAnswers,
      items: defaultItems,
      expectedAnswerKeyword: defaultExpectedAnswerKeyword,
      explanation: internalExplanation || "",
      marks: isSlide ? 0 : defaultMarks,
      timeLimit: isSlide ? 0 : defaultTime,
      isQuizPart: !isSlide,
      slideCategory: isSlide ? "slide" : "quiz",
      difficulty: "Medium",
      isAiGenerated: false,
    };

    if (isSlide || activeCanvasTab === "presentation") {
      setPresentationSlides((prev) => [...prev, newQ]);
      setActiveCanvasTab("presentation");
    } else {
      setQuestions((prev) => [...prev, newQ]);
    }
    
    setActiveQuestionId(newId);
    setShowAddMenu(false);

    const typeLabel = QUESTION_TYPES_REGISTRY.find((t) => t.id === type)?.label || type;
    const targetCollection = isSlide || activeCanvasTab === "presentation" ? "প্রেজেন্টেশন স্লাইড" : "কুইজ ক্যানভাস";
    
    setChatMessages((prev) => [
      ...prev,
      {
        id: `manual-msg-${Date.now()}`,
        sender: "system",
        text: `${targetCollection}-এ একটি নতুন [${typeLabel}] যোগ করা হয়েছে।`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    ]);

    setTimeout(() => {
      canvasEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Auto-Insert Leaderboard Breaks after every N questions
  const handleAutoInsertLeaderboards = (interval: number) => {
    setLeaderboardInterval(interval);
    const nonLeaderboards = questions.filter(q => q.type !== "leaderboard_break");
    const newQuestions: MentimeterQuestionItem[] = [];
    let gradedCount = 0;

    nonLeaderboards.forEach((q) => {
      newQuestions.push(q);
      if (!["welcome_intro", "rules_guidelines", "feedback_pulse", "leaderboard_break"].includes(q.type)) {
        gradedCount++;
        if (gradedCount % interval === 0) {
          newQuestions.push({
            id: `lb-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: "leaderboard_break",
            questionText: `🏆 অন্তর্বর্তীকালীন লিডারবোর্ড বিরতি (প্রশ্ন #${gradedCount} এর পর)`,
            options: ["শীর্ষ ৫ জন শিক্ষার্থী", "রিয়েল-টাইম স্কোর ও স্ট্রিক"],
            correctIndex: 0,
            expectedAnswerKeyword: "top5",
            explanation: `প্রশ্ন ১ থেকে ${gradedCount} পর্যন্ত শীর্ষ স্কোরারদের স্কোরবোর্ড।`,
            marks: 0,
            timeLimit: 15,
            difficulty: "Medium",
            isAiGenerated: false
          });
        }
      }
    });

    setQuestions(newQuestions);
    setFeedback({
      message: `🎉 প্রতি ${interval}টি প্রশ্নের পর সফলভাবে লিডারবোর্ড স্লাইড যোগ করা হয়েছে!`,
      type: "success"
    });
    setShowLeaderboardTool(false);
  };

  // Remove all leaderboard breaks
  const handleRemoveAllLeaderboardBreaks = () => {
    setQuestions(prev => prev.filter(q => q.type !== "leaderboard_break"));
    setFeedback({
      message: "ক্যানভাস থেকে সকল লিডারবোর্ড স্লাইড মুছে ফেলা হয়েছে।",
      type: "success"
    });
    setShowLeaderboardTool(false);
  };

  const handleSwitchQuestionType = (questionId: string, newType: MentimeterQuestionType) => {
    const setter = getActiveSetter();
    setter((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const updated: MentimeterQuestionItem = { ...q, type: newType };
        if (newType === "true_false") {
          if (typeof updated.correctAnswer !== "boolean") updated.correctAnswer = true;
          updated.options = ["সত্য (True)", "মিথ্যা (False)"];
        } else if (newType === "matching") {
          if (!updated.pairs || updated.pairs.length === 0) {
            updated.pairs = [
              { left: q.options?.[0] || "বাম আইটেম ১", right: "ডান তথ্য ১" },
              { left: q.options?.[1] || "বাম আইটেম ২", right: "ডান তথ্য ২" },
              { left: q.options?.[2] || "বাম আইটেম ৩", right: "ডান তথ্য ৩" },
            ];
          }
        } else if (newType === "fill_blank") {
          if (!updated.acceptedAnswers || updated.acceptedAnswers.length === 0) {
            updated.acceptedAnswers = [q.options?.[q.correctIndex || 0] || "সঠিক উত্তর"];
          }
          if (!updated.questionText.includes("___")) {
            updated.questionText += " ___";
          }
        } else if (newType === "ordering") {
          if (!updated.items || updated.items.length === 0) {
            updated.items = q.options && q.options.length >= 2 ? [...q.options] : ["ধাপ ১", "ধাপ ২", "ধাপ ৩"];
          }
        } else if (newType === "short_answer") {
          if (!updated.expectedAnswerKeyword) {
            updated.expectedAnswerKeyword = q.options?.[q.correctIndex || 0] || "সঠিক উত্তর";
          }
        } else if (newType === "mcq_single" || newType === "mcq_multiple") {
          if (!updated.options || updated.options.length < 2) {
            updated.options = ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"];
          }
          if (newType === "mcq_multiple" && !updated.correctIndices) {
            updated.correctIndices = [updated.correctIndex || 0];
          }
        } else if (newType === "word_cloud") {
          updated.marks = 0;
          updated.timeLimit = 0;
          updated.options = ["উদ্ভাবন", "প্রযুক্তি", "ভবিষ্যৎ", "দক্ষতা", "পরিশ্রম"];
          if (!updated.explanation) updated.explanation = "শিক্ষার্থীদের দেওয়া শব্দ দিয়ে লাইভ ওয়ার্ড ক্লাউড তৈরি হবে।";
        } else if (newType === "open_ended") {
          updated.marks = 0;
          updated.timeLimit = 0;
          updated.options = [];
          if (!updated.explanation) updated.explanation = "শিক্ষার্থীরা মুক্তভাবে তাদের মতামত ও প্রতিক্রিয়া পাঠাবে।";
        } else if (newType === "scales_rating") {
          updated.marks = 0;
          updated.timeLimit = 0;
          updated.options = ["১ - দুর্বল", "২ - মোটামুটি", "৩ - সন্তোষজনক", "৪ - ভালো", "৫ - চমৎকার"];
          if (!updated.explanation) updated.explanation = "১ থেকে ৫ তারকা রেটিং বা আত্মবিশ্বাসের স্কেল।";
        } else if (newType === "qa_slide") {
          updated.marks = 0;
          updated.timeLimit = 0;
          updated.options = [];
          if (!updated.explanation) updated.explanation = "উপস্থাপকের কাছে শিক্ষার্থীদের উন্মুক্ত প্রশ্নোত্তর।";
        } else if (newType === "welcome_intro") {
          updated.marks = 0;
          updated.timeLimit = 0;
          if (!updated.expectedAnswerKeyword) updated.expectedAnswerKeyword = "মাহমুদুল হাসান • শিক্ষক, বাংলা";
          if (!updated.explanation) updated.explanation = "৯ম শ্রেণি • বাংলা ১ম পত্র";
          if (!updated.options || updated.options.length === 0) {
            updated.options = ["আজকের লাইভ কুইজে সবাইকে স্বাগতম! সবাই পিন কোড দিয়ে যুক্ত হও।"];
          }
        } else if (newType === "rules_guidelines") {
          updated.marks = 0;
          updated.timeLimit = 0;
          if (!updated.options || updated.options.length < 2) {
            updated.options = [
              "প্রতিটি প্রশ্নে ৩০ সেকেন্ড সময় বরাদ্দ",
              "দ্রুত সঠিক উত্তর দিলে বোনাস পয়েন্ট",
              "কোনো নেগেটিভ মার্কিং নেই",
              "সততার সাথে একা উত্তর দিন"
            ];
          }
        } else if (newType === "feedback_pulse") {
          updated.marks = 0;
          updated.timeLimit = 0;
          if (!updated.options || updated.options.length < 2) {
            updated.options = ["খুবই ভালো লেগেছে 😍", "মোটামুটি বুঝেছি 👍", "কিছুটা কঠিন ছিল 🤔", "আবার আলোচনা দরকার 💡"];
          }
        } else if (newType === "leaderboard_break") {
          updated.marks = 0;
          updated.timeLimit = 0;
          if (!updated.expectedAnswerKeyword) updated.expectedAnswerKeyword = "top5";
          updated.options = ["শীর্ষ ৫ জন শিক্ষার্থী", "রিয়েল-টাইম স্কোর ও স্ট্রিক"];
        }
        updated.isQuizPart = isQuizPart(newType);
        updated.slideCategory = isSlideType(newType) ? "slide" : "quiz";
        return updated;
      })
    );
  };

  const handleAddPair = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const pairs = [...(q.pairs || [])];
        if (pairs.length < 6) {
          pairs.push({ left: `বাম আইটেম ${pairs.length + 1}`, right: `ডান তথ্য ${pairs.length + 1}` });
        }
        return { ...q, pairs };
      })
    );
  };

  const handleUpdatePair = (qId: string, pairIndex: number, side: "left" | "right", value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const pairs = [...(q.pairs || [])];
        if (pairs[pairIndex]) {
          pairs[pairIndex] = { ...pairs[pairIndex], [side]: value };
        }
        return { ...q, pairs };
      })
    );
  };

  const handleDeletePair = (qId: string, pairIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if ((q.pairs || []).length <= 2) return q;
        const pairs = (q.pairs || []).filter((_, idx) => idx !== pairIndex);
        return { ...q, pairs };
      })
    );
  };

  const handleAddAcceptedAnswer = (qId: string, answer: string) => {
    if (!answer.trim()) return;
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const cur = q.acceptedAnswers || [];
        if (!cur.includes(answer.trim())) {
          return { ...q, acceptedAnswers: [...cur, answer.trim()] };
        }
        return q;
      })
    );
  };

  const handleDeleteAcceptedAnswer = (qId: string, ansIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const cur = (q.acceptedAnswers || []).filter((_, idx) => idx !== ansIndex);
        return { ...q, acceptedAnswers: cur };
      })
    );
  };

  const handleAddOrderItem = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const items = [...(q.items || [])];
        if (items.length < 6) {
          items.push(`নতুন পর্যায় ${items.length + 1}`);
        }
        return { ...q, items };
      })
    );
  };

  const handleUpdateOrderItem = (qId: string, itemIdx: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const items = [...(q.items || [])];
        items[itemIdx] = val;
        return { ...q, items };
      })
    );
  };

  const handleDeleteOrderItem = (qId: string, itemIdx: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if ((q.items || []).length <= 2) return q;
        const items = (q.items || []).filter((_, idx) => idx !== itemIdx);
        return { ...q, items };
      })
    );
  };

  const handleToggleMultiCorrect = (qId: string, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const cur = q.correctIndices || [q.correctIndex || 0];
        const next = cur.includes(optIndex) ? cur.filter((i) => i !== optIndex) : [...cur, optIndex];
        return { ...q, correctIndices: next.length > 0 ? next : [optIndex] };
      })
    );
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm("আপনি কি এটি মুছে ফেলতে চান?")) {
      const setter = getActiveSetter();
      setter((prev) => prev.filter((q) => q.id !== id));
      if (activeQuestionId === id) {
        setActiveQuestionId(null);
      }
    }
  };

  const handleDuplicateQuestion = (id: string) => {
    const collection = activeCanvasTab === "questions" ? questions : presentationSlides;
    const target = collection.find((q) => q.id === id);
    if (!target) return;
    const duplicated: MentimeterQuestionItem = {
      ...target,
      id: `${target.type}-copy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      questionText: `${target.questionText} (কপি)`,
      options: [...target.options],
    };
    const setter = getActiveSetter();
    setter((prev) => [...prev, duplicated]);
    setActiveQuestionId(duplicated.id);
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    const collection = activeCanvasTab === "questions" ? questions : presentationSlides;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === collection.length - 1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...collection];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    
    const setter = getActiveSetter();
    setter(updated);
  };

  // ==========================================================
  // SINGLE-CLICK ATOMIC SAVE & PUBLISH HANDLER
  // ==========================================================
  const handleSaveAndPublish = async (publishNow: boolean) => {
    if (!quizTitle.trim()) {
      setFeedback({ message: "অনুগ্রহ করে কুইজের একটি শিরোনাম (Title) লিখুন।", type: "error" });
      return;
    }

    if (questions.length === 0) {
      setFeedback({
        message: "কুইজে কমপক্ষে একটি প্রশ্ন থাকা আবশ্যক। বামদিকের অ্যাসিস্ট্যান্টকে প্রশ্ন তৈরি করতে বলুন অথবা '+ ম্যানুয়ালি প্রশ্ন যোগ করুন' চাপুন।",
        type: "error",
      });
      return;
    }

    const emptyQ = questions.find((q) => !q.questionText.trim());
    if (emptyQ) {
      setFeedback({ message: "সকল প্রশ্নের বিবরণ পূরণ করা আবশ্যক।", type: "error" });
      setActiveQuestionId(emptyQ.id);
      return;
    }

    if (publishNow) {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
    }
    setFeedback(null);

    try {
      const payload = {
        title: quizTitle.trim(),
        description: quizDescription.trim(),
        mode: "academic",
        category,
        classId: selectedClassId,
        subjectId: initialQuiz?.subjectId || 1,
        tradeId: isClassTradeEligible(selectedClassId)
          ? Math.max(1, TRADE_LIST.findIndex((t) => t.id === selectedTrade) + 1)
          : null,
        academicYearId: 2026,
        defaultMarks,
        defaultQuestionTime: defaultTime,
        randomizeQuestions: true,
        randomizeOptions: true,
        publish: publishNow,
        creatorId: 1,
        presentationSlides: presentationSlides.map((s, idx) => ({
          id: s.id,
          type: s.type,
          questionText: s.questionText.trim(),
          options: s.options ? s.options.map((opt) => opt.trim()) : [],
          correctAnswer: s.correctAnswer,
          correctIndex: s.correctIndex,
          explanation: s.explanation.trim(),
          marks: 0,
          timeLimit: s.timeLimit || 15,
          orderIndex: idx,
        })),
        questions: questions.map((q, idx) => ({
          id: q.id,
          type: q.type,
          questionText: q.questionText.trim(),
          options: q.options ? q.options.map((opt) => opt.trim()) : [],
          correctAnswer: q.type === "true_false" ? q.correctAnswer : q.correctIndex,
          correctIndex: q.correctIndex,
          correctIndices: q.correctIndices,
          pairs: q.pairs,
          acceptedAnswers: q.acceptedAnswers,
          items: q.items,
          expectedAnswerKeyword: q.expectedAnswerKeyword,
          questionData: {
            type: q.type,
            options: q.options,
            correctIndex: q.correctIndex,
            correctIndices: q.correctIndices,
            correctAnswer: q.correctAnswer,
            pairs: q.pairs,
            acceptedAnswers: q.acceptedAnswers,
            items: q.items,
            expectedAnswerKeyword: q.expectedAnswerKeyword,
          },
          explanation: q.explanation.trim(),
          marks: typeof q.marks === "number" ? q.marks : defaultMarks,
          timeLimit: q.timeLimit || defaultTime,
          orderIndex: idx,
        })),
      };

      let res;
      if (initialQuiz?.id) {
        res = await fetch(`/api/quizzes/${initialQuiz.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        await fetch(`/api/quizzes/${initialQuiz.id}/questions`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: payload.questions }),
        });

        if (publishNow) {
          await fetch(`/api/quizzes/${initialQuiz.id}/publish`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questions: payload.questions }),
          });
        }
      } else {
        res = await fetch("/api/quizzes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (data.success) {
        const savedQuiz = data.quiz || initialQuiz;
        setFeedback({
          message: publishNow
            ? "🎉 কুইজটি সফলভাবে সংরক্ষিত ও প্রকাশিত হয়েছে!"
            : "💾 কুইজটি সফলভাবে ড্রাফট হিসেবে সংরক্ষিত হয়েছে।",
          type: "success",
        });

        onSaveSuccess?.(savedQuiz, publishNow);

        if (publishNow && onLaunchLiveArena && savedQuiz?.id) {
          onLaunchLiveArena(savedQuiz.id);
        }
      } else {
        setFeedback({
          message: data.message || "সংরক্ষণ করতে ব্যর্থ হয়েছে।",
          type: "error",
        });
      }
    } catch (err) {
      setFeedback({ message: "নেটওয়ার্ক সমস্যার কারণে সংরক্ষণ সম্পন্ন হয়নি।", type: "error" });
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  // Canvas Calculations
  const totalPoints = questions.reduce((sum, q) => sum + (q.marks || defaultMarks), 0);
  const totalMinutes = Math.ceil(
    questions.reduce((sum, q) => sum + (q.timeLimit || defaultTime), 0) / 60
  );

  return (
    <div className="w-full flex flex-col min-h-[calc(100vh-80px)] text-slate-100 font-sans space-y-4">
      {/* Top Workspace Header Bar */}
      <div className="p-4 sm:p-5 bg-slate-900/90 rounded-3xl border border-indigo-500/20 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-indigo-500/30">
                Mentimeter-Style Studio
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                লাইভ ইন্টারঅ্যাক্টিভ বিল্ডার
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {quizTitle || "এআই কুইজ ও ডকুমেন্ট স্টুডিও"}
            </h1>
          </div>
        </div>

        {/* Header Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              বাতিল
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`px-4 py-2 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isLiveActive
                ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-md shadow-rose-500/20"
                : "bg-slate-800/80 border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-white"
            }`}
            title="লাইভ সেশন মোড টগল করুন"
          >
            {isLiveActive ? (
              <>
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>লাইভ লক মোড (চালু)</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-slate-400" />
                <span>লাইভ মোড লক</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowSimulator(true)}
            disabled={questions.length === 0}
            className="px-4 py-2 rounded-2xl bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-purple-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Eye className="w-4 h-4" />
            <span>সিমুলেটর ({questions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAndPublish(false)}
            disabled={isSaving || isPublishing || questions.length === 0}
            className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-cyan-400" />}
            <span>কুইজ সংরক্ষণ করুন</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAndPublish(true)}
            disabled={isSaving || isPublishing || questions.length === 0}
            className="px-5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-40"
          >
            {isPublishing ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Play className="w-4 h-4 fill-current text-slate-950" />
            )}
            <span>সংরক্ষণ ও প্রকাশ করুন</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/60 border border-rose-500/40 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* =======================================================
          MAIN DUAL-PANEL WORKSPACE
          Left Panel: AI & Document Assistant (Chat & Upload Dock)
          Right Panel: Live Interactive Question Canvas
          ======================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        
        {/* ===================================================
            LEFT PANEL: AI & DOCUMENT ASSISTANT DOCK (5 cols)
            (Hidden during active Live Session to prevent distracting question generation)
            =================================================== */}
        {!isLiveActive && (
          <div className="lg:col-span-5 bg-slate-900/90 rounded-3xl border border-indigo-500/25 shadow-xl flex flex-col min-h-[500px] lg:h-[760px] overflow-hidden">
            {/* Assistant Header & Context Bar */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>এআই ও ডকুমেন্ট অ্যাসিস্ট্যান্ট</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">Continuous Conversational Pipeline</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDocContextOpen(!isDocContextOpen)}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <Sliders className="w-3 h-3 text-cyan-400" />
                <span>প্যারামিটার</span>
                {isDocContextOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Collapsible Document & Parameter Dock */}
            <AnimatePresence>
              {isDocContextOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 pt-2 border-t border-slate-800/80 overflow-hidden text-xs font-bold"
                >
                  {/* Quiz Metadata Quick Inputs - Class First & Conditional Trade (9-12 only) */}
                  <div className={`grid gap-2 ${isClassTradeEligible(selectedClassId) ? "grid-cols-2" : "grid-cols-1"}`}>
                    {/* 1. শ্রেণি (Grade) - Always First */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-slate-400">শ্রেণি (Grade)</label>
                        {!isClassTradeEligible(selectedClassId) && (
                          <span className="text-[9px] text-amber-400 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-500/30">
                            ট্রেড প্রযোজ্য নয় (Pre-Voc)
                          </span>
                        )}
                      </div>
                      <select
                        value={selectedClassId}
                        onChange={(e) => {
                          const newClassId = Number(e.target.value);
                          setSelectedClassId(newClassId);
                          if (!isClassTradeEligible(newClassId)) {
                            setSelectedTrade("");
                          } else if (!selectedTrade || selectedTrade === "") {
                            setSelectedTrade(TRADE_LIST[0].id);
                          }
                        }}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-[11px] outline-none"
                      >
                        {CLASS_OPTIONS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. ট্রেড / কারিকুলাম - Conditionally rendered only if Class is 9-12 */}
                    {isClassTradeEligible(selectedClassId) && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400">ট্রেড / কারিকুলাম (৯ম-১২শ)</label>
                        <select
                          value={selectedTrade || TRADE_LIST[0].id}
                          onChange={(e) => setSelectedTrade(e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-[11px] outline-none"
                        >
                          {TRADE_LIST.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.icon} {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* PDF Document Picker */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>রেফারেন্স সিলেবাস / পিডিএফ ড্রপডাউন</span>
                      {selectedPdfDoc && (
                        <span className="text-[9px] text-emerald-400 font-mono">সংযুক্ত আছে ✓</span>
                      )}
                    </label>
                    <SmartPdfPickerDropdown
                      classId={String(selectedClassId)}
                      tradeCode={isClassTradeEligible(selectedClassId) ? selectedTrade : ""}
                      activeDocumentId={selectedPdfDoc?.id}
                      onSelectDocument={(doc) => setSelectedPdfDoc(doc)}
                      onClearDocument={() => setSelectedPdfDoc(null)}
                    />
                  </div>

                  {/* Reference Text Paste Box */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">কাস্টম পাঠ্য বা নোট পেস্ট করুন (ঐচ্ছিক)</label>
                    <textarea
                      rows={2}
                      value={referenceText}
                      onChange={(e) => setReferenceText(e.target.value)}
                      placeholder="এখানে টেক্সটবুকের প্যারাগ্রাফ বা ল্যাব ম্যানুয়াল নোট পেস্ট করতে পারেন..."
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-[11px] outline-none"
                    />
                  </div>

                  {/* Generation Filters: Count, Type & Difficulty */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">প্রশ্নের ধরন (Question Format)</label>
                      <select
                        value={aiQuestionType}
                        onChange={(e) => setAiQuestionType(e.target.value)}
                        className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-[11px] font-bold outline-none"
                      >
                        <option value="mixed">✨ মিশ্র সব ধরনের প্রশ্ন (Mixed)</option>
                        <option value="mcq_single">🔘 বহুনির্বাচনী প্রশ্ন (Single MCQ)</option>
                        <option value="true_false">⚖️ সত্য / মিথ্যা (True / False)</option>
                        <option value="matching">🔗 ডান পাশ - বাম পাশ মিলকরণ (Matching)</option>
                        <option value="fill_blank">📝 শূন্যস্থান পূরণ (Fill Blank)</option>
                        <option value="ordering">🔢 ধারাবাহিক ক্রম সাজানো (Ordering)</option>
                        <option value="mcq_multiple">☑️ বহুপদী সমাপ্তিসূচক (Multi-Select)</option>
                        <option value="short_answer">✍️ এক কথায় উত্তর (Short Answer)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">কঠিনতা (Difficulty)</label>
                      <select
                        value={difficultyPill}
                        onChange={(e) => setDifficultyPill(e.target.value as any)}
                        className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-[11px] outline-none"
                      >
                        <option value="Mixed">Mixed (মিশ্র)</option>
                        <option value="Easy">Easy (সহজ)</option>
                        <option value="Medium">Medium (মধ্যম)</option>
                        <option value="Hard">Hard (কঠিন)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">প্রশ্নের সংখ্যা</label>
                      <div className="grid grid-cols-4 gap-1">
                        {[3, 5, 10, 15].map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => setQuestionCountPill(cnt)}
                            className={`py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                              questionCountPill === cnt
                                ? "bg-indigo-600 text-white font-black"
                                : "bg-slate-950 text-slate-400 hover:bg-slate-800"
                            }`}
                          >
                            {cnt}টি
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">ভাষা (Language)</label>
                      <select
                        value={languagePill}
                        onChange={(e) => setLanguagePill(e.target.value as any)}
                        className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-[11px] outline-none"
                      >
                        <option value="Bangla">বাংলা (BTEB কারিগরি)</option>
                        <option value="Bilingual">দ্বিভাষিক (Bilingual)</option>
                        <option value="English">English</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Assistant Chat Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800 text-xs">
            {chatMessages.map((msg) => {
              const isUser = msg.sender === "user";
              const isSystem = msg.sender === "system";

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center my-2">
                    <span className="px-3 py-1 rounded-full bg-slate-950 text-[10px] text-slate-400 border border-slate-800 font-mono inline-block">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 items-start ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                      isUser
                        ? "bg-emerald-600 text-white"
                        : "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[82%] p-3.5 rounded-2xl space-y-1.5 leading-relaxed ${
                      isUser
                        ? "bg-emerald-950/60 border border-emerald-500/30 text-emerald-100 rounded-tr-none"
                        : "bg-slate-950 border border-indigo-500/20 text-slate-200 rounded-tl-none shadow-md"
                    }`}
                  >
                    <p className="text-xs font-semibold">{msg.text}</p>

                    {msg.actionSummary && (
                      <div className="pt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-bold font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{msg.actionSummary}</span>
                      </div>
                    )}

                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block text-right font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Live Generation Indicator in Chat */}
            {isGenerating && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Wand2 className="w-3.5 h-3.5" />
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 text-indigo-200 rounded-tl-none space-y-1">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span className="text-xs font-bold">{generationStep || "প্রশ্ন তৈরি হচ্ছে..."}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">ডানপাশের ক্যানভাসে সরাসরি প্রশ্নসমূহ লোড হচ্ছে...</p>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="p-2.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold shrink-0">সাজেশন:</span>
            {FAST_SUGGESTION_PROMPTS.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isGenerating}
                onClick={() => handleSendChatMessage(sug)}
                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-indigo-950/60 hover:border-indigo-500/40 border border-slate-800 text-slate-300 hover:text-indigo-200 text-[10px] font-semibold whitespace-nowrap transition cursor-pointer disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Chat Input Dock */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                disabled={isGenerating}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="প্রম্পট লিখুন (যেমন: এই টপিক থেকে আরও ৫টি প্রশ্ন যোগ করো)..."
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl text-xs font-medium text-white outline-none transition placeholder:text-slate-500 dark:text-slate-400"
              />

              <button
                type="submit"
                disabled={isGenerating || !chatInput.trim()}
                className="p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition transform active:scale-95 disabled:opacity-40 cursor-pointer"
                title="প্রম্পট পাঠান"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
        )}

        {/* ===================================================
            RIGHT PANEL: LIVE INTERACTIVE QUESTION CANVAS (7 or 12 cols)
            =================================================== */}
        <div className={`${isLiveActive ? "col-span-12" : "lg:col-span-7"} bg-slate-900/90 rounded-3xl border border-indigo-500/20 shadow-xl flex flex-col min-h-[550px] lg:h-[760px] overflow-hidden`}>
          {/* Live Mode Active Presenter Banner */}
          {isLiveActive && (
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/80 border-b border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
                <div>
                  <h4 className="font-black text-rose-300 text-xs sm:text-sm flex items-center gap-2">
                    <span>🔴 কুইজ বর্তমানে লাইভ সক্রিয় (Live Presenter Arena Active)</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/40 font-mono">
                      MENTIMETER PRESENTATION
                    </span>
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-300">
                    লাইভ চলার সময়ে বামপাশের এআই জেনারেটর ও প্রশ্ন সম্পাদনা সাময়িকভাবে বন্ধ রাখা হয়েছে। কুইজ শেষ হলে সম্পাদনা পুনরায় চালু হবে।
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSimulator(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md text-xs active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>লাইভ প্রেজেন্টার চালান</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLiveActive(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700 text-xs"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>লাইভ সমাপ্ত / আনলক</span>
                </button>
              </div>
            </div>
          )}
          {/* Canvas Top Bar */}
          <div className="p-0 bg-slate-950/80 border-b border-slate-800 flex flex-col shrink-0">
            {/* Tab Switcher */}
            <div className="flex border-b border-slate-800/60">
              <button
                type="button"
                onClick={() => setActiveCanvasTab("questions")}
                className={`flex-1 py-3 text-xs font-black transition-all flex items-center justify-center gap-2 border-b-2 ${
                  activeCanvasTab === "questions"
                    ? "text-emerald-400 border-emerald-500 bg-emerald-500/5"
                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>কুইজ ক্যানভাস ({questions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCanvasTab("presentation")}
                className={`flex-1 py-3 text-xs font-black transition-all flex items-center justify-center gap-2 border-b-2 ${
                  activeCanvasTab === "presentation"
                    ? "text-amber-400 border-amber-500 bg-amber-500/5"
                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>প্রেজেন্টেশন স্লাইড ({presentationSlides.length})</span>
              </button>
            </div>

            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                  activeCanvasTab === "questions" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                }`}>
                  {activeCanvasTab === "questions" ? <CheckSquare className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-xs font-black text-white flex items-center gap-2">
                    <span>{activeCanvasTab === "questions" ? "লাইভ কোয়েশ্চেন ক্যানভাস" : "প্রি-কুইজ স্লাইডসমূহ"}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {activeCanvasTab === "questions" 
                      ? `${totalPoints} মার্কস • আনুমানিক ${totalMinutes} মিনিট`
                      : "এই স্লাইডগুলো কুইজ শুরুর আগে প্রদর্শিত হবে"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 relative">
                {/* Leaderboard Auto-Insert Tool Button (Only for Questions) */}
                {!isLiveActive && activeCanvasTab === "questions" && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLeaderboardTool(!showLeaderboardTool)}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                    title="অটো লিডারবোর্ড বিরতি নির্ধারণ করুন"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">অটো লিডারবোর্ড</span>
                    <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
                  </button>

                  {showLeaderboardTool && (
                    <>
                      {/* Mobile Backdrop */}
                      <div
                        className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs sm:hidden"
                        onClick={() => setShowLeaderboardTool(false)}
                      />
                      {/* Responsive Dialog: Bottom modal on mobile, popover on desktop */}
                      <div className="fixed inset-x-3 bottom-4 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl p-3.5 z-50 space-y-3 text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="font-bold text-amber-300 flex items-center gap-1.5">
                            <Trophy className="w-4 h-4 text-amber-400" />
                            লিডারবোর্ড ফ্রিকোয়েন্সি সেটিংস
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowLeaderboardTool(false)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-900 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-tight">
                          আপনি কতটি প্রশ্নের পর পর লিডারবোর্ড স্লাইড রাখতে চান?
                        </p>

                        {/* Quick Presets */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {[3, 5, 7, 10].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                setLeaderboardInterval(num);
                                handleAutoInsertLeaderboards(num);
                              }}
                              className={`py-1.5 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                                leaderboardInterval === num
                                  ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                              }`}
                            >
                              {num}টি পর
                            </button>
                          ))}
                        </div>

                        {/* Custom Interval Input */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                          <span className="text-slate-300 font-bold">কাস্টম সংখ্যা:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">প্রতি</span>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={leaderboardInterval}
                              onChange={(e) => setLeaderboardInterval(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-14 p-1 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-black text-center text-xs outline-none"
                            />
                            <span className="text-[10px] text-slate-400">টি পর</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAutoInsertLeaderboards(leaderboardInterval)}
                          className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
                        >
                          প্রতি {leaderboardInterval}টি পর পর ইনসার্ট করুন
                        </button>

                        {questions.some((q) => q.type === "leaderboard_break") && (
                          <button
                            type="button"
                            onClick={handleRemoveAllLeaderboardBreaks}
                            className="w-full py-1 text-rose-400 hover:text-rose-300 text-[10px] font-bold text-center cursor-pointer border-t border-slate-800/80 pt-1.5"
                          >
                            সকল লিডারবোর্ড স্লাইড রিমুভ করুন
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* + নতুন প্রশ্ন / স্লাইড যোগ করুন Button */}
              {!isLiveActive ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95"
                    title="নতুন স্লাইড বা প্রশ্ন যোগ করুন"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>নতুন প্রশ্ন / স্লাইড</span>
                    <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
                  </button>

                  {showAddMenu && (
                    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:block sm:relative sm:inset-auto sm:z-50">
                      {/* Mobile Backdrop Overlay */}
                      <div
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm sm:hidden z-[100]"
                        onClick={() => setShowAddMenu(false)}
                      />

                      {/* Responsive Sheet/Popover */}
                      <div className="relative z-[101] w-full max-h-[85vh] bg-slate-950 border-t border-slate-800 rounded-t-3xl p-4 overflow-y-auto sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:border sm:rounded-2xl sm:shadow-2xl sm:p-3 sm:max-h-[500px]">
                        {/* Mobile Header with Drag Handle & Close Button */}
                        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />
                        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                          <span className="text-xs font-black text-white flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-emerald-400" /> নতুন স্লাইড বা প্রশ্নের ধরন নির্বাচন
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowAddMenu(false)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-900 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Group 1: Presentation & Mentimeter Engagement Slides */}
                        <div className="mb-3 space-y-1.5">
                          <p className="px-1 text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <span>✨ প্রেজেন্টেশন ও এনগেজমেন্ট স্লাইড (Mentimeter Slides)</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {QUESTION_TYPES_REGISTRY.filter((qt) => qt.category === "slide").map((qt) => (
                              <button
                                key={qt.id}
                                type="button"
                                onClick={() => {
                                  handleAddNewManualQuestion(qt.id as MentimeterQuestionType);
                                  setShowAddMenu(false);
                                }}
                                className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-amber-500/25 hover:border-amber-500/60 flex items-start gap-2.5 transition cursor-pointer active:scale-[0.98]"
                              >
                                <span className="text-lg shrink-0 mt-0.5">{qt.icon}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-amber-300 leading-tight">{qt.label.split(" (")[0]}</p>
                                  <p className="text-[10px] text-slate-400 leading-snug line-clamp-2 mt-0.5">{qt.desc}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Group 2: Interactive Quiz Questions */}
                        <div className="space-y-1.5">
                          <p className="px-1 text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <span>🔘 কুইজ প্রশ্নাবলি (Interactive Questions)</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {QUESTION_TYPES_REGISTRY.filter((qt) => qt.category === "question").map((qt) => (
                              <button
                                key={qt.id}
                                type="button"
                                onClick={() => {
                                  handleAddNewManualQuestion(qt.id as MentimeterQuestionType);
                                  setShowAddMenu(false);
                                }}
                                className="w-full text-left p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 flex items-start gap-2.5 transition cursor-pointer active:scale-[0.98]"
                              >
                                <span className="text-base shrink-0 mt-0.5">{qt.icon}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-200 hover:text-white leading-tight">{qt.label.split(" (")[0]}</p>
                                  <p className="text-[10px] text-slate-400 leading-snug line-clamp-2 mt-0.5">{qt.desc}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 select-none">
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>লাইভ লকড (View-Only)</span>
                </div>
              )}

              {questions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("আপনি কি ক্যানভাস থেকে সব প্রশ্ন মুছে ফেলতে চান?")) {
                      setQuestions([]);
                    }
                  }}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  title="ক্যানভাস ক্লিয়ার করুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

          {/* Canvas Scrollable Question Cards Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {(activeCanvasTab === "questions" ? questions : presentationSlides).length === 0 ? (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center p-8 space-y-4 border border-dashed border-slate-800 rounded-3xl">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${activeCanvasTab === "questions" ? "bg-indigo-500/10 text-indigo-400" : "bg-amber-500/10 text-amber-400"}`}>
                  <Sparkles className="w-7 h-7 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">
                    {activeCanvasTab === "questions" ? "ক্যানভাসে এখনো কোনো প্রশ্ন যুক্ত হয়নি" : "কোনো প্রেজেন্টেশন স্লাইড নেই"}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    {activeCanvasTab === "questions" 
                      ? "বামদিকের অ্যাসিস্ট্যান্টকে প্রশ্ন তৈরি করতে বলুন অথবা নিচের যেকোনো ধরনের প্রশ্ন সিলেক্ট করে যোগ করুন।"
                      : "নিচের '+ নতুন প্রশ্ন / স্লাইড' বাটন থেকে স্লাইড যোগ করুন। এই স্লাইডগুলো কুইজ শুরুর আগে শিক্ষার্থীকে দেখানো হবে।"}
                  </p>
                </div>
                {activeCanvasTab === "questions" && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-lg">
                    <button
                      type="button"
                      onClick={() => handleSendChatMessage("এই টপিকের উপর ৫টি বোর্ড স্ট্যান্ডার্ড প্রশ্ন তৈরি করো")}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/25"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>AI দিয়ে প্রশ্ন তৈরি</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddNewManualQuestion("mcq_single")}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      🔘 একক MCQ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddNewManualQuestion("mcq_multiple")}
                      className="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      ☑️ বহু MCQ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {(activeCanvasTab === "questions" ? questions : presentationSlides).map((q, qIndex) => (
                  <div
                    key={q.id}
                    className={`p-4 sm:p-5 rounded-3xl bg-slate-950 border transition-all space-y-4 ${
                      activeQuestionId === q.id
                        ? "border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Card Header & Controls */}
                    <div className="flex items-center justify-between gap-2 sm:gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-mono font-black text-xs flex items-center justify-center shrink-0">
                          {qIndex + 1}
                        </span>

                        {/* Question/Slide Type Switcher Dropdown (Mobile Responsive) */}
                        <select
                          value={q.type}
                          disabled={isLiveActive}
                          onChange={(e) => handleSwitchQuestionType(q.id, e.target.value as MentimeterQuestionType)}
                          className="max-w-[135px] sm:max-w-[220px] truncate px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500 text-indigo-300 hover:text-white text-[11px] font-black outline-none cursor-pointer transition disabled:opacity-40"
                        >
                          {QUESTION_TYPES_REGISTRY.map((t) => (
                            <option key={t.id} value={t.id} className="bg-slate-950 text-white">
                              {t.icon} {t.label}
                            </option>
                          ))}
                        </select>

                        {q.isAiGenerated && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono font-bold shrink-0">
                            AI
                          </span>
                        )}
                      </div>

                      {/* Card Actions Toolbar */}
                      {!isLiveActive ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(qIndex, "up")}
                            disabled={qIndex === 0}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="উপরে নিন"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(qIndex, "down")}
                            disabled={qIndex === questions.length - 1}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="নিচে নিন"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateQuestion(q.id)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                            title="কপি করুন"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-400 cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-rose-400" /> ড্রাফট লকড
                        </span>
                      )}
                    </div>

                    {/* Question Statement Input */}
                    <div className="space-y-1 text-xs font-bold">
                      <label className="text-slate-400 flex items-center justify-between">
                        <span>প্রশ্ন বিবরণ (Question Text) *</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Q#{qIndex + 1}</span>
                      </label>
                      <textarea
                        rows={2}
                        value={q.questionText}
                        onChange={(e) => handleUpdateQuestion(q.id, { questionText: e.target.value })}
                        placeholder="প্রশ্নের বিস্তারিত এখানে লিখুন..."
                        className="w-full p-3 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl text-white text-xs outline-none"
                      />
                    </div>

                    {/* Dynamic Question Type Specific Option / Answer Editor */}
                    <div className="space-y-3">
                      {/* 1. MCQ Single / Multiple Choice */}
                      {(q.type === "mcq_single" || q.type === "mcq_multiple") && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-400">
                              {q.type === "mcq_multiple"
                                ? "☑️ অপশনসমূহ ও একাধিক সঠিক উত্তর নির্বাচন করুন:"
                                : "🔘 অপশনসমূহ ও সঠিক উত্তর (সঠিক উত্তরে ক্লিক করুন):"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddOption(q.id)}
                              disabled={(q.options || []).length >= 6}
                              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ অপশন ({(q.options || []).length}/6)</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(q.options || ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"]).map((optText, optIndex) => {
                              const isCorrect =
                                q.type === "mcq_multiple"
                                  ? (q.correctIndices || []).includes(optIndex)
                                  : q.correctIndex === optIndex;
                              const letter = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"][optIndex] || String.fromCharCode(65 + optIndex);

                              return (
                                <div
                                  key={optIndex}
                                  className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2 ${
                                    isCorrect
                                      ? "bg-emerald-950/40 border-emerald-500/60 shadow-md shadow-emerald-500/10"
                                      : "bg-slate-900 border-slate-800 focus-within:border-slate-700"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (q.type === "mcq_multiple") {
                                        handleToggleMultiCorrect(q.id, optIndex);
                                      } else {
                                        handleUpdateQuestion(q.id, { correctIndex: optIndex });
                                      }
                                    }}
                                    className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-mono font-black transition shrink-0 cursor-pointer ${
                                      isCorrect
                                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                                    }`}
                                    title="সঠিক উত্তর হিসেবে চিহ্নিত করুন"
                                  >
                                    {isCorrect ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : letter}
                                  </button>

                                  <input
                                    type="text"
                                    value={optText}
                                    onChange={(e) => handleOptionChange(q.id, optIndex, e.target.value)}
                                    placeholder={`অপশন ${letter}...`}
                                    className={`flex-1 bg-transparent text-xs font-semibold outline-none ${
                                      isCorrect ? "text-emerald-200 font-bold" : "text-slate-200"
                                    }`}
                                  />

                                  {(q.options || []).length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteOption(q.id, optIndex)}
                                      className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                                      title="অপশনটি মুছুন"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 2. True / False Editor */}
                      {q.type === "true_false" && (
                        <div className="space-y-2 p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
                          <label className="text-xs font-bold text-slate-300 block">
                            ⚖️ সঠিক উত্তর চিহ্নিত করুন (True / False):
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuestion(q.id, { correctAnswer: true })}
                              className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                                q.correctAnswer === true
                                  ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30"
                                  : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                              }`}
                            >
                              <span className="text-base">✅</span>
                              <span>সত্য (True)</span>
                              {q.correctAnswer === true && <Check className="w-4 h-4 ml-1" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateQuestion(q.id, { correctAnswer: false })}
                              className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                                q.correctAnswer === false
                                  ? "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30"
                                  : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                              }`}
                            >
                              <span className="text-base">❌</span>
                              <span>মিথ্যা (False)</span>
                              {q.correctAnswer === false && <Check className="w-4 h-4 ml-1" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 3. Matching Pairs Editor (ডান পাশ - বাম পাশ) */}
                      {q.type === "matching" && (
                        <div className="space-y-2.5 p-3.5 bg-slate-900/80 rounded-2xl border border-amber-500/30">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-amber-300 flex items-center gap-1.5">
                              <span>🔗 বাম পাশ ↔ ডান পাশ মিলকরণ জোড়াসমূহ (Matching Pairs):</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddPair(q.id)}
                              disabled={(q.pairs || []).length >= 6}
                              className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ জোড়া যোগ ({(q.pairs || []).length}/6)</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(q.pairs || [
                              { left: "বাম আইটেম ১", right: "ডান তথ্য ১" },
                              { left: "বাম আইটেম ২", right: "ডান তথ্য ২" },
                              { left: "বাম আইটেম ৩", right: "ডান তথ্য ৩" },
                            ]).map((pair, pIdx) => (
                              <div
                                key={pIdx}
                                className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 focus-within:border-amber-500/50"
                              >
                                <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                  {pIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={pair.left}
                                  onChange={(e) => handleUpdatePair(q.id, pIdx, "left", e.target.value)}
                                  placeholder={`বাম পাশ ${pIdx + 1}`}
                                  className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 dark:text-slate-400 outline-none font-medium"
                                />
                                <span className="text-amber-400 font-bold px-1 select-none">↔</span>
                                <input
                                  type="text"
                                  value={pair.right}
                                  onChange={(e) => handleUpdatePair(q.id, pIdx, "right", e.target.value)}
                                  placeholder={`ডান পাশ ${pIdx + 1}`}
                                  className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 dark:text-slate-400 outline-none font-medium"
                                />
                                {(q.pairs || []).length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePair(q.id, pIdx)}
                                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition cursor-pointer"
                                    title="জোড়া মুছুন"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. Fill in the Blank Editor */}
                      {q.type === "fill_blank" && (
                        <div className="space-y-2.5 p-3.5 bg-slate-900/80 rounded-2xl border border-cyan-500/30">
                          <label className="text-xs font-bold text-cyan-300 block">
                            📝 শূন্যস্থান পূরণ (Fill Blank) — গ্রহণযোগ্য সঠিক উত্তরসমূহ:
                          </label>
                          <p className="text-[10px] text-slate-400">
                            টিপস: উপরের প্রশ্ন বিবরণীতে শূন্যস্থানের জায়গায় <span className="font-mono text-cyan-300">___</span> লিখুন।
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(q.acceptedAnswers || ["সঠিক উত্তর"]).map((ans, aIdx) => (
                              <span
                                key={aIdx}
                                className="px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-1.5"
                              >
                                <span>{ans}</span>
                                {(q.acceptedAnswers || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAcceptedAnswer(q.id, aIdx)}
                                    className="hover:text-rose-400 cursor-pointer"
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
                              id={`blank-input-${q.id}`}
                              placeholder="বিকল্প গ্রহণযোগ্য উত্তর লিখে এন্টার চাপুন..."
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const val = e.currentTarget.value.trim();
                                  if (val) {
                                    handleAddAcceptedAnswer(q.id, val);
                                    e.currentTarget.value = "";
                                  }
                                }
                              }}
                              className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(`blank-input-${q.id}`) as HTMLInputElement;
                                if (el && el.value.trim()) {
                                  handleAddAcceptedAnswer(q.id, el.value.trim());
                                  el.value = "";
                                }
                              }}
                              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                            >
                              + যোগ
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 5. Ordering / Sequence Steps Editor */}
                      {q.type === "ordering" && (
                        <div className="space-y-2.5 p-3.5 bg-slate-900/80 rounded-2xl border border-purple-500/30">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-purple-300">🔢 সঠিক ক্রমানুসারে সাজানো ধাপসমূহ (Ordering Steps):</span>
                            <button
                              type="button"
                              onClick={() => handleAddOrderItem(q.id)}
                              disabled={(q.items || []).length >= 6}
                              className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ ধাপ যোগ</span>
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {(q.items || ["ধাপ ১", "ধাপ ২", "ধাপ ৩"]).map((item, itIdx) => (
                              <div key={itIdx} className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
                                <span className="w-5 h-5 rounded-lg bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                  {itIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => handleUpdateOrderItem(q.id, itIdx, e.target.value)}
                                  className="flex-1 bg-transparent text-xs text-white outline-none"
                                />
                                {(q.items || []).length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOrderItem(q.id, itIdx)}
                                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-400 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 6. Short Answer Editor */}
                      {q.type === "short_answer" && (
                        <div className="space-y-2 p-3 bg-slate-900/80 rounded-2xl border border-teal-500/30 text-xs font-bold">
                          <label className="text-teal-300 block">✍️ সংক্ষিপ্ত উত্তর — প্রধান কী-ওয়ার্ড (Expected Keyword):</label>
                          <input
                            type="text"
                            value={q.expectedAnswerKeyword || ""}
                            onChange={(e) => handleUpdateQuestion(q.id, { expectedAnswerKeyword: e.target.value })}
                            placeholder="যেমন: ওহমের সূত্র / ওহমমিটার..."
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none text-xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* Meta Row: Marks, Timer, Explanation */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-slate-800/80 text-xs font-bold">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] text-slate-400">নম্বর (Marks)</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={q.marks}
                          onChange={(e) => handleUpdateQuestion(q.id, { marks: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] text-slate-400">সময় (সেকেন্ড)</label>
                        <input
                          type="number"
                          min={10}
                          max={120}
                          value={q.timeLimit}
                          onChange={(e) => handleUpdateQuestion(q.id, { timeLimit: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none"
                        />
                      </div>

                      <div className="sm:col-span-8 space-y-1">
                        <label className="text-[10px] text-slate-400">শিক্ষামূলক ব্যাখ্যা (Explanation)</label>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) => handleUpdateQuestion(q.id, { explanation: e.target.value })}
                          placeholder="সঠিক উত্তরের যুক্তি ও টেকনিক্যাল ব্যাখ্যা..."
                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={canvasEndRef} />
              </div>
            )}
          </div>

          {/* Canvas Bottom Save Summary Dock */}
          {questions.length > 0 && (
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400 font-bold">
                মোট <span className="text-white font-black">{questions.length}টি</span> প্রশ্ন ক্যানভাসে চূড়ান্ত অবস্থায় আছে।
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveAndPublish(false)}
                  disabled={isSaving || isPublishing}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5 text-cyan-400" />
                  <span>কুইজ সংরক্ষণ করুন</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAndPublish(true)}
                  disabled={isSaving || isPublishing}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-40"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-slate-950" />
                  <span>সংরক্ষণ ও প্রকাশ করুন</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          STUDENT LIVE SIMULATOR MODAL (PREVIEW)
          ======================================================== */}
      {showSimulator && questions.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="font-black text-white text-sm">শিক্ষার্থী লাইভ প্রিভিউ সিমুলেটর</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSimulator(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {questions[simActiveIndex] && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>প্রশ্ন {simActiveIndex + 1} / {questions.length}</span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    {questions[simActiveIndex].timeLimit} সেকেন্ড
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
                  <h4 className="text-base font-black text-white leading-relaxed">
                    {questions[simActiveIndex].questionText}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {questions[simActiveIndex].options.map((opt, oIdx) => {
                    const isSelected = simSelectedOption === oIdx;
                    const isCorrect = questions[simActiveIndex].correctIndex === oIdx;
                    const letter = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"][oIdx] || String.fromCharCode(65 + oIdx);

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => {
                          setSimSelectedOption(oIdx);
                          setSimShowExplanation(true);
                        }}
                        className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                          simShowExplanation
                            ? isCorrect
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                              : isSelected
                              ? "bg-rose-500/20 border-rose-500 text-rose-300"
                              : "bg-slate-950 border-slate-800 text-slate-400"
                            : isSelected
                            ? "bg-indigo-600/30 border-indigo-500 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-black shrink-0 ${
                          simShowExplanation && isCorrect
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          {letter}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {simShowExplanation && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {simShowExplanation && questions[simActiveIndex].explanation && (
                  <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-medium space-y-1">
                    <p className="font-bold text-indigo-200">ব্যাখ্যা:</p>
                    <p>{questions[simActiveIndex].explanation}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSimActiveIndex((prev) => Math.max(0, prev - 1));
                      setSimSelectedOption(null);
                      setSimShowExplanation(false);
                    }}
                    disabled={simActiveIndex === 0}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold disabled:opacity-30 cursor-pointer"
                  >
                    পূর্ববর্তী
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimActiveIndex((prev) => Math.min(questions.length - 1, prev + 1));
                      setSimSelectedOption(null);
                      setSimShowExplanation(false);
                    }}
                    disabled={simActiveIndex === questions.length - 1}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-30 cursor-pointer"
                  >
                    পরবর্তী প্রশ্ন
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
