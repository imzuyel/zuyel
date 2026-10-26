"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Sparkles,
  Radio,
  BookOpen,
  Trophy,
  Layers,
  Users,
  Plus,
  Play,
  FileText,
  Search,
  Filter,
  Trash2,
  Edit3,
  Copy,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Sliders,
  QrCode,
  Download,
  UploadCloud,
  FileCheck,
  Gamepad2,
  Clock,
  Loader2,
  Check,
  Flame,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGlobalAcademic } from "@/context/GlobalAcademicContext";
import { institutionalDb, Quiz, QuestionBankQuestion } from "@/lib/database";
import { ACADEMIC_CLASSES, ALL_TRADES } from "@/lib/academicStructure";
import MentimeterInteractiveAiQuizStudio from "./MentimeterInteractiveAiQuizStudio";
import LiveQuizPortal from "./LiveQuizPortal";
import TournamentDashboard from "./TournamentDashboard";
import QuizEligibilityEngine from "./QuizEligibilityEngine";
import PdfLibraryView from "./PdfLibraryView";
import ManualQuestionCreatorModal from "./ManualQuestionCreatorModal";

export type UnifiedWorkspaceTab = "builder" | "host" | "bank" | "tournaments";

interface UnifiedQuizMentimeterWorkspaceProps {
  initialTab?: UnifiedWorkspaceTab;
  onLiveStateChange?: (isLive: boolean) => void;
  onExitLive?: () => void;
}

