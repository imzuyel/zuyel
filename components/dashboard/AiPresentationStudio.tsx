"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, Sliders, Presentation, Play, Download, Plus, Trash2, Edit3, 
  ChevronLeft, ChevronRight, BookOpen, Cpu, ShieldAlert, Award, Layers, 
  Settings, Smartphone, ClipboardList, Lightbulb, Activity, Code, Zap, Wrench,
  Loader2, RefreshCw, Eye, EyeOff, Layout, FileText, Printer, Check, Info, ShieldCheck,
  FileSpreadsheet, FileOutput, Maximize2, Minimize2, Palette, Sparkle, Flame, Search,
  X, CheckCircle2, Grid, Layers3, Hash
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ACADEMIC_CLASSES, ALL_TRADES } from "@/lib/academicStructure";
import { 
  PRESENTATION_THEMES, 
  THEME_CATEGORIES, 
  getPresentationThemeById, 
  PresentationTheme 
} from "@/lib/presentationThemes";
import SmartPdfPickerDropdown from "@/components/common/SmartPdfPickerDropdown";
import { DocumentRepoItem } from "@/lib/documentRepository";
import { toast } from "sonner";

// Re-map icon names to actual Lucide component references safely
const ICON_MAP: Record<string, any> = {
  BookOpen, Cpu, ShieldAlert, Award, Layers, Settings, Smartphone, ClipboardList, Lightbulb, Activity, Code, Zap, Wrench
};

export interface SlideItem {
  title: string;
  subtitle: string;
  contentPoints: string[];
  takeaway: string;
  safetyInstruction: string;
  interactiveQuestion: string;
  iconName: string;
  imageUrl: string;
}

