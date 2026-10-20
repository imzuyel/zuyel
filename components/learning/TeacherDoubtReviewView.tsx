"use client";

import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  CheckCircle2,
  Clock,
  Send,
  User,
  BookOpen,
  Filter,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Search,
  Trash2,
  Check,
  ChevronDown,
  Layers,
  GraduationCap,
  Lightbulb,
} from "lucide-react";
import {
  getStudentDoubts,
  answerStudentDoubt,
  deleteStudentDoubt,
  resolveStudentDoubt,
  StudentDoubtItem,
} from "@/lib/studentIntelligenceStore";

const QUICK_RESPONSES = [
  "চমৎকার প্রশ্ন! ওহমের সূত্র V = IR অনুযায়ী ভোল্টেজ দ্বিগুণ হলে কারেন্টও সমানুপাতিক হারে দ্বিগুণ হবে।",
  "অসাধারণ পর্যবেক্ষণ! পরবর্তী প্র্যাকটিক্যাল ল্যাব ক্লাসে মাল্টিমিটার দিয়ে এটি সরাসরি প্র্যাকটিস করানো হবে।",
  "ল্যাব ম্যানুয়ালের ৩য় অধ্যায়ের সেফটি গাইডলাইন অনুযায়ী সবসময় ইন্সুলেটেড গ্লাভস পরে টেস্ট করতে হবে।",
  "সঠিক ধারণা! মাদারবোর্ডের সিএমওএস (CMOS) ব্যাটারি ডাউন হলে সিস্টেম ক্লক রিসেট হয়ে যায়।",
];