export default function UnifiedQuizMentimeterWorkspace({
  initialTab = "builder",
  onLiveStateChange,
  onExitLive,
}: UnifiedQuizMentimeterWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = (searchParams ? searchParams.get("tab") : null) as UnifiedWorkspaceTab | null;

  const [activeTab, setActiveTab] = useState<UnifiedWorkspaceTab>(
    requestedTab || initialTab
  );

  // Sync tab with URL parameter if present
  useEffect(() => {
    if (requestedTab && ["builder", "host", "bank", "tournaments"].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  const { selectedClass, selectedTrade } = useGlobalAcademic();
  const [isPending, startTransition] = useTransition();

  // Student PIN Quick Join Modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [quickPin, setQuickPin] = useState("");
  const [pinError, setPinError] = useState("");

  // Tab 3: Question Bank & PDF State
  const [bankSubTab, setBankSubTab] = useState<"questions" | "pdf_library">("questions");
  const [questionsList, setQuestionsList] = useState<QuestionBankQuestion[]>([]);
  const [bankSearch, setBankSearch] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterTrade, setFilterTrade] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Tab 4: Tournaments & Reports Sub-Tab State
  const [tournamentsSubTab, setTournamentsSubTab] = useState<"tournaments" | "eligibility" | "reports">("tournaments");
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Question Bank Data
  const fetchQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const res = await fetch("/api/question-bank");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.questions) {
          setQuestionsList(data.questions);
        } else {
          setQuestionsList(institutionalDb.questionBankQuestions || []);
        }
      } else {
        setQuestionsList(institutionalDb.questionBankQuestions || []);
      }
    } catch {
      setQuestionsList(institutionalDb.questionBankQuestions || []);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (activeTab === "bank") {
      fetchQuestions();
    }
    if (activeTab === "tournaments" || activeTab === "bank") {
      setAvailableQuizzes(institutionalDb.quizzes || []);
      setAvailableStudents(institutionalDb.students || []);
    }
  }, [activeTab]);

  const handleTabChange = (tab: UnifiedWorkspaceTab) => {
    startTransition(() => {
      setActiveTab(tab);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    });
  };

  const handleQuickJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickPin.trim().replace(/\D/g, "");
    if (!clean || clean.length < 6) {
      setPinError("দয়া করে সঠিক ৬ ডিজিটের পিন কোড প্রদান করুন");
      return;
    }
    router.push(`/quiz/join?pin=${clean}`);
  };

  const filteredQuestions = questionsList.filter((q) => {
    if (filterClass !== "all" && q.classId !== Number(filterClass)) return false;
    if (filterTrade !== "all" && q.tradeId !== Number(filterTrade)) return false;
    if (filterType !== "all" && q.type !== filterType) return false;
    if (bankSearch) {
      const s = bankSearch.toLowerCase();
      const matchText = q.questionText.toLowerCase().includes(s);
      const matchTopic = (q.topic || "").toLowerCase().includes(s);
      return matchText || matchTopic;
    }
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border shadow-2xl flex items-center gap-2 text-xs font-bold ${
              toastMessage.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-600"
                : toastMessage.type === "error"
                ? "bg-rose-950/90 text-rose-200 border-rose-600"
                : "bg-cyan-950/90 text-cyan-200 border-cyan-600"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unified Master Header & Navigation Tabs */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 shrink-0 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/25 shrink-0">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                  🎮 লাইভ কুইজ ও মেন্টিমিটার স্টুডিও
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300">
                  ALL-IN-ONE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                মেন্টিমিটার ওয়ার্মআপ স্লাইডস, কাহুট লাইভ গেম, এআই জেনারেটর ও টুর্নামেন্ট হাব
              </p>
            </div>
          </div>

          {/* Quick Actions & Join Pin Trigger */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-cyan-600/30 cursor-pointer active:scale-95"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>শিক্ষার্থী পিন জয়েন</span>
            </button>
            <button
              onClick={() => handleTabChange("host")}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer active:scale-95"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>সরাসরি হোস্ট এরিনা</span>
            </button>
          </div>
        </div>

        {/* 4 Unified Studio Master Tabs */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1.5 sm:gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1 pt-1 border-t border-slate-800/80">
          {/* Tab 1: Builder */}
          <button
            onClick={() => handleTabChange("builder")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer relative ${
              activeTab === "builder"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/30"
                : "bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>🎨 সেশন ও কুইজ বিল্ডার (Mentimeter + Kahoot)</span>
            {activeTab === "builder" && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping absolute right-2 top-2" />
            )}
          </button>

          {/* Tab 2: Live Host */}
          <button
            onClick={() => handleTabChange("host")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer relative ${
              activeTab === "host"
                ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-red-600/30 border border-rose-400/30"
                : "bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>📡 লাইভ হোস্ট ও লবি কন্ট্রোল (Live Host Center)</span>
            {activeTab === "host" && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute right-2 top-2" />
            )}
          </button>

          {/* Tab 3: Question Bank & PDF */}
          <button
            onClick={() => handleTabChange("bank")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer relative ${
              activeTab === "bank"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30 border border-cyan-400/30"
                : "bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4 text-cyan-300" />
            <span>📚 প্রশ্ন ব্যাংক ও পিডিএফ লাইব্রেরি (Question Bank & PDF Hub)</span>
          </button>

          {/* Tab 4: Tournaments & Reports */}
          <button
            onClick={() => handleTabChange("tournaments")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer relative ${
              activeTab === "tournaments"
                ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-slate-950 shadow-md shadow-amber-600/30 border border-amber-400/30"
                : "bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>🏆 টুর্নামেন্ট ও পারফরম্যান্স অ্যানালিটিক্স</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 overflow-y-auto">
        {/* =========================================================================
            TAB 1: সেশন ও কুইজ বিল্ডার (MENTIMETER + KAHOOT BUILDER)
            ========================================================================= */}
        {activeTab === "builder" && (
          <div className="space-y-6">
            <MentimeterInteractiveAiQuizStudio
              onLiveLaunchSession={() => {
                handleTabChange("host");
              }}
            />
          </div>
        )}

        {/* =========================================================================
            TAB 2: লাইভ হোস্ট ও লবি কন্ট্রোল (LIVE HOST CENTER)
            ========================================================================= */}
        {activeTab === "host" && (
          <div className="space-y-6">
            <LiveQuizPortal
              initialSection="dashboard"
              onLiveStateChange={onLiveStateChange}
              onExitLive={onExitLive}
            />
          </div>
        )}

        {/* =========================================================================
            TAB 3: প্রশ্ন ব্যাংক ও পিডিএফ লাইব্রেরি (QUESTION BANK & PDF HUB)
            ========================================================================= */}
        {activeTab === "bank" && (
          <div className="space-y-6">
            {/* Sub-navigation for Tab 3 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBankSubTab("questions")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    bankSubTab === "questions"
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>প্রশ্ন ব্যাংক রিপোজিটরি ({filteredQuestions.length})</span>
                </button>
                <button
                  onClick={() => setBankSubTab("pdf_library")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    bankSubTab === "pdf_library"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>পিডিএফ কারিকুলাম লাইব্রেরি</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>ম্যানুয়াল প্রশ্ন যোগ করুন</span>
                </button>
                <button
                  onClick={fetchQuestions}
                  disabled={isLoadingQuestions}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
                  title="রিফ্রেশ করুন"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingQuestions ? "animate-spin text-cyan-400" : ""}`} />
                </button>
              </div>
            </div>

            {/* Questions View */}
            {bankSubTab === "questions" && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      placeholder="প্রশ্ন বা বিষয় দিয়ে খুঁজুন..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>

                  {/* Class Filter */}
                  <div>
                    <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                    >
                      <option value="all">সকল শ্রেণি (All Classes)</option>
                      {ACADEMIC_CLASSES.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.displayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Trade Filter */}
                  <div>
                    <select
                      value={filterTrade}
                      onChange={(e) => setFilterTrade(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                    >
                      <option value="all">সকল ট্রেড (All Trades)</option>
                      {ALL_TRADES.map((tr) => (
                        <option key={tr.id} value={tr.id}>
                          {tr.name} ({tr.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Question Type Filter */}
                  <div>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                    >
                      <option value="all">সকল ধরনের প্রশ্ন (All Types)</option>
                      <option value="mcq_single">MCQ — Single Answer</option>
                      <option value="mcq_multiple">MCQ — Multiple Answers</option>
                      <option value="true_false">True / False</option>
                      <option value="matching">Matching Pairs</option>
                      <option value="fill_blank">Fill in Blanks</option>
                      <option value="ordering">Sequence Ordering</option>
                    </select>
                  </div>
                </div>

                {/* Questions Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  {isLoadingQuestions ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                      <span className="text-xs text-slate-400">প্রশ্ন ব্যাংক লোড হচ্ছে...</span>
                    </div>
                  ) : filteredQuestions.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                      <BookOpen className="w-12 h-12 text-slate-700 mx-auto" />
                      <p className="text-sm font-bold text-slate-400">কোনো প্রশ্ন পাওয়া যায়নি</p>
                      <p className="text-xs text-slate-500">
                        নতুন প্রশ্ন যোগ করতে উপরের &ldquo;ম্যানুয়াল প্রশ্ন যোগ করুন&rdquo; বাটনে ক্লিক করুন।
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="py-3 px-4">#</th>
                            <th className="py-3 px-4">প্রশ্ন (Question Text)</th>
                            <th className="py-3 px-4">ধরন (Type)</th>
                            <th className="py-3 px-4">বিষয় ও শ্রেণি</th>
                            <th className="py-3 px-4">কাঠিন্য (Difficulty)</th>
                            <th className="py-3 px-4 text-right">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {filteredQuestions.map((q, idx) => (
                            <tr
                              key={q.id || idx}
                              className="hover:bg-slate-800/40 transition group"
                            >
                              <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                              <td className="py-3 px-4 font-medium text-slate-200 max-w-md">
                                <p className="line-clamp-2">{q.questionText}</p>
                                {q.topic && (
                                  <span className="text-[10px] text-cyan-400 font-normal">
                                    টপিক: {q.topic}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-[10px] font-bold">
                                  {q.type}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-400">
                                <div className="text-[11px] font-bold text-slate-300">
                                  {ACADEMIC_CLASSES.find((c) => c.id === q.classId)?.displayName || "সাধারণ"}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {ALL_TRADES.find((t) => t.id === q.tradeId)?.name || "সকল ট্রেড"}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    q.difficulty === "hard"
                                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                      : q.difficulty === "medium"
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  }`}
                                >
                                  {q.difficulty === "hard" ? "কঠিন" : q.difficulty === "medium" ? "মাঝারি" : "সহজ"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(q.questionText);
                                      showToast("প্রশ্ন টেক্সট কপি করা হয়েছে", "success");
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                                    title="টেক্সট কপি"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PDF Library View */}
            {bankSubTab === "pdf_library" && (
              <PdfLibraryView
                classes={ACADEMIC_CLASSES}
                subjects={[]}
                quizzes={availableQuizzes}
                showToast={showToast}
                onRefreshHistory={() => {}}
              />
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: টুর্নামেন্ট ও পারফরম্যান্স অ্যানালিটিক্স (TOURNAMENTS & REPORTS)
            ========================================================================= */}
        {activeTab === "tournaments" && (
          <div className="space-y-6">
            {/* Sub-navigation for Tab 4 */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl">
              <button
                onClick={() => setTournamentsSubTab("tournaments")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  tournamentsSubTab === "tournaments"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>টুর্নামেন্ট ব্র্যাকেটস ও ম্যাচ সেশন</span>
              </button>
              <button
                onClick={() => setTournamentsSubTab("eligibility")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  tournamentsSubTab === "eligibility"
                    ? "bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/30"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>BTEB উপস্থিতি ও কুইজ যোগ্যতা ইঞ্জিন</span>
              </button>
            </div>

            {tournamentsSubTab === "tournaments" && (
              <TournamentDashboard
                quizzes={availableQuizzes}
                students={availableStudents}
                onStartMatchSession={(sessionId, quizId) => {
                  showToast(`টুর্নামেন্ট ম্যাচ সেশন শুরু হয়েছে: ${sessionId}`, "success");
                  handleTabChange("host");
                }}
              />
            )}

            {tournamentsSubTab === "eligibility" && <QuizEligibilityEngine />}
          </div>
        )}
      </main>

      {/* Manual Question Creator Modal */}
      {showCreateModal && (
        <ManualQuestionCreatorModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          quizzes={availableQuizzes.map((q) => ({ id: q.id, title: q.title }))}
          onQuestionCreated={() => {
            fetchQuestions();
            showToast("প্রশ্ন সফলভাবে যোগ করা হয়েছে!", "success");
          }}
        />
      )}

      {/* Student Quick PIN Join Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => setShowJoinModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 transition cursor-pointer"
              >
                ✕
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
                  <Gamepad2 className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-white">৬-ডিজিট গেম পিন জয়েন</h3>
                <p className="text-xs text-slate-400">
                  শিক্ষকের স্ক্রিনে প্রদর্শিত লাইভ রুম পিন দিয়ে সরাসরি জয়েন করুন।
                </p>
              </div>

              <form onSubmit={handleQuickJoinSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    maxLength={6}
                    value={quickPin}
                    onChange={(e) => {
                      setQuickPin(e.target.value.replace(/\D/g, ""));
                      setPinError("");
                    }}
                    placeholder="৬ ডিজিটের পিন (যেমন: ৯২১৪০৮)"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border-2 border-cyan-500/40 focus:border-cyan-400 text-center font-mono text-2xl font-black tracking-widest text-cyan-300 placeholder:text-slate-600 focus:outline-none transition"
                  />
                  {pinError && (
                    <p className="text-rose-400 text-xs font-semibold mt-1.5 text-center">
                      {pinError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm uppercase tracking-wider transition transform active:scale-98 shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>কুইজে প্রবেশ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