export default function AiPresentationStudio() {
  const [topic, setTopic] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("4"); // Default Class 9
  const [selectedTradeCode, setSelectedTradeCode] = useState("SSC-T1");
  const [customNotes, setCustomNotes] = useState("");
  const [selectedPdfDocId, setSelectedPdfDocId] = useState<string>("");
  const [requestedSlideCount, setRequestedSlideCount] = useState<number>(5);
  const [apiErrorBanner, setApiErrorBanner] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  
  const [generating, setSubmitting] = useState(false);
  const [downloadingPptx, setDownloadingPptx] = useState(false);

  // Theme Selection States (50+ Themes Registry)
  const [selectedThemeId, setSelectedThemeId] = useState<string>("cyber_cyan");
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [activeThemeCategory, setActiveThemeCategory] = useState<string>("All Themes");
  const [themeSearchQuery, setThemeSearchQuery] = useState("");

  // Generated Slides State
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [editMode, setEditItemMode] = useState(false);
  const [playMode, setPlayMode] = useState(false);
  const [entranceAnimation, setEntranceAnimation] = useState<"slide" | "scale" | "fade">("slide");

  // Restore saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("PTSC_AI_PRESENTATION_STUDIO_DRAFT_V2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.topic) setTopic(parsed.topic);
        if (parsed.selectedClassId) setSelectedClassId(parsed.selectedClassId);
        if (parsed.selectedTradeCode) setSelectedTradeCode(parsed.selectedTradeCode);
        if (parsed.customNotes) setCustomNotes(parsed.customNotes);
        if (parsed.selectedPdfDocId) setSelectedPdfDocId(parsed.selectedPdfDocId);
        if (parsed.requestedSlideCount) setRequestedSlideCount(parsed.requestedSlideCount);
        if (parsed.selectedThemeId) setSelectedThemeId(parsed.selectedThemeId);
        if (Array.isArray(parsed.slides) && parsed.slides.length > 0) {
          setSlides(parsed.slides);
        }
        setDraftRestored(true);
      }
    } catch (e) {
      console.error("Error restoring presentation draft:", e);
    }
  }, []);

  // Save draft state to localStorage on every change
  useEffect(() => {
    try {
      const draftData = {
        topic,
        selectedClassId,
        selectedTradeCode,
        customNotes,
        selectedPdfDocId,
        requestedSlideCount,
        selectedThemeId,
        slides,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem("PTSC_AI_PRESENTATION_STUDIO_DRAFT_V2", JSON.stringify(draftData));
    } catch (e) {
      console.error("Error saving presentation draft:", e);
    }
  }, [topic, selectedClassId, selectedTradeCode, customNotes, selectedPdfDocId, requestedSlideCount, selectedThemeId, slides]);

  const handleResetDraft = () => {
    try {
      localStorage.removeItem("PTSC_AI_PRESENTATION_STUDIO_DRAFT_V2");
      setTopic("");
      setCustomNotes("");
      setSelectedPdfDocId("");
      setSlides([]);
      setActiveSlideIndex(0);
      setDraftRestored(false);
      toast.success("খসড়া রিসেট করা হয়েছে। নতুন প্রেজেন্টেশন শুরু করুন।");
    } catch (e) {
      toast.error("খসড়া মুছে ফেলতে সমস্যা হয়েছে।");
    }
  };

  const printAreaRef = useRef<HTMLDivElement>(null);
  const activeTheme = getPresentationThemeById(selectedThemeId);

  // Auto-suggest trades for class
  const currentClassObj = ACADEMIC_CLASSES.find(c => String(c.id) === selectedClassId);
  const applicableTrades = ALL_TRADES.filter(t => t.applicableClass === currentClassObj?.numericValue);

  // Filtered Themes list
  const filteredThemes = PRESENTATION_THEMES.filter((t) => {
    const matchesCategory = activeThemeCategory === "All Themes" || t.category === activeThemeCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(themeSearchQuery.toLowerCase()) ||
      t.nameBangla.toLowerCase().includes(themeSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Keyboard navigation for Fullscreen Presentation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playMode || slides.length === 0) return;
      if (e.key === "ArrowRight" || e.key === "Space") {
        setActiveSlideIndex((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft") {
        setActiveSlideIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        setPlayMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playMode, slides.length]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("অনুগ্রহ করে একটি টেকনিক্যাল বিষয়ের নাম লিখুন।");
      return;
    }

    setSubmitting(true);
    setApiErrorBanner(null);
    setSlides([]);
    setActiveSlideIndex(0);

    try {
      const clsName = currentClassObj ? currentClassObj.nameBangla : "শ্রেণি ৯";
      const tradeObj = ALL_TRADES.find(t => t.code === selectedTradeCode);
      const tradeName = tradeObj ? tradeObj.nameBangla : "সাধারণ কারিগরি জ্ঞান";

      const res = await fetch("/api/cms/presentation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          className: clsName,
          trade: tradeName,
          notes: customNotes,
          requestedSlideCount: Number(requestedSlideCount) || 5
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "দুঃখিত, এআই স্লাইড প্রসেস করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      }

      const data = await res.json();
      if (data.success && data.presentation && Array.isArray(data.presentation.slides) && data.presentation.slides.length > 0) {
        setSlides(data.presentation.slides);
        setApiErrorBanner(null);
        toast.success(`আলহামদুলিল্লাহ! আপনার ${data.presentation.slides.length}টি স্লাইড সফলভাবে প্রস্তুত হয়েছে।`);
      } else {
        throw new Error(data.error || "দুঃখিত, ফাইল তৈরি করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      }
    } catch (err: any) {
      console.error("Slide Generation Error:", err);
      const errMsg = err.message || "দুঃখিত, ফাইল তৈরি করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।";
      setApiErrorBanner(errMsg);
      toast.error(errMsg);
    } finally {
      // Guaranteed loader dismiss & state restoration
      setSubmitting(false);
    }
  };

  // Direct PPTX Download Handler
  const handleDownloadPPTX = async () => {
    if (!topic.trim()) {
      toast.error("প্রেজেন্টেশনের জন্য একটি বিষয় বা টপিক পূরণ করুন।");
      return;
    }

    setDownloadingPptx(true);
    setApiErrorBanner(null);
    toast.info(`PowerPoint ফাইল প্রসেস করা হচ্ছে (${activeTheme.nameBangla})...`);

    try {
      const clsName = currentClassObj ? currentClassObj.nameBangla : "শ্রেণি ৯";
      const tradeObj = ALL_TRADES.find(t => t.code === selectedTradeCode);
      const tradeName = tradeObj ? tradeObj.nameBangla : "সাধারণ কারিগরি জ্ঞান";

      const response = await fetch("/api/ai/generate-pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          className: clsName,
          trade: tradeName,
          notes: customNotes,
          theme: selectedThemeId,
          requestedSlideCount: Number(requestedSlideCount) || 5
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "দুঃখিত, পাওয়ারপয়েন্ট ফাইল তৈরি করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      }

      // Convert response binary stream to Blob and trigger instant browser download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeFilename = topic.replace(/[^\w\s-]/gi, "").trim().replace(/\s+/g, "_") || "PTSC_Lecture";
      a.download = `PTSC_Presentation_${safeFilename}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setApiErrorBanner(null);
      toast.success("আলহামদুলিল্লাহ! আপনার পাওয়ারপয়েন্ট (.pptx) ফাইল সফলভাবে তৈরি ও ডাউনলোড হয়েছে।");
    } catch (err: any) {
      console.error("PPTX Download error:", err);
      const errMsg = err.message || "দুঃখিত, ফাইল তৈরি করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।";
      setApiErrorBanner(errMsg);
      toast.error(errMsg);
    } finally {
      // Guaranteed loader dismiss & state restoration
      setDownloadingPptx(false);
    }
  };

  // Export PDF Handler
  const handleExportPDF = async () => {
    if (slides.length === 0) return;
    toast.info("পিডিএফ প্রস্তুত করা হচ্ছে...");

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = printAreaRef.current;
      if (!element) {
        toast.error("প্রিন্ট এরিয়া পাওয়া যায়নি।");
        return;
      }
      
      const opt = {
        margin:       0.2,
        filename:     `PTSC_Presentation_${topic.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: activeTheme.isDark ? '#020617' : '#FFFFFF' },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
      } as any;

      html2pdf().from(element).set(opt).save().then(() => {
        toast.success("পিডিএফ ডকুমেন্ট ডাউনলোড সম্পন্ন হয়েছে!");
      });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("পিডিএফ এক্সপোর্ট করতে সমস্যা হয়েছে।");
    }
  };

  // Modify Slide point
  const handleUpdatePoint = (slideIdx: number, pointIdx: number, newValue: string) => {
    const updated = [...slides];
    updated[slideIdx].contentPoints[pointIdx] = newValue;
    setSlides(updated);
  };

  // Delete point
  const handleDeletePoint = (slideIdx: number, pointIdx: number) => {
    const updated = [...slides];
    updated[slideIdx].contentPoints.splice(pointIdx, 1);
    setSlides(updated);
  };

  // Add new point
  const handleAddPoint = (slideIdx: number) => {
    const updated = [...slides];
    updated[slideIdx].contentPoints.push("নতুন পয়েন্ট যোগ করুন...");
    setSlides(updated);
  };

  // Switch Animation Styles
  const getAnimationVariants = () => {
    if (entranceAnimation === "scale") {
      return {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.05 }
      };
    }
    if (entranceAnimation === "fade") {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      };
    }
    // Default slide-up
    return {
      initial: { opacity: 0, y: 15 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -15 }
    };
  };

  const activeSlide = slides[activeSlideIndex];
  const ActiveIconComponent = activeSlide ? (ICON_MAP[activeSlide.iconName] || BookOpen) : BookOpen;

  return (
    <div className="relative text-slate-100 bg-slate-950 rounded-3xl border border-slate-800/80 p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 overflow-hidden min-h-0 max-w-full shadow-2xl">
      
      {/* SMART LOADING OVERLAY & BLOCKING GUARD */}
      <AnimatePresence>
        {(generating || downloadingPptx) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full space-y-5 shadow-2xl relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(6,182,212,0.35)]">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-black text-white">
                  {generating 
                    ? `এআই ${requestedSlideCount}টি স্লাইড প্রস্তুত করছে...` 
                    : "পাওয়ারপয়েন্ট (.pptx) ফাইল তৈরি হচ্ছে..."}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  অনুগ্রহ করে অপেক্ষা করুন। বিটিইবি কারিকুলাম, টেকনিক্যাল সেফটি রুলস ও থিম কালার সিঙ্ক করা হচ্ছে।
                </p>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 h-full w-full animate-pulse" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi-color Glowing Backdrop Orbs */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse delay-1000" />
      <div className="absolute top-1/2 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse delay-700" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.25)]">
            <Presentation className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg lg:text-xl font-black text-white flex items-center gap-2">
              <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                AI স্লাইড ও পাওয়ারপয়েন্ট (.pptx) জেনারেটর
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono tracking-widest uppercase font-bold">
                50+ Themes
              </span>
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) • BTEB স্মার্ট টিচিং প্রেজেন্টেশন
            </p>
          </div>
        </div>

        {/* Global Action Hub: Theme Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Theme Quick Selector Button */}
          <button
            type="button"
            onClick={() => setThemeModalOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-purple-500/40 hover:border-purple-400 text-purple-300 hover:text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.2)] transition cursor-pointer"
            title="৫০+ প্রফেশনাল থিম গ্যালারি খুলুন"
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <span>থিম: <strong>{activeTheme.nameBangla.split(" ")[0]}</strong></span>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${activeTheme.accentColor}` }} />
          </button>

          {/* CONDITIONAL DOWNLOAD BUTTON VISIBILITY - ONLY APPEARS WHEN SLIDES ARE READY */}
          <AnimatePresence>
            {slides.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 10 }}
                className="flex items-center gap-2"
              >
                <button
                  onClick={handleDownloadPPTX}
                  disabled={downloadingPptx}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
                  title="কম্পিউটার বা প্রজেক্টরে প্লে করার জন্য আসল পাওয়ারপয়েন্ট ফাইল ডাউনলোড করুন"
                >
                  <FileOutput className="w-4 h-4 text-slate-950" />
                  <span>ডাইরেক্ট PowerPoint (.pptx) ডাউনলোড</span>
                </button>

                <button
                  onClick={() => setPlayMode(true)}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-bold text-xs flex items-center gap-1.5 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)] transition cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4 text-cyan-400" />
                  <span>ফুলস্ক্রিন ভিউ</span>
                </button>

                <button
                  onClick={handleExportPDF}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-white font-bold text-xs flex items-center gap-1.5 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.2)] transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>পিডিএফ ব্যাকআপ</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Split Layout Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Setup Configurator Panel */}
        <div className="lg:col-span-4 space-y-4">
          <form onSubmit={handleGenerate} className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 space-y-4 backdrop-blur-xl shadow-xl">
            <h2 className="text-xs font-black text-slate-200 flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2 uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>স্মার্ট লেকচার কনফিগারেশন</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1" title="আপনার ইনপুট ও ড্রাফট স্লাইড অটোমেটিক সংরক্ষিত হচ্ছে">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  <span>অটো-সেভড</span>
                </span>
                {(topic || slides.length > 0) && (
                  <button
                    type="button"
                    onClick={handleResetDraft}
                    className="text-[9px] text-rose-400 hover:text-rose-300 font-bold hover:underline cursor-pointer"
                    title="নতুন প্রেজেন্টেশন শুরু করতে খসড়া মুছে ফেলুন"
                  >
                    রিসেট
                  </button>
                )}
              </div>
            </h2>

            {/* Topic Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>লেকচার টপিক / পাঠের বিষয় *</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="যেমন: ওহমের সূত্র ও সার্কিট এনালাইসিস"
                className="w-full p-3 bg-slate-950/90 border border-slate-700/80 rounded-2xl text-xs font-bold text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden transition shadow-inner"
                required
                disabled={generating || downloadingPptx}
              />
            </div>

            {/* Class & Trade selection */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">শ্রেণি (Class)</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-200 outline-hidden"
                  disabled={generating || downloadingPptx}
                >
                  {ACADEMIC_CLASSES.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.nameBangla}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">কারিগরি ট্রেড</label>
                <select
                  value={selectedTradeCode}
                  onChange={(e) => setSelectedTradeCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-200 outline-hidden"
                  disabled={generating || downloadingPptx}
                >
                  {applicableTrades.length === 0 ? (
                    <option value="">সাধারণ শিক্ষা</option>
                  ) : (
                    applicableTrades.map((t) => (
                      <option key={t.code} value={t.code}>{t.nameBangla}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* SLIDE COUNT SELECTOR (5, 10, 15, 20 slides) */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-[11px] font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>স্লাইড সংখ্যা নির্বাচন করুন (Slide Count)</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono font-black">{requestedSlideCount}টি স্লাইড</span>
              </label>

              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setRequestedSlideCount(count)}
                    disabled={generating || downloadingPptx}
                    className={`py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                      requestedSlideCount === count
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    {count}টি
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Syllabus PDF Auto-Detection Hub */}
            <div className="pt-2 border-t border-slate-800/80">
              <SmartPdfPickerDropdown
                classId={selectedClassId}
                tradeCode={selectedTradeCode}
                activeDocumentId={selectedPdfDocId}
                onSelectDocument={(doc: DocumentRepoItem) => {
                  setSelectedPdfDocId(doc.id);
                  setCustomNotes(doc.extractedTextSnippet);
                  if (!topic.trim()) {
                    setTopic(doc.titleBangla);
                  }
                }}
                onClearDocument={() => {
                  setSelectedPdfDocId("");
                  setCustomNotes("");
                }}
              />
            </div>

            {/* Additional custom notes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">অতিরিক্ত নোট / পয়েন্ট গাইড (Syllabus text)</label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="সিলেবাসের বিশেষ প্রাকটিক্যাল ধাপ বা সেফটি রুলস যোগ করতে পারেন..."
                rows={2}
                className="w-full p-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-200 outline-hidden resize-none"
                disabled={generating || downloadingPptx}
              />
            </div>

            {/* Theme Selector Trigger & Preview Pill */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <label className="block text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>PowerPoint ও স্লাইড থিম (50+ Themes)</span>
                <button
                  type="button"
                  onClick={() => setThemeModalOpen(true)}
                  className="text-[10px] text-purple-400 hover:underline font-bold flex items-center gap-1"
                  disabled={generating || downloadingPptx}
                >
                  <Grid className="w-3 h-3" />
                  <span>গ্যালারি দেখুন</span>
                </button>
              </label>

              <button
                type="button"
                onClick={() => setThemeModalOpen(true)}
                disabled={generating || downloadingPptx}
                className="w-full p-3 rounded-2xl bg-slate-950/90 border border-slate-700/80 hover:border-purple-500/50 flex items-center justify-between text-left transition group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: `#${activeTheme.accentColor}` }} />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">{activeTheme.nameBangla}</div>
                    <div className="text-[10px] text-slate-400">{activeTheme.category} • {activeTheme.isDark ? "Dark Theme" : "Light Theme"}</div>
                  </div>
                </div>
                <Palette className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-purple-400" />
              </button>
            </div>

            {/* Error Feedback Banner */}
            {apiErrorBanner && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2 backdrop-blur-md animate-fade-in">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-bold">{apiErrorBanner}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setApiErrorBanner(null)}
                  className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-400 hover:text-white"
                  title="বন্ধ করুন"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Action Trigger Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={generating || downloadingPptx}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-xs transition-all duration-300 shadow-[0_0_25px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>AI দিয়ে স্লাইড জেনারেট হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>১. AI দিয়ে {requestedSlideCount}টি স্লাইড তৈরি করুন</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Informational Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-400 font-medium flex gap-2.5 backdrop-blur-md">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>স্লাইড জেনারেট হওয়ার পর ডাইরেক্ট <strong>.pptx</strong> ফাইল এবং <strong>পিডিএফ ব্যাকআপ</strong> ডাউনলোড বাটনটি সক্রিয় হবে।</span>
          </div>

          {/* Slide List Outline View if slides exist */}
          {slides.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-2.5 backdrop-blur-xl">
              <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>লেকচার স্লাইড ডেক ({slides.length})</span>
                <span className="text-[10px] text-cyan-400 font-mono">PTSC-TVET</span>
              </h3>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                {slides.map((slide, sIdx) => {
                  const SlideIcon = ICON_MAP[slide.iconName] || BookOpen;
                  const isActive = sIdx === activeSlideIndex;
                  return (
                    <button
                      key={sIdx}
                      onClick={() => {
                        setActiveSlideIndex(sIdx);
                        setEditItemMode(false);
                      }}
                      className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 text-left text-xs transition cursor-pointer border ${
                        isActive
                          ? "bg-slate-800 border-cyan-500/50 text-white font-bold shadow-md shadow-cyan-500/10"
                          : "bg-slate-950/40 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono ${
                        isActive ? "bg-cyan-500 text-slate-950 font-black" : "bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}>
                        {(sIdx + 1)}
                      </span>
                      <SlideIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-cyan-400 animate-bounce" : "text-slate-500 dark:text-slate-400"}`} />
                      <span className="truncate flex-1">{slide.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Interactive Slide Preview / Editor Screen */}
        <div className="lg:col-span-8 space-y-4">
          
          {slides.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800/90 rounded-3xl p-12 sm:p-16 text-center space-y-4 flex flex-col items-center justify-center min-h-[480px] backdrop-blur-xl">
              <div className="p-4 rounded-3xl bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-purple-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                <Presentation className="w-12 h-12 animate-pulse" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-sm sm:text-base font-black text-white">কোনো লেকচার স্লাইড এখনও জেনারেট করা হয়নি</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  বাম পাশের প্যানেলে টপিক ও স্লাইড সংখ্যা নির্ধারণ করে <strong className="text-cyan-300">১. AI দিয়ে স্লাইড তৈরি করুন</strong> বাটনে ক্লিক করুন।
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Slide Control ToolBar */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-xl">
                <div className="flex items-center gap-2 font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[11px]">
                    স্লাইড {(activeSlideIndex + 1)} / {slides.length}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">|</span>
                  <span className="text-slate-200 truncate max-w-[180px] sm:max-w-none">{activeSlide.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditItemMode(!editMode)}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                      editMode 
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 font-black" 
                        : "bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{editMode ? "এডিটিং মোড অন" : "স্লাইড এডিট"}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={activeSlideIndex === 0}
                      onClick={() => {
                        setActiveSlideIndex(prev => prev - 1);
                        setEditItemMode(false);
                      }}
                      className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={activeSlideIndex === slides.length - 1}
                      onClick={() => {
                        setActiveSlideIndex(prev => prev + 1);
                        setEditItemMode(false);
                      }}
                      className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* LIVE SLIDE CONTAINER - DYNAMIC REGISTRY THEME STYLING */}
              <div
                ref={printAreaRef}
                className={`relative overflow-hidden border rounded-3xl shadow-2xl w-full p-6 sm:p-8 space-y-6 flex flex-col justify-between aspect-[16/10] min-h-[460px] backdrop-blur-xl ${activeTheme.bgTailwind}`}
                style={{
                  backgroundColor: `#${activeTheme.bgColor}`,
                  color: `#${activeTheme.textColor}`,
                  borderColor: `#${activeTheme.accentColor}40`,
                  boxShadow: `0 0 45px #${activeTheme.accentColor}25`
                }}
              >
                {/* Backlighting Orb inside slide */}
                <div 
                  className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-25 transition-all"
                  style={{ backgroundColor: `#${activeTheme.accentColor}` }}
                />

                {/* Technical Institution Badge for PDF print branding */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center text-[10px] font-black border border-slate-800"
                      style={{ color: `#${activeTheme.accentColor}` }}
                    >
                      PTSC
                    </div>
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase leading-none tracking-wide" style={{ color: `#${activeTheme.textColor}` }}>
                        Panchagarh Govt. Technical School & College
                      </h4>
                      <span className="text-[9px] font-mono mt-0.5" style={{ color: `#${activeTheme.subTextColor}` }}>
                        EIIN: 132244 • Smart TVET Presentation
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800" style={{ color: `#${activeTheme.subTextColor}` }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `#${activeTheme.accentColor}` }} />
                    <span>শ্রেণি: {currentClassObj?.nameBangla || "সাধারণ"} • ২০২৬</span>
                  </div>
                </div>

                {/* Animated Entrance Wrapper using Framer Motion */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSlideIndex}
                    variants={getAnimationVariants()}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-5 relative z-10 flex-1 items-start"
                  >
                    
                    {/* Left content text pane */}
                    <div className="md:col-span-7 space-y-4">
                      
                      {/* Slide Main Header Block */}
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div 
                            className="p-1.5 rounded-xl border"
                            style={{ 
                              backgroundColor: `#${activeTheme.accentColor}20`,
                              color: `#${activeTheme.accentColor}`,
                              borderColor: `#${activeTheme.accentColor}40`
                            }}
                          >
                            <ActiveIconComponent className="w-4 h-4 animate-bounce" />
                          </div>
                          <span 
                            className="text-[10px] font-extrabold uppercase tracking-widest"
                            style={{ color: `#${activeTheme.accentColor}` }}
                          >
                            {activeSlide.subtitle}
                          </span>
                        </div>
                        <h2 className="text-base sm:text-lg lg:text-xl font-black leading-tight" style={{ color: `#${activeTheme.textColor}` }}>
                          {activeSlide.title}
                        </h2>
                      </div>

                      {/* Content Points / Bullet Lists */}
                      <div className="space-y-2">
                        {activeSlide.contentPoints.map((pt, pIdx) => (
                          <div key={pIdx} className="flex items-start gap-2.5 group">
                            <span className="font-black text-xs shrink-0 mt-0.5" style={{ color: `#${activeTheme.accentColor}` }}>✦</span>
                            {editMode ? (
                              <input
                                type="text"
                                value={pt}
                                onChange={(e) => handleUpdatePoint(activeSlideIndex, pIdx, e.target.value)}
                                className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded px-2.5 py-1 text-xs font-semibold"
                                style={{ color: `#${activeTheme.textColor}` }}
                              />
                            ) : (
                              <p className="text-xs leading-relaxed font-bold" style={{ color: `#${activeTheme.textColor}` }}>{pt}</p>
                            )}
                            {editMode && (
                              <button
                                onClick={() => handleDeletePoint(activeSlideIndex, pIdx)}
                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-400 shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}

                        {editMode && (
                          <button
                            onClick={() => handleAddPoint(activeSlideIndex)}
                            className="mt-2.5 px-3 py-1 text-[10px] font-black bg-slate-950/80 border border-slate-800 rounded-lg flex items-center gap-1"
                            style={{ color: `#${activeTheme.accentColor}` }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>নতুন পয়েন্ট যোগ করুন</span>
                          </button>
                        )}
                      </div>

                      {/* Bottom Takeaway card block */}
                      <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px]" style={{ color: `#${activeTheme.subTextColor}` }}>
                        <strong style={{ color: `#${activeTheme.textColor}` }}>সারসংক্ষেপ (Key Takeaway):</strong> {activeSlide.takeaway}
                      </div>

                    </div>

                    {/* Right column pane: Media, Safety & Interactive Assessment */}
                    <div className="md:col-span-5 space-y-4">
                      
                      {/* Image / Stock Illustration Box */}
                      {activeSlide.imageUrl && (
                        <div className="relative rounded-2xl overflow-hidden border border-slate-800/80 aspect-video group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeSlide.imageUrl}
                            alt={activeSlide.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                          <span className="absolute bottom-2.5 left-3 text-[9px] font-bold text-slate-200 bg-slate-950/90 px-2 py-0.5 rounded border border-slate-800">
                            ব্যবহারিক চিত্র
                          </span>
                        </div>
                      )}

                      {/* BTEB Safety Instruction block with Red/Amber Alert styling */}
                      {activeSlide.safetyInstruction && (
                        <div className="p-3.5 rounded-2xl border text-[11px] space-y-1 backdrop-blur-md" style={{ backgroundColor: `#${activeTheme.alertBg}50`, borderColor: `#${activeTheme.alertText}50` }}>
                          <span className="font-extrabold flex items-center gap-1" style={{ color: `#${activeTheme.alertText}` }}>
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" style={{ color: `#${activeTheme.alertText}` }} />
                            <span>BTEB ল্যাব সেফটি নির্দেশিকা:</span>
                          </span>
                          <p className="leading-relaxed font-bold" style={{ color: `#${activeTheme.textColor}` }}>{activeSlide.safetyInstruction}</p>
                        </div>
                      )}

                      {/* Interactive evaluation question */}
                      {activeSlide.interactiveQuestion && (
                        <div className="p-3.5 rounded-2xl border text-[11px] space-y-1 backdrop-blur-md" style={{ backgroundColor: `#${activeTheme.secondaryAccent}15`, borderColor: `#${activeTheme.secondaryAccent}30` }}>
                          <span className="font-black flex items-center gap-1" style={{ color: `#${activeTheme.secondaryAccent}` }}>
                            <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                            <span>মূল্যায়ন প্রশ্ন (Evaluation Q&A):</span>
                          </span>
                          <p className="font-medium italic" style={{ color: `#${activeTheme.textColor}` }}>"{activeSlide.interactiveQuestion}"</p>
                        </div>
                      )}

                    </div>

                  </motion.div>
                </AnimatePresence>

                {/* Footer page number for print */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-[10px] font-mono tracking-wider relative z-10" style={{ color: `#${activeTheme.subTextColor}` }}>
                  <span>PTSC AI Presentation Studio • Theme: {activeTheme.name}</span>
                  <span className="font-bold">Page {(activeSlideIndex + 1)} / {slides.length}</span>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* 50+ PRE-BUILT THEMES SELECTOR MODAL */}
      <AnimatePresence>
        {themeModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-4xl w-full space-y-5 shadow-2xl my-auto max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                      <span>৫০+ প্রফেশনাল পাওয়ারপয়েন্ট থিম গ্যালারি</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-mono">50+ Registry</span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">আপনার প্রেজেন্টেশনের জন্য সবচেয়ে মানানসই কালার থিম নির্বাচন করুন</p>
                  </div>
                </div>

                <button
                  onClick={() => setThemeModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Filters & Search Bar */}
              <div className="space-y-3 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                  <input
                    type="text"
                    value={themeSearchQuery}
                    onChange={(e) => setThemeSearchQuery(e.target.value)}
                    placeholder="থিমের নাম বা ক্যাটাগরি সার্চ করুন..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-hidden focus:border-purple-500"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {THEME_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveThemeCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                        activeThemeCategory === cat
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                          : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Themes Grid Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-1 flex-1 min-h-0">
                {filteredThemes.map((t) => {
                  const isSelected = t.id === selectedThemeId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedThemeId(t.id);
                        setThemeModalOpen(false);
                        toast.success(`থিম '${t.nameBangla}' অ্যাক্টিভেট করা হয়েছে!`);
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition relative flex flex-col justify-between space-y-3 group cursor-pointer ${
                        isSelected
                          ? "bg-slate-800 border-purple-500 shadow-lg shadow-purple-500/20"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{t.category}</span>
                        {isSelected && (
                          <span className="p-1 rounded-full bg-purple-500 text-white">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-black text-white group-hover:text-purple-300 transition-colors">{t.nameBangla}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{t.name}</div>
                      </div>

                      {/* Color Swatch Indicators */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: `#${t.bgColor}` }} title="Background" />
                          <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: `#${t.accentColor}` }} title="Accent" />
                          <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: `#${t.secondaryAccent}` }} title="Secondary" />
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400">{t.isDark ? "Dark" : "Light"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
                <span>মোট থিম: <strong>{filteredThemes.length}টি</strong></span>
                <button
                  onClick={() => setThemeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition cursor-pointer"
                >
                  সম্পূর্ণ হলো
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN PRESENTATION MODE MODAL */}
      <AnimatePresence>
        {playMode && activeSlide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden ${activeTheme.bgTailwind}`}
            style={{
              backgroundColor: `#${activeTheme.bgColor}`,
              color: `#${activeTheme.textColor}`
            }}
          >
            {/* Top Modal Navbar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-2xl bg-slate-950 border flex items-center justify-center font-black text-xs"
                  style={{ color: `#${activeTheme.accentColor}`, borderColor: `#${activeTheme.accentColor}40` }}
                >
                  PTSC
                </div>
                <div>
                  <h3 className="text-sm font-black" style={{ color: `#${activeTheme.textColor}` }}>{topic}</h3>
                  <p className="text-[11px] font-mono" style={{ color: `#${activeTheme.subTextColor}` }}>
                    Panchagarh Govt. Technical School & College • Slide Presentation Mode
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span 
                  className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-950 border border-slate-800"
                  style={{ color: `#${activeTheme.accentColor}` }}
                >
                  Slide {(activeSlideIndex + 1)} of {slides.length}
                </span>
                <button
                  onClick={() => setPlayMode(false)}
                  className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                  title="বন্ধ করুন (Esc)"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slide Body Content Pane */}
            <div className="max-w-5xl mx-auto w-full my-auto py-8">
              <motion.div
                key={activeSlideIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-widest font-mono" style={{ color: `#${activeTheme.accentColor}` }}>
                    {activeSlide.subtitle}
                  </span>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mt-1" style={{ color: `#${activeTheme.textColor}` }}>
                    {activeSlide.title}
                  </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="space-y-4">
                    {activeSlide.contentPoints.map((pt, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="font-black text-lg leading-none mt-1" style={{ color: `#${activeTheme.accentColor}` }}>✦</span>
                        <p className="text-lg sm:text-xl font-bold leading-relaxed" style={{ color: `#${activeTheme.textColor}` }}>{pt}</p>
                      </div>
                    ))}
                  </div>

                  {activeSlide.imageUrl && (
                    <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl aspect-video">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeSlide.imageUrl}
                        alt={activeSlide.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>

                {activeSlide.takeaway && (
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-sm font-bold" style={{ color: `#${activeTheme.subTextColor}` }}>
                    <span style={{ color: `#${activeTheme.accentColor}` }}>সারসংক্ষেপ:</span> {activeSlide.takeaway}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Bottom Modal Controller Footer */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
              <div className="text-xs font-mono" style={{ color: `#${activeTheme.subTextColor}` }}>
                কীবোর্ড নেভিগেশন: <strong>&rarr;</strong> / <strong>&larr;</strong> বা স্পেসবার প্রেস করুন
              </div>

              <div className="flex items-center gap-3">
                <button
                  disabled={activeSlideIndex === 0}
                  onClick={() => setActiveSlideIndex(prev => prev - 1)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold text-xs disabled:opacity-30 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>পূর্ববর্তী</span>
                </button>
                <button
                  disabled={activeSlideIndex === slides.length - 1}
                  onClick={() => setActiveSlideIndex(prev => prev + 1)}
                  className="px-4 py-2 rounded-xl font-black text-xs disabled:opacity-30 cursor-pointer flex items-center gap-1 shadow-lg"
                  style={{ backgroundColor: `#${activeTheme.accentColor}`, color: activeTheme.isDark ? '#020617' : '#FFFFFF' }}
                >
                  <span>পরবর্তী</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
