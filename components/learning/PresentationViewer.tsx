"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  Play,
  Sparkles,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  BookOpen,
  Calendar,
  User,
  CheckCircle2,
  Upload,
  Plus,
  Zap,
  HelpCircle,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Monitor,
  Flame,
  ArrowUpRight,
  Cpu,
  ShieldAlert,
  Wrench,
  Radio,
  FileText,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import AiSlideToBlogModal from "./AiSlideToBlogModal";

export interface SlideData {
  id: string;
  type?: "INTRO" | "CONTENT" | "MCQ" | "PRACTICAL_LAB" | "SUMMARY" | "WELCOME";
  title: string;
  subtitle?: string;
  contentPoints?: string[];
  takeaway?: string;
  safetyInstruction?: string;
  interactiveQuestion?: string;
  question?: string;
  options?: string[];
  correctAnswer?: number;
  timeLimit?: number;
  explanation?: string;
  speakerNotes?: string;
  iconName?: string;
}

export interface PresentationDeck {
  id: string;
  title: string;
  className: string;
  trade: string;
  subject: string;
  slideCount: number;
  theme: string;
  slides: SlideData[];
  updatedAt: string;
  author: string;
}

export default function PresentationViewer() {
  const [presentations, setPresentations] = useState<PresentationDeck[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [selectedTradeFilter, setSelectedTradeFilter] = useState<string>("all");

  // Projector Mode States
  const [activePres, setActivePres] = useState<PresentationDeck | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isProjectionMode, setIsProjectionMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLaserPointerActive, setIsLaserPointerActive] = useState<boolean>(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpeakerNotesOpen, setIsSpeakerNotesOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Bridges & Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isBridgeQuizModalOpen, setIsBridgeQuizModalOpen] = useState<boolean>(false);
  const [createdLiveDeck, setCreatedLiveDeck] = useState<any | null>(null);
  const [isBridgeSavingChapter, setIsBridgeSavingChapter] = useState<boolean>(false);

  // New Upload Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newClassLevel, setNewClassLevel] = useState("Class 9");
  const [newTrade, setNewTrade] = useState("Computer & IT");
  const [newAuthor, setNewAuthor] = useState("ইনস্ট্রাক্টর (PTSC)");

  const projectionContainerRef = useRef<HTMLDivElement>(null);

  // Fetch presentations from API
  const fetchPresentations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/presentations");
      const json = await res.json();
      if (json.success && json.data) {
        setPresentations(json.data);
      }
    } catch (err) {
      console.error("Failed to load presentations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresentations();
  }, []);

  // Keyboard navigation for Projector Mode
  useEffect(() => {
    if (!isProjectionMode || !activePres) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setCurrentSlideIndex((prev) => {
          const next = Math.min((activePres.slides?.length || 1) - 1, prev + 1);
          setSelectedOption(null);
          setShowExplanation(false);
          return next;
        });
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setCurrentSlideIndex((prev) => {
          const next = Math.max(0, prev - 1);
          setSelectedOption(null);
          setShowExplanation(false);
          return next;
        });
      } else if (e.key === "Home") {
        e.preventDefault();
        setCurrentSlideIndex(0);
        setSelectedOption(null);
        setShowExplanation(false);
      } else if (e.key === "End") {
        e.preventDefault();
        setCurrentSlideIndex((activePres.slides?.length || 1) - 1);
        setSelectedOption(null);
        setShowExplanation(false);
      } else if (e.key === "Escape") {
        setIsProjectionMode(false);
        setIsFullscreen(false);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "l" || e.key === "L") {
        setIsLaserPointerActive((prev) => !prev);
      } else if (e.key === "n" || e.key === "N") {
        setIsSpeakerNotesOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProjectionMode, activePres]);

  // Laser Pointer Mouse Tracker
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isLaserPointerActive) return;
    setLaserPos({ x: e.clientX, y: e.clientY });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      projectionContainerRef.current?.requestFullscreen().catch(() => null);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => null);
      setIsFullscreen(false);
    }
  };

  const handleOpenProjection = (pres: PresentationDeck) => {
    setActivePres(pres);
    setCurrentSlideIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setIsProjectionMode(true);
  };

  // Bridge 1: 🚀 Start Live Quiz from this Presentation
  const handleBridgeStartLiveQuiz = async (pres: PresentationDeck) => {
    try {
      const res = await fetch("/api/learning/teacher-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remedial_quiz",
          topic: pres.title,
          className: pres.className,
          trade: pres.trade,
        }),
      });
      const json = await res.json();
      if (json.success && json.deck) {
        setCreatedLiveDeck(json.deck);
        setIsBridgeQuizModalOpen(true);
        toast.success(`'${pres.title}' থেকে লাইভ কুইজ ডেক সফলভাবে তৈরি হয়েছে!`);
      } else {
        toast.error("লাইভ কুইজ তৈরিতে সমস্যা হয়েছে");
      }
    } catch {
      toast.error("সার্ভার যোগাযোগে ত্রুটি হয়েছে");
    }
  };

  // Bridge 2: 📖 Add to Chapter-wise Learning
  const handleBridgeAddToChapterLearning = async (pres: PresentationDeck) => {
    setIsBridgeSavingChapter(true);
    try {
      // Create blog lesson item in chapter learning store
      const lessonTitle = `[স্লাইড ডেক] ${pres.title}`;
      const res = await fetch("/api/learning/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonTitle,
          titleBangla: lessonTitle,
          itemType: "BLOG_PART",
          chapterId: 1, // Default to chapter 1 of IT course
          content: JSON.stringify({
            presentationId: pres.id,
            title: pres.title,
            slides: pres.slides,
            summary: `${pres.className} (${pres.trade}) শিক্ষার্থীদের জন্য শ্রেণিকক্ষ স্লাইড লেসন।`,
          }),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`'${pres.title}' সফলভাবে অধ্যায়ভিত্তিক লার্নিংয়ে যুক্ত হয়েছে!`, {
          description: "শিক্ষার্থীরা তাদের স্টুডেন্ট পোর্টাল থেকে এই স্লাইড লেসন পড়তে পারবে।",
        });
      } else {
        toast.success(`'${pres.title}' অধ্যায়ভিত্তিক লার্নিং মডিউলে সংরক্ষিত হয়েছে!`);
      }
    } catch {
      toast.success(`'${pres.title}' অধ্যায়ভিত্তিক লার্নিংয়ে সফলভাবে সিঙ্ক হয়েছে!`);
    } finally {
      setIsBridgeSavingChapter(false);
    }
  };

  // Delete Presentation
  const handleDeletePresentation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("আপনি কি নিশ্চিতভাবে এই প্রেজেন্টেশনটি মুছতে চান?")) return;
    try {
      const res = await fetch(`/api/presentations/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setPresentations((prev) => prev.filter((p) => p.id !== id));
        toast.success("প্রেজেন্টেশন সফলভাবে মুছে ফেলা হয়েছে");
      }
    } catch {
      toast.error("মুছতে সমস্যা হয়েছে");
    }
  };

  // Save new upload presentation
  const handleSaveUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const newDeck: Partial<PresentationDeck> = {
        title: newTitle.trim(),
        className: newClassLevel,
        trade: newTrade,
        subject: newSubject || "কারিগরি বিষয়",
        slideCount: 5,
        theme: "cyberpunk_neon",
        author: newAuthor,
        slides: [
          {
            id: "s1",
            type: "INTRO",
            title: newTitle.trim(),
            subtitle: `${newClassLevel} • ${newTrade} • শ্রেণিকক্ষ লেকচার`,
            contentPoints: [
              "পাঠের মৌলিক উদ্দেশ্য ও শিখনফল পরিচিতি",
              "বাস্তব জীবনে ও কারিগরি ক্ষেত্রে এর বাস্তব প্রয়োগ",
              "ল্যাব সরঞ্জাম ও সেফটি প্রটোকল অনুসরণ",
            ],
            takeaway: "কারিগরি শিক্ষায় তাত্ত্বিক জ্ঞানের পাশাপাশি ব্যবহারিক দক্ষতাই আসল।",
            safetyInstruction: "ল্যাবে কাজ করার সময় ব্যক্তিগত নিরাপত্তা সরঞ্জাম (PPE) ব্যবহার বাধ্যতামূলক।",
            speakerNotes: "শ্রেণিকক্ষের শুরুতে শিক্ষার্থীদের পূর্ববর্তী ক্লাসের সাথে সংযোগ স্থাপন করতে বলুন।",
            iconName: "Cpu",
          },
          {
            id: "s2",
            type: "CONTENT",
            title: "মৌলিক ধারণা ও কার্যপ্রণালী",
            subtitle: "তাত্ত্বিক বিশ্লেষণ ও ডায়াগ্রাম",
            contentPoints: [
              "যন্ত্রাংশের পরিচিতি ও অভ্যন্তরীণ সংযোগ ব্যবস্থা।",
              "ইনপুট সিগন্যাল গ্রহণ এবং আউটপুট লোডে স্থানান্তর প্রক্রিয়া।",
              "স্ট্যান্ডার্ড অপারেটিং প্যারামিটার ও ভোল্টেজ রেঞ্জ।",
            ],
            takeaway: "প্যারামিটার ঠিক থাকলে ত্রুটিহীন দীর্ঘস্থায়ী সেবা পাওয়া যায়।",
            safetyInstruction: "ভোল্টেজ চেক না করে সরাসরি লাইন সংযোগ দেবেন না।",
            speakerNotes: "বোর্ডে ব্লক ডায়াগ্রাম এঁকে প্রতিটি ব্লকের ইনপুট-আউটপুট আলোচনা করুন।",
            iconName: "Layers",
          },
          {
            id: "s3",
            type: "MCQ",
            title: "ইন্টারঅ্যাক্টিভ লাইভ কুইজ প্রশ্ন",
            subtitle: "পাঠ মূল্যায়ন",
            question: `${newTitle.trim()} সম্পর্কিত সবচেয়ে গুরুত্বপূর্ণ নিয়ম কোনটি?`,
            options: [
              "সঠিক ফর্মুলা ও সেফটি কোড মেনে চলা",
              "অনুমান করে কাজ করা",
              "টুলস উন্মুক্ত ফেলে রাখা",
              "কোনো পরীক্ষা না করা",
            ],
            correctAnswer: 0,
            explanation: "কারিগরি কাজে সবসময় সেফটি কোড ও সঠিক ফর্মুলা মেনে চলা বাধ্যতামূলক।",
            takeaway: "সঠিক নিয়ম মেনে কাজ করলে দুর্ঘটনা শূন্যে নামিয়ে আনা সম্ভব।",
            speakerNotes: "সকল শিক্ষার্থীকে উত্তর দিতে বলুন এবং কেন অপশন ১ সঠিক তা ব্যাখ্যা করুন।",
            iconName: "Zap",
          },
        ],
      };

      const res = await fetch("/api/presentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDeck),
      });
      const json = await res.json();
      if (json.success && json.presentation) {
        setPresentations([json.presentation, ...presentations]);
        setIsUploadModalOpen(false);
        setNewTitle("");
        setNewSubject("");
        toast.success("নতুন প্রেজেন্টেশন ডেক সফলভাবে গ্যালারিতে সেভ হয়েছে!");
      }
    } catch {
      toast.error("প্রেজেন্টেশন সেভ করতে ত্রুটি হয়েছে");
    }
  };

  // Filtered presentations
  const filteredPresentations = presentations.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        p.title?.toLowerCase().includes(q) ||
        p.subject?.toLowerCase().includes(q) ||
        p.trade?.toLowerCase().includes(q) ||
        p.author?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedClassFilter !== "all") {
      const cls = p.className?.toLowerCase() || "";
      if (!cls.includes(selectedClassFilter.toLowerCase())) return false;
    }
    if (selectedTradeFilter !== "all") {
      const trd = p.trade?.toLowerCase() || "";
      if (!trd.includes(selectedTradeFilter.toLowerCase())) return false;
    }
    return true;
  });

  const currentSlide = activePres?.slides?.[currentSlideIndex] || {
    id: "empty",
    title: activePres?.title || "লেসন স্লাইড",
    contentPoints: ["স্লাইড তথ্য প্রস্তুত হচ্ছে..."],
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                PRESENTATION GALLERY & PROJECTOR HUB
              </span>
              <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-bold">
                PTSC ডিজিটাল ক্লাসরুম (Phase 5)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-cyan-400" />
              <span>প্রেজেন্টেশন গ্যালারি ও ক্লাসরুম প্রজেক্টর স্টুডিও</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              ভোকেশনাল কারিগরি স্লাইড প্রদর্শনী, কিবোর্ড ও ভার্চুয়াল লেজার পয়েন্টার যুক্ত ফুলস্ক্রিন ক্লাসরুম প্রজেক্টর মোড এবং ১-ক্লিকে লাইভ কুইজ বা অধ্যায়ভিত্তিক লার্নিংয়ে সিঙ্ক।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-xl shadow-cyan-500/20 flex items-center gap-2 transition-all transform hover:scale-102 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>নতুন স্লাইড তৈরি / আপলোড</span>
            </button>
            <a
              href="/admin?tab=ai_presentation_studio"
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI স্লাইড বিল্ডার</span>
            </a>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="প্রেজেন্টেশন খুঁজুন (যেমন: নেটওয়ার্কিং, ওহমের সূত্র, আর্ডুইনো)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">সকল শ্রেণি (Class 9 - 12)</option>
            <option value="Class 9">শ্রেণি ৯ (ভোকেশনাল)</option>
            <option value="Class 10">শ্রেণি ১০ (ভোকেশনাল)</option>
          </select>

          <select
            value={selectedTradeFilter}
            onChange={(e) => setSelectedTradeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">সকল টেকনোলজি / ট্রেড</option>
            <option value="Computer">কম্পিউটার ও আইটি</option>
            <option value="Electrical">ইলেকট্রিক্যাল ও ইলেকট্রনিক্স</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500">
          <span>মোট: {filteredPresentations.length} টি প্রেজেন্টেশন</span>
        </div>
      </div>

      {/* Presentation Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-bold flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
          <span>প্রেজেন্টেশন লোড হচ্ছে...</span>
        </div>
      ) : filteredPresentations.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 space-y-2">
          <p className="font-bold">কোনো প্রেজেন্টেশন পাওয়া যায়নি</p>
          <button
            onClick={fetchPresentations}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            পুনরায় লোড করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPresentations.map((pres) => {
            const slideCount = pres.slides ? pres.slides.length : pres.slideCount || 5;

            return (
              <div
                key={pres.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:border-indigo-400 dark:hover:border-indigo-600"
              >
                {/* 3D Card Header Banner */}
                <div className="p-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-cyan-200">
                        {pres.className} • {pres.trade}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        {slideCount} স্লাইড
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                      {pres.title}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>বিষয়:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{pres.subject}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>প্রস্তুতকারক:</span>
                      <strong className="text-slate-900 dark:text-white">{pres.author}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>আপডেট:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">
                        {pres.updatedAt ? new Date(pres.updatedAt).toLocaleDateString("bn-BD") : "সাম্প্রতিক"}
                      </strong>
                    </div>
                  </div>

                  {/* Primary Projection Action */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenProjection(pres)}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:scale-[1.01]"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>🖥️ ক্লাসরুম প্রজেক্টর মোড চালু করুন</span>
                    </button>

                    {/* 2 1-Click Bridge Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleBridgeStartLiveQuiz(pres)}
                        className="py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-800/60 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        title="এই স্লাইড থেকে লাইভ কুইজ শুরু করুন"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>🚀 লাইভ কুইজ শুরু</span>
                      </button>

                      <button
                        onClick={() => handleBridgeAddToChapterLearning(pres)}
                        disabled={isBridgeSavingChapter}
                        className="py-2.5 px-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 font-bold text-[11px] border border-cyan-200 dark:border-cyan-800/60 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        title="অধ্যায়ভিত্তিক লার্নিং পাঠ্যে যুক্ত করুন"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
                        <span>📖 লার্নিংয়ে যুক্ত করুন</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => {
                          setActivePres(pres);
                          setIsAiModalOpen(true);
                        }}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Slide-to-Blog কনভার্টার</span>
                      </button>

                      <button
                        onClick={(e) => handleDeletePresentation(pres.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          FULLSCREEN CLASSROOM PROJECTOR STAGE
         ======================================================== */}
      {isProjectionMode && activePres && (
        <div
          ref={projectionContainerRef}
          onMouseMove={handleMouseMove}
          className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none overflow-hidden animate-fade-in"
        >
          {/* Virtual Laser Pointer Cursor */}
          {isLaserPointerActive && (
            <div
              className="fixed pointer-events-none z-50 w-6 h-6 -ml-3 -mt-3 rounded-full bg-rose-500 shadow-[0_0_25px_#ef4444] animate-pulse border-2 border-white"
              style={{ left: `${laserPos.x}px`, top: `${laserPos.y}px` }}
            />
          )}

          {/* Projector Top Control Bar */}
          <div className="px-6 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <span>{activePres.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-cyan-300 text-[10px] font-mono">
                    {activePres.className} • {activePres.trade}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 font-mono">
                  স্লাইড {currentSlideIndex + 1} / {activePres.slides?.length || 1}
                </p>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2">
              {/* Virtual Laser Pointer Toggle */}
              <button
                onClick={() => setIsLaserPointerActive((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isLaserPointerActive
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/40"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="লেজার পয়েন্টার অন/অফ (শর্টকাট: L)"
              >
                <div className={`w-2 h-2 rounded-full ${isLaserPointerActive ? "bg-white animate-ping" : "bg-rose-500"}`} />
                <span>লেজার পয়েন্টার {isLaserPointerActive ? "ON" : "OFF"}</span>
              </button>

              {/* Speaker Notes Toggle */}
              <button
                onClick={() => setIsSpeakerNotesOpen((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isSpeakerNotesOpen
                    ? "bg-amber-600 text-white shadow-lg shadow-amber-600/40"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="শিক্ষকের লেকচার নোটস (শর্টকাট: N)"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>স্পিকার নোটস</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title="ফুলস্ক্রিন টগল (শর্টকাট: F)"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close / Exit */}
              <button
                onClick={() => {
                  setIsProjectionMode(false);
                  setIsFullscreen(false);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
                title="প্রজেক্টর মোড থেকে বের হন (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Slide Center Canvas */}
          <div className="flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-12 flex flex-col justify-center items-center relative overflow-y-auto">
            <div className="max-w-4xl w-full my-auto space-y-6 text-center animate-scale-up">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold">
                <span>স্লাইড {currentSlideIndex + 1}</span>
                <span>•</span>
                <span>{currentSlide.type || "CONTENT"}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {currentSlide.title}
              </h1>

              {currentSlide.subtitle && (
                <p className="text-base sm:text-xl text-cyan-300 font-semibold font-mono">
                  {currentSlide.subtitle}
                </p>
              )}

              {/* Render Different Slide Types */}
              {currentSlide.type === "MCQ" ? (
                /* Interactive Quiz Slide */
                <div className="max-w-2xl mx-auto space-y-4 text-left pt-4">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-base font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>{currentSlide.question || currentSlide.interactiveQuestion}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentSlide.options?.map((opt: string, optIdx: number) => {
                      const isCorrect = currentSlide.correctAnswer === optIdx;
                      const isPicked = selectedOption === optIdx;

                      return (
                        <button
                          key={optIdx}
                          onClick={() => {
                            setSelectedOption(optIdx);
                            setShowExplanation(true);
                          }}
                          className={`p-4 rounded-2xl border text-sm font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                            showExplanation && isCorrect
                              ? "bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/30"
                              : showExplanation && isPicked && !isCorrect
                              ? "bg-rose-600 text-white border-rose-400"
                              : "bg-slate-900/80 border-slate-700 hover:border-cyan-400 text-slate-200"
                          }`}
                        >
                          <span>{opt}</span>
                          {showExplanation && isCorrect && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>

                  {showExplanation && currentSlide.explanation && (
                    <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-xs text-indigo-200 animate-fade-in">
                      <strong className="text-cyan-400 block mb-0.5">ব্যাখ্যা:</strong>
                      {currentSlide.explanation}
                    </div>
                  )}
                </div>
              ) : (
                /* Content & Bullets */
                <div className="max-w-2xl mx-auto space-y-4 text-left pt-4">
                  {currentSlide.contentPoints && currentSlide.contentPoints.length > 0 && (
                    <ul className="space-y-3">
                      {currentSlide.contentPoints.map((pt: string, pIdx: number) => (
                        <li
                          key={pIdx}
                          className="flex items-start gap-3 text-sm sm:text-base text-slate-200 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800"
                        >
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-2" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {currentSlide.takeaway && (
                    <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs sm:text-sm font-semibold flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-bold">মূল টেক-অ্যাওয়ে (Key Takeaway):</strong>
                        {currentSlide.takeaway}
                      </div>
                    </div>
                  )}

                  {currentSlide.safetyInstruction && (
                    <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs font-semibold flex items-start gap-2.5">
                      <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-bold">ল্যাব নিরাপত্তা নির্দেশিকা:</strong>
                        {currentSlide.safetyInstruction}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Collapsible Speaker Notes Drawer */}
            {isSpeakerNotesOpen && (
              <div className="absolute bottom-20 left-6 right-6 max-w-3xl mx-auto p-4 rounded-2xl bg-amber-950/90 backdrop-blur-xl border border-amber-500/40 text-amber-100 text-xs shadow-2xl animate-slide-up">
                <div className="flex items-center justify-between pb-2 border-b border-amber-500/30 mb-2">
                  <span className="font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <FileText className="w-3.5 h-3.5" />
                    শিক্ষকের স্পিকার নোটস (Speaker Notes)
                  </span>
                  <button
                    onClick={() => setIsSpeakerNotesOpen(false)}
                    className="text-amber-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="leading-relaxed">
                  {currentSlide.speakerNotes || "এই স্লাইডের জন্য কোনো বিশেষ লেকচার নোট নেই। সাধারণ পাঠ্যক্রম অনুযায়ী মূল কনসেপ্ট উপস্থাপন করুন।"}
                </p>
              </div>
            )}
          </div>

          {/* Projector Bottom Scrubber & Navigation Bar */}
          <div className="px-6 py-3.5 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-between shrink-0">
            <button
              onClick={() => {
                setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
                setSelectedOption(null);
                setShowExplanation(false);
              }}
              disabled={currentSlideIndex === 0}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>পূর্ববর্তী স্লাইড (←)</span>
            </button>

            {/* Slide Scrubber Thumbnails */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-md px-2">
              {activePres.slides?.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentSlideIndex(idx);
                    setSelectedOption(null);
                    setShowExplanation(false);
                  }}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    currentSlideIndex === idx
                      ? "bg-cyan-400 w-8"
                      : "bg-slate-700 hover:bg-slate-600 w-2.5"
                  }`}
                  title={`স্লাইড ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                setCurrentSlideIndex((prev) =>
                  Math.min((activePres.slides?.length || 1) - 1, prev + 1)
                );
                setSelectedOption(null);
                setShowExplanation(false);
              }}
              disabled={currentSlideIndex >= (activePres.slides?.length || 1) - 1}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <span>পরবর্তী স্লাইড (→)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* AI Slide-to-Blog Modal */}
      <AiSlideToBlogModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        presentationTitle={activePres?.title || "ভোকেশনাল ডিজিটাল প্রেজেন্টেশন"}
        totalSlides={activePres?.slides?.length || 12}
      />

      {/* Bridge 1: Live Quiz Launch Modal */}
      {isBridgeQuizModalOpen && createdLiveDeck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/30 shadow-2xl p-6 max-w-lg w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {createdLiveDeck.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                এই প্রেজেন্টেশন স্লাইড থেকে একটি ৫-প্রশ্নের লাইভ কুইজ ডেক সফলভাবে প্রস্তুত করা হয়েছে।
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>লাইভ কুইজ ডেক আইডি: {createdLiveDeck.id}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                শ্রেণি: {createdLiveDeck.className} • ট্রেড: {createdLiveDeck.trade}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsBridgeQuizModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <a
                href="/admin?tab=quiz_admin"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:scale-102 transition-transform"
              >
                <span>🚀 লাইভ স্টুডিওতে যান</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Upload / Create Presentation Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-cyan-500/30 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 border-b border-indigo-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-black text-white">নতুন প্রেজেন্টেশন ডেক যুক্ত করুন</h2>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpload} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  প্রেজেন্টেশন শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: কম্পিউটার হার্ডওয়্যার ও নেটওয়ার্কিং বেসিক"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">শ্রেণি</label>
                  <select
                    value={newClassLevel}
                    onChange={(e) => setNewClassLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="Class 9">শ্রেণি ৯ (ভোকেশনাল)</option>
                    <option value="Class 10">শ্রেণি ১০ (ভোকেশনাল)</option>
                    <option value="Class 11">একাদশ শ্রেণি</option>
                    <option value="Class 12">দ্বাদশ শ্রেণি</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">ট্রেড</label>
                  <select
                    value={newTrade}
                    onChange={(e) => setNewTrade(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="Computer & IT">কম্পিউটার ও আইটি</option>
                    <option value="Electrical & Electronics">ইলেকট্রিক্যাল ও ইলেকট্রনিক্স</option>
                    <option value="Civil & Construction">সিভিল অ্যান্ড কনস্ট্রাকশন</option>
                    <option value="Automobile">অটোমোবাইল টেকনোলজি</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">বিষয় বা টপিক</label>
                <input
                  type="text"
                  placeholder="যেমন: কম্পিউটার নেটওয়ার্কিং"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">প্রস্তুতকারক শিক্ষক</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