export default function TeacherDoubtReviewView() {
  const [doubts, setDoubts] = useState<StudentDoubtItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "answered">("all");
  const [selectedTrade, setSelectedTrade] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAnsweringId, setActiveAnsweringId] = useState<string | null>(null);
  const [answerInputText, setAnswerInputText] = useState("");
  const [teacherNameInput, setTeacherNameInput] = useState("প্রকৌ: মো: রফিকুল ইসলাম (চিফ ইন্সট্রাক্টর)");
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const refreshDoubts = () => {
    setDoubts(getStudentDoubts());
  };

  useEffect(() => {
    refreshDoubts();
  }, []);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handlePublishAnswer = (doubtId: string) => {
    if (!answerInputText.trim()) return;
    const updated = answerStudentDoubt(doubtId, answerInputText.trim(), teacherNameInput.trim());
    setDoubts(updated);
    setActiveAnsweringId(null);
    setAnswerInputText("");
    showNotification("উত্তর সফলভাবে প্রকাশিত হয়েছে এবং শিক্ষার্থীর ড্যাশবোর্ডে যুক্ত করা হয়েছে!");
  };

  const handleQuickResolve = (doubtId: string) => {
    const updated = resolveStudentDoubt(doubtId);
    setDoubts(updated);
    showNotification("প্রশ্নটি সমাধানকৃত হিসেবে চিহ্নিত করা হয়েছে।");
  };

  const handleDeleteDoubt = (doubtId: string) => {
    if (confirm("আপনি কি নিশ্চিতভাবে এই প্রশ্নটি অপসারণ করতে চান?")) {
      const updated = deleteStudentDoubt(doubtId);
      setDoubts(updated);
      showNotification("প্রশ্নটি অপসারণ করা হয়েছে।");
    }
  };

  const filteredDoubts = doubts.filter((d) => {
    if (filterStatus === "pending" && d.status !== "pending") return false;
    if (filterStatus === "answered" && d.status !== "answered") return false;
    if (selectedTrade !== "all" && !d.tradeClass.includes(selectedTrade)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchQ = d.question.toLowerCase().includes(q);
      const matchName = d.studentName.toLowerCase().includes(q);
      const matchRoll = d.studentRoll.toLowerCase().includes(q);
      const matchLesson = d.lessonTitle.toLowerCase().includes(q);
      if (!matchQ && !matchName && !matchRoll && !matchLesson) return false;
    }
    return true;
  });

  const pendingCount = doubts.filter((d) => d.status === "pending").length;
  const answeredCount = doubts.filter((d) => d.status === "answered").length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-2.5 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-500/30 shadow-xl space-y-3 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black uppercase tracking-wider">
                TEACHER MODERATION & RESOLUTION
              </span>
              <span className="text-xs text-indigo-300 font-mono">
                PTSC Academic Support
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <HelpCircle className="w-8 h-8 text-cyan-400" />
              <span>শিক্ষার্থী ডাউট ও প্রশ্ন রেজোলিউশন (Student Doubt Management)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              বিভিন্ন পাঠের অধীনে শিক্ষার্থীরা সরাসরি যেসব অ্যাকাডেমিক প্রশ্ন বা ডাউট জমা দিয়েছে, শিক্ষক হিসেবে তা যাচাই করে নির্ভরযোগ্য সমাধান প্রকাশ করুন।
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-black flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span>অপেক্ষমাণ: {pendingCount}</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>সমাধানকৃত: {answeredCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ছাত্রের নাম, রোল, প্রশ্ন বা পাঠের নাম দিয়ে সার্চ করুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Trade Filter Dropdown */}
        <div className="shrink-0 w-full md:w-auto">
          <select
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            className="w-full text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">সব ট্রেড ও শ্রেণি</option>
            <option value="ইলেকট্রিক্যাল">ইলেকট্রিক্যাল</option>
            <option value="কম্পিউটার">কম্পিউটার ও আইওটি</option>
            <option value="অটোমোবাইল">অটোমোবাইল</option>
            <option value="আরএসি">রেফ্রিজারেশন (RAC)</option>
            <option value="সিভিল">সিভিল কনস্ট্রাকশন</option>
          </select>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 w-full md:w-auto">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === "all"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-cyan-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            সবগুলো ({doubts.length})
          </button>
          <button
            onClick={() => setFilterStatus("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === "pending"
                ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            অপেক্ষমাণ ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus("answered")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === "answered"
                ? "bg-emerald-600 text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            সমাধানকৃত ({answeredCount})
          </button>
        </div>
      </div>

      {/* Doubts List */}
      <div className="space-y-4">
        {filteredDoubts.length > 0 ? (
          filteredDoubts.map((d) => (
            <div
              key={d.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-800"
            >
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-cyan-400 font-bold block">
                    {d.tradeClass}
                  </span>
                  <strong className="text-slate-900 dark:text-white font-black text-sm block">
                    পাঠ: {d.lessonTitle}
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                      d.status === "answered"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse"
                    }`}
                  >
                    {d.status === "answered" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>উত্তর প্রকাশিত</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>অপেক্ষমাণ</span>
                      </>
                    )}
                  </span>

                  <button
                    onClick={() => handleDeleteDoubt(d.id)}
                    title="প্রশ্নটি অপসারণ করুন"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Student Question Box */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span>
                    শিক্ষার্থী:{" "}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {d.studentName}
                    </strong>{" "}
                    ({d.studentRoll})
                  </span>
                  <span>•</span>
                  <span>তারিখ: {d.createdAt}</span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                  ❓ {d.question}
                </div>
              </div>

              {/* Answer Box if already answered */}
              {d.status === "answered" && d.answer && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>শিক্ষকের প্রকাশিত সমাধান ({d.answeredBy}):</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{d.answeredAt}</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium pt-1">
                    💡 {d.answer}
                  </p>
                </div>
              )}

              {/* Answer Editor Action */}
              <div>
                {activeAnsweringId === d.id ? (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                        <span>শিক্ষকের উত্তর প্রদান ও প্রকাশনা:</span>
                      </h5>
                    </div>

                    <input
                      type="text"
                      value={teacherNameInput}
                      onChange={(e) => setTeacherNameInput(e.target.value)}
                      placeholder="শিক্ষকের নাম ও পদবি"
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />

                    {/* Quick Response Templates */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        দ্রুত উত্তর টেমপ্লেট নির্বাচন করুন (Quick Templates):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_RESPONSES.map((tmpl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAnswerInputText(tmpl)}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-medium transition-colors text-left truncate max-w-xs cursor-pointer"
                          >
                            ⚡ {tmpl.slice(0, 38)}...
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      required
                      placeholder="শিক্ষার্থীর প্রশ্নের উত্তর স্পষ্ট ও সহজ ভাষায় ব্যাখ্যা করুন..."
                      value={answerInputText}
                      onChange={(e) => setAnswerInputText(e.target.value)}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setActiveAnsweringId(null)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        onClick={() => handlePublishAnswer(d.id)}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>উত্তর প্রকাশ করুন</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveAnsweringId(d.id);
                        setAnswerInputText(d.answer || "");
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{d.status === "answered" ? "উত্তর এডিট করুন" : "উত্তর প্রদান করুন"}</span>
                    </button>

                    {d.status === "pending" && (
                      <button
                        onClick={() => handleQuickResolve(d.id)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>নিষ্পত্তি চিহ্নিত করুন</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
            <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold">কোনো শিক্ষার্থী প্রশ্ন খুঁজে পাওয়া যায়নি</p>
          </div>
        )}
      </div>
    </div>
  );
}
