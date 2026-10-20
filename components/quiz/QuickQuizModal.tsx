"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  BookOpen,
  Award,
  Layers,
  CheckCircle2,
  Trash2,
  Send,
  Loader2,
  Edit3,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QuickQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuestionInput {
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function QuickQuizModal({ isOpen, onClose }: QuickQuizModalProps) {
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState(9);
  const [subjectName, setSubjectName] = useState("IT Support & IoT");
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<QuestionInput[]>(
    Array(5).fill(null).map(() => ({
      questionText: "",
      options: ["", "", "", ""],
      correctIndex: 0,
      explanation: "",
    }))
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch active quiz on load
  useEffect(() => {
    if (isOpen) {
      fetchActiveQuiz();
    }
  }, [isOpen]);

  const fetchActiveQuiz = async () => {
    try {
      const res = await fetch("/api/quick-quiz");
      const data = await res.json();
      if (data.success && data.active && data.quiz) {
        setActiveQuiz(data.quiz);
        setTitle(data.quiz.title);
        setClassId(data.quiz.classId);
        setSubjectName(data.quiz.subjectName);
        setQuestions(data.quiz.questions);
      } else {
        setActiveQuiz(null);
        resetForm();
      }
    } catch (e) {
      console.error("Error loading active quick quiz:", e);
    }
  };

  const resetForm = () => {
    setTitle("দ্রুত যাচাই কুইজ");
    setTopic("");
    setQuestions(
      Array(5).fill(null).map((_, i) => ({
        questionText: "",
        options: ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
        correctIndex: 0,
        explanation: "",
      }))
    );
  };

  // Generate 5 questions via Gemini AI
  const handleAiGenerate = async () => {
    if (!topic.trim()) {
      setMessage({ type: "error", text: "দয়া করে একটি টপিক বা সংকেত লিখুন (যেমন: ওহমের সূত্র বা কম্পিউটার ভাইরাস)" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/quick-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          classId,
          subjectName,
          topic,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        const formatted = data.questions.map((q: any) => ({
          questionText: q.questionText || "",
          options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["ক", "খ", "গ", "ঘ"],
          correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
          explanation: q.explanation || "",
        }));

        setQuestions(formatted);
        setTitle(`${subjectName} - ${topic} দ্রুত কুইজ`);
        setMessage({ type: "success", text: "এআই দ্বারা ৫টি বহুসংক্ষিপ্ত প্রশ্ন সফলভাবে তৈরি হয়েছে! নিচে দেখে পরিবর্তন করতে পারেন।" });
      } else {
        setMessage({ type: "error", text: data.message || "এআই জেনারেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "সার্ভার সংযোগ সমস্যা। আবার চেষ্টা করুন।" });
    } finally {
      setLoading(false);
    }
  };

  // Handle manual question edits
  const handleQuestionTextChange = (qIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].questionText = val;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx: number, oIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = val;
    setQuestions(updated);
  };

  const handleCorrectIndexChange = (qIdx: number, val: number) => {
    const updated = [...questions];
    updated[qIdx].correctIndex = val;
    setQuestions(updated);
  };

  const handleExplanationChange = (qIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].explanation = val;
    setQuestions(updated);
  };

  // Publish Quick Quiz
  const handlePublish = async () => {
    // Basic validation
    if (!title.trim()) {
      setMessage({ type: "error", text: "দয়া করে কুইজের একটি আকর্ষণীয় শিরোনাম লিখুন।" });
      return;
    }

    const hasEmptyQuestion = questions.some(
      (q) => !q.questionText.trim() || q.options.some((o) => !o.trim())
    );

    if (hasEmptyQuestion) {
      setMessage({ type: "error", text: "দয়া করে ৫টি প্রশ্নের সবগুলো প্রশ্ন ও অপশনগুলো পূরণ করুন।" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/quick-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          title,
          classId,
          subjectName,
          questions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message || "কুইজটি সফলভাবে সক্রিয় করা হয়েছে!" });
        setActiveQuiz(data.quiz);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.message || "কুইজ প্রকাশে সমস্যা হয়েছে।" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "সার্ভারে ডাটা পাঠাতে ব্যর্থ হয়েছে।" });
    } finally {
      setSaving(false);
    }
  };

  // Clear/Unpublish active quick quiz
  const handleClear = async () => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই সক্রিয় পপ-আপ কুইজটি বন্ধ করে দিতে চান?")) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/quick-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveQuiz(null);
        resetForm();
        setMessage({ type: "success", text: "সক্রিয় পপ-আপ কুইজটি সফলভাবে সরানো হয়েছে।" });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white px-6 py-4.5 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-pink-200" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base">পপ-আপ কুইক কুইজ স্টুডিও</h3>
                <p className="text-[10px] sm:text-xs text-pink-100">
                  শিক্ষার্থীদের ড্যাশবোর্ডে ৫ প্রশ্নের তাৎক্ষণিক কুইজ পপ-আপ প্রেরণ করুন
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Status Indicator */}
            {activeQuiz ? (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-700 dark:text-indigo-300 font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                  <span>বর্তমানে ক্লাস {activeQuiz.classId} এর জন্য কুইজটি সক্রিয় আছে: <strong>&ldquo;{activeQuiz.title}&rdquo;</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>কুইজ নিষ্ক্রিয় করুন</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 text-xs font-bold">
                ⚠️ বর্তমানে কোনো পপ-আপ কুইজ সক্রিয় নেই। নতুন কুইজ প্রকাশ করলে শিক্ষার্থীরা ওয়েবসাইট লগইন করলেই এটি দেখতে পাবে।
              </div>
            )}

            {/* Notification messages */}
            {message && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  message.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* Settings Card */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4">
              <div className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                ১. কুইজের প্রাথমিক সেটিংস ও এআই জেনারেটর
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Title */}
                <div className="space-y-1.5 col-span-1 md:col-span-3">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">কুইজ শিরোনাম (Quiz Title)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="যেমন: ইলেকট্রনিক্স মাল্টিমিটার কুইজ"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:border-pink-500"
                  />
                </div>

                {/* Class */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">শ্রেণি নির্বাচন (Target Class)</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value={6}>৬ষ্ঠ শ্রেণি (Class 6)</option>
                    <option value={7}>৭ম শ্রেণি (Class 7)</option>
                    <option value={8}>৮ম শ্রেণি (Class 8)</option>
                    <option value={9}>৯ম শ্রেণি (Class 9)</option>
                    <option value={10}>১০ম শ্রেণি (Class 10)</option>
                    <option value={11}>১১শ শ্রেণি (Class 11)</option>
                    <option value={12}>১২শ শ্রেণি (Class 12)</option>
                  </select>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">বিষয় (Subject)</label>
                  <select
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="IT Support & IoT">IT Support & IoT</option>
                    <option value="General Electronics">General Electronics</option>
                    <option value="General Electrical Works">General Electrical Works</option>
                    <option value="Apparel Manufacturing Basics">Apparel Manufacturing Basics</option>
                    <option value="Physics Fundamentals">Physics Fundamentals</option>
                    <option value="Basic Mathematics">Basic Mathematics</option>
                    <option value="English Grammar & Speaking">English Grammar & Speaking</option>
                  </select>
                </div>

                {/* Topic / Prompt */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">কুইজ টপিক (AI Topic / Prompt)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="যেমন: ওহমের সূত্র বা লজিক গেট"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:border-pink-500"
                    />
                    <button
                      type="button"
                      onClick={handleAiGenerate}
                      disabled={loading}
                      className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-pink-500/20 disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      )}
                      <span>এআই কুইজ তৈরি</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Editor Container */}
            <div className="space-y-4">
              <div className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                ২. কুইজ প্রশ্নাবলি এডিটর (৫টি এমসিকিউ প্রশ্ন)
              </div>

              <div className="space-y-5">
                {questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 relative"
                  >
                    <div className="absolute top-4 right-4 text-xs font-mono font-black text-slate-300 dark:text-slate-700">
                      Q{(qIdx + 1).toString().padStart(2, "0")}
                    </div>

                    {/* Question Text */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                        প্রশ্ন {qIdx + 1} এর টেক্সট
                      </label>
                      <input
                        type="text"
                        value={q.questionText}
                        onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                        placeholder={`যেমন: ওহমের সূত্রের গাণিতিক রূপ কোনটি?`}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none"
                      />
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <span className={`text-[10px] w-6 h-6 rounded-lg font-black flex items-center justify-center border ${
                            q.correctIndex === oIdx
                              ? "bg-emerald-500 border-emerald-400 text-white"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                            placeholder={`অপশন ${String.fromCharCode(65 + oIdx)}`}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Correct Index & Explanation */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Select correct index */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                          সঠিক উত্তর নির্বাচন
                        </label>
                        <select
                          value={q.correctIndex}
                          onChange={(e) => handleCorrectIndexChange(qIdx, Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none"
                        >
                          <option value={0}>অপশন A (ক)</option>
                          <option value={1}>অপশন B (খ)</option>
                          <option value={2}>অপশন C (গ)</option>
                          <option value={3}>অপশন D (ঘ)</option>
                        </select>
                      </div>

                      {/* Explanation */}
                      <div className="space-y-1.5 col-span-1 sm:col-span-2">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                          উত্তর ব্যাখ্যা ও সংকেত
                        </label>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                          placeholder="সঠিক উত্তরের কারণ বা ইঙ্গিত লিখুন (ঐচ্ছিক)"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              ফর্ম সাফ করুন (Reset)
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/25 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>কুইজ প্রকাশ করুন (Publish Popup)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
