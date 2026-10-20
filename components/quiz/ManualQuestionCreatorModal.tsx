"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Layers,
  HelpCircle,
  Clock,
  Award,
  BookOpen,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Save,
  FileQuestion,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ManualQuestionCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizzes?: Array<{ id: string; title: string }>;
  activeQuizId?: string;
  onQuestionCreated?: (newQuestion: any) => void;
}

export default function ManualQuestionCreatorModal({
  isOpen,
  onClose,
  quizzes = [],
  activeQuizId,
  onQuestionCreated,
}: ManualQuestionCreatorModalProps) {
  // Form State
  const [questionType, setQuestionType] = useState<
    "mcq_single" | "mcq_multiple" | "true_false" | "matching" | "fill_blank" | "ordering" | "short_answer"
  >("mcq_single");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>([
    "অপশন ক (Option A)",
    "অপশন খ (Option B)",
    "অপশন গ (Option C)",
    "অপশন ঘ (Option D)",
  ]);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [correctIndices, setCorrectIndices] = useState<number[]>([0]);
  const [tfCorrect, setTfCorrect] = useState<boolean>(true);
  const [shortExpectedKeyword, setShortExpectedKeyword] = useState("");
  const [pairs, setPairs] = useState<{ left: string; right: string }[]>([
    { left: "বাম পাশ ১", right: "ডান পাশ ১" },
    { left: "বাম পাশ ২", right: "ডান পাশ ২" },
    { left: "বাম পাশ ৩", right: "ডান পাশ ৩" },
  ]);
  const [acceptedAnswers, setAcceptedAnswers] = useState<string[]>(["সঠিক উত্তর"]);
  const [orderItems, setOrderItems] = useState<string[]>(["ধাপ ১: প্রস্তুতি", "ধাপ ২: সংযোগ", "ধাপ ৩: পরীক্ষা"]);

  const [marks, setMarks] = useState<number>(2);
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [classId, setClassId] = useState<number>(4); // Class 9 Default
  const [subjectId, setSubjectId] = useState<number>(1);
  const [explanation, setExplanation] = useState("");

  // Destination Options
  const [saveToQuestionBank, setSaveToQuestionBank] = useState(true);
  const [targetQuizId, setTargetQuizId] = useState<string>(activeQuizId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  if (!isOpen) return null;

  const handleOptionChange = (idx: number, text: string) => {
    const updated = [...options];
    updated[idx] = text;
    setOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, `নতুন অপশন ${options.length + 1}`]);
    }
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);
    if (correctIndex >= updated.length) {
      setCorrectIndex(0);
    }
    setCorrectIndices(correctIndices.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setFeedback({ message: "প্রশ্নের মূল বিবরণ (Question Text) প্রদান করুন।", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      // Build questionData based on questionType
      let questionData: any = { marks, timeLimit };
      if (questionType === "mcq_single") {
        questionData.options = options.map((opt) => opt.trim());
        questionData.correctIndex = correctIndex;
      } else if (questionType === "mcq_multiple") {
        questionData.options = options.map((opt) => opt.trim());
        questionData.correctIndices = correctIndices;
      } else if (questionType === "true_false") {
        questionData.options = ["সত্য (True)", "মিথ্যা (False)"];
        questionData.correctAnswer = tfCorrect;
        questionData.correctIndex = tfCorrect ? 0 : 1;
      } else if (questionType === "matching") {
        questionData.pairs = pairs.map((p) => ({ left: p.left.trim(), right: p.right.trim() }));
      } else if (questionType === "fill_blank") {
        questionData.acceptedAnswers = acceptedAnswers.map((a) => a.trim());
      } else if (questionType === "ordering") {
        questionData.items = orderItems.map((i) => i.trim());
      } else if (questionType === "short_answer") {
        questionData.expectedAnswerKeyword = shortExpectedKeyword.trim() || "সঠিক উত্তর";
        questionData.options = [shortExpectedKeyword.trim() || "সঠিক উত্তর"];
        questionData.correctIndex = 0;
      }

      let createdBankQuestion: any = null;

      // 1. Save to Central Question Bank if requested
      if (saveToQuestionBank) {
        const qbRes = await fetch("/api/question-bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: questionType,
            questionText: questionText.trim(),
            questionData,
            classId,
            subjectId,
            difficulty,
            explanation: explanation.trim(),
            marks,
            timeLimit,
            createdBy: 1,
          }),
        });
        const qbData = await qbRes.json();
        if (qbData.success) {
          createdBankQuestion = qbData.question;
        }
      }

      // 2. Attach directly to specific Quiz if chosen
      if (targetQuizId && targetQuizId.trim()) {
        await fetch(`/api/quizzes/${targetQuizId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: questionType,
            questionText: questionText.trim(),
            questionData,
            explanation: explanation.trim(),
            marks,
            timeLimit,
            saveToQuestionBank: false,
          }),
        });
      }

      setFeedback({
        message: "প্রশ্নটি সফলভাবে তৈরি ও সংরক্ষণ করা হয়েছে!",
        type: "success",
      });

      if (onQuestionCreated) {
        onQuestionCreated(createdBankQuestion || {
          questionText,
          questionData,
          type: questionType,
          marks,
          timeLimit,
          explanation,
        });
      }

      // Reset form after short delay
      setTimeout(() => {
        setQuestionText("");
        setExplanation("");
        setShortExpectedKeyword("");
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Error creating custom question:", err);
      setFeedback({ message: "প্রশ্ন তৈরি করতে ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                ম্যানুয়াল প্রশ্ন ক্রিয়েটর (Custom MCQ Authoring)
              </h2>
              <p className="text-xs text-slate-400">
                শিক্ষকদের নিজস্ব বহুনির্বাচনী প্রশ্ন, নম্বর ও সময়সীমা নির্ধারণ করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold border ${
                feedback.type === "success"
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-950/40 border-rose-500/40 text-rose-300"
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

          {/* Question Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>প্রশ্নের ধরন (Question Format)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "mcq_single", label: "🔘 একক MCQ", desc: "১টি সঠিক উত্তর" },
                { id: "mcq_multiple", label: "☑️ বহু MCQ", desc: "একাধিক সঠিক উত্তর" },
                { id: "true_false", label: "⚖️ সত্য / মিথ্যা", desc: "True/False" },
                { id: "matching", label: "🔗 ডান-বাম মিলকরণ", desc: "জোড়া মিলকরণ" },
                { id: "fill_blank", label: "📝 শূন্যস্থান পূরণ", desc: "Fill in Blanks" },
                { id: "ordering", label: "🔢 ধারাবাহিক ক্রম", desc: "Ordering" },
                { id: "short_answer", label: "✍️ সংক্ষিপ্ত উত্তর", desc: "Short Answer" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setQuestionType(t.id as any)}
                  className={`p-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                    questionType === t.id
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  <div>{t.label}</div>
                  <div className="text-[10px] opacity-70 font-normal">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>প্রশ্নের বিবরণ (Question Text) *</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">বাংলা ও ইংরেজি উভয়ই গ্রহণযোগ্য</span>
            </label>
            <textarea
              required
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="যেমন: ওহমের সূত্রানুসারে ভোল্টেজ, কারেন্ট ও রোধের মধ্যে সঠিক সম্পর্ক কোনটি?"
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Options Section for MCQ Single / Multi */}
          {(questionType === "mcq_single" || questionType === "mcq_multiple") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>উত্তর বিকল্পসমূহ (Options) — সঠিক উত্তরে টিক দিন</span>
                </label>
                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> অপশন যোগ করুন
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => {
                  const isCorrect =
                    questionType === "mcq_single"
                      ? correctIndex === idx
                      : correctIndices.includes(idx);

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                        isCorrect
                          ? "bg-emerald-950/30 border-emerald-500/50"
                          : "bg-slate-800/60 border-slate-700/80"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (questionType === "mcq_single") {
                            setCorrectIndex(idx);
                          } else {
                            if (correctIndices.includes(idx)) {
                              if (correctIndices.length > 1) {
                                setCorrectIndices(correctIndices.filter((i) => i !== idx));
                              }
                            } else {
                              setCorrectIndices([...correctIndices, idx]);
                            }
                          }
                        }}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition cursor-pointer ${
                          isCorrect
                            ? "bg-emerald-500 text-slate-950 shadow-xs shadow-emerald-500/40"
                            : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                        }`}
                        title="সঠিক উত্তর হিসেবে চিহ্নিত করুন"
                      >
                        {isCorrect ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : String.fromCharCode(65 + idx)}
                      </button>

                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`অপশন ${String.fromCharCode(65 + idx)} এর টেক্সট`}
                        className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                      />

                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-400 rounded-lg transition"
                          title="অপশন মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* True / False Toggle */}
          {questionType === "true_false" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">সঠিক উত্তর নির্বাচন করুন</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTfCorrect(true)}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    tfCorrect
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  <Check className="w-4 h-4" /> সত্য (True)
                </button>
                <button
                  type="button"
                  onClick={() => setTfCorrect(false)}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    !tfCorrect
                      ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  <X className="w-4 h-4" /> মিথ্যা (False)
                </button>
              </div>
            </div>
          )}

          {/* Short Answer Input */}
          {questionType === "short_answer" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">আদর্শ উত্তর / কীওয়ার্ড (Expected Keyword)</label>
              <input
                type="text"
                value={shortExpectedKeyword}
                onChange={(e) => setShortExpectedKeyword(e.target.value)}
                placeholder="যেমন: V = IR অথবা ওহম"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Matching Pairs Input (ডান পাশ - বাম পাশ) */}
          {questionType === "matching" && (
            <div className="space-y-2 p-3.5 bg-slate-800/80 rounded-2xl border border-amber-500/30">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-amber-300">🔗 বাম পাশ ↔ ডান পাশ মিলকরণ জোড়াসমূহ:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (pairs.length < 6) {
                      setPairs([...pairs, { left: `বাম পাশ ${pairs.length + 1}`, right: `ডান পাশ ${pairs.length + 1}` }]);
                    }
                  }}
                  disabled={pairs.length >= 6}
                  className="text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ জোড়া যোগ ({pairs.length}/6)</span>
                </button>
              </div>
              <div className="space-y-2">
                {pairs.map((p, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {pIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={p.left}
                      onChange={(e) => {
                        const next = [...pairs];
                        next[pIdx] = { ...next[pIdx], left: e.target.value };
                        setPairs(next);
                      }}
                      placeholder={`বাম পাশ ${pIdx + 1}`}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                    <span className="text-amber-400 font-bold">↔</span>
                    <input
                      type="text"
                      value={p.right}
                      onChange={(e) => {
                        const next = [...pairs];
                        next[pIdx] = { ...next[pIdx], right: e.target.value };
                        setPairs(next);
                      }}
                      placeholder={`ডান পাশ ${pIdx + 1}`}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                    {pairs.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPairs(pairs.filter((_, idx) => idx !== pIdx))}
                        className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fill in the Blank Input */}
          {questionType === "fill_blank" && (
            <div className="space-y-2.5 p-3.5 bg-slate-800/80 rounded-2xl border border-cyan-500/30">
              <label className="text-xs font-bold text-cyan-300 block">
                📝 শূন্যস্থান পূরণ (Fill Blank) — গ্রহণযোগ্য সঠিক উত্তরসমূহ:
              </label>
              <div className="flex flex-wrap gap-2">
                {acceptedAnswers.map((ans, aIdx) => (
                  <span
                    key={aIdx}
                    className="px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>{ans}</span>
                    {acceptedAnswers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setAcceptedAnswers(acceptedAnswers.filter((_, idx) => idx !== aIdx))}
                        className="hover:text-rose-400 cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="বিকল্প উত্তর লিখে Enter চাপুন..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim();
                    if (val && !acceptedAnswers.includes(val)) {
                      setAcceptedAnswers([...acceptedAnswers, val]);
                      e.currentTarget.value = "";
                    }
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
          )}

          {/* Ordering Sequence Input */}
          {questionType === "ordering" && (
            <div className="space-y-2.5 p-3.5 bg-slate-800/80 rounded-2xl border border-purple-500/30">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-purple-300">🔢 সঠিক ক্রমানুসারে সাজানো ধাপসমূহ (Ordering):</span>
                <button
                  type="button"
                  onClick={() => {
                    if (orderItems.length < 6) {
                      setOrderItems([...orderItems, `ধাপ ${orderItems.length + 1}`]);
                    }
                  }}
                  disabled={orderItems.length >= 6}
                  className="text-purple-400 hover:text-purple-300 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ ধাপ যোগ</span>
                </button>
              </div>
              <div className="space-y-1.5">
                {orderItems.map((item, itIdx) => (
                  <div key={itIdx} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {itIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const next = [...orderItems];
                        next[itIdx] = e.target.value;
                        setOrderItems(next);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                    {orderItems.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setOrderItems(orderItems.filter((_, idx) => idx !== itIdx))}
                        className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Marks, Time Limit & Difficulty Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
            {/* Marks */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>নম্বর (Marks)</span>
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 5].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMarks(m)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      marks === m
                        ? "bg-amber-600 text-white border-amber-500"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    {m}
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value) || 1)}
                  className="w-14 bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Time Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>সময়সীমা (সেকেন্ড)</span>
              </label>
              <div className="flex items-center gap-1.5">
                {[20, 30, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setTimeLimit(sec)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      timeLimit === sec
                        ? "bg-cyan-600 text-white border-cyan-500"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value) || 30)}
                  className="w-14 bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>কাঠিন্য স্তর (Difficulty)</span>
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white focus:outline-none"
              >
                <option value="easy">সহজ (Easy)</option>
                <option value="medium">মধ্যম (Medium)</option>
                <option value="hard">কঠিন (Hard)</option>
              </select>
            </div>
          </div>

          {/* Academic Class & Explanation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                <span>শ্রেণি / শিক্ষাবর্ষ</span>
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none"
              >
                <option value={1}>Class 6 (Pre-Vocational)</option>
                <option value={2}>Class 7 (Pre-Vocational)</option>
                <option value={3}>Class 8 (Pre-Vocational)</option>
                <option value={4}>Class 9 (SSC Vocational)</option>
                <option value={5}>Class 10 (SSC Vocational)</option>
                <option value={6}>Class 11 (HSC Vocational)</option>
                <option value={7}>Class 12 (HSC Vocational)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>বিষয় ক্যাটাগরি</span>
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none"
              >
                <option value={1}>কারিগরি ট্রেড / পদার্থবিজ্ঞান (Technical & Physics)</option>
                <option value={2}>কম্পিউটার অ্যাপ্লিকেশন ও আইসিটি (ICT & IoT)</option>
                <option value={3}>সিভিল ও ওয়ার্কশপ প্র্যাকটিস (Civil & Workshop)</option>
              </select>
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              💡 সমাধান / প্রাঞ্জল ব্যাখ্যা (Explanation for Review)
            </label>
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="শিক্ষার্থীরা কুইজ শেষে সঠিক উত্তরের কারণ জানার জন্য সংক্ষিপ্ত বিবরণ দিন..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Destination Selector */}
          <div className="pt-3 border-t border-slate-800 space-y-3 bg-slate-950/40 p-3.5 rounded-2xl border">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
              সংরক্ষণের গন্তব্য (Save Destination)
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToQuestionBank}
                  onChange={(e) => setSaveToQuestionBank(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500"
                />
                <span>সেন্ট্রাল প্রশ্ন ব্যাংকে যুক্ত করুন (Add to Central Question Bank)</span>
              </label>

              {quizzes.length > 0 && (
                <div className="pt-1 space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 block">
                    নির্দিষ্ট কুইজে সরাসরি যুক্ত করুন (ঐচ্ছিক):
                  </label>
                  <select
                    value={targetQuizId}
                    onChange={(e) => setTargetQuizId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="">কোনো নির্দিষ্ট কুইজ নয় (কেবল প্রশ্ন ব্যাংকে)</option>
                    {quizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        📌 {q.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-black shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "সংরক্ষণ হচ্ছে..." : "প্রশ্ন সংরক্ষণ করুন"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
